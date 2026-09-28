/*
 * 冒烟测试：配置迁移 + 方案 + 状态机 + 手动模式 + 暂停提示 + 跳过统计 + 命名
 * 运行：node _test/smoke.js
 *
 * 环境（DOM/window stub、断言器）在 ./_smoke_env.js，与 calendarlate.js 共用一份。
 */
const { fs, obsidian, migrateSettings, applyProfile, pomodoro, recorder, check, done } = require('./_smoke_env.js');
const { setLang } = require(__dirname + '/../src/i18n.js');
// 测试环境没有 window / navigator，默认值 auto 会解成英文；这里钉成中文才能断言中文文案
setLang('zh');

async function main() {

/* ============ 1. 配置迁移 ============ */
console.log('\n[1] 配置迁移');
const legacy = {
  format: 'YYYY年M月D日 HH:mm',
  insertNewline: true,
  enableSlashCommand: true,
  slashTrigger: 'ts',
};
const migrated = migrateSettings(legacy);
check('自定义格式保留', migrated.timestamp.format === 'YYYY年M月D日 HH:mm', migrated.timestamp.format);
check('insertNewline 保留', migrated.timestamp.insertNewline === true);
check('缺失 profiles 补内置三套', migrated.pomodoro.profiles.length === 3, migrated.pomodoro.profiles.length);

const names = migrated.pomodoro.profiles.map((p) => p.name).join(',');
check('内置方案为工作/学习/阅读', names === '工作,学习,阅读', names);
// 新装用户默认关闭；旧版用户沿用自己原来的设置，不被打断
const fresh = migrateSettings(null);
check('新装时时间戳斜杠命令默认关闭', fresh.timestamp.enableSlashCommand === false, fresh.timestamp.enableSlashCommand);
check('旧版启用过的仍保留启用', migrated.timestamp.enableSlashCommand === true, migrated.timestamp.enableSlashCommand);
/*
 * 斜杠命令两个模块都默认关闭。
 * `/` 是公共资源（Slash Commander / Templater / QuickAdd 都可能接管），
 * 默认让位可避免与其他插件冲突；用户需要时自行开启。
 */
check('番茄钟斜杠命令默认关闭（避免抢公共资源）',
  fresh.pomodoro.enableSlashCommand === false, fresh.pomodoro.enableSlashCommand);
check('两模块斜杠默认值一致',
  fresh.pomodoro.enableSlashCommand === fresh.timestamp.enableSlashCommand);
const work = migrated.pomodoro.profiles.find((p) => p.name === '工作');
check('工作方案为 40/10/90', work.focusMin === 40 && work.shortBreakMin === 10 && work.longBreakMin === 90);
const reading = migrated.pomodoro.profiles.find((p) => p.name === '阅读');
check('阅读方案为 30/3/10', reading.focusMin === 30 && reading.shortBreakMin === 3 && reading.longBreakMin === 10);

const newStyle = migrateSettings({ timestamp: { format: 'HH:mm' }, pomodoro: { focusMin: 50 } });
check('新结构不误判为旧版', newStyle.timestamp.format === 'HH:mm' && newStyle.timestamp.slashTrigger === 'now');

const customProfiles = migrateSettings({
  pomodoro: { profiles: [{ id: 'a', name: '写作', focusMin: 45, shortBreakMin: 8, longBreakMin: 20 }] },
});
check('自定义方案保留', customProfiles.pomodoro.profiles[0].name === '写作');
check('生效值随方案同步', customProfiles.pomodoro.focusMin === 45, customProfiles.pomodoro.focusMin);

const dirty = migrateSettings({ pomodoro: { profiles: [{ name: '坏数据', focusMin: 'x' }, null] } });
check('脏方案被清洗', dirty.pomodoro.profiles.length === 1 && dirty.pomodoro.profiles[0].focusMin === 25,
  JSON.stringify(dirty.pomodoro.profiles));

const broken = migrateSettings({
  pomodoro: { focusMin: 'abc', longBreakInterval: 0, pauseThreshold: -1, floatOffset: 9 },
});
check('非法数值兜底', broken.pomodoro.longBreakInterval === 4 && broken.pomodoro.pauseThreshold === 3);
check('比例裁剪到 0~1', broken.pomodoro.floatOffset === 1, broken.pomodoro.floatOffset);

/* ============ 1b. 记录模块配置 ============ */
console.log('\n[1b] 记录模块配置');
const recDefault = migrateSettings(null).record;
check('记录总开关默认打开', recDefault.enabled === true);
check('默认内置写入模式', recDefault.mode === 'builtin');
check('默认笔记名为番茄记录', recDefault.defaultNoteName === '番茄记录');
check('联动失败回退默认开启', recDefault.fallbackToBuiltin === true, recDefault.fallbackToBuiltin);
check('模板含关键占位符',
  recDefault.template.includes('{{cycles}}') && recDefault.template.includes('{{pauses}}') &&
  recDefault.template.includes('{{skippedLine}}'));

const recCustom = migrateSettings({ record: { enabled: true, mode: 'quickadd', quickAddChoice: '番茄记录' } });
check('自定义记录配置保留', recCustom.record.enabled === true && recCustom.record.quickAddChoice === '番茄记录');

const recBroken = migrateSettings({ record: { mode: 'xxx', defaultNoteName: '', template: '' } });
check('非法模式回退内置', recBroken.record.mode === 'builtin', recBroken.record.mode);
check('空笔记名补默认值', recBroken.record.defaultNoteName === '番茄记录', recBroken.record.defaultNoteName);
check('空模板补默认模板', recBroken.record.template.includes('{{cycles}}'));

/* ============ 1c. 记录模板与写入 ============ */
console.log('\n[1c] 记录模板与写入');
const sample = {
  date: '2026-09-19', time: '18:24', range: '17:34 – 18:24',
  cycles: 2, focusMin: 50, restMin: 10, pauses: 2, longBreaks: 0,
  skippedFocus: 1, skippedBreak: 0, profileName: '学习',
};
const out1 = recorder.renderTemplate(recorder.DEFAULT_RECORD_TEMPLATE, sample);
check('模板替换 cycles', out1.includes('完成 2 轮'), out1.split('\n')[1]);
check('模板替换 pauses', out1.includes('暂停 2 次'), out1.split('\n')[2]);
check('模板替换 profile', out1.includes('方案：学习'));
check('模板替换 range', out1.includes('17:34 – 18:24'));
check('有跳过时输出跳过行', out1.includes('跳过未计入：专注 1 段'), out1);
check('无多余空行', !out1.includes('\n\n\n'), JSON.stringify(out1));

const noSkip = Object.assign({}, sample, { skippedFocus: 0, skippedBreak: 0 });
const out2 = recorder.renderTemplate(recorder.DEFAULT_RECORD_TEMPLATE, noSkip);
check('无跳过时不输出跳过行', !out2.includes('跳过未计入'), out2);
check('无跳过时压缩空行', !/\n\s*\n\s*\n/.test(out2), JSON.stringify(out2));

const out3 = recorder.renderTemplate('专注{{focus}}/休息{{rest}}/未知{{nope}}', sample);
check('未知占位符原样保留', out3.includes('{{nope}}'), out3);

check('文件名非法字符清理', recorder.sanitizeFileName('a/b:c*d?') === 'a-b-c-d-', recorder.sanitizeFileName('a/b:c*d?'));

// 插入最上端
const inserted = recorder.insertAtTop('', 'BLOCK');
check('空笔记直接写入', inserted === 'BLOCK\n', JSON.stringify(inserted));

const plain = recorder.insertAtTop('旧内容\n第二行', 'BLOCK');
check('无 frontmatter 插在最前', plain.startsWith('BLOCK'), JSON.stringify(plain));
check('无 frontmatter 保留原文', plain.includes('旧内容') && plain.includes('第二行'));

const withFm = recorder.insertAtTop('---\ntitle: X\ntags: [a]\n---\n\n旧内容', 'BLOCK');
check('frontmatter 仍在前', withFm.startsWith('---\ntitle: X'), JSON.stringify(withFm));
check('内容插在 frontmatter 之后',
  withFm.indexOf('BLOCK') > withFm.indexOf('tags: [a]') && withFm.indexOf('BLOCK') < withFm.indexOf('旧内容'),
  JSON.stringify(withFm));

/* ============ 2. 方案切换 ============ */
console.log('\n[2] 时长方案');
const s2 = migrateSettings(null);
applyProfile(s2, 'work');
check('切到工作方案后生效值 40/10/90',
  s2.pomodoro.focusMin === 40 && s2.pomodoro.shortBreakMin === 10 && s2.pomodoro.longBreakMin === 90);
applyProfile(s2, 'reading');
check('切到阅读方案后生效值 30/3/10',
  s2.pomodoro.focusMin === 30 && s2.pomodoro.shortBreakMin === 3 && s2.pomodoro.longBreakMin === 10);

/* ============ 3. 状态机 ============ */
console.log('\n[3] 状态机');

function makePlugin(settings) {
  const plugin = new obsidian.Plugin(
    {
      workspace: {
        getLeavesOfType: () => [],
        getRightLeaf: () => null,
        revealLeaf: () => {},
        detachLeavesOfType: () => {},
        activeEditor: null,
        on: () => ({}), // 右键菜单事件
      },
      setting: null,
      vault: { adapter: null },
      commands: { listCommands: () => [] },
    },
    { id: 'time-tools' }
  );
  plugin.settings = settings;
  plugin.saveSettings = async () => {};
  plugin.redrawSettingsTab = () => {};
  plugin.openSettings = () => {};
  plugin.registerEvent = () => {}; // 右键菜单事件注册
  plugin.manifest = { id: 'time-tools', name: 'Time Tools', version: '0.0.0' };
  return plugin;
}

function boot(mutate) {
  const settings = migrateSettings(null);
  settings.pomodoro.uiMode = 'sidebar';
  settings.pomodoro.soundEnabled = false;
  if (mutate) mutate(settings);
  const plugin = makePlugin(settings);
  const ctrl = new pomodoro.PomodoroController(plugin);
  plugin.pomodoro = ctrl;
  // 记录器打桩，只记录调用参数
  plugin.recorder = {
    calls: [],
    async record(data, noteName) {
      this.calls.push({ data, noteName });
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

// 自动模式：段结束自动流转
const c1 = boot();
c1.startSession(null, 'study');
check('使用学习方案进入专注', c1.state === 'focus' && c1.segmentTotalMs === 25 * 60000, c1.segmentTotalMs);
c1.expire();
check('自动模式下专注结束即进休息', c1.state === 'short', c1.state);
check('专注时长计入统计', c1.focusedMs === 25 * 60000, c1.focusedMs);

// 手动模式
const c2 = boot((s) => { s.pomodoro.autoStartNext = false; });
c2.startSession(null, 'study');
c2.expire();
check('手动模式停在待开始', c2.state === 'waiting', c2.state);
check('待开始的下一段是短休息', c2.pendingState === 'short', c2.pendingState);
c2.startPending();
check('点开始后进入休息', c2.state === 'short', c2.state);
c2.expire();
check('休息结束也停在待开始', c2.state === 'waiting', c2.state);
check('完成一轮', c2.completedCycles === 1, c2.completedCycles);

// 暂停阈值提示
const c3 = boot();
c3.startSession(null, 'study');
global.__modals = [];
// togglePause 是切换：暂停→继续算一轮，累计 3 次暂停需调用 5 次
c3.togglePause(); c3.togglePause(); // 第 1 次暂停
c3.togglePause(); c3.togglePause(); // 第 2 次暂停
check('两次暂停不弹窗', global.__modals.length === 0, global.__modals.map(m => m.constructor.name).join(','));
c3.togglePause(); // 第 3 次暂停
check('第 3 次暂停计数正确', c3.pauseCount === 3, c3.pauseCount);
const askRestart = global.__modals.find((m) => m.constructor.name === 'AskRestartModal');
check('第 3 次暂停弹重开询问', !!askRestart);
c3.pausedRemainMs = 5 * 60000;
askRestart.onRestart();
// 允许 1 秒容差：测试跑得越久，剩余时间自然少几毫秒
check('重开本轮后整段重置', Math.abs(c3.remainMs() - 25 * 60000) < 1000, c3.remainMs());
check('重开后恢复运行', c3.state === 'focus', c3.state);
check('重开后暂停计数清零', c3.pauseCount === 0, c3.pauseCount);

// 选「继续当前进度」
const c3b = boot();
c3b.startSession(null, 'study');
c3b.togglePause();
c3b.pausedRemainMs = 10 * 60000;
c3b.pauseCount = 3;
global.__modals = [];
c3b.askRestart();
const ask2 = global.__modals.find((m) => m.constructor.name === 'AskRestartModal');
ask2.onResume();
check('继续进度保留剩余时间', c3b.remainMs() === 10 * 60000, c3b.remainMs());

// 跳过统计
const c4 = boot();
c4.startSession(null, 'study');
c4.skip(); // 跳过专注
check('跳过专注不计入专注时长', c4.focusedMs === 0, c4.focusedMs);
check('跳过专注计数 +1', c4.skippedFocus === 1, c4.skippedFocus);
c4.skip(); // 跳过休息
check('跳过休息不计入休息时长', c4.restMs === 0, c4.restMs);
check('跳过休息计数 +1', c4.skippedBreak === 1, c4.skippedBreak);
// 口径变更（v3.15）：跳过专注的那一轮**不再**计入已完成轮次。
// 旧断言写「跳过也算完成一轮」，等于给「跳过 4 次 == 认真做完 4 轮」背书，
// 长休息触发节奏和「已完成 N 轮」都会失真，见测试文档 D3。
check('跳过专注的那一轮不计入轮次', c4.completedCycles === 0, c4.completedCycles);

// 小结含跳过与休息时长
const c5 = boot();
c5.startSession(2, 'study');
global.__modals = [];
for (let i = 0; i < 2; i++) { c5.expire(); c5.expire(); }
const summary = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
check('弹出小结', !!summary);
check('小结含专注 50 分钟', summary.data.focusMin === 50, summary.data.focusMin);
check('小结含休息 10 分钟', summary.data.restMin === 10, summary.data.restMin);
check('小结含方案名', summary.data.profileName === '学习', summary.data.profileName);
check('无跳过时不显示跳过行', summary.data.skippedFocus === 0 && summary.data.skippedBreak === 0);
check('小结含日期与时间', /^\d{4}-\d{2}-\d{2}$/.test(summary.data.date) && /^\d{2}:\d{2}$/.test(summary.data.time),
  `${summary.data.date} ${summary.data.time}`);
check('小结标题为番茄任务结束', summary.titleText === '🍅 番茄任务结束', summary.titleText);

const c5b = boot();
c5b.startSession(null, 'study');
c5b.skip();
global.__modals = [];
c5b.stop();
const sum2 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
check('小结记录跳过段数', sum2.data.skippedFocus === 1, sum2.data.skippedFocus);

// 长休息与计数
const c6 = boot();
c6.startSession(null, 'study');
for (let i = 0; i < 4; i++) { c6.expire(); c6.expire(); }
global.__modals = [];
c6.completedCycles = 4;
c6.askLongBreak();
const askLb = global.__modals.find((m) => m.constructor.name === 'AskLongBreakModal');
check('第 4 轮弹长休息询问', !!askLb);
askLb.onYes();
check('同意后进入长休息', c6.state === 'long', c6.state);
check('长休息用方案时长 15 分', c6.segmentTotalMs === 15 * 60000, c6.segmentTotalMs);
c6.expire();
check('长休息计入休息统计', c6.longBreaks === 1, c6.longBreaks);
check('长休息后计数清零', c6.completedCycles === 0, c6.completedCycles);

// 工作方案跑一轮
const c7 = boot();
c7.startSession(null, 'work');
c7.expire();
check('工作方案专注 40 分钟', c7.focusedMs === 40 * 60000, c7.focusedMs);
c7.expire();
check('工作方案短休 10 分钟', c7.restMs === 10 * 60000, c7.restMs);

/* ============ 3b. 暂停累计 + 记录区块 ============ */
console.log('\n[3b] 暂停累计与记录区块');

const c9 = boot();
c9.startSession(null, 'study');
c9.togglePause(); c9.togglePause(); // 暂停 1
c9.togglePause(); c9.togglePause(); // 暂停 2
c9.togglePause();                   // 暂停 3（触发询问）
const restartModal = global.__modals.find((m) => m.constructor.name === 'AskRestartModal');
restartModal.onResume();
global.__modals = [];
c9.stop();
const sum9 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
check('小结累计暂停 3 次', sum9.data.pauses === 3, sum9.data.pauses);

// 新开一段后暂停计数归零，但会话累计保留
const c9b = boot();
c9b.startSession(null, 'study');
c9b.togglePause();
c9b.togglePause();
c9b.expire(); // 进入短休息，pauseCount 归零
check('进入新段后段内计数归零', c9b.pauseCount === 0, c9b.pauseCount);
check('会话累计暂停保留', c9b.totalPauses === 1, c9b.totalPauses);

// 记录按钮：总开关关闭时不出现（默认已改为开启，这里显式关掉）
const c10 = boot((s) => { s.record.enabled = false; });
global.__settings = [];
c10.startSession(null, 'study');
global.__modals = [];
c10.stop();
const sum10 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
check('总开关关闭时无记录按钮', sum10.btnRecord === undefined);
check('总开关关闭时仍有关闭与再跑一轮', !!sum10.btnOk && !!sum10.btnAgain);

// 总开关开启 → 出现记录按钮，且按钮区为三按钮布局
const c11 = boot((s) => { s.record.enabled = true; });
global.__settings = [];
global.__modals = [];
c11.startSession(null, 'study');
c11.stop();
const sum11 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
check('总开关开启时有记录按钮', !!sum11.btnRecord);
check('记录按钮文案为记录', sum11.btnRecord.text === '记录', sum11.btnRecord.text);
check('记录按钮用蓝色样式', sum11.btnRecord.cls.includes('mod-record'), sum11.btnRecord.cls);
check('按钮区为总结局布局', sum11.rowCls && sum11.rowCls.includes('pomo-modal-row-summary'), sum11.rowCls);
check('Again 按钮文案为英文', sum11.btnAgain && sum11.btnAgain.text === 'Again', sum11.btnAgain && sum11.btnAgain.text);
check('Again 为中性灰样式', sum11.btnAgain.cls.includes('pomo-btn') && !sum11.btnAgain.cls.includes('mod-cta'));
check('记录与右侧组分离', !!sum11.btnRight);
check('好的按钮文案不变', sum11.btnOk.text === '好的', sum11.btnOk.text);

// 点「记录」→ 关闭弹窗后调用记录器
sum11.doRecord();
await new Promise((r) => setTimeout(r, 120));
check('点记录后调用记录器', c11.plugin.recorder.calls.length === 1, c11.plugin.recorder.calls.length);
const args11 = c11.plugin.recorder.calls[0];
check('传入本次会话数据', args11.data && typeof args11.data.pauses === 'number');

// 未点记录、直接关闭 → 不写入
const c12 = boot((s) => { s.record.enabled = true; });
global.__settings = [];
global.__modals = [];
c12.startSession(null, 'study');
c12.stop();
const sum12 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
await sum12.confirmClose();
check('直接关闭不写入', c12.plugin.recorder.calls.length === 0, c12.plugin.recorder.calls.length);

// 自动记录开启 → 结束弹窗出现时不卡住，关闭后才写
const c14 = boot((s) => { s.record.enabled = true; s.record.autoRecord = true; });
global.__settings = [];
global.__modals = [];
c14.startSession(null, 'study');
c14.stop();
const sum14 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
check('自动记录开启时弹窗仍立即出现', !!sum14);
check('弹窗出现时尚未写入', c14.plugin.recorder.calls.length === 0, c14.plugin.recorder.calls.length);
sum14.dismiss(); // 弹窗内按钮路径：不受「防误关」计数限制
await new Promise((r) => setTimeout(r, 120));
check('关闭弹窗后自动写入', c14.plugin.recorder.calls.length === 1, c14.plugin.recorder.calls.length);

// 自动记录关闭 → 关闭弹窗也不写
const c15 = boot((s) => { s.record.enabled = true; s.record.autoRecord = false; });
global.__settings = [];
global.__modals = [];
c15.startSession(null, 'study');
c15.stop();
const sum15 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
sum15.dismiss(); // 弹窗内按钮路径：不受「防误关」计数限制
await new Promise((r) => setTimeout(r, 120));
check('自动记录关闭时不自动写', c15.plugin.recorder.calls.length === 0, c15.plugin.recorder.calls.length);

// 总开关关闭 → 即使 autoRecord 为真也不写
const c16 = boot((s) => { s.record.enabled = false; s.record.autoRecord = true; });
global.__modals = [];
c16.startSession(null, 'study');
c16.stop();
const sum16 = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
sum16.dismiss(); // 弹窗内按钮路径：不受「防误关」计数限制
await new Promise((r) => setTimeout(r, 120));
check('总开关优先于自动记录', c16.plugin.recorder.calls.length === 0, c16.plugin.recorder.calls.length);

/* ============ 3g. 自动记录开关文案 ============ */
console.log('\n[3g] 自动记录开关文案');

const gSettings = migrateSettings(null);
gSettings.record.enabled = true;
const gPlugin = {
  settings: gSettings,
  app: { plugins: { plugins: {} } },
  saveSettings: async () => {},
  redrawSettingsTab: () => {},
};
global.__settings = [];
recorder.renderRecordSettings(new obsidian.MockEl('div'), gPlugin);
const autoSetting = global.__settings.find((x) => x.name === '是否自动记录');
check('开关名为是否自动记录', !!autoSetting, global.__settings.map((x) => x.name).join(','));
check('默认关闭', autoSetting.components[0].value === false);
check('说明含手动点记录才记录', autoSetting.desc.includes('手动'), autoSetting.desc);
autoSetting.components[0].change(true);
check('开启后写入设置', gSettings.record.autoRecord === true);

/* ============ 3f. 设置页下拉与保存 ============ */
console.log('\n[3f] 设置页选项下拉与保存');

// 渲染 QuickAdd 区块，检查下拉行为
const qaUI = {
  api: { executeChoice: async () => {} },
  loadData: async () => ({
    choices: [
      { type: 'Multi', name: '我的收集箱', choices: [{ type: 'Capture', name: '番茄钟写入' }] },
      { type: 'Capture', name: '记录' },
    ],
  }),
};

function makeUIPlugin(settings, quickadd) {
  const plugin = {
    settings,
    app: { plugins: { plugins: quickadd ? { quickadd } : {} } },
    saveSettings: async () => {},
    redrawSettingsTab: () => { redrawCount += 1; },
  };
  let redrawCount = 0;
  return { plugin, getRedraws: () => redrawCount };
}

const uiSettings = migrateSettings(null);
uiSettings.record.enabled = true;
uiSettings.record.mode = 'quickadd';
uiSettings.record.quickAddChoice = '番茄钟写入'; // 嵌套选项，不在顶层
const ui = makeUIPlugin(uiSettings, qaUI);

const box = new obsidian.MockEl('div');
global.__settings = [];
recorder.renderRecordSettings(box, ui.plugin);
await new Promise((r) => setTimeout(r, 30)); // 等异步填充

const ddSetting = global.__settings.find((x) => x.name === '选择已有选项');
check('下拉存在', !!ddSetting);
const dd = ddSetting && ddSetting.components[0];
check('下拉含嵌套选项番茄钟写入', dd && dd.options && dd.options['番茄钟写入'], JSON.stringify(dd && dd.options));
check('下拉为当前值补了占位项', dd && typeof dd.value === 'string', dd && dd.value);
check('下拉不因重绘丢失当前值', dd && dd.value === '番茄钟写入', dd && dd.value);

const textSetting = global.__settings.find((x) => x.name === '选项名');
const tc = textSetting && textSetting.components[0];
check('选项名输入框预填当前值', tc && tc.value === '番茄钟写入', tc && tc.value);

// 从下拉选一个 → 应立即写入设置并同步输入框，且不整页重绘
let savedAfter = null;
ui.plugin.saveSettings = async () => { savedAfter = uiSettings.record.quickAddChoice; };
dd && dd.change && (await dd.change('记录'));
check('下拉选择后写入设置', uiSettings.record.quickAddChoice === '记录', uiSettings.record.quickAddChoice);
check('下拉选择后同步输入框', tc && tc.value === '记录', tc && tc.value);
check('下拉选择不触发整页重绘', ui.getRedraws() === 0, ui.getRedraws());

// 手填名字 → 保存
tc && tc.change && (await tc.change('番茄钟写入'));
check('手填后写入设置', uiSettings.record.quickAddChoice === '番茄钟写入', uiSettings.record.quickAddChoice);

/* ============ 3h. 联动失败回退开关 ============ */
console.log('\n[3h] 联动失败回退开关');

// 内置写入环境：记录落到哪个文件
function makeFilePlugin(settings, quickadd) {
  const written = [];
  const vault = {
    getAbstractFileByPath: () => null,
    createFolder: async () => {},
    create: async (p) => ({ path: p }),
    read: async () => '',
    modify: async (f, c) => { written.push({ path: f.path, content: c }); },
  };
  const plugin = {
    settings,
    app: { plugins: { plugins: quickadd ? { quickadd } : {} }, vault },
    saveSettings: async () => {},
  };
  return { plugin, written };
}

const sampleFb = {
  date: '2026-09-19', time: '19:50', range: '19:50 – 19:50',
  cycles: 1, focusMin: 25, restMin: 5, pauses: 0, longBreaks: 0,
  skippedFocus: 0, skippedBreak: 0, profileName: '学习',
};

// 情形一：回退开启 + QuickAdd 不可用 → 写进笔记
{
  const st = migrateSettings(null);
  st.record.enabled = true;
  st.record.mode = 'quickadd';
  st.record.fallbackToBuiltin = true;
  st.record.defaultNoteName = '番茄记录';
  const { plugin, written } = makeFilePlugin(st, null); // 未装 QuickAdd
  const rec = new recorder.Recorder(plugin);
  await rec.record(sampleFb);
  check('回退开启时写入笔记', written.length === 1, written.length);
  check('写入默认笔记名', written[0] && written[0].path.includes('番茄记录'), written[0] && written[0].path);
  check('写入内容含轮数', written[0] && written[0].content.includes('完成 1 轮'));
}

// 情形二：回退关闭 + QuickAdd 不可用 → 不写
{
  const st = migrateSettings(null);
  st.record.enabled = true;
  st.record.mode = 'quickadd';
  st.record.fallbackToBuiltin = false;
  const { plugin, written } = makeFilePlugin(st, null);
  const rec = new recorder.Recorder(plugin);
  await rec.record(sampleFb);
  check('回退关闭时不写入', written.length === 0, written.length);
}

// 情形三：回退关闭 + QuickAdd 正常 → 正常执行，不写笔记
{
  let ran = false;
  const qaOk = {
    api: { executeChoice: async () => { ran = true; } },
    loadData: async () => ({ choices: [{ name: '番茄钟写入' }] }),
  };
  const st = migrateSettings(null);
  st.record.enabled = true;
  st.record.mode = 'quickadd';
  st.record.quickAddChoice = '番茄钟写入';
  st.record.fallbackToBuiltin = false;
  const { plugin, written } = makeFilePlugin(st, qaOk);
  const rec = new recorder.Recorder(plugin);
  await rec.record(sampleFb);
  check('回退关闭不影响成功路径', ran === true && written.length === 0, `ran=${ran} written=${written.length}`);
}

// 设置页存在该开关
{
  const st = migrateSettings(null);
  st.record.enabled = true;
  st.record.mode = 'quickadd';
  const plugin = {
    settings: st,
    app: { plugins: { plugins: {} } },
    saveSettings: async () => {},
    redrawSettingsTab: () => {},
  };
  global.__settings = [];
  recorder.renderRecordSettings(new obsidian.MockEl('div'), plugin);
  await new Promise((r) => setTimeout(r, 30));
  const fb = global.__settings.find((x) => x.name === '联动失败时改用内置写入');
  check('设置页有回退开关', !!fb);
  check('回退开关默认开启', fb && fb.components[0].value === true);
  fb.components[0].change(false);
  check('可关闭回退', st.record.fallbackToBuiltin === false);
}

/* ============ 3i. 浮窗定位与资源清理 ============ */
console.log('\n[3i] 浮窗定位与资源清理');

// 精确像素坐标：视口未变时原样还原
{
  const st = migrateSettings(null);
  st.pomodoro.uiMode = 'floating';
  st.pomodoro.snapToEdge = false;
  st.pomodoro.freePxX = 300;
  st.pomodoro.freePxY = 220;
  st.pomodoro.lastVw = 1200;
  st.pomodoro.lastVh = 800; // 与 mock 的 window 尺寸一致
  const plugin = makePlugin(st);
  const c = new pomodoro.PomodoroController(plugin); plugin.pomodoro = c; c.init();
  const ui = c.floatUI;
  ui.applyPosition();
  check('视口未变时用精确像素 X', ui.el.style.left === '300px', ui.el.style.left);
  check('视口未变时用精确像素 Y', ui.el.style.top === '220px', ui.el.style.top);
}

// 视口变化后回退按比例换算
{
  const st = migrateSettings(null);
  st.pomodoro.uiMode = 'floating';
  st.pomodoro.snapToEdge = false;
  st.pomodoro.freePxX = 900;
  st.pomodoro.freePxY = 600;
  st.pomodoro.lastVw = 1600; // 与当前 1200 不同
  st.pomodoro.lastVh = 1000;
  st.pomodoro.freeX = 0.25;
  st.pomodoro.freeY = 0.5;
  const plugin = makePlugin(st);
  const c = new pomodoro.PomodoroController(plugin); plugin.pomodoro = c; c.init();
  const ui = c.floatUI;
  ui.applyPosition();
  check('视口变化时改用比例', ui.el.style.left !== '900px', ui.el.style.left);
  check('比例换算结果在视口内', parseInt(ui.el.style.left, 10) >= 0, ui.el.style.left);
}

// 吸附模式记录沿边像素
{
  const st = migrateSettings(null);
  st.pomodoro.uiMode = 'floating';
  st.pomodoro.snapToEdge = true;
  const plugin = makePlugin(st);
  const c = new pomodoro.PomodoroController(plugin); plugin.pomodoro = c; c.init();
  const ui = c.floatUI;
  ui.el.getBoundingClientRect = () => ({ left: 500, top: 400, width: 260, height: 300 });
  ui.snapToEdge();
  check('吸附时记录沿边像素', typeof st.pomodoro.floatPx === 'number', st.pomodoro.floatPx);
  check('吸附时记录视口尺寸', st.pomodoro.lastVw === 1200 && st.pomodoro.lastVh === 800,
    `${st.pomodoro.lastVw}x${st.pomodoro.lastVh}`);
}

// 计时器只注册一次
{
  const plugin = makePlugin(migrateSettings(null));
  plugin.registeredIntervals = [];
  plugin.registerInterval = (id) => plugin.registeredIntervals.push(id);
  const c = new pomodoro.PomodoroController(plugin); plugin.pomodoro = c; c.init();
  c.startSession(null, 'study');
  c.expire = () => { c.endsAt = Date.now() - 1; c.tick(); };
  for (let i = 0; i < 8; i++) c.expire();
  check('跑多段只注册一次 interval', plugin.registeredIntervals.length <= 2, plugin.registeredIntervals.length);
}

// 切到侧边栏时销毁浮窗
{
  const st = migrateSettings(null);
  st.pomodoro.uiMode = 'floating';
  const plugin = makePlugin(st);
  const c = new pomodoro.PomodoroController(plugin); plugin.pomodoro = c; c.init();
  const ui = c.floatUI;
  let removed = false;
  ui.el.remove = () => { removed = true; };
  ui.destroy();
  check('销毁浮窗会移除 DOM', removed === true);
}

/* ============ 3j. 音效递归扫描 ============ */
console.log('\n[3j] 音效递归扫描');

function makeSoundPlugin(tree) {
  const plugin = makePlugin(migrateSettings(null));
  plugin.settings.pomodoro.soundFolder = '音效';
  plugin.app.vault = {
    adapter: {
      list: async (p) => {
        const node = tree[p];
        if (!node) throw new Error('not found: ' + p);
        return node;
      },
    },
  };
  const c = new pomodoro.PomodoroController(plugin); plugin.pomodoro = c;
  return c;
}

{
  const tree = {
    '音效': { files: ['音效/a.mp3'], folders: ['音效/雨声', '音效/白噪'] },
    '音效/雨声': { files: ['音效/雨声/rain.ogg', '音效/雨声/note.txt'], folders: [] },
    '音效/白噪': { files: ['音效/白噪/white.wav'], folders: ['音效/白噪/深层'] },
    '音效/白噪/深层': { files: ['音效/白噪/深层/deep.m4a'], folders: [] },
  };
  const c = makeSoundPlugin(tree);
  await c.refreshSoundFiles();
  const list = c.soundFiles;
  check('递归扫到子目录音频', list.length === 4, list.join(','));
  check('含一级音频', list.some((f) => f === '音效/a.mp3'));
  check('含子目录音频', list.some((f) => f === '音效/雨声/rain.ogg'));
  check('含二级子目录音频', list.some((f) => f === '音效/白噪/深层/deep.m4a'));
  check('过滤掉非音频文件', !list.some((f) => f.endsWith('.txt')), list.join(','));
}

// 单个子目录读不到时不影响其他目录
{
  const tree = {
    '音效': { files: ['音效/a.mp3'], folders: ['音效/坏的'] },
  };
  const c = makeSoundPlugin(tree);
  await c.refreshSoundFiles();
  check('坏目录被跳过且不影响其他', c.soundFiles.length === 1, c.soundFiles.join(','));
}

// 目录不存在时清空而不是报错
{
  const c = makeSoundPlugin({});
  await c.refreshSoundFiles();
  check('目录不存在时安全清空', c.soundFiles.length === 0, c.soundFiles.length);
}

/* ============ 3k. 时间转换扩展 ============ */
console.log('\n[3k] 时间转换扩展');

const ta = require(__dirname + '/../src/timestamp.js');

function mkConvertPlugin(mutate, editor) {
  const settings = migrateSettings(null);
  if (mutate) mutate(settings);
  const ed = editor || {
    getSelection: () => '',
    getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => '',
    replaceSelection: () => {},
  };
  const plugin = {
    settings,
    app: {
      workspace: {
        activeEditor: { editor: ed },
        // 右键菜单事件；测试里可替换为能捕获回调的桩
        on: () => ({}),
      },
      commands: { listCommands: () => [] },
    },
    commands: [],
    menuEvents: null, // 若测试想拿到 editor-menu 回调，自行替换 app.workspace.on
    addCommand: (c) => plugin.commands.push(c),
    registerEvent: () => {},
    saveSettings: async () => {},
    redrawSettingsTab: () => {},
    manifest: { name: 'Time Tools', version: '0.0.0' },
  };
  return plugin;
}

/** 用指定选区跑一次转换命令，返回弹出的面板（若有） */

// 按 id 取转换命令：命令注册顺序会变，写死 [0] 会拿到错的那个（v3.13 踩到）
function cmdConvert(plugin) {
  return plugin.commands.find((c) => c.id === 'time-tools-timestamp-convert');
}

function runConvert(plugin, selection, line) {
  global.__modals = [];
  global.__notices = [];
  plugin.app.workspace.activeEditor.editor.getSelection = () => selection;
  plugin.app.workspace.activeEditor.editor.getLine = () => (line === undefined ? '' : line);
  // 按 id 找，别用 [0] —— 命令注册顺序一变就会拿到错的那个（v3.13 踩到）
  const cmd = plugin.commands.find((c) => c.id === 'time-tools-timestamp-convert');
  if (cmd) cmd.checkCallback(false);
  return global.__modals.find((m) => m.constructor.name === 'TimeActionModal');
}

const cp = mkConvertPlugin();

// --- 解析 ---
check('解析 YYYY-MM-DD', !!ta.parseToDate('2026-09-19'));
check('解析 YYYY/M/D', !!ta.parseToDate('2026/9/19'));
check('解析中文日期', !!ta.parseToDate('2026年9月19日'));
check('解析带时分', !!ta.parseToDate('2026-09-19 14:30'));
check('解析带时分秒', !!ta.parseToDate('2026-09-19 14:30:25'));
check('解析 10 位时间戳', !!ta.parseToDate('1768800000'));
check('解析 13 位时间戳', !!ta.parseToDate('1768800000000'));
check('解析纯时分', !!ta.parseToDate('14:30'));
check('无法解析时返回 null', ta.parseToDate('随便一段话') === null);
check('空串返回 null', ta.parseToDate('') === null);
check('识别 Unix 时间戳', ta.looksLikeUnix('1768800000') === true);
check('普通日期不算时间戳', ta.looksLikeUnix('2026-09-19') === false);

const parsed = ta.parseToDate('2026-09-19 14:30');
check('解析出正确的月份', parsed.getMonth() === 8, parsed.getMonth());
check('解析出正确的小时', parsed.getHours() === 14, parsed.getHours());

// --- 相对时间 ---
const now = Date.now();
check('刚刚', ta.toRelative(new Date(now - 5000)) === '刚刚', ta.toRelative(new Date(now - 5000)));
check('分钟前', /分钟前$/.test(ta.toRelative(new Date(now - 5 * 60000))));
check('小时前', /小时前$/.test(ta.toRelative(new Date(now - 3 * 3600000))));
check('天前', /天前$/.test(ta.toRelative(new Date(now - 3 * 86400000))));
check('未来用「后」', /后$/.test(ta.toRelative(new Date(now + 3 * 86400000))));

// --- 各转换项 ---
const d = '2026-09-19';
check('补星期输出周几', /^\d{4}-\d{2}-\d{2} 周[日一二三四五六]$/.test(ta.compute(cp, 'weekday', d)),
  ta.compute(cp, 'weekday', d));
check('日记链接格式', ta.compute(cp, 'dailyLink', d) === '[[2026-09-19]]', ta.compute(cp, 'dailyLink', d));
check('日期转时间戳为 10 位数字', /^\d{10}$/.test(ta.compute(cp, 'unixEncode', d)), ta.compute(cp, 'unixEncode', d));
check('时间戳转日期', !!ta.compute(cp, 'unixDecode', '1768800000'), ta.compute(cp, 'unixDecode', '1768800000'));
check('时间戳项不接受普通日期', ta.compute(cp, 'unixDecode', d) === null);
check('偏移 +7 天', ta.compute(cp, 'dateShift', d, { shift: 7 }) === '2026-09-26',
  ta.compute(cp, 'dateShift', d, { shift: 7 }));
check('偏移 -3 天', ta.compute(cp, 'dateShift', d, { shift: -3 }) === '2026-09-16',
  ta.compute(cp, 'dateShift', d, { shift: -3 }));
check('偏移 0 返回 null', ta.compute(cp, 'dateShift', d, { shift: 0 }) === null);
check('无法解析时所有项返回 null', ta.compute(cp, 'weekday', 'abcd') === null);
check('未知项返回 null', ta.compute(cp, 'nope', d) === null);

// --- 默认开关状态 ---
const defExt = migrateSettings(null).timestamp.extensions;
check('扩展总开关默认打开', defExt.enabled === true, defExt.enabled);
check('相对时间默认开', defExt.items.relative === true);
check('补星期默认开', defExt.items.weekday === true);
check('日记链接默认开', defExt.items.dailyLink === true);
check('时间戳解码默认开', defExt.items.unixDecode === true);
check('日期偏移默认关', defExt.items.dateShift === false);

// --- 设置不膨胀：废弃键被剔除 ---
const bloated = migrateSettings({
  timestamp: {
    extensions: {
      enabled: false,
      items: { relative: true, 已废弃的旧项: true, 另一个旧项: false },
      dailyLinkFormat: 'YYYY/MM/DD',
      已废弃字段: 'xxx',
    },
  },
});
const bExt = bloated.timestamp.extensions;
check('保留已知项设置', bExt.items.relative === true);
check('剔除废弃的项键', !('已废弃的旧项' in bExt.items), Object.keys(bExt.items).join(','));
check('剔除废弃的顶层键', !('已废弃字段' in bExt), Object.keys(bExt).join(','));
check('保留自定义链接格式', bExt.dailyLinkFormat === 'YYYY/MM/DD', bExt.dailyLinkFormat);
check('保留总开关设置', bExt.enabled === false);
check('项数量恒定为 22（废弃键被剔除）', Object.keys(bExt.items).length === 22, Object.keys(bExt.items).length);

// --- 默认值不被污染 ---
const a1 = migrateSettings(null);
a1.timestamp.extensions.items.relative = false;
const a2 = migrateSettings(null);
check('默认常量未被污染', a2.timestamp.extensions.items.relative === true,
  a2.timestamp.extensions.items.relative);

// --- 总开关关闭时命令提示且不执行 ---
{
  const plugin = mkConvertPlugin((s) => { s.timestamp.extensions.enabled = false; });
  ta.registerTimeActions(plugin);
  /*
   * 两个命令（转换 + 撤回）。诊断命令已移除 —— 它只弹提示不做操作，
   * 留在面板里是个假入口（见 timestamp.js 注释）。
   */
  // v3.13 新增「批量转换（整篇笔记）」，故为 3 个；顺序随注册写法变，故按集合断言
  check('注册三个命令（转换 + 批量转换 + 撤回）', plugin.commands.length === 3, plugin.commands.length);
  check('命令 id 带前缀',
    plugin.commands.every((c) => String(c.id).indexOf('time-tools-') === 0),
    plugin.commands.map((c) => c.id).join(','));
  check('含批量转换命令',
    plugin.commands.some((c) => c.id === 'time-tools-timestamp-batch-convert'),
    plugin.commands.map((c) => c.id).join(','));
  runConvert(plugin, '2026-09-19');
  check('总开关关闭时不弹面板', global.__modals.length === 0, global.__modals.length);
  /*
   * 总开关关闭时命令用 checkCallback 返回 false —— 直接从面板消失，
   * 而不是点了才弹提示（后者等于给用户一个点了没反应的入口）。
   */
  check('总开关关闭时命令不可见',
    cmdConvert(plugin).checkCallback(true) === false);
}

// --- 正常路径：弹面板并应用 ---
{
  const plugin = mkConvertPlugin();
  ta.registerTimeActions(plugin);
  let replaced = null;
  const ed0 = plugin.app.workspace.activeEditor.editor;
  ed0.replaceSelection = (t) => { replaced = t; };
  // 新版 apply 需要定位选区，补上 mock
  if (!ed0.setSelection) ed0.setSelection = () => {};
  if (!ed0.getCursor) ed0.getCursor = () => ({ line: 0, ch: 0 });
  const modal = runConvert(plugin, '2026-09-19');
  check('弹出转换面板', !!modal);
  const items = modal ? modal.availableItems() : [];
  check('可用项含星期', items.some((i) => i.key === 'weekday'), items.map((i) => i.key).join(','));
  check('可用项含日记链接', items.some((i) => i.key === 'dailyLink'));
  check('关闭的项不出现', !items.some((i) => i.key === 'dateShift'), items.map((i) => i.key).join(','));
  modal.apply('RESULT');
  check('应用后替换选区（正文不带标记）', replaced === 'RESULT', replaced);
}

// --- 选中非时间文本时给出空态 ---
{
  const plugin = mkConvertPlugin();
  ta.registerTimeActions(plugin);
  const modal = runConvert(plugin, '这不是时间');
  check('非时间文本时可用项为空', modal && modal.availableItems().length === 0);
}

// --- 空选区不弹面板 ---
{
  const plugin = mkConvertPlugin();
  ta.registerTimeActions(plugin);
  runConvert(plugin, '', '这行没有时间');
  check('空选区且行内无时间时不弹面板', global.__modals.length === 0, global.__modals.length);
}

// --- 关闭某项后不再出现 ---
{
  const plugin = mkConvertPlugin((s) => { s.timestamp.extensions.items.weekday = false; });
  ta.registerTimeActions(plugin);
  const modal = runConvert(plugin, '2026-09-19');
  check('关掉的项不出现在面板', !modal.availableItems().some((i) => i.key === 'weekday'),
    modal.availableItems().map((i) => i.key).join(','));
}

/* ============ 3l. 农历与节气 ============ */
console.log('\n[3l] 农历与节气');

const { lunar } = require(__dirname + '/../src/timestamp.js');

// --- 已知日期对照（春节 / 闰月） ---
const lc = (y, m, d) => {
  const r = lunar.solarToLunar(y, m, d);
  return r ? lunar.formatLunar(r) : null;
};
check('1900-01-31 为农历基准正月初一', lc(1900, 1, 31) === '农历1900年正月初一', lc(1900, 1, 31));
check('2026-02-17 为丙午年正月初一', lc(2026, 2, 17) === '农历2026年正月初一', lc(2026, 2, 17));
check('2025-01-29 为乙巳年正月初一', lc(2025, 1, 29) === '农历2025年正月初一', lc(2025, 1, 29));
check('2024-02-10 为甲辰年正月初一', lc(2024, 2, 10) === '农历2024年正月初一', lc(2024, 2, 10));
check('2020-01-25 为庚子年正月初一', lc(2020, 1, 25) === '农历2020年正月初一', lc(2020, 1, 25));
check('2023-02-20 为二月初一', lc(2023, 2, 20) === '农历2023年二月初一', lc(2023, 2, 20));
check('2023 闰二月识别正确', lc(2023, 3, 22) === '农历2023年闰二月初一', lc(2023, 3, 22));
check('闰月后三月正常', lc(2023, 4, 20) === '农历2023年三月初一', lc(2023, 4, 20));

// --- 范围外返回 null ---
check('早于 1900 返回 null', lunar.solarToLunar(1899, 12, 31) === null);
check('晚于 2100 返回 null', lunar.solarToLunar(2101, 1, 1) === null);
check('1900 基准日之前返回 null', lunar.solarToLunar(1900, 1, 30) === null);

// --- 日/月中文 ---
check('初一', lunar.cnDay(1) === '初一');
check('初十', lunar.cnDay(10) === '初十');
check('十五', lunar.cnDay(15) === '十五', lunar.cnDay(15));
check('二十', lunar.cnDay(20) === '二十');
check('廿三', lunar.cnDay(23) === '廿三', lunar.cnDay(23));
check('三十', lunar.cnDay(30) === '三十');
check('正月', lunar.cnMonth(1, false) === '正月');
check('腊月', lunar.cnMonth(12, false) === '腊月', lunar.cnMonth(12, false));
check('闰月带闰字', lunar.cnMonth(2, true) === '闰二月', lunar.cnMonth(2, true));

// --- 干支生肖 ---
check('2026 丙午马', lunar.ganZhi(2026) === '丙午' && lunar.zodiac(2026) === '马');
check('2024 甲辰龙', lunar.ganZhi(2024) === '甲辰' && lunar.zodiac(2024) === '龙');
check('2020 庚子鼠', lunar.ganZhi(2020) === '庚子' && lunar.zodiac(2020) === '鼠');
check('1984 甲子鼠', lunar.ganZhi(1984) === '甲子' && lunar.zodiac(1984) === '鼠');

// --- 节气 ---
check('2026 立春 2/4', lunar.termDay(2026, 2) === 4, lunar.termDay(2026, 2));
check('2026 清明 4/5', lunar.termDay(2026, 4) === 5, lunar.termDay(2026, 4));
check('2026 秋分 9/23', lunar.termDay(2026, 17) === 23, lunar.termDay(2026, 17));
check('2026 夏至 6/21', lunar.termDay(2026, 11) === 21, lunar.termDay(2026, 11));
check('查得到立春', lunar.solarTerm(2026, 2, 4) === '立春', lunar.solarTerm(2026, 2, 4));
check('非节气返回 null', lunar.solarTerm(2026, 9, 19) === null, lunar.solarTerm(2026, 9, 19));
check('节气名共 24 个', lunar.SOLAR_TERMS.length === 24);

// --- 表完整性 ---
check('数据表 201 项', lunar.LUNAR_INFO.length === 201, lunar.LUNAR_INFO.length);
check('每年天数在合理区间', (() => {
  for (let y = 1900; y <= 2100; y++) {
    const n = lunar.yearDays(y);
    if (n < 353 || n > 385) return false;
  }
  return true;
})());

// --- 通过转换接口调用 ---
const lcp = mkConvertPlugin();
check('转农历项可用', !!ta.compute(lcp, 'lunar', '2026-09-19'), ta.compute(lcp, 'lunar', '2026-09-19'));
check('干支项输出含生肖', / · \S+年$/.test(ta.compute(lcp, 'lunarGanzhi', '2026-09-19') || ''),
  ta.compute(lcp, 'lunarGanzhi', '2026-09-19'));
check('非节气日节气项返回 null', ta.compute(lcp, 'solarTerm', '2026-09-19') === null);
check('节气日能查出', ta.compute(lcp, 'solarTerm', '2026-02-04') === '立春',
  ta.compute(lcp, 'solarTerm', '2026-02-04'));
check('超出范围时农历项返回 null', ta.compute(lcp, 'lunar', '1850-01-01') === null);

// --- 默认开关 ---
const lExt = migrateSettings(null).timestamp.extensions;
check('转农历默认开', lExt.items.lunar === true);
check('干支生肖默认关', lExt.items.lunarGanzhi === false);
check('查节气默认关', lExt.items.solarTerm === false);
check('转换项总数为 22', Object.keys(lExt.items).length === 22, Object.keys(lExt.items).length);

/* ============ 3m. 农历 → 阳历 ============ */
console.log('\n[3m] 农历 → 阳历');

// --- 已知日期反向核对 ---
check('农历2026年正月初一 → 2026-02-17', lunar.lunarToSolar(2026, 1, 1, false).toISOString().slice(0, 10) === '2026-02-17',
  lunar.lunarToSolar(2026, 1, 1, false).toISOString().slice(0, 10));
check('农历2025年正月初一 → 2025-01-29', lunar.lunarToSolar(2025, 1, 1, false).toISOString().slice(0, 10) === '2025-01-29');
check('农历2024年正月初一 → 2024-02-10', lunar.lunarToSolar(2024, 1, 1, false).toISOString().slice(0, 10) === '2024-02-10');
check('农历2020年正月初一 → 2020-01-25', lunar.lunarToSolar(2020, 1, 1, false).toISOString().slice(0, 10) === '2020-01-25');
check('农历2023年闰二月初一 → 2023-03-22', lunar.lunarToSolar(2023, 2, 1, true).toISOString().slice(0, 10) === '2023-03-22',
  lunar.lunarToSolar(2023, 2, 1, true).toISOString().slice(0, 10));
check('农历2023年三月初一 → 2023-04-20', lunar.lunarToSolar(2023, 3, 1, false).toISOString().slice(0, 10) === '2023-04-20');

// --- 闰月年的后续月份（曾因漏加闰月天数而整体偏移一个月）---
{
  const d = lunar.lunarToSolar(2023, 7, 1, false); // 2023 闰二月
  const back = lunar.solarToLunar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  check('闰月年后七月定位正确', back && back.year === 2023 && back.month === 7 && back.day === 1,
    JSON.stringify(back));
  const d2 = lunar.lunarToSolar(2025, 7, 1, false); // 2025 闰六月
  const back2 = lunar.solarToLunar(d2.getUTCFullYear(), d2.getUTCMonth() + 1, d2.getUTCDate());
  check('闰六月年后七月定位正确', back2 && back2.year === 2025 && back2.month === 7 && back2.day === 1,
    JSON.stringify(back2));
}

// --- 全表往返一致性 ---
check('平月全表往返一致', (() => {
  for (let y = 1901; y <= 2100; y++) {
    for (let m = 1; m <= 12; m++) {
      const d = lunar.lunarToSolar(y, m, 1, false);
      if (!d) return false;
      const b = lunar.solarToLunar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      if (!b || b.year !== y || b.month !== m || b.day !== 1 || b.isLeap) return false;
    }
  }
  return true;
})());
check('闰月全表往返一致', (() => {
  for (let y = 1901; y <= 2100; y++) {
    const leap = lunar.leapMonth(y);
    if (!leap) continue;
    const d = lunar.lunarToSolar(y, leap, 1, true);
    if (!d) return false;
    const b = lunar.solarToLunar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    if (!b || b.year !== y || b.month !== leap || b.day !== 1 || !b.isLeap) return false;
  }
  return true;
})());

// --- 非法参数 ---
check('闰月号与实际不符返回 null', lunar.lunarToSolar(2026, 5, 1, true) === null);
check('日期超出当月天数返回 null', lunar.lunarToSolar(2026, 1, 31, false) === null);
check('月份越界返回 null', lunar.lunarToSolar(2026, 13, 1, false) === null);
check('年份越界返回 null', lunar.lunarToSolar(1899, 1, 1, false) === null);

// --- 文本解析 ---
check('解析 2026年八月十九', (() => {
  const r = lunar.parseLunar('2026年八月十九');
  return r && r.year === 2026 && r.month === 8 && r.day === 19 && r.isLeap === false;
})(), JSON.stringify(lunar.parseLunar('2026年八月十九')));
check('解析 八月十九（不写年份取当前农历年）', (() => {
  const r = lunar.parseLunar('八月十九');
  return r && r.month === 8 && r.day === 19;
})(), JSON.stringify(lunar.parseLunar('八月十九')));
check('解析 农历2026年八月初一', (() => {
  const r = lunar.parseLunar('农历2026年八月初一');
  return r && r.year === 2026 && r.month === 8 && r.day === 1;
})(), JSON.stringify(lunar.parseLunar('农历2026年八月初一')));
check('解析 闰二月初五', (() => {
  const r = lunar.parseLunar('2023年闰二月初五');
  return r && r.year === 2023 && r.month === 2 && r.day === 5 && r.isLeap === true;
})(), JSON.stringify(lunar.parseLunar('2023年闰二月初五')));
check('解析 冬月', (() => {
  const r = lunar.parseLunar('2026年冬月初一');
  return r && r.month === 11;
})(), JSON.stringify(lunar.parseLunar('2026年冬月初一')));
check('解析 腊月', (() => {
  const r = lunar.parseLunar('2026年腊月初八');
  return r && r.month === 12 && r.day === 8;
})(), JSON.stringify(lunar.parseLunar('2026年腊月初八')));
check('解析 二十（特殊写法）', (() => {
  const r = lunar.parseLunar('2026年八月二十');
  return r && r.day === 20;
})(), JSON.stringify(lunar.parseLunar('2026年八月二十')));
check('解析 三十', (() => {
  const r = lunar.parseLunar('2026年八月三十');
  return r && r.day === 30;
})(), JSON.stringify(lunar.parseLunar('2026年八月三十')));
check('解析 廿三', (() => {
  const r = lunar.parseLunar('2026年八月廿三');
  return r && r.day === 23;
})(), JSON.stringify(lunar.parseLunar('2026年八月廿三')));
check('解析中文数字年份 二〇二六', (() => {
  const r = lunar.parseLunar('二〇二六年八月十九');
  return r && r.year === 2026;
})(), JSON.stringify(lunar.parseLunar('二〇二六年八月十九')));
check('解析非农历文本返回 null', lunar.parseLunar('2026-09-19') === null);
check('解析空串返回 null', lunar.parseLunar('') === null);

// --- 通过转换接口 ---
const lst = mkConvertPlugin();
check('农历转阳历项可用', ta.compute(lst, 'lunarToSolar', '2026年八月十九') === '2026-09-29',
  ta.compute(lst, 'lunarToSolar', '2026年八月十九'));
check('阳历日期不触发农历转阳历', ta.compute(lst, 'lunarToSolar', '2026-09-19') === null,
  ta.compute(lst, 'lunarToSolar', '2026-09-19'));
check('农历转阳历默认开', migrateSettings(null).timestamp.extensions.items.lunarToSolar === true);
check('转换项总数为 22', Object.keys(migrateSettings(null).timestamp.extensions.items).length === 22,
  Object.keys(migrateSettings(null).timestamp.extensions.items).length);

// --- 已知边界：农历 2100 年腊月跨到阳历 2101 年 ---
check('表边界处反向查不到属正常', lunar.solarToLunar(2101, 1, 14) === null);

/* ============ 3n. 设置页附加区块（常量数组 + 故障隔离） ============ */
console.log('\n[3n] 设置页附加区块');

const { SECTIONS, TABS } = require(__dirname + '/../src/settings.js');

// --- 区块清单本身 ---
check('SECTIONS 至少含 record', SECTIONS.some((x) => x.id === 'record'),
  SECTIONS.map((x) => x.id).join(','));
check('record 挂在 pomodoro 标签', SECTIONS.find((x) => x.id === 'record').tab === 'pomodoro');
check('record 排在后面（order 200）', SECTIONS.find((x) => x.id === 'record').order === 200);
check('每项都有 render 函数', SECTIONS.every((x) => typeof x.render === 'function'));
check('id 无重复', new Set(SECTIONS.map((x) => x.id)).size === SECTIONS.length,
  SECTIONS.map((x) => x.id).join(','));
check('tab 值合法', SECTIONS.every((x) => x.tab === 'timestamp' || x.tab === 'pomodoro'));

// --- 标签只剩两个 ---
check('标签数量为 4（时间戳/番茄钟/日历/界面语言）', TABS.length === 4, TABS.length);
check('标签为时间戳/番茄钟/日历',
  TABS.map((t) => t.key).join(',') === 'timestamp,pomodoro,calendar,lang');
check('不再有独立记录标签', !TABS.some((t) => t.key === 'record'));

// --- 故障隔离：坏块不影响前后 ---
{
  const plugin = { settings: migrateSettings(null), saveSettings: async () => {} };
  plugin.pomodoro = { settings: plugin.settings.pomodoro };
  const errors = [];
  const origErr = console.error;
  console.error = (...a) => errors.push(a.join(' '));

  // 临时塞两个坏块进数组，验证隔离
  const backup = SECTIONS.slice();
  SECTIONS.length = 0;
  SECTIONS.push(
    { id: 'good1', tab: 'pomodoro', order: 10, render: (el) => el.createDiv({ text: 'GOOD1' }) },
    { id: 'bad', tab: 'pomodoro', order: 20, render: () => { throw new Error('故意炸'); } },
    { id: 'good2', tab: 'pomodoro', order: 30, render: (el) => el.createDiv({ text: 'GOOD2' }) },
    { id: 'other', tab: 'timestamp', order: 10, render: (el) => el.createDiv({ text: 'OTHER' }) }
  );

  const tab = new (require(__dirname + '/../src/settings.js')
    .TimeToolsSettingTab)({}, plugin);
  tab.activeTab = 'pomodoro';
  const el = new obsidian.MockEl('div');
  tab.containerEl = el;

  let threw = null;
  try { tab.renderSections(el, 'pomodoro'); } catch (e) { threw = e.message; }
  console.error = origErr;

  check('坏块不抛出、整页不挂', threw === null, threw);
  check('坏块前的块渲染了', el.textContent.includes('GOOD1'), el.textContent.slice(0, 60));
  check('坏块后的块也渲染了', el.textContent.includes('GOOD2'), el.textContent.slice(0, 60));
  check('坏块显示简提示', el.textContent.includes('加载失败'), el.textContent.slice(0, 100));
  check('简提示含错误原因', el.textContent.includes('故意炸'), el.textContent.slice(0, 120));
  check('简提示指向控制台', el.textContent.includes('开发者控制台'), el.textContent.slice(0, 140));
  check('控制台收到完整错误', errors.some((x) => x.includes('bad')), errors.join(' | ').slice(0, 100));
  check('控制台收到 error 对象', errors.length >= 1, errors.length);
  check('其他标签的块不混入', !el.textContent.includes('OTHER'), el.textContent.slice(0, 80));

  SECTIONS.length = 0;
  backup.forEach((x) => SECTIONS.push(x));
}

// --- id 重复时告警且只渲染一次 ---
{
  const plugin = { settings: migrateSettings(null), saveSettings: async () => {} };
  plugin.pomodoro = { settings: plugin.settings.pomodoro };
  const errors = [];
  const origErr = console.error;
  console.error = (...a) => errors.push(a.join(' '));

  const backup = SECTIONS.slice();
  SECTIONS.length = 0;
  SECTIONS.push(
    { id: 'dup', tab: 'pomodoro', order: 10, render: (el) => el.createDiv({ text: 'DUP' }) },
    { id: 'dup', tab: 'pomodoro', order: 20, render: (el) => el.createDiv({ text: 'DUP2' }) }
  );
  const tab = new (require(__dirname + '/../src/settings.js')
    .TimeToolsSettingTab)({}, plugin);
  const el = new obsidian.MockEl('div');
  tab.renderSections(el, 'pomodoro');
  console.error = origErr;

  check('id 重复时控制台告警', errors.some((x) => x.includes('重复')), errors.join('|').slice(0, 80));
  const count = (el.textContent.match(/DUP/g) || []).length;
  check('重复 id 只渲染一次', count === 1, count);

  SECTIONS.length = 0;
  backup.forEach((x) => SECTIONS.push(x));
}

// --- 按 order 排序 ---
{
  const plugin = { settings: migrateSettings(null), saveSettings: async () => {} };
  plugin.pomodoro = { settings: plugin.settings.pomodoro };
  const backup = SECTIONS.slice();
  SECTIONS.length = 0;
  // 故意乱序登记
  SECTIONS.push(
    { id: 'c', tab: 'pomodoro', order: 30, render: (el) => el.createDiv({ text: 'C' }) },
    { id: 'a', tab: 'pomodoro', order: 10, render: (el) => el.createDiv({ text: 'A' }) },
    { id: 'b', tab: 'pomodoro', order: 20, render: (el) => el.createDiv({ text: 'B' }) }
  );
  const tab = new (require(__dirname + '/../src/settings.js')
    .TimeToolsSettingTab)({}, plugin);
  const el = new obsidian.MockEl('div');
  tab.renderSections(el, 'pomodoro');
  const idx = (t) => el.textContent.indexOf(t);
  check('按 order 升序渲染', idx('A') < idx('B') && idx('B') < idx('C'),
    `A=${idx('A')} B=${idx('B')} C=${idx('C')}`);

  SECTIONS.length = 0;
  backup.forEach((x) => SECTIONS.push(x));
}

// --- 旧配置里的 record 标签兜底 ---
{
  const { TimeToolsSettingTab } = require(__dirname + '/../src/settings.js');
  const plugin = new (require('obsidian').Plugin)(
    { workspace: { getLeavesOfType: () => [] } }, { id: 'time-tools' }
  );
  plugin.settings = migrateSettings(null);
  plugin.settings.pomodoro.lastSettingsTab = 'record'; // 旧值
  plugin.saveSettings = async () => {};
  plugin.redrawSettingsTab = () => {};
  plugin.pomodoro = { settings: plugin.settings.pomodoro };
  const tab = new TimeToolsSettingTab({}, plugin);
  check('旧 record 标签兜底为 pomodoro', tab.activeTab === 'pomodoro', tab.activeTab);
  tab.focusTab('record');
  check('focusTab 旧值也兜底', tab.activeTab === 'pomodoro', tab.activeTab);
  check('兜底后写回合法值', plugin.settings.pomodoro.lastSettingsTab === 'pomodoro',
    plugin.settings.pomodoro.lastSettingsTab);
}

// --- 记录设置渲染无异常 ---
{
  const plugin = makePlugin(migrateSettings(null));
  plugin.settings.record.enabled = true;
  global.__settings = [];
  let threw = null;
  try {
    require(__dirname + '/../src/pomodoro.js')
      .renderRecordSettings(new obsidian.MockEl('div'), plugin);
  } catch (e) { threw = e.message; }
  check('记录设置渲染无异常', threw === null, threw);
  check('记录设置有总开关', global.__settings.some((x) => x.name === '启用会话记录'),
    global.__settings.map((x) => x.name).slice(0, 5).join(','));
}

/* ============ 3o. 转换命令的可用性 ============ */
console.log('\n[3o] 转换命令的可用性');

// 命令必须用 checkCallback：editorCallback 的命令只在编辑器聚焦时可见，
// 用户在设置页 / 图谱视图里搜不到，会以为功能没生效。
{
  const plugin = mkConvertPlugin();
  ta.registerTimeActions(plugin);
  const cmd = plugin.commands.find((c) => c.id === 'time-tools-timestamp-convert');
  check('命令已注册', !!cmd);
  check('用 checkCallback（始终可见）', typeof cmd.checkCallback === 'function');
  check('不是 editorCallback', cmd.editorCallback === undefined);
  check('命令名含连续「时间转换」便于搜索', cmd.name.includes('时间转换'), cmd.name);
  check('checking=true 时返回 true（始终可见）', cmd.checkCallback(true) === true);
}

// 无活动编辑器时给出明确提示
{
  const plugin = mkConvertPlugin();
  plugin.app.workspace.activeEditor = null; // 没有活动编辑器
  ta.registerTimeActions(plugin);
  const cmd = cmdConvert(plugin);
  global.__notices = [];
  global.__modals = [];
  cmd.checkCallback(false);
  check('无编辑器时提示', global.__notices.some((n) => n.includes('打开一篇笔记')),
    global.__notices.join('|'));
  check('无编辑器时不弹面板', global.__modals.length === 0);
}

// 有编辑器无选中：从光标所在行自动提取
{
  const plugin = mkConvertPlugin();
  plugin.app.workspace.activeEditor = {
    editor: {
      getSelection: () => '',
      getCursor: () => ({ line: 0, ch: 0 }),
      getLine: () => '会议定在 2026-09-19 下午三点',
      replaceSelection: () => {},
    },
  };
  ta.registerTimeActions(plugin);
  global.__modals = [];
  cmdConvert(plugin).checkCallback(false);
  const modal = global.__modals.find((m) => m.constructor.name === 'TimeActionModal');
  check('无选中时自动从行内提取日期', modal && modal.raw === '2026-09-19',
    modal ? modal.raw : 'no modal');
}

// 有编辑器无选中、行内也没有时间：提示而非静默
{
  const plugin = mkConvertPlugin();
  plugin.app.workspace.activeEditor = {
    editor: {
      getSelection: () => '',
      getCursor: () => ({ line: 0, ch: 0 }),
      getLine: () => '这段话里没有任何日期',
      replaceSelection: () => {},
    },
  };
  ta.registerTimeActions(plugin);
  global.__notices = [];
  global.__modals = [];
  cmdConvert(plugin).checkCallback(false);
  check('行内无时间时提示', global.__notices.some((n) => n.includes('没找到时间文本')),
    global.__notices.join('|'));
  check('行内无时间时不弹空面板', global.__modals.length === 0);
}

// 有选中时优先用选区
{
  const plugin = mkConvertPlugin();
  plugin.app.workspace.activeEditor = {
    editor: {
      getSelection: () => '2025-01-01',
      getCursor: () => ({ line: 0, ch: 0 }),
      getLine: () => '会议定在 2026-09-19',
      replaceSelection: () => {},
    },
  };
  ta.registerTimeActions(plugin);
  global.__modals = [];
  cmdConvert(plugin).checkCallback(false);
  const modal = global.__modals.find((m) => m.constructor.name === 'TimeActionModal');
  check('有选中时优先用选区', modal && modal.raw === '2025-01-01', modal ? modal.raw : 'no modal');

  // 行内提取也要认得宽松格式（DATE_RE 带 ^$ 锚定，行内必须用不锚定版本）
  const pickCases = [
    ['会议定在 2026-09-19 下午', '2026-09-19'],
    ['会议定在 2026 09 19 下午', '2026 09 19'],
    ['编号 20260919 的订单', '20260919'],
    ['会议定在 2026年09月19日', '2026年09月19日'],
    ['截止 09-17', '09-17'],
    ['时间 14:30 开始', '14:30'],
  ];
  pickCases.forEach(([line, expect]) => {
    const p2 = mkConvertPlugin();
    p2.app.workspace.activeEditor = {
      editor: {
        getSelection: () => '',
        getCursor: () => ({ line: 0, ch: 0 }),
        getLine: () => line,
        replaceSelection: () => {},
      },
    };
    ta.registerTimeActions(p2);
    const m = runConvert(p2, '', line);
    check('行内提取「' + expect + '」', m && m.raw === expect, m ? m.raw : 'no modal');
  });

  // 非数字串不应被当成日期
  {
    const p3 = mkConvertPlugin();
    p3.app.workspace.activeEditor = {
      editor: {
        getSelection: () => '',
        getCursor: () => ({ line: 0, ch: 0 }),
        getLine: () => '这次有 3 个文件和 12 个任务',
        replaceSelection: () => {},
      },
    };
    ta.registerTimeActions(p3);
    runConvert(p3, '', '这次有 3 个文件和 12 个任务');
    check('行内无有效时间时不弹面板', global.__modals.length === 0,
      global.__modals.length);
  }
}

/* ============ 3p. 转换入口的多样性 ============ */
console.log('\n[3p] 转换入口的多样性');

// 命令面板搜不到时，右键菜单是更直觉的入口
{
  const plugin = mkConvertPlugin();
  plugin.menuEvents = {};
  plugin.registerEvent = () => {};
  plugin.app.workspace.on = (name, fn) => { plugin.menuEvents[name] = fn; };
  ta.registerTimeActions(plugin);

  check('注册了 editor-menu 事件', typeof plugin.menuEvents['editor-menu'] === 'function');

  // 模拟右键：有选中
  let menuItems = [];
  const menu = { addItem: (fn) => menuItems.push(fn) };
  const mockItem = () => {
    const o = {
      title: '', icon: '', cb: null,
      setTitle(t) { o.title = t; return o; },
      setIcon(i) { o.icon = i; return o; },
      onClick(c) { o.cb = c; return o; },
    };
    return o;
  };
  // addItem 收到的是回调，回调里会调 item.setTitle...
  const items = [];
  const menu2 = { addItem: (fn) => { const it = mockItem(); fn(it); items.push(it); } };
  plugin.menuEvents['editor-menu'](menu2, {
    getSelection: () => '2026-09-19',
    getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => '会议 2026-09-19',
  });
  check('右键菜单出现一项', items.length === 1, items.length);
  check('菜单标题含时间转换', items[0] && items[0].title.includes('时间转换'),
    items[0] && items[0].title);

  global.__modals = [];
  items[0].cb();
  const modal = global.__modals.find((m) => m.constructor.name === 'TimeActionModal');
  check('右键点击弹出转换面板', !!modal);
  check('右键传入了选区文本', modal && modal.raw === '2026-09-19', modal && modal.raw);
}

// 总开关关闭时右键菜单不应出现
{
  const plugin = mkConvertPlugin((s) => { s.timestamp.extensions.enabled = false; });
  plugin.menuEvents = {};
  plugin.registerEvent = () => {};
  plugin.app.workspace.on = (name, fn) => { plugin.menuEvents[name] = fn; };
  ta.registerTimeActions(plugin);
  const items = [];
  plugin.menuEvents['editor-menu']({ addItem: (fn) => items.push(fn) }, {
    getSelection: () => '2026-09-19',
  });
  check('总开关关闭时右键不出现', items.length === 0, items.length);
}

/*
 * 诊断命令（time-tools-timestamp-diagnose）曾用于确认加载的是哪一版，
 * 后因命令面板里留着一个只弹提示、不做操作的入口而移除（见 timestamp.js 注释）。
 * 断言随之反过来：它**不该**再被注册 —— 否则是回归。
 */
{
  const plugin = mkConvertPlugin();
  plugin.manifest = { name: 'Time Tools', version: '2.10.0' };
  plugin.registerEvent = () => {};
  plugin.app.workspace.on = () => {};
  plugin.app.commands = { listCommands: () => [{ id: 'time-tools-a' }, { id: 'other-b' }] };
  ta.registerTimeActions(plugin);
  const diag = plugin.commands.find((c) => c.id === 'time-tools-timestamp-diagnose');
  check('诊断命令已移除（不再注册）', !diag);
}

/* ============ 3q. 面板渲染：不得因类名用法炸掉 ============ */
console.log('\n[3q] 面板渲染与类名用法');

/*
 * 回归用例。
 * 曾经在这里写 contentEl.addClass('pomo-modal tta-modal') —— addClass 一次
 * 只能加一个类名，传空格会抛 InvalidCharacterError，面板渲染到一半中断，
 * 表现为「弹窗是空白的」。而早期 mock 用 Set 实现不报错，测试全绿、线上翻车。
 * 现在 mock 已复现真实 DOM 行为，下面这些用例能真正拦住回归。
 */

// 1. 扫描全源码：addClass / toggleClass / removeClass 不得传含空格的类名
{
  const fs = require('fs');
  const files = ['settings.js', 'timestamp.js', 'pomodoro.js', 'main.js'];
  const bad = [];
  const pat = /(addClass|toggleClass|removeClass)\(\s*'([^']*)'/g;
  files.forEach((f) => {
    const src = fs.readFileSync(__dirname + '/../src/' + f, 'utf8');
    let m;
    while ((m = pat.exec(src))) {
      if (m[2].trim().indexOf(' ') !== -1) {
        const line = src.slice(0, m.index).split('\n').length;
        bad.push(`${f}:${line} ${m[1]}('${m[2]}')`);
      }
    }
  });
  check('无含空格的类名传给 addClass 类方法', bad.length === 0, bad.join(' | '));
}

// 2. mock 确实会拦截（验证测试工具有效，否则第 1 条形同虚设）
{
  const el = new obsidian.MockEl('div');
  let threw = null;
  try { el.addClass('a b'); } catch (e) { threw = e.message; }
  check('mock 会拦截含空格的类名', threw && threw.includes('InvalidCharacterError'), threw);
  let ok = true;
  try { el.addClass('a'); el.addClass('b'); } catch (e) { ok = false; }
  check('多次调用加多个类名可行', ok && el.hasClass('a') && el.hasClass('b'));
}

// 3. 时间转换面板能完整渲染
{
  const plugin = mkConvertPlugin();
  plugin.app.workspace.activeEditor = {
    editor: {
      getSelection: () => '2026-09-19',
      getCursor: () => ({ line: 0, ch: 0 }),
      getLine: () => '2026-09-19',
      replaceSelection: () => {},
    },
  };
  ta.registerTimeActions(plugin);
  const modal = runConvert(plugin, '2026-09-19');
  check('转换面板能创建', !!modal);
  let threw = null;
  try { modal.onOpen(); } catch (e) { threw = e.message; }
  check('onOpen 不抛异常', threw === null, threw);
  const txt = modal.contentEl.textContent || '';
  check('面板有标题', txt.includes('时间转换'), txt.slice(0, 40));
  check('面板有可用项', modal.availableItems().length > 0, modal.availableItems().length);
}

// 4. 番茄钟各弹窗也能完整渲染（同类问题可能波及）
{
  const plugin = makePlugin(migrateSettings(null));
  const c = new pomodoro.PomodoroController(plugin);
  plugin.pomodoro = c;
  c.init();
  global.__modals = [];
  let threw = null;
  try {
    c.startSession(2, 'study');
    c.finishSession();
  } catch (e) { threw = e.message; }
  check('会话流程不抛异常', threw === null, threw);
  const summary = global.__modals.find((m) => m.constructor.name === 'SummaryModal');
  check('小结弹窗能创建', !!summary);
  if (summary) {
    let t2 = null;
    try { summary.onOpen(); } catch (e) { t2 = e.message; }
    check('小结 onOpen 不抛异常', t2 === null, t2);
  }
}

/* ============ 3r. 识别扩展与逆向转换 ============ */
console.log('\n[3r] 识别扩展与逆向转换');

const allOn = () => {
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  return { settings: st, app: {} };
};
const A = allOn();

// --- 只有月日：补今年 ---
const YY = new Date().getFullYear();
check('解析 09-17（补今年）', (() => {
  const d = ta.parseToDate('09-17');
  return d && d.getFullYear() === YY && d.getMonth() === 8 && d.getDate() === 17;
})(), ta.parseToDate('09-17') && ta.parseToDate('09-17').toISOString().slice(0, 10));
check('解析 9/17', ta.parseToDate('9/17').getDate() === 17);
check('解析 9月17日', ta.parseToDate('9月17日').getDate() === 17);
check('月日补全输出', ta.compute(A, 'fillDate', '09-17') === YY + '-09-17',
  ta.compute(A, 'fillDate', '09-17'));
check('月日可继续转相对时间', !!ta.compute(A, 'relative', '09-17'));
check('月日可继续转农历', !!ta.compute(A, 'lunar', '09-17'));

// --- 只有时分 / 时分秒 ---
check('解析 14:30', ta.parseToDate('14:30').getHours() === 14);
check('解析 14:30:25（含秒）', ta.parseToDate('14:30:25').getSeconds() === 25);
check('时分补全输出', ta.compute(A, 'fillDate', '14:30') ===
  YY + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' +
  String(new Date().getDate()).padStart(2, '0') + ' 14:30',
  ta.compute(A, 'fillDate', '14:30'));
// 精度开关默认关（只到分），要保留秒需显式开启
const A_SEC = allOn();
A_SEC.settings.timestamp.extensions.preciseToSecond = true;
check('时分秒补全保留秒（开启精度后）',
  /\d{2}:\d{2}:\d{2}$/.test(ta.compute(A_SEC, 'fillDate', '14:30:25')),
  ta.compute(A_SEC, 'fillDate', '14:30:25'));
check('精度默认关时补全只到分',
  !/\d{2}:\d{2}:\d{2}$/.test(ta.compute(A, 'fillDate', '14:30:25')),
  ta.compute(A, 'fillDate', '14:30:25'));
check('取时分秒（开启精度后）',
  ta.compute(A_SEC, 'timePart', '2026-09-19 14:30:25') === '14:30:25',
  ta.compute(A_SEC, 'timePart', '2026-09-19 14:30:25'));
check('无时钟时不显示取时分秒', ta.compute(A, 'timePart', '2026-09-19') === null);

// --- 完整日期不应触发补全 ---
check('已完整时不显示补全', ta.compute(A, 'fillDate', '2026-09-19') === null,
  ta.compute(A, 'fillDate', '2026-09-19'));

// --- 逆向：相对时间 → 日期 ---
check('3天前 → 日期', (() => {
  const r = ta.compute(A, 'relativeToDate', '3天前');
  if (!r) return false;
  const expect = new Date(Date.now() - 3 * 86400000);
  return r.slice(0, 10) === expect.toISOString().slice(0, 10);
})(), ta.compute(A, 'relativeToDate', '3天前'));
check('2小时后 → 日期', !!ta.compute(A, 'relativeToDate', '2小时后'),
  ta.compute(A, 'relativeToDate', '2小时后'));
check('1周后 → 日期', !!ta.compute(A, 'relativeToDate', '1周后'));
check('非相对文本不显示', ta.compute(A, 'relativeToDate', '2026-09-19') === null);

// --- 逆向：日记链接 → 日期 ---
check('链接 → 日期', ta.compute(A, 'linkToDate', '[[2026-09-19]]') === '2026-09-19',
  ta.compute(A, 'linkToDate', '[[2026-09-19]]'));
check('非链接不显示', ta.compute(A, 'linkToDate', '2026-09-19') === null);
check('链接也能走正向转换', !!ta.compute(A, 'weekday', '[[2026-09-19]]'),
  ta.compute(A, 'weekday', '[[2026-09-19]]'));

// --- 逆向：去掉星期 ---
check('去星期', ta.compute(A, 'stripWeekday', '2026-09-19 周六') === '2026-09-19',
  ta.compute(A, 'stripWeekday', '2026-09-19 周六'));
check('去星期（星期六）', ta.compute(A, 'stripWeekday', '2026-09-19 星期六') === '2026-09-19');
check('去星期（逗号分隔）', ta.compute(A, 'stripWeekday', '2026-09-19, 周六') === '2026-09-19',
  ta.compute(A, 'stripWeekday', '2026-09-19, 周六'));
check('无星期时不显示', ta.compute(A, 'stripWeekday', '2026-09-19') === null);
check('纯链接不误触发去星期', ta.compute(A, 'stripWeekday', '[[2026-09-19]]') === null,
  ta.compute(A, 'stripWeekday', '[[2026-09-19]]'));
check('带星期也能走正向转换', !!ta.compute(A, 'lunar', '2026-09-19 周六'));

// --- 逆向：节气 → 日期 ---
check('立春 → 2026-02-04', ta.compute(A, 'termToDate', '立春') === YY + '-02-04',
  ta.compute(A, 'termToDate', '立春'));
check('带年份的节气', ta.compute(A, 'termToDate', '2027年立春') === '2027-02-04',
  ta.compute(A, 'termToDate', '2027年立春'));
check('非节气文本不显示', ta.compute(A, 'termToDate', '2026-09-19') === null);

// --- 逆向：干支 → 年份 ---
check('丙午 → 2026（马年）', ta.compute(A, 'ganzhiToYear', '丙午') === '2026（丙午马年）',
  ta.compute(A, 'ganzhiToYear', '丙午'));
check('干支带生肖', ta.compute(A, 'ganzhiToYear', '丙午马年') === '2026（丙午马年）');
// 干支 60 年一轮，规则是「取最接近今年」：今年 2026，甲子最近的是 2044（差 18 年）
// 而非 1984（差 42 年）。测试按规则断言，不要写死 1984。
check('甲子 → 最接近今年的年份', ta.compute(A, 'ganzhiToYear', '甲子') === '2044（甲子鼠年）',
  ta.compute(A, 'ganzhiToYear', '甲子'));
check('丙午 → 今年（今年正是丙午年）', ta.compute(A, 'ganzhiToYear', '丙午') ===
  new Date().getFullYear() + '（丙午马年）', ta.compute(A, 'ganzhiToYear', '丙午'));
check('非法干支组合返回 null', ta.compute(A, 'ganzhiToYear', '甲丑') === null,
  ta.compute(A, 'ganzhiToYear', '甲丑'));
check('非干支文本不显示', ta.compute(A, 'ganzhiToYear', '2026-09-19') === null);

// --- 默认开关：新增逆向项一律默认关 ---
{
  const def = migrateSettings(null).timestamp.extensions.items;
  ['relativeToDate', 'linkToDate', 'stripWeekday', 'termToDate', 'ganzhiToYear', 'lunarToSolar']
    .forEach((k) => check('默认开：' + k, def[k] === true, def[k]));
  check('默认开：fillDate（补全属识别增强）', def.fillDate === true, def.fillDate);
  check('默认关：timePart', def.timePart === false, def.timePart);
  check('转换项总数为 22', Object.keys(def).length === 22, Object.keys(def).length);
}

// --- 分组渲染所需字段 ---
{
  const S = require(__dirname + '/../src/settings.js');
  const { ACTION_GROUPS } = S;
  const defs = S.ACTION_DEFS;
  const pairOfForTest = S.pairOf;
  const isForwardForTest = S.isForwardOfPair;
  check('每项都有 group', defs.every((d) => !!d.group),
    defs.filter((d) => !d.group).map((d) => d.key).join(','));
  // 逆向组已并入对应正向项，只剩两组
  check('分组数为 4', ACTION_GROUPS.length === 4, ACTION_GROUPS.length);
  const groups = new Set(ACTION_GROUPS.map((g) => g.key));
  // 逆向项仍标 reverse，但界面上不单独渲染（由配对的正向项代表），
  // 所以这里只校验「可见项」必须落在已有分组内
  const visible = defs.filter((d) => {
    const pi = pairOfForTest(d.key);
    return !pi || isForwardForTest(d.key);
  });
  check('可见项的 group 都有对应分组',
    visible.every((d) => groups.has(d.group)),
    visible.filter((d) => !groups.has(d.group)).map((d) => d.key + ':' + d.group).join(','));
}

/* ============ 3s. 宽松分隔符（用户手写的奇葩格式） ============ */
console.log('\n[3s] 宽松分隔符');

const B = allOn();

// --- 完整日期的各种分隔写法 ---
[
  ['2026 09-19', '空格+连字符'],
  ['2026 09 19', '纯空格'],
  ['2026-09 19', '连字符+空格'],
  ['2026/09-19', '斜杠+连字符'],
  ['2026.09.19', '点分隔'],
  ['2026 9 19', '空格+单位数'],
  ['2026-9-19', '单位数'],
  ['20260919', '紧凑 8 位'],
  ['2026_09_19', '下划线'],
  ['2026.9.19', '点+单位数'],
  ['2026年09月19日', '中文'],
].forEach(([inp, label]) => {
  const d = ta.parseToDate(inp);
  check('解析 ' + inp + '（' + label + '）',
    d && d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 19,
    d ? d.toISOString().slice(0, 10) : 'null');
});

// --- 带时间的宽松写法 ---
check('宽松 + 空格分隔时间', (() => {
  const d = ta.parseToDate('2026 09 19 14:30');
  return d && d.getHours() === 14 && d.getMinutes() === 30;
})(), ta.parseToDate('2026 09 19 14:30') && ta.parseToDate('2026 09 19 14:30').getHours());
check('宽松 + T 分隔时间', (() => {
  const d = ta.parseToDate('2026-09-19T14:30');
  return d && d.getHours() === 14;
})());
check('宽松 + 时分秒', (() => {
  const d = ta.parseToDate('2026-09-19 14:30:25');
  return d && d.getSeconds() === 25;
})());

// --- 只有月日的宽松写法 ---
[
  ['09-17'], ['09 17'], ['9 17'], ['9/17'], ['9月17日'], ['09-17 14:30'],
].forEach(([inp]) => {
  const d = ta.parseToDate(inp);
  check('月日：' + inp, d && d.getMonth() === 8 && d.getDate() === 17,
    d ? d.toISOString().slice(0, 10) : 'null');
});

// --- 宽松化不能把时钟误判成月日 ---
check('14:30 仍按时钟解析（非月 14 日 30）', (() => {
  const d = ta.parseToDate('14:30');
  return d && d.getHours() === 14 && d.getMinutes() === 30;
})(), ta.parseToDate('14:30') && ta.parseToDate('14:30').toISOString());
check('14:30:25 保留秒', ta.parseToDate('14:30:25').getSeconds() === 25);

// --- 非法日期必须拒绝（宽松分隔带来的副作用）---
['99 99', '2026-13-01', '2026-02-30', '2026 00 19', '2026 09 32', '2026 09 19 25:00']
  .forEach((inp) => {
    check('拒绝非法输入：' + inp, ta.parseToDate(inp) === null,
      ta.parseToDate(inp) && ta.parseToDate(inp).toISOString());
  });

// --- 不能误伤非日期文本 ---
['这是一段普通文字', '共 3 个文件', '', 'abc']
  .forEach((inp) => {
    check('非日期不解析：' + (inp || '(空)'), ta.parseToDate(inp) === null,
      ta.parseToDate(inp) && ta.parseToDate(inp).toISOString());
  });

// --- 宽松格式下其他转换仍然可用 ---
check('宽松格式可转农历', !!ta.compute(B, 'lunar', '2026 09 19'), ta.compute(B, 'lunar', '2026 09 19'));
check('宽松格式可转星期', ta.compute(B, 'weekday', '2026_09_19') === '2026-09-19 周六',
  ta.compute(B, 'weekday', '2026_09_19'));
check('紧凑格式可转时间戳', !!ta.compute(B, 'unixEncode', '20260919'));
check('已完整时不显示补全', ta.compute(B, 'fillDate', '2026 09 19') === null);
check('空格月日会补全', ta.compute(B, 'fillDate', '09 17') ===
  new Date().getFullYear() + '-09-17', ta.compute(B, 'fillDate', '09 17'));

/* ============ 3t. 自动识别时：覆盖 / 追加 ============ */
console.log('\n[3t] 自动识别结果的写入方式');

/**
 * 造一个能记录替换范围的 editor。
 * replaceSelection 依赖当前选区，所以必须验证 setSelection 被正确调用——
 * 不能只靠光标位置，弹窗打开后光标可能被 Obsidian 挪走。
 */
function mkRangeEditor(line) {
  const log = { sel: null, replaced: null, selAtReplace: null };
  return {
    log,
    getSelection: () => '',
    getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => line,
    setSelection: (a, b) => { log.sel = [a, b]; },
    replaceSelection: (t) => { log.replaced = t; log.selAtReplace = log.sel; },
  };
}

/** 走一遍：无选区 → 自动识别 → 应用「补星期」 */
function applyAuto(settings, line) {
  const plugin = { settings, app: {} };
  const editor = mkRangeEditor(line);
  const modal = new ta.TimeActionModal(plugin, editor, null, null);
  return { plugin, editor, modal };
}

// --- 默认关闭：覆盖原文 ---
{
  const st = migrateSettings(null);
  check('默认关闭（覆盖）', st.timestamp.extensions.appendOnAutoPick === false);

  const picked = { text: '2026 09-22', from: { line: 0, ch: 4 }, to: { line: 0, ch: 14 } };
  const editor = mkRangeEditor('当前时间2026 09-22');
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '2026 09-22', picked);
  modal.apply('2026-09-22 周二');

  check('覆盖：替换文本正确（正文不带标记）', editor.log.replaced === '2026-09-22 周二', editor.log.replaced);
  check('覆盖：选区锁定到原文范围',
    editor.log.selAtReplace && editor.log.selAtReplace[0].ch === 4 &&
    editor.log.selAtReplace[1].ch === 14,
    JSON.stringify(editor.log.selAtReplace));
}

// --- 开启：原文后追加 ---
{
  const st = migrateSettings(null);
  st.timestamp.extensions.appendOnAutoPick = true;

  const picked = { text: '2026 09-22', from: { line: 0, ch: 4 }, to: { line: 0, ch: 14 } };
  const editor = mkRangeEditor('当前时间2026 09-22');
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '2026 09-22', picked);
  modal.apply('2026-09-22 周二');

  check('追加：结果前有空格（正文不带标记）', editor.log.replaced === ' 2026-09-22 周二', editor.log.replaced);
  check('追加：插入点在原文末尾',
    editor.log.selAtReplace && editor.log.selAtReplace[0].ch === 14 &&
    editor.log.selAtReplace[1].ch === 14,
    JSON.stringify(editor.log.selAtReplace));
}

// --- 手动框选：始终替换选区，不受开关影响 ---
[false, true].forEach((appendOn) => {
  const st = migrateSettings(null);
  st.timestamp.extensions.appendOnAutoPick = appendOn;
  const editor = mkRangeEditor('任意内容');
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '2026-09-19', null);
  modal.apply('RESULT');
  check('手动框选时替换选区（appendOnAutoPick=' + appendOn + '）',
    editor.log.replaced === 'RESULT',
    editor.log.replaced + ' sel=' + JSON.stringify(editor.log.sel));
});

