/*
 * 配置的导出备份与导入（v3.13 新增 configio.js）。
 *
 * 重点验证两件事：
 *   1. 导出到库根目录的**固定文件名**（覆盖式，不越攒越多）；
 *   2. 导入必须走 migrateSettings 白名单 —— 旧版本废弃键、非法值
 *      都不许被带进来（这是「废弃数据积累」最容易溜进来的入口）。
 */
'use strict';

const obsidian = require('obsidian');
const path = __dirname + '/../src/';
const { migrateSettings, SETTINGS_SCHEMA_VERSION } = require(path + 'settings.js');
const { exportConfig, importConfig, registerConfigIO, BACKUP_FILE } = require(path + 'configio.js');

global.__notices = [];
global.__modals = [];

let fail = 0;
let total = 0;
function check(name, cond, extra) {
  total += 1;
  if (cond) {
    console.log('  ✓ ' + name);
  } else {
    fail += 1;
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : ''));
  }
}

/** 假插件：settings 走真实迁移，vault.adapter 用普通对象当文件系统 */
function makePlugin(mutate) {
  const store = {};
  const settings = migrateSettings(null);
  if (mutate) mutate(settings);
  const plugin = {
    settings,
    saved: 0,
    addCommand() {},
    async saveSettings() {
      this.saved += 1;
    },
    redrawSettingsTab() {},
    app: {
      vault: {
        adapter: {
          async read(p) {
            if (!(p in store)) throw new Error('ENOENT');
            return store[p];
          },
          async write(p, d) {
            store[p] = d;
          },
        },
      },
    },
    _store: store,
  };
  return plugin;
}

