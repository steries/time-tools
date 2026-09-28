/*
 * 模块四：日历
 *
 * 只做一件事：修复 Calendar 插件设置页空白 + 抛 dow 读不到的问题。
 * 根因（Issue #395）：Calendar 读 window._bundledLocaleWeekSpec，
 * 而它要等自己的日历视图被打开过一次才赋值，没打开过就是 undefined。
 *
 * 只在缺失时补默认值，三条边界（改前先读 ARCHITECTURE.md）：
 *   1. 只补不覆盖 —— 已存在就完全不动
 *   2. 只写这一个变量 —— 绝不调 moment.updateLocale / defineLocale
 *      （前车之鉴：改全局 locale 带偏了别的插件的界面语言）
 *   3. 可关闭 —— 默认开
 */
'use strict';

const obsidian = require('obsidian');
const { normalizePath } = require('obsidian');
const {
  t: i18nT,
  MONTH_NAMES,
  WEEKDAY_NAMES,
  calLang,
  optText,
} = require('./i18n.js');
/**
 * 周号计算统一取 timejudge 的实现。
 * note.js 是叶子模块不能反向依赖本文件，所以共享逻辑只能下沉到判断表。
 */
const {
  weekDoyOf, firstWeekOffset, weeksInYear, dayOfYearOf, weekNumberOf, sameDay,
  WEEK_START_DOW,
} = require('./timejudge.js');

/**
 * 周列选择器：Calendar 各版本的 class 名不统一，四个别名都得认。
 * 点击命中（closest）、行号反查（querySelectorAll）、失效自检三处共用这一份。
 * 以前是同一串字符串写三遍，改版漏改一处就会出现「点周数没反应」且没提示。
 */
const WEEK_NUM_SELECTOR = '.week-num, .weekNum, .weeknum, .week-number';

/**
 * 周起始日下拉选项：由 timejudge 的 WEEK_START_DOW 派生，只在这里配中文名。
 * 值集合取自唯一真源，加/改周起始日只需动 timejudge 一处。
 * dow 为 null 表示「跟随系统区域」，运行时才解析。
 */
const WEEK_START_OPTIONS = [{ value: 'locale', label: '跟随系统区域', dow: null }].concat(
  Object.keys(WEEK_START_DOW).map((value) => ({
    value,
    label: '星期' + ['日', '一', '二', '三', '四', '五', '六'][WEEK_START_DOW[value]],
    dow: WEEK_START_DOW[value],
  }))
);

/**
 * 把「跟随系统区域」解析成具体 dow。
 * 用 moment 的 localeData 只读查询；拿不到就退回周日（moment 默认值）。
 */
function resolveLocaleDow() {
  try {
    const m = obsidian.moment ? obsidian.moment() : null;
    const ld = m && typeof m.localeData === 'function' ? m.localeData() : null;
    /*
     * 必须判 ld.week：写 w.week 会在 const w 初始化前引用，触发 TDZ，
     * 被下面 catch 静默吞掉 → 恒定返回周日 → 周数与周记文件名差一周。
     */
    const w = ld && typeof ld.week === 'function' ? ld.week() : null;
    if (w && typeof w.dow === 'number') return w.dow;
  } catch (e) { /* 只读查询失败不影响主流程 */ }
  return 0;
}

/** 按设置算出应该写入的 dow */
function targetDow(settings) {
  const cal = settings && settings.calendar;
  const v = cal ? cal.weekStart : 'locale';
  const hit = WEEK_START_OPTIONS.find((o) => o.value === v);
  if (!hit || hit.dow === null) return resolveLocaleDow();
  return hit.dow;
}

/**
 * 修复入口：变量缺失时补默认值。
 * 返回实际动作，供设置页显示 —— 不猜、不静默。
 */
function applyCalendarWeekSpec(settings) {
  const cal = settings && settings.calendar;
  if (!cal || cal.calendarFixEnabled === false) return '已关闭（未做任何写入）';

  if (typeof window === 'undefined') return '无 window';

  // 边界 1：已存在就完全不动，Calendar 自己的配置优先
  if (window._bundledLocaleWeekSpec) {
    const cur = window._bundledLocaleWeekSpec.dow;
    return `已存在，未改动（dow=${typeof cur === 'undefined' ? '无' : cur}）`;
  }

  // 边界 2：只写这一个变量，绝不动 moment 的全局 locale
  const dow = targetDow(settings);
  /*
   * doy 必须与 dow 配套，不能写死 6：恒写 6 与 zh-cn 的 {dow:1,doy:4} 不一致，
   * 而 Calendar 会拿这个 spec 去 defineLocale，周数和模板日期都会算偏。
   */
  window._bundledLocaleWeekSpec = { dow, doy: weekDoyOf(dow) };
  return `已补上（dow=${dow}, doy=${weekDoyOf(dow)}）`;
}

/** 设置页状态显示用：当前周起始（只读） */
function weekSpecStatus() {
  if (typeof window === 'undefined') return '无 window';
  const spec = window._bundledLocaleWeekSpec;
  if (!spec) return '未初始化（Calendar 设置页会报 dow）';
  const dow = spec.dow;
  return typeof dow === 'undefined' ? '已初始化但无 dow' : `dow=${dow}`;
}

/* ------------------------------------------------------------------ *
 * 设置页
 * ------------------------------------------------------------------ */

