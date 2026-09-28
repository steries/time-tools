/*
 * 独立窗口（pop-out window）的外观 / 层级 / 位置控制。
 *
 * 为什么单独一个文件：
 *   它只跟「系统窗口」打交道，不碰计时逻辑，也不碰跨窗口同步（那是 pomosync.js）。
 *   独立窗口里插件会重新加载一份实例，这里的函数只在**本窗口**内生效，
 *   所以定位、置顶都必须在 pop-out 那份实例里调用 ——
 *   主窗口的 activeWindow 指向主窗口自己，改不到 pop-out 上。
 *
 * 一条硬边界（写在最前面，免得后来人反复试）：
 *   Electron 的 frame / titleBarStyle **只能在 new BrowserWindow() 时指定**，
 *   运行时没有任何 API 能改。pop-out 窗口由 Obsidian 自己创建，
 *   插件拿不到构造参数 —— 所以「连系统标题栏一起去掉」做不到。
 *   这里能做的是把窗口**内部**的 Obsidian 界面元素（标签栏、状态栏、侧边栏）隐藏，
 *   让番茄钟铺满内容区，视觉上贴边；顶部那条系统标题栏仍在。
 */
'use strict';

/* 无边框：加在 pop-out 窗口 body 上的标记，样式见 styles.css */
const BORDERLESS_CLASS = 'pomo-win-borderless';
/* 与屏幕可用区边缘留的距离，避免贴死边角 */
const EDGE_MARGIN = 12;
/*
 * 桌面常驻（方案 B）的默认窗口尺寸。
 * 这是「缩小后的主窗口」大小，不是番茄钟浮窗的大小 ——
 * 主窗口还要容纳自己的标题栏与状态栏，所以要比浮窗本体略大一圈。
 */
const DESK_DOCK_W = 365;
const DESK_DOCK_H = 378;
/*
 * 开窗后窗口未必立刻完成布局：Obsidian 建好 pop-out 之后还会自己摆一次位置，
 * 只设一次会被它覆盖掉。所以分多次重试，间隔逐渐拉长。
 * 这几个数是实测出来的：只试 0/150 时，慢一点的机器上最后一次仍会被系统覆盖。
 */
const APPLY_DELAYS = [0, 150, 400, 900];

/** 位置枚举：'system' 表示完全交给系统，插件不干预 */
const VALID_POPOUT_POS = ['system', 'center', 'bottom-right', 'bottom-left', 'top-right', 'top-left'];
const POPOUT_POS_OPTIONS = [
  ['bottom-right', '右下角'],
  ['bottom-left', '左下角'],
  ['top-right', '右上角'],
  ['top-left', '左上角'],
  ['center', '屏幕居中'],
  ['system', '交给系统决定'],
];

/** 这个窗口能不能拿来控窗口（有没有 Electron 接口） */
function usableWin(w) {
  const ew = w && w.electronWindow;
  return !!(ew && typeof ew.setAlwaysOnTop === 'function');
}

/**
 * 本实例所在的窗口 —— 优先取本地 window，不要用 activeWindow。
 *
 * activeWindow 是"当前有焦点的那个窗口"，不是"我这个实例所在的窗口"。
 * 开着独立窗口、或焦点落在别处时，它会指向别人，
 * 于是"缩小主窗口"变成缩小另一个窗口（桌面常驻最初就是这么错的）。
 * 每个窗口有自己的 JS 上下文，本地 window 永远是自己，这才是该用的那个。
 */
function curWindow() {
  const own = typeof window !== 'undefined' && window ? window : null;
  const act = typeof activeWindow !== 'undefined' && activeWindow ? activeWindow : null;
  // 只有本窗口确实拿不到窗口接口时才退回 activeWindow
  if (own && usableWin(own)) return own;
  if (act && usableWin(act)) return act;
  return own || act;
}
/**
 * 文档：仍以 activeDocument 优先。
 * 与窗口不同，这里没有"接口在不在"可作判据，改优先级只会让沙盒 stub 抢在前面，
 * 而且 DOM 操作本来就发生在调用方那一侧的文档上。
 */
