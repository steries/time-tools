/*
 * 会话记录（番茄钟结束后写笔记 / 交 QuickAdd）
 *
 * 从 pomodoro.js 拆出：这一块只依赖 obsidian 与 settings.js 的模板常量，
 * 不碰计时状态、不碰 UI，单独成文件后番茄钟主体只剩计时与界面。
 *
 * ⚠️ 写文件是破坏性操作：目标已存在一律跳过，绝不覆盖。
 * ⚠️ QuickAdd 参数顺序必须查其源码确认（曾传反导致静默清空用户模板）。
 */

const obsidian = require('obsidian');
const { normalizePath } = require('obsidian');
const { t: i18nT, miscText } = require('./i18n.js');
/* confirmDialog 也在 settings.js：确认弹窗是设置层通用件，不在这里另写一份 */
const { DEFAULT_RECORD_TEMPLATE, confirmDialog } = require('./settings.js');

/*
 * 默认写入模板用 settings.js 的 DEFAULT_RECORD_TEMPLATE（本文件顶部已引入），
 * 不在这里另存副本，避免两处定义改了一处忘另一处。
 */

/*
 * ── 写入格式契约 ────────────────────────────────────────────────
 * 写入格式是隐式契约：统计解析（sumMinutes）、自定义位置统计、DataView 查询
 * 三方都依赖它写的字。改了写法而消费方没跟上，统计会静默变 0 —— 不报错、不提示。
 *
 * 所以这里把契约显式写出来，并由 _test/recordformat.js 做往返校验：
 *   写入侧 summaryLine() / dataviewLine() 产出的文本
 *   必须能被读取侧 sumMinutes() / DataView 解析回来，数值一致。
 *
 * 改写法时：改这里的 version，并跑 node _test/recordformat.js。
 * 往返校验红了 = 消费方没跟上，不许只改一边。
 */
const RECORD_FORMAT_VERSION = 1;

/**
 * 统计解析认的时长写法。必须能读回写入侧 fmtRecordDuration 产出的三种形态：
 *   「N 小时 M 分 S 秒」「M 分 S 秒」「S 秒」
 * 少了「小时」这一支，正计时跑过一小时、又开了「记录到秒」时，
 * 统计会静默丢掉整小时（实测「1 小时 0 分 0 秒」记成 0 分，且不报错）。
 */
const DURATION_RE = /(\d+)\s*小时\s*(?:(\d+)\s*分)?\s*(?:(\d+)\s*秒)?|(\d+)\s*分(?:钟)?\s*(?:(\d+)\s*秒)?|(\d+)\s*秒/g;

/** 文件名非法字符替换 */
function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .trim();
}

/**
 * 模板占位符替换。
 * {{skippedLine}} 在没有跳过时整行为空，最后统一压缩多余空行。
 */
