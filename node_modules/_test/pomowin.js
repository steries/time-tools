/*
 * 独立窗口（pop-out）外观 / 层级 / 位置测试。
 *
 * 这个模块的失败是**静默**的：窗口照常打开，只是尺寸、位置、置顶不对，
 * 用户只会觉得"怎么没生效"。所以每条都断言真实的副作用（调用记录 / class），
 * 而不是断言"函数被调用了"。
 *
 * 另外守两条硬边界：
 *   1. Electron 窗口接口拿不到时，必须优雅降级，绝不抛异常；
 *   2. 无边框不能影响主窗口（只认 .is-popout-window）。
 */
'use strict';

const path = __dirname + '/../src/';
const pomowin = require(path + 'pomowin.js');
const { migrateSettings, DEFAULT_SETTINGS } = require(path + 'settings.js');

let fail = 0;
let total = 0;
function check(name, cond, extra) {
  total += 1;
  if (cond) console.log('  ✓ ' + name);
  else {
    fail += 1;
    console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : ''));
  }
}

/** 造一个假窗口：记录所有被调用的方法 */
function fakeWin(opts) {
  const o = opts || {};
  const calls = [];
  const w = {
    __calls: calls,
    screen: {
      availLeft: o.ax === undefined ? 0 : o.ax,
      availTop: o.ay === undefined ? 0 : o.ay,
      availWidth: o.aw === undefined ? 1920 : o.aw,
      availHeight: o.ah === undefined ? 1040 : o.ah, // 1080 减掉任务栏 40
      width: 1920,
      height: 1080,
    },
  };
  if (o.electron !== false) {
    w.electronWindow = {
      setAlwaysOnTop(v) {
        calls.push(['onTop', v]);
      },
      setBounds(b) {
        calls.push(['bounds', b]);
      },
    };
  }
  return w;
}
function findCall(w, name) {
  return w.__calls.filter((c) => c[0] === name).map((c) => c[1]);
}
function fakeDoc(cls) {
  const list = (cls || '').split(' ').filter(Boolean);
  return {
    body: {
      __cls: list,
      classList: {
        contains: (c) => list.indexOf(c) >= 0,
        add(c) {
          if (list.indexOf(c) < 0) list.push(c);
        },
        remove(c) {
          const i = list.indexOf(c);
          if (i >= 0) list.splice(i, 1);
        },
      },
    },
    __list: list,
  };
}

console.log('\n[1] pop-out 窗口识别');
check('主窗口（无 is-popout-window）判为 false', pomowin.isPopoutWindow(fakeDoc('')) === false);
check('pop-out 窗口判为 true', pomowin.isPopoutWindow(fakeDoc('is-popout-window theme-dark')) === true);
check('没有 document 时返回 false 不抛异常', pomowin.isPopoutWindow(null) === false);

console.log('\n[2] Electron 窗口接口探测');
const wOk = fakeWin({});
check('接口可用时返回窗口对象', pomowin.electronWindow(wOk) === wOk.electronWindow);
check('没有 electronWindow 时返回 null', pomowin.electronWindow(fakeWin({ electron: false })) === null);
check('有对象但缺方法时返回 null', pomowin.electronWindow({ electronWindow: {} }) === null);
check('移动端 window 为 null 时返回 null', pomowin.electronWindow(null) === null);

console.log('\n[3] 位置计算（避开任务栏、不跑出屏幕）');
const area = { x: 0, y: 0, w: 1920, h: 1040 };
const br = pomowin.cornerOf(area, 616, 406, 'bottom-right');
check('右下角：x = 可用宽 - 窗宽 - 边距', br.x === 1920 - 616 - 12, JSON.stringify(br));
check('右下角：y = 可用高 - 窗高 - 边距', br.y === 1040 - 406 - 12, JSON.stringify(br));
const bl = pomowin.cornerOf(area, 616, 406, 'bottom-left');
check('左下角：x 贴左边缘', bl.x === 12 && bl.y === 1040 - 406 - 12, JSON.stringify(bl));
const tr = pomowin.cornerOf(area, 616, 406, 'top-right');
check('右上角：y 贴上边缘', tr.x === 1920 - 616 - 12 && tr.y === 12, JSON.stringify(tr));
const ce = pomowin.cornerOf(area, 616, 406, 'center');
check('居中：落在可用区中心', ce.x === Math.round((1920 - 616) / 2) && ce.y === Math.round((1040 - 406) / 2), JSON.stringify(ce));
// 窗口比可用区还大：不能算出负坐标把窗口顶出屏幕
const big = pomowin.cornerOf(area, 3000, 2000, 'bottom-right');
check('窗口过大时不会算出负坐标', big.x >= 12 && big.y >= 12, JSON.stringify(big));
check('未知位置返回 null（交给系统）', pomowin.cornerOf(area, 616, 406, 'system') === null);
// 副屏在左侧时，availLeft 是负的，必须跟着偏移
const neg = pomowin.cornerOf({ x: -1600, y: 40, w: 1600, h: 900 }, 616, 406, 'bottom-right');
check('副屏（availLeft 为负）位置跟随偏移', neg.x === -1600 + 1600 - 616 - 12, JSON.stringify(neg));

