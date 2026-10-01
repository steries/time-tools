/*
 * 农历计算（1900–2100 查表 + 天文黄经算节气）
 *
 * 从 timestamp.js 拆出：这一块是纯计算、零依赖，不动 DOM、不读设置、
 * 不碰 window，单独成文件后更易核算法、也便于单独测。
 *
 * ⚠️ 范围：1900–2100。超出范围一律返回 null / 隐藏，绝不给错值。
 * ⚠️ 节气按 UTC+8 太阳视黄经计算，msToJde 的时区参数不要改。
 */
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900–1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910–1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920–1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930–1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940–1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950–1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960–1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970–1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980–1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990–1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000–2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010–2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020–2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030–2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040–2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050–2059
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060–2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070–2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080–2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090–2099
  0x0d520, // 2100
];

/** 支持范围：超出即返回 null，不做外推 */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/** 农历月名 */
const CN_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
/** 日期数字 */
const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 天干 / 地支 / 生肖 */
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/** 二十四节气 */
const SOLAR_TERMS = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

/**
 * 节气偏移表：以 1900-01-06 02:05 为基准，单位 1/60000 分钟。
 * 配合回归年长度可算出任意年份某节气在哪一天。
 */
const S_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921,
  173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033,
  353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758,
];

/* ------------------------------------------------------------------ *
 * 表查询
 * ------------------------------------------------------------------ */

/** 闰哪个月；0 表示当年无闰月 */
function leapMonth(year) {
  return LUNAR_INFO[year - MIN_YEAR] & 0xf;
}

/** 闰月天数；无闰月返回 0 */
function leapDays(year) {
  return leapMonth(year) ? (LUNAR_INFO[year - MIN_YEAR] & 0x10000 ? 30 : 29) : 0;
}

/** 第 month 个月的天数（不含闰月） */
function monthDays(year, month) {
  if (month < 1 || month > 12) return -1;
  return LUNAR_INFO[year - MIN_YEAR] & (0x10000 >> month) ? 30 : 29;
}

/** 农历年总天数 */
function yearDays(year) {
  let sum = 348; // 12 个月都按 29 天算
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (LUNAR_INFO[year - MIN_YEAR] & bit) sum += 1;
  }
  return sum + leapDays(year);
}

/* ------------------------------------------------------------------ *
 * 核心转换
 * ------------------------------------------------------------------ */

/**
 * 阳历转农历。
 * @returns {{year:number,month:number,day:number,isLeap:boolean}|null}
 *          超出范围或早于基准日返回 null
 */
function solarToLunar(y, m, d) {
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  if (y === 1900 && m === 1 && d < 31) return null; // 基准日之前无数据

  // 基准：1900-01-31 为农历 1900 年正月初一
  let offset = Math.floor(
    (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000
  );

  // 定位农历年。
  // 注意 for 循环退出时 i 已自增一轮，故年份取退出后的 i，
  // 减过头（offset < 0）再回退一年 —— 这里极易差 1，改动请对照测试。
  let i = MIN_YEAR;
  let temp = 0;
  for (; i <= MAX_YEAR && offset > 0; i++) {
    temp = yearDays(i);
    offset -= temp;
  }
  let year = i;
  if (offset < 0) {
    offset += temp;
    year -= 1;
  }

  const leap = leapMonth(year); // 该年闰几月，0 表示无
  let isLeap = false;

  // 定位农历月。闰月插在第 leap 月之后：走到 leap+1 时先回退一格处理闰月，
  // 下一轮再正常处理第 leap+1 月。
  let j = 1;
  let monthLen = 0;
  for (; j < 13 && offset > 0; j++) {
    if (leap > 0 && j === leap + 1 && !isLeap) {
      j -= 1;
      isLeap = true;
      monthLen = leapDays(year);
    } else {
      monthLen = monthDays(year, j);
    }
    if (isLeap && j === leap + 1) isLeap = false; // 闰月处理完，解除标记
    offset -= monthLen;
  }
  let month = j;

  // 正好落在闰月边界时修正下标
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (isLeap) isLeap = false;
    else {
      isLeap = true;
      month -= 1;
    }
  }
  if (offset < 0) {
    offset += monthLen;
    month -= 1;
  }

  return { year, month, day: offset + 1, isLeap };
}

