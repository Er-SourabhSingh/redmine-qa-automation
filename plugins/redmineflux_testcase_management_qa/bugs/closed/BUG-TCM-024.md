# BUG-TCM-024

> **CLOSED — 2026-10-06.** Production #121845 (https://flux.zehntech.com/issues/121845) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-024
- Production Redmine Issue ID: #121845
- Title: The Testcase Summary's "Search by subject or ID" box does not actually search by ID — searching a real issue's exact numeric ID returns no results
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

The Testcase Summary grid's search box is explicitly labelled **"Search by subject or ID"**. Searching by a full
or partial Subject works correctly. Searching by a test case's exact numeric issue ID — with or without a `#`
prefix — returns **zero results**, even for a real, currently-open test case (#437, used throughout this
session's testing).

## Steps to reproduce

1. Go to the Testcase Summary grid (Test Cases tab).
2. In the "Search by subject or ID" box, type a real test case's exact ID (e.g. `437`).
3. Press Enter.
4. Repeat with a `#` prefix (e.g. `#437`).

## Expected result

- Per the search box's own label, searching by the exact ID should return that test case.

## Actual result

- Both `437` and `#437` return **zero rows** (`table tbody tr` count = 0), for a test case that genuinely exists
  and is open (#437, "Verify empty wishlist shows appropriate message," used in run #24 throughout this
  regression cycle). A full-subject search for the same case (`"Verify empty wishlist shows appropriate
  message"`) correctly returns it (along with 2 duplicate-subject cases elsewhere), confirming the search
  mechanism works for Subject but not ID.
- Control: a genuinely non-matching subject string (`zzznonexistentsubjectzzz`) also correctly returns zero rows
  — so the "no match → empty list" half of the search behaves correctly; only ID matching itself is broken.

## Evidence

### Screenshot

![Searching "437" (a real, open test case's exact ID) in the "Search by subject or ID" box returns no results](../../screenshots/BUG-TCM-024/search-by-id-returns-no-results.png)

### Console / log

```
GET /test_suites?search=437&project_id=test-project&set_filter=&sort=   -> table tbody tr count: 0
GET /test_suites?search=%23437&project_id=test-project&set_filter=&sort= -> table tbody tr count: 0
GET /test_suites?search=Verify+empty+wishlist+shows+appropriate+message&... -> 3 rows (issues 1312, 733, 500)
GET /test_suites?search=wishlist&...  -> 12 rows (partial subject match works)
GET /test_suites?search=zzznonexistentsubjectzzz&... -> 0 rows (correct negative control)
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_CASES.md`:
- TC-TCM-143 (Test case search by subject and ID) — **FAIL** on the ID leg; PASS on full-subject, partial-subject
  and non-matching-term legs.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers the Testcase Summary search box.

## Production report

Reported to production `ztflux` as **#121845** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom
fields: Type=Functional, Severity=Medium-severity, Priority=Medium.

---

## Production history (synced from #121845 on 2026-10-08)

### 2026-10-06 08:05 UTC — Vaishnavi Bhawsar

Fixed. Searching by a plain number worked, but the "#" that people naturally type before an ID (like "#437") was being treated as text and silently turned into a search for ID 0 — which obviously matches nothing. The "#" is now stripped before searching, so searching with or without it both work the same.

Fix is committed and pushed (commit fd28191).

I verified it directly: searched "#259" for a real existing test case — it returned nothing before the fix, and correctly finds it now. Screenshot attached.

For QA:
1. In the Testcase Summary grid, search for a real test case using just its number (e.g. "259").
2. Search again with a "#" in front (e.g. "#259").
3. Confirm BOTH return the same correct result, and that subject-text search still works as before (no regression).

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Searching the Testcase Summary grid by the exact numeric id "35" correctly returned issue #35 ("Bulk stress case 0" — a subject with no "35" substring in it), proving a genuine exact-id match, not a subject-text coincidence.
