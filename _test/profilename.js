/*
 * 回归：设置页「测试执行」拿到的方案名必须来自当前生效方案，
 * 不能因为读了个不存在的配置键而恒等于某个写死的名字。
 *
 * 断言前先剥离注释 —— 踩坑表里要写清「旧写法错在哪」，
 * 那段说明文字本身就是反例字符串，不剥掉会永远命中。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}

/** 去掉 // 行注释与 /* *\/ 块注释，只留代码 */
function stripComments(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const raw = fs.readFileSync(path.join(root, 'src/recorder.js'), 'utf8');
const src = stripComments(raw);
const builtCode = stripComments(
  fs.readFileSync(path.join(root, 'main.js'), 'utf8')
);

console.log('[方案名] 不再读不存在的配置键');
ok(!/settings\.pomodoro\.activeProfile\b/.test(src),
   '代码里不再出现 settings.pomodoro.activeProfile');

console.log('[方案名] 不再写死兜底串');
ok(!/profileName[\s\S]{0,250}'学习'/.test(src), '源码里不再硬编码「学习」');
ok(!/profileName[\s\S]{0,250}'学习'/.test(builtCode), '产物里也不再有写死兜底');

console.log('[方案名] 确实从当前生效方案解析');
/*
 * 必须限定在 testQuickAdd 方法内：控制器里另有一处 profileName
 * （用的是 this.activeProfile getter，本来就是对的），
 * 不限定的话 match 会先命中它，断言等于在检查一处没问题的代码。
 */
const tq = src.slice(src.indexOf('async testQuickAdd()'));
const seg = (tq.match(/profileName[\s\S]{0,320}/) || [''])[0];
ok(seg.length > 0, '能在 testQuickAdd 内定位到 profileName');
ok(/activeProfileId/.test(seg), '按 activeProfileId 取方案');
ok(/profiles\s*\|\|\s*\[\]\s*\)\s*\[\s*0\s*\]|profiles\[\s*0\s*\]/.test(seg),
   '取不到时退回首个方案');
ok(/p\s*&&\s*p\.name/.test(seg), '用方案自身的 name，不猜');

console.log('[方案名] 默认方案仍在默认表');
const setSrc = fs.readFileSync(path.join(root, 'src/settings.js'), 'utf8');
ok(/id:\s*'study'/.test(setSrc), '默认方案 study 存在');

/* 反证：把修复撤掉，测试必须变红 —— 否则它是摆设 */
console.log('[方案名] 反证');
const broken = src.replace(
  /profileName:[\s\S]*?\}\)\(this\.plugin\.settings\.pomodoro\),/,
  "profileName: this.plugin.settings.pomodoro.activeProfileId ? '学习' : '学习',"
);
ok(/profileName[\s\S]{0,250}'学习'/.test(broken), '撤掉修复后断言确实会命中');

console.log(`\n方案名回归：通过 ${pass}，失败 ${fail}`);
process.exit(fail ? 1 : 0);
