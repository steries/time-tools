# ARCHITECTURE.md — 给 AI 的项目速查手册

> 面向**要改代码的人/AI**。用户文档看 `README.md`。
> 目标：不靠历史对话，10 秒看懂全局，按需求直达对应模块。

## 作者

| 角色 | 署名 | 分工 |
|---|---|---|
| 提出者 | **Stray** | 需求、交互设计、验收与上架 |
| 协作者 | **元宝（Yuanbao）** | 代码实现、测试体系、文档维护 |

> 上架字段 `manifest.json` 的 `author` 为 `Stray`（商店要求单值）；`LICENSE` 版权归 Stray。
> 本表记录的是实际协作关系，不影响上述字段。

---

## ⚠️ 改完代码必须同步本文件

| 改了什么 | 必须更新哪节 |
|---|---|
| 增删命令 | §5 |
| 增删转换项 | §2 转换项表 |
| 改解析规则 | §3 解析层 |
| 改撤回行为 | §4 撤回 |
| 合并/拆分文件 | §1、§9 |
| 踩了新坑 | §10 踩坑表 |

**最容易失效的是行号**。改完跑 `node _test/arch-doc.js`，它会校验文档里写死的清单与代码是否一致。

### 交付前必做（血泪教训）

**v2.33、v2.34 声称已修改但实际没落盘**，用户装了三版没变化才暴露。之后又发生过两次。

所以：

1. 改完 **必须** `node build.js` 生成产物
2. **必须**从**产物**（`main.js` 或压缩包）里 `grep` 新代码，确认真的在
3. 不能只从 `src/` 目录 grep——构建可能没跑
4. 回复用户时附上真实命令输出，附不上就是没做

---

## 0. 三十秒速览

```
14 个源文件 →  22 个转换项 →  2 条撤回路径 →  4 种周期笔记
```

**十一个核心文件**（速览）

| 文件 | 职责 |
|---|---|
| `settings.js` | 配置 schema、迁移、设置页外壳 |
| `timestamp.js` | 时间戳 + 时间文本转换 + 撤回 + 批量转换（最大，~4700 行） |
| `lunar.js` | 农历 1900–2100 查表 + 节气天文算法（零依赖纯计算，从 timestamp.js 拆出） |
| `pomodoro.js` | 番茄钟 + 六套主题 + 三种界面形态 + 正计时 + 累计统计 |
| `pomosync.js` | 番茄钟跨窗口运行时同步（仅独立窗口形态用到） |
| `pomowin.js` | 独立窗口的尺寸/位置/置顶/无边框（只在本窗口内生效） |
| `recorder.js` | 会话记录：写笔记 / QuickAdd / 补跑（从 pomodoro.js 拆出） |
| `main.js` | 入口，只做装配 |
| `configio.js` | 配置的导出备份与导入（走 `migrateSettings` 白名单清洗） |
| `i18n.js` | 设置界面语言**逻辑**：简体中文兜底 + 查表 + 简繁转换（零依赖） |
| `i18n-en.js` | 界面语言**英文文案表**（纯数据、无逻辑；v3.26 从 i18n.js 拆出，因它是数据会持续长大） |

另有 `calendar.js`（日历视图与圆点）、`note.js`（周期笔记）、`timejudge.js`（时间口径判断表，零依赖）三个，见 §9 —— 合计 **14 个源文件**。

**三层数据流**——改东西先判断在哪一层：

```
输入文本
  ↓ 【解析层】parseToDate / parseRelative / parseComposite / parseLunar
Date 对象
  ↓ 【计算层】compute(key, raw, options) → 22 个转换项
结果字符串
  ↓ 【写入层】TimeActionModal.apply() → 替换选区 + 记撤回
正文
```

**三条硬约束**（勿违反）：

1. **文件不再合并** —— 4 个是最小合理值（`settings.js` 被 require，并入 main 会成环）
2. **撤回记录只在内存** —— 不写 data.json，关闭 Obsidian 即清空
3. **正文不写标记字符** —— 撤回图标是编辑器装饰，不是文本
4. **改完必须从产物验证** —— src 与产物是两条 require 路径，src 测试通过不代表产物能用
5. **配置只按白名单合并** —— 防止废弃字段在 data.json 里堆积（见 `pickKnown`）
6. **斜杠命令默认关闭** —— `/` 是公共资源，默认让位给 Templater / Slash Commander 等插件
7. **不在 onload 里操作工作区** —— 必须延后到 `onLayoutReady`，否则会干扰同时初始化的其他插件
8. **onload / onunload 都不许抛错** —— 抛错会中断 Obsidian 的加载或关闭流程，连累别的插件

---

## 1. 速查：我要改 X，去哪

| 需求 | 文件 | 位置 |
|---|---|---|
| 加/改一个转换项 | `settings.js` | `ACTION_DEFS` + `timestamp.js` `compute` |
| 改识别能力（认不出某种写法） | `timestamp.js` | `parseToDate` / `parseRelative` / `parseComposite` |
| 改农历算法 | `lunar.js` | `parseLunar` / `solarToLunar` |
| 改中文月日解析 | `lunar.js` | `parseCnMonth` / `parseArabicMonth` |
| 改日期归属（农历/阳历判断） | `timestamp.js` | `shouldTreatAsLunar` |
| 改输出格式 | `timestamp.js` | `fmt` |
| 改相对时间 | `timestamp.js` | `toRelative` |
| 撤回出问题 | `timestamp.js` | `recordUndoEntry` / `restoreEntry` |
| 撤回图标不显示 | `timestamp.js` | `attachUndoWidget` / `buildCm6Extension` |
| 改面板 UI | `timestamp.js` | `TimeActionModal` |
| 加/改命令 | `timestamp.js` | `registerTimeActions` |
| 加设置项 | `settings.js` | `defaultExtensions` + 渲染函数 |

> 时刻分隔符**同时接受英文 `:` 与中文 `：`**（输入宽容），但**输出一律英文冒号**（输出从严）——
> 产出的文本要存进笔记、可能被别的工具再解析，必须规范统一。
| 改番茄钟流程 | `pomodoro.js` | `PomodoroController` |
| 改番茄钟弹窗 | `pomodoro.js` | `StartModal` 等 |
| 改会话记录 | `recorder.js` | `Recorder` / `renderRecordSettings` |
| 改配置迁移 | `settings.js` | `migrateSettings` |
| 改配置备份（导出/导入） | `configio.js` | `exportConfig` / `importConfig`（导入必走白名单） |
| 改累计统计 | `pomodoro.js` / `recorder.js` | `accumulateStats` / `showStats` / `readCustomStats`（数据源 `statsSource`，含 `custom` 自定义位置） |
| 改 DataView 联动 | `recorder.js` | `dataviewLine` + `resolveDvVar` + `hasDataview`（总开关 `dataviewEnabled` 默认关；字段表 `dataviewFields` 一行一个 `字段名::{{VALUE:变量名}}`，默认只写专注时长；`hasDataview` 只用于设置页状态提示，不参与写入） |
| 改批量转换 | `timestamp.js` | `scanBatch` / `BatchConvertModal`（上限 `BATCH_MAX`） |
| 改正计时跨窗口同步 | `pomosync.js` | 同步载荷须含 `countUp*` 四态，否则镜像用自己的起点算 |

---

## 2. 配置与转换项（`settings.js`）

**22 个转换项**：数据上按 `ACTION_DEFS.group` 分 **5 组**（见下表），界面上按 `ACTION_GROUPS` 渲染为 **4 个区**（逆向项并入各区，不单列 `reverse` 分区）。两个概念不是一回事，别互相改。

| 组 | key |
|---|---|
| 常用 | `unify` `relative` `weekday` `dailyLink` `unixEncode` `unixDecode` `dateShift` `fillDate` `timePart` |
| 农历 | `lunar` `lunarGanzhi` `solarTerm` `lunarToSolar` `termToDate` `ganzhiToYear` |
| 逆向 | `relativeToDate` `linkToDate` `stripWeekday` |
| 节日 | `festival` `festivalToDate` |
| 倒计时 | `countdown` `dateDiff` |

**正逆配对**（`ACTION_PAIRS`）：八对各合成**一个开关**——
`relative⇄relativeToDate`、`weekday⇄stripWeekday`、`dailyLink⇄linkToDate`、
`unixEncode⇄unixDecode`、`lunar⇄lunarToSolar`、`lunarGanzhi⇄ganzhiToYear`、
`solarTerm⇄termToDate`、`festival⇄festivalToDate`。

**倒计时 / 日期差值**（`countdown` `dateDiff`）**不成对**，各占一个开关，且**默认关闭**——
它们的输出会把选中的日期替换成一个数字，误触等于丢原文，所以做成「想要才开」。

**节日转换**：内置表在 `timejudge.js` 的节日区（阳历固定 + 农历浮动，均为常量）；
用户自设节日存 `extensions.customFestivals`，一行一条，
解析见 `parseCustomFestivals`，日期计算见 `festivalDate`（农历的现算，不查固定表）。
日期写法有五种：阳历带年、阳历月日、农历月日、**第 N 个星期几**
（`5月第2个周日`）、**当月最后一个 / 倒数第 N 个星期几**
（`11月最后一个周四`、`11月倒数第2个周四`，正则 `LAST_WEEKDAY_RE`）。
倒数类在 `festivalDate` 里单独一支走「从月末往回数」——
必须先用 `new Date(year, month, 0)` 取真实天数，2 月直接减会算出负数。

两个方向的输出都由 `festivalPrefix` 控制（默认开）：打开时统一成「节日名 + 日期」，
关闭时正向只给名称、逆向只给日期。农历节日受 `lunarEnabled` 总开关管辖。

**自定义转换规则**（`userRules`，一行一条 `原式 操作符 结果`）：
出口统一包在 `compute()`（先 `computeBuiltin` 再 `applyUserRules`），
分散写会漏（历史教训：曾在「统一格式」路径下整个失效）。
默认**只对选中转换生效**；`userRulesForCalendar`（**默认关**）打开后，
`parseNoteRef` 在匹配格式前会先套同一份规则（见 `applyUserRulesToName`），
用来让旧命名不改名也被认出来。
注意日历场景的 `=` 是**子串替换**而非整体替换：主用途是剥掉旧命名后缀
（`日记本-2026年09月25日 = 2026-09-25`），整体替换会把整个名字清空反而认不出。