/* ------------------------------------------------------------------ *
 * 中文格式化
 * ------------------------------------------------------------------ */

/** 农历日：初一 / 十五 / 廿三 / 三十 */
function cnDay(day) {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  const prefix = ['初', '十', '廿', '三'][Math.floor(day / 10)];
  const rest = day % 10;
  return rest === 0 ? prefix + '十' : prefix + CN_NUM[rest];
}

/** 农历月：正月 / 冬月 / 腊月；闰月加「闰」 */
function cnMonth(month, isLeap) {
  const base = CN_MONTH[month - 1] || String(month);
  return (isLeap ? '闰' : '') + base + '月';
}

/** 完整农历字符串，如「农历2026年八月十九」 */
function formatLunar(lunar) {
  return `农历${lunar.year}年${cnMonth(lunar.month, lunar.isLeap)}${cnDay(lunar.day)}`;
}

/** 干支年，如「丙午」 */
function ganZhi(year) {
  const g = GAN[(year - 4) % 10];
  const z = ZHI[(year - 4) % 12];
  return g + z;
}

/** 生肖，如「马」 */
function zodiac(year) {
  return ANIMALS[(year - 4) % 12];
}

/* ------------------------------------------------------------------ *
 * 节气
 * ------------------------------------------------------------------ */

/** 儒略日数：Unix 毫秒 → JDE */
function msToJde(ms) {
  return ms / 86400000 + 2440587.5;
}

/** JDE → Date，tzHours 为时区偏移（中国标准时间用 +8） */
function jdeToDate(jde, tzHours) {
  return new Date((jde - 2440587.5) * 86400000 + tzHours * 3600000);
}

/**
 * 太阳视黄经（度）。
 * 采用截断的 VSOP87 级数，忽略章动与光行差修正，
 * 残差约 0.01 度 —— 折算到时间不到 15 分钟，判定「哪天是节气」绰绰有余。
 */
function sunLongitude(jde) {
  const T = (jde - 2451545.0) / 36525; // 自 J2000.0 起的儒略世纪数
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T; // 平黄经
  const M = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI) / 180; // 平近点角
  const C =
    (1.914602 - 0.004817 * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M); // 中心差
  let lon = (L0 + C) % 360;
  if (lon < 0) lon += 360;
  return lon;
}

/** 太阳黄经的日变化率（度/天） */
const LON_PER_DAY = 360 / 365.2422;

/**
 * 求第 n 个节气（0 = 小寒）的公历日期。
 * 先用近似表取初值，再用牛顿迭代收敛到黄经刚好等于目标值的时刻。
 * @param tzHours 时区偏移，中国用 8
 * @returns {number} 该节气落在几号
 */
function termDay(y, n, tzHours) {
  const tz = typeof tzHours === 'number' ? tzHours : 8;
  if (y < MIN_YEAR || y > MAX_YEAR) return -1;

  // 初值：近似表，误差通常 ±1 天，足够迭代收敛
  let jde = msToJde(
    31556925974.7 * (y - MIN_YEAR) + S_TERM_INFO[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5)
  );
  const target = (285 + n * 15) % 360; // 小寒起算，每个节气 15 度

  for (let k = 0; k < 8; k++) {
    let diff = sunLongitude(jde) - target;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-7) break;
    jde -= diff / LON_PER_DAY; // 黄经差换算成天数
  }

  return jdeToDate(jde, tz).getUTCDate();
}

/**
 * 查某天是不是节气。
 * @returns {string|null} 节气名，不是节气返回 null
 */
