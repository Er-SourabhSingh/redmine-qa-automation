# BUG-GNT-004

- Bug ID: BUG-GNT-004
- Production Redmine Issue ID: 120123
- Severity: Medium
- Title: Widening/narrowing a Version's date range so it no longer spans an already-assigned issue's own dates causes the Flux Gantt view to silently under-report/hide that issue — while core Redmine's own Version page still correctly counts it
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Gantt Plugin (redmineflux_gantt_plugin)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-f6nlrqpvk49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- German language active.
- A project with the "Flux Gantt-Diagramm" module enabled and at least one Version.

## Steps to reproduce

1. Create two issues (e.g. #266, #267) and assign both to a Version (e.g. "Version 1") via drag-and-drop from "Vorgänge ohne Version" onto the version's timeline bar. Confirm the version's row shows "2 Vorgänge".
2. Double-click the version's bar to open "Version bearbeiten" and edit its Fälligkeitsdatum (due date) to a date **earlier** than one or both assigned issues' own due dates (in this repro: issues both had Start/Due = 30.09.2026; Version 1's due date was changed from 30.09.2026 to 25.09.2026).
3. Click "Aktualisieren" to save, then reload the Flux Gantt page.
4. Separately, open the Version's own core Redmine page (`/versions/<id>`, e.g. via Roadmap or the version link) to check its actual ticket count.

## Expected result

- The Flux Gantt view's "Vorgänge" count for the version should match core Redmine's own ticket association (`fixed_version_id`) — an issue assigned to a version stays counted under that version in the Gantt regardless of whether the version's date range happens to still span the issue's own dates.

## Actual result

After narrowing Version 1's due date to 25.09.2026 (before the issues' own dates of 30.09.2026):

- **Flux Gantt view** (`/projects/fluxganttproject/flux_gantt`, reloaded fresh — not a client cache artifact): Version 1 row reads **"0 Vorgänge"**, and expanding it shows the translated empty-state row "Keine Vorgänge in dieser Version" (No issues in this version).
- **Core Redmine's own Version page** (`/versions/1`), viewed in the same moment with the same due date (25.09.2026) displayed at the top: **"2 Tickets (0 geschlossen — 2 offen)"**, explicitly listing both "Bug #266: QA Bar Resize Test A" and "Bug #267: QA Dependency Test B" as "Zugehörige Tickets" (associated tickets).
- Confirmed this is driven specifically by the version's date range vs. the issues' own dates (not a stale cache): widening Version 1's due date back out to 30.09.2026 (to once again span the issues' own dates) immediately made the Flux Gantt view correctly show "2 Vorgänge" again, on a fresh reload, with no other change.
- The issues' own `fixed_version_id` association was never altered by this sequence — confirmed via issue #266's own detail page, which showed "Zielversion: Version 1" throughout, even while the Gantt widget reported the version as empty.

This means: any admin action that narrows a version's date range (a plausible real action — e.g. pulling in a sprint's end date) after issues are already assigned can cause the Flux Gantt view to silently misreport the version's issue count and hide the affected issues' bars from the timeline, even though nothing about the issue-to-version assignment changed and core Redmine still considers them correctly associated.

## Severity rationale

Medium: no data is actually lost or corrupted (the underlying association and dates are untouched, and reverting the version's date range immediately restores correct display) — but the Flux Gantt view can silently and materially misrepresent how many issues are really assigned to a version, which could mislead a PM reviewing sprint/version load, and affected issues effectively disappear from the timeline with no error or warning shown.

## Evidence

### Screenshot

![Flux Gantt view shows 0 Vorgänge](../../screenshots/BUG-GNT-004/gantt-view-shows-0-vorgange.png)

![Core Redmine Version page shows 2 Tickets, same due date](../../screenshots/BUG-GNT-004/core-redmine-shows-2-tickets.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-GNT-004/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a data-filtering/query logic issue in how the Flux Gantt backend or frontend computes a version's issue list, not a JS exception.

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, branch updated). Used "Flux Gantt Project"'s existing "Version 2" (10 issues assigned, all due 30.09.2026) and narrowed its own due date (via the core Redmine version edit form, to work around an unrelated date-input quirk in the Gantt modal) to 18.09.2026 — earlier than the issues' own 30.09.2026 dates, satisfying the same precondition as the original report. **Flux Gantt view correctly still showed "10 Vorgänge"** for Version 2 (not "0 Vorgänge"), matching core Redmine's own Version page ("10 Tickets, 0 geschlossen — 10 offen"). **FIXED** — the Gantt view no longer hides/undercounts issues when a version's date range no longer spans them. Version 2's dates restored to the original 30.09.2026/30.09.2026 afterward.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
