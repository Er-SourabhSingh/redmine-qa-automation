# Test Cases — Monitoring & Alerting — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Monitoring & Alerting |
| **TC Range** | TC-RDV-326 to TC-RDV-370 |
| **Total TCs** | 45 |
| **Requirement Coverage** | MON-001, MON-002, MON-003, MON-004, MON-005, MON-006 |

---

### TC-RDV-326 — Alert feed displays Prometheus AlertManager alerts

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" exists with `view_devops` permission granted to the tester's role
- A Prometheus AlertManager webhook connection is configured for the project
- At least one firing alert has been sent via webhook

**Test Data:**
- Prometheus AlertManager webhook payload with `status: firing`, `severity: critical`, `alertname: HighCPUUsage`, `instance: web-01`

**Steps:**
1. Navigate to the project DevOps section: `Project > DevOps`
2. Click the "Alerts" tab in the sub-navigation bar
3. Observe the alert feed table

**Expected Result:**
- The Alerts tab loads with HTTP 200 and no errors
- The alert from Prometheus AlertManager appears in the feed with correct source label "prometheus"
- The row displays: severity badge (Critical), alert title (HighCPUUsage), source (prometheus), status (Firing), fired-at timestamp
- The alert is stored in the `redmineflux_devops_alerts` table with the correct `source` value

---

### TC-RDV-327 — Alert feed displays Zabbix alerts

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project exists with DevOps configured
- A Zabbix webhook integration is active and has sent at least one alert

**Test Data:**
- Zabbix webhook payload indicating a host trigger problem with severity "Warning"

**Steps:**
1. Send a simulated Zabbix webhook event to `POST /devops/webhook/zabbix/{project_identifier}`
2. Navigate to `Project > DevOps > Alerts`
3. Observe the alert list

**Expected Result:**
- The Zabbix alert appears in the feed with source "zabbix"
- Severity badge shows "Warning" (amber/yellow styling)
- Status shows "Firing"
- Alert title matches the Zabbix trigger name from the payload

---

### TC-RDV-328 — Alert feed displays Datadog alerts

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project exists with DevOps configured
- A Datadog webhook integration is active

**Test Data:**
- Datadog webhook payload with `alert_type: error`, `title: High Error Rate`, `severity: critical`

**Steps:**
1. Send a simulated Datadog webhook event to `POST /devops/webhook/datadog/{project_identifier}`
2. Navigate to `Project > DevOps > Alerts`
3. Observe the alert list

**Expected Result:**
- The Datadog alert appears with source "datadog"
- Severity shown as "Critical"
- Alert is listed in the feed alongside any existing Prometheus or Zabbix alerts

---

### TC-RDV-329 — Alert feed deduplicates alerts by fingerprint

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- Project with DevOps configured and alerts tab accessible
- A specific alert fingerprint has already been ingested and stored

**Test Data:**
- Two identical Prometheus AlertManager webhook payloads with the same `fingerprint` field value (e.g., `fingerprint: abc123def456`)

**Steps:**
1. Send the first webhook payload with fingerprint `abc123def456` to the webhook endpoint
2. Verify the alert appears in the feed (1 record)
3. Send the exact same payload a second time with the same fingerprint
4. Navigate to `Project > DevOps > Alerts`
5. Count the number of entries with that fingerprint

**Expected Result:**
- Only one alert record exists in the feed for fingerprint `abc123def456`
- The second webhook call does not create a duplicate entry
- The existing record may be updated (e.g., last-seen timestamp) but is not duplicated
- Database query on `redmineflux_devops_alerts` confirms a single row for that fingerprint

---

### TC-RDV-330 — Alert feed filter by severity: critical

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Alerts feed contains at least: 2 critical alerts, 1 warning alert, 1 info alert

**Test Data:**
- Mixed-severity alerts pre-seeded in `redmineflux_devops_alerts`

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Locate the severity filter control (dropdown or filter pill)
3. Select "Critical" as the severity filter
4. Observe the alert list

**Expected Result:**
- Only alerts with severity "Critical" are displayed in the feed
- Warning and Info alerts are hidden from the filtered view
- Filter selection is visually reflected (active filter state)
- Alert count in the list matches the number of critical alerts

