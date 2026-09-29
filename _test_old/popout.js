/*
 * 独立窗口（pop-out）跨窗口同步测试。
 *
 * 两个控制器共享同一个假适配器，模拟「主窗口 + 独立窗口」各有一份插件实例。
 * 重点验证三件事：
 *   1. 只有一个实例推进段切换（否则结束时会重复记录两次）；
 *   2. 拥有者消失后能被接管，且倒计时不丢；
 *   3. 绝大多数场景下（没有第二实例）动作必须是同步的，不能被文件读写拖成异步。
 */
'use strict';

const obsidian = require('obsidian');
const path = __dirname + '/../src/';
const { migrateSettings } = require(path + 'settings.js');
const pomodoro = require(path + 'pomodoro.js');
const { RUNTIME_FILE } = require(path + 'pomosync.js');

// mock 的 global.window 只有 setTimeout；番茄钟的 startTicker 用 window.setInterval
global.window = global.window || {};
global.__modals = []; // mock 的 Modal.open 会往这里塞记录
global.window.setInterval = (fn, ms) => setInterval(fn, ms);
global.window.clearInterval = (id) => clearInterval(id);

let fail = 0;
let total = 0;
function check(name, cond, extra) {
  total += 1;
  if (cond) {
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : ''));
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 把共享文件里的时间戳改旧，模拟「拥有者窗口被系统节流 / 合盖，心跳断了」 */
function expireHeartbeat(store) {
  const s = JSON.parse(store[RUNTIME_FILE]);
  s.updatedAt = Date.now() - 20000;
  store[RUNTIME_FILE] = JSON.stringify(s);
}

/** 假适配器：用普通对象当「共享文件」，两个实例都读写它 */
function makeAdapter(store) {
  return {
    async read(p) {
      if (!(p in store)) throw new Error('ENOENT: ' + p);
      return store[p];
    },
    async write(p, d) {
      store[p] = d;
    },
    async remove(p) {
      delete store[p];
    },
  };
}

function boot(store, mutate) {
  const settings = migrateSettings(null);
  settings.pomodoro.uiMode = 'popout';
  settings.pomodoro.soundEnabled = false;
  settings.pomodoro.notifyOnSegmentEnd = false;
  if (mutate) mutate(settings);
  const adapter = store ? makeAdapter(store) : null;
  const plugin = new obsidian.Plugin(
    {
      workspace: {
        getLeavesOfType: () => [],
        getRightLeaf: () => null,
        revealLeaf: () => {},
        detachLeavesOfType: () => {},
        activeEditor: null,
        on: () => ({}),
        openPopoutLeaf: () => null,
      },
      setting: null,
      vault: { adapter },
      commands: { listCommands: () => [] },
    },
    { id: 'time-tools' }
  );
  plugin.settings = settings;
  plugin.saveSettings = async () => {};
  plugin.redrawSettingsTab = () => {};
  plugin.openSettings = () => {};
  plugin.registerEvent = () => {};
  plugin.registerInterval = () => {};
  plugin.manifest = { id: 'time-tools', name: 'Time Tools', version: '0.0.0' };
  const ctrl = new pomodoro.PomodoroController(plugin);
  plugin.pomodoro = ctrl;
  // 必须真的把调用记下来：否则「写了几次」这类断言永远拿到 0，
  // 等于给重复记录的 bug 背书（踩过一次：mock 不记账，测试全绿但功能是坏的）
  plugin.recorder = {
    calls: [],
    async record(d) {
      this.calls.push(d);
      return '笔记.md';
    },
  };
  ctrl.init();
  ctrl.expire = () => {
    ctrl.endsAt = Date.now() - 1;
    ctrl.tick();
  };
  return ctrl;
}

