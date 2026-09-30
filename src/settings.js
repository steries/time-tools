const obsidian = require('obsidian');
const { t: i18nT, normalizeLang, renderLangTab } = require('./i18n.js');
/* 时段表与时间口径都在 timejudge.js 里，只引用不复制：抄一份会导致新增时段要改两处。 */
const J = require('./timejudge.js');
/* 独立窗口的位置枚举与选项文案在 pomowin.js 里，这里只引用不复制 */
const { VALID_POPOUT_POS, POPOUT_POS_OPTIONS } = require('./pomowin.js');

/*
 * 全局设置：默认配置 + 旧版数据迁移 + 设置页
 *
 * 根节点只保留 timestamp / pomodoro 两个分组，两个模块各读各组。
 * 番茄钟的「时长方案」用 profiles 数组管理，当前生效值同步到 focusMin 等字段。
 *
 * 设置页也放在本文件：只有一个入口，顶部标签切换模块，
 * 附加区块在 SECTIONS 数组登记，新增功能不必改动渲染流程。
 */

/** 内置时长方案：专注 / 短休息 / 长休息（分钟） */
const DEFAULT_PROFILES = [
  { id: 'work', name: '工作', focusMin: 40, shortBreakMin: 10, longBreakMin: 90 },
  { id: 'study', name: '学习', focusMin: 25, shortBreakMin: 5, longBreakMin: 15 },
  { id: 'reading', name: '阅读', focusMin: 30, shortBreakMin: 3, longBreakMin: 10 },
];

/* 周起始合法值由 timejudge.WEEK_START_DOW 派生：三处曾各写一份字面量，现统一为唯一真源。 */
const VALID_WEEK_START = J.VALID_WEEK_START;

/**
 * 番茄钟主题的合法取值（属配置 schema，故定义在 settings.js）。
 *
 * 四个取值对应四种完全不同的样式策略，不要混：
 *   classic —— 经典：保留边框、阴影、圆角卡片，默认值。
 *   minimal —— 极简：去掉边框与阴影，背景透明，只留文字和一条细进度线。
 *              理由：番茄钟是常驻浮窗，抢眼会干扰写作，让它退到背景里。
 *   dynamic —— 流光：在 classic 基础上加呼吸光晕与流动渐变进度条。
 *              动画只走 opacity / transform，不触发重排；且尊重
 *              prefers-reduced-motion（系统开启「减弱动态效果」时自动静止）。
 *   scythe  —— 赤镰：暗黑底 + 镰刃红血流边框，进度条带一道扫光。
 *              注意底色必须实色：半透明会透出底下的血流层（代价：毛玻璃不生效）。
 *   custom  —— 自定义：插件只挂 .pomo-theme-custom 这个钩子，不提供任何样式，
 *              由用户用 CSS 片段（或设置里的自定义 CSS 框）完全接管。
 *
 * 主题的实际样式全部由 styles.css 里的 CSS 变量驱动，切换主题只是换一个
 * class —— 不增删 DOM、不重绘，代价接近零。
 */
const VALID_POMO_THEME = ['classic', 'minimal', 'dynamic', 'ethereal', 'scythe', 'custom'];
const VALID_POMO_UI_MODE = ['floating', 'sidebar', 'popout'];

/** 主题下拉的选项文案（值与 VALID_POMO_THEME 必须一致，有测试守着） */
const POMO_THEME_OPTIONS = [
  { value: 'classic', label: '经典（默认）' },
  { value: 'minimal', label: '极简' },
  { value: 'dynamic', label: '流光（动态）' },
  { value: 'ethereal', label: '空灵紫（水光渐变）' },
  { value: 'scythe', label: '赤镰（暗红血流）' },
  { value: 'custom', label: '自定义（写 CSS）' },
];

/**
 * 时间转换扩展的转换项清单（属配置 schema，故定义在 settings.js）
 * 顺序即界面顺序，key 即设置键。
 */
const ACTION_DEFS = [
  /* ================= 正向：日期/时间 → 别的表达 ================= */
  /*
   * 统一格式：把任意识别出来的时间换成同一个格式串。
   * 放第一位 —— 它是最常用的「归一化」操作。
   * 格式串单独存 unifyFormat，留空时跟随时间戳格式（即最初那套），
   * 这样改时间戳格式统一格式会跟着变，不用配两处。
   */
  {
    key: 'unify',
    name: '统一格式',
    desc: '把识别出的时间换成统一格式（格式在设置里改，默认与时间戳一致）',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'relative',
    name: '转相对时间',
    desc: '把日期变成「3 天前」「2 小时后」这类相对描述',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'weekday',
    name: '补星期',
    desc: '在日期后面补上星期，如 2026-09-19 周六',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'dailyLink',
    name: '转日记链接',
    desc: '变成 [[2026-09-19]]，方便链到当天日记',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'unixEncode',
    name: '日期 → 时间戳',
    desc: '把日期变成 10 位 Unix 时间戳',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'dateShift',
    name: '日期偏移',
    desc: '加减天数，填 +7 或 -3，自己决定偏移多少',
    group: 'forward',
    defaultOn: false,
  },
  {
    key: 'fillDate',
    name: '补全日期',
    desc: '只写了月日或时分时，补上今年与今天，如 09-17 → 2026-09-17、14:30 → 2026-09-19 14:30',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'timePart',
    name: '取时分秒',
    desc: '从日期时间里只取出时间部分，如 2026-09-19 14:30:25 → 14:30:25',
    group: 'forward',
    defaultOn: false,
  },

  /* ================= 农历 ================= */
  {
    key: 'lunar',
    name: '转农历',
    desc: '阳历日期 → 农历，如「农历2026年八月十九」',
    group: 'lunar',
    defaultOn: true,
  },
  {
    key: 'lunarGanzhi',
    name: '农历 + 干支生肖',
    desc: '转农历并附带干支年与生肖，如「丙午年马」',
    group: 'lunar',
    defaultOn: false,
  },
  {
    key: 'solarTerm',
    name: '查节气',
    desc: '当天是二十四节气中的哪一个；不是节气则这一项不显示',
    group: 'lunar',
    defaultOn: false,
  },

  /* ================= 逆向：别的表达 → 日期 =================
   * 默认开启：口语相对日（明天 / 后天）这类很常用，默认关会让人以为功能坏了。
   * 打开后只有在选中文本确实是该形态时才会出现在面板里，不会干扰正向项。
   */
  {
    key: 'unixDecode',
    name: '时间戳 → 日期',
    desc: '把 1768800000 变成可读日期',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'lunarToSolar',
    name: '农历 → 阳历',
    desc: '把「八月十九」这类农历日期转回阳历；可带年份，如 2026年八月十九',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'relativeToDate',
    name: '相对时间 → 日期',
    desc: '把「3 天前」「2 小时后」这类描述算回具体日期',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'linkToDate',
    name: '日记链接 → 日期',
    desc: '去掉 [[]] 变成纯日期，如 [[2026-09-19]] → 2026-09-19',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'stripWeekday',
    name: '去掉星期',
    desc: '把「2026-09-19 周六」变回「2026-09-19」',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'termToDate',
    name: '节气 → 日期',
    desc: '查某年某个节气是几号，如「立春」→ 2026-02-04；可带年份「2027年立春」',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'ganzhiToYear',
    name: '干支 → 年份',
    desc: '把「丙午」这样的干支换算成最接近今年的公历年份，如 丙午 → 2026（马年）',
    group: 'reverse',
    defaultOn: true,
  },

  /* ================= 节日（正向 ⇄ 逆向） ================= */
  /*
   * 正向「日期 → 节日」：选中 2026-10-01 得到「国庆节」。
   * 逆向「节日 → 日期」：选中「中秋节」得到当年中秋的阳历日期。
   * 两个方向的输出都受 festivalPrefix 控制（见 defaultExtensions 注释）：
   * 打开时统一成「国庆节 2026-10-01」这种「节日名 + 日期」的形式。
   */
  {
    key: 'festival',
    name: '日期 → 节日',
    desc: '查出这天是哪个节日，如 2026-10-01 → 国庆节；不是节日则这一项不显示',
    group: 'festival',
    defaultOn: true,
  },
  {
    key: 'festivalToDate',
    name: '节日 → 日期',
    desc: '算出某个节日是几号，如 中秋 → 当年八月十五对应的阳历日期',
    group: 'festival',
    defaultOn: true,
  },

  /* ================= 倒计时 / 日期差值 =================
   * 这一组与前面几项不同：输入是日期，输出是「天数」这类数字。
   * 默认关 —— 输出会把原文里的日期替换成一个数字，误触发等于丢了原文，
   * 属于「想要才开」的功能，不做默认。
   */
  {
    key: 'countdown',
    name: '倒计时',
    desc: '算出距某个日期还有多少天；已过的显示「已过去 N 天」，当天显示「就是今天」',
    group: 'countdown',
    defaultOn: false,
  },
  {
    key: 'dateDiff',
    name: '日期差值',
    desc: '选中含两个日期的文本算相差天数，如 2026-01-01 到 2026-03-01 → 相差 59 天',
    group: 'countdown',
    defaultOn: false,
  },
];

