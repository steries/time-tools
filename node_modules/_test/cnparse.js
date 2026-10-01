/*
 * 中文时间表达解析守卫（v3.30）
 * ------------------------------------------------------------------
 * 目的：守住三个「用户这么写、代码不认」的 bug，防止回退。
 *
 *   B  下周三下午2点   剥尾部周X 的正则没带上/下/本前缀，剩一个「下」
 *                      → leftover 非空 → 整条判 null
 *      （WEEKDAY_RE 本来带前缀，是同文件里的不一致）
 *
 *   C  周五上午10点    DAYPART_TAIL_RE 只用 key 拼，丢了 re 里的别名
 *      （上午/早晨/正午/晌午/黄昏/夜晚…）→ 尾部剥不掉 → 整条判 null
 *      （splitDaypart 用 t.re，别名全认；只有尾部这处出问题）
 *
 *   D  2026-09-19下午3点  复合解析只认带「年月日」字样的日期，
 *      纯数字日期无处安放 → leftover 非空 → 判 null
 *      修法是在 leftover 检查**之前**加 parseToDate 兜底
 *      （放在之后的话 leftover 那句已经 return null 了，兜底永远到不了）
 *
 * 三者共同点：都不是「算错」，而是整条静默失败 —— 用户看到的是
 * "选中了没反应"，比算错更难发现。
 *
 * 断言刻意不写死绝对日期（那会让测试明天就红），只断言
 * 「星期 / 时刻 / 与不带时刻的写法落在同一天」这类相对性质。
 */

'use strict';

const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ts = require(path.join(SRC, 'timestamp.js'));

const PLUGIN = {
  settings: { timestamp: { format: 'YYYY-MM-DD HH:mm:ss', extensions: {} } },
};

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

function res(text) {
  const d = ts.resolveToDate(PLUGIN, text, {});
  return d && !isNaN(d.getTime()) ? d : null;
}
function show(text) {
  const d = res(text);
  if (!d) return 'null';
  return (
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' + d.getHours() + ':' +
    String(d.getMinutes()).padStart(2, '0') + ' 周' + d.getDay()
  );
}
/** 期望：星期 wd、时刻 h:mi */
function expect(text, wd, h, mi) {
  const d = res(text);
  return !!d && d.getDay() === wd && d.getHours() === h && d.getMinutes() === mi;
}
/**
 * n 天后的星期（0=周日）。
 * 「明天/昨天」这类相对日的星期**随今天变化**，写死数字会让测试隔天就红 ——
 * 这里按运行当天现算，断言仍只校验性质（时刻 + 落在正确的那一天）。
 */
