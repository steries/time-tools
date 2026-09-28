/*
 * 回归测试：番茄钟最小化 —— 标题变模式名 + 只留恢复按钮
 *
 * 用构建产物里真实的 FloatUI，而不是在测试里重写一遍判断逻辑：
 * 否则源码改了、测试照样绿（之前 Templater 桥接就吃过这个亏）。
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

/* ---------------- 加载产物 ---------------- */
const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

/* FloatUI 走 document.createElement 再 addClass/setAttribute，
 * 沙盒自带的 stub 是个空壳，这里换成仓库 mock 的 MockEl（真实 DOM 行为一致）。 */
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
Module._resolveFilename = ((orig) =>
  function (request, ...rest) {
    if (request === 'obsidian') return 'obsidian';
    return orig.call(this, request, ...rest);
  })(Module._resolveFilename);
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
const css = fs.readFileSync(path.join(DIST, 'styles.css'), 'utf8');

console.log('\n番茄钟最小化：模式名 + 只留恢复按钮\n');

ok('产物导出 __testFloatUI', typeof FloatUI === 'function');
if (typeof FloatUI !== 'function') {
  console.log('\n无法继续：产物没有暴露 __testFloatUI\n');
  process.exit(1);
}

/** 造一个够用的 ctrl：update() 非最小化分支会读这些字段 */
function makeCtrl(state, extra) {
  return Object.assign(
    {
      state,
      pausedFrom: null,
      pendingState: null,
      completedCycles: 0,
      targetCycles: 0,
      focusedMs: 0,
      remainMs: () => 60000,
      // 替身补上 displayTime（真实控制器有）：只测最小化标题与按钮，格式不参与断言
      displayTime: () => '01:00',
      segmentProgress: () => 0.5,
      settings: {
        theme: 'classic',
        longBreakInterval: 4,
        snapToEdge: false,
        floatEdge: 'right',
        floatOffset: 0.5,
      },
      plugin: { openSettings() {} },
    },
    extra || {}
  );
}

function titleOf(ui) {
  return ui.titleEl.text;
}
function miniTextOf(ui) {
  return ui.miniEl.text;
}
/** 找出所有头部按钮，按可见性（是否带 pomo-hide-on-mini）分组 */
function buttonsOf(ui) {
  const all = [];
  (ui.el.children || []).forEach((c) => {
    if (String(c.cls || '').indexOf('pomo-float-header') < 0) return;
    (c.children || []).forEach((s) => {
      if (String(s.cls || '').indexOf('pomo-float-btn') >= 0) all.push(s);
    });
  });
  return {
    all,
    hiddenOnMini: all.filter((s) => String(s.cls).indexOf('pomo-hide-on-mini') >= 0),
    keptOnMini: all.filter((s) => String(s.cls).indexOf('pomo-hide-on-mini') < 0),
  };
}

/* ---------------- 1. 各种状态下的标题 ---------------- */

const cases = [
  ['focus', null, '专注'],
  ['short', null, '休息'],
  ['long', null, '休息'],
  ['idle', null, '番茄钟'],
];

cases.forEach(([state, , expect]) => {
  const ui = new FloatUI(makeCtrl(state));
  ui.toggleMinimize();
  ok(`最小化 · ${state} → 标题「${expect}」`, titleOf(ui) === expect, titleOf(ui));
  ui.destroy();
});

// 暂停要沿用暂停前的那一段，否则中途暂停会被误显示成「番茄钟」
{
  const ui = new FloatUI(makeCtrl('paused', { pausedFrom: 'focus' }));
  ui.toggleMinimize();
  ok('暂停（专注中暂停）仍显示「专注」', titleOf(ui) === '专注', titleOf(ui));
  ok('暂停态配色类别仍是 focus', ui.el.attrs['data-mini-kind'] === 'focus', ui.el.attrs['data-mini-kind']);
  ui.destroy();
}
{
  const ui = new FloatUI(makeCtrl('paused', { pausedFrom: 'short' }));
  ui.toggleMinimize();
  ok('暂停（休息中暂停）仍显示「休息」', titleOf(ui) === '休息', titleOf(ui));
  ok('暂停态配色类别是 rest', ui.el.attrs['data-mini-kind'] === 'rest', ui.el.attrs['data-mini-kind']);
  ui.destroy();
}
// 手动模式下等待开始下一段：用待开始的那一段判断
{
  const ui = new FloatUI(makeCtrl('waiting', { pendingState: 'focus' }));
  ui.toggleMinimize();
  ok('等待开始下一段（专注）显示「专注」', titleOf(ui) === '专注', titleOf(ui));
  ui.destroy();
}

/* ---------------- 2. 恢复后还原 ---------------- */
{
  const ui = new FloatUI(makeCtrl('focus'));
  ok('未最小化时标题是「🍅 番茄钟」', titleOf(ui) === '🍅 番茄钟', titleOf(ui));
  ui.toggleMinimize();
  ui.toggleMinimize();
  ok('恢复后标题还原为「🍅 番茄钟」', titleOf(ui) === '🍅 番茄钟', titleOf(ui));
  ok('恢复后清掉 data-mini-kind', !ui.el.attrs['data-mini-kind'], String(ui.el.attrs['data-mini-kind']));
  ok('恢复后最小化按钮回到「—」', miniTextOf(ui) === '—', miniTextOf(ui));
  ui.destroy();
}

/* ---------------- 3. 最小化只留恢复按钮 ---------------- */
{
  const ui = new FloatUI(makeCtrl('focus'));
  const btns = buttonsOf(ui);
  ok('头部共 3 个按钮（设置/最小化/隐藏）', btns.all.length === 3, String(btns.all.length));
  ok('设置与隐藏按钮带 pomo-hide-on-mini', btns.hiddenOnMini.length === 2, String(btns.hiddenOnMini.length));
  ok('最小化按钮本身不带隐藏 class', btns.keptOnMini.length === 1, String(btns.keptOnMini.length));

  ui.toggleMinimize();
  ok('最小化后唯一保留的按钮是最小化/恢复按钮', miniTextOf(ui) === '□', miniTextOf(ui));
  ok('最小化后按钮 title 提示恢复', ui.miniEl.title === '恢复窗口', ui.miniEl.title);
  ui.destroy();
}

/* ---------------- 4. CSS 必须真的生效（不是只改了 class） ---------------- */
ok('CSS 隐藏了最小化态的 pomo-hide-on-mini', /\.pomo-float\.pomo-mini\s+\.pomo-hide-on-mini\s*\{[^}]*display:\s*none/.test(css));
ok('CSS 给专注态标题上色', css.indexOf(".pomo-float.pomo-mini[data-mini-kind='focus'] .pomo-float-title") >= 0);
ok('CSS 给休息态标题上色', css.indexOf(".pomo-float.pomo-mini[data-mini-kind='rest'] .pomo-float-title") >= 0);
// 颜色必须走主题变量，写死的话自定义主题会失效
ok('专注色走 --pomo-focus 变量', /data-mini-kind='focus'\][^{]*\{[^}]*var\(--pomo-focus/.test(css));
ok('休息色走 --pomo-rest 变量', /data-mini-kind='rest'\][^{]*\{[^}]*var\(--pomo-rest/.test(css));

console.log('');
console.log(fail === 0 ? `✅ pomomini: ${pass} 项全部通过` : `❌ pomomini: ${pass} 通过 / ${fail} 失败`);
if (fail) {
  failures.forEach((f) => console.log('   - ' + f));
  process.exit(1);
}
