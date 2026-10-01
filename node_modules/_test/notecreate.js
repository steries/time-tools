/*
 * 回归测试：周期笔记「内置模板」创建的兜底（v3.33.0 §3）
 *
 * 直接加载构建产物 main.js，用真实 note.js.createWithBuiltin，
 * 而不是在测试里重写一遍逻辑。
 *
 * 背景：用户实机反复报「File already exists.」。
 * 上一版修的是 recorder（会话记录-内置写入）的并发竞态 —— 那里有串行锁 + create 兜底，
 * 逻辑上已不可能再抛这个错。真凶是 note.js 的 createWithBuiltin：
 * 它是全项目唯一一处既不查存在、也没有 catch 的 vault.create，
 * 而它的函数名和提示语都带「内置」二字，报错看起来就像「内置写入」。
 * vault 缓存与实际文件不一致时（笔记用了别的命名、或刚被外部建好），
 * create 抛错就直接冒给用户，没有任何兜底。
 *
 * 覆盖：
 *   1. 文件不存在 → 正常创建
 *   2. 文件已存在（缓存不一致导致上层没查到）→ 兜底为「打开」，不抛错
 *   3. 真的是别的原因失败（缓存也查不到）→ 照原样抛出，不能静默吞掉
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
  if (cond) {
    pass += 1;
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    failures.push(name + (extra ? ' → ' + extra : ''));
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  }
}

const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

/* ---------------- 加载产物 ---------------- */

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'obsidian') return 'obsidian';
  return origResolve.call(this, request, ...rest);
};
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'obsidian') return realObsidian;
  return origLoad.call(this, request, ...rest);
};

const code = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
Module._load = origLoad;
Module._resolveFilename = origResolve;

const NOTES = mod.exports.__testNotes;

console.log('\n周期笔记内置模板创建（File already exists 兜底）\n');

if (!NOTES || typeof NOTES.createWithBuiltin !== 'function') {
  console.log('无法继续：产物没有暴露 __testNotes.createWithBuiltin\n');
  process.exit(1);
}

/* ---------------- mock vault ---------------- */

/**
 * 忠实 mock：create 在文件已存在时抛「File already exists.」（线上报错原文）。
 * getAbstractFileByPath 保持同步 —— 真实 Obsidian 就是同步的。
 */
function makeVault(createError) {
  const files = new Map();
  return {
    files,
    getAbstractFileByPath(p) {
      return files.has(p) ? { path: p } : null;
    },
    async create(p, content) {
      if (files.has(p)) throw new Error('File already exists.');
      if (createError) throw new Error(createError);
      files.set(p, content);
      return { path: p };
    },
    async createFolder() {},
  };
}

function makePlugin(vault, over) {
  return {
    app: {
      vault,
      workspace: { getLeaf: () => null },
    },
    settings: Object.assign(
      {
        timestamp: {},
        calendar: {},
        notes: { daily: { format: 'YYYY-MM-DD' } },
      },
      over || {}
    ),
    async saveSettings() {},
  };
}

async function run() {
  /* ---------- 1. 文件不存在 → 正常创建 ---------- */
  {
    const vault = makeVault(null);
    const plugin = makePlugin(vault);
    let r = null;
    let threw = null;
    try {
      r = await NOTES.createWithBuiltin(plugin, 'daily', new Date(2026, 9, 1), '日记/2026-10-01.md', '2026-10-01', '日记');
    } catch (e) {
      threw = e;
    }
    ok('文件不存在时创建成功', !threw && r && r.ok === true, threw ? threw.message : JSON.stringify(r));
    ok('创建后 vault 里确实有这个文件', vault.files.has('日记/2026-10-01.md'), [...vault.files.keys()].join('|'));
  }

  /* ---------- 2. 文件已存在（上层没查到）→ 兜底为打开，不抛错 ---------- */
  {
    const vault = makeVault(null);
    // 预先塞进去，模拟「实际文件在、但上层按配置格式没查到」
    vault.files.set('日记/2026-10-01.md', '旧内容');
    const plugin = makePlugin(vault);
    let r = null;
    let threw = null;
    try {
      r = await NOTES.createWithBuiltin(plugin, 'daily', new Date(2026, 9, 1), '日记/2026-10-01.md', '2026-10-01', '日记');
    } catch (e) {
      threw = e;
    }
    ok('文件已存在时不再抛 File already exists', !threw, threw ? threw.message : '');
    ok('文件已存在时按「打开」处理', !!r && r.ok === true, JSON.stringify(r));
    ok('已存在时提示语是打开而非生成', !!r && /打开/.test(r.msg || ''), r && r.msg);
    ok('已存在时不覆盖原内容', vault.files.get('日记/2026-10-01.md') === '旧内容', vault.files.get('日记/2026-10-01.md'));
  }

  /* ---------- 3. 真·别的错误 → 照原样抛出，不能吞 ---------- */
  {
    const vault = makeVault('Disk full');
    const plugin = makePlugin(vault);
    let threw = null;
    try {
      await NOTES.createWithBuiltin(plugin, 'daily', new Date(2026, 9, 1), '日记/2026-10-01.md', '2026-10-01', '日记');
    } catch (e) {
      threw = e;
    }
    ok('非「已存在」的错误照原样抛出', !!threw && /Disk full/.test(threw.message), threw ? threw.message : '没抛');
  }

  console.log(`\n通过 ${pass} / 失败 ${fail}`);
  if (fail) {
    console.log('\n失败项：');
    failures.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
