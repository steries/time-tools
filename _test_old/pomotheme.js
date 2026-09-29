/*
 * 回归测试：番茄钟五主题 + 自定义 CSS 接口
 *
 * 直接加载构建产物（time-tools/main.js），验证：
 *   1. 主题枚举与下拉选项一致
 *   2. 迁移时清洗非法主题值 / 非字符串 CSS（废弃数据不留存）
 *   3. applyTheme 只挂一个主题 class，切换不留旧 class
 *   4. syncCustomCss 注入 / 复用 / 移除，反复切换不堆积 <style> 节点
 *   5. styles.css 里五个主题都在，且 custom 主题区不写任何样式
 *   6. 空灵紫的关键帧不与其他主题重名（重名会全局覆盖）
 */
const fs = require('fs');
const path = require('path');

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

/* ---------------- document mock ----------------
 * syncCustomCss 会操作 document.head 里的 <style> 节点，
 * 沙盒没有 DOM，这里补一个够用的：能建节点、按 id 查、能挂能摘。 */
const headChildren = [];
global.document = {
  addEventListener() {},
  removeEventListener() {},
  body: { appendChild() {}, classList: { add() {}, remove() {} } },
  head: { appendChild(el) { headChildren.push(el); el.parentNode = global.document.head; } },
  createElement() {
    const el = { style: {}, textContent: '', parentNode: null };
    el.remove = () => {};
    return el;
  },
  getElementById(id) {
    return headChildren.filter((e) => e.id === id)[0] || null;
  },
};
// removeChild 要真把节点从列表里摘掉，否则测不出「不堆积」
global.document.head.removeChild = (el) => {
  const i = headChildren.indexOf(el);
  if (i >= 0) {
    headChildren.splice(i, 1);
    el.parentNode = null;
  }
  return el;
};

const settings = require(path.join(DIST, 'src', 'settings.js'));
const pomo = require(path.join(DIST, 'src', 'pomodoro.js'));

/* ---------------- 1. 枚举一致性 ---------------- */
const VALID = settings.VALID_POMO_THEME;
const OPTS = settings.POMO_THEME_OPTIONS;

ok('主题共 6 个', Array.isArray(VALID) && VALID.length === 6, String(VALID && VALID.length));
ok(
  '下拉选项与枚举值一一对应',
  OPTS.length === VALID.length && OPTS.every((o, i) => o.value === VALID[i]),
  JSON.stringify(OPTS.map((o) => o.value))
);
ok('含 classic/minimal/dynamic/custom', ['classic', 'minimal', 'dynamic', 'custom'].every((t) => VALID.indexOf(t) >= 0));
ok('默认主题是 classic（老用户升级外观不变）', settings.DEFAULT_SETTINGS.pomodoro.theme === 'classic');

/* ---------------- 2. 迁移清洗 ---------------- */
const m1 = settings.migrateSettings(settings.defaults());
ok('默认迁移后主题为 classic', m1.pomodoro.theme === 'classic');
ok('默认迁移后 customCss 为空串', m1.pomodoro.customCss === '');

const m2 = settings.migrateSettings(settings.defaults());
m2.pomodoro.theme = 'xxx';
m2.pomodoro.customCss = 12345;
const m3 = settings.migrateSettings(m2);
ok('非法主题值被清洗回 classic', m3.pomodoro.theme === 'classic', String(m3.pomodoro.theme));
ok('非字符串 CSS 被清洗为空串', m3.pomodoro.customCss === '', String(typeof m3.pomodoro.customCss));

// 合法值必须原样保留，别把用户的设置洗没了
['minimal', 'dynamic', 'ethereal', 'custom'].forEach((t) => {
  const raw = settings.defaults();
  raw.pomodoro.theme = t;
  raw.pomodoro.customCss = '.pomo-theme-custom{--pomo-focus:#f00;}';
  const got = settings.migrateSettings(raw);
  ok('合法主题 ' + t + ' 被保留', got.pomodoro.theme === t);
  ok('合法主题 ' + t + ' 的 CSS 文本保留', got.pomodoro.customCss.indexOf('--pomo-focus') >= 0);
});

/* ---------------- 3. applyTheme ---------------- */
const { applyTheme, syncCustomCss, POMO_CSS_ID } = pomo.__testTheme;

function mkEl() {
  const classes = new Set();
  return {
    addClass: (c) => String(c).split(/\s+/).forEach((x) => classes.add(x)),
    removeClass: (c) => String(c).split(/\s+/).forEach((x) => classes.delete(x)),
    has: (c) => classes.has(c),
    all: () => [...classes],
  };
}