---

### TC-RDV-331 — Alert feed filter by severity: warning

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Alerts feed contains alerts of all severities

**Test Data:**
- At least 2 Warning-severity alerts in the feed

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Apply severity filter "Warning"
3. Observe the feed

**Expected Result:**
- Only Warning-severity alerts are displayed
- Critical and Info alerts are not shown
- The filter is applied without page reload (or page reloads and reflects filter)

---

### TC-RDV-332 — Alert feed filter by environment

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Alerts from multiple environments (e.g., staging, production) exist in the feed
- Alerts have been tagged with environment labels in the webhook payloads

**Test Data:**
- 3 alerts tagged with environment "production", 2 alerts tagged with "staging"

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Apply environment filter "production"
3. Observe the filtered alert list

**Expected Result:**
- Only alerts associated with the "production" environment are displayed
- Staging alerts are not shown
- Removing or clearing the filter restores all alerts

---

### TC-RDV-333 — Alert feed shows firing and resolved alerts with duration

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- At least one alert in "firing" status (no resolved_at)
- At least one alert in "resolved" status (has resolved_at timestamp)

**Test Data:**
- Firing alert: fired_at = 2 hours ago, resolved_at = null
- Resolved alert: fired_at = 5 hours ago, resolved_at = 4 hours ago

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Observe the alert feed table rows for both alerts
3. Check the Status column and any duration display

**Expected Result:**
- Firing alert shows status "Firing" with elapsed duration (e.g., "2h 0m")
- Resolved alert shows status "Resolved" with a total duration (e.g., "1h 0m")
- Resolved_at timestamp is displayed for resolved alerts
- Visual distinction exists between firing and resolved rows (e.g., color coding)

---

### TC-RDV-334 — Alert entry provides link to open upstream tool

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- An alert exists in the feed that was ingested with an `alert_url` pointing to the source monitoring tool

**Test Data:**
- Alert with `alert_url: https://alertmanager.example.com/alerts?alertname=HighCPUUsage`

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Locate an alert row with a source link/button
3. Click the link/button to open the upstream tool

**Expected Result:**
- A clickable link (or button) labeled with the upstream tool name or an external link icon is present on the alert row
- Clicking the link navigates to the `alert_url` (opens in new tab)
- The link destination matches the `alert_url` stored on the alert record

---

### TC-RDV-335 — Alert summary bar shows correct firing, critical, and resolved counts

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Alerts table contains: 3 firing alerts, 2 of which are critical; 4 alerts resolved within the current calendar day

**Test Data:**
- `redmineflux_devops_alerts` seeded with 3 firing + 4 resolved-today records

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Observe the summary bar at the top of the Alerts tab (above the alert list)

**Expected Result:**
- Summary bar displays "3 Firing"
- Summary bar displays "2 Critical"
- Summary bar displays "4 Resolved Today"
- Numbers match actual database state
- Manual test reference H2 validated

---

### TC-RDV-336 — Critical alert auto-creates incident issue

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-027 — Alert Auto-Create Incident |
| **Requirement Ref** | MON-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project has DevOps configured with auto-incident threshold set to "critical"
- The "Incident" tracker exists in the Redmine project
- Webhook endpoint is reachable

**Test Data:**
- Prometheus AlertManager payload: `severity: critical`, `alertname: DatabaseDown`, `status: firing`

**Steps:**
1. Send a critical-severity alert webhook to `POST /devops/webhook/prometheus/{project_identifier}`
2. Navigate to `Project > DevOps > Incidents`
3. Also check `Project > Issues` filtered by tracker "Incident"

**Expected Result:**
- A new Redmine issue is automatically created with tracker "Incident"
- Issue priority is set to "Urgent"
- Issue subject is pre-filled with the alert title/name (e.g., "DatabaseDown")
- Issue description contains alert details from the payload (source, severity, description, fired_at)
- The alert record in `redmineflux_devops_alerts` is linked to the created incident

---

### TC-RDV-337 — Auto-created incident has correct tracker and priority

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-027 — Alert Auto-Create Incident |
| **Requirement Ref** | MON-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Critical alert auto-incident creation is enabled
- "Incident" tracker and "Urgent" priority exist in the Redmine instance

