/*
 * 设置页滚动位置还原（v2.82）
 *
 * 背景：Obsidian 重载插件会重建设置页 DOM，滚动位置和标签全部回到默认，
 * 用户每次「重新加载」都被弹回顶部。这里验证：
 *   1) 位置能跨重载还原（多次重试，抗重绘冲刷）
 *   2) 一旦用户自己动了、或页面不再是我们的，立即放弃 —— 还原只是便利，
 *      绝不能反过来抢用户的操作
 *   3) 记忆是有界的，不产生废旧数据
 */
const obsidian = require('obsidian');
const S = require(__dirname + '/../src/settings.js');
const { setLang } = require(__dirname + '/../src/i18n.js');
// 测试环境没有 window / navigator，默认值 auto 会解成英文；这里钉成中文才能断言中文文案
setLang('zh');
const {
  TimeToolsSettingTab, SCROLL_ATTEMPTS, SCROLL_KEYS,
  findScrollParent, cleanScrollMemo, migrateSettings,
} = S;

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 造一个够用的滚动容器：只提供还原逻辑真正用到的字段 */
function mkBox(scrollHeight, clientHeight) {
  const listeners = {};
  return {
    scrollTop: 0,
    scrollHeight,
    clientHeight,
    isConnected: true,
    addEventListener(t, f) { (listeners[t] = listeners[t] || []).push(f); },
    removeEventListener(t, f) {
      listeners[t] = (listeners[t] || []).filter((x) => x !== f);
    },
    fire(t) { (listeners[t] || []).slice().forEach((f) => f({})); },
    count(t) { return (listeners[t] || []).length; },
  };
}

/** containerEl：挂在滚动容器下，模拟真实层级里的一个内层节点 */
function mkContainer(box) {
  return { parentElement: box, isConnected: true };
}

function mkTab() {
  const plugin = { settings: migrateSettings(null), saveSettings: async () => {} };
  plugin.pomodoro = { settings: plugin.settings.pomodoro };
  const tab = new TimeToolsSettingTab({}, plugin);
  return { tab, plugin };
}

