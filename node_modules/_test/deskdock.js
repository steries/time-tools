/*
 * 桌面常驻（方案 B）测试。
 *
 * 为什么单独立一个套件：这个功能**会改动用户的 Obsidian 主窗口**。
 * 做对了是便利，做错了是把主窗口永久弄小、还原不回去 ——
 * 那比不做这个功能更糟。所以这里守的不是"功能有没有调 API"，
 * 而是"原尺寸有没有被正确记下来、关掉后有没有真的还回去"。
 *
 * 另一条：deskDockRestore 用完必须清空。它是临时存档，
 * 留在 data.json 里就是废弃数据。
 */
'use strict';

const path = __dirname + '/../src/';
const pomowin = require(path + 'pomowin.js');
const { migrateSettings, DEFAULT_SETTINGS } = require(path + 'settings.js');

let fail = 0;
let total = 0;
function check(name, cond, extra) {
  total += 1;
  if (cond) console.log('  ✓ ' + name);
  else {
    fail += 1;
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : ''));
  }
}

/** 造一个带 getBounds 的假窗口；orig 是"缩小前"的主窗口尺寸 */
function fakeWin(opts) {
  const o = opts || {};
  const calls = [];
  const orig = o.orig || { x: 100, y: 50, width: 1400, height: 900 };
  const w = {
    __calls: calls,
    screen: {
      availLeft: 0,
      availTop: 0,
      availWidth: 1920,
      availHeight: 1040, // 1080 减掉任务栏 40
      width: 1920,
      height: 1080,
    },
  };
  if (o.electron !== false) {
    w.electronWindow = {
      setAlwaysOnTop(v) {
        calls.push(['onTop', v]);
      },
      setBounds(b) {
        calls.push(['bounds', JSON.parse(JSON.stringify(b))]);
      },
      getBounds() {
        // 已经缩小过就返回缩小后的尺寸，用来验证"重复开启不会覆盖存档"
        const last = calls.filter((c) => c[0] === 'bounds').pop();
        return last ? Object.assign({}, orig, last[1]) : Object.assign({}, orig);
      },
    };
  }
  return w;
}
function boundsCalls(w) {
  return w.__calls.filter((c) => c[0] === 'bounds').map((c) => c[1]);
}
function onTopCalls(w) {
  return w.__calls.filter((c) => c[0] === 'onTop').map((c) => c[1]);
}
function freshPomo() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS.pomodoro));
}

console.log('\n[1] 默认态：关闭，且没有残留存档');
{
  const d = freshPomo();
  check('deskDock 默认 false', d.deskDock === false, d.deskDock);
  check('deskDockRestore 默认 null', d.deskDockRestore === null, d.deskDockRestore);
  check('默认尺寸 365×378', pomowin.DESK_DOCK_W === 365 && pomowin.DESK_DOCK_H === 378);
}

console.log('\n[2] 开启：缩小 + 置顶 + 右下角');
{
  const w = fakeWin();
  global.activeWindow = w;
  const s = freshPomo();
  const r = pomowin.applyDeskDock(true, s);
  check('返回 ok', r.ok === true, JSON.stringify(r));
  check('记录了原尺寸 1400×900', !!s.deskDockRestore && s.deskDockRestore.width === 1400 && s.deskDockRestore.height === 900, JSON.stringify(s.deskDockRestore));
  check('记录了原位置 x=100 y=50', s.deskDockRestore.x === 100 && s.deskDockRestore.y === 50, JSON.stringify(s.deskDockRestore));
  const bs = boundsCalls(w);
  const last = bs[bs.length - 1];
  check('按 365×378 定型', last.width === 365 && last.height === 378, JSON.stringify(last));
  check('落在右下角 x=1543（1920-12-365）', last.x === 1543, last.x);
  check('落在右下角 y=650（1040-12-378）', last.y === 650, last.y);
  check('已置顶', onTopCalls(w).indexOf(true) >= 0, JSON.stringify(onTopCalls(w)));
}

