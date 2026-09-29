/*
 * 日历互斥 · Calendar 增强取日期 · Templater 异步 · 笔记名解析
 *
 * 从 smoke.js 拆出：这一段自成一体（内部自行 require，不依赖 smoke 的
 * 中间状态），单独成套件后失败定位不用再翻 5000 行。
 * 运行：node _test/calendarlate.js
 */
const { fs, obsidian, check, done } = require('./_smoke_env.js');

async function main() {
/* ============ 3nn. 两个日历互斥 / Calendar 增强取日期 / Templater ============ */
console.log('\n[3qq] 日历隔离与 Calendar 增强');
{
  const cal = require(__dirname + '/../src/calendar.js');
  const S = require(__dirname + '/../src/settings.js');
  const notes = require(__dirname + '/../src/note.js');

  /* --- 互斥 --- */
  {
    const st = S.migrateSettings(null);
    check('allowBoth 默认关（两个日历互斥）', st.calendar.allowBoth === false);

    st.calendar.ownCalendarEnabled = true;
    st.calendar.enhanceCalendarEnabled = true;
    st.calendar.weekStart = 'sunday';
    let detached = 0;
    const plugin = {
      settings: st,
      app: { workspace: { getLeavesOfType: () => [{ detach: () => { detached++; } }] } },
    };
    const note = cal.enforceExclusive(plugin, 'enhance');
    check('保留增强时自动关掉 time tools 日历', st.calendar.ownCalendarEnabled === false);
    check('关掉时顺带收起已打开的视图', detached === 1);
    check('互斥动作有提示文案', typeof note === 'string' && note.length > 0, note || '');

    st.calendar.ownCalendarEnabled = true;
    st.calendar.enhanceCalendarEnabled = true;
    const note2 = cal.enforceExclusive(plugin, 'own');
    check('保留自研时自动关掉增强', st.calendar.enhanceCalendarEnabled === false);
    check('反向互斥也有提示', typeof note2 === 'string' && note2.length > 0, note2 || '');

    st.calendar.ownCalendarEnabled = true;
    st.calendar.enhanceCalendarEnabled = true;
    st.calendar.allowBoth = true;
    check('允许双开时不干预',
      cal.enforceExclusive(plugin, 'enhance') === null &&
      st.calendar.ownCalendarEnabled === true && st.calendar.enhanceCalendarEnabled === true);

    // 命令面板那条路径也要挡住：只靠设置页开关联动不够
    st.calendar.allowBoth = false;
    const refused = await cal.openOwnCalendar(plugin);
    check('增强开启且未双开时拒绝打开日历', refused === false);
  }

  /* --- Calendar 增强：取日期 --- */
  const mkBox = (year, month, days, wks) => ({
    querySelector: (sel) => {
      if (sel === '.year') return { textContent: String(year), querySelector: () => null };
      if (sel === '.month') return { textContent: month + '月', querySelector: () => null };
      return null;
    },
    querySelectorAll: (sel) => (sel === '.day' ? days : (wks || [])),
  });
  const mkDay = (text, attrs) => ({
    textContent: text,
    getAttribute: (a) => ((attrs && attrs[a]) || null),
    parentElement: null,
  });
  const pluginC = { settings: S.migrateSettings(null) };
  pluginC.settings.calendar.weekStart = 'sunday';

  {
    // 2026-09-01 是周二；周日起始 → 1 号落在第 2 列，首格是 8/30
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(2026, 8, 1 - 2 + i);
      days.push(mkDay(String(d.getDate()), null));
    }
    const box = mkBox(2026, 9, days, []);
    const got = cal.dateOfCalendarDay(box, days[9], pluginC);
    check('按网格位置推算日期（点第 9 格 = 9/8）',
      !!got && got.getFullYear() === 2026 && got.getMonth() === 8 && got.getDate() === 8,
      got ? got.toISOString().slice(0, 10) : 'null');

    const first = cal.dateOfCalendarDay(box, days[0], pluginC);
    check('首格能算到上月尾（8/30），不再留空',
      !!first && first.getMonth() === 7 && first.getDate() === 30,
      first ? first.toISOString().slice(0, 10) : 'null');

    // 带 aria-label 时优先用属性，且不必依赖网格形状
    const labelled = mkDay('8', { 'aria-label': '2026-09-08' });
    const got2 = cal.dateOfCalendarDay(mkBox(2026, 9, [labelled], []), labelled, pluginC);
    check('有 aria-label 时优先取属性',
      !!got2 && got2.getMonth() === 8 && got2.getDate() === 8);

    // 网格数量异常（选择器把表头也命中了）→ 放弃，绝不猜
    check('日期格数量非 7 的倍数时放弃推算',
      cal.dateOfCalendarDay(mkBox(2026, 9, [mkDay('1'), mkDay('2'), mkDay('3')], []),
        days[0], pluginC) === null);
  }

  {
    const wks = [mkDay('36'), mkDay('37'), mkDay('38')];
    const box = mkBox(2026, 9, [], wks);
    const got = cal.dateOfCalendarWeek(box, wks[1], pluginC);
    // 第 1 行首日 = 1 - 2 + 7 = 9/6
    check('周数按行号推算，不再写死「今天」',
      !!got && got.getMonth() === 8 && got.getDate() === 6,
      got ? got.toISOString().slice(0, 10) : 'null');
    check('周数格无数字又不在列表里时返回 null（不猜）',
      cal.dateOfCalendarWeek(mkBox(2026, 9, [], []), mkDay('周'), pluginC) === null);
  }

  {
    /*
     * 行号取自周数格在 DOM 列表里的下标，再用格内显示的周号做交叉校验。
     *
     * 纯下标法在周数列前面有表头占位格时会整体偏一位（表现就是点 39 开 38）；
     * 纯按显示数字反查又会把两套周号体系在跨月边界的误差固定下来。
     * 故以下标为准，仅当「下标算出的行首日周号 ≠ 格内显示」时按显示数字
     * 就近校正 —— 两种偏差来源都覆盖。
     */
    const dow = cal.targetDow(pluginC.settings);
    const off = cal.startOffsetOf(2026, 8, dow);
    const expect = (r) => new Date(2026, 8, 1 - off + r * 7).getTime();
    const iso = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : 'null');
    // 造周数格：显示数字与各行真实周号一一对应；offsetRows 个表头占位格
    const mkWks = (rows, offsetRows) => {
      const arr = [];
      for (let i = 0; i < offsetRows; i++) arr.push(mkDay('周'));
      for (let r = 0; r < rows; r++) arr.push(mkDay(String(cal.weekNumberOf(new Date(expect(r)), dow))));
      return arr;
    };

    // ① 无占位格：显示与下标一致，结果等于纯下标（不破坏原有行为）
    const wksA = mkWks(6, 0);
    const boxA = mkBox(2026, 9, [], wksA);
    const gotA2 = cal.dateOfCalendarWeek(boxA, wksA[2], pluginC);
    check('无占位格时下标即行号（点下标 2）',
      !!gotA2 && gotA2.getTime() === expect(2), iso(gotA2));
    const gotA5 = cal.dateOfCalendarWeek(boxA, wksA[5], pluginC);
    check('无占位格时下标即行号（末行）',
      !!gotA5 && gotA5.getTime() === expect(5), iso(gotA5));

    // ② 周数列前有 1 个表头占位格：下标整体偏 1，按显示数字校正
    const wksB = mkWks(6, 1);
    const boxB = mkBox(2026, 9, [], wksB);
    const gotB = cal.dateOfCalendarWeek(boxB, wksB[2], pluginC);
    check('表头占位格导致下标偏移时按显示数字校正（不再点 39 开 38）',
      !!gotB && cal.weekNumberOf(gotB, dow) === cal.weekNumberOf(new Date(expect(1)), dow),
      iso(gotB));

    // ③ 显示值在网格里找不到对应行 → 退回下标，不臆造日期
    const fake = mkDay('99');
    const gotFake = cal.dateOfCalendarWeek(mkBox(2026, 9, [], [fake]), fake, pluginC);
    check('显示值无法匹配时退回下标（不猜）',
      !!gotFake && gotFake.getTime() === expect(0), iso(gotFake));

    /*
     * 周记高亮：2026-W38 解析出的日期必须与日历显示的第 38 行首日一致。
     * 旧实现一律按 ISO（周一）硬算，周起始为周日时会比显示的那行早一天，
     * 点完周记 file-open 解析出不同日期 → 高亮跳到隔壁格子。
     */
    for (const fd of [0, 1]) {
      const wstart = cal.weekStartOf(2026, 38, fd);
      check(`周记 2026-W38 反推与显示同源（周起始 ${fd === 0 ? '周日' : '周一'}）`,
        !!wstart && cal.weekNumberOf(wstart, fd) === 38,
        iso(wstart));
    }
  }

  /* --- 异名笔记兜底，避免同一天建两篇 --- */
  {
    const settings = S.migrateSettings(null);
    settings.notes.daily.folder = '03记录/生活记录/日记';
    settings.notes.daily.format = 'YYYY-MM-DD';
    const d = new Date(2026, 8, 8);
    const altName = notes.buildFileName(d, 'YYYY-MM-DD-ddd', 'daily');
    const altPath = '03记录/生活记录/日记/' + altName + '.md';
    const found = notes.findExistingNote(
      { vault: { getAbstractFileByPath: (p) => (p === altPath ? { path: altPath } : null) } },
      settings, 'daily', d);
    check('异名日记能兜底找到（不再重复建）', !!found && found.path === altPath,
      found ? found.path : 'null');
    check('没有命中时返回 null（不误开）',
      notes.findExistingNote({ vault: { getAbstractFileByPath: () => null } },
        settings, 'daily', d) === null);
  }

  /* --- Templater 异步初始化 --- */
  {
    const t0 = Date.now();
    const st1 = await notes.waitTemplater({ plugins: { plugins: {} } });
    check('未安装时立即返回，不空等',
      st1.ok === false && st1.reason === '未安装' && Date.now() - t0 < 150);

    const plug = {};
    setTimeout(() => { plug.templater = { create_new_note_from_template: () => {} }; }, 250);
    const st2 = await notes.waitTemplater({ plugins: { plugins: { 'templater-obsidian': plug } } });
    check('异步初始化时等到就绪', st2.ok === true, JSON.stringify(st2));
  }

  /* --- dow/doy 必须配套 --- */
  {
    const had = Object.prototype.hasOwnProperty.call(global, 'window');
    const saved = global.window;
    global.window = {};
    const st = S.migrateSettings(null);
    st.calendar.calendarFixEnabled = true;
    st.calendar.weekStart = 'monday';
    cal.applyCalendarWeekSpec(st);
    const spec = global.window._bundledLocaleWeekSpec;
    check('周一起始时 doy=4（ISO 配套），不是写死 6',
      !!spec && spec.dow === 1 && spec.doy === 4, JSON.stringify(spec));
    global.window = {};
    st.calendar.weekStart = 'sunday';
    cal.applyCalendarWeekSpec(st);
    const spec2 = global.window._bundledLocaleWeekSpec;
    check('周日起始时 doy=6', !!spec2 && spec2.dow === 0 && spec2.doy === 6, JSON.stringify(spec2));
    if (had) global.window = saved; else delete global.window;
  }

  /* --- 高亮跟随打开的笔记（不再锁死在今天） --- */
  {
    const fsr = require('fs');
    const p1 = cal.parseDateFromName('2026-09-22-周二');
    check('日记名能解析出日期（带中文后缀也认）',
      !!p1 && p1.getFullYear() === 2026 && p1.getMonth() === 8 && p1.getDate() === 22,
      p1 ? p1.toISOString().slice(0, 10) : 'null');
    // 月记 / 年记按 settings.notes 里配置的格式串匹配，不再靠「含年/月字」猜
    const N = {
      daily: { format: 'YYYY-MM-DD' },
      weekly: { format: 'gggg-[W]ww' },
      monthly: { format: 'YYYY-MM月记' },
      yearly: { format: 'YYYY年记' },
    };
    const p2 = cal.parseDateFromName('2026-W38', 1, N);
    check('周记名解析到该周首日', !!p2 && p2.getMonth() === 8 && p2.getDate() === 14,
      p2 ? p2.toISOString().slice(0, 10) : 'null');
    const p3 = cal.parseDateFromName('2026-09月记', 1, N);
    check('月记名解析到该月 1 日', !!p3 && p3.getMonth() === 8 && p3.getDate() === 1);
    const p4 = cal.parseDateFromName('2026年记', 1, N);
    check('年记名解析到该年 1 月 1 日', !!p4 && p4.getMonth() === 0 && p4.getDate() === 1);
    check('普通笔记名解析不出（不猜）', cal.parseDateFromName('随便的笔记', 1, N) === null);
    check('不存在的日期解析不出（2026-02-30 不降级）',
      cal.parseDateFromName('2026-02-30', 1, N) === null);
    // 误匹配回归：名字带「年」「月」的普通笔记曾被解析成 1 月 1 日，高亮乱跳
    check('「2026 年度总结」不再误判为年记（高亮不再乱跳）',
      cal.parseDateFromName('2026 年度总结', 1, N) === null);
    check('「2026年度总结」不再误判为年记',
      cal.parseDateFromName('2026年度总结', 1, N) === null);
    check('「月度复盘」不再误判为月记',
      cal.parseDateFromName('月度复盘', 1, N) === null);

    // 视觉语义：今天只留边框，打开的那天才全填充
    const css = fsr.readFileSync(__dirname + '/../styles.css', 'utf8');
    const todayRule = (css.match(/\.tt-cal-day\.is-today\s*\{([^}]*)\}/) || [])[1] || '';
    const pickRule = (css.match(/\.tt-cal-day\.is-picked\s*\{([^}]*)\}/) || [])[1] || '';
    check('今天只留边框（outline），不全填充',
      /outline/.test(todayRule) && !/background\s*:/.test(todayRule), todayRule.trim());
    check('打开的笔记所在日期全填充（background）',
      /background\s*:/.test(pickRule) && !/outline/.test(pickRule), pickRule.trim());

    const src = fsr.readFileSync(__dirname + '/../src/calendar.js', 'utf8');
    const noComment = src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
      .map((l) => l.replace(/\/\/.*$/, '')).join('\n');
    const clearCnt = (noComment.match(/this\.picked\s*=\s*null/g) || []).length;
    check('picked 只在两处被清空：构造 + 打开非日历笔记', clearCnt === 2,
      '实际出现 ' + clearCnt + ' 次（切月 / 生成笔记都不再清空）');
    check('注册了 file-open 以跟随打开的笔记',
      /workspace\.on\(\s*'file-open'/.test(noComment));

    // 打开非日历类笔记必须清掉高亮，否则日历上还亮着上一次那格
    check('打开非日历笔记时清空高亮（不再残留）',
      /if \(!ref\)[\s\S]{0,260}?this\.picked = null/.test(src),
      '解析不出日期时应清空 picked');
    // 周记解析跟随周起始，避免点完周记高亮跳到隔壁格子
    check('周记解析传入 firstDow（与显示同源）',
      /parseNoteRef\(f\.basename \|\| f\.name \|\| '', this\.firstDow, notesCfg(?:, [^)]*)?\)/.test(src),
      '第 4 个参数为可选 settings（自定义规则参与日历解析）');
  }
}