**高级开关**：`separateDirections`（展开成正/逆两个独立开关，默认关）、
`collapseItems`（折叠列表，默认关）。

**精度**：`preciseToSecond`（默认关＝只到分，开＝到秒）。在 `fmt` 统一出口处理，
你自己填的格式串里的 `ss` 也会被去掉。

**`appendOnAutoPick`**：光标自动识别时，追加结果（开）还是覆盖原文（默认关）。

---

## 3. 解析层（`timestamp.js`）

**优先级顺序很关键**，改正则时不要打乱：

```
1. Unix 时间戳（10/13 位纯数字）
2. 紧凑 8 位（20260919）
3. 只有时分（14:30 / 14:30:25） ← 必须早于「只有月日」
4. 完整日期
5. 只有月日（09-17，补今年）
6. 口语相对日（明天 / 后天 / 昨天）
7. 复合表达（明年12月的第49周周三下午2点）
8. 农历 / 中文大写
```

**宽松分隔符**：`[\s\-/._]*`，支持 `2026 09-19`、`2026_09_19`、`2026.09.19`。

**中文数字**用**规则解析**（不是查表）：组合无穷，表会无限膨胀。

**归属判断** `shouldTreatAsLunar` ：

| 写法 | 默认 | 开 `lunarOnCnUpper` | 开 `lunarOnHao` |
|---|---|---|---|
| `五月十六` | 农历 | 农历 | 农历 |
| `五月十六号` | 农历 | 农历 | 农历 |
| `五月十六日` | **阳历** | 农历 | 阳历 |

### 英文时间解析（v3.31 补）

README 早有承诺、代码却**零处 am/pm 处理**，于是 `8am` 连 `looksLikeRelative`
都过不了——**转换菜单根本不弹**，用户看到的是"完全没反应"（比算错更难发现）。

| 函数 | 作用 |
|---|---|
| `parseClockEN` | `8am` / `7:30pm` / `5 pm` / `noon` / `midnight`；12 小时制约定 `12am`=00:00、`12pm`=12:00，`13pm` 判 null |
| `splitEnglishDayClock` | 「口语日 + 时刻」：`tomorrow 5pm`、`next Monday 10am`。词表**复用 `WORD_REL`**（只把首尾锚定换成前缀匹配），不另抄一份英文词表 |
| `applyWordYmd` | 按 `WORD_REL` 的 y/m/d 推进基准日；**月份走 `addMonthsClamped`**，否则 01-31 的 `next month` 会变 03-03 |

⚠️ **`convertDaypartAlone` 门控只管「裸时段词」**：那个开关的本意是"单独选中『早上』别给它编 09:00"。
而 `WORD_REL` 里带 `daypart` 的 8 条（`this morning` / `last night` …）**全都有日期锚点**，
时段是**限定词**不是模糊词，不受该开关限制。判断依据是"有没有日期锚点"，不是"是不是时段词"。

**「中午」口径**：中午覆盖 11:00~13:00，**11、12 点不动，1~10 点按 PM**（中午1点=13:00）。
不能简单把「中午」标成 `pm:true` —— 那会让「中午11点」变成 23:00。
由 `parseClockCN` 的 `noon` 分支实现（各返回点统一走 `apm()`，改口径只改一处）。

**月/年推进必须钳制**：`setMonth` 在月末**静默进位**——01-31 +1月 → 03-03（跨过整个二月），
03-31 −1月 → 03-03（**日期反而前进**），2024-02-29 +1年 → 2025-03-01。
统一走 `addMonthsClamped`（先归 1 号再进位，最后钳到该月天数）。
| `5月16号` | 阳历 | 阳历 | 农历 |

`parseCnSolarDate` 负责中文大写的**阳历**解析——缺它的话
「五月十六日」两边都不认。

**农历总开关** `lunarEnabled`（默认开）：关掉后所有农历相关项失效，子开关隐藏。
在 `compute` 开头用 `LUNAR_KEYS` 清单拦截（因为农历项分散在两个组里）。

---

## 4. 撤回（`timestamp.js`）

> 面向用户的行为说明（四种方式、生命周期、开关、边界、排查）在 **README §二「撤回转换」**，
> 不在本文件。原 `UNDO-FEATURE.md` 已并入，勿再新建单独文档——两份必然漂移。

**路径按可靠性排序**：

| 方式 | 依赖 | 可用性 |
|---|---|---|
| 状态栏指示器 `initUndoIndicator` | 无（`addStatusBarItem`） | **始终** |
| 命令 `time-tools-timestamp-undo-convert` | 无 | **始终** |
| 结果后的图标 | CM6 装饰 | 尽力而为 |
| Ctrl+Z | 系统 | 系统能力 |

**状态栏是撤回的可靠可见入口**：显示当前笔记可撤回数量，点击撤最近一次；
数量为 0 或开关关闭时隐藏。它补上了"命令可靠但不可见"的缺口。
切换笔记时通过 `file-open` / `active-leaf-change` 刷新。

**图标挂不上要能定位**：`setUndoFail()` 把失败原因记进 `lastUndoFailReason`，
测试直接断言它——之前只打 console.error，界面上看不到，也测不到。
（曾有一条「时间戳：诊断」命令把它显示出来，已按用户要求移除。）

**顺序不能反**：`apply` 里**先记录、后装饰**。
反过来（装饰成功才记录）会导致装饰挂不上时命令也失效——v2.32.0 实测。

**定位方式**：记录 `{line, fromCh, searchText, replaceWith}`，
撤回时 `getLine` + 文本查找。**不碰 CodeMirror**，只用 Obsidian editor 接口。
先按 `fromCh` 找，找不到就整行 `indexOf`（前面插入过文字时列号会偏）。
整行命中**多处时必须拒绝执行**——取第一个匹配动手会把替换写到别处（v2.96 实测）。
都找不到则标记 `unresolvable`，**保留记录不清**：乱序撤回时清掉中间记录，
会让那处转换永久不可逆。

**追加模式**把前导空格纳入 `searchText`，撤回后不留空格。

**图标**：`obsidian.setIcon(el, 'lucide-undo-2')` 渲染 SVG，
**不可自定义**（`undoMark` 字段已移除）。

**数据红线**：只在内存，双重限量（每篇 100 条、最多 50 篇），
卸载/关闭时 `clearUndo()` 全清。

---

## 5. 命令清单

**完整清单见 §14**（那里是唯一权威来源，由 `_test/arch-doc.js` 双向校验：
代码里有、文档没写的会报错；文档写了、代码已删的也会报错）。
新增命令必须同步进 §14，不要在这里另起一份——两份清单必然漂移。

**必须用 `checkCallback`**，不能用 `editorCallback`——后者只在编辑器聚焦时可见，
用户在设置页/图谱视图搜不到，会以为功能没生效。

`reapply-window` 必须在**独立窗口里**运行才有效：每个窗口用的是自己加载时读到的
那份设置，主窗口改完配置存进 data.json，pop-out 那份实例不会自动感知。

---

## 6. 番茄钟（`pomodoro.js`）

`PomodoroController` 是核心。

| 方法 | 行号 |
|---|---|
| `startSession` | 1079 |
| `startSegment` | 1147 |
| `tick` | 1211 |
| `onSegmentEnd` | 1240 |
| `nextSegment` | 1290 |
| `finishSession` | 1397 |
| `refreshUI` | 1531 |

弹窗：`StartModal` 、`AskLongBreakModal` 、
`AskRestartModal` 、`SummaryModal` 。防误关基类 `GuardedModal` 。

设置渲染：`renderPomodoroSettings` ；记录：`Recorder` 、
`renderRecordSettings` 。

**核心口径（易错，勿改）**：长休息是**询问**不自动进入；跳过的段**不计入**轮次；
用**结束时间戳**而非累减计时。

### 6.0.0 写入格式契约（`recorder.js`，勿只改一边）

写入格式是**隐式契约**：`sumMinutes()`（自定义位置统计）、DataView 查询
都依赖 `summaryLine()` / `dataviewLine()` 写出去的字。
**改了写法而读取侧没跟上，统计会静默变 0 —— 不报错、不提示。**

- 契约声明：`RECORD_FORMAT_VERSION`（改写法时 +1）
- 时长正则：`DURATION_RE`，读取侧**共用**这一份，不许在 `sumMinutes` 里就地另写
- 必须认三种形态：`N 小时 M 分 S 秒` / `M 分 S 秒` / `S 秒`
  —— 少了「小时」这一支，正计时跑过一小时又开「记录到秒」会把整小时丢掉
  （实测 `1 小时 0 分 0 秒` 记成 0 分，v3.28 已修）
- 守卫：`node _test/recordformat.js`（往返校验：写入侧产出必须能被读取侧读回同一个数）

### 6.0 正计时（`countUp`）

开启后**专注段**从 0 往上累加、不自动结束，由用户点「跳过」或结束会话来停。默认关。

- **只对专注段生效**：休息段是固定时长的恢复，正计时没有意义，仍走倒计时。
- **永不自动结束**：`tick()` 里正计时分支显式 return。若让倒计时那条
  「剩余归零即结束」接管，开头那一帧 `remainMs` 还是 0，会被当场误判成段结束
  （`_test/countup.js` 有专门一条断言守这个）。
- **显示语义翻转**：正计时时 `remainMs()` 返回的是**已过**时长。
  界面各处都读它，所以调用方不用改；也正因为永远为正，天然不会触发结束。
- **硬上限 `countUpMaxMin`**（默认 1440 分钟 = 24 小时）：累加到上限由 `checkCountUpMax()`
  自动停表 —— 回到待开始、本次时长**不计入专注总量**（超时数据不可信），并弹提示让用户
  重新开始。填 0 = 不设上限（一直跑的后果由用户自担）。
- **暂停即停**：暂停期间不累加，恢复时以已累计时长为新基数（`countUpBaseMs`）。
  否则把暂停时长算进专注时间，统计会虚高。
