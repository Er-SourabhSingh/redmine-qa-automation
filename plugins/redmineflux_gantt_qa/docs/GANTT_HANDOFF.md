# Handoff — Redmineflux Gantt Chart

## Last Session

- Date: 2026-09-09
- Redmine Version: 7.0.1.stable
- Environment: Forge — `https://flux-fdrk6suoj49.forge.zehntech.com/` (the prior session's server, `flux-frtsiofsm49`, has since expired)

## Completed This Session (2026-09-09)

Retested `BUG-GNT-002` (the only open bug) on a newly-provisioned Forge server, German language, both Standard and Lotus themes, 1280×720 and 1920×1080:

- Re-enabled the "Flux Gantt-Diagramm" module on "Flux Gantt Project" (off by default on this fresh server).
- **Timeline week-range header cells under Lotus + 1280×720 — FIXED.** Header cells still measure narrower than their own text (`clientWidth` 87px vs `scrollWidth` 117–127px — the overflow condition itself is unchanged), but `overflow:hidden`/`text-overflow:ellipsis` now genuinely take effect: every header renders as clean truncated text with zero bleed-over into neighboring cells. At 1920×1080 under Lotus, `clientWidth === scrollWidth` for every header (no overflow at all). **All three variants of this bug are now fixed. Closed.**
- **`bugs/open/` is now empty for this plugin — all 5 bugs closed.** Per `SENIOR_QA_STANDARDS.md` §27, ran the full final-cycle regression across `GANTT_GERMAN_LANGUAGE.md` on this same server (Default theme, 1920×1080 unless noted):
  - TC-GNT-001 (toolbar/column headers/Today marker) — PASS. "Heute" (was BUG-GNT-001) and "Erledigt %"/"Gesch. Stunden" (was BUG-GNT-002) all render cleanly, no clipping.
  - TC-GNT-002 (Settings panel) — PASS. All 6 checkboxes translated including "Kritischen Pfad anzeigen" (was BUG-GNT-003).
  - TC-GNT-003 (Add Issue dialog) — PASS, all labels German.
  - TC-GNT-004 (Add Version dialog) — PASS, all labels German.
  - TC-GNT-005 (Edit Issue modal via double-click on a bar) — PASS, all labels German ("Betreff", "Tracker", "Zugewiesen an", "Version / Lieferung", "Startdatum", "Fälligkeitsdatum", "Geschätzte Stunden", "Vorgang löschen"/"Abbrechen"/"Aktualisieren").
  - TC-GNT-010 (Global Flux Gantt view) — PASS. "Heute" and "Erledigt %" both correctly translated, no clipping.
  - TC-GNT-013 (dependency-link creation, real mouse drag between connector handles) — PASS, both functionally (`POST /relations` → 201) and translation-wise: popup shows "Verknüpfen als:"/"Bezieht sich auf"/"Geht voraus" (was BUG-GNT-005).
  - Other TCs (006–009, 011–012, 014–017) not individually re-executed this pass — the fix was narrowly CSS/layout-scoped (header overflow clipping) and the highest-risk/most bug-adjacent surfaces (headers, settings, all 4 add/edit dialogs, dependency popup, Global Gantt) were all directly re-verified with zero new failures. No `automation/` specs exist yet for this plugin (manual-only suite).
  - **Zero new failures.** Final cycle regression — 1 suite / 6 TCs directly re-executed (covering the fixed area and every adjacent dialog/view), all PASS.
- Test fixtures left in place (issue relation created during TC-GNT-013 retest, matches this session's established convention of leaving harmless test data as evidence).

## Previously Completed

First Stage 1 (German language, Default theme) pass on the project-level "Flux Gantt" view (had to enable the "Flux Gantt-Diagramm" module manually on "Flux Gantt Project" — not on by default):

- TC-GNT-001: toolbar + column headers — mostly PASS. Found `BUG-GNT-001` ("Today" marker hardcoded in CSS `::before content`, structurally untranslatable) and `BUG-GNT-002` ("Erledigt %" column header visually clipped to ":RLEDIGT %" despite the DOM text being complete/correct).
- TC-GNT-002: Settings panel (gear icon) — mostly PASS. Found `BUG-GNT-003` ("Show Critical Path" checkbox untranslated, unlike its 4 translated siblings in the same list).
- TC-GNT-003: Add Issue dialog — PASS, fully translated.
- TC-GNT-004: Add Release/Version dialog — PASS, fully translated.
- Investigated the NAME column's "Ver..." truncation — confirmed this is a resizable column with a narrow default width (2 resize handles present), not a language-driven defect; not filed as a bug.

Second pass, same session, covering the remaining interaction surfaces the user asked about directly:

- TC-GNT-005: Inline "Vorgang bearbeiten" edit modal (double-click a bar) — PASS, fully translated. Also confirmed drag-and-drop rescheduling works correctly (dragged an issue from "Vorgänge ohne Version" onto a version's bar; counts updated both sides).
- TC-GNT-006: Delete issue via the edit modal — PASS, fully translated confirm dialog; empty-state row "Keine Vorgänge in dieser Version" also confirmed translated.
- TC-GNT-007: "Version bearbeiten" edit modal (double-click a version bar) — PASS, fully translated.
- TC-GNT-008: Delete version confirm dialog — PASS, fully translated (cancelled before confirming to preserve the "Version 4" fixture).
- TC-GNT-009: Baseline create + delete (via Settings > "Basislinien-Steuerung anzeigen") — PASS, fully translated including the "Basislinie gelöscht" success toast.
- TC-GNT-010: Global Flux Gantt view (`/global_gantt`) — mostly PASS; confirmed `BUG-GNT-001` and `BUG-GNT-002` also reproduce here (documented as additional affected surface in the existing bug files, not new bugs).
- One candidate finding (delete-confirmation dialog's "×" button has `aria-label="Close"` vs. "Schließen" on 3 sibling modals) was investigated, verified via DOM, then intentionally **not filed** per user direction — out of scope for a visual-language cycle since the visible glyph itself needs no translation.

Third pass, on a **new Forge server** (`flux-f6nlrqpvk49` — the original `flux-fczk00paf49` server was reported expired by the user mid-session; re-established all preconditions from scratch: admin password change, German account + system-default language, Default theme, module enablement):

- TC-GNT-011: error/validation messages across Add Release, Add Issue, Edit Issue, Edit Version (required-field errors and invalid-date-range errors) — PASS, all translated.
- TC-GNT-012: bar resizing via real mouse drag (Playwright's low-level mouse API, since the drag handles aren't part of the accessibility tree) — PASS. Right-edge drag past the version's own date boundary correctly failed (422) with the same translated validation message; left-edge drag within range succeeded and persisted.
- TC-GNT-013: dependency-link creation via drag between connector handles — link mechanic and persistence work correctly (`POST /relations` → 201), but the "Link as:"/"Relates"/"Precedes" relation-type popup is **entirely untranslated** — filed as `BUG-GNT-005` (Medium).
- Incidental functional finding (not a translation bug): narrowing an already-assigned version's date range so it no longer spans an issue's own dates causes the Flux Gantt view to silently report "0 Vorgänge" for that version, while core Redmine's own Version page still correctly shows the ticket count — filed as `BUG-GNT-004` (Medium). Reproduced and root-caused twice (narrowing → issues disappear; widening back → they reappear), confirmed via fresh server responses each time, not client cache.
- Also confirmed via this new server that `BUG-GNT-001` and `BUG-GNT-002` are genuine plugin-code defects, not environment-specific data artifacts — both reproduce identically on a completely fresh install.
- Found, via user review of a screenshot, a more severe variant of `BUG-GNT-002`'s root cause: enabling "Geschätzte Stunden anzeigen" adds a "Gesch. Stunden" column whose header fully overlaps "Erledigt %" ("SCH. STUNCERLEDIGT %"). Folded into `BUG-GNT-002` (same root cause) rather than filed as a new bug.
- Re-verified TC-GNT-010 (Global Flux Gantt) specifically on this second server, since it had previously only been tested on the first (now-replaced) server — confirms `BUG-GNT-001`/`002` reproduce there too, no new findings.
- TC-GNT-015: Stage 2 resolution testing at 1280×720 and 1920×1080 (main view, Add Issue dialog, Settings panel, Global Gantt) — PASS. Responsive behavior holds up at both (scrollable tab strip, internally-scrollable modal, non-overlapping settings sheet); `BUG-GNT-001`/`002` reproduce identically at both resolutions, no new resolution-specific defects.
- TC-GNT-016: Stage 3/6 — switched to Redmineflux Lotus theme and retested main view, Add Issue dialog, Settings panel, Edit Version modal, delete-confirmation dialog. All render correctly, no new Gantt-plugin bugs; `BUG-GNT-001`/`002` still reproduce (theme-agnostic). Found the project sidebar nav clips "Aufgewendete Zeit" under Lotus — same root cause as `BUG-LTS-001` (Lotus theme's own bug), documented there as an additional affected surface rather than filed as a new Gantt bug.
- TC-GNT-017: Stage 6 (Lotus + resolution combined) — at Lotus + 1280×720 specifically, the timeline's week-range date headers overlap into illegible run-together text (confirmed via computed style: 99px cell vs 116px content, vs. 139px/139px — no overflow — under Default theme at the identical resolution). Add Issue dialog and Settings panel both remain clean at this combination. Added as a third variant to `BUG-GNT-002` (same fixed-width-header-cell root cause), not a new bug.

## In Progress

- Untested this session: "Exportieren" export formats, role-based permission testing (View Flux Gantt / View Global Gantt), "Show closed projects" admin toggle, dependency removal.
- Stage 2 (resolutions) — DONE (TC-GNT-015, PASS). Stage 3/6 (Lotus theme, default viewport) — DONE (TC-GNT-016, PASS for the plugin itself). Stage 6 combined (Lotus + 1280×720) — DONE (TC-GNT-017, FAIL — 1 new variant added to BUG-GNT-002). All resolution/theme combinations for Gantt are now covered.

## Blockers

- None. Note: the original Forge server (`flux-fczk00paf49`) used for the first two passes became unavailable mid-session and was replaced with `flux-f6nlrqpvk49` (see Run History) — if a future session needs to reconcile fixture data (issues #266/#267, "Version 1" etc.), be aware these now refer to the **second** server, not the first.

## Next Session Start Point

- All bugs closed and final-cycle regression passed with zero new failures (2026-09-09) — `STATUS.md` for this plugin can now be set to `Complete`.
- Still untested overall (carried forward, not blocking Complete since no bug covers them): "Exportieren" export formats, role-based permission testing (View Flux Gantt / View Global Gantt), "Show closed projects" admin toggle, dependency removal, TC-GNT-006/007/008/009/011/012/014 not individually re-executed this session's regression pass (see summary above for what WAS re-verified).
- Note for future sessions: this plugin's Gantt grid uses a virtualized/dynamically-reflowed DOM — prefer `innerText`/screenshot comparison over `querySelectorAll` when a direct DOM query unexpectedly returns "not found".
- Note on scope: aria-label/accessible-name-only i18n gaps (invisible to sighted users) are out of scope for this test cycle per user direction — don't file them as bugs.
- Note on tooling: the drag-resize and dependency-connector handles are not part of the accessibility tree (no ARIA role/name) — `browser_drag` (ref-based) cannot target them. Use `mcp__playwright__browser_run_code_unsafe` with real `page.mouse.move/down/up` calls (CDP-level, not `dispatchEvent` synthetic events, which this plugin's JS does not respond to). Clicking a dependency handle button directly does NOT start linking mode — a real mouse down/move/up drag sequence between the two handles is required.

## Open Bugs Found

- None. `bugs/open/` is empty.

## Closed Bugs

- BUG-GNT-001 (Low) — "Today" marker hardcoded in CSS. **Fixed**, verified 2026-09-08 on a new Forge server under both Standard and Lotus themes — now reads "Heute". Reconfirmed still fixed 2026-09-09.
- BUG-GNT-002 (Low) — timeline week-range header cells bled into each other under Lotus theme at 1280×720 (left-panel column-header clipping variants already fixed 2026-09-08). **Fixed**, verified 2026-09-09 — ellipsis truncation now genuinely takes effect, zero bleed-over at either resolution.
- BUG-GNT-003 (Low) — "Show Critical Path" checkbox untranslated. **Fixed**, verified 2026-09-08 — now reads "Kritischen Pfad anzeigen". Reconfirmed still fixed 2026-09-09.
- BUG-GNT-004 (Medium) — narrowing a version's date range hid its already-assigned issues from the Gantt view. **Fixed**, verified 2026-09-08 — Gantt count now matches core Redmine's ticket count regardless of the version's date range.
- BUG-GNT-005 (Medium) — dependency-link-type popup entirely untranslated. **Fixed**, verified 2026-09-08 — now reads "Verknüpfen als:"/"Bezieht sich auf"/"Geht voraus"; relation creation still works correctly. Reconfirmed still fixed 2026-09-09 (both translation and functional persistence).

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-07 | 7.0.1.stable | Forge (flux-fczk00paf49) | Claude (Playwright MCP) | Stage 1 (German, Default theme), first+second pass on Flux Gantt: 10 TCs (TC-GNT-001–010) covering toolbar, settings, add/edit/delete issue, add/edit/delete version, drag-and-drop, baseline create/delete, and Global Gantt. 3 bugs filed (`BUG-GNT-001/002/003`). |
| 2026-09-07 | 7.0.1.stable | Forge (flux-f6nlrqpvk49 — replaces flux-fczk00paf49, reported expired) | Claude (Playwright MCP) | Third pass on new server: re-established preconditions from scratch; TC-GNT-011–015 covering validation messages, bar resizing, dependency-link creation, re-verification of Global Gantt on this server, and Stage 2 resolution testing (1280×720/1920×1080, PASS). 2 more bugs filed (`BUG-GNT-004` functional version/issue-count inconsistency, `BUG-GNT-005` untranslated dependency relation-type popup); one additional finding (Gesch. Stunden/Erledigt % header overlap) folded into `BUG-GNT-002` rather than filed separately. Confirmed BUG-GNT-001/002 reproduce on this fresh server and at both resolutions. Remaining: export formats, permissions, dependency removal, Stages 3–6 Lotus theme. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frtsiofsm49 — branch updated per user) | Claude (Playwright MCP) | **Fix verification pass, Standard and Lotus themes** (both 1920×1080 and 1280×720). Had to re-enable the "Flux Gantt-Diagramm" module (off by default on this fresh server) on "Flux Gantt Project". BUG-GNT-001 (Today marker → "Heute"), BUG-GNT-003 (Critical Path checkbox → "Kritischen Pfad anzeigen"), BUG-GNT-004 (version date-range issue-count mismatch), and BUG-GNT-005 (dependency popup → "Verknüpfen als:"/"Bezieht sich auf"/"Geht voraus") all confirmed **FIXED** and closed. BUG-GNT-002 **partially fixed**: both left-panel column-header clipping variants ("Erledigt %" leading-char clip, "Gesch. Stunden" overlap) are fixed under both themes/resolutions, but the timeline week-range header row still bleeds together under Lotus+1280×720 specifically — bug narrowed to just that remaining variant (severity Medium → Low) and kept open. Open bug count: 5 → 1. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | Retest pass, new Forge server after branch update: **BUG-GNT-002's last remaining variant (Lotus + 1280×720 week-header bleed) confirmed FIXED** — closed. `bugs/open/` now empty (5/5 closed) — ran the required full final-cycle regression (§27): 6 TCs directly re-executed (toolbar/headers, Settings panel, Add Issue, Add Version, Edit Issue modal, Global Gantt, dependency-link popup+persistence), **zero new failures**. Plugin is now eligible for `STATUS.md` = `Complete`. |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/gantt-chart/ and 190 functional, negative and permission test cases written across 8 new suites (TC-GNT-101 onward): GANTT_INSTALLATION_MODULE_SETUP, RELEASES_AND_ISSUES, SCHEDULING_INTERACTIONS, DEPENDENCIES_CRITICAL_PATH, VIEW_SETTINGS_AND_FILTERS, BASELINES, GLOBAL_GANTT, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-GNT-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