/* ============ 3zz. v2.64：周记高亮 + 切月不再乱蹦 ============ */
console.log('\n[3zz] 高亮语义（周记 / 月记 / 年记）');

const calZ2 = require(__dirname + '/../src/calendar.js');
const cZ2 = require('fs').readFileSync(__dirname + '/../src/calendar.js', 'utf8');
const cssZ2 = require('fs').readFileSync(__dirname + '/../styles.css', 'utf8');

// ① parseNoteRef 同时给出「类型」和日期 —— 只给日期无法决定高亮画在哪种元素上
{
  const N2 = {
    weekly: { format: 'gggg-[W]ww' },
    daily: { format: 'YYYY-MM-DD' },
    monthly: { format: 'YYYY-MM月记' },
    yearly: { format: 'YYYY年记' },
  };
  check('周记解析出 kind=week', (calZ2.parseNoteRef('2026-W38', 1, N2) || {}).kind === 'week');
  check('日记解析出 kind=day', (calZ2.parseNoteRef('2026-09-22', 1, N2) || {}).kind === 'day');
  check('月记解析出 kind=month', (calZ2.parseNoteRef('2026-09月记', 1, N2) || {}).kind === 'month');
  check('年记解析出 kind=year', (calZ2.parseNoteRef('2026年记', 1, N2) || {}).kind === 'year');
  check('普通笔记返回 null（不猜）', calZ2.parseNoteRef('2026 年度总结', 1, N2) === null);
  // 逆推的周首日必须与显示同源：周一=dow1
  const wk = calZ2.parseNoteRef('2026-W38', 1, N2);
  check('W38 周首日为 2026-09-14（周一起始）',
    wk && wk.date.getFullYear() === 2026 && wk.date.getMonth() === 8 && wk.date.getDate() === 14,
    wk ? wk.date.toDateString() : 'null');
}