- **超一小时补小时位**：`displayTime()` 走 `hmmss`，避免显示成 `75:30` 这种读不懂的数。
- **软目标**（`countUpTargetMin`，0=不提醒）：到点弹一次提醒并响铃，**不结束**。
  设了才画进度条（按软目标比例）；没设就留空——画满会被误读成「快结束了」。
- **时长怎么记（与倒计时不同，别混）**：正计时没有「没做完」这回事 ——
  你什么时候停，这一段就是多长。所以：
  - 正常结束、`跳过`、手动`结束会话` **都记时长**（`onSegmentEnd` 里的 `countThis`，
    以及 `finishSession()` 开头的 `settleRunningSegment()`）。
  - 只有一种情况不记：累加到**硬上限**被自动停表（超时数据不可信）。
  - 跳过**不计入「跳过次数」** —— 那是倒计时的口径（没做完就撤）。
  - 倒计时的口径维持原样：中途放弃或跳过的段不算。两套口径的差异写在设置说明里。
- **待开始处的快捷切换**：「🍅 准备开始」面板（`StartModal`）有一对
  `倒计时 / 正计时` 按钮，当前生效的那个点亮；浮窗与侧边栏在**待开始**状态
  也多一个「正计时：开 / 关」按钮（`data-act="mode"`，跑起来后隐藏）。
  已在跑的段不给切 —— 切了数字会从「剩余」跳成「已过」。
- **间隔提醒**（`countUpRemindEveryMin`，0=不提醒）：每累加到 N 分钟的倍数提醒一次
  （N=20 → 20/40/60 各一次）。用「已过 ÷ 间隔」的整数个数判断，而不是「又过了 N 分钟吗」——
  后者在系统休眠 / 后台被节流时会漏掉整拍。与软目标的区别：软目标只响一次，这个是持续节拍器。
- **暂停达阈值后的「重新开始本轮」必须归零**：`AskRestartModal` 的两个回调里
  正计时走 `resetCountUpProgress()`。正计时只认 `countUpBaseMs` / `countUpStartAt`，
  不认 `endsAt` —— 漏了这两行，点「重新开始本轮」界面纹丝不动、接着旧数字继续走，
  用户看到的就是「重置失效」。选「继续当前进度」则要以 `pausedRemainMs` 为新起点，
  否则暂停期间流逝的时间会被算进专注时长。

**性能**：`tick` **按秒节流**——250ms 轮询但只在秒变化时重绘。
跑满 25 分钟专注，DOM 写入从 **48000** 降到 12008（减少 75%）。

**重绘脏检查（`FloatUI._paintSet`）**：上面的节流只解决"同一秒内的重复帧"，
但每帧内部仍在无差别重写全部文本节点——每秒真正会变的只有倒计时和进度条，
标题、按钮文案、轮次圆点只在状态切换或完成一轮时才变。
`_txt` / `_attr` / `_paintSet` 只在值真变化时才碰 DOM，
实测每帧 **9 次 setText 降到 1 次**，25 分钟再由 12008 降到 **1500**。

两条改动时别踩的线：

- **节流不能去掉**——脏检查是第二层优化，两者叠加才是这个数。
- **脏检查不能吞掉该刷新的值**：状态切换、完成一轮、最小化切换时值本身就变了，
  照样会写。判据是"值是否变化"，不是"距离上次多久"。
  回归见 `_test/pomoredraw.js`（稳态只写倒计时 + 变化时各节点必须重写，两组都守）。

**格式串正则缓存（`FORMAT_RX_CACHE`）**：`parseNoteRef` 要为 4 类笔记 × 每种格式
各编译一次正则，而全库扫描（批量改名）会对每个文件调它一次。
库里几千个文件时等于把同一批正则反复编译几千遍。
格式串来自设置、很少变，故按 `格式串 + 是否允许后缀` 缓存（上限 200 条，超了清空）。
实测 5000 个文件（多数不匹配的最坏情况）**138.91ms → 55.45ms**。
注意：这是用户手动触发的批量改名路径，不是每帧热路径，量级本就可接受。
状态切换（开始/暂停/跳段）仍立即重绘，手感不变。

**主题（六个）**：`theme` + `customCss`，枚举在 `settings.js` 的 `VALID_POMO_THEME`。

| 取值 | 说明 |
|---|---|
| `classic` | 经典，即最初那套（默认，老用户升级外观不变） |
| `minimal` | 极简：去边框阴影，只留文字和细线 |
| `dynamic` | 流光：呼吸光晕 + 流动渐变进度条 |
| `ethereal` | 空灵紫：冷白玻璃底 + 紫罗兰主色 + 水光流动（浅色系） |
| `scythe` | 赤镰：暗黑底 + 镰刃红血流边框 + 进度条扫光（深色系，底色必须实色） |
| `custom` | 自定义：插件**不提供任何样式**，完全交给用户 CSS |

新增主题的两条硬约束（有测试守着）：
- 关键帧**必须带主题前缀**（如 `pomo-ethereal-flow`）。`@keyframes` 重名会全局覆盖，
  空灵紫若沿用 `pomo-flow`，会把「流光」的流动方向改反。
- 选择器同时写 `.pomo-float` 与 `.pomo-container`，否则侧边栏/独立窗口不上色。
- 面板自身的背景/边框规则要写成 `.pomo-theme-x.pomo-float` 组合，否则与
  `.pomo-float` 自带的 background 同特异性，会按先后顺序被吃掉。

挂载方式是 `applyTheme()` 给根元素加 `pomo-theme-<取值>` class，**只换 class 不重建 DOM**，
正在跑的计时不受影响。样式全由 `styles.css` 里的 CSS 变量驱动
（`--pomo-focus` / `--pomo-rest` / `--pomo-panel-bg` / `--pomo-radius` …）。

自定义 CSS 由 `syncCustomCss()` 注入到 `<style id="time-tools-pomo-theme-css">`；
切主题或清空文本时**整个移除节点**，不往 head 里堆废弃节点。

两条硬约束（改动时注意）：
- `.pomo-theme-custom` 的样式区**必须保持空白**。一旦写了样式，用户写的就会被覆盖。
- 动态效果只动 `opacity` / `transform`，且带 `prefers-reduced-motion` 降级；
  不要给 `box-shadow` 做动画（每帧重绘整块区域）。
- `syncCustomCss` 走 `domReady()` 防御：环境没有完整 DOM 时直接返回，
  否则会让番茄钟初始化整体抛异常（主题只是外观，不该拖垮计时）。

### 6.1 最小化（`FloatUI`）

最小化后浮窗只剩头部，且**只留恢复按钮**（设置 ⚙ 与隐藏 × 带 `pomo-hide-on-mini`，
由 CSS 在 `.pomo-mini` 下隐藏）。头部标题从「🍅 番茄钟」换成本段模式名：

| 当时状态 | 标题 | 配色类别 |
|---|---|---|
| 专注中 | 专注 | `focus` |
| 短/长休息 | 休息 | `rest` |
| 其他（未开始等） | 番茄钟 | `idle` |

`miniBadge()` 判断两个容易写错的点：
- 暂停**沿用 `pausedFrom`**，否则专注中途暂停会被误显示成「番茄钟」；
- 手动模式的 `WAITING` 用 `pendingState`（待开始的那一段）判断。

配色只写 `data-mini-kind` 属性，颜色由 CSS 走 `--pomo-focus` / `--pomo-rest` 变量 ——
**不要写死色值**，否则自定义主题会失效。恢复窗口时属性要清掉（不留废弃属性）。

### 6.2 独立窗口的归属与退场（`pomosync.js`）

主窗口与独立窗口各有一份插件实例，靠共享文件协商：同一时间只有一个「拥有者」
推进段切换、播放提示音、**写笔记**；另一方是镜像，只渲染。

两条容易漏、且都会导致**笔记里出现重复记录**的规则：

1. **拥有者也要回头校验归属**（`verifyOwnership`，每 3 次轮询一次）。
   镜像接管时会把文件里的 owner 改成自己，但原拥有者从来不读文件，
   它不知道自己已被顶替，于是继续推进、继续弹小结、继续写笔记 ——
   同一段结束被判定两次。触发条件很普通：拥有者窗口被系统节流或合盖，
   心跳断超过 `STALE_MS`。
2. **结束会话必须等归属确认**（`stop()`）。已确认归属就同步结束，保持手感；
   需要从镜像手里抢归属时才异步等待，否则对面也结束一次 → 两条记录。

拥有者结束会话会清掉共享文件。另一方发现文件没了要 `retireFromSession()`
跟着归位（**只清运行时，不弹小结、不写笔记**），否则 UI 停在旧倒计时上像还在跑。
区分「是谁清的文件」靠 `endedLocally` 标记，避免把自己也归位掉。

---

### 6.3 桌面常驻（`applyDeskDock` / `leaveSettingsForDock`）

独立窗口去不掉系统标题栏（Electron 的 `frame` 只能建窗那一刻指定），
达不到「桌上一个无边框的小番茄钟」，于是反过来：把**主窗口**缩成番茄钟大小、置顶、贴边，
番茄钟用浮窗显示在窗口内。

两条硬约束，改之前先读：

- **缩的是"本窗口"，不是"有焦点的那个窗口"。** `curWindow()` 必须优先取本地 `window`。
  `activeWindow` 指的是当前有焦点的窗口，开着独立窗口时会指向别人，
  于是"缩小主窗口"变成缩小了另一个窗口。
- **开启后必须离开设置页。** 开关就摆在设置页里，开启后窗口立刻缩到 365×378；
  还停在设置页的话，用户看到的就是"一个被缩小的设置窗口"。
  `leaveSettingsForDock()` 负责关设置页、切回笔记叶子、把浮窗亮出来；
  全程 try/catch —— 切不动不影响窗口已经缩小，绝不能让它把开关回滚掉。

原尺寸存 `deskDockRestore`：**重复开启不得覆盖**（否则关掉只会还原成小窗），
关闭后立刻清空（留在 `data.json` 里就是废弃数据）。

## 7. 设置页（`settings.js`）

`TimeToolsSettingTab` 外壳，内部按标签切换；
`renderTimestamp` / `renderPomodoro` / `renderRecord` 。

**加新设置**只需在 `SECTIONS` 数组加一行（不用改框架）。
每个区块独立 `try/catch`，一块出错只显示一行提示，不拖垮整页。

