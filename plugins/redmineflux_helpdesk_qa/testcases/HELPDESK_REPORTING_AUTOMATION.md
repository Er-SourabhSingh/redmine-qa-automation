# Test Cases — Redmineflux Helpdesk — Features 48–51: Reports, Background Jobs, REST API

> Source: `docs/HELPDESK_FEATURES_LIST.md` #48–51 (category I). Grounded in `docs/HELPDESK_USER_GUIDE.md` §18 (Reports), §19 (What runs in the background), §22 (REST API), and tester checklist §26 groups S (Reports), V (Background jobs), W (REST API).
>
> Background-job **outcomes** are already covered elsewhere and not repeated here: no-Sidekiq consequences in `HELPDESK_PLUGIN_INSTALLATION.md` (TC-HLP-184), auto-close behavior in `HELPDESK_EMAIL.md` (TC-HLP-077/151/153). This suite adds the job-cadence checks themselves (SLA monitor / email poller actually running on their intervals). REST API cases sample representative entities rather than re-testing every entity's CRUD a second time — the point of this suite's API cases is auth enforcement and permission parity with the UI, not exhaustive endpoint coverage.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-261: All five report tabs load

**User Role:** Agent with `view_helpdesk`
**Priority:** High
**Precondition:** Some tickets, SLAs, and agents exist with activity to report on.

**Steps:**
1. Helpdesk › Reports
2. Open each tab in turn: Ticket Summary, SLA Analytics, Agent Performance, Organizations, Projects

**Expected Result:**
- All five tabs load without error

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS, with a precondition correction — see BUG-HLP-057.** First attempted as `luna.blossom` (real Agent fixture, `view_helpdesk` only, no `manage_helpdesk`) exactly as this TC's own "User Role" specifies — she has no "Reports" link anywhere (no global Helpdesk Command Center menu at all, and the project-level Helpdesk sub-nav shows only Dashboard/Tickets/Knowledgebase). Per the standing rule that a hidden UI link never proves the backend is blocked, navigated her directly to `/rf_helpdesk/reports/tickets` — genuine `403 Forbidden`. So `view_helpdesk` alone cannot reach Reports at all, contradicting this TC's own stated role and `HELPDESK_USER_GUIDE.md` §20's permission table ("view_helpdesk: ...tickets and reports"). Re-ran with `manage.helpdesk.test` (`view_helpdesk` + `manage_helpdesk`, confirmed via the role's own checked-checkbox values, no `export_helpdesk_reports`) — all 5 tabs (Ticket Summary, SLA Analytics, Agent Performance, Organizations, Projects) loaded cleanly with real data, no errors. **Corrected User Role for this TC: Agent with `manage_helpdesk` (not `view_helpdesk` alone).** This is the same root-cause investigation that produced BUG-HLP-057 (see TC-HLP-277 below) — filed there rather than duplicating.

---

### TC-HLP-262: Date range and filters correctly narrow a report's figures

**User Role:** Agent
**Priority:** High
**Precondition:** Tickets spanning more than one date range, assignee, status, priority, and project.

**Steps:**
1. On the Ticket Summary tab, set a date range covering only a known subset of tickets
2. Add an assignee filter, then a status filter, then a priority filter, then (on the global view) a project filter

**Expected Result:**
- Each filter narrows the figures to match only the tickets that should qualify

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** As `manage.helpdesk.test` on Ticket Summary (unfiltered: 319 total/266 open/53 resolved). Applied Project filter = Helpdesk QA Alpha → 83/32/51, exactly matching the Projects tab's own independently-computed per-project breakdown (Alpha: 83 total, 32 open, 51 closed) seen moments earlier. Then added Assignee = Luna Blossom (Project still Alpha) → 14/3/11, exactly matching Agent Performance tab's own row for Luna Blossom (Total 14, Resolved 11, Open 3). Two independent filters, both cross-verified against two other report tabs' own independently-computed figures for the identical scope — strong evidence filtering is genuinely applied server-side, not just a client-side display trick.

---

### TC-HLP-263: SLA Analytics shows the full documented figure set

