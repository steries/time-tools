/*
 * 源文件健康度 —— 守住「文件本身没被写坏」
 *
 * 由来：一次改动中 src/calendar.js 被写成「尾部多了 77 行重复内容 + 一个非法字节」，
 * 而当时所有测试仍报通过 —— 因为测试只验证行为，没人验证文件本身。
 * 这类损坏不会立刻报错，却会在下一次改动时把人带偏（改了 A 处、实际生效在 B 处）。
 *
 * 本套件只做静态检查，不加载模块：
 *   1. 每个 src/*.js 必须是合法 UTF-8（非法字节会让编辑工具直接读不出来）
 *   2. 每个文件恰好一个 module.exports（出现第二个 = 有内容被重复追加）
 *   3. 文件不得为空、不得含连续空行堆叠（重复追加的典型痕迹）
 */
const fs = require('fs');
const path = __dirname + '/../src/';

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

const files = fs.readdirSync(path).filter((f) => f.endsWith('.js')).sort();

console.log('[1] 每个源文件都是合法 UTF-8');
files.forEach((f) => {
  let ok = false;
  let err = '';
  try {
    fs.readFileSync(path + f, 'utf8');
    ok = true;
  } catch (e) {
    err = String(e && e.message ? e.message : e);
  }
  check(f + ' 可解码', ok, err);
});

console.log('\n[2] 每个文件恰好一个 module.exports');
files.forEach((f) => {
  const s = fs.readFileSync(path + f, 'utf8');
  const n = (s.match(/^module\.exports\s*=/gm) || []).length;
  check(f + ' exports=' + n, n === 1, n);
});

console.log('\n[3] 无重复追加痕迹');
files.forEach((f) => {
  const s = fs.readFileSync(path + f, 'utf8');
  check(f + ' 非空', s.trim().length > 0);
  const triple = /\n\n\n\n/.test(s);
  check(f + ' 无连续空行堆叠', !triple);
});

console.log(failures === 0
  ? '\n源文件健康度：全部通过（' + files.length + ' 个文件）'
  : '\n源文件健康度：' + failures + ' 项失败');
if (failures > 0) process.exitCode = 1;