function renderTemplate(tpl, data) {
  const map = {
    date: data.date,
    time: data.time,
    range: data.range,
    cycles: data.cycles,
    focus: data.focusMin,
    rest: data.restMin,
    // 带单位的时长文本，精度跟随「记录到秒」开关（{{focusText}} / {{restText}}）。
    // 老模板若只用 {{focus}}，得到的仍是整数分钟，语义不变。
    focusText: data.focusText || `${data.focusMin} 分钟`,
    restText: data.restText || `${data.restMin} 分钟`,
    pauses: data.pauses,
    longBreaks: data.longBreaks,
    profile: data.profileName,
  };

  const parts = [];
  if (data.skippedFocus) parts.push(`专注 ${data.skippedFocus} 段`);
  if (data.skippedBreak) parts.push(`休息 ${data.skippedBreak} 段`);
  const skippedLine = parts.length ? `- 跳过未计入：${parts.join(' · ')}` : '';

  return String(tpl || DEFAULT_RECORD_TEMPLATE)
    .replace(/\{\{skippedLine\}\}/g, skippedLine)
    .replace(/\{\{(\w+)\}\}/g, (m, key) => (map[key] !== undefined ? String(map[key]) : m))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 把内容插到笔记最上端；已有 frontmatter 时插在其后，避免破坏 YAML */
function insertAtTop(existing, block) {
  const trimmed = String(existing || '').replace(/\s+$/, '');
  if (!trimmed) return block + '\n';

  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(trimmed);
  if (m) {
    const rest = trimmed.slice(m[0].length).replace(/^\s+/, '');
    const head = m[0].replace(/\s*$/, '\n');
    return head + '\n' + block + '\n' + (rest ? '\n' + rest + '\n' : '');
  }
  return block + '\n\n' + trimmed + '\n';
}

/** DataView 插件 id（照 getQuickAdd 的取值方式，不凭名字造 API） */
const DATAVIEW_PLUGIN_ID = 'dataview';

/**
 * DataView 是否已安装并启用。
 * 只用于「开关开着但没装插件」时给个可见提示：字段照样会写进笔记，
 * 但用户查不到，不说清楚他只会觉得这功能没用。
 */
function hasDataview(app) {
  try {
    const plugins = app && app.plugins && app.plugins.plugins;
    return !!(plugins && plugins[DATAVIEW_PLUGIN_ID]);
  } catch (e) {
    return false;
  }
}

/** 取 QuickAdd 插件实例 */
function getQuickAdd(app) {
  const plugins = app.plugins && app.plugins.plugins;
  return plugins ? plugins['quickadd'] : null;
}

/**
 * 收集 QuickAdd 里的选项名，含嵌套项。
 * QuickAdd 的 Multi 里能塞子选项、Macro 里能嵌 NestedChoice，
 * 只读顶层会漏掉它们，导致明明存在的选项被误判成「找不到」。
 * 返回 { names, nestedCount }；names 去重后按原顺序排列。
 */
function collectChoiceNames(data) {
  const names = [];
  let nestedCount = 0;
  const seen = new Set();

  const push = (name, nested) => {
    if (!name) return;
    const key = String(name);
    if (seen.has(key)) return;
    seen.add(key);
    names.push(key);
    if (nested) nestedCount += 1;
  };

  // 递归一个选项及其子选项
  const walk = (choice, nested) => {
    if (!choice || typeof choice !== 'object') return;
    push(choice.name, nested);
    // Multi：子选项挂在 choices 上
    if (Array.isArray(choice.choices)) {
      choice.choices.forEach((c) => walk(c, true));
    }
    // Macro 里的 NestedChoice：真实选项藏在 command.choice 里
    if (Array.isArray(choice.commands)) {
      choice.commands.forEach((cmd) => {
        if (!cmd || typeof cmd !== 'object') return;
        if (cmd.type === 'NestedChoice' && cmd.choice) walk(cmd.choice, true);
        else push(cmd.name, true);
      });
    }
  };

  if (data && Array.isArray(data.choices)) {
    data.choices.forEach((c) => walk(c, false));
  }

  // Macro 定义单独存在 macros 里，按 id 反查能补上更多名字
  if (data && Array.isArray(data.macros)) {
    data.macros.forEach((m) => {
      if (!m || !Array.isArray(m.commands)) return;
      m.commands.forEach((cmd) => {
        if (cmd && cmd.type === 'NestedChoice' && cmd.choice) walk(cmd.choice, true);
      });
    });
  }

  return { names, nestedCount };
}

/**
 * 列出 QuickAdd 已配置的选项名。
 * 优先读插件自己的 data.json（覆盖最广），取不到再试 api 上的列表方法。
 * 返回 null 表示拿不到列表，此时不做名称校验，避免误报。
 */
async function listQuickAddChoices(app) {
  const qa = getQuickAdd(app);
  if (!qa) return null;

  // 来源一：插件配置（含嵌套）
  try {
    if (typeof qa.loadData === 'function') {
      const data = await qa.loadData();
      const r = collectChoiceNames(data);
      if (r.names.length) return r;
    }
  } catch (e) {
    /* 读不到就走下一条路 */
  }

  // 来源二：插件暴露的列表接口（通常只有顶层）
  try {
    const api = qa.api;
    const fn = api && (api.getChoices || api.getChoiceList);
    if (typeof fn === 'function') {
      const list = await fn.call(api);
      const r = collectChoiceNames({ choices: Array.isArray(list) ? list : [] });
      if (r.names.length) return r;
    }
  } catch (e) {
    /* 忽略 */
  }

  return null;
}

/** 一句话摘要，作为 {{VALUE}} 传入，让裸 {{VALUE}} 的 Capture 也能拿到内容 */
function summaryLine(data) {
  const parts = [
    `完成 ${data.cycles} 轮`,
    `专注 ${data.focusText || `${data.focusMin} 分钟`}`,
    `休息 ${data.restText || `${data.restMin} 分钟`}`,
    `暂停 ${data.pauses} 次`,
  ];
  if (data.longBreaks) parts.push(`长休息 ${data.longBreaks} 次`);
  let line = '🍅 ' + parts.join(' · ');
  if (data.range) line += `（${data.range}）`;
  return line;
}

/** 复制到剪贴板；失败返回 false */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // 兜底：用隐藏 textarea + execCommand
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch (e) {
    return false;
  }
}

class Recorder {
  constructor(plugin) {
    this.plugin = plugin;
  }

  get settings() {
    return this.plugin.settings.record;
  }

  get app() {
    return this.plugin.app;
  }

  /** 是否可用：总开关打开才算启用 */
  get enabled() {
    return !!this.settings.enabled;
  }

  /** 按模板生成一段记录文本 */
  buildContent(data) {
    const body = renderTemplate(this.settings.template, data);
    /*
     * DataView 联动（默认关）：开关打开时才在末尾追加一行内联字段。
     * 传的是完整 settings（不是 record 子对象），dataviewLine 内部自己取 pomodoro。
     */
    const dv = dataviewLine(this.plugin && this.plugin.settings, data);
    return dv ? `${body}\n${dv}` : body;
  }

  /** 解析目标笔记路径，含可选文件夹 */
  resolvePath(noteName) {
    const folder = normalizePath(this.settings.folder);
    const name = sanitizeFileName(noteName) || '番茄记录';
    return folder ? `${folder}/${name}.md` : `${name}.md`;
  }

  /** 内置写入：笔记不存在则新建（含父文件夹），内容写在最上端 */
  async writeToNote(noteName, data) {
    const vault = this.app.vault;
    const path = this.resolvePath(noteName);

    let file = vault.getAbstractFileByPath(path);
    if (!file) {
      const idx = path.lastIndexOf('/');
      const folder = idx === -1 ? '' : path.slice(0, idx);
      if (folder && !vault.getAbstractFileByPath(folder)) {
        await vault.createFolder(folder);
      }
      file = await vault.create(path, '');
    }

    const existing = await vault.read(file);
    await vault.modify(file, insertAtTop(existing, this.buildContent(data)));
    new obsidian.Notice(i18nT('k1906acec', '已写入 {0}', path));
    return path;
  }