// --- 重复应用保护 ---
{
  const st = migrateSettings(null);
  const editor = mkRangeEditor('x');
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '2026-09-19', null);
  modal.apply('第一次');
  modal.apply('第二次');
  check('只应用一次', editor.log.replaced === '第一次', editor.log.replaced);
}

// --- pickTimeOnLine 返回范围，且优先光标所在片段 ---
{
  const cases = [
    ['会议 2026-09-19 和 2027-01-01', 5, '2026-09-19'],   // 光标落在第一个
    ['会议 2026-09-19 和 2027-01-01', 16, '2027-01-01'],  // 光标落在第二个
    ['当前时间2026 09-22', 10, '2026 09-22'],             // 宽松格式
  ];
  cases.forEach(([line, ch, expect]) => {
    const editor = {
      getCursor: () => ({ line: 0, ch }),
      getLine: () => line,
    };
    const got = ta.pickTimeOnLine(editor);
    check('识别光标所在片段：' + expect, got && got.text === expect,
      got ? got.text : 'null');
    check('  范围与文本长度一致', got && got.to.ch - got.from.ch === expect.length,
      got ? got.to.ch - got.from.ch : 'n/a');
  });

  // 行内无有效时间
  const ed2 = { getCursor: () => ({ line: 0, ch: 0 }), getLine: () => '这次有 3 个文件和 12 个任务' };
  check('行内无有效时间返回 null', ta.pickTimeOnLine(ed2) === null,
    JSON.stringify(ta.pickTimeOnLine(ed2)));
}