function curDocument() {
  if (typeof activeDocument !== 'undefined' && activeDocument) return activeDocument;
  return typeof document !== 'undefined' ? document : null;
}

/**
 * 当前实例是否跑在 pop-out 窗口里。
 * Obsidian 会给 pop-out 窗口的 body 加 is-popout-window，主窗口没有。
 */
function isPopoutWindow(doc) {
  const d = doc || curDocument();
  // 判 contains 是否存在：某些环境（含测试 mock）的 classList 是残缺对象，
  // 直接调 contains 会抛异常，而这个函数本该在任何环境下都安全返回布尔。
  const cl = d && d.body && d.body.classList;
  return !!(cl && typeof cl.contains === 'function' && cl.contains('is-popout-window'));
}

/**
 * 拿到本窗口的 Electron BrowserWindow。
 * 拿不到返回 null —— 这是常态之一（移动端、Obsidian 收紧了 remote、
 * 或未来版本改名），调用方必须能降级，不能当成错误抛出。
 */
function electronWindow(w) {
  const win = w || curWindow();
  const ew = win && win.electronWindow;
  // 至少要能置顶才认为可用：只判存在不判方法，会在低版本上抛异常
  if (!ew || typeof ew.setAlwaysOnTop !== 'function') return null;
  return ew;
}

/** 屏幕可用区（排除任务栏 / 菜单栏），拿不到返回 null */
function screenArea(w) {
  const win = w || curWindow();
  const s = win && win.screen;
  if (!s) return null;
  const x = Number(s.availLeft) || 0;
  const y = Number(s.availTop) || 0;
  const aw = Number(s.availWidth) || Number(s.width) || 0;
  const ah = Number(s.availHeight) || Number(s.height) || 0;
  if (!(aw > 0) || !(ah > 0)) return null;
  return { x: x, y: y, w: aw, h: ah };
}

/**
 * 窗口当前的实际尺寸。
 *
 * 为什么需要：位置定位必须知道窗口多大（算右下角要减掉窗口宽高）。
 * 用户在设置里把宽高留空（0，表示「交给系统决定」）时，不能因此放弃定位
 * —— 那正是最需要定位的情况：系统给的窗口尺寸各异，不定位就会开在随机位置。
 * 优先问 Electron 要精确值，拿不到再退回 DOM 的 outerWidth / outerHeight。
 */
function realSize(ew, w) {
  if (ew && typeof ew.getBounds === 'function') {
    try {
      const b = ew.getBounds();
      if (b && Number(b.width) > 0 && Number(b.height) > 0) {
        return { w: Math.round(Number(b.width)), h: Math.round(Number(b.height)) };
      }
    } catch (e) {
      /* getBounds 抛异常就继续往下退，不当成错误 */
    }
  }
  const win = w || curWindow();
  return {
    w: Math.round(Number(win && win.outerWidth) || 0),
    h: Math.round(Number(win && win.outerHeight) || 0),
  };
}

/** 按位置枚举算左上角坐标；窗口比可用区还大时退回到可用区原点，不让它跑出屏幕 */
function cornerOf(area, bw, bh, pos) {
  const m = EDGE_MARGIN;
  const maxX = Math.max(area.x + m, area.x + area.w - bw - m);
  const maxY = Math.max(area.y + m, area.y + area.h - bh - m);
  switch (pos) {
    case 'bottom-right':
      return { x: maxX, y: maxY };
    case 'bottom-left':
      return { x: area.x + m, y: maxY };
    case 'top-right':
      return { x: maxX, y: area.y + m };
    case 'top-left':
      return { x: area.x + m, y: area.y + m };
    case 'center':
      return {
        x: area.x + Math.round((area.w - bw) / 2),
        y: area.y + Math.round((area.h - bh) / 2),
      };
    default:
      return null;
  }
}

/**
 * 应用窗口设置：置顶 + 尺寸 + 位置 + 无边框标记。
 *
 * @param {object} s  settings.pomodoro
 * @returns {{onTop:boolean, positioned:boolean, borderless:boolean, reason:string}}
 *   reason 为 null 表示全部成功；否则是第一个失败的原因，供设置界面提示。
 */