**Test Data:**
- Critical-severity Prometheus alert payload

**Steps:**
1. Trigger a critical alert via webhook
2. Open the auto-created issue from the Incidents list
3. Inspect the Tracker and Priority fields

**Expected Result:**
- Issue Tracker field = "Incident"
- Issue Priority field = "Urgent"
- No manual intervention was required to set these values
- The auto-creation is performed by the `AlertIncidentCreator` service

---

### TC-RDV-338 — Alert below configured threshold does not auto-create incident

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-027 — Alert Auto-Create Incident |
| **Requirement Ref** | MON-002 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Auto-incident threshold is configured to "critical" (only critical alerts trigger auto-creation)
- No existing incidents in the project

**Test Data:**
- Prometheus AlertManager payload: `severity: warning`, `alertname: HighMemoryUsage`

**Steps:**
1. Send a warning-severity alert webhook to the project
2. Wait 30 seconds
3. Check `Project > DevOps > Incidents` and `Project > Issues` (Incident tracker filter)

**Expected Result:**
- No new Redmine issue with tracker "Incident" is created
- The warning alert appears in the alert feed but does not trigger auto-incident creation
- The `AlertIncidentCreator` service correctly evaluates the threshold condition and skips creation

---

### TC-RDV-339 — Auto-created incident is pre-filled with alert details

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-027 — Alert Auto-Create Incident |
| **Requirement Ref** | MON-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Critical alert auto-incident creation is enabled

**Test Data:**
- Alert payload: `alertname: APILatencyHigh`, `severity: critical`, `description: P99 latency exceeded 2000ms`, `instance: api-server-01`, `fired_at: 2026-05-21T10:00:00Z`

**Steps:**
1. Send the critical alert webhook
2. Open the auto-created Incident issue
3. Inspect the issue description and custom fields

**Expected Result:**
- Issue subject includes the alert name: "APILatencyHigh" or similar
- Issue description includes: alert source, severity, description text, instance identifier, and fired_at timestamp
- Affected service or instance information is captured in the issue body
- No data from the alert payload is silently discarded

---

### TC-RDV-340 — Uptime dashboard shows 30-day uptime percentage

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-092 — Uptime Dashboard |
| **Requirement Ref** | MON-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `redmineflux_devops_health_samples` table contains health check samples spanning at least 30 days
- UptimeCalculator service is active

**Test Data:**
- 30 days of health samples: 720 total samples, 716 healthy (up), 4 failed (down)
- Expected 30-day uptime: approximately 99.4%

**Steps:**
1. Navigate to `Project > DevOps` or the project DevOps dashboard widget area
2. Locate the Uptime Dashboard widget or section

**Expected Result:**
- 30-day uptime percentage is displayed (e.g., "99.4%")
- The value is computed by `UptimeCalculator` from the `health_samples` table
- The figure is labeled "30-day uptime" or equivalent
- The percentage is rounded to at least 1 decimal place

---

### TC-RDV-341 — Uptime dashboard shows 90-day uptime percentage

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-092 — Uptime Dashboard |
| **Requirement Ref** | MON-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- `redmineflux_devops_health_samples` table contains at least 90 days of records

**Test Data:**
- 90-day dataset with known healthy/down breakdown producing a deterministic percentage

**Steps:**
1. Navigate to the project Uptime Dashboard widget
2. Locate the 90-day uptime figure

**Expected Result:**
- 90-day uptime percentage is displayed alongside the 30-day value
- Both figures are independently computed by the `UptimeCalculator` service
- Values differ when health history for the older 60 days differs from recent 30 days

---

### TC-RDV-342 — On-call schedule fetched from PagerDuty and displayed

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-093 — On-Call Schedule |
| **Requirement Ref** | MON-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- PagerDuty API token is configured in the project's DevOps monitoring connections
- A valid on-call schedule exists in PagerDuty for the connected schedule ID

**Test Data:**
- PagerDuty API returns: current on-call user = "Alice Smith", shift ends at = "2026-05-22 09:00 UTC"

**Steps:**
1. Navigate to `Project > DevOps`
2. Locate the on-call schedule sidebar widget

