/*
 * 模块一：时间戳插入器（含扩展：时间文本转换）
 *
 * 基础能力：在光标处插入当前时间戳，入口有左侧栏图标、侧边栏面板、
 *           命令面板、斜杠命令四个，配置走 settings.timestamp。
 *
 * 扩展能力：选中笔记里已有的时间文本，转成别的时间表达
 *           （相对时间、星期、日记链接、Unix 时间戳、农历、节气等）。
 *           转换项清单在 settings.js 的 ACTION_DEFS，开关由用户逐项控制。
 *
 * 农历算法（LUNAR_INFO 及配套函数）内联在本文件，属时间处理的一部分：
 * 1900–2100 查表 + 天文黄经算节气，纯计算、无持久化、无外部依赖。
 *
 * 设计红线：扩展部分**不产生任何持久化数据**，只做「读选区 → 算结果 → 替换选区」。
 */

const obsidian = require('obsidian');
const { t: i18nT } = require('./i18n.js');
const { DEFAULT_SETTINGS, ACTION_DEFS, isLunarKey } = require('./settings.js');
const { actionText, judgeText, presetText, daypartText, miscText } = require('./i18n.js');
/*
 * 时段表与「没有共识」的口径（周末算周几、下周一指哪天…）都在这个文件里，
 * 解析层只管用，不自己再定义一份，避免两处口径打架。
 */
const judge = require('./timejudge.js');
const {
  TIME_OF_DAY,
  DAYPART_KEYS,
  defaultDaypartHours,
  cleanDaypartHours,
  readJudgement,
} = judge;

const VIEW_TYPE = 'time-tools-timestamp-view';

/** 内置预设格式，面板与设置页共用 */
const PRESETS = [
  { label: '日期 + 时分秒（默认）', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '日期 + 时分', value: 'YYYY-MM-DD HH:mm' },
  { label: '仅时分秒', value: 'HH:mm:ss' },
  { label: '仅时分', value: 'HH:mm' },
  { label: '中文日期 + 时分', value: 'YYYY年M月D日 HH:mm' },
  { label: '斜杠日期 + 时分秒', value: 'YYYY/MM/DD HH:mm:ss' },
  { label: '带星期', value: 'YYYY-MM-DD ddd HH:mm' },
  { label: 'ISO 8601', value: 'YYYY-MM-DDTHH:mm:ssZ' },
];

/* ------------------------------------------------------------------ *
 * 固定数据表
 * ------------------------------------------------------------------ */

/**
 * 1900–2100 农历年信息表，索引 = 年份 - 1900。
 * 位布局（从高位到低位）：
 *   第 17–20 位：1 表示闰月 30 天，0 表示 29 天
 *   第 5–16 位 ：12 个月的大小月，1 = 30 天，0 = 29 天
 *   第 1–4 位  ：闰哪个月，0 表示当年无闰月
 */
/*
 * 农历算法已拆到 ./lunar.js（纯计算，零依赖）。
 * 这里用解构把裸函数名恢复成本地标识符 ——
 * 下方解析层几千行调用 solarToLunar / parseLunar / cnDay ... 一行都不用改。
 */
const {
  lunar,
  MIN_YEAR, MAX_YEAR, CN_NUM, LUNAR_INFO, SOLAR_TERMS, GAN, ZHI,
  leapMonth, leapDays, monthDays, yearDays,
  solarToLunar, lunarToSolar, parseLunar, cnYear, currentLunarYear,
  cnDay, cnMonth, formatLunar, ganZhi, zodiac, solarTerm, termDay,
  buildYearOffsets, yearOffset, msToJde, jdeToDate, sunLongitude,
  DAY_MAP, MONTH_MAP, matchFrom,
  parseCnMonth, parseArabicMonth, parseArabicDay, parseCnDay,
} = require('./lunar.js');

/**
 * 解析**阳历**的中文大写月日：五月十六日 → 5 月 16 日。
 *
 * 为什么必须有它：默认规则下「五月十六日」按阳历处理（带「日」后缀），
 * 但大写中文根本没法走原有的阳历解析（只认阿拉伯数字），
 * 结果就是**两边都不认、整条识别不出来** —— 实测确认。
 * 「5月16日」能转而「五月十六日」不能，就是缺这个。
 * 只在**不按农历处理**时才用；按农历时交给 lunar.parseLunar。
 */
function parseCnSolarDate(text, nowYear) {
  const raw = String(text ?? '').replace(/^\s+|\s+$/g, '');
  const m = CN_MD_RE.exec(raw);
  if (!m) return null;
  const month = parseCnMonth(m[0]);
  if (!month) return null;
  const dayPart = m[0].slice(month.len);
  const day = matchFrom(dayPart.replace(/[日号]$/, ''), DAY_MAP);
  if (!day) return null;
  const year = nowYear || new Date().getFullYear();
  return safeDate(year, month.value, day.value);
}

/*
 * 明确的历法标记：农历 / 阴历 / 阳历 / 公历。
 * 带这种标记的日期**意图是明确的**——用户已经说清楚了是哪套历法，
 * 不该再靠「中文大写还是阿拉伯数字」去猜。
 */
const LUNAR_MARK = ['农历', '阴历', '旧历', '夏历'];
const SOLAR_MARK = ['阳历', '公历', '新历', '西历'];
const ALL_MARK = LUNAR_MARK.concat(SOLAR_MARK);

/**
 * 剥出历法标记，返回 { mark: 'lunar'|'solar'|null, rest, atTail }。
 *
 * 默认只认**前缀**；标记在尾部（`2026年八月初九 农历`）需要
 * lunarMarkAnywhere 开关开启才认 —— 否则「八月十九 农历」
 * 这类写法会跟普通句子混淆。
 */
function stripCalendarMark(text, settings) {
  const raw = String(text ?? '').trim();
  const ext = extOf(settings);
  const anywhere = !!(ext && ext.lunarMarkAnywhere === true);

  // 前缀
  for (const w of LUNAR_MARK) {
    if (raw.startsWith(w)) return { mark: 'lunar', rest: raw.slice(w.length).trim(), atTail: false };
  }
  for (const w of SOLAR_MARK) {
    if (raw.startsWith(w)) return { mark: 'solar', rest: raw.slice(w.length).trim(), atTail: false };
  }

  // 尾部（需开关）
  if (anywhere) {
    for (const w of LUNAR_MARK) {
      if (raw.endsWith(w)) return { mark: 'lunar', rest: raw.slice(0, -w.length).trim(), atTail: true };
    }
    for (const w of SOLAR_MARK) {
      if (raw.endsWith(w)) return { mark: 'solar', rest: raw.slice(0, -w.length).trim(), atTail: true };
    }
  }
  return { mark: null, rest: raw, atTail: false };
}

/** 文本是否含明确的历法标记（任意位置） */
function containsCalendarMark(text) {
  const raw = String(text ?? '');
  return ALL_MARK.some((w) => raw.indexOf(w) >= 0);
}

/** 文本是否以历法标记开头 */
/** 文本是否为「带号」写法：5月16号 / 五月十六号 */
function hasHaoSuffix(text) {
  return /[号日]\s*$/.test(String(text ?? '').trim());
}

/*
 * 中文大写的「月 + 日」，捕获末尾后缀。
 * 后缀决定了在默认（关）状态下算不算农历：
 *   五月十六   → 无后缀   → 农历
 *   五月十六号 → 后缀「号」 → 农历
 *   五月十六日 → 后缀「日」 → 默认算阳历（开启大写即农历后才算农历）
 */
const CN_MD_RE = new RegExp(
  '[正一二三四五六七八九十冬腊]月' +
  '[初十廿三一二三四五六七八九十]+' +
  '(号|日)?$'
);

/** 取中文大写月日写法的末尾后缀；不是该写法返回 null */
function cnMonthDaySuffix(text) {
  const s = String(text ?? '').replace(/^农历/, '').replace(/\s+/g, '');
  const m = CN_MD_RE.exec(s);
  return m ? (m[1] || '') : null;
}

/**
 * 判断一段月日文本是否应默认为农历。
 *
 * 默认规则（未开开关）：
 *   中文大写（五月十六号）→ 农历
 *   阿拉伯数字（5月16号）→ 阳历
 * 开启 lunarOnHao 后：只要带「号 / 日」后缀，一律按农历处理。
 */
function shouldTreatAsLunar(text, settings) {
  const raw = String(text ?? '');
  /*
   * 明确的历法标记**优先级最高**：用户已经写清了「农历 / 阳历」，
   * 就别再用「大写还是阿拉伯」去猜了。
   */
  const mk = stripCalendarMark(raw, settings);
  if (mk.mark === 'lunar') return true;
  if (mk.mark === 'solar') return false;

  /*
   * 文本里**有**标记但位置不被允许（如标记在尾部而开关关闭）→ 不转换。
   * 不拦的话「2026年八月初九 农历」会被当无标记的大写月日转掉，
   * 等于绕过了这个开关（实测过）。
   */
  if (containsCalendarMark(raw)) return false;

  const ext = extOf(settings);
  const lunarOnHao = !!(ext && ext.lunarOnHao === true);
  const lunarOnCnUpper = !!(ext && ext.lunarOnCnUpper === true);

  // ---- 中文大写月日：五月十六 / 五月十六号 / 五月十六日 ----
  const suffix = cnMonthDaySuffix(raw);
  if (suffix !== null) {
    /*
     * 默认（关）：只认无后缀与「号」——「五月十六」「五月十六号」。
     * 「五月十六日」的「日」更像阳历习惯，默认按阳历处理。
     * 开启后：大写中文书写一律按农历，包括带「日」的。
     */
    if (suffix === '日') return lunarOnCnUpper;
    return true;
  }

  // ---- 阿拉伯数字：5月16号 ----
  if (lunarOnHao && hasHaoSuffix(raw)) return true;
  return false;
}

/** 解析农历日，返回 { value, len } */

/** 侧边栏面板：实时时钟 + 插入按钮 + 预设切换 */
class TimestampView extends obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.intervalId = null;
  }

  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return '时间戳';
  }
  getIcon() {
    return 'clock';
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.clearTicker();
  }

  clearTicker() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  render() {
    const container = this.contentEl;
    container.empty();
    container.addClass('tsi-container');

    // 实时预览：仅在格式含秒时每秒刷新，避免无谓重绘
    const preview = container.createDiv({ cls: 'tsi-preview' });
    const updatePreview = () => preview.setText(this.plugin.formatNow());
    updatePreview();
    this.clearTicker();
    if (/s/.test(this.plugin.settings.timestamp.format)) {
      this.intervalId = window.setInterval(updatePreview, 1000);
      this.registerInterval(this.intervalId);
    }

    container.createDiv({ cls: 'tsi-hint', text: i18nT('kf71c4ba4', '当前时间戳') });

    const btn = container.createEl('button', { cls: 'tsi-insert-btn', text: i18nT('kb40aaf3e', '插入当前时间') });
    btn.onclick = () => this.plugin.insertTimestamp();

    // 预设列表：点一下即切换格式
    const section = container.createDiv({ cls: 'tsi-section' });
    section.createDiv({ cls: 'tsi-section-title', text: i18nT('kd53b1b0a', '快捷格式') });
    PRESETS.forEach((preset) => {
      const row = section.createDiv({ cls: 'tsi-preset-row' });
      if (this.plugin.settings.timestamp.format === preset.value) row.addClass('is-active');
      row.createEl('span', { cls: 'tsi-preset-label', text: presetText(preset.value, preset.label) });
      row.createEl('code', {
        cls: 'tsi-preset-value',
        text: this.plugin.formatWith(preset.value),
      });
      row.onclick = async () => {
        this.plugin.settings.timestamp.format = preset.value;
        await this.plugin.saveSettings();
      };
    });

    container
      .createDiv({ cls: 'tsi-tip' })
      .setText(i18nT('k8debd4e8', '更多格式可在设置中自定义（moment 语法）。'));
  }
}

/**
 * 斜杠命令：输入 /now（或 /ts、/time、自定义词）弹出建议。
 * 这是手机端最快的入口，拇指不用离开键盘。
 */
class TimestampSuggest extends obsidian.EditorSuggest {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onTrigger(cursor, editor) {
    if (!editor) return null;
    // 总开关优先：关掉后斜杠命令必须失效（以前只判了子开关，关总开关照样触发）
    if (!extEnabled(this.plugin)) return null;
    const s = this.plugin.settings.timestamp;
    if (!s.enableSlashCommand) return null;

    const triggers = ['/now', '/ts', '/time'];
    const custom = String(s.slashTrigger || '').trim();
    if (custom && !custom.startsWith('/')) triggers.push('/' + custom);

    // 只检查当前行光标前的文本，避免跨行误触发
    const textBefore = editor.getLine(cursor.line).slice(0, cursor.ch).toLowerCase();
    const matched = triggers.find((t) => textBefore.endsWith(t));
    if (!matched) return null;

    // start 回退触发词长度，替换时才能把 /now 一起吃掉
    return {
      start: { line: cursor.line, ch: cursor.ch - matched.length },
      end: cursor,
      query: matched,
    };
  }

  getSuggestions() {
    const primary = this.plugin.formatNow();
    const timeOnly = this.plugin.formatWith('HH:mm:ss');
    const dateOnly = this.plugin.formatWith('YYYY-MM-DD');

    // 去重：自定义格式可能就是 HH:mm，避免出现两个一样的可选项
    const list = [{ value: primary, hint: '默认格式', key: 'tsDefault' }];
    if (timeOnly !== primary) list.push({ value: timeOnly, hint: '仅时间', key: 'tsTime' });
    if (dateOnly !== primary && dateOnly !== timeOnly) {
      list.push({ value: dateOnly, hint: '仅日期', key: 'tsDate' });
    }
    return list;
  }

  renderSuggestion(item, el) {
    el.addClass('tsi-suggest-item');
    el.createDiv({ cls: 'tsi-suggest-value', text: item.value });
    el.createDiv({ cls: 'tsi-suggest-hint', text: miscText('tsSlash', item.key, item.hint) });
  }

  selectSuggestion(item) {
    if (!this.context) return;
    const { editor, start, end } = this.context;
    const suffix = this.plugin.settings.timestamp.insertNewline ? '\n' : '';
    editor.replaceRange(item.value + suffix, start, end);
  }
}

/**
 * 渲染时间戳设置内容。
 * 由外层统一设置页调用，预览定时器交由 ticker 统一管理生命周期。
 */
/**
 * 节日转换设置：自设节日 + 输出形态开关。
 * 单独一个函数，避免把 renderTimestampSettings 撑得更长。
 */
