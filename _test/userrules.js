/*
 * 时间戳「自定义转换规则」—— v2.88 欠账，v2.95 真写入
 *
 * 词表再全也覆盖不了所有人的说法，所以留一个窗口让用户自己补，
 * 或者覆盖他认为不合适的结果。三条硬约束：
 *   1. 覆盖 = 隐藏，不是抹除：内置规则永远在，用户规则只在结果之上生效，
 *      删掉自己写的行，内置结果自动回来（不需要「恢复默认」按钮）
 *   2. 用户规则先执行，长文本优先（否则「大后天」被「后天」抢先，剩个「大」字）
 *   3. 只对「选中转换」生效，不参与日历解析（两套混用会互相干扰）
 */
const path = __dirname + '/../src/';
const ts = require(path + 'timestamp.js');
const settings = require(path + 'settings.js');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

const parse = ts.parseUserRules;
const apply = ts.applyUserRules;

function mkSettings(rules) {
  const s = JSON.parse(JSON.stringify(settings.DEFAULT_SETTINGS));
  s.timestamp.extensions.userRules = rules;
  return s;
}

console.log('\n[1] 解析：格式与容错');
check('parseUserRules 已导出', typeof parse === 'function');
check('applyUserRules 已导出', typeof apply === 'function');
let r = parse('明天 = 后天');
check('等号规则解析', r.length === 1 && r[0].from === '明天' && r[0].op === '=' && r[0].to === '后天',
  JSON.stringify(r));
r = parse('2026-10-01 + 发货日');
check('加号规则解析', r.length === 1 && r[0].op === '+' && r[0].to === '发货日', JSON.stringify(r));
r = parse('昨天 -');
check('减号规则解析（结果可空）', r.length === 1 && r[0].op === '-' && r[0].to === '', JSON.stringify(r));
check('空文本返回空数组', parse('').length === 0);
check('非字符串返回空数组', parse(null).length === 0 && parse(undefined).length === 0);
check('空行与 # 注释跳过', parse('# 注释\n\n明天 = 后天\n').length === 1);
check('格式不对的行跳过（不报错）', parse('这是一行没有操作符的话').length === 0);
check('多行解析', parse('明天 = 后天\n昨天 -\n明年 = 2028').length === 3);

console.log('\n[2] 长文本优先（最易翻车点）');
r = parse('后天 = X\n大后天 = Y');
check('大后天排在明天前面（长的先试）', r[0].from === '大后天', JSON.stringify(r.map((x) => x.from)));
check('命中「大后天」不被「后天」抢走',
  apply('大后天', '2026-09-24', mkSettings('后天 = X\n大后天 = Y')) === 'Y');

console.log('\n[3] = 替换 / + 追加 / - 隐藏');
check('= 替换内置结果',
  apply('明天', '2026-09-22', mkSettings('明天 = 后天')) === '后天');
check('= 结果留空即隐藏（返回 null，该项不出现）',
  apply('明天', '2026-09-22', mkSettings('明天 =')) === null);
check('+ 追加（保留内置结果再接一段）',
  apply('2026-10-01', '2026-10-01', mkSettings('2026-10-01 + 发货日')) === '2026-10-01发货日');
check('- 隐藏（返回 null）',
  apply('昨天', '2026-09-20', mkSettings('昨天 -')) === null);
check('未命中时原样返回内置结果',
  apply('明天', '2026-09-22', mkSettings('去年 = 前年')) === '2026-09-22');

console.log('\n[4] 覆盖 = 隐藏而非抹除（核心约束）');
check('没有规则时走内置结果',
  apply('明天', '2026-09-22', mkSettings('')) === '2026-09-22');
check('删掉规则后内置结果自动恢复（不需要恢复按钮）',
  apply('明天', '2026-09-22', mkSettings('明天 = 后天')) === '后天' &&
  apply('明天', '2026-09-22', mkSettings('')) === '2026-09-22');
check('规则为空白字符串也走内置',
  apply('明天', '2026-09-22', mkSettings('   \n\n  ')) === '2026-09-22');

console.log('\n[5] 上限与清洗');
const many = [];
for (let i = 0; i < 300; i++) many.push('词' + i + ' = 值' + i);
check('条数上限 200（不会无限增长）', parse(many.join('\n')).length === ts.USER_RULES_MAX,
  parse(many.join('\n')).length);
const long = 'x'.repeat(300) + ' = y';
check('单条超长直接丢弃（不静默截断）', parse(long).length === 0);
check('上限常量已导出', typeof ts.USER_RULES_MAX === 'number' && typeof ts.USER_RULE_LEN_MAX === 'number');

