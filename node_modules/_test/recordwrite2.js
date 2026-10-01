/*
 * 回归测试：内置记录「create 说已存在、但 vault 里查不到」（v3.33.0 补充修复）
 *
 * 直接加载构建产物 main.js 里真实的 Recorder.prototype.writeToNote，
 * 不在测试里重写一遍逻辑 —— 否则改了源码测试照样绿。
 *
 * 背景：用户实机上第二次内置写入仍报「记录失败: File already exists.」，
 * 但串行/并发在忠实 mock 下都全绿。唯一自洽的解释是
 *   create 判的是磁盘（adapter.exists），vault 索引靠文件监听**异步**刷新
 * → 磁盘上有、索引里没有 → create 抛已存在，而 getAbstractFileByPath 查不到。
 * 外部同步工具建的同名笔记、插件刚启动那一瞬间都会落到这种中间态。
 *
 * 覆盖：
 *   1. 磁盘有、索引无 → 写入成功，且原内容保留、新记录在最顶（绝不丢记录）
 *   2. 同上，且返回的 path 正确
 *   3. createFolder 抛「已存在」→ 不冒泡成「记录失败」
 *   4. 磁盘也没有 → 照原样抛错（不能静默吞掉，否则真故障无法诊断）
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
  if (cond) { pass += 1; console.log('  ✓ ' + name); }
  else { fail += 1; failures.push(name + (extra ? ' → ' + extra : '')); console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')); }
}

global.__notices = [];
global.__modals = [];
const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'obsidian') return 'obsidian';
  return origResolve.call(this, request, ...rest);
};
const origLoad = Module._load;
let obsidianImpl = realObsidian;
Module._load = function (request, ...rest) {
  if (request === 'obsidian') return obsidianImpl;
  return origLoad.call(this, request, ...rest);
};
const code = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');

function loadRecorder() {
  const m = { exports: {} };
  new Function('module', 'exports', 'require', code)(m, m.exports, require);
  return m.exports.__testRecorder;
}
const RC = loadRecorder();
console.log('\n内置记录写入（磁盘有/索引无）\n');
if (!RC || !RC.Recorder) { console.log('无法继续：产物没有暴露 __testRecorder.Recorder\n'); process.exit(1); }

/**
 * 索引缺失的 vault：内存索引里**故意没有**目标文件，
 * 但 adapter 层（磁盘）有 —— 这正是「create 说已存在却查不到」的中间态。
 */
function makeGhostVault(opts) {
  const o = opts || {};
  const files = new Map(o.files || []);
  const disk = new Map(o.disk || [['番茄记录.md', '## 🍅 旧记录\n']]);
  return {
    files,
    disk,
    getAbstractFileByPath(p) { return files.has(p) ? { path: p } : null; },
    getFiles() { return Array.from(files.keys()).map((p) => ({ path: p })); },
    async create(p) { throw new Error('File already exists.'); },
    async modify(f, c) { files.set(f.path, c); },
    async read(f) { return files.get(f.path) || ''; },
    async createFolder() { if (o.folderThrows) throw new Error('File already exists.'); },
    adapter: o.noAdapter ? undefined : {
      async exists(p) { return disk.has(p); },
      async read(p) { return disk.get(p) || ''; },
      async write(p, c) { disk.set(p, c); files.set(p, c); },
    },
  };
}

function makePlugin(vault, over) {
  return {
    app: { vault },
    settings: Object.assign({
      timestamp: { seconds: false },
      dataviewEnabled: false,
      dataviewFields: '',
      record: {
        enabled: true, mode: 'builtin', defaultNoteName: '番茄记录',
        folder: '', template: '## 🍅 第{{cycles}}次',
      },
    }, over || {}),
    async saveSettings() {},
  };
}
const mkData = (n) => ({
  date: '2026-10-01', time: '10:00', range: '10:00 – 10:25', cycles: n,
  focus: 25, rest: 5, focusText: '25 分钟', restText: '5 分钟',
  pauses: 0, longBreaks: 0, skippedFocus: 0, skippedBreak: 0, profile: '',
});

async function run() {
  /* ---------- 1/2. 磁盘有、索引无 ---------- */
  {
    const vault = makeGhostVault();
    const r = new RC.Recorder(makePlugin(vault));
    let ret = null; let err = null;
    try { ret = await r.writeToNote('番茄记录', mkData(1)); }
    catch (e) { err = e && e.message; }
    ok('磁盘有/索引无：不抛「File already exists.」', err === null, err);
    ok('磁盘有/索引无：返回 path 正确', ret === '番茄记录.md', String(ret));
    const body = vault.disk.get('番茄记录.md') || '';
    ok('磁盘有/索引无：新记录写进去了', body.indexOf('第1次') >= 0, JSON.stringify(body.slice(0, 60)));
    ok('磁盘有/索引无：旧内容没被覆盖', body.indexOf('旧记录') >= 0, JSON.stringify(body.slice(0, 60)));
    ok('磁盘有/索引无：新记录在最顶', body.indexOf('第1次') < body.indexOf('旧记录'),
      `新@${body.indexOf('第1次')} 旧@${body.indexOf('旧记录')}`);
  }

  /* ---------- 3. createFolder 抛「已存在」不冒泡 ---------- */
  {
    const vault = makeGhostVault({ folderThrows: true, disk: [['03记录/番茄记录.md', '旧\n']] });
    const r = new RC.Recorder(makePlugin(vault, { record: Object.assign({}, makePlugin(vault).settings.record, { folder: '03记录' }) }));
    let err = null;
    try { await r.writeToNote('番茄记录', mkData(2)); } catch (e) { err = e && e.message; }
    ok('createFolder 抛「已存在」时不冒泡成记录失败', err === null, err);
  }

  /* ---------- 4. 磁盘也没有 → 照原样抛错（不静默吞） ---------- */
  {
    const vault = makeGhostVault({ disk: [] });
    const r = new RC.Recorder(makePlugin(vault));
    let err = null;
    try { await r.writeToNote('番茄记录', mkData(3)); } catch (e) { err = e && e.message; }
    ok('磁盘也没有时照原样抛错（不静默吞）', err === 'File already exists.', String(err));
  }

  console.log('\n  通过 ' + pass + ' / 失败 ' + fail);
  if (fail) { console.log('\n失败项：\n  - ' + failures.join('\n  - ')); process.exit(1); }
}
run();
