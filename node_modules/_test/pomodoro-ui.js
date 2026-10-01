/*
 * 回归测试：番茄钟弹窗防误关 + 齿轮直达设置页
 *
 * 直接加载构建产物 main.js，在 mock 的 Obsidian 环境里跑真实代码，
 * 而不是在测试里重写一遍逻辑 —— 否则改了源码测试照样绿。
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

/* ---------------- mock obsidian ---------------- */
/*
 * 复用仓库自带的 obsidian mock（node_modules/obsidian/index.js），
 * 只把 Modal 换成带观测点的版本 —— 记录 closed / closedCount，
 * 并补上真实 Modal 才有的 modalEl。其余一律沿用，避免测出两套环境。
 */
global.__modals = [];
global.__notices = [];
global.__settings = [];

const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

function makeEl(tag) {
  const el = {
    tag,
    children: [],
    classes: new Set(),
    text: '',
    style: {},
    offsetWidth: 100,
  };
  Object.defineProperty(el, 'className', {
    get() {
      return [...el.classes].join(' ');
    },
    set(v) {
      el.classes = new Set(String(v).split(/\s+/).filter(Boolean));
    },
  });
  el.addClass = (c) => String(c).split(/\s+/).forEach((x) => el.classes.add(x));
  el.removeClass = (c) => String(c).split(/\s+/).forEach((x) => el.classes.delete(x));
  el.hasClass = (c) => el.classes.has(c);
  el.setText = (t) => {
    el.text = String(t);
    return el;
  };
  el.empty = () => {
    el.children = [];
    return el;
  };
  el.createDiv = (o) => {
    const c = makeEl('div');
    if (o && o.cls) c.className = o.cls;
    if (o && o.text !== undefined) c.setText(o.text);
    el.children.push(c);
    return c;
  };
  el.querySelector = (sel) => {
    const cls = sel.replace(/^\./, '');
    const walk = (n) => {
      for (const c of n.children) {
        if (c.classes.has(cls)) return c;
        const r = walk(c);
        if (r) return r;
      }
      return null;
    };
    return walk(el);
  };
  return el;
}

/** 带观测点的 Modal：真实 Obsidian 里点遮罩 / 点 X / 按 Esc 最终都走 close() */
class ObservableModal extends realObsidian.Modal {
  constructor(app) {
    super(app);
    this.modalEl = makeEl('div');
    this.closed = false;
    this.closedCount = 0;
  }
  close() {
    this.closed = true;
    this.closedCount += 1;
    if (typeof this.onClose === 'function') this.onClose();
  }
  onEscapeKey() {
    this.close();
  }
}

const obsidian = Object.create(realObsidian);
obsidian.Modal = ObservableModal;

/* ---------------- 加载产物 ---------------- */

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'obsidian') return 'obsidian';
  return origResolve.call(this, request, ...rest);
};
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'obsidian') return obsidian;
  return origLoad.call(this, request, ...rest);
};

const code = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
Module._load = origLoad;
Module._resolveFilename = origResolve;

const exported = mod.exports;
const modals = exported.__testModals || null;

console.log('\n番茄钟弹窗防误关 / 设置页直达\n');

/* ---------------- 1. 防误关 ---------------- */

ok('产物导出了测试钩子 __testModals', !!modals);
if (!modals) {
  console.log('\n无法继续：产物没有暴露 __testModals\n');
  process.exit(1);
}

function makeCtrl(dismissClicks) {
  return { settings: { dismissClicks }, app: {} };
}

function newModal(Kind, clicks) {
  const ctrl = makeCtrl(clicks);
  const m = new Kind({}, ctrl, () => {}, () => {});
  m.open();
  return m;
}

