# BUG-GNT-002

- Bug ID: BUG-GNT-002
- Production Redmine Issue ID: 120121
- Severity: Low (narrowed 2026-09-08 — the original Medium-severity findings on the left-panel column headers are fixed; only the Lotus+1280×720 timeline week-header variant remained) — **FIXED 2026-09-09, see below**
- Title: [FIXED — see below] Timeline week-range header cells no longer bleed into each other under Lotus theme at 1280×720; all three variants of this bug are now resolved
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Gantt Plugin (redmineflux_gantt_plugin)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- German language active.
- A project with the "Flux Gantt-Diagramm" module enabled.

## Steps to reproduce

1. Open the project's "Flux Gantt" tab.
2. Look at the left panel's column headers: "NAME", "ZUGEWIESEN AN", and the rightmost progress column.

## Expected result

- The progress column header should read "ERLEDIGT %" in full, consistent with the German translation confirmed present in the page's own text content.

## Actual result

The column header visually renders as **":RLEDIGT %"** — the leading character(s) of "ERLEDIGT %" are clipped/cut off, replaced by what appears to be a stray colon or border artifact at the visible left edge.

Confirmed this is a genuine rendering/layout defect, not a translation gap — `document.body.innerText` independently captured the complete, correct string **"ERLEDIGT %"** in the page's actual text content at the same moment the visual clipping was observed in the screenshot. This proves the translation itself is correct and complete; the defect is purely in how this specific narrow column header is laid out/rendered (most likely insufficient column width for the German string combined with some form of left-edge overflow clipping, though the exact CSS could not be pinned down via `querySelectorAll`/`TreeWalker` — this plugin's Gantt grid appears to use a virtualized/dynamically-reflowed DOM that shifted between inspection attempts).

## Severity rationale

Medium: a core, always-visible column header renders visibly broken/confusing (looks like a typo or truncation artifact) on every load of the Flux Gantt view — high visibility, though the column's actual data (percentage values) is unaffected and still usable.

## Additional affected surface (confirmed 2026-09-07)

Also reproduced on the **Global Flux Gantt view** (`/global_gantt`) — same clipped header, same layout defect, cross-project timeline. Same root cause, not a separate bug.

## Additional affected surface — "Gesch. Stunden" column enabled (confirmed 2026-09-07, second Forge server flux-f6nlrqpvk49)

