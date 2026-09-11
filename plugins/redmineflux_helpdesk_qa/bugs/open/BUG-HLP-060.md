# BUG-HLP-060

- Bug ID: BUG-HLP-060
- Production Redmine Issue ID: 120545
- Title: Sidekiq's own internal Scheduled::Poller thread crashes with an `ArgumentError` immediately on every boot (a `sidekiq` 7.3.9 / `connection_pool` 3.0.2 gem incompatibility) — permanently preventing all 3 of the plugin's documented cron-scheduled jobs (`email_checker`, `sla_monitor`, `auto_close_tickets`) from ever firing automatically, on any project, for the life of the process
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (Sidekiq process log + live ticket observation)
- User role: N/A (infrastructure-level)
- Date: 2026-09-11

## Steps to reproduce

1. Inside `redmine-docker-6-redmine-1`, start Sidekiq normally: `cd /usr/src/redmine && bundle exec sidekiq -e production`.
2. Watch its own log output.
3. Separately, create a real, customer-raised, SLA-attached ticket with a very short (1-minute) response window (project 1's "Alpha Escalation Test SLA", already a real fixture with `first_response_time: 1, response_time_unit: "minutes"`), assign it to trigger the SLA start, then wait well past both the 1-minute deadline and a full `*/2 * * * *` `sla_monitor` cron cycle.

## Expected result

Per `plugins/redmineflux_helpdesk/config/sidekiq.yml`, three jobs are scheduled to run automatically and indefinitely: `email_checker` (`*/5 * * * *`, `Helpdesk::EmailPollerWorker`), `sla_monitor` (`*/2 * * * *`, `Helpdesk::SlaMonitorWorker`), `auto_close_tickets` (`*/2 * * * *`, `Helpdesk::AutoCloseTicketsWorker`). A real SLA breach on a live ticket should be detected within one `sla_monitor` cycle (≤ 2 minutes) — `response_breached` should flip to `true` and (per `HELPDESK_MEMORY.md`'s own prior confirmed observation from earlier in this engagement) a customer's real inbound email should be converted into a ticket/journal within one `email_checker` cycle (≤ 5 minutes) — with no manual rake-task invocation required.

## Actual result

Sidekiq's own log shows its internal `Sidekiq::Scheduled::Poller` thread — the exact mechanism `sidekiq-scheduler` relies on to know when a cron-scheduled job is due — crashes with an unhandled `ArgumentError` within ~1 second of every boot, twice in a row (both scheduler poller threads Sidekiq spins up):

```
2026-09-11T13:56:34.438Z pid=2424 tid=2a60 WARN: ArgumentError: wrong number of arguments (given 1, expected 0)
#<Thread:0x00007f47e874c020@sidekiq.scheduler .../sidekiq-7.3.9/lib/sidekiq/component.rb:17 run> terminated with exception (report_on_exception is true):
/usr/local/bundle/gems/connection_pool-3.0.2/lib/connection_pool/timed_stack.rb:62:in 'pop': wrong number of arguments (given 1, expected 0) (ArgumentError)
	from /usr/local/bundle/gems/sidekiq-7.3.9/lib/sidekiq/scheduled.rb:226:in 'Sidekiq::Scheduled::Poller#initial_wait'
	from /usr/local/bundle/gems/sidekiq-7.3.9/lib/sidekiq/scheduled.rb:96:in 'block in Sidekiq::Scheduled::Poller#start'
	from /usr/local/bundle/gems/sidekiq-7.3.9/lib/sidekiq/component.rb:10:in 'Sidekiq::Component#watchdog'
	from /usr/local/bundle/gems/sidekiq-7.3.9/lib/sidekiq/component.rb:19:in 'block in Sidekiq::Component#safe_thread'
```

The installed gem versions are `sidekiq (7.3.9)` and `connection_pool (3.0.2)` (confirmed via `bundle list`) — Sidekiq 7.3.9's `Scheduled::Poller#initial_wait` calls `ConnectionPool::TimedStack#pop` with an argument that `connection_pool` 3.0.2's `pop` signature does not accept, so the thread dies on the very first tick, before it ever checks whether any of the 3 registered cron jobs (`Cron Jobs - added job with name: email_checker/sla_monitor/auto_close_tickets` are all logged as successfully *registered* just before the crash) are due. The main Sidekiq process itself stays alive and healthy (`ps` shows it running, `[0 of 5 busy]`) — only this specific internal thread is dead, silently, for the remaining life of the process. Sidekiq does not restart a crashed component thread on its own.

**Live confirmation on a real ticket:** created ticket #329 (customer-raised, `alpha.customer`), assigned it to trigger the SLA start — confirmed via API: `sla_started_at: "2026-09-11T14:03:46Z"`, `response_deadline: "2026-09-11T14:04:46Z"` (the customer's already-configured 1-minute "Alpha Escalation Test SLA"). Waited well past both the 1-minute deadline and a full 2-minute `sla_monitor` cron cycle with Sidekiq running the whole time — `response_breached` never flipped to `true` and no escalation history entry appeared, confirming the dead scheduler thread genuinely means no automatic breach detection happens, not just a delayed one.

This is a **regression, not a permanent environment limitation**: `HELPDESK_MEMORY.md`'s own record from earlier in this engagement documents `email_checker` firing correctly and creating a real ticket from an inbound email automatically — meaning this exact cron mechanism worked before on this same environment lineage, before some later container rebuild apparently picked up an incompatible `connection_pool` patch version.

## Evidence

### Console / log

- Full Sidekiq boot log (`/tmp/sidekiq.log` inside `redmine-docker-6-redmine-1`) — see the stack trace quoted above, occurring twice at `2026-09-11T13:56:34`, ~1 second after "Sidekiq: Loaded 3 scheduled jobs".
- `bundle list | grep -iE 'sidekiq|connection_pool|redis'` → `connection_pool (3.0.2)`, `redis-client (0.30.1)`, `sidekiq (7.3.9)`, `sidekiq-cron (1.12.0)`, `sidekiq-scheduler (5.0.6)`.
- Ticket #329 `sla_status` before assignment: `404 "No SLA status found for this ticket."` (correct — SLA starts on first assignment, confirmed via `lib/redmineflux_helpdesk/patches/issue_patch.rb`'s `handle_sla_on_assignment_change` → `start_sla_for_first_assignment`, a synchronous `after_save` callback unrelated to Sidekiq). After assignment: `sla_started_at`/`response_deadline` set correctly (1-minute window). After waiting past both the deadline and a full monitor cycle: `response_breached: false` still, `escalation_histories: []` still.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md` — distinct from BUG-HLP-055/056, which are about the manually-invoked `rake` tasks' own internal logic bugs; this is about the *automatic, scheduled* execution path never running at all, a categorically more severe problem since it means the correctly-written parts of BUG-HLP-056's own analysis — the real scheduled `Helpdesk::SlaMonitorWorker` passing the correct escalation reason — never actually get to execute in this environment either)

## Notes

- Found while executing `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-186/187 (scheduled SLA monitor / email poller cadence checks) — per the standing project rule to check/restart Redis + Sidekiq before any such timing test, both were confirmed down and freshly restarted this session, which is what surfaced the crash.
- Severity judged **High**: this silently and completely disables three of the plugin's core promised automations (SLA breach detection/escalation, inbound email-to-ticket conversion, and auto-closing inactive tickets) with no visible symptom to an administrator besides digging into Sidekiq's own process log — Redmine's UI gives no indication these jobs stopped running.
- Recommend: pin compatible `sidekiq`/`connection_pool` versions in the plugin's (or the Docker image's) `Gemfile.lock` — either downgrade `connection_pool` to a version whose `TimedStack#pop` signature matches what `sidekiq` 7.3.9 expects, or upgrade `connection_pool` past whatever later version reintroduced compatibility, and add a smoke check (e.g. on plugin load, or a `rake` health-check task) that verifies the Sidekiq scheduler thread is actually alive, not just that the process is running.
