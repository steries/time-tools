/*
 * 公共测试环境契约守卫（v3.29 收尾 / v3.30 补入）
 * ------------------------------------------------------------------
 * 守的是什么：
 *   `_test/_smoke_env.js` 是各套件**共用**的一份环境装配（DOM/window stub、
 *   navigator mock、断言器）。它对外承诺提供一批全局能力，但这份承诺
 *   **一直没写在任何地方**——既没登记，也没有断言。
 *
 * 为什么必须守卫（一次真实事故的代价）：
 *   剪贴板那条链是三处分散、谁也不知道它是一条链：
 *       src/recorder.js:229   navigator.clipboard.writeText(text)   ← 写入
 *       _smoke_env.js         global.__clipboard = t                ← mock
 *       _test/quickadd.js     check(__clipboard.includes(...))      ← 读取
 *   环境里缺了 mock，recorder 会走 `if (navigator.clipboard && ...)` 静默跳过，
 *   __clipboard 永远空串 → quickadd 报 5 项红。
 *   **报错说"剪贴板没写入"，真实是"测试环境根本没提供剪贴板"** ——
 *   排查方向完全被带偏，前三轮全白干（以为源码没同步 / 以为环境旧 / 以为版本不配套）。
 *
 * 所以这里要做的不是"查一下有没有这个变量"，而是：
 *   **真的调用一次，验证行为发生** —— 只查存在性抓不到空实现
 *   （属性在、函数也在、但里面什么都没干的 mock 是完全可能的）。
 *
 * 另一条同源的坑（Node 21+）：
 *   Node 21+ 内置了 globalThis.navigator（只有 getter 没 setter），
 *   `global.navigator = {...}` 在非严格模式下**静默失败**（不生效也不报错）。
 *   实测 v20 全绿 / v24 五红，同一份代码两种结果。
 *   故本套件额外断言"写入真的生效"，而不是"属性存在"。
 */

'use strict';

process.env.TZ = 'UTC';

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

const env = require(path_join());

function path_join() {
  // eslint-disable-next-line
  return require('path').join(__dirname, '_smoke_env.js');
}

console.log('\n[A] 装配后全局能力齐全');
check('__clipboard 已装配', typeof global.__clipboard === 'string',
  typeof global.__clipboard);
check('__modals 已装配且是数组', Array.isArray(global.__modals));
check('__notices 已装配且是数组', Array.isArray(global.__notices));
check('document.createElement 可用',
  typeof global.document === 'object' && typeof global.document.createElement === 'function');
check('window.setInterval 可用',
  typeof global.window === 'object' && typeof global.window.setInterval === 'function');

console.log('\n[B] 剪贴板链路：真调一次，验证写入生效（不是只查存在）');
check('navigator.clipboard.writeText 存在',
  !!(global.navigator && global.navigator.clipboard
    && typeof global.navigator.clipboard.writeText === 'function'));
check('check / done 断言器可用',
  typeof env.check === 'function' && typeof env.done === 'function');

(async function run() {
  const marker = '__envcontract_probe__';
  global.__clipboard = '';
  try {
    await global.navigator.clipboard.writeText(marker);
  } catch (e) {
    check('writeText 调用不抛错', false, e && e.message);
  }
  check('writeText 真的把内容写进了 __clipboard',
    global.__clipboard === marker, JSON.stringify(global.__clipboard));
  global.__clipboard = '';

  console.log('\n[C] 环境自身不产生用例');
  check('跑完 envcontract 前环境未污染（__clipboard 已复位）',
    global.__clipboard === '', JSON.stringify(global.__clipboard));

  console.log('\n' + (fail === 0 ? '全部通过 ✅' : fail + ' 项失败 ❌'));
  console.log('套件: envcontract');
  process.exit(fail === 0 ? 0 : 1);
})();