With "Geschätzte Stunden anzeigen" (Show Estimated Hours) enabled in Settings, the same underlying defect produces a more severe symptom: the added "Gesch. Stunden" column header fully overlaps the neighboring "Erledigt %" header, rendering as illegible merged text **"SCH. STUNCERLEDIGT %"** (vs. this bug's original single-header leading-character clip).

Root cause confirmed via DOM inspection — same category as the original finding, insufficient column width for German-length header text:

- Both headers' underlying text is complete and correctly translated ("Gesch. Stunden", "Erledigt %") — confirmed via `document.createTreeWalker` text search, not a translation gap.
- The "Gesch. Stunden" column container (`.rf-gantt-left__col-estimated`) is a `flex-shrink: 0` flex child fixed at **72px** width, while its own header text needs **99px** (`scrollWidth`) — a 27px overflow.
- Despite the container declaring `overflow: hidden` and `text-overflow: ellipsis`, the overflowing text visibly paints over the next column instead of being clipped/ellipsized — suggesting the CSS clipping isn't actually taking effect at render time (possibly a stacking-context or flex min-width issue), consistent with this bug's original note that the exact clipping mechanism couldn't be fully pinned down.

Same root cause as the original finding, not a separate bug — filed here instead of as a new bug ID per user direction (originally drafted as a separate `BUG-GNT-006` before being folded in).

## Additional affected surface — week-range date headers under Lotus theme at 1280×720 (confirmed 2026-09-07, second Forge server flux-f6nlrqpvk49)

A third variant, this time in the **timeline's own week-range header row** (e.g. "31 Aug - 4 Sep, 2026", "7 Sep - 11 Sep, 2026", ...) rather than the left-panel column headers — and specifically triggered by the combination of the Redmineflux Lotus theme **and** the 1280×720 resolution (a genuine Stage 6 finding: Lotus theme + resolution testing combined).

- Under **Default theme at 1280×720**, this same header cell measures `clientWidth` 139px with `scrollWidth` 139px — no overflow, renders cleanly.
- Under **Lotus theme at 1280×720**, the identical cell (same date range, same viewport width) measures `clientWidth` 99px vs. `scrollWidth` 116px — a 17px overflow, caused by Lotus's persistent left sidebar consuming horizontal space that Default theme doesn't use, leaving less room per timeline column at this resolution.
- Same failure mode as the other two variants above: the cell declares `overflow: hidden`, `white-space: nowrap`, `text-overflow: ellipsis`, but the overflowing text visibly bleeds into the neighboring week's header cell instead of being clipped, rendering the entire header row as illegible run-together text (e.g. "...g - 4 Sep, 20:Sep - 11 Sep, 20:Sep - 18 Sep, 20:...").
- Confirmed at 1920×1080 under Lotus this does **not** reproduce (wider viewport leaves enough room even with the sidebar) — this is specifically a Lotus+1280×720 combination issue, not Lotus alone or 1280×720 alone.

Same root cause as the other two variants (Gantt plugin's own fixed-pixel-width header cells with non-functional `overflow: hidden` clipping) — documented here rather than filed separately.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-GNT-002/erledigt-column-header-clipped.png)

### Screenshot — "Gesch. Stunden" overlap variant

![Gesch. Stunden overlaps Erledigt %](../../screenshots/BUG-GNT-002/estimated-hours-header-overlaps-progress-header.png)

### Screenshot — week-range header overlap under Lotus at 1280×720

![Week-range headers overlap under Lotus at 1280x720](../../screenshots/BUG-GNT-002/week-header-overlap-lotus-1280x720.png)

### Retest screenshot — fix verified (2026-09-09)

![Retest — week headers clean at Lotus 1280x720](../../screenshots/BUG-GNT-002/retest-2026-09-09-lotus-1280x720-fixed.png)

### Console / log

- No related console errors; this is a CSS/layout rendering defect.

## Partial fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, branch updated) under both Standard and Lotus themes, at both 1920×1080 and 1280×720.

- **Original finding (left-panel "Erledigt %" header clip) — FIXED.** Confirmed via zoomed screenshot crop: "ERLEDIGT %" now renders fully and cleanly, no leading-character clipping, under both themes and both resolutions.
- **"Gesch. Stunden" overlap variant — FIXED.** Confirmed via zoomed screenshot crop: the "Gesch. Stunden" column (still measuring `clientWidth` 80px vs `scrollWidth` 130px — the underlying overflow is unchanged) now correctly ellipsis-truncates to "GESCH. STU…" with **no bleed-over** into the neighboring "Erledigt %" column, under both themes and both resolutions. `overflow:hidden`/`text-overflow:ellipsis` are confirmed taking effect now (previously they were declared but not actually clipping).
- **Week-range timeline header variant (Lotus + 1280×720) — STILL REPRODUCES.** The timeline's own week-range header cells (e.g. "14 Sep - 18 Sep, 2026") still measure `clientWidth` 124px vs `scrollWidth` 126–132px (a smaller overflow than the original report's 116px vs 99px, but still present) and the overflow still visibly bleeds into the next cell instead of being clipped — confirmed via screenshot showing "...202621 Sep - 25 Sep, 2026..." merged illegibly. This is the one variant of this bug that is **not yet fixed**; the other two (left-panel column headers, in both their forms) are resolved. Narrowing this bug's scope to just this remaining variant going forward.

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Redmineflux Lotus theme, tested at both 1280×720 and 1920×1080.
- Enabled the "Flux Gantt-Diagramm" module on "Flux Gantt Project" (not enabled by default on this fresh server) and opened its own `/flux_gantt` tab.
- **At 1280×720 under Lotus**: the week-range header cells still measure narrower than their own text (e.g. `clientWidth` 87px vs `scrollWidth` 117–127px across the 5 visible headers) — the underlying overflow condition is unchanged. However, `overflow:hidden`/`text-overflow:ellipsis` now genuinely take effect at render time: every header renders as clean truncated text ("Aug - 4 S...", "7 Sep - 11 Se...", "14 Sep - 18 S...", "21 Sep - 25 S...") with **zero bleed-over** into neighboring cells — confirmed both visually (screenshot) and via bounding-box x-positions (each cell's box starts exactly 100px apart, non-overlapping).
- **At 1920×1080 under Lotus**: `clientWidth === scrollWidth` for every header cell (no overflow at all at this width), consistent with the original report.
- This matches the same fix pattern already confirmed for this bug's other two variants (left-panel "Erledigt %" clip, "Gesch. Stunden" overlap) — the plugin's CSS clipping mechanism now works correctly across all three affected surfaces.
- **All three variants of this bug are now fixed. Closing.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