// 默认 3 次
{
  const m = newModal(modals.AskLongBreakModal, 3);
  m.close();
  ok('第 1 次点外部不关闭', m.closed === false);
  m.close();
  ok('第 2 次点外部仍不关闭', m.closed === false);
  m.close();
  ok('第 3 次点外部才关闭', m.closed === true);
  ok('只真实关闭了一次（不会重复触发 onClose）', m.closedCount === 1, String(m.closedCount));
}

// 提示文案
{
  const m = newModal(modals.AskLongBreakModal, 3);
  m.close();
  const hint = m.modalEl.querySelector('.pomo-dismiss-hint');
  ok('第一次点外部后出现提示元素', !!hint);
  ok('提示显示还剩 2 次', !!hint && hint.text.indexOf('2 次') >= 0, hint && hint.text);
  ok('提示元素带上了抖动 class', m.modalEl.hasClass('pomo-shake'));
  m.close();
  ok('第二次提示还剩 1 次', m.modalEl.querySelector('.pomo-dismiss-hint').text.indexOf('1 次') >= 0);
}

// 弹窗内按钮不受限制
{
  const m = newModal(modals.AskLongBreakModal, 3);
  m.dismiss();
  ok('dismiss() 一次就关（按钮路径不计数）', m.closed === true);
}

// Esc 不受限制
{
  const m = newModal(modals.AskLongBreakModal, 3);
  m.onEscapeKey();
  ok('Esc 一次就关', m.closed === true);
}

// 填 1 = 不拦截
{
  const m = newModal(modals.AskLongBreakModal, 1);
  m.close();
  ok('dismissClicks=1 时点一次就关', m.closed === true);
}

// 非法值退回 3
{
  const m = newModal(modals.AskLongBreakModal, 'abc');
  m.close();
  m.close();
  ok('非法值退回默认 3，前两次不关', m.closed === false);
  m.close();
  ok('非法值退回默认 3，第三次关', m.closed === true);
}

// 超范围裁剪
{
  const m = newModal(modals.AskLongBreakModal, 999);
  let n = 0;
  while (!m.closed && n < 30) {
    m.close();
    n += 1;
  }
  ok('上限裁剪到 10（不会要求点 999 次）', n === 10, String(n));
}

// 三个弹窗都继承了 GuardedModal
['SummaryModal', 'AskLongBreakModal', 'AskRestartModal'].forEach((k) => {
  ok(k + ' 继承了防误关基类', modals[k].prototype instanceof modals.GuardedModal);
});
ok('StartModal 不拦截（表单类弹窗不做限制）', !(modals.StartModal.prototype instanceof modals.GuardedModal));

