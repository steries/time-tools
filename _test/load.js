/* 模拟 Obsidian 真实加载：跑完整 onload，捕获任何异常 */
const obsidian = require('obsidian');

global.window = {
  setInterval: () => 1, clearInterval: () => {},
  addEventListener: () => {}, removeEventListener: () => {},
  innerWidth: 1200, innerHeight: 800,
};
global.document = { body: new obsidian.MockEl('body'), createElement: (t) => new obsidian.MockEl(t) };
/* Node 21+ 的 globalThis.navigator 是只读 getter，简单赋值会静默失败，
   必须 defineProperty（详见 _smoke_env.js 的注释） */
Object.defineProperty(global, 'navigator', {
  value: { clipboard: { writeText: async () => {} } },
  writable: true, configurable: true, enumerable: true,
});
global.__modals = [];
global.__notices = [];

const Plugin = require(__dirname + '/../main.js');

const app = {
  workspace: {
    getLeavesOfType: () => [], getRightLeaf: () => null, revealLeaf: () => {},
    detachLeavesOfType: () => {}, activeEditor: null,
    getActiveViewOfType: () => null,
    on: () => ({}), // 编辑器右键菜单事件
  },
  vault: {
    adapter: { list: async () => ({ files: [] }), getResourcePath: (f) => 'app://' + f },
    getAbstractFileByPath: () => null, createFolder: async () => {},
    create: async () => ({}), read: async () => '', modify: async () => {},
  },
  plugins: { plugins: {} },
  setting: { open: () => {}, openTabById: () => {} },
};

const plugin = new Plugin(app, { id: 'time-tools' });

(async () => {
  try {
    await plugin.onload();
    console.log('✓ onload 无异常');
  } catch (e) {
    console.log('✗ onload 抛错：', e && e.stack ? e.stack.split('\n').slice(0,5).join('\n') : e);
    process.exit(1);
  }

  // 逐个渲染设置页的三个标签
  const { TABS } = { TABS: ['timestamp', 'pomodoro', 'calendar'] };
  for (const tab of TABS) {
    try {
      plugin.settingTab.focusTab(tab);
      console.log('✓ 设置页渲染：' + tab);
    } catch (e) {
      console.log('✗ 设置页渲染失败：' + tab + ' → ' + (e && e.message));
    }
  }

  // 跑一次会话：开始 → 跳过 → 结束
  try {
    plugin.pomodoro.startSession(1, 'study');
    plugin.pomodoro.skip();
    await plugin.pomodoro.stop();
    console.log('✓ 会话流程无异常');
  } catch (e) {
    console.log('✗ 会话流程抛错：', e && e.stack ? e.stack.split('\n').slice(0,5).join('\n') : e);
  }

  // 记录器三种模式
  for (const mode of ['builtin', 'quickadd', 'clipboard']) {
    try {
      plugin.settings.record.enabled = true;
      plugin.settings.record.mode = mode;
      await plugin.recorder.record({ date:'x', time:'y', range:'z', cycles:1, focusMin:1, restMin:1, pauses:0, longBreaks:0, skippedFocus:0, skippedBreak:0, profileName:'学习' });
      console.log('✓ 记录模式：' + mode);
    } catch (e) {
      console.log('✗ 记录模式失败：' + mode + ' → ' + (e && e.message));
    }
  }
})();
