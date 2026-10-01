/*
 * 月末 / 闰日推进守卫（v3.31）
 * ------------------------------------------------------------------
 * 历史 bug：shiftByUnit 里直接 setMonth / setFullYear，没有月末钳制，
 * JS 会**静默进位到次月**：
 *
 *   2026-01-31「一个月后」→ 2026-03-03（跨过了整个二月）
 *   2026-03-31「一个月前」→ 2026-03-03（往回推，日期反而**前进**了）
 *   2024-02-29「一年后」  → 2025-03-01（次年没有 29 号）
 *
 * 讽刺的是函数上方注释写着「按日历推进，避免 30 天近似在月末出错」——
 * 意图完全正确，实现恰恰在月末出错。这类"注释与实现矛盾"最难靠读代码发现，
 * 所以这里用**边界日期逐个钉死**。
 *
 * 断言刻意不写死绝对日期，而是"给定基准日 + 表达式"的端到端结果。
 */

'use strict';

const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ts = require(path.join(SRC, 'timestamp.js'));
const s = require(path.join(SRC, 'settings.js'));

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

const P = { settings: JSON.parse(JSON.stringify(s.DEFAULT_SETTINGS)) };

const f = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
  String(d.getDate()).padStart(2, '0');

/** 给定基准日解析一个表达式 */
function at(baseStr, expr) {
  const [y, m, dd] = baseStr.split('-').map(Number);
  const base = new Date(y, m - 1, dd, 10, 0, 0);
  const d = ts.resolveToDate(P, expr, { base });
  return d && !isNaN(d.getTime()) ? f(d) : 'null';
}
const is = (baseStr, expr, want) =>
  check(baseStr + ' 「' + expr + '」→ ' + want, at(baseStr, expr) === want, at(baseStr, expr));

console.log('[MONTHSHIFT] 月末 / 闰日推进');

/* ── A 组 · 月末加月（不得进位到次月） ───────────────────────── */
is('2026-01-31', '一个月后', '2026-02-28');
is('2026-08-31', '一个月后', '2026-09-30');
is('2026-10-31', '一个月后', '2026-11-30');

/* ── B 组 · 月末减月（日期不得前进） ─────────────────────────── */
is('2026-03-31', '一个月前', '2026-02-28');
is('2026-05-31', '一个月前', '2026-04-30');
is('2026-07-31', '一个月前', '2026-06-30');

/* ── C 组 · 闰日 ─────────────────────────────────────────────── */
is('2024-02-29', '一年后', '2025-02-28');
is('2024-02-29', '一个月后', '2024-03-29');

/* ── D 组 · 回归：非月末不得被改坏 ────────────────────────────── */
is('2026-09-15', '一个月后', '2026-10-15');
is('2026-09-15', '一个月前', '2026-08-15');
is('2026-09-15', '一年后', '2027-09-15');
is('2026-09-30', '一天后', '2026-10-01');
is('2026-09-30', '一周后', '2026-10-07');

/* ── E 组 · 2 月闰年最后一天 ─────────────────────────────────── */
is('2028-01-31', '一个月后', '2028-02-29'); // 2028 是闰年，应钳到 29 而非 28

console.log('\n  通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
