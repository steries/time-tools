/*
 * 写入格式契约守卫（v3.28）
 *
 * 写入格式是隐式契约：统计解析（sumMinutes）、自定义位置统计、DataView 查询
 * 三方都依赖 recorder.js 写出去的字。改了写法而消费方没跟上，
 * 统计会静默变 0 —— 不报错、不提示，是最难发现的一类退化。
 *
 * 守四件事：
 *   ① 契约有显式声明（RECORD_FORMAT_VERSION），不是散在代码里的默契
 *   ② 写入侧产出的文本，读取侧能读回同一个数（往返校验）
 *   ③ 必须认「小时」—— 少了这一支，正计时跑过一小时又开「记录到秒」时
 *      统计会丢掉整小时（实测「1 小时 0 分 0 秒」记成 0 分）
 *   ④ 读取侧共用 DURATION_RE，不许就地在函数里另写一份正则
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } };

global.__notices = [];
global.obsidian = {
  Notice: class { constructor(msg) { global.__notices.push(String(msg)); } },
  moment: (t) => {
    const d = t === undefined ? new Date() : new Date(t);
    return { format: () => d.toISOString() };
  },
};

const recorder = require(path.join(SRC, 'recorder.js'));
const { summaryLine, sumMinutes, dataviewLine, RECORD_FORMAT_VERSION } = recorder;
const src = fs.readFileSync(path.join(SRC, 'recorder.js'), 'utf8');

(async () => {
  /* ---------- ① 契约显式声明 ---------- */
  {
    ok(Number.isInteger(RECORD_FORMAT_VERSION) && RECORD_FORMAT_VERSION > 0,
      'RECORD_FORMAT_VERSION 是正整数（契约有显式声明），实际：' + RECORD_FORMAT_VERSION);
    ok(/const RECORD_FORMAT_VERSION = \d+;/.test(src),
      'recorder.js 里有格式版本号常量');
    ok(/写入格式契约/.test(src), '有契约说明块（写明改写法要跑本套件）');
  }

  /* ---------- ② 往返校验：关闭「记录到秒」 ---------- */
  {
    const data = { cycles: 1, focusMin: 25, restMin: 5, pauses: 0 };
    const line = summaryLine(data);
    ok(sumMinutes(line) === 30,
      '往返：写入「专注 25 分钟 · 休息 5 分钟」应读回 30，实际 ' + sumMinutes(line) + '（' + line + '）');
  }

  /* ---------- ③ 往返校验：开启「记录到秒」且超过一小时 ---------- */
  {
    // 正计时跑 1 小时 + 开记录到秒 → focusText 是「1 小时 0 分 0 秒」
    const data = { cycles: 1, focusMin: 60, restMin: 5, pauses: 0,
      focusText: '1 小时 0 分 0 秒', restText: '5 分 0 秒' };
    const line = summaryLine(data);
    ok(sumMinutes(line) === 65,
      '必须认「小时」：1 小时专注 + 5 分钟休息应读回 65，实际 ' + sumMinutes(line) + '（' + line + '）');

    ok(sumMinutes('专注 2 小时 5 分 10 秒') === 125,
      '2 小时 5 分 10 秒 → 125，实际 ' + sumMinutes('专注 2 小时 5 分 10 秒'));
    ok(sumMinutes('专注 1 小时 30 分 0 秒') === 90,
      '1 小时 30 分 → 90，实际 ' + sumMinutes('专注 1 小时 30 分 0 秒'));
  }

  /* ---------- ④ 既有写法不能被改坏 ---------- */
  {
    ok(sumMinutes('专注 25 分钟') === 25, '普通写法「25 分钟」→ 25');
    ok(sumMinutes('专注时长:: 25 分钟') === 25, 'DataView 内联字段也能读回');
    ok(sumMinutes('') === 0, '空文本 → 0（不抛错）');
    ok(sumMinutes(null) === 0, 'null → 0（不抛错）');
    // 模块级 /g 正则的 lastIndex 会跨调用残留 —— 不归零的话第二次就少算
    const a = sumMinutes('专注 25 分钟');
    const b = sumMinutes('专注 25 分钟');
    const c = sumMinutes('专注 25 分钟');
    ok(a === b && b === c, '连续调用结果一致（lastIndex 已归零），实际：' + [a, b, c].join('/'));
  }

  /* ---------- ⑤ DataView 字段也能被读回 ---------- */
  {
    const line = dataviewLine({ pomodoro: { dataviewEnabled: true } }, { focusMin: 25, focusText: '25 分钟' });
    ok(sumMinutes(line) === 25, 'DataView 行能被统计读回，实际 ' + sumMinutes(line) + '（' + JSON.stringify(line) + '）');
  }

  /* ---------- ⑥ 读取侧共用同一份正则定义 ---------- */
  {
    ok(/const DURATION_RE = /.test(src), 'DURATION_RE 是命名常量');
    ok(/DURATION_RE\.exec/.test(src) || /match\(DURATION_RE\)/.test(src),
      'sumMinutes 用的是 DURATION_RE，不是就地另写的正则');
    ok(/小时/.test(src.slice(src.indexOf('const DURATION_RE'), src.indexOf('const DURATION_RE') + 200)),
      'DURATION_RE 含「小时」分支（不许精简掉）');
    ok(/DURATION_RE\.lastIndex = 0/.test(src), 'sumMinutes 每次先把 lastIndex 归零');
  }

  console.log(`\n  通过 ${pass} / 失败 ${fail}`);
  process.exit(fail ? 1 : 0);
})();
