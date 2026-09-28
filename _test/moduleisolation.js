/*
 * 模块隔离 —— 任一模块注册失败，不得拖垮其余模块，也不得中断 onload
 *
 * 守住的是 main.js 里那四条 try/catch 的**契约**：
 * 每个 registerX(plugin) 必须各自包一层 try，不能共用一个大 try。
 * 共用的话，时间戳一崩 → 番茄钟 / 日历 / 设置页全部不注册，
 * 表现就是「插件加载了但什么都没有」，极难定位。
 *
 * 运行：node _test/moduleisolation.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else {
    failures++;
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : ''));
  }
}

console.log('\n[模块隔离] onload 注册点');

const MODULES = [
  'registerTimestamp',
  'registerPomodoro',
  'registerCalendar',
  'registerTemplaterBridge',
];

/*
 * 统一注册入口 registerModule：新增模块只写 registerModule({ name, register })，
 * 不用再抄 try/catch + console.error + Notice 这堆样板。
 * 断言它存在、只有一个 try、且被四个模块各调用一次（不共用、不遗漏）。
 */
check('存在 registerModule 统一入口', src.includes('function registerModule('));
check('registerModule 外层 try 包住 spec.register()', (() => {
  const at = src.indexOf('function registerModule(');
  if (at < 0) return false;
  const body = src.slice(at, src.indexOf('\n}', at));
  const t = body.indexOf('try {');
  const c = body.indexOf('} catch');
  return t > -1 && c > t && body.indexOf('spec.register()') > t;
})());
/* Notice 本身也可能抛（未挂载 / 移动端），必须再兜一层，否则反而中断 onload */
check('Notice 有内层 try 兜底（防二次抛错）', (() => {
  const at = src.indexOf('function registerModule(');
  const body = src.slice(at, src.indexOf('\n}', at));
  return body.split('try {').length - 1 === 2;
})());
for (const name of MODULES) {
  const at = src.indexOf(name + '(this)');
  check('onload 里调用了 ' + name, at > -1);
  if (at < 0) continue;
  /*
   * 每个注册点必须各自走一次 registerModule —— 把四个塞进同一个 register()
   * 时，第一个抛错会连坐后面三个，等于没有隔离。
   * 往前找最近的 registerModule(，且它与本调用之间不能夹着别的注册点
   * （单行 / 多行写法都要认，故按文本距离判定而非按行）。
   */
  const head = src.slice(0, at);
  const callAt = head.lastIndexOf('registerModule(');
  check(name + ' 各自调用一次 registerModule', callAt > -1);
  if (callAt > -1) {
    const between = src.slice(callAt, at);
    const others = MODULES.filter((m) => m !== name && between.includes(m + '(this)'));
    check(name + ' 的 registerModule 调用内没有别的注册点',
      others.length === 0, others.join(','));
  }
  const calls = src.split(name + '(this)').length - 1;
  check(name + ' 只注册一次（不重复注册）', calls === 1, calls);
}
/* 五个模块 → 五次 registerModule 调用，不多不少。
 * （v3.13 新增「配置备份」模块：管全部模块的设置，不属任一功能域。
 *   它正好验证了「加新模块只需一行 registerModule」这条设计目标。）
   只数「行首缩进后直接调用」的，注释里的示例写法不算。 */
const rmCalls = src.split('\n').filter((l) => /^\s*registerModule\(\{/.test(l)).length;
check('registerModule 被调用 5 次（五个模块）', rmCalls === 5, rmCalls);
/* catch 里不得再抛：抛出去就等于没有兜住，onload 会中断 */
check('registerModule 的 catch 不向外抛（兜住而非转发）', (() => {
  const at = src.indexOf('function registerModule(');
  const body = src.slice(at, src.indexOf('\n}', at));
  const catchAt = body.indexOf('} catch');
  return catchAt > -1 && !/\bthrow\b/.test(body.slice(catchAt));
})());

/* 加载顺序：timejudge / lunar 必须早于 timestamp */
const build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const order = [];
for (const line of build.split('\n')) {
  const m = /'src\/([a-z]+\.js)'/.exec(line);
  if (m) order.push(m[1]);
}
check('build.js 能解析出源文件顺序', order.length >= 10, order.join(','));
check('timejudge.js 早于 settings.js',
  order.indexOf('timejudge.js') < order.indexOf('settings.js'));
check('lunar.js 早于 timestamp.js',
  order.indexOf('lunar.js') > -1 && order.indexOf('lunar.js') < order.indexOf('timestamp.js'));
check('pomosync.js 早于 pomodoro.js',
  order.indexOf('pomosync.js') < order.indexOf('pomodoro.js'));
check('recorder.js 早于 pomodoro.js',
  order.indexOf('recorder.js') > -1 && order.indexOf('recorder.js') < order.indexOf('pomodoro.js'));


/*
 * 界面语言不得影响转换结果 —— 三态输出必须逐字节一致。
 *
 * 为什么用「三态比对」而不是「把 t() 换成抛错」：
 * timestamp.js 是 `const { t: i18nT } = require('./i18n.js')` 解构绑定，
 * 替换导出对象的 i18n.t 影响不到它内部的 i18nT —— 那样写是条恒真断言。
 * 三态比对直接从结果侧验证：谁在 compute 路径上加一句 i18nT()，
 * 英文态就返回英文，这条立刻红。
 */
console.log('\n[模块隔离] 界面语言不影响转换结果');
{
  const Module = require('module');
  const obsidian = {
    moment: () => { throw new Error('no moment'); },
    Notice: class {}, ItemView: class {}, Plugin: class {}, EditorSuggest: class {},
    PluginSettingTab: class {}, Setting: class {}, Modal: class {}, setIcon() {}, Platform: {},
  };
  const oR = Module._resolveFilename;
  const oL = Module._load;
  Module._resolveFilename = (r, ...a) => (r === 'obsidian' ? 'obsidian' : oR(r, ...a));
  Module._load = (r, ...a) => (r === 'obsidian' ? obsidian : oL(r, ...a));

  const ts = require(path.join(root, 'src/timestamp.js'));
  const settings = require(path.join(root, 'src/settings.js'));
  const { setLang, getLang } = require(path.join(root, 'src/i18n.js'));

  const s = JSON.parse(JSON.stringify(settings.DEFAULT_SETTINGS));
  s.timestamp.extensions = Object.assign({}, s.timestamp.extensions,
    { unify: true, countdown: true, lunar: true });
  const p = { settings: s };
  const base = new Date(2026, 8, 20);
  const samples = [['unify', '2026-09-19'], ['countdown', '2026-10-01'], ['lunar', '2026-09-19']];
  const run = () => samples.map((x) => String(ts.compute(p, x[0], x[1], { base }))).join('|');

  const origLang = getLang();
  setLang('zh'); const zh = run();
  setLang('en'); const en = run();
  setLang('zh-TW'); const tw = run();
  setLang(origLang);
  Module._resolveFilename = oR;
  Module._load = oL;

  check('转换结果非空（避免三态全空导致恒真）', zh.length > 0 && !/null|undefined/.test(zh), zh);
  check('转换结果不随界面语言变化（英文 vs 中文）', en === zh, en + '  ≠  ' + zh);
  check('转换结果不随界面语言变化（繁体 vs 中文）', tw === zh, tw + '  ≠  ' + zh);
}

console.log('\n' + (failures === 0 ? '全部通过 ✅' : failures + ' 项失败 ❌'));
process.exit(failures === 0 ? 0 : 1);
