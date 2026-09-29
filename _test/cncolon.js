/*
 * 中文冒号时刻守卫（v3.30）
 * ------------------------------------------------------------------
 * 守的 bug：时钟正则只写英文半角冒号 `:`（U+003A），而中文输入法打出的是
 *           全角 `：`（U+FF1A）。同一文件 1559 行本来就是 `[:：]`，
 *           证明是逐处手写正则时漏掉，不是有意设计。
 *
 * 为什么必须写成断言（而不是"改完看一眼"）：
 *   ① 不只是解析失败 —— collectCandidates 根本挑不出这个片段，
 *      所以光标停在「12：45」上时**连转换菜单都不弹**，
 *      用户看到的是"没反应"，比算错更难发现。
 *   ② 改之前 50/50 全绿，改之后还是 50/50 全绿 ——
 *      现有测试对中文冒号**完全无感**。不新增断言的话，
 *      将来谁又把正则改回 `:`，测试照样假装没事。
 *
 * 反证方法（改动后必须验证）：
 *   把 TIME_ONLY_RE 改回 /^\d{1,2}:\d{2}(?::\d{2})?$/ → A 组必须报红，
 *   而 B 组（英文回归）不受影响。改回 `[:：]` 后恢复全绿。
 */

'use strict';

process.env.TZ = 'UTC';

const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const TS = path.join(SRC, 'timestamp.js');
const ta = require(TS);

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

/** 把解析结果格式化成 HH:mm:ss，null 显示为字符串 'null' */
function hhmmss(text) {
  const d = ta.parseToDate(text);
  return d ? ta.fmt(null, d, 'HH:mm:ss') : 'null';
}

console.log('\n[A] 中文冒号时刻能识别');
check('12：45 能解析', ta.parseToDate('12：45') !== null);
check('12：45：30 能解析', ta.parseToDate('12：45：30') !== null);
check('2026-09-19 12：45 能解析', ta.parseToDate('2026-09-19 12：45') !== null);
check('2026年9月19日 12：45 能解析', ta.parseToDate('2026年9月19日 12：45') !== null);
check('9月19日 12：45 能解析', ta.parseToDate('9月19日 12：45') !== null);

console.log('\n[B] 英文冒号回归（改中文不得改坏英文）');
check('12:45 仍可解析', ta.parseToDate('12:45') !== null);
check('12:45:30 仍可解析', ta.parseToDate('12:45:30') !== null);
check('2026-09-19 12:45 仍可解析', ta.parseToDate('2026-09-19 12:45') !== null);

console.log('\n[C] collectCandidates 能挑出片段');
const cnPick = ta.collectCandidates('会议 12：45 开始');
check('中文冒号片段被挑出', cnPick.some((x) => x.raw === '12：45'),
  JSON.stringify(cnPick));
const enPick = ta.collectCandidates('会议 12:45 开始');
check('英文冒号片段被挑出', enPick.some((x) => x.raw === '12:45'),
  JSON.stringify(enPick));
check('中英文挑出的位置一致', cnPick.length === 1 && enPick.length === 1
  && cnPick[0].index === enPick[0].index);

console.log('\n[D] 输出一律英文冒号（输入宽容、输出从严）');
/*
 * 现在的正确只是"格式串恰好都是英文"带来的，没有任何断言保护它。
 * 将来谁做中文界面时顺手把 HH:mm 改成 HH：mm，输出就静默变中文 ——
 * 而产出的文本要存进笔记、可能被别的工具再解析，必须规范统一。
 */
const out1 = hhmmss('12：45');
check('12：45 输出为英文冒号', !out1.includes('：') && out1.startsWith('12:45'), out1);
const out2 = hhmmss('12：45：30');
check('12：45：30 输出为英文冒号', !out2.includes('：'), out2);
const out3 = ta.fmt(null, ta.parseToDate('2026-09-19 12：45'), 'YYYY-MM-DD HH:mm:ss');
check('带日期的中文冒号输出也是英文冒号', !out3.includes('：') && out3 === '2026-09-19 12:45:00', out3);

console.log('\n[E] 源码自检（防止漏改 / 改回英文）');
const tsSrc = fs.readFileSync(TS, 'utf8');
const cnCount = (tsSrc.match(/\[:：\]/g) || []).length;
check('src/timestamp.js 里 [:：] 共 17 次出现', cnCount === 17, cnCount);
check('不存在英文-only 的旧 TIME_ONLY_RE',
  !/\/^\\d\{1,2\}:\\d\{2\}\(?::\\d\{2\}\)?\$\//.test(tsSrc));

console.log('\n' + (fail === 0 ? '全部通过 ✅' : fail + ' 项失败 ❌'));
console.log('套件: cncolon');
process.exit(fail === 0 ? 0 : 1);