**Expected Result:**
- Widget displays "On-Call: Alice Smith"
- Shift end time is shown (e.g., "until 2026-05-22 09:00 UTC" or localized equivalent)
- Data is retrieved from PagerDuty via the configured API token
- Token is stored using AEAD encryption (not visible in plaintext)

---

### TC-RDV-343 — On-call schedule fetched from Opsgenie and displayed

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-093 — On-Call Schedule |
| **Requirement Ref** | MON-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Opsgenie API token is configured (not PagerDuty)
- Opsgenie schedule returns a current on-call responder

**Test Data:**
- Opsgenie API returns: on-call user = "Bob Jones", shift end = "2026-05-22 06:00 UTC"

**Steps:**
1. Navigate to `Project > DevOps`
2. Locate the on-call schedule sidebar widget

**Expected Result:**
- Widget correctly shows "On-Call: Bob Jones" pulled from Opsgenie
- Shift end time is displayed
- The widget behaves identically regardless of whether PagerDuty or Opsgenie is the configured provider

---

### TC-RDV-344 — On-call schedule cached for 15 minutes

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-093 — On-Call Schedule |
| **Requirement Ref** | MON-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- PagerDuty integration is configured
- Caching is enabled (default behavior per rfd-093)

**Test Data:**
- N/A (cache timing test)

**Steps:**
1. Load the DevOps project page to populate the cache
2. Note the on-call person displayed
3. Simulate a PagerDuty API response change (mock the response to return a different on-call person)
4. Reload the DevOps page within the 15-minute cache window
5. Observe the on-call widget

**Expected Result:**
- Within the 15-minute cache window, the old on-call data is still displayed (stale data served from cache)
- After the cache expires (>15 minutes), a fresh API call is made and updated data appears
- No errors are shown to the user when cache is serving stale data

---

### TC-RDV-345 — On-call schedule shows stale data when API is unavailable

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-093 — On-Call Schedule |
| **Requirement Ref** | MON-004 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- On-call data was previously cached
- PagerDuty/Opsgenie API is now unreachable (simulated by blocking network access or using an invalid token)

**Test Data:**
- Cached on-call data: "Carol Lee" on call

**Steps:**
1. With a valid cache in place, simulate the external on-call API becoming unavailable
2. Navigate to the DevOps project page

**Expected Result:**
- The widget shows the previously cached on-call data (stale data) rather than an error page
- A subtle indicator may show that data is from cache and could be outdated (e.g., "cached" label or last-updated timestamp)
- The page does not crash and no stack trace is shown

---

### TC-RDV-346 — Performance metrics tab shows three line charts

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-117 — Performance Metrics |
| **Requirement Ref** | MON-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A monitoring connection is configured in `redmineflux_devops_monitoring_connections` for the project
- DatadogAdapter or PrometheusAdapter is configured with valid credentials
- Performance data is available for the last 24 hours

**Test Data:**
- Datadog or Prometheus returning latency p50, latency p95, error rate, and RPS data for the last 24 hours

**Steps:**
1. Navigate to `Project > DevOps > Performance` (or the Performance tab/section)
2. Observe the charts rendered on the page

**Expected Result:**
- Three line charts are rendered:
  1. Latency (showing both p50 and p95 series)
  2. Error Rate
  3. Requests Per Second (RPS)
- All charts cover the last 24 hours on the time axis
- Charts are properly labeled with titles and axis units

---

### TC-RDV-347 — Performance charts display deployment markers

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-117 — Performance Metrics |
| **Requirement Ref** | MON-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Performance metrics page is accessible
- At least one deployment was recorded in the last 24 hours for the project

**Test Data:**
- Deployment to production environment at 14:00 UTC today

**Steps:**
1. Navigate to `Project > DevOps > Performance`
2. Observe the line charts on the page

**Expected Result:**
- A vertical line (deployment marker) appears on all charts at the timestamp matching the deployment time (14:00 UTC)
- Hovering over the marker shows deployment details (version, environment, deployed by)
- The marker visually aligns across all three charts at the same time position

---

### TC-RDV-348 — Performance metrics served from 60-second server-side cache

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-117 — Performance Metrics |
| **Requirement Ref** | MON-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Performance metrics page is configured and accessible
- Cache implementation is active per rfd-117

