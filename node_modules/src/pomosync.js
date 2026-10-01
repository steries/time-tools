/*
 * 番茄钟跨窗口运行时同步（仅桌面端）。
 *
 * 为什么需要它：
 *   Obsidian 的「独立窗口」（pop-out window）是**另一个 Electron 窗口**，
 *   有自己的 Window / Document 和一份重新加载的插件实例。
 *   —— 也就是说，主窗口和独立窗口里各有一个 PomodoroController，
 *   彼此看不见对方的内存。若两边都各自计时、各自写笔记，
 *   就会出现「倒计时各跑一份、结束时重复记录两次」。
 *
 * 怎么解决：
 *   把运行时状态写到一个共享文件里，用「拥有者 + 心跳」决定谁负责推进：
 *     · 拥有者（owner）：唯一会推进段切换、播放提示音、写笔记的那个实例。
 *     · 镜像（mirror）：只渲染，不推进。谁最后点按钮，谁就成为新的拥有者。
 *   因为结束时间是**绝对时间戳**（endsAt），镜像即使完全不轮询，
 *   也能自己算出剩余时间；拥有者消失后由镜像接管，计时不会丢。
 *
 * 只同步「运行时」，不同步设置：
 *   设置走 data.json，由 Obsidian 自己保存。这里的文件不是配置，
 *   所以不进 migrateSettings 的白名单，也不允许用户编辑。
 */
'use strict';

/* 写在插件自己的配置目录里，不进笔记库，不会被同步 / 搜索 / 版本管理搅进来 */
const RUNTIME_FILE = '.obsidian/plugins/time-tools/pomo-runtime.json';
const HEARTBEAT_MS = 2000; // 拥有者写盘间隔，同时充当「我还活着」的心跳
const STALE_MS = 5000; // 心跳超过这么久没更新，其他实例可以接管
const POLL_MS = 1000; // 镜像读取共享文件的间隔
const FRESH_MS = 30000; // 冷启动时，文件比这还旧就当作上次崩溃的残留，丢弃
const VERIFY_EVERY = 3; // 拥有者每隔几次轮询回头确认一次归属（详见 verifyOwnership）

/** 与 pomodoro.js 的 ST.IDLE 保持一致：只有「未开始」才算没有会话 */
const IDLE = 'idle';

/** 需要跨窗口同步的运行时字段（与 PomodoroController 的字段一一对应） */
const SYNC_KEYS = [
  'state',
  'pendingState',
  'endsAt',
  'pausedRemainMs',
  'pausedFrom',
  'segmentTotalMs',
  'completedCycles',
  'focusedMs',
  'restMs',
  'longBreaks',
  'skippedFocus',
  'skippedBreak',
  'pauseCount',
  'totalPauses',
  'sessionStart',
  /* 正计时四个字段：缺了它们，镜像窗口只能用自己的本地基线（初始为 0 / Date.now()），
   * 显示的已过时长与主窗口对不上；主窗口达上限停表后，镜像的 countUp 仍为 true，
   * 一旦接管就会继续累加。达上限不同步就是这么来的。 */
  'countUp',
  'countUpBaseMs',
  'countUpStartAt',
  'countUpRemindCount',
  /* 软目标只响一次，不同步的话镜像接管后会再弹一次 */
  'countUpNotified',
];

/** 布尔型同步字段（applySnapshot 不能走 num()，否则 true 会变成 1，=== true 的判断全失效） */
const BOOL_KEYS = ['countUp', 'countUpNotified'];

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

class PomoSync {
  constructor(ctrl) {
    this.ctrl = ctrl;
    this.id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    this.pollId = null;
    this.lastWriteAt = 0;
    this.lastSeen = null; // 最近一次读到的共享状态，避免无谓的重复赋值
  }

  get adapter() {
    const app = this.ctrl.app;
    const vault = app && app.vault;
    return vault ? vault.adapter : null;
  }

  /**
   * 能否使用独立窗口：只有桌面端有 pop-out，且 vault 适配器能读写文件。
   * 这里必须逐级判空 —— 控制器在测试 / 未完全初始化时可能还没有 app，
   * 直接取 app.vault.adapter 会抛异常，把整个番茄钟拖挂。
   */
  get available() {
    if (this.ctrl.isMobile) return false;
    const a = this.adapter;
    return !!(a && typeof a.write === 'function');
  }

  /* ---------------- 读写 ---------------- */

