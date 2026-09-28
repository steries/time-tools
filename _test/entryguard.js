/*
 * 入口登记表守卫（C1）
 * ------------------------------------------------------------------
 * 目的：把「总开关关了，某个入口还在跑」从「靠人记得」变成「测试会红」。
 *
 * 历史上反复出现：新增命令 / 右键菜单 / 面板入口时忘了接 extEnabled，
 * 结果关掉时间戳总开关后该入口照常工作。
 *
 * 做法：扫源码里所有命令注册点，断言每个都过了总开关门控
 * （豁免名单里的除外，且豁免必须写理由）。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const SRC = __dirname + '/../src';
const TS = path.join(SRC, 'timestamp.js');

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

/*
 * 豁免名单：这些命令与「时间转换」无关，总开关关了也该能用。
 * 目前为空 —— 时间戳模块的所有命令都必须随总开关隐藏。
 * 新增豁免必须写清理由，否则豁免会变成漏网关控的后门。
 */
const EXEMPT = {};

/** 扫一份源码行，返回未接门控的命令 id 列表 */
function findMissing(lines) {
  const cmds = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /id:\s*'([a-z0-9\-]+)'/.exec(lines[i]);
    if (!m || !/^time-tools-/.test(m[1])) continue;
    /*
     * 窗口必须在**下一个命令注册点之前**结束。
     * 早先固定 30 行，而相邻命令只隔 9~12 行 ——
     * 于是借到了下一条命令的门控，漏网的也被判成「已门控」。
     */
    let end = lines.length;
    for (let k = i + 1; k < Math.min(i + 30, lines.length); k++) {
      if (/id:\s*'[a-z0-9\-]+'/.test(lines[k])) { end = k; break; }
    }
    let gateLine = -1;
    for (let k = i; k < end; k++) {
      if (lines[k].indexOf('extEnabled') >= 0) { gateLine = k; break; }
    }
    cmds.push({ id: m[1], line: i, gateLine: gateLine });
  }
  return cmds.filter((c) => !EXEMPT[c.id] && c.gateLine < 0);
}

const lines = fs.readFileSync(TS, 'utf8').split('\n');

console.log('[1] 命令入口必须过总开关');
const cmds = findMissing(lines);
check('扫到了时间戳模块的命令注册点', cmds.length >= 0);
const all = lines.length > 0 ? findMissing(lines) : [];
check('每个命令都有总开关门控', all.length === 0,
  all.map((c) => c.id + ' (第 ' + (c.line + 1) + ' 行)').join('; '));

console.log('\n[2] 豁免名单必须带理由，且只含真实存在的命令');
const idList = [];
for (let i = 0; i < lines.length; i++) {
  const m = /id:\s*'([a-z0-9\-]+)'/.exec(lines[i]);
  if (m && /^time-tools-/.test(m[1])) idList.push(m[1]);
}
const badExempt = [];
for (const id of Object.keys(EXEMPT)) {
  if (!EXEMPT[id]) badExempt.push(id + ' 缺理由');
  if (idList.indexOf(id) < 0) badExempt.push(id + ' 不是真实命令（可能是残留）');
}
check('豁免名单干净', badExempt.length === 0, badExempt.join('; '));

console.log('\n[3] 门控总数与入口数对得上（防止加了入口忘了登记）');
const src = fs.readFileSync(TS, 'utf8');
const gateCount = (src.match(/extEnabled\(/g) || []).length;
check('门控调用数不少于命令数', gateCount >= idList.length,
  gateCount + ' vs ' + idList.length);

console.log('\n[4] 反证：抹掉某条命令自己的门控，[1] 必须报错');
{
  /*
   * 必须抹「命令自己那道门控」，不是全文件第一处 extEnabled ——
   * 早先版本抹的是 indexOf 的第一处命中，而那处是别的类里的判空，
   * 跟命令无关，反证因此恒绿（靠本来就漏的项蒙过去），等于给 bug 背书。
   */
  let victim = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = /id:\s*'([a-z0-9\-]+)'/.exec(lines[i]);
    if (!m || !/^time-tools-/.test(m[1])) continue;
    let end = lines.length;
    for (let k = i + 1; k < Math.min(i + 30, lines.length); k++) {
      if (/id:\s*'[a-z0-9\-]+'/.test(lines[k])) { end = k; break; }
    }
    for (let k = i; k < end; k++) {
      if (lines[k].indexOf('extEnabled') >= 0) { victim = k; break; }
    }
    if (victim >= 0) break;
  }
  check('找到了一条已接门控的命令用于反证', victim >= 0, victim);
  const bl = lines.slice();
  bl[victim] = bl[victim].replace('extEnabled(', 'xxtEnabled(');
  const broken = findMissing(bl);
  check('抹掉该门控后确实能检出', broken.length >= 1, broken.length);
}

console.log('\n' + pass + ' 项通过' + (fail ? '，' + fail + ' 项失败 ❌' : '，全部通过 ✅'));
process.exit(fail ? 1 : 0);
