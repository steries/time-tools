/*
 * 路径（新笔记存放位置）与日期格式的分工 —— v2.77
 *
 * v2.71 曾让「路径」也解析 YYYY / MM / gggg，结果与「日期格式」里的分级
 * 能力重复：用户在两个框里都填年份，就建出 日记/2026/2026/09 这类叠床架屋
 * 的路径。v2.77 取消路径的 token 解析，层级一律写在「日期格式」里，
 * 与 Obsidian 核心「日记」插件、Calendar 插件完全一致。
 *
 * 本套件守住三件事：
 *   1. 路径里的 YYYY / MM / gggg 保持字面量（不再被替换成年月）
 *   2. 纯中文、英文等不含 token 的路径不受影响（最危险的回归点）
 *   3. 日期格式里的 / 仍然产生子目录（v2.76 的能力保留）
 *   4. 用户可填的路径一律过 normalizePath（反斜杠 / 重复斜杠 / 尾斜杠）
 */
const path = __dirname + '/../src/';
const note = require(path + 'note.js');
const cal = require(path + 'calendar.js');
const fs = require('fs');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

console.log('\n[1] 路径不再解析 token（v2.77 核心变更）');
const rp = note.resolvePathTokens;
check('resolvePathTokens 已导出', typeof rp === 'function');
check('YYYY/MM 保持字面量',
  rp('03记录/生活记录/日记/YYYY/MM') === '03记录/生活记录/日记/YYYY/MM',
  rp('03记录/生活记录/日记/YYYY/MM'));
check('gggg 保持字面量',
  rp('03记录/周记/gggg') === '03记录/周记/gggg', rp('03记录/周记/gggg'));
check('{{YYYY}} 也保持字面量（不再兼容 Templater 写法）',
  rp('03记录/日记/{{YYYY}}') === '03记录/日记/{{YYYY}}', rp('03记录/日记/{{YYYY}}'));

console.log('\n[2] 不含 token 的路径必须原样保留（最危险的回归点）');
check('纯中文路径不动', rp('03记录/生活记录/日记') === '03记录/生活记录/日记');
check('含数字但不是 token 的路径不动', rp('04仓库/1模板/2024归档') === '04仓库/1模板/2024归档');
check('英文不被 token 吃掉（My Docs 里的 M/D）', rp('My Docs') === 'My Docs', rp('My Docs'));
check('Notes 不被误判', rp('Notes') === 'Notes');

console.log('\n[3] 安全清洗仍保留（去 .. 防越出库）');
check('首尾斜杠去掉', rp('/03记录/日记/') === '03记录/日记', rp('/03记录/日记/'));
check('.. 被剔除', rp('03记录/../../etc') === '03记录/etc', rp('03记录/../../etc'));
check('空段去掉', rp('03记录//日记') === '03记录/日记', rp('03记录//日记'));
check('空串返回空', rp('') === '');

console.log('\n[4] 反证：路径 token 解析函数 buildFolder 不得再出现');
for (const f of ['note.js', 'calendar.js']) {
  const src = fs.readFileSync(path + f, 'utf8');
  check(f + ' 内无 buildFolder（路径 token 解析已删）', src.indexOf('buildFolder') < 0);
}
// buildNoteDir 保留（目录 = 路径字面量 + 日期格式子目录），但其内部不得再解析路径 token
check('buildNoteDir 仍是统一入口', typeof note.buildNoteDir === 'function');
check('buildNoteDir：路径段保持字面量',
  note.buildNoteDir(
    { calendar: { weekStart: 'locale' }, notes: { daily: { folder: '日记/YYYY', format: 'MM/DD' } } },
    'daily', new Date('2026-09-21T10:00:00')
  ) === '日记/YYYY/09',
  note.buildNoteDir(
    { calendar: { weekStart: 'locale' }, notes: { daily: { folder: '日记/YYYY', format: 'MM/DD' } } },
    'daily', new Date('2026-09-21T10:00:00')
  ));

console.log('\n[5] 日期格式里的 / 仍产生子目录（v2.76 能力保留）');
const sp = note.splitFormatPath;
check('无斜杠：整串都是文件名',
  JSON.stringify(sp('YYYY-MM-DD')) === JSON.stringify({ sub: '', name: 'YYYY-MM-DD' }));
check('带斜杠：前段变子目录',
  JSON.stringify(sp('YYYY/MM/YYYY-MM-DD')) === JSON.stringify({ sub: 'YYYY/MM', name: 'YYYY-MM-DD' }));
check('[字面量] 里的 / 不当分隔符',
  JSON.stringify(sp('[a/b]/YYYY')) === JSON.stringify({ sub: '[a/b]', name: 'YYYY' }));

