# Features List — Redmineflux Helpdesk

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Extracted from `HELPDESK_USER_GUIDE.md` by reading it section-by-section (not just the summary tables) — see Notes for what that second pass caught.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| **A. Setup & prerequisites** | | | |
| 1 | Plugin installation | Folder install, gem bundle, Redmine default data load order, plugin migration | |
| 2 | Helpdesk module toggle | Per-project Settings › Modules switch; adds/removes the Helpdesk tab and blocks helpdesk URLs when off | |
| 3 | Support tracker requirement | A tracker named "Support" must exist; every ticket is an issue on it | |
| 4 | Redis + Sidekiq dependency | Background jobs (SLA monitor, mail poller, auto-close) require Sidekiq/Redis running | |
| **B. Navigation / workspaces** | | | |
| 5 | Helpdesk Command Center | Cross-project view; own header/icon rail, Redmine app menu hidden | |
| 6 | Project-level Helpdesk tab | Same screens scoped to one project, with normal Redmine project chrome | |
| 7 | Dashboard | KPI cards, recent tickets, charts — global (Command Center) and per-project (plus prepaid hours per organization) variants | |
| 8 | Global search | Search box on every list screen (tickets, customers, organizations, products, etc.); survives paging | |
| **C. Tickets — core** | | | |
| 9 | Ticket creation by agent | Raised from global or project Tickets screen | |
| 10 | Ticket creation by customer | Customer raises via their own project's helpdesk | |
| 11 | Ticket creation by email | Registered-customer mail + keyword gating + subject prefix becomes a ticket | |
| 12 | Ticket statuses | New, In Progress, Waiting for Customer Response, Resolved, Feedback, Closed, Rejected | |
| 13 | Automatic status flow | Agent reply → Waiting for Customer Response; customer reply → In Progress | |
| 14 | Reply to customer | Emails customer, sets status, pauses SLA clock, auto-assigns if unassigned | |
| 15 | Internal notes | Team-only, never emailed, never touches status or SLA clock | |
| 16 | Reply time logging | Presets (5/10/15/20m) or custom minutes, tied to an Activity, saved with the reply | |
| 17 | Merge duplicate tickets | Folds one ticket into another, carrying notes and history | |
| 18 | Ticket list filter panel | Purpose-built filters on 16 fields (vs. Redmine's operator grid) | |
| 19 | Column picker | 20 available columns, 9 on by default (triage set) | |
| 20 | SLA Status badge | 7 states: No SLA / On Track / At Risk / Critical / Breached / Paused / Resolved | |
| 21 | Restricted customer ticket view | Customers see only their own tickets, trimmed columns (7) and filters (5) | |
| **D. SLA / service levels** | | | |
| 22 | SLA policies | Response/resolution targets, working hours, working days, holidays, per-project or global | |
| 23 | SLA clock start | Starts on first assignment, not on ticket creation | |
| 24 | Resolution deadline deferral | Resolution deadline only starts after the first response | |
| 25 | SLA pause/resume | Pauses on agent reply or unassignment; resumes on customer reply or reassignment | |
| 26 | Breach tracking | Records breach time, fires notifications, triggers escalation candidacy | |
| 27 | SLA history | Field-level diff of every policy change and escalation | |
| 28 | SLA Information panel | Ticket-page widget: SLA applied, start, both deadlines, breach state, paused time, current support level, escalation count | |
| 29 | Support levels (L1→L2→L3) | Per-project ladder with named assignees at each tier | |
| 30 | Automatic escalation | Breach moves ticket up the ladder, reassigns, notifies new tier (email names old/new level, SLA, breach type, escalation count) | |
| 31 | Escalation history | From/to level, from/to assignee, deadlines before/after, cause, timestamp | |
| 32 | Holiday calendars | Days the SLA clock skips; names unique across the whole install | |
| **E. Customers & organizations** | | | |
| 33 | Customer records | Redmine user flagged as helpdesk customer, created from one form | |
| 34 | Project entitlements | Per-project SLA + support level + organization on the customer's access row (one row at a time) | |
| 35 | Organizations | Company records grouping customers; carry prepaid budgets | |
| 36 | Customer 360 | Identity, KPIs, entitlements, recent tickets on one page | |
| 37 | Portal preview | Read-only view of the desk exactly as one customer sees it | |
| **F. Billing — prepaid hours** | | | |
| 38 | Prepaid hour budgets | Hours bought up front per organization per project, permanent audit trail | |
| 39 | Consumption ledger | Every time entry that spent the budget, with running balance | |
| 40 | Run-out enforcement | Per customer: No limit / Hard stop / Soft (negative balance allowed) | |
| **G. Email** | | | |
| 41 | Email-to-ticket | Registered customer's mail → ticket, gated by identifier keywords | |
| 42 | Per-project SMTP sending | Each project mails from its own SMTP account/address, falls back to global | |
| 43 | Email history | Every inbound/outbound message per ticket | |
| 44 | Auto-close | Closes resolved tickets after configurable days of silence | |
| **H. Content & templates** | | | |
| 45 | Canned responses | Reply templates with 9 macros filled in per ticket | |
| 46 | Products | Per-project catalog; tickets tagged by product for reporting | |
| 47 | Knowledgebase | Per-project articles: nesting, versioning, attachments, search, share link, PDF export | |
| **I. Reporting & automation** | | | |
| 48 | Reports (5 tabs) | Ticket Summary, SLA Analytics, Agent Performance, Organizations, Projects | |
| 49 | Report export | CSV, Excel, or PDF, gated by `export_helpdesk_reports` | |
| 50 | Background jobs | SLA monitor (2 min), email poller (5 min), auto-close (2 min) via Sidekiq | |
| 51 | REST API | Full CRUD across tickets, SLAs, customers, organizations, etc.; Swagger docs (admin only) | |
| **J. Permissions** | | | |
| 52 | Permission set | `view_helpdesk`, `manage_helpdesk`, `export_helpdesk_reports`, `manage_prepaid_support_hours`, `add_kb_page`, `edit_kb_page`, `delete_kb_page` | |
| 53 | Admin-only actions | Saving a project's email configuration; the API/Swagger docs page | |
| **K. Rake tasks** | | | |
| 54 | Manual job triggers | `check_sla`, `check_emails`, `auto_close_tickets`, `seed_demo_data`, `seed_reports` | |

## Notes

- Section 26 of `HELPDESK_USER_GUIDE.md` ("Feature checklist for testers") already breaks each of the above into concrete pass/fail checks (groups A–X) — use it directly as the seed for `testcases/HELPDESK_*.md` suites rather than re-deriving scenarios from scratch.
- Six behaviors flagged in the guide as non-obvious and worth dedicated negative/edge-case TCs: SLA clock starts on assignment not creation; customers get no SLA fallback (agents do); resolution deadline deferred until first response; replying pauses the clock; holiday names are global/unique; one customer holds one project-access row at a time.
- Compatibility fact, not a feature: supported Redmine versions are 5.0.x, 5.1.x, 6.0.x, 6.1.x — carry this into `HELPDESK_REQUIREMENTS.md`'s Known Constraints and `HELPDESK_SCOPE.md`'s Redmine Version field.
- Optional setup prerequisites tied to specific features, not separate line items: the Time tracking module (needed for #16 Reply time logging and #38–40 Prepaid hours to mean anything) and a default time-entry Activity (Administration › Enumerations, avoids picking one on every reply).
- First pass (from the summary tables in "What this plugin gives you") produced 51 items; a second, section-by-section pass caught 3 more that only appear later in the doc — Dashboard (#7), Global search (#8), and the SLA Information panel (#28) — bringing the total to 54. Re-verify against the full doc if this file is extended further, not just the summary tables.
