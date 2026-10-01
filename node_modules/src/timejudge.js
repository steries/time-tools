/*
 * 时间口径与判断表
 * ===================================================================
 * 本文件只放「该怎么算」的判断，不放解析流程。
 * 解析流程在 timestamp.js，界面在 settings.js —— 两边都从这里取口径，
 * 保证「设置里看到的」和「实际算出来的」永远是同一份定义。
 *
 * 为什么单独一个文件：
 *   1. 口径会变（周末算周六还是周日、下周一指哪天…），集中一处才好改；
 *   2. 这些判断要**给用户留选择空间**，选项清单与默认值必须配套出现，
 *      散落在解析代码里就容易只改一半；
 *   3. 本文件零依赖（不 require 任何模块），谁都能引用，不会有循环依赖。
 *
 * 新增一个口径的做法：往 JUDGEMENTS 里加一条即可，
 * 设置页会自动渲染出选项，解析层用 readJudgement(key, settings) 读值。
 */

'use strict';

/* ===================================================================
 * 一、时段表：时段名 → 默认小时
 * ===================================================================
 * hour 是默认值，用户可在设置里改，改后存 settings.daypartHours。
 * pm 表示「这个时段里的钟点按 12 小时制理解」——
 * 「下午5点」= 17:00，而「5点」没有时段时按 24 小时制 = 05:00。
 *
 * alias 用于缩略写法（明晚 / 今早）：词根里只有一个字，
 * 完整词「晚上」去 indexOf 是找不到的，必须靠单字别名。
 * 注意：**不要**把有歧义的字收进 alias。曾把「半」收进「深夜」，
 * 结果「5点半」的「半」被当成深夜，算成 17:30。
 */
const TIME_OF_DAY = [
  { key: '凌晨', re: /^凌晨/, hour: 2, pm: false, alias: ['凌'] },
  { key: '早上', re: /^早上|^早晨|^上午/, hour: 9, pm: false, alias: ['早', '晨'] },
  { key: '中午', re: /^中午|^正午|^晌午/, hour: 12, pm: false, alias: ['午', '晌'] },
  { key: '下午', re: /^下午/, hour: 15, pm: true, alias: ['午'] },
  { key: '傍晚', re: /^傍晚|^黄昏/, hour: 18, pm: true, alias: ['昏'] },
  /*
   * 「晚上」与「夜里」分开。
   * 合在一起时「昨夜」落在 20:00，而多数人说「昨夜」想到的是更晚的时刻；
   * 分开后「夜里」默认 23:00，「夜里11点」的时刻解也落在这里，两者自洽。
   * 两个时段的小时值都能在「时间口径」里改。
   */
  { key: '晚上', re: /^晚上|^夜晚/, hour: 20, pm: true, alias: ['晚'] },
  { key: '夜里', re: /^夜里|^夜半/, hour: 23, pm: true, alias: ['夜'] },
  { key: '深夜', re: /^深夜|^半夜|^午夜/, hour: 23, pm: true, alias: ['深'] },
];

/** 时段键顺序（设置页渲染用） */
const DAYPART_KEYS = TIME_OF_DAY.map((t) => t.key);

/** 时段默认小时值（供设置页与迁移逻辑取默认值） */
function defaultDaypartHours() {
  const out = {};
  TIME_OF_DAY.forEach((t) => { out[t.key] = t.hour; });
  return out;
}

/**
 * 清洗用户改过的时段小时：只保留认识的键，且必须落在 0–23。
 * 否则废弃键会一直堆在 data.json 里。
 */
function cleanDaypartHours(saved) {
  const out = {};
  if (!saved || typeof saved !== 'object') return out;
  DAYPART_KEYS.forEach((k) => {
    const v = Number(saved[k]);
    // 用 Number 强转而非只收 number：旧配置里可能存成字符串 "12"，
    // 只判 typeof 会把这类合法值丢掉（迁移时静默退化成默认值）。
    if (isFinite(v) && v >= 0 && v <= 23) out[k] = Math.floor(v);
  });
  return out;
}

/* ===================================================================
 * 二、时间口径：没有共识的写法，给用户留选择
 * ===================================================================
 * 每项四件套：默认 / 选项 / 说明 / 清洗。
 * default 是插件替用户拍的板（选最符合多数人语感的那个），
 * options 让用户改成自己的习惯。
 */
