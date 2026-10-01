/*
 * 节日转换专项测试
 * ------------------------------------------------------------------
 * 覆盖：
 *   1. 自设节日解析（四种写法 + 容错）
 *   2. 正向：日期 → 节日
 *   3. 逆向：节日 → 日期（含跨年取下一年的口径）
 *   4. festivalPrefix 开关的两个方向
 *   5. 农历总开关对农历节日的影响
 *   6. 废弃数据不积累（迁移后字段固定、非法行被丢弃）
 */

'use strict';

const path = require('path');
const SRC = __dirname + '/../src';
const judge = require(path.join(SRC, 'timejudge.js'));

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log('  ✓ ' + name);
  } else {
    fail++;
    console.log('  ✗ ' + name + (extra === undefined ? '' : '  → ' + extra));
  }
}

/* ---------- 1. 自设节日解析 ---------- */
console.log('[1] 自设节日解析');
{
  const list = judge.parseCustomFestivals(
    ['妈妈生日 = 10-15', '公司年会 = 2026-12-31', '观音诞 = 农历二月十九',
      '母亲节 = 5月第2个周日', '父亲节 = 6月第3个周日'].join('\n')
  );
  check('解析出 5 条', list.length === 5, list.length);
  const byName = {};
  list.forEach((it) => { byName[it.name] = it; });
  check('阳历月日每年重复', byName['妈妈生日'].kind === 'solar'
    && byName['妈妈生日'].month === 10 && byName['妈妈生日'].day === 15
    && !byName['妈妈生日'].year);
  check('带年只那一年', byName['公司年会'].kind === 'solar'
    && byName['公司年会'].year === 2026);
  check('农历按月日', byName['观音诞'].kind === 'lunar'
    && byName['观音诞'].month === 2 && byName['观音诞'].day === 19);
  check('第2个周日', byName['母亲节'].kind === 'nth'
    && byName['母亲节'].nth === 2 && byName['母亲节'].weekday === 0);
  check('第3个周日', byName['父亲节'].nth === 3 && byName['父亲节'].weekday === 0);

  // 报错：中文顿号、冒号、逗号分隔
  const sep = judge.parseCustomFestivals('甲：3-1\n乙，3-2\n丙=3-3');
  check('支持 ：，= 三种分隔符', sep.length === 3, sep.length);

  // 容错
  check('空文本不报错', judge.parseCustomFestivals('').length === 0);
  check('注释行被跳过', judge.parseCustomFestivals('# 说明\n甲=3-1').length === 1);
  check('无分隔符的行被跳过', judge.parseCustomFestivals('乱写一行').length === 0);
  check('非法日期被丢弃（2月30日）', judge.parseCustomFestivals('甲=2-30').length === 0);
  check('非法月份被丢弃', judge.parseCustomFestivals('甲=13-01').length === 0);
  check('同名后写覆盖先写', (() => {
    const r = judge.parseCustomFestivals('甲=3-1\n甲=4-2');
    return r.length === 1 && r[0].month === 4;
  })());
}

/* ---------- 2. 内置节日表 ---------- */
console.log('[2] 内置节日表');
{
  check('阳历固定表非空', judge.SOLAR_FESTIVALS.length > 0);
  check('农历浮动表非空', judge.LUNAR_FESTIVALS.length > 0);
  check('国庆在 10-01', judge.findFestival('国庆', []).month === 10);
  check('长名优先（国庆节）', judge.findFestival('国庆节', []).name === '国庆节');
  check('春节按农历', judge.findFestival('春节', []).kind === 'lunar');
  check('中秋按农历八月十五', (() => {
    const f = judge.findFestival('中秋', []);
    return f.kind === 'lunar' && f.month === 8 && f.day === 15;
  })());
  check('自设优先于内置', (() => {
    const f = judge.findFestival('国庆', [{ name: '国庆', kind: 'solar', month: 12, day: 1 }]);
    return f.kind === 'solar' && f.month === 12;
  })());
  check('查不到的词返回 null', judge.findFestival('随便一个词', []) === null);
}

/* ---------- 3. 正向与逆向的日期计算 ---------- */
console.log('[3] 节日日期计算');
const timestamp = require(path.join(SRC, 'timestamp.js'));
const settings = require(path.join(SRC, 'settings.js'));

