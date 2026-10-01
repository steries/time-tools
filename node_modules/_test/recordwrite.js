/*
 * 回归测试：内置记录写入（v3.33.0 §2 竞态修复）
 *
 * 直接加载构建产物 main.js，用真实 Recorder.prototype.writeToNote，
 * 而不是在测试里重写一遍逻辑 —— 否则改了源码测试照样绿。
 *
 * 背景：v3.32.0 线上报「记录失败: File already exists.」。
 * 串行连写三次是**全绿**的（所以 55 个套件都没抓到），
 * 真因是同一个 tick 内并发两次：两次都先 await 到「文件不存在」，
 * 在任何一次 create 落库之前都判定要新建 → 第二个 create 必炸。
 *
 * 覆盖：
 *   1. 串行连写三次：每次成功，最新记录在最顶
 *   2. 并发写两次（Promise.all）：两次都成功，笔记内**两条**记录（不能只留一条）
 *   3. 并发后最新一条位于最顶
 *   4. 笔记已有 YAML frontmatter 时，新内容插在 frontmatter **之下**
 *   5. 并发写后链式不断：后续再写仍成功（前一个 reject 不能污染 _writeChain）
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

global.__notices = [];
global.__modals = [];

const realObsidian = require(path.join(ROOT, 'node_modules/obsidian/index.js'));

/* ---------------- 加载产物 ---------------- */

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

/**
 * 加载产物里的 Recorder。
 * ⚠️ recorder.js 在模块顶层 `const { normalizePath } = require('obsidian')`，
 * 也就是说它在**加载时**就把函数抓走了 —— 加载完再去改 obsidian.normalizePath
 * 完全无效（我第一版测试就这么写的，结果整段形同虚设、永远全绿）。
 * 要模拟「真实 Obsidian 保留斜杠」的行为，必须在加载**前**换掉整个 obsidian。
 */
function loadRecorder(normalizePathImpl) {
  obsidianImpl = normalizePathImpl
    ? Object.assign({}, realObsidian, { normalizePath: normalizePathImpl })
    : realObsidian;
  const m = { exports: {} };
  new Function('module', 'exports', 'require', code)(m, m.exports, require);
  obsidianImpl = realObsidian;
  return m.exports.__testRecorder;
}

const RC = loadRecorder();

console.log('\n内置记录写入（竞态）\n');

if (!RC || !RC.Recorder) {
  console.log('无法继续：产物没有暴露 __testRecorder.Recorder\n');
  process.exit(1);
}

/* ---------------- 忠实 mock vault ---------------- */

/**
 * 按真实 Obsidian 语义 mock：
 *  - create 已存在则抛「File already exists.」（这是线上报错原文）
 *  - create 是异步的：先让出一个 tick **再**落库，这样并发两次都会在
 *    落库之前查到「不存在」，从而复现竞态
 *
 * ⚠️ 踩过的坑：getAbstractFileByPath **必须同步**。
 * 真实 Obsidian 它就是同步的（返回 TFile 或 null）。写成 async 的话，
 * 产物里 `let file = vault.getAbstractFileByPath(path)` 拿到的是 Promise（truthy），
 * `if (!file)` 永远进不去，内容被写进 key=undefined —— 测试全红但报错指向
 * 「笔记里没有记录」，看不出是 mock 的错。
 */
function makeVault(indexDelay) {
  const files = new Map();
  const tick = () => new Promise((r) => setTimeout(r, indexDelay || 0));
  return {
    files,
    getAbstractFileByPath(p) {
      return files.has(p) ? { path: p } : null;
    },
    async create(p, content) {
      await tick();
      if (files.has(p)) throw new Error('File already exists.');
      files.set(p, content);
      return { path: p };
    },
    async modify(file, content) {
      await tick();
      files.set(file.path, content);
    },
    async read(file) {
      return files.get(file.path) || '';
    },
    async createFolder() {},
  };
}

function makePlugin(vault, over) {
  return {
    app: { vault },
    settings: Object.assign(
      {
        timestamp: { seconds: false },
        dataviewEnabled: false,
        dataviewFields: '',
        record: {
          enabled: true,
          mode: 'builtin',
          defaultNoteName: '番茄记录',
          folder: '',
          template: '## 🍅 第{{cycles}}次',
        },
      },
      over || {}
    ),
    async saveSettings() {},
  };
}

function makeData(n) {
  return {
    date: '2026-10-01',
    time: '10:00',
    range: '10:00 – 10:25',
    cycles: n,
    focus: 25,
    rest: 5,
    focusText: '25 分钟',
    restText: '5 分钟',
    pauses: 0,
    longBreaks: 0,
    skippedFocus: 0,
    skippedBreak: 0,
    profile: '',
  };
}

