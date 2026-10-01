# BUG-TCM-025

- Bug ID: BUG-TCM-025
- Production Redmine Issue ID: #121846
- Title: There is no working UI path at all to associate an already-existing test case with a suite — drag-and-drop doesn't work, no "add existing cases" action exists, and the issue's own Edit form has no Suite field
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

`docs/TESTCASE_MANAGEMENT_FEATURES_LIST.md` line 15 (Feature #5, "Test case ↔ suite organisation") explicitly
documents: *"Drag-and-drop cases into suites; add/copy cases to a suite; remove cases from a suite; bulk-assign
requirements."* Live-tested dragging a real test case (#1021) from its current suite's grid onto a different
suite's sidebar tree node. **No drag interaction of any kind occurs.**

A mousedown-and-move sequence on the case row only triggers Redmine's ordinary row-selection highlight
(`context-menu-selection cm-last` classes appear), not any drag state — no `ui-draggable-dragging` class, no
custom drag-indicator element, nothing. The row itself has no `draggable` attribute and no jQuery-UI-draggable
class in its markup at all. This holds true whether or not the row's checkbox is checked first.

**This is not merely "drag doesn't work" — there is no working alternative either.** Checked both other paths an
existing case could plausibly be reassigned through:
- The suite's own header **"Actions"** menu offers exactly one item: **"Import Testcases"** (the CSV import
  wizard). No "Add existing cases to this suite" action exists anywhere.
- The test case issue's own `/edit` form has **no Suite field at all** — searched the full rendered page text
  for "suite" (case-insensitive), zero matches, alongside every other standard/custom field which *are* present.

The only point at which a test case's suite is ever set is **at creation time**, via the `testsuite_id` query
parameter passed to `/projects/<project>/issue_testcase/new?testsuite_id=<id>` when "New Test Case" is launched
from inside a specific suite. Once created, a test case's suite association appears to be **permanently fixed**
with no UI path to change it — not via drag, not via an explicit action, not via editing the issue.

## Steps to reproduce

1. Open a suite's Testcase Summary grid containing at least one case (e.g. suite `dfsogsdfjgdsfg dsfg`, case
   #1021).
2. Expand the sidebar Test Suite tree (so a different target suite is visible on the same screen).
3. Attempt to drag the case's row onto the target suite's tree node (mousedown on the row, move toward the
   target in small increments, release over the target).
4. Check whether the case was added to the target suite.

## Expected result

- Per the Features List's own documentation, dragging a case onto a suite associates it with that suite.

## Actual result

- The case never moves. Confirmed via two independent attempts:
  - Playwright's native `dragTo()` API: suite 4 (source) unchanged, target suite's grid remained empty (0 rows).
  - A manual, incremental mouse down → multi-step move → up sequence (15 steps, 50ms apart, mimicking the
    threshold jQuery UI draggable typically needs): same result, no movement, and no drag-state class ever
    appeared on the row or `<body>` mid-sequence.
  - Checking the row's checkbox first and repeating the drag: still no drag-state class appears at any point.
  - The row's own class list (`hascontextmenu odd issue tracker-4 status-1 priority-2 priority-default
    created-by-me`) contains no draggable-related class, and `row.getAttribute('draggable')` is `null`.

## Evidence

### Screenshot

![Attempted drag of case #1021 toward the QA-DND-TARGET-144 suite node — no drag indicator ever appears](../../screenshots/BUG-TCM-025/no-drag-drop-capability.png)

### Console / log

```
Row classes before/during drag attempt: "hascontextmenu odd issue tracker-4 status-1 priority-2 priority-default
  created-by-me" -> "hascontextmenu odd issue tracker-4 status-1 priority-2 priority-default created-by-me
  context-menu-selection cm-last" (selection highlight only, not a drag state)
row.getAttribute('draggable') === null
document.body.className during drag attempt: unchanged, no drag-related class added
Target suite's grid after every attempt: 0 rows (table tbody tr count = 0)
Source suite's grid after every attempt: case #1021 still present, unmoved

docs/TESTCASE_MANAGEMENT_FEATURES_LIST.md:15  "| 5 | Test case <-> suite organisation | Drag-and-drop cases into
suites; add/copy cases to a suite; remove cases from a suite; bulk-assign requirements. | TC-TCM-144 - TC-TCM-151 |"
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_CASES.md`:
- TC-TCM-144 (Drag and drop a test case into a suite) — **FAIL**, this is the blocking defect.
- TC-TCM-145 (Drag a test case between suites) — blocked by the same root cause.
- TC-TCM-146 (Add existing test cases to a suite via an add-to-suite action) — **FAIL**, confirmed no such action
  exists in the suite's own Actions menu (only "Import Testcases" is offered).
- TC-TCM-147 (Copy test cases to another suite) — the copy mechanism itself works correctly (a genuine new issue
  is created, steps carry over, and — notably, unlike BUG-TCM-022 — the copy correctly stays on the Test case
  tracker), but the copy form has no Suite field and no `testsuite_id` URL pass-through, so the new copy always
  lands suite-less and, per this bug, can never be assigned one afterward either.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers suite drag-and-drop.

## Production report

Reported to production `ztflux` as **#121846** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Critical (priority_id 4, Blocker);
Defect custom fields: Type=Functional, Severity=Critical, Priority=Urgent.
