/*
 * 正计时（count-up）回归测试
 * ------------------------------------------------------------------
 * 需求：番茄钟加正计时 —— 专注段从 0 往上累加、不自动结束，
 * 由用户点「跳过」或结束会话来停。配套：软目标提醒、超一小时补小时位。
 *
 * 这里测的是**产物里真实的 PomodoroController**，不在测试里重写判断逻辑。
 *
 * 最容易写错的三个点，各有一组断言守着：
 *   ① 第一帧 remainMs 还是 0 —— 若让倒计时那条「剩余归零即结束」接管，
 *      正计时一开始就会被判定成「这一段结束了」。（段一结束，状态就跑到休息）
 *   ② 正计时暂停期间不能继续累加 —— 暂停是暂停，计时器停了数字也该停。
 *   ③ 只对专注段生效 —— 休息段正计时没有意义，必须仍走倒计时。
 */

'use strict';

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

global.document = Object.assign({}, global.document, {
  createElement: (tag) => new realObsidian.MockEl(tag),
  body: { appendChild() {} },
});

const notices = [];
global.__modals = [];
global.__buttons = [];
const obsidian = Object.create(realObsidian);
obsidian.Notice = function (msg) {
  notices.push(String(msg));
};

global.window = Object.assign({}, global.window, {
  addEventListener() {},
  removeEventListener() {},
  setInterval: () => 0, // 不让真定时器跑起来：时间推进由测试直接改 startAt
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

console.log('\n番茄钟正计时：只累加、不自动结束、暂停即停、只对专注段生效\n');

ok('产物可拿到真实 PomodoroController', typeof PomodoroController === 'function');
if (typeof PomodoroController !== 'function') {
  console.log('\n无法继续：产物未暴露 PomodoroController\n');
  process.exit(1);
}

/** 造一个不碰界面的控制器：没有浮窗、没有视图、没有状态栏 */
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
      notifyOnSegmentEnd: true,
      pauseThreshold: 3,
      // 默认不写 countUp —— 模拟老配置升级：缺这个键就等于关
    },
    overrides || {}
  );
  const plugin = {
    // record 必须有：会话小结弹窗要读它决定要不要显示「记录」按钮
    settings: { pomodoro, record: { enabled: false } },
    app: { workspace: { getLeavesOfType: () => [] } },
    saveSettings: async () => {},
    addStatusBarItem: () => ({}),
    registerInterval: () => {},
  };
  const c = new PomodoroController(plugin);
  c.playSound = () => {}; // 出声不在测试范围；软目标那组要断言它被触发过
  c.refreshUI = () => {};
  return c;
}

/* ---------------- ① 默认仍是倒计时（老配置升级不能变行为） ---------------- */
{
  const c = makeCtrl();
  c.startSegment('focus', 25);
  ok('默认（无 countUp 键）不是正计时', c.countUp === false, String(c.countUp));
  const first = c.remainMs();
  ok('默认仍按剩余时间走（约 25 分钟）', first > 24 * 60000 && first <= 25 * 60000, first);
  c.clearTicker();
}

/* ---------------- ② 正计时：只往上累加 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  ok('开启后专注段进入正计时', c.countUp === true, String(c.countUp));

  const t0 = c.remainMs();
  ok('刚开始时已过时长约为 0', t0 < 100, t0);

  // 把起点往前挪 1 小时 —— 等价于真跑了 1 小时，不用等
  c.countUpStartAt -= 60 * 60 * 1000;
  const t1 = c.remainMs();
  ok('推进 1 小时后已过时长约 60 分钟', t1 > 3599000 && t1 < 3601000, t1);
  ok('正计时时 remainMs 返回的是已过时长（递增而非递减）', t1 > t0);
  c.clearTicker();
}

/* ---------------- ③ 永不自动结束（最关键的一条） ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 10 * 60 * 60 * 1000; // 跑了 10 小时，远超任何番茄时长
  c.tick();
  ok('正计时跑 10 小时后仍在专注段（没有自动结束）', c.state === 'focus', c.state);
  ok('正计时跑 10 小时后没有被切到休息', c.state !== 'short' && c.state !== 'long', c.state);
  ok('正计时期间不弹「专注结束」通知', notices.length === 0, JSON.stringify(notices));
  c.clearTicker();

  /*
   * 最危险的一帧：刚开始、已过时长恰好为 0。
   * 倒计时那条「剩余归零 = 这段结束了」若没被正计时分支挡住，
   * 就会在开头这一帧把段判成结束 —— 计时刚起步就跳到休息。
   */
  const d = makeCtrl({ countUp: true });
  d.startSegment('focus', 25);
  d.countUpStartAt = Date.now(); // 已过 = 0
  d.tick();
  ok('已过时长为 0 的那一帧不会误判成段结束', d.state === 'focus', d.state);
  d.clearTicker();
}

