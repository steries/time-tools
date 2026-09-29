/*
 * smoke 公共环境（stub + require + 断言器）
 *
 * smoke.js 拆成多个套件后，DOM/window stub 和 check() 不能各抄一份 ——
 * 抄了就会「改一处忘另一处」，两边 stub 行为不一致时故障极难排查。
 * 这里只做环境装配，不含任何断言，跑它自身不产生用例。
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
global.navigator = {
  clipboard: {
    writeText: async (t) => { global.__clipboard = t; },
  },
};

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
