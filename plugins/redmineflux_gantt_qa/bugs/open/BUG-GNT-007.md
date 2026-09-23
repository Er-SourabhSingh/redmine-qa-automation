# Bug Report

- Bug ID: BUG-GNT-007
- Production Redmine Issue ID: 121142
- Title: "Show Milestone Markers" is stored per-user instead of staying project-wide/shared, contradicting issue #120913's explicit requirement
- Redmine version: local dev build carrying issue #120913 (pre-release, not yet a tagged version)
- Plugin name: Redmineflux Gantt Chart
- Plugin version: n/a (dev build)
- Environment: Local Docker — `http://localhost:3010`
- Browser: Chromium (Playwright MCP)
- User role: Tested with Admin and Developer-role user `luna.blossom` (both have Manage versions, so both can reach the Settings panel — this bug is independent of BUG-GNT-006)
- Date: 2026-09-23

## Steps to reproduce

1. As Admin, open the project's Flux Gantt view, open Settings, and note "Show Milestone Markers" is checked (the default).
2. As a second user with Manage versions (`luna.blossom`), open the same project's Flux Gantt view, open Settings, and uncheck "Show Milestone Markers". Reload the page as this user and confirm the unchecked state persisted (rules out a save failure).
3. Log back in as Admin, open the project's Flux Gantt view, open Settings, and check the "Show Milestone Markers" checkbox state.

## Expected result

- Per production issue #120913 item 4: *"Bar colours and milestone markers should stay project-wide: the client confirmed these represent a shared visual convention for the team rather than a personal preference."* Admin should see the **same** "Show Milestone Markers" value that Luna set — i.e. unchecked — since this setting is explicitly meant to stay shared/project-wide, not become per-user like the other new view settings (zoom, sort, columns, critical-path scope, date range).
- This exact scenario is also TC-GNT-208 in `testcases/GANTT_VIEW_SETTINGS_AND_FILTERS.md`.

## Actual result

- After Luna unchecked "Show Milestone Markers" and it was confirmed to persist for her (still unchecked after her own reload), Admin's own Settings panel still shows it **checked** — Admin never saw Luna's change. The setting is being persisted independently per user, exactly like the genuinely-new-per-user settings (zoom, sort, etc.), rather than as one shared project-wide value.
- Note: "Show Milestone Markers" was used as the concrete probe for this because it is the only element under the Settings panel's "Milestone Markers" section reachable via the UI — the issue also names "bar colours" in the same shared-scope requirement, but no bar-colour picker control was found anywhere in this build's Settings panel or elsewhere in the Gantt UI to test independently. Given "Show Milestone Markers" already fails the shared-scope requirement, bar colours should be re-checked in a future session once/if a bar-colour control is located.

## Evidence

### Screenshot

![Milestone marker per-user isolation](../../screenshots/BUG-GNT-007/admin-still-checked-after-luna-unchecked.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-GNT-007/retest-yyyy-mm-dd-pass.png)

### Console / log

- No console errors. Confirmed via direct DOM checkbox state (`input[type=checkbox].checked`) rather than visual read alone, on both accounts, in the same browser session with only a login/logout between checks (rules out a stale-cache read).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` (including the newly-added BUG-GNT-006, which is a related but functionally distinct issue about Settings *panel access*, not this setting's *scope*) — no existing bug covers this.

## Severity

Medium — same rationale as BUG-GNT-006: this directly contradicts an explicit, client-confirmed requirement in issue #120913 item 4 (the "shared visual convention for the team" point was called out specifically because the client cared about it), but it doesn't corrupt data or block other functionality — it only means milestone-marker visibility silently diverges per user instead of staying a team-wide convention as intended.

## Notes

- Found while executing TC-GNT-208 (`testcases/GANTT_VIEW_SETTINGS_AND_FILTERS.md`). The test case's own text warns against the opposite mistake ("Do not treat a shared bar-colour/marker change as a per-user isolation defect — it is the documented, intended behavior") — this bug is the genuine failure mode that warning was guarding against: the setting turned out to be isolated per-user when it should be shared, not the reverse.
- Unlike BUG-GNT-006, this was reproduced with two users who **both** have Manage versions (Admin and Luna/Developer), so it is not a permission-visibility issue — it's a data-scoping issue in how the setting is persisted.