console.log('\n[4] 应用窗口设置');
const w1 = fakeWin({});
const doc1 = fakeDoc('is-popout-window');
const s1 = {
  popoutWidth: 616,
  popoutHeight: 406,
  popoutPos: 'bottom-right',
  popoutAlwaysOnTop: true,
  popoutBorderless: true,
};
// 注入全局，模块内部通过 activeWindow / activeDocument 取
global.activeWindow = w1;
global.activeDocument = doc1;
const r1 = pomowin.applyPopoutWindow(s1);
check('置顶已调用且为 true', findCall(w1, 'onTop').indexOf(true) >= 0, JSON.stringify(w1.__calls));
check('位置已按右下角落位', r1.positioned === true, JSON.stringify(r1));
const b1 = findCall(w1, 'bounds')[0];
check('落位尺寸 = 616 × 406', b1 && b1.width === 616 && b1.height === 406, JSON.stringify(b1));
check('落位坐标 = 右下角', b1 && b1.x === 1920 - 616 - 12 && b1.y === 1040 - 406 - 12, JSON.stringify(b1));
check('无边框 class 已加到 body', doc1.__list.indexOf('pomo-win-borderless') >= 0, doc1.__list.join(','));

// 关闭置顶：不该调用 setAlwaysOnTop
const w2 = fakeWin({});
global.activeWindow = w2;
const r2 = pomowin.applyPopoutWindow(Object.assign({}, s1, { popoutAlwaysOnTop: false }));
check('关闭置顶时不调用 setAlwaysOnTop', findCall(w2, 'onTop').length === 0, JSON.stringify(w2.__calls));
check('关闭置顶仍会定位', r2.positioned === true);

// 位置选 system：不干预
const w3 = fakeWin({});
global.activeWindow = w3;
const r3 = pomowin.applyPopoutWindow(Object.assign({}, s1, { popoutPos: 'system' }));
check('位置=系统决定时不调用 setBounds', findCall(w3, 'bounds').length === 0, JSON.stringify(w3.__calls));
check('位置=系统决定时仍会置顶', r3.onTop === true);

console.log('\n[5] 降级：拿不到 Electron 接口时不能抛异常');
const w4 = fakeWin({ electron: false });
global.activeWindow = w4;
let threw = false;
let r4 = null;
try {
  r4 = pomowin.applyPopoutWindow(s1);
} catch (e) {
  threw = true;
}
check('接口不可用时不抛异常', threw === false);
check('接口不可用时给出原因 no-electron', r4 && r4.reason === 'no-electron', JSON.stringify(r4));
check('接口不可用时无边框依然生效（纯 CSS）', doc1.__list.indexOf('pomo-win-borderless') >= 0);

console.log('\n[6] 无边框标记可撤销');
pomowin.setBorderless(false);
check('关掉后 class 被移除', doc1.__list.indexOf('pomo-win-borderless') < 0, doc1.__list.join(','));
pomowin.setBorderless(true);
check('再打开能加回来', doc1.__list.indexOf('pomo-win-borderless') >= 0);

console.log('\n[7] 默认值与迁移清洗');
check('默认宽度是 616', DEFAULT_SETTINGS.pomodoro.popoutWidth === 616, DEFAULT_SETTINGS.pomodoro.popoutWidth);
check('默认高度是 406', DEFAULT_SETTINGS.pomodoro.popoutHeight === 406, DEFAULT_SETTINGS.pomodoro.popoutHeight);
check('默认位置是右下角', DEFAULT_SETTINGS.pomodoro.popoutPos === 'bottom-right', DEFAULT_SETTINGS.pomodoro.popoutPos);
check('默认置顶开启', DEFAULT_SETTINGS.pomodoro.popoutAlwaysOnTop === true);
check('默认无边框开启', DEFAULT_SETTINGS.pomodoro.popoutBorderless === true);

const dirty = {
  pomodoro: {
    popoutPos: 'bottom-righttt',
    popoutAlwaysOnTop: 'false',
    popoutBorderless: 'yes',
    popoutWidth: 'abc',
    popoutHeight: -5,
  },
};
const m1 = migrateSettings(dirty);
check('拼错的位置被清洗回默认', m1.pomodoro.popoutPos === 'bottom-right', m1.pomodoro.popoutPos);
check('字符串 "false" 被清洗为布尔', m1.pomodoro.popoutAlwaysOnTop === true, String(m1.pomodoro.popoutAlwaysOnTop));
check('字符串 "yes" 被清洗为布尔', m1.pomodoro.popoutBorderless === true, String(m1.pomodoro.popoutBorderless));
// 类型不符（string vs 默认的 number）由 pickKnown 先回退默认，比"归零"更符合直觉：
// 用户没填过这个值时，拿到的应该是默认尺寸而不是 0（0 = 交给系统）。
check('非数字宽度回退默认值 616', m1.pomodoro.popoutWidth === 616, String(m1.pomodoro.popoutWidth));
check('负数高度归零', m1.pomodoro.popoutHeight === 0, String(m1.pomodoro.popoutHeight));
// 幂等
const m2 = migrateSettings(JSON.parse(JSON.stringify(m1)));
check('迁移幂等', JSON.stringify(m2.pomodoro.popoutWidth) === JSON.stringify(m1.pomodoro.popoutWidth));