**User Role:** Agent
**Priority:** Medium
**Precondition:** A mix of on-track, breached, and resolved tickets across priorities and projects.

**Steps:**
1. Open the SLA Analytics tab

**Expected Result:**
- Shows: overall compliance %, response vs. resolution compliance, total breach count, breaches broken out by priority and by project, a weekly compliance trend, and a list of recently breached tickets

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** As `manage.helpdesk.test`, SLA Analytics tab showed every documented figure with real, non-trivial values: Overall Compliance 68.6%, Response SLA 70.8% (46/65 met), Resolution SLA 66.3% (55/83 met), Total Breaches 47, Total Tickets 319, a "Breaches by Priority" table (5 rows, e.g. Normal 289 tickets/44 breaches/15.2%), a "Breaches by Project" table (4 rows), a "Weekly Compliance Trend" chart heading, and a "Breached Tickets (Recent 20)" table with real ticket links, subjects, and per-ticket Response/Resolution SLA status. Total Breaches (47) is independently consistent with the Projects tab's own "SLA Breached: 47" figure and the Helpdesk Dashboard's "47 SLA Breached" KPI, seen separately.

---

### TC-HLP-264: Agent Performance shows the full documented figure set per agent

**User Role:** Agent
**Priority:** Medium
**Precondition:** Multiple agents with varying ticket loads, response times, and escalation history.

**Steps:**
1. Open the Agent Performance tab

**Expected Result:**
- Per agent: total, resolved, open, average response time, average resolution time, breach count, breach rate, and escalation count — plus a workload chart

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** As `manage.helpdesk.test`, Agent Performance tab showed summary KPIs (Active Agents 9, Total Tickets 319, Assigned 278, Unassigned 41) plus a per-agent table with every documented column (Total/Resolved/Open/Avg Response Time/Avg Resolution Time/Total Breaches/Breach Rate/Escalations) for all 9 agents with real, varied values (e.g. Claire Dubois: 94 total, 0 resolved, 27 breaches, 28.7% breach rate, 158 escalations; Luna Blossom: 14 total, 11 resolved, 1 breach, 7.7%, 0 escalations) — genuinely differentiated per-agent data, not placeholders. An "Agent Workload" chart heading was also present.

---

### TC-HLP-265: Exporting a report produces correct CSV, Excel, and PDF files

**User Role:** Agent with `export_helpdesk_reports`
**Priority:** High
**Precondition:** A report tab with data and filters applied.

**Steps:**
1. Set a date range/filter, click **Export** → CSV
2. Repeat, exporting Excel
3. Repeat, exporting PDF

**Expected Result:**
- All three formats download successfully and reflect the currently applied filters, not the unfiltered dataset

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS, all three formats.** As `manage.helpdesk.test`, filtered Ticket Summary to Project=Alpha + Assignee=Luna Blossom (on-screen: 14/3/11/0), then exported all three formats from that same filtered view: **CSV** (`helpdesk_tickets_2026-08-13_to_2026-09-11.csv`) — plain text, confirmed content reads `14,3,11,0` and `Helpdesk QA Alpha` under BY PROJECT, not the unfiltered 319. **Excel** (`.xls`) — a valid MSO-namespaced HTML-as-Excel file (Excel opens these natively via the `xmlns:x="...excel"` markers, a legitimate technique, not a bug) — confirmed content shows `Total Tickets</td><td>14`, `Open</td><td>3`, matching the filtered view. **PDF** — a real rendered-page PDF (read directly via the Read tool), showing the exact filtered KPI cards (14/3/11/0), the "Helpdesk QA Alpha"-only bar in Tickets by Project, and the same Daily Ticket Trend line chart as on-screen. All three exports correctly reflect the applied filters, none silently fall back to the full unfiltered dataset.

---

### TC-HLP-266: The SLA monitor job picks up a breach within 2 minutes

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** High
**Precondition:** Sidekiq and Redis running; a ticket about to breach its SLA.

**Steps:**
1. Let the ticket's deadline pass
2. Check the ticket's breach status at 1 minute and again at 3 minutes after the deadline

