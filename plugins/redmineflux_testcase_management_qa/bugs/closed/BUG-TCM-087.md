# BUG-TCM-087

- Bug ID: BUG-TCM-087
- Production Redmine Issue ID: #124272
- Title: "Run Added" email notification can never be sent for a run created through the normal web UI — the
  Add Run form itself hardcodes `from=API`, which the model's CI-suppression logic treats as "don't email"
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post-7.1.0, pre-7.2.0)
- Environment: Docker `localhost:3000` (`redmine6-redmine-1`), project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-10-22

## Summary

Found while regression-testing TC-TCM-008 (Run Email Template customization) in
`TESTCASE_MANAGEMENT_CONFIGURATION.md`. With `run_added` correctly enabled in Administration → Settings →
Email notifications, and a real, Active custom Run Email Template configured, creating a new run via the
standard **Runs & Results → Add Run** web form never sends the "Run Added" notification email — to any
recipient, in any configuration. This reproduces 100% of the time and is not specific to a self-assigned
run (it also fails when the run is assigned to a completely different user with a real, checkable mailbox).

## Steps to reproduce

1. Enable `run_added` under Administration → Settings → Email notifications → Email notifications.
2. In any project, go to **Runs & Results → Add Run**.
3. Fill in a name, environment, and assign the run to any user (including a user who is NOT the one
   creating the run).
4. Click **Create**.
5. Check the assignee's mailbox (or Mailpit, in this environment).

## Expected result

A "Run Added" email should arrive at the assigned user's mailbox (and any watchers'), using the active
custom Run Email Template if one exists, or the default built-in template otherwise.

## Actual result

**No email is sent at all — ever — for a run created this way**, confirmed via two independent attempts:
- Run #67, assigned to the creator (Redmine Admin) — no email (could be explained by self-notification
  suppression, so not conclusive on its own).
- Run #68, assigned to a **different** real user (`qa.limited`, a real `qa.limited@test.local` mailbox,
  confirmed to have no other notification-suppression preference set) — **still no email**, which rules out
  the self-notification explanation and points to a structural problem.

Confirmed via the Rails server log that the create request's own parameters include `"from"=>"API"` for
**both** attempts, submitted by the web form itself, not anything this session added:

```
Parameters: {"run"=>{"name"=>"TC-TCM-008 Regression Run v2 (qa.limited assignee)", ...,
  "run_assignments_attributes"=>{"0"=>{"environment"=>"test", "assignee_id"=>"7"}}, ...},
  "assignee_id"=>"1", ..., "from"=>"API", "button"=>"", "commit"=>"Create", "project_id"=>"rftc-016-ci-qa"}
```

## Root cause (confirmed via source read inside the container)

`app/models/run.rb` (the `after_create`/`after_commit` callback that sends the notification):

```ruby
def send_notification_on_create
    # rftc-009: CI runs (from == 'API') never email the watcher list. Runs out of the
    # save transaction (after_commit), so a rolled-back run cannot emit a phantom mail.
    return if from == 'API'
    RunMailer.run_added(self).deliver_now
rescue => e
    Rails.logger.error "Failed to send run_added email: #{e.message}"
end
```

This `from == 'API'` check is a deliberate rftc-009 feature: CI-bootstrapped runs (created by the
`bootstrap_run` API endpoint) should not spam watchers with "Run Added" emails. **But the exact same
`from=API` marker is also hardcoded, unconditionally, into the standard human-facing web form**:

`app/views/runs/new.html.erb:254`:
```erb
<%= hidden_field_tag 'from', 'API' %>
```

There is no condition around this line — every single submission of the **Add Run** web modal, by any
user, through the normal browser UI, carries `from=API`. This means the CI-suppression branch
(`return if from == 'API'`) is **always** taken for web-created runs, so `RunMailer.run_added` is never
even invoked for the primary, everyday way a run gets created. The "Run Added" notification feature is
completely dead code in practice — it can only ever fire for a run created some other way that doesn't set
this hidden field (if any such path even exists).

This also means `TC-TCM-008`'s earlier "CONFIRMED LIVE — 2026-09-30 — PASS" result
(`TESTCASE_MANAGEMENT_CONFIGURATION.md`) was a **false pass** — that session's "Run Added" email success was
very likely delivered through a different code path (e.g. a run created via direct Rails-console
manipulation bypassing the web form, or an older build of `new.html.erb` that did not yet carry this hidden
field) rather than through the actual web UI a real user would use. This regression pass, using the real
web form end-to-end, is the first time this specific path has been exercised honestly.

## Suggested fix

Remove the unconditional `hidden_field_tag 'from', 'API'` from `app/views/runs/new.html.erb` entirely (a
human using the web form is never "the API") — or, if some other part of the form-handling code depends on
this field being present for an unrelated reason, give it a value that does NOT collide with the
CI-origin marker (e.g. `'from', 'UI'` or omit the param so `from` defaults to blank), so
`send_notification_on_create`'s `return if from == 'API'` guard only actually fires for genuine
`bootstrap_run` API-originated runs, matching its own documented rftc-009 intent.

## Evidence

- Rails server log (`docker logs redmine6-redmine-1`), both `POST /runs` requests, showing `"from"=>"API"`.
- Mailpit (`localhost:8025`) total message count unchanged (34) across both run-creation attempts.
- Source read: `app/models/run.rb` (`send_notification_on_create`) and
  `app/views/runs/new.html.erb:254` (the unconditional hidden field).

## Test case coverage

Found 2026-10-22 while regression-testing TC-TCM-008 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`) as part of
the post-fix-pull full-plugin regression (CLAUDE.md §27, triggered by `bugs/open/` becoming empty after
BUG-TCM-083/086 were confirmed fixed). Not yet mapped to a new automation TC — TC-TCM-008/011 should be
updated to explicitly assert `from` is never `'API'` on a UI-created run once this is fixed.

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this. Distinct from
  BUG-TCM-012 (closed — notification shows run name instead of subject) and BUG-TCM-013 (closed —
  duplicate delivery) — both of those were about a *delivered* email's content/count; this is about the
  email never being sent at all for the primary creation path.

## Production report

Reported to production `ztflux` on 2026-10-22 as **#124272**, assigned to Vaishnavi Bhawsar, Priority High /
Defect Severity High-severity / Defect priority High / Defect Type Functional, category Testcase Management
Plugin. Standalone bug issue (no production Test Run/Test Case link), per explicit user instruction.

## Retest Result (2026-10-26)

**CONFIRMED FIXED.** Confirmed via precise source diff (runs/new.html.erb): the hardcoded hidden_field_tag 'from', 'API' that always suppressed the web-form "Run Added" email is gone; the CI-suppression guard now only fires for genuine CI-bootstrapped runs.
