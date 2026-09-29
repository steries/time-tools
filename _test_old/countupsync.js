/*
 * 正计时的跨窗口同步（v3.13 修的独立窗口达上限不同步）。
 *
 * 背景：pomosync 的 SYNC_KEYS 原本没有正计时的四个字段，
 * 于是镜像窗口只能用自己的本地基线（初始为 0 / Date.now()）：
 *   · 两边显示的「已专注时长」对不上；
 *   · 主窗口达上限停表后，镜像的 countUp 仍是 true，一旦接管会继续累加。
 *
 * 本套件验证：
 *   1. 四个字段进了同步清单，且能真的传到另一个实例；
 *   2. countUp 是布尔，不能被 num() 压成 0/1（否则 === true 的判断全失效）；
 *   3. 达上限后镜像跟着停表，不再停在旧数字上。
 */
'use strict';

const obsidian = require('obsidian');
const path = __dirname + '/../src/';
const { migrateSettings } = require(path + 'settings.js');
const pomodoro = require(path + 'pomodoro.js');
const { RUNTIME_FILE, SYNC_KEYS } = require(path + 'pomosync.js');

global.window = global.window || {};
global.__modals = [];
global.__notices = []; // mock 的 Notice 会往这里塞提示（上限停表会弹一条）
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

const NEED = ['countUp', 'countUpBaseMs', 'countUpStartAt', 'countUpRemindCount'];

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
        detachLeavesOfType: () => [],
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
  plugin.recorder = {
    calls: [],
    async record(d) {
      this.calls.push(d);
      return '笔记.md';
    },
  };
  ctrl.init();
  return ctrl;
}

(async () => {
  console.log('\n[1] 同步清单必须包含正计时的四个字段');
  NEED.forEach((k) => {
    check('SYNC_KEYS 含 ' + k, SYNC_KEYS.indexOf(k) >= 0);
  });

  console.log('\n[2] countUp 必须是布尔，不能被压成数字');
  {
    const store = {};
    const a = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 0;
    });
    const b = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 0;
    });
    await a.startSession(null, 'study');
    check('拥有者已进入正计时', a.countUp === true, a.countUp);
    // 让镜像轮询一次
    await b.sync.poll();
    check('镜像拿到 countUp === true（不是 1）', b.countUp === true, typeof b.countUp + ':' + b.countUp);
    check('镜像拿到与主窗口一致的开始时刻', b.countUpStartAt === a.countUpStartAt,
      b.countUpStartAt + ' vs ' + a.countUpStartAt);
    check('镜像的已过时长与主窗口一致（误差 1s 内）',
      Math.abs(b.remainMs() - a.remainMs()) < 1000,
      b.remainMs() + ' vs ' + a.remainMs());
    a.stop();
  }

  console.log('\n[3] 达上限后镜像跟着停表，不再停在旧数字');
  {
    const store = {};
    const a = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 1; // 1 分钟上限，便于触发
    });
    const b = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 1;
    });
    await a.startSession(null, 'study');
    await a.ensureOwnerAsync(); // tick 只在归属确认后才推进，独立窗口形态必须等这一步
    await b.sync.poll();
    check('触发前镜像处于专注', b.state === 'focus', b.state);

    // 把开始时刻往前推 2 分钟，模拟已经跑过上限
    a.countUpStartAt = Date.now() - 2 * 60 * 1000;
    a.tick();
    check('拥有者已停表回待开始', a.state === 'idle', a.state);
    check('拥有者的 countUp 已归 false', a.countUp === false, a.countUp);

    await sleep(50);
    await b.sync.poll();
    check('镜像也退场（不再停在旧的计时数字上）', b.state === 'idle', b.state);
    check('镜像的 countUp 也归 false', b.countUp === false, b.countUp);
    a.stop();
    b.stop();
  }

  console.log('\n[4] 间隔提醒次数同步（两边不重复提醒）');
  {
    const store = {};
    const a = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 0;
      s.pomodoro.countUpRemindEveryMin = 20;
      s.pomodoro.notifyOnSegmentEnd = true;
    });
    const b = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 0;
      s.pomodoro.countUpRemindEveryMin = 20;
    });
    await a.startSession(null, 'study');
    await a.ensureOwnerAsync();
    a.countUpStartAt = Date.now() - 25 * 60 * 1000; // 已过 25 分钟 → 第 1 拍
    a.tick();
    check('拥有者已发第 1 拍', a.countUpRemindCount === 1, a.countUpRemindCount);
    await b.sync.poll();
    check('镜像同步到提醒计数（不会重复发同一拍）', b.countUpRemindCount === 1, b.countUpRemindCount);
    a.stop();
    b.stop();
  }

  console.log('\n[5] 达上限后心跳不得把会话标成 active（镜像要能退场）');
  {
    /*
     * 这是 v3.26 修的真 bug：heartbeat 写死 write(true)，
     * 而 ensureOwner / release 都按 state !== IDLE 判断 active。
     * 正计时达上限后 state 已是 idle、拥有者却还在位，心跳于是把共享文件
     * 重新标成 active:true —— 镜像端据此走「镜像」分支而不是退场分支，
     * 浮窗不隐藏，卡在「会话还在跑但已经停表」的中间态。
     * 注意必须跨过 HEARTBEAT_MS 节流，否则心跳被跳过、测不到东西。
     */
    const store = {};
    const FILE = '.obsidian/plugins/time-tools/pomo-runtime.json';
    const a = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 1;
    });
    const b = boot(store, (s) => {
      s.pomodoro.countUp = true;
      s.pomodoro.countUpMaxMin = 1;
    });
    await a.startSession(null, 'study');
    await a.ensureOwnerAsync();
    await b.sync.poll();
    // 给镜像挂一个可观测的浮窗，用来分辨「退场」与「继续镜像」
    let hidden = 0;
    b.floatUI = { hide() { hidden += 1; }, show() {}, update() {} };

    a.countUpStartAt = Date.now() - 2 * 60 * 1000; // 已过 2 分钟 > 1 分钟上限
    a.tick();
    check('拥有者已停表回待开始', a.state === 'idle', a.state);
    await sleep(30);

    a.sync.lastWriteAt -= 3000; // 跨过 HEARTBEAT_MS（2000）节流
    a.sync.heartbeat();
    await sleep(30);
    const snap = JSON.parse(store[FILE]);
    check('停表后共享文件 active 必须为 false', snap.active === false, snap.active);
    check('停表后共享文件 state 为 idle', snap.state === 'idle', snap.state);

    await b.sync.poll();
    check('镜像退场：不再把自己当拥有者', b.isSessionOwner === false, b.isSessionOwner);
    check('镜像退场：浮窗已隐藏（走的是退场分支，不是镜像分支）', hidden >= 1, hidden);
    a.stop();
    b.stop();
  }

  console.log('\n' + (fail === 0 ? '✅ 全部通过' : '❌ 失败 ' + fail + ' 项') + '（共 ' + total + ' 项）');
  process.exit(fail === 0 ? 0 : 1);
})();