(async () => {
  console.log('\n[1] 导出：写到库根目录的固定文件名');
  {
    const p = makePlugin((s) => {
      s.pomodoro.countUp = true;
    });
    const r = await exportConfig(p);
    check('导出成功', r.ok === true, JSON.stringify(r));
    check('写到了固定文件名（不是带时间戳的新文件）', r.path === BACKUP_FILE, r.path);
    const text = p._store[BACKUP_FILE];
    check('文件内容存在', typeof text === 'string');
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {}
    check('内容是合法 JSON', parsed !== null);
    check('内容带了改动后的值', parsed && parsed.pomodoro && parsed.pomodoro.countUp === true);
    // 再导出一次：仍应只有一个文件（覆盖，不累积）
    await exportConfig(p);
    check('重复导出不产生第二个文件', Object.keys(p._store).length === 1, Object.keys(p._store).join(','));
  }

  console.log('\n[2] 导入：合法配置被应用');
  {
    const p = makePlugin();
    const incoming = migrateSettings(null);
    incoming.pomodoro.countUpMaxMin = 90;
    incoming.pomodoro.countUp = true;
    const r = await importConfig(p, JSON.stringify(incoming));
    check('导入成功', r.ok === true, JSON.stringify(r));
    check('设置已生效', p.settings.pomodoro.countUpMaxMin === 90, p.settings.pomodoro.countUpMaxMin);
    check('已触发保存', p.saved === 1, p.saved);
  }

  console.log('\n[3] 导入：废弃键与非法值不许混进来（不积累脏数据）');
  {
    const p = makePlugin();
    const dirty = migrateSettings(null);
    dirty.fooBarDeprecated = 1; // 根本不存在的键
    dirty.pomodoro.countUpMaxMin = -5; // 类型对但值非法
    dirty.pomodoro.profiles = 'not-an-array'; // 类型错
    const r = await importConfig(p, JSON.stringify(dirty));
    check('导入仍成功（清洗后应用）', r.ok === true, JSON.stringify(r));
    check('废弃键没被带进来', p.settings.fooBarDeprecated === undefined, p.settings.fooBarDeprecated);
    check('非法值被回退为合法值', p.settings.pomodoro.countUpMaxMin >= 0, p.settings.pomodoro.countUpMaxMin);
    check('类型错的字段被修正成数组', Array.isArray(p.settings.pomodoro.profiles));
  }

  console.log('\n[4] 导入失败：必须报错且不动现有配置');
  {
    const p = makePlugin((s) => {
      s.pomodoro.countUpMaxMin = 42;
    });
    const before = JSON.stringify(p.settings);
    const r1 = await importConfig(p, '这不是 JSON');
    check('非 JSON 文本被拒绝', r1.ok === false && r1.reason === 'bad-json', JSON.stringify(r1));
    check('失败不改动现有配置', JSON.stringify(p.settings) === before);
    const r2 = await importConfig(p, '[1,2,3]');
    check('数组不是配置对象，被拒绝', r2.ok === false && r2.reason === 'not-object', JSON.stringify(r2));
    check('失败仍未改动配置', JSON.stringify(p.settings) === before);
    check('失败不触发保存', p.saved === 0, p.saved);
  }

  console.log('\n[5] 命令注册：两条，且不受时间戳总开关门控');
  {
    const ids = [];
    const p = makePlugin();
    p.addCommand = (o) => ids.push(o.id);
    registerConfigIO(p);
    check('注册了导出命令', ids.indexOf('time-tools-config-export') >= 0, ids.join(','));
    check('注册了导入命令', ids.indexOf('time-tools-config-import') >= 0, ids.join(','));
    check('只有两条（不多注册）', ids.length === 2, ids.length);
  }

  console.log('\n[6] 没有 vault 时导出要报错，不能静默');
  {
    const p = makePlugin();
    p.app = {};
    const r = await exportConfig(p);
    check('无 vault 时返回失败原因', r.ok === false && r.reason === 'no-vault', JSON.stringify(r));
  }

  console.log('\n[7] 配置结构版本号（schemaVersion）—— 迁移时不能被白名单清掉');
  {
    /*
     * migrateSettings 是逐个键 hand-pick 的白名单合并，顶层键漏写就会被清掉。
     * schemaVersion 若被清掉，将来「按版本搬值」就没有依据，
     * 只能靠「值是否等于默认值」去猜 —— 猜错就静默丢用户设置。
     * 这组断言把这个记录点钉住。
     */
    check('常量已导出', typeof SETTINGS_SCHEMA_VERSION === 'number', SETTINGS_SCHEMA_VERSION);
    const fresh = migrateSettings(null);
    check('全新配置带版本号', fresh.schemaVersion === SETTINGS_SCHEMA_VERSION, fresh.schemaVersion);
    const legacy = migrateSettings({ timestamp: { format: 'YYYY' }, uiLang: 'zh' });
    check('老配置（无版本键）迁移后升到当前版本',
      legacy.schemaVersion === SETTINGS_SCHEMA_VERSION, legacy.schemaVersion);
    const again = migrateSettings(legacy);
    check('二次迁移幂等：版本号不丢',
      again.schemaVersion === SETTINGS_SCHEMA_VERSION, again.schemaVersion);
    check('二次迁移幂等：整体一致',
      JSON.stringify(again) === JSON.stringify(legacy));
    // 导入是废弃数据最容易溜进来的入口，必须也保住版本号
    const p2 = { settings: migrateSettings(null), saved: 0, saveSettings: async function () { this.saved += 1; } };
    await importConfig(p2, JSON.stringify({ schemaVersion: 0, uiLang: 'en' }));
    check('导入后版本号为当前版本（不被清掉）',
      p2.settings.schemaVersion === SETTINGS_SCHEMA_VERSION, p2.settings.schemaVersion);
    check('导入的其它顶层项仍在', p2.settings.uiLang === 'en', p2.settings.uiLang);
  }

  console.log('\n' + (fail === 0 ? '✅ 全部通过' : '❌ 失败 ' + fail + ' 项') + '（共 ' + total + ' 项）');
  process.exit(fail === 0 ? 0 : 1);
})();
