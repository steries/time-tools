/*
 * smoke 公共环境（stub + require + 断言器）
 *
 * smoke.js 拆成多个套件后，DOM/window stub 和 check() 不能各抄一份 ——
 * 抄了就会「改一处忘另一处」，两边 stub 行为不一致时故障极难排查。
 * 这里只做环境装配，不含任何断言，跑它自身不产生用例。
 *
 * 公共环境契约 —— 本文件对外承诺提供以下能力，其他套件依赖它们。
 * 新增能力必须登记在这里；删除能力必须先确认无人依赖。
 *
 *   global.window / global.document      DOM stub
 *   global.__modals / global.__notices   弹窗与提示收集
 *   global.__clipboard                   ★ 剪贴板（recorder.js 写入，quickadd.js 读取）
 *   global.navigator.clipboard.writeText 同上，写入侧走这个
 *   check(name, cond, actual)            断言器
 *   done()                               收尾，输出统计并设置退出码
 *
 * 依赖方见 ARCHITECTURE.md「测试环境与公共契约」一节。
 */
process.env.TZ = 'UTC';
const fs = require('fs');
const obsidian = require('obsidian');

global.setTimeout = global.setTimeout || ((fn) => fn());
global.window = {
  setInterval: () => 1,
  clearInterval: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1200,
  innerHeight: 800,
  AudioContext: null,
};
global.document = {
  body: new obsidian.MockEl('body'),
  createElement: (t) => new obsidian.MockEl(t),
};
global.__modals = [];
global.__notices = [];
global.__clipboard = '';
/*
 * Node 21+ 内置了 globalThis.navigator（只有 getter，没 setter），
 * 直接 `global.navigator = {...}` 在非严格模式下会【静默失败】——
 * 赋值不生效、也不报错，于是 navigator.clipboard 永远是 undefined，
 * recorder.js 的 `if (navigator.clipboard && ...)` 安静地跳过写入，
 * 表现为「剪贴板相关的 5 项全红」，看起来像功能坏了，其实是环境没装上。
 *
 * 实测：Node v20 无内置 navigator（赋值成功、全绿），
 *       Node v24 有只读 navigator（赋值失效、5 项红）。同一份代码两种结果。
 * 故必须走 defineProperty 强制覆盖，不能写成简单赋值。
 */
Object.defineProperty(global, 'navigator', {
  value: {
    clipboard: {
      writeText: async (t) => { global.__clipboard = t; },
    },
  },
  writable: true,
  configurable: true,
  enumerable: true,
});

const { migrateSettings, applyProfile } = require(__dirname + '/../src/settings.js');
const pomodoro = require(__dirname + '/../src/pomodoro.js');
const recorder = require(__dirname + '/../src/pomodoro.js');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  \u2713 ' + name);
  else {
    failures++;
    console.log('  \u2717 ' + name + (extra !== undefined ? '  \u2192 ' + extra : ''));
  }
}
function done(title) {
  console.log('\n' + (failures === 0 ? '\u5168\u90e8\u901a\u8fc7 \u2705' : failures + ' \u9879\u5931\u8d25 \u274c'));
  if (title) console.log('\u5957\u4ef6: ' + title);
  process.exit(failures === 0 ? 0 : 1);
}

module.exports = {
  fs, obsidian, migrateSettings, applyProfile, pomodoro, recorder, check, done,
  getFailures: () => failures,
};