// 废弃键不得残留
const withJunk = { pomodoro: { popoutPos: 'center', popoutZombie: 1 } };
const m3 = migrateSettings(withJunk);
check('废弃键 popoutZombie 被剔除', !('popoutZombie' in m3.pomodoro), Object.keys(m3.pomodoro).join(','));


console.log('\n[9] 尺寸留空时仍要定位（v2.93 修复点）');
/*
 * 以前「没填尺寸」会连带放弃定位：用户选了右下角，窗口却开在随机位置，
 * 界面上看就是"开关没效果"。现在尺寸留空（0 = 交给系统决定）时，
 * 用窗口当前实际尺寸去算角落 —— 大小交给系统，位置仍由我们摆。
 */
global.activeDocument = fakeDoc('is-popout-window');
const wReal = fakeWin({});
wReal.electronWindow.getBounds = () => ({ x: 100, y: 100, width: 700, height: 500 });
wReal.outerWidth = 700;
wReal.outerHeight = 500;
global.activeWindow = wReal;
const r9 = pomowin.applyPopoutWindow({
  popoutPos: 'bottom-right',
  popoutWidth: 0,
  popoutHeight: 0,
  popoutAlwaysOnTop: false,
  popoutBorderless: false,
});
check('宽高留空时仍然定位（不再整类放弃）', r9.positioned === true, JSON.stringify(r9));
const b9 = findCall(wReal, 'bounds').pop();
check('按实际尺寸算右下角 x = 1920-700-12', b9 && b9.x === 1208, b9 && b9.x);
check('按实际尺寸算右下角 y = 1040-500-12', b9 && b9.y === 528, b9 && b9.y);
check('尺寸留空时不擅自改大小', b9 && b9.width === 700 && b9.height === 500, b9 && (b9.width + 'x' + b9.height));

// Electron 拿不到尺寸时退回 DOM 的 outerWidth / outerHeight
const wDom = fakeWin({});
wDom.outerWidth = 640;
wDom.outerHeight = 480;
global.activeWindow = wDom;
pomowin.applyPopoutWindow({
  popoutPos: 'bottom-right',
  popoutWidth: 0,
  popoutHeight: 0,
  popoutAlwaysOnTop: false,
  popoutBorderless: false,
});
const b10 = findCall(wDom, 'bounds').pop();
check('无 getBounds 时退回 outerWidth（x = 1920-640-12）', b10 && b10.x === 1268, b10 && b10.x);
check('无 getBounds 时退回 outerHeight（y = 1040-480-12）', b10 && b10.y === 548, b10 && b10.y);

// 填了尺寸就按填的来
const wFix = fakeWin({});
wFix.electronWindow.getBounds = () => ({ width: 700, height: 500 });
global.activeWindow = wFix;
pomowin.applyPopoutWindow({
  popoutPos: 'bottom-right',
  popoutWidth: 616,
  popoutHeight: 406,
  popoutAlwaysOnTop: false,
  popoutBorderless: false,
});
const b11 = findCall(wFix, 'bounds').pop();
check('填了尺寸时按填的定型 616x406', b11 && b11.width === 616 && b11.height === 406, b11 && (b11.width + 'x' + b11.height));
check('填了尺寸时右下角 x = 1920-616-12', b11 && b11.x === 1292, b11 && b11.x);

console.log('\n[10] 重试与降级');
check('重试不少于 3 次（慢机器上最后一次才会生效）', pomowin.APPLY_DELAYS ? pomowin.APPLY_DELAYS.length >= 3 : false, pomowin.APPLY_DELAYS && pomowin.APPLY_DELAYS.length);
check('realSize 已导出（测试与排障都用它）', typeof pomowin.realSize === 'function');
const rs = pomowin.realSize(wReal.electronWindow, wReal);
check('realSize 优先取 getBounds', rs.w === 700 && rs.h === 500, rs.w + 'x' + rs.h);
const rs2 = pomowin.realSize(null, { outerWidth: 800, outerHeight: 600 });
check('realSize 无 Electron 时退回 DOM 尺寸', rs2.w === 800 && rs2.h === 600, rs2.w + 'x' + rs2.h);

delete global.activeWindow;
delete global.activeDocument;

console.log('\n' + (fail === 0 ? '全部通过' : fail + ' 项失败') + '（共 ' + total + ' 项）');
process.exit(fail === 0 ? 0 : 1);