function applyPopoutWindow(s) {
  const out = { onTop: false, positioned: false, borderless: false, reason: null };
  if (!s) return out;

  // 无边框是纯 CSS 标记，不依赖 Electron，先做 —— 拿不到窗口也要生效
  setBorderless(!!s.popoutBorderless);
  out.borderless = !!s.popoutBorderless;

  const ew = electronWindow();
  if (!ew) {
    out.reason = 'no-electron';
    return out;
  }

  // 置顶
  if (s.popoutAlwaysOnTop !== false) {
    try {
      ew.setAlwaysOnTop(true);
      out.onTop = true;
    } catch (e) {
      if (!out.reason) out.reason = 'onTop-failed';
    }
  }

  // 尺寸 + 位置
  const pos = VALID_POPOUT_POS.indexOf(s.popoutPos) >= 0 ? s.popoutPos : 'system';
  if (pos === 'system') {
    if (!out.reason) out.reason = 'pos-system';
    return out;
  }
  const area = screenArea();
  if (!area) {
    if (!out.reason) out.reason = 'no-screen';
    return out;
  }
  /*
   * 宽高留空（0）时用窗口实际尺寸（realSize），不放弃定位：「交给系统定尺寸」
   * 与「放到右下角」可同时成立。曾把两者绑死，表现为「选了右下角却没反应」。
   */
  const real = realSize(ew);
  const bw = Math.round(Number(s.popoutWidth)) > 0 ? Math.round(Number(s.popoutWidth)) : real.w;
  const bh = Math.round(Number(s.popoutHeight)) > 0 ? Math.round(Number(s.popoutHeight)) : real.h;
  if (!(bw > 0) || !(bh > 0)) {
    if (!out.reason) out.reason = 'no-size';
    return out;
  }
  const at = cornerOf(area, bw, bh, pos);
  if (!at) return out;

  // 先按目标尺寸定型再定位：分两次调用会闪一下，setBounds 一次到位
  try {
    if (typeof ew.setBounds === 'function') {
      ew.setBounds({ x: at.x, y: at.y, width: bw, height: bh });
    } else if (typeof ew.setPosition === 'function') {
      ew.setPosition(at.x, at.y);
    } else {
      if (!out.reason) out.reason = 'no-move-api';
      return out;
    }
    out.positioned = true;
  } catch (e) {
    if (!out.reason) out.reason = 'move-failed';
  }
  return out;
}

/** 分多次延迟重试（见 APPLY_DELAYS）：开窗瞬间窗口未必已定型，只设一次会被覆盖 */
function applyPopoutWindowSoon(s) {
  const first = applyPopoutWindow(s);
  APPLY_DELAYS.forEach((ms) => {
    if (ms <= 0) return;
    setTimeout(() => applyPopoutWindow(s), ms);
  });
  return first;
}

/** 无边框标记：加在窗口 body 上，因为要影响整个 workspace 的界面元素 */
function setBorderless(on) {
  const d = curDocument();
  const cl = d && d.body && d.body.classList;
  if (!cl || typeof cl.add !== 'function' || typeof cl.remove !== 'function') return false;
  if (on) cl.add(BORDERLESS_CLASS);
  else cl.remove(BORDERLESS_CLASS);
  return true;
}

/**
 * 当前窗口的完整 bounds（含位置）。
 * 桌面常驻要把它存下来才能还原 —— 主窗口被缩小后如果用户不恢复，
 * Obsidian 就一直是个小窗，那是比不做这个功能更糟的后果。
 */
function currentBounds(ew) {
  if (!ew || typeof ew.getBounds !== 'function') return null;
  try {
    const b = ew.getBounds();
    if (!b || !(Number(b.width) > 0) || !(Number(b.height) > 0)) return null;
    return {
      x: Math.round(Number(b.x) || 0),
      y: Math.round(Number(b.y) || 0),
      width: Math.round(Number(b.width)),
      height: Math.round(Number(b.height)),
    };
  } catch (e) {
    return null;
  }
}

