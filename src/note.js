/*
 * 模块五：周期性笔记生成（日 / 周 / 月 / 年记）
 *
 * 两条生成路径：
 *   1. Templater 联动 —— 调官方 API create_new_note_from_template
 *   2. 内置模板      —— 仅在用户显式开启「降级内置模板」时使用
 *
 * 默认行为（重要）：
 *   Templater 不可用（未安装 / 未启用 / 模板路径没配）时**直接报错**并给出
 *   下载链接，绝不擅自用内置模板顶替 —— 用户要的是自己配好的模板，
 *   静默降级会生成内容不符预期的笔记，反而更糟。
 *   只有打开 fallbackToBuiltin 开关才会降级。
 */
'use strict';

const obsidian = require('obsidian');
const { normalizePath } = require('obsidian');
const { t: i18nT, miscText } = require('./i18n.js');
/** 周号计算取 timejudge，与日历视图同源（本文件是叶子模块，不能依赖 calendar.js） */
const {
  weekDoyOf, firstWeekOffset, weeksInYear, dayOfYearOf, WEEK_START_DOW,
} = require('./timejudge.js');

/** 四种笔记类型 */
const NOTE_KINDS = [
  { key: 'daily', label: '日记', defaultFormat: 'YYYY-MM-DD' },
  { key: 'weekly', label: '周记', defaultFormat: 'gggg-[W]ww' },
  { key: 'monthly', label: '月记', defaultFormat: 'YYYY-MM' },
  { key: 'yearly', label: '年记', defaultFormat: 'YYYY' },
];

const TEMPLATER_PLUGIN_ID = 'templater-obsidian';
const TEMPLATER_DOWNLOAD =
  'https://obsidian.md/plugins?id=templater-obsidian';

/* ------------------------------------------------------------------ *
 * Templater 联动
 * ------------------------------------------------------------------ */

/**
 * 取 Templater 的 API 对象。
 * 返回 null 表示不可用（未安装 / 未启用 / 尚未初始化）。
 */
function getTemplater(app) {
  try {
    const p = app && app.plugins && app.plugins.plugins
      ? app.plugins.plugins[TEMPLATER_PLUGIN_ID]
      : null;
    if (!p) return null;
    // Templater 未初始化完成时没有 templater 字段
    return p.templater || null;
  } catch (e) {
    return null;
  }
}

/** 人类可读的不可用原因，用于提示文案 */
function templaterState(app) {
  const p = app && app.plugins && app.plugins.plugins
    ? app.plugins.plugins[TEMPLATER_PLUGIN_ID] : null;
  if (!p) return { ok: false, reason: '未安装' };
  if (!p.templater) return { ok: false, reason: '已安装但未初始化' };
  if (typeof p.templater.create_new_note_from_template !== 'function') {
    return { ok: false, reason: '版本不兼容', methods: '' };
  }
  /*
   * 补跑桥接用的是 parse_template（不是 write_template_to_file —— 后者不是公开 API，
   * v2.71～v2.73 调了个不存在的方法，一直静默失败）。
   * 这里把可用方法列出来，排错时能一眼看出版本到底提供了什么。
   */
  const methods = Object.keys(p.templater)
    .filter((k) => typeof p.templater[k] === 'function')
    .join(', ');
  if (typeof p.templater.parse_template !== 'function') {
    return { ok: true, reason: '补跑不可用：缺少 parse_template', methods: methods };
  }
  return { ok: true, reason: '', methods: methods };
}

/**
 * 等 Templater 就绪（最多约 1.2 秒）。
 *
 * Templater 是异步初始化的，Obsidian 刚启动时 plugin 对象已在、
 * 但 templater 字段还没挂上。直接判定就是「已安装但未初始化」然后报错，
 * 表现为「点了没反应 / 提示装了却用不了」。等一会儿即可。
 * 「未安装」不必等，等也等不来。
 */
async function waitTemplater(app) {
  const step = 200;
  const max = 1200;
  for (let waited = 0; waited <= max; waited += step) {
    const st = templaterState(app);
    if (st.ok) return st;
    if (st.reason === '未安装') return st;
    await new Promise((r) => setTimeout(r, step));
  }
  return templaterState(app);
}

/* ------------------------------------------------------------------ *
 * 路径与文件名
 * ------------------------------------------------------------------ */

/** 按类型取设置；缺字段时用默认值兜底 */
function kindSettings(settings, kind) {
  const n = settings && settings.notes;
  const one = n && n[kind] ? n[kind] : {};
  const def = NOTE_KINDS.find((k) => k.key === kind) || NOTE_KINDS[0];
  return {
    folder: String(one.folder ?? ''),
    format: String(one.format ?? def.defaultFormat),
    template: String(one.template ?? ''),
    altFormats: String(one.altFormats ?? ''),
  };
}