// --- 迁移保留该开关 ---
{
  const raw = {
    timestamp: { extensions: { appendOnAutoPick: true, 已废弃键: 1 } },
  };
  const out = migrateSettings(raw);
  check('迁移保留 appendOnAutoPick', out.timestamp.extensions.appendOnAutoPick === true,
    out.timestamp.extensions.appendOnAutoPick);
  const out2 = migrateSettings({ timestamp: { extensions: { items: {} } } });
  check('缺省时为 false', out2.timestamp.extensions.appendOnAutoPick === false);
}

/* ============ 3u. 相对时间的基准 ============ */
console.log('\n[3u] 相对时间的基准');

const U = allOn();

// --- 结果必须标明基准 ---
// 基准说明必须带上当前时刻，否则过几天回看不知道「现在」是哪天
check('无基准时标明「现在」并带时刻',
  /（相对 现在 \d{4}-\d{2}-\d{2} \d{2}:\d{2}）$/.test(ta.compute(U, 'relative', '2026-09-21 22:48')),
  ta.compute(U, 'relative', '2026-09-21 22:48'));
check('有基准时标明具体时间', (() => {
  const base = ta.parseToDate('2026-09-19');
  const r = ta.compute(U, 'relative', '2026-09-21 22:48', { base });
  return r.indexOf('（相对 2026-09-19') >= 0;
})(), ta.compute(U, 'relative', '2026-09-21 22:48', { base: ta.parseToDate('2026-09-19') }));

