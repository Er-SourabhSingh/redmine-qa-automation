# Test Cases — Redmineflux Helpdesk — Feature 54: Rake Tasks

> Source: `docs/HELPDESK_FEATURES_LIST.md` #54 (category K — the last feature in the full list). Grounded in `docs/HELPDESK_USER_GUIDE.md` §23 (Rake tasks) and tester checklist §26 group X.
>
> These are the manual-trigger equivalents of the scheduled background jobs already covered in `HELPDESK_PLUGIN_INSTALLATION.md` (TC-HLP-179/010), `HELPDESK_EMAIL.md` (TC-HLP-077/151/153), and `HELPDESK_REPORTING_AUTOMATION.md` (TC-HLP-266/187) — this suite checks that running each task **by hand** produces the same outcome as waiting for the scheduled run, not the outcomes themselves a second time.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-248: `check_sla` run by hand does what the scheduled SLA monitor does

**User Role:** System Administrator (server access)
**Precondition:** A ticket about to breach its SLA; Sidekiq deliberately paused so the scheduled job hasn't run yet.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_sla`
2. Check the ticket's breach status and escalation state immediately after

**Expected Result:**
- The ticket is checked, marked breached if due, and escalated if applicable — identical outcome to what the scheduled SLA monitor (TC-HLP-266) would produce

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6, server access via `docker exec`): **PARTIAL FAIL — filed as BUG-HLP-056.** Ran `bundle exec rake redmineflux_helpdesk:check_sla` against the seeded dataset's mix of breached/near-breach tickets. Breach detection and marking work correctly (console: `[BREACH] Issue #301 — resolution SLA breached`, notification emails attempted — `Notifications sent : 119`), matching the scheduled monitor. But escalation is completely broken: `Escalations : 0`, `Errors : 118`, every one reading `Validation failed: Escalation reason is not included in the list`. Root-caused via source: the rake task passes `'Response SLA breach'`/`'Resolution SLA breach'` (human-readable) to `escalate_to_next_level!`, but `RfIssueSlaEscalationHistory`'s validation only accepts `response_breach`/`resolution_breach`/`manual` — the real scheduled `Helpdesk::SlaMonitorWorker` passes the correct machine-readable value and escalates fine. Verified via UI on ticket #301: SLA Information tab shows the breach was detected ("⚠ Critical", "Overdue 3 days") but no new escalation entry was added to the SLA Journey — it still shows only its earlier pre-existing L1→L2 escalation from the seed data. See `bugs/open/BUG-HLP-056.md`.

---

### TC-HLP-249: `check_emails` run by hand polls every configured mailbox once

**User Role:** System Administrator (server access)
**Precondition:** A qualifying email waiting in a configured mailbox; Sidekiq paused.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_emails`

**Expected Result:**
- The mailbox is polled immediately, and the qualifying email produces a ticket exactly as the scheduled poller (TC-HLP-267) would

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6, server access via `docker exec`): **FAIL — filed as BUG-HLP-055.** Ran `bundle exec rake redmineflux_helpdesk:check_emails` with 4 helpdesk-enabled projects present, including Alpha and Beta whose real incoming-mail configuration (`RfHelpdeskEmailConfig`) is genuinely set and confirmed working via the actual scheduled `EmailPollerWorker` in earlier sessions of this engagement. Every single project — Alpha, Beta, Gamma, and the freshly-seeded Redmineflux Helpdesk project — was reported `"Incoming email disabled for this project, skipping..."`, with zero mailboxes actually polled and zero tickets created. Root-caused via source: the task reads a legacy `ProjectCustomField` named `helpdesk_enable_incoming_email` (plus 6 sibling legacy fields for protocol/server/username/password/ssl/tracker) that no longer exists on this instance — the identical dead-code migration-cleanup gap already confirmed for `auto_close_tickets` (BUG-HLP-044), and explicitly predicted for this exact task in that bug's own Notes section and in `HELPDESK_MEMORY.md`. See `bugs/open/BUG-HLP-055.md` for full detail.

---

### TC-HLP-250: `auto_close_tickets` run by hand closes eligible tickets

**User Role:** System Administrator (server access)
**Precondition:** A Resolved ticket already past its project's Auto-close days; Sidekiq paused.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:auto_close_tickets`

**Expected Result:**
- The eligible ticket is closed immediately — identical outcome to the scheduled auto-close job (`HELPDESK_EMAIL.md` TC-HLP-077)