/**
 * 拆分用户在「额外文件名格式」里填的多个格式。
 *
 * 支持中英文逗号、换行、顿号、分号混用；空串返回空数组。
 * 只用于**识别**（高亮 / 打开已有笔记），不用于新建。
 */
function splitAltFormats(text) {
  const s = String(text ?? '');
  if (!s.trim()) return [];
  return s.split(/[,，、;；\n\r]+/).map((x) => x.trim()).filter(Boolean);
}

/**
 * 高亮识别用的候选格式清单。
 *
 * 原来「打开笔记」走 cfg.format + ALT_FORMATS，「高亮」却只认 cfg.format
 * 一条 —— 两条路径不同源，于是换个命名风格高亮就失效。
 * 这里统一成同一份清单：配置格式 → 用户额外格式 → 常见异名。
 *
 * 顺序有意义：越靠前优先级越高，先命中者胜。
 *
 * @returns {string[]} 去重后的格式串数组
 */
function highlightFormats(settings, kind) {
  const cfg = kindSettings(settings, kind);
  const list = [cfg.format]
    .concat(splitAltFormats(cfg.altFormats))
    .concat(ALT_FORMATS[kind] || []);
  const seen = new Set();
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const f = String(list[i] ?? '').trim();
    if (!f || seen.has(f)) continue;
    seen.add(f);
    out.push(f);
  }
  return out;
}

/**
 * 兼容核心「日记」插件的 DI（moment 没有这个 token，不处理会输出成 2026-09-21I）。
 * DI 的语义是「日 + 星期」（核心插件渲染成 2026-09-21-周一），故映射为 DD-ddd。
 * [字面量] 里的 DI 不动；只要星期请直接用 ddd。
 */
function normalizeDi(format) {
  const raw = String(format ?? '');
  const lits = [];
  const masked = raw.replace(/\[([^\]]*)\]/g, (_m, s) => {
    lits.push(s);
    return '\u0000' + (lits.length - 1) + '\u0000';
  });
  return masked
    .replace(/DI/g, 'DD-ddd')
    .replace(/\u0000(\d+)\u0000/g, (_m, i) => '[' + (lits[Number(i)] ?? '') + ']');
}

/**
 * 拆分「文件名格式」里的路径部分。
 *
 * 与 Obsidian 核心「日记」插件行为一致：日期格式里可以带 /，
 * 例如 YYYY/MM/YYYY-MM-DD —— 前面的 YYYY/MM 变成两级子目录，
 * 只有最后一段是文件名。从核心插件迁移格式串时无需手工拆开。
 *
 * [字面量] 里允许含 /，先占位剥离再按 / 拆，避免把字面量的斜杠
 * 误当成分隔符。
 *
 * @returns {{sub:string, name:string}} sub 为子目录部分（可能为空串）
 */
function splitFormatPath(format) {
  const raw = String(format ?? '');
  const lits = [];
  const masked = raw.replace(/\[([^\]]*)\]/g, (_m, s) => {
    lits.push(s);
    return '\u0000' + (lits.length - 1) + '\u0000';
  });
  // 还原时要带上方括号本身：占位符只存了括号内的内容
  const restore = (s) =>
    s.replace(/\u0000(\d+)\u0000/g, (_m, i) => '[' + (lits[Number(i)] ?? '') + ']');
  const idx = masked.lastIndexOf('/');
  if (idx < 0) return { sub: '', name: restore(masked) };
  return {
    sub: restore(masked.slice(0, idx)),
    name: restore(masked.slice(idx + 1)),
  };
}

/**
 * 构建笔记完整路径（含 .md）—— 所有调用点的统一入口。
 * 三段拼接：配置文件夹 → 文件名格式里 / 产生的子目录 → 文件名（最后一段）。
 * 走统一入口是为了避免「有的地方认 / 、有的地方不认」—— folder 就出过这个问题。
 */
/**
 * 构建笔记所在目录（不含文件名）。
 *
 * Templater 的 create_new_note_from_template 要单独传目录，
 * 所以这里与 buildNotePath 共用同一套拼接规则 —— 否则日期格式里带 /
 * 时，Templater 会把笔记建到少了子目录的位置。
 */
function buildNoteDir(settings, kind, date, format) {
  const cfg = kindSettings(settings, kind);
  const dow = dowOfSettings(settings);
  const fmt = format == null ? cfg.format : format;
  const parts = splitFormatPath(fmt);
  // 路径：字面量，不做任何 token 解析（层级请写在日期格式里）
  const folder = resolvePathTokens(cfg.folder);
  // 日期格式里的子目录（YYYY/MM）：仍需解析，与核心「日记」插件一致
  const sub = buildFormatSubdir(parts.sub, date, kind, dow);
  return [folder, sub].filter((s) => s && s.trim()).join('/');
}