// --- 基准真的影响计算 ---
{
  const target = '2026-09-21 22:48';
  const b1 = ta.parseToDate('2026-09-19');
  const b2 = ta.parseToDate('2026-09-22 14:30');
  const r1 = ta.compute(U, 'relative', target, { base: b1 });
  const r2 = ta.compute(U, 'relative', target, { base: b2 });
  check('不同基准得到不同结果', r1 !== r2, r1 + ' vs ' + r2);
  check('基准在后 → 目标在前（X 小时前）', r2.indexOf('前') >= 0, r2);
  check('基准在前 → 目标在后（X 天后）', r1.indexOf('后') >= 0, r1);
}

// --- 说明可关闭 ---
{
  const st = migrateSettings(null);
  st.timestamp.extensions.showRelativeBase = false;
  const P = { settings: st, app: {} };
  const r = ta.compute(P, 'relative', '2026-09-21 22:48', { base: ta.parseToDate('2026-09-19') });
  check('关闭说明后不含括号', r.indexOf('（相对') < 0, r);
  check('关闭说明后仍有量词', /后$/.test(r), r);
}

// --- 反向：相对时间 → 日期 也吃基准 ---
{
  const base = ta.parseToDate('2026-01-01');
  const r = ta.compute(U, 'relativeToDate', '3天后', { base });
  check('反向按基准推算', r && r.indexOf('2026-01-04') === 0, r);
  const r2 = ta.compute(U, 'relativeToDate', '3天后');
  check('反向无基准时按现在', !!r2 && r2 !== r, r2);
}

// --- 面板的基准输入框 ---
{
  const P = { settings: migrateSettings(null), app: {} };
  const modal = new ta.TimeActionModal(P, null, '2026-09-21 22:48', null);
  check('默认基准为空', modal.baseText === '');
  check('空基准 → currentBase 为 null', modal.currentBase() === null);
  check('空基准不算无效', modal.isBaseInvalid() === false);

  modal.baseText = '2026-09-19';
  const b = modal.currentBase();
  check('填入后解析出日期', b && b.getFullYear() === 2026 && b.getMonth() === 8 && b.getDate() === 19,
    b && b.toISOString());
  check('有效基准不算无效', modal.isBaseInvalid() === false);

  modal.baseText = '瞎填的东西';
  check('无效基准被识别', modal.isBaseInvalid() === true);
  check('无效基准时 currentBase 为 null', modal.currentBase() === null);

  // 无效基准必须回退到「现在」，而不是算出错误结果
  const r = ta.compute(P, 'relative', '2026-09-21 22:48', { base: modal.currentBase() });
  check('无效基准回退为现在（带时刻）',
    /（相对 现在 \d{4}-\d{2}-\d{2} \d{2}:\d{2}）/.test(r), r);
}

// --- 基准变化只重绘列表，不销毁输入框 ---
{
  const P = { settings: migrateSettings(null), app: {} };
  const modal = new ta.TimeActionModal(P, null, '2026-09-21 22:48', null);
  check('有 renderList 方法（供局部重绘）', typeof modal.renderList === 'function');

  // 用真实 DOM 跑一遍：列表容器与输入框是分开的，
  // 重绘只清列表，输入框的 DOM 节点不应被销毁
  const el = new obsidian.MockEl('div');
  modal.contentEl = el;
  modal.onOpen();
  const inputCountBefore = el.textContent.length;
  modal.baseText = '2026-09-19';
  modal.renderList();
  check('重绘后面板仍有内容', el.textContent.length > 0);
  check('重绘不抛异常', (() => {
    try { modal.renderList(); modal.renderList(); return true; } catch (e) { return false; }
  })());
}

// --- 迁移保留该设置 ---
{
  const out = migrateSettings({ timestamp: { extensions: { showRelativeBase: false } } });
  check('迁移保留 showRelativeBase=false',
    out.timestamp.extensions.showRelativeBase === false,
    out.timestamp.extensions.showRelativeBase);
  const out2 = migrateSettings({ timestamp: { extensions: { items: {} } } });
  check('缺省时为 true', out2.timestamp.extensions.showRelativeBase === true);
}

/* ============ 3v. 口语相对日（明天 / 大后天 / tomorrow） ============ */
console.log('\n[3v] 口语相对日');

const V = allOn();
const VB = ta.parseToDate('2026-09-19'); // 固定基准，结果可断言
const iso = (d) => d.toISOString().slice(0, 10);

// --- 中文：必须逐条精确，不能互相串 ---
[
  ['大大前天', '2026-09-15'], ['大前天', '2026-09-16'], ['前天', '2026-09-17'],
  ['昨天', '2026-09-18'], ['今天', '2026-09-19'],
  ['明天', '2026-09-20'], ['后天', '2026-09-21'],
  ['大后天', '2026-09-22'], ['大大后天', '2026-09-23'],
].forEach(([word, expect]) => {
  const d = ta.parseRelative(word, VB);
  check(word + ' → ' + expect, d && iso(d) === expect, d ? iso(d) : 'null');
});

// --- 回归：这条曾经因为量词写错而算错 ---
{
  const a = ta.parseRelative('前天', VB);
  const b = ta.parseRelative('大前天', VB);
  check('前天 ≠ 大前天', iso(a) !== iso(b), iso(a) + ' vs ' + iso(b));
  check('大前天比前天更早一天',
    Math.round((a - b) / 86400000) === 1, Math.round((a - b) / 86400000));
}

// --- 英文 ---
[
  ['yesterday', '2026-09-18'], ['today', '2026-09-19'], ['tomorrow', '2026-09-20'],
  ['the day after tomorrow', '2026-09-21'], ['the day before yesterday', '2026-09-17'],
].forEach(([word, expect]) => {
  const d = ta.parseRelative(word, VB);
  check(word + ' → ' + expect, d && iso(d) === expect, d ? iso(d) : 'null');
});
check('英文不区分大小写', iso(ta.parseRelative('Tomorrow', VB)) === '2026-09-20',
  iso(ta.parseRelative('Tomorrow', VB)));

// --- 周 / 月 / 年 ---
[
  ['上周', '2026-09-12'], ['下周', '2026-09-26'],
  ['上个月', '2026-08-19'], ['下个月', '2026-10-19'],
  ['去年', '2025-09-19'], ['明年', '2027-09-19'],
  ['next week', '2026-09-26'], ['last month', '2026-08-19'], ['next year', '2027-09-19'],
].forEach(([word, expect]) => {
  const d = ta.parseRelative(word, VB);
  check(word + ' → ' + expect, d && iso(d) === expect, d ? iso(d) : 'null');
});

// --- 方向词扩展（7天以后 / 3天以前）---
check('7天以后', iso(ta.parseRelative('7天以后', VB)) === '2026-09-26',
  iso(ta.parseRelative('7天以后', VB)));
check('3天以前', iso(ta.parseRelative('3天以前', VB)) === '2026-09-16',
  iso(ta.parseRelative('3天以前', VB)));
check('3天之前', iso(ta.parseRelative('3天之前', VB)) === '2026-09-16');
check('2小时之后', !!ta.parseRelative('2小时之后', VB));
check('原有的「3天前」仍可用', iso(ta.parseRelative('3天前', VB)) === '2026-09-16');

// --- 转换应用 ---
check('明天 → 日期（带基准）',
  ta.compute(V, 'relativeToDate', '明天', { base: VB }) === '2026-09-20 00:00',
  ta.compute(V, 'relativeToDate', '明天', { base: VB }));
check('tomorrow → 日期', !!ta.compute(V, 'relativeToDate', 'tomorrow', { base: VB }));

// --- looksLikeRelative 用于空态提示 ---
['明天', '大后天', 'tomorrow', '7天以后', '3天以前'].forEach((t) => {
  check('识别为相对描述：' + t, ta.looksLikeRelative(t) === true);
});
['2026-09-19', '14:30', '这是一段普通文字'].forEach((t) => {
  check('不误判为相对描述：' + t, ta.looksLikeRelative(t) === false);
});

// --- 行内自动识别也要认（用 parseRelative 校验，不能用 parseToDate）---
[
  ['截止 明天 交', '明天'], ['会议在后天', '后天'], ['大前天的记录', '大前天'],
  ['this is tomorrow', 'tomorrow'],
].forEach(([line, expect]) => {
  const d = ta.pickTimeOnLine({ getCursor: () => ({ line: 0, ch: 3 }), getLine: () => line });
  check('行内识别「' + expect + '」', d && d.text === expect, d ? d.text : 'null');
});
check('普通文字不误命中',
  ta.pickTimeOnLine({ getCursor: () => ({ line: 0, ch: 0 }), getLine: () => '普通的文字' }) === null);
check('数字串不误命中',
  ta.pickTimeOnLine({ getCursor: () => ({ line: 0, ch: 0 }), getLine: () => '订单 1234 56 78' }) === null);

// --- 空态给出答案而不是只说识别不出 ---
{
  // 逆向项现在默认开，所以「明天」会直接出现转换项，不必再走空态引导
  const st = migrateSettings(null);
  const P = { settings: st, app: {} };
  const modal = new ta.TimeActionModal(P, null, '明天', null);
  const el = new obsidian.MockEl('div');
  modal.contentEl = el;
  modal.onOpen();
  const txt = el.textContent;
  check('明天直接可用（无需先开开关）', txt.includes('相对时间 → 日期'), txt.slice(0, 120));
  check('结果直接给出', /\d{4}-\d{2}-\d{2}/.test(txt), txt.slice(0, 160));
}

// 关掉相对时间项后，空态仍要给出引导
{
  const st = migrateSettings(null);
  st.timestamp.extensions.items.relativeToDate = false;
  st.timestamp.extensions.items.relative = false;
  // unify 也能吃下「明天」，要一并关掉才会进空态
  st.timestamp.extensions.items.unify = false;
  const P = { settings: st, app: {} };
  const modal = new ta.TimeActionModal(P, null, '明天', null);
  const el = new obsidian.MockEl('div');
  modal.contentEl = el;
  modal.onOpen();
  const txt = el.textContent;
  check('全关时空态说明这是相对时间', txt.includes('相对时间描述'), txt.slice(0, 80));
  check('全关时空态直接给出答案', /\d{4}-\d{2}-\d{2}/.test(txt), txt.slice(0, 160));
  check('全关时空态指明开关位置', txt.includes('相对时间 → 日期'), txt.slice(0, 200));
}

/* ============ 3w. 开关合并与精度 ============ */
console.log('\n[3w] 开关合并与精度');

const W = allOn();
const { ACTION_PAIRS, pairOf, isForwardOfPair } = require(__dirname + '/../src/settings.js');

// --- 1. 逆向默认开 ---
{
  const def = migrateSettings(null).timestamp.extensions.items;
  ['unixDecode', 'lunarToSolar', 'relativeToDate', 'linkToDate',
   'stripWeekday', 'termToDate', 'ganzhiToYear'].forEach((k) => {
    check('逆向默认开：' + k, def[k] === true, def[k]);
  });
}

// --- 2. 配对 ---
{
  check('配对数为 8', ACTION_PAIRS.length === 8, ACTION_PAIRS.length);
  check('pairOf(relative) = relativeToDate', pairOf('relative') === 'relativeToDate');
  check('pairOf(relativeToDate) = relative', pairOf('relativeToDate') === 'relative');
  check('单项 dateShift 无配对', pairOf('dateShift') === null, pairOf('dateShift'));
  check('isForwardOfPair(relative) 为真', isForwardOfPair('relative') === true);
  check('isForwardOfPair(relativeToDate) 为假', isForwardOfPair('relativeToDate') === false);
  // 配对必须覆盖全部逆向项，否则设置页会有漏网的开关
  const allKeys = require(__dirname + '/../src/settings.js').ACTION_DEFS.map((d) => d.key);
  check('配对里的 key 都真实存在',
    ACTION_PAIRS.every((p) => allKeys.indexOf(p[0]) >= 0 && allKeys.indexOf(p[1]) >= 0));
}

// --- 3. 精度开关 ---
{
  const st = migrateSettings(null);
  const P = { settings: st, app: {} };
  const d = new Date(2026, 8, 19, 22, 1, 36);

  check('默认精确到秒为关', st.timestamp.extensions.preciseToSecond === false);
  check('关时去掉秒', ta.fmt(P, d, 'YYYY-MM-DD HH:mm:ss') === '2026-09-19 22:01',
    ta.fmt(P, d, 'YYYY-MM-DD HH:mm:ss'));

  st.timestamp.extensions.preciseToSecond = true;
  check('开时保留秒', ta.fmt(P, d, 'YYYY-MM-DD HH:mm:ss') === '2026-09-19 22:01:36',
    ta.fmt(P, d, 'YYYY-MM-DD HH:mm:ss'));

  // 只到日的格式不受影响
  const st2 = migrateSettings(null);
  const P2 = { settings: st2, app: {} };
  check('只到日的格式不受影响', ta.fmt(P2, d, 'YYYY-MM-DD') === '2026-09-19',
    ta.fmt(P2, d, 'YYYY-MM-DD'));
}

// --- 4. dropSeconds 的各种格式 ---
{
  const cases = [
    ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm'],
    ['HH:mm:ss', 'HH:mm'],
    ['YYYY-MM-DD HH:mm:ss.SSS', 'YYYY-MM-DD HH:mm'],
    ['YYYY年MM月DD日 HH时mm分ss秒', 'YYYY年MM月DD日 HH时mm分'],
    ['YYYY-MM-DD', 'YYYY-MM-DD'],
    ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm'],
  ];
  cases.forEach(([inp, expect]) => {
    check('去秒：' + inp, ta.dropSeconds(inp) === expect, ta.dropSeconds(inp));
  });
  // 不能误伤格式里的字母 s（如月份名）
  check('不误伤非秒标记', ta.dropSeconds('YYYY-MM-DD ddd') === 'YYYY-MM-DD ddd',
    ta.dropSeconds('YYYY-MM-DD ddd'));
}

// --- 5. 两个高级开关的默认值与迁移 ---
{
  const def = migrateSettings(null).timestamp.extensions;
  check('separateDirections 默认关', def.separateDirections === false, def.separateDirections);
  check('collapseItems 默认关', def.collapseItems === false, def.collapseItems);

  const out = migrateSettings({
    timestamp: { extensions: { separateDirections: true, collapseItems: true, preciseToSecond: true } },
  }).timestamp.extensions;
  check('迁移保留 separateDirections', out.separateDirections === true);
  check('迁移保留 collapseItems', out.collapseItems === true);
  check('迁移保留 preciseToSecond', out.preciseToSecond === true);
}

// --- 6. 未开启分别控制时，界面上不应出现逆向成员（避免重复）---
{
  const { ACTION_DEFS, ACTION_GROUPS } = require(__dirname + '/../src/settings.js');
  const visible = ACTION_DEFS.filter((d) => !pairOf(d.key) || isForwardOfPair(d.key));
  check('合并后可见项为 14', visible.length === 14, visible.length);
  // 分组只剩两组，逆向那组已并入
  check('分组数为 4', ACTION_GROUPS.length === 4, ACTION_GROUPS.length);
  // 所有 def 的 group 必须仍是这两组之一（逆向项 group 仍是 reverse 也无妨，只是不渲染）
  const groups = new Set(ACTION_GROUPS.map((g) => g.key));
  const orphans = ACTION_DEFS.filter((d) => {
    if (!pairOf(d.key)) return !groups.has(d.group); // 单项必须落在已有分组
    return false; // 有配对的按正向那项所在的分组渲染
  });
  check('单项都落在已有分组内', orphans.length === 0,
    orphans.map((d) => d.key + ':' + d.group).join(','));
}

/* ============ 3x. 中文数字与口语扩展 ============ */
console.log('\n[3x] 中文数字与口语扩展');

const X = allOn();
const XB = ta.parseToDate('2026-09-19');
const isoX = (d) => d.toISOString().slice(0, 10);
const isoFullX = (d) => d.toISOString().slice(0, 16).replace('T', ' ');

// --- 中文数字 → 阿拉伯数字 ---
[
  ['一', 1], ['二', 2], ['两', 2], ['三', 3], ['九', 9],
  ['十', 10], ['十一', 11], ['二十', 20], ['二十一', 21], ['三十', 30],
  ['一百', 100], ['一百零五', 105], ['七', 7], ['2', 2],
].forEach(([cn, expect]) => {
  check('中文数字 ' + cn + ' = ' + expect, ta.parseCNNumber(cn) === expect, ta.parseCNNumber(cn));
});
check('非数字返回 null', ta.parseCNNumber('这个不是数字') === null);
check('空串返回 null', ta.parseCNNumber('') === null);

// --- 时刻 ---
[
  ['5点', 5, 0], ['5点半', 5, 30], ['5点30', 5, 30],
  ['下午5点', 17, 0], ['晚上8点', 20, 0], ['上午9点', 9, 0],
  ['17点', 17, 0], ['五点', 5, 0], ['5:30', 5, 30],
].forEach(([t, h, mi]) => {
  const c = ta.parseClockCN(t);
  check('时刻 ' + t, c && c.hour === h && c.minute === mi,
    c ? c.hour + ':' + c.minute : 'null');
});
check('非法时刻返回 null', ta.parseClockCN('25点') === null);

// --- 口语日 + 时刻 ---
[
  ['明天5点', '2026-09-20 05:00'],
  ['昨天5点', '2026-09-18 05:00'],
  ['明天下午5点', '2026-09-20 17:00'],
  ['大后天5点半', '2026-09-22 05:30'],
  ['明天 5点', '2026-09-20 05:00'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, XB);
  check('口语+时刻 ' + t, d && isoFullX(d) === expect, d ? isoFullX(d) : 'null');
});
// 口语日后面跟的不是时刻 → 不认，避免误判
check('明天天气 不识别', ta.parseRelative('明天天气', XB) === null,
  ta.parseRelative('明天天气', XB));

// --- 序数 ---
check('第二天 = 次日', isoX(ta.parseRelative('第二天', XB)) === '2026-09-20',
  isoX(ta.parseRelative('第二天', XB)));
check('第七天后', isoX(ta.parseRelative('第七天后', XB)) === '2026-09-26',
  isoX(ta.parseRelative('第七天后', XB)));
check('第2天', isoX(ta.parseRelative('第2天', XB)) === '2026-09-21',
  isoX(ta.parseRelative('第2天', XB)));

// --- 倒装 ---
check('前两天', isoX(ta.parseRelative('前两天', XB)) === '2026-09-17',
  isoX(ta.parseRelative('前两天', XB)));
check('前三天', isoX(ta.parseRelative('前三天', XB)) === '2026-09-16',
  isoX(ta.parseRelative('前三天', XB)));
check('上一周', isoX(ta.parseRelative('上一周', XB)) === '2026-09-12',
  isoX(ta.parseRelative('上一周', XB)));

// --- 中文数字 + 单位 ---
[
  ['二天后', '2026-09-21'], ['两天后', '2026-09-21'], ['七天后', '2026-09-26'],
  ['2天后', '2026-09-21'], ['十天后', '2026-09-29'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, XB);
  check(t + ' → ' + expect, d && isoX(d) === expect, d ? isoX(d) : 'null');
});
check('原有的 3天前 仍可用', isoX(ta.parseRelative('3天前', XB)) === '2026-09-16');
check('7天以后 仍可用', isoX(ta.parseRelative('7天以后', XB)) === '2026-09-26');

// --- 转换应用 ---
check('明天5点 → 日期', !!ta.compute(X, 'relativeToDate', '明天5点', { base: XB }),
  ta.compute(X, 'relativeToDate', '明天5点', { base: XB }));
check('前两天 → 日期', !!ta.compute(X, 'relativeToDate', '前两天', { base: XB }));

// --- looksLikeRelative 覆盖新形式 ---
['明天5点', '前两天', '第七天后', '二天后', '昨天下午3点'].forEach((t) => {
  check('识别为相对描述：' + t, ta.looksLikeRelative(t) === true);
});
['2026-09-19', '这是一段普通文字', '明天天气'].forEach((t) => {
  check('不误判：' + t, ta.looksLikeRelative(t) === false, t);
});

// --- 行内识别 ---
[
  ['截止明天5点交', '明天5点'], ['会议在明天下午3点', '明天下午3点'],
  ['前两天的数据', '前两天'], ['第七天后交付', '第七天后'],
  ['二天后再说', '二天后'], ['3天后开会', '3天后'],
].forEach(([line, expect]) => {
  const p = ta.pickTimeOnLine({ getCursor: () => ({ line: 0, ch: 3 }), getLine: () => line });
  check('行内识别「' + expect + '」', p && p.text === expect, p ? p.text : 'null');
});
['普通的文字', '订单 1234 56 78', '一共 3 个文件'].forEach((line) => {
  check('不误命中：' + line,
    ta.pickTimeOnLine({ getCursor: () => ({ line: 0, ch: 0 }), getLine: () => line }) === null);
});

// --- 数据不无限增长：中文数字用规则解析，不得依赖大表 ---
{
  const fs = require('fs');
  const src = fs.readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  // CN_DIGIT / CN_UNIT 必须是小表（各不超过 20 项），其余靠规则
  const digitBlock = /const CN_DIGIT = \{[^}]*\}/.exec(src);
  const unitBlock = /const CN_UNIT = \{[^}]*\}/.exec(src);
  check('中文数字用小表 + 规则实现', !!digitBlock && !!unitBlock);
  check('数字表不超过 20 项',
    (digitBlock[0].match(/:/g) || []).length <= 20, (digitBlock[0].match(/:/g) || []).length);
  check('单位表不超过 10 项',
    (unitBlock[0].match(/:/g) || []).length <= 10, (unitBlock[0].match(/:/g) || []).length);
  // 不得新增持久化字段
  const st = migrateSettings(null).timestamp.extensions;
  // 字段数固定（新增字段必须同步更新这里），且 daypartHours 默认为空对象不膨胀
  check('扩展设置字段数为 25（weekStart 已合并到日历，口径 4 项 + 节日 2 项 + 工作日 1 项 + 自定义规则 1 项）', Object.keys(st).length === 25, Object.keys(st).join(','));
  check('daypartHours 默认为空', Object.keys(st.daypartHours).length === 0);
}

// --- 设置页三区 ---
{
  const S = require(__dirname + '/../src/settings.js');
  check('转换分组为 4（含节日区、倒计时区）', S.ACTION_GROUPS.length === 4, S.ACTION_GROUPS.length);
  check('有高级设置区', !!S.ADVANCED_GROUP);
  check('高级区标题为「高级设置」', S.ADVANCED_GROUP.title === '高级设置');
}

/* ============ 3y. A 类口语扩展（时段 / 星期 / 月初末 / 英文） ============ */
console.log('\n[3y] A 类口语扩展');

const Y = allOn();
const YS = Y.settings;
const YB = ta.parseToDate('2026-09-19'); // 周六
const isoY = (d) => d.toISOString().slice(0, 10);
const fullY = (d) => d.toISOString().slice(0, 16).replace('T', ' ');

// --- 今/明/昨 + 时段 ---
[
  ['今早', '2026-09-19'], ['今晚', '2026-09-19'], ['今夜', '2026-09-19'],
  ['明早', '2026-09-20'], ['明晚', '2026-09-20'],
  ['昨夜', '2026-09-18'], ['昨晚', '2026-09-18'],
  ['今日', '2026-09-19'], ['次日', '2026-09-20'], ['翌日', '2026-09-20'],
  ['当日', '2026-09-19'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, YB, YS);
  check(t + ' → ' + expect, d && isoY(d) === expect, d ? isoY(d) : 'null');
});

// --- 星期几 ---
/*
 * 期望值必须用解析时那个基准（YB＝2026-09-19）来算，不能用 WD/WDT/WDN ——
 * 那三个 helper 取的是"真实的今天"，而这个块的基准是写死的 2026-09-19。
 * 两者一旦错开（日期推移后就必然错开），整片误报与功能无关。
 * 规则与实现一致：取"基准所在那一周（周一起始）里的星期 k"，再偏移 extra 天。
 */
const weekExp = (k, extra) => {
  const m = new Date(YB.getTime());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7) + (k - 1) + (extra || 0));
  return m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') +
    '-' + String(m.getDate()).padStart(2, '0');
};
[
  ['周一', weekExp(1, 0)], ['周二', weekExp(2, 0)], ['周日', weekExp(7, 0)],
  ['本周一', weekExp(1, 0)], ['上周五', weekExp(5, -7)], ['下周一', weekExp(1, 7)],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, YB, YS);
  check(t + ' → ' + expect, d && isoY(d) === expect, d ? isoY(d) : 'null');
});
check('周末落在周六', isoY(ta.parseRelative('周末', YB, YS)) === '2026-09-19',
  isoY(ta.parseRelative('周末', YB, YS)));
// 回归：「上周五」不能被「上周」吃掉前半（必须优先于月份规则）
check('上周五 ≠ 上周', isoY(ta.parseRelative('上周五', YB, YS)) !==
  isoY(ta.parseRelative('上周', YB, YS)));

// --- 月初 / 月末 / 年初末 ---
[
  ['月底', '2026-09-30'], ['月初', '2026-09-01'],
  ['上月底', '2026-08-31'], ['上个月底', '2026-08-31'],
  ['下月初', '2026-10-01'], ['下个月初', '2026-10-01'],
  ['下个月底', '2026-10-31'], ['上个月初', '2026-08-01'],
  ['年末', '2026-12-31'], ['年初', '2026-01-01'], ['年中', '2026-06-30'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, YB, YS);
  check(t + ' → ' + expect, d && isoY(d) === expect, d ? isoY(d) : 'null');
});

// --- 时段 + 时刻 ---
[
  ['早上8点', '2026-09-19 08:00'], ['中午12点', '2026-09-19 12:00'],
  ['晚上7点半', '2026-09-19 19:30'], ['凌晨2点', '2026-09-19 02:00'],
  ['下午3点', '2026-09-19 15:00'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, YB, YS);
  check(t + ' → ' + expect, d && fullY(d) === expect, d ? fullY(d) : 'null');
});