function solarTerm(y, m, d) {
  const first = (m - 1) * 2;
  if (d === termDay(y, first)) return SOLAR_TERMS[first];
  if (d === termDay(y, first + 1)) return SOLAR_TERMS[first + 1];
  return null;
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * 反向转换：农历 → 阳历
 *
 * 思路：先算出「农历某年正月初一」对应的阳历日期，
 * 再逐月累加到目标月，最后加上日偏移。
 * 与 solarToLunar 共用同一张表，结果互为逆运算。
 * ------------------------------------------------------------------ */

/**
 * 农历正月初一的阳历基准偏移（距 1900-01-31 的天数）。
 * 逐年累加得到，缓存一次即可 —— 这是**内存缓存**，不落盘、不写 data.json。
 */
let yearOffsetCache = null;

function buildYearOffsets() {
  const offsets = new Array(MAX_YEAR - MIN_YEAR + 2);
  let sum = 0;
  offsets[0] = 0; // 1900 年正月初一 = 1900-01-31
  for (let y = MIN_YEAR; y < MAX_YEAR; y++) {
    sum += yearDays(y);
    offsets[y - MIN_YEAR + 1] = sum;
  }
  return offsets;
}

/** 农历第 y 年正月初一，距 1900-01-31 的天数 */
function yearOffset(y) {
  if (!yearOffsetCache) yearOffsetCache = buildYearOffsets();
  return yearOffsetCache[y - MIN_YEAR];
}

/**
 * 农历转阳历。
 * @param y 农历年（1900–2100）
 * @param m 农历月（1–12）
 * @param d 农历日（1–30）
 * @param isLeap 是否闰月
 * @returns {Date|null} 参数非法或该月不存在时返回 null
 */
function lunarToSolar(y, m, d, isLeap) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  if (m < 1 || m > 12) return null;

  const leap = leapMonth(y);
  // 闰月必须与该年实际的闰月一致
  if (isLeap && leap !== m) return null;

  const maxDay = isLeap ? leapDays(y) : monthDays(y, m);
  if (d < 1 || d > maxDay) return null;

  // 正月初一 + 之前各月天数 + 日偏移。
  // 闰月紧跟在第 leap 月之后，所以只要 leap < m，累加时就必须带上它的天数 ——
  // 漏掉会让闰月之后的所有月份整体偏移一个月。
  let offset = yearOffset(y);
  for (let i = 1; i < m; i++) offset += monthDays(y, i);
  if (leap > 0 && leap < m) offset += leapDays(y);
  if (isLeap) offset += monthDays(y, m); // 闰月排在同名月之后
  offset += d - 1;

  return new Date(Date.UTC(1900, 0, 31) + offset * 86400000);
}

/**
 * 解析农历日期文本。
 * 支持：2026年八月十九 / 八月十九 / 农历2026年八月初一 / 闰二月初五 / 二〇二六年八月十九
 * 不写年份时默认取当前农历年（按今天推算）。
 * @returns {{year:number,month:number,day:number,isLeap:boolean}|null}
 */
function parseLunar(text, nowYear) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  const s = raw.replace(/^农历/, '').replace(/\s+/g, '');

  // ---- 年份 ----
  let year = null;
  let rest = s;
  const arabic = /^(\d{4})\s*年/.exec(rest);
  if (arabic) {
    year = Number(arabic[1]);
    rest = rest.slice(arabic[0].length);
  } else {
    // 中文数字年份，如 二〇二六 / 二零二六
    const cn = /^([零〇一二三四五六七八九]{4})年/.exec(rest);
    if (cn) {
      year = cnYear(cn[1]);
      rest = rest.slice(cn[0].length);
    }
  }

  // ---- 闰月 ----
  let isLeap = false;
  if (rest.startsWith('闰')) {
    isLeap = true;
    rest = rest.slice(1);
  }

  // ---- 月份 ----
  // 既支持中文月名（五月），也支持阿拉伯数字（5月）—— 后者在开启
  // 「带号的都算农历」开关时必须能解析，否则开关形同虚设。
  let m = parseCnMonth(rest);
  if (!m) m = parseArabicMonth(rest);
  if (!m) return null;
  rest = rest.slice(m.len);

  // ---- 日期 ----
  let d = parseCnDay(rest);
  if (!d) d = parseArabicDay(rest);
  if (!d) return null;

  if (year === null) {
    year = nowYear || currentLunarYear();
  }
  if (year < MIN_YEAR || year > MAX_YEAR) return null;

  return { year, month: m.value, day: d.value, isLeap };
}