function buildNotePath(settings, kind, date, format) {
  const cfg = kindSettings(settings, kind);
  const dow = dowOfSettings(settings);
  const fmt = format == null ? cfg.format : format;
  const parts = splitFormatPath(fmt);
  return fullPath(
    buildNoteDir(settings, kind, date, fmt),
    buildFileName(date, parts.name, kind, dow)
  );
}

/**
 * 用 moment 生成文件名。
 * 两种无效情况都要兜底：
 *   1. 抛错或返回 Invalid date
 *   2. 输出与格式串完全相同 —— 说明串里没有任何被识别的 token
 *      （例如 gggg/ww 在某些环境下不被支持），此时用内置算法算，避免
 *      把 "gggg-[W]ww" 这种原始字符串直接当文件名
 */
function buildFileName(date, format, kind, dow) {
  try {
      /*
       * 周号必须与日历格子同源：交给 moment 的 gggg/ww 会用它自己的 locale week，
       * 与用户设置的周起始（firstDow）不同源时会「显示第 40 周却生成 2026-W39」。
       * 故按传入 dow 自算，规则同 calendar.js 的 weekNumberOf。
       */
    if (kind === 'weekly' && /gggg|GGGG|ww|WW/.test(String(format))) {
      const own = formatWeekName(date, String(format), dow == null ? 1 : dow);
      if (own) return own;
    }
    const out = obsidian.moment(date.getTime()).format(normalizeDi(format));
    if (!out || out === 'Invalid date' || out === String(format)) {
      return fallbackName(date, kind);
    }
    return out;
  } catch (e) {
    return fallbackName(date, kind);
  }
}

/**
 * 按指定周起始格式化周记名，不经过 moment 的 locale。
 *
 * 支持 gggg / GGGG / ww / WW / YYYY / MM / DD 与 [字面量]（如 [W]）。
 * 遇到无法识别的 token 返回 null，由调用方退回 moment。
 */
function formatWeekName(date, format, dow) {
  const pad = (v) => String(v).padStart(2, '0');
  const lits = [];
  let tpl = String(format).replace(/\[([^\]]*)\]/g, (_m, s) => {
    lits.push(s);
    return '\u0000' + (lits.length - 1) + '\u0000';
  });
  const lw = weekMeta(date, dow);
  tpl = tpl
    .replace(/gggg/g, String(lw.year))
    .replace(/GGGG/g, String(date.getFullYear()))
    .replace(/ww/g, pad(lw.week))
    .replace(/WW/g, pad(getIsoWeek(date)))
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/DD/g, pad(date.getDate()));
  // 仍有字母 token 说明不支持，交回 moment 处理
  if (/[A-Za-z]/.test(tpl)) return null;
  return tpl.replace(/\u0000(\d+)\u0000/g, (_m, i) => lits[Number(i)]);
}

/* weekDoyOf / dayOfYearOf / firstWeekOffset / weeksInYear 取 timejudge 共享实现 */
const weeksInYearOf = weeksInYear;

/*
 * 周起始：与 calendar.js 同源（同取 timejudge.WEEK_START_DOW），
 * 避免两套周界各算各的——周记文件名与日历显示必须落在同一周。
 * note.js 与 calendar.js 互相引用会成环，所以共享定义放在不依赖二者的
 * timejudge.js，两边各自去取。
 */

function localeDow() {
  try {
    const m = obsidian.moment ? obsidian.moment() : null;
    const ld = m && typeof m.localeData === 'function' ? m.localeData() : null;
    const w = ld && typeof ld.week === 'function' ? ld.week() : null;
    if (w && typeof w.dow === 'number') return w.dow;
  } catch (e) { /* 查询失败用默认值 */ }
  return 0;
}

function dowOfSettings(settings) {
  const cal = settings && settings.calendar;
  const v = cal ? cal.weekStart : 'locale';
  if (v && v !== 'locale' && Object.prototype.hasOwnProperty.call(WEEK_START_DOW, v)) {
    return WEEK_START_DOW[v];
  }
  return localeDow();
}

/**
 * 与 calendar.js 的 weekNumberOf 同算法，额外返回所属周年份（gggg）。
 * 跨年时周年份与日历年不同：2024-12-30 属于 2025 年第 1 周。
 */
function weekMeta(date, dow) {
  const doy = weekDoyOf(dow);
  const y = date.getFullYear();
  const off = firstWeekOffset(y, dow, doy);
  let w = Math.floor((dayOfYearOf(date) - off - 1) / 7) + 1;
  if (w < 1) return { year: y - 1, week: w + weeksInYearOf(y - 1, dow, doy) };
  const total = weeksInYearOf(y, dow, doy);
  if (w > total) return { year: y + 1, week: w - total };
  return { year: y, week: w };
}