/**
 * 正向 ⇄ 逆向 的配对表。
 *
 * 开关太多会让设置页很乱，所以默认把一对合并成一个开关：
 * 界面上只渲染正向那一项，读写时同步到配对的逆向项。
 * 想分开控制就打开 extensions.separateDirections。
 */
const ACTION_PAIRS = [
  ['relative', 'relativeToDate'],
  ['weekday', 'stripWeekday'],
  ['dailyLink', 'linkToDate'],
  ['unixEncode', 'unixDecode'],
  ['lunar', 'lunarToSolar'],
  ['lunarGanzhi', 'ganzhiToYear'],
  ['solarTerm', 'termToDate'],
  ['festival', 'festivalToDate'],
];

/** 取某项配对的另一半；没有配对返回 null */
function pairOf(key) {
  for (const pair of ACTION_PAIRS) {
    if (pair[0] === key) return pair[1];
    if (pair[1] === key) return pair[0];
  }
  return null;
}

/** 是否为「正向」那一半（界面上代表整对渲染的那一项） */
function isForwardOfPair(key) {
  return ACTION_PAIRS.some((pair) => pair[0] === key);
}

/**
 * 设置页分区（三区）。
 * 第三区放高级/杂项开关，平时可以折叠，避免前两区的转换项被淹没。
 */
const ACTION_GROUPS = [
  { key: 'forward', title: '常用转换（正向 ⇄ 逆向）', titleKey: 'grp.forward' },
  { key: 'lunar', title: '农历转换（正向 ⇄ 逆向）', titleKey: 'grp.lunar' },
  { key: 'festival', title: '节日转换（正向 ⇄ 逆向）', titleKey: 'grp.festival' },
  { key: 'countdown', title: '倒计时 / 日期差值', titleKey: 'grp.countdown' },
];

/** 高级设置区：不属于具体转换项的杂项开关都放这里 */
const ADVANCED_GROUP = { key: 'advanced', title: '高级设置', titleKey: 'grp.advanced' };

/**
 * 农历相关的转换项 key。
 * 总开关关闭时这些项一律不生效，全部按阳历走。
 * 单独列出来是因为它们分散在 lunar / reverse 两个 group 里，
 * 只按 group 判断会漏掉 lunarToSolar、ganzhiToYear 等逆向项。
 */
const LUNAR_KEYS = [
  'lunar', 'lunarGanzhi', 'solarTerm',
  'lunarToSolar', 'ganzhiToYear', 'termToDate',
];

/** 是否为农历相关项 */
function isLunarKey(key) {
  return LUNAR_KEYS.indexOf(key) >= 0;
}

/** 合法的设置键集合，用于迁移时剔除废弃键，避免设置文件越积越大 */
const ACTION_KEYS = ACTION_DEFS.map((a) => a.key);

/** 默认开关状态：只默认打开常用的 */
function defaultActionItems() {
  const items = {};
  ACTION_DEFS.forEach((a) => {
    items[a.key] = a.defaultOn;
  });
  return items;
}

/*
 * 时段小时清洗复用 timejudge 的实现（J.cleanDaypartHours）：
 * 另存一份等价实现会导致只改一处、行为分叉。
 */

function defaultExtensions() {
  return {
    enabled: true, // 扩展功能总开关，默认打开
    items: defaultActionItems(),
    dailyLinkFormat: 'YYYY-MM-DD', // 日记链接里用的日期格式
    /*
     * 「统一格式」转换项用的格式串。
     * 留空 = 跟随时间戳格式（DEFAULT_SETTINGS.timestamp.format）。
     */
    unifyFormat: '',
    /*
     * 转换后是否显示可点击的撤回标记。
     * 注意：标记是 CM6 装饰，不写进正文（安全红线），不是"在文本后附加字符"。
     * 关闭 = 整个撤回功能停摆：不显示图标、**也不记录**，撤回命令会提示已关闭。
     * 记录只在内存，关闭 Obsidian 即清空。
     */
    undoHintEnabled: true,

    /*
     * 没选中文本、由光标自动识别出时间时，结果放哪：
     *   false（默认）覆盖识别到的那段原文
     *   true        在原文后面追加，原文保留
     * 只对「自动识别」生效；手动框选时始终是替换选区。
     */
    appendOnAutoPick: false,
    /*
     * 相对时间结果里是否附带「（相对 …）」的说明。
     * 默认开：笔记里的相对描述过几天再看，没有基准就不知道相对哪一天。
     */
    showRelativeBase: true,
    /*
     * 分别控制正向与逆向。
     * 默认关：一对共用一个开关，界面干净。
     * 打开后每对展开成「正向」「逆向」两个独立开关。
     */
    separateDirections: false,
    /* 折叠转换项开关列表：默认展开，打开后收起以简化界面 */
    collapseItems: false,
    /*
     * 精确到秒。关闭（默认）时所有时间输出只到分钟；
     * 在 fmt() 统一出口处理，连自定义格式串里的 ss 也会被去掉。
     */
    preciseToSecond: false,
    /*
     * 时段名（早上 / 下午 …）单独出现时是否转换。
     * 默认关（方案丙）：「早上」指 8 点还是 9 点没有共识，
     * 强行给一个值等于编造。开启后按 daypartHours 里的小时值转换。
     */
    convertDaypartAlone: false,
    /* 各时段名对应的小时值，可在设置里改；默认见 TIME_OF_DAY */
    daypartHours: {},
    /*
     * 历法标记是否也允许出现在日期**后面**。
     * 关（默认）：只有「农历2026年八月初九」这类**前缀**写法才认。
     * 开：「2026年八月初九 农历」这类后缀写法也能识别。
     */
    lunarMarkAnywhere: false,
    /*
     * 农历总开关。
     * 关闭后**所有日期一律按阳历处理**，与农历无关：
     * 农历相关的转换项（转农历、干支、节气、农历→阳历…）全部不生效，
     * 子开关（大写中文即农历、带号算农历）也一并失效并被隐藏。
     * 打开后各子开关才生效。
     */
    lunarEnabled: true,
    /*
     * 大写中文书写的日期是否一律算农历。
     * 关（默认）：只有「五月十六」「五月十六号」算农历；
     *            带「日」的（五月十六日）按阳历。
     * 开：只要是大写中文书写就按农历（含「五月十六日」），阿拉伯数字一律阳历。
     */
    lunarOnCnUpper: false,
    /*
     * 带「号 / 日」的月日是否都按农历处理。
     * 关（默认）：中文大写（五月十六号）算农历，阿拉伯数字（5月16号）算阳历。
     * 开：只要带「号 / 日」后缀，一律按农历。
     */
    lunarOnHao: false,
    /*
     * ── 时间口径 ──
     * 中文里有几处写法**没有共识**，插件不能替用户拍板：
     * 「周末」是周六还是周日、「下周一」指明天还是下个日历周、
     * 「17号」补本月还是取下月。三项都给默认值，也都能改。
     * 界面上整块折叠（collapseSemantics），只想要默认值的用户不会被打扰。
     */
    /*
     * 周末 → 6=周六（默认）/ 7=周日。
     * 默认周六：与插件一贯的行为一致，也与 Calendar 等插件的映射相同；
     * 习惯把周日当周末的人在「时间口径」里改。
     */
    weekendDay: 6,
    /* 「下周一」：tomorrow=按本周+7天（默认） / nextweek=严格下一个日历周 */
    nextWeekdayMode: 'tomorrow',
    /* 「17号」这类只有日的写法：current=补本月（默认）/ upcoming=已过则取下月 / off=不转换 */
    dayOnlyMode: 'current',
    /* 「时间口径」这一区默认折叠 */
    collapseSemantics: true,
    /*
     * 自定义转换规则。一行一条，格式：被替换文本 操作符 结果
     *   =  替换（用结果顶掉内置转换结果）
     *   +  追加（保留内置结果，再接一段）
     *   -  隐藏（不转换，保持原文）
     * 覆盖不等于抹除：内置规则永远在，用户规则只在其上生效，
     * 删掉用户规则即自动恢复内置结果。
     */
    userRules: '',

    /*
     * 自定义规则是否参与「日历解析」（文件名 → 日期的识别）。
     * 默认关：两套解析混进来会互相干扰（见 _test/userrules.js），
     * 而且默认改动识别行为会让已有的高亮/圆点结果发生变化。
     * 打开后，日历在解析笔记名前先套用同一份规则 —— 用来让旧命名
     * 不必改名也能被认出来。
     */
    userRulesForCalendar: false,

    /*
     * ── 节日转换 ──
     */
    /*
     * 节日转换结果是否补成「节日名 + 日期」。
     * 默认开：无论正向（日期→节日）还是逆向（节日→日期），
     * 输出都统一成「国庆节 2026-10-01」—— 只写「国庆节」看不出是哪年，
     * 只写日期又丢了节日本身的信息，两个方向都带上最完整。
     * 关掉：按各自默认模式 —— 正向只给节日名，逆向只给日期。
     */
    festivalPrefix: true,
    /*
     * 用户自设节日，一行一条，格式见 timejudge.js 的 CUSTOM_FESTIVAL_HELP。
     * 是用户显式输入的有限条目，不是随使用自动增长的缓存。
     */
    customFestivals: '',

    /*
     * 「日期差值」是否额外给出工作日天数。默认关：
     * 工作日要按天遍历一遍区间，长区间（跨数年）有开销；
     * 且只扣周末、不扣法定节假日，给出数字容易让人误以为是精确的请假天数，
     * 需要的人自己开。
     */
    dateDiffWorkdays: false,

    /*
     * 「一周从哪天开始」不在这里 —— 全插件共用一个值：calendar.weekStart。
     * 本模块（第N周、周偏移）与日历视图都读它，避免两处设置互相打架。
     */
  };
}

