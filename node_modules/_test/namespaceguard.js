/*
 * 配置命名空间守门（C2 的廉价替代）
 * ------------------------------------------------------------------
 * 调研结论（v3.6.0 实测）：
 *   - 各模块几乎只读自己的命名空间，跨模块写入实测 0 处；
 *   - 不存在「整体替换子对象」的高危写法；
 *   - 跨模块读取仅 3 处且都是合理依赖（timestamp→calendar、recorder→pomodoro、
 *     timejudge→timestamp）。
 * 因此彻底做「每个模块发只读副本」收益≈0，代价却很大（模块要保存自己的设置，
 * 如番茄钟 profiles，副本会让保存失效，还得再加一套写回机制）。
 *
 * 真正要防的是「以后有人图省事写 settings.X = {} 一把抹掉整个模块」，
 * 本套件把这条不变量固化成「测试会红」。
 *
 * 判定方式：只匹配 settings 对象（含 plugin.settings / this.settings）上的整体替换。
 * 为什么不用宽模式 \.pomodoro\s*= ：plugin.pomodoro = ctrl 是把控制器挂到插件
 * 实例上，跟配置无关，宽模式会误伤它（第一版就是这样误报的）。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const SRC = __dirname + '/../src';
const NS = ['timestamp', 'pomodoro', 'calendar', 'notes', 'record'];

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

console.log('配置命名空间守门');

// 1. 不允许整体替换某个配置命名空间
const REPLACE_RE = /settings\s*\.\s*(timestamp|pomodoro|calendar|notes|record)\s*=[^=]/;
const hits = [];
fs.readdirSync(SRC)
  .filter((f) => f.endsWith('.js'))
  .forEach((f) => {
    fs.readFileSync(path.join(SRC, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        const m = line.match(REPLACE_RE);
        if (m) hits.push(`${f}:${i + 1} ${m[0].trim()}`);
      });
  });
check('不存在 settings.X 整体替换（会一把抹掉该模块全部配置）', hits.length === 0, hits.join(' | '));

// 2. DEFAULT_SETTINGS 必须含全部命名空间，且是对象
const settingsSrc = fs.readFileSync(path.join(SRC, 'settings.js'), 'utf8');
NS.forEach((ns) => {
  check(`DEFAULT_SETTINGS 含 ${ns}`, new RegExp(`^  ${ns}: \\{`, 'm').test(settingsSrc));
});

console.log(`\n通过 ${pass} 失败 ${fail}`);
process.exit(fail ? 1 : 0);
