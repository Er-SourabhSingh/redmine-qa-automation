# BUG-TCM-013

> **REOPENED — 2026-10-22.** Production #121703 (https://flux.zehntech.com/issues/121703) moved back to
> **Reopen**, 30% done. The 2026-10-06 closure was based on a **code read of the fix commit, not a live
> reproduction attempt**. A genuine live regression retest today (as part of the post-fix-pull full-plugin
> regression) reproduced the duplicate-email symptom again, with evidence narrowing the root cause more
> precisely than before — see "Retest — 2026-10-22 (REOPENED)" below. Moved back to `bugs/open/`.

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

---

## Production history (synced from #121703 on 2026-10-08)

### 2026-10-06 07:23 UTC — Vaishnavi Bhawsar

Addressed with a safety-net fix. I couldn't pin down the exact underlying cause with full certainty — I set up real SMTP delivery and reproduced the described flow, and the one delivery attempt I captured took an unusually long 9+ seconds end-to-end, consistent with your own root-cause note about a slow/ambiguous response from the mail server possibly causing a retry that double-sends. I wasn't able to force that retry to happen on demand to catch it directly.

Rather than leave this unresolved, I added a safeguard so this specific email can never physically go out twice for the same test result, no matter what causes a retry underneath. I directly verified the safeguard itself works (confirmed it blocks a repeat attempt for the same result), and confirmed it doesn't interfere with the normal case (one result → exactly one email, tested with a real delivery).

Fix is committed and pushed (commit 3400fdd, included with a small batch of related fixes).

For QA:
1. Add a single result to one test case as a user other than the recipient, and confirm exactly one email is still delivered as normal (no regression).
2. If possible, re-run the original reproduction steps (ideally against the same slower mail setup used originally) a number of times to see if a duplicate ever appears again. If it does, please let us know with timestamps so we can dig further — but it should no longer be possible for the recipient to receive two copies of the same notification.

### 2026-10-06 13:31 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — confirmed fixed via code read (commit 3400fdd). A Rails.cache "tcm_result_mail_sent:<result_id>" guard with unless_exist:true now wraps the RunMailer.testcase_result_added call, preventing a duplicate send for the same result row.

## Retest — 2026-10-22 (REOPENED — genuinely still reproduces, root cause narrowed)

Live-retested on master (post-7.1.0, pre-7.2.0), `localhost:3000`, as part of the post-fix-pull full-plugin
regression. Recorded a single Passed result on test case #23 ("test_login_valid"), as admin, on a run (#68)
assigned to a different real user (`qa.limited`, mailbox `qa.limited@test.local`) — the exact "user other
than the recipient" scenario this bug's own Steps to reproduce specify.

**Reproduced again**: the recipient's mailbox (checked via Mailpit) received **2 identical copies** of
"Test Case Result Added: test_login_valid" for this single submission (message count went from 35 to 37).

**But this time with a more precise root cause**, confirmed via `docker logs redmine6-redmine-1`:

```
Started POST "/issue_status_results?project_id=rftc-016-ci-qa" ...
[ActiveJob] Enqueued ActionMailer::MailDeliveryJob (Job ID: a0d07048-...) to Async(mailers) with
  arguments: "RunMailer", "testcase_result_added", "deliver_now", {...}
[ActiveJob] [ActionMailer::MailDeliveryJob] [a0d07048-...] Performing ...
[ActiveJob] [ActionMailer::MailDeliveryJob] [a0d07048-...] Rendered layout layouts/mailer.html.erb (Duration: 30.0ms)
[ActiveJob] [ActionMailer::MailDeliveryJob] [a0d07048-...] Performed ... in 242.19ms
```

Only **one** `MailDeliveryJob` was ever enqueued and performed (single Job ID, single "Rendered layout"
line) — confirming the 2026-10-06 fix's cache guard (`Rails.cache.write(cache_key, true, unless_exist:
true)`) genuinely works as designed and correctly prevents a second controller-level enqueue. Separately
confirmed the guard mechanism itself is sound: `Rails.cache` in this environment is a real
`ActiveSupport::Cache::FileStore` (not a no-op `NullStore`), and a direct `unless_exist: true` write-twice
test in a `rails runner` session correctly returned `true` then `false`.

**So the duplicate is NOT a second application-level enqueue** — the existing fix's own guard holds. Both
Mailpit-captured messages carry the **identical Message-ID**, which points to the duplication happening at
the **SMTP transport layer itself** (the one rendered email being transmitted twice over the wire), not at
the Rails/ActiveJob layer the 2026-10-06 fix addresses. This matches this bug's own original alternate
hypothesis ("a slow/ambiguous SMTP response...triggering a resend") almost exactly — just one layer lower
than where the fix was applied. **The 2026-10-06 fix solves a different failure mode (double enqueue) than
the one actually causing the live duplicate delivery.**

**Recommendation for the dev team**: investigate the SMTP delivery settings (timeout/retry configuration)
and whether `net-smtp`/the `mail` gem is retrying a slow-acking SMTP connection, causing the identical
rendered message to be transmitted twice at the transport layer. The existing controller-level cache guard
should be kept (it is a correct, working safety net for the enqueue path) but does not fix this.

Reopened production #121703 (Reopen, 30%) with this full evidence. Local file moved back to
`bugs/open/BUG-TCM-013.md`.