/**
 * 默认写入模板（记录模块）
 *
 * 用 {{focusText}} / {{restText}} 而不是 {{focus}} / {{rest}}：
 * 前者自带单位，且精度跟随「记录到秒」开关 —— 关则「26 分钟」、开则「25 分 30 秒」。
 * 后者是纯整数分钟，不随开关变化，开了「记录到秒」笔记里也不会有任何区别。
 *
 * ★ 这里不能在占位符后再写「分钟」二字：focusText 自带单位，
 *   写成「{{focusText}} 分钟」会渲染成「25 分 30 秒 分钟」。
 */
const DEFAULT_RECORD_TEMPLATE = [
  '## 🍅 {{date}} {{range}}',
  '- 完成 {{cycles}} 轮 · 长休息 {{longBreaks}} 次',
  '- 专注 {{focusText}} · 休息 {{restText}} · 暂停 {{pauses}} 次',
  '{{skippedLine}}',
  '- 方案：{{profile}}',
].join('\n');

/*
 * 配置结构版本号。
 *
 * 为什么需要它：migrateSettings 是逐个键 hand-pick 的白名单合并，
 * 缺键一律落默认值。这能挡住脏数据，却**分不清两种情况** ——
 * 「老用户从没设过这个键」与「用户主动把它改成了默认值」。
 * 一旦将来把某个键的语义换了（布尔改枚举、分钟改秒、字符串改数组），
 * 没有版本号就只能靠猜，猜错就静默丢用户设置。
 * 有了它，迁移可以按「这份文件是哪个版本写的」决定要不要搬值。
 *
 * 用法：读出来源版本 → 按版本决定是否搬值 → 迁移结束一律写成当前版本。
 * 目前只有 v1，尚无任何需要按版本分支的迁移，此处先把记录点立起来。
 */
