/*
 * 笔记命名统一（批量改名）—— v3.1 建议②
 *
 * 由来：改了「日期格式」只影响之后新建的文件，老文件仍是旧命名，
 * 而圆点统计只按当前格式查 → 老日记在日历上不显示圆点。
 *
 * 改文件名是破坏性操作，本套件守住四条边界：
 *   1. 只处理配置文件夹内的文件（不扫全库）
 *   2. 认不出日期的文件绝不碰
 *   3. 目标已存在则跳过，绝不覆盖
 *   4. folder 留空时该类直接跳过
 * 并对每条边界做反证，确认断言真的抓得住。
 */
const path = __dirname + '/../src/';
const cal = require(path + 'calendar.js');
const fs = require('fs');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else { failures++; console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : '')); }
}

/** 造一个够用的 vault */
function mkApp(files, existExtra) {
  const all = files.concat(existExtra || []);
  return {
    vault: {
      getMarkdownFiles: () => files.slice(),
      getAbstractFileByPath: (p) => all.find((f) => f.path === p) || null,
      rename: async (f, to) => { f.path = to; f.name = to.split('/').pop(); return null; },
    },
  };
}
function mkFile(p) {
  const name = p.split('/').pop();
  return { path: p, name, basename: name.replace(/\.md$/, '') };
}

function mkSettings(dailyFolder) {
  return {
    calendar: { weekStart: 'monday' },
    notes: {
      daily: { folder: dailyFolder, format: 'YYYY-MM-DD', template: '', altFormats: '' },
      weekly: { folder: '', format: 'gggg-[W]ww', template: '', altFormats: '' },
      monthly: { folder: '', format: 'YYYY-MM', template: '', altFormats: '' },
      yearly: { folder: '', format: 'YYYY', template: '', altFormats: '' },
    },
  };
}

console.log('\n[1] 只改配置文件夹内的、且能认出日期的');
{
  const old1 = mkFile('日记/2026-09-22-周二.md'); // 旧命名
  const other = mkFile('别处/2026-09-23-周三.md'); // 不在配置文件夹
  const plain = mkFile('日记/随手写的东西.md'); // 认不出日期
  const app = mkApp([old1, other, plain]);
  const list = cal.scanNoteRenames(app, mkSettings('日记'));
  check('只命中 1 条', list.length === 1, list.length);
  check('命中的是配置文件夹里那个', list[0] && list[0].from === '日记/2026-09-22-周二.md',
    list[0] && list[0].from);
  check('目标路径按当前格式', list[0] && list[0].to === '日记/2026-09-22.md',
    list[0] && list[0].to);
  check('日期反解正确', list[0] && list[0].date instanceof Date
    && list[0].date.getMonth() === 8 && list[0].date.getDate() === 22);
}

console.log('\n[2] 已经是当前格式的不再列出');
{
  const good = mkFile('日记/2026-09-22.md');
  const app = mkApp([good]);
  check('无待改名', cal.scanNoteRenames(app, mkSettings('日记')).length === 0);
}

console.log('\n[3] folder 留空 → 不扫全库（边界 4）');
{
  const any = mkFile('随便/2026-09-22-周二.md');
  const app = mkApp([any]);
  check('folder 为空时一条都不命中',
    cal.scanNoteRenames(app, mkSettings('')).length === 0);
}

console.log('\n[4] 目标已存在 → 执行时跳过，绝不覆盖');
(async () => {
  const old1 = mkFile('日记/2026-09-22-周二.md');
  const target = mkFile('日记/2026-09-22.md');
  const app = mkApp([old1], [target]);
  const list = cal.scanNoteRenames(app, mkSettings('日记'));
  check('扫描仍列出 1 条（命中不等于会覆盖）', list.length === 1, list.length);
  const r = await cal.applyNoteRenames(app, list);
  check('跳过而非覆盖', r.ok.length === 0 && r.skipped.length === 1,
    `ok=${r.ok.length} skipped=${r.skipped.length}`);
  check('原文件未被改动', old1.path === '日记/2026-09-22-周二.md', old1.path);
  check('跳过原因可读', r.skipped[0] && /已存在/.test(r.skipped[0].reason),
    r.skipped[0] && r.skipped[0].reason);

  console.log('\n[5] 正常执行');
  const old2 = mkFile('日记/2026-09-24-周四.md');
  const app2 = mkApp([old2]);
  const list2 = cal.scanNoteRenames(app2, mkSettings('日记'));
  const r2 = await cal.applyNoteRenames(app2, list2);
  check('改名成功', r2.ok.length === 1, r2.ok.length);
  check('路径已变', old2.path === '日记/2026-09-24.md', old2.path);

  console.log('\n[6] 反证：断言真的抓得住');
  const src = fs.readFileSync(path + 'calendar.js', 'utf8');
  const fn = src.slice(src.indexOf('function scanNoteRenames'));
  const body = fn.slice(0, fn.indexOf('\n}'));
  check('扫描函数内含 folder 空值保护', /if\s*\(!folder\)\s*continue;/.test(body));
  check('扫描函数内含文件夹归属判断', /indexOf\(folder \+ '\/'\)/.test(body));
  check('执行函数内含已存在保护', /exist !== it\.file/.test(
    src.slice(src.indexOf('async function applyNoteRenames'),
      src.indexOf('async function applyNoteRenames') + 900)));

  console.log(failures === 0 ? '\n笔记改名：全部通过 ✅' : `\n${failures} 项失败 ❌`);
  process.exit(failures ? 1 : 0);
})();
