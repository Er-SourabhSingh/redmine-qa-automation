# Test Cases — Redmineflux Helpdesk — Features 48–51: Reports, Background Jobs, REST API

> Source: `docs/HELPDESK_FEATURES_LIST.md` #48–51 (category I). Grounded in `docs/HELPDESK_USER_GUIDE.md` §18 (Reports), §19 (What runs in the background), §22 (REST API), and tester checklist §26 groups S (Reports), V (Background jobs), W (REST API).
>
> Background-job **outcomes** are already covered elsewhere and not repeated here: no-Sidekiq consequences in `HELPDESK_PLUGIN_INSTALLATION.md` (TC-HLP-009), auto-close behavior in `HELPDESK_EMAIL.md` (TC-HLP-150/151/153). This suite adds the job-cadence checks themselves (SLA monitor / email poller actually running on their intervals). REST API cases sample representative entities rather than re-testing every entity's CRUD a second time — the point of this suite's API cases is auth enforcement and permission parity with the UI, not exhaustive endpoint coverage.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-181: All five report tabs load

**User Role:** Agent with `view_helpdesk`
**Precondition:** Some tickets, SLAs, and agents exist with activity to report on.

**Steps:**
1. Helpdesk › Reports
2. Open each tab in turn: Ticket Summary, SLA Analytics, Agent Performance, Organizations, Projects

**Expected Result:**
- All five tabs load without error

---

### TC-HLP-182: Date range and filters correctly narrow a report's figures

**User Role:** Agent
**Precondition:** Tickets spanning more than one date range, assignee, status, priority, and project.

**Steps:**
1. On the Ticket Summary tab, set a date range covering only a known subset of tickets
2. Add an assignee filter, then a status filter, then a priority filter, then (on the global view) a project filter

**Expected Result:**
- Each filter narrows the figures to match only the tickets that should qualify

---

### TC-HLP-183: SLA Analytics shows the full documented figure set

**User Role:** Agent
**Precondition:** A mix of on-track, breached, and resolved tickets across priorities and projects.

**Steps:**
1. Open the SLA Analytics tab

**Expected Result:**
- Shows: overall compliance %, response vs. resolution compliance, total breach count, breaches broken out by priority and by project, a weekly compliance trend, and a list of recently breached tickets

---

### TC-HLP-184: Agent Performance shows the full documented figure set per agent

**User Role:** Agent
**Precondition:** Multiple agents with varying ticket loads, response times, and escalation history.

**Steps:**
1. Open the Agent Performance tab

**Expected Result:**
- Per agent: total, resolved, open, average response time, average resolution time, breach count, breach rate, and escalation count — plus a workload chart

---

### TC-HLP-185: Exporting a report produces correct CSV, Excel, and PDF files

**User Role:** Agent with `export_helpdesk_reports`
**Precondition:** A report tab with data and filters applied.

**Steps:**
1. Set a date range/filter, click **Export** → CSV
2. Repeat, exporting Excel
3. Repeat, exporting PDF

**Expected Result:**
- All three formats download successfully and reflect the currently applied filters, not the unfiltered dataset

---

### TC-HLP-186: The SLA monitor job picks up a breach within 2 minutes

**User Role:** N/A (system-driven, verified by Agent)
**Precondition:** Sidekiq and Redis running; a ticket about to breach its SLA.

**Steps:**
1. Let the ticket's deadline pass
2. Check the ticket's breach status at 1 minute and again at 3 minutes after the deadline

**Expected Result:**
- The breach is detected and marked within 2 minutes of the deadline passing (i.e. confirmed breached well before the 3-minute check)

---

### TC-HLP-187: The email poller collects a new qualifying email within 5 minutes

**User Role:** N/A (system-driven, verified by Agent)
**Precondition:** Sidekiq running; incoming mail configured for a project.

**Steps:**
1. Send a qualifying email to the configured mailbox
2. Check for the resulting ticket at 6 minutes after sending

**Expected Result:**
- The ticket exists by the 6-minute check, confirming the poller ran within its 5-minute interval

---

### TC-HLP-188: An authenticated REST API request with a valid API key succeeds

**User Role:** Agent (via API key)
**Precondition:** REST API enabled at Administration › Settings › API; agent's API key known.

**Steps:**
1. `GET /helpdesk/api/v1/tickets` with header `X-Redmine-API-Key: <valid key>`

**Expected Result:**
- Returns `200` with a JSON ticket list

---

### TC-HLP-189: Tickets — full CRUD plus merge via the REST API

**User Role:** Agent (via API key)
**Precondition:** Valid API key with helpdesk access.

**Steps:**
1. `POST` a new ticket, `GET` it back (list + show), `PUT` an update, then `POST` a merge of two tickets, then `DELETE` one

**Expected Result:**
- Every operation succeeds and matches the equivalent UI behavior (e.g. the created ticket is visible in the UI ticket list; the merge carries history as in TC-HLP-025)

---

### TC-HLP-190: Conversations — list and create a reply via the REST API

**User Role:** Agent (via API key)
**Precondition:** An existing ticket.

**Steps:**
1. `GET` the ticket's conversations/replies list
2. `POST` a new reply via the API

**Expected Result:**
- The list reflects existing replies; the new reply appears both via the API and in the UI, with the same side effects as a UI-driven reply (status change, SLA pause) where applicable

---

### TC-HLP-191: SLA status — show, pause, resume, escalate via the REST API

**User Role:** Agent (via API key)
**Precondition:** A ticket with an active SLA.

**Steps:**
1. `GET` the ticket's SLA status
2. `POST` pause, then `POST` resume
3. `POST` escalate