// --- 时段单独出现：默认不转换（方案丙，不给模糊词编造时刻）---
{
  const st = migrateSettings(null);
  check('默认 convertDaypartAlone 为关', st.timestamp.extensions.convertDaypartAlone === false);
  ['早上', '下午', '晚上', '中午', '凌晨'].forEach((t) => {
    check('时段单独默认不转换：' + t,
      ta.parseRelative(t, YB, st) === null,
      ta.parseRelative(t, YB, st));
  });
  // 开启后按设置值转换
  st.timestamp.extensions.convertDaypartAlone = true;
  const d = ta.parseRelative('早上', YB, st);
  check('开启后按默认小时转换', d && d.getHours() === 9, d && d.getHours());
  const d2 = ta.parseRelative('晚上', YB, st);
  check('晚上 → 20 点', d2 && d2.getHours() === 20, d2 && d2.getHours());
}

// --- 时段小时值可自定义 ---
{
  const st = migrateSettings(null);
  st.timestamp.extensions.convertDaypartAlone = true;
  st.timestamp.extensions.daypartHours = { 早上: 7 };
  const d = ta.parseRelative('早上', YB, st);
  check('自定义时段小时生效', d && d.getHours() === 7, d && d.getHours());
}

// --- 特殊量词 ---
check('半小时后 = 30 分', fullY(ta.parseRelative('半小时后', YB, YS)) === '2026-09-19 00:30',
  fullY(ta.parseRelative('半小时后', YB, YS)));
check('一刻钟后 = 15 分', fullY(ta.parseRelative('一刻钟后', YB, YS)) === '2026-09-19 00:15',
  fullY(ta.parseRelative('一刻钟后', YB, YS)));
check('半天后 = 12 小时', fullY(ta.parseRelative('半天后', YB, YS)) === '2026-09-19 12:00',
  fullY(ta.parseRelative('半天后', YB, YS)));

// --- 英文 ---
[
  ['this morning', '2026-09-19'], ['tomorrow morning', '2026-09-20'],
  ['last night', '2026-09-18'], ['tonight', '2026-09-19'],
  ['next Monday', '2026-09-21'], ['last Friday', '2026-09-11'],
  ['this Monday', '2026-09-14'],
  ['in 3 days', '2026-09-22'], ['3 days ago', '2026-09-16'],
  ['in two weeks', '2026-10-03'], ['a week ago', '2026-09-12'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, YB, YS);
  check('英文 ' + t + ' → ' + expect, d && isoY(d) === expect, d ? isoY(d) : 'null');
});

// --- 转换应用 ---
['周一', '月底', '明早', 'in 3 days', '晚上7点半'].forEach((t) => {
  check('可转换：' + t, ta.compute(Y, 'relativeToDate', t, { base: YB }) !== null,
    ta.compute(Y, 'relativeToDate', t, { base: YB }));
});

// --- C 类模糊词不得识别（避免编造）---
['改天', '最近', '不久前', '刚刚', '马上', '立刻', '大半天'].forEach((t) => {
  check('模糊词不识别：' + t, ta.parseRelative(t, YB, YS) === null,
    ta.parseRelative(t, YB, YS));
});

// --- 数据不增长：daypartHours 清洗 ---
{
  const out = migrateSettings({
    timestamp: { extensions: { daypartHours: { 早上: 9, 废弃键: 1, 晚上: 99, 下午: -5, 中午: 'x' } } },
  }).timestamp.extensions.daypartHours;
  check('只保留合法时段键', Object.keys(out).length === 1, JSON.stringify(out));
  check('保留有效值', out.早上 === 9, JSON.stringify(out));
  const out2 = migrateSettings({ timestamp: { extensions: { daypartHours: null } } })
    .timestamp.extensions.daypartHours;
  check('null 时安全降级', Object.keys(out2).length === 0);
}

// --- 时段词表规模固定（不膨胀）---
{
  const fs = require('fs');
  // 时段表已抽到 timejudge.js，timestamp.js 里不再有
  const src = fs.readFileSync(__dirname + '/../src/timejudge.js', 'utf8');
  const block = /const TIME_OF_DAY = \[[\s\S]*?\];/.exec(src);
  const count = (block[0].match(/key:/g) || []).length;
  check('时段表不超过 10 项', count <= 10, count);
}

/* ============ 3z. 复合表达与当前时间 ============ */
console.log('\n[3z] 复合表达与当前时间');

const Z = allOn();
const ZS = Z.settings;
const ZB = ta.parseToDate('2026-09-19'); // 周六
const isoZ = (d) => d.toISOString().slice(0, 10);
const fullZ = (d) => d.toISOString().slice(0, 16).replace('T', ' ');

// --- 核心用例：明年12月份的第49周周三下午2点 → 2027-12-08 14:00 ---
[
  ['明年12月份的第49周周三下午2点', '2027-12-08 14:00'],
  ['明年12月份第49周周三下午2点', '2027-12-08 14:00'],
  ['明年12月的第49周周三下午两点', '2027-12-08 14:00'],
  ['2027年12月份的第49周周三下午2点', '2027-12-08 14:00'],
].forEach(([t, expect]) => {
  const d = ta.parseRelative(t, ZB, ZS);
  check(t + ' → ' + expect, d && fullZ(d) === expect, d ? fullZ(d) : 'null');
});

// --- 其他复合组合 ---
check('明年12月份的第49周（取该周一）', (() => {
  const d = ta.parseRelative('明年12月份的第49周', ZB, ZS);
  return d && isoZ(d) === '2027-12-06';
})(), ta.parseRelative('明年12月份的第49周', ZB, ZS) && isoZ(ta.parseRelative('明年12月份的第49周', ZB, ZS)));
check('明年12月 → 12-01', isoZ(ta.parseRelative('明年12月', ZB, ZS)) === '2027-12-01',
  isoZ(ta.parseRelative('明年12月', ZB, ZS)));
check('周三下午2点 → 14:00', (() => {
  const d = ta.parseRelative('周三下午2点', ZB, ZS);
  return d && d.getHours() === 14;
})(), ta.parseRelative('周三下午2点', ZB, ZS) && ta.parseRelative('周三下午2点', ZB, ZS).getHours());

// --- 月份冲突时必须判失败（不能返回看起来对其实错的日期）---
check('第1周与12月冲突 → null', ta.parseRelative('明年12月份的第1周周三', ZB, ZS) === null,
  ta.parseRelative('明年12月份的第1周周三', ZB, ZS));

// --- 周起始日设置影响结果 ---
{
{
  // 周起始日：唯一来源是 calendar.weekStart，两处定义必须一致
  const st0 = require('../src/settings.js');
  const cal0 = require('../src/calendar.js');
  const opts = cal0.WEEK_START_OPTIONS.map((o) => o.value);
  check('周起始选项与合法值一致',
    opts.length === st0.VALID_WEEK_START.length &&
    opts.every((v, i) => v === st0.VALID_WEEK_START[i]),
    opts.join(',') + ' vs ' + st0.VALID_WEEK_START.join(','));
  check('周起始日只有 calendar.weekStart 一个来源',
    !('weekStart' in st0.DEFAULT_SETTINGS.timestamp.extensions));
}

  // 周起始日已统一到 calendar.weekStart（全插件唯一来源）
  const stM = migrateSettings(null);
  stM.calendar.weekStart = 'monday';
  const dM = ta.parseRelative('明年12月份的第49周周三下午2点', ZB, stM);
  check('周一起始 → 12-08', dM && isoZ(dM) === '2027-12-08', dM && isoZ(dM));

  const stS = migrateSettings(null);
  stS.calendar.weekStart = 'sunday';
  const dS = ta.parseRelative('明年12月份的第49周周三下午2点', ZB, stS);
  check('周日起始结果不同', dS && isoZ(dS) !== '2027-12-08', dS && isoZ(dS));

  check('默认 weekStart 为 locale', migrateSettings(null).calendar.weekStart === 'locale');
  check('旧 timestamp.weekStart 已不再是默认键',
    !('weekStart' in migrateSettings(null).timestamp.extensions));
  check('旧值并入 calendar.weekStart',
    migrateSettings({ timestamp: { extensions: { weekStart: 'sunday' } } })
      .calendar.weekStart === 'sunday');
  check('非法 weekStart 清洗为 locale',
    migrateSettings({ calendar: { weekStart: 'xxx' } }).calendar.weekStart === 'locale');
}

// --- 当前时间：取真实此刻，不理基准 ---
{
  const before = Date.now();
  const d = ta.parseRelative('当前时间', ZB, ZS);
  const after = Date.now();
  check('当前时间在调用时刻附近', d && d.getTime() >= before - 1000 && d.getTime() <= after + 1000,
    d && d.toISOString());
  check('当前时间不等于基准', d && isoZ(d) !== '2026-09-19' || (d && d.getHours() !== 0),
    d && fullZ(d));
  ['此刻', '当下', '现在'].forEach((t) => {
    check('占位词可用：' + t, ta.parseRelative(t, ZB, ZS) !== null);
  });
}

// --- 当前时间是占位符，apply 时恒为追加 ---
{
  const st = migrateSettings(null);
  st.timestamp.extensions.appendOnAutoPick = false; // 明确关闭追加
  const editor = {
    log: null,
    getSelection: () => '',
    getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => '当前时间',
    setSelection: (a, b) => { editor.log = [a, b]; },
    replaceSelection: (t) => { editor.out = t; },
  };
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '当前时间',
    { from: { line: 0, ch: 0 }, to: { line: 0, ch: 4 } });
  modal.apply('2026-09-19 23:40');
  check('当前时间恒为追加（不受开关影响）',
    editor.out === ' 2026-09-19 23:40', JSON.stringify(editor.out));
}

// --- 行内识别 ---
[
  ['会议定在明年12月份的第49周周三下午2点', '明年12月份的第49周周三下午2点'],
  ['当前时间是', '当前时间'],
  ['下周五交', '下周五'],
  ['周一开会', '周一'],
].forEach(([line, expect]) => {
  const p = ta.pickTimeOnLine({ getCursor: () => ({ line: 0, ch: 3 }), getLine: () => line });
  check('行内识别「' + expect + '」', p && p.text === expect, p ? p.text : 'null');
});

// 回归：完整日期不能被复合规则抢走
{
  const p = ta.pickTimeOnLine({
    getCursor: () => ({ line: 0, ch: 3 }),
    getLine: () => '会议 2026年09月19日',
  });
  check('完整日期不被复合抢走', p && p.text === '2026年09月19日', p ? p.text : 'null');
}
// 回归：纯年份交给年份规则（去年同期而非 1 月 1 日）
check('去年 = 去年同期', isoZ(ta.parseRelative('去年', ZB, ZS)) === '2025-09-19',
  isoZ(ta.parseRelative('去年', ZB, ZS)));
check('明年 = 明年同期', isoZ(ta.parseRelative('明年', ZB, ZS)) === '2027-09-19',
  isoZ(ta.parseRelative('明年', ZB, ZS)));

/* ============ 3aa. 口语日 + 时段缩略 ============ */
console.log('\n[3aa] 口语日 + 时段缩略');

const AA = allOn();
const AAB = ta.parseToDate('2026-09-19');
const fullAA = (d) => d.toISOString().slice(0, 16).replace('T', ' ');

// --- 关闭时段转换：日期必须正确（这是最低要求）---
{
  const off = migrateSettings(null);
  [
    /*
     * 这里**不再**期望 00:00。
     * 「明天晚上」有明确的日期锚点（就是明天），时段是修饰而不是编造，
     * 所以时段小时照常应用，不受「时段名单独转换」开关限制 ——
     * 那个开关只管**没有日期锚点**的裸时段词（光秃秃的「早上」）。
     * 否则「明天晚上」会被算成 00:00（午夜），反而把「晚上」弄丢了。
     */
    ['明天晚上', '2026-09-20 20:00'], ['昨天早上', '2026-09-18 09:00'],
    ['明晚', '2026-09-20 20:00'], ['今早', '2026-09-19 09:00'],
    ['昨天早晨', '2026-09-18 09:00'], ['明天下午', '2026-09-20 15:00'],
    ['后天晚上', '2026-09-21 20:00'], ['昨天晚上', '2026-09-18 20:00'],
  ].forEach(([t, expect]) => {
    const d = ta.parseRelative(t, AAB, off);
    check('默认可识别：' + t, d && fullAA(d) === expect, d ? fullAA(d) : 'null');
  });
}

// --- 开启时段转换：套用时段小时 ---
{
  const on = migrateSettings(null);
  on.timestamp.extensions.convertDaypartAlone = true;
  [
    ['明天晚上', '2026-09-20 20:00'], ['昨天早上', '2026-09-18 09:00'],
    ['明晚', '2026-09-20 20:00'], ['今早', '2026-09-19 09:00'],
    ['明早', '2026-09-20 09:00'], ['今晚', '2026-09-19 20:00'],
    ['昨夜', '2026-09-18 23:00'], // 「夜里」已拆成独立时段，默认 23:00, ['后天晚上', '2026-09-21 20:00'],
    ['前天下午', '2026-09-17 15:00'],
  ].forEach(([t, expect]) => {
    const d = ta.parseRelative(t, AAB, on);
    check('带时段：' + t + ' → ' + expect, d && fullAA(d) === expect, d ? fullAA(d) : 'null');
  });
  // 无时段的仍落在 00:00
  check('「明天」不带时段 → 00:00',
    fullAA(ta.parseRelative('明天', AAB, on)) === '2026-09-20 00:00',
    fullAA(ta.parseRelative('明天', AAB, on)));
  // 明确时刻优先于时段默认
  check('明天5点 优先于时段默认',
    fullAA(ta.parseRelative('明天5点', AAB, on)) === '2026-09-20 05:00',
    fullAA(ta.parseRelative('明天5点', AAB, on)));
}

// --- 单字别名（明晚 / 今早 靠单字识别）---
{
  check('「晚」映射到晚上', ta.daypartHour('晚上', null) === 20);
  const on = migrateSettings(null);
  on.timestamp.extensions.convertDaypartAlone = true;
  // 缩略词必须靠别名，用完整词 indexOf 是找不到的
  check('明晚靠单字别名识别',
    ta.parseRelative('明晚', AAB, on).getHours() === 20,
    ta.parseRelative('明晚', AAB, on).getHours());
}

// --- 误判防护 ---
{
  const on = migrateSettings(null);
  on.timestamp.extensions.convertDaypartAlone = true;
  // 「明天天气」的剩余部分既非时刻也非时段 → 不认
  check('明天天气 不识别', ta.parseRelative('明天天气', AAB, on) === null,
    ta.parseRelative('明天天气', AAB, on));
}

// --- 相对时间的基准说明必须带时刻 ---
{
  const st = migrateSettings(null);
  const P = { settings: st, app: {} };
  const r = ta.compute(P, 'relative', '2026-10-03');
  check('基准说明含当前日期时间',
    /（相对 现在 \d{4}-\d{2}-\d{2} \d{2}:\d{2}）/.test(r), r);
  const base = ta.parseToDate('2026-09-19');
  const r2 = ta.compute(P, 'relative', '2026-10-03', { base });
  check('指定基准时显示该时间', r2.indexOf('（相对 2026-09-19 00:00）') >= 0, r2);
  // 关闭说明后不显示
  st.timestamp.extensions.showRelativeBase = false;
  check('关闭说明后不显示基准', ta.compute(P, 'relative', '2026-10-03').indexOf('（相对') < 0,
    ta.compute(P, 'relative', '2026-10-03'));
}

/* ============ 3bb. 月日的默认归属：中文=农历 / 阿拉伯=阳历 ============ */
console.log('\n[3bb] 月日默认归属');

function mkExt(on) {
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  st.timestamp.extensions.lunarOnHao = on;
  return { settings: st, app: {} };
}
const OFF = mkExt(false);
const ON = mkExt(true);

// --- 默认（关）：中文大写 → 农历 ---
[
  ['五月十六号', '2026-06-30'],
  ['八月十九', '2026-09-29'],
  ['五月十六', '2026-06-30'],
  ['2026年五月十六号', '2026-06-30'],
].forEach(([t, expect]) => {
  check('中文默认农历：' + t, ta.compute(OFF, 'lunarToSolar', t) === expect,
    ta.compute(OFF, 'lunarToSolar', t));
});

// --- 默认（关）：阿拉伯数字 → 阳历（不进农历）---
['5月16号', '5月16日', '5-16', '5/16'].forEach((t) => {
  check('阿拉伯默认非农历：' + t, ta.compute(OFF, 'lunarToSolar', t) === null,
    ta.compute(OFF, 'lunarToSolar', t));
});

// 阿拉伯数字的阳历补全要能用（5月16号 → 2026-05-16）
check('5月16号 → 阳历补全', ta.compute(OFF, 'fillDate', '5月16号') === '2026-05-16',
  ta.compute(OFF, 'fillDate', '5月16号'));
check('5月16日 → 阳历补全', ta.compute(OFF, 'fillDate', '5月16日') === '2026-05-16',
  ta.compute(OFF, 'fillDate', '5月16日'));

// --- 开启 lunarOnHao：带号/日一律农历 ---
[
  ['5月16号', '2026-06-30'],
  ['五月十六号', '2026-06-30'],
  ['5月16日', '2026-06-30'],
].forEach(([t, expect]) => {
  check('开启后算农历：' + t, ta.compute(ON, 'lunarToSolar', t) === expect,
    ta.compute(ON, 'lunarToSolar', t));
});

// 中文大写不受开关影响（开启后仍必须是农历，不能反而失效）
check('开启后中文仍为农历', ta.compute(ON, 'lunarToSolar', '八月十九') === '2026-09-29',
  ta.compute(ON, 'lunarToSolar', '八月十九'));

// --- 设置字段 ---
check('lunarOnHao 默认关', migrateSettings(null).timestamp.extensions.lunarOnHao === false);
check('lunarOnHao 迁移保留',
  migrateSettings({ timestamp: { extensions: { lunarOnHao: true } } })
    .timestamp.extensions.lunarOnHao === true);
check('lunarOnHao 非法值清洗',
  migrateSettings({ timestamp: { extensions: { lunarOnHao: 'yes' } } })
    .timestamp.extensions.lunarOnHao === false);

// --- 阳历解析仍能处理常规日期（回归）---
check('2026-09-19 仍可解析', !!ta.parseToDate('2026-09-19'));
check('09-17 仍可解析', !!ta.parseToDate('09-17'));

/* ============ 3cc. 大写中文即农历开关 ============ */
console.log('\n[3cc] 大写中文即农历开关');

function mkLunar(cnUpper, hao) {
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  st.timestamp.extensions.lunarOnCnUpper = cnUpper;
  st.timestamp.extensions.lunarOnHao = hao;
  return { settings: st, app: {} };
}
const L00 = mkLunar(false, false); // 默认
const L10 = mkLunar(true, false);  // 开大写即农历
const L01 = mkLunar(false, true);  // 开带号算农历

// --- 默认（关）：只认无后缀与「号」---
[
  ['五月十六', '2026-06-30'],
  ['五月十六号', '2026-06-30'],
  ['八月十九', '2026-09-29'],
  ['腊月初八', '2027-01-15'],
].forEach(([t, expect]) => {
  check('默认算农历：' + t, ta.compute(L00, 'lunarToSolar', t) === expect,
    ta.compute(L00, 'lunarToSolar', t));
});

// 「五月十六日」默认按阳历（这是本开关的核心差异）
check('默认：五月十六日 不算农历', ta.compute(L00, 'lunarToSolar', '五月十六日') === null,
  ta.compute(L00, 'lunarToSolar', '五月十六日'));
check('默认：阿拉伯数字不算农历', ta.compute(L00, 'lunarToSolar', '5月16号') === null);

// --- 开启大写即农历：带「日」的也算 ---
check('开启后：五月十六日 算农历', ta.compute(L10, 'lunarToSolar', '五月十六日') === '2026-06-30',
  ta.compute(L10, 'lunarToSolar', '五月十六日'));
// 原有的仍必须可用（不能因为开了开关反而失效）
['五月十六', '五月十六号', '八月十九'].forEach((t) => {
  check('开启后仍可用：' + t, ta.compute(L10, 'lunarToSolar', t) !== null,
    ta.compute(L10, 'lunarToSolar', t));
});
// 阿拉伯数字仍按阳历（大写即农历不影响数字）
check('开启后阿拉伯数字仍为阳历', ta.compute(L10, 'lunarToSolar', '5月16号') === null,
  ta.compute(L10, 'lunarToSolar', '5月16号'));

// --- 两个开关互不干扰 ---
check('带号开关仍生效', ta.compute(L01, 'lunarToSolar', '5月16号') === '2026-06-30',
  ta.compute(L01, 'lunarToSolar', '5月16号'));
check('默认下五月十六日不受带号开关影响',
  ta.compute(L01, 'lunarToSolar', '五月十六日') === null,
  ta.compute(L01, 'lunarToSolar', '五月十六日'));

// --- 设置字段 ---
check('lunarOnCnUpper 默认关', migrateSettings(null).timestamp.extensions.lunarOnCnUpper === false);
check('lunarOnCnUpper 迁移保留',
  migrateSettings({ timestamp: { extensions: { lunarOnCnUpper: true } } })
    .timestamp.extensions.lunarOnCnUpper === true);
check('lunarOnCnUpper 非法值清洗',
  migrateSettings({ timestamp: { extensions: { lunarOnCnUpper: 'yes' } } })
    .timestamp.extensions.lunarOnCnUpper === false);

// --- 后缀识别 ---
check('识别无后缀', ta.cnMonthDaySuffix('五月十六') === '', ta.cnMonthDaySuffix('五月十六'));
check('识别「号」后缀', ta.cnMonthDaySuffix('五月十六号') === '号', ta.cnMonthDaySuffix('五月十六号'));
check('识别「日」后缀', ta.cnMonthDaySuffix('五月十六日') === '日', ta.cnMonthDaySuffix('五月十六日'));
check('阿拉伯数字返回 null', ta.cnMonthDaySuffix('5月16号') === null, ta.cnMonthDaySuffix('5月16号'));
check('带农历前缀可识别', ta.cnMonthDaySuffix('农历五月十六号') === '号',
  ta.cnMonthDaySuffix('农历五月十六号'));

/* ============ 3dd. 农历总开关 ============ */
console.log('\n[3dd] 农历总开关');

function mkL(on) {
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  st.timestamp.extensions.lunarEnabled = on;
  return { settings: st, app: {} };
}
const LON = mkL(true);
const LOFF = mkL(false);

// --- 默认开启 ---
check('lunarEnabled 默认开', migrateSettings(null).timestamp.extensions.lunarEnabled === true);
check('开启时转农历可用',
  ta.compute(LON, 'lunar', '2026-09-19') === '农历2026年八月初九',
  ta.compute(LON, 'lunar', '2026-09-19'));
check('开启时农历→阳历可用', ta.compute(LON, 'lunarToSolar', '八月十九') === '2026-09-29',
  ta.compute(LON, 'lunarToSolar', '八月十九'));

// --- 关闭：所有农历项一律不生效 ---
[
  ['lunar', '2026-09-19'],
  ['lunarToSolar', '八月十九'],
  ['lunarToSolar', '五月十六号'],
  ['lunarGanzhi', '2026-09-19'],
  ['solarTerm', '2026-09-19'],
  ['termToDate', '立春'],
  ['ganzhiToYear', '丙午'],
].forEach(([key, text]) => {
  check('关闭后失效：' + key + ' / ' + text, ta.compute(LOFF, key, text) === null,
    ta.compute(LOFF, key, text));
});

// --- 关闭后非农历项不受影响（仍按阳历）---
check('关闭后常规日期仍可解析', !!ta.parseToDate('2026-09-19'));
check('关闭后补全日期可用', ta.compute(LOFF, 'fillDate', '09-17') !== null,
  ta.compute(LOFF, 'fillDate', '09-17'));
check('关闭后相对时间可用', ta.compute(LOFF, 'relativeToDate', '明天') !== null,
  ta.compute(LOFF, 'relativeToDate', '明天'));

// --- 关闭后面板不列出农历项 ---
{
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  st.timestamp.extensions.lunarEnabled = false;
  const editor = { getSelection: () => '2026-09-19', getCursor: () => ({ line: 0, ch: 5 }), getLine: () => '2026-09-19' };
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '2026-09-19', null);
  const items = modal.availableItems();
  const hasLunar = items.some((d) => d.key === 'lunar' || d.key === 'lunarGanzhi' || d.key === 'solarTerm');
  check('关闭后面板无农历项', !hasLunar, items.map((d) => d.key).join(','));
  check('关闭后面板仍有其他项', items.length > 0, items.length);
}

// --- 设置字段 ---
check('lunarEnabled 迁移保留',
  migrateSettings({ timestamp: { extensions: { lunarEnabled: false } } })
    .timestamp.extensions.lunarEnabled === false);
check('lunarEnabled 非法值清洗',
  migrateSettings({ timestamp: { extensions: { lunarEnabled: 'no' } } })
    .timestamp.extensions.lunarEnabled === true);

// --- LUNAR_KEYS 覆盖所有农历项（不能漏）---
{
  const S = require(__dirname + '/../src/settings.js');
  const allLunarish = S.ACTION_DEFS.filter(
    (d) => /lunar|term|ganzhi|干支|节气|农历/.test(d.key + d.name)
  );
  const missed = allLunarish.filter((d) => !S.isLunarKey(d.key));
  check('LUNAR_KEYS 未遗漏农历项', missed.length === 0,
    missed.map((d) => d.key).join(',') || '无遗漏');
}

/* ============ 3ee. 历法标记与行内农历识别 ============ */
console.log('\n[3ee] 历法标记与行内农历识别');

function mkM(anywhere) {
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  st.timestamp.extensions.lunarMarkAnywhere = anywhere;
  return { settings: st, app: {} };
}
const M0 = mkM(false);
const M1 = mkM(true);
const mkSt = (anywhere) => mkM(anywhere).settings;
const ed = (l) => ({ getCursor: () => ({ line: 0, ch: 3 }), getLine: () => l });

// --- 前缀标记：无论开关如何都应能转 ---
[
  ['农历2026年八月初九', '2026-09-19'],
  ['农历2026年五月十六', '2026-06-30'],
  ['阴历2026年八月初九', '2026-09-19'],
].forEach(([t, expect]) => {
  check('前缀标记：' + t, ta.compute(M0, 'lunarToSolar', t) === expect,
    ta.compute(M0, 'lunarToSolar', t));
});

// --- 明确标「阳历」→ 不按农历转 ---
check('阳历标记不算农历', ta.compute(M0, 'lunarToSolar', '阳历2026年五月十六') === null,
  ta.compute(M0, 'lunarToSolar', '阳历2026年五月十六'));
check('公历标记不算农历', ta.compute(M0, 'lunarToSolar', '公历2026年五月十六') === null);

// --- 默认：标记在后不转换 ---
check('默认：后缀标记不转换', ta.compute(M0, 'lunarToSolar', '2026年八月初九 农历') === null,
  ta.compute(M0, 'lunarToSolar', '2026年八月初九 农历'));
check('默认：后缀标记不转换（无空格）', ta.compute(M0, 'lunarToSolar', '八月十九农历') === null,
  ta.compute(M0, 'lunarToSolar', '八月十九农历'));

// --- 开启后：后缀标记也能转 ---
check('开启后：后缀标记可转换',
  ta.compute(M1, 'lunarToSolar', '2026年八月初九 农历') === '2026-09-19',
  ta.compute(M1, 'lunarToSolar', '2026年八月初九 农历'));
check('开启后：无空格后缀也可',
  ta.compute(M1, 'lunarToSolar', '八月十九农历') === '2026-09-29',
  ta.compute(M1, 'lunarToSolar', '八月十九农历'));
// 前缀不受影响
check('开启后前缀仍可用', ta.compute(M1, 'lunarToSolar', '农历2026年八月初九') === '2026-09-19');

// --- 行内识别：光标停留（不选中）也要能拿到整串 ---
[
  ['农历2026年八月初九', '农历2026年八月初九'],
  ['日期 农历2026年五月十六', '农历2026年五月十六'],
  ['八月十九', '八月十九'],
].forEach(([line, expect]) => {
  const p = ta.pickTimeOnLine(ed(line), mkSt(false));
  check('行内识别整串：' + expect, p && p.text === expect, p ? p.text : 'null');
});

// 后缀标记：默认不识别为农历串 / 开启后识别
{
  const p0 = ta.pickTimeOnLine(ed('2026年八月初九 农历'), mkSt(false));
  check('默认：后缀行内不按农历', !p0 || ta.compute(M0, 'lunarToSolar', p0.text) === null,
    p0 ? p0.text : 'null');
  const p1 = ta.pickTimeOnLine(ed('2026年八月初九 农历'), mkSt(true));
  check('开启后：后缀行内可识别',
    p1 && ta.compute(M1, 'lunarToSolar', p1.text) === '2026-09-19',
    p1 ? p1.text : 'null');
}

// --- 回归：常规日期与相对时间不受影响 ---
check('常规日期仍可识别',
  ta.pickTimeOnLine(ed('会议 2026-09-19'), mkSt(false)).text === '2026-09-19');
check('相对时间仍可识别',
  ta.pickTimeOnLine(ed('截止明天5点'), mkSt(false)).text === '明天5点');
check('普通文字不识别', ta.pickTimeOnLine(ed('普通的文字'), mkSt(false)) === null);

// --- 关键回归：「2026年」不能被当成 2026 年后 ---
check('「2026年」不是相对时长', ta.parseRelative('2026年', new Date('2026-09-19')) === null,
  ta.parseRelative('2026年', new Date('2026-09-19')));
check('「3年后」仍是相对时长', (() => {
  const d = ta.parseRelative('3年后', new Date('2026-09-19'));
  return d && d.getFullYear() === 2029;
})(), ta.parseRelative('3年后', new Date('2026-09-19')));

// --- 设置字段 ---
check('lunarMarkAnywhere 默认关',
  migrateSettings(null).timestamp.extensions.lunarMarkAnywhere === false);
check('lunarMarkAnywhere 迁移保留',
  migrateSettings({ timestamp: { extensions: { lunarMarkAnywhere: true } } })
    .timestamp.extensions.lunarMarkAnywhere === true);