console.log('\n[6] DI 兼容（核心插件的「日+星期」）');
check('DI 映射为 DD-ddd', note.normalizeDi('YYYY-MM-DI') === 'YYYY-MM-DD-ddd', note.normalizeDi('YYYY-MM-DI'));
check('[字面量] 里的 DI 不动', note.normalizeDi('[DI]') === '[DI]', note.normalizeDi('[DI]'));

console.log('\n[7] 端到端 buildNotePath：路径字面量 + 格式分级');
function np(folder, format, kind, dateStr, weekStart) {
  const one = { folder, format, template: '', altFormats: '' };
  return note.buildNotePath(
    {
      calendar: { weekStart: weekStart || 'locale' },
      notes: { daily: one, weekly: one, monthly: one, yearly: one },
    },
    kind,
    new Date(dateStr)
  );
}
check('推荐写法：路径纯净 + 日期格式带 /',
  np('03记录/生活记录/日记', 'YYYY/MM/YYYY-MM-DD', 'daily', '2026-09-21T10:00:00')
    === '03记录/生活记录/日记/2026/09/2026-09-21.md',
  np('03记录/生活记录/日记', 'YYYY/MM/YYYY-MM-DD', 'daily', '2026-09-21T10:00:00'));
check('路径全写在日期格式里（folder 留空）',
  np('', 'YYYY/MM/YYYY-MM-DD', 'daily', '2026-09-21T10:00:00') === '2026/09/2026-09-21.md',
  np('', 'YYYY/MM/YYYY-MM-DD', 'daily', '2026-09-21T10:00:00'));
check('DI 渲染出「日-星期」（与核心插件截图一致）',
  np('', 'YYYY/MM/YYYY-MM-DI', 'daily', '2026-09-21T10:00:00') === '2026/09/2026-09-21-周一.md',
  np('', 'YYYY/MM/YYYY-MM-DI', 'daily', '2026-09-21T10:00:00'));
check('周记：gggg/[W]ww',
  np('03记录/周记', 'gggg/gggg-[W]ww', 'weekly', '2026-09-21T10:00:00') === '03记录/周记/2026/2026-W39.md',
  np('03记录/周记', 'gggg/gggg-[W]ww', 'weekly', '2026-09-21T10:00:00'));
check('路径里写 YYYY 不会再被解析（v2.77 行为）',
  np('03记录/日记/YYYY', 'YYYY-MM-DD', 'daily', '2026-09-21T10:00:00') === '03记录/日记/YYYY/2026-09-21.md',
  np('03记录/日记/YYYY', 'YYYY-MM-DD', 'daily', '2026-09-21T10:00:00'));

console.log('\n[8] 周号与日历显示同源（复现 W39/W40 那类偏差）');
let mismatch = 0;
for (const ws of ['sunday', 'monday']) {
  const dow = ws === 'sunday' ? 0 : 1;
  for (let day = 1; day <= 30; day++) {
    const d = new Date(2026, 8, day);
    const expect = cal.weekNumberOf(d, dow);
    const got = np('周记', 'gggg/gggg-[W]ww', 'weekly', '2026-09-' + String(day).padStart(2, '0') + 'T10:00:00', ws);
    const m = /\/(\d{4})-W(\d+)\.md$/.exec(got);
    if (!m || Number(m[2]) !== expect) mismatch++;
  }
}
check('2026-09 全月 × 两种周起始，周号与日历显示一致（应为 0 处不符）', mismatch === 0, mismatch);

/*
 * [9] 用户明确点名的 token 全部保持字面量
 *
 * 用户原话：YYYY/MM/gggg/DD/ddd 保持字面量。
 * 逐个断言，防止以后有人只测 YYYY/MM 就以为全覆盖了。
 */
console.log('\n[9] 用户点名的 token 逐个保持字面量');
for (const tk of ['YYYY', 'MM', 'gggg', 'DD', 'ddd', 'YY', 'ww', 'dddd']) {
  const inPath = '03记录/日记/' + tk;
  check(tk + ' 保持字面量', rp(inPath) === inPath, rp(inPath));
}
check('组合 YYYY/MM/gggg/DD/ddd 整体字面量',
  rp('03记录/日记/YYYY/MM/gggg/DD/ddd') === '03记录/日记/YYYY/MM/gggg/DD/ddd',
  rp('03记录/日记/YYYY/MM/gggg/DD/ddd'));

/*
 * [10] 设置界面说明必须与代码行为一致
 *
 * 上次事故：代码已改成字面量，说明却还写着「也支持日期 token 做分级目录」，
 * 用户照着说明填就会被误导。说明与行为分家 = 隐性 bug，必须守住。
 */
