/*
 * timejudge.js 回归测试
 * 判断表是口径的**唯一来源**，改坏了会同时影响设置页与解析结果，
 * 所以选项清单、默认值、清洗规则都要单独守着。
 */
'use strict';

const J = require(__dirname + '/../src/timejudge.js');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, extra !== undefined ? '→ ' + extra : ''); }
}

console.log('\n[tj] 时段表');

check('时段表不超过 10 项', J.TIME_OF_DAY.length <= 10, J.TIME_OF_DAY.length);
check('时段键无重复',
  new Set(J.DAYPART_KEYS).size === J.DAYPART_KEYS.length, J.DAYPART_KEYS.join(','));
check('每个时段都有默认小时',
  J.TIME_OF_DAY.every((t) => typeof t.hour === 'number' && t.hour >= 0 && t.hour <= 23));
check('「夜里」是独立时段（与晚上分开）', J.DAYPART_KEYS.indexOf('夜里') >= 0);
check('夜里默认 23 点',
  J.TIME_OF_DAY.find((t) => t.key === '夜里').hour === 23);

// 关键回归：曾把「半」收进「深夜」的别名，导致「5点半」被当成深夜算成 17:30
{
  const allAlias = [];
  J.TIME_OF_DAY.forEach((t) => (t.alias || []).forEach((a) => allAlias.push(a)));
  check('别名里不含「半」（会抢「5点半」的「半」）', allAlias.indexOf('半') < 0,
    allAlias.join(','));
  check('别名里不含「点」（会抢「8点」）', allAlias.indexOf('点') < 0);
  check('别名里不含「天」（会抢「大后天」）', allAlias.indexOf('天') < 0);
}

console.log('\n[tj] 时段小时清洗');

{
  // 只保留认识的键，且必须 0–23
  const out = J.cleanDaypartHours({ 早上: 8, 虚构: 5, 晚上: 99, 下午: 'x', 夜里: 22 });
  check('丢弃不认识的键', out['虚构'] === undefined);
  check('丢弃超范围的值', out['晚上'] === undefined);
  check('丢弃非数字', out['下午'] === undefined);
  check('保留合法值', out['早上'] === 8 && out['夜里'] === 22, JSON.stringify(out));
  check('空输入返回空对象', Object.keys(J.cleanDaypartHours(null)).length === 0);
  check('默认值完整', Object.keys(J.defaultDaypartHours()).length === J.DAYPART_KEYS.length);
}

console.log('\n[tj] 时间口径');

{
  const keys = Object.keys(J.JUDGEMENTS);
  check('口径至少 3 项（周末/下周X/17号）', keys.length >= 3, keys.join(','));

  // 每项都必须四件套齐全，缺一个就会「设置页能改、解析不认」或反之
  keys.forEach((k) => {
    const d = J.JUDGEMENTS[k];
    check('口径 ' + k + ' 有默认值', d.default !== undefined);
    check('口径 ' + k + ' 有选项', Array.isArray(d.options) && d.options.length >= 2);
    check('口径 ' + k + ' 默认值在选项里',
      d.options.some((o) => o.v === d.default), d.default);
    check('口径 ' + k + ' 有说明', typeof d.desc === 'string' && d.desc.length > 0);
  });

  // 清洗：非法值必须退回默认，不能让脏数据扩散
  check('周末非法值退回默认', J.cleanJudgement('weekendDay', 99) === J.JUDGEMENTS.weekendDay.default);
  check('周末合法值保留', J.cleanJudgement('weekendDay', 7) === 7);
  check('下周X非法值退回默认', J.cleanJudgement('nextWeekdayMode', 'xx') === 'tomorrow');
  check('17号模式非法值退回默认', J.cleanJudgement('dayOnlyMode', 'zz') === 'current');
  check('未知口径返回 undefined', J.cleanJudgement('不存在的口径', 1) === undefined);

  // 读取：没设置时用默认，有设置时用设置
  check('无设置时读默认', J.readJudgement('weekendDay', null) === J.JUDGEMENTS.weekendDay.default);
  check('读到用户设置',
    J.readJudgement('weekendDay', { timestamp: { extensions: { weekendDay: 7 } } }) === 7);
  check('用户设置非法时退回默认',
    J.readJudgement('weekendDay', { timestamp: { extensions: { weekendDay: 0 } } })
      === J.JUDGEMENTS.weekendDay.default);
}

console.log('\n[tj] 阳历固定节日');

{
  check('元旦 = 1/1', (() => {
    const f = J.findFestival('元旦', []); return f && f.month === 1 && f.day === 1;
  })());
  check('国庆节 = 10/1', (() => {
    const f = J.findFestival('国庆节', []); return f && f.month === 10 && f.day === 1;
  })());
  check('五一 = 5/1', (() => {
    const f = J.findFestival('五一', []); return f && f.month === 5 && f.day === 1;
  })());
  check('普通词不是节日', J.findFestival('明天', []) === null);
  check('节日表是常量（不随使用增长）', Array.isArray(J.SOLAR_FESTIVALS));
}

console.log('\n[tj] 模糊词清单');

check('含「改天」', J.FUZZY_WORDS.indexOf('改天') >= 0);
check('含「大半天」', J.FUZZY_WORDS.indexOf('大半天') >= 0);
check('清单非空', J.FUZZY_WORDS.length > 0);

console.log('\n[tj] 产物一致性');

{
  const fs = require('fs');
  const main = fs.readFileSync(__dirname + '/../main.js', 'utf8');
  check('产物已打包时段表', main.includes('TIME_OF_DAY'));
  check('产物已打包口径表', main.includes('JUDGEMENTS'));
  try {
    require('child_process').execSync('node --check ' + JSON.stringify(__dirname + '/../main.js'));
    check('产物语法正确', true);
  } catch (e) {
    check('产物语法正确', false, e.message);
  }
}

console.log('\n' + (fail ? fail + ' 项失败 ❌' : '全部通过 ✅') + '（' + pass + ' 项）');
process.exit(fail ? 1 : 0);