/* ---------------- ④ 暂停即停，恢复继续 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 10 * 60 * 1000; // 已跑 10 分钟
  const before = c.remainMs();
  c.togglePause();
  ok('暂停后状态为 paused', c.state === 'paused', c.state);
  const atPause = c.remainMs();
  ok('暂停瞬间保留已过时长', Math.abs(atPause - before) < 1000, `${before} vs ${atPause}`);

  // 暂停期间时间流逝 30 分钟，数字不该动
  c.countUpStartAt -= 30 * 60 * 1000;
  ok('暂停期间不继续累加', Math.abs(c.remainMs() - atPause) < 1000, c.remainMs());

  c.togglePause();
  ok('恢复后回到专注段', c.state === 'focus', c.state);
  const after = c.remainMs();
  ok('恢复后从暂停时的基数继续（未把暂停时长算进去）', Math.abs(after - atPause) < 1000, after);
  c.clearTicker();
}

/* ---------------- ⑤ 只对专注段生效 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('short', 5);
  ok('休息段不进入正计时（仍走倒计时）', c.countUp === false, String(c.countUp));
  const r = c.remainMs();
  ok('休息段按剩余时间走（约 5 分钟）', r > 4 * 60000 && r <= 5 * 60000, r);
  c.clearTicker();
}

/* ---------------- ⑥ 显示：超过一小时补小时位 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 59 * 60 * 1000 + 30000;
  ok('不足一小时仍是 MM:SS', /^\d{2}:\d{2}$/.test(c.displayTime()), c.displayTime());
  c.countUpStartAt -= 60 * 1000; // 累计约 1 小时 0.5 分
  const txt = c.displayTime();
  ok('超过一小时补小时位（不显示成 60:xx）', /^\d+:\d{2}:\d{2}$/.test(txt), txt);
  ok('超过一小时时小时位为 1', txt.startsWith('1:'), txt);
  c.clearTicker();
}

/* ---------------- ⑦ 软目标：提醒一次，不结束 ---------------- */
{
  notices.length = 0;
  const c = makeCtrl({ countUp: true, countUpTargetMin: 25 });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 30 * 60 * 1000; // 已过 30 分钟 > 目标 25
  c.tick();
  ok('到软目标弹一次提醒', notices.length === 1, JSON.stringify(notices));
  ok('提醒里写明不会自动结束', notices[0].indexOf('不自动结束') >= 0, notices[0]);
  ok('提醒后仍停留在专注段（不结束）', c.state === 'focus', c.state);
  c.tick();
  c.tick();
  ok('软目标只提醒一次，不会反复弹', notices.length === 1, JSON.stringify(notices));
  c.clearTicker();
}

/* ---------------- ⑧ 进度条：有软目标按比例，无软目标留空 ---------------- */
{
  const a = makeCtrl({ countUp: true, countUpTargetMin: 60 });
  a.startSegment('focus', 25);
  a.countUpStartAt -= 30 * 60 * 1000;
  const p = a.segmentProgress();
  ok('有软目标时进度条按比例走（30/60 ≈ 0.5）', p > 0.45 && p < 0.55, p);
  a.clearTicker();

  const b = makeCtrl({ countUp: true, countUpTargetMin: 0 });
  b.startSegment('focus', 25);
  b.countUpStartAt -= 30 * 60 * 1000;
  ok('无软目标时进度条留空（画满会误导成快结束了）', b.segmentProgress() === 0, b.segmentProgress());
  b.clearTicker();
}

