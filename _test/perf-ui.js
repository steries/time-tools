/*
 * 量化浮窗 update() 的 DOM 写入次数
 * 模拟跑满一段 25 分钟专注，统计实际写入与「值未变却仍写入」的冗余
 */
const obsidian = require('obsidian');

// 最小 document mock：浮窗用 document.createElement 建根节点
global.document = {
  createElement: () => {
    const el = new obsidian.MockEl('div');
    el.classList = { add: () => {}, remove: () => {}, toggle: () => {} };
    el.setAttr = (k, v) => { el[k] = v; return el; };
    el.setAttribute = (k, v) => { el[k] = v; return el; };
    el.dataset = {};
    el.remove = () => {};
    el.querySelectorAll = () => [];
    el.addEventListener = () => {};
    el.toggleClass = () => {};
    el.addClass = () => {};
    el.removeClass = () => {};
    el.hasClass = () => false;
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 260, height: 300 });
    el.onclick = null;
    return el;
  },
  body: { appendChild: () => {} },
};

// 统计 setText 调用
let writes = 0, redundant = 0;
const origSetText = obsidian.MockEl.prototype.setText;
obsidian.MockEl.prototype.setText = function (t) {
  writes++;
  if (this.text === String(t)) redundant++;
  return origSetText.call(this, t);
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1440,
  innerHeight: 900,
  setInterval: () => 1,
  clearInterval: () => {},
};

global.__notices = [];
global.__modals = [];

const path = __dirname + '/../src/';
const pomodoro = require(path + 'pomodoro.js');
const { migrateSettings } = require(path + 'settings.js');

const plugin = {
  settings: migrateSettings(null),
  app: { workspace: { getLeavesOfType: () => [], on: () => ({}) } },
  commands: [],
  addCommand: () => {},
  registerView: () => {},
  registerInterval: () => {},
  saveSettings: async () => {},
  redrawSettingsTab: () => {},
  addStatusBarItem: () => new obsidian.MockEl('div'),
};

const c = new pomodoro.PomodoroController(plugin);
plugin.pomodoro = c;
c.init();
c.startSession(null, 'study');

// 模拟 25 分钟：每 250ms 一次 tick
const ticksPerMinute = 240;
const minutes = 25;
console.log('模拟 25 分钟专注（tick 250ms）:\n');
writes = 0; redundant = 0;
for (let i = 0; i < ticksPerMinute * minutes; i++) c.tick();

console.log('  tick 次数        :', ticksPerMinute * minutes);
console.log('  setText 写入次数 :', writes);
console.log('  其中值未变仍写入 :', redundant);
console.log();

// ---- 场景二：时间真实流逝（每 tick 前进 250ms）----
// 这才是真实使用情况：秒数每 4 次 tick 变一次
c.startSession(null, 'study');
writes = 0; redundant = 0;
const total2 = ticksPerMinute * minutes;
for (let i = 0; i < total2; i++) {
  c.endsAt -= 250; // 时间前进
  if (c.state !== 'focus') break; // 只统计专注段内
  c.tick();
}
console.log('场景二：时间真实流逝（模拟真实使用）');
console.log('  tick 次数        :', total2);
console.log('  setText 写入次数 :', writes);
console.log('  换算每次 tick    :', (writes / total2).toFixed(2), '次写入');
console.log('  （未优化时应为   : 8.00 次写入/tick，共 ' + total2 * 8 + '）');
console.log('  节省             :', ((1 - writes / (total2 * 8)) * 100).toFixed(1) + '%');
