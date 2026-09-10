# Test Cases — Redmineflux Helpdesk — Feature 54: Rake Tasks

> Source: `docs/HELPDESK_FEATURES_LIST.md` #54 (category K — the last feature in the full list). Grounded in `docs/HELPDESK_USER_GUIDE.md` §23 (Rake tasks) and tester checklist §26 group X.
>
> These are the manual-trigger equivalents of the scheduled background jobs already covered in `HELPDESK_PLUGIN_INSTALLATION.md` (TC-HLP-004/010), `HELPDESK_EMAIL.md` (TC-HLP-150/151/153), and `HELPDESK_REPORTING_AUTOMATION.md` (TC-HLP-186/187) — this suite checks that running each task **by hand** produces the same outcome as waiting for the scheduled run, not the outcomes themselves a second time.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-215: `check_sla` run by hand does what the scheduled SLA monitor does

**User Role:** System Administrator (server access)
**Precondition:** A ticket about to breach its SLA; Sidekiq deliberately paused so the scheduled job hasn't run yet.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_sla`
2. Check the ticket's breach status and escalation state immediately after

**Expected Result:**
- The ticket is checked, marked breached if due, and escalated if applicable — identical outcome to what the scheduled SLA monitor (TC-HLP-186) would produce

---

### TC-HLP-216: `check_emails` run by hand polls every configured mailbox once

**User Role:** System Administrator (server access)
**Precondition:** A qualifying email waiting in a configured mailbox; Sidekiq paused.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_emails`

**Expected Result:**
- The mailbox is polled immediately, and the qualifying email produces a ticket exactly as the scheduled poller (TC-HLP-187) would

---

### TC-HLP-217: `auto_close_tickets` run by hand closes eligible tickets

**User Role:** System Administrator (server access)
**Precondition:** A Resolved ticket already past its project's Auto-close days; Sidekiq paused.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:auto_close_tickets`

**Expected Result:**
- The eligible ticket is closed immediately — identical outcome to the scheduled auto-close job (`HELPDESK_EMAIL.md` TC-HLP-150)

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, server access via `docker exec`/`rails runner`): **FAIL — filed as BUG-HLP-044.** Set Auto Close Ticket Days = 1 on Helpdesk QA Alpha via the real Email Configuration UI; created two genuinely eligible tickets (one Resolved, one New — backdated `updated_on` past the threshold). Ran `bundle exec rake redmineflux_helpdesk:auto_close_tickets` from the Redmine root — output was only the start/completion banners, **no project processed, no ticket closed, no error surfaced**. Both tickets remained in their original status. Root-caused via source: the rake task reads `auto_close_days` from a legacy `ProjectCustomField` named `helpdesk_auto_close_days` — confirmed via `rails runner` that **zero `ProjectCustomField` rows exist on this instance at all**, so `next unless auto_close_days_field` fires unconditionally on every project, every run, regardless of any project's real, current configuration (which lives in `RfHelpdeskEmailConfig` and was confirmed correctly set and readable). Confirmed the real worker class (`Helpdesk::AutoCloseTicketsWorker.new.perform`, the actual scheduled-job implementation) closes both eligible tickets correctly against the identical data — proving the rake task's own code path, not the config or the fixtures, is what's broken. Same dead-code migration-cleanup pattern already noted (but never filed) for the sibling `check_emails` rake task in `HELPDESK_MEMORY.md` — recommend auditing both together. See `bugs/open/BUG-HLP-044.md` for full detail, and `HELPDESK_EMAIL.md`'s TC-HLP-150/153 Notes section for the closely related BUG-HLP-043 (a separate, real-worker-side defect: even the *working* implementation closes non-Resolved tickets too) discovered in the same investigation.

---

### TC-HLP-218: `seed_demo_data` creates a fully populated demo project