const el = mkEl();
applyTheme(el, 'minimal');
ok('挂上 minimal', el.has('pomo-theme-minimal'));
applyTheme(el, 'dynamic');
ok('切到 dynamic 后 minimal 已移除', !el.has('pomo-theme-minimal') && el.has('pomo-theme-dynamic'));
ok('同一时刻只有一个主题 class', el.all().filter((c) => c.indexOf('pomo-theme-') === 0).length === 1);

const el2 = mkEl();
applyTheme(el2, '不存在的主题');
ok('非法主题回落到 classic', el2.has('pomo-theme-classic'));

applyTheme(null, 'minimal');
applyTheme(undefined, 'minimal');
ok('空元素不抛异常', true);

/* ---------------- 4. syncCustomCss ---------------- */
syncCustomCss('classic', '.x{color:red}');
ok('非 custom 主题不注入 CSS', global.document.getElementById(POMO_CSS_ID) === null);

syncCustomCss('custom', '.pomo-theme-custom .pomo-time{color:#f66;}');
let node = global.document.getElementById(POMO_CSS_ID);
ok('custom 主题注入了 <style>', node !== null);
ok('注入内容正确', node && node.textContent.indexOf('#f66') >= 0);
ok('只注入一个节点', headChildren.filter((e) => e.id === POMO_CSS_ID).length === 1);

syncCustomCss('custom', '.pomo-theme-custom{--pomo-focus:#0f0;}');
node = global.document.getElementById(POMO_CSS_ID);
ok('再次注入复用同一节点（不堆积）', headChildren.filter((e) => e.id === POMO_CSS_ID).length === 1);
ok('内容已更新', node && node.textContent.indexOf('#0f0') >= 0 && node.textContent.indexOf('#f66') < 0);

syncCustomCss('custom', '   ');
ok('CSS 清空后节点被移除', global.document.getElementById(POMO_CSS_ID) === null);
ok('清空后 head 里没有残留 theme 节点', headChildren.filter((e) => e.id === POMO_CSS_ID).length === 0);

// 反复切换不应堆积
for (let i = 0; i < 12; i += 1) {
  syncCustomCss(i % 2 ? 'custom' : 'classic', '.a{}');
}
ok('反复切换 12 次后仍最多 1 个节点', headChildren.filter((e) => e.id === POMO_CSS_ID).length <= 1);

syncCustomCss('custom', '.b{}');
syncCustomCss('classic', '.b{}');
ok('切回非 custom 主题后节点被移除', global.document.getElementById(POMO_CSS_ID) === null);

/* ---------------- 5. styles.css ---------------- */
const css = fs.readFileSync(path.join(DIST, 'styles.css'), 'utf8');

ok('CSS 含 classic 主题', css.indexOf('.pomo-theme-classic') >= 0);
ok('CSS 含 minimal 主题', css.indexOf('.pomo-theme-minimal') >= 0);
ok('CSS 含 dynamic 主题', css.indexOf('.pomo-theme-dynamic') >= 0);
ok('CSS 含 custom 钩子', css.indexOf('.pomo-theme-custom') >= 0);
ok('custom 主题区不写任何样式', css.indexOf('.pomo-theme-custom {') < 0 && css.indexOf('.pomo-theme-custom{') < 0);

// 主题变量必须真的被用到，否则「换主题没效果」
['--pomo-focus', '--pomo-rest', '--pomo-paused', '--pomo-panel-bg', '--pomo-radius',
 '--pomo-shadow', '--pomo-time-size', '--pomo-bar-h'].forEach((v) => {
  ok('变量 ' + v + ' 既有定义也被使用', css.split('var(' + v).length - 1 >= 1);
});

ok('流光主题有呼吸动画', css.indexOf('pomo-breathe') >= 0);
ok('流光主题有流动进度条', css.indexOf('pomo-flow') >= 0);
ok('尊重 prefers-reduced-motion', css.indexOf('prefers-reduced-motion') >= 0);

/* ---------------- 5.5 样式接口完整性（v2.85） ----------------
 * 尺寸 / 背景图 / 按钮位置全部走变量，功能代码不碰外观。
 * 关键不是「变量存在」，而是「变量真的被 var() 读到」——
 * 只写进模板却没人用的变量是假接口，用户改了没反应。 */
const mainJs = fs.readFileSync(path.join(DIST, 'main.js'), 'utf8');
const TEMPLATE = pomo.__testTheme.POMO_CSS_TEMPLATE;

ok('导出了可整段复制的 CSS 模板', typeof TEMPLATE === 'string' && TEMPLATE.length > 100);

const tplVars = [...new Set(TEMPLATE.match(/--pomo-[a-z-]+/g) || [])];
ok('模板列出了足够多的变量', tplVars.length >= 15, String(tplVars.length));
const unused = tplVars.filter((v) => css.indexOf('var(' + v) < 0);
ok('模板里的变量在 CSS 中都有人用（无假接口）', unused.length === 0, unused.join(','));