const JUDGEMENTS = {
  /*
   * 「周末」到底指周六还是周日。
   * 默认 6（周六）：与旧行为一致，也与 Calendar 等插件的映射相同；
   * 想要周日的人在设置里改。
   */
  weekendDay: {
    label: '「周末」算周几',
    desc: '中文口语里「周末」可以指周六也可以指周日，这里定一个默认值。',
    default: 6,
    options: [{ v: 6, label: '周六' }, { v: 7, label: '周日' }],
    clean(v) { return v === 6 || v === 7 ? v : this.default; },
  },
  /*
   * 「下周一」指明天还是下一个日历周。
   * 默认 tomorrow（本周+7天）：口语里今天周日说「下周一」通常指明天；
   * nextweek 是严格按日历周理解（会落在 8 天后）。
   */
  nextWeekdayMode: {
    label: '「下周X」怎么算',
    desc: '今天就是周日时，「下周一」指明天还是再下一周的周一。',
    default: 'tomorrow',
    options: [
      { v: 'tomorrow', label: '本周 +7 天（明天）' },
      { v: 'nextweek', label: '严格下一个日历周' },
    ],
    clean(v) { return v === 'nextweek' ? v : 'tomorrow'; },
  },
  /*
   * 「17号」这类只有日、没有月的写法补哪个月。
   * 默认 current（补本月）：最符合直觉；
   * upcoming 是「本月已过则取下月」（适合记未来事项）；
   * off 是干脆不转换（避免误判）。
   */
  dayOnlyMode: {
    label: '「17号」补哪个月',
    desc: '只写日期没写月份时，按哪个月来补。',
    default: 'current',
    options: [
      { v: 'current', label: '补本月' },
      { v: 'upcoming', label: '补本月，已过则取下月' },
      { v: 'off', label: '不转换' },
    ],
    clean(v) { return ['current', 'upcoming', 'off'].indexOf(v) >= 0 ? v : 'current'; },
  },
};

/**
 * 清洗一个口径的值：非法就退回默认。
 * 迁移逻辑用它，保证脏配置不会写回 data.json。
 */
function cleanJudgement(key, value) {
  const def = JUDGEMENTS[key];
  if (!def) return undefined;
  return def.clean(value);
}

/** 全部口径的默认值（迁移与重置时一次性取用） */
function defaultJudgements() {
  const out = {};
  Object.keys(JUDGEMENTS).forEach((k) => { out[k] = JUDGEMENTS[k].default; });
  return out;
}

/**
 * 读一个口径的值。先看用户设置，没有或非法就用默认值。
 * @param {string} key 口径名
 * @param {object} settings 插件设置（可为 null）
 */
function readJudgement(key, settings) {
  const def = JUDGEMENTS[key];
  if (!def) return undefined;
  const ext = settings && settings.timestamp && settings.timestamp.extensions;
  const v = ext ? ext[key] : undefined;
  return v === undefined || v === null ? def.default : def.clean(v);
}

/* ===================================================================
 * 三、节日区
 * ===================================================================
 * 三类来源，查询时**按这个顺序**命中：
 *   1. 用户自设（customFestivals）—— 用户自己的日期优先，可覆盖内置
 *   2. 阳历固定（SOLAR_FESTIVALS）—— 日期年年不变
 *   3. 农历浮动（LUNAR_FESTIVALS）—— 只记农历月日，具体日期每年不同
 *      （春节/端午/中秋…不能写死阳历日期，闰月年会错，必须现算）
 *
 * 表是常量，不进 data.json（不随使用增长）；
 * 用户自设的那份是用户显式输入的有限条目，存在 data.json 里。
 */

const SOLAR_FESTIVALS = [
  { names: ['元旦', '新年'], month: 1, day: 1, en: "New Year's Day", },
  { names: ['情人节'], month: 2, day: 14, en: "Valentine's Day", },
  { names: ['植树节'], month: 3, day: 12, en: "Arbor Day", },
  { names: ['劳动节', '五一'], month: 5, day: 1, en: "Labor Day", },
  { names: ['青年节'], month: 5, day: 4, en: "Youth Day", },
  { names: ['儿童节'], month: 6, day: 1, en: "Children's Day", },
  { names: ['建党节', '七一'], month: 7, day: 1, en: "Party Founding Day", },
  { names: ['建军节', '八一'], month: 8, day: 1, en: "Army Day", },
  { names: ['教师节'], month: 9, day: 10, en: "Teachers' Day", },
  { names: ['国庆节', '国庆'], month: 10, day: 1, en: "National Day", },
  { names: ['平安夜'], month: 12, day: 24, en: "Christmas Eve", },
  { names: ['圣诞节'], month: 12, day: 25, en: "Christmas Day", },
];

/*
 * 农历浮动节日：只存农历月日，实际阳历日期由 lunar 模块现算。
 * day 为 null 表示「该月最后一天」（除夕），不能写死 30 ——
 * 腊月有时只有 29 天，写死会溢出成下月初一。
 */