### 7.1 滚动位置还原

Obsidian 重载插件会重建设置页 DOM，位置和标签回到默认，用户每次
「重新加载」都被弹回顶部。还原逻辑记在 `lastSettingsScroll`（按标签存 4 个数字——含界面语言）。

- 单次设置会被后续重绘冲掉（日历页按钮按 200ms 轮询），所以按
  `SCROLL_ATTEMPTS = [0,30,80,150,300,500,800]` 多次尝试
- **三种情况立即放弃**：容器脱离文档（用户切走）、用户触发
  wheel/touchstart/mousedown/keydown、页面比记忆位置矮
  还原只是便利，绝不能反过来抢用户的操作
- 用户意图用真实交互事件判定，**不要**改成事后比对 `scrollTop`
  —— 那样分不清「用户滚的」和「被重绘冲掉的」

⚠️ 只覆盖「设置里重新加载插件」；`Ctrl+R` 重载整个 App 会重建主窗口，
插件没有插入恢复逻辑的机会，属系统行为。

---

## 7.5 界面语言（`src/i18n.js`）

零依赖模块，只负责设置界面上显示的那层字，不参与任何功能逻辑。

- **调用形式**：`i18nT(key, 中文原文)`。中文原文写在调用处、同时当兜底值，
  所以不另存一份 zh 包（存了就是同一句话写两遍，改一处忘一处必然漂移）。
- **英文**：查 `EN` 表；查不到仍返回中文原文，绝不出现空白或半截英文。
- **繁体**：不存第二份数据，走字表 + 词汇表转换生成。
- **模板串**：英文串用 `{0}` `{1}` 占位，实参从第三个参数起传。
  中文原文本身已插值，中文模式不进替换分支（零开销）。

**默认值 `uiLang: 'auto'`（跟随系统），判定顺序：**

1. `localStorage.language` —— 用户在 Obsidian 设置里选的界面语言，最准
2. `obsidian.moment().locale()` —— 官方推荐源，部分版本与上者不同步
3. `navigator.language` —— 浏览器语言

中文系（含 `zh-TW`/`zh-HK`）→ 对应中文；**其它一律英文**；三处都读不到（无界面环境）才回落中文底色。

**两条硬约束：**

- 语言区是**主设置页里的第四个标签**（`TABS` 的 `lang`），不是独立设置页 ——
  两个入口在设置列表里显示为两行 Time Tools，会被当成两套设置。
- **`setLang()` 必须在 `loadSettings()` 之后立刻调用**。少了这一步，
  存进配置的 `uiLang` 不会被应用，表现为「重启后语言又变回中文」。

**标签文案**：`TABS` 里存 `label`（中文原文）+ `labelKey`，渲染时才 `i18nT(labelKey, label)`。
不要在 `TABS` 常量里直接调 `i18nT` —— 模块加载时语言还没读出来，写死就永远停在中文字面值上。

**刻意不译的 7 条**（`EN_ALLOW_CN` 白名单，不要补，补了会出事）：
- 命令名 2 条：`ka775650d`（「时间戳」）、`kd5a911e8`（「日历」）—— 翻成英文用户就搜不到了
- 语法示例 5 条：`k8d574624`（「五月十六」）、`k6d51a9fb`（「农历2026年八月初九」）、
  `k00ff190f`（「5月16号」）、`k1554c109`（「早上/下午」）、`k4886d4c7`（格式串示例）
  —— 解析规则只认中文写法，翻成英文用户照抄反而解析失败
> 白名单若空转（条目已不在 EN 表）会被断言「命令名例外条目确实还在」抓出。

> 自定义规则的示例**不在此列**：`parseUserRules` 按 `= + -` 分割、匹配的是用户选中的原文，
> **与语言无关**，英文示例照抄可用（v3.22 实测确认）。早先把它当成"翻译了会失败"是误判，已纠正。

**日历语言 `calendar.lang`（v3.22 新增，`auto` / `zh` / `en`，默认 `auto`）**：
独立于显示语言，只管日历网格里的**月份名与星期名**。
`auto` 跟随**已解析出的显示语言**（`resolve()` 的结果），不重新检测系统语言。

- 月份/星期名是**自己维护的两张小表**（`MONTH_NAMES` / `WEEKDAY_NAMES`，中文是底色）。
  **绝不调用 `moment.updateLocale` / `defineLocale`** —— 那是全局的，会污染其他插件。
- 星期名英文用 `Sun/Mon` 简写而非全称：中文是单字「日一二」，简写宽度接近，**中文版式不用动**。
- **不动**：周起始日（`WEEK_START_OPTIONS`）、日期格数字、圆点、高亮、周数计算、笔记命名。
- 月份标题曾有的真 bug：12 个月共用同一个 key + `{0}` 占位符，英文下只剩数字「9」，
  月份名整个丢失 —— 英文月份名是独立单词，不是"数字+后缀"能拼出来的，改为查表。

**体积红线（v3.26 拆表后修订）**：逻辑文件 `i18n.js` ≤ **32KB**，
翻译数据合计（`i18n.js` + `i18n-en.js`）占产物 ≤ **10%**。
实测：`i18n.js` 24.96KB、`i18n-en.js` 39.58KB，合计 64.55KB = 产物的 **9.30%**。

字节帽曾一路放宽（40KB → 48KB → 64KB），但**卡错了对象**：EN 表是数据，
翻译越完整它必然越大，用固定字节数卡它迟早顶死（v3.22 剩 289 字节、v3.25 剩 748 字节）。
v3.26 把 EN 表拆成纯数据文件后，字节帽只卡**逻辑文件**（防止有人把数据塞回 `i18n.js` 绕开检查），
**占比红线 10% 原样保留** —— 这才是真正的闸门，不是取消守卫。

**想加别的语言**：内置只有 `zh` / `zh-TW` / `en`，其余走 `registerLang`：

```js
const { registerLang } = require('./i18n.js');
registerLang('ja', '日本語', { 'k……': '……', … });
```

- key 从调用处 `i18nT('kxxx', '中文')` 抄，值是对应的外文，**查不到仍回落中文原文**（兜底规则不变）
- 三处接线缺一不可：① `t()` 的 `EXTRA_LANGS` 分支 ② `normalize()` 放行 ③ 下拉用 `allLangs()`
  —— **漏了 ② 的症状是：注册成功、下拉能选、但选完不生效**
- 内置语言不许被覆盖（`registerLang('en', …)` 返回 `false`）
- 繁體**保留**：3.3KB，是中文的一支，走 `toTW()` 字表实时转换，不需要第二份完整译文表

**红线守门**：`_test/i18nguard.js`（43 项）。把「零依赖 / EN 表不含中文 /
设置页文案不许漏包 i18nT / **createDiv·createEl 的 text·title 不许漏包** /
**`.title =` 这类直接赋值不许漏包** /
命令名不翻译 / TABS 存 labelKey / 体积：逻辑文件 ≤32KB + 翻译数据合计 ≤10% /
语言 ≤4 档 / 文档单语 / `registerLang` 三处接线」全部变成断言。改 i18n 后必跑。

> 漏包检测的两处硬伤（v3.23 一并修）：
> ① 判定前**先解码 `\uXXXX` 转义** —— 否则把中文写成转义就能完全绕过守卫，
>    历史上会话小结弹窗整块文案就是这么"守卫全绿、界面全是中文"的；
> ② 扫描范围从链式 API 扩到 `createDiv/createEl/createSpan` 的 `text:` / `title:`。

扫描清单另含四类**非链式**入口，缺一即漏（v3.32 补全）：`Notice`（运行时弹窗）、
`_paintSet`（取**第二**实参）、`confirmDialog`（取 `title`/`content`/`okText` 三个参数位）、
`notifyOnce`（calendar.js 发提示的主要途径）。
⚠️ 匹配正则的点号必须**可选** —— `notifyOnce()` 是裸调用、没有 `this.`/`obsidian.` 前缀，
写成 `\.` 前缀的话该项永远匹配不上（v3.32 反证时连续两次假绿才发现）。

> ⚠️ **漏译已四次同族复发，参数位 / 分支值是结构性盲区，不要以为守卫够用了**：
> `v3.25` 实参是变量（`.setName(def.label)`）→ `v3.32` `_paintSet` 第二实参、`Notice`
> → `v3.32` `confirmDialog` 参数位 → `v3.32` 三元分支值（`wasOther ? '中文' : null`）。
> 共同点：中文**不在链式 API 的第一个实参里**，守卫按"链式 + 首参"扫，全部放行。
> 补漏时顺手 `grep -n "['\"][^'\"]*[一-龥]" src/*.js` 全项目扫一遍，别只改报出来的那一处。

漏包检测用**括号配对取实参**，不用正则字面量 —— 后者只认 `.setName('中文')` 这种最简单的形式，
三元表达式 / 模板串 / 拼接串全抓不到（v3.22 的 49 处漏包就是这么逃逸的）。

**数据驱动的文案（守卫扫不到，只能靠查表）**：转换项名与说明、时间口径三项、预设格式按钮、时段名
都存在数据表里，渲染时实参是**变量**（`.setName(def.label)`），守卫的"实参含中文"判定完全失效 ——
这是漏包检测的**结构性盲区**，字面量/三元/模板/转义四类补丁全打完，这一块依然可能全中文。
统一走「按 key 查表」，**非英文态直接回落中文原文**（中文零开销）。现存 8 张：

| 查表 | 覆盖 |
|---|---|
| `ACTION_EN` | 22 个转换项名与说明 |
| `JUDGE_EN` | 时间口径三项 + 其选项 |
| `PRESET_EN` | 8 个预设格式按钮 |
| `DAYPART_EN` | 时段名（凌晨/早上/…） |
| `OPTION_EN` | 主题 / 开窗位置 / 周起始 三组下拉 |
| `MISC_EN` | 杂项（斜杠建议、周期笔记类型等） |
| `STATE_NAMES` | 番茄钟状态名（专注/休息等 6 态） |
| `FEST_HEAD` | 自设节日说明（**叙述译、示例不译**） |

