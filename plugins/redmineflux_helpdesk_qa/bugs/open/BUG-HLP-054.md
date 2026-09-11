# BUG-HLP-054

- Bug ID: BUG-HLP-054
- Production Redmine Issue ID: 120507
- Title: `seed_demo_data` crashes with an unhandled `ActiveRecord::RecordInvalid` once cumulative logged time exceeds Sakura Mobility KK's own hard-enforced prepaid budget — leaves a permanently, silently half-populated dataset, and every future run at or above that ticket count now crashes identically forever
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (server-side rake task)
- User role: System Administrator (server access)
- Date: 2026-09-11

## Steps to reproduce

1. On an instance where `seed_demo_data` has already run at least once (so the "Redmineflux Helpdesk" project, its 2 organizations, and Sakura Mobility KK's prepaid-hours grants/enforcement already exist — this is the seeder's own idempotent-reuse steady state, not a special setup).
2. Run `TICKETS=300 bundle exec rake redmineflux_helpdesk:seed_demo_data` (any large-enough ticket count works — this instance had already run with `TICKETS=0` then `TICKETS=50` earlier in the same session, so this run only needed to add ~183 new Sakura-linked tickets before crashing).

## Expected result

Per `HELPDESK_RAKE_TASKS.md` TC-HLP-226 ("Large value: seeder completes successfully and creates that many tickets, without timing out or erroring — record actual behavior/limits if any are hit"), a demo-data seeding tool should either complete successfully for a large ticket count, or fail gracefully with a clear, actionable message — not crash with a raw Ruby exception backtrace and leave the dataset in an inconsistent, unrecoverable state.

## Actual result

Ran `TICKETS=300` (project already had 50 tickets from an earlier `TICKETS=50` run in this same session). The task crashed partway through:

```
rake aborted!
ActiveRecord::RecordInvalid: Validation failed: Prepaid support hours for Sakura Mobility KK are used up (0.00h). Top up the budget to log more time. (ActiveRecord::RecordInvalid)
...
/usr/src/redmine/plugins/redmineflux_helpdesk/lib/tasks/seed_demo_data.rake:1033:in 'RedminefluxHelpdesk::DemoDataSeeder#log_time_for_ticket'
/usr/src/redmine/plugins/redmineflux_helpdesk/lib/tasks/seed_demo_data.rake:803:in 'block in RedminefluxHelpdesk::DemoDataSeeder#seed_tickets'
```

No "Tickets: N new, M total" summary line was ever printed — the crash happened mid-loop, before the task could finish. Confirmed via the live UI ticket count (`Redmineflux Helpdesk · 233 tickets`) that **233 of the requested 300 tickets were actually created** — the loop got roughly 3/4 of the way through before dying, leaving the run silently incomplete with no error surfaced anywhere the UI would show it.

**Root cause** (`log_time_for_ticket`, lines 1018-1039): every ticket linked to a customer with an organization gets an unconditional `TimeEntry.create!` for a random 0.5-3.0h, with no check of the organization's remaining prepaid budget first. The seeder's own `seed_prepaid_hours`/`set_prepaid_enforcement` steps (run earlier in the same invocation) put **Sakura Mobility KK on hard enforcement** with a finite 80h grant — so as `TICKETS` grows, cumulative time logged against Sakura-linked tickets eventually exceeds 80h, at which point Redmine's own hard-enforcement model validation correctly refuses the `create!` — but the seeder calls the bang (raising) variant with no `rescue`, so the entire rake task aborts uncleanly instead of skipping that one time entry or capping it.

**This is now a permanent regression on this instance, not a one-off**: `@random = Random.new(42)` makes ticket generation fully deterministic (same run, same tickets, same order), and Sakura's prepaid budget does not replenish on its own — re-running `TICKETS=300` a second time crashed at the **exact same point**, with the ticket count still reading exactly `233` afterward (confirmed via UI both times). Every future `seed_demo_data` invocation requesting enough Sakura-linked tickets to reach this threshold will crash identically, forever, until someone manually tops up Sakura's prepaid budget or switches her off hard enforcement — neither of which the rake task's own documented interface (`TICKETS=<n>`) offers a way to do.

## Evidence

### Console / log

- Full first-crash output saved this session; key excerpt: `ActiveRecord::RecordInvalid: Validation failed: Prepaid support hours for Sakura Mobility KK are used up (0.00h). Top up the budget to log more time.` at `seed_demo_data.rake:1033` (`log_time_for_ticket`), called from `seed_tickets` (`:803`).
- UI (`/projects/redmineflux-helpdesk/helpdesk/tickets`), before crash-triggering run: 50 tickets. After first `TICKETS=300` crash: **233 tickets**. After a second, immediate re-run of the identical `TICKETS=300` command: **still 233 tickets**, and the exact same exception, confirming the failure is now permanent and deterministic on this instance, not a transient fluke.
- Source (`log_time_for_ticket`, `seed_demo_data.rake` lines 1018-1039): unconditional `TimeEntry.create!` with no prepaid-budget pre-check, for every organization-linked ticket, every invocation.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` / `bugs/_duplicates.md` — no prior coverage of `seed_demo_data`'s ticket-seeding-loop error handling; distinct from BUG-HLP-053, which is about the project-matching/rename step, not ticket seeding)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_RAKE_TASKS.md` TC-HLP-226 ("large `TICKETS` value... record actual behavior/limits if any are hit") — the TC explicitly anticipated a limit might exist; this confirms one does, and it's a hard crash rather than a graceful cap.
- Severity judged **High**: this is a genuine, permanent, self-inflicted regression (the seeder's own hard-enforcement configuration is what causes its own later crash), it corrupts the demo dataset into an inconsistent half-seeded state with zero rollback or warning, and — critically — it cannot be fixed by re-running the task; every subsequent invocation at or above the triggering ticket count fails identically forever without manual DB intervention outside the task's own interface.
- Recommend: `log_time_for_ticket` should catch/skip (or cap the hours at the remaining budget) rather than calling the raising `create!` unconditionally; alternatively, `seed_prepaid_hours`/`set_prepaid_enforcement` could scale Sakura's grant to the requested `TICKETS` count instead of a fixed 80h, so the two seeded quantities stay consistent with each other regardless of scale.
- This also affects re-running the suite's own earlier TCs going forward on this instance: any future `seed_demo_data` invocation on this container that would produce enough Sakura-linked tickets to re-hit this wall (now permanently primed at 233 tickets) will crash the same way — noted here so a future session doesn't waste time treating a repeat of this exact crash as a new, unrelated finding.