const LUNAR_FESTIVALS = [
  { names: ['春节', '大年初一', '年初一', '正月初一'], month: 1, day: 1 },
  { names: ['元宵', '元宵节', '上元节'], month: 1, day: 15 },
  { names: ['端午', '端午节'], month: 5, day: 5 },
  { names: ['七夕', '乞巧节'], month: 7, day: 7 },
  { names: ['中元', '中元节', '鬼节'], month: 7, day: 15 },
  { names: ['中秋', '中秋节'], month: 8, day: 15 },
  { names: ['重阳', '重阳节'], month: 9, day: 9 },
  { names: ['腊八', '腊八节'], month: 12, day: 8 },
  { names: ['小年'], month: 12, day: 23 },
  { names: ['除夕', '年三十', '大年夜'], month: 12, day: null },
];

/* ------------------------------------------------------------------ *
 * 用户自设节日
 * ------------------------------------------------------------------ */

/** 格式说明的**叙述部分**（示例见 FEST_EXAMPLES，那边刻意不译） */
const FEST_HEAD = [
  '一行一条，格式：节日名 = 日期',
  '支持四种日期写法：',
].join('\n');

/*
 * 示例本体 —— **刻意不翻译**。
 *
 * 这些是解析器认的中文写法，翻成英文用户照抄会解析失败
 * （实测 "2nd Sunday of May" 返回空）。只译叙述句，示例原样保留。
 * 节日名本身是用户数据，同样不译。
 */
const FEST_EXAMPLES = [
  '  妈妈生日 = 10-15            阳历，每年重复',
  '  公司年会 = 2026-12-31       阳历，只那一年',
  '  观音诞 = 农历二月十九       农历，每年按农历算',
  '  母亲节 = 5月第2个周日       第 N 个星期几',
  '  感恩节 = 11月最后一个周四   当月最后一个星期几',
  '  某节 = 11月倒数第2个周四    当月倒数第 N 个星期几',
  "  Mother's Day = 5-10        节日名可含空格（英文也认）",
  '分隔符可用 = : ：, ，',
].join('\n');

/**
 * 「名称 = 日期」的分割：名称里不含分隔符，但**允许空格**。
 *
 * 名字曾排除 \s，导致英文名全军覆没 —— 英文节日几乎都带空格
 * （Mother's Day / New Year），一个都写不进去。
 * 用非贪婪 +? 是为了不吃掉后面的分隔符（否则「甲 = 3-1 = 5-1」会整体吞掉）。
 * 无分隔符的行（注释、乱写）仍然解析不出，与改动前一致。
 */
const CUSTOM_LINE_RE = /^([^=:：,，]+?)\s*[=:：,，]\s*(.+)$/;

/** 第 N 个星期几：5月第2个周日 / 6月第3个星期天 */
const NTH_WEEKDAY_RE = /^(\d{1,2})月第([一二三四五1-5])个(星期|礼拜|周)([日天一二三四五六1-7])$/;

/**
 * 当月最后一个 / 倒数第 N 个星期几：11月最后一个周四 / 11月倒数第2个周四。
 * 「最后一个」等价于「倒数第 1 个」，所以第 2 组为空时按 1 处理。
 * 不能并入 NTH_WEEKDAY_RE：那条要求「月」后紧跟「第」，这里前面还有「倒数」。
 */
const LAST_WEEKDAY_RE = /^(\d{1,2})月(?:最后一个|倒数第([一二三四五1-5])个)(星期|礼拜|周)([日天一二三四五六1-7])$/;

/** 中文数字 → 阿拉伯数字（只处理 1–5 与日期用到的字） */
const CN_NUM_MAP = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** 星期名 → 0–6（0=周日），与 Date.getDay() 对齐 */
const WEEKDAY_MAP = {
  日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6,
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
};

/**
 * 解析自设节日里的一行日期部分。
 * 返回条目对象或 null（无法识别就丢弃该行，不猜）。
 * @param {string} name 节日名
 * @param {string} spec 日期写法
 */