const SETTINGS_SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS = {
  /* 配置结构版本（见 SETTINGS_SCHEMA_VERSION）。不参与任何功能判断，只作迁移依据 */
  schemaVersion: SETTINGS_SCHEMA_VERSION,

  /*
   * 界面语言（独立项，不属于任何功能模块）
   * 只影响设置页上显示的字。删掉这一行 + i18n 模块，界面回到全中文。
   */
  uiLang: 'auto',

  /* ---- 模块一：时间戳 ---- */
  timestamp: {
    format: 'YYYY-MM-DD HH:mm:ss', // moment 格式串
    insertNewline: false, // 插入时间戳后是否补换行
    // 斜杠命令默认关闭：/ 是公共资源，容易被 Slash Commander、
    // Templater 等插件同时接管，默认让位，需要时再开。
    enableSlashCommand: false,
    slashTrigger: 'now', // 自定义触发词（不含斜杠）
    extensions: defaultExtensions(), // 扩展：时间文本转换（总开关 + 逐项开关）
    // 时间转换结果是否用英文输出（相对时间 / 星期 / 内置节日名）。
    // null = 从未设置过，按界面语言默认：中文关、非中文开。
    englishOutput: null,
  },

  /* ---- 模块二：番茄钟 ---- */
  pomodoro: {
    // 界面
    uiMode: 'floating', // 'floating' 浮窗 | 'sidebar' 侧边栏 | 'popout' 独立窗口
    // 独立窗口的尺寸（像素）与位置。
    // 尺寸走 openPopoutLeaf 的 size 参数；Electron 窗口 API 可达时，
    // 还会用 setBounds 精确落位（见 pomowin.js）。0 表示交给系统决定。
    popoutWidth: 616,
    popoutHeight: 406,
    // 开窗时把窗口放到屏幕的哪个角；'system' = 不干预。
    // 位置必须在 pop-out 那份实例里设置才有效（主窗口改不到它），见 pomowin.js。
    popoutPos: 'bottom-right',
    // 置顶：让番茄钟窗口浮在其他应用之上。Electron 窗口 API 不可达时静默失效。
    popoutAlwaysOnTop: true,
    // 无边框：隐藏窗口内的标签栏 / 状态栏 / 侧边栏，让番茄钟铺满内容区。
    // 注意：系统标题栏去不掉（Electron 的 frame 只能建窗时指定），见 pomowin.js 顶部说明。
    popoutBorderless: true,
    /*
     * 桌面常驻（方案 B）：把主窗口缩成番茄钟大小、置顶、摆到屏幕角上。
     * 存在的原因：独立窗口去不掉系统标题栏（见 pomowin.js 顶部），
     * 达不到「桌面上一个无边框小番茄钟」的效果，所以反过来缩小主窗口。
     * deskDockRestore 是关闭时用来还原主窗口的原始 bounds ——
     * 不存下来就意味着关掉开关后主窗口再也回不去，那比不做这功能更糟。
     * 它只在开启期间有值，关闭时立刻清空，不会留在 data.json 里。
     */
    deskDock: false,
    deskDockWidth: 365,
    deskDockHeight: 378,
    deskDockOnTop: true,
    deskDockPos: 'bottom-right',
    deskDockRestore: null,
    snapToEdge: true, // 拖动松手后是否吸附到最近的边
    floatEdge: 'right', // 吸附边：top / bottom / left / right
    floatOffset: 0.62, // 沿吸附边的位置比例 0~1（视口尺寸变化时用）
    floatPx: null, // 沿吸附边的精确像素值（视口尺寸未变时优先用）
    freeX: 0.72, // 不吸附时的自由位置（横向比例）
    freeY: 0.62, // 不吸附时的自由位置（纵向比例）
    freePxX: null, // 不吸附时的精确像素 X
    freePxY: null, // 不吸附时的精确像素 Y
    lastVw: 0, // 上次记录位置时的视口宽度，用于判断能否复用像素值
    lastVh: 0, // 上次记录位置时的视口高度
    showRibbonIcon: false, // 是否在左侧栏显示番茄钟图标

    // 主题：见 settings.js 顶部的 VALID_POMO_THEME。
    // classic 保持默认：老用户升级后看到的和之前一样。
    theme: 'classic',
    // 自定义主题用的 CSS 原文（仅 theme === 'custom' 时注入）。
    // 存的是文本而非文件路径：用户改完立刻生效，也免去读文件的异步与失败处理。
    customCss: '',

    // 时长方案：profiles 是来源，下面三个字段是当前生效值的副本
    profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
    activeProfileId: 'study',
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,

    // 节奏
    longBreakInterval: 4, // 每完成几轮询问一次长休息
    resetAfterLongBreak: true, // 长休息结束后计数清零
    declineBehavior: 'afterInterval', // 拒绝长休息后再问的时机
    lastCycleChoice: null, // 上次选的轮数；null 表示不限
    autoStartNext: true, // 段结束后是否自动进入下一段；false 为手动模式
    pauseThreshold: 3, // 暂停达到几次后提示是否重开本轮

    // 正计时：专注段不限时，从 0 往上累加，只能手动结束（点「跳过」或结束会话）。
    // 默认关 —— 番茄钟的经典用法是倒计时，正计时只给需要统计实际用时的场景。
    // 只对专注段生效：休息段本来就是固定时长，正计时没有意义。
    countUp: false,
    // 正计时的软目标（分钟）：到点弹一次提醒，但不结束计时。0 表示不提醒。
    countUpTargetMin: 0,
    // 正计时的硬上限（分钟）：累加到这么多分钟就自动停表，默认 24 小时。
    // 忘了停的话它会一直跑下去，而超过一天的专注数据通常意味着「人已经不在了」，
    // 所以到点直接停、且**不计入统计**，由用户重新开始。填 0 表示不设上限。
    countUpMaxMin: 1440,
    // 正计时的间隔提醒（分钟）：每累加到这个倍数的分钟就提醒一次（20 → 20/40/60 各一次）。
    // 0 表示不提醒。与软目标的区别：软目标只提醒一次，这个是持续每隔一段提醒一次。
    countUpRemindEveryMin: 0,
    /*
     * 累计统计的数据源，由用户自选。默认 'off'（不统计、也不占任何存储）：
     *   'note'   解析会话记录笔记 —— 持久、换设备也在，但依赖写入格式不被改动
     *   'memory' 每次会话结束累加到 statsMemory —— 与笔记格式无关，但只在本机
     *   'custom' 解析 statsCustomPath 指定的笔记或文件夹 —— 位置由用户定，
     *            与番茄钟默认记录笔记解耦（换记录位置也不会读不到）
     *   'off'    不统计
     * 「不积累废弃数据」：memory 只存固定 4 个字段，不按日期堆条目。
     */
    statsSource: 'off',
    statsMemory: { totalFocusMs: 0, todayFocusMs: 0, todayDate: '', sessions: 0 },
    /*
     * 数据源＝「自定义位置」时的读取目标：一个 .md 笔记路径，或一个文件夹路径。
     * 留空则按 off 处理（不给静默的 0）。
     */
    statsCustomPath: '',
    /*
     * DataView 联动总开关（默认关）。
     * 开启后写会话记录时，按 dataviewFields 追加 DataView 内联字段，
     * 供用户自己的 dataview 查询读取。关着的时候一个字都不多写。
     * 只在写入路径上追加，不改动任何既有解析逻辑。
     */
    dataviewEnabled: false,
    /*
     * DataView 字段表：一行一个，格式 `字段名::{{VALUE:变量名}}`。
     * 默认只写专注时长 —— 记什么由用户自己加行，不替他决定。
     * 留空（用户手动清空）则一行都不写。
     */
    dataviewFields: '专注时长::{{VALUE:focusText}}',

    // 提醒
    notifyOnSegmentEnd: true, // 段结束时弹 Obsidian 通知
    // 结束类弹窗需要点几次「弹窗外部」才关闭。
    // 番茄结束时手常常还在点，点快了小结一闪而过就消失，所以默认要求 3 次。
    // 弹窗内的按钮和 Esc 是明确操作，不受这个次数限制。
    dismissClicks: 3,
    soundEnabled: false, // 是否播放提示音
    soundSource: 'builtin', // 'builtin' 内置合成音 | 'folder' 自定义文件夹
    soundFolder: '', // 自定义音频文件夹（库内路径，如 音效/提示音）

    // 斜杠命令：默认关闭，原因同时间戳模块（`/` 是公共资源，容易被同类插件接管）
    enableSlashCommand: false,
    slashTrigger: 'pomodoro',

    // 其他
    showHints: true, // 超范围时显示灰色建议文案
    lastSettingsTab: 'timestamp', // 设置页上次停留的标签
    /*
     * 设置页每个标签上次滚到的位置（px），重载插件后用于还原。
     * 只存 3 个数字、键名固定，不会随使用增长；
     * 迁移时按标签白名单清洗，旧标签残留会被清掉。
     */
    lastSettingsScroll: {},
  },

  /* ---- 模块四：日历 ---- */
  calendar: {
    /*
     * 日历网格里月份名 / 星期名的显示语言。
     * auto = 跟随上面的「显示语言」；也可单独指定（界面英文、日历想看中文月份）。
     * 只改这两个名字的显示，周起始日、日期数字、圆点、高亮、笔记命名一律不受影响。
     */
    lang: 'auto', // auto | zh | en

    // 补 window._bundledLocaleWeekSpec 默认值时用的周起始日
    weekStart: 'locale', // locale | sunday | monday | … | saturday
    /*
     * 修复 Calendar 设置页空白（只补不覆盖，绝不动 moment 全局 locale）。
     * 默认关：它往 window 上补一个全局变量，属于"没有出问题就别动"的兜底，
     * 由用户在 Calendar 设置页真的空白时自行打开（开关在 Bug 折叠区里）。
     */
    calendarFixEnabled: false,

    // time tools 日历视图：点年/月/日/周生成对应笔记。默认关
    ownCalendarEnabled: false,
    // 在 Calendar 插件视图上接管年/月/周点击。默认关（依赖其内部 DOM）
    enhanceCalendarEnabled: false,
    /*
     * 分流：日/周交回 Calendar 原生，只有月/年由本插件生成。默认关 = 全部接管。
     * 适用于日记/周记已由 Calendar 配置妥当、只想补上月记/年记的场景。
     * 依赖 enhanceCalendarEnabled（开启时会自动打开它）。
     */
    nativeDayWeek: false,
    /*
     * 两个日历能否同时开启。默认 false = 互斥：
     * 开启「在 Calendar 视图上接管点击」会自动关掉并收起 time tools 日历。
     * 两者都往工作区塞日历面板，同时开会出现两个日历各自为政的割裂状态，
     * 所以默认互斥；确有特殊需要才由用户显式打开双开。
     */
    allowBoth: false,

    /*
     * 「如果 Calendar 插件出现 Bug 请打开」—— 纯粹的折叠开关，不参与任何逻辑。
     * 默认 false（收起）：Bug 修复与兜底都收在里面，正常用户不必看到。
     * 折叠只影响设置页是否渲染这些项，里面的开关状态照常生效。
     */
    bugFoldOpen: false,

    /*
     * Templater 桥接：Calendar 原生新建的笔记补跑一次 Templater。
     * 默认关（功能类开关一律默认关）；日历区打开后按需自行开启。
     * 关掉三个日历开关、改用 Calendar 原生功能的人恰恰最需要这项兜底，
     * 因为 Calendar 用不了 Templater（见 calendar.js 注释）。
     */
    templaterBridge: false,

    // 是否显示日期下的字数圆点。默认开（日记写了多少字一眼可见，属基础反馈）
    dotsEnabled: true,

    // 每个圆点代表多少字（对齐 Calendar 的 Words per dot）。
    // <=0 或未配置时退化为「有笔记画 1 点」
    wordsPerDot: 250,

    /*
     * 格子固定尺寸模式：格子高度固定、不随面板拉伸填满，排布更紧凑。
     * 默认开 —— 面板拉高时格子不会跟着被拉成扁条（那是日历显示类 Bug）。
     * 关时为自适应（6 行均分可用高度，面板拉高填满）。
     */
    fixedCellSize: true,

    /*
     * 日期格显示农历（初一显示月名，其余显示农历日）。
     * 默认关 —— 格子里多一行字会让日历变挤，且不是所有人都需要。
     * 打开后**取代**圆点：格子下方空间有限，两样都放会挤成一团，
     * 「有笔记」改用农历旁边一个小点表示（不再按字数画多个点）。
     * 与圆点互斥，不是叠加，所以渲染时只看这一个开关。
     */
    lunarOnCalendar: false,
  },

  /* ---- 模块五：周期性笔记 ---- */
  notes: {
    // Templater 不可用时是否用内置模板顶替。默认关：
    // 静默降级会生成内容不符预期的笔记，不如明确提示
    fallbackToBuiltin: false,
    // altFormats：用户补充的文件名格式，仅用于识别已有笔记（高亮 / 打开），
    // 新建只认 format。留空则用内置常见格式兜底。
    daily: { folder: '', format: 'YYYY-MM-DD', template: '', altFormats: '' },
    weekly: { folder: '', format: 'gggg-[W]ww', template: '', altFormats: '' },
    monthly: { folder: '', format: 'YYYY-MM', template: '', altFormats: '' },
    yearly: { folder: '', format: 'YYYY', template: '', altFormats: '' },
  },

  /* ---- 模块三：会话记录 ---- */
  record: {
    enabled: true,  // 总开关；关闭时完全不记录，弹窗也不显示「记录」按钮
    autoRecord: false, // 是否自动记录：开启则番茄结束自动记，关闭则只在点「记录」时写
    mode: 'builtin', // 'builtin' 内置写入 | 'quickadd' 联动 QuickAdd | 'clipboard' 仅剪贴板
    defaultNoteName: '番茄记录', // 内置写入的笔记名
    folder: '', // 内置写入的文件夹，留空为库根目录
    template: DEFAULT_RECORD_TEMPLATE, // 内置写入 / 剪贴板模板
    quickAddChoice: '', // QuickAdd 选项名
    copyBeforeQuickAdd: true, // QuickAdd 执行前先把结果复制到剪贴板，便于手动粘贴
    strictChoiceName: false, // 严格校验选项名；列表可能不含嵌套选项，默认关闭
    fallbackToBuiltin: true, // 联动失败时回退内置写入；关闭则失败即放弃，默认开启
    // 记录精度：关闭（默认）按分钟记，秒位直接舍去；打开则记到秒。
    // 正计时与倒计时共用这一个开关 —— 精度是「你希望笔记里多细」，
    // 跟用哪种计时方式无关，分开两个开关只会让人纠结该开哪个。
    recordSeconds: false,
  },
};

/** 深拷贝默认值，避免多处共享同一份对象 */
function defaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

/**
 * 恢复某个配置分区的默认值。
 *
 * 只重置传入的 top-level key（timestamp / pomodoro / calendar / notes 等），
 * 其余分区原样保留 —— 用户点「恢复默认」时期望的是重来这一块，
 * 而不是把整个插件的设置都清空。
 *
 * @param {object} plugin
 * @param {string|string[]} keys 要重置的分区名
 * @returns {string[]} 实际被重置的分区名
 */
function resetSection(plugin, keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const fresh = defaults();
  const done = [];
  list.forEach((k) => {
    if (!(k in fresh)) return;
    plugin.settings[k] = fresh[k];
    done.push(k);
  });
  return done;
}

/**
 * 在设置区末尾追加「恢复默认设置」按钮。
 * 带二次确认：误点一下就把整块配置清空，代价太大。
 */
function addResetButton(containerEl, plugin, keys, label) {
  const wrap = containerEl.createDiv({ cls: 'tt-reset-row' });
  wrap.createEl('span', {
    cls: 'tt-reset-hint',
    text: label
      ? i18nT('kea7cf0cd', '将「{0}」这一区的设置恢复为默认值，其余分区不受影响。', label)
      : '',
  });
  const btn = wrap.createEl('button', { cls: 'tt-reset-btn', text: i18nT('k3c470548', '恢复默认设置') });
  btn.onclick = async () => {
    const ok = await confirmReset(plugin, label || i18nT('k3fcfce8a', '本区'));
    if (!ok) return;
    resetSection(plugin, keys);
    await plugin.saveSettings();
    plugin.redrawSettingsTab();
    new obsidian.Notice(i18nT('ka283fa1a', '已恢复默认设置：{0}', label || i18nT('k3fcfce8a', '本区')));
  };
}

