/* 双开漏洞回归测试 */
const path = require('path');
const M = path.join(__dirname, '..', 'src', 'calendar.js');
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : (fail++, console.log('  ✗ ' + n)); };

// —— 造一个最小插件环境 ——
function mkPlugin(cfg) {
  const leaves = [];
  return {
    settings: { calendar: Object.assign({
      ownCalendarEnabled: false, enhanceCalendarEnabled: false, allowBoth: false,
    }, cfg) },
    saveSettings: async () => {},
    app: { workspace: {
      getLeavesOfType: () => leaves,
      onLayoutReady: (f) => f(),
    } },
    _leaves: leaves,
  };
}

const cal = require(M);
const norm = cal.normalizeCalendarExclusive;

// 1) 老配置遗留：两者都开、未允许双开 → 必须收敛
let p = mkPlugin({ ownCalendarEnabled: true, enhanceCalendarEnabled: true, allowBoth: false });
let note = norm(p);
ok('遗留双开被收敛', note !== null);
ok('收敛后只剩一个', !(p.settings.calendar.ownCalendarEnabled === true
  && p.settings.calendar.enhanceCalendarEnabled === true));

// 2) 视图开着时保留自带日历
p = mkPlugin({ ownCalendarEnabled: true, enhanceCalendarEnabled: true, allowBoth: false });
p._leaves.push({});
note = norm(p);
ok('视图开着→保留自带日历', p.settings.calendar.ownCalendarEnabled === true
  && p.settings.calendar.enhanceCalendarEnabled === false);

// 3) 视图没开（无残留叶子）时保留增强，且无需收起
p = mkPlugin({ ownCalendarEnabled: true, enhanceCalendarEnabled: true, allowBoth: false });
note = norm(p);
ok('视图没开→保留增强', p.settings.calendar.enhanceCalendarEnabled === true
  && p.settings.calendar.ownCalendarEnabled === false);

// 3b) 保留自带日历时，不该误关掉已开着的视图
p = mkPlugin({ ownCalendarEnabled: true, enhanceCalendarEnabled: true, allowBoth: false });
let closed = 0;
p._leaves.push({ detach() { closed++; } });
norm(p);
ok('保留自带日历时不关视图', closed === 0 && p.settings.calendar.ownCalendarEnabled === true);

// 4) 允许双开时不干预
p = mkPlugin({ ownCalendarEnabled: true, enhanceCalendarEnabled: true, allowBoth: true });
ok('允许双开→不干预', norm(p) === null
  && p.settings.calendar.ownCalendarEnabled === true
  && p.settings.calendar.enhanceCalendarEnabled === true);

// 5) 本来就互斥 → 无操作
p = mkPlugin({ ownCalendarEnabled: true, enhanceCalendarEnabled: false, allowBoth: false });
ok('本就互斥→无操作', norm(p) === null);

/* 产物级断言：源码改了不等于产物改了，必须核 main.js */
const fs = require('fs');
const MJ = fs.readFileSync(
  path.join(__dirname, '..', 'main.js'), 'utf8');
ok('产物含启动归一化', MJ.includes('normalizeCalendarExclusive'));
ok('产物含增强运行时兜底',
  /allowBoth !== true && s\.ownCalendarEnabled === true/.test(MJ));
ok('产物含视图自退场兜底', /this\.leaf\.detach\(\)/.test(MJ));
ok('产物命令含双开门控',
  /allowBoth === true\s*\n?\s*\|\| \(c\.enhanceCalendarEnabled !== true && c\.nativeDayWeek !== true\)/.test(MJ));

console.log('双开回归：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
