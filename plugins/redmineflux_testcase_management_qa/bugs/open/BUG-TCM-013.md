# BUG-TCM-013

- Bug ID: BUG-TCM-013
- Production Redmine Issue ID: #121703
- Title: Adding a single test result sends the "Test Case Result Added" notification email twice
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-09-30

## Summary

Submitting a single "Add Result" for one test case, via the normal run-detail UI (one click on "Untested", one
Status selection, one Submit), delivers **two identical copies** of the "Test Case Result Added" notification
email to the recipient, every time. Exactly one `IssueStatusResult` row is created per submission (confirmed via
Rails console — no duplicate database write), so the duplication happens on the notification-delivery side, not
from a double form submission.

## Steps to reproduce

1. Enable the `testcase_result_added` notification event (Administration → Settings → Notifications).
2. In a run, add a single result to one test case (any status, e.g. Passed) as a user other than the recipient.
3. Check the recipient's mailbox.

## Expected result

- Exactly one "Test Case Result Added" email is delivered per result submission.

## Actual result

- Reproduced twice, independently, with two different test cases/templates in the same run:
  - Test case #434 ("Verify user can add item to wishlist"), default fallback template — **2 identical emails**
    ("Test Case Result Added: Verify user can add item to wishlist"), both timestamped the same minute.
  - Test case #435 ("Verify user can remove item from wishlist"), a custom active Testcase Email Template with a
    marker string — **2 identical emails** ("Result added for Verify user can remove item from wishlist"), both
    timestamped the same minute, both carrying the exact same marker/body content.
- Rails console confirms only **one** `IssueStatusResult` row was created per submission in both cases (verified
  by id/timestamp), ruling out a duplicate browser POST or double-click as the cause.

## Root cause

Not fully isolated. `issue_status_results_controller.rb#create` (the action exercised by the normal single-result
UI flow) calls `RunMailer.testcase_result_added(...).deliver_later` exactly once — confirmed by reading the
source, only one call site is reachable from this flow (a second call site at line 288 is in the *bulk*-create
action, not used here). `Sidekiq::RetrySet` and `Sidekiq::DeadSet` were both empty when checked shortly after
reproducing this, which doesn't rule out a retry that already succeeded and cleared itself. The most likely
explanation is a Sidekiq job retry against the local mail server (e.g. a slow/ambiguous SMTP response on the first
attempt that Sidekiq treated as a failure, then retried, with both attempts actually delivering) rather than the
controller enqueuing two jobs outright — but this needs a session with live Sidekiq log access at INFO/DEBUG level
around the exact enqueue/perform timestamps to confirm definitively.

## Evidence

### Console / log

```
IssueStatusResult.where(issue_id: 434, run_id: 10) -> exactly 1 new row for this submission (id 1592)
IssueStatusResult.where(issue_id: 435, run_id: 10) -> exactly 1 new row for this submission (id 1593)

Mailbox (qa@test.local via Roundcube):
  uid=7  "Test Case Result Added: Verify user can add item to wishlist"  18:49
  uid=8  "Test Case Result Added: Verify user can add item to wishlist"  18:49   <- duplicate of uid=7
  uid=9  "Result added for Verify user can remove item from wishlist"   18:54
  uid=10 "Result added for Verify user can remove item from wishlist"  18:54   <- duplicate of uid=9

Sidekiq::RetrySet.new.size => 0
Sidekiq::DeadSet.new.size  => 0   (checked ~3 min after reproduction; does not rule out a since-cleared retry)
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_CONFIGURATION.md`:
- TC-TCM-009 (Customise the Testcase Email Template) — template mechanism itself confirmed working correctly
  (marker + macros substituted correctly); this duplicate-send defect found alongside it
- TC-TCM-013 (Test Case Result Added notification) — notification content correct, but sent twice

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers duplicate notification delivery.
  Distinct from BUG-TCM-012 (which is about wrong *content* in the default template, not a delivery-count issue)
  — both bugs affect the same mailer method but are independent defects.

## Production report

Reported to production `ztflux` as **#121703** on 2026-09-30, assigned to Sheetal Sharma. Linked via `report_defect`
against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and run
#592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom fields: Type=Functional,
Severity=Medium-severity, Priority=Medium.
