/* 周号同源回归：日历格子显示的周号，必须与生成的周记文件名里的周号一致。
 *
 * 背景（v2.63 修）：两个 bug 叠加导致「显示第 40 周却生成 2026-W39」
 *   ① resolveLocaleDow 写成 `typeof w.week`（在 const w 初始化前引用自己）
 *      → TDZ ReferenceError 被 catch 静默吞掉 → 恒定返回 0（周日）
 *   ② 周记文件名交给 moment 的 gggg/ww，那是 moment 自己的 locale week，
 *      与日历显示用的 firstDow 不同源 → 差 1
 *
 * 本测试自带 moment mock（支持 localeData），独立进程运行，不污染其他测试。
 */
const path = require('path');
const Module = require('module');
const ROOT = __dirname + '/../src';

let CUR = { dow: 1, doy: 4 };
const obsidian = {
  moment: () => ({ localeData: () => ({ week: () => CUR }) }),
  Notice: class {}, ItemView: class {}, Plugin: class {}, EditorSuggest: class {},
  PluginSettingTab: class {}, Setting: class {}, Modal: class {}, setIcon() {}, Platform: {},
};
const oR = Module._resolveFilename;
const oL = Module._load;
Module._resolveFilename = (r, ...a) => (r === 'obsidian' ? 'obsidian' : oR(r, ...a));
Module._load = (r, ...a) => (r === 'obsidian' ? obsidian : oL(r, ...a));

const cal = require(path.join(ROOT, 'calendar.js'));
const note = require(path.join(ROOT, 'note.js'));

let fail = 0;
const check = (name, ok, extra) => {
  console.log((ok ? '  ✓ ' : '  ✗ ') + name + (ok ? '' : '  → ' + (extra || '')));
  if (!ok) fail++;
};

/* 1. resolveLocaleDow 必须真的读到 moment 的 locale，而不是因 TDZ 恒返回 0 */
for (const c of [{ dow: 1, doy: 4 }, { dow: 0, doy: 6 }]) {
  CUR = c;
  check(`resolveLocaleDow 跟随 locale（dow=${c.dow}）`, cal.resolveLocaleDow() === c.dow,
    '返回 ' + cal.resolveLocaleDow());
}

/* 2. 显示周号 vs 周记文件名周号，逐格交叉校验 */
let bad = 0;
let tot = 0;
for (const cfg of [{ dow: 1, doy: 4 }, { dow: 0, doy: 6 }]) {
  CUR = cfg;
  for (const firstDow of [0, 1]) {
    for (const [y, m] of [[2026, 8], [2026, 0], [2024, 11], [2027, 0], [2025, 11]]) {
      const so = (new Date(y, m, 1).getDay() - firstDow + 7) % 7;
      for (let i = 0; i < 42; i += 7) {
        const d = new Date(y, m, 1 - so + i);
        const shown = cal.weekNumberOf(d, firstDow);
        const fname = note.buildFileName(d, 'gggg-[W]ww', 'weekly', firstDow);
        const fw = Number((fname.match(/W(\d+)/) || [])[1]);
        tot++;
        if (fw !== shown) {
          bad++;
          if (bad < 5) console.log(`    ✗ dow=${firstDow} ${d.toDateString().slice(4, 10)} 显示=${shown} 文件=${fname}`);
        }
      }
    }
  }
}
check(`周号与周记文件名同源（${tot} 格交叉校验）`, bad === 0, bad + ' 格不一致');

/* 3. 跨年周年份 gggg：2024-12-30 属 2025 年第 1 周，2027-01-01 属 2026 年第 53 周 */
check('跨年周年份 2024-12-30 → 2025-W01',
  note.buildFileName(new Date(2024, 11, 30), 'gggg-[W]ww', 'weekly', 1) === '2025-W01',
  note.buildFileName(new Date(2024, 11, 30), 'gggg-[W]ww', 'weekly', 1));
check('跨年周年份 2027-01-01 → 2026-W53',
  note.buildFileName(new Date(2027, 0, 1), 'gggg-[W]ww', 'weekly', 1) === '2026-W53',
  note.buildFileName(new Date(2027, 0, 1), 'gggg-[W]ww', 'weekly', 1));

/* 4. weekStartOf 往返自洽：周号 → 周首日 → 周号（只测该年实际存在的周号） */
const doyOf = (dd) => (dd === 1 ? 4 : 6 + dd);
const fwo = (yy, dd, dy) => {
  const fwd = 7 + dd - dy;
  return (7 + new Date(yy, 0, fwd).getDay() - dd) % 7 * -1 + fwd - 1;
};
let rb = 0;
let rt = 0;
for (const firstDow of [0, 1, 2, 3, 4, 5, 6]) {
  for (const y of [2024, 2025, 2026, 2027]) {
    const diy = Math.round((new Date(y + 1, 0, 1) - new Date(y, 0, 1)) / 86400000);
    const dy = doyOf(firstDow);
    const maxW = Math.floor((diy - fwo(y, firstDow, dy) + fwo(y + 1, firstDow, dy)) / 7);
    for (let w = 1; w <= maxW; w++) {
      const d = cal.weekStartOf(y, w, firstDow);
      rt++;
      if (!d || cal.weekNumberOf(d, firstDow) !== w) rb++;
    }
  }
}
check(`weekStartOf 往返自洽（${rt} 次）`, rb === 0, rb + ' 次不自洽');

console.log('\n' + (fail === 0 ? '周号回归全部通过 ✅' : fail + ' 项失败 ❌'));
process.exit(fail === 0 ? 0 : 1);