/* ---------------- ⑨ 结束一段时，正计时的时长要计入专注总量 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 42 * 60 * 1000; // 实际专注 42 分钟
  c.onSegmentEnd(false);
  ok('正计时的实际时长计入专注总量（42 分钟）', c.focusedMs > 41 * 60000 && c.focusedMs < 43 * 60000, c.focusedMs);
  c.clearTicker();
}

/* ---------------- ⑩ 正计时期间「跳过」= 结束这一段，时长照记 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 8 * 60 * 1000;
  c.skip();
  ok('正计时点跳过后离开专注段', c.state !== 'focus', c.state);
  /*
   * 正计时没有「没做完」这回事 —— 你什么时候停，这一段就是多长。
   * 所以跳过也要把已走时长记进专注总量，且不计入「跳过次数」
   * （跳过次数是倒计时的口径：没做完就撤）。
   * 这条断言原先写的是「跳过不计入专注总量」—— 那是倒计时的约定，
   * 套在正计时上会让统计永远少掉最后一段（正计时只能靠跳过 / 结束收尾）。
   */
  ok('正计时跳过后已走时长计入专注总量（8 分钟）',
    c.focusedMs > 7 * 60000 && c.focusedMs < 9 * 60000, c.focusedMs);
  ok('正计时跳过不计入「跳过次数」', c.skippedFocus === 0, String(c.skippedFocus));
  c.clearTicker();
}


/* ---------------- ⑪ 硬上限：达上限自动停表并提示重置 ---------------- */
{
  // 上限 60 分钟，跑满 61 分钟
  const c = makeCtrl({ countUp: true, countUpMaxMin: 60 });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 61 * 60 * 1000;
  notices.length = 0;
  c.tick();
  ok('达上限后自动停表（状态回到待开始）', c.state === 'idle', c.state);
  ok('达上限后退出正计时标志', c.countUp === false, String(c.countUp));
  ok('达上限必须给用户可见提示（不能只 console.warn）', notices.some((m) => m.indexOf('上限') >= 0), JSON.stringify(notices));
  ok('达上限的那一段不计入专注总量（超时数据不可信）', c.focusedMs === 0, c.focusedMs);
  c.clearTicker();
}

/* ---------------- ⑫ 未达上限 / 不设上限时都不能误停 ---------------- */
{
  const c = makeCtrl({ countUp: true, countUpMaxMin: 60 });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 59 * 60 * 1000; // 差 1 分钟
  notices.length = 0; // 上一组留下的提示不能算在这一组头上
  c.tick();
  ok('未达上限时不停表', c.state === 'focus', c.state);
  ok('未达上限时不发提示', notices.length === 0, JSON.stringify(notices));
  c.clearTicker();

  const z = makeCtrl({ countUp: true, countUpMaxMin: 0 }); // 0 = 不设上限
  z.startSegment('focus', 25);
  z.countUpStartAt -= 100 * 60 * 60 * 1000; // 跑了 100 小时
  z.tick();
  ok('上限填 0（不设上限）时不自动停', z.state === 'focus', z.state);
  z.clearTicker();

  const p2 = makeCtrl({ countUp: true, countUpMaxMin: 60 });
  p2.startSegment('focus', 25);
  p2.countUpStartAt -= 90 * 60 * 1000;
  p2.togglePause();
  notices.length = 0;
  p2.tick();
  ok('暂停期间不触发上限（暂停是暂停）', p2.state === 'paused', p2.state);
  ok('暂停期间不发上限提示', notices.length === 0, JSON.stringify(notices));
  p2.clearTicker();
}

/* ---------------- ⑬ 停表后能重新开始（这就是「让用户重置」） ---------------- */
{
  const c = makeCtrl({ countUp: true, countUpMaxMin: 60 });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 61 * 60 * 1000;
  c.tick();
  c.startSegment('focus', 25); // 相当于用户点「开始」重新计时
  ok('停表后可重新开始，重新进入正计时', c.countUp === true, String(c.countUp));
  ok('重新开始时计数归零', c.remainMs() < 100, c.remainMs());
  c.clearTicker();
}

