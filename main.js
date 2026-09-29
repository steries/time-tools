/*
 * 时间戳与番茄钟 — 构建产物（由 build.js 从 src/ 合成，请勿直接编辑）
 * 源码：src/ 下全部模块（顺序见 FILES），由本脚本按序合成
 */
'use strict';
(function () {
  var __hostRequire = typeof require === 'function' ? require : null;
  var __obsidian = __hostRequire ? __hostRequire('obsidian') : null;
  var __modules = {};
  var __cache = {};

  function resolve(parentKey, request) {
    if (request === 'obsidian') return '__obsidian__';
    /*
     * 裸模块名（不以 './' 开头，如 @codemirror/view）：内部没注册就交给**宿主运行时**。
     *
     * 之前所有非 obsidian 请求都当内部模块解析，结果
     * require('@codemirror/view') 恒定抛 "module not found"，
     * CM6 装饰永远挂不上、撤回图标永远不显示 ——
     * 而测试却全绿，因为沙盒里 src/ 走的是 Node 真实 require（能解析到 mock 包），
     * 两条路径完全不同。这个 bug 因此藏了 5 个版本。
     */
    if (request.charAt(0) !== '.') {
      if (!__modules[request] && !__modules[request + '.js']) return '__host__:' + request;
      return request;
    }
    var base = parentKey.indexOf('/') === -1 ? '' : parentKey.slice(0, parentKey.lastIndexOf('/'));
    var joined = (base ? base + '/' : '') + request;
    var parts = joined.split('/');
    var stack = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p === '' || p === '.') continue;
      if (p === '..') stack.pop();
      else stack.push(p);
    }
    var key = stack.join('/');
    if (!__modules[key] && __modules[key + '.js']) key = key + '.js';
    return key;
  }

  function load(key, parentKey) {
    if (key === '__obsidian__') return __obsidian;
    // 宿主提供的外部模块（@codemirror/* 等）：直接转交宿主 require
    if (key.indexOf('__host__:') === 0) {
      // 前缀长度必须按字符串算，不能写死 8（'__host__:' 实际是 9 个字符）
      var ext = key.slice('__host__:'.length);
      if (!__hostRequire) throw new Error('[bundle] 宿主未提供模块: ' + ext);
      return __hostRequire(ext);
    }
    if (__cache[key]) return __cache[key].exports;
    var fn = __modules[key];
    if (!fn) throw new Error('[bundle] module not found: ' + key);
    var m = { exports: {} };
    __cache[key] = m;
    var req = function (request) { return load(resolve(parentKey || key, request), key); };
    fn(m, m.exports, req);
    return m.exports;
  }

  __modules['src/i18n-en.js'] = function (module, exports, require) {
const EN = {
  "k920aec3b": "🍅 Start pomodoro",
  "k390e1e9d": "Focus {0} min \u00b7 unlimited cycles",
  "k396977ae": "📋 Open pomodoro panel",
  "kb9ab6cbd": "Show in sidebar",
  "k1f05dd7e": "tomorrow = the day after tomorrow\n2026-10-01 + shipping day\nyesterday -",
  "k57aa8108": "Off: forward gives the festival name only, reverse gives the date only.",
  "k8f0cfdcf": "Example: tomorrow = the day after tomorrow / 2026-10-01 + shipping day / yesterday -.",
  "kf687009c": "Overriding is not deleting: remove your own line to restore the built-in rule.",
  "k70706b27": "the same rules are also applied before it decides which day/week a note belongs to,",
  "kd1ca4689": "so old names can be recognised without renaming. Both parsers share one rule set.",
  "k5c007aba": "If highlighting or dots look wrong, turn this off to restore the previous behaviour.",
  "grp.forward": "Common conversions (forward ⇄ reverse)",
  "grp.lunar": "Lunar conversions (forward ⇄ reverse)",
  "grp.festival": "Festival conversions (forward ⇄ reverse)",
  "grp.countdown": "Countdown / date difference",
  "grp.advanced": "Advanced",
  "ka775650d": "Mobile shortcut: while editing, tap the wrench on the toolbar above the keyboard → Add command → search for the 时间戳 command → add.",
  "k7472c7a5": "Or set it as a top pull-down gesture in Settings → Options → Toolbar → Quick commands.",
  "k924824c5": "Festival name with date",
  "k3903e1d6": "On (default): both directions output a 'festival name + date' form.",
  "kabe37104": "Custom festivals",
  "kfb6e20ce": "One per line, so days like a birthday can convert both ways. See the syntax notes below.",
  "k2ca9949e": "Time format",
  "k635ea6c0": "moment syntax, with a live preview below.",
  "k02c2adcd": "Show seconds",
  "k43f681ca": "Off (default): all time output stops at minutes, and seconds in the format string are dropped. On: keep seconds.",
  "k45e78490": "Newline after insert",
  "k80d351e7": "Adds a line break after inserting a timestamp, convenient for logging line after line.",
  "k1ef6fa49": "Slash command",
  "k78ceb0e9": "Type /now (or /ts, /time) to open suggestions; click one to insert.",
  "k777cf6f3": "Custom trigger word",
  "k6589ba41": "Adds one more trigger word, without the slash. E.g. filling in date makes /date work too.",
  "kca5eb00f": "e.g. ts",
  "k1c3d56cc": "Extended conversions",
  "k48b1d04a": "Master switch. Select text and run the time conversion command to turn it into relative time, weekday, journal link and so on.",
  "k194ffbb3": "Unified format string",
  "kea0bc7c2": "Lunar calendar",
  "kfdc30606": "Master switch. When off, **every date is treated as solar**: conversions to lunar, ganzhi and zodiac, solar terms, and lunar to solar all stop working, and the sub-switches below stop working too.",
  "kb2d63591": "Chinese numerals mean lunar",
  "k8d574624": "Off (default): 五月十六 and 五月十六号 are lunar, while forms ending in 日 (五月十六日) are solar. On: uppercase Chinese numerals are always lunar and Arabic digits are always solar.",
  "k3775f823": "Recognize a trailing marker too",
  "k6d51a9fb": "Off (default): only recognises forms with the marker **in front**, such as 农历2026年八月初九. On: a marker written after the date (e.g. 2026年八月初九 农历) is recognised too.",
  "k6dd34c3f": "Treat day-suffix forms as lunar",
  "k00ff190f": "Off (default): Chinese numerals such as 五月十六号 are lunar while Arabic digits such as 5月16号 are solar. On: anything ending in 号 or 日 is treated as lunar.",
  "kd325b572": "Rules",
  "k2d3e0d82": "Operators: = replace (an empty result hides the item), + append (keep the built-in result and add text), - hide (the item never appears).",
  "kd3217aeb": "Let rules apply to calendar parsing",
  "k786b9bea": "Off by default - rules then apply only to converting a selection. When on, the calendar also uses them when recognizing note names",
  "k6587da46": "Include workdays in the date difference",
  "kbbfd43a0": "When on, \"Date difference\" also reports the number of workdays (weekends excluded only; public holidays are not covered). It walks through the interval, so long ranges are slightly slower.",
  "k01bb83dc": "Control forward and reverse separately (advanced)",
  "kc90bcc57": "Off by default: forward and reverse share one switch (e.g. \"Relative time ⇄ Date\"). When on, each pair expands into two separate switches.",
  "kfa8034e3": "Collapse the conversion switches",
  "k8f510b84": "When on, the switch list collapses to group headers only (a header shows how many are on); click a header to expand.",
  "k6c6df985": "Relative time with a reference note",
  "k14479de6": "When on, results look like \"2 days later (relative to 2026-09-22)\"; when off, only \"2 days later\" is produced. Keeping it on is recommended, otherwise you cannot later tell what it was relative to.",
  "k48ef619d": "With no selection: append after the original",
  "kbf40aee7": "Off (default): the auto-detected time is replaced by the result. On: the original text is kept and the result is appended. This only affects cursor auto-detection; a manual selection is always replaced.",
  "k9b7eef03": "Show an undo marker after converting",
  "k0fe85bb7": "On (default): a clickable undo icon appears after each conversion result; click it to restore. A note can hold several, so just click them one by one. The icon is a temporary editor decoration: it takes no characters in the text and is never stored in the note. After closing Obsidian all conversion records are cleared, the icons disappear and undo is no longer possible. Turning this off disables undo entirely: no icons, no records, and the undo command stops working too.",
  "k2e6560ac": "Convert period names on their own",
  "k1554c109": "Off by default: words such as 早上 or 下午 on their own are not converted, because there is no agreed hour for them and inventing one would be making things up. When on, they convert using the hour values below. Forms that already carry a time, such as 早上8点, are unaffected and always work.",
  "k113e2ef3": "Journal link format",
  "k609e6c5c": "The date format used by the journal-link conversion; it must match your journal file naming.",
  "kf7f8c9db": "Conversions",
  "kcf85d825": "Only the conversions you enabled are listed. Switching re-scans the preview.",
  "k0716d5c5": "Apply replacements",
  "k44a76734": "Duration profile",
  "k7a2bebaa": "Once chosen, this session runs with that profile's focus and break durations.",
  "k12bec730": "Rounds",
  "kdb27d153": "Enter a number to stop automatically after that many rounds; leave empty for unlimited.",
  "k8441b348": "Unlimited",
  "kce717abb": "Current profile",
  "kf099c7bc": "The durations below change along with the profile.",
  "k26bb8418": "New",
  "k2f4aaddd": "Delete",
  "k1b0b239b": "Profile name",
  "k87873bc7": "e.g. work, study, reading",
  "k4bd2ddba": "Count-up (untimed focus)",
  "k73559598": "When on, the focus segment counts up from 0 and never ends by itself — you stop it with \"Skip\" or by ending the session. Useful for measuring how long something actually took. Applies to focus segments only; breaks still count down for the duration set above. You can also toggle it with one tap on the \"Ready to start\" panel after pressing Start, or with the ＋/－ button on the idle screen.",
  "kefa6408b": "Count-up soft target (minutes)",
  "k2e64366c": "Notifies and rings once at this many minutes without stopping the timer. 0 means no reminder. Requires count-up.",
  "kec5bbff6": "Count-up limit (minutes)",
  "k48571ed9": "After this many accumulated minutes the timer **stops automatically** and prompts you to start over, so it cannot run forever if you forget. The segment that hits the cap is **not counted as focus time** (the overtime data is not trustworthy). Default 1440 (24 hours); enter 0 for no limit.",
  "kd84df1fb": "Count-up interval reminder (minutes)",
  "k8e9e461e": "Remind every this-many minutes: 20 means at the 20th, 40th, 60th minute and so on (reminder only, the timer keeps running). Unlike \"soft target\", **this is a repeating metronome**, since a soft target rings only once. Enter 0 for no reminder. Requires count-up to be enabled.",
  "k6611323b": "Cumulative stats source",
  "kc481bba7": "Decides where the \"Pomodoro: view accumulated stats\" command reads from. Default is \"Off\" (no data stored). · This device: the plugin keeps its own tally, exact, but lost if you switch devices or clear settings. · Parse notes: reads your session-record notes on the fly, durable, but inaccurate if you changed the write format. · Custom location: reads the note or folder you specify below.",
  "k155b1220": "Custom stats location",
  "kfd612adc": "Read from here when the data source is \"Custom location\" (this field collapses for other sources). You can enter one note (e.g. Stats/Focus.md) or a folder (e.g. Stats); a folder covers every .md inside it. Leave blank for no stats. A wrong path gives an explicit \"nothing read\" message rather than a silent 0.",
  "kbb8c44f9": "e.g. stats/focus.md or stats",
  "k8e3f14cd": "DataView integration",
  "ke50d90ae": "Off by default. When on, writing a session record appends DataView inline fields at the end according to the field table below, for your own dataview queries to read. While off, not a single extra character is written and existing notes are untouched. You need the DataView plugin installed to query them.",
  "kc7bde7ac": "DataView field table",
  "k6ddd4a9b": "One field per line, in the form fieldname::{{VALUE:variablename}}. Focus duration is recorded by default; add the rest yourself. Field names are freely editable, including focus duration. Clearing the box writes nothing. Available variables: date, time, range, cycles, focus (whole minutes), rest (whole minutes), focusText (focus duration with unit, follows \"Record to seconds\"), restText, pauses, longBreaks, skippedFocus, skippedBreak, profile.",
  "k61ec67be": "Long break interval",
  "k8f75ce4f": "After this many rounds, a dialog asks whether to take a long break (global, not per profile).",
  "k76bdc67a": "Auto-start the next segment",
  "kd0b0fdcf": "When on, focus flows into the break automatically; when off you must click Start break to continue.",
  "k54a618fd": "Counting after a long break",
  "k039ed8fa": "Reset starts over from round 1; keep accumulating continues the running total.",
  "k59b19be2": "After declining a long break",
  "kfad59e29": "When to ask again after you clicked Keep focusing.",
  "kaf1afec7": "Pause prompt threshold",
  "k9168d517": "After this many pauses within one segment, a dialog asks whether to restart the round.",
  "k813152a2": "Interface mode",
  "kfb12cd83": "The floating window is draggable; the sidebar is docked in the right panel; the separate window opens a real system window outside Obsidian and keeps timing even when the main window is minimised. Mobile does not support a separate window and always uses the sidebar.",
  "k597abe50": "Window width",
  "k960865cc": "Pixels. Empty or 0 leaves it to the system.",
  "k019594cc": "Window height",
  "k85045476": "Same as above. Exact when the Electron window API is available, otherwise only a suggestion.",
  "k357b1d03": "Window position",
  "k23dd67f6": "Which screen corner to use (the taskbar is avoided); pick \"Let the system decide\" to not interfere at all. The position is set once when the window opens, so dragging it afterwards will not be undone.",
  "kc367a5c6": "Always above other windows",
  "k6aef237a": "Keep the pomodoro floating above all other apps. It depends on a system window API; when unavailable it silently does nothing (the window still opens, just not on top).",
  "k18b8cdb4": "Hide the inner window UI (not borderless)",
  "k5fa62f08": "True borderless is not achievable: the outermost frame and the title bar are drawn by the system, and Electron can only decide at the moment the window is created, while a pop-out is created by Obsidian, so the plugin cannot change an existing window. They will always show; this is not a bug. This switch only hides Obsidian's **internal** UI elements: the tab bar, status bar, left icon rail and both sidebars, letting the pomodoro fill the content area. For a genuinely edge-hugging small window, use \"Desktop dock\" below.",
  "k73ce778c": "Desktop dock (shrink the main window)",
  "ka327d21d": "Shrinks the main window to the pomodoro's size, pins it on top and moves it to a screen corner, with the pomodoro shown as a floating window inside it. This is the alternative to \"the separate window cannot drop the system title bar\". Note: once on, the main window stays that small and normal note work is affected; turning the switch off (or running the command again) restores the previous size and position. Requires \"Interface = floating window\"; enabling it also leaves the settings page and returns to your notes.",
  "k6e21574a": "Docked window width",
  "k62a61d58": "Pixels. The width of the shrunk main window; empty or 0 uses the default 365.",
  "kcd0bc52e": "Docked window height",
  "kb2ea5a52": "Same as above, default 378. Toggle Desktop dock off and on to apply a change.",
  "kd24f0447": "Docked window position",
  "ka821fa0a": "Which screen corner to move to after shrinking (the taskbar is avoided).",
  "k50040f0e": "Snap to an edge after dragging",
  "k5352294a": "On release it snaps to the nearest edge; when off it stays where you released it.",
  "k6f66fea9": "Default snap edge for the floating window",
  "kab2157cc": "Only applies when snapping is on. You can also just drag the floating window to any edge.",
  "kc05965c2": "Show the left sidebar icon",
  "k84c28a4a": "When on, a 🍅 icon appears in the left rail; clicking it opens the start panel. When off, it can only be summoned from the command palette or the 🍅 in the bottom status bar.",
  "k9970ad07": "Theme",
  "k66d405b0": "Five built-in themes: Classic (card) · Minimal (plain text) · Flowing light (animated glow) · Ethereal purple (light glass) · Scythe (dark red blood-flow). Choosing \"Custom\" means the plugin provides no styling at all and leaves everything to your CSS.",
  "k76c43b23": "Custom CSS",
  "k8147d263": "CSS written here is injected into the page; just start your selectors with .pomo-theme-custom, e.g. .pomo-theme-custom .pomo-time { color: #f66; }. The easier route is to override only the variables — see the template below, which you can copy wholesale and then change the numbers.",
  "k1eb7e2f9": "Segment end notification",
  "kf92fc0ba": "Shows an Obsidian notification at the end of every focus and break segment.",
  "k8afcf125": "Guard dialogs against accidental closing",
  "kbc570652": "Dialogs such as the finish and long-break prompts need this many clicks outside the dialog before they close. Enter 1 for no interception (one click closes it). Buttons inside the dialog and Esc are unaffected.",
  "k95ffd3d4": "Notification sound",
  "ka6ba5456": "Plays a sound when a segment ends.",
  "k2aeed95d": "Sound source",
  "k792bedaf": "Built-in sound is synthesized by the system and needs no file; custom plays audio from the folder you choose.",
  "k779c8ad4": "Audio folder",
  "k8291bfa6": "sfx/alert",
  "k75e1781b": "Rescan",
  "k8c93fea4": "Type /pomodoro in a note to open the Pomodoro.",
  "k50cbeaf7": "Trigger word",
  "kfdc653bd": "Default is pomodoro, i.e. /pomodoro. Change it freely; no leading slash needed.",
  "kf9ecdf4e": "Show the suggestion hint",
  "k62efe8d5": "Shows a grey hint when a duration is outside the usual range, without blocking you.",
  "k34aed95b": "Enable the Time Tools calendar",
  "kb1ee8965": "Once enabled, the \"Calendar\" command opens a month grid: clicking a year / month / date / week number creates the yearly, monthly, daily and weekly note respectively.",
  "kea445a06": "Show word-count dots",
  "k54fc7f05": "Shows dots under a date based on that day's journal length. Turning it off keeps the view cleaner.",
  "kaf1120c5": "Show the lunar date in day cells",
  "kbcdf1332": "Off by default. When on, date cells show the lunar date (the 1st shows the month name, others show the lunar day) and **replaces the word-count dots**: a note then only shows a small dot beside the lunar text. Cell space is limited, so the two are mutually exclusive.",
  "ka43c4195": "Words per dot",
  "kea46a20c": "Date-cell dots = the daily note's word count ÷ this value; the week column = that week's own weekly note word count ÷ this value (no weekly note, no dot). Blank or 0 falls back to \"has note = 1 solid dot\". 5 per row, max 10. Too small a value (e.g. 1) pins everything at the cap, so 50 or more is recommended.",
  "kfe9269df": "Fixed cell size",
  "k870b36c0": "When on, cell height is fixed and does not stretch with the panel, giving a tighter layout. When off, six rows share the available height.",
  "k8bd3cd15": "Week start day",
  "k32510d13": "The single week-start day for the whole plugin: the grid, week numbers, \"week N\" parsing and the Calendar default fix all use it. Keep it the same as Calendar's \"Start week on\".",
  "k15d34898": "Allow both calendars at once (dual mode)",
  "k39f93908": "Off by default = the two calendars are exclusive: enabling one turns off the other. Turn on to allow both.",
  "k82aca320": "Use native Calendar for day and week, Time Tools for month and year",
  "k98defe6b": "Half takeover. When on: date / week-number clicks are passed through to native Calendar (the template goes through the core Daily notes plugin, with Templater syntax covered by the catch-up run in the collapsible section); year / month clicks are taken over by Time Tools and go through Templater. Good if Calendar already handles your daily and weekly notes and you only want to add monthly and yearly ones. Mutually exclusive with \"Take over clicks\" below.",
  "k60622dbe": "Take over clicks on the Calendar view",
  "k499ba9ea": "Full takeover. When on, all year / month / week / date clicks in the Calendar view are generated by Time Tools and always go through Templater templates. It depends on Calendar's internal DOM and may break after a Calendar update, so it is off by default. Mutually exclusive with \"Use native for day/week\" above; enabling it also collapses the Time Tools calendar unless both are allowed.",
  "k9c43a4e6": "Open this if the Calendar plugin misbehaves",
  "k4a21c3d1": "Only a collapse toggle: it changes no behaviour by itself and starts collapsed, while the switches inside still work as usual. Open it when the Calendar settings page goes blank or Templater syntax is not executed.",
  "kf3de8a42": "Fix a blank Calendar settings page",
  "kbb05cdfc": "When on, if window._bundledLocaleWeekSpec is missing it is filled with a default value (filled in only, never overwritten). It does not change moment's global locale and does not affect other plugins. Off by default, so turn it on when the Calendar settings page appears blank.",
  "k74d9faed": "Apply now",
  "k2ebd6bee": "Applies it once more by hand (usually unnecessary; it takes effect after restarting Obsidian).",
  "k5b0520a9": "Apply",
  "k1eac6a23": "Re-run Templater for notes created by Calendar",
  "kfd7b77ee": "With all three calendar switches off, native Calendar creates daily / weekly notes through the core Daily notes template channel, where the template is copied verbatim and <% %> is not executed. Turn this on and the plugin rewrites such new notes with Templater (empty file, contains bare <% %>, or the whole text equals the template source). Already-rendered files are left alone, and this does not stack with Templater's own \"trigger on create\". Detection needs \"file name matches the format + lives in the folder above\", so Calendar must create into that same folder.",
  "kdeb01a5c": "Fall back to the built-in template",
  "k5dfd0317": "Fall back to a simple built-in template when Templater is unavailable. Off by default, in which case you get a clear prompt to configure Templater rather than silently getting notes whose content is not what you expect. The built-in template has only a few basic variables; for weather, habit check-ins, conditionals and other complex logic, use Templater directly.",
  "k398e51ca": "Date format",
  "kb8a9c9ce": "moment syntax; determines the file name. **You can include / to write into a subfolder** (e.g. YYYY/MM/YYYY-MM-DD): only the last segment becomes the file name, same as the core Daily notes plugin. Leave blank to use the default ({0}). Common tokens: YYYY year, MM month, DD day, ddd Tue, gggg week-year, ww week number, DI = day-weekday (same as DD-ddd, kept for compatibility with the core plugin; use ddd if you only want the weekday). Note: changing this only affects files created afterwards.",
  "kecaa48f5": "Where new notes are stored",
  "k750e7faa": "Leave blank for the vault root. This box **does no date substitution**: YYYY, MM, gggg, DD and ddd all stay literal (entering YYYY really creates a folder called YYYY).\\nTo nest by year/month, put it in the \"Date format\" above instead, which behaves exactly like the core Daily notes plugin. This value is concatenated with the folders produced by / in the format, in order (this one first).",
  "k724352a6": "Empty means the vault root",
  "k1d520488": "Template location",
  "kf4c631a1": "Full path to the Templater template, including .md. The <% %> syntax is recommended (supports weather, habit check-ins and conditions).",
  "kdd4423f7": "e.g. 04vault/1templates/journal.md",
  "k6468a655": "Extra file name format",
  "k39bdb13e": "Only used to recognise existing notes (highlighting, click to open); new notes still strictly follow the \"Date format\" above. Separate several with commas; folders are allowed.",
  "ke9b2e308": "Enable session logging",
  "ke5c4bf9f": "Master switch. When off, nothing is recorded at all, the \"Record\" button is hidden in the finish dialog, and the recording settings below collapse.",
  "kd7eabbe2": "Record automatically",
  "k20fea307": "On: logs automatically when a Pomodoro ends. Off: only when you click Record in the end dialog.",
  "k20fa0a06": "Record down to the second",
  "ka3226c87": "Off (default): durations are recorded in minutes with seconds dropped, e.g. \"Focus 25 minutes\". On: recorded down to the second, e.g. \"Focus 25 min 30 s\". Count-up and count-down share this switch.",
  "kd3b0ddff": "Write mode",
  "k649cc2f2": "Built-in: writes to the top of the chosen note. QuickAdd: hands it to a QuickAdd choice. Clipboard only: copies the result for you to paste.",
  "k7d3a534f": "Default note name",
  "kaa413c0f": "Prefilled in the end dialog; you can change it for this one time.",
  "k36829df4": "Pomodoro log",
  "k17b4670e": "Storage folder",
  "kc9d36099": "Optional. A folder path inside the vault; empty means the vault root.",
  "k72c41c0e": "e.g. pomodoro-logs",
  "k9d6b52a2": "Write template",
  "ked22713c": "Placeholders: {{date}} {{time}} {{range}} {{cycles}} {{focus}} {{rest}} {{focusText}} {{restText}} {{pauses}} {{longBreaks}} {{profile}} {{skippedLine}}. {{focus}}/{{rest}} are integer minutes and do not follow the precision switch; {{focusText}}/{{restText}} carry their own unit and follow the \"Record to seconds\" switch above. For the switch to take effect, use {{focusText}} in your template (the default already does); if you customised the template and wrote \"{{focus}} minutes\", change it to {{focusText}} and drop the trailing \"minutes\", or it renders as \"25 min 30 s minutes\".",
  "ke7e129e6": "Choose an existing choice",
  "k369f7b53": "Choice name",
  "k9774707e": "Must match the choice name shown in QuickAdd. Press refresh next to it to re-read the list.",
  "k1228d763": "e.g. pomodoro-write",
  "k93bc1f09": "Refresh list",
  "k3a068994": "Validate the choice name strictly",
  "k81fc017e": "When on, an option name missing from the list is rejected with a prompt showing the available options. The list may not include nested options, so keeping this off is recommended.",
  "k9827fdaa": "Fall back to built-in writing when integration fails",
  "k56b8e012": "On: if QuickAdd is unavailable the entry is written into the note automatically, so nothing is lost. Off: a failure means no record, which keeps your notes clean.",
  "k4202a475": "Copy to the clipboard before running",
  "k688eff37": "Puts the result on the clipboard before calling QuickAdd; if it still shows an input box, Ctrl+V fills it.",
  "kacf03fb2": "Copy the variable string",
  "kfad06f30": "Click to copy {{VALUE}}, then paste it into the Capture format to fill in this run automatically.",
  "k72a75f35": "Copy {{VALUE}}",
  "kf5744906": "Test run",
  "kfaf9021a": "Runs once immediately with sample data and tells you the reason if it fails.",
  "k1a6aa24e": "Run",
  "lang.title": "Interface language",
  "lang.name": "Display language",
  "lang.desc": "Only affects text shown in the settings UI. Notes, features and data are untouched. Applies immediately.",
  "lang.note": "Note: Simplified Chinese is the base text, so anything untranslated stays Chinese; Traditional Chinese is converted by a character table and may read oddly in places.",
  "tab.ts": "Timestamps",
  "tab.pomo": "Pomodoro",
  "tab.cal": "Calendar",
  "k75e90ef6": "Note creation",
  "k7c0e24c0": "Dots",
  "kcc0760bc": "Week starts on",
  "k3a84cae1": "Calendar plugin",
  "k43ddc26d": "Calendar enhancement",
  "ka848765c": "Today",
  "ked517b57": "Week",
  "kcf7c9e2b": "The notes below will be renamed to the current date format. Obsidian performs the rename and internal links update automatically;",
  "ka9b35478": "…and ",
  "k2c5d791d": "Rename",
  "k949856b3": "Cancel",
  "k2a08ec21": "Import configuration",
  "k86357ff9": "Paste the full JSON you exported. Import is filtered by a whitelist, so obsolete fields from older versions are dropped. Your current configuration will be overwritten.",
  "k4fe38eb0": "Import and overwrite",
  "ke7b4064f": "Variables available in the built-in template (basics only)",
  "k6e1c436d": "For weather, habit check-ins, conditional logic and other advanced content, use Templater —— just fill in a Templater template in the \u201cTemplate file\u201d field above, and this plugin will call it first.",
  "k69c5eac1": "e.g. {0}-ddd, {1}",
  "k364e9422": "🍅 Ready to start",
  "keb5a9b15": "How many pomodoro rounds do you think this task needs? (focus + break = one round)",
  "kdb759ce6": "Timing mode: count-down ticks down from the profile duration; count-up starts at 0, accumulates, and never ends by itself.",
  "kccbb967e": "Count-down",
  "k08780ced": "Count-up",
  "kba358518": "Unlimited",
  "k22696cbc": "Start",
  "k3111fb87": "Asks about a long break every {0} rounds ({1} minutes)",
  "k3e13259a": "🍅 {0} rounds completed",
  "k5f922dfe": "Take long break",
  "k91c6e1ea": "Keep focusing",
  "k8dc0e283": "🍅 Paused several times this round",
  "k616ddc13": "Restart this round",
  "ka6621a08": "Continue current progress",
  "ke772dd03": "🍅 Pomodoro",
  "k197c30db": "Pause",
  "k3ae7f41f": "Skip",
  "k1da8a247": "End",
  "k44d41ebe": "Focus",
  "ke55c8529": "Break",
  "k7f378cec": "Pomodoro",
  "k897ba57d": "Focus {0} min · short break {1} min · a long break is offered every {2} rounds",
  "ke697bb8b": "Duration profiles",
  "kce1fe81f": "Stores focus / break durations by scenario; pick any set when starting a pomodoro.",
  "ke93ed83e": "Rhythm",
  "k48da131d": "The rhythm settings below are global and do not change with the profile — switching profiles only changes the three durations above.",
  "k0196846b": "Interface",
  "k6d40d527": "Reminders",
  "k4f15a310": "Slash command",
  "k301739cd": "Other",
  "kd40b0a0f": "Session log",
  "k8e085b92": "Writes the result into a note when a pomodoro ends, or hands it to QuickAdd.",
  "k9ce003cb": "Log settings (closed — click to expand)",
  "k16e7dbf8": "Master switch is off: the settings below have no effect, but the values are kept — turn the master switch back on to restore them.",
  "ka2c8ab04": "Built-in writing",
  "k447d4a75": "QuickAdd integration",
  "k60245dcf": "Pick one of the choices configured in QuickAdd, {0} in total{1}.",
  "k5fce7533": "Available variables",
  "k3c470548": "Restore defaults",
  "k534ce29d": "Settings page failed to render: ",
  "kf71c4ba4": "Current timestamp",
  "kb40aaf3e": "Insert current time",
  "kd53b1b0a": "Quick formats",
  "kf0f153f2": "Festival conversion",
  "ke4e64bcf": "Timestamp inserter",
  "k8bb0a1ed": "Mobile / slash command",
  "k3d03d01a": "Preset formats",
  "k8afddc3f": "Common syntax",
  "k87dbb7d5": "🔄 Time conversion",
  "kef75efa9": "Selection",
  "k44ee7a53": "Relative reference (empty = now)",
  "k39b523bd": "Close",
  "k1c74cf5a": "This is a relative-time description",
  "k5dda8431": "Apply",
  "kc88c0e47": "Date offset",
  "k6cc01e73": "Apply offset",
  "k60969377": "Extension: time conversion",
  "k6edb2ee2": "Conversion settings (closed — click to expand)",
  "k21e6e71a": "Master switch is off: the settings below have no effect, but the values are kept. The command palette, context menu, slash command and undo marker are all disabled too.",
  "k4886d4c7": "Leave blank to follow the timestamp format above (currently: {0}). Examples: YYYY-MM-DD, YYYY年MM月DD日, YYYY-MM-DD HH:mm.",
  "k5aa7322d": "Hours for each period (0–23)",
  "kb9467966": "Batch convert the whole note",
  "ke4b49736": "Failed to read the note; batch conversion cancelled.",
  "k0b86faea": "…and {0} more",
  "tab.lang": "Interface language",
  "lang.auto": "Follow system (English when undetectable)",
  "lang.cal.name": "Calendar language",
  "lang.cal.desc":
    "Only affects month and weekday names in the calendar grid. Date format, week start, note content and naming are unaffected.",
  "lang.cal.auto": "Follow display language",
  "k807bc5f8": "Current: {0}",
  "kbc7fdc3c": "Current: {0} (this run: {1})",
  "k1c3c863e": "Batch rename ({0})",
  "ka9056760": "Copies the summary text to the clipboard when a pomodoro ends; press Ctrl+V in any note to paste it.",
  "k01dc8de8": "Entries are inserted at the top of the note; if the note has frontmatter, they go right after it.",
  "kff91e157": "Could not read the option list. Type the name below instead — it must match the QuickAdd option name exactly.",
  "k8debd4e8": "More formats can be customized in settings (moment syntax).",
  "ka729e72a": "Enable \"Relative time → date\" under Settings → Timestamps → Extended → Reverse to apply in one click.",
  "k6e73cad1": "Usage: select a time text → right-click or run \"Time conversion\" from the command palette → pick an item → apply. With nothing selected, the time on the cursor line is detected automatically.",
  "k339dad51": "Only shows conversions matching the selected text — e.g. \"Relative time → date\" appears only when you select \"tomorrow\".",
  "k8929d074": "Time conventions",
  "k357857c1": "Custom conversion rules (one per line: text operator result)",
  "kdabd637e": "This module keeps no history or cache; nothing is left in your vault after closing.",
  "kd1397a2a": "Progress is not saved. Closing Obsidian resets the count; reopening restores settings only, so you must start manually.",
  "k12c0c154": "No time was recognized in this text, or the relevant conversions are all off. Selectable forms: 2026-09-19, 2026 09 19, 14:30, tomorrow, in 7 days",
  "k84406372": "Tip: to undo right after a conversion, Ctrl+Z (system undo) is easiest;",
  "kf49864b0": "if you edited elsewhere afterwards, click the undo icon after the result to restore it.",
  "k4ec24480": "Click {0} more time(s) to close (or press Esc / the button below)",
  "k3c627aea": "Efficiency usually drops after 4 cycles; consider a long break in between.",
  "kd0800fb0": "{0}  {1} cycle(s) completed",
  "ka4e706c8": "Target {0} cycles",
  "k8d531e21": "No target",
  "k510b20d5": "{0} · {1} min focused",
  "ke217c5bf": "Focus",
  "kaf0f24e2": "Long break",
  "k4fcaa04f": "Short break",
  "kd6faf18e": "Next: {0}",
  "k70df2063": "Start focus",
  "k6ba5a4b0": "Start break",
  "ka3e3b883": "Start",
  "k27ca568b": "Resume",
  "k8d63ef38": "Pause",
  "k8bc1bbcd": "🔄 Time conversion",
  "k00f92bc3": "🔄 Time conversion (no text selected)",
  "k517a676e": "→ {0}",
  "k1b4139be": "Enter a valid number of days",
  "kfbca8e96": "\"Convert selection\" and \"Calendar parsing\"",
  "k0e6cd89e": "\"Convert selection\" only",
  "k03f8fee9": "No rule is in effect.",
  "kfe918842": "{0} rule(s) recognized, applied to {1}.",
  "k45915354": "Nothing convertible in this note (or the enabled items do not apply to this text).",
  "k4628fd37": "⚠️ Base not recognized; it will be calculated as \"now\". Enter 2026-09-22 or 2026-09-22 14:30",
  "k68cc7527": "In the Capture choice's Format, use {{VALUE}} or one of the named variables above.",
  "k7bed1f32": "Note: Template-type choices treat {{VALUE}} as the new note's file name — use a named variable in that case.",
  "k8a98fa99": "Close calendar view",
  "ke9886e97": "Open calendar view",
  "k082e7ac4": "The view is open. Click to close it.",
  "kd5a911e8": "Click to open the calendar view, or search for 日历 in the command palette.",
  "kb15d9127": "Close",
  "kd7098f50": "Open",
  "k25ea5b75": "Templater: ready. It will be used to generate notes.",
  "k3e466b79": "Templater: {0} (download: {1})",
  "k614fc656": "Example: ",
  "kc13cb9a1": "DataView: ready.",
  "kc2413656": "DataView plugin not detected. Fields are still written, but you need to install it to query them.",
  "k0504a662": "Enter a folder path in your vault, e.g. sounds/alert. {0} audio file(s) found",
  "kaa938aa5": ", played in order.",
  "k4e9d6e3a": ", please check that the path is correct.",
  "k2545a4fc": "QuickAdd plugin detected. You can enter the choice name directly.",
  "ka65d0706": "QuickAdd plugin not detected. Install and enable it first, otherwise it falls back to built-in writing.",
  "k43d586cd": "Please confirm",
  "k625fb26b": "Cancel",
  "k38cf16f2": "OK",
  "k942aa988": "Off (default)",
  "k0e03b3a4": "This device",
  "k640e8fc2": "Parse notes (pomodoro log)",
  "kfae3782a": "Custom location (a note or folder)",
  "ke7b5aad7": "Reset to zero",
  "ka0e20f38": "Keep accumulating",
  "k2d984763": "Ask after another full interval",
  "k72079e1a": "Ask again right after next cycle",
  "k71c0319f": "Floating",
  "k9635b9bd": "Sidebar",
  "k2b02bedb": "Separate window",
  "kaf767b7e": "Top",
  "k3850a186": "Bottom",
  "kd2aff141": "Left",
  "k4d9c32c2": "Right",
  "kd339025f": "Built-in tone",
  "k79abf822": "Custom folder",
  "kec647d2e": "Built-in write",
  "k34f0a08a": "With QuickAdd",
  "kabe85d5b": "Clipboard only",
  "kaacc0e5f": "(no conversion item enabled)",
  "kd491d2eb": "(manual, not in list)",
  "k439d0eab": "🍅 Pomodoro",
  "k9807dac6": "Round {0}",
  "k92636e8c": "Skip",
  "k1271c7e1": "Skip focus",
  "k6542bb90": "Skip break",
  "k5f9b47b7": "{0} rounds completed",

  "k34d7423c": "{0} h",
  "k4444fa5f": "{0} min",
  "k12099bc3": "⏱ Count-up reached the limit ({0}) and stopped. This stretch is not counted — click “Start” to time again.",
  "k755ee078": "⏱ {0} min focused (count-up is still running — click “Skip” to end)",
  "k7d6d5c68": "🍅 Session finished",
  "k451ed15e": "{0} rounds completed · {1} long breaks",
  "k02a2cc48": "Focus {0} min · Break {1} min",
  "k41c81e58": "Paused {0} times",
  "k415fad66": "Focus × {0}",
  "k3e1033e7": "Break × {0}",
  "k767a365e": "Skipped (not counted): {0}",
  "k620bf820": "Record",
  "k375ec885": "OK",

  "kcc58debe": "Soft target (minutes)",
  "k4091e8a7": "Reminds once (with a sound) when this many minutes have elapsed, but does **not** stop the timer. Blank or 0 = off.",
  "k1feb0b9c": "Interval reminder (minutes)",
  "k8c4e774c": "Reminds every this many minutes (20 → at 20, 40, 60…). Blank or 0 = off.",
  "k17730e76": "{0}: focus unlimited (count-up) · break {1} min",
  "kfbe4f0cf": "{0}: focus {1} min · break {2} min",
  "ka7f46ee3": "Switched to count-up: focus runs unlimited from 0 upward; click “Skip” to end this segment.",
  "k24f4fe80": "Switched to count-down: focus counts down from the profile length and ends automatically.",
  "ked3fbdb5": "{0} min focused so far. Take a long break ({1} min)?",
  "k95cc0ea1": "Paused {0} times, {1} has {2} left. Restart this round from the beginning?",
  "kd4040472": "this segment",
  "kcb1d77a3": "Count-up on: focus runs unlimited from 0 upward; click “Skip” to end.",
  "k59469d2e": "Count-up off: focus counts down again.",
  "ke1485b10": "The current segment is unchanged; it takes effect next segment.",
  "k03ba5c79": "Fixes the blank settings page of the Calendar plugin (liamcain/obsidian-calendar-plugin): it reads window._bundledLocaleWeekSpec, which is only initialised after the calendar view has been opened once; before that, reading .dow throws and the whole Weekly Note Settings section disappears.",
  "k98723583": "Click to create/open the yearly note",
  "kea7cf0cd": "Resets the settings in this section ({0}) to defaults; other sections are unaffected.",
  "kcf156760": "“{0}” failed to load: {1}. Other settings are unaffected; see the developer console for the full stack.",
  "k974e7484": "unknown error",
  "k74e4b58e": "{0}/{1} on",
  "ka410bd01": "What you can and cannot change in a separate window: ① Can change — colours, font size, radius, shadow, background image, button position and order; these share one set of variables with the floating window, so changing once applies to both. ② Conditional — size, position and always-on-top rely on Electron window APIs; when Obsidian tightens them they degrade to “system decides” without erroring. ③ Cannot change — the system title bar and window frame (frame is fixed when the window is created). ④ Note — all of the above is applied once when the window opens. You don’t need to reopen it after changing settings: press Ctrl+P **inside** the separate window and run “Pomodoro: Re-apply separate window settings” (it must be run in that window — each window uses the settings it read when it loaded).",
  "k04fec57d": "You don’t need to write the whole set — variables you don’t override fall back to the classic theme defaults. Useful selectors: .pomo-float (floating window), .pomo-container (sidebar view), .pomo-btn[data-act=\"main|skip|stop\"] (buttons; use order to reorder), [data-state=\"focus|short|long|paused\"] (exact state), [data-pomo-kind=\"focus|rest|idle\"] (segment kind; paused keeps the kind of the segment before it). Use a vault-relative path for background images, e.g. url(\"attachments/tomato.png\") — an absolute system path breaks on another device. Count-up adds an hour digit past one hour (H:MM:SS), three characters longer than MM:SS — if the floating window can’t fit it, lower --pomo-time-size or raise --pomo-width.",

  "kf40f709b": "Click to create or open the weekly note",
  "kf164c4ad": "Open pomodoro settings",
  "ka7d84685": "Minimize",
  "kda43918a": "Hide (the timer keeps running; click the status bar to bring it back)",
  "kfd9ff5e6": " (forward)",
  "kf0e8f0f6": " (reverse)",
  "pomo.min.focusMin.name": "Focus duration",
  "pomo.min.focusMin.desc": "Focus length for the current profile.",
  "pomo.min.shortBreakMin.name": "Short break",
  "pomo.min.shortBreakMin.desc": "Break after each round in the current profile.",
  "pomo.min.longBreakMin.name": "Long break",
  "pomo.min.longBreakMin.desc": "Long break after every few rounds in the current profile.",
  "qa.nestedExtra": " (including {0} nested sub-choices)",
  "fest.help.head": "One per line, in the form: name = date\nSupported date forms:",
  "fest.help.count": "{0} recognised.",
  "fest.help.list": "Recognised: ",
};

module.exports = EN;

  };

  __modules['src/i18n.js'] = function (module, exports, require) {
const obsidian = require('obsidian');

/** 可选语言。简体中文是兜底，English 查表，繁体按字表转换。 */
const LANGS = [
  { code: 'zh', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
];

/** 当前语言，默认 zh（= 底色中文，符合要求：删掉功能后是中文） */
let current = 'auto';
/** auto 模式下检测结果的缓存；切语言时清空，否则改了不生效 */
let autoCache = '';

/** 英文表：key → 英文。key 由中文原文取哈希生成，行号变了也不会错位。 */
/*
 * 英文表：key → 英文。查不到一律回落调用处的中文原文，绝不空白。
 *
 * 刻意不译（不要补，补了会出事）：
 *   ka6762c3b / k72acd8fa / k1f05dd7e —— 这三处是「语法示例」
 *   （DataView 字段写法、自设节日写法、自定义规则写法），
 *   解析规则只认中文写法，翻成英文用户照抄反而解析失败。
 *   守门：_test/i18nguard.js 第 3 组把三者列为白名单。
 */
/**
 * 日历网格里的月份名 / 星期名。
 *
 * 为什么自己维护两张小表而不是走 moment locale：
 *   Calendar 的 Override locale 会调用 moment.defineLocale —— 那是**全局**的，
 *   会把别的插件的界面语言一起改掉（启动卡 §3 红线）。这里只改自己显示的字符。
 *
 * 中文是底色（保持原样），英文单独给。繁体不建第三份表 —— 走 toTW 字表转换即可。
 */
const MONTH_NAMES = {
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  en: ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'],
};

/**
 * 星期名。中文沿用现有单字简写（曾改成「周日/周一」全称，用户更喜欢原先的，已回退）。
 * 英文用 Sun/Mon 简写：中文是单字，简写宽度接近，中文版式不用动（§0.2 样式原则）。
 */
const WEEKDAY_NAMES = {
  zh: ['日', '一', '二', '三', '四', '五', '六'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/*
 * 番茄钟状态名。照 MONTH_NAMES 的做法查表，而不是给 6 个状态各写一条 i18nT：
 *   状态名只有 6 个 × 2 语言 = 12 条，查表比堆 12 条翻译清爽，也不会漏。
 *   注意：只用于界面；写进笔记的内容一律不翻译。
 */
const STATE_NAMES = {
  zh: { idle: '待开始', focus: '专注', short: '短休息', long: '长休息', paused: '已暂停', waiting: '待开始' },
  en: { idle: 'Idle', focus: 'Focus', short: 'Short break', long: 'Long break', paused: 'Paused', waiting: 'Idle' },
};

/** 取日历显示语言：auto = 跟随已解析出的显示语言，不重新检测系统 */
function calLang(calSetting) {
  const v = calSetting === 'zh' || calSetting === 'en' ? calSetting : resolve();
  return v === 'zh-TW' ? 'zh' : v;
}

const EN = require('./i18n-en.js');

/*
 * 简→繁字表。两串等长、逐字对应，用两个字符串而不是对象字面量，体积更小。
 * 只收设置界面会用到的字，不做全字集——全字集几千字，为几句话不值得。
 */
const TW_FROM =
  '时间设置开关启关闭转换识别格式显示记录统计自定节日农历阳历节气干支' +
  '生肖标记前后提示预览插入换行命令触发词启用扩展功能点击按钮输入文本' +
  '模板文件笔记日记周月日年秒分钟小时倒计时正计时休息专注暂停跳过重置' +
  '轮次累计目标提醒间隔上限位置窗口悬浮侧边栏主题声音通知权限链接路径' +
  '数据备份导入导出迁移高级选项区块账号语言界面页面类型数量大小高度宽' +
  '度边距圆点颜色高亮今天打开新建重命名删除恢复默认应用立即保存取消确' +
  '定返回上一步下一步完成开始结束继续状态可用未检测插件安装依赖冲突错' +
  '误失败成功警告信息说明帮助关于版本作者仓库地址反馈问题建议其它全部' +
  '部分仅只不无需可以需要请务必注意小心谨慎推荐优先手动自动每天每周每' +
  '次个条行列段落字符空格符号标点数字单位毫秒时区本地全局临时永久当前';
const TW_TO =
  '時間設置開關啟關閉轉換識別格式顯示記錄統計自訂節日農曆陽曆節氣干支' +
  '生肖標記前後提示預覽插入換行命令觸發詞啟用擴展功能點擊按鈕輸入文本' +
  '模板文件筆記日記週月日年秒分鐘小時倒計時正計時休息專注暫停跳過重置' +
  '輪次累計目標提醒間隔上限位置窗口懸浮側邊欄主題聲音通知權限鏈接路徑' +
  '數據備份導入導出遷移高級選項區塊帳號語言界面頁面類型數量大小高度寬' +
  '度邊距圓點顏色高亮今天打開新建重命名刪除恢復默認應用立即保存取消確' +
  '定返回上一步下一步完成開始結束繼續狀態可用未檢測插件安裝依賴衝突錯' +
  '誤失敗成功警告信息說明幫助關於版本作者倉庫地址反饋問題建議其它全部' +
  '部分僅只不無需可以需要請務必注意小心謹慎推薦優先手動自動每天每周每' +
  '次個條行列段落字符空格符號標點數字單位毫秒時區本地全局臨時永久當前';

/** 词汇级差异：字表转换解决不了的词（软件→軟體），单独覆盖 */
const TW_WORDS = [
  ['设置', '設定'],
  ['时区', '時區'],
  ['信息', '資訊'],
  ['数据', '資料'],
  ['文件', '檔案'],
  ['默认', '預設'],
  ['小时', '小時'],
  ['分钟', '分鐘'],
  ['秒钟', '秒鐘'],
  ['界面', '介面'],
  ['插件', '外掛'],
  ['链接', '連結'],
  ['路径', '路徑'],
  ['悬停', '懸停'],
  ['窗口', '視窗'],
  ['文本', '文字'],
  ['字符', '字元'],
  ['数字', '數字'],
  ['宽度', '寬度'],
  ['高亮', '醒目提示'],
];

const TW_MAP = (() => {
  const m = new Map();
  for (let i = 0; i < TW_FROM.length; i++) m.set(TW_FROM[i], TW_TO[i]);
  return m;
})();

function toTW(text) {
  let s = String(text == null ? '' : text);
  TW_WORDS.forEach(([a, b]) => {
    s = s.split(a).join(b);
  });
  let out = '';
  for (const ch of s) out += TW_MAP.get(ch) || ch;
  return out;
}

/*
 * 归一化语言值。
 * 'auto' 是默认值；未指定或不可识别的值也走 auto（跟随系统），
 * 而不是硬回中文 —— 否则新装的用户是「跟随系统」、升级上来的用户却被钉在中文。
 */
function normalize(code) {
  if (code === 'auto') return 'auto';
  if (LANGS.some((l) => l.code === code)) return code;
  if (EXTRA_LANGS[code]) return code; // 外部注册的语言也要放行，否则下拉能选却不生效
  return 'auto';
}

/**
 * 把拿到的语言字符串映射成受支持的语言码；不支持的一律回落到英文。
 * @param {string} raw 形如 zh-cn / en-GB / zh-TW
 */
function matchLang(raw) {
  const s = String(raw || '').toLowerCase();
  if (s.indexOf('zh') === 0) return /tw|hk|hant|mo/.test(s) ? 'zh-TW' : 'zh';
  return 'en';
}

/**
 * 检测系统 / Obsidian 界面语言。
 *
 * 顺序按可靠性排：
 *   1. localStorage 的 language —— 用户在 Obsidian 设置里选的界面语言，最准
 *   2. moment.locale()        —— 官方推荐源，部分版本与上者不同步
 *   3. navigator.language     —— 浏览器语言，可能与 Obsidian 界面语言无关
 * 全程 try/catch：一处读不到就换下一处，全读不到用英文，绝不因此让插件起不来。
 */
function detectSystemLang() {
  const read = (fn) => {
    try {
      const v = fn();
      return typeof v === 'string' && v ? v : '';
    } catch (e) {
      return '';
    }
  };
  const raw =
    read(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem('language'))) ||
    read(() => (typeof obsidian.moment === 'function' ? obsidian.moment().locale() : '')) ||
    read(() => (typeof navigator === 'undefined' ? '' : navigator.language)) ||
    '';
  /*
   * 一处都读不到时返回空串，由 resolve() 回落到中文底色。
   * 与「读到了但不支持」区分开：后者按用户要求回英文，
   * 前者根本无从判断（无界面环境、测试环境），硬给英文反而更糟。
   */
  return raw ? matchLang(raw) : '';
}

/** 解析出真正生效的语言：只有 auto 才需要检测，且只检测一次。 */
function resolve() {
  if (current !== 'auto') return current;
  if (!autoCache) autoCache = detectSystemLang() || 'zh';
  return autoCache;
}

function setLang(code) {
  current = normalize(code);
}

function getLang() {
  return current;
}

/**
 * 取界面文案。
 * @param {string} key 由中文原文生成，同一句话永远是同一个 key
 * @param {string} zh  中文原文，同时充当兜底值
 * @param {...*}   args 替换英文串里的 {0} {1}……（中文原文本身已插值，用不到）
 *
 * 为什么英文串用 {0} 而不是也写 ${}：
 *   英文串是静态数据，插值变量在调用处，两边拼不到一起；
 *   编号占位是通行做法，且中文模式根本不进替换分支，零开销。
 */
function t(key, zh) {
  const fallback = zh == null ? '' : String(zh);
  const lang = resolve();
  let out;
  if (lang === 'en') {
    const v = EN[key];
    out = typeof v === 'string' && v ? v : fallback;
  } else if (lang === 'zh-TW') {
    out = toTW(fallback);
  } else if (EXTRA_LANGS[lang]) {
    // 放在内置分支之后：内置先命中，未注册外部语言时不给热路径添开销
    const v = EXTRA_LANGS[lang].table[key];
    out = typeof v === 'string' && v ? v : fallback;
  } else {
    out = fallback;
  }
  if (arguments.length > 2) {
    for (let n = 2; n < arguments.length; n++) {
      out = out.split('{' + (n - 2) + '}').join(String(arguments[n]));
    }
  }
  return out;
}

/** 外部注册的语言表：code → { label, table }。内置之外的语言都走这里 */
const EXTRA_LANGS = {};

/**
 * 注册一门语言 —— 给「想自己加语言」的人留的接口。
 *
 *   registerLang('ja', '日本語', { 'k……': '……', … })
 *
 * 注册后：下拉里多一项；t() 先查该表，查不到仍回落中文原文（兜底规则不变）。
 * key 怎么来：复制调用处 i18nT('kxxx', '中文') 里的 kxxx，值是对应的外文。
 * 内置语言（zh / zh-TW / en）不走这里 —— 改内置请直接改 LANGS 与 EN 表。
 *
 * @returns {boolean} 注册是否成功（code 为空、与内置冲突、table 不是对象 → false）
 */
function registerLang(code, label, table) {
  if (!code || typeof code !== 'string') return false;
  if (LANGS.some((l) => l.code === code)) return false; // 不许覆盖内置
  if (!table || typeof table !== 'object') return false;
  EXTRA_LANGS[code] = { label: String(label || code), table: table };
  return true;
}

/** 下拉要列出的全部语言：内置 + 外部注册 */
function allLangs() {
  return LANGS.concat(
    Object.keys(EXTRA_LANGS).map((c) => ({ code: c, label: EXTRA_LANGS[c].label }))
  );
}

/**
 * 语言设置区（渲染进主设置页的「界面语言」标签）。
 *
 * 为什么从独立设置页改成主设置页里的一个标签：
 *   两个入口在设置列表里显示为两行 Time Tools，会被当成两套设置。
 *   内嵌只需主设置页 renderInto 多一个分支，删掉也只删那一处。
 */
/*
 * 切语言后刷新插件自己的界面。
 * 只调 plugin 上已有的方法，绝不反向 require 番茄钟/日历模块 ——
 * 这是「i18n 零依赖、删掉语言功能不牵连其他模块」的前提。
 */
function refreshPluginViews(plugin) {
  if (!plugin) return;
  ['refreshPomodoroViews', 'refreshCalendarViews', 'refreshTimestampViews'].forEach((n) => {
    try {
      if (typeof plugin[n] === 'function') plugin[n]();
    } catch (e) {
      console.error('[Time Tools] 刷新视图失败：' + n, e);
    }
  });
}

function renderLangTab(box, plugin) {
  /*
   * box 必须是**只给本块用的子容器**（由主设置页 createDiv 出来再传进来）。
   * 这里第一件事就是 box.empty()，所以绝不能把主设置页的 containerEl 直接
   * 传进来 —— 那会把顶部标签栏一起清掉，用户进了这一页就切不回别的标签了。
   */
  box.empty();
  box.addClass('tt-settings');

  box.createEl('h2', { text: t('lang.title', '界面语言') });

  new obsidian.Setting(box)
    .setName(t('lang.name', '显示语言'))
    .setDesc(
      t('lang.desc', '只影响设置界面上显示的字，不影响笔记内容、功能与数据。切换后立即重绘。')
    )
    .addDropdown((d) => {
      // auto 是默认值：跟随 Obsidian 界面语言，没有对应语言时用英文
      d.addOption('auto', t('lang.auto', '跟随系统（检测不到时用英文）'));
      allLangs().forEach((l) => d.addOption(l.code, l.label));
      d.setValue(getLang());
      d.onChange(async (v) => {
        setLang(v);
        autoCache = '';
        try {
          plugin.settings.uiLang = normalize(v);
          await plugin.saveSettings();
        } catch (e) {
          console.error('[Time Tools] 保存界面语言失败', e);
        }
        // 整页重绘，让所有标签一起换语言
        try {
          if (plugin.settingTab && plugin.settingTab.display) plugin.settingTab.display();
        } catch (e) {
          console.error('[Time Tools] 重绘主设置页失败', e);
        }
        /*
         * 光重绘设置页不够：正在跑的浮窗/日历自己不会换语言 ——
         * FloatUI 有脏检查，不主动触发就停在旧语言上，要等下次状态变化才更新。
         */
        refreshPluginViews(plugin);
      });
    });

  /*
   * 日历语言：只管日历网格里的月份名与星期名，与上面的显示语言相互独立。
   * 有人界面用英文、日历想看中文月份，也有人反过来。
   */
  new obsidian.Setting(box)
    .setName(t('lang.cal.name', '日历语言'))
    .setDesc(
      t(
        'lang.cal.desc',
        '只影响日历网格里的月份名与星期名；不影响日期格式、周起始日、笔记内容与命名。'
      )
    )
    .addDropdown((d) => {
      d.addOption('auto', t('lang.cal.auto', '跟随显示语言'));
      d.addOption('zh', '简体中文');
      d.addOption('en', 'English');
      const cur = ((plugin.settings && plugin.settings.calendar) || {}).lang;
      d.setValue(['auto', 'zh', 'en'].indexOf(cur) >= 0 ? cur : 'auto');
      d.onChange(async (v) => {
        try {
          plugin.settings.calendar.lang = v;
          await plugin.saveSettings();
          /*
           * 只刷日历视图，不重绘设置页（重绘会让下拉失焦）。
           * 用 plugin 上已有的方法：i18n.js 必须保持零依赖，
           * 不能反过来依赖日历模块（删掉语言功能时不应牵连任何模块）。
           * 方法不存在时也不报错 —— 设置已存下，下次打开日历自然生效。
           */
          try {
            if (typeof plugin.refreshCalendarViews === 'function') {
              plugin.refreshCalendarViews();
            }
          } catch (e) {
            console.error('[Time Tools] 刷新日历视图失败', e);
          }
        } catch (e) {
          console.error('[Time Tools] 保存日历语言失败', e);
        }
      });
    });

  box.createDiv({
    cls: 'setting-item-description',
    text: t(
      'lang.note',
      '说明：简体中文为底色文案，任何未翻译的条目都显示中文；' +
        '繁體由字表转换生成，个别词可能不地道，可切回简体。'
    ),
  });
}


/*
 * 转换项名称与说明的英文表（按 key）。
 * 这些文案在数据表里、以变量形式传给 setName —— 守卫扫不到那种形式，
 * 只能查表给。中文态直接回落中文原文，零开销。
 */
const ACTION_EN = {
  unify: { n: "Unify format", d: "Replace any recognised time with one consistent format (change it in settings; defaults to the same as the timestamp format)" },
  relative: { n: "Relative time", d: "Turn dates into relative descriptions like \"3 days ago\" or \"in 2 hours\"" },
  weekday: { n: "Add weekday", d: "Append the weekday after the date, e.g. 2026-09-19 Sat" },
  dailyLink: { n: "Daily note link", d: "Turn into [[2026-09-19]] so it links to that day's note" },
  unixEncode: { n: "Date to timestamp", d: "Turn a date into a 10-digit Unix timestamp" },
  dateShift: { n: "Shift date", d: "Add or subtract days: enter +7 or -3" },
  fillDate: { n: "Complete date", d: "Fill in this year / today when only month-day or time is written, e.g. 09-17 becomes 2026-09-17" },
  timePart: { n: "Time only", d: "Keep only the time part, e.g. 2026-09-19 14:30:25 becomes 14:30:25" },
  lunar: { n: "To lunar date", d: "Solar date to lunar date, e.g. \"lunar 2026-08-19\"" },
  lunarGanzhi: { n: "Lunar + ganzhi", d: "Lunar date with the sexagenary year and zodiac, e.g. \"Bingwu year, Horse\"" },
  solarTerm: { n: "Solar term", d: "Which of the 24 solar terms this day is; hidden when it is not one" },
  unixDecode: { n: "Timestamp to date", d: "Turn 1768800000 into a readable date" },
  lunarToSolar: { n: "Lunar to solar", d: "Convert a lunar date like \"08-19\" back to solar; a year may be included" },
  relativeToDate: { n: "Relative to date", d: "Resolve descriptions like \"3 days ago\" back to a concrete date" },
  linkToDate: { n: "Link to date", d: "Strip [[]] into a plain date, e.g. [[2026-09-19]] becomes 2026-09-19" },
  stripWeekday: { n: "Remove weekday", d: "Turn \"2026-09-19 Sat\" back into \"2026-09-19\"" },
  termToDate: { n: "Solar term to date", d: "Look up the date of a solar term, e.g. \"Lichun\" becomes 2026-02-04; a year may be included" },
  ganzhiToYear: { n: "Ganzhi to year", d: "Convert a ganzhi pair like \"Bingwu\" to the nearest Gregorian year, e.g. Bingwu to 2026 (Horse)" },
  festival: { n: "Date to festival", d: "Find which festival this day is, e.g. 2026-10-01 is National Day; hidden when none" },
  festivalToDate: { n: "Festival to date", d: "Work out the date of a festival, e.g. Mid-Autumn is the solar date of lunar 08-15" },
  countdown: { n: "Countdown", d: "Days until a date; past dates show \"N days ago\", today shows \"that is today\"" },
  dateDiff: { n: "Date difference", d: "Select text containing two dates to get the number of days between them" },
};

/* 取转换项的显示名/说明：非英文态或查不到都回落中文原文 */
function actionText(key, field, zh) {
  if (resolve() !== 'en') return zh;
  const e = ACTION_EN[key];
  if (!e) return zh;
  return (field === 'desc' ? e.d : e.n) || zh;
}


/*
 * 时间口径三项的名称、说明与选项的英文表（按 key）。
 * 同 ACTION_EN：这些文案在数据里、以变量传给 setName，守卫扫不到。
 */
const JUDGE_EN = {
  weekendDay: {
    n: 'Which day counts as the weekend',
    d: 'In spoken Chinese the weekend can mean Saturday or Sunday; this sets the default.',
    o: { 6: 'Saturday', 7: 'Sunday' },
  },
  nextWeekdayMode: {
    n: 'How to read "next Monday"',
    d: 'When today is Sunday, does "next Monday" mean tomorrow, or the Monday of the following week?',
    o: { tomorrow: 'This week +7 days (tomorrow)', nextweek: 'Strictly the next calendar week' },
  },
  dayOnlyMode: {
    n: 'Which month to fill in for "the 17th"',
    d: 'When a day is written with no month, which month is used?',
    o: {
      current: 'Current month',
      upcoming: 'Current month, next month if past',
      off: 'Do not convert',
    },
  },
};
/* 取时间口径的显示文案：field 为 name / desc / opt:<值> */
function judgeText(key, field, zh) {
  if (resolve() !== 'en') return zh;
  const e = JUDGE_EN[key];
  if (!e) return zh;
  if (field === 'desc') return e.d || zh;
  if (field.indexOf('opt:') === 0) {
    const o = e.o || {};
    return o[field.slice(4)] || zh;
  }
  return e.n || zh;
}


/* 预设格式名的英文表（按格式串索引；格式串本身是数据，不翻译） */
const PRESET_EN = {
  'YYYY-MM-DD HH:mm:ss': 'Date + time (default)',
  'YYYY-MM-DD HH:mm': 'Date + hours:minutes',
  'HH:mm:ss': 'Time with seconds',
  'HH:mm': 'Hours:minutes',
  'YYYY年M月D日 HH:mm': 'Chinese date + hours:minutes',
  'YYYY/MM/DD HH:mm:ss': 'Slash date + time',
  'YYYY-MM-DD ddd HH:mm': 'With weekday',
  'YYYY-MM-DDTHH:mm:ssZ': 'ISO 8601',
};
function presetText(value, zh) {
  if (resolve() !== 'en') return zh;
  return PRESET_EN[value] || zh;
}

/*
 * 下拉选项的英文表。
 * 这类文案的数据在别处（settings.js / pomowin.js / calendar.js），
 * 以变量传进 addOption —— 守卫扫不到（实参不是字面量），故单独建表。
 * 表里的键必须是数据的 value，不能是中文标签（中文会随措辞改）。
 */
const OPTION_EN = {
  weekStart: {
    locale: 'Follow system region',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  },
  theme: {
    classic: 'Classic (default)',
    minimal: 'Minimal',
    dynamic: 'Flowing light (animated)',
    ethereal: 'Ethereal purple (water-light gradient)',
    scythe: 'Scythe (dark red blood-flow)',
    custom: 'Custom (write your own CSS)',
  },
  popoutPos: {
    'bottom-right': 'Bottom-right',
    'bottom-left': 'Bottom-left',
    'top-right': 'Top-right',
    'top-left': 'Top-left',
    center: 'Center of screen',
    system: 'Let the system decide',
  },
};

/*
 * 杂项标签的英文表：同样以变量传进来的一类。
 * fmtToken / recVar 两组用 token 原文当键（token 本身就是稳定标识）。
 */
const MISC_EN = {
  noteKind: { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' },
  tsSlash: { tsDefault: 'Default format', tsTime: 'Time only', tsDate: 'Date only' },
  fmtToken: {
    'YYYY': 'Four-digit year, e.g. 2026',
    'MM / M': 'Month, zero-padded / not padded',
    'DD / D': 'Day, zero-padded / not padded',
    'dddd / ddd': 'Weekday, e.g. Friday / Fri',
    'HH / H': 'Hour (24-hour)',
    'hh / h': 'Hour (12-hour)',
    'mm / m': 'Minute',
    'ss / s': 'Second',
    'A / a': 'AM/PM',
    'Z / ZZ': 'Timezone, e.g. +08:00',
  },
  recVar: {
    '{{VALUE}}': 'One-line summary (ready for Capture)',
    '{{VALUE:content}}': 'Full text generated from the built-in template',
    '{{VALUE:date}}': 'Date',
    '{{VALUE:time}}': 'End time',
    '{{VALUE:range}}': 'Start–end time range',
    '{{VALUE:cycles}}': 'Completed cycles',
    '{{VALUE:focus}}': 'Total focus minutes',
    '{{VALUE:rest}}': 'Total break minutes',
    '{{VALUE:focusText}}': 'Focus duration with unit; follows "Record to seconds"',
    '{{VALUE:restText}}': 'Break duration with unit; precision as above',
    '{{VALUE:pauses}}': 'Number of pauses',
    '{{VALUE:longBreaks}}': 'Number of long breaks',
    '{{VALUE:skippedFocus}}': 'Focus segments skipped and not counted',
    '{{VALUE:skippedBreak}}': 'Break segments skipped and not counted',
    '{{VALUE:profile}}': 'Duration profile used',
  },
};

function optText(group, value, zh) {
  if (resolve() !== 'en') return zh;
  const g = OPTION_EN[group];
  return (g && g[value]) || zh;
}

function miscText(group, key, zh) {
  if (resolve() !== 'en') return zh;
  const g = MISC_EN[group];
  return (g && g[key]) || zh;
}

/* 时段名的英文表（时段键同时是数据键，但显示给用户看时要翻译） */
const DAYPART_EN = {
  '凌晨': 'Early morning',
  '早上': 'Morning',
  '中午': 'Noon',
  '下午': 'Afternoon',
  '傍晚': 'Dusk',
  '晚上': 'Evening',
  '夜里': 'Late night',
  '深夜': 'Small hours',
};
function daypartText(key, zh) {
  if (resolve() !== 'en') return zh;
  return DAYPART_EN[key] || zh;
}

module.exports = {
  LANGS,
  t,
  normalizeLang: normalize,
  setLang,
  getLang,
  registerLang,
  allLangs,
  MONTH_NAMES,
  WEEKDAY_NAMES,
  STATE_NAMES,
  calLang,
  actionText,
  judgeText,
  presetText,
  optText,
  miscText,
  daypartText,
  toTW,
  detectSystemLang,
  matchLang,
  renderLangTab,
};

  };

  __modules['src/timejudge.js'] = function (module, exports, require) {
/* ===================================================================
 * 一、时段表：时段名 → 默认小时
 * ===================================================================
 * hour 是默认值，用户可在设置里改，改后存 settings.daypartHours。
 * pm 表示「这个时段里的钟点按 12 小时制理解」——
 * 「下午5点」= 17:00，而「5点」没有时段时按 24 小时制 = 05:00。
 *
 * alias 用于缩略写法（明晚 / 今早）：词根里只有一个字，
 * 完整词「晚上」去 indexOf 是找不到的，必须靠单字别名。
 * 注意：**不要**把有歧义的字收进 alias。曾把「半」收进「深夜」，
 * 结果「5点半」的「半」被当成深夜，算成 17:30。
 */
const TIME_OF_DAY = [
  { key: '凌晨', re: /^凌晨/, hour: 2, pm: false, alias: ['凌'] },
  { key: '早上', re: /^早上|^早晨|^上午/, hour: 9, pm: false, alias: ['早', '晨'] },
  { key: '中午', re: /^中午|^正午|^晌午/, hour: 12, pm: false, alias: ['午', '晌'] },
  { key: '下午', re: /^下午/, hour: 15, pm: true, alias: ['午'] },
  { key: '傍晚', re: /^傍晚|^黄昏/, hour: 18, pm: true, alias: ['昏'] },
  /*
   * 「晚上」与「夜里」分开。
   * 合在一起时「昨夜」落在 20:00，而多数人说「昨夜」想到的是更晚的时刻；
   * 分开后「夜里」默认 23:00，「夜里11点」的时刻解也落在这里，两者自洽。
   * 两个时段的小时值都能在「时间口径」里改。
   */
  { key: '晚上', re: /^晚上|^夜晚/, hour: 20, pm: true, alias: ['晚'] },
  { key: '夜里', re: /^夜里|^夜半/, hour: 23, pm: true, alias: ['夜'] },
  { key: '深夜', re: /^深夜|^半夜|^午夜/, hour: 23, pm: true, alias: ['深'] },
];

/** 时段键顺序（设置页渲染用） */
const DAYPART_KEYS = TIME_OF_DAY.map((t) => t.key);

/** 时段默认小时值（供设置页与迁移逻辑取默认值） */
function defaultDaypartHours() {
  const out = {};
  TIME_OF_DAY.forEach((t) => { out[t.key] = t.hour; });
  return out;
}

/**
 * 清洗用户改过的时段小时：只保留认识的键，且必须落在 0–23。
 * 否则废弃键会一直堆在 data.json 里。
 */
function cleanDaypartHours(saved) {
  const out = {};
  if (!saved || typeof saved !== 'object') return out;
  DAYPART_KEYS.forEach((k) => {
    const v = Number(saved[k]);
    // 用 Number 强转而非只收 number：旧配置里可能存成字符串 "12"，
    // 只判 typeof 会把这类合法值丢掉（迁移时静默退化成默认值）。
    if (isFinite(v) && v >= 0 && v <= 23) out[k] = Math.floor(v);
  });
  return out;
}

/* ===================================================================
 * 二、时间口径：没有共识的写法，给用户留选择
 * ===================================================================
 * 每项四件套：默认 / 选项 / 说明 / 清洗。
 * default 是插件替用户拍的板（选最符合多数人语感的那个），
 * options 让用户改成自己的习惯。
 */
const JUDGEMENTS = {
  /*
   * 「周末」到底指周六还是周日。
   * 默认 6（周六）：与旧行为一致，也与 Calendar 等插件的映射相同；
   * 想要周日的人在设置里改。
   */
  weekendDay: {
    label: '「周末」算周几',
    desc: '中文口语里「周末」可以指周六也可以指周日，这里定一个默认值。',
    default: 6,
    options: [{ v: 6, label: '周六' }, { v: 7, label: '周日' }],
    clean(v) { return v === 6 || v === 7 ? v : this.default; },
  },
  /*
   * 「下周一」指明天还是下一个日历周。
   * 默认 tomorrow（本周+7天）：口语里今天周日说「下周一」通常指明天；
   * nextweek 是严格按日历周理解（会落在 8 天后）。
   */
  nextWeekdayMode: {
    label: '「下周X」怎么算',
    desc: '今天就是周日时，「下周一」指明天还是再下一周的周一。',
    default: 'tomorrow',
    options: [
      { v: 'tomorrow', label: '本周 +7 天（明天）' },
      { v: 'nextweek', label: '严格下一个日历周' },
    ],
    clean(v) { return v === 'nextweek' ? v : 'tomorrow'; },
  },
  /*
   * 「17号」这类只有日、没有月的写法补哪个月。
   * 默认 current（补本月）：最符合直觉；
   * upcoming 是「本月已过则取下月」（适合记未来事项）；
   * off 是干脆不转换（避免误判）。
   */
  dayOnlyMode: {
    label: '「17号」补哪个月',
    desc: '只写日期没写月份时，按哪个月来补。',
    default: 'current',
    options: [
      { v: 'current', label: '补本月' },
      { v: 'upcoming', label: '补本月，已过则取下月' },
      { v: 'off', label: '不转换' },
    ],
    clean(v) { return ['current', 'upcoming', 'off'].indexOf(v) >= 0 ? v : 'current'; },
  },
};

/**
 * 清洗一个口径的值：非法就退回默认。
 * 迁移逻辑用它，保证脏配置不会写回 data.json。
 */
function cleanJudgement(key, value) {
  const def = JUDGEMENTS[key];
  if (!def) return undefined;
  return def.clean(value);
}

/** 全部口径的默认值（迁移与重置时一次性取用） */
function defaultJudgements() {
  const out = {};
  Object.keys(JUDGEMENTS).forEach((k) => { out[k] = JUDGEMENTS[k].default; });
  return out;
}

/**
 * 读一个口径的值。先看用户设置，没有或非法就用默认值。
 * @param {string} key 口径名
 * @param {object} settings 插件设置（可为 null）
 */
function readJudgement(key, settings) {
  const def = JUDGEMENTS[key];
  if (!def) return undefined;
  const ext = settings && settings.timestamp && settings.timestamp.extensions;
  const v = ext ? ext[key] : undefined;
  return v === undefined || v === null ? def.default : def.clean(v);
}

/* ===================================================================
 * 三、节日区
 * ===================================================================
 * 三类来源，查询时**按这个顺序**命中：
 *   1. 用户自设（customFestivals）—— 用户自己的日期优先，可覆盖内置
 *   2. 阳历固定（SOLAR_FESTIVALS）—— 日期年年不变
 *   3. 农历浮动（LUNAR_FESTIVALS）—— 只记农历月日，具体日期每年不同
 *      （春节/端午/中秋…不能写死阳历日期，闰月年会错，必须现算）
 *
 * 表是常量，不进 data.json（不随使用增长）；
 * 用户自设的那份是用户显式输入的有限条目，存在 data.json 里。
 */

const SOLAR_FESTIVALS = [
  { names: ['元旦', '新年'], month: 1, day: 1 },
  { names: ['情人节'], month: 2, day: 14 },
  { names: ['植树节'], month: 3, day: 12 },
  { names: ['劳动节', '五一'], month: 5, day: 1 },
  { names: ['青年节'], month: 5, day: 4 },
  { names: ['儿童节'], month: 6, day: 1 },
  { names: ['建党节', '七一'], month: 7, day: 1 },
  { names: ['建军节', '八一'], month: 8, day: 1 },
  { names: ['教师节'], month: 9, day: 10 },
  { names: ['国庆节', '国庆'], month: 10, day: 1 },
  { names: ['平安夜'], month: 12, day: 24 },
  { names: ['圣诞节'], month: 12, day: 25 },
];

/*
 * 农历浮动节日：只存农历月日，实际阳历日期由 lunar 模块现算。
 * day 为 null 表示「该月最后一天」（除夕），不能写死 30 ——
 * 腊月有时只有 29 天，写死会溢出成下月初一。
 */
const LUNAR_FESTIVALS = [
  { names: ['春节', '大年初一', '年初一', '正月初一'], month: 1, day: 1 },
  { names: ['元宵', '元宵节', '上元节'], month: 1, day: 15 },
  { names: ['端午', '端午节'], month: 5, day: 5 },
  { names: ['七夕', '乞巧节'], month: 7, day: 7 },
  { names: ['中元', '中元节', '鬼节'], month: 7, day: 15 },
  { names: ['中秋', '中秋节'], month: 8, day: 15 },
  { names: ['重阳', '重阳节'], month: 9, day: 9 },
  { names: ['腊八', '腊八节'], month: 12, day: 8 },
  { names: ['小年'], month: 12, day: 23 },
  { names: ['除夕', '年三十', '大年夜'], month: 12, day: null },
];

/* ------------------------------------------------------------------ *
 * 用户自设节日
 * ------------------------------------------------------------------ */

/** 格式说明的**叙述部分**（示例见 FEST_EXAMPLES，那边刻意不译） */
const FEST_HEAD = [
  '一行一条，格式：节日名 = 日期',
  '支持四种日期写法：',
].join('\n');

/*
 * 示例本体 —— **刻意不翻译**。
 *
 * 这些是解析器认的中文写法，翻成英文用户照抄会解析失败
 * （实测 "2nd Sunday of May" 返回空）。只译叙述句，示例原样保留。
 * 节日名本身是用户数据，同样不译。
 */
const FEST_EXAMPLES = [
  '  妈妈生日 = 10-15            阳历，每年重复',
  '  公司年会 = 2026-12-31       阳历，只那一年',
  '  观音诞 = 农历二月十九       农历，每年按农历算',
  '  母亲节 = 5月第2个周日       第 N 个星期几',
  '  感恩节 = 11月最后一个周四   当月最后一个星期几',
  '  某节 = 11月倒数第2个周四    当月倒数第 N 个星期几',
  "  Mother's Day = 5-10        节日名可含空格（英文也认）",
  '分隔符可用 = : ：, ，',
].join('\n');

/**
 * 「名称 = 日期」的分割：名称里不含分隔符，但**允许空格**。
 *
 * 名字曾排除 \s，导致英文名全军覆没 —— 英文节日几乎都带空格
 * （Mother's Day / New Year），一个都写不进去。
 * 用非贪婪 +? 是为了不吃掉后面的分隔符（否则「甲 = 3-1 = 5-1」会整体吞掉）。
 * 无分隔符的行（注释、乱写）仍然解析不出，与改动前一致。
 */
const CUSTOM_LINE_RE = /^([^=:：,，]+?)\s*[=:：,，]\s*(.+)$/;

/** 第 N 个星期几：5月第2个周日 / 6月第3个星期天 */
const NTH_WEEKDAY_RE = /^(\d{1,2})月第([一二三四五1-5])个(星期|礼拜|周)([日天一二三四五六1-7])$/;

/**
 * 当月最后一个 / 倒数第 N 个星期几：11月最后一个周四 / 11月倒数第2个周四。
 * 「最后一个」等价于「倒数第 1 个」，所以第 2 组为空时按 1 处理。
 * 不能并入 NTH_WEEKDAY_RE：那条要求「月」后紧跟「第」，这里前面还有「倒数」。
 */
const LAST_WEEKDAY_RE = /^(\d{1,2})月(?:最后一个|倒数第([一二三四五1-5])个)(星期|礼拜|周)([日天一二三四五六1-7])$/;

/** 中文数字 → 阿拉伯数字（只处理 1–5 与日期用到的字） */
const CN_NUM_MAP = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** 星期名 → 0–6（0=周日），与 Date.getDay() 对齐 */
const WEEKDAY_MAP = {
  日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6,
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
};

/**
 * 解析自设节日里的一行日期部分。
 * 返回条目对象或 null（无法识别就丢弃该行，不猜）。
 * @param {string} name 节日名
 * @param {string} spec 日期写法
 */
function parseFestivalSpec(name, spec) {
  const s = String(spec ?? '').replace(/\s+/g, '').trim();
  if (!s) return null;

  /*
   * ① 当月最后一个 / 倒数第 N 个星期几：11月最后一个周四。
   * 排在「第 N 个」之前：两者不冲突（后者要求「月」后紧跟「第」），
   * 但放一起读更容易看出是一族写法。
   */
  const last = LAST_WEEKDAY_RE.exec(s);
  if (last) {
    const wd = WEEKDAY_MAP[last[4]];
    if (wd === undefined) return null;
    return {
      name,
      kind: 'nth',
      month: parseInt(last[1], 10),
      nth: last[2] ? (CN_NUM_MAP[last[2]] || parseInt(last[2], 10)) : 1,
      weekday: wd,
      fromLast: true,   // 从月末往回数；缺省（第 N 个）为 false
    };
  }

  /* ① 第 N 个星期几：5月第2个周日 */
  const nth = NTH_WEEKDAY_RE.exec(s);
  if (nth) {
    const wd = WEEKDAY_MAP[nth[4]];
    if (wd === undefined) return null;
    return {
      name,
      kind: 'nth',
      month: parseInt(nth[1], 10),
      nth: CN_NUM_MAP[nth[2]] || parseInt(nth[2], 10),
      weekday: wd,
    };
  }

  /* ② 农历：农历八月十五 / 八月十五 / 闰二月初五 */
  const isLunar = /^农历/.test(s) || /[一二三四五六七八九十]月/.test(s);
  if (isLunar) {
    const body = s.replace(/^农历/, '');
    const m = /^(闰?)(\d{1,2}|[一二三四五六七八九十]+)月(初一|十五|[一二三四五六七八九十]+|\d{1,2})$/.exec(
      body
    );
    /*
     * 农历写法必须带「月」字：「农历10-15」这类没有「月」的一律丢弃，
     * 多半是想写阳历却误加了前缀。月份用中文或阿拉伯数字都认。
     */
    if (!m) return null;
    const mon = /^\d+$/.test(m[2]) ? parseInt(m[2], 10) : cnNumber(m[2]);
    const day = m[3] === '初一' ? 1 : m[3] === '十五' ? 15 : /^\d+$/.test(m[3])
      ? parseInt(m[3], 10)
      : cnNumber(m[3]);
    if (!mon || !day || mon < 1 || mon > 12 || day < 1 || day > 30) return null;
    return { name, kind: 'lunar', month: mon, day, isLeap: m[1] === '闰' };
  }

  /* ③ 阳历带年：2026年12月31日 / 2026-12-31 */
  const withYear = /^(\d{4})\s*[年\-\/.]?\s*(\d{1,2})\s*[月\-\/.]\s*(\d{1,2})\s*日?$/.exec(s);
  if (withYear) {
    const y = parseInt(withYear[1], 10);
    const mo = parseInt(withYear[2], 10);
    const d = parseInt(withYear[3], 10);
    if (!validYmd(y, mo, d)) return null;
    return { name, kind: 'solar', year: y, month: mo, day: d };
  }

  /* ④ 阳历月日（每年重复）：10-15 / 10/15 / 10月15日 */
  const md = /^(\d{1,2})\s*[月\-\/.]\s*(\d{1,2})\s*日?$/.exec(s);
  if (md) {
    const mo = parseInt(md[1], 10);
    const d = parseInt(md[2], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    // 回校该月真实天数：2 月 30 号这类非法日期直接丢弃
    if (!validYmd(2000, mo, d) && !validYmd(2001, mo, d)) return null;
    return { name, kind: 'solar', month: mo, day: d };
  }

  return null;
}

/** 中文数字（一到三十）→ 阿拉伯数字 */
function cnNumber(s) {
  if (CN_NUM_MAP[s] !== undefined) return CN_NUM_MAP[s];
  const m = /^([二三四])?十([一二三四五六七八九])?$/.exec(String(s || ''));
  if (!m) return 0;
  const tens = m[1] ? CN_NUM_MAP[m[1]] * 10 : 10;
  return tens + (m[2] ? CN_NUM_MAP[m[2]] : 0);
}

/** 年月日是否合法（含闰年与月末回校） */
function validYmd(y, m, d) {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(y, m, 0).getDate();
}

/**
 * 解析用户自设的整段文本 → 条目数组。
 * 空行、# 注释行、无法识别的行一律跳过，不报错也不中断。
 * 同名后写覆盖先写（让用户可以靠顺序改掉某条）。
 */
function parseCustomFestivals(text) {
  const out = [];
  const index = {};
  String(text ?? '')
    .split(/\r?\n/)
    .forEach((line) => {
      const s = String(line || '').trim();
      if (!s || /^#/.test(s)) return;
      const m = CUSTOM_LINE_RE.exec(s);
      if (!m) return;
      const item = parseFestivalSpec(m[1].trim(), m[2]);
      if (!item) return;
      if (index[item.name] !== undefined) out[index[item.name]] = item;
      else {
        index[item.name] = out.length;
        out.push(item);
      }
    });
  return out;
}

/**
 * 查一个节日名属于哪一类。
 * @param {string} text 待查名称（已 trim）
 * @param {Array} custom 自设条目（parseCustomFestivals 的结果）
 * @returns {object|null} { name, kind, ... } 或 null
 */
function findFestival(text, custom) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  // 自设优先：用户可以覆盖内置节日的日期
  if (Array.isArray(custom)) {
    for (const it of custom) {
      if (it && it.name === s) return it;
    }
  }

  // 精确匹配、先到先得（阳历表在前）。两张内置表无重名，故不存在「取更长名」的情形。
  let best = null;
  const hit = (names, extra) => {
    names.forEach((n) => {
      if (s === n && !best) best = Object.assign({ name: n }, extra);
    });
  };
  SOLAR_FESTIVALS.forEach((f) => hit(f.names, { kind: 'solar', month: f.month, day: f.day }));
  LUNAR_FESTIVALS.forEach((f) =>
    hit(f.names, { kind: 'lunar', month: f.month, day: f.day })
  );
  return best;
}

/* ===================================================================
 * 四、周号计算：全插件唯一一份，日历与笔记都从这里取
 * ===================================================================
 * 算法与 moment 的 week() 同款（dow/doy 规则）。
 * 收敛到这里的原因：曾两处各存一份，跨年差 1 周。任何调用点都拿同一份结果。
 */

/**
 * 周起始日 → moment 的 dow（0=周日 … 6=周六）。
 * 唯一真源：calendar 的下拉选项、settings 的值域清洗、note 的周号计算全由它派生。
 * 别在各模块另写字面量 —— 曾三处各写一份，漏改一处就出现「下拉有但校验不认」。
 */
const WEEK_START_DOW = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

/** 周起始枚举的合法取值（含「跟随系统区域」），settings.js 用它做值域清洗 */
const VALID_WEEK_START = ['locale'].concat(Object.keys(WEEK_START_DOW));

/** doy 规则与 moment 一致：周一走 ISO(4)，其余 = 6 + dow */
function weekDoyOf(dow) {
  return dow === 1 ? 4 : 6 + dow;
}

function dayOfYearOf(d) {
  return Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 0)) / 86400000
  );
}

/** 与 moment 的 firstWeekOffset 同算法：本年元旦前后要补几天才对齐周界 */
function firstWeekOffset(year, dow, doy) {
  const fwd = 7 + dow - doy;
  const fwdlw = (7 + new Date(year, 0, fwd).getDay() - dow) % 7;
  return -fwdlw + fwd - 1;
}

function weeksInYear(year, dow, doy) {
  const days = Math.round((new Date(year + 1, 0, 1) - new Date(year, 0, 1)) / 86400000);
  return (days - firstWeekOffset(year, dow, doy) + firstWeekOffset(year + 1, dow, doy)) / 7;
}

/**
 * 按 dow/doy 算年内周数（moment 的 week() 同算法）。
 * 跨年时落到上一年末或下一年初的周，返回对应年的周号（ISO 行为）。
 */
function weekNumberOf(d, dow) {
  const doy = weekDoyOf(dow);
  const y = d.getFullYear();
  const off = firstWeekOffset(y, dow, doy);
  let w = Math.floor((dayOfYearOf(d) - off - 1) / 7) + 1;
  if (w < 1) return w + weeksInYear(y - 1, dow, doy);
  const total = weeksInYear(y, dow, doy);
  if (w > total) return w - total;
  return w;
}

/** 同一天（只看年月日，忽略时分秒） */
function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/* ===================================================================
 * 五、有意不识别的模糊词
 * ===================================================================
 * 语义不可信，宁可不识别。列在这里是为了**防止以后误加**——
 * 改解析层时先查这张表，别把「改天」之类的词顺手收进去。
 */
const FUZZY_WORDS = [
  '改天', '回头', '有空', '最近', '近期', '过一阵', '马上', '立刻', '稍后',
  '大半天', '工作日', '法定假日', '早上好', '晚上好',
];

module.exports = {
  TIME_OF_DAY,
  DAYPART_KEYS,
  defaultDaypartHours,
  cleanDaypartHours,
  JUDGEMENTS,
  defaultJudgements,
  readJudgement,
  cleanJudgement,
  SOLAR_FESTIVALS,
  LUNAR_FESTIVALS,
  FEST_HEAD,
  FEST_EXAMPLES,
  parseCustomFestivals,
  findFestival,
  FUZZY_WORDS,
  WEEK_START_DOW,
  VALID_WEEK_START,
  weekDoyOf,
  dayOfYearOf,
  firstWeekOffset,
  weeksInYear,
  weekNumberOf,
  sameDay,
};

  };

  __modules['src/lunar.js'] = function (module, exports, require) {
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900–1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910–1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920–1929
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930–1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940–1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950–1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960–1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970–1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980–1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990–1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000–2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010–2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020–2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030–2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040–2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050–2059
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060–2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070–2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080–2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090–2099
  0x0d520, // 2100
];

/** 支持范围：超出即返回 null，不做外推 */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/** 农历月名 */
const CN_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
/** 日期数字 */
const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 天干 / 地支 / 生肖 */
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/** 二十四节气 */
const SOLAR_TERMS = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

/**
 * 节气偏移表：以 1900-01-06 02:05 为基准，单位 1/60000 分钟。
 * 配合回归年长度可算出任意年份某节气在哪一天。
 */
const S_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921,
  173149, 195551, 218072, 240693, 263343, 285989, 308563, 331033,
  353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758,
];

/* ------------------------------------------------------------------ *
 * 表查询
 * ------------------------------------------------------------------ */

/** 闰哪个月；0 表示当年无闰月 */
function leapMonth(year) {
  return LUNAR_INFO[year - MIN_YEAR] & 0xf;
}

/** 闰月天数；无闰月返回 0 */
function leapDays(year) {
  return leapMonth(year) ? (LUNAR_INFO[year - MIN_YEAR] & 0x10000 ? 30 : 29) : 0;
}

/** 第 month 个月的天数（不含闰月） */
function monthDays(year, month) {
  if (month < 1 || month > 12) return -1;
  return LUNAR_INFO[year - MIN_YEAR] & (0x10000 >> month) ? 30 : 29;
}

/** 农历年总天数 */
function yearDays(year) {
  let sum = 348; // 12 个月都按 29 天算
  for (let bit = 0x8000; bit > 0x8; bit >>= 1) {
    if (LUNAR_INFO[year - MIN_YEAR] & bit) sum += 1;
  }
  return sum + leapDays(year);
}

/* ------------------------------------------------------------------ *
 * 核心转换
 * ------------------------------------------------------------------ */

/**
 * 阳历转农历。
 * @returns {{year:number,month:number,day:number,isLeap:boolean}|null}
 *          超出范围或早于基准日返回 null
 */
function solarToLunar(y, m, d) {
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  if (y === 1900 && m === 1 && d < 31) return null; // 基准日之前无数据

  // 基准：1900-01-31 为农历 1900 年正月初一
  let offset = Math.floor(
    (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000
  );

  // 定位农历年。
  // 注意 for 循环退出时 i 已自增一轮，故年份取退出后的 i，
  // 减过头（offset < 0）再回退一年 —— 这里极易差 1，改动请对照测试。
  let i = MIN_YEAR;
  let temp = 0;
  for (; i <= MAX_YEAR && offset > 0; i++) {
    temp = yearDays(i);
    offset -= temp;
  }
  let year = i;
  if (offset < 0) {
    offset += temp;
    year -= 1;
  }

  const leap = leapMonth(year); // 该年闰几月，0 表示无
  let isLeap = false;

  // 定位农历月。闰月插在第 leap 月之后：走到 leap+1 时先回退一格处理闰月，
  // 下一轮再正常处理第 leap+1 月。
  let j = 1;
  let monthLen = 0;
  for (; j < 13 && offset > 0; j++) {
    if (leap > 0 && j === leap + 1 && !isLeap) {
      j -= 1;
      isLeap = true;
      monthLen = leapDays(year);
    } else {
      monthLen = monthDays(year, j);
    }
    if (isLeap && j === leap + 1) isLeap = false; // 闰月处理完，解除标记
    offset -= monthLen;
  }
  let month = j;

  // 正好落在闰月边界时修正下标
  if (offset === 0 && leap > 0 && month === leap + 1) {
    if (isLeap) isLeap = false;
    else {
      isLeap = true;
      month -= 1;
    }
  }
  if (offset < 0) {
    offset += monthLen;
    month -= 1;
  }

  return { year, month, day: offset + 1, isLeap };
}

/* ------------------------------------------------------------------ *
 * 中文格式化
 * ------------------------------------------------------------------ */

/** 农历日：初一 / 十五 / 廿三 / 三十 */
function cnDay(day) {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  const prefix = ['初', '十', '廿', '三'][Math.floor(day / 10)];
  const rest = day % 10;
  return rest === 0 ? prefix + '十' : prefix + CN_NUM[rest];
}

/** 农历月：正月 / 冬月 / 腊月；闰月加「闰」 */
function cnMonth(month, isLeap) {
  const base = CN_MONTH[month - 1] || String(month);
  return (isLeap ? '闰' : '') + base + '月';
}

/** 完整农历字符串，如「农历2026年八月十九」 */
function formatLunar(lunar) {
  return `农历${lunar.year}年${cnMonth(lunar.month, lunar.isLeap)}${cnDay(lunar.day)}`;
}

/** 干支年，如「丙午」 */
function ganZhi(year) {
  const g = GAN[(year - 4) % 10];
  const z = ZHI[(year - 4) % 12];
  return g + z;
}

/** 生肖，如「马」 */
function zodiac(year) {
  return ANIMALS[(year - 4) % 12];
}

/* ------------------------------------------------------------------ *
 * 节气
 * ------------------------------------------------------------------ */

/** 儒略日数：Unix 毫秒 → JDE */
function msToJde(ms) {
  return ms / 86400000 + 2440587.5;
}

/** JDE → Date，tzHours 为时区偏移（中国标准时间用 +8） */
function jdeToDate(jde, tzHours) {
  return new Date((jde - 2440587.5) * 86400000 + tzHours * 3600000);
}

/**
 * 太阳视黄经（度）。
 * 采用截断的 VSOP87 级数，忽略章动与光行差修正，
 * 残差约 0.01 度 —— 折算到时间不到 15 分钟，判定「哪天是节气」绰绰有余。
 */
function sunLongitude(jde) {
  const T = (jde - 2451545.0) / 36525; // 自 J2000.0 起的儒略世纪数
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T; // 平黄经
  const M = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI) / 180; // 平近点角
  const C =
    (1.914602 - 0.004817 * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M); // 中心差
  let lon = (L0 + C) % 360;
  if (lon < 0) lon += 360;
  return lon;
}

/** 太阳黄经的日变化率（度/天） */
const LON_PER_DAY = 360 / 365.2422;

/**
 * 求第 n 个节气（0 = 小寒）的公历日期。
 * 先用近似表取初值，再用牛顿迭代收敛到黄经刚好等于目标值的时刻。
 * @param tzHours 时区偏移，中国用 8
 * @returns {number} 该节气落在几号
 */
function termDay(y, n, tzHours) {
  const tz = typeof tzHours === 'number' ? tzHours : 8;
  if (y < MIN_YEAR || y > MAX_YEAR) return -1;

  // 初值：近似表，误差通常 ±1 天，足够迭代收敛
  let jde = msToJde(
    31556925974.7 * (y - MIN_YEAR) + S_TERM_INFO[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5)
  );
  const target = (285 + n * 15) % 360; // 小寒起算，每个节气 15 度

  for (let k = 0; k < 8; k++) {
    let diff = sunLongitude(jde) - target;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-7) break;
    jde -= diff / LON_PER_DAY; // 黄经差换算成天数
  }

  return jdeToDate(jde, tz).getUTCDate();
}

/**
 * 查某天是不是节气。
 * @returns {string|null} 节气名，不是节气返回 null
 */
function solarTerm(y, m, d) {
  const first = (m - 1) * 2;
  if (d === termDay(y, first)) return SOLAR_TERMS[first];
  if (d === termDay(y, first + 1)) return SOLAR_TERMS[first + 1];
  return null;
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 * 反向转换：农历 → 阳历
 *
 * 思路：先算出「农历某年正月初一」对应的阳历日期，
 * 再逐月累加到目标月，最后加上日偏移。
 * 与 solarToLunar 共用同一张表，结果互为逆运算。
 * ------------------------------------------------------------------ */

/**
 * 农历正月初一的阳历基准偏移（距 1900-01-31 的天数）。
 * 逐年累加得到，缓存一次即可 —— 这是**内存缓存**，不落盘、不写 data.json。
 */
let yearOffsetCache = null;

function buildYearOffsets() {
  const offsets = new Array(MAX_YEAR - MIN_YEAR + 2);
  let sum = 0;
  offsets[0] = 0; // 1900 年正月初一 = 1900-01-31
  for (let y = MIN_YEAR; y < MAX_YEAR; y++) {
    sum += yearDays(y);
    offsets[y - MIN_YEAR + 1] = sum;
  }
  return offsets;
}

/** 农历第 y 年正月初一，距 1900-01-31 的天数 */
function yearOffset(y) {
  if (!yearOffsetCache) yearOffsetCache = buildYearOffsets();
  return yearOffsetCache[y - MIN_YEAR];
}

/**
 * 农历转阳历。
 * @param y 农历年（1900–2100）
 * @param m 农历月（1–12）
 * @param d 农历日（1–30）
 * @param isLeap 是否闰月
 * @returns {Date|null} 参数非法或该月不存在时返回 null
 */
function lunarToSolar(y, m, d, isLeap) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  if (m < 1 || m > 12) return null;

  const leap = leapMonth(y);
  // 闰月必须与该年实际的闰月一致
  if (isLeap && leap !== m) return null;

  const maxDay = isLeap ? leapDays(y) : monthDays(y, m);
  if (d < 1 || d > maxDay) return null;

  // 正月初一 + 之前各月天数 + 日偏移。
  // 闰月紧跟在第 leap 月之后，所以只要 leap < m，累加时就必须带上它的天数 ——
  // 漏掉会让闰月之后的所有月份整体偏移一个月。
  let offset = yearOffset(y);
  for (let i = 1; i < m; i++) offset += monthDays(y, i);
  if (leap > 0 && leap < m) offset += leapDays(y);
  if (isLeap) offset += monthDays(y, m); // 闰月排在同名月之后
  offset += d - 1;

  return new Date(Date.UTC(1900, 0, 31) + offset * 86400000);
}

/**
 * 解析农历日期文本。
 * 支持：2026年八月十九 / 八月十九 / 农历2026年八月初一 / 闰二月初五 / 二〇二六年八月十九
 * 不写年份时默认取当前农历年（按今天推算）。
 * @returns {{year:number,month:number,day:number,isLeap:boolean}|null}
 */
function parseLunar(text, nowYear) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  const s = raw.replace(/^农历/, '').replace(/\s+/g, '');

  // ---- 年份 ----
  let year = null;
  let rest = s;
  const arabic = /^(\d{4})\s*年/.exec(rest);
  if (arabic) {
    year = Number(arabic[1]);
    rest = rest.slice(arabic[0].length);
  } else {
    // 中文数字年份，如 二〇二六 / 二零二六
    const cn = /^([零〇一二三四五六七八九]{4})年/.exec(rest);
    if (cn) {
      year = cnYear(cn[1]);
      rest = rest.slice(cn[0].length);
    }
  }

  // ---- 闰月 ----
  let isLeap = false;
  if (rest.startsWith('闰')) {
    isLeap = true;
    rest = rest.slice(1);
  }

  // ---- 月份 ----
  // 既支持中文月名（五月），也支持阿拉伯数字（5月）—— 后者在开启
  // 「带号的都算农历」开关时必须能解析，否则开关形同虚设。
  let m = parseCnMonth(rest);
  if (!m) m = parseArabicMonth(rest);
  if (!m) return null;
  rest = rest.slice(m.len);

  // ---- 日期 ----
  let d = parseCnDay(rest);
  if (!d) d = parseArabicDay(rest);
  if (!d) return null;

  if (year === null) {
    year = nowYear || currentLunarYear();
  }
  if (year < MIN_YEAR || year > MAX_YEAR) return null;

  return { year, month: m.value, day: d.value, isLeap };
}

/** 四位中文数字年份，如 二〇二六 → 2026 */
function cnYear(str) {
  let n = 0;
  for (const ch of str) {
    const v = CN_NUM.indexOf(ch === '〇' ? '零' : ch);
    if (v < 0) return -1;
    n = n * 10 + v;
  }
  return n;
}

/** 今天是农历哪一年 */
function currentLunarYear() {
  const now = new Date();
  const l = solarToLunar(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return l ? l.year : now.getFullYear();
}

/**
 * 农历函数集合。必须放在农历算法定义之后，否则常量处于 TDZ 会报错。
 * 本文件内的转换逻辑统一走 lunar.xxx，测试也从这里取，避免散落两处。
 */
const lunar = {
  MIN_YEAR, MAX_YEAR, LUNAR_INFO, SOLAR_TERMS, GAN, ZHI,
  leapMonth, leapDays, monthDays, yearDays,
  solarToLunar, lunarToSolar, parseLunar, cnYear, currentLunarYear,
  cnDay, cnMonth, formatLunar, ganZhi, zodiac,
  solarTerm, termDay,
};

/* ------------------------------------------------------------------ *
 * 中文 / 阿拉伯数字的月日解析
 * ------------------------------------------------------------------ *
 * 为什么放在这里：parseLunar 要吃「农历五月初五」和「农历5月初5」两种写法，
 * 前者靠中文月名、后者靠阿拉伯数字，缺一个开关就形同虚设。
 * 它们只依赖上面的 cnDay / cnMonth，不碰设置、不碰 DOM。
 * ------------------------------------------------------------------ */
/**
 * 由 cnDay / cnMonth 的输出反查数值。
 * 手写解析容易漏掉「二十」「三十」这类特殊写法，
 * 直接用格式化函数生成全部候选再反查，天然保证正反一致。
 */
const DAY_MAP = (() => {
  const map = {};
  for (let d = 1; d <= 30; d++) map[cnDay(d)] = d;
  return map;
})();

const MONTH_MAP = (() => {
  const map = {};
  for (let m = 1; m <= 12; m++) map[cnMonth(m, false)] = m;
  return map;
})();

/** 按最长匹配原则，从文本开头取出一个 key 对应的值 */
function matchFrom(rest, map) {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (rest.startsWith(k)) return { value: map[k], len: k.length };
  }
  return null;
}

/** 解析农历月名（中文），返回 { value, len } */
function parseCnMonth(rest) {
  return matchFrom(rest, MONTH_MAP);
}

/** 解析「5月」这类阿拉伯数字月份，返回 { value, len } */
function parseArabicMonth(rest) {
  const m = /^(\d{1,2})月/.exec(String(rest ?? ''));
  if (!m) return null;
  const v = Number(m[1]);
  if (v < 1 || v > 12) return null;
  return { value: v, len: m[0].length };
}

/**
 * 解析「16号」「16日」这类阿拉伯数字日，返回 { value, len }。
 * 必须完整吃掉后面的「号 / 日」，否则残留字符会让整条解析失败。
 */
function parseArabicDay(rest) {
  const m = /^(\d{1,2})\s*[号日]/.exec(String(rest ?? ''));
  if (!m) return null;
  const v = Number(m[1]);
  if (v < 1 || v > 30) return null;
  return { value: v, len: m[0].length };
}

function parseCnDay(rest) {
  return matchFrom(rest, DAY_MAP);
}

module.exports = {
  lunar,
  MIN_YEAR,
  MAX_YEAR,
  CN_NUM,
  LUNAR_INFO,
  SOLAR_TERMS,
  GAN,
  ZHI,
  leapMonth,
  leapDays,
  monthDays,
  yearDays,
  solarToLunar,
  lunarToSolar,
  parseLunar,
  cnYear,
  currentLunarYear,
  cnDay,
  cnMonth,
  formatLunar,
  ganZhi,
  zodiac,
  solarTerm,
  termDay,
  buildYearOffsets,
  yearOffset,
  msToJde,
  jdeToDate,
  sunLongitude,
  DAY_MAP, MONTH_MAP, matchFrom,
  parseCnMonth, parseArabicMonth, parseArabicDay, parseCnDay,
};

  };

  __modules['src/pomowin.js'] = function (module, exports, require) {
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

  };

  __modules['src/settings.js'] = function (module, exports, require) {
const obsidian = require('obsidian');
const { t: i18nT, normalizeLang, renderLangTab } = require('./i18n.js');
/* 时段表与时间口径都在 timejudge.js 里，只引用不复制：抄一份会导致新增时段要改两处。 */
const J = require('./timejudge.js');
/* 独立窗口的位置枚举与选项文案在 pomowin.js 里，这里只引用不复制 */
const { VALID_POPOUT_POS, POPOUT_POS_OPTIONS } = require('./pomowin.js');

/*
 * 全局设置：默认配置 + 旧版数据迁移 + 设置页
 *
 * 根节点只保留 timestamp / pomodoro 两个分组，两个模块各读各组。
 * 番茄钟的「时长方案」用 profiles 数组管理，当前生效值同步到 focusMin 等字段。
 *
 * 设置页也放在本文件：只有一个入口，顶部标签切换模块，
 * 附加区块在 SECTIONS 数组登记，新增功能不必改动渲染流程。
 */

/** 内置时长方案：专注 / 短休息 / 长休息（分钟） */
const DEFAULT_PROFILES = [
  { id: 'work', name: '工作', focusMin: 40, shortBreakMin: 10, longBreakMin: 90 },
  { id: 'study', name: '学习', focusMin: 25, shortBreakMin: 5, longBreakMin: 15 },
  { id: 'reading', name: '阅读', focusMin: 30, shortBreakMin: 3, longBreakMin: 10 },
];

/* 周起始合法值由 timejudge.WEEK_START_DOW 派生：三处曾各写一份字面量，现统一为唯一真源。 */
const VALID_WEEK_START = J.VALID_WEEK_START;

/**
 * 番茄钟主题的合法取值（属配置 schema，故定义在 settings.js）。
 *
 * 四个取值对应四种完全不同的样式策略，不要混：
 *   classic —— 经典：保留边框、阴影、圆角卡片，默认值。
 *   minimal —— 极简：去掉边框与阴影，背景透明，只留文字和一条细进度线。
 *              理由：番茄钟是常驻浮窗，抢眼会干扰写作，让它退到背景里。
 *   dynamic —— 流光：在 classic 基础上加呼吸光晕与流动渐变进度条。
 *              动画只走 opacity / transform，不触发重排；且尊重
 *              prefers-reduced-motion（系统开启「减弱动态效果」时自动静止）。
 *   scythe  —— 赤镰：暗黑底 + 镰刃红血流边框，进度条带一道扫光。
 *              注意底色必须实色：半透明会透出底下的血流层（代价：毛玻璃不生效）。
 *   custom  —— 自定义：插件只挂 .pomo-theme-custom 这个钩子，不提供任何样式，
 *              由用户用 CSS 片段（或设置里的自定义 CSS 框）完全接管。
 *
 * 主题的实际样式全部由 styles.css 里的 CSS 变量驱动，切换主题只是换一个
 * class —— 不增删 DOM、不重绘，代价接近零。
 */
const VALID_POMO_THEME = ['classic', 'minimal', 'dynamic', 'ethereal', 'scythe', 'custom'];
const VALID_POMO_UI_MODE = ['floating', 'sidebar', 'popout'];

/** 主题下拉的选项文案（值与 VALID_POMO_THEME 必须一致，有测试守着） */
const POMO_THEME_OPTIONS = [
  { value: 'classic', label: '经典（默认）' },
  { value: 'minimal', label: '极简' },
  { value: 'dynamic', label: '流光（动态）' },
  { value: 'ethereal', label: '空灵紫（水光渐变）' },
  { value: 'scythe', label: '赤镰（暗红血流）' },
  { value: 'custom', label: '自定义（写 CSS）' },
];

/**
 * 时间转换扩展的转换项清单（属配置 schema，故定义在 settings.js）
 * 顺序即界面顺序，key 即设置键。
 */
const ACTION_DEFS = [
  /* ================= 正向：日期/时间 → 别的表达 ================= */
  /*
   * 统一格式：把任意识别出来的时间换成同一个格式串。
   * 放第一位 —— 它是最常用的「归一化」操作。
   * 格式串单独存 unifyFormat，留空时跟随时间戳格式（即最初那套），
   * 这样改时间戳格式统一格式会跟着变，不用配两处。
   */
  {
    key: 'unify',
    name: '统一格式',
    desc: '把识别出的时间换成统一格式（格式在设置里改，默认与时间戳一致）',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'relative',
    name: '转相对时间',
    desc: '把日期变成「3 天前」「2 小时后」这类相对描述',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'weekday',
    name: '补星期',
    desc: '在日期后面补上星期，如 2026-09-19 周六',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'dailyLink',
    name: '转日记链接',
    desc: '变成 [[2026-09-19]]，方便链到当天日记',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'unixEncode',
    name: '日期 → 时间戳',
    desc: '把日期变成 10 位 Unix 时间戳',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'dateShift',
    name: '日期偏移',
    desc: '加减天数，填 +7 或 -3，自己决定偏移多少',
    group: 'forward',
    defaultOn: false,
  },
  {
    key: 'fillDate',
    name: '补全日期',
    desc: '只写了月日或时分时，补上今年与今天，如 09-17 → 2026-09-17、14:30 → 2026-09-19 14:30',
    group: 'forward',
    defaultOn: true,
  },
  {
    key: 'timePart',
    name: '取时分秒',
    desc: '从日期时间里只取出时间部分，如 2026-09-19 14:30:25 → 14:30:25',
    group: 'forward',
    defaultOn: false,
  },

  /* ================= 农历 ================= */
  {
    key: 'lunar',
    name: '转农历',
    desc: '阳历日期 → 农历，如「农历2026年八月十九」',
    group: 'lunar',
    defaultOn: true,
  },
  {
    key: 'lunarGanzhi',
    name: '农历 + 干支生肖',
    desc: '转农历并附带干支年与生肖，如「丙午年马」',
    group: 'lunar',
    defaultOn: false,
  },
  {
    key: 'solarTerm',
    name: '查节气',
    desc: '当天是二十四节气中的哪一个；不是节气则这一项不显示',
    group: 'lunar',
    defaultOn: false,
  },

  /* ================= 逆向：别的表达 → 日期 =================
   * 默认开启：口语相对日（明天 / 后天）这类很常用，默认关会让人以为功能坏了。
   * 打开后只有在选中文本确实是该形态时才会出现在面板里，不会干扰正向项。
   */
  {
    key: 'unixDecode',
    name: '时间戳 → 日期',
    desc: '把 1768800000 变成可读日期',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'lunarToSolar',
    name: '农历 → 阳历',
    desc: '把「八月十九」这类农历日期转回阳历；可带年份，如 2026年八月十九',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'relativeToDate',
    name: '相对时间 → 日期',
    desc: '把「3 天前」「2 小时后」这类描述算回具体日期',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'linkToDate',
    name: '日记链接 → 日期',
    desc: '去掉 [[]] 变成纯日期，如 [[2026-09-19]] → 2026-09-19',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'stripWeekday',
    name: '去掉星期',
    desc: '把「2026-09-19 周六」变回「2026-09-19」',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'termToDate',
    name: '节气 → 日期',
    desc: '查某年某个节气是几号，如「立春」→ 2026-02-04；可带年份「2027年立春」',
    group: 'reverse',
    defaultOn: true,
  },
  {
    key: 'ganzhiToYear',
    name: '干支 → 年份',
    desc: '把「丙午」这样的干支换算成最接近今年的公历年份，如 丙午 → 2026（马年）',
    group: 'reverse',
    defaultOn: true,
  },

  /* ================= 节日（正向 ⇄ 逆向） ================= */
  /*
   * 正向「日期 → 节日」：选中 2026-10-01 得到「国庆节」。
   * 逆向「节日 → 日期」：选中「中秋节」得到当年中秋的阳历日期。
   * 两个方向的输出都受 festivalPrefix 控制（见 defaultExtensions 注释）：
   * 打开时统一成「国庆节 2026-10-01」这种「节日名 + 日期」的形式。
   */
  {
    key: 'festival',
    name: '日期 → 节日',
    desc: '查出这天是哪个节日，如 2026-10-01 → 国庆节；不是节日则这一项不显示',
    group: 'festival',
    defaultOn: true,
  },
  {
    key: 'festivalToDate',
    name: '节日 → 日期',
    desc: '算出某个节日是几号，如 中秋 → 当年八月十五对应的阳历日期',
    group: 'festival',
    defaultOn: true,
  },

  /* ================= 倒计时 / 日期差值 =================
   * 这一组与前面几项不同：输入是日期，输出是「天数」这类数字。
   * 默认关 —— 输出会把原文里的日期替换成一个数字，误触发等于丢了原文，
   * 属于「想要才开」的功能，不做默认。
   */
  {
    key: 'countdown',
    name: '倒计时',
    desc: '算出距某个日期还有多少天；已过的显示「已过去 N 天」，当天显示「就是今天」',
    group: 'countdown',
    defaultOn: false,
  },
  {
    key: 'dateDiff',
    name: '日期差值',
    desc: '选中含两个日期的文本算相差天数，如 2026-01-01 到 2026-03-01 → 相差 59 天',
    group: 'countdown',
    defaultOn: false,
  },
];

/**
 * 正向 ⇄ 逆向 的配对表。
 *
 * 开关太多会让设置页很乱，所以默认把一对合并成一个开关：
 * 界面上只渲染正向那一项，读写时同步到配对的逆向项。
 * 想分开控制就打开 extensions.separateDirections。
 */
const ACTION_PAIRS = [
  ['relative', 'relativeToDate'],
  ['weekday', 'stripWeekday'],
  ['dailyLink', 'linkToDate'],
  ['unixEncode', 'unixDecode'],
  ['lunar', 'lunarToSolar'],
  ['lunarGanzhi', 'ganzhiToYear'],
  ['solarTerm', 'termToDate'],
  ['festival', 'festivalToDate'],
];

/** 取某项配对的另一半；没有配对返回 null */
function pairOf(key) {
  for (const pair of ACTION_PAIRS) {
    if (pair[0] === key) return pair[1];
    if (pair[1] === key) return pair[0];
  }
  return null;
}

/** 是否为「正向」那一半（界面上代表整对渲染的那一项） */
function isForwardOfPair(key) {
  return ACTION_PAIRS.some((pair) => pair[0] === key);
}

/**
 * 设置页分区（三区）。
 * 第三区放高级/杂项开关，平时可以折叠，避免前两区的转换项被淹没。
 */
const ACTION_GROUPS = [
  { key: 'forward', title: '常用转换（正向 ⇄ 逆向）', titleKey: 'grp.forward' },
  { key: 'lunar', title: '农历转换（正向 ⇄ 逆向）', titleKey: 'grp.lunar' },
  { key: 'festival', title: '节日转换（正向 ⇄ 逆向）', titleKey: 'grp.festival' },
  { key: 'countdown', title: '倒计时 / 日期差值', titleKey: 'grp.countdown' },
];

/** 高级设置区：不属于具体转换项的杂项开关都放这里 */
const ADVANCED_GROUP = { key: 'advanced', title: '高级设置', titleKey: 'grp.advanced' };

/**
 * 农历相关的转换项 key。
 * 总开关关闭时这些项一律不生效，全部按阳历走。
 * 单独列出来是因为它们分散在 lunar / reverse 两个 group 里，
 * 只按 group 判断会漏掉 lunarToSolar、ganzhiToYear 等逆向项。
 */
const LUNAR_KEYS = [
  'lunar', 'lunarGanzhi', 'solarTerm',
  'lunarToSolar', 'ganzhiToYear', 'termToDate',
];

/** 是否为农历相关项 */
function isLunarKey(key) {
  return LUNAR_KEYS.indexOf(key) >= 0;
}

/** 合法的设置键集合，用于迁移时剔除废弃键，避免设置文件越积越大 */
const ACTION_KEYS = ACTION_DEFS.map((a) => a.key);

/** 默认开关状态：只默认打开常用的 */
function defaultActionItems() {
  const items = {};
  ACTION_DEFS.forEach((a) => {
    items[a.key] = a.defaultOn;
  });
  return items;
}

/*
 * 时段小时清洗复用 timejudge 的实现（J.cleanDaypartHours）：
 * 另存一份等价实现会导致只改一处、行为分叉。
 */

function defaultExtensions() {
  return {
    enabled: true, // 扩展功能总开关，默认打开
    items: defaultActionItems(),
    dailyLinkFormat: 'YYYY-MM-DD', // 日记链接里用的日期格式
    /*
     * 「统一格式」转换项用的格式串。
     * 留空 = 跟随时间戳格式（DEFAULT_SETTINGS.timestamp.format）。
     */
    unifyFormat: '',
    /*
     * 转换后是否显示可点击的撤回标记。
     * 注意：标记是 CM6 装饰，不写进正文（安全红线），不是"在文本后附加字符"。
     * 关闭 = 整个撤回功能停摆：不显示图标、**也不记录**，撤回命令会提示已关闭。
     * 记录只在内存，关闭 Obsidian 即清空。
     */
    undoHintEnabled: true,

    /*
     * 没选中文本、由光标自动识别出时间时，结果放哪：
     *   false（默认）覆盖识别到的那段原文
     *   true        在原文后面追加，原文保留
     * 只对「自动识别」生效；手动框选时始终是替换选区。
     */
    appendOnAutoPick: false,
    /*
     * 相对时间结果里是否附带「（相对 …）」的说明。
     * 默认开：笔记里的相对描述过几天再看，没有基准就不知道相对哪一天。
     */
    showRelativeBase: true,
    /*
     * 分别控制正向与逆向。
     * 默认关：一对共用一个开关，界面干净。
     * 打开后每对展开成「正向」「逆向」两个独立开关。
     */
    separateDirections: false,
    /* 折叠转换项开关列表：默认展开，打开后收起以简化界面 */
    collapseItems: false,
    /*
     * 精确到秒。关闭（默认）时所有时间输出只到分钟；
     * 在 fmt() 统一出口处理，连自定义格式串里的 ss 也会被去掉。
     */
    preciseToSecond: false,
    /*
     * 时段名（早上 / 下午 …）单独出现时是否转换。
     * 默认关（方案丙）：「早上」指 8 点还是 9 点没有共识，
     * 强行给一个值等于编造。开启后按 daypartHours 里的小时值转换。
     */
    convertDaypartAlone: false,
    /* 各时段名对应的小时值，可在设置里改；默认见 TIME_OF_DAY */
    daypartHours: {},
    /*
     * 历法标记是否也允许出现在日期**后面**。
     * 关（默认）：只有「农历2026年八月初九」这类**前缀**写法才认。
     * 开：「2026年八月初九 农历」这类后缀写法也能识别。
     */
    lunarMarkAnywhere: false,
    /*
     * 农历总开关。
     * 关闭后**所有日期一律按阳历处理**，与农历无关：
     * 农历相关的转换项（转农历、干支、节气、农历→阳历…）全部不生效，
     * 子开关（大写中文即农历、带号算农历）也一并失效并被隐藏。
     * 打开后各子开关才生效。
     */
    lunarEnabled: true,
    /*
     * 大写中文书写的日期是否一律算农历。
     * 关（默认）：只有「五月十六」「五月十六号」算农历；
     *            带「日」的（五月十六日）按阳历。
     * 开：只要是大写中文书写就按农历（含「五月十六日」），阿拉伯数字一律阳历。
     */
    lunarOnCnUpper: false,
    /*
     * 带「号 / 日」的月日是否都按农历处理。
     * 关（默认）：中文大写（五月十六号）算农历，阿拉伯数字（5月16号）算阳历。
     * 开：只要带「号 / 日」后缀，一律按农历。
     */
    lunarOnHao: false,
    /*
     * ── 时间口径 ──
     * 中文里有几处写法**没有共识**，插件不能替用户拍板：
     * 「周末」是周六还是周日、「下周一」指明天还是下个日历周、
     * 「17号」补本月还是取下月。三项都给默认值，也都能改。
     * 界面上整块折叠（collapseSemantics），只想要默认值的用户不会被打扰。
     */
    /*
     * 周末 → 6=周六（默认）/ 7=周日。
     * 默认周六：与插件一贯的行为一致，也与 Calendar 等插件的映射相同；
     * 习惯把周日当周末的人在「时间口径」里改。
     */
    weekendDay: 6,
    /* 「下周一」：tomorrow=按本周+7天（默认） / nextweek=严格下一个日历周 */
    nextWeekdayMode: 'tomorrow',
    /* 「17号」这类只有日的写法：current=补本月（默认）/ upcoming=已过则取下月 / off=不转换 */
    dayOnlyMode: 'current',
    /* 「时间口径」这一区默认折叠 */
    collapseSemantics: true,
    /*
     * 自定义转换规则。一行一条，格式：被替换文本 操作符 结果
     *   =  替换（用结果顶掉内置转换结果）
     *   +  追加（保留内置结果，再接一段）
     *   -  隐藏（不转换，保持原文）
     * 覆盖不等于抹除：内置规则永远在，用户规则只在其上生效，
     * 删掉用户规则即自动恢复内置结果。
     */
    userRules: '',

    /*
     * 自定义规则是否参与「日历解析」（文件名 → 日期的识别）。
     * 默认关：两套解析混进来会互相干扰（见 _test/userrules.js），
     * 而且默认改动识别行为会让已有的高亮/圆点结果发生变化。
     * 打开后，日历在解析笔记名前先套用同一份规则 —— 用来让旧命名
     * 不必改名也能被认出来。
     */
    userRulesForCalendar: false,

    /*
     * ── 节日转换 ──
     */
    /*
     * 节日转换结果是否补成「节日名 + 日期」。
     * 默认开：无论正向（日期→节日）还是逆向（节日→日期），
     * 输出都统一成「国庆节 2026-10-01」—— 只写「国庆节」看不出是哪年，
     * 只写日期又丢了节日本身的信息，两个方向都带上最完整。
     * 关掉：按各自默认模式 —— 正向只给节日名，逆向只给日期。
     */
    festivalPrefix: true,
    /*
     * 用户自设节日，一行一条，格式见 timejudge.js 的 CUSTOM_FESTIVAL_HELP。
     * 是用户显式输入的有限条目，不是随使用自动增长的缓存。
     */
    customFestivals: '',

    /*
     * 「日期差值」是否额外给出工作日天数。默认关：
     * 工作日要按天遍历一遍区间，长区间（跨数年）有开销；
     * 且只扣周末、不扣法定节假日，给出数字容易让人误以为是精确的请假天数，
     * 需要的人自己开。
     */
    dateDiffWorkdays: false,

    /*
     * 「一周从哪天开始」不在这里 —— 全插件共用一个值：calendar.weekStart。
     * 本模块（第N周、周偏移）与日历视图都读它，避免两处设置互相打架。
     */
  };
}

/**
 * 默认写入模板（记录模块）
 *
 * 用 {{focusText}} / {{restText}} 而不是 {{focus}} / {{rest}}：
 * 前者自带单位，且精度跟随「记录到秒」开关 —— 关则「26 分钟」、开则「25 分 30 秒」。
 * 后者是纯整数分钟，不随开关变化，开了「记录到秒」笔记里也不会有任何区别。
 *
 * ★ 这里不能在占位符后再写「分钟」二字：focusText 自带单位，
 *   写成「{{focusText}} 分钟」会渲染成「25 分 30 秒 分钟」。
 */
const DEFAULT_RECORD_TEMPLATE = [
  '## 🍅 {{date}} {{range}}',
  '- 完成 {{cycles}} 轮 · 长休息 {{longBreaks}} 次',
  '- 专注 {{focusText}} · 休息 {{restText}} · 暂停 {{pauses}} 次',
  '{{skippedLine}}',
  '- 方案：{{profile}}',
].join('\n');

/*
 * 配置结构版本号。
 *
 * 为什么需要它：migrateSettings 是逐个键 hand-pick 的白名单合并，
 * 缺键一律落默认值。这能挡住脏数据，却**分不清两种情况** ——
 * 「老用户从没设过这个键」与「用户主动把它改成了默认值」。
 * 一旦将来把某个键的语义换了（布尔改枚举、分钟改秒、字符串改数组），
 * 没有版本号就只能靠猜，猜错就静默丢用户设置。
 * 有了它，迁移可以按「这份文件是哪个版本写的」决定要不要搬值。
 *
 * 用法：读出来源版本 → 按版本决定是否搬值 → 迁移结束一律写成当前版本。
 * 目前只有 v1，尚无任何需要按版本分支的迁移，此处先把记录点立起来。
 */
const SETTINGS_SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS = {
  /* 配置结构版本（见 SETTINGS_SCHEMA_VERSION）。不参与任何功能判断，只作迁移依据 */
  schemaVersion: SETTINGS_SCHEMA_VERSION,

  /*
   * 界面语言（独立项，不属于任何功能模块）
   * 只影响设置页上显示的字。删掉这一行 + i18n 模块，界面回到全中文。
   */
  uiLang: 'auto',

  /* ---- 模块一：时间戳 ---- */
  timestamp: {
    format: 'YYYY-MM-DD HH:mm:ss', // moment 格式串
    insertNewline: false, // 插入时间戳后是否补换行
    // 斜杠命令默认关闭：/ 是公共资源，容易被 Slash Commander、
    // Templater 等插件同时接管，默认让位，需要时再开。
    enableSlashCommand: false,
    slashTrigger: 'now', // 自定义触发词（不含斜杠）
    extensions: defaultExtensions(), // 扩展：时间文本转换（总开关 + 逐项开关）
  },

  /* ---- 模块二：番茄钟 ---- */
  pomodoro: {
    // 界面
    uiMode: 'floating', // 'floating' 浮窗 | 'sidebar' 侧边栏 | 'popout' 独立窗口
    // 独立窗口的尺寸（像素）与位置。
    // 尺寸走 openPopoutLeaf 的 size 参数；Electron 窗口 API 可达时，
    // 还会用 setBounds 精确落位（见 pomowin.js）。0 表示交给系统决定。
    popoutWidth: 616,
    popoutHeight: 406,
    // 开窗时把窗口放到屏幕的哪个角；'system' = 不干预。
    // 位置必须在 pop-out 那份实例里设置才有效（主窗口改不到它），见 pomowin.js。
    popoutPos: 'bottom-right',
    // 置顶：让番茄钟窗口浮在其他应用之上。Electron 窗口 API 不可达时静默失效。
    popoutAlwaysOnTop: true,
    // 无边框：隐藏窗口内的标签栏 / 状态栏 / 侧边栏，让番茄钟铺满内容区。
    // 注意：系统标题栏去不掉（Electron 的 frame 只能建窗时指定），见 pomowin.js 顶部说明。
    popoutBorderless: true,
    /*
     * 桌面常驻（方案 B）：把主窗口缩成番茄钟大小、置顶、摆到屏幕角上。
     * 存在的原因：独立窗口去不掉系统标题栏（见 pomowin.js 顶部），
     * 达不到「桌面上一个无边框小番茄钟」的效果，所以反过来缩小主窗口。
     * deskDockRestore 是关闭时用来还原主窗口的原始 bounds ——
     * 不存下来就意味着关掉开关后主窗口再也回不去，那比不做这功能更糟。
     * 它只在开启期间有值，关闭时立刻清空，不会留在 data.json 里。
     */
    deskDock: false,
    deskDockWidth: 365,
    deskDockHeight: 378,
    deskDockOnTop: true,
    deskDockPos: 'bottom-right',
    deskDockRestore: null,
    snapToEdge: true, // 拖动松手后是否吸附到最近的边
    floatEdge: 'right', // 吸附边：top / bottom / left / right
    floatOffset: 0.62, // 沿吸附边的位置比例 0~1（视口尺寸变化时用）
    floatPx: null, // 沿吸附边的精确像素值（视口尺寸未变时优先用）
    freeX: 0.72, // 不吸附时的自由位置（横向比例）
    freeY: 0.62, // 不吸附时的自由位置（纵向比例）
    freePxX: null, // 不吸附时的精确像素 X
    freePxY: null, // 不吸附时的精确像素 Y
    lastVw: 0, // 上次记录位置时的视口宽度，用于判断能否复用像素值
    lastVh: 0, // 上次记录位置时的视口高度
    showRibbonIcon: false, // 是否在左侧栏显示番茄钟图标

    // 主题：见 settings.js 顶部的 VALID_POMO_THEME。
    // classic 保持默认：老用户升级后看到的和之前一样。
    theme: 'classic',
    // 自定义主题用的 CSS 原文（仅 theme === 'custom' 时注入）。
    // 存的是文本而非文件路径：用户改完立刻生效，也免去读文件的异步与失败处理。
    customCss: '',

    // 时长方案：profiles 是来源，下面三个字段是当前生效值的副本
    profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
    activeProfileId: 'study',
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,

    // 节奏
    longBreakInterval: 4, // 每完成几轮询问一次长休息
    resetAfterLongBreak: true, // 长休息结束后计数清零
    declineBehavior: 'afterInterval', // 拒绝长休息后再问的时机
    lastCycleChoice: null, // 上次选的轮数；null 表示不限
    autoStartNext: true, // 段结束后是否自动进入下一段；false 为手动模式
    pauseThreshold: 3, // 暂停达到几次后提示是否重开本轮

    // 正计时：专注段不限时，从 0 往上累加，只能手动结束（点「跳过」或结束会话）。
    // 默认关 —— 番茄钟的经典用法是倒计时，正计时只给需要统计实际用时的场景。
    // 只对专注段生效：休息段本来就是固定时长，正计时没有意义。
    countUp: false,
    // 正计时的软目标（分钟）：到点弹一次提醒，但不结束计时。0 表示不提醒。
    countUpTargetMin: 0,
    // 正计时的硬上限（分钟）：累加到这么多分钟就自动停表，默认 24 小时。
    // 忘了停的话它会一直跑下去，而超过一天的专注数据通常意味着「人已经不在了」，
    // 所以到点直接停、且**不计入统计**，由用户重新开始。填 0 表示不设上限。
    countUpMaxMin: 1440,
    // 正计时的间隔提醒（分钟）：每累加到这个倍数的分钟就提醒一次（20 → 20/40/60 各一次）。
    // 0 表示不提醒。与软目标的区别：软目标只提醒一次，这个是持续每隔一段提醒一次。
    countUpRemindEveryMin: 0,
    /*
     * 累计统计的数据源，由用户自选。默认 'off'（不统计、也不占任何存储）：
     *   'note'   解析会话记录笔记 —— 持久、换设备也在，但依赖写入格式不被改动
     *   'memory' 每次会话结束累加到 statsMemory —— 与笔记格式无关，但只在本机
     *   'custom' 解析 statsCustomPath 指定的笔记或文件夹 —— 位置由用户定，
     *            与番茄钟默认记录笔记解耦（换记录位置也不会读不到）
     *   'off'    不统计
     * 「不积累废弃数据」：memory 只存固定 4 个字段，不按日期堆条目。
     */
    statsSource: 'off',
    statsMemory: { totalFocusMs: 0, todayFocusMs: 0, todayDate: '', sessions: 0 },
    /*
     * 数据源＝「自定义位置」时的读取目标：一个 .md 笔记路径，或一个文件夹路径。
     * 留空则按 off 处理（不给静默的 0）。
     */
    statsCustomPath: '',
    /*
     * DataView 联动总开关（默认关）。
     * 开启后写会话记录时，按 dataviewFields 追加 DataView 内联字段，
     * 供用户自己的 dataview 查询读取。关着的时候一个字都不多写。
     * 只在写入路径上追加，不改动任何既有解析逻辑。
     */
    dataviewEnabled: false,
    /*
     * DataView 字段表：一行一个，格式 `字段名::{{VALUE:变量名}}`。
     * 默认只写专注时长 —— 记什么由用户自己加行，不替他决定。
     * 留空（用户手动清空）则一行都不写。
     */
    dataviewFields: '专注时长::{{VALUE:focusText}}',

    // 提醒
    notifyOnSegmentEnd: true, // 段结束时弹 Obsidian 通知
    // 结束类弹窗需要点几次「弹窗外部」才关闭。
    // 番茄结束时手常常还在点，点快了小结一闪而过就消失，所以默认要求 3 次。
    // 弹窗内的按钮和 Esc 是明确操作，不受这个次数限制。
    dismissClicks: 3,
    soundEnabled: false, // 是否播放提示音
    soundSource: 'builtin', // 'builtin' 内置合成音 | 'folder' 自定义文件夹
    soundFolder: '', // 自定义音频文件夹（库内路径，如 音效/提示音）

    // 斜杠命令：默认关闭，原因同时间戳模块（`/` 是公共资源，容易被同类插件接管）
    enableSlashCommand: false,
    slashTrigger: 'pomodoro',

    // 其他
    showHints: true, // 超范围时显示灰色建议文案
    lastSettingsTab: 'timestamp', // 设置页上次停留的标签
    /*
     * 设置页每个标签上次滚到的位置（px），重载插件后用于还原。
     * 只存 3 个数字、键名固定，不会随使用增长；
     * 迁移时按标签白名单清洗，旧标签残留会被清掉。
     */
    lastSettingsScroll: {},
  },

  /* ---- 模块四：日历 ---- */
  calendar: {
    /*
     * 日历网格里月份名 / 星期名的显示语言。
     * auto = 跟随上面的「显示语言」；也可单独指定（界面英文、日历想看中文月份）。
     * 只改这两个名字的显示，周起始日、日期数字、圆点、高亮、笔记命名一律不受影响。
     */
    lang: 'auto', // auto | zh | en

    // 补 window._bundledLocaleWeekSpec 默认值时用的周起始日
    weekStart: 'locale', // locale | sunday | monday | … | saturday
    /*
     * 修复 Calendar 设置页空白（只补不覆盖，绝不动 moment 全局 locale）。
     * 默认关：它往 window 上补一个全局变量，属于"没有出问题就别动"的兜底，
     * 由用户在 Calendar 设置页真的空白时自行打开（开关在 Bug 折叠区里）。
     */
    calendarFixEnabled: false,

    // time tools 日历视图：点年/月/日/周生成对应笔记。默认关
    ownCalendarEnabled: false,
    // 在 Calendar 插件视图上接管年/月/周点击。默认关（依赖其内部 DOM）
    enhanceCalendarEnabled: false,
    /*
     * 分流：日/周交回 Calendar 原生，只有月/年由本插件生成。默认关 = 全部接管。
     * 适用于日记/周记已由 Calendar 配置妥当、只想补上月记/年记的场景。
     * 依赖 enhanceCalendarEnabled（开启时会自动打开它）。
     */
    nativeDayWeek: false,
    /*
     * 两个日历能否同时开启。默认 false = 互斥：
     * 开启「在 Calendar 视图上接管点击」会自动关掉并收起 time tools 日历。
     * 两者都往工作区塞日历面板，同时开会出现两个日历各自为政的割裂状态，
     * 所以默认互斥；确有特殊需要才由用户显式打开双开。
     */
    allowBoth: false,

    /*
     * 「如果 Calendar 插件出现 Bug 请打开」—— 纯粹的折叠开关，不参与任何逻辑。
     * 默认 false（收起）：Bug 修复与兜底都收在里面，正常用户不必看到。
     * 折叠只影响设置页是否渲染这些项，里面的开关状态照常生效。
     */
    bugFoldOpen: false,

    /*
     * Templater 桥接：Calendar 原生新建的笔记补跑一次 Templater。
     * 默认关（功能类开关一律默认关）；日历区打开后按需自行开启。
     * 关掉三个日历开关、改用 Calendar 原生功能的人恰恰最需要这项兜底，
     * 因为 Calendar 用不了 Templater（见 calendar.js 注释）。
     */
    templaterBridge: false,

    // 是否显示日期下的字数圆点。默认开（日记写了多少字一眼可见，属基础反馈）
    dotsEnabled: true,

    // 每个圆点代表多少字（对齐 Calendar 的 Words per dot）。
    // <=0 或未配置时退化为「有笔记画 1 点」
    wordsPerDot: 250,

    /*
     * 格子固定尺寸模式：格子高度固定、不随面板拉伸填满，排布更紧凑。
     * 默认开 —— 面板拉高时格子不会跟着被拉成扁条（那是日历显示类 Bug）。
     * 关时为自适应（6 行均分可用高度，面板拉高填满）。
     */
    fixedCellSize: true,

    /*
     * 日期格显示农历（初一显示月名，其余显示农历日）。
     * 默认关 —— 格子里多一行字会让日历变挤，且不是所有人都需要。
     * 打开后**取代**圆点：格子下方空间有限，两样都放会挤成一团，
     * 「有笔记」改用农历旁边一个小点表示（不再按字数画多个点）。
     * 与圆点互斥，不是叠加，所以渲染时只看这一个开关。
     */
    lunarOnCalendar: false,
  },

  /* ---- 模块五：周期性笔记 ---- */
  notes: {
    // Templater 不可用时是否用内置模板顶替。默认关：
    // 静默降级会生成内容不符预期的笔记，不如明确提示
    fallbackToBuiltin: false,
    // altFormats：用户补充的文件名格式，仅用于识别已有笔记（高亮 / 打开），
    // 新建只认 format。留空则用内置常见格式兜底。
    daily: { folder: '', format: 'YYYY-MM-DD', template: '', altFormats: '' },
    weekly: { folder: '', format: 'gggg-[W]ww', template: '', altFormats: '' },
    monthly: { folder: '', format: 'YYYY-MM', template: '', altFormats: '' },
    yearly: { folder: '', format: 'YYYY', template: '', altFormats: '' },
  },

  /* ---- 模块三：会话记录 ---- */
  record: {
    enabled: true,  // 总开关；关闭时完全不记录，弹窗也不显示「记录」按钮
    autoRecord: false, // 是否自动记录：开启则番茄结束自动记，关闭则只在点「记录」时写
    mode: 'builtin', // 'builtin' 内置写入 | 'quickadd' 联动 QuickAdd | 'clipboard' 仅剪贴板
    defaultNoteName: '番茄记录', // 内置写入的笔记名
    folder: '', // 内置写入的文件夹，留空为库根目录
    template: DEFAULT_RECORD_TEMPLATE, // 内置写入 / 剪贴板模板
    quickAddChoice: '', // QuickAdd 选项名
    copyBeforeQuickAdd: true, // QuickAdd 执行前先把结果复制到剪贴板，便于手动粘贴
    strictChoiceName: false, // 严格校验选项名；列表可能不含嵌套选项，默认关闭
    fallbackToBuiltin: true, // 联动失败时回退内置写入；关闭则失败即放弃，默认开启
    // 记录精度：关闭（默认）按分钟记，秒位直接舍去；打开则记到秒。
    // 正计时与倒计时共用这一个开关 —— 精度是「你希望笔记里多细」，
    // 跟用哪种计时方式无关，分开两个开关只会让人纠结该开哪个。
    recordSeconds: false,
  },
};

/** 深拷贝默认值，避免多处共享同一份对象 */
function defaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

/**
 * 恢复某个配置分区的默认值。
 *
 * 只重置传入的 top-level key（timestamp / pomodoro / calendar / notes 等），
 * 其余分区原样保留 —— 用户点「恢复默认」时期望的是重来这一块，
 * 而不是把整个插件的设置都清空。
 *
 * @param {object} plugin
 * @param {string|string[]} keys 要重置的分区名
 * @returns {string[]} 实际被重置的分区名
 */
function resetSection(plugin, keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  const fresh = defaults();
  const done = [];
  list.forEach((k) => {
    if (!(k in fresh)) return;
    plugin.settings[k] = fresh[k];
    done.push(k);
  });
  return done;
}

/**
 * 在设置区末尾追加「恢复默认设置」按钮。
 * 带二次确认：误点一下就把整块配置清空，代价太大。
 */
function addResetButton(containerEl, plugin, keys, label) {
  const wrap = containerEl.createDiv({ cls: 'tt-reset-row' });
  wrap.createEl('span', {
    cls: 'tt-reset-hint',
    text: label
      ? i18nT('kea7cf0cd', '将「{0}」这一区的设置恢复为默认值，其余分区不受影响。', label)
      : '',
  });
  const btn = wrap.createEl('button', { cls: 'tt-reset-btn', text: i18nT('k3c470548', '恢复默认设置') });
  btn.onclick = async () => {
    const ok = await confirmReset(plugin, label || '本区');
    if (!ok) return;
    resetSection(plugin, keys);
    await plugin.saveSettings();
    plugin.redrawSettingsTab();
    new obsidian.Notice(`已恢复默认设置：${label || '本区'}`);
  };
}

/** 二次确认弹窗，避免误点清空 */
/**
 * 通用二次确认弹窗。
 *
 * 危险操作（恢复默认、关闭记录总开关）都走这里，避免每处重写一遍 Modal 样板。
 *
 * @param {object} plugin
 * @param {object} opt title / content / okText / cancelText / warning
 * @returns {Promise<boolean>} 只有点「确定」才为 true
 */
function confirmDialog(plugin, opt) {
  return new Promise((resolve) => {
    const modal = new obsidian.Modal(plugin.app);
    modal.setTitle(opt.title || i18nT('k43d586cd', '请确认'));
    modal.contentEl.addClass('tt-confirm-content');
    modal.setContent(opt.content || '');
    const row = modal.contentEl.createDiv({ cls: 'tt-reset-confirm' });
    new obsidian.ButtonComponent(row)
      .setButtonText(opt.cancelText || i18nT('k625fb26b', '取消'))
      .onClick(() => { modal.close(); resolve(false); });
    const ok = new obsidian.ButtonComponent(row)
      .setButtonText(opt.okText || i18nT('k38cf16f2', '确定'))
      .setCta();
    if (opt.warning) ok.setWarning();
    ok.onClick(() => { modal.close(); resolve(true); });
    modal.open();
  });
}

function confirmReset(plugin, label) {
  return confirmDialog(plugin, {
    title: '确认恢复默认设置',
    content:
      `确定要把「${label}」这一区的设置恢复为默认值吗？\n\n` +
      '此操作只影响该分区，其余分区保持不变。',
    okText: '恢复',
    warning: true,
  });
}

/** 数值兜底：非正数或非数字时回退到 fallback */
function num(value, fallback) {
  return typeof value === 'number' && isFinite(value) && value > 0 ? value : fallback;
}

/** 比例兜底：裁剪到 0~1 */
function ratio(value, fallback) {
  return typeof value === 'number' && isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

/** 生成方案 ID：用时间戳保证唯一 */
function makeProfileId() {
  return 'p' + Date.now().toString(36);
}

/**
 * 把方案时长同步为当前生效值。
 * 计时器只读 focusMin / shortBreakMin / longBreakMin，切换方案时调用本函数。
 */
function applyProfile(settings, profileId) {
  const p = settings.pomodoro;
  const profile =
    p.profiles.find((item) => item.id === profileId) ||
    p.profiles.find((item) => item.id === p.activeProfileId) ||
    p.profiles[0];
  if (!profile) return;
  p.activeProfileId = profile.id;
  p.focusMin = num(profile.focusMin, 25);
  p.shortBreakMin = num(profile.shortBreakMin, 5);
  p.longBreakMin = num(profile.longBreakMin, 15);
}

/**
 * 迁移旧配置。
 * 旧版 data.json 是扁平结构（format / insertNewline 直接躺在根节点），
 * 这里把它搬进 timestamp 分组，保证升级后用户自定义的时间格式不丢。
 */
/**
 * 只保留 defaults 里存在的键，其余一律丢弃。
 * 目的：防止废弃配置在 data.json 里无限堆积。
 * 键名以 defaults 为准；src 里的值必须类型匹配才采用，否则用默认值。
 */
function pickKnown(defaults, src) {
  const out = {};
  Object.keys(defaults).forEach((k) => {
    const dv = defaults[k];
    const sv = src && Object.prototype.hasOwnProperty.call(src, k) ? src[k] : undefined;
    if (sv === undefined) {
      out[k] = dv;
      return;
    }
    // 类型不一致（如旧版本存成了字符串）时退回默认值，避免脏数据扩散
    if (dv !== null && typeof dv !== typeof sv) {
      out[k] = dv;
      return;
    }
    if (Array.isArray(dv) !== Array.isArray(sv)) {
      out[k] = dv;
      return;
    }
    out[k] = sv;
  });
  return out;
}

/**
 * notes 的嵌套白名单合并。
 *
 * 顶层 pickKnown 只校验到 notes.daily 这一层，里面多出来的键会一直留在
 * data.json。四种笔记结构相同，这里逐层再过一遍，废弃键随版本自动清除。
 */
function pickKnownNotes(raw) {
  const out = pickKnown(DEFAULT_SETTINGS.notes, raw);
  ['daily', 'weekly', 'monthly', 'yearly'].forEach((k) => {
    if (out[k] && typeof out[k] === 'object') {
      out[k] = pickKnown(DEFAULT_SETTINGS.notes[k], out[k]);
    }
  });
  return out;
}

function migrateSettings(raw) {
  if (!raw || typeof raw !== 'object') return defaults();

  // 只有旧版才会同时满足：没有 timestamp 键 + 根节点有 format
  const isLegacy = raw.timestamp === undefined && raw.format !== undefined;

  /*
   * 来源版本：这份 data.json 是哪个结构版本写的。
   * 缺这个键（v1 之前的配置）一律按 0 处理 —— 将来若某个键改了语义，
   * 就在这里按 fromVersion 判断要不要搬值，搬完再把 next.schemaVersion 升上去。
   * 现在没有任何需要按版本分支的迁移，先把这个判断点留好。
   */
  const fromVersion = Number.isFinite(Number(raw.schemaVersion)) && Number(raw.schemaVersion) > 0
    ? Number(raw.schemaVersion)
    : 0;

  /*
   * 只用**白名单**合并，不整体 Object.assign。
   *
   * Object.assign 会把用户 data.json 里的**废弃键原样留下** ——
   * 每删一个设置项，那些旧数据就永久堆积在文件里，越积越多。
   * 白名单合并保证：DEFAULT_SETTINGS 里没有的键一律不进产物。
   */
  const next = {
    /*
     * 迁移后一律写成当前结构版本。
     * 老配置读进来时 fromVersion 是 0，搬完值就升到 1 —— 下次再读就不是老数据了。
     */
    schemaVersion: SETTINGS_SCHEMA_VERSION,

    /*
     * 界面语言是独立顶层项，不属于任何分区。
     * 必须在这里显式带上：下面的分区都是逐个 hand-pick 的，
     * 顶层键漏了就会被第二次迁移清掉（表现为重启后语言跳回中文）。
     */
    uiLang: normalizeLang(raw.uiLang),
    timestamp: pickKnown(DEFAULT_SETTINGS.timestamp, isLegacy ? raw : raw.timestamp),
    pomodoro: pickKnown(DEFAULT_SETTINGS.pomodoro, raw.pomodoro),
    record: pickKnown(DEFAULT_SETTINGS.record, raw.record),
    calendar: pickKnown(DEFAULT_SETTINGS.calendar, raw.calendar),
    notes: pickKnownNotes(raw.notes),
  };

  /*
   * 周起始日合并：旧版本在 timestamp.extensions.weekStart 也存了一份。
   * 现在统一到 calendar.weekStart —— 若日历那边还是默认值、而旧的这份被改过，
   * 就把旧值搬过去，别让用户的设置白丢。
   * （旧键已从 DEFAULT_SETTINGS 删除，pickKnown 会自动把它从 data.json 清掉）
   */
  const legacyWs = ((raw && raw.timestamp && raw.timestamp.extensions) || {}).weekStart;
  if (next.calendar.weekStart === 'locale' && ['monday', 'sunday'].indexOf(legacyWs) >= 0) {
    next.calendar.weekStart = legacyWs;
  }
  /*
   * 值域校验：pickKnown 只比对类型（string/string 就放行），
   * 挡不住 'xxx' 这类非法枚举值 —— 它会被原样存回 data.json 并扩散到周数计算。
   * 周起始日是枚举，必须按合法取值清洗。
   */
  if (VALID_WEEK_START.indexOf(next.calendar.weekStart) < 0) {
    next.calendar.weekStart = 'locale';
  }
  /* 日历语言同样是枚举，非法值（含被删档位或手改的脏值）一律回 auto */
  if (['auto', 'zh', 'en'].indexOf(next.calendar.lang) < 0) {
    next.calendar.lang = 'auto';
  }

  /*
   * 主题是枚举，同样要按合法取值清洗。
   * pickKnown 只比对类型（string/string 就放行），挡不住 'xxx' 这种脏值
   * —— 它会被原样存回 data.json，界面上表现为「主题下拉显示空白」。
   */
  if (VALID_POMO_THEME.indexOf(next.pomodoro.theme) < 0) {
    next.pomodoro.theme = DEFAULT_SETTINGS.pomodoro.theme;
  }
  /*
   * 界面形态同样是枚举：pickKnown 只比对类型（string/string 就放行），
   * 挡不住 'popuot' 这类拼写错误 —— 它会原样存回 data.json，
   * 界面上表现为「下拉框显示空白」，且独立窗口永远开不出来。
   */
  if (VALID_POMO_UI_MODE.indexOf(next.pomodoro.uiMode) < 0) {
    next.pomodoro.uiMode = DEFAULT_SETTINGS.pomodoro.uiMode;
  }
  // 尺寸必须是有限非负数：NaN 会被 JSON 序列化成 null，再读回来又是另一种脏数据
  ['popoutWidth', 'popoutHeight'].forEach((k) => {
    const v = Number(next.pomodoro[k]);
    next.pomodoro[k] = isFinite(v) && v > 0 ? Math.round(v) : 0;
  });
  // 位置同样是枚举：拼错的值会让窗口永远停在默认值上，界面上却看不出原因
  if (VALID_POPOUT_POS.indexOf(next.pomodoro.popoutPos) < 0) {
    next.pomodoro.popoutPos = DEFAULT_SETTINGS.pomodoro.popoutPos;
  }
  // 置顶 / 无边框必须是布尔：存成字符串 'false' 会被当成 true
  ['popoutAlwaysOnTop', 'popoutBorderless'].forEach((k) => {
    if (typeof next.pomodoro[k] !== 'boolean') {
      next.pomodoro[k] = DEFAULT_SETTINGS.pomodoro[k];
    }
  });
  /*
   * 桌面常驻：开关是布尔，尺寸是非负数，存档要么是可用的 bounds 要么是 null。
   * deskDockRestore 残缺时一律清成 null —— 拿残缺存档去还原会把主窗口设成怪尺寸，
   * 宁可让用户手动调一次，也不能把窗口搞坏。
   */
  ['deskDock', 'deskDockOnTop'].forEach((k) => {
    if (typeof next.pomodoro[k] !== 'boolean') {
      next.pomodoro[k] = DEFAULT_SETTINGS.pomodoro[k];
    }
  });
  ['deskDockWidth', 'deskDockHeight'].forEach((k) => {
    const v = Number(next.pomodoro[k]);
    next.pomodoro[k] = isFinite(v) && v > 0 ? Math.round(v) : 0;
  });
  if (VALID_POPOUT_POS.indexOf(next.pomodoro.deskDockPos) < 0) {
    next.pomodoro.deskDockPos = DEFAULT_SETTINGS.pomodoro.deskDockPos;
  }
  const rb = next.pomodoro.deskDockRestore;
  if (rb !== null && !(rb && Number(rb.width) > 0 && Number(rb.height) > 0)) {
    next.pomodoro.deskDockRestore = null;
  }
  // customCss 必须是字符串：老配置里若存成了别的类型，CSS 注入会抛异常
  if (typeof next.pomodoro.customCss !== 'string') {
    next.pomodoro.customCss = '';
  }
  /*
   * 滚动位置记忆：只保留当前存在的标签、只保留有限非负数。
   * 标签改名 / 被合并后，旧键会永远留在 data.json 里，这里统一清掉。
   */
  next.pomodoro.lastSettingsScroll = cleanScrollMemo(next.pomodoro.lastSettingsScroll);

  const p = next.pomodoro;
  const d = DEFAULT_SETTINGS.pomodoro;
  const d2 = DEFAULT_SETTINGS.record;

  // 方案列表：缺失或为空时补内置方案
  if (!Array.isArray(p.profiles) || p.profiles.length === 0) {
    p.profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
  } else {
    // 逐项清洗，去掉缺字段或非法时长的脏数据
    p.profiles = p.profiles
      .filter((item) => item && typeof item.name === 'string')
      .map((item) => ({
        id: item.id || makeProfileId(),
        name: item.name,
        focusMin: num(item.focusMin, 25),
        shortBreakMin: num(item.shortBreakMin, 5),
        longBreakMin: num(item.longBreakMin, 15),
      }));
  }

  // 关键数值兜底，防止旧数据里出现 undefined / 0 / NaN 导致计时异常
  p.focusMin = num(p.focusMin, d.focusMin);
  p.shortBreakMin = num(p.shortBreakMin, d.shortBreakMin);
  p.longBreakMin = num(p.longBreakMin, d.longBreakMin);
  p.longBreakInterval = num(p.longBreakInterval, d.longBreakInterval);
  p.pauseThreshold = num(p.pauseThreshold, d.pauseThreshold);
  p.countUp = typeof p.countUp === 'boolean' ? p.countUp : d.countUp;
  p.countUpTargetMin = Math.max(0, num(p.countUpTargetMin, d.countUpTargetMin));
  p.countUpMaxMin = Math.max(0, num(p.countUpMaxMin, d.countUpMaxMin));
  // 统计数据源必须是四者之一，写错就退回 off（不统计，也不存任何东西）
  p.statsSource = ['note', 'memory', 'custom', 'off'].indexOf(p.statsSource) >= 0 ? p.statsSource : 'off';
  p.statsCustomPath = typeof p.statsCustomPath === 'string' ? p.statsCustomPath : '';
  p.dataviewEnabled = typeof p.dataviewEnabled === 'boolean' ? p.dataviewEnabled : d.dataviewEnabled;
  // 老配置没有这个键（v3.14 之前联动是写死的一行），补齐默认＝保持原有行为
  p.dataviewFields = typeof p.dataviewFields === 'string' ? p.dataviewFields : d.dataviewFields;
  const sm = p.statsMemory && typeof p.statsMemory === 'object' ? p.statsMemory : {};
  p.statsMemory = {
    totalFocusMs: Math.max(0, num(sm.totalFocusMs, 0)),
    todayFocusMs: Math.max(0, num(sm.todayFocusMs, 0)),
    todayDate: typeof sm.todayDate === 'string' ? sm.todayDate : '',
    sessions: Math.max(0, num(sm.sessions, 0)),
  };
  p.countUpRemindEveryMin = Math.max(0, num(p.countUpRemindEveryMin, d.countUpRemindEveryMin));
  p.floatOffset = ratio(p.floatOffset, d.floatOffset);
  p.freeX = ratio(p.freeX, d.freeX);
  p.freeY = ratio(p.freeY, d.freeY);

  // 同步方案到生效值；旧版没有 profiles 时用已有字段反填默认方案
  if (p.profiles.every((item) => item.id !== p.activeProfileId)) {
    p.activeProfileId = p.profiles[0].id;
    applyProfile(next, p.activeProfileId);
  } else {
    applyProfile(next, p.activeProfileId);
  }

  // 时间转换扩展：补齐新增项、剔除废弃键，避免设置项越积越多。
  // 整体替换为新对象，避免改到 DEFAULT_SETTINGS 里的常量引用。
  const srcExt = (isLegacy ? {} : (raw && raw.timestamp && raw.timestamp.extensions)) || {};
  const dExt = DEFAULT_SETTINGS.timestamp.extensions;
  const cleanItems = defaultActionItems();
  ACTION_KEYS.forEach((key) => {
    if (srcExt.items && typeof srcExt.items[key] === 'boolean') {
      cleanItems[key] = srcExt.items[key];
    }
  });
  next.timestamp.extensions = {
    enabled: typeof srcExt.enabled === 'boolean' ? srcExt.enabled : dExt.enabled,
    items: cleanItems,
    dailyLinkFormat:
      typeof srcExt.dailyLinkFormat === 'string' && srcExt.dailyLinkFormat.trim()
        ? srcExt.dailyLinkFormat.trim()
        : dExt.dailyLinkFormat,
    appendOnAutoPick:
      typeof srcExt.appendOnAutoPick === 'boolean'
        ? srcExt.appendOnAutoPick
        : dExt.appendOnAutoPick,
    showRelativeBase:
      typeof srcExt.showRelativeBase === 'boolean'
        ? srcExt.showRelativeBase
        : dExt.showRelativeBase,
    separateDirections:
      typeof srcExt.separateDirections === 'boolean'
        ? srcExt.separateDirections
        : dExt.separateDirections,
    collapseItems:
      typeof srcExt.collapseItems === 'boolean'
        ? srcExt.collapseItems
        : dExt.collapseItems,
    preciseToSecond:
      typeof srcExt.preciseToSecond === 'boolean'
        ? srcExt.preciseToSecond
        : dExt.preciseToSecond,
    convertDaypartAlone:
      typeof srcExt.convertDaypartAlone === 'boolean'
        ? srcExt.convertDaypartAlone
        : dExt.convertDaypartAlone,
    /*
     * daypartHours 只保留认识的时间段键，且必须落在 0–23。
     * 这样即使用户改坏了或塞了废弃键，也不会让数据无限堆积。
     */
    daypartHours: J.cleanDaypartHours(srcExt.daypartHours),
    lunarEnabled:
      typeof srcExt.lunarEnabled === 'boolean' ? srcExt.lunarEnabled : dExt.lunarEnabled,
    lunarMarkAnywhere:
      typeof srcExt.lunarMarkAnywhere === 'boolean'
        ? srcExt.lunarMarkAnywhere
        : dExt.lunarMarkAnywhere,
    // 限制长度，避免误填超长内容让设置文件膨胀
    unifyFormat:
      typeof srcExt.unifyFormat === 'string' ? srcExt.unifyFormat.slice(0, 60) : '',
    undoHintEnabled:
      typeof srcExt.undoHintEnabled === 'boolean'
        ? srcExt.undoHintEnabled
        : dExt.undoHintEnabled,
    // 标识必须很短，否则会污染笔记正文

    lunarOnHao:
      typeof srcExt.lunarOnHao === 'boolean' ? srcExt.lunarOnHao : dExt.lunarOnHao,
    lunarOnCnUpper:
      typeof srcExt.lunarOnCnUpper === 'boolean' ? srcExt.lunarOnCnUpper : dExt.lunarOnCnUpper,
    /*
     * 时间口径三项 + 折叠开关。
     * 必须在这里逐个收进来（只写在 DEFAULT_SETTINGS 里不够）：next 是逐字段
     * 构造的，漏一个就会在**每次迁移时被丢掉**，
         * 结果是设置改完重启就没了（迁移不幂等）。
     * 值非法时退回默认，避免脏数据扩散。
     */
    weekendDay: J.cleanJudgement('weekendDay', srcExt.weekendDay),
    nextWeekdayMode: J.cleanJudgement('nextWeekdayMode', srcExt.nextWeekdayMode),
    dayOnlyMode: J.cleanJudgement('dayOnlyMode', srcExt.dayOnlyMode),
    collapseSemantics:
      typeof srcExt.collapseSemantics === 'boolean'
        ? srcExt.collapseSemantics
        : dExt.collapseSemantics,
    /*
     * 节日转换两项。同样是后加的字段，漏在这里会每次迁移被丢掉。
     * 自设节日文本限制长度，避免误贴长文让 data.json 膨胀。
     */
    festivalPrefix:
      typeof srcExt.festivalPrefix === 'boolean'
        ? srcExt.festivalPrefix
        : dExt.festivalPrefix,
    customFestivals:
      typeof srcExt.customFestivals === 'string'
        ? srcExt.customFestivals.slice(0, 4000)
        : '',
    /*
     * 自定义规则是纯文本，只做类型与长度收敛。
     * 不在这里解析——解析留给 timestamp.js，两边各算一份迟早不同步。
     */
    userRules:
      typeof srcExt.userRules === 'string'
        ? srcExt.userRules.slice(0, 20000)
        : '',
    userRulesForCalendar:
      typeof srcExt.userRulesForCalendar === 'boolean'
        ? srcExt.userRulesForCalendar
        : dExt.userRulesForCalendar,
    dateDiffWorkdays:
      typeof srcExt.dateDiffWorkdays === 'boolean'
        ? srcExt.dateDiffWorkdays
        : dExt.dateDiffWorkdays,
    // weekStart 已统一到 calendar.weekStart，此处不再生成（见上方合并逻辑）
  };

  // 记录模块：模式非法时回退内置写入，笔记名为空时补默认名
  const r = next.record;
  const validModes = ['builtin', 'quickadd', 'clipboard'];
  if (validModes.indexOf(r.mode) === -1) r.mode = d2.mode;
  if (!String(r.defaultNoteName || '').trim()) r.defaultNoteName = d2.defaultNoteName;
  if (!String(r.template || '').trim()) r.template = d2.template;

  /*
   * 按来源版本搬值的入口（目前为空 —— v1 还没有任何改过语义的键）。
   * 将来某个键换了语义时在这里补：
   *   if (fromVersion < 2) { next.xxx = 由旧值换算出的新值; }
   * 换算是单向的，只能靠版本号判断该不该做，不能靠「值是否等于默认值」猜。
   */
  if (fromVersion < SETTINGS_SCHEMA_VERSION) {
    // v1 → 当前：无需要搬运的键
  }

  return next;
}

/**
 * 设置页：只向 Obsidian 注册一个入口，顶部标签切换两个模块。
 * 附加区块在 SECTIONS 登记一行即可，渲染在对应标签内容最下方。
 */

/** 标签定义：key 与 settings.pomodoro.lastSettingsTab 对应 */
/*
 * 标签：label 是中文原文（同时充当兜底），labelKey 是稳定 key。
 * 之所以不在 label 里直接调 i18nT：TABS 是模块级常量，
 * 那时语言还没从设置里读出来，写死就等于永远停在中文字面值上。
 */
const TABS = [
  { key: 'timestamp', label: '时间戳', labelKey: 'tab.ts' },
  { key: 'pomodoro', label: '番茄钟', labelKey: 'tab.pomo' },
  { key: 'calendar', label: '日历', labelKey: 'tab.cal' },
  { key: 'lang', label: '界面语言', labelKey: 'tab.lang' },
];

/**
 * 滚动位置还原的重试时机（ms）。
 *
 * 不是拍脑袋定的：日历页的「立即应用」按钮和部分预览按 200ms 轮询重绘，
 * 会把刚设好的 scrollTop 冲掉。实测单次设置在 30ms 命中、80ms 被顶开、
 * 500ms 甚至归零，必须覆盖到 800ms 才稳定。
 */
const SCROLL_ATTEMPTS = [0, 30, 80, 150, 300, 500, 800];

/**
 * 滚动位置记忆的键：与 TABS 的 key 一一对应。
 * 值域只有这三项，迁移时按此清洗，避免旧标签残留。
 */
const SCROLL_KEYS = ['timestamp', 'pomodoro', 'calendar', 'lang'];

/**
 * 向上找真正可滚动的容器。
 *
 * Obsidian 的设置内容区是 containerEl 的某个祖先（不同版本层级不同，
 * 直接写死某一层会在版本升级后失效），这里按「能滚动」这个事实来找。
 */
function findScrollParent(el) {
  let node = el && el.parentElement;
  while (node) {
    if (node.scrollHeight - node.clientHeight > 4) return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * 清洗滚动位置记忆：只留已知标签、只留有限非负数。
 * 脏值（负数、NaN、字符串）一律丢弃，不让它扩散到恢复逻辑。
 */
function cleanScrollMemo(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  SCROLL_KEYS.forEach((k) => {
    const v = raw[k];
    if (typeof v !== 'number' || !isFinite(v) || v < 0) return;
    out[k] = Math.min(Math.round(v), 1000000);
  });
  return out;
}

/**
 * 附加区块清单。
 * 加新功能时在这里加一行，不必改动本文件其余部分。
 *
 * id     唯一标识，重复会在控制台告警并只渲染第一个
 * tab    挂到哪个标签
 * order  排序，小的在前
 * render 渲染函数，签名 (containerEl, plugin, ticker)
 */
const SECTIONS = [
  { id: 'record', tab: 'pomodoro', order: 200, render: renderRecord },
];

/**
 * 预览定时器：统一托管设置页里的实时预览，
 * 切换标签或关闭设置页时一次性清理，避免定时器泄漏。
 */
class PreviewTicker {
  constructor() {
    this.fns = [];
    this.id = null;
  }

  /** 注册一个刷新函数，立即执行一次并按秒轮询 */
  add(fn) {
    this.fns.push(fn);
    fn();
    if (this.id === null) {
      this.id = window.setInterval(() => this.fns.forEach((f) => f()), 1000);
    }
  }

  clear() {
    if (this.id !== null) {
      window.clearInterval(this.id);
      this.id = null;
    }
    this.fns = [];
  }
}

class TimeToolsSettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    /*
     * 设置页 id 必须等于插件 id（manifest.id），不能另起一个「更好看」的名字。
     *
     * Obsidian 是按「插件 id」定位设置页的：app.setting.openTabById(manifest.id)。
     * 这里曾写成 'time-tools-settings' —— 设置页在设置面板里照常显示、也能手动点开，
     * 但「已安装插件」的三点菜单少一个「设置」、插件详情页少一个「选项」按钮，
     * 因为按 manifest.id 查不到这个标签页，Obsidian 就当它「没有可配置选项」。
     *
     * id 缺失或重复仍会让两个插件的设置页互相覆盖（点开 A 却看到 B 的内容），
     * 所以保持显式赋值 —— 但值必须取自 manifest，不要手写字符串。
     */
    const manifestId = plugin && plugin.manifest && plugin.manifest.id;
    if (manifestId) this.id = manifestId;
    this.plugin = plugin;
    this.ticker = new PreviewTicker();
    this.activeTab = this.normalizeTab(plugin.settings.pomodoro.lastSettingsTab);
    // 滚动位置还原用到的句柄，统一在这里声明，避免散落成隐式全局
    this.restoreTimers = [];
    this.scrollBox = null;
    this.onScroll = null;
    this.saveTimer = null;
    this.intentBox = null;
    this.stopFn = null;
  }

  /** 标签 key 合法性兜底：旧配置里可能是已合并的 'record' */
  normalizeTab(key) {
    if (TABS.some((t) => t.key === key)) return key;
    if (key === 'record') return 'pomodoro'; // 记录已并入番茄钟页
    return 'timestamp';
  }

  /** 切换到指定标签并重绘；外部跳转时用 */
  focusTab(key) {
    this.saveScroll(); // 离开前记下当前标签的位置，切回来能还原
    this.activeTab = this.normalizeTab(key);
    this.plugin.settings.pomodoro.lastSettingsTab = this.activeTab;
    this.plugin.saveSettings();
    if (this.containerEl) this.display();
  }

  display() {
    /*
     * 整页兜底：设置页渲染抛错会让 Obsidian 的设置面板停在半渲染状态，
     * 连累后续打开的其他插件设置页也显示不全。
     * 宁可显示一行错误提示，也不能抛出去。
     */
    try {
      this.renderInto(this.containerEl);
      this.bindScrollSave();
      this.restoreScroll();
    } catch (e) {
      console.error('[Time Tools] 设置页渲染失败', e);
      this.containerEl.empty();
      this.containerEl.createDiv({
        cls: 'tt-settings-error',
        text: i18nT('k534ce29d', '设置页渲染失败：') + (e && e.message ? e.message : e) + '。其余设置不受影响。',
      });
    }
  }

  renderInto(containerEl) {
    this.ticker.clear();
    containerEl.empty();
    containerEl.addClass('tt-settings');

    // 顶部标签栏
    const bar = containerEl.createDiv({ cls: 'tt-tab-bar' });
    TABS.forEach((tab) => {
      const el = bar.createDiv({
        cls: 'tt-tab' + (tab.key === this.activeTab ? ' is-active' : ''),
        text: i18nT(tab.labelKey, tab.label),
      });
      el.onclick = () => this.focusTab(tab.key);
    });

    // 标签自有内容
    if (this.activeTab === 'timestamp') {
      renderTimestamp(containerEl, this.plugin, this.ticker);
    } else if (this.activeTab === 'calendar') {
      renderCalendar(containerEl, this.plugin);
    } else if (this.activeTab === 'lang') {
      /*
       * 语言不属于任何功能模块，整块由 i18n.js 自己渲染。
       *
       * 必须传一个**专属子容器**：renderLangTab 开头会 box.empty()，
       * 直接把 containerEl 传进去会把刚画好的标签栏一起清掉 ——
       * 表现就是进了「界面语言」页后，上面的标签全没了，再也切不回去
       * （v3.19 实测到的 bug）。子容器是它的，清空无害。
       */
      renderLangTab(containerEl.createDiv({ cls: 'tt-lang-pane' }), this.plugin);
    } else {
      renderPomodoro(containerEl, this.plugin, this.plugin.pomodoro);
    }

    // 附加区块：按 order 追加在最下方
    this.renderSections(containerEl, this.activeTab);
  }

  /**
   * 渲染挂在本标签下的附加区块。
   * 逐块 try/catch：某块出错只影响它自己，其余照常显示。
   * 用户侧看到一行简提示，完整堆栈走 console.error 供排查。
   */
  renderSections(containerEl, tab) {
    const list = SECTIONS.filter((s) => s.tab === tab).sort((a, b) => a.order - b.order);

    // id 重复通常是复制粘贴遗留，开发期就该发现
    const seen = new Set();
    list.forEach((sec) => {
      if (seen.has(sec.id)) console.error(`[Time Tools] 设置区块 id 重复：${sec.id}`);
      seen.add(sec.id);
    });

    Array.from(seen).forEach((id) => {
      const sec = list.find((s) => s.id === id);
      const wrap = containerEl.createDiv({ cls: 'tt-section' });
      wrap.setAttribute('data-section', id);
      try {
        sec.render(wrap, this.plugin, this.ticker);
      } catch (e) {
        console.error(`[Time Tools] 设置区块「${id}」渲染失败`, e);
        wrap.createDiv({
          cls: 'tt-section-error',
          text: i18nT('kcf156760', '「{0}」加载失败：{1}。其余设置不受影响，详细堆栈见开发者控制台。',
            id, e && e.message ? e.message : i18nT('k974e7484', '未知错误')),
        });
      }
    });
  }

  /* ---- 滚动位置：重载插件后还原到原来那一行 ---- */

  /**
   * 记录当前标签的滚动位置。
   * 只改内存里的 settings，落盘交给防抖（滚动时写盘太频繁）。
   */
  saveScroll() {
    const box = findScrollParent(this.containerEl);
    if (!box) return;
    const memo = cleanScrollMemo(this.plugin.settings.pomodoro.lastSettingsScroll);
    const top = Math.round(box.scrollTop);
    memo[this.activeTab] = top > 0 ? top : 0;
    this.plugin.settings.pomodoro.lastSettingsScroll = memo;
  }

  /**
   * 监听滚动容器，用户滚动后防抖落盘。
   * 重载插件时 Obsidian 不一定走 hide()，所以这里才是主要的落盘时机。
   */
  bindScrollSave() {
    const box = findScrollParent(this.containerEl);
    if (!box || box === this.scrollBox || !box.addEventListener) return;
    this.unbindScrollSave();
    this.scrollBox = box;
    this.onScroll = () => {
      this.saveScroll();
      if (this.saveTimer !== null) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null;
        if (this.plugin && typeof this.plugin.saveSettings === 'function') {
          this.plugin.saveSettings();
        }
      }, 400);
    };
    box.addEventListener('scroll', this.onScroll, { passive: true });
  }

  unbindScrollSave() {
    if (this.scrollBox && this.onScroll && this.scrollBox.removeEventListener) {
      this.scrollBox.removeEventListener('scroll', this.onScroll);
    }
    this.scrollBox = null;
    this.onScroll = null;
  }

  /**
   * 还原滚动位置。
   *
   * 单次设置会被后续重绘冲掉（日历页按钮按 200ms 轮询重绘），
   * 所以按 SCROLL_ATTEMPTS 多次尝试；一旦判定页面已不是我们的、或用户
   * 自己动了，就整体放弃——还原只是便利，绝不能反过来抢用户的操作。
   */
  restoreScroll() {
    this.stopRestore();
    const memo = cleanScrollMemo(this.plugin.settings.pomodoro.lastSettingsScroll);
    const target = memo[this.activeTab];
    if (!(target > 0)) return; // 没记过或在顶部，不动

    this.restoreTimers = SCROLL_ATTEMPTS.map((delay) =>
      setTimeout(() => {
        // 容器已脱离文档（用户切走 / 设置页被别的插件替换）：立即停
        if (!this.containerEl || this.containerEl.isConnected === false) {
          this.stopRestore();
          return;
        }
        const box = findScrollParent(this.containerEl);
        if (!box) return;
        const maxTop = box.scrollHeight - box.clientHeight;
        if (maxTop <= 0) return; // 还没渲染出可滚动内容，等下一帧
        // 页面比记忆位置矮（换了标签或内容变少）：不再折腾
        if (target > maxTop + 8) {
          this.stopRestore();
          return;
        }
        box.scrollTop = target;
      }, delay)
    );
    this.bindUserIntent();
  }

  /**
   * 用户一动滚轮 / 拖滚动条 / 按键，就放弃还原。
   * 用真实交互事件判定，比事后比对 scrollTop 可靠——后者分不清
   * 「用户滚的」和「被重绘冲掉的」。
   */
  bindUserIntent() {
    const box = this.scrollBox || findScrollParent(this.containerEl);
    if (!box || !box.addEventListener) return;
    this.intentBox = box;
    this.stopFn = () => this.stopRestore();
    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach((ev) => {
      box.addEventListener(ev, this.stopFn, { once: true, passive: true });
    });
  }

  /** 清掉全部定时器与监听，hide / 切标签 / 用户接管时都会走到这里 */
  stopRestore() {
    (this.restoreTimers || []).forEach((t) => clearTimeout(t));
    this.restoreTimers = [];
    if (this.intentBox && this.stopFn && this.intentBox.removeEventListener) {
      ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach((ev) =>
        this.intentBox.removeEventListener(ev, this.stopFn)
      );
    }
    this.intentBox = null;
    this.stopFn = null;
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  hide() {
    this.ticker.clear();
    this.saveScroll();
    this.stopRestore();
    this.unbindScrollSave();
    if (this.plugin && typeof this.plugin.saveSettings === 'function') {
      this.plugin.saveSettings();
    }
  }
}

// 延迟解引用：避免模块循环依赖时取不到函数
function renderTimestamp(containerEl, plugin, ticker) {
  require('./timestamp.js').renderTimestampSettings(containerEl, plugin, ticker);
}
function renderPomodoro(containerEl, plugin, ctrl) {
  require('./pomodoro.js').renderPomodoroSettings(containerEl, plugin, ctrl);
}
function renderCalendar(containerEl, plugin) {
  require('./calendar.js').renderCalendarSettings(containerEl, plugin);
}
function renderRecord(containerEl, plugin) {
  require('./pomodoro.js').renderRecordSettings(containerEl, plugin);
}


module.exports = {
  // 配置
  SETTINGS_SCHEMA_VERSION,
  DEFAULT_SETTINGS,
  VALID_WEEK_START,
  VALID_POMO_THEME,
  POMO_THEME_OPTIONS,
  DEFAULT_PROFILES,
  DEFAULT_RECORD_TEMPLATE,
  ACTION_DEFS,
  ACTION_GROUPS,
  ADVANCED_GROUP,
  LUNAR_KEYS,
  isLunarKey,
  ACTION_PAIRS,
  pairOf,
  isForwardOfPair,
  ACTION_KEYS,
  defaultActionItems,
  defaultExtensions,
  defaults,
  migrateSettings,
  resetSection,
  addResetButton,
  applyProfile,
  makeProfileId,
  confirmDialog,

  // 设置页
  TimeToolsSettingTab,
  TABS,
  SECTIONS,
  // 滚动位置还原（导出供测试）
  SCROLL_ATTEMPTS,
  SCROLL_KEYS,
  findScrollParent,
  cleanScrollMemo,
};

  };

  __modules['src/timestamp.js'] = function (module, exports, require) {
const obsidian = require('obsidian');
const { t: i18nT } = require('./i18n.js');
const { DEFAULT_SETTINGS, ACTION_DEFS, isLunarKey } = require('./settings.js');
const { actionText, judgeText, presetText, daypartText, miscText } = require('./i18n.js');
/*
 * 时段表与「没有共识」的口径（周末算周几、下周一指哪天…）都在这个文件里，
 * 解析层只管用，不自己再定义一份，避免两处口径打架。
 */
const judge = require('./timejudge.js');
const {
  TIME_OF_DAY,
  DAYPART_KEYS,
  defaultDaypartHours,
  cleanDaypartHours,
  readJudgement,
} = judge;

const VIEW_TYPE = 'time-tools-timestamp-view';

/** 内置预设格式，面板与设置页共用 */
const PRESETS = [
  { label: '日期 + 时分秒（默认）', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: '日期 + 时分', value: 'YYYY-MM-DD HH:mm' },
  { label: '仅时分秒', value: 'HH:mm:ss' },
  { label: '仅时分', value: 'HH:mm' },
  { label: '中文日期 + 时分', value: 'YYYY年M月D日 HH:mm' },
  { label: '斜杠日期 + 时分秒', value: 'YYYY/MM/DD HH:mm:ss' },
  { label: '带星期', value: 'YYYY-MM-DD ddd HH:mm' },
  { label: 'ISO 8601', value: 'YYYY-MM-DDTHH:mm:ssZ' },
];

/* ------------------------------------------------------------------ *
 * 固定数据表
 * ------------------------------------------------------------------ */

/**
 * 1900–2100 农历年信息表，索引 = 年份 - 1900。
 * 位布局（从高位到低位）：
 *   第 17–20 位：1 表示闰月 30 天，0 表示 29 天
 *   第 5–16 位 ：12 个月的大小月，1 = 30 天，0 = 29 天
 *   第 1–4 位  ：闰哪个月，0 表示当年无闰月
 */
/*
 * 农历算法已拆到 ./lunar.js（纯计算，零依赖）。
 * 这里用解构把裸函数名恢复成本地标识符 ——
 * 下方解析层几千行调用 solarToLunar / parseLunar / cnDay ... 一行都不用改。
 */
const {
  lunar,
  MIN_YEAR, MAX_YEAR, CN_NUM, LUNAR_INFO, SOLAR_TERMS, GAN, ZHI,
  leapMonth, leapDays, monthDays, yearDays,
  solarToLunar, lunarToSolar, parseLunar, cnYear, currentLunarYear,
  cnDay, cnMonth, formatLunar, ganZhi, zodiac, solarTerm, termDay,
  buildYearOffsets, yearOffset, msToJde, jdeToDate, sunLongitude,
  DAY_MAP, MONTH_MAP, matchFrom,
  parseCnMonth, parseArabicMonth, parseArabicDay, parseCnDay,
} = require('./lunar.js');

/**
 * 解析**阳历**的中文大写月日：五月十六日 → 5 月 16 日。
 *
 * 为什么必须有它：默认规则下「五月十六日」按阳历处理（带「日」后缀），
 * 但大写中文根本没法走原有的阳历解析（只认阿拉伯数字），
 * 结果就是**两边都不认、整条识别不出来** —— 实测确认。
 * 「5月16日」能转而「五月十六日」不能，就是缺这个。
 * 只在**不按农历处理**时才用；按农历时交给 lunar.parseLunar。
 */
function parseCnSolarDate(text, nowYear) {
  const raw = String(text ?? '').replace(/^\s+|\s+$/g, '');
  const m = CN_MD_RE.exec(raw);
  if (!m) return null;
  const month = parseCnMonth(m[0]);
  if (!month) return null;
  const dayPart = m[0].slice(month.len);
  const day = matchFrom(dayPart.replace(/[日号]$/, ''), DAY_MAP);
  if (!day) return null;
  const year = nowYear || new Date().getFullYear();
  return safeDate(year, month.value, day.value);
}

/*
 * 明确的历法标记：农历 / 阴历 / 阳历 / 公历。
 * 带这种标记的日期**意图是明确的**——用户已经说清楚了是哪套历法，
 * 不该再靠「中文大写还是阿拉伯数字」去猜。
 */
const LUNAR_MARK = ['农历', '阴历', '旧历', '夏历'];
const SOLAR_MARK = ['阳历', '公历', '新历', '西历'];
const ALL_MARK = LUNAR_MARK.concat(SOLAR_MARK);

/**
 * 剥出历法标记，返回 { mark: 'lunar'|'solar'|null, rest, atTail }。
 *
 * 默认只认**前缀**；标记在尾部（`2026年八月初九 农历`）需要
 * lunarMarkAnywhere 开关开启才认 —— 否则「八月十九 农历」
 * 这类写法会跟普通句子混淆。
 */
function stripCalendarMark(text, settings) {
  const raw = String(text ?? '').trim();
  const ext = extOf(settings);
  const anywhere = !!(ext && ext.lunarMarkAnywhere === true);

  // 前缀
  for (const w of LUNAR_MARK) {
    if (raw.startsWith(w)) return { mark: 'lunar', rest: raw.slice(w.length).trim(), atTail: false };
  }
  for (const w of SOLAR_MARK) {
    if (raw.startsWith(w)) return { mark: 'solar', rest: raw.slice(w.length).trim(), atTail: false };
  }

  // 尾部（需开关）
  if (anywhere) {
    for (const w of LUNAR_MARK) {
      if (raw.endsWith(w)) return { mark: 'lunar', rest: raw.slice(0, -w.length).trim(), atTail: true };
    }
    for (const w of SOLAR_MARK) {
      if (raw.endsWith(w)) return { mark: 'solar', rest: raw.slice(0, -w.length).trim(), atTail: true };
    }
  }
  return { mark: null, rest: raw, atTail: false };
}

/** 文本是否含明确的历法标记（任意位置） */
function containsCalendarMark(text) {
  const raw = String(text ?? '');
  return ALL_MARK.some((w) => raw.indexOf(w) >= 0);
}

/** 文本是否以历法标记开头 */
/** 文本是否为「带号」写法：5月16号 / 五月十六号 */
function hasHaoSuffix(text) {
  return /[号日]\s*$/.test(String(text ?? '').trim());
}

/*
 * 中文大写的「月 + 日」，捕获末尾后缀。
 * 后缀决定了在默认（关）状态下算不算农历：
 *   五月十六   → 无后缀   → 农历
 *   五月十六号 → 后缀「号」 → 农历
 *   五月十六日 → 后缀「日」 → 默认算阳历（开启大写即农历后才算农历）
 */
const CN_MD_RE = new RegExp(
  '[正一二三四五六七八九十冬腊]月' +
  '[初十廿三一二三四五六七八九十]+' +
  '(号|日)?$'
);

/** 取中文大写月日写法的末尾后缀；不是该写法返回 null */
function cnMonthDaySuffix(text) {
  const s = String(text ?? '').replace(/^农历/, '').replace(/\s+/g, '');
  const m = CN_MD_RE.exec(s);
  return m ? (m[1] || '') : null;
}

/**
 * 判断一段月日文本是否应默认为农历。
 *
 * 默认规则（未开开关）：
 *   中文大写（五月十六号）→ 农历
 *   阿拉伯数字（5月16号）→ 阳历
 * 开启 lunarOnHao 后：只要带「号 / 日」后缀，一律按农历处理。
 */
function shouldTreatAsLunar(text, settings) {
  const raw = String(text ?? '');
  /*
   * 明确的历法标记**优先级最高**：用户已经写清了「农历 / 阳历」，
   * 就别再用「大写还是阿拉伯」去猜了。
   */
  const mk = stripCalendarMark(raw, settings);
  if (mk.mark === 'lunar') return true;
  if (mk.mark === 'solar') return false;

  /*
   * 文本里**有**标记但位置不被允许（如标记在尾部而开关关闭）→ 不转换。
   * 不拦的话「2026年八月初九 农历」会被当无标记的大写月日转掉，
   * 等于绕过了这个开关（实测过）。
   */
  if (containsCalendarMark(raw)) return false;

  const ext = extOf(settings);
  const lunarOnHao = !!(ext && ext.lunarOnHao === true);
  const lunarOnCnUpper = !!(ext && ext.lunarOnCnUpper === true);

  // ---- 中文大写月日：五月十六 / 五月十六号 / 五月十六日 ----
  const suffix = cnMonthDaySuffix(raw);
  if (suffix !== null) {
    /*
     * 默认（关）：只认无后缀与「号」——「五月十六」「五月十六号」。
     * 「五月十六日」的「日」更像阳历习惯，默认按阳历处理。
     * 开启后：大写中文书写一律按农历，包括带「日」的。
     */
    if (suffix === '日') return lunarOnCnUpper;
    return true;
  }

  // ---- 阿拉伯数字：5月16号 ----
  if (lunarOnHao && hasHaoSuffix(raw)) return true;
  return false;
}

/** 解析农历日，返回 { value, len } */

/** 侧边栏面板：实时时钟 + 插入按钮 + 预设切换 */
class TimestampView extends obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.intervalId = null;
  }

  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return '时间戳';
  }
  getIcon() {
    return 'clock';
  }

  async onOpen() {
    this.render();
  }

  async onClose() {
    this.clearTicker();
  }

  clearTicker() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  render() {
    const container = this.contentEl;
    container.empty();
    container.addClass('tsi-container');

    // 实时预览：仅在格式含秒时每秒刷新，避免无谓重绘
    const preview = container.createDiv({ cls: 'tsi-preview' });
    const updatePreview = () => preview.setText(this.plugin.formatNow());
    updatePreview();
    this.clearTicker();
    if (/s/.test(this.plugin.settings.timestamp.format)) {
      this.intervalId = window.setInterval(updatePreview, 1000);
      this.registerInterval(this.intervalId);
    }

    container.createDiv({ cls: 'tsi-hint', text: i18nT('kf71c4ba4', '当前时间戳') });

    const btn = container.createEl('button', { cls: 'tsi-insert-btn', text: i18nT('kb40aaf3e', '插入当前时间') });
    btn.onclick = () => this.plugin.insertTimestamp();

    // 预设列表：点一下即切换格式
    const section = container.createDiv({ cls: 'tsi-section' });
    section.createDiv({ cls: 'tsi-section-title', text: i18nT('kd53b1b0a', '快捷格式') });
    PRESETS.forEach((preset) => {
      const row = section.createDiv({ cls: 'tsi-preset-row' });
      if (this.plugin.settings.timestamp.format === preset.value) row.addClass('is-active');
      row.createEl('span', { cls: 'tsi-preset-label', text: presetText(preset.value, preset.label) });
      row.createEl('code', {
        cls: 'tsi-preset-value',
        text: this.plugin.formatWith(preset.value),
      });
      row.onclick = async () => {
        this.plugin.settings.timestamp.format = preset.value;
        await this.plugin.saveSettings();
      };
    });

    container
      .createDiv({ cls: 'tsi-tip' })
      .setText(i18nT('k8debd4e8', '更多格式可在设置中自定义（moment 语法）。'));
  }
}

/**
 * 斜杠命令：输入 /now（或 /ts、/time、自定义词）弹出建议。
 * 这是手机端最快的入口，拇指不用离开键盘。
 */
class TimestampSuggest extends obsidian.EditorSuggest {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onTrigger(cursor, editor) {
    if (!editor) return null;
    // 总开关优先：关掉后斜杠命令必须失效（以前只判了子开关，关总开关照样触发）
    if (!extEnabled(this.plugin)) return null;
    const s = this.plugin.settings.timestamp;
    if (!s.enableSlashCommand) return null;

    const triggers = ['/now', '/ts', '/time'];
    const custom = String(s.slashTrigger || '').trim();
    if (custom && !custom.startsWith('/')) triggers.push('/' + custom);

    // 只检查当前行光标前的文本，避免跨行误触发
    const textBefore = editor.getLine(cursor.line).slice(0, cursor.ch).toLowerCase();
    const matched = triggers.find((t) => textBefore.endsWith(t));
    if (!matched) return null;

    // start 回退触发词长度，替换时才能把 /now 一起吃掉
    return {
      start: { line: cursor.line, ch: cursor.ch - matched.length },
      end: cursor,
      query: matched,
    };
  }

  getSuggestions() {
    const primary = this.plugin.formatNow();
    const timeOnly = this.plugin.formatWith('HH:mm:ss');
    const dateOnly = this.plugin.formatWith('YYYY-MM-DD');

    // 去重：自定义格式可能就是 HH:mm，避免出现两个一样的可选项
    const list = [{ value: primary, hint: '默认格式', key: 'tsDefault' }];
    if (timeOnly !== primary) list.push({ value: timeOnly, hint: '仅时间', key: 'tsTime' });
    if (dateOnly !== primary && dateOnly !== timeOnly) {
      list.push({ value: dateOnly, hint: '仅日期', key: 'tsDate' });
    }
    return list;
  }

  renderSuggestion(item, el) {
    el.addClass('tsi-suggest-item');
    el.createDiv({ cls: 'tsi-suggest-value', text: item.value });
    el.createDiv({ cls: 'tsi-suggest-hint', text: miscText('tsSlash', item.key, item.hint) });
  }

  selectSuggestion(item) {
    if (!this.context) return;
    const { editor, start, end } = this.context;
    const suffix = this.plugin.settings.timestamp.insertNewline ? '\n' : '';
    editor.replaceRange(item.value + suffix, start, end);
  }
}

/**
 * 渲染时间戳设置内容。
 * 由外层统一设置页调用，预览定时器交由 ticker 统一管理生命周期。
 */
/**
 * 节日转换设置：自设节日 + 输出形态开关。
 * 单独一个函数，避免把 renderTimestampSettings 撑得更长。
 */
function renderFestivalSettings(containerEl, plugin) {
  const ext = plugin.settings.timestamp.extensions;

  containerEl.createEl('h3', { text: i18nT('kf0f153f2', '节日转换') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k924824c5', '节日名带日期'))
    .setDesc(i18nT('k3903e1d6', '打开（默认）：正向与逆向都输出「国庆节 2026-10-01」这种「节日名 + 日期」。')
     + i18nT('k57aa8108', '关闭：正向只给节日名，逆向只给日期。'))
    .addToggle((toggle) =>
      toggle.setValue(ext.festivalPrefix !== false).onChange(async (value) => {
        ext.festivalPrefix = value;
        await plugin.saveSettings();
      })
    );

  /*
   * 自设节日：多行文本。
   * 用 addTextArea —— 一行一条，输入框要能容纳十几行。
   * onChange 里**不要**重绘设置页：整个设置页重建会让输入框失去焦点，
   * 每敲一个字符就失焦（只能删一个再填一个），必须改成只刷新其他视图。
   */
  const customSetting = new obsidian.Setting(containerEl)
    .setName(i18nT('kabe37104', '自设节日'))
    .setDesc(i18nT('kfb6e20ce', '一行一条，让「妈妈生日」这类日子也能正反转换。写法见下方说明。'));
  customSetting.addTextArea((area) =>
    area
      .setPlaceholder(i18nT('k72acd8fa', '妈妈生日 = 10-15\n母亲节 = 5月第2个周日'))
      .setValue(String(ext.customFestivals ?? ''))
      .onChange(async (value) => {
        ext.customFestivals = String(value ?? '');
        await plugin.saveSettings();
        renderFestivalHelp(helpBox, plugin);
      })
  );

  const helpBox = containerEl.createDiv({ cls: 'tsi-festival-help' });
  renderFestivalHelp(helpBox, plugin);
}

/** 自设节日下方实时显示「已识别 N 条」与格式说明 */
function renderFestivalHelp(box, plugin) {
  const ext = plugin.settings.timestamp.extensions;
  const list = customFestivalList(plugin.settings);
  /* 示例整块不译（解析器只认中文写法）；节日名是用户数据，也不译 */
  const lines = [
    i18nT('fest.help.head', judge.FEST_HEAD),
    judge.FEST_EXAMPLES,
    '',
    i18nT('fest.help.count', `当前已识别 ${list.length} 条。`, list.length),
  ];
  if (list.length) {
    lines.push(i18nT('fest.help.list', '已识别：') + list.map((it) => it.name).join('、'));
  }
  box.setText(lines.join('\n'));
  // 让换行在界面上生效（纯文本节点默认折叠空白）
  box.style.whiteSpace = 'pre-wrap';
  box.style.fontSize = '12px';
}

function renderTimestampSettings(containerEl, plugin, ticker) {
  const s = plugin.settings.timestamp;
  containerEl.createEl('h2', { text: i18nT('ke4e64bcf', '时间戳插入器') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k2ca9949e', '时间格式'))
    .setDesc(i18nT('k635ea6c0', 'moment 语法，下方实时预览。'))
    .addText((text) =>
      text
        .setPlaceholder('YYYY-MM-DD HH:mm:ss')
        .setValue(s.format)
        .onChange(async (value) => {
          s.format = value.trim() || DEFAULT_SETTINGS.timestamp.format;
          await plugin.saveSettings();
        })
    );

  const previewBox = containerEl.createDiv({ cls: 'tsi-settings-preview' });
  ticker.add(() => previewBox.setText(plugin.formatNow()));

  new obsidian.Setting(containerEl)
    .setName(i18nT('k02c2adcd', '精确到秒'))
    .setDesc(i18nT('k43f681ca', '关闭（默认）：所有时间输出只到分钟，格式串里的秒也会被去掉。开启：保留秒。'))
    .addToggle((toggle) =>
      toggle.setValue(s.extensions.preciseToSecond === true).onChange(async (value) => {
        s.extensions.preciseToSecond = value;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k45e78490', '插入后自动换行'))
    .setDesc(i18nT('k80d351e7', '插入时间戳时额外补一个换行，方便连续记流水账。'))
    .addToggle((toggle) =>
      toggle.setValue(s.insertNewline).onChange(async (value) => {
        s.insertNewline = value;
        await plugin.saveSettings();
      })
    );

  containerEl.createEl('h3', { text: i18nT('k8bb0a1ed', '手机端 / 斜杠命令') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1ef6fa49', '启用斜杠命令'))
    .setDesc(i18nT('k78ceb0e9', '输入 /now（或 /ts、/time）弹出建议，点一下即插入。'))
    .addToggle((toggle) =>
      toggle.setValue(s.enableSlashCommand).onChange(async (value) => {
        s.enableSlashCommand = value;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k777cf6f3', '自定义触发词'))
    .setDesc(i18nT('k6589ba41', '额外增加一个触发词，不用带斜杠。例如填 date，则 /date 也能触发。'))
    .addText((text) =>
      text
        .setPlaceholder(i18nT('kca5eb00f', '例如：ts'))
        .setValue(s.slashTrigger)
        .onChange(async (value) => {
          s.slashTrigger = value.trim().replace(/^\//, '');
          await plugin.saveSettings();
        })
    );

  containerEl.createDiv({ cls: 'tsi-mobile-tip' }).setText(
    i18nT(
      'ka775650d',
      '手机端一键入口：编辑笔记时点键盘上方工具栏的扳手 → 添加命令 → 搜索「时间戳」→ 添加。'
    ) +
      i18nT(
        'k7472c7a5',
        '也可在 设置 → 选项 → 工具栏 → 快捷命令 里把它设为顶部下拉手势。'
      )
  );

  containerEl.createEl('h3', { text: i18nT('k3d03d01a', '预设格式') });
  const presetGrid = containerEl.createDiv({ cls: 'tsi-preset-grid' });
  PRESETS.forEach((preset) => {
    const btn = presetGrid.createEl('button', { cls: 'tsi-preset-btn' });
    btn.setText(presetText(preset.value, preset.label));
    btn.createEl('code', { text: plugin.formatWith(preset.value) });
    btn.onclick = async () => {
      s.format = preset.value;
      await plugin.saveSettings();
      plugin.redrawSettingsTab(); // 重绘以刷新预览与高亮
    };
  });

  // 扩展功能：时间文本转换（总开关 + 逐项开关）
  renderTimeActionSettings(containerEl, plugin);

  renderFestivalSettings(containerEl, plugin);

  containerEl.createEl('h3', { text: i18nT('k8afddc3f', '常用语法') });
  const table = containerEl.createEl('table', { cls: 'tsi-help-table' });
  const rows = [
    ['YYYY', '四位年份，如 2026'],
    ['MM / M', '月份，补零 / 不补零'],
    ['DD / D', '日期，补零 / 不补零'],
    ['dddd / ddd', '星期，如 星期五 / 周五'],
    ['HH / H', '24 小时制小时'],
    ['hh / h', '12 小时制小时'],
    ['mm / m', '分钟'],
    ['ss / s', '秒'],
    ['A / a', 'AM/PM'],
    ['Z / ZZ', '时区，如 +08:00'],
  ];
  rows.forEach(([token, desc]) => {
    const tr = table.createEl('tr');
    tr.createEl('td').createEl('code', { text: token });
    tr.createEl('td', { text: miscText('fmtToken', token, desc) });
  });

  // 区末统一提供恢复默认入口
  const { addResetButton } = require('./settings.js');
  addResetButton(containerEl, plugin, 'timestamp', '时间戳');
}

/*
 * 时间转换总开关的唯一判定源。
 *
 * 以前各处直接写 ext.enabled，四个入口漏判了（斜杠命令、撤回标记、
 * 撤回状态栏、撤回命令），表现为「关了总开关功能照常工作」。
 * 现在所有入口一律走这里，加新入口时也不会再漏。
 * 用 !== false 而不是真值判断：配置缺失/损坏时按默认（开）处理，
 * 不会把一个旧配置误判成关闭。
 *
 * 注意「缺失」指 extensions 整个对象不存在或 enabled 字段缺失 ——
 * 这两种情况都按默认（开）走，只有显式写成 false 才算关闭。
 * （曾写成 `!!ext && ...`：ext 缺失时返回 false，与上面这句注释相反，
 *   且让不带 settings 的测试环境一律判成关闭。）
 */
function extEnabled(plugin) {
  const ts = plugin && plugin.settings && plugin.settings.timestamp;
  const ext = ts ? ts.extensions : null;
  if (!ext || typeof ext !== 'object') return true; // 缺失 → 默认开
  return ext.enabled !== false;
}

/** 重新渲染所有已打开的时间戳面板 */
function refreshTimestampViews(plugin) {
  plugin.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
    if (leaf.view instanceof TimestampView) leaf.view.render();
  });
}

/** 注册时间戳模块：图标、视图、命令、斜杠建议 */
function registerTimestamp(plugin) {
  /*
   * CM6 编辑器扩展必须在 load 阶段注册，否则装饰字段不存在、
   * view.state.field() 会抛错，标记挂不上。
   * 环境里没有 CM6 时 buildCm6Extension 返回 null，跳过即可（不影响其他功能）。
   */
  /*
   * 编辑器扩展是**全局**的：它挂到所有编辑器实例上。
   * 排查冲突时看控制台输出即可，不必改动功能
   * （曾有过一个全局注册开关和一个诊断命令，均已移除）。
   */
  const cm6Ext = buildCm6Extension();
  if (cm6Ext && typeof plugin.registerEditorExtension === 'function') {
    plugin.registerEditorExtension(cm6Ext);
  } else if (!cm6Ext) {
    setUndoFail('CM6 扩展未构建（模块不可用或构建抛错）');
  }

  /*
   * 撤回图标能不能显示全看这里（打包器若没把 @codemirror/* 透传给宿主运行时，
   * cm6Available 会是 false —— 这正是图标不显示的根因，必须可观测、可测试）。
   */
  plugin.__ttDiag = {
    cm6Available: !!loadCm6(),
    cm6Field: !!CM6.field,
    failReason: lastUndoFailReason,
    unresolvable: unresolvableUndoCount(),
  };

  // 状态栏指示器：不依赖装饰，是撤回的可靠可见入口（必须在这里调用！）
  initUndoIndicator(plugin);
  // 切换笔记要刷新（记录按笔记分别记）
  try {
    plugin.registerEvent(
      plugin.app.workspace.on('file-open', () => refreshUndoIndicator(plugin))
    );
    plugin.registerEvent(
      plugin.app.workspace.on('active-leaf-change', () => refreshUndoIndicator(plugin))
    );
  } catch (e) { /* 老版本无该事件 */ }

  plugin.addRibbonIcon('clock', '插入当前时间戳', () => plugin.insertTimestamp());

  plugin.registerView(VIEW_TYPE, (leaf) => new TimestampView(leaf, plugin));

  /*
   * 这两个命令曾经漏接总开关门控（被 _test/entryguard.js 扫出来）：
   * 关掉「启用时间戳」后，它们仍然出现在命令面板里且照常执行。
   * 改用 checkCallback / editorCheckCallback：不满足条件时返回 false，
   * 命令直接从面板隐藏 —— 「点了没反应」比「不显示」更难排查。
   */
  plugin.addCommand({
    id: 'time-tools-timestamp-open-panel',
    name: '时间戳：打开时间戳面板',
    checkCallback: (checking) => {
      if (!extEnabled(plugin)) return false;
      if (!checking) plugin.activateTimestampView();
      return true;
    },
  });

  plugin.addCommand({
    id: 'time-tools-timestamp-insert',
    name: '时间戳：在当前光标处插入时间戳',
    editorCheckCallback: (checking, editor) => {
      if (!extEnabled(plugin)) return false;
      if (checking) return true;
      plugin.insertIntoEditor(editor);
      return true;
    },
  });

  plugin.registerEditorSuggest(new TimestampSuggest(plugin));

  // 扩展：时间文本转换
  registerTimeActions(plugin);
}

/* ------------------------------------------------------------------ *
 * 日期解析：自己实现，不依赖 moment 的宽松解析
 * 只认几种常见写法，认不出就返回 null，由调用方提示
 * ------------------------------------------------------------------ */

/*
 * 分隔符统一用一个字符类，而不是固定组合。
 * 用户手写的格式很随意：2026 09-19、2026/09 19、2026_09_19、20260919……
 * 逐个枚举组合会漏，改成「任意分隔符 + 可选」后这些都能覆盖。
 */

/** 数字之间允许的分隔符：连字符 斜杠 点 下划线 空格 以及中文年月日 */
const SEP = /[\s\-/._]*/.source;

/** 完整日期：4 位年 + 分隔 + 月 + 分隔 + 日，可带时间 */
const DATE_RE = new RegExp(
  '^(\\d{4})' + SEP + '(?:年)?' + SEP +
  '(\\d{1,2})' + SEP + '(?:月)?' + SEP +
  // 末尾既可能是「日」也可能是「号」（5月16号 是很常见的写法）
  '(\\d{1,2})' + SEP + '(?:日|号)?' +
  '(?:[\\sT]+(\\d{1,2})[:：](\\d{2})(?:[:：](\\d{2}))?)?$'
);

/** 紧凑纯数字：20260919 */
const COMPACT_RE = /^(\d{4})(\d{2})(\d{2})$/;

/** 只有月日：09-17 / 9/17 / 9月17日 / 09 17，可带时间 */
/*
 * 分隔符必须**至少出现一次**（+ 而不是 *）。
 * 用 * 时「17号」会被拆成 1 和 7 两个数字中间零分隔，
 * 于是算出「1 月 7 日」——不是识别不了，而是静默给出错误日期，
 * 比不识别更糟。改成 + 后「17号」不再落到这里，交给下面的 DAY_ONLY_RE。
 */
const MD_RE = new RegExp(
  '^(\\d{1,2})[\\s\-/._月]+(\\d{1,2})\\s*(?:日|号)?' +
  '(?:[\\sT]+(\\d{1,2})[:：](\\d{2})(?:[:：](\\d{2}))?)?$'
);

/** 只有日：3号 / 17号 / 十七号 —— 月由 dayOnlyMode 决定 */
const DAY_ONLY_RE =
  /^(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*(?:日|号)$/;

const TIME_ONLY_RE = /^(\d{1,2})[:：](\d{2})(?:[:：](\d{2}))?$/;
const UNIX_RE = /^\d{10}$|^\d{13}$/;
/** 日记链接：[[2026-09-19]] */
const LINK_RE = /^\[\[\s*([^\[\]]+?)\s*\]\]$/;
/** 星期后缀：周六 / 星期六 / 星期日 / Monday */
const WEEKDAY_SUFFIX_RE =
  /[\s,，、]*(?:周|星期|礼拜)[一二三四五六日天]$|[\s,，、]*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*$/i;
/** 相对时间：3天前 / 2小时后 / 1.5小时后 */
/*
 * 相对时间。
 * 方向词除了「前 / 后」，还要覆盖「以前 / 以后 / 之前 / 之后」——
 * 「7天以后」是很常见的说法，只认单字会大面积漏掉。
 */
/*
 * 中文数字 ⇄ 阿拉伯数字。
 *
 * 用规则解析而不是穷举表：中文数字组合无穷（二十一、一百零五…），
 * 表会无限膨胀，规则是固定几行。这也符合「数据不无限增长」的约束。
 */

/*
 * 时段名（早上 / 中午 / 下午 …）。
 *
 * 默认不单独转换（方案丙）：「早上」到底指 8 点还是 9 点没有共识，
 * 强行给一个值就是编造。只有当它后面跟了具体时刻（早上8点）时才用来定 12/24 制。
 *
 * 用户可在高级设置里开启「时段名单独转换」，那时用下面的默认小时值，
 * 且该值本身也可在设置里改 —— 但默认关闭。
 */
/*
 * 时段表已移到 timejudge.js（见文件顶部 require）。
 * 那里同时定义了时段小时的可改口径与默认小时值。
 */

/** 时段键顺序（设置页渲染用） */
/** 从文本开头剥出时段词；返回 { key, rest } 或 null */
function splitDaypart(text) {
  const s = String(text ?? '').trim();
  for (const t of TIME_OF_DAY) {
    if (t.re.test(s)) return { key: t.key, rest: s.replace(t.re, '').trim() };
  }
  return null;
}

/**
 * 从**尾部**剥出时段词。
 * splitDaypart 用 ^ 锚定只能剥开头，但复合表达里时段词常在中间
 * （「明年12月份的第49周周三**下午**2点」剥掉时刻后剩「…周三下午」），
 * 必须按尾部匹配，否则整条解析失败。
 */
/*
 * 时段词的**全部字面写法**：key 与 re 里的别名都要收。
 * 只收 key 时「周五上午10点」剥不掉「上午」，整条判失败
 * （「上午」是「早上」的别名，不在 key 里）。
 * 不用 alias —— 那里有单字（午/早/晚），有歧义，会误命中。
 */
const DAYPART_TAIL_RE = new RegExp(
  '(' + TIME_OF_DAY
    .flatMap((t) => t.re.source.replace(/^\^/, '').split('|^'))
    .join('|') + ')$'
);
function splitDaypartTail(text) {
  const s = String(text ?? '').trim();
  const m = DAYPART_TAIL_RE.exec(s);
  if (!m) return null;
  const t = TIME_OF_DAY.find(
    (x) => x.re.source.replace(/^\^/, '').split('|^').includes(m[1])
  );
  return { key: t ? t.key : m[1], rest: s.slice(0, m.index) };
}

/* ================= 复合时间表达 ================= */
/*
 * 形如「明年12月份的第49周周三下午2点」。
 * 单条正则覆盖不了这么长的组合，改成**从右往左逐段剥离**：
 * 时刻 → 时段 → 星期几 → 第N周 → 月 → 年。
 * 每段可选，剥不出就跳过，最后剩下的无法识别才判失败。
 */

/** ISO 年内周：含该年第一个周四的那一周为第 1 周（周一起始） */
function isoWeekOf(date) {
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // 先移到本周周四：周一 = getDay-1 的偏移修正后 +3
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const first = new Date(t.getFullYear(), 0, 4);
  first.setDate(first.getDate() + 3 - ((first.getDay() + 6) % 7));
  return 1 + Math.round((t - first) / 604800000);
}

/**
 * 某年 ISO 第 w 周的周 targetWd（1=周一 … 7=周日）是几号。
 * 注意：第 1 周的**周一** = 1/4 所在周的周一，不是 +3 后的周四。
 * 早期版本误用了求周四的公式，导致整周偏移 3 天。
 */
function isoWeekDate(year, w, targetWd) {
  const monday = new Date(year, 0, 4);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // 回到周一
  monday.setDate(monday.getDate() + (w - 1) * 7 + (targetWd - 1));
  return monday;
}

/**
 * 「第N周」是按 ISO 算还是按「1/1 起每 7 天」算，取决于周起始日。
 * 周起始日全插件只有一个来源：settings.calendar.weekStart（见「日历」设置页）。
 * 与 Calendar 插件的「Start week on」是同一种设置，两边需手动保持一致。
 */
function weekStartIsMonday(settings) {
  const cal = settings && settings.calendar;
  const v = cal && cal.weekStart;
  if (v === 'sunday') return false;
  if (v === 'monday') return true;
  // locale 及其它（周二至周六）：中文区域为周一，走 ISO
  return v === 'locale' || v === undefined || v === null;
}

/** 按设置把「第N周 + 星期几」算成日期 */
function weekOfYearDate(year, w, targetWd, settings) {
  if (weekStartIsMonday(settings)) return isoWeekDate(year, w, targetWd);
  // 周日起始：第 1 周从 1/1 开始，每周以周日为界
  const first = new Date(year, 0, 1);
  const offset = first.getDay(); // 第 1 周前面的空位
  const d = new Date(year, 0, 1 + (w - 1) * 7 + (targetWd % 7) - offset);
  return d;
}

/** 中文星期字符 → 1=周一 … 7=周日 */
const WD_CHAR = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };

/** 年偏移词 */
const YEAR_WORD = { 今年: 0, 明年: 1, 后年: 2, 去年: -1, 前年: -2 };

/** 「当前时间」——特殊词，直接取此刻 */
const NOW_WORDS = /^(当前时间|此刻|现在|当下)$/;

/** 今天是周几（0=周日） */
/** 把日期调到本周（周一为起点）的某个星期几 */
function setWeekday(date, target, weekOffset) {
  const cur = date.getDay();          // 0=周日
  const curIdx = cur === 0 ? 7 : cur; // 转成 1=周一 … 7=周日
  const diff = target - curIdx + (weekOffset || 0) * 7;
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * 「周末」算周几。周六、周日都有人用，口径交给用户（默认周日）。
 * @returns {number} 6=周六 7=周日
 */
function weekendDay(settings) {
  const ext = extOf(settings);
  return ext && ext.weekendDay === 6 ? 6 : 7;
}

/**
 * 「下周一」是哪一天 —— 只有"今天正好是本周的最后一天"时两种口径才分叉。
 *
 *   tomorrow（默认）按「本周 +7 天」推：今天周日时「下周一」= 明天。
 *     这符合多数人的口语：周日晚说「下周一」就是明天。
 *   nextweek 严格按周起始日切分：今天周日、周起始为周日时，
 *     明天仍属本周，「下周一」要再往后推一周。
 *
 * 其余情况两种口径结果相同，所以只有 wo === 1 时才需要分支。
 */
function resolveWeekday(base, wd, wo, settings) {
  const ext = extOf(settings);
  if (wo === 1 && ext && ext.nextWeekdayMode === 'nextweek') {
    // 以周起始日为界，取下一周的同一星期几
    const mondayStart = weekStartIsMonday(settings);
    const cur = base.getDay(); // 0=周日
    const curIdx = mondayStart ? (cur === 0 ? 7 : cur) : cur + 1;
    const startDelta = mondayStart ? -(curIdx - 1) : -(curIdx - 1);
    const d = new Date(base.getTime());
    d.setDate(d.getDate() + startDelta + 7 + (wd - 1));
    return d;
  }
  return setWeekday(base, wd, wo);
}

/** 单个中文数字字符 → 数值 */
const CN_DIGIT = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
/** 数量级 */
const CN_UNIT = { 十: 10, 百: 100, 千: 1000 };

/**
 * 中文数字 → 阿拉伯数字。
 * 支持：一 ~ 九、十、十一、二十、二十一、一百、一百零五、两。
 * @returns {number|null} 解析不出返回 null
 */
function parseCNNumber(text) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  // 纯阿拉伯数字直接返回
  if (/^\d+$/.test(s)) return Number(s);

  let total = 0;   // 已累计的和
  let section = 0; // 当前小节（十位以下的数）
  let lastUnit = null;
  let hasAny = false;

  for (const ch of s) {
    if (ch in CN_DIGIT) {
      section = CN_DIGIT[ch];
      hasAny = true;
    } else if (ch in CN_UNIT) {
      const u = CN_UNIT[ch];
      hasAny = true;
      if (section === 0) section = 1; // 「十」= 10、「百」= 100
      // 单位比上一个大则进位，否则累加（如「二十」= 2*10）
      total += section * u;
      section = 0;
      lastUnit = u;
    } else if (ch === '零' || ch === '〇') {
      // 零只占位，忽略
    } else {
      return null; // 含非数字字符，交给别的解析路径
    }
  }
  if (!hasAny) return null;
  return total + section;
}

/**
 * 解析时刻：5点 / 5点半 / 5点30 / 下午5点 / 17点 / 5:30。
 * @returns {{hour:number,minute:number}|null}
 */
function parseClockCN(text, daypartKey) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  /*
   * 12 小时制判定。
   * 时段词可能在调用前已被剥掉（如「晚上7点半」→ 时段=晚上，rest="7点半"），
   * 这时必须靠 daypartKey 判断上下午，否则「晚上7点」会算成早上 7 点。
   */
  let pm = null; // null = 未指定（按 24 小时制理解）
  let body = s;
  if (/^(下午|傍晚|晚上|夜里|深夜)/.test(body)) {
    pm = true;
    body = body.replace(/^(下午|傍晚|晚上|夜里|深夜)/, '');
  } else if (/^(上午|早上|早晨|凌晨)/.test(body)) {
    pm = false;
    body = body.replace(/^(上午|早上|早晨|凌晨)/, '');
  }
  if (pm === null && daypartKey) {
    const t = TIME_OF_DAY.find((x) => x.key === daypartKey);
    if (t) pm = t.pm;
  }

  // 5:30 形式
  let m = /^(\d{1,2}):(\d{2})$/.exec(body);
  if (m) {
    const h = Number(m[1]);
    if (h > 23 || Number(m[2]) > 59) return null;
    return { hour: pm && h < 12 ? h + 12 : h, minute: Number(m[2]) };
  }

  /*
   * 「差5分10点」：中文的倒数说法，先算再交给下面的统一出口。
   * 必须放在常规写法**之前** —— 否则「差5分10点」里的「10点」
   * 会被当成整点先匹配掉，剩下「差5分」无人处理。
   */
  m = /^差\s*(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*分\s*(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*点$/.exec(body);
  if (m) {
    const h0 = /^\d+$/.test(m[2]) ? Number(m[2]) : parseCNNumber(m[2]);
    const sub = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (h0 !== null && sub !== null && isFinite(h0) && isFinite(sub)) {
      const total = h0 * 60 - sub;
      const hh = Math.floor(total / 60);
      const mm = ((total % 60) + 60) % 60;
      if (hh >= 0 && hh <= 23) {
        return { hour: pm && hh < 12 ? hh + 12 : hh, minute: mm };
      }
    }
    return null;
  }

  // 十点一刻 / 十点三刻：一刻 = 15 分
  m = /^(.{1,4}?)点\s*([一二三]刻)$/.exec(body);
  if (m) {
    const hRaw = (m[1] || '').trim();
    let hour = /^\d+$/.test(hRaw) ? Number(hRaw) : parseCNNumber(hRaw);
    if (hour !== null && isFinite(hour) && hour <= 23) {
      const ke = { 一: 15, 二: 30, 三: 45 }[m[2]] || 15;
      if (pm && hour < 12) hour += 12;
      return { hour, minute: ke };
    }
    return null;
  }

  // 10点过5分 / 10点05分
  m = /^(.{1,4}?)点\s*过?\s*(\d{1,2})\s*分?$/.exec(body);
  if (m) {
    const hRaw = (m[1] || '').trim();
    let hour = /^\d+$/.test(hRaw) ? Number(hRaw) : parseCNNumber(hRaw);
    if (hour !== null && isFinite(hour) && hour <= 23) {
      const mm = Number(m[2]);
      if (mm <= 59) {
        if (pm && hour < 12) hour += 12;
        return { hour, minute: mm };
      }
    }
    return null;
  }

  // 7点45：点后直接跟两位分，无「分」字
  m = /^(\d{1,2})\s*点\s*(\d{2})$/.exec(body);
  if (m) {
    let hour = Number(m[1]);
    const mm = Number(m[2]);
    if (hour <= 23 && mm <= 59) {
      if (pm && hour < 12) hour += 12;
      return { hour, minute: mm };
    }
    return null;
  }

  // 5点 / 5点半 / 5点30 / 17点 / 五点
  m = /^(.{1,4}?)点(半|\d{1,2}分?|整)?$/.exec(body);
  if (m) {
    const hRaw = (m[1] || '').trim();
    if (!hRaw) return null;
    let hour = /^\d+$/.test(hRaw) ? Number(hRaw) : parseCNNumber(hRaw);
    if (hour === null || !isFinite(hour)) return null;
    if (hour > 23) return null;
    // 中文习惯：「下午5点」→ 17，「下午12点」保持 12
    if (pm && hour < 12) hour += 12;

    let minute = 0;
    if (m[2]) {
      if (m[2] === '半') minute = 30;
      else minute = Number(String(m[2]).replace('分', ''));
    }
    if (minute > 59) return null;
    return { hour, minute };
  }
  return null;
}

/*
 * 数量部分既可以是阿拉伯数字，也可以是中文（二天后 / 两天后 / 七天后），
 * 所以这里用宽松的字符类，实际数值交给 parseCNNumber 处理。
 * 前面加「第」可表示序数（第二天 / 第七天后）。
 */
const REL_RE =
  /^第?([0-9\.]+|[零〇一二两三四五六七八九十百千]+)\s*(秒|分钟|分|刻钟|刻|小时|时|天|日|周|个?星期|个?月|年)\s*(以内)?(以前|以后|之前|之后|内|前|后)?$/;

/** 半 / 一 + 特殊量词：半小时后 / 一刻钟后 / 半天后 */
/*
 * 注意：这里刻意不含「大半天」。
 * 它是时长描述（"花了大半天"）而非时刻，转成日期没有意义，
 * 且语义比「半天」更模糊，归为不识别的模糊词。
 */
const HALF_RE =
  /^(半小时|半个小?时|一刻钟|一?刻钟|半天|半)\s*(以后|之后|后|以内|内|以前|之前|前)?$/;

/** 倒装说法：前两天 / 前三天 / 前一周 —— 方向词在前面 */
const REL_PREFIX_RE =
  /^(前|上)([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*(秒|分钟|分|小时|时|天|日|周|个?星期|个?月|年)$/;

/** 「过N…」：过两天 / 再过三天 —— 方向固定往后，故与 REL_PREFIX_RE 分开 */
const GUO_RE =
  /^(?:再)?过\s*([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*(天|日|周|个?星期|个?月|年)$/;

/** 复合时长：一年零三天后 / 两年零一个月前 —— 「零」连接的两个量 */
const ZERO_RE =
  /^([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*年\s*零?\s*([0-9]+|[零〇一二两三四五六七八九十百千]+)\s*(天|日|个?月)\s*(前|后)$/;

/**
 * 口语相对日：明天 / 后天 / 大后天 / 前天 / 大前天 / 昨天 / 今天 / 下周 / 上个月……
 * 这些没有数字，只能整词匹配；中文与英文各一份。
 *
 * offsets 为 [年偏移, 月偏移, 日偏移]，按月/年推进的走日历加法，
 * 避免用固定天数近似（月末、闰年会错）。
 */
/**
 * 口语相对日的「日偏移」表，供带时刻的写法复用。
 * 单独抽出来是因为「明天5点」= 日偏移(明天) + 时刻(5点)，
 * 两条规则组合，不需要为每种组合都写一条。
 */
const WORD_DAY_OFFSET = [
  /*
   * 「第二天」= 次日（+1）。这是口语里最无争议的用法，
   * 而「第七天后」走下面的数量规则算 +7；两者不一致但各自符合语感。
   * 放在这里是为了优先于 REL_RE 的「第N天 → +N」。
   */
  { re: /^第二天/, d: 1 },
  { re: /^次日/, d: 1 },
  { re: /^翌日/, d: 1 },
  { re: /^今日/, d: 0 },
  { re: /^当天/, d: 0 },
  { re: /^当日/, d: 0 },
  { re: /^今日/, d: 0 },
  // 今早 / 今晚 / 明早 / 明晚 / 昨夜 / 今夜：日偏移由前缀定，时段由后缀定
  // 今/明/昨 + 早/晚/夜/晨/下午 的各种组合
  { re: /^今早|^今晨|^今上午/, d: 0 },
  { re: /^今晚|^今夜|^今下午|^今傍晚|^今凌晨/, d: 0 },
  { re: /^明早|^明晨|^明上午/, d: 1 },
  { re: /^明晚|^明夜|^明下午|^明傍晚|^明凌晨/, d: 1 },
  { re: /^昨早|^昨晨|^昨上午/, d: -1 },
  { re: /^昨夜|^昨晚|^昨下午|^昨傍晚|^昨凌晨/, d: -1 },
  { re: /^后早|^后晨/, d: 2 },
  { re: /^后晚|^后夜|^后下午/, d: 2 },
  { re: /^前早|^前晨/, d: -2 },
  { re: /^前晚|^前夜|^前下午/, d: -2 },
  { re: /^大大前天/, d: -4 }, { re: /^大前天/, d: -3 }, { re: /^前天/, d: -2 },
  { re: /^昨天/, d: -1 }, { re: /^今天/, d: 0 },
  { re: /^明天/, d: 1 }, { re: /^后天/, d: 2 },
  { re: /^大后天/, d: 3 }, { re: /^大大后天/, d: 4 },
  { re: /^上上个?周/, d: -14 }, { re: /^上个?周/, d: -7 },
  { re: /^本个?周/, d: 0 }, { re: /^下个?周/, d: 7 }, { re: /^下下个?周/, d: 14 },
  { re: /^前天$/, d: -2 },
];

/** 从口语相对日里取出「日部分」与「剩余部分」（可能是时刻） */
function splitWordDay(text) {
  const s = String(text ?? '').trim();
  for (const w of WORD_DAY_OFFSET) {
    if (w.re.test(s)) {
      const rest = s.replace(w.re, '').trim();
      /*
       * 时段词只可能在**词根**里（「明晚」的「晚」、「今早」的「早」），
       * 所以只在词根部分找，不去动 rest。
       * 早先的版本对**整个原文**找，结果「大后天5点半」里的「半」
       * 被当成「深夜」的单字别名，5:30 被算成 17:30。
       * 时刻部分的字不参与时段判定，两者语义本就不相干。
       */
      const stem = s.slice(0, s.length - rest.length);
      return { dayOffset: w.d, rest, daypart: daypartIn(stem) };
    }
  }
  return null;
}

/**
 * 在整个文本里找时段词（作为子串，含单字别名），返回 key 或 null。
 * 别名必须**后于完整词**检查：先完整后单字，否则「晚上」会先命中「晚」。
 * 实际上顺序无妨（同 key），但「下午 / 中午」都含「午」——
 * 所以别名检查要跳过同时是完整词的字，这里按「午」归属到先出现的「中午」，
 * 上下午的区分交给前面的完整词匹配（splitDaypartTail）优先处理。
 */
function daypartIn(text) {
  const s = String(text ?? '');
  // 完整词优先
  for (const t of TIME_OF_DAY) {
    if (s.indexOf(t.key) >= 0) return t.key;
  }
  // 再查单字别名（「明晚」的「晚」、「今早」的「早」）
  for (const t of TIME_OF_DAY) {
    if (!t.alias) continue;
    for (const a of t.alias) {
      if (s.indexOf(a) >= 0) return t.key;
    }
  }
  return null;
}

/**
 * 星期几：周一 ~ 周日、星期一 ~ 星期日，可带 本/上/下。
 * 必须**优先于 splitWordDay** —— 否则「上周五」会被 /^上个?周/ 吃掉前半，
 * 剩下「五」既不是时刻也不是有效后缀，直接返回 null。
 * @returns {{wd:number,wo:number}|null} wd: 1=周一…7=周日；wo: 周偏移
 */
/*
 * 星期写法。三种词根都要收，缺一种就是成片漏识别：
 *   周   → 周五 / 上上周一
 *   星期 → 星期五（原先只认「周五」，「星期五」整类不识别）
 *   礼拜 → 礼拜三（南方口语常用）
 * 前缀支持叠字：上上周三 / 下下周一。
 */
const WEEKDAY_RE =
  /^(上上|下下|本|这|上|下)?\s*(?:周|星期|礼拜)\s*([一二三四五六日天1-7])(?:[日天])?$/;

function parseWeekday(text) {
  const s = String(text ?? '').trim();
  const m = WEEKDAY_RE.exec(s);
  if (!m) return null;
  const char = m[2];
  const map = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  let wd = map[char];
  if (wd === undefined && /^[1-7]$/.test(char)) wd = Number(char);
  if (!wd) return null;
  const prefix = m[1];
  const wo = prefix === '上上' ? -2 : prefix === '下下' ? 2
    : prefix === '上' ? -1 : prefix === '下' ? 1 : 0;
  return { wd, wo };
}

const WORD_REL = [
  // --- 中文：以「天」为单位 ---
  /*
   * 顺序与量词都要精确：多条都写成 /^大?大?前天$/ 的话，
   * 「前天」也会被它匹配成 -3（两个「大」都是可选的），
   * 结果「前天」和「大前天」算出同一天。必须逐条写死。
   */
  { re: /^大大前天$/, y: 0, m: 0, d: -4, label: '大大前天' },
  { re: /^大前天$/, y: 0, m: 0, d: -3, label: '大前天' },
  { re: /^前天$/, y: 0, m: 0, d: -2, label: '前天' },
  { re: /^昨天$/, y: 0, m: 0, d: -1, label: '昨天' },
  { re: /^今天$/, y: 0, m: 0, d: 0, label: '今天' },
  { re: /^明天$/, y: 0, m: 0, d: 1, label: '明天' },
  { re: /^后天$/, y: 0, m: 0, d: 2, label: '后天' },
  { re: /^大后天$/, y: 0, m: 0, d: 3, label: '大后天' },
  { re: /^大大后天$/, y: 0, m: 0, d: 4, label: '大大后天' },

  // --- 中文：星期几（周一 ~ 周日 / 星期一 ~ 星期日 / 周末）---
  { re: /^本周?一$|^本周?一$/, wd: 1, wo: 0, label: '周一' },
  { re: /^本周?二$/, wd: 2, wo: 0, label: '周二' },
  { re: /^本周?三$/, wd: 3, wo: 0, label: '周三' },
  { re: /^本周?四$/, wd: 4, wo: 0, label: '周四' },
  { re: /^本周?五$/, wd: 5, wo: 0, label: '周五' },
  { re: /^本周?六$/, wd: 6, wo: 0, label: '周六' },
  { re: /^本周?日$|^本周?天$/, wd: 7, wo: 0, label: '周日' },
  { re: /^上周一?$|^上周一$/, wd: 1, wo: -1, label: '上周一' },
  { re: /^上周二$/, wd: 2, wo: -1, label: '上周二' },
  { re: /^上周三$/, wd: 3, wo: -1, label: '上周三' },
  { re: /^上周四$/, wd: 4, wo: -1, label: '上周四' },
  { re: /^上周五$/, wd: 5, wo: -1, label: '上周五' },
  { re: /^上周六$/, wd: 6, wo: -1, label: '上周六' },
  { re: /^上周日$|^上周天$/, wd: 7, wo: -1, label: '上周日' },
  { re: /^下周一?$|^下周一$/, wd: 1, wo: 1, label: '下周一' },
  { re: /^下周二$/, wd: 2, wo: 1, label: '下周二' },
  { re: /^下周三$/, wd: 3, wo: 1, label: '下周三' },
  { re: /^下周四$/, wd: 4, wo: 1, label: '下周四' },
  { re: /^下周五$/, wd: 5, wo: 1, label: '下周五' },
  { re: /^下周六$/, wd: 6, wo: 1, label: '下周六' },
  { re: /^下周日$|^下周天$/, wd: 7, wo: 1, label: '下周日' },
  /*
   * 周末 = 周六还是周日没有共识（有人把周日当周末最后一天）。
   * wd 只是占位，实际值在匹配后由 weekendDay(settings) 覆盖，
   * weekend: true 就是那处覆盖的标记。
   */
  { re: /^周末$/, wd: 6, wo: 0, label: '周末', weekend: true },

  // --- 中文：月 / 年的首尾 ---
  { re: /^本?月底$|^月末$/, monthEnd: true, label: '月底' },
  { re: /^本?月初$/, monthStart: true, label: '月初' },
  // 组合式：上个月底 / 下个月初 / 上月末 / 下月初，含「个」字与省略写法
  { re: /^上个?月底$|^上个?月末$/, monthEnd: true, monthOffset: -1, label: '上个月底' },
  { re: /^下个?月初$/, monthStart: true, monthOffset: 1, label: '下个月初' },
  { re: /^下个?月底$|^下个?月末$/, monthEnd: true, monthOffset: 1, label: '下个月底' },
  { re: /^上个?月初$/, monthStart: true, monthOffset: -1, label: '上个月初' },
  // 叠字两层：上上个月底 / 上上月末
  { re: /^上上个?月底$|^上上个?月末$/, monthEnd: true, monthOffset: -2, label: '上上个月底' },
  // 去年末 / 明年初：先跨年，再取年末月初
  { re: /^去年末$|^去年底$/, monthEnd: true, yearOffset: -1, label: '去年末' },
  { re: /^明年初$|^明年头$/, monthStart: true, yearOffset: 1, label: '明年初' },
  { re: /^年中$/, y: 0, m: 0, d: 0, fixedMonth: 6, fixedDay: 30, label: '年中' },
  { re: /^年末$|^年底$/, y: 0, m: 0, d: 0, fixedMonth: 12, fixedDay: 31, label: '年末' },
  { re: /^年初$/, y: 0, m: 0, d: 0, fixedMonth: 1, fixedDay: 1, label: '年初' },

  // --- 中文：周 / 月 / 年 ---
  { re: /^上上(个)?周$/, y: 0, m: 0, d: -14, label: '上上周' },
  { re: /^上(个)?周$/, y: 0, m: 0, d: -7, label: '上周' },
  { re: /^本(个)?周$/, y: 0, m: 0, d: 0, label: '本周' },
  { re: /^下(个)?周$/, y: 0, m: 0, d: 7, label: '下周' },
  { re: /^下下(个)?周$/, y: 0, m: 0, d: 14, label: '下下周' },
  { re: /^下下下(个)?周$/, y: 0, m: 0, d: 21, label: '下下下周' },
  { re: /^上上上(个)?周$/, y: 0, m: 0, d: -21, label: '上上上周' },
  // 头一天 = 前一天，与「前一天」同义
  { re: /^头一天$/, y: 0, m: 0, d: -1, label: '头一天' },
  // 半年 = 6 个月；一年半 = 1 年 6 个月。走日历加法，不用固定天数近似
  { re: /^半年后$/, y: 0, m: 6, d: 0, label: '半年后' },
  { re: /^半年前$/, y: 0, m: -6, d: 0, label: '半年前' },
  { re: /^一年半后$/, y: 1, m: 6, d: 0, label: '一年半后' },
  { re: /^一年半前$/, y: -1, m: -6, d: 0, label: '一年半前' },
  { re: /^上个?月$/, y: 0, m: -1, d: 0, label: '上个月' },
  { re: /^这个?月$/, y: 0, m: 0, d: 0, label: '本月' },
  { re: /^下个?月$/, y: 0, m: 1, d: 0, label: '下个月' },
  { re: /^前年$/, y: -2, m: 0, d: 0, label: '前年' },
  { re: /^去年$/, y: -1, m: 0, d: 0, label: '去年' },
  { re: /^今年$/, y: 0, m: 0, d: 0, label: '今年' },
  { re: /^明年$/, y: 1, m: 0, d: 0, label: '明年' },
  { re: /^后年$/, y: 2, m: 0, d: 0, label: '后年' },

  // --- 英文 ---
  { re: /^yesterday$/i, y: 0, m: 0, d: -1, label: 'yesterday' },
  { re: /^today$/i, y: 0, m: 0, d: 0, label: 'today' },
  { re: /^tomorrow$/i, y: 0, m: 0, d: 1, label: 'tomorrow' },
  { re: /^the day after tomorrow$/i, y: 0, m: 0, d: 2, label: 'the day after tomorrow' },
  { re: /^the day before yesterday$/i, y: 0, m: 0, d: -2, label: 'the day before yesterday' },
  // 英文：this/next/last + 时段
  { re: /^this morning$/i, y: 0, m: 0, d: 0, label: 'this morning', daypart: '早上' },
  { re: /^this afternoon$/i, y: 0, m: 0, d: 0, label: 'this afternoon', daypart: '下午' },
  { re: /^this evening$/i, y: 0, m: 0, d: 0, label: 'this evening', daypart: '晚上' },
  { re: /^tomorrow morning$/i, y: 0, m: 0, d: 1, label: 'tomorrow morning', daypart: '早上' },
  { re: /^tomorrow afternoon$/i, y: 0, m: 0, d: 1, label: 'tomorrow afternoon', daypart: '下午' },
  { re: /^tomorrow evening$/i, y: 0, m: 0, d: 1, label: 'tomorrow evening', daypart: '晚上' },
  { re: /^last night$/i, y: 0, m: 0, d: -1, label: 'last night', daypart: '晚上' },
  { re: /^tonight$/i, y: 0, m: 0, d: 0, label: 'tonight', daypart: '晚上' },
  { re: /^(next|last) week$/i, y: 0, m: 0, d: 7, label: 'next week', dirFromWord: true },
  { re: /^(next|last) month$/i, y: 0, m: 1, d: 0, label: 'next month', dirFromWord: true },
  { re: /^(next|last) year$/i, y: 1, m: 0, d: 0, label: 'next year', dirFromWord: true },
];

/** 是否像「相对时间」的描述（用于空态提示：这类文本有对应转换项只是没开） */
function looksLikeRelative(text) {
  const t = String(text ?? '').trim();
  if (!t) return false;
  if (REL_RE.test(t) || REL_PREFIX_RE.test(t)) return true;
  if (WORD_REL.some((w) => w.re.test(t))) return true;
  // 口语日 + 时刻：明天5点 / 昨天下午3点
  const sw = splitWordDay(t);
  return !!(sw && (!sw.rest || parseClockCN(sw.rest)));
}

/**
 * 字段合法性校验。
 * 宽松分隔符会带来副作用：像 "99 99" 这种也能被正则匹配上，
 * 不限定范围就会解析出荒谬的日期（月 99）。构造后校验一遍再返回。
 */
function isValidParts(y, mo, d, h, mi, sec) {
  if (mo < 1 || mo > 12) return false;
  if (d < 1 || d > 31) return false;
  if (h < 0 || h > 23) return false;
  if (mi < 0 || mi > 59) return false;
  if (sec < 0 || sec > 59) return false;
  if (!isFinite(y) || y < 1) return false;
  return true;
}

/** 构造 Date 并校验；不合法返回 null */
function safeDate(y, mo, d, h, mi, sec) {
  const [Y, M, D, H, MI, S] = [Number(y), Number(mo), Number(d),
    h ? Number(h) : 0, mi ? Number(mi) : 0, sec ? Number(sec) : 0];
  if (!isValidParts(Y, M, D, H, MI, S)) return null;
  const date = new Date(Y, M - 1, D, H, MI, S);
  // 反向确认：防止 2 月 30 日这类被 JS 自动进位
  if (date.getFullYear() !== Y || date.getMonth() !== M - 1 || date.getDate() !== D) return null;
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 去掉包裹性的装饰：[[链接]] 与末尾的星期。
 * 这样 09-17、[[09-17]]、09-17 周六 都能走到同一套解析逻辑。
 */
function stripDecorations(text) {
  let s = String(text ?? '').trim();
  const link = LINK_RE.exec(s);
  if (link) s = link[1].trim();
  const noWeek = stripWeekdayOnly(s);
  return noWeek !== null ? noWeek : s;
}

/** 只剥末尾的星期；本来就没有星期则返回 null（用于判断这项是否适用） */
function stripWeekdayOnly(text) {
  let s = String(text ?? '').trim();
  let changed = false;
  // 极端情况下可能叠了两层，最多剥两次
  for (let i = 0; i < 2; i++) {
    const next = s.replace(WEEKDAY_SUFFIX_RE, '').trim();
    if (next === s) break;
    s = next;
    changed = true;
  }
  return changed ? s : null;
}

/** 文本里是否含「时:分」（可能带秒） */
function hasClock(text) {
  return /\d{1,2}[:：]\d{2}(?:[:：]\d{2})?/.test(String(text ?? ''));
}
/** 文本里的时钟部分是否写了秒 */
function hasSeconds(text) {
  return /\d{1,2}[:：]\d{2}[:：]\d{2}/.test(String(text ?? ''));
}
/** 文本里是否含四位年份 */
function hasYear(text) {
  return /\d{4}/.test(String(text ?? ''));
}

/** 把文本解析成 Date；认不出返回 null */
function parseToDate(text, settings) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  /*
   * 中文大写的月日（五月十六日）：默认规则下按**阳历**处理，
   * 但只认阿拉伯数字的阳历解析吃不下它，会变成「农历不算、阳历也认不出」的死角。
   * 所以需要 settings 判断归属 —— 只在明确不按农历时才按阳历解析。
   */
  if (settings && shouldTreatAsLunar(raw, settings) === false && cnMonthDaySuffix(raw) !== null) {
    const cn = parseCnSolarDate(raw);
    if (cn) return cn;
  }

  // 纯数字：按 Unix 时间戳处理（10 位秒 / 13 位毫秒）
  if (UNIX_RE.test(raw)) {
    const n = Number(raw);
    const ms = raw.length === 10 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  const clean = stripDecorations(raw).trim();
  if (!clean) return null;

  // 紧凑 8 位：20260919
  const cm = COMPACT_RE.exec(clean);
  if (cm) return safeDate(cm[1], cm[2], cm[3]);

  // 只有时分（秒）：先于「只有月日」判断。
  // 顺序很关键 —— 宽松分隔符下 "14:30" 也会被 MD_RE 匹配成「月 14 日 30」，
  // 虽然会被范围校验挡下，但先判时钟语义更清晰。
  const t = TIME_ONLY_RE.exec(clean);
  if (t) {
    const now = new Date();
    return safeDate(
      now.getFullYear(), now.getMonth() + 1, now.getDate(), t[1], t[2], t[3]
    );
  }

  // 完整年月日（可带时间）
  const m = DATE_RE.exec(clean);
  if (m) {
    const parsed = safeDate(m[1], m[2], m[3], m[4], m[5], m[6]);
    if (parsed) return parsed;
  }

  // 只有月日：补上今年
  const md = MD_RE.exec(clean);
  if (md) {
    const now = new Date();
    const parsed = safeDate(
      now.getFullYear(), md[1], md[2], md[3], md[4], md[5]
    );
    if (parsed) return parsed;
  }

  /*
   * 只有日：3号 / 17号。
   * 三种口径由 dayOnlyMode 决定，没有共识，交给用户选：
   *   current（默认）补当前月     → 今天 9/20 时「17号」= 9/17
   *   upcoming 该日已过则取下月   → 今天 9/20 时「17号」= 10/17
   *   off     不转换
   * 注意日期必须回校（2月30号这类直接返回 null），
   * 否则 setDate 会静默溢出到下个月。
   */
  const dom = DAY_ONLY_RE.exec(clean);
  if (dom) {
    const mode = dayOnlyMode(settings);
    if (mode !== 'off') {
      const n = /^\d+$/.test(dom[1]) ? Number(dom[1]) : parseCNNumber(dom[1]);
      const now = new Date();
      if (n !== null && isFinite(n) && n >= 1 && n <= 31) {
        let mo = now.getMonth() + 1;
        if (mode === 'upcoming' && n < now.getDate()) mo += 1;
        return safeDate(now.getFullYear(), mo, n);
      }
    }
  }

  return null;
}

/**
 * 「只有日」的口径（3号 / 17号）。
 * 三种写法都有人用，插件不替用户拍板，默认补当前月。
 */
function dayOnlyMode(settings) {
  const ext = extOf(settings);
  const v = ext && ext.dayOnlyMode;
  return v === 'upcoming' || v === 'off' ? v : 'current';
}

/** 输入是否看起来像 Unix 时间戳 */
function looksLikeUnix(text) {
  return UNIX_RE.test(String(text ?? '').trim());
}

/**
 * 解析相对时间描述：3天前 / 2小时后 / 1.5小时后 / 2周前。
 * 月、年按日历推进（避免 30 天近似在月末出错），其余按毫秒加减。
 * @returns {Date|null}
 */
/**
 * 把日期的时分秒设为指定值（保持年月日）。
 * 相对时间默认落在 00:00 更自然 —— 说「明天」通常指那天而非当前时刻。
 */
function withClock(date, hour, minute, second) {
  const d = new Date(date.getTime());
  d.setHours(hour || 0, minute || 0, second || 0, 0);
  return d;
}

/** 时段名对应的小时（取用户在高级设置里改过的值，否则用默认） */
function daypartHour(key, settings) {
  const ext = extOf(settings);
  const custom = ext && ext.daypartHours;
  if (custom && typeof custom[key] === 'number') return custom[key];
  const t = TIME_OF_DAY.find((x) => x.key === key);
  return t ? t.hour : 12;
}

/** 是否允许「时段名单独转换」（默认否，方案丙：不给模糊词编造时刻） */
function convertDaypartAlone(settings) {
  const ext = extOf(settings);
  return !!(ext && ext.convertDaypartAlone === true);
}

/**
 * 英文句式：in 3 days / 3 days ago / in two weeks / a week ago。
 * 数字可以是阿拉伯或英文单词，单位取单数/复数都行。
 * @returns {{n:number,unit:string,dir:number}|null}
 */
const EN_UNIT = {
  second: '秒', seconds: '秒', minute: '分钟', minutes: '分钟',
  hour: '小时', hours: '小时', day: '天', days: '天',
  week: '周', weeks: '周', month: '月', months: '月',
  year: '年', years: '年',
};
const EN_NUM = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/** 英文星期：next Monday / last Friday / this Monday */
const EN_WEEKDAY = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 7,
};
function parseEnglishWeekday(text) {
  const s = String(text ?? '').trim().toLowerCase();
  const m = /^(next|last|this)?\s*([a-z]+)$/.exec(s);
  if (!m) return null;
  const wd = EN_WEEKDAY[m[2]];
  if (!wd) return null;
  const wo = m[1] === 'next' ? 1 : m[1] === 'last' ? -1 : 0;
  return { wd, wo };
}

function parseEnglishRelative(text) {
  const s = String(text ?? '').trim().toLowerCase();
  // 3 days ago / two weeks ago
  let m = /^([\d]+|[a-z]+)\s+([a-z]+)s?\s+ago$/.exec(s);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : EN_NUM[m[1]];
    const unit = EN_UNIT[m[2]] || EN_UNIT[m[2] + 's'];
    if (n && unit) return { n, unit, dir: -1 };
  }
  // in 3 days / in two weeks
  m = /^in\s+([\d]+|[a-z]+)\s+([a-z]+)s?$/.exec(s);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : EN_NUM[m[1]];
    const unit = EN_UNIT[m[2]] || EN_UNIT[m[2] + 's'];
    if (n && unit) return { n, unit, dir: 1 };
  }
  return null;
}

/**
 * 去掉尾部的助词（的 / 份 / 里 / 内）。
 * 中文口语常插「的」：「12月份**的**第49周」，不剥掉会让下一段尾部匹配失败。
 */
function stripParticle(text) {
  return String(text ?? '').replace(/(的|份|里|内)+$/, '').trim();
}

/**
 * 复合时间表达：明年12月份的第49周周三下午2点。
 * @returns {Date|null} 至少要剥出「有意义的一段」才返回结果，
 *   否则任意文本都可能被误判。
 */
function parseComposite(text, base, settings) {
  let s = String(text ?? '').trim();
  if (!s) return null;

  const now = base ? new Date(base.getTime()) : new Date();
  let year = null, month = null, week = null, wd = null, day = null;
  let daypart = null, clock = null, monthEdgeFlag = null, wo = 0;
  let hit = false;

  // ---- 1) 尾部时刻：2点 / 7点半 / 14:30 ----
  let m = /(\d{1,2})\s*[:：]\s*(\d{2})\s*分?$/.exec(s);
  if (m) { clock = { hour: Number(m[1]), minute: Number(m[2]) }; s = s.slice(0, m.index); hit = true; }
  else {
    m = /(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*点\s*(半|\d{1,2}\s*分?)?$/.exec(s);
    if (m) {
      const h = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
      if (h !== null) {
        let mi = 0;
        if (m[2]) mi = m[2] === '半' ? 30 : Number(String(m[2]).replace('分', ''));
        clock = { hour: h, minute: mi };
        s = s.slice(0, m.index);
        hit = true;
      }
    }
  }

  // ---- 2) 尾部时段（必须在尾，不能按开头匹配）----
  const dp = splitDaypartTail(s);
  if (dp) {
    daypart = dp.key;
    s = dp.rest;
    hit = true;
  }

  // ---- 3) 尾部星期几：周三 / 星期五 / 礼拜三 ----
  s = stripParticle(s);
  /*
   * 必须带上/下/本/这前缀：「下周三下午2点」剥掉时刻与时段后剩「下周三」，
   * 只吃「周三」会留下一个「下」→ 走到 leftover 检查整条判 null。
   * WEEKDAY_RE 本来就是带前缀的，这里是同一文件里的不一致。
   */
  m = /(上上|下下|本|这|上|下)?\s*(?:周|星期|礼拜)\s*([一二三四五六日天1-7])$/.exec(s);
  if (m) {
    const ch = m[2];
    wd = WD_CHAR[ch] || (/^[1-7]$/.test(ch) ? Number(ch) : null);
    if (wd) {
      wo = m[1] === '上上' ? -2 : m[1] === '下下' ? 2
         : m[1] === '上' ? -1 : m[1] === '下' ? 1 : 0;
      s = s.slice(0, m.index); hit = true;
    }
  }

  /*
   * ---- 3b) 尾部「几号 / 几日」：明年12月5号 ----
   * 原来只剥到月，没有日这一层，所以「明年12月5号」整条失败
   * （剩下「明年12月5」里的 5 无处可去）。
   * 必须在**剥月之前**先剥日，否则「5号」会被当成月份的一部分。
   */
  s = stripParticle(s);
  m = /(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*(?:号|日)$/.exec(s);
  if (m) {
    const dd = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (dd !== null && isFinite(dd) && dd >= 1 && dd <= 31) {
      day = dd;
      s = s.slice(0, m.index);
      hit = true;
    }
  }

  // ---- 4) 第N周 ----
  s = stripParticle(s);
  m = /第\s*(\d+|[零〇一二两三四五六七八九十]+)\s*周$/.exec(s);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (n && n >= 1 && n <= 53) { week = n; s = s.slice(0, m.index); hit = true; }
  }

  /*
   * ---- 4b) 尾部「月底 / 月初」：明年12月底 ----
   * 必须在剥月**之前**：「12月底」的「月」属于这个整体，
   * 先剥月会把「底」剩下来，导致整条判失败。
   */
  s = stripParticle(s);
  const me = /(月底|月末|月初)$/.exec(s);
  if (me) {
    monthEdgeFlag = /初$/.test(me[1]) ? 'start' : 'end';
    /*
     * 只剥掉「底 / 末 / 初」，**保留「月」**。
     * 连「月」一起剥的话下面第 5 步就找不到月份标记，「明年12月底」会判失败。
     */
    s = s.slice(0, me.index) + '月';
    hit = true;
  }

  // ---- 5) 月份：12月份 ----
  s = stripParticle(s);
  m = /(\d{1,2}|[零〇一二两三四五六七八九十]+)\s*月\s*(份)?$/.exec(s);
  if (m) {
    const mo = /^\d+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
    if (mo >= 1 && mo <= 12) { month = mo; s = s.slice(0, m.index); hit = true; }
  }

  // ---- 6) 年份：明年 / 2027年 ----
  s = stripParticle(s);
  m = /(今年|明年|后年|去年|前年|(\d{4}))\s*年?$/.exec(s);
  if (m) {
    if (m[2]) year = Number(m[2]);
    else if (m[1] in YEAR_WORD) year = now.getFullYear() + YEAR_WORD[m[1]];
    if (year) { s = s.slice(0, m.index); hit = true; }
  }

  /*
   * 兜底：剥完时刻与时段后剩下的**整串**本身是完整日期
   * （「2026-09-19下午3点」剥完剩「2026-09-19」）。
   * 必须在 leftover 检查**之前**算 —— 放在之后的话 leftover 那句已经
   * return null 了，兜底永远到不了。parseToDate 首尾锚定，
   * 不会把碎片当日期，所以安全。
   */
  let fallbackDate = null;
  if (month === null && day === null && week === null && wd === null && year === null) {
    fallbackDate = parseToDate(String(s).trim(), settings);
  }

  // 剥完还剩内容 且 整串不是完整日期 → 整体不认
  if (!fallbackDate && String(stripParticle(s)).replace(/[\s，,、]/g, '') !== '') return null;
  if (!hit) return null;

  // ---- 合成 ----
  let d;
  const y = year || now.getFullYear();

  if (fallbackDate) {
    d = fallbackDate;
  } else if (week && wd) {
    d = weekOfYearDate(y, week, wd, settings);
  } else if (week) {
    d = weekOfYearDate(y, week, 1, settings); // 只有周数取该周一
  } else if (wd) {
    // 只有星期几：在当前月份（或指定月份）内找
    const baseDate = month ? new Date(y, month - 1, 1) : new Date(now.getTime());
    // 用 resolveWeekday 而非 setWeekday：前者会读 nextWeekdayMode 设置
    d = resolveWeekday(baseDate, wd, wo, settings);
  } else if (month) {
    d = new Date(y, month - 1, day || 1);
    // 「明年12月底」：先定位到该月，再取月末/月初
    if (monthEdgeFlag) d = monthEdge(d, { monthEnd: monthEdgeFlag === 'end', monthStart: monthEdgeFlag === 'start' });
  } else if (day) {
    // 只有日没有月（「5号」）：补当前月，口径与 DAY_ONLY_RE 一致
    if (dayOnlyMode(settings) === 'off') return null;
    d = new Date(now.getFullYear(), now.getMonth(), day);
  } else if (year) {
    /*
     * 只有年份（「去年」「明年」）不在这里处理 —— 用户想要的是
     * 「去年同期 / 明年同期」而不是 1 月 1 日。
     * 返回 null 让 WORD_REL 的年份规则接管。
     */
    return null;
  } else {
    return null;
  }

  // 指定了月份但算出的日期不在该月 → 冲突，判失败（不返回看起来对其实错的日期）
  if (month && d.getMonth() !== month - 1) return null;

  // 时刻
  let hour = clock ? clock.hour : 0;
  const minute = clock ? clock.minute : 0;
  /*
   * 只有时段没有时刻（「2027年1月1日凌晨」）时给时段的默认小时，
   * 否则凌晨会落在 00:00 —— 那跟没写时段一样，白剥一段。
   */
  if (!clock && daypart) hour = daypartHour(daypart, settings);
  if (clock && daypart) {
    const t = TIME_OF_DAY.find((x) => x.key === daypart);
    // 下午/晚上且小时小于12 → +12
    if (t && t.pm && hour < 12) hour += 12;
  }
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** 月初 / 月末 *//** 月初 / 月末 */
function monthEdge(date, w) {
  const d = new Date(date.getTime());
  if (w.yearOffset) d.setFullYear(d.getFullYear() + w.yearOffset);
  if (w.monthOffset) d.setMonth(d.getMonth() + w.monthOffset);
  /*
   * 跨年写法（去年末 / 明年初）与跨月写法（上个月底）的锚点不同：
   *   「上个月底」= 偏移后**那个月**的最后一天
   *   「去年末」  = 那一年**12 月**的最后一天，不是"9 月末"
   * 所以只有单独跨年（没有 monthOffset）时才强制跳到 1 月 / 12 月。
   */
  const yearOnly = !!w.yearOffset && !w.monthOffset;
  if (w.monthStart) {
    if (yearOnly) d.setMonth(0);
    d.setDate(1);
    return d;
  }
  if (yearOnly) {
    d.setMonth(11);
    d.setDate(31);
    return d;
  }
  // 月末：下个月第 0 天即本月最后一天
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return d;
}

function parseRelative(text, base, settings) {
  const pluginSettingsForParse = settings || null;
  const raw = String(text ?? '').trim();
  if (!raw) return null;

  /*
   * 「当前时间 / 此刻 / 现在」→ 取**真实此刻**，不理基准。
   * 这类词问的就是"现在几点"，填基准进去语义就错了。
   */
  if (NOW_WORDS.test(raw)) return new Date();

  // 复合表达优先于单条规则：明年12月份的第49周周三下午2点
  const comp = parseComposite(raw, base, settings);
  if (comp) return comp;
  const now0 = base ? new Date(base.getTime()) : new Date();

  /*
   * ---- 0a) 周末 + 时段：周末晚上 ----
   * 「周末」在 WORD_REL 里是整词匹配，带时段就匹配不上了，
   * 而「周末晚上」是很常见的说法，所以单独收一条。
   */
  const weDp = /^周末(早上|早晨|上午|中午|正午|下午|傍晚|黄昏|晚上|夜里|深夜|凌晨)$/.exec(raw);
  if (weDp) {
    const d = resolveWeekday(now0, weekendDay(pluginSettingsForParse), 0, pluginSettingsForParse);
    const key = (splitDaypart(weDp[1]) || {}).key;
    if (key) d.setHours(daypartHour(key, pluginSettingsForParse), 0, 0, 0);
    return d;
  }

  // ---- 0) 星期几（必须最先，否则「上周五」会被「上周」吃掉）----
  const wk = parseWeekday(raw);
  if (wk) return resolveWeekday(now0, wk.wd, wk.wo, pluginSettingsForParse);

  // ---- 1) 口语相对日 + 可选时刻：明天5点 / 昨天下午3点 / 大后天5点半 ----
  const sw = splitWordDay(raw);
  if (sw) {
    const d = new Date(now0.getTime());
    d.setDate(d.getDate() + sw.dayOffset);
    if (sw.rest) {
      /*
       * 时刻要带时段一起判：「明晚8点」的 rest 只有「8点」，
       * 不把词根里的「晚上」传进去就会算成早上 8 点。
       */
      const clock = parseClockCN(sw.rest, sw.daypart);
      if (clock) {
        d.setHours(clock.hour, clock.minute, 0, 0);
        return d;
      }
      /*
       * 再试纯时段词：明天晚上 / 昨天早上。
       * 这里**不能返回 null** —— 「明天晚上」的日期是确定的（就是明天），
       * 跟「晚上」单独出现不同（后者没有日期锚点，给时刻才是编造）。
       * 既然日期锚点明确，时段小时照常应用，不受「时段名单独转换」开关限制；
       * 只有**没有日期锚点**的裸时段词才需要那个开关把关。
       */
      const dp2 = splitDaypartTail(sw.rest) || splitDaypart(sw.rest);
      if (dp2 && !String(dp2.rest || '').trim()) {
        d.setHours(daypartHour(dp2.key, pluginSettingsForParse), 0, 0, 0);
        return d;
      }
      // 剩余部分既不是时刻也不是时段（如「明天天气」）→ 不认，避免误判
      return null;
    }
    /*
     * 词根自带时段（明晚 / 今早 / 昨夜）：同样有日期锚点，直接给时段小时。
     * 「昨夜」= 昨天 23:00 而不是昨天的当前时刻，这才是「夜」的意思。
     */
    if (sw.daypart) {
      d.setHours(daypartHour(sw.daypart, pluginSettingsForParse), 0, 0, 0);
    }
    return d;
  }

  // ---- 2) 时段名 + 时刻：早上8点 / 晚上7点半 / 凌晨2点 ----
  // 时段单独出现（如「早上」）默认不转换，见 convertDaypartAlone()
  const dp = splitDaypart(raw);
  if (dp) {
    if (dp.rest) {
      const clock = parseClockCN(dp.rest, dp.key);
      if (clock) return withClock(now0, clock.hour, clock.minute, 0);
      return null;
    }
    if (convertDaypartAlone(pluginSettingsForParse)) {
      const h = daypartHour(dp.key, pluginSettingsForParse);
      return withClock(now0, h, 0, 0);
    }
    // 未开启单独转换时，时段词单独出现不识别（避免编造时刻）
    return null;
  }

  /*
   * ---- 2a) 纯时刻：8点 / 8点半 / 十点一刻 ----
   * 没有日期锚点，落在**基准日**（没基准就是今天）。
   * 12/24 小时制按 24 小时制理解：中文说「8点」默认是早上，
   * 真要指晚上会写「晚上8点」或「20点」，那时段/数字本身就写明了。
   */
  const bare = parseClockCN(raw);
  if (bare) return withClock(now0, bare.hour, bare.minute, 0);

  // ---- 2b) 纯英文口语（yesterday / next week …）----
  const w = WORD_REL.find((item) => item.re.test(raw));
  if (w) {
    let sign = 1;
    if (w.dirFromWord) sign = /^last/i.test(raw) ? -1 : 1;
    const d = new Date(now0.getTime());
    if (w.y) d.setFullYear(d.getFullYear() + sign * w.y);
    if (w.m) d.setMonth(d.getMonth() + sign * w.m);
    if (w.d) d.setDate(d.getDate() + sign * w.d);

    // 星期几 / 月底月初 / 固定月日
    // 「周末」的 wd 只是占位，真实值按用户在「时间口径」里选的来
    if (w.wd) {
      return resolveWeekday(d, w.weekend ? weekendDay(pluginSettingsForParse) : w.wd,
        w.wo || 0, pluginSettingsForParse);
    }
    if (w.monthEnd || w.monthStart) return monthEdge(d, w);
    if (w.fixedMonth) {
      d.setMonth(w.fixedMonth - 1);
      d.setDate(w.fixedDay);
      return d;
    }
    // 英文时段（this morning / last night …）
    if (w.daypart && convertDaypartAlone(pluginSettingsForParse)) {
      const h = daypartHour(w.daypart, pluginSettingsForParse);
      return withClock(d, h, 0, 0);
    }
    return d;
  }

  // ---- 2c) 英文句式：in 3 days / 3 days ago / in two weeks ----
  const enw = parseEnglishWeekday(raw);
  if (enw) return setWeekday(now0, enw.wd, enw.wo);

  const en = parseEnglishRelative(raw);
  if (en) return shiftByUnit(now0, en.unit, en.n, en.dir);

  // ---- 2d) 特殊量词：半小时后 / 一刻钟后 / 半天后 ----
  const hm = HALF_RE.exec(raw);
  if (hm) {
    const dir = /前/.test(hm[2] || '') ? -1 : 1;
    const word = hm[1];
    if (word.indexOf('刻') >= 0) return shiftByUnit(now0, '分钟', 15, dir);
    if (word.indexOf('半天') >= 0) return shiftByUnit(now0, '小时', 12, dir);
    // 半小时 / 半 → 30 分钟
    return shiftByUnit(now0, '分钟', 30, dir);
  }

  // ---- 3) 倒装：前两天 / 前三天 / 上一周 ----
  const pm = REL_PREFIX_RE.exec(raw);
  if (pm) {
    const pn = parseCNNumber(pm[2]);
    if (pn !== null && isFinite(pn)) return shiftByUnit(now0, pm[3], pn, -1);
  }

  /*
   * ---- 3b) 「过N天」：过两天 / 过三天 / 再过三天 ----
   * 方向固定是往后，所以单独一条，不塞进 REL_PREFIX_RE（那是往前）。
   * 刻意不收「过几天」：几是模糊量，转成具体日期等于编造。
   */
  const gm = GUO_RE.exec(raw);
  if (gm) {
    const gn = parseCNNumber(gm[1]);
    if (gn !== null && isFinite(gn)) return shiftByUnit(now0, gm[2], gn, 1);
  }

  // ---- 3c) 复合时长：一年零三天后 / 两年零一个月后 ----
  const zm = ZERO_RE.exec(raw);
  if (zm) {
    const ny = /^[\d.]+$/.test(zm[1]) ? Number(zm[1]) : parseCNNumber(zm[1]);
    const n2 = /^[\d.]+$/.test(zm[2]) ? Number(zm[2]) : parseCNNumber(zm[2]);
    if (ny !== null && n2 !== null && isFinite(ny) && isFinite(n2)) {
      const dir = zm[4] === '前' ? -1 : 1;
      const d = shiftByUnit(now0, '年', ny, dir);
      return d ? shiftByUnit(d, zm[3], n2, dir) : null;
    }
  }

  // ---- 4) 数量 + 单位：3天前 / 7天以后 / 二天后 / 两天后 / 第7天后 ----
  const m = REL_RE.exec(raw);
  if (!m) return null;

  /*
   * 「2026年」是**年份**，不是「2026 年后」——
   * 不拦会算出 4052 年这种离谱结果（实测发生过）。
   * 判据：单位是「年」且是四位数。说「3 年后」不会写成「2026年后」，
   * 四位数在「年」前面几乎必然是年份。
   */
  if (m[2] === '年' && /^\d{4}$/.test(m[1])) return null;

  /*
   * 数量既可能是中文（两天后），也可能是**小数**（1.5小时后）。
   * 中文数字解析器不吃小数点，所以阿拉伯数字走 Number，
   * 中文才交给 parseCNNumber —— 混在一起会让 1.5 解析成 null 而整条失败。
   */
  const n = /^[\d.]+$/.test(m[1]) ? Number(m[1]) : parseCNNumber(m[1]);
  if (n === null || !isFinite(n)) return null;
  if (!isFinite(n)) return null;
  return shiftByUnit(now0, m[2], n, (m[4] || '').indexOf('前') >= 0 ? -1 : 1);
}

/** 按单位推进时间；月/年走日历加法，避免固定天数在月末、闰年出错 */
function shiftByUnit(now, unit, n, dir) {
  const d = new Date(now.getTime());
  if (unit === '秒') return new Date(d.getTime() + dir * n * 1000);
  if (unit === '分钟' || unit === '分') return new Date(d.getTime() + dir * n * 60000);
  if (unit === '小时' || unit === '时') return new Date(d.getTime() + dir * n * 3600000);
  if (unit === '天' || unit === '日') return new Date(d.getTime() + dir * n * 86400000);
  if (unit === '周' || unit.indexOf('星期') >= 0) {
    return new Date(d.getTime() + dir * n * 7 * 86400000);
  }
  if (unit.indexOf('刻') >= 0) {
    return new Date(d.getTime() + dir * n * 15 * 60000);
  }
  if (unit.indexOf('月') >= 0) {
    d.setMonth(d.getMonth() + dir * n);
    return d;
  }
  if (unit === '年') {
    d.setFullYear(d.getFullYear() + dir * n);
    return d;
  }
  return null;
}

/**
 * 解析「节气 → 日期」的请求：立春 / 2026年立春 / 2027 立春。
 * @returns {{year:number,index:number,name:string}|null}
 */
function parseTermRequest(text, base) {
  const s = String(text ?? '').trim();
  if (!s) return null;

  /*
   * 年份先剥掉，剩下的必须**恰好等于**某个节气名。
   * 用 indexOf 模糊搜会把「清明上河图」「冬至饺子」这类含节气字的
   * 普通文本也算成节气日期 —— 宁可不认，也不要编一个日期出来。
   */
  let year = null;
  const ym = /^(\d{4})\s*年?/.exec(s);
  let rest = s;
  if (ym) {
    year = Number(ym[1]);
    rest = s.slice(ym[0].length).trim();
  }
  const index = lunar.SOLAR_TERMS.indexOf(rest);
  if (index < 0) return null;
  if (year === null || !isFinite(year)) {
    year = (base ? base.getFullYear() : new Date().getFullYear());
  }

  /*
   * 节气跨月：第 n 个节气落在第 floor(n/2)+1 月（小寒、大寒在 1 月）。
   * 具体是几号由 termDay 用天文黄经算，不是查固定表，闰年也不偏。
   */
  const day = lunar.termDay(year, index);
  const date = day > 0 ? safeDate(year, Math.floor(index / 2) + 1, day) : null;
  return { year, index, name: lunar.SOLAR_TERMS[index], date };
}

/**
 * 解析干支：丙午 / 丙午年 / 丙午马年。
 * 干支 60 年一轮，返回**最接近今年**的公历年份。
 * @returns {{year:number,gan:string,zhi:string,animal:string}|null}
 */
function parseGanzhi(text) {
  const s = String(text ?? '').trim();
  const m = /^([甲乙丙丁戊己庚辛壬癸])([子丑寅卯辰巳午未申酉戌亥])(?:年)?(?:[鼠牛虎兔龙蛇马羊猴鸡狗猪]年?)?$/.exec(s);
  if (!m) return null;

  const gi = lunar.GAN.indexOf(m[1]);
  const zi = lunar.ZHI.indexOf(m[2]);
  if (gi < 0 || zi < 0) return null;

  // 天干 10 与地支 12 的最小公倍数约束：奇偶必须一致才构成有效干支
  if (gi % 2 !== zi % 2) return null;

  const thisYear = new Date().getFullYear();
  let best = null;
  let bestGap = Infinity;
  for (let y = lunar.MIN_YEAR; y <= lunar.MAX_YEAR; y++) {
    if ((y - 4) % 10 !== gi || (y - 4) % 12 !== zi) continue;
    const gap = Math.abs(y - thisYear);
    if (gap < bestGap) { bestGap = gap; best = y; }
  }
  if (best === null) return null;
  return { year: best, gan: m[1], zhi: m[2], animal: lunar.zodiac(best) };
}

/* ------------------------------------------------------------------ *
 * 转换计算：纯函数，输入文本 + 配置，输出字符串或 null
 * ------------------------------------------------------------------ */

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 相对时间：3 天前 / 2 小时后。
 *
 * @param {Date} date 目标时间
 * @param {Date} [base] 基准时间，留空用「现在」。
 *   必须能指定基准，否则「3 天前」的含义会随查看时刻变化 ——
 *   笔记里写下的相对描述过几天再看就对不上了。
 * @param {boolean} [withNote] 是否在结果里附上「（相对 …）」的说明
 */
function toRelative(date, base, withNote) {
  const baseMs = base ? base.getTime() : Date.now();
  const diffMs = date.getTime() - baseMs;
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;
  const suffix = future ? '后' : '前';

  let text;
  const mins = Math.round(abs / 60000);
  if (mins < 1) text = '刚刚';
  else if (mins < 60) text = `${mins} 分钟${suffix}`;
  else {
    const hours = Math.round(abs / 3600000);
    if (hours < 24) text = `${hours} 小时${suffix}`;
    else {
      const days = Math.round(abs / 86400000);
      if (days < 30) text = `${days} 天${suffix}`;
      else {
        const months = Math.round(days / 30);
        if (months < 12) text = `${months} 个月${suffix}`;
        else text = `${Math.round(days / 365)} 年${suffix}`;
      }
    }
  }

  if (!withNote) return text;

  /*
   * 基准说明：留空时必须带上当前时刻。
   * 只写「（相对 现在）」的话，笔记过几天回看就不知道"现在"是哪天了 ——
   * 相对描述会彻底失去参照。
   */
  const note = base
    ? fmt(null, base, 'YYYY-MM-DD HH:mm')
    : `现在 ${fmt(null, new Date(), 'YYYY-MM-DD HH:mm')}`;
  return `${text}（相对 ${note}）`;
}

/** 用插件统一的 moment 格式化，格式非法时降级为原始 ISO */
/**
 * 把格式串里的秒去掉（不精确到秒时）。
 * 只处理 moment 的秒标记 ss / s / SSS / S，其余原样保留。
 * 放在这里是为了让所有输出统一降精度：新增格式会自动遵循，不用逐个改。
 */
function dropSeconds(format) {
  return String(format)
    .replace(/ss/g, '')
    .replace(/(^|[^A-Za-z])s(?![A-Za-z])/g, '$1')
    .replace(/S+/g, '')
    .replace(/秒/g, '')      // 中文格式里的「秒」字一并去掉，否则会留下孤字
    .replace(/\s+$/, '')
    .trim()
    // 去掉秒后可能留下 : . - 之类的孤零零分隔符，循环清掉尾部
    .replace(/[\s:：.,，、\-]+$/g, '');
}

/**
 * 统一格式化出口。
 * 精度开关在这里生效：关闭「精确到秒」时，连用户自定义格式里的秒也会被去掉，
 * 避免「明明关了却还有秒」的不一致感。
 */
function fmt(plugin, date, format) {
  let f = String(format ?? '');
  const ts = plugin && plugin.settings && plugin.settings.timestamp;
  const ext = ts && ts.extensions;
  if (ext && ext.preciseToSecond === false) f = dropSeconds(f);

  try {
    const out = obsidian.moment(date.getTime()).format(f);
    return out && out !== 'Invalid date' ? out : date.toISOString();
  } catch (e) {
    return date.toISOString();
  }
}

/** 计算单个转换项的结果；算不出来返回 null */
/* ================= 撤回标记（可点击，仅内存） ================= */
/*
 * 转换后在结果后面挂一个**可点击**的标记，点一下还原成原格式。
 *
 * 为什么不用「把标记写进正文」：
 *   正文里的字符会随笔记一起保存，关闭 Obsidian 后标记还在，
 *   但还原所需的原文只存在内存——那时点击就是个死标记。
 * 所以标记必须是**编辑器的装饰（widget）**，不占正文字符，
 * 关闭 Obsidian 后自然消失，与内存数据的生命周期一致。
 *
 * 数据红线：只在内存，不写 data.json，插件卸载 / 关闭时全部清除。
 * 双重限量防膨胀：每篇笔记 100 个、最多 50 篇，超出清最旧的。
 */
const UNDO_PER_NOTE = 100;
const UNDO_MAX_NOTES = 50;
/** id → 记录 */
const undoMarks = new Map();
/** 笔记路径 → 记录数组（按插入顺序） */
const undoByNote = new Map();
let undoSeq = 0;

/** 当前笔记路径（取不到就用 '__unknown__'） */
function currentNotePath(app) {
  try {
    const f = app && app.workspace && app.workspace.getActiveFile && app.workspace.getActiveFile();
    return (f && f.path) || '__unknown__';
  } catch (e) {
    return '__unknown__';
  }
}

/** 清掉一条记录的装饰并移除索引（不动正文） */
function disposeUndo(rec) {
  if (!rec) return;
  try { if (rec.textMark) rec.textMark.clear(); } catch (e) { /* 已失效 */ }
  try { if (rec.widgetMark) rec.widgetMark.clear(); } catch (e) { /* 已失效 */ }
  // CM6：发删除 effect 撤掉装饰
  if (rec.view && rec.markId && CM6.delEffect) {
    try { rec.view.dispatch({ effects: CM6.delEffect.of(rec.markId) }); } catch (e) { /* 已失效 */ }
  }
  undoMarks.delete(rec.id);
}

/* ================= 撤回记录（纯内存，不依赖任何编辑器 API） ================= */
/*
 * 这一层**必须独立于装饰存在**。
 *
 * 之前把「记录」写在「装饰成功」之后，结果 CM6 装饰在当前环境挂不上时，
 * 记录也跟着没写 —— 撤回命令和按钮**一起失效**，用户连退路都没有
 * （v2.32.0 实测：提示「这篇笔记没有可撤回的时间转换了」）。
 *
 * 正确顺序：先记录（纯内存，永不失败），再尝试挂装饰（失败也无妨）。
 * 撤回定位只用 Obsidian 的 editor 接口（getLine / setSelection / replaceSelection），
 * 不碰 CodeMirror，所以一定能用。
 */
function recordUndoEntry(plugin, entry) {
  const path = currentNotePath(plugin.app);
  const rec = {
    id: ++undoSeq,
    path,
    /*
     * 保存 editor 引用：点击按钮时不一定能取到「当前活动编辑器」
     * （焦点可能在弹窗/别的面板上），靠它才不会定位到错的笔记。
     */
    editor: entry.editor || null,
    line: entry.line,
    fromCh: entry.fromCh,      // 结果文本起始列（可能随编辑偏移，仅作起点）
    searchText: entry.searchText, // 结果文本（含追加模式的前导空格）
    replaceWith: entry.replaceWith, // 原格式（覆盖模式）或 ''（追加模式）
    /*
     * original：撤回后要还原成的文本（== replaceWith）。
     * 之前这个字段只在 attachUndoWidget 的参数里传、**从不落进记录**，
     * 而 cm6Restore 恰好读 rec.original —— CM6 路径撤回会插入 undefined。
     */
    original: entry.original != null ? entry.original : entry.replaceWith,
    markId: null,              // 装饰 id（挂上了才有）
    view: null,
    textMark: null,
    widgetMark: null,
  };
  undoMarks.set(rec.id, rec);

  let list = undoByNote.get(path);
  if (!list) { list = []; undoByNote.set(path, list); }
  list.push(rec);
  while (list.length > UNDO_PER_NOTE) disposeUndo(list.shift());
  while (undoByNote.size > UNDO_MAX_NOTES) {
    const oldestKey = undoByNote.keys().next().value;
    const oldest = undoByNote.get(oldestKey) || [];
    while (oldest.length) disposeUndo(oldest.pop());
    undoByNote.delete(oldestKey);
  }
  return rec;
}

/**
 * 撤回一条记录：按「行号 + 文本查找」定位，只走 Obsidian editor 接口。
 * 先按记录列号找，找不到就整行找 —— 前面插入过文字时列号会偏，
 * 但文本是唯一的，所以整行兜底能救回来。
 */
function restoreEntry(plugin, editor, rec) {
  const line = typeof editor.getLine === 'function' ? editor.getLine(rec.line) : null;
  if (typeof line !== 'string') return false;

  let start = -1;
  if (typeof rec.fromCh === 'number' && rec.fromCh <= line.length) {
    if (line.indexOf(rec.searchText, rec.fromCh) === rec.fromCh) start = rec.fromCh;
  }
  if (start < 0) {
    /*
     * 整行兜底**必须唯一**：命中多处时拒绝执行。
     *
     * 之前取第一个匹配就动手 —— 撤回前面一条后，后面记录的 fromCh 会失效，
     * 一旦行里还有另一处相同文本（比如两处转换结果一样），
     * 替换就落到**错误的那一处**，正文被改坏且不可逆（BUG-1）。
     * 「改错地方」比「撤回失败」严重得多，所以宁可失败。
     */
    const first = line.indexOf(rec.searchText);
    if (first >= 0 && line.indexOf(rec.searchText, first + 1) < 0) start = first;
  }
  if (start < 0) return null;

  editor.setSelection(
    { line: rec.line, ch: start },
    { line: rec.line, ch: start + rec.searchText.length }
  );
  editor.replaceSelection(rec.replaceWith);
  // 返回实际落点与长度差，供调用方校正后续记录（BUG-1 偏移校正）
  return { start, delta: rec.replaceWith.length - rec.searchText.length };
}

/**
 * 撤回一条后，校正**同一行、其后**所有记录的列号。
 *
 * 替换会让该行长度变化 delta，排在后面的记录 fromCh 全部失效。
 * 不校正就只能靠整行 indexOf 兜底 —— 行内有重复文本时会命中错误位置。
 */
function shiftUndoRecords(rec, delta) {
  if (!delta || !rec) return;
  const list = undoByNote.get(rec.path);
  if (!list) return;
  for (const r of list) {
    if (r === rec || r.line !== rec.line) continue;
    if (typeof r.fromCh === 'number' && r.fromCh > rec.fromCh) r.fromCh += delta;
  }
}

/** 取出 CodeMirror 实例；拿不到就挂不了标记 */
function cmOf(editor) {
  if (!editor) return null;
  return editor.cm || (editor.getDoc && editor.getDoc().cm) || null;
}

/* ================= CM6 撤回标记 ================= */
/*
 * Obsidian 1.x 用的是 **CodeMirror 6**，editor.cm 是 EditorView，
 * **没有 markText**（那是 CM5 的 API）。上一版只用 CM5 写法，
 * 结果在真实环境里 attachUndoWidget 直接失败、标记永远不显示 —— 实测确认。
 *
 * CM6 要在编辑器里显示装饰，必须：
 *   1. 用 @codemirror/state 定义 StateField + StateEffect
 *   2. 用 @codemirror/view 的 Decoration / WidgetType 造 DOM
 *   3. 通过 plugin.registerEditorExtension 注册（load 阶段）
 *   4. 用 view.dispatch({ effects }) 增删
 * 装饰会随文档改动自动 map，所以位置不用自己维护。
 */
let cm6 = null; // null=未尝试 false=不可用 {state, view}
function loadCm6() {
  if (cm6 !== null) return cm6;
  try {
    cm6 = {
      state: require('@codemirror/state'),
      view: require('@codemirror/view'),
    };
  } catch (e) {
    // 环境里没有 CM6（如测试沙盒），退回 CM5 写法
    cm6 = false;
    setUndoFail('无法 require @codemirror/state 或 @codemirror/view', e);
  }
  return cm6;
}

const CM6 = {
  field: null,
  addEffect: null,
  delEffect: null,
  built: false,
};

/** 构建 CM6 扩展；返回可直接 registerEditorExtension 的数组 */
function buildCm6Extension() {
  const m = loadCm6();
  if (!m) return null;
  /*
   * 缓存只在**成功**时生效。
   * 之前无条件 return 缓存，导致首次构建失败（如 WidgetType 还没拿到）
   * 后永远返回 undefined —— 后续转换全都不显示图标（实测踩过）。
   */
  if (CM6.built && CM6.field) return [CM6.field];
  try {
    CM6.addEffect = m.state.StateEffect.define();
    CM6.delEffect = m.state.StateEffect.define();
    const addEffect = CM6.addEffect;
    const delEffect = CM6.delEffect;

    CM6.field = m.state.StateField.define({
      create() {
        return m.view.Decoration.none;
      },
      update(deco, tr) {
        // 先随文档改动平移，再套用本次的增删
        deco = deco.map(tr.changes);
        for (const e of tr.effects) {
          if (e.is(addEffect)) {
            const v = e.value;
            const mark = m.view.Decoration.mark({
              class: 'tt-undo-target',
              undoId: v.id,
            }).range(v.from, v.to);
            const badge = m.view.Decoration.widget({
              widget: new UndoBadgeWidget(v.recId, v.original, v.symbol),
              side: 1,
              undoId: v.id,
            }).range(v.to);
            deco = deco.update({ add: [mark, badge], sort: true });
          } else if (e.is(delEffect)) {
            deco = deco.update({
              filter: (f, t, d) => !(d.spec && d.spec.undoId === e.value),
            });
          }
        }
        return deco;
      },
      provide: (f) => m.view.EditorView.decorations.from(f),
    });
    UndoBadgeWidget = makeUndoBadgeClass(m.view);
    CM6.built = true;
    return [CM6.field];
  } catch (e) {
    console.error('[Time Tools] CM6 扩展构建失败', e);
    return null;
  }
}

/** 撤回标记的固定图标（Obsidian 内置，不依赖字体、不可自定义） */
const UNDO_ICON = 'lucide-undo-2';

/*
 * 最后一次挂载失败的原因。
 * 之前失败只打 console.error，界面上看不到 —— 用户只能看到「图标没出现」，
 * 无从判断是模块没拿到、扩展没注册上、还是位置算错。现在记进 lastUndoFailReason，
 * 由测试断言（不再弹窗口占用命令面板）。
 */
let lastUndoFailReason = '';
function setUndoFail(reason, err) {
  lastUndoFailReason = reason + (err && err.message ? '（' + err.message + '）' : '');
}

/*
 * 撤回用的插件实例。
 * widget 的 toDOM() 拿不到 plugin（它只在 CM6 内部被构造），
 * 点击时又必须调用插件的撤回逻辑，所以在这里存一份。
 */
/**
 * 取扩展配置，带三层防御判空。
 * 为什么不直接写 settings.timestamp.extensions：配置可能来自旧版本、
 * 迁移失败或部分损坏，任一层缺失都会让解析抛错，
 * 而解析失败的表现是「面板空白」，很难定位。统一走这里最稳。
 */
function extOf(settings) {
  const ts = settings && settings.timestamp;
  return (ts && ts.extensions) || null;
}

let undoHostPlugin = null;

/* ================= 状态栏撤回指示器 ================= */
/*
 * 为什么必须有它：
 *   结果后面的图标依赖 CM6 装饰，在部分环境挂不上（已连着几版没出来）。
 *   而**命令**虽然一定能用，但藏得深、没有可见入口 ——
 *   用户看不到「现在有几处可以撤回」，也容易以为功能没生效。
 *
 * 状态栏指示器只用 Obsidian 自带 API，**不依赖任何编辑器装饰**，
 * 所以 100% 能显示。它同时充当：
 *   · 可见的撤回入口（点击撤最近一次）
 *   · 数量提示（当前笔记还有几处可撤回）
 */
let undoStatusEl = null;

function initUndoIndicator(plugin) {
  if (typeof plugin.addStatusBarItem !== 'function') return;
  try {
    undoStatusEl = plugin.addStatusBarItem();
    undoStatusEl.addClass('tt-undo-status');
    undoStatusEl.setAttribute('title', '点击撤回最近一次时间转换');
    undoStatusEl.addEventListener('click', () => {
      undoLast(plugin);
    });
    refreshUndoIndicator(plugin);
  } catch (e) {
    undoStatusEl = null;
  }
}

/** 刷新指示器：开关关闭或没有可撤回项时隐藏 */
function refreshUndoIndicator(plugin) {
  if (!undoStatusEl) return;
  const ext = plugin && plugin.settings && plugin.settings.timestamp
    ? plugin.settings.timestamp.extensions : null;
  // 两个开关都要满足：总开关 + 撤回开关。以前只看后者，关了总开关状态栏数字还在
  const on = extEnabled(plugin) && ext && ext.undoHintEnabled !== false;
  const n = on ? undoCount(plugin) : 0;
  if (!n) {
    undoStatusEl.style.display = 'none';
    return;
  }
  undoStatusEl.style.display = '';
  undoStatusEl.empty();
  undoStatusEl.createSpan({ cls: 'tt-undo-status-icon' });
  undoStatusEl.createSpan({ text: String(n) });
  try {
    obsidian.setIcon(undoStatusEl.querySelector('.tt-undo-status-icon'), UNDO_ICON);
  } catch (e) { /* 无 setIcon 时退化成纯数字 */ }
}

/** 撤回标记的 widget（CM6） */
class UndoBadgeWidgetBase {
  constructor(id, original, symbol) {
    this.id = id;
    this.original = original;
    this.symbol = symbol;
  }
  eq(other) {
    return other.id === this.id && other.original === this.original;
  }
  toDOM() {
    const span = document.createElement('span');
    span.className = 'tt-undo-badge';
    span.setAttribute('title', '点击撤回为原格式：' + this.original);
    span.setAttribute('contenteditable', 'false');
    /*
     * 用 Obsidian 内置图标（SVG）而不是自定义字符。
     * 自定义字符依赖字体，缺字形时**什么都不显示**，
     * 表现为「开关开着但没符号」（实测踩过）。SVG 不依赖字体。
     */
    try {
      obsidian.setIcon(span, UNDO_ICON);
    } catch (e) {
      span.textContent = '\u21a9'; // 兜底：还是画不出来就退回字符
    }
    span.addEventListener('click', (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (ev && ev.stopPropagation) ev.stopPropagation();
      /*
       * 必须走 restoreUndo（记录层），不能直接 cm6Restore（装饰层）。
       * this.id 是**记录 id**，而装饰的 undoId 是**装饰 id**，两者不同 ——
       * 直接 cm6Restore 会按记录 id 去找装饰，找不到就放弃，
       * 表现为「点了没反应，且记录被清掉」（实测）。
       * restoreUndo 内部先走记录层（行号+文本），失败才退回装饰层。
       */
      restoreUndo(undoHostPlugin, this.id);
    });
    return span;
  }
  ignoreEvent() {
    return false; // 需要接收点击
  }
}

/*
 * 真实 CM6 会检查 widget 的类型，用鸭子类型不保险，
 * 必须在拿到 WidgetType 基类后动态继承。拿不到就退回鸭子类型
 * （至少 toDOM / eq 齐全，多数场景仍可用）。
 */
function makeUndoBadgeClass(viewMod) {
  const Base = viewMod && viewMod.WidgetType ? viewMod.WidgetType : Object;
  return class extends Base {
    constructor(id, original, symbol) {
      super();
      this.id = id;
      this.original = original;
      this.symbol = symbol;
    }
    eq(other) { return other && other.id === this.id && other.original === this.original; }
    toDOM() { return UndoBadgeWidgetBase.prototype.toDOM.call(this); }
    ignoreEvent() { return false; }
  };
}
let UndoBadgeWidget = UndoBadgeWidgetBase;

/**
 * 把 Obsidian 的 {line, ch} 位置转成 CM6 的**数字偏移**。
 * CM6 的 doc API 用的是整数偏移，直接传 {line,ch} 对象会导致
 * 比较、切片全部失效（区间查不到 → 点了没反应）。
 */
function cm6Pos(view, pos) {
  if (typeof pos === 'number') return pos;
  if (!pos || typeof pos.line !== 'number') return 0;
  try {
    const doc = view.state.doc;
    const n = Math.min(Math.max(pos.line + 1, 1), doc.lines);
    const line = doc.line(n);
    const ch = typeof pos.ch === 'number' ? pos.ch : 0;
    return Math.max(line.from, Math.min(line.from + ch, line.to));
  } catch (e) {
    return 0;
  }
}

/** CM6：取当前文档里某个 undoId 的 mark 区间 */
function cm6RangeOf(view, id) {
  let range = null;
  try {
    const set = view.state.field(CM6.field);
    set.between(0, view.state.doc.length, (from, to, deco) => {
      if (!range && deco.spec && deco.spec.undoId === id && to > from) {
        range = { from, to };
      }
    });
  } catch (e) { /* 字段不存在 */ }
  return range;
}

/** CM6：还原某条记录 */
function cm6Restore(id) {
  const rec = undoMarks.get(id);
  if (!rec || !rec.view) return false;
  const view = rec.view;
  /*
   * 装饰的 undoId 是**装饰 id**（rec.markId），不是记录 id。
   * 用记录 id 去找装饰永远找不到 —— 之前就是这么错的。
   */
  const markId = rec.markId != null ? rec.markId : id;
  const range = cm6RangeOf(view, markId);
  if (!range) {
    // 装饰已失效，清掉记录即可
    try { view.dispatch({ effects: CM6.delEffect.of(markId) }); } catch (e) { /* 已失效 */ }
    return false;
  }
  // original 可能为空串（追加模式），空串是合法值，只能用 != null 判断
  const back = rec.original != null ? rec.original : rec.replaceWith;
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: back },
    effects: CM6.delEffect.of(markId),
  });
  disposeUndo(rec);
  removeFromNoteList(rec);
  try {
    new obsidian.Notice('已撤回为原格式');
  } catch (e) { /* 环境无 Notice */ }
  return true;
}

/**
 * 在结果后面挂一个可点击的撤回标记。
 * 优先 CM6（Obsidian 1.x 实际用的），拿不到再退 CM5。
 * 返回是否成功；失败时静默——绝不往正文写字符。
 */
function attachUndoWidget(plugin, editor, from, to, original, markText, rec) {
  if (plugin) undoHostPlugin = plugin;
  // 总开关关闭时不挂撤回标记（以前只判撤回开关，关了总开关装饰照样挂）
  if (!extEnabled(plugin)) return false;
  const m = loadCm6();
  const view = editor && editor.cm;

  // ---- CM6 ----
  if (m && CM6.built && view && typeof view.dispatch === 'function' && view.state) {
    try {
      /*
       * 幂等：同一条记录重复挂装饰前先清掉旧的。
       * 之前无条件 add，同一 rec 挂两次就会有两个 widget ——
       * 表现是「越早的转换图标越多」（BUG-1 症状一）。
       */
      if (rec && rec.markId != null && CM6.delEffect) {
        try { view.dispatch({ effects: CM6.delEffect.of(rec.markId) }); } catch (e) { /* 已失效 */ }
      }
      const id = ++undoSeq;
      // CM6 用数字偏移，先把 {line, ch} 转过去
      const fromPos = cm6Pos(view, from);
      const toPos = cm6Pos(view, to);
      if (toPos <= fromPos) return false;
      view.dispatch({
        effects: CM6.addEffect.of({
          id, from: fromPos, to: toPos, original, symbol: markText,
          recId: rec ? rec.id : id, // widget 点击要回到记录 id
        }),
      });
      /*
       * 自检：dispatch 不报错不代表装饰生效 ——
       * field 没注册到这个 view 时 effect 会被直接忽略，静默失败。
       * 这里立刻回读一次，确认装饰真的在，否则报错便于定位。
       */
      const ok = cm6RangeOf(view, id);
      if (!ok) {
        setUndoFail('装饰未写入（registerEditorExtension 未生效或 CM6 版本不匹配）');
        console.error('[Time Tools] 撤回标记未生效：装饰未写入');
        return false;
      }
      // 记录已由调用方写入，这里只回填装饰信息，用于后续清除
      if (rec) {
        rec.markId = id;   // 装饰 id，用于清除装饰
        rec.view = view;
        // widget 点击要回到**记录 id**，否则 undoMarks 查不到（实测踩过）
        rec.widgetId = rec.id;
      }
      return true;
    } catch (e) {
      setUndoFail('CM6 挂载异常', e);
      console.error('[Time Tools] CM6 撤回标记挂载失败', e);
      return false;
    }
  }

  // ---- CM5（老版本 / 测试环境）----
  const cm = cmOf(editor);
  if (!cm || typeof cm.markText !== 'function') {
    setUndoFail('CM6 不可用且编辑器无 markText（CM5 API）');
    return false;
  }
  if (typeof document === 'undefined' || !document.createElement) return false;
  try {
    const id = ++undoSeq;
    const btn = document.createElement('span');
    btn.className = 'tt-undo-badge';
    btn.setAttribute('title', '点击撤回为原格式：' + original);
    try {
      obsidian.setIcon(btn, UNDO_ICON);
    } catch (e) {
      btn.textContent = '\u21a9';
    }
    btn.setAttribute('data-tt-undo', String(id));
    btn.setAttribute('contenteditable', 'false');

    const textMark = cm.markText(from, to, { className: 'tt-undo-target' });
    const widgetMark = cm.markText(to, to, { replacedWith: btn });
    if (rec) {
      rec.markId = id;
      rec.cm = cm;
      rec.textMark = textMark;
      rec.widgetMark = widgetMark;
    }
    // 点击要回到**记录 id**，不能用装饰 id —— 两者不同，查不到记录（实测踩过）
    const restoreId = rec ? rec.id : id;
    btn.addEventListener('click', (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (ev && ev.stopPropagation) ev.stopPropagation();
      restoreUndo(plugin, restoreId);
    });
    return true;
  } catch (e) {
    setUndoFail('CM5 挂载异常', e);
    console.error('[Time Tools] 撤回标记挂载失败', e);
    return false;
  }
}

/**
 * 还原一条。
 * 优先走**记录层**（行号 + 文本查找，纯 Obsidian editor 接口，一定能用）；
 * 记录层定位不到（文本已被别处改掉）时，才退回装饰层的位置信息。
 */
function restoreUndo(plugin, id, editor) {
  const rec = undoMarks.get(id);
  if (!rec) return false;

  const ed = editor || rec.editor || activeEditor(plugin.app);
  let res = null;
  if (ed && typeof ed.getLine === 'function') {
    res = restoreEntry(plugin, ed, rec);
  }
  if (!res && rec.view) {
    if (cm6Restore(id)) res = { start: -1, delta: 0 }; // CM6 自行改文档，无偏移可校
  }
  if (!res && rec.cm && rec.textMark && rec.textMark.find) {
    const pos = rec.textMark.find();
    if (pos) {
      const back = rec.original != null ? rec.original : rec.replaceWith;
      rec.cm.replaceRange(back, pos.from, pos.to);
      res = { start: -1, delta: 0 };
    }
  }
  if (!res) {
    /*
     * 定位失败时**不再清记录**，只标记 unresolvable。
     *
     * 旧行为是「清掉记录，别留死按钮」——那是为**顺序撤回**设计的：
     * 最后一条撤完本就该清。但乱序撤回时，清掉的是**还没撤的中间记录**，
     * 等于那处转换永久不可逆（BUG-1 症状二）。
     * 保留后：记录数不变、状态栏 N 不变、unresolvable 计数里可见，文本若被改回来仍能撤。
     */
    rec.unresolvable = true;
    refreshUndoIndicator(plugin);
    return false;
  }
  if (res.delta) shiftUndoRecords(rec, res.delta);
  disposeUndo(rec);
  removeFromNoteList(rec);
  refreshUndoIndicator(plugin);
  try {
    new obsidian.Notice('已撤回为原格式');
  } catch (e) { /* 环境无 Notice */ }
  return true;
}

function removeFromNoteList(rec) {
  const list = undoByNote.get(rec.path);
  if (!list) return;
  const i = list.indexOf(rec);
  if (i >= 0) list.splice(i, 1);
  if (!list.length) undoByNote.delete(rec.path);
}

/** 撤回当前笔记最近一次转换（命令入口） */
function undoLast(plugin, editor) {
  const path = currentNotePath(plugin.app);
  const list = undoByNote.get(path);
  if (!list || !list.length) return false;
  return restoreUndo(plugin, list[list.length - 1].id, editor);
}

/** 当前笔记还有多少处可撤回 */
function undoCount(plugin) {
  const list = undoByNote.get(currentNotePath(plugin.app));
  return list ? list.length : 0;
}

/**
 * 有多少条记录**定位不到**（标记了 unresolvable）。
 * 这些仍占用计数、不删除 —— 乱序撤回时清掉它们会让那处转换永久不可逆。
 */
function unresolvableUndoCount() {
  let n = 0;
  undoMarks.forEach((r) => { if (r.unresolvable) n++; });
  return n;
}

/** 记录了多少篇笔记（自查用） */
function undoStackSize() {
  return undoByNote.size;
}

/** 清空（插件卸载时调用，确保不残留） */
function clearUndo(plugin) {
  undoMarks.forEach((rec) => {
    try { if (rec.textMark) rec.textMark.clear(); } catch (e) { /* 已失效 */ }
    try { if (rec.widgetMark) rec.widgetMark.clear(); } catch (e) { /* 已失效 */ }
  });
  undoMarks.clear();
  undoByNote.clear();
  if (plugin) refreshUndoIndicator(plugin);
}

/**
 * 撤回标记用哪个图标；开关关闭时返回空串（表示不挂标记）。
 * 图标**固定**，不再可自定义 —— 自定义字符缺字形时什么都不显示。
 */
function undoMarkOf(settings) {
  const ext = extOf(settings);
  if (!ext || ext.undoHintEnabled === false) return '';
  return UNDO_ICON;
}

/** 「统一格式」用的格式串；留空时跟随时间戳格式 */
function unifyFormatOf(settings) {
  const ext = extOf(settings);
  const own = ext && typeof ext.unifyFormat === 'string' ? ext.unifyFormat.trim() : '';
  if (own) return own;
  return (settings && settings.timestamp && settings.timestamp.format) || 'YYYY-MM-DD HH:mm:ss';
}

/**
 * 把一段文本解析成 Date，按「明确标记 → 农历 → 阳历 → 相对」的顺序尝试。
 * 统一格式要能吃下所有形态，所以需要这个统一入口。
 */
function resolveToDate(plugin, raw, options) {
  const settings = plugin.settings;
  const text = String(raw ?? '').trim();
  if (!text) return null;

  // 明确标了农历的先按农历算
  if (shouldTreatAsLunar(text, settings)) {
    const stripped = stripCalendarMark(text, settings).rest;
    const info = lunar.parseLunar(stripped);
    if (info) {
      const d = lunar.lunarToSolar(info.year, info.month, info.day, info.isLeap);
      if (d) return d;
    }
  }
  // 阳历 / 时间戳（含中文大写的阳历写法）
  const direct = parseToDate(text, settings);
  if (direct) return direct;

  /*
   * 节气 / 干支：这两个此前只在「转换项」里能用，选中「立春」做转换时却认不出，
   * 因为解析链里根本没有它们。表早就有了（SOLAR_TERMS、干支纪年），
   * 这里补上解析即可，不需要新增数据。
   * 农历总开关关掉时一并失效 —— 它们本就属于农历体系。
   */
  if (extOf(settings) && extOf(settings).lunarEnabled !== false) {
    const term = parseTermRequest(text, options && options.base);
    if (term && term.date) return term.date;
    const gz = parseGanzhi(text);
    if (gz && gz.year) {
      const base = options && options.base ? options.base : new Date();
      return safeDate(gz.year, base.getMonth() + 1, base.getDate());
    }
  }

  // 农历节日：大年初一 / 除夕 / 年三十
  if (extOf(settings) && extOf(settings).lunarEnabled !== false) {
    const fest = parseLunarFestival(text, options && options.base);
    if (fest) return fest;
  }

  // 相对 / 口语 / 复合
  return parseRelative(text, options && options.base, settings);
}

/*
 * 农历节日：大年初一 / 除夕 / 年三十。
 * 这几个**没有月份数字**，parseLunar 吃不下（它必须有月有日），
 * 所以在这里单独换算成「农历 X 月 Y 日」再交给 lunarToSolar。
 * 日期由天文算法算，不是查固定表 —— 「除夕」是腊月最后一天，
 * 该年腊月是 29 天还是 30 天每年不同，写死会错。
 */
function parseLunarFestival(text, base) {
  const s = String(text ?? '').trim().replace(/\s+/g, '');
  const ref = base || new Date();
  const info = lunar.solarToLunar(ref.getFullYear(), ref.getMonth() + 1, ref.getDate());
  if (!info) return null;
  const ly = info.year;

  // 大年初一 = 正月初一（春节）
  if (/^(大年初一|大年初一|年初一|正月初一)$/.test(s)) {
    return lunar.lunarToSolar(ly, 1, 1, false);
  }
  // 除夕 = 腊月最后一天
  if (/^除夕$/.test(s)) {
    const days = lunar.monthDays(ly, 12);
    return days ? lunar.lunarToSolar(ly, 12, days, false) : null;
  }
  // 年三十：该年腊月只有 29 天时**不存在**，返回 null 而不是溢出成下月初一
  if (/^年三十$/.test(s)) {
    if (lunar.monthDays(ly, 12) < 30) return null;
    return lunar.lunarToSolar(ly, 12, 30, false);
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 节日换算
 * ------------------------------------------------------------------ */

/**
 * 取用户自设节日（带缓存键：文本变了才重解析）。
 * 解析一次成本很低，但 compute 会为每个转换项各调一次，缓存省掉重复劳动。
 */
let customFestivalCache = { text: null, list: [] };
function customFestivalList(settings) {
  const ext = (settings && settings.timestamp && settings.timestamp.extensions) || {};
  const text = String(ext.customFestivals ?? '');
  if (customFestivalCache.text !== text) {
    customFestivalCache = { text, list: judge.parseCustomFestivals(text) };
  }
  return customFestivalCache.list;
}

/**
 * 算某个节日在指定年份的阳历日期。
 * @returns {Date|null} 该年不存在（如那年腊月没有三十）则返回 null
 */
function festivalDate(item, year) {
  if (!item || !year) return null;

  /* 阳历 */
  if (item.kind === 'solar') {
    // 带年份的自设节日只在那一年成立
    if (item.year && item.year !== year) return null;
    return validDate(year, item.month, item.day);
  }

  /* 第 N 个星期几：母亲节（5月第2个周日）这类 */
  if (item.kind === 'nth') {
    const first = new Date(year, item.month - 1, 1);
    if (first.getMonth() !== item.month - 1) return null;

    /*
     * 从月末往回数：11月最后一个周四 / 11月倒数第2个周四。
     * 「最后一个」= 倒数第 1 个，所以 nth 缺省按 1 处理（解析侧已兜底，这里再兜一次）。
     * 不能复用正向算法改个符号 —— 月末天数随月份变（28/29/30/31），
     * 必须先用 Date(year, month, 0) 取到真实天数，否则 2 月会算出负数。
     */
    if (item.fromLast) {
      const n = Math.max(1, item.nth || 1);
      const daysInMonth = new Date(year, item.month, 0).getDate();
      const lastDay = new Date(year, item.month - 1, daysInMonth);
      const back = (lastDay.getDay() - item.weekday + 7) % 7;
      const day = daysInMonth - back - (n - 1) * 7;
      return day >= 1 ? new Date(year, item.month - 1, day) : null;
    }

    const offset = (item.weekday - first.getDay() + 7) % 7;
    const d = new Date(year, item.month - 1, 1 + offset + (item.nth - 1) * 7);
    // 第 5 个星期几常常落在下个月，越界即视为不存在
    return d.getMonth() === item.month - 1 ? d : null;
  }

  /* 农历：现算，不查固定表（闰月年写死会错） */
  if (item.kind === 'lunar') {
    const day = item.day === null ? lunar.monthDays(year, item.month) : item.day;
    if (!day) return null;
    return lunar.lunarToSolar(year, item.month, day, !!item.isLeap);
  }
  return null;
}

/** 构造合法日期；年月日不合法（如 2 月 30 日）返回 null */
function validDate(y, m, d) {
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

/** 判断两个 Date 是否为同一天（不计时分秒） */
/* sameDay 取 timejudge 共享实现（judge.sameDay） */

/**
 * 查出某天是哪个节日。
 * 自设节日优先（用户可覆盖内置），其次阳历固定，最后农历浮动。
 * @returns {string|null} 节日名
 */
function festivalNameOf(date, settings) {
  const year = date.getFullYear();
  const custom = customFestivalList(settings);
  for (const it of custom) {
    if (judge.sameDay(festivalDate(it, year), date)) return it.name;
  }
  const jd = judge;
  for (const f of jd.SOLAR_FESTIVALS) {
    if (judge.sameDay(validDate(year, f.month, f.day), date)) return f.names[0];
  }
  for (const f of jd.LUNAR_FESTIVALS) {
    if (judge.sameDay(festivalDate({ kind: 'lunar', month: f.month, day: f.day }, year), date)) {
      return f.names[0];
    }
  }
  return null;
}

/** 去掉时分秒，只留日期（用于「今年已过」这类比较） */
function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 两个日期相差的天数（按自然日，不看时分秒）。
 * 用 UTC 毫秒差折算 —— 直接减本地时间戳会踩夏令时（有些日子只有 23 小时）。
 * @returns {number} to - from，正数表示 to 在 from 之后
 */
function diffDays(from, to) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

/**
 * 两个日期之间的工作日天数（只扣周六日）。
 *
 * 口径必须与 diffDays 一致 —— 都按「差值」算，不含首日：
 * 相差 N 天里的工作日，就该是这 N 天里的工作日，
 * 若天数不含首日、工作日却含首日，同一个区间会给出自相矛盾的两个数。
 *
 * 只扣周末：法定节假日每年不同且要人工维护表，不做（同 §12 不收「工作日」语义）。
 */
function workdaysBetween(from, to) {
  const n = diffDays(from, to);
  if (n <= 0) return 0;
  let count = 0;
  const cur = stripTime(from);
  for (let i = 1; i <= n; i++) {
    cur.setDate(cur.getDate() + 1);
    const w = cur.getDay();
    if (w !== 0 && w !== 6) count++;
  }
  return count;
}

/**
 * 从文本里找出两个日期（用于「日期差值」）。
 *
 * 扫描策略：逐位尝试 parseToDate，取**最长**的两次成功匹配。
 * 不能用简单 split —— 分隔符种类多（到、至、-、~、空格…），
 * 且「2026-01-01」内部自带分隔符，一切就碎了。
 *
 * @returns {{from:Date, to:Date}|null} 不足两个日期返回 null
 */
function parseDateRange(text) {
  const s = String(text || '');
  const found = [];
  let i = 0;
  while (i < s.length) {
    // 跳过连接词与空白，它们不是日期的起点
    const ch = s[i];
    if (/[\s到至~—－\-—,，、和与及]/.test(ch)) { i++; continue; }
    let best = null;
    // 从长到短试，优先匹配「2026-01-01」而不是「2026」
    for (let len = Math.min(24, s.length - i); len >= 4; len--) {
      const d = parseToDate(s.slice(i, i + len));
      if (d) { best = { d, len }; break; }
    }
    if (best) {
      found.push(best.d);
      i += best.len;
      if (found.length >= 2) break;
    } else {
      i++;
    }
  }
  if (found.length < 2) return null;
  const from = found[0];
  const to = found[1];
  if (diffDays(from, to) === 0) return null;
  return diffDays(from, to) < 0 ? { from: to, to: from } : { from, to };
}

/**
 * 查文本里的节日名。
 * 农历总开关关掉时，农历类节日一并失效 —— 它们本就属于农历体系，
 * 关掉后不该再给出「春节」这种结果。
 */
function findFestivalHit(raw, settings) {
  const ext = (settings && settings.timestamp && settings.timestamp.extensions) || {};
  const hit = judge.findFestival(raw, customFestivalList(settings));
  if (!hit) return null;
  if (hit.kind === 'lunar' && ext.lunarEnabled === false) return null;
  return hit;
}

/*
 * 自定义转换规则：让用户自己补充词表，或覆盖他认为不合适的结果。
 * 一行一条：被替换文本 操作符 结果
 *   =  替换（用「结果」顶掉内置转换结果；结果留空＝隐藏该项）
 *   +  追加（保留内置结果，后面再接一段）
 *   -  隐藏（这项不出现）
 *
 * 覆盖不等于抹除：内置规则永远在，用户规则只在其上生效。
 * 所以删掉用户规则后，内置结果会自动恢复，不需要「恢复默认」按钮。
 */
const USER_RULES_MAX = 200;     // 条数上限：解析是线性扫描，太多会拖慢转换
const USER_RULE_LEN_MAX = 200;  // 单条长度上限，超长直接丢弃而不是静默截断

/**
 * 解析规则文本。空行与 # 开头的行跳过，格式不对的行跳过（不报错、不中断）。
 * 按「被替换文本」长度降序：否则「大后天」会被「后天」抢先匹配，剩下个「大」字。
 */
function parseUserRules(text) {
  const out = [];
  if (typeof text !== 'string' || !text) return out;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.charAt(0) === '#') continue;
    if (line.length > USER_RULE_LEN_MAX) continue;
    /*
     * 两段式：先找**被分隔符隔开**的操作符，找不到再认紧贴写法（明天=后天）。
     * 不能只用非贪婪的 `.+?` —— 那样「2026-10-01 + 发货日」里的日期
     * 会被第一个 `-` 切断，from 变成 "2026"（实测踩到，见 _test/userrules.js）。
     */
    let m = line.match(/^(.+?)[\s\t|]+([=+\-])[\s\t|]*(.*)$/);
    if (!m) m = line.match(/^(.+)([=+\-])(.*)$/); // 紧贴写法：取最后一个操作符
    if (!m) continue;
    const from = m[1].trim();
    if (!from) continue;
    out.push({ from: from, op: m[2], to: String(m[3] || '').trim() });
    if (out.length >= USER_RULES_MAX) break;
  }
  out.sort((a, b) => b.from.length - a.from.length);
  return out;
}

/**
 * 在内置结果之上套用用户规则。
 * 匹配的是**用户选中的原文**，作用的是内置转换结果 —— 两者分开，
 * 才能做到「删掉规则即恢复内置」。
 * 命中即返回（已按长度排序，最长的先试），不叠加多条。
 */
function applyUserRules(raw, builtin, settings) {
  const ext = settings && settings.timestamp && settings.timestamp.extensions;
  if (!ext || !ext.userRules) return builtin;
  const rules = parseUserRules(ext.userRules);
  if (!rules.length) return builtin;
  const src = String(raw == null ? '' : raw).trim();
  if (!src) return builtin;
  const out = String(builtin);
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (src.indexOf(r.from) < 0) continue;
    if (r.op === '=') return r.to === '' ? null : r.to;  // 留空＝隐藏该项
    if (r.op === '+') return r.to === '' ? out : out + r.to;
    if (r.op === '-') return null;                        // 这项不出现
  }
  return out;
}

/**
 * 把用户规则套到「笔记名」上 —— 日历解析场景专用。
 *
 * 与 applyUserRules 的两点不同，都是刻意的：
 *   ① 开关独立（userRulesForCalendar，默认关）：两套解析共用一份规则会互相干扰，
 *      默认关才能保证「不打开就完全不影响已有的高亮 / 圆点结果」。
 *   ② `=` 在这里是**子串替换**而不是整体替换：主用途是剥掉旧命名里的多余后缀
 *      （如「-周五 = 」把 2026-09-25-周五 还原成 2026-09-25），
 *      整体替换会把整个名字清空，反而认不出来。
 *
 * @returns {{name:string, hide:boolean}} hide=true 表示规则要求忽略这个文件
 */
function applyUserRulesToName(rawName, settings) {
  const name = String(rawName == null ? '' : rawName);
  const ext = settings && settings.timestamp && settings.timestamp.extensions;
  if (!ext || ext.userRulesForCalendar !== true) return { name: name, hide: false };
  const rules = parseUserRules(ext.userRules);
  if (!rules.length) return { name: name, hide: false };
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    if (name.indexOf(r.from) < 0) continue;
    if (r.op === '-') return { name: name, hide: true };          // 忽略这个文件
    if (r.op === '=') return { name: name.split(r.from).join(r.to), hide: false };
    if (r.op === '+') return { name: name + r.to, hide: false };
  }
  return { name: name, hide: false };
}

/**
 * 转换出口。内置结果先算出来，再套用户规则 ——
 * 包在这一层而不是逐个 case 里写，是为了让所有出口统一接线：
 * 分散写会漏（之前就漏过一条路径，自定义规则在「统一格式」下完全失效）。
 */
function compute(plugin, key, raw, options) {
  const builtin = computeBuiltin(plugin, key, raw, options);
  if (builtin == null) return null;
  return applyUserRules(raw, builtin, plugin.settings);
}

function computeBuiltin(plugin, key, raw, options) {
  const ext = plugin.settings.timestamp.extensions;

  /*
   * 农历总开关：关闭后所有日期一律按阳历，与农历无关。
   * 必须在**所有**农历项之前统一拦截 —— 逐项判断会漏
   * （这些项分散在 lunar / reverse 两个 group 里）。
   */
  if (ext.lunarEnabled === false && isLunarKey(key)) return null;

  /*
   * 统一格式：把识别出的时间换成统一格式串。
   * 必须**先按农历判断**——「2026年五月十六」是农历，
   * 直接走 parseToDate 会解析不了（它不是阳历格式）。
   */
  if (key === 'unify') {
    const d = resolveToDate(plugin, raw, options);
    if (!d) return null;
    const f = unifyFormatOf(plugin.settings);
    return fmt(plugin, d, f);
  }

  if (key === 'unixDecode') {
    if (!looksLikeUnix(raw)) return null;
    const d = parseToDate(raw);
    return d ? fmt(plugin, d, plugin.settings.timestamp.format) : null;
  }

  /*
   * 以下几项的原始文本不是标准日期格式，必须抢在 parseToDate 之前判断，
   * 否则会被当成「解析不了」而直接跳过。
   */
  if (key === 'lunarToSolar') {
    /*
     * 「5月16号」默认按阳历理解，只有中文大写（五月十六号）才默认农历。
     * 开启 lunarOnHao 后，带「号 / 日」的一律按农历。
     * 不判断的话，阿拉伯数字的月日会被误当成农历转出一个错的阳历日期。
     */
    if (!shouldTreatAsLunar(raw, plugin.settings)) return null;
    // 剥掉「农历」前缀再解析 —— parseLunar 本身也剥，但显式做一次更稳，
    // 且后缀标记（开了开关时）必须靠这里处理
    const stripped = stripCalendarMark(raw, plugin.settings).rest;
    const info = lunar.parseLunar(stripped);
    if (!info) return null;
    const d = lunar.lunarToSolar(info.year, info.month, info.day, info.isLeap);
    return d ? fmt(plugin, d, 'YYYY-MM-DD') : null;
  }
  if (key === 'relativeToDate') {
    const d = parseRelative(raw, options && options.base);
    return d ? fmt(plugin, d, plugin.settings.timestamp.format) : null;
  }
  if (key === 'termToDate') {
    const req = parseTermRequest(raw);
    if (!req) return null;
    const day = lunar.termDay(req.year, req.index);
    if (!day || day < 1) return null;
    const month = Math.floor(req.index / 2) + 1;
    const d = new Date(req.year, month - 1, day);
    // 只输出日期：面板里已有预览，替换进正文时纯日期更干净
    return fmt(plugin, d, 'YYYY-MM-DD');
  }
  if (key === 'ganzhiToYear') {
    const g = parseGanzhi(raw);
    return g ? `${g.year}（${g.gan}${g.zhi}${g.animal}年）` : null;
  }
  if (key === 'linkToDate') {
    const m = LINK_RE.exec(raw.trim());
    if (!m) return null;
    const inner = m[1].trim();
    const d = parseToDate(inner);
    return d ? fmt(plugin, d, 'YYYY-MM-DD') : inner;
  }
  if (key === 'stripWeekday') {
    return stripWeekdayOnly(raw); // 没有星期时返回 null，该项自动隐藏
  }

  /*
   * 节日 → 日期。
   * 「中秋节」不是任何日期格式，必须抢在 parseToDate 之前判断。
   * 基准年：面板里填的；没填就取今年（并顺带看下一年——
   * 12 月说「元旦」多半指明年那个，跨年场景更贴合直觉）。
   */
  if (key === 'festivalToDate') {
    const hit = findFestivalHit(raw, plugin.settings);
    const base = options && options.base ? options.base : new Date();
    if (!hit) return null;
    let d = festivalDate(hit, base.getFullYear());
    // 该日期在今年已过完（且不是今天）时，看下一年更合理
    if (d && !hit.year && d < stripTime(base)) {
      const next = festivalDate(hit, base.getFullYear() + 1);
      if (next) d = next;
    }
    if (!d) return null;
    const text = fmt(plugin, d, 'YYYY-MM-DD');
    // 开关打开时补成「节日名 + 日期」，与正向输出同一形态
    return ext.festivalPrefix === false ? text : `${hit.name} ${text}`;
  }

  /*
   * 日期差值：输入是「两个日期」，parseToDate 只会解析出第一个，
   * 必须抢在它之前处理。
   */
  if (key === 'dateDiff') {
    const pair = parseDateRange(raw);
    if (!pair) return null;
    const days = diffDays(pair.from, pair.to);
    // 工作日要额外遍历一遍，关掉时省掉这轮计算
    if (ext.dateDiffWorkdays === true) {
      return `相差 ${days} 天（工作日 ${workdaysBetween(pair.from, pair.to)} 天）`;
    }
    return `相差 ${days} 天`;
  }

  const date = parseToDate(raw);
  if (!date) return null;

  switch (key) {
    /*
     * 倒计时：单个日期 → 距基准（默认今天）还有多少天。
     * 按自然日算，不看时分秒 —— 「距明天还有 1 天」才是直觉。
     */
    case 'countdown': {
      const base = options && options.base ? options.base : new Date();
      const n = diffDays(stripTime(base), stripTime(date));
      if (n === 0) return '就是今天';
      if (n > 0) return `还有 ${n} 天`;
      return `已过去 ${-n} 天`;
    }
    case 'relative': {
      // 基准：面板里填的；没填就是「现在」
      const base = options && options.base;
      const withNote = ext.showRelativeBase !== false; // 默认开
      return toRelative(date, base, withNote);
    }
    case 'weekday': {
      /*
       * 补星期是「追加」语义：在原日期后面加星期，**不能**把原有时刻丢掉。
       * 原先固定用 'YYYY-MM-DD' 输出，导致
       * 「2026-06-30 08:00」→「2026-06-30 周二」，08:00 被吃掉（实测确认）。
       * 按原文精度还原：带秒就带秒，只有时分就到分，纯日期就只到日。
       */
      const clean = stripDecorations(raw);
      let f = 'YYYY-MM-DD';
      if (hasClock(clean)) f += hasSeconds(clean) ? ' HH:mm:ss' : ' HH:mm';
      return `${fmt(plugin, date, f)} ${WEEKDAY_CN[date.getDay()]}`;
    }
    case 'dailyLink':
      return `[[${fmt(plugin, date, ext.dailyLinkFormat)}]]`;
    case 'unixEncode':
      return String(Math.floor(date.getTime() / 1000));
    case 'dateShift': {
      const shift = Number((options && options.shift) || 0);
      if (!shift) return null;
      const moved = new Date(date.getTime());
      moved.setDate(moved.getDate() + shift);
      return fmt(plugin, moved, 'YYYY-MM-DD');
    }

    /* 补全：只写了月日或时分时，补上今年 / 今天。已完整则返回 null，不显示 */
    case 'fillDate': {
      const clean = stripDecorations(raw);
      if (hasYear(clean) && !TIME_ONLY_RE.test(clean)) return null; // 已有年份
      if (TIME_ONLY_RE.test(clean)) {
        return fmt(plugin, date, hasSeconds(clean) ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm');
      }
      if (MD_RE.test(clean)) {
        return hasClock(clean)
          ? fmt(plugin, date, hasSeconds(clean) ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD HH:mm')
          : fmt(plugin, date, 'YYYY-MM-DD');
      }
      return null;
    }

    /* 取时分秒：原文里确实有时钟才有意义，否则会输出 00:00:00 这种噪音 */
    case 'timePart': {
      if (!hasClock(raw)) return null;
      return fmt(plugin, date, hasSeconds(raw) ? 'HH:mm:ss' : 'HH:mm');
    }

    /* 农历：取年月日交给农历模块；超出 1900–2100 返回 null，该项自动隐藏 */
    case 'lunar': {
      const info = lunar.solarToLunar(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      return info ? lunar.formatLunar(info) : null;
    }
    case 'lunarGanzhi': {
      const info = lunar.solarToLunar(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      );
      if (!info) return null;
      return `${lunar.formatLunar(info)} · ${lunar.ganZhi(info.year)}${lunar.zodiac(info.year)}年`;
    }
    case 'solarTerm':
      return lunar.solarTerm(date.getFullYear(), date.getMonth() + 1, date.getDate());
    /* 日期 → 节日：不是节日返回 null，该项自动隐藏 */
    case 'festival': {
      const name = festivalNameOf(date, plugin.settings);
      if (!name) return null;
      return ext.festivalPrefix === false
        ? name
        : `${name} ${fmt(plugin, date, 'YYYY-MM-DD')}`;
    }
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * 转换面板：列出已开启的转换项，每行带结果预览，点即应用
 * ------------------------------------------------------------------ */

class TimeActionModal extends obsidian.Modal {
  /**
   * @param {object} range 自动识别到的原文范围 { text, from, to }；手动框选时传 null。
   *   传了范围才能「覆盖原文」，否则只能依赖光标位置替换 ——
   *   弹窗打开后光标可能被 Obsidian 挪走，替换位置会错乱。
   */
  constructor(plugin, editor, raw, range) {
    super(plugin.app);
    this.plugin = plugin;
    this.editor = editor;
    this.raw = raw;
    this.range = range || null;
    this.shift = 7; // 日期偏移默认值
    this.baseText = ''; // 相对时间的基准；留空表示「现在」
    this.applied = false;
  }

  /** 当前基准：输入框里能解析出日期就用它，否则（留空或无效）视为「现在」 */
  currentBase() {
    const t = String(this.baseText || '').trim();
    if (!t) return null;
    return parseToDate(t); // 无效返回 null，调用方按「现在」处理
  }

  /** 基准输入框里填了内容但解析不出日期 */
  isBaseInvalid() {
    const t = String(this.baseText || '').trim();
    return !!t && !parseToDate(t);
  }

  /** 已开启且当前文本能算得出结果的项 */
  availableItems() {
    const ext = this.plugin.settings.timestamp.extensions;
    if (!extEnabled(this.plugin)) return [];
    return ACTION_DEFS.filter((def) => {
      if (!ext.items || !ext.items[def.key]) return false;
      // 农历总开关关闭时，农历项不出现在面板里（否则会看到开了却没结果的项）
      if (ext.lunarEnabled === false && isLunarKey(def.key)) return false;
      // 偏移项的输入框单独渲染，不进列表
      if (def.key === 'dateShift') return false;
      return compute(this.plugin, def.key, this.raw, { base: this.currentBase() }) !== null;
    });
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    /*
     * 注意：addClass 一次只能加一个类名，传 'a b' 会抛
     * InvalidCharacterError（DOMTokenList 不允许空格），面板会渲染成空白。
     * 需要多个类就分多次调用，或用 createDiv({ cls: 'a b' })（那个支持空格）。
     */
    contentEl.addClass('pomo-modal');

    contentEl.createEl('h3', { text: i18nT('k87dbb7d5', '🔄 时间转换') });

    const input = contentEl.createDiv({ cls: 'tta-source' });
    input.createDiv({ cls: 'tta-source-label', text: i18nT('kef75efa9', '选中内容') });
    input.createDiv({ cls: 'tta-source-value', text: this.raw });

    /*
     * 相对时间的基准输入框。
     * 「3 天前」必须标明相对哪一天，否则笔记过几天再看就对不上了。
     * 留空＝相对现在；可填任意能识别的日期。
     */
    const baseBox = contentEl.createDiv({ cls: 'tta-base' });
    baseBox.createDiv({ cls: 'tta-base-title', text: i18nT('k44ee7a53', '相对基准（留空＝现在）') });
    const baseRow = baseBox.createDiv({ cls: 'tta-base-row' });
    const baseInput = baseRow.createEl('input', {
      attr: { type: 'text', placeholder: '如 2026-09-22 或 2026-09-22 14:30' },
    });
    baseInput.value = this.baseText;
    baseInput.oninput = () => {
      this.baseText = baseInput.value;
      // 只重绘结果列表，不动输入框本身，否则每敲一个字就失焦
      this.renderList();
    };
    this.baseHint = baseBox.createDiv({ cls: 'tta-base-hint' });

    this.listEl = contentEl.createDiv({ cls: 'tta-list' });
    this.renderList();

    const row = contentEl.createDiv({ cls: 'pomo-modal-row' });
    row.createEl('button', { cls: 'pomo-btn', text: i18nT('k39b523bd', '关闭') }).onclick = () => this.close();
  }

  /**
   * 渲染结果列表（可重复调用）。
   *
   * 基准输入框变化时只重绘这一块：整块重绘会让 input 被销毁重建，
   * 表现为「每敲一个字就失焦」，根本没法连续输入。
   */
  renderList() {
    const base = this.currentBase();

    if (this.baseHint) {
      this.baseHint.setText(
        this.isBaseInvalid()
          ? i18nT('k4628fd37', '⚠️ 基准无法识别，将按「现在」计算。可填 2026-09-22 或 2026-09-22 14:30')
          : base
            ? `当前基准：${fmt(this.plugin, base, 'YYYY-MM-DD HH:mm')}`
            : '当前基准：现在'
      );
      this.baseHint.toggleClass('is-warn', this.isBaseInvalid());
    }

    if (!this.listEl) return;
    this.listEl.empty();

    const items = this.availableItems();
    if (!items.length) {
      /*
       * 空态要说明「能做什么」，不能只说「识别不出」。
       * 最常见的情况：文本确实是相对时间（明天 / 7天以后），
       * 但「相对时间 → 日期」属逆向转换、默认关着。
       * 这时直接把答案算出来展示，并告诉开关在哪。
       */
      const relDate = looksLikeRelative(this.raw) ? parseRelative(this.raw, base) : null;
      if (relDate) {
        const box = this.listEl.createDiv({ cls: 'tta-empty' });
        box.createDiv({ cls: 'tta-empty-title', text: i18nT('k1c74cf5a', '这段是相对时间描述') });
        box.createDiv({
          cls: 'tta-empty-answer',
          text: `→ ${fmt(this.plugin, relDate, this.plugin.settings.timestamp.format)}`,
        });
        box
          .createDiv({ cls: 'tta-empty-hint' })
          .setText(i18nT('ka729e72a', '在 设置 → 时间戳 → 扩展 → 逆向转换 里开启「相对时间 → 日期」后可一键应用。'));
        return;
      }

      this.listEl
        .createDiv({ cls: 'tta-empty' })
        .setText(
          i18nT('k12c0c154', '这段文本没识别出时间，或相关转换项都关着。可选中的样子：2026-09-19、2026 09 19、14:30、明天、7天以后')
        );
      return;
    }

    items.forEach((def) => {
      const result = compute(this.plugin, def.key, this.raw, { base });
      if (result === null) return;
      const row = this.listEl.createDiv({ cls: 'tta-item' });

      const left = row.createDiv({ cls: 'tta-item-left' });
      left.createDiv({ cls: 'tta-item-name', text: actionText(def.key, 'name', def.name) });
      left.createDiv({ cls: 'tta-item-result', text: result });

      row.createEl('button', { cls: 'pomo-btn mod-cta', text: i18nT('k5dda8431', '应用') }).onclick = () =>
        this.apply(result);
    });

    // 日期偏移：需要填天数，单独一块（也放进列表区，随基准一起刷新）
    const ext = this.plugin.settings.timestamp.extensions;
    if (ext.items && ext.items.dateShift && parseToDate(this.raw) && !looksLikeUnix(this.raw)) {
      const box = this.listEl.createDiv({ cls: 'tta-shift' });
      box.createDiv({ cls: 'tta-shift-title', text: i18nT('kc88c0e47', '日期偏移') });
      const line = box.createDiv({ cls: 'tta-shift-row' });
      const inputEl = line.createEl('input', { attr: { type: 'number' } });
      inputEl.value = String(this.shift);
      inputEl.oninput = () => {
        this.shift = Number(inputEl.value);
        if (this.shiftPreview) {
          const out = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
          this.shiftPreview.setText(out ? i18nT('k517a676e', '→ {0}', out) : i18nT('k1b4139be', '请输入有效天数'));
        }
      };
      line.createEl('button', { cls: 'pomo-btn', text: i18nT('k6cc01e73', '应用偏移') }).onclick = () => {
        const out = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
        if (out) this.apply(out);
      };
      this.shiftPreview = box.createDiv({ cls: 'tta-shift-preview' });
      const out0 = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
      this.shiftPreview.setText(out0 ? i18nT('k517a676e', '→ {0}', out0) : i18nT('k1b4139be', '请输入有效天数'));
    }
  }

  refreshPreview() {
    if (!this.shiftPreview) return;
    const out = compute(this.plugin, 'dateShift', this.raw, { shift: this.shift });
    this.shiftPreview.setText(out ? i18nT('k517a676e', '→ {0}', out) : i18nT('k1b4139be', '请输入有效天数'));
  }

  /**
   * 写入结果。
   * 手动框选 → 替换选区（replaceSelection），与用户预期一致。
   * 自动识别 → 按范围定位：开关关闭覆盖原文，开启则在原文后追加。
   *   必须显式 setSelection 到识别范围，不能靠当前光标，
   *   否则弹窗打开 / 焦点切换后光标位置变化，结果会插到莫名其妙的地方。
   */
  apply(text) {
    if (this.applied) return;
    this.applied = true;
    const ext = this.plugin.settings.timestamp.extensions;
    const mark = undoMarkOf(this.plugin.settings);
    /*
     * 正文里**只写转换结果**，不写标记字符。
     * 标记是编辑器装饰（widget），关闭 Obsidian 后消失，
     * 与内存里保存的原文同生命周期 —— 不会出现「标记还在但点不动」。
     */
    const out = String(text);

    if (this.editor) {
      const ed = this.editor;
      /*
       * 手动框选时 range 为 null，用当前选区定位；
       * 光标自动识别时 range 是那段原文的位置。
       */
      let sel = this.range;
      if (!sel) {
        const a = ed.getCursor ? ed.getCursor('from') : { line: 0, ch: 0 };
        const b = ed.getCursor ? ed.getCursor('to') : a;
        sel = { from: a, to: b };
      }
      /*
       * 「当前时间」是个占位标记，用户写下它就是想在后面看到时间，
       * 替换掉反而奇怪 —— 所以这类词恒为追加，不受 appendOnAutoPick 影响。
       */
      const isPlaceholder = NOW_WORDS.test(String(this.raw || '').trim());
      const append = this.range ? (isPlaceholder || !!(ext && ext.appendOnAutoPick)) : false;

      // 个别编辑器实例可能没有 setSelection，退化成直接替换选区
      const setSel = (a, b) => {
        if (typeof ed.setSelection === 'function') ed.setSelection(a, b);
      };

      let resultFrom, resultTo;
      if (append) {
        // 追加：插在原文末尾，原文保留，中间补一个空格
        setSel(sel.to, sel.to);
        ed.replaceSelection(' ' + out);
        // 结果文本范围要跳过那个空格，否则撤回后会多留一个空格
        resultFrom = { line: sel.to.line, ch: sel.to.ch + 1 };
        resultTo = { line: sel.to.line, ch: sel.to.ch + 1 + out.length };
      } else {
        // 覆盖：显式选中原文再替换
        setSel(sel.from, sel.to);
        ed.replaceSelection(out);
        resultFrom = { line: sel.from.line, ch: sel.from.ch };
        resultTo = { line: sel.from.line, ch: sel.from.ch + out.length };
      }

      /*
       * 先记录（纯内存，永不失败），再尝试挂装饰。
       * 顺序不能反 —— 反了的话装饰挂不上时记录也没写，
       * 撤回命令会跟着一起失效（v2.32.0 实测）。
       */
      if (mark) {
        const rec = recordUndoEntry(this.plugin, {
          editor: ed,
          line: resultFrom.line,
          fromCh: resultFrom.ch,
          // 追加模式要把前导空格一起纳入替换范围，否则撤回后残留一个空格
          searchText: append ? ' ' + out : out,
          replaceWith: append ? '' : String(this.raw || ''),
        });
        // 装饰是锦上添花：挂不上也不影响上面的记录
        attachUndoWidget(this.plugin, ed, resultFrom, resultTo, this.raw, mark, rec);
      }
    }
    this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 * 设置页：总开关 + 逐项开关
 * ------------------------------------------------------------------ */

function renderTimeActionSettings(containerEl, plugin) {
  const ts = plugin.settings.timestamp;
  const ext = ts.extensions;
  containerEl.createEl('h3', { text: i18nT('k60969377', '扩展：时间转换') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1c3d56cc', '启用扩展功能'))
    .setDesc(i18nT('k48b1d04a', '总开关。选中一段文本后执行「时间转换」，可转成相对时间、星期、日记链接等。'))
    .addToggle((t) =>
      t.setValue(ext.enabled).onChange(async (v) => {
        ext.enabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 总开关关闭：下方所有转换设置收进折叠区，默认收起。
   * 与番茄钟「会话记录」同一套做法 —— 只藏不改值，重新打开原样恢复。
   * 以前是 return 直接不渲染，用户看不到里面到底有什么，
   * 想确认某项是否还在只能先开总开关，来来回回很别扭。
   */
  /*
   * 直接改参数指向：下面还有大量 containerEl 的用法（含闭包里捕获的），
   * 改一处就等于全部收进折叠区，不必逐个替换成另一个变量名 ——
   * 逐个替换最容易漏掉闭包里的那几处，反而留下半折叠的残态。
   */
  if (!ext.enabled) {
    const fold = containerEl.createEl('details', { cls: 'tsi-fold' });
    fold.createEl('summary', { text: i18nT('k6edb2ee2', '转换设置（已关闭，点此展开查看）') });
    fold.createDiv({
      cls: 'tsi-tip',
      text: i18nT('k21e6e71a', '总开关关闭中：以下设置暂不生效，但数值都保留着。同时命令面板、右键菜单、斜杠命令、撤回标记全部停用。'),
    });
    containerEl = fold;
  } else {
    containerEl
      .createDiv({ cls: 'tsi-tip' })
      .setText(i18nT('k6e73cad1', '用法：选中一个时间文本 → 右键或命令面板执行「时间转换」→ 选一项 → 应用。没选中时会自动识别光标所在行的时间。'));
  }

  /*
   * 按分组渲染。项多了以后平铺一长串很难找，
   * 分组后一眼能看出「哪些是正向、哪些是逆向」。
   */
  const { ACTION_GROUPS, pairOf, isForwardOfPair } = require('./settings.js');
  containerEl
    .createDiv({ cls: 'tsi-tip' })
    .setText(i18nT('k339dad51', '只显示与选中文本形态相符的转换项，例如选中「明天」时才出现「相对时间 → 日期」。'));

  const separate = ext.separateDirections === true;
  const collapse = ext.collapseItems === true;

  /** 设一个开关的值；未开启「分别控制」时同步到配对的另一半 */
  const setItem = async (key, v) => {
    ext.items[key] = v;
    if (!separate) {
      const other = pairOf(key);
      if (other) ext.items[other] = v;
    }
    await plugin.saveSettings();
  };

  /** 渲染一行开关 */
  const addRow = (parent, def, labelOverride) => {
    new obsidian.Setting(parent)
      .setName(actionText(def.key, 'name', labelOverride || def.name))
      .setDesc(actionText(def.key, 'desc', def.desc))
      .addToggle((t) =>
        t.setValue(!!ext.items[def.key]).onChange(async (v) => {
          await setItem(def.key, v);
          if (separate || collapse) plugin.redrawSettingsTab();
        })
      );
  };

  /**
   * 渲染一个可折叠分组；renderBody 负责填充内容。
   * countText 可自定义右侧计数——高级区不是转换项，
   * 显示「已开启 0/1」毫无意义，所以允许不传或传别的文案。
   */
  const renderGroup = (g, defs, renderBody, countText) => {
    if (!defs.length) return;
    const wrap = containerEl.createDiv({ cls: 'tsi-section' });

    const opened = !collapse;
    const head = wrap.createDiv({ cls: 'tsi-section-title is-clickable' });
    head.setText(i18nT(g.titleKey, g.title));
    if (countText !== null) {
      const onCount = defs.filter((d) => !!ext.items[d.key]).length;
      head.createSpan({
        cls: 'tsi-section-count',
        text: countText || i18nT('k74e4b58e', '已开启 {0}/{1}', onCount, defs.length),
      });
    }

    const body = wrap.createDiv({ cls: 'tsi-section-body' });
    if (!opened) body.addClass('is-collapsed');
    head.onclick = () => {
      body.toggleClass('is-collapsed');
      head.toggleClass('is-closed', body.hasClass('is-collapsed'));
    };
    if (!opened) head.addClass('is-closed');

    renderBody(body);
  };

  const { ADVANCED_GROUP } = require('./settings.js');

  ACTION_GROUPS.forEach((g) => {
    const all = ACTION_DEFS.filter((d) => (d.group || 'forward') === g.key);
    // 农历区末尾放「带号的都算农历」，它跟农历直接相关，放别处不好找
    // 未开启「分别控制」时，逆向那半由正向代表渲染，避免重复出现
    const defs = separate ? all : all.filter((d) => !pairOf(d.key) || isForwardOfPair(d.key));
    renderGroup(g, defs, (body) => {
      defs.forEach((def) => {
        if (!separate) {
          addRow(body, def);
          return;
        }
        // 分别控制：正向 / 逆向各一行
        addRow(body, def, actionText(def.key, 'name', def.name) + (isForwardOfPair(def.key) ? i18nT('kfd9ff5e6', '（正向）') : ''));
        const other = pairOf(def.key);
        if (isForwardOfPair(def.key) && other) {
          const odef = ACTION_DEFS.find((d) => d.key === other);
          if (odef) addRow(body, odef, actionText(odef.key, 'name', odef.name) + i18nT('kf0e8f0f6', '（逆向）'));
        }
      });

      // 统一格式：格式串输入框（放常用区末尾，跟它最相关）
      if (g.key === 'forward') {
        const tsFmt = plugin.settings.timestamp.format;
        new obsidian.Setting(body)
          .setName(i18nT('k194ffbb3', '统一格式的格式串'))
          .setDesc(i18nT('k4886d4c7', "留空则跟随上方时间戳格式（当前：{0}）。例如 YYYY-MM-DD、YYYY年MM月DD日、YYYY-MM-DD HH:mm。", tsFmt))
          .addText((t) =>
            t
              .setPlaceholder(tsFmt)
              .setValue(ext.unifyFormat || '')
              .onChange(async (v) => {
                ext.unifyFormat = String(v).slice(0, 60);
                await plugin.saveSettings();
              })
          );
      }

      // 农历区：总开关在最上，两个子开关只有总开关打开时才渲染
      if (g.key === 'lunar') {
        new obsidian.Setting(body)
          .setName(i18nT('kea0bc7c2', '启用农历'))
          .setDesc(i18nT('kfdc30606', "总开关。关闭后**所有日期一律按阳历处理**：转农历、干支生肖、节气、农历→阳历全部不生效，下面的子开关也一并失效。"))
          .addToggle((t) =>
            t.setValue(ext.lunarEnabled !== false).onChange(async (v) => {
              ext.lunarEnabled = v;
              await plugin.saveSettings();
              plugin.redrawSettingsTab();
            })
          );

        /*
         * 总开关关闭时不再渲染子开关 —— 它们此时不产生任何效果，
         * 显示出来只会让人以为调了有用。
         */
        if (ext.lunarEnabled === false) return;

        new obsidian.Setting(body)
          .setName(i18nT('kb2d63591', '大写中文即农历'))
          .setDesc(i18nT('k8d574624', "关闭（默认）：「五月十六」「五月十六号」算农历，带「日」的（五月十六日）按阳历。开启：大写中文一律按农历，阿拉伯数字一律按阳历。"))
          .addToggle((t) =>
            t.setValue(ext.lunarOnCnUpper === true).onChange(async (v) => {
              ext.lunarOnCnUpper = v;
              await plugin.saveSettings();
            })
          );

        new obsidian.Setting(body)
          .setName(i18nT('k3775f823', '标记在后也能识别'))
          .setDesc(i18nT('k6d51a9fb', "关闭（默认）：只认「农历2026年八月初九」这类**标记在前**的写法。开启：标记写在日期后面（如「2026年八月初九 农历」）也能识别。"))
          .addToggle((t) =>
            t.setValue(ext.lunarMarkAnywhere === true).onChange(async (v) => {
              ext.lunarMarkAnywhere = v;
              await plugin.saveSettings();
            })
          );

        new obsidian.Setting(body)
          .setName(i18nT('k6dd34c3f', '带「号 / 日」的都算农历'))
          .setDesc(i18nT('k00ff190f', "关闭（默认）：中文大写「五月十六号」按农历，阿拉伯数字「5月16号」按阳历。开启：只要末尾带「号」或「日」，一律按农历。"))
          .addToggle((t) =>
            t.setValue(ext.lunarOnHao === true).onChange(async (v) => {
              ext.lunarOnHao = v;
              await plugin.saveSettings();
            })
          );
      }
    });
  });

  /*
   * 第二区：时间口径 + 自定义规则。
   * 口径三项在 timejudge.js 的 JUDGEMENTS 里定义，这里遍历渲染 ——
   * 新增口径只需往 JUDGEMENTS 加一条，界面自己长出来，不用改这里。
   */
  {
    const J = require('./timejudge.js');
    const semWrap = containerEl.createDiv({ cls: 'tsi-section' });
    const semHead = semWrap.createDiv({ cls: 'tsi-section-title is-clickable' });
    semHead.setText(i18nT('k8929d074', '时间口径'));
    const semBody = semWrap.createDiv({ cls: 'tsi-section-body' });
    if (ext.collapseSemantics !== false) semBody.addClass('is-collapsed');
    semHead.onclick = () => {
      semBody.toggleClass('is-collapsed', !semBody.hasClass('is-collapsed'));
    };

    Object.keys(J.JUDGEMENTS).forEach((k) => {
      const def = J.JUDGEMENTS[k];
      new obsidian.Setting(semBody)
        .setName(judgeText(k, 'name', def.label))
        .setDesc(judgeText(k, 'desc', def.desc))
        .addDropdown((d) => {
          def.options.forEach((o) =>
            d.addOption(String(o.v), judgeText(k, 'opt:' + String(o.v), o.label))
          );
          d.setValue(String(J.readJudgement(k, plugin.settings)));
          d.onChange(async (v) => {
            const raw = def.options.find((o) => String(o.v) === String(v));
            ext[k] = def.clean(raw ? raw.v : v);
            await plugin.saveSettings();
          });
        });
    });

    /*
     * 自定义转换规则。
     * 词表再全也覆盖不了所有人的说法，所以留一个窗口让用户自己补。
     * 覆盖不等于抹除：内置规则永远在，用户规则只在结果之上生效，
     * 删掉自己写的规则，内置结果就自动回来了。
     */
    const ruleBox = semBody.createDiv({ cls: 'tsi-tip' });
    ruleBox.setText(i18nT('k357857c1', '自定义转换规则（一行一条：被替换文本 操作符 结果）'));
    new obsidian.Setting(semBody)
      .setName(i18nT('kd325b572', '规则列表'))
      .setDesc(i18nT('k2d3e0d82', '操作符：=替换（结果留空＝隐藏该项）、+追加（保留内置结果再接一段）、-隐藏（这项不出现）。')
       /*
        * 示例整句翻译，不做语言判断：
        *   规则匹配的是**用户选中的原文**，与界面语言无关 ——
        *   英文示例照抄同样能用（实测 tomorrow = the day after tomorrow 可转换）。
        *   早先误以为"英文示例照抄会失败"，对规则列表是错的，此处更正。
        */
       + i18nT('k8f0cfdcf', '例：明天 = 后天 ／ 2026-10-01 + 发货日 ／ 昨天 -。')
       + i18nT('kf687009c', '覆盖不等于删除内置规则，删掉自己写的行即恢复原样。'))
      .addTextArea((t) => {
        t.setPlaceholder(i18nT('k1f05dd7e', '明天 = 后天\n2026-10-01 + 发货日\n昨天 -'))
          .setValue(ext.userRules || '')
          .onChange(async (v) => {
            ext.userRules = String(v || '').slice(0, 20000);
            await plugin.saveSettings();
          });
      });
    new obsidian.Setting(semBody)
      .setName(i18nT('kd3217aeb', '让规则也参与日历解析'))
      .setDesc(i18nT('k786b9bea', '默认关 —— 关时规则只作用于「选中转换」。打开后，日历在识别笔记名')
       + i18nT('k70706b27', '（判断这是哪天的日记 / 周记）之前也会先套用同一份规则，')
       + i18nT('kd1ca4689', '可让旧命名不改名也被认出来。两套解析共用一份规则，')
       + i18nT('k5c007aba', '若发现高亮或圆点异常，关掉这个开关即可回到原来的行为。'))
      .addToggle((t) => {
        t.setValue(ext.userRulesForCalendar !== false).onChange(async (v) => {
          ext.userRulesForCalendar = !!v;
          await plugin.saveSettings();
          if (plugin.refreshCalendarViews) plugin.refreshCalendarViews();
          refreshRuleHint();
        });
      });

    const ruleHint = semBody.createDiv({ cls: 'tsi-tip' });
    const refreshRuleHint = () => {
      const n = parseUserRules(ext.userRules).length;
      const scope = ext.userRulesForCalendar
        ? i18nT('kfbca8e96', '「选中转换」与「日历解析」')
        : i18nT('k0e6cd89e', '仅「选中转换」');
      ruleHint.setText(
        n === 0
          ? i18nT('k03f8fee9', '当前没有生效的规则。')
          : i18nT('kfe918842', '已识别 {0} 条规则，作用于{1}。', n, scope)
      );
    };
    refreshRuleHint();
  }

  /*
   * 第三区：高级设置。
   * 这些是杂项开关，跟具体转换项无关；放进独立折叠区，
   * 免得挤在转换项中间把前两区淹掉。
   */
  let advBody = containerEl;
  renderGroup(ADVANCED_GROUP, [{ key: '__adv__' }], (body) => {
    advBody = body;
  }, null);
  new obsidian.Setting(advBody)
    .setName(i18nT('k6587da46', '日期差值附带工作日'))
    .setDesc(i18nT('kbbfd43a0', "打开后「日期差值」额外给出工作日天数（仅扣周末，不含法定节假日）。需遍历区间，长区间略慢。"))
    .addToggle((t) =>
      t.setValue(ext.dateDiffWorkdays === true).onChange(async (v) => {
        ext.dateDiffWorkdays = v;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('k01bb83dc', '分别控制正向与逆向（高级）'))
    .setDesc(i18nT('kc90bcc57', "默认关闭：正向与逆向共用一个开关（如「相对时间 ⇄ 日期」）。打开后每对展开成两个独立开关。"))
    .addToggle((t) =>
      t.setValue(ext.separateDirections === true).onChange(async (v) => {
        ext.separateDirections = v;
        // 关闭时把两边拉回一致，以正向为准，避免留下不一致的状态
        if (!v) {
          const { ACTION_PAIRS } = require('./settings.js');
          ACTION_PAIRS.forEach((pair) => {
            ext.items[pair[1]] = !!ext.items[pair[0]];
          });
        }
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('kfa8034e3', '折叠转换项开关'))
    .setDesc(i18nT('k8f510b84', '打开后转换项开关列表收起，只留分组标题（标题显示已开启数量），点标题可展开。'))
    .addToggle((t) =>
      t.setValue(ext.collapseItems === true).onChange(async (v) => {
        ext.collapseItems = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('k6c6df985', '相对时间附带基准说明'))
    .setDesc(i18nT('k14479de6', "开启后结果形如「2 天后（相对 2026-09-22）」；关掉只输出「2 天后」。建议保持开启，否则过几天再看就不知道相对哪一天。"))
    .addToggle((t) =>
      t.setValue(ext.showRelativeBase !== false).onChange(async (v) => {
        ext.showRelativeBase = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(advBody)
    .setName(i18nT('k48ef619d', '没选中文本时：在原文后追加结果'))
    .setDesc(i18nT('kbf40aee7', "关闭（默认）：自动识别到的时间被结果覆盖。开启：保留原文，结果接在后面。只对「光标自动识别」生效；手动框选始终是替换选区。"))
    .addToggle((t) =>
      t.setValue(!!ext.appendOnAutoPick).onChange(async (v) => {
        ext.appendOnAutoPick = v;
        await plugin.saveSettings();
      })
    );

  /* 「一周从哪天开始」已合并到「日历」设置页，全插件共用同一个值 */

  new obsidian.Setting(advBody)
    .setName(i18nT('k9b7eef03', '转换后显示撤回标记'))
    .setDesc(i18nT('k0fe85bb7', "开启（默认）：转换结果后出现可点击的撤回图标，点一下还原。一篇可有多处，逐个点即可。图标是编辑器临时装饰，不占正文字符、不存进笔记。关闭 Obsidian 后转换记录全部清除，图标消失、不再可撤回。关闭本开关＝整个撤回功能停摆：不显示图标、也不记录，撤回命令同样失效。"))
    .addToggle((t) =>
      t.setValue(ext.undoHintEnabled !== false).onChange(async (v) => {
        ext.undoHintEnabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 系统撤回提示。
   * 这里只是**说明**：刚转完想立刻反悔，用 Obsidian 自己的 Ctrl+Z 就行。
   * 标记点击是另一条路——转完又改了别处时，Ctrl+Z 要一路退回去，
   * 点标记则一步到位。
   */
  {
    const box = advBody.createDiv({ cls: 'tts-undo-tip' });
    box.setText(
      i18nT('k84406372', '提示：刚转换完想马上反悔，按 Ctrl+Z 用系统撤回最省事；') +
      i18nT('kf49864b0', '若之后还编辑过别处，点结果后面的撤回图标可直接还原。')
    );
  }

  new obsidian.Setting(advBody)
    .setName(i18nT('k2e6560ac', '时段名单独转换'))
    .setDesc(i18nT('k1554c109', "默认关闭：「早上」「下午」这类词单独出现时不转换 —— 它指几点没有共识，强行给值是编造。开启后按下面的小时值转换。「早上8点」这类带时刻的写法不受影响，始终可用。"))
    .addToggle((t) =>
      t.setValue(ext.convertDaypartAlone === true).onChange(async (v) => {
        ext.convertDaypartAlone = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  // 各时段小时值：仅在开启单独转换时展示，避免平时占地方
  if (ext.convertDaypartAlone) {
    const box = advBody.createDiv({ cls: 'tsi-daypart' });
    box.createDiv({ cls: 'tsi-daypart-title', text: i18nT('k5aa7322d', '各时段对应的小时（0–23）') });
    DAYPART_KEYS.forEach((key) => {
      new obsidian.Setting(box)
        .setName(daypartText(key, key))
        .addText((t) =>
          t
            .setPlaceholder(String(daypartHour(key, null)))
            .setValue(
              ext.daypartHours && typeof ext.daypartHours[key] === 'number'
                ? String(ext.daypartHours[key])
                : ''
            )
            .onChange(async (v) => {
              const n = Number(String(v).trim());
              // 非法值直接删掉而不是落盘，避免脏数据堆积
              if (!isFinite(n) || n < 0 || n > 23) delete ext.daypartHours[key];
              else ext.daypartHours[key] = Math.floor(n);
              await plugin.saveSettings();
            })
        );
    });
  }

  new obsidian.Setting(advBody)
    .setName(i18nT('k113e2ef3', '日记链接格式'))
    .setDesc(i18nT('k609e6c5c', '「转日记链接」生成的日期格式，需与你的日记文件名格式一致。'))
    .addText((t) =>
      t
        .setPlaceholder('YYYY-MM-DD')
        .setValue(ext.dailyLinkFormat)
        .onChange(async (v) => {
          ext.dailyLinkFormat = v.trim() || 'YYYY-MM-DD';
          await plugin.saveSettings();
        })
    );

  containerEl
    .createDiv({ cls: 'tsi-tip' })
    .setText(i18nT('kdabd637e', '本模块不保存任何历史记录或缓存，关闭后库里不留残留数据。'));
}

/* ------------------------------------------------------------------ *
 * 注册：只有一个命令入口，避免命令面板被一堆开关淹没
 * ------------------------------------------------------------------ */

/*
 * 行内挑选用的候选正则，按「越严格越优先」排列。
 * 不能用 DATE_RE —— 那个带 ^$ 锚定，是给整段文本匹配用的，
 * 行内搜索必须用不锚定的版本，否则永远匹配不到。
 * 宽松那条放最后：含空格的分隔在任意文本里容易误吃无关内容。
 */
/**
 * 口语相对日的行内匹配：明天 / 大后天 / tomorrow …
 * 去掉各条的首尾锚点后拼接；按 WORD_REL 原顺序（长词在前）保证最长优先。
 */
const WORD_PICK_RE = new RegExp(
  WORD_REL.map((w) => w.re.source.replace(/^\^|\$$/g, '')).join('|'),
  'i'
);

/** 倒装说法的行内版本：去掉首尾锚点，用于在句子里定位 */
const REL_PREFIX_RE_INLINE = new RegExp(
  REL_PREFIX_RE.source.replace(/^\^|\$$/g, ''),
  'i'
);

/** 数量+单位（含中文数字与序数）的行内版本 */
const REL_INLINE = new RegExp(REL_RE.source.replace(/^\^|\$$/g, ''), 'i');

/** 判断某条 pattern 是不是「非日期格式」（需按相对时间校验） */
const PICK_NONDATE_RE = /前天|昨天|明天|后天|星期|yesterday|tomorrow|today|\\d\\s*[秒分小天周月年]|第/i;

/*
 * 复合表达的行内匹配：明年12月份的第49周周三下午2点。
 * 各段全可选会让整体匹配空串 —— g 标志下 exec 空匹配 lastIndex 不前进会死循环，
 * 所以拆成两个「必须有其一」的分支。
 */
const COMPOSITE_PICK_RE = new RegExp(
  '(?:' +
    /*
     * 复合的**标志是「第N周」**——必须有它才算复合，
     * 单独的「周五 / 下周五」交给 WEEKDAY_PICK_RE，否则会互相抢。
     * 第N周后面还能跟「周X」「时段」「时刻」，段间允许「的」。
     */
    '(?:今年|明年|后年|去年|前年|\\d{4}年?)?[\\s的]*' +
    '(?:\\d{1,2}月份?)?[\\s的]*' +
    '第[\\d零〇一二两三四五六七八九十]+周' +
    '(?:[\\s的]*周[一二三四五六日天1-7])?' +
    '(?:[\\s的]*(?:早上|上午|中午|下午|傍晚|晚上|深夜|凌晨))?' +
    '(?:[\\s的]*\\d{1,2}(?:点(?:半|\\d{0,2}分?)?|:\\d{2}))?' +
  '|' +
    // 后面跟「日」说明是完整日期（2026年09月19日），交给日期规则处理
    '(?:今年|明年|后年|去年|前年|\\d{4}年)[\\s的]*\\d{1,2}月(?:份)?(?!\\s*\\d{1,2}\\s*日)' +
  ')',
  'g'
);

/*
 * 农历日期的行内匹配（前缀形式）：农历2026年八月初九 / 农历五月十六。
 * 必须排在日期类之前 —— 否则「农历2026年…」会被年份/日期规则抢成「2026年」，
 * 而「2026年」既转不了农历又会掉进相对时长的坑（实测过）。
 * 日部分按「初X / 廿X / 三十 / 一般数字」排列，长的在前避免被短规则截断。
 */
const LUNAR_PICK_RE = new RegExp(
  '(?:' + LUNAR_MARK.join('|') + ')' +
  '\\s*(?:\\d{4}\\s*年|[零〇一二三四五六七八九十]{4}\\s*年)?' +
  '\\s*闰?\\s*' +
  '(?:[正一二三四五六七八九十冬腊]{1,3}月|\\d{1,2}月)' +
  '\\s*(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|三十|[一二三四五六七八九十]{1,2}|\\d{1,2})' +
  '\\s*(?:日|号)?',
  'g'
);

/*
 * 无标记的大写月日：八月十九 / 五月十六。
 * 必须排在 REL_INLINE **之前** —— 否则「八月十九」会被「八 + 月」当成
 * 「8 个月后」，只剩「八月」这个碎片，光标停留时转不出结果
 * （而选中整串时却能转，两种入口行为不一致，实测过）。
 */
const CN_MD_PICK_RE = new RegExp(
  '(?:\\d{4}\\s*年)?' +
  '\\s*闰?\\s*' +
  '(?:[正一二三四五六七八九十冬腊]{1,3}月)' +
  '\\s*(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|三十|[一二三四五六七八九十]{1,2})' +
  '\\s*(?:日|号)?' +
  /*
   * 后面紧跟历法标记时不匹配 —— 那是「后缀标记」形态，
   * 交给 LUNAR_TAIL_PICK_RE（需开关开启）。
   * 不排除的话，开关关闭时会被当无标记的大写月日转掉，等于绕过开关。
   */
  '(?!\\s*(?:' + LUNAR_MARK.join('|') + '))',
  'g'
);

/** 后缀形式：2026年八月初九 农历（需 lunarMarkAnywhere 开启才启用） */
const LUNAR_TAIL_PICK_RE = new RegExp(
  '(?:\\d{4}\\s*年)?' +
  '\\s*闰?\\s*' +
  '(?:[正一二三四五六七八九十冬腊]{1,3}月|\\d{1,2}月)' +
  '\\s*(?:初[一二三四五六七八九十]|廿[一二三四五六七八九]|三十|[一二三四五六七八九十]{1,2}|\\d{1,2})' +
  '\\s*(?:日|号)?\\s*(?:' + LUNAR_MARK.join('|') + ')',
  'g'
);

/** 星期几的行内匹配：周一 / 上周五 / 下周一（前缀必须保留，否则「下周五」会当本周五） */
const WEEKDAY_PICK_RE = /(?:本|上|下)?\s*周[一二三四五六日天1-7]/g;

/** 当前时间等占位词的行内匹配 */
const NOW_PICK_RE = /当前时间|此刻|当下/g;

const PICK_PATTERNS = [
  /*
   * 复合、星期几、当前时间必须排在**日期类之前**。
   * 否则「明年12月份的第49周…」会被「\d{1,2}月」抢先匹配成「12月」，
   * 剩下的碎片拼不出完整语义。
   */
  COMPOSITE_PICK_RE,
  LUNAR_PICK_RE,
  LUNAR_TAIL_PICK_RE,
  CN_MD_PICK_RE,
  WEEKDAY_PICK_RE,
  NOW_PICK_RE,
  /\d{4}\d{2}\d{2}/,                                            // 紧凑 20260919
  /\d{4}[-/._年]\d{1,2}[-/._月]\d{1,2}日?(?:\s+\d{1,2}[:：]\d{2}(?:[:：]\d{2})?)?/, // 2026-09-19
  /\d{4}[\s\-/._]\d{1,2}[\s\-/._]\d{1,2}/,                     // 2026 09 19（宽松）
  /\d{1,2}[-/._月]\d{1,2}[日号]?/,                                // 09-17 / 5月16号
  /\d{10}|\d{13}/,                                              // Unix 时间戳
  /\d{1,2}[:：]\d{2}(?:[:：]\d{2})?/,                                   // 14:30
  /*
   * 口语相对日 + 时刻（明天5点 / 明天下午3点 / 昨天5点半）。
   * 时刻部分必须是「有点或有冒号」的实义时刻，不能全用可选量词——
   * 否则「明天」也会被匹配成「明天 」（吃掉尾随空格），造成文本错位。
   */
  new RegExp(
    '(?:' + WORD_PICK_RE.source + ')' +
    '\\s*(?:[上下午晚早凌晨傍]*)?\\s*\\d{1,2}' +
    '(?:\\s*点\\s*(?:半|\\d{1,2}\\s*分?)?|:\\d{2})',
    'i'
  ),
  // 倒装与序数：前两天 / 第七天后 / 二天后
  REL_PREFIX_RE_INLINE,
  REL_INLINE,
  // 口语相对日放最后：它是纯文字，容易在普通句子里误命中
  WORD_PICK_RE,
];

/**
 * 从光标所在行里挑一个像时间的片段。
 * 只在用户没做选区时兜底用，避免"光标停在日期上却要精确选中"的别扭。
 * 按 PICK_PATTERNS 顺序试（越严格越优先）；找不到返回 null。
 */
function pickTimeOnLine(editor, settings) {
  try {
    const cursor = editor.getCursor();
    const lineNo = cursor.line;
    const line = editor.getLine(lineNo);
    if (!line) return null;

    /*
     * 光标落在命中片段内时优先用它；否则取该行第一个。
     * 这样一行里有多个日期时，选的是光标所在那个，更符合直觉。
     */
    const cursorCh = typeof cursor.ch === 'number' ? cursor.ch : 0;
    let fallback = null;

    for (const pat of PICK_PATTERNS) {
      /*
       * 按设置跳过两类：
       * - 农历总开关关闭 → 任何农历片段都不参与识别
       * - 后缀形式未开启 → 只认前缀
       */
      // isLunarPat 必须先算出来再用 —— 放在后面会因 TDZ 抛错被 catch 吞掉，
      // 表现为整行识别全部返回 null（实测过）
      const isLunarPat =
        pat === LUNAR_PICK_RE || pat === LUNAR_TAIL_PICK_RE || pat === CN_MD_PICK_RE;
      if (isLunarPat) {
        const ex = extOf(settings);
        if (ex && ex.lunarEnabled === false) continue;
        if (pat === LUNAR_TAIL_PICK_RE && !(ex && ex.lunarMarkAnywhere === true)) continue;
      }
      const re = new RegExp(pat.source, pat.flags.indexOf('g') >= 0 ? pat.flags : pat.flags + 'g');
      // 口语相对日（明天 / tomorrow）不是日期格式，不能用 parseToDate 校验，
      // 否则永远匹配不到；按 pattern 类型选对应的校验函数。
      // 口语词、口语+时刻、倒装都不是日期格式，必须用 parseRelative 校验
      let verify;
      if (isLunarPat) {
        /*
         * 农历必须用 parseLunar 校验，不能用 parseRelative ——
         * 后者会把「八月」当成「8 个月后」，导致整条农历匹配被跳过，
         * 只剩「八月」这个碎片（实测过）。
         */
        verify = (t) => !!lunar.parseLunar(t);
      } else if (
        pat === COMPOSITE_PICK_RE || pat === NOW_PICK_RE ||
        pat === WEEKDAY_PICK_RE || PICK_NONDATE_RE.test(pat.source)
      ) {
        verify = parseRelative;
      } else {
        verify = parseToDate;
      }
      let hit;
      while ((hit = re.exec(line))) {
        // 兜底：空匹配时 lastIndex 不前进会死循环，强制推进
        if (!hit[0]) { re.lastIndex++; continue; }
        // 必须能被后续逻辑真正解析，否则换下一个候选，
        // 避免把「订单 1234 56 78」这类数字串当成日期交给用户
        /*
         * 命中片段可能带尾随空格（「会议 2026年五月十六 召开」→「2026年五月十六 」），
         * 带空格会让后续 compute 全部失败，必须 trim 并按 trim 后的长度收窄 to。
         */
        const raw = hit[0];
        if (!verify(raw.trim())) continue;
        const lead = raw.length - raw.replace(/^\s+/, '').length;
        const trimmed = raw.trim();
        const from = { line: lineNo, ch: hit.index + lead };
        const to = { line: lineNo, ch: hit.index + lead + trimmed.length };
        if (cursorCh >= from.ch && cursorCh <= to.ch) {
          return { text: trimmed, from, to };
        }
        if (!fallback) fallback = { text: trimmed, from, to };
      }
    }
    return fallback;
  } catch (e) {
    return null;
  }
}

/** 取当前活动编辑器的 editor 实例；没有则 null */
function activeEditor(app) {
  const ae = app && app.workspace && app.workspace.activeEditor;
  if (ae && ae.editor) return ae.editor;
  // 旧版 API 兜底
  const leaf = app && app.workspace && app.workspace.activeLeaf;
  if (leaf && leaf.view && leaf.view.editor) return leaf.view.editor;
  return null;
}

function registerTimeActions(plugin) {
  /*
   * 这里刻意用 checkCallback 而不是 editorCallback。
   * editorCallback 的命令只在编辑器获得焦点时才出现在命令面板里，
   * 用户在设置页、图谱视图、文件列表时搜不到，会以为功能没生效。
   * checkCallback 保证命令始终可见，执行时再判断上下文并给出明确提示。
   */
  plugin.addCommand({
    id: 'time-tools-timestamp-batch-convert',
    name: '时间戳：批量转换（整篇笔记）',
    checkCallback: (checking) => {
      if (!extEnabled(plugin)) return false;
      if (checking) return true;

      const ext = plugin.settings.timestamp.extensions;
      if (!ext || !ext.enabled) {
        new obsidian.Notice('时间转换扩展已关闭，可在设置 → 时间戳 里打开');
        return;
      }
      const app = plugin.app;
      const file = app.workspace && typeof app.workspace.getActiveFile === 'function'
        ? app.workspace.getActiveFile() : null;
      if (!file || !String(file.path || '').endsWith('.md')) {
        new obsidian.Notice('请先打开一篇 markdown 笔记');
        return;
      }
      // 只列已启用的转换项 —— 没开的项不该出现在批量里，否则会转出用户没要的东西
      const defs = (ACTION_DEFS || []).filter((a) => ext[a.key] === true);
      if (!defs.length) {
        new obsidian.Notice('尚未启用任何转换项，请先在设置 → 时间戳 里打开要用的项');
        return;
      }
      new BatchConvertModal(plugin, file, defs).open();
    },
  });

  plugin.addCommand({
    id: 'time-tools-timestamp-convert',
    // 名字里保留连续「时间转换」，方便在命令面板直接搜这个词
    name: '时间戳：时间转换（选中文本）',
    checkCallback: (checking) => {
      // 总开关关闭时命令直接从面板消失，而不是点了才提示
      if (!extEnabled(plugin)) return false;
      if (checking) return true; // 始终可见，可用性在执行时判断

      const ext = plugin.settings.timestamp.extensions;
      if (!ext || !ext.enabled) {
        new obsidian.Notice('时间转换扩展已关闭，可在设置 → 时间戳 里打开');
        return;
      }

      const editor = activeEditor(plugin.app);
      if (!editor) {
        new obsidian.Notice('请先打开一篇笔记，并把光标放在编辑区里');
        return;
      }

      let raw = editor.getSelection();
      let range = null; // 手动框选时不需要范围，替换选区即可
      if (!raw || !String(raw).trim()) {
        // 没选中就退一步：从光标所在行里找一个像时间的片段。
        // 这样光标停在日期上也能直接用，不必精确选中。
        // 记下它的起止位置，覆盖 / 追加都要靠这个定位。
        const picked = pickTimeOnLine(editor, plugin.settings);
        if (picked) {
          raw = picked.text;
          range = { from: picked.from, to: picked.to };
        }
      }
      if (!raw) {
        new obsidian.Notice('没找到时间文本。请先选中一个，例如 2026-09-19');
        return;
      }
      new TimeActionModal(plugin, editor, raw, range).open();
    },
  });

  /*
   * 右键菜单入口。
   * 命令面板找不到命令时（中文搜索不灵、或插件未重载），
   * 选中文本右键是更直觉的路径，且一定能看到当前装的是哪一版。
   */
  /*
   * 撤回上一次时间转换。
   * Ctrl+Z 能用，但如果转换后还做了别的编辑，Ctrl+Z 就得一路退回去。
   * 这条命令直接按**记下的位置**把原文换回来，一步到位。
   * 记录只在内存，关掉 Obsidian 就没了（不会写进设置或笔记）。
   */
  plugin.addCommand({
    id: 'time-tools-timestamp-undo-convert',
    name: '时间戳：撤回上一次时间转换',
    checkCallback: (checking) => {
      // 总开关关闭时命令消失（以前只判撤回开关，关了总开关这条还能跑）
      if (!extEnabled(plugin)) return false;
      if (checking) return true;
      const ext = plugin.settings.timestamp.extensions;
      if (!ext || ext.undoHintEnabled === false) {
        new obsidian.Notice('撤回提示已关闭，可在设置 → 时间戳 里打开');
        return;
      }
      const editor = activeEditor(plugin.app);
      if (!editor) {
        new obsidian.Notice('请先打开一篇笔记');
        return;
      }
      // 走记录层定位（行号 + 文本查找），不依赖装饰
      if (!undoLast(plugin, editor)) {
        new obsidian.Notice('这篇笔记没有可撤回的时间转换了');
      }
    },
  });

  plugin.registerEvent(
    plugin.app.workspace.on('editor-menu', (menu, editor) => {
      const ext = plugin.settings.timestamp.extensions;
      if (!extEnabled(plugin)) return; // 总开关关闭时不出现，保持菜单干净

      const sel = editor && editor.getSelection ? editor.getSelection() : '';
      const hasSel = sel && String(sel).trim();
      menu.addItem((item) =>
        item
          .setTitle(hasSel ? i18nT('k8bc1bbcd', '🔄 时间转换') : i18nT('k00f92bc3', '🔄 时间转换（未选中文本）'))
          .setIcon('clock')
          .onClick(() => {
            let raw = sel;
            let range = null;
            if (!raw || !String(raw).trim()) {
              const picked = pickTimeOnLine(editor);
              if (picked) {
                raw = picked.text;
                range = { from: picked.from, to: picked.to };
              }
            }
            if (!raw) {
              new obsidian.Notice('没找到时间文本。请先选中一个，例如 2026-09-19');
              return;
            }
            new TimeActionModal(plugin, editor, raw, range).open();
          })
      );
    })
  );
}

/* ------------------------------------------------------------------ *
 * 批量转换（v3.13）
 * ------------------------------------------------------------------ */

const BATCH_MAX = 200;

/**
 * 从全文里粗筛「看起来像时间」的片段。
 *
 * 这里只做粗筛，真正的判定交给 compute()：转不出结果（null）的一律不碰。
 * 所以多匹配一些不会误伤，漏匹配才会漏转 —— 宁可多筛也别漏。
 * 不用后行断言（?<!）：老版本 Electron 可能不支持，会直接抛错。
 */
function collectCandidates(text) {
  const pats = [
    /\b\d{13}\b/g,
    /\b\d{10}\b/g,
    /\d{4}\s*[-\/.年]\s*\d{1,2}\s*[-\/.月]\s*\d{1,2}(?:\s*[日号])?/g,
    /\d{1,2}\s*[月\/-]\s*\d{1,2}\s*[日号]/g,
    /[一二三四五六七八九十]{1,3}月[初一三四五六七八九十]{1,3}[日号]?/g,
    /农历[一二三四五六七八九十\d]{1,3}月[初一三四五六七八九十\d]{1,3}[日号]?/g,
    /(大后天|大前天|今天|明天|后天|昨天|前天|上周|本周|这周|下周|下下周)[一二三四五六日天1-7]?/g,
    /\d{1,2}[:：]\d{2}([:：]\d{2})?/g,
  ];
  const out = [];
  for (let i = 0; i < pats.length; i++) {
    const re = pats[i];
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0]) out.push({ raw: m[0], index: m.index });
    }
  }
  // 按位置排；同一位置被多个正则命中时取最长的那个，并丢弃后面重叠的
  out.sort((a, b) => (a.index - b.index) || (b.raw.length - a.raw.length));
  const kept = [];
  let end = -1;
  for (let i = 0; i < out.length; i++) {
    if (out[i].index < end) continue;
    kept.push(out[i]);
    end = out[i].index + out[i].raw.length;
  }
  return kept;
}

/**
 * 扫描全文，返回真正能转的命中。
 * compute 抛错不算命中（某个转换项出 bug 不该让整篇批量失败）。
 */
function scanBatch(plugin, text, key) {
  const hits = [];
  const cands = collectCandidates(String(text || ''));
  for (let i = 0; i < cands.length; i++) {
    if (hits.length >= BATCH_MAX) break;
    let r = null;
    try { r = compute(plugin, key, cands[i].raw); } catch (e) { r = null; }
    if (r == null) continue;
    const s2 = String(r);
    if (!s2 || s2 === cands[i].raw) continue; // 转完没变化的不算
    hits.push({ raw: cands[i].raw, index: cands[i].index, result: s2 });
  }
  return hits;
}

/** 按顺序把命中替换回原文（hits 已按 index 递增且互不重叠） */
function applyBatch(text, hits) {
  let out = '';
  let cur = 0;
  for (let i = 0; i < hits.length; i++) {
    out += text.slice(cur, hits[i].index) + hits[i].result;
    cur = hits[i].index + hits[i].raw.length;
  }
  return out + text.slice(cur);
}

/**
 * 批量转换弹窗：先预览再改。
 * 不预览就直接改全文是不可接受的 —— 写坏了整篇笔记没法一眼看出哪处错了。
 */
class BatchConvertModal extends obsidian.Modal {
  constructor(plugin, file, defs) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
    this.defs = defs || [];
    this.key = this.defs.length ? this.defs[0].key : 'unify';
    this.hits = [];
    this.text = '';
  }

  async onOpen() {
    const el = this.contentEl;
    el.createEl('h3', { text: i18nT('kb9467966', '批量转换整篇笔记') });
    try {
      this.text = await this.plugin.app.vault.cachedRead(this.file);
    } catch (e) {
      el.createDiv({ text: i18nT('ke4b49736', '读取笔记失败，批量转换已取消。') });
      return;
    }

    const tip = el.createDiv();
    const list = el.createDiv();

    const render = () => {
      this.hits = scanBatch(this.plugin, this.text, this.key);
      const n = this.hits.length;
      tip.setText(
        n === 0
          ? i18nT('k45915354', '这篇笔记里没有可转换的内容（或所选转换项不适用于这些内容）。')
          : `识别到 ${n} 处${n >= BATCH_MAX ? `（已达上限 ${BATCH_MAX}）` : ''}。确认后一次性替换整篇，可用 Obsidian 自带撤销（Ctrl+Z）回退。`
      );
      const show = this.hits.slice(0, 30);
      for (let i = 0; i < show.length; i++) {
        list.createDiv({ text: `${show[i].raw}  →  ${show[i].result}` });
      }
      if (n > show.length) list.createDiv({ text: i18nT('k0b86faea', `…另有 ${n - show.length} 处`, n - show.length) });
      if (this.btn) this.btn.setDisabled(n === 0);
    };

    new obsidian.Setting(el)
      .setName(i18nT('kf7f8c9db', '转换项'))
      .setDesc(i18nT('kcf85d825', '只列出你已启用的转换项。切换会重新扫描预览。'))
      .addDropdown((d) => {
        if (!this.defs.length) d.addOption('unify', i18nT('kaacc0e5f', '（尚未启用任何转换项）'));
        for (let i = 0; i < this.defs.length; i++) {
          d.addOption(this.defs[i].key, actionText(this.defs[i].key, 'name', this.defs[i].name || this.defs[i].key));
        }
        d.setValue(this.key).onChange((v) => {
          this.key = v;
          this.renderList();
        });
      });

    // 预览区要在切换转换项时清空重画，否则会越堆越多
    this.renderList = () => {
      list.setText('');
      render();
    };

    new obsidian.Setting(el).addButton((b) => {
      this.btn = b;
      b.setButtonText(i18nT('k0716d5c5', '应用替换'))
        .setCta(true)
        .onClick(async () => {
          if (!this.hits.length) return;
          try {
            const next = applyBatch(this.text, this.hits);
            await this.plugin.app.vault.modify(this.file, next);
            new obsidian.Notice(`已替换 ${this.hits.length} 处（可用 Ctrl+Z 回退）`);
          } catch (e) {
            new obsidian.Notice('替换失败，笔记未改动。');
          }
          this.close();
        });
    });

    this.renderList();
  }

  onClose() {
    const el = this.contentEl;
    if (el && typeof el.empty === 'function') el.empty();
  }
}

module.exports = {
  // 基础时间戳
  VIEW_TYPE,
  TimestampView,
  registerTimestamp,
  refreshTimestampViews,
  renderTimestampSettings,

  // 扩展：时间文本转换
  lunar,
  parseToDate,
  fmt,
  dropSeconds,
  looksLikeUnix,
  toRelative,
  parseCNNumber,
  parseClockCN,
  parseComposite,
  isoWeekOf,
  isoWeekDate,
  parseEnglishRelative,
  daypartHour,
  defaultDaypartHours,
  hasHaoSuffix,
  cnMonthDaySuffix,
  shouldTreatAsLunar,

  // 自定义转换规则（v2.88 欠账，v2.95 真写入）
  parseUserRules,
  applyUserRules,
  USER_RULES_MAX,
  USER_RULE_LEN_MAX,
  applyUserRulesToName,
  stripCalendarMark,
  containsCalendarMark,
  unifyFormatOf,
  collectCandidates,
  scanBatch,
  applyBatch,
  BatchConvertModal,
  BATCH_MAX,
  resolveToDate,
  undoMarkOf,
  attachUndoWidget,
  restoreUndo,
  initUndoIndicator,
  refreshUndoIndicator,
  recordUndoEntry,
  restoreEntry,
  buildCm6Extension,
  undoLast,
  undoCount,
  undoStackSize,
  clearUndo,
  shiftUndoRecords,
  unresolvableUndoCount,
  pickTimeOnLine,
  parseRelative,
  looksLikeRelative,
  parseTermRequest,
  parseGanzhi,
  stripDecorations,
  stripWeekdayOnly,
  hasClock,
  hasSeconds,
  hasYear,
  compute,
  festivalNameOf,
  festivalDate,
  customFestivalList,
  TimeActionModal,
  renderTimeActionSettings,
  registerTimeActions,
};

  };

  __modules['src/pomosync.js'] = function (module, exports, require) {
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
];

/** 布尔型同步字段（applySnapshot 不能走 num()，否则 true 会变成 1，=== true 的判断全失效） */
const BOOL_KEYS = ['countUp'];

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

  };

  __modules['src/recorder.js'] = function (module, exports, require) {
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
    new obsidian.Notice(`已写入 ${path}`);
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
      ok ? '🍅 结果已复制，Ctrl+V 即可插入' : '复制失败，请检查剪贴板权限',
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
        new obsidian.Notice(`已执行 QuickAdd：${this.settings.quickAddChoice}`);
        return null;
      }

      // 联动失败：按开关决定是回退内置写入，还是直接放弃
      if (!this.settings.fallbackToBuiltin) {
        new obsidian.Notice(`QuickAdd ${r.message}；未记录（回退已关闭）`, 8000);
        return null;
      }
      new obsidian.Notice(`QuickAdd ${r.message}；已改用内置写入`, 8000);
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
    '· 番茄结束不再自动记录',
    '· 结束弹窗不再显示「记录」按钮',
    '· 下方的记录设置会折叠收起',
    '',
    '已经写进笔记的记录不受影响；各项设置的值也会保留，重新打开总开关即可恢复。',
  ];
  return confirmDialog(plugin, {
    title: '确定关闭会话记录？',
    content: '关闭后将：\n\n' + lines.join('\n'),
    okText: '仍然关闭',
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
      .setDesc(i18nT('ked22713c', "占位符：{{date}} {{time}} {{range}} {{cycles}} {{focus}} {{rest}} {{focusText}} {{restText}} {{pauses}} {{longBreaks}} {{profile}} {{skippedLine}}。{{focus}}/{{rest}} 是整数分钟，不随精度开关变化；{{focusText}}/{{restText}} 自带单位，精度跟随上面的「记录到秒」开关。想让开关生效，模板里要用 {{focusText}}（默认模板已是）；若你自定义过模板且写的是「{{focus}} 分钟」，改成 {{focusText}} 即可 —— 注意去掉后面的「分钟」二字，否则会渲染成「25 分 30 秒 分钟」。"))
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
          new obsidian.Notice(ok ? '已复制 {{VALUE}}' : '复制失败');
        })
      );

    // 测试执行：立刻真跑一次，用来区分是配置问题还是插件问题
    new obsidian.Setting(choiceWrap)
      .setName(i18nT('kf5744906', '测试执行'))
      .setDesc(i18nT('kfaf9021a', '用一组示例数据立即执行一次，失败会明确告诉原因。'))
      .addButton((b) =>
        b.setButtonText(i18nT('k1a6aa24e', '执行')).onClick(async () => {
          const r = await plugin.recorder.testQuickAdd();
          new obsidian.Notice(r.ok ? '✅ QuickAdd 执行成功' : `❌ ${r.message}`, 10000);
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
    new obsidian.Notice('累计统计当前关闭。设置 → 番茄钟 →「累计统计数据源」可切换为「解析笔记」或「本机累计」。');
    return { ok: false, reason: 'off' };
  }
  if (src === 'memory') {
    const sm = (p && p.statsMemory) || {};
    const today = obsidian.moment().format('YYYY-MM-DD');
    const t = sm.todayDate === today ? Number(sm.todayFocusMs) : 0;
    new obsidian.Notice(`📊 今日专注 ${fmtDur(t)}　｜　累计 ${fmtDur(Number(sm.totalFocusMs))}　｜　 ${Number(sm.sessions) || 0} 次会话`);
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
      new obsidian.Notice('没找到会话记录笔记（数据源＝解析笔记）。请确认记录笔记路径设置正确。');
      return { ok: false, reason: 'no-note' };
    }
    const text = await vault.cachedRead(file);
    const total = sumMinutes(text);
    new obsidian.Notice(`📊 从记录笔记读到约 ${fmtDur(total * 60000)}（按笔记中「N 分钟」累加，格式改过会读不准）`);
    return { ok: true, source: 'note', minutes: total };
  } catch (e) {
    new obsidian.Notice('读取会话记录笔记失败，统计未生成。');
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
    new obsidian.Notice('数据源＝自定义位置，但没填路径。设置 → 番茄钟 →「自定义统计位置」。');
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
      new obsidian.Notice(`自定义位置没读到任何笔记：${path}`);
      return { ok: false, reason: 'no-file' };
    }
    let total = 0;
    for (let i = 0; i < files.length; i++) {
      total += sumMinutes(await vault.cachedRead(files[i]));
    }
    new obsidian.Notice(`📊 自定义位置（${files.length} 篇）读到约 ${fmtDur(total * 60000)}`);
    return { ok: true, source: 'custom', minutes: total, files: files.length };
  } catch (e) {
    new obsidian.Notice('读取自定义位置失败，统计未生成。');
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

  };

  __modules['src/pomodoro.js'] = function (module, exports, require) {
const obsidian = require('obsidian');
const { normalizePath } = require('obsidian');
const { t: i18nT, STATE_NAMES, getLang, toTW, optText, miscText } = require('./i18n.js');
/*
 * 会话记录已拆到 ./recorder.js（写笔记 / QuickAdd / 补跑桥接）。
 * 这里用解构把符号恢复成本地标识符，module.exports 对外接口一字不改。
 */
const {
  Recorder, renderRecordSettings, renderTemplate,
  sanitizeFileName, insertAtTop, confirmDisableRecord,
  accumulateStats, showStats, hasDataview,
} = require('./recorder.js');
const {
  applyProfile,
  makeProfileId,
  confirmDialog,
  DEFAULT_RECORD_TEMPLATE,
  VALID_POMO_THEME,
  POMO_THEME_OPTIONS,
} = require('./settings.js');
const { PomoSync } = require('./pomosync.js');
/* 独立窗口的尺寸/位置/置顶/无边框，见 pomowin.js（只在 pop-out 那份实例里生效） */
const {
  isPopoutWindow,
  electronWindow,
  applyPopoutWindow,
  applyPopoutWindowSoon,
  applyDeskDock,
  POPOUT_POS_OPTIONS,
} = require('./pomowin.js');

/** 自定义主题注入的 <style> 元素 id —— 全局唯一，便于查找与移除 */
const POMO_CSS_ID = 'time-tools-pomo-theme-css';

/**
 * 自定义主题可直接复制的模板。
 *
 * 列全所有对外变量，用户改数字即可，不必猜名字。
 * 刻意保持「注释多于代码」—— 这一整块都是给人读的接口说明。
 * 变量名与 styles.css 里的 var(--xxx, 兜底) 必须一致，有测试守着。
 */
const POMO_CSS_TEMPLATE = [
  '.pomo-theme-custom {',
  '  /* 尺寸 */',
  '  --pomo-width: 240px;        /* 浮窗宽度 */',
  '  --pomo-height: auto;        /* 最小高度 */',
  '  --pomo-pad: 12px 14px;      /* 内边距 */',
  '  --pomo-font-scale: 1;       /* 整体字号倍数 */',
  '  --pomo-radius: 12px;        /* 圆角 */',
  '  --pomo-shadow: 0 6px 20px rgba(0,0,0,.28);',
  '',
  '  /* 配色 */',
  '  --pomo-focus: #e87a4a;      /* 专注色 */',
  '  --pomo-rest: #3fb08a;       /* 短休色 */',
  '  --pomo-long: #4a90d9;       /* 长休色（不设则跟短休同色） */',
  '  --pomo-paused: var(--text-faint);',
  '  --pomo-panel-bg: var(--background-primary);',
  '  --pomo-panel-border: var(--background-modifier-border);',
  '',
  '  /* 背景图：库内相对路径，绝对路径换设备会失效 */',
  '  --pomo-bg-image: url("附件/tomato.png");',
  '  --pomo-bg-size: cover;',
  '  --pomo-bg-position: center;',
  '  --pomo-bg-blend: normal;',
  '',
  '  /* 按钮行：对齐 / 换行 / 间距 */',
  '  --pomo-actions-justify: space-between;',
  '  --pomo-actions-wrap: nowrap;',
  '  --pomo-actions-gap: 6px;',
  '',
  '  --pomo-time-size: 30px;     /* 倒计时字号 */',
  '  --pomo-bar-h: 4px;          /* 进度条高度 */',
  '}',
  '',
  '/* 按钮换顺序：data-act 有 main / skip / stop */',
  ".pomo-theme-custom .pomo-btn[data-act='stop'] { order: -1; }",
  '',
  '/* 按段类别上色：focus / rest / idle（暂停沿用暂停前那一段） */',
  ".pomo-theme-custom[data-pomo-kind='rest'] .pomo-time {",
  '  color: var(--pomo-rest);',
  '}',
].join('\n');

/**
 * 把当前主题挂到某个番茄钟根元素上。
 *
 * 只增删 class，不动 DOM 结构 —— 切换主题的代价接近零，也不会丢计时状态。
 * 传进来的 el 可能是浮窗、侧边栏容器或弹窗，三者共用同一套主题变量。
 */
function applyTheme(el, theme) {
  if (!el) return;
  VALID_POMO_THEME.forEach((t) => el.removeClass('pomo-theme-' + t));
  el.addClass('pomo-theme-' + (VALID_POMO_THEME.indexOf(theme) >= 0 ? theme : 'classic'));
}

/**
 * 同步自定义主题的 CSS。
 *
 * theme !== 'custom' 或 css 为空时，把上次注入的 <style> 整个移除 ——
 * 不留空标签在 head 里。这样反复切主题不会堆积废弃节点。
 *
 * 用 textContent 赋值而不是走 HTML 解析：CSS 里常有 &、< 这类字符，
 * 走文本节点不需要转义，也不会被当成标记解析。
 * （注意：本文件不要出现那个 HTML 属性名的字面量，
 *   _test/smoke.js 有一条断言会扫产物里含不含它。）
 */
/**
 * 自定义 CSS 节点的取 / 删，两处共用同一套防御。
 *
 * syncCustomCss（切主题、改 CSS）和 destroy（插件卸载）都要操作这个节点，
 * 若各自直接调 document.getElementById，就得各自写一遍环境判断 ——
 * 漏一处就会在没有完整 DOM 的环境里抛异常，把整个番茄钟初始化拖垮。
 */
function domReady() {
  return (
    typeof document !== 'undefined' &&
    typeof document.getElementById === 'function' &&
    typeof document.createElement === 'function' &&
    !!document.head
  );
}

function getCustomCssNode() {
  return domReady() ? document.getElementById(POMO_CSS_ID) : null;
}

function removeCustomCssNode(node) {
  if (node && node.parentNode && typeof node.parentNode.removeChild === 'function') {
    node.parentNode.removeChild(node);
  }
}

function syncCustomCss(theme, css) {
  /*
   * 先看 document 这套 API 齐不齐。
   * init() 会直接调本函数，若环境里没有完整 DOM（沙盒测试、某些宿主环境），
   * 不设防会让整个番茄钟初始化抛异常 —— 主题只是外观，不该拖垮计时。
   */
  if (!domReady()) return;
  const old = getCustomCssNode();
  const text = theme === 'custom' ? String(css || '').trim() : '';
  if (!text) {
    removeCustomCssNode(old);
    return;
  }
  let style = old;
  if (!style) {
    style = document.createElement('style');
    style.id = POMO_CSS_ID;
    document.head.appendChild(style);
  }
  style.textContent = text;
}

const POMODORO_VIEW_TYPE = 'time-tools-pomodoro-view';

/** 支持的音频扩展名（自定义音效文件夹用） */
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];

/** 运行状态枚举 */
const ST = {
  IDLE: 'idle', // 未开始
  FOCUS: 'focus', // 专注中
  SHORT: 'short', // 短休息中
  LONG: 'long', // 长休息中
  PAUSED: 'paused', // 已暂停
  WAITING: 'waiting', // 手动模式下等待开始下一段
};

/** 状态中文名（底色）。界面显示一律走 stateName()，别直接用这张表 */
const LABEL = {
  idle: '待开始',
  focus: '专注',
  short: '短休息',
  long: '长休息',
  paused: '已暂停',
  waiting: '待开始',
};

/**
 * 状态名（界面用）：英文查 STATE_NAMES 表，繁體走字表转换，其余用中文底色。
 * 只出现在浮窗 / 侧边栏 / 提示上 —— 写进笔记的内容一律不翻译。
 */
function stateName(k) {
  const zh = LABEL[k] || '';
  const lang = getLang();
  if (lang === 'en') return (STATE_NAMES.en && STATE_NAMES.en[k]) || zh;
  if (lang === 'zh-TW') return toTW(zh);
  return zh;
}

/**
 * 计时方式按钮的符号。
 * ＋＝正计时（累加），－＝倒计时（递减）。用纯文本符号而非 SVG / 富文本，
 * 免得不同主题下图标显示不一致；含义靠 title 悬停提示补足。
 */
const COUNTUP_ICON = {
  up: '＋', // 全角加号：与减号等宽，按钮切换时不会左右跳
  down: '－', // 全角减号
  upTitle: '正计时（累加）',
  downTitle: '倒计时（递减）',
  count: '－',
};

/** 毫秒转 MM:SS，秒位补零 */
function mmss(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/**
 * 毫秒转 H:MM:SS / MM:SS，秒位补零。
 * 正计时可能超过一小时，只留两位分钟会显示成 75:30 这种读不懂的数，
 * 所以超过一小时自动补小时位。倒计时一律用 mmss，不受影响。
 */
function hmmss(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * 供记录使用的时长文本。
 *
 * toSec 为 false（默认）时按分钟记。这里必须跟 data.focusMin **同一套四舍五入** ——
 * 两者若一个舍一个入，{{focus}} 会写 10、{{focusText}} 却写「9 分钟」，
 * 同一条记录里两个数字互相打架。
 * toSec 为 true 时精确到秒，超过一小时补出小时位，不显示成「95 分 0 秒」。
 */
function fmtRecordDuration(ms, toSec) {
  // 分钟口径必须写成 ms/60000，与 data.focusMin 的 Math.round(ms/60000) 逐位一致：
  // 先换算成秒再除 60 会在半分钟附近差一分钟（9:29.6 → 一个给 9，一个给 10）。
  if (!toSec) return `${Math.round(ms / 60000)} 分钟`;
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} 小时 ${m} 分 ${s} 秒`;
  if (m > 0) return `${m} 分 ${s} 秒`;
  return `${s} 秒`;
}

/** 区间裁剪 */
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/* ------------------------------------------------------------------ *
 * 防误关弹窗基类
 * ------------------------------------------------------------------ */

/**
 * 需要「多点几次才关」的弹窗基类。
 *
 * Obsidian 的 Modal 在点遮罩、按 Esc、点标题栏 X 时最终都会走到 close()，
 * 所以这里拦的是 close() 本身 —— 不依赖 onClickOutside / onEscapeKey
 * 这类版本差异较大的内部方法，只要 Obsidian 还用 close() 收口就成立。
 *
 * 两条放行路径：
 *   - dismiss()：弹窗内按钮，立即关（用户已经明确表态）
 *   - Esc：明确操作，立即关
 * 其余（点遮罩 / 点 X）累计到 dismissClicks 次才放行，每次给一次可见反馈。
 */
class GuardedModal extends obsidian.Modal {
  constructor(app, ctrl) {
    super(app);
    this.ctrl = ctrl;
    this.outsideTries = 0; // 已累计的外部关闭尝试次数
    this.force = false; // true 时 close() 直接放行
  }

  /** 需要几次外部点击才关闭；1 表示不拦截。非法值退回默认 3 */
  requiredClicks() {
    const raw = this.ctrl && this.ctrl.settings ? this.ctrl.settings.dismissClicks : 3;
    const n = parseInt(raw, 10);
    if (!isFinite(n)) return 3;
    return clamp(n, 1, 10);
  }

  /** 弹窗内按钮走这里：不经计数，直接关 */
  dismiss() {
    this.force = true;
    this.close();
  }

  close() {
    if (this.force) {
      super.close();
      return;
    }
    const need = this.requiredClicks();
    if (need <= 1) {
      super.close();
      return;
    }
    this.outsideTries += 1;
    const left = need - this.outsideTries;
    if (left <= 0) {
      this.force = true;
      super.close();
      return;
    }
    this.showDismissHint(left);
  }

  /**
   * Esc 是明确操作，不该被计数拦住。
   * onEscapeKey 在部分版本不存在，所以先置位再按是否存在分派。
   */
  onEscapeKey() {
    this.force = true;
    if (typeof super.onEscapeKey === 'function') super.onEscapeKey();
    else this.close();
  }

  /** 在弹窗底部提示还剩几次，并抖一下让人注意到 */
  showDismissHint(left) {
    const host = this.modalEl || this.contentEl;
    if (!host || typeof host.querySelector !== 'function') return;
    let hint = host.querySelector('.pomo-dismiss-hint');
    if (!hint) {
      hint = host.createDiv({ cls: 'pomo-dismiss-hint' });
    }
    hint.setText(i18nT('k4ec24480', '再点 {0} 次关闭（或按 Esc / 点下方按钮）', left));
    // 重置动画：先摘类再强制回流，否则连续点击只会播一次
    host.removeClass('pomo-shake');
    void host.offsetWidth;
    host.addClass('pomo-shake');
  }
}

/* ------------------------------------------------------------------ *
 * 启动面板：选方案 + 填轮数
 * ------------------------------------------------------------------ */
class StartModal extends obsidian.Modal {
  constructor(app, ctrl) {
    super(app);
    this.ctrl = ctrl;
    // 默认沿用上次方案与轮数
    this.profileId = ctrl.settings.activeProfileId;
    this.cycles = ctrl.settings.lastCycleChoice;
  }

  onOpen() {
    const { contentEl } = this;
    const ctrl = this.ctrl;
    contentEl.empty();
    contentEl.addClass('pomo-modal');
    contentEl.createEl('h3', { text: i18nT('k364e9422', '🍅 准备开始') });

    // 轮数引导语
    contentEl.createDiv({
      cls: 'pomo-modal-desc',
      text: i18nT('keb5a9b15', '你认为这个任务需要几轮番茄钟完成？（专+休为一轮）'),
    });

    // 时长方案选择
    new obsidian.Setting(contentEl)
      .setName(i18nT('k44a76734', '时长方案'))
      .setDesc(i18nT('k7a2bebaa', '选定后本次会话按该方案的专注 / 休息时长执行。'))
      .addDropdown((d) => {
        ctrl.settings.profiles.forEach((p) =>
          d.addOption(p.id, `${p.name}（${p.focusMin}/${p.shortBreakMin}/${p.longBreakMin}）`)
        );
        d.setValue(this.profileId).onChange((v) => {
          this.profileId = v;
          this.refreshSummary();
        });
      });

    // 轮数输入
    const hint = contentEl.createDiv({ cls: 'pomo-hint' });
    new obsidian.Setting(contentEl)
      .setName(i18nT('k12bec730', '轮数'))
      .setDesc(i18nT('kdb27d153', '填数字则跑到指定轮数自动结束；留空为不限。'))
      .addText((t) =>
        t
          .setPlaceholder(i18nT('k8441b348', '不限'))
          .setValue(this.cycles ? String(this.cycles) : '')
          .onChange((v) => {
            const n = v.trim() === '' ? null : parseInt(v, 10);
            this.cycles = n && isFinite(n) && n > 0 ? n : null;
            // 软提示：只提醒，不阻止
            hint.setText(
              this.cycles && this.cycles > 4
                ? i18nT('k3c627aea', '超过 4 轮后效率通常会下降，建议中途安排长休息。')
                : ''
            );
          })
      );

    /*
     * 计时方式：待开始界面上的快捷切换。
     * 正计时是「为了统计一件事实际花了多久」才开的，想开的时候多半正在这里选方案，
     * 专门跑去设置页翻一遍太绕 —— 所以直接放一对按钮在这里。
     */
    const modeRow = contentEl.createDiv({ cls: 'pomo-modal-row pomo-mode-row' });
    modeRow.createEl('span', {
      cls: 'pomo-mode-label',
      text: i18nT('kdb759ce6', '计时方式：倒计时按方案时长倒数；正计时从 0 往上累加、不自动结束。'),
    });
    this.btnModeDown = modeRow.createEl('button', { cls: 'pomo-btn', text: i18nT('kccbb967e', '倒计时') });
    this.btnModeUp = modeRow.createEl('button', { cls: 'pomo-btn', text: i18nT('k08780ced', '正计时') });
    this.btnModeDown.onclick = () => this.setCountUpMode(false);
    this.btnModeUp.onclick = () => this.setCountUpMode(true);

    /*
     * 正计时专用：软目标与间隔提醒的快捷输入。
     * 开正计时的人多半就是要靠这两个提醒收尾，专门跑去设置页填太绕。
     * 倒计时下收起 —— 段到点就结束了，这两项设了也不会触发，摆着只会让人以为坏了。
     */
    this.countUpExtraEl = contentEl.createDiv({ cls: 'pomo-countup-extra' });
    const s = ctrl.settings;
    this.addCountUpNumInput(
      i18nT('kcc58debe', '软目标（分钟）'),
      i18nT('k4091e8a7',
        '累加到这个分钟数时提醒一次并响铃，但**不结束**计时。留空或 0 ＝不提醒。'),
      () => s.countUpTargetMin,
      (v) => {
        s.countUpTargetMin = v;
      }
    );
    this.addCountUpNumInput(
      i18nT('k1feb0b9c', '间隔提醒（分钟）'),
      i18nT('k8c4e774c',
        '每隔这么多分钟提醒一次（填 20 就是第 20、40、60 分钟各一次）。留空或 0 ＝不提醒。'),
      () => s.countUpRemindEveryMin,
      (v) => {
        s.countUpRemindEveryMin = v;
      }
    );

    this.refreshModeButtons();

    this.summaryEl = contentEl.createDiv({ cls: 'pomo-summary' });
    this.refreshSummary();

    const row = contentEl.createDiv({ cls: 'pomo-modal-row' });
    row.createEl('button', { cls: 'pomo-btn', text: i18nT('kba358518', '不限') }).onclick = () => {
      this.cycles = null;
      this.submit();
    };
    row.createEl('button', { cls: 'pomo-btn mod-cta', text: i18nT('k22696cbc', '开始') }).onclick = () =>
      this.submit();
  }

  /** 展示所选方案的时长预览 */
  refreshSummary() {
    const p =
      this.ctrl.settings.profiles.find((item) => item.id === this.profileId) ||
      this.ctrl.settings.profiles[0];
    if (!p || !this.summaryEl) return;
    this.summaryEl.empty();
    const up = this.ctrl.settings.countUp === true;
    this.summaryEl.createDiv({
      cls: 'pomo-summary-row',
      text: up
        ? i18nT('k17730e76', '{0}：专注不限时（正计时）· 休息 {1} 分钟', p.name, p.shortBreakMin)
        : i18nT('kfbe4f0cf', '{0}：专注 {1} 分钟 · 休息 {2} 分钟',
          p.name, p.focusMin, p.shortBreakMin),
    });
    this.summaryEl.createDiv({
      cls: 'pomo-summary-row mod-dim',
      text: i18nT('k3111fb87', `每 ${this.ctrl.settings.longBreakInterval} 轮询问一次长休息（${p.longBreakMin} 分钟）`, this.ctrl.settings.longBreakInterval, p.longBreakMin),
    });
  }

  /** 待开始界面上的正计时 / 倒计时快捷切换 */
  setCountUpMode(on) {
    const s = this.ctrl.settings;
    if ((s.countUp === true) === on) return;
    s.countUp = on;
    this.ctrl.plugin.saveSettings();
    this.refreshModeButtons();
    this.refreshSummary();
    new obsidian.Notice(
      on
        ? i18nT('ka7f46ee3', '已切到正计时：专注段不限时，从 0 往上累加，点「跳过」结束这一段。')
        : i18nT('k24f4fe80', '已切到倒计时：专注段按方案时长倒数，到点自动结束。')
    );
  }

  /** 正计时快捷输入里的单个数字框：只认正整数，其它一律归 0（＝不提醒） */
  addCountUpNumInput(name, desc, get, set) {
    new obsidian.Setting(this.countUpExtraEl)
      .setName(name)
      .setDesc(desc)
      .addText((t) =>
        t
          .setPlaceholder(i18nT('k8441b348', '不限'))
          .setValue(get() > 0 ? String(get()) : '')
          .onChange((v) => {
            const n = parseInt(String(v || '').trim(), 10);
            set(isFinite(n) && n > 0 ? n : 0);
            this.ctrl.plugin.saveSettings();
          })
      );
  }

  /** 当前生效的那个按钮点亮（mod-cta），另一个保持普通样式；正计时才显示快捷输入 */
  refreshModeButtons() {
    const up = this.ctrl.settings.countUp === true;
    if (this.btnModeDown) {
      if (up) this.btnModeDown.removeClass('mod-cta');
      else this.btnModeDown.addClass('mod-cta');
    }
    if (this.btnModeUp) {
      if (up) this.btnModeUp.addClass('mod-cta');
      else this.btnModeUp.removeClass('mod-cta');
    }
    // 软目标 / 间隔提醒只对正计时成立，倒计时下整块收起
    if (this.countUpExtraEl) this.countUpExtraEl.style.display = up ? '' : 'none';
  }

  submit() {
    this.close();
    this.ctrl.startSession(this.cycles, this.profileId);
  }

  onClose() {
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 * 长休息询问：达到间隔轮数时弹出，由用户决定
 * ------------------------------------------------------------------ */
class AskLongBreakModal extends GuardedModal {
  constructor(app, ctrl, onYes, onNo) {
    super(app, ctrl);
    this.onYes = onYes;
    this.onNo = onNo;
    this.settled = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('pomo-modal');
    contentEl.createEl('h3', { text: i18nT('k3e13259a', `🍅 已完成 ${this.ctrl.completedCycles} 轮`, this.ctrl.completedCycles) });
    contentEl.createDiv({
      cls: 'pomo-modal-desc',
      text: i18nT('ked3fbdb5', '累计专注 {0} 分钟，是否进入长休息（{1} 分钟）？',
        Math.round(this.ctrl.focusedMs / 60000), this.ctrl.settings.longBreakMin),
    });

    const row = contentEl.createDiv({ cls: 'pomo-modal-row' });
    row.createEl('button', { cls: 'pomo-btn mod-cta', text: i18nT('k5f922dfe', '进入长休息') }).onclick = () => {
      this.settled = true;
      this.dismiss();
      this.onYes();
    };
    row.createEl('button', { cls: 'pomo-btn', text: i18nT('k91c6e1ea', '继续专注') }).onclick = () => {
      this.settled = true;
      this.dismiss();
      this.onNo();
    };
  }

  onClose() {
    // 按 ESC 或点遮罩关闭时，视为「继续专注」
    if (!this.settled) this.onNo();
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 * 暂停过多询问：是否放弃当前进度、从本轮重新开始
 * ------------------------------------------------------------------ */
class AskRestartModal extends GuardedModal {
  constructor(app, ctrl, onRestart, onResume) {
    super(app, ctrl);
    this.onRestart = onRestart;
    this.onResume = onResume;
    this.settled = false;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('pomo-modal');
    contentEl.createEl('h3', { text: i18nT('k8dc0e283', '🍅 本轮已暂停多次') });
    contentEl.createDiv({
      cls: 'pomo-modal-desc',
      text: i18nT('k95cc0ea1', '已暂停 {0} 次，{1}还剩 {2}。要从本轮重新开始计时吗？',
        this.ctrl.pauseCount,
        stateName(this.ctrl.pausedFrom) || i18nT('kd4040472', '本段'),
        mmss(this.ctrl.pausedRemainMs)),
    });

    const row = contentEl.createDiv({ cls: 'pomo-modal-row' });
    row.createEl('button', { cls: 'pomo-btn mod-cta', text: i18nT('k616ddc13', '重新开始本轮') }).onclick = () => {
      this.settled = true;
      this.dismiss();
      this.onRestart();
    };
    row.createEl('button', { cls: 'pomo-btn', text: i18nT('ka6621a08', '继续当前进度') }).onclick = () => {
      this.settled = true;
      this.dismiss();
      this.onResume();
    };
  }

  onClose() {
    if (!this.settled) this.onResume();
    this.contentEl.empty();
  }
}

/* ------------------------------------------------------------------ *
 * 会话小结：专注、休息、暂停、跳过、时间段 + 可选的记录区块
 * ------------------------------------------------------------------ */
class SummaryModal extends GuardedModal {
  constructor(app, ctrl, data) {
    super(app, ctrl);
    this.data = data;
    this.titleText = i18nT('k7d6d5c68', '🍅 番茄任务结束');
    this.recorded = false; // \u672c\u6b21\u4f1a\u8bdd\u662f\u5426\u5df2\u8bb0\u5f55\u8fc7
    this.closing = false;
  }

  onOpen() {
    const { contentEl } = this;
    const d = this.data;
    contentEl.empty();
    contentEl.addClass('pomo-modal');

    contentEl.createEl('h3', { text: this.titleText });
    contentEl.createDiv({
      cls: 'pomo-modal-desc',
      text: i18nT('k451ed15e', '完成 {0} 轮 · 长休息 {1} 次', d.cycles, d.longBreaks),
    });

    const stats = contentEl.createDiv({ cls: 'pomo-summary' });
    stats.createDiv({
      cls: 'pomo-summary-row',
      text: i18nT('k02a2cc48', '专注 {0} 分钟 · 休息 {1} 分钟', d.focusMin, d.restMin),
    });
    stats.createDiv({
      cls: 'pomo-summary-row',
      text: i18nT('k41c81e58', '暂停 {0} 次', d.pauses),
    });
    if (d.range) stats.createDiv({ cls: 'pomo-summary-row mod-dim', text: d.range });

    // \u8df3\u8fc7\u4e0d\u8ba1\u5165\u7edf\u8ba1\uff0c\u5355\u72ec\u5217\u51fa
    if (d.skippedFocus || d.skippedBreak) {
      const parts = [];
      if (d.skippedFocus) parts.push(i18nT('k415fad66', '专注 {0} 段', d.skippedFocus));
      if (d.skippedBreak) parts.push(i18nT('k3e1033e7', '休息 {0} 段', d.skippedBreak));
      stats.createDiv({
        cls: 'pomo-summary-row mod-warn',
        text: i18nT('k767a365e', '跳过未计入：{0}', parts.join(' · ')),
      });
    }

    // \u6309\u94ae\u533a\uff1a\u8bb0\u5f55\u5728\u6700\u5de6\uff0cAgain \u4e0e\u597d\u7684\u6210\u7ec4\u9760\u53f3
    const row = contentEl.createDiv({ cls: 'pomo-modal-row pomo-modal-row-summary' });
    this.btnRow = row;
    this.rowCls = 'pomo-modal-row pomo-modal-row-summary';
    const rec = this.ctrl.plugin.settings.record;

    if (rec.enabled) {
      this.btnRecord = row.createEl('button', {
        cls: 'pomo-btn mod-record',
        text: i18nT('k620bf820', '记录'),
      });
      this.btnRecord.onclick = () => this.doRecord();
    }

    const right = row.createDiv({ cls: 'pomo-modal-row-right' });
    this.btnRight = right;
    this.btnRight = right;
    this.btnAgain = right.createEl('button', { cls: 'pomo-btn', text: 'Again' });
    this.btnAgain.onclick = () => this.doAgain();
    this.btnOk = right.createEl('button', {
      cls: 'pomo-btn mod-cta',
      text: i18nT('k375ec885', '好的'),
    });
    this.btnOk.onclick = () => this.dismiss();
  }

  /** \u662f\u5426\u9700\u8981\u5728\u5173\u95ed\u65f6\u81ea\u52a8\u8bb0\u5f55 */
  shouldAutoRecord() {
    const rec = this.ctrl.plugin.settings.record;
    return !!(rec.enabled && rec.autoRecord && !this.recorded);
  }

  /**
   * \u70b9\u300c\u8bb0\u5f55\u300d\uff1a\u5148\u5173\u5f39\u7a97\u518d\u5199\u3002
   * \u987a\u5e8f\u5f88\u91cd\u8981 \u2014\u2014 QuickAdd \u4f1a\u5f39\u81ea\u5df1\u7684\u9009\u62e9\u5668/\u8f93\u5165\u6846\uff0c
   * \u672c\u5f39\u7a97\u4e0d\u5173\u4f1a\u628a\u5b83\u6321\u4f4f\u3002
   */
  doRecord() {
    this.recorded = true;
    const data = this.data;
    this.dismiss();
    // \u5ef6\u8fdf\u4e00\u70b9\uff0c\u786e\u4fdd\u672c\u5f39\u7a97\u5df2\u5b8c\u5168\u79fb\u9664
    setTimeout(() => {
      this.runRecord(data).catch(() => {});
    }, 60);
  }

  /** \u70b9\u300cAgain\u300d\uff1a\u5173\u5f39\u7a97\u5e76\u91cd\u65b0\u6253\u5f00\u5f00\u59cb\u9762\u677f */
  doAgain() {
    this.dismiss();
    setTimeout(() => this.ctrl.openStart(), 60);
  }

  /** \u70b9\u300c\u597d\u7684\u300d\uff1a\u53ea\u5173\u95ed\uff1b\u82e5\u5f00\u4e86\u81ea\u52a8\u8bb0\u5f55\u5219\u5173\u95ed\u540e\u5199 */
  confirmClose() {
    this.dismiss();
    return Promise.resolve(false);
  }

  /** \u5b9e\u9645\u6267\u884c\u8bb0\u5f55\u5e76\u7ed9\u51fa\u53cd\u9988 */
  async runRecord(data) {
    try {
      await this.ctrl.plugin.recorder.record(data);
    } catch (e) {
      new obsidian.Notice('\u8bb0\u5f55\u5931\u8d25\uff1a' + (e && e.message ? e.message : '\u672a\u77e5\u9519\u8bef'));
    }
  }

  onClose() {
    const data = this.data;
    this.contentEl.empty();
    // \u81ea\u52a8\u8bb0\u5f55\u653e\u5728\u5173\u95ed\u540e\uff1a\u5f39\u7a97\u5148\u6d88\u5931\uff0cQuickAdd \u624d\u4e0d\u4f1a\u88ab\u6321
    if (this.shouldAutoRecord()) {
      this.recorded = true;
      setTimeout(() => {
        this.runRecord(data).catch(() => {});
      }, 60);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 浮窗 UI：可拖动、可吸附、可最小化
 * ------------------------------------------------------------------ */
/**
 * 当前的语义类别：focus / rest / idle。
 *
 * 两条容易写错的判定，这里集中处理，浮窗与侧边栏共用同一套：
 *   1. 暂停沿用暂停前的那一段 —— 否则一轮专注中途暂停会被当成「未开始」；
 *   2. WAITING（手动模式下等待开始下一段）按待开始的那一段算。
 *
 * 返回值只表示「现在属于哪一类」，不携带任何颜色：
 * 具体配色由 CSS 读 data-pomo-kind 决定，功能代码不碰外观。
 */
function kindOf(ctrl) {
  let st = ctrl.state === ST.PAUSED ? ctrl.pausedFrom || ST.FOCUS : ctrl.state;
  if (st === ST.WAITING) st = ctrl.pendingState || st;
  if (st === ST.FOCUS) return 'focus';
  if (st === ST.SHORT || st === ST.LONG) return 'rest';
  return 'idle';
}

class FloatUI {
  constructor(ctrl) {
    this.ctrl = ctrl;
    this.minimized = false;
    this.dragging = false;
    this._paint = {}; // 上一帧已写入的值：用于跳过无变化的 DOM 写入
    this.build();
  }

  /**
   * 脏检查写入：值没变就不碰 DOM。
   *
   * 为什么必须有：update() 每秒被 tick 调一次，但每秒真正会变的只有倒计时
   * 和进度条；标题、按钮文案、轮次圆点只在状态切换或完成一轮时才变。
   * 无差别重绘会让这些恒定节点每秒被白写一次（实测每帧 9 次 setText，
   * 其中 8 次完全冗余）。状态切换时值本身就变了，照样会写，手感不受影响。
   */
  _paintSet(key, value, apply) {
    if (this._paint[key] === value) return;
    this._paint[key] = value;
    apply(value);
  }

  _txt(el, key, value) {
    this._paintSet(key, value, (v) => el.setText(v));
  }

  _attr(key, value) {
    this._paintSet('@' + key, value, (v) => this.el.setAttribute(key, v));
  }

  _rmAttr(key) {
    const k = '@' + key;
    if (this._paint[k] === null) return;
    this._paint[k] = null;
    this.el.removeAttribute(key);
  }

  build() {
    const el = document.createElement('div');
    el.className = 'pomo-float pomo-hidden';
    applyTheme(el, this.ctrl.settings.theme);
    document.body.appendChild(el);
    this.el = el;

    // 头部：标题 + 轮次 + 设置 + 最小化/恢复 + 隐藏
    // 后两者带 pomo-hide-on-mini：最小化后头部只留恢复按钮
    const header = el.createDiv({ cls: 'pomo-float-header' });
    this.titleEl = header.createSpan({ cls: 'pomo-float-title', text: i18nT('ke772dd03', '🍅 番茄钟') });
    this.cycleEl = header.createSpan({ cls: 'pomo-float-cycle' });

    const gear = header.createSpan({ cls: 'pomo-float-btn pomo-hide-on-mini', text: '⚙' });
    gear.title = i18nT('kf164c4ad', '打开番茄钟设置');
    gear.onclick = () => this.ctrl.plugin.openSettings('pomodoro');

    const mini = header.createSpan({ cls: 'pomo-float-btn pomo-float-mini', text: '—' });
    mini.title = i18nT('ka7d84685', '最小化');
    mini.onclick = () => this.toggleMinimize();
    this.miniEl = mini;

    const close = header.createSpan({ cls: 'pomo-float-btn pomo-hide-on-mini', text: '×' });
    close.title = i18nT('kda43918a', '隐藏（计时继续，点状态栏唤回）');
    close.onclick = () => this.hide();

    // 主体：状态 / 倒计时 / 进度 / 按钮
    const body = el.createDiv({ cls: 'pomo-float-body' });
    this.stateEl = body.createDiv({ cls: 'pomo-state' });
    this.timeEl = body.createDiv({ cls: 'pomo-time' });
    this.dotsEl = body.createDiv({ cls: 'pomo-dots' });
    const bar = body.createDiv({ cls: 'pomo-bar' });
    this.barFillEl = bar.createDiv({ cls: 'pomo-bar-fill' });
    this.totalEl = body.createDiv({ cls: 'pomo-total' });

    const row = el.createDiv({ cls: 'pomo-float-row' });
    this.btnMain = row.createEl('button', { cls: 'pomo-btn', text: i18nT('k197c30db', '暂停') });
    this.btnMain.onclick = () => this.ctrl.togglePause();
    this.btnSkip = row.createEl('button', { cls: 'pomo-btn', text: i18nT('k3ae7f41f', '跳过') });
    this.btnSkip.onclick = () => this.ctrl.skip();
    /*
     * 计时方式快捷切换：只在「待开始」露出来。
     * 已经在跑的那一段不给切 —— 切了显示的数字会从「剩余」跳成「已过」，
     * 同一个数两种读法，足够让人以为计时坏了。
     */
    this.btnMode = row.createEl('button', { cls: 'pomo-btn', text: COUNTUP_ICON.count });
    this.btnMode.setAttribute('data-act', 'mode');
    this.btnMode.onclick = () => this.ctrl.toggleCountUp();
    // 保存引用：文字要随语言变化，必须在 update() 里走脏检查，
    // 不能用 createEl 一次性写死（refreshUI 只更新值、不重建节点）
    this.btnStop = row.createEl('button', { cls: 'pomo-btn' });
    this.btnStop.setAttribute('data-act', 'stop');
    this.btnStop.onclick = () => this.ctrl.stop();

    this.bindDrag(header);
    this.applyPosition();
    this.update();
  }

  /** 头部作为拖拽把手，按钮点击不触发拖拽 */
  bindDrag(handle) {
    handle.addClass('pomo-drag-handle');
    handle.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('pomo-float-btn')) return;
      this.dragging = true;
      const rect = this.el.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      this.el.addClass('pomo-dragging');
      e.preventDefault();
    });

    this._onMove = (e) => {
      if (!this.dragging) return;
      this.el.style.left = e.clientX - this.dragOffsetX + 'px';
      this.el.style.top = e.clientY - this.dragOffsetY + 'px';
      this.el.style.right = 'auto';
      this.el.style.bottom = 'auto';
      this.el.style.transform = 'none';
    };
    this._onUp = () => {
      if (!this.dragging) return;
      this.dragging = false;
      this.el.removeClass('pomo-dragging');
      // 吸附关闭时停在松手位置
      if (this.ctrl.settings.snapToEdge) this.snapToEdge();
      else this.saveFreePosition();
    };
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup', this._onUp);
  }

  /** 记下当前视口尺寸，供下次判断能否直接复用像素坐标 */
  rememberViewport() {
    this.ctrl.settings.lastVw = window.innerWidth;
    this.ctrl.settings.lastVh = window.innerHeight;
  }

  /** 视口尺寸是否与上次记录时一致 —— 一致才能安全复用像素坐标 */
  viewportUnchanged() {
    const s = this.ctrl.settings;
    return s.lastVw === window.innerWidth && s.lastVh === window.innerHeight;
  }

  /**
   * 吸附到最近的边。
   * 同时记下「沿边比例」和「沿边像素」：视口尺寸没变时用像素精确还原，
   * 尺寸变了才退回按比例换算，兼顾精确与自适应。
   */
  snapToEdge() {
    const rect = this.el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dists = {
      top: cy,
      bottom: window.innerHeight - cy,
      left: cx,
      right: window.innerWidth - cx,
    };
    let edge = 'right';
    for (const key of Object.keys(dists)) {
      if (dists[key] < dists[edge]) edge = key;
    }

    const horizontal = edge === 'top' || edge === 'bottom';
    const px = horizontal ? cx : cy;
    const span = horizontal ? window.innerWidth : window.innerHeight;

    const s = this.ctrl.settings;
    s.floatEdge = edge;
    s.floatOffset = clamp(px / span, 0.05, 0.95);
    s.floatPx = Math.round(px);
    this.rememberViewport();
    this.ctrl.plugin.saveSettings();
    this.applyPosition();
  }

  /** 自由放置：记精确像素，同时留一份比例用于窗口尺寸变化后换算 */
  saveFreePosition() {
    const rect = this.el.getBoundingClientRect();
    const maxX = Math.max(1, window.innerWidth - rect.width);
    const maxY = Math.max(1, window.innerHeight - rect.height);
    const s = this.ctrl.settings;
    s.freePxX = Math.round(rect.left);
    s.freePxY = Math.round(rect.top);
    s.freeX = clamp(rect.left / maxX, 0, 1);
    s.freeY = clamp(rect.top / maxY, 0, 1);
    this.rememberViewport();
    this.ctrl.plugin.saveSettings();
    this.applyPosition();
  }

  /** 把像素值夹回可视范围，避免窗口缩小后浮窗跑到屏幕外 */
  clampPx(value, span, size) {
    const max = Math.max(0, span - size);
    return Math.round(clamp(value, 0, max));
  }

  /** 按当前模式（吸附 / 自由）定位浮窗；视口未变时优先用精确像素 */
  applyPosition() {
    const s = this.ctrl.settings;
    const style = this.el.style;
    style.left = style.right = style.top = style.bottom = 'auto';
    style.transform = 'none';

    if (!s.snapToEdge) {
      const rect = this.el.getBoundingClientRect();
      const maxX = Math.max(1, window.innerWidth - rect.width);
      const maxY = Math.max(1, window.innerHeight - rect.height);
      // 视口尺寸未变 → 直接用像素；变了 → 按比例换算
      const x = this.viewportUnchanged() && s.freePxX !== null
        ? this.clampPx(s.freePxX, window.innerWidth, rect.width)
        : Math.round(s.freeX * maxX);
      const y = this.viewportUnchanged() && s.freePxY !== null
        ? this.clampPx(s.freePxY, window.innerHeight, rect.height)
        : Math.round(s.freeY * maxY);
      style.left = x + 'px';
      style.top = y + 'px';
      this.el.setAttribute('data-edge', 'free');
      return;
    }

    const horizontal = s.floatEdge === 'top' || s.floatEdge === 'bottom';
    const span = horizontal ? window.innerWidth : window.innerHeight;
    const along = this.viewportUnchanged() && s.floatPx !== null
      ? this.clampPx(s.floatPx, span, 0)
      : Math.round(s.floatOffset * span);

    if (horizontal) {
      style.left = along + 'px';
      style[s.floatEdge] = '12px';
      style.transform = 'translateX(-50%)';
    } else {
      style.top = along + 'px';
      style[s.floatEdge] = '12px';
      style.transform = 'translateY(-50%)';
    }
    this.el.setAttribute('data-edge', s.floatEdge);
  }

  toggleMinimize() {
    this.minimized = !this.minimized;
    this.update();
  }

  show() {
    this.el.removeClass('pomo-hidden');
    this.applyPosition();
    this.update();
  }

  hide() {
    this.el.addClass('pomo-hidden');
  }

  get visible() {
    return !this.el.hasClass('pomo-hidden');
  }

  destroy() {
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup', this._onUp);
    if (this.el) this.el.remove();
  }

  /**
   * 最小化时标题显示的模式名与配色类别。
   * 暂停沿用暂停前的那一段，否则一轮专注中途暂停会被误显示成「待开始」。
   */
  miniBadge() {
    const c = this.ctrl;
    // WAITING 是手动模式下「还没开始下一段」，用待开始的那一段来判断
    let st = c.state === ST.PAUSED ? c.pausedFrom || ST.FOCUS : c.state;
    if (st === ST.WAITING) st = c.pendingState || st;
    if (st === ST.FOCUS) return { text: i18nT('k44d41ebe', '专注'), kind: 'focus' };
    if (st === ST.SHORT || st === ST.LONG) return { text: i18nT('ke55c8529', '休息'), kind: 'rest' };
    return { text: i18nT('k7f378cec', '番茄钟'), kind: 'idle' };
  }

  update() {
    const c = this.ctrl;
    const st = c.state;
    this._attr('data-state', st);
    // 段类别：与最小化徽章同源（暂停沿用暂停前那一段）。
    // CSS 读这个属性上色，功能代码不写任何颜色值。
    // 浮窗与侧栏两个入口都必须写，缺一个那边就不上色。
    this._attr('data-pomo-kind', kindOf(c));
    this._paintSet('@mini', !!this.minimized, (v) => this.el.toggleClass('pomo-mini', v));
    this._txt(this.timeEl, 'time', c.displayTime());

    if (this.minimized) {
      // 标题从「番茄钟」换成本段模式名并上色（配色见 styles.css，走主题变量）
      const badge = this.miniBadge();
      this._txt(this.titleEl, 'title', badge.text);
      this._attr('data-mini-kind', badge.kind);
      this._txt(this.miniEl, 'mini', '□');
      this._paintSet('miniTitle', '恢复窗口', (v) => { this.miniEl.title = v; });
      this._txt(this.cycleEl, 'cycle', c.displayTime());
      return;
    }

    this._txt(this.titleEl, 'title', i18nT('k439d0eab', '🍅 番茄钟'));
    this._rmAttr('data-mini-kind');
    this._txt(this.miniEl, 'mini', '—');
    this._paintSet('miniTitle', i18nT('ka7d84685', '最小化'), (v) => { this.miniEl.title = v; });

    // 手动模式下等待开始下一段
    if (st === ST.WAITING) {
      const next = stateName(c.pendingState) || '专注';
      this._txt(this.stateEl, 'state', i18nT('kd6faf18e', '下一段：{0}', next));
      this._txt(this.cycleEl, 'cycle', i18nT('k9807dac6', '第 {0} 轮', c.completedCycles + 1));
      this._txt(this.btnMain, 'main',
        c.pendingState === ST.FOCUS ? i18nT('k70df2063', '开始专注') : i18nT('k6ba5a4b0', '开始休息')
      );
      this._txt(this.btnSkip, 'skip', i18nT('k92636e8c', '跳过'));
    } else {
      this._txt(this.stateEl, 'state', stateName(st));
      this._txt(this.cycleEl, 'cycle', st === ST.IDLE ? '' : i18nT('k9807dac6', '第 {0} 轮', c.completedCycles + 1));
      this._txt(this.btnMain, 'main',
        st === ST.PAUSED ? i18nT('k27ca568b', '继续')
          : st === ST.IDLE ? i18nT('ka3e3b883', '开始')
            : i18nT('k8d63ef38', '暂停')
      );
      this._txt(this.btnSkip, 'skip',
        st === ST.FOCUS ? i18nT('k1271c7e1', '跳过专注') : i18nT('k6542bb90', '跳过休息')
      );
    }

    // 「结束」也是会随语言变的，必须走脏检查（与 btnMain / btnSkip 同源）
    this._txt(this.btnStop, 'stop', i18nT('k1da8a247', '结束'));

    // 计时方式切换：只在本轮还没开始时显示，跑起来后藏起来
    if (this.btnMode) {
      this._paintSet('modeShow', st === ST.IDLE ? '' : 'none', (v) => {
        this.btnMode.style.display = v;
      });
      const up = c.settings.countUp === true;
      this._txt(this.btnMode, 'mode', up ? COUNTUP_ICON.up : COUNTUP_ICON.down);
      this.btnMode.setAttribute('title', up ? COUNTUP_ICON.upTitle : COUNTUP_ICON.downTitle);
      this.btnMode.setAttribute('aria-label', up ? COUNTUP_ICON.upTitle : COUNTUP_ICON.downTitle);
    }

    const interval = Math.max(1, c.settings.longBreakInterval);
    const inGroup = c.completedCycles % interval;
    let dots = '';
    for (let i = 0; i < interval; i++) dots += i < inGroup ? '●' : '○';
    this._txt(this.dotsEl, 'dots',
      dots + '  ' + i18nT('k5f9b47b7', '已完成 {0} 轮', c.completedCycles));

    const barW = (c.segmentProgress() * 100).toFixed(1) + '%';
    this._paintSet('bar', barW, (v) => { this.barFillEl.style.width = v; });

    const target = c.targetCycles
      ? i18nT('ka4e706c8', '目标 {0} 轮', c.targetCycles)
      : i18nT('k8d531e21', '目标不限');
    this._txt(this.totalEl, 'total',
      i18nT('k510b20d5', '{0} · 已专注 {1} 分钟', target, Math.round(c.focusedMs / 60000)));
  }
}

/* ------------------------------------------------------------------ *
 * 侧边栏视图：移动端与偏好固定位置时使用
 * ------------------------------------------------------------------ */
class PomodoroView extends obsidian.ItemView {
  constructor(leaf, ctrl) {
    super(leaf);
    this.ctrl = ctrl;
  }

  getViewType() {
    return POMODORO_VIEW_TYPE;
  }
  getDisplayText() {
    return '番茄钟';
  }
  getIcon() {
    return 'timer';
  }

  async onOpen() {
    this.render();
    /*
     * 本实例跑在独立窗口里时，把窗口设置应用上去。
     * 必须在这里做：主窗口调 openPopoutLeaf 后，主窗口的 activeWindow
     * 仍指向自己，改不到新建的那个窗口 —— 只有 pop-out 这份实例能改自己。
     */
    if (isPopoutWindow()) applyPopoutWindowSoon(this.ctrl.settings);
  }

  render() {
    const c = this.contentEl;
    const s = this.ctrl.settings;
    c.empty();
    c.addClass('pomo-container');
    applyTheme(c, s.theme);

    const header = c.createDiv({ cls: 'pomo-float-header' });
    header.createSpan({ cls: 'pomo-float-title', text: i18nT('ke772dd03', '🍅 番茄钟') });
    const gear = header.createSpan({ cls: 'pomo-float-btn', text: '⚙' });
    gear.title = i18nT('kf164c4ad', '打开番茄钟设置');
    gear.onclick = () => this.ctrl.plugin.openSettings('pomodoro');

    this.stateEl = c.createDiv({ cls: 'pomo-state' });
    this.timeEl = c.createDiv({ cls: 'pomo-time' });
    this.dotsEl = c.createDiv({ cls: 'pomo-dots' });
    const bar = c.createDiv({ cls: 'pomo-bar' });
    this.barFillEl = bar.createDiv({ cls: 'pomo-bar-fill' });
    this.totalEl = c.createDiv({ cls: 'pomo-total' });

    // 同上：外观一律交给 CSS，这里只挂 data-act 供用户改顺序 / 单独隐藏
    const row = c.createDiv({ cls: 'pomo-float-row pomo-actions' });
    this.btnMain = row.createEl('button', { cls: 'pomo-btn', text: i18nT('k22696cbc', '开始') });
    this.btnMain.setAttribute('data-act', 'main');
    this.btnMain.onclick = () =>
      this.ctrl.state === ST.IDLE
        ? this.ctrl.openStart()
        : this.ctrl.state === ST.WAITING
        ? this.ctrl.startPending()
        : this.ctrl.togglePause();
    const btnSkip = row.createEl('button', { cls: 'pomo-btn', text: i18nT('k3ae7f41f', '跳过') });
    btnSkip.setAttribute('data-act', 'skip');
    btnSkip.onclick = () => this.ctrl.skip();
    // 计时方式快捷切换（与浮窗同源：只在待开始时露出来）
    this.btnMode = row.createEl('button', { cls: 'pomo-btn', text: COUNTUP_ICON.count });
    this.btnMode.setAttribute('data-act', 'mode');
    this.btnMode.onclick = () => this.ctrl.toggleCountUp();
    // 同上：保存引用，文字在 update() 里随语言更新
    this.btnStop = row.createEl('button', { cls: 'pomo-btn' });
    this.btnStop.setAttribute('data-act', 'stop');
    this.btnStop.onclick = () => this.ctrl.stop();

    c.createDiv({
      cls: 'pomo-tip',
      text: i18nT('k897ba57d', `专注 ${s.focusMin} 分钟 · 短休 ${s.shortBreakMin} 分钟 · 每 ${s.longBreakInterval} 轮询问长休息`, s.focusMin, s.shortBreakMin, s.longBreakInterval),
    });

    this.update();
  }

  update() {
    if (!this.timeEl || !this.timeEl.setText) return;
    const ctrl = this.ctrl;
    const st = ctrl.state;

    // 与浮窗同源的语义类别，供 CSS 上色（暂停沿用暂停前的那一段）
    if (this.contentEl && this.contentEl.setAttribute) {
      this.contentEl.setAttribute('data-pomo-kind', kindOf(ctrl));
    }

    if (st === ST.WAITING) {
      const next = ctrl.pendingState === ST.FOCUS
        ? i18nT('ke217c5bf', '专注')
        : ctrl.pendingState === ST.LONG
          ? i18nT('kaf0f24e2', '长休息')
          : i18nT('k4fcaa04f', '短休息');
      this.stateEl.setText(i18nT('kd6faf18e', '下一段：{0}', next));
      this.btnMain.setText(
        ctrl.pendingState === ST.FOCUS ? i18nT('k70df2063', '开始专注') : i18nT('k6ba5a4b0', '开始休息')
      );
    } else {
      this.stateEl.setText(stateName(st));
      this.btnMain.setText(
        st === ST.IDLE ? i18nT('ka3e3b883', '开始') : st === ST.PAUSED ? i18nT('k27ca568b', '继续') : i18nT('k8d63ef38', '暂停')
      );
    }

    // 「结束」与浮窗同源：随语言更新，不能在 createEl 时写死
    if (this.btnStop) this.btnStop.setText(i18nT('k1da8a247', '结束'));

    // 计时方式切换：只在本轮还没开始时显示，跑起来后藏起来
    if (this.btnMode) {
      this.btnMode.style.display = st === ST.IDLE ? '' : 'none';
      const up = ctrl.settings.countUp === true;
      this.btnMode.setText(up ? COUNTUP_ICON.up : COUNTUP_ICON.down);
      this.btnMode.setAttribute('title', up ? COUNTUP_ICON.upTitle : COUNTUP_ICON.downTitle);
      this.btnMode.setAttribute('aria-label', up ? COUNTUP_ICON.upTitle : COUNTUP_ICON.downTitle);
    }

    this.timeEl.setText(ctrl.displayTime());

    const interval = Math.max(1, ctrl.settings.longBreakInterval);
    const inGroup = ctrl.completedCycles % interval;
    let dots = '';
    for (let i = 0; i < interval; i++) dots += i < inGroup ? '●' : '○';
    this.dotsEl.setText(i18nT('kd0800fb0', '{0}  已完成 {1} 轮', dots, ctrl.completedCycles));

    this.barFillEl.style.width = (ctrl.segmentProgress() * 100).toFixed(1) + '%';
    const target = ctrl.targetCycles
      ? i18nT('ka4e706c8', '目标 {0} 轮', ctrl.targetCycles)
      : i18nT('k8d531e21', '目标不限');
    this.totalEl.setText(
      i18nT('k510b20d5', '{0} · 已专注 {1} 分钟', target, Math.round(ctrl.focusedMs / 60000))
    );
  }
}

/* ------------------------------------------------------------------ *
 * 斜杠命令：输入 /pomodoro 唤起
 * ------------------------------------------------------------------ */
class PomodoroSuggest extends obsidian.EditorSuggest {
  constructor(plugin, ctrl) {
    super(plugin.app);
    this.plugin = plugin;
    this.ctrl = ctrl;
  }

  onTrigger(cursor, editor) {
    if (!editor) return null;
    const s = this.ctrl.settings;
    if (!s.enableSlashCommand) return null;

    const word = String(s.slashTrigger || '').trim().replace(/^\//, '');
    if (!word) return null;

    const trigger = '/' + word.toLowerCase();
    const textBefore = editor.getLine(cursor.line).slice(0, cursor.ch).toLowerCase();
    if (!textBefore.endsWith(trigger)) return null;

    return {
      start: { line: cursor.line, ch: cursor.ch - trigger.length },
      end: cursor,
      query: trigger,
    };
  }

  getSuggestions() {
    const s = this.ctrl.settings;
    const target = this.ctrl.targetCycles;
    return [
      {
        action: 'start',
        label: i18nT('k920aec3b', '🍅 开始番茄钟'),
        hint: target
          ? i18nT('ka4e706c8', '目标 {0} 轮', target)
          : i18nT('k390e1e9d', '专注 {0} 分钟 · 不限轮数', s.focusMin),
      },
      {
        action: 'open',
        label: i18nT('k396977ae', '📋 打开番茄钟面板'),
        hint: i18nT('kb9ab6cbd', '在侧边栏显示'),
      },
    ];
  }

  renderSuggestion(item, el) {
    el.addClass('pomo-suggest-item');
    /*
     * item.label / item.hint 在 getSuggestions() 里**已经包过 i18nT**
     * （k920aec3b / ka4e706c8 / k390e1e9d / k396977ae / kb9ab6cbd），
     * 这里再包 miscText 就是多余的一层 —— 判据看数据定义处，不看渲染处。
     */
    el.createDiv({ cls: 'pomo-suggest-label', text: item.label });
    el.createDiv({ cls: 'pomo-suggest-hint', text: item.hint });
  }

  selectSuggestion(item) {
    if (!this.context) return;
    const { editor, start, end } = this.context;
    // 先删掉触发词本身，不留痕迹在笔记里
    editor.replaceRange('', start, end);
    if (item.action === 'start') this.ctrl.quickStart();
    else this.ctrl.openSidebar();
  }
}

/* ------------------------------------------------------------------ *
 * 控制器：状态机 + 计时 + 统计 + 音效
 * ------------------------------------------------------------------ */
class PomodoroController {
  constructor(plugin) {
    this.plugin = plugin;

    // 运行时状态（不落盘，关闭 Obsidian 即清零）
    this.state = ST.IDLE;
    this.pendingState = null; // 手动模式下待开始的下一段
    this.endsAt = 0; // 当前段结束的绝对时间戳
    this.pausedRemainMs = 0;
    this.pausedFrom = null;
    this.segmentTotalMs = 0;
    // 正计时状态（不落盘）：当前段是否从 0 往上累加。只有专注段会置 true。
    this.countUp = false;
    this.countUpStartAt = 0; // 本段（或本次恢复）的开始时间戳
    this.countUpBaseMs = 0; // 暂停前累计的时长，恢复时以此为基数继续累加
    this.countUpNotified = false; // 软目标提醒是否已发过（每段只提醒一次）
    this.countUpRemindCount = 0; // 间隔提醒已发到第几个间隔（每段重新数）
    this.completedCycles = 0;
    this.targetCycles = null; // null 表示不限
    this.focusedMs = 0;
    this.restMs = 0;
    this.longBreaks = 0;
    this.skippedFocus = 0;
    this.skippedBreak = 0;
    this.focusSkippedThisCycle = false; // 本轮专注是否被跳过（跳过则不计入轮次）
    this.pauseCount = 0; // 当前段的暂停次数，达到阈值触发重开询问
    this.totalPauses = 0; // 本次会话的累计暂停次数，进入小结
    this.sessionStart = null;
    this.askAgainNextCycle = false;
    // 本实例是否刚刚自己结束了会话。跨窗口同步靠它区分
    // 「我清掉了共享文件」和「别人清掉了共享文件」，避免把自己也归位掉。
    this.endedLocally = false;

    /*
     * 跨窗口归属：只有「拥有者」实例会推进段切换、发声、写笔记。
     * 独立窗口模式下主窗口与独立窗口各有一个控制器实例，
     * 靠 PomoSync 的共享文件决定谁推进。非独立窗口模式恒为 true（本地独占）。
     */
    this.isSessionOwner = true;
    /*
     * 归属是否已写进共享文件。镜像刚接管时先置 false：
     * 只有确认过的拥有者才能推进段切换，否则两个实例可能同时判定「这一段结束了」。
     */
    this.ownerConfirmed = true;
    this.sync = null; // 在 init() 里创建，需要 plugin 与 app 就位

    this.intervalId = null;
    this.tickerRegistered = false; // 计时器是否已交给 Obsidian 托管
    this.lastTickSec = null; // 上次 tick 时渲染的剩余秒数，用于跳过冗余重绘
    this.floatUI = null;
    this.statusBar = null;
    this.soundFiles = []; // 自定义音效文件夹缓存
    this.soundIndex = 0;
  }

  get settings() {
    return this.plugin.settings.pomodoro;
  }

  get app() {
    return this.plugin.app;
  }

  get isMobile() {
    return !!(obsidian.Platform && obsidian.Platform.isMobile);
  }

  /** 当前使用的方案名 */
  get activeProfile() {
    const s = this.settings;
    return s.profiles.find((p) => p.id === s.activeProfileId) || s.profiles[0];
  }

  /** 把当前生效时长写回当前方案；设置页改时长或改名时用 */
  syncProfile(extra) {
    const p = this.activeProfile;
    if (!p) return;
    const s = this.settings;
    p.focusMin = s.focusMin;
    p.shortBreakMin = s.shortBreakMin;
    p.longBreakMin = s.longBreakMin;
    Object.assign(p, extra || {});
  }

  /* ---------------- 生命周期 ---------------- */

  init() {
    this.statusBar = this.plugin.addStatusBarItem();
    this.statusBar.addClass('pomo-status');
    this.statusBar.setText('🍅');
    this.statusBar.onclick = () => this.toggleFloat();

    // 自定义主题的 CSS 在启动时注入一次；之后由设置项变更驱动
    syncCustomCss(this.settings.theme, this.settings.customCss);

    if (!this.isMobile && this.settings.uiMode === 'floating') {
      this.floatUI = new FloatUI(this);
    }

    if (this.settings.showRibbonIcon) {
      this.plugin.addRibbonIcon('timer', '番茄钟', () => this.openStart());
    }

    this.registerCommands();
    this.refreshSoundFiles();

    /*
     * 独立窗口模式：挂上跨窗口同步。
     * 只有这个模式会开轮询 —— 浮窗 / 侧边栏都在同一个窗口里，
     * 不存在第二个控制器实例，不需要为它付出每秒一次的文件读取。
     */
    this.sync = new PomoSync(this);
    if (this.isPopoutMode) {
      /*
       * 独立窗口形态：本实例一开始不主张归属。
       * 默认给 true 的话，新开的窗口会自认拥有者并立刻心跳，
       * 与主窗口撞成两个拥有者 —— 段结束那一刻会被判定两次。
       * 这里交权给轮询：共享文件里有活跃会话且无人认领，才接管。
       */
      this.isSessionOwner = false;
      this.ownerConfirmed = false;
      this.sync.startPolling();
      this.sync.adoptOnBoot();
    }
  }

  /** 当前是否为「独立窗口」形态（移动端没有 pop-out，一律 false） */
  get isPopoutMode() {
    return !this.isMobile && this.settings.uiMode === 'popout';
  }

  registerCommands() {
    const p = this.plugin;
    p.addCommand({ id: 'time-tools-pomodoro-start', name: '番茄钟：开始', callback: () => this.openStart() });
    p.addCommand({
      id: 'time-tools-pomodoro-toggle-pause',
      name: '番茄钟：暂停 / 继续',
      callback: () => this.togglePause(),
    });
    p.addCommand({ id: 'time-tools-pomodoro-skip', name: '番茄钟：跳过当前段', callback: () => this.skip() });
    p.addCommand({ id: 'time-tools-pomodoro-stop', name: '番茄钟：结束会话', callback: () => this.stop() });
    p.addCommand({
      id: 'time-tools-pomodoro-start-next',
      name: '番茄钟：开始下一段（手动模式）',
      callback: () => this.startPending(),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-toggle-timer',
      name: '番茄钟：显示 / 隐藏计时器',
      callback: () => this.toggleFloat(),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-open-popout',
      name: '番茄钟：打开独立窗口',
      callback: () => this.openPopout(),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-toggle-desk-dock',
      name: '番茄钟：切换桌面常驻（缩小主窗口）',
      callback: () => this.toggleDeskDock(),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-reapply-window',
      name: '番茄钟：重新应用独立窗口设置',
      callback: () => this.reapplyWindow(),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-toggle-countup',
      name: '番茄钟：切换正计时（专注段不限时）',
      callback: () => this.toggleCountUp(),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-show-stats',
      name: '番茄钟：查看累计统计',
      callback: () => showStats(this.plugin),
    });
    p.addCommand({
      id: 'time-tools-pomodoro-open-settings',
      name: '番茄钟：打开番茄钟设置',
      callback: () => this.plugin.openSettings('pomodoro'),
    });
  }

  destroy() {
    this.clearTicker();
    /*
     * 卸载时交出控制权而不是清空：另一个窗口还在跑的话应该由它接手，
     * 而不是让会话凭空消失。全部窗口都关了，文件会在冷启动时按新鲜度丢弃。
     */
    if (this.sync) {
      this.sync.stopPolling();
      this.sync.release();
    }
    if (this.floatUI) this.floatUI.destroy();
    if (this.statusBar) this.statusBar.remove();
    // 插件卸载时移除注入的 <style>，别把节点留在 document.head 里
    removeCustomCssNode(getCustomCssNode());
  }

  /**
   * 把当前主题重新挂到所有在场的番茄钟界面上。
   * 设置里改主题时调用 —— 不重建浮窗，所以计时不会中断。
   */
  applyThemeToAll() {
    const theme = this.settings.theme;
    syncCustomCss(theme, this.settings.customCss);
    if (this.floatUI) applyTheme(this.floatUI.el, theme);
    // 侧边栏视图可能开了多个（不同面板），逐个刷新
    this.plugin.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE).forEach((leaf) => {
      if (leaf && leaf.view && leaf.view.contentEl) applyTheme(leaf.view.contentEl, theme);
    });
  }

  /* ---------------- 入口 ---------------- */

  openStart() {
    new StartModal(this.app, this).open();
  }

  /** 快捷启动：沿用上次方案与轮数 */
  quickStart() {
    if (this.state !== ST.IDLE) {
      this.revealUI();
      return;
    }
    this.startSession(this.settings.lastCycleChoice || null, this.settings.activeProfileId);
  }

  async startSession(target, profileId) {
    this.targetCycles = target && target > 0 ? target : null;
    this.settings.lastCycleChoice = this.targetCycles;

    // 切换方案：把方案时长同步为生效值
    if (profileId) {
      applyProfile(this.plugin.settings, profileId);
    }
    this.plugin.saveSettings();

    this.completedCycles = 0;
    this.focusedMs = 0;
    this.restMs = 0;
    this.longBreaks = 0;
    this.skippedFocus = 0;
    this.skippedBreak = 0;
    this.focusSkippedThisCycle = false; // 本轮专注是否被跳过（跳过则不计入轮次）
    this.pauseCount = 0;
    this.totalPauses = 0;
    this.askAgainNextCycle = false;
    this.sessionStart = Date.now();
    this.endedLocally = false; // 新会话开始，重新参与归属判定

    /*
     * 谁点的开始，谁就是拥有者。
     * 先起段（endsAt 就位）再开窗 —— 开窗会顺带把控制权交给独立窗口，
     * 那时共享文件里必须是完整状态，否则对方接过去拿到的是空倒计时。
     */
    this.isSessionOwner = true;
    this.ownerConfirmed = !this.sync || !this.sync.available;
    this.enterFocus();
    this.revealUI();
    if (this.sync && !this.isPopoutMode) {
      await this.sync.write(true);
      this.ownerConfirmed = true;
    }
  }

  revealUI() {
    if (this.isPopoutMode) {
      this.openPopout();
      return;
    }
    if (this.isMobile || this.settings.uiMode === 'sidebar') {
      this.openSidebar();
      return;
    }
    if (!this.floatUI) this.floatUI = new FloatUI(this);
    this.floatUI.show();
  }

  /**
   * 切换「桌面常驻」：把 Obsidian 主窗口缩成番茄钟大小、置顶、摆到屏幕角上。
   *
   * 为什么有这条路：独立窗口的系统标题栏去不掉（Electron frame 只能建窗时指定），
   * 达不到「桌面上一个无边框小番茄钟」的观感，所以反过来缩小主窗口本身。
   *
   * 必须在**主窗口**里执行 —— electronWindow 指向本窗口，在 pop-out 里调会改错窗口。
   *
   * 关闭时一定会尝试还原原尺寸：主窗口被缩小后如果不还原，
   * Obsidian 就一直是个小窗，那比不做这个功能更糟。还原失败也要明确告诉用户，
   * 不能静默 —— 否则他以为开关关了，其实窗口永远回不去了。
   */
  toggleDeskDock() {
    const s = this.settings;
    const on = !s.deskDock;
    const r = applyDeskDock(on, s);
    s.deskDock = r.ok ? on : !!s.deskDock; // 没做成就别把开关也翻过去
    const left = r.ok && on ? leaveSettingsForDock(this.plugin, this) : true;
    this.plugin.saveSettings();

    let msg;
    if (r.reason === 'no-electron') {
      msg = '当前环境不支持窗口控制，桌面常驻未生效';
    } else if (on) {
      msg = r.ok
        ? '桌面常驻已开启：主窗口已缩小并置顶' +
          (s.uiMode === 'floating' ? '' : '（当前界面形态不是浮窗，小窗里看不到番茄钟）') +
          (left ? '' : '（没能自动离开设置页，请手动关掉）') +
          '（再次运行可还原）'
        : '桌面常驻开启失败，主窗口未改动';
    } else {
      msg = r.restored
        ? '桌面常驻已关闭：主窗口已还原'
        : '桌面常驻已关闭，但没能还原原尺寸 —— 请手动拖动窗口';
    }
    if (typeof obsidian.Notice === 'function') new obsidian.Notice(msg);
    return r;
  }

  /**
   * 重新应用独立窗口的全部外观设置：置顶 / 尺寸 / 位置 / 隐藏界面元素。
   *
   * 为什么需要：设置页多半是在**主窗口**里改的，改完存进 data.json，
   * 但独立窗口那份插件实例读的还是自己内存里的旧值 —— 它只在 onOpen 时应用一次，
   * 不会去监听配置变化，这条命令让用户在独立窗口里当场重刷。
   *
   * 只在独立窗口里运行才有意义：主窗口的 electronWindow 指向主窗口自己，改不到它。
   */
  reapplyWindow() {
    const r = applyPopoutWindow(this.settings);
    const REASON = {
      'no-electron': '当前环境拿不到系统窗口接口，仅隐藏界面元素生效',
      'pos-system': '开窗位置设为「交给系统决定」，未干预位置',
      'no-screen': '读不到屏幕尺寸，未定位',
      'no-size': '量不到窗口尺寸，未定位',
      'no-move-api': '窗口接口不支持移动，未定位',
      'move-failed': '定位失败',
      'onTop-failed': '置顶失败',
    };
    const msg =
      '独立窗口设置已重新应用：' +
      (r.onTop ? '置顶✓' : '置顶✗') +
      ' ' +
      (r.positioned ? '定位✓' : '定位✗') +
      ' ' +
      (r.borderless ? '隐藏界面元素✓' : '隐藏界面元素✗') +
      (r.reason ? '（' + (REASON[r.reason] || r.reason) + '）' : '');
    if (typeof obsidian.Notice === 'function') new obsidian.Notice(msg);
    return r;
  }

  /**
   * 打开独立窗口（pop-out window）。
   *
   * 独立窗口是另一个 Electron 窗口，插件会在里面重新加载一份，
   * 因此这里只负责「开窗 + 把视图放进去」，不直接驱动它：
   * 控制权通过 PomoSync 的共享文件交接（见 release()）。
   * 移动端 / 旧版不支持 pop-out 时回退到侧边栏。
   */
  async openPopout() {
    const ws = this.app.workspace;
    /*
     * 本窗口里已经有番茄钟视图时只聚焦它，不再叠开一个窗口。
     * 这条同时挡住了「从独立窗口里再开一个独立窗口」——
     * 独立窗口自己也是一份插件实例，startSession 会走到这里。
     */
    const mine = ws.getLeavesOfType(POMODORO_VIEW_TYPE);
    if (mine.length > 0 && typeof ws.revealLeaf === 'function') {
      ws.revealLeaf(mine[0]);
      return true;
    }
    if (typeof ws.openPopoutLeaf !== 'function') {
      this.openSidebar();
      return false;
    }
    try {
      const data = this.popoutWindowData();
      const leaf = data ? ws.openPopoutLeaf(data) : ws.openPopoutLeaf();
      if (leaf && typeof leaf.setViewState === 'function') {
        await leaf.setViewState({ type: POMODORO_VIEW_TYPE, active: true });
      }
      /*
       * 交出控制权：本实例降级为镜像，独立窗口在下一个轮询周期接手驱动。
       * 计时器不停 —— tick() 会走镜像分支继续渲染，只是不再推进段切换。
       */
      this.isSessionOwner = false;
      if (this.sync) await this.sync.release();
      this.startTicker();
      return true;
    } catch (e) {
      // pop-out 不支持（移动端或 Electron 过旧）时静默回退，别打断用户
      this.openSidebar();
      return false;
    }
  }

  /**
   * 传给 openPopoutLeaf 的窗口初始化数据。
   * 只有用户填了宽高才传 —— 传了就是「建议尺寸」，由系统决定最终大小。
   * 窗口位置（x / y）不提供：跨显示器时写死坐标容易把窗口开到屏幕外。
   */
  popoutWindowData() {
    const s = this.settings;
    const w = Number(s.popoutWidth);
    const h = Number(s.popoutHeight);
    if (!(w > 0) || !(h > 0)) return null;
    return { size: { width: Math.round(w), height: Math.round(h) } };
  }

  toggleFloat() {
    if (this.isPopoutMode) {
      this.openPopout();
      return;
    }
    if (this.isMobile || this.settings.uiMode === 'sidebar') {
      this.openSidebar();
      return;
    }
    if (!this.floatUI) this.floatUI = new FloatUI(this);
    if (this.floatUI.visible) this.floatUI.hide();
    else this.floatUI.show();
  }

  openSidebar() {
    const ws = this.app.workspace;
    let leaf = ws.getLeavesOfType(POMODORO_VIEW_TYPE)[0];
    if (!leaf) {
      leaf = ws.getRightLeaf(false);
      if (!leaf) return;
      leaf.setViewState({ type: POMODORO_VIEW_TYPE, active: true });
    }
    ws.revealLeaf(leaf);
  }

  /* ---------------- 状态流转 ---------------- */

  enterFocus() {
    this.startSegment(ST.FOCUS, this.settings.focusMin);
  }
  enterShortBreak() {
    this.startSegment(ST.SHORT, this.settings.shortBreakMin);
  }
  enterLongBreak() {
    this.startSegment(ST.LONG, this.settings.longBreakMin);
  }

  /** 开启一段计时：用绝对结束时间戳，避免窗口失焦时累减走慢 */
  startSegment(state, minutes) {
    this.state = state;
    this.lastTickSec = null; // 新段强制重绘一次
    this.pendingState = null;
    this.segmentTotalMs = minutes * 60 * 1000;
    this.endsAt = Date.now() + this.segmentTotalMs;
    this.pauseCount = 0; // 每段重新计暂停次数
    /*
     * 正计时只对专注段生效：休息段是固定时长的恢复，正计时没有意义。
     * 置位必须在 startTicker 之前 —— tick 第一帧就会读它决定分支。
     */
    this.countUp = state === ST.FOCUS && this.settings.countUp === true;
    this.countUpBaseMs = 0;
    this.countUpStartAt = Date.now();
    this.countUpNotified = false;
    this.countUpRemindCount = 0;
    this.startTicker();
    this.refreshUI();
  }

  /** 手动模式：进入待开始，等用户点按钮 */
  waitFor(state) {
    this.state = ST.WAITING;
    this.pendingState = state;
    const minutes =
      state === ST.FOCUS
        ? this.settings.focusMin
        : state === ST.LONG
        ? this.settings.longBreakMin
        : this.settings.shortBreakMin;
    this.segmentTotalMs = minutes * 60 * 1000;
    this.endsAt = Date.now() + this.segmentTotalMs;
    this.clearTicker();
    if (this.settings.notifyOnSegmentEnd) {
      new obsidian.Notice(state === ST.FOCUS ? '⏸ 休息结束，点开始专注' : '⏸ 专注结束，点开始休息');
    }
    this.refreshUI();
  }

  /** 开始待开始的那一段（手动模式） */
  startPending() {
    this.ensureOwner();
    if (this.state !== ST.WAITING || !this.pendingState) return;
    const next = this.pendingState;
    this.startSegment(next, this.segmentTotalMs / 60000);
  }

  /**
   * 启动计时。
   * registerInterval 只调用一次 —— 它只是把 id 交给 Obsidian 统一托管，
   * 每段都调会让内部数组持续累积（虽不泄漏，但没有必要）。
   */
  startTicker() {
    this.clearTicker();
    this.intervalId = window.setInterval(() => this.tick(), 250);
    if (!this.tickerRegistered && typeof this.plugin.registerInterval === 'function') {
      this.plugin.registerInterval(this.intervalId);
      this.tickerRegistered = true;
    }
  }

  clearTicker() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 计时轮询（每 250ms 一次）。
   * 显示精度只到秒，若每次 tick 都重绘，会有 3/4 的 DOM 写入完全冗余。
   * 这里只在「剩余秒数」真的变化时刷新，大幅减少无谓写入。
   * 状态切换（开始 / 暂停 / 跳段）时由各自方法直接调 refreshUI，不受此影响。
   */
  tick() {
    if (this.state === ST.IDLE || this.state === ST.PAUSED || this.state === ST.WAITING) return;

    /*
     * 镜像实例（独立窗口模式下非拥有者的那一方）：只渲染倒计时，不推进状态。
     * 段切换、提示音、写笔记只由拥有者做，否则两个窗口会各跑一份、重复记录。
     * 倒计时用的是绝对结束时间戳，所以镜像自己算即可，不依赖对方频繁写盘。
     */
    if (!this.isSessionOwner) {
      const r = this.remainMs();
      const s = Math.ceil(r / 1000);
      if (s !== this.lastTickSec) {
        this.lastTickSec = s;
        this.refreshUI();
      }
      return;
    }
    // 还没拿到归属确认：只渲染，不推进 —— 此时推进可能与原拥有者撞车
    if (!this.ownerConfirmed) {
      const r2 = this.remainMs();
      const s2 = Math.ceil(r2 / 1000);
      if (s2 !== this.lastTickSec) {
        this.lastTickSec = s2;
        this.refreshUI();
      }
      return;
    }
    // 拥有者顺带续一次心跳（内部限流），告诉别的窗口「我还在」
    if (this.sync) this.sync.heartbeat();

    /*
     * 正计时：永不自动结束，只有用户点「跳过」或结束会话才停。
     * 必须在这里显式 return —— 若让下面「剩余归零即结束」那段接管，
     * 开头那一帧 remainMs 还是 0，会被当场误判成「这一段已经结束」。
     */
    if (this.countUp) {
      const el = this.elapsedMs();
      const sec = Math.floor(el / 1000);
      if (sec !== this.lastTickSec) {
        this.lastTickSec = sec;
        this.refreshUI();
      }
      this.checkCountUpTarget(el);
      this.checkCountUpInterval(el);
      // 达上限会停表：命中就立即返回，别再刷新、也别再继续累加。
      if (this.checkCountUpMax(el)) return;
      return;
    }

    const remain = this.remainMs();
    if (remain > 0) {
      const sec = Math.ceil(remain / 1000);
      if (sec !== this.lastTickSec) {
        this.lastTickSec = sec;
        this.refreshUI();
      }
      return;
    }
    this.onSegmentEnd(false);
  }

  /**
   * 界面显示的「剩余 / 已过」毫秒。
   * 正计时时这里返回**已过**时长：界面各处都读它，不改调用方即可统一切换语义。
   * 也正因为永远为正，倒计时那段「剩余归零就结束」的逻辑不会被触发。
   */
  remainMs() {
    if (this.state === ST.IDLE) return 0;
    if (this.state === ST.PAUSED) return this.pausedRemainMs;
    if (this.countUp) return this.elapsedMs();
    return Math.max(0, this.endsAt - Date.now());
  }

  /**
   * 当前段已经过去的毫秒。
   * 注意不要与 remainMs 互相调用 —— 两个函数曾经递归过一次，直接栈溢出。
   */
  elapsedMs() {
    if (this.countUp) {
      if (this.state === ST.PAUSED) return this.countUpBaseMs;
      return this.countUpBaseMs + Math.max(0, Date.now() - this.countUpStartAt);
    }
    return Math.max(0, this.segmentTotalMs - this.remainMs());
  }

  /**
   * 界面显示的计时文本。
   * 正计时超过一小时补小时位（75:30 这种数没人看得懂），倒计时保持 MM:SS。
   */
  displayTime() {
    const ms = this.remainMs();
    return this.countUp && ms >= 3600000 ? hmmss(ms) : mmss(ms);
  }

  /**
   * 正计时的硬上限：累加到上限就自动停表。
   * 忘了停的话计时器会一直跑，而超过一天的专注时长通常意味着「人已经不在电脑前」，
   * 这段数据不可信 —— 所以到点直接停，且**不计入专注时长**，由用户重新开始。
   * 返回 true 表示已停表（调用方应立即 return）。
   */
  checkCountUpMax(elapsed) {
    if (this.state === ST.PAUSED || this.state === ST.IDLE) return false;
    const maxMin = Number(this.settings.countUpMaxMin);
    if (!(maxMin > 0)) return false; // 0 = 不设上限（用户自己承担一直跑的后果）
    if (elapsed < maxMin * 60 * 1000) return false;
    this.stopCountUpAtLimit(maxMin);
    return true;
  }

  /** 达到上限：停表 + 回到待开始 + 给用户可见提示（绝不能只 console.warn）。 */
  stopCountUpAtLimit(maxMin) {
    this.clearTicker();
    this.countUp = false;
    this.countUpBaseMs = 0;
    this.countUpStartAt = 0;
    this.state = ST.IDLE;
    this.pendingState = null;
    const label = maxMin >= 60
      ? i18nT('k34d7423c', '{0} 小时', Math.round((maxMin / 60) * 100) / 100)
      : i18nT('k4444fa5f', '{0} 分钟', maxMin);
    new obsidian.Notice(
      i18nT('k12099bc3',
        '⏱ 正计时已达上限（{0}），已自动停止。本次时长不计入统计 —— 要继续请点「开始」重新计时。',
        label)
    );
    this.playSound();
    /*
     * 立刻把「已停表」广播给其他窗口。
     * 不写的话镜像要等到下一次心跳（最多 1 秒）才知道，期间仍显示旧的累计数字；
     * 若它正好在此间接管，还会接着往上加。write 内部有 try/catch，不 await ——
     * 免得把 tick 拖成异步（绝大多数场景根本没有第二个实例）。
     */
    if (this.sync) this.sync.write(false);
    this.refreshUI();
  }

  /**
   * 正计时的间隔提醒：每累加到 N 分钟的倍数就提醒一次（N=20 → 20/40/60…）。
   *
   * 与软目标的区别：软目标只响一次，这个是**持续**的节拍器。
   * 用「已过时长除以间隔」的整数个数判断，而不是「又过了 N 分钟吗」——
   * 后者在系统休眠、切后台被节流时会漏掉整拍，前者醒来后补上最新那一拍，
   * 且不会把错过的每一拍都补发成一条通知。
   */
  checkCountUpInterval(elapsed) {
    const every = Number(this.settings.countUpRemindEveryMin);
    if (!(every > 0)) return; // 0 = 关
    const step = every * 60 * 1000;
    const n = Math.floor(elapsed / step);
    if (n < 1 || n <= this.countUpRemindCount) return;
    this.countUpRemindCount = n;
    if (this.settings.notifyOnSegmentEnd) {
      new obsidian.Notice(
        i18nT('k755ee078', '⏱ 已专注 {0} 分钟（正计时仍在进行，要结束请点「跳过」）', n * every)
      );
    }
    this.playSound();
    // 同步提醒计数：否则镜像窗口拿到的是 0，接管后会把已经发过的那一拍再发一次
    if (this.sync) this.sync.write(true);
  }

  /** 正计时的软目标：到点只提醒一次，不结束计时。 */
  checkCountUpTarget(elapsed) {
    const targetMin = Number(this.settings.countUpTargetMin);
    if (!(targetMin > 0) || this.countUpNotified) return;
    if (elapsed < targetMin * 60 * 1000) return;
    this.countUpNotified = true;
    if (this.settings.notifyOnSegmentEnd) {
      new obsidian.Notice(`⏱ 已专注 ${targetMin} 分钟（正计时不自动结束，要结束请点「跳过」）`);
    }
    this.playSound();
  }

  segmentProgress() {
    // 正计时没有总时长：设了软目标就按软目标画，没设就留空（画成满格会误导成"快结束了"）
    if (this.countUp) {
      const targetMin = Number(this.settings.countUpTargetMin);
      if (!(targetMin > 0)) return 0;
      return clamp(this.elapsedMs() / (targetMin * 60 * 1000), 0, 1);
    }
    if (!this.segmentTotalMs) return 0;
    return clamp((this.segmentTotalMs - this.remainMs()) / this.segmentTotalMs, 0, 1);
  }

  /**
   * 一段结束。
   * skipped 为 true 表示手动跳过：不计入专注 / 休息时长，单独统计跳过次数。
   */
  onSegmentEnd(skipped) {
    const finished = this.state;
    const elapsed = this.countUp ? this.elapsedMs() : this.segmentTotalMs - this.remainMs();
    this.clearTicker();

    /*
     * 正计时的「跳过」不等于「放弃」：它没有"没做完"这回事 ——
     * 你什么时候停，这一段就是多长。所以跳过也照记时长，
     * 只是不计入「跳过次数」（那个是给倒计时用的：没做完就撤）。
     * 倒计时维持原样，避免把没做完的时间混进统计。
     */
    const countThis = !skipped || this.countUp;
    if (countThis) {
      if (finished === ST.FOCUS) this.focusedMs += elapsed;
      else this.restMs += elapsed;
      if (finished === ST.LONG) this.longBreaks += 1;

      if (this.settings.notifyOnSegmentEnd) {
        new obsidian.Notice(finished === ST.FOCUS ? '🍅 专注结束，休息一下' : '休息结束，开始专注');
      }
      this.playSound();
    }

    // 专注结束 → 短休息
    if (finished === ST.FOCUS) {
      if (skipped && !this.countUp) {
        this.skippedFocus += 1;
        // 这一轮的专注是被跳过的，后面休息走完也**不算完成一轮** ——
        // 否则「跳过 4 次」和「认真做完 4 轮」在计数上完全一样，
        // 长休息的触发节奏和「已完成 N 轮」都会失真。
        // 正计时例外：它的跳过等于「到此为止」，时长照记，是正常完成。
        this.focusSkippedThisCycle = true;
      }
      this.nextSegment(ST.SHORT);
      return;
    }

    // 短休息结束 → 完成一轮
    if (finished === ST.SHORT) {
      if (skipped) this.skippedBreak += 1;
      if (!this.focusSkippedThisCycle) this.completedCycles += 1;
      this.focusSkippedThisCycle = false;
      if (this.targetCycles && this.completedCycles >= this.targetCycles) {
        this.finishSession();
        return;
      }
      const interval = Math.max(1, this.settings.longBreakInterval);
      // completedCycles 为 0 时不能取模判断：0 % 任何数都是 0，
      // 会在「刚跳过专注、还没真正完成一轮」时误弹长休息询问。
      const shouldAsk =
        (this.completedCycles > 0 && this.completedCycles % interval === 0) ||
        this.askAgainNextCycle;
      this.askAgainNextCycle = false;
      if (shouldAsk) this.askLongBreak();
      else this.nextSegment(ST.FOCUS);
      return;
    }

    // 长休息结束 → 按设置决定是否清零
    if (skipped) this.skippedBreak += 1;
    if (this.settings.resetAfterLongBreak) this.completedCycles = 0;
    if (this.targetCycles && this.completedCycles >= this.targetCycles) {
      this.finishSession();
      return;
    }
    this.nextSegment(ST.FOCUS);
  }

  /** 流转到下一段：自动模式直接开始，手动模式停在待开始 */
  nextSegment(state) {
    if (this.settings.autoStartNext) {
      if (state === ST.FOCUS) this.enterFocus();
      else if (state === ST.LONG) this.enterLongBreak();
      else this.enterShortBreak();
    } else {
      this.waitFor(state);
    }
  }

  askLongBreak() {
    this.refreshUI();
    new AskLongBreakModal(
      this.app,
      this,
      () => this.nextSegment(ST.LONG),
      () => {
        // 点了「继续专注」：按设置决定下一轮结束是否立刻再问
        if (this.settings.declineBehavior === 'nextCycle') this.askAgainNextCycle = true;
        this.nextSegment(ST.FOCUS);
      }
    ).open();
  }

  /**
   * 切换正计时。
   * 正在跑的那一段不改语义 —— 中途从倒计时切成正计时，显示的数字会从「剩余」
   * 跳成「已过」，同一个数两种读法，足以让人以为计时坏了。所以只影响下一段。
   */
  toggleCountUp() {
    const s = this.settings;
    s.countUp = !(s.countUp === true);
    this.plugin.saveSettings();
    let msg = s.countUp
      ? i18nT('kcb1d77a3', '正计时已开启：专注段不限时，从 0 往上累加，点「跳过」结束。')
      : i18nT('k59469d2e', '正计时已关闭：专注段恢复为倒计时。');
    if (this.state === ST.FOCUS || this.state === ST.PAUSED) {
      msg += i18nT('ke1485b10', '当前段保持不变，下一段生效。');
    }
    new obsidian.Notice(msg);
    // 界面上那个「正计时：开 / 关」按钮要跟着变，命令入口没有别的刷新时机
    this.refreshUI();
  }

  /* ---------------- 暂停 ---------------- */

  togglePause() {
    this.ensureOwner();
    if (this.state === ST.IDLE) {
      this.openStart();
      return;
    }
    if (this.state === ST.WAITING) {
      this.startPending();
      return;
    }

    if (this.state === ST.PAUSED) {
      this.state = this.pausedFrom || ST.FOCUS;
      this.endsAt = Date.now() + this.pausedRemainMs;
      // 正计时：暂停期间不累加，恢复时以已累计时长为新基数继续往上走
      if (this.countUp) {
        this.countUpBaseMs = this.pausedRemainMs;
        this.countUpStartAt = Date.now();
      }
      this.startTicker();
      this.refreshUI();
      return;
    }

    // 进入暂停
    this.pausedFrom = this.state;
    this.pausedRemainMs = this.remainMs();
    this.state = ST.PAUSED;
    this.pauseCount += 1;
    this.totalPauses += 1;
    this.clearTicker();
    this.refreshUI();

    // 暂停次数达标：询问是否重开本轮
    if (this.pauseCount >= Math.max(1, this.settings.pauseThreshold)) {
      this.askRestart();
    }
  }

  askRestart() {
    new AskRestartModal(
      this.app,
      this,
      () => {
        // 重新开始本轮：整段从头计时，已用时间作废
        const from = this.pausedFrom || ST.FOCUS;
        this.state = from;
        this.endsAt = Date.now() + this.segmentTotalMs;
        this.pauseCount = 0;
        /*
         * 正计时必须在这里归零 —— 它只认 countUpBaseMs / countUpStartAt，
         * 不认 endsAt。漏了这两行的话，点「重新开始本轮」界面上毫无变化，
         * 计时会接着暂停前的数字继续走，等于重置失效。
         */
        if (this.countUp) this.resetCountUpProgress();
        this.startTicker();
        this.refreshUI();
      },
      () => {
        // 继续当前进度
        const from = this.pausedFrom || ST.FOCUS;
        this.state = from;
        this.endsAt = Date.now() + this.pausedRemainMs;
        this.pauseCount = 0;
        /*
         * 同上：正计时要以「暂停时的已过时长」为新起点。
         * 不重置 countUpStartAt 的话，暂停期间流逝的时间会被算进专注时长。
         */
        if (this.countUp) {
          this.countUpBaseMs = this.pausedRemainMs;
          this.countUpStartAt = Date.now();
        }
        this.startTicker();
        this.refreshUI();
      }
    ).open();
  }

  /** 把正计时的累计归零（重新开始本轮 / 会话结束时用） */
  resetCountUpProgress() {
    this.countUpBaseMs = 0;
    this.countUpStartAt = Date.now();
    this.countUpNotified = false;
    this.countUpRemindCount = 0;
  }

  /* ---------------- 跳过 / 结束 ---------------- */

  skip() {
    this.ensureOwner();
    if (this.state === ST.IDLE || this.state === ST.PAUSED) return;
    if (this.state === ST.WAITING) {
      // 手动模式下跳过待开始的段，跳到再下一段
      const next = this.pendingState === ST.FOCUS ? ST.SHORT : ST.FOCUS;
      this.onSegmentEndSkippedWaiting(next);
      return;
    }
    this.onSegmentEnd(true);
  }

  /** 跳过待开始的段：不计入时长，只在跳过统计里体现 */
  onSegmentEndSkippedWaiting(next) {
    if (this.pendingState === ST.FOCUS) this.skippedFocus += 1;
    else this.skippedBreak += 1;
    this.nextSegment(next);
  }

  stop() {
    this.ensureOwner();
    if (this.state === ST.IDLE) return;

    /*
     * 已经确认归属：直接结束，保持「点了立刻生效」的手感。
     * 绝大多数场景（浮窗 / 侧边栏，或独立窗口里本就是拥有者）走这一条。
     */
    if (this.ownerConfirmed) {
      this.finishSession();
      return;
    }
    /*
     * 需要从镜像手里抢归属：必须**等到共享文件里确实写着自己**再结束。
     * 否则对面仍认为自己是拥有者，这边结束记一次、那边到点再记一次 —— 笔记两条重复记录。
     * 只有这一条路会晚一拍，而它只在独立窗口模式下出现；暂停、跳段不受影响。
     */
    this.ensureOwnerAsync().then(() => {
      if (this.state !== ST.IDLE) this.finishSession();
    });
  }

  /**
   * 界面上的操作统一先走这里：谁最后点按钮，谁就成为拥有者。
   *
   * 特意做成同步：暂停 / 跳过这类按钮不能因为一次文件读写而延迟生效，
   * 而且绝大多数场景（非独立窗口形态）根本不存在第二个实例，无需交接。
   * 真正需要交接时，先用内存里最新的共享快照对齐，再异步确认归属。
   */
  ensureOwner() {
    if (this.isSessionOwner && this.ownerConfirmed) return;
    if (!this.sync || !this.sync.available) {
      this.isSessionOwner = true;
      this.ownerConfirmed = true;
      return;
    }
    if (this.isSessionOwner) {
      this.ownerConfirmed = true;
      return;
    }
    // 镜像接管：以最近一次轮询到的共享状态为准，避免用落后的数字覆盖对方
    this.sync.applyLastSeen();
    this.isSessionOwner = true;
    this.ownerConfirmed = false; // 确认前不推进段切换
    this.startTicker();
    this.sync.ensureOwner();
  }

  /**
   * ensureOwner 的异步版：等到共享文件里确实写着自己，才算拿到归属。
   * 只有「结束会话」需要它 —— 那是唯一会写进笔记的动作（见 stop）。
   */
  async ensureOwnerAsync() {
    if (this.isSessionOwner && this.ownerConfirmed) return;
    if (!this.sync || !this.sync.available) {
      this.isSessionOwner = true;
      this.ownerConfirmed = true;
      return;
    }
    if (this.isSessionOwner) {
      const ok = await this.sync.write(true);
      this.ownerConfirmed = !!ok;
      return;
    }
    this.sync.applyLastSeen();
    this.isSessionOwner = true;
    this.ownerConfirmed = false;
    this.startTicker();
    await this.sync.ensureOwner();
  }

  /**
   * 归零运行时状态。只清数字，不弹窗、不记录、不动归属。
   * finishSession 与「被别的窗口顶替后归位」共用这一份，避免两处各清一半。
   */
  resetRuntime() {
    this.clearTicker();
    this.state = ST.IDLE;
    this.pendingState = null;
    this.completedCycles = 0;
    this.focusedMs = 0;
    this.restMs = 0;
    this.longBreaks = 0;
    this.skippedFocus = 0;
    this.skippedBreak = 0;
    this.focusSkippedThisCycle = false; // 本轮专注是否被跳过（跳过则不计入轮次）
    this.pauseCount = 0;
    this.totalPauses = 0;
    this.targetCycles = null;
    this.sessionStart = null;
    // 正计时的累计状态一并归零：留着旧起点会让下一段的已过时长从一个陈旧数字起步
    this.resetCountUpProgress();
    /* countUp 本身也要归 false。它是运行时状态（下一段开始时按设置重算，见 startSegment），
     * 留着 true 会让退场的镜像窗口在「已 idle」的状态下仍带着正计时标记，
     * 一旦它被别的窗口读到就成了脏数据。 */
    this.countUp = false;
  }

  /**
   * 结束会话前，把「还在跑的那一段」结进统计。
   *
   * 只有正计时需要这一下：它不会自然结束，唯一的收尾动作就是手动点「结束」，
   * 不在这里结一次的话，正计时的专注时长永远是 0（小结里显示 0 分钟）。
   * 倒计时保持原样 —— 中途放弃＝这一段没做完，本来就不该算进去。
   */
  settleRunningSegment() {
    if (!this.countUp) return;
    if (this.state === ST.IDLE || this.state === ST.WAITING) return;
    // 暂停中：段类别看暂停前的那一段
    const st = this.state === ST.PAUSED ? this.pausedFrom || ST.FOCUS : this.state;
    const elapsed = this.elapsedMs();
    if (st === ST.FOCUS) this.focusedMs += elapsed;
    else this.restMs += elapsed;
    if (st === ST.LONG) this.longBreaks += 1;
    this.resetCountUpProgress();
  }

  /**
   * 从会话里退场：别的窗口已经结束了会话，或自己已被顶替，本实例不再参与。
   *
   * 关键在**不弹小结、不写笔记** —— 小结只在真正推进到结束的那一方弹，
   * 否则同一个会话会在两个窗口各弹一次、各记一条，笔记里出现重复记录。
   */
  retireFromSession() {
    if (this.state === ST.IDLE) return;
    this.resetRuntime();
    this.isSessionOwner = false;
    this.ownerConfirmed = false;
    // 清掉同步侧的记忆，否则下一轮轮询会误判成「又结束了一次」而反复归位
    if (this.sync) this.sync.lastSeen = null;
    if (this.floatUI) this.floatUI.hide();
    this.refreshUI();
  }

  /** 结束会话：归零运行时状态并弹出小结（记录由弹窗关闭时触发） */
  finishSession() {
    this.settleRunningSegment();
    const now = Date.now();
    const fmt = (ts) => obsidian.moment(ts).format('HH:mm');
    const data = {
      cycles: this.completedCycles,
      focusMin: Math.round(this.focusedMs / 60000),
      restMin: Math.round(this.restMs / 60000),
      longBreaks: this.longBreaks,
      skippedFocus: this.skippedFocus,
      skippedBreak: this.skippedBreak,
      pauses: this.totalPauses,
      range: this.sessionStart ? `${fmt(this.sessionStart)} – ${fmt(now)}` : '',
      date: obsidian.moment(now).format('YYYY-MM-DD'),
      time: obsidian.moment(now).format('HH:mm'),
      profileName: this.activeProfile ? this.activeProfile.name : '',
      /*
       * 记录精度：recordSeconds 关闭（默认）按分钟，打开记到秒。
       * focusMin / restMin 始终是整数分钟，供已有模板的 {{focus}} / {{rest}} 使用，
       * 语义一个字没改；精度只反映在 focusText / restText 与一句话摘要上 ——
       * 改 {{focus}} 的语义会让老模板写出「专注 25 分钟分钟」。
       */
      recordSeconds: this.plugin && this.plugin.settings.record
        ? this.plugin.settings.record.recordSeconds === true
        : false,
    };
    const toSec = data.recordSeconds;
    data.focusText = fmtRecordDuration(this.focusedMs, toSec);
    data.restText = fmtRecordDuration(this.restMs, toSec);

    /*
     * 累计统计：必须在 resetRuntime() 之前取 focusedMs —— 之后就被清零了。
     * 只有数据源选「本机累计」时才写；选「解析笔记」由统计命令现读，不落盘。
     * 失败不影响会话结束，统计是附属功能。
     */
    try {
      if (this.plugin && this.plugin.settings) {
        accumulateStats(this.plugin.settings, this.focusedMs);
      }
    } catch (e) { /* 统计失败不该让会话结束不了 */ }

    this.resetRuntime();
    // 会话结束：归属解除，下一个开始者重新抢占
    this.isSessionOwner = true;
    this.ownerConfirmed = true;
    this.endedLocally = true; // 标记「共享文件是我清的」，让对面的窗口跟着归位
    if (this.sync) this.sync.clear();
    this.refreshUI();

    if (this.floatUI) this.floatUI.hide();

    // 自动记录交给弹窗关闭时执行：
    // 若在这里 await，QuickAdd 弹出输入框会把本弹窗一直堵住，看起来像卡死。
    new SummaryModal(this.app, this, data).open();
  }

  /* ---------------- 音效 ---------------- */

  /** 单个目录内挑出音频文件（不递归） */
  async listAudioIn(folder, adapter) {
    const listing = await adapter.list(normalizePath(folder));
    return (listing.files || [])
      .filter((f) => AUDIO_EXT.includes(f.split('.').pop().toLowerCase()))
      .sort();
  }

  /**
   * 扫描自定义音效文件夹，缓存音频文件路径。
   * 递归子目录，音频可按类型分文件夹存放。
   * 目录层级过深时会自动停止，避免异常配置把界面卡住。
   */
  async refreshSoundFiles() {
    this.soundFiles = [];
    const folder = normalizePath(this.settings.soundFolder);
    if (!folder) return;

    try {
      const adapter = this.app.vault.adapter;
      if (!adapter || typeof adapter.list !== 'function') return;

      const found = [];
      const visited = new Set();
      const queue = [folder];
      const MAX_DEPTH = 4;

      while (queue.length) {
        const cur = queue.shift();
        const depth = cur.split('/').length;
        if (visited.has(cur) || depth > MAX_DEPTH) continue;
        visited.add(cur);

        let listing;
        try {
          listing = await adapter.list(normalizePath(cur));
        } catch (e) {
          continue; // 单个目录读不到就跳过，不影响其他目录
        }

        found.push(...(await this.listAudioIn(cur, adapter)));
        (listing.folders || []).forEach((sub) => queue.push(sub));
      }

      this.soundFiles = found.sort();
    } catch (e) {
      this.soundFiles = [];
    }
  }

  /** 播放提示音：优先自定义文件夹，取不到时回退内置合成音 */
  async playSound() {
    if (!this.settings.soundEnabled) return;

    if (this.settings.soundSource === 'folder') {
      if (this.soundFiles.length === 0) await this.refreshSoundFiles();
      if (this.soundFiles.length > 0) {
        // 按顺序轮播，避免每次都是同一个音
        const file = this.soundFiles[this.soundIndex % this.soundFiles.length];
        this.soundIndex += 1;
        try {
          const url = this.app.vault.adapter.getResourcePath(file);
          const audio = new Audio(url);
          audio.play().catch(() => this.beep());
          return;
        } catch (e) {
          /* 落到内置音 */
        }
      }
    }
    this.beep();
  }

  /** 内置提示音：系统合成，不依赖任何音频文件 */
  beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 660;
      gain.gain.value = 0.05;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => ctx.close(), 400);
    } catch (e) {
      /* 音频不可用时静默降级 */
    }
  }

  refreshUI() {
    if (this.floatUI) this.floatUI.update();
    this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE).forEach((leaf) => {
      if (leaf.view instanceof PomodoroView) leaf.view.update();
    });
    if (this.statusBar) {
      this.statusBar.setText(this.state === ST.IDLE ? '🍅' : `🍅 ${this.displayTime()}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 番茄钟设置内容：由统一设置页按标签渲染
 * ------------------------------------------------------------------ */

/**
 * 桌面常驻开启后，把界面从设置页切回笔记视图并显示浮窗。
 *
 * 为什么必须有这一步：开关就摆在设置页里，开启后主窗口立刻缩到 365×378，
 * 要是还停在设置页，用户看到的就是"一个被缩小的设置窗口"——
 * 设置没法继续点，番茄钟也看不到，整个功能像是把界面搞坏了。
 * 所以开启时要主动离开设置页、切到笔记、把浮窗亮出来。
 *
 * 全程 try/catch：切视图只是体验优化，切不动不影响窗口已经缩小，
 * 绝不能因为它失败就让整个开关回滚。
 *
 * @returns {boolean} 是否成功离开了设置页
 */
/**
 * DOM 兜底：直接点设置模态框的关闭按钮。
 *
 * 为什么必须有：app.setting.close() 是内部 API，typeof 只能挡住"不存在"，
 * 挡不住"存在却没生效"—— 而设置窗口是盖在主窗口上的**模态框**，
 * setActiveLeaf 只切后台叶子、根本不会关它。
 * 于是开关点了、窗口也缩小了，用户看到的仍是「一个被缩小的设置页」，
 * 功能像是坏了（v2.97 实测现象）。
 *
 * 只在确认是设置窗口时才点：优先 .mod-settings。兜底到 .modal-container 是
 * 因为此时刚从本插件设置页的开关进来，唯一可能开着的模态框就是它，
 * 不会误关插件自己弹的确认框。
 */
function clickSettingsClose(doc) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  if (!d || typeof d.querySelector !== 'function') return false;
  try {
    const modal =
      d.querySelector('.modal-container .modal.mod-settings') ||
      d.querySelector('.modal.mod-settings') ||
      d.querySelector('.modal-container') ||
      null;
    if (!modal) return false;
    const btn = modal.querySelector('.modal-close-button');
    if (btn && typeof btn.click === 'function') {
      btn.click();
      return true;
    }
  } catch (e) {
    /* 找不到就不点 */
  }
  return false;
}

function leaveSettingsForDock(plugin, ctrl) {
  const app = plugin && plugin.app;
  let moved = false;
  try {
    const st = app && app.setting;
    if (st && typeof st.close === 'function') {
      st.close();
      moved = true;
    }
  } catch (e) {
    /* 关不掉就靠下面切叶子 */
  }
  // 内部 API 存在不等于关掉了，再用 DOM 点一次兜底
  if (clickSettingsClose()) moved = true;
  try {
    const ws = app && app.workspace;
    if (ws && typeof ws.getLeavesOfType === 'function') {
      const leaves = ws.getLeavesOfType('markdown') || [];
      const target =
        leaves[0] ||
        (typeof ws.getMostRecentLeaf === 'function' ? ws.getMostRecentLeaf() : null);
      if (target && typeof ws.setActiveLeaf === 'function') {
        ws.setActiveLeaf(target, { focus: true });
        moved = true;
      }
    }
  } catch (e) {
    /* 切不动不影响窗口已经缩小 */
  }
  try {
    if (ctrl && ctrl.floatUI && typeof ctrl.floatUI.show === 'function') ctrl.floatUI.show();
  } catch (e) {
    /* 浮窗显示不出来也不算失败 */
  }
  return moved;
}

/** 分钟输入 + 软提示（只提示，不阻止） */
function minuteSetting(containerEl, plugin, ctrl, name, desc, key, hintFn) {
  const s = ctrl.settings;
  /*
   * 实参是变量，i18nguard 扫不到（它只认字面量/三元/模板串/转义），
   * 必须在**函数内部**包 —— 调用处传的是字面量，但守卫只扫 setXxx( 扫不到调用点。
   * key 依次为 focusMin / shortBreakMin / longBreakMin。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('pomo.min.' + key + '.name', name))
    .setDesc(i18nT('pomo.min.' + key + '.desc', desc))
    .addText((t) =>
      t
        .setPlaceholder(String(s[key]))
        .setValue(String(s[key]))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          if (isFinite(n) && n > 0) {
            s[key] = n;
            ctrl.syncProfile(); // 把改动写回当前方案
            await plugin.saveSettings();
          }
          if (hintEl) hintEl.setText(hintFn(s[key]));
        })
    );

  let hintEl = null;
  if (s.showHints) {
    hintEl = containerEl.createDiv({ cls: 'pomo-hint' });
    hintEl.setText(hintFn(s[key]));
  }
}

function renderPomodoroSettings(containerEl, plugin, ctrl) {
  const s = ctrl.settings;
  containerEl.createEl('h2', { text: i18nT('k7f378cec', '番茄钟') });

  /* ---- 时长方案 ---- */
  containerEl.createEl('h3', { text: i18nT('ke697bb8b', '时长方案') });
  containerEl.createDiv({
    cls: 'pomo-tip',
    text: i18nT('kce1fe81f', '按场景分组保存专注 / 休息时长，开始番茄钟时可任选一套。'),
  });

  // 方案选择 + 新建 / 删除
  new obsidian.Setting(containerEl)
    .setName(i18nT('kce717abb', '当前方案'))
    .setDesc(i18nT('kf099c7bc', '切换后下面的时长会跟着变。'))
    .addDropdown((d) => {
      s.profiles.forEach((p) => d.addOption(p.id, p.name));
      d.setValue(s.activeProfileId).onChange(async (v) => {
        applyProfile(plugin.settings, v);
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      });
    })
    .addButton((b) =>
      b.setButtonText(i18nT('k26bb8418', '新建')).onClick(async () => {
        const p = {
          id: makeProfileId(),
          name: '新方案',
          focusMin: s.focusMin,
          shortBreakMin: s.shortBreakMin,
          longBreakMin: s.longBreakMin,
        };
        s.profiles.push(p);
        applyProfile(plugin.settings, p.id);
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    )
    .addButton((b) =>
      b.setButtonText(i18nT('k2f4aaddd', '删除')).onClick(async () => {
        if (s.profiles.length <= 1) {
          new obsidian.Notice('至少保留一个方案');
          return;
        }
        s.profiles = s.profiles.filter((p) => p.id !== s.activeProfileId);
        applyProfile(plugin.settings, s.profiles[0].id);
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  // 方案名与三项时长，编辑即写回当前方案
  new obsidian.Setting(containerEl)
    .setName(i18nT('k1b0b239b', '方案名称'))
    .setDesc(i18nT('k87873bc7', '例如：工作、学习、阅读。'))
    .addText((t) =>
      t
        .setPlaceholder(i18nT('k1b0b239b', '方案名称'))
        .setValue(ctrl.activeProfile ? ctrl.activeProfile.name : '')
        .onChange(async (v) => {
          const name = v.trim();
          if (!name) return;
          ctrl.syncProfile({ name });
          await plugin.saveSettings();
        })
    );

  minuteSetting(containerEl, plugin, ctrl, '专注时长', '当前方案的专注时长。', 'focusMin', (v) =>
    v > 45 ? '专注时长偏长，注意中途休息。' : ''
  );
  minuteSetting(containerEl, plugin, ctrl, '短休息时长', '当前方案每轮后的休息时长。', 'shortBreakMin', (v) =>
    v < 3 ? '休息太短可能恢复不足。' : ''
  );
  minuteSetting(
    containerEl,
    plugin,
    ctrl,
    '长休息时长',
    '当前方案每若干轮后的长休息时长。',
    'longBreakMin',
    () => ''
  );

  /* ---- 正计时 ---- */
  containerEl.createEl('h3', { text: i18nT('k08780ced', '正计时') });
  new obsidian.Setting(containerEl)
    .setName(i18nT('k4bd2ddba', '正计时（专注段不限时）'))
    .setDesc(i18nT('k73559598', "开启后，专注段从 0 往上累加、不会自动结束 —— 由你点「跳过」或结束会话来停。适合统计一件事实际花了多久。只对专注段生效，休息段仍按上面设定的时长倒计时。也可以点「开始」后，在「准备开始」面板上一键切换，或在待开始界面点那个 ＋/－ 按钮。"))
    .addToggle((t) =>
      t.setValue(s.countUp === true).onChange(async (v) => {
        s.countUp = v;
        await plugin.saveSettings();
      })
    );
  new obsidian.Setting(containerEl)
    .setName(i18nT('kefa6408b', '正计时软目标（分钟）'))
    .setDesc(i18nT('k2e64366c', '累加到这么多分钟时弹一次提醒并响铃，但不结束计时。填 0 表示不提醒。需先开启正计时。'))
    .addText((t) =>
      t
        .setPlaceholder('0')
        .setValue(String(s.countUpTargetMin))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          s.countUpTargetMin = isFinite(n) && n > 0 ? n : 0;
          await plugin.saveSettings();
        })
    );
  new obsidian.Setting(containerEl)
    .setName(i18nT('kec5bbff6', '正计时上限（分钟）'))
    .setDesc(i18nT('k48571ed9', "累加到这么多分钟就**自动停表**，并弹提示让你重新开始 —— 防止忘了停而一直跑下去。达到上限的那一段**不计入专注时长**（超时数据不可信）。默认 1440（24 小时），填 0 表示不设上限。"))
    .addText((t) =>
      t
        .setPlaceholder('1440')
        .setValue(String(s.countUpMaxMin))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          s.countUpMaxMin = isFinite(n) && n > 0 ? n : 0;
          await plugin.saveSettings();
        })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('kd84df1fb', '正计时间隔提醒（分钟）'))
    .setDesc(i18nT('k8e9e461e', "每隔这么多分钟提醒一次：填 20 就是第 20、40、60 分钟各提醒一次（只提醒，不结束计时）。与「软目标」的区别是**这个是持续的节拍器**，软目标只响一次。填 0 表示不提醒。需先开启正计时。"))
    .addText((t) =>
      t
        .setPlaceholder('0')
        .setValue(String(s.countUpRemindEveryMin))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          s.countUpRemindEveryMin = isFinite(n) && n > 0 ? n : 0;
          await plugin.saveSettings();
        })
    );

  /*
   * 数据源下拉 + 「自定义统计位置」是一对：后者只在选中「自定义位置」时才展出，
   * 其余时候收起 —— 四个数据源里只有它需要填路径，常驻只会占着版面、
   * 让人误以为不填也能读。切下拉时同步显示/隐藏，不改值。
   */
  let customPathSetting = null;
  const showCustomPath = () => {
    if (customPathSetting && customPathSetting.settingEl) {
      customPathSetting.settingEl.style.display = s.statsSource === 'custom' ? '' : 'none';
    }
  };

  new obsidian.Setting(containerEl)
    .setName(i18nT('k6611323b', '累计统计数据源'))
    .setDesc(i18nT('kc481bba7', "决定「番茄钟：查看累计统计」这个命令从哪里读数。默认「不统计」（不存任何数据）。· 本机累计：插件自己记账，精确，但换设备或清配置会丢。· 解析笔记：现读你写的会话记录笔记，持久，但改过写入格式就会读不准。· 自定义位置：读你下面指定的笔记或文件夹。"))
    .addDropdown((d) =>
      d
        .addOption('off', i18nT('k942aa988', '不统计（默认）'))
        .addOption('memory', i18nT('k0e03b3a4', '本机累计'))
        .addOption('note', i18nT('k640e8fc2', '解析笔记（番茄钟记录笔记）'))
        .addOption('custom', i18nT('kfae3782a', '自定义位置（指定笔记或文件夹）'))
        .setValue(String(s.statsSource || 'off'))
        .onChange(async (v) => {
          s.statsSource = v;
          showCustomPath();
          await plugin.saveSettings();
        })
    );

  customPathSetting = new obsidian.Setting(containerEl)
    .setName(i18nT('k155b1220', '自定义统计位置'))
    .setDesc(i18nT('kfd612adc', "数据源选「自定义位置」时从这里读数（选其它数据源时本项收起）。可填一篇笔记（如 统计/专注.md）或一个文件夹（如 统计），文件夹会统计其下所有 .md。留空则不统计。路径填错会明确提示「没读到」，不会静默给 0。"))
    .addText((t) =>
      t
        .setPlaceholder(i18nT('kbb8c44f9', '例如：统计/专注.md 或 统计'))
        .setValue(String(s.statsCustomPath || ''))
        .onChange(async (v) => {
          s.statsCustomPath = String(v || '').trim();
          await plugin.saveSettings();
        })
    );
  showCustomPath();

  /* ---- DataView 联动（总开关，默认关）---- */
  /*
   * 开关开着却没装 DataView 时，字段照样写进笔记、但用户查不到，
   * 他不知道是插件没装，只会觉得这功能没用 —— 所以给一行可见状态。
   * 照 note.js 里 Templater 状态的写法（ok 常色 / 不 ok 黄字），
   * 不弹 Notice：用户是主动来开这个开关的，不必每次写笔记都打扰。
   */
  const dvHead = containerEl.createDiv({ cls: 'tt-dv-status' });
  const showDvStatus = () => {
    try {
      const on = s.dataviewEnabled === true;
      dvHead.removeClass('is-warn');
      if (!on) {
        dvHead.setText('');
        dvHead.style.display = 'none';
        return;
      }
      dvHead.style.display = '';
      const dvOk = hasDataview(plugin.app);
      dvHead.setText(
        dvOk
          ? i18nT('kc13cb9a1', 'DataView：已就绪。')
          : i18nT('kc2413656', 'DataView：未检测到插件，字段仍会写入，但需安装后才能查询。')
      );
      if (!dvOk) dvHead.addClass('is-warn');
    } catch (e) {
      console.warn('[Time Tools] DataView 状态检测失败', e);
    }
  };
  new obsidian.Setting(containerEl)
    .setName(i18nT('k8e3f14cd', 'DataView 联动'))
    .setDesc(i18nT('ke50d90ae', "默认关。开启后写会话记录时，按下面的字段表在末尾追加 DataView 内联字段，供你自己写的 dataview 查询读取。关着时一个字都不多写，不影响既有笔记。需要你已安装 DataView 插件才能查询。"))
    .addToggle((g) =>
      g.setValue(s.dataviewEnabled === true).onChange(async (v) => {
        s.dataviewEnabled = v === true;
        showDvStatus();
        await plugin.saveSettings();
      })
    );
  showDvStatus();

  /*
   * DataView 字段表：一行一个字段，左边是字段名、右边是变量。
   * 默认只写「专注时长」，其余由用户自己加行 —— 他要记什么不该由插件替他决定，
   * 全写上去反而会让记录行变长、且大部分字段没人用。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('kc7bde7ac', 'DataView 字段表'))
    .setDesc(i18nT('k6ddd4a9b', "一行一个字段，格式：字段名::{{VALUE:变量名}}。专注时长默认记录，其余自己加行；字段名可以随便改（含专注时长）。清空则一行都不写。可用变量：date 日期、time 时间、range 时段、cycles 轮数、focus 专注分钟数、rest 休息分钟数、focusText 专注时长（带单位，跟随「记录到秒」）、restText 休息时长、pauses 暂停次数、longBreaks 长休息次数、skippedFocus 跳过专注次数、skippedBreak 跳过休息次数、profile 方案名。"))
    .addTextArea((t) =>
      t
        .setPlaceholder(i18nT('ka6762c3b', '专注时长::{{VALUE:focusText}}'))
        .setValue(String(s.dataviewFields == null ? '' : s.dataviewFields))
        .onChange(async (v) => {
          s.dataviewFields = String(v == null ? '' : v);
          await plugin.saveSettings();
        })
    );

  /* ---- 节奏 ---- */
  containerEl.createEl('h3', { text: i18nT('ke93ed83e', '节奏') });
  /*
   * 下面这几项是**全局**的，不属于某个方案：切换方案时三项时长会跟着变，
   * 但它们保持原值。不写清楚的话，用户改完方案会发现"我设的节奏没跟着来"，
   * 以为设置没保存。
   */
  containerEl.createDiv({
    cls: 'pomo-tip',
    text: i18nT('k48da131d', '以下节奏设置是全局的，不随方案切换 —— 切方案只会改变上面三项时长。'),
  });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k61ec67be', '长休息间隔'))
    .setDesc(i18nT('k8f75ce4f', '完成这么多轮后弹窗询问是否进入长休息（全局，不随方案切换）。'))
    .addText((t) =>
      t
        .setPlaceholder('4')
        .setValue(String(s.longBreakInterval))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          s.longBreakInterval = isFinite(n) && n > 0 ? n : 4;
          await plugin.saveSettings();
        })
    );

  // 自动 / 手动模式
  new obsidian.Setting(containerEl)
    .setName(i18nT('k76bdc67a', '自动开始下一段'))
    .setDesc(i18nT('kd0b0fdcf', '开启后专注结束自动进入休息；关闭为手动模式，需点「开始休息」才继续。'))
    .addToggle((t) =>
      t.setValue(s.autoStartNext).onChange(async (v) => {
        s.autoStartNext = v;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k54a618fd', '长休息后计数'))
    .setDesc(i18nT('k039ed8fa', '清零则重新数第 1 轮；继续累加则沿用累计轮数。'))
    .addDropdown((d) =>
      d
        .addOption('reset', i18nT('ke7b5aad7', '清零'))
        .addOption('keep', i18nT('ka0e20f38', '继续累加'))
        .setValue(s.resetAfterLongBreak ? 'reset' : 'keep')
        .onChange(async (v) => {
          s.resetAfterLongBreak = v === 'reset';
          await plugin.saveSettings();
        })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k59b19be2', '拒绝长休息后'))
    .setDesc(i18nT('kfad59e29', '点了「继续专注」之后，什么时候再问一次。'))
    .addDropdown((d) =>
      d
        .addOption('afterInterval', i18nT('k2d984763', '再跑满一个间隔才问'))
        .addOption('nextCycle', i18nT('k72079e1a', '下一轮结束立刻再问'))
        .setValue(s.declineBehavior)
        .onChange(async (v) => {
          s.declineBehavior = v;
          await plugin.saveSettings();
        })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('kaf1afec7', '暂停提示阈值'))
    .setDesc(i18nT('k9168d517', '一段内暂停达这个次数后，弹窗询问是否从本轮重新开始。'))
    .addText((t) =>
      t
        .setPlaceholder('3')
        .setValue(String(s.pauseThreshold))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          s.pauseThreshold = isFinite(n) && n > 0 ? n : 3;
          await plugin.saveSettings();
        })
    );

  /* ---- 界面 ---- */
  containerEl.createEl('h3', { text: i18nT('k0196846b', '界面') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k813152a2', '界面形态'))
    .setDesc(i18nT('kfb12cd83', "浮窗可拖动；侧边栏固定在右侧面板；独立窗口在 Obsidian 之外另开系统窗口，主窗口最小化后照样计时。移动端不支持独立窗口，始终用侧边栏。"))
    .addDropdown((d) =>
      d
        .addOption('floating', i18nT('k71c0319f', '浮窗'))
        .addOption('sidebar', i18nT('k9635b9bd', '侧边栏视图'))
        .addOption('popout', i18nT('k2b02bedb', '独立窗口'))
        .setValue(s.uiMode)
        .onChange(async (v) => {
          s.uiMode = v;
          await plugin.saveSettings();
          // 离开浮窗就把它彻底销毁，避免 DOM 残留在 body 上
          if (v !== 'floating' && ctrl.floatUI) {
            ctrl.floatUI.destroy();
            ctrl.floatUI = null;
          }
          // 只有独立窗口需要跨窗口同步，其余形态不开轮询
          if (ctrl.sync) {
            if (ctrl.isPopoutMode) ctrl.sync.startPolling();
            else ctrl.sync.stopPolling();
          }
        })
    );

  if (s.uiMode === 'popout') {
    new obsidian.Setting(containerEl)
      .setName(i18nT('k597abe50', '窗口宽度'))
      .setDesc(i18nT('k960865cc', '像素。留空或 0 交给系统决定。'))
      .addText((t) =>
        t
          .setPlaceholder('616')
          .setValue(String(s.popoutWidth || 0))
          .onChange(async (v) => {
            s.popoutWidth = Math.max(0, Math.round(Number(v) || 0));
            await plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('k019594cc', '窗口高度'))
      .setDesc(i18nT('k85045476', '同上。Electron 窗口接口可用时精确生效，否则只是建议值。'))
      .addText((t) =>
        t
          .setPlaceholder('406')
          .setValue(String(s.popoutHeight || 0))
          .onChange(async (v) => {
            s.popoutHeight = Math.max(0, Math.round(Number(v) || 0));
            await plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('k357b1d03', '开窗位置'))
      .setDesc(i18nT('k23dd67f6', "放到屏幕哪个角（已避开任务栏）；选「交给系统决定」则完全不干预。位置只在开窗那一刻设置一次，之后手动拖动不会被拉回。"))
      .addDropdown((d) => {
        POPOUT_POS_OPTIONS.forEach((o) => d.addOption(o[0], optText('popoutPos', o[0], o[1])));
        d.setValue(s.popoutPos).onChange(async (v) => {
          s.popoutPos = v;
          await plugin.saveSettings();
        });
      });

    new obsidian.Setting(containerEl)
      .setName(i18nT('kc367a5c6', '始终显示在其他窗口之上'))
      .setDesc(i18nT('k6aef237a', "让番茄钟浮在所有应用前面。依赖系统窗口接口，不可用时静默失效（窗口照常打开，只是不置顶）。"))
      .addToggle((t) =>
        t.setValue(s.popoutAlwaysOnTop !== false).onChange(async (v) => {
          s.popoutAlwaysOnTop = v;
          await plugin.saveSettings();
        })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('k18b8cdb4', '隐藏窗口内部界面元素（不是无边框）'))
      .setDesc(i18nT('k5fa62f08', "真正的无边框做不到：窗口最外那条边框与顶部标题栏由系统绘制，Electron 只能在建窗那一刻决定是否要它，而 pop-out 是 Obsidian 建的，插件改不了已存在的窗口 —— 它们一定会显示，这不是 bug。本开关只隐藏窗口**内部**的 Obsidian 界面元素：标签栏、状态栏、左侧图标栏、左右侧边栏，让番茄钟铺满内容区。想要真正贴边的小窗，请用下面的「桌面常驻」。"))
      .addToggle((t) =>
        t.setValue(!!s.popoutBorderless).onChange(async (v) => {
          s.popoutBorderless = v;
          await plugin.saveSettings();
        })
      );

    containerEl.createDiv({
      cls: 'pomo-tip',
      text:
        i18nT('ka410bd01',
          '独立窗口里能改的和改不了的：' +
          '① 能改 —— 配色、字号、圆角、阴影、背景图、按钮位置与顺序，' +
          '和浮窗用的是同一套变量，改一处两边都生效；' +
          '② 有条件 —— 尺寸、位置、置顶依赖 Electron 窗口接口，' +
          'Obsidian 收紧该接口时会退化为「系统决定」，不会报错；' +
          '③ 改不了 —— 系统标题栏与窗口外框样式（frame 只能建窗时指定）；' +
          '④ 注意 —— 以上都在开窗那一刻应用一次。改完设置不必重开窗口：' +
          '在独立窗口里按 Ctrl+P 运行「番茄钟：重新应用独立窗口设置」即可当场生效' +
          '（必须在该窗口里运行 —— 每个窗口用的是自己加载时读到的那份设置）。'),
    });
  }

  /*
   * 桌面常驻（替代方案）：独立窗口去不掉系统标题栏，达不到「桌上一个无边框番茄钟」，
   * 于是反过来 —— 把 Obsidian 主窗口本身缩成番茄钟大小、置顶、摆到屏幕角上，
   * 番茄钟用浮窗显示在窗口内左上角。观感上接近常驻，且**真能置顶、真能贴边**。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('k73ce778c', '桌面常驻（缩小主窗口）'))
    .setDesc(i18nT('ka327d21d', "把主窗口缩到番茄钟大小、置顶、摆到屏幕角上，番茄钟用浮窗显示在窗口内 —— 这是「独立窗口去不掉系统标题栏」的替代方案。注意：开启后主窗口就只有这么大，正常笔记操作会受影响；关闭开关（或再运行一次命令）会还原成原来的大小和位置。需配合「界面形态 = 浮窗」；开启后会自动离开设置页、切回笔记界面。"))
    .addToggle((t) =>
      t.setValue(!!s.deskDock).onChange(async (v) => {
        const r = applyDeskDock(v, s);
        s.deskDock = r.ok ? v : !!s.deskDock;
        const left = r.ok && v ? leaveSettingsForDock(plugin, ctrl) : true;
        await plugin.saveSettings();
        let msg;
        if (r.reason === 'no-electron') {
          msg = '当前环境不支持窗口控制，桌面常驻未生效';
        } else if (v) {
          msg = r.ok
            ? '桌面常驻已开启：主窗口已缩小并置顶' +
              (s.uiMode === 'floating' ? '' : '（当前界面形态不是浮窗，小窗里看不到番茄钟）') +
              (left ? '' : '（没能自动离开设置页，请手动关掉）')
            : '桌面常驻开启失败，主窗口未改动';
        } else {
          msg = r.restored ? '桌面常驻已关闭：主窗口已还原' : '桌面常驻已关闭，但未能还原原尺寸 —— 请手动调整窗口';
        }
        if (typeof obsidian.Notice === 'function') new obsidian.Notice(msg);
      })
    );

  if (s.deskDock) {
    new obsidian.Setting(containerEl)
      .setName(i18nT('k6e21574a', '常驻窗口宽度'))
      .setDesc(i18nT('k62a61d58', '像素。缩小后主窗口的宽度；留空或 0 用默认 365。'))
      .addText((t) =>
        t
          .setPlaceholder('365')
          .setValue(String(s.deskDockWidth || 0))
          .onChange(async (v) => {
            s.deskDockWidth = Math.max(0, Math.round(Number(v) || 0));
            await plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('kcd0bc52e', '常驻窗口高度'))
      .setDesc(i18nT('kb2ea5a52', '同上，默认 378。改完重新开关一次「桌面常驻」即可生效。'))
      .addText((t) =>
        t
          .setPlaceholder('378')
          .setValue(String(s.deskDockHeight || 0))
          .onChange(async (v) => {
            s.deskDockHeight = Math.max(0, Math.round(Number(v) || 0));
            await plugin.saveSettings();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('kd24f0447', '常驻窗口位置'))
      .setDesc(i18nT('ka821fa0a', '缩小后摆到屏幕哪个角（已避开任务栏）。'))
      .addDropdown((d) => {
        POPOUT_POS_OPTIONS.forEach((o) => d.addOption(o[0], optText('popoutPos', o[0], o[1])));
        d.setValue(s.deskDockPos).onChange(async (v) => {
          s.deskDockPos = v;
          await plugin.saveSettings();
        });
      });
  }

  new obsidian.Setting(containerEl)
    .setName(i18nT('k50040f0e', '拖动后吸附到边缘'))
    .setDesc(i18nT('k5352294a', '松手自动贴到最近的一条边；关闭则停在松手位置。'))
    .addToggle((t) =>
      t.setValue(s.snapToEdge).onChange(async (v) => {
        s.snapToEdge = v;
        await plugin.saveSettings();
        if (ctrl.floatUI) ctrl.floatUI.applyPosition();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k6f66fea9', '浮窗默认吸附边'))
    .setDesc(i18nT('kab2157cc', '仅在开启吸附时生效。也可直接把浮窗拖到任意一边。'))
    .addDropdown((d) =>
      d
        .addOption('top', i18nT('kaf767b7e', '上'))
        .addOption('bottom', i18nT('k3850a186', '下'))
        .addOption('left', i18nT('kd2aff141', '左'))
        .addOption('right', i18nT('k4d9c32c2', '右'))
        .setValue(s.floatEdge)
        .onChange(async (v) => {
          s.floatEdge = v;
          await plugin.saveSettings();
          if (ctrl.floatUI) ctrl.floatUI.applyPosition();
        })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('kc05965c2', '显示左侧栏图标'))
    .setDesc(i18nT('k84c28a4a', "开启后左侧栏出现 🍅 图标，点击打开开始面板。关闭则只能从命令面板或底部状态栏的 🍅 唤出。"))
    .addToggle((t) =>
      t.setValue(s.showRibbonIcon).onChange(async (v) => {
        s.showRibbonIcon = v;
        await plugin.saveSettings();
        new obsidian.Notice('重启 Obsidian 后生效');
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k9970ad07', '主题'))
    .setDesc(i18nT('k66d405b0', "内置五套：经典（卡片）· 极简（纯文字）· 流光（动态光晕）· 空灵紫（浅色玻璃）· 赤镰（暗红血流）。选「自定义」则插件不提供任何样式，完全交给你的 CSS。"))
    .addDropdown((d) => {
      POMO_THEME_OPTIONS.forEach((o) => d.addOption(o.value, optText('theme', o.value, o.label)));
      d.setValue(s.theme).onChange(async (v) => {
        s.theme = v;
        await plugin.saveSettings();
        // 只换 class，不重建浮窗，正在跑的计时不受影响
        ctrl.applyThemeToAll();
        // 自定义 CSS 框要跟着显示/隐藏，故重绘本页
        plugin.redrawSettingsTab();
      });
    });

  // 自定义 CSS：仅在 custom 主题下显示
  if (s.theme === 'custom') {
    new obsidian.Setting(containerEl)
      .setName(i18nT('k76c43b23', '自定义 CSS'))
      .setDesc(i18nT('k8147d263', "写在这里的 CSS 会注入页面，选择器用 .pomo-theme-custom 开头即可，例如 .pomo-theme-custom .pomo-time { color: #f66; }。更省事的写法是只覆盖变量 —— 模板见下方，可整段复制再改数字。"))
      .addTextArea((t) =>
        t
          .setPlaceholder(POMO_CSS_TEMPLATE)
          .setValue(s.customCss)
          .onChange(async (v) => {
            s.customCss = v;
            await plugin.saveSettings();
            // 只更新 <style> 内容，不重绘设置页（否则输入框会失焦）
            syncCustomCss(s.theme, s.customCss);
          })
      );

    // 可整段复制的模板：列出所有可控变量，改数字即可，不必猜名字
    const pre = containerEl.createEl('pre', { cls: 'pomo-css-template' });
    pre.setText(POMO_CSS_TEMPLATE);

    containerEl.createDiv({
      cls: 'pomo-tip',
      text:
        i18nT('k04fec57d',
          '不用写全套 —— 没覆盖的变量会回落到经典主题的默认值。' +
          '常用选择器：.pomo-float（浮窗）、.pomo-container（侧边栏视图）、' +
          '.pomo-btn[data-act="main|skip|stop"]（按钮，可用 order 改顺序）、' +
          '[data-state="focus|short|long|paused"]（精确状态）、' +
          '[data-pomo-kind="focus|rest|idle"]（段类别，暂停沿用暂停前那一段）。' +
          '背景图请用库内相对路径，如 url("附件/tomato.png")；' +
          '系统绝对路径换台设备就失效了。' +
          '正计时超过一小时会补出小时位（H:MM:SS），比 MM:SS 长三个字符 —— ' +
          '若浮窗放不下，调小 --pomo-time-size 或加大 --pomo-width。'),
    });
  }

  /* ---- 提醒 ---- */
  containerEl.createEl('h3', { text: i18nT('k6d40d527', '提醒') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1eb7e2f9', '段结束通知'))
    .setDesc(i18nT('kf92fc0ba', '每段专注 / 休息结束时弹出 Obsidian 通知。'))
    .addToggle((t) =>
      t.setValue(s.notifyOnSegmentEnd).onChange(async (v) => {
        s.notifyOnSegmentEnd = v;
        await plugin.saveSettings();
      })
    );

  // 结束弹窗要连点几次遮罩才关：填 1 等于不拦截
  new obsidian.Setting(containerEl)
    .setName(i18nT('k8afcf125', '结束框防误关'))
    .setDesc(i18nT('kbc570652', "结束 / 长休息询问这类弹窗，需要点几次「弹窗外部」才会关闭。填 1 表示不拦截（点一下就关）。弹窗内的按钮和 Esc 不受影响。"))
    .addText((t) =>
      t
        .setPlaceholder('3')
        .setValue(String(s.dismissClicks))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          s.dismissClicks = isFinite(n) ? clamp(n, 1, 10) : 3;
          await plugin.saveSettings();
        })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k95ffd3d4', '提示音'))
    .setDesc(i18nT('ka6ba5456', '段结束时播放提示音。'))
    .addToggle((t) =>
      t.setValue(s.soundEnabled).onChange(async (v) => {
        s.soundEnabled = v;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k2aeed95d', '提示音来源'))
    .setDesc(i18nT('k792bedaf', '内置音为系统合成音，无需文件；自定义则播放指定文件夹里的音频。'))
    .addDropdown((d) =>
      d
        .addOption('builtin', i18nT('kd339025f', '内置合成音'))
        .addOption('folder', i18nT('k79abf822', '自定义文件夹'))
        .setValue(s.soundSource)
        .onChange(async (v) => {
          s.soundSource = v;
          await plugin.saveSettings();
          await ctrl.refreshSoundFiles();
          plugin.redrawSettingsTab();
        })
    );

  // 自定义音效文件夹：仅在 folder 模式下显示
  if (s.soundSource === 'folder') {
    const found = ctrl.soundFiles.length;
    new obsidian.Setting(containerEl)
      .setName(i18nT('k779c8ad4', '音频文件夹'))
      .setDesc(
        i18nT('k0504a662', '填写库内的文件夹路径，例如 音效/提示音。当前找到 {0} 个音频文件', found) +
          (found ? i18nT('kaa938aa5', '，按顺序轮播。') : i18nT('k4e9d6e3a', '，请检查路径是否正确。'))
      )
      .addText((t) =>
        t
          .setPlaceholder(i18nT('k8291bfa6', '音效/提示音'))
          .setValue(s.soundFolder)
          .onChange(async (v) => {
            s.soundFolder = v.trim().replace(/^\/+|\/+$/g, '');
            await plugin.saveSettings();
            await ctrl.refreshSoundFiles();
          })
      )
      .addButton((b) =>
        b.setButtonText(i18nT('k75e1781b', '重新扫描')).onClick(async () => {
          await ctrl.refreshSoundFiles();
          plugin.redrawSettingsTab();
          new obsidian.Notice(`找到 ${ctrl.soundFiles.length} 个音频文件`);
        })
      );
  }

  /* ---- 斜杠命令 ---- */
  containerEl.createEl('h3', { text: i18nT('k4f15a310', '斜杠命令') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1ef6fa49', '启用斜杠命令'))
    .setDesc(i18nT('k8c93fea4', '在笔记中输入 /pomodoro 唤起番茄钟。'))
    .addToggle((t) =>
      t.setValue(s.enableSlashCommand).onChange(async (v) => {
        s.enableSlashCommand = v;
        await plugin.saveSettings();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k50cbeaf7', '触发词'))
    .setDesc(i18nT('kfdc653bd', '默认 pomodoro，即 /pomodoro。可自行修改，不用带斜杠。'))
    .addText((t) =>
      t
        .setPlaceholder('pomodoro')
        .setValue(s.slashTrigger)
        .onChange(async (v) => {
          s.slashTrigger = v.trim().replace(/^\//, '') || 'pomodoro';
          await plugin.saveSettings();
        })
    );

  /* ---- 其他 ---- */
  containerEl.createEl('h3', { text: i18nT('k301739cd', '其他') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('kf9ecdf4e', '显示建议提示'))
    .setDesc(i18nT('k62efe8d5', '时长超出常规范围时给出灰色提示，不阻止使用。'))
    .addToggle((t) =>
      t.setValue(s.showHints).onChange(async (v) => {
        s.showHints = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  containerEl.createDiv({ cls: 'pomo-tip' }).setText(
    i18nT('kd1397a2a', '提示：番茄钟进度不会保存。关闭 Obsidian 后计数清零，重新打开只恢复设置，需手动开始。')
  );

  // 区末统一提供恢复默认入口
  const { addResetButton } = require('./settings.js');
  addResetButton(containerEl, plugin, 'pomodoro', '番茄钟');
}

/** 注册番茄钟模块：视图、斜杠建议、控制器，并挂上记录器 */
function registerPomodoro(plugin) {
  const ctrl = new PomodoroController(plugin);
  plugin.pomodoro = ctrl;
  plugin.recorder = new Recorder(plugin);

  plugin.registerView(POMODORO_VIEW_TYPE, (leaf) => new PomodoroView(leaf, ctrl));
  plugin.registerEditorSuggest(new PomodoroSuggest(plugin, ctrl));
  ctrl.init();

  return ctrl;
}

function refreshPomodoroViews(plugin) {
  if (plugin.pomodoro) plugin.pomodoro.refreshUI();
}

/* ------------------------------------------------------------------ *
 * 番茄钟设置内容
 * ------------------------------------------------------------------ */

module.exports = {
  // 番茄钟
  POMODORO_VIEW_TYPE,
  PomodoroView,
  PomodoroController,
  registerPomodoro,
  refreshPomodoroViews,
  renderPomodoroSettings,

  // 会话记录
  Recorder,
  renderRecordSettings,
  renderTemplate,
  sanitizeFileName,
  insertAtTop,
  DEFAULT_RECORD_TEMPLATE,

  // 测试钩子：_test/pomodoro-ui.js 用它验证「防误关」逻辑，
  // 运行时不引用。（产物里保留，方便直接对构建结果做回归）
  __testModals: { GuardedModal, StartModal, AskLongBreakModal, AskRestartModal, SummaryModal },

  // 测试钩子：主题挂载与自定义 CSS 注入，_test/pomotheme.js 直接对产物做回归。
  // POMO_CSS_TEMPLATE 一并导出：测试用它校验「模板里的变量在 CSS 里都有人用」，
  // 防止写出看着能改、其实没人读的假接口。
  __testTheme: { applyTheme, syncCustomCss, POMO_CSS_ID, POMO_CSS_TEMPLATE },

  // 测试钩子：_test/pomomini.js 用真实 FloatUI 验证最小化后的标题与按钮。
  __testFloatUI: FloatUI,

  // 测试钩子：段类别判定（暂停沿用暂停前那一段），_test/pomotheme.js 校验。
  kindOf,

  // 测试钩子：桌面常驻开启后离开设置页，_test/deskdock.js 校验。
  leaveSettingsForDock,
  clickSettingsClose,
};

  };

  __modules['src/calendar.js'] = function (module, exports, require) {
const obsidian = require('obsidian');
const { normalizePath } = require('obsidian');
const {
  t: i18nT,
  MONTH_NAMES,
  WEEKDAY_NAMES,
  calLang,
  optText,
} = require('./i18n.js');
/**
 * 周号计算统一取 timejudge 的实现。
 * note.js 是叶子模块不能反向依赖本文件，所以共享逻辑只能下沉到判断表。
 */
const {
  weekDoyOf, firstWeekOffset, weeksInYear, dayOfYearOf, weekNumberOf, sameDay,
  WEEK_START_DOW,
} = require('./timejudge.js');

/**
 * 周列选择器：Calendar 各版本的 class 名不统一，四个别名都得认。
 * 点击命中（closest）、行号反查（querySelectorAll）、失效自检三处共用这一份。
 * 以前是同一串字符串写三遍，改版漏改一处就会出现「点周数没反应」且没提示。
 */
const WEEK_NUM_SELECTOR = '.week-num, .weekNum, .weeknum, .week-number';

/**
 * 周起始日下拉选项：由 timejudge 的 WEEK_START_DOW 派生，只在这里配中文名。
 * 值集合取自唯一真源，加/改周起始日只需动 timejudge 一处。
 * dow 为 null 表示「跟随系统区域」，运行时才解析。
 */
const WEEK_START_OPTIONS = [{ value: 'locale', label: '跟随系统区域', dow: null }].concat(
  Object.keys(WEEK_START_DOW).map((value) => ({
    value,
    label: '星期' + ['日', '一', '二', '三', '四', '五', '六'][WEEK_START_DOW[value]],
    dow: WEEK_START_DOW[value],
  }))
);

/**
 * 把「跟随系统区域」解析成具体 dow。
 * 用 moment 的 localeData 只读查询；拿不到就退回周日（moment 默认值）。
 */
function resolveLocaleDow() {
  try {
    const m = obsidian.moment ? obsidian.moment() : null;
    const ld = m && typeof m.localeData === 'function' ? m.localeData() : null;
    /*
     * 必须判 ld.week：写 w.week 会在 const w 初始化前引用，触发 TDZ，
     * 被下面 catch 静默吞掉 → 恒定返回周日 → 周数与周记文件名差一周。
     */
    const w = ld && typeof ld.week === 'function' ? ld.week() : null;
    if (w && typeof w.dow === 'number') return w.dow;
  } catch (e) { /* 只读查询失败不影响主流程 */ }
  return 0;
}

/** 按设置算出应该写入的 dow */
function targetDow(settings) {
  const cal = settings && settings.calendar;
  const v = cal ? cal.weekStart : 'locale';
  const hit = WEEK_START_OPTIONS.find((o) => o.value === v);
  if (!hit || hit.dow === null) return resolveLocaleDow();
  return hit.dow;
}

/**
 * 修复入口：变量缺失时补默认值。
 * 返回实际动作，供设置页显示 —— 不猜、不静默。
 */
function applyCalendarWeekSpec(settings) {
  const cal = settings && settings.calendar;
  if (!cal || cal.calendarFixEnabled === false) return '已关闭（未做任何写入）';

  if (typeof window === 'undefined') return '无 window';

  // 边界 1：已存在就完全不动，Calendar 自己的配置优先
  if (window._bundledLocaleWeekSpec) {
    const cur = window._bundledLocaleWeekSpec.dow;
    return `已存在，未改动（dow=${typeof cur === 'undefined' ? '无' : cur}）`;
  }

  // 边界 2：只写这一个变量，绝不动 moment 的全局 locale
  const dow = targetDow(settings);
  /*
   * doy 必须与 dow 配套，不能写死 6：恒写 6 与 zh-cn 的 {dow:1,doy:4} 不一致，
   * 而 Calendar 会拿这个 spec 去 defineLocale，周数和模板日期都会算偏。
   */
  window._bundledLocaleWeekSpec = { dow, doy: weekDoyOf(dow) };
  return `已补上（dow=${dow}, doy=${weekDoyOf(dow)}）`;
}

/** 设置页状态显示用：当前周起始（只读） */
function weekSpecStatus() {
  if (typeof window === 'undefined') return '无 window';
  const spec = window._bundledLocaleWeekSpec;
  if (!spec) return '未初始化（Calendar 设置页会报 dow）';
  const dow = spec.dow;
  return typeof dow === 'undefined' ? '已初始化但无 dow' : `dow=${dow}`;
}

/* ------------------------------------------------------------------ *
 * 设置页
 * ------------------------------------------------------------------ */

function renderCalendarSettings(containerEl, plugin) {
  const cal = plugin.settings.calendar;
  const notes = require('./note.js');

  /* ============ 区一：time tools 日历 ============ */
  /*
   * 折叠约定（用户要求）：总开关关闭时，其余设置项一律不渲染。
   * 之前关着也显示一大片模板路径输入框，既占地方又让人以为调了有用。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('k34aed95b', '启用 time tools 日历'))
    .setDesc(i18nT('kb1ee8965', "开启后可用命令「日历」打开月份网格：点年 / 月 / 日期 / 周数，分别生成年记、月记、日记、周记。"))
    .addToggle((t) =>
      t.setValue(cal.ownCalendarEnabled === true).onChange(async (v) => {
        cal.ownCalendarEnabled = v;
        // 互斥：启用time tools 日历时自动关掉 Calendar 增强（除非允许双开）
        const note = v === true ? enforceExclusive(plugin, 'own') : null;
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        // 关掉时把已打开的视图一并收起，否则会出现
        // 「开关关了、面板还开着」的割裂状态
        if (v !== true) closeOwnCalendar(plugin);
        plugin.redrawSettingsTab();
      })
    );

  // 共存开关放在折叠判断之前：无论time tools 日历开没开，它都要可见
  renderCoexistSection(containerEl, plugin);

  // 总开关未开 → 到此为止，其余全部折叠
  if (cal.ownCalendarEnabled !== true) {
    renderCalendarPluginSection(containerEl, plugin);
    return;
  }

  /* ---- 已开启：展开 ---- */
  const opened = isCalendarOpen(plugin);

  new obsidian.Setting(containerEl)
    .setName(opened
      ? i18nT('k8a98fa99', '关闭日历视图')
      : i18nT('ke9886e97', '打开日历视图'))
    .setDesc(opened
      ? i18nT('k082e7ac4', '当前视图已打开，点击关闭。')
      : i18nT('kd5a911e8', '点击打开日历视图，也可在命令面板搜索「日历」。'))
    .addButton((b) =>
      b.setButtonText(opened ? i18nT('kb15d9127', '关闭') : i18nT('kd7098f50', '打开'))
        .setCta()
        .onClick(async () => {
          if (opened) closeOwnCalendar(plugin);
          else await openOwnCalendar(plugin);
          plugin.redrawSettingsTab();
        })
    );

  /* ---- 笔记生成（Templater 联动）---- */
  containerEl.createDiv({ cls: 'tt-cal-sub', text: i18nT('k75e90ef6', '笔记生成') });
  notes.renderNoteSettings(containerEl, plugin);

  containerEl.createDiv({ cls: 'tt-cal-sub', text: i18nT('k7c0e24c0', '圆点') });

  new obsidian.Setting(containerEl)
    .setName(i18nT('kea445a06', '显示字数圆点'))
    .setDesc(i18nT('k54fc7f05', '日期下方按当天日记字数显示圆点。关闭则界面更干净。'))
    .addToggle((t) =>
      t.setValue(cal.dotsEnabled !== false).onChange(async (v) => {
        cal.dotsEnabled = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 农历模式：打开后取代圆点（互斥）。
   * 说明里必须写清「会关掉圆点」—— 否则用户开了农历发现圆点没了，
   * 会以为是 bug。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('kaf1120c5', '日期格显示农历'))
    .setDesc(i18nT('kbcdf1332', "默认关。打开后日期格显示农历（初一显示月名，其余显示农历日），并**取代字数圆点**：有笔记只在农历旁显示一个小点。格子空间有限，两者互斥。"))
    .addToggle((t) =>
      t.setValue(cal.lunarOnCalendar === true).onChange(async (v) => {
        cal.lunarOnCalendar = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  // 圆点关掉后，字数配置项没有意义，一并折叠
  if (cal.dotsEnabled === false) {
    // 继续往下走（周起始日等仍需渲染）
  } else if (cal.lunarOnCalendar === true) {
    // 农历模式下圆点不显示，字数配置同样无意义
  } else {
  new obsidian.Setting(containerEl)
    .setName(i18nT('ka43c4195', '每个圆点代表的字数'))
    .setDesc(i18nT('kea46a20c', "日期格圆点 = 当天日记字数 ÷ 此值；周数列 = 该周「周记本身」字数 ÷ 此值（没周记就没点）。留空或 0 退化为「有笔记 = 1 个实心点」。横排每 5 个一行，最多 10 个。数值太小（如 1）会都顶到上限，建议 ≥ 50。"))
    .addText((tx) =>
      tx.setPlaceholder('250')
        .setValue(String(cal.wordsPerDot ?? 250))
        .onChange(async (v) => {
          const n = parseInt(String(v).trim(), 10);
          cal.wordsPerDot = Number.isFinite(n) && n > 0 ? n : 0;
          await plugin.saveSettings();
          /*
           * 这里曾经调用 plugin.redrawSettingsTab() —— 那是错的：
           * 重绘会销毁并重建整个设置页，输入框 DOM 跟着重建，焦点丢失，
           * 表现就是「每敲一个字符就失焦，必须先删一个才能再填一个」。
           * 数值变化只需刷新日历视图，设置页本身不用动。
           */
          refreshCalendarViews(plugin);
        })
    );
  }

  new obsidian.Setting(containerEl)
    .setName(i18nT('kfe9269df', '格子固定尺寸'))
    .setDesc(i18nT('k870b36c0', '开启后格子高度固定、不随面板拉伸，排布更紧凑。关闭则 6 行均分可用高度。'))
    .addToggle((t) =>
      t.setValue(cal.fixedCellSize === true).onChange(async (v) => {
        cal.fixedCellSize = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  containerEl.createDiv({ cls: 'tt-cal-sub', text: i18nT('kcc0760bc', '周起始日') });
  new obsidian.Setting(containerEl)
    .setName(i18nT('k8bd3cd15', '周起始日'))
    .setDesc(i18nT('k32510d13', "全插件唯一的周起始日：网格、周数、「第 N 周」解析、修复 Calendar 的默认值都用它。需与 Calendar 的「Start week on」设为一致。"))
    .addDropdown((d) => {
      WEEK_START_OPTIONS.forEach((o) => d.addOption(o.value, optText('weekStart', o.value, o.label)));
      d.setValue(cal.weekStart || 'locale').onChange(async (v) => {
        cal.weekStart = v;
        await plugin.saveSettings();
        applyCalendarWeekSpec(plugin.settings);
        plugin.redrawSettingsTab();
      });
    });

  renderCalendarPluginSection(containerEl, plugin);

  // 区末恢复默认：日历与笔记两块一起重置
  const { addResetButton } = require('./settings.js');
  addResetButton(containerEl, plugin, ['calendar', 'notes'], '日历');
}

/**
 * 两个日历的共存开关。
 *
 * 默认互斥：开启「在 Calendar 视图上接管点击」会自动关掉并收起 time tools 日历。
 * 两个日历同时在工作区里各渲染一套月份网格、各自维护一套周数与圆点，
 * 状态互不相通，看着像同一份数据其实各算各的 —— 所以默认不让它们同时出现。
 * 确有需要（比如对照两边的周数排布）由用户显式打开双开。
 */
function renderCoexistSection(containerEl, plugin) {
  const cal = plugin.settings.calendar;

  new obsidian.Setting(containerEl)
    .setName(i18nT('k15d34898', '允许同时开启两个日历（双开）'))
    .setDesc(i18nT('k39f93908', '默认关 = 两个日历互斥：开一个会自动关掉另一个。打开后才允许并存。'))
    .addToggle((t) =>
      t.setValue(cal.allowBoth === true).onChange(async (v) => {
        cal.allowBoth = v;
        // 关掉双开时立刻按互斥收敛一次，否则当前状态会卡在「两者都开」
        const note = v !== true
          ? (cal.enhanceCalendarEnabled === true
            ? enforceExclusive(plugin, 'enhance')
            : enforceExclusive(plugin, 'own'))
          : null;
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        plugin.redrawSettingsTab();
      })
    );
}

/**
 * 互斥收敛：保留 keep 指定的那一个，关掉另一个。
 * @param {'own'|'enhance'} keep 要保留的日历
 * @returns {string|null} 做了什么，供 Notice 提示；未动返回 null
 */
function enforceExclusive(plugin, keep) {
  const cal = plugin.settings.calendar;
  if (!cal || cal.allowBoth === true) return null;
  if (keep === 'own' && cal.enhanceCalendarEnabled === true) {
    cal.enhanceCalendarEnabled = false;
    return '已自动关闭「在 Calendar 视图上接管点击」';
  }
  if (keep === 'enhance' && cal.ownCalendarEnabled === true) {
    cal.ownCalendarEnabled = false;
    closeOwnCalendar(plugin);
    return '已自动关闭并收起 time tools 日历';
  }
  return null;
}

/**
 * 启动期归一化 —— 堵住「没允许双开却双开」最主要的一条路。
 *
 * allowBoth 是后加的开关，在此之前两个日历开关可以同时为 true；老 data.json
 * 升级上来就带着这个状态，而 enforceExclusive 只在设置页拨动时触发 —— 用户不拨就没人收敛。
 * 保留哪个按实况判断：此刻 time tools 日历开着就留它，否则留增强。
 *
 * @returns {string|null} 做了什么，供 Notice 提示；无需收敛返回 null
 */
/**
 * 启动期归一化：两个增强开关不能同时开。
 *
 * 它们现在是互斥的两种模式，而 nativeDayWeek 曾经依赖 enhanceCalendarEnabled
 * （打开它会自动打开后者），老 data.json 里可能两者同时为 true。
 * 同时为 true 时保留「全接管」—— 它的覆盖面更完整，半接管是它的子集。
 *
 * @returns {string|null} 做了什么，供 Notice 提示
 */
function normalizeEnhanceExclusive(plugin) {
  const cal = plugin.settings && plugin.settings.calendar;
  if (!cal || cal.nativeDayWeek !== true || cal.enhanceCalendarEnabled !== true) return null;
  cal.nativeDayWeek = false;
  return '两个增强开关此前同时开启，已保留「全接管」、关闭「日/周用 Calendar 原生」';
}

function normalizeCalendarExclusive(plugin) {
  const cal = plugin.settings && plugin.settings.calendar;
  // 先归一对内的：两个增强开关不能同时开（老配置可能同时为 true）
  const dn = normalizeEnhanceExclusive(plugin);
  if (!cal || cal.allowBoth === true) return dn || null;
  if (cal.ownCalendarEnabled !== true || cal.enhanceCalendarEnabled !== true) return null;
  let note;
  if (isCalendarOpen(plugin)) {
    cal.enhanceCalendarEnabled = false;
    note = '两个日历此前同时开启，已保留 time tools 日历、关闭 Calendar 增强';
  } else {
    cal.ownCalendarEnabled = false;
    note = '两个日历此前同时开启，已保留 Calendar 增强、关闭 time tools 日历';
  }
  // 无论保留哪个，总开关一旦为 false 就把视图收起（含布局恢复出来的）
  if (cal.ownCalendarEnabled !== true) closeOwnCalendar(plugin);
  return note;
}

/**
 * Calendar 插件那一区（含设置页空白修复 + 增强开关）。
 * 单独抽出来：time tools 日历折叠时它照样要显示 ——
 * Bug 修复是默认开的，不能被自研部分的折叠带没了。
 */
/**
 * Calendar 插件那一区。
 *
 * 结构（用户定）：
 *   1. Bug 折叠 —— 默认收起，只放 Bug 修复 / 兜底开关（空白页修复、Templater 补跑）
 *   2. calendar 效果增强 —— 两个开关互斥：只能开一个，或都关
 *
 * 单独抽成函数：time tools 日历折叠时这一区照样要显示。
 */
function renderCalendarPluginSection(containerEl, plugin) {
  const cal = plugin.settings.calendar;

  containerEl.createDiv({ cls: 'tt-cal-section', text: i18nT('k3a84cae1', 'Calendar 插件') });

  renderBugFoldSection(containerEl, plugin);

  /* ============ calendar 效果增强 ============ */
  containerEl.createDiv({ cls: 'tt-cal-section', text: i18nT('k43ddc26d', 'calendar 效果增强') });

  /*
   * 两个开关是互斥的两种模式，不是叠加：
   *   半接管 = 日/周交回 Calendar 原生，月/年由本插件生成
   *   全接管 = 年/月/周/日全部由本插件生成
   * 都关 = 完全用 Calendar 原生功能（此时折叠区的「补跑 Templater」负责模板）
   * 同时开没有意义：全接管已经包含了半接管的部分，只会互相打架。
   */
  new obsidian.Setting(containerEl)
    .setName(i18nT('k82aca320', '日/周用 Calendar 原生功能，月/年使用 time tools 插件'))
    .setDesc(i18nT('k98defe6b', "半接管。开启后：点日期 / 周数放行给 Calendar 原生（模板走核心「日记」插件，Templater 语法靠折叠区里的补跑兜底）；点年 / 月由 time tools 接管，走 Templater。适合日记周记已由 Calendar 配好、只想补月记年记。与下面的「接管点击」互斥。"))
    .addToggle((t) =>
      t.setValue(cal.nativeDayWeek === true).onChange(async (v) => {
        const note = setEnhanceMode(plugin, v === true ? 'dayweek' : 'none');
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        plugin.redrawSettingsTab();
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k60622dbe', '在 Calendar 视图上接管点击'))
    .setDesc(i18nT('k499ba9ea', "全接管。开启后 Calendar 视图里的年 / 月 / 周 / 日期点击全部由 time tools 生成，一律走 Templater 模板。依赖 Calendar 内部 DOM，改版可能失效，故默认关。与上面的「日/周用原生」互斥；开启还会收起 time tools 日历（除非允许双开）。"))
    .addToggle((t) =>
      t.setValue(cal.enhanceCalendarEnabled === true).onChange(async (v) => {
        const note = setEnhanceMode(plugin, v === true ? 'full' : 'none');
        await plugin.saveSettings();
        if (note) new obsidian.Notice(note);
        plugin.redrawSettingsTab();
      })
    );
}

/**
 * 设置增强模式，并做互斥收敛。
 * @param {'dayweek'|'full'|'none'} mode
 * @returns {string|null} 做了什么，供 Notice 提示
 */
function setEnhanceMode(plugin, mode) {
  const cal = plugin.settings.calendar;
  const wasOther = mode === 'dayweek'
    ? cal.enhanceCalendarEnabled === true
    : mode === 'full'
      ? cal.nativeDayWeek === true
      : false;

  cal.nativeDayWeek = mode === 'dayweek';
  cal.enhanceCalendarEnabled = mode === 'full';

  let note = wasOther ? '两个增强开关只能开一个：已自动关闭另一个' : null;
  // 任一增强模式开启时，与 time tools 日历仍按 allowBoth 互斥
  if (mode !== 'none') {
    const n2 = enforceExclusive(plugin, 'enhance');
    if (n2) note = note ? note + '；' + n2 : n2;
  }
  return note;
}

/**
 * Bug 折叠区：默认收起。
 *
 * 折叠只是不让它们占着正常用户的视线，不影响已开启的开关生效。
 * 两个开关的默认值不同：空白页修复默认关（没有出问题就别往 window 上补东西），
 * Templater 补跑默认开（Calendar 用不了 Templater 时唯一的兜底）。
 */
function renderBugFoldSection(containerEl, plugin) {
  const cal = plugin.settings.calendar;

  new obsidian.Setting(containerEl)
    .setName(i18nT('k9c43a4e6', '如果 Calendar 插件出现 Bug 请打开'))
    .setDesc(i18nT('k4a21c3d1', "只是折叠开关，本身不改变任何功能，默认收起 —— 里面的开关照常生效。遇到 Calendar 设置页空白、Templater 语法没被执行时再打开。"))
    .addToggle((t) =>
      t.setValue(cal.bugFoldOpen === true).onChange(async (v) => {
        cal.bugFoldOpen = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  if (cal.bugFoldOpen !== true) return;

  containerEl.createDiv({
    cls: 'tt-cal-intro',
    text: i18nT('k03ba5c79',
      '修复 Calendar 插件（liamcain/obsidian-calendar-plugin）设置页空白的问题：' +
      '它读 window._bundledLocaleWeekSpec，而该变量要等日历视图打开过一次才初始化，' +
      '未初始化时读 .dow 抛错，导致 Weekly Note Settings 整段不显示。'),
  });

  new obsidian.Setting(containerEl)
    .setName(i18nT('kf3de8a42', '修复 Calendar 设置页空白'))
    .setDesc(i18nT('kbb05cdfc', "开启后，若 window._bundledLocaleWeekSpec 缺失则补默认值（只补不覆盖）。不会改动 moment 全局区域设置，不影响其他插件。默认关 —— Calendar 设置页出现空白时再打开。"))
    .addToggle((t) =>
      t.setValue(cal.calendarFixEnabled !== false).onChange(async (v) => {
        cal.calendarFixEnabled = v;
        await plugin.saveSettings();
        if (v) applyCalendarWeekSpec(plugin.settings);
        plugin.redrawSettingsTab();
      })
    );

  const status = containerEl.createDiv({ cls: 'tt-cal-status' });
  status.setText(i18nT('k807bc5f8', '当前：{0}', weekSpecStatus()));

  new obsidian.Setting(containerEl)
    .setName(i18nT('k74d9faed', '立即应用'))
    .setDesc(i18nT('k2ebd6bee', '手动再补一次（通常不需要，重启 Obsidian 后会自动生效）。'))
    .addButton((b) =>
      b.setButtonText(i18nT('k5b0520a9', '应用')).setCta().onClick(async () => {
        const r = applyCalendarWeekSpec(plugin.settings);
        status.setText(i18nT('kbc7fdc3c', '当前：{0}（本次：{1}）', weekSpecStatus(), r));
        new obsidian.Notice('日历修复：' + r);
      })
    );

  new obsidian.Setting(containerEl)
    .setName(i18nT('k1eac6a23', 'Calendar 新建的笔记补跑 Templater'))
    .setDesc(i18nT('kfd7b77ee', "三个日历开关都关掉、改用 Calendar 原生新建日记 / 周记时，它走核心「日记」插件的模板通道，模板被原样复制，<% %> 不会执行。开启后，本插件检测到这类新笔记（空文件、含裸 <% %>、或整段等于模板原文）就用 Templater 重写一次。已渲染的文件不会再动，不与 Templater 自带「新建时触发」叠加。识别需「文件名符合格式 + 落在上面填的文件夹」，所以 Calendar 那边也要建到同一文件夹。"))
    .addToggle((t) =>
      t.setValue(cal.templaterBridge !== false).onChange(async (v) => {
        cal.templaterBridge = v;
        await plugin.saveSettings();
      })
    );
}

/* ------------------------------------------------------------------ *
 * Templater 桥接
 *
 * 场景：三个日历开关都关、用 Calendar 原生新建周期笔记时，模板被原样复制，<% %> 不执行。
 * 兜底：监听新建文件，命中周期笔记且尚未渲染（空 / 含裸 <% %> / 等于模板原文）时，
 * 调 Templater 官方 API 重写一次。幂等来自「只认可判定的未渲染状态」。
 * ------------------------------------------------------------------ */

/** 只处理刚创建的文件：同步 / 重建索引也会触发 create，绝不能去动老笔记 */
const BRIDGE_WINDOW_MS = 10000;
/*
 * create 事件触发时，核心「日记」插件往往还没把模板内容写进去（它是 create 之后异步写的）。
 * 立刻读会读到空文件；等这一小会儿再读，才能区分「真的没模板」和「还没写完」。
 * 同时也是给 Templater 自带的「新建文件时触发」留出执行时间 —— 它跑完了我们就不再补一次。
 */
const BRIDGE_DELAY_MS = 350;
/** 去重表上限，防止长期累积（规则四：不积累废弃数据） */
const BRIDGE_MAX = 200;
const bridgedPaths = new Map(); // path -> 处理时刻

function pruneBridged(now) {
  bridgedPaths.forEach((t, p) => {
    if (now - t > BRIDGE_WINDOW_MS * 6) bridgedPaths.delete(p);
  });
  // Map 按插入顺序迭代，最早的在最前
  while (bridgedPaths.size > BRIDGE_MAX) {
    bridgedPaths.delete(bridgedPaths.keys().next().value);
  }
}

/*
 * 用户可见提示。
 * 铁律：失败要么让用户看见，要么有明确降级路径 —— 只 console.warn 等于没有。
 * notifyOnce 按消息去重（上限 100 条）：补跑是「每建一个笔记触发一次」，
 * 不去重会变成每建一篇弹一次，反而逼用户关掉这个功能。
 */
const _noticed = new Set();
function notify(msg) {
  try {
    if (typeof obsidian.Notice === 'function') new obsidian.Notice(msg);
  } catch (e) { /* 提示失败不能影响主流程 */ }
}
function notifyOnce(msg) {
  if (_noticed.has(msg)) return;
  _noticed.add(msg);
  if (_noticed.size > 100) _noticed.delete(_noticed.keys().next().value);
  notify(msg);
}

function registerTemplaterBridge(plugin) {
  try {
    const vault = plugin.app && plugin.app.vault;
    if (!vault || typeof vault.on !== 'function') return;
    plugin.registerEvent(
      vault.on('create', (file) => {
        bridgeNewNote(plugin, file).catch((e) => {
          console.warn('[Time Tools] Templater 桥接失败', e);
          notifyOnce(
            'Templater 补跑失败：' + (e && e.message ? e.message : e) + '（详见控制台）'
          );
        });
      })
    );
  } catch (e) {
    console.warn('[Time Tools] Templater 桥接注册失败', e);
    notifyOnce('Templater 补跑监听注册失败，本次启动不会自动补跑模板');
  }
}

/** parseNoteRef 返回 day / week / month / year，这里换成 notes 配置里的键 */
const BRIDGE_KIND_OF = { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' };

async function bridgeNewNote(plugin, file) {
  /*
   * 每个退出点都带一句原因，读代码时才知道这一步在防什么。
   * （曾有一版把原因存进全局对象、再用诊断命令展示；诊断命令已移除，不再留状态。）
   */
  const bail = (_reason) => false;
  const ok = () => true;

  const cal = plugin.settings && plugin.settings.calendar;
  if (!cal || cal.templaterBridge === false) return bail('开关「补跑 Templater」为关'); // 默认开
  if (!file || !/\.md$/i.test(file.path || '')) return bail('不是 md 文件');

  const now = Date.now();
  pruneBridged(now);

  const ct = file.stat && file.stat.ctime;
  if (!ct) return bail('file.stat.ctime 缺失');
  if (now - ct > BRIDGE_WINDOW_MS) return bail('不是刚创建的文件（超出时间窗）');
  if (bridgedPaths.has(file.path)) return bail('该文件已补跑过，跳过');

  const notes = plugin.settings.notes || {};
  const dow = targetDow(plugin.settings);
  const noteMod = require('./note.js');
  const ref = parseNoteRef(file.basename || '', dow, notes, plugin.settings);
  const p = String(file.path || '');

  /*
   * 匹配改成「文件名」与「文件夹」双通道，任一命中即可。
   * 以前只认文件名格式：用户实际文件名常带星期后缀（2026-09-25-周五），
   * 与配置格式 YYYY-MM-DD 对不上就整类漏掉 —— 这是「点了没反应」的真因之一。
   * 文件夹是更稳的信号：Calendar 会把笔记建到用户在「笔记生成」里配的目录。
   */
  let kind = ref ? BRIDGE_KIND_OF[ref.kind] : null;
  let cfg = kind ? notes[kind] : null;
  if (!cfg) {
    for (const k of ['daily', 'weekly', 'monthly', 'yearly']) {
      const c = notes[k];
      if (!c || !c.folder) continue;
      const f = noteMod.resolvePathTokens(c.folder);
      if (f && (p === f + '/' + file.name || p.startsWith(f + '/'))) {
        kind = k; cfg = c; break;
      }
    }
  }
  if (!cfg) return bail('文件名与文件夹都不匹配日/周/月/年记配置');

  /*
   * 文件夹校验始终执行（不能因为走了文件名通道就跳过）：
   * 否则收件箱里一个恰好叫 2026-09-28 的文件也会被当成日记渲染。
   */
  const folder = noteMod.resolvePathTokens(cfg.folder);
  if (folder) {
    if (p !== folder + '/' + file.name && !p.startsWith(folder + '/')) {
      return bail('文件不在配置的文件夹内：期望 ' + folder + '，实际 ' + p);
    }
  }

  /*
   * 等核心「日记」插件写完模板、也给 Templater 自带的「新建文件时触发」留出执行时间。
   * 它俩谁先跑完都不影响判定：跑完的笔记内容会是渲染结果，下面判为「已渲染」直接跳过。
   */
  await new Promise((r) => setTimeout(r, BRIDGE_DELAY_MS));

  let body = '';
  try {
    body = await plugin.app.vault.cachedRead(file);
  } catch (e) {
    return;
  }

  /*
   * 判定「尚未被 Templater 渲染」。只认三种**可判定**的状态：
   *   1. 空文件 —— 核心「日记」插件没配模板时就是这样，此时最需要补跑；
   *   2. 含裸 <% —— 模板被原样复制，Templater 语法没执行；
   *   3. 内容与模板文件原文完全相同 —— 模板被整段复制（模板里可能没有 <% 语法）。
   * 除此以外一律跳过：内容已经有实质东西，说明渲染过了，再写一次会覆盖用户输入。
   */
  const raw = body == null ? '' : String(body);
  const trimmed = raw.trim();
  let unrendered = trimmed === '' || raw.indexOf('<%') >= 0;

  /*
   * 模板文件只用于「整段等于模板原文」这条辅助判定，可有可无。
   * 以前把它当硬性前置（没配就退出），而用户模板常配在 Calendar 那边，
   * 本插件的 notes.*.template 为空 —— 于是整类场景不生效。
   */
  let tplText = null;
  if (cfg.template) {
    const found = noteMod.resolveTemplate(plugin.app, cfg.template);
    if (found && found.file) {
      try {
        tplText = await plugin.app.vault.cachedRead(found.file);
      } catch (e) {
        tplText = null;
      }
    }
  }
  if (!unrendered && tplText != null) {
    if (String(tplText).trim() === trimmed) unrendered = true;
  }
  if (!unrendered) return bail('内容已渲染过，不动');

  const t = noteMod.getTemplater(plugin.app);
  if (!t) {
    console.warn('[Time Tools] Templater 不可用，无法补跑模板：', file.path);
    notifyOnce('Templater 不可用，无法补跑模板 —— 请安装并启用 Templater 后重试');
    return bail('Templater 未安装或未初始化');
  }

     /*
     * 渲染对象是笔记正文，不是配置的模板文件：用户模板常配在 Calendar 那边，
     * 本插件 notes.*.template 常为空；即便有值，两边不一致也会覆盖掉 Calendar 写进去的东西。
     */
  const source = raw;

  /*
   * 首选 Templater 的公开命令 replace-in-file-templater（渲染当前活动文件）。
   * 命令 ID 已核实三处一致：deepwiki 命令表、Advanced URI 文档、dsebastien 指南。
   * 此前两版分别用了不存在的方法名、写错的命令 ID，都是凭印象猜的 —— 这是第三次修正。
   * 命令由 Templater 自己完成「读取→渲染→写回」，不依赖任何内部方法签名。
   */
  const TPL_CMD = 'templater-obsidian:replace-in-file-templater';
  try {
    const ws = plugin.app && plugin.app.workspace;
    if (ws && typeof ws.getActiveFile === 'function' && ws.getActiveFile() !== file
        && typeof ws.getLeaf === 'function') {
      await ws.getLeaf().openFile(file);
    }
    if (plugin.app.commands && typeof plugin.app.commands.executeCommandById === 'function') {
      await plugin.app.commands.executeCommandById(TPL_CMD);
      const after = await plugin.app.vault.cachedRead(file);
      if (String(after).indexOf('<%') < 0) {
        bridgedPaths.set(file.path, now);
        new obsidian.Notice('已用 Templater 重新渲染：' + (file.basename || file.path));
        return ok();
      }
    }
  } catch (e) {
    console.warn('[Time Tools] Templater 命令执行失败，退回 API：', e && e.message);
  }

  /* 命令不可用（版本差异）时退回 API：同样渲染笔记自身内容 */
  if (typeof t.parse_template !== 'function') {
    console.warn(
      '[Time Tools] Templater 命令与 parse_template 都不可用：', file.path,
      '可用方法：', Object.keys(t).join(',')
    );
    return bail('Templater 命令与 parse_template 都不可用（版本不兼容）');
  }

  const RUN_MODE_OVERWRITE_FILE = 2;
  let rendered = '';
  try {
    /*
     * create_running_config 是 Templater 的公开方法，
     * 比手写 config 结构可靠 —— 结构随版本变化也不会错。
     */
    const runCfg = typeof t.create_running_config === 'function'
      ? t.create_running_config(file, file, RUN_MODE_OVERWRITE_FILE)
      : { template_file: file, target_file: file, run_mode: RUN_MODE_OVERWRITE_FILE };
    rendered = await t.parse_template(runCfg, source);
  } catch (e) {
    console.warn('[Time Tools] Templater 渲染失败，未写入任何内容：', file.path, e);
    notify(
      'Templater 渲染失败，笔记未写入任何内容：' + (file.basename || file.path)
    );
    return bail('Templater 渲染抛错：' + (e && e.message ? e.message : String(e)));
  }
  if (rendered == null) rendered = '';

  bridgedPaths.set(file.path, now);
  // 必须覆盖写，不能用 append：追加会让模板内容在笔记里出现两份
  await plugin.app.vault.modify(file, String(rendered));
  new obsidian.Notice('已用 Templater 重新渲染：' + (file.basename || file.path));
  return ok();
}


/** 打开time tools 日历视图（复用已有 leaf，避免开多个）*/
/** 视图当前是否已打开（设置页据此显示「打开」还是「关闭」）*/
function isCalendarOpen(plugin) {
  try {
    const ws = plugin.app && plugin.app.workspace;
    if (!ws || typeof ws.getLeavesOfType !== 'function') return false;
    return (ws.getLeavesOfType(CAL_VIEW_TYPE) || []).length > 0;
  } catch (e) {
    return false;
  }
}

async function openOwnCalendar(plugin) {
  /*
   * 门控：总开关关着时直接拒绝。
   * 之前开关只作用于设置页渲染，功能侧完全没接 ——
   * 关了开关命令照样能开视图，等于没关。
   */
  const cal = plugin.settings && plugin.settings.calendar;
  if (!cal || cal.ownCalendarEnabled !== true) {
    new obsidian.Notice('time tools 日历未启用，请先在设置里打开总开关');
    return false;
  }
  /*
   * 互斥：Calendar 增强开着且未允许双开时，拒绝打开time tools 日历。
   * 只靠设置页的开关联动挡不住命令面板这条路径。
   */
  if (cal.allowBoth !== true && cal.enhanceCalendarEnabled === true) {
    new obsidian.Notice(
      '已启用「在 Calendar 视图上接管点击」，两者默认互斥。如需同时开启，请打开「允许同时开启两个日历」。'
    );
    return false;
  }
  try {
    const ws = plugin.app.workspace;
    let leaf = ws.getLeavesOfType(CAL_VIEW_TYPE)[0];
    if (!leaf) {
      const r = ws.getRightLeaf(false);
      if (r) { await r.setViewState({ type: CAL_VIEW_TYPE, active: true }); leaf = r; }
    }
    if (leaf) ws.revealLeaf(leaf);
    return true;
  } catch (e) {
    new obsidian.Notice('打开日历视图失败：' + (e && e.message ? e.message : e));
    return false;
  }
}

/**
 * 关闭time tools 日历视图。
 *
 * 之前没有这条退路：视图一旦打开就只能禁用插件才退得出去。
 * 现在视图内的 ×、命令面板的「关闭日历」都走这里。
 * detach 之后 Obsidian 会自己走 view 的 onClose()，观察器在那里断开。
 */
function closeOwnCalendar(plugin) {
  try {
    const ws = plugin.app.workspace;
    const leaves = ws.getLeavesOfType(CAL_VIEW_TYPE) || [];
    if (leaves.length === 0) return false;
    leaves.forEach((l) => l.detach());
    return true;
  } catch (e) {
    console.warn('[Time Tools] 关闭日历视图失败', e);
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * 注册入口（onload 调用）
 * ------------------------------------------------------------------ */

function registerCalendar(plugin) {
  // 延后到布局就绪，避免与其他插件的初始化抢时序
  const apply = () => {
    try {
      applyCalendarWeekSpec(plugin.settings);
    } catch (e) {
      console.error('[Time Tools] 日历修复失败', e);
    }
    /*
     * 布局就绪后再做互斥归一化与残留清理。
     * 放在这里是因为：此时视图已注册、布局已恢复，
     * 才能准确判断「日历视图此刻是否开着」，也才收得掉被恢复出来的叶子。
     */
    try {
      const note = normalizeCalendarExclusive(plugin);
      const c = plugin.settings && plugin.settings.calendar;
      if (!c || c.ownCalendarEnabled !== true) closeOwnCalendar(plugin);
      if (note) {
        Promise.resolve(plugin.saveSettings()).catch(() => {});
        new obsidian.Notice(note);
      }
    } catch (e) {
      console.error('[Time Tools] 日历互斥归一化失败', e);
    }
  };
  if (typeof plugin.app.workspace.onLayoutReady === 'function') {
    plugin.app.workspace.onLayoutReady(apply);
  } else {
    apply();
  }

}

/* ------------------------------------------------------------------ *
 * time tools 日历视图
 *
 * 参考 Dust Calendar 的布局：月份网格 + 周数列。
 * 四种点击：年份→年记、月份→月记、日期→日记、周数→周记。
 * 总开关 ownCalendarEnabled，默认关。
 * ------------------------------------------------------------------ */
const CAL_VIEW_TYPE = 'time-tools-calendar-view';
/* 恒定 6 行 × 7 列，切月时高度不跳 */
const GRID_ROWS = 6;
/* 圆点：一行最多 5 个，超出换行，总上限 10（两行） */
const DOTS_PER_ROW = 5;
const DOTS_MAX = 10;

class CalendarNoteView extends obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth();
    /*
     * 当前聚焦日期 —— 全填充高亮画在这天。
     *
     * 它由两处驱动：点格子（乐观反馈）和 file-open（当前打开的笔记）。
     * 之前只有「点击」驱动，且切月/生成后立刻清空，于是全填充长期
     * 落在 is-today 上，看起来像锁死在今天。
     */
    this.picked = null;
    /*
     * 高亮落在哪类元素上：day / week / month / year。
     *
     * 只存一个日期是不够的 —— 周记对应的是「一整行 + 周数格」，
     * 月记 / 年记对应的是标题。旧实现没有这个字段，于是打开周记时
     * 高亮只能落在一个日期格上，且解析出的周首日常与点击时不同，
     * 看着像在乱蹦。
     * 周记时 picked 存的是周首日（周一或周日，随周起始设置）。
     */
    this.selKind = null;
    this.resizeObserver = null;
  }
  getViewType() { return CAL_VIEW_TYPE; }
  getDisplayText() { return '日历'; }
  getIcon() { return 'calendar-days'; }

  async onOpen() {
    /*
     * 兜底：布局恢复会绕过 openOwnCalendar 的门控直接实例化视图。
     * 上次退出时日历开着，下次启动 Obsidian 会把它原样恢复出来 ——
     * 哪怕总开关已经关了、或增强开着且未允许双开。
     * 这里自己退场，延后一拍执行以避开 onOpen 内部流程。
     */
    const c0 = this.plugin && this.plugin.settings ? this.plugin.settings.calendar : null;
    if (c0 && (c0.ownCalendarEnabled !== true
      || (c0.allowBoth !== true && c0.enhanceCalendarEnabled === true))) {
      setTimeout(() => { try { this.leaf.detach(); } catch (e) { /* 已销毁则忽略 */ } }, 0);
      return;
    }
    this.syncActiveFile();
    this.render();
    /*
     * 跟随当前打开的笔记：切到某篇日记时，全填充高亮挪到那天。
     * 用 registerEvent 注册，onClose 时 Obsidian 自动解绑。
     */
    if (this.app && this.app.workspace && typeof this.app.workspace.on === 'function') {
      this.registerEvent(this.app.workspace.on('file-open', () => this.syncActiveFile()));
    }
    /*
     * 窄侧栏时标题要能上下排（月份在上、年份在下）。
     * Obsidian 侧栏宽度与窗口宽度无关，媒体查询测不到，
     * 所以用 ResizeObserver 直接量自身宽度。
     */
    if (typeof ResizeObserver === 'function' && this.contentEl) {
      this.resizeObserver = new ResizeObserver(() => this.applyNarrowClass());
      this.resizeObserver.observe(this.contentEl);
    }
  }

  async onClose() {
    // 关视图时必须断开观察器，否则叶子销毁后仍会回调 → 报错
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /** 宽度不足时给容器加类，CSS 据此把标题改成上下排 */
  applyNarrowClass() {
    const el = this.contentEl;
    if (!el) return;
    const w = el.clientWidth || 0;
    if (w > 0 && w < 240) el.addClass('is-narrow');
    else el.removeClass('is-narrow');
  }

  /** 周起始日偏移：0=周日 … 6=周六 */
  get firstDow() {
    const v = this.plugin.settings.calendar.weekStart;
    if (v && v !== 'locale') {
      const hit = WEEK_START_OPTIONS.find((o) => o.value === v);
      if (hit && hit.dow !== null) return hit.dow;
    }
    return resolveLocaleDow();
  }

  /**
   * 把全填充高亮同步到「当前打开的笔记」对应的日期。
   *
   * 从文件名里解析日期（日记 / 周记 / 月记 / 年记都认）；
   * 解析不出就保持不动 —— 不猜、也不清空。
   * 解析出的日期若不在当前显示月，顺带切月，否则高亮落在视野外看不见。
   *
   * @returns {boolean} 是否发生了重绘
   */
  syncActiveFile() {
    let f = null;
    try {
      f = this.app && this.app.workspace ? this.app.workspace.getActiveFile() : null;
    } catch (e) { f = null; }
    if (!f) return false;
    const notesCfg = (this.plugin && this.plugin.settings && this.plugin.settings.notes) || null;
    const ref = parseNoteRef(f.basename || f.name || '', this.firstDow, notesCfg, this.plugin && this.plugin.settings);
    if (!ref) {
      /*
       * 打开的不是日历类笔记（日记 / 周记 / 月记 / 年记之外）：必须清掉高亮。
       * 旧实现这里直接 return，picked 原样留着 —— 切到别的笔记后日历上
       * 还亮着上一次那格，看着像卡住了。
       */
      if (this.picked) {
        this.picked = null;
        this.selKind = null;
        this.render();
        return true;
      }
      return false;
    }
    const d = ref.date;

      /*
       * 切月策略 —— 这是「高亮乱蹦」的主因。旧实现一律切到解析出的日期所在月，
       * 于是周记跳到周首日月、年记跳到 1 月。现在按类型分：
       *   week —— 一周跨月常见，与当前月有交集就留在当前月，高亮画整行；
       *   year —— 不切月，只高亮年份标题；month / day —— 按日期所在月切。
       */
    let offMonth;
    if (ref.kind === 'year') {
      offMonth = false;
    } else if (ref.kind === 'week') {
      offMonth = !weekTouchesMonth(d, this.year, this.month);
    } else {
      offMonth = d.getFullYear() !== this.year || d.getMonth() !== this.month;
    }

    const unchanged = this.picked && this.selKind === ref.kind && sameDay(this.picked, d);
    this.picked = d;
    this.selKind = ref.kind;
    // 同一天、同类、且没跨月就不重绘：file-open 触发很频繁，省掉无谓的整表重建
    if (unchanged && !offMonth) return false;
    if (offMonth) {
      this.year = d.getFullYear();
      this.month = d.getMonth();
    }
    this.render();
    return true;
  }

  /**
   * 从 picked（周首日）起算的一周，是否与当前显示月有交集。
   * 用于判断打开周记时是否需要切月 —— 有交集就留在当前月。
   * @param {Date} start 周首日
   * @param {number} y 视图当前年
   * @param {number} m 视图当前月（0 起）
   */

  render() {
    /*
     * 让上一轮未完成的异步补读作废。
     *
     * 翻月很快时，旧月份那批读仍在飞；等它读完回来 render()，
     * 会把界面重绘成**旧月份**的内容（用的是新的 this.year/month 吗？
     * 不 —— render 读的是当前 year/month，但旧批次写入的缓存属于旧月，
     * 更糟的是两次 render 交叠会让圆点数反复跳动）。
     * 每次 render 递增 token，异步回调里比对即可安全放弃过期批次。
     */
    this.renderToken = (this.renderToken || 0) + 1;

    const c = this.contentEl;
    c.empty();
    c.addClass('tt-cal-view');
    /*
     * 两种排布：
     *   自适应（默认）：6 行均分可用高度，面板拉高填满
     *   固定尺寸：格子高度固定，排布紧凑 —— 为后续月历视图保留
     */
    if (this.plugin.settings.calendar.fixedCellSize === true) {
      c.addClass('is-fixed');
    } else {
      c.addClass('is-fluid');
    }

    const notes = require('./note.js');

    /* ---- 顶部：‹ 标题 今天 › + 关闭 ---- */
    const head = c.createDiv({ cls: 'tt-cal-head' });
    const prev = head.createEl('button', { cls: 'tt-cal-nav', text: '‹' });
    const titleWrap = head.createDiv({ cls: 'tt-cal-title-wrap' });

    /*
     * 顺序：月份在前，年份在后（图1/图2 的样式）。
     * 之前是年份在前，与用户期望相反。
     */
    const mBtn = titleWrap.createEl('span', {
      cls: 'tt-cal-month tt-cal-clickable',
      /*
       * 月份名查表，不用占位符：英文月份是独立单词（September），
       * 不是「数字 + 月」能拼出来的 —— 早先共用一个 key + {0}，
       * 英文下只剩数字 "9"，月份名整个丢了。
       */
      text: MONTH_NAMES[calLang(((this.plugin && this.plugin.settings
        && this.plugin.settings.calendar) || {}).lang)][this.month],
      title: '点击生成/打开月记',
    });
    mBtn.onclick = () => {
      this.picked = new Date(this.year, this.month, 1);
      this.selKind = 'month';
      this.render();
      this.spawn('monthly');
    };

    const yBtn = titleWrap.createEl('span', {
      cls: 'tt-cal-year tt-cal-clickable',
      text: String(this.year),
      title: i18nT('k98723583', '点击生成/打开年记'),
    });
    yBtn.onclick = () => {
      this.picked = new Date(this.year, 0, 1);
      this.selKind = 'year';
      this.render();
      this.spawn('yearly');
    };
    // 月记 / 年记打开时高亮对应标题；全填充只留给日期格和周数格
    if (this.selKind === 'month' && this.picked
      && this.picked.getFullYear() === this.year && this.picked.getMonth() === this.month) {
      mBtn.addClass('is-picked');
    }
    if (this.selKind === 'year' && this.picked && this.picked.getFullYear() === this.year) {
      yBtn.addClass('is-picked');
    }

    const next = head.createEl('button', { cls: 'tt-cal-nav', text: '›' });
    prev.onclick = () => this.shift(-1);
    next.onclick = () => this.shift(1);

    // 导航保持 ‹ 今天 › 原样
    const todayBtn = head.createEl('button', { cls: 'tt-cal-today', text: i18nT('ka848765c', '今天') });
    todayBtn.onclick = () => {
      const n = new Date();
      this.year = n.getFullYear();
      this.month = n.getMonth();
      this.picked = n;
      this.selKind = 'day';
      this.render();
    };

    /* ---- 表头：周数列 + 星期名 ---- */
    const grid = c.createDiv({ cls: 'tt-cal-grid' });
    /*
     * 表头沿用原先的简写设计（周 / 日 一 二 … 六）。
     * 曾改成「周日/周一」全称想对齐 Calendar，但用户更喜欢原先的，已回退。
     */
    const wdNames = WEEKDAY_NAMES[calLang(((this.plugin && this.plugin.settings
      && this.plugin.settings.calendar) || {}).lang)];
    grid.createDiv({ cls: 'tt-cal-cell tt-cal-wk-head', text: i18nT('ked517b57', '周') });
    for (let i = 0; i < 7; i++) {
      grid.createDiv({ cls: 'tt-cal-cell tt-cal-wd-head', text: wdNames[(this.firstDow + i) % 7] });
    }

    /* ---- 日期格：含上下月的灰字，凑足整行 ---- */
    const first = new Date(this.year, this.month, 1);
    const startOffset = (first.getDay() - this.firstDow + 7) % 7;
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const prevDays = new Date(this.year, this.month, 0).getDate();
    const today = new Date();
    /*
     * 固定 6 行 × 7 列。
     * 之前按当月天数算行数（Math.ceil），有的月 5 行有的 6 行，
     * 切月时高度会跳，看起来不稳。现在恒定 6 行，不足的用上下月灰字填满。
     */
    const total = GRID_ROWS * 7;

    for (let i = 0; i < total; i++) {
      /*
       * 周数格：按格位直接算日期，而不是「属于本月才显示」。
       *
       * 旧写法用「该格是否属于本月」当判据，9月1日是周二而首列是周日时，
       * 首行前两格是上月尾 → 判据不成立 → 周数格留空。
       * 周数表示的是「这一整行所属的周」，与这些日期属不属于当月无关。
       */
      if (i % 7 === 0) {
        const wkCell = grid.createDiv({ cls: 'tt-cal-cell tt-cal-wk tt-cal-clickable' });
        const d = new Date(this.year, this.month, 1 - startOffset + i);
        wkCell.setText(String(weekNumberOf(d, this.firstDow)));
        wkCell.title = i18nT('kf40f709b', '点击生成/打开周记');
        wkCell.onclick = () => {
          this.picked = d;
          this.selKind = 'week';
          this.render();
          this.spawn('weekly');
        };
        /*
         * 打开周记时高亮周数格 —— 旧实现只给日期格加 is-picked，
         * 周数列永远不亮，于是「点了周记却看不出是哪一行」。
         */
        if (this.selKind === 'week' && this.picked && weekContains(this.picked, d)) {
          wkCell.addClass('is-picked');
        }

        /*
         * 周数列也画圆点：读的是「周记本身」的字数，不是 7 天日记之和。
         *
         * 曾用过「该周 7 天日记求和」，但分子是 7 天总量、分母却是单天标准
         * （每点 250 字），数值天然放大约 7 倍 —— 只要那周写过几天日记，
         * 周列就恒顶到 10 点上限，完全失去区分度。
         * 改成读周记本身，与「周记写了多少」的语义一致。
         */
        if (this.plugin.settings.calendar.dotsEnabled !== false
          && this.plugin.settings.calendar.lunarOnCalendar !== true) {
          const wf = this.weeklyFileOf(d);
          const weekWords = wf ? notes.cachedWordCount(wf) : 0;
          this.drawDots(wkCell, this.dotPattern(weekWords, !!wf));
          if (wf && !notes.hasWordCount(wf) && !this.pendingRead) this.readWordsAsync();
        }
      }

      const dayNo = i - startOffset + 1;
      let d;
      let outSide = false;
      if (dayNo < 1) {
        // 上月尾
        d = new Date(this.year, this.month - 1, prevDays + dayNo);
        outSide = true;
      } else if (dayNo > daysInMonth) {
        // 下月头
        d = new Date(this.year, this.month + 1, dayNo - daysInMonth);
        outSide = true;
      } else {
        d = new Date(this.year, this.month, dayNo);
      }

      const cell = grid.createDiv({ cls: 'tt-cal-cell tt-cal-day' });
      cell.setText(String(d.getDate()));
      if (outSide) cell.addClass('is-outside');
      if (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate()) cell.addClass('is-today');
      /*
       * 全填充只给「打开的日记」那一天。
       * 打开周记时整行改用 is-week-row 弱高亮：若周记也让某个日期格全填充，
       * 会和「日记」的语义撞车，看起来就像高亮在乱蹦。
       */
      if (this.selKind === 'day' && this.picked && sameDay(this.picked, d)) {
        cell.addClass('is-picked');
      } else if (this.selKind === 'week' && this.picked && weekContains(this.picked, d)) {
        cell.addClass('is-week-row');
      }
      /*
       * 圆点数量 = 当天日记字数 / 每点代表字数（对齐 Calendar 的 Words per dot）。
       * 只有「存在日记」和「字数>0」两种情况下才画：
       *   有笔记但字数为 0 → 至少画 1 点，否则用户看不出这天有笔记。
       */
      const file = notes.getDailyFile(this.app, this.plugin.settings, d);
      /*
       * 农历模式取代圆点（互斥，不是叠加）：
       * 格子下方就那么大，农历文字 + 多个圆点会挤成一团。
       * 且农历模式不需要读字数 —— 省掉整轮异步 IO，翻月更快。
       */
      if (this.plugin.settings.calendar.lunarOnCalendar === true) {
        this.drawLunar(cell, d, !!file);
      } else if (file) {
        cell.addClass('has-note');
        // 圆点开关关闭时不做任何字数读取，省掉一整轮异步 IO
        if (this.plugin.settings.calendar.dotsEnabled !== false) {
          const cnt = notes.cachedWordCount(file);
          if (cnt > 0) cell.addClass('has-words');
          // 实心 = 已写满的整点，空心 = 正在写的那一点
          this.drawDots(cell, this.dotPattern(cnt, true));
          // 未缓存的异步补读，读到后重绘（首帧先占位）
          if (!notes.hasWordCount(file) && !this.pendingRead) this.readWordsAsync();
        }
      }
      cell.onclick = () => {
        this.picked = d;
        this.selKind = 'day';
        // 点非本月的灰字时顺带切过去，避免点了没反应
        if (outSide) { this.year = d.getFullYear(); this.month = d.getMonth(); }
        this.render();
        this.spawn('daily');
      };
    }

    this.applyNarrowClass();
  }

  /**
   * 圆点构成：实心 = 已写满的整点，空心 = 正在写的那一点。
   *
   * 例（每点 250）：
   *   500 → 2 实心 0 空心（●●）
   *   600 → 2 实心 1 空心（●●○）
   *   750 → 3 实心 0 空心（●●●）
   *
   * 每点代表字数 <=0 或未配置时退化为「有笔记 = 1 个实心」，
   * 保持旧行为，不因为新功能没配就让界面看不出哪些天有笔记。
   *
   * @returns {{solid:number, hollow:number}}
   */
  dotPattern(words, exists) {
    const per = Number(this.plugin.settings.calendar.wordsPerDot);
    if (!per || per <= 0) return exists ? { solid: 1, hollow: 0 } : { solid: 0, hollow: 0 };
    if (!exists) return { solid: 0, hollow: 0 };
    const w = Number(words) || 0;
    let solid = Math.floor(w / per);
    let hollow = (w % per) > 0 ? 1 : 0;
    /*
     * 有笔记但一个整点都没写满（含 0 字）→ 至少给 1 个空心。
     * 否则「建了日记还没写」的日子完全没标记，看不出这一天有笔记。
     */
    if (solid === 0 && hollow === 0) hollow = 1;
    // 上限 10（横排 5 个一行，两行），既看得出差异也不撑爆格子
    const cap = (n, m) => Math.min(Math.max(n, 0), m);
    const total = cap(solid + hollow, DOTS_MAX);
    const s2 = cap(solid, total);
    return { solid: s2, hollow: Math.min(total - s2, hollow) };
  }

  /**
   * 画农历（取代圆点）。
   *
   * 初一显示**月名**而不是「初一」—— 月名能一眼看出「这个月从这天开始」，
   * 而「初一」每个月都一样，信息量更小。
   * 其余显示农历日（十九、廿三…）。
   *
   * 有笔记时给农历文字加 has-note（渲染成旁边一个小点），
   * 取代原来按字数画多个圆点的做法：农历模式要的就是「哪天有笔记」，
   * 不是「写了多少字」。
   *
   * 农历转换失败（超出表范围）时什么都不画，不留半截空元素。
   */
  drawLunar(cell, d, hasNote) {
    const ts = require('./timestamp.js');
    const info = ts.lunar.solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (!info) return;
    const text = info.day === 1
      ? ts.lunar.cnMonth(info.month, info.isLeap)
      : ts.lunar.cnDay(info.day);
    const wrap = cell.createDiv({ cls: 'tt-cal-lunar' });
    wrap.setText(text);
    wrap.title = ts.lunar.formatLunar(info);
    if (hasNote) wrap.addClass('has-note');
  }

  /** 画圆点：先实心后空心 */
  drawDots(host, pattern) {
    const wrap = host.createDiv({ cls: 'tt-cal-dots' });
    for (let k = 0; k < pattern.solid; k++) {
      wrap.createDiv({ cls: 'tt-cal-dot is-solid' });
    }
    for (let k = 0; k < pattern.hollow; k++) {
      wrap.createDiv({ cls: 'tt-cal-dot is-hollow' });
    }
  }

  /**
   * 该行对应那一周的「周记文件」（不存在返回 null）
   *
   * 用行内任意一天去定位都行 —— 同一行的 ISO 周数相同。
   */
  weeklyFileOf(d) {
    const notes = require('./note.js');
    return notes.getNoteFile(this.app, this.plugin.settings, 'weekly', d);
  }

  /** 异步补读本月各天字数，读完重绘一次（只读当前月的 42 格） */
  async readWordsAsync() {
    if (this.pendingRead) return;
    this.pendingRead = true;
    const notes = require('./note.js');
    try {
      const days = [];
      const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(this.year, this.month, i));
      const files = days
        .map((d) => notes.getDailyFile(this.app, this.plugin.settings, d))
        .filter(Boolean);
      /*
       * 周记也要补读：周列的圆点读的是周记本身。
       * 取本月 6 行各自的第一天，即可覆盖本月涉及的所有周。
       */
      const startOffset = startOffsetOf(this.year, this.month, this.firstDow);
      for (let r = 0; r < GRID_ROWS; r++) {
        const d = new Date(this.year, this.month, 1 - startOffset + r * 7);
        const wf = notes.getNoteFile(this.app, this.plugin.settings, 'weekly', d);
        if (wf) files.push(wf);
      }
      // 只补读尚未缓存的
      // 用「是否统计过」而非「字数是否为 0」，否则空笔记会被无限补读
      const todo = files.filter((f) => !notes.hasWordCount(f));
      if (todo.length === 0) return;

        /*
         * 并发读但分批：串行 await 一个月 30 篇就是 30 次来回，翻月肉眼可见地卡；
         * 无脑 Promise.all 又会一次开几百个句柄打满 IO。分批是折中。
         */
      const token = ++this.renderToken;
      const BATCH = 8;
      for (let i = 0; i < todo.length; i += BATCH) {
        // 翻月后置 token 作废：旧月份的读不该再触发重绘覆盖新月份
        if (token !== this.renderToken) return;
        const slice = todo.slice(i, i + BATCH);
        const results = await Promise.all(
          slice.map((f) =>
            this.app.vault.cachedRead(f).then(
              (txt) => [f, notes.countWords(txt)],
              () => [f, null] // 单篇失败不影响其他
            )
          )
        );
        results.forEach(([f, n]) => { if (n !== null) notes.setWordCount(f, n); });
      }
      if (token !== this.renderToken) return;
      this.render();
    } catch (e) {
      console.warn('[Time Tools] 字数统计失败', e);
    } finally {
      this.pendingRead = false;
    }
  }

  shift(delta) {
    this.month += delta;
    if (this.month < 0) { this.month = 11; this.year--; }
    if (this.month > 11) { this.month = 0; this.year++; }
    // 翻月不清空 picked：跟随打开的笔记，翻回来还能看见高亮
    this.render();
  }

  /** 生成笔记；picked 用于日/周，年/月取当前视图年月 */
  async spawn(kind) {
    const notes = require('./note.js');
    let d;
    if (this.picked && (kind === 'daily' || kind === 'weekly')) {
      d = this.picked;
    } else if (kind === 'yearly') {
      d = new Date(this.year, 0, 1);
    } else if (kind === 'monthly') {
      d = new Date(this.year, this.month, 1);
    } else {
      d = new Date(this.year, this.month, 1);
    }
    // 不清空 picked：生成完仍高亮这天，与随后 file-open 同步的结果一致
    const r = await notes.openOrCreateNote(this.plugin, kind, d);
    new obsidian.Notice(r.msg);
    if (!r.ok) console.warn('[Time Tools] 笔记生成失败：' + r.msg);
    this.render();
  }
}

/**
 * 当月 1 号落在第几列（0 起），用于按格位反推日期。
 *
 * 必须用视图的 firstDow（用户设置的周起始），不能用 locale 的 ——
 * 网格排布用的是 firstDow，两者不一致会让反推出的日期错位一整周。
 */
/**
 * 数值型设置变更后刷新已打开的日历视图。
 *
 * 只重画视图、不重建设置页 —— 设置页一旦重建，正在编辑的输入框就会失焦，
 * 表现就是「每敲一个字符就失焦，必须先删一个才能再填一个」。
 */
function refreshCalendarViews(plugin) {
  try {
    /*
     * 只淘汰失效条目，不再全清。
     * 缓存 key 是「路径@mtime」，mtime 一变旧条目自然命中不到 —— 全清会把
     * 仍然有效的四十几个格子的统计一起丢掉，翻一次页就要重新读盘。
     */
    const nm = require('./note.js');
    if (typeof nm.pruneWordCache === 'function') nm.pruneWordCache(plugin.app);
    else nm.clearWordCache();
  } catch (e) { /* 清缓存失败不影响刷新 */ }
  try {
    const leaves = plugin.app.workspace.getLeavesOfType(CAL_VIEW_TYPE) || [];
    for (const leaf of leaves) {
      if (leaf.view && typeof leaf.view.render === 'function') leaf.view.render();
    }
  } catch (e) { /* 视图未打开时静默 */ }
}

function startOffsetOf(year, month, firstDow) {
  const first = new Date(year, month, 1);
  const dow = Number.isInteger(firstDow) ? firstDow : resolveLocaleDow();
  return (first.getDay() - dow + 7) % 7;
}

/** 判断两个 Date 是否为同一天 */
/* sameDay 已迁到 timejudge.js */

/**
 * d 是否落在以 weekStart 为首日的那一周（7 天）内。
 * 先把两端归一到当天午夜再比，避免时刻差异导致的边界误判。
 */
function weekContains(weekStart, d) {
  if (!weekStart || !d) return false;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const diff = Math.round((a - b) / 86400000);
  return diff >= 0 && diff <= 6;
}

/**
 * 从笔记文件名里解析出日期，用于把高亮同步到当前打开的笔记。
 *
 * 四种笔记都认：
 *   日记 2026-09-22-周二 / 2026-09-22  → 当天
 *   周记 2026-W38                      → 该周首日（ISO，与 gggg-[W]ww 一致）
 *   月记 2026-09月记                   → 该月 1 日
 *   年记 2026年记                      → 该年 1 月 1 日
 *
 * 分隔符用 \D{0,2} 放宽，这样「-周二」这类后缀也能吃下。
 * 解析不出返回 null —— 调用方据此清空高亮，绝不猜一个日期。
 *
 * @param {string} name 文件名（不含扩展名）
 * @param {number} [dow] 周起始日，用于反推周记的周首日；省略时按 ISO（周一）
 */
function escapeForRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 把 moment 格式串转成匹配文件名的正则。
 *
 * token 换成捕获组，字面量原样转义；末尾允许一段「分隔符开头的后缀」，
 * 这样「2026-09-22-周二」这类带星期后缀的老日记也能认。
 *
 * @param {string} fmt 如 'YYYY-MM-DD' / 'gggg-[W]ww' / 'YYYY年记'
 * @returns {RegExp|null} 构造失败返回 null
 */
/**
 * 格式串里是否含字面量（分隔符或文字）。
 *
 * 用来决定能否放宽匹配：纯 token 的格式（如年记 YYYY）若允许后缀，
 * 「2026 年度总结」这类普通笔记也会被认成年记 —— 这正是早期高亮乱跳的根因。
 * 含字面量的格式（YYYY年记、gggg-[W]ww）本身已有强特征，放宽无害。
 */
function formatHasLiteral(rawFmt) {
  const fmt = String(rawFmt || '').split('/').pop();
  const toks = ['gggg', 'YYYY', 'MMMM', 'dddd', 'MMM', 'ddd', 'gg', 'YY', 'Do',
    'MM', 'DD', 'dd', 'ww', 'WW', 'M', 'D', 'w', 'W'];
  for (let i = 0; i < fmt.length;) {
    if (fmt[i] === '[') {
      const end = fmt.indexOf(']', i);
      if (end < 0) return true;
      i = end + 1;
      continue;
    }
    let hit = 0;
    for (let k = 0; k < toks.length; k++) {
      if (fmt.startsWith(toks[k], i)) { hit = toks[k].length; break; }
    }
    if (hit) { i += hit; continue; }
    return true;
  }
  return false;
}

  /*
   * 格式串 → 正则的缓存。全库扫描会对每个文件调 parseNoteRef，
   * 每次都要为 4 类笔记 × 每种格式编译正则（实测 5000 文件 27ms，主要在编译）。
   * 格式串来自设置、很少变，命中率极高。上限 200，超了清空（只影响速度不影响正确性）。
   */
const FORMAT_RX_CACHE = new Map();
const FORMAT_RX_MAX = 200;

function formatToRegex(rawFmt, allowSuffix) {
  if (!rawFmt) return null;
  const cacheKey = String(rawFmt) + '\u0000' + (allowSuffix ? '1' : '0');
  const cached = FORMAT_RX_CACHE.get(cacheKey);
  // 编译失败也会存 null，所以判 undefined 而不是判空
  if (cached !== undefined) return cached;
  const built = buildFormatRegex(rawFmt, allowSuffix);
  if (FORMAT_RX_CACHE.size >= FORMAT_RX_MAX) FORMAT_RX_CACHE.clear();
  FORMAT_RX_CACHE.set(cacheKey, built);
  return built;
}

function buildFormatRegex(rawFmt, allowSuffix) {
  if (!rawFmt) return null;
  /*
   * 先剥掉文件夹部分。
   * Calendar 的周记格式就写成 gggg/gggg-[W]WW（文件夹+文件名一体），
   * 用户照抄过来时，带 / 的串去匹配 basename 永远不成立。
   */
  const fmt = String(rawFmt).split('/').pop();
  if (!fmt) return null;

  /*
   * 按长度降序匹配，保证 MMMM 不会先被 MM 吃掉。
   * 只收能反推日期的 token；时分秒这类不参与定位，按字面量放行。
   */
  /*
   * 第三项是 token 语义：y=年 / M=月 / D=日 / w=周，null=不产生捕获组。
   * 顺序按「格式串里出现的先后」记录，供 refFromMatch 按名取值 ——
   * 否则 MM-DD-YYYY 会被当成「9 年 14 月」判空（v2.73 修）。
   */
  const TOKENS = [
    ['gggg', '(\\d{4})', 'y'], ['YYYY', '(\\d{4})', 'y'],
    ['MMMM', '(?:\\S+)', null], ['dddd', '(?:周[一二三四五六日]|\\S+)', null],
    ['MMM', '(?:\\S+)', null], ['ddd', '(?:周[一二三四五六日]|\\S+)', null],
    ['gg', '(\\d{2})', 'y'], ['YY', '(\\d{2})', 'y'],
    ['Do', '(\\d{1,2})(?:st|nd|rd|th)?', 'D'],
    ['MM', '(\\d{1,2})', 'M'], ['DD', '(\\d{1,2})', 'D'], ['dd', '(\\d{1,2})', 'D'],
    ['ww', '(\\d{1,2})', 'w'], ['WW', 'W?(\\d{1,2})', 'w'],
    ['M', '(\\d{1,2})', 'M'], ['D', '(\\d{1,2})', 'D'], ['w', '(\\d{1,2})', 'w'], ['W', 'W?', null],
  ];
  let re = '';
  /** 与捕获组一一对应的 token 语义序列 */
  const order = [];
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === '[') {
      const end = fmt.indexOf(']', i);
      if (end < 0) { re += escapeForRegex(fmt.slice(i)); break; }
      re += escapeForRegex(fmt.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    let hit = null;
    for (let k = 0; k < TOKENS.length; k++) {
      if (fmt.startsWith(TOKENS[k][0], i)) { hit = TOKENS[k]; break; }
    }
    if (hit) {
      re += hit[1];
      if (hit[2]) order.push(hit[2]);
      i += hit[0].length;
    } else {
      re += escapeForRegex(fmt[i]);
      i++;
    }
  }
  /*
   * 末位允许一段「分隔符开头的后缀」，这样 2026-09-22-周二 这类
   * 带星期后缀的历史日记也能认；同时不允许再紧跟数字，
   * 避免 2026-09 去吃掉 2026-09-22 的前半段。
   * 后缀只允许「分隔符开头」：早期还放行中文，结果 YYYY年 这类格式
   * 会把「2026年度总结」也认成年记 —— 高亮乱跳就是从这儿来的。
   * 宁可认不出，不可认错。
   */
  const tail = allowSuffix ? '([-_\\s].*)?' : '';
  try {
    const rx = new RegExp('^' + re + tail + '$');
    /*
     * 把「第几个捕获组是年/月/日」挂在正则上带出去。
     * 捕获组顺序取决于用户格式串里 token 的先后，调用方不能写死按位置取。
     */
    rx.__order = order;
    return rx;
  } catch (e) { return null; }
}

/**
 * 从笔记文件名里解析出日期，用于把高亮同步到当前打开的笔记。
 *
 * 先按 settings 里配置的各笔记文件名格式精确匹配；匹配不上才回退到
 * 「年-月-日」「年-W周」这两种强特征。
 *
 * 旧实现靠「名字里含月/年字」认月记 / 年记，于是「2026 年度总结」
 * 这类普通笔记也被解析成 1 月 1 日 —— 切过去高亮就乱跳。
 * 格式串是用户自己定的，用它反推才不会误伤。
 *
 * @param {string} name 文件名（不含扩展名）
 * @param {number} [dow] 周起始日，用于反推周记的周首日
 * @param {object} [notes] settings.notes，提供各笔记的文件名格式
 * @returns {{kind: string, date: Date}|null} 认不出返回 null —— 调用方据此清空高亮，绝不猜
 */
/**
 * 把正则捕获组解释成 {kind, date}。
 *
 * gg / YY 这类两位年份按 2000+yy（>69 记 1900+yy）归一，
 * 与 moment 的行为一致；组数对不上或越界一律返回 null，绝不猜。
 *
 * @returns {{kind: string, date: Date}|null}
 */
function refFromMatch(kind, m, dow, tail, order) {
  /*
   * 守卫：粗粒度格式（周/月/年）若吃下一个「分隔符+数字」的后缀，
   * 说明它其实是个更细的日期被截断了。
   * 例：日记 2026-09-22 会被周记异名 gggg-Www 匹配成「2026 年第 9 周」。
   * 宁可判不出来，也不能把日记当成周记高亮。
   */
  if (kind !== 'daily' && tail && /^[-_\s]\d/.test(tail)) return null;
  const g = m.slice(1).map((x) => parseInt(x, 10));
  const norm = (y) => (y < 100 ? (y <= 69 ? 2000 + y : 1900 + y) : y);
  const ok = (y) => y >= 1970 && y <= 2200;

  /*
   * 按 token 语义取值，而不是按捕获组的下标。
   * 捕获组顺序 = 格式串里 token 的先后顺序，由 formatToRegex 通过 order 带出。
   * 写死「第 1 组是年、第 2 组是月」时，MM-DD-YYYY 会被读成 9 年 14 月而判空，
   * 于是月日在前的格式（欧美习惯）整类失效。
   */
  let y, mo, da, w;
  if (order && order.length) {
    const pick = (k) => {
      for (let i = 0; i < order.length; i++) {
        if (order[i] === k && g[i] != null && !isNaN(g[i])) return g[i];
      }
      return NaN;
    };
    y = pick('y');
    mo = pick('M');
    da = pick('D');
    w = pick('w');
  } else {
    // 没有 order 时退回旧的顺序约定（年、月/周、日）
    y = g[0]; mo = g[1]; da = g[2]; w = g[1];
  }

  if (kind === 'weekly') {
    if (ok(norm(y)) && w >= 1 && w <= 53) {
      const d = weekStartOf(norm(y), w, dow);
      if (d && isFinite(d.getTime())) return { kind: 'week', date: d };
    }
    return null;
  }
  if (kind === 'daily') {
    const yy = norm(y);
    if (!ok(yy) || !(mo >= 1 && mo <= 12) || !(da >= 1 && da <= 31)) return null;
    const d = new Date(yy, mo - 1, da);
    // 排除 2026-02-30 这类会被 Date 静默进位的无效日期
    if (!isFinite(d.getTime()) || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
    return { kind: 'day', date: d };
  }
  if (kind === 'monthly') {
    if (!ok(norm(y)) || !(mo >= 1 && mo <= 12)) return null;
    return { kind: 'month', date: new Date(norm(y), mo - 1, 1) };
  }
  return ok(norm(y)) ? { kind: 'year', date: new Date(norm(y), 0, 1) } : null;
}

function parseNoteRef(name, dow, notes, settings) {
  if (!name) return null;
  let s = String(name);
  /*
   * 用户自定义规则（可选，默认关）。放在所有格式匹配之前统一套一层，
   * 而不是在 4 个调用点各写一遍 —— 分散写必漏。
   */
  if (settings) {
    const ts = require('./timestamp.js');
    const applied = ts.applyUserRulesToName(s, settings);
    if (applied.hide) return null;
    s = applied.name;
    if (!s) return null;
  }
  const cfg = notes || {};

  /*
   * 遍历「配置格式 → 用户额外格式 → 内置常见格式」整份清单。
   * 原来只认 cfg.format 一条，换个命名风格高亮就失效；
   * 这里与「打开已有笔记」共用同一份清单（note.js 的 highlightFormats），
   * 两条路径不再各算各的。
   *
   * 顺序：日记 → 月记 → 周记 → 年记，细粒度先行。
   * 反过来（周记优先）时，周记异名 gggg-Www 会把月记 2026-09
   * 当成「2026 年第 9 周」，也会把日记 2026-09-22 截断成第 9 周。
   */
  const kinds = ['daily', 'monthly', 'weekly', 'yearly'];
  // note.js 里 highlightFormats 收的是完整 settings，这里补一层 .notes
  const noteMod = require('./note.js');
  const listOf = (kind) => noteMod.highlightFormats({ notes: cfg }, kind);
  for (let i = 0; i < kinds.length; i++) {
    const kind = kinds[i];
    const list = listOf(kind);
    for (let f = 0; f < list.length; f++) {
      const re = formatToRegex(list[f], formatHasLiteral(list[f]));
      if (!re) continue;
      const m = s.match(re);
      if (!m) continue;
      const hit = refFromMatch(kind, m, dow, m[m.length - 1], re.__order);
      if (hit) return hit;
    }
  }

  // 回退一：周记 2026-W38
  let m = s.match(/(\d{4})\D{0,2}[Ww](\d{1,2})(?!\d)/);
  if (m) {
    const y = parseInt(m[1], 10);
    const w = parseInt(m[2], 10);
    if (y >= 1970 && y <= 2200 && w >= 1 && w <= 53) {
      const d = weekStartOf(y, w, dow);
      if (d && isFinite(d.getTime())) return { kind: 'week', date: d };
    }
  }

  // 回退二：日记 2026-09-22-周二（锚定开头，且末尾不能再跟数字）
  m = s.match(/^(\d{4})\D{0,2}(\d{1,2})\D{0,2}(\d{1,2})(?!\d)/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10);
    const da = parseInt(m[3], 10);
    if (y >= 1970 && y <= 2200 && mo >= 1 && mo <= 12 && da >= 1 && da <= 31) {
      const d = new Date(y, mo - 1, da);
      if (isFinite(d.getTime()) && d.getMonth() === mo - 1 && d.getDate() === da) {
        return { kind: 'day', date: d };
      }
    }
  }

  // 月记 / 年记不再靠「含月/年字」猜 —— 那正是误匹配的来源
  return null;
}

/**
 * parseNoteRef 的日期版，供只需要日期的调用方使用。
 * @returns {Date|null}
 */
function parseDateFromName(name, dow, notes, settings) {
  const ref = parseNoteRef(name, dow, notes, settings);
  return ref ? ref.date : null;
}

/**
 * 周数：跟随网格的 firstDow，用与 moment locale week 相同的 dow/doy 规则。
 *
 * 旧实现恒用 ISO（周一为界），但网格排布用的是 firstDow —— 两套周界不一致。
 * 当 firstDow=0（周日起始）时行首是周日，而 ISO 以周一为界，
 * 周日那格会被归到上一周，整列比 Calendar 少 1；跨年时差距更大
 * （如 2026-01-01 是周四、周日起始的首行是 2025-12-28，
 *   ISO 给 52，Calendar 给 1）。
 * Calendar 侧：其 UI 库 obsidian-calendar-ui 直接同步 locale 的周起始，
 * 周号随「Start week on」变化 —— 即 moment 的 locale week（date.week()）。
 * 官方 README 另有一处写作 "ISO week numbers"，两者并不矛盾：
 * 当周起始为周一时 locale week 与 ISO 完全相同（中文区域默认就是周一），
 * 只有周日起始才会分叉。这里用 moment 同款 dow/doy 规则，
 * 因此无论用户选周几起始，都能与 Calendar 对齐。
 */
/* weekDoyOf / firstWeekOffset / weeksInYear / dayOfYearOf / weekNumberOf
 * 已迁到 timejudge.js，本文件顶部解构引入，此处不再重复定义。 */

/**
 * 第 w 周的周首日，周起始由 dow 决定。
 *
 * 用 weekNumberOf 自洽反查，保证与日历格子里显示的数字同源：
 * 先取 1 月 1 日所在周的周首日，读出它的周号 w0，再平移 (w - w0) 周。
 * 这样无论周起始是周日还是周一，结果与显示都不会错开。
 */
function weekStartOf(y, w, dow) {
  /*
   * 曾用 (dow===0||dow===1) ? dow : 1 —— 周起始设成周二及以后时退化成周一，
   * 与 weekNumberOf（它按传入的 dow 算）不同源，反推出的周首日会偏。
   * 这里直接用 dow，只做合法性兜底。
   */
  const fd = Number.isInteger(dow) && dow >= 0 && dow <= 6 ? dow : 1;
  const jan1 = new Date(y, 0, 1);
  const back = (jan1.getDay() - fd + 7) % 7;
  const base = new Date(y, 0, 1 - back);
  const w0 = weekNumberOf(base, fd);
  const d = new Date(y, 0, 1 - back + (w - w0) * 7);
  return isFinite(d.getTime()) ? d : null;
}

/**
 * 从 start 起算的 7 天里，是否至少有一天落在指定年月。
 *
 * 用来决定「打开周记时要不要切月」：一周跨月很常见（如 9/28 那周含 10/1），
 * 只要这周与当前显示月有交集就留在当前月，高亮画在那一整行上，
 * 而不是按周首日把视图拽到上一个月。
 *
 * @param {Date} start 周首日
 * @param {number} y 年
 * @param {number} m 月（0 起）
 * @returns {boolean}
 */
function weekTouchesMonth(start, y, m) {
  if (!start || !isFinite(start.getTime())) return false;
  for (let k = 0; k < 7; k++) {
    const t = new Date(start.getFullYear(), start.getMonth(), start.getDate() + k);
    if (t.getFullYear() === y && t.getMonth() === m) return true;
  }
  return false;
}

/* ------------------------------------------------------------------ *
 * Calendar 插件增强
 *
 * 在 Calendar 自己的视图上接管年份 / 月份 / 周数点击。
 * 依赖其内部 DOM，故默认关，且它一改版就可能失效 —— 全部包在 try 里。
 * ------------------------------------------------------------------ */
function attachCalendarEnhance(plugin) {
  const handler = async (ev) => {
    const s = plugin.settings.calendar;
    /*
     * 门控：两种增强模式任一开启都要放行。
     * nativeDayWeek 是「半接管」—— 日/周放行给原生，月/年由本插件生成；
     * 它不再依赖 enhanceCalendarEnabled（两者已改为互斥，见 setEnhanceMode）。
     */
    if (!s || (s.enhanceCalendarEnabled !== true && s.nativeDayWeek !== true)) return;
    /*
     * 运行时兜底：互斥不能只靠设置页那一次联动。
     * 万一两个标志同时为 true（老配置、手工改 data.json 等），
     * 增强一律让位，避免两套逻辑同时接管 Calendar 的点击。
     */
    if (s.allowBoth !== true && s.ownCalendarEnabled === true) return;
    const t = ev.target;
    if (!t || !t.closest) return;
    // 只在 Calendar 的视图容器内生效
    const box = t.closest('#calendar-container');
    if (!box) return;

    const notes = require('./note.js');
    try {
      /*
       * 关键修正：之前只判 ev.target 自身的 className。
       * Calendar 是 Svelte 渲染的，年月标题里常是嵌套元素，
       * 点到的是没有 class 的内层节点 → 匹配不上 → 点年月没反应。
       * 改成向上找祖先，才抓得住。
       */
      /*
       * 顺序：日期 → 周数 → 年 → 月。
       * 日期/周数是最具体的叶子节点，必须先判：
       * Calendar 是 Svelte 渲染的，标题容器有可能把整个网格包在里面，
       * 若先判 .year/.month，点日期会被当成点标题。
       * 反过来再用 isTitleEl 确认标题元素里没有日期格，双保险。
       */
      /*
       * 分流开关：日 / 周交回 Calendar 原生。
       * 这里直接 return，不 preventDefault 也不 stopPropagation ——
       * 让事件照常往下走，Calendar 自己的处理才能跑起来。
       */
      const nativeDW = s.nativeDayWeek === true;

      const dayEl = t.closest('.day');
      if (dayEl) {
        if (nativeDW) return;
        const d = dateOfCalendarDay(box, dayEl, plugin);
        /*
         * 取不到日期就 return，让事件照常往下走 —— 交回 Calendar 自己处理。
         * 绝不猜一个日期去建笔记：建错比不建糟得多。
         */
        if (!d) return;
        ev.preventDefault();
        ev.stopPropagation();
        const r = await notes.openOrCreateNote(plugin, 'daily', d);
        new obsidian.Notice(r.msg);
        if (!r.ok) console.warn('[Time Tools] 日记生成失败：' + r.msg);
        return;
      }

      const weekEl = t.closest(WEEK_NUM_SELECTOR);
      if (weekEl) {
        if (nativeDW) return;
        /*
         * 曾经这里写死 new Date()（今天）—— 点第 36 周会去建「今天所在那一周」的
         * 周记，等于点哪周都一样。改成按被点的那一周推算。
         */
        const d = dateOfCalendarWeek(box, weekEl, plugin);
        if (!d) return;
        ev.preventDefault();
        ev.stopPropagation();
        const r = await notes.openOrCreateNote(plugin, 'weekly', d);
        new obsidian.Notice(r.msg);
        if (!r.ok) console.warn('[Time Tools] 周记生成失败：' + r.msg);
        return;
      }

      const yearEl = t.closest('.year');
      const monthEl = t.closest('.month');

      if (yearEl && isTitleEl(yearEl)) {
        const y = parseInt((yearEl.textContent || '').match(/\d{4}/)?.[0] || '', 10);
        if (!y) return;
        const r = await notes.openOrCreateNote(plugin, 'yearly', new Date(y, 0, 1));
        new obsidian.Notice(r.msg);
        return;
      }
      if (monthEl && isTitleEl(monthEl)) {
        const m = parseMonthText(monthEl.textContent || '');
        if (!m) return;
        /*
         * 年份必须取 Calendar 当前显示的年份：
         * 用 new Date().getFullYear() 在翻到别的年份时会写错年份。
         */
        const y = findYearIn(box) || new Date().getFullYear();
        const r = await notes.openOrCreateNote(plugin, 'monthly', new Date(y, m - 1, 1));
        new obsidian.Notice(r.msg);
        return;
      }
    } catch (e) {
      console.warn('[Time Tools] Calendar 增强处理失败', e);
    }

    /*
     * 失效自检：Calendar 是第三方插件，它的 DOM（.day / .week-num / .year / .month）
     * 随时可能随版本改版。选择器一旦失效，用户只会感到「点了没反应」，
     * 没有任何提示，只能靠猜。
     *
     * 判定：点在 calendar-container 内，却一个目标都没命中，
     * 且容器里压根不存在 .day —— 说明不是「点在了空白处」，而是选择器整体失效。
     * 只在真正失效时提示一次（用标志位节流，否则每次点击都弹，烦死人）。
     */
    if (!enhanceWarned && box.querySelectorAll('.day').length === 0) {
      enhanceWarned = true;
      new obsidian.Notice(
        'Time Tools：未能识别 Calendar 的日期格（.day），' +
        '可能是 Calendar 改版。请关闭「在 Calendar 视图上接管点击」，' +
        '或改用 time tools 日历。'
      );
      console.warn('[Time Tools] Calendar 增强选择器失效：容器内未找到 .day');
    }

    /*
     * 周列单独自检：上面那条只判 .day。Calendar 改版时可能出现
     * 「.day 还在、周列 class 全变了」—— 此时点周数静默失效，用户只能靠猜。
     * 用独立标志位：复用 enhanceWarned 的话，第一条弹过后这条永不弹。
     */
    try {
      if (!enhanceWeekWarned && box.querySelectorAll(WEEK_NUM_SELECTOR).length === 0) {
        enhanceWeekWarned = true;
        new obsidian.Notice(
          'Time Tools：未能识别 Calendar 的周列，周数点击可能失效。' +
          '若你只用日期格可忽略；需要周数跳转请改用 time tools 日历。'
        );
        console.warn('[Time Tools] Calendar 增强周列选择器失效：容器内未找到 ' + WEEK_NUM_SELECTOR);
      }
    } catch (e) {
      console.warn('[Time Tools] Calendar 周列自检失败', e);
    }
  };
  document.addEventListener('click', handler, true);
  // 卸载时移除，避免残留；标志位一起复位（否则重装后不再提示）
  plugin.register(() => {
    document.removeEventListener('click', handler, true);
    enhanceWarned = false;
    enhanceWeekWarned = false;
  });
}

/** 增强失效提示是否已弹过（只提示一次，避免反复打扰） */
let enhanceWarned = false;

/** 周列失效提示是否已弹过（与上面独立，两个失效要各提示一次） */
let enhanceWeekWarned = false;

/** 从「9月」「September」「Sep」里解出月份 */
function parseMonthText(text) {
  const t = String(text || '').trim();
  const num = t.match(/(\d{1,2})\s*月/);
  if (num) {
    const m = parseInt(num[1], 10);
    return m >= 1 && m <= 12 ? m : 0;
  }
  const bare = t.match(/^\s*(\d{1,2})\s*$/);
  if (bare) {
    const m = parseInt(bare[1], 10);
    return m >= 1 && m <= 12 ? m : 0;
  }
  const EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'];
  const idx = EN.indexOf(t.toLowerCase());
  if (idx >= 0) return idx + 1;
  const ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const ai = ABBR.indexOf(t.toLowerCase().slice(0, 3));
  if (ai >= 0) return ai + 1;
  return 0;
}

/** 在 Calendar 容器里找当前显示的年份 */
function findYearIn(box) {
  try {
    const y = box.querySelector ? box.querySelector('.year') : null;
    if (y) {
      const n = parseInt((y.textContent || '').match(/\d{4}/)?.[0] || '', 10);
      if (n) return n;
    }
  } catch (e) { /* 找不到就用当前年兜底 */ }
  return 0;
}

/**
 * 标题元素判定：真正的年/月标题里不会有日期格。
 * Calendar 用 Svelte，标题容器有可能把整个网格包进去，
 * 不加这道判断的话点日期会被当成点标题，生成年记/月记。
 */
function isTitleEl(el) {
  try {
    return !el.querySelector('.day');
  } catch (e) {
    return true;
  }
}

/** 从「9月」「September」里解出月份（在 Calendar 容器内找当前显示的月份） */
function findMonthIn(box) {
  try {
    const m = box.querySelector ? box.querySelector('.month') : null;
    if (m) {
      const n = parseMonthText(m.textContent || '');
      if (n) return n;
    }
  } catch (e) { /* 找不到就返回 0 */ }
  return 0;
}

/** 从 "2026-09-08" / "2026年9月8日" 这类文本里解出日期 */
function parseDateText(raw) {
  const m = String(raw || '').match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!m) return null;
  const y = +m[1];
  const mo = +m[2];
  const da = +m[3];
  const d = new Date(y, mo - 1, da);
  // 拒绝 2026-02-31 这种会被 Date 悄悄进位的无效日期
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return d;
}

/**
 * 优先从元素自带的日期信息取（aria-label / data-date / title），最可靠。
 * 日期可能标在外层容器上，故向上找几层。
 */
function dateFromDayAttrs(el) {
  let node = el;
  for (let i = 0; i < 3 && node && node.getAttribute; i++) {
    const raw = node.getAttribute('aria-label')
      || node.getAttribute('data-date')
      || node.getAttribute('title')
      || '';
    const d = parseDateText(raw);
    if (d) return d;
    node = node.parentElement;
  }
  return null;
}

/**
 * 算出 Calendar 里被点的那一格是哪一天。
 *
 * 两条路：
 *   1. 元素自带的日期属性（有就直接用）
 *   2. 按网格位置推算：取全部 .day 的下标，配合显示的年/月与周起始日反推
 *
 * 第 2 条要先校验 .day 的数量是 7 的倍数 —— 若选择器把表头也命中了，
 * 下标就会整体错位；这种情形直接放弃，交回 Calendar 自己处理。
 *
 * @returns {Date|null} 取不到返回 null，调用方必须据此放行事件
 */
function dateOfCalendarDay(box, dayEl, plugin) {
  try {
    const fromAttr = dateFromDayAttrs(dayEl);
    if (fromAttr) return fromAttr;

    const days = Array.prototype.slice.call(box.querySelectorAll('.day'));
    if (days.length === 0 || days.length % 7 !== 0) return null;
    const idx = days.indexOf(dayEl);
    if (idx < 0) return null;
    const y = findYearIn(box);
    const m = findMonthIn(box);
    if (!y || !m) return null;

    const startOffset = startOffsetOf(y, m - 1, targetDow(plugin.settings));
    let d = new Date(y, m - 1, 1 - startOffset + idx);

    /*
     * 用格内显示的数字校正跨月：
     * 点的是上月尾（显示 30/31 而推算得 1/2）或下月头（显示 1/2 而推算得 29/30）时，
     * 纯索引推算会差一个月。
     */
    const mt = String(dayEl.textContent || '').match(/(\d{1,2})/);
    const shown = mt ? parseInt(mt[1], 10) : 0;
    if (shown >= 1 && shown <= 31 && shown !== d.getDate()) {
      if (shown > d.getDate() + 7) d = new Date(y, m - 2, shown);
      else if (shown < d.getDate() - 7) d = new Date(y, m, shown);
      else d = new Date(y, m - 1, shown);
    }
    return isFinite(d.getTime()) ? d : null;
  } catch (e) {
    return null;
  }
}

/**
 * 算出 Calendar 里被点的周数格对应哪一周（返回该周首日）。
 *
 * 用周数格在所有周数格中的行号 r 反推：该行首日 = 1 - startOffset + r*7，
 * 与time tools 日历用的是同一套算法。
 *
 * @returns {Date|null} 取不到返回 null —— 不猜，避免建出错误周的周记
 */
function dateOfCalendarWeek(box, weekEl, plugin) {
  try {
    const y = findYearIn(box);
    const m = findMonthIn(box);
    if (!y || !m) return null;
    const dow = targetDow(plugin.settings);
    const startOffset = startOffsetOf(y, m - 1, dow);

    /*
     * 行号用周数格在 DOM 里的下标，不读格子里显示的数字。
     *
     * 2.57 曾改成「按显示的周数去 6 行里反查」，结果点 39 开 38 ——
     * Calendar 显示的编号与本地 weekNumberOf 算出的编号在跨月边界会差 1，
     * 拿数字去匹配等于把两套体系的误差固定下来。
     * 下标只依赖 DOM 顺序、与编号体系无关，2.56 用的就是这版，实测正常。
     */
    const wks = Array.prototype.slice.call(
      box.querySelectorAll(WEEK_NUM_SELECTOR)
    );
    const r0 = wks.indexOf(weekEl);
    if (r0 < 0) return null;
    let d = new Date(y, m - 1, 1 - startOffset + r0 * 7);

    /*
     * 交叉验证：下标算出的行首日，其周号应等于格子里显示的数字。
     * 不一致说明周数列被多余元素顶偏了（如表头占位格也带同样的 class），
     * 此时改用显示数字反查，并挑离下标最近的那一行 ——
     * 既保留下标的稳定性，又不会被固定偏移带偏一整周。
     */
    const mt = String(weekEl.textContent || '').match(/(\d{1,2})/);
    const shown = mt ? parseInt(mt[1], 10) : 0;
    if (shown >= 1 && shown <= 53 && isFinite(d.getTime())) {
      if (weekNumberOf(d, dow) !== shown) {
        let best = null;
        let bestDist = 1e9;
        for (let r = 0; r < wks.length; r++) {
          const cand = new Date(y, m - 1, 1 - startOffset + r * 7);
          if (!isFinite(cand.getTime())) continue;
          if (weekNumberOf(cand, dow) === shown) {
            const dist = Math.abs(r - r0);
            if (dist < bestDist) { bestDist = dist; best = cand; }
          }
        }
        if (best) d = best;
      }
    }
    return isFinite(d.getTime()) ? d : null;
  } catch (e) {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * 笔记命名统一（批量重命名）
 *
 * 由来：改了「日期格式」只影响之后新建的文件，老文件仍是旧命名。
 * 而圆点统计只按当前配置格式查，于是老日记在日历上不显示圆点 ——
 * 命名分裂。这里把已有笔记批量改成当前格式，让两边重新对上。
 *
 * 三条硬边界（改文件名是破坏性操作，宁可漏改不可误改）：
 *   1. 只处理**能反解出日期**的文件，认不出的绝不碰
 *   2. 只处理配置文件夹内的文件；folder 留空则该类跳过（不扫全库）
 *   3. 目标已存在则跳过，绝不覆盖
 * ------------------------------------------------------------------ */
const RENAME_KIND = { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' };

/**
 * 扫描需要改名的笔记（只读，不改动任何文件）。
 * @returns {Array<{file:object,kind:string,date:Date,from:string,to:string}>}
 */
function scanNoteRenames(app, settings) {
  const notes = settings && settings.notes;
  if (!notes || !app || !app.vault || typeof app.vault.getMarkdownFiles !== 'function') {
    return [];
  }
  const noteMod = require('./note.js');
  const dow = targetDow(settings);
  const out = [];
  const files = app.vault.getMarkdownFiles();
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const ref = parseNoteRef(f.basename || '', dow, notes, settings);
    const kind = ref ? RENAME_KIND[ref.kind] : null;
    if (!kind) continue;

    const cfg = noteMod.kindSettings(settings, kind);
    const folder = noteMod.resolvePathTokens(cfg.folder);
    /*
     * folder 留空时不扫全库：那会连普通笔记里恰好叫 2026-09-22 的文件一起改。
     * 实测（反证）这一步其实由下面那条归属判断兜住了 —— folder 为空时
     * `folder + '/'` 恒等于 '/'，任何路径都对不上。保留这行是显式保险：
     * 万一以后归属判断被改动，不至于退化成全库扫描。
     */
    if (!folder) continue;
    const p = String(f.path);
    if (!(p === folder + '/' + f.name || p.indexOf(folder + '/') === 0)) continue;

    const to = noteMod.buildNotePath(settings, kind, ref.date);
    if (to === p) continue; // 已经是当前格式
    out.push({ file: f, kind, date: ref.date, from: p, to });
  }
  return out;
}

/**
 * 执行改名。逐条进行并收集结果 —— 中途失败不影响其余条目，
 * 也不会留下半成品（rename 本身是原子的）。
 * @returns {{ok:Array, skipped:Array, failed:Array}}
 */
async function applyNoteRenames(app, list) {
  const res = { ok: [], skipped: [], failed: [] };
  if (!app || !app.vault) return res;
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    const to = normalizePath(it.to);   // 批量改名目标来自用户输入，必须归一化
    const exist = app.vault.getAbstractFileByPath(to);
    // 目标已存在（且不是自己）→ 跳过，绝不覆盖，避免丢数据
    if (exist && exist !== it.file) {
      res.skipped.push({ item: it, reason: '目标已存在' });
      continue;
    }
    try {
      await app.vault.rename(it.file, to);
      res.ok.push(it);
    } catch (e) {
      res.failed.push({ item: it, reason: (e && e.message) || String(e) });
    }
  }
  return res;
}

/* 预览最多列几条：上千条的库全列会把弹窗撑爆 */
const RENAME_PREVIEW_MAX = 30;

/**
 * 改名流程：扫描 → 预览 → 确认后才动手。
 *
 * 必须两次确认：批量改文件名不可逆（虽 rename 会更新站内链接，
 * 但库外引用、同步冲突都救不回来），不能做成一键执行。
 */
function runNoteRenameFlow(plugin) {
  const app = plugin && plugin.app;
  if (!app) return;
  let list;
  try {
    list = scanNoteRenames(app, plugin.settings);
  } catch (e) {
    new obsidian.Notice('扫描失败：' + ((e && e.message) || e));
    return;
  }
  if (!list.length) {
    new obsidian.Notice(
      '没有需要改名的笔记（都已与当前格式一致，或四类笔记的存放位置为空）'
    );
    return;
  }

  const modal = new obsidian.Modal(app);
  modal.titleEl.setText(i18nT('k1c3c863e', '批量改名（{0} 个）', list.length));
  const box = modal.contentEl;
  box.createDiv({
    cls: 'tt-tip',
    text: i18nT('kcf7c9e2b', '以下笔记将改成当前「日期格式」。改名由 Obsidian 执行，站内链接会自动更新；')
      + '目标已存在的会跳过（不覆盖）。',
  });

  const ul = box.createEl('ul', { cls: 'tt-rename-list' });
  list.slice(0, RENAME_PREVIEW_MAX).forEach((it) => {
    ul.createEl('li', { text: it.from + '  →  ' + it.to });
  });
  if (list.length > RENAME_PREVIEW_MAX) {
    ul.createEl('li', { text: i18nT('ka9b35478', '……另有 ') + (list.length - RENAME_PREVIEW_MAX) + ' 个' });
  }

  const row = box.createDiv({ cls: 'tt-rename-actions' });
  const go = row.createEl('button', { text: i18nT('k2c5d791d', '确认改名'), cls: 'mod-cta' });
  row.createEl('button', { text: i18nT('k949856b3', '取消') }).addEventListener('click', () => modal.close());
  go.addEventListener('click', async () => {
    modal.close();
    const r = await applyNoteRenames(app, list);
    new obsidian.Notice(
      '改名完成：成功 ' + r.ok.length + '，跳过 ' + r.skipped.length
        + '，失败 ' + r.failed.length
    );
  });
  modal.open();
}

module.exports = {
  CAL_VIEW_TYPE,
  runNoteRenameFlow,
  scanNoteRenames,
  applyNoteRenames,
  CalendarNoteView,
  WEEK_START_OPTIONS,
  applyCalendarWeekSpec,
  attachCalendarEnhance,
  openOwnCalendar,
  closeOwnCalendar,
  isCalendarOpen,
  parseMonthText,
  registerCalendar,
  renderCalendarSettings,
  resolveLocaleDow,
  targetDow,
  weekSpecStatus,
  weekNumberOf,
  weekStartOf,
  startOffsetOf,
  enforceExclusive,
  normalizeCalendarExclusive,
  dateOfCalendarDay,
  dateOfCalendarWeek,
  parseDateFromName,
  parseNoteRef,
  weekContains,
  weekTouchesMonth,
  formatToRegex,
  findMonthIn,
  isTitleEl,
  registerTemplaterBridge,
  bridgeNewNote,
};

  };

  __modules['src/note.js'] = function (module, exports, require) {
const obsidian = require('obsidian');
const { normalizePath } = require('obsidian');
const { t: i18nT, miscText } = require('./i18n.js');
/** 周号计算取 timejudge，与日历视图同源（本文件是叶子模块，不能依赖 calendar.js） */
const {
  weekDoyOf, firstWeekOffset, weeksInYear, dayOfYearOf, WEEK_START_DOW,
} = require('./timejudge.js');

/** 四种笔记类型 */
const NOTE_KINDS = [
  { key: 'daily', label: '日记', defaultFormat: 'YYYY-MM-DD' },
  { key: 'weekly', label: '周记', defaultFormat: 'gggg-[W]ww' },
  { key: 'monthly', label: '月记', defaultFormat: 'YYYY-MM' },
  { key: 'yearly', label: '年记', defaultFormat: 'YYYY' },
];

const TEMPLATER_PLUGIN_ID = 'templater-obsidian';
const TEMPLATER_DOWNLOAD =
  'https://obsidian.md/plugins?id=templater-obsidian';

/* ------------------------------------------------------------------ *
 * Templater 联动
 * ------------------------------------------------------------------ */

/**
 * 取 Templater 的 API 对象。
 * 返回 null 表示不可用（未安装 / 未启用 / 尚未初始化）。
 */
function getTemplater(app) {
  try {
    const p = app && app.plugins && app.plugins.plugins
      ? app.plugins.plugins[TEMPLATER_PLUGIN_ID]
      : null;
    if (!p) return null;
    // Templater 未初始化完成时没有 templater 字段
    return p.templater || null;
  } catch (e) {
    return null;
  }
}

/** 人类可读的不可用原因，用于提示文案 */
function templaterState(app) {
  const p = app && app.plugins && app.plugins.plugins
    ? app.plugins.plugins[TEMPLATER_PLUGIN_ID] : null;
  if (!p) return { ok: false, reason: '未安装' };
  if (!p.templater) return { ok: false, reason: '已安装但未初始化' };
  if (typeof p.templater.create_new_note_from_template !== 'function') {
    return { ok: false, reason: '版本不兼容', methods: '' };
  }
  /*
   * 补跑桥接用的是 parse_template（不是 write_template_to_file —— 后者不是公开 API，
   * v2.71～v2.73 调了个不存在的方法，一直静默失败）。
   * 这里把可用方法列出来，排错时能一眼看出版本到底提供了什么。
   */
  const methods = Object.keys(p.templater)
    .filter((k) => typeof p.templater[k] === 'function')
    .join(', ');
  if (typeof p.templater.parse_template !== 'function') {
    return { ok: true, reason: '补跑不可用：缺少 parse_template', methods: methods };
  }
  return { ok: true, reason: '', methods: methods };
}

/**
 * 等 Templater 就绪（最多约 1.2 秒）。
 *
 * Templater 是异步初始化的，Obsidian 刚启动时 plugin 对象已在、
 * 但 templater 字段还没挂上。直接判定就是「已安装但未初始化」然后报错，
 * 表现为「点了没反应 / 提示装了却用不了」。等一会儿即可。
 * 「未安装」不必等，等也等不来。
 */
async function waitTemplater(app) {
  const step = 200;
  const max = 1200;
  for (let waited = 0; waited <= max; waited += step) {
    const st = templaterState(app);
    if (st.ok) return st;
    if (st.reason === '未安装') return st;
    await new Promise((r) => setTimeout(r, step));
  }
  return templaterState(app);
}

/* ------------------------------------------------------------------ *
 * 路径与文件名
 * ------------------------------------------------------------------ */

/** 按类型取设置；缺字段时用默认值兜底 */
function kindSettings(settings, kind) {
  const n = settings && settings.notes;
  const one = n && n[kind] ? n[kind] : {};
  const def = NOTE_KINDS.find((k) => k.key === kind) || NOTE_KINDS[0];
  return {
    folder: String(one.folder ?? ''),
    format: String(one.format ?? def.defaultFormat),
    template: String(one.template ?? ''),
    altFormats: String(one.altFormats ?? ''),
  };
}

/**
 * 拆分用户在「额外文件名格式」里填的多个格式。
 *
 * 支持中英文逗号、换行、顿号、分号混用；空串返回空数组。
 * 只用于**识别**（高亮 / 打开已有笔记），不用于新建。
 */
function splitAltFormats(text) {
  const s = String(text ?? '');
  if (!s.trim()) return [];
  return s.split(/[,，、;；\n\r]+/).map((x) => x.trim()).filter(Boolean);
}

/**
 * 高亮识别用的候选格式清单。
 *
 * 原来「打开笔记」走 cfg.format + ALT_FORMATS，「高亮」却只认 cfg.format
 * 一条 —— 两条路径不同源，于是换个命名风格高亮就失效。
 * 这里统一成同一份清单：配置格式 → 用户额外格式 → 常见异名。
 *
 * 顺序有意义：越靠前优先级越高，先命中者胜。
 *
 * @returns {string[]} 去重后的格式串数组
 */
function highlightFormats(settings, kind) {
  const cfg = kindSettings(settings, kind);
  const list = [cfg.format]
    .concat(splitAltFormats(cfg.altFormats))
    .concat(ALT_FORMATS[kind] || []);
  const seen = new Set();
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const f = String(list[i] ?? '').trim();
    if (!f || seen.has(f)) continue;
    seen.add(f);
    out.push(f);
  }
  return out;
}

/**
 * 兼容核心「日记」插件的 DI（moment 没有这个 token，不处理会输出成 2026-09-21I）。
 * DI 的语义是「日 + 星期」（核心插件渲染成 2026-09-21-周一），故映射为 DD-ddd。
 * [字面量] 里的 DI 不动；只要星期请直接用 ddd。
 */
function normalizeDi(format) {
  const raw = String(format ?? '');
  const lits = [];
  const masked = raw.replace(/\[([^\]]*)\]/g, (_m, s) => {
    lits.push(s);
    return '\u0000' + (lits.length - 1) + '\u0000';
  });
  return masked
    .replace(/DI/g, 'DD-ddd')
    .replace(/\u0000(\d+)\u0000/g, (_m, i) => '[' + (lits[Number(i)] ?? '') + ']');
}

/**
 * 拆分「文件名格式」里的路径部分。
 *
 * 与 Obsidian 核心「日记」插件行为一致：日期格式里可以带 /，
 * 例如 YYYY/MM/YYYY-MM-DD —— 前面的 YYYY/MM 变成两级子目录，
 * 只有最后一段是文件名。从核心插件迁移格式串时无需手工拆开。
 *
 * [字面量] 里允许含 /，先占位剥离再按 / 拆，避免把字面量的斜杠
 * 误当成分隔符。
 *
 * @returns {{sub:string, name:string}} sub 为子目录部分（可能为空串）
 */
function splitFormatPath(format) {
  const raw = String(format ?? '');
  const lits = [];
  const masked = raw.replace(/\[([^\]]*)\]/g, (_m, s) => {
    lits.push(s);
    return '\u0000' + (lits.length - 1) + '\u0000';
  });
  // 还原时要带上方括号本身：占位符只存了括号内的内容
  const restore = (s) =>
    s.replace(/\u0000(\d+)\u0000/g, (_m, i) => '[' + (lits[Number(i)] ?? '') + ']');
  const idx = masked.lastIndexOf('/');
  if (idx < 0) return { sub: '', name: restore(masked) };
  return {
    sub: restore(masked.slice(0, idx)),
    name: restore(masked.slice(idx + 1)),
  };
}

/**
 * 构建笔记完整路径（含 .md）—— 所有调用点的统一入口。
 * 三段拼接：配置文件夹 → 文件名格式里 / 产生的子目录 → 文件名（最后一段）。
 * 走统一入口是为了避免「有的地方认 / 、有的地方不认」—— folder 就出过这个问题。
 */
/**
 * 构建笔记所在目录（不含文件名）。
 *
 * Templater 的 create_new_note_from_template 要单独传目录，
 * 所以这里与 buildNotePath 共用同一套拼接规则 —— 否则日期格式里带 /
 * 时，Templater 会把笔记建到少了子目录的位置。
 */
function buildNoteDir(settings, kind, date, format) {
  const cfg = kindSettings(settings, kind);
  const dow = dowOfSettings(settings);
  const fmt = format == null ? cfg.format : format;
  const parts = splitFormatPath(fmt);
  // 路径：字面量，不做任何 token 解析（层级请写在日期格式里）
  const folder = resolvePathTokens(cfg.folder);
  // 日期格式里的子目录（YYYY/MM）：仍需解析，与核心「日记」插件一致
  const sub = buildFormatSubdir(parts.sub, date, kind, dow);
  return [folder, sub].filter((s) => s && s.trim()).join('/');
}

function buildNotePath(settings, kind, date, format) {
  const cfg = kindSettings(settings, kind);
  const dow = dowOfSettings(settings);
  const fmt = format == null ? cfg.format : format;
  const parts = splitFormatPath(fmt);
  return fullPath(
    buildNoteDir(settings, kind, date, fmt),
    buildFileName(date, parts.name, kind, dow)
  );
}

/**
 * 用 moment 生成文件名。
 * 两种无效情况都要兜底：
 *   1. 抛错或返回 Invalid date
 *   2. 输出与格式串完全相同 —— 说明串里没有任何被识别的 token
 *      （例如 gggg/ww 在某些环境下不被支持），此时用内置算法算，避免
 *      把 "gggg-[W]ww" 这种原始字符串直接当文件名
 */
function buildFileName(date, format, kind, dow) {
  try {
      /*
       * 周号必须与日历格子同源：交给 moment 的 gggg/ww 会用它自己的 locale week，
       * 与用户设置的周起始（firstDow）不同源时会「显示第 40 周却生成 2026-W39」。
       * 故按传入 dow 自算，规则同 calendar.js 的 weekNumberOf。
       */
    if (kind === 'weekly' && /gggg|GGGG|ww|WW/.test(String(format))) {
      const own = formatWeekName(date, String(format), dow == null ? 1 : dow);
      if (own) return own;
    }
    const out = obsidian.moment(date.getTime()).format(normalizeDi(format));
    if (!out || out === 'Invalid date' || out === String(format)) {
      return fallbackName(date, kind);
    }
    return out;
  } catch (e) {
    return fallbackName(date, kind);
  }
}

/**
 * 按指定周起始格式化周记名，不经过 moment 的 locale。
 *
 * 支持 gggg / GGGG / ww / WW / YYYY / MM / DD 与 [字面量]（如 [W]）。
 * 遇到无法识别的 token 返回 null，由调用方退回 moment。
 */
function formatWeekName(date, format, dow) {
  const pad = (v) => String(v).padStart(2, '0');
  const lits = [];
  let tpl = String(format).replace(/\[([^\]]*)\]/g, (_m, s) => {
    lits.push(s);
    return '\u0000' + (lits.length - 1) + '\u0000';
  });
  const lw = weekMeta(date, dow);
  tpl = tpl
    .replace(/gggg/g, String(lw.year))
    .replace(/GGGG/g, String(date.getFullYear()))
    .replace(/ww/g, pad(lw.week))
    .replace(/WW/g, pad(getIsoWeek(date)))
    .replace(/YYYY/g, String(date.getFullYear()))
    .replace(/MM/g, pad(date.getMonth() + 1))
    .replace(/DD/g, pad(date.getDate()));
  // 仍有字母 token 说明不支持，交回 moment 处理
  if (/[A-Za-z]/.test(tpl)) return null;
  return tpl.replace(/\u0000(\d+)\u0000/g, (_m, i) => lits[Number(i)]);
}

/* weekDoyOf / dayOfYearOf / firstWeekOffset / weeksInYear 取 timejudge 共享实现 */
const weeksInYearOf = weeksInYear;

/*
 * 周起始：与 calendar.js 同源（同取 timejudge.WEEK_START_DOW），
 * 避免两套周界各算各的——周记文件名与日历显示必须落在同一周。
 * note.js 与 calendar.js 互相引用会成环，所以共享定义放在不依赖二者的
 * timejudge.js，两边各自去取。
 */

function localeDow() {
  try {
    const m = obsidian.moment ? obsidian.moment() : null;
    const ld = m && typeof m.localeData === 'function' ? m.localeData() : null;
    const w = ld && typeof ld.week === 'function' ? ld.week() : null;
    if (w && typeof w.dow === 'number') return w.dow;
  } catch (e) { /* 查询失败用默认值 */ }
  return 0;
}

function dowOfSettings(settings) {
  const cal = settings && settings.calendar;
  const v = cal ? cal.weekStart : 'locale';
  if (v && v !== 'locale' && Object.prototype.hasOwnProperty.call(WEEK_START_DOW, v)) {
    return WEEK_START_DOW[v];
  }
  return localeDow();
}

/**
 * 与 calendar.js 的 weekNumberOf 同算法，额外返回所属周年份（gggg）。
 * 跨年时周年份与日历年不同：2024-12-30 属于 2025 年第 1 周。
 */
function weekMeta(date, dow) {
  const doy = weekDoyOf(dow);
  const y = date.getFullYear();
  const off = firstWeekOffset(y, dow, doy);
  let w = Math.floor((dayOfYearOf(date) - off - 1) / 7) + 1;
  if (w < 1) return { year: y - 1, week: w + weeksInYearOf(y - 1, dow, doy) };
  const total = weeksInYearOf(y, dow, doy);
  if (w > total) return { year: y + 1, week: w - total };
  return { year: y, week: w };
}

function fallbackName(date, kind) {
  const p = (v) => String(v).padStart(2, '0');
  if (kind === 'yearly') return String(date.getFullYear());
  if (kind === 'monthly') {
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}`;
  }
  if (kind === 'weekly') return `${date.getFullYear()}-W${p(getIsoWeek(date))}`;
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** ISO 周数（周一为一周之始） */
function getIsoWeek(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (t.getDay() + 6) % 7; // 周一=0
  t.setDate(t.getDate() - day + 3); // 移到该周周四
  const first = new Date(t.getFullYear(), 0, 4);
  const fday = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - fday + 3);
  return 1 + Math.round((t - first) / (7 * 86400000));
}

/** 拼接完整路径（含 .md） */
function fullPath(folder, name) {
  // 入口归一化：替换原先只去尾斜杠的手工清理（它不处理反斜杠/重复斜杠）
  const f = normalizePath(folder);
  return (f ? f + '/' : '') + name + '.md';
}

/**
 * 可识别的日期 token。
 *
 * 末尾的 (?![A-Za-z]) 是必需的：没有它，`My Docs` 里的 M、D
 * 也会被当成月/日 token，文件夹名被改得面目全非。
 * 加上后只有独立成词（后接分隔符或结尾）才算 token。
 */
const FOLDER_TOKEN_RE =
  /(?:YYYY|YY|gggg|GGGG|MMMM|MMM|MM|M|DD|D|dddd|ddd|ww|WW)(?![A-Za-z])/;

  /**
   * 解析「日期格式」里的子目录段（/ 之前的各段）。分级能力只此一处 ——
   * 「新笔记存放位置」是纯字面量，两处都解析会让用户填两遍年份、建出叠层路径。
   * 与 buildFileName 的关键差异：没有可识别 token 时原样返回，
   * 绝不退回 fallbackName（否则 03记录/生活记录 会被换成一个日期串）。
   *
   * @returns {{sub:string, name:string}} sub 为子目录部分（可能为空串）
   */
function buildFormatSubdir(folder, date, kind, dow) {
  const raw = String(folder || '').trim();
  if (!raw) return '';
  // 兼容 Templater 习惯写法：{{YYYY}} 也认，避免又建出字面量文件夹
  const src = raw.replace(/\{\{([^{}]*)\}\}/g, '$1');
  const parts = src.split('/').map((seg) => {
    if (!seg || !FOLDER_TOKEN_RE.test(seg)) return seg;
    return formatSegment(seg, date, kind, dow) || seg;
  });
  // 顺带做清洗：去掉空段、. 与 ..（防越出库的路径穿越）
  return parts
    .map((s) => s.trim())
    .filter((s) => s && s !== '.' && s !== '..')
    .join('/');
}

/** 格式化单段路径；失败返回 null 由调用方保留原样 */
function formatSegment(seg, date, kind, dow) {
  // 周记文件夹常用 gggg：周号必须与日历显示同源，不能走 moment 的 locale
  if (kind === 'weekly' && /gggg|GGGG|ww|WW/.test(seg)) {
    const own = formatWeekName(date, seg, dow == null ? 1 : dow);
    if (own) return own;
  }
  try {
    const out = obsidian.moment(date.getTime()).format(normalizeDi(seg));
    if (out && out !== 'Invalid date') return out;
  } catch (e) { /* 退回原样 */ }
  return null;
}

/** 取解析后的文件夹（各调用点统一走这里，避免有的解析有的不解析） */
function noteFolder(settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  return resolvePathTokens(cfg.folder);
}

  /**
   * 路径（新笔记存放位置）：原样返回，只做安全清洗。
   * 曾在这里解析 YYYY/MM/gggg，与「日期格式」的分级能力重复，容易建出
   * 日记/2026/2026/09 这类叠层路径 —— 现已取消，层级一律写在日期格式里。
   * 保留的清洗（去 .. 防路径穿越、去空段与首尾斜杠）是安全兜底，不能省。
   */
function resolvePathTokens(folder) {
  return String(folder || '')
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s && s !== '.' && s !== '..')
    .join('/');
}

/* ------------------------------------------------------------------ *
 * 内置模板降级
 * ------------------------------------------------------------------ */

/** 模板变量替换 */
function fillTemplate(text, date, kind) {
  const p = (v) => String(v).padStart(2, '0');
  const map = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    monthPadded: p(date.getMonth() + 1),
    day: date.getDate(),
    dayPadded: p(date.getDate()),
    week: getIsoWeek(date),
    weekPadded: p(getIsoWeek(date)),
    weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
    kind: kind,
  };
  return String(text).replace(/\{\{(\w+)\}\}/g, (m, k) =>
    Object.prototype.hasOwnProperty.call(map, k) ? map[k] : m
  );
}

const DEFAULT_BUILTIN_TEMPLATES = {
  daily: '# {{year}}年{{monthPadded}}月{{dayPadded}}日 周{{weekday}}\n\n',
  weekly: '# {{year}}年第{{weekPadded}}周\n\n',
  monthly: '# {{year}}年{{monthPadded}}月\n\n',
  yearly: '# {{year}}年\n\n',
};

/* ------------------------------------------------------------------ *
 * 生成入口
 * ------------------------------------------------------------------ */

/**
 * 查找模板文件，三层容错。
 *
 * 1. 原路径精确匹配
 * 2. 补 .md 后再匹配（用户常漏写后缀）
 * 3. 同级文件夹下按文件名模糊匹配（用户可能填的是文件夹名）
 *
 * @returns {{file:object|null, tried:string[]}} tried 用于报错时如实展示
 */
function resolveTemplate(app, rawPath) {
  const tried = [];
  const src = normalizePath(String(rawPath || '').trim());
  if (!src) return { file: null, tried };

  // 1) 原样
  let f = app.vault.getAbstractFileByPath(src);
  if (f) return { file: f, tried: [src] };
  tried.push(src);

  // 2) 补 .md
  const withMd = /\.md$/i.test(src) ? null : src + '.md';
  if (withMd) {
    f = app.vault.getAbstractFileByPath(withMd);
    if (f) return { file: f, tried };
    tried.push(withMd);
  }

  // 3) 模糊匹配：在库里找 basename 相同、且路径以输入为前缀的文件
  try {
    const needle = src.replace(/\.md$/i, '').toLowerCase();
    const all = app.vault.getFiles ? app.vault.getFiles() : [];
    const hit = all.find((x) => {
      const p = String(x.path || '').replace(/\.md$/i, '').toLowerCase();
      return p === needle || p.endsWith('/' + needle.split('/').pop())
        || p.startsWith(needle + '/');
    });
    if (hit) return { file: hit, tried };
  } catch (e) { /* getFiles 不可用时跳过 */ }

  return { file: null, tried };
}

/**
 * 生成或打开一篇周期性笔记。
 * @returns {Promise<{ok:boolean, msg:string, path?:string}>}
 */
async function openOrCreateNote(plugin, kind, date) {
  const app = plugin.app;
  const settings = plugin.settings;
  const cfg = kindSettings(settings, kind);
  const label = (NOTE_KINDS.find((k) => k.key === kind) || {}).label || kind;

  const dow = dowOfSettings(settings);
  const name = buildFileName(date, splitFormatPath(cfg.format).name, kind, dow);
  const path = buildNotePath(settings, kind, date, cfg.format);

  /*
   * 已存在就打开，不覆盖。
   * 除了按配置格式查，还要按常见异名格式兜底查一次：
   * 老笔记可能是别的格式命名的（如 2026-09-08-周二.md），
   * 只按配置格式判断「不存在」就会再建一篇，形成重复。
   */
  let exist = app.vault.getAbstractFileByPath(path);
  const alt = exist ? null : findExistingNote(app, settings, kind, date);
  if (alt) {
    await openFile(app, alt);
    return { ok: true, msg: `已打开${label}：${alt.path}`, path: alt.path };
  }
  if (exist) {
    await openFile(app, exist);
    return { ok: true, msg: `已打开${label}：${path}`, path };
  }

  // 没配模板路径 → 明确报错，不擅自降级
  if (!cfg.template) {
    return {
      ok: false,
      msg: `未配置${label}模板路径。请在设置 → 日历 → ${label} 中填写模板文件路径，或开启「降级内置模板」。`,
    };
  }

  /*
   * 模板查找三层容错。
   * 用户实测：把「模板文件」填成不带 .md 的路径（例：04仓库/1模板/推进类模板），
   * 而说明写的是「含 .md」——精确匹配直接失败，且当时只在 console.warn，
   * 界面上完全没有反馈，表现为「点了没反应」。
   */
  const found = resolveTemplate(app, cfg.template);
  if (!found.file) {
    return { ok: false, msg: `模板文件不存在：${cfg.template}（已尝试补 .md 与模糊匹配）` };
  }
  const tpl = found.file;

  // 优先 Templater（会短暂等待它初始化完成）
  const st = await waitTemplater(app);
  if (st.ok) {
    try {
      const t = getTemplater(app);
      await t.create_new_note_from_template(
        tpl,
        buildNoteDir(settings, kind, date, cfg.format) || undefined,
        name,
        true
      );
      return { ok: true, msg: `已用 Templater 生成${label}：${name}`, path };
    } catch (e) {
      // Templater 失败时不静默：要么降级（开关开），要么如实报错
      if (!(settings.notes && settings.notes.fallbackToBuiltin)) {
        return { ok: false, msg: `Templater 生成失败：${e && e.message ? e.message : e}` };
      }
      console.warn('[Time Tools] Templater 失败，已降级内置模板', e);
    }
  } else {
    if (!(settings.notes && settings.notes.fallbackToBuiltin)) {
      return {
        ok: false,
        msg: `Templater ${st.reason}，无法生成${label}。请先安装并配置 Templater：${TEMPLATER_DOWNLOAD}`,
      };
    }
  }

  // 降级：内置模板（仅当开关打开）
  return await createWithBuiltin(plugin, kind, date, path, name, label);
}

async function createWithBuiltin(plugin, kind, date, path, name, label) {
  const app = plugin.app;
  path = normalizePath(path);
  const folder = path.substring(0, path.lastIndexOf('/'));
  if (folder) {
    const f = app.vault.getAbstractFileByPath(folder);
    if (!f) {
      try { await app.vault.createFolder(folder); } catch (e) { /* 可能已存在 */ }
    }
  }
  const body = fillTemplate(DEFAULT_BUILTIN_TEMPLATES[kind] || '', date, kind);
  const file = await app.vault.create(path, body);
  await openFile(app, file);
  return { ok: true, msg: `已用内置模板生成${label}：${name}`, path };
}

async function openFile(app, file) {
  try {
    const leaf = app.workspace.getLeaf(false);
    if (leaf && typeof leaf.openFile === 'function') await leaf.openFile(file);
  } catch (e) { /* 打开失败不影响文件已生成 */ }
}

/*
 * 常见异名格式：老笔记可能不是按当前配置格式命名的。
 * 只用于「打开已存在的笔记」这一件事，绝不用于新建 ——
 * 新建必须严格按用户配置的格式，否则越配越乱。
 */
const ALT_FORMATS = {
  daily: ['YYYY-MM-DD', 'YYYY-MM-DD-ddd', 'YYYY-MM-DD ddd', 'YYYY-M-D',
    'YYYYMMDD', 'YYYY年M月D日', 'YYYY-MM-DD-dddd'],
  weekly: ['gggg-[W]ww', 'gggg-Www', 'gggg-[W]WW'],
  monthly: ['YYYY-MM', 'YYYY-MM月记', 'YYYY年M月'],
  yearly: ['YYYY', 'YYYY年记', 'YYYY年'],
};

/**
 * 按常见异名格式找已存在的笔记。
 *
 * 场景：接管 Calendar 的日期点击后，若用户历史日记是 2026-09-08-周二.md
 * 而配置格式是 YYYY-MM-DD，只按配置查会判定「不存在」→ 再建一篇，
 * 同一天出现两篇日记。这里在**配置文件夹内**试几种常见格式，命中就打开。
 *
 * @returns {object|null} 找到的文件
 */
function findExistingNote(app, settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  const list = ALT_FORMATS[kind] || [];
  const seen = new Set();
  const formats = [cfg.format].concat(list.filter((f) => f !== cfg.format));
  for (const f of formats) {
    let name;
    try {
      name = buildFileName(date, f, kind, dowOfSettings(settings));
    } catch (e) {
      continue;
    }
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const hit = app.vault.getAbstractFileByPath(buildNotePath(settings, kind, date, f));
    if (hit) return hit;
  }
  return null;
}

/** 笔记是否存在（视图上画小圆点用） */
function noteExists(app, settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  const path = buildNotePath(settings, kind, date, cfg.format);
  return !!app.vault.getAbstractFileByPath(path);
}

/* ------------------------------------------------------------------ *
 * 字数统计（对齐 Calendar 的 Words per dot）
 *
 * 每天画 N 个小圆点，N = 字数 / 每点代表字数。
 * 读全文较贵，故按「路径 + 修改时间」缓存 ——
 * 同一个月来回翻页时不会重复读盘。
 * ------------------------------------------------------------------ */
const wordCache = new Map();

function cacheKey(file) {
  return String(file.path) + '@' + String(file.stat ? file.stat.mtime : 0);
}

/**
 * 统计一篇笔记的字数。
 * 中英文混排时：中文按字符计，英文按词计，取两者之和 ——
 * 这是中文用户最直觉的算法（纯按空格切词会把中文整段算成 1 个词）。
 */
function countWords(text) {
  if (!text) return 0;
  let body = String(text);
  // 去掉 frontmatter，否则 YAML 键名会被算进字数
  if (body.startsWith('---')) {
    const end = body.indexOf('\n---', 3);
    if (end > 0) body = body.substring(end + 4);
  }
  // 去掉代码块与纯空白
  body = body.replace(/```[\s\S]*?```/g, '');
  const cn = (body.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (body.replace(/[\u4e00-\u9fa5]/g, ' ')
    .match(/[A-Za-z0-9_'-]+/g) || []).length;
  return cn + en;
}

/**
 * 取某天日记的字数；笔记不存在返回 0。
 * 同步走 cachedRead 不可行，故这里只做「已缓存才返回」的快速路径，
 * 未命中由调用方异步补 —— 视图首帧先不画点，读到后再刷新。
 */
function cachedWordCount(file) {
  if (!file) return 0;
  const k = cacheKey(file);
  const hit = wordCache.get(k);
  return hit ? hit : 0;
}

/*
 * 「是否已统计过」必须与字数分开记录。
 *
 * 踩过的坑：早期用「字数 === 0」当作「未统计」，于是空笔记（真实字数 0）
 * 永远被判定为未统计 —— 补读后仍是 0，render 又触发补读，形成无限循环，
 * 表现为疯狂读盘 + 界面不停重绘。空日记是常态，这个循环必现。
 */
function hasWordCount(file) {
  if (!file) return false;
  return wordCache.has(cacheKey(file));
}

function setWordCount(file, n) {
  if (!file) return;
  const k = cacheKey(file);
  wordCache.set(k, n);
  // 限量：缓存不随使用无限增长
  if (wordCache.size > 400) {
    const first = wordCache.keys().next().value;
    wordCache.delete(first);
  }
}

/**
 * 取某类笔记的文件（不存在返回 null）
 *
 * 周记/月记/年记也要用：日历周数列的圆点读的是周记本身，
 * 所以不能只有 getDailyFile 一个入口。
 */
function getNoteFile(app, settings, kind, date) {
  const cfg = kindSettings(settings, kind);
  const path = buildNotePath(settings, kind, date, cfg.format);
  return app.vault.getAbstractFileByPath(path);
}

function getDailyFile(app, settings, date) {
  return getNoteFile(app, settings, 'daily', date);
}

/** 清空字数缓存（设置变更或卸载时调用，避免陈旧数据） */
function clearWordCache() {
  wordCache.clear();
}

/**
 * 增量失效：只淘汰「文件已不存在 / mtime 已变」的条目，保留仍然有效的。
 *
 * 为什么不全清：缓存 key 是「路径@mtime」，mtime 变了旧 key 本来就不会命中，
 * 全清等于把仍然有效的几十个格子的统计白扔掉，下一次渲染全部重新读盘。
 * 只读 stat、不读文件内容，所以很便宜。
 *
 * @returns {number} 淘汰条数（供诊断）
 */
function pruneWordCache(app) {
  if (!app || !app.vault || typeof app.vault.getAbstractFileByPath !== 'function') return 0;
  let dropped = 0;
  for (const k of Array.from(wordCache.keys())) {
    const at = k.lastIndexOf('@');
    if (at < 0) { wordCache.delete(k); dropped++; continue; }
    const p2 = k.slice(0, at);
    const mt = k.slice(at + 1);
    const f = app.vault.getAbstractFileByPath(normalizePath(p2));
    // 文件没了，或 mtime 与缓存时不同 —— 这条已经取不到，删掉
    if (!f || String(f.stat ? f.stat.mtime : 0) !== mt) { wordCache.delete(k); dropped++; }
  }
  return dropped;
}

/* ------------------------------------------------------------------ *
 * 设置页
 * ------------------------------------------------------------------ */

function renderNoteSettings(containerEl, plugin) {
  const n = plugin.settings.notes;

  const st = templaterState(plugin.app);
  const head = containerEl.createDiv({ cls: 'tt-note-status' });
  head.setText(
    st.ok
      ? i18nT('k25ea5b75', 'Templater：已就绪，将用它生成笔记。')
      : i18nT('k3e466b79', 'Templater：{0}（下载：{1}）', st.reason, TEMPLATER_DOWNLOAD)
  );
  if (!st.ok) head.addClass('is-warn');

  new obsidian.Setting(containerEl)
    .setName(i18nT('kdeb01a5c', '降级内置模板'))
    .setDesc(i18nT('k5dfd0317', "Templater 不可用时改用内置简单模板。默认关闭 —— 此时会明确提示你去配置 Templater，而不是悄悄生成内容不符预期的笔记。内置模板只有少量基础变量；需要天气、习惯打卡、条件判断等复杂逻辑请直接用 Templater。"))
    .addToggle((t) =>
      t.setValue(n.fallbackToBuiltin === true).onChange(async (v) => {
        n.fallbackToBuiltin = v;
        await plugin.saveSettings();
        plugin.redrawSettingsTab();
      })
    );

  /*
   * 内置模板变量清单。
   * 只在开启降级时展示 —— 用 Templater 的人根本不需要看这个，
   * 显示了反而让人误以为本插件的模板能力只有这些。
   */
  if (n.fallbackToBuiltin === true) {
    const box = containerEl.createDiv({ cls: 'tt-note-varhelp' });
    box.createDiv({
      cls: 'tt-note-varhelp-title',
      text: i18nT('ke7b4064f', '内置模板可用变量（仅基础项）'),
    });
    box.createDiv({
      cls: 'tt-note-varhelp-body',
      text: '{{year}} {{month}} {{monthPadded}} {{day}} {{dayPadded}} '
        + '{{week}} {{weekPadded}} {{weekday}} {{kind}}',
    });
    box.createDiv({
      cls: 'tt-note-varhelp-note',
      /* 只包第一段会变成「英文开头 + 中文后续」，必须整段合并 */
      text: i18nT('k6e1c436d',
        '需要天气、习惯打卡、条件判断等复杂内容时，请用 Templater —— 上面「模板文件」填 Templater 模板即可，本插件会优先调用它。'),
    });
  }

  NOTE_KINDS.forEach((k) => {
    const one = n[k.key] || {};
    containerEl.createDiv({ cls: 'tt-note-kind-title', text: miscText('noteKind', k.key, k.label) });

    /*
     * 示例预览：只改这一个元素的文本，绝不重绘设置页。
     * 重绘会重建输入框 DOM、让焦点丢失 —— 曾经踩过：每敲一个字符就失焦，
     * 只能删一个再填一个。所以这里持有元素引用单独更新。
     */
    const previewEl = containerEl.createDiv({ cls: 'tt-note-preview' });
    const updatePreview = () => {
      let txt = '（格式无效）';
      try {
        const p = buildNotePath(plugin.settings, k.key, new Date());
        if (p) txt = p;
      } catch (e) { /* 保留占位文案 */ }
      previewEl.setText(i18nT('k614fc656', '示例：') + txt);
    };

    new obsidian.Setting(containerEl)
      .setName(i18nT('k398e51ca', '日期格式'))
      .setDesc(i18nT('kb8a9c9ce', "moment 语法，决定文件名。**可带 / 直接写子目录**（如 YYYY/MM/YYYY-MM-DD）：只有最后一段是文件名，与核心「日记」插件一致。留空用默认（{0}）。常用：YYYY 年、MM 月、DD 日、ddd 周二、gggg 周所属年、ww 周数、DI＝日-星期（等同 DD-ddd，兼容核心插件；只要星期请用 ddd）。注意：改了只影响之后新建的文件。", k.defaultFormat))
      .addText((tx) =>
        tx.setPlaceholder(k.defaultFormat)
          .setValue(String(one.format ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].format = v;
            await plugin.saveSettings();
            updatePreview();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('kecaa48f5', '新笔记存放位置'))
      .setDesc(i18nT('k750e7faa', "留空为库根目录。本框**不做任何日期替换**：YYYY、MM、gggg、DD、ddd 一律保持字面量（填 YYYY 就真的会建出叫 YYYY 的文件夹）。\\n要按年/月分级，请写在上面「日期格式」里，与核心「日记」插件完全一致。本项与格式里 / 产生的目录依次拼接（本项在前）。"))
      .addText((tx) =>
        tx.setPlaceholder(i18nT('k724352a6', '留空为根目录'))
          .setValue(String(one.folder ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].folder = v;
            await plugin.saveSettings();
            updatePreview();
          })
      );

    new obsidian.Setting(containerEl)
      .setName(i18nT('k1d520488', '模板位置'))
      .setDesc(i18nT('kf4c631a1', 'Templater 模板的完整路径，含 .md。推荐用 <% %> 语法（支持天气、习惯打卡、条件判断）。'))
      .addText((tx) =>
        tx.setPlaceholder(i18nT('kdd4423f7', '例：04仓库/1模板/日记模板.md'))
          .setValue(String(one.template ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].template = v;
            await plugin.saveSettings();
          })
      );

    /*
     * 额外文件名格式：只用于「识别」，不用于新建。
     *
     * 为什么需要它：高亮要靠文件名反推日期，而文件名格式是用户自己定的
     * —— 内置那几种常见写法覆盖不了所有人。老库里还常有历史命名
     * （如 2026-09-08-周二），光靠当前配置格式认不出。
     * 给用户一个窗口自己补，插件才对别人也管用。
     */
    new obsidian.Setting(containerEl)
      .setName(i18nT('k6468a655', '额外文件名格式'))
      .setDesc(i18nT('k39bdb13e', "仅用于识别已有笔记（高亮、点击打开），新建仍严格按上面的「日期格式」。多个用逗号分隔，可含文件夹。"))
      .addText((tx) =>
        tx.setPlaceholder(i18nT('k69c5eac1', `例：${k.defaultFormat}-ddd，${k.defaultFormat}`, k.defaultFormat, k.defaultFormat))
          .setValue(String(one.altFormats ?? ''))
          .onChange(async (v) => {
            n[k.key] = n[k.key] || {};
            n[k.key].altFormats = v;
            await plugin.saveSettings();
          })
      );

    updatePreview();
  });
}

module.exports = {
  NOTE_KINDS,
  TEMPLATER_DOWNLOAD,
  buildFileName,
  resolvePathTokens,
  buildNotePath,
  buildNoteDir,
  splitFormatPath,
  normalizeDi,
  noteFolder,
  fillTemplate,
  fullPath,
  getIsoWeek,
  getTemplater,
  kindSettings,
  noteExists,
  findExistingNote,
  ALT_FORMATS,
  splitAltFormats,
  highlightFormats,
  openOrCreateNote,
  waitTemplater,
  cachedWordCount,
  hasWordCount,
  clearWordCache,
  pruneWordCache,
  countWords,
  getNoteFile,
  getDailyFile,
  setWordCount,
  renderNoteSettings,
  resolveTemplate,
  templaterState,
};

  };

  __modules['src/configio.js'] = function (module, exports, require) {
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

  };

  __modules['src/main.js'] = function (module, exports, require) {
const obsidian = require('obsidian');
const { migrateSettings, TimeToolsSettingTab } = require('./settings.js');
const {
  registerTimestamp,
  refreshTimestampViews,
  clearUndo,
} = require('./timestamp.js');
const { registerPomodoro, refreshPomodoroViews } = require('./pomodoro.js');
const {
  CAL_VIEW_TYPE,
  CalendarNoteView,
  attachCalendarEnhance,
  openOwnCalendar,
  closeOwnCalendar,
  isCalendarOpen,
  registerCalendar,
  registerTemplaterBridge,
  runNoteRenameFlow,
} = require('./calendar.js');
const { registerConfigIO } = require('./configio.js');
const { isPopoutWindow, applyPopoutWindowSoon } = require('./pomowin.js');
/* 界面语言：零依赖模块，必须早于 settings.js（其默认值含 uiLang） */
const { setLang } = require('./i18n.js');

/*
 * 模块注册统一入口 —— 新增模块的唯一接入方式。
 *
 * 自带 try/catch + 用户可见提示：任一模块抛错都被就地兜住，
 * 既不会中断 onload，也不会拖垮其余模块（安全红线）。
 * 新增模块只需写 registerModule({ name, register })，
 * 不必再抄一遍 try/catch + console.error + Notice 这堆样板。
 *
 * register() 里只写正常逻辑，抛错由这里统一兜住。
 */
function registerModule(spec) {
  try {
    spec.register();
    return true;
  } catch (e) {
    console.error('[Time Tools] ' + spec.name + '模块注册失败', e);
    try {
      new obsidian.Notice(
        'Time Tools：' + spec.name + '模块加载失败，其余功能不受影响'
      );
    } catch (_) {
      /* Notice 不可用时不得二次抛错，否则 onload 会中断 */
    }
    return false;
  }
}

class TimeToolsPlugin extends obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    /* 界面语言必须在读完设置后立刻应用：否则存了却没生效，表现为重启后仍是中文 */
    setLang(this.settings.uiLang);

    /*
     * 四个模块各自走 registerModule：任一模块出错被就地兜住，
     * 既不中断 onload（否则设置页也不注册，用户会以为插件没装上，
     * 控制台只有一行看不懂的报错），也不影响其余模块。
     */
    registerModule({ name: '时间戳', register: () => registerTimestamp(this) });
    registerModule({ name: '番茄钟', register: () => registerPomodoro(this) });
    // 模块四：日历（修复 Calendar 设置页空白）
    registerModule({ name: '日历', register: () => registerCalendar(this) });
    /*
     * Templater 桥接：三个日历开关都关掉、用 Calendar 原生功能时，
     * Calendar 走核心「日记」插件的模板通道，模板被原样复制、<% %> 不执行。
     * 这里监听新建文件补跑一次 Templater，与那三个开关无关，故独立注册。
     */
    registerModule({
      name: 'Templater 桥接',
      register: () => registerTemplaterBridge(this),
    });
    /*
     * 配置备份：管的是全部模块的设置，不属于任一功能域，故独立成模块。
     * 也不受「时间戳总开关」门控 —— 关了时间戳照样要能备份。
     */
    registerModule({ name: '配置备份', register: () => registerConfigIO(this) });

    // 模块五：time tools 日历视图 + Calendar 增强（均为可选功能，默认关）
    try {
      this.registerView(CAL_VIEW_TYPE, (leaf) => new CalendarNoteView(leaf, this));
      /*
       * 用 checkCallback 而非 callback：
       * 总开关关闭时命令直接从面板消失，而不是点了才报错。
       */
      this.addCommand({
        id: 'time-tools-calendar-open',
        name: '打开日历（可生成日/周/月/年记）',
        checkCallback: (checking) => {
          const c = this.settings.calendar;
          const on = !!c && c.ownCalendarEnabled === true
            // 未允许双开时，增强开着则命令直接隐藏（与 openOwnCalendar 一致）
            && (c.allowBoth === true
              || (c.enhanceCalendarEnabled !== true && c.nativeDayWeek !== true));
          if (!on) return false;
          if (!checking) openOwnCalendar(this);
          return true;
        },
      });
      // 关闭命令：视图曾只能靠禁用插件退出，这里补一条明确退路
      this.addCommand({
        id: 'time-tools-calendar-close',
        name: '关闭日历',
        checkCallback: (checking) => {
          if (!isCalendarOpen(this)) return false;
          if (!checking) {
            const ok = closeOwnCalendar(this);
            if (!ok) new obsidian.Notice('日历视图当前未打开');
          }
          return true;
        },
      });
      attachCalendarEnhance(this);

      /*
       * 批量改名：把老命名（如 2026-09-22-周二）统一成当前「日期格式」。
       * 单独注册、不依赖任何日历开关 —— 命名分裂的人恰恰没开日历。
       */
      this.addCommand({
        id: 'time-tools-notes-rename',
        name: '笔记：把已有笔记改名成当前日期格式（先预览）',
        callback: () => runNoteRenameFlow(this),
      });
    } catch (e) {
      console.error('[Time Tools] time tools 日历注册失败', e);
    }

    // 统一设置页（内部按标签切换两个模块）
    try {
      this.settingTab = new TimeToolsSettingTab(this.app, this);
      this.addSettingTab(this.settingTab);
    } catch (e) {
      console.error('[Time Tools] 设置页注册失败', e);
    }

    /*
     * 工作区操作一律延后到布局就绪之后。
     *
     * 在 onload 里同步跑 refreshXxxViews（内含 detachLeavesOfType）会赶在
     * Obsidian 初始化其他插件之前增删 leaf，干扰其启动，表现为别的插件界面异常
     * （与 Calendar 的冲突即由此而来）。官方也要求这类操作等到 onLayoutReady。
     * 而此时 Obsidian 还在初始化其他插件 ——
     * 在工作区未就绪时增删 leaf，会干扰其他插件的启动，
     * 表现为别的插件界面异常（与 Calendar 的冲突即由此而来）。
     * Obsidian 官方也要求这类操作等到 onLayoutReady。
     */
    const refreshViews = () => {
      try {
        refreshTimestampViews(this);
        refreshPomodoroViews(this);
      } catch (e) {
        console.error('[Time Tools] 视图刷新失败', e);
      }
    };
    // 正常走 onLayoutReady；万一环境没这个 API 就直接执行，不能卡住启动
    if (typeof this.app.workspace.onLayoutReady === 'function') {
      this.app.workspace.onLayoutReady(refreshViews);
    } else {
      refreshViews();
    }
  }

  onunload() {
    /*
     * 卸载路径必须全程不抛错：一旦抛出，Obsidian 的插件关闭流程会中断，
     * 后面要卸载的插件就得不到清理 —— 这正是「禁用本插件后
     * 其他插件反而异常」的典型成因。
     */
    try {
      // 同时清理新旧两种视图类型：v2.0.0 起视图类型加了 time-tools- 前缀，
      // 只清新的会让旧版遗留的 leaf 变成「插件已不再活动」的空面板。
      ['timestamp-inserter-view', 'time-tools-timestamp-view'].forEach((t) =>
        this.app.workspace.detachLeavesOfType(t)
      );
      ['pomodoro-timer-view', 'time-tools-pomodoro-view'].forEach((t) =>
        this.app.workspace.detachLeavesOfType(t)
      );
      this.app.workspace.detachLeavesOfType(CAL_VIEW_TYPE);
      if (this.pomodoro) this.pomodoro.destroy();
      // 撤回记录只在内存，卸载时清空，确保不残留
      clearUndo(this);
    } catch (e) {
      console.error('[Time Tools] 卸载清理失败', e);
    }
  }

  /**
   * 载入并迁移配置。
   * 只在**结构真的变了**时才回写，避免每次启动都写 data.json ——
   * 启动时写盘会与同时初始化的其他插件争抢配置 IO。
   */
  async loadSettings() {
    const raw = await this.loadData();
    this.settings = migrateSettings(raw);
    const before = JSON.stringify(raw || {});
    const after = JSON.stringify(this.settings);
    if (before !== after) await this.saveData(this.settings);
  }

  /**
   * 配置被**别的窗口**改动后自动跟进。
   *
   * 为什么需要：每个窗口各自持有一份 settings 副本，在主窗口改了窗口尺寸或
   * 置顶，独立窗口那份仍是加载时的旧值 —— 否则只能手动跑「重新应用」命令。
   *
   * 用 Obsidian 的 onExternalSettingsChange 回调，不新增任何定时器（安全红线）。
   * 只重载配置 + 重应用窗口属性，不做别的，全程兜错。
   */
  async onExternalSettingsChange() {
    try {
      const raw = await this.loadData();
      if (raw) this.settings = migrateSettings(raw);
      // 只有独立窗口才需要重应用：主窗口改的就是自己这份，本来就是新的
      if (isPopoutWindow()) applyPopoutWindowSoon(this.settings.pomodoro);
      refreshPomodoroViews(this);
    } catch (e) {
      console.warn('[Time Tools] 跟进外部配置变更失败', e);
    }
  }

  /** 任一模块改配置都整体落盘，避免互相覆盖 */
  async saveSettings() {
    await this.saveData(this.settings);
    refreshTimestampViews(this);
    refreshPomodoroViews(this);
  }

  /**
   * 重绘设置页（设置项影响显示内容时使用）。
   *
   * 设置页没显示时不重绘 —— 重建一整页 DOM 只为等下再被丢掉，纯白干活，
   * 而且重建后还要靠滚动恢复机制把位置找回来。
   * containerEl 不存在（测试里的假对象）时按原样重绘，不改变旧行为。
   */
  redrawSettingsTab() {
    const tab = this.settingTab;
    if (!tab) return;
    if (tab.containerEl && tab.containerEl.isConnected === false) return;
    tab.display();
  }

  /**
   * 打开本插件设置页并停在指定标签（浮窗齿轮、命令面板等入口都走这里）。
   *
   * setting.open() 在较新版本返回 Promise，必须等它 resolve 之后再切 tab ——
   * 否则两个动作撞车，表现为「有时候点齿轮没反应」。
   * openTabById 不是所有版本都有，故补一条 openTab 兜底。
   */
  openSettings(tab) {
    const setting = this.app.setting;
    if (!setting) return;
    // 先记下目标标签：Obsidian 稍后调 display() 时会读它
    if (this.settingTab && typeof this.settingTab.focusTab === 'function') {
      this.settingTab.focusTab(tab);
    }

    const activate = () => {
      const s = this.app.setting;
      if (!s) return;
      if (typeof s.open === 'function') s.open();
      if (!this.settingTab) return;
      // 已经停在我们这一页就别再切，省一次重绘
      if (s.activeTab === this.settingTab) return;
      if (typeof s.openTabById === 'function' && this.manifest) {
        s.openTabById(this.manifest.id);
        return;
      }
      // 老版本没有 openTabById，退回按 tab 对象切换
      if (typeof s.openTab === 'function') {
        s.openTab(this.settingTab);
        return;
      }
      if (typeof this.settingTab.display === 'function') this.settingTab.display();
    };

    let opening = null;
    try {
      opening = setting.open();
    } catch (e) {
      opening = null;
    }
    // open() 返回 Promise 时等它完成；失败也照样走 activate
    if (opening && typeof opening.then === 'function') {
      opening.then(activate, activate);
    } else {
      activate();
    }
    // 兜底再来一次：老版本切 tab 是异步的，第一遍可能还没挂上
    setTimeout(activate, 60);
  }

  /* ---------------- 以下为时间戳模块所需的方法 ---------------- */

  /** 按 moment 格式串格式化当前时间，格式非法时降级为提示文案 */
  formatWith(format) {
    try {
      return obsidian.moment().format(format);
    } catch (e) {
      return '格式无效';
    }
  }

  formatNow() {
    return this.formatWith(this.settings.timestamp.format);
  }

  /** 在光标处插入时间戳；有选区时替换选区 */
  insertIntoEditor(editor) {
    if (!editor) {
      new obsidian.Notice('没有正在编辑的笔记');
      return;
    }
    const text = this.formatNow() + (this.settings.timestamp.insertNewline ? '\n' : '');
    editor.replaceSelection(text);
  }

  /** 取当前活动编辑器：优先 activeEditor，回退 MarkdownView */
  insertTimestamp() {
    const editor = this.getActiveEditor();
    if (!editor) {
      new obsidian.Notice('请先打开一个笔记，再把光标放到要插入的位置');
      return;
    }
    this.insertIntoEditor(editor);
  }

  getActiveEditor() {
    const active = this.app.workspace.activeEditor;
    if (active && active.editor) return active.editor;
    const mdView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
    if (mdView && mdView.editor) return mdView.editor;
    return null;
  }

  async activateTimestampView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType('timestamp-inserter-view')[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: 'timestamp-inserter-view', active: true });
    }
    workspace.revealLeaf(leaf);
  }
}

module.exports = TimeToolsPlugin;
// 测试钩子：让回归测试能直接对构建产物验证弹窗行为
module.exports.__testModals = require('./pomodoro.js').__testModals;
module.exports.__testFloatUI = require('./pomodoro.js').__testFloatUI;
// 测试钩子：会话记录总开关的渲染与闸门，_test/recording.js 直接对产物做回归
module.exports.__testRecord = require('./pomodoro.js');
// 测试钩子：记录模板渲染（默认模板必须跟随「记录到秒」开关）
module.exports.__testRenderTemplate = require('./recorder.js').renderTemplate;

  };


  var __out = load('src/main.js', 'src/main.js');
  if (typeof module !== 'undefined' && module.exports) module.exports = __out;
  else if (typeof globalThis !== 'undefined') globalThis.__TimeToolsPlugin = __out;
})();
