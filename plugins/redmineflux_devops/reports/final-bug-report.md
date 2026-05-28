# Final Bug Report — Redmineflux DevOps

> Generated from bugs/open/ and bugs/QA/. PDF only on explicit user request.

## Summary

| Total Open | Critical | High | Medium | Low |
|------------|----------|------|--------|-----|
| 40         | 0        | 26   | 12     | 2   |

> **History:** 77 bugs filed across Suites 01–11. 37 FIXED and moved to bugs/closed/. BUG-RDV-006 closed as Invalid. 38 remain open (listed below; BUG-RDV-028 not testable).
>
> **Session 13 retest (2026-05-26, Local fresh instance):** 22 bugs confirmed FIXED.
> **Session 14 retest (2026-05-26, Forge flux-fujhcd9zj49):** 15 additional bugs confirmed FIXED.
> **Suite 06 run (2026-05-28, Local):** 2 new bugs found: BUG-RDV-047, BUG-RDV-048.
> **Suite 07 run (2026-05-28, Local):** 3 new bugs found: BUG-RDV-049, BUG-RDV-050, BUG-RDV-051.
> **Suite 08 run (2026-05-28, Local):** 4 new bugs found: BUG-RDV-052, BUG-RDV-053, BUG-RDV-054, BUG-RDV-055.
> **Suite 09 run (2026-05-28, Local):** 4 new bugs found: BUG-RDV-056, BUG-RDV-057, BUG-RDV-058, BUG-RDV-059.
> **Suite 10 run (2026-05-28, Local):** 12 new bugs found: BUG-RDV-060 through BUG-RDV-071.
> **Suite 11 run (2026-05-28, Local):** 6 new bugs found: BUG-RDV-072 through BUG-RDV-077.
> **Suite 12 run (2026-05-28, Local):** 1 new bug found: BUG-RDV-078.
> **Suite 13 run (2026-05-28, Local):** 1 new bug found: BUG-RDV-079.
> **Suite 14 run (2026-05-28, Local):** 0 new bugs found. All issues reference pre-existing open bugs.

## Environment