/** 四位中文数字年份，如 二〇二六 → 2026 */
function cnYear(str) {
  let n = 0;
  for (const ch of str) {
    const v = CN_NUM.indexOf(ch === '〇' ? '零' : ch);
    if (v < 0) return -1;
    n = n * 10 + v;
  }
  return n;
}

/** 今天是农历哪一年 */
function currentLunarYear() {
  const now = new Date();
  const l = solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return l ? l.year : now.getFullYear();
}

/**
 * 农历函数集合。必须放在农历算法定义之后，否则常量处于 TDZ 会报错。
 * 本文件内的转换逻辑统一走 lunar.xxx，测试也从这里取，避免散落两处。
 */
const lunar = {
  MIN_YEAR, MAX_YEAR, LUNAR_INFO, SOLAR_TERMS, GAN, ZHI,
  leapMonth, leapDays, monthDays, yearDays,
  solarToLunar, lunarToSolar, parseLunar, cnYear, currentLunarYear,
  cnDay, cnMonth, formatLunar, ganZhi, zodiac,
  solarTerm, termDay,
};

/* ------------------------------------------------------------------ *
 * 中文 / 阿拉伯数字的月日解析
 * ------------------------------------------------------------------ *
 * 为什么放在这里：parseLunar 要吃「农历五月初五」和「农历5月初5」两种写法，
 * 前者靠中文月名、后者靠阿拉伯数字，缺一个开关就形同虚设。
 * 它们只依赖上面的 cnDay / cnMonth，不碰设置、不碰 DOM。
 * ------------------------------------------------------------------ */
/**
 * 由 cnDay / cnMonth 的输出反查数值。
 * 手写解析容易漏掉「二十」「三十」这类特殊写法，
 * 直接用格式化函数生成全部候选再反查，天然保证正反一致。
 */
const DAY_MAP = (() => {
  const map = {};
  for (let d = 1; d <= 30; d++) map[cnDay(d)] = d;
  return map;
})();

const MONTH_MAP = (() => {
  const map = {};
  for (let m = 1; m <= 12; m++) map[cnMonth(m, false)] = m;
  return map;
})();

/** 按最长匹配原则，从文本开头取出一个 key 对应的值 */
function matchFrom(rest, map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (rest.startsWith(k)) return { value: map[k], len: k.length };
  }
  return null;
}

/** 解析农历月名（中文），返回 { value, len } */
function parseCnMonth(rest) {
  return matchFrom(rest, MONTH_MAP);
}

/** 解析「5月」这类阿拉伯数字月份，返回 { value, len } */
function parseArabicMonth(rest) {
  const m = /^(\d{1,2})月/.exec(String(rest ?? ''));
  if (!m) return null;
  const v = Number(m[1]);
  if (v < 1 || v > 12) return null;
  return { value: v, len: m[0].length };
}

/**
 * 解析「16号」「16日」这类阿拉伯数字日，返回 { value, len }。
 * 必须完整吃掉后面的「号 / 日」，否则残留字符会让整条解析失败。
 */
function parseArabicDay(rest) {
  const m = /^(\d{1,2})\s*[号日]/.exec(String(rest ?? ''));
  if (!m) return null;
  const v = Number(m[1]);
  if (v < 1 || v > 30) return null;
  return { value: v, len: m[0].length };
}

function parseCnDay(rest) {
  return matchFrom(rest, DAY_MAP);
}

module.exports = {
  lunar,
  MIN_YEAR,
  MAX_YEAR,
  CN_NUM,
  LUNAR_INFO,
  SOLAR_TERMS,
  GAN,
  ZHI,
  leapMonth,
  leapDays,
  monthDays,
  yearDays,
  solarToLunar,
  lunarToSolar,
  parseLunar,
  cnYear,
  currentLunarYear,
  cnDay,
  cnMonth,
  formatLunar,
  ganZhi,
  zodiac,
  solarTerm,
  termDay,
  buildYearOffsets,
  yearOffset,
  msToJde,
  jdeToDate,
  sunLongitude,
  DAY_MAP, MONTH_MAP, matchFrom,
  parseCnMonth, parseArabicMonth, parseArabicDay, parseCnDay,
};