function parseFestivalSpec(name, spec) {
  const s = String(spec ?? '').replace(/\s+/g, '').trim();
  if (!s) return null;

  /*
   * ① 当月最后一个 / 倒数第 N 个星期几：11月最后一个周四。
   * 排在「第 N 个」之前：两者不冲突（后者要求「月」后紧跟「第」），
   * 但放一起读更容易看出是一族写法。
   */
  const last = LAST_WEEKDAY_RE.exec(s);
  if (last) {
    const wd = WEEKDAY_MAP[last[4]];
    if (wd === undefined) return null;
    return {
      name,
      kind: 'nth',
      month: parseInt(last[1], 10),
      nth: last[2] ? (CN_NUM_MAP[last[2]] || parseInt(last[2], 10)) : 1,
      weekday: wd,
      fromLast: true,   // 从月末往回数；缺省（第 N 个）为 false
    };
  }

  /* ① 第 N 个星期几：5月第2个周日 */
  const nth = NTH_WEEKDAY_RE.exec(s);
  if (nth) {
    const wd = WEEKDAY_MAP[nth[4]];
    if (wd === undefined) return null;
    return {
      name,
      kind: 'nth',
      month: parseInt(nth[1], 10),
      nth: CN_NUM_MAP[nth[2]] || parseInt(nth[2], 10),
      weekday: wd,
    };
  }

  /* ② 农历：农历八月十五 / 八月十五 / 闰二月初五 */
  const isLunar = /^农历/.test(s) || /[一二三四五六七八九十]月/.test(s);
  if (isLunar) {
    const body = s.replace(/^农历/, '');
    const m = /^(闰?)(\d{1,2}|[一二三四五六七八九十]+)月(初一|十五|[一二三四五六七八九十]+|\d{1,2})$/.exec(
      body
    );
    /*
     * 农历写法必须带「月」字：「农历10-15」这类没有「月」的一律丢弃，
     * 多半是想写阳历却误加了前缀。月份用中文或阿拉伯数字都认。
     */
    if (!m) return null;
    const mon = /^\d+$/.test(m[2]) ? parseInt(m[2], 10) : cnNumber(m[2]);
    const day = m[3] === '初一' ? 1 : m[3] === '十五' ? 15 : /^\d+$/.test(m[3])
      ? parseInt(m[3], 10)
      : cnNumber(m[3]);
    if (!mon || !day || mon < 1 || mon > 12 || day < 1 || day > 30) return null;
    return { name, kind: 'lunar', month: mon, day, isLeap: m[1] === '闰' };
  }

  /* ③ 阳历带年：2026年12月31日 / 2026-12-31 */
  const withYear = /^(\d{4})\s*[年\-\/.]?\s*(\d{1,2})\s*[月\-\/.]\s*(\d{1,2})\s*日?$/.exec(s);
  if (withYear) {
    const y = parseInt(withYear[1], 10);
    const mo = parseInt(withYear[2], 10);
    const d = parseInt(withYear[3], 10);
    if (!validYmd(y, mo, d)) return null;
    return { name, kind: 'solar', year: y, month: mo, day: d };
  }

  /* ④ 阳历月日（每年重复）：10-15 / 10/15 / 10月15日 */
  const md = /^(\d{1,2})\s*[月\-\/.]\s*(\d{1,2})\s*日?$/.exec(s);
  if (md) {
    const mo = parseInt(md[1], 10);
    const d = parseInt(md[2], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    // 回校该月真实天数：2 月 30 号这类非法日期直接丢弃
    if (!validYmd(2000, mo, d) && !validYmd(2001, mo, d)) return null;
    return { name, kind: 'solar', month: mo, day: d };
  }

  return null;
}

/** 中文数字（一到三十）→ 阿拉伯数字 */
function cnNumber(s) {
  if (CN_NUM_MAP[s] !== undefined) return CN_NUM_MAP[s];
  const m = /^([二三四])?十([一二三四五六七八九])?$/.exec(String(s || ''));
  if (!m) return 0;
  const tens = m[1] ? CN_NUM_MAP[m[1]] * 10 : 10;
  return tens + (m[2] ? CN_NUM_MAP[m[2]] : 0);
}

/** 年月日是否合法（含闰年与月末回校） */
function validYmd(y, m, d) {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(y, m, 0).getDate();
}

/**
 * 解析用户自设的整段文本 → 条目数组。
 * 空行、# 注释行、无法识别的行一律跳过，不报错也不中断。
 * 同名后写覆盖先写（让用户可以靠顺序改掉某条）。
 */
function parseCustomFestivals(text) {
  const out = [];
  const index = {};
  String(text ?? '')
    .split(/\r?\n/)
    .forEach((line) => {
      const s = String(line || '').trim();
      if (!s || /^#/.test(s)) return;
      const m = CUSTOM_LINE_RE.exec(s);
      if (!m) return;
      const item = parseFestivalSpec(m[1].trim(), m[2]);
      if (!item) return;
      if (index[item.name] !== undefined) out[index[item.name]] = item;
      else {
        index[item.name] = out.length;
        out.push(item);
      }
    });
  return out;
}

/**
 * 查一个节日名属于哪一类。
 * @param {string} text 待查名称（已 trim）
 * @param {Array} custom 自设条目（parseCustomFestivals 的结果）
 * @returns {object|null} { name, kind, ... } 或 null
 */
function findFestival(text, custom) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  // 自设优先：用户可以覆盖内置节日的日期
  if (Array.isArray(custom)) {
    for (const it of custom) {
      if (it && it.name === s) return it;
    }
  }

  // 精确匹配、先到先得（阳历表在前）。两张内置表无重名，故不存在「取更长名」的情形。
  let best = null;
  const hit = (names, extra) => {
    names.forEach((n) => {
      if (s === n && !best) best = Object.assign({ name: n }, extra);
    });
  };
  SOLAR_FESTIVALS.forEach((f) => hit(f.names, { kind: 'solar', month: f.month, day: f.day }));
  LUNAR_FESTIVALS.forEach((f) =>
    hit(f.names, { kind: 'lunar', month: f.month, day: f.day })
  );
  return best;
}

/* ===================================================================
 * 四、周号计算：全插件唯一一份，日历与笔记都从这里取
 * ===================================================================
 * 算法与 moment 的 week() 同款（dow/doy 规则）。
 * 收敛到这里的原因：曾两处各存一份，跨年差 1 周。任何调用点都拿同一份结果。
 */

/**
 * 周起始日 → moment 的 dow（0=周日 … 6=周六）。
 * 唯一真源：calendar 的下拉选项、settings 的值域清洗、note 的周号计算全由它派生。
 * 别在各模块另写字面量 —— 曾三处各写一份，漏改一处就出现「下拉有但校验不认」。
 */
const WEEK_START_DOW = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

/** 周起始枚举的合法取值（含「跟随系统区域」），settings.js 用它做值域清洗 */
const VALID_WEEK_START = ['locale'].concat(Object.keys(WEEK_START_DOW));

/** doy 规则与 moment 一致：周一走 ISO(4)，其余 = 6 + dow */
function weekDoyOf(dow) {
  return dow === 1 ? 4 : 6 + dow;
}

function dayOfYearOf(d) {
  return Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 0)) / 86400000
  );
}

