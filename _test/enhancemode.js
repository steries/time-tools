/*
 * calendar 效果增强：两个开关互斥 + Bug 折叠区 —— v2.78
 *
 * 用户定：
 *   - 增强区的两个开关只能开一个，或都关，不能双开
 *   - 「如果 Calendar 插件出现 Bug 请打开」只是折叠开关，默认关（收起）
 *   - Bug 相关设置（空白页修复、Templater 补跑）全部收进折叠区
 */
let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src') + '/';
const MJ = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
const CAL = fs.readFileSync(path.join(SRC, 'calendar.js'), 'utf8');

const settings = require(SRC + 'settings.js');
const { setLang } = require(SRC + 'i18n.js');
// 测试环境没有 window / navigator，默认值 auto 会解成英文；这里钉成中文才能断言中文文案
setLang('zh');
const D = settings.DEFAULT_SETTINGS.calendar;

console.log('默认值');
check('接管点击默认关', D.enhanceCalendarEnabled === false);
check('日/周用原生默认关', D.nativeDayWeek === false);
check('Bug 折叠默认收起', D.bugFoldOpen === false);
/*
 * 折叠（bugFoldOpen）与开关状态是两件事：
 * 折叠只影响设置页是否渲染，不影响这两项是否生效。
 * v3.2 起区分两类，但两类都默认关：空白页修复是「没有出问题就别动」的兜底，
 * 补跑 Templater 属于日历区功能类。
 * 断言跟着默认值走，否则会一直给旧行为背书。
 */
check('空白页修复默认关（出问题才开，用户明确要求）', D.calendarFixEnabled === false);
check('Templater 补跑默认关（日历区一律默认关）', D.templaterBridge === false);

console.log('互斥');
check('存在 setEnhanceMode', /function setEnhanceMode\(plugin, mode\)/.test(CAL));
check('半接管会关掉全接管', /mode === 'dayweek'\s*\n?\s*:?\s*\n?\s*cal\.nativeDayWeek = mode === 'dayweek';/.test(CAL)
  || /cal\.nativeDayWeek = mode === 'dayweek';/.test(CAL));
check('全接管会关掉半接管', /cal\.enhanceCalendarEnabled = mode === 'full';/.test(CAL));
// 反证：不能再出现「打开半接管自动打开全接管」的老逻辑
check('反证：旧的自动打开全接管已删除',
  CAL.indexOf("cal.enhanceCalendarEnabled = true;\n          note = '已自动打开") < 0
  && !/已自动打开「在 Calendar 视图上接管点击」/.test(CAL));
check('启动期归一化两个增强开关',
  /function normalizeEnhanceExclusive\(plugin\)/.test(CAL));
check('归一化保留了全接管、关掉半接管',
  /cal\.nativeDayWeek = false;\s*\n\s*return '两个增强开关此前同时开启/.test(CAL));

console.log('运行时门控');
check('门控放行任一增强模式',
  /\(s\.enhanceCalendarEnabled !== true && s\.nativeDayWeek !== true\)/.test(CAL));
check('产物门控同步',
  /\(c\.enhanceCalendarEnabled !== true && c\.nativeDayWeek !== true\)/.test(MJ));

console.log('Bug 折叠区');
check('存在 renderBugFoldSection', /function renderBugFoldSection\(containerEl, plugin\)/.test(CAL));
check('折叠开关文案', /如果 Calendar 插件出现 Bug 请打开/.test(CAL));
check('折叠未开则不渲染 Bug 项', /if \(cal\.bugFoldOpen !== true\) return;/.test(CAL));
check('空白页修复收进折叠区', CAL.indexOf('修复 Calendar 设置页空白')
  > CAL.indexOf('renderBugFoldSection'));
check('Templater 补跑收进折叠区', CAL.indexOf('Calendar 新建的笔记补跑 Templater')
  > CAL.indexOf('renderBugFoldSection'));
check('Bug 项排在增强区之前',
  CAL.indexOf('renderBugFoldSection(containerEl, plugin)')
  < CAL.indexOf("'calendar 效果增强'"));

console.log('增强模式互斥：' + (failures ? failures + ' 项失败' : '全部通过'));
process.exit(failures ? 1 : 0);
