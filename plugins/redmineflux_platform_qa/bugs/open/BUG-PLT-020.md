# Bug Report Template

- Bug ID: BUG-PLT-020
- Production Redmine Issue ID: #121710
- Title: The "Add members" user picker's search box never actually filters the option list — the full, unfiltered list stays visible above a "No user matches that search" message even when it should be empty
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, open any team's detail page (`/redmineflux_platform/teams/<id>`), click "Add members".
2. Click the "Select users" combobox to expand the picker (a listbox of 21 checkable user options appears).
3. Type a partial name into the "Search users" box that should narrow the list, e.g. `Sel` (should match only "Selene Frost").
4. Type a term matching nobody, e.g. `zzznomatch123`.

## Expected result

- Per `PLATFORM_PLUGIN_TESTER_GUIDE.md`'s own testing guidance and this cycle's TC-PLT-122 ("the users picker filters as you type and shows chips for who is chosen"), the option list should narrow to only the matching user(s) as the search term is typed, and show 0 options (with the "no results" message) when nothing matches.

## Actual result

The option list **never narrows at all**, regardless of what is typed:

- Typing `Sel` (should isolate "Selene Frost") — all 21 users remained visible and checkable in the listbox.
- Typing `zzznomatch123` (matches no real user) — the picker correctly detects there are no matches (it shows the text "No user matches that search." and disables the "Select all"/"Clear" buttons at the bottom), **but the full, unfiltered list of all 21 users is still rendered and scrollable directly above that message** — confirmed visually via screenshot, not just in the accessibility tree (ruling out a tree-vs-render mismatch).

So the "no results" detection logic runs correctly (it knows when nothing matches), but whatever step is supposed to actually hide/filter the non-matching `<option>` elements from view never executes. The search box gives the strong visual impression of a working live filter (placeholder "Search...", a dedicated input directly above the option list) while doing nothing to the list itself.

## Evidence

### Screenshot

![The full unfiltered 21-user list is still visible and scrollable above "No user matches that search.", despite the search box containing "zzznomatch123"](../../screenshots/BUG-PLT-020/user-picker-filter-not-applied.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-020/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — a silent front-end filtering failure, not a crash.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-09-30 as **#121710** (project `ztflux`, tracker Bug, Priority Low, Defect Type Functional, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121706 (`Entity CRUD and Field Validation`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121710 attached.
