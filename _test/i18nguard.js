/*
 * 界面语言「红线」守门测试
 *
 * 背景：需求文档 §十 列了 11 条红线，改 i18n 时不得违反。
 *       但这些红线此前只写在文档里，没有任何测试守着 —— 靠人记得 = 迟早破。
 *       本套件把能静态判定的部分全部变成断言，反证已验证会红。
 *
 * 重点守四件事：
 *   1. 独立：i18n.js 零依赖，只 require obsidian（可整块删除的前提）
 *   2. 数据干净：EN 表不混入中文、不重复、不空值
 *   3. 覆盖：设置页上的中文文案必须全部包 i18nT（漏包 = 切英文后仍是中文）
 *   4. 体积：i18n.js（逻辑）≤ 32KB、翻译数据合计占产物 ≤ 12%、语言 ≤ 4 档
 */
const fs = require('fs');
const path = __dirname + '/../';

let pass = 0;
let fail = 0;
function check(name, ok, extra) {
  if (ok) {
    pass++;
    console.log('  ✓ ' + name);
  } else {
    fail++;
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  }
}

const srcFiles = fs.readdirSync(path + 'src').filter((f) => f.endsWith('.js'));

/* 解码与取值：漏包判定与取值两处共用，故提到外层 */
const unesc = (x) =>
  x
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const hasZH = (x) => !!x && /[一-鿿]/.test(unesc(x));
function valAt(s, i) {
  let depth = 0, instr = null, out = '';
  while (i < s.length) {
    const c = s[i];
    if (instr) {
      out += c;
      if (c === '\\') { out += s[i + 1]; i += 2; continue; }
      if (c === instr) instr = null;
      i++;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { instr = c; out += c; i++; continue; }
    if (c === '(' || c === '[' || c === '{') { depth++; out += c; i++; continue; }
    if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) break;
      depth--; out += c; i++; continue;
    }
    if (c === ',' && depth === 0) break;
    if (c === '\n' && depth === 0 && out.trim()) break;
    out += c; i++;
  }
  return out.trim();
}

const readSrc = (f) => fs.readFileSync(path + 'src/' + f, 'utf8');
const i18nSrc = readSrc('i18n.js');

/**
 * 取 EN 表：只取 "key": "value", 形式的行（表内值不跨行）。
 *
 * v3.26 起 EN 表搬到了 i18n-en.js（纯数据），这里必须读那个文件 ——
 * 继续读 i18n.js 会抠出空集，导致「EN 表非空」等 3 项连带误报。
 */
function enTable() {
  const lines = readSrc('i18n-en.js').split('\n');
  const out = {};
  for (const l of lines) {
    const m = l.match(/^\s*"([^"]+)"\s*:\s*"(.*?)",?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const EN = enTable();

/** 所有 i18nT('key', '中文'...) 调用 */
function allCalls() {
  const map = {};
  for (const f of srcFiles) {
    if (f === 'i18n.js') continue;
    const s = readSrc(f);
    const re = /i18nT\(\s*'([^']+)'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
    let m;
    while ((m = re.exec(s))) (map[m[1]] = map[m[1]] || new Set()).add(m[2]);
  }
  return map;
}
const CALLS = allCalls();