// ② 周范围判定
{
  const s14 = new Date(2026, 8, 14);
  check('周首日当天算在本周内', calZ2.weekContains(s14, new Date(2026, 8, 14)) === true);
  check('周内最后一天（+6）算在本周内', calZ2.weekContains(s14, new Date(2026, 8, 20)) === true);
  check('前一天不算', calZ2.weekContains(s14, new Date(2026, 8, 13)) === false);
  check('后一周第一天不算', calZ2.weekContains(s14, new Date(2026, 8, 21)) === false);

  // 跨月周：8/30 起那一周同时落在 8 月和 9 月
  const s830 = new Date(2026, 7, 30);
  check('跨月周与 8 月有交集', calZ2.weekTouchesMonth(s830, 2026, 7) === true);
  check('跨月周与 9 月有交集', calZ2.weekTouchesMonth(s830, 2026, 8) === true);
  check('跨月周与 10 月无交集', calZ2.weekTouchesMonth(s830, 2026, 9) === false);
}

// ③ 渲染：周数格 / 整行 / 标题各司其职
{
  check('周数格可高亮（旧实现周列永远不亮）', cZ2.includes("wkCell.addClass('is-picked')"));
  check('周记时整行弱高亮', cZ2.includes("cell.addClass('is-week-row')"));
  check('日期格全填充只给 day', /selKind === 'day'[^]{0,80}is-picked/.test(cZ2));
  check('月标题可高亮', cZ2.includes("mBtn.addClass('is-picked')"));
  check('年标题可高亮', cZ2.includes("yBtn.addClass('is-picked')"));
  check('点击周记时记录 selKind=week', /selKind = 'week'/.test(cZ2));
  check('点击今天时记录 selKind=day', /selKind = 'day'/.test(cZ2));

  // 切月策略：这是「乱蹦」的根因
  check('年记不切月（旧实现会跳到 1 月）',
    /ref\.kind === 'year'[\s\S]{0,60}offMonth = false/.test(cZ2));
  check('周记与当前月有交集则不切月',
    /ref\.kind === 'week'[\s\S]{0,80}weekTouchesMonth\(d, this\.year, this\.month\)/.test(cZ2));
  check('unchanged 判定带上 kind（换类型也要重绘）',
    /this\.selKind === ref\.kind/.test(cZ2));
}

// ④ 样式：区分「全填充」与「整行弱高亮」
{
  check('周数格高亮为全填充', /\.tt-cal-wk\.is-picked\s*\{[^}]*background:/.test(cssZ2));
  check('整行弱高亮用淡背景而非 accent', /\.tt-cal-day\.is-week-row\s*\{[^}]*background-modifier-hover/.test(cssZ2));
  check('标题高亮不盖住文字', /\.tt-cal-month\.is-picked[\s\S]{0,120}text-on-accent/.test(cssZ2));
  // 今天仍然只留边框
  const t2 = (cssZ2.match(/\.tt-cal-day\.is-today\s*\{([^}]*)\}/) || [])[1] || '';
  check('今天仍只留边框', /outline/.test(t2) && !/background\s*:/.test(t2));
}

}
main().then(() => done('calendarlate'));