/* ---------------- ⑭ 暂停 3 次后「重新开始本轮」要真的归零 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 10 * 60 * 1000; // 已跑 10 分钟
  c.togglePause(); c.togglePause(); c.togglePause();
  c.togglePause(); c.togglePause();  // 第 3 次暂停触发询问
  ok('暂停达阈值后弹出重开询问', c.pauseCount >= 3, String(c.pauseCount));
  const m = global.__modals[global.__modals.length - 1];
  ok('弹的是 AskRestartModal', !!(m && typeof m.onRestart === 'function'),
    m && m.constructor ? m.constructor.name : '(无)');
  if (m && typeof m.onRestart === 'function') {
    m.onRestart();
    /*
     * 最关键的一条：正计时只认 countUpBaseMs / countUpStartAt，不认 endsAt。
     * 之前漏了这两行，点「重新开始本轮」界面纹丝不动、接着 10 分钟继续走，
     * 用户看到的就是「重置失效」。
     */
    ok('选「重新开始本轮」后已过时长归零', c.remainMs() < 100, c.remainMs());
    ok('归零后 countUpBaseMs 也为 0', c.countUpBaseMs === 0, String(c.countUpBaseMs));
    ok('归零后回到专注段并继续计时', c.state === 'focus', c.state);
  }
  c.clearTicker();
}

/* ---------------- ⑮ 暂停 3 次后「继续当前进度」不把暂停时长算进去 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 10 * 60 * 1000;
  c.togglePause(); c.togglePause(); c.togglePause();
  c.togglePause(); c.togglePause();
  const atPause = c.remainMs();
  const m = global.__modals[global.__modals.length - 1];
  if (m && typeof m.onResume === 'function') {
    m.onResume();
    ok('选「继续」后以暂停时的已过时长为新起点',
      Math.abs(c.remainMs() - atPause) < 1000, `${c.remainMs()} vs ${atPause}`);
    /*
     * 暂停期间流逝的时间不能算进专注时长。
     * 这里用「把起点再往前挪」来模拟暂停了很久：若没重置起点，数字会跟着变大。
     */
    c.countUpStartAt -= 30 * 60 * 1000; // 恢复后又跑了 30 分钟
    ok('恢复后继续累加（10 + 30 = 40 分钟）',
      Math.abs(c.remainMs() - 40 * 60000) < 2000, c.remainMs());
  }
  c.clearTicker();
}

/* ---------------- ⑯ 间隔提醒：20 / 40 / 60 各一次 ---------------- */
{
  notices.length = 0;
  const c = makeCtrl({ countUp: true, countUpRemindEveryMin: 20 });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 19 * 60 * 1000;
  c.tick();
  ok('不到第一个间隔不提醒', notices.length === 0, JSON.stringify(notices));

  c.countUpStartAt -= 60 * 1000; // 第 20 分钟
  c.tick();
  ok('第 20 分钟提醒一次', notices.length === 1, JSON.stringify(notices));
  ok('提醒里写明具体分钟数', notices[0].indexOf('20 分钟') >= 0, notices[0]);
  c.tick(); c.tick();
  ok('同一间隔不重复提醒', notices.length === 1, JSON.stringify(notices));

  c.countUpStartAt -= 20 * 60 * 1000; // 第 40 分钟
  c.tick();
  ok('第 40 分钟再提醒一次', notices.length === 2, JSON.stringify(notices));
  ok('第 40 分钟的提醒写 40', notices[1].indexOf('40 分钟') >= 0, notices[1]);
  c.clearTicker();
}

/* ---------------- ⑰ 间隔提醒关掉时完全不响 ---------------- */
{
  notices.length = 0;
  const c = makeCtrl({ countUp: true, countUpRemindEveryMin: 0 });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 90 * 60 * 1000;
  c.tick(); c.tick();
  ok('间隔提醒填 0 时完全不弹', notices.length === 0, JSON.stringify(notices));
  c.clearTicker();
}

