/*
 * 回归测试：周期笔记文件名的 ddd/dddd 跟随英文输出（v3.34.0 §1）
 *
 * 背景：buildFileName 不走 fmt()，而是直接调 moment().format()。
 * fmt() 里那段英文星期替换（WD_PH 占位，规避 moment 把 "Sat" 里的 a/t 当 token 吃掉）
 * 根本没被文件名路径用到，所以界面选英文后文件名仍是「周四」。
 *
 * 覆盖：
 *   1. 英文输出开启 → -Thu
 *   2. 英文输出关闭 / 默认（null）→ -周四（中文必须一字不变）
 *   3. 不传 settings → 与旧行为一致（防止老调用点退化）
 *   4. 不含星期 token 的格式串不受影响
 *   5. 不许出现 moment.locale( 的调用 —— 那是全局的，会污染 Obsidian 与其他插件
 */
const fs = require('fs');
const path = require('path');

const { buildFileName } = require('../src/note.js');

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) {
    pass += 1;
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    failures.push(name + (extra ? ' → ' + extra : ''));
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  }
}

// 2026-10-01 是星期四 → en[4] = 'Thu'
const D = new Date(2026, 9, 1, 10, 0, 0);
const FMT = 'YYYY-MM-DD-ddd';

const sOn = { timestamp: { englishOutput: true } };
const sOff = { timestamp: { englishOutput: false } };
const sNull = { timestamp: { englishOutput: null } };

console.log('文件名星期跟随英文输出:');

ok('英文输出开启 → 2026-10-01-Thu',
  buildFileName(D, FMT, 'daily', 1, sOn) === '2026-10-01-Thu',
  buildFileName(D, FMT, 'daily', 1, sOn));

ok('英文输出关闭 → 仍是 2026-10-01-周四',
  buildFileName(D, FMT, 'daily', 1, sOff) === '2026-10-01-周四',
  buildFileName(D, FMT, 'daily', 1, sOff));

ok('默认（null，中文界面）→ 仍是 2026-10-01-周四',
  buildFileName(D, FMT, 'daily', 1, sNull) === '2026-10-01-周四',
  buildFileName(D, FMT, 'daily', 1, sNull));

ok('不传 settings → 与旧行为一致（中文）',
  buildFileName(D, FMT, 'daily', 1) === '2026-10-01-周四',
  buildFileName(D, FMT, 'daily', 1));

ok('dddd 也跟随英文输出',
  buildFileName(D, 'YYYY-MM-DD-dddd', 'daily', 1, sOn) === '2026-10-01-Thu',
  buildFileName(D, 'YYYY-MM-DD-dddd', 'daily', 1, sOn));

ok('不含星期 token 的格式串不受影响',
  buildFileName(D, 'YYYY-MM-DD', 'daily', 1, sOn) === '2026-10-01',
  buildFileName(D, 'YYYY-MM-DD', 'daily', 1, sOn));

// mock 的 dddd 输出「星期周四」，真实 moment 是「星期四」——不写死具体值，
// 只断言「不含英文星期名」，避免把 mock 的实现细节当成契约
const d4Off = buildFileName(D, 'YYYY-MM-DD-dddd', 'daily', 1, sOff);
ok('英文输出关闭时 dddd 不含英文星期名', !/Thu|Thursday/.test(d4Off), d4Off);

// 全局 locale 是红线：会连带影响 Obsidian 自身与其他插件的日期渲染
const bad = [];
for (const f of fs.readdirSync(path.join(__dirname, '..', 'src'))) {
  if (!f.endsWith('.js')) continue;
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
  src.split('\n').forEach((ln, i) => {
    let code = ln.split('//')[0].replace(/\/\*.*?\*\//g, '');
    // 块注释内的行（以 * 开头）不算调用
    if (/^\s*\*/.test(code)) code = '';
    if (code.includes('moment.locale(')) bad.push(f + ':' + (i + 1));
  });
}
ok('源码内没有 moment.locale( 的调用（只许出现在注释里）', bad.length === 0, bad.join(','));

console.log('');
console.log('通过 ' + pass + ' / 失败 ' + fail);
if (fail) {
  console.log('失败项：' + failures.join('；'));
  process.exit(1);
}
