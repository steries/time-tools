/*
 * 回归测试：会话记录总开关
 *
 * 直接加载构建产物 main.js，在 mock 的 Obsidian 环境里跑真实代码，
 * 而不是在测试里重写一遍逻辑 —— 否则改了源码测试照样绿。
 *
 * 覆盖：
 *   1. 总开关默认打开
 *   2. 打开时设置正常展开；关闭时全部收进折叠区
 *   3. 关闭要二次确认，取消则开关弹回、不改设置
 *   4. 关闭后结束弹窗不再有「记录」按钮
 *   5. 关闭后 Recorder 一律不写文件
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

global.__modals = [];
global.__notices = [];
global.__settings = [];
global.__buttons = [];

const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

/* ---------------- 加载产物 ---------------- */

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'obsidian') return 'obsidian';
  return origResolve.call(this, request, ...rest);
};
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'obsidian') return realObsidian;
  return origLoad.call(this, request, ...rest);
};

const code = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
Module._load = origLoad;
Module._resolveFilename = origResolve;

const exported = mod.exports;
const R = exported.__testRecord;
const modals = exported.__testModals;

console.log('\n会话记录总开关\n');

if (!R) {
  console.log('无法继续：产物没有暴露 __testRecord\n');
  process.exit(1);
}

/* ---------------- 工具 ---------------- */

function makePlugin(record) {
  return {
    app: { vault: {} },
    settings: { record },
    saved: 0,
    redraws: 0,
    async saveSettings() { this.saved += 1; },
    redrawSettingsTab() { this.redraws += 1; },
  };
}

/** 造一份记录配置；默认用「内置写入」以便测写入闸门 */
function makeRecord(over) {
  return Object.assign(
    {
      enabled: true,
      autoRecord: false,
      mode: 'builtin',
      defaultNoteName: '番茄记录',
      folder: '',
      template: '{{date}}',
      quickAddChoice: '',
      copyBeforeQuickAdd: true,
      strictChoiceName: false,
      fallbackToBuiltin: true,
    },
    over || {}
  );
}

/** 渲染一次记录设置页，返回 {root, settings, find} */
function render(record) {
  global.__settings = [];
  const plugin = makePlugin(record);
  const root = new realObsidian.MockEl('div');
  R.renderRecordSettings(root, plugin);
  const find = (name) => global.__settings.find((s) => s.name === name);
  return { root, plugin, find, settings: global.__settings };
}

/** 深度优先找第一个 tag 为 details 的元素 */
function findDetails(el) {
  for (const c of el.children) {
    if (c.tag === 'details') return c;
    const r = findDetails(c);
    if (r) return r;
  }
  return null;
}

/** 找总开关的 toggle 组件（第一个组件） */
function toggleOf(setting) {
  return setting && setting.components[0];
}

/* ---------------- 1. 默认值 ---------------- */

{
  const DEF = require(path.join(ROOT, 'src', 'settings.js')).DEFAULT_SETTINGS;
  ok('总开关默认打开', DEF.record.enabled === true, String(DEF.record.enabled));
}

/* ---------------- 2. 展开 / 折叠 ---------------- */

{
  const { root, find } = render(makeRecord({ enabled: true }));
  ok('打开时不生成折叠区', findDetails(root) === null);
  const auto = find('是否自动记录');
  ok('打开时能找到「是否自动记录」', !!auto);
  ok('打开时「是否自动记录」直接挂在页面上', !!auto && auto.hostEl === root);
}

{
  const { root, find } = render(makeRecord({ enabled: false }));
  const det = findDetails(root);
  ok('关闭时生成折叠区', !!det);
  ok('折叠区带 pomo-fold class', !!det && det.classList.has('pomo-fold'));
  ok(
    '折叠区有 summary 提示',
    !!det && det.children.some((c) => c.tag === 'summary' && /已关闭/.test(c.text))
  );
  const auto = find('是否自动记录');
  ok('关闭时仍能找到「是否自动记录」（只是被收起，值不丢）', !!auto);
  ok('关闭时「是否自动记录」渲染进折叠区内', !!auto && !!det && det.children.indexOf(auto.settingEl) >= 0);
  const master = find('启用会话记录');
  ok('总开关本身不进折叠区（位置固定）', !!master && master.hostEl === root);
}

/* ---------------- 3. 防误触：总开关有分隔 ---------------- */

{
  const { find } = render(makeRecord({ enabled: true }));
  const master = find('启用会话记录');
  ok('总开关存在', !!master);
  ok(
    '总开关带 pomo-record-master（分隔防误触）',
    !!master && master.settingEl.classList.has('pomo-record-master')
  );
}

/* ---------------- 4. 关闭要二次确认 ---------------- */

