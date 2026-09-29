# Time Tools (Timestamps + Pomodoro)

An Obsidian plugin with two modules: a **timestamp inserter** and a **Pomodoro timer**.
Both share one plugin identity and one settings file, switched by tabs inside the settings page.

Plugin ID: `time-tools`

Two things you can do:

- **Timestamps** — insert the current time at the cursor, and convert time text you already
  wrote (`2026-09-19` → `3 days ago`, → `[[2026-09-19]]`, → lunar calendar, and more).
- **Pomodoro** — a draggable timer with per-scenario duration profiles, count-up mode,
  session logging, and cumulative statistics.

> **Developers / AI:** see [`ARCHITECTURE.md`](ARCHITECTURE.md) for project structure, state
> machine, config schema, naming conventions, performance constraints and modification guide.

---

## 1. Installation

1. **Close Obsidian** (or disable the old version first). **Check for a leftover folder:**
   open `your-vault/.obsidian/plugins/`. If a `pomodoro-plugin` folder exists, open its
   `manifest.json` and look at the `id` line:

   - `id` is `time-tools` → this is **an old copy of this plugin**. Delete the whole folder.
     Two folders claiming the same id means Obsidian picks one by load order, which shows up
     as "my setting changes don't take effect" or "the command doesn't match the version".
   - `id` is something else → unrelated to this plugin, no need to delete. But it is also a
     Pomodoro plugin, so keeping both enabled gives you two sets of commands — your call.

   If you want to keep the old config, copy `data.json` out of the old folder first.

2. Rename the whole folder to `time-tools` and put it in `your-vault/.obsidian/plugins/`.
3. Start Obsidian → Settings → Community plugins → find **Time Tools** → enable.

> The folder name should match the plugin ID `time-tools`. If it doesn't, the plugin still
> loads, but some callbacks (such as `onExternalSettingsChange`) won't fire.
> Upgrading from the old `timestamp-inserter`: the plugin ID has changed, so Obsidian treats
> this as a new plugin and **old settings will not carry over** — configure it again.

### Config backup and migration

Before switching devices or reinstalling, run **"Export config"** from the command palette.
All settings are written to `time-tools-config-backup.json` at the vault root.
**Fixed filename, overwritten each time** — only the latest copy is kept, so it never piles up.
Copy and rename it yourself if you want to keep several.

After installing the plugin in the new environment, run **"Import config"** and **paste the
whole JSON** into the box (paste, not "choose file"). Import goes through the same whitelist
check as startup: **obsolete fields from older versions, wrong types, and invalid values are
cleaned out** automatically, so no dirty data reaches the runtime. On failure the current
config is left untouched and the message tells you which step failed.

Both commands work even when the Timestamps master switch is off.

---

## 2. Timestamp module

Inserts the current time at the cursor, with a customizable format (presets + custom syntax).

### Extended: time text conversion

An extension under the timestamp module, **enabled by default**. Select a piece of text and
run **"Timestamp: Convert selected time text"** to turn it into another time expression:

| Selected | Conversion | Result |
|---|---|---|
| `2026-09-19` | To relative time | `3 days ago` |
| `2026-09-19` | Add weekday (appended, keeps time) | `2026-09-19 Sat` |
| `2026-09-19` | To journal link | `[[2026-09-19]]` |
| `1768800000` | Timestamp → date | rendered with your time format |
| `2026-09-19` | Date → timestamp | `1789689600` |
| `2026-09-19` | Date offset | enter `+7` → `2026-09-26` |
| `2026-09-19` | To lunar | `lunar 2026-08-09` |
| `2026-09-19` | Lunar + ganzhi/zodiac | `lunar 2026-08-09 · Bingwu, Year of the Horse` |
| `2026-02-04` | Solar term | `Start of Spring` |
| `八月十九` | Lunar → solar | `2026-09-29` |

Recognized inputs include `2026-09-19`, `2026/9/19`, `2026年9月19日`, `2026-09-19 14:30`,
10- or 13-digit Unix timestamps, and `14:30`.

Three entries (if the command palette search fails, use the last two):

1. Command palette → search "time conversion"
2. **Editor right-click menu** → select text → right-click → "🔄 Time conversion" (most direct)

Every item in the panel shows a **live result preview**; click **Apply** when you're happy.
Only the selection is replaced — nothing else in the note is touched.

**Recognized forms:**

| Form | Handling |
|---|---|
| `2026-09-19`, `2026/9/19`, `2026年9月19日` | full date, may include time |
| `2026 09-19`, `2026 09 19`, `2026-09 19` | mixed separators, spaces |
| `2026.09.19`, `2026_09_19`, `20260919` | dots, underscores, compact 8-digit |
| `09-17`, `9/17`, `9月17日`, `09 17` | current year filled in |
| `14:30`, `14:30:25` | today's date filled in, seconds kept |
| `1768800000` | Unix timestamp |
| `[[2026-09-19]]` | journal link |
| `2026-09-19 Sat` | date with weekday |
| `3 days ago`, `7 days later` | relative time |
| `two days later` (Chinese numerals) | 一/二/两/…/十/二十/一百 |
| `the day before yesterday`, `last week` | inverted forms |
| `the 2nd day`, `the 7th day after` | ordinals |
| `tomorrow 5pm`, `yesterday 3pm` | colloquial day + time of day |
| `this morning`, `tonight`, `tomorrow morning` | day prefix + time of day |
| `Monday`–`Sunday`, `this Monday`, `last Friday` | weekdays |
| `end of month`, `start of year` | month/year boundaries |
| `8am`, `7:30pm` | time of day + hour |
| `in half an hour`, `in a quarter of an hour` | special quantifiers |
| `this morning`, `next Monday`, `in 3 days`, `3 days ago` | English |
| `五月十六号`, `八月十九` | Chinese numerals → lunar by default |
| `五月十六日` | with 日 → solar by default |
| `5月16号` | Arabic digits → solar |
| `now`, `at present` | inserts the current timestamp |
| `tomorrow`, `the day after tomorrow`, `yesterday` | colloquial relative days |
| `next month`, `last year` | week/month/year offsets |
| `yesterday`, `today`, `tomorrow`, `next week` | English relative days |
| `Dec next year`, `Wed of week 49` | composite expressions |
| `Start of Spring` | the 24 solar terms (needs lunar enabled) |
| `丙午`, `丙午马年` | ganzhi (needs lunar enabled) |

**Unified format** (on by default, first item under Common): normalizes the recognized time
into one format. Works with `2026年五月十六`, `2026-09-19`, `tomorrow`, weekdays, composite
expressions and more. Set the format string in settings; **leave it empty to follow the
timestamp format above**. If unsure, just copy the format from the box above
(e.g. `YYYY-MM-DD`, `YYYY年MM月DD日`).

**Calendar markers**: write 农历 / 阴历 before a date for lunar, 阳历 / 公历 for solar — the
marker is explicit, so nothing is left to guessing. A marker written **after** the date
(e.g. `2026年八月初九 农历`) is not converted by default; turn on
"Recognize a trailing marker too" under the lunar section if you want it.

**Enable lunar** (master switch, on by default): when off, **every date is treated as solar**
— conversions to lunar, ganzhi/zodiac, solar terms and lunar→solar all stop working, and the
sub-switches below stop working too.

**Chinese numerals mean lunar** (off by default): when off, `五月十六` and `五月十六号` are
lunar while forms ending in 日 (`五月十六日`) are solar. When on, uppercase Chinese numerals are
always lunar and Arabic digits always solar.

**Treat day-suffix forms as lunar** (off by default): when on, anything ending in 号 or 日 is
treated as lunar. Uppercase Chinese numerals are unaffected and stay lunar.

**Composite expressions**: year + month + Nth week + weekday + time of day + hour combine
freely; each part can be omitted, and 的 can be inserted between them.

**Week starts on** is changeable in Advanced settings (follow system locale / Monday / Sunday).
It affects the starting point of "Nth week" calculations.

**Time-of-day words alone are not converted by default** — there is no agreed hour for "morning",
and inventing one would be making things up. Forms that already carry a time (`8am`) always work.
To convert them standalone, turn on "Convert period names on their own" in Advanced settings
and set the hours yourself.

Separators can be mixed freely: `2026 09-19`, `2026/09-19`, `2026_09_19`, `20260919` all work.
Invalid dates (e.g. `2026-02-30`, `2026-13-01`) are rejected — no wrong result is produced.

**Relative time with a reference**: the panel has a "relative base" input at the top; empty
means now. The result states what it is relative to, and **when the base is "now" the current
time is included** (e.g. `14 days later (relative to now 2026-09-19 23:48)`) — otherwise you
can't tell later what "now" was. That note can be turned off in settings (on by default).

**Settings page has five sections**: Common (forward ⇄ reverse), Lunar (forward ⇄ reverse),
Festival (forward ⇄ reverse), **Countdown / date difference** (off by default), and Advanced
(separate directions, collapse, base note, append, journal link format). The Advanced section
is collapsible.

**22 conversions, merged into 14 switches on screen** (the eight forward/reverse pairs each
become one):

| Merged switch | Controls both |
|---|---|
| Relative time ⇄ Date | to relative time + relative time → date |
| Weekday ⇄ Date | add weekday + strip weekday |
| Journal link ⇄ Date | to journal link + link → date |
| Unix timestamp ⇄ Date | date → timestamp + timestamp → date |
| Lunar ⇄ Solar | to lunar + lunar → solar |
| Ganzhi/zodiac ⇄ Year | lunar + ganzhi + ganzhi → year |
| Solar term ⇄ Date | solar term + term → date |
| Festival ⇄ Date | date → festival + festival → date |

Standalone (no reverse): date offset, complete date, extract time.

**Show seconds** (off by default): when off, all time output stops at minutes and seconds in
the format string are dropped. On keeps seconds. ⚠️ Off by default means inserted timestamps
carry no seconds.

**With no selection** (cursor sitting on a date), the time on the cursor's line is auto-detected.
Where the result goes is decided by a setting:

| Setting | Default | Behavior |
|---|---|---|
| With no selection: append after the original | Off | Off = the result **replaces** the original; On = original kept, result appended |

This only affects auto-detection; a manual selection is always replaced. If a line holds
several dates, the one under the cursor is used.

**Batch conversion (whole note)**: when dates are scattered across a note, run
**"Timestamp: Batch convert (whole note)"** from the command palette. Pick one enabled
conversion, preview all recognized positions (up to 200), then replace them all at once.
Ctrl+Z reverts. Disabled conversions don't appear in the list. Positions that can't convert
are left as-is.

### Festival support

Two conversions, hanging off the extended conversion feature. Select text → search
"time conversion" → Apply.

| Conversion | Input | Output (default) |
|---|---|---|
| Date → festival | `2026-10-01` | `National Day 2026-10-01` |
| Festival → date | `Mid-Autumn` | `Mid-Autumn 2026-09-25` |