⚠️ 所以**往数据表里加字段时，要手动同步补 EN** —— 守卫不会提醒你。
v3.26 补的 `_test/i18nguard.js` 行为断言（调 `optText`/`judgeText` 看是否回落中文）
覆盖了主题 / 开窗位置 / 周起始 / 时间口径四组；**其余四张表仍靠人肉同步**，是已知缺口。

## 8. 测试

```
node _test/smoke.js 主测试（1204 项）
node _test/arch-doc.js 文档与代码一致性
node _test/load.js 加载冒烟
node _test/bughunt.js 边界压力
node _test/stats.js 累计统计（31 项）
node _test/i18nguard.js 界面语言红线守门（43 项）
node _test/i18n.js 界面语言功能（55 项）
node _test/batchconv.js 批量转换（28 项）
node _test/configio.js 配置导出 / 导入（29 项）
node _test/countupsync.js 正计时跨窗口同步（20 项）
node _test/countup.js 正计时全套：累加不结束 / 暂停即停 / 软目标 / 硬上限 / 间隔提醒（97 项）
node _test/stats2.js 统计自定义位置 + DataView 字段表 + hasDataview 检测（36 项）
node _test/recordformat.js 写入格式契约：写入侧产出能被读取侧读回、必须认「小时」（17 项）
node _test/manualdoc.js 人工测试文档各组预期的代码回归（17 项）
node _test/srchealth.js 源文件本身没被写坏：UTF-8 可解码 / 恰好一个 module.exports（56 项）
node _test/entryguard.js 所有命令注册点必须过总开关门控（6 项）
node _test/settingtab.js 设置页 id === 插件 id（7 项）
node _test/envcontract.js 公共环境契约（10 项）
```

全量：`bash _run_tests.sh`（56 个文件 = 55 套件 + 1 公共环境 `_smoke_env.js`；
跳过 `_` 前缀，任一套件失败退出码 1，可直接当 pre-commit）。
> **已加 node 前置检查**：node 不在 PATH 时每个套件都是 `command not found`，
> 输出会伪装成「53 个全 FAIL」而实际一个都没跑 —— 提前 `exit 1` 拦住。
> 别再用手写 `for t in _test/*.js` —— 漏跑没人知道，v3.28 才补的运行器。

`node build.js` 会在源文件比文档新时提醒更新 ARCHITECTURE.md。

---

## 8.1 测试环境与公共契约（`_test/_smoke_env.js`）

### 对外承诺的能力清单

`_smoke_env.js` 只做环境装配、不含断言。其他套件依赖下列能力，**新增能力必须登记在文件头注释里；删除能力必须先确认无人依赖**。

| 能力 | 谁依赖 |
|---|---|
| `global.window` / `global.document` | 全部需要 DOM 的套件 |
| `global.__modals` / `global.__notices` | 断言弹窗与提示的套件 |
| `global.__clipboard` | ★ `recorder.js` 写入、`quickadd.js` 读取 |
| `global.navigator.clipboard.writeText` | 同上，**写入侧走这个** |
| `check(name, cond, actual)` / `done()` | 断言器与收尾（设退出码） |

★ 这条是三处链：环境装 → `recorder.js` 写 → `quickadd.js` 读。断在任意一处都表现为「剪贴板 5 项红」，但只有第一处是环境故障。

### Node 兼容性（21+ 只读全局）

Node 21+ 内置只读 getter 全局：`navigator` / `crypto` / `performance`。简单赋值在非严格模式下**静默失败**（不生效也不报错），必须走
`Object.defineProperty(global, key, { value, writable: true, configurable: true, enumerable: true })`。

新增任何全局 mock 前先 `Object.getOwnPropertyDescriptor(global, key)` 确认可写性。
`global.window` / `global.document` / `global.__xxx` 不受影响（Node 未内置）。

守卫：`_test/envcontract.js`（10 项）。其中「writeText 真的写入 `__clipboard`」是**行为验证**，
只查 `typeof === 'function'` 抓不到「实现是空函数」。

### 新增测试套件的登记要求

1. 文件名不带 `_` 前缀（`_run_tests.sh` 跳过 `_` 前缀的公共环境）
2. 同步 `build_card.py` 的 FILES 清单（曾漏登导致从卡片还原后丢一整个套件）
3. 套件末尾输出 `套件: xxx` 并以退出码表达成败

---

## 9. 文件结构（勿再合并）

```
main.js 入口
timejudge.js 时间口径与判断表（零依赖，必须最最先加载）
lunar.js 农历算法（零依赖纯计算，必须早于 timestamp.js）
settings.js 被其余模块 require，必须最先加载
timestamp.js 依赖 settings.js + lunar.js
recorder.js 依赖 settings.js（模板常量与 confirmDialog）
pomodoro.js 依赖 settings.js + pomosync.js + recorder.js
calendar.js 依赖 settings.js
note.js 依赖 settings.js
configio.js 依赖 settings.js（migrateSettings）；管**全部**模块的备份，不受任何功能开关门控
```

**timejudge.js 单独存在的理由**：中文里有几处写法没有共识
（「周末」是周六还是周日、「下周一」指明天还是下个日历周、「17号」补哪个月），
这些判断要**给用户留选择空间**，选项清单与默认值必须配套出现。
散落在解析代码里就容易只改一半；集中一处后，设置页与解析层读的是同一份定义。
新增口径只往 `JUDGEMENTS` 里加一条即可，设置页会自动渲染选项。

**为什么不能合成 1 个**：`settings.js` 被 require 必须最先加载，
并入 `main.js` 会成环。硬压成单文件会是 4000+ 行，反而难定位。

---

## 10. 踩坑表（每条都是实测）

### 撤回

| 现象 | 原因 | 解法 |
|---|---|---|
| 图标不显示 | 自定义字符依赖字体，缺字形 | 用 `obsidian.setIcon` 渲染 SVG |
| 图标不显示（第二次起） | `CM6.built` 缓存了失败结果 | 判断改成 `CM6.built && CM6.field` |
| 命令也失效 | 记录写在装饰成功之后 | 先记录后装饰（§4） |
| 点了没反应 | 装饰 id ≠ 记录 id | widget 点击回 `rec.id` |
| 撤回后多一个空格 | 追加模式前导空格没纳入替换范围 | `searchText` 含空格 |

### 番茄钟

| 现象 | 原因 | 解法 |
|---|---|---|
| 正计时暂停 3 次后选「重新开始本轮」没反应 | `AskRestartModal` 只重置了 `endsAt`，而正计时只认 `countUpBaseMs` / `countUpStartAt` | 回调里补 `resetCountUpProgress()` |
| 正计时的专注时长在小计里永远是 0 | 正计时不会自然结束，唯一收尾是手动点「结束」，而 `finishSession()` 不结算当前段 | `finishSession()` 开头加 `settleRunningSegment()` |
| 正计时「跳过」后时长丢失 | 跳过沿用了倒计时的「没做完就不算」口径 | 正计时的跳过照记时长，但不计入跳过次数（两套口径差异写在设置说明里） |
| 切换正计时后数字突然跳变 | 运行中翻转语义，同一个数从「剩余」变成「已过」 | 只影响下一段；待开始界面才给切 |

### 日历圆点

| 现象 | 原因 | 解法 |
|---|---|---|
| **周列圆点恒顶上限**（每天 10 点） | 分子是「7 天日记之和」，分母却是单天标准（250），数值放大约 7 倍 | 改读**周记本身**的字数（`weeklyFileOf`，v2.55） |
| 输入框不能连续填 | `onChange` 里 `redrawSettingsTab()` 销毁重建设置页，输入框 DOM 跟着重建 → 失焦 | 只 `refreshCalendarViews` |
| 莫名多出一堆点 | 上条导致值存成中间态（想填 100 存成 1）→ 每点 1 字 → 全顶上限 | 同上；描述里提示「不小于 50」 |
| 空笔记疯狂读盘 / 界面抖动 | 用「字数 == 0」判断是否统计过，空笔记永远算没统计 → 补读→仍 0→再补读，死循环 | 独立 `hasWordCount` 标记 |
| 首行周数格空白 | 判据写成「该格属于本月才显示」，首行常是上月尾 | 按格位直接算日期，不问归属 |
| 日历不能伸缩 | `1fr` 默认 `min-width:auto`；圆点容器写死 `width` | 列/行改 `minmax(0, 1fr)`，圆点 `width:100%` |
| 周格反推日期错位一整周 | 用 locale 的周起始，网格却用 `firstDow` | 统一传 `firstDow` |
| 「第N周」与日历周数打架 | 旧版在 `timestamp.extensions.weekStart` 与 `calendar.weekStart` 各存一份，改一处另一处不变 | 合并为唯一来源 `calendar.weekStart`（v2.61）；旧值迁移并入，旧键由 `pickKnown` 自动清除 |
| 周起始日存进非法值（如 `xxx`） | `pickKnown` 只比对类型（string/string 放行），不校验值域 | 按 `VALID_WEEK_START` 枚举清洗 |
| **显示第 40 周却生成 `2026-W39`**（差 1，且高亮跟着偏） | 两个 bug 叠加：① `resolveLocaleDow` 写成 `typeof w.week`，在 `const w` 初始化前引用自己 → TDZ `ReferenceError` 被 catch 静默吞掉 → **恒定返回 0（周日）**；② 周记文件名交给 moment 的 `gggg`/`ww`，那是 moment 自己的 locale week，与日历显示用的 `firstDow` 不同源 | ① 判 `ld.week` 不是 `w.week`；② `buildFileName` 对 weekly 按传入的 dow 自算（`weekMeta` + `formatWeekName`），与 `weekNumberOf` 同算法（v2.63） |
| 周起始设为周二及以后时反查周首日偏 | `weekStartOf` 写 `(dow===0\|\|dow===1) ? dow : 1`，退化成周一，与 `weekNumberOf`（按传入 dow 算）不同源 | 直接用 dow，只做合法性兜底 |

周列圆点口径（v2.55 定）：**读周记本身**；没写周记就没有点。
日期格口径不变：当天日记字数 ÷ 每点字数。

### 解析

