/*
 * 人工测试文档里「沙盒可验」的那部分预期
 * ------------------------------------------------------------------
 * 起因：把《测试文档》第二部分的「预期」列逐条对回代码时，发现有四条
 *       **没有任何套件守着**（grep 全 _test/ 命中数为 0）：
 *
 *   E4  正计时超过一小时要显示 1:05:30，不能是 65:30  —— hmmss 无任何测试
 *   D3  专注中点「跳过」，该段不计入轮次              —— rounds/completedRounds 无测试
 *   E10 正计时下跳过照记时长（与倒计时不同，是刻意的）  —— 只有 countup 里间接碰到
 *   A12 非法日期 2026-02-30 要拒绝，不给错误结果
 *
 * 这四条都是「改坏了测试照样全绿」的典型，所以单独建一个套件盯住。
 * 测的是**产物**（time-tools/main.js），不是 src —— src 绿不代表产物能用。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const DIST = ROOT;
const SRC = path.join(DIST, 'src');

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) {
    pass += 1;
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    failures.push(name + (extra !== undefined ? ' → ' + extra : ''));
    console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : ''));
  }
}

/* ---------------- 加载产物 ---------------- */
const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

const notices = [];
global.__modals = []; // AskLongBreakModal.open() 要 push，缺了会崩而非红
const obsidian = Object.create(realObsidian);
obsidian.Notice = function (msg) { notices.push(String(msg)); };

global.document = Object.assign({}, global.document, {
  createElement: (tag) => new realObsidian.MockEl(tag),
  body: { appendChild() {} },
});
global.window = Object.assign({}, global.window, {
  addEventListener() {},
  removeEventListener() {},
  setInterval: () => 0,
  clearInterval: () => {},
  innerWidth: 1200,
  innerHeight: 900,
});

const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'obsidian') return obsidian;
  return origLoad.call(this, request, ...rest);
};
const code = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
Module._load = origLoad;

const POMO = mod.exports.__testRecord;
const PomodoroController = POMO.PomodoroController;

console.log('\n人工测试文档 · 沙盒可验部分\n');

ok('产物可拿到 PomodoroController', typeof PomodoroController === 'function');
if (typeof PomodoroController !== 'function') {
  console.log('\n无法继续：产物未暴露 PomodoroController\n');
  process.exit(1);
}

/** 造一个不碰界面的控制器 */
function makeCtrl(overrides) {
  const pomodoro = Object.assign(
    {
      profiles: [{ id: 'study', name: '学习', focusMin: 25, shortBreakMin: 5, longBreakMin: 15 }],
      activeProfileId: 'study',
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      longBreakInterval: 4,
      autoStartNext: true,
      notifyOnSegmentEnd: false,
      pauseThreshold: 3,
    },
    overrides || {}
  );
  const plugin = {
    settings: { pomodoro, record: { enabled: false } },
    app: { workspace: { getLeavesOfType: () => [] } },
    saveSettings: async () => {},
    addStatusBarItem: () => ({}),
    registerInterval: () => {},
  };
  const c = new PomodoroController(plugin);
  c.playSound = () => {};
  c.refreshUI = () => {};
  return c;
}