/* ---------------- ⑱ 结束会话时，正计时在跑的那一段要结进小结 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= 30 * 60 * 1000;
  c.stop();
  const m = global.__modals[global.__modals.length - 1];
  const focusMin = m && m.data ? m.data.focusMin : null;
  /*
   * 正计时不会自然结束，唯一的收尾动作就是手动点「结束」。
   * 不结算的话小结里永远是 0 分钟 —— 记录功能等于对正计时完全失效。
   */
  ok('结束会话时把正计时已走时长记进小结（30 分钟）', focusMin === 30, String(focusMin));
  c.clearTicker();
}

/* ---------------- ⑲ 对照：倒计时中途结束仍不算（口径不同，别混） ---------------- */
{
  const c = makeCtrl({ countUp: false });
  c.startSegment('focus', 25);
  c.endsAt -= 10 * 60 * 1000; // 只跑了 10 分钟就结束
  c.stop();
  const m = global.__modals[global.__modals.length - 1];
  const focusMin = m && m.data ? m.data.focusMin : null;
  ok('倒计时中途结束：这一段不算（维持原口径）', focusMin === 0, String(focusMin));
  c.clearTicker();
}

/* ---------------- ⑳ 准备开始面板上的快捷切换 ---------------- */
{
  const { StartModal } = POMO.__testModals;
  ok('产物导出 StartModal（准备开始面板）', typeof StartModal === 'function');

  const c = makeCtrl({ countUp: false });
  const walk = (el, out) => {
    out = out || [];
    if (!el || !el.children) return out;
    el.children.forEach((ch) => {
      out.push(ch);
      walk(ch, out);
    });
    return out;
  };
  const m = new StartModal(c.plugin.app, c);
  // 包一层：面板渲染一旦抛错，后面的断言就跑不到了，失败原因会变成一句崩溃栈
  let openErr = null;
  try {
    m.onOpen();
  } catch (e) {
    openErr = e;
  }
  ok('准备开始面板能正常渲染（不抛错）', openErr === null, openErr && openErr.message);
  const all = walk(m.contentEl);
  const btnUp = all.find((e) => e.text === '正计时');
  const btnDown = all.find((e) => e.text === '倒计时');
  ok('准备开始面板上有「正计时」按钮', !!btnUp);
  ok('准备开始面板上有「倒计时」按钮', !!btnDown);
  ok('默认是倒计时：倒计时按钮点亮', btnDown && btnDown.cls.indexOf('mod-cta') >= 0, btnDown && btnDown.cls);
  ok('默认是倒计时：正计时按钮不点亮', btnUp && btnUp.cls.indexOf('mod-cta') < 0, btnUp && btnUp.cls);

  if (btnUp && btnDown && typeof btnUp.onclick === 'function' && typeof btnDown.onclick === 'function') {
    btnUp.onclick();
    ok('点「正计时」后设置真的切过去', c.settings.countUp === true, String(c.settings.countUp));
    ok('切换后正计时按钮点亮', btnUp.cls.indexOf('mod-cta') >= 0, btnUp.cls);
    ok('切换后倒计时按钮熄灭', btnDown.cls.indexOf('mod-cta') < 0, btnDown.cls);
    notices.length = 0;
    btnUp.onclick(); // 再点一次：同值不应重复提示
    ok('重复点同一个不重复提示', notices.length === 0, JSON.stringify(notices));
    btnDown.onclick();
    ok('点「倒计时」切回来', c.settings.countUp === false, String(c.settings.countUp));
  }
}


