/*
 * Calendar 效果增强：日/周分流 —— v2.77
 *
 * 新增开关「日/周用 Calendar 原生功能，月/年用本插件」：
 * 开启后日期与周数的点击交回 Calendar 自己处理（不拦截），
 * 只有月份与年份的点击由本插件生成。
 *
 * 本套件真实调用 attachCalendarEnhance 捕获到的 handler，
 * 直接观察「有没有 preventDefault」—— 这才是「放不放行」的判据。
 */
let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

// --- 捕获 handler ---
let captured = null;
global.document = {
  addEventListener: (type, fn) => { if (type === 'click') captured = fn; },
  removeEventListener: () => {},
};

const SRC = __dirname + '/../src/';
const obsidian = require('obsidian');
const notices = [];
obsidian.Notice = function (m) { this.msg = m; notices.push(String(m)); };
const cal = require(SRC + 'calendar.js');
const notePath = require.resolve(SRC + 'note.js');
const settings = require(SRC + 'settings.js');

// --- 替换 note.js 的 openOrCreateNote，记录被调用的 kind ---
const calls = [];
require(notePath);
require.cache[notePath].exports.openOrCreateNote = async (plugin, kind, date) => {
  calls.push(kind);
  return { ok: true, msg: 'ok' };
};

function makePlugin(calSettings) {
  return {
    settings: {
      calendar: Object.assign({
        enhanceCalendarEnabled: true,
        ownCalendarEnabled: false,
        allowBoth: false,
        nativeDayWeek: false,
      }, calSettings),
    },
    register: (fn) => { unloadFns.push(fn); },
    saveSettings: async () => {},
  };
}
const unloadFns = [];

/** 构造事件：hit 决定 closest 命中哪个选择器 */
function makeEv(hit) {
  const TEXT = { day: '25', week: '39', year: '2026', month: '9月' };
  const el = {
    closest: (sel) => {
      if (sel === '#calendar-container') return box;
      if (hit === 'day' && sel === '.day') return el;
      if (hit === 'week' && sel.indexOf('week') >= 0) return el;
      if (hit === 'year' && sel === '.year') return el;
      if (hit === 'month' && sel === '.month') return el;
      return null;
    },
    querySelector: () => null,
    getAttribute: () => null,
    textContent: TEXT[hit] || '',
  };
  // 造出完整的 42 格网格与 6 行周数列，让索引法能算出真实日期
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(i === 25 ? el : { textContent: String((i % 31) + 1), querySelector: () => null });
  }
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(i === 3 ? el : { textContent: String(36 + i), querySelector: () => null });
  }
  const box = {
    querySelectorAll: (sel) => (sel === '.day' ? days : sel.indexOf('week') >= 0 ? weeks : { length: 1 }),
    querySelector: (sel) => {
      if (sel === '.year') return { textContent: '2026', querySelector: () => null };
      if (sel === '.month') return { textContent: '9月', querySelector: () => null };
      return null;
    },
  };
  let prevented = false;
  return {
    ev: {
      target: el,
      preventDefault: () => { prevented = true; },
      stopPropagation: () => {},
    },
    prevented: () => prevented,
  };
}

/**
 * 直接喂一个自定义容器（绕开 makeEv 那个「什么都命中」的盒子），
 * 用来模拟 Calendar 改版后某类选择器整体失效。
 */
async function runBox(box) {
  calls.length = 0;
  const plugin = makePlugin({});
  captured = null;
  cal.attachCalendarEnhance(plugin);
  const h = captured;
  if (!h) return;
  const ev = {
    target: {
      closest: (sel) => (sel === '#calendar-container' ? box : null),
      querySelector: () => null,
      getAttribute: () => null,
      textContent: '',
    },
    preventDefault: () => {},
    stopPropagation: () => {},
  };
  await h(ev);
}

/** dayN / weekN 分别是日期格与周列的个数，用来造「某类选择器失效」 */
function boxWith(dayN, weekN) {
  const mk = (n) => {
    const a = [];
    for (let i = 0; i < n; i++) a.push({ textContent: String(i + 1), querySelector: () => null });
    return a;
  };
  return {
    querySelectorAll: (sel) => {
      if (sel === '.day') return mk(dayN);
      if (sel.indexOf('week') >= 0) return mk(weekN);
      return { length: 1 };
    },
    querySelector: () => null,
  };
}

async function run(hit, nativeDayWeek) {
  calls.length = 0;
  const plugin = makePlugin({ nativeDayWeek });
  captured = null;
  cal.attachCalendarEnhance(plugin);
  const h = captured;
  if (!h) return { error: 'handler 未捕获' };
  const e = makeEv(hit);
  await h(e.ev);
  return { prevented: e.prevented(), calls: calls.slice() };
}

