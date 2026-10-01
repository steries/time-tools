/*
 * 回归测试：番茄钟浮窗重绘的脏检查（_paintSet / _txt / _attr）
 *
 * 背景：update() 每秒被 tick 调一次。原先无差别重写全部文本节点，
 * 实测每帧 9 次 setText、其中 8 次完全冗余（标题恒为「🍅 番茄钟」、
 * 按钮文案只在状态切换时变）。改成脏检查后每帧只写倒计时。
 *
 * 这类优化最大的风险不是"没变快"，而是"该刷新的没刷新"——
 * 按钮文案卡在旧值、最小化后标题不换、完成一轮圆点不动。
 * 所以这里两组断言都必须有：
 *   ① 稳态：只有倒计时在写（性能）
 *   ② 变化：状态/轮次/最小化一变，对应节点必须重写（正确性）
 *
 * 用产物里真实的 FloatUI，不在测试里重写判断逻辑。
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const DIST = ROOT;

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

/* ---------------- 加载产物里的真实 FloatUI ---------------- */
const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

global.document = Object.assign({}, global.document, {
  createElement: (tag) => new realObsidian.MockEl(tag),
  body: { appendChild() {} },
});
global.window = Object.assign({}, global.window, {
  addEventListener() {},
  removeEventListener() {},
  innerWidth: 1200,
  innerHeight: 900,
});

const obsidian = Object.create(realObsidian);
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'obsidian') return obsidian;
  return origLoad.call(this, request, ...rest);
};
const code = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
Module._load = origLoad;

const FloatUI = mod.exports.__testFloatUI;

console.log('\n番茄钟重绘脏检查：稳态只写倒计时，变化时必须重绘\n');

ok('产物导出 __testFloatUI', typeof FloatUI === 'function');
if (typeof FloatUI !== 'function') {
  console.log('\n无法继续：产物没有暴露 __testFloatUI\n');
  process.exit(1);
}

const FIELDS = ['timeEl', 'titleEl', 'miniEl', 'stateEl', 'cycleEl', 'dotsEl', 'totalEl', 'btnMain', 'btnSkip'];

/** 造一个可控的 ctrl：remainMs / segmentProgress 由外部推进 */
function makeCtrl(extra) {
  const c = Object.assign(
    {
      state: 'focus',
      pausedFrom: null,
      pendingState: null,
      completedCycles: 0,
      focusedMs: 0,
      targetCycles: 0,
      segmentTotalMs: 25 * 60000,
      _remain: 25 * 60000,
      remainMs() { return this._remain; },
      // 替身补上 displayTime（真实控制器有）。值随 _remain 变 —— 若返回常量，
      // 脏检查永远判定「没变化」，这一组断言会假绿。
      displayTime() { return String(this._remain); },
      segmentProgress() { return (this.segmentTotalMs - this._remain) / this.segmentTotalMs; },
      settings: { longBreakInterval: 4 },
    },
    extra || {}
  );
  return c;
}

/** 给各文本节点装写入计数器；返回 counts 与 reset */
function instrument(ui) {
  const counts = {};
  FIELDS.forEach((k) => {
    const el = ui[k];
    if (!el) return;
    counts[k] = 0;
    const orig = el.setText.bind(el);
    el.setText = (v) => { counts[k] += 1; return orig(v); };
  });
  return counts;
}

/* ---------------- ① 稳态：只有倒计时在写 ---------------- */
{
  const ctrl = makeCtrl();
  const ui = new FloatUI(ctrl, { app: {} });
  const counts = instrument(ui);

  // 推进 60 秒：每帧剩余少 1 秒，模拟真实 tick
  for (let i = 0; i < 60; i++) {
    ctrl._remain -= 1000;
    ui.update();
  }

  ok('稳态下倒计时每帧都写', counts.timeEl === 60, String(counts.timeEl));
  const others = FIELDS.filter((k) => k !== 'timeEl');
  const noisy = others.filter((k) => counts[k] > 0);
  ok(
    '稳态下其余节点一次都不写（标题/按钮/圆点恒定）',
    noisy.length === 0,
    noisy.length ? noisy.map((k) => k + '=' + counts[k]).join(',') : ''
  );
}

