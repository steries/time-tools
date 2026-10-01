/* Bug 狩猎：模拟真实使用中的边界场景 */
const obsidian = require('obsidian');
global.window = { setInterval: (f) => { global.__ticks.push(f); return global.__ticks.length; },
  clearInterval: () => {}, addEventListener: () => {}, removeEventListener: () => {},
  innerWidth: 1200, innerHeight: 800 };
global.__ticks = [];
global.__intervals = [];
global.document = { body: new obsidian.MockEl('body'), createElement: (t) => new obsidian.MockEl(t) };
/* Node 21+ 的 globalThis.navigator 是只读 getter，简单赋值会静默失败，
   必须 defineProperty（详见 _smoke_env.js 的注释） */
Object.defineProperty(global, 'navigator', {
  value: { clipboard: { writeText: async () => {} } },
  writable: true, configurable: true, enumerable: true,
});
global.__modals = []; global.__notices = []; global.__settings = [];

const { migrateSettings } = require(__dirname + '/../src/settings.js');
const pomodoro = require(__dirname + '/../src/pomodoro.js');

let issues = [];
const report = (t, ok, extra) => { console.log((ok ? '  ✓ ' : '  ⚠ ') + t + (ok ? '' : '  → ' + extra)); if (!ok) issues.push(t); };

function mkPlugin(mut) {
  const settings = migrateSettings(null);
  settings.pomodoro.uiMode = 'sidebar';
  if (mut) mut(settings);
  const plugin = new obsidian.Plugin({
    workspace: { getLeavesOfType: () => [], getRightLeaf: () => null, revealLeaf: () => {}, detachLeavesOfType: () => {}, activeEditor: null },
    vault: { adapter: { list: async () => ({ files: [] }) } },
  }, { id: 'time-tools' });
  plugin.settings = settings;
  plugin.registeredIntervals = [];
  plugin.registerInterval = (id) => plugin.registeredIntervals.push(id);
  plugin.saveSettings = async () => {};
  plugin.redrawSettingsTab = () => {};
  plugin.openSettings = () => {};
  plugin.recorder = { calls: [], async record(d, n) { this.calls.push({ d, n }); } };
  return plugin;
}

(async () => {
console.log('\n[A] 重复启动 / 计时器累积');
{
  const p = mkPlugin(); const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  c.startSession(2, 'study');
  const n1 = p.registeredIntervals.length;
  c.expire = () => { c.endsAt = Date.now() - 1; c.tick(); };
  for (let i = 0; i < 6; i++) { c.expire(); }
  const n2 = p.registeredIntervals.length;
  report('每段计时只注册一次 interval', n2 - n1 <= 8, `段数增长导致注册数 ${n1}→${n2}`);
}

console.log('\n[B] 浮窗重复创建');
{
  const settings = migrateSettings(null);
  settings.pomodoro.uiMode = 'floating';
  const p = mkPlugin((s) => { s.pomodoro.uiMode = 'floating'; });
  const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  const before = global.document.body.children.length;
  c.revealUI(); c.revealUI(); c.toggleFloat(); c.toggleFloat(); c.revealUI();
  const after = global.document.body.children.length;
  report('反复唤出不重复创建浮窗 DOM', after - before <= 1, `新增 ${after - before} 个节点`);
}

console.log('\n[C] 禁用插件后资源释放');
{
  const p = mkPlugin(); const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  c.startSession(null, 'study');
  c.destroy();
  report('destroy 后计时器停止', c.intervalId === null, c.intervalId);
}

console.log('\n[D] 会话中强行重复结束');
global.__modals = [];
{
  const p = mkPlugin(); const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  c.startSession(null, 'study');
  c.stop(); c.stop(); c.stop();
  report('重复 stop 不报错且状态为空闲', c.state === 'idle', c.state);
  report('重复 stop 只产生一次小结', global.__modals.filter(m => m.constructor.name === 'SummaryModal').length === 1,
    global.__modals.filter(m => m.constructor.name === 'SummaryModal').length);
}

console.log('\n[E] 未开始就操作');
{
  const p = mkPlugin(); const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  let threw = null;
  try { c.skip(); c.togglePause(); c.stop(); } catch (e) { threw = e.message; }
  report('空闲态下 skip/pause/stop 不报错', !threw, threw);
}

console.log('\n[F] 极端时长配置');
{
  const p = mkPlugin((s) => { s.pomodoro.profiles = [{ id: 'x', name: '极端', focusMin: 999, shortBreakMin: 1, longBreakMin: 600 }]; s.pomodoro.activeProfileId = 'x'; });
  const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  let threw = null;
  try { c.startSession(null, 'x'); } catch (e) { threw = e.message; }
  report('极长时长不崩溃', !threw, threw);
  report('极长时长显示正常', typeof c.remainMs() === 'number' && c.remainMs() > 0, c.remainMs());
}

console.log('\n[G] 方案被删空时的兜底');
{
  const s = migrateSettings(null);
  s.pomodoro.profiles = [];
  s.pomodoro.activeProfileId = 'gone';
  let threw = null; let res = null;
  try { const { applyProfile } = require(__dirname + '/../src/settings.js'); applyProfile(s, 'gone'); res = s.pomodoro; } catch (e) { threw = e.message; }
  report('方案为空时 applyProfile 不崩溃', !threw, threw);
}

console.log('\n[H] 手动模式下跳过再跳回');
{
  const p = mkPlugin((s) => { s.pomodoro.autoStartNext = false; });
  const c = new pomodoro.PomodoroController(p); p.pomodoro = c; c.init();
  c.startSession(null, 'study');
  c.expire = () => { c.endsAt = Date.now() - 1; c.tick(); };
  c.expire();               // 等待开始休息
  c.skip();                 // 跳过休息
  report('手动模式跳过休息后回到专注等待', c.state === 'waiting' || c.state === 'focus', c.state);
  report('跳过休息计入统计', c.skippedBreak === 1, c.skippedBreak);
}

console.log('\n[I] 时长设为 0 或负数');
{
  const s = migrateSettings({ pomodoro: { focusMin: 0, shortBreakMin: -5 } });
  report('非法时长被兜底为正数', s.pomodoro.focusMin === 25 && s.pomodoro.shortBreakMin === 5,
    `${s.pomodoro.focusMin}/${s.pomodoro.shortBreakMin}`);
}

console.log('\n[J] 方案名含特殊字符');
{
  const { sanitizeFileName } = require(__dirname + '/../src/pomodoro.js');
  report('非法文件名字符被替换', sanitizeFileName('a/b?c*d') === 'a-b-c-d', sanitizeFileName('a/b?c*d'));
  report('文件名不含路径分隔符', !sanitizeFileName('../../etc/passwd').includes('/'), sanitizeFileName('../../etc/passwd'));
}

console.log('\n' + (issues.length ? `发现 ${issues.length} 个可疑点：\n- ` + issues.join('\n- ') : '未发现明显 bug ✅'));
})();