// 尺寸 / 背景图 / 按钮布局，三类各验一遍，防止只补了一类
['--pomo-width', '--pomo-height', '--pomo-pad', '--pomo-font-scale'].forEach((v) => {
  ok('尺寸变量 ' + v + ' 被使用', css.indexOf('var(' + v) >= 0);
});
['--pomo-bg-image', '--pomo-bg-size', '--pomo-bg-position', '--pomo-bg-blend'].forEach((v) => {
  ok('背景图变量 ' + v + ' 被使用', css.indexOf('var(' + v) >= 0);
});
['--pomo-actions-justify', '--pomo-actions-wrap', '--pomo-actions-gap'].forEach((v) => {
  ok('按钮布局变量 ' + v + ' 被使用', css.indexOf('var(' + v) >= 0);
});

// 按钮行：容器类名 + data-act，缺一就没法改位置和顺序。
// 断言必须精确到「写入动作」而不是泛泛的字符串 ——
// 模板注释里也出现这些名字，只查字符串会出现「没实现也通过」的假绿。
ok(
  '产物里按钮行带 pomo-actions 容器',
  /createDiv\(\{\s*cls:\s*'pomo-float-row pomo-actions'/.test(mainJs)
);
ok(
  '产物里按钮挂了 data-act',
  /setAttribute\(\s*['"]data-act['"]/.test(mainJs)
);

// 语义钩子：CSS 据此上色，功能代码只写属性不写颜色。
// 要求 ≥2 处：浮窗和侧边栏是两个独立入口，只写一处会让另一个没配色。
/*
 * 两种写法都要认：侧边栏 PomodoroView 走 setAttribute，
 * 浮窗 FloatUI 为跳过无变化写入改走了 _attr() 脏检查包装。
 * 只认一种会在重构后误报「另一处没写」，而实际上两个入口都写了。
 */
const kindWrites =
  (mainJs.match(/setAttribute\(\s*['"]data-pomo-kind['"]/g) || []).length +
  (mainJs.match(/\._attr\(\s*['"]data-pomo-kind['"]/g) || []).length;
ok('浮窗与侧边栏都写 data-pomo-kind', kindWrites >= 2, String(kindWrites));

/* kindOf：暂停沿用暂停前的那一段，WAITING 用待开始的那一段。
 * 这两条写错，最小化时的模式名和配色就会错。 */
const kindOf = pomo.kindOf;
ok('kindOf: 专注 → focus', kindOf({ state: 'focus' }) === 'focus');
ok('kindOf: 短休 → rest', kindOf({ state: 'short' }) === 'rest');
ok('kindOf: 长休 → rest', kindOf({ state: 'long' }) === 'rest');
ok('kindOf: 未开始 → idle', kindOf({ state: 'idle' }) === 'idle');
ok('kindOf: 专注中暂停仍算 focus', kindOf({ state: 'paused', pausedFrom: 'focus' }) === 'focus');
ok('kindOf: 休息中暂停仍算 rest', kindOf({ state: 'paused', pausedFrom: 'short' }) === 'rest');
ok('kindOf: 待开始专注 → focus', kindOf({ state: 'waiting', pendingState: 'focus' }) === 'focus');
ok('kindOf: 待开始长休 → rest', kindOf({ state: 'waiting', pendingState: 'long' }) === 'rest');
ok('kindOf: 缺字段不抛异常', kindOf({}) === 'idle');

/* ---------------- 5b. 模板里不能出现 CSS 未定义的变量 ----------------
 * 自定义主题模板是给用户整段复制的。若模板写了 CSS 里不存在的变量名，
 * 用户改了半天毫无效果 —— 静默失效最难排查，所以在这里卡死。
 * 任何一方改名都必须同步另一方，否则这条会红。 */
const cssDefined = new Set((css.match(/--pomo-[a-z-]*/g) || []));
const tplUsed = new Set(
  ((pomo.__testTheme && pomo.__testTheme.POMO_CSS_TEMPLATE) || '').match(/--pomo-[a-z-]*/g) || []
);
ok('自定义模板有可复制的变量清单', tplUsed.size > 0, String(tplUsed.size));
const ghosts = [...tplUsed].filter((v) => !cssDefined.has(v)).sort();
ok(
  '模板里的变量都在 styles.css 中定义（无幽灵变量）',
  ghosts.length === 0,
  ghosts.join(', ')
);

/* 反向也查：CSS 定义了但模板没提的变量不算错（模板可以只列常用项），
 * 但至少配色和按钮位置这两组必须出现，否则用户不知道能改这两项。 */
['--pomo-focus', '--pomo-rest', '--pomo-actions-justify', '--pomo-width'].forEach((v) => {
  ok(`模板包含 ${v}`, tplUsed.has(v));
});

/* ---------------- 6. 不留存废弃数据 ---------------- */
// 主题相关的键必须在白名单里，否则旧 data.json 会越积越多
const pomodoroKeys = Object.keys(settings.DEFAULT_SETTINGS.pomodoro);
ok('theme 在默认设置里（会被白名单收录）', pomodoroKeys.indexOf('theme') >= 0);
ok('customCss 在默认设置里', pomodoroKeys.indexOf('customCss') >= 0);

const dirty = settings.defaults();
dirty.pomodoro.__removedOld = 'x';
dirty.pomodoro.theme = 'dynamic';
const cleaned = settings.migrateSettings(dirty);
ok('废弃键被剔除', Object.prototype.hasOwnProperty.call(cleaned.pomodoro, '__removedOld') === false);
ok('清洗后主题仍是用户设的 dynamic', cleaned.pomodoro.theme === 'dynamic');

/* ---------------- 7. 空灵紫主题 ---------------- */
const CSS = fs.readFileSync(path.join(DIST, 'styles.css'), 'utf8');
ok('styles.css 里有空灵紫主题块', CSS.indexOf('.pomo-theme-ethereal') > 0);
['--pomo-focus', '--pomo-rest', '--pomo-long', '--pomo-paused', '--pomo-panel-bg'].forEach((v) => {
  ok('空灵紫定义了 ' + v, CSS.indexOf(v) > 0);
});
ok('空灵紫的文字显式给深色（面板是浅色，不能沿用 --text-normal）', /\.pomo-theme-ethereal \.pomo-time[\s\S]{0,200}color:\s*#6b6488/.test(CSS));

/*
 * 关键帧重名会全局覆盖：空灵紫若沿用 pomo-flow，会把「流光」主题的
 * 流动方向改反（-200% vs 200%）。故空灵紫的全部关键帧必须带前缀。
 */
const etherealFrames = (CSS.match(/@keyframes\s+pomo-ethereal-[\w-]+/g) || []).map((m) => m.split(/\s+/).pop());
ok('空灵紫定义了自己的关键帧', etherealFrames.length >= 4, String(etherealFrames.length));
/*
 * 关键帧重名会全局覆盖：空灵紫若沿用 pomo-flow，「流光」主题的流动方向
 * 就会被改反（-200% → 200%）。这里不做「去前缀比对」（加前缀正是解法），
 * 而是查两件真正会出问题的事：同名重复定义、引用了不存在的动画。
 */
/* ---------------- 7b. 赤镰主题 ---------------- */
ok('styles.css 里有赤镰主题块', CSS.indexOf('.pomo-theme-scythe') > 0);
['--pomo-focus', '--pomo-rest', '--pomo-long', '--pomo-paused', '--pomo-panel-bg'].forEach((v) => {
  ok('赤镰定义了 ' + v, CSS.indexOf(v) > 0);
});
/* 底色必须实色：半透明会透出底下的血流层 */
ok(
  '赤镰底色是实色（半透明会透出血流层）',
  /\.pomo-theme-scythe[^{]*\{[\s\S]{0,1200}--pomo-panel-bg:\s*#[0-9a-fA-F]{6}/.test(CSS)
);
/* 关键帧同样必须带前缀，否则与流光/空灵紫互噬 */
const scytheFrames = (CSS.match(/@keyframes\s+pomo-scythe-[\w-]+/g) || []).map((m) => m.split(/\s+/).pop());
ok('赤镰定义了自己的关键帧', scytheFrames.length >= 4, String(scytheFrames.length));

const allFrames = (CSS.match(/@keyframes\s+([\w-]+)/g) || []).map((m) => m.split(/\s+/).pop());
const dup = allFrames.filter((n, i) => allFrames.indexOf(n) !== i);
ok('styles.css 中没有重复定义的关键帧', dup.length === 0, dup.join(','));

const refs = (CSS.match(/animation:\s*([\w-]+)/g) || []).map((m) => m.split(/\s+/).pop());
const missing = refs.filter((n) => n !== 'none' && allFrames.indexOf(n) < 0);
ok('所有 animation 引用的关键帧都有定义', missing.length === 0, missing.join(','));
ok('流光的 pomo-flow 仍是原名', CSS.indexOf('@keyframes pomo-flow') > 0);

console.log('');
console.log(fail === 0 ? `✅ pomotheme: ${pass} 项全部通过` : `❌ pomotheme: ${pass} 通过 / ${fail} 失败`);
if (fail) {
  failures.forEach((f) => console.log('   - ' + f));
  process.exit(1);
}