**Expected Result:**
- The breach is detected and marked within 2 minutes of the deadline passing (i.e. confirmed breached well before the 3-minute check)

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **FAIL — filed as BUG-HLP-060.** Per the standing rule to check/restart Redis + Sidekiq before any such test, both were confirmed down and freshly restarted. Sidekiq's own boot log showed its internal `Scheduled::Poller` thread — the exact mechanism `sidekiq-scheduler` relies on to fire cron jobs, including `sla_monitor` — crash immediately with `ArgumentError: wrong number of arguments (given 1, expected 0)` at `connection_pool-3.0.2/lib/connection_pool/timed_stack.rb:62:in 'pop'`, called from `sidekiq-7.3.9/lib/sidekiq/scheduled.rb:226`, a real gem-version incompatibility (`sidekiq 7.3.9` vs `connection_pool 3.0.2`, confirmed via `bundle list`). Live-confirmed the consequence on a real ticket: created customer-raised ticket #329, assigned it (which correctly, synchronously starts the SLA per `alpha.customer`'s already-configured 1-minute "Alpha Escalation Test SLA" — `sla_started_at`/`response_deadline` both set correctly, exactly 1 minute apart). Waited well past both the 1-minute deadline and a full 2-minute `sla_monitor` cron interval, then re-checked: `response_overdue: true` (deadline genuinely passed) but `response_breached: false`, `response_breached_at: null`, `escalation_count: 0` — the scheduled job never ran, so the breach was never automatically detected/marked. Root-caused and filed as **BUG-HLP-060**.

---

### TC-HLP-267: The email poller collects a new qualifying email within 5 minutes

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** High
**Precondition:** Sidekiq running; incoming mail configured for a project.

**Steps:**
1. Send a qualifying email to the configured mailbox
2. Check for the resulting ticket at 6 minutes after sending