**Built-in festivals** come in two kinds: fixed solar dates (New Year 01-01, National Day
10-01, Labour Day 05-01 …) and floating lunar dates (Spring Festival, Lantern, Dragon Boat,
Qixi, Zhongyuan, Mid-Autumn, Double Ninth, Laba, Little New Year, New Year's Eve).
Lunar festival dates are **computed per year** (leap months matter), not looked up in a fixed
table — "New Year's Eve" is the last day of the 12th lunar month, so a year whose 12th month
has only 29 days simply has no "30th".

**Output shape** is controlled by "Festival name with date" (on by default):

| Switch | Date → festival | Festival → date |
|---|---|---|
| On (default) | `National Day 2026-10-01` | `Mid-Autumn 2026-09-25` |
| Off | `National Day` | `2026-09-25` |

**Custom festivals**: Settings → Timestamps → Festival → Custom festivals. One per line,
`name = date`:

```
Mom's birthday = 10-15        solar, repeats yearly
Company party = 2026-12-31    solar, that year only
Guanyin's birthday = 农历二月十九   lunar, follows the lunar calendar
Mother's Day = 5月第2个周日       Nth weekday of the month
Thanksgiving = 11月最后一个周四     last weekday of the month
Some day = 11月倒数第2个周四       Nth-from-last weekday
Mother's Day = 5-10            names may contain spaces; English works too
```

> "Last" and "Nth from last" can't be guessed by counting — month lengths vary (28/29/30/31),
> and in some years the 4th is not the last.
>
> English festival names (with spaces) are supported from v3.22. **English date forms**
> (such as `2nd Sunday of May`) are **not supported** — write `5-10` instead.

Separators `=` `:` `：` `,` `，` all work. Custom festivals **take priority over built-ins**
(same name overrides the built-in date) and convert in both directions. Unrecognized lines are
skipped, and the count of recognized entries shows live below.

Cross-year rule: if this year's date has passed, the next year's is used (saying "New Year's
Day" in December gives next year's 01-01); on the exact day it doesn't jump.
Custom festivals with a year don't shift.

### Lunar support

Four items under the extended conversion feature:

| Conversion | Input | Output | Default |
|---|---|---|---|
| To lunar | `2026-09-19` | `lunar 2026-08-09` | On |
| Lunar + ganzhi/zodiac | `2026-09-19` | `lunar 2026-08-09 · Bingwu, Horse` | Off |
| Solar term | `2026-02-04` | `Start of Spring` | Off |
| Lunar → solar | `八月十九` | `2026-09-29` | On (shares one switch with "to lunar") |

Only the "to lunar" pair is on by default because it is the only high-frequency, unambiguous
one. Solar terms and ganzhi/zodiac are rarer and produce longer output, so they wait for you
to enable them. Disabled items don't appear in the panel.

**Solar → lunar**: select any recognizable date; the recognized forms match the rest of the
conversion panel (`2026-09-19`, `2026/9/19`, `2026年9月19日`, …).

**Lunar → solar** input forms:

| Form | Note |
|---|---|
| `2026年八月十九` | with year, most explicit |
| `八月十九` | no year, resolved against the **current lunar year** |
| `农历2026年八月初一` | may carry the 农历 prefix |
| `2023年闰二月初五` | leap month form |
| `腊月初八`, `冬月初一` | 腊月 = 12th month, 冬月 = 11th |
| `二〇二六年八月十九` | Chinese numeral year |
| `八月二十`, `八月三十` | special forms like twenty/thirty recognized |

**Leap months** follow the actual year. For example, 2023 has a leap 2nd month, so selecting
`2023-03-22` gives `lunar 2023 leap 2nd month, day 1`, and entering `2023年闰二月初五` converts
back correctly. If you mark a leap month that the year doesn't actually have, the item returns
empty and hides itself — no wrong result.

**Ganzhi and zodiac** follow the lunar year: 2026 Bingwu Horse, 2024 Jiachen Dragon,
2020 Gengzi Rat, 1984 Jiazi Rat.

**Solar terms** are computed for Beijing time (UTC+8) using the sun's apparent ecliptic
longitude, accurate to within 15 minutes. If a day isn't a solar term, that item doesn't appear.

#### Range and boundaries

| Item | Note |
|---|---|
| Supported range | **1900–2100**. Outside it, lunar items hide themselves instead of returning errors |
| Algorithm | fixed lookup table (201 year codes, ~2KB) + astronomical longitude for solar terms |
| Boundary case | lunar 2100's 12th month maps to solar January 2101, beyond the table, so it can't be cross-checked |
| Data growth | the lunar table is a **fixed constant in code** — not written to `data.json`, doesn't accumulate with use, no cache files |

#### How to verify a result

Cross-check with known Spring Festival dates:

| Solar | Should be |
|---|---|
| 2026-02-17 | lunar 2026, 1st month, day 1 |
| 2025-01-29 | lunar 2025, 1st month, day 1 |
| 2024-02-10 | lunar 2024, 1st month, day 1 |
| 2020-01-25 | lunar 2020, 1st month, day 1 |

And in reverse: `lunar 2026, 1st month, day 1` should convert back to `2026-02-17`.

### Undo a conversion

Converting replaces the original (`五月十六` → `2026-06-30`). Use this to **restore it in one
step** if you change your mind.

**Four ways, any of them:**

| Way | When to use | Availability |
|---|---|---|
| Click the icon after the result | most direct when the icon shows | depends on editor decoration, best effort |
| Status bar icon + number | to see how many are left, click to undo the latest one | **no decoration needed, always shown** |
| Command palette → "Timestamp: Undo last time conversion" | when the icon isn't showing | **always available** |
| System Ctrl+Z | immediately after converting | system capability |

How they relate: Ctrl+Z is easiest, but if you edited elsewhere after converting, it has to
rewind all the way back and will undo those edits too. The command, status bar, and icon use
the plugin's own records and **jump straight to that conversion**, leaving other edits alone.
**The status bar and command are the main paths**; the icon is only an in-place enhancement —
a missing icon does not mean undo is broken.

**Status bar indicator**: at the bottom of the Obsidian window it shows "icon + number N",
where N is how many conversions are still undoable in the **current note**. Click to undo the
latest one; it hides itself when the count is 0 or the switch is off. The number follows the
note you switch to (records are kept per note). The icon is built-in SVG, not a `↩` character —
`↩` is only a fallback when the badge can't be drawn.

**What clicking restores** depends on the mode used when converting:

| Mode when converting | Text after converting | After clicking |
|---|---|---|
| Replace (default) | `2026-06-30` | `五月十六` |
| Append | `due tomorrow 2026-09-21` | `due tomorrow` |

In append mode the leading space is removed too, so no lone space is left behind. Clicking
locates through the **record layer** (line number + text search), not the decoration position,
so it stays accurate even when the decoration misbehaves.

**Records live in memory only, never on disk**: recorded as soon as a conversion completes; a
note can hold several, undone one at a time. **Closing Obsidian clears all records for that
session** — the icons disappear and undo is no longer possible.

This avoids "dead buttons": the record holds the original text, so if it were stored in the
note or in `data.json`, the icon would still be there next time while the context needed to
restore it had changed — an icon that's there but does nothing. Icon and record must share one
lifecycle. **Don't expect to undo the next day** — for long-term reversibility, use append mode
so the original text is kept.

**Switch**: Settings → Timestamps → Advanced → "Show an undo marker after converting"
(on by default).

| State | Behavior |
|---|---|
| On | icon shows after converting, clickable, command also works |
| Off | no icon, and **no recording** — the command says "undo marker is off" |

Turning it off **stops the whole undo feature**, not just hiding the icon: no recording means
no memory use and no button that does nothing when clicked.

**The icon is not customizable**: early versions let you set your own character (e.g. `↩`);
that was removed because custom characters depend on fonts and show nothing when a glyph is
missing — "switch on but no icon". It now uses built-in SVG, font-independent and consistent.

**Capacity limits** (to stop unbounded growth; you won't hit them): up to 100 per note and 50
notes; the oldest is dropped when exceeded (icon cleared with it), new conversions still record.

**Edge cases:**

| Case | Behavior |
|---|---|
| The converted line was heavily rewritten | find by text first, then by whole line; **refuses when the whole line matches in several places** (taking the first would write the replacement somewhere else); if nothing matches, marks it `unresolvable` and **keeps the record** — clearing middle records during out-of-order undo would make that conversion permanently irreversible |
| Text inserted before shifted the position | located by text, not coordinates |
| Several conversions in one note | independent; click icons one by one, or use the command for the latest |
| Switched to another note | the command only undoes the **current note**'s |
| Manual selection vs cursor auto-detect | both undoable, same behavior |

**If the icon doesn't show**: first check the status bar for "icon + number" — if it's there,
recording is fine and undo isn't broken. Then verify with the command palette. For the cause,
check the console (`lastUndoFailReason` holds the latest failure reason). Common causes:
`@codemirror` can't be required, the CM6 extension wasn't built, the decoration wasn't written
into that editor instance. **Either way, the status bar and command undo normally.**

---

## 3. Calendar module

A self-built calendar view, **off by default**. Turn on the master switch under
Settings → Calendar.

- **Dots**: the dot under each cell = that day's journal word count ÷ "words per dot"
  (default 250, max 10 dots). The dot in the week column reads the **weekly note's own** word
  count, not the sum of 7 daily notes.
- **Highlight**: today keeps only a border; the currently open note fills the whole cell.
  The two don't conflict.
- **Week starts on** has one source only: it follows `calendar.weekStart` (system locale).
  No separate switch.

### Storage location and date format

- Daily / weekly / monthly / yearly notes share one config. **"New note location" is a literal
  string** — what you type is what you get; `YYYY`/`MM` are not substituted for the year/month.
  To split by year or month, write it in the **date format**, e.g. `YYYY/MM/YYYY-MM-DD`.
- Templates **prefer Templater**. If Templater is unavailable it reports the error honestly and
  gives a download link; the built-in template is used only when "Fall back to the built-in
  template" is on (off by default) — no silent downgrade.

### Relationship with the Calendar plugin

Compatibility items such as "Fix Calendar settings page blank" are **off by default**, and the
two enhancement approaches are mutually exclusive (turning one on turns the other off).

---

## 4. Pomodoro module

### Cycle rules

- One round = focus + short break (durations come from the selected profile)
- Every **4 rounds** a dialog asks whether to take a long break — it **never enters automatically**
- No round limit by default; it runs until you click End
- After a long break the count resets to zero by default
- **Closing Obsidian resets the count.** Reopening restores settings but doesn't resume timing

### Duration profiles (presets + custom)

Focus/break durations saved per scenario. Three built-in profiles:

| Profile | Focus | Short break | Long break |
|---|---|---|---|
| Work | 40 | 10 | 90 |
| Study | 25 | 5 | 15 |
| Reading | 30 | 3 | 10 |

Under Settings → Duration profiles you can switch the current profile, **create**, **delete**,
rename, and change the three durations. The start panel also lets you pick one for this session.

### Start panel

```
🍅 Ready to start
How many rounds do you think this task needs? (focus + break = one round)

Duration profile  [Study (25/5/15) ▾]
Rounds            [____]

[Unlimited]  [Start]
```

### Auto / manual mode

Setting "Auto-start the next segment":

- **On** (default): focus flows into the break automatically, and the break into the next focus
- **Off (manual)**: each segment ends at "idle", showing what's next; click Start break /
  Start focus to continue, or Skip to jump ahead

Manual mode suits people who want to control the rhythm themselves or handle other things
in between.

### Pause prompt

When pauses within one segment reach the threshold (default 3), a dialog appears:

```
🍅 Paused several times this round
Paused 3 times, 12:30 of focus left. Restart this round?

[Restart round]  [Continue current progress]
```

- **Restart round**: the whole segment times from zero; elapsed time is discarded
- **Continue current progress**: keeps the remaining time and goes on

The threshold is changeable in settings.

### Count-up (off by default)

When on, the **focus segment** counts up from 0 and **never ends by itself** — you stop it with
Skip or by ending the session. It only affects focus segments; breaks are fixed-length recovery,
where counting up would be meaningless.

| Setting | Effect |
|---|---|
| **Count-up** | master switch, off by default |
| **Soft target (min)** | notifies and rings once at this minute, **without stopping** the timer. 0 = no reminder |
| **Limit (min)** | auto-stops and prompts at this many accumulated minutes, default 1440 (24h). **The segment that hits the cap is not counted in stats**; start over to continue. 0 = no limit |
| **Interval reminder (min)** | reminds at each multiple (20 → at the 20th, 40th, 60th minute…). 0 = off |

You **can't switch on a segment that's already running** — the displayed number would jump from
"remaining" to "elapsed", and one number read two ways is enough to make you think the timer broke.

On the "🍅 Ready to start" panel, switching to count-up reveals the **soft target** and
**interval reminder** inputs so you don't have to go to the settings page — people who use
count-up usually rely on those two reminders. Under count-down they collapse (the segment ends
on time, so they'd never trigger).

Ways to switch (all visible when idle):

- The **＋ / －** buttons on the floating window / sidebar (＋ = count-up, － = count-down)
- The "Count-up / Count-down" button pair on the start panel; the active one is lit
- Command palette → "Pomodoro: toggle count-up" (affects the next segment only)

Past one hour, an hours field is added (`1:05:30`) rather than showing `65:30`.
If the floating window can't fit it, lower `--pomo-time-size` or raise `--pomo-width`.

Recording differs from count-down: **skipping in count-up still records the duration** (there's
no such thing as "not finished" — however long you go is how long the segment was), it just
doesn't count toward "skip count".

### Four entries

| Entry | Usage |
|---|---|
| Slash command | **off by default** (`/` is a shared resource, to avoid clashing with Templater etc.). When on, type `/pomodoro` → click the suggestion (trigger word is changeable) |
| Floating window | appears after starting; draggable to **top / bottom / left / right** |
| Status bar | persistent `🍅 25:00` at the bottom; click to bring back a hidden window |
| Command palette | "Pomodoro: start / pause / skip / end / next segment / show hidden timer / open settings" |

### Floating window controls

- Drag the title bar to move
- `⚙` opens Pomodoro settings
- `—` minimize (shrinks to a `🍅 25:00` badge)
- `×` hide (**timing continues**; click the status bar to bring it back)

### Dragging and snapping

Setting **"Snap to an edge after dragging"**:

- **On** (default): snaps to the nearest edge on release, remembering the edge and position along it
- **Off**: stays where you released it; position recorded as a viewport ratio so it won't leave
  the screen when the window resizes

### Notification sound

Setting "Sound source":

- **Built-in tone** (default): synthesized by the system, no files needed
- **Custom folder**: a vault folder path (e.g. `sounds/alerts`); the plugin scans it and plays
  audio files in order when a segment ends

Supports `.mp3 / .wav / .ogg / .m4a / .flac / .aac`. Click "Rescan" to see how many files were
found; a wrong path or no files falls back to the built-in tone.

### Session summary

```
🍅 Pomodoro session finished
2 rounds done · 0 long breaks
┌──────────────────────────────┐
│ Focus 50 min · break 10 min   │
│ Paused 2 times                │
│ 17:34 – 18:24                 │
│ Skipped, not counted: 1 focus │
└──────────────────────────────┘
────────────────────────────────
[Log]              [Again] [OK]
 blue                 gray   purple
```

Bottom buttons: **Log** on the far left (blue), **Again** and **OK** grouped on the right.

| Button | Effect |
|---|---|
| **Log** (blue) | logs once immediately using the configured method. Only shows when the master switch is on |
| **Again** (gray) | closes and reopens the start panel for the next round |
| **OK** (purple) | closes; if auto-logging is on, it writes after closing |

**Skipped** segments don't count toward focus/break time; they're listed separately in the
summary (that line is hidden when nothing was skipped).

### Cumulative statistics

To see "how long did I focus today" or "in total", run **"Pomodoro: view accumulated stats"**
from the command palette. Where the data comes from is your choice under
"Cumulative stats source":

| Option | How it reads | Notes |
|---|---|---|
| **Off** (default) | — | stores nothing |
| This device | the plugin keeps its own tally | exact, but lost if you switch devices or clear settings |
| Parse notes | reads your session-log notes on the fly | durable, but inaccurate if you changed the write format |
| **Custom location** | reads one note or folder you specify | location is yours, decoupled from the default log note |

With "Off", the command tells you to pick a source first — it won't fake a zero.

**Custom location**: after choosing it, fill in the path below — either one note
(e.g. `stats/focus.md`) or a folder (e.g. `stats`, which covers every `.md` inside).
This field only expands when "Custom location" is selected; it collapses for other sources.
A wrong or empty path gives an explicit "nothing read" message, never a silent 0.

Statistics recognize three duration forms: `1 hour 30 min 20 sec`, `25 min 30 sec`, `45 sec`.
So enabling "record to seconds", or a count-up session past one hour, won't lose any time.

**DataView integration** (off by default): Settings → Pomodoro → "DataView integration".
When on, writing a session log appends inline fields at the end according to the field table,
for your own dataview queries. When off, not one extra character is written.
You need the DataView plugin installed to query them — if it isn't detected after enabling,
the settings page shows a yellow note under the item (fields are still written; install it to query).

The field table is **one field per line**, `fieldname::{{VALUE:variablename}}`, field names
freely editable:

```
log date::{{VALUE:date}}
how many pauses::{{VALUE:pauses}}
```

Only "focus duration" is on by default (`专注时长::{{VALUE:focusText}}`); add the rest yourself.
Clearing it writes nothing. Available variables:

| Variable | Meaning | Variable | Meaning |
|---|---|---|---|
| `date` | date | `focusText` | focus duration with unit (follows "record to seconds") |
| `time` | end time | `restText` | break duration with unit |
| `range` | time range | `pauses` | pause count |
| `cycles` | rounds | `longBreaks` | long break count |
| `focus` | focus minutes | `skippedFocus` | skipped focus count |
| `rest` | break minutes | `skippedBreak` | skipped break count |
| `profile` | profile name | | |

"This device" stores only a few fixed fields, and **resets "today" at the day boundary** before
accumulating again rather than stacking entries by date — so no obsolete data piles up over time.

---

## 5. Session log module

When a Pomodoro session ends, the result can be written out. This is a **standalone module**
with a master switch.

### Master switch and auto-logging

| Setting | Effect |
|---|---|
| **Enable session logging** | master switch, **on by default**. When off nothing is logged: the end dialog no longer shows the Log button and all log settings below collapse (values kept; reopening restores them) |
| **Record automatically** | on: logs automatically when a session ends. Off: only the manual Log button logs |
| **Record down to the second** | **off by default** (records by minute). On records to the second, e.g. "focus 25 min 30 sec". Shared by count-up and count-down |

Turning the master switch off asks for confirmation first and spells out the consequences,
because it stops a whole block of features at once and mis-clicking is costly:

- sessions no longer log automatically
- the end dialog no longer shows the Log button
- log settings below collapse

Records already written to notes are unaffected, and all setting values are kept.
The master switch stays on the first line of the session-log section, separated from what's
above; collapsing only affects the settings below it.

Once on, there are three write modes:

### Mode 1: Built-in write

Check "Log this result" in the end dialog; a note-name input appears (prefilled with the default
name, editable for this run):

- Note **exists** → content is inserted at the **very top**; if the note has frontmatter it goes
  after the frontmatter, leaving the YAML intact
- Note **doesn't exist** → created (including parent folders), then written

Default content:

```markdown
#### 🍅 2026-09-19 17:34 – 18:24
- 2 rounds done · 0 long breaks
- Focus 50 min · break 10 min · paused 2 times
- Skipped, not counted: 1 focus segment
- Profile: Study
```

The template is editable in settings. Placeholders:

| Placeholder | Meaning |
|---|---|
| `{{date}}` | date |
| `{{time}}` | end time |
| `{{range}}` | time range |
| `{{cycles}}` | rounds completed |
| `{{focus}}` | total focus minutes (integer, unaffected by "record to seconds") |
| `{{rest}}` | total break minutes (same) |
| `{{focusText}}` | focus duration with unit; precision follows "record to seconds" |
| `{{restText}}` | break duration with unit; same precision |
| `{{pauses}}` | pause count |
| `{{longBreaks}}` | long break count |
| `{{profile}}` | duration profile used |
| `{{skippedLine}}` | skipped line (empty when nothing was skipped) |

### Mode 2: With QuickAdd

Choose "With QuickAdd" and fill in the **choice name** from QuickAdd. When a session ends the
plugin calls `executeChoice(name, variables)`, passing this session's data as variables — where
and how it's written is entirely up to your QuickAdd choice.

Use these variables inside QuickAdd's Capture / Template:

| Variable | Meaning |
|---|---|
| `{{VALUE}}` | one-line summary, e.g. `🍅 2 rounds · focus 50 min · break 10 min · paused 2 (17:34 – 18:24)` |
| `{{VALUE:content}}` | full text generated from the built-in template |
| `{{VALUE:date}}` | date |
| `{{VALUE:time}}` | end time |
| `{{VALUE:range}}` | time range |
| `{{VALUE:cycles}}` | rounds completed |
| `{{VALUE:focus}}` | total focus minutes |
| `{{VALUE:rest}}` | total break minutes |
| `{{VALUE:focusText}}` | focus duration with unit; follows "record to seconds" |
| `{{VALUE:restText}}` | break duration with unit; same |
| `{{VALUE:pauses}}` | pause count |
| `{{VALUE:longBreaks}}` | long break count |
| `{{VALUE:skippedFocus}}` | skipped focus segments |
| `{{VALUE:skippedBreak}}` | skipped break segments |
| `{{VALUE:profile}}` | duration profile |

> **Capture vs Template**: in Capture, `{{VALUE}}` is **the content written**; in Template it
> is **the new note's filename**. So Capture can use `{{VALUE}}` directly, while Template should
> be assembled from named variables.

### Mode 3: Copy to clipboard only

Touches no plugin and no file: the result text goes to the clipboard when a session ends, and
you paste it with `Ctrl+V` wherever you like. Good if you don't want to configure QuickAdd but
still want to decide where it goes.

### When QuickAdd gets no data

If QuickAdd still pops up a "Text to capture" box, its Format has no variables. Three fixes:

1. **Auto-fill**: put `{{VALUE}}` in the Capture's Format and the result is brought in.
   The settings page has a "copy `{{VALUE}}`" button — click it and paste
2. **Auto-copy**: the setting "Copy to clipboard before running" is on by default — the result
   goes to the clipboard before QuickAdd is called, so if it still prompts, `Ctrl+V` fills it
3. **Clipboard only**: choose "Copy to clipboard only" and bypass QuickAdd entirely

### Troubleshooting the QuickAdd link

The settings page has a **Test run** button that runs once with sample data and tells you
exactly why it failed:

| Message | Meaning | What to do |
|---|---|---|
| QuickAdd plugin not detected | not installed or not enabled | install and enable it from community plugins |
| `executeChoice` not exposed | QuickAdd version too old | update QuickAdd |
| Choice "X" not found. Available: A, B | **name doesn't match** | pick from the "choose an existing choice" dropdown, don't type it |
| Execution error: xxx | the choice itself errored | fix the QuickAdd config as prompted |

The **"choose an existing choice" dropdown reads recursively**, including:

- top-level choices
- **sub-choices inside Multi**
- **NestedChoice inside Macro**

So even if your Capture is nested inside a Multi like "My inbox", you can still pick it.

**"Strictly validate choice name" is off by default.** Some QuickAdd versions expose an
incomplete config structure, so with it off the plugin still tries to run even when the name
isn't in the list, rather than needlessly falling back to the built-in write. Turn it on once
you're sure the list is accurate.

### When the link fails

Setting **"Fall back to built-in write"**, **on by default**:

| Switch | Behavior when QuickAdd is unusable |
|---|---|
| **On** (default) | switches to built-in write into the note named by "default note name" — **the record isn't lost** |
| Off | nothing is logged, only a failure notice. For when you don't want logs dirtying your notes |

When QuickAdd itself succeeds, this switch changes nothing.

---

## 6. Pomodoro settings at a glance

| Group | Items |
|---|---|
| Duration profiles | current profile, create / delete, profile name, focus / short break / long break |
| Rhythm | long break interval, auto-start next segment, counting after a long break, timing after declining a long break, pause prompt threshold |
| Interface | interface mode, snap to edge after dragging, default snap edge, show left sidebar icon |
| Reminders | segment end notification, **guard dialogs against accidental closing** (clicks outside before it closes, default 3), notification sound, sound source, audio folder |
| Slash command | switch (off by default), trigger word |
| Other | show suggestion hint |

Every value is freely settable; out-of-range values only produce a gray hint — **nothing is
blocked and nothing errors**.

### Guard dialogs against accidental closing

Dialogs like the session-end and long-break prompts need **3 clicks outside** before closing.
Your hand is often still clicking right when a session ends, and the summary used to vanish by
accident.

- Each outside click shows "N more clicks to close" and shakes once
- Buttons inside the dialog (OK / Log / Again) and **Esc** are explicit actions and close at once
- Set "guard dialogs against accidental closing" to **1** for the old one-click behavior

---

## 7. Mobile

- Pomodoro **forces the sidebar view on phones** (a floating window is awkward to drag on touch)
- Start it from the command palette or the mobile toolbar: toolbar wrench → Add command →
  search "Pomodoro"
- For timestamps, the `/now` slash command is fastest on phones (enable it in settings first;
  off by default)

---

## 8. Known limitations

| Item | Note |
|---|---|
| Invocation tracking (not done) | writing usage back at where `/pomodoro` was invoked means maintaining a state block in notes; too complex, parked for now |
| Progress not saved | cleared when Obsidian closes; by design |
| Sound folder | recurses at most 4 levels; falls back to the built-in tone if playback fails |
| QuickAdd choice list | the dropdown only appears if that plugin exposes an interface like `getChoices`; otherwise it's a plain text field |
| Log writing | built-in mode always inserts at the very top; never overwrites existing content |
| Floating window position | stored in exact pixels; converted proportionally and clamped into the viewport only when the window size changes |
| Lunar range | 1900–2100 only; lunar items hide themselves outside it |
| Lunar boundary | lunar 2100's 12th month maps to solar January 2101, beyond the table, so it can't be cross-checked |
| Solar term precision | computed for Beijing time (UTC+8), error under 15 minutes |
| Mobile | no floating window, sidebar only |

---

## 9. Troubleshooting: Calendar settings page blank / "dow" error

This is a **known bug in Calendar itself**, unrelated to this plugin:

- Symptom: Settings → Calendar is nearly empty, console shows
  `Cannot read properties of undefined (reading 'dow')`
- Cause: Calendar reads `window._bundledLocaleWeekSpec`, which is only initialized after the
  calendar view has been opened once
- Evidence: reproducible on a clean install with Calendar as the only plugin (GitHub Issue #395)
- Fix: **open the calendar view on the left once**, then go into settings

To confirm: `require('./calendar.js').weekSpecStatus()` in the console gives the current value
("not initialized" means this is the cause). The probe is read-only and changes no settings.

---

## 10. Interface language

- **Where**: Obsidian Settings → Community plugins → **Time Tools** (a single entry) → the last
  tab at the top, "Interface language". It lives in the same settings page as the feature
  settings (Timestamps / Pomodoro / Calendar) — just switch tabs.
- **Options**: Follow system (**default**), Simplified Chinese, Traditional Chinese, English.
- **Follow-system resolution order**: Obsidian's own interface language → moment language →
  browser language. A Chinese result (including `zh-TW`/`zh-HK`) uses the matching Chinese;
  **any other language falls back to English**; if all three are unreadable (no interface
  environment) it falls back to the Simplified Chinese baseline.
- **It persists**: the chosen language is saved in plugin config, so you don't reset it after
  restarting Obsidian.
- **Scope**: only **text shown on screen** (settings page, Pomodoro floating window / sidebar,
  dialogs). Note content, conversion results, session logs and command names never change.
- **Fallback rule**: Simplified Chinese is the baseline text, so any untranslated entry shows
  Chinese — **never blank or half-translated**. Traditional is generated by character-table
  conversion, so a few words may read oddly; switch back to Simplified any time.
- **Consistent everywhere**: switching redraws the whole settings page and every tab changes
  together; **a running Pomodoro floating window and the calendar view change too** — you won't
  get "settings page in English but floating window still Chinese".
- **Fully independent**: this block can be deleted as a unit; the interface returns to all
  Chinese and everything else is unaffected.
- **A few strings stay Chinese on purpose** (7 total): the command names 时间戳 / 日历 (in
  English you couldn't search for them), plus 5 **syntax examples** — lunar date forms, format
  strings, time-of-day words, DataView field forms, and custom festival forms. The parser only
  recognizes the Chinese forms, so translating them would make copy-paste fail.
  Custom rule examples are exempt (they match the text you selected, language-independent, so
  English is fine there).

### Calendar language (independent of display language)

The same page also has a **"Calendar language"** dropdown, defaulting to "follow display
language", but you can set Simplified Chinese or English separately.

It only governs **month and weekday names inside the calendar grid** — some people want an
English interface with Chinese month names, others the reverse, so the two are separate.
Date format, week start, date numbers, dots, highlighting and note naming are **all unaffected**.

> Month and weekday names come from two small tables the plugin maintains itself, and do
> **not** go through moment's locale — that's global and would pollute other plugins.

### Want another language?

Only **Simplified Chinese** (baseline), **Traditional Chinese** (character conversion) and
**English** are built in. A fourth alphabetic language isn't bundled — it would mean another
English-sized table (~20KB).

For other languages, hook in with `registerLang`: after registering, a new option appears in the
dropdown and you fill in the translations. **An unfilled entry never goes blank** — it falls
back to the Chinese original. See `ARCHITECTURE.md` §7.5 for usage.

---

## 11. For developers

Project structure, state machine, config schema, naming conventions, performance constraints
and modification guide are all in **[`ARCHITECTURE.md`](ARCHITECTURE.md)** — no history needed
to start working on it.

Naming conventions (for publishing to the Obsidian community directory):

| Object | Rule | Current |
|---|---|---|
| Plugin ID | lowercase letters, digits and hyphens only; must not contain `obsidian` | `time-tools` ✅ |
| Plugin name | Basic Latin only, no `Obsidian`, no `Plugin` | `Time Tools` ✅ |
| View type | prefixed with plugin ID, unique across the vault | `time-tools-timestamp-view` / `time-tools-pomodoro-view` ✅ |
| Command ID | prefixed with plugin ID, to avoid clashes with other plugins | `time-tools-timestamp-*` / `time-tools-pomodoro-*` ✅ |
| CSS classes | three prefixes, no cross-contamination | `tsi-` / `pomo-` / `tt-` ✅ |
| Code | no `innerHTML`, no `eval`, no network requests, no Node APIs | ✅ |

> ⚠️ The plugin name must be Basic Latin. An early version used the Chinese name
> 「时间戳与番茄钟」, which violates the official manifest rule "use Basic Latin characters
> only"; it was changed to `Time Tools` in v2.0.0.

To publish, three things are needed:

1. **A public GitHub repository**, whose release tag must match `manifest.json`'s `version` exactly
2. **Release assets**: `main.js`, `manifest.json` and `styles.css` attached to the release
3. **A README** (this file)

Other common rejection points: a LICENSE is required (MIT is attached), and `minAppVersion`
must match the APIs actually used (currently `1.4.0`).

## Author

| Role | Name | Contribution |
|---|---|---|
| Requester | **Stray** | requirements, interaction design, acceptance, publishing |
| Collaborator | **Yuanbao (元宝)** | implementation, test suite, documentation |

> The `author` field in `manifest.json` is `Stray` (the store requires a single value) and the
> LICENSE copyright belongs to Stray. This table records the actual collaboration and doesn't
> affect those fields.

## License

MIT — see [LICENSE](LICENSE).

---
---

# 中文文档 / Chinese Documentation

> 以下是完整中文说明，内容与上方英文部分一致。

# Time Tools（时间戳与番茄钟）

一个 Obsidian 插件，两个模块：**时间戳插入器** + **番茄钟计时器**。
共用同一个插件身份与配置文件，设置页内以标签切换。

插件 ID：`time-tools`

> **开发者 / AI 请看 [`ARCHITECTURE.md`](ARCHITECTURE.md)** —— 项目结构、状态机、
> 配置 schema、命名规范、性能约束、修改指南都在里面。即使没有历史对话也能照着改。

---

## 一、安装

1. 关闭 Obsidian（或先禁用旧版插件）。**顺手检查旧目录**：
   打开 `你的库/.obsidian/plugins/`，若存在 `pomodoro-plugin` 目录，
   先打开里面的 `manifest.json` 看 `id` 一行：

   - `id` 是 `time-tools` → **本插件的旧副本**，务必删除整个目录。
     两个目录抢同一个 id，Obsidian 会按加载顺序挑一个生效，
     表现为「改了设置不生效」「命令行为与版本对不上」。
   - `id` 是别的 → 与本插件无关，不必删；但它也是番茄钟类插件，
     同时启用会有两套命令，按需自行取舍。

   删除前若还想保留旧配置，把旧目录里的 `data.json` 复制出来备份。
2. 把整个文件夹改名为 `time-tools`，放进 `你的库/.obsidian/plugins/`
3. 启动 Obsidian → 设置 → 第三方插件 → 找到「Time Tools」→ 启用

> 文件夹名建议等于插件 ID `time-tools`；不一致时插件仍能加载，
> 但部分回调（如 `onExternalSettingsChange`）不会被调用。
> 若从旧版 `timestamp-inserter` 升级，插件 ID 已变更，Obsidian 会视为新插件，
> **旧设置不会自动带过来**，需在新插件里重新配置一次。

### 配置备份与迁移

换设备或重装前，命令面板搜「导出配置」：全部设置会写到库根目录下的
`time-tools-配置备份.json`。**固定文件名、覆盖式**——只保留最新一份，不会越攒越多；
想留多份请自行复制改名。

在新环境装好插件后，搜「导入配置」，把备份文件里的 JSON **全文粘贴**进输入框
（是粘贴，不是选文件）。导入走与启动时相同的白名单校验：**旧版本残留的废弃字段、
类型不对或值不合法的项会被自动清洗**，不会把脏数据带进运行时；失败时不动现有配置，
并提示卡在哪一步。

这两条命令不受「时间戳」总开关影响——关掉时间戳照样能备份。

---

## 二、时间戳模块

在光标处插入当前时间，格式可自定义（预设 + 自定义语法）。下面的扩展能力默认开启。

### 扩展：时间文本转换

时间戳模块下的**扩展功能**，默认开启。选中笔记里的一段文本，执行「时间戳：转换选中的时间文本」，即可把它转成别的时间表达：

| 选中 | 转换项 | 结果 |
|---|---|---|
| `2026-09-19` | 转相对时间 | `3 天前` |
| `2026-09-19` | 补星期（追加，保留原有时刻） | `2026-09-19 周六` |
| `2026-09-19` | 转日记链接 | `[[2026-09-19]]` |
| `1768800000` | 时间戳 → 日期 | 按你的时间格式渲染 |
| `2026-09-19` | 日期 → 时间戳 | `1789689600` |
| `2026-09-19` | 日期偏移 | 填 `+7` → `2026-09-26` |
| `2026-09-19` | 转农历 | `农历2026年八月初九` |
| `2026-09-19` | 农历 + 干支生肖 | `农历2026年八月初九 · 丙午马年` |
| `2026-02-04` | 查节气 | `立春` |
| `八月十九` | 农历 → 阳历 | `2026-09-29` |

能识别的输入：`2026-09-19`、`2026/9/19`、`2026年9月19日`、`2026-09-19 14:30`、10 位或 13 位 Unix 时间戳、`14:30`。

> **农历**相关项（转农历、干支生肖、查节气、农历→阳历）详见
> [农历功能](#农历功能)，含支持范围与边界说明。
> 其中「转农历」默认开启——它与「农历 → 阳历」共用一个开关，所以两者一起生效；
> 「农历 + 干支生肖」「查节气」默认关闭，按需在设置里打开。

面板里每项都带**结果预览**，确认无误再点「应用」。只替换选区，不动笔记别处。

**三个入口**（命令面板搜不到时用后两个）：

1. 命令面板 → 搜「时间转换」
2. **编辑器右键菜单** → 选中文本右键 →「🔄 时间转换」（最直接）

**能识别这些写法**：

| 写法 | 处理 |
|---|---|
| `2026-09-19`、`2026/9/19`、`2026年9月19日` | 完整日期，可带时间 |
| `2026 09-19`、`2026 09 19`、`2026-09 19` | 分隔符混用、空格分隔 |
| `2026.09.19`、`2026_09_19`、`20260919` | 点、下划线、紧凑 8 位 |
| `09-17`、`9/17`、`9月17日`、`09 17` | 补上今年 |
| `14:30`、`14:30:25` | 补上今天，秒保留 |
| `1768800000` | Unix 时间戳 |
| `[[2026-09-19]]` | 日记链接 |
| `2026-09-19 周六` | 带星期的日期 |
| `3天前` `7天以后` `3天以前` `2小时之后` | 相对时间，方向词支持 前/后/以前/以后/之前/之后 |
| `二天后` `两天后` `七天后` `十天后` | 中文数字（一/二/两/…/十/二十/一百） |
| `前两天` `前三天` `上一周` | 倒装说法 |
| `第二天`（=次日）`第七天后`（=+7 天） | 序数 |
| `明天5点` `昨天下午3点` `明天5点半` | 口语日 + 时刻 |
| `今早` `今晚` `明早` `明晚` `昨夜` `今日` `次日` `当日` | 日前缀 + 时段 |
| `周一`~`周日` `本周一` `上周五` `下周一` | 星期几 |
| `月底` `月初` `上个月底` `下月初` `年末` `年初` | 月/年首尾 |
| `早上8点` `晚上7点半` `下午3点` | 时段 + 时刻 |
| `半小时后` `一刻钟后` `半天后` | 特殊量词 |
| `this morning` `last night` `next Monday` `in 3 days` `3 days ago` | 英文 |
| `五月十六号` `八月十九` | 中文大写 → 默认按农历 |
| `五月十六日` `八月十九日` | 大写带「日」→ 默认按阳历（如 2026-05-16） |
| `5月16号` `8月19日` | 阿拉伯数字 → 默认按阳历 |
| `当前时间` `此刻` `当下` `现在` | 插入此刻的时间戳（占位词，追加在后面） |
| `明天` `后天` `大后天` `前天` `大前天` `大大前天` | 口语相对日 |
| `昨天` `上周` `下个月` `去年` `明年` | 周 / 月 / 年的口语偏移 |
| `yesterday` `today` `tomorrow` `the day after tomorrow`、`next week` `last month` `next year` | 英文相对日 |
| `明年12月` `第49周周三` `周三下午2点` `明年12月份的第49周周三下午2点` | 复合表达（各段可省略，中间可插「的」） |
| `立春` `2027年立春` | 二十四节气（需开启农历） |
| `丙午` `丙午马年` | 干支（需开启农历） |

**统一格式**（默认开，排在常用转换第一项）：把识别出的时间换成统一格式。`2026年五月十六`、`2026-09-19`、`明天`、`周一`、复合表达等都能归一化。格式串在设置里自定义，**留空则跟随上方的时间戳格式**；不会填就照抄上方「格式」输入框的内容（如 `YYYY-MM-DD`、`YYYY年MM月DD日`）。

**撤回**：转换后结果后面会出现一个可点击的撤回图标（Obsidian 内置图标，固定样式），**点一下还原成转换前的原文**（如转换后是 `2026-06-30`，点一下变回 `五月十六`）。一篇笔记里可以有多处，逐个点即可。图标是编辑器的临时装饰，**不占正文字符、不写进笔记**，鼠标悬停会显示「点击撤回为原格式：<原文>」。记录只在内存，**关闭 Obsidian 后全部清除**。

四种撤回方式、边界与排查见本节末尾的「撤回转换」。

**历法标记**：日期前写「农历 / 阴历」按农历，写「阳历 / 公历」按阳历——标记已明确，不再靠写法去猜。标记写在日期**后面**（如「2026年八月初九 农历」）默认不转换；需要的话打开农历区的「标记在后也能识别」开关（默认关）。

**启用农历**（农历区总开关，默认开）：关闭后**所有日期一律按阳历处理**，与农历无关——转农历、干支生肖、节气、农历→阳历等全部不生效，下面的子开关也一并失效。打开后子开关才生效。

**大写中文即农历**（农历区开关，默认关）：关闭时只有「五月十六」「五月十六号」算农历，带「日」的「五月十六日」按阳历处理；开启后凡是大写中文书写一律按农历，阿拉伯数字一律按阳历。

**带「号 / 日」的都算农历**（农历区开关，默认关）：关闭时中文大写按农历、阿拉伯数字按阳历；开启后只要末尾带「号」或「日」，一律按农历转换。中文大写不受此开关影响，始终是农历。
**复合表达**：年 + 月 + 第N周 + 星期几 + 时段 + 时刻可任意组合，各段都可省略，中间可插「的」。

**周起始日**可在高级设置里改（跟随系统区域 / 星期一 / 星期日），影响「第 N 周」的计算起点，默认与 Obsidian 日历类插件一致。

**「早上」这类时段词单独出现时默认不转换**——它指几点没有共识，强行给值是编造。带时刻的写法（`早上8点`）始终可用。想开启单独转换，去高级设置里打开「时段名单独转换」，并可逐项改小时值。

分隔符可以随意混用：`2026 09-19`、`2026/09-19`、`2026_09_19`、`20260919` 都认。不合法的日期（如 `2026-02-30`、`2026-13-01`）会被拒绝，不会解析出错误结果。

**相对时间带基准**：面板顶部有「相对基准」输入框，留空＝现在。结果会标明相对哪一天，且**基准为「现在」时会带上当前时刻**（如 `14 天后（相对 现在 2026-09-19 23:48）`）——否则过几天回看就不知道"现在"是哪天了。设置里可关掉这段说明（默认开）。

「明天晚上」这类**口语日 + 时段**的组合始终能识别：默认落在当天 00:00（日期正确），开启高级设置里的「时段名单独转换」后按设定小时（如明晚 → 20:00）。结果会标明相对哪一天，例如 `2 天后（相对 现在）`、`3 天后（相对 2026-09-19 00:00）`。设置里可关掉这段说明（默认开）。反向的「相对时间 → 日期」同样按这个基准推算。

**设置页分五区**：常用转换（正向 ⇄ 逆向）、农历转换（正向 ⇄ 逆向）、节日转换（正向 ⇄ 逆向）、**倒计时 / 日期差值**（日期差值、倒计时，默认关）、高级设置（分别控制、折叠、基准说明、追加、日记链接格式）。高级区可折叠。

**转换项共 22 个，界面上合并为 14 个开关**（八对正逆各合为一个）。设置页分组显示：

| 合并后的开关 | 同时控制 |
|---|---|
| 相对时间 ⇄ 日期 | 转相对时间 + 相对时间→日期 |
| 星期 ⇄ 日期 | 补星期 + 去掉星期 |
| 日记链接 ⇄ 日期 | 转日记链接 + 链接→日期 |
| Unix 时间戳 ⇄ 日期 | 日期→时间戳 + 时间戳→日期 |
| 农历 ⇄ 阳历 | 转农历 + 农历→阳历 |
| 干支生肖 ⇄ 年份 | 农历+干支生肖 + 干支→年份 |
| 节气 ⇄ 日期 | 查节气 + 节气→日期 |
| 节日 ⇄ 日期 | 日期→节日 + 节日→日期 |

单项（无逆向）：日期偏移、补全日期、取时分秒。

**正逆配对**：八对转换各共用**一个开关**（正向代表整对），所以逆向项默认跟随正向开合。想分开控制、或折叠列表以简化界面，用设置里的「分别控制正向与逆向（高级）」「折叠转换项开关」，两者默认关。

**精确到秒**（默认关）：关闭时所有时间输出只到分钟，格式串里的秒也会被去掉。开启则保留秒。⚠️ 默认关意味着时间戳插入不再带秒。




**没选中文本时**（光标停在日期上直接执行），会自动识别光标所在行的时间。结果放哪由设置决定：

| 设置项 | 默认 | 行为 |
|---|---|---|
| 没选中文本时：在原文后追加结果 | 关 | 关闭＝转换结果**覆盖**原文；开启＝**保留原文**，结果接在后面 |

只对自动识别生效，手动框选时始终是替换选区。一行有多个日期时，取光标所在那一个。

**逆向转换默认跟随它配对的正向项**，多数一起开（如「相对时间 → 日期」随「相对时间」开，「链接 → 日期」随「日记链接」开）。未配对的「日期偏移」默认关。想正逆分开控制，打开高级设置里的「分别控制正向与逆向」。逆向项只有选中文本形态相符时才出现在面板里，例如选中「3 天前」才会出现「相对时间 → 日期」。

**补全日期**默认开，专治只写一半的情况：`09-17` → `2026-09-17`、`14:30` → `2026-09-19 14:30`。日期已完整时这项自动隐藏。

### 批量转换（整篇笔记）

单条转换一次只处理选中的一处。整篇笔记里散落很多日期时，命令面板搜
「时间戳：批量转换（整篇笔记）」：

1. 弹窗列出当前**已启用**的转换项，选其中一项
2. 下方预览识别到的全部位置，逐条显示「原文 → 结果」，最多 200 处
3. 确认后一次性替换整篇，可用 Obsidian 自带的 Ctrl+Z 回退

没打开的转换项不会出现在列表里（避免转出你没要的东西）；转不动的位置原样保留，
不会留下半截结果。

### 节日功能

节日转换共两项，挂在**扩展：时间文本转换**里，用法与其他转换项一致：选中文本 → 命令面板搜「时间转换」→ 点「应用」。

| 转换项 | 输入 | 输出（默认） |
|---|---|---|
| 日期 → 节日 | `2026-10-01` | `国庆节 2026-10-01` |
| 节日 → 日期 | `中秋` | `中秋 2026-09-25` |

**内置节日**分两类：阳历固定（元旦 01-01、国庆 10-01、五一 05-01 …）与农历浮动
（春节、元宵、端午、七夕、中元、中秋、重阳、腊八、小年、除夕）。
农历节日的日期**每年现算**（闰月会影响），不查固定表——「除夕」是腊月最后一天，
那年腊月只有 29 天就没有「年三十」。农历节日受「农历」总开关管辖，关掉后不再出现。

**输出形态**由设置里的「节日名带日期」控制（默认开）：

| 开关 | 日期 → 节日 | 节日 → 日期 |
|---|---|---|
| 开（默认） | `国庆节 2026-10-01` | `中秋 2026-09-25` |
| 关 | `国庆节` | `2026-09-25` |

默认开的理由：只写节日名看不出是哪一年，只写日期又丢了节日本身的信息，
两个方向都带上最完整。

**自设节日**：设置 → 时间戳 → 节日转换 → 自设节日。一行一条，格式 `节日名 = 日期`：

```
妈妈生日 = 10-15          阳历，每年重复
公司年会 = 2026-12-31     阳历，只那一年
观音诞 = 农历二月十九     农历，每年按农历算
母亲节 = 5月第2个周日     第 N 个星期几
感恩节 = 11月最后一个周四  当月最后一个星期几
某节 = 11月倒数第2个周四  当月倒数第 N 个星期几
Mother's Day = 5-10       节日名可含空格，英文也认
```

> 「最后一个」与「倒数第 N 个」不能靠数第几个碰运气——月末天数随月份变（28/29/30/31），
> 有的年份第 4 个不等于最后一个。
>
> 英文节日名（带空格）从 v3.22 起支持。**英文的日期写法**（如 `2nd Sunday of May`）**尚不支持**，
> 请写成 `5-10` 这种数字形式。

分隔符可用 `=` `:` `：` `,` `，`。自设节日**优先于内置**（同名可覆盖内置日期），
也能正反双向转换。无法识别的行自动跳过，下方实时显示已识别条数。

跨年口径：说「元旦」时若今年的已过完，取下一年的（12 月说元旦 → 次年 01-01）；
正好是当天则不跳。带年份的自设节日不参与推移。

### 农历功能

农历能力挂在**扩展：时间文本转换**里，共四项。用法相同：选中文本 → 命令面板搜「时间转换」→ 点「应用」。

| 转换项 | 输入 | 输出 | 默认 |
|---|---|---|---|
| 转农历 | `2026-09-19` | `农历2026年八月初九` | 开 |
| 农历 + 干支生肖 | `2026-09-19` | `农历2026年八月初九 · 丙午马年` | 关 |
| 查节气 | `2026-02-04` | `立春` | 关 |
| 农历 → 阳历 | `八月十九` | `2026-09-29` | 开（与「转农历」共用一个开关） |

之所以默认只开「转农历」这一对（含它的逆向「农历 → 阳历」）：它是唯一高频且无歧义的。查节气和干支生肖日常需求少、输出偏长，都留给你按需开启——关着的项不会出现在面板里，不会干扰选择。

**阳历 → 农历**：选中任何能被识别的日期即可，识别格式与转换面板其他项一致（`2026-09-19`、`2026/9/19`、`2026年9月19日` 等）。

**农历 → 阳历**的输入写法：

| 写法 | 说明 |
|---|---|
| `2026年八月十九` | 带年份，最明确 |
| `八月十九` | 不写年份，按**当前农历年**推算 |
| `农历2026年八月初一` | 可带「农历」前缀 |
| `2023年闰二月初五` | 闰月写法 |
| `腊月初八` `冬月初一` | 腊月 = 十二月，冬月 = 十一月 |
| `二〇二六年八月十九` | 中文数字年份 |
| `八月二十` `八月三十` | 二十、三十这类特殊写法同样识别 |

**闰月处理**：农历闰月跟着实际年份走。例如 2023 年闰二月，选中 `2023-03-22` 得到 `农历2023年闰二月初一`；反向输入 `2023年闰二月初五` 也能正确转回。若你标了闰月但该年实际无此闰月，该项返回空并自动隐藏，不会给错结果。

**干支与生肖**按农历年计算：2026 丙午马年、2024 甲辰龙年、2020 庚子鼠年、1984 甲子鼠年。

**节气**按北京时间（UTC+8）计算，采用太阳视黄经（截断 VSOP87 级数），误差 15 分钟以内。一天若不是节气，「查节气」这一项不会出现在面板里。

#### 范围与边界

| 项 | 说明 |
|---|---|
| 支持范围 | **1900–2100**。超出时农历相关项自动隐藏，不返回错误结果 |
| 算法 | 固定查表（201 个年份编码，约 2KB）+ 天文黄经计算节气 |
| 边界情况 | 农历 2100 年腊月对应阳历 2101 年 1 月，已超出表范围，无法反向校验 |
| 数据增长 | 农历表是**代码里的固定常量**，不写进 `data.json`、不随使用累积、不产生缓存文件 |

#### 怎样核对结果

若你对某次转换存疑，可用已知的春节日期交叉验证：

| 阳历 | 应为 |
|---|---|
| 2026-02-17 | 农历2026年正月初一 |
| 2025-01-29 | 农历2025年正月初一 |
| 2024-02-10 | 农历2024年正月初一 |
| 2020-01-25 | 农历2020年正月初一 |

反向同理：`农历2026年正月初一` 应转回 `2026-02-17`。

### 撤回转换

时间转换会把原文替换成结果（`五月十六` → `2026-06-30`），转完反悔时用它**一步还原**。

**四种方式，任选**：

| 方式 | 什么时候用 | 可用性 |
|---|---|---|
| 点结果后面的图标 | 图标正常显示时最直接，就地撤 | 依赖编辑器装饰，尽力而为 |
| 状态栏的撤回图标 + 数字 | 想确认还剩几处能撤，点一下撤最近一次 | **不依赖装饰，一定显示** |
| 命令面板搜「撤回」→「时间戳：撤回上一次时间转换」 | 图标没显示时 | **必定可用** |
| 系统 Ctrl+Z | 刚转完马上反悔 | 系统能力 |

三者的关系：Ctrl+Z 最省事，但转换后若还编辑过别处，它得一路退回去，会把那些编辑一起撤掉；命令、状态栏、图标走的是插件自己的记录，**一步定位到那处转换**，不影响其他编辑。**状态栏和命令是主路径**，图标只是就地撤回的增强——图标不显示不代表撤回坏了。

**状态栏指示器**：Obsidian 窗口底部，显示「撤回图标 + 数字 N」，N = **当前笔记**还有几处可撤回，点击即撤最近一次；数量为 0 或开关关闭时自动隐藏。切换笔记时数字跟着变（记录按笔记分别记）。图标是内置 SVG，不是 `↩` 字符——`↩` 只在徽标画不出来时兜底。

**点击后还原成什么**，取决于转换时的模式：

| 转换时的模式 | 转换后正文 | 点击后 |
|---|---|---|
| 覆盖（默认） | `2026-06-30` | `五月十六` |
| 追加 | `截止明天 2026-09-21` | `截止明天` |

追加模式下前导空格会一起去掉，不残留孤零零一个空格。点击走**记录层**定位（行号 + 文本查找），不依赖图标所在的装饰位置，所以装饰表现异常时点击依然准确。

**数据只在内存，绝不落盘**：转换完成即记录，同一篇笔记可有多处、逐个撤回；**关闭 Obsidian 后本次所有记录清除**，图标消失、不再可撤回。

这样设计是为了避免"死按钮"：记录里存着原文，若把它存进笔记或 `data.json`，下次打开时图标还在、还原所需的上下文已变，就会出现**图标还在却点不动**。图标与记录必须同生命周期。**不要指望隔天回来还能撤**——需要长期可逆，转换时就该用追加模式保留原文。

**开关**：设置 → 时间戳 → 高级设置 →「转换后显示撤回标记」（默认开）。

| 状态 | 行为 |
|---|---|
| 开 | 转换后显示图标、可点击撤回，命令也可用 |
| 关 | 不显示图标，**也不记录**——命令会提示「撤回提示已关闭」 |

关掉等于**整个撤回功能停摆**，不只是隐藏图标：不记录就不占内存，也不给一个点了没反应的按钮。

**图标不可自定义**：早期允许自己填符号（如 `↩`），后来移除——自定义字符依赖字体，缺字形时什么都不显示，表现为"开关开着却没图标"。现在固定用内置 SVG，不依赖字体，各环境一致。

**容量上限**（防止无限增长，日常碰不到）：每篇笔记最多 100 处、最多 50 篇笔记，超出丢最旧的（连图标一起清掉），新转换照常记录。

**边界情况**：

| 情况 | 行为 |
|---|---|
| 转换后那行被大段改写 | 先按文本找，找不到就整行找；**整行命中多处时拒绝执行**（不拿第一个下手，否则会把替换写到别处）；都找不到则标记 `unresolvable`，**保留记录不清**——乱序撤回时清掉中间记录会让那处转换永久不可逆 |
| 前面插入过文字导致位置偏移 | 靠文本定位，不靠坐标 |
| 一篇笔记转了多处 | 各自独立，逐个点图标；命令撤最近一次 |
| 切到别的笔记 | 命令只撤**当前笔记**的 |
| 手动框选 vs 光标自动识别 | 都能撤回，行为一致 |

**图标不显示时怎么排查**：先看状态栏有没有「图标 + 数字」——有就说明记录正常、撤回没坏；再用命令面板搜「撤回」验证能否撤。仍想查原因可看控制台（`lastUndoFailReason` 记着最近一次失败原因）。常见原因：无法 require `@codemirror`、CM6 扩展未构建、装饰未写入该编辑器实例。**无论哪种，状态栏与命令都能正常撤回。**

---

## 三、日历模块

自研日历视图，**默认关**，需要时到「设置 → 日历」打开总开关。

- **圆点**：每格下面的圆点 = 该天日记的字数 ÷「每点代表字数」（默认 250，最多 10 个）。
  周列那一列的圆点读的是**周记本身**的字数，不是 7 篇日记相加。
- **高亮**：今天只留一圈边框；当前打开的笔记整格填充。两者互不冲突。
- **周起始日**只有一个来源：跟随 `calendar.weekStart`（系统区域设置），不另设开关。

### 存放位置与日期格式

- 日记 / 周记 / 月记 / 年记共用一套配置。
  **「新笔记存放位置」是纯字面量**，填什么就是什么，`YYYY`/`MM` 不会被替换成年月；
  要按年、月分级，写在**「日期格式」**里，例如 `YYYY/MM/YYYY-MM-DD`。
- 模板**优先用 Templater**。Templater 不可用时会如实报错并给出下载链接；
  只有打开「降级内置模板」（默认关）才会用内置模板兜底 —— 不会静默降级。

### 与 Calendar 插件的关系

「修复 Calendar 设置页空白」等兼容项**默认关**，且两种增强方式互斥（开一个自动关另一个）。

---

## 四、番茄钟模块

### 周期规则

- 一轮 = 专注 + 短休息（时长由所选方案决定）
- 每完成 **4 轮**弹窗询问是否进入长休息，**不会自动进入**
- 默认不限轮数，一直跑到手动点「结束」
- 长休息结束后计数默认清零
- **关闭 Obsidian 后计数清零，重新打开只恢复设置，不自动续跑**

### 时长方案（预设 + 自定义）

按场景分组保存专注 / 休息时长，内置三套：

| 方案 | 专注 | 短休息 | 长休息 |
|---|---|---|---|
| 工作 | 40 | 10 | 90 |
| 学习 | 25 | 5 | 15 |
| 阅读 | 30 | 3 | 10 |

设置页「时长方案」分组里可切换当前方案、**新建**、**删除**、改名称、改三项时长。
开始面板里也能临时选一套，选定后本次会话按该方案执行。

### 开始面板

```
🍅 准备开始
你认为这个任务需要几轮番茄钟完成？（专+休为一轮）

时长方案  [学习（25/5/15）▾]
轮数      [____]

[不限]  [开始]
```

### 自动 / 手动模式

设置项「自动开始下一段」：

- **开启**（默认）：专注结束自动进入休息，休息结束自动进入下一轮专注
- **关闭（手动模式）**：每段结束后停在「待开始」，显示下一段是什么，点「开始休息 / 开始专注」才继续；也可点跳过直接进入再下一段

手动模式适合需要自己掌握节奏、中间要处理别的事的场景。

### 暂停提示

一段内暂停次数达到阈值（默认 3 次）时弹窗：

```
🍅 本轮已暂停多次
已暂停 3 次，专注还剩 12:30。要从本轮重新开始计时吗？

[重新开始本轮]  [继续当前进度]
```

- **重新开始本轮**：整段从头计时，已用时间作废
- **继续当前进度**：沿用剩余时间继续

阈值可在设置里改。

### 正计时（默认关）

开启后**专注段**从 0 往上累加、**不自动结束**，由你点「跳过」或结束会话来停。
只对专注段生效 —— 休息段本来就是固定时长，正计时没有意义。

| 设置项 | 作用 |
|---|---|
| **正计时** | 总开关，默认关（番茄钟的经典用法是倒计时） |
| **软目标（分钟）** | 到点弹一次提醒并响铃，**不结束**计时。0 = 不提醒 |
| **硬上限（分钟）** | 累加到这么多分钟自动停表并提示，默认 1440（24 小时）。**达上限那一段不计入统计**，要继续请重新开始。0 = 不设上限 |
| **间隔提醒（分钟）** | 每累加到这个倍数就提醒一次（填 20 → 第 20 / 40 / 60 分钟各一次）。0 = 不提醒 |

已经跑起来的那一段**不给切换** —— 切了显示的数字会从「剩余」跳成「已过」，
同一个数两种读法，足够让人以为计时坏了。

「🍅 准备开始」面板上切到正计时后，会出现**软目标**和**间隔提醒**两个输入框，
不用跑去设置页 —— 开正计时的人多半就是要靠这两个提醒收尾。
倒计时下这两项收起（段到点就结束了，设了也不会触发）。

切换方式（都在「待开始」时可见）：

- 浮窗 / 侧边栏上的 **＋ / －** 按钮（＋＝正计时，－＝倒计时）
- 准备开始面板上的「正计时 / 倒计时」一对按钮，当前生效的那个点亮
- 命令面板「番茄钟：切换正计时」，只影响下一段

超过一小时会补出小时位（`1:05:30`），不会显示成 `65:30`。
若浮窗放不下，调小 `--pomo-time-size` 或加大 `--pomo-width`。

记录口径与倒计时不同：**正计时的「跳过」照记时长**（它没有"没做完"这回事，
你什么时候停这一段就是多长），只是不计入「跳过次数」。

### 四个入口

| 入口 | 用法 |
|---|---|
| 斜杠命令 | 默认**关闭**（`/` 是公共资源，避免与 Templater 等冲突）。开启后输入 `/pomodoro` → 点建议（触发词可改） |
| 浮窗 | 开始后自动出现，可拖到**上 / 下 / 左 / 右**任意一边 |
| 状态栏 | 底部常驻 `🍅 25:00`，点它唤回被隐藏的浮窗 |
| 命令面板 | 「番茄钟：开始 / 暂停 / 跳过 / 结束 / 开始下一段 / 显示隐藏计时器 / 打开设置」 |

### 浮窗操作

- 拖标题栏移动
- `⚙` 打开番茄钟设置
- `—` 最小化（缩成 `🍅 25:00` 小浮标）
- `×` 隐藏（**计时继续**，点状态栏唤回）

### 拖动与吸附

设置项**「拖动后吸附到边缘」**：

- **开启**（默认）：松手后自动贴到最近的一条边，记住边与沿边位置
- **关闭**：停在松手位置，位置按视口比例记录，窗口缩放不会跑出屏幕

### 提示音

设置项「提示音来源」：

- **内置合成音**（默认）：系统合成，不需要任何文件
- **自定义文件夹**：填库内文件夹路径（如 `音效/提示音`），插件扫描里面的音频文件并在段结束时按顺序轮播

支持 `.mp3 / .wav / .ogg / .m4a / .flac / .aac`。
填完点「重新扫描」可看到找到几个文件；路径不对或没文件时自动回退内置音。

### 会话小结

```
🍅 番茄任务结束
完成 2 轮 · 长休息 0 次
┌──────────────────────────────┐
│ 专注 50 分钟 · 休息 10 分钟     │
│ 暂停 2 次                      │
│ 17:34 – 18:24                │
│ 跳过未计入：专注 1 段          │
└──────────────────────────────┘
────────────────────────────────
[记录]              [Again] [好的]
 蓝                   灰      紫
```

底部按钮：**记录**在最左（蓝），**Again** 与**好的**成组靠右。

| 按钮 | 作用 |
|---|---|
| **记录**（蓝） | 立刻按设置的方式记录一次。仅总开关开启时出现 |
| **Again**（灰） | 关闭并重新打开开始面板，接着下一轮 |
| **好的**（紫） | 关闭；若开了自动记录，关闭后才写入 |

被**跳过**的段不计入专注 / 休息时长，单独在小结里列出（没有跳过时不显示这一行）。

### 累计统计

想知道「今天专注了多久」「一共专注了多久」，命令面板搜「番茄钟：查看累计统计」。
数据从哪来，由你在设置页「累计统计数据源」里选：

| 选项 | 读数方式 | 特点 |
|---|---|---|
| **不统计**（默认） | — | 不存任何数据 |
| 本机累计 | 插件自己记账 | 精确，但换设备或清配置会丢 |
| 解析笔记 | 现读你写的会话记录笔记 | 持久，但改过写入格式就会读不准 |
| **自定义位置** | 现读你指定的一篇笔记或一个文件夹 | 位置自己定，与番茄钟默认记录笔记解耦 |

选「不统计」时命令会提示先去设置里挑一个数据源，不会拿假的零来糊弄。

**自定义位置**：数据源选它之后，在下面「自定义统计位置」里填路径——
可填一篇笔记（如 `统计/专注.md`），也可填一个文件夹（如 `统计`，会统计其下所有 `.md`）。
这一项只在选中「自定义位置」时才展出，选其它数据源时收起。
路径填错或留空会明确提示「没读到」，不会静默给 0。

统计认三种时长写法：`1 小时 30 分 20 秒`、`25 分 30 秒`、`45 秒`。
所以开了「记录到秒」、或正计时跑过一小时，时长都不会被漏算。

**DataView 联动**（默认关）：设置 → 番茄钟 →「DataView 联动」。
开启后写会话记录时，按「DataView 字段表」在末尾追加内联字段，
供你自己写的 dataview 查询读取。关着时一个字都不多写。
需要你已安装 DataView 插件才能查询 —— 开启后若没检测到该插件，
设置页会在这一项下方用黄字提示（字段仍会写入，装了才能查到）。

字段表**一行一个字段**，格式 `字段名::{{VALUE:变量名}}`，字段名随便改：

```
记录日期::{{VALUE:date}}
我停下几次::{{VALUE:pauses}}
```

默认只有「专注时长」一行（`专注时长::{{VALUE:focusText}}`），其余自己加行。
清空则一行都不写。可用变量：

| 变量 | 含义 | 变量 | 含义 |
|---|---|---|---|
| `date` | 日期 | `focusText` | 专注时长（带单位，跟随「记录到秒」） |
| `time` | 时间 | `restText` | 休息时长（带单位） |
| `range` | 时段 | `pauses` | 暂停次数 |
| `cycles` | 轮数 | `longBreaks` | 长休息次数 |
| `focus` | 专注分钟数 | `skippedFocus` | 跳过专注次数 |
| `rest` | 休息分钟数 | `skippedBreak` | 跳过休息次数 |
| `profile` | 方案名 | | |
「本机累计」只存固定的几个字段，且**跨天会把「今日」归零**后再重新累计，
不按日期堆条目——所以长期用下来也不会积累废弃数据。

---

## 五、会话记录模块

番茄任务结束时，可以把结果写出去。这是一个**独立模块**，有总开关。

### 总开关与是否自动记录

| 设置项 | 作用 |
|---|---|
| **启用会话记录** | 总开关，**默认打开**。关闭时完全不记录：结束弹窗不再显示「记录」按钮，下方所有记录设置折叠收起（数值保留，重新打开即恢复） |
| **是否自动记录** | 开启：番茄结束时自动执行记录。关闭：不自动，只有手动点「记录」才记录 |
| **记录到秒** | **默认关闭**（按分钟记）。打开则记到秒，如「专注 25 分 30 秒」。正计时与倒计时共用此开关 |

关闭总开关会先弹一次确认，写明关掉后的后果 —— 它会一口气停掉整块功能，误点代价太大：

- 番茄结束不再自动记录
- 结束弹窗不再显示「记录」按钮
- 下方的记录设置折叠收起

已经写进笔记的记录不受影响，各项设置的值也会保留。总开关位置固定在会话记录区第一行，与上方内容有分隔线，折叠只影响它下面的设置。

开启后有三种写入方式：

### 方式一：内置写入

结束弹窗里勾选「记录本次结果」，出现笔记名输入框（预填默认名，可临时改）：

- 笔记**已存在** → 内容插到**最上端**；若笔记有 frontmatter，则插在 frontmatter 之后，不破坏 YAML
- 笔记**不存在** → 自动创建（含父文件夹），再写入

默认写入内容：

```markdown
#### 🍅 2026-09-19 17:34 – 18:24
- 完成 2 轮 · 长休息 0 次
- 专注 50 分钟 · 休息 10 分钟 · 暂停 2 次
- 跳过未计入：专注 1 段
- 方案：学习
```

模板可在设置里改，占位符：

| 占位符 | 含义 |
|---|---|
| `{{date}}` | 日期 |
| `{{time}}` | 结束时间 |
| `{{range}}` | 起止时间段 |
| `{{cycles}}` | 完成轮数 |
| `{{focus}}` | 专注总分钟（整数，与「记录到秒」开关无关） |
| `{{rest}}` | 休息总分钟（同上） |
| `{{focusText}}` | 专注时长，带单位；精度跟随「记录到秒」 |
| `{{restText}}` | 休息时长，带单位；精度同上 |
| `{{pauses}}` | 暂停次数 |
| `{{longBreaks}}` | 长休息次数 |
| `{{profile}}` | 使用的时长方案 |
| `{{skippedLine}}` | 跳过行（无跳过时整行为空） |

### 方式二：联动 QuickAdd

选「联动 QuickAdd」后，填 QuickAdd 里 **选项的名称**。任务结束时插件调用 `executeChoice(name, variables)`，把本次数据作为变量传进去，写去哪、写成什么样完全由你的 QuickAdd 选项决定。

在 QuickAdd 的 Capture / Template 里用这些变量：

| 变量 | 含义 |
|---|---|
| `{{VALUE}}` | 一行摘要，如 `🍅 完成 2 轮 · 专注 50 分钟 · 休息 10 分钟 · 暂停 2 次（17:34 – 18:24）` |
| `{{VALUE:content}}` | 按内置模板生成的完整文本 |
| `{{VALUE:date}}` | 日期 |
| `{{VALUE:time}}` | 结束时间 |
| `{{VALUE:range}}` | 起止时间段 |
| `{{VALUE:cycles}}` | 完成轮数 |
| `{{VALUE:focus}}` | 专注总分钟 |
| `{{VALUE:rest}}` | 休息总分钟 |
| `{{VALUE:focusText}}` | 专注时长，带单位；精度跟随「记录到秒」 |
| `{{VALUE:restText}}` | 休息时长，带单位；精度同上 |
| `{{VALUE:pauses}}` | 暂停次数 |
| `{{VALUE:longBreaks}}` | 长休息次数 |
| `{{VALUE:skippedFocus}}` | 跳过未计入的专注段数 |
| `{{VALUE:skippedBreak}}` | 跳过未计入的休息段数 |
| `{{VALUE:profile}}` | 时长方案 |

> **Capture 与 Template 的差别**：Capture 里 `{{VALUE}}` 是**写入的内容**；Template 里 `{{VALUE}}` 是**新笔记的文件名**。
> 所以 Capture 可以直接写 `{{VALUE}}`，Template 请用具名变量拼装。

### 方式三：仅复制到剪贴板

不碰任何插件与文件，番茄结束时把结果文本放进剪贴板，你在任何笔记里 `Ctrl+V` 即可插入。适合不想配置 QuickAdd、又想自己决定写哪儿的场景。

### QuickAdd 拿不到数据怎么办

若 QuickAdd 仍弹 "Text to capture" 之类的输入框，说明它的 Format 里没写变量。三种解法：

1. **自动填入**：Capture 的 Format 里填 `{{VALUE}}`，本次结果会自动带进去。设置页有「复制 `{{VALUE}}`」按钮，点一下粘进去即可
2. **自动复制**：设置项「执行前复制到剪贴板」默认开启 —— 调用 QuickAdd 之前先把结果放进剪贴板，它若还弹输入框，直接 `Ctrl+V` 就填上了
3. **只用剪贴板**：写入方式选「仅复制到剪贴板」，完全绕开 QuickAdd

### 排查 QuickAdd 联动

设置页里有一个 **测试执行** 按钮，用示例数据立刻跑一次，失败会明确告诉你原因：

| 提示 | 含义 | 怎么办 |
|---|---|---|
| 未检测到 QuickAdd 插件 | 未安装或未启用 | 去社区插件装并启用 |
| 未暴露 executeChoice 接口 | QuickAdd 版本太旧 | 更新 QuickAdd |
| 找不到选项「X」。列表里有：A、B | **选项名对不上** | 从「选择已有选项」下拉里挑，别手打 |
| 执行出错：xxx | 选项本身报错 | 按提示改 QuickAdd 里的配置 |

**「选择已有选项」下拉会递归读取**，包含：

- 顶层选项
- **Multi 里的子选项**
- **Macro 里的 NestedChoice**

所以即使你的 Capture 是嵌在「我的收集箱」这类 Multi 里的，也能在下拉里选到。

**「严格校验选项名」默认关闭**。因为某些 QuickAdd 版本的配置结构可能读不全，
关着的时候即使名字不在列表里也会照常尝试执行，不会因为误判而白白回退到内置写入。
确定列表准确再打开它。

### 联动失败时怎么办

设置项 **「联动失败时改用内置写入」**，默认**开启**：

| 开关 | QuickAdd 用不了时的行为 |
|---|---|
| **开启**（默认） | 自动改用内置写入，写进「默认笔记名」指定的笔记，**记录不丢** |
| 关闭 | 不记录，只提示失败。适合不想让记录写脏笔记的场景 |

QuickAdd 本身执行成功时，这个开关不影响任何行为。

---

## 六、番茄钟设置项一览

| 分组 | 项目 |
|---|---|
| 时长方案 | 当前方案、新建 / 删除、方案名称、专注 / 短休息 / 长休息时长 |
| 节奏 | 长休息间隔、自动开始下一段、长休息后计数、拒绝长休息后的时机、暂停提示阈值 |
| 界面 | 界面形态、拖动后吸附到边缘、浮窗默认吸附边、显示左侧栏图标 |
| 提醒 | 段结束通知、**结束框防误关**（点几次弹窗外部才关，默认 3）、提示音、提示音来源、音频文件夹 |
| 斜杠命令 | 开关（默认关）、触发词 |
| 其他 | 显示建议提示 |

所有数值都能自由设置，超出常规值只给灰色提示文案，**不阻止、不报错**。

---

### 结束框防误关

番茄结束、长休息询问这类弹窗，默认需要**点 3 次弹窗外部**才会关闭。
番茄刚结束时手常常还在点，以前一不小心就把小结点没了。

- 每次点外部会提示「再点 N 次关闭」，并抖一下
- 弹窗内的按钮（好的 / 记录 / Again）和 **Esc** 是明确操作，一次就关
- 把「结束框防误关」填 **1** 即恢复成点一下就关

---

## 七、移动端

- 番茄钟在手机上**强制使用侧边栏视图**（浮窗在触屏上不好拖动）
- 用命令面板或移动工具栏启动：工具栏扳手 → 添加命令 → 搜「番茄钟」
- 时间戳在手机上用 `/now` 斜杠命令最快（需在设置里先开启，默认关闭）

---

## 八、源码结构

`src/` 下 **14 个源文件，共 17532 行**，各有职责、**不再合并**
（`settings.js` 被 require，并入 `main.js` 会成环）。

| 文件 | 行数 | 职责 |
|---|---|---|
| `timejudge.js` | 519 | 零依赖判断表：时段、口径、节日、周号、周起始真源——**必须最先加载** |
| `settings.js` | 1662 | 配置 schema、迁移、设置页外壳 |
| `timestamp.js` | 4702 | 时间戳 + 时间文本转换 + 批量转换（最大） |
| `pomodoro.js` | 3452 | 番茄钟 + 六套主题 + 三种界面形态 + 累计统计 |
| `calendar.js` | 2383 | 自研日历视图 + Calendar 增强 |
| `recorder.js` | 1017 | 会话记录写笔记 + QuickAdd（v3.5 从 pomodoro.js 拆出） |
| `note.js` | 948 | 四种周期笔记生成 |
| `pomowin.js` | 376 | 独立窗口的窗口级控制 |
| `pomosync.js` | 335 | 跨窗口同步：拥有者 / 镜像、心跳、接管 |
| `main.js` | 364 | 入口，只做装配 |
| `i18n.js` | 621 | 界面语言逻辑：中文兜底 + 查表 + 简繁转换（零依赖） |
| `i18n-en.js` | 478 | 界面语言**英文文案表**（纯数据，v3.26 从 i18n.js 拆出） |
| `lunar.js` | 519 | 农历 / 节气 / 干支换算（v3.5 从 timestamp.js 拆出） |
| `configio.js` | 156 | 配置导出 / 导入备份（v3.13 新增） |

**加载顺序（勿动）**：`timejudge.js` → `settings.js` → 其余模块。

### 性能

计时轮询每 250ms 一次，但**只在剩余秒数变化时才重绘界面**。显示精度只到秒，若每次轮询都刷新，会有 3/4 的 DOM 写入完全冗余。

实测跑满一段 25 分钟专注：

| | DOM 写入次数 |
|---|---|
| 每次轮询都重绘 | 48000 |
| 按秒重绘 | 12008 |
| 按秒 + 脏检查（当前） | **1500** |

**减少 75%**。状态切换（开始 / 暂停 / 跳段）仍会立即重绘，不受节流影响。

其他热路径实测均在微秒级（农历转换 1.8–4.3 µs/次、日期解析 0.33 µs/次），非瓶颈。

## 九、命名规范（上架 Obsidian 社区插件用）

| 对象 | 规则 | 当前状态 |
|---|---|---|
| 插件 ID | 仅小写字母、数字、连字符；不含 `obsidian` | `time-tools` ✅ |
| 插件名 | 仅 Basic Latin、不含 `Obsidian`、不含 `Plugin` | `Time Tools` ✅ |
| 视图类型 | 带插件 ID 前缀，全库唯一 | `time-tools-timestamp-view` / `time-tools-pomodoro-view` ✅ |
| 命令 ID | 带插件 ID 前缀，避免跨插件冲突 | `time-tools-timestamp-*` / `time-tools-pomodoro-*` ✅ |
| 命令名 | 带模块中文前缀，便于搜索 | `时间戳：…` / `番茄钟：…` ✅ |
| CSS 类 | 三套前缀互不污染 | `tsi-` / `pomo-` / `tt-` ✅ |
| 代码 | 无 `innerHTML`、无 `eval`、无网络请求、无 Node API | ✅ |

> ⚠️ 插件名必须是 Basic Latin（英文）。早期版本用过中文名「时间戳与番茄钟」，
> 不符合官方 manifest 规范中的 "use Basic Latin characters only"，v2.0.0 已改为 `Time Tools`。

### 上架前还需补的三件事

1. **GitHub 仓库**：公开仓库，release 的 tag 必须与 `manifest.json` 的 `version` 完全一致
2. **release 附件**：`main.js`、`manifest.json`、`styles.css` 三个文件必须打进 release
3. **README**：当前这份即可（用法、限制、结构齐全）

其余常见驳回点：需 LICENSE（已附 MIT）、`minAppVersion` 要与实际用到的 API 匹配（当前 `1.4.0`，对应 `workspace.activeEditor`）。

### 扩展新功能时怎么加设置

新增功能的设置放在 `settings-tab.js` 的 `SECTIONS` 数组里登记一行：

```js
const SECTIONS = [
  { id: 'record',    tab: 'pomodoro', order: 200, render: renderRecord },
  { id: 'myFeature', tab: 'pomodoro', order: 300, render: renderMyFeature },
];
```

| 字段 | 说明 |
|---|---|
| `id` | 唯一标识，重复会在控制台告警且只渲染第一个 |
| `tab` | 挂到哪个标签：`timestamp` / `pomodoro` |
| `order` | 排序，小的在前 |
| `render` | 渲染函数，签名 `(containerEl, plugin, ticker)` |

**故障隔离**：逐块 `try/catch`。某块渲染出错只影响它自己——页面上显示一行「加载失败：原因，其余设置不受影响，详细堆栈见开发者控制台」，完整堆栈走 `console.error`。不会出现一个模块出错导致整个设置页白屏。

区块统一渲染在对应标签内容的**最下方**，新增功能不会打乱已有布局。

---

## 十、已知限制 / 待办

| 项 | 说明 |
|---|---|
| 唤起位置记录（未做） | 在 `/pomodoro` 唤起处回写使用情况，涉及在笔记里维护状态块，复杂度较高，暂搁置 |
| 进度不保存 | 关闭 Obsidian 即清零，属既定设计 |
| 音效文件夹 | 最多递归 4 层子目录；播放失败时回退内置音 |
| QuickAdd 选项列表 | 仅在该插件暴露 `getChoices` 一类接口时才能出下拉，否则只用输入框手填 |
| 记录写入 | 内置模式每次都在笔记最上端插入；不覆盖已有内容 |
| 浮窗位置 | 记精确像素；窗口尺寸变化时才按比例换算并夹回视口内 |
| 农历范围 | 仅 1900–2100，超出时农历相关项自动隐藏 |
| 农历边界 | 农历 2100 年腊月对应阳历 2101 年 1 月，超出表范围，无法反向校验。详见农历功能章节 |
| 节气精度 | 按北京时间（UTC+8）计算，误差 < 15 分钟 |
| 移动端 | 不支持浮窗，只走侧边栏 |

---

## 十一、故障排查：Calendar 插件设置页空白 / 报 dow

这是 **Calendar 自身的已知 bug**，与本插件无关：

- 现象：Settings → Calendar 近乎空白，控制台报
  `Cannot read properties of undefined (reading 'dow')`
- 根因：Calendar 读 `window._bundledLocaleWeekSpec`，
  而它要等日历视图打开过一次才初始化
- 证据：全新安装、只装 Calendar 一个插件也会复现（GitHub Issue #395）
- 解法：**先点开一次左侧的日历视图**，再进设置页即可

想确认的话：控制台里 `require('./calendar.js').weekSpecStatus()` 会给出当前值
（显示「未初始化」即说明是这个原因）。该探测只读，不修改任何设置。

---

## 十二、界面语言

> **v3.25.0**：补完了下拉选项（周起始、主题、窗口位置）、变量类文案（格式语法表、变量表、周期笔记类型、斜杠建议）以及 45 处只译了第一段的说明文字。这类文案是「以变量传进界面」或「多段拼接」的，之前的检测扫不到，切英文后仍是中文。

> 另修：切语言后番茄钟浮窗 / 侧边栏的「结束」按钮不跟着变 —— 它是一次性写入的，而刷新只更新已有节点的值、不重建节点。

- **在哪**：Obsidian 设置 → 社区插件 → **Time Tools**（只有一个条目）→ 顶部标签最后一页「界面语言」。它和功能设置（时间戳 / 番茄钟 / 日历）在同一个设置页里，切标签即可。
- **可选**：跟随系统（**默认**）、简体中文、繁體中文、English。
- **跟随系统的判定顺序**：Obsidian 自己的界面语言 → moment 语言 → 浏览器语言。检测出来的是中文系（含 `zh-TW`/`zh-HK`）就用对应中文；**检测出来是其它语言一律用英文**；三处都读不到（无界面环境）才回落到中文底色。
- **会存住**：选过的语言写进插件配置，重启 Obsidian 后不用重设。
- **影响范围**：只影响**界面上显示的字**（设置页、番茄钟浮窗 / 侧边栏、弹窗）。笔记内容、转换结果、会话记录、命令名一律不变。
- **兜底规则**：简体中文是底色文案，任何尚未翻译的条目都显示中文，**不会出现空白或半截英文**；繁體由字表转换生成，个别词可能不地道，随时可切回简体。
- **两边一致**：切换后整个设置页重绘，所有标签一起换语言；**正在跑的番茄钟浮窗、日历视图也一起换**，不会出现"设置页已英文、浮窗还是中文"。
- **完全独立**：这一块可整块删掉，删后界面回到全中文，其余功能零影响（做法见开发启动卡 §14）。
- **少数文案切了英文仍是中文，是有意为之**（共 7 条）：
  命令名「时间戳」「日历」（翻成英文你就搜不到了），以及 5 条**语法示例**——
  农历日期写法、格式串、时段词、DataView 字段写法、自设节日写法。
  解析规则只认中文写法，翻成英文照抄反而解析失败。
  自定义规则的示例不受此限（它匹配你选中的原文，与语言无关，可放心用英文）。

### 日历语言（可独立于显示语言）

同一页里还有一个**「日历语言」**下拉，默认「跟随显示语言」，也可单独指定简体中文 / English。

它只管**日历网格里的月份名与星期名**——有人界面想看英文、日历想看中文月份，也有人反过来，所以两项分开。
日期格式、周起始日、日期数字、圆点、高亮、笔记命名**一律不受影响**。

> 月份名与星期名是插件自己维护的两张小表，**没有走 moment 的区域设置**——那是全局的，会污染别的插件。

### 想加别的语言？

内置只有 **简体中文**（底色）、**繁體中文**（字表转换）、**English** 三种 —— 体积有限，不再内置第四种字母语言（那等于再来一份英文表，约 +20KB）。

其余语言用 `registerLang` 自己接：注册后下拉里多一项，填进对应的译文即可；
**某个词条没填也不会空白**，一律回落到中文原文。用法见 `ARCHITECTURE.md` §7.5。

> 界面语言只影响**设置界面与浮窗/弹窗上显示的字**。笔记内容、转换结果、会话记录一律不变。