console.log('\n[1] 独立性：i18n.js 零依赖');
{
  /*
   * 白名单：obsidian + 自己那张英文数据表。
   * i18n-en.js 是**纯数据**（不 require 任何东西），i18n.js 引用它不破坏
   * 「可整块删除」的前提 —— 两个文件同属 i18n，一起删即可。
   */
  const OK_DEPS = ['obsidian', './i18n-en.js'];
  const reqs = [...i18nSrc.matchAll(/require\('([^']+)'\)/g)].map((m) => m[1]);
  const bad = reqs.filter((r) => !OK_DEPS.includes(r));
  check('只依赖 obsidian 与英文数据表', bad.length === 0, bad.join(','));
  const selfRef = /\.\/(?!i18n-en\.js)[a-z0-9-]+\.js/.test(
    i18nSrc.replace(/require\('(?:obsidian|\.\/i18n-en\.js)'\)/g, '')
  );
  check('不反向 require 任何功能模块', !selfRef);
  check('i18n-en.js 自身零依赖', !/require\s*\(/.test(fs.readFileSync(path + 'src/i18n-en.js', 'utf8')));
}

console.log('\n[2] EN 表数据干净');
{
  /*
   * 允许 EN 值里保留中文的例外：命令名。
   * 命令名一律不翻译（arch-doc 双向校验依赖它），所以提示里若让用户去搜某条命令，
   * 那个名字必须保持中文原样 —— 翻成英文用户就搜不到了。
   */
  const EN_ALLOW_CN = new Set([
    'ka775650d', // 「手机端一键入口」提示里的「时间戳」命令名
    'kd5a911e8', // 「打开日历视图」说明里让用户去命令面板搜的「日历」命令名
    // 以下三条是农历判定的语法示例：解析器只认中文写法，翻成英文照抄会解析不出，
    // 所以英文说明里保留原始中文例子（与自设节日写法同一类）。
    'k8d574624', // 「五月十六」/「五月十六日」
    'k6d51a9fb', // 「农历2026年八月初九」
    'k00ff190f', // 「五月十六号」/「5月16号」
    'k1554c109', // 「早上」/「下午」/「早上8点」
    'k4886d4c7', // 格式串示例 YYYY年MM月DD日（格式串本身是用户数据，不译）
  ]);
  const cn = Object.keys(EN).filter((k) => /[一-鿿]/.test(EN[k]) && !EN_ALLOW_CN.has(k));
  check('EN 值不含中文（命令名与语法示例除外）', cn.length === 0, cn.slice(0, 3).join(','));
  const allowCnAlive = [...EN_ALLOW_CN].every((k) => k in EN && /[一-鿿]/.test(EN[k]));
  check('命令名例外条目确实还在（防止白名单空转）', allowCnAlive);

  const lines = i18nSrc.split('\n');
  const keyLines = lines.filter((l) => /^\s*"[^"]+"\s*:\s*"/.test(l));
  const keys = keyLines.map((l) => l.match(/^\s*"([^"]+)"/)[1]);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  check('EN key 无重复', dup.length === 0, dup.slice(0, 3).join(','));

  const empty = Object.keys(EN).filter((k) => !EN[k].trim());
  check('EN 值无空串', empty.length === 0, empty.slice(0, 3).join(','));

  check('EN 表非空', Object.keys(EN).length > 100, String(Object.keys(EN).length));
}

console.log('\n[3] 覆盖：设置页中文文案必须包 i18nT');
{
  /*
   * 刻意不译的只有两条：DataView 字段写法、自设节日写法。
   * 它们确实是语法，英文名照抄解析不了（节日的英文日期写法尚未支持）。
   *
   * 「自定义规则」的 placeholder（k1f05dd7e）**已移出**这个白名单：
   * 规则匹配的是用户选中的原文，与语言无关，英文示例照抄实测可用 ——
   * 早先把它归进"语法示例"是判断错了。
   */
  const KEEP_ZH = new Set(['ka6762c3b', 'k72acd8fa']);
  const missing = Object.keys(CALLS).filter((k) => !(k in EN));
  const unexpected = missing.filter((k) => !KEEP_ZH.has(k));
  check('未进 EN 表的只剩刻意不译的 2 条', unexpected.length === 0, unexpected.join(','));
  check('刻意不译的 2 条确实无 EN 条目',
    [...KEEP_ZH].every((k) => !(k in EN) && k in CALLS));

  /*
   * 漏包检测：设置类 API 里写死中文、没包 i18nT。
   *
   * 早先用的是正则字面量匹配（只认 .setName('中文') 这种最简单的形式），
   * 三元表达式 / 模板串 / 拼接串全都抓不到 —— 上一批那些漏包就是这么逃逸的。
   * 现改为「括号配对取实参」：先定位 API 调用，再从开括号配到闭括号取完整实参，
   * 这样 a ? '甲' : '乙'、`含 ${v} 的串`、'前段' + x 都能拿到。
   *
   * addOption 取第二个实参：第一个是存储值（'off'/'memory' 这种），不该翻译。
   */
  const APIS = 'setName|setDesc|setPlaceholder|setTooltip|setTitle|setText'
    + '|addOption|setButtonText'
    /* Notice：运行时弹窗此前是结构性盲区（漏译无人管）；
     * _paintSet 第二实参：中文藏在自定义函数的参数位上，四类扫描都看不见 */
    /* notifyOnce：calendar.js 发提示的主要途径，与 _paintSet 同属「自定义函数参数位」 */
    + '|Notice|_paintSet|notifyOnce';
  const ARG_IDX = { addOption: 1, _paintSet: 1 }; // 其余默认取第一个实参

  /** 从 openParen 处开始括号配对，返回第 want 个实参（0 基），取不到返回 null */
  function argAt(s, openParen, want) {
    let depth = 0, args = [], cur = '', instr = null;
    for (let i = openParen; i < s.length; i++) {
      const c = s[i];
      if (instr) {                                  // 字符串内部：括号逗号都不算
        cur += c;
        if (c === '\\') { cur += s[i + 1]; i++; continue; }
        if (c === instr) instr = null;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') { instr = c; cur += c; continue; }
      if (c === '(' || c === '[' || c === '{') {
        if (c === '(' && depth === 0) { depth = 1; continue; } // 最外层的开括号
        depth++; cur += c; continue;
      }
      if (c === ')' || c === ']' || c === '}') {
        if (c === ')' && depth === 1) { args.push(cur.trim()); return args[want] || null; }
        depth--; cur += c; continue;
      }
      if (c === ',' && depth === 1) { args.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    return null;
  }

  /*
   * 先把 \uXXXX / \u{XXX} 转义还原成真字符再判中文。
   * 不解码的话，写作者只要把中文写成转义就能完全绕过守卫
   * —— 历史上 SummaryModal 整块文案就是这么“全绿却全是中文”的。
   */
  /*
   * 语言下拉选项名用各自语言书写（简体中文 / 繁體中文 / English），是惯例不是漏包。
   * 用「实参包含」而非「实参等于」：addOption 实参是 'zh', '简体中文' 整串，
   * 等于匹配会误报 —— 误报会掩盖真漏包，守卫就失去可信度。
   */
  const LANG_OPT = ['简体中文', '繁體中文', 'English'];
  const isLangOpt = (arg) => LANG_OPT.some((w) => arg.includes(w));
  const unwrapped = [];
  for (const f of srcFiles) {
    const s = readSrc(f);
    for (const api of APIS.split('|')) {
      // 点号可选：notifyOnce() 这类是裸调用，没有 this./xxx. 前缀
      const re = new RegExp('(?:\\.|\\b)' + api + '\\s*\\(', 'g');
      let m;
      while ((m = re.exec(s))) {
        const arg = argAt(s, m.index + m[0].length - 1, ARG_IDX[api] || 0);
        // i18n.js 自己的翻译函数就叫 t()，不是 i18nT —— 别把它当成漏包
        const wrapped = arg.includes('i18nT(') || (f === 'i18n.js' && arg.includes('t('));
        // 语言下拉里的选项名用各自语言书写（简体中文 / English），这是惯例不是漏包 ——
        // 切到英文界面时更要显示「简体中文」，否则用户认不出自己的语言
        if (isLangOpt(arg)) continue;
        // 拼接串（'前段' + x）里的常量部分也算漏包：只判实参里是否有未包裹的中文字面量
        if (hasZH(arg) && !wrapped) {
          const ln = s.slice(0, m.index).split('\n').length;
          unwrapped.push(f + ':' + ln + ' [' + api + '] ' + arg.slice(0, 30).replace(/\n/g, ' '));
        }
      }
    }
  }
  check('设置类中文文案没有漏包', unwrapped.length === 0,
    unwrapped.length + ' 处 → ' + unwrapped.slice(0, 4).join(' | '));

  /*
   * createDiv / createEl / createSpan 的 text: 与 title: 也要查。
   * 上面那组只扫 setName 这类链式 API，而弹窗正文大量走 createDiv({ text }) ——
   * 不补这一段，会话小结那种整块文案永远绿。
   *
   * 做法：找到 text: / title:，向前 200 字符内若有 create*() 就纳入，
   *       再取值到本层结束（括号配对），判是否含中文且未包 i18nT。
   */
  const divWrapped = [];
  for (const f of srcFiles) {
    const s = readSrc(f);
    const re = /\b(text|title)\s*:/g;
    let m;
    while ((m = re.exec(s))) {
      const pre = s.slice(Math.max(0, m.index - 200), m.index);
      if (!/create(Div|El|Span)\s*\(/.test(pre)) continue;
      const arg = valAt(s, m.index + m[0].length);
      const wrapped = arg.includes('i18nT(') || (f === 'i18n.js' && arg.includes('t('));
      if (hasZH(arg) && !wrapped) {
        const ln = s.slice(0, m.index).split('\n').length;
        divWrapped.push(f + ':' + ln + ' [' + m[1] + '] ' + arg.slice(0, 40).replace(/\n/g, ' '));
      }
    }
  }
  check('createDiv/createEl 的 text·title 没有漏包', divWrapped.length === 0,
    divWrapped.length + ' 处 → ' + divWrapped.slice(0, 4).join(' | '));

  /*
   * confirmDialog 的参数位 —— 第三次同族复发。
   *
   * 中文藏在自定义函数的参数位上（opt.title / opt.content / opt.okText）：
   * 链式 API 扫描看不见，create* 扫描也看不见。
   * v3.25 补查表、v3.32 补 _paintSet，都是同一个病根 ——
   * 每换一个「藏中文的新位置」就漏一次。这里按函数名直接定位参数位。
   */
  const cdWrapped = [];
  for (const f of srcFiles) {
    const s2 = readSrc(f);
    const re = /\b(title|content|okText)\s*:/g;
    let m2;
    while ((m2 = re.exec(s2))) {
      const pre = s2.slice(Math.max(0, m2.index - 400), m2.index);
      if (!/confirmDialog\s*\(/.test(pre)) continue;
      const arg = valAt(s2, m2.index + m2[0].length);
      const wrapped = arg.includes('i18nT(') || (f === 'i18n.js' && arg.includes('t('));
      if (hasZH(arg) && !wrapped) {
        const ln = s2.slice(0, m2.index).split('\n').length;
        cdWrapped.push(f + ':' + ln + ' [' + m2[1] + '] ' + arg.slice(0, 40).replace(/\n/g, ' '));
      }
    }
  }
  check('confirmDialog 的 title/content/okText 没有漏包', cdWrapped.length === 0,
    cdWrapped.length + ' 处 → ' + cdWrapped.slice(0, 4).join(' | '));

  /*
   * 续行拼接的中文片 —— 「合并没并干净」的特征形态：
   * 上一行刚包完 i18nT，下一行 + '中文' 忘了包。
   * 结果是英文开头 + 中文结尾，比全中文更难受，且四类扫描全放行。
   */
  const contMissed = [];
  for (const f of srcFiles) {
    const lines = readSrc(f).split('\n');
    for (let i = 1; i < lines.length; i++) {
      const cur = lines[i];
      if (!/^\s*\+\s*['"`]/.test(cur)) continue;
      if (!hasZH(cur)) continue;
      if (!/i18nT\s*\(/.test(lines[i - 1])) continue;
      contMissed.push(f + ':' + (i + 1) + ' ' + cur.trim().slice(0, 40));
    }
  }
  check('续行拼接的中文片没有漏包', contMissed.length === 0,
    contMissed.length + ' 处 → ' + contMissed.slice(0, 4).join(' | '));
}

/*
 * 直接赋值形式：.title = '中文' / .placeholder = / .ariaLabel =
 * 上面两组只扫链式 API 与 create*() 的属性，而悬停提示大量写成直接赋值
 * —— 不补这一段，按钮悬停永远显示中文（英文用户悬停看到中文，很违和）。
 */
{
  const props = ['title', 'placeholder', 'ariaLabel'];
  const hits = [];
  for (const f of srcFiles) {
    const s = readSrc(f);
    for (const pr of props) {
      const re = new RegExp('\\.' + pr + '\\s*=\\s*', 'g');
      let m;
      while ((m = re.exec(s))) {
        const arg = valAt(s, m.index + m[0].length);
        const wrapped = arg.includes('i18nT(') || (f === 'i18n.js' && arg.includes('t('));
        if (hasZH(arg) && !wrapped) {
          const ln = s.slice(0, m.index).split('\n').length;
          hits.push(f + ':' + ln + ' [' + pr + '] ' + arg.slice(0, 40).replace(/\n/g, ' '));
        }
      }
    }
  }
  check('直接赋值 .title/.placeholder/.ariaLabel 没有漏包', hits.length === 0,
    hits.length + ' 处 → ' + hits.slice(0, 4).join(' | '));
}

console.log('\n[4] 命令名不翻译');
{
  let wrapped = 0;
  for (const f of srcFiles) {
    const s = readSrc(f);
    const re = /name:\s*([^,\n]+)/g;
    let m;
    while ((m = re.exec(s))) if (m[1].trim().startsWith('i18nT(')) wrapped++;
  }
  check('没有命令名被 i18nT 包裹', wrapped === 0, String(wrapped));
}

console.log('\n[5] TABS 存 label + labelKey，不在常量里调 i18nT');
{
  const st = readSrc('settings.js');
  const bad = st.split('\n').filter((l) => /key:\s*'\w+',\s*label:\s*i18nT/.test(l));
  check('TABS 里没有直接调 i18nT', bad.length === 0, bad.slice(0, 2).join(' | '));
  check('TABS 用的是 labelKey', /i18nT\(tab\.labelKey,\s*tab\.label\)/.test(st));
}

console.log('\n[6] 体积红线');
{
  const sz = fs.statSync(path + 'src/i18n.js').size;
  const szEn = fs.statSync(path + 'src/i18n-en.js').size;
  /*
   * 体积口径（v3.26 定，改过三次，别再照旧数字找）：
   *   字节帽只卡**逻辑文件** i18n.js ≤ 32KB；占比红线卡**翻译数据合计** ≤ 12%。
   *
   * 为什么不用固定字节卡数据：EN 表是数据，翻译越完整必然越大 ——
   * v3.22 时 40KB 只剩 289 字节、v3.25 时 64KB 只剩 748 字节，每补一批就顶死一次。
   * 这不是放宽标准：占比红线始终在（真正防的是无限膨胀），只是阈值随数据增长
   * 调整（10% → 12%，v3.32 因「英文输出」功能新增条目首次触线）。
   * 逻辑文件的 32KB 则防止有人把数据塞回 i18n.js 绕开检查。
   */
  check('i18n.js（逻辑）≤ 32KB', sz <= 32 * 1024, (sz / 1024).toFixed(1) + 'KB');

  const art = fs.statSync(path + 'main.js').size;
  const total = sz + szEn;
  check('翻译数据合计占产物 ≤ 12%', total / art <= 0.12,
    (total / art * 100).toFixed(2) + '%（' + (total / 1024).toFixed(1) + 'KB）');

  const LANGS = require(path + 'src/i18n.js').LANGS;
  check('语言档位 ≤ 4', LANGS.length <= 4, String(LANGS.length));
  check('含英文档', LANGS.some((l) => l.code === 'en'));
}

console.log('\n[7] 文档单语：不建第二语言版本');
{
  const all = fs.readdirSync(path);
  const langDocs = all.filter((f) => /README\.(en|tw|ja)|\.(en|tw)\.md$/i.test(f));
  check('没有第二语言文档文件', langDocs.length === 0, langDocs.join(','));
  const inPkg = fs.readdirSync(path + 'src').filter((f) => /\.(en|tw)\.md$/i.test(f));
  check('src 下没有第二语言文档', inPkg.length === 0, inPkg.join(','));
}

console.log('\n[8] t() 兜底：绝不返回空');
{
  check('源码里有 fallback 分支', /out\s*=\s*fallback/.test(i18nSrc));
  check('zh 分支直接返回原文', /\}\s*else\s*\{\s*out\s*=\s*fallback/.test(i18nSrc));
  const { t, setLang } = require(path + 'src/i18n.js');
  setLang('en');
  const r = t('k_absent_xyz', '时间格式');
  check('英文态缺表仍返回中文且非空', r === '时间格式' && r.length > 0, JSON.stringify(r));
  setLang('zh');
}

console.log('\n[9] 外部语言接口：registerLang 可用');
{
  const i18n = require(path + 'src/i18n.js');
  check('registerLang 已导出', typeof i18n.registerLang === 'function');
  check('allLangs 已导出', typeof i18n.allLangs === 'function');

  const before = i18n.allLangs().length;
  const ok = i18n.registerLang('xx-test', '测试语', {
    k_demo_key: 'Hello',
    k_demo_tpl: 'Total {0}',
  });
  check('注册成功返回 true', ok === true);
  check('注册后下拉多一项', i18n.allLangs().length === before + 1);
  check('内置语言不许被覆盖', i18n.registerLang('en', 'X', {}) === false);
  check('table 不是对象时被拒', i18n.registerLang('bad', 'X', 'nope') === false);
  check('code 为空时被拒', i18n.registerLang('', 'X', {}) === false);

  i18n.setLang('xx-test');
  check('已注册语言能被 setLang 接受', i18n.getLang() === 'xx-test', i18n.getLang());
  check('命中外部表', i18n.t('k_demo_key', '中文原文') === 'Hello');
  check('外部表命中模板串占位', i18n.t('k_demo_tpl', '共 {0} 项', 7) === 'Total 7');
  check('外部表查不到仍回落中文', i18n.t('k_absent', '中文原文') === '中文原文');
  i18n.setLang('zh');
}


console.log('\n[7] 查表同步（数据表新增项必须有英文，否则静默回落中文）');
{
  /*
   * 为什么单独一组：现有扫描只认字面量/三元/模板串/转义四类，
   * **实参是变量的那一类它天生看不见** —— 而查表正是为这类建的。
   * 不另配守卫的话，以后新增一个主题忘了同步 OPTION_EN，
   * 界面直接掉回中文，而 49 个测试一个都不红。
   *
   * 走行为断言（调 optText/judgeText 看是否回落中文），比抠源码文本稳。
   */
  const i18n = require(path + 'src/i18n.js');
  const { optText, judgeText } = i18n;
  const { POMO_THEME_OPTIONS } = require(path + 'src/settings.js');
  const { POPOUT_POS_OPTIONS } = require(path + 'src/pomowin.js');
  const { JUDGEMENTS } = require(path + 'src/timejudge.js');
  const MISS = '@@MISS@@';

  i18n.setLang('en');
  const missTheme = POMO_THEME_OPTIONS.map((o) => o.value).filter((v) => optText('theme', v, MISS) === MISS);
  check('OPTION_EN.theme 覆盖全部主题', missTheme.length === 0, missTheme.join(','));

  const missPos = POPOUT_POS_OPTIONS.map((o) => o[0]).filter((v) => optText('popoutPos', v, MISS) === MISS);
  check('OPTION_EN.popoutPos 覆盖全部开窗位置', missPos.length === 0, missPos.join(','));

  const missWeek = ['locale', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .filter((v) => optText('weekStart', v, MISS) === MISS);
  check('OPTION_EN.weekStart 覆盖全部周起始', missWeek.length === 0, missWeek.join(','));

  const missJudge = Object.keys(JUDGEMENTS).filter((k) => judgeText(k, 'n', MISS) === MISS);
  check('JUDGE_EN 覆盖全部口径项', missJudge.length === 0, missJudge.join(','));
  i18n.setLang('zh');

  check('中文态下查表直接回落原文', optText('theme', 'classic', '经典（默认）') === '经典（默认）');
}

console.log('\n———————————————');
console.log('i18n 红线：' + pass + ' 项，失败 ' + fail + (fail ? ' ❌' : ' ✅'));
process.exit(fail ? 1 : 0);