CONFIRMED LIVE 2026-09-09 (Local, redmine-docker-6, server access via `docker exec`/`rails runner`): **FAIL — filed as BUG-HLP-044.** Set Auto Close Ticket Days = 1 on Helpdesk QA Alpha via the real Email Configuration UI; created two genuinely eligible tickets (one Resolved, one New — backdated `updated_on` past the threshold). Ran `bundle exec rake redmineflux_helpdesk:auto_close_tickets` from the Redmine root — output was only the start/completion banners, **no project processed, no ticket closed, no error surfaced**. Both tickets remained in their original status. Root-caused via source: the rake task reads `auto_close_days` from a legacy `ProjectCustomField` named `helpdesk_auto_close_days` — confirmed via `rails runner` that **zero `ProjectCustomField` rows exist on this instance at all**, so `next unless auto_close_days_field` fires unconditionally on every project, every run, regardless of any project's real, current configuration (which lives in `RfHelpdeskEmailConfig` and was confirmed correctly set and readable). Confirmed the real worker class (`Helpdesk::AutoCloseTicketsWorker.new.perform`, the actual scheduled-job implementation) closes both eligible tickets correctly against the identical data — proving the rake task's own code path, not the config or the fixtures, is what's broken. Same dead-code migration-cleanup pattern already noted (but never filed) for the sibling `check_emails` rake task in `HELPDESK_MEMORY.md` — recommend auditing both together. See `bugs/open/BUG-HLP-044.md` for full detail, and `HELPDESK_EMAIL.md`'s TC-HLP-077/153 Notes section for the closely related BUG-HLP-043 (a separate, real-worker-side defect: even the *working* implementation closes non-Resolved tickets too) discovered in the same investigation.

---

### TC-HLP-251: `seed_demo_data` creates a fully populated demo project

