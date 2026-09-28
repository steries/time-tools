/*
 * 自定义统计位置 + DataView 联动（v3.14）回归测试
 *
 * 守四件事：
 *   ① 自定义位置：单篇笔记 / 文件夹两种填法都能读到
 *   ② 解析不出时明确提示，绝不用 0 冒充（静默给 0 会让人以为自己没专注过）
 *   ③ DataView 开关：关着不多写一个字，开着追加一行内联字段
 *   ④ 不积累废弃数据：两个新配置都是定值字段，不按次堆积
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } };

const notices = (global.__notices = []);
global.obsidian = {
  Notice: class { constructor(msg) { notices.push(String(msg)); } },
  moment: (t) => {
    const d = t === undefined ? new Date() : new Date(t);
    return {
      format: (f) => {
        if (f === 'YYYY-MM-DD') {
          const p = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        }
        return d.toISOString();
      },
    };
  },
};

const recorder = require(path.join(SRC, 'recorder.js'));
const { readCustomStats, dataviewLine, sumMinutes } = recorder;

/** 造一个最小 vault 替身：只提供 readCustomStats 真正用到的两个 API */
function makeVault(files) {
  return {
    getAbstractFileByPath: (p) => files.find((f) => f.path === p) || null,
    getFiles: () => files.slice(),
    cachedRead: async (f) => (f && f.content !== undefined ? f.content : ''),
  };
}
const mkPlugin = (pomodoro, files) => ({
  settings: { pomodoro },
  app: { vault: makeVault(files) },
});

console.log('[STATS2] 自定义位置与 DataView');