console.log('\n[6] 配置层：迁移不会丢、也不会留脏数据');
const d = settings.DEFAULT_SETTINGS;
check('默认配置含 userRules 且为空串', d.timestamp.extensions.userRules === '');
const migrated = settings.migrateSettings({ timestamp: { extensions: { userRules: 123 } } });
check('非字符串被清洗为空串', migrated.timestamp.extensions.userRules === '');
const kept = settings.migrateSettings({ timestamp: { extensions: { userRules: '明天 = 后天' } } });
check('合法文本被保留', kept.timestamp.extensions.userRules === '明天 = 后天');
const m2 = settings.migrateSettings({ timestamp: { extensions: { userRules: 'a = b' } } });
check('迁移幂等（跑两次结果一致）',
  settings.migrateSettings(m2).timestamp.extensions.userRules === 'a = b');

console.log('\n[7] 不参与日历解析（隔离约束）');
// 用户规则只作用在 compute 出口；日历的日期识别走 parseToDate，不受影响。
// 用绝对日期做样本：相对词（明天）由 parseRelative 处理，不走 parseToDate。
const d1 = ts.parseToDate('2026-10-01', d);
check('parseToDate 不受 userRules 影响（仍解析为日期）', d1 instanceof Date, d1);
const s2 = mkSettings('2026-10-01 = 1999-01-01');
const d2 = ts.parseToDate('2026-10-01', s2);
check('设了替换规则后 parseToDate 结果不变（隔离生效）',
  d1 instanceof Date && d2 instanceof Date && d1.getTime() === d2.getTime(),
  d2);

console.log('\n[8] 分隔符容错');
check('空格分隔', parse('明天 = 后天')[0].to === '后天');
check('Tab 分隔', parse('明天\t=\t后天')[0].to === '后天');
check('竖线分隔', parse('明天|=|后天')[0].to === '后天');
check('无空格紧贴', parse('明天=后天')[0].to === '后天');

console.log('\n[8.5] 参与日历解析（A3：开关默认关，打开才生效）');
{
  const cal = require(path + 'calendar.js');
  const notesCfg = { daily: { format: 'YYYY-MM-DD', folder: '日记' } };
  const st = (rules, on) => ({
    timestamp: { extensions: { userRules: rules, userRulesForCalendar: on } },
    notes: notesCfg,
  });
  const ref = (name, rules, on) => {
    const s = st(rules, on);
    const r = cal.parseNoteRef(name, 0, s.notes, s);
    return r ? r.kind : null;
  };
  const LEGACY = '日记本-2026年09月25日';
  const RULE = '日记本-2026年09月25日 = 2026-09-25';

  check('开关关：旧命名认不出（原有行为不变）', ref(LEGACY, RULE, false) === null, ref(LEGACY, RULE, false));
  check('开关开：旧命名经规则还原后被认出', ref(LEGACY, RULE, true) === 'day', ref(LEGACY, RULE, true));
  check('开关开：标准命名不受影响', ref('2026-09-25', '日记本-2026年09月25日 = 2026-09-25', true) === 'day');
  check('开关开：规则未命中时原样解析', ref('2026-09-26', '日记本-2026年09月25日 = 2026-09-25', true) === 'day');
  check('“-” 规则＝忽略该文件', ref('2026-09-25', '2026-09-25 -', true) === null);
  check('“-” 规则不影响别的文件', ref('2026-09-26', '2026-09-25 -', true) === 'day');
  check('未传 settings 时不套规则（不崩）', cal.parseNoteRef(LEGACY, 0, notesCfg) === null);

  // 反证：把开关判断去掉（恒为开），[开关关] 那条应失败
  const off = ts.applyUserRulesToName(LEGACY, st(RULE, false));
  check('开关关时 applyUserRulesToName 原样返回', off.name === LEGACY && off.hide === false, off);
  const on = ts.applyUserRulesToName(LEGACY, st(RULE, true));
  check('开关开时 applyUserRulesToName 做子串替换', on.name === '2026-09-25', on);
}

console.log('\n[9] 反证：本套件确实抓得住（不是摆设）');
// 若把「长文本优先」去掉，[2] 的断言会失败；这里确认排序确实生效
const sorted = parse('后天 = X\n大后天 = Y\n大大后天 = Z');
check('三条按长度降序', sorted[0].from === '大大后天' && sorted[2].from === '后天',
  JSON.stringify(sorted.map((x) => x.from)));

console.log('\n' + (failures === 0 ? '全部通过' : failures + ' 项失败'));
process.exit(failures === 0 ? 0 : 1);
