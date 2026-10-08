# BUG-TCM-026

> **CLOSED — 2026-10-06.** Production #121847 (https://flux.zehntech.com/issues/121847) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-026
- Production Redmine Issue ID: #121847
- Title: "Remove Testcase" from a suite returns 200 OK with the correct payload but does not actually remove the case — it silently remains in the suite's grid
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

A test case row's own Actions menu offers **"Remove Testcase"**, which opens a proper confirmation dialog
("Confirm Removal — Are you sure you want to remove the selected testcase from the test suite?") with
Remove/Cancel buttons. Clicking **Remove** fires `POST /remove_issues_to_test_suite` with the correct payload
(`test_suite_id=14&issue_ids[]=1591`), and the server responds **200 OK**. Despite this, the case **remains in
the suite's grid** after a cache-busted reload — the removal never actually takes effect server-side (or the
response is a false-success).

Reproduced twice independently (two full repeats of open-menu → click Remove Testcase → confirm in the popup),
both times with the same result: a 200 response, zero visible effect.

## Steps to reproduce

1. Open a suite with at least one test case in its grid (e.g. suite 14, case #1591).
2. On the case's row, open **Actions** → **Remove Testcase**.
3. In the "Confirm Removal" popup that appears, click **Remove**.
4. Reload the suite's grid (cache-busted, e.g. adding a dummy query param) and check whether the case is still
   listed.

## Expected result

- Per `TESTCASE_MANAGEMENT_TEST_CASES.md` TC-TCM-148, the case should leave the suite (while the underlying issue
  itself survives — "remove from suite" must not delete the test case).

## Actual result

- The confirmation flow completes normally (popup closes, no visible error), and the network request
  `POST /remove_issues_to_test_suite` returns **200 OK** with the exact correct payload
  (`test_suite_id=14&issue_ids[]=1591`, confirmed by reading the captured request body).
- The suite's grid, reloaded with a cache-busting query param, **still lists the case** (`table tbody tr` count
  unchanged, same row present) — the removal did not actually happen.
- Reproduced twice, identical result both times.

## Evidence

### Screenshot

![Suite 14's grid still lists case #1591 after a "Remove Testcase" confirmation that returned 200 OK](../../screenshots/BUG-TCM-026/remove-testcase-200-but-not-removed.png)

### Console / log

```
Actions menu item: <a href="#" id="single-remove-link" class="submenu">Remove Testcase</a>
  (inside <li class="remove_testcase folder">) -- this is a trigger for a separately-rendered confirmation
  popup (#custom-confirmation-popup), not a direct action link; must be clicked (not merely hovered) to reveal it.

Confirmation popup: id="custom-confirmation-popup", title "Confirm Removal", confirm button id="confirm-remove".

Network (both reproduction attempts):
  POST /remove_issues_to_test_suite  => 200 OK  (duration ~81ms, content-type application/json)
  Request body: test_suite_id=14&issue_ids[]=1591

Suite 14 grid before AND after, cache-busted reload: unchanged —
  #1591 QA-TC-202-CHILD-CASE
  #1590 QA-TC-202-PARENT-CASE
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_CASES.md`:
- TC-TCM-148 (Remove test cases from a suite) — **FAIL**, this is the blocking defect.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this endpoint. Related to, but
  distinct from, BUG-TCM-025 (no way to *add* an existing case to a suite) — this is the mirror-image gap on the
  *remove* side, with its own separate root cause (a false-success response, not a missing feature).

## Production report

Reported to production `ztflux` as **#121847** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: High (priority_id 3); Defect custom
fields: Type=Functional, Severity=High-severity, Priority=High.

---

## Production history (synced from #121847 on 2026-10-08)

### 2026-10-06 08:10 UTC — Vaishnavi Bhawsar

Checked this one and couldn't reproduce it — Remove Testcase already works correctly in the current code. No fix was needed.

I followed the exact same steps as the report: opened a suite with a test case in it, used Actions → Remove Testcase → Remove in the confirmation popup, then reloaded the grid. The test case was genuinely gone from the suite afterward (confirmed both on screen and directly in the database), and the underlying test case itself was untouched and still exists, just no longer in that suite — exactly the expected behavior. Screenshot attached showing the suite now empty.

For QA: Open a suite with a test case, remove it via Actions → Remove Testcase → Remove, reload the grid, and confirm the case is gone from that suite but the test case itself still exists elsewhere (e.g. still searchable/openable directly).

### 2026-10-06 13:57 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Created a fresh test case with zero Run associations, removed it from its suite via the real "Remove Testcase" UI flow: POST returned 200, the row was gone after a full fresh page reload (not just a client-side DOM change), and Issue#testsuite_id is genuinely nil in the database. Note: the controller now also correctly BLOCKS removal (422, "error_testsuite_in_run") when a test case is linked to a Run — a reasonable new safeguard, not a reproduction of this bug's original "false success" symptom.