/** 造一个最小 plugin 替身，只为喂给 compute */
function makePlugin(ext) {
  const base = settings.migrateSettings(null);
  Object.assign(base.timestamp.extensions, ext);
  base.timestamp.format = 'YYYY-MM-DD';
  return {
    settings: base,
    app: { workspace: { getLeavesOfType: () => [] } },
  };
}

function run(plugin, key, raw, base) {
  return timestamp.compute(plugin, key, raw, base ? { base } : {});
}

{
  const p = makePlugin({ festivalPrefix: true });

  // 正向：日期 → 节日
  check('2026-10-01 → 国庆节 2026-10-01',
    run(p, 'festival', '2026-10-01') === '国庆节 2026-10-01',
    run(p, 'festival', '2026-10-01'));
  check('2026-01-01 → 元旦', /元旦/.test(run(p, 'festival', '2026-01-01') || ''),
    run(p, 'festival', '2026-01-01'));
  check('非节日返回 null', run(p, 'festival', '2026-09-20') === null,
    run(p, 'festival', '2026-09-20'));

  // 逆向：节日 → 日期
  const mid = run(p, 'festivalToDate', '中秋');
  check('中秋 → 中秋 + 日期', /^中秋 \d{4}-\d{2}-\d{2}$/.test(mid || ''), mid);
  check('中秋落在 9 月或 10 月', mid && ['09', '10'].indexOf(mid.slice(8, 10)) >= 0, mid);
  check('国庆 → 国庆 + 10-01', /-10-01$/.test(run(p, 'festivalToDate', '国庆') || ''),
    run(p, 'festivalToDate', '国庆'));
  check('查不到的节日返回 null', run(p, 'festivalToDate', '不存在的节') === null);

  // 自设节日正反都能用
  const p2 = makePlugin({ festivalPrefix: true, customFestivals: '妈妈生日 = 10-15' });
  check('自设：日期 → 名称', run(p2, 'festival', '2026-10-15') === '妈妈生日 2026-10-15',
    run(p2, 'festival', '2026-10-15'));
  check('自设：名称 → 日期', /妈妈生日 \d{4}-10-15/.test(run(p2, 'festivalToDate', '妈妈生日') || ''),
    run(p2, 'festivalToDate', '妈妈生日'));

  // 序数星期
  const p3 = makePlugin({ customFestivals: '母亲节 = 5月第2个周日' });
  const m = run(p3, 'festivalToDate', '母亲节');
  if (m) {
    const d = new Date(m.slice(m.length - 10));
    check('母亲节是周日', d.getDay() === 0, d.toString());
    check('母亲节在 5 月', d.getMonth() === 4, d.toString());
    check('母亲节是 5 月第 2 个周日', d.getDate() >= 8 && d.getDate() <= 14, d.getDate());
  } else {
    check('母亲节算出日期', false, m);
  }
}

/* ---------- 3b. 跨年口径 ---------- */
console.log('[3b] 跨年：已过的节日取下一年的');
{
  const p = makePlugin({ festivalPrefix: false });
  // 基准 2026-12-25，说「元旦」多半指 2027 那个
  const after = run(p, 'festivalToDate', '元旦', new Date(2026, 11, 25));
  check('12月底说元旦 → 次年 01-01', after === '2027-01-01', after);
  // 基准 2026-01-05，元旦刚过 4 天 → 同样取次年（已过）
  const jan = run(p, 'festivalToDate', '元旦', new Date(2026, 0, 5));
  check('元旦刚过也取次年', jan === '2027-01-01', jan);
  // 基准正好是节日当天 → 不跳
  const today = run(p, 'festivalToDate', '国庆', new Date(2026, 9, 1));
  check('当天不跳到下一年', today === '2026-10-01', today);
  // 带年份的自设节日不参与跨年推移
  const py = makePlugin({ festivalPrefix: false, customFestivals: '年会 = 2026-12-31' });
  check('带年份的自设节日不推移', run(py, 'festivalToDate', '年会', new Date(2027, 0, 5)) === null,
    run(py, 'festivalToDate', '年会', new Date(2027, 0, 5)));
}