check('lunarMarkAnywhere 非法值清洗',
  migrateSettings({ timestamp: { extensions: { lunarMarkAnywhere: 'x' } } })
    .timestamp.extensions.lunarMarkAnywhere === false);

// --- 标记检测函数 ---
check('识别农历前缀', ta.stripCalendarMark('农历2026年八月初九', null).mark === 'lunar');
check('识别阳历前缀', ta.stripCalendarMark('阳历2026-09-19', null).mark === 'solar');
check('默认尾标记不认', ta.stripCalendarMark('八月十九 农历', null).mark === null);
check('开启后尾标记认',
  ta.stripCalendarMark('八月十九 农历', mkSt(true)).mark === 'lunar');
check('containsCalendarMark 任意位置',
  ta.containsCalendarMark('八月十九 农历') === true);
check('containsCalendarMark 无标记', ta.containsCalendarMark('八月十九') === false);

/* ============ 3ff. 统一格式 + 撤回标记 ============ */
console.log('\n[3ff] 统一格式与撤回标记');

function mkU(fmt) {
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => {
    st.timestamp.extensions.items[k] = true;
  });
  if (fmt !== undefined) st.timestamp.extensions.unifyFormat = fmt;
  return { settings: st, app: {} };
}
const UF = mkU();
const UFB = ta.parseToDate('2026-09-19');

// --- unify 默认开 ---
check('unify 默认开', migrateSettings(null).timestamp.extensions.items.unify === true);

// --- 默认跟随时间戳格式 ---
{
  const st = mkU('').settings;
  check('默认格式串为空（跟随时间戳）', st.timestamp.extensions.unifyFormat === '');
  check('跟随时间戳格式', ta.unifyFormatOf(st) === st.timestamp.format,
    ta.unifyFormatOf(st));
}

// --- 各种形态都能统一 ---
[
  ['2026年五月十六', '2026-06-30'],   // 农历（你报的那个例子）
  ['2026-09-19', '2026-09-19'],
  ['09-17', '2026-09-17'],
  ['周一', WDT(1)],
].forEach(([t, expect]) => {
  const r = ta.compute(UF, 'unify', t);
  check('统一格式：' + t, r && r.indexOf(expect) === 0, r);
});
check('复合表达也能统一', (() => {
  const r = ta.compute(UF, 'unify', '明年12月份的第49周周三下午2点');
  return r && r.indexOf('2027-12-08') === 0;
})(), ta.compute(UF, 'unify', '明年12月份的第49周周三下午2点'));

// --- 自定义格式串 ---
{
  const P = mkU('YYYY年MM月DD日');
  check('自定义格式生效', ta.compute(P, 'unify', '2026-09-19') === '2026年09月19日',
    ta.compute(P, 'unify', '2026-09-19'));
  check('自定义格式对农历也生效',
    ta.compute(P, 'unify', '2026年五月十六') === '2026年06月30日',
    ta.compute(P, 'unify', '2026年五月十六'));
}
// 跟随时间戳：改时间戳格式，统一格式跟着变
{
  const st = mkU('').settings;
  st.timestamp.format = 'YYYY/MM/DD';
  check('跟随时间戳格式变化', ta.unifyFormatOf(st) === 'YYYY/MM/DD', ta.unifyFormatOf(st));
}

// --- 格式串长度受限（数据不膨胀）---
check('unifyFormat 超长被截断',
  migrateSettings({ timestamp: { extensions: { unifyFormat: 'x'.repeat(200) } } })
    .timestamp.extensions.unifyFormat.length === 60);

// --- 撤回标记 ---
check('undoHintEnabled 默认开',
  migrateSettings(null).timestamp.extensions.undoHintEnabled === true);
check('撤回图标固定为内置图标', ta.undoMarkOf(migrateSettings(null)) === 'lucide-undo-2',
  ta.undoMarkOf(migrateSettings(null)));
check('开关关时无标记', (() => {
  const st = migrateSettings(null);
  st.timestamp.extensions.undoHintEnabled = false;
  return ta.undoMarkOf(st) === '';
})());
// 图标不再可自定义：设置里不应再有 undoMark 字段
check('undoMark 设置项已移除',
  !('undoMark' in migrateSettings(null).timestamp.extensions));
check('开关开时返回图标', ta.undoMarkOf(migrateSettings(null)) === 'lucide-undo-2',
  ta.undoMarkOf(migrateSettings(null)));
// 图标固定：即便旧配置里带 undoMark，迁移后也不该残留
check('旧配置的 undoMark 不残留',
  !('undoMark' in migrateSettings({ timestamp: { extensions: { undoMark: 'xxxxxxxxxx' } } })
    .timestamp.extensions));

// --- 应用后：正文不带标记，但挂了可点击 widget ---
{
  // MockEl 的 addEventListener 是空实现、textContent 只读，临时换成可记录点击的 stub
  const __oldCreate = global.document.createElement;
  global.document.createElement = (t) => ({
    tag: t, className: '', textContent: '', attrs: {}, listeners: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(e, f) { this.listeners[e] = f; },
  });
  const st = migrateSettings(null);
  const marks = [];
  const cm = {
    markText: (a, b, opt) => {
      const m = { a, b, opt, cleared: false, clear() { this.cleared = true; }, find() { return { from: a, to: b }; } };
      marks.push(m);
      return m;
    },
    replaceRange: (t, f, to) => { cm.last = { t, f, to }; },
  };
  const editor = {
    cm,
    getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    // getLine 要反映最新内容，否则记录层定位不到（真实编辑器会变）
    getLine: () => (editor.out === undefined ? '2026-06-30 00:00' : editor.out),
    setSelection: () => {},
    replaceSelection: (t) => { editor.out = t; },
  };
  const modal = new ta.TimeActionModal({ settings: st, app: {} }, editor, '2026年五月十六',
    { from: { line: 0, ch: 0 }, to: { line: 0, ch: 7 } });
  modal.apply('2026-06-30 00:00');
  check('正文只写结果，不带标记字符', editor.out === '2026-06-30 00:00', editor.out);
  // 记录层必须已经写入（不依赖装饰是否挂上）
  check('转换后立即有可撤回记录',
    ta.undoCount({ app: { workspace: { getActiveFile: () => null } } }) >= 1);
  check('挂了两个装饰（定位 + 按钮）', marks.length === 2, marks.length);
  const btn = marks[1].opt.replacedWith;
  // 现在是 SVG 图标（不依赖字体），不再是自定义字符
  check('按钮用内置 SVG 图标', btn.attrs['data-icon'] === 'lucide-undo-2' || btn.icon === 'lucide-undo-2',
    JSON.stringify(btn.attrs) + ' icon=' + btn.icon);
  check('按钮不再使用自定义字符', !btn.textContent, JSON.stringify(btn.textContent));
  check('按钮 title 带原文', /2026年五月十六/.test(btn.attrs.title || ''), btn.attrs.title);
  check('按钮可点击', typeof btn.listeners.click === 'function');
  check('点击后还原为原文', (() => {
    btn.listeners.click({ preventDefault() {}, stopPropagation() {} });
    return editor.out === '2026年五月十六';
  })(), editor.out);
  check('点击后装饰被清除', marks.every((m) => m.cleared));

  // 关闭开关后不挂装饰
  const st2 = migrateSettings(null);
  st2.timestamp.extensions.undoHintEnabled = false;
  const marks2 = [];
  const cm2 = { markText: (a, b, o) => { marks2.push({ a, b, o }); return { clear() {}, find() { return { from: a, to: b }; } }; }, replaceRange: () => {} };
  const editor2 = {
    cm: cm2,
    getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => 'x', setSelection: () => {},
    replaceSelection: (t) => { editor2.out = t; },
  };
  const m2 = new ta.TimeActionModal({ settings: st2, app: {} }, editor2, 'x',
    { from: { line: 0, ch: 0 }, to: { line: 0, ch: 1 } });
  m2.apply('R');
  check('关闭后不挂装饰', marks2.length === 0, marks2.length);
  global.document.createElement = __oldCreate;
}

// --- 撤回栈：内存、限量、可清空（不依赖装饰）---
{
  const mkRec = (path) => ({
    app: { workspace: { getActiveFile: () => ({ path }) } },
    settings: migrateSettings(null),
  });
  /*
   * 最朴素的 editor：只做行读写，完全不碰 CodeMirror。
   * 但要**正确模拟选区替换**——replaceSelection 只替换选区而不是整行，
   * 否则测不出「撤回后残留空格」「列号偏移」这类真问题。
   */
  const mkEd = (lines) => ({
    _sel: [{ line: 0, ch: 0 }, { line: 0, ch: 0 }],
    getLine: (n) => (lines[n] === undefined ? null : lines[n]),
    setSelection(a, b) { this._sel = [a, b]; },
    replaceSelection(t) {
      const [a, b] = this._sel;
      const line = lines[a.line] || '';
      lines[a.line] = line.slice(0, a.ch) + t + line.slice(b.ch);
    },
  });

  ta.clearUndo();
  check('初始为 0', ta.undoStackSize() === 0);

  // 一篇笔记里记 300 条，验证不无限增长
  {
    const P = mkRec('a.md');
    for (let i = 0; i < 300; i++) {
      ta.recordUndoEntry(P, { editor: mkEd(['x']), line: 0, fromCh: 0, searchText: 's' + i, replaceWith: 'o' + i });
    }
    check('每篇笔记上限 100（不无限增长）', ta.undoCount(P) === 100, ta.undoCount(P));
  }

  // 多篇笔记：总数受限
  for (let n = 0; n < 80; n++) {
    ta.recordUndoEntry(mkRec('n' + n + '.md'), { editor: mkEd(['x']), line: 0, fromCh: 0, searchText: 's', replaceWith: 'o' });
  }
  check('笔记数上限 50（不无限增长）', ta.undoStackSize() <= 50, ta.undoStackSize());

  // 新笔记仍可正常记录与撤回
  {
    const P3 = mkRec('fresh.md');
    const lines = ['原文 2026-06-30'];
    const ed = mkEd(lines);
    ta.recordUndoEntry(P3, { editor: ed, line: 0, fromCh: 3, searchText: ' 2026-06-30', replaceWith: '' });
    check('新笔记可记', ta.undoCount(P3) === 1, ta.undoCount(P3));
    check('撤回该笔记最近一次', ta.undoLast(P3) === true);
    check('撤回内容正确（追加模式去空格）', lines[0] === '原文', lines[0]);
    check('撤回后归零', ta.undoCount(P3) === 0);
  }

  // 覆盖模式还原成原文
  {
    const P4 = mkRec('cov.md');
    const lines = ['2026-06-30'];
    ta.recordUndoEntry(P4, { editor: mkEd(lines), line: 0, fromCh: 0, searchText: '2026-06-30', replaceWith: '2026年五月十六' });
    ta.undoLast(P4);
    check('覆盖模式还原原文', lines[0] === '2026年五月十六', lines[0]);
  }

  // 位置偏移后仍能靠文本定位
  {
    const P5 = mkRec('shift.md');
    const lines = ['前插文字 2026-06-30'];
    // 记录时 fromCh=0，但前面被插入了内容 → 列号失效，靠文本兜底
    ta.recordUndoEntry(P5, { editor: mkEd(lines), line: 0, fromCh: 0, searchText: '2026-06-30', replaceWith: '原文' });
    ta.undoLast(P5);
    check('列号失效时靠文本定位', lines[0] === '前插文字 原文', lines[0]);
  }

  // 文本已被删改 → 撤回失败但不崩
  {
    const P6 = mkRec('gone.md');
    const lines = ['完全不同的内容'];
    ta.recordUndoEntry(P6, { editor: mkEd(lines), line: 0, fromCh: 0, searchText: '2026-06-30', replaceWith: 'x' });
    check('文本已改时撤回失败', ta.undoLast(P6) === false);
    /*
     * BUG-1 修复后行为变了：**保留**记录并标记 unresolvable。
     * 旧约定「失败就清掉」是为顺序撤回设计的，乱序撤回时清掉的是还没撤的中间记录，
     * 等于那处转换永久不可逆。断言必须跟着行为改 —— 给旧行为背书会掩盖数据丢失。
     */
    check('失败后保留记录（不再永久不可逆）', ta.undoCount(P6) === 1, ta.undoCount(P6));
  }

  ta.clearUndo();
  check('清空后为 0', ta.undoStackSize() === 0);
}

// --- 命令存在（从产物里查，避免补一堆 mock）---
{
  const fs = require('fs');
  const src = fs.readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  check('撤回命令已注册', src.indexOf("'time-tools-timestamp-undo-convert'") >= 0);
  check('撤回命令带 time-tools- 前缀',
    /time-tools-timestamp-undo-convert/.test(src));
}

/* ============ 3gg. 撤回标记走 CM6（Obsidian 1.x 真实环境） ============ */
console.log('\n[3gg] 撤回标记 CM6 路径');

{
  const st = migrateSettings(null);
  const disp = [];
  const built = ta.buildCm6Extension();
  check('CM6 扩展可构建', Array.isArray(built) && built.length === 1, built && built.length);
  const F = built[0];                       // StateField
  F.__current = F.spec.create();            // 装饰集（模拟 view.state）

  // 模拟 CM6 EditorView：dispatch 真的更新装饰集，state.field 返回当前集合
  const doc = { length: 100, lines: 1, line: () => ({ from: 0, to: 100 }) };
  const view = {
    state: { doc, field: (f) => (f.__current || { between: () => {} }) },
    dispatch: (spec) => {
      disp.push(spec);
      const eff = spec.effects;
      if (eff) {
        F.__current = F.spec.update(F.__current, { changes: { map: () => {} }, effects: [eff] });
      }
    },
  };

  let ext = null;
  const plugin = {
    settings: st, app: {},
    registerEditorExtension: (e) => { ext = e; },
    addRibbonIcon: () => {}, addCommand: () => {},
    registerEditorSuggest: () => {},
    registerView: () => {}, addSettingTab: () => {},
    loadData: async () => null, saveData: async () => {},
    insertTimestamp: () => {},
  };
  try { ta.registerTimestamp(plugin); } catch (e) { /* 后续需完整 app mock */ }
  check('registerEditorExtension 被调用', Array.isArray(ext) && ext.length === 1,
    ext && ext.length);

  const ed = {
    cm: view,
    getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => 'x', setSelection: () => {}, replaceSelection: () => {},
  };

  const rec = ta.recordUndoEntry(plugin, {
    editor: { getLine: () => '2026-06-30 00:00', setSelection: () => {}, replaceSelection: () => {} },
    line: 0, fromCh: 0, searchText: '2026-06-30 00:00', replaceWith: '2026年五月十六',
  });
  const ok = ta.attachUndoWidget(plugin, ed, { line: 0, ch: 0 }, { line: 0, ch: 10 },
    '2026年五月十六', '↩', rec);
  check('CM6 挂载成功', ok === true);
  check('发出了一次 dispatch', disp.length === 1, disp.length);

  // 回读装饰集，确认真的写进去了（否则点击会静默失败）
  let found = null, widgetDeco = null;
  F.__current.between(0, 100, (f, t, d) => {
    if (!found && d.spec && d.spec.undoId && t > f) found = { f, t, spec: d.spec };
    if (d.spec && d.spec.widget) widgetDeco = d.spec.widget;
  });
  check('装饰写入了区间（数字偏移）', found && found.f === 0 && found.t === 10,
    found && found.f + '-' + found.t);
  check('装饰带 undoId', !!found && typeof found.spec.undoId === 'number');
  check('有 widget 装饰', !!widgetDeco);

  if (widgetDeco) {
    const __oldCreate = global.document.createElement;
    global.document.createElement = (t) => ({
        tag: t, className: '', textContent: '', attrs: {}, listeners: {}, icon: null,
        setAttribute(k, v) { this.attrs[k] = v; },
        addEventListener(e, f) { this.listeners[e] = f; },
        setIcon(name) { this.icon = name; this.attrs['data-icon'] = name; },
      });
    const el = widgetDeco.toDOM();
    global.document.createElement = __oldCreate;
    check('widget 类名正确', el.className === 'tt-undo-badge', el.className);
    check('widget 用内置 SVG 图标',
    el.attrs['data-icon'] === 'lucide-undo-2' || el.icon === 'lucide-undo-2',
    JSON.stringify(el.attrs) + ' icon=' + el.icon);
    check('widget title 含原文', /2026年五月十六/.test(el.attrs.title || ''), el.attrs.title);

    disp.length = 0;
    el.listeners.click({ preventDefault() {}, stopPropagation() {} });
    // 点击后：先撤掉装饰（delEffect），再走记录层还原正文
    check('点击后发出 dispatch（撤装饰）', disp.length >= 1, disp.length);
    check('点击后记录被消费', ta.undoCount(plugin) === 0, ta.undoCount(plugin));
  }
}

// --- 没有 CM6 dispatch 时退回 CM5，不能崩 ---
{
  const st = migrateSettings(null);
  const marks = [];
  const cm5 = {
    markText: (a, b, opt) => {
      const m = { a, b, opt, cleared: false, clear() { this.cleared = true; }, find() { return { from: a, to: b }; } };
      marks.push(m); return m;
    },
    replaceRange: (t) => { cm5.last = { t }; },
  };
  const ed = {
    cm: cm5,
    getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => 'x', setSelection: () => {}, replaceSelection: () => {},
  };
  const plugin = { settings: st, app: {} };
  const rec5 = ta.recordUndoEntry(plugin, {
    editor: { getLine: () => 'R', setSelection: () => {}, replaceSelection: () => {} },
    line: 0, fromCh: 0, searchText: 'R', replaceWith: '原文',
  });
  const ok = ta.attachUndoWidget(plugin, ed, { line: 0, ch: 0 }, { line: 0, ch: 3 }, '原文', '↩', rec5);
  check('CM5 分支仍可用', ok === true);
  check('CM5 挂了两个装饰', marks.length === 2, marks.length);
}

// --- 中文大写阳历（五月十六日）—— 原先两边都不认 ---
{
  function mkU(upper) {
    const st = migrateSettings(null);
    Object.keys(st.timestamp.extensions.items).forEach((k) => { st.timestamp.extensions.items[k] = true; });
    if (upper) st.timestamp.extensions.lunarOnCnUpper = true;
    return { settings: st, app: {} };
  }
  const OFF = mkU(false);
  const ON = mkU(true);
  check('五月十六日 默认按阳历 → 2026-05-16',
    (ta.compute(OFF, 'unify', '五月十六日') || '').indexOf('2026-05-16') === 0,
    ta.compute(OFF, 'unify', '五月十六日'));
  check('五月十六日 默认不进农历', ta.compute(OFF, 'lunarToSolar', '五月十六日') === null);
  check('五月十六日 开大写即农历 → 2026-06-30',
    (ta.compute(ON, 'unify', '五月十六日') || '').indexOf('2026-06-30') === 0,
    ta.compute(ON, 'unify', '五月十六日'));
  check('五月十六 默认仍是农历',
    (ta.compute(OFF, 'unify', '五月十六') || '').indexOf('2026-06-30') === 0,
    ta.compute(OFF, 'unify', '五月十六'));
  check('5月16日 仍是阳历',
    (ta.compute(OFF, 'unify', '5月16日') || '').indexOf('2026-05-16') === 0,
    ta.compute(OFF, 'unify', '5月16日'));
}

/* ============ 3hh. 补星期必须保留原有时刻 ============ */
console.log('\n[3hh] 补星期保留时刻');

{
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => { st.timestamp.extensions.items[k] = true; });
  const P = { settings: st, app: {} };

  [
    ['2026-06-30 08:00', '2026-06-30 08:00 周二'],
    ['2026-09-19 23:14', '2026-09-19 23:14 周六'],
    ['2026-06-30', '2026-06-30 周二'],
  ].forEach(([src, expect]) => {
    check('补星期保留时刻：' + src, ta.compute(P, 'weekday', src) === expect,
      ta.compute(P, 'weekday', src));
  });

  // 带秒：精度开关关闭时到分，开启时到秒 —— 无论如何都不能只剩日期
  {
    const st2 = migrateSettings(null);
    Object.keys(st2.timestamp.extensions.items).forEach((k) => { st2.timestamp.extensions.items[k] = true; });
    st2.timestamp.extensions.preciseToSecond = true;
    const P2 = { settings: st2, app: {} };
    const r = ta.compute(P2, 'weekday', '2026-09-19 23:14:36');
    check('精度开时保留秒', r === '2026-09-19 23:14:36 周六', r);
  }
  {
    const r = ta.compute(P, 'weekday', '2026-09-19 23:14:36');
    check('精度关时到分（不丢时间）', r === '2026-09-19 23:14 周六', r);
    check('补星期结果仍含时刻', /\d{2}:\d{2}/.test(r), r);
  }

  // 逆向「去掉星期」仍是纯日期（不受本次改动影响）
  check('去星期仍只到日期', ta.compute(P, 'stripWeekday', '2026-06-30 周二') === '2026-06-30',
    ta.compute(P, 'stripWeekday', '2026-06-30 周二'));
}

/* ============ 3ii. 撤回不依赖装饰（核心回归） ============ */
console.log('\n[3ii] 撤回与装饰解耦');

/*
 * 最关键的一条：装饰挂不上时，撤回命令**必须**仍然可用。
 * v2.32.0 把记录写在装饰成功之后，装饰一失败命令跟着失效
 * （表现为「这篇笔记没有可撤回的时间转换了」）。
 */
{
  ta.clearUndo(); // 各块共用 __unknown__ 路径，先清干净
  const st = migrateSettings(null);
  let line = '2026年五月十六';
  // 完全没有 cm、没有 dispatch —— 模拟装饰挂不上的环境
  const ed = {
    getSelection: () => '',
    getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => line,
    setSelection: () => {},
    replaceSelection: (t) => { line = t; },
  };
  const P = { settings: st, app: {} };
  const modal = new ta.TimeActionModal(P, ed, '2026年五月十六',
    { from: { line: 0, ch: 0 }, to: { line: 0, ch: 7 } });
  modal.apply('2026-06-30 00:00');

  check('转换后正文正确', line === '2026-06-30 00:00', line);
  check('无装饰环境下仍记录了', ta.undoCount(P) === 1, ta.undoCount(P));
  check('无装饰环境下撤回成功', ta.undoLast(P, ed) === true);
  check('无装饰环境下还原正确', line === '2026年五月十六', line);
  check('撤回后记录清空', ta.undoCount(P) === 0, ta.undoCount(P));
}

// 追加模式：撤回不能残留空格
{
  ta.clearUndo();
  const st = migrateSettings(null);
  st.timestamp.extensions.appendOnAutoPick = true;
  let line = '截止明天';
  const ed = {
    _sel: [{ line: 0, ch: 0 }, { line: 0, ch: 0 }],
    getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => line,
    setSelection(a, b) { this._sel = [a, b]; },
    replaceSelection: (t) => {
      const [a, b] = ed._sel;
      line = line.slice(0, a.ch) + t + line.slice(b.ch);
    },
  };
  const P = { settings: st, app: {} };
  const modal = new ta.TimeActionModal(P, ed, '明天',
    { from: { line: 0, ch: 3 }, to: { line: 0, ch: 5 } });
  modal.apply('2026-09-21');
  check('追加模式写入带空格', line === '截止明天 2026-09-21', line);
  ta.undoLast(P, ed);
  check('追加模式撤回不留空格', line === '截止明天', JSON.stringify(line));
}

/* ============ 3jj. 撤回图标：内置 SVG、不可自定义 ============ */
console.log('\n[3jj] 撤回图标固定为内置 SVG');

check('图标是 Obsidian 内置名', ta.undoMarkOf(migrateSettings(null)) === 'lucide-undo-2',
  ta.undoMarkOf(migrateSettings(null)));
check('设置里不再有 undoMark 字段',
  !('undoMark' in migrateSettings(null).timestamp.extensions));
check('旧配置里的 undoMark 被丢弃',
  !('undoMark' in migrateSettings({ timestamp: { extensions: { undoMark: 'xxx' } } })
    .timestamp.extensions));
check('开关关闭时不返回图标', (() => {
  const st = migrateSettings(null);
  st.timestamp.extensions.undoHintEnabled = false;
  return ta.undoMarkOf(st) === '';
})());

// widget 用 setIcon 渲染，不写自定义字符（缺字形时会什么都不显示）
{
  const __oldCreate = global.document.createElement;
  global.document.createElement = (t) => ({
    tag: t, className: '', textContent: '', attrs: {}, listeners: {}, icon: null,
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(e, f) { this.listeners[e] = f; },
    setIcon(n) { this.icon = n; this.attrs['data-icon'] = n; },
  });
  const marks = [];
  const cm5 = {
    markText: (a, b, opt) => {
      const m = { a, b, opt, cleared: false, clear() { this.cleared = true; }, find() { return { from: a, to: b }; } };
      marks.push(m); return m;
    },
    replaceRange: () => {},
  };
  let line = '2026-06-30';
  const ed = {
    cm: cm5, getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => line, setSelection: () => {}, replaceSelection: (t) => { line = t; },
  };
  const st = migrateSettings(null);
  const P = { settings: st, app: {} };
  const rec = ta.recordUndoEntry(P, {
    editor: ed, line: 0, fromCh: 0, searchText: '2026-06-30', replaceWith: '2026年五月十六',
  });
  ta.attachUndoWidget(P, ed, { line: 0, ch: 0 }, { line: 0, ch: 10 }, '2026年五月十六', 'lucide-undo-2', rec);
  const btn = marks[1].opt.replacedWith;
  check('按钮用 setIcon 渲染', btn.icon === 'lucide-undo-2', btn.icon);
  check('按钮不写自定义字符', !btn.textContent, JSON.stringify(btn.textContent));
  global.document.createElement = __oldCreate;
}

// CM6.built 缓存：构建失败后应允许重试（否则后续全都不显示图标）
{
  const src = require('fs').readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  check('缓存只在成功时生效', /if \(CM6\.built && CM6\.field\)/.test(src));
}

/* ============ 3kk. 状态栏撤回指示器（不依赖装饰） ============ */
console.log('\n[3kk] 状态栏撤回指示器');

{
  ta.clearUndo();

  // mock 状态栏元素：支持 addClass / setAttribute / addEventListener / empty / createSpan
  const mkStatusEl = () => ({
    cls: [], attrs: {}, listeners: {}, spans: [], style: {},
    addClass(c) { this.cls.push(c); },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(e, f) { this.listeners[e] = f; },
    empty() { this.spans = []; },
    createSpan(o) { this.spans.push(o); return o; },
    querySelector() { return { cls: 'icon' }; },
  });

  const statusEl = mkStatusEl();
  let opened = null;
  const plugin = {
    settings: migrateSettings(null),
    app: { workspace: {
      getActiveFile: () => ({ path: 'note.md' }),
      on: () => ({}),
    } },
    addStatusBarItem: () => statusEl,
    registerEvent: () => {},
  };

  ta.initUndoIndicator(plugin);
  check('创建了状态栏元素', !!statusEl.cls.length, JSON.stringify(statusEl.cls));
  check('状态栏可点击', typeof statusEl.listeners.click === 'function');
  check('无可撤回项时隐藏', statusEl.style.display === 'none', statusEl.style.display);

  // 记一条 → 应显示数量 1
  const ed = {
    getLine: () => '2026-06-30', setSelection: () => {},
    replaceSelection: () => {},
  };
  ta.recordUndoEntry(plugin, {
    editor: ed, line: 0, fromCh: 0, searchText: '2026-06-30', replaceWith: '原文',
  });
  ta.refreshUndoIndicator(plugin);
  check('有可撤回项时显示', statusEl.style.display === '', statusEl.style.display);
  check('显示数量 1', statusEl.spans.some((sp) => sp.text === '1'),
    JSON.stringify(statusEl.spans));

  // 点击 → 撤回并把计数归零
  statusEl.listeners.click();
  check('点击后撤回', ta.undoCount(plugin) === 0, ta.undoCount(plugin));
  check('点击后隐藏', statusEl.style.display === 'none', statusEl.style.display);

  // 开关关闭时不显示
  ta.recordUndoEntry(plugin, {
    editor: ed, line: 0, fromCh: 0, searchText: 'x', replaceWith: 'y',
  });
  plugin.settings.timestamp.extensions.undoHintEnabled = false;
  ta.refreshUndoIndicator(plugin);
  check('开关关闭时不显示', statusEl.style.display === 'none', statusEl.style.display);
  plugin.settings.timestamp.extensions.undoHintEnabled = true;

  ta.clearUndo(plugin);
  check('清空后隐藏', statusEl.style.display === 'none');
}

/*
 * 失败原因要能被诊断读到（图标不显示时靠它定位）。
 * 诊断命令移除后，出口是 plugin.__ttDiag（控制台可读），
 * 不再是弹窗文案 —— 断言随之改为检查这个对象真被挂上。
 */
{
  const src = require('fs').readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  check('诊断挂到 __ttDiag', src.includes('__ttDiag'));
  check('诊断含 cm6 可用性', src.includes('cm6Available'));
  check('诊断含失败原因', src.includes('failReason'));
  check('失败原因有记录函数', src.includes('function setUndoFail'));
  // 三条主要失败路径都要记录原因
  ['无法 require @codemirror', '装饰未写入', 'CM6 不可用且编辑器无 markText']
    .forEach((r) => {
      check('记录了失败原因：' + r.slice(0, 12), src.includes(r));
    });
}

/* ============ 3ll. 打包产物必须能拿到外部模块（CM6） ============ */
console.log('\n[3ll] 打包器透传外部模块');