console.log('\n[3] 重复开启：不能把缩小后的尺寸存成"原尺寸"');
{
  const w = fakeWin();
  global.activeWindow = w;
  const s = freshPomo();
  pomowin.applyDeskDock(true, s);
  const first = JSON.parse(JSON.stringify(s.deskDockRestore));
  pomowin.applyDeskDock(true, s); // 已经是小窗时再开一次
  check('存档没被覆盖成 365×378', s.deskDockRestore.width === 1400, s.deskDockRestore.width);
  check('存档与首次一致', JSON.stringify(s.deskDockRestore) === JSON.stringify(first));
}

console.log('\n[4] 关闭：还原原尺寸原位置，并清空存档');
{
  const w = fakeWin();
  global.activeWindow = w;
  const s = freshPomo();
  pomowin.applyDeskDock(true, s);
  const r = pomowin.applyDeskDock(false, s);
  check('返回 restored', r.restored === true, JSON.stringify(r));
  const bs = boundsCalls(w);
  const last = bs[bs.length - 1];
  check('还原成 1400×900', last.width === 1400 && last.height === 900, JSON.stringify(last));
  check('还原回原位置 x=100 y=50', last.x === 100 && last.y === 50, JSON.stringify(last));
  check('取消置顶', onTopCalls(w).indexOf(false) >= 0, JSON.stringify(onTopCalls(w)));
  check('存档已清空（不积累废弃数据）', s.deskDockRestore === null, JSON.stringify(s.deskDockRestore));
}

console.log('\n[5] 拿不到 Electron 接口：优雅降级');
{
  const w = fakeWin({ electron: false });
  global.activeWindow = w;
  const s = freshPomo();
  let threw = false;
  let r;
  try {
    r = pomowin.applyDeskDock(true, s);
  } catch (e) {
    threw = true;
  }
  check('不抛异常', threw === false);
  check('reason=no-electron', r && r.reason === 'no-electron', r && r.reason);
  check('未记录存档', s.deskDockRestore === null);
}

console.log('\n[6] 自定义尺寸与位置');
{
  const w = fakeWin();
  global.activeWindow = w;
  const s = freshPomo();
  s.deskDockWidth = 500;
  s.deskDockHeight = 300;
  s.deskDockPos = 'top-left';
  pomowin.applyDeskDock(true, s);
  const last = boundsCalls(w).pop();
  check('用自定义 500×300', last.width === 500 && last.height === 300, JSON.stringify(last));
  check('落在左上角 x=12 y=12', last.x === 12 && last.y === 12, JSON.stringify(last));
}
{
  const w = fakeWin();
  global.activeWindow = w;
  const s = freshPomo();
  s.deskDockOnTop = false;
  pomowin.applyDeskDock(true, s);
  check('deskDockOnTop=false 时调用 setAlwaysOnTop(false)', onTopCalls(w).indexOf(false) >= 0, JSON.stringify(onTopCalls(w)));
}

console.log('\n[7] 迁移清洗：脏配置不能带进运行时');
{
  const dirty = {
    pomodoro: {
      deskDock: 'yes',
      deskDockOnTop: 1,
      deskDockWidth: -5,
      deskDockHeight: 'abc',
      deskDockPos: 'nowhere',
      deskDockRestore: { width: 0, height: 0 },
    },
  };
  const m = migrateSettings(dirty);
  const p = m.pomodoro;
  check('deskDock 非布尔 → false', p.deskDock === false, p.deskDock);
  check('deskDockOnTop 非布尔 → 默认 true', p.deskDockOnTop === true, p.deskDockOnTop);
  check('宽度负数 → 0', p.deskDockWidth === 0, p.deskDockWidth);
  // 'abc' 类型不符，pickKnown 会直接退回默认值 378 —— 这也是合法的清洗结果，
  // 断言"最终是有限非负整数"即可，不必咬死是 0 还是默认值。
  check('高度非数字 → 有限非负整数', Number.isFinite(p.deskDockHeight) && p.deskDockHeight >= 0, p.deskDockHeight);
  check('位置非法 → 默认右下角', p.deskDockPos === 'bottom-right', p.deskDockPos);
  check('残缺存档 → null', p.deskDockRestore === null, JSON.stringify(p.deskDockRestore));
}
{
  const good = { pomodoro: { deskDockRestore: { x: 1, y: 2, width: 1400, height: 900 } } };
  const m = migrateSettings(JSON.parse(JSON.stringify(good)));
  check('完整存档被保留', m.pomodoro.deskDockRestore.width === 1400, JSON.stringify(m.pomodoro.deskDockRestore));
}

