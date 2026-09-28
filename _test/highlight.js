/*
 * 日历高亮语义的端到端验证（v2.64）
 *
 * 背景：只存一个「日期」无法表达高亮该画在哪种元素上 ——
 * 周记对应整行 + 周数格，月记 / 年记对应标题。旧实现缺这个字段，
 * 于是打开周记时周列永远不亮、且按周首日切月导致视图乱蹦。
 *
 * 这里用 obsidian mock 真实走一遍 render() / syncActiveFile()，
 * 直接断言 DOM class，而不是只查源码字符串。
 */
const cal = require(__dirname + '/../src/calendar.js');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

function mkView(opts) {
  opts = opts || {};
  const settings = {
    calendar: {
      ownCalendarEnabled: true, enhanceCalendarEnabled: false, allowBoth: false,
      fixedCellSize: true, dotsEnabled: false, wordsPerDot: 250, weekStart: 'monday',
    },
    notes: {
      weekly: { format: 'gggg-[W]ww' }, daily: { format: 'YYYY-MM-DD' },
      monthly: { format: 'YYYY-MM月记' }, yearly: { format: 'YYYY年记' },
    },
  };
  const v = new cal.CalendarNoteView({ detach() {} }, { settings, app: {} });
  v.app = {
    vault: { getAbstractFileByPath: () => null, getFiles: () => [] },
    workspace: { getActiveFile: () => null },
  };
  v.year = opts.year === undefined ? 2026 : opts.year;
  v.month = opts.month === undefined ? 8 : opts.month;
  v.picked = opts.picked || null;
  v.selKind = opts.selKind || null;
  return v;
}

/** 渲染并汇总各类高亮的落点 */
function scan(v) {
  v.render();
  const grid = v.contentEl.children.find((c) => c.classList.has('tt-cal-grid'));
  const wk = [], pickedDay = [], weekRow = [], today = [];
  (grid ? grid.children : []).forEach((c) => {
    if (c.classList.has('tt-cal-wk')) wk.push(c);
    if (c.classList.has('tt-cal-day')) {
      if (c.classList.has('is-picked')) pickedDay.push(c.text);
      if (c.classList.has('is-week-row')) weekRow.push(c.text);
      if (c.classList.has('is-today')) today.push(c.text);
    }
  });
  const head = v.contentEl.children.find((c) => c.classList.has('tt-cal-head'));
  const flat = [];
  (function walk(e) { flat.push(e); (e.children || []).forEach(walk); })(head || new (require('obsidian').MockEl)('div'));
  const has = (cls) => flat.some((e) => e.classList.has(cls) && e.classList.has('is-picked'));
  return {
    wkPicked: wk.filter((c) => c.classList.has('is-picked')).map((c) => c.text),
    wkAll: wk.map((c) => c.text),
    pickedDay, weekRow, today,
    monthPicked: has('tt-cal-month'),
    yearPicked: has('tt-cal-year'),
  };
}

console.log('[highlight] 日历高亮语义');

// ① 打开周记：周数格全填充 + 整行弱高亮，且没有日期格被全填充
{
  const v = mkView({ picked: new Date(2026, 8, 14), selKind: 'week' });
  const r = scan(v);
  check('周数格高亮落在 38', r.wkPicked.length === 1 && r.wkPicked[0] === '38', r.wkPicked.join(','));
  check('整行 7 天弱高亮（14–20）', r.weekRow.join(',') === '14,15,16,17,18,19,20', r.weekRow.join(','));
  check('周记不占用日期格的全填充', r.pickedDay.length === 0, r.pickedDay.join(','));
}

// ② 打开日记：只有那天全填充
{
  const v = mkView({ picked: new Date(2026, 8, 22), selKind: 'day' });
  const r = scan(v);
  check('日记全填充落在 22', r.pickedDay.length === 1 && r.pickedDay[0] === '22', r.pickedDay.join(','));
  check('日记不产生整行弱高亮', r.weekRow.length === 0);
  check('日记不高亮周数格', r.wkPicked.length === 0);
}

// ③ 月记 / 年记高亮标题，不动日期格
{
  const vm = mkView({ picked: new Date(2026, 8, 1), selKind: 'month' });
  const rm = scan(vm);
  check('月记高亮月份标题', rm.monthPicked === true);
  check('月记不高亮年份标题', rm.yearPicked === false);
  check('月记不动日期格', rm.pickedDay.length === 0 && rm.weekRow.length === 0);

  const vy = mkView({ picked: new Date(2026, 0, 1), selKind: 'year' });
  const ry = scan(vy);
  check('年记高亮年份标题', ry.yearPicked === true);
  check('年记不高亮月份标题', ry.monthPicked === false);
}

// ④ 切月策略：跨月周 / 年记都不该把视图拽走（旧实现乱蹦的根因）
{
  const v = mkView({});
  v.app.workspace.getActiveFile = () => ({ basename: '2026-W36', name: '2026-W36.md' });
  v.syncActiveFile();
  check('打开跨月周记仍留在 9 月', v.year === 2026 && v.month === 8, v.year + '-' + (v.month + 1));
  check('跨月周记的 kind 为 week', v.selKind === 'week', v.selKind);
  const r = scan(v);
  check('跨月周高亮 36 且整行含上下月日期',
    r.wkPicked.join(',') === '36' && r.weekRow.join(',') === '31,1,2,3,4,5,6', r.weekRow.join(','));

  const vy = mkView({});
  vy.app.workspace.getActiveFile = () => ({ basename: '2026年记', name: '2026年记.md' });
  vy.syncActiveFile();
  check('打开年记不跳到 1 月', vy.year === 2026 && vy.month === 8, vy.year + '-' + (vy.month + 1));
}

// ⑤ 切到普通笔记必须清空
{
  const v = mkView({ picked: new Date(2026, 8, 14), selKind: 'week' });
  v.app.workspace.getActiveFile = () => ({ basename: '2026 年度总结', name: 'x.md' });
  const changed = v.syncActiveFile();
  check('普通笔记触发重绘并清空', changed === true && v.picked === null && v.selKind === null);
  const r = scan(v);
  check('清空后无残留高亮',
    r.wkPicked.length === 0 && r.pickedDay.length === 0 && r.weekRow.length === 0);
}

// ⑥ 今天只描边，不参与全填充
{
  const v = mkView({});
  const r = scan(v);
  check('只有今天带 is-today', r.today.join(',') === String(new Date().getDate()), r.today.join(','));
  check('无选中时不产生任何全填充', r.pickedDay.length === 0 && r.wkPicked.length === 0);
}

console.log('\n' + (failures === 0 ? '全部通过 ✅' : failures + ' 项失败 ❌'));
process.exit(failures === 0 ? 0 : 1);
