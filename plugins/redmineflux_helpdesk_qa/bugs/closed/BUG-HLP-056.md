# BUG-HLP-056

- Bug ID: BUG-HLP-056
- Production Redmine Issue ID: #120510 (ztflux)
- Title: `rake redmineflux_helpdesk:check_sla` correctly detects and marks every SLA breach, but every single escalation attempt fails — the hand-run task passes a human-readable escalation reason string that fails the model's own inclusion validation, while the real scheduled worker passes the correct machine-readable value
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (server-side rake task; result verified via Playwright/UI on ticket #301)
- User role: System Administrator (server access)
- Date: 2026-09-11

## Steps to reproduce

1. Have at least one ticket with a support level configured, past its response and/or resolution SLA deadline (this instance's seeded data already had plenty by the time this was run).
2. Run `bundle exec rake redmineflux_helpdesk:check_sla` from the Redmine root.

## Expected result

Per `HELPDESK_RAKE_TASKS.md` TC-HLP-215 ("The ticket is checked, marked breached if due, and escalated if applicable — identical outcome to what the scheduled SLA monitor would produce"), running this task by hand should escalate an eligible ticket to its next support level exactly as `Helpdesk::SlaMonitorWorker` (the real scheduled job) does.

## Actual result

Breach **detection and marking work correctly** — confirmed via the task's own console output (`[SLA][STATE] Ticket #301 | resolution_breached = true`, `[BREACH] Issue #301 — resolution SLA breached`, notification emails attempted). But **every single escalation attempt failed**:

```
SLA check completed at 2026-09-11 11:19:41 +0000
  Notifications sent : 119
  Escalations        : 0
  Errors             : 118
```

118 of 119 breach detections hit an identical error:

```
ERROR processing SLA for issue #301: Validation failed: Escalation reason is not included in the list
```

Root-caused via source. The rake task (`lib/tasks/helpdesk.rake`) calls:

```ruby
is_last = sla_status.escalate_to_next_level!('Response SLA breach')   # or 'Resolution SLA breach'
```

But `RfIssueSlaEscalationHistory`'s validation only accepts:

```ruby
validates :escalation_reason, inclusion: { in: %w[response_breach resolution_breach manual] }, allow_nil: true
```

The real scheduled worker (`app/workers/helpdesk/sla_monitor_worker.rb`) calls the identical method with the **correct** machine-readable value instead:

```ruby
sla_status.escalate_to_next_level!(escalation_reason)   # escalation_reason is 'response_breach' or 'resolution_breach'
```

So the hand-run rake task's hardcoded human-readable strings (`'Response SLA breach'`, `'Resolution SLA breach'`) never match the inclusion list, and `escalate_to_next_level!`'s own `save!` on the escalation-history record raises `ActiveRecord::RecordInvalid` every time, on every ticket that has a support level configured — meaning **escalation via this rake task is 100% non-functional**, while the identically-named scheduled job works correctly (confirmed by this engagement's own prior sessions, e.g. BUG-HLP-021/034 retests).

Verified live on ticket #301 (`/issues/301?tab=sla-information`): the SLA Journey panel shows only 2 activity-log events — the original "SLA Started" and one prior escalation from L1→L2 (dated 09/07, from the seeded data, before this rake task ran) — with **no new escalation entry** despite the badge showing "⚠ Critical" and the Resolution row reading "Overdue 3 days," confirming the breach was detected (matching the console's `resolution_breached = true`) but the ticket never advanced past L2 as a result of running the rake task.

## Evidence

### Console / log

- Rake output: `Notifications sent : 119`, `Escalations : 0`, `Errors : 118`, with the repeated exact message `Validation failed: Escalation reason is not included in the list`.
- Source: `lib/tasks/helpdesk.rake` (`'Response SLA breach'` / `'Resolution SLA breach'` passed to `escalate_to_next_level!`) vs. `app/models/rf_issue_sla_escalation_history.rb` line 10 (`inclusion: { in: %w[response_breach resolution_breach manual] }`) vs. `app/workers/helpdesk/sla_monitor_worker.rb` (passes the correct `'response_breach'`/`'resolution_breach'` values).
- UI: `/issues/301?tab=sla-information` — SLA Journey shows exactly 2 activity-log events (both pre-dating this rake run), no third entry despite a fresh resolution breach being detected during the run.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md` — distinct from BUG-HLP-044/055, which are both "reads a legacy config field, does nothing at all"; this task genuinely operates on the current, correct model but passes the wrong argument value to one specific method call)
- Existing bug reference (if duplicate): —

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120510 checked in)

**CONFIRMED FIXED.** Root-caused via source (`lib/tasks/helpdesk.rake`): both hardcoded human-readable strings are now the correct machine-readable values — `sla_status.escalate_to_next_level!('response_breach')` and `sla_status.escalate_to_next_level!('resolution_breach')` — exactly matching `RfIssueSlaEscalationHistory`'s `inclusion` validation and the real scheduled worker's own call.

Live-verified: ran `bundle exec rake redmineflux_helpdesk:check_sla` for real. Output: `Notifications sent : 359`, `Escalations : 202`, `Errors : 0` — a complete reversal of the original `Escalations : 0, Errors : 118`, with the exact same repeated `Validation failed: Escalation reason is not included in the list` error no longer occurring at all. Confirmed via a live Sidekiq log line during the run: `[SLA][ESCALATION] Ticket #329 | L1 → L2 | Assignee: luna.blossom → briar.sunset | ...` — a genuine escalation, correctly recorded, with escalation-notification emails queued to both the new and prior assignee.

## Notes

- Found while executing `HELPDESK_RAKE_TASKS.md` TC-HLP-215 (`check_sla` run by hand).
- Unlike BUG-HLP-044/055, this is **not** a dead-code/legacy-migration issue — `check_sla` genuinely reads and writes the real, current `RfIssueSlaStatus` model, and breach detection/marking/notification-sending all work. This is a narrower, single-argument mismatch, but its effect (zero working escalations, ever, via this task) is just as complete a functional failure for the escalation half of the task's job.
- Severity judged **Medium**: admin-only rake task, breach detection/notification (arguably the more time-sensitive half) still works; but escalation — the mechanism that gets a breached ticket in front of the right tier — silently fails every time this task is used as a manual/backup path instead of waiting for the scheduled worker.
- Recommend: change the two hardcoded strings in `lib/tasks/helpdesk.rake` to `'response_breach'` and `'resolution_breach'` (matching `sla_monitor_worker.rb` exactly), or better, have the rake task delegate to `Helpdesk::SlaMonitorWorker`'s own logic directly so there is only one implementation to keep in sync — the same recommendation already made for BUG-HLP-044/055.