/** 二次确认弹窗，避免误点清空 */
/**
 * 通用二次确认弹窗。
 *
 * 危险操作（恢复默认、关闭记录总开关）都走这里，避免每处重写一遍 Modal 样板。
 *
 * @param {object} plugin
 * @param {object} opt title / content / okText / cancelText / warning
 * @returns {Promise<boolean>} 只有点「确定」才为 true
 */
function confirmDialog(plugin, opt) {
  return new Promise((resolve) => {
    const modal = new obsidian.Modal(plugin.app);
    modal.setTitle(opt.title || i18nT('k43d586cd', '请确认'));
    modal.contentEl.addClass('tt-confirm-content');
    modal.setContent(opt.content || '');
    const row = modal.contentEl.createDiv({ cls: 'tt-reset-confirm' });
    new obsidian.ButtonComponent(row)
      .setButtonText(opt.cancelText || i18nT('k625fb26b', '取消'))
      .onClick(() => { modal.close(); resolve(false); });
    const ok = new obsidian.ButtonComponent(row)
      .setButtonText(opt.okText || i18nT('k38cf16f2', '确定'))
      .setCta();
    if (opt.warning) ok.setWarning();
    ok.onClick(() => { modal.close(); resolve(true); });
    modal.open();
  });
}

function confirmReset(plugin, label) {
  return confirmDialog(plugin, {
    title: i18nT('kf41e9fe3', '确认恢复默认设置'),
    content: i18nT(
      'k7a3cc52d',
      '确定要把「{0}」这一区的设置恢复为默认值吗？\n\n此操作只影响该分区，其余分区保持不变。',
      label
    ),
    okText: i18nT('kc7db6d4f', '恢复'),
    warning: true,
  });
}

/** 数值兜底：非正数或非数字时回退到 fallback */
function num(value, fallback) {
  return typeof value === 'number' && isFinite(value) && value > 0 ? value : fallback;
}

