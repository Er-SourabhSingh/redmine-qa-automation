# Bug Report

- Bug ID: BUG-GNT-006
- Production Redmine Issue ID: 121141
- Title: Settings gear for personal Flux Gantt view options still requires "Manage versions", contradicting issue #120913's stated permission relaxation
- Redmine version: local dev build carrying issue #120913 (pre-release, not yet a tagged version)
- Plugin name: Redmineflux Gantt Chart
- Plugin version: n/a (dev build)
- Environment: Local Docker — `http://localhost:3010`
- Browser: Chromium (Playwright MCP)
- User role: Reporter (project role with **View Flux Gantt** granted, **Manage versions** explicitly NOT granted) — user `daisy.skye`
- Date: 2026-09-23

## Steps to reproduce

1. As Administrator, confirm the "Flux Gantt Chart" permission group offers only two permissions anywhere in the role matrix: **View Flux Gantt** and **View Global Flux Gantt** (checked exhaustively across all checkboxes on the Reporter role edit page — no separate "manage own Gantt view" permission exists).
2. Add a project member whose role has **View Flux Gantt** granted but core **Manage versions** NOT granted (Reporter role, user `daisy.skye`).
3. Log in as that user and open the project's Flux Gantt view (`/projects/<id>/flux_gantt`).
4. Compare the toolbar to the same view opened by a user who has Manage versions (e.g. Admin, or a Developer-role user with Manage versions).

## Expected result

- Per production issue #120913 (ztflux, client JUWI GmbH) item 4: *"The 'Manage versions' requirement should no longer apply to a user's own view."* Any user who can view the Flux Gantt chart should be able to open the Settings panel and save their own personal zoom level, display mode, sort field/direction, display columns, critical-path scope, and milestone-marker preference — independent of core "Manage versions".
- This is also the explicit precondition/expected result written into `testcases/GANTT_VIEW_SETTINGS_AND_FILTERS.md` TC-GNT-207, sourced directly from the issue text.

## Actual result

- For a user without "Manage versions" (Reporter role, `daisy.skye`), the **Settings gear icon is completely absent from the toolbar** — not disabled, not read-only, simply not rendered. The "+ Add Release" button is also absent (expected, since creating releases is legitimately gated by Manage versions and is unrelated to personal view settings).
- With the Settings gear missing, this user has **no way at all** to change zoom level, display mode, sort field/direction, display columns (Show Assignee/Progress/Estimated Hours/Ticket Status/Baseline Controls), critical-path visibility or scope, or the milestone-marker toggle. The only personal-view control still reachable without Manage versions is the Date From/To range picker.
- Confirmed this is not a missing-permission-grant on the tester's side: the Reporter role's full permission checkbox list was inspected end-to-end and contains no alternate Flux Gantt permission that could unlock the Settings panel — only "View Flux Gantt" / "View Global Flux Gantt" exist under the Flux Gantt Chart group, and "Manage versions" (a core Redmine project permission, not part of the plugin's group) is the only thing gating the gear.

## Evidence

### Screenshot — user WITH Manage versions (Admin), Settings gear present

![Toolbar with Settings gear](../../screenshots/BUG-GNT-006/toolbar-admin-with-settings-button.png)

### Screenshot — user WITHOUT Manage versions (Reporter/Daisy Skye), Settings gear absent

![Toolbar missing Settings gear](../../screenshots/BUG-GNT-006/toolbar-daisy-reporter-no-settings-button.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-GNT-006/retest-yyyy-mm-dd-pass.png)

### Console / log

- No console errors — this is a UI-rendering/authorization gap, not a JS exception. Confirmed via accessibility snapshot (not just visual screenshot) that the toolbar's button list for Daisy is exactly `["Issues Without Version", "Fullscreen", "Export"]`, vs. `["+ Add Release", "Settings", "Issues Without Version", "Fullscreen", "Export"]` for Admin/Luna.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` (empty) and `bugs/_index.md` (all 5 prior bugs, all closed, none related to permissions or the Settings panel visibility) — no existing bug covers this.

## Severity

Medium — does not corrupt data, does not leak information across permission tiers, and has a workaround (grant Manage versions). However it defeats the core, client-requested value of two explicit new-feature items in issue #120913 (item 4's stated permission relaxation, and item 7's "different roles prefer different perspectives" rationale for per-user critical-path scope) for every project role that isn't Manage-versions-capable — which in practice is most non-manager roles.

## Notes

- Found while executing TC-GNT-207 (`testcases/GANTT_VIEW_SETTINGS_AND_FILTERS.md`), which explicitly anticipated this exact failure mode: *"This is a permission relaxation versus the plugin's pre-#120913 behavior... verify explicitly rather than assuming, since a relaxation that silently fails to apply is itself a defect."*
- Also blocks live execution of TC-GNT-224 (critical-path scope stored per user) and the "own view" halves of TC-GNT-205 for any non-Manage-versions role, since none of those settings are reachable without the gear.

## Retest — 2026-09-24, FIXED

- Dev build redeployed (`redmine-docker-700-redmine-1` container restarted, Gantt plugin JS/CSS assets rewritten — confirmed via `docker logs`).
- Logged in as `daisy.skye` (Reporter, still no "Manage versions") and opened the project's Flux Gantt view: the **Settings gear button is now present** in the toolbar (`["Settings", "Issues Without Version", "Fullscreen", "Export"]`, vs. `["Issues Without Version", "Fullscreen", "Export"]` before) — "+ Add Release" correctly remains absent (still legitimately gated).
- Clicked it: the panel opens fully with **Zoom level, Display Mode, Show Today Line, Sort By + Direction, and Display Fields (Show Assignee/Progress/Estimated Hours/Ticket Status/Baseline Controls/Critical Path) all reachable and interactive** for Daisy — confirmed via accessibility snapshot, not just the button's presence.
- **Fixed.** Moving to `bugs/closed/`.

### Retest screenshot

![Retest — Daisy's Settings panel now opens fully](../../screenshots/BUG-GNT-006/retest-2026-09-24-pass.png)

### Production status sync — 2026-09-24

- Production issue #121141 updated: In QA → **Done**, % done → **100**. Verified via `get_issue`: `Status: Done`, `Done ratio: 100%`.