function fallbackName(date, kind) {
  const p = (v) => String(v).padStart(2, '0');
  if (kind === 'yearly') return String(date.getFullYear());
  if (kind === 'monthly') {
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}`;
  }
  if (kind === 'weekly') return `${date.getFullYear()}-W${p(getIsoWeek(date))}`;
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** ISO 周数（周一为一周之始） */
function getIsoWeek(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (t.getDay() + 6) % 7; // 周一=0
  t.setDate(t.getDate() - day + 3); // 移到该周周四
  const first = new Date(t.getFullYear(), 0, 4);
  const fday = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - fday + 3);
  return 1 + Math.round((t - first) / (7 * 86400000));
}

/** 拼接完整路径（含 .md） */
function fullPath(folder, name) {
  // 入口归一化：替换原先只去尾斜杠的手工清理（它不处理反斜杠/重复斜杠）
  const f = normalizePath(folder);
  return (f ? f + '/' : '') + name + '.md';
}

/**
 * 可识别的日期 token。
 *
 * 末尾的 (?![A-Za-z]) 是必需的：没有它，`My Docs` 里的 M、D
 * 也会被当成月/日 token，文件夹名被改得面目全非。
 * 加上后只有独立成词（后接分隔符或结尾）才算 token。
 */
const FOLDER_TOKEN_RE =
  /(?:YYYY|YY|gggg|GGGG|MMMM|MMM|MM|M|DD|D|dddd|ddd|ww|WW)(?![A-Za-z])/;

  /**
   * 解析「日期格式」里的子目录段（/ 之前的各段）。分级能力只此一处 ——
   * 「新笔记存放位置」是纯字面量，两处都解析会让用户填两遍年份、建出叠层路径。
   * 与 buildFileName 的关键差异：没有可识别 token 时原样返回，
   * 绝不退回 fallbackName（否则 03记录/生活记录 会被换成一个日期串）。
   *
   * @returns {{sub:string, name:string}} sub 为子目录部分（可能为空串）
   */
function buildFormatSubdir(folder, date, kind, dow) {
  const raw = String(folder || '').trim();
  if (!raw) return '';
  // 兼容 Templater 习惯写法：{{YYYY}} 也认，避免又建出字面量文件夹
  const src = raw.replace(/\{\{([^{}]*)\}\}/g, '$1');
  const parts = src.split('/').map((seg) => {
    if (!seg || !FOLDER_TOKEN_RE.test(seg)) return seg;
    return formatSegment(seg, date, kind, dow) || seg;
  });
  // 顺带做清洗：去掉空段、. 与 ..（防越出库的路径穿越）
  return parts
    .map((s) => s.trim())
    .filter((s) => s && s !== '.' && s !== '..')
    .join('/');
}

/** 格式化单段路径；失败返回 null 由调用方保留原样 */
function formatSegment(seg, date, kind, dow) {
  // 周记文件夹常用 gggg：周号必须与日历显示同源，不能走 moment 的 locale
  if (kind === 'weekly' && /gggg|GGGG|ww|WW/.test(seg)) {
    const own = formatWeekName(date, seg, dow == null ? 1 : dow);
    if (own) return own;
  }
  try {
    const out = obsidian.moment(date.getTime()).format(normalizeDi(seg));
    if (out && out !== 'Invalid date') return out;
  } catch (e) { /* 退回原样 */ }
  return null;
}

/** 取解析后的文件夹（各调用点统一走这里，避免有的解析有的不解析） */
function noteFolder(settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  return resolvePathTokens(cfg.folder);
}

  /**
   * 路径（新笔记存放位置）：原样返回，只做安全清洗。
   * 曾在这里解析 YYYY/MM/gggg，与「日期格式」的分级能力重复，容易建出
   * 日记/2026/2026/09 这类叠层路径 —— 现已取消，层级一律写在日期格式里。
   * 保留的清洗（去 .. 防路径穿越、去空段与首尾斜杠）是安全兜底，不能省。
   */
function resolvePathTokens(folder) {
  return String(folder || '')
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s && s !== '.' && s !== '..')
    .join('/');
}

/* ------------------------------------------------------------------ *
 * 内置模板降级
 * ------------------------------------------------------------------ */

/** 模板变量替换 */
function fillTemplate(text, date, kind) {
  const p = (v) => String(v).padStart(2, '0');
  const map = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    monthPadded: p(date.getMonth() + 1),
    day: date.getDate(),
    dayPadded: p(date.getDate()),
    week: getIsoWeek(date),
    weekPadded: p(getIsoWeek(date)),
    weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
    kind: kind,
  };
  return String(text).replace(/\{\{(\w+)\}\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(map, k) ? map[k] : m
  );
}

const DEFAULT_BUILTIN_TEMPLATES = {
  daily: '# {{year}}年{{monthPadded}}月{{dayPadded}}日 周{{weekday}}\n\n',
  weekly: '# {{year}}年第{{weekPadded}}周\n\n',
  monthly: '# {{year}}年{{monthPadded}}月\n\n',
  yearly: '# {{year}}年\n\n',
};

/* ------------------------------------------------------------------ *
 * 生成入口
 * ------------------------------------------------------------------ */

/**
 * 查找模板文件，三层容错。
 *
 * 1. 原路径精确匹配
 * 2. 补 .md 后再匹配（用户常漏写后缀）
 * 3. 同级文件夹下按文件名模糊匹配（用户可能填的是文件夹名）
 *
 * @returns {{file:object|null, tried:string[]}} tried 用于报错时如实展示
 */
function resolveTemplate(app, rawPath) {
  const tried = [];
  const src = normalizePath(String(rawPath || '').trim());
  if (!src) return { file: null, tried };

  // 1) 原样
  let f = app.vault.getAbstractFileByPath(src);
  if (f) return { file: f, tried: [src] };
  tried.push(src);

  // 2) 补 .md
  const withMd = /\.md$/i.test(src) ? null : src + '.md';
  if (withMd) {
    f = app.vault.getAbstractFileByPath(withMd);
    if (f) return { file: f, tried };
    tried.push(withMd);
  }

  // 3) 模糊匹配：在库里找 basename 相同、且路径以输入为前缀的文件
  try {
    const needle = src.replace(/\.md$/i, '').toLowerCase();
    const all = app.vault.getFiles ? app.vault.getFiles() : [];
    const hit = all.find((x) => {
      const p = String(x.path || '').replace(/\.md$/i, '').toLowerCase();
      return p === needle || p.endsWith('/' + needle.split('/').pop())
        || p.startsWith(needle + '/');
    });
    if (hit) return { file: hit, tried };
  } catch (e) { /* getFiles 不可用时跳过 */ }

  return { file: null, tried };
}

/**
 * 生成或打开一篇周期性笔记。
 * @returns {Promise<{ok:boolean, msg:string, path?:string}>}
 */
async function openOrCreateNote(plugin, kind, date) {
  const app = plugin.app;
  const settings = plugin.settings;
  const cfg = kindSettings(settings, kind);
  const label = (NOTE_KINDS.find((k) => k.key === kind) || {}).label || kind;

  const dow = dowOfSettings(settings);
  const name = buildFileName(date, splitFormatPath(cfg.format).name, kind, dow);
  const path = buildNotePath(settings, kind, date, cfg.format);

  /*
   * 已存在就打开，不覆盖。
   * 除了按配置格式查，还要按常见异名格式兜底查一次：
   * 老笔记可能是别的格式命名的（如 2026-09-08-周二.md），
   * 只按配置格式判断「不存在」就会再建一篇，形成重复。
   */
  let exist = app.vault.getAbstractFileByPath(path);
  const alt = exist ? null : findExistingNote(app, settings, kind, date);
  if (alt) {
    await openFile(app, alt);
    return { ok: true, msg: `已打开${label}：${alt.path}`, path: alt.path };
  }
  if (exist) {
    await openFile(app, exist);
    return { ok: true, msg: `已打开${label}：${path}`, path };
  }

  // 没配模板路径 → 明确报错，不擅自降级
  if (!cfg.template) {
    return {
      ok: false,
      msg: `未配置${label}模板路径。请在设置 → 日历 → ${label} 中填写模板文件路径，或开启「降级内置模板」。`,
    };
  }

  /*
   * 模板查找三层容错。
   * 用户实测：把「模板文件」填成不带 .md 的路径（例：04仓库/1模板/推进类模板），
   * 而说明写的是「含 .md」——精确匹配直接失败，且当时只在 console.warn，
   * 界面上完全没有反馈，表现为「点了没反应」。
   */
  const found = resolveTemplate(app, cfg.template);
  if (!found.file) {
    return { ok: false, msg: `模板文件不存在：${cfg.template}（已尝试补 .md 与模糊匹配）` };
  }
  const tpl = found.file;

  // 优先 Templater（会短暂等待它初始化完成）
  const st = await waitTemplater(app);
  if (st.ok) {
    try {
      const t = getTemplater(app);
      await t.create_new_note_from_template(
        tpl,
        buildNoteDir(settings, kind, date, cfg.format) || undefined,
        name,
        true
      );
      return { ok: true, msg: `已用 Templater 生成${label}：${name}`, path };
    } catch (e) {
      // Templater 失败时不静默：要么降级（开关开），要么如实报错
      if (!(settings.notes && settings.notes.fallbackToBuiltin)) {
        return { ok: false, msg: `Templater 生成失败：${e && e.message ? e.message : e}` };
      }
      console.warn('[Time Tools] Templater 失败，已降级内置模板', e);
    }
  } else {
    if (!(settings.notes && settings.notes.fallbackToBuiltin)) {
      return {
        ok: false,
        msg: `Templater ${st.reason}，无法生成${label}。请先安装并配置 Templater：${TEMPLATER_DOWNLOAD}`,
      };
    }
  }

  // 降级：内置模板（仅当开关打开）
  return await createWithBuiltin(plugin, kind, date, path, name, label);
}

async function createWithBuiltin(plugin, kind, date, path, name, label) {
  const app = plugin.app;
  path = normalizePath(path);
  const folder = path.substring(0, path.lastIndexOf('/'));
  if (folder) {
    const f = app.vault.getAbstractFileByPath(folder);
    if (!f) {
      try { await app.vault.createFolder(folder); } catch (e) { /* 可能已存在 */ }
    }
  }
  const body = fillTemplate(DEFAULT_BUILTIN_TEMPLATES[kind] || '', date, kind);
  const file = await app.vault.create(path, body);
  await openFile(app, file);
  return { ok: true, msg: `已用内置模板生成${label}：${name}`, path };
}

async function openFile(app, file) {
  try {
    const leaf = app.workspace.getLeaf(false);
    if (leaf && typeof leaf.openFile === 'function') await leaf.openFile(file);
  } catch (e) { /* 打开失败不影响文件已生成 */ }
}

/*
 * 常见异名格式：老笔记可能不是按当前配置格式命名的。
 * 只用于「打开已存在的笔记」这一件事，绝不用于新建 ——
 * 新建必须严格按用户配置的格式，否则越配越乱。
 */
const ALT_FORMATS = {
  daily: ['YYYY-MM-DD', 'YYYY-MM-DD-ddd', 'YYYY-MM-DD ddd', 'YYYY-M-D',
    'YYYYMMDD', 'YYYY年M月D日', 'YYYY-MM-DD-dddd'],
  weekly: ['gggg-[W]ww', 'gggg-Www', 'gggg-[W]WW'],
  monthly: ['YYYY-MM', 'YYYY-MM月记', 'YYYY年M月'],
  yearly: ['YYYY', 'YYYY年记', 'YYYY年'],
};

/**
 * 按常见异名格式找已存在的笔记。
 *
 * 场景：接管 Calendar 的日期点击后，若用户历史日记是 2026-09-08-周二.md
 * 而配置格式是 YYYY-MM-DD，只按配置查会判定「不存在」→ 再建一篇，
 * 同一天出现两篇日记。这里在**配置文件夹内**试几种常见格式，命中就打开。
 *
 * @returns {object|null} 找到的文件
 */
function findExistingNote(app, settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  const list = ALT_FORMATS[kind] || [];
  const seen = new Set();
  const formats = [cfg.format].concat(list.filter((f) => f !== cfg.format));
  for (const f of formats) {
    let name;
    try {
      name = buildFileName(date, f, kind, dowOfSettings(settings));
    } catch (e) {
      continue;
    }
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const hit = app.vault.getAbstractFileByPath(buildNotePath(settings, kind, date, f));
    if (hit) return hit;
  }
  return null;
}

/** 笔记是否存在（视图上画小圆点用） */
function noteExists(app, settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  const path = buildNotePath(settings, kind, date, cfg.format);
  return !!app.vault.getAbstractFileByPath(path);
}

/* ------------------------------------------------------------------ *
 * 字数统计（对齐 Calendar 的 Words per dot）
 *
 * 每天画 N 个小圆点，N = 字数 / 每点代表字数。
 * 读全文较贵，故按「路径 + 修改时间」缓存 ——
 * 同一个月来回翻页时不会重复读盘。
 * ------------------------------------------------------------------ */
const wordCache = new Map();

function cacheKey(file) {
  return String(file.path) + '@' + String(file.stat ? file.stat.mtime : 0);
}

/**
 * 统计一篇笔记的字数。
 * 中英文混排时：中文按字符计，英文按词计，取两者之和 ——
 * 这是中文用户最直觉的算法（纯按空格切词会把中文整段算成 1 个词）。
 */
function countWords(text) {
  if (!text) return 0;
  let body = String(text);
  // 去掉 frontmatter，否则 YAML 键名会被算进字数
  if (body.startsWith('---')) {
    const end = body.indexOf('\n---', 3);
    if (end > 0) body = body.substring(end + 4);
  }
  // 去掉代码块与纯空白
  body = body.replace(/```[\s\S]*?```/g, '');
  const cn = (body.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (body.replace(/[\u4e00-\u9fa5]/g, ' ')
    .match(/[A-Za-z0-9_'-]+/g) || []).length;
  return cn + en;
}

/**
 * 取某天日记的字数；笔记不存在返回 0。
 * 同步走 cachedRead 不可行，故这里只做「已缓存才返回」的快速路径，
 * 未命中由调用方异步补 —— 视图首帧先不画点，读到后再刷新。
 */
function cachedWordCount(file) {
  if (!file) return 0;
  const k = cacheKey(file);
  const hit = wordCache.get(k);
  return hit ? hit : 0;
}

/*
 * 「是否已统计过」必须与字数分开记录。
 *
 * 踩过的坑：早期用「字数 === 0」当作「未统计」，于是空笔记（真实字数 0）
 * 永远被判定为未统计 —— 补读后仍是 0，render 又触发补读，形成无限循环，
 * 表现为疯狂读盘 + 界面不停重绘。空日记是常态，这个循环必现。
 */
function hasWordCount(file) {
  if (!file) return false;
  return wordCache.has(cacheKey(file));
}

function setWordCount(file, n) {
  if (!file) return;
  const k = cacheKey(file);
  wordCache.set(k, n);
  // 限量：缓存不随使用无限增长
  if (wordCache.size > 400) {
    const first = wordCache.keys().next().value;
    wordCache.delete(first);
  }
}

/**
 * 取某类笔记的文件（不存在返回 null）
 *
 * 周记/月记/年记也要用：日历周数列的圆点读的是周记本身，
 * 所以不能只有 getDailyFile 一个入口。
 */
function getNoteFile(app, settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  const path = buildNotePath(settings, kind, date, cfg.format);
  return app.vault.getAbstractFileByPath(path);
}

function getDailyFile(app, settings, date) {
  return getNoteFile(app, settings, 'daily', date);
}

/** 清空字数缓存（设置变更或卸载时调用，避免陈旧数据） */
function clearWordCache() {
  wordCache.clear();
}

/**
 * 增量失效：只淘汰「文件已不存在 / mtime 已变」的条目，保留仍然有效的。
 *
 * 为什么不全清：缓存 key 是「路径@mtime」，mtime 变了旧 key 本来就不会命中，
 * 全清等于把仍然有效的几十个格子的统计白扔掉，下一次渲染全部重新读盘。
 * 只读 stat、不读文件内容，所以很便宜。
 *
 * @returns {number} 淘汰条数（供诊断）
 */
function pruneWordCache(app) {
  if (!app || !app.vault || typeof app.vault.getAbstractFileByPath !== 'function') return 0;
  let dropped = 0;
  for (const k of Array.from(wordCache.keys())) {
    const at = k.lastIndexOf('@');
    if (at < 0) { wordCache.delete(k); dropped++; continue; }
    const p2 = k.slice(0, at);
    const mt = k.slice(at + 1);
    const f = app.vault.getAbstractFileByPath(normalizePath(p2));
    // 文件没了，或 mtime 与缓存时不同 —— 这条已经取不到，删掉
    if (!f || String(f.stat ? f.stat.mtime : 0) !== mt) { wordCache.delete(k); dropped++; }
  }
  return dropped;
}

/* ------------------------------------------------------------------ *
 * 设置页
 * ------------------------------------------------------------------ */

function renderNoteSettings(containerEl, plugin) {
  const n = plugin.settings.notes;

  const st = templaterState(plugin.app);
  const head = containerEl.createDiv({ cls: 'tt-note-status' });
  head.setText(
    st.ok
      ? i18nT('k25ea5b75', 'Templater：已就绪，将用它生成笔记。')
      : i18nT('k3e466b79', 'Templater：{0}（下载：{1}）', st.reason, TEMPLATER_DOWNLOAD)
  );
  if (!st.ok) head.addClass('is-warn');

  new obsidian.Setting(containerEl)
    .setName(i18nT('kdeb01a5c', '降级内置模板'))
    .setDesc(i18nT('k5dfd0317', "Templater 不可用时改用内置简单模板。默认关闭 —— 此时会明确提示你去配置 Templater，而不是悄悄生成内容不符预期的笔记。内置模板只有少量基础变量；需要天气、习惯打卡、条件判断等复杂逻辑请直接用 Templater。"))
    .addToggle((t) =>
      t.setValue(n.fallbackToBuiltin === true).onChange(async (v) => {
        n.fallbackToBuiltin = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 内置模板变量清单。
   * 只在开启降级时展示 —— 用 Templater 的人根本不需要看这个，
   * 显示了反而让人误以为本插件的模板能力只有这些。
   */
  if (n.fallbackToBuiltin === true) {
    const box = containerEl.createDiv({ cls: 'tt-note-varhelp' });
    box.createDiv({
      cls: 'tt-note-varhelp-title',
      text: i18nT('ke7b4064f', '内置模板可用变量（仅基础项）'),
    });
    box.createDiv({
      cls: 'tt-note-varhelp-body',
      text: '{{year}} {{month}} {{monthPadded}} {{day}} {{dayPadded}} '
        + '{{week}} {{weekPadded}} {{weekday}} {{kind}}',
    });
    box.createDiv({
      cls: 'tt-note-varhelp-note',
      /* 只包第一段会变成「英文开头 + 中文后续」，必须整段合并 */
      text: i18nT('k6e1c436d',
        '需要天气、习惯打卡、条件判断等复杂内容时，请用 Templater —— 上面「模板文件」填 Templater 模板即可，本插件会优先调用它。'),
    });
  }

  NOTE_KINDS.forEach((k) => {
    const one = n[k.key] || {};
    containerEl.createDiv({ cls: 'tt-note-kind-title', text: miscText('noteKind', k.key, k.label) });

    /*
     * 示例预览：只改这一个元素的文本，绝不重绘设置页。
     * 重绘会重建输入框 DOM、让焦点丢失 —— 曾经踩过：每敲一个字符就失焦，
     * 只能删一个再填一个。所以这里持有元素引用单独更新。
     */
    const previewEl = containerEl.createDiv({ cls: 'tt-note-preview' });
    const updatePreview = () => {
      let txt = '（格式无效）';
      try {
        const p = buildNotePath(plugin.settings, k.key, new Date());
        if (p) txt = p;
      } catch (e) { /* 保留占位文案 */ }
      previewEl.setText(i18nT('k614fc656', '示例：') + txt);
    };

    new obsidian.Setting(containerEl)
      .setName(i18nT('k398e51ca', '日期格式'))
      .setDesc(i18nT('kb8a9c9ce', "moment 语法，决定文件名。**可带 / 直接写子目录**（如 YYYY/MM/YYYY-MM-DD）：只有最后一段是文件名，与核心「日记」插件一致。留空用默认（{0}）。常用：YYYY 年、MM 月、DD 日、ddd 周二、gggg 周所属年、ww 周数、DI＝日-星期（等同 DD-ddd，兼容核心插件；只要星期请用 ddd）。注意：改了只影响之后新建的文件。", k.defaultFormat))
      .addText((tx) =>
        tx.setPlaceholder(k.defaultFormat)
          .setValue(String(one.format ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].format = v;
            await plugin.saveSettings();
            updatePreview();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('kecaa48f5', '新笔记存放位置'))
      .setDesc(i18nT('k750e7faa', "留空为库根目录。本框**不做任何日期替换**：YYYY、MM、gggg、DD、ddd 一律保持字面量（填 YYYY 就真的会建出叫 YYYY 的文件夹）。\\n要按年/月分级，请写在上面「日期格式」里，与核心「日记」插件完全一致。本项与格式里 / 产生的目录依次拼接（本项在前）。"))
      .addText((tx) =>
        tx.setPlaceholder(i18nT('k724352a6', '留空为根目录'))
          .setValue(String(one.folder ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].folder = v;
            await plugin.saveSettings();
            updatePreview();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('k1d520488', '模板位置'))
      .setDesc(i18nT('kf4c631a1', 'Templater 模板的完整路径，含 .md。推荐用 <% %> 语法（支持天气、习惯打卡、条件判断）。'))
      .addText((tx) =>
        tx.setPlaceholder(i18nT('kdd4423f7', '例：04仓库/1模板/日记模板.md'))
          .setValue(String(one.template ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].template = v;
            await plugin.saveSettings();
          })
      );

    /*
     * 额外文件名格式：只用于「识别」，不用于新建。
     *
     * 为什么需要它：高亮要靠文件名反推日期，而文件名格式是用户自己定的
     * —— 内置那几种常见写法覆盖不了所有人。老库里还常有历史命名
     * （如 2026-09-08-周二），光靠当前配置格式认不出。
     * 给用户一个窗口自己补，插件才对别人也管用。
     */
    new obsidian.Setting(containerEl)
      .setName(i18nT('k6468a655', '额外文件名格式'))
      .setDesc(i18nT('k39bdb13e', "仅用于识别已有笔记（高亮、点击打开），新建仍严格按上面的「日期格式」。多个用逗号分隔，可含文件夹。"))
      .addText((tx) =>
        tx.setPlaceholder(i18nT('k69c5eac1', `例：${k.defaultFormat}-ddd，${k.defaultFormat}`, k.defaultFormat, k.defaultFormat))
          .setValue(String(one.altFormats ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].altFormats = v;
            await plugin.saveSettings();
          })
      );

    updatePreview();
  });
}

module.exports = {
  NOTE_KINDS,
  TEMPLATER_DOWNLOAD,
  buildFileName,
  resolvePathTokens,
  buildNotePath,
  buildNoteDir,
  splitFormatPath,
  normalizeDi,
  noteFolder,
  fillTemplate,
  fullPath,
  getIsoWeek,
  getTemplater,
  kindSettings,
  noteExists,
  findExistingNote,
  ALT_FORMATS,
  splitAltFormats,
  highlightFormats,
  openOrCreateNote,
  waitTemplater,
  cachedWordCount,
  hasWordCount,
  clearWordCache,
  pruneWordCache,
  countWords,
  getNoteFile,
  getDailyFile,
  setWordCount,
  renderNoteSettings,
  resolveTemplate,
  templaterState,
};
