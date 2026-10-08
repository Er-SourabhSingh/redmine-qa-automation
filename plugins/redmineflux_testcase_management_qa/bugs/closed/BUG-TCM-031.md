# BUG-TCM-031

> **CLOSED — 2026-10-06.** Production #122073 (https://flux.zehntech.com/issues/122073) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-031
- Production Redmine Issue ID: #122073
- Title: Creating a Run scoped to a test suite that has zero test cases fails with the misleading message "Testsuite is not selected"
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: Tester (`qa.engineer`)
- Date: 2026-10-05

## Summary

When creating a new Run with "Only the following test runs" (i.e. scoping the Run to specific suites rather than
"Include all test run"), picking a suite that currently has **zero** test cases in it causes the Run creation to
fail with the error "Testsuite is not selected" — even though the suite's checkbox was visibly and correctly
checked in the picker. The same flow, with the same steps, succeeds immediately for a suite that has at least one
test case. The error message is actively misleading: it reads as if nothing was picked, when in fact an
empty-but-selected suite was picked.

## Steps to reproduce

1. On the Runs & Results tab, click "Add Run".
2. Fill Name, set TestRun Status to "New".
3. Select the "Only the following test runs" radio button.
4. In the "Select Cases" picker, check a suite that has no test cases in it (e.g. a freshly created empty suite),
   and click "Select Cases" to confirm.
5. Fill Environment and Assignee.
6. Click Create.

## Expected result

- Either the Run is created successfully scoped to that (empty) suite, or a clear, specific message is shown,
  e.g. "The selected test suite has no test cases" — not a generic "nothing was selected" message.

## Actual result

- The Run is **not** created; the form re-renders with the error **"Testsuite is not selected"**.
- Confirmed via direct DOM inspection immediately before submit that the suite's checkbox (`test_suite_ids[]`,
  value matching the suite's real id) was genuinely `checked: true`.
- Confirmed this is specifically about the suite being **empty**, not a general defect in the "Only the
  following" picker: the identical flow, scoping a Run to the `Authentication` suite (5 real test cases), created
  the Run successfully on the first attempt (Run #7), and `Run.find(7).testsuites` / `RunIssue.where(run_id: 7)`
  confirmed it was correctly scoped (1 suite, 5 run_issues).
- Re-confirmed in an isolated test: a suite created purely as an empty probe ("Empty Test Probe", 0 test cases),
  selected on its own with nothing else checked, reproduces the exact same "Testsuite is not selected" error.

## Evidence

### Screenshot

![Add Run modal showing "Testsuite is not selected" even though Name/Status are filled and an (empty) suite was the only thing selected](../../screenshots/BUG-TCM-031/empty-suite-testsuite-not-selected.png)

### Console / log

- No JS console errors associated with this — it is a server-side validation message, confirmed via direct DOM
  checks of `document.querySelectorAll('input[name="test_suite_ids[]"]:checked')` immediately before submit.

## Test case coverage

Found while setting up the precondition for TC-SUITE-03-02 (`docs/qa/V1-TEST-CYCLE-7.1.0.md`), which needed a Run
assigned to a suite that (at the time) had no test cases yet. Does not block TC-SUITE-03-02 itself, since that
precondition was achieved by adding a test case to the suite first, then using "Include all test run" instead.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Run creation against an empty
  suite.

## Production report

Reported to production 2026-10-05 as **#122073** (`ztflux`), tracker Bug, Priority Low, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity Low-severity, Defect
priority Low. Per explicit user instruction, not linked to any production Test Case/Run.

---

## Production history (synced from #122073 on 2026-10-08)

### 2026-10-06 11:17 UTC — Vaishnavi Bhawsar

Fixed. Root cause: when a test suite with zero test cases is checked in the "Select Cases" picker, the JS had nothing to register the selection with (checking a suite's checkbox only toggles its child test-case checkboxes, and an empty suite has none) -- so the suite's selection silently vanished before the request was even sent, leaving the server with nothing attached and the Run model's own "Testsuite is not selected" validation correctly (but misleadingly) firing. The suite is now registered directly when its checkbox is toggled, specifically for the zero-test-case case.

While verifying this, found and fixed a second, closely-related bug it exposed: opening a Run that ended up with zero test cases (now a real, reachable state) threw its own JS console error, because the bulk-selection toolbar script assumed its own elements always existed on the page.

Verified end-to-end: created an empty test suite, used it to create a Run via "Only the following test runs" -> checked only that suite -> Create. The Run was created successfully (no "Testsuite is not selected" error), confirmed in the database correctly scoped to that suite with zero run_issues. Opened the resulting Run's execution view and confirmed zero console errors.

For QA:
1. Create a test suite with zero test cases in it.
2. On the Runs & Results tab, Add Run -> "Only the following test runs" -> check only that empty suite -> Select Cases -> fill Environment/Assignee -> Create.
3. Confirm the Run is created (not rejected with "Testsuite is not selected").
4. Open the created Run and confirm the page loads cleanly with no console errors.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — confirmed fixed via code read (commit ff2c1f3). An empty suite's selection is no longer dropped before reaching the server when scoping a new Run to it.