console.log('\n[8] 反证：这些断言抓得住回归');
{
  // 若还原时不清存档，第 4 组那条就会失败——这里确认存档字段确实存在
  const s = freshPomo();
  check('deskDockRestore 字段在默认配置里存在', 'deskDockRestore' in s);
  check('isBounds 拒绝残缺对象', pomowin.isBounds({ width: 0, height: 0 }) === false);
  check('isBounds 接受完整对象', pomowin.isBounds({ x: 0, y: 0, width: 800, height: 600 }) === true);
}


console.log('\n[9] 缩小的是"本窗口"，不是有焦点的那个窗口');
{
  const local = fakeWin({ orig: { x: 10, y: 20, width: 1400, height: 900 } });
  const other = fakeWin({ orig: { x: 0, y: 0, width: 800, height: 600 } });
  global.window = local;
  global.activeWindow = other; // 焦点在别的窗口上（开过独立窗口就会这样）
  const s = freshPomo();
  const r = pomowin.applyDeskDock(true, s);
  check('开启成功', r.ok === true, r.reason);
  check('缩小的是本地 window', boundsCalls(local).length === 1, JSON.stringify(boundsCalls(local)));
  check('没有动别的窗口', boundsCalls(other).length === 0, JSON.stringify(boundsCalls(other)));
  delete global.window;
  global.activeWindow = other;
  const s2 = freshPomo();
  pomowin.applyDeskDock(true, s2);
  check('没有本地 window 时退回 activeWindow', boundsCalls(other).length === 1);
  delete global.activeWindow;
}

console.log('\n[10] 开启后离开设置页，切回笔记界面');
{
  const pomo = require(__dirname + '/../src/pomodoro.js');
  const { leaveSettingsForDock, clickSettingsClose } = pomo;
  check('leaveSettingsForDock 已导出', typeof leaveSettingsForDock === 'function');
  check('clickSettingsClose 已导出', typeof clickSettingsClose === 'function');

  function fakeApp(opts) {
    const o = opts || {};
    const log = [];
    const leaf = { __id: 'md-leaf' };
    const app = {
      log: log,
      setting: o.throwClose
        ? { close() { throw new Error('boom'); } }
        : { close() { log.push('close-setting'); } },
      workspace: {
        getLeavesOfType(t) { log.push('leaves:' + t); return o.noLeaf ? [] : [leaf]; },
        getMostRecentLeaf() { log.push('recent'); return o.noLeaf ? null : leaf; },
        setActiveLeaf(l, opt) { log.push('active:' + (l && l.__id)); },
      },
    };
    return app;
  }

  {
    const app = fakeApp();
    const floatUI = { shown: 0, show() { this.shown += 1; } };
    const moved = leaveSettingsForDock({ app: app }, { floatUI: floatUI });
    check('离开了设置页', moved === true);
    check('关闭了设置页', app.log.indexOf('close-setting') >= 0, JSON.stringify(app.log));
    check('切到了笔记叶子', app.log.indexOf('active:md-leaf') >= 0, JSON.stringify(app.log));
    check('浮窗被显示', floatUI.shown === 1, floatUI.shown);
  }
  {
    // 关设置页抛异常：不能连累整个开关，仍要走切叶子的路
    const app = fakeApp({ throwClose: true });
    let threw = false;
    let moved = false;
    try { moved = leaveSettingsForDock({ app: app }, null); } catch (e) { threw = true; }
    check('设置页关闭失败也不抛异常', threw === false);
    check('设置页关闭失败后仍切了叶子', moved === true && app.log.indexOf('active:md-leaf') >= 0, JSON.stringify(app.log));
  }
  {
    // 没有 markdown 叶子：退回最近叶子；再没有也不能炸
    const app = fakeApp({ noLeaf: true });
    let threw = false;
    try { leaveSettingsForDock({ app: app }, null); } catch (e) { threw = true; }
    check('无叶子时不抛异常', threw === false);
  }
  {
    let threw = false;
    try { leaveSettingsForDock(null, null); } catch (e) { threw = true; }
    check('没有 app 时不抛异常', threw === false);
  }

  // 源码接线：两处入口都得调，只改一处等于开关在设置页里仍然不对
  const src = require('fs').readFileSync(__dirname + '/../src/pomodoro.js', 'utf8');
  const cmdPart = src.slice(src.indexOf('toggleDeskDock() {'), src.indexOf('toggleDeskDock() {') + 900);
  check('命令入口会离开设置页', cmdPart.indexOf('leaveSettingsForDock') >= 0);
  const uiPart = src.slice(src.indexOf("'桌面常驻（缩小主窗口）'"), src.indexOf("'桌面常驻（缩小主窗口）'") + 1400);
  check('设置页入口会离开设置页', uiPart.indexOf('leaveSettingsForDock') >= 0);
  check('非浮窗形态会提醒', src.indexOf('小窗里看不到番茄钟') >= 0);
}