  snapshot(active) {
    const c = this.ctrl;
    const out = {
      v: 1,
      owner: active ? this.id : null,
      updatedAt: Date.now(),
      active: !!active,
    };
    SYNC_KEYS.forEach((k) => {
      out[k] = c[k];
    });
    return out;
  }

  /** 把共享状态写回控制器。只赋值，不触发任何副作用（不启计时、不弹窗、不发声） */
  applySnapshot(s) {
    if (!s || typeof s !== 'object') return false;
    const c = this.ctrl;
    SYNC_KEYS.forEach((k) => {
      if (k === 'state' || k === 'pendingState' || k === 'pausedFrom') {
        if (typeof s[k] === 'string' || s[k] === null) c[k] = s[k];
      } else if (BOOL_KEYS.indexOf(k) >= 0) {
        c[k] = s[k] === true || s[k] === 1;
      } else {
        c[k] = num(s[k]);
      }
    });
    return true;
  }

  /** 用最近一次轮询到的共享状态对齐控制器（同步，不读文件） */
  applyLastSeen() {
    if (!this.lastSeen) return false;
    return this.applySnapshot(this.lastSeen);
  }

  async read() {
    try {
      const txt = await this.adapter.read(RUNTIME_FILE);
      const s = JSON.parse(txt);
      return s && typeof s === 'object' ? s : null;
    } catch (e) {
      return null; // 文件不存在 / 解析失败都当作「没有别的实例在跑」
    }
  }

