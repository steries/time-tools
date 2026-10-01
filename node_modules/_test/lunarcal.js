/*
 * 日历农历模式专项测试
 * ------------------------------------------------------------------
 * 覆盖：
 *   1. 农历模式下日期格显示农历文字，且不画圆点
 *   2. 初一显示月名（如「八月」），其余显示农历日（如「十九」）
 *   3. 有笔记时农历带 has-note（渲染成旁一个小点）
 *   4. 与圆点互斥：开农历后不再读字数（省 IO）
 *   5. 关农历时回归圆点行为
 */
'use strict';

const cal = require(__dirname + '/../src/calendar.js');

let fail = 0;
let pass = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra === undefined ? '' : '  → ' + extra)); }
}

/** 造视图；hasNote 控制「某天是否存在日记」 */
function mkView(opts) {
  opts = opts || {};
  const settings = {
    calendar: {
      ownCalendarEnabled: true, enhanceCalendarEnabled: false, allowBoth: false,
      fixedCellSize: true, dotsEnabled: true, wordsPerDot: 250, weekStart: 'monday',
      lunarOnCalendar: opts.lunar !== false,
    },
    notes: {
      weekly: { format: 'gggg-[W]ww' }, daily: { format: 'YYYY-MM-DD' },
      monthly: { format: 'YYYY-MM月记' }, yearly: { format: 'YYYY年记' },
    },
  };
  const v = new cal.CalendarNoteView({ detach() {} }, { settings, app: {} });
  v.app = {
    vault: { getAbstractFileByPath: () => (opts.hasNote ? { path: 'x.md' } : null), getFiles: () => [] },
    workspace: { getActiveFile: () => null },
  };
  v.year = opts.year === undefined ? 2026 : opts.year;
  v.month = opts.month === undefined ? 8 : opts.month;
  v.picked = null;
  v.selKind = null;
  return v;
}

function daysOf(v) {
  v.render();
  const grid = v.contentEl.children.find((c) => c.classList.has('tt-cal-grid'));
  return (grid ? grid.children : []).filter((c) => c.classList.has('tt-cal-day'));
}

/* ---------- 1. 农历模式渲染 ---------- */
console.log('[1] 农历模式');
{
  const v = mkView({ hasNote: true });
  const days = daysOf(v);
  check('渲染出 42 个日期格', days.length === 42, days.length);

  const lun = [];
  days.forEach((d) => {
    (d.children || []).forEach((c) => { if (c.classList.has('tt-cal-lunar')) lun.push(c); });
  });
  check('每格都有农历元素', lun.length === 42, lun.length);
  check('农历文字非空', lun.every((l) => String(l.text || '').length > 0),
    lun.slice(0, 3).map((l) => l.text).join('|'));

  const dots = [];
  (function walk(e) { if (e.classList && e.classList.has('tt-cal-dot')) dots.push(e); (e.children || []).forEach(walk); })(v.contentEl);
  check('农历模式下不画圆点（互斥）', dots.length === 0, dots.length);

  check('有笔记时农历带 has-note', lun.every((l) => l.classList.has('has-note')));
}

/* ---------- 2. 无笔记时没有 has-note ---------- */
console.log('[2] 无笔记');
{
  const v = mkView({ hasNote: false });
  const days = daysOf(v);
  const lun = [];
  days.forEach((d) => {
    (d.children || []).forEach((c) => { if (c.classList.has('tt-cal-lunar')) lun.push(c); });
  });
  check('无笔记时农历不带 has-note', lun.every((l) => !l.classList.has('has-note')));
}

/* ---------- 3. 初一显示月名 ---------- */
console.log('[3] 初一显示月名');
{
  // 2026-09-20 是农历八月初几？用模块自算，避免硬编码错误
  const ts = require(__dirname + '/../src/timestamp.js');
  const info = ts.lunar.solarToLunar(2026, 9, 20);
  check('2026-09-20 能转出农历', !!info, JSON.stringify(info));

  // 找该年农历八月初一对应的阳历，验证那天显示月名
  let found = null;
  for (let day = 1; day <= 30 && !found; day++) {
    const d = ts.lunar.lunarToSolar(2026, 8, day, false);
    if (d) found = { solar: d, day };
  }
  // 取初一
  const chuyi = ts.lunar.lunarToSolar(2026, 8, 1, false);
  check('能算出农历八月初一的阳历日期', !!chuyi, chuyi && chuyi.toISOString());

  const v = mkView({ year: chuyi.getFullYear(), month: chuyi.getMonth(), hasNote: false });
  const days = daysOf(v);
  const target = days.find((c) => c.text === String(chuyi.getDate())
    && !c.classList.has('is-outside'));
  check('定位到初一那天', !!target, target && target.text);
  if (target) {
    const l = (target.children || []).find((c) => c.classList.has('tt-cal-lunar'));
    check('初一显示月名「八月」而非「初一」', l && l.text === '八月', l && l.text);
  }
}

/* ---------- 4. 关闭农历 → 回归圆点 ---------- */
console.log('[4] 关闭农历');
{
  const v = mkView({ lunar: false, hasNote: true });
  const days = daysOf(v);
  const lun = [];
  days.forEach((d) => {
    (d.children || []).forEach((c) => { if (c.classList.has('tt-cal-lunar')) lun.push(c); });
  });
  check('关农历后不再渲染农历元素', lun.length === 0, lun.length);
  const dots = [];
  (function walk(e) { if (e.classList && e.classList.has('tt-cal-dot')) dots.push(e); (e.children || []).forEach(walk); })(v.contentEl);
  check('关农历后恢复圆点', dots.length > 0, dots.length);
}

console.log('\n日历农历：' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