/*
 * [11] DOM 兜底关闭设置页。
 *
 * 为什么单独测：v2.97 的实测现象是"开关点了、窗口也缩小了，但设置页没关"——
 * app.setting.close() 的 typeof 检查只能挡住"方法不存在"，
 * 挡不住"方法存在却没关闭"。所以必须有 DOM 兜底这一层，
 * 而且这层必须真的点得到按钮，不能只是"调用了 click"。
 */
console.log('\n[11] 设置页关闭的 DOM 兜底');
{
  const pomo = require(__dirname + '/../src/pomodoro.js');
  const { leaveSettingsForDock, clickSettingsClose } = pomo;

  function fakeDoc(opts) {
    const o = opts || {};
    const clicked = [];
    const btn = {
      click() {
        clicked.push('close');
      },
    };
    const modal = {
      querySelector(sel) {
        return sel === '.modal-close-button' && !o.noBtn ? btn : null;
      },
    };
    return {
      __clicked: clicked,
      querySelector(sel) {
        if (o.noModal) return null;
        if (
          sel === '.modal-container .modal.mod-settings' ||
          sel === '.modal.mod-settings' ||
          sel === '.modal-container'
        ) {
          return modal;
        }
        return null;
      },
    };
  }

  {
    const d = fakeDoc();
    const r = clickSettingsClose(d);
    check('点到了设置模态框的关闭按钮', r === true);
    check('关闭按钮真的被 click', d.__clicked.length === 1, JSON.stringify(d.__clicked));
  }
  {
    check('没有模态框时不点', clickSettingsClose(fakeDoc({ noModal: true })) === false);
    check('没有关闭按钮时不点', clickSettingsClose(fakeDoc({ noBtn: true })) === false);
    check('没有 document 时不炸', clickSettingsClose(null) === false);
  }
  {
    // 关键场景：app.setting 根本没有 close 方法（内部 API 变了 / 不存在）。
    // 这时只剩 DOM 兜底，它必须独立把设置页关掉。
    const d = fakeDoc();
    const savedDoc = global.document;
    global.document = d;
    const app = {
      setting: {}, // 故意没有 close
      workspace: {
        getLeavesOfType() {
          return [];
        },
        getMostRecentLeaf() {
          return null;
        },
      },
    };
    const moved = leaveSettingsForDock({ app: app }, null);
    global.document = savedDoc;
    check('内部 API 缺失时靠 DOM 仍能关掉设置页', moved === true);
    check('DOM 兜底确实点了按钮', d.__clicked.length === 1, JSON.stringify(d.__clicked));
  }
  {
    // 失败要能反馈给用户，不能闷声
    const src = require('fs').readFileSync(__dirname + '/../src/pomodoro.js', 'utf8');
    check('关不掉时会提示手动关闭', src.indexOf('没能自动离开设置页') >= 0);
  }
}

console.log('\n———————————————');
console.log(fail === 0 ? `桌面常驻：${total} 项全部通过 ✅` : `桌面常驻：${total} 项，失败 ${fail} ❌`);
process.exit(fail === 0 ? 0 : 1);