/* ---------- 4. festivalPrefix 开关 ---------- */
console.log('[4] 节日名带日期开关');
{
  const on = makePlugin({ festivalPrefix: true });
  const off = makePlugin({ festivalPrefix: false });
  check('开：正向带日期', run(on, 'festival', '2026-10-01') === '国庆节 2026-10-01');
  check('关：正向只给名称', run(off, 'festival', '2026-10-01') === '国庆节',
    run(off, 'festival', '2026-10-01'));
  check('开：逆向带名称', /^国庆 \d{4}-10-01$/.test(run(on, 'festivalToDate', '国庆') || ''),
    run(on, 'festivalToDate', '国庆'));
  check('关：逆向只给日期', run(off, 'festivalToDate', '国庆') === '2026-10-01',
    run(off, 'festivalToDate', '国庆'));
  check('默认值是开', settings.migrateSettings(null).timestamp.extensions.festivalPrefix === true);
}

/* ---------- 5. 农历总开关 ---------- */
console.log('[5] 农历总开关对节日的影响');
{
  const off = makePlugin({ lunarEnabled: false, festivalPrefix: true });
  check('关掉后农历节日不生效', run(off, 'festivalToDate', '中秋') === null,
    run(off, 'festivalToDate', '中秋'));
  check('阳历节日不受影响', /-10-01$/.test(run(off, 'festivalToDate', '国庆') || ''));
}

/* ---------- 6. 不积累废弃数据 ---------- */
console.log('[6] 废弃数据');
{
  const raw = {
    timestamp: {
      extensions: {
        customFestivals: '甲=3-1',
        festivalPrefix: false,
        废弃键: 'x',
      },
    },
  };
  const out = settings.migrateSettings(raw);
  const ext = out.timestamp.extensions;
  check('废弃键被剔除', ext['废弃键'] === undefined);
  check('自设节日保留', ext.customFestivals === '甲=3-1');
  check('开关值保留', ext.festivalPrefix === false);
  // 幂等
  const again = settings.migrateSettings(JSON.parse(JSON.stringify(out)));
  check('迁移幂等', again.timestamp.extensions.customFestivals === '甲=3-1'
    && again.timestamp.extensions.festivalPrefix === false);
  // 超长文本截断
  const long = settings.migrateSettings({
    timestamp: { extensions: { customFestivals: 'x'.repeat(9999) } },
  });
  check('超长自设文本被截断', long.timestamp.extensions.customFestivals.length === 4000,
    long.timestamp.extensions.customFestivals.length);
}

console.log('\n[7] 当月最后一个 / 倒数第 N 个星期几（A1）');
{
  const ts = require(path.join(SRC, 'timestamp.js'));
  const fd = (spec, y) => {
    const list = judge.parseCustomFestivals('F = ' + spec);
    if (!list.length) return null;
    const d = ts.festivalDate(list[0], y);
    return d ? d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      + '-' + String(d.getDate()).padStart(2, '0') + '-' + d.getDay() : null;
  };
  check('最后一个周四：2026 感恩节落在 11-26（周四）', fd('11月最后一个周四', 2026) === '2026-11-26-4',
    fd('11月最后一个周四', 2026));
  check('最后一个周四：2025 落在 11-27', fd('11月最后一个周四', 2025) === '2025-11-27-4',
    fd('11月最后一个周四', 2025));
  check('倒数第2个周四：2026 落在 11-19', fd('11月倒数第2个周四', 2026) === '2026-11-19-4',
    fd('11月倒数第2个周四', 2026));
  check('闰年 2 月最后一个周日：2024-02-25', fd('2月最后一个周日', 2024) === '2024-02-25-0',
    fd('2月最后一个周日', 2024));
  check('平年 2 月最后一个周日：2027-02-28', fd('2月最后一个周日', 2027) === '2027-02-28-0',
    fd('2月最后一个周日', 2027));
  check('原有的「第 N 个」不受影响（5月第2个周日 2026-05-10）',
    fd('5月第2个周日', 2026) === '2026-05-10-0', fd('5月第2个周日', 2026));
  check('倒数第6个超出 1-5 范围：整行丢弃', judge.parseCustomFestivals('F = 11月倒数第6个周四').length === 0);
  check('倒数第5个但当月不够（2026-11 只有 4 个周四）：返回 null',
    fd('11月倒数第5个周四', 2026) === null, fd('11月倒数第5个周四', 2026));
  check('写法容错：礼拜 / 星期 均可', fd('11月最后一个礼拜四', 2026) === '2026-11-26-4',
    fd('11月最后一个礼拜四', 2026));
}

console.log('\n' + pass + ' 项通过' + (fail ? '，' + fail + ' 项失败 ❌' : '，全部通过 ✅'));
process.exit(fail ? 1 : 0);