(async () => {
  console.log('\n[1] 分流关闭（默认）：日 / 周 / 月 / 年 全部由本插件接管');
  let r = await run('day', false);
  check('点日期 → 拦截并生成日记', r.prevented === true && r.calls[0] === 'daily', JSON.stringify(r));
  r = await run('week', false);
  check('点周数 → 拦截并生成周记', r.prevented === true && r.calls[0] === 'weekly', JSON.stringify(r));
  r = await run('year', false);
  check('点年份 → 生成年记', r.calls[0] === 'yearly', JSON.stringify(r));
  r = await run('month', false);
  check('点月份 → 生成月记', r.calls[0] === 'monthly', JSON.stringify(r));

  console.log('\n[2] 分流开启：日 / 周放行给 Calendar 原生');
  r = await run('day', true);
  check('点日期 → 不拦截（交回 Calendar）', r.prevented === false, JSON.stringify(r));
  check('点日期 → 本插件不生成笔记', r.calls.length === 0, JSON.stringify(r.calls));
  r = await run('week', true);
  check('点周数 → 不拦截（交回 Calendar）', r.prevented === false, JSON.stringify(r));
  check('点周数 → 本插件不生成笔记', r.calls.length === 0, JSON.stringify(r.calls));

  console.log('\n[3] 分流开启：月 / 年仍由本插件生成');
  r = await run('month', true);
  check('点月份 → 仍生成月记', r.calls[0] === 'monthly', JSON.stringify(r));
  r = await run('year', true);
  check('点年份 → 仍生成年记', r.calls[0] === 'yearly', JSON.stringify(r));

  console.log('\n[4] 默认值与设置项');
  check('DEFAULT_SETTINGS 含 nativeDayWeek',
    Object.prototype.hasOwnProperty.call(settings.DEFAULT_SETTINGS.calendar, 'nativeDayWeek'));
  check('默认关闭（保持全部接管的行为不变）',
    settings.DEFAULT_SETTINGS.calendar.nativeDayWeek === false);

  console.log('\n[5] 反证：放行时不得留下半截操作');
  const src = require('fs').readFileSync(SRC + 'calendar.js', 'utf8');
  const dayBlock = src.slice(src.indexOf("if (dayEl) {"), src.indexOf("if (dayEl) {") + 260);
  check('day 分支内先判 nativeDW 再取日期', dayBlock.indexOf('if (nativeDW) return;') < dayBlock.indexOf('dateOfCalendarDay'));
  check('nativeDW 取自设置而非局部变量', /const nativeDW = s\.nativeDayWeek === true;/.test(src));

  console.log('\n[6] 失效自检：日期格与周列分开判（周列 class 改版时不能静默失效）');
  check('周列选择器抽成常量 WEEK_NUM_SELECTOR', /const WEEK_NUM_SELECTOR = /.test(src));
  check('源码里周列选择器串只出现一次（就在常量定义里）',
    (src.match(/'\.week-num, \.weekNum, \.weeknum, \.week-number'/g) || []).length === 1,
    (src.match(/'\.week-num, \.weekNum, \.weeknum, \.week-number'/g) || []).length);
  check('常量被多处引用（点击 / 行号反查 / 自检）',
    (src.match(/WEEK_NUM_SELECTOR/g) || []).length >= 4,
    (src.match(/WEEK_NUM_SELECTOR/g) || []).length);
  check('周列自检用独立标志位（不复用 enhanceWarned）',
    /if \(!enhanceWeekWarned && box\.querySelectorAll\(WEEK_NUM_SELECTOR\)\.length === 0\)/.test(src));
  check('两个标志位各自声明', /let enhanceWarned = false;/.test(src) && /let enhanceWeekWarned = false;/.test(src));
  check('卸载时两个标志位一起复位', /enhanceWarned = false;[\s\S]{0,40}enhanceWeekWarned = false;/.test(src));
  check('周列自检包在 try 里（自检本身不许抛错）',
    /try \{[\s\S]{0,200}enhanceWeekWarned[\s\S]{0,400}console\.warn\('\[Time Tools\] Calendar 周列自检失败'/.test(src));

  console.log('\n[7] 失效自检行为：两条提示各自弹一次');
  unloadFns.forEach((f) => f());
  unloadFns.length = 0;
  notices.length = 0;

  await runBox(boxWith(42, 0)); // 日期格在、周列全没了
  check('.day 在、周列缺失 → 提示周列失效',
    notices.some((m) => m.indexOf('周列') >= 0 && m.indexOf('未能识别') >= 0), JSON.stringify(notices));
  check('周列缺失时不误报 .day 失效',
    !notices.some((m) => m.indexOf('.day') >= 0), JSON.stringify(notices));
  const n1 = notices.length;
  await runBox(boxWith(42, 0));
  check('重复点击只提示一次（标志位节流）', notices.length === n1, JSON.stringify(notices));

  notices.length = 0;
  unloadFns.forEach((f) => f()); // 复位两个标志位，否则周列那条已被上面用掉
  unloadFns.length = 0;
  await runBox(boxWith(0, 0)); // 两类都失效
  check('两类都失效 → .day 与周列各弹一次（证明标志位独立）',
    notices.some((m) => m.indexOf('.day') >= 0) && notices.some((m) => m.indexOf('周列') >= 0),
    JSON.stringify(notices));

  notices.length = 0;
  unloadFns.forEach((f) => f());
  unloadFns.length = 0;
  await runBox(boxWith(42, 0));
  check('卸载后重装 → 提示能再弹（标志位已复位）',
    notices.some((m) => m.indexOf('周列') >= 0), JSON.stringify(notices));

  console.log('\n' + (failures === 0 ? '✅ Calendar 日/周分流：全部通过' : '❌ 失败 ' + failures + ' 项'));
  process.exit(failures === 0 ? 0 : 1);
})();