/* ---------------- ② 状态切换：按钮与状态必须重写 ---------------- */
{
  const ctrl = makeCtrl();
  const ui = new FloatUI(ctrl, { app: {} });
  const counts = instrument(ui);

  // 先跑几帧进入稳态，再切到短休息
  for (let i = 0; i < 3; i++) { ctrl._remain -= 1000; ui.update(); }
  Object.keys(counts).forEach((k) => { counts[k] = 0; });

  ctrl.state = 'short';
  ui.update();

  ok('切到休息后状态文案重写', counts.stateEl >= 1, String(counts.stateEl));
  /*
   * 主按钮在专注与休息下都是「暂停」，值没变就应当跳过写入 ——
   * 这里断言的是「值正确」，不是「必须重写一次」（那样等于逼脏检查失效）。
   * 「值真会变」的场景由下面 IDLE→focus 与暂停两处覆盖。
   */
  ok('切到休息后主按钮文案正确（仍为暂停）', ui.btnMain.text === '暂停', ui.btnMain.text);
  ok('切到休息后跳过按钮重写', counts.btnSkip >= 1, String(counts.btnSkip));
  ok('跳过按钮文案跟着变', ui.btnSkip.text === '跳过休息', ui.btnSkip.text);
}

/* ---------------- ②b 文案真会变时必须重写（未开始 → 专注） ---------------- */
{
  const ctrl = makeCtrl({ state: 'idle' });
  const ui = new FloatUI(ctrl, { app: {} });
  ok('未开始时主按钮为「开始」', ui.btnMain.text === '开始', ui.btnMain.text);

  const counts = instrument(ui);
  ctrl.state = 'focus';
  ui.update();

  ok('开始专注后主按钮重写', counts.btnMain >= 1, String(counts.btnMain));
  ok('开始专注后主按钮变「暂停」', ui.btnMain.text === '暂停', ui.btnMain.text);
}

/* ---------------- ③ 完成一轮：圆点与轮次必须重写 ---------------- */
{
  const ctrl = makeCtrl();
  const ui = new FloatUI(ctrl, { app: {} });
  const counts = instrument(ui);

  for (let i = 0; i < 3; i++) { ctrl._remain -= 1000; ui.update(); }
  Object.keys(counts).forEach((k) => { counts[k] = 0; });

  ctrl.completedCycles = 1;
  ui.update();

  ok('完成一轮后圆点重写', counts.dotsEl >= 1, String(counts.dotsEl));
  ok('完成一轮后轮次重写', counts.cycleEl >= 1, String(counts.cycleEl));
  ok('轮次文案跟着变', ui.cycleEl.text.indexOf('第 2 轮') >= 0, ui.cycleEl.text);
}

/* ---------------- ④ 最小化 / 恢复：标题与属性必须重写 ---------------- */
{
  const ctrl = makeCtrl();
  const ui = new FloatUI(ctrl, { app: {} });
  const counts = instrument(ui);

  for (let i = 0; i < 3; i++) { ctrl._remain -= 1000; ui.update(); }
  Object.keys(counts).forEach((k) => { counts[k] = 0; });

  ui.minimized = true;
  ui.update();

  ok('最小化后标题换成本段模式名', ui.titleEl.text === '专注', ui.titleEl.text);
  ok('最小化后 mini 按钮变恢复', ui.miniEl.text === '□', ui.miniEl.text);
  ok('最小化后写入 data-mini-kind', ui.el.getAttribute('data-mini-kind') === 'focus', String(ui.el.getAttribute('data-mini-kind')));

  Object.keys(counts).forEach((k) => { counts[k] = 0; });
  ui.minimized = false;
  ui.update();

  ok('恢复后标题回到番茄钟', ui.titleEl.text === '🍅 番茄钟', ui.titleEl.text);
  ok('恢复后清掉 data-mini-kind', ui.el.getAttribute('data-mini-kind') === undefined, String(ui.el.getAttribute('data-mini-kind')));
}

/* ---------------- ⑤ 暂停：主按钮必须变「继续」 ---------------- */
{
  const ctrl = makeCtrl();
  const ui = new FloatUI(ctrl, { app: {} });
  for (let i = 0; i < 3; i++) { ctrl._remain -= 1000; ui.update(); }

  ctrl.state = 'paused';
  ctrl.pausedFrom = 'focus';
  ui.update();

  ok('暂停后主按钮变继续', ui.btnMain.text === '继续', ui.btnMain.text);
  ok('暂停后仍按暂停前那一段上色', ui.el.getAttribute('data-pomo-kind') === 'focus', String(ui.el.getAttribute('data-pomo-kind')));
}

/* ---------------- ⑥ 段类别属性两个入口都写 ---------------- */
{
  const ctrl = makeCtrl();
  const ui = new FloatUI(ctrl, { app: {} });
  ok('浮窗写入 data-pomo-kind', ui.el.getAttribute('data-pomo-kind') === 'focus', String(ui.el.getAttribute('data-pomo-kind')));
  ok('浮窗写入 data-state', ui.el.getAttribute('data-state') === 'focus', String(ui.el.getAttribute('data-state')));
}

console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项');
if (fail) {
  console.log('\n失败项：');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