/* ---------------- 1b. 设置页：自定义统计位置默认收起 ---------------- */
{
  const POMO = exported.__testRecord;
  ok('产物导出 renderPomodoroSettings', typeof POMO.renderPomodoroSettings === 'function');

  if (typeof POMO.renderPomodoroSettings === 'function') {
    /** 渲染一遍设置页，返回按名字索引的设置项 */
    const render = (pomodoro, app) => {
      global.__settings.length = 0;
      const container = new realObsidian.MockEl('div');
      const plugin = {
        settings: { pomodoro },
        saveSettings: async () => {},
        app: app || {},
      };
      const ctrl = { settings: pomodoro, activeProfile: null, syncProfile: () => {} };
      POMO.renderPomodoroSettings(container, plugin, ctrl);
      const byName = {};
      (global.__settings || []).forEach((x) => {
        byName[x.name] = x;
      });
      return byName;
    };

    const base = { profiles: [{ id: 'p1', name: '学习', focusMin: 25, shortBreakMin: 5, longBreakMin: 15 }] };

    const off = render(Object.assign({}, base, { statsSource: 'off' }));
    ok('有「自定义统计位置」这一项', !!off['自定义统计位置'], Object.keys(off).join('|'));
    ok('数据源＝不统计时它收起', off['自定义统计位置'].settingEl.style.display === 'none',
      off['自定义统计位置'].settingEl.style.display);

    const note = render(Object.assign({}, base, { statsSource: 'note' }));
    ok('数据源＝解析笔记时它仍收起', note['自定义统计位置'].settingEl.style.display === 'none',
      note['自定义统计位置'].settingEl.style.display);

    const custom = render(Object.assign({}, base, { statsSource: 'custom' }));
    ok('数据源＝自定义位置时它展出', custom['自定义统计位置'].settingEl.style.display === '',
      JSON.stringify(custom['自定义统计位置'].settingEl.style.display));

    // 切下拉要立刻改变可见性（不重绘整页，避免输入框失焦）
    const live = Object.assign({}, base, { statsSource: 'off', statsCustomPath: '' });
    const liveByName = render(live);
    const dd = liveByName['累计统计数据源'];
    ok('数据源下拉存在', !!dd);
    if (dd && dd.components[0] && typeof dd.components[0].change === 'function') {
      dd.components[0].change('custom');
      ok('下拉切成「自定义位置」后立刻展出（不用重开设置页）',
        liveByName['自定义统计位置'].settingEl.style.display === '',
        JSON.stringify(liveByName['自定义统计位置'].settingEl.style.display));
      ok('切换可见性时不改动已填的路径', live.statsCustomPath === '', String(live.statsCustomPath));
    }

    // DataView 字段表
    const dv = render(Object.assign({}, base, {
      dataviewEnabled: false,
      dataviewFields: '专注时长::{{VALUE:focusText}}',
    }));
    ok('有「DataView 字段表」这一项', !!dv['DataView 字段表'], Object.keys(dv).join('|'));
    if (dv['DataView 字段表']) {
      ok('字段表默认带上专注时长那行',
        dv['DataView 字段表'].components[0].value === '专注时长::{{VALUE:focusText}}',
        String(dv['DataView 字段表'].components[0].value));
    }

    /* ---- 1c. DataView 未安装时的可见提示（设置页状态行，不弹窗）---- */
    const renderWithStatus = (pomodoro, app) => {
      global.__settings.length = 0;
      const container = new realObsidian.MockEl('div');
      const plugin = { settings: { pomodoro }, saveSettings: async () => {}, app: app || {} };
      const ctrl = { settings: pomodoro, activeProfile: null, syncProfile: () => {} };
      POMO.renderPomodoroSettings(container, plugin, ctrl);
      const byName = {};
      (global.__settings || []).forEach((x) => { byName[x.name] = x; });
      const walk = (n) => {
        // 用 classList 判：addClass 会把 cls 拼成 "tt-dv-status is-warn"
        if (n.classList && n.classList.has('tt-dv-status')) return n;
        for (const c of n.children || []) { const r = walk(c); if (r) return r; }
        return null;
      };
      return { byName, status: walk(container) };
    };

    const dvOn = Object.assign({}, base, { dataviewEnabled: true });
    const noDv = renderWithStatus(dvOn, {});
    ok('开关开 → 有状态行', !!noDv.status);
    ok('未装 DataView → 文案说明「仍会写入」',
      !!noDv.status && noDv.status.text.indexOf('未检测到插件') >= 0
        && noDv.status.text.indexOf('仍会写入') >= 0,
      noDv.status && noDv.status.text);
    ok('未装 → 加 is-warn（黄字）',
      !!noDv.status && noDv.status.classList.has('is-warn'));

    const withDv = renderWithStatus(dvOn, { plugins: { plugins: { dataview: {} } } });
    ok('已装 DataView → 提示已就绪',
      !!withDv.status && withDv.status.text.indexOf('已就绪') >= 0,
      withDv.status && withDv.status.text);
    ok('已装 → 不加 is-warn', !!withDv.status && !withDv.status.classList.has('is-warn'));

    const dvOff = renderWithStatus(Object.assign({}, base, { dataviewEnabled: false }), {});
    ok('开关关 → 状态行隐藏', !!dvOff.status && dvOff.status.style.display === 'none',
      dvOff.status && String(dvOff.status.style.display));
    ok('开关关 → 一个字都不写', !!dvOff.status && dvOff.status.text === '',
      dvOff.status && String(dvOff.status.text));

    // 现场开开关：状态行要立刻跟着变（不重绘整页，避免输入框失焦）
    const liveDv = Object.assign({}, base, { dataviewEnabled: false });
    const liveR = renderWithStatus(liveDv, { plugins: { plugins: { dataview: {} } } });
    const tg = liveR.byName['DataView 联动'];
    if (tg && tg.components[0] && typeof tg.components[0].change === 'function') {
      tg.components[0].change(true);
      ok('现场打开开关 → 状态行立刻变已就绪',
        !!liveR.status && liveR.status.text.indexOf('已就绪') >= 0,
        liveR.status && liveR.status.text);
      ok('现场打开开关 → 不再隐藏', liveR.status.style.display === '',
        String(liveR.status.style.display));
    }
  }
}

