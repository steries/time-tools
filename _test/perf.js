/*
 * 性能基准：量化各热路径耗时，优化前后对比
 */
const path = __dirname + '/../src/';
const lunar = require(path + 'timestamp.js').lunar;
const ts = require(path + 'timestamp.js');
const { migrateSettings } = require(path + 'settings.js');

function bench(name, fn, iterations) {
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) fn(i);
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6;
  console.log(
    name.padEnd(42) +
    (ms.toFixed(2) + ' ms').padStart(12) +
    ('  ' + (ms * 1000 / iterations).toFixed(2) + ' µs/次').padStart(16)
  );
  return ms;
}

const N = 20000;
console.log('=== 农历 / 节气（' + N + ' 次）===\n');

bench('solarToLunar 近期年份(2026)', () => lunar.solarToLunar(2026, 9, 19), N);
bench('solarToLunar 远期年份(2099)', () => lunar.solarToLunar(2099, 9, 19), N);
bench('lunarToSolar', () => lunar.lunarToSolar(2026, 8, 19, false), N);
bench('termDay 单次', () => lunar.termDay(2026, 2), N);
bench('solarTerm 查某天(内调2次termDay)', () => lunar.solarTerm(2026, 2, 4), N);
bench('yearDays', () => lunar.yearDays(2026), N);
bench('ganZhi', () => lunar.ganZhi(2026), N);

console.log('\n=== 时间转换 ===\n');
const st = migrateSettings(null);
const plugin = { settings: st, app: {} };

bench('parseToDate 标准日期', () => ts.parseToDate('2026-09-19'), N);
bench('parseToDate 无法解析', () => ts.parseToDate('随便一段话'), N);
bench('compute 转农历', () => ts.compute(plugin, 'lunar', '2026-09-19'), N);
bench('compute 相对时间', () => ts.compute(plugin, 'relative', '2026-09-19'), N);
bench('compute 补星期', () => ts.compute(plugin, 'weekday', '2026-09-19'), N);
bench('compute 查节气', () => ts.compute(plugin, 'solarTerm', '2026-02-04'), N);
bench('compute 农历转阳历', () => ts.compute(plugin, 'lunarToSolar', '八月十九'), N);
bench('parseLunar', () => lunar.parseLunar('2026年八月十九'), N);

console.log('\n=== 全量扫描 ===\n');
bench('1900-2100 全部年份 yearDays', () => {
  for (let y = 1900; y <= 2100; y++) lunar.yearDays(y);
}, 200);
bench('1900-2100 全部 solarToLunar', () => {
  for (let y = 1900; y <= 2100; y++) lunar.solarToLunar(y, 6, 15);
}, 20);
bench('365 天连续 solarToLunar', () => {
  const base = Date.UTC(2026, 0, 1);
  for (let d = 0; d < 365; d++) {
    const dt = new Date(base + d * 86400000);
    lunar.solarToLunar(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
}, 20);