console.log('\n[10] 设置界面说明不得再宣称支持 token');
const noteSrc = fs.readFileSync(path + 'note.js', 'utf8');
const descBlock = (() => {
  const i = noteSrc.indexOf("'新笔记存放位置'");
  return i < 0 ? '' : noteSrc.slice(i, i + 700);
})();
check('能定位到「新笔记存放位置」的 setDesc', descBlock.length > 0);
check('说明不再写「支持日期 token 做分级目录」',
  descBlock.indexOf('支持日期 token') < 0 && descBlock.indexOf('token 做分级') < 0);
check('说明不再罗列可用 token（YYYY 年、MM 月…）',
  descBlock.indexOf('YYYY 年') < 0 && descBlock.indexOf('ww 周数') < 0);
check('说明明确写了保持字面量', descBlock.indexOf('字面量') >= 0);
check('说明指引用户去「日期格式」写分级', descBlock.indexOf('日期格式') >= 0);

/* ARCHITECTURE 里的历史教训不能反过来诱导后人「修复」成解析 token */
console.log('\n[11] 文档不得把字面量行为描述成待修 bug');
const archF = fs.readFileSync(__dirname + '/../ARCHITECTURE.md', 'utf8');
check('文档明确「新笔记存放位置是纯字面量」', archF.indexOf('纯字面量') >= 0);
check('文档明确不要修复该行为', archF.indexOf('不要') >= 0 && archF.indexOf('修复') >= 0);

/* 新用户装完不改任何设置，点日历就该能建出笔记 —— 这是「出厂即用」的底线。
 * 默认 folder 是空串，最容易出的错是拼出 '/2026-09-21.md' 这种带前导斜杠的坏路径。 */
console.log('\n[12] 出厂默认：空文件夹不产生坏路径');
const defs = require(path + 'settings.js').defaults();
const dt0 = new Date(2026, 8, 21);
const paths = {};
['daily', 'weekly', 'monthly', 'yearly'].forEach((k) => {
  paths[k] = note.buildNotePath(defs, k, dt0);
});
console.log('    ' + JSON.stringify(paths));
['daily', 'weekly', 'monthly', 'yearly'].forEach((k) => {
  check(k + ' 默认能生成路径', typeof paths[k] === 'string' && paths[k].length > 0);
  check(k + ' 默认路径无前导斜杠', paths[k].indexOf('/') !== 0, paths[k]);
  check(k + ' 默认路径无双斜杠', paths[k].indexOf('//') < 0, paths[k]);
  check(k + ' 默认路径以 .md 结尾', /\.md$/.test(paths[k]), paths[k]);
});
check('默认日记落在库根目录（未指定文件夹时不做猜测）', paths.daily === '2026-09-21.md', paths.daily);

console.log('\n[13] 用户可填路径必须先过 normalizePath（上架合规：官方最高频退回原因）');
/*
 * 用户从文件管理器复制路径，带尾斜杠 / 反斜杠是常态。
 * 不归一化就会「明明填对了却读不到」——正好撞在我们的红线上
 *（读不到必须明确提示，绝不给静默 0）。
 */
const rec = require(path + 'recorder.js');
['note.js', 'recorder.js', 'pomodoro.js', 'calendar.js'].forEach((f) => {
  check(f + ' 已接入 normalizePath',
    fs.readFileSync(path + f, 'utf8').indexOf('normalizePath') > 0);
});
const fp = note.fullPath;
check('尾斜杠：统计/ → 统计/x.md', fp('统计/', 'x') === '统计/x.md', fp('统计/', 'x'));
check('重复斜杠：统计//子 → 统计/子/x.md', fp('统计//子', 'x') === '统计/子/x.md', fp('统计//子', 'x'));
check('前导斜杠：/统计 → 统计/x.md', fp('/统计', 'x') === '统计/x.md', fp('/统计', 'x'));
check('反斜杠：a\\b → a/b/x.md', fp('a\\b', 'x') === 'a/b/x.md', fp('a\\b', 'x'));
check('空串保空（留空＝库根目录，不能变成 /）', fp('', 'x') === 'x.md', fp('', 'x'));
// settings 是 getter（读 plugin.settings.record），必须挂 plugin 而不能直接赋值
const R = Object.create(rec.Recorder.prototype);
const withFolder = (v) => { R.plugin = { settings: { record: { folder: v } } }; return R.resolvePath(''); };
check('resolvePath 尾斜杠 → 统计/番茄记录.md', withFolder('统计/') === '统计/番茄记录.md', withFolder('统计/'));
check('resolvePath 反斜杠 → a/b/番茄记录.md', withFolder('a\\b') === 'a/b/番茄记录.md', withFolder('a\\b'));
check('resolvePath 空 folder 落库根', withFolder('') === '番茄记录.md', withFolder(''));

console.log('\n' + (failures === 0 ? '✅ 路径与日期格式分工：全部通过' : '❌ 失败 ' + failures + ' 项'));
process.exit(failures === 0 ? 0 : 1);