/** 比例兜底：裁剪到 0~1 */
function ratio(value, fallback) {
  return typeof value === 'number' && isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

/** 生成方案 ID：用时间戳保证唯一 */
function makeProfileId() {
  return 'p' + Date.now().toString(36);
}

/**
 * 把方案时长同步为当前生效值。
 * 计时器只读 focusMin / shortBreakMin / longBreakMin，切换方案时调用本函数。
 */
function applyProfile(settings, profileId) {
  const p = settings.pomodoro;
  const profile =
    p.profiles.find((item) => item.id === profileId) ||
    p.profiles.find((item) => item.id === p.activeProfileId) ||
    p.profiles[0];
  if (!profile) return;
  p.activeProfileId = profile.id;
  p.focusMin = num(profile.focusMin, 25);
  p.shortBreakMin = num(profile.shortBreakMin, 5);
  p.longBreakMin = num(profile.longBreakMin, 15);
}

/**
 * 迁移旧配置。
 * 旧版 data.json 是扁平结构（format / insertNewline 直接躺在根节点），
 * 这里把它搬进 timestamp 分组，保证升级后用户自定义的时间格式不丢。
 */
/**
 * 只保留 defaults 里存在的键，其余一律丢弃。
 * 目的：防止废弃配置在 data.json 里无限堆积。
 * 键名以 defaults 为准；src 里的值必须类型匹配才采用，否则用默认值。
 */
function pickKnown(defaults, src) {
  const out = {};
  Object.keys(defaults).forEach((k) => {
    const dv = defaults[k];
    const sv = src && Object.prototype.hasOwnProperty.call(src, k) ? src[k] : undefined;
    if (sv === undefined) {
      out[k] = dv;
      return;
    }
    // 类型不一致（如旧版本存成了字符串）时退回默认值，避免脏数据扩散
    if (dv !== null && typeof dv !== typeof sv) {
      out[k] = dv;
      return;
    }
    if (Array.isArray(dv) !== Array.isArray(sv)) {
      out[k] = dv;
      return;
    }
    out[k] = sv;
  });
  return out;
}

/**
 * notes 的嵌套白名单合并。
 *
 * 顶层 pickKnown 只校验到 notes.daily 这一层，里面多出来的键会一直留在
 * data.json。四种笔记结构相同，这里逐层再过一遍，废弃键随版本自动清除。
 */
function pickKnownNotes(raw) {
  const out = pickKnown(DEFAULT_SETTINGS.notes, raw);
  ['daily', 'weekly', 'monthly', 'yearly'].forEach((k) => {
    if (out[k] && typeof out[k] === 'object') {
      out[k] = pickKnown(DEFAULT_SETTINGS.notes[k], out[k]);
    }
  });
  return out;
}

function migrateSettings(raw) {
  if (!raw || typeof raw !== 'object') return defaults();

  // 只有旧版才会同时满足：没有 timestamp 键 + 根节点有 format
  const isLegacy = raw.timestamp === undefined && raw.format !== undefined;

  /*
   * 来源版本：这份 data.json 是哪个结构版本写的。
   * 缺这个键（v1 之前的配置）一律按 0 处理 —— 将来若某个键改了语义，
   * 就在这里按 fromVersion 判断要不要搬值，搬完再把 next.schemaVersion 升上去。
   * 现在没有任何需要按版本分支的迁移，先把这个判断点留好。
   */
  const fromVersion = Number.isFinite(Number(raw.schemaVersion)) && Number(raw.schemaVersion) > 0
    ? Number(raw.schemaVersion)
    : 0;

  /*
   * 只用**白名单**合并，不整体 Object.assign。
   *
   * Object.assign 会把用户 data.json 里的**废弃键原样留下** ——
   * 每删一个设置项，那些旧数据就永久堆积在文件里，越积越多。
   * 白名单合并保证：DEFAULT_SETTINGS 里没有的键一律不进产物。
   */
  const next = {
    /*
     * 迁移后一律写成当前结构版本。
     * 老配置读进来时 fromVersion 是 0，搬完值就升到 1 —— 下次再读就不是老数据了。
     */
    schemaVersion: SETTINGS_SCHEMA_VERSION,

    /*
     * 界面语言是独立顶层项，不属于任何分区。
     * 必须在这里显式带上：下面的分区都是逐个 hand-pick 的，
     * 顶层键漏了就会被第二次迁移清掉（表现为重启后语言跳回中文）。
     */
    uiLang: normalizeLang(raw.uiLang),
    timestamp: pickKnown(DEFAULT_SETTINGS.timestamp, isLegacy ? raw : raw.timestamp),
    pomodoro: pickKnown(DEFAULT_SETTINGS.pomodoro, raw.pomodoro),
    record: pickKnown(DEFAULT_SETTINGS.record, raw.record),
    calendar: pickKnown(DEFAULT_SETTINGS.calendar, raw.calendar),
    notes: pickKnownNotes(raw.notes),
  };

  /*
   * 周起始日合并：旧版本在 timestamp.extensions.weekStart 也存了一份。
   * 现在统一到 calendar.weekStart —— 若日历那边还是默认值、而旧的这份被改过，
   * 就把旧值搬过去，别让用户的设置白丢。
   * （旧键已从 DEFAULT_SETTINGS 删除，pickKnown 会自动把它从 data.json 清掉）
   */
  const legacyWs = ((raw && raw.timestamp && raw.timestamp.extensions) || {}).weekStart;
  if (next.calendar.weekStart === 'locale' && ['monday', 'sunday'].indexOf(legacyWs) >= 0) {
    next.calendar.weekStart = legacyWs;
  }
  /*
   * 值域校验：pickKnown 只比对类型（string/string 就放行），
   * 挡不住 'xxx' 这类非法枚举值 —— 它会被原样存回 data.json 并扩散到周数计算。
   * 周起始日是枚举，必须按合法取值清洗。
   */
  if (VALID_WEEK_START.indexOf(next.calendar.weekStart) < 0) {
    next.calendar.weekStart = 'locale';
  }
  /* 日历语言同样是枚举，非法值（含被删档位或手改的脏值）一律回 auto */
  if (['auto', 'zh', 'en'].indexOf(next.calendar.lang) < 0) {
    next.calendar.lang = 'auto';
  }

  /*
   * 主题是枚举，同样要按合法取值清洗。
   * pickKnown 只比对类型（string/string 就放行），挡不住 'xxx' 这种脏值
   * —— 它会被原样存回 data.json，界面上表现为「主题下拉显示空白」。
   */
  if (VALID_POMO_THEME.indexOf(next.pomodoro.theme) < 0) {
    next.pomodoro.theme = DEFAULT_SETTINGS.pomodoro.theme;
  }
  /*
   * 界面形态同样是枚举：pickKnown 只比对类型（string/string 就放行），
   * 挡不住 'popuot' 这类拼写错误 —— 它会原样存回 data.json，
   * 界面上表现为「下拉框显示空白」，且独立窗口永远开不出来。
   */
  if (VALID_POMO_UI_MODE.indexOf(next.pomodoro.uiMode) < 0) {
    next.pomodoro.uiMode = DEFAULT_SETTINGS.pomodoro.uiMode;
  }
  // 尺寸必须是有限非负数：NaN 会被 JSON 序列化成 null，再读回来又是另一种脏数据
  ['popoutWidth', 'popoutHeight'].forEach((k) => {
    const v = Number(next.pomodoro[k]);
    next.pomodoro[k] = isFinite(v) && v > 0 ? Math.round(v) : 0;
  });
  // 位置同样是枚举：拼错的值会让窗口永远停在默认值上，界面上却看不出原因
  if (VALID_POPOUT_POS.indexOf(next.pomodoro.popoutPos) < 0) {
    next.pomodoro.popoutPos = DEFAULT_SETTINGS.pomodoro.popoutPos;
  }
  // 置顶 / 无边框必须是布尔：存成字符串 'false' 会被当成 true
  ['popoutAlwaysOnTop', 'popoutBorderless'].forEach((k) => {
    if (typeof next.pomodoro[k] !== 'boolean') {
      next.pomodoro[k] = DEFAULT_SETTINGS.pomodoro[k];
    }
  });
  /*
   * 桌面常驻：开关是布尔，尺寸是非负数，存档要么是可用的 bounds 要么是 null。
   * deskDockRestore 残缺时一律清成 null —— 拿残缺存档去还原会把主窗口设成怪尺寸，
   * 宁可让用户手动调一次，也不能把窗口搞坏。
   */
  ['deskDock', 'deskDockOnTop'].forEach((k) => {
    if (typeof next.pomodoro[k] !== 'boolean') {
      next.pomodoro[k] = DEFAULT_SETTINGS.pomodoro[k];
    }
  });
  ['deskDockWidth', 'deskDockHeight'].forEach((k) => {
    const v = Number(next.pomodoro[k]);
    next.pomodoro[k] = isFinite(v) && v > 0 ? Math.round(v) : 0;
  });
  if (VALID_POPOUT_POS.indexOf(next.pomodoro.deskDockPos) < 0) {
    next.pomodoro.deskDockPos = DEFAULT_SETTINGS.pomodoro.deskDockPos;
  }
  const rb = next.pomodoro.deskDockRestore;
  if (rb !== null && !(rb && Number(rb.width) > 0 && Number(rb.height) > 0)) {
    next.pomodoro.deskDockRestore = null;
  }
  // customCss 必须是字符串：老配置里若存成了别的类型，CSS 注入会抛异常
  if (typeof next.pomodoro.customCss !== 'string') {
    next.pomodoro.customCss = '';
  }
  /*
   * 滚动位置记忆：只保留当前存在的标签、只保留有限非负数。
   * 标签改名 / 被合并后，旧键会永远留在 data.json 里，这里统一清掉。
   */
  next.pomodoro.lastSettingsScroll = cleanScrollMemo(next.pomodoro.lastSettingsScroll);

  const p = next.pomodoro;
  const d = DEFAULT_SETTINGS.pomodoro;
  const d2 = DEFAULT_SETTINGS.record;

  // 方案列表：缺失或为空时补内置方案
  if (!Array.isArray(p.profiles) || p.profiles.length === 0) {
    p.profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
  } else {
    // 逐项清洗，去掉缺字段或非法时长的脏数据
    p.profiles = p.profiles
      .filter((item) => item && typeof item.name === 'string')
      .map((item) => ({
        id: item.id || makeProfileId(),
        name: item.name,
        focusMin: num(item.focusMin, 25),
        shortBreakMin: num(item.shortBreakMin, 5),
        longBreakMin: num(item.longBreakMin, 15),
      }));
  }

  // 关键数值兜底，防止旧数据里出现 undefined / 0 / NaN 导致计时异常
  p.focusMin = num(p.focusMin, d.focusMin);
  p.shortBreakMin = num(p.shortBreakMin, d.shortBreakMin);
  p.longBreakMin = num(p.longBreakMin, d.longBreakMin);
  p.longBreakInterval = num(p.longBreakInterval, d.longBreakInterval);
  p.pauseThreshold = num(p.pauseThreshold, d.pauseThreshold);
  p.countUp = typeof p.countUp === 'boolean' ? p.countUp : d.countUp;
  p.countUpTargetMin = Math.max(0, num(p.countUpTargetMin, d.countUpTargetMin));
  p.countUpMaxMin = Math.max(0, num(p.countUpMaxMin, d.countUpMaxMin));
  // 统计数据源必须是四者之一，写错就退回 off（不统计，也不存任何东西）
  p.statsSource = ['note', 'memory', 'custom', 'off'].indexOf(p.statsSource) >= 0 ? p.statsSource : 'off';
  p.statsCustomPath = typeof p.statsCustomPath === 'string' ? p.statsCustomPath : '';
  p.dataviewEnabled = typeof p.dataviewEnabled === 'boolean' ? p.dataviewEnabled : d.dataviewEnabled;
  // 老配置没有这个键（v3.14 之前联动是写死的一行），补齐默认＝保持原有行为
  p.dataviewFields = typeof p.dataviewFields === 'string' ? p.dataviewFields : d.dataviewFields;
  const sm = p.statsMemory && typeof p.statsMemory === 'object' ? p.statsMemory : {};
  p.statsMemory = {
    totalFocusMs: Math.max(0, num(sm.totalFocusMs, 0)),
    todayFocusMs: Math.max(0, num(sm.todayFocusMs, 0)),
    todayDate: typeof sm.todayDate === 'string' ? sm.todayDate : '',
    sessions: Math.max(0, num(sm.sessions, 0)),
  };
  p.countUpRemindEveryMin = Math.max(0, num(p.countUpRemindEveryMin, d.countUpRemindEveryMin));
  p.floatOffset = ratio(p.floatOffset, d.floatOffset);
  p.freeX = ratio(p.freeX, d.freeX);
  p.freeY = ratio(p.freeY, d.freeY);

  // 同步方案到生效值；旧版没有 profiles 时用已有字段反填默认方案
  if (p.profiles.every((item) => item.id !== p.activeProfileId)) {
    p.activeProfileId = p.profiles[0].id;
    applyProfile(next, p.activeProfileId);
  } else {
    applyProfile(next, p.activeProfileId);
  }

  // 时间转换扩展：补齐新增项、剔除废弃键，避免设置项越积越多。
  // 整体替换为新对象，避免改到 DEFAULT_SETTINGS 里的常量引用。
  const srcExt = (isLegacy ? {} : (raw && raw.timestamp && raw.timestamp.extensions)) || {};
  const dExt = DEFAULT_SETTINGS.timestamp.extensions;
  const cleanItems = defaultActionItems();
  ACTION_KEYS.forEach((key) => {
    if (srcExt.items && typeof srcExt.items[key] === 'boolean') {
      cleanItems[key] = srcExt.items[key];
    }
  });
  next.timestamp.extensions = {
    enabled: typeof srcExt.enabled === 'boolean' ? srcExt.enabled : dExt.enabled,
    items: cleanItems,
    dailyLinkFormat:
      typeof srcExt.dailyLinkFormat === 'string' && srcExt.dailyLinkFormat.trim()
        ? srcExt.dailyLinkFormat.trim()
        : dExt.dailyLinkFormat,
    appendOnAutoPick:
      typeof srcExt.appendOnAutoPick === 'boolean'
        ? srcExt.appendOnAutoPick
        : dExt.appendOnAutoPick,
    showRelativeBase:
      typeof srcExt.showRelativeBase === 'boolean'
        ? srcExt.showRelativeBase
        : dExt.showRelativeBase,
    separateDirections:
      typeof srcExt.separateDirections === 'boolean'
        ? srcExt.separateDirections
        : dExt.separateDirections,
    collapseItems:
      typeof srcExt.collapseItems === 'boolean'
        ? srcExt.collapseItems
        : dExt.collapseItems,
    preciseToSecond:
      typeof srcExt.preciseToSecond === 'boolean'
        ? srcExt.preciseToSecond
        : dExt.preciseToSecond,
    convertDaypartAlone:
      typeof srcExt.convertDaypartAlone === 'boolean'
        ? srcExt.convertDaypartAlone
        : dExt.convertDaypartAlone,
    /*
     * daypartHours 只保留认识的时间段键，且必须落在 0–23。
     * 这样即使用户改坏了或塞了废弃键，也不会让数据无限堆积。
     */
    daypartHours: J.cleanDaypartHours(srcExt.daypartHours),
    lunarEnabled:
      typeof srcExt.lunarEnabled === 'boolean' ? srcExt.lunarEnabled : dExt.lunarEnabled,
    lunarMarkAnywhere:
      typeof srcExt.lunarMarkAnywhere === 'boolean'
        ? srcExt.lunarMarkAnywhere
        : dExt.lunarMarkAnywhere,
    // 限制长度，避免误填超长内容让设置文件膨胀
    unifyFormat:
      typeof srcExt.unifyFormat === 'string' ? srcExt.unifyFormat.slice(0, 60) : '',
    undoHintEnabled:
      typeof srcExt.undoHintEnabled === 'boolean'
        ? srcExt.undoHintEnabled
        : dExt.undoHintEnabled,
    // 标识必须很短，否则会污染笔记正文

    lunarOnHao:
      typeof srcExt.lunarOnHao === 'boolean' ? srcExt.lunarOnHao : dExt.lunarOnHao,
    lunarOnCnUpper:
      typeof srcExt.lunarOnCnUpper === 'boolean' ? srcExt.lunarOnCnUpper : dExt.lunarOnCnUpper,
    /*
     * 时间口径三项 + 折叠开关。
     * 必须在这里逐个收进来（只写在 DEFAULT_SETTINGS 里不够）：next 是逐字段
     * 构造的，漏一个就会在**每次迁移时被丢掉**，
         * 结果是设置改完重启就没了（迁移不幂等）。
     * 值非法时退回默认，避免脏数据扩散。
     */
    weekendDay: J.cleanJudgement('weekendDay', srcExt.weekendDay),
    nextWeekdayMode: J.cleanJudgement('nextWeekdayMode', srcExt.nextWeekdayMode),
    dayOnlyMode: J.cleanJudgement('dayOnlyMode', srcExt.dayOnlyMode),
    collapseSemantics:
      typeof srcExt.collapseSemantics === 'boolean'
        ? srcExt.collapseSemantics
        : dExt.collapseSemantics,
    /*
     * 节日转换两项。同样是后加的字段，漏在这里会每次迁移被丢掉。
     * 自设节日文本限制长度，避免误贴长文让 data.json 膨胀。
     */
    festivalPrefix:
      typeof srcExt.festivalPrefix === 'boolean'
        ? srcExt.festivalPrefix
        : dExt.festivalPrefix,
    customFestivals:
      typeof srcExt.customFestivals === 'string'
        ? srcExt.customFestivals.slice(0, 4000)
        : '',
    /*
     * 自定义规则是纯文本，只做类型与长度收敛。
     * 不在这里解析——解析留给 timestamp.js，两边各算一份迟早不同步。
     */
    userRules:
      typeof srcExt.userRules === 'string'
        ? srcExt.userRules.slice(0, 20000)
        : '',
    userRulesForCalendar:
      typeof srcExt.userRulesForCalendar === 'boolean'
        ? srcExt.userRulesForCalendar
        : dExt.userRulesForCalendar,
    dateDiffWorkdays:
      typeof srcExt.dateDiffWorkdays === 'boolean'
        ? srcExt.dateDiffWorkdays
        : dExt.dateDiffWorkdays,
    // weekStart 已统一到 calendar.weekStart，此处不再生成（见上方合并逻辑）
  };

  // 记录模块：模式非法时回退内置写入，笔记名为空时补默认名
  const r = next.record;
  const validModes = ['builtin', 'quickadd', 'clipboard'];
  if (validModes.indexOf(r.mode) === -1) r.mode = d2.mode;
  if (!String(r.defaultNoteName || '').trim()) r.defaultNoteName = d2.defaultNoteName;
  if (!String(r.template || '').trim()) r.template = d2.template;

  /*
   * 按来源版本搬值的入口（目前为空 —— v1 还没有任何改过语义的键）。
   * 将来某个键换了语义时在这里补：
   *   if (fromVersion < 2) { next.xxx = 由旧值换算出的新值; }
   * 换算是单向的，只能靠版本号判断该不该做，不能靠「值是否等于默认值」猜。
   */
  if (fromVersion < SETTINGS_SCHEMA_VERSION) {
    // v1 → 当前：无需要搬运的键
  }

  return next;
}

/**
 * 设置页：只向 Obsidian 注册一个入口，顶部标签切换两个模块。
 * 附加区块在 SECTIONS 登记一行即可，渲染在对应标签内容最下方。
 */

/** 标签定义：key 与 settings.pomodoro.lastSettingsTab 对应 */
/*
 * 标签：label 是中文原文（同时充当兜底），labelKey 是稳定 key。
 * 之所以不在 label 里直接调 i18nT：TABS 是模块级常量，
 * 那时语言还没从设置里读出来，写死就等于永远停在中文字面值上。
 */
const TABS = [
  { key: 'timestamp', label: '时间戳', labelKey: 'tab.ts' },
  { key: 'pomodoro', label: '番茄钟', labelKey: 'tab.pomo' },
  { key: 'calendar', label: '日历', labelKey: 'tab.cal' },
  { key: 'lang', label: '界面语言', labelKey: 'tab.lang' },
];

/**
 * 滚动位置还原的重试时机（ms）。
 *
 * 不是拍脑袋定的：日历页的「立即应用」按钮和部分预览按 200ms 轮询重绘，
 * 会把刚设好的 scrollTop 冲掉。实测单次设置在 30ms 命中、80ms 被顶开、
 * 500ms 甚至归零，必须覆盖到 800ms 才稳定。
 */
const SCROLL_ATTEMPTS = [0, 30, 80, 150, 300, 500, 800];

/**
 * 滚动位置记忆的键：与 TABS 的 key 一一对应。
 * 值域只有这三项，迁移时按此清洗，避免旧标签残留。
 */
const SCROLL_KEYS = ['timestamp', 'pomodoro', 'calendar', 'lang'];

/**
 * 向上找真正可滚动的容器。
 *
 * Obsidian 的设置内容区是 containerEl 的某个祖先（不同版本层级不同，
 * 直接写死某一层会在版本升级后失效），这里按「能滚动」这个事实来找。
 */
function findScrollParent(el) {
  let node = el && el.parentElement;
  while (node) {
    if (node.scrollHeight - node.clientHeight > 4) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * 清洗滚动位置记忆：只留已知标签、只留有限非负数。
 * 脏值（负数、NaN、字符串）一律丢弃，不让它扩散到恢复逻辑。
 */
function cleanScrollMemo(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  SCROLL_KEYS.forEach((k) => {
    const v = raw[k];
    if (typeof v !== 'number' || !isFinite(v) || v < 0) return;
    out[k] = Math.min(Math.round(v), 1000000);
  });
  return out;
}

/**
 * 附加区块清单。
 * 加新功能时在这里加一行，不必改动本文件其余部分。
 *
 * id     唯一标识，重复会在控制台告警并只渲染第一个
 * tab    挂到哪个标签
 * order  排序，小的在前
 * render 渲染函数，签名 (containerEl, plugin, ticker)
 */
const SECTIONS = [
  { id: 'record', tab: 'pomodoro', order: 200, render: renderRecord },
];

/**
 * 预览定时器：统一托管设置页里的实时预览，
 * 切换标签或关闭设置页时一次性清理，避免定时器泄漏。
 */
class PreviewTicker {
  constructor() {
    this.fns = [];
    this.id = null;
  }

  /** 注册一个刷新函数，立即执行一次并按秒轮询 */
  add(fn) {
    this.fns.push(fn);
    fn();
    if (this.id === null) {
      this.id = window.setInterval(() => this.fns.forEach((f) => f()), 1000);
    }
  }

  clear() {
    if (this.id !== null) {
      window.clearInterval(this.id);
      this.id = null;
    }
    this.fns = [];
  }
}

class TimeToolsSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    /*
     * 设置页 id 必须等于插件 id（manifest.id），不能另起一个「更好看」的名字。
     *
     * Obsidian 是按「插件 id」定位设置页的：app.setting.openTabById(manifest.id)。
     * 这里曾写成 'time-tools-settings' —— 设置页在设置面板里照常显示、也能手动点开，
     * 但「已安装插件」的三点菜单少一个「设置」、插件详情页少一个「选项」按钮，
     * 因为按 manifest.id 查不到这个标签页，Obsidian 就当它「没有可配置选项」。
     *
     * id 缺失或重复仍会让两个插件的设置页互相覆盖（点开 A 却看到 B 的内容），
     * 所以保持显式赋值 —— 但值必须取自 manifest，不要手写字符串。
     */
    const manifestId = plugin && plugin.manifest && plugin.manifest.id;
    if (manifestId) this.id = manifestId;
    this.plugin = plugin;
    this.ticker = new PreviewTicker();
    this.activeTab = this.normalizeTab(plugin.settings.pomodoro.lastSettingsTab);
    // 滚动位置还原用到的句柄，统一在这里声明，避免散落成隐式全局
    this.restoreTimers = [];
    this.scrollBox = null;
    this.onScroll = null;
    this.saveTimer = null;
    this.intentBox = null;
    this.stopFn = null;
  }

  /** 标签 key 合法性兜底：旧配置里可能是已合并的 'record' */
  normalizeTab(key) {
    if (TABS.some((t) => t.key === key)) return key;
    if (key === 'record') return 'pomodoro'; // 记录已并入番茄钟页
    return 'timestamp';
  }

  /** 切换到指定标签并重绘；外部跳转时用 */
  focusTab(key) {
    this.saveScroll(); // 离开前记下当前标签的位置，切回来能还原
    this.activeTab = this.normalizeTab(key);
    this.plugin.settings.pomodoro.lastSettingsTab = this.activeTab;
    this.plugin.saveSettings();
    if (this.containerEl) this.display();
  }

  display() {
    /*
     * 整页兜底：设置页渲染抛错会让 Obsidian 的设置面板停在半渲染状态，
     * 连累后续打开的其他插件设置页也显示不全。
     * 宁可显示一行错误提示，也不能抛出去。
     */
    try {
      this.renderInto(this.containerEl);
      this.bindScrollSave();
      this.restoreScroll();
    } catch (e) {
      console.error('[Time Tools] 设置页渲染失败', e);
      this.containerEl.empty();
      this.containerEl.createDiv({
        cls: 'tt-settings-error',
        text: i18nT('ka1b02349', '设置页渲染失败：{0}。其余设置不受影响。', e && e.message ? e.message : e),
      });
    }
  }

  renderInto(containerEl) {
    this.ticker.clear();
    containerEl.empty();
    containerEl.addClass('tt-settings');

    // 顶部标签栏
    const bar = containerEl.createDiv({ cls: 'tt-tab-bar' });
    TABS.forEach((tab) => {
      const el = bar.createDiv({
        cls: 'tt-tab' + (tab.key === this.activeTab ? ' is-active' : ''),
        text: i18nT(tab.labelKey, tab.label),
      });
      el.onclick = () => this.focusTab(tab.key);
    });

    // 标签自有内容
    if (this.activeTab === 'timestamp') {
      renderTimestamp(containerEl, this.plugin, this.ticker);
    } else if (this.activeTab === 'calendar') {
      renderCalendar(containerEl, this.plugin);
    } else if (this.activeTab === 'lang') {
      /*
       * 语言不属于任何功能模块，整块由 i18n.js 自己渲染。
       *
       * 必须传一个**专属子容器**：renderLangTab 开头会 box.empty()，
       * 直接把 containerEl 传进去会把刚画好的标签栏一起清掉 ——
       * 表现就是进了「界面语言」页后，上面的标签全没了，再也切不回去
       * （v3.19 实测到的 bug）。子容器是它的，清空无害。
       */
      renderLangTab(containerEl.createDiv({ cls: 'tt-lang-pane' }), this.plugin);
    } else {
      renderPomodoro(containerEl, this.plugin, this.plugin.pomodoro);
    }

    // 附加区块：按 order 追加在最下方
    this.renderSections(containerEl, this.activeTab);
  }

  /**
   * 渲染挂在本标签下的附加区块。
   * 逐块 try/catch：某块出错只影响它自己，其余照常显示。
   * 用户侧看到一行简提示，完整堆栈走 console.error 供排查。
   */
  renderSections(containerEl, tab) {
    const list = SECTIONS.filter((s) => s.tab === tab).sort((a, b) => a.order - b.order);

    // id 重复通常是复制粘贴遗留，开发期就该发现
    const seen = new Set();
    list.forEach((sec) => {
      if (seen.has(sec.id)) console.error(`[Time Tools] 设置区块 id 重复：${sec.id}`);
      seen.add(sec.id);
    });

    Array.from(seen).forEach((id) => {
      const sec = list.find((s) => s.id === id);
      const wrap = containerEl.createDiv({ cls: 'tt-section' });
      wrap.setAttribute('data-section', id);
      try {
        sec.render(wrap, this.plugin, this.ticker);
      } catch (e) {
        console.error(`[Time Tools] 设置区块「${id}」渲染失败`, e);
        wrap.createDiv({
          cls: 'tt-section-error',
          text: i18nT('kcf156760', '「{0}」加载失败：{1}。其余设置不受影响，详细堆栈见开发者控制台。',
            id, e && e.message ? e.message : i18nT('k974e7484', '未知错误')),
        });
      }
    });
  }

  /* ---- 滚动位置：重载插件后还原到原来那一行 ---- */

  /**
   * 记录当前标签的滚动位置。
   * 只改内存里的 settings，落盘交给防抖（滚动时写盘太频繁）。
   */
  saveScroll() {
    const box = findScrollParent(this.containerEl);
    if (!box) return;
    const memo = cleanScrollMemo(this.plugin.settings.pomodoro.lastSettingsScroll);
    const top = Math.round(box.scrollTop);
    memo[this.activeTab] = top > 0 ? top : 0;
    this.plugin.settings.pomodoro.lastSettingsScroll = memo;
  }

  /**
   * 监听滚动容器，用户滚动后防抖落盘。
   * 重载插件时 Obsidian 不一定走 hide()，所以这里才是主要的落盘时机。
   */
  bindScrollSave() {
    const box = findScrollParent(this.containerEl);
    if (!box || box === this.scrollBox || !box.addEventListener) return;
    this.unbindScrollSave();
    this.scrollBox = box;
    this.onScroll = () => {
      this.saveScroll();
      if (this.saveTimer !== null) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null;
        if (this.plugin && typeof this.plugin.saveSettings === 'function') {
          this.plugin.saveSettings();
        }
      }, 400);
    };
    box.addEventListener('scroll', this.onScroll, { passive: true });
  }

  unbindScrollSave() {
    if (this.scrollBox && this.onScroll && this.scrollBox.removeEventListener) {
      this.scrollBox.removeEventListener('scroll', this.onScroll);
    }
    this.scrollBox = null;
    this.onScroll = null;
  }

  /**
   * 还原滚动位置。
   *
   * 单次设置会被后续重绘冲掉（日历页按钮按 200ms 轮询重绘），
   * 所以按 SCROLL_ATTEMPTS 多次尝试；一旦判定页面已不是我们的、或用户
   * 自己动了，就整体放弃——还原只是便利，绝不能反过来抢用户的操作。
   */
  restoreScroll() {
    this.stopRestore();
    const memo = cleanScrollMemo(this.plugin.settings.pomodoro.lastSettingsScroll);
    const target = memo[this.activeTab];
    if (!(target > 0)) return; // 没记过或在顶部，不动

    this.restoreTimers = SCROLL_ATTEMPTS.map((delay) =>
      setTimeout(() => {
        // 容器已脱离文档（用户切走 / 设置页被别的插件替换）：立即停
        if (!this.containerEl || this.containerEl.isConnected === false) {
          this.stopRestore();
          return;
        }
        const box = findScrollParent(this.containerEl);
        if (!box) return;
        const maxTop = box.scrollHeight - box.clientHeight;
        if (maxTop <= 0) return; // 还没渲染出可滚动内容，等下一帧
        // 页面比记忆位置矮（换了标签或内容变少）：不再折腾
        if (target > maxTop + 8) {
          this.stopRestore();
          return;
        }
        box.scrollTop = target;
      }, delay)
    );
    this.bindUserIntent();
  }

  /**
   * 用户一动滚轮 / 拖滚动条 / 按键，就放弃还原。
   * 用真实交互事件判定，比事后比对 scrollTop 可靠——后者分不清
   * 「用户滚的」和「被重绘冲掉的」。
   */
  bindUserIntent() {
    const box = this.scrollBox || findScrollParent(this.containerEl);
    if (!box || !box.addEventListener) return;
    this.intentBox = box;
    this.stopFn = () => this.stopRestore();
    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach((ev) => {
      box.addEventListener(ev, this.stopFn, { once: true, passive: true });
    });
  }

  /** 清掉全部定时器与监听，hide / 切标签 / 用户接管时都会走到这里 */
  stopRestore() {
    (this.restoreTimers || []).forEach((t) => clearTimeout(t));
    this.restoreTimers = [];
    if (this.intentBox && this.stopFn && this.intentBox.removeEventListener) {
      ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach((ev) =>
        this.intentBox.removeEventListener(ev, this.stopFn)
      );
    }
    this.intentBox = null;
    this.stopFn = null;
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  hide() {
    this.ticker.clear();
    this.saveScroll();
    this.stopRestore();
    this.unbindScrollSave();
    if (this.plugin && typeof this.plugin.saveSettings === 'function') {
      this.plugin.saveSettings();
    }
  }
}

