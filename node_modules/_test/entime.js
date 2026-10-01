/*
 * 英文时间解析守卫（v3.31）
 * ------------------------------------------------------------------
 * 三项都是「README 明文承诺、代码却没有」或「中英不一致」：
 *
 *   §5 英文时段被误门控：this morning / tomorrow afternoon / last night
 *      全部沿用基准时刻（时段被丢弃），而中文「明天下午」→ 15:00 是对的。
 *      根因是走了 convertDaypartAlone 开关 —— 那开关管的是**裸时段词**
 *      （单独选中"早上"别给它编时刻），而 WORD_REL 里带 daypart 的 8 条
 *      全都有日期锚点，时段是限定词，不该被它挡。
 *
 *   §6 口语日 + 时刻：tomorrow 5pm / next Monday 10am 全 null。
 *      src 原本零处 am/pm 处理。
 *
 *   §7 裸时刻：8am / 7:30pm / noon / midnight 全 null，
 *      连 looksLikeRelative 都过不了 → 转换菜单根本不弹，用户看到"没反应"。
 *
 * 另外顺带守 applyWordYmd 的月份钳制：next month 在月末会跨月溢出。
 *
 * 反证方法：
 *   §5：把 w.daypart 分支加回 convertDaypartAlone 门控 → A 组 8 条全红，
 *       而 B 组（中文对照）不受影响。
 *   §6：删掉 splitEnglishDayClock 的调用 → C 组 5 条全红。
 *   §7：删掉 parseClockEN 的裸时刻分支 → D 组 5 条全红。
 */

'use strict';

process.env.TZ = 'UTC';

const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ta = require(path.join(SRC, 'timestamp.js'));
const st = require(path.join(SRC, 'settings.js'));

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

/* 固定基准 2026-09-30 10:00（周三），否则「tomorrow」随运行日期漂移 */
const BASE = new Date(Date.UTC(2026, 8, 30, 10, 0, 0));
const plugin = { settings: JSON.parse(JSON.stringify(st.DEFAULT_SETTINGS)) };
/** 解析成 'YYYY-MM-DD HH:mm'，null 显示为字符串 'null' */
function pc(text) {
  let d;
  try { d = ta.resolveToDate(plugin, text, { base: BASE }); }
  catch (e) { return 'ERR:' + e.message; }
  if (!d) return 'null';
  const p = (n) => String(n).padStart(2, '0');
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate())
    + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
}

console.log('\n[A] 英文时段不再被 convertDaypartAlone 误门控（§5）');
/* 2026-09-30 是周三：tomorrow=10-01，last night=09-29 */
check('this morning → 09:00', pc('this morning') === '2026-09-30 09:00', pc('this morning'));
check('this afternoon → 15:00', pc('this afternoon') === '2026-09-30 15:00', pc('this afternoon'));
check('tomorrow morning → 10-01 09:00', pc('tomorrow morning') === '2026-10-01 09:00', pc('tomorrow morning'));
check('tomorrow afternoon → 10-01 15:00', pc('tomorrow afternoon') === '2026-10-01 15:00', pc('tomorrow afternoon'));
check('last night → 09-29 20:00', pc('last night') === '2026-09-29 20:00', pc('last night'));
check('tonight → 20:00', pc('tonight') === '2026-09-30 20:00', pc('tonight'));
check('tomorrow evening → 10-01 20:00', pc('tomorrow evening') === '2026-10-01 20:00', pc('tomorrow evening'));
check('this evening → 20:00', pc('this evening') === '2026-09-30 20:00', pc('this evening'));

console.log('\n[B] 中文对照（回归，证明中英口径一致）');
check('明天早上 → 10-01 09:00', pc('明天早上') === '2026-10-01 09:00', pc('明天早上'));
check('明天下午 → 10-01 15:00', pc('明天下午') === '2026-10-01 15:00', pc('明天下午'));
check('昨天晚上 → 09-29 20:00', pc('昨天晚上') === '2026-09-29 20:00', pc('昨天晚上'));

console.log('\n[C] 英文口语日 + 时刻（§6，README 承诺）');
check('tomorrow 5pm → 10-01 17:00', pc('tomorrow 5pm') === '2026-10-01 17:00', pc('tomorrow 5pm'));
check('yesterday 3pm → 09-29 15:00', pc('yesterday 3pm') === '2026-09-29 15:00', pc('yesterday 3pm'));
check('tomorrow 5 pm（带空格）', pc('tomorrow 5 pm') === '2026-10-01 17:00', pc('tomorrow 5 pm'));
check('Monday 3pm → 本周一 15:00', pc('Monday 3pm') === '2026-09-28 15:00', pc('Monday 3pm'));
check('next Monday 10am → 下周一 10:00', pc('next Monday 10am') === '2026-10-05 10:00', pc('next Monday 10am'));
check('中文对照 明天下午5点 → 10-01 17:00', pc('明天下午5点') === '2026-10-01 17:00', pc('明天下午5点'));

console.log('\n[D] 英文裸时刻（§7，README 承诺）');
check('8am → 08:00', pc('8am') === '2026-09-30 08:00', pc('8am'));
check('8 am（带空格）', pc('8 am') === '2026-09-30 08:00', pc('8 am'));
check('7:30pm → 19:30', pc('7:30pm') === '2026-09-30 19:30', pc('7:30pm'));
check('noon → 12:00', pc('noon') === '2026-09-30 12:00', pc('noon'));
check('midnight → 00:00', pc('midnight') === '2026-09-30 00:00', pc('midnight'));

console.log('\n[E] 12 小时制边界');
check('12pm → 12:00（不是 00:00）', pc('12pm') === '2026-09-30 12:00', pc('12pm'));
check('12am → 00:00', pc('12am') === '2026-09-30 00:00', pc('12am'));
check('13pm 不合法 → null', pc('13pm') === 'null', pc('13pm'));
check('英文冒号时刻不受影响（回归）', pc('12:45') === '2026-09-30 12:45', pc('12:45'));

console.log('\n[F] 月份钳制（next month 在月末不得溢出）');
/* 基准换成 01-31，next month 直接 setMonth 会变 03-03 */
function pcAt(y, mo, d, text) {
  const b = new Date(Date.UTC(y, mo - 1, d, 10, 0, 0));
  let r;
  try { r = ta.resolveToDate(plugin, text, { base: b }); } catch (e) { return 'ERR'; }
  if (!r) return 'null';
  const p = (n) => String(n).padStart(2, '0');
  return r.getUTCFullYear() + '-' + p(r.getUTCMonth() + 1) + '-' + p(r.getUTCDate());
}
check('01-31 的 next month → 02-28（不是 03-03）',
  pcAt(2026, 1, 31, 'next month') === '2026-02-28', pcAt(2026, 1, 31, 'next month'));

console.log('\n' + (fail === 0 ? '全部通过 ✅' : fail + ' 项失败 ❌'));
console.log('套件: entime');
process.exit(fail === 0 ? 0 : 1);
