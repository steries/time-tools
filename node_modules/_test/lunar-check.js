const L = require(__dirname + '/../src/timestamp.js').lunar;

console.log('数据表长度:', L.LUNAR_INFO.length, '（应为 201）\n');

// 已知日期核对（对照公开农历日历）
const cases = [
  ['1900-01-31', '农历1900年正月初一'],   // 基准
  ['2026-09-19', null],
  ['2026-02-17', null],                    // 2026 春节：丙午年正月初一
  ['2025-01-29', null],                    // 2025 春节：乙巳年正月初一
  ['2024-02-10', null],                    // 2024 春节：甲辰年正月初一
  ['2020-01-25', null],                    // 2020 春节：庚子年正月初一
  ['2023-03-22', null],                    // 闰二月年
  ['2023-02-20', null],                    // 2023 二月初一
  ['2023-03-22', null],                    // 2023 闰二月初一
  ['2023-04-20', null],                    // 2023 三月初一
];

cases.forEach(([date]) => {
  const [y, m, d] = date.split('-').map(Number);
  const l = L.solarToLunar(y, m, d);
  console.log(date, '→', l ? L.formatLunar(l) : 'null',
    l ? `(${L.ganZhi(l.year)}${L.zodiac(l.year)}年${l.isLeap ? ' 闰月' : ''})` : '');
});

console.log('\n--- 节气抽查 ---');
[['2026-02-04','立春'],['2026-04-05','清明'],['2026-12-21','冬至'],['2026-09-23','秋分']]
.forEach(([date, expect]) => {
  const [y,m,d] = date.split('-').map(Number);
  const got = L.solarTerm(y,m,d);
  console.log(date, '→', got, got === expect ? '✓' : `(期望 ${expect})`);
});

console.log('\n--- 干支/生肖 ---');
[[2026,'丙午','马'],[2024,'甲辰','龙'],[2020,'庚子','鼠'],[1984,'甲子','鼠']].forEach(([y,g,z])=>{
  console.log(y, '→', L.ganZhi(y), L.zodiac(y), (L.ganZhi(y)===g && L.zodiac(y)===z) ? '✓' : `✗ 期望 ${g}${z}`);
});
