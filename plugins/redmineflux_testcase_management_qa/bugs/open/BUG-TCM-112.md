# BUG-TCM-112

- Bug ID: BUG-TCM-112
- Production Redmine Issue ID: <!-- fill after MCP report_defect is approved and executed -->
- Title: Drag-copying a test case into another suite leaves the clone linked to BOTH the source and target suite, not just the target
- Severity: Medium
- Redmine version: 6.0.11.stable (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `alpha-web`
- Browser: Chromium (Playwright MCP)
- User role: QA Manager (`qa.manager`, holds `edit_test_suite`)
- Date: 2026-10-24

## Steps to reproduce

1. Create a test case with at least one step and one linked requirement, filed in suite A (e.g. "Guest Checkout",
   id 89).
2. Drag the case's row onto a different suite B in the same project (e.g. "Regression - Checkout Renamed", id 92)
   and choose **Copy here**.
3. Check which suite(s) the new cloned case belongs to (suite A's own list, and the `issue_test_suites` table).

## Expected result

- A new Issue is created (clone) linked **only** to the target suite B; the original case stays in suite A,
  unchanged; suite A's case count does not grow.

## Actual result

- The clone is linked to **both** suite A (the source) and suite B (the target). Suite A's own case list now
  shows both the original case and the clone, even though the user only asked to copy it into suite B.

## Root cause (confirmed via code read + live DB check)

`TestSuitesController#copy_issues` does `IssueTestSuite.find_or_create_by(issue: new_issue, testsuite: test_suite)`
for the **target** suite only (`test_suites_controller.rb` around the `copy_issues` action). But `Issue#copy_from`
(core) triggers `Issue`'s own `after_create` hook `rftc_copy_test_suites_from_source`
(`lib/testcase_management/patches/issue_patch.rb`), which — independently of `copy_issues` — copies **every**
`IssueTestSuite` row the *original* issue had onto the new cloned issue. The two mechanisms are not aware of each
other: the hook assumes a straight "copy issue" always wants all of the source's suite links carried over, which
is correct for a generic Issue duplication but wrong for this specific "copy into a new suite" user action, which
should replace the link, not add to it.

Confirmed live: original case #3657 (suite 89) copied to suite 92 produced clone #3658 with TWO
`issue_test_suites` rows — one for suite 89 (copied by the `after_create` hook) and one for suite 92 (created by
`copy_issues` itself). Suite 89's case list shows both #3657 and #3658 after the copy.

## Evidence

### Database state after the copy

```
issue_test_suites rows for issue 3658:
  id=2610  issue_id=3658  testsuite_id=89   (unexpected — from the clone hook)
  id=2612  issue_id=3658  testsuite_id=92   (expected — the actual copy target)
```

Suite 89's test case list (`GET /test_suites?project_id=alpha-web&testsuite_id=89`) shows both #3657 and #3658.

### Console / log

- No server error; this is a silent data-correctness defect, not a crash.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers suite-copy producing an extra
  source-suite link.