- Plugin: redmineflux_devops
- Redmine Version: 6.0.9
- Environments tested: Local Docker (http://localhost:3008), Forge (https://flux-fujhcd9zj49.forge.zehntech.com)
- Suites executed: tc-01 through tc-14
- Total TCs executed (all sessions): 560 | Pass: ~238 | Partial: ~82 | Blocked: ~240

---

## Open Bugs

### BUG-RDV-009 — [HIGH] DORA metrics REST endpoint returns 404 — route not implemented

- **Suite:** 02 (DORA & Flow Metrics) | **Env:** Forge (confirmed), Local (not retested)
- `GET /devops/metrics/dora.json` returns 404. Route absent from plugin routing table. All DORA metric TCs blocked.
- **File:** bugs/QA/BUG-RDV-009.md

---

### BUG-RDV-011 — [HIGH] Webhook event log accessible to users with only view_devops — manage_devops_settings not enforced

- **Suite:** 01 (Webhook Receiver) | **Env:** Local + Forge
- `/projects/<id>/devops_webhooks` returns HTTP 200 for users with only `view_devops`. The controller uses the wrong permission check. `manage_devops_settings` should be required.
- **File:** bugs/QA/BUG-RDV-011.md

---

### BUG-RDV-017 — [HIGH] PR Review Dashboard and Commits page return HTTP 200 to users without view_devops permission

- **Suite:** 02 (SCM Integration) | **Env:** Local + Forge
- `/projects/<id>/devops_pull_requests` and `/projects/<id>/devops_commits` return 200 with full data to non-members and users lacking `view_devops`. Before_action permission guard absent from both controllers.
- **File:** bugs/QA/BUG-RDV-017.md

---

### BUG-RDV-026 — [HIGH] JUnit ingestion endpoint returns 422 — missing rexml XML parser gem dependency

- **Suite:** 03 (CI/CD & Build Management) | **Env:** Local (confirmed 2026-05-28)
- `POST /devops/builds/<id>/test_results` with valid JUnit XML returns HTTP 422: `{"error":"XML parser dependency missing: cannot load such file -- rexml/document","code":"parse_error"}`. All 27 JUnit-dependent test cases in Suite 06 are blocked by this bug.
- **File:** bugs/QA/BUG-RDV-026.md

---

### BUG-RDV-028 — [MEDIUM] Artifact download links section shows no artifacts for completed builds

- **Suite:** 03 (CI/CD & Build Management) | **Env:** Local + Forge (NOT TESTABLE — no real CI artifact data)
- Build detail pages show "No artifacts available for this build." GitHub Actions artifact API integration not implemented. Cannot be properly retested without real CI pipelines.
- **File:** bugs/QA/BUG-RDV-028.md

---

### BUG-RDV-029 — [HIGH] Pipeline stage breakdown not implemented — no stages section on build detail page

- **Suite:** 03 (CI/CD & Build Management) | **Env:** Local + Forge
- No "Pipeline Stages" section on any build detail page. `BuildStageIngestor` service not present. Blocks TC-RDV-125, 126, 144, 148.
- **File:** bugs/QA/BUG-RDV-029.md

---

### BUG-RDV-035 — [HIGH] No issue-deployment linkage on deployment detail or issue pages

- **Suite:** 04 (Deployments) | **Env:** Local + Forge
- Deployment detail page has no "Issues Included" section. Redmine issue pages show no deployment badge or sidebar widget. Feature described in rfd-014 not implemented.
- **File:** bugs/QA/BUG-RDV-035.md

---

### BUG-RDV-047 — [HIGH] Test duration monitoring REST endpoint returns 404 — route not implemented

- **Suite:** 06 (Test Results & Quality) | **Env:** Local (2026-05-28)
- `GET /projects/phoenix-platform/devops/test_duration_stats.json` returns 404 for both authenticated and unauthenticated requests. All alternate URL patterns also return 404. Route absent from routing table. Blocks TC-RDV-273, 274, 275, 285.
- **File:** bugs/open/BUG-RDV-047.md

---

### BUG-RDV-048 — [HIGH] Test coverage tracking feature not implemented — no coverage page, webhook, or trend widget

- **Suite:** 06 (Test Results & Quality) | **Env:** Local (2026-05-28)
- No dedicated Coverage page or widget exists in the DevOps section. `codecov` provider returns 404 "provider not found" on webhook POST. All coverage URL patterns return 404. The rfd-021 Test Coverage Tracking feature is entirely absent. Blocks TC-RDV-262, 263, 279, 287.
- **File:** bugs/open/BUG-RDV-048.md

---

### BUG-RDV-049 — [MEDIUM] DORA metric cards show classification badges and "0" instead of "N/A" when no deployment or incident data exists

- **Suite:** 07 (DORA & Flow Metrics) | **Env:** Local (2026-05-28)
- When a project has 0 deployments (orion-api project), the Deployment Frequency card shows "0.0 low" and Lead Time shows "0 low" instead of "N/A". MTTR with 0 incidents shows "0 elite" instead of "N/A". Per rfd-022, cards should render "N/A" when no meaningful data is present. Affects TC-RDV-302 and TC-RDV-323.
- **File:** bugs/open/BUG-RDV-049.md

---

### BUG-RDV-050 — [HIGH] QA Engineer role can access DORA Metrics page — role-based access control not enforced

- **Suite:** 07 (DORA & Flow Metrics) | **Env:** Local (2026-05-28)
- The QA Engineer role does not have "View DORA Metrics" permission per the requirements matrix. However, the metrics page (`/projects/phoenix-platform/devops_metrics`) returns HTTP 200 with full DORA data (DF=0.23, LT=0h, CFR=66.7%, MTTR=0h) for `qa_user` (QA Engineer role). The plugin uses a single `view_devops` permission check — no separate DORA metrics gate is enforced. Affects TC-RDV-318.
- **File:** bugs/open/BUG-RDV-050.md

---

### BUG-RDV-051 — [MEDIUM] Dashboard shared flag update returns HTTP 200 instead of HTTP 403 when user lacks manage_devops_settings

- **Suite:** 07 (DORA & Flow Metrics) | **Env:** Local (2026-05-28)
- A Developer user (`dev_user`, no `manage_devops_settings` permission) can send a direct PATCH to update `redmineflux_devops_dashboard[shared]=1`. The server returns HTTP 200 instead of HTTP 403. The shared flag is NOT saved (data protection is correct — the value is silently ignored), but the wrong HTTP status code misleads API consumers. The edit form correctly hides the shared checkbox for unauthorized users. Affects TC-RDV-316.
- **File:** bugs/open/BUG-RDV-051.md

---

### BUG-RDV-052 — [HIGH] Auto-created incidents use "Bug" tracker instead of "Incident" tracker

- **Suite:** 08 (Monitoring & Alerting) | **Env:** Local (2026-05-28)
- Critical-severity Prometheus alerts trigger `AlertIncidentCreator` which auto-creates a Redmine issue with tracker "Bug" (ID 4) instead of "Incident" (ID 3). The "Incident" tracker exists in the Redmine instance and is confirmed via `/trackers.json`. Priority ("Urgent"), subject format ("[Incident] {alertname} on {instance}"), and description content are all correct — only the tracker is wrong. Confirmed on issues #34, #35, #37, #38. Affects TC-RDV-337, TC-RDV-370.
- **File:** bugs/open/BUG-RDV-052.md

---

### BUG-RDV-053 — [MEDIUM] Alert feed has no environment filter — only severity and status filters available

- **Suite:** 08 (Monitoring & Alerting) | **Env:** Local (2026-05-28)
- The alert feed (`/projects/phoenix-platform/devops_alerts`) provides only two filter controls: `name="severity"` and `name="status"`. No environment filter control exists. Alerts tagged with `environment: production` in the webhook payload cannot be filtered by environment in the UI. The URL param `?environment=production` has no effect on the displayed alerts. Per rfd-026 and TC-RDV-332, an environment filter is required. Affects TC-RDV-332.
- **File:** bugs/open/BUG-RDV-053.md

---

### BUG-RDV-054 — [HIGH] On-call schedule feature not implemented — no widget on any DevOps page

- **Suite:** 08 (Monitoring & Alerting) | **Env:** Local (2026-05-28)
- The rfd-093 On-Call Schedule feature (PagerDuty/Opsgenie integration with 15-minute cache and stale fallback) is entirely absent. HTML source of all DevOps pages (devops_builds, devops_environments, devops_incidents, devops_alerts) contains no reference to "on-call", "on_call", "oncall", "pagerduty", or "opsgenie". No sidebar widget, no configuration UI, and no API token storage exist. Affects TC-RDV-342, 343, 344, 345, 366 (all BLOCKED).
- **File:** bugs/open/BUG-RDV-054.md

---

### BUG-RDV-055 — [HIGH] Infrastructure resource usage gauges not implemented — no CPU/Memory/Disk on environment cards

- **Suite:** 08 (Monitoring & Alerting) | **Env:** Local (2026-05-28)
- The rfd-118 Infrastructure Resource Usage feature (Prometheus/CloudWatch/Datadog CPU/memory/disk queries per environment with color-coded gauges and 60-second per-environment cache) is entirely absent. Environment cards show only the `devops-uptime-badge` widget ("UPTIME - 30d / 90d: - / Trend: -"). No `[class*="gauge"]`, `[class*="cpu"]`, `[class*="memory"]`, or `[class*="resource"]` elements exist in the environments page HTML. Affects TC-RDV-350, 351, 352, 353, 354, 355, 368, 369 (all BLOCKED).
- **File:** bugs/open/BUG-RDV-055.md

---

### BUG-RDV-056 — [HIGH] FOSSA license ingestion stores all licenses as "NOASSERTION" / "unknown" risk regardless of payload

- **Suite:** 09 (Security & Compliance) | **Env:** Local (2026-05-28)
- FOSSA webhook is accepted (HTTP 202) but `LicenseRiskMapper` fails to extract SPDX identifier from either payload format (`dependencies[].license` or `packages[].licenses[].spdxId`). All stored records have `license_name="NOASSERTION"` and `risk_level="unknown"`. Risk-level filters (High/Medium/Low) return zero results. GPL-3.0, LGPL-2.1, MIT, Apache-2.0, BSD are all misclassified. Affects TC-RDV-395, 396, 397, 398, 399 (all FAIL).
- **File:** bugs/open/BUG-RDV-056.md

---

### BUG-RDV-057 — [HIGH] SSRF guard not implemented — private and metadata URLs accepted in sonarqube_host_url field

- **Suite:** 09 (Security & Compliance) | **Env:** Local (2026-05-28)
- The `sonarqube_host_url` field in DevOps Settings accepts and saves any URL without validation, including private IP ranges and cloud metadata endpoints (e.g., `http://169.254.169.254/latest/meta-data/`). No SSRF guard is applied. The URL is saved without error and persists on page reload. An attacker with `manage_devops_settings` permission could abuse SonarQube-triggered outbound requests to reach internal infrastructure. Affects TC-RDV-411 (FAIL).
- **File:** bugs/open/BUG-RDV-057.md

---

### BUG-RDV-058 — [HIGH] XSS payload in release description not sanitized — script executes on release detail page

- **Suite:** 09 (Security & Compliance) | **Env:** Local (2026-05-28)
- The release description field stores and renders arbitrary HTML/JS without sanitization. Entering `<script>alert('XSS')</script>` in the description and saving causes an `alert()` dialog to fire for every user who views the release detail page. This is stored XSS: any user with `view_devops` permission who opens the release is affected. The description field is not passed through Redmine's HTML allow-list sanitizer. Affects TC-RDV-412 (FAIL).
- **File:** bugs/open/BUG-RDV-058.md

---

### BUG-RDV-059 — [HIGH] Developer role can access Security Vulnerabilities page — view_security_scans permission not enforced

- **Suite:** 09 (Security & Compliance) | **Env:** Local (2026-05-28)
- `dev_user` (Developer role, ID 5) receives HTTP 200 on `/projects/phoenix-platform/devops_vulnerabilities`. Per the permissions matrix, only DevOps Engineer, Manager, and Admin have `view_security_scans`. The Developer role should receive HTTP 403. The controller does not enforce a separate `view_security_scans` permission check — it relies only on `view_devops`. This matches the pattern seen in BUG-RDV-050 (DORA Metrics page). Affects TC-RDV-415 (FAIL).
- **File:** bugs/open/BUG-RDV-059.md

---

### BUG-RDV-060 — [HIGH] Incident creation form deviates from INC-001: no standalone Title field; affected_service is sole identifier

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- The New Incident form (`/projects/phoenix-platform/devops_incidents/new`) has no standalone Title field as required by INC-001. The `affected_service` field acts as the sole incident identifier/name. The incident detail summary panel (`<dl>`) also lacks a dedicated "Affected Service:" labeled term — the value is shown only as the h2 page heading. Fields present: Severity, Status, Affected service, Started at, Linked issue, Root cause, "Create Redmine issue" checkbox. Affects TC-RDV-421, 422, 425.
- **File:** bugs/open/BUG-RDV-060.md

---

### BUG-RDV-061 — [HIGH] No dedicated "Linked Alerts" section on incident detail page

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- Incident detail pages have no dedicated "Linked Alerts" section. When an alert fires and auto-creates an incident, the alert linkage is only visible as a single timeline text entry ("Alert fired — Alert 'X' triggered incident creation"). There is no panel showing the triggering alert's source, severity, and `fired_at` timestamp as a structured section. DOM search confirms `body.includes('Linked Alert')` → false. Affects TC-RDV-426, 442.
- **File:** bugs/open/BUG-RDV-061.md

---

### BUG-RDV-062 — [HIGH] No "Add Entry" button for manual timeline entries on incident detail page

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- The incident detail page provides no mechanism for users to manually add entries to the incident timeline. No "Add Entry", "Add Note", or equivalent button exists. The timeline is append-only via system events (status changes, acknowledgements, etc.) with no user-facing control for custom entries. Affects TC-RDV-429.
- **File:** bugs/open/BUG-RDV-062.md

---

### BUG-RDV-063 — [HIGH] Incident Timeline REST API returns 404 for all URL patterns

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- All tested REST API URL patterns for fetching incident timeline entries return HTTP 404. Patterns tested: `/projects/phoenix-platform/devops_incidents/1/timeline.json`, `/devops_incidents/1/timeline.json`, `/projects/phoenix-platform/devops_incidents/1/entries.json`. The route is not defined in the plugin's routing configuration. Timeline data is only available via the UI page render. Affects TC-RDV-430, 441, 442, 456.
- **File:** bugs/open/BUG-RDV-063.md

---

### BUG-RDV-064 — [HIGH] Incidents JSON REST API returns HTTP 406 Not Acceptable

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- `GET /projects/phoenix-platform/devops_incidents.json` returns HTTP 406 Not Acceptable. The route exists but the controller action does not include a `respond_to` block for `:json` format — only HTML is rendered. Programmatic access to incident data via REST is not possible. Affects TC-RDV-437.
- **File:** bugs/open/BUG-RDV-064.md

---

### BUG-RDV-065 — [HIGH] Developer role can access New Incident form — manage_incidents permission not enforced

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- `dev_user` (Developer role, ID 5) receives HTTP 200 on `/projects/phoenix-platform/devops_incidents/new`. The Developer role does not have `manage_incidents` permission but the `new`/`create` controller actions lack the required authorization check. Consistent with the permission enforcement failures in BUG-RDV-050 (DORA Metrics) and BUG-RDV-059 (Security Vulnerabilities). Affects TC-RDV-452.
- **File:** bugs/open/BUG-RDV-065.md

---

### BUG-RDV-066 — [MEDIUM] "Assigned To" column missing from incidents list page

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- The incidents list page (`/projects/phoenix-platform/devops_incidents`) does not display an "Assigned To" column. Columns present: Affected Service, Severity, Status, Started At. Assignee information is only visible after navigating into each individual incident detail page, making it impossible to identify incident ownership at a glance. Affects TC-RDV-424.
- **File:** bugs/open/BUG-RDV-066.md

---

### BUG-RDV-067 — [MEDIUM] Deployment correlation override creates no timeline or audit entry

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- When a user manually overrides the deployment correlation on an incident ("Save Correlation" button), the Related Deployment field is updated correctly but no timeline or audit log entry is created. There is no audit trail showing who changed the deployment correlation, when, or to what value. Affects TC-RDV-433.
- **File:** bugs/open/BUG-RDV-067.md

---

### BUG-RDV-068 — [MEDIUM] Post-mortem Root Cause section shows placeholder text, not pre-filled from incident root_cause field

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- When a post-mortem wiki page is auto-generated from an incident, the Root Cause section is populated with a placeholder string rather than the `root_cause` value already entered on the incident record. Other sections (Summary, Timeline, Action Items) are correctly pre-populated from incident data. The post-mortem generation template does not interpolate the `root_cause` field. PARTIAL result — post-mortem structure is otherwise correct. Affects TC-RDV-435.
- **File:** bugs/open/BUG-RDV-068.md

---

### BUG-RDV-069 — [MEDIUM] No journal or timeline entry created after sending communication template

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- When a communication template update is sent via the incident comms modal (`/devops_incidents/{id}/comms`), the modal closes successfully but no timeline or journal entry is created on the incident. There is no audit trail showing who sent the communication, which template was used, or when. Affects TC-RDV-446.
- **File:** bugs/open/BUG-RDV-069.md

---

### BUG-RDV-070 — [MEDIUM] Blank affected_service accepted on incident creation, defaults to "Unknown Service"

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- The incident creation form accepts an empty `affected_service` value without a validation error. The incident is created with `affected_service = "Unknown Service"` (or similar default). Since `affected_service` is the sole incident identifier (per BUG-RDV-060), accepting a blank value means incidents can exist with no meaningful identifier. Affects TC-RDV-449.
- **File:** bugs/open/BUG-RDV-070.md

---

### BUG-RDV-071 — [LOW] Incidents empty state shows blank area with no informative message

- **Suite:** 10 (Incident Management) | **Env:** Local (2026-05-28)
- When no incidents exist for a project, the incidents list page displays a blank content area with no empty-state message, icon, or call-to-action. Users cannot distinguish a "no data" state from a page load failure, and there is no guidance on how to create the first incident. Affects TC-RDV-454.
- **File:** bugs/open/BUG-RDV-071.md

---

### BUG-RDV-072 — [HIGH] Environment add/edit form missing "Type" dropdown — environment_type field not rendered

- **Suite:** 11 (Environment Management) | **Env:** Local (2026-05-28)
- The Add Environment and Edit Environment forms do not include a "Type" dropdown. The `environment_type` field is absent from the rendered form HTML. Environments cannot be categorized as dev/staging/prod/custom. Auto-position ordering (rfd-032) cannot function without this field. Affects TC-RDV-461 (FAIL), TC-RDV-464 (FAIL), TC-RDV-465 (FAIL). Also blocks BUG-RDV-077 (by_type scope filtering requires the field).
- **File:** bugs/open/BUG-RDV-072.md

---

### BUG-RDV-073 — [HIGH] No "Check Now" button for manual health status trigger — health check feature absent from UI

- **Suite:** 11 (Environment Management) | **Env:** Local (2026-05-28)
- The Environments list page does not render a "Check Now" button on any environment row. No health status light (green/yellow/red) is shown. The entire manual health-trigger UI from rfd-033 is absent. Lazy polling is also unverifiable. Affects TC-RDV-468 (FAIL) and blocks TC-RDV-466, 467, 469, 470, 471, 491 (all BLOCKED).
- **File:** bugs/open/BUG-RDV-073.md

---

### BUG-RDV-074 — [HIGH] Admin has no "Override Freeze" option — active deployment freeze blocks Admin unconditionally

- **Suite:** 11 (Environment Management) | **Env:** Local (2026-05-28)
- When an active deployment freeze is in effect, the Deploy button is disabled for all users including Admin. No "Override Freeze" option appears in the deploy modal for Admin. Forcing a deploy via API returns HTTP 423 with no override path. No `freeze_override` audit log entry is ever created. Affects TC-RDV-475 (FAIL).
- **File:** bugs/open/BUG-RDV-074.md

---

### BUG-RDV-075 — [HIGH] Environment Request submission causes 500 error; no custom fields or auto-assignment

- **Suite:** 11 (Environment Management) | **Env:** Local (2026-05-28)
- Submitting an Environment Request creates a Redmine issue (Issue #40 created with tracker "Environment Request") but the issue detail page returns HTTP 500. Custom fields are empty (`custom_fields: []`). No auto-assignment occurs (`assigned_to: {}`). Navigating directly to the issue URL also returns 500. The 500 error is likely in the issue show action when rendering the "Environment Request" tracker — possibly a missing partial or custom field rendering error. Affects TC-RDV-482 (FAIL), TC-RDV-483 (PARTIAL), TC-RDV-484 (BLOCKED).
- **File:** bugs/open/BUG-RDV-075.md

---

### BUG-RDV-076 — [MEDIUM] Environment comparison endpoint returns HTTP 302 instead of 404 for non-existent/cross-project IDs

- **Suite:** 11 (Environment Management) | **Env:** Local (2026-05-28)
- The compare endpoint (`/devops_environments/compare?a=1&b=999`) returns HTTP 302 redirect when a non-existent or cross-project environment ID is supplied. The endpoint does not validate that both environment IDs exist and belong to the current project before processing. Should return HTTP 404. Affects TC-RDV-487 (FAIL).
- **File:** bugs/open/BUG-RDV-076.md

---

### BUG-RDV-077 — [LOW] REST API type filter for environments not exposed — /devops/environments.json?type= returns 404

- **Suite:** 11 (Environment Management) | **Env:** Local (2026-05-28)
- The REST API route `/projects/phoenix-platform/devops/environments.json?type=production` returns HTTP 404. The route does not exist. The existing route `/devops_environments.json` returns all environments with no type filtering support. The `by_type` and `production` named scopes defined in rfd-032 are not exposed via the API. Also related to BUG-RDV-072 (no environment_type field). Affects TC-RDV-494 (FAIL).
- **File:** bugs/open/BUG-RDV-077.md

---

### BUG-RDV-078 — [MEDIUM] Notification matrix missing 7 required DevOps event types

- **Suite:** 12 (System Settings & Notifications) | **Env:** Local (2026-05-28)
- The DevOps notification preferences matrix at `/my/devops_notifications` renders only 7 event type rows. Per rfd-101 (SYS-006), a minimum of 10 event types are required covering the full plugin scope. Missing types: `deployment_success`, `deployment_failed`, `incident_created`, `incident_resolved`, `release_published`, `alert_fired`, `security_gate_blocked`. Users cannot configure notifications for deployments, alert firing, new incident creation, incident resolution, release publishing, or security gate events. Affects TC-RDV-501 (FAIL).
- **File:** bugs/open/BUG-RDV-078.md

---

### BUG-RDV-079 — [MEDIUM] Export Release Notes (MD/HTML) returns HTTP 403 for roles without manage_releases

- **Suite:** 13 (Permissions & Roles) | **Env:** Local (2026-05-28)
- `GET /projects/phoenix-platform/devops_releases/5/export.md` and `GET /projects/phoenix-platform/devops_releases/5/export.html` return HTTP 403 for `dev_user` (Developer role, has `view_devops`, no `manage_releases`) and `qa_user` (QA Engineer role, has `view_devops` + `approve_releases`, no `manage_releases`). Export is a read-only action and should be accessible to any project member with `view_devops`. Per TC-RDV-545, export availability is spec'd as "all roles with view_devops". The controller incorrectly gates export behind `manage_releases` instead of `view_devops`. Only Manager (alice) and Admin with `manage_releases` can export. The `generate_notes` endpoint (POST) correctly returns 403 for lower roles (generate is a write action — that is correct). Only the export (read) action has the wrong permission guard. Affects TC-RDV-545 (FAIL).
- **File:** bugs/open/BUG-RDV-079.md