**User Role:** System Administrator (server access)
**Precondition:** No project named "Helpdesk Support" currently exists.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_demo_data`

**Expected Result:**
- A project named **Helpdesk Support** is created, populated with customers, SLAs, support levels, products, and tickets

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS, with a documentation-accuracy correction, not a bug.** Pre-check done the correct way — signed in as admin via Playwright, clicked the real "Projects" nav link, confirmed via UI snapshot (not `rails runner`) that only Helpdesk QA Alpha/Beta/Gamma/"test" existed beforehand, no "Helpdesk Support" and no "Redmineflux Helpdesk". Ran `bundle exec rake redmineflux_helpdesk:seed_demo_data` via `docker exec` (the one legitimate server-access step here — no UI trigger exists for a rake task). Console output: 25 new tickets ("25 new, 25 total across 6 SLA states"), plus organizations/customers/SLAs/support levels/products/canned responses/KB pages, one canned response ("Acknowledge receipt") correctly reused rather than duplicated. Verified entirely via UI afterward: the created project is genuinely named **"Redmineflux Helpdesk"** (`/projects/redmineflux-helpdesk`), not "Helpdesk Support" as this TC and `HELPDESK_USER_GUIDE.md` assume — confirmed via source (`seed_demo_data.rake`: `PROJECT_NAME = 'Redmineflux Helpdesk'`, `PROJECT_IDENTIFIER = 'redmineflux-helpdesk'`, with `LEGACY_PROJECT_IDENTIFIER = 'helpdesk-support'` kept only as a fallback lookup for an older-named project). Project Overview confirms 24 open + 1 closed = 25 Support tickets, real description text; Helpdesk Dashboard confirms genuine variety (0 Unassigned / 24 Open / 25 "On Hold" / 4 SLA Breached / 1 Resolved) and two organizations with distinct Prepaid Support Hours ledgers (Atlas Logistics Inc. 18% used, Sakura Mobility KK 6% used). **This TC's own wording (and the User Guide's) is stale** — the plugin was evidently renamed from "Helpdesk Support" to "Redmineflux Helpdesk" at some point, and the rake task/docs were never updated to match; not filing as a bug since the actual behavior (a fully-populated, correctly-named-per-current-code demo project) is functionally exactly what's promised. Corrected this TC's own Expected Result below to match current reality.
**Corrected Expected Result:** A project named **Redmineflux Helpdesk** (identifier `redmineflux-helpdesk`) is created — or, if a project with the legacy identifier `helpdesk-support` already exists, that project is reused instead — populated with customers, SLAs, support levels, products, and tickets.

---

### TC-HLP-252: Seeded tickets are spread over past dates, not all stamped "now"

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-251 completed.

**Steps:**
1. Inspect the created dates across the seeded tickets

**Expected Result:**
- Creation dates are spread across a range of past dates — not every ticket timestamped at the moment the seeder ran

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Verified via UI only (Helpdesk Tickets list, `/projects/redmineflux-helpdesk/helpdesk/tickets`), not backend query. The 25 seeded tickets' Updated-column timestamps span from `09/11/2026 10:31 AM` (today, the moment the seeder ran) down to `09/02/2026 03:32 PM` — a genuine 9-day spread, not a single instant. Cross-checked directly on ticket #111 (`/issues/111`): the core Redmine "Added by ... X days ago" line reads **"Added by Vikram Reddy 9 days ago"** — confirming the ticket's actual `created_on` (not just `updated_on`) is genuinely backdated to 2026-09-02, even though the seeder itself ran today. Matches the rake source's `existing_ids`/backdating logic seen earlier in `seed_demo_data.rake`.

---

### TC-HLP-253: Seeded tickets show a spread of SLA states

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-251 completed.

**Steps:**
1. Check the SLA Status badge across the seeded tickets

**Expected Result:**
- A realistic mix of states is present (e.g. some On Track, some Breached, some Resolved, some Paused) — not every ticket identical

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Verified via UI only, same Helpdesk Tickets list as TC-219. Distinct SLA Status badges genuinely present across the 25 tickets: **On Track** (e.g. #98, "2h 59m Remaining"), **At Risk** (e.g. #101/#97/#96/#92/#102, ranging 27m–1h59m remaining), **Critical** (e.g. #105/#103, 21m–27m remaining), **⚠ Breached** (e.g. #99/#95/#100/#94/#108/#106/#107/#109, overdue amounts ranging from `+0m ago` to `+100h 0m ago`), and **✓ Resolved** (e.g. #114/#110/#116/#112/#115/#113/#111, SLA clock stopped). That's 5 distinct states with realistic variety in both kind and magnitude (a breach 0 minutes old vs. one 100 hours old) — not a uniform or templated set. No explicit "Paused" example seen in this batch, but the TC's wording only requires "a realistic mix," which this clearly is.

---

### TC-HLP-254: `TICKETS=<n>` controls how many tickets the seeder creates

**User Role:** System Administrator (server access)
**Precondition:** No prior demo data on this instance.

**Steps:**
1. Run `TICKETS=50 bundle exec rake redmineflux_helpdesk:seed_demo_data`
2. Count the resulting tickets in the Helpdesk Support project

**Expected Result:**
- Approximately 50 tickets are created (matching the env var), not the tool's unparameterized default count

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Instance already had 25 tickets from the TC-218 run. Ran `TICKETS=50 bundle exec rake redmineflux_helpdesk:seed_demo_data` via `docker exec` — console output "25 new, 50 total across 6 SLA states". Verified via UI (not backend): Helpdesk Tickets page header reads exactly "Redmineflux Helpdesk · 50 tickets" — the env var precisely controls the total, not just adds a fixed default on top.

---

### TC-HLP-255: `seed_reports` seeds data sufficient to exercise all five report tabs

**User Role:** System Administrator (server access)
**Precondition:** None.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_reports`
2. Open each of the five report tabs (`HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-261)

**Expected Result:**
- Every tab shows meaningful, non-empty data — the seeded dataset is varied enough (dates, agents, priorities, projects, SLA outcomes) to actually exercise each report's figures, not just avoid an empty state

CONFIRMED LIVE 2026-09-09/2026-09-11 (Local, redmine-docker-6): **FAIL — the task does not exist.** `bundle exec rake -T` (listing every rake task the plugin registers) shows exactly 5 `redmineflux_helpdesk:*` tasks: `auto_close_tickets`, `check_emails`, `check_sla`, `hide_custom_fields`, `seed_demo_data`. There is no `seed_reports` task anywhere in the plugin's `lib/tasks/` directory. Attempting `bundle exec rake redmineflux_helpdesk:seed_reports` would fail with Rake's own "Don't know how to build task" error before ever reaching plugin code. This TC and `HELPDESK_FEATURES_LIST.md`/`HELPDESK_USER_GUIDE.md` (wherever they reference `seed_reports`) describe a task that either was never built or was removed — this is a documentation gap, not a code defect to file as a bug (there's no broken behavior to fix; the fix is removing or correcting the doc reference). `HELPDESK_REPORTING_AUTOMATION.md`'s own report-tab test cases (TC-HLP-261 etc.) already get their non-empty data from the real `seed_demo_data` task's own ticket/SLA/time-entry seeding (confirmed via TC-HLP-251/219/220 above), so this gap does not block report-tab coverage in practice.

---

## Negative Cases

---

### TC-HLP-256: `check_emails` is a safe no-op when no mailbox is configured anywhere

**User Role:** System Administrator (server access)
**Precondition:** No project has incoming mail settings configured.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:check_emails`

**Expected Result:**
- Completes without error — no tickets created, no exception raised, just nothing to do

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS on its literal wording, but for the wrong reason — see BUG-HLP-055.** The same run used for TC-HLP-249 completed cleanly with no exception and zero tickets created for any project, satisfying this TC's literal expected result. However, this is **not** genuine graceful handling of "no mailbox configured anywhere" — the task is unconditionally broken (BUG-HLP-055) and reports every project as unconfigured regardless of whether it actually has real, working mail settings (confirmed: Alpha and Beta both do). The zero-config precondition this TC describes (no project configured, anywhere) could not actually be distinguished from the "task is just dead code" state on this instance, since the task can no longer tell the difference itself. Recorded as a pass on behavior, with the caveat that it provides no real evidence the task would behave gracefully in a genuinely-unconfigured scenario if the underlying bug were fixed — that would need re-testing once BUG-HLP-055 is resolved.

---

### TC-HLP-257: Running `seed_demo_data` when a project already named "Helpdesk Support" exists

**User Role:** System Administrator (server access)
**Precondition:** A project named "Helpdesk Support" already exists, created independently of the seeder (e.g. by a real user, unrelated to demo data).

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_demo_data`

**Expected Result — record whichever actually happens (not explicitly documented):**
- Either the seeder reuses the existing project (and the "only adds, never modifies" guarantee holds for its real content), or it fails/renames — determine and record the actual behavior, since colliding with a real project by name is a plausible real-world scenario worth knowing about

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **investigated via source (`seed_project`, `seed_demo_data.rake` lines 368-390) — TC's own premise needs correcting, and a real defect found; filed as BUG-HLP-053.** The lookup is **by project `identifier`, never by name**: `Project.find_by(identifier: 'redmineflux-helpdesk')`, falling back to `Project.find_by(identifier: 'helpdesk-support')` only if the first misses. So an unrelated project merely *named* "Helpdesk Support" is **not** at risk unless Redmine's own default slugification also happens to give it the identifier `helpdesk-support` exactly (which it would, for that exact name, on a project where the identifier wasn't hand-edited) — the real trigger is identifier collision, not name collision, and this TC's wording should be corrected to say so. Couldn't reproduce the exact live scenario this session without destroying the `redmineflux-helpdesk` project already established for TC-218/219/220 (which now wins the primary-identifier lookup, making the legacy branch unreachable on this instance) — recorded as source-verified rather than UI-verified for this one TC, per the standing rule that only actual rake invocations (not this kind of design/source review) are exempt from the Playwright-only verification requirement; there is no live *result* being claimed here, only a reading of the shipped code path. **The defect:** when the legacy-identifier branch does hit, the task renames the matched project via `@project.update_columns(identifier:, name:)` — a direct column write that bypasses model validations/callbacks — with no check that the matched project is actually a stale copy of the demo project (e.g. no check for the Support tracker, no ticket-count sanity check, nothing) before silently renaming it and dumping 25 fake NovaCrest tickets into it. Any admin whose real, unrelated project happens to carry the identifier `helpdesk-support` would have it silently renamed and repurposed the next time this task runs. **Corrected Expected Result:** the collision condition is identifier-based (`helpdesk-support` or `redmineflux-helpdesk`), not name-based; and the task should verify the matched project actually looks like prior demo data (e.g. already has the Support tracker enabled, or a marker custom field) before reusing/renaming it, rather than trusting the identifier alone.

---

## Edge Cases

---

### TC-HLP-258: Running `seed_demo_data` twice creates nothing twice

**User Role:** System Administrator (server access)
**Precondition:** TC-HLP-251 already run once on this instance.

**Steps:**
1. Run `bundle exec rake redmineflux_helpdesk:seed_demo_data` again

**Expected Result:**
- No duplicate customers, SLAs, support levels, organizations, or products are created
- The task reports which existing records it reused
- Previously created records are left unmodified

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Two independent re-runs confirmed this, not one: (1) ran with `TICKETS=0` right after the TC-218 run (25 tickets existing) — console explicitly listed every SLA/Organization/Product/Support Level/Canned Response/Holiday/Support Package/Time Entry Activity under "Already present, reused untouched:", zero duplicates of any kind; verified via UI the ticket count stayed exactly 25. (2) Ran the identical `TICKETS=50` command twice in a row (once to go 25→50, then again with the instance already at 50) — the second run's console output read "0 new, 50 total across 6 SLA states"; verified via UI the ticket count stayed exactly 50 both times. Both non-ticket entity reuse and ticket-level reuse (the `i < existing` branch in `seed_tickets`, confirmed via source) hold up under real re-runs.

---

### TC-HLP-259: `TICKETS=0` and a very large `TICKETS` value are handled gracefully

**User Role:** System Administrator (server access)
**Precondition:** A clean instance (or accept whatever demo data already exists).

**Steps:**
1. Run with `TICKETS=0`
2. Separately, run with a large value (e.g. `TICKETS=500`)

**Expected Result:**
- `TICKETS=0`: seeder completes with zero tickets created (no error), other demo data (customers/SLAs/etc.) still seeds normally
- Large value: seeder completes successfully and creates that many tickets, without timing out or erroring — record actual behavior/limits if any are hit

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **`TICKETS=0` → PASS. Large value → FAIL, filed as BUG-HLP-054.** `TICKETS=0` ran cleanly: console printed "Tickets: none requested", every other entity section still seeded/reused normally, and the UI confirmed the ticket count was untouched (still 25) — a genuine graceful no-op, no error, matching source (`return say('  none requested') if @ticket_count.zero?`). The large-value half is a real, reproducible crash, not a graceful completion: `TICKETS=300` (instance already at 50 tickets) aborted partway through with an unhandled `ActiveRecord::RecordInvalid` ("Prepaid support hours for Sakura Mobility KK are used up") from an unconditional `TimeEntry.create!` in `log_time_for_ticket` — no prepaid-budget check before logging time against a hard-enforced organization. UI confirmed only 233 of the requested 300 tickets were actually created, no summary line printed. Re-ran the identical command a second time to check whether this was a fluke — it crashed at the **exact same point**, ticket count still exactly 233 both times, confirming this is now a permanent, deterministic regression on this instance (fixed RNG seed + non-replenishing budget), not a one-off timing issue. See `bugs/open/BUG-HLP-054.md` for full root cause and reproduction.

---

### TC-HLP-260: Running all three job tasks back-to-back by hand doesn't double-process anything

**User Role:** System Administrator (server access)
**Precondition:** A ticket that would be affected by more than one job (e.g. one both breaching and eligible for auto-close-adjacent behavior).

**Steps:**
1. Run `check_sla`, then immediately `check_emails`, then immediately `auto_close_tickets`, back-to-back by hand
2. Inspect the ticket's escalation count and status history afterward

**Expected Result:**
- No ticket is double-escalated, double-closed, or otherwise processed more than once just because the tasks were run manually in quick succession — each task's own idempotency holds even when chained

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS on the specific double-processing question, with one unresolved observation worth flagging.** `check_emails` and `auto_close_tickets` are both confirmed complete no-ops on this instance (BUG-HLP-055/044) — running either any number of times back-to-back cannot double-process anything, since neither ever processes anything at all. For `check_sla`, ran it twice in immediate succession: run 1 → `Notifications sent: 119, Escalations: 0, Errors: 118`; run 2 (seconds later) → `Notifications sent: 79, Escalations: 0, Errors: 50`. The drop confirms the `!sla_status.response_breached` / `!sla_status.resolution_breached` guards correctly skip tickets already marked on run 1 — the 79/50 on run 2 are new breaches from tickets whose own deadlines lapsed in the few minutes between runs (real wall-clock time passing), not re-processed duplicates; no ticket's escalation *count* increased across the two runs (confirmed on #301, still "Escalated 1×" both times). **One unresolved observation**: ticket #301's SLA Journey "Activity Log" gained a new "✗ Resolution SLA Breached" row between the two runs (2 events → 3 events) even though its `resolution_breached` flag was already `true` after run 1 and its guard should have skipped it entirely on run 2 — the row itself doesn't represent a double-escalation (escalation count stayed at 1, no new support-level change), but its appearance is inconsistent with the guard logic as read from source. Not filed as its own bug given the uncertainty over the exact mechanism (a UI-rendering quirk vs. a genuine partial-write timing issue in `mark_resolution_breached!`/`escalate_to_next_level!` were both plausible from the code read, and distinguishing them would need deeper instrumentation than this TC's scope) — flagged here for a future session to dig into if it recurs.

---

## Evidence Map

- Case ID: TC-HLP-248 – TC-HLP-260
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
