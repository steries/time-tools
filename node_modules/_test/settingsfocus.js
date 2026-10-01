/*
 * 输入框不许触发整页重绘（B1）
 * ------------------------------------------------------------------
 * 踩坑表写着「输入框 onChange 里只能 refreshCalendarViews，不能 redrawSettingsTab」，
 * 但一直没有任何测试守这条 —— 现在没踩，不代表以后不踩。
 * 这个套件把「靠人记得」变成「测试会红」。
 *
 * 判定方式：对每一处 redrawSettingsTab 调用，往前找离它最近的控件声明，
 * 若最近的那个是文本类输入框（addText / addTextArea / addSearch）就算违规。
 *
 * 为什么不用「剥注释 + 括号配对」：源码里有 /^\// 这种正则字面量和中文说明，
 * 剥注释会从字符串/正则中间下刀，留下的不配对引号会让括号配对跑飞，
 * 第一版就是这样误报了 pomodoro 与 timestamp 两处。这里改成不剥注释，
 * 只用「行首是否为注释行」排除注释里的同名文字。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const SRC = __dirname + '/../src';

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

const TEXTY = /\.add(?:Text|TextArea|Search)\s*\(/g;

/** 这一行的匹配点之前是不是只有注释（行首 * 或 //）—— 是就当它是注释里的文字 */
function isInCommentLine(text, idx) {
  const bol = text.lastIndexOf('\n', idx - 1) + 1;
  const prefix = text.slice(bol, idx);
  return /^\s*(\*|\/\/|\/\*)/.test(prefix) || /(^|\s)\/\/\s*\S/.test(prefix);
}

/**
 * 括号配对取出文本类输入框的回调块（在原始文本上做，不剥注释）。
 * 跟踪引号状态，避免中文说明里的括号把配对带偏。
 */
function textBlocks(text) {
  const out = [];
  const re = /\.add(?:Text|TextArea|Search)\s*\(/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let j = open;
    let q = null;
    for (; j < text.length; j++) {
      const c = text[j];
      if (q) {
        if (c === '\\') { j++; continue; }
        if (c === q) q = null;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) break; }
    }
    out.push({ start: open, end: j });
  }
  return out;
}

/** 返回落在文本输入框块内的 redrawSettingsTab 调用行号 */
function scan(text) {
  const blocks = textBlocks(text);
  const bad = [];
  const re = /redrawSettingsTab\s*\(/g;
  let m;
  let total = 0;
  while ((m = re.exec(text))) {
    total++;
    if (isInCommentLine(text, m.index)) continue;
    for (const b of blocks) {
      if (m.index >= b.start && m.index <= b.end) {
        bad.push('line ' + text.slice(0, m.index).split('\n').length);
        break;
      }
    }
  }
  return { bad, total };
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.js'));
const bad = [];
let total = 0;
for (const f of files) {
  const r = scan(fs.readFileSync(path.join(SRC, f), 'utf8'));
  total += r.total;
  for (const b of r.bad) bad.push(f + ':' + b);
}

console.log('输入框不许触发整页重绘：');
check('扫描器确实扫到了重绘调用（不是空跑）', total >= 10, 'total=' + total);
check('没有文本输入框在 onChange 里触发整页重绘', bad.length === 0, bad.join(', '));

/* 反证：合成串验证判定器真的有效（不动真实源码） */
const OK = "s.addText((t)=>t.onChange(async(v)=>{ await p.saveSettings(); })); p.redrawSettingsTab();";
const BAD = "s.addText((t)=>t.onChange(async(v)=>{ await p.saveSettings(); p.redrawSettingsTab(); }));";
const TOGGLE = "s.addToggle((t)=>t.onChange(async(v)=>{ await p.saveSettings(); p.redrawSettingsTab(); }));";
const COMMENT = "/* 这里曾经调用 plugin.redrawSettingsTab() —— 那是错的 */";

check('反证：文本输入框里重绘 → 判违规', scan(BAD).bad.length === 1, JSON.stringify(scan(BAD).bad));
check('反证：开关里重绘 → 不算违规', scan(TOGGLE).bad.length === 0);
check('反证：重绘在输入框之外 → 不算违规', scan(OK).bad.length === 0);
check('反证：注释里提到这串字 → 不算违规', scan(COMMENT).bad.length === 0, JSON.stringify(scan(COMMENT).bad));

console.log('\n通过 ' + pass + ' 项，失败 ' + fail + ' 项');
process.exit(fail ? 1 : 0);