/** 与 moment 的 firstWeekOffset 同算法：本年元旦前后要补几天才对齐周界 */
function firstWeekOffset(year, dow, doy) {
  const fwd = 7 + dow - doy;
  const fwdlw = (7 + new Date(year, 0, fwd).getDay() - dow) % 7;
  return -fwdlw + fwd - 1;
}

function weeksInYear(year, dow, doy) {
  const days = Math.round((new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000);
  return (days - firstWeekOffset(year, dow, doy) + firstWeekOffset(year + 1, dow, doy)) / 7;
}

/**
 * 按 dow/doy 算年内周数（moment 的 week() 同算法）。
 * 跨年时落到上一年末或下一年初的周，返回对应年的周号（ISO 行为）。
 */
function weekNumberOf(d, dow) {
  const doy = weekDoyOf(dow);
  const y = d.getFullYear();
  const off = firstWeekOffset(y, dow, doy);
  let w = Math.floor((dayOfYearOf(d) - off - 1) / 7) + 1;
  if (w < 1) return w + weeksInYear(y - 1, dow, doy);
  const total = weeksInYear(y, dow, doy);
  if (w > total) return w - total;
  return w;
}

/** 同一天（只看年月日，忽略时分秒） */
function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/* ===================================================================
 * 五、有意不识别的模糊词
 * ===================================================================
 * 语义不可信，宁可不识别。列在这里是为了**防止以后误加**——
 * 改解析层时先查这张表，别把「改天」之类的词顺手收进去。
 */
const FUZZY_WORDS = [
  '改天', '回头', '有空', '最近', '近期', '过一阵', '马上', '立刻', '稍后',
  '大半天', '工作日', '法定假日', '早上好', '晚上好',
];

module.exports = {
  TIME_OF_DAY,
  DAYPART_KEYS,
  defaultDaypartHours,
  cleanDaypartHours,
  JUDGEMENTS,
  defaultJudgements,
  readJudgement,
  cleanJudgement,
  SOLAR_FESTIVALS,
  LUNAR_FESTIVALS,
  FEST_HEAD,
  FEST_EXAMPLES,
  parseCustomFestivals,
  findFestival,
  FUZZY_WORDS,
  WEEK_START_DOW,
  VALID_WEEK_START,
  weekDoyOf,
  dayOfYearOf,
  firstWeekOffset,
  weeksInYear,
  weekNumberOf,
  sameDay,
};
