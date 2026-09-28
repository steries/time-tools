/*
 * QuickAdd 记录：诊断原因码、剪贴板预复制、嵌套选项读取
 * 运行：node _test/quickadd.js
 *
 * 环境（DOM/window stub、断言器）在 ./_smoke_env.js，与 smoke.js 共用一份。
 * 从 smoke.js 的 3c / 3d / 3e 三节整体迁出：这三节都只依赖 recorder 与 check，
 * 不依赖 smoke.js 里的其他局部辅助函数，可以独立成立。
 */
const { recorder, check, done } = require('./_smoke_env.js');

async function main() {

/* ============ 3c. QuickAdd 诊断 ============ */
console.log('\n[3c] QuickAdd 诊断');

function makeRecorderApp(quickadd) {
  return { plugins: { plugins: quickadd ? { quickadd } : {} } };
}

// 未安装
const r1 = new recorder.Recorder({ settings: { record: { quickAddChoice: 'X' } }, app: makeRecorderApp(null) });
const res1 = await r1.runQuickAdd({});
check('未安装时 reason=no-plugin', res1.ok === false && res1.reason === 'no-plugin', res1.reason);
check('未安装时给出可读提示', res1.message.includes('QuickAdd'), res1.message);

// 未填选项名
const r2 = new recorder.Recorder({ settings: { record: { quickAddChoice: '  ' } }, app: makeRecorderApp({ api: {} }) });
const res2 = await r2.runQuickAdd({});
check('未填名时 reason=no-name', res2.reason === 'no-name', res2.reason);

// 有插件但无 api
const r3 = new recorder.Recorder({ settings: { record: { quickAddChoice: 'X' } }, app: makeRecorderApp({}) });
const res3 = await r3.runQuickAdd({});
check('无 api 时 reason=no-api', res3.reason === 'no-api', res3.reason);

// 选项名不存在 → 列出可用选项
const qa4 = {
  api: { executeChoice: async () => {} },
  loadData: async () => ({ choices: [{ name: '每日日志' }, { name: '番茄钟写入' }] }),
};
const r4 = new recorder.Recorder({ settings: { record: { quickAddChoice: '番茄记录', strictChoiceName: true } }, app: makeRecorderApp(qa4) });
const res4 = await r4.runQuickAdd({});
check('严格模式下名称不匹配 reason=not-found', res4.reason === 'not-found', res4.reason);
check('提示里列出可用选项', res4.message.includes('每日日志') && res4.message.includes('番茄钟写入'), res4.message);

// 宽松模式（默认）：名字不在列表也照常尝试执行
let looseRan = false;
const qaLoose = {
  api: { executeChoice: async () => { looseRan = true; } },
  loadData: async () => ({ choices: [{ name: '每日日志' }] }),
};
const rLoose = new recorder.Recorder({ settings: { record: { quickAddChoice: '嵌套里的选项', strictChoiceName: false } }, app: makeRecorderApp(qaLoose) });
const resLoose = await rLoose.runQuickAdd({});
check('宽松模式下不在列表也执行', resLoose.ok === true && looseRan, resLoose.reason);

// 名称正确 → 执行成功，并带上变量
let captured = null;
const qa5 = {
  api: { executeChoice: async (n, vars) => { captured = { n, vars }; } },
  loadData: async () => ({ choices: [{ name: '番茄钟写入' }] }),
};
const r5 = new recorder.Recorder({ settings: { record: { quickAddChoice: '番茄钟写入' } }, app: makeRecorderApp(qa5) });
const res5 = await r5.runQuickAdd({
  date: '2026-09-19', time: '18:24', range: '17:34 – 18:24',
  cycles: 2, focusMin: 50, restMin: 10, pauses: 2, longBreaks: 0,
  skippedFocus: 0, skippedBreak: 0, profileName: '学习',
});
check('名称正确时执行成功', res5.ok === true, res5.message);
check('传入正确选项名', captured && captured.n === '番茄钟写入', captured && captured.n);
check('传入裸 {{VALUE}} 摘要', captured.vars.value.includes('完成 2 轮') && captured.vars.value.includes('专注 50 分钟'),
  captured.vars.value);
check('传入具名变量 cycles', captured.vars.cycles === 2);
check('传入具名变量 pauses', captured.vars.pauses === 2);
check('传入完整文本 content', typeof captured.vars.content === 'string' && captured.vars.content.includes('🍅'));

// 执行抛错 → 带出原始错误信息
const qa6 = {
  api: { executeChoice: async () => { throw new Error('Choice not found: X'); } },
  loadData: async () => ({ choices: [{ name: 'X' }] }),
};
const r6 = new recorder.Recorder({ settings: { record: { quickAddChoice: 'X' } }, app: makeRecorderApp(qa6) });
const res6 = await r6.runQuickAdd({ cycles: 0 });
check('执行出错时 reason=error', res6.reason === 'error', res6.reason);
check('错误信息透传', res6.message.includes('Choice not found'), res6.message);

// 拿不到选项列表时不误报
const qa7 = { api: { executeChoice: async () => {} }, loadData: async () => ({}), };
const r7 = new recorder.Recorder({ settings: { record: { quickAddChoice: '任意名' } }, app: makeRecorderApp(qa7) });
const res7 = await r7.runQuickAdd({});
check('列表为空时仍尝试执行', res7.ok === true, res7.reason);

/* ============ 3d. 剪贴板 ============ */
console.log('\n[3d] 剪贴板与 QuickAdd 预复制');

function makeRec(settings, app) {
  const plugin = {
    settings: { record: settings, pomodoro: { profiles: [], activeProfileId: null } },
    app: app || { plugins: { plugins: {} } },
    saveSettings: async () => {},
  };
  return new recorder.Recorder(plugin);
}

const sampleData = {
  date: '2026-09-19', time: '19:19', range: '19:19 – 19:19',
  cycles: 2, focusMin: 50, restMin: 10, pauses: 1, longBreaks: 0,
  skippedFocus: 2, skippedBreak: 2, profileName: '学习',
};

// 仅剪贴板模式
global.__clipboard = '';
const rc1 = makeRec({ enabled: true, mode: 'clipboard', template: recorder.DEFAULT_RECORD_TEMPLATE });
await rc1.record(sampleData);
check('剪贴板模式写入剪贴板', global.__clipboard.includes('\u{1F345}'), global.__clipboard.slice(0, 20));
check('剪贴板内容含轮数', global.__clipboard.includes('完成 2 轮'));
check('剪贴板内容含暂停次数', global.__clipboard.includes('暂停 1 次'));
check('剪贴板内容含跳过行', global.__clipboard.includes('跳过未计入'));

// QuickAdd 模式 + 预复制开启
let qaVars = null;
const qaStub = {
  api: { executeChoice: async (n, v) => { qaVars = v; } },
  loadData: async () => ({ choices: [{ name: '番茄钟写入' }] }),
};
global.__clipboard = '';
const rc2 = makeRec(
  { enabled: true, mode: 'quickadd', quickAddChoice: '番茄钟写入', copyBeforeQuickAdd: true,
    template: recorder.DEFAULT_RECORD_TEMPLATE },
  { plugins: { plugins: { quickadd: qaStub } } }
);
await rc2.record(sampleData);
check('QuickAdd 预复制开启时剪贴板有内容', global.__clipboard.includes('完成 2 轮'), global.__clipboard.slice(0, 20));
check('QuickAdd 仍然被执行', !!qaVars && qaVars.cycles === 2);

// QuickAdd 模式 + 预复制关闭
global.__clipboard = '';
qaVars = null;
const rc3 = makeRec(
  { enabled: true, mode: 'quickadd', quickAddChoice: '番茄钟写入', copyBeforeQuickAdd: false },
  { plugins: { plugins: { quickadd: qaStub } } }
);
await rc3.record(sampleData);
check('预复制关闭时不写剪贴板', global.__clipboard === '', global.__clipboard);
check('预复制关闭时仍执行 QuickAdd', !!qaVars);

// 内置模式不动剪贴板
global.__clipboard = '';
const vaultStub = {
  getAbstractFileByPath: () => null,
  createFolder: async () => {},
  create: async () => ({}),
  read: async () => '',
  modify: async () => {},
};
const rc4 = makeRec(
  { enabled: true, mode: 'builtin', defaultNoteName: '番茄记录', template: recorder.DEFAULT_RECORD_TEMPLATE },
  { plugins: { plugins: {} }, vault: vaultStub }
);
await rc4.record(sampleData);
check('内置模式不写剪贴板', global.__clipboard === '', global.__clipboard);

/* ============ 3e. 嵌套选项读取 ============ */
console.log('\n[3e] QuickAdd 嵌套选项读取');

// 模拟真实结构：Multi 套子选项 + Macro 里的 NestedChoice
const nestedData = {
  choices: [
    { type: 'Multi', name: '我的收集箱', choices: [
      { type: 'Capture', name: '手机版模板' },
      { type: 'Capture', name: '番茄钟写入' },
    ]},
    { type: 'Capture', name: '记录' },
    { type: 'Capture', name: '特定位置插入' },
  ],
  macros: [
    { id: 'm1', name: '宏一', commands: [
      { type: 'NestedChoice', choice: { type: 'Capture', name: '宏内捕获' } },
    ]},
  ],
};

const qaNested = {
  api: { executeChoice: async () => {} },
  loadData: async () => nestedData,
};

const rn = new recorder.Recorder({
  settings: { record: { quickAddChoice: '番茄钟写入', strictChoiceName: true } },
  app: makeRecorderApp(qaNested),
});
const resN = await rn.runQuickAdd({ cycles: 1 });
check('能找到 Multi 里的嵌套选项', resN.ok === true, resN.message);

const rn2 = new recorder.Recorder({
  settings: { record: { quickAddChoice: '宏内捕获', strictChoiceName: true } },
  app: makeRecorderApp(qaNested),
});
const resN2 = await rn2.runQuickAdd({});
check('能找到 Macro 里的 NestedChoice', resN2.ok === true, resN2.message);

const rn3 = new recorder.Recorder({
  settings: { record: { quickAddChoice: '压根不存在', strictChoiceName: true } },
  app: makeRecorderApp(qaNested),
});
const resN3 = await rn3.runQuickAdd({});
check('真不存在的仍报 not-found', resN3.reason === 'not-found', resN3.reason);
check('提示含嵌套项名字', resN3.message.includes('番茄钟写入'), resN3.message);
}

main().then(() => done('quickadd'));