function renderCalendarSettings(containerEl, plugin) {
  const cal = plugin.settings.calendar;
  const notes = require('./note.js');

  /* ============ 区一：time tools 日历 ============ */
  /*
   * 折叠约定（用户要求）：总开关关闭时，其余设置项一律不渲染。
   * 之前关着也显示一大片模板路径输入框，既占地方又让人以为调了有用。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('k34aed95b', '启用 time tools 日历'))
    .setDesc(i18nT('kb1ee8965', "开启后可用命令「日历」打开月份网格：点年 / 月 / 日期 / 周数，分别生成年记、月记、日记、周记。"))
    .addToggle((t) =>
      t.setValue(cal.ownCalendarEnabled === true).onChange(async (v) => {
        cal.ownCalendarEnabled = v;
        // 互斥：启用time tools 日历时自动关掉 Calendar 增强（除非允许双开）
        const note = v === true ? enforceExclusive(plugin, 'own') : null;
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        // 关掉时把已打开的视图一并收起，否则会出现
        // 「开关关了、面板还开着」的割裂状态
        if (v !== true) closeOwnCalendar(plugin);
        plugin.redrawSettingsTab();
      })
    );

  // 共存开关放在折叠判断之前：无论time tools 日历开没开，它都要可见
  renderCoexistSection(containerEl, plugin);

  // 总开关未开 → 到此为止，其余全部折叠
  if (cal.ownCalendarEnabled !== true) {
    renderCalendarPluginSection(containerEl, plugin);
    return;
  }

  /* ---- 已开启：展开 ---- */
  const opened = isCalendarOpen(plugin);

  new obsidian.Setting(containerEl)
    .setName(opened
      ? i18nT('k8a98fa99', '关闭日历视图')
      : i18nT('ke9886e97', '打开日历视图'))
    .setDesc(opened
      ? i18nT('k082e7ac4', '当前视图已打开，点击关闭。')
      : i18nT('kd5a911e8', '点击打开日历视图，也可在命令面板搜索「日历」。'))
    .addButton((b) =>
      b.setButtonText(opened ? i18nT('kb15d9127', '关闭') : i18nT('kd7098f50', '打开'))
        .setCta()
        .onClick(async () => {
          if (opened) closeOwnCalendar(plugin);
          else await openOwnCalendar(plugin);
          plugin.redrawSettingsTab();
        })
    );

  /* ---- 笔记生成（Templater 联动）---- */
  containerEl.createDiv({ cls: 'tt-cal-sub', text: i18nT('k75e90ef6', '笔记生成') });
  notes.renderNoteSettings(containerEl, plugin);

  containerEl.createDiv({ cls: 'tt-cal-sub', text: i18nT('k7c0e24c0', '圆点') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('kea445a06', '显示字数圆点'))
    .setDesc(i18nT('k54fc7f05', '日期下方按当天日记字数显示圆点。关闭则界面更干净。'))
    .addToggle((t) =>
      t.setValue(cal.dotsEnabled !== false).onChange(async (v) => {
        cal.dotsEnabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 农历模式：打开后取代圆点（互斥）。
   * 说明里必须写清「会关掉圆点」—— 否则用户开了农历发现圆点没了，
   * 会以为是 bug。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('kaf1120c5', '日期格显示农历'))
    .setDesc(i18nT('kbcdf1332', "默认关。打开后日期格显示农历（初一显示月名，其余显示农历日），并**取代字数圆点**：有笔记只在农历旁显示一个小点。格子空间有限，两者互斥。"))
    .addToggle((t) =>
      t.setValue(cal.lunarOnCalendar === true).onChange(async (v) => {
        cal.lunarOnCalendar = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  // 圆点关掉后，字数配置项没有意义，一并折叠
  if (cal.dotsEnabled === false) {
    // 继续往下走（周起始日等仍需渲染）
  } else if (cal.lunarOnCalendar === true) {
    // 农历模式下圆点不显示，字数配置同样无意义
  } else {
  new obsidian.Setting(containerEl)
    .setName(i18nT('ka43c4195', '每个圆点代表的字数'))
    .setDesc(i18nT('kea46a20c', "日期格圆点 = 当天日记字数 ÷ 此值；周数列 = 该周「周记本身」字数 ÷ 此值（没周记就没点）。留空或 0 退化为「有笔记 = 1 个实心点」。横排每 5 个一行，最多 10 个。数值太小（如 1）会都顶到上限，建议 ≥ 50。"))
    .addText((tx) =>
      tx.setPlaceholder('250')
        .setValue(String(cal.wordsPerDot ?? 250))
        .onChange(async (v) => {
          const n = parseInt(String(v).trim(), 10);
          cal.wordsPerDot = Number.isFinite(n) && n > 0 ? n : 0;
          await plugin.saveSettings();
          /*
           * 这里曾经调用 plugin.redrawSettingsTab() —— 那是错的：
           * 重绘会销毁并重建整个设置页，输入框 DOM 跟着重建，焦点丢失，
           * 表现就是「每敲一个字符就失焦，必须先删一个才能再填一个」。
           * 数值变化只需刷新日历视图，设置页本身不用动。
           */
          refreshCalendarViews(plugin);
        })
    );
  }

  new obsidian.Setting(containerEl)
    .setName(i18nT('kfe9269df', '格子固定尺寸'))
    .setDesc(i18nT('k870b36c0', '开启后格子高度固定、不随面板拉伸，排布更紧凑。关闭则 6 行均分可用高度。'))
    .addToggle((t) =>
      t.setValue(cal.fixedCellSize === true).onChange(async (v) => {
        cal.fixedCellSize = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  containerEl.createDiv({ cls: 'tt-cal-sub', text: i18nT('kcc0760bc', '周起始日') });
  new obsidian.Setting(containerEl)
    .setName(i18nT('k8bd3cd15', '周起始日'))
    .setDesc(i18nT('k32510d13', "全插件唯一的周起始日：网格、周数、「第 N 周」解析、修复 Calendar 的默认值都用它。需与 Calendar 的「Start week on」设为一致。"))
    .addDropdown((d) => {
      WEEK_START_OPTIONS.forEach((o) => d.addOption(o.value, optText('weekStart', o.value, o.label)));
      d.setValue(cal.weekStart || 'locale').onChange(async (v) => {
        cal.weekStart = v;
        await plugin.saveSettings();
        applyCalendarWeekSpec(plugin.settings);
        plugin.redrawSettingsTab();
      });
    });

  renderCalendarPluginSection(containerEl, plugin);

  // 区末恢复默认：日历与笔记两块一起重置
  const { addResetButton } = require('./settings.js');
  addResetButton(containerEl, plugin, ['calendar', 'notes'], '日历');
}

/**
 * 两个日历的共存开关。
 *
 * 默认互斥：开启「在 Calendar 视图上接管点击」会自动关掉并收起 time tools 日历。
 * 两个日历同时在工作区里各渲染一套月份网格、各自维护一套周数与圆点，
 * 状态互不相通，看着像同一份数据其实各算各的 —— 所以默认不让它们同时出现。
 * 确有需要（比如对照两边的周数排布）由用户显式打开双开。
 */
function renderCoexistSection(containerEl, plugin) {
  const cal = plugin.settings.calendar;

  new obsidian.Setting(containerEl)
    .setName(i18nT('k15d34898', '允许同时开启两个日历（双开）'))
    .setDesc(i18nT('k39f93908', '默认关 = 两个日历互斥：开一个会自动关掉另一个。打开后才允许并存。'))
    .addToggle((t) =>
      t.setValue(cal.allowBoth === true).onChange(async (v) => {
        cal.allowBoth = v;
        // 关掉双开时立刻按互斥收敛一次，否则当前状态会卡在「两者都开」
        const note = v !== true
          ? (cal.enhanceCalendarEnabled === true
            ? enforceExclusive(plugin, 'enhance')
            : enforceExclusive(plugin, 'own'))
          : null;
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        plugin.redrawSettingsTab();
      })
    );
}

/**
 * 互斥收敛：保留 keep 指定的那一个，关掉另一个。
 * @param {'own'|'enhance'} keep 要保留的日历
 * @returns {string|null} 做了什么，供 Notice 提示；未动返回 null
 */
function enforceExclusive(plugin, keep) {
  const cal = plugin.settings.calendar;
  if (!cal || cal.allowBoth === true) return null;
  if (keep === 'own' && cal.enhanceCalendarEnabled === true) {
    cal.enhanceCalendarEnabled = false;
    return '已自动关闭「在 Calendar 视图上接管点击」';
  }
  if (keep === 'enhance' && cal.ownCalendarEnabled === true) {
    cal.ownCalendarEnabled = false;
    closeOwnCalendar(plugin);
    return '已自动关闭并收起 time tools 日历';
  }
  return null;
}

/**
 * 启动期归一化 —— 堵住「没允许双开却双开」最主要的一条路。
 *
 * allowBoth 是后加的开关，在此之前两个日历开关可以同时为 true；老 data.json
 * 升级上来就带着这个状态，而 enforceExclusive 只在设置页拨动时触发 —— 用户不拨就没人收敛。
 * 保留哪个按实况判断：此刻 time tools 日历开着就留它，否则留增强。
 *
 * @returns {string|null} 做了什么，供 Notice 提示；无需收敛返回 null
 */
/**
 * 启动期归一化：两个增强开关不能同时开。
 *
 * 它们现在是互斥的两种模式，而 nativeDayWeek 曾经依赖 enhanceCalendarEnabled
 * （打开它会自动打开后者），老 data.json 里可能两者同时为 true。
 * 同时为 true 时保留「全接管」—— 它的覆盖面更完整，半接管是它的子集。
 *
 * @returns {string|null} 做了什么，供 Notice 提示
 */
function normalizeEnhanceExclusive(plugin) {
  const cal = plugin.settings && plugin.settings.calendar;
  if (!cal || cal.nativeDayWeek !== true || cal.enhanceCalendarEnabled !== true) return null;
  cal.nativeDayWeek = false;
  return '两个增强开关此前同时开启，已保留「全接管」、关闭「日/周用 Calendar 原生」';
}

function normalizeCalendarExclusive(plugin) {
  const cal = plugin.settings && plugin.settings.calendar;
  // 先归一对内的：两个增强开关不能同时开（老配置可能同时为 true）
  const dn = normalizeEnhanceExclusive(plugin);
  if (!cal || cal.allowBoth === true) return dn || null;
  if (cal.ownCalendarEnabled !== true || cal.enhanceCalendarEnabled !== true) return null;
  let note;
  if (isCalendarOpen(plugin)) {
    cal.enhanceCalendarEnabled = false;
    note = '两个日历此前同时开启，已保留 time tools 日历、关闭 Calendar 增强';
  } else {
    cal.ownCalendarEnabled = false;
    note = '两个日历此前同时开启，已保留 Calendar 增强、关闭 time tools 日历';
  }
  // 无论保留哪个，总开关一旦为 false 就把视图收起（含布局恢复出来的）
  if (cal.ownCalendarEnabled !== true) closeOwnCalendar(plugin);
  return note;
}

/**
 * Calendar 插件那一区（含设置页空白修复 + 增强开关）。
 * 单独抽出来：time tools 日历折叠时它照样要显示 ——
 * Bug 修复是默认开的，不能被自研部分的折叠带没了。
 */
/**
 * Calendar 插件那一区。
 *
 * 结构（用户定）：
 *   1. Bug 折叠 —— 默认收起，只放 Bug 修复 / 兜底开关（空白页修复、Templater 补跑）
 *   2. calendar 效果增强 —— 两个开关互斥：只能开一个，或都关
 *
 * 单独抽成函数：time tools 日历折叠时这一区照样要显示。
 */
function renderCalendarPluginSection(containerEl, plugin) {
  const cal = plugin.settings.calendar;

  containerEl.createDiv({ cls: 'tt-cal-section', text: i18nT('k3a84cae1', 'Calendar 插件') });

  renderBugFoldSection(containerEl, plugin);

  /* ============ calendar 效果增强 ============ */
  containerEl.createDiv({ cls: 'tt-cal-section', text: i18nT('k43ddc26d', 'calendar 效果增强') });

  /*
   * 两个开关是互斥的两种模式，不是叠加：
   *   半接管 = 日/周交回 Calendar 原生，月/年由本插件生成
   *   全接管 = 年/月/周/日全部由本插件生成
   * 都关 = 完全用 Calendar 原生功能（此时折叠区的「补跑 Templater」负责模板）
   * 同时开没有意义：全接管已经包含了半接管的部分，只会互相打架。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('k82aca320', '日/周用 Calendar 原生功能，月/年使用 time tools 插件'))
    .setDesc(i18nT('k98defe6b', "半接管。开启后：点日期 / 周数放行给 Calendar 原生（模板走核心「日记」插件，Templater 语法靠折叠区里的补跑兜底）；点年 / 月由 time tools 接管，走 Templater。适合日记周记已由 Calendar 配好、只想补月记年记。与下面的「接管点击」互斥。"))
    .addToggle((t) =>
      t.setValue(cal.nativeDayWeek === true).onChange(async (v) => {
        const note = setEnhanceMode(plugin, v === true ? 'dayweek' : 'none');
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k60622dbe', '在 Calendar 视图上接管点击'))
    .setDesc(i18nT('k499ba9ea', "全接管。开启后 Calendar 视图里的年 / 月 / 周 / 日期点击全部由 time tools 生成，一律走 Templater 模板。依赖 Calendar 内部 DOM，改版可能失效，故默认关。与上面的「日/周用原生」互斥；开启还会收起 time tools 日历（除非允许双开）。"))
    .addToggle((t) =>
      t.setValue(cal.enhanceCalendarEnabled === true).onChange(async (v) => {
        const note = setEnhanceMode(plugin, v === true ? 'full' : 'none');
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        plugin.redrawSettingsTab();
      })
    );
}

/**
 * 设置增强模式，并做互斥收敛。
 * @param {'dayweek'|'full'|'none'} mode
 * @returns {string|null} 做了什么，供 Notice 提示
 */
function setEnhanceMode(plugin, mode) {
  const cal = plugin.settings.calendar;
  const wasOther = mode === 'dayweek'
    ? cal.enhanceCalendarEnabled === true
    : mode === 'full'
      ? cal.nativeDayWeek === true
      : false;

  cal.nativeDayWeek = mode === 'dayweek';
  cal.enhanceCalendarEnabled = mode === 'full';

  let note = wasOther ? '两个增强开关只能开一个：已自动关闭另一个' : null;
  // 任一增强模式开启时，与 time tools 日历仍按 allowBoth 互斥
  if (mode !== 'none') {
    const n2 = enforceExclusive(plugin, 'enhance');
    if (n2) note = note ? note + '；' + n2 : n2;
  }
  return note;
}

/**
 * Bug 折叠区：默认收起。
 *
 * 折叠只是不让它们占着正常用户的视线，不影响已开启的开关生效。
 * 两个开关的默认值不同：空白页修复默认关（没有出问题就别往 window 上补东西），
 * Templater 补跑默认开（Calendar 用不了 Templater 时唯一的兜底）。
 */
function renderBugFoldSection(containerEl, plugin) {
  const cal = plugin.settings.calendar;

  new obsidian.Setting(containerEl)
    .setName(i18nT('k9c43a4e6', '如果 Calendar 插件出现 Bug 请打开'))
    .setDesc(i18nT('k4a21c3d1', "只是折叠开关，本身不改变任何功能，默认收起 —— 里面的开关照常生效。遇到 Calendar 设置页空白、Templater 语法没被执行时再打开。"))
    .addToggle((t) =>
      t.setValue(cal.bugFoldOpen === true).onChange(async (v) => {
        cal.bugFoldOpen = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  if (cal.bugFoldOpen !== true) return;

  containerEl.createDiv({
    cls: 'tt-cal-intro',
    text: i18nT('k03ba5c79',
      '修复 Calendar 插件（liamcain/obsidian-calendar-plugin）设置页空白的问题：' +
      '它读 window._bundledLocaleWeekSpec，而该变量要等日历视图打开过一次才初始化，' +
      '未初始化时读 .dow 抛错，导致 Weekly Note Settings 整段不显示。'),
  });

  new obsidian.Setting(containerEl)
    .setName(i18nT('kf3de8a42', '修复 Calendar 设置页空白'))
    .setDesc(i18nT('kbb05cdfc', "开启后，若 window._bundledLocaleWeekSpec 缺失则补默认值（只补不覆盖）。不会改动 moment 全局区域设置，不影响其他插件。默认关 —— Calendar 设置页出现空白时再打开。"))
    .addToggle((t) =>
      t.setValue(cal.calendarFixEnabled !== false).onChange(async (v) => {
        cal.calendarFixEnabled = v;
        await plugin.saveSettings();
        if (v) applyCalendarWeekSpec(plugin.settings);
        plugin.redrawSettingsTab();
      })
    );

  const status = containerEl.createDiv({ cls: 'tt-cal-status' });
  status.setText(i18nT('k807bc5f8', '当前：{0}', weekSpecStatus()));

  new obsidian.Setting(containerEl)
    .setName(i18nT('k74d9faed', '立即应用'))
    .setDesc(i18nT('k2ebd6bee', '手动再补一次（通常不需要，重启 Obsidian 后会自动生效）。'))
    .addButton((b) =>
      b.setButtonText(i18nT('k5b0520a9', '应用')).setCta().onClick(async () => {
        const r = applyCalendarWeekSpec(plugin.settings);
        status.setText(i18nT('kbc7fdc3c', '当前：{0}（本次：{1}）', weekSpecStatus(), r));
        new obsidian.Notice('日历修复：' + r);
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1eac6a23', 'Calendar 新建的笔记补跑 Templater'))
    .setDesc(i18nT('kfd7b77ee', "三个日历开关都关掉、改用 Calendar 原生新建日记 / 周记时，它走核心「日记」插件的模板通道，模板被原样复制，<% %> 不会执行。开启后，本插件检测到这类新笔记（空文件、含裸 <% %>、或整段等于模板原文）就用 Templater 重写一次。已渲染的文件不会再动，不与 Templater 自带「新建时触发」叠加。识别需「文件名符合格式 + 落在上面填的文件夹」，所以 Calendar 那边也要建到同一文件夹。"))
    .addToggle((t) =>
      t.setValue(cal.templaterBridge !== false).onChange(async (v) => {
        cal.templaterBridge = v;
        await plugin.saveSettings();
      })
    );
}

/* ------------------------------------------------------------------ *
 * Templater 桥接
 *
 * 场景：三个日历开关都关、用 Calendar 原生新建周期笔记时，模板被原样复制，<% %> 不执行。
 * 兜底：监听新建文件，命中周期笔记且尚未渲染（空 / 含裸 <% %> / 等于模板原文）时，
 * 调 Templater 官方 API 重写一次。幂等来自「只认可判定的未渲染状态」。
 * ------------------------------------------------------------------ */

/** 只处理刚创建的文件：同步 / 重建索引也会触发 create，绝不能去动老笔记 */
const BRIDGE_WINDOW_MS = 10000;
/*
 * create 事件触发时，核心「日记」插件往往还没把模板内容写进去（它是 create 之后异步写的）。
 * 立刻读会读到空文件；等这一小会儿再读，才能区分「真的没模板」和「还没写完」。
 * 同时也是给 Templater 自带的「新建文件时触发」留出执行时间 —— 它跑完了我们就不再补一次。
 */
const BRIDGE_DELAY_MS = 350;
/** 去重表上限，防止长期累积（规则四：不积累废弃数据） */
const BRIDGE_MAX = 200;
const bridgedPaths = new Map(); // path -> 处理时刻

function pruneBridged(now) {
  bridgedPaths.forEach((t, p) => {
    if (now - t > BRIDGE_WINDOW_MS * 6) bridgedPaths.delete(p);
  });
  // Map 按插入顺序迭代，最早的在最前
  while (bridgedPaths.size > BRIDGE_MAX) {
    bridgedPaths.delete(bridgedPaths.keys().next().value);
  }
}

/*
 * 用户可见提示。
 * 铁律：失败要么让用户看见，要么有明确降级路径 —— 只 console.warn 等于没有。
 * notifyOnce 按消息去重（上限 100 条）：补跑是「每建一个笔记触发一次」，
 * 不去重会变成每建一篇弹一次，反而逼用户关掉这个功能。
 */
const _noticed = new Set();
function notify(msg) {
  try {
    if (typeof obsidian.Notice === 'function') new obsidian.Notice(msg);
  } catch (e) { /* 提示失败不能影响主流程 */ }
}
function notifyOnce(msg) {
  if (_noticed.has(msg)) return;
  _noticed.add(msg);
  if (_noticed.size > 100) _noticed.delete(_noticed.keys().next().value);
  notify(msg);
}

function registerTemplaterBridge(plugin) {
  try {
    const vault = plugin.app && plugin.app.vault;
    if (!vault || typeof vault.on !== 'function') return;
    plugin.registerEvent(
      vault.on('create', (file) => {
        bridgeNewNote(plugin, file).catch((e) => {
          console.warn('[Time Tools] Templater 桥接失败', e);
          notifyOnce(
            'Templater 补跑失败：' + (e && e.message ? e.message : e) + '（详见控制台）'
          );
        });
      })
    );
  } catch (e) {
    console.warn('[Time Tools] Templater 桥接注册失败', e);
    notifyOnce('Templater 补跑监听注册失败，本次启动不会自动补跑模板');
  }
}

/** parseNoteRef 返回 day / week / month / year，这里换成 notes 配置里的键 */
const BRIDGE_KIND_OF = { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' };

async function bridgeNewNote(plugin, file) {
  /*
   * 每个退出点都带一句原因，读代码时才知道这一步在防什么。
   * （曾有一版把原因存进全局对象、再用诊断命令展示；诊断命令已移除，不再留状态。）
   */
  const bail = (_reason) => false;
  const ok = () => true;

  const cal = plugin.settings && plugin.settings.calendar;
  if (!cal || cal.templaterBridge === false) return bail('开关「补跑 Templater」为关'); // 默认开
  if (!file || !/\.md$/i.test(file.path || '')) return bail('不是 md 文件');

  const now = Date.now();
  pruneBridged(now);

  const ct = file.stat && file.stat.ctime;
  if (!ct) return bail('file.stat.ctime 缺失');
  if (now - ct > BRIDGE_WINDOW_MS) return bail('不是刚创建的文件（超出时间窗）');
  if (bridgedPaths.has(file.path)) return bail('该文件已补跑过，跳过');

  const notes = plugin.settings.notes || {};
  const dow = targetDow(plugin.settings);
  const noteMod = require('./note.js');
  const ref = parseNoteRef(file.basename || '', dow, notes, plugin.settings);
  const p = String(file.path || '');

  /*
   * 匹配改成「文件名」与「文件夹」双通道，任一命中即可。
   * 以前只认文件名格式：用户实际文件名常带星期后缀（2026-09-25-周五），
   * 与配置格式 YYYY-MM-DD 对不上就整类漏掉 —— 这是「点了没反应」的真因之一。
   * 文件夹是更稳的信号：Calendar 会把笔记建到用户在「笔记生成」里配的目录。
   */
  let kind = ref ? BRIDGE_KIND_OF[ref.kind] : null;
  let cfg = kind ? notes[kind] : null;
  if (!cfg) {
    for (const k of ['daily', 'weekly', 'monthly', 'yearly']) {
      const c = notes[k];
      if (!c || !c.folder) continue;
      const f = noteMod.resolvePathTokens(c.folder);
      if (f && (p === f + '/' + file.name || p.startsWith(f + '/'))) {
        kind = k; cfg = c; break;
      }
    }
  }
  if (!cfg) return bail('文件名与文件夹都不匹配日/周/月/年记配置');

  /*
   * 文件夹校验始终执行（不能因为走了文件名通道就跳过）：
   * 否则收件箱里一个恰好叫 2026-09-28 的文件也会被当成日记渲染。
   */
  const folder = noteMod.resolvePathTokens(cfg.folder);
  if (folder) {
    if (p !== folder + '/' + file.name && !p.startsWith(folder + '/')) {
      return bail('文件不在配置的文件夹内：期望 ' + folder + '，实际 ' + p);
    }
  }

  /*
   * 等核心「日记」插件写完模板、也给 Templater 自带的「新建文件时触发」留出执行时间。
   * 它俩谁先跑完都不影响判定：跑完的笔记内容会是渲染结果，下面判为「已渲染」直接跳过。
   */
  await new Promise((r) => setTimeout(r, BRIDGE_DELAY_MS));

  let body = '';
  try {
    body = await plugin.app.vault.cachedRead(file);
  } catch (e) {
    return;
  }

  /*
   * 判定「尚未被 Templater 渲染」。只认三种**可判定**的状态：
   *   1. 空文件 —— 核心「日记」插件没配模板时就是这样，此时最需要补跑；
   *   2. 含裸 <% —— 模板被原样复制，Templater 语法没执行；
   *   3. 内容与模板文件原文完全相同 —— 模板被整段复制（模板里可能没有 <% 语法）。
   * 除此以外一律跳过：内容已经有实质东西，说明渲染过了，再写一次会覆盖用户输入。
   */
  const raw = body == null ? '' : String(body);
  const trimmed = raw.trim();
  let unrendered = trimmed === '' || raw.indexOf('<%') >= 0;

  /*
   * 模板文件只用于「整段等于模板原文」这条辅助判定，可有可无。
   * 以前把它当硬性前置（没配就退出），而用户模板常配在 Calendar 那边，
   * 本插件的 notes.*.template 为空 —— 于是整类场景不生效。
   */
  let tplText = null;
  if (cfg.template) {
    const found = noteMod.resolveTemplate(plugin.app, cfg.template);
    if (found && found.file) {
      try {
        tplText = await plugin.app.vault.cachedRead(found.file);
      } catch (e) {
        tplText = null;
      }
    }
  }
  if (!unrendered && tplText != null) {
    if (String(tplText).trim() === trimmed) unrendered = true;
  }
  if (!unrendered) return bail('内容已渲染过，不动');

  const t = noteMod.getTemplater(plugin.app);
  if (!t) {
    console.warn('[Time Tools] Templater 不可用，无法补跑模板：', file.path);
    notifyOnce('Templater 不可用，无法补跑模板 —— 请安装并启用 Templater 后重试');
    return bail('Templater 未安装或未初始化');
  }

     /*
     * 渲染对象是笔记正文，不是配置的模板文件：用户模板常配在 Calendar 那边，
     * 本插件 notes.*.template 常为空；即便有值，两边不一致也会覆盖掉 Calendar 写进去的东西。
     */
  const source = raw;

  /*
   * 首选 Templater 的公开命令 replace-in-file-templater（渲染当前活动文件）。
   * 命令 ID 已核实三处一致：deepwiki 命令表、Advanced URI 文档、dsebastien 指南。
   * 此前两版分别用了不存在的方法名、写错的命令 ID，都是凭印象猜的 —— 这是第三次修正。
   * 命令由 Templater 自己完成「读取→渲染→写回」，不依赖任何内部方法签名。
   */
  const TPL_CMD = 'templater-obsidian:replace-in-file-templater';
  try {
    const ws = plugin.app && plugin.app.workspace;
    if (ws && typeof ws.getActiveFile === 'function' && ws.getActiveFile() !== file
        && typeof ws.getLeaf === 'function') {
      await ws.getLeaf().openFile(file);
    }
    if (plugin.app.commands && typeof plugin.app.commands.executeCommandById === 'function') {
      await plugin.app.commands.executeCommandById(TPL_CMD);
      const after = await plugin.app.vault.cachedRead(file);
      if (String(after).indexOf('<%') < 0) {
        bridgedPaths.set(file.path, now);
        new obsidian.Notice('已用 Templater 重新渲染：' + (file.basename || file.path));
        return ok();
      }
    }
  } catch (e) {
    console.warn('[Time Tools] Templater 命令执行失败，退回 API：', e && e.message);
  }

  /* 命令不可用（版本差异）时退回 API：同样渲染笔记自身内容 */
  if (typeof t.parse_template !== 'function') {
    console.warn(
      '[Time Tools] Templater 命令与 parse_template 都不可用：', file.path,
      '可用方法：', Object.keys(t).join(',')
    );
    return bail('Templater 命令与 parse_template 都不可用（版本不兼容）');
  }

  const RUN_MODE_OVERWRITE_FILE = 2;
  let rendered = '';
  try {
    /*
     * create_running_config 是 Templater 的公开方法，
     * 比手写 config 结构可靠 —— 结构随版本变化也不会错。
     */
    const runCfg = typeof t.create_running_config === 'function'
      ? t.create_running_config(file, file, RUN_MODE_OVERWRITE_FILE)
      : { template_file: file, target_file: file, run_mode: RUN_MODE_OVERWRITE_FILE };
    rendered = await t.parse_template(runCfg, source);
  } catch (e) {
    console.warn('[Time Tools] Templater 渲染失败，未写入任何内容：', file.path, e);
    notify(
      'Templater 渲染失败，笔记未写入任何内容：' + (file.basename || file.path)
    );
    return bail('Templater 渲染抛错：' + (e && e.message ? e.message : String(e)));
  }
  if (rendered == null) rendered = '';

  bridgedPaths.set(file.path, now);
  // 必须覆盖写，不能用 append：追加会让模板内容在笔记里出现两份
  await plugin.app.vault.modify(file, String(rendered));
  new obsidian.Notice('已用 Templater 重新渲染：' + (file.basename || file.path));
  return ok();
}


/** 打开time tools 日历视图（复用已有 leaf，避免开多个）*/
/** 视图当前是否已打开（设置页据此显示「打开」还是「关闭」）*/
function isCalendarOpen(plugin) {
  try {
    const ws = plugin.app && plugin.app.workspace;
    if (!ws || typeof ws.getLeavesOfType !== 'function') return false;
    return (ws.getLeavesOfType(CAL_VIEW_TYPE) || []).length > 0;
  } catch (e) {
    return false;
  }
}

async function openOwnCalendar(plugin) {
  /*
   * 门控：总开关关着时直接拒绝。
   * 之前开关只作用于设置页渲染，功能侧完全没接 ——
   * 关了开关命令照样能开视图，等于没关。
   */
  const cal = plugin.settings && plugin.settings.calendar;
  if (!cal || cal.ownCalendarEnabled !== true) {
    new obsidian.Notice('time tools 日历未启用，请先在设置里打开总开关');
    return false;
  }
  /*
   * 互斥：Calendar 增强开着且未允许双开时，拒绝打开time tools 日历。
   * 只靠设置页的开关联动挡不住命令面板这条路径。
   */
  if (cal.allowBoth !== true && cal.enhanceCalendarEnabled === true) {
    new obsidian.Notice(
      '已启用「在 Calendar 视图上接管点击」，两者默认互斥。如需同时开启，请打开「允许同时开启两个日历」。'
    );
    return false;
  }
  try {
    const ws = plugin.app.workspace;
    let leaf = ws.getLeavesOfType(CAL_VIEW_TYPE)[0];
    if (!leaf) {
      const r = ws.getRightLeaf(false);
      if (r) { await r.setViewState({ type: CAL_VIEW_TYPE, active: true }); leaf = r; }
    }
    if (leaf) ws.revealLeaf(leaf);
    return true;
  } catch (e) {
    new obsidian.Notice('打开日历视图失败：' + (e && e.message ? e.message : e));
    return false;
  }
}

/**
 * 关闭time tools 日历视图。
 *
 * 之前没有这条退路：视图一旦打开就只能禁用插件才退得出去。
 * 现在视图内的 ×、命令面板的「关闭日历」都走这里。
 * detach 之后 Obsidian 会自己走 view 的 onClose()，观察器在那里断开。
 */
function closeOwnCalendar(plugin) {
  try {
    const ws = plugin.app.workspace;
    const leaves = ws.getLeavesOfType(CAL_VIEW_TYPE) || [];
    if (leaves.length === 0) return false;
    leaves.forEach((l) => l.detach());
    return true;
  } catch (e) {
    console.warn('[Time Tools] 关闭日历视图失败', e);
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * 注册入口（onload 调用）
 * ------------------------------------------------------------------ */

function registerCalendar(plugin) {
  // 延后到布局就绪，避免与其他插件的初始化抢时序
  const apply = () => {
    try {
      applyCalendarWeekSpec(plugin.settings);
    } catch (e) {
      console.error('[Time Tools] 日历修复失败', e);
    }
    /*
     * 布局就绪后再做互斥归一化与残留清理。
     * 放在这里是因为：此时视图已注册、布局已恢复，
     * 才能准确判断「日历视图此刻是否开着」，也才收得掉被恢复出来的叶子。
     */
    try {
      const note = normalizeCalendarExclusive(plugin);
      const c = plugin.settings && plugin.settings.calendar;
      if (!c || c.ownCalendarEnabled !== true) closeOwnCalendar(plugin);
      if (note) {
        Promise.resolve(plugin.saveSettings()).catch(() => {});
        new obsidian.Notice(note);
      }
    } catch (e) {
      console.error('[Time Tools] 日历互斥归一化失败', e);
    }
  };
  if (typeof plugin.app.workspace.onLayoutReady === 'function') {
    plugin.app.workspace.onLayoutReady(apply);
  } else {
    apply();
  }

}

/* ------------------------------------------------------------------ *
 * time tools 日历视图
 *
 * 参考 Dust Calendar 的布局：月份网格 + 周数列。
 * 四种点击：年份→年记、月份→月记、日期→日记、周数→周记。
 * 总开关 ownCalendarEnabled，默认关。
 * ------------------------------------------------------------------ */
const CAL_VIEW_TYPE = 'time-tools-calendar-view';
/* 恒定 6 行 × 7 列，切月时高度不跳 */
const GRID_ROWS = 6;
/* 圆点：一行最多 5 个，超出换行，总上限 10（两行） */
const DOTS_PER_ROW = 5;
const DOTS_MAX = 10;

class CalendarNoteView extends obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
    /*
     * 当前聚焦日期 —— 全填充高亮画在这天。
     *
     * 它由两处驱动：点格子（乐观反馈）和 file-open（当前打开的笔记）。
     * 之前只有「点击」驱动，且切月/生成后立刻清空，于是全填充长期
     * 落在 is-today 上，看起来像锁死在今天。
     */
    this.picked = null;
    /*
     * 高亮落在哪类元素上：day / week / month / year。
     *
     * 只存一个日期是不够的 —— 周记对应的是「一整行 + 周数格」，
     * 月记 / 年记对应的是标题。旧实现没有这个字段，于是打开周记时
     * 高亮只能落在一个日期格上，且解析出的周首日常与点击时不同，
     * 看着像在乱蹦。
     * 周记时 picked 存的是周首日（周一或周日，随周起始设置）。
     */
    this.selKind = null;
    this.resizeObserver = null;
  }
  getViewType() { return CAL_VIEW_TYPE; }
  getDisplayText() { return '日历'; }
  getIcon() { return 'calendar-days'; }

  async onOpen() {
    /*
     * 兜底：布局恢复会绕过 openOwnCalendar 的门控直接实例化视图。
     * 上次退出时日历开着，下次启动 Obsidian 会把它原样恢复出来 ——
     * 哪怕总开关已经关了、或增强开着且未允许双开。
     * 这里自己退场，延后一拍执行以避开 onOpen 内部流程。
     */
    const c0 = this.plugin && this.plugin.settings ? this.plugin.settings.calendar : null;
    if (c0 && (c0.ownCalendarEnabled !== true
      || (c0.allowBoth !== true && c0.enhanceCalendarEnabled === true))) {
      setTimeout(() => { try { this.leaf.detach(); } catch (e) { /* 已销毁则忽略 */ } }, 0);
      return;
    }
    this.syncActiveFile();
    this.render();
    /*
     * 跟随当前打开的笔记：切到某篇日记时，全填充高亮挪到那天。
     * 用 registerEvent 注册，onClose 时 Obsidian 自动解绑。
     */
    if (this.app && this.app.workspace && typeof this.app.workspace.on === 'function') {
      this.registerEvent(this.app.workspace.on('file-open', () => this.syncActiveFile()));
    }
    /*
     * 窄侧栏时标题要能上下排（月份在上、年份在下）。
     * Obsidian 侧栏宽度与窗口宽度无关，媒体查询测不到，
     * 所以用 ResizeObserver 直接量自身宽度。
     */
    if (typeof ResizeObserver === 'function' && this.contentEl) {
      this.resizeObserver = new ResizeObserver(() => this.applyNarrowClass());
      this.resizeObserver.observe(this.contentEl);
    }
  }

  async onClose() {
    // 关视图时必须断开观察器，否则叶子销毁后仍会回调 → 报错
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /** 宽度不足时给容器加类，CSS 据此把标题改成上下排 */
  applyNarrowClass() {
    const el = this.contentEl;
    if (!el) return;
    const w = el.clientWidth || 0;
    if (w > 0 && w < 240) el.addClass('is-narrow');
    else el.removeClass('is-narrow');
  }

  /** 周起始日偏移：0=周日 … 6=周六 */
  get firstDow() {
    const v = this.plugin.settings.calendar.weekStart;
    if (v && v !== 'locale') {
      const hit = WEEK_START_OPTIONS.find((o) => o.value === v);
      if (hit && hit.dow !== null) return hit.dow;
    }
    return resolveLocaleDow();
  }

  /**
   * 把全填充高亮同步到「当前打开的笔记」对应的日期。
   *
   * 从文件名里解析日期（日记 / 周记 / 月记 / 年记都认）；
   * 解析不出就保持不动 —— 不猜、也不清空。
   * 解析出的日期若不在当前显示月，顺带切月，否则高亮落在视野外看不见。
   *
   * @returns {boolean} 是否发生了重绘
   */
  syncActiveFile() {
    let f = null;
    try {
      f = this.app && this.app.workspace ? this.app.workspace.getActiveFile() : null;
    } catch (e) { f = null; }
    if (!f) return false;
    const notesCfg = (this.plugin && this.plugin.settings && this.plugin.settings.notes) || null;
    const ref = parseNoteRef(f.basename || f.name || '', this.firstDow, notesCfg, this.plugin && this.plugin.settings);
    if (!ref) {
      /*
       * 打开的不是日历类笔记（日记 / 周记 / 月记 / 年记之外）：必须清掉高亮。
       * 旧实现这里直接 return，picked 原样留着 —— 切到别的笔记后日历上
       * 还亮着上一次那格，看着像卡住了。
       */
      if (this.picked) {
        this.picked = null;
        this.selKind = null;
        this.render();
        return true;
      }
      return false;
    }
    const d = ref.date;

      /*
       * 切月策略 —— 这是「高亮乱蹦」的主因。旧实现一律切到解析出的日期所在月，
       * 于是周记跳到周首日月、年记跳到 1 月。现在按类型分：
       *   week —— 一周跨月常见，与当前月有交集就留在当前月，高亮画整行；
       *   year —— 不切月，只高亮年份标题；month / day —— 按日期所在月切。
       */
    let offMonth;
    if (ref.kind === 'year') {
      offMonth = false;
    } else if (ref.kind === 'week') {
      offMonth = !weekTouchesMonth(d, this.year, this.month);
    } else {
      offMonth = d.getFullYear() !== this.year || d.getMonth() !== this.month;
    }

    const unchanged = this.picked && this.selKind === ref.kind && sameDay(this.picked, d);
    this.picked = d;
    this.selKind = ref.kind;
    // 同一天、同类、且没跨月就不重绘：file-open 触发很频繁，省掉无谓的整表重建
    if (unchanged && !offMonth) return false;
    if (offMonth) {
      this.year = d.getFullYear();
      this.month = d.getMonth();
    }
    this.render();
    return true;
  }

  /**
   * 从 picked（周首日）起算的一周，是否与当前显示月有交集。
   * 用于判断打开周记时是否需要切月 —— 有交集就留在当前月。
   * @param {Date} start 周首日
   * @param {number} y 视图当前年
   * @param {number} m 视图当前月（0 起）
   */

  render() {
    /*
     * 让上一轮未完成的异步补读作废。
     *
     * 翻月很快时，旧月份那批读仍在飞；等它读完回来 render()，
     * 会把界面重绘成**旧月份**的内容（用的是新的 this.year/month 吗？
     * 不 —— render 读的是当前 year/month，但旧批次写入的缓存属于旧月，
     * 更糟的是两次 render 交叠会让圆点数反复跳动）。
     * 每次 render 递增 token，异步回调里比对即可安全放弃过期批次。
     */
    this.renderToken = (this.renderToken || 0) + 1;

    const c = this.contentEl;
    c.empty();
    c.addClass('tt-cal-view');
    /*
     * 两种排布：
     *   自适应（默认）：6 行均分可用高度，面板拉高填满
     *   固定尺寸：格子高度固定，排布紧凑 —— 为后续月历视图保留
     */
    if (this.plugin.settings.calendar.fixedCellSize === true) {
      c.addClass('is-fixed');
    } else {
      c.addClass('is-fluid');
    }

    const notes = require('./note.js');

    /* ---- 顶部：‹ 标题 今天 › + 关闭 ---- */
    const head = c.createDiv({ cls: 'tt-cal-head' });
    const prev = head.createEl('button', { cls: 'tt-cal-nav', text: '‹' });
    const titleWrap = head.createDiv({ cls: 'tt-cal-title-wrap' });

    /*
     * 顺序：月份在前，年份在后（图1/图2 的样式）。
     * 之前是年份在前，与用户期望相反。
     */
    const mBtn = titleWrap.createEl('span', {
      cls: 'tt-cal-month tt-cal-clickable',
      /*
       * 月份名查表，不用占位符：英文月份是独立单词（September），
       * 不是「数字 + 月」能拼出来的 —— 早先共用一个 key + {0}，
       * 英文下只剩数字 "9"，月份名整个丢了。
       */
      text: MONTH_NAMES[calLang(((this.plugin && this.plugin.settings
        && this.plugin.settings.calendar) || {}).lang)][this.month],
      title: '点击生成/打开月记',
    });
    mBtn.onclick = () => {
      this.picked = new Date(this.year, this.month, 1);
      this.selKind = 'month';
      this.render();
      this.spawn('monthly');
    };

    const yBtn = titleWrap.createEl('span', {
      cls: 'tt-cal-year tt-cal-clickable',
      text: String(this.year),
      title: i18nT('k98723583', '点击生成/打开年记'),
    });
    yBtn.onclick = () => {
      this.picked = new Date(this.year, 0, 1);
      this.selKind = 'year';
      this.render();
      this.spawn('yearly');
    };
    // 月记 / 年记打开时高亮对应标题；全填充只留给日期格和周数格
    if (this.selKind === 'month' && this.picked
      && this.picked.getFullYear() === this.year && this.picked.getMonth() === this.month) {
      mBtn.addClass('is-picked');
    }
    if (this.selKind === 'year' && this.picked && this.picked.getFullYear() === this.year) {
      yBtn.addClass('is-picked');
    }

    const next = head.createEl('button', { cls: 'tt-cal-nav', text: '›' });
    prev.onclick = () => this.shift(-1);
    next.onclick = () => this.shift(1);

    // 导航保持 ‹ 今天 › 原样
    const todayBtn = head.createEl('button', { cls: 'tt-cal-today', text: i18nT('ka848765c', '今天') });
    todayBtn.onclick = () => {
      const n = new Date();
      this.year = n.getFullYear();
      this.month = n.getMonth();
      this.picked = n;
      this.selKind = 'day';
      this.render();
    };

    /* ---- 表头：周数列 + 星期名 ---- */
    const grid = c.createDiv({ cls: 'tt-cal-grid' });
    /*
     * 表头沿用原先的简写设计（周 / 日 一 二 … 六）。
     * 曾改成「周日/周一」全称想对齐 Calendar，但用户更喜欢原先的，已回退。
     */
    const wdNames = WEEKDAY_NAMES[calLang(((this.plugin && this.plugin.settings
      && this.plugin.settings.calendar) || {}).lang)];
    grid.createDiv({ cls: 'tt-cal-cell tt-cal-wk-head', text: i18nT('ked517b57', '周') });
    for (let i = 0; i < 7; i++) {
      grid.createDiv({ cls: 'tt-cal-cell tt-cal-wd-head', text: wdNames[(this.firstDow + i) % 7] });
    }

    /* ---- 日期格：含上下月的灰字，凑足整行 ---- */
    const first = new Date(this.year, this.month, 1);
    const startOffset = (first.getDay() - this.firstDow + 7) % 7;
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const prevDays = new Date(this.year, this.month, 0).getDate();
    const today = new Date();
    /*
     * 固定 6 行 × 7 列。
     * 之前按当月天数算行数（Math.ceil），有的月 5 行有的 6 行，
     * 切月时高度会跳，看起来不稳。现在恒定 6 行，不足的用上下月灰字填满。
     */
    const total = GRID_ROWS * 7;

    for (let i = 0; i < total; i++) {
      /*
       * 周数格：按格位直接算日期，而不是「属于本月才显示」。
       *
       * 旧写法用「该格是否属于本月」当判据，9月1日是周二而首列是周日时，
       * 首行前两格是上月尾 → 判据不成立 → 周数格留空。
       * 周数表示的是「这一整行所属的周」，与这些日期属不属于当月无关。
       */
      if (i % 7 === 0) {
        const wkCell = grid.createDiv({ cls: 'tt-cal-cell tt-cal-wk tt-cal-clickable' });
        const d = new Date(this.year, this.month, 1 - startOffset + i);
        wkCell.setText(String(weekNumberOf(d, this.firstDow)));
        wkCell.title = i18nT('kf40f709b', '点击生成/打开周记');
        wkCell.onclick = () => {
          this.picked = d;
          this.selKind = 'week';
          this.render();
          this.spawn('weekly');
        };
        /*
         * 打开周记时高亮周数格 —— 旧实现只给日期格加 is-picked，
         * 周数列永远不亮，于是「点了周记却看不出是哪一行」。
         */
        if (this.selKind === 'week' && this.picked && weekContains(this.picked, d)) {
          wkCell.addClass('is-picked');
        }

        /*
         * 周数列也画圆点：读的是「周记本身」的字数，不是 7 天日记之和。
         *
         * 曾用过「该周 7 天日记求和」，但分子是 7 天总量、分母却是单天标准
         * （每点 250 字），数值天然放大约 7 倍 —— 只要那周写过几天日记，
         * 周列就恒顶到 10 点上限，完全失去区分度。
         * 改成读周记本身，与「周记写了多少」的语义一致。
         */
        if (this.plugin.settings.calendar.dotsEnabled !== false
          && this.plugin.settings.calendar.lunarOnCalendar !== true) {
          const wf = this.weeklyFileOf(d);
          const weekWords = wf ? notes.cachedWordCount(wf) : 0;
          this.drawDots(wkCell, this.dotPattern(weekWords, !!wf));
          if (wf && !notes.hasWordCount(wf) && !this.pendingRead) this.readWordsAsync();
        }
      }

      const dayNo = i - startOffset + 1;
      let d;
      let outSide = false;
      if (dayNo < 1) {
        // 上月尾
        d = new Date(this.year, this.month - 1, prevDays + dayNo);
        outSide = true;
      } else if (dayNo > daysInMonth) {
        // 下月头
        d = new Date(this.year, this.month + 1, dayNo - daysInMonth);
        outSide = true;
      } else {
        d = new Date(this.year, this.month, dayNo);
      }

      const cell = grid.createDiv({ cls: 'tt-cal-cell tt-cal-day' });
      cell.setText(String(d.getDate()));
      if (outSide) cell.addClass('is-outside');
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate()) cell.addClass('is-today');
      /*
       * 全填充只给「打开的日记」那一天。
       * 打开周记时整行改用 is-week-row 弱高亮：若周记也让某个日期格全填充，
       * 会和「日记」的语义撞车，看起来就像高亮在乱蹦。
       */
      if (this.selKind === 'day' && this.picked && sameDay(this.picked, d)) {
        cell.addClass('is-picked');
      } else if (this.selKind === 'week' && this.picked && weekContains(this.picked, d)) {
        cell.addClass('is-week-row');
      }
      /*
       * 圆点数量 = 当天日记字数 / 每点代表字数（对齐 Calendar 的 Words per dot）。
       * 只有「存在日记」和「字数>0」两种情况下才画：
       *   有笔记但字数为 0 → 至少画 1 点，否则用户看不出这天有笔记。
       */
      const file = notes.getDailyFile(this.app, this.plugin.settings, d);
      /*
       * 农历模式取代圆点（互斥，不是叠加）：
       * 格子下方就那么大，农历文字 + 多个圆点会挤成一团。
       * 且农历模式不需要读字数 —— 省掉整轮异步 IO，翻月更快。
       */
      if (this.plugin.settings.calendar.lunarOnCalendar === true) {
        this.drawLunar(cell, d, !!file);
      } else if (file) {
        cell.addClass('has-note');
        // 圆点开关关闭时不做任何字数读取，省掉一整轮异步 IO
        if (this.plugin.settings.calendar.dotsEnabled !== false) {
          const cnt = notes.cachedWordCount(file);
          if (cnt > 0) cell.addClass('has-words');
          // 实心 = 已写满的整点，空心 = 正在写的那一点
          this.drawDots(cell, this.dotPattern(cnt, true));
          // 未缓存的异步补读，读到后重绘（首帧先占位）
          if (!notes.hasWordCount(file) && !this.pendingRead) this.readWordsAsync();
        }
      }
      cell.onclick = () => {
        this.picked = d;
        this.selKind = 'day';
        // 点非本月的灰字时顺带切过去，避免点了没反应
        if (outSide) { this.year = d.getFullYear(); this.month = d.getMonth(); }
        this.render();
        this.spawn('daily');
      };
    }

    this.applyNarrowClass();
  }

  /**
   * 圆点构成：实心 = 已写满的整点，空心 = 正在写的那一点。
   *
   * 例（每点 250）：
   *   500 → 2 实心 0 空心（●●）
   *   600 → 2 实心 1 空心（●●○）
   *   750 → 3 实心 0 空心（●●●）
   *
   * 每点代表字数 <=0 或未配置时退化为「有笔记 = 1 个实心」，
   * 保持旧行为，不因为新功能没配就让界面看不出哪些天有笔记。
   *
   * @returns {{solid:number, hollow:number}}
   */
  dotPattern(words, exists) {
    const per = Number(this.plugin.settings.calendar.wordsPerDot);
    if (!per || per <= 0) return exists ? { solid: 1, hollow: 0 } : { solid: 0, hollow: 0 };
    if (!exists) return { solid: 0, hollow: 0 };
    const w = Number(words) || 0;
    let solid = Math.floor(w / per);
    let hollow = (w % per) > 0 ? 1 : 0;
    /*
     * 有笔记但一个整点都没写满（含 0 字）→ 至少给 1 个空心。
     * 否则「建了日记还没写」的日子完全没标记，看不出这一天有笔记。
     */
    if (solid === 0 && hollow === 0) hollow = 1;
    // 上限 10（横排 5 个一行，两行），既看得出差异也不撑爆格子
    const cap = (n, m) => Math.min(Math.max(n, 0), m);
    const total = cap(solid + hollow, DOTS_MAX);
    const s2 = cap(solid, total);
    return { solid: s2, hollow: Math.min(total - s2, hollow) };
  }

  /**
   * 画农历（取代圆点）。
   *
   * 初一显示**月名**而不是「初一」—— 月名能一眼看出「这个月从这天开始」，
   * 而「初一」每个月都一样，信息量更小。
   * 其余显示农历日（十九、廿三…）。
   *
   * 有笔记时给农历文字加 has-note（渲染成旁边一个小点），
   * 取代原来按字数画多个圆点的做法：农历模式要的就是「哪天有笔记」，
   * 不是「写了多少字」。
   *
   * 农历转换失败（超出表范围）时什么都不画，不留半截空元素。
   */
  drawLunar(cell, d, hasNote) {
    const ts = require('./timestamp.js');
    const info = ts.lunar.solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (!info) return;
    const text = info.day === 1
      ? ts.lunar.cnMonth(info.month, info.isLeap)
      : ts.lunar.cnDay(info.day);
    const wrap = cell.createDiv({ cls: 'tt-cal-lunar' });
    wrap.setText(text);
    wrap.title = ts.lunar.formatLunar(info);
    if (hasNote) wrap.addClass('has-note');
  }

  /** 画圆点：先实心后空心 */
  drawDots(host, pattern) {
    const wrap = host.createDiv({ cls: 'tt-cal-dots' });
    for (let k = 0; k < pattern.solid; k++) {
      wrap.createDiv({ cls: 'tt-cal-dot is-solid' });
    }
    for (let k = 0; k < pattern.hollow; k++) {
      wrap.createDiv({ cls: 'tt-cal-dot is-hollow' });
    }
  }

  /**
   * 该行对应那一周的「周记文件」（不存在返回 null）
   *
   * 用行内任意一天去定位都行 —— 同一行的 ISO 周数相同。
   */
  weeklyFileOf(d) {
    const notes = require('./note.js');
    return notes.getNoteFile(this.app, this.plugin.settings, 'weekly', d);
  }

  /** 异步补读本月各天字数，读完重绘一次（只读当前月的 42 格） */
  async readWordsAsync() {
    if (this.pendingRead) return;
    this.pendingRead = true;
    const notes = require('./note.js');
    try {
      const days = [];
      const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(this.year, this.month, i));
      const files = days
        .map((d) => notes.getDailyFile(this.app, this.plugin.settings, d))
        .filter(Boolean);
      /*
       * 周记也要补读：周列的圆点读的是周记本身。
       * 取本月 6 行各自的第一天，即可覆盖本月涉及的所有周。
       */
      const startOffset = startOffsetOf(this.year, this.month, this.firstDow);
      for (let r = 0; r < GRID_ROWS; r++) {
        const d = new Date(this.year, this.month, 1 - startOffset + r * 7);
        const wf = notes.getNoteFile(this.app, this.plugin.settings, 'weekly', d);
        if (wf) files.push(wf);
      }
      // 只补读尚未缓存的
      // 用「是否统计过」而非「字数是否为 0」，否则空笔记会被无限补读
      const todo = files.filter((f) => !notes.hasWordCount(f));
      if (todo.length === 0) return;

        /*
         * 并发读但分批：串行 await 一个月 30 篇就是 30 次来回，翻月肉眼可见地卡；
         * 无脑 Promise.all 又会一次开几百个句柄打满 IO。分批是折中。
         */
      const token = ++this.renderToken;
      const BATCH = 8;
      for (let i = 0; i < todo.length; i += BATCH) {
        // 翻月后置 token 作废：旧月份的读不该再触发重绘覆盖新月份
        if (token !== this.renderToken) return;
        const slice = todo.slice(i, i + BATCH);
        const results = await Promise.all(
          slice.map((f) =>
            this.app.vault.cachedRead(f).then(
              (txt) => [f, notes.countWords(txt)],
              () => [f, null] // 单篇失败不影响其他
            )
          )
        );
        results.forEach(([f, n]) => { if (n !== null) notes.setWordCount(f, n); });
      }
      if (token !== this.renderToken) return;
      this.render();
    } catch (e) {
      console.warn('[Time Tools] 字数统计失败', e);
    } finally {
      this.pendingRead = false;
    }
  }

  shift(delta) {
    this.month += delta;
    if (this.month < 0) { this.month = 11; this.year--; }
    if (this.month > 11) { this.month = 0; this.year++; }
    // 翻月不清空 picked：跟随打开的笔记，翻回来还能看见高亮
    this.render();
  }

  /** 生成笔记；picked 用于日/周，年/月取当前视图年月 */
  async spawn(kind) {
    const notes = require('./note.js');
    let d;
    if (this.picked && (kind === 'daily' || kind === 'weekly')) {
      d = this.picked;
    } else if (kind === 'yearly') {
      d = new Date(this.year, 0, 1);
    } else if (kind === 'monthly') {
      d = new Date(this.year, this.month, 1);
    } else {
      d = new Date(this.year, this.month, 1);
    }
    // 不清空 picked：生成完仍高亮这天，与随后 file-open 同步的结果一致
    const r = await notes.openOrCreateNote(this.plugin, kind, d);
    new obsidian.Notice(r.msg);
    if (!r.ok) console.warn('[Time Tools] 笔记生成失败：' + r.msg);
    this.render();
  }
}

/**
 * 当月 1 号落在第几列（0 起），用于按格位反推日期。
 *
 * 必须用视图的 firstDow（用户设置的周起始），不能用 locale 的 ——
 * 网格排布用的是 firstDow，两者不一致会让反推出的日期错位一整周。
 */
/**
 * 数值型设置变更后刷新已打开的日历视图。
 *
 * 只重画视图、不重建设置页 —— 设置页一旦重建，正在编辑的输入框就会失焦，
 * 表现就是「每敲一个字符就失焦，必须先删一个才能再填一个」。
 */
function refreshCalendarViews(plugin) {
  try {
    /*
     * 只淘汰失效条目，不再全清。
     * 缓存 key 是「路径@mtime」，mtime 一变旧条目自然命中不到 —— 全清会把
     * 仍然有效的四十几个格子的统计一起丢掉，翻一次页就要重新读盘。
     */
    const nm = require('./note.js');
    if (typeof nm.pruneWordCache === 'function') nm.pruneWordCache(plugin.app);
    else nm.clearWordCache();
  } catch (e) { /* 清缓存失败不影响刷新 */ }
  try {
    const leaves = plugin.app.workspace.getLeavesOfType(CAL_VIEW_TYPE) || [];
    for (const leaf of leaves) {
      if (leaf.view && typeof leaf.view.render === 'function') leaf.view.render();
    }
  } catch (e) { /* 视图未打开时静默 */ }
}

function startOffsetOf(year, month, firstDow) {
  const first = new Date(year, month, 1);
  const dow = Number.isInteger(firstDow) ? firstDow : resolveLocaleDow();
  return (first.getDay() - dow + 7) % 7;
}

/** 判断两个 Date 是否为同一天 */
/* sameDay 已迁到 timejudge.js */

/**
 * d 是否落在以 weekStart 为首日的那一周（7 天）内。
 * 先把两端归一到当天午夜再比，避免时刻差异导致的边界误判。
 */
function weekContains(weekStart, d) {
  if (!weekStart || !d) return false;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const diff = Math.round((a - b) / 86400000);
  return diff >= 0 && diff <= 6;
}

/**
 * 从笔记文件名里解析出日期，用于把高亮同步到当前打开的笔记。
 *
 * 四种笔记都认：
 *   日记 2026-09-22-周二 / 2026-09-22  → 当天
 *   周记 2026-W38                      → 该周首日（ISO，与 gggg-[W]ww 一致）
 *   月记 2026-09月记                   → 该月 1 日
 *   年记 2026年记                      → 该年 1 月 1 日
 *
 * 分隔符用 \D{0,2} 放宽，这样「-周二」这类后缀也能吃下。
 * 解析不出返回 null —— 调用方据此清空高亮，绝不猜一个日期。
 *
 * @param {string} name 文件名（不含扩展名）
 * @param {number} [dow] 周起始日，用于反推周记的周首日；省略时按 ISO（周一）
 */
function escapeForRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 把 moment 格式串转成匹配文件名的正则。
 *
 * token 换成捕获组，字面量原样转义；末尾允许一段「分隔符开头的后缀」，
 * 这样「2026-09-22-周二」这类带星期后缀的老日记也能认。
 *
 * @param {string} fmt 如 'YYYY-MM-DD' / 'gggg-[W]ww' / 'YYYY年记'
 * @returns {RegExp|null} 构造失败返回 null
 */
/**
 * 格式串里是否含字面量（分隔符或文字）。
 *
 * 用来决定能否放宽匹配：纯 token 的格式（如年记 YYYY）若允许后缀，
 * 「2026 年度总结」这类普通笔记也会被认成年记 —— 这正是早期高亮乱跳的根因。
 * 含字面量的格式（YYYY年记、gggg-[W]ww）本身已有强特征，放宽无害。
 */
function formatHasLiteral(rawFmt) {
  const fmt = String(rawFmt || '').split('/').pop();
  const toks = ['gggg', 'YYYY', 'MMMM', 'dddd', 'MMM', 'ddd', 'gg', 'YY', 'Do',
    'MM', 'DD', 'dd', 'ww', 'WW', 'M', 'D', 'w', 'W'];
  for (let i = 0; i < fmt.length;) {
    if (fmt[i] === '[') {
      const end = fmt.indexOf(']', i);
      if (end < 0) return true;
      i = end + 1;
      continue;
    }
    let hit = 0;
    for (let k = 0; k < toks.length; k++) {
      if (fmt.startsWith(toks[k], i)) { hit = toks[k].length; break; }
    }
    if (hit) { i += hit; continue; }
    return true;
  }
  return false;
}

  /*
   * 格式串 → 正则的缓存。全库扫描会对每个文件调 parseNoteRef，
   * 每次都要为 4 类笔记 × 每种格式编译正则（实测 5000 文件 27ms，主要在编译）。
   * 格式串来自设置、很少变，命中率极高。上限 200，超了清空（只影响速度不影响正确性）。
   */
const FORMAT_RX_CACHE = new Map();
const FORMAT_RX_MAX = 200;

function formatToRegex(rawFmt, allowSuffix) {
  if (!rawFmt) return null;
  const cacheKey = String(rawFmt) + '\u0000' + (allowSuffix ? '1' : '0');
  const cached = FORMAT_RX_CACHE.get(cacheKey);
  // 编译失败也会存 null，所以判 undefined 而不是判空
  if (cached !== undefined) return cached;
  const built = buildFormatRegex(rawFmt, allowSuffix);
  if (FORMAT_RX_CACHE.size >= FORMAT_RX_MAX) FORMAT_RX_CACHE.clear();
  FORMAT_RX_CACHE.set(cacheKey, built);
  return built;
}

function buildFormatRegex(rawFmt, allowSuffix) {
  if (!rawFmt) return null;
  /*
   * 先剥掉文件夹部分。
   * Calendar 的周记格式就写成 gggg/gggg-[W]WW（文件夹+文件名一体），
   * 用户照抄过来时，带 / 的串去匹配 basename 永远不成立。
   */
  const fmt = String(rawFmt).split('/').pop();
  if (!fmt) return null;

  /*
   * 按长度降序匹配，保证 MMMM 不会先被 MM 吃掉。
   * 只收能反推日期的 token；时分秒这类不参与定位，按字面量放行。
   */
  /*
   * 第三项是 token 语义：y=年 / M=月 / D=日 / w=周，null=不产生捕获组。
   * 顺序按「格式串里出现的先后」记录，供 refFromMatch 按名取值 ——
   * 否则 MM-DD-YYYY 会被当成「9 年 14 月」判空（v2.73 修）。
   */
  const TOKENS = [
    ['gggg', '(\\d{4})', 'y'], ['YYYY', '(\\d{4})', 'y'],
    ['MMMM', '(?:\\S+)', null], ['dddd', '(?:周[一二三四五六日]|\\S+)', null],
    ['MMM', '(?:\\S+)', null], ['ddd', '(?:周[一二三四五六日]|\\S+)', null],
    ['gg', '(\\d{2})', 'y'], ['YY', '(\\d{2})', 'y'],
    ['Do', '(\\d{1,2})(?:st|nd|rd|th)?', 'D'],
    ['MM', '(\\d{1,2})', 'M'], ['DD', '(\\d{1,2})', 'D'], ['dd', '(\\d{1,2})', 'D'],
    ['ww', '(\\d{1,2})', 'w'], ['WW', 'W?(\\d{1,2})', 'w'],
    ['M', '(\\d{1,2})', 'M'], ['D', '(\\d{1,2})', 'D'], ['w', '(\\d{1,2})', 'w'], ['W', 'W?', null],
  ];
  let re = '';
  /** 与捕获组一一对应的 token 语义序列 */
  const order = [];
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === '[') {
      const end = fmt.indexOf(']', i);
      if (end < 0) { re += escapeForRegex(fmt.slice(i)); break; }
      re += escapeForRegex(fmt.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    let hit = null;
    for (let k = 0; k < TOKENS.length; k++) {
      if (fmt.startsWith(TOKENS[k][0], i)) { hit = TOKENS[k]; break; }
    }
    if (hit) {
      re += hit[1];
      if (hit[2]) order.push(hit[2]);
      i += hit[0].length;
    } else {
      re += escapeForRegex(fmt[i]);
      i++;
    }
  }
  /*
   * 末位允许一段「分隔符开头的后缀」，这样 2026-09-22-周二 这类
   * 带星期后缀的历史日记也能认；同时不允许再紧跟数字，
   * 避免 2026-09 去吃掉 2026-09-22 的前半段。
   * 后缀只允许「分隔符开头」：早期还放行中文，结果 YYYY年 这类格式
   * 会把「2026年度总结」也认成年记 —— 高亮乱跳就是从这儿来的。
   * 宁可认不出，不可认错。
   */
  const tail = allowSuffix ? '([-_\\s].*)?' : '';
  try {
    const rx = new RegExp('^' + re + tail + '$');
    /*
     * 把「第几个捕获组是年/月/日」挂在正则上带出去。
     * 捕获组顺序取决于用户格式串里 token 的先后，调用方不能写死按位置取。
     */
    rx.__order = order;
    return rx;
  } catch (e) { return null; }
}

/**
 * 从笔记文件名里解析出日期，用于把高亮同步到当前打开的笔记。
 *
 * 先按 settings 里配置的各笔记文件名格式精确匹配；匹配不上才回退到
 * 「年-月-日」「年-W周」这两种强特征。
 *
 * 旧实现靠「名字里含月/年字」认月记 / 年记，于是「2026 年度总结」
 * 这类普通笔记也被解析成 1 月 1 日 —— 切过去高亮就乱跳。
 * 格式串是用户自己定的，用它反推才不会误伤。
 *
 * @param {string} name 文件名（不含扩展名）
 * @param {number} [dow] 周起始日，用于反推周记的周首日
 * @param {object} [notes] settings.notes，提供各笔记的文件名格式
 * @returns {{kind: string, date: Date}|null} 认不出返回 null —— 调用方据此清空高亮，绝不猜
 */
/**
 * 把正则捕获组解释成 {kind, date}。
 *
 * gg / YY 这类两位年份按 2000+yy（>69 记 1900+yy）归一，
 * 与 moment 的行为一致；组数对不上或越界一律返回 null，绝不猜。
 *
 * @returns {{kind: string, date: Date}|null}
 */
function refFromMatch(kind, m, dow, tail, order) {
  /*
   * 守卫：粗粒度格式（周/月/年）若吃下一个「分隔符+数字」的后缀，
   * 说明它其实是个更细的日期被截断了。
   * 例：日记 2026-09-22 会被周记异名 gggg-Www 匹配成「2026 年第 9 周」。
   * 宁可判不出来，也不能把日记当成周记高亮。
   */
  if (kind !== 'daily' && tail && /^[-_\s]\d/.test(tail)) return null;
  const g = m.slice(1).map((x) => parseInt(x, 10));
  const norm = (y) => (y < 100 ? (y <= 69 ? 2000 + y : 1900 + y) : y);
  const ok = (y) => y >= 1970 && y <= 2200;

  /*
   * 按 token 语义取值，而不是按捕获组的下标。
   * 捕获组顺序 = 格式串里 token 的先后顺序，由 formatToRegex 通过 order 带出。
   * 写死「第 1 组是年、第 2 组是月」时，MM-DD-YYYY 会被读成 9 年 14 月而判空，
   * 于是月日在前的格式（欧美习惯）整类失效。
   */
  let y, mo, da, w;
  if (order && order.length) {
    const pick = (k) => {
      for (let i = 0; i < order.length; i++) {
        if (order[i] === k && g[i] != null && !isNaN(g[i])) return g[i];
      }
      return NaN;
    };
    y = pick('y');
    mo = pick('M');
    da = pick('D');
    w = pick('w');
  } else {
    // 没有 order 时退回旧的顺序约定（年、月/周、日）
    y = g[0]; mo = g[1]; da = g[2]; w = g[1];
  }

  if (kind === 'weekly') {
    if (ok(norm(y)) && w >= 1 && w <= 53) {
      const d = weekStartOf(norm(y), w, dow);
      if (d && isFinite(d.getTime())) return { kind: 'week', date: d };
    }
    return null;
  }
  if (kind === 'daily') {
    const yy = norm(y);
    if (!ok(yy) || !(mo >= 1 && mo <= 12) || !(da >= 1 && da <= 31)) return null;
    const d = new Date(yy, mo - 1, da);
    // 排除 2026-02-30 这类会被 Date 静默进位的无效日期
    if (!isFinite(d.getTime()) || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return { kind: 'day', date: d };
  }
  if (kind === 'monthly') {
    if (!ok(norm(y)) || !(mo >= 1 && mo <= 12)) return null;
    return { kind: 'month', date: new Date(norm(y), mo - 1, 1) };
  }
  return ok(norm(y)) ? { kind: 'year', date: new Date(norm(y), 0, 1) } : null;
}

function parseNoteRef(name, dow, notes, settings) {
  if (!name) return null;
  let s = String(name);
  /*
   * 用户自定义规则（可选，默认关）。放在所有格式匹配之前统一套一层，
   * 而不是在 4 个调用点各写一遍 —— 分散写必漏。
   */
  if (settings) {
    const ts = require('./timestamp.js');
    const applied = ts.applyUserRulesToName(s, settings);
    if (applied.hide) return null;
    s = applied.name;
    if (!s) return null;
  }
  const cfg = notes || {};

  /*
   * 遍历「配置格式 → 用户额外格式 → 内置常见格式」整份清单。
   * 原来只认 cfg.format 一条，换个命名风格高亮就失效；
   * 这里与「打开已有笔记」共用同一份清单（note.js 的 highlightFormats），
   * 两条路径不再各算各的。
   *
   * 顺序：日记 → 月记 → 周记 → 年记，细粒度先行。
   * 反过来（周记优先）时，周记异名 gggg-Www 会把月记 2026-09
   * 当成「2026 年第 9 周」，也会把日记 2026-09-22 截断成第 9 周。
   */
  const kinds = ['daily', 'monthly', 'weekly', 'yearly'];
  // note.js 里 highlightFormats 收的是完整 settings，这里补一层 .notes
  const noteMod = require('./note.js');
  const listOf = (kind) => noteMod.highlightFormats({ notes: cfg }, kind);
  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i];
    const list = listOf(kind);
    for (let f = 0; f < list.length; f++) {
      const re = formatToRegex(list[f], formatHasLiteral(list[f]));
      if (!re) continue;
      const m = s.match(re);
      if (!m) continue;
      const hit = refFromMatch(kind, m, dow, m[m.length - 1], re.__order);
      if (hit) return hit;
    }
  }

  // 回退一：周记 2026-W38
  let m = s.match(/(\d{4})\D{0,2}[Ww](\d{1,2})(?!\d)/);
  if (m) {
    const y = parseInt(m[1], 10);
    const w = parseInt(m[2], 10);
    if (y >= 1970 && y <= 2200 && w >= 1 && w <= 53) {
      const d = weekStartOf(y, w, dow);
      if (d && isFinite(d.getTime())) return { kind: 'week', date: d };
    }
  }

  // 回退二：日记 2026-09-22-周二（锚定开头，且末尾不能再跟数字）
  m = s.match(/^(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})(?!\d)/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const da = parseInt(m[3], 10);
    if (y >= 1970 && y <= 2200 && mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      const d = new Date(y, mo - 1, da);
      if (isFinite(d.getTime()) && d.getMonth() === mo - 1 && d.getDate() === da) {
        return { kind: 'day', date: d };
      }
    }
  }

  // 月记 / 年记不再靠「含月/年字」猜 —— 那正是误匹配的来源
  return null;
}

/**
 * parseNoteRef 的日期版，供只需要日期的调用方使用。
 * @returns {Date|null}
 */
function parseDateFromName(name, dow, notes, settings) {
  const ref = parseNoteRef(name, dow, notes, settings);
  return ref ? ref.date : null;
}

/**
 * 周数：跟随网格的 firstDow，用与 moment locale week 相同的 dow/doy 规则。
 *
 * 旧实现恒用 ISO（周一为界），但网格排布用的是 firstDow —— 两套周界不一致。
 * 当 firstDow=0（周日起始）时行首是周日，而 ISO 以周一为界，
 * 周日那格会被归到上一周，整列比 Calendar 少 1；跨年时差距更大
 * （如 2026-01-01 是周四、周日起始的首行是 2025-12-28，
 *   ISO 给 52，Calendar 给 1）。
 * Calendar 侧：其 UI 库 obsidian-calendar-ui 直接同步 locale 的周起始，
 * 周号随「Start week on」变化 —— 即 moment 的 locale week（date.week()）。
 * 官方 README 另有一处写作 "ISO week numbers"，两者并不矛盾：
 * 当周起始为周一时 locale week 与 ISO 完全相同（中文区域默认就是周一），
 * 只有周日起始才会分叉。这里用 moment 同款 dow/doy 规则，
 * 因此无论用户选周几起始，都能与 Calendar 对齐。
 */
/* weekDoyOf / firstWeekOffset / weeksInYear / dayOfYearOf / weekNumberOf
 * 已迁到 timejudge.js，本文件顶部解构引入，此处不再重复定义。 */

/**
 * 第 w 周的周首日，周起始由 dow 决定。
 *
 * 用 weekNumberOf 自洽反查，保证与日历格子里显示的数字同源：
 * 先取 1 月 1 日所在周的周首日，读出它的周号 w0，再平移 (w - w0) 周。
 * 这样无论周起始是周日还是周一，结果与显示都不会错开。
 */
function weekStartOf(y, w, dow) {
  /*
   * 曾用 (dow===0||dow===1) ? dow : 1 —— 周起始设成周二及以后时退化成周一，
   * 与 weekNumberOf（它按传入的 dow 算）不同源，反推出的周首日会偏。
   * 这里直接用 dow，只做合法性兜底。
   */
  const fd = Number.isInteger(dow) && dow >= 0 && dow <= 6 ? dow : 1;
  const jan1 = new Date(y, 0, 1);
  const back = (jan1.getDay() - fd + 7) % 7;
  const base = new Date(y, 0, 1 - back);
  const w0 = weekNumberOf(base, fd);
  const d = new Date(y, 0, 1 - back + (w - w0) * 7);
  return isFinite(d.getTime()) ? d : null;
}

/**
 * 从 start 起算的 7 天里，是否至少有一天落在指定年月。
 *
 * 用来决定「打开周记时要不要切月」：一周跨月很常见（如 9/28 那周含 10/1），
 * 只要这周与当前显示月有交集就留在当前月，高亮画在那一整行上，
 * 而不是按周首日把视图拽到上一个月。
 *
 * @param {Date} start 周首日
 * @param {number} y 年
 * @param {number} m 月（0 起）
 * @returns {boolean}
 */
function weekTouchesMonth(start, y, m) {
  if (!start || !isFinite(start.getTime())) return false;
  for (let k = 0; k < 7; k++) {
    const t = new Date(start.getFullYear(), start.getMonth(), start.getDate() + k);
    if (t.getFullYear() === y && t.getMonth() === m) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Calendar 插件增强
 *
 * 在 Calendar 自己的视图上接管年份 / 月份 / 周数点击。
 * 依赖其内部 DOM，故默认关，且它一改版就可能失效 —— 全部包在 try 里。
 * ------------------------------------------------------------------ */
function attachCalendarEnhance(plugin) {
  const handler = async (ev) => {
    const s = plugin.settings.calendar;
    /*
     * 门控：两种增强模式任一开启都要放行。
     * nativeDayWeek 是「半接管」—— 日/周放行给原生，月/年由本插件生成；
     * 它不再依赖 enhanceCalendarEnabled（两者已改为互斥，见 setEnhanceMode）。
     */
    if (!s || (s.enhanceCalendarEnabled !== true && s.nativeDayWeek !== true)) return;
    /*
     * 运行时兜底：互斥不能只靠设置页那一次联动。
     * 万一两个标志同时为 true（老配置、手工改 data.json 等），
     * 增强一律让位，避免两套逻辑同时接管 Calendar 的点击。
     */
    if (s.allowBoth !== true && s.ownCalendarEnabled === true) return;
    const t = ev.target;
    if (!t || !t.closest) return;
    // 只在 Calendar 的视图容器内生效
    const box = t.closest('#calendar-container');
    if (!box) return;

    const notes = require('./note.js');
    try {
      /*
       * 关键修正：之前只判 ev.target 自身的 className。
       * Calendar 是 Svelte 渲染的，年月标题里常是嵌套元素，
       * 点到的是没有 class 的内层节点 → 匹配不上 → 点年月没反应。
       * 改成向上找祖先，才抓得住。
       */
      /*
       * 顺序：日期 → 周数 → 年 → 月。
       * 日期/周数是最具体的叶子节点，必须先判：
       * Calendar 是 Svelte 渲染的，标题容器有可能把整个网格包在里面，
       * 若先判 .year/.month，点日期会被当成点标题。
       * 反过来再用 isTitleEl 确认标题元素里没有日期格，双保险。
       */
      /*
       * 分流开关：日 / 周交回 Calendar 原生。
       * 这里直接 return，不 preventDefault 也不 stopPropagation ——
       * 让事件照常往下走，Calendar 自己的处理才能跑起来。
       */
      const nativeDW = s.nativeDayWeek === true;

      const dayEl = t.closest('.day');
      if (dayEl) {
        if (nativeDW) return;
        const d = dateOfCalendarDay(box, dayEl, plugin);
        /*
         * 取不到日期就 return，让事件照常往下走 —— 交回 Calendar 自己处理。
         * 绝不猜一个日期去建笔记：建错比不建糟得多。
         */
        if (!d) return;
        ev.preventDefault();
        ev.stopPropagation();
        const r = await notes.openOrCreateNote(plugin, 'daily', d);
        new obsidian.Notice(r.msg);
        if (!r.ok) console.warn('[Time Tools] 日记生成失败：' + r.msg);
        return;
      }

      const weekEl = t.closest(WEEK_NUM_SELECTOR);
      if (weekEl) {
        if (nativeDW) return;
        /*
         * 曾经这里写死 new Date()（今天）—— 点第 36 周会去建「今天所在那一周」的
         * 周记，等于点哪周都一样。改成按被点的那一周推算。
         */
        const d = dateOfCalendarWeek(box, weekEl, plugin);
        if (!d) return;
        ev.preventDefault();
        ev.stopPropagation();
        const r = await notes.openOrCreateNote(plugin, 'weekly', d);
        new obsidian.Notice(r.msg);
        if (!r.ok) console.warn('[Time Tools] 周记生成失败：' + r.msg);
        return;
      }

      const yearEl = t.closest('.year');
      const monthEl = t.closest('.month');

      if (yearEl && isTitleEl(yearEl)) {
        const y = parseInt((yearEl.textContent || '').match(/\d{4}/)?.[0] || '', 10);
        if (!y) return;
        const r = await notes.openOrCreateNote(plugin, 'yearly', new Date(y, 0, 1));
        new obsidian.Notice(r.msg);
        return;
      }
      if (monthEl && isTitleEl(monthEl)) {
        const m = parseMonthText(monthEl.textContent || '');
        if (!m) return;
        /*
         * 年份必须取 Calendar 当前显示的年份：
         * 用 new Date().getFullYear() 在翻到别的年份时会写错年份。
         */
        const y = findYearIn(box) || new Date().getFullYear();
        const r = await notes.openOrCreateNote(plugin, 'monthly', new Date(y, m - 1, 1));
        new obsidian.Notice(r.msg);
        return;
      }
    } catch (e) {
      console.warn('[Time Tools] Calendar 增强处理失败', e);
    }

    /*
     * 失效自检：Calendar 是第三方插件，它的 DOM（.day / .week-num / .year / .month）
     * 随时可能随版本改版。选择器一旦失效，用户只会感到「点了没反应」，
     * 没有任何提示，只能靠猜。
     *
     * 判定：点在 calendar-container 内，却一个目标都没命中，
     * 且容器里压根不存在 .day —— 说明不是「点在了空白处」，而是选择器整体失效。
     * 只在真正失效时提示一次（用标志位节流，否则每次点击都弹，烦死人）。
     */
    if (!enhanceWarned && box.querySelectorAll('.day').length === 0) {
      enhanceWarned = true;
      new obsidian.Notice(
        'Time Tools：未能识别 Calendar 的日期格（.day），' +
        '可能是 Calendar 改版。请关闭「在 Calendar 视图上接管点击」，' +
        '或改用 time tools 日历。'
      );
      console.warn('[Time Tools] Calendar 增强选择器失效：容器内未找到 .day');
    }

    /*
     * 周列单独自检：上面那条只判 .day。Calendar 改版时可能出现
     * 「.day 还在、周列 class 全变了」—— 此时点周数静默失效，用户只能靠猜。
     * 用独立标志位：复用 enhanceWarned 的话，第一条弹过后这条永不弹。
     */
    try {
      if (!enhanceWeekWarned && box.querySelectorAll(WEEK_NUM_SELECTOR).length === 0) {
        enhanceWeekWarned = true;
        new obsidian.Notice(
          'Time Tools：未能识别 Calendar 的周列，周数点击可能失效。' +
          '若你只用日期格可忽略；需要周数跳转请改用 time tools 日历。'
        );
        console.warn('[Time Tools] Calendar 增强周列选择器失效：容器内未找到 ' + WEEK_NUM_SELECTOR);
      }
    } catch (e) {
      console.warn('[Time Tools] Calendar 周列自检失败', e);
    }
  };
  document.addEventListener('click', handler, true);
  // 卸载时移除，避免残留；标志位一起复位（否则重装后不再提示）
  plugin.register(() => {
    document.removeEventListener('click', handler, true);
    enhanceWarned = false;
    enhanceWeekWarned = false;
  });
}

/** 增强失效提示是否已弹过（只提示一次，避免反复打扰） */
let enhanceWarned = false;

/** 周列失效提示是否已弹过（与上面独立，两个失效要各提示一次） */
let enhanceWeekWarned = false;

/** 从「9月」「September」「Sep」里解出月份 */
function parseMonthText(text) {
  const t = String(text || '').trim();
  const num = t.match(/(\d{1,2})\s*月/);
  if (num) {
    const m = parseInt(num[1], 10);
    return m >= 1 && m <= 12 ? m : 0;
  }
  const bare = t.match(/^\s*(\d{1,2})\s*$/);
  if (bare) {
    const m = parseInt(bare[1], 10);
    return m >= 1 && m <= 12 ? m : 0;
  }
  const EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  const idx = EN.indexOf(t.toLowerCase());
  if (idx >= 0) return idx + 1;
  const ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const ai = ABBR.indexOf(t.toLowerCase().slice(0, 3));
  if (ai >= 0) return ai + 1;
  return 0;
}

/** 在 Calendar 容器里找当前显示的年份 */
function findYearIn(box) {
  try {
    const y = box.querySelector ? box.querySelector('.year') : null;
    if (y) {
      const n = parseInt((y.textContent || '').match(/\d{4}/)?.[0] || '', 10);
      if (n) return n;
    }
  } catch (e) { /* 找不到就用当前年兜底 */ }
  return 0;
}

/**
 * 标题元素判定：真正的年/月标题里不会有日期格。
 * Calendar 用 Svelte，标题容器有可能把整个网格包进去，
 * 不加这道判断的话点日期会被当成点标题，生成年记/月记。
 */
function isTitleEl(el) {
  try {
    return !el.querySelector('.day');
  } catch (e) {
    return true;
  }
}

/** 从「9月」「September」里解出月份（在 Calendar 容器内找当前显示的月份） */
function findMonthIn(box) {
  try {
    const m = box.querySelector ? box.querySelector('.month') : null;
    if (m) {
      const n = parseMonthText(m.textContent || '');
      if (n) return n;
    }
  } catch (e) { /* 找不到就返回 0 */ }
  return 0;
}

/** 从 "2026-09-08" / "2026年9月8日" 这类文本里解出日期 */
function parseDateText(raw) {
  const m = String(raw || '').match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const da = +m[3];
  const d = new Date(y, mo - 1, da);
  // 拒绝 2026-02-31 这种会被 Date 悄悄进位的无效日期
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return d;
}

/**
 * 优先从元素自带的日期信息取（aria-label / data-date / title），最可靠。
 * 日期可能标在外层容器上，故向上找几层。
 */
function dateFromDayAttrs(el) {
  let node = el;
  for (let i = 0; i < 3 && node && node.getAttribute; i++) {
    const raw = node.getAttribute('aria-label')
      || node.getAttribute('data-date')
      || node.getAttribute('title')
      || '';
    const d = parseDateText(raw);
    if (d) return d;
    node = node.parentElement;
  }
  return null;
}

/**
 * 算出 Calendar 里被点的那一格是哪一天。
 *
 * 两条路：
 *   1. 元素自带的日期属性（有就直接用）
 *   2. 按网格位置推算：取全部 .day 的下标，配合显示的年/月与周起始日反推
 *
 * 第 2 条要先校验 .day 的数量是 7 的倍数 —— 若选择器把表头也命中了，
 * 下标就会整体错位；这种情形直接放弃，交回 Calendar 自己处理。
 *
 * @returns {Date|null} 取不到返回 null，调用方必须据此放行事件
 */
function dateOfCalendarDay(box, dayEl, plugin) {
  try {
    const fromAttr = dateFromDayAttrs(dayEl);
    if (fromAttr) return fromAttr;

    const days = Array.prototype.slice.call(box.querySelectorAll('.day'));
    if (days.length === 0 || days.length % 7 !== 0) return null;
    const idx = days.indexOf(dayEl);
    if (idx < 0) return null;
    const y = findYearIn(box);
    const m = findMonthIn(box);
    if (!y || !m) return null;

    const startOffset = startOffsetOf(y, m - 1, targetDow(plugin.settings));
    let d = new Date(y, m - 1, 1 - startOffset + idx);

    /*
     * 用格内显示的数字校正跨月：
     * 点的是上月尾（显示 30/31 而推算得 1/2）或下月头（显示 1/2 而推算得 29/30）时，
     * 纯索引推算会差一个月。
     */
    const mt = String(dayEl.textContent || '').match(/(\d{1,2})/);
    const shown = mt ? parseInt(mt[1], 10) : 0;
    if (shown >= 1 && shown <= 31 && shown !== d.getDate()) {
      if (shown > d.getDate() + 7) d = new Date(y, m - 2, shown);
      else if (shown < d.getDate() - 7) d = new Date(y, m, shown);
      else d = new Date(y, m - 1, shown);
    }
    return isFinite(d.getTime()) ? d : null;
  } catch (e) {
    return null;
  }
}

/**
 * 算出 Calendar 里被点的周数格对应哪一周（返回该周首日）。
 *
 * 用周数格在所有周数格中的行号 r 反推：该行首日 = 1 - startOffset + r*7，
 * 与time tools 日历用的是同一套算法。
 *
 * @returns {Date|null} 取不到返回 null —— 不猜，避免建出错误周的周记
 */
function dateOfCalendarWeek(box, weekEl, plugin) {
  try {
    const y = findYearIn(box);
    const m = findMonthIn(box);
    if (!y || !m) return null;
    const dow = targetDow(plugin.settings);
    const startOffset = startOffsetOf(y, m - 1, dow);

    /*
     * 行号用周数格在 DOM 里的下标，不读格子里显示的数字。
     *
     * 2.57 曾改成「按显示的周数去 6 行里反查」，结果点 39 开 38 ——
     * Calendar 显示的编号与本地 weekNumberOf 算出的编号在跨月边界会差 1，
     * 拿数字去匹配等于把两套体系的误差固定下来。
     * 下标只依赖 DOM 顺序、与编号体系无关，2.56 用的就是这版，实测正常。
     */
    const wks = Array.prototype.slice.call(
      box.querySelectorAll(WEEK_NUM_SELECTOR)
    );
    const r0 = wks.indexOf(weekEl);
    if (r0 < 0) return null;
    let d = new Date(y, m - 1, 1 - startOffset + r0 * 7);

    /*
     * 交叉验证：下标算出的行首日，其周号应等于格子里显示的数字。
     * 不一致说明周数列被多余元素顶偏了（如表头占位格也带同样的 class），
     * 此时改用显示数字反查，并挑离下标最近的那一行 ——
     * 既保留下标的稳定性，又不会被固定偏移带偏一整周。
     */
    const mt = String(weekEl.textContent || '').match(/(\d{1,2})/);
    const shown = mt ? parseInt(mt[1], 10) : 0;
    if (shown >= 1 && shown <= 53 && isFinite(d.getTime())) {
      if (weekNumberOf(d, dow) !== shown) {
        let best = null;
        let bestDist = 1e9;
        for (let r = 0; r < wks.length; r++) {
          const cand = new Date(y, m - 1, 1 - startOffset + r * 7);
          if (!isFinite(cand.getTime())) continue;
          if (weekNumberOf(cand, dow) === shown) {
            const dist = Math.abs(r - r0);
            if (dist < bestDist) { bestDist = dist; best = cand; }
          }
        }
        if (best) d = best;
      }
    }
    return isFinite(d.getTime()) ? d : null;
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * 笔记命名统一（批量重命名）
 *
 * 由来：改了「日期格式」只影响之后新建的文件，老文件仍是旧命名。
 * 而圆点统计只按当前配置格式查，于是老日记在日历上不显示圆点 ——
 * 命名分裂。这里把已有笔记批量改成当前格式，让两边重新对上。
 *
 * 三条硬边界（改文件名是破坏性操作，宁可漏改不可误改）：
 *   1. 只处理**能反解出日期**的文件，认不出的绝不碰
 *   2. 只处理配置文件夹内的文件；folder 留空则该类跳过（不扫全库）
 *   3. 目标已存在则跳过，绝不覆盖
 * ------------------------------------------------------------------ */
const RENAME_KIND = { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' };

/**
 * 扫描需要改名的笔记（只读，不改动任何文件）。
 * @returns {Array<{file:object,kind:string,date:Date,from:string,to:string}>}
 */
function scanNoteRenames(app, settings) {
  const notes = settings && settings.notes;
  if (!notes || !app || !app.vault || typeof app.vault.getMarkdownFiles !== 'function') {
    return [];
  }
  const noteMod = require('./note.js');
  const dow = targetDow(settings);
  const out = [];
  const files = app.vault.getMarkdownFiles();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ref = parseNoteRef(f.basename || '', dow, notes, settings);
    const kind = ref ? RENAME_KIND[ref.kind] : null;
    if (!kind) continue;

    const cfg = noteMod.kindSettings(settings, kind);
    const folder = noteMod.resolvePathTokens(cfg.folder);
    /*
     * folder 留空时不扫全库：那会连普通笔记里恰好叫 2026-09-22 的文件一起改。
     * 实测（反证）这一步其实由下面那条归属判断兜住了 —— folder 为空时
     * `folder + '/'` 恒等于 '/'，任何路径都对不上。保留这行是显式保险：
     * 万一以后归属判断被改动，不至于退化成全库扫描。
     */
    if (!folder) continue;
    const p = String(f.path);
    if (!(p === folder + '/' + f.name || p.indexOf(folder + '/') === 0)) continue;

    const to = noteMod.buildNotePath(settings, kind, ref.date);
    if (to === p) continue; // 已经是当前格式
    out.push({ file: f, kind, date: ref.date, from: p, to });
  }
  return out;
}

/**
 * 执行改名。逐条进行并收集结果 —— 中途失败不影响其余条目，
 * 也不会留下半成品（rename 本身是原子的）。
 * @returns {{ok:Array, skipped:Array, failed:Array}}
 */
async function applyNoteRenames(app, list) {
  const res = { ok: [], skipped: [], failed: [] };
  if (!app || !app.vault) return res;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    const to = normalizePath(it.to);   // 批量改名目标来自用户输入，必须归一化
    const exist = app.vault.getAbstractFileByPath(to);
    // 目标已存在（且不是自己）→ 跳过，绝不覆盖，避免丢数据
    if (exist && exist !== it.file) {
      res.skipped.push({ item: it, reason: '目标已存在' });
      continue;
    }
    try {
      await app.vault.rename(it.file, to);
      res.ok.push(it);
    } catch (e) {
      res.failed.push({ item: it, reason: (e && e.message) || String(e) });
    }
  }
  return res;
}

/* 预览最多列几条：上千条的库全列会把弹窗撑爆 */
const RENAME_PREVIEW_MAX = 30;

/**
 * 改名流程：扫描 → 预览 → 确认后才动手。
 *
 * 必须两次确认：批量改文件名不可逆（虽 rename 会更新站内链接，
 * 但库外引用、同步冲突都救不回来），不能做成一键执行。
 */
function runNoteRenameFlow(plugin) {
  const app = plugin && plugin.app;
  if (!app) return;
  let list;
  try {
    list = scanNoteRenames(app, plugin.settings);
  } catch (e) {
    new obsidian.Notice('扫描失败：' + ((e && e.message) || e));
    return;
  }
  if (!list.length) {
    new obsidian.Notice(
      '没有需要改名的笔记（都已与当前格式一致，或四类笔记的存放位置为空）'
    );
    return;
  }

  const modal = new obsidian.Modal(app);
  modal.titleEl.setText(i18nT('k1c3c863e', '批量改名（{0} 个）', list.length));
  const box = modal.contentEl;
  box.createDiv({
    cls: 'tt-tip',
    text: i18nT('kcf7c9e2b', '以下笔记将改成当前「日期格式」。改名由 Obsidian 执行，站内链接会自动更新；')
      + '目标已存在的会跳过（不覆盖）。',
  });

  const ul = box.createEl('ul', { cls: 'tt-rename-list' });
  list.slice(0, RENAME_PREVIEW_MAX).forEach((it) => {
    ul.createEl('li', { text: it.from + '  →  ' + it.to });
  });
  if (list.length > RENAME_PREVIEW_MAX) {
    ul.createEl('li', { text: i18nT('ka9b35478', '……另有 ') + (list.length - RENAME_PREVIEW_MAX) + ' 个' });
  }

  const row = box.createDiv({ cls: 'tt-rename-actions' });
  const go = row.createEl('button', { text: i18nT('k2c5d791d', '确认改名'), cls: 'mod-cta' });
  row.createEl('button', { text: i18nT('k949856b3', '取消') }).addEventListener('click', () => modal.close());
  go.addEventListener('click', async () => {
    modal.close();
    const r = await applyNoteRenames(app, list);
    new obsidian.Notice(
      '改名完成：成功 ' + r.ok.length + '，跳过 ' + r.skipped.length
        + '，失败 ' + r.failed.length
    );
  });
  modal.open();
}

module.exports = {
  CAL_VIEW_TYPE,
  runNoteRenameFlow,
  scanNoteRenames,
  applyNoteRenames,
  CalendarNoteView,
  WEEK_START_OPTIONS,
  applyCalendarWeekSpec,
  attachCalendarEnhance,
  openOwnCalendar,
  closeOwnCalendar,
  isCalendarOpen,
  parseMonthText,
  registerCalendar,
  renderCalendarSettings,
  resolveLocaleDow,
  targetDow,
  weekSpecStatus,
  weekNumberOf,
  weekStartOf,
  startOffsetOf,
  enforceExclusive,
  normalizeCalendarExclusive,
  dateOfCalendarDay,
  dateOfCalendarWeek,
  parseDateFromName,
  parseNoteRef,
  weekContains,
  weekTouchesMonth,
  formatToRegex,
  findMonthIn,
  isTitleEl,
  registerTemplaterBridge,
  bridgeNewNote,
};
