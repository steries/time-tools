/*
 * 倒计时 / 日期差值 专项测试
 * ------------------------------------------------------------------
 * 覆盖：
 *   1. diffDays 自然日差（UTC 折算，避开夏令时）
 *   2. 倒计时三个分支（未来/过去/当天）
 *   3. parseDateRange 从文本里抠两个日期（含自带分隔符的日期）
 *   4. 工作日计算（只扣周末）
 *   5. dateDiffWorkdays 开关两态
 */
'use strict';

const path = require('path');
const Module = require('module');
const SRC = __dirname + '/../src';

const obsidian = {
  moment: () => { throw new Error('no moment'); },
  Notice: class {}, ItemView: class {}, Plugin: class {}, EditorSuggest: class {},
  PluginSettingTab: class {}, Setting: class {}, Modal: class {}, setIcon() {}, Platform: {},
};
const oR = Module._resolveFilename;
const oL = Module._load;
Module._resolveFilename = (r, ...a) => (r === 'obsidian' ? 'obsidian' : oR(r, ...a));
Module._load = (r, ...a) => (r === 'obsidian' ? obsidian : oL(r, ...a));

const ts = require(path.join(SRC, 'timestamp.js'));
const settings = require(path.join(SRC, 'settings.js'));

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra === undefined ? '' : '  → ' + extra)); }
}

/** 造一个最小 plugin，只为让 compute 读到 settings */
function mkPlugin(overrides) {
  const s = JSON.parse(JSON.stringify(settings.DEFAULT_SETTINGS));
  s.timestamp.extensions = Object.assign({}, s.timestamp.extensions, overrides || {});
  return { settings: s };
}

/* ---------- 1. 倒计时（单日期 → 天数） ---------- */
console.log('[1] 倒计时');
{
  const base = new Date(2026, 8, 20); // 2026-09-20
  const p = mkPlugin({ countdown: true });

  const r1 = ts.compute(p, 'countdown', '2026-10-01', { base });
  check('未来日期 → 还有 11 天', r1 === '还有 11 天', r1);

  const r2 = ts.compute(p, 'countdown', '2026-09-10', { base });
  check('过去日期 → 已过去 10 天', r2 === '已过去 10 天', r2);

  const r3 = ts.compute(p, 'countdown', '2026-09-20', { base });
  check('当天 → 就是今天', r3 === '就是今天', r3);

  const r4 = ts.compute(p, 'countdown', '2027-09-20', { base });
  check('跨年 → 还有 365 天', r4 === '还有 365 天', r4);
}

/* ---------- 2. 日期差值 ---------- */
console.log('[2] 日期差值');
{
  const p = mkPlugin({ dateDiff: true });
  const r = ts.compute(p, 'dateDiff', '2026-01-01 到 2026-03-01');
  check('默认只给自然日', r === '相差 59 天', r);

  const p2 = mkPlugin({ dateDiff: true, dateDiffWorkdays: true });
  const r2 = ts.compute(p2, 'dateDiff', '2026-01-01 到 2026-03-01');
  check('开工时带工作日', /^相差 59 天（工作日 \d+ 天）$/.test(r2 || ''), r2);

  const r3 = ts.compute(p, 'dateDiff', '这段文字没有日期');
  check('无日期返回 null', r3 === null, r3);

  const r4 = ts.compute(p, 'dateDiff', '只有一个 2026-01-01');
  check('只有一个日期返回 null', r4 === null, r4);
}

/* ---------- 3. 工作日只扣周末 ---------- */
console.log('[3] 工作日');
{
  const p = mkPlugin({ dateDiff: true, dateDiffWorkdays: true });
  // 2026-09-21(一) 到 2026-09-27(日)：相差 6 天（22二~27日），工作日 4
  const r = ts.compute(p, 'dateDiff', '2026-09-21 到 2026-09-27');
  check('工作日与天数同口径（不含首日）', r === '相差 6 天（工作日 4 天）', r);
}

/* ---------- 4. 顺序无关（to < from 自动换序） ---------- */
console.log('[4] 顺序无关');
{
  const p = mkPlugin({ dateDiff: true });
  const a = ts.compute(p, 'dateDiff', '2026-03-01 到 2026-01-01');
  const b = ts.compute(p, 'dateDiff', '2026-01-01 到 2026-03-01');
  check('反序结果一致', a === b && a === '相差 59 天', `${a} / ${b}`);
}

console.log('\n倒计时/日期差值：' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