(async () => {
  console.log('\n[1] 没有第二实例时，动作必须同步生效');
  {
    const c = boot(null);
    c.startSession(null, 'study');
    check('开始后立刻进入专注（不被 await 拖成异步）', c.state === 'focus', c.state);
    c.togglePause();
    check('暂停立刻生效', c.state === 'paused', c.state);
    c.togglePause();
    check('继续立刻生效', c.state === 'focus', c.state);
    check('归属直接确认（无需交接）', c.isSessionOwner && c.ownerConfirmed);
    c.stop();
  }

  console.log('\n[2] 开窗后控制权交接：一个推进，另一个只镜像');
  const store = {};
  const a = boot(store);   // 主窗口实例
  const b = boot(store);   // 独立窗口实例
  check('独立窗口形态下不自认拥有者', a.isSessionOwner === false && b.isSessionOwner === false);
  await a.startSession(null, 'study');
  check('共享文件已写入', typeof store[RUNTIME_FILE] === 'string');
  check('开窗后主实例交出控制权', a.isSessionOwner === false, a.isSessionOwner);
  await b.sync.poll();
  check('独立窗口接管成为拥有者', b.isSessionOwner === true && b.ownerConfirmed === true);
  await a.sync.poll();
  check('主实例降级为镜像', a.isSessionOwner === false, a.isSessionOwner);
  check('镜像拿到同一段状态', a.state === 'focus', a.state);
  check('镜像拿到同一个结束时间戳', a.endsAt === b.endsAt, `${a.endsAt} vs ${b.endsAt}`);

  a.expire();
  check('镜像到点不推进段切换', a.state === 'focus', a.state);
  check('镜像不写笔记', b.plugin.recorder.calls.length === 0);
  b.expire();
  check('拥有者到点才推进', b.state === 'short', b.state);

  console.log('\n[3] 拥有者消失后由镜像接管');
  await b.sync.write(true); // 先落一次最新状态
  const saved = JSON.parse(store[RUNTIME_FILE]);
  const beforeTakeover = saved.endsAt; // 接管前那一刻的结束时间戳
  saved.updatedAt = Date.now() - 20000; // 制造心跳过期
  store[RUNTIME_FILE] = JSON.stringify(saved);
  await a.sync.poll();
  check('心跳过期后镜像接管', a.isSessionOwner === true, a.isSessionOwner);
  check('接管后拿到归属确认', a.ownerConfirmed === true);
  check('接管后倒计时不丢（沿用绝对结束时间戳）', a.endsAt === beforeTakeover, `${a.endsAt} vs ${beforeTakeover}`);

  console.log('\n[4] 未确认归属时不推进（防两个实例同时判定结束）');
  {
    const c = boot(store);
    c.isSessionOwner = true;
    c.ownerConfirmed = false;
    c.state = 'focus';
    c.endsAt = Date.now() + 60000;
    c.expire();
    check('未确认前到点不推进', c.state === 'focus', c.state);
    c.ownerConfirmed = true;
    c.expire();
    check('确认后才推进', c.state === 'short', c.state);
    c.stop();
  }

  console.log('\n[5] 交出控制权与清理');
  {
    const s2 = {};
    const m = boot(s2);
    const p = boot(s2);
    await m.startSession(null, 'study');
    await m.sync.release();
    check('release 后归属为空', JSON.parse(s2[RUNTIME_FILE]).owner === null);
    await p.sync.poll();
    check('空缺归属可被立刻接管', p.isSessionOwner === true, p.isSessionOwner);
    p.stop();
    await sleep(10);
    check('会话结束后共享文件被清除', !(RUNTIME_FILE in s2), Object.keys(s2).join(','));
  }

  console.log('\n[6] 冷启动：过期残留一律丢弃');
  {
    const s3 = {};
    s3[RUNTIME_FILE] = JSON.stringify({
      v: 1, owner: 'x', updatedAt: Date.now() - 3600000, active: true,
      state: 'focus', endsAt: Date.now() - 3600000, segmentTotalMs: 1500000,
    });
    const c = boot(s3);
    const adopted = await c.sync.adoptOnBoot();
    check('过期文件不接管', adopted === false, adopted);
    check('过期文件被清掉', !(RUNTIME_FILE in s3));
    check('控制器保持未开始', c.state === 'idle', c.state);
  }

  console.log('\n[7] 窗口尺寸与降级');
  {
    const c = boot(null);
    // 默认尺寸现在是 616×406，要显式清成 0 才是「交给系统」
    c.settings.popoutWidth = 0;
    c.settings.popoutHeight = 0;
    check('尺寸为 0 时不传参', c.popoutWindowData() === null, JSON.stringify(c.popoutWindowData()));
    c.settings.popoutWidth = 616;
    c.settings.popoutHeight = 406;
    const pd = c.popoutWindowData();
    check('默认 616×406 会传给 openPopoutLeaf', !!(pd && pd.size.width === 616 && pd.size.height === 406), JSON.stringify(pd));
    c.settings.popoutWidth = 400.6;
    c.settings.popoutHeight = 300;
    const d = c.popoutWindowData();
    check('填了尺寸才传（并取整）', d && d.size.width === 401 && d.size.height === 300, JSON.stringify(d));
    delete c.app.workspace.openPopoutLeaf;
    let ok = null;
    try {
      ok = await c.openPopout();
    } catch (e) {
      ok = 'THREW';
    }
    check('不支持 pop-out 时回退而非抛异常', ok !== 'THREW', ok);

    // 已有视图时不再叠开：把 openPopoutLeaf 换成「一调用就抛」的探针
    const c2 = boot(null);
    c2.app.workspace.getLeavesOfType = () => [{ id: 'existing' }];
    c2.app.workspace.revealLeaf = () => {};
    c2.app.workspace.openPopoutLeaf = () => {
      throw new Error('不该再开一个窗口');
    };
    const ok2 = await c2.openPopout();
    check('本窗口已有番茄钟视图时不再叠开', ok2 === true, ok2);
  }

  console.log('\n[8] 界面形态是枚举，脏值要洗掉');
  {
    const s = migrateSettings({ pomodoro: { uiMode: 'popuot' } });
    check('拼错的形态退回浮窗', s.pomodoro.uiMode === 'floating', s.pomodoro.uiMode);
    const s2 = migrateSettings({ pomodoro: { uiMode: 'popout', popoutWidth: 'abc', popoutHeight: -5 } });
    // 类型不符（'abc' 是 string）由 pickKnown 回退默认 616；同类型的负数才走到值域校验归零
    check('非法尺寸被清洗', s2.pomodoro.popoutWidth === 616 && s2.pomodoro.popoutHeight === 0,
      `${s2.pomodoro.popoutWidth}/${s2.pomodoro.popoutHeight}`);
  }

  console.log('\n[9] 拥有者被顶替后必须自知（否则两段各记一次）');
  {
    /*
     * 这是独立窗口模式下最隐蔽的一个坑：
     * 镜像接管时会把文件里的 owner 改成自己，但**原拥有者从不读文件**，
     * 它不知道自己已被顶替，于是继续推进段切换、继续弹小结、继续写笔记。
     * 触发条件很普通 —— 拥有者所在窗口被系统节流 / 合盖，心跳断超过 STALE_MS。
     */
    const store = {};
    const a = boot(store);
    const b = boot(store);
    // 打开自动记录，否则结束弹窗不会写笔记，也就看不出重复
    a.plugin.settings.record.enabled = true;
    a.plugin.settings.record.autoRecord = true;
    // 两边各有一份设置对象（模拟两个窗口各自加载的插件实例），都要开
    b.plugin.settings.record.enabled = true;
    b.plugin.settings.record.autoRecord = true;
    await a.startSession(1, 'study'); // 一轮就结束，便于观察小结弹窗
    await b.sync.poll(); // b 接管
    expireHeartbeat(store); // 制造 b 心跳过期
    await a.sync.poll(); // a 接管（此刻 b 还蒙在鼓里）
    check('接管瞬间两边都自认拥有者（这正是要修的）', a.isSessionOwner && b.isSessionOwner);

    // b 轮询几次后应通过归属校验发现自己被顶替
    for (let i = 0; i < 4; i++) await b.sync.poll();
    check('原拥有者校验后降级为镜像', b.isSessionOwner === false, b.isSessionOwner);

    global.__modals = [];
    a.expire();
    a.expire(); // a 跑完一轮，会话结束
    b.expire();
    b.expire(); // b 若仍是拥有者会再结束一次
    await sleep(120);
    const modals = global.__modals.filter((m) => m.constructor.name === 'SummaryModal');
    check('只弹一个小结弹窗', modals.length === 1, modals.length);
    modals.forEach((m) => m.dismiss()); // 自动记录在弹窗关闭时触发
    await sleep(150);
    const writes = a.plugin.recorder.calls.length + b.plugin.recorder.calls.length;
    check('只写一条记录（不重复）', writes === 1, writes);
  }

  console.log('\n[10] 拥有者结束会话后，镜像必须跟着归位');
  {
    const store = {};
    const a = boot(store);
    const b = boot(store);
    await a.startSession(null, 'study');
    await b.sync.poll(); // b 是拥有者
    global.__modals = [];
    b.stop(); // 拥有者结束
    await sleep(80);
    check('拥有者侧弹小结', global.__modals.length === 1, global.__modals.length);
    for (let i = 0; i < 4; i++) await a.sync.poll();
    check('镜像归位到未开始（不会停在旧倒计时）', a.state === 'idle', a.state);
    check('镜像不再自认拥有者', a.isSessionOwner === false, a.isSessionOwner);
    check('镜像没有多弹小结', global.__modals.length === 1, global.__modals.length);
  }

  console.log('\n[11] 非独立窗口形态下，结束会话必须保持同步手感');
  {
    const c = boot(null);
    c.settings.uiMode = 'floating';
    c.startSession(null, 'study');
    global.__modals = [];
    c.stop();
    check('点结束立刻弹小结（不被文件读写拖成异步）', global.__modals.length === 1, global.__modals.length);
  }

  console.log(`\n${fail === 0 ? '全部通过' : '有 ' + fail + ' 项失败'}（共 ${total} 项）`);
  process.exit(fail === 0 ? 0 : 1);
})();
