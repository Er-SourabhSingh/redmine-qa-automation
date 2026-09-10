# BUG-HLP-017

- Bug ID: BUG-HLP-017
- Production Redmine Issue ID: 119713
- Title: Documented "Merge duplicate tickets" feature (#17 in HELPDESK_FEATURES_LIST.md, §7.4 of HELPDESK_USER_GUIDE.md) has no discoverable control anywhere in the UI
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-31)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`luna.blossom`)
- Date: 2026-08-31

## Steps to reproduce

1. Create two Support tickets describing the same underlying problem (reproduced: ticket **#12** "TC-HLP-025 duplicate A - printer not connecting to network" and ticket **#13** "TC-HLP-025 duplicate B - printer offline on office network", both in Helpdesk QA Alpha).
2. Open ticket #12 (or #13) individually and look for a **Merge** control anywhere on the page — per `HELPDESK_USER_GUIDE.md` §7.4: "open one ticket and use **Merge** to fold it into the other."
3. Separately, from the project's core Issues list (`/projects/helpdesk-qa-alpha/issues`), select both tickets' checkboxes and open the multi-select context menu (right-click, or `/issues/context_menu?ids[]=12&ids[]=13` directly).

## Expected result

- Per `HELPDESK_FEATURES_LIST.md` feature #17 ("Merge duplicate tickets — Folds one ticket into another, carrying notes and history") and `HELPDESK_USER_GUIDE.md` §7.4, a **Merge** action should be reachable from an individual ticket's own page.

## Actual result

- **No control labeled "Merge" exists anywhere.** On ticket #12's own page, the only per-ticket action menu is the "Actions" dropdown next to Reply/Edit/Log time/Watch — its full contents are just **Copy link** (confirmed via full-page snapshot; a case-insensitive search of the entire rendered page for "merge" matches nothing except this bug's own test-fixture description text).
- Checked the alternative interpretation (a multi-select action, since Redmine core issues can be selected via checkbox and acted on via a context menu) — selected both #12 and #13 from the core Issues list and opened the context menu (`/issues/context_menu?ids[]=12&ids[]=13`, the same request the app's own right-click menu makes). Its **full, complete contents** are: Bulk edit, Status, Tracker, Priority, Assignee, Progress, Issue Category, Watch, Filter, Copy link, Copy, Delete issues, Remove All Testcase. **No Merge option anywhere in this list either.**
- Between the two most plausible UI locations for this documented feature, neither has it. Whether a backend merge action/route exists at all was not further probed (no known/discoverable URL to test), so this is reported as "no discoverable entry point," matching the shape of the already-closed BUG-HLP-013 (a real, working feature with no UI button) — except here it isn't yet established that any backend implementation exists behind the missing control.

## Evidence

### Screenshot

![Ticket #12's own page — full page, no Merge control anywhere; only Actions dropdown content is "Copy link"](../../screenshots/BUG-HLP-017/ticket12-no-merge-control-anywhere.png)
![Multi-select context menu for tickets #12 and #13 — full menu contents, no Merge option](../../screenshots/BUG-HLP-017/context-menu-two-selected-no-merge.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-017/retest-yyyy-mm-dd-pass.png)

### Console / log

- Full-page snapshot of `/issues/12`: zero matches for "merge" (case-insensitive) outside of this session's own test-fixture text.
- `/issues/context_menu?ids[]=12&ids[]=13` response: 13 total action items, none named Merge.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `testcases/HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-025 (Merge) — this single missing control blocks **three** test cases in that suite that all depend on Merge existing: TC-HLP-025 (basic merge), TC-HLP-032 (merge preserving both tickets' prior reply/note history), and TC-HLP-041 (merging a ticket into itself is rejected/no-effect). All three are recorded as FAIL/blocked in the test case file, cross-referencing this bug, rather than each filing a separate one.
- Ticket #12 and #13 are left in place (not deleted) as ready-made fixtures for retesting once a Merge control is added or found.
