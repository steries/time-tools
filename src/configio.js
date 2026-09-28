/*
 * 配置的导出与导入（备份）。
 *
 * 为什么要它：换设备、重装插件时，调过的方案、主题、格式串、自定义规则
 * 全得重设一遍。data.json 在 .obsidian 里，用户一般不敢直接动。
 *
 * 两条硬约束：
 *   1. **导入必须走 migrateSettings 的白名单** —— 直接整体替换会把旧版本的废弃键
 *      （甚至别人手改坏的值）原样带进来，那正是「废弃数据积累」的入口。
 *      白名单 + 值域清洗才能保证导入后的配置与本机出厂结构一致。
 *   2. **导出用固定文件名覆盖** —— 带时间戳会每次导出多一个文件，越攒越多；
 *      固定名则是「最新一份备份」，想留多份由用户自己复制改名。
 *
 * 只碰配置文件，不碰笔记正文；全程 try/catch，任何一步失败都给用户可见提示
 * （铁律：只 console.warn 等于没有）。
 */
'use strict';

const obsidian = require('obsidian');
const { t: i18nT } = require('./i18n.js');
const { migrateSettings } = require('./settings.js');

/** 固定文件名：覆盖式，不累积。放在库根目录，用户找得到、也方便自行另存 */
const BACKUP_FILE = 'time-tools-配置备份.json';

/**
 * 导出配置到库根目录。
 * @returns {Promise<{ok:boolean, path?:string, reason?:string}>}
 */
async function exportConfig(plugin) {
  try {
    const vault = plugin && plugin.app && plugin.app.vault;
    if (!vault || !vault.adapter) return { ok: false, reason: 'no-vault' };
    const text = JSON.stringify(plugin.settings, null, 2);
    await vault.adapter.write(BACKUP_FILE, text);
    return { ok: true, path: BACKUP_FILE };
  } catch (e) {
    return { ok: false, reason: 'write-failed' };
  }
}

/**
 * 导入配置：解析文本 → 白名单迁移 → 应用 → 保存。
 *
 * 不直接整体替换 settings：那样会把源机器上的废弃键一并带进来，
 * 而且非法值（比如 countUpMaxMin 是负数）会一路活到运行时。
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
async function importConfig(plugin, text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, reason: 'bad-json' };
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'not-object' };
  }
  try {
    const clean = migrateSettings(raw);
    plugin.settings = clean;
    await plugin.saveSettings();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'apply-failed' };
  }
}

/** 导出命令的执行体：写文件 + 可见提示（失败也要说清楚卡在哪一步） */
async function runExport(plugin) {
  const r = await exportConfig(plugin);
  if (r.ok) {
    new obsidian.Notice(`✅ 配置已导出到库根目录：${r.path}（想留多份请自行复制改名）`);
  } else {
    new obsidian.Notice(`❌ 导出失败（${r.reason}）：请检查库是否可写，或手动复制 .obsidian/plugins/time-tools/data.json`);
  }
  return r;
}

/** 导入命令的执行体：弹输入框让用户粘贴 JSON，不依赖文件选择对话框（沙盒也测得到） */
function runImport(plugin) {
  new (class extends obsidian.Modal {
    constructor(app) {
      super(app);
      this.value = '';
    }
    onOpen() {
      const { contentEl } = this;
      contentEl.empty();
      contentEl.createEl('h3', { text: i18nT('k2a08ec21', '导入配置') });
      contentEl.createEl('p', {
        text: i18nT('k86357ff9', '粘贴之前导出的 JSON 全文。导入会走白名单清洗，旧版本的废弃字段不会被带进来。当前配置会被覆盖。'),
      });
      const ta = contentEl.createEl('textarea');
      ta.placeholder = '{ "version": 1, ... }';
      ta.style.width = '100%';
      ta.style.height = '220px';
      ta.addEventListener('input', () => {
        this.value = ta.value;
      });
      const row = contentEl.createDiv();
      row.style.marginTop = '10px';
      const ok = row.createEl('button', { text: i18nT('k4fe38eb0', '导入并覆盖') });
      ok.style.marginRight = '8px';
      ok.addEventListener('click', async () => {
        const r = await importConfig(plugin, this.value);
        if (r.ok) {
          new obsidian.Notice('✅ 配置已导入并应用');
          if (plugin.redrawSettingsTab) plugin.redrawSettingsTab();
        } else {
          const msg = {
            'bad-json': '不是合法的 JSON 文本',
            'not-object': '内容不是一个配置对象',
            'apply-failed': '应用失败，配置未改动',
          }[r.reason] || '导入失败';
          new obsidian.Notice(`❌ ${msg}`);
        }
        this.close();
      });
      const cancel = row.createEl('button', { text: i18nT('k949856b3', '取消') });
      cancel.addEventListener('click', () => this.close());
    }
    onClose() {
      this.contentEl.empty();
    }
  })(plugin.app).open();
}

/**
 * 注册配置备份的两条命令。
 *
 * 单独成一个模块（而不是塞进时间戳）：它管的是**全部**模块的设置，
 * 不属于任何一个功能域；且不能受「时间戳总开关」门控 ——
 * 关了时间戳照样要能备份配置，否则想导出的人反而找不到入口。
 */
function registerConfigIO(plugin) {
  plugin.addCommand({
    id: 'time-tools-config-export',
    name: '导出配置（备份到库根目录）',
    callback: () => runExport(plugin),
  });
  plugin.addCommand({
    id: 'time-tools-config-import',
    name: '导入配置（粘贴 JSON 覆盖）',
    callback: () => runImport(plugin),
  });
}

module.exports = {
  exportConfig,
  importConfig,
  runExport,
  runImport,
  registerConfigIO,
  BACKUP_FILE,
};