function renderFestivalSettings(containerEl, plugin) {
  const ext = plugin.settings.timestamp.extensions;

  containerEl.createEl('h3', { text: i18nT('kf0f153f2', '节日转换') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k924824c5', '节日名带日期'))
    .setDesc(i18nT('k3903e1d6', '打开（默认）：正向与逆向都输出「国庆节 2026-10-01」这种「节日名 + 日期」。')
     + i18nT('k57aa8108', '关闭：正向只给节日名，逆向只给日期。'))
    .addToggle((toggle) =>
      toggle.setValue(ext.festivalPrefix !== false).onChange(async (value) => {
        ext.festivalPrefix = value;
        await plugin.saveSettings();
      })
    );

  /*
   * 自设节日：多行文本。
   * 用 addTextArea —— 一行一条，输入框要能容纳十几行。
   * onChange 里**不要**重绘设置页：整个设置页重建会让输入框失去焦点，
   * 每敲一个字符就失焦（只能删一个再填一个），必须改成只刷新其他视图。
   */
  const customSetting = new obsidian.Setting(containerEl)
    .setName(i18nT('kabe37104', '自设节日'))
    .setDesc(i18nT('kfb6e20ce', '一行一条，让「妈妈生日」这类日子也能正反转换。写法见下方说明。'));
  customSetting.addTextArea((area) =>
    area
      .setPlaceholder(i18nT('k72acd8fa', '妈妈生日 = 10-15\n母亲节 = 5月第2个周日'))
      .setValue(String(ext.customFestivals ?? ''))
      .onChange(async (value) => {
        ext.customFestivals = String(value ?? '');
        await plugin.saveSettings();
        renderFestivalHelp(helpBox, plugin);
      })
  );

  const helpBox = containerEl.createDiv({ cls: 'tsi-festival-help' });
  renderFestivalHelp(helpBox, plugin);
}

/** 自设节日下方实时显示「已识别 N 条」与格式说明 */
function renderFestivalHelp(box, plugin) {
  const ext = plugin.settings.timestamp.extensions;
  const list = customFestivalList(plugin.settings);
  /* 示例整块不译（解析器只认中文写法）；节日名是用户数据，也不译 */
  const lines = [
    i18nT('fest.help.head', judge.FEST_HEAD),
    judge.FEST_EXAMPLES,
    '',
    i18nT('fest.help.count', `当前已识别 ${list.length} 条。`, list.length),
  ];
  if (list.length) {
    lines.push(i18nT('fest.help.list', '已识别：') + list.map((it) => it.name).join('、'));
  }
  box.setText(lines.join('\n'));
  // 让换行在界面上生效（纯文本节点默认折叠空白）
  box.style.whiteSpace = 'pre-wrap';
  box.style.fontSize = '12px';
}

function renderTimestampSettings(containerEl, plugin, ticker) {
  const s = plugin.settings.timestamp;
  containerEl.createEl('h2', { text: i18nT('ke4e64bcf', '时间戳插入器') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k2ca9949e', '时间格式'))
    .setDesc(i18nT('k635ea6c0', 'moment 语法，下方实时预览。'))
    .addText((text) =>
      text
        .setPlaceholder('YYYY-MM-DD HH:mm:ss')
        .setValue(s.format)
        .onChange(async (value) => {
          s.format = value.trim() || DEFAULT_SETTINGS.timestamp.format;
          await plugin.saveSettings();
        })
    );

  const previewBox = containerEl.createDiv({ cls: 'tsi-settings-preview' });
  ticker.add(() => previewBox.setText(plugin.formatNow()));

  new obsidian.Setting(containerEl)
    .setName(i18nT('k02c2adcd', '精确到秒'))
    .setDesc(i18nT('k43f681ca', '关闭（默认）：所有时间输出只到分钟，格式串里的秒也会被去掉。开启：保留秒。'))
    .addToggle((toggle) =>
      toggle.setValue(s.extensions.preciseToSecond === true).onChange(async (value) => {
        s.extensions.preciseToSecond = value;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k45e78490', '插入后自动换行'))
    .setDesc(i18nT('k80d351e7', '插入时间戳时额外补一个换行，方便连续记流水账。'))
    .addToggle((toggle) =>
      toggle.setValue(s.insertNewline).onChange(async (value) => {
        s.insertNewline = value;
        await plugin.saveSettings();
      })
    );

  containerEl.createEl('h3', { text: i18nT('k8bb0a1ed', '手机端 / 斜杠命令') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1ef6fa49', '启用斜杠命令'))
    .setDesc(i18nT('k78ceb0e9', '输入 /now（或 /ts、/time）弹出建议，点一下即插入。'))
    .addToggle((toggle) =>
      toggle.setValue(s.enableSlashCommand).onChange(async (value) => {
        s.enableSlashCommand = value;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k777cf6f3', '自定义触发词'))
    .setDesc(i18nT('k6589ba41', '额外增加一个触发词，不用带斜杠。例如填 date，则 /date 也能触发。'))
    .addText((text) =>
      text
        .setPlaceholder(i18nT('kca5eb00f', '例如：ts'))
        .setValue(s.slashTrigger)
        .onChange(async (value) => {
          s.slashTrigger = value.trim().replace(/^\//, '');
          await plugin.saveSettings();
        })
    );

  containerEl.createDiv({ cls: 'tsi-mobile-tip' }).setText(
    i18nT(
      'ka775650d',
      '手机端一键入口：编辑笔记时点键盘上方工具栏的扳手 → 添加命令 → 搜索「时间戳」→ 添加。'
    ) +
      i18nT(
        'k7472c7a5',
        '也可在 设置 → 选项 → 工具栏 → 快捷命令 里把它设为顶部下拉手势。'
      )
  );

  containerEl.createEl('h3', { text: i18nT('k3d03d01a', '预设格式') });
  const presetGrid = containerEl.createDiv({ cls: 'tsi-preset-grid' });
  PRESETS.forEach((preset) => {
    const btn = presetGrid.createEl('button', { cls: 'tsi-preset-btn' });
    btn.setText(presetText(preset.value, preset.label));
    btn.createEl('code', { text: plugin.formatWith(preset.value) });
    btn.onclick = async () => {
      s.format = preset.value;
      await plugin.saveSettings();
      plugin.redrawSettingsTab(); // 重绘以刷新预览与高亮
    };
  });

  // 扩展功能：时间文本转换（总开关 + 逐项开关）
  renderTimeActionSettings(containerEl, plugin);

  renderFestivalSettings(containerEl, plugin);

  containerEl.createEl('h3', { text: i18nT('k8afddc3f', '常用语法') });
  const table = containerEl.createEl('table', { cls: 'tsi-help-table' });
  const rows = [
    ['YYYY', '四位年份，如 2026'],
    ['MM / M', '月份，补零 / 不补零'],
    ['DD / D', '日期，补零 / 不补零'],
    ['dddd / ddd', '星期，如 星期五 / 周五'],
    ['HH / H', '24 小时制小时'],
    ['hh / h', '12 小时制小时'],
    ['mm / m', '分钟'],
    ['ss / s', '秒'],
    ['A / a', 'AM/PM'],
    ['Z / ZZ', '时区，如 +08:00'],
  ];
  rows.forEach(([token, desc]) => {
    const tr = table.createEl('tr');
    tr.createEl('td').createEl('code', { text: token });
    tr.createEl('td', { text: miscText('fmtToken', token, desc) });
  });

  // 区末统一提供恢复默认入口
  const { addResetButton } = require('./settings.js');
  addResetButton(containerEl, plugin, 'timestamp', '时间戳');
}

/*
 * 时间转换总开关的唯一判定源。
 *
 * 以前各处直接写 ext.enabled，四个入口漏判了（斜杠命令、撤回标记、
 * 撤回状态栏、撤回命令），表现为「关了总开关功能照常工作」。
 * 现在所有入口一律走这里，加新入口时也不会再漏。
 * 用 !== false 而不是真值判断：配置缺失/损坏时按默认（开）处理，
 * 不会把一个旧配置误判成关闭。
 *
 * 注意「缺失」指 extensions 整个对象不存在或 enabled 字段缺失 ——
 * 这两种情况都按默认（开）走，只有显式写成 false 才算关闭。
 * （曾写成 `!!ext && ...`：ext 缺失时返回 false，与上面这句注释相反，
 *   且让不带 settings 的测试环境一律判成关闭。）
 */
function extEnabled(plugin) {
  const ts = plugin && plugin.settings && plugin.settings.timestamp;
  const ext = ts ? ts.extensions : null;
  if (!ext || typeof ext !== 'object') return true; // 缺失 → 默认开
  return ext.enabled !== false;
}

/** 重新渲染所有已打开的时间戳面板 */
function refreshTimestampViews(plugin) {
  plugin.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
    if (leaf.view instanceof TimestampView) leaf.view.render();
  });
}

/** 注册时间戳模块：图标、视图、命令、斜杠建议 */
function registerTimestamp(plugin) {
  /*
   * CM6 编辑器扩展必须在 load 阶段注册，否则装饰字段不存在、
   * view.state.field() 会抛错，标记挂不上。
   * 环境里没有 CM6 时 buildCm6Extension 返回 null，跳过即可（不影响其他功能）。
   */
  /*
   * 编辑器扩展是**全局**的：它挂到所有编辑器实例上。
   * 排查冲突时看控制台输出即可，不必改动功能
   * （曾有过一个全局注册开关和一个诊断命令，均已移除）。
   */
  const cm6Ext = buildCm6Extension();
  if (cm6Ext && typeof plugin.registerEditorExtension === 'function') {
    plugin.registerEditorExtension(cm6Ext);
  } else if (!cm6Ext) {
    setUndoFail('CM6 扩展未构建（模块不可用或构建抛错）');
  }

  /*
   * 撤回图标能不能显示全看这里（打包器若没把 @codemirror/* 透传给宿主运行时，
   * cm6Available 会是 false —— 这正是图标不显示的根因，必须可观测、可测试）。
   */
  plugin.__ttDiag = {
    cm6Available: !!loadCm6(),
    cm6Field: !!CM6.field,
    failReason: lastUndoFailReason,
    unresolvable: unresolvableUndoCount(),
  };

  // 状态栏指示器：不依赖装饰，是撤回的可靠可见入口（必须在这里调用！）
  initUndoIndicator(plugin);
  // 切换笔记要刷新（记录按笔记分别记）
  try {
    plugin.registerEvent(
      plugin.app.workspace.on('file-open', () => refreshUndoIndicator(plugin))
    );
    plugin.registerEvent(
      plugin.app.workspace.on('active-leaf-change', () => refreshUndoIndicator(plugin))
    );
  } catch (e) { /* 老版本无该事件 */ }

  plugin.addRibbonIcon('clock', '插入当前时间戳', () => plugin.insertTimestamp());

  plugin.registerView(VIEW_TYPE, (leaf) => new TimestampView(leaf, plugin));

  /*
   * 这两个命令曾经漏接总开关门控（被 _test/entryguard.js 扫出来）：
   * 关掉「启用时间戳」后，它们仍然出现在命令面板里且照常执行。
   * 改用 checkCallback / editorCheckCallback：不满足条件时返回 false，
   * 命令直接从面板隐藏 —— 「点了没反应」比「不显示」更难排查。
   */
  plugin.addCommand({
    id: 'time-tools-timestamp-open-panel',
    name: '时间戳：打开时间戳面板',
    checkCallback: (checking) => {
      if (!extEnabled(plugin)) return false;
      if (!checking) plugin.activateTimestampView();
      return true;
    },
  });

  plugin.addCommand({
    id: 'time-tools-timestamp-insert',
    name: '时间戳：在当前光标处插入时间戳',
    editorCheckCallback: (checking, editor) => {
      if (!extEnabled(plugin)) return false;
      if (checking) return true;
      plugin.insertIntoEditor(editor);
      return true;
    },
  });

  plugin.registerEditorSuggest(new TimestampSuggest(plugin));

  // 扩展：时间文本转换
  registerTimeActions(plugin);
}

/* ------------------------------------------------------------------ *
 * 日期解析：自己实现，不依赖 moment 的宽松解析
 * 只认几种常见写法，认不出就返回 null，由调用方提示
 * ------------------------------------------------------------------ */

/*
 * 分隔符统一用一个字符类，而不是固定组合。
 * 用户手写的格式很随意：2026 09-19、2026/09 19、2026_09_19、20260919……
 * 逐个枚举组合会漏，改成「任意分隔符 + 可选」后这些都能覆盖。
 */

/** 数字之间允许的分隔符：连字符 斜杠 点 下划线 空格 以及中文年月日 */
const SEP = /[\s\-/._]*/.source;

/** 完整日期：4 位年 + 分隔 + 月 + 分隔 + 日，可带时间 */
const DATE_RE = new RegExp(
  '^(\\d{4})' + SEP + '(?:年)?' + SEP +
  '(\\d{1,2})' + SEP + '(?:月)?' + SEP +
  // 末尾既可能是「日」也可能是「号」（5月16号 是很常见的写法）
  '(\\d{1,2})' + SEP + '(?:日|号)?' +
  '(?:[\\sT]+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?$'
);

/** 紧凑纯数字：20260919 */
const COMPACT_RE = /^(\d{4})(\d{2})(\d{2})$/;

/** 只有月日：09-17 / 9/17 / 9月17日 / 09 17，可带时间 */
/*
 * 分隔符必须**至少出现一次**（+ 而不是 *）。
 * 用 * 时「17号」会被拆成 1 和 7 两个数字中间零分隔，
 * 于是算出「1 月 7 日」——不是识别不了，而是静默给出错误日期，
 * 比不识别更糟。改成 + 后「17号」不再落到这里，交给下面的 DAY_ONLY_RE。
 */
const MD_RE = new RegExp(
  '^(\\d{1,2})[\\s\-/._月]+(\\d{1,2})\\s*(?:日|号)?' +
  '(?:[\\sT]+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?$'
);

/** 只有日：3号 / 17号 / 十七号 —— 月由 dayOnlyMode 决定 */
const DAY_ONLY_RE =
  /^(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*(?:日|号)$/;

const TIME_ONLY_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const UNIX_RE = /^\d{10}$|^\d{13}$/;
/** 日记链接：[[2026-09-19]] */
const LINK_RE = /^\[\[\s*([^\[\]]+?)\s*\]\]$/;
/** 星期后缀：周六 / 星期六 / 星期日 / Monday */
const WEEKDAY_SUFFIX_RE =
  /[\s,，、]*(?:周|星期|礼拜)[一二三四五六日天]$|[\s,，、]*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*$/i;
/** 相对时间：3天前 / 2小时后 / 1.5小时后 */
/*
 * 相对时间。
 * 方向词除了「前 / 后」，还要覆盖「以前 / 以后 / 之前 / 之后」——
 * 「7天以后」是很常见的说法，只认单字会大面积漏掉。
 */
/*
 * 中文数字 ⇄ 阿拉伯数字。
 *
 * 用规则解析而不是穷举表：中文数字组合无穷（二十一、一百零五…），
 * 表会无限膨胀，规则是固定几行。这也符合「数据不无限增长」的约束。
 */

/*
 * 时段名（早上 / 中午 / 下午 …）。
 *
 * 默认不单独转换（方案丙）：「早上」到底指 8 点还是 9 点没有共识，
 * 强行给一个值就是编造。只有当它后面跟了具体时刻（早上8点）时才用来定 12/24 制。
 *
 * 用户可在高级设置里开启「时段名单独转换」，那时用下面的默认小时值，
 * 且该值本身也可在设置里改 —— 但默认关闭。
 */
/*
 * 时段表已移到 timejudge.js（见文件顶部 require）。
 * 那里同时定义了时段小时的可改口径与默认小时值。
 */

/** 时段键顺序（设置页渲染用） */
/** 从文本开头剥出时段词；返回 { key, rest } 或 null */
function splitDaypart(text) {
  const s = String(text ?? '').trim();
  for (const t of TIME_OF_DAY) {
    if (t.re.test(s)) return { key: t.key, rest: s.replace(t.re, '').trim() };
  }
  return null;
}

/**
 * 从**尾部**剥出时段词。
 * splitDaypart 用 ^ 锚定只能剥开头，但复合表达里时段词常在中间
 * （「明年12月份的第49周周三**下午**2点」剥掉时刻后剩「…周三下午」），
 * 必须按尾部匹配，否则整条解析失败。
 */
const DAYPART_TAIL_RE = new RegExp(
  '(' + TIME_OF_DAY.map((t) => t.key).join('|') + ')$'
);
function splitDaypartTail(text) {
  const s = String(text ?? '').trim();
  const m = DAYPART_TAIL_RE.exec(s);
  if (!m) return null;
  const t = TIME_OF_DAY.find((x) => x.key === m[1]);
  return { key: t ? t.key : m[1], rest: s.slice(0, m.index) };
}

/* ================= 复合时间表达 ================= */
/*
 * 形如「明年12月份的第49周周三下午2点」。
 * 单条正则覆盖不了这么长的组合，改成**从右往左逐段剥离**：
 * 时刻 → 时段 → 星期几 → 第N周 → 月 → 年。
 * 每段可选，剥不出就跳过，最后剩下的无法识别才判失败。
 */

/** ISO 年内周：含该年第一个周四的那一周为第 1 周（周一起始） */
function isoWeekOf(date) {
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // 先移到本周周四：周一 = getDay-1 的偏移修正后 +3
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const first = new Date(t.getFullYear(), 0, 4);
  first.setDate(first.getDate() + 3 - ((first.getDay() + 6) % 7));
  return 1 + Math.round((t - first) / 604800000);
}

/**
 * 某年 ISO 第 w 周的周 targetWd（1=周一 … 7=周日）是几号。
 * 注意：第 1 周的**周一** = 1/4 所在周的周一，不是 +3 后的周四。
 * 早期版本误用了求周四的公式，导致整周偏移 3 天。
 */
function isoWeekDate(year, w, targetWd) {
  const monday = new Date(year, 0, 4);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // 回到周一
  monday.setDate(monday.getDate() + (w - 1) * 7 + (targetWd - 1));
  return monday;
}

/**
 * 「第N周」是按 ISO 算还是按「1/1 起每 7 天」算，取决于周起始日。
 * 周起始日全插件只有一个来源：settings.calendar.weekStart（见「日历」设置页）。
 * 与 Calendar 插件的「Start week on」是同一种设置，两边需手动保持一致。
 */
function weekStartIsMonday(settings) {
  const cal = settings && settings.calendar;
  const v = cal && cal.weekStart;
  if (v === 'sunday') return false;
  if (v === 'monday') return true;
  // locale 及其它（周二至周六）：中文区域为周一，走 ISO
  return v === 'locale' || v === undefined || v === null;
}

/** 按设置把「第N周 + 星期几」算成日期 */
function weekOfYearDate(year, w, targetWd, settings) {
  if (weekStartIsMonday(settings)) return isoWeekDate(year, w, targetWd);
  // 周日起始：第 1 周从 1/1 开始，每周以周日为界
  const first = new Date(year, 0, 1);
  const offset = first.getDay(); // 第 1 周前面的空位
  const d = new Date(year, 0, 1 + (w - 1) * 7 + (targetWd % 7) - offset);
  return d;
}

/** 中文星期字符 → 1=周一 … 7=周日 */
const WD_CHAR = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };

/** 年偏移词 */
const YEAR_WORD = { 今年: 0, 明年: 1, 后年: 2, 去年: -1, 前年: -2 };

/** 「当前时间」——特殊词，直接取此刻 */
const NOW_WORDS = /^(当前时间|此刻|现在|当下)$/;

/** 今天是周几（0=周日） */
/** 把日期调到本周（周一为起点）的某个星期几 */
function setWeekday(date, target, weekOffset) {
  const cur = date.getDay();          // 0=周日
  const curIdx = cur === 0 ? 7 : cur; // 转成 1=周一 … 7=周日
  const diff = target - curIdx + (weekOffset || 0) * 7;
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * 「周末」算周几。周六、周日都有人用，口径交给用户（默认周日）。
 * @returns {number} 6=周六 7=周日
 */
function weekendDay(settings) {
  const ext = extOf(settings);
  return ext && ext.weekendDay === 6 ? 6 : 7;
}

/**
 * 「下周一」是哪一天 —— 只有"今天正好是本周的最后一天"时两种口径才分叉。
 *
 *   tomorrow（默认）按「本周 +7 天」推：今天周日时「下周一」= 明天。
 *     这符合多数人的口语：周日晚说「下周一」就是明天。
 *   nextweek 严格按周起始日切分：今天周日、周起始为周日时，
 *     明天仍属本周，「下周一」要再往后推一周。
 *
 * 其余情况两种口径结果相同，所以只有 wo === 1 时才需要分支。
 */
function resolveWeekday(base, wd, wo, settings) {
  const ext = extOf(settings);
  if (wo === 1 && ext && ext.nextWeekdayMode === 'nextweek') {
    // 以周起始日为界，取下一周的同一星期几
    const mondayStart = weekStartIsMonday(settings);
    const cur = base.getDay(); // 0=周日
    const curIdx = mondayStart ? (cur === 0 ? 7 : cur) : cur + 1;
    const startDelta = mondayStart ? -(curIdx - 1) : -(curIdx - 1);
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + startDelta + 7 + (wd - 1));
    return d;
  }
  return setWeekday(base, wd, wo);
}

/** 单个中文数字字符 → 数值 */
const CN_DIGIT = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
/** 数量级 */
const CN_UNIT = { 十: 10, 百: 100, 千: 1000 };

/**
 * 中文数字 → 阿拉伯数字。
 * 支持：一 ~ 九、十、十一、二十、二十一、一百、一百零五、两。
 * @returns {number|null} 解析不出返回 null
 */
function parseCNNumber(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  // 纯阿拉伯数字直接返回
  if (/^\d+$/.test(s)) return Number(s);

  let total = 0;   // 已累计的和
  let section = 0; // 当前小节（十位以下的数）
  let lastUnit = null;
  let hasAny = false;

  for (const ch of s) {
    if (ch in CN_DIGIT) {
      section = CN_DIGIT[ch];
      hasAny = true;
    } else if (ch in CN_UNIT) {
      const u = CN_UNIT[ch];
      hasAny = true;
      if (section === 0) section = 1; // 「十」= 10、「百」= 100
      // 单位比上一个大则进位，否则累加（如「二十」= 2*10）
      total += section * u;
      section = 0;
      lastUnit = u;
    } else if (ch === '零' || ch === '〇') {
      // 零只占位，忽略
    } else {
      return null; // 含非数字字符，交给别的解析路径
    }
  }
  if (!hasAny) return null;
  return total + section;
}

/**
 * 解析时刻：5点 / 5点半 / 5点30 / 下午5点 / 17点 / 5:30。
 * @returns {{hour:number,minute:number}|null}
 */
function parseClockCN(text, daypartKey) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  /*
   * 12 小时制判定。
   * 时段词可能在调用前已被剥掉（如「晚上7点半」→ 时段=晚上，rest="7点半"），
   * 这时必须靠 daypartKey 判断上下午，否则「晚上7点」会算成早上 7 点。
   */
  let pm = null; // null = 未指定（按 24 小时制理解）
  let body = s;
  if (/^(下午|傍晚|晚上|夜里|深夜)/.test(body)) {
    pm = true;
    body = body.replace(/^(下午|傍晚|晚上|夜里|深夜)/, '');
  } else if (/^(上午|早上|早晨|凌晨)/.test(body)) {
    pm = false;
    body = body.replace(/^(上午|早上|早晨|凌晨)/, '');
  }
  if (pm === null && daypartKey) {
    const t = TIME_OF_DAY.find((x) => x.key === daypartKey);
    if (t) pm = t.pm;
  }

  // 5:30 形式
  let m = /^(\d{1,2}):(\d{2})$/.exec(body);
  if (m) {
    const h = Number(m[1]);
    if (h > 23 || Number(m[2]) > 59) return null;
    return { hour: pm && h < 12 ? h + 12 : h, minute: Number(m[2]) };
  }

  /*
   * 「差5分10点」：中文的倒数说法，先算再交给下面的统一出口。
   * 必须放在常规写法**之前** —— 否则「差5分10点」里的「10点」
   * 会被当成整点先匹配掉，剩下「差5分」无人处理。
   */
  m = /^差\s*(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*分\s*(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*点$/.exec(body);
  if (m) {
    const h0 = /^\d+$/.test(m[2]) ? Number(m[2]) : parseCNNumber(m[2]);
    const sub = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (h0 !== null && sub !== null && isFinite(h0) && isFinite(sub)) {
      const total = h0 * 60 - sub;
      const hh = Math.floor(total / 60);
      const mm = ((total % 60) + 60) % 60;
      if (hh >= 0 && hh <= 23) {
        return { hour: pm && hh < 12 ? hh + 12 : hh, minute: mm };
      }
    }
    return null;
  }

  // 十点一刻 / 十点三刻：一刻 = 15 分
  m = /^(.{1,4}?)点\s*([一二三]刻)$/.exec(body);
  if (m) {
    const hRaw = (m[1] || '').trim();
    let hour = /^\d+$/.test(hRaw) ? Number(hRaw) : parseCNNumber(hRaw);
    if (hour !== null && isFinite(hour) && hour <= 23) {
      const ke = { 一: 15, 二: 30, 三: 45 }[m[2]] || 15;
      if (pm && hour < 12) hour += 12;
      return { hour, minute: ke };
    }
    return null;
  }

  // 10点过5分 / 10点05分
  m = /^(.{1,4}?)点\s*过?\s*(\d{1,2})\s*分?$/.exec(body);
  if (m) {
    const hRaw = (m[1] || '').trim();
    let hour = /^\d+$/.test(hRaw) ? Number(hRaw) : parseCNNumber(hRaw);
    if (hour !== null && isFinite(hour) && hour <= 23) {
      const mm = Number(m[2]);
      if (mm <= 59) {
        if (pm && hour < 12) hour += 12;
        return { hour, minute: mm };
      }
    }
    return null;
  }

  // 7点45：点后直接跟两位分，无「分」字
  m = /^(\d{1,2})\s*点\s*(\d{2})$/.exec(body);
  if (m) {
    let hour = Number(m[1]);
    const mm = Number(m[2]);
    if (hour <= 23 && mm <= 59) {
      if (pm && hour < 12) hour += 12;
      return { hour, minute: mm };
    }
    return null;
  }

  // 5点 / 5点半 / 5点30 / 17点 / 五点
  m = /^(.{1,4}?)点(半|\d{1,2}分?|整)?$/.exec(body);
  if (m) {
    const hRaw = (m[1] || '').trim();
    if (!hRaw) return null;
    let hour = /^\d+$/.test(hRaw) ? Number(hRaw) : parseCNNumber(hRaw);
    if (hour === null || !isFinite(hour)) return null;
    if (hour > 23) return null;
    // 中文习惯：「下午5点」→ 17，「下午12点」保持 12
    if (pm && hour < 12) hour += 12;

    let minute = 0;
    if (m[2]) {
      if (m[2] === '半') minute = 30;
      else minute = Number(String(m[2]).replace('分', ''));
    }
    if (minute > 59) return null;
    return { hour, minute };
  }
  return null;
}

/*
 * 数量部分既可以是阿拉伯数字，也可以是中文（二天后 / 两天后 / 七天后），
 * 所以这里用宽松的字符类，实际数值交给 parseCNNumber 处理。
 * 前面加「第」可表示序数（第二天 / 第七天后）。
 */
const REL_RE =
  /^第?([0-9\.]+|[零〇一二两三四五六七八九十百千]+)\s*(秒|分钟|分|刻钟|刻|小时|时|天|日|周|个?星期|个?月|年)\s*(以内)?(以前|以后|之前|之后|内|前|后)?$/;

/** 半 / 一 + 特殊量词：半小时后 / 一刻钟后 / 半天后 */
/*
 * 注意：这里刻意不含「大半天」。
 * 它是时长描述（"花了大半天"）而非时刻，转成日期没有意义，
 * 且语义比「半天」更模糊，归为不识别的模糊词。
 */
const HALF_RE =
  /^(半小时|半个小?时|一刻钟|一?刻钟|半天|半)\s*(以后|之后|后|以内|内|以前|之前|前)?$/;

/** 倒装说法：前两天 / 前三天 / 前一周 —— 方向词在前面 */
const REL_PREFIX_RE =
  /^(前|上)([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*(秒|分钟|分|小时|时|天|日|周|个?星期|个?月|年)$/;

/** 「过N…」：过两天 / 再过三天 —— 方向固定往后，故与 REL_PREFIX_RE 分开 */
const GUO_RE =
  /^(?:再)?过\s*([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*(天|日|周|个?星期|个?月|年)$/;

/** 复合时长：一年零三天后 / 两年零一个月前 —— 「零」连接的两个量 */
const ZERO_RE =
  /^([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*年\s*零?\s*([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*(天|日|个?月)\s*(前|后)$/;

/**
 * 口语相对日：明天 / 后天 / 大后天 / 前天 / 大前天 / 昨天 / 今天 / 下周 / 上个月……
 * 这些没有数字，只能整词匹配；中文与英文各一份。
 *
 * offsets 为 [年偏移, 月偏移, 日偏移]，按月/年推进的走日历加法，
 * 避免用固定天数近似（月末、闰年会错）。
 */
/**
 * 口语相对日的「日偏移」表，供带时刻的写法复用。
 * 单独抽出来是因为「明天5点」= 日偏移(明天) + 时刻(5点)，
 * 两条规则组合，不需要为每种组合都写一条。
 */
const WORD_DAY_OFFSET = [
  /*
   * 「第二天」= 次日（+1）。这是口语里最无争议的用法，
   * 而「第七天后」走下面的数量规则算 +7；两者不一致但各自符合语感。
   * 放在这里是为了优先于 REL_RE 的「第N天 → +N」。
   */
  { re: /^第二天/, d: 1 },
  { re: /^次日/, d: 1 },
  { re: /^翌日/, d: 1 },
  { re: /^今日/, d: 0 },
  { re: /^当天/, d: 0 },
  { re: /^当日/, d: 0 },
  { re: /^今日/, d: 0 },
  // 今早 / 今晚 / 明早 / 明晚 / 昨夜 / 今夜：日偏移由前缀定，时段由后缀定
  // 今/明/昨 + 早/晚/夜/晨/下午 的各种组合
  { re: /^今早|^今晨|^今上午/, d: 0 },
  { re: /^今晚|^今夜|^今下午|^今傍晚|^今凌晨/, d: 0 },
  { re: /^明早|^明晨|^明上午/, d: 1 },
  { re: /^明晚|^明夜|^明下午|^明傍晚|^明凌晨/, d: 1 },
  { re: /^昨早|^昨晨|^昨上午/, d: -1 },
  { re: /^昨夜|^昨晚|^昨下午|^昨傍晚|^昨凌晨/, d: -1 },
  { re: /^后早|^后晨/, d: 2 },
  { re: /^后晚|^后夜|^后下午/, d: 2 },
  { re: /^前早|^前晨/, d: -2 },
  { re: /^前晚|^前夜|^前下午/, d: -2 },
  { re: /^大大前天/, d: -4 }, { re: /^大前天/, d: -3 }, { re: /^前天/, d: -2 },
  { re: /^昨天/, d: -1 }, { re: /^今天/, d: 0 },
  { re: /^明天/, d: 1 }, { re: /^后天/, d: 2 },
  { re: /^大后天/, d: 3 }, { re: /^大大后天/, d: 4 },
  { re: /^上上个?周/, d: -14 }, { re: /^上个?周/, d: -7 },
  { re: /^本个?周/, d: 0 }, { re: /^下个?周/, d: 7 }, { re: /^下下个?周/, d: 14 },
  { re: /^前天$/, d: -2 },
];

/** 从口语相对日里取出「日部分」与「剩余部分」（可能是时刻） */
function splitWordDay(text) {
  const s = String(text ?? '').trim();
  for (const w of WORD_DAY_OFFSET) {
    if (w.re.test(s)) {
      const rest = s.replace(w.re, '').trim();
      /*
       * 时段词只可能在**词根**里（「明晚」的「晚」、「今早」的「早」），
       * 所以只在词根部分找，不去动 rest。
       * 早先的版本对**整个原文**找，结果「大后天5点半」里的「半」
       * 被当成「深夜」的单字别名，5:30 被算成 17:30。
       * 时刻部分的字不参与时段判定，两者语义本就不相干。
       */
      const stem = s.slice(0, s.length - rest.length);
      return { dayOffset: w.d, rest, daypart: daypartIn(stem) };
    }
  }
  return null;
}

/**
 * 在整个文本里找时段词（作为子串，含单字别名），返回 key 或 null。
 * 别名必须**后于完整词**检查：先完整后单字，否则「晚上」会先命中「晚」。
 * 实际上顺序无妨（同 key），但「下午 / 中午」都含「午」——
 * 所以别名检查要跳过同时是完整词的字，这里按「午」归属到先出现的「中午」，
 * 上下午的区分交给前面的完整词匹配（splitDaypartTail）优先处理。
 */
function daypartIn(text) {
  const s = String(text ?? '');
  // 完整词优先
  for (const t of TIME_OF_DAY) {
    if (s.indexOf(t.key) >= 0) return t.key;
  }
  // 再查单字别名（「明晚」的「晚」、「今早」的「早」）
  for (const t of TIME_OF_DAY) {
    if (!t.alias) continue;
    for (const a of t.alias) {
      if (s.indexOf(a) >= 0) return t.key;
    }
  }
  return null;
}

/**
 * 星期几：周一 ~ 周日、星期一 ~ 星期日，可带 本/上/下。
 * 必须**优先于 splitWordDay** —— 否则「上周五」会被 /^上个?周/ 吃掉前半，
 * 剩下「五」既不是时刻也不是有效后缀，直接返回 null。
 * @returns {{wd:number,wo:number}|null} wd: 1=周一…7=周日；wo: 周偏移
 */
/*
 * 星期写法。三种词根都要收，缺一种就是成片漏识别：
 *   周   → 周五 / 上上周一
 *   星期 → 星期五（原先只认「周五」，「星期五」整类不识别）
 *   礼拜 → 礼拜三（南方口语常用）
 * 前缀支持叠字：上上周三 / 下下周一。
 */
const WEEKDAY_RE =
  /^(上上|下下|本|这|上|下)?\s*(?:周|星期|礼拜)\s*([一二三四五六日天1-7])(?:[日天])?$/;

function parseWeekday(text) {
  const s = String(text ?? '').trim();
  const m = WEEKDAY_RE.exec(s);
  if (!m) return null;
  const char = m[2];
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  let wd = map[char];
  if (wd === undefined && /^[1-7]$/.test(char)) wd = Number(char);
  if (!wd) return null;
  const prefix = m[1];
  const wo = prefix === '上上' ? -2 : prefix === '下下' ? 2
    : prefix === '上' ? -1 : prefix === '下' ? 1 : 0;
  return { wd, wo };
}

const WORD_REL = [
  // --- 中文：以「天」为单位 ---
  /*
   * 顺序与量词都要精确：多条都写成 /^大?大?前天$/ 的话，
   * 「前天」也会被它匹配成 -3（两个「大」都是可选的），
   * 结果「前天」和「大前天」算出同一天。必须逐条写死。
   */
  { re: /^大大前天$/, y: 0, m: 0, d: -4, label: '大大前天' },
  { re: /^大前天$/, y: 0, m: 0, d: -3, label: '大前天' },
  { re: /^前天$/, y: 0, m: 0, d: -2, label: '前天' },
  { re: /^昨天$/, y: 0, m: 0, d: -1, label: '昨天' },
  { re: /^今天$/, y: 0, m: 0, d: 0, label: '今天' },
  { re: /^明天$/, y: 0, m: 0, d: 1, label: '明天' },
  { re: /^后天$/, y: 0, m: 0, d: 2, label: '后天' },
  { re: /^大后天$/, y: 0, m: 0, d: 3, label: '大后天' },
  { re: /^大大后天$/, y: 0, m: 0, d: 4, label: '大大后天' },

  // --- 中文：星期几（周一 ~ 周日 / 星期一 ~ 星期日 / 周末）---
  { re: /^本周?一$|^本周?一$/, wd: 1, wo: 0, label: '周一' },
  { re: /^本周?二$/, wd: 2, wo: 0, label: '周二' },
  { re: /^本周?三$/, wd: 3, wo: 0, label: '周三' },
  { re: /^本周?四$/, wd: 4, wo: 0, label: '周四' },
  { re: /^本周?五$/, wd: 5, wo: 0, label: '周五' },
  { re: /^本周?六$/, wd: 6, wo: 0, label: '周六' },
  { re: /^本周?日$|^本周?天$/, wd: 7, wo: 0, label: '周日' },
  { re: /^上周一?$|^上周一$/, wd: 1, wo: -1, label: '上周一' },
  { re: /^上周二$/, wd: 2, wo: -1, label: '上周二' },
  { re: /^上周三$/, wd: 3, wo: -1, label: '上周三' },
  { re: /^上周四$/, wd: 4, wo: -1, label: '上周四' },
  { re: /^上周五$/, wd: 5, wo: -1, label: '上周五' },
  { re: /^上周六$/, wd: 6, wo: -1, label: '上周六' },
  { re: /^上周日$|^上周天$/, wd: 7, wo: -1, label: '上周日' },
  { re: /^下周一?$|^下周一$/, wd: 1, wo: 1, label: '下周一' },
  { re: /^下周二$/, wd: 2, wo: 1, label: '下周二' },
  { re: /^下周三$/, wd: 3, wo: 1, label: '下周三' },
  { re: /^下周四$/, wd: 4, wo: 1, label: '下周四' },
  { re: /^下周五$/, wd: 5, wo: 1, label: '下周五' },
  { re: /^下周六$/, wd: 6, wo: 1, label: '下周六' },
  { re: /^下周日$|^下周天$/, wd: 7, wo: 1, label: '下周日' },
  /*
   * 周末 = 周六还是周日没有共识（有人把周日当周末最后一天）。
   * wd 只是占位，实际值在匹配后由 weekendDay(settings) 覆盖，
   * weekend: true 就是那处覆盖的标记。
   */
  { re: /^周末$/, wd: 6, wo: 0, label: '周末', weekend: true },

  // --- 中文：月 / 年的首尾 ---
  { re: /^本?月底$|^月末$/, monthEnd: true, label: '月底' },
  { re: /^本?月初$/, monthStart: true, label: '月初' },
  // 组合式：上个月底 / 下个月初 / 上月末 / 下月初，含「个」字与省略写法
  { re: /^上个?月底$|^上个?月末$/, monthEnd: true, monthOffset: -1, label: '上个月底' },
  { re: /^下个?月初$/, monthStart: true, monthOffset: 1, label: '下个月初' },
  { re: /^下个?月底$|^下个?月末$/, monthEnd: true, monthOffset: 1, label: '下个月底' },
  { re: /^上个?月初$/, monthStart: true, monthOffset: -1, label: '上个月初' },
  // 叠字两层：上上个月底 / 上上月末
  { re: /^上上个?月底$|^上上个?月末$/, monthEnd: true, monthOffset: -2, label: '上上个月底' },
  // 去年末 / 明年初：先跨年，再取年末月初
  { re: /^去年末$|^去年底$/, monthEnd: true, yearOffset: -1, label: '去年末' },
  { re: /^明年初$|^明年头$/, monthStart: true, yearOffset: 1, label: '明年初' },
  { re: /^年中$/, y: 0, m: 0, d: 0, fixedMonth: 6, fixedDay: 30, label: '年中' },
  { re: /^年末$|^年底$/, y: 0, m: 0, d: 0, fixedMonth: 12, fixedDay: 31, label: '年末' },
  { re: /^年初$/, y: 0, m: 0, d: 0, fixedMonth: 1, fixedDay: 1, label: '年初' },

  // --- 中文：周 / 月 / 年 ---
  { re: /^上上(个)?周$/, y: 0, m: 0, d: -14, label: '上上周' },
  { re: /^上(个)?周$/, y: 0, m: 0, d: -7, label: '上周' },
  { re: /^本(个)?周$/, y: 0, m: 0, d: 0, label: '本周' },
  { re: /^下(个)?周$/, y: 0, m: 0, d: 7, label: '下周' },
  { re: /^下下(个)?周$/, y: 0, m: 0, d: 14, label: '下下周' },
  { re: /^下下下(个)?周$/, y: 0, m: 0, d: 21, label: '下下下周' },
  { re: /^上上上(个)?周$/, y: 0, m: 0, d: -21, label: '上上上周' },
  // 头一天 = 前一天，与「前一天」同义
  { re: /^头一天$/, y: 0, m: 0, d: -1, label: '头一天' },
  // 半年 = 6 个月；一年半 = 1 年 6 个月。走日历加法，不用固定天数近似
  { re: /^半年后$/, y: 0, m: 6, d: 0, label: '半年后' },
  { re: /^半年前$/, y: 0, m: -6, d: 0, label: '半年前' },
  { re: /^一年半后$/, y: 1, m: 6, d: 0, label: '一年半后' },
  { re: /^一年半前$/, y: -1, m: -6, d: 0, label: '一年半前' },
  { re: /^上个?月$/, y: 0, m: -1, d: 0, label: '上个月' },
  { re: /^这个?月$/, y: 0, m: 0, d: 0, label: '本月' },
  { re: /^下个?月$/, y: 0, m: 1, d: 0, label: '下个月' },
  { re: /^前年$/, y: -2, m: 0, d: 0, label: '前年' },
  { re: /^去年$/, y: -1, m: 0, d: 0, label: '去年' },
  { re: /^今年$/, y: 0, m: 0, d: 0, label: '今年' },
  { re: /^明年$/, y: 1, m: 0, d: 0, label: '明年' },
  { re: /^后年$/, y: 2, m: 0, d: 0, label: '后年' },

  // --- 英文 ---
  { re: /^yesterday$/i, y: 0, m: 0, d: -1, label: 'yesterday' },
  { re: /^today$/i, y: 0, m: 0, d: 0, label: 'today' },
  { re: /^tomorrow$/i, y: 0, m: 0, d: 1, label: 'tomorrow' },
  { re: /^the day after tomorrow$/i, y: 0, m: 0, d: 2, label: 'the day after tomorrow' },
  { re: /^the day before yesterday$/i, y: 0, m: 0, d: -2, label: 'the day before yesterday' },
  // 英文：this/next/last + 时段
  { re: /^this morning$/i, y: 0, m: 0, d: 0, label: 'this morning', daypart: '早上' },
  { re: /^this afternoon$/i, y: 0, m: 0, d: 0, label: 'this afternoon', daypart: '下午' },
  { re: /^this evening$/i, y: 0, m: 0, d: 0, label: 'this evening', daypart: '晚上' },
  { re: /^tomorrow morning$/i, y: 0, m: 0, d: 1, label: 'tomorrow morning', daypart: '早上' },
  { re: /^tomorrow afternoon$/i, y: 0, m: 0, d: 1, label: 'tomorrow afternoon', daypart: '下午' },
  { re: /^tomorrow evening$/i, y: 0, m: 0, d: 1, label: 'tomorrow evening', daypart: '晚上' },
  { re: /^last night$/i, y: 0, m: 0, d: -1, label: 'last night', daypart: '晚上' },
  { re: /^tonight$/i, y: 0, m: 0, d: 0, label: 'tonight', daypart: '晚上' },
  { re: /^(next|last) week$/i, y: 0, m: 0, d: 7, label: 'next week', dirFromWord: true },
  { re: /^(next|last) month$/i, y: 0, m: 1, d: 0, label: 'next month', dirFromWord: true },
  { re: /^(next|last) year$/i, y: 1, m: 0, d: 0, label: 'next year', dirFromWord: true },
];

/** 是否像「相对时间」的描述（用于空态提示：这类文本有对应转换项只是没开） */
function looksLikeRelative(text) {
  const t = String(text ?? '').trim();
  if (!t) return false;
  if (REL_RE.test(t) || REL_PREFIX_RE.test(t)) return true;
  if (WORD_REL.some((w) => w.re.test(t))) return true;
  // 口语日 + 时刻：明天5点 / 昨天下午3点
  const sw = splitWordDay(t);
  return !!(sw && (!sw.rest || parseClockCN(sw.rest)));
}

/**
 * 字段合法性校验。
 * 宽松分隔符会带来副作用：像 "99 99" 这种也能被正则匹配上，
 * 不限定范围就会解析出荒谬的日期（月 99）。构造后校验一遍再返回。
 */
function isValidParts(y, mo, d, h, mi, sec) {
  if (mo < 1 || mo > 12) return false;
  if (d < 1 || d > 31) return false;
  if (h < 0 || h > 23) return false;
  if (mi < 0 || mi > 59) return false;
  if (sec < 0 || sec > 59) return false;
  if (!isFinite(y) || y < 1) return false;
  return true;
}

/** 构造 Date 并校验；不合法返回 null */
function safeDate(y, mo, d, h, mi, sec) {
  const [Y, M, D, H, MI, S] = [Number(y), Number(mo), Number(d),
    h ? Number(h) : 0, mi ? Number(mi) : 0, sec ? Number(sec) : 0];
  if (!isValidParts(Y, M, D, H, MI, S)) return null;
  const date = new Date(Y, M - 1, D, H, MI, S);
  // 反向确认：防止 2 月 30 日这类被 JS 自动进位
  if (date.getFullYear() !== Y || date.getMonth() !== M - 1 || date.getDate() !== D) return null;
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 去掉包裹性的装饰：[[链接]] 与末尾的星期。
 * 这样 09-17、[[09-17]]、09-17 周六 都能走到同一套解析逻辑。
 */
function stripDecorations(text) {
  let s = String(text ?? '').trim();
  const link = LINK_RE.exec(s);
  if (link) s = link[1].trim();
  const noWeek = stripWeekdayOnly(s);
  return noWeek !== null ? noWeek : s;
}

/** 只剥末尾的星期；本来就没有星期则返回 null（用于判断这项是否适用） */
function stripWeekdayOnly(text) {
  let s = String(text ?? '').trim();
  let changed = false;
  // 极端情况下可能叠了两层，最多剥两次
  for (let i = 0; i < 2; i++) {
    const next = s.replace(WEEKDAY_SUFFIX_RE, '').trim();
    if (next === s) break;
    s = next;
    changed = true;
  }
  return changed ? s : null;
}

/** 文本里是否含「时:分」（可能带秒） */
function hasClock(text) {
  return /\d{1,2}:\d{2}(?::\d{2})?/.test(String(text ?? ''));
}
/** 文本里的时钟部分是否写了秒 */
function hasSeconds(text) {
  return /\d{1,2}:\d{2}:\d{2}/.test(String(text ?? ''));
}
/** 文本里是否含四位年份 */
function hasYear(text) {
  return /\d{4}/.test(String(text ?? ''));
}

/** 把文本解析成 Date；认不出返回 null */
function parseToDate(text, settings) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  /*
   * 中文大写的月日（五月十六日）：默认规则下按**阳历**处理，
   * 但只认阿拉伯数字的阳历解析吃不下它，会变成「农历不算、阳历也认不出」的死角。
   * 所以需要 settings 判断归属 —— 只在明确不按农历时才按阳历解析。
   */
  if (settings && shouldTreatAsLunar(raw, settings) === false && cnMonthDaySuffix(raw) !== null) {
    const cn = parseCnSolarDate(raw);
    if (cn) return cn;
  }

  // 纯数字：按 Unix 时间戳处理（10 位秒 / 13 位毫秒）
  if (UNIX_RE.test(raw)) {
    const n = Number(raw);
    const ms = raw.length === 10 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  const clean = stripDecorations(raw).trim();
  if (!clean) return null;

  // 紧凑 8 位：20260919
  const cm = COMPACT_RE.exec(clean);
  if (cm) return safeDate(cm[1], cm[2], cm[3]);

  // 只有时分（秒）：先于「只有月日」判断。
  // 顺序很关键 —— 宽松分隔符下 "14:30" 也会被 MD_RE 匹配成「月 14 日 30」，
  // 虽然会被范围校验挡下，但先判时钟语义更清晰。
  const t = TIME_ONLY_RE.exec(clean);
  if (t) {
    const now = new Date();
    return safeDate(
      now.getFullYear(), now.getMonth() + 1, now.getDate(), t[1], t[2], t[3]
    );
  }

  // 完整年月日（可带时间）
  const m = DATE_RE.exec(clean);
  if (m) {
    const parsed = safeDate(m[1], m[2], m[3], m[4], m[5], m[6]);
    if (parsed) return parsed;
  }

  // 只有月日：补上今年
  const md = MD_RE.exec(clean);
  if (md) {
    const now = new Date();
    const parsed = safeDate(
      now.getFullYear(), md[1], md[2], md[3], md[4], md[5]
    );
    if (parsed) return parsed;
  }

  /*
   * 只有日：3号 / 17号。
   * 三种口径由 dayOnlyMode 决定，没有共识，交给用户选：
   *   current（默认）补当前月     → 今天 9/20 时「17号」= 9/17
   *   upcoming 该日已过则取下月   → 今天 9/20 时「17号」= 10/17
   *   off     不转换
   * 注意日期必须回校（2月30号这类直接返回 null），
   * 否则 setDate 会静默溢出到下个月。
   */
  const dom = DAY_ONLY_RE.exec(clean);
  if (dom) {
    const mode = dayOnlyMode(settings);
    if (mode !== 'off') {
      const n = /^\d+$/.test(dom[1]) ? Number(dom[1]) : parseCNNumber(dom[1]);
      const now = new Date();
      if (n !== null && isFinite(n) && n >= 1 && n <= 31) {
        let mo = now.getMonth() + 1;
        if (mode === 'upcoming' && n < now.getDate()) mo += 1;
        return safeDate(now.getFullYear(), mo, n);
      }
    }
  }

  return null;
}

/**
 * 「只有日」的口径（3号 / 17号）。
 * 三种写法都有人用，插件不替用户拍板，默认补当前月。
 */
function dayOnlyMode(settings) {
  const ext = extOf(settings);
  const v = ext && ext.dayOnlyMode;
  return v === 'upcoming' || v === 'off' ? v : 'current';
}

/** 输入是否看起来像 Unix 时间戳 */
function looksLikeUnix(text) {
  return UNIX_RE.test(String(text ?? '').trim());
}

/**
 * 解析相对时间描述：3天前 / 2小时后 / 1.5小时后 / 2周前。
 * 月、年按日历推进（避免 30 天近似在月末出错），其余按毫秒加减。
 * @returns {Date|null}
 */
/**
 * 把日期的时分秒设为指定值（保持年月日）。
 * 相对时间默认落在 00:00 更自然 —— 说「明天」通常指那天而非当前时刻。
 */
function withClock(date, hour, minute, second) {
  const d = new Date(date.getTime());
  d.setHours(hour || 0, minute || 0, second || 0, 0);
  return d;
}

/** 时段名对应的小时（取用户在高级设置里改过的值，否则用默认） */
function daypartHour(key, settings) {
  const ext = extOf(settings);
  const custom = ext && ext.daypartHours;
  if (custom && typeof custom[key] === 'number') return custom[key];
  const t = TIME_OF_DAY.find((x) => x.key === key);
  return t ? t.hour : 12;
}

/** 是否允许「时段名单独转换」（默认否，方案丙：不给模糊词编造时刻） */
function convertDaypartAlone(settings) {
  const ext = extOf(settings);
  return !!(ext && ext.convertDaypartAlone === true);
}

/**
 * 英文句式：in 3 days / 3 days ago / in two weeks / a week ago。
 * 数字可以是阿拉伯或英文单词，单位取单数/复数都行。
 * @returns {{n:number,unit:string,dir:number}|null}
 */
const EN_UNIT = {
  second: '秒', seconds: '秒', minute: '分钟', minutes: '分钟',
  hour: '小时', hours: '小时', day: '天', days: '天',
  week: '周', weeks: '周', month: '月', months: '月',
  year: '年', years: '年',
};
const EN_NUM = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** 英文星期：next Monday / last Friday / this Monday */
const EN_WEEKDAY = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 7,
};
function parseEnglishWeekday(text) {
  const s = String(text ?? '').trim().toLowerCase();
  const m = /^(next|last|this)?\s*([a-z]+)$/.exec(s);
  if (!m) return null;
  const wd = EN_WEEKDAY[m[2]];
  if (!wd) return null;
  const wo = m[1] === 'next' ? 1 : m[1] === 'last' ? -1 : 0;
  return { wd, wo };
}

function parseEnglishRelative(text) {
  const s = String(text ?? '').trim().toLowerCase();
  // 3 days ago / two weeks ago
  let m = /^([\d]+|[a-z]+)\s+([a-z]+)s?\s+ago$/.exec(s);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : EN_NUM[m[1]];
    const unit = EN_UNIT[m[2]] || EN_UNIT[m[2] + 's'];
    if (n && unit) return { n, unit, dir: -1 };
  }
  // in 3 days / in two weeks
  m = /^in\s+([\d]+|[a-z]+)\s+([a-z]+)s?$/.exec(s);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : EN_NUM[m[1]];
    const unit = EN_UNIT[m[2]] || EN_UNIT[m[2] + 's'];
    if (n && unit) return { n, unit, dir: 1 };
  }
  return null;
}

/**
 * 去掉尾部的助词（的 / 份 / 里 / 内）。
 * 中文口语常插「的」：「12月份**的**第49周」，不剥掉会让下一段尾部匹配失败。
 */
function stripParticle(text) {
  return String(text ?? '').replace(/(的|份|里|内)+$/, '').trim();
}

/**
 * 复合时间表达：明年12月份的第49周周三下午2点。
 * @returns {Date|null} 至少要剥出「有意义的一段」才返回结果，
 *   否则任意文本都可能被误判。
 */
function parseComposite(text, base, settings) {
  let s = String(text ?? '').trim();
  if (!s) return null;

  const now = base ? new Date(base.getTime()) : new Date();
  let year = null, month = null, week = null, wd = null, day = null;
  let daypart = null, clock = null, monthEdgeFlag = null;
  let hit = false;

  // ---- 1) 尾部时刻：2点 / 7点半 / 14:30 ----
  let m = /(\d{1,2})\s*[:：]\s*(\d{2})\s*分?$/.exec(s);
  if (m) { clock = { hour: Number(m[1]), minute: Number(m[2]) }; s = s.slice(0, m.index); hit = true; }
  else {
    m = /(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*点\s*(半|\d{1,2}\s*分?)?$/.exec(s);
    if (m) {
      const h = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
      if (h !== null) {
        let mi = 0;
        if (m[2]) mi = m[2] === '半' ? 30 : Number(String(m[2]).replace('分', ''));
        clock = { hour: h, minute: mi };
        s = s.slice(0, m.index);
        hit = true;
      }
    }
  }

  // ---- 2) 尾部时段（必须在尾，不能按开头匹配）----
  const dp = splitDaypartTail(s);
  if (dp) {
    daypart = dp.key;
    s = dp.rest;
    hit = true;
  }

  // ---- 3) 尾部星期几：周三 / 星期五 / 礼拜三 ----
  s = stripParticle(s);
  m = /(?:周|星期|礼拜)\s*([一二三四五六日天1-7])$/.exec(s);
  if (m) {
    wd = WD_CHAR[m[1]] || (/^[1-7]$/.test(m[1]) ? Number(m[1]) : null);
    if (wd) { s = s.slice(0, m.index); hit = true; }
  }

  /*
   * ---- 3b) 尾部「几号 / 几日」：明年12月5号 ----
   * 原来只剥到月，没有日这一层，所以「明年12月5号」整条失败
   * （剩下「明年12月5」里的 5 无处可去）。
   * 必须在**剥月之前**先剥日，否则「5号」会被当成月份的一部分。
   */
  s = stripParticle(s);
  m = /(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*(?:号|日)$/.exec(s);
  if (m) {
    const dd = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (dd !== null && isFinite(dd) && dd >= 1 && dd <= 31) {
      day = dd;
      s = s.slice(0, m.index);
      hit = true;
    }
  }

  // ---- 4) 第N周 ----
  s = stripParticle(s);
  m = /第\s*(\d+|[零〇一二两三四五六七八九十]+)\s*周$/.exec(s);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (n && n >= 1 && n <= 53) { week = n; s = s.slice(0, m.index); hit = true; }
  }

  /*
   * ---- 4b) 尾部「月底 / 月初」：明年12月底 ----
   * 必须在剥月**之前**：「12月底」的「月」属于这个整体，
   * 先剥月会把「底」剩下来，导致整条判失败。
   */
  s = stripParticle(s);
  const me = /(月底|月末|月初)$/.exec(s);
  if (me) {
    monthEdgeFlag = /初$/.test(me[1]) ? 'start' : 'end';
    /*
     * 只剥掉「底 / 末 / 初」，**保留「月」**。
     * 连「月」一起剥的话下面第 5 步就找不到月份标记，「明年12月底」会判失败。
     */
    s = s.slice(0, me.index) + '月';
    hit = true;
  }

  // ---- 5) 月份：12月份 ----
  s = stripParticle(s);
  m = /(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*月\s*(份)?$/.exec(s);
  if (m) {
    const mo = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (mo >= 1 && mo <= 12) { month = mo; s = s.slice(0, m.index); hit = true; }
  }

  // ---- 6) 年份：明年 / 2027年 ----
  s = stripParticle(s);
  m = /(今年|明年|后年|去年|前年|(\d{4}))\s*年?$/.exec(s);
  if (m) {
    if (m[2]) year = Number(m[2]);
    else if (m[1] in YEAR_WORD) year = now.getFullYear() + YEAR_WORD[m[1]];
    if (year) { s = s.slice(0, m.index); hit = true; }
  }

  // 剥完还剩内容 → 说明有无法识别的片段，整体不认
  if (String(stripParticle(s)).replace(/[\s，,、]/g, '') !== '') return null;
  if (!hit) return null;

  // ---- 合成 ----
  let d;
  const y = year || now.getFullYear();

  if (week && wd) {
    d = weekOfYearDate(y, week, wd, settings);
  } else if (week) {
    d = weekOfYearDate(y, week, 1, settings); // 只有周数取该周一
  } else if (wd) {
    // 只有星期几：在当前月份（或指定月份）内找
    const baseDate = month ? new Date(y, month - 1, 1) : new Date(now.getTime());
    d = setWeekday(baseDate, wd, 0);
  } else if (month) {
    d = new Date(y, month - 1, day || 1);
    // 「明年12月底」：先定位到该月，再取月末/月初
    if (monthEdgeFlag) d = monthEdge(d, { monthEnd: monthEdgeFlag === 'end', monthStart: monthEdgeFlag === 'start' });
  } else if (day) {
    // 只有日没有月（「5号」）：补当前月，口径与 DAY_ONLY_RE 一致
    if (dayOnlyMode(settings) === 'off') return null;
    d = new Date(now.getFullYear(), now.getMonth(), day);
  } else if (year) {
    /*
     * 只有年份（「去年」「明年」）不在这里处理 —— 用户想要的是
     * 「去年同期 / 明年同期」而不是 1 月 1 日。
     * 返回 null 让 WORD_REL 的年份规则接管。
     */
    return null;
  } else {
    return null;
  }

  // 指定了月份但算出的日期不在该月 → 冲突，判失败（不返回看起来对其实错的日期）
  if (month && d.getMonth() !== month - 1) return null;

  // 时刻
  let hour = clock ? clock.hour : 0;
  const minute = clock ? clock.minute : 0;
  /*
   * 只有时段没有时刻（「2027年1月1日凌晨」）时给时段的默认小时，
   * 否则凌晨会落在 00:00 —— 那跟没写时段一样，白剥一段。
   */
  if (!clock && daypart) hour = daypartHour(daypart, settings);
  if (clock && daypart) {
    const t = TIME_OF_DAY.find((x) => x.key === daypart);
    // 下午/晚上且小时小于12 → +12
    if (t && t.pm && hour < 12) hour += 12;
  }
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** 月初 / 月末 *//** 月初 / 月末 */
function monthEdge(date, w) {
  const d = new Date(date.getTime());
  if (w.yearOffset) d.setFullYear(d.getFullYear() + w.yearOffset);
  if (w.monthOffset) d.setMonth(d.getMonth() + w.monthOffset);
  /*
   * 跨年写法（去年末 / 明年初）与跨月写法（上个月底）的锚点不同：
   *   「上个月底」= 偏移后**那个月**的最后一天
   *   「去年末」  = 那一年**12 月**的最后一天，不是"9 月末"
   * 所以只有单独跨年（没有 monthOffset）时才强制跳到 1 月 / 12 月。
   */
  const yearOnly = !!w.yearOffset && !w.monthOffset;
  if (w.monthStart) {
    if (yearOnly) d.setMonth(0);
    d.setDate(1);
    return d;
  }
  if (yearOnly) {
    d.setMonth(11);
    d.setDate(31);
    return d;
  }
  // 月末：下个月第 0 天即本月最后一天
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d;
}

function parseRelative(text, base, settings) {
  const pluginSettingsForParse = settings || null;
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  /*
   * 「当前时间 / 此刻 / 现在」→ 取**真实此刻**，不理基准。
   * 这类词问的就是"现在几点"，填基准进去语义就错了。
   */
  if (NOW_WORDS.test(raw)) return new Date();

  // 复合表达优先于单条规则：明年12月份的第49周周三下午2点
  const comp = parseComposite(raw, base, settings);
  if (comp) return comp;
  const now0 = base ? new Date(base.getTime()) : new Date();

  /*
   * ---- 0a) 周末 + 时段：周末晚上 ----
   * 「周末」在 WORD_REL 里是整词匹配，带时段就匹配不上了，
   * 而「周末晚上」是很常见的说法，所以单独收一条。
   */
  const weDp = /^周末(早上|早晨|上午|中午|正午|下午|傍晚|黄昏|晚上|夜里|深夜|凌晨)$/.exec(raw);
  if (weDp) {
    const d = resolveWeekday(now0, weekendDay(pluginSettingsForParse), 0, pluginSettingsForParse);
    const key = (splitDaypart(weDp[1]) || {}).key;
    if (key) d.setHours(daypartHour(key, pluginSettingsForParse), 0, 0, 0);
    return d;
  }

  // ---- 0) 星期几（必须最先，否则「上周五」会被「上周」吃掉）----
  const wk = parseWeekday(raw);
  if (wk) return resolveWeekday(now0, wk.wd, wk.wo, pluginSettingsForParse);

  // ---- 1) 口语相对日 + 可选时刻：明天5点 / 昨天下午3点 / 大后天5点半 ----
  const sw = splitWordDay(raw);
  if (sw) {
    const d = new Date(now0.getTime());
    d.setDate(d.getDate() + sw.dayOffset);
    if (sw.rest) {
      /*
       * 时刻要带时段一起判：「明晚8点」的 rest 只有「8点」，
       * 不把词根里的「晚上」传进去就会算成早上 8 点。
       */
      const clock = parseClockCN(sw.rest, sw.daypart);
      if (clock) {
        d.setHours(clock.hour, clock.minute, 0, 0);
        return d;
      }
      /*
       * 再试纯时段词：明天晚上 / 昨天早上。
       * 这里**不能返回 null** —— 「明天晚上」的日期是确定的（就是明天），
       * 跟「晚上」单独出现不同（后者没有日期锚点，给时刻才是编造）。
       * 既然日期锚点明确，时段小时照常应用，不受「时段名单独转换」开关限制；
       * 只有**没有日期锚点**的裸时段词才需要那个开关把关。
       */
      const dp2 = splitDaypartTail(sw.rest) || splitDaypart(sw.rest);
      if (dp2 && !String(dp2.rest || '').trim()) {
        d.setHours(daypartHour(dp2.key, pluginSettingsForParse), 0, 0, 0);
        return d;
      }
      // 剩余部分既不是时刻也不是时段（如「明天天气」）→ 不认，避免误判
      return null;
    }
    /*
     * 词根自带时段（明晚 / 今早 / 昨夜）：同样有日期锚点，直接给时段小时。
     * 「昨夜」= 昨天 23:00 而不是昨天的当前时刻，这才是「夜」的意思。
     */
    if (sw.daypart) {
      d.setHours(daypartHour(sw.daypart, pluginSettingsForParse), 0, 0, 0);
    }
    return d;
  }

  // ---- 2) 时段名 + 时刻：早上8点 / 晚上7点半 / 凌晨2点 ----
  // 时段单独出现（如「早上」）默认不转换，见 convertDaypartAlone()
  const dp = splitDaypart(raw);
  if (dp) {
    if (dp.rest) {
      const clock = parseClockCN(dp.rest, dp.key);
      if (clock) return withClock(now0, clock.hour, clock.minute, 0);
      return null;
    }
    if (convertDaypartAlone(pluginSettingsForParse)) {
      const h = daypartHour(dp.key, pluginSettingsForParse);
      return withClock(now0, h, 0, 0);
    }
    // 未开启单独转换时，时段词单独出现不识别（避免编造时刻）
    return null;
  }

  /*
   * ---- 2a) 纯时刻：8点 / 8点半 / 十点一刻 ----
   * 没有日期锚点，落在**基准日**（没基准就是今天）。
   * 12/24 小时制按 24 小时制理解：中文说「8点」默认是早上，
   * 真要指晚上会写「晚上8点」或「20点」，那时段/数字本身就写明了。
   */
  const bare = parseClockCN(raw);
  if (bare) return withClock(now0, bare.hour, bare.minute, 0);

  // ---- 2b) 纯英文口语（yesterday / next week …）----
  const w = WORD_REL.find((item) => item.re.test(raw));
  if (w) {
    let sign = 1;
    if (w.dirFromWord) sign = /^last/i.test(raw) ? -1 : 1;
    const d = new Date(now0.getTime());
    if (w.y) d.setFullYear(d.getFullYear() + sign * w.y);
    if (w.m) d.setMonth(d.getMonth() + sign * w.m);
    if (w.d) d.setDate(d.getDate() + sign * w.d);

    // 星期几 / 月底月初 / 固定月日
    // 「周末」的 wd 只是占位，真实值按用户在「时间口径」里选的来
    if (w.wd) {
      return resolveWeekday(d, w.weekend ? weekendDay(pluginSettingsForParse) : w.wd,
        w.wo || 0, pluginSettingsForParse);
    }
    if (w.monthEnd || w.monthStart) return monthEdge(d, w);
    if (w.fixedMonth) {
      d.setMonth(w.fixedMonth - 1);
      d.setDate(w.fixedDay);
      return d;
    }
    // 英文时段（this morning / last night …）
    if (w.daypart && convertDaypartAlone(pluginSettingsForParse)) {
      const h = daypartHour(w.daypart, pluginSettingsForParse);
      return withClock(d, h, 0, 0);
    }
    return d;
  }

  // ---- 2c) 英文句式：in 3 days / 3 days ago / in two weeks ----
  const enw = parseEnglishWeekday(raw);
  if (enw) return setWeekday(now0, enw.wd, enw.wo);

  const en = parseEnglishRelative(raw);
  if (en) return shiftByUnit(now0, en.unit, en.n, en.dir);

  // ---- 2d) 特殊量词：半小时后 / 一刻钟后 / 半天后 ----
  const hm = HALF_RE.exec(raw);
  if (hm) {
    const dir = /前/.test(hm[2] || '') ? -1 : 1;
    const word = hm[1];
    if (word.indexOf('刻') >= 0) return shiftByUnit(now0, '分钟', 15, dir);
    if (word.indexOf('半天') >= 0) return shiftByUnit(now0, '小时', 12, dir);
    // 半小时 / 半 → 30 分钟
    return shiftByUnit(now0, '分钟', 30, dir);
  }

  // ---- 3) 倒装：前两天 / 前三天 / 上一周 ----
  const pm = REL_PREFIX_RE.exec(raw);
  if (pm) {
    const pn = parseCNNumber(pm[2]);
    if (pn !== null && isFinite(pn)) return shiftByUnit(now0, pm[3], pn, -1);
  }

  /*
   * ---- 3b) 「过N天」：过两天 / 过三天 / 再过三天 ----
   * 方向固定是往后，所以单独一条，不塞进 REL_PREFIX_RE（那是往前）。
   * 刻意不收「过几天」：几是模糊量，转成具体日期等于编造。
   */
  const gm = GUO_RE.exec(raw);
  if (gm) {
    const gn = parseCNNumber(gm[1]);
    if (gn !== null && isFinite(gn)) return shiftByUnit(now0, gm[2], gn, 1);
  }

  // ---- 3c) 复合时长：一年零三天后 / 两年零一个月后 ----
  const zm = ZERO_RE.exec(raw);
  if (zm) {
    const ny = /^[\d.]+$/.test(zm[1]) ? Number(zm[1]) : parseCNNumber(zm[1]);
    const n2 = /^[\d.]+$/.test(zm[2]) ? Number(zm[2]) : parseCNNumber(zm[2]);
    if (ny !== null && n2 !== null && isFinite(ny) && isFinite(n2)) {
      const dir = zm[4] === '前' ? -1 : 1;
      const d = shiftByUnit(now0, '年', ny, dir);
      return d ? shiftByUnit(d, zm[3], n2, dir) : null;
    }
  }

  // ---- 4) 数量 + 单位：3天前 / 7天以后 / 二天后 / 两天后 / 第7天后 ----
  const m = REL_RE.exec(raw);
  if (!m) return null;

  /*
   * 「2026年」是**年份**，不是「2026 年后」——
   * 不拦会算出 4052 年这种离谱结果（实测发生过）。
   * 判据：单位是「年」且是四位数。说「3 年后」不会写成「2026年后」，
   * 四位数在「年」前面几乎必然是年份。
   */
  if (m[2] === '年' && /^\d{4}$/.test(m[1])) return null;

  /*
   * 数量既可能是中文（两天后），也可能是**小数**（1.5小时后）。
   * 中文数字解析器不吃小数点，所以阿拉伯数字走 Number，
   * 中文才交给 parseCNNumber —— 混在一起会让 1.5 解析成 null 而整条失败。
   */
  const n = /^[\d.]+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
  if (n === null || !isFinite(n)) return null;
  if (!isFinite(n)) return null;
  return shiftByUnit(now0, m[2], n, (m[4] || '').indexOf('前') >= 0 ? -1 : 1);
}

/** 按单位推进时间；月/年走日历加法，避免固定天数在月末、闰年出错 */
function shiftByUnit(now, unit, n, dir) {
  const d = new Date(now.getTime());
  if (unit === '秒') return new Date(d.getTime() + dir * n * 1000);
  if (unit === '分钟' || unit === '分') return new Date(d.getTime() + dir * n * 60000);
  if (unit === '小时' || unit === '时') return new Date(d.getTime() + dir * n * 3600000);
  if (unit === '天' || unit === '日') return new Date(d.getTime() + dir * n * 86400000);
  if (unit === '周' || unit.indexOf('星期') >= 0) {
    return new Date(d.getTime() + dir * n * 7 * 86400000);
  }
  if (unit.indexOf('刻') >= 0) {
    return new Date(d.getTime() + dir * n * 15 * 60000);
  }
  if (unit.indexOf('月') >= 0) {
    d.setMonth(d.getMonth() + dir * n);
    return d;
  }
  if (unit === '年') {
    d.setFullYear(d.getFullYear() + dir * n);
    return d;
  }
  return null;
}

/**
 * 解析「节气 → 日期」的请求：立春 / 2026年立春 / 2027 立春。
 * @returns {{year:number,index:number,name:string}|null}
 */
function parseTermRequest(text, base) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  /*
   * 年份先剥掉，剩下的必须**恰好等于**某个节气名。
   * 用 indexOf 模糊搜会把「清明上河图」「冬至饺子」这类含节气字的
   * 普通文本也算成节气日期 —— 宁可不认，也不要编一个日期出来。
   */
  let year = null;
  const ym = /^(\d{4})\s*年?/.exec(s);
  let rest = s;
  if (ym) {
    year = Number(ym[1]);
    rest = s.slice(ym[0].length).trim();
  }
  const index = lunar.SOLAR_TERMS.indexOf(rest);
  if (index < 0) return null;
  if (year === null || !isFinite(year)) {
    year = (base ? base.getFullYear() : new Date().getFullYear());
  }

  /*
   * 节气跨月：第 n 个节气落在第 floor(n/2)+1 月（小寒、大寒在 1 月）。
   * 具体是几号由 termDay 用天文黄经算，不是查固定表，闰年也不偏。
   */
  const day = lunar.termDay(year, index);
  const date = day > 0 ? safeDate(year, Math.floor(index / 2) + 1, day) : null;
  return { year, index, name: lunar.SOLAR_TERMS[index], date };
}

/**
 * 解析干支：丙午 / 丙午年 / 丙午马年。
 * 干支 60 年一轮，返回**最接近今年**的公历年份。
 * @returns {{year:number,gan:string,zhi:string,animal:string}|null}
 */
function parseGanzhi(text) {
  const s = String(text ?? '').trim();
  const m = /^([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])(?:年)?(?:[鼠牛虎兔龙蛇马羊猴鸡狗猪]年?)?$/.exec(s);
  if (!m) return null;

  const gi = lunar.GAN.indexOf(m[1]);
  const zi = lunar.ZHI.indexOf(m[2]);
  if (gi < 0 || zi < 0) return null;

  // 天干 10 与地支 12 的最小公倍数约束：奇偶必须一致才构成有效干支
  if (gi % 2 !== zi % 2) return null;

  const thisYear = new Date().getFullYear();
  let best = null;
  let bestGap = Infinity;
  for (let y = lunar.MIN_YEAR; y <= lunar.MAX_YEAR; y++) {
    if ((y - 4) % 10 !== gi || (y - 4) % 12 !== zi) continue;
    const gap = Math.abs(y - thisYear);
    if (gap < bestGap) { bestGap = gap; best = y; }
  }
  if (best === null) return null;
  return { year: best, gan: m[1], zhi: m[2], animal: lunar.zodiac(best) };
}

/* ------------------------------------------------------------------ *
 * 转换计算：纯函数，输入文本 + 配置，输出字符串或 null
 * ------------------------------------------------------------------ */

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 相对时间：3 天前 / 2 小时后。
 *
 * @param {Date} date 目标时间
 * @param {Date} [base] 基准时间，留空用「现在」。
 *   必须能指定基准，否则「3 天前」的含义会随查看时刻变化 ——
 *   笔记里写下的相对描述过几天再看就对不上了。
 * @param {boolean} [withNote] 是否在结果里附上「（相对 …）」的说明
 */
function toRelative(date, base, withNote) {
  const baseMs = base ? base.getTime() : Date.now();
  const diffMs = date.getTime() - baseMs;
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;
  const suffix = future ? '后' : '前';

  let text;
  const mins = Math.round(abs / 60000);
  if (mins < 1) text = '刚刚';
  else if (mins < 60) text = `${mins} 分钟${suffix}`;
  else {
    const hours = Math.round(abs / 3600000);
    if (hours < 24) text = `${hours} 小时${suffix}`;
    else {
      const days = Math.round(abs / 86400000);
      if (days < 30) text = `${days} 天${suffix}`;
      else {
        const months = Math.round(days / 30);
        if (months < 12) text = `${months} 个月${suffix}`;
        else text = `${Math.round(days / 365)} 年${suffix}`;
      }
    }
  }

  if (!withNote) return text;

  /*
   * 基准说明：留空时必须带上当前时刻。
   * 只写「（相对 现在）」的话，笔记过几天回看就不知道"现在"是哪天了 ——
   * 相对描述会彻底失去参照。
   */
  const note = base
    ? fmt(null, base, 'YYYY-MM-DD HH:mm')
    : `现在 ${fmt(null, new Date(), 'YYYY-MM-DD HH:mm')}`;
  return `${text}（相对 ${note}）`;
}

/** 用插件统一的 moment 格式化，格式非法时降级为原始 ISO */
/**
 * 把格式串里的秒去掉（不精确到秒时）。
 * 只处理 moment 的秒标记 ss / s / SSS / S，其余原样保留。
 * 放在这里是为了让所有输出统一降精度：新增格式会自动遵循，不用逐个改。
 */
function dropSeconds(format) {
  return String(format)
    .replace(/ss/g, '')
    .replace(/(^|[^A-Za-z])s(?![A-Za-z])/g, '$1')
    .replace(/S+/g, '')
    .replace(/秒/g, '')      // 中文格式里的「秒」字一并去掉，否则会留下孤字
    .replace(/\s+$/, '')
    .trim()
    // 去掉秒后可能留下 : . - 之类的孤零零分隔符，循环清掉尾部
    .replace(/[\s:：.,，、\-]+$/g, '');
}

/**
 * 统一格式化出口。
 * 精度开关在这里生效：关闭「精确到秒」时，连用户自定义格式里的秒也会被去掉，
 * 避免「明明关了却还有秒」的不一致感。
 */
function fmt(plugin, date, format) {
  let f = String(format ?? '');
  const ts = plugin && plugin.settings && plugin.settings.timestamp;
  const ext = ts && ts.extensions;
  if (ext && ext.preciseToSecond === false) f = dropSeconds(f);

  try {
    const out = obsidian.moment(date.getTime()).format(f);
    return out && out !== 'Invalid date' ? out : date.toISOString();
  } catch (e) {
    return date.toISOString();
  }
}

/** 计算单个转换项的结果；算不出来返回 null */
/* ================= 撤回标记（可点击，仅内存） ================= */
/*
 * 转换后在结果后面挂一个**可点击**的标记，点一下还原成原格式。
 *
 * 为什么不用「把标记写进正文」：
 *   正文里的字符会随笔记一起保存，关闭 Obsidian 后标记还在，
 *   但还原所需的原文只存在内存——那时点击就是个死标记。
 * 所以标记必须是**编辑器的装饰（widget）**，不占正文字符，
 * 关闭 Obsidian 后自然消失，与内存数据的生命周期一致。
 *
 * 数据红线：只在内存，不写 data.json，插件卸载 / 关闭时全部清除。
 * 双重限量防膨胀：每篇笔记 100 个、最多 50 篇，超出清最旧的。
 */
const UNDO_PER_NOTE = 100;
const UNDO_MAX_NOTES = 50;
/** id → 记录 */
const undoMarks = new Map();
/** 笔记路径 → 记录数组（按插入顺序） */
const undoByNote = new Map();
let undoSeq = 0;

/** 当前笔记路径（取不到就用 '__unknown__'） */
function currentNotePath(app) {
  try {
    const f = app && app.workspace && app.workspace.getActiveFile && app.workspace.getActiveFile();
    return (f && f.path) || '__unknown__';
  } catch (e) {
    return '__unknown__';
  }
}

/** 清掉一条记录的装饰并移除索引（不动正文） */
function disposeUndo(rec) {
  if (!rec) return;
  try { if (rec.textMark) rec.textMark.clear(); } catch (e) { /* 已失效 */ }
  try { if (rec.widgetMark) rec.widgetMark.clear(); } catch (e) { /* 已失效 */ }
  // CM6：发删除 effect 撤掉装饰
  if (rec.view && rec.markId && CM6.delEffect) {
    try { rec.view.dispatch({ effects: CM6.delEffect.of(rec.markId) }); } catch (e) { /* 已失效 */ }
  }
  undoMarks.delete(rec.id);
}

/* ================= 撤回记录（纯内存，不依赖任何编辑器 API） ================= */
/*
 * 这一层**必须独立于装饰存在**。
 *
 * 之前把「记录」写在「装饰成功」之后，结果 CM6 装饰在当前环境挂不上时，
 * 记录也跟着没写 —— 撤回命令和按钮**一起失效**，用户连退路都没有
 * （v2.32.0 实测：提示「这篇笔记没有可撤回的时间转换了」）。
 *
 * 正确顺序：先记录（纯内存，永不失败），再尝试挂装饰（失败也无妨）。
 * 撤回定位只用 Obsidian 的 editor 接口（getLine / setSelection / replaceSelection），
 * 不碰 CodeMirror，所以一定能用。
 */
function recordUndoEntry(plugin, entry) {
  const path = currentNotePath(plugin.app);
  const rec = {
    id: ++undoSeq,
    path,
    /*
     * 保存 editor 引用：点击按钮时不一定能取到「当前活动编辑器」
     * （焦点可能在弹窗/别的面板上），靠它才不会定位到错的笔记。
     */
    editor: entry.editor || null,
    line: entry.line,
    fromCh: entry.fromCh,      // 结果文本起始列（可能随编辑偏移，仅作起点）
    searchText: entry.searchText, // 结果文本（含追加模式的前导空格）
    replaceWith: entry.replaceWith, // 原格式（覆盖模式）或 ''（追加模式）
    /*
     * original：撤回后要还原成的文本（== replaceWith）。
     * 之前这个字段只在 attachUndoWidget 的参数里传、**从不落进记录**，
     * 而 cm6Restore 恰好读 rec.original —— CM6 路径撤回会插入 undefined。
     */
    original: entry.original != null ? entry.original : entry.replaceWith,
    markId: null,              // 装饰 id（挂上了才有）
    view: null,
    textMark: null,
    widgetMark: null,
  };
  undoMarks.set(rec.id, rec);

  let list = undoByNote.get(path);
  if (!list) { list = []; undoByNote.set(path, list); }
  list.push(rec);
  while (list.length > UNDO_PER_NOTE) disposeUndo(list.shift());
  while (undoByNote.size > UNDO_MAX_NOTES) {
    const oldestKey = undoByNote.keys().next().value;
    const oldest = undoByNote.get(oldestKey) || [];
    while (oldest.length) disposeUndo(oldest.pop());
    undoByNote.delete(oldestKey);
  }
  return rec;
}

/**
 * 撤回一条记录：按「行号 + 文本查找」定位，只走 Obsidian editor 接口。
 * 先按记录列号找，找不到就整行找 —— 前面插入过文字时列号会偏，
 * 但文本是唯一的，所以整行兜底能救回来。
 */
function restoreEntry(plugin, editor, rec) {
  const line = typeof editor.getLine === 'function' ? editor.getLine(rec.line) : null;
  if (typeof line !== 'string') return false;

  let start = -1;
  if (typeof rec.fromCh === 'number' && rec.fromCh <= line.length) {
    if (line.indexOf(rec.searchText, rec.fromCh) === rec.fromCh) start = rec.fromCh;
  }
  if (start < 0) {
    /*
     * 整行兜底**必须唯一**：命中多处时拒绝执行。
     *
     * 之前取第一个匹配就动手 —— 撤回前面一条后，后面记录的 fromCh 会失效，
     * 一旦行里还有另一处相同文本（比如两处转换结果一样），
     * 替换就落到**错误的那一处**，正文被改坏且不可逆（BUG-1）。
     * 「改错地方」比「撤回失败」严重得多，所以宁可失败。
     */
    const first = line.indexOf(rec.searchText);
    if (first >= 0 && line.indexOf(rec.searchText, first + 1) < 0) start = first;
  }
  if (start < 0) return null;

  editor.setSelection(
    { line: rec.line, ch: start },
    { line: rec.line, ch: start + rec.searchText.length }
  );
  editor.replaceSelection(rec.replaceWith);
  // 返回实际落点与长度差，供调用方校正后续记录（BUG-1 偏移校正）
  return { start, delta: rec.replaceWith.length - rec.searchText.length };
}

/**
 * 撤回一条后，校正**同一行、其后**所有记录的列号。
 *
 * 替换会让该行长度变化 delta，排在后面的记录 fromCh 全部失效。
 * 不校正就只能靠整行 indexOf 兜底 —— 行内有重复文本时会命中错误位置。
 */
function shiftUndoRecords(rec, delta) {
  if (!delta || !rec) return;
  const list = undoByNote.get(rec.path);
  if (!list) return;
  for (const r of list) {
    if (r === rec || r.line !== rec.line) continue;
    if (typeof r.fromCh === 'number' && r.fromCh > rec.fromCh) r.fromCh += delta;
  }
}

/** 取出 CodeMirror 实例；拿不到就挂不了标记 */
function cmOf(editor) {
  if (!editor) return null;
  return editor.cm || (editor.getDoc && editor.getDoc().cm) || null;
}

/* ================= CM6 撤回标记 ================= */
/*
 * Obsidian 1.x 用的是 **CodeMirror 6**，editor.cm 是 EditorView，
 * **没有 markText**（那是 CM5 的 API）。上一版只用 CM5 写法，
 * 结果在真实环境里 attachUndoWidget 直接失败、标记永远不显示 —— 实测确认。
 *
 * CM6 要在编辑器里显示装饰，必须：
 *   1. 用 @codemirror/state 定义 StateField + StateEffect
 *   2. 用 @codemirror/view 的 Decoration / WidgetType 造 DOM
 *   3. 通过 plugin.registerEditorExtension 注册（load 阶段）
 *   4. 用 view.dispatch({ effects }) 增删
 * 装饰会随文档改动自动 map，所以位置不用自己维护。
 */
let cm6 = null; // null=未尝试 false=不可用 {state, view}
function loadCm6() {
  if (cm6 !== null) return cm6;
  try {
    cm6 = {
      state: require('@codemirror/state'),
      view: require('@codemirror/view'),
    };
  } catch (e) {
    // 环境里没有 CM6（如测试沙盒），退回 CM5 写法
    cm6 = false;
    setUndoFail('无法 require @codemirror/state 或 @codemirror/view', e);
  }
  return cm6;
}

const CM6 = {
  field: null,
  addEffect: null,
  delEffect: null,
  built: false,
};

/** 构建 CM6 扩展；返回可直接 registerEditorExtension 的数组 */
function buildCm6Extension() {
  const m = loadCm6();
  if (!m) return null;
  /*
   * 缓存只在**成功**时生效。
   * 之前无条件 return 缓存，导致首次构建失败（如 WidgetType 还没拿到）
   * 后永远返回 undefined —— 后续转换全都不显示图标（实测踩过）。
   */
  if (CM6.built && CM6.field) return [CM6.field];
  try {
    CM6.addEffect = m.state.StateEffect.define();
    CM6.delEffect = m.state.StateEffect.define();
    const addEffect = CM6.addEffect;
    const delEffect = CM6.delEffect;

    CM6.field = m.state.StateField.define({
      create() {
        return m.view.Decoration.none;
      },
      update(deco, tr) {
        // 先随文档改动平移，再套用本次的增删
        deco = deco.map(tr.changes);
        for (const e of tr.effects) {
          if (e.is(addEffect)) {
            const v = e.value;
            const mark = m.view.Decoration.mark({
              class: 'tt-undo-target',
              undoId: v.id,
            }).range(v.from, v.to);
            const badge = m.view.Decoration.widget({
              widget: new UndoBadgeWidget(v.recId, v.original, v.symbol),
              side: 1,
              undoId: v.id,
            }).range(v.to);
            deco = deco.update({ add: [mark, badge], sort: true });
          } else if (e.is(delEffect)) {
            deco = deco.update({
              filter: (f, t, d) => !(d.spec && d.spec.undoId === e.value),
            });
          }
        }
        return deco;
      },
      provide: (f) => m.view.EditorView.decorations.from(f),
    });
    UndoBadgeWidget = makeUndoBadgeClass(m.view);
    CM6.built = true;
    return [CM6.field];
  } catch (e) {
    console.error('[Time Tools] CM6 扩展构建失败', e);
    return null;
  }
}

/** 撤回标记的固定图标（Obsidian 内置，不依赖字体、不可自定义） */
const UNDO_ICON = 'lucide-undo-2';

/*
 * 最后一次挂载失败的原因。
 * 之前失败只打 console.error，界面上看不到 —— 用户只能看到「图标没出现」，
 * 无从判断是模块没拿到、扩展没注册上、还是位置算错。现在记进 lastUndoFailReason，
 * 由测试断言（不再弹窗口占用命令面板）。
 */
let lastUndoFailReason = '';
function setUndoFail(reason, err) {
  lastUndoFailReason = reason + (err && err.message ? '（' + err.message + '）' : '');
}

/*
 * 撤回用的插件实例。
 * widget 的 toDOM() 拿不到 plugin（它只在 CM6 内部被构造），
 * 点击时又必须调用插件的撤回逻辑，所以在这里存一份。
 */
/**
 * 取扩展配置，带三层防御判空。
 * 为什么不直接写 settings.timestamp.extensions：配置可能来自旧版本、
 * 迁移失败或部分损坏，任一层缺失都会让解析抛错，
 * 而解析失败的表现是「面板空白」，很难定位。统一走这里最稳。
 */
function extOf(settings) {
  const ts = settings && settings.timestamp;
  return (ts && ts.extensions) || null;
}

let undoHostPlugin = null;

/* ================= 状态栏撤回指示器 ================= */
/*
 * 为什么必须有它：
 *   结果后面的图标依赖 CM6 装饰，在部分环境挂不上（已连着几版没出来）。
 *   而**命令**虽然一定能用，但藏得深、没有可见入口 ——
 *   用户看不到「现在有几处可以撤回」，也容易以为功能没生效。
 *
 * 状态栏指示器只用 Obsidian 自带 API，**不依赖任何编辑器装饰**，
 * 所以 100% 能显示。它同时充当：
 *   · 可见的撤回入口（点击撤最近一次）
 *   · 数量提示（当前笔记还有几处可撤回）
 */
let undoStatusEl = null;

function initUndoIndicator(plugin) {
  if (typeof plugin.addStatusBarItem !== 'function') return;
  try {
    undoStatusEl = plugin.addStatusBarItem();
    undoStatusEl.addClass('tt-undo-status');
    undoStatusEl.setAttribute('title', '点击撤回最近一次时间转换');
    undoStatusEl.addEventListener('click', () => {
      undoLast(plugin);
    });
    refreshUndoIndicator(plugin);
  } catch (e) {
    undoStatusEl = null;
  }
}

/** 刷新指示器：开关关闭或没有可撤回项时隐藏 */
function refreshUndoIndicator(plugin) {
  if (!undoStatusEl) return;
  const ext = plugin && plugin.settings && plugin.settings.timestamp
    ? plugin.settings.timestamp.extensions : null;
  // 两个开关都要满足：总开关 + 撤回开关。以前只看后者，关了总开关状态栏数字还在
  const on = extEnabled(plugin) && ext && ext.undoHintEnabled !== false;
  const n = on ? undoCount(plugin) : 0;
  if (!n) {
    undoStatusEl.style.display = 'none';
    return;
  }
  undoStatusEl.style.display = '';
  undoStatusEl.empty();
  undoStatusEl.createSpan({ cls: 'tt-undo-status-icon' });
  undoStatusEl.createSpan({ text: String(n) });
  try {
    obsidian.setIcon(undoStatusEl.querySelector('.tt-undo-status-icon'), UNDO_ICON);
  } catch (e) { /* 无 setIcon 时退化成纯数字 */ }
}

/** 撤回标记的 widget（CM6） */
class UndoBadgeWidgetBase {
  constructor(id, original, symbol) {
    this.id = id;
    this.original = original;
    this.symbol = symbol;
  }
  eq(other) {
    return other.id === this.id && other.original === this.original;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'tt-undo-badge';
    span.setAttribute('title', '点击撤回为原格式：' + this.original);
    span.setAttribute('contenteditable', 'false');
    /*
     * 用 Obsidian 内置图标（SVG）而不是自定义字符。
     * 自定义字符依赖字体，缺字形时**什么都不显示**，
     * 表现为「开关开着但没符号」（实测踩过）。SVG 不依赖字体。
     */
    try {
      obsidian.setIcon(span, UNDO_ICON);
    } catch (e) {
      span.textContent = '\u21a9'; // 兜底：还是画不出来就退回字符
    }
    span.addEventListener('click', (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (ev && ev.stopPropagation) ev.stopPropagation();
      /*
       * 必须走 restoreUndo（记录层），不能直接 cm6Restore（装饰层）。
       * this.id 是**记录 id**，而装饰的 undoId 是**装饰 id**，两者不同 ——
       * 直接 cm6Restore 会按记录 id 去找装饰，找不到就放弃，
       * 表现为「点了没反应，且记录被清掉」（实测）。
       * restoreUndo 内部先走记录层（行号+文本），失败才退回装饰层。
       */
      restoreUndo(undoHostPlugin, this.id);
    });
    return span;
  }
  ignoreEvent() {
    return false; // 需要接收点击
  }
}

/*
 * 真实 CM6 会检查 widget 的类型，用鸭子类型不保险，
 * 必须在拿到 WidgetType 基类后动态继承。拿不到就退回鸭子类型
 * （至少 toDOM / eq 齐全，多数场景仍可用）。
 */
function makeUndoBadgeClass(viewMod) {
  const Base = viewMod && viewMod.WidgetType ? viewMod.WidgetType : Object;
  return class extends Base {
    constructor(id, original, symbol) {
      super();
      this.id = id;
      this.original = original;
      this.symbol = symbol;
    }
    eq(other) { return other && other.id === this.id && other.original === this.original; }
    toDOM() { return UndoBadgeWidgetBase.prototype.toDOM.call(this); }
    ignoreEvent() { return false; }
  };
}
let UndoBadgeWidget = UndoBadgeWidgetBase;

/**
 * 把 Obsidian 的 {line, ch} 位置转成 CM6 的**数字偏移**。
 * CM6 的 doc API 用的是整数偏移，直接传 {line,ch} 对象会导致
 * 比较、切片全部失效（区间查不到 → 点了没反应）。
 */
function cm6Pos(view, pos) {
  if (typeof pos === 'number') return pos;
  if (!pos || typeof pos.line !== 'number') return 0;
  try {
    const doc = view.state.doc;
    const n = Math.min(Math.max(pos.line + 1, 1), doc.lines);
    const line = doc.line(n);
    const ch = typeof pos.ch === 'number' ? pos.ch : 0;
    return Math.max(line.from, Math.min(line.from + ch, line.to));
  } catch (e) {
    return 0;
  }
}

/** CM6：取当前文档里某个 undoId 的 mark 区间 */
function cm6RangeOf(view, id) {
  let range = null;
  try {
    const set = view.state.field(CM6.field);
    set.between(0, view.state.doc.length, (from, to, deco) => {
      if (!range && deco.spec && deco.spec.undoId === id && to > from) {
        range = { from, to };
      }
    });
  } catch (e) { /* 字段不存在 */ }
  return range;
}

/** CM6：还原某条记录 */
function cm6Restore(id) {
  const rec = undoMarks.get(id);
  if (!rec || !rec.view) return false;
  const view = rec.view;
  /*
   * 装饰的 undoId 是**装饰 id**（rec.markId），不是记录 id。
   * 用记录 id 去找装饰永远找不到 —— 之前就是这么错的。
   */
  const markId = rec.markId != null ? rec.markId : id;
  const range = cm6RangeOf(view, markId);
  if (!range) {
    // 装饰已失效，清掉记录即可
    try { view.dispatch({ effects: CM6.delEffect.of(markId) }); } catch (e) { /* 已失效 */ }
    return false;
  }
  // original 可能为空串（追加模式），空串是合法值，只能用 != null 判断
  const back = rec.original != null ? rec.original : rec.replaceWith;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: back },
    effects: CM6.delEffect.of(markId),
  });
  disposeUndo(rec);
  removeFromNoteList(rec);
  try {
    new obsidian.Notice('已撤回为原格式');
  } catch (e) { /* 环境无 Notice */ }
  return true;
}

/**
 * 在结果后面挂一个可点击的撤回标记。
 * 优先 CM6（Obsidian 1.x 实际用的），拿不到再退 CM5。
 * 返回是否成功；失败时静默——绝不往正文写字符。
 */
function attachUndoWidget(plugin, editor, from, to, original, markText, rec) {
  if (plugin) undoHostPlugin = plugin;
  // 总开关关闭时不挂撤回标记（以前只判撤回开关，关了总开关装饰照样挂）
  if (!extEnabled(plugin)) return false;
  const m = loadCm6();
  const view = editor && editor.cm;

  // ---- CM6 ----
  if (m && CM6.built && view && typeof view.dispatch === 'function' && view.state) {
    try {
      /*
       * 幂等：同一条记录重复挂装饰前先清掉旧的。
       * 之前无条件 add，同一 rec 挂两次就会有两个 widget ——
       * 表现是「越早的转换图标越多」（BUG-1 症状一）。
       */
      if (rec && rec.markId != null && CM6.delEffect) {
        try { view.dispatch({ effects: CM6.delEffect.of(rec.markId) }); } catch (e) { /* 已失效 */ }
      }
      const id = ++undoSeq;
      // CM6 用数字偏移，先把 {line, ch} 转过去
      const fromPos = cm6Pos(view, from);
      const toPos = cm6Pos(view, to);
      if (toPos <= fromPos) return false;
      view.dispatch({
        effects: CM6.addEffect.of({
          id, from: fromPos, to: toPos, original, symbol: markText,
          recId: rec ? rec.id : id, // widget 点击要回到记录 id
        }),
      });
      /*
       * 自检：dispatch 不报错不代表装饰生效 ——
       * field 没注册到这个 view 时 effect 会被直接忽略，静默失败。
       * 这里立刻回读一次，确认装饰真的在，否则报错便于定位。
       */
      const ok = cm6RangeOf(view, id);
      if (!ok) {
        setUndoFail('装饰未写入（registerEditorExtension 未生效或 CM6 版本不匹配）');
        console.error('[Time Tools] 撤回标记未生效：装饰未写入');
        return false;
      }
      // 记录已由调用方写入，这里只回填装饰信息，用于后续清除
      if (rec) {
        rec.markId = id;   // 装饰 id，用于清除装饰
        rec.view = view;
        // widget 点击要回到**记录 id**，否则 undoMarks 查不到（实测踩过）
        rec.widgetId = rec.id;
      }
      return true;
    } catch (e) {
      setUndoFail('CM6 挂载异常', e);
      console.error('[Time Tools] CM6 撤回标记挂载失败', e);
      return false;
    }
  }

  // ---- CM5（老版本 / 测试环境）----
  const cm = cmOf(editor);
  if (!cm || typeof cm.markText !== 'function') {
    setUndoFail('CM6 不可用且编辑器无 markText（CM5 API）');
    return false;
  }
  if (typeof document === 'undefined' || !document.createElement) return false;
  try {
    const id = ++undoSeq;
    const btn = document.createElement('span');
    btn.className = 'tt-undo-badge';
    btn.setAttribute('title', '点击撤回为原格式：' + original);
    try {
      obsidian.setIcon(btn, UNDO_ICON);
    } catch (e) {
      btn.textContent = '\u21a9';
    }
    btn.setAttribute('data-tt-undo', String(id));
    btn.setAttribute('contenteditable', 'false');

    const textMark = cm.markText(from, to, { className: 'tt-undo-target' });
    const widgetMark = cm.markText(to, to, { replacedWith: btn });
    if (rec) {
      rec.markId = id;
      rec.cm = cm;
      rec.textMark = textMark;
      rec.widgetMark = widgetMark;
    }
    // 点击要回到**记录 id**，不能用装饰 id —— 两者不同，查不到记录（实测踩过）
    const restoreId = rec ? rec.id : id;
    btn.addEventListener('click', (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (ev && ev.stopPropagation) ev.stopPropagation();
      restoreUndo(plugin, restoreId);
    });
    return true;
  } catch (e) {
    setUndoFail('CM5 挂载异常', e);
    console.error('[Time Tools] 撤回标记挂载失败', e);
    return false;
  }
}

/**
 * 还原一条。
 * 优先走**记录层**（行号 + 文本查找，纯 Obsidian editor 接口，一定能用）；
 * 记录层定位不到（文本已被别处改掉）时，才退回装饰层的位置信息。
 */
function restoreUndo(plugin, id, editor) {
  const rec = undoMarks.get(id);
  if (!rec) return false;

  const ed = editor || rec.editor || activeEditor(plugin.app);
  let res = null;
  if (ed && typeof ed.getLine === 'function') {
    res = restoreEntry(plugin, ed, rec);
  }
  if (!res && rec.view) {
    if (cm6Restore(id)) res = { start: -1, delta: 0 }; // CM6 自行改文档，无偏移可校
  }
  if (!res && rec.cm && rec.textMark && rec.textMark.find) {
    const pos = rec.textMark.find();
    if (pos) {
      const back = rec.original != null ? rec.original : rec.replaceWith;
      rec.cm.replaceRange(back, pos.from, pos.to);
      res = { start: -1, delta: 0 };
    }
  }
  if (!res) {
    /*
     * 定位失败时**不再清记录**，只标记 unresolvable。
     *
     * 旧行为是「清掉记录，别留死按钮」——那是为**顺序撤回**设计的：
     * 最后一条撤完本就该清。但乱序撤回时，清掉的是**还没撤的中间记录**，
     * 等于那处转换永久不可逆（BUG-1 症状二）。
     * 保留后：记录数不变、状态栏 N 不变、unresolvable 计数里可见，文本若被改回来仍能撤。
     */
    rec.unresolvable = true;
    refreshUndoIndicator(plugin);
    return false;
  }
  if (res.delta) shiftUndoRecords(rec, res.delta);
  disposeUndo(rec);
  removeFromNoteList(rec);
  refreshUndoIndicator(plugin);
  try {
    new obsidian.Notice('已撤回为原格式');
  } catch (e) { /* 环境无 Notice */ }
  return true;
}

function removeFromNoteList(rec) {
  const list = undoByNote.get(rec.path);
  if (!list) return;
  const i = list.indexOf(rec);
  if (i >= 0) list.splice(i, 1);
  if (!list.length) undoByNote.delete(rec.path);
}

/** 撤回当前笔记最近一次转换（命令入口） */
function undoLast(plugin, editor) {
  const path = currentNotePath(plugin.app);
  const list = undoByNote.get(path);
  if (!list || !list.length) return false;
  return restoreUndo(plugin, list[list.length - 1].id, editor);
}

/** 当前笔记还有多少处可撤回 */
function undoCount(plugin) {
  const list = undoByNote.get(currentNotePath(plugin.app));
  return list ? list.length : 0;
}

/**
 * 有多少条记录**定位不到**（标记了 unresolvable）。
 * 这些仍占用计数、不删除 —— 乱序撤回时清掉它们会让那处转换永久不可逆。
 */
function unresolvableUndoCount() {
  let n = 0;
  undoMarks.forEach((r) => { if (r.unresolvable) n++; });
  return n;
}

/** 记录了多少篇笔记（自查用） */
function undoStackSize() {
  return undoByNote.size;
}

/** 清空（插件卸载时调用，确保不残留） */
function clearUndo(plugin) {
  undoMarks.forEach((rec) => {
    try { if (rec.textMark) rec.textMark.clear(); } catch (e) { /* 已失效 */ }
    try { if (rec.widgetMark) rec.widgetMark.clear(); } catch (e) { /* 已失效 */ }
  });
  undoMarks.clear();
  undoByNote.clear();
  if (plugin) refreshUndoIndicator(plugin);
}

/**
 * 撤回标记用哪个图标；开关关闭时返回空串（表示不挂标记）。
 * 图标**固定**，不再可自定义 —— 自定义字符缺字形时什么都不显示。
 */
function undoMarkOf(settings) {
  const ext = extOf(settings);
  if (!ext || ext.undoHintEnabled === false) return '';
  return UNDO_ICON;
}

/** 「统一格式」用的格式串；留空时跟随时间戳格式 */
function unifyFormatOf(settings) {
  const ext = extOf(settings);
  const own = ext && typeof ext.unifyFormat === 'string' ? ext.unifyFormat.trim() : '';
  if (own) return own;
  return (settings && settings.timestamp && settings.timestamp.format) || 'YYYY-MM-DD HH:mm:ss';
}

/**
 * 把一段文本解析成 Date，按「明确标记 → 农历 → 阳历 → 相对」的顺序尝试。
 * 统一格式要能吃下所有形态，所以需要这个统一入口。
 */
function resolveToDate(plugin, raw, options) {
  const settings = plugin.settings;
  const text = String(raw ?? '').trim();
  if (!text) return null;

  // 明确标了农历的先按农历算
  if (shouldTreatAsLunar(text, settings)) {
    const stripped = stripCalendarMark(text, settings).rest;
    const info = lunar.parseLunar(stripped);
    if (info) {
      const d = lunar.lunarToSolar(info.year, info.month, info.day, info.isLeap);
      if (d) return d;
    }
  }
  // 阳历 / 时间戳（含中文大写的阳历写法）
  const direct = parseToDate(text, settings);
  if (direct) return direct;

  /*
   * 节气 / 干支：这两个此前只在「转换项」里能用，选中「立春」做转换时却认不出，
   * 因为解析链里根本没有它们。表早就有了（SOLAR_TERMS、干支纪年），
   * 这里补上解析即可，不需要新增数据。
   * 农历总开关关掉时一并失效 —— 它们本就属于农历体系。
   */
  if (extOf(settings) && extOf(settings).lunarEnabled !== false) {
    const term = parseTermRequest(text, options && options.base);
    if (term && term.date) return term.date;
    const gz = parseGanzhi(text);
    if (gz && gz.year) {
      const base = options && options.base ? options.base : new Date();
      return safeDate(gz.year, base.getMonth() + 1, base.getDate());
    }
  }

  // 农历节日：大年初一 / 除夕 / 年三十
  if (extOf(settings) && extOf(settings).lunarEnabled !== false) {
    const fest = parseLunarFestival(text, options && options.base);
    if (fest) return fest;
  }

  // 相对 / 口语 / 复合
  return parseRelative(text, options && options.base, settings);
}

/*
 * 农历节日：大年初一 / 除夕 / 年三十。
 * 这几个**没有月份数字**，parseLunar 吃不下（它必须有月有日），
 * 所以在这里单独换算成「农历 X 月 Y 日」再交给 lunarToSolar。
 * 日期由天文算法算，不是查固定表 —— 「除夕」是腊月最后一天，
 * 该年腊月是 29 天还是 30 天每年不同，写死会错。
 */
function parseLunarFestival(text, base) {
  const s = String(text ?? '').trim().replace(/\s+/g, '');
  const ref = base || new Date();
  const info = lunar.solarToLunar(ref.getFullYear(), ref.getMonth() + 1, ref.getDate());
  if (!info) return null;
  const ly = info.year;

  // 大年初一 = 正月初一（春节）
  if (/^(大年初一|大年初一|年初一|正月初一)$/.test(s)) {
    return lunar.lunarToSolar(ly, 1, 1, false);
  }
  // 除夕 = 腊月最后一天
  if (/^除夕$/.test(s)) {
    const days = lunar.monthDays(ly, 12);
    return days ? lunar.lunarToSolar(ly, 12, days, false) : null;
  }
  // 年三十：该年腊月只有 29 天时**不存在**，返回 null 而不是溢出成下月初一
  if (/^年三十$/.test(s)) {
    if (lunar.monthDays(ly, 12) < 30) return null;
    return lunar.lunarToSolar(ly, 12, 30, false);
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 节日换算
 * ------------------------------------------------------------------ */

/**
 * 取用户自设节日（带缓存键：文本变了才重解析）。
 * 解析一次成本很低，但 compute 会为每个转换项各调一次，缓存省掉重复劳动。
 */
let customFestivalCache = { text: null, list: [] };
function customFestivalList(settings) {
  const ext = (settings && settings.timestamp && settings.timestamp.extensions) || {};
  const text = String(ext.customFestivals ?? '');
  if (customFestivalCache.text !== text) {
    customFestivalCache = { text, list: judge.parseCustomFestivals(text) };
  }
  return customFestivalCache.list;
}

/**
 * 算某个节日在指定年份的阳历日期。
 * @returns {Date|null} 该年不存在（如那年腊月没有三十）则返回 null
 */
function festivalDate(item, year) {
  if (!item || !year) return null;

  /* 阳历 */
  if (item.kind === 'solar') {
    // 带年份的自设节日只在那一年成立
    if (item.year && item.year !== year) return null;
    return validDate(year, item.month, item.day);
  }

  /* 第 N 个星期几：母亲节（5月第2个周日）这类 */
  if (item.kind === 'nth') {
    const first = new Date(year, item.month - 1, 1);
    if (first.getMonth() !== item.month - 1) return null;

    /*
     * 从月末往回数：11月最后一个周四 / 11月倒数第2个周四。
     * 「最后一个」= 倒数第 1 个，所以 nth 缺省按 1 处理（解析侧已兜底，这里再兜一次）。
     * 不能复用正向算法改个符号 —— 月末天数随月份变（28/29/30/31），
     * 必须先用 Date(year, month, 0) 取到真实天数，否则 2 月会算出负数。
     */
    if (item.fromLast) {
      const n = Math.max(1, item.nth || 1);
      const daysInMonth = new Date(year, item.month, 0).getDate();
      const lastDay = new Date(year, item.month - 1, daysInMonth);
      const back = (lastDay.getDay() - item.weekday + 7) % 7;
      const day = daysInMonth - back - (n - 1) * 7;
      return day >= 1 ? new Date(year, item.month - 1, day) : null;
    }

    const offset = (item.weekday - first.getDay() + 7) % 7;
    const d = new Date(year, item.month - 1, 1 + offset + (item.nth - 1) * 7);
    // 第 5 个星期几常常落在下个月，越界即视为不存在
    return d.getMonth() === item.month - 1 ? d : null;
  }

  /* 农历：现算，不查固定表（闰月年写死会错） */
  if (item.kind === 'lunar') {
    const day = item.day === null ? lunar.monthDays(year, item.month) : item.day;
    if (!day) return null;
    return lunar.lunarToSolar(year, item.month, day, !!item.isLeap);
  }
  return null;
}

/** 构造合法日期；年月日不合法（如 2 月 30 日）返回 null */
function validDate(y, m, d) {
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** 判断两个 Date 是否为同一天（不计时分秒） */
/* sameDay 取 timejudge 共享实现（judge.sameDay） */

/**
 * 查出某天是哪个节日。
 * 自设节日优先（用户可覆盖内置），其次阳历固定，最后农历浮动。
 * @returns {string|null} 节日名
 */
function festivalNameOf(date, settings) {
  const year = date.getFullYear();
  const custom = customFestivalList(settings);
  for (const it of custom) {
    if (judge.sameDay(festivalDate(it, year), date)) return it.name;
  }
  const jd = judge;
  for (const f of jd.SOLAR_FESTIVALS) {
    if (judge.sameDay(validDate(year, f.month, f.day), date)) return f.names[0];
  }
  for (const f of jd.LUNAR_FESTIVALS) {
    if (judge.sameDay(festivalDate({ kind: 'lunar', month: f.month, day: f.day }, year), date)) {
      return f.names[0];
    }
  }
  return null;
}

/** 去掉时分秒，只留日期（用于「今年已过」这类比较） */
function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 两个日期相差的天数（按自然日，不看时分秒）。
 * 用 UTC 毫秒差折算 —— 直接减本地时间戳会踩夏令时（有些日子只有 23 小时）。
 * @returns {number} to - from，正数表示 to 在 from 之后
 */
function diffDays(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

/**
 * 两个日期之间的工作日天数（只扣周六日）。
 *
 * 口径必须与 diffDays 一致 —— 都按「差值」算，不含首日：
 * 相差 N 天里的工作日，就该是这 N 天里的工作日，
 * 若天数不含首日、工作日却含首日，同一个区间会给出自相矛盾的两个数。
 *
 * 只扣周末：法定节假日每年不同且要人工维护表，不做（同 §12 不收「工作日」语义）。
 */
function workdaysBetween(from, to) {
  const n = diffDays(from, to);
  if (n <= 0) return 0;
  let count = 0;
  const cur = stripTime(from);
  for (let i = 1; i <= n; i++) {
    cur.setDate(cur.getDate() + 1);
    const w = cur.getDay();
    if (w !== 0 && w !== 6) count++;
  }
  return count;
}

/**
 * 从文本里找出两个日期（用于「日期差值」）。
 *
 * 扫描策略：逐位尝试 parseToDate，取**最长**的两次成功匹配。
 * 不能用简单 split —— 分隔符种类多（到、至、-、~、空格…），
 * 且「2026-01-01」内部自带分隔符，一切就碎了。
 *
 * @returns {{from:Date, to:Date}|null} 不足两个日期返回 null
 */
function parseDateRange(text) {
  const s = String(text || '');
  const found = [];
  let i = 0;
  while (i < s.length) {
    // 跳过连接词与空白，它们不是日期的起点
    const ch = s[i];
    if (/[\s到至~—－\-—,，、和与及]/.test(ch)) { i++; continue; }
    let best = null;
    // 从长到短试，优先匹配「2026-01-01」而不是「2026」
    for (let len = Math.min(24, s.length - i); len >= 4; len--) {
      const d = parseToDate(s.slice(i, i + len));
      if (d) { best = { d, len }; break; }
    }
    if (best) {
      found.push(best.d);
      i += best.len;
      if (found.length >= 2) break;
    } else {
      i++;
    }
  }
  if (found.length < 2) return null;
  const from = found[0];
  const to = found[1];
  if (diffDays(from, to) === 0) return null;
  return diffDays(from, to) < 0 ? { from: to, to: from } : { from, to };
}

/**
 * 查文本里的节日名。
 * 农历总开关关掉时，农历类节日一并失效 —— 它们本就属于农历体系，
 * 关掉后不该再给出「春节」这种结果。
 */
function findFestivalHit(raw, settings) {
  const ext = (settings && settings.timestamp && settings.timestamp.extensions) || {};
  const hit = judge.findFestival(raw, customFestivalList(settings));
  if (!hit) return null;
  if (hit.kind === 'lunar' && ext.lunarEnabled === false) return null;
  return hit;
}

/*
 * 自定义转换规则：让用户自己补充词表，或覆盖他认为不合适的结果。
 * 一行一条：被替换文本 操作符 结果
 *   =  替换（用「结果」顶掉内置转换结果；结果留空＝隐藏该项）
 *   +  追加（保留内置结果，后面再接一段）
 *   -  隐藏（这项不出现）
 *
 * 覆盖不等于抹除：内置规则永远在，用户规则只在其上生效。
 * 所以删掉用户规则后，内置结果会自动恢复，不需要「恢复默认」按钮。
 */
const USER_RULES_MAX = 200;     // 条数上限：解析是线性扫描，太多会拖慢转换
const USER_RULE_LEN_MAX = 200;  // 单条长度上限，超长直接丢弃而不是静默截断

/**
 * 解析规则文本。空行与 # 开头的行跳过，格式不对的行跳过（不报错、不中断）。
 * 按「被替换文本」长度降序：否则「大后天」会被「后天」抢先匹配，剩下个「大」字。
 */
function parseUserRules(text) {
  const out = [];
  if (typeof text !== 'string' || !text) return out;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.charAt(0) === '#') continue;
    if (line.length > USER_RULE_LEN_MAX) continue;
    /*
     * 两段式：先找**被分隔符隔开**的操作符，找不到再认紧贴写法（明天=后天）。
     * 不能只用非贪婪的 `.+?` —— 那样「2026-10-01 + 发货日」里的日期
     * 会被第一个 `-` 切断，from 变成 "2026"（实测踩到，见 _test/userrules.js）。
     */
    let m = line.match(/^(.+?)[\s\t|]+([=+\-])[\s\t|]*(.*)$/);
    if (!m) m = line.match(/^(.+)([=+\-])(.*)$/); // 紧贴写法：取最后一个操作符
    if (!m) continue;
    const from = m[1].trim();
    if (!from) continue;
    out.push({ from: from, op: m[2], to: String(m[3] || '').trim() });
    if (out.length >= USER_RULES_MAX) break;
  }
  out.sort((a, b) => b.from.length - a.from.length);
  return out;
}

/**
 * 在内置结果之上套用用户规则。
 * 匹配的是**用户选中的原文**，作用的是内置转换结果 —— 两者分开，
 * 才能做到「删掉规则即恢复内置」。
 * 命中即返回（已按长度排序，最长的先试），不叠加多条。
 */
function applyUserRules(raw, builtin, settings) {
  const ext = settings && settings.timestamp && settings.timestamp.extensions;
  if (!ext || !ext.userRules) return builtin;
  const rules = parseUserRules(ext.userRules);
  if (!rules.length) return builtin;
  const src = String(raw == null ? '' : raw).trim();
  if (!src) return builtin;
  const out = String(builtin);
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (src.indexOf(r.from) < 0) continue;
    if (r.op === '=') return r.to === '' ? null : r.to;  // 留空＝隐藏该项
    if (r.op === '+') return r.to === '' ? out : out + r.to;
    if (r.op === '-') return null;                        // 这项不出现
  }
  return out;
}

/**
 * 把用户规则套到「笔记名」上 —— 日历解析场景专用。
 *
 * 与 applyUserRules 的两点不同，都是刻意的：
 *   ① 开关独立（userRulesForCalendar，默认关）：两套解析共用一份规则会互相干扰，
 *      默认关才能保证「不打开就完全不影响已有的高亮 / 圆点结果」。
 *   ② `=` 在这里是**子串替换**而不是整体替换：主用途是剥掉旧命名里的多余后缀
 *      （如「-周五 = 」把 2026-09-25-周五 还原成 2026-09-25），
 *      整体替换会把整个名字清空，反而认不出来。
 *
 * @returns {{name:string, hide:boolean}} hide=true 表示规则要求忽略这个文件
 */
function applyUserRulesToName(rawName, settings) {
  const name = String(rawName == null ? '' : rawName);
  const ext = settings && settings.timestamp && settings.timestamp.extensions;
  if (!ext || ext.userRulesForCalendar !== true) return { name: name, hide: false };
  const rules = parseUserRules(ext.userRules);
  if (!rules.length) return { name: name, hide: false };
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (name.indexOf(r.from) < 0) continue;
    if (r.op === '-') return { name: name, hide: true };          // 忽略这个文件
    if (r.op === '=') return { name: name.split(r.from).join(r.to), hide: false };
    if (r.op === '+') return { name: name + r.to, hide: false };
  }
  return { name: name, hide: false };
}

/**
 * 转换出口。内置结果先算出来，再套用户规则 ——
 * 包在这一层而不是逐个 case 里写，是为了让所有出口统一接线：
 * 分散写会漏（之前就漏过一条路径，自定义规则在「统一格式」下完全失效）。
 */
function compute(plugin, key, raw, options) {
  const builtin = computeBuiltin(plugin, key, raw, options);
  if (builtin == null) return null;
  return applyUserRules(raw, builtin, plugin.settings);
}

function computeBuiltin(plugin, key, raw, options) {
  const ext = plugin.settings.timestamp.extensions;

  /*
   * 农历总开关：关闭后所有日期一律按阳历，与农历无关。
   * 必须在**所有**农历项之前统一拦截 —— 逐项判断会漏
   * （这些项分散在 lunar / reverse 两个 group 里）。
   */
  if (ext.lunarEnabled === false && isLunarKey(key)) return null;

  /*
   * 统一格式：把识别出的时间换成统一格式串。
   * 必须**先按农历判断**——「2026年五月十六」是农历，
   * 直接走 parseToDate 会解析不了（它不是阳历格式）。
   */
  if (key === 'unify') {
    const d = resolveToDate(plugin, raw, options);
    if (!d) return null;
    const f = unifyFormatOf(plugin.settings);
    return fmt(plugin, d, f);
  }

  if (key === 'unixDecode') {
    if (!looksLikeUnix(raw)) return null;
    const d = parseToDate(raw);
    return d ? fmt(plugin, d, plugin.settings.timestamp.format) : null;
  }

  /*
   * 以下几项的原始文本不是标准日期格式，必须抢在 parseToDate 之前判断，
   * 否则会被当成「解析不了」而直接跳过。
   */
  if (key === 'lunarToSolar') {
    /*
     * 「5月16号」默认按阳历理解，只有中文大写（五月十六号）才默认农历。
     * 开启 lunarOnHao 后，带「号 / 日」的一律按农历。
     * 不判断的话，阿拉伯数字的月日会被误当成农历转出一个错的阳历日期。
     */
    if (!shouldTreatAsLunar(raw, plugin.settings)) return null;
    // 剥掉「农历」前缀再解析 —— parseLunar 本身也剥，但显式做一次更稳，
    // 且后缀标记（开了开关时）必须靠这里处理
    const stripped = stripCalendarMark(raw, plugin.settings).rest;
    const info = lunar.parseLunar(stripped);
    if (!info) return null;
    const d = lunar.lunarToSolar(info.year, info.month, info.day, info.isLeap);
    return d ? fmt(plugin, d, 'YYYY-MM-DD') : null;
  }
  if (key === 'relativeToDate') {
    const d = parseRelative(raw, options && options.base);
    return d ? fmt(plugin, d, plugin.settings.timestamp.format) : null;
  }
  if (key === 'termToDate') {
    const req = parseTermRequest(raw);
    if (!req) return null;
    const day = lunar.termDay(req.year, req.index);
    if (!day || day < 1) return null;
    const month = Math.floor(req.index / 2) + 1;
    const d = new Date(req.year, month - 1, day);
    // 只输出日期：面板里已有预览，替换进正文时纯日期更干净
    return fmt(plugin, d, 'YYYY-MM-DD');
  }
  if (key === 'ganzhiToYear') {
    const g = parseGanzhi(raw);
    return g ? `${g.year}（${g.gan}${g.zhi}${g.animal}年）` : null;
  }
  if (key === 'linkToDate') {
    const m = LINK_RE.exec(raw.trim());
    if (!m) return null;
    const inner = m[1].trim();
    const d = parseToDate(inner);
    return d ? fmt(plugin, d, 'YYYY-MM-DD') : inner;
  }
  if (key === 'stripWeekday') {
    return stripWeekdayOnly(raw); // 没有星期时返回 null，该项自动隐藏
  }

  /*
   * 节日 → 日期。
   * 「中秋节」不是任何日期格式，必须抢在 parseToDate 之前判断。
   * 基准年：面板里填的；没填就取今年（并顺带看下一年——
   * 12 月说「元旦」多半指明年那个，跨年场景更贴合直觉）。
   */
  if (key === 'festivalToDate') {
    const hit = findFestivalHit(raw, plugin.settings);
    const base = options && options.base ? options.base : new Date();
    if (!hit) return null;
    let d = festivalDate(hit, base.getFullYear());
    // 该日期在今年已过完（且不是今天）时，看下一年更合理
    if (d && !hit.year && d < stripTime(base)) {
      const next = festivalDate(hit, base.getFullYear() + 1);
      if (next) d = next;
    }
    if (!d) return null;
    const text = fmt(plugin, d, 'YYYY-MM-DD');
    // 开关打开时补成「节日名 + 日期」，与正向输出同一形态
    return ext.festivalPrefix === false ? text : `${hit.name} ${text}`;
  }

  /*
   * 日期差值：输入是「两个日期」，parseToDate 只会解析出第一个，
   * 必须抢在它之前处理。
   */
  if (key === 'dateDiff') {
    const pair = parseDateRange(raw);
    if (!pair) return null;
    const days = diffDays(pair.from, pair.to);
    // 工作日要额外遍历一遍，关掉时省掉这轮计算
    if (ext.dateDiffWorkdays === true) {
      return `相差 ${days} 天（工作日 ${workdaysBetween(pair.from, pair.to)} 天）`;
    }
    return `相差 ${days} 天`;
  }

  const date = parseToDate(raw);
  if (!date) return null;

  switch (key) {
    /*
     * 倒计时：单个日期 → 距基准（默认今天）还有多少天。
     * 按自然日算，不看时分秒 —— 「距明天还有 1 天」才是直觉。
     */
    case 'countdown': {
      const base = options && options.base ? options.base : new Date();
      const n = diffDays(stripTime(base), stripTime(date));
      if (n === 0) return '就是今天';
      if (n > 0) return `还有 ${n} 天`;
      return `已过去 ${-n} 天`;
    }
    case 'relative': {
      // 基准：面板里填的；没填就是「现在」
      const base = options && options.base;
      const withNote = ext.showRelativeBase !== false; // 默认开
      return toRelative(date, base, withNote);
    }
    case 'weekday': {
      /*
       * 补星期是「追加」语义：在原日期后面加星期，**不能**把原有时刻丢掉。
       * 原先固定用 'YYYY-MM-DD' 输出，导致
       * 「2026-06-30 08:00」→「2026-06-30 周二」，08:00 被吃掉（实测确认）。
       * 按原文精度还原：带秒就带秒，只有时分就到分，纯日期就只到日。
       */
      const clean = stripDecorations(raw);
      let f = 'YYYY-MM-DD';
      if (hasClock(clean)) f += hasSeconds(clean) ? ' HH:mm:ss' : ' HH:mm';
      return `${fmt(plugin, date, f)} ${WEEKDAY_CN[date.getDay()]}`;
    }
    case 'dailyLink':
      return `[[${fmt(plugin, date, ext.dailyLinkFormat)}]]`;
    case 'unixEncode':
      return String(Math.floor(date.getTime() / 1000));
    case 'dateShift': {
      const shift = Number((options && options.shift) || 0);
      if (!shift) return null;
      const moved = new Date(date.getTime());
      moved.setDate(moved.getDate() + shift);
      return fmt(plugin, moved, 'YYYY-MM-DD');
    }

    /* 补全：只写了月日或时分时，补上今年 / 今天。已完整则返回 null，不显示 */
    case 'fillDate': {
      const clean = stripDecorations(raw);
      if (hasYear(clean) && !TIME_ONLY_RE.test(clean)) return null; // 已有年份
      if (TIME_ONLY_RE.test(clean)) {
        return fmt(plugin, date, hasSeconds(clean) ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm');
      }
      if (MD_RE.test(clean)) {
        return hasClock(clean)
          ? fmt(plugin, date, hasSeconds(clean) ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm')
          : fmt(plugin, date, 'YYYY-MM-DD');
      }
      return null;
    }

    /* 取时分秒：原文里确实有时钟才有意义，否则会输出 00:00:00 这种噪音 */
    case 'timePart': {
      if (!hasClock(raw)) return null;
      return fmt(plugin, date, hasSeconds(raw) ? 'HH:mm:ss' : 'HH:mm');
    }

    /* 农历：取年月日交给农历模块；超出 1900–2100 返回 null，该项自动隐藏 */
    case 'lunar': {
      const info = lunar.solarToLunar(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      return info ? lunar.formatLunar(info) : null;
    }
    case 'lunarGanzhi': {
      const info = lunar.solarToLunar(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      if (!info) return null;
      return `${lunar.formatLunar(info)} · ${lunar.ganZhi(info.year)}${lunar.zodiac(info.year)}年`;
    }
    case 'solarTerm':
      return lunar.solarTerm(date.getFullYear(), date.getMonth() + 1, date.getDate());
    /* 日期 → 节日：不是节日返回 null，该项自动隐藏 */
    case 'festival': {
      const name = festivalNameOf(date, plugin.settings);
      if (!name) return null;
      return ext.festivalPrefix === false
        ? name
        : `${name} ${fmt(plugin, date, 'YYYY-MM-DD')}`;
    }
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * 转换面板：列出已开启的转换项，每行带结果预览，点即应用
 * ------------------------------------------------------------------ */

class TimeActionModal extends obsidian.Modal {
  /**
   * @param {object} range 自动识别到的原文范围 { text, from, to }；手动框选时传 null。
   *   传了范围才能「覆盖原文」，否则只能依赖光标位置替换 ——
   *   弹窗打开后光标可能被 Obsidian 挪走，替换位置会错乱。
   */
  constructor(plugin, editor, raw, range) {
    super(plugin.app);
    this.plugin = plugin;
    this.editor = editor;
    this.raw = raw;
    this.range = range || null;
    this.shift = 7; // 日期偏移默认值
    this.baseText = ''; // 相对时间的基准；留空表示「现在」
    this.applied = false;
  }

  /** 当前基准：输入框里能解析出日期就用它，否则（留空或无效）视为「现在」 */
  currentBase() {
    const t = String(this.baseText || '').trim();
    if (!t) return null;
    return parseToDate(t); // 无效返回 null，调用方按「现在」处理
  }

  /** 基准输入框里填了内容但解析不出日期 */
  isBaseInvalid() {
    const t = String(this.baseText || '').trim();
    return !!t && !parseToDate(t);
  }

  /** 已开启且当前文本能算得出结果的项 */
  availableItems() {
    const ext = this.plugin.settings.timestamp.extensions;
    if (!extEnabled(this.plugin)) return [];
    return ACTION_DEFS.filter((def) => {
      if (!ext.items || !ext.items[def.key]) return false;
      // 农历总开关关闭时，农历项不出现在面板里（否则会看到开了却没结果的项）
      if (ext.lunarEnabled === false && isLunarKey(def.key)) return false;
      // 偏移项的输入框单独渲染，不进列表
      if (def.key === 'dateShift') return false;
      return compute(this.plugin, def.key, this.raw, { base: this.currentBase() }) !== null;
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    /*
     * 注意：addClass 一次只能加一个类名，传 'a b' 会抛
     * InvalidCharacterError（DOMTokenList 不允许空格），面板会渲染成空白。
     * 需要多个类就分多次调用，或用 createDiv({ cls: 'a b' })（那个支持空格）。
     */
    contentEl.addClass('pomo-modal');

    contentEl.createEl('h3', { text: i18nT('k87dbb7d5', '🔄 时间转换') });

    const input = contentEl.createDiv({ cls: 'tta-source' });
    input.createDiv({ cls: 'tta-source-label', text: i18nT('kef75efa9', '选中内容') });
    input.createDiv({ cls: 'tta-source-value', text: this.raw });

    /*
     * 相对时间的基准输入框。
     * 「3 天前」必须标明相对哪一天，否则笔记过几天再看就对不上了。
     * 留空＝相对现在；可填任意能识别的日期。
     */
    const baseBox = contentEl.createDiv({ cls: 'tta-base' });
    baseBox.createDiv({ cls: 'tta-base-title', text: i18nT('k44ee7a53', '相对基准（留空＝现在）') });
    const baseRow = baseBox.createDiv({ cls: 'tta-base-row' });
    const baseInput = baseRow.createEl('input', {
      attr: { type: 'text', placeholder: '如 2026-09-22 或 2026-09-22 14:30' },
    });
    baseInput.value = this.baseText;
    baseInput.oninput = () => {
      this.baseText = baseInput.value;
      // 只重绘结果列表，不动输入框本身，否则每敲一个字就失焦
      this.renderList();
    };
    this.baseHint = baseBox.createDiv({ cls: 'tta-base-hint' });

    this.listEl = contentEl.createDiv({ cls: 'tta-list' });
    this.renderList();

    const row = contentEl.createDiv({ cls: 'pomo-modal-row' });
    row.createEl('button', { cls: 'pomo-btn', text: i18nT('k39b523bd', '关闭') }).onclick = () => this.close();
  }

  /**
   * 渲染结果列表（可重复调用）。
   *
   * 基准输入框变化时只重绘这一块：整块重绘会让 input 被销毁重建，
   * 表现为「每敲一个字就失焦」，根本没法连续输入。
   */
  renderList() {
    const base = this.currentBase();

    if (this.baseHint) {
      this.baseHint.setText(
        this.isBaseInvalid()
          ? i18nT('k4628fd37', '⚠️ 基准无法识别，将按「现在」计算。可填 2026-09-22 或 2026-09-22 14:30')
          : base
            ? `当前基准：${fmt(this.plugin, base, 'YYYY-MM-DD HH:mm')}`
            : '当前基准：现在'
      );
      this.baseHint.toggleClass('is-warn', this.isBaseInvalid());
    }

    if (!this.listEl) return;
    this.listEl.empty();

    const items = this.availableItems();
    if (!items.length) {
      /*
       * 空态要说明「能做什么」，不能只说「识别不出」。
       * 最常见的情况：文本确实是相对时间（明天 / 7天以后），
       * 但「相对时间 → 日期」属逆向转换、默认关着。
       * 这时直接把答案算出来展示，并告诉开关在哪。
       */
      const relDate = looksLikeRelative(this.raw) ? parseRelative(this.raw, base) : null;
      if (relDate) {
        const box = this.listEl.createDiv({ cls: 'tta-empty' });
        box.createDiv({ cls: 'tta-empty-title', text: i18nT('k1c74cf5a', '这段是相对时间描述') });
        box.createDiv({
          cls: 'tta-empty-answer',
          text: `→ ${fmt(this.plugin, relDate, this.plugin.settings.timestamp.format)}`,
        });
        box
          .createDiv({ cls: 'tta-empty-hint' })
          .setText(i18nT('ka729e72a', '在 设置 → 时间戳 → 扩展 → 逆向转换 里开启「相对时间 → 日期」后可一键应用。'));
        return;
      }

      this.listEl
        .createDiv({ cls: 'tta-empty' })
        .setText(
          i18nT('k12c0c154', '这段文本没识别出时间，或相关转换项都关着。可选中的样子：2026-09-19、2026 09 19、14:30、明天、7天以后')
        );
      return;
    }

    items.forEach((def) => {
      const result = compute(this.plugin, def.key, this.raw, { base });
      if (result === null) return;
      const row = this.listEl.createDiv({ cls: 'tta-item' });

      const left = row.createDiv({ cls: 'tta-item-left' });
      left.createDiv({ cls: 'tta-item-name', text: actionText(def.key, 'name', def.name) });
      left.createDiv({ cls: 'tta-item-result', text: result });

      row.createEl('button', { cls: 'pomo-btn mod-cta', text: i18nT('k5dda8431', '应用') }).onclick = () =>
        this.apply(result);
    });

    // 日期偏移：需要填天数，单独一块（也放进列表区，随基准一起刷新）
    const ext = this.plugin.settings.timestamp.extensions;
    if (ext.items && ext.items.dateShift && parseToDate(this.raw) && !looksLikeUnix(this.raw)) {
      const box = this.listEl.createDiv({ cls: 'tta-shift' });
      box.createDiv({ cls: 'tta-shift-title', text: i18nT('kc88c0e47', '日期偏移') });
      const line = box.createDiv({ cls: 'tta-shift-row' });
      const inputEl = line.createEl('input', { attr: { type: 'number' } });
      inputEl.value = String(this.shift);
      inputEl.oninput = () => {
        this.shift = Number(inputEl.value);
        if (this.shiftPreview) {
          const out = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
          this.shiftPreview.setText(out ? i18nT('k517a676e', '→ {0}', out) : i18nT('k1b4139be', '请输入有效天数'));
        }
      };
      line.createEl('button', { cls: 'pomo-btn', text: i18nT('k6cc01e73', '应用偏移') }).onclick = () => {
        const out = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
        if (out) this.apply(out);
      };
      this.shiftPreview = box.createDiv({ cls: 'tta-shift-preview' });
      const out0 = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
      this.shiftPreview.setText(out0 ? i18nT('k517a676e', '→ {0}', out0) : i18nT('k1b4139be', '请输入有效天数'));
    }
  }

  refreshPreview() {
    if (!this.shiftPreview) return;
    const out = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
    this.shiftPreview.setText(out ? i18nT('k517a676e', '→ {0}', out) : i18nT('k1b4139be', '请输入有效天数'));
  }

  /**
   * 写入结果。
   * 手动框选 → 替换选区（replaceSelection），与用户预期一致。
   * 自动识别 → 按范围定位：开关关闭覆盖原文，开启则在原文后追加。
   *   必须显式 setSelection 到识别范围，不能靠当前光标，
   *   否则弹窗打开 / 焦点切换后光标位置变化，结果会插到莫名其妙的地方。
   */
  apply(text) {
    if (this.applied) return;
    this.applied = true;
    const ext = this.plugin.settings.timestamp.extensions;
    const mark = undoMarkOf(this.plugin.settings);
    /*
     * 正文里**只写转换结果**，不写标记字符。
     * 标记是编辑器装饰（widget），关闭 Obsidian 后消失，
     * 与内存里保存的原文同生命周期 —— 不会出现「标记还在但点不动」。
     */
    const out = String(text);

    if (this.editor) {
      const ed = this.editor;
      /*
       * 手动框选时 range 为 null，用当前选区定位；
       * 光标自动识别时 range 是那段原文的位置。
       */
      let sel = this.range;
      if (!sel) {
        const a = ed.getCursor ? ed.getCursor('from') : { line: 0, ch: 0 };
        const b = ed.getCursor ? ed.getCursor('to') : a;
        sel = { from: a, to: b };
      }
      /*
       * 「当前时间」是个占位标记，用户写下它就是想在后面看到时间，
       * 替换掉反而奇怪 —— 所以这类词恒为追加，不受 appendOnAutoPick 影响。
       */
      const isPlaceholder = NOW_WORDS.test(String(this.raw || '').trim());
      const append = this.range ? (isPlaceholder || !!(ext && ext.appendOnAutoPick)) : false;

      // 个别编辑器实例可能没有 setSelection，退化成直接替换选区
      const setSel = (a, b) => {
        if (typeof ed.setSelection === 'function') ed.setSelection(a, b);
      };

      let resultFrom, resultTo;
      if (append) {
        // 追加：插在原文末尾，原文保留，中间补一个空格
        setSel(sel.to, sel.to);
        ed.replaceSelection(' ' + out);
        // 结果文本范围要跳过那个空格，否则撤回后会多留一个空格
        resultFrom = { line: sel.to.line, ch: sel.to.ch + 1 };
        resultTo = { line: sel.to.line, ch: sel.to.ch + 1 + out.length };
      } else {
        // 覆盖：显式选中原文再替换
        setSel(sel.from, sel.to);
        ed.replaceSelection(out);
        resultFrom = { line: sel.from.line, ch: sel.from.ch };
        resultTo = { line: sel.from.line, ch: sel.from.ch + out.length };
      }

      /*
       * 先记录（纯内存，永不失败），再尝试挂装饰。
       * 顺序不能反 —— 反了的话装饰挂不上时记录也没写，
       * 撤回命令会跟着一起失效（v2.32.0 实测）。
       */
      if (mark) {
        const rec = recordUndoEntry(this.plugin, {
          editor: ed,
          line: resultFrom.line,
          fromCh: resultFrom.ch,
          // 追加模式要把前导空格一起纳入替换范围，否则撤回后残留一个空格
          searchText: append ? ' ' + out : out,
          replaceWith: append ? '' : String(this.raw || ''),
        });
        // 装饰是锦上添花：挂不上也不影响上面的记录
        attachUndoWidget(this.plugin, ed, resultFrom, resultTo, this.raw, mark, rec);
      }
    }
    this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 * 设置页：总开关 + 逐项开关
 * ------------------------------------------------------------------ */

function renderTimeActionSettings(containerEl, plugin) {
  const ts = plugin.settings.timestamp;
  const ext = ts.extensions;
  containerEl.createEl('h3', { text: i18nT('k60969377', '扩展：时间转换') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1c3d56cc', '启用扩展功能'))
    .setDesc(i18nT('k48b1d04a', '总开关。选中一段文本后执行「时间转换」，可转成相对时间、星期、日记链接等。'))
    .addToggle((t) =>
      t.setValue(ext.enabled).onChange(async (v) => {
        ext.enabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 总开关关闭：下方所有转换设置收进折叠区，默认收起。
   * 与番茄钟「会话记录」同一套做法 —— 只藏不改值，重新打开原样恢复。
   * 以前是 return 直接不渲染，用户看不到里面到底有什么，
   * 想确认某项是否还在只能先开总开关，来来回回很别扭。
   */
  /*
   * 直接改参数指向：下面还有大量 containerEl 的用法（含闭包里捕获的），
   * 改一处就等于全部收进折叠区，不必逐个替换成另一个变量名 ——
   * 逐个替换最容易漏掉闭包里的那几处，反而留下半折叠的残态。
   */
  if (!ext.enabled) {
    const fold = containerEl.createEl('details', { cls: 'tsi-fold' });
    fold.createEl('summary', { text: i18nT('k6edb2ee2', '转换设置（已关闭，点此展开查看）') });
    fold.createDiv({
      cls: 'tsi-tip',
      text: i18nT('k21e6e71a', '总开关关闭中：以下设置暂不生效，但数值都保留着。同时命令面板、右键菜单、斜杠命令、撤回标记全部停用。'),
    });
    containerEl = fold;
  } else {
    containerEl
      .createDiv({ cls: 'tsi-tip' })
      .setText(i18nT('k6e73cad1', '用法：选中一个时间文本 → 右键或命令面板执行「时间转换」→ 选一项 → 应用。没选中时会自动识别光标所在行的时间。'));
  }

  /*
   * 按分组渲染。项多了以后平铺一长串很难找，
   * 分组后一眼能看出「哪些是正向、哪些是逆向」。
   */
  const { ACTION_GROUPS, pairOf, isForwardOfPair } = require('./settings.js');
  containerEl
    .createDiv({ cls: 'tsi-tip' })
    .setText(i18nT('k339dad51', '只显示与选中文本形态相符的转换项，例如选中「明天」时才出现「相对时间 → 日期」。'));

  const separate = ext.separateDirections === true;
  const collapse = ext.collapseItems === true;

  /** 设一个开关的值；未开启「分别控制」时同步到配对的另一半 */
  const setItem = async (key, v) => {
    ext.items[key] = v;
    if (!separate) {
      const other = pairOf(key);
      if (other) ext.items[other] = v;
    }
    await plugin.saveSettings();
  };

  /** 渲染一行开关 */
  const addRow = (parent, def, labelOverride) => {
    new obsidian.Setting(parent)
      .setName(actionText(def.key, 'name', labelOverride || def.name))
      .setDesc(actionText(def.key, 'desc', def.desc))
      .addToggle((t) =>
        t.setValue(!!ext.items[def.key]).onChange(async (v) => {
          await setItem(def.key, v);
          if (separate || collapse) plugin.redrawSettingsTab();
        })
      );
  };

  /**
   * 渲染一个可折叠分组；renderBody 负责填充内容。
   * countText 可自定义右侧计数——高级区不是转换项，
   * 显示「已开启 0/1」毫无意义，所以允许不传或传别的文案。
   */
  const renderGroup = (g, defs, renderBody, countText) => {
    if (!defs.length) return;
    const wrap = containerEl.createDiv({ cls: 'tsi-section' });

    const opened = !collapse;
    const head = wrap.createDiv({ cls: 'tsi-section-title is-clickable' });
    head.setText(i18nT(g.titleKey, g.title));
    if (countText !== null) {
      const onCount = defs.filter((d) => !!ext.items[d.key]).length;
      head.createSpan({
        cls: 'tsi-section-count',
        text: countText || i18nT('k74e4b58e', '已开启 {0}/{1}', onCount, defs.length),
      });
    }

    const body = wrap.createDiv({ cls: 'tsi-section-body' });
    if (!opened) body.addClass('is-collapsed');
    head.onclick = () => {
      body.toggleClass('is-collapsed');
      head.toggleClass('is-closed', body.hasClass('is-collapsed'));
    };
    if (!opened) head.addClass('is-closed');

    renderBody(body);
  };

  const { ADVANCED_GROUP } = require('./settings.js');

  ACTION_GROUPS.forEach((g) => {
    const all = ACTION_DEFS.filter((d) => (d.group || 'forward') === g.key);
    // 农历区末尾放「带号的都算农历」，它跟农历直接相关，放别处不好找
    // 未开启「分别控制」时，逆向那半由正向代表渲染，避免重复出现
    const defs = separate ? all : all.filter((d) => !pairOf(d.key) || isForwardOfPair(d.key));
    renderGroup(g, defs, (body) => {
      defs.forEach((def) => {
        if (!separate) {
          addRow(body, def);
          return;
        }
        // 分别控制：正向 / 逆向各一行
        addRow(body, def, actionText(def.key, 'name', def.name) + (isForwardOfPair(def.key) ? i18nT('kfd9ff5e6', '（正向）') : ''));
        const other = pairOf(def.key);
        if (isForwardOfPair(def.key) && other) {
          const odef = ACTION_DEFS.find((d) => d.key === other);
          if (odef) addRow(body, odef, actionText(odef.key, 'name', odef.name) + i18nT('kf0e8f0f6', '（逆向）'));
        }
      });

      // 统一格式：格式串输入框（放常用区末尾，跟它最相关）
      if (g.key === 'forward') {
        const tsFmt = plugin.settings.timestamp.format;
        new obsidian.Setting(body)
          .setName(i18nT('k194ffbb3', '统一格式的格式串'))
          .setDesc(i18nT('k4886d4c7', "留空则跟随上方时间戳格式（当前：{0}）。例如 YYYY-MM-DD、YYYY年MM月DD日、YYYY-MM-DD HH:mm。", tsFmt))
          .addText((t) =>
            t
              .setPlaceholder(tsFmt)
              .setValue(ext.unifyFormat || '')
              .onChange(async (v) => {
                ext.unifyFormat = String(v).slice(0, 60);
                await plugin.saveSettings();
              })
          );
      }

      // 农历区：总开关在最上，两个子开关只有总开关打开时才渲染
      if (g.key === 'lunar') {
        new obsidian.Setting(body)
          .setName(i18nT('kea0bc7c2', '启用农历'))
          .setDesc(i18nT('kfdc30606', "总开关。关闭后**所有日期一律按阳历处理**：转农历、干支生肖、节气、农历→阳历全部不生效，下面的子开关也一并失效。"))
          .addToggle((t) =>
            t.setValue(ext.lunarEnabled !== false).onChange(async (v) => {
              ext.lunarEnabled = v;
              await plugin.saveSettings();
              plugin.redrawSettingsTab();
            })
          );

        /*
         * 总开关关闭时不再渲染子开关 —— 它们此时不产生任何效果，
         * 显示出来只会让人以为调了有用。
         */
        if (ext.lunarEnabled === false) return;

        new obsidian.Setting(body)
          .setName(i18nT('kb2d63591', '大写中文即农历'))
          .setDesc(i18nT('k8d574624', "关闭（默认）：「五月十六」「五月十六号」算农历，带「日」的（五月十六日）按阳历。开启：大写中文一律按农历，阿拉伯数字一律按阳历。"))
          .addToggle((t) =>
            t.setValue(ext.lunarOnCnUpper === true).onChange(async (v) => {
              ext.lunarOnCnUpper = v;
              await plugin.saveSettings();
            })
          );

        new obsidian.Setting(body)
          .setName(i18nT('k3775f823', '标记在后也能识别'))
          .setDesc(i18nT('k6d51a9fb', "关闭（默认）：只认「农历2026年八月初九」这类**标记在前**的写法。开启：标记写在日期后面（如「2026年八月初九 农历」）也能识别。"))
          .addToggle((t) =>
            t.setValue(ext.lunarMarkAnywhere === true).onChange(async (v) => {
              ext.lunarMarkAnywhere = v;
              await plugin.saveSettings();
            })
          );

        new obsidian.Setting(body)
          .setName(i18nT('k6dd34c3f', '带「号 / 日」的都算农历'))
          .setDesc(i18nT('k00ff190f', "关闭（默认）：中文大写「五月十六号」按农历，阿拉伯数字「5月16号」按阳历。开启：只要末尾带「号」或「日」，一律按农历。"))
          .addToggle((t) =>
            t.setValue(ext.lunarOnHao === true).onChange(async (v) => {
              ext.lunarOnHao = v;
              await plugin.saveSettings();
            })
          );
      }
    });
  });

  /*
   * 第二区：时间口径 + 自定义规则。
   * 口径三项在 timejudge.js 的 JUDGEMENTS 里定义，这里遍历渲染 ——
   * 新增口径只需往 JUDGEMENTS 加一条，界面自己长出来，不用改这里。
   */
  {
    const J = require('./timejudge.js');
    const semWrap = containerEl.createDiv({ cls: 'tsi-section' });
    const semHead = semWrap.createDiv({ cls: 'tsi-section-title is-clickable' });
    semHead.setText(i18nT('k8929d074', '时间口径'));
    const semBody = semWrap.createDiv({ cls: 'tsi-section-body' });
    if (ext.collapseSemantics !== false) semBody.addClass('is-collapsed');
    semHead.onclick = () => {
      semBody.toggleClass('is-collapsed', !semBody.hasClass('is-collapsed'));
    };

    Object.keys(J.JUDGEMENTS).forEach((k) => {
      const def = J.JUDGEMENTS[k];
      new obsidian.Setting(semBody)
        .setName(judgeText(k, 'name', def.label))
        .setDesc(judgeText(k, 'desc', def.desc))
        .addDropdown((d) => {
          def.options.forEach((o) =>
            d.addOption(String(o.v), judgeText(k, 'opt:' + String(o.v), o.label))
          );
          d.setValue(String(J.readJudgement(k, plugin.settings)));
          d.onChange(async (v) => {
            const raw = def.options.find((o) => String(o.v) === String(v));
            ext[k] = def.clean(raw ? raw.v : v);
            await plugin.saveSettings();
          });
        });
    });

    /*
     * 自定义转换规则。
     * 词表再全也覆盖不了所有人的说法，所以留一个窗口让用户自己补。
     * 覆盖不等于抹除：内置规则永远在，用户规则只在结果之上生效，
     * 删掉自己写的规则，内置结果就自动回来了。
     */
    const ruleBox = semBody.createDiv({ cls: 'tsi-tip' });
    ruleBox.setText(i18nT('k357857c1', '自定义转换规则（一行一条：被替换文本 操作符 结果）'));
    new obsidian.Setting(semBody)
      .setName(i18nT('kd325b572', '规则列表'))
      .setDesc(i18nT('k2d3e0d82', '操作符：=替换（结果留空＝隐藏该项）、+追加（保留内置结果再接一段）、-隐藏（这项不出现）。')
       /*
        * 示例整句翻译，不做语言判断：
        *   规则匹配的是**用户选中的原文**，与界面语言无关 ——
        *   英文示例照抄同样能用（实测 tomorrow = the day after tomorrow 可转换）。
        *   早先误以为"英文示例照抄会失败"，对规则列表是错的，此处更正。
        */
       + i18nT('k8f0cfdcf', '例：明天 = 后天 ／ 2026-10-01 + 发货日 ／ 昨天 -。')
       + i18nT('kf687009c', '覆盖不等于删除内置规则，删掉自己写的行即恢复原样。'))
      .addTextArea((t) => {
        t.setPlaceholder(i18nT('k1f05dd7e', '明天 = 后天\n2026-10-01 + 发货日\n昨天 -'))
          .setValue(ext.userRules || '')
          .onChange(async (v) => {
            ext.userRules = String(v || '').slice(0, 20000);
            await plugin.saveSettings();
          });
      });
    new obsidian.Setting(semBody)
      .setName(i18nT('kd3217aeb', '让规则也参与日历解析'))
      .setDesc(i18nT('k786b9bea', '默认关 —— 关时规则只作用于「选中转换」。打开后，日历在识别笔记名')
       + i18nT('k70706b27', '（判断这是哪天的日记 / 周记）之前也会先套用同一份规则，')
       + i18nT('kd1ca4689', '可让旧命名不改名也被认出来。两套解析共用一份规则，')
       + i18nT('k5c007aba', '若发现高亮或圆点异常，关掉这个开关即可回到原来的行为。'))
      .addToggle((t) => {
        t.setValue(ext.userRulesForCalendar !== false).onChange(async (v) => {
          ext.userRulesForCalendar = !!v;
          await plugin.saveSettings();
          if (plugin.refreshCalendarViews) plugin.refreshCalendarViews();
          refreshRuleHint();
        });
      });

    const ruleHint = semBody.createDiv({ cls: 'tsi-tip' });
    const refreshRuleHint = () => {
      const n = parseUserRules(ext.userRules).length;
      const scope = ext.userRulesForCalendar
        ? i18nT('kfbca8e96', '「选中转换」与「日历解析」')
        : i18nT('k0e6cd89e', '仅「选中转换」');
      ruleHint.setText(
        n === 0
          ? i18nT('k03f8fee9', '当前没有生效的规则。')
          : i18nT('kfe918842', '已识别 {0} 条规则，作用于{1}。', n, scope)
      );
    };
    refreshRuleHint();
  }

  /*
   * 第三区：高级设置。
   * 这些是杂项开关，跟具体转换项无关；放进独立折叠区，
   * 免得挤在转换项中间把前两区淹掉。
   */
  let advBody = containerEl;
  renderGroup(ADVANCED_GROUP, [{ key: '__adv__' }], (body) => {
    advBody = body;
  }, null);
  new obsidian.Setting(advBody)
    .setName(i18nT('k6587da46', '日期差值附带工作日'))
    .setDesc(i18nT('kbbfd43a0', "打开后「日期差值」额外给出工作日天数（仅扣周末，不含法定节假日）。需遍历区间，长区间略慢。"))
    .addToggle((t) =>
      t.setValue(ext.dateDiffWorkdays === true).onChange(async (v) => {
        ext.dateDiffWorkdays = v;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('k01bb83dc', '分别控制正向与逆向（高级）'))
    .setDesc(i18nT('kc90bcc57', "默认关闭：正向与逆向共用一个开关（如「相对时间 ⇄ 日期」）。打开后每对展开成两个独立开关。"))
    .addToggle((t) =>
      t.setValue(ext.separateDirections === true).onChange(async (v) => {
        ext.separateDirections = v;
        // 关闭时把两边拉回一致，以正向为准，避免留下不一致的状态
        if (!v) {
          const { ACTION_PAIRS } = require('./settings.js');
          ACTION_PAIRS.forEach((pair) => {
            ext.items[pair[1]] = !!ext.items[pair[0]];
          });
        }
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('kfa8034e3', '折叠转换项开关'))
    .setDesc(i18nT('k8f510b84', '打开后转换项开关列表收起，只留分组标题（标题显示已开启数量），点标题可展开。'))
    .addToggle((t) =>
      t.setValue(ext.collapseItems === true).onChange(async (v) => {
        ext.collapseItems = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('k6c6df985', '相对时间附带基准说明'))
    .setDesc(i18nT('k14479de6', "开启后结果形如「2 天后（相对 2026-09-22）」；关掉只输出「2 天后」。建议保持开启，否则过几天再看就不知道相对哪一天。"))
    .addToggle((t) =>
      t.setValue(ext.showRelativeBase !== false).onChange(async (v) => {
        ext.showRelativeBase = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('k48ef619d', '没选中文本时：在原文后追加结果'))
    .setDesc(i18nT('kbf40aee7', "关闭（默认）：自动识别到的时间被结果覆盖。开启：保留原文，结果接在后面。只对「光标自动识别」生效；手动框选始终是替换选区。"))
    .addToggle((t) =>
      t.setValue(!!ext.appendOnAutoPick).onChange(async (v) => {
        ext.appendOnAutoPick = v;
        await plugin.saveSettings();
      })
    );

  /* 「一周从哪天开始」已合并到「日历」设置页，全插件共用同一个值 */

  new obsidian.Setting(advBody)
    .setName(i18nT('k9b7eef03', '转换后显示撤回标记'))
    .setDesc(i18nT('k0fe85bb7', "开启（默认）：转换结果后出现可点击的撤回图标，点一下还原。一篇可有多处，逐个点即可。图标是编辑器临时装饰，不占正文字符、不存进笔记。关闭 Obsidian 后转换记录全部清除，图标消失、不再可撤回。关闭本开关＝整个撤回功能停摆：不显示图标、也不记录，撤回命令同样失效。"))
    .addToggle((t) =>
      t.setValue(ext.undoHintEnabled !== false).onChange(async (v) => {
        ext.undoHintEnabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 系统撤回提示。
   * 这里只是**说明**：刚转完想立刻反悔，用 Obsidian 自己的 Ctrl+Z 就行。
   * 标记点击是另一条路——转完又改了别处时，Ctrl+Z 要一路退回去，
   * 点标记则一步到位。
   */
  {
    const box = advBody.createDiv({ cls: 'tts-undo-tip' });
    box.setText(
      i18nT('k84406372', '提示：刚转换完想马上反悔，按 Ctrl+Z 用系统撤回最省事；') +
      i18nT('kf49864b0', '若之后还编辑过别处，点结果后面的撤回图标可直接还原。')
    );
  }

  new obsidian.Setting(advBody)
    .setName(i18nT('k2e6560ac', '时段名单独转换'))
    .setDesc(i18nT('k1554c109', "默认关闭：「早上」「下午」这类词单独出现时不转换 —— 它指几点没有共识，强行给值是编造。开启后按下面的小时值转换。「早上8点」这类带时刻的写法不受影响，始终可用。"))
    .addToggle((t) =>
      t.setValue(ext.convertDaypartAlone === true).onChange(async (v) => {
        ext.convertDaypartAlone = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  // 各时段小时值：仅在开启单独转换时展示，避免平时占地方
  if (ext.convertDaypartAlone) {
    const box = advBody.createDiv({ cls: 'tsi-daypart' });
    box.createDiv({ cls: 'tsi-daypart-title', text: i18nT('k5aa7322d', '各时段对应的小时（0–23）') });
    DAYPART_KEYS.forEach((key) => {
      new obsidian.Setting(box)
        .setName(daypartText(key, key))
        .addText((t) =>
          t
            .setPlaceholder(String(daypartHour(key, null)))
            .setValue(
              ext.daypartHours && typeof ext.daypartHours[key] === 'number'
                ? String(ext.daypartHours[key])
                : ''
            )
            .onChange(async (v) => {
              const n = Number(String(v).trim());
              // 非法值直接删掉而不是落盘，避免脏数据堆积
              if (!isFinite(n) || n < 0 || n > 23) delete ext.daypartHours[key];
              else ext.daypartHours[key] = Math.floor(n);
              await plugin.saveSettings();
            })
        );
    });
  }

  new obsidian.Setting(advBody)
    .setName(i18nT('k113e2ef3', '日记链接格式'))
    .setDesc(i18nT('k609e6c5c', '「转日记链接」生成的日期格式，需与你的日记文件名格式一致。'))
    .addText((t) =>
      t
        .setPlaceholder('YYYY-MM-DD')
        .setValue(ext.dailyLinkFormat)
        .onChange(async (v) => {
          ext.dailyLinkFormat = v.trim() || 'YYYY-MM-DD';
          await plugin.saveSettings();
        })
    );

  containerEl
    .createDiv({ cls: 'tsi-tip' })
    .setText(i18nT('kdabd637e', '本模块不保存任何历史记录或缓存，关闭后库里不留残留数据。'));
}

/* ------------------------------------------------------------------ *
 * 注册：只有一个命令入口，避免命令面板被一堆开关淹没
 * ------------------------------------------------------------------ */

/*
 * 行内挑选用的候选正则，按「越严格越优先」排列。
 * 不能用 DATE_RE —— 那个带 ^$ 锚定，是给整段文本匹配用的，
 * 行内搜索必须用不锚定的版本，否则永远匹配不到。
 * 宽松那条放最后：含空格的分隔在任意文本里容易误吃无关内容。
 */
/**
 * 口语相对日的行内匹配：明天 / 大后天 / tomorrow …
 * 去掉各条的首尾锚点后拼接；按 WORD_REL 原顺序（长词在前）保证最长优先。
 */
const WORD_PICK_RE = new RegExp(
  WORD_REL.map((w) => w.re.source.replace(/^\^|\$$/g, '')).join('|'),
  'i'
);

/** 倒装说法的行内版本：去掉首尾锚点，用于在句子里定位 */
const REL_PREFIX_RE_INLINE = new RegExp(
  REL_PREFIX_RE.source.replace(/^\^|\$$/g, ''),
  'i'
);

/** 数量+单位（含中文数字与序数）的行内版本 */
const REL_INLINE = new RegExp(REL_RE.source.replace(/^\^|\$$/g, ''), 'i');

/** 判断某条 pattern 是不是「非日期格式」（需按相对时间校验） */
const PICK_NONDATE_RE = /前天|昨天|明天|后天|星期|yesterday|tomorrow|today|\\d\\s*[秒分小天周月年]|第/i;

/*
 * 复合表达的行内匹配：明年12月份的第49周周三下午2点。
 * 各段全可选会让整体匹配空串 —— g 标志下 exec 空匹配 lastIndex 不前进会死循环，
 * 所以拆成两个「必须有其一」的分支。
 */
const COMPOSITE_PICK_RE = new RegExp(
  '(?:' +
    /*
     * 复合的**标志是「第N周」**——必须有它才算复合，
     * 单独的「周五 / 下周五」交给 WEEKDAY_PICK_RE，否则会互相抢。
     * 第N周后面还能跟「周X」「时段」「时刻」，段间允许「的」。
     */
    '(?:今年|明年|后年|去年|前年|\\d{4}年?)?[\\s的]*' +
    '(?:\\d{1,2}月份?)?[\\s的]*' +
    '第[\\d零〇一二两三四五六七八九十]+周' +
    '(?:[\\s的]*周[一二三四五六日天1-7])?' +
    '(?:[\\s的]*(?:早上|上午|中午|下午|傍晚|晚上|深夜|凌晨))?' +
    '(?:[\\s的]*\\d{1,2}(?:点(?:半|\\d{0,2}分?)?|:\\d{2}))?' +
  '|' +
    // 后面跟「日」说明是完整日期（2026年09月19日），交给日期规则处理
    '(?:今年|明年|后年|去年|前年|\\d{4}年)[\\s的]*\\d{1,2}月(?:份)?(?!\\s*\\d{1,2}\\s*日)' +
  ')',
  'g'
);

/*
 * 农历日期的行内匹配（前缀形式）：农历2026年八月初九 / 农历五月十六。
 * 必须排在日期类之前 —— 否则「农历2026年…」会被年份/日期规则抢成「2026年」，
 * 而「2026年」既转不了农历又会掉进相对时长的坑（实测过）。
 * 日部分按「初X / 廿X / 三十 / 一般数字」排列，长的在前避免被短规则截断。
 */
const LUNAR_PICK_RE = new RegExp(
  '(?:' + LUNAR_MARK.join('|') + ')' +
  '\\s*(?:\\d{4}\\s*年|[零〇一二三四五六七八九十]{4}\\s*年)?' +
  '\\s*闰?\\s*' +
  '(?:[正一二三四五六七八九十冬腊]{1,3}月|\\d{1,2}月)' +
  '\\s*(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|三十|[一二三四五六七八九十]{1,2}|\\d{1,2})' +
  '\\s*(?:日|号)?',
  'g'
);

/*
 * 无标记的大写月日：八月十九 / 五月十六。
 * 必须排在 REL_INLINE **之前** —— 否则「八月十九」会被「八 + 月」当成
 * 「8 个月后」，只剩「八月」这个碎片，光标停留时转不出结果
 * （而选中整串时却能转，两种入口行为不一致，实测过）。
 */
const CN_MD_PICK_RE = new RegExp(
  '(?:\\d{4}\\s*年)?' +
  '\\s*闰?\\s*' +
  '(?:[正一二三四五六七八九十冬腊]{1,3}月)' +
  '\\s*(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|三十|[一二三四五六七八九十]{1,2})' +
  '\\s*(?:日|号)?' +
  /*
   * 后面紧跟历法标记时不匹配 —— 那是「后缀标记」形态，
   * 交给 LUNAR_TAIL_PICK_RE（需开关开启）。
   * 不排除的话，开关关闭时会被当无标记的大写月日转掉，等于绕过开关。
   */
  '(?!\\s*(?:' + LUNAR_MARK.join('|') + '))',
  'g'
);

/** 后缀形式：2026年八月初九 农历（需 lunarMarkAnywhere 开启才启用） */
const LUNAR_TAIL_PICK_RE = new RegExp(
  '(?:\\d{4}\\s*年)?' +
  '\\s*闰?\\s*' +
  '(?:[正一二三四五六七八九十冬腊]{1,3}月|\\d{1,2}月)' +
  '\\s*(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|三十|[一二三四五六七八九十]{1,2}|\\d{1,2})' +
  '\\s*(?:日|号)?\\s*(?:' + LUNAR_MARK.join('|') + ')',
  'g'
);

/** 星期几的行内匹配：周一 / 上周五 / 下周一（前缀必须保留，否则「下周五」会当本周五） */
const WEEKDAY_PICK_RE = /(?:本|上|下)?\s*周[一二三四五六日天1-7]/g;

/** 当前时间等占位词的行内匹配 */
const NOW_PICK_RE = /当前时间|此刻|当下/g;

const PICK_PATTERNS = [
  /*
   * 复合、星期几、当前时间必须排在**日期类之前**。
   * 否则「明年12月份的第49周…」会被「\d{1,2}月」抢先匹配成「12月」，
   * 剩下的碎片拼不出完整语义。
   */
  COMPOSITE_PICK_RE,
  LUNAR_PICK_RE,
  LUNAR_TAIL_PICK_RE,
  CN_MD_PICK_RE,
  WEEKDAY_PICK_RE,
  NOW_PICK_RE,
  /\d{4}\d{2}\d{2}/,                                            // 紧凑 20260919
  /\d{4}[-/._年]\d{1,2}[-/._月]\d{1,2}日?(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/, // 2026-09-19
  /\d{4}[\s\-/._]\d{1,2}[\s\-/._]\d{1,2}/,                     // 2026 09 19（宽松）
  /\d{1,2}[-/._月]\d{1,2}[日号]?/,                                // 09-17 / 5月16号
  /\d{10}|\d{13}/,                                              // Unix 时间戳
  /\d{1,2}:\d{2}(?::\d{2})?/,                                   // 14:30
  /*
   * 口语相对日 + 时刻（明天5点 / 明天下午3点 / 昨天5点半）。
   * 时刻部分必须是「有点或有冒号」的实义时刻，不能全用可选量词——
   * 否则「明天」也会被匹配成「明天 」（吃掉尾随空格），造成文本错位。
   */
  new RegExp(
    '(?:' + WORD_PICK_RE.source + ')' +
    '\\s*(?:[上下午晚早凌晨傍]*)?\\s*\\d{1,2}' +
    '(?:\\s*点\\s*(?:半|\\d{1,2}\\s*分?)?|:\\d{2})',
    'i'
  ),
  // 倒装与序数：前两天 / 第七天后 / 二天后
  REL_PREFIX_RE_INLINE,
  REL_INLINE,
  // 口语相对日放最后：它是纯文字，容易在普通句子里误命中
  WORD_PICK_RE,
];

/**
 * 从光标所在行里挑一个像时间的片段。
 * 只在用户没做选区时兜底用，避免"光标停在日期上却要精确选中"的别扭。
 * 按 PICK_PATTERNS 顺序试（越严格越优先）；找不到返回 null。
 */
function pickTimeOnLine(editor, settings) {
  try {
    const cursor = editor.getCursor();
    const lineNo = cursor.line;
    const line = editor.getLine(lineNo);
    if (!line) return null;

    /*
     * 光标落在命中片段内时优先用它；否则取该行第一个。
     * 这样一行里有多个日期时，选的是光标所在那个，更符合直觉。
     */
    const cursorCh = typeof cursor.ch === 'number' ? cursor.ch : 0;
    let fallback = null;

    for (const pat of PICK_PATTERNS) {
      /*
       * 按设置跳过两类：
       * - 农历总开关关闭 → 任何农历片段都不参与识别
       * - 后缀形式未开启 → 只认前缀
       */
      // isLunarPat 必须先算出来再用 —— 放在后面会因 TDZ 抛错被 catch 吞掉，
      // 表现为整行识别全部返回 null（实测过）
      const isLunarPat =
        pat === LUNAR_PICK_RE || pat === LUNAR_TAIL_PICK_RE || pat === CN_MD_PICK_RE;
      if (isLunarPat) {
        const ex = extOf(settings);
        if (ex && ex.lunarEnabled === false) continue;
        if (pat === LUNAR_TAIL_PICK_RE && !(ex && ex.lunarMarkAnywhere === true)) continue;
      }
      const re = new RegExp(pat.source, pat.flags.indexOf('g') >= 0 ? pat.flags : pat.flags + 'g');
      // 口语相对日（明天 / tomorrow）不是日期格式，不能用 parseToDate 校验，
      // 否则永远匹配不到；按 pattern 类型选对应的校验函数。
      // 口语词、口语+时刻、倒装都不是日期格式，必须用 parseRelative 校验
      let verify;
      if (isLunarPat) {
        /*
         * 农历必须用 parseLunar 校验，不能用 parseRelative ——
         * 后者会把「八月」当成「8 个月后」，导致整条农历匹配被跳过，
         * 只剩「八月」这个碎片（实测过）。
         */
        verify = (t) => !!lunar.parseLunar(t);
      } else if (
        pat === COMPOSITE_PICK_RE || pat === NOW_PICK_RE ||
        pat === WEEKDAY_PICK_RE || PICK_NONDATE_RE.test(pat.source)
      ) {
        verify = parseRelative;
      } else {
        verify = parseToDate;
      }
      let hit;
      while ((hit = re.exec(line))) {
        // 兜底：空匹配时 lastIndex 不前进会死循环，强制推进
        if (!hit[0]) { re.lastIndex++; continue; }
        // 必须能被后续逻辑真正解析，否则换下一个候选，
        // 避免把「订单 1234 56 78」这类数字串当成日期交给用户
        /*
         * 命中片段可能带尾随空格（「会议 2026年五月十六 召开」→「2026年五月十六 」），
         * 带空格会让后续 compute 全部失败，必须 trim 并按 trim 后的长度收窄 to。
         */
        const raw = hit[0];
        if (!verify(raw.trim())) continue;
        const lead = raw.length - raw.replace(/^\s+/, '').length;
        const trimmed = raw.trim();
        const from = { line: lineNo, ch: hit.index + lead };
        const to = { line: lineNo, ch: hit.index + lead + trimmed.length };
        if (cursorCh >= from.ch && cursorCh <= to.ch) {
          return { text: trimmed, from, to };
        }
        if (!fallback) fallback = { text: trimmed, from, to };
      }
    }
    return fallback;
  } catch (e) {
    return null;
  }
}

/** 取当前活动编辑器的 editor 实例；没有则 null */
function activeEditor(app) {
  const ae = app && app.workspace && app.workspace.activeEditor;
  if (ae && ae.editor) return ae.editor;
  // 旧版 API 兜底
  const leaf = app && app.workspace && app.workspace.activeLeaf;
  if (leaf && leaf.view && leaf.view.editor) return leaf.view.editor;
  return null;
}

function registerTimeActions(plugin) {
  /*
   * 这里刻意用 checkCallback 而不是 editorCallback。
   * editorCallback 的命令只在编辑器获得焦点时才出现在命令面板里，
   * 用户在设置页、图谱视图、文件列表时搜不到，会以为功能没生效。
   * checkCallback 保证命令始终可见，执行时再判断上下文并给出明确提示。
   */
  plugin.addCommand({
    id: 'time-tools-timestamp-batch-convert',
    name: '时间戳：批量转换（整篇笔记）',
    checkCallback: (checking) => {
      if (!extEnabled(plugin)) return false;
      if (checking) return true;

      const ext = plugin.settings.timestamp.extensions;
      if (!ext || !ext.enabled) {
        new obsidian.Notice('时间转换扩展已关闭，可在设置 → 时间戳 里打开');
        return;
      }
      const app = plugin.app;
      const file = app.workspace && typeof app.workspace.getActiveFile === 'function'
        ? app.workspace.getActiveFile() : null;
      if (!file || !String(file.path || '').endsWith('.md')) {
        new obsidian.Notice('请先打开一篇 markdown 笔记');
        return;
      }
      // 只列已启用的转换项 —— 没开的项不该出现在批量里，否则会转出用户没要的东西
      const defs = (ACTION_DEFS || []).filter((a) => ext[a.key] === true);
      if (!defs.length) {
        new obsidian.Notice('尚未启用任何转换项，请先在设置 → 时间戳 里打开要用的项');
        return;
      }
      new BatchConvertModal(plugin, file, defs).open();
    },
  });

  plugin.addCommand({
    id: 'time-tools-timestamp-convert',
    // 名字里保留连续「时间转换」，方便在命令面板直接搜这个词
    name: '时间戳：时间转换（选中文本）',
    checkCallback: (checking) => {
      // 总开关关闭时命令直接从面板消失，而不是点了才提示
      if (!extEnabled(plugin)) return false;
      if (checking) return true; // 始终可见，可用性在执行时判断

      const ext = plugin.settings.timestamp.extensions;
      if (!ext || !ext.enabled) {
        new obsidian.Notice('时间转换扩展已关闭，可在设置 → 时间戳 里打开');
        return;
      }

      const editor = activeEditor(plugin.app);
      if (!editor) {
        new obsidian.Notice('请先打开一篇笔记，并把光标放在编辑区里');
        return;
      }

      let raw = editor.getSelection();
      let range = null; // 手动框选时不需要范围，替换选区即可
      if (!raw || !String(raw).trim()) {
        // 没选中就退一步：从光标所在行里找一个像时间的片段。
        // 这样光标停在日期上也能直接用，不必精确选中。
        // 记下它的起止位置，覆盖 / 追加都要靠这个定位。
        const picked = pickTimeOnLine(editor, plugin.settings);
        if (picked) {
          raw = picked.text;
          range = { from: picked.from, to: picked.to };
        }
      }
      if (!raw) {
        new obsidian.Notice('没找到时间文本。请先选中一个，例如 2026-09-19');
        return;
      }
      new TimeActionModal(plugin, editor, raw, range).open();
    },
  });

  /*
   * 右键菜单入口。
   * 命令面板找不到命令时（中文搜索不灵、或插件未重载），
   * 选中文本右键是更直觉的路径，且一定能看到当前装的是哪一版。
   */
  /*
   * 撤回上一次时间转换。
   * Ctrl+Z 能用，但如果转换后还做了别的编辑，Ctrl+Z 就得一路退回去。
   * 这条命令直接按**记下的位置**把原文换回来，一步到位。
   * 记录只在内存，关掉 Obsidian 就没了（不会写进设置或笔记）。
   */
  plugin.addCommand({
    id: 'time-tools-timestamp-undo-convert',
    name: '时间戳：撤回上一次时间转换',
    checkCallback: (checking) => {
      // 总开关关闭时命令消失（以前只判撤回开关，关了总开关这条还能跑）
      if (!extEnabled(plugin)) return false;
      if (checking) return true;
      const ext = plugin.settings.timestamp.extensions;
      if (!ext || ext.undoHintEnabled === false) {
        new obsidian.Notice('撤回提示已关闭，可在设置 → 时间戳 里打开');
        return;
      }
      const editor = activeEditor(plugin.app);
      if (!editor) {
        new obsidian.Notice('请先打开一篇笔记');
        return;
      }
      // 走记录层定位（行号 + 文本查找），不依赖装饰
      if (!undoLast(plugin, editor)) {
        new obsidian.Notice('这篇笔记没有可撤回的时间转换了');
      }
    },
  });

  plugin.registerEvent(
    plugin.app.workspace.on('editor-menu', (menu, editor) => {
      const ext = plugin.settings.timestamp.extensions;
      if (!extEnabled(plugin)) return; // 总开关关闭时不出现，保持菜单干净

      const sel = editor && editor.getSelection ? editor.getSelection() : '';
      const hasSel = sel && String(sel).trim();
      menu.addItem((item) =>
        item
          .setTitle(hasSel ? i18nT('k8bc1bbcd', '🔄 时间转换') : i18nT('k00f92bc3', '🔄 时间转换（未选中文本）'))
          .setIcon('clock')
          .onClick(() => {
            let raw = sel;
            let range = null;
            if (!raw || !String(raw).trim()) {
              const picked = pickTimeOnLine(editor);
              if (picked) {
                raw = picked.text;
                range = { from: picked.from, to: picked.to };
              }
            }
            if (!raw) {
              new obsidian.Notice('没找到时间文本。请先选中一个，例如 2026-09-19');
              return;
            }
            new TimeActionModal(plugin, editor, raw, range).open();
          })
      );
    })
  );
}

/* ------------------------------------------------------------------ *
 * 批量转换（v3.13）
 * ------------------------------------------------------------------ */

const BATCH_MAX = 200;

/**
 * 从全文里粗筛「看起来像时间」的片段。
 *
 * 这里只做粗筛，真正的判定交给 compute()：转不出结果（null）的一律不碰。
 * 所以多匹配一些不会误伤，漏匹配才会漏转 —— 宁可多筛也别漏。
 * 不用后行断言（?<!）：老版本 Electron 可能不支持，会直接抛错。
 */
function collectCandidates(text) {
  const pats = [
    /\b\d{13}\b/g,
    /\b\d{10}\b/g,
    /\d{4}\s*[-\/.年]\s*\d{1,2}\s*[-\/.月]\s*\d{1,2}(?:\s*[日号])?/g,
    /\d{1,2}\s*[月\/-]\s*\d{1,2}\s*[日号]/g,
    /[一二三四五六七八九十]{1,3}月[初一三四五六七八九十]{1,3}[日号]?/g,
    /农历[一二三四五六七八九十\d]{1,3}月[初一三四五六七八九十\d]{1,3}[日号]?/g,
    /(大后天|大前天|今天|明天|后天|昨天|前天|上周|本周|这周|下周|下下周)[一二三四五六日天1-7]?/g,
    /\d{1,2}:\d{2}(:\d{2})?/g,
  ];
  const out = [];
  for (let i = 0; i < pats.length; i++) {
    const re = pats[i];
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0]) out.push({ raw: m[0], index: m.index });
    }
  }
  // 按位置排；同一位置被多个正则命中时取最长的那个，并丢弃后面重叠的
  out.sort((a, b) => (a.index - b.index) || (b.raw.length - a.raw.length));
  const kept = [];
  let end = -1;
  for (let i = 0; i < out.length; i++) {
    if (out[i].index < end) continue;
    kept.push(out[i]);
    end = out[i].index + out[i].raw.length;
  }
  return kept;
}

/**
 * 扫描全文，返回真正能转的命中。
 * compute 抛错不算命中（某个转换项出 bug 不该让整篇批量失败）。
 */
function scanBatch(plugin, text, key) {
  const hits = [];
  const cands = collectCandidates(String(text || ''));
  for (let i = 0; i < cands.length; i++) {
    if (hits.length >= BATCH_MAX) break;
    let r = null;
    try { r = compute(plugin, key, cands[i].raw); } catch (e) { r = null; }
    if (r == null) continue;
    const s2 = String(r);
    if (!s2 || s2 === cands[i].raw) continue; // 转完没变化的不算
    hits.push({ raw: cands[i].raw, index: cands[i].index, result: s2 });
  }
  return hits;
}

/** 按顺序把命中替换回原文（hits 已按 index 递增且互不重叠） */
function applyBatch(text, hits) {
  let out = '';
  let cur = 0;
  for (let i = 0; i < hits.length; i++) {
    out += text.slice(cur, hits[i].index) + hits[i].result;
    cur = hits[i].index + hits[i].raw.length;
  }
  return out + text.slice(cur);
}

/**
 * 批量转换弹窗：先预览再改。
 * 不预览就直接改全文是不可接受的 —— 写坏了整篇笔记没法一眼看出哪处错了。
 */
class BatchConvertModal extends obsidian.Modal {
  constructor(plugin, file, defs) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
    this.defs = defs || [];
    this.key = this.defs.length ? this.defs[0].key : 'unify';
    this.hits = [];
    this.text = '';
  }

  async onOpen() {
    const el = this.contentEl;
    el.createEl('h3', { text: i18nT('kb9467966', '批量转换整篇笔记') });
    try {
      this.text = await this.plugin.app.vault.cachedRead(this.file);
    } catch (e) {
      el.createDiv({ text: i18nT('ke4b49736', '读取笔记失败，批量转换已取消。') });
      return;
    }

    const tip = el.createDiv();
    const list = el.createDiv();

    const render = () => {
      this.hits = scanBatch(this.plugin, this.text, this.key);
      const n = this.hits.length;
      tip.setText(
        n === 0
          ? i18nT('k45915354', '这篇笔记里没有可转换的内容（或所选转换项不适用于这些内容）。')
          : `识别到 ${n} 处${n >= BATCH_MAX ? `（已达上限 ${BATCH_MAX}）` : ''}。确认后一次性替换整篇，可用 Obsidian 自带撤销（Ctrl+Z）回退。`
      );
      const show = this.hits.slice(0, 30);
      for (let i = 0; i < show.length; i++) {
        list.createDiv({ text: `${show[i].raw}  →  ${show[i].result}` });
      }
      if (n > show.length) list.createDiv({ text: i18nT('k0b86faea', `…另有 ${n - show.length} 处`, n - show.length) });
      if (this.btn) this.btn.setDisabled(n === 0);
    };

    new obsidian.Setting(el)
      .setName(i18nT('kf7f8c9db', '转换项'))
      .setDesc(i18nT('kcf85d825', '只列出你已启用的转换项。切换会重新扫描预览。'))
      .addDropdown((d) => {
        if (!this.defs.length) d.addOption('unify', i18nT('kaacc0e5f', '（尚未启用任何转换项）'));
        for (let i = 0; i < this.defs.length; i++) {
          d.addOption(this.defs[i].key, actionText(this.defs[i].key, 'name', this.defs[i].name || this.defs[i].key));
        }
        d.setValue(this.key).onChange((v) => {
          this.key = v;
          this.renderList();
        });
      });

    // 预览区要在切换转换项时清空重画，否则会越堆越多
    this.renderList = () => {
      list.setText('');
      render();
    };

    new obsidian.Setting(el).addButton((b) => {
      this.btn = b;
      b.setButtonText(i18nT('k0716d5c5', '应用替换'))
        .setCta(true)
        .onClick(async () => {
          if (!this.hits.length) return;
          try {
            const next = applyBatch(this.text, this.hits);
            await this.plugin.app.vault.modify(this.file, next);
            new obsidian.Notice(`已替换 ${this.hits.length} 处（可用 Ctrl+Z 回退）`);
          } catch (e) {
            new obsidian.Notice('替换失败，笔记未改动。');
          }
          this.close();
        });
    });

    this.renderList();
  }

  onClose() {
    const el = this.contentEl;
    if (el && typeof el.empty === 'function') el.empty();
  }
}

module.exports = {
  // 基础时间戳
  VIEW_TYPE,
  TimestampView,
  registerTimestamp,
  refreshTimestampViews,
  renderTimestampSettings,

  // 扩展：时间文本转换
  lunar,
  parseToDate,
  fmt,
  dropSeconds,
  looksLikeUnix,
  toRelative,
  parseCNNumber,
  parseClockCN,
  parseComposite,
  isoWeekOf,
  isoWeekDate,
  parseEnglishRelative,
  daypartHour,
  defaultDaypartHours,
  hasHaoSuffix,
  cnMonthDaySuffix,
  shouldTreatAsLunar,

  // 自定义转换规则（v2.88 欠账，v2.95 真写入）
  parseUserRules,
  applyUserRules,
  USER_RULES_MAX,
  USER_RULE_LEN_MAX,
  applyUserRulesToName,
  stripCalendarMark,
  containsCalendarMark,
  unifyFormatOf,
  collectCandidates,
  scanBatch,
  applyBatch,
  BatchConvertModal,
  BATCH_MAX,
  resolveToDate,
  undoMarkOf,
  attachUndoWidget,
  restoreUndo,
  initUndoIndicator,
  refreshUndoIndicator,
  recordUndoEntry,
  restoreEntry,
  buildCm6Extension,
  undoLast,
  undoCount,
  undoStackSize,
  clearUndo,
  shiftUndoRecords,
  unresolvableUndoCount,
  pickTimeOnLine,
  parseRelative,
  looksLikeRelative,
  parseTermRequest,
  parseGanzhi,
  stripDecorations,
  stripWeekdayOnly,
  hasClock,
  hasSeconds,
  hasYear,
  compute,
  festivalNameOf,
  festivalDate,
  customFestivalList,
  TimeActionModal,
  renderTimeActionSettings,
  registerTimeActions,
};
