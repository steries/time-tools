/*
 * BUG-1 回归套件：撤回多次转换后图标重复 / 乱序撤回丢数据
 * 对应验收清单 A-6-9 ~ A-6-14
 * 运行：node _test/undobug.js
 *
 * 背景：这六条此前**一条都没有**，所以 28 个套件全绿、线上却仍在丢数据。
 * 本套件把复现用例固化下来，修完后必须全绿。
 * 铁律：先复现再改 —— 用例来自 _repro_undo.js 的实测输出，不是臆断。
 */
const Module = require('module');

/* ============ 最小 CM6 mock（只为断言装饰是否叠加，A-6-9 / A-6-10）============ */
const cm6Views = [];

class DecoSet {
  constructor(ranges) { this.ranges = ranges || []; }
  map() { return this; }
  update(spec) {
    let rs = this.ranges.slice();
    if (spec && typeof spec.filter === 'function') {
      // 与 between 一致：回调第三个参数是 Decoration（读 .spec），不是裸 spec
      rs = rs.filter((r) => spec.filter(r.from, r.to, { spec: r.spec }));
    }
    if (spec && Array.isArray(spec.add)) {
      rs = rs.concat(spec.add.map((d) => ({ from: d.from, to: d.to, spec: d.spec })));
    }
    return new DecoSet(rs);
  }
  between(from, to, fn) {
    // 真实 CM6 回调第三个参数是 Decoration 对象（读 .spec），不是裸 spec
    for (const r of this.ranges) {
      if (r.from >= from && r.to <= to) fn(r.from, r.to, { spec: r.spec });
    }
  }
}

function mkEffect() {
  const e = {
    of(value) { return { is: (x) => x === e, value }; },
  };
  return e;
}

const stateMock = {
  StateEffect: { define: () => mkEffect() },
  StateField: { define: (cfg) => cfg },
};
const viewMock = {
  Decoration: {
    none: new DecoSet([]),
    mark: (spec) => ({ range: (from, to) => ({ from, to, spec }) }),
    widget: (spec) => ({ range: (pos) => ({ from: pos, to: pos, spec }) }),
  },
  EditorView: { decorations: { from: () => null } },
  WidgetType: class { constructor() {} },
};

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === '@codemirror/state') return stateMock;
  if (request === '@codemirror/view') return viewMock;
  return origLoad.apply(this, arguments);
};

/* ============ 环境 stub ============ */
const obsidian = require('obsidian');
global.window = {
  setInterval: () => 1,
  clearInterval: () => {},
  addEventListener() {},
  removeEventListener() {},
};
global.document = {
  body: new obsidian.MockEl('body'),
  createElement: (t) => new obsidian.MockEl(t),
};
global.__modals = [];
global.__notices = [];

const ta = require(__dirname + '/../src/timestamp.js');

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓ ' + name);
  else {
    failures++;
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : ''));
  }
}

/** 极简 editor：只实现撤回用到的三个方法 */
function mkEditor(lines) {
  return {
    lines: lines.slice(),
    getLine(n) { return typeof this.lines[n] === 'string' ? this.lines[n] : null; },
    setSelection(a, b) { this._sel = { a, b }; },
    replaceSelection(text) {
      const { a, b } = this._sel;
      const line = this.lines[a.line];
      this.lines[a.line] = line.slice(0, a.ch) + text + line.slice(b.ch);
      this._sel = null;
    },
  };
}

const P = { app: { workspace: { getActiveFile: () => ({ path: 'n.md' }) } } };

function record(ed, line, fromCh, searchText, replaceWith) {
  // id 由 recordUndoEntry 生成，必须返回它的返回值（返回入参会拿到 undefined id）
  return ta.recordUndoEntry(P, {
    editor: ed, line, fromCh, searchText, replaceWith,
    original: replaceWith, path: 'n.md',
  });
}