  getQuickAdd() {
    return getQuickAdd(this.app);
  }

  /** 组装传给 QuickAdd 的变量；value 对应裸 {{VALUE}}，其余为具名变量 */
  buildQuickAddVars(data) {
    return {
      value: summaryLine(data), // {{VALUE}}
      date: data.date,
      time: data.time,
      range: data.range,
      cycles: data.cycles,
      focus: data.focusMin,
      rest: data.restMin,
      focusText: data.focusText || `${data.focusMin} 分钟`,
      restText: data.restText || `${data.restMin} 分钟`,
      pauses: data.pauses,
      longBreaks: data.longBreaks,
      skippedFocus: data.skippedFocus,
      skippedBreak: data.skippedBreak,
      profile: data.profileName,
      content: this.buildContent(data), // 完整模板文本，便于直接插入
    };
  }

  /**
   * 执行 QuickAdd 选项。
   * 返回 { ok, reason, message }，reason 用于给用户精确提示，
   * 不再笼统报「不可用」，以便区分是配置问题还是插件问题。
   */
  async runQuickAdd(data) {
    const name = String(this.settings.quickAddChoice || '').trim();

    if (!name) return { ok: false, reason: 'no-name', message: '未填写 QuickAdd 选项名' };

    const qa = this.getQuickAdd();
    if (!qa) return { ok: false, reason: 'no-plugin', message: '未检测到 QuickAdd 插件（可能未安装或未启用）' };

    const api = qa.api;
    if (!api || typeof api.executeChoice !== 'function') {
      return { ok: false, reason: 'no-api', message: 'QuickAdd 未暴露 executeChoice 接口，请更新 QuickAdd 到新版本' };
    }

    // 名称校验：列表可能不含嵌套选项，故默认只提示不阻止
    const list = await listQuickAddChoices(this.app);
    const names = list ? list.names : [];
    const missing = names.length > 0 && names.indexOf(name) === -1;

    if (missing && this.settings.strictChoiceName) {
      return {
        ok: false,
        reason: 'not-found',
        message: `找不到选项「${name}」。列表里有：${names.join('、')}`,
      };
    }

    try {
      await api.executeChoice(name, this.buildQuickAddVars(data));
      return { ok: true };
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);

      // 列表里确实没有这个名字时，优先判定为「名字不对」
      if (missing) {
        return {
          ok: false,
          reason: 'not-found',
          message:
            `找不到选项「${name}」（${msg}）。列表里有：${names.join('、')}` +
            `。请从「选择已有选项」里挑，或关闭严格校验后重试。`,
        };
      }
      return { ok: false, reason: 'error', message: `执行出错：${msg}` };
    }
  }

  /** 设置页「测试执行」用：拿一组示例数据真跑一次，便于排查配置 */
  async testQuickAdd() {
    const now = Date.now();
    const m = obsidian.moment(now);
    return this.runQuickAdd({
      date: m.format('YYYY-MM-DD'),
      time: m.format('HH:mm'),
      range: `${m.format('HH:mm')} – ${m.format('HH:mm')}`,
      cycles: 2,
      focusMin: 50,
      restMin: 10,
      pauses: 1,
      longBreaks: 0,
      skippedFocus: 0,
      skippedBreak: 0,
      /*
       * 方案名取自当前生效方案本身，不写死某个名字。
       * 旧写法读 settings.pomodoro.activeProfile —— 那个键并不存在
       * （activeProfile 是控制器上的 getter，不是配置项），
       * 结果恒为 undefined，方案名永远落到一个写死的兜底串。
       */
      profileName: (function (s) {
        const p = (s.profiles || []).find((it) => it.id === s.activeProfileId)
          || (s.profiles || [])[0];
        return p && p.name ? p.name : '';
      })(this.plugin.settings.pomodoro),
    });
  }

  /** 仅复制到剪贴板：结果文本进剪贴板，不碰任何文件 */
  async copyToClipboard(data) {
    const text = this.buildContent(data);
    const ok = await copyToClipboard(text);
    new obsidian.Notice(
      ok ? i18nT('k332e615a', '🍅 结果已复制，Ctrl+V 即可插入') : i18nT('k4d7c45ad', '复制失败，请检查剪贴板权限'),
      5000
    );
    return ok;
  }

  /**
   * 统一入口：按模式分发。
   * QuickAdd 失败时回退内置写入，保证这条记录不丢。
   */
  async record(data, noteName) {
    // 总开关关闭时一律不写：会写文件的入口很多，闸门放在最里面才不会漏
    if (!this.settings.enabled) return null;

    // 仅剪贴板模式：不写文件，复制完就结束
    if (this.settings.mode === 'clipboard') {
      await this.copyToClipboard(data);
      return null;
    }

    if (this.settings.mode === 'quickadd') {
      // 先复制到剪贴板：QuickAdd 若仍弹输入框，直接 Ctrl+V 就能填
      if (this.settings.copyBeforeQuickAdd) await this.copyToClipboard(data);

      const r = await this.runQuickAdd(data);
      if (r.ok) {
        new obsidian.Notice(i18nT('kba5a9f60', '已执行 QuickAdd：{0}', this.settings.quickAddChoice));
        return null;
      }

      // 联动失败：按开关决定是回退内置写入，还是直接放弃
      if (!this.settings.fallbackToBuiltin) {
        new obsidian.Notice(i18nT('k5dd85e03', 'QuickAdd {0}；未记录（回退已关闭）', r.message), 8000);
        return null;
      }
      new obsidian.Notice(i18nT('ke9c6af0f', 'QuickAdd {0}；已改用内置写入', r.message), 8000);
    }

    return this.writeToNote(noteName || this.settings.defaultNoteName, data);
  }
}