(async () => {
  // 4a 取消 → 开关弹回、不改设置
  {
    const rec = makeRecord({ enabled: true });
    const { plugin, find } = render(rec);
    global.__autoAnswer = 'cancel';
    global.__buttons = [];
    await toggleOf(find('启用会话记录')).change(false);
    ok('取消确认后 enabled 保持 true', rec.enabled === true, String(rec.enabled));
    ok('取消确认后开关弹回开启', toggleOf(find('启用会话记录')).value === true);
    ok('取消确认后不落盘', plugin.saved === 0, String(plugin.saved));
    ok('取消确认后不重绘', plugin.redraws === 0, String(plugin.redraws));
  }

  // 4b 确认 → 真的关闭
  {
    const rec = makeRecord({ enabled: true });
    const { plugin, find } = render(rec);
    global.__autoAnswer = 'ok';
    global.__buttons = [];
    await toggleOf(find('启用会话记录')).change(false);
    ok('确认后 enabled 变为 false', rec.enabled === false, String(rec.enabled));
    ok('确认后落盘一次', plugin.saved === 1, String(plugin.saved));
    ok('确认后重绘设置页（折叠生效）', plugin.redraws === 1, String(plugin.redraws));
  }

  // 4c 弹窗把后果写全
  /*
   * 这里让弹窗自动点「取消」：否则 Promise 一直挂起，后面的用例全跑不到 ——
   * 弹窗对象在自动点击后依然可读，标题与正文照旧能断言。
   */
  {
    global.__modals = [];
    global.__autoAnswer = 'cancel';
    const rec = makeRecord({ enabled: true });
    const { find } = render(rec);
    await toggleOf(find('启用会话记录')).change(false);
    const m = global.__modals[global.__modals.length - 1];
    ok('关闭时弹出了确认框', !!m);
    ok('确认框标题点明是关闭会话记录', !!m && /会话记录/.test(m.title), m && m.title);
    ok('确认框写明不再自动记录', !!m && m.content.indexOf('不再自动记录') >= 0);
    ok(
      '确认框写明结束弹窗不再有「记录」按钮',
      !!m && m.content.indexOf('不再显示「记录」按钮') >= 0
    );
    ok('确认框写明设置会折叠收起', !!m && m.content.indexOf('折叠收起') >= 0);
    ok('确认框说明已有记录不受影响', !!m && m.content.indexOf('不受影响') >= 0);
    ok('确认框说明设置值会保留', !!m && m.content.indexOf('保留') >= 0);
    ok('确认框正文带换行（否则后果清单糊成一行）', !!m && /\n/.test(m.content));
    ok('弹窗正文挂了 tt-confirm-content（换行样式）', !!m && m.contentEl.classList.has('tt-confirm-content'));
    global.__autoAnswer = null;
  }

  // 4d 打开方向不需要确认
  {
    const rec = makeRecord({ enabled: false });
    const { find } = render(rec);
    global.__modals = [];
    global.__autoAnswer = null;
    await toggleOf(find('启用会话记录')).change(true);
    ok('打开总开关不弹确认框', global.__modals.length === 0);
    ok('打开后 enabled 为 true', rec.enabled === true);
  }

  /* ---------------- 5. 结束弹窗不再有「记录」按钮 ---------------- */

  {
    const data = {
      cycles: 1, longBreaks: 0, skippedBreak: 0,
      focusedMs: 1500000, breakMs: 300000,
      date: '2026-09-21', time: '10:00', range: '10:00-10:25',
      task: '', note: '', profile: '学习',
    };
    const mk = (enabled) => {
      const ctrl = {
        settings: { dismissClicks: 1, record: makeRecord({ enabled }) },
        plugin: { settings: { record: makeRecord({ enabled }) } },
        app: {},
        openStart() {},
      };
      const m = new modals.SummaryModal({}, ctrl, data);
      m.open();
      return m;
    };
    ok('开启时结束弹窗有「记录」按钮', !!mk(true).btnRecord);
    ok('关闭时结束弹窗没有「记录」按钮', !mk(false).btnRecord);
  }

  /* ---------------- 6. 关闭后一律不写文件 ---------------- */

  {
    const calls = [];
    const vault = {
      getAbstractFileByPath: () => null,
      createFolder: async () => {},
      create: async (p) => { calls.push('create:' + p); return { path: p }; },
      read: async () => '',
      modify: async (f) => { calls.push('modify:' + f.path); },
    };
    const rec = makeRecord({ enabled: false, mode: 'builtin' });
    const plugin = makePlugin(rec);
    plugin.app = { vault };
    const r = new R.Recorder(plugin);
    await r.record({ date: '2026-09-21', time: '10:00', range: '10:00-10:25', cycles: 1 });
    ok('总开关关闭时 Recorder 不写任何文件', calls.length === 0, calls.join(','));

    // 对照组：打开时确实会写，否则上面那条可能是「本来就不写」的假通过
    rec.enabled = true;
    await r.record({ date: '2026-09-21', time: '10:00', range: '10:00-10:25', cycles: 1 });
    ok('（对照）打开时确实会写入', calls.length > 0, calls.join(','));
  }

  /* ---------------- 汇总 ---------------- */

  console.log(`\n通过 ${pass} 项，失败 ${fail} 项`);
  if (fail) {
    console.log('失败项：');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
})();