**Test Data:**
- N/A (cache timing verification)

**Steps:**
1. Load the Performance metrics page and note the data values (or check server-side cache headers/logs)
2. Change the underlying metric data source (or mock an updated API response)
3. Reload the Performance page within 60 seconds
4. Observe whether data is refreshed

**Expected Result:**
- Within the 60-second window, the same data is served (cached response)
- After 60 seconds, fresh data is fetched from the DatadogAdapter/PrometheusAdapter
- No error is shown to the user during the cache window

---

### TC-RDV-349 — Performance metrics SSRF guard blocks private IP requests

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-117 — Performance Metrics |
| **Requirement Ref** | MON-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A monitoring connection can be configured with a custom endpoint URL
- SSRF guard is implemented in all adapter HTTP calls per rfd-117

**Test Data:**
- Endpoint URL: `http://192.168.1.1/metrics` (RFC-1918 private IP)
- Also test: `http://127.0.0.1/metrics`, `http://169.254.169.254/` (AWS metadata endpoint)

**Steps:**
1. Configure a monitoring connection with a private IP as the metrics endpoint URL
2. Attempt to save the configuration or trigger a metrics fetch
3. Observe the result

**Expected Result:**
- The SSRF guard (SsrfGuard) rejects the request before the HTTP call is made
- An error message is returned indicating the URL is not permitted
- No HTTP request is sent to the private IP address
- The system is not vulnerable to SSRF via performance metric adapter URLs

---

### TC-RDV-350 — Infrastructure resource usage gauges shown per environment

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- At least two environments (e.g., staging, production) exist for the project
- `cpu_query`, `memory_query`, and `disk_query` are configured in the monitoring connection for each environment
- Prometheus/CloudWatch/Datadog is returning current usage values

**Test Data:**
- staging: CPU 45%, Memory 60%, Disk 30%
- production: CPU 85%, Memory 92%, Disk 55%

**Steps:**
1. Navigate to `Project > DevOps > Environments`
2. Observe the resource usage gauges on each environment card

**Expected Result:**
- Each environment card shows three gauges: CPU, Memory, Disk
- Staging: all gauges show values matching test data (45%, 60%, 30%)
- Production: all gauges show test data values (85%, 92%, 55%)
- Gauges are labeled correctly

---

### TC-RDV-351 — Infrastructure gauge color threshold: green below 70%

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Infrastructure resource gauges are displayed on environment cards

**Test Data:**
- CPU usage = 45% (below 70%)
- Memory usage = 65% (below 70%)

**Steps:**
1. Navigate to `Project > DevOps > Environments`
2. Inspect the color of the CPU and Memory gauges for an environment with < 70% usage

**Expected Result:**
- Both gauges are rendered in green color
- The green threshold applies for any value strictly below 70%
- Tooltip or label confirms the exact percentage value

---

### TC-RDV-352 — Infrastructure gauge color threshold: amber between 70% and 90%

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Infrastructure resource gauges are displayed

**Test Data:**
- CPU usage = 75% (between 70% and 90%)
- Disk usage = 88% (between 70% and 90%)

**Steps:**
1. Navigate to `Project > DevOps > Environments`
2. Inspect gauge colors for an environment with 70–89% usage

**Expected Result:**
- Gauges at 75% and 88% render in amber (orange/yellow) color
- The amber threshold applies for values >= 70% and < 90%
- Color is distinct from both the green (healthy) and red (critical) states

---

### TC-RDV-353 — Infrastructure gauge color threshold: red at 90% or above

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Infrastructure resource gauges are displayed

**Test Data:**
- Memory usage = 92% (>= 90%)
- CPU usage = 100% (>= 90%)

**Steps:**
1. Navigate to `Project > DevOps > Environments`
2. Inspect gauge colors for an environment with >= 90% usage

**Expected Result:**
- Gauges at 92% and 100% render in red color
- Red threshold applies for values >= 90%
- The red state may trigger additional visual attention (e.g., pulsing, icon)

---

### TC-RDV-354 — Missing infrastructure query renders as N/A not zero

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- An environment exists but its `disk_query` field is null or empty in the monitoring connection configuration