/* ------------- E4：hour 位（hmmss 此前无任何测试） ------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);

  // 直接把已过时长顶到目标值：改 countUpStartAt 比等真定时器快
  const setElapsed = (ms) => {
    c.countUpBaseMs = ms;
    c.countUpStartAt = Date.now();
  };

  // 冻结时间：否则设置与断言之间只要跨过 1 秒（跑全量时机器负载高就会发生），
  // 59:00 会变成 59:01 —— 那是测试的时间敏感性，不是产品 bug。
  const realNow = Date.now;
  const FIXED = realNow.call(Date);
  Date.now = () => FIXED;
  try {
  setElapsed(59 * 60000);
  ok('E4 59 分钟仍用 MM:SS', c.displayTime() === '59:00', c.displayTime());

  setElapsed(60 * 60000);
  ok('E4 整一小时补小时位 1:00:00', c.displayTime() === '1:00:00', c.displayTime());

  setElapsed(65 * 60000 + 30000);
  ok('E4 65分30秒 显示 1:05:30（不是 65:30）', c.displayTime() === '1:05:30', c.displayTime());

  // 倒计时不受影响：90 分钟也必须是 MM:SS
  const d = makeCtrl({ countUp: false });
  d.startSegment('focus', 90);
  ok('E4 倒计时 90 分钟仍是 MM:SS', d.displayTime() === '90:00', d.displayTime());
  } finally {
    Date.now = realNow;
  }
}

/* ------------- D3：专注中跳过不计入轮次 ------------- */
/*
 * 注意：只断言「专注结束时 cycles 不变」是恒真的 ——
 * 轮次本来就是在**短休息结束**时才 +1，跳不跳过都不变，测不出东西。
 * 真正要测的是走完一整轮之后：跳过专注的那一轮不能算完成。
 */
{
  let asked = 0; // 长休息询问次数：三条路径共用，声明提前
  const a = makeCtrl();
  a.startSegment('focus', 25);
  a.onSegmentEnd(false);
  a.onSegmentEnd(false);
  ok('D3 对照：正常走完一轮计 1 轮', a.completedCycles === 1, a.completedCycles);

  const c = makeCtrl();
  c.askLongBreak = () => { asked += 1; }; // 别真开弹窗：__modals 未装配会直接崩，
                                          // 崩了就走不到下面的断言，等于没测
  c.startSegment('focus', 25);
  c.onSegmentEnd(true); // 跳过专注
  c.onSegmentEnd(false); // 休息正常走完
  ok('D3 跳过专注的那一轮不计入轮次', c.completedCycles === 0, c.completedCycles);
  ok('D3 专注跳过计入「跳过」次数', c.skippedFocus === 1, c.skippedFocus);

  // 专注真做了、只是跳过休息：这一轮该算
  const d = makeCtrl();
  d.startSegment('focus', 25);
  d.onSegmentEnd(false);
  d.onSegmentEnd(true);
  ok('D3 专注照做、跳过休息仍计一轮', d.completedCycles === 1, d.completedCycles);

  // 回归守卫：轮次为 0 时 0 % 任何数 = 0，曾导致跳过后立刻弹长休息
  const e = makeCtrl();
  e.askLongBreak = () => { asked += 1; };
  e.startSegment('focus', 25);
  e.onSegmentEnd(true);
  e.onSegmentEnd(false);
  ok('D3 轮次为 0 时不误弹长休息询问', asked === 0, asked);
}

/* ------------- E10：正计时跳过照记时长 ------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpBaseMs = 8 * 60000;
  c.countUpStartAt = Date.now();
  const before = c.focusedMs;
  c.onSegmentEnd(true); // 正计时下跳过
  ok('E10 正计时跳过照记专注时长', c.focusedMs - before >= 8 * 60000 - 50,
     `${before} → ${c.focusedMs}`);
  ok('E10 正计时跳过不计入「跳过次数」', c.skippedFocus === 0, c.skippedFocus);

  // 对照组：倒计时跳过不记时长
  const d = makeCtrl({ countUp: false });
  d.startSegment('focus', 25);
  const dBefore = d.focusedMs;
  d.onSegmentEnd(true);
  ok('E10 对照：倒计时跳过不记时长（口径不同）', d.focusedMs === dBefore,
     `${dBefore} → ${d.focusedMs}`);
  ok('E10 对照：倒计时跳过计入「跳过次数」', d.skippedFocus === 1, d.skippedFocus);
}

/* ------------- A12：非法日期必须拒绝 ------------- */
{
  const ts = require(path.join(SRC, 'timestamp.js'));
  const bad = ts.parseToDate('2026-02-30');
  ok('A12 2026-02-30 被拒绝（不给错误结果）', bad === null || bad === undefined, String(bad));

  const good = ts.parseToDate('2026-02-28');
  ok('A12 对照：2026-02-28 正常解析', good !== null && good !== undefined);

  const bad2 = ts.parseToDate('2026-13-01');
  ok('A12 2026-13-01 被拒绝', bad2 === null || bad2 === undefined, String(bad2));
}

console.log('\n' + (fail === 0 ? '全部通过 ✅' : fail + ' 项失败 ❌'));
if (fail) failures.forEach((f) => console.log('   - ' + f));
console.log('套件: manualdoc  ' + pass + '/' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
