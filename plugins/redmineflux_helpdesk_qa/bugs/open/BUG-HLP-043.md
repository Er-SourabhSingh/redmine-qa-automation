# BUG-HLP-043

- Bug ID: BUG-HLP-043
- Title: Auto-close closes ANY open-status ticket past the silence window, not just Resolved ones — contradicts the documented contract and the Email Configuration form's own field hint
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-09)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP) + `rails runner` (worker invocation only, see Notes)
- User role: Admin (setup); N/A, system-driven (the defect itself)
- Date: 2026-09-09

## Steps to reproduce

1. Set a project's **Auto Close Ticket (Days)** to a real value (e.g. `1`) via Helpdesk → Helpdesk Settings → Email Configuration.
2. Create a Support-tracker ticket and leave its Status as **New** (or In Progress / Feedback / Waiting for Customer Response — anything other than Resolved).
3. Ensure the ticket has been silent (untouched) longer than the configured Auto Close Days.
4. Let the scheduled `Helpdesk::AutoCloseTicketsWorker` run (every 2 minutes via Sidekiq), or trigger it directly.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §3.6 ("Auto-close days: Close a **resolved** ticket after this many days of silence") and §19 ("Auto-close ... Closes **resolved** tickets that have been silent longer than ...") — both stated twice, consistently — and the Email Configuration form's own field hint ("Automatically close **resolved** tickets after specified days") — only a ticket already in the **Resolved** status should ever be auto-closed. A ticket that was never Resolved (New, In Progress, Feedback, Waiting for Customer Response) should never be touched by this job, no matter how long it has been silent.

## Actual result

**The worker closes any open-status ticket that meets the silence threshold, regardless of which status it's in.** Confirmed live:

- Created ticket #56 (Support tracker, Helpdesk QA Alpha), left its Status at **New** (never touched, never Resolved).
- Backdated its `updated_on` to 2 days ago (test-setup only — done via `rails runner` since waiting 2 real days wasn't practical; the actual defect verification — the worker invocation and the resulting status check — was done for real, not simulated).
- Set Auto Close Ticket Days = 1 via the real Email Configuration UI.
- Invoked the real `Helpdesk::AutoCloseTicketsWorker` (`Helpdesk::AutoCloseTicketsWorker.new.perform`).
- Result: ticket #56 was closed — journal entry "Status changed from New to Closed" / "This ticket was automatically closed due to 1 days of inactivity" — despite never having passed through Resolved.

Root-caused via source (`app/workers/helpdesk/auto_close_tickets_worker.rb`):

```ruby
inactive_issues = project.issues
  .open
  .where('updated_on < ?', cutoff_date)
```

`.open` is Redmine's standard `Issue` scope, meaning "any status where `is_closed: false`" — on this instance that's **New, In Progress, Resolved, Feedback, and Waiting for Customer Response**, five statuses, not just Resolved. There is no `status: resolved_status` (or equivalent) filter anywhere in the worker. The identical query and identical (undocumented) scope also exists verbatim in `lib/tasks/auto_close_tickets.rake` — this is not a copy-paste-only issue in one file, both implementations of "auto-close" share the same overly broad condition.

As a companion positive control (not itself a bug): TC-HLP-150 confirmed a genuinely Resolved ticket (#55) DOES correctly close under the identical run — the mechanism works, it's just far broader in scope than documented or than the UI's own field hint promises.

## Evidence

### Screenshot

![Ticket #56, Status New, never Resolved, auto-closed by the worker with a fabricated "1 days of inactivity" journal](../../screenshots/BUG-HLP-043/new-status-ticket-auto-closed.png)

### Console / log

- Ticket #56 created via the real New Issue form (Support tracker, Helpdesk QA Alpha), Status left at New (the tracker's workflow only offers New as the initial status on creation — confirmed no other option was available).
- `rails runner` confirmed, immediately before the worker ran: `Issue.find(56).status.name == "New"`, `Issue.find(56).status.is_closed? == false`.
- Sidekiq log line at the moment of closure: `[Auto-Close] ✓ Closed issue #56: TC-HLP-153 auto-close test ticket B (never Resolved, stays In Progress)`.
- Ticket #56's own journal after the run (confirmed via the real UI, `/issues/56`): "Status changed from New to Closed" / "This ticket was automatically closed due to 1 days of inactivity."
- Source confirmed in both `app/workers/helpdesk/auto_close_tickets_worker.rb` (the real scheduled job) and `lib/tasks/auto_close_tickets.rake` (the manual-trigger rake task, though that task has its own separate, complete defect — see BUG-HLP-044) — both share the identical `project.issues.open.where('updated_on < ?', cutoff_date)` query with no status-specific filter.
- `IssueStatus.all` on this instance: New/In Progress/Resolved/Feedback/Waiting for Customer Response all have `is_closed: false`; only Closed/Rejected have `is_closed: true` — confirming `.open` genuinely spans 5 distinct statuses, not a narrow set that happens to coincide with "Resolved."

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; grepped the whole plugin QA folder for "auto close"/"auto-close" beforehand — this exact scenario, testing a non-Resolved ticket against the real worker, was written as TC-HLP-153 but never previously executed)
- Existing bug reference (if duplicate): None. Related to, but a distinct root cause from, BUG-HLP-044 (filed alongside this bug) — that bug is the rake task being entirely non-functional (reads a config source that no longer exists, so it never closes anything); this bug is the real scheduled worker being functional but far broader in scope than documented.

## Notes

- Found while executing `HELPDESK_EMAIL.md` TC-HLP-153, directly prompted by the user asking for the auto-close condition to be written out and the relevant test cases summarized.
- **Real, live collateral-damage incident during this investigation, fully disclosed and recovered**: running the real worker to reproduce this defect closed 46 tickets in Helpdesk QA Alpha in one pass (not just the 2 dedicated test tickets), since many pre-existing fixture tickets from earlier sessions happened to already be silent for over a day. The one ticket with genuinely heavy ongoing reliance (#46, the central Prepaid Hours fixture, referenced 20 times in `HELPDESK_PREPAID_HOURS.md`) was reverted to its exact prior status using the journal's own recorded `old_value`, with the fabricated auto-close journal entry removed. The other 44 tickets — each a single-use, already-fully-consumed piece of evidence for an already-completed TC or bug — were deliberately left Closed after confirming (via reference-count grep) that none are expected to be reused by ticket number. Full incident write-up and reasoning in `HELPDESK_EMAIL.md`'s new Notes section under TC-HLP-150/151/153. Auto Close Ticket Days has been set back to blank on Helpdesk QA Alpha.
- Recommend: add an explicit `.where(status: IssueStatus.find_by(name: 'Resolved'))` (or equivalent, e.g. a configurable "trigger status" rather than hardcoding "Resolved") to both the worker and the rake task's query, matching the documented and UI-labeled contract. Given BUG-HLP-044 shows the rake task is separately broken (reads the wrong config source entirely), a real fix here should audit and correct both implementations together rather than fixing one and leaving the other's separate defect in place.
