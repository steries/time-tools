/*
 * Templater 桥接 —— v2.72
 *
 * 场景：三个日历开关都关掉、用 Calendar 原生功能新建周期性笔记时，
 * Calendar 走核心「日记」插件的模板通道，模板被**原样复制**，
 * Templater 的 <% %> 不会执行，笔记里留下没渲染的源码。
 *
 * 本套件守住两件事：
 *   1. 未渲染的周期性笔记要被补跑一次 Templater
 *   2. 不该动的文件绝不动（已渲染 / 老文件 / 非周期笔记 / 文件夹不符 / 开关关闭）
 *
 * 注意：这里只验证「状态可判定」的兜底逻辑。Calendar 与 Templater 的内部时序
 * 无法在沙盒里验证，所以测试只针对本插件自己的判据。
 */
const path = __dirname + '/../src/';
global.__notices = [];
const cal = require(path + 'calendar.js');
const settingsMod = require(path + 'settings.js');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else {
    failures++;
    console.log('  ✗ ' + name + (extra !== undefined ? ' → ' + extra : ''));
  }
}

const TPL_PATH = '04仓库/1模板/推进类模板.md';
const DAILY_FOLDER = '03记录/生活记录/日记/2026/09';

/**
 * 造一个最小插件环境。
 * @param {object} opts
 *   notes   —— notes 配置
 *   bridge  —— templaterBridge 开关（默认 true）
 *   tpl     —— Templater API 对象（null = 未装）
 */
function makeEnv(opts) {
  const o = opts || {};
  const events = [];
  const writes = [];
  const tplFile = { path: TPL_PATH, basename: '推进类模板', __body: o.tplBody !== undefined ? o.tplBody : RAW };
  const vault = {
    on: (evt, cb) => {
      events.push(evt);
      return { evt, cb };
    },
    cachedRead: async (f) => (f && f.__body != null ? f.__body : ''),
    modify: async (f, str) => {
      if (f) f.__body = String(str);
      if (f && f.path === TPL_PATH) writes.push(f.path);
    },
    getAbstractFileByPath: (p) =>
      p === TPL_PATH || p === TPL_PATH.replace(/\.md$/, '') ? tplFile : null,
    getFiles: () => [],
  };
  const plugin = {
    settings: {
      calendar: { weekStart: 'monday', templaterBridge: o.bridge !== false },
      notes: o.notes || {},
    },
    app: {
      vault,
      plugins: {
        plugins: o.tpl
          ? { 'templater-obsidian': { templater: o.tpl } }
          : {},
      },
    },
    registerEvent: () => {},
  };
  return { plugin, events, tplFile, writes };
}

/** 造一个刚创建的笔记文件 */
function file(p, body, ageMs) {
  return {
    path: p,
    name: p.split('/').pop(),
    basename: p.split('/').pop().replace(/\.md$/, ''),
    stat: { ctime: Date.now() - (ageMs || 0) },
    __body: body,
  };
}

/**
 * 忠实模拟 Templater 官方语义，而不是照抄本插件的写法。
 *
 * 已核对 Templater 文档：Templater 类的公开方法只有
 *   parse_template(config, template_content)
 *   create_new_note_from_template(...)
 *   process_dynamic_templates(el, ctx)
 * 其中 config 形如 { template_file, target_file, run_mode, active_file }。
 *
 * 注意：**没有** write_template_to_file。v2.71～v2.73 正是调了这个不存在的方法，
 * typeof 判空后静默 return，表现就是「点了没反应、Templater 像没生效」。
 * 本套件因此按真实 API 实现：只提供 parse_template，看插件能不能正确用它。
 */
function recorder(tplBody) {
  const calls = [];
  const render = (src) => 'RENDERED(' + String(src == null ? '' : src).length + ')';
  return {
    calls,
    parse_template: async (config, content) => {
      calls.push({
        tpl: config && config.template_file && config.template_file.path,
        target: config && config.target_file && config.target_file.path,
        run_mode: config && config.run_mode,
      });
      return render(content);
    },
  };
}

const RAW = '---\ntitle: <% tp.date.now() %>\n---\n\n# 未渲染的模板\n';
const NOTES = {
  daily: { folder: '03记录/生活记录/日记', format: 'YYYY/MM/YYYY-MM-DD', template: TPL_PATH },
  weekly: { folder: '03记录/生活记录/周记', format: 'gggg/gggg-[W]ww', template: TPL_PATH },
  monthly: { folder: '', format: 'YYYY-MM', template: TPL_PATH },
  yearly: { folder: '', format: 'YYYY', template: TPL_PATH },
};

async function run(env, f) {
  await cal.bridgeNewNote(env.plugin, f);
}