  async write(active) {
    if (!this.available) return false;
    const s = this.snapshot(active);
    // 心跳限流：段切换等关键节点要立刻写，这里由调用方直接调 writeNow
    try {
      await this.adapter.write(RUNTIME_FILE, JSON.stringify(s));
      this.lastWriteAt = s.updatedAt;
      this.lastSeen = s;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 拥有者也要回头看一眼共享文件：确认自己仍是文件里承认的那个。
   *
   * 为什么必须有这一步：
   *   镜像接管时会把文件里的 owner 改成自己，但**原拥有者从来不读文件**，
   *   它根本不知道自己已被顶替，于是继续推进段切换、继续弹小结、继续写笔记
   *   —— 同一段结束被判定两次，笔记里多出一条重复记录。
   *   触发场景很常见：拥有者所在窗口被系统节流、合盖、或主线程卡了一会，
   *   心跳断超过 STALE_MS，对面就接过去了。
   *
   * 不必每次轮询都读文件（每秒读盘没必要），隔几次看一次即可。
   */
  async verifyOwnership() {
    this.verifyTick = (this.verifyTick || 0) + 1;
    if (this.verifyTick % VERIFY_EVERY !== 0) return;

    const s = await this.read();
    if (!s) {
      // 文件没了：说明有人结束并清理了会话。自己若不是那个结束者，就一并归位
      if (!this.ctrl.endedLocally) this.ctrl.retireFromSession();
      return;
    }
    if (!s.active) {
      this.ctrl.retireFromSession();
      return;
    }
    const foreign = s.owner && s.owner !== this.id;
    if (!foreign) return; // 文件里还是自己，正常
    // 对方的心跳也过期了的话谁都能抢，这里不动，交给下一轮正常流程
    if (Date.now() - num(s.updatedAt) >= STALE_MS) return;

    // 自己已被顶替：降级为镜像并全盘以文件为准，绝不能再推进
    this.applySnapshot(s);
    this.lastSeen = s;
    this.ctrl.isSessionOwner = false;
    this.ctrl.ownerConfirmed = false;
    this.ctrl.refreshUI();
  }

  /** 心跳：拥有者每隔 HEARTBEAT_MS 主动续一次 */
  heartbeat() {
    if (!this.ctrl.isSessionOwner) return;
    if (Date.now() - this.lastWriteAt < HEARTBEAT_MS) return;
    /*
     * active 必须与 ensureOwner / release 用同一口径：state !== IDLE。
     * 这里曾经写死 true —— 正计时达上限后 state 已是 idle、拥有者却还在位，
     * 心跳就把共享文件重新标成 active:true。镜像端据此走「镜像」分支而不是退场，
     * 浮窗不隐藏、卡在「会话还在跑但已经停表」的中间态；主窗口一旦关闭，
     * 对面的 adoptOnBoot 还会接手一个早已停表的空会话。
     */
    this.write(this.ctrl.state !== IDLE);
  }

  /** 交出控制权：新窗口打开时调用，让对方在下一个轮询周期立刻接管 */
  async release() {
    if (!this.available) return;
    const s = this.snapshot(this.ctrl.state !== IDLE);
    s.owner = null;
    try {
      await this.adapter.write(RUNTIME_FILE, JSON.stringify(s));
    } catch (e) {
      /* 写不进去也不影响本地继续跑 */
    }
  }

  /** 会话结束：清掉共享状态，别的窗口不再镜像 */
  async clear() {
    if (!this.available) return;
    try {
      await this.adapter.remove(RUNTIME_FILE);
    } catch (e) {
      /* 没有这个文件就不用删 */
    }
  }

  /* ---------------- 归属 ---------------- */

  /** 用户点了界面上的按钮：确保本实例是拥有者，之后再执行动作 */
  async ensureOwner() {
    if (!this.available) {
      this.ctrl.ownerConfirmed = true;
      return;
    }
    const s = await this.read();
    if (s && s.active && s.owner && s.owner !== this.id && Date.now() - num(s.updatedAt) < STALE_MS) {
      this.applySnapshot(s); // 以文件为准，避免本实例的数字落后
    }
    const ok = await this.write(this.ctrl.state !== IDLE);
    // 写成功才算真正拿到归属；写失败就退回镜像，交给下一个轮询周期重试
    this.ctrl.ownerConfirmed = !!ok;
    if (!ok) this.ctrl.isSessionOwner = false;
  }

  /**
   * 冷启动接管：上一次 Obsidian 关闭时若有会话还在跑，
   * 且文件足够新（< FRESH_MS），就由本实例接着跑。
   * 太旧的一律丢弃 —— 那多半是崩溃残留，接过来会得到一个早已过期的倒计时。
   */
  async adoptOnBoot() {
    if (!this.available) return false;
    const s = await this.read();
    if (!s || !s.active) return false;
    if (Date.now() - num(s.updatedAt) > FRESH_MS) {
      await this.clear();
      return false;
    }
    this.applySnapshot(s);
    this.ctrl.isSessionOwner = true;
    this.ctrl.ownerConfirmed = false;
    this.ctrl.startTicker();
    const ok = await this.write(true);
    this.ctrl.ownerConfirmed = !!ok;
    return ok;
  }

  /* ---------------- 轮询 ---------------- */

  startPolling() {
    if (this.pollId !== null || !this.available) return;
    this.pollId = setInterval(() => this.poll(), POLL_MS);
    if (typeof this.ctrl.plugin.registerInterval === 'function') {
      this.ctrl.plugin.registerInterval(this.pollId);
    }
  }

  stopPolling() {
    if (this.pollId !== null) {
      clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  /**
   * 一次轮询。三种走向：
   *   1. 自己是拥有者 → 只续心跳；
   *   2. 别人是拥有者且心跳新鲜 → 镜像它的状态；
   *   3. 拥有者空缺或心跳过期 → 接管，由本实例继续推进。
   */
  async poll() {
    if (!this.available) return;
    const c = this.ctrl;
    if (c.isSessionOwner) {
      this.heartbeat();
      await this.verifyOwnership();
      return;
    }
    const s = await this.read();
    if (!s || !s.active) {
      /*
       * 共享文件没了（或已被标为结束）：拥有者已经结束并清理了会话，
       * 本实例跟着退场，否则 UI 会一直停在旧的倒计时数字上，看着像还在跑。
       * retireFromSession 内部按 state 短路，冷启动这种「本来就没会话」的情形不会误伤。
       */
      c.retireFromSession();
      return;
    }
    const age = Date.now() - num(s.updatedAt);
    const foreign = s.owner && s.owner !== this.id;
    if (foreign && age < STALE_MS) {
      // 镜像：值变了才写回，避免每秒无谓地覆盖控制器字段
      if (!this.lastSeen || this.lastSeen.updatedAt !== s.updatedAt) {
        this.applySnapshot(s);
        this.lastSeen = s;
        c.startTicker(); // 只渲染，不会推进（tick 里按 isSessionOwner 分流）
        c.refreshUI();
      }
      return;
    }
    // 接管：确认前不推进段切换，避免与原拥有者同时判定结束
    this.applySnapshot(s);
    this.lastSeen = s;
    c.isSessionOwner = true;
    c.ownerConfirmed = false;
    c.startTicker();
    const ok = await this.write(true);
    c.ownerConfirmed = !!ok;
  }
}

module.exports = { PomoSync, RUNTIME_FILE, SYNC_KEYS, BOOL_KEYS };