/* ---------------- ㉑ 记录精度：默认按分钟，打开记到秒 ---------------- */
{
  const c = makeCtrl({ countUp: true });
  c.startSegment('focus', 25);
  c.countUpStartAt -= (9 * 60 + 30) * 1000; // 9 分 30 秒
  c.stop();
  const m = global.__modals[global.__modals.length - 1];
  // 9 分 30 秒四舍五入为 10 分钟：focusText 必须与 focusMin 同一口径，
  // 否则同一条记录里 {{focus}} 写 10、{{focusText}} 写「9 分钟」，互相打架
  ok('默认按分钟记录：9 分 30 秒记成 10 分钟', m.data.focusMin === 10, String(m.data.focusMin));
  ok('默认 focusText 与 focusMin 同口径（不写秒）', m.data.focusText === '10 分钟', m.data.focusText);
  c.clearTicker();
}
{
  const c = makeCtrl({ countUp: true });
  c.plugin.settings.record.recordSeconds = true;
  c.startSegment('focus', 25);
  c.countUpStartAt -= (9 * 60 + 30) * 1000;
  c.stop();
  const m = global.__modals[global.__modals.length - 1];
  ok('打开「记录到秒」后 focusText 精确到秒', /^9 分 (29|30|31) 秒$/.test(m.data.focusText), m.data.focusText);
  ok('打开后 focusMin 仍是整数分钟（{{focus}} 语义不变）', m.data.focusMin === 10, String(m.data.focusMin));
  c.clearTicker();
}
{
  const c = makeCtrl({ countUp: true });
  c.plugin.settings.record.recordSeconds = true;
  c.startSegment('focus', 25);
  c.countUpStartAt -= 95 * 60 * 1000; // 95 分钟 = 1 小时 35 分
  c.stop();
  const m = global.__modals[global.__modals.length - 1];
  ok('记到秒且超一小时 → 补小时位，不显示成 95 分', /^1 小时 35 分/.test(m.data.focusText), m.data.focusText);
  c.clearTicker();
}

/* ---------------- ㉑b 默认模板必须跟随精度开关 ----------------
 * 默认模板若写 {{focus}}（整数分钟），开了「记录到秒」笔记里一个字都不会变
 * —— 开关等于没用。必须走 {{focusText}}（自带单位、跟随开关）。
 * ★ 且不能写成「{{focusText}} 分钟」：focusText 自带单位，会渲染成
 *   「25 分 30 秒 分钟」。
 */
{
  const renderTemplate = mod.exports.__testRenderTemplate;
  ok('产物暴露了 renderTemplate', typeof renderTemplate === 'function');

  const base = {
    date: '2026-09-26', time: '10:00', range: '09:00 – 10:00', cycles: 1,
    focusMin: 25, restMin: 5, pauses: 0, longBreaks: 0, profileName: '默认',
    skippedFocus: 0, skippedBreak: 0,
  };
  const render = (toSec) => {
    const d = Object.assign({}, base, {
      focusText: toSec ? '25 分 30 秒' : '26 分钟',
      restText: toSec ? '5 分 0 秒' : '5 分钟',
    });
    return renderTemplate(undefined, d).split('\n').find((l) => l.includes('专注'));
  };
  const off = render(false);
  const on = render(true);

  ok('默认模板：关精度 → 渲染成整数分钟', /专注 26 分钟/.test(off), off);
  ok('默认模板：开精度 → 渲染出秒', /25 分 30 秒/.test(on), on);
  ok('默认模板：开关开/关结果不同（开关真的生效）', off !== on, `off=${off} | on=${on}`);
  ok('默认模板不含 {{focus}} 纯分钟占位符', !/\{\{focus\}\}/.test(render(true)), render(true));
  ok('默认模板不会出现「秒 分钟」重复单位', !/秒 分钟/.test(on), on);
}

/* ---------------- ㉒ 浮窗待开始时的 ＋/－ 计时方式按钮 ---------------- */
{
  const FloatUI = mod.exports.__testFloatUI;
  const mkFloatCtrl = (countUp, state) => ({
    state: state || 'idle',
    pausedFrom: null,
    pendingState: null,
    completedCycles: 0,
    targetCycles: 0,
    focusedMs: 0,
    remainMs: () => 600000,
    displayTime: () => '10:00',
    segmentProgress: () => 0,
    settings: {
      theme: 'classic',
      longBreakInterval: 4,
      snapToEdge: false,
      floatEdge: 'right',
      floatOffset: 0.5,
      countUp: countUp,
    },
    plugin: { openSettings() {} },
  });

  const uiDown = new FloatUI(mkFloatCtrl(false));
  ok('倒计时状态：按钮显示 －', uiDown.btnMode && uiDown.btnMode.text === '－', uiDown.btnMode && uiDown.btnMode.text);
  ok('－ 的悬停提示说明是倒计时', uiDown.btnMode && uiDown.btnMode.getAttribute('title') === '倒计时（递减）',
    uiDown.btnMode && uiDown.btnMode.getAttribute('title'));
  uiDown.destroy();

  const uiUp = new FloatUI(mkFloatCtrl(true));
  ok('正计时状态：按钮显示 ＋', uiUp.btnMode && uiUp.btnMode.text === '＋', uiUp.btnMode && uiUp.btnMode.text);
  ok('＋ 的悬停提示说明是正计时', uiUp.btnMode && uiUp.btnMode.getAttribute('title') === '正计时（累加）',
    uiUp.btnMode && uiUp.btnMode.getAttribute('title'));
  uiUp.destroy();

  const uiRun = new FloatUI(mkFloatCtrl(false, 'focus'));
  ok('已在跑的那一段不给切：按钮隐藏', uiRun.btnMode && uiRun.btnMode.style.display === 'none',
    uiRun.btnMode && uiRun.btnMode.style.display);
  uiRun.destroy();
}