**Test Data:**
- `cpu_query`: configured
- `memory_query`: configured
- `disk_query`: null (not configured)

**Steps:**
1. Navigate to `Project > DevOps > Environments`
2. Observe the Disk gauge on the environment card with a missing disk query

**Expected Result:**
- The Disk gauge displays "N/A" rather than 0% or an empty gauge
- The CPU and Memory gauges still show their correct values
- No error or exception is raised due to the missing query
- "N/A" display clearly communicates that data is unavailable rather than implying zero usage

---

### TC-RDV-355 — Infrastructure resource usage served from 60-second cache per environment

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Infrastructure resource gauges are configured and displaying values

**Test Data:**
- Cache key is scoped per-environment (as defined by rfd-118)

**Steps:**
1. Load the environment dashboard and note the resource values
2. Simulate a change in the metric source (mock different values)
3. Reload within 60 seconds
4. Wait >60 seconds and reload again

**Expected Result:**
- Within 60 seconds: previously cached values are returned (unchanged)
- After 60 seconds: new values are fetched from the monitoring source
- Cache is scoped per environment (environment A cache expiry does not affect environment B)

---

### TC-RDV-356 — Alert with invalid webhook signature is rejected

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-001 — Webhook Receiver, rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A webhook secret is configured for the project's Prometheus AlertManager integration
- The webhook endpoint validates HMAC-SHA256 signatures

**Test Data:**
- Valid Prometheus alert payload
- HMAC-SHA256 signature computed with incorrect secret key (tampered signature)

**Steps:**
1. Send a POST request to `POST /devops/webhook/prometheus/{project_identifier}` with:
   - A valid JSON alert payload
   - An `X-Hub-Signature-256` header with an incorrect HMAC value
2. Observe the HTTP response

**Expected Result:**
- Server returns HTTP 401 or HTTP 403 (unauthorized/forbidden)
- The alert payload is NOT processed or stored
- No alert record is created in `redmineflux_devops_alerts`
- The rejection is logged in the webhook event log

---

### TC-RDV-357 — Alert without required provider header is ignored

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-001 — Webhook Receiver, rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Webhook endpoint is accessible
- The endpoint requires a provider-identifying header (e.g., `Content-Type` with vendor MIME or a custom `X-Provider` header)

**Test Data:**
- POST request with a valid JSON alert body but missing the expected provider header

**Steps:**
1. Send a POST request to the webhook endpoint without the provider identification header
2. Observe the HTTP response and the alerts feed

**Expected Result:**
- The request is rejected with HTTP 400 (Bad Request) or 422 (Unprocessable Entity)
- No alert record is created in the database
- The webhook event log records the failed event with an error description

---

### TC-RDV-358 — Alert fingerprint collision does not create duplicate record

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- An alert with fingerprint `fp-collision-001` already exists in the database
- A second webhook arrives with a different alert name but produces the same fingerprint value (rare hash collision scenario)

**Test Data:**
- First alert: fingerprint `fp-collision-001`, alertname "ServiceADown"
- Second alert: fingerprint `fp-collision-001`, alertname "ServiceBDown" (different alert, same fingerprint)

**Steps:**
1. Seed the first alert with the fingerprint
2. Send a second alert webhook with the same fingerprint but different content
3. Query `redmineflux_devops_alerts` for records with fingerprint `fp-collision-001`
4. Observe the alert feed

**Expected Result:**
- The system handles the collision gracefully — it does not crash or raise an unhandled exception
- Either: the second alert updates the existing record (upsert behavior), or it is rejected as a duplicate
- Under no circumstance are two records created with the same fingerprint
- The alert feed shows exactly one entry for this fingerprint

---

### TC-RDV-359 — Non-member user cannot access the alert feed

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-003 — Permission Model |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- A user "external_user" exists with no membership in the project "phoenix-platform"
- Alerts exist in the project's alert feed

**Test Data:**
- User: external_user (no project membership)
- Project: phoenix-platform

**Steps:**
1. Log in as `external_user`
2. Attempt to navigate directly to the project's Alerts page URL (e.g., `/projects/phoenix-platform/devops_alerts`)
3. Observe the response