/* ---------- ① 单篇笔记 ---------- */
(async () => {
  {
    const files = [{ path: '统计/专注.md', extension: 'md', content: '专注 25 分钟 · 休息 5 分钟\n专注 30 分钟\n' }];
    const r = await readCustomStats(mkPlugin({ statsSource: 'custom', statsCustomPath: '统计/专注.md' }, files));
    ok(r.ok === true, '单篇笔记能读到');
    ok(r.minutes === 60, '单篇笔记累加正确（25+30+5=60），实际：' + r.minutes);
    ok(r.files === 1, '只算这一篇');
  }

  /* ---------- ② 文件夹 ---------- */
  {
    const files = [
      { path: '统计/a.md', extension: 'md', content: '专注 10 分钟\n' },
      { path: '统计/b.md', extension: 'md', content: '专注 20 分钟\n' },
      { path: '其他/c.md', extension: 'md', content: '专注 999 分钟\n' },
    ];
    const r = await readCustomStats(mkPlugin({ statsSource: 'custom', statsCustomPath: '统计' }, files));
    ok(r.ok === true, '文件夹能读到');
    ok(r.minutes === 30, '文件夹只统计其下笔记（不含「其他」），实际：' + r.minutes);
    ok(r.files === 2, '文件夹命中 2 篇');
  }
  {
    // 路径带尾斜杠也要能命中 —— 否则用户照着文件管理器复制路径就扑空
    const files = [{ path: '统计/a.md', extension: 'md', content: '专注 10 分钟\n' }];
    const r = await readCustomStats(mkPlugin({ statsSource: 'custom', statsCustomPath: '统计/' }, files));
    ok(r.ok === true && r.minutes === 10, '文件夹路径带尾斜杠仍能命中');
  }

  /* ---------- ③ 解析不出必须明确提示，不给 0 冒充 ---------- */
  {
    notices.length = 0;
    const r = await readCustomStats(mkPlugin({ statsSource: 'custom', statsCustomPath: '' }, []));
    ok(r.ok === false && r.reason === 'empty-path', '路径留空 → 明确报错而不是返回 0');
    ok(notices.length === 1 && notices[0].indexOf('没填路径') > 0, '留空要有可见提示');
  }
  {
    notices.length = 0;
    const r = await readCustomStats(mkPlugin({ statsSource: 'custom', statsCustomPath: '不存在/目录' }, []));
    ok(r.ok === false && r.reason === 'no-file', '路径不存在 → 明确报错');
    ok(notices.some((n) => n.indexOf('没读到任何笔记') > 0), '不存在要有可见提示');
  }

  /* ---------- ④ DataView 开关 ---------- */
  {
    const off = dataviewLine({ pomodoro: { dataviewEnabled: false } }, { focusText: '25 分钟' });
    ok(off === '', '开关关着时一个字都不多写');
    const on = dataviewLine({ pomodoro: { dataviewEnabled: true } }, { focusText: '25 分钟' });
    ok(on.indexOf('专注时长:: 25 分钟') >= 0, '开关开着追加 DataView 内联字段，实际：' + JSON.stringify(on));
    const noVal = dataviewLine({ pomodoro: { dataviewEnabled: true } }, {});
    ok(noVal === '', '没有时长时不写空字段');
    const dur = dataviewLine({ pomodoro: { dataviewEnabled: true } }, { focus: 25, focusText: '25 分钟' });
    ok((dur.match(/专注时长::/g) || []).length === 1, '只写一行，不重复写');
  }

  /* ---------- ④b 字段表：一行一个，字段名可自定义 ---------- */
  {
    const dv = (fields, data) =>
      dataviewLine({ pomodoro: { dataviewEnabled: true, dataviewFields: fields } }, data);
    const data = { date: '2026-09-27', focusMin: 25, focusText: '25 分 30 秒', pauses: 3, profileName: '学习' };

    const one = dv('专注时长::{{VALUE:focusText}}', data);
    ok(one === '专注时长:: 25 分 30 秒\n', '默认那行照写（跟随「记录到秒」），实际：' + JSON.stringify(one));

    const two = dv('记录日期::{{VALUE:date}}\n我停下几次::{{VALUE:pauses}}', data);
    ok(two === '记录日期:: 2026-09-27\n我停下几次:: 3\n', '两行按字段表顺序写出，实际：' + JSON.stringify(two));

    const renamed = dv('专注::{{VALUE:focusText}}', data);
    ok(renamed === '专注:: 25 分 30 秒\n', '专注时长那行的字段名可以自己改，实际：' + JSON.stringify(renamed));

    const empty = dv('', data);
    ok(empty === '', '字段表清空 → 一行都不写');

    const bad = dv('这不是字段\n方案::{{VALUE:profile}}', data);
    ok(bad === '方案:: 学习\n', '格式不对的行整行跳过，不写半截字段，实际：' + JSON.stringify(bad));

    const unknown = dv('瞎写::{{VALUE:nope}}', data);
    ok(unknown === '', '变量不存在 → 整行跳过，不写空值');

    const noFocus = dv('专注::{{VALUE:focusText}}', { date: '2026-09-27' });
    ok(noFocus === '', '没有专注时长时不写「undefined 分钟」');

    const num = dv('专注分钟::{{VALUE:focus}}', data);
    ok(num === '专注分钟:: 25\n', 'focus 给出的是纯数字分钟，实际：' + JSON.stringify(num));
  }

  /* ---------- ④c 老配置兼容：没有字段表时按默认那行走 ---------- */
  {
    const legacy = dataviewLine({ pomodoro: { dataviewEnabled: true } }, { focusMin: 25, focusText: '25 分钟' });
    ok(legacy.indexOf('专注时长:: 25 分钟') >= 0, '老配置（无 dataviewFields 键）保持原有行为，实际：'
      + JSON.stringify(legacy));
  }

  /* ---------- ⑤ 两种写法都认 ---------- */
  {
    ok(sumMinutes('专注时长:: 25 分钟') === 25, '认 DataView 内联字段');
    ok(sumMinutes('专注 25 分钟') === 25, '认普通写法');
    ok(sumMinutes('') === 0, '空文本返回 0');
  }

  /* ---------- ⑥ 不积累废弃数据：新配置都是定值字段 ---------- */
  {
    const setSrc = fs.readFileSync(path.join(SRC, 'settings.js'), 'utf8');
    ok(/statsCustomPath:\s*''/.test(setSrc), 'statsCustomPath 是定值字符串（不按次堆积）');
    ok(/dataviewEnabled:\s*false/.test(setSrc), 'dataviewEnabled 是定值布尔（不按次堆积）');
  }

  /* ---------- ⑦ DataView 可用性检测（只用于提示，不影响写入） ---------- */
  {
    const { hasDataview } = recorder;
    ok(typeof hasDataview === 'function', 'recorder 导出 hasDataview');
    ok(hasDataview({ plugins: { plugins: { dataview: {} } } }) === true, '装了 DataView → true');
    ok(hasDataview({ plugins: { plugins: {} } }) === false, '没装 → false');
    ok(hasDataview({}) === false, 'app 无 plugins 字段 → false（不抛错）');
    ok(hasDataview(null) === false, 'app 为 null → false（不抛错）');
    // 装了但被禁用：Obsidian 的 plugins.plugins 里不会有它
    ok(hasDataview({ plugins: { plugins: { dataview: null } } }) === false, '装了但禁用（值是 null）→ false');
    // 检测方式必须与现有第三方插件取值一致，不许凭名字造 API
    const recSrc = fs.readFileSync(path.join(SRC, 'recorder.js'), 'utf8');
    ok(/app\.plugins && app\.plugins\.plugins/.test(recSrc),
      'hasDataview 沿用 getQuickAdd 的取值写法（app.plugins.plugins）');
  }

  console.log(`\n  通过 ${pass} / 失败 ${fail}`);
  process.exit(fail ? 1 : 0);
})();