async function main() {

/* ============ A-6-11：乱序撤回不串位 ============ */
console.log('\n[A-6-11] 乱序撤回：转 3 处后先撤中间，另两条仍正确');
ta.clearUndo();
{
  const ed = mkEditor(['五月十六 和 明天 和 八月十九']);
  ed.lines[0] = '2026-06-30 和 明天 和 八月十九';
  const r1 = record(ed, 0, 0, '2026-06-30', '五月十六');
  ed.lines[0] = '2026-06-30 和 2026-09-21 和 八月十九';
  const r2 = record(ed, 0, 13, '2026-09-21', '明天');
  ed.lines[0] = '2026-06-30 和 2026-09-21 和 2026-09-29';
  const r3 = record(ed, 0, 26, '2026-09-29', '八月十九');

  check('记录 3 条', ta.undoCount(P) === 3, ta.undoCount(P));

  const ok2 = ta.restoreUndo(P, r2.id, ed);
  check('先撤中间那条成功', ok2 === true);
  check('中间那条已还原', ed.lines[0] === '2026-06-30 和 明天 和 2026-09-29', ed.lines[0]);
  check('撤中间后剩 2 条', ta.undoCount(P) === 2, ta.undoCount(P));

  const ok3 = ta.restoreUndo(P, r3.id, ed);
  check('再撤第 3 条成功（偏移已校正）', ok3 === true);
  check('第 3 条还原正确', ed.lines[0] === '2026-06-30 和 明天 和 八月十九', ed.lines[0]);

  const ok1 = ta.restoreUndo(P, r1.id, ed);
  check('最后撤第 1 条成功', ok1 === true);
  check('终态完全还原', ed.lines[0] === '五月十六 和 明天 和 八月十九', ed.lines[0]);
}

/* ============ A-6-12：偏移校正（关键：不校正会改错位置）============ */
console.log('\n[A-6-12] 撤回后校正后续记录偏移');
ta.clearUndo();
{
  /*
   * 行内有两个相同的 '2026-09-29'：
   *   撤 r1 后若不校正 r3 的 fromCh，整行 indexOf 会命中**第一个**，
   *   把替换写到错误位置 —— 这正是「正文被改坏且不可逆」的来源。
   */
  const ed = mkEditor(['2026-09-29 P 2026-06-30 Q 2026-09-29']);
  const r1 = record(ed, 0, 13, '2026-06-30', '五月十六');
  const r3 = record(ed, 0, 26, '2026-09-29', '八月十九'); // 指向**第二个**

  const ok1 = ta.restoreUndo(P, r1.id, ed);
  check('撤 r1 成功', ok1 === true);
  check('r1 还原正确', ed.lines[0] === '2026-09-29 P 五月十六 Q 2026-09-29', ed.lines[0]);

  const ok3 = ta.restoreUndo(P, r3.id, ed);
  check('撤 r3 成功', ok3 === true);
  check('r3 落在**第二个**位置（未改坏第一处）',
    ed.lines[0] === '2026-09-29 P 五月十六 Q 八月十九', ed.lines[0]);

  // 直接断言校正函数本身
  ta.clearUndo();
  const ed2 = mkEditor(['x']);
  const a = record(ed2, 0, 20, 'ssssssssss', 'oo');   // 锚点在 20
  const b = record(ed2, 0, 30, 'kkkk', 'zzzz');       // 排在后面 → 应被校正
  const c = record(ed2, 0, 5, 'kkkk', 'zzzz');        // 排在前面 → 不应动
  const bBefore = b.fromCh, cBefore = c.fromCh;
  ta.shiftUndoRecords(a, -8); // 锚点那条缩短 8
  check('后续记录 fromCh 已校正', b.fromCh === bBefore - 8, `${bBefore} → ${b.fromCh}`);
  check('排在前面的记录不动', c.fromCh === cBefore, `${cBefore} → ${c.fromCh}`);
}

/* ============ A-6-13：定位失败保留记录（不再永久不可逆）============ */
console.log('\n[A-6-13] 定位失败时不清记录');
ta.clearUndo();
{
  const ed = mkEditor(['2026-06-30']);
  const r = record(ed, 0, 0, '2026-06-30', '五月十六');
  check('先记 1 条', ta.undoCount(P) === 1, ta.undoCount(P));

  ed.lines[0] = '别的内容'; // 文本被别处改掉，定位必然失败
  const ok = ta.restoreUndo(P, r.id, ed);
  check('撤回返回 false', ok === false);
  check('**记录仍在**（不被清掉）', ta.undoCount(P) === 1, ta.undoCount(P));
  check('标记为 unresolvable', r.unresolvable === true);
  check('unresolvable 计数可见', ta.unresolvableUndoCount() === 1, ta.unresolvableUndoCount());

  // 文本改回来后仍能撤回 —— 证明「保留」真的救回了这次转换
  ed.lines[0] = '2026-06-30';
  const ok2 = ta.restoreUndo(P, r.id, ed);
  check('文本改回后可再次撤回', ok2 === true);
  check('还原成功', ed.lines[0] === '五月十六', ed.lines[0]);
}

/* ============ A-6-14：定位唯一性（命中多处时拒绝）============ */
console.log('\n[A-6-14] 同一行重复文本时拒绝执行');
ta.clearUndo();
{
  const ed = mkEditor(['2026-06-30 A 2026-06-30']);
  // 指向第二处（索引 13），但故意把 fromCh 写错成 12 ——
  // 真实场景里「撤回前一条后偏移失效」正是这个效果
  const r = record(ed, 0, 12, '2026-06-30', '五月十六');
  const ok = ta.restoreUndo(P, r.id, ed);
  check('重复文本且列号失效 → 拒绝执行', ok === false);
  check('正文**一点没动**（没改错地方）', ed.lines[0] === '2026-06-30 A 2026-06-30', ed.lines[0]);
  check('记录被保留而非丢弃', ta.undoCount(P) === 1, ta.undoCount(P));
}

/* ============ A-6-9 / A-6-10：装饰按 rec.id 去重 ============ */
console.log('\n[A-6-9/A-6-10] 同一条记录重复挂装饰不叠加');
ta.clearUndo();
{
  // 构造一个可用的 CM6 view
  const field = ta.buildCm6Extension ? ta.buildCm6Extension()[0] : null;
  if (!field) {
    check('CM6 扩展可用（mock 注入成功）', false, 'buildCm6Extension 未导出或构建失败');
  } else {
    let set = new DecoSet([]);
    const view = {
      state: {
        doc: {
          lines: 1,
          length: 50,
          line: (n) => ({ from: 0, to: 50 }),
        },
        field: () => set,
      },
      dispatch(tr) {
        const effects = tr && tr.effects ? (Array.isArray(tr.effects) ? tr.effects : [tr.effects]) : [];
        set = field.update(set, { changes: null, effects });
      },
    };
    cm6Views.push(view);

    const ed = { cm: view, getLine: () => 'x' };
    const rec = record(ed, 0, 0, 's', 'o');
    /*
     * 统计**这条记录**的图标数：widget 的 spec.widget.id 就是 rec.id。
     * 不能用装饰 id（markId）统计 —— 重复 attach 会生成新 markId，
     * 旧装饰照样留在文档里，只统计最新 id 会把残留的图标漏掉（断言失效）。
     */
    const widgets = () =>
      set.ranges.filter((r) => r.spec && r.spec.widget && r.spec.widget.id === rec.id).length;

    const a1 = ta.attachUndoWidget(P, ed, { line: 0, ch: 0 }, { line: 0, ch: 1 }, 'o', '↩', rec);
    const n1 = widgets();
    const a2 = ta.attachUndoWidget(P, ed, { line: 0, ch: 0 }, { line: 0, ch: 1 }, 'o', '↩', rec);
    const n2 = widgets();
    const a3 = ta.attachUndoWidget(P, ed, { line: 0, ch: 0 }, { line: 0, ch: 1 }, 'o', '↩', rec);
    const n3 = widgets();

    check('第 1 次挂上装饰', a1 === true, a1);
    check('第 1 次 1 个图标', n1 === 1, n1);
    check('重复挂第 2 次仍 1 个图标（不叠加）', n2 === 1, n2);
    check('重复挂第 3 次仍 1 个图标', n3 === 1, n3);
    check('图标数 == 记录数', n3 === ta.undoCount(P), `${n3} vs ${ta.undoCount(P)}`);
  }
}

/* ============ 附加：original 字段落进记录（CM6 撤回不写 undefined）============ */
console.log('\n[附加] original 已落进记录');
ta.clearUndo();
{
  const ed = mkEditor(['2026-06-30']);
  const r = record(ed, 0, 0, '2026-06-30', '五月十六');
  check('rec.original 有值（CM6 路径不会插 undefined）',
    r.original === '五月十六', JSON.stringify(r.original));
  // 追加模式：original 为空串是合法值，不能被当成缺失
  ta.clearUndo();
  const ed2 = mkEditor(['y']);
  const r2 = ta.recordUndoEntry(P, {
    editor: ed2, line: 0, fromCh: 0, searchText: '2026-06-30',
    replaceWith: '', original: '', path: 'n.md',
  });
  check('追加模式 original === ""（合法空值）', r2.original === '', JSON.stringify(r2.original));
}

ta.clearUndo();
console.log('\n' + (failures ? `✗ ${failures} 项失败` : '✓ 全部通过'));
process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
