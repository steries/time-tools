/*
 * 零依赖打包脚本：把 src/ 下的模块合成单个 main.js
 * 用法：node build.js
 * Obsidian 加载插件时只认 main.js 单文件，所以源码拆着写、发布时合成。
 */
const fs = require('fs');
const path = require('path');
const posix = require('path').posix;

const root = __dirname;
const files = [
  /*
   * timejudge.js 放最前：它是零依赖的判断表，
   * settings.js 与 timestamp.js 都要引用它。
   */
  /* i18n-en.js 是纯数据表（无逻辑），必须在 i18n.js 之前 —— 后者顶部 require 它 */
  'src/i18n-en.js',
  /* i18n.js 只 require obsidian 与上面这张表，放最前供后续模块取文案 */
  'src/i18n.js',
  'src/timejudge.js',
  /* lunar.js 零依赖纯计算，必须在 timestamp.js 之前（后者顶部 require 它） */
  'src/lunar.js',
  'src/pomowin.js',
  'src/settings.js',
  'src/timestamp.js',
  /* pomosync.js 要在 pomodoro.js 之前：后者顶部 require 它 */
  'src/pomosync.js',
  /* recorder.js 会话记录，pomodoro.js 顶部 require 它 */
  'src/recorder.js',
  'src/pomodoro.js',
  'src/calendar.js',
  'src/note.js',
  /* configio.js 依赖 settings.js（migrateSettings），必须在 settings.js 之后、main.js 之前 */
  'src/configio.js',
  'src/main.js',
];

const norm = (p) => p.split(path.sep).join('/').replace(/^\.\//, '');

function joinPath(dir, rel) {
  // dir 形如 'src' 或 ''；rel 形如 './settings.js'
  const base = dir ? dir + '/' : '';
  const parts = (base + rel).split('/');
  const stack = [];
  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

const header = `/*
 * 时间戳与番茄钟 — 构建产物（由 build.js 从 src/ 合成，请勿直接编辑）
 * 源码：src/ 下全部模块（顺序见 FILES），由本脚本按序合成
 */
'use strict';
(function () {
  var __hostRequire = typeof require === 'function' ? require : null;
  var __obsidian = __hostRequire ? __hostRequire('obsidian') : null;
  var __modules = {};
  var __cache = {};

  function resolve(parentKey, request) {
    if (request === 'obsidian') return '__obsidian__';
    /*
     * 裸模块名（不以 './' 开头，如 @codemirror/view）：内部没注册就交给**宿主运行时**。
     *
     * 之前所有非 obsidian 请求都当内部模块解析，结果
     * require('@codemirror/view') 恒定抛 "module not found"，
     * CM6 装饰永远挂不上、撤回图标永远不显示 ——
     * 而测试却全绿，因为沙盒里 src/ 走的是 Node 真实 require（能解析到 mock 包），
     * 两条路径完全不同。这个 bug 因此藏了 5 个版本。
     */
    if (request.charAt(0) !== '.') {
      if (!__modules[request] && !__modules[request + '.js']) return '__host__:' + request;
      return request;
    }
    var base = parentKey.indexOf('/') === -1 ? '' : parentKey.slice(0, parentKey.lastIndexOf('/'));
    var joined = (base ? base + '/' : '') + request;
    var parts = joined.split('/');
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === '' || p === '.') continue;
      if (p === '..') stack.pop();
      else stack.push(p);
    }
    var key = stack.join('/');
    if (!__modules[key] && __modules[key + '.js']) key = key + '.js';
    return key;
  }

  function load(key, parentKey) {
    if (key === '__obsidian__') return __obsidian;
    // 宿主提供的外部模块（@codemirror/* 等）：直接转交宿主 require
    if (key.indexOf('__host__:') === 0) {
      // 前缀长度必须按字符串算，不能写死 8（'__host__:' 实际是 9 个字符）
      var ext = key.slice('__host__:'.length);
      if (!__hostRequire) throw new Error('[bundle] 宿主未提供模块: ' + ext);
      return __hostRequire(ext);
    }
    if (__cache[key]) return __cache[key].exports;
    var fn = __modules[key];
    if (!fn) throw new Error('[bundle] module not found: ' + key);
    var m = { exports: {} };
    __cache[key] = m;
    var req = function (request) { return load(resolve(parentKey || key, request), key); };
    fn(m, m.exports, req);
    return m.exports;
  }

`;

const footer = `
  var __out = load('src/main.js', 'src/main.js');
  if (typeof module !== 'undefined' && module.exports) module.exports = __out;
  else if (typeof globalThis !== 'undefined') globalThis.__TimeToolsPlugin = __out;
})();
`;

let body = '';
for (const f of files) {
  const key = norm(f);
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  // 去掉各文件里对 obsidian 的 require 之外的顶层 'use strict'（统一在头部加）
  const cleaned = src.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '').replace(/^'use strict';\s*/m, '');
  body += `  __modules['${key}'] = function (module, exports, require) {\n${cleaned}\n  };\n\n`;
}

const out = header + body + footer;
fs.writeFileSync(path.join(root, 'main.js'), out, 'utf8');
console.log('built main.js:', out.length, 'bytes');

/*
 * 文档同步提醒
 *
 * ARCHITECTURE.md 描述的就是 src/ 的结构，源码一改它就可能失效。
 * 这里比较改动时间：若任一源文件比文档新，说明改了代码还没同步文档。
 * 只提醒不阻断 —— 有时改动确实不影响文档（比如只改注释）。
 */
checkArchDocSync();

function checkArchDocSync() {
  const docName = 'ARCHITECTURE.md';
  const docPath = path.join(root, docName);
  if (!fs.existsSync(docPath)) {
    console.log(`\n⚠️  缺少 ${docName}，AI 无法在无历史对话的情况下接手本项目`);
    return;
  }
  const docTime = fs.statSync(docPath).mtimeMs;
  const stale = files
    .map((f) => ({ f, t: fs.statSync(path.join(root, f)).mtimeMs }))
    .concat([{ f: 'styles.css', t: safeMtime('styles.css') }])
    .filter((x) => x.t > docTime + 1000);

  if (stale.length) {
    console.log(`\n⚠️  以下文件比 ${docName} 新，请确认文档是否需要同步：`);
    stale.forEach((x) => console.log('      - ' + x.f));
    console.log('   改完运行：node _test/arch-doc.js（校验文档与代码一致性）');
  }
}

function safeMtime(f) {
  try {
    return fs.statSync(path.join(root, f)).mtimeMs;
  } catch (e) {
    return 0;
  }
}