| 现象 | 原因 | 解法 |
|---|---|---|
| `五月十六日` 认不出 | 阳历解析只认阿拉伯数字 | `parseCnSolarDate` |
| 第 49 周算错 3 天 | 周计算公式用了「求周四」当「求周一」 | 见 `isoWeekDate` |
| `明晚` 算出跟 `明天` 一样 | 「晚」是单字，`indexOf('晚上')` 找不到 | 给时段词加单字别名 |
| 农历算出的日期整体偏移 | 反向转换漏加闰月天数 | 见 `parseLunar` |
| 补星期把时刻吃掉 | 固定用 `YYYY-MM-DD` 输出 | 按 `hasClock`/`hasSeconds` 还原精度 |

### 插件冲突（重要）

**Calendar 设置页报 `dow` 是本插件无关的已知问题**。

Calendar（liamcain/obsidian-calendar-plugin）设置页在**日历视图被打开过一次之前**
会抛 `Cannot read properties of undefined (reading 'dow')` 并近乎空白。
根因：它读 `window._bundledLocaleWeekSpec`，而该变量要等视图初始化才赋值。
**全新安装、只装 Calendar 一个插件也会复现**（GitHub Issue #395），
因此不必怀疑本插件。解法：先打开一次日历视图再进设置页。

排错时看两点就够了：

- 本插件只用 `obsidian.moment()` 做**只读**格式化，
  从不调用 `updateLocale` / `defineLocale`，moment 的 locale 理应一直完好
- `window._bundledLocaleWeekSpec` 的当前值由 `calendar.js` 的 `weekSpecStatus()` 给出

两者都**只观察不写入**：改 moment 全局 locale 会污染其他插件，绝不能做。

| 现象 | 原因 | 解法 |
|---|---|---|

| 现象 | 原因 | 解法 |
|---|---|---|
| 启用本插件后**其他插件**设置页/界面异常 | onload 里同步 `detachLeavesOfType` 等工作区操作，此时别的插件还在初始化 | 延后到 `app.workspace.onLayoutReady` |
| 禁用本插件后其他插件反而异常 | `onunload` 抛错，中断了 Obsidian 的插件关闭流程 | onunload 全程 try/catch |
| 点开 A 插件设置页看到 B 的内容 | 设置页 `id` 缺失/重复 | 显式 `this.id = plugin.manifest.id`（**不能**手写别的字符串） |
| **已安装插件三点菜单没有「设置」、插件详情页没有「选项」按钮** | 设置页 `id` 被写成自定义的 `'time-tools-settings'` —— Obsidian 按 `plugin.manifest.id` 定位设置页（`openTabById(manifest.id)`），查不到就判定该插件「没有可配置的选项」 | `id` 必须等于 `plugin.manifest.id`（v3.29 修复，`_test/settingtab.js` 守着） |
| 设置面板卡在半渲染状态 | 某个设置页 `display()` 抛错 | `display()` 整体兜底，只显示一行错误 |

**排查顺序**：先看控制台红字 → 再对照上表定位。

### 构建与加载

| 现象 | 原因 | 解法 |
|---|---|---|
| **外部模块 require 不到**（`@codemirror/*`） | 打包器把非 `obsidian` 的 require 全当内部模块解析 | 裸模块名转交 `__hostRequire`（build.js） |
| **前缀切片差一位** | `'__host__:'` 是 9 字符，写死 `slice(8)` 会留下冒号 | 用 `key.slice('__host__:'.length)` |
| **测试全绿但功能不生效** | src 测试走 Node require，产物走打包器内部 require，**两条路径不同** | **必须加载产物做端到端测试**（`_test/smoke.js`） |
| 命令搜不到 | 用了 `editorCallback` | 改用 `checkCallback` |
| **点齿轮时灵时不灵**，设置页停在别的插件 | `setting.open()` 在较新版本**返回 Promise**，同步紧跟着调 `openTabById()` 会撞车；老版本又没有 `openTabById` | 先 `focusTab` 记标签 → `open()` 后 **等 Promise resolve** 再切 tab → 无 `openTabById` 时退回 `openTab(tab)`，并补一次延时兜底 |
| 番茄结束弹窗**一闪就没** | 番茄结束时手还在点，点到遮罩就关了 | `GuardedModal`：拦 `close()`，点遮罩累计到 `dismissClicks`（默认 3）才放行；按钮走 `dismiss()`、Esc 不受限 |
| 面板空白 | `addClass('a b')` 传空格会抛异常 | 一次只加一个类名 |
| 测试全绿但线上翻车 | mock 用 `Set` 实现 addClass，不报错 | 让 mock 与真实 DOM 行为一致 |
| **改了没生效** | **只写回复没改文件** | **从产物 grep 验证**（§0） |

---

## 10.5 模块四：日历（`src/calendar.js`）

**自研日历视图的几条约定**（改前先看 `smoke` 套件）：

| 项 | 约定 | 原因 |
|---|---|---|
| 关闭 | 设置页「打开/关闭」按钮与命令 `time-tools-calendar-close` 都走 `closeOwnCalendar` | 曾只能靠禁用插件退出；视图内的 × 已按用户要求移除 |
| 标题 | DOM 中月份在前、年份在后 | 用户要的是「9月 2026」而非「2026 9月」 |
| 窄栏 | `ResizeObserver` 量宽度后加 `is-narrow`，CSS 改成上下排 | 侧栏宽度与窗口无关，媒体查询测不到 |
| 灰字 | 上下月日期照常显示（`is-outside`），点它顺带切月 | 隐藏会显得缺一块；点了没反应更糟 |
| onClose | 必须 `resizeObserver.disconnect()` | 叶子销毁后回调会报错 |
| 折叠 | `ownCalendarEnabled` 关闭时其余设置全部不渲染 | 关着显示一大片输入框会让人以为调了有用 |
| 折叠例外 | `renderCalendarPluginSection` 必须照常渲染 | 它属于 Calendar 插件区，不是自研日历的子项；自研开关关掉时若把它一起藏了，用户遇到空白 Bug 就找不到修复入口 |
| 总开关 | 必须接到**功能侧**（命令 checkCallback + 打开函数拒绝 + 关闭时收起视图） | 曾只改设置页渲染，关了开关命令照样能开，等于没关 |
| 表头 | 固定简写「周 / 日 一 二 … 六」 | 曾改成「周日/周一」全称想对齐 Calendar，用户更喜欢原先的，已回退；有反证测试守着 |
| 网格 | 恒定 `GRID_ROWS = 6`（6×7） | 曾按当月天数算行数，切月时高度会跳 |
| 圆点 | 横排，每行 5 个，超出换行，上限 10 | 竖排会撑高格子；上限 5 会让长日记看不出差异 |
| 圆点口径 | 日期格 = 当天日记字数 ÷ 每点字数；**周列 = 周记本身字数 ÷ 每点字数** | 曾按「7 天日记求和」算周列，分子放大 7 倍导致恒顶上限（v2.55 改） |
| 圆点开关 | `dotsEnabled` 关闭时**连异步补读一起跳过** | 关了还读全文是白费一轮 IO |
| 周数格 | 按格位算日期（`1 - startOffset + i`），不判「是否属于本月」 | 旧判据让首行（上月尾）周数格留空 |
| 周记文件名 | 周号**必须**与格子显示同源：按 `dow` 自算，不走 moment 的 `gggg`/`ww` | moment 的 `ww` 是它自己的 locale week，与用户设的周起始不同源时会差 1（v2.63） |
| 伸缩 | 行列都用 `minmax(0, 1fr)`；圆点容器 `width:100%` + `max-width` | `1fr` 默认 `min-width:auto` 压不下去；圆点写死宽度会把格子撑住 |
| 交付 | **必须从产物 zip 核验**，不能只查 src | v2.51 曾声称已改但产物仍是 2.50，两张验证数字是编的 |
| 排布模式 | `fixedCellSize` 开关：关=自适应（6 行均分填满），开=格子固定高（紧凑） | 固定模式为后续月历视图保留；两模式的行高规则不能混写 |
| 圆点 | `dotsEnabled` 开关，关掉后不读字数、省掉异步 IO | 关了还去读全文是白费一次 IO |
| 设置页输入框 | `addText` 的 `onChange` **绝不能调** `redrawSettingsTab()` | 重绘会销毁重建输入框 DOM，焦点丢失 →「每敲一个字符就失焦，必须先删一个才能再填一个」；数字型设置改为只刷新视图。Toggle/Button 重绘不受影响 |
| 缓存「是否已统计」 | 必须与数值分开记录（`hasWordCount`） | 曾用「字数===0」当未统计，空笔记永远补读、补完仍是 0，render 再触发 → **无限循环**读盘+重绘 |
| 断言剥注释 | 校验"代码里不该有 X"时必须先剥注释 | 注释里提到 `redrawSettingsTab` 会被朴素匹配误判 |
| 圆点样式 | **实心** = 已写满的整点，**空心** = 正在写的那一点；有笔记但未写满一点 → 1 空心 | 全实心看不出进度；0 字完全无标记会让人以为这天没笔记 |
| 周列圆点 | 取「周记本身」的字数；反推日期必须用 `firstDow` | 曾取该行 7 天日记之和，分子放大约 7 倍 → 恒顶上限（v2.55 改）；用 locale 周起始会与网格错位一整周 |
| 高亮语义 | **今天 = 只留边框**（`outline`）；**打开的日记 = 那一天全填充**；**打开的周记 = 周数格全填充 + 整行弱高亮**（`is-week-row`，淡背景 + 描边）；月记/年记 = 标题高亮（不加全填充，会盖住文字） | 曾只给日期格加 `is-picked`，于是打开周记时周列永远不亮；周记若也全填充某个日期格，会与「日记」语义撞车 → 看着像高亮在乱蹦 |
| 高亮必须有类型 | `selKind`（`day`/`week`/`month`/`year`）+ `picked`（日期；周记时为周首日） | 只存一个日期无法决定画在哪种元素上（v2.64 之前没有 `selKind`） |
| 切月策略按类型分 | 周记：该周 7 天内**只要有一天**落在当前显示月就**不切月**（`weekTouchesMonth`）；年记：**一律不切月**；日记/月记：切到日期所在月 | 旧实现一律切到解析出的日期所在月 → 打开 `2026-W36`（周首 8/31）跳到 8 月、打开年记跳到 1 月 —— 这就是「切换周记高亮乱蹦」 |
| 重绘判定要带 kind | `unchanged` 必须同时比 `selKind` 与日期 | 只比日期时，从周记切到同一天的日记不会重绘 |
| 高亮跟随 | `picked` 由「点格子」和 `file-open` 两者驱动；解析不出就清空 | 曾解析不出就 `return`，`picked` 原样留着 → 切到普通笔记后日历上还亮着上次那格 |
| `picked` 不得清空 | 只允许「构造函数」和「打开非日历笔记」两处 `this.picked = null` | 切月（`shift`）、生成（`spawn`）里清空都会让高亮丢失；有断言守着出现次数 === 2 |
| 文件名解析 | `parseNoteRef` 返回 `{kind, date}`（`parseDateFromName` 是只要日期的薄封装） | 只返回日期时，调用方无法知道该高亮日期格还是周数格 |
| 月/年记匹配 | 必须用设置里的文件名格式反推正则 | 靠「名字里含月/年字」猜会把「2026 年度总结」判成年记 → 高亮跳到 1 月 1 日 |
| 不存在的日期 | `2026-02-30` 这类必须返回 `null`，不降级成 2 月 1 日 | `Date` 构造会静默进位，必须用 `getMonth()/getDate()` 回校 |
| 两个日历互斥 | `allowBoth` 默认 false；开增强自动关自研（含收起视图），反之亦然 | 两个日历各渲染一套网格、各算一套周数，状态互不相通 |
| 互斥要接到功能侧 | `openOwnCalendar` 也要拒绝，不能只靠设置页开关联动 | 命令面板绕得过去 |
| 互斥必须有启动期归一化 | `normalizeCalendarExclusive()` 在 `onLayoutReady` 跑一次 | `allowBoth` 是后加的，老 data.json 里两个开关可同时为 true；互斥只在设置页拨动时触发，不拨就永远没人收敛 → 「没允许双开却双开」 |
| 布局恢复绕过门控 | 视图 `onOpen` 自检：总开关关着、或增强开着且未允许双开 → 自行 detach | Obsidian 启动会直接恢复上次开着的叶子，不走 `openOwnCalendar` |
| 增强需运行时兜底 | handler 入口判 `allowBoth !== true && ownCalendarEnabled === true` 则 return | 标志位万一同时为真，增强一律让位，避免两套逻辑同时接管点击 |
| 周列也要能高亮 | `wkCell` 需要 `is-picked` 样式，周记时整行用 `is-week-row` | 旧实现的周数格只有 `:hover`，打开周记看不出是哪一行 |
| 打开周记别切月 | 用 `weekTouchesMonth` 判断该周是否与当前月有交集 | 一周跨月很常见（如 8/31 那周含 9/1–9/6），按周首日切月会让视图跳到上月 |
| `doy` 必须配套 `dow` | `weekDoyOf(dow)`：周一→4，其余→6+dow | 曾写死 6；Calendar 拿 spec 去 defineLocale，其 README 明说 Locale 影响模板里日期的渲染 |
| 失效自检要**分目标判** | 日期格 `.day` 与周列 `WEEK_NUM_SELECTOR` 各判一次，用**两个独立标志位** `enhanceWarned` / `enhanceWeekWarned` | 自检原本只判 `.day`。Calendar 改版时可能「.day 还在、周列 class 全变」→ 点周数静默失效且无任何提示。共用一个标志位的话，第一条弹过后第二条永不弹 |
| 周列选择器不许写三遍 | 抽常量 `WEEK_NUM_SELECTOR`，点击命中 / 行号反查 / 自检三处共用 | 同一串字符串散在三处，改版漏改一处就会出现「点周数没反应」且没提示 |
| 自检标志位要随卸载复位 | `plugin.register()` 的回调里一并清零 | 只移除监听器、标志位留着 → 重装插件后不再提示 |