/**
 * 关闭「会话记录」总开关前的二次确认。
 * 必须把关闭后的后果写全，否则用户不知道自己关掉了什么。
 */
function confirmDisableRecord(plugin, s) {
  const lines = [
    i18nT('kfdb7d349', '· 番茄结束不再自动记录'),
    i18nT('kbefe0380', '· 结束弹窗不再显示「记录」按钮'),
    i18nT('k2d8ea554', '· 下方的记录设置会折叠收起'),
    '',
    i18nT('k90ad143e', '已经写进笔记的记录不受影响；各项设置的值也会保留，重新打开总开关即可恢复。'),
  ];
  return confirmDialog(plugin, {
    title: i18nT('k6ee49b67', '确定关闭会话记录？'),
    content: i18nT('k4699ce36', '关闭后将：\n\n') + lines.join('\n'),
    okText: i18nT('k44962493', '仍然关闭'),
    warning: true,
  });
}

/** 渲染「记录」设置页内容 */
function renderRecordSettings(containerEl, plugin) {
  const s = plugin.settings.record;
  containerEl.createEl('h3', { text: i18nT('kd40b0a0f', '会话记录') });
  containerEl.createDiv({
    cls: 'pomo-tip',
    text: i18nT('k8e085b92', '番茄结束后把本次结果写进笔记，或交给 QuickAdd 处理。'),
  });

  /*
   * 总开关：位置固定在会话记录区第一行，折叠只影响它下面的设置，它自己不动。
   * 关它要二次确认 —— 一键关掉一整块功能，误点的代价太大。
   */
  const master = new obsidian.Setting(containerEl)
    .setName(i18nT('ke9b2e308', '启用会话记录'))
    .setDesc(i18nT('ke5c4bf9f', "总开关。关闭时完全不记录，结束弹窗里也不显示「记录」按钮，下方记录设置会折叠收起。"))
    .addToggle((t) =>
      t.setValue(s.enabled).onChange(async (v) => {
        if (!v) {
          const ok = await confirmDisableRecord(plugin, s);
          // 取消：开关弹回开启，不改设置
          if (!ok) { t.setValue(true); return; }
        }
        s.enabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );
  // 与上方内容拉开距离并加一条分隔线，避免连点时误触
  master.settingEl.addClass('pomo-record-master');

  /*
   * 总开关关闭：下方所有记录设置收进折叠区，默认收起。
   * 只是藏起来，一个值都不改 —— 重新打开总开关即原样恢复。
   */
  let body = containerEl;
  if (!s.enabled) {
    const fold = containerEl.createEl('details', { cls: 'pomo-fold' });
    fold.createEl('summary', { text: i18nT('k9ce003cb', '记录设置（已关闭，点此展开查看）') });
    fold.createDiv({
      cls: 'pomo-tip',
      text: i18nT('k16e7dbf8', '总开关关闭中：以下设置暂不生效，但数值都保留着，重新打开总开关即可恢复。'),
    });
    body = fold;
  }

  // 是否自动记录：开启自动执行，关闭则只在点「记录」时写
  new obsidian.Setting(body)
    .setName(i18nT('kd7eabbe2', '是否自动记录'))
    .setDesc(i18nT('k20fea307', '开启：番茄结束时自动记录。关闭：只有手动点结束弹窗里的「记录」才记录。'))
    .addToggle((t) =>
      t.setValue(s.autoRecord).onChange(async (v) => {
        s.autoRecord = v;
        await plugin.saveSettings();
      })
    );

  // 记录精度：分钟（默认）还是精确到秒
  new obsidian.Setting(body)
    .setName(i18nT('k20fa0a06', '记录到秒'))
    .setDesc(i18nT('ka3226c87', "关闭（默认）：时长按分钟记录，秒位直接舍去，如「专注 25 分钟」。打开：记到秒，如「专注 25 分 30 秒」。正计时与倒计时共用此开关。"))
    .addToggle((t) =>
      t.setValue(s.recordSeconds).onChange(async (v) => {
        s.recordSeconds = v;
        await plugin.saveSettings();
      })
    );

  // 写入方式
  new obsidian.Setting(body)
    .setName(i18nT('kd3b0ddff', '写入方式'))
    .setDesc(i18nT('k649cc2f2', '内置写入：写进指定笔记最上端。联动 QuickAdd：交给 QuickAdd 选项。仅剪贴板：复制结果，自行 Ctrl+V。')
    )
    .addDropdown((d) =>
      d
        .addOption('builtin', i18nT('kec647d2e', '内置写入'))
        .addOption('quickadd', i18nT('k34f0a08a', '联动 QuickAdd'))
        .addOption('clipboard', i18nT('kabe85d5b', '仅复制到剪贴板'))
        .setValue(s.mode)
        .onChange(async (v) => {
          s.mode = v;
          await plugin.saveSettings();
          plugin.redrawSettingsTab();
        })
    );

  // 仅剪贴板模式：其余写入设置不需要
  if (s.mode === 'clipboard') {
    body
      .createDiv({ cls: 'pomo-tip' })
      .setText(i18nT('ka9056760', '番茄结束时把结果文本复制进剪贴板，你在任何笔记里 Ctrl+V 即可插入。'));
  }

  if (s.mode === 'builtin') {
    /* ---- 内置写入 ---- */
    body.createEl('h3', { text: i18nT('ka2c8ab04', '内置写入') });

    new obsidian.Setting(body)
      .setName(i18nT('k7d3a534f', '默认笔记名'))
      .setDesc(i18nT('kaa413c0f', '结束弹窗里预填这个名字，可临时改成别的。'))
      .addText((t) =>
        t
          .setPlaceholder(i18nT('k36829df4', '番茄记录'))
          .setValue(s.defaultNoteName)
          .onChange(async (v) => {
            s.defaultNoteName = v.trim() || '番茄记录';
            await plugin.saveSettings();
          })
      );

    new obsidian.Setting(body)
      .setName(i18nT('k17b4670e', '存放文件夹'))
      .setDesc(i18nT('kc9d36099', '可选。填库内文件夹路径，留空则放在库根目录。'))
      .addText((t) =>
        t
          .setPlaceholder(i18nT('k72c41c0e', '例如：番茄记录'))
          .setValue(s.folder)
          .onChange(async (v) => {
            s.folder = v.trim().replace(/^\/+|\/+$/g, '');
            await plugin.saveSettings();
          })
      );

    new obsidian.Setting(body)
      .setName(i18nT('k9d6b52a2', '写入模板'))
      .setDesc(i18nT('ked22713c', "占位符：{{date}} {{time}} {{range}} {{cycles}} {{focus}} {{rest}} {{focusText}} {{restText}} {{pauses}} {{longBreaks}} {{profile}} {{skippedLine}}。{{focus}}/{{rest}} 是整数分钟，不随精度开关变化；{{focusText}}/{{restText}} 自带单位，精度跟随上面的「记录到秒」开关。想让开关生效，模板里要用 {{focusText}}（默认模板已是）；若你自定义过模板且写的是「{{focus}} 分钟」，改成 {{focusText}} 即可 —— 注意去掉后面的「分钟」二字，否则会渲染成「25 分 30 秒 分钟」。默认模板为中文，如需英文请自行改写；写入笔记的内容不会被翻译。"))
      .addTextArea((t) =>
        t.setValue(s.template).onChange(async (v) => {
          s.template = v;
          await plugin.saveSettings();
        })
      );

    body
      .createDiv({ cls: 'pomo-tip' })
      .setText(i18nT('k01dc8de8', '记录会插在笔记最上端；若笔记已有 frontmatter，则插在 frontmatter 之后。'));
    return;
  }

  /* ---- 联动 QuickAdd ---- */
  body.createEl('h3', { text: i18nT('k447d4a75', '联动 QuickAdd') });

  const qa = plugin.app.plugins && plugin.app.plugins.plugins && plugin.app.plugins.plugins['quickadd'];
  const detected = !!(qa && qa.api && typeof qa.api.executeChoice === 'function');
  body
    .createDiv({ cls: 'pomo-tip' })
    .setText(
      detected
        ? i18nT('k2545a4fc', '已检测到 QuickAdd 插件，可直接填写选项名。')
        : i18nT('ka65d0706', '未检测到 QuickAdd 插件。请先安装并启用，否则会回退为内置写入。')
    );

  // 可用选项：取得到就出下拉，取不到只有输入框
  const choiceWrap = body.createDiv();

  const fillChoices = async () => {
    choiceWrap.empty();
    const list = await listQuickAddChoices(plugin.app);
    const names = list ? list.names : [];

    // 输入框组件引用，供下拉选中后同步显示（避免整页重绘把输入冲掉）
    let textComp = null;

    if (names.length) {
      /*
       * extra 是拼出来的中文常量，作为 {1} 插进**已翻译**的英文串 ——
       * 错的是实参不是条目，所以必须在这里包，别去改 k60245dcf。
       */
      const extra = list.nestedCount
        ? i18nT('qa.nestedExtra', `（含 ${list.nestedCount} 个嵌套子选项）`, list.nestedCount)
        : '';
      new obsidian.Setting(choiceWrap)
        .setName(i18nT('ke7e129e6', '选择已有选项'))
        .setDesc(i18nT('k60245dcf', `从 QuickAdd 已配置的选项里挑一个，共 ${names.length} 个${extra}。`, names.length, extra))
        .addDropdown((d) => {
          names.forEach((n) => d.addOption(n, n));
          // 当前值不在列表里时补一个占位项，否则 Obsidian 会把下拉清空、
          // 看起来就像「选了没保存」
          if (s.quickAddChoice && names.indexOf(s.quickAddChoice) === -1) {
            d.addOption(s.quickAddChoice, s.quickAddChoice + i18nT('kd491d2eb', '（手填，不在列表中）'));
          }
          if (s.quickAddChoice) d.setValue(s.quickAddChoice);
          d.onChange(async (v) => {
            s.quickAddChoice = v;
            // 先同步输入框再落盘，界面立刻有反馈，不等异步
            if (textComp) textComp.setValue(v);
            await plugin.saveSettings();
          });
        });
    } else if (detected) {
      choiceWrap
        .createDiv({ cls: 'pomo-record-hint' })
        .setText(i18nT('kff91e157', '没能读取到选项列表，请直接在下方手填名称，必须与 QuickAdd 里的选项名完全一致。'));
    }

    new obsidian.Setting(choiceWrap)
      .setName(i18nT('k369f7b53', '选项名'))
      .setDesc(i18nT('k9774707e', '必须与 QuickAdd 里显示的选项名一致。改完点旁边的刷新可重新读取列表。'))
      .addText((t) => {
        textComp = t;
        return t
          .setPlaceholder(i18nT('k1228d763', '例如：番茄钟写入'))
          .setValue(s.quickAddChoice)
          .onChange(async (v) => {
            s.quickAddChoice = v.trim();
            await plugin.saveSettings();
          });
      })
      .addButton((b) =>
        b.setButtonText(i18nT('k93bc1f09', '刷新列表')).onClick(async () => {
          await fillChoices();
        })
      );

    // 严格校验：默认关闭，避免列表读不全时误判
    new obsidian.Setting(choiceWrap)
      .setName(i18nT('k3a068994', '严格校验选项名'))
      .setDesc(i18nT('k81fc017e', "开启后选项名不在列表就拒绝执行并提示可用选项。列表可能不含嵌套选项，建议关闭。"))
      .addToggle((t) =>
        t.setValue(s.strictChoiceName).onChange(async (v) => {
          s.strictChoiceName = v;
          await plugin.saveSettings();
        })
      );

    // 联动失败时的兜底策略
    new obsidian.Setting(choiceWrap)
      .setName(i18nT('k9827fdaa', '联动失败时改用内置写入'))
      .setDesc(i18nT('k56b8e012', "开启：QuickAdd 用不了就自动写进笔记，不丢记录。关闭：失败就不记录，避免写脏笔记。"))
      .addToggle((t) =>
        t.setValue(s.fallbackToBuiltin).onChange(async (v) => {
          s.fallbackToBuiltin = v;
          await plugin.saveSettings();
        })
      );

    // 执行前先复制到剪贴板：QuickAdd 若仍弹输入框，直接 Ctrl+V 即可
    new obsidian.Setting(choiceWrap)
      .setName(i18nT('k4202a475', '执行前复制到剪贴板'))
      .setDesc(i18nT('k688eff37', '调用 QuickAdd 之前先把结果放进剪贴板；若它仍弹输入框，Ctrl+V 就能填上。'))
      .addToggle((t) =>
        t.setValue(s.copyBeforeQuickAdd).onChange(async (v) => {
          s.copyBeforeQuickAdd = v;
          await plugin.saveSettings();
        })
      );

    // 一键复制变量串，粘进 QuickAdd 的 Format 里就能自动带数据
    new obsidian.Setting(choiceWrap)
      .setName(i18nT('kacf03fb2', '复制变量串'))
      .setDesc(i18nT('kfad06f30', '点一下复制 {{VALUE}}，粘到 Capture 的 Format 里即可自动填入本次结果。'))
      .addButton((b) =>
        b.setButtonText(i18nT('k72a75f35', '复制 {{VALUE}}')).onClick(async () => {
          const ok = await copyToClipboard('{{VALUE}}');
          new obsidian.Notice(ok ? i18nT('k999073d1', '已复制 {{VALUE}}') : i18nT('k5154ae17', '复制失败'));
        })
      );

    // 测试执行：立刻真跑一次，用来区分是配置问题还是插件问题
    new obsidian.Setting(choiceWrap)
      .setName(i18nT('kf5744906', '测试执行'))
      .setDesc(i18nT('kfaf9021a', '用一组示例数据立即执行一次，失败会明确告诉原因。'))
      .addButton((b) =>
        b.setButtonText(i18nT('k1a6aa24e', '执行')).onClick(async () => {
          const r = await plugin.recorder.testQuickAdd();
          new obsidian.Notice(r.ok ? i18nT('k23822f6a', '✅ QuickAdd 执行成功') : i18nT('k5ea68de1', '❌ {0}', r.message), 10000);
        })
      );
  };
  fillChoices();

  body.createEl('h3', { text: i18nT('k5fce7533', '可用变量') });
  const table = body.createEl('table', { cls: 'pomo-help-table' });
  const rows = [
    ['{{VALUE}}', '一行摘要（Capture 可直接用）'],
    ['{{VALUE:content}}', '按内置模板生成的完整文本'],
    ['{{VALUE:date}}', '日期'],
    ['{{VALUE:time}}', '结束时间'],
    ['{{VALUE:range}}', '起止时间段'],
    ['{{VALUE:cycles}}', '完成的轮数'],
    ['{{VALUE:focus}}', '专注总分钟'],
    ['{{VALUE:rest}}', '休息总分钟'],
    ['{{VALUE:focusText}}', '专注时长，带单位；精度跟随「记录到秒」'],
    ['{{VALUE:restText}}', '休息时长，带单位；精度同上'],
    ['{{VALUE:pauses}}', '暂停次数'],
    ['{{VALUE:longBreaks}}', '长休息次数'],
    ['{{VALUE:skippedFocus}}', '跳过未计入的专注段数'],
    ['{{VALUE:skippedBreak}}', '跳过未计入的休息段数'],
    ['{{VALUE:profile}}', '使用的时长方案'],
  ];
  rows.forEach(([token, desc]) => {
    const tr = table.createEl('tr');
    tr.createEl('td').createEl('code', { text: token });
    tr.createEl('td', { text: miscText('recVar', token, desc) });
  });

  body
    .createDiv({ cls: 'pomo-tip' })
    .setText(
      i18nT('k68cc7527', '在 Capture 的 Format 里用 {{VALUE}} 或上面的具名变量即可。') +
        i18nT('k7bed1f32', '注意：Template 类型的选项会把 {{VALUE}} 当作新笔记的文件名，那种场景请用具名变量。')
    );
}

/* ------------------------------------------------------------------ *
 * 累计统计（v3.13）
 * ------------------------------------------------------------------ */

/**
 * 把一次会话的专注时长累加进内存统计（仅 statsSource === 'memory' 时调用）。
 *
 * 「不积累废弃数据」：只写固定 4 个字段，不按日期堆条目。
 * 跨天时把「今日」归零再重新累计 —— 否则 todayFocusMs 会变成历史总和，
 * 名字叫「今日」却是累计值，那是会骗人的数据。
 *
 * @param {object} settings 完整 settings（会就地写 settings.pomodoro.statsMemory）
 * @param {number} focusMs  本次会话的专注毫秒
 */
function accumulateStats(settings, focusMs) {
  const p = settings && settings.pomodoro;
  if (!p || p.statsSource !== 'memory') return false;
  const sm = p.statsMemory || {};
  const today = obsidian.moment().format('YYYY-MM-DD');
  if (sm.todayDate !== today) {
    sm.todayDate = today;
    sm.todayFocusMs = 0;
  }
  /*
   * 这里必须用 `|| 0` 兜底：首次记账时字段还不存在，Number(undefined) 是 NaN，
   * NaN 一旦写进去就会传染 —— 之后每次累加都是 NaN，整个统计永久失效。
   * 「今日」那条侥幸没踩到，是因为跨天分支先把它初始化成了 0。
   */
  const add = Math.max(0, Number(focusMs) || 0);
  sm.todayFocusMs = (Number(sm.todayFocusMs) || 0) + add;
  sm.totalFocusMs = (Number(sm.totalFocusMs) || 0) + add;
  sm.sessions = (Number(sm.sessions) || 0) + 1;
  p.statsMemory = sm;
  return true;
}

const fmtDur = (ms) => {
  const m = Math.floor(Math.max(0, ms) / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h} 小时 ${mm} 分钟` : `${mm} 分钟`;
};

/**
 * 从一段笔记正文里累加出「N 分钟」的总和。
 *
 * 同时认 DataView 内联字段（专注时长:: 25 分钟）与普通写法（专注 25 分钟），
 * 因为开了 DataView 联动后两种都会出现。认不出来返回 0，由调用方决定怎么提示。
 */
function sumMinutes(text) {
  // 用 DURATION_RE 而不是就地写正则：写入侧与读取侧共用同一份定义。
  // 模块级 /g 正则的 lastIndex 会跨调用残留，必须先归零。
  DURATION_RE.lastIndex = 0;
  const hits = [];
  let m;
  while ((m = DURATION_RE.exec(String(text || '')))) hits.push(m);
  let total = 0;
  for (let i = 0; i < hits.length; i++) {
    const g = hits[i];
    const h = g[1] === undefined ? 0 : parseInt(g[1], 10);
    const mi = g[2] === undefined ? (g[4] === undefined ? 0 : parseInt(g[4], 10)) : parseInt(g[2], 10);
    const s = g[3] === undefined
      ? (g[5] === undefined ? (g[6] === undefined ? 0 : parseInt(g[6], 10)) : parseInt(g[5], 10))
      : parseInt(g[3], 10);
    if (isFinite(h) && isFinite(mi) && isFinite(s)) total += h * 60 + mi + s / 60;
  }
  return Math.round(total);
}

/** DataView 字段表可用的变量，键名即 {{VALUE:键名}} 里填的东西 */
const DV_VARS = {
  date: (d) => d.date,
  time: (d) => d.time,
  range: (d) => d.range,
  cycles: (d) => d.cycles,
  focus: (d) => d.focusMin,
  rest: (d) => d.restMin,
  restText: (d) => (d.restMin == null ? '' : d.restText || `${d.restMin} 分钟`),
  pauses: (d) => d.pauses,
  longBreaks: (d) => d.longBreaks,
  skippedFocus: (d) => d.skippedFocus,
  skippedBreak: (d) => d.skippedBreak,
  profile: (d) => d.profileName,
};

/** 取字段表里的变量值；没有或取不到一律返回空串（该行整行跳过，不写半截） */
function resolveDvVar(data, name) {
  const d = data || {};
  if (name === 'focusText') {
    if (d.focusText) return String(d.focusText);
    // 没有专注时长就不能写「undefined 分钟」——整行跳过
    return d.focusMin == null ? '' : `${d.focusMin} 分钟`;
  }
  if (name === 'focus') {
    return d.focusMin == null ? '' : String(d.focusMin);
  }
  const f = DV_VARS[name];
  if (!f) return '';
  const v = f(d);
  return v == null ? '' : String(v);
}

/**
 * DataView 联动：开关打开时按用户自己写的字段表追加内联字段，关着返回空串。
 *
 * 字段表一行一个，格式 `字段名::{{VALUE:变量名}}`，变量见 DV_VARS。
 * 默认只写「专注时长」一行；要记什么由用户自己加行，不替他决定。
 * 只追加到正文末尾，不改动既有结构 —— 关掉开关就当它不存在。
 * 「不积累废弃数据」：不额外生成任何按日期堆的条目。
 */
function dataviewLine(settings, vars) {
  const p = settings && settings.pomodoro;
  if (!p || p.dataviewEnabled !== true) return '';
  // 老配置没有这个键（v3.14 之前联动写死一行），按默认表走，保持原有行为
  const raw =
    typeof p.dataviewFields === 'string' ? p.dataviewFields : '专注时长::{{VALUE:focusText}}';
  const out = [];
  raw.split('\n').forEach((lineRaw) => {
    const line = String(lineRaw || '').trim();
    if (!line) return;
    const m = line.match(/^([^:]+)::\s*\{\{VALUE:([A-Za-z0-9_]+)\}\}\s*$/);
    if (!m) return; // 格式不对的整行跳过，不写个空字段出来
    const label = m[1].trim();
    const val = resolveDvVar(vars, m[2]);
    // 多行值会把内联字段写坏（dataview 只认到行尾），宁可不写
    if (!label || !val || val.indexOf('\n') >= 0) return;
    out.push(`${label}:: ${val}`);
  });
  return out.length ? out.join('\n') + '\n' : '';
}

/**
 * 统计视图命令的执行体：按用户选的数据源给出今日 / 累计。
 *
 * 'note' 源要解析会话记录笔记，依赖写入格式；解析不出就明确说「没读到」，
 * 绝不拿 0 冒充（静默给 0 会让人以为自己没专注过）。
 */
async function showStats(plugin) {
  const p = plugin && plugin.settings && plugin.settings.pomodoro;
  const src = (p && p.statsSource) || 'off';
  if (src === 'off') {
    new obsidian.Notice(i18nT('kd80b67d3', '累计统计当前关闭。设置 → 番茄钟 →「累计统计数据源」可切换为「解析笔记」或「本机累计」。'));
    return { ok: false, reason: 'off' };
  }
  if (src === 'memory') {
    const sm = (p && p.statsMemory) || {};
    const today = obsidian.moment().format('YYYY-MM-DD');
    const t = sm.todayDate === today ? Number(sm.todayFocusMs) : 0;
    new obsidian.Notice(i18nT('kec519522', '📊 今日专注 {0}　｜　累计 {1}　｜　 {2} 次会话', fmtDur(t), fmtDur(Number(sm.totalFocusMs)), Number(sm.sessions) || 0));
    return { ok: true, source: 'memory' };
  }
  if (src === 'custom') {
    return await readCustomStats(plugin);
  }
  // 'note'：扫描会话记录笔记里的时长
  try {
    const vault = plugin.app && plugin.app.vault;
    const rec = (p && p.record) || {};
    const path = rec.notePath || '';
    const file = vault && path ? vault.getAbstractFileByPath(path) : null;
    if (!file) {
      new obsidian.Notice(i18nT('k1c2772ff', '没找到会话记录笔记（数据源＝解析笔记）。请确认记录笔记路径设置正确。'));
      return { ok: false, reason: 'no-note' };
    }
    const text = await vault.cachedRead(file);
    const total = sumMinutes(text);
    new obsidian.Notice(i18nT('k2bf6a4c6', '📊 从记录笔记读到约 {0}（按笔记中「N 分钟」累加，格式改过会读不准）', fmtDur(total * 60000)));
    return { ok: true, source: 'note', minutes: total };
  } catch (e) {
    new obsidian.Notice(i18nT('ka91ddb73', '读取会话记录笔记失败，统计未生成。'));
    return { ok: false, reason: 'read-failed' };
  }
}

/**
 * 数据源＝「自定义位置」的读取体。
 *
 * statsCustomPath 可以是一个 .md 笔记，也可以是一个文件夹：
 * 文件夹时用 vault.getFiles() 按前缀过滤（不猜测 TFolder 的遍历 API），
 * 只取该文件夹下的 .md，不递归子层之外的东西，避免扫到无关笔记。
 */
async function readCustomStats(plugin) {
  const p = plugin && plugin.settings && plugin.settings.pomodoro;
  const path = normalizePath((p && p.statsCustomPath) || '');
  if (!path) {
    new obsidian.Notice(i18nT('kf6764e61', '数据源＝自定义位置，但没填路径。设置 → 番茄钟 →「自定义统计位置」。'));
    return { ok: false, reason: 'empty-path' };
  }
  const vault = plugin.app && plugin.app.vault;
  if (!vault) return { ok: false, reason: 'no-vault' };
  try {
    const one = vault.getAbstractFileByPath(path);
    let files = [];
    if (one && one.extension === 'md') {
      files = [one];
    } else {
      // 文件夹：按前缀取该目录下的 md。getFiles() 是稳定 API，不依赖目录遍历实现。
      const prefix = path + '/';
      files = vault.getFiles().filter((f) => f.path.startsWith(prefix) && f.extension === 'md');
    }
    if (!files.length) {
      new obsidian.Notice(i18nT('k1e7bf534', '自定义位置没读到任何笔记：{0}', path));
      return { ok: false, reason: 'no-file' };
    }
    let total = 0;
    for (let i = 0; i < files.length; i++) {
      total += sumMinutes(await vault.cachedRead(files[i]));
    }
    new obsidian.Notice(i18nT('kf3a2c081', '📊 自定义位置（{0} 篇）读到约 {1}', files.length, fmtDur(total * 60000)));
    return { ok: true, source: 'custom', minutes: total, files: files.length };
  } catch (e) {
    new obsidian.Notice(i18nT('k4b94496a', '读取自定义位置失败，统计未生成。'));
    return { ok: false, reason: 'read-failed' };
  }
}

module.exports = {
  RECORD_FORMAT_VERSION,
  DURATION_RE,
  Recorder,
  renderRecordSettings,
  renderTemplate,
  sanitizeFileName,
  insertAtTop,
  confirmDisableRecord,
  summaryLine,
  collectChoiceNames,
  getQuickAdd,
  hasDataview,
  accumulateStats,
  showStats,
  fmtDur,
  sumMinutes,
  dataviewLine,
  resolveDvVar,
  readCustomStats,
};
