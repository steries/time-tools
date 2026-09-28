/*
 * ARCHITECTURE.md 自检：文档里写死的清单若与代码不符就报错。
 * 手写文档最容易随代码演进而失效，这里把关键清单钉死。
 */
const fs = require('fs');
const path = __dirname + '/../';
const doc = fs.readFileSync(path + 'ARCHITECTURE.md', 'utf8');

let fail = 0;
function check(name, ok, detail) {
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : ' — ' + detail));
  if (!ok) fail++;
}

console.log('[ARCH] ARCHITECTURE.md 与代码一致性');

// --- 命令清单 ---
const srcFiles = ['settings.js', 'timestamp.js', 'pomodoro.js', 'calendar.js', 'note.js', 'main.js', 'configio.js'];
const code = srcFiles.map((f) => fs.readFileSync(path + 'src/' + f, 'utf8')).join('\n');
const cmds = (code.match(/id: 'time-tools-[a-z-]+'/g) || [])
  .map((s) => s.replace("id: '", '').replace("'", ''))
  .sort();
const missingCmds = cmds.filter((c) => !doc.includes(c));
check('命令清单齐全（' + cmds.length + ' 个）', missingCmds.length === 0, missingCmds.join(','));
/*
 * 反向也要查：文档里写了、代码里却已删除的命令，同样要报错。
 * 只查单向的话，命令删掉了但文档留着，这条检查照样绿 —— 等于没查。
 */
