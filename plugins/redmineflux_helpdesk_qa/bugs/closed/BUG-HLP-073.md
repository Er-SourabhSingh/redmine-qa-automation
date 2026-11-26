# BUG-HLP-073

- Bug ID: BUG-HLP-073
- Production Redmine Issue ID: #129407 (assigned to Vaishnavi Bhawsar, linked as defect on Run #690 / Test Suite #19 / Testcase #129402)
- Title: `Helpdesk::AutoCloseTicketsWorker`'s customer-facing `ticket_auto_closed` email is queued via `.deliver_later` but never actually sent — the SMTP send silently never happens, even though the job logs "Performed"
- Redmine version: 6 (local Docker, `helpdesk-redmine6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: `development` branch, commit `5fa0d9e` (fresh pull, 2026-11-25)
- Environment: Local (`http://localhost:3019`, container `helpdesk-redmine6-redmine-1`)
- Browser: N/A (server-side background worker)
- User role: System Administrator (server access)
- Date: 2026-11-25

## Steps to reproduce

1. Set a project's Auto Close Ticket Days (via Email Configuration) to a real positive value, e.g. `1`.
2. Create a Support-tracker ticket authored by a real helpdesk customer with a real mailbox, set its status to Resolved, and backdate `updated_on` past the auto-close threshold (test-setup only, via `rails runner` — standard methodology in this suite).
3. Invoke the real scheduled worker directly: `Helpdesk::AutoCloseTicketsWorker.new.perform` (the sidekiq-cron scheduler is a known separate environment quirk — this is the same "manually trigger the real worker" method used throughout this engagement, not itself the defect under test).
4. Wait several seconds and check the customer's real mailbox (`doveadm fetch`) for the `ticket_auto_closed` notification.
5. Reproduced twice independently, on two separate fresh tickets (#4 and #5), same result both times.

## Expected result

Per issue #129343 ("Auto-closed tickets no longer send the customer the same email twice") and the worker's own code (`app/workers/helpdesk/auto_close_tickets_worker.rb` line 77, `HelpdeskMailer.ticket_auto_closed(issue, auto_close_days, :author).deliver_later`), the customer should receive exactly **one** real closure-notification email per auto-closed ticket.

## Actual result

**The customer receives zero emails — not one, not two.** The worker's own log shows the job being enqueued and "Performed" in ~2ms:

```
I, [...] [ActiveJob] Enqueued ActionMailer::MailDeliveryJob (...) to Async(mailers) with arguments: "HelpdeskMailer", "ticket_auto_closed", "deliver_now", {:args=>[...Issue/4..., 1, :author]}
I, [...] [Auto-Close] Email notification queued for author of issue #4
I, [...] [ActiveJob] [ActionMailer::MailDeliveryJob] [...] Performed ActionMailer::MailDeliveryJob (...) from Async(mailers) in 2.26ms
```

No `HelpdeskMailer: Using project-specific SMTP (...)` line ever appears (every genuinely-delivered email in this engagement, including this exact ticket's own earlier emails, logs this line) — the SMTP connection is never actually attempted. No exception is logged anywhere (checked `docker compose logs` for the full window, nothing). Checked the customer's real mailbox via `doveadm fetch` — confirmed empty of the new message, both immediately and after a 5+ second wait, on two independent repro attempts (tickets #4 and #5).

Directly invoking the exact same mailer call synchronously (bypassing the worker's own `.deliver_later`) succeeds immediately and completely:

```ruby
mail = HelpdeskMailer.ticket_auto_closed(issue, 1, :author)
mail.deliver_now
# => "HelpdeskMailer: Using project-specific SMTP (mail:587, user: alpha.support@test.local)"
# => Delivered OK, to=["alpha.customer@test.local"]
```

...and the email genuinely arrives (`doveadm fetch` confirms it, correctly in the customer's own Spanish locale: subject "Ticket #4 cerrado automáticamente por inactividad").

So `HelpdeskMailer#ticket_auto_closed` itself, `with_recipient_locale`, and the project's SMTP configuration are all confirmed correct — the defect is isolated to the worker's own `.deliver_later` call never resulting in a real SMTP send when run from this `rails runner`-invoked worker context, even though other `rails runner`-invoked workers in this exact session (the email poller's own outbound notifications) deliver real mail successfully via the same `:async` ActiveJob adapter. This narrows the defect to something specific about how/where `AutoCloseTicketsWorker` enqueues its mail job, not a generic async-adapter or rails-runner artifact.

## Evidence

### Console / log

Full job lifecycle for the second repro (ticket #5), showing "Performed" with no SMTP attempt in between:

```
I, [2026-11-25T10:20:56.084315 #4363] [Auto-Close] ✓ Closed issue #5: Auto-close dedup test ticket 2
I, [2026-11-25T10:20:56.099220 #4363] [ActiveJob] Enqueued ActionMailer::MailDeliveryJob (Job ID: fca25d48-afcc-4a0a-95fe-583cc4f9a646) to Async(mailers) with arguments: "HelpdeskMailer", "ticket_auto_closed", "deliver_now", {:args=>[...Issue/5..., 1, :author]}
I, [2026-11-25T10:20:56.099272 #4363] [Auto-Close] Email notification queued for author of issue #5
I, [2026-11-25T10:20:56.099312 #4363] [Auto-Close] Project Helpdesk QA Alpha: Closed 1 tickets
I, [2026-11-25T10:20:56.101522 #4363] [Auto-Close] Job completed. Total tickets closed: 1
I, [2026-11-25T10:20:56.101873 #4363] [ActiveJob] [ActionMailer::MailDeliveryJob] [fca25d48-afcc-4a0a-95fe-583cc4f9a646] Performed ActionMailer::MailDeliveryJob (...) from Async(mailers) in 1.72ms
```

`doveadm fetch -u alpha.customer@test.local "hdr.subject date.received" mailbox INBOX` immediately after and 5+ seconds later: latest message is still the earlier *manually-delivered* ticket #4 closure email, nothing for ticket #5 ever arrives.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md`). Related in subject area but distinct root cause from `BUG-HLP-043` (worker closed the wrong status of ticket — fixed, unrelated to mail delivery) and `BUG-HLP-044`/`BUG-HLP-055` (the *rake task* wrapper around these same workers reading dead legacy config — this bug is about the real worker class itself, invoked directly, having its queued mail silently fail to send).
- Existing bug reference (if duplicate): —

## Retest — 2026-11-26, Local (helpdesk-redmine6, localhost:3019)

- **Context**: pulled `development` branch commit `6554adc` ("Fix dashboard API error and missing auto-close emails"), fast-forward from `5fa0d9e`, container restarted. The fix itself is now visible in `auto_close_tickets_worker.rb`'s own source: the mailer calls were changed from `.deliver_later` to `.deliver_now`, with a comment directly referencing this bug's own finding ("a queued job here was performed in ~2 ms without ever opening the SMTP connection, so the customer got no email at all").
- **Steps**: created a fresh Support-tracker ticket (#6) authored by `alpha.customer`, status Resolved, backdated `updated_on` 8 days; set Alpha's `auto_close_days` to 1; invoked `Helpdesk::AutoCloseTicketsWorker.new.perform` directly (same methodology as the original repro).
- **Result**: server log now shows `HelpdeskMailer: Using project-specific SMTP (mail:587, user: alpha.support@test.local)` — the exact line that was missing in the original repro, proving the SMTP connection is genuinely attempted this time — followed by `[Auto-Close] Email notification sent to author of issue #6`. Confirmed via `doveadm fetch` on the real mailbox: newest message is `"Ticket #6 automatically closed due to inactivity"`, received at the exact time the worker ran.
- **Verdict: RETEST PASS.** Closing.

## Closed — 2026-11-26

- Closed per explicit user confirmation, following the clean retest above.
