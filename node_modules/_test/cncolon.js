/*
 * 中文冒号时刻守卫（v3.30）
 * ------------------------------------------------------------------
 * 目的：把「中文输入法下打出 12：45 完全没反应」从「用户发现」变成「测试会红」。
 *
 * 根因：时钟正则里只写了英文冒号 :(U+003A)，而中文输入法打出来的是
 *       全角 ：(U+FF1A) —— 两个不同字符，正则不匹配。
 *       同一文件 1559 行本来就是 [:：]，证明这是逐处手写时漏掉，不是设计。
 *
 * 最容易被忽略的一点：它不只是「解析失败」—— collectCandidates 根本
 * 挑不出这个片段，所以光标停在 12：45 上时连转换菜单都不弹。
 * 用户感知是"完全没反应"，比算错更难发现。
 *
 * 本套件同时守「输入宽容、输出从严」：
 *   输入  中文冒号、英文冒号都收
 *   输出  一律英文冒号（现在的正确是格式串恰好都是英文带来的，
 *         没有断言保护它 —— 将来谁把 HH:mm 改成 HH：mm 就会静默退化）
 */

'use strict';

const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ts = require(path.join(SRC, 'timestamp.js'));

const PLUGIN = {
  settings: { timestamp: { format: 'YYYY-MM-DD HH:mm:ss', extensions: {} } },
};

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

/** 解析成功且时分符合预期 */
function parsed(text, h, mi) {
  const d = ts.parseToDate(text);
  if (!d || isNaN(d.getTime())) return false;
  return d.getHours() === h && d.getMinutes() === mi;
}
function show(text) {
  const d = ts.parseToDate(text);
  return d && !isNaN(d.getTime()) ? d.getHours() + ':' + d.getMinutes() : 'null';
}

console.log('中文冒号时刻（cncolon）');

// ── A 组 · 中文冒号能识别（4 项）────────────────────────────────
check("parseToDate('12：45') 返回 12:45", parsed('12：45', 12, 45), show('12：45'));
check("parseToDate('12：45：30') 返回 12:45", parsed('12：45：30', 12, 45), show('12：45：30'));
check("parseToDate('2026-09-19 12：45') 日期+中文冒号时刻", parsed('2026-09-19 12：45', 12, 45), show('2026-09-19 12：45'));
check("parseToDate('9月19日 12：45') 中文月日+中文冒号时刻", parsed('9月19日 12：45', 12, 45), show('9月19日 12：45'));

// ── B 组 · 英文冒号回归，不许被改坏（4 项）──────────────────────
check("parseToDate('12:45') 仍正常", parsed('12:45', 12, 45), show('12:45'));
check("parseToDate('12:45:30') 仍正常", parsed('12:45:30', 12, 45), show('12:45:30'));
check("parseToDate('2026-09-19 12:45') 仍正常", parsed('2026-09-19 12:45', 12, 45), show('2026-09-19 12:45'));
check("parseToDate('2026年9月19日 12:45') 仍正常", parsed('2026年9月19日 12:45', 12, 45), show('2026年9月19日 12:45'));

// ── C 组 · 探测函数（3 项）───────────────────────────────────────
check("hasClock('12：45') 为 true", ts.hasClock('12：45') === true);
check("hasClock('12：45：30') 为 true", ts.hasClock('12：45：30') === true);
check("hasSeconds('12：45：30') 为 true", ts.hasSeconds('12：45：30') === true);

// ── D 组 · 行内挑选（2 项）───────────────────────────────────────
const cands = ts.collectCandidates('会议 12：45 开始，另一场 12:15 结束').map((x) => x.raw);
check("collectCandidates 能挑出 '12：45'", cands.includes('12：45'), JSON.stringify(cands));
check(
  '同一句里中英文冒号两条都能挑出',
  cands.includes('12：45') && cands.includes('12:15'),
  JSON.stringify(cands)
);

// ── E 组 · 输出必须是英文冒号（3 项）─────────────────────────────
function unify(text) {
  return String(ts.compute(PLUGIN, 'unify', text, {}));
}
['12：45', '12：45：30', '2026-09-19 12：45'].forEach((t) => {
  const out = unify(t);
  check("输入 '" + t + "' 输出不含中文冒号", !out.includes('：'), out);
});

console.log('通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