// 只取「命令表」那一段（视图类型表里也有 time-tools-*-view，不是命令）
let docCmdTable = doc;
{
  const a = doc.indexOf('| id | 说明 |');
  if (a >= 0) {
    const b = doc.indexOf('视图类型：', a);
    docCmdTable = doc.slice(a, b < 0 ? doc.length : b);
  }
}
const docCmds = (docCmdTable.match(/`time-tools-[a-z-]+`/g) || [])
  .map((s) => s.replace(/`/g, ''))
  .filter((c, i, a) => a.indexOf(c) === i)
  .sort();
const staleCmds = docCmds.filter((c) => cmds.indexOf(c) < 0);
check('文档里没有已删除的命令（' + docCmds.length + ' 个）', staleCmds.length === 0, staleCmds.join(','));

// --- 转换项 key ---
// ACTION_DEFS 的 key 与 ACTION_GROUPS 的 key 都叫 key，需区分：
// 转换项的 key 后面紧跟 name，分组的 key 后面紧跟 title
const src = fs.readFileSync(path + 'src/settings.js', 'utf8');
const keys = (src.match(/key: '([a-zA-Z]+)',\n\s+name:/g) || [])
  .map((m) => /key: '([a-zA-Z]+)'/.exec(m)[1])
  .sort();
const missingKeys = keys.filter((k) => !doc.includes('`' + k + '`'));
check('转换项 key 齐全（' + keys.length + ' 个）', missingKeys.length === 0, missingKeys.join(','));
check('转换项数量为 22', keys.length === 22, keys.length);

// --- 视图类型 ---
const views = (code.match(/VIEW_TYPE = '[a-z-]+'/g) || [])
  .map((s) => s.replace("VIEW_TYPE = '", '').replace("'", ''));
const missingViews = views.filter((v) => !doc.includes(v));
check('视图类型已记录', missingViews.length === 0, missingViews.join(','));

/*
 * --- pomodoro.js 锚点 ---
 *
 * 这里曾经写死 16 个行号。行号会随每次编辑漂移却无人同步，
 * 于是「源码挪位」和「文档过时」两种失败混在一起，每次改代码都要手工修一遍测试。
 * 现在只声明符号名、行号现算：符号在，断言就过。
 */
const pom = fs.readFileSync(path + 'src/pomodoro.js', 'utf8');
const anchors = [
  'class PomodoroController', 'startSession', 'startSegment', 'tick', 'onSegmentEnd',
  'nextSegment', 'finishSession', 'refreshUI', 'renderPomodoroSettings',
  'renderRecordSettings', 'class GuardedModal', 'class StartModal', 'class AskLongBreakModal',
  'class AskRestartModal', 'class SummaryModal',
];
const badLines = anchors.filter((name) => !pom.includes(name));
check('pomodoro.js 锚点符号仍在（' + anchors.length + ' 处）', badLines.length === 0,
  badLines.join(','));

// --- 文件数与行数 ---
['settings.js', 'timestamp.js', 'pomodoro.js', 'main.js'].forEach((f) => {
  check('src/' + f + ' 存在', fs.existsSync(path + 'src/' + f));
});
/*
 * src 下的模块清单：新增 / 删除模块时必须同步这里。
 * 写死清单而不是只比对数量 —— 数量对了但名字多一个少一个，照样是文档失同步。
 */
const SRC_MODULES = [
  'settings.js', 'timestamp.js', 'pomodoro.js', 'pomosync.js', 'pomowin.js',
  'calendar.js', 'note.js', 'timejudge.js', 'lunar.js', 'recorder.js', 'main.js',
  'configio.js', 'i18n-en.js', 'i18n.js',
];
const actualSrc = fs.readdirSync(path + 'src').filter((f) => f.endsWith('.js')).sort();
check('src 模块清单一致',
  actualSrc.join(',') === SRC_MODULES.slice().sort().join(','),
  actualSrc.join(','));

// --- timestamp.js / settings.js 锚点（同样只声明符号名）---
const ts = fs.readFileSync(path + 'src/timestamp.js', 'utf8');
const tsAnchors = [
  'parseToDate', 'parseComposite', 'parseLunar', 'shouldTreatAsLunar', 'parseCnSolarDate',
  'fmt', 'toRelative', 'recordUndoEntry', 'restoreEntry', 'attachUndoWidget',
  'buildCm6Extension', 'TimeActionModal', 'apply(text)', 'registerTimeActions', 'undoMarkOf',
];
const badTs = tsAnchors.filter((name) => !ts.includes(name));
check('timestamp.js 锚点符号仍在（' + tsAnchors.length + ' 处）', badTs.length === 0,
  badTs.join(','));

/*
 * 会话记录已拆到 recorder.js —— 锚点跟着迁过去，
 * 否则「pomodoro.js 里还有 class Recorder」这种断言会在拆分后恒红，
 * 反过来逼人把代码搬回去（断言不该给结构背书）。
 */
const rec = fs.readFileSync(path + 'src/recorder.js', 'utf8');
const recAnchors = ['class Recorder', 'renderRecordSettings', 'renderTemplate', 'insertAtTop', 'sanitizeFileName'];
const badRec = recAnchors.filter((name) => !rec.includes(name));
check('recorder.js 锚点符号仍在（' + recAnchors.length + ' 处）', badRec.length === 0, badRec.join(','));

const st = fs.readFileSync(path + 'src/settings.js', 'utf8');
const stAnchors = [
  'ACTION_DEFS', 'ACTION_PAIRS', 'ACTION_GROUPS', 'defaultExtensions',
  'migrateSettings', 'TimeToolsSettingTab',
];
const badSt = stAnchors.filter((name) => !st.includes(name));
check('settings.js 锚点符号仍在（' + stAnchors.length + ' 处）', badSt.length === 0,
  badSt.join(','));

/*
 * 文档里曾经给每个符号标行号（如 `parseToDate` (1569)），共 35 处。
 * 行号随每次编辑漂移却无人同步：标 1569 的 parseToDate 实际已在 1768，
 * 反而把读者引到错误的行。现在文档只写符号名 —— 符号名不漂移，grep 即可定位。
 */
check('文档不再写死行号（改用符号名定位）', !/\(\d{3,4}\)/.test(doc),
  (doc.match(/\(\d{3,4}\)/g) || []).slice(0, 5).join(','));

// --- 踩坑表里写的关键串必须真的在代码里（否则文档在说旧事）---
const pitfallAnchors = [
  ['lucide-undo-2', '撤回图标用内置 SVG'],
  ['CM6.built && CM6.field', 'CM6 缓存判断'],
  ['checkCallback', '命令注册方式'],
  ['searchText', '撤回定位字段'],
];
const allCode = ['settings.js', 'timestamp.js', 'pomodoro.js', 'main.js']
  .map((f) => fs.readFileSync(path + 'src/' + f, 'utf8')).join('\n');
const badPit = pitfallAnchors.filter(([needle]) => !allCode.includes(needle));
check('踩坑表引用的代码仍在（' + pitfallAnchors.length + ' 处）', badPit.length === 0,
  badPit.map(([n, d]) => d).join(','));

// --- 性能声明 ---
check('记录了 tick 节流', doc.includes('按秒') && doc.includes('48000'));

// --- 红线 ---
check('记录了数据增长红线', doc.includes('数据增长红线'));
check('记录了不做事项', doc.includes('已决定不做的事'));

console.log(fail === 0 ? '\nARCHITECTURE.md 与代码一致 ✅' : '\n有 ' + fail + ' 项不一致 ❌');
process.exit(fail === 0 ? 0 : 1);