/* ---------------- 2. 设置页直达 ---------------- */

{
  const calls = [];
  const setting = {
    activeTab: null,
    open() {
      calls.push('open');
      // 模拟较新版本：open 返回 Promise
      return Promise.resolve();
    },
    openTabById(id) {
      calls.push('openTabById:' + id);
      this.activeTab = 'our-tab';
    },
  };
  const plugin = {
    app: { setting },
    manifest: { id: 'time-tools' },
    settingTab: {
      display() {
        calls.push('display');
      },
      focusTab(t) {
        calls.push('focusTab:' + t);
      },
    },
  };
  exported.prototype.openSettings.call(plugin, 'pomodoro');
  // open() 是异步的，等一轮微任务 + setTimeout 兜底
  setTimeout(() => {
    ok('先记录目标标签', calls.indexOf('focusTab:pomodoro') === 0, calls.join(','));
    ok('调用了 setting.open()', calls.indexOf('open') >= 0);
    ok(
      'open 完成后才切 tab（顺序正确）',
      calls.indexOf('openTabById:time-tools') > calls.indexOf('open'),
      calls.join(',')
    );

    // 老版本：没有 openTabById
    const calls2 = [];
    const setting2 = {
      activeTab: null,
      open() {
        calls2.push('open');
      },
      openTab(tab) {
        calls2.push('openTab');
        this.activeTab = tab;
      },
    };
    const plugin2 = {
      app: { setting: setting2 },
      manifest: { id: 'time-tools' },
      settingTab: {
        display() {
          calls2.push('display');
        },
        focusTab() {
          calls2.push('focusTab');
        },
      },
    };
    exported.prototype.openSettings.call(plugin2, 'pomodoro');
    ok('没有 openTabById 时退回 openTab', calls2.indexOf('openTab') >= 0, calls2.join(','));

    // 已经停在本插件页时不再重复切换
    const calls3 = [];
    const ourTab = { name: 'ours' };
    const setting3 = {
      activeTab: ourTab,
      open() {
        calls3.push('open');
      },
      openTabById() {
        calls3.push('openTabById');
      },
    };
    const plugin3 = {
      app: { setting: setting3 },
      manifest: { id: 'time-tools' },
      settingTab: {
        display() {
          calls3.push('display');
        },
        focusTab() {
          calls3.push('focusTab');
        },
      },
    };
    plugin3.settingTab.__self = ourTab;
    setting3.activeTab = plugin3.settingTab;
    exported.prototype.openSettings.call(plugin3, 'pomodoro');
    ok('已在本插件页时不再重复切 tab', calls3.indexOf('openTabById') === -1, calls3.join(','));

    console.log('\n' + '─'.repeat(46));
    if (fail) {
      console.log('失败 ' + fail + ' 项：');
      failures.forEach((f) => console.log('   · ' + f));
      process.exit(1);
    }
    console.log('全部通过 ✅  （' + pass + ' 项）');
  }, 120);
}
