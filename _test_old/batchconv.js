/*
 * 批量转换（v3.13）回归测试
 *
 * 守四件事：
 *   ① 粗筛能覆盖常见写法，且不产生重叠命中（重叠会导致替换错位）
 *   ② 只转「compute 真能转出来」的 —— 转不动的原样留着
 *   ③ applyBatch 拼接正确，不吞字不多字
 *   ④ 有上限，不会一篇笔记里几千处全给改了
 */
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'src');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('  ✗ ' + m); } };

const ts = require(path.join(SRC, 'timestamp.js'));
const { collectCandidates, scanBatch, applyBatch, BATCH_MAX } = ts;

console.log('[BATCH] 批量转换');

/* ---------- ① 粗筛 ---------- */
{
  const text = '2026-09-25 开会，明天 14:30 再聊，农历五月初五放假';
  const c = collectCandidates(text);
  const raws = c.map((x) => x.raw);
  ok(raws.includes('2026-09-25'), '筛出完整日期 2026-09-25');
  ok(raws.includes('明天'), '筛出口语相对日 明天');
  ok(raws.includes('14:30'), '筛出时分 14:30');
  ok(raws.some((r) => /农历五月初五/.test(r)), '筛出农历 农历五月初五');
}
{
  // 不重叠：位置严格递增，且后一段起点 >= 前一段终点
  const text = '2026年9月25日 2026-09-26 明天 昨天 15:00';
  const c = collectCandidates(text);
  let mono = true, noOverlap = true;
  for (let i = 1; i < c.length; i++) {
    if (c[i].index < c[i - 1].index) mono = false;
    if (c[i].index < c[i - 1].index + c[i - 1].raw.length) noOverlap = false;
  }
  ok(mono, '候选按位置递增');
  ok(noOverlap, '候选互不重叠（重叠会让替换错位）');
  // 每个 raw 必须真的出现在原文那个位置
  let faithful = true;
  for (const x of c) if (text.slice(x.index, x.index + x.raw.length) !== x.raw) faithful = false;
  ok(faithful, '候选的 index 与原文对得上');
}

/* ---------- ② 只转能转的（用假 plugin 走真实 compute） ---------- */
const mkPlugin = (over) => ({
  settings: JSON.parse(JSON.stringify({
    timestamp: {
      format: 'YYYY-MM-DD HH:mm',
      preciseToSecond: false,
      unifyFormat: '',
      extensions: Object.assign({
        enabled: true, lunarEnabled: true, unify: true, unixDecode: true,
        relativeToDate: true, lunarToSolar: true,
      }, over || {}),
      userRules: [],
    },
  })),
});

{
  const p = mkPlugin();
  const text = '明天开会，昨天写了文档';
  const hits = scanBatch(p, text, 'relativeToDate');
  ok(hits.length >= 1, '相对日能被转出来（≥1 处）');
  for (const h of hits) ok(/^\d{4}-\d{2}-\d{2}/.test(h.result), '转换结果形如日期：' + h.result);
  // 转不出来的不该出现在命中里
  const none = scanBatch(p, '这是一段完全没有时间的文字', 'relativeToDate');
  ok(none.length === 0, '没有可转内容时返回 0 处（不硬凑）');
}
{
  // 转完跟原文一样的不算命中，避免"替换了个寂寞"还计进数字
  const p = mkPlugin();
  const hits = scanBatch(p, '2026-09-25', 'unify');
  for (const h of hits) ok(h.result !== h.raw, '命中必然有实际变化：' + h.raw + ' → ' + h.result);
}
{
  // 关闭的转换项不该被批量转出来
  const p = mkPlugin({ relativeToDate: false });
  // compute 内部不查开关（开关由 UI 层管），这里验证的是：
  // 上层命令只把「已启用」的项传进弹窗 —— 用源码断言守住
  const src = fs.readFileSync(path.join(SRC, 'timestamp.js'), 'utf8');
  const i = src.indexOf("id: 'time-tools-timestamp-batch-convert'");
  const body = src.slice(i, i + 1600);
  ok(/ACTION_DEFS[\s\S]{0,80}filter\([\s\S]{0,80}ext\[a\.key\] === true/.test(body),
    '批量命令只列已启用的转换项');
  ok(/getActiveFile/.test(body), '批量命令取当前文件');
  ok(/\.endsWith\('\.md'\)/.test(body), '只处理 markdown 笔记');
  ok(body.indexOf("if (!defs.length)") > 0, '没启用任何转换项时给提示（不是静默 return）');
}

/* ---------- ③ 拼接 ---------- */
{
  const text = 'AAA 明天 BBB 昨天 CCC';
  const p = mkPlugin();
  const hits = scanBatch(p, text, 'relativeToDate');
  const out = applyBatch(text, hits);
  ok(out.startsWith('AAA '), '开头保留');
  ok(out.endsWith(' CCC'), '结尾保留（不吞字）');
  // 长度变化 = 命中处的净增量，不应凭空多出分隔符
  ok(out.indexOf('BBB') > 0, '中间文本保留');
  // 手工构造一次精确验证
  const t2 = '<X>abcd';
  const h2 = [{ raw: 'abcd', index: 3, result: 'ZZ' }];
  ok(applyBatch(t2, h2) === '<X>ZZ', '精确拼接：前缀 + 结果 + 余下');
  ok(applyBatch('abc', []) === 'abc', '无命中时原样返回');
}

/* ---------- ④ 上限 ---------- */
{
  const p = mkPlugin();
  const many = new Array(400).fill('明天').join(' ');
  const hits = scanBatch(p, many, 'relativeToDate');
  ok(hits.length <= BATCH_MAX, `命中数受上限约束（${hits.length} <= ${BATCH_MAX}）`);
  ok(BATCH_MAX > 0 && BATCH_MAX <= 500, '上限是个合理数值：' + BATCH_MAX);
}

/* ---------- ⑤ 导出与注册 ---------- */
{
  const src = fs.readFileSync(path.join(SRC, 'timestamp.js'), 'utf8');
  ok(src.indexOf('function collectCandidates') > 0, 'collectCandidates 已定义');
  ok(src.indexOf('function scanBatch') > 0, 'scanBatch 已定义');
  ok(src.indexOf('function applyBatch') > 0, 'applyBatch 已定义');
  ok(src.indexOf("id: 'time-tools-timestamp-batch-convert'") > 0, '批量命令已注册');
  // 不用后行断言（老 Electron 不支持会抛错）
  const noComment = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(noComment.indexOf('?<!') < 0, '正则没用后行断言（老版本 Electron 会抛错）');
}

console.log(`\n  通过 ${pass} / 失败 ${fail}`);
process.exit(fail ? 1 : 0);
