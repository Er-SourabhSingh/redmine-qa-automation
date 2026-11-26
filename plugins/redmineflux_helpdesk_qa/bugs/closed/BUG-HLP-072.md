# BUG-HLP-072

- Bug ID: BUG-HLP-072
- Production Redmine Issue ID: #129406 (assigned to Vaishnavi Bhawsar, linked as defect on Run #690 / Test Suite #19 / Testcase #129403)
- Title: `GET /helpdesk/api/v1/dashboard` always returns 500 Internal Server Error — `DashboardController#show` calls a `prepare_dashboard_details` method that is never defined anywhere in the plugin
- Redmine version: 6 (local Docker, `helpdesk-redmine6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: `development` branch, commit `5fa0d9e` (fresh pull, 2026-11-25)
- Environment: Local (`http://localhost:3019`, container `helpdesk-redmine6-redmine-1`)
- Browser: N/A (server-side REST API)
- User role: Administrator (API key)
- Date: 2026-11-25

## Steps to reproduce

1. Enable REST API web service (Administration › Settings › API) if not already on.
2. Obtain a valid API key for any user that can read the dashboard (admin, or a user with `manage_helpdesk`).
3. `GET http://localhost:3019/helpdesk/api/v1/dashboard` with header `X-Redmine-API-Key: <valid key>` (global dashboard, no `project_id`).
4. Also tried: `GET .../dashboard?project_id=1` (project-scoped) — same result.

## Expected result

Per issue #129343 ("New JSON APIs for dashboard, reports, customer import, settings, support package, and knowledgebase files — for MCP Server/Crux. No screen changed.") and the controller's own doc comment, this endpoint should return the Helpdesk Dashboard as JSON — KPI cards, tickets by status/priority, top organizations, agent workload, SLA summary, directory counts, and recent tickets — mirroring what the `/helpdesk` screen shows.

## Actual result

Every call returns a genuine `HTTP 500 Internal Server Error` (empty JSON body `{"status":500,"error":"Internal Server Error"}`), for every caller and in every mode (global and project-scoped) — this is unconditional, not an edge case. The sibling new endpoints added in the same feature (`GET /helpdesk/api/v1/reports/:kind`, `GET /helpdesk/api/v1/settings`) both work correctly and return real, UI-matching data, so this is isolated to the dashboard endpoint specifically.

Root-caused via source and server log: `app/controllers/api/v1/dashboard_controller.rb:60` calls `prepare_dashboard_details(issues)`, which the class's own doc comment says should come from `RfHelpdeskController` (`DashboardController < ::RfHelpdeskController`). A full search of the plugin (`grep -rn "def prepare_dashboard" --include="*.rb" .`) finds **no definition of this method anywhere** — not in `RfHelpdeskController`, not in any concern/helper/lib file. The method the API controller depends on for every `@tickets_by_status`/`@tickets_by_priority`/`@top_organizations`/`@agent_workload`/`@sla_*`/`@recent_tickets`/`@customers_count` etc. instance variable it renders simply does not exist.

## Evidence

### Console / log

```
F, [2026-11-25T10:07:40.857120 #1] FATAL -- : [69699451-cce3-4142-9f49-835b2a1f8d7e]
[69699451-cce3-4142-9f49-835b2a1f8d7e] NoMethodError (undefined method `prepare_dashboard_details' for an instance of Api::V1::DashboardController):
[69699451-cce3-4142-9f49-835b2a1f8d7e]
plugins/redmineflux_helpdesk/app/controllers/api/v1/dashboard_controller.rb:60:in `show'
lib/redmine/sudo_mode.rb:78:in `sudo_mode'
```

Confirmed via direct grep across the entire plugin source: zero matches for `def prepare_dashboard` anywhere.

For contrast, the two sibling endpoints added in the same feature both work correctly in the same session, same request pattern, same API key:

```
GET /helpdesk/api/v1/reports/tickets  -> HTTP 200, real JSON matching UI (by_status/by_priority/by_project/daily_trend)
GET /helpdesk/api/v1/settings         -> HTTP 200, real JSON (notify_customer_status_ids, statuses[], allow_private_mail_hosts)
```

Also separately observed in the same pass (noted here, not filed as its own bug pending confirmation it's intentional): `GET /helpdesk/api/v1/settings` returned `HTTP 200` with a real, non-empty body even when called with **no API key at all** (`Current user: anonymous` in the server log) — worth a second look at whether this endpoint is meant to be public/unauthenticated or is missing its `accept_api_auth`/auth-required guard.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` and `bugs/_duplicates.md`).
- Existing bug reference (if duplicate): —

## Retest — 2026-11-26, Local (helpdesk-redmine6, localhost:3019)

- **Context**: pulled `development` branch commit `6554adc` ("Fix dashboard API error and missing auto-close emails"), fast-forward from `5fa0d9e`, `bundle check` confirmed no new gems needed, container restarted to load the new code.
- **Steps**: logged in as admin, fetched the real API key from My account, navigated directly to `http://localhost:3019/helpdesk/api/v1/dashboard?key=<admin key>`.
- **Result**: genuine `HTTP 200` with a full, well-formed JSON body — `cards` (Unassigned/Open/On Hold/SLA Breached/Resolved), `tickets_by_status`, `tickets_by_priority`, `top_organizations`, `agent_workload`, `sla` summary, `directory` counts (customers/organizations/products), and `recent_tickets` with real ticket data — matching exactly what the bug's own Expected Result described. No 500, no error body.
- **Verdict: RETEST PASS.** Closing.

## Closed — 2026-11-26

- Closed per explicit user confirmation, following the clean retest above.
