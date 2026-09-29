/*
 * 设置页 id 守卫（v3.29）
 * ------------------------------------------------------------------
 * 目的：把「已安装插件的三点菜单没有『设置』、插件详情页没有『选项』按钮」
 *       从「人工点一遍才发现」变成「测试会红」。
 *
 * 这个 bug 人工点一遍发现不了：设置页在设置面板里照常显示、也能手动点开，
 * 只是那两个快捷入口不出现。所以必须写成断言。
 *
 * 根因：Obsidian 是按「插件 id」定位设置页的
 *       —— app.setting.openTabById(manifest.id)。
 *       设置页若另起一个 id（如 'time-tools-settings'），按 manifest.id
 *       查不到这个标签页，Obsidian 就判定本插件「没有可配置选项」，
 *       于是隐藏「设置」与「选项」两个入口。
 *
 * 三条守的：
 *   ① 源码里不得再出现手写 id 字符串；
 *   ② 运行时构造出的设置页 id 必须 === manifest.id；
 *   ③ 入口只挂一个设置页（挂两个会让其中一个成为孤儿标签页）。
 */

'use strict';

process.env.TZ = 'UTC';

const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const SETTINGS = path.join(SRC, 'settings.js');
const MAIN = path.join(SRC, 'main.js');

let pass = 0;
let fail = 0;
function check(name, cond, actual) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (actual === undefined ? '' : ' → ' + actual)); }
}

// ── ① 源码层：不得再手写 id 字符串 ────────────────────────────────
const settingsSrc = fs.readFileSync(SETTINGS, 'utf8');

// 注释里会提到这个字符串（作为反面例子），故只查「赋值」形态
const assignRe = /this\.id\s*=\s*['"]time-tools-settings['"]/;
check('源码里不存在手写的设置页 id 赋值', !assignRe.test(settingsSrc),
  assignRe.test(settingsSrc) ? '存在 this.id = "time-tools-settings"' : '');

// id 必须取自 manifest，不能是常量
check('id 取自 plugin.manifest.id', /plugin\s*&&\s*plugin\.manifest\s*&&\s*plugin\.manifest\.id/.test(settingsSrc));

// ── ② 运行时：构造出的实例 id === manifest.id ──────────────────────
// 给一个最小的 obsidian 替身，只提供 PluginSettingTab 基类
const obsidian = require('obsidian');
if (!obsidian.PluginSettingTab) {
  obsidian.PluginSettingTab = class PluginSettingTab {
    constructor(app, plugin) { this.app = app; this.plugin = plugin; }
  };
}

const settings = require(SETTINGS);
const TabCtor = settings.TimeToolsSettingTab;

if (typeof TabCtor !== 'function') {
  check('能取到 TimeToolsSettingTab 构造器', false, '未导出');
} else {
  check('能取到 TimeToolsSettingTab 构造器', true);

  // 用真实默认配置，避免构造时读到 undefined 而误报
  const baseSettings = JSON.parse(JSON.stringify(settings.DEFAULT_SETTINGS));
  function mkPlugin(id) {
    return { manifest: { id: id }, settings: JSON.parse(JSON.stringify(baseSettings)) };
  }
  function mkTab(id) {
    try { return new TabCtor({}, mkPlugin(id)); } catch (e) { return null; }
  }

  const tab = mkTab('time-tools');
  check('构造不抛错', tab !== null);
  if (tab) {
    check('设置页 id === manifest.id', tab.id === 'time-tools', String(tab.id));
  }

  // 反证：换一个 manifest.id，id 必须跟着变（证明不是写死的常量）
  const tab2 = mkTab('another-plugin');
  if (tab2) {
    check('id 随 manifest.id 变化（不是写死常量）', tab2.id === 'another-plugin', String(tab2.id));
  }
}

// ── ③ 入口只挂一个设置页 ─────────────────────────────────────────
const mainSrc = fs.readFileSync(MAIN, 'utf8');
const addTabCalls = mainSrc.match(/addSettingTab\s*\(/g) || [];
check('入口只挂一个设置页', addTabCalls.length === 1, '实际 ' + addTabCalls.length + ' 处');

console.log('');
if (fail === 0) {
  console.log('全部通过 ✅\n套件: settingtab');
  process.exit(0);
} else {
  console.log('通过 ' + pass + ' / 失败 ' + fail + '\n套件: settingtab');
  process.exit(1);
}