**Words per dot**（对齐 Calendar）：圆点数 = 当天日记字数 ÷ 每点代表字数，上限 10（横排 5 个一行、两行）。
中英混排时中文按字符、英文按词相加；frontmatter 与代码块不计入。
每点字数 <=0 未配置时退化为「有笔记画 1 点」，不能因为新功能没配就让界面看不出哪些天有笔记。

**模板查找三层容错**（用户曾把路径填成不带 `.md`，导致精确匹配失败且无提示）：
原路径 → 补 `.md` → 同级模糊匹配。都不中才报错，并把尝试过的路径如实列出。

**Calendar 增强的踩坑**：Calendar 是 Svelte 渲染，年月标题里常是嵌套无 class 的节点，
只判 `ev.target.className` 匹配不上 → 点年月没反应。必须用 `closest()` 向上找祖先。
月份年份要取容器里 `.year` 的当前显示年，用 `new Date().getFullYear()` 在翻年时会写错。

**为什么必须接管日期点击**：Calendar 建日记走的是**核心「日记」插件**（只认核心模板），
根本不经过 Templater —— 用户配了 Templater 语法的模板也不会被执行。
所以增强模式下日期点击也由本插件接管（capture 阶段 `stopPropagation` 拦下），
走 `note.js` 的 Templater 路径。拦截前必须能确定日期，取不到就 return 放行，绝不猜。

**Templater 桥接**（`registerTemplaterBridge` / `bridgeNewNote`，开关 `calendar.templaterBridge` 默认开）：
上面那个「Calendar 用不了 Templater」的问题，在**三个日历开关都关掉、仍用 Calendar 原生功能**时照样存在。
此时不能靠接管点击解决（开关关着），改为监听 `vault.on('create')`：
新笔记命中「日/周/月/年记格式 + 落在配置的文件夹里」、且内容里还有**裸 `<%`** 时，
调 Templater 官方 `write_template_to_file` 重写一次。
以「还有裸 `<%`」为触发条件 → 天然幂等：Templater 自己跑过之后就不再是源码，不会补第二次。
其余边界：只处理 10 秒内新建的文件（同步 / 重建索引也会触发 create）、去重表上限 200 条、
必须用覆盖写（不能用 append，否则内容出现两份）、缺 `write_template_to_file` 就跳过不报错。
Calendar 与 Templater 的内部时序无法在沙盒验证，所以只做**状态可判定**的兜底，不猜对方时序。

取日期两条路（都在 `calendar.js`）：
1. 元素自带 `aria-label` / `data-date` / `title`，向上找 3 层；
2. 按网格推算：全部 `.day` 的下标 + 显示的年/月 + `startOffset`。
   先验 `.day` 数量是 7 的倍数，不是就放弃（说明选择器把表头也命中了，下标会整体错位）。
再用格内数字校正跨月（点上月尾 / 下月头时纯索引会差一个月）。

周数格**按格子里显示的周数去匹配行**，而不是用它在 DOM 里的下标
（`weekNumberOf(d, dow) === target`，遍历 6 行找命中）。
**曾用 `wks.indexOf(weekEl)` 当行号**：Calendar 的周数列前面常有一个表头占位格
（显示「周」），下标比真实行号大 1 → 点第 37 周被算成第 36 周、点 40 得 39。
占位格没有数字，按显示值匹配天然不会误命中；只有格子里读不到数字时才退回下标（并把占位格减掉）。
**也曾写死 `new Date()`（今天）**：点第 36 周会去建今天那周的周记，点哪周都一样。

**异名笔记兜底**（`note.js` `findExistingNote`）：只按配置格式查会判定「不存在」→
同一天再建一篇（用户老日记是 `2026-09-08-周二.md` 而配置格式是 `YYYY-MM-DD`）。
故按常见异名格式在配置文件夹内兜底查一次；**只用于打开，不用于新建**。



解决 Calendar 插件设置页空白（GitHub Issue #395）。
Calendar 读 `window._bundledLocaleWeekSpec`，而它要等日历视图打开过一次才初始化；
未初始化时读 `.dow` 抛错 → Weekly Note Settings 整段不显示。

**本模块只在变量缺失时补默认值**，三条安全边界：

| 边界 | 说明 |
|---|---|
| 只补不覆盖 | 变量已存在则完全不动，Calendar 自己的配置优先 |
| 只写这一个变量 | **绝不**调用 `moment.updateLocale` / `defineLocale`（那才是真正污染其他插件的操作） |
| 可关闭 | 设置 → 日历 → 「修复 Calendar 设置页空白」，**默认关**（出问题才开） |

**默认开是用户明确要求的**：这是 Bug 修复类开关，不随「日历区功能类开关默认关」一并关闭。
同属此类的还有「显示字数圆点」「格子固定尺寸」，三者都默认开。不要"好心"把它们改回关。

有测试守着这三条（`smoke` / `enhancemode` 套件），改这里前先跑测试。

## 10.6 模块五：周期笔记生成（`src/note.js`）

在日历上点年 / 月 / 周 / 日 → 生成或打开对应笔记。

**两条生成路径**：

| 路径 | 条件 | 行为 |
|---|---|---|
| Templater | 已安装且配好模板 | 调官方 API `create_new_note_from_template` |
| 内置模板 | **仅当 `fallbackToBuiltin` 打开** | 用插件自带模板，填 `{{year}}` `{{month}}` 等变量 |

**默认行为（不要在未经确认时改动）**：Templater 不可用时**直接报错**并给下载链接，
绝不静默降级 —— 静默降级会生成内容不符预期的笔记，比报错更糟。

四种笔记各自的「新笔记存放位置 / 日期格式 / 模板位置」都可配（字段名与 Obsidian
核心「日记」插件对齐）。**日期格式里可以带 `/`**：只有最后一段是文件名，前面各段
自动成为子目录（例 `YYYY/MM/YYYY-MM-DD`），与核心插件一致 —— 迁移时格式串可直接
复制过来，无需手工拆开。拼接顺序为「存放位置 → 日期格式里的目录 → 文件名」。

文件名用 moment 格式串；**若输出与格式串完全相同**（说明没有任何 token 被识别，
例如 `gggg/ww` 在某些环境不支持），则自动回退到内置算法，避免把原始串当文件名。
额外支持核心插件的 `DI`（映射为 `DD-ddd`，即「日-星期」，如 `21-周一`）—— moment
没有这个 token，不处理会把 `D` 当「日」、`I` 原样输出成 `21I`。