**User Role:** System Administrator (server access)
**Precondition:** No project named "Helpdesk Support" currently exists.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_demo_data`

**Expected Result:**
- A project named **Helpdesk Support** is created, populated with customers, SLAs, support levels, products, and tickets

---

### TC-HLP-219: Seeded tickets are spread over past dates, not all stamped "now"

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-218 completed.

**Steps:**
1. Inspect the created dates across the seeded tickets

**Expected Result:**
- Creation dates are spread across a range of past dates — not every ticket timestamped at the moment the seeder ran

---

### TC-HLP-220: Seeded tickets show a spread of SLA states

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-218 completed.

**Steps:**
1. Check the SLA Status badge across the seeded tickets

**Expected Result:**
- A realistic mix of states is present (e.g. some On Track, some Breached, some Resolved, some Paused) — not every ticket identical

---

### TC-HLP-221: `TICKETS=<n>` controls how many tickets the seeder creates

**User Role:** System Administrator (server access)
**Precondition:** No prior demo data on this instance.

**Steps:**
1. Run `TICKETS=50 bundle exec rake redmineflux_helpdesk:seed_demo_data`
2. Count the resulting tickets in the Helpdesk Support project

**Expected Result:**
- Approximately 50 tickets are created (matching the env var), not the tool's unparameterized default count

---

### TC-HLP-222: `seed_reports` seeds data sufficient to exercise all five report tabs

**User Role:** System Administrator (server access)
**Precondition:** None.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_reports`
2. Open each of the five report tabs (`HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-181)

**Expected Result:**
- Every tab shows meaningful, non-empty data — the seeded dataset is varied enough (dates, agents, priorities, projects, SLA outcomes) to actually exercise each report's figures, not just avoid an empty state

---

## Negative Cases

---

### TC-HLP-223: `check_emails` is a safe no-op when no mailbox is configured anywhere

**User Role:** System Administrator (server access)
**Precondition:** No project has incoming mail settings configured.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_emails`

**Expected Result:**
- Completes without error — no tickets created, no exception raised, just nothing to do

---

### TC-HLP-224: Running `seed_demo_data` when a project already named "Helpdesk Support" exists

**User Role:** System Administrator (server access)
**Precondition:** A project named "Helpdesk Support" already exists, created independently of the seeder (e.g. by a real user, unrelated to demo data).

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_demo_data`

**Expected Result — record whichever actually happens (not explicitly documented):**
- Either the seeder reuses the existing project (and the "only adds, never modifies" guarantee holds for its real content), or it fails/renames — determine and record the actual behavior, since colliding with a real project by name is a plausible real-world scenario worth knowing about

---

## Edge Cases

---

### TC-HLP-225: Running `seed_demo_data` twice creates nothing twice

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-218 already run once on this instance.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_demo_data` again

**Expected Result:**
- No duplicate customers, SLAs, support levels, organizations, or products are created
- The task reports which existing records it reused
- Previously created records are left unmodified

---

### TC-HLP-226: `TICKETS=0` and a very large `TICKETS` value are handled gracefully

**User Role:** System Administrator (server access)
**Precondition:** A clean instance (or accept whatever demo data already exists).

**Steps:**
1. Run with `TICKETS=0`
2. Separately, run with a large value (e.g. `TICKETS=500`)

**Expected Result:**
- `TICKETS=0`: seeder completes with zero tickets created (no error), other demo data (customers/SLAs/etc.) still seeds normally
- Large value: seeder completes successfully and creates that many tickets, without timing out or erroring — record actual behavior/limits if any are hit

---

### TC-HLP-227: Running all three job tasks back-to-back by hand doesn't double-process anything

**User Role:** System Administrator (server access)
**Precondition:** A ticket that would be affected by more than one job (e.g. one both breaching and eligible for auto-close-adjacent behavior).

**Steps:**
1. Run `check_sla`, then immediately `check_emails`, then immediately `auto_close_tickets`, back-to-back by hand
2. Inspect the ticket's escalation count and status history afterward

**Expected Result:**
- No ticket is double-escalated, double-closed, or otherwise processed more than once just because the tasks were run manually in quick succession — each task's own idempotency holds even when chained

---

## Evidence Map

- Case ID: TC-HLP-215 – TC-HLP-227
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
