/*
 * 累计统计（v3.13）回归测试
 *
 * 守三件事：
 *   ① 数据源三种取值各自的行为（off 不存 / memory 累加 / note 现读）
 *   ② 不积累废弃数据：memory 只写固定 4 字段，跨天归零「今日」
 *   ③ 会话结束要把时长送进统计，且必须在 resetRuntime 之前取
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.join(__dirname, '..', 'src');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } };

/*
 * 本地日期（不是 UTC）
 * 插件自己写 todayDate 用的就是本地日期；用 new Date().toISOString().slice(0,10)
 * 构造会在「UTC 与本地跨日」时（UTC+8 的 00:00–08:00 段）被误判成跨天归零，
 * 断言随之假红。2026-09 实测踩到：UTC=09-26 / 本地=09-27 → 提示变「0 分钟」。
 */
const todayLocal = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();

/* ---------- 最小 obsidian 替身 ---------- */
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
const { accumulateStats, showStats } = recorder;

console.log('[STATS] 累计统计');

/* ---------- ① 数据源取值 ---------- */
{
  const s = { pomodoro: { statsSource: 'off' } };
  ok(accumulateStats(s, 600000) === false, 'off 时不记账');
  ok(s.pomodoro.statsMemory === undefined, 'off 时不创建任何统计字段');
}
{
  const s = { pomodoro: { statsSource: 'memory' } };
  ok(accumulateStats(s, 600000) === true, 'memory 时记账成功');
  ok(s.pomodoro.statsMemory.todayFocusMs === 600000, 'memory 累加今日 10 分钟');
  ok(s.pomodoro.statsMemory.totalFocusMs === 600000, 'memory 累加累计 10 分钟');
  ok(s.pomodoro.statsMemory.sessions === 1, 'memory 会话计数 +1');
}

/* ---------- ② 不积累废弃数据 ---------- */
{
  const s = { pomodoro: { statsSource: 'memory', statsMemory: {} } };
  accumulateStats(s, 600000);
  accumulateStats(s, 1500000);
  const keys = Object.keys(s.pomodoro.statsMemory).sort();
  ok(keys.length === 4, 'memory 只写固定 4 个字段（不按次堆条目），实际：' + keys.join(','));
  ok(s.pomodoro.statsMemory.totalFocusMs === 2100000, '多次累加：累计 35 分钟');
  ok(s.pomodoro.statsMemory.sessions === 2, '多次累加：2 次会话');
}
{
  // 跨天：todayDate 不是今天 → 今日归零，累计不清
  const s = {
    pomodoro: {
      statsSource: 'memory',
      statsMemory: { todayDate: '1999-01-01', todayFocusMs: 999000, totalFocusMs: 999000, sessions: 5 },
    },
  };
  accumulateStats(s, 60000);
  ok(s.pomodoro.statsMemory.todayFocusMs === 60000, '跨天后「今日」归零再累计（不把历史当今日）');
  ok(s.pomodoro.statsMemory.totalFocusMs === 1059000, '跨天不清累计');
  ok(s.pomodoro.statsMemory.todayDate !== '1999-01-01', '跨天更新 todayDate');
}
{
  // 垃圾值不该污染
  const s = { pomodoro: { statsSource: 'memory', statsMemory: {} } };
  accumulateStats(s, NaN);
  accumulateStats(s, -5000);
  ok(s.pomodoro.statsMemory.totalFocusMs === 0, '负数 / NaN 不污染累计');
}

/* ---------- ③ 统计命令 ---------- */
(async () => {
  notices.length = 0;
  const r1 = await showStats({ settings: { pomodoro: { statsSource: 'off' } } });
  ok(r1.ok === false && r1.reason === 'off', 'off 时命令明确返回 off');
  ok(notices.length === 1 && /关闭/.test(notices[0]), 'off 时给用户可见提示（不是静默 return）');

  notices.length = 0;
  const r2 = await showStats({
    settings: { pomodoro: { statsSource: 'memory', statsMemory: { todayDate: todayLocal, todayFocusMs: 1500000, totalFocusMs: 3000000, sessions: 3 } } },
  });
  ok(r2.ok === true && r2.source === 'memory', 'memory 时命令走本机数据');
  ok(notices.length === 1 && /25 分钟/.test(notices[0]), 'memory 提示含今日时长（25 分钟）');

  notices.length = 0;
  const r3 = await showStats({ settings: { pomodoro: { statsSource: 'note', record: { notePath: 'x.md' } } }, app: {} });
  ok(r3.ok === false, 'note 源取不到笔记时返回失败');
  ok(notices.length === 1 && !/0/.test(notices[0]) === false || notices.length === 1, 'note 源失败也有提示（不静默）');

  /* ---------- ④ 源码接线检查 ---------- */
  const pomoSrc = fs.readFileSync(path.join(SRC, 'pomodoro.js'), 'utf8');
  const idx = pomoSrc.indexOf('  finishSession() {');
  const body = pomoSrc.slice(idx, idx + 4000);
  const aIdx = body.indexOf('accumulateStats(');
  const rIdx = body.indexOf('this.resetRuntime()');
  ok(aIdx > 0, 'finishSession 里调用了 accumulateStats');
  ok(aIdx > 0 && rIdx > 0 && aIdx < rIdx, 'accumulateStats 必须在 resetRuntime 之前（否则读到 0）');
  ok(pomoSrc.indexOf("id: 'time-tools-pomodoro-show-stats'") > 0, '统计命令已注册');

  // 设置页 UI
  ok(pomoSrc.indexOf("addOption('memory'") > 0, '设置页有「本机累计」选项');
  ok(pomoSrc.indexOf("addOption('note'") > 0, '设置页有「解析笔记」选项');

  // 默认值与清洗
  const setSrc = fs.readFileSync(path.join(SRC, 'settings.js'), 'utf8');
  ok(/statsSource:\s*'off'/.test(setSrc), 'statsSource 默认 off（不统计，也不存数据）');
  ok(/\['note',\s*'memory',\s*'custom',\s*'off'\]\.indexOf/.test(setSrc), 'statsSource 有值域清洗（脏值退回 off）');
  ok(pomoSrc.indexOf("addOption('custom'") > 0, '设置页有「自定义位置」选项');
  ok(/statsCustomPath:\s*''/.test(setSrc), 'statsCustomPath 默认空字符串');
  ok(/dataviewEnabled:\s*false/.test(setSrc), 'DataView 联动默认关');
  ok(/dataviewEnabled\s*=\s*typeof/.test(setSrc), 'dataviewEnabled 有类型清洗');
  ok(/statsCustomPath\s*=\s*typeof/.test(setSrc), 'statsCustomPath 有类型清洗');

  console.log(`\n  通过 ${pass} / 失败 ${fail}`);
  process.exit(fail ? 1 : 0);
})();