/* ---------------- ㉑ 准备开始面板：正计时快捷输入 ---------------- */
{
  const { StartModal } = POMO.__testModals;

  const c = makeCtrl({ countUp: false });
  const before = (global.__settings || []).length;
  const m = new StartModal(c.plugin.app, c);
  let openErr = null;
  try {
    m.onOpen();
  } catch (e) {
    openErr = e;
  }
  ok('加了快捷输入后面板仍能渲染（不抛错）', openErr === null, openErr && openErr.message);

  ok('面板上存在正计时专属容器', !!m.countUpExtraEl);
  ok('倒计时下快捷输入整块收起', m.countUpExtraEl && m.countUpExtraEl.style.display === 'none',
    m.countUpExtraEl && String(m.countUpExtraEl.style.display));
  ok('两项输入都挂在正计时容器里', m.countUpExtraEl && m.countUpExtraEl.children.length === 2,
    m.countUpExtraEl && String(m.countUpExtraEl.children.length));

  const added = (global.__settings || []).slice(before);
  const stTarget = added.find((x) => x.name === '软目标（分钟）');
  const stEvery = added.find((x) => x.name === '间隔提醒（分钟）');
  ok('有「软目标（分钟）」输入框', !!stTarget);
  ok('有「间隔提醒（分钟）」输入框', !!stEvery);

  if (stTarget && stTarget.components[0]) {
    stTarget.components[0].change('30');
    ok('填软目标 30 → 写进设置', c.settings.countUpTargetMin === 30,
      String(c.settings.countUpTargetMin));
    stTarget.components[0].change('abc');
    ok('软目标填非法值 → 归 0（＝不提醒）', c.settings.countUpTargetMin === 0,
      String(c.settings.countUpTargetMin));
  }
  if (stEvery && stEvery.components[0]) {
    stEvery.components[0].change('20');
    ok('填间隔提醒 20 → 写进设置', c.settings.countUpRemindEveryMin === 20,
      String(c.settings.countUpRemindEveryMin));
    stEvery.components[0].change('-5');
    ok('间隔提醒填负数 → 归 0', c.settings.countUpRemindEveryMin === 0,
      String(c.settings.countUpRemindEveryMin));
  }

  // 切到正计时 → 展开；切回倒计时 → 又收起
  const all = (() => {
    const out = [];
    const walk = (el) => {
      if (!el || !el.children) return;
      el.children.forEach((ch) => {
        out.push(ch);
        walk(ch);
      });
    };
    walk(m.contentEl);
    return out;
  })();
  const btnUp = all.find((e) => e.text === '正计时');
  const btnDown = all.find((e) => e.text === '倒计时');
  if (btnUp) btnUp.onclick();
  ok('切到正计时后快捷输入展开', m.countUpExtraEl && m.countUpExtraEl.style.display === '',
    m.countUpExtraEl && String(m.countUpExtraEl.style.display));
  if (btnDown) btnDown.onclick();
  ok('切回倒计时后快捷输入重新收起', m.countUpExtraEl && m.countUpExtraEl.style.display === 'none',
    m.countUpExtraEl && String(m.countUpExtraEl.style.display));
}

console.log(`\n通过 ${pass} / ${pass + fail}`);
if (fail > 0) {
  console.log('\n失败项：');
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