(async () => {
  console.log('— 清洗：记忆必须是有界的干净数据 —');
  {
    check('非法类型退回空表', Object.keys(cleanScrollMemo(null)).length === 0);
    check('数组也退回空表', Object.keys(cleanScrollMemo([1, 2])).length === 0);
    const c1 = cleanScrollMemo({ timestamp: 120, pomodoro: -5, calendar: 'abc' });
    check('负数丢弃', c1.pomodoro === undefined, JSON.stringify(c1));
    check('字符串丢弃', c1.calendar === undefined, JSON.stringify(c1));
    check('合法值保留', c1.timestamp === 120, JSON.stringify(c1));
    const c2 = cleanScrollMemo({ timestamp: NaN, pomodoro: Infinity, calendar: 10.6 });
    check('NaN 丢弃', c2.timestamp === undefined, JSON.stringify(c2));
    check('Infinity 丢弃', c2.pomodoro === undefined, JSON.stringify(c2));
    check('小数取整', c2.calendar === 11, JSON.stringify(c2));
    const c3 = cleanScrollMemo({ timestamp: 10, removedTab: 999 });
    check('已不存在的标签键被清掉', c3.removedTab === undefined, JSON.stringify(c3));
    check('键集合与标签一致（含界面语言）', SCROLL_KEYS.length === 4 && SCROLL_KEYS.indexOf('calendar') >= 0 && SCROLL_KEYS.indexOf('lang') >= 0);
  }

  console.log('— 找滚动容器 —');
  {
    const box = mkBox(2000, 800);
    check('能找到可滚动祖先', findScrollParent(mkContainer(box)) === box);
    const flat = mkBox(500, 500);
    check('不可滚动时返回 null', findScrollParent(mkContainer(flat)) === null);
    check('没有父节点时返回 null', findScrollParent({ parentElement: null }) === null);
  }

  console.log('— 保存：滚动后记录当前标签位置 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'calendar';
    box.scrollTop = 640;
    tab.saveScroll();
    check('记录到当前标签', plugin.settings.pomodoro.lastSettingsScroll.calendar === 640,
      JSON.stringify(plugin.settings.pomodoro.lastSettingsScroll));
    check('不影响其他标签', plugin.settings.pomodoro.lastSettingsScroll.timestamp === undefined);
    box.scrollTop = 0;
    tab.saveScroll();
    check('顶部记为 0', plugin.settings.pomodoro.lastSettingsScroll.calendar === 0);
  }

  console.log('— 还原：多次重试，抗重绘冲刷 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'calendar';
    plugin.settings.pomodoro.lastSettingsScroll = { calendar: 700 };

    // 模拟高频重绘：20ms 时把位置冲掉
    setTimeout(() => { box.scrollTop = 0; }, 20);
    tab.restoreScroll();
    await sleep(SCROLL_ATTEMPTS[SCROLL_ATTEMPTS.length - 1] + 120);
    check('被冲掉后仍能还原到目标位置', box.scrollTop === 700, box.scrollTop);
    check('还原用的是全部重试帧', SCROLL_ATTEMPTS.length === 7, SCROLL_ATTEMPTS.length);
    check('最后一帧覆盖到 800ms', SCROLL_ATTEMPTS[SCROLL_ATTEMPTS.length - 1] === 800);
  }

  console.log('— 放弃条件一：用户自己动了就停 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'calendar';
    plugin.settings.pomodoro.lastSettingsScroll = { calendar: 700 };
    tab.restoreScroll();
    check('已绑定用户意图监听', box.count('wheel') === 1, box.count('wheel'));
    await sleep(10);
    box.fire('wheel'); // 用户滚了一下
    box.scrollTop = 300; // 用户滚到了别处
    await sleep(SCROLL_ATTEMPTS[SCROLL_ATTEMPTS.length - 1] + 120);
    check('用户滚动后不再抢占', box.scrollTop === 300, box.scrollTop);
    check('放弃后解绑监听', box.count('wheel') === 0, box.count('wheel'));
  }

  console.log('— 放弃条件二：页面已不是我们的 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    const el = mkContainer(box);
    tab.containerEl = el;
    tab.activeTab = 'calendar';
    plugin.settings.pomodoro.lastSettingsScroll = { calendar: 700 };
    tab.restoreScroll();
    await sleep(10);
    el.isConnected = false; // 用户切走了 / 设置页被替换
    /*
     * 关键：脱离后把位置清零再等。
     * 若还原还在跑，后续帧会把它设回 700 —— 只断言「等于 0」
     * 分不清是「没跑过」还是「跑过又被清了」，这里必须制造反差。
     */
    box.scrollTop = 0;
    await sleep(SCROLL_ATTEMPTS[SCROLL_ATTEMPTS.length - 1] + 120);
    check('容器脱离后不再写入', box.scrollTop === 0, box.scrollTop);
  }

  console.log('— 放弃条件三：页面变矮，位置越界 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(400, 380); // 最多只能滚 20px
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'calendar';
    plugin.settings.pomodoro.lastSettingsScroll = { calendar: 700 };
    tab.restoreScroll();
    await sleep(SCROLL_ATTEMPTS[SCROLL_ATTEMPTS.length - 1] + 120);
    check('越界时不硬滚', box.scrollTop === 0, box.scrollTop);
  }

  console.log('— 边界：没记过 / 记的是顶部，都不动 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'timestamp';
    plugin.settings.pomodoro.lastSettingsScroll = {};
    tab.restoreScroll();
    await sleep(120);
    check('无记忆时不动', box.scrollTop === 0, box.scrollTop);
    plugin.settings.pomodoro.lastSettingsScroll = { timestamp: 0 };
    tab.restoreScroll();
    await sleep(120);
    check('记忆为 0 时不动', box.scrollTop === 0, box.scrollTop);
  }

  console.log('— 切标签：先存后切，回来能还原 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'timestamp';
    box.scrollTop = 420;
    // 只测保存这一半：focusTab 内部会重绘，这里直接调保存避免拉起整页
    tab.saveScroll();
    check('切走前存下旧标签', plugin.settings.pomodoro.lastSettingsScroll.timestamp === 420,
      JSON.stringify(plugin.settings.pomodoro.lastSettingsScroll));
    tab.activeTab = 'pomodoro';
    box.scrollTop = 0;
    tab.restoreScroll();
    await sleep(120);
    check('新标签没有记忆就不动', box.scrollTop === 0, box.scrollTop);
  }

  console.log('— 迁移：旧标签残留被清掉 —');
  {
    const dirty = migrateSettings(null);
    dirty.pomodoro.lastSettingsScroll = { timestamp: 100, ghost: 55, calendar: -3 };
    const out = migrateSettings(dirty);
    const memo = out.pomodoro.lastSettingsScroll;
    check('合法值保留', memo.timestamp === 100, JSON.stringify(memo));
    check('旧标签键清除', memo.ghost === undefined, JSON.stringify(memo));
    check('负数清除', memo.calendar === undefined, JSON.stringify(memo));
    check('迁移幂等：再跑一次不变',
      JSON.stringify(migrateSettings(out).pomodoro.lastSettingsScroll) === JSON.stringify(memo));
  }

  console.log('— hide：收尾不泄漏 —');
  {
    const { tab, plugin } = mkTab();
    const box = mkBox(2000, 800);
    tab.containerEl = mkContainer(box);
    tab.activeTab = 'calendar';
    plugin.settings.pomodoro.lastSettingsScroll = { calendar: 700 };
    tab.restoreScroll();
    check('还原期间有定时器', tab.restoreTimers.length === SCROLL_ATTEMPTS.length);
    tab.hide();
    check('hide 后定时器清空', tab.restoreTimers.length === 0, tab.restoreTimers.length);
    check('hide 后解绑意图监听', box.count('wheel') === 0, box.count('wheel'));
    check('hide 后解绑滚动监听', box.count('scroll') === 0, box.count('scroll'));
  }

  console.log(failures === 0 ? '✓ 全部通过' : `✗ ${failures} 项失败`);
  process.exit(failures === 0 ? 0 : 1);
})();