**Expected Result:**
- The ticket exists by the 6-minute check, confirming the poller ran within its 5-minute interval

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **FAIL by the same root cause as TC-HLP-266 — BUG-HLP-060, not independently re-confirmed via a live email send.** `email_checker` (`Helpdesk::EmailPollerWorker`) is registered on the exact same crashed `Sidekiq::Scheduled::Poller` thread as `sla_monitor` (all 3 cron jobs are logged as "added" via the identical mechanism, seconds before that thread's fatal `ArgumentError`) — since the thread that would fire it is confirmed dead for the life of the process, `email_checker` cannot be running on its cron either. Not re-verified with an actual email round-trip this session (the failure mode is already conclusively demonstrated at the mechanism level for TC-HLP-266); `HELPDESK_MEMORY.md`'s own prior record confirms this exact job worked correctly earlier in this engagement, before whatever gem-version drift introduced this regression — see BUG-HLP-060 for the full analysis.

---

### TC-HLP-268: An authenticated REST API request with a valid API key succeeds

**User Role:** Agent (via API key)
**Priority:** High
**Precondition:** REST API enabled at Administration › Settings › API; agent's API key known.

**Steps:**
1. `GET /helpdesk/api/v1/tickets` with header `X-Redmine-API-Key: <valid key>`

**Expected Result:**
- Returns `200` with a JSON ticket list

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Confirmed `/helpdesk/swagger` loads a full OAS 3.0 spec (via `/helpdesk/swagger_spec`) documenting every endpoint. Verified the key works genuinely standalone (not just via the admin's browser session) using `fetch(..., {credentials: 'omit'})` to strip cookies entirely: `GET /helpdesk/api/v1/tickets?key=<valid key>` → `200`, real JSON `{data: [...25 tickets...], meta: {total_count: 319, page: 1, per_page: 25, total_pages: 13}}`.

---

### TC-HLP-269: Tickets — full CRUD plus merge via the REST API

**User Role:** Agent (via API key)
**Priority:** Medium
**Precondition:** Valid API key with helpdesk access.

**Steps:**
1. `POST` a new ticket, `GET` it back (list + show), `PUT` an update, then `POST` a merge of two tickets, then `DELETE` one

**Expected Result:**
- Every operation succeeds and matches the equivalent UI behavior (e.g. the created ticket is visible in the UI ticket list; the merge carries history as in TC-HLP-379)

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Note: the request body must be flat top-level params (`{project_id, subject, ...}`), not nested under a `ticket` key — confirmed via the Swagger spec's own schema description ("Sent as flat top-level params, not nested under a root key"); also discovered the Support tracker's required custom field ("test", cf_5) must be supplied via `custom_field_values: {"5": "..."}." or creation correctly fails with `422`/`field_errors`. Once using the correct shape: `POST /tickets` → `201`, ticket #325 created; `GET /tickets/325` → `200`, correct subject; `PUT /tickets/325` → `200`, subject updated correctly; created a second ticket #326 the same way; `POST /tickets/326/merge {merge_into_id: 325}` → `200`, `{"message":"Tickets merged successfully.","target_id":325}`; `DELETE /tickets/325` → `200`; `GET /tickets/325` afterward → `404`, confirming genuine deletion. Verified the merge via UI on #326: status genuinely "Closed", with a real History entry "Status changed from New to Closed" / "Merged into ticket #325." — a real, meaningful merge action, even though (per BUG-HLP-017) there's no UI control to trigger it manually.

---

### TC-HLP-270: Conversations — list and create a reply via the REST API

**User Role:** Agent (via API key)
**Priority:** Medium
**Precondition:** An existing ticket.

**Steps:**
1. `GET` the ticket's conversations/replies list
2. `POST` a new reply via the API

**Expected Result:**
- The list reflects existing replies; the new reply appears both via the API and in the UI, with the same side effects as a UI-driven reply (status change, SLA pause) where applicable

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PARTIAL FAIL — filed as BUG-HLP-058.** On ticket #301 (real support level, real SLA history): `GET /tickets/301/conversations` → `200`, 2 existing entries, matching the "Helpdesk Conversion (2)" tab already shown in the UI. `POST /tickets/301/conversations {note: "...", is_private: false}` → `201`, `{"message":"Reply added successfully."}` (field name is `note`, not `body` — confirmed via a first attempt's `400 "note cannot be blank"` error). The SLA side effect genuinely worked: the SLA Activity Log gained a real new entry, "✓ First Response Given ... Customer notified · Resolution deadline: 09/16/2026 10:25 AM (UTC)". But the reply's own visibility is backwards: the Helpdesk Conversion tab stayed at exactly "(2)" — unchanged — while the reply appeared instead as a plain Note under the standard Notes tab, the opposite of the established BUG-HLP-015 rule (a genuine agent reply should be excluded from Notes and logged to Conversion instead). See `bugs/open/BUG-HLP-058.md`.

---

### TC-HLP-271: SLA status — show, pause, resume, escalate via the REST API

**User Role:** Agent (via API key)
**Priority:** Medium
**Precondition:** A ticket with an active SLA.

**Steps:**
1. `GET` the ticket's SLA status
2. `POST` pause, then `POST` resume
3. `POST` escalate

**Expected Result:**
- Each action succeeds and is reflected in the ticket's SLA Information panel in the UI afterward — API-driven SLA state changes are not a separate, disconnected state from the UI's

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** `GET /tickets/301/sla_status` → `200`, full real JSON (status, sla, current_support_level, deadlines, breach flags). `pause`/`resume` are `PATCH`, not `POST` (confirmed via the Swagger spec after an initial `POST` attempt correctly 404'd — my own method mistake, not a plugin bug): `PATCH /tickets/301/sla_status/pause` → `200`, `status: "paused"`; `PATCH .../resume` → `200`, `status: "active"`. `POST /tickets/301/sla_status/escalate` → `422` `"No escalation target configured for the current support level"` — correct, since #301 is already at L3 (the top level) with nowhere to escalate to. Re-tested `escalate` on ticket #92 (confirmed at L1 via its own `sla_status` GET first) → `200`, `current_support_level` genuinely changed to "L2 - Helpdesk Support". Verified via UI on #92's SLA Information tab: SLA Journey shows a real new "Escalated → L2 - Helpdesk Support ... Reason: Manual Escalation" entry — API-driven state is the same state the UI reads, not a disconnected shadow state.

---

### TC-HLP-272: Full CRUD on Organizations and SLAs via the REST API matches UI behavior

**User Role:** Admin or Agent with `manage_helpdesk` (via API key)
**Priority:** Medium
**Precondition:** Valid API key.

**Steps:**
1. Create, read, update, and delete/deactivate an Organization via the API
2. Repeat for an SLA (including its `toggle active` and `history` endpoints)

**Expected Result:**
- Every operation succeeds, and the results are visible/consistent in the corresponding UI screens (e.g. an API-created SLA appears in the project's SLA tab)

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Organization body is nested under an `"organization"` root key (per the Swagger spec — distinct from tickets' flat shape, correctly documented per-endpoint, not an inconsistency): `POST /organizations {organization:{name,...}}` → `201`, id 19; `GET /organizations/19` → `200`, same data; `PATCH /organizations/19 {organization:{notes:"..."}}` → `200`, notes updated; `PATCH /organizations/19/toggle_active {active:false}` → `200` (this one action takes a flat top-level `active` boolean, confirmed via the spec after an initial `nil`-value 400) → `200`, then toggled back to `true` → `200`. Verified in UI: `/rf_organizations` list shows "API Test Org TC192" exactly as created. SLA is flat top-level (per spec): `POST /slas {name, first_response_time, ..., working_days_array:[...]}` → `201` id 33 (no `project_id`, so correctly absent from any project's own SLA tab — a global/unassigned SLA); `GET/PATCH/toggle_active/history` all `200` with correct data, `history` returning real audit rows (`active: true→false`, `description` change) with the acting user. Re-created a second SLA with `project_id: 1` (id 34) → verified it appears in `/projects/helpdesk-qa-alpha/helpdesk/sla`'s own list exactly as "API Test SLA TC192 Project-Scoped" — API-created records are genuinely the same records the UI reads, not a disconnected store.

---

### TC-HLP-273: `process_macros` substitutes correctly against a real ticket via the API

**User Role:** Agent (via API key)
**Priority:** Low
**Precondition:** A canned response containing macros; a real ticket.

**Steps:**
1. Call the `process_macros` endpoint with the canned response's body and the target ticket

**Expected Result:**
- Returns the body with every macro substituted with real values, matching what the UI would produce (TC-HLP-002)

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** `POST /canned_responses/9/process_macros {issue_id: 301}` → `200`, `{"data":{"canned_response_id":9,"original_content":"...","processed_content":"Hi Vikram Reddy,\n\nWe're closing ticket ##301 (\"Webhook retries firing twice for the same event\") as resolved...\nThanks,\nClaire Dubois - NovaCrest Support"}}`. All macros substituted with real ticket #301 data (customer, subject, assignee). The doubled `##301` is not a defect: `{{ticket_id}}` itself expands to `#301` (leading `#` included), exactly matching `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-002's own established/confirmed convention (`{{ticket_id}}` → `#1042`-style) — this canned response's own template text happened to write a literal `#` immediately before the macro (`"ticket #{{ticket_id}}"`), so the doubled hash is a template-authoring artifact, not an API/macro-engine bug. Substitution logic is identical between the UI's Reply-box macro insertion and this API endpoint.

---

### TC-HLP-274: `sla_analytics` returns the SLA report as JSON matching the UI

**User Role:** Agent (via API key)
**Priority:** Medium
**Precondition:** Same dataset as TC-HLP-263.

**Steps:**
1. Call the `sla_analytics` API endpoint with the same date range/filters as TC-HLP-263

**Expected Result:**
- The JSON figures (compliance %, breach counts, etc.) match what the SLA Analytics UI tab shows for the same filters

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** `GET /sla_analytics` (no filters, defaults to the last 30 days per the Swagger spec) → `200`: `total_breaches: 47`, `resolution.compliance_pct: 66.3` (55/83) — both exactly match TC-HLP-263's UI figures verbatim ("Total Breaches 47", "Resolution SLA 66.3% (55/83 met)"). `total_tickets: 320` (vs. TC-183's 319) and `response.compliance_pct: 71.2`/`47/66 met` (vs. TC-183's `70.8%`/`46/65 met`) both drifted by exactly +1, fully explained by this same session's own intervening TC-HLP-270/191 API testing (the `conversations` reply on #301 triggered one real "First Response Given" event, and the ticket itself already existed) — not an unexplained discrepancy. Re-ran with an explicit wide date range (`2020-01-01`..`2026-12-31`) and got identical figures, confirming the default 30-day window already covers this dataset. `breach_by_priority`/`breach_by_project` arrays match the UI's own tables row-for-row (Normal 290/44, Helpdesk QA Alpha 83/20, etc.).

---

### TC-HLP-275: `/helpdesk/swagger` loads for an administrator and "Try it out" works

**User Role:** Administrator
**Priority:** Medium
**Precondition:** REST API enabled.

**Steps:**
1. Open `/helpdesk/swagger`
2. Pick an endpoint, use **Try it out**, execute a real request

**Expected Result:**
- The Swagger UI loads with full endpoint documentation
- Executing a request via "Try it out" returns a real, correct response

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** `/helpdesk/swagger` loads a full interactive Swagger UI (all endpoint groups documented: Tickets, Conversations, SLA Status, Organizations, SLAs, Canned Responses, SLA Analytics, etc.), served from `/helpdesk/swagger_spec` which itself required the real admin session (not just an API key — a plain `fetch` with only the API key header, no session cookie, got back the ordinary Redmine HTML shell instead of the OAS JSON — relevant context for TC-HLP-280 below). Expanded `GET /tickets`, clicked **Try it out**: first execution attempt (no auth applied yet) correctly got a real `401` back from the live server, proving Swagger's own session cookie isn't itself sufficient for the actual API endpoints — only the documented `X-Redmine-API-Key` header is. Used the **Authorize** dialog's `ApiKeyHeader` field with the admin key, re-executed: real **200**, curl command shown as `curl -X 'GET' 'http://localhost:3012/helpdesk/api/v1/tickets?page=1&per_page=25' -H 'accept: application/json'`, and the Response body panel showed genuine live data — 25 real tickets (ids 326 down to 301, real subjects/authors/assignees/custom fields) plus `meta: {total_count:320, page:1, per_page:25, total_pages:13}` — not a mocked/static example. "Try it out" is a real, working request executor, not just documentation.

---

## Negative Cases

---

### TC-HLP-276: The REST API refuses a request with no or an invalid API key

**User Role:** N/A (unauthenticated)
**Priority:** High
**Precondition:** None.

**Steps:**
1. `GET /helpdesk/api/v1/tickets` with no `X-Redmine-API-Key` header and no `?key=` param
2. Repeat with an invalid/garbage key value

**Expected Result:**
- Both requests are refused (401/403), returning no ticket data

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** `GET /tickets` with no `X-Redmine-API-Key` header and no `?key=`/`?api_key=` param, called with `credentials:'omit'` so no session cookie leaked in either → `401` `{"error":"Unauthorized. Provide a valid X-Redmine-API-Key header.","hint":"Obtain your key from My Account → API access key in Redmine."}`. Repeated with a garbage key value (`garbage-invalid-key-12345`) → identical `401`/same error body — an invalid key is treated the same as no key, not leaked into some intermediate state. No ticket data returned in either case.

---

### TC-HLP-277: Exporting a report is refused for a role without `export_helpdesk_reports`

**User Role:** Agent whose role has `view_helpdesk` but not `export_helpdesk_reports`
**Priority:** Medium
**Precondition:** Viewing any report tab.

**Expected Result (after attempting Export):**
- The Export action is refused or hidden entirely — no file is produced

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **investigated in full — no reachable "view but no export" tier exists; root cause filed as BUG-HLP-057.** This TC's own precondition ("role has `view_helpdesk` but not `export_helpdesk_reports`") assumes there's a tier that can view Reports but be refused Export specifically. Tested the actual permission space directly: reconfigured the reusable "Permission Test Role" to exactly `view_helpdesk` + `export_helpdesk_reports` (no `manage_helpdesk`), assigned to `perm.test.agent` on Helpdesk QA Alpha — no Reports link anywhere in her UI, and a direct navigation to `/rf_helpdesk/reports/tickets` returned a genuine 403. So a user with `export_helpdesk_reports` granted still can't reach Reports at all — there's no "sees it, can't export" state to test; the whole page is unreachable first. Cross-checked the other direction: `manage_helpdesk` alone (no `export_helpdesk_reports`, confirmed via the role's own checked-checkbox values) already grants full view AND export access. Conclusion: `export_helpdesk_reports` has zero effect in either direction — it's a vestigial, non-functional permission, filed as **BUG-HLP-057**. This TC cannot be executed as originally scoped since its precondition doesn't correspond to any real, reachable permission state on this instance.

---

### TC-HLP-278: The REST API enforces the UI's admin-only rule on Email Config

**User Role:** Manager with `manage_helpdesk` but not an administrator (via API key)
**Priority:** High
**Precondition:** Valid API key for this non-admin user.

**Steps:**
1. Attempt `POST`/`PUT` to the Email Config endpoint for a project

**Expected Result:**
- Refused (403) — the API enforces the same admin-only restriction the UI applies (§3.6), it does not provide a bypass

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Using `manage.helpdesk.test`'s own API key (non-admin, "Agent ManageHelpdesk Test" role — real `manage_helpdesk`, confirmed working for Reports in BUG-HLP-057's own evidence) against `/helpdesk/api/v1/projects/1/email_config` (path confirmed first via the admin key, which got a real `200` with genuine SMTP config data): `GET` → `403` (empty body); `PATCH {smtp_server:"evil.example.com"}` → `403` (empty body) — no partial success, no data leaked, no config mutated. The API enforces the same admin-only rule as the UI; `manage_helpdesk` alone is not a bypass.

---

### TC-HLP-279: The REST API enforces customer data isolation

**User Role:** Client (Customer, via API key, if customers have API access — otherwise verify the key is refused entirely)
**Priority:** High
**Precondition:** Two customers, each with their own tickets.

**Steps:**
1. Using Customer A's API key, request Customer B's ticket by ID
2. Request the general tickets list

**Expected Result:**
- Customer A cannot retrieve Customer B's ticket
- The tickets list, if accessible at all, contains only Customer A's own tickets — matching the UI's restricted customer view (`HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md` TC-HLP-407)

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **investigated in full — cannot be executed as scoped; root cause filed as BUG-HLP-059.** `alpha.customer`'s own `/my/account` has no "API access key" section at all (present side-by-side for `admin` and for the Agent-role `manage.helpdesk.test`), and `/my/api_key` silently redirects away instead of revealing/generating a key — customers have no self-service way to obtain a key. Tried the documented fallback (session-cookie auth, listed in the Swagger spec's own `info.description` as a valid auth method): `alpha.customer`'s real logged-in session (`credentials:'include'`) got `401 "Unauthorized. Provide a valid X-Redmine-API-Key header."` on her own ticket #1, ticket #301, and the tickets list — all three refused identically. To rule out a customer-specific restriction, retested the exact same session-only call as full **admin** (a real, valid, active session) → same `401` on all endpoints; the identical admin account's API key (header or `?key=` query param) works normally (`200`) on the same URLs. So session-cookie auth is universally broken for every role on these endpoints, not customer-specific — filed as **BUG-HLP-059**. Net effect: there is no way for any customer to invoke the API at all on this instance, so the isolation question this TC asks (does Customer A's key leak Customer B's ticket) has no real key to test with — the TC's own "otherwise verify the key is refused entirely" fallback is satisfied in the strongest possible sense (refused before a key can even exist), but this cannot be called a clean PASS since the underlying access model itself is broken, not intentionally locked down.

---

### TC-HLP-280: `/helpdesk/swagger` is refused for a non-administrator

**User Role:** Agent with `manage_helpdesk` but not an administrator
**Priority:** High
**Precondition:** REST API enabled.

**Steps:**
1. Attempt to open `/helpdesk/swagger`

**Expected Result:**
- Access is refused — this page is admin-only regardless of helpdesk role, same as the UI's email configuration rule

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** As `manage.helpdesk.test` (real `manage_helpdesk`, not an administrator), navigating directly to `/helpdesk/swagger` returned a genuine **403 Forbidden** (page title "403 - Redmine", HTTP status 403) — not a hidden link, an actual refused page load. The underlying `/helpdesk/swagger_spec` JSON endpoint gave the same real `403` when fetched with this user's own session. Confirms swagger docs are gated on Redmine admin status specifically, exactly like the Email Configuration rule in TC-HLP-278 — `manage_helpdesk` does not grant access to either.

---

## Edge Cases

---

### TC-HLP-281: SLA Analytics' breached-tickets list matches tickets actually breached

**User Role:** Agent
**Priority:** Medium
**Precondition:** A known set of tickets deliberately breached during `HELPDESK_SLA_ESCALATION.md` testing.

**Steps:**
1. Cross-check the SLA Analytics tab's "recent breached tickets" list against the actual set of tickets breached earlier in the SLA suite

**Expected Result:**
- Every ticket known to have breached appears in this list; no phantom entries for tickets that never breached

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** SLA Analytics' "Breached Tickets (Recent 20)" table's top rows are exactly the named fixture tickets deliberately breached during earlier SLA-suite testing this engagement: `#83 "BUG-HLP-019 retest escalation breach-type ticket"`, `#79 "BUG-HLP-024 retest L1-on-L2 assignment ticket"`, `#78 "BUG-HLP-033 retest ticket - list vs panel SLA status..."`, `#77`/`#76 "BUG-HLP-034 retest ticket A/B - multi-agent L3 escalation"` — all shown with `Response SLA: Breached`, matching their known purpose-built breach state. No unrelated/never-breached ticket appeared ahead of these in the list.

---

### TC-HLP-282: Report charts render without getting stuck on a loading animation

**User Role:** Agent
**Priority:** Low
**Precondition:** Any report tab with data.

**Steps:**
1. Load a report tab and observe the chart area

**Expected Result:**
- Charts render their final state promptly — no indefinite loading spinner left on screen (regression check against a known past bug class)

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** Navigated fresh to the SLA Analytics tab (`/rf_helpdesk/reports/sla`) as admin — the accessibility snapshot taken immediately after navigation already shows the full final page content (all figure headings, the "Weekly Compliance Trend" chart heading, and the complete "Breached Tickets (Recent 20)" table with real rows) with no "loading"/spinner text present anywhere in the tree. Consistent with TC-HLP-263/184's own prior confirmation that every report tab loads its full real dataset directly — no stuck-loading regression observed.

---

### TC-HLP-283: REST API list counts are consistent with the UI's own counts under the same filter

**User Role:** Agent (via API key and UI, same session)
**Priority:** Medium
**Precondition:** A known filtered ticket set.

**Steps:**
1. Apply a filter in the UI ticket list, note the total count
2. Make the equivalent filtered request via the REST API

**Expected Result:**
- The API's returned count/list matches the UI's count exactly — no drift between the two access paths

CONFIRMED LIVE 2026-09-11 (Local, redmine-docker-6): **PASS.** UI: `/projects/helpdesk-qa-alpha/helpdesk/tickets` header reads "Helpdesk QA Alpha · 83 tickets". API with the equivalent filter: `GET /tickets?project_id=1&per_page=1` → `meta: {total_count: 83, ...}` — exact match, no drift between the two access paths for the same real filter.

---

## Evidence Map

- Case ID: TC-HLP-261 – TC-HLP-283
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- Independently re-testing full CRUD via the REST API for every remaining entity (Customers, Project customers, Support levels, Products, Holidays, Canned responses, Prepaid support hours) — each follows the same pattern already exercised in TC-HLP-269/192; only sampled here, not exhaustively repeated per entity.
- Running background jobs by hand via their rake tasks and confirming parity with the scheduled run — belongs to the Rake Tasks suite (feature #54).