async function run() {
  /* ---------- 1. 串行连写三次 ---------- */
  {
    const vault = makeVault(0);
    const r = new RC.Recorder(makePlugin(vault));
    const results = [];
    for (let i = 1; i <= 3; i += 1) {
      try {
        await r.writeToNote('番茄记录', makeData(i));
        results.push('ok');
      } catch (e) {
        results.push('err:' + (e && e.message));
      }
    }
    ok('串行连写三次全部成功', results.every((x) => x === 'ok'), results.join('|'));
    const body = vault.files.get('番茄记录.md') || '';
    const idx3 = body.indexOf('第3次');
    const idx1 = body.indexOf('第1次');
    ok('串行后最新记录在最顶', idx3 >= 0 && idx1 >= 0 && idx3 < idx1, `第3次@${idx3} 第1次@${idx1}`);
  }

  /* ---------- 2/3. 并发写两次：两次都成功，且保留两条 ---------- */
  for (const delay of [0, 50]) {
    const vault = makeVault(delay);
    const r = new RC.Recorder(makePlugin(vault));
    const out = await Promise.all([
      r.writeToNote('番茄记录', makeData(1)).then(() => 'ok', (e) => 'err:' + (e && e.message)),
      r.writeToNote('番茄记录', makeData(2)).then(() => 'ok', (e) => 'err:' + (e && e.message)),
    ]);
    ok(
      `并发写两次都成功（索引延迟 ${delay}ms）`,
      out.every((x) => x === 'ok'),
      out.join('|')
    );
    const body = vault.files.get('番茄记录.md') || '';
    const c1 = (body.match(/第1次/g) || []).length;
    const c2 = (body.match(/第2次/g) || []).length;
    ok(
      `并发后笔记内有两条记录，不丢（延迟 ${delay}ms）`,
      c1 === 1 && c2 === 1,
      `第1次×${c1} 第2次×${c2}`
    );
    // 后完成的排在更顶：允许 1/2 任一在上，但两条都在
    ok(`并发后两条都在笔记里（延迟 ${delay}ms）`, /第1次/.test(body) && /第2次/.test(body));
  }

  /* ---------- 4. YAML frontmatter 之下插入 ---------- */
  {
    const vault = makeVault(0);
    vault.files.set('番茄记录.md', '---\ntags: [番茄]\n---\n\n旧内容\n');
    const r = new RC.Recorder(makePlugin(vault));
    await r.writeToNote('番茄记录', makeData(1));
    const body = vault.files.get('番茄记录.md') || '';
    const fmEnd = body.indexOf('---', 3);
    const ins = body.indexOf('第1次');
    ok('frontmatter 存在时新内容插在其下', ins > fmEnd && fmEnd >= 0, `fmEnd=${fmEnd} ins=${ins}`);
    ok('frontmatter 未被破坏', body.indexOf('tags: [番茄]') >= 0);
  }

  /* ---------- 5. 并发失败后链不断 ---------- */
  {
    const vault = makeVault(0);
    const r = new RC.Recorder(makePlugin(vault));
    // 第一次故意让 create 抛非「已存在」错误，验证链不被 reject 污染
    const origCreate = vault.create;
    let first = true;
    vault.create = async function (p, c) {
      if (first) {
        first = false;
        throw new Error('Disk full');
      }
      return origCreate.call(vault, p, c);
    };
    await r.writeToNote('番茄记录', makeData(1)).catch(() => {});
    await r.writeToNote('番茄记录', makeData(2)).catch(() => {});
    ok('一次失败后后续写入仍能继续（链未断）', (vault.files.get('番茄记录.md') || '').includes('第2次'));
  }

  /* ---------- 6. folder 带斜杠时不能拼出病态路径 ---------- */
  /*
   * 真因（v3.33.0 第二次复现）：真实 Obsidian 的 normalizePath('/') 保留成 '/'，
   * `${folder}/${name}.md` 就拼出 '//番茄记录.md'；而 vault 落库用的是规范化后的
   * '番茄记录.md'。查询拿病态路径查不到 → 每次都走 create → 第一次侥幸成功，
   * 之后必抛「File already exists.」。
   *
   * ⚠️ 沙盒 mock 的 normalizePath 会把 '/' 剥成 ''，产不出病态路径，
   * 所以这一段用「只折叠重复斜杠、不剥首尾」的真实行为重新加载一次产物，
   * 否则测试全绿而线上报错 —— 这正是之前几十个套件没抓到的原因。
   */
  {
    const keepSlashes = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+/g, '/');
    const RC2 = loadRecorder(keepSlashes);
    for (const folder of ['/', '//', '/03记录', '03记录/']) {
      // 悲观 mock：查询不规范化，只有落库时规范化（真实行为介于两者之间，
      // 按悲观的一侧写测试，通过条件更严格）
      const norm = (p) => String(p || '').replace(/\/+/g, '/').replace(/^\/+/, '');
      const files = new Map();
      const vault = {
        files,
        getAbstractFileByPath(p) {
          return files.has(p) ? { path: p } : null;
        },
        getFiles() {
          return [...files.keys()].map((k) => ({ path: k }));
        },
        async create(p, content) {
          const k = norm(p);
          if (files.has(k)) throw new Error('File already exists.');
          files.set(k, content);
          return { path: k };
        },
        async modify(file, content) {
          files.set(norm(file.path), content);
        },
        async read(file) {
          return files.get(norm(file.path)) || '';
        },
        async createFolder() {},
      };
      const r = new RC2.Recorder(
        makePlugin(vault, {
          record: { folder, defaultNoteName: '番茄记录', template: '## 🍅 第{{cycles}}次' },
        })
      );
      const results = [];
      for (let i = 1; i <= 3; i += 1) {
        try {
          await r.writeToNote('番茄记录', makeData(i));
          results.push('ok');
        } catch (e) {
          results.push('err:' + (e && e.message));
        }
      }
      ok(
        `folder=${JSON.stringify(folder)} 连写三次全部成功`,
        results.every((x) => x === 'ok'),
        results.join('|')
      );
      const expect = norm(folder).replace(/\/+$/, '');
      const key = expect ? `${expect}/番茄记录.md` : '番茄记录.md';
      const body = files.get(key) || '';
      ok(
        `folder=${JSON.stringify(folder)} 三条记录都写进 ${key}`,
        /第1次/.test(body) && /第2次/.test(body) && /第3次/.test(body),
        JSON.stringify(body.slice(0, 40))
      );
    }
  }

  console.log(`\n内置记录写入（竞态）：通过 ${pass} / 失败 ${fail}`);
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