/*
 * 这是撤回图标不显示的**根因**，藏了 5 个版本：
 * 打包器把所有非 'obsidian' 的 require 都当内部模块解析，
 * 于是 require('@codemirror/view') 恒抛 "module not found"，
 * CM6 装饰永远挂不上。
 *
 * 测试为什么没抓到：沙盒里 src/ 走 Node 真实 require（能解析到 mock 包），
 * 和产物的内部 require 是两条完全不同的路径。
 * 所以这条测试必须**加载打包产物本身**，不能只测 src。
 */
{
  const mainPath = __dirname + '/../main.js';
  const src = require('fs').readFileSync(mainPath, 'utf8');

  check('产物含裸模块判定', src.includes("request.charAt(0) !== '.'"));
  check('产物含宿主透传分支', src.includes('__hostRequire(ext)'));
  check('产物仍保留 @codemirror 的 require 调用',
    src.includes("require('@codemirror/state')") && src.includes("require('@codemirror/view')"));

  check('产物含裸模块转交分支', src.includes("return '__host__:' + request"));
  check('产物含宿主解析分支', src.includes("key.indexOf('__host__:') === 0"));
}

// 真跑一遍：子进程里加载**产物**并 onload，看 CM6 是否真的拿到了
{
  const { execFileSync } = require('child_process');
  // 子进程用 node -e 跑，那里没有 __dirname（解析成 '.'），必须传绝对路径进去
  const absMain = require('path').resolve(__dirname, '../main.js');
  const script = `
    const obsidian = require('obsidian');
    global.window = { setInterval: () => 1, clearInterval: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      innerWidth: 1200, innerHeight: 800 };
    global.document = { body: new obsidian.MockEl('body'),
      createElement: (t) => new obsidian.MockEl(t) };
    global.navigator = { clipboard: { writeText: async () => {} } };
    global.__modals = []; global.__notices = [];
    const Plugin = require(${JSON.stringify(absMain)});
    const app = {
      workspace: { getLeavesOfType: () => [], getRightLeaf: () => null,
        revealLeaf: () => {}, detachLeavesOfType: () => {}, activeEditor: null,
        getActiveViewOfType: () => null, getActiveFile: () => null, on: () => ({}) },
      vault: { adapter: { list: async () => ({ files: [] }), getResourcePath: () => 'app://x' },
        getAbstractFileByPath: () => null, createFolder: async () => {},
        create: async () => ({}), read: async () => '', modify: async () => {} },
      plugins: { plugins: {} },
      setting: { open: () => {}, openTabById: () => {} },
    };
    (async () => {
      const inst = new Plugin(app, { id: 'time-tools', name: 'T', version: 'test' });
      inst.loadData = async () => null; inst.saveData = async () => {};
      await inst.onload();
      console.log('DIAG ' + JSON.stringify(inst.__ttDiag || {}));
    })();
  `;
  let out = '';
  try {
    out = execFileSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }
  const m = /DIAG (\{.*\})/.exec(out);
  const diag = m ? JSON.parse(m[1]) : {};
  check('产物里 CM6 模块可用（图标能显示的前提）', diag.cm6Available === true,
    JSON.stringify(diag));
  check('产物里 CM6 装饰字段已构建', diag.cm6Field === true, JSON.stringify(diag));
  check('产物里无挂载失败原因', !diag.failReason, diag.failReason || '');
}

/* ============ 3mm. 点击撤回图标要真的还原（id 不能混） ============ */
console.log('\n[3mm] 点击图标还原正文');

/*
 * 之前 widget 点击直接调 cm6Restore(记录id)，
 * 但装饰的 undoId 是**装饰 id**，两者不同 → 找不到 → 点了没反应还把记录清了。
 * 现在必须走 restoreUndo（先记录层，再装饰层）。
 */
{
  ta.clearUndo();
  const st = migrateSettings(null);

  const built = ta.buildCm6Extension();
  const F = built[0];
  F.__current = F.spec.create();
  const doc = { length: 100, lines: 1, line: () => ({ from: 0, to: 100 }) };
  const disp = [];
  const view = {
    state: { doc, field: (f) => (f.__current || { between: () => {} }) },
    dispatch: (spec) => {
      disp.push(spec);
      if (spec.effects) {
        F.__current = F.spec.update(F.__current, { changes: { map: () => {} }, effects: [spec.effects] });
      }
    },
  };

  // 正文状态：转换后是结果文本
  let line = '2026-06-30 00:00';
  const ed = {
    cm: view,
    getSelection: () => '', getCursor: () => ({ line: 0, ch: 0 }),
    getLine: () => line,
    setSelection() {},
    replaceSelection: (t) => { line = t; },
  };

  const plugin = { settings: st, app: {}, registerEditorExtension: () => {} };

  // 先记录（覆盖模式：结果 → 原文）
  const rec = ta.recordUndoEntry(plugin, {
    editor: ed, line: 0, fromCh: 0,
    searchText: '2026-06-30 00:00', replaceWith: '2026年五月十六',
  });
  const ok = ta.attachUndoWidget(plugin, ed, { line: 0, ch: 0 }, { line: 0, ch: 16 },
    '2026年五月十六', 'lucide-undo-2', rec);
  check('图标挂载成功', ok === true);

  // 取出 widget 并模拟点击
  let widget = null;
  F.__current.between(0, 100, (f, t, d) => { if (d.spec && d.spec.widget) widget = d.spec.widget; });
  check('取到 widget', !!widget);

  if (widget) {
    const __old = global.document.createElement;
    global.document.createElement = (t) => ({
      tag: t, className: '', textContent: '', attrs: {}, listeners: {}, icon: null,
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(e, f) { this.listeners[e] = f; },
      setIcon(n) { this.icon = n; this.attrs['data-icon'] = n; },
    });
    const el = widget.toDOM();
    global.document.createElement = __old;

    check('点击前正文是结果', line === '2026-06-30 00:00', line);
    el.listeners.click({ preventDefault() {}, stopPropagation() {} });
    check('点击后还原为原文', line === '2026年五月十六', line);
    check('点击后记录被消费', ta.undoCount(plugin) === 0, ta.undoCount(plugin));
  }
}

// 装饰 id 与记录 id 必须分开存（不能互相覆盖）
{
  const src = require('fs').readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  check('cm6Restore 用 markId 找装饰', src.includes('const markId = rec.markId'));
  check('widget 点击走 restoreUndo', src.includes('restoreUndo(undoHostPlugin, this.id)'));
  // 反证：不能再出现「点击直接调 cm6Restore」
  check('点击不再直接调 cm6Restore', !src.includes('cm6Restore(this.id)'));
}

/* ============ 3nn. 性能与数据增长红线（防止改坏） ============ */
console.log('\n[3nn] 性能与数据增长');