**Expected Result:**
- Each action succeeds and is reflected in the ticket's SLA Information panel in the UI afterward — API-driven SLA state changes are not a separate, disconnected state from the UI's

---

### TC-HLP-192: Full CRUD on Organizations and SLAs via the REST API matches UI behavior

**User Role:** Admin or Agent with `manage_helpdesk` (via API key)
**Precondition:** Valid API key.

**Steps:**
1. Create, read, update, and delete/deactivate an Organization via the API
2. Repeat for an SLA (including its `toggle active` and `history` endpoints)

**Expected Result:**
- Every operation succeeds, and the results are visible/consistent in the corresponding UI screens (e.g. an API-created SLA appears in the project's SLA tab)

---

### TC-HLP-193: `process_macros` substitutes correctly against a real ticket via the API

**User Role:** Agent (via API key)
**Precondition:** A canned response containing macros; a real ticket.

**Steps:**
1. Call the `process_macros` endpoint with the canned response's body and the target ticket

**Expected Result:**
- Returns the body with every macro substituted with real values, matching what the UI would produce (TC-HLP-158)

---

### TC-HLP-194: `sla_analytics` returns the SLA report as JSON matching the UI

**User Role:** Agent (via API key)
**Precondition:** Same dataset as TC-HLP-183.

**Steps:**
1. Call the `sla_analytics` API endpoint with the same date range/filters as TC-HLP-183

**Expected Result:**
- The JSON figures (compliance %, breach counts, etc.) match what the SLA Analytics UI tab shows for the same filters

---

### TC-HLP-195: `/helpdesk/swagger` loads for an administrator and "Try it out" works

**User Role:** Administrator
**Precondition:** REST API enabled.

**Steps:**
1. Open `/helpdesk/swagger`
2. Pick an endpoint, use **Try it out**, execute a real request

**Expected Result:**
- The Swagger UI loads with full endpoint documentation
- Executing a request via "Try it out" returns a real, correct response

---

## Negative Cases

---

### TC-HLP-196: The REST API refuses a request with no or an invalid API key

**User Role:** N/A (unauthenticated)
**Precondition:** None.

**Steps:**
1. `GET /helpdesk/api/v1/tickets` with no `X-Redmine-API-Key` header and no `?key=` param
2. Repeat with an invalid/garbage key value

**Expected Result:**
- Both requests are refused (401/403), returning no ticket data

---

### TC-HLP-197: Exporting a report is refused for a role without `export_helpdesk_reports`

**User Role:** Agent whose role has `view_helpdesk` but not `export_helpdesk_reports`
**Precondition:** Viewing any report tab.

**Expected Result (after attempting Export):**
- The Export action is refused or hidden entirely — no file is produced

---

### TC-HLP-198: The REST API enforces the UI's admin-only rule on Email Config

**User Role:** Manager with `manage_helpdesk` but not an administrator (via API key)
**Precondition:** Valid API key for this non-admin user.

**Steps:**
1. Attempt `POST`/`PUT` to the Email Config endpoint for a project

**Expected Result:**
- Refused (403) — the API enforces the same admin-only restriction the UI applies (§3.6), it does not provide a bypass

---

### TC-HLP-199: The REST API enforces customer data isolation

**User Role:** Client (Customer, via API key, if customers have API access — otherwise verify the key is refused entirely)
**Precondition:** Two customers, each with their own tickets.

**Steps:**
1. Using Customer A's API key, request Customer B's ticket by ID
2. Request the general tickets list

**Expected Result:**
- Customer A cannot retrieve Customer B's ticket
- The tickets list, if accessible at all, contains only Customer A's own tickets — matching the UI's restricted customer view (`HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md` TC-HLP-051)

---

### TC-HLP-200: `/helpdesk/swagger` is refused for a non-administrator

**User Role:** Agent with `manage_helpdesk` but not an administrator
**Precondition:** REST API enabled.

**Steps:**
1. Attempt to open `/helpdesk/swagger`

**Expected Result:**
- Access is refused — this page is admin-only regardless of helpdesk role, same as the UI's email configuration rule

---

## Edge Cases

---

### TC-HLP-201: SLA Analytics' breached-tickets list matches tickets actually breached

**User Role:** Agent
**Precondition:** A known set of tickets deliberately breached during `HELPDESK_SLA_ESCALATION.md` testing.

**Steps:**
1. Cross-check the SLA Analytics tab's "recent breached tickets" list against the actual set of tickets breached earlier in the SLA suite

**Expected Result:**
- Every ticket known to have breached appears in this list; no phantom entries for tickets that never breached

---

### TC-HLP-202: Report charts render without getting stuck on a loading animation

**User Role:** Agent
**Precondition:** Any report tab with data.

**Steps:**
1. Load a report tab and observe the chart area

**Expected Result:**
- Charts render their final state promptly — no indefinite loading spinner left on screen (regression check against a known past bug class)

---

### TC-HLP-203: REST API list counts are consistent with the UI's own counts under the same filter

**User Role:** Agent (via API key and UI, same session)
**Precondition:** A known filtered ticket set.

**Steps:**
1. Apply a filter in the UI ticket list, note the total count
2. Make the equivalent filtered request via the REST API

**Expected Result:**
- The API's returned count/list matches the UI's count exactly — no drift between the two access paths

---

## Evidence Map

- Case ID: TC-HLP-181 – TC-HLP-203
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Independently re-testing full CRUD via the REST API for every remaining entity (Customers, Project customers, Support levels, Products, Holidays, Canned responses, Prepaid support hours) — each follows the same pattern already exercised in TC-HLP-189/192; only sampled here, not exhaustively repeated per entity.
- Running background jobs by hand via their rake tasks and confirming parity with the scheduled run — belongs to the Rake Tasks suite (feature #54).