**Expected Result:**
- The user receives a 403 Forbidden or is redirected to the login/access-denied page
- No alert data is visible or returned
- The DevOps tab is not shown in project navigation for non-members
- `view_devops` permission is enforced at the controller level

---

### TC-RDV-360 — Alerts tab is accessible to project members with view_devops permission

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-003 — Permission Model |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev_user" is a member of the project with the "Developer" role
- Developer role has `view_devops` permission enabled

**Test Data:**
- User: dev_user (Developer role, member of phoenix-platform)

**Steps:**
1. Log in as `dev_user`
2. Navigate to `Project > DevOps > Alerts`

**Expected Result:**
- Alerts tab loads successfully (HTTP 200)
- Alert feed is visible
- User can view alert details but cannot modify alert configuration

---

### TC-RDV-361 — Alerts empty state handled gracefully

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Project has DevOps configured but no alerts have been ingested yet

**Test Data:**
- `redmineflux_devops_alerts` table has zero records for this project

**Steps:**
1. Navigate to `Project > DevOps > Alerts`
2. Observe the alert feed area

**Expected Result:**
- The page loads without errors (HTTP 200)
- A meaningful empty state message is displayed (e.g., "No alerts received yet")
- The summary bar shows "0 Firing", "0 Critical", "0 Resolved Today"
- No table rows are shown; no JavaScript errors in the browser console
- Manual test reference H3 validated

---

### TC-RDV-362 — Alert summary bar updates after new alert is received

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- The Alerts page is accessible with existing data

**Test Data:**
- Initial state: 1 Firing, 1 Critical, 2 Resolved Today
- New critical alert arrives via webhook

**Steps:**
1. Note the current summary bar values
2. Send a new critical-severity firing alert via webhook
3. Reload the Alerts page
4. Observe the updated summary bar

**Expected Result:**
- "Firing" count increments to 2
- "Critical" count increments to 2
- "Resolved Today" count remains at 2 (unchanged)
- Summary bar accurately reflects the new database state

---

### TC-RDV-363 — Alert resolved event updates status and sets duration

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026 — Monitoring Alert Feed |
| **Requirement Ref** | MON-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A firing alert with fingerprint `fp-resolve-test` exists in the database
- The upstream monitoring tool sends a resolved webhook for the same fingerprint

**Test Data:**
- Initial: alert status = firing, fired_at = 2 hours ago
- Resolution webhook: same fingerprint, `status: resolved`, `endsAt: now`

**Steps:**
1. Send the resolution webhook for the fingerprint `fp-resolve-test`
2. Navigate to `Project > DevOps > Alerts`
3. Locate the alert row

**Expected Result:**
- Alert status changes to "Resolved"
- `resolved_at` timestamp is set on the record
- Duration is displayed (approximately "2h 0m")
- The alert moves to or is labeled as resolved in the UI

---

### TC-RDV-364 — Performance metrics PrometheusAdapter used when Datadog not configured

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-117 — Performance Metrics |
| **Requirement Ref** | MON-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Only Prometheus (not Datadog) is configured in `redmineflux_devops_monitoring_connections`

**Test Data:**
- Prometheus endpoint returning PromQL query results for latency, error rate, and RPS

**Steps:**
1. Configure monitoring connection with PrometheusAdapter credentials only
2. Navigate to `Project > DevOps > Performance`

**Expected Result:**
- All three line charts render using data from the PrometheusAdapter
- No "Datadog not configured" error appears
- Charts show the same structure (latency p50/p95, error rate, RPS) regardless of adapter

---

### TC-RDV-365 — Performance metrics DatadogAdapter used when configured

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-117 — Performance Metrics |
| **Requirement Ref** | MON-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Datadog API key and application key are configured in `redmineflux_devops_monitoring_connections`

**Test Data:**
- Datadog API returning valid timeseries data for the last 24 hours

**Steps:**
1. Configure monitoring connection with DatadogAdapter credentials
2. Navigate to `Project > DevOps > Performance`

**Expected Result:**
- Charts populate with data from Datadog
- SSRF guard is applied to the outbound HTTP call to Datadog API
- No credentials are exposed in the page source or browser network response

---

### TC-RDV-366 — On-call widget shows current on-call person and shift end time

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-093 — On-Call Schedule |
| **Requirement Ref** | MON-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- PagerDuty or Opsgenie is configured with a valid on-call schedule
- The API response includes person name and rotation end time