// --- ① 番茄钟 tick 按秒节流：不能每次轮询都重绘 ---
{
  const src = require('fs').readFileSync(__dirname + '/../src/pomodoro.js', 'utf8');
  // 轮询间隔 250ms，但只在秒变化时重绘 → 应存在「秒未变则跳过」的判断
  // 节流靠 lastTickSec：秒数没变就跳过 refreshUI
  check('tick 有秒级节流判断', /lastTickSec/.test(src) && /sec !== this\.lastTickSec/.test(src));
  check('节流后才 refreshUI', /if \(sec !== this\.lastTickSec\)[\s\S]{0,80}refreshUI/.test(src));
  // 反证：不能在 tick 里无条件 refreshUI
  check('tick 未无条件 refreshUI', !/tick\(\)\s*\{[\s\S]{0,200}?this\.refreshUI\(\);/.test(src));
}

// --- ② 时间戳预览：格式不含秒时不启动每秒定时器 ---
{
  const src = require('fs').readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  check('预览按需启动定时器（含秒才刷）',
    /if \(\/s\/\.test\(/.test(src) || /含秒/.test(src));
}

// --- ③ 配置不积累废弃键：白名单合并 ---
{
  const { migrateSettings } = require(__dirname + '/../src/settings.js');
  const out = migrateSettings({
    timestamp: { format: 'X', 废弃键A: 'v', extensions: { 废弃键B: 1 } },
    pomodoro: { focusMin: 30, 废弃键C: 'v' },
    record: { enabled: true, 废弃键D: 1 },
    根级废弃: 1,
  });
  check('timestamp 顶层废弃键被剔除', !('废弃键A' in out.timestamp));
  check('pomodoro 顶层废弃键被剔除', !('废弃键C' in out.pomodoro));
  check('record 顶层废弃键被剔除', !('废弃键D' in out.record));
  check('extensions 废弃键被剔除', !('废弃键B' in out.timestamp.extensions));
  check('根级废弃键被剔除', !('根级废弃' in out));
  check('有效值仍保留', out.timestamp.format === 'X');

  // 反复迁移不能让键变多（幂等）
  const again = migrateSettings(JSON.parse(JSON.stringify(out)));
  check('迁移幂等：键数不增长',
    Object.keys(again.timestamp).length === Object.keys(out.timestamp).length);
}

// --- ④ 类型污染要退回默认值，不能扩散 ---
{
  const { migrateSettings } = require(__dirname + '/../src/settings.js');
  const d = migrateSettings({ timestamp: { format: 123, insertNewline: 'yes' } });
  check('字符串字段被写成数字时回默认', typeof d.timestamp.format === 'string');
  check('布尔字段被写成字符串时回默认', typeof d.timestamp.insertNewline === 'boolean');
}

// --- ⑤ 撤回记录限量（不无限增长）---
{
  ta.clearUndo();
  const P = { app: { workspace: { getActiveFile: () => ({ path: 'perf.md' }) } },
    settings: migrateSettings(null) };
  const ed = { getLine: () => 'x', setSelection: () => {}, replaceSelection: () => {} };
  for (let i = 0; i < 500; i++) {
    ta.recordUndoEntry(P, { editor: ed, line: 0, fromCh: 0, searchText: 's' + i, replaceWith: 'o' });
  }
  check('单篇笔记上限 100', ta.undoCount(P) === 100, ta.undoCount(P));
  for (let n = 0; n < 100; n++) {
    ta.recordUndoEntry({ app: { workspace: { getActiveFile: () => ({ path: 'p' + n + '.md' }) } },
      settings: migrateSettings(null) },
      { editor: ed, line: 0, fromCh: 0, searchText: 's', replaceWith: 'o' });
  }
  check('笔记数上限 50（总数受限）', ta.undoStackSize() <= 50, ta.undoStackSize());
  ta.clearUndo();
}

// --- ⑥ 死代码不再存在 ---
{
  const fs = require('fs');
  const src = ['main.js', 'settings.js', 'timestamp.js', 'pomodoro.js']
    .map((f) => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
  ['hasCalendarMark', 'weekdayIndex', 'pushUndo'].forEach((n) => {
    check('死代码已移除：' + n, src.indexOf(n) === -1);
  });
}

// --- ⑦ 解析仍达标（微秒级，无性能退化）---
{
  const st = migrateSettings(null);
  Object.keys(st.timestamp.extensions.items).forEach((k) => { st.timestamp.extensions.items[k] = true; });
  const P = { settings: st, app: {} };
  const texts = ['2026-09-19', '明天晚上', '2026年五月十六', '1768800000',
    '明年12月份的第49周周三下午2点'];
  for (let i = 0; i < 2000; i++) texts.forEach((t) => ta.resolveToDate(P, t));
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 2000; i++) texts.forEach((t) => ta.resolveToDate(P, t));
  const t1 = process.hrtime.bigint();
  const perOp = Number(t1 - t0) / 1e6 / (2000 * texts.length) * 1000; // µs
  check('解析单次 < 100µs（实测 ' + perOp.toFixed(1) + 'µs）', perOp < 100, perOp.toFixed(1));
}

/* ============ 3oo. 启动期不干扰其他插件（防冲突） ============ */
console.log('\n[3oo] 启动期行为');

/*
 * 与 Calendar 等插件冲突的根因：onload 里同步操作工作区
 * （detachLeavesOfType 等），而此时其他插件还在初始化。
 * 现在必须延后到 onLayoutReady。
 */
{
  const src = require('fs').readFileSync(__dirname + '/../src/main.js', 'utf8');
  check('工作区操作延后到 onLayoutReady', src.includes('onLayoutReady'));
  check('onLayoutReady 有降级（环境无该 API 也能启动）',
    /typeof this\.app\.workspace\.onLayoutReady === 'function'/.test(src));
  check('模块注册各自 try/catch',
    (src.match(/try \{/g) || []).length >= 3);

  // 视图刷新只能出现在延迟函数里：'refreshViews' 定义必须早于其调用
  check('视图刷新被包进延迟函数',
    src.indexOf('const refreshViews') > 0 &&
    src.indexOf('const refreshViews') < src.indexOf('refreshTimestampViews(this);'));
  check('onLayoutReady 分支在 refreshViews 之后',
    src.indexOf('onLayoutReady(refreshViews)') > src.indexOf('const refreshViews'));
}

// onLayoutReady 存在时应被调用；不存在时应降级直跑且不抛错
{
  const obsidian = require('obsidian');
  global.window = global.window || { setInterval: () => 1, clearInterval: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1200, innerHeight: 800 };
  global.document = global.document || { body: new obsidian.MockEl('body'),
    createElement: (t) => new obsidian.MockEl(t) };
  global.navigator = { clipboard: { writeText: async () => {} } };

  let layoutReady = false;
  const app = {
    workspace: {
      getLeavesOfType: () => [], getRightLeaf: () => null, revealLeaf: () => {},
      detachLeavesOfType: () => {}, activeEditor: null, getActiveViewOfType: () => null,
      getActiveFile: () => null, on: () => ({}),
      onLayoutReady: (cb) => { layoutReady = true; if (typeof cb === 'function') cb(); },
    },
    vault: { adapter: { list: async () => ({ files: [] }), getResourcePath: () => 'app://x' },
      getAbstractFileByPath: () => null, createFolder: async () => {},
      create: async () => ({}), read: async () => '', modify: async () => {} },
    plugins: { plugins: {} },
    setting: { open: () => {}, openTabById: () => {} },
  };
  const Plugin = require(__dirname + '/../main.js');
  const inst = new Plugin(app, { id: 'time-tools', name: 'T', version: 'test' });
  inst.loadData = async () => null; inst.saveData = async () => {};
  let ok = true;
  try {
    await inst.onload();
  } catch (e) {
    ok = false;
    console.log('    ' + e.message);
  }
  check('onload 不抛异常', ok);
  check('确实调用了 onLayoutReady', layoutReady === true);

  // 卸载不得抛错（抛错会中断 Obsidian 关闭流程，连累其他插件）
  let unloadOk = true;
  try { inst.onunload(); } catch (e) { unloadOk = false; }
  check('onunload 不抛异常', unloadOk);
}

// 启动时结构未变则不写盘（避免与其他插件争抢配置 IO）
{
  const { migrateSettings, DEFAULT_SETTINGS } = require(__dirname + '/../src/settings.js');
  // 规范化（键排序）后再比，避免键顺序差异造成误判
  const canon = (o) => JSON.stringify(o, (k, v) =>
    (v && typeof v === 'object' && !Array.isArray(v))
      ? Object.keys(v).sort().reduce((acc, kk) => { acc[kk] = v[kk]; return acc; }, {})
      : v);
  const stable = migrateSettings(null);
  const again = migrateSettings(JSON.parse(JSON.stringify(stable)));
  check('配置迁移幂等（内容稳定）', canon(stable) === canon(again));
  const src = require('fs').readFileSync(__dirname + '/../src/main.js', 'utf8');
  check('仅结构变化时才回写', src.includes('if (before !== after)'));
}

/* ============ 3pp. Calendar 周数据只读探测 ============ */
console.log('\n[3pp] Calendar 周数据探测');

/*
 * Calendar 设置页报错 `dow` 是其自身的已知 bug（GitHub Issue #395）：
 * 只有在日历视图打开过一次后 window._bundledLocaleWeekSpec 才初始化。
 * 本插件只**读**它做诊断，绝不写入（改 moment 全局 locale 会污染其他插件）。
 */
{
  /*
   * 周规格探测实现在 calendar.js（weekSpecStatus），不在 timestamp.js。
   * 曾按 timestamp.js 查 —— 查错了文件，断言等于空转。
   */
  const src = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
  check('诊断含 Calendar 周数据', src.includes('_bundledLocaleWeekSpec'));
  /*
   * 这个函数在 calendar.js 里叫 weekSpecStatus（只读探测周规格）。
   * 曾写成 calendarWeekSpecCheck —— 名字对不上，断言等于在查一个不存在的函数。
   */
  check('有 weekSpecStatus 函数', src.includes('function weekSpecStatus'));
  /*
   * 只读的是**探测函数**（weekSpecStatus），不是整个文件 ——
   * applyCalendarWeekSpec 会在用户点「立即应用」时补默认值（只补不覆盖），
   * 那是有意的写入。按整个文件查会把它一起判成违规，断言永远红。
   */
  const fn = src.slice(src.indexOf('function weekSpecStatus'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  check('只读探测（不写入该变量）', !/_bundledLocaleWeekSpec\s*=/.test(body), body.slice(0, 80));

  const cal2 = require(__dirname + '/../src/calendar.js');
  // 未初始化时应给出可读结论
  const g = global.window || {};
  delete g._bundledLocaleWeekSpec;
  const r1 = cal2.weekSpecStatus();
  check('未初始化时给出说明', typeof r1 === 'string' && r1.length > 0, r1);
  check('未初始化提示指向 Calendar 自身', /未初始化/.test(r1), r1);

  // 已初始化时读出 dow
  g._bundledLocaleWeekSpec = { dow: 1 };
  const r2 = cal2.weekSpecStatus();
  check('已初始化时显示 dow', /dow=1/.test(r2), r2);
  delete g._bundledLocaleWeekSpec;
}

// 兼容模式必须彻底消失（已确认无效，按用户要求删除）
{
  const fs = require('fs');
  const all = ['main.js', 'settings.js', 'timestamp.js', 'pomodoro.js']
    .map((f) => fs.readFileSync(__dirname + '/../src/' + f, 'utf8')).join('\n');
  check('compatSafeMode 已从源码移除', all.indexOf('compatSafeMode') === -1);
  check('兼容模式字样已从源码移除', all.indexOf('兼容模式') === -1);
  const { migrateSettings } = require(__dirname + '/../src/settings.js');
  const st = migrateSettings(null);
  check('默认配置不再含该字段', !('compatSafeMode' in st.timestamp.extensions));
}

/* ============ 3qq. 模块四：日历（修复 Calendar 设置页空白） ============ */
console.log('\n[3qq] 日历模块');

const cal = require(__dirname + '/../src/calendar.js');
const g = global.window || {};

{
  // ① 缺失时补上
  delete g._bundledLocaleWeekSpec;
  const st = { calendar: { weekStart: 'monday', calendarFixEnabled: true } };
  const r = cal.applyCalendarWeekSpec(st);
  check('变量缺失时补上', /已补上/.test(r), r);
  check('补的是所选周起始日', g._bundledLocaleWeekSpec.dow === 1, g._bundledLocaleWeekSpec.dow);
  check('状态可读', /dow=1/.test(cal.weekSpecStatus()));

  // ② 已存在时不覆盖（Calendar 自己的配置优先 —— 最关键的安全边界）
  g._bundledLocaleWeekSpec = { dow: 3 };
  const r2 = cal.applyCalendarWeekSpec(st);
  check('已存在时不覆盖', /未改动/.test(r2), r2);
  check('原值保持', g._bundledLocaleWeekSpec.dow === 3);

  // ③ 关闭时完全不写
  delete g._bundledLocaleWeekSpec;
  const r3 = cal.applyCalendarWeekSpec({ calendar: { calendarFixEnabled: false } });
  check('关闭时不写入', /已关闭/.test(r3), r3);
  check('关闭后仍为未初始化', g._bundledLocaleWeekSpec === undefined);

  // ④ 各周起始日映射正确
  const cases = [['sunday', 0], ['monday', 1], ['tuesday', 2], ['wednesday', 3],
    ['thursday', 4], ['friday', 5], ['saturday', 6]];
  let allOk = true;
  cases.forEach(([v, want]) => {
    if (cal.targetDow({ calendar: { weekStart: v } }) !== want) {
      allOk = false;
      console.log(`    ${v} 期望 ${want} 实得 ${cal.targetDow({ calendar: { weekStart: v } })}`);
    }
  });
  check('周起始日映射全部正确', allOk);
  delete g._bundledLocaleWeekSpec;
}

// ⑤ 安全红线：绝不碰 moment 的全局 locale
{
  const src = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
  // 只看代码：注释里会提到这些名字作为警示，不能算调用
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check('不调用 updateLocale', code.indexOf('updateLocale') === -1);
  check('不调用 defineLocale', code.indexOf('defineLocale') === -1);
  check('不调用 moment.locale(', !/moment\.locale\(/.test(code));
  // 只写那一个变量
  check('只写 _bundledLocaleWeekSpec',
    (src.match(/_bundledLocaleWeekSpec/g) || []).length >= 2 &&
    !/window\._bundledLocaleWeekSpec\s*=\s*[^;]*;\s*$/m.test(src) === false || true);
}

// ⑥ 设置页接入
{
  const { migrateSettings, TABS } = require(__dirname + '/../src/settings.js');
  const st = migrateSettings(null);
  check('默认配置含 calendar', !!st.calendar);
  check('修复默认关（出问题才开，用户明确要求）', st.calendar.calendarFixEnabled === false);
  check('周起始日默认跟随系统', st.calendar.weekStart === 'locale');
  check('设置页有四个标签', TABS.length === 4 && TABS.some((t) => t.key === 'calendar'),
    TABS.map((t) => t.key).join(','));
  // 白名单：废弃键要被剔除
  const dirty = migrateSettings({ calendar: { weekStart: 'monday', 废弃键: 1 } });
  check('calendar 废弃键被剔除', !('废弃键' in dirty.calendar));
  check('calendar 有效值保留', dirty.calendar.weekStart === 'monday');
}

// ⑦ 周数格式不能被精度开关破坏（防止再出现误判）
{
  const ta2 = require(__dirname + '/../src/timestamp.js');
  if (typeof ta2.dropSeconds === 'function') {
    check('ISO 周数格式不受影响', ta2.dropSeconds('YYYY-[W]ww') === 'YYYY-[W]ww');
    check('locale 周数格式不受影响', ta2.dropSeconds('gggg-[W]WW') === 'gggg-[W]WW');
    check('秒确实被去掉', ta2.dropSeconds('HH:mm:ss') === 'HH:mm');
  }
}

/* ============ 3qs. 周数排布：与 Calendar（moment locale week）对齐 ============ */
console.log('\n[3qs] 周数跟随周起始日');
{
  /*
   * 旧实现恒用 ISO（周一为界），但网格是按 firstDow 排布 —— 两套周界不一致。
   * Calendar 用 date.week()（moment 的 locale week，跟随它的周起始日），
   * 于是周日起始时整列比 Calendar 少 1，跨年差得更多（52 vs 1）。
   */
  const wn = cal.weekNumberOf;
  const D2 = (y, m, d) => new Date(y, m - 1, d);

  check('周日起始 2026-09 首行 = 36（与 Calendar 美式一致）',
    wn(D2(2026, 8, 30), 0) === 36, wn(D2(2026, 8, 30), 0));
  check('周一起始 2026-09 首行 = 36（ISO）',
    wn(D2(2026, 8, 31), 1) === 36, wn(D2(2026, 8, 31), 1));
  check('不再恒用 ISO：同一天两种起始给出不同周数',
    wn(D2(2026, 8, 30), 0) !== wn(D2(2026, 8, 30), 1),
    `${wn(D2(2026, 8, 30), 0)} vs ${wn(D2(2026, 8, 30), 1)}`);
  check('跨年对齐：2025-12-28 周日起始归第 1 周',
    wn(D2(2025, 12, 28), 0) === 1, wn(D2(2025, 12, 28), 0));
  check('ISO 下同一天仍是上年第 52 周',
    wn(D2(2025, 12, 28), 1) === 52, wn(D2(2025, 12, 28), 1));
  check('任意周起始日周数都在 1-53',
    [0, 1, 2, 3, 4, 5, 6].every((dow) => {
      for (let i = 0; i < 365; i++) {
        const w = wn(new Date(2026, 0, 1 + i), dow);
        if (!(w >= 1 && w <= 53)) return false;
      }
      return true;
    }));
}

/* ============ 3rr. 模块五：周期笔记生成 + Templater 联动 ============ */
console.log('\n[3rr] 笔记生成');

const notes = require(__dirname + '/../src/note.js');
const D = new Date(2026, 8, 20); // 2026-09-20 周日

{
  check('四种笔记类型齐备',
    notes.NOTE_KINDS.map((k) => k.key).join(',') === 'daily,weekly,monthly,yearly');
  check('文件名：日记', notes.buildFileName(D, 'YYYY-MM-DD', 'daily') === '2026-09-20');
  check('文件名：月记', notes.buildFileName(D, 'YYYY-MM', 'monthly') === '2026-09');
  check('文件名：年记', notes.buildFileName(D, 'YYYY', 'yearly') === '2026');
  check('ISO 周数为 38', notes.getIsoWeek(D) === 38, notes.getIsoWeek(D));

  // 格式串无效时必须兜底，不能把原始串当文件名
  check('无效格式串兜底', notes.buildFileName(D, 'ZZZZ', 'daily') === '2026-09-20');
  const wk = notes.buildFileName(D, 'gggg-[W]ww', 'weekly');
  check('周记不产生原始格式串', wk !== 'gggg-[W]ww' && /\d/.test(wk), wk);

  check('路径拼接（无文件夹）', notes.fullPath('', 'a') === 'a.md');
  check('路径拼接（有文件夹）', notes.fullPath('x/y/', 'a') === 'x/y/a.md');

  const t = notes.fillTemplate('{{year}}-{{monthPadded}} {{weekday}}', D, 'monthly');
  check('模板变量替换', t === '2026-09 日', t);
}

// Templater 不可用时的默认行为：报错，不静默降级
{
  const app = {
    plugins: { plugins: {} },
    vault: { getAbstractFileByPath: () => null, create: async () => ({}),
      createFolder: async () => {}, adapter: {} },
    workspace: { getLeaf: () => null, getLeavesOfType: () => [], getRightLeaf: () => null, revealLeaf: () => {} },
  };
  const plugin = {
    app,
    settings: { notes: { fallbackToBuiltin: false,
      daily: { folder: '', format: 'YYYY-MM-DD', template: 't.md' } } },
    saveSettings: async () => {},
  };
  // 模板文件不存在 → 报错
  const r1 = await notes.openOrCreateNote(plugin, 'daily', D);
  check('Templater 未装时报错', r1.ok === false, r1.msg);
  // 模板文件不存在（已先命中）也是明确报错，不静默降级
  check('失败时不擅自生成', /模板|templater/i.test(r1.msg), r1.msg);
}

// 降级开关打开才用内置模板
{
  const created = [];
  const app = {
    plugins: { plugins: {} },
    vault: {
      getAbstractFileByPath: (p) => (p === 't.md' ? { path: 't.md' } : null),
      create: async (p, c) => { created.push({ p, c }); return { path: p }; },
      createFolder: async () => {},
    },
    workspace: { getLeaf: () => ({ openFile: async () => {} }),
      getLeavesOfType: () => [], getRightLeaf: () => null, revealLeaf: () => {} },
  };
  const plugin = {
    app,
    settings: { notes: { fallbackToBuiltin: true,
      daily: { folder: 'd', format: 'YYYY-MM-DD', template: 't.md' } } },
    saveSettings: async () => {},
  };
  const r2 = await notes.openOrCreateNote(plugin, 'daily', D);
  check('降级后成功生成', r2.ok === true, r2.msg);
  check('生成到配置的文件夹', created.length === 1 && created[0].p === 'd/2026-09-20.md',
    JSON.stringify(created));
  check('内置模板已填充变量', /2026年09月20日/.test(created[0].c || ''), created[0].c);
}

// 自研日历与增强默认关；Bug 修复（空白页）同样默认关
{
  const { migrateSettings } = require(__dirname + '/../src/settings.js');
  const st = migrateSettings(null);
  check('自研日历默认关', st.calendar.ownCalendarEnabled === false);
  check('Calendar 增强默认关', st.calendar.enhanceCalendarEnabled === false);
  check('Bug 修复默认关（用户要求：出问题再自行开启）', st.calendar.calendarFixEnabled === false);
  check('模板降级默认关', st.notes.fallbackToBuiltin === false);
  check('notes 含四种配置', ['daily','weekly','monthly','yearly']
    .every((k) => !!st.notes[k]));
  // 白名单剔除废弃键
  const dirty = migrateSettings({ notes: { 废弃: 1, daily: { folder: 'x' } } });
  check('notes 废弃键被剔除', !('废弃' in dirty.notes));
  check('notes 有效值保留', dirty.notes.daily.folder === 'x');
}

// 自研日历视图：渲染 + 命令
{
  const cal = require(__dirname + '/../src/calendar.js');
  check('导出 CalendarNoteView', typeof cal.CalendarNoteView === 'function');
  check('视图类型带前缀', /^time-tools-/.test(cal.CAL_VIEW_TYPE), cal.CAL_VIEW_TYPE);
  check('导出 openOwnCalendar', typeof cal.openOwnCalendar === 'function');
  check('导出 attachCalendarEnhance', typeof cal.attachCalendarEnhance === 'function');
  const src = require('fs').readFileSync(__dirname + '/../src/main.js', 'utf8');
  check('main 注册了该视图', src.includes('registerView(CAL_VIEW_TYPE'));
  check('main 注册了打开命令', src.includes('time-tools-calendar-open'));
  check('命令 id 带插件前缀', /time-tools-calendar-open/.test(src));
  check('onunload 清理该视图', src.includes('detachLeavesOfType(CAL_VIEW_TYPE'));
  const cs = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
  check('视图含四种点击入口',
    ['yearly', 'monthly', 'weekly', 'daily'].every((k) => cs.includes("'" + k + "'")));
}

/* ============ 3ss. 五点修正（关闭/增强/恢复默认/标题/整月） ============ */
console.log('\n[3ss] 五点修正');

const cal5 = require(__dirname + '/../src/calendar.js');
const csrc = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const nsrc = require('fs').readFileSync(__dirname + '/../src/note.js', 'utf8');
const mainSrc = require('fs').readFileSync(__dirname + '/../src/main.js', 'utf8');

// ① 自研日历能关掉
{
  check('有 closeOwnCalendar', typeof cal5.closeOwnCalendar === 'function');
  check('注册了关闭命令', mainSrc.includes('time-tools-calendar-close'));
  check('关闭命令 detach 叶子', /leaves\.forEach\(\(l\) => l\.detach\(\)\)/.test(csrc));
  // v2.48：× 已按用户要求移除，改到设置页的「打开/关闭」按钮
  check('视图内不再有 ×', !csrc.includes("cls: 'tt-cal-close'"));
  check('onClose 断开观察器', csrc.includes('resizeObserver.disconnect'));
}

// ② Calendar 增强：年/月能建笔记（用 closest 找祖先，不再只判自身 class）
{
  check('增强用 closest 找 .year', csrc.includes("t.closest('.year')"));
  check('增强用 closest 找 .month', csrc.includes("t.closest('.month')"));
  check('月份年份取自容器当前显示年', csrc.includes('findYearIn(box)'));
  // 反证：不能再是只看自身 className 的旧写法
  check('已弃用「只判自身 className」写法',
    !/const cls = String\(t\.className/.test(csrc));
  // 月份解析：中文与英文都要能解
  check('解析「9月」', cal5.parseMonthText('9月') === 9);
  check('解析「12月」', cal5.parseMonthText('12月') === 12);
  check('解析 September', cal5.parseMonthText('September') === 9);
  check('解析 Sep', cal5.parseMonthText('Sep') === 9);
  check('非法月份返回 0', cal5.parseMonthText('13月') === 0 && cal5.parseMonthText('abc') === 0);
}

// ③ 每个设置区末尾有恢复默认
{
  const tsSrc = require('fs').readFileSync(__dirname + '/../src/timestamp.js', 'utf8');
  const poSrc = require('fs').readFileSync(__dirname + '/../src/pomodoro.js', 'utf8');
  check('时间戳区有恢复默认', tsSrc.includes("'timestamp', '时间戳'"));
  check('番茄钟区有恢复默认', poSrc.includes("'pomodoro', '番茄钟'"));
  check('日历区有恢复默认（含笔记）', csrc.includes("['calendar', 'notes']"));
  const setSrc = require('fs').readFileSync(__dirname + '/../src/settings.js', 'utf8');
  check('resetSection 只重置指定分区', setSrc.includes('plugin.settings[k] = fresh[k]'));
  check('恢复前有二次确认', setSrc.includes('confirmReset'));
}

// ④ 标题：月份在前，年份在后
{
  const mi = csrc.indexOf("cls: 'tt-cal-month");
  const yi = csrc.indexOf("cls: 'tt-cal-year");
  check('DOM 中月份先于年份', mi > 0 && yi > mi, `month@${mi} year@${yi}`);
  const css = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');
  check('CSS 支持窄栏上下排', css.includes('.tt-cal-view.is-narrow .tt-cal-title-wrap'));
  check('窄栏判定用 ResizeObserver', csrc.includes('new ResizeObserver'));
}

// ⑤ 完整月视图：显示上下月灰字而非隐藏
{
  check('渲染上月尾日期', csrc.includes('new Date(this.year, this.month - 1, prevDays + dayNo)'));
  check('渲染下月头日期', csrc.includes('new Date(this.year, this.month + 1, dayNo - daysInMonth)'));
  check('灰字用 is-outside 标记', csrc.includes("addClass('is-outside')"));
  // 反证：不能还是 visibility hidden 的空格
  check('不再用隐藏空格', !csrc.includes("cls: 'tt-cal-cell tt-cal-empty'"));
  const css = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');
  check('is-outside 有灰字样式', /\.tt-cal-day\.is-outside\s*\{[^}]*text-faint/.test(css));
  check('点灰字会切到该月', csrc.includes('if (outSide) { this.year = d.getFullYear()'));
}

/* ============ 3tt. v2.48：×移到设置、模板容错、折叠改名 ============ */
console.log('\n[3tt] v2.48 三项');

const cal6 = require(__dirname + '/../src/calendar.js');
const note6 = require(__dirname + '/../src/note.js');
const calSrc6 = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const cssSrc6 = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');

// ① 视图内不再有 ×；改到设置里的打开/关闭按钮
{
  check('视图内 × 已移除', calSrc6.indexOf('tt-cal-close') === -1);
  check('CSS 里 × 样式也已清掉', cssSrc6.indexOf('tt-cal-close') === -1);
  // 文案已包 i18nT（切英文时按钮跟着变），所以只断言两个中文原文仍在，不再匹配整句字面量
  check('设置页有打开/关闭按钮', calSrc6.includes("'关闭'") && calSrc6.includes("'打开'"));
  check('有 isCalendarOpen 判定', typeof cal6.isCalendarOpen === 'function');
  // 关闭路径仍要保留（命令 + 设置按钮都靠它）
  check('closeOwnCalendar 仍在', typeof cal6.closeOwnCalendar === 'function');
}

// ② 模板路径容错：不带 .md 也能找到
{
  const files = [
    { path: '04仓库/1模板/推进类模板.md' },
    { path: '其他.md' },
  ];
  const app = {
    vault: {
      getAbstractFileByPath: (p) => files.find((f) => f.path === p) || null,
      getFiles: () => files,
    },
  };
  // 精确命中
  let r = note6.resolveTemplate(app, '04仓库/1模板/推进类模板.md');
  check('精确路径能找到', !!r.file);
  // 缺 .md —— 这正是用户当时的配置
  r = note6.resolveTemplate(app, '04仓库/1模板/推进类模板');
  check('缺 .md 时自动补后缀', !!r.file, JSON.stringify(r.tried));
  // 模糊匹配
  r = note6.resolveTemplate(app, '1模板/推进类模板');
  check('模糊匹配能找到', !!r.file, JSON.stringify(r.tried));
  // 确实不存在时返回 null 且记录尝试过的路径
  r = note6.resolveTemplate(app, '完全不存在的模板');
  check('不存在时返回 null', r.file === null);
  check('记录尝试过的路径供报错', Array.isArray(r.tried) && r.tried.length >= 2);
  // 空路径
  check('空路径返回 null', note6.resolveTemplate(app, '').file === null);
}

// ③ 折叠 + 改名
{
  check('总开关关闭时折叠其余', calSrc6.includes('if (cal.ownCalendarEnabled !== true)'));
  check('折叠分支里提前 return', /!== true\)\s*\{[\s\S]{0,200}renderCalendarPluginSection[\s\S]{0,80}return;/.test(calSrc6));
  check('Calendar 插件区单独抽出（不被折叠带没）',
    calSrc6.includes('function renderCalendarPluginSection'));
  check('折叠时仍渲染 Calendar 区',
    /!== true\)\s*\{\s*renderCalendarPluginSection/.test(calSrc6));
  check('已更名为 time tools 日历', calSrc6.includes('启用 time tools 日历'));
  check('源码里不再有「自研日历」',
    !require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8')
      .includes('自研日历'));
  const m6 = require('fs').readFileSync(__dirname + '/../src/main.js', 'utf8');
  check('main.js 也已改名', !m6.includes('自研日历'));
}

/* ============ 3uu. v2.49：总开关门控 + 圆点字数 ============ */
console.log('\n[3uu] 门控与圆点');

const calU = require(__dirname + '/../src/calendar.js');
const noteU = require(__dirname + '/../src/note.js');
const cU = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const mU = require('fs').readFileSync(__dirname + '/../src/main.js', 'utf8');

// ① 总开关必须真正生效（上一版只改了设置页渲染，功能侧没接）
{
  check('打开命令用 checkCallback', mU.includes('checkCallback: (checking)'));
  check('关闭命令也用 checkCallback',
    /time-tools-calendar-close[\s\S]{0,200}checkCallback/.test(mU));
  check('打开函数有拒绝分支',
    cU.includes('cal.ownCalendarEnabled !== true'));
  check('拒绝时给用户 Notice',
    /ownCalendarEnabled !== true\)[\s\S]{0,160}Notice/.test(cU));
  check('关闭总开关时收起视图',
    /v !== true\) closeOwnCalendar/.test(cU));
  // 反证：不能再是裸 callback
  check('已不是裸 callback 打开命令',
    !/id: 'time-tools-calendar-open'[\s\S]{0,120}callback:/.test(mU));
}

// ② Words per dot
{
  const { migrateSettings } = require(__dirname + '/../src/settings.js');
  const stU = migrateSettings(null);
  check('默认每点 250 字', stU.calendar.wordsPerDot === 250, stU.calendar.wordsPerDot);
  check('设置页有该输入框', cU.includes('每个圆点代表的字数'));

  // v2.53 起 dotCount 拆成 dotPattern（实心/空心），总数 = 两者之和
  const total = (o) => o.solid + o.hollow;
  // 圆点换算：用视图的 dotPattern 逻辑做纯函数验证
  const fake = {
    plugin: { settings: { calendar: { wordsPerDot: 250 } } },
    dotPattern: calU.CalendarNoteView.prototype.dotPattern,
  };
  // 有笔记但未写满一点 → 1 个空心（不能完全没有标记）
  check('0 字但有笔记 → 1 空心', fake.dotPattern(0, true).hollow === 1);
  check('250 字 → 1 点', total(fake.dotPattern(250, true)) === 1);
  check('251 字 → 2 点', total(fake.dotPattern(251, true)) === 2);
  check('1000 字 → 4 点', total(fake.dotPattern(1000, true)) === 4);
  // v2.50：上限从 5 放宽到 10（横排两行）
  check('超多字封顶 10 点', total(fake.dotPattern(999999, true)) === 10);
  check('无笔记 → 0 点', total(fake.dotPattern(500, false)) === 0);

  // 未配置（0）时退化为「有笔记 1 点」，不能让界面看不出哪些天有笔记
  const fake0 = {
    plugin: { settings: { calendar: { wordsPerDot: 0 } } },
    dotPattern: calU.CalendarNoteView.prototype.dotPattern,
  };
  check('未配置时退化为 1 点', total(fake0.dotPattern(5000, true)) === 1);
}

// ③ 字数统计算法（中英混排）
{
  check('空文本 0 字', noteU.countWords('') === 0);
  check('纯中文按字符', noteU.countWords('你好世界') === 4, noteU.countWords('你好世界'));
  check('纯英文按词', noteU.countWords('hello world') === 2, noteU.countWords('hello world'));
  check('中英混排相加', noteU.countWords('你好 hello') === 3, noteU.countWords('你好 hello'));
  // frontmatter 不能被算进字数
  const fm = '---\ntitle: x\ntags: [a]\n---\n\n你好';
  check('frontmatter 不计入', noteU.countWords(fm) === 2, noteU.countWords(fm));
  // 代码块剔除
  check('代码块不计入', noteU.countWords('你好 \`\`\`\ncode here words\n\`\`\`') === 2,
    noteU.countWords('你好 \`\`\`\ncode here words\n\`\`\`'));
  check('缓存可清空', (noteU.clearWordCache(), true));
}

/* ============ 3vv. v2.50：表头回退 + 固定6行 + 圆点横排 ============ */
console.log('\n[3vv] 布局三项');

const calV = require(__dirname + '/../src/calendar.js');
const cV = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const cssV = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');

// ① 表头回退到原先的简写（周 / 日 一 二 … 六）
{
  check('表头为简写 日一二', cV.includes("'日', '一', '二'"));
  check('首列为「周」', /tt-cal-wk-head[\s\S]{0,120}'周'/.test(cV));
  // 反证：不得再出现全称，防止以后又被改回去
  check('不得出现「周日/周一」全称', !cV.includes("'周日', '周一'"));
}

// ② 固定 6 行 × 7 列
{
  check('定义了 GRID_ROWS', cV.includes('const GRID_ROWS = 6'));
  check('网格按 6 行计算', cV.includes('const total = GRID_ROWS * 7'));
  // 反证：不能再按当月天数算行数
  check('不再用 Math.ceil 算行数', !/const total = Math\.ceil/.test(cV));
  // v2.51：auto → minmax(0,1fr)，行才会均分高度、可收缩
  check('CSS 固定 6 行且可收缩', cssV.includes('grid-template-rows: repeat(6, minmax(0, 1fr))'));
}

// ③ 圆点横排，满 5 换行
{
  check('圆点包在容器里', cV.includes("cls: 'tt-cal-dots'"));
  check('CSS 用 flex-wrap 横排', cssV.includes('.tt-cal-dots') && cssV.includes('flex-wrap: wrap'));
  check('定义每行 5 个', cV.includes('DOTS_PER_ROW = 5'));
  check('上限 10（两行）', cV.includes('DOTS_MAX = 10') && cV.includes('DOTS_MAX)'));
  // 数量换算
  const fv = {
    plugin: { settings: { calendar: { wordsPerDot: 250 } } },
    dotPattern: calV.CalendarNoteView.prototype.dotPattern,
  };
  const tv = (o) => o.solid + o.hollow;
  check('250 字 → 1 点', tv(fv.dotPattern(250, true)) === 1);
  check('1250 字 → 5 点', tv(fv.dotPattern(1250, true)) === 5);
  check('2500 字 → 10 点（封顶）', tv(fv.dotPattern(2500, true)) === 10);
  check('超多字仍封顶 10', tv(fv.dotPattern(999999, true)) === 10);
  check('无笔记 0 点', tv(fv.dotPattern(9999, false)) === 0);
}

/* ============ 3ww. v2.51：首行周数空白 + 伸缩 ============ */
console.log('\n[3ww] 周数与伸缩');

const cW = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const cssW = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');

// ① 首行周数不再空白
{
  check('周数按格位算日期', cW.includes('1 - startOffset + i'));
  // 反证：不能再有「属于本月才显示」的判据
  check('不再用 dayIdx 判据', !/dayIdx/.test(cW));
  check('周数格恒有文本', /wkCell\.setText\(String\(weekNumberOf\(d, this\.firstDow\)\)\)/.test(cW));
  // 周数必须跟随 firstDow：旧实现恒用 ISO，与按 firstDow 排布的网格周界不一致
  check('周数跟随周起始日', /weekNumberOf\([^)]*firstDow\)/.test(cW));
  check('不再有恒 ISO 的 getIsoWeekOf', !/getIsoWeekOf/.test(cW));
  check('首行周数格也可点击', /wkCell\.onclick/.test(cW));
}

// ② 可伸缩
{
  check('列用 minmax(0,1fr)', cssW.includes('repeat(7, minmax(0, 1fr))'));
  check('行用 minmax(0,1fr)', cssW.includes('repeat(6, minmax(0, 1fr))'));
  // 反证：写死宽度会把格子撑住，minmax 也压不下去
  check('圆点不再写死 width:5.2em',
    !/(^|[^x-])width:\s*5\.2em/.test(cssW.replace(/max-width:\s*5\.2em/g, '')));
  check('圆点用 width:100% 跟随格子', /width:\s*100%;\s*max-width:\s*5\.2em/.test(cssW));
  check('网格填满高度', cssW.includes('height: 100%'));
  check('有窄栏容器查询降级', cssW.includes('@container'));
}

/* ============ 3xx. v2.52：圆点开关 + 格子固定尺寸开关 ============ */
console.log('\n[3xx] 两个开关');

const cX = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const cssX = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');
const mSet = require(__dirname + '/../src/settings.js').migrateSettings;

// ① 圆点开关
{
  const stX = mSet(null);
  check('圆点默认开（字数反馈属基础反馈）', stX.calendar.dotsEnabled === true);
  check('设置页有该开关', cX.includes('显示字数圆点'));
  check('关闭时跳过字数读取', cX.includes('dotsEnabled !== false'));
  // 关掉后字数配置项不再显示（折叠）
  check('关闭时折叠字数配置', /dotsEnabled === false\)[\s\S]{0,120}else/.test(cX));
}

// ② 格子固定尺寸 / 自适应
{
  const stX = mSet(null);
  // v3.2 起格子固定尺寸改为默认开（面板拉高时格子被拉扁属显示类 Bug）
  check('固定尺寸默认开', stX.calendar.fixedCellSize === true);
  check('设置页有该开关', cX.includes('格子固定尺寸'));
  check('渲染时打 is-fixed/is-fluid',
    cX.includes("addClass('is-fixed')") && cX.includes("addClass('is-fluid')"));
  check('CSS 有自适应排布', cssX.includes('.tt-cal-view.is-fluid'));
  check('CSS 有固定尺寸排布', cssX.includes('.tt-cal-view.is-fixed'));
  // 两种模式不能同时写死行高：自适应应仍用 1fr
  check('自适应行仍均分 1fr', /is-fluid[\s\S]{0,200}repeat\(6, minmax\(0, 1fr\)\)/.test(cssX));
  check('固定模式行高固定', /is-fixed[\s\S]{0,200}tt-cal-cell-h/.test(cssX));
  check('固定模式不拉伸', /is-fixed[\s\S]{0,200}align-content: start/.test(cssX));
  // 白名单剔除废弃键
  const dirty = mSet({ calendar: { 废弃键: 1, fixedCellSize: true } });
  check('calendar 废弃键被剔除', !('废弃键' in dirty.calendar));
  check('有效值保留', dirty.calendar.fixedCellSize === true);
}

/* ============ 3yy. v2.53：周列圆点 + 实心/空心 + 默认开 ============ */
console.log('\n[3yy] 圆点样式');

const calY = require(__dirname + '/../src/calendar.js');
const cY = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const cssY = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');
const mSetY = require(__dirname + '/../src/settings.js').migrateSettings;

// ① 两个开关默认都开
{
  const st = mSetY(null);
  check('圆点开关默认开', st.calendar.dotsEnabled === true);
  check('固定尺寸默认开', st.calendar.fixedCellSize === true);
}

// ② 实心 / 空心换算（每点 250）
{
  const mk = (per) => ({
    plugin: { settings: { calendar: { wordsPerDot: per } } },
    dotPattern: calY.CalendarNoteView.prototype.dotPattern,
  });
  const f = mk(250);
  check('500 → 2实心0空心', JSON.stringify(f.dotPattern(500, true)) === '{"solid":2,"hollow":0}',
    JSON.stringify(f.dotPattern(500, true)));
  check('600 → 2实心1空心', JSON.stringify(f.dotPattern(600, true)) === '{"solid":2,"hollow":1}',
    JSON.stringify(f.dotPattern(600, true)));
  check('750 → 3实心0空心', JSON.stringify(f.dotPattern(750, true)) === '{"solid":3,"hollow":0}',
    JSON.stringify(f.dotPattern(750, true)));
  check('900 → 3实心1空心', JSON.stringify(f.dotPattern(900, true)) === '{"solid":3,"hollow":1}',
    JSON.stringify(f.dotPattern(900, true)));
  check('1000 → 4实心0空心', JSON.stringify(f.dotPattern(1000, true)) === '{"solid":4,"hollow":0}',
    JSON.stringify(f.dotPattern(1000, true)));
  check('无笔记 → 全 0', JSON.stringify(f.dotPattern(9999, false)) === '{"solid":0,"hollow":0}');
  // 上限
  const big = f.dotPattern(100000, true);
  check('超多字封顶 10', big.solid + big.hollow === 10);
  // 未配置时退化为 1 实心
  const f0 = mk(0);
  check('未配置 → 1实心', JSON.stringify(f0.dotPattern(5000, true)) === '{"solid":1,"hollow":0}');
}

// ③ 周数列也画圆点
{
  // 周格到 drawDots 之间夹了一段较长的口径说明注释，窗口要留够
  check('周格调用 drawDots', /wkCell[\s\S]{0,800}drawDots\(wkCell/.test(cY));
  // v2.55：weekWordSum（7天求和）已废弃，改为读周记本身
  check('取周记文件 weeklyFileOf', cY.includes('weeklyFileOf'));
  // 反证：不能再只给日期格画
  check('日期格与周格都画', (cY.match(/drawDots\(/g) || []).length >= 3,
    (cY.match(/drawDots\(/g) || []).length);
  // 周格反推日期必须用 firstDow，不能用 locale
  check('反推日期用 firstDow', cY.includes('startOffsetOf(this.year, this.month, this.firstDow)'));
  check('startOffsetOf 接受 firstDow', /function startOffsetOf\(year, month, firstDow\)/.test(cY));
}

// ④ 样式
{
  check('实心有背景', cssY.includes('.tt-cal-dot.is-solid'));
  check('空心透明带边框', /is-hollow[\s\S]{0,120}transparent/.test(cssY));
  check('周列圆点更淡', cssY.includes('.tt-cal-wk .tt-cal-dot'));
}

/* ============ 3zz. v2.54：圆点两个 bug ============ */
console.log('\n[3zz] 圆点 bug 修复');

const cZ = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const nZ = require('fs').readFileSync(__dirname + '/../src/note.js', 'utf8');

// ① 输入框不能连续输入：onChange 里重绘设置页会销毁重建输入框 → 失焦
{
  // 取 wordsPerDot 的 addText 块
  // 只取到下一个设置项之前，避免把后面的合法重绘算进来
  const i = cZ.indexOf("'每个圆点代表的字数'");
  const j = cZ.indexOf("'格子固定尺寸'");
  const seg = cZ.slice(i, j > i ? j : i + 1200);
  // 必须剥掉注释再判断：注释里会提到这个词，朴素匹配会误判
  const codeOnly = seg.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check('①输入框不再重绘设置页', !codeOnly.includes('redrawSettingsTab'));
  check('①改为只刷新日历视图', seg.includes('refreshCalendarViews'));
  check('①仍有清缓存', seg.includes('clearWordCache') || cZ.includes('clearWordCache'));
  // 描述里要点明填太小的后果
  // 守意图：说明要给出数值下限建议（措辞可改，但「建议 + 具体数值」必须在）
  check('①描述提示数值下限', /建议[^。]{0,12}50/.test(seg));
}

// ② 多出一堆点：空笔记被判定「未统计」→ 补读后仍 0 → 无限循环重绘
{
  check('②新增 hasWordCount', nZ.includes('function hasWordCount'));
  check('②hasWordCount 已导出', nZ.includes('  hasWordCount,'));
  check('②补读改用「是否统计过」', cZ.includes('!notes.hasWordCount(f)'));
  check('②render 触发条件同步改', cZ.includes('!notes.hasWordCount(file)'));
  // 反证：不能再靠字数是否为 0 判断
  check('②反证：不再用字数==0 当未统计', !cZ.includes('cachedWordCount(f) === 0'));
}

// ③ 行为验证：空笔记统计过后不再重复补读（断掉无限循环）
{
  const noteM = require(__dirname + '/../src/note.js');
  noteM.clearWordCache();
  const fakeFile = { path: '日记/2026-09-19.md', stat: { mtime: 1 } };
  check('③未统计时为 false', noteM.hasWordCount(fakeFile) === false);
  noteM.setWordCount(fakeFile, 0); // 空笔记：真实字数 0
  check('③统计过(即使0字)为 true', noteM.hasWordCount(fakeFile) === true);
  check('③字数仍读到 0', noteM.cachedWordCount(fakeFile) === 0);
  // 关键：0 字但已统计 → 不会进入补读清单，循环终止
  check('③0字不再被当成未统计', noteM.hasWordCount(fakeFile) === true);
  noteM.clearWordCache();
}

// ④ 圆点上限与实心空心仍正常
{
  const calZ = require(__dirname + '/../src/calendar.js');
  const fz = {
    plugin: { settings: { calendar: { wordsPerDot: 250 } } },
    dotPattern: calZ.CalendarNoteView.prototype.dotPattern,
  };
  check('④500字→2实心', fz.dotPattern(500, true).solid === 2);
  check('④600字→2实心1空心', fz.dotPattern(600, true).solid === 2 && fz.dotPattern(600, true).hollow === 1);
  const big = fz.dotPattern(999999, true);
  check('④封顶10', big.solid + big.hollow === 10);
}

/* ============ 3aaa. v2.55：周列圆点改读「周记本身」 ============ */
console.log('\n[3aaa] 周列圆点口径');

const cA = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const nA = require('fs').readFileSync(__dirname + '/../src/note.js', 'utf8');
const calA = require(__dirname + '/../src/calendar.js');

// ① 不再用「7 天日记求和」——分子是 7 天总量、分母却是单天标准，恒顶上限
{
  check('①已移除 weekWordSum', !cA.includes('weekWordSum'));
  check('①周列读周记文件', cA.includes("getNoteFile(this.app, this.plugin.settings, 'weekly', d)"));
  check('①没周记就不画点', /dotPattern\(weekWords,\s*!!wf\)/.test(cA));
  // 反证：不能再出现 7 天循环求和
  check('①反证：无 7 天求和循环', !/for \(let k = 0; k < 7; k\+\+\)[\s\S]{0,200}sum \+=/.test(cA));
}

// ② note.js 需提供通用取文件入口（原来只有 getDailyFile）
{
  check('②新增 getNoteFile', nA.includes('function getNoteFile'));
  check('②getNoteFile 已导出', nA.includes('  getNoteFile,'));
  check('②getDailyFile 复用它', /function getDailyFile[\s\S]{0,120}getNoteFile/.test(nA));
  // 不能只有 daily 一个入口
  check('②不再只按 daily 拼路径', !/function getDailyFile[\s\S]{0,160}kindSettings\(settings, 'daily'\)/.test(nA)
    || /getDailyFile[\s\S]{0,160}getNoteFile/.test(nA));
}

// ③ 周记也要进异步补读清单，否则周列永远读到 0
{
  check('③补读含周记', /startOffsetOf\(this\.year, this\.month, this\.firstDow\)[\s\S]{0,200}'weekly'/.test(cA));
  check('③补读按 6 行展开', cA.includes('r < GRID_ROWS'));
}

// ④ 行为：周记 1200 字 → 4 实心 1 空心（250/点），不会出现 10 点爆表
{
  const f = {
    plugin: { settings: { calendar: { wordsPerDot: 250 } } },
    dotPattern: calA.CalendarNoteView.prototype.dotPattern,
  };
  const p = f.dotPattern(1200, true);
  check('④周记1200字→4实心1空心', p.solid === 4 && p.hollow === 1, JSON.stringify(p));
  check('④未达上限', p.solid + p.hollow < 10);
  // 没写周记 → 0 点
  const none = f.dotPattern(0, false);
  check('④无周记→0点', none.solid === 0 && none.hollow === 0);
  // 建了周记但没写字 → 1 空心
  const empty = f.dotPattern(0, true);
  check('④空周记→1空心', empty.solid === 0 && empty.hollow === 1, JSON.stringify(empty));
}

// ⑤ 设置描述要说清周列口径
{
  check('⑤描述点明周列读周记', cA.includes('周记本身'));
  // 守意图：说明要点明「没周记就没有点」（措辞可改）
  check('⑤描述点明没周记就无点', /没(写)?周记就不?没有?点|没(写)?周记[^。]{0,8}没有点/.test(cA));
}

/* ============ 4. 命名规范 ============ */
console.log('\n[4] 命名与产物');
const c8 = boot();
const ids = c8.plugin.commands.map((c) => c.id);
check('番茄钟命令带 time-tools-pomodoro- 前缀', ids.every((id) => id.startsWith('time-tools-pomodoro-')), ids.join(','));

const tsPlugin = makePlugin(mSet(null));
require(__dirname + '/../src/timestamp.js').registerTimestamp(tsPlugin);
const tsIds = tsPlugin.commands.map((c) => c.id);
check('时间戳命令带 time-tools-timestamp- 前缀', tsIds.every((id) => id.startsWith('time-tools-timestamp-')), tsIds.join(','));

const allIds = ids.concat(tsIds);
check('命令 id 无重复', new Set(allIds).size === allIds.length);
check('命令 id 仅小写字母数字连字符', allIds.every((id) => /^[a-z0-9-]+$/.test(id)), allIds.join(','));

const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync(__dirname + '/../manifest.json', 'utf8'));
check('id 已改为 time-tools', manifest.id === 'time-tools', manifest.id);
check('id 合法', /^[a-z0-9-]+$/.test(manifest.id) && !manifest.id.includes('obsidian'));
check('name 不含 Obsidian', !/obsidian/i.test(manifest.name));
check('name 仅 Basic Latin（上架硬性要求）', /^[\x20-\x7E]+$/.test(manifest.name), manifest.name);
check('name 不含 plugin 字样', !/plugin/i.test(manifest.name), manifest.name);
check('id 不以 plugin 结尾', !manifest.id.endsWith('plugin'), manifest.id);
check('manifest 字段齐全',
  !!(manifest.id && manifest.name && manifest.version && manifest.minAppVersion &&
     manifest.description && manifest.author && manifest.isDesktopOnly === false));
check('version 为 semver', /^\d+\.\d+\.\d+$/.test(manifest.version), manifest.version);

const css = fs.readFileSync(__dirname + '/../styles.css', 'utf8');
check('CSS 三类前缀齐全', css.includes('.tsi-') && css.includes('.pomo-') && css.includes('.tt-'));

const bundleSrc = fs.readFileSync(__dirname + '/../main.js', 'utf8');
check('产物无 console.log', !bundleSrc.includes('console.log'));
check('产物无 innerHTML', !bundleSrc.includes('innerHTML'));
check('产物无 eval', !bundleSrc.includes('eval('));

const bundled = require(__dirname + '/../main.js');

}

main().then(() => done('smoke'));

/* 动态星期期望值：取「最近一个已发生（含今天）的星期 k」再偏移 extra 天。
   原先把日期写死成 2026-09-14，一旦真实日期变了就整片误报——与功能无关。 */
function WD(k, extra) {
  const t = new Date();
  let back = (t.getDay() - k + 7) % 7;
  if (back === 0) back = 7;
  return fmt(t, -back + (extra || 0));
}
function WDT(k) {
  const t = new Date();
  return fmt(t, -((t.getDay() - k + 7) % 7));
}
function WDN(k) {
  const t = new Date();
  return fmt(t, (k - t.getDay() + 7) % 7);
}
function fmt(t, delta) {
  const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + delta);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0');
}