// 延迟解引用：避免模块循环依赖时取不到函数
function renderTimestamp(containerEl, plugin, ticker) {
  require('./timestamp.js').renderTimestampSettings(containerEl, plugin, ticker);
}
function renderPomodoro(containerEl, plugin, ctrl) {
  require('./pomodoro.js').renderPomodoroSettings(containerEl, plugin, ctrl);
}
function renderCalendar(containerEl, plugin) {
  require('./calendar.js').renderCalendarSettings(containerEl, plugin);
}
function renderRecord(containerEl, plugin) {
  require('./pomodoro.js').renderRecordSettings(containerEl, plugin);
}


module.exports = {
  // 配置
  SETTINGS_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  VALID_WEEK_START,
  VALID_POMO_THEME,
  POMO_THEME_OPTIONS,
  DEFAULT_PROFILES,
  DEFAULT_RECORD_TEMPLATE,
  ACTION_DEFS,
  ACTION_GROUPS,
  ADVANCED_GROUP,
  LUNAR_KEYS,
  isLunarKey,
  ACTION_PAIRS,
  pairOf,
  isForwardOfPair,
  ACTION_KEYS,
  defaultActionItems,
  defaultExtensions,
  defaults,
  migrateSettings,
  resetSection,
  addResetButton,
  applyProfile,
  makeProfileId,
  confirmDialog,

  // 设置页
  TimeToolsSettingTab,
  TABS,
  SECTIONS,
  // 滚动位置还原（导出供测试）
  SCROLL_ATTEMPTS,
  SCROLL_KEYS,
  findScrollParent,
  cleanScrollMemo,
};