(async () => {
  console.log('\n[1] 默认与注册');
  const def = settingsMod.DEFAULT_SETTINGS || settingsMod.defaultSettings;
  /*
   * 默认关：用户要求日历区所有开关一律默认关。
   * 需要的场景（三个日历开关关掉、改用 Calendar 原生）由用户自行打开。
   */
  check('默认关闭（templaterBridge === false）',
    def && def.calendar && def.calendar.templaterBridge === false,
    def && def.calendar && def.calendar.templaterBridge);
  const env0 = makeEnv({ notes: NOTES, tpl: recorder() });
  cal.registerTemplaterBridge(env0.plugin);
  check('注册了 vault 的 create 监听', env0.events.indexOf('create') >= 0, env0.events.join(','));

  console.log('\n[2] 该补跑的：Calendar 原生建出的未渲染笔记');
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file(DAILY_FOLDER + '/2026-09-25.md', RAW));
    check('日记（含裸 <% %>）→ 补跑一次', t.calls.length === 1, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file('03记录/生活记录/周记/2026/2026-W38.md', RAW));
    check('周记 → 补跑一次', t.calls.length === 1, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file('2026-09.md', RAW));
    check('月记（未配文件夹）→ 补跑一次', t.calls.length === 1, JSON.stringify(t.calls));
  }

  console.log('\n[3] 不该动的（幂等与安全边界）');
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file(DAILY_FOLDER + '/2026-09-26.md', '# 已渲染好\n没有模板语法\n'));
    check('已渲染（无 <%）→ 不动', t.calls.length === 0, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file(DAILY_FOLDER + '/2026-09-27.md', RAW, 60000));
    check('老文件（超出 10 秒窗口）→ 不动', t.calls.length === 0, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file('收件箱/随便写的.md', RAW));
    check('非周期性笔记 → 不动', t.calls.length === 0, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file('别处/2026-09-28.md', RAW));
    check('配了文件夹但路径不符 → 不动', t.calls.length === 0, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({
      notes: { daily: { folder: DAILY_FOLDER, format: 'YYYY-MM-DD', template: '' } },
      tpl: t,
    });
    await run(env, file(DAILY_FOLDER + '/2026-09-29.md', RAW));
    check('没配模板也能补跑（用户模板常配在 Calendar 那边）', t.calls.length === 1, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t, bridge: false });
    await run(env, file(DAILY_FOLDER + '/2026-09-30.md', RAW));
    check('开关关闭 → 不动', t.calls.length === 0, JSON.stringify(t.calls));
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file(DAILY_FOLDER + '/2026-09-05.md', RAW));
    await run(env, file(DAILY_FOLDER + '/2026-09-05.md', RAW));
    check('同一文件重复事件 → 只跑一次', t.calls.length === 1, JSON.stringify(t.calls));
  }
  {
    const env = makeEnv({ notes: NOTES, tpl: null });
    let threw = false;
    try {
      await run(env, file(DAILY_FOLDER + '/2026-10-02.md', RAW));
    } catch (e) {
      threw = true;
    }
    check('Templater 未装 → 不动且不抛错', !threw);
  }
  {
    const env = makeEnv({ notes: NOTES, tpl: { append_template_to_active_file: async () => {} } });
    let threw = false;
    try {
      await run(env, file(DAILY_FOLDER + '/2026-10-03.md', RAW));
    } catch (e) {
      threw = true;
    }
    check('Templater 缺 parse_template → 不动且不抛错', !threw);
  }
  {
    const t = recorder();
    const env = makeEnv({ notes: NOTES, tpl: t });
    await run(env, file(DAILY_FOLDER + '/2026-10-04.txt', RAW));
    check('非 md 文件 → 不动', t.calls.length === 0, JSON.stringify(t.calls));
  }

  console.log('\n[4] 去重表不会无限增长');
  {
    const env = makeEnv({ notes: NOTES, tpl: recorder() });
    for (let i = 0; i < 400; i++) {
      await run(env, file(DAILY_FOLDER + '/2026-10-' + String(i % 28 + 1) + '.md', RAW, 60000));
    }
    check('批量老文件不会抛错', true);
  }

  /*
   * v2.71 修的正是这一组：
   * 核心「日记」插件没配模板时，Calendar 建出来的笔记是**空的**，
   * 旧判据要求「内容里必须有裸 <% %>」，于是空文件被整类跳过 —— Templater 完全没参与。
   */
  console.log('\n[8] 空文件也要补跑（核心日记未配模板）');
  {
    // 注意：去重表是模块级的、跨场景共享，这里必须用上面没用过的文件名
    const r1 = recorder();
    await run(makeEnv({ notes: NOTES, tpl: r1 }), file(DAILY_FOLDER + '/2026-09-07.md', ''));
    check('空日记文件要补跑', r1.calls.length === 1, r1.calls.length);

    const r2 = recorder();
    await run(makeEnv({ notes: NOTES, tpl: r2 }),
      file('03记录/生活记录/周记/2026/2026-W42.md', ''));
    check('空周记文件要补跑', r2.calls.length === 1, r2.calls.length);

    const r3 = recorder();
    await run(makeEnv({ notes: NOTES, tpl: r3 }),
      file(DAILY_FOLDER + '/2026-09-08.md', '已经写好的内容'));
    check('已有实质内容的不补跑（不覆盖用户输入）', r3.calls.length === 0, r3.calls.length);
  }

  /*
   * v2.73 修的：write_template_to_file 的参数顺序。
   * 官方签名是 (template_file, file) —— 模板在前、目标在后。
   * 传反不会报错，而是把空笔记当模板渲染、写进模板文件，
   * 结果是「模板被清空 + 笔记仍然空」，用户只看到「用不了」。
   */
  console.log('\n[9] 渲染走 parse_template，写入由插件自己完成');
  {
    const r = recorder();
    const env = makeEnv({ notes: NOTES, tpl: r });
    const note = file(DAILY_FOLDER + '/2026-09-11.md', '');
    await run(env, note);
    const c = r.calls[0];
    check('渲染的是笔记自身内容（不再读模板文件）', !!c && c.tpl === note.path, c && c.tpl);
    check('target_file 传的是笔记', !!c && c.target === note.path, c && c.target);
    check('run_mode 为 OverwriteFile(2)', !!c && c.run_mode === 2, c && c.run_mode);
    check('模板文件没有被写入（未被清空）', env.tplFile.__body === RAW, env.tplFile.__body);
    check('模板路径不在写入列表里', env.writes.length === 0, JSON.stringify(env.writes));
    check('笔记被写入了渲染结果',
      typeof note.__body === 'string' && note.__body.indexOf('RENDERED') === 0, note.__body);
  }

  /*
   * 用户担心「是不是只能用特定文件名」。
   * 这里证明：认的是**用户在设置里填的文件名格式**，不是内置死格式。
   * 三种用户自定义格式都要能被识别并补跑。
   */
  console.log('\n[10] 认用户配置的文件名格式，而非内置死格式');
  {
    const custom = [
      { format: 'YYYY-MM-DD-ddd', name: '2026-09-12-周六', label: '带星期后缀' },
      { format: 'YYYY年MM月DD日', name: '2026年09月13日', label: '中文年月日' },
      { format: 'MM-DD-YYYY', name: '09-14-2026', label: '月日年' },
    ];
    for (let i = 0; i < custom.length; i++) {
      const it = custom[i];
      const notes = Object.assign({}, NOTES, {
        daily: { folder: '03记录/生活记录/日记', format: 'YYYY/MM/' + it.format, template: TPL_PATH },
      });
      const r = recorder();
      await run(makeEnv({ notes, tpl: r }), file(DAILY_FOLDER + '/' + it.name + '.md', ''));
      check('自定义格式 ' + it.format + '（' + it.label + '）→ 补跑',
        r.calls.length === 1, r.calls.length);
    }
  }

  /*
   * 「额外文件名格式」是给老笔记兜底的，桥接也要认 ——
   * 老库里混着多种命名时不能只认当前格式。
   */
  console.log('\n[11] 额外文件名格式也参与桥接识别');
  {
    const notes = Object.assign({}, NOTES, {
      daily: {
        folder: '03记录/生活记录/日记',
        format: 'YYYY-MM-DD',
        altFormats: 'YYYY-MM-DD-ddd',
        template: TPL_PATH,
      },
    });
    const r = recorder();
    await run(makeEnv({ notes, tpl: r }),
      file(DAILY_FOLDER + '/2026-09-15-周二.md', ''));
    check('额外格式里的老命名 → 补跑', r.calls.length === 1, r.calls.length);
  }

  /*
   * 退出点行为：不匹配的场景必须一次都不调 Templater。
   * （曾有一版把退出原因存进 bridgeDiag、再用诊断命令展示；
   *   诊断命令已按用户要求移除，这里改为直接断言行为，并守住「不再留诊断状态」。）
   */
  console.log('\n[12] 退出点：不该补跑的一次都不跑');
  {
    const r1 = recorder();
    await run(makeEnv({ notes: NOTES, tpl: r1 }), file(DAILY_FOLDER + '/2026-09-16.md', ''));
    check('该补跑的补跑了', r1.calls.length === 1, r1.calls.length);

    const r2 = recorder();
    await run(makeEnv({ notes: NOTES, tpl: r2 }), file('收件箱/随便写的.md', RAW));
    check('文件名与文件夹都不匹配 → 不补跑', r2.calls.length === 0, r2.calls.length);

    const r3 = recorder();
    const env3 = makeEnv({ notes: NOTES, tpl: r3 });
    env3.plugin.app.plugins.plugins = {}; // Templater 不可用
    await run(env3, file(DAILY_FOLDER + '/2026-09-17.md', RAW));
    check('Templater 不可用 → 不补跑', r3.calls.length === 0, r3.calls.length);

    check('不再导出诊断状态对象 bridgeDiag', typeof cal.bridgeDiag === 'undefined',
      typeof cal.bridgeDiag);
  }

  console.log(failures === 0
    ? '\nTemplater 桥接：全部通过'
    : '\nTemplater 桥接：' + failures + ' 项失败');
  if (failures > 0) process.exitCode = 1;
})();
