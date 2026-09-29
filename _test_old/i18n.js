/*
 * 界面语言（i18n）测试
 *
 * 重点守三件事：
 *   1. 兜底：任何查不到的条目、任何非法语言值，都必须回到中文 —— 不许空白、不许 undefined
 *   2. 独立：i18n.js 不依赖任何别的 src 模块（可以整块删掉）
 *   3. 迁移：uiLang 必须能在 migrateSettings 里活过第二轮（曾漏掉，第二次迁移被清空）
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

const obsidian = require('obsidian');
const I18n = require(path + 'src/i18n.js');
const { t, setLang, getLang, LANGS, toTW, normalizeLang, renderLangTab, detectSystemLang, matchLang } = I18n;
/** 间接取「真正生效的语言」：t() 的结果就是证据 */
const resolveNow = () => (t('tab.cal', '日历') === 'Calendar' ? 'en'
  : (t('tab.cal', '日历') === '日曆' ? 'zh-TW' : 'zh'));

console.log('\n[1] 兜底与归一化');
{
  setLang('zh');
  check('默认是 zh', getLang() === 'zh');
  check('zh 下返回原文', t('k00000000', '时间格式') === '时间格式');

  // 表里没有的 key：英文态也必须回落中文，绝不能空白
  setLang('en');
  check('英文态缺表回落中文', t('k_no_such_key', '自设节日') === '自设节日');
  check('回落结果非空字符串', typeof t('k_no_such_key', '自设节日') === 'string' && t('k_no_such_key', '自设节日').length > 0);

  setLang('火星文');
  check('非法语言值归一化到 auto（跟随系统）', getLang() === 'auto');
  check('非法语言值下仍是中文', t('k1', '日历') === '日历');

  setLang(null);
  check('null 也归一化到 auto', getLang() === 'auto');
}

