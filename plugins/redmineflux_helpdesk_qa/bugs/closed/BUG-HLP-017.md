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

## Retest — STILL NOT FIXED (2026-09-10)

- Production issue #119713 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Original fixture tickets #12/#13 had both auto-closed due to inactivity since they were created (08-31), so created two fresh **open** duplicate tickets to retest cleanly: #81 ("BUG-HLP-017 retest duplicate A - printer not connecting to network") and #82 ("BUG-HLP-017 retest duplicate B - printer offline on office network"), both in Helpdesk QA Alpha, status New.
- Checked ticket #81's own page: toolbar shows Start Timer/Reply/Edit/Log time/Watch/Copy/**Actions**; the Actions dropdown's full contents are still just **Copy link** and **Delete issue**. **No Merge control.**
- Checked the multi-select context menu (`/issues/context_menu?ids[]=81&ids[]=82`), the same request the app's own right-click menu makes on the core Issues list: full contents are Bulk edit, Status, Tracker, Priority, Assignee, Progress, Issue Category, Watchers, Unwatch, Filter, Copy link, Copy, Delete issues, Remove All Testcase. **No Merge option anywhere in this list either.**
- Both previously-checked locations remain exactly as originally reported — no discoverable Merge control anywhere, even on a completely fresh pair of open duplicate tickets. This bug is not fixed.
- Fresh fixture tickets #81/#82 left in place (not deleted) as ready-made fixtures for a future retest, replacing the now-closed #12/#13.
- Per user instruction, production issue #119713's status was left untouched — only this local file and `bugs/_index.md` were updated. This bug stays in `bugs/open/`.

## Retest — CORRECTED: Not a Bug, resolved by product decision (2026-09-10)

- **The "STILL NOT FIXED" verdict above needs reframing, not reversal.** The developer's note on production issue #119713 explains: *"we are not building a Merge button right now... The user guide (§7.4 'Duplicate tickets') has been rewritten to explain this and no longer mentions a Merge button... For QA: please confirm (1) there is still no Merge button/link anywhere on a ticket (this is now expected, not a bug), and (2) the user guide reads correctly."*
- **Part (1), independently verified:** already confirmed twice this session (original 2026-08-31 pass and the 2026-09-10 retest above, on fresh tickets #81/#82) — no Merge control anywhere, on either the ticket's own Actions menu or the multi-select context menu. This matches the developer's claim exactly.
- **Part (2), a genuine discrepancy found:** our own local `docs/HELPDESK_USER_GUIDE.md` §7.4 still contained the *old* text promising a Merge button at the time of this retest — it had **not** actually been rewritten on our side, contrary to what a literal reading of the developer's note might suggest. We do not have visibility into whatever document the developer's own note refers to (likely an internal/production-side spec, not necessarily this repo) — that specific claim was not verified as-is, and is not being taken on faith. Instead, our own copy of `HELPDESK_USER_GUIDE.md` §7.4 has been rewritten directly, to match the now-confirmed intended behavior (no Merge control; duplicates handled via auto-matched replies + close-and-reference for genuine dupes), consistent with the independently-verified live behavior. This is a documentation correction on our end, not a claim that we inspected or verified the developer's own referenced document.
- **Verdict: this is not a technical defect and never was one that got "fixed" by a code change** — the team made a product decision not to build the originally-documented feature, and updated the intended contract instead. Closing as resolved-by-design, matching the pattern already used for BUG-HLP-027/028 in this engagement (a documentation-vs-behavior mismatch resolved by correcting the doc, not by chasing a fix for behavior that was never wrong).
- Related test cases (`TC-HLP-025`, `TC-HLP-032`, `TC-HLP-041` in `HELPDESK_TICKET_LIFECYCLE.md`) updated with revision notes marking them superseded — there is no Merge feature left to test.
- Fixture tickets #81/#82 (fresh, open, unassigned) left in place, matching the original bug's own convention of leaving fixtures for future retests.
- Production issue #119713 synced 2026-09-10: status In QA → **Won't Fix** (not Done, per explicit user decision — "Won't Fix" more accurately reflects that the originally-requested Merge feature was deliberately not built, rather than fixed), % done → 100, with a note explaining the rationale and summarizing this retest's findings.