**Test Data:**
- On-call person: "Dana Kim", shift ends: "2026-05-22 09:00 UTC"

**Steps:**
1. Navigate to the project DevOps page
2. Locate the on-call sidebar widget

**Expected Result:**
- Widget text includes the on-call person's name: "Dana Kim"
- Widget text includes the shift end time: "until Thu May 22, 09:00 UTC" or equivalent
- Both pieces of information are displayed without requiring additional clicks

---

### TC-RDV-367 — Uptime health_samples table drives calculation

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-092 — Uptime Dashboard |
| **Requirement Ref** | MON-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- `redmineflux_devops_health_samples` table exists and contains sample data

**Test Data:**
- Insert 100 health samples: 98 with status "up", 2 with status "down"
- All samples within last 30 days

**Steps:**
1. Confirm records exist in `redmineflux_devops_health_samples`
2. Navigate to the Uptime Dashboard widget
3. Verify the displayed uptime percentage

**Expected Result:**
- Displayed 30-day uptime = 98.0%
- The `UptimeCalculator` service computes this from the `health_samples` table
- The calculation matches: (98 up / 100 total) * 100 = 98.0%

---

### TC-RDV-368 — Infrastructure gauge boundaries: exactly 70% is amber

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Infrastructure resource gauges are displayed

**Test Data:**
- CPU usage = 70% exactly

**Steps:**
1. Mock or configure the monitoring source to return exactly 70% for CPU
2. Navigate to the environment card showing CPU gauge

**Expected Result:**
- CPU gauge at exactly 70% shows amber (not green)
- Boundary condition: the rule is green < 70%, amber >= 70% and < 90%
- At 70% exactly, the gauge is amber per the color threshold specification

---

### TC-RDV-369 — Infrastructure gauge boundaries: exactly 90% is red

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-118 — Infrastructure Resource Usage |
| **Requirement Ref** | MON-006 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Infrastructure resource gauges are displayed

**Test Data:**
- Memory usage = 90% exactly

**Steps:**
1. Mock or configure the monitoring source to return exactly 90% for Memory
2. Navigate to the environment card showing the Memory gauge

**Expected Result:**
- Memory gauge at exactly 90% shows red (not amber)
- Boundary condition: the rule is red >= 90%
- At 90% exactly, the gauge is red per the threshold specification

---

### TC-RDV-370 — Full alert-to-incident workflow end-to-end

| Field | Value |
|-------|-------|
| **Module** | Monitoring & Alerting |
| **Feature** | rfd-026, rfd-027 — Alert Feed and Auto-Create Incident |
| **Requirement Ref** | MON-001, MON-002 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- DevOps plugin is fully configured for the project
- "Incident" tracker exists with "Urgent" priority available
- Auto-incident threshold set to "critical"
- Tester has `view_devops` and `manage_incidents` permissions

**Test Data:**
- Prometheus AlertManager payload:
  - `alertname: PaymentServiceDown`
  - `severity: critical`
  - `status: firing`
  - `description: Payment service health check failed for 5 consecutive probes`
  - `instance: payment-svc-01`

**Steps:**
1. Send the critical Prometheus alert webhook to `POST /devops/webhook/prometheus/phoenix-platform`
2. Navigate to `Project > DevOps > Alerts`
3. Verify the alert appears in the feed with severity "Critical" and status "Firing"
4. Navigate to `Project > DevOps > Incidents`
5. Verify the auto-created incident appears
6. Open the auto-created incident issue
7. Verify the tracker, priority, subject, and description fields
8. Send a resolved webhook for the same fingerprint
9. Return to the Alerts feed and verify the status updates to "Resolved"

**Expected Result:**
- Step 3: Alert visible with correct severity and status in the feed
- Step 5: An incident issue is automatically present (created by `AlertIncidentCreator`)
- Step 7: Incident has tracker="Incident", priority="Urgent", subject contains "PaymentServiceDown", description includes alert details
- Step 9: Alert status updates to "Resolved" with a duration displayed
- The entire workflow executes without manual intervention
- MTTR tracking begins from the incident creation timestamp