/** 判断一个值是不是可用的 bounds 存档（防止把残缺对象当成恢复依据） */
function isBounds(b) {
  return !!(b && Number(b.width) > 0 && Number(b.height) > 0);
}

/**
 * 桌面常驻：把**主窗口**缩成番茄钟大小、置顶、摆到屏幕角上。
 *
 * 为什么需要这个方案：
 *   「独立窗口无边框」做不到 —— Electron 的 frame / titleBarStyle 只能在
 *   new BrowserWindow() 时指定，pop-out 由 Obsidian 创建，插件拿不到构造参数，
 *   所以系统标题栏那条边框永远在。用户要的是「桌面上常驻一个小番茄钟」，
 *   独立窗口达不到，那就反过来：把主窗口本身缩成小窗并置顶。
 *
 * 必须在**主窗口**里调用（electronWindow 指向本窗口）。
 *
 * @param {boolean} on   开启 / 关闭
 * @param {object} s     settings.pomodoro（会读写 deskDockRestore）
 * @returns {{ok:boolean, restored:boolean, reason:string, bounds:object|null}}
 */
function applyDeskDock(on, s) {
  const out = { ok: false, restored: false, reason: null, bounds: null };
  if (!s) return out;

  const ew = electronWindow();
  if (!ew || typeof ew.setBounds !== 'function') {
    out.reason = 'no-electron';
    return out;
  }

  if (on) {
    /*
     * 只有没存档时才记录原尺寸：重复开启不能把已经缩小后的尺寸存成「原尺寸」，
     * 否则关掉开关只会把窗口还原成小窗，等于把用户的主窗口永久弄小。
     */
    if (!isBounds(s.deskDockRestore)) s.deskDockRestore = currentBounds(ew);

    const area = screenArea();
    const w = Math.round(Number(s.deskDockWidth)) > 0 ? Math.round(Number(s.deskDockWidth)) : DESK_DOCK_W;
    const h = Math.round(Number(s.deskDockHeight)) > 0 ? Math.round(Number(s.deskDockHeight)) : DESK_DOCK_H;
    try {
      ew.setAlwaysOnTop(s.deskDockOnTop !== false);
      if (area) {
        const at = cornerOf(area, w, h, s.deskDockPos || 'bottom-right');
        if (at) ew.setBounds({ x: at.x, y: at.y, width: w, height: h });
        else ew.setBounds({ width: w, height: h });
      } else {
        // 读不到屏幕就不挪位置，只改大小 —— 挪到错误位置比不动更糟
        ew.setBounds({ width: w, height: h });
      }
      out.ok = true;
      out.bounds = { width: w, height: h };
    } catch (e) {
      out.reason = 'apply-failed';
    }
    return out;
  }

  // 关闭：恢复原尺寸与位置，并取消置顶
  const b = isBounds(s.deskDockRestore) ? s.deskDockRestore : null;
  try {
    ew.setAlwaysOnTop(false);
    if (b) {
      ew.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
      out.restored = true;
    }
    out.ok = true;
  } catch (e) {
    out.reason = 'restore-failed';
  }
  // 恢复完立刻清空存档：不留在 data.json 里变成废弃数据
  s.deskDockRestore = null;
  return out;
}

module.exports = {
  BORDERLESS_CLASS: BORDERLESS_CLASS,
  VALID_POPOUT_POS: VALID_POPOUT_POS,
  POPOUT_POS_OPTIONS: POPOUT_POS_OPTIONS,
  EDGE_MARGIN: EDGE_MARGIN,
  APPLY_DELAYS: APPLY_DELAYS,
  isPopoutWindow: isPopoutWindow,
  electronWindow: electronWindow,
  realSize: realSize,
  screenArea: screenArea,
  cornerOf: cornerOf,
  applyPopoutWindow: applyPopoutWindow,
  applyPopoutWindowSoon: applyPopoutWindowSoon,
  setBorderless: setBorderless,
  currentBounds: currentBounds,
  isBounds: isBounds,
  applyDeskDock: applyDeskDock,
  DESK_DOCK_W: DESK_DOCK_W,
  DESK_DOCK_H: DESK_DOCK_H,
};