**「新笔记存放位置」是纯字面量**：`YYYY`、`MM`、`gggg`、`DD`、`ddd` 一律不替换，
填 `03记录/日记/YYYY` 就会真的建出名叫 `YYYY` 的文件夹。分级只认「日期格式」里的
`/`，与核心插件一致。**不要"修复"这个行为** —— 曾经两个框都解析 token，用户把年份
填两遍，建出 `日记/2026/2026/09` 这类叠层路径，才改成现在这样。

路径拼接**必须走 `buildNotePath` / `buildNoteDir` 统一入口**。历史教训：早期部分调用
点没解析 token、部分解析，同一份配置在不同出口落到不同目录；同理，若 Templater 分支
只用 `noteFolder` 而漏掉日期格式里的 `/`，笔记会建到少了子目录的位置。

设置页的「示例」实时预览**只更新单个元素的文本，绝不重绘设置页** —— 重绘会重建
输入框 DOM 导致输入时失焦（曾经每敲一个字符就失焦一次）。

## 10.7 路径红线：用户可填路径必须过 `normalizePath()`

官方要求所有**用户定义**与**代码构造**的路径，在交给 vault API 之前必须过
`normalizePath()`。这是社区插件审核**最高频的退回原因**。

做法：**入口归一化**，不在 19 个调用点各写一遍（会漏，是典型漂移源）。

| 文件 | 归一化入口 | 覆盖的调用点 |
|---|---|---|
| `note.js` | `fullPath()`（拼路径处）、`resolveTemplate()`、`createWithBuiltin()`、`pruneWordCache()` | 10 |
| `recorder.js` | `resolvePath()`、统计自定义位置 `readCustomStats()` | 6 |
| `pomodoro.js` | `refreshSoundFiles()` 的 `soundFolder`、`adapter.list()` 两处 | 2 |
| `calendar.js` | 批量改名 `applyNoteRenames()` 的 `it.to` | 1 |

两条硬约束：

1. **空串不要 normalize** —— 「留空＝库根目录」是本插件语义，`normalizePath('')` 必须仍是 `''`，不能变成 `'/'`
2. **不改行为** —— `statsCustomPath` 带尾斜杠（「统计/」）仍要命中；「读不到必须明确提示，绝不给静默 0」

可选未改（是插件自己的常量，不是用户输入）：`configio.js` 的 `BACKUP_FILE`、
`pomosync.js` 的 `RUNTIME_FILE`。

> `node_modules/` 是**手写测试 mock**，不是 npm 依赖，**必须入库**。
> mock 的 `normalizePath` 忠实模拟官方实现；写成 `(p) => p` 会把错误用法固化成
> 「通过」的断言，守卫永远绿、真问题永不暴露。

## 11. 数据增长红线

**任何数据都不得随使用无限累积**。已落实的防线：

| 防线 | 实现 |
|---|---|
| 配置废弃键 | `pickKnown()` 白名单合并，DEFAULT_SETTINGS 里没有的键一律剔除 |
| 配置类型污染 | 类型不匹配时退回默认值，不让脏数据扩散 |
| 撤回记录 | 只在内存，每篇 100 条、最多 50 篇，关闭即清 |
| 时段/农历表 | 固定常量，不进 data.json |
| 定时器 | `hide()` / `onClose()` 必清，设置页关闭后不再轮询 |

`node _test/smoke.js`（1204 项）守着以上每一条，改动后必跑。

---

**任何数据都不得随使用无限累积**。具体约束：

| 数据 | 约束 |
|---|---|
| 撤回记录 | 只在内存，每篇 100 条、最多 50 篇，关闭即清 |
| 配置字段 | 迁移时只保留认识的键，废弃键丢弃 |
| 时段/农历表 | 固定常量，不进 data.json |
| 格式串 | 限 60 字符；图标名固定不可填 |

新增任何持久化字段前，先问：**它会随使用越来越多吗？**

---

## 11.5 文件名识别（高亮 / 打开共用一份清单）

高亮要靠文件名反推日期，而文件名格式是用户自己定的。三条约定：

1. **只认清单内的格式**：配置格式 → 用户「额外文件名格式」→ 内置常见异名
   （`note.js` 的 `ALT_FORMATS`）。高亮 `parseNoteRef` 与打开
   `findExistingNote` 共用 `highlightFormats()` 同一份清单，不再各算各的
   —— 早期高亮只认配置格式一条，换个命名风格就失效。
2. **新建只用配置格式**：异名清单仅用于识别已有笔记，绝不用于新建。
3. **宁可认不出，不可认错**：
   - 纯 token 格式（如年记 `YYYY`）不放宽后缀 → `2026年度总结` 不会被认成年记
   - 粗粒度格式（周/月/年）吃到「分隔符+数字」后缀就放弃 → 日记 `2026-09-22`
     不会被周记异名 `gggg-Www` 截成「第 9 周」
   - 匹配顺序 日记 → 月记 → 周记 → 年记，细粒度先行

格式串里的文件夹部分（`gggg/gggg-[W]WW`，Calendar 风格）会自动剥掉再匹配。
用户补充入口：设置 → 日历 → 各笔记 → 「额外文件名格式」，多个用逗号分隔。

## 12. 已决定不做的事（勿重复提议）

- 文件再合并（§9）
- 改回注册制（`SECTIONS` 数组方案够用）
- 模糊词（`改天`/`最近`/`马上`）强转日期——语义不可信，宁可不识别
- 时段名单独转换（如「早上」→几点）——默认关，属编造
- **模块配置彻底隔离（发只读副本）**——实测收益为零、代价明确：
  ① 跨模块写入 **0 处**、整体替换子对象 **0 处**，各模块拿的是自己子对象的别名再改
  （如番茄钟里 `s.profiles.push(p)`，`s` 即 `settings.pomodoro`），改坏也只祸害自己那份；
  ② 模块本来就要保存自己的设置（番茄钟存方案、日历记开关），发副本会先让这些保存失效，
  为救它又得新造一套「受控写回」机制，新机制自己就是新 bug 来源；
  ③ 3 处跨模块读取全是合理依赖（时间戳读日历、会话记录读番茄钟、判定表读时间戳）。
  已有替代：`registerModule()` 统一兜错（注册期崩了不影响其他模块）+ `_test/moduleisolation.js`
  + `_test/namespaceguard.js`（守「不许一把抹掉整个模块配置」）。
  注：跨模块写入静态扫不出来（模块都用别名 `s.xxx` 操作），只能靠 review。

---

## 13. 命名规范（上架硬性要求）

- 插件 id：`time-tools`
- 命令 id：`time-tools-<module>-<action>`，仅小写字母数字连字符
- `manifest.json` 的 name 不含 "Obsidian"，仅 Basic Latin

## 14. 命令与视图类型清单（自动校验）

下列 id 由 `_test/arch-doc.js` 自动扫描源码**双向**校验（代码有文档无 / 文档有代码无，
都报错），新增或删除命令时必须同步进本节。这是命令清单的**唯一权威来源**，§5 只讲约定。

| id | 说明 |
|---|---|
| `time-tools-timestamp-insert` | 插入当前时间戳 |
| `time-tools-timestamp-open-panel` | 打开时间戳面板 |
| `time-tools-timestamp-convert` | 时间转换（选中文本） |
| `time-tools-timestamp-undo-convert` | 撤回上一次时间转换 |
| `time-tools-pomodoro-start` | 番茄钟：开始 |
| `time-tools-pomodoro-start-next` | 番茄钟：开始下一段 |
| `time-tools-pomodoro-toggle-pause` | 番茄钟：暂停/继续 |
| `time-tools-pomodoro-toggle-timer` | 番茄钟：开/关计时显示 |
| `time-tools-pomodoro-skip` | 番茄钟：跳过当前段 |
| `time-tools-pomodoro-stop` | 番茄钟：停止 |
| `time-tools-pomodoro-open-popout` | 番茄钟：打开独立窗口 |
| `time-tools-pomodoro-toggle-desk-dock` | 番茄钟：切换桌面常驻（缩小主窗口） |
| `time-tools-pomodoro-reapply-window` | 番茄钟：重新应用独立窗口设置 |
| `time-tools-pomodoro-toggle-countup` | 番茄钟：切换正计时（专注段不限时） |
| `time-tools-timestamp-batch-convert` | 时间戳：批量转换（整篇笔记，先预览后替换） |
| `time-tools-pomodoro-show-stats` | 番茄钟：查看累计统计（数据源见「累计统计数据源」设置） |
| `time-tools-pomodoro-open-settings` | 番茄钟：打开设置 |
| `time-tools-calendar-open` | 打开日历（可生成日/周/月/年记） |
| `time-tools-calendar-close` | 关闭日历 |
| `time-tools-notes-rename` | 批量把已有笔记改名成当前「日期格式」（先预览后执行） |
| `time-tools-config-export` | 导出配置（备份到库根目录，固定文件名覆盖） |
| `time-tools-config-import` | 导入配置（粘贴 JSON，走白名单清洗后覆盖） |

视图类型：

| 类型 | 说明 |
|---|---|
| `time-tools-timestamp-view` | 时间戳面板 |
| `time-tools-pomodoro-view` | 番茄钟面板 |
| `time-tools-calendar-view` | 自研日历面板 |

## 15. 版本库维护（Git 入库）

面向维护者，非插件功能。详见仓库根 `DEVELOPING.md`。

| 事项 | 结论 |
|---|---|
| `node_modules/` | **必须提交** —— 是手写测试 mock（约 10.6KB），不是 npm 依赖。忽略它 = 克隆后 55 个套件全部 `MODULE_NOT_FOUND`，且 `npm install` 救不回来（无 `package.json`） |
| `package.json` | **不要新建** —— 将来 `npm install` 会覆盖手写 mock |
| 提交前 | `bash _run_tests.sh` 必须 `通过 55 / 失败 0`；可配 `git config core.hooksPath .githooks` 自动跑 |
| `time-tools/main.js` | 入库 —— Obsidian 安装只认 `main.js` / `manifest.json` / `styles.css` 三件 |
| `time-tools.zip` / `启动卡/` / `_stage/` / `_archive_临时脚本/` / `__pycache__/` | 已忽略，不入库 |
