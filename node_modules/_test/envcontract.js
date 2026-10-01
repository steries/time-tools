/*
 * 公共环境契约守卫（v3.29.0）
 * ------------------------------------------------------------------
 * 为什么要有它：
 *   v3.29.0 发版时，用户本地跑出 5 项红，全是剪贴板相关：
 *       ✗ 剪贴板模式写入剪贴板
 *       ✗ 剪贴板内容含轮数 / 暂停次数 / 跳过行
 *       ✗ QuickAdd 预复制开启时剪贴板有内容
 *   排查被完全带偏 —— 失败信息指向业务（"剪贴板没写入"），
 *   根因却在测试环境（Node 21+ 的 navigator 是只读 getter，
 *   `global.navigator = {...}` 静默失败，环境根本没装上剪贴板）。
 *
 * 本套件把「环境缺了什么」变成一句直白的红，
 * 而不是让 quickadd 报一堆看不懂的红、再让人去猜。
 *
 * 断言必须是行为验证，不是存在验证：
 *   只查 `typeof writeText === 'function'` 抓不到「实现是空函数」，
 *   历史上就有断言这么假装工作过。所以要真的调一次看有没有写进去。
 */

'use strict';

process.env.TZ = 'UTC';

const env = require('./_smoke_env.js');
const { check, done } = env;

console.log('公共环境契约：');

(async () => {
  // ── 剪贴板链路：recorder.js 写入 → quickadd.js 读取 ──────────────
  check('提供 global.__clipboard（剪贴板容器）', typeof global.__clipboard === 'string',
    typeof global.__clipboard);

  const nav = global.navigator;
  check('提供 global.navigator', !!nav && typeof nav === 'object');
  check('提供 global.navigator.clipboard.writeText',
    !!(nav && nav.clipboard && typeof nav.clipboard.writeText === 'function'));

  // 真调一次：只查存在性抓不到「实现是空函数」
  global.__clipboard = '';
  try {
    await global.navigator.clipboard.writeText('probe');
  } catch (e) {
    check('writeText 真的写入 __clipboard', false, '抛错: ' + e.message);
  }
  check('writeText 真的写入 __clipboard', global.__clipboard === 'probe',
    JSON.stringify(global.__clipboard));

  // ── 其余承诺的能力 ─────────────────────────────────────────────
  check('提供 global.__modals（弹窗收集）', Array.isArray(global.__modals));
  check('提供 global.__notices（提示收集）', Array.isArray(global.__notices));
  check('提供断言器 check', typeof check === 'function');
  check('提供收尾器 done', typeof done === 'function');
  check('提供 global.document.createElement',
    !!(global.document && typeof global.document.createElement === 'function'));
  check('提供 global.window.setInterval',
    !!(global.window && typeof global.window.setInterval === 'function'));

  done('envcontract');
})();