function dayAfter(n) {
  return new Date(Date.now() + n * 86400000).getDay();
}
/** 与不带时刻的写法落在同一天（前缀解析一致） */
function sameDayAs(a, b) {
  const da = res(a);
  const db = res(b);
  if (!da || !db) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

console.log('中文时间表达解析（cnparse）');

// ── B 组 · 周X 前缀 + 时刻（7 项）────────────────────────────────
check('下周三下午2点 解析成功（周三 14:00）', expect('下周三下午2点', 3, 14, 0), show('下周三下午2点'));
check('下周三下午2点 与「下周三」同一天', sameDayAs('下周三下午2点', '下周三'), show('下周三下午2点') + ' vs ' + show('下周三'));
check('本周五下午3点 与「本周五」同一天且 15:00', sameDayAs('本周五下午3点', '本周五') && expect('本周五下午3点', 5, 15, 0), show('本周五下午3点'));
check('上周五下午3点 与「上周五」同一天且 15:00', sameDayAs('上周五下午3点', '上周五') && expect('上周五下午3点', 5, 15, 0), show('上周五下午3点'));
check('下周一早上8点 解析成功（周一 8:00）', expect('下周一早上8点', 1, 8, 0), show('下周一早上8点'));
check('下周日晚上8点 解析成功（周日 20:00）', expect('下周日晚上8点', 0, 20, 0), show('下周日晚上8点'));
check('回归：周三下午2点 仍正确（周三 14:00）', expect('周三下午2点', 3, 14, 0), show('周三下午2点'));

// ── C 组 · 时段别名在尾部也能剥掉（8 项）─────────────────────────
check('周五上午10点 → 10:00', expect('周五上午10点', 5, 10, 0), show('周五上午10点'));
check('周五早晨10点 → 10:00', expect('周五早晨10点', 5, 10, 0), show('周五早晨10点'));
check('周五正午10点 → 10:00', expect('周五正午10点', 5, 10, 0), show('周五正午10点'));
check('周五晌午10点 → 10:00', expect('周五晌午10点', 5, 10, 0), show('周五晌午10点'));
check('周五黄昏10点 → 22:00（傍晚系 pm）', expect('周五黄昏10点', 5, 22, 0), show('周五黄昏10点'));
check('周五夜晚10点 → 22:00（晚上系 pm）', expect('周五夜晚10点', 5, 22, 0), show('周五夜晚10点'));
check('回归：周五早上10点 → 10:00', expect('周五早上10点', 5, 10, 0), show('周五早上10点'));
check('回归：周五下午10点 → 22:00', expect('周五下午10点', 5, 22, 0), show('周五下午10点'));

// ── D 组 · 阿拉伯数字日期 + 时段 + 时刻（4 项）───────────────────
function isSep19_15(text) {
  const d = res(text);
  return (
    !!d && d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 19 &&
    d.getHours() === 15 && d.getMinutes() === 0
  );
}
check("2026-09-19下午3点 → 2026-09-19 15:00", isSep19_15('2026-09-19下午3点'), show('2026-09-19下午3点'));
check("2026-09-19 下午3点 → 2026-09-19 15:00", isSep19_15('2026-09-19 下午3点'), show('2026-09-19 下午3点'));
check("2026/09/19下午3点 → 2026-09-19 15:00", isSep19_15('2026/09/19下午3点'), show('2026/09/19下午3点'));
check('回归：2026年9月19日下午3点 仍正确', isSep19_15('2026年9月19日下午3点'), show('2026年9月19日下午3点'));

// ── E 组 · 中文全角冒号（带前缀时也必须认）─────────────────────
/*
 * parseClockCN 里的时钟正则只写半角「:」，而同文件的 TIME_ONLY_RE 写的是 [:：]。
 * 于是裸写「12：45」能认（走 TIME_ONLY_RE 兜底），
 * 一旦带时段或日期前缀就落到 parseClockCN，整条判 null ——
 * 用户会遇到"单独写 12：45 能转，写下午3：00 没反应"。
 */
function isClock(text, h, mi) {
  const d = res(text);
  return !!d && d.getHours() === h && d.getMinutes() === mi;
}
check('下午3：00 → 15:00（全角冒号 + 时段前缀）', isClock('下午3：00', 15, 0), show('下午3：00'));
check('晚上7：30 → 19:30（全角冒号 + 时段前缀）', isClock('晚上7：30', 19, 30), show('晚上7：30'));
check('明天下午3：00 → 15:00（全角 + 日期前缀）', isClock('明天下午3：00', 15, 0), show('明天下午3：00'));
check('回归：下午3:00（半角）仍正确 → 15:00', isClock('下午3:00', 15, 0), show('下午3:00'));
check('回归：12：45（裸写全角）仍正确 → 12:45', isClock('12：45', 12, 45), show('12：45'));
check('回归：12:45（裸写半角）仍正确 → 12:45', isClock('12:45', 12, 45), show('12:45'));
check('回归：3：00（裸写全角）仍正确 → 03:00', isClock('3：00', 3, 0), show('3：00'));

// ── F 组 · 「中午」口径（6 项）────────────────────────────────────
/*
 * 中文说「中午1点」就是下午 1 点，但不能把「中午」简单标成 pm:true ——
 * 那会让「中午11点」变成 23:00（错）。中午覆盖 11:00~13:00，
 * 故 11、12 保持不动，1~10 按 PM 理解。这是口径取舍，已记进启动卡口径表。
 */
check('中午1点 → 13:00', isClock('中午1点', 13, 0), show('中午1点'));
check('中午2点 → 14:00', isClock('中午2点', 14, 0), show('中午2点'));
check('中午11点 → 11:00（不翻 PM）', isClock('中午11点', 11, 0), show('中午11点'));
check('中午12点 → 12:00（不翻 PM）', isClock('中午12点', 12, 0), show('中午12点'));
check('回归：下午5点 → 17:00（pm 路径未受影响）', isClock('下午5点', 17, 0), show('下午5点'));
check('回归：早上8点 → 08:00（am 路径未受影响）', isClock('早上8点', 8, 0), show('早上8点'));

// ── 兜底安全性（2 项）────────────────────────────────────────────
// D 的兜底引入了一条「整串能解析就接受」的新路径，必须确认它不会误收垃圾。
check('回归：明天下午3点 仍正确（明天 15:00）', expect('明天下午3点', dayAfter(1), 15, 0), show('明天下午3点'));
check('兜底不得误收：乱七八糟xx下午3点 应为 null', res('乱七八糟xx下午3点') === null, show('乱七八糟xx下午3点'));

console.log('通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail ? 1 : 0);