console.log('\n[2] 英文表命中');
{
  setLang('en');
  // 取一条真实存在的条目（key 由原文哈希生成，这里直接用模块内部表比对不方便，
  // 改为：英文态下结果不应等于中文原文，且必须是非空字符串）
  /* v3.26 起 EN 表搬到 src/i18n-en.js（纯数据），这里必须读那个文件 */
  const src = fs.readFileSync(path + 'src/i18n-en.js', 'utf8');
  const m = src.match(/const EN = \{[\s\S]*?\n\};/);
  check('EN 表存在于源码', !!m);
  const enCount = (m ? m[0].match(/^\s{2}"k/gm) : []).length;
  check('EN 表条目数 > 150（覆盖主要设置文案）', enCount > 150, '实际 ' + enCount);

  // 抽查：源码里被 i18nT 包裹的条目，英文态下应与中文原文不同
  const ts = fs.readFileSync(path + 'src/timestamp.js', 'utf8');
  const hit = ts.match(/i18nT\('(\w+)', '([^']+)'\)/);
  check('能取到一条真实条目', !!hit);
  if (hit) {
    const out = t(hit[1], hit[2]);
    check('英文态返回与原文不同的译文', out !== hit[2], hit[2] + ' → ' + out);
    check('译文非空', !!out && out.length > 0);
  }
}

console.log('\n[3] 繁体转换');
{
  setLang('zh-TW');
  check('词汇级：设置 → 設定', toTW('设置').indexOf('設') >= 0, toTW('设置'));
  check('字表级：时间 → 時間', toTW('时间') === '時間', toTW('时间'));
  check('未收录字原样保留', toTW('ABC123') === 'ABC123');
  check('空串不炸', toTW('') === '');
  check('null 不炸', toTW(null) === '');
  const out = t('k1', '时间格式');
  check('t 在繁体态也做转换', out === '時間格式', out);
  setLang('zh');
}

console.log('\n[4] 语言清单');
{
  check('共 3 种语言', LANGS.length === 3);
  check('含简体中文', LANGS.some((l) => l.code === 'zh'));
  check('含 English', LANGS.some((l) => l.code === 'en'));
  check('语言名用本语言自称（English 不译）',
    LANGS.find((l) => l.code === 'en').label === 'English');
}

console.log('\n[5] 独立性：i18n.js 不依赖别的 src 模块');
{
  const s = fs.readFileSync(path + 'src/i18n.js', 'utf8');
  const reqs = (s.match(/require\('([^']+)'\)/g) || []).map((x) => x.slice(9, -2));
  /* 白名单多一个 ./i18n-en.js：那是它自己的纯数据表，一起删即可 */
  check('只依赖 obsidian 与英文数据表',
    reqs.every((r) => r === 'obsidian' || r === './i18n-en.js'), reqs.join(','));
  check('只有一个 module.exports', (s.match(/module\.exports/g) || []).length === 1);
}

console.log('\n[6] 语言区嵌在主设置页里（不再单独一页）');
{
  check('renderLangTab 是函数', typeof renderLangTab === 'function');
  const mainSrc = fs.readFileSync(path + 'src/main.js', 'utf8');
  check('main.js 不再单独挂语言设置页',
    !/addSettingTab\(new LangSettingTab\(/.test(mainSrc) && !/LangSettingTab/.test(mainSrc));
  // 两个入口在设置列表里显示为两行 Time Tools，会被当成两套设置 —— 必须并进主设置页
  const setSrc = fs.readFileSync(path + 'src/settings.js', 'utf8');
  const tabs = setSrc.match(/const TABS = \[[\s\S]*?\];/);
  check('主设置页有四个标签（含界面语言）', (tabs ? tabs[0].match(/key:/g) || [] : []).length === 4);
  check('标签用 labelKey 渲染（切语言时 label 才跟得上）',
    /i18nT\(tab\.labelKey, tab\.label\)/.test(setSrc));
  // 分支与调用之间夹着一段说明（为什么要传子容器），窗口给宽一点
  check('renderInto 里有 lang 分支', /activeTab === 'lang'[\s\S]{0,600}renderLangTab\(/.test(setSrc));
}

console.log('\n[6.1] 跟随系统：检测与回落');
{
  check('zh-CN 认作简体', matchLang('zh-CN') === 'zh');
  check('zh-TW 认作繁体', matchLang('zh-TW') === 'zh-TW');
  check('zh-HK 认作繁体', matchLang('zh-HK') === 'zh-TW');
  check('en-GB 认作英文', matchLang('en-GB') === 'en');
  check('不支持的语言回落英文', matchLang('ja') === 'en' && matchLang('fr') === 'en');
  check('空值也回落英文', matchLang('') === 'en' && matchLang(null) === 'en');
  check('检测函数不抛错', typeof detectSystemLang() === 'string');
  // 沙盒里没有 window / navigator：读不到就该回中文底色，而不是硬给英文
  setLang('auto');
  check('读不到任何语言信息时回中文底色', resolveNow() === 'zh', resolveNow());
  setLang('zh');
  // 启动必须应用：否则存了 uiLang 却没 setLang，表现为重启后仍是中文
  const mainSrc = fs.readFileSync(path + 'src/main.js', 'utf8');
  check('读完设置后立刻 setLang', /loadSettings\(\)[\s\S]{0,200}setLang\(this\.settings\.uiLang\)/.test(mainSrc));
}

console.log('\n[6.2] 占位符替换（模板串翻译）');
{
  const iSrc = fs.readFileSync(path + 'src/i18n-en.js', 'utf8');
  const hit = iSrc.match(/"(k[0-9a-f]{8})": "[^"]*[{]0[}]/);
  check('EN 表里存在带 {0} 的条目（模板串已接上）', !!hit);
  setLang('en');
  check('英文模式下 {0} 被实参替换', t(hit[1], '中文兜底', 7).indexOf('7') >= 0);
  check('替换后不再残留占位符', t(hit[1], '中文兜底', 7).indexOf('{0}') < 0);
  setLang('zh');
  check('中文模式不进替换分支（原文本身已插值）', t(hit[1], '已完成 3 轮', 3) === '已完成 3 轮');
}

console.log('\n[7] 迁移：uiLang 必须活过第二轮');
{
  const { migrateSettings, DEFAULT_SETTINGS } = require(path + 'src/settings.js');
  check('默认值是 auto（跟随系统）', DEFAULT_SETTINGS.uiLang === 'auto');
  const canon = (o) => JSON.stringify(o, (k, v) =>
    (v && typeof v === 'object' && !Array.isArray(v))
      ? Object.keys(v).sort().reduce((acc, kk) => { acc[kk] = v[kk]; return acc; }, {})
      : v);
  const first = migrateSettings(null);
  const second = migrateSettings(JSON.parse(JSON.stringify(first)));
  check('连续两次迁移幂等', canon(first) === canon(second),
    'uiLang: ' + first.uiLang + ' vs ' + second.uiLang);
  check('迁移保留 uiLang', second.uiLang === 'auto', String(second.uiLang));

  const dirty = migrateSettings({ uiLang: 'en', timestamp: {}, pomodoro: {} });
  check('合法值 en 被保留', dirty.uiLang === 'en', String(dirty.uiLang));
  const bad = migrateSettings({ uiLang: 'klingon', timestamp: {}, pomodoro: {} });
  check('非法值被清洗回 auto', bad.uiLang === 'auto', String(bad.uiLang));
  const undef = migrateSettings({ timestamp: {}, pomodoro: {} });
  check('缺失时补默认值 auto', undef.uiLang === 'auto', String(undef.uiLang));
}

console.log('\n[8] 语言切换后设置页文案会变');
{
  // 直接验证函数级行为，不渲染 DOM（沙盒无真实 Obsidian）
  const ts = fs.readFileSync(path + 'src/calendar.js', 'utf8');
  const hit = ts.match(/i18nT\('(\w+)', '([^']+)'\)/);
  if (hit) {
    setLang('zh');
    const zhOut = t(hit[1], hit[2]);
    setLang('en');
    const enOut = t(hit[1], hit[2]);
    check('同一条目中英文不同（切换生效）', zhOut !== enOut, zhOut + ' / ' + enOut);
  } else {
    check('能取到一条真实条目', false);
  }
  setLang('zh');
}

console.log('\n[9] 语言标签不能吃掉主设置页的标签栏');
{
  /*
   * v3.19 实测到的 bug：renderLangTab 开头 box.empty()，而主设置页把整个
   * containerEl 传了进去 —— 顶部标签栏被一起清掉，进了这一页就切不回去。
   * 两条断言分别守住「被调用时只动自己的盒子」和「调用点传的是子容器」。
   */
  setLang('zh');

  const outer = new obsidian.MockEl('div');
  outer.cls = 'tt-settings';
  const fakeBar = outer.createDiv({ cls: 'tt-tab-bar' });
  fakeBar.createDiv({ cls: 'tt-tab', text: '时间戳' });
  const pane = outer.createDiv({ cls: 'tt-lang-pane' });
  const plugin = { settings: { uiLang: 'auto' }, saveSettings: async () => {} };

  renderLangTab(pane, plugin);

  const barStill = outer.children.some((c) => c.cls.includes('tt-tab-bar'));
  check('渲染后外层标签栏仍在', barStill, '标签栏被清掉 → 切不回别的标签');
  check('外层仍只有一个标签栏', outer.children.filter((c) => c.cls.includes('tt-tab-bar')).length === 1);
  check('本块渲染出内容', pane.children.length > 0, String(pane.children.length));

  // 调用点：settings.js 必须传子容器，不能把 containerEl 直接交出去
  const st = fs.readFileSync(path + 'src/settings.js', 'utf8');
  const call = st.match(/renderLangTab\(([^;]{0,200}?)\)\s*;/);
  check('settings.js 里有 renderLangTab 调用', !!call);
  if (call) {
    const arg = call[1];
    check('传入的是新建的子容器', /createDiv\s*\(/.test(arg), arg.trim());
    check('没有把 containerEl 原样传进去', !/^\s*containerEl\s*$/.test(arg), arg.trim());
  }
}

console.log('\n———————————————');
console.log('界面语言：' + pass + ' 项，失败 ' + fail + (fail ? ' ❌' : ' ✅'));
process.exit(fail ? 1 : 0);
