# Test Cases — DORA Metrics + Flow Metrics — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | DORA Metrics + Flow Metrics + Custom Dashboard |
| **TC Range** | TC-RDV-291 to TC-RDV-325 |
| **Total TCs** | 35 |
| **Requirement Coverage** | MET-001, MET-002, MET-003, MET-004, MET-005, MET-006, MET-007 |
| **Feature Coverage** | rfd-022, rfd-023, rfd-024, rfd-025, rfd-097, rfd-098, rfd-120 |

---

## TC-RDV-291 — Deployment Frequency widget displays deploys/week with classification badge

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "Phoenix Platform" has 28 production deployments in the last 28 days (exactly 7 per week on average)
- All environments with `is_production = true` are used to count deployments

**Test Data:**
- Production deployments in last 28 days: 28
- Calculated rate: 7 deploys/week
- Expected DORA classification: "Elite" (multiple deploys per day or on-demand)

**Steps:**
1. Navigate to Project → DevOps → Metrics
2. Locate the "Deployment Frequency" card or widget

**Expected Result:**
- The widget displays "7.0 deploys/week" (or similar formatted value)
- An "Elite" classification badge is displayed alongside the metric
- The badge color is green (Elite = green per DORA classification)
- The metric is calculated only from environments where `is_production = true`

---

## TC-RDV-292 — Deployment Frequency only counts production environment deployments

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- "Phoenix Platform" has two environments: "production" (`is_production = true`) and "staging" (`is_production = false`)
- Production: 7 deployments in the last 7 days
- Staging: 20 deployments in the last 7 days

**Test Data:**
- Production deployments (last 7 days): 7
- Staging deployments (last 7 days): 20

**Steps:**
1. Navigate to Project → DevOps → Metrics → Deployment Frequency card
2. Observe the deploys/week value

**Expected Result:**
- Deployment Frequency shows "7.0 deploys/week" (only production counted)
- The 20 staging deployments are NOT included in the calculation
- The `is_production` boolean column filters correctly

---

## TC-RDV-293 — Deployment Frequency: Low classification shown in red

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- "Phoenix Platform" had 1 production deployment in the last 28 days (1 per month frequency)

**Test Data:**
- Production deployments in last 28 days: 1
- Calculated rate: 0.25 deploys/week
- Expected classification: "Low" (less than once per month by DORA definition)

**Steps:**
1. Navigate to Project → DevOps → Metrics → Deployment Frequency card

**Expected Result:**
- The widget displays approximately "0.25 deploys/week"
- A "Low" classification badge is shown
- The badge color is red (Low = red per DORA color scheme)

---

## TC-RDV-294 — Lead Time for Changes calculated from commit.committed_at to production deployment

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Lead Time for Changes (rfd-023) |
| **Requirement Ref** | MET-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- 10 production deployments exist in the last 30 days
- Each deployment is correlated to a commit via `deployment.commit_sha` matching `redmineflux_devops_commits.commit_sha`
- Sample lead times: 2h, 4h, 3h, 6h, 2h, 5h, 3h, 4h, 8h, 3h

**Test Data:**
- Median lead time: 3.5 hours
- commit.committed_at → production deployment.finished_at for each pair

**Steps:**
1. Navigate to Project → DevOps → Metrics → Lead Time card

**Expected Result:**
- The Lead Time card displays the median value in hours (approximately "3.5 hours")
- A classification badge is shown (e.g., "High" for < 1 day median)
- The calculation correctly uses `commit.committed_at` as the start time and the production deployment timestamp as the end time

---

## TC-RDV-295 — Lead Time classification displayed in hours median

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Lead Time for Changes (rfd-023) |
| **Requirement Ref** | MET-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Lead time median is 3.5 hours as per TC-RDV-294

**Test Data:**
- Median: 3.5 hours
- DORA "High" classification: less than one week, more than one day

**Steps:**
1. Navigate to Project → DevOps → Metrics → Lead Time card
2. Note the numeric value and classification badge

**Expected Result:**
- Lead Time is displayed as "3.5 hours" (or "3h 30m")
- Classification badge is shown (Elite = < 1 hour, High = 1h–24h, Medium = 1 day–1 week, Low = > 1 week)
- The badge color matches the classification (Elite = green, High = blue, Medium = yellow, Low = red)

---

## TC-RDV-296 — Change Failure Rate calculated as percentage of deployments causing incidents

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Change Failure Rate (rfd-024) |
| **Requirement Ref** | MET-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- 20 production deployments in the last 30 days
- 2 deployments have `caused_incident = true`
- 1 deployment has `is_rollback = true` (rollback)
- 1 deployment has status = "failed"

**Test Data:**
- Total deployments: 20
- Failure denominator: 4 (2 caused_incident + 1 rollback + 1 failed)
- Expected CFR: 4/20 = 20%

**Steps:**
1. Navigate to Project → DevOps → Metrics → Change Failure Rate card

**Expected Result:**
- Change Failure Rate is displayed as "20%"
- The denominator correctly includes: failed deployments, rolled-back deployments, AND incident-causing deployments
- A classification badge is shown (e.g., "Medium" for 16–30% CFR)

---

## TC-RDV-297 — Change Failure Rate denominator includes all failure types

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Change Failure Rate (rfd-024) |
| **Requirement Ref** | MET-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- 10 production deployments; deployment details:
  - #D1: success, `caused_incident = false`, `is_rollback = false`, status = "success"
  - #D2: `caused_incident = true`, status = "success" (incident after successful deploy)
  - #D3: `is_rollback = true`, status = "rolled_back"
  - #D4: status = "failed"
  - #D5–#D10: all success, no incidents

**Test Data:**
- Failure types present: caused_incident (#D2), rollback (#D3), failed (#D4)
- Total failures: 3 out of 10

**Steps:**
1. Navigate to Project → DevOps → Metrics → Change Failure Rate card

**Expected Result:**
- CFR = 30% (3/10)
- All three failure types (#D2 caused_incident, #D3 rollback, #D4 failed) are counted in the numerator
- No failures are missed; no non-failures are included

---

## TC-RDV-298 — MTTR calculated from incident.started_at to incident.resolved_at

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Mean Time to Recovery (rfd-025) |
| **Requirement Ref** | MET-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- 5 resolved production incidents exist in the last 30 days in `redmineflux_devops_incidents`:
  - Incident A: started 2026-05-01 10:00, resolved 2026-05-01 11:30 (90 min)
  - Incident B: started 2026-05-05 14:00, resolved 2026-05-05 15:00 (60 min)
  - Incident C: started 2026-05-10 08:00, resolved 2026-05-10 09:00 (60 min)
  - Incident D: started 2026-05-15 16:00, resolved 2026-05-15 17:30 (90 min)
  - Incident E: started 2026-05-20 12:00, resolved 2026-05-20 12:30 (30 min)

**Test Data:**
- MTTR values: 90, 60, 60, 90, 30 minutes
- Mean MTTR: (90+60+60+90+30)/5 = 66 minutes = 1.1 hours

**Steps:**
1. Navigate to Project → DevOps → Metrics → MTTR card

**Expected Result:**
- MTTR is displayed as approximately "1.1 hours" or "66 minutes"
- The calculation uses `incident.started_at` to `incident.resolved_at` duration from `redmineflux_devops_incidents`
- A classification badge is shown (Elite = < 1 hour, High = < 1 day, Medium = < 1 week, Low = > 1 week)

---

## TC-RDV-299 — MTTR displayed in hours with classification badge

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Mean Time to Recovery (rfd-025) |
| **Requirement Ref** | MET-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- MTTR computed as 1.1 hours per TC-RDV-298 data

**Test Data:**
- MTTR: 1.1 hours
- Expected classification: "High" (between 1 hour and 1 day)

**Steps:**
1. Navigate to Project → DevOps → Metrics → MTTR card
2. Note the value and classification badge

**Expected Result:**
- MTTR shows "1.1 hours" (or "1h 6m")
- "High" classification badge is displayed in blue
- The `format_value` and `format_unit` helpers from rfd-025 produce a human-readable output

---

## TC-RDV-300 — DORA period filter recalculates all four metrics on change

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency, Lead Time, CFR, MTTR (rfd-022–rfd-025) |
| **Requirement Ref** | MET-001, MET-002, MET-003, MET-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Sufficient deployment and incident data exists for both a 7-day and 90-day period with different values
- The DORA metrics page has a period filter dropdown with options: Last 7 days, Last 30 days, Last 90 days

**Test Data:**
- Period: Last 7 days → Deployment Frequency: 8 deploys/week, Lead Time: 2h, CFR: 5%, MTTR: 45 min
- Period: Last 90 days → Deployment Frequency: 4 deploys/week, Lead Time: 6h, CFR: 12%, MTTR: 1.5h

**Steps:**
1. Navigate to Project → DevOps → Metrics
2. Observe the DORA metrics for the default period (e.g., Last 30 days)
3. Change the period filter to "Last 7 days"
4. Observe all four DORA metric values update
5. Change the period filter to "Last 90 days"
6. Observe all four DORA metric values update again

**Expected Result:**
- After step 3: All 4 metric cards update to show "Last 7 days" values (Freq: 8/week, LT: 2h, CFR: 5%, MTTR: 45m)
- After step 5: All 4 metric cards update to show "Last 90 days" values (Freq: 4/week, LT: 6h, CFR: 12%, MTTR: 1.5h)
- All four metrics recalculate simultaneously on each period change

---

## TC-RDV-301 — DORA classification colors: Elite green, High blue, Medium yellow, Low red

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) / Lead Time (rfd-023) |
| **Requirement Ref** | MET-001, MET-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Configure test scenarios so each of the 4 classifications is triggered for the Deployment Frequency metric across different test projects

**Test Data:**
- Project A: 28 deploys/week → Elite
- Project B: 2 deploys/week → High
- Project C: 2 deploys/month → Medium
- Project D: 1 deploy/6 months → Low

**Steps:**
1. Navigate to Project A → DevOps → Metrics → Deployment Frequency card; note badge color
2. Repeat for Projects B, C, and D

**Expected Result:**
- Project A: "Elite" badge with green color
- Project B: "High" badge with blue color
- Project C: "Medium" badge with yellow color
- Project D: "Low" badge with red color
- Colors are consistent with the DORA classification legend

---

## TC-RDV-302 — DORA metrics require at least one deployment to show values

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Project "Orion API" exists with no production deployments recorded in `redmineflux_devops_deployments`

**Test Data:**
- Project: "Orion API"
- Production deployments: 0

**Steps:**
1. Navigate to "Orion API" → DevOps → Metrics
2. Observe the Deployment Frequency, Lead Time, CFR, and MTTR cards

**Expected Result:**
- All four DORA metric cards display either "N/A", "No data", or "0" with an appropriate message
- No classification badge is shown when there is insufficient data
- No JavaScript error or server error (500) occurs
- A guidance message like "Deploy to production to see DORA metrics" may be shown

---

## TC-RDV-303 — DORA with zero deployments in period shows 0 not an error

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- "Phoenix Platform" has production deployments historically but none in the selected period "Last 7 days"

**Test Data:**
- Period: Last 7 days
- Deployments in period: 0

**Steps:**
1. Navigate to Project → DevOps → Metrics
2. Set period filter to "Last 7 days"
3. Observe the Deployment Frequency card

**Expected Result:**
- Deployment Frequency shows "0 deploys/week" or "0" — not a blank, null, or error
- No division-by-zero exception is raised
- The page renders without a server error (HTTP 200)
- A "Low" classification badge may optionally be shown for 0 deploys

---

## TC-RDV-304 — Cross-project environment IDs rejected (IDOR protection for metrics)

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- "Phoenix Platform" has environment ID 5 (production)
- "Atlantis API" has environment ID 8 (production)
- User I is a member of "Atlantis API" but NOT "Phoenix Platform"

**Test Data:**
- Attempt: User I queries DORA metrics for "Atlantis API" but specifies environment_id=5 (which belongs to "Phoenix Platform")

**Steps:**
1. Log in as User I
2. Navigate to `GET /projects/atlantis-api/devops/metrics/dora.json?environment_id=5`

**Expected Result:**
- The request returns HTTP 404 or HTTP 403
- Environment ID 5 from "Phoenix Platform" is not accessible to a user of "Atlantis API"
- All environment lookups in DORA calculations are scoped to the current project

---

## TC-RDV-305 — DST boundary does not cause DORA off-by-one error

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- A production deployment occurred at 2026-03-29 01:30:00 UTC (during EU DST transition, Europe/Berlin changes from UTC+1 to UTC+2)
- The DORA period filter is set to "Last 7 days" starting from 2026-04-04

**Test Data:**
- Deployment timestamp: 2026-03-29 01:30 UTC (DST boundary)
- Period: 2026-03-29 to 2026-04-04

**Steps:**
1. Set the server timezone to a DST-affected timezone (e.g., Europe/Berlin)
2. Navigate to Project → DevOps → Metrics with the period covering the DST transition
3. Observe the Deployment Frequency count for the week containing the DST boundary

**Expected Result:**
- The deployment at 2026-03-29 01:30 UTC is correctly counted exactly once
- No duplication or omission occurs due to the DST clock change
- The deployment frequency value is stable and does not change by ±1 due to the time boundary

---

## TC-RDV-306 — Cycle Time measured from issue.created_on to first production deployment

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Cycle Time (rfd-097) |
| **Requirement Ref** | MET-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Issues with production deployment records exist in `deployment_issues` join table
- Sample cycle times: Issue #101 created 2026-04-01, first production deploy 2026-04-08 (7 days); Issue #102 created 2026-04-03, first production deploy 2026-04-06 (3 days); Issue #201 created 2026-04-05, first production deploy 2026-04-10 (5 days)

**Test Data:**
- Cycle times: 7, 3, 5 days
- Mean: 5.0 days, Median: 5.0 days, P95: ~7 days

**Steps:**
1. Navigate to Project → DevOps → Metrics → Cycle Time section or widget

**Expected Result:**
- Cycle Time displays mean, median, and P95 values
- Mean: 5.0 days, Median: 5.0 days, P95: ~7.0 days
- The `CycleTimeCalculator` service correctly uses `issue.created_on` as start and first production deployment via `deployment_issues` join as end

---

## TC-RDV-307 — Cycle Time computes mean, median, and P95 in days

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Cycle Time (rfd-097) |
| **Requirement Ref** | MET-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- 20 issues with cycle time data are available: mostly 2–7 days, with 2 outliers at 30 days

**Test Data:**
- Sample cycle times (days): 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7, 8, 30, 30
- Mean: approximately 8.2 days
- Median: 5.5 days
- P95: approximately 30 days

**Steps:**
1. Navigate to Project → DevOps → Metrics → Cycle Time
2. Observe the three statistical values displayed

**Expected Result:**
- Mean is displayed as approximately "8.2 days"
- Median is displayed as "5.5 days"
- P95 is displayed as approximately "30 days"
- All three statistics are labeled clearly (Mean, Median, P95)

---

## TC-RDV-308 — Cycle Time histogram bucket visualization renders correctly

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Cycle Time (rfd-097) |
| **Requirement Ref** | MET-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Cycle time data exists as per TC-RDV-307 (20 issues)

**Test Data:**
- Cycle time distribution: majority 2–8 days, outliers at 30 days

**Steps:**
1. Navigate to Project → DevOps → Metrics → Cycle Time
2. Observe the histogram visualization

**Expected Result:**
- A histogram chart is rendered showing cycle time distribution in buckets (e.g., 0–3 days, 4–7 days, 8–14 days, 15+ days)
- The tallest bar corresponds to the 4–7 day bucket (most issues)
- The 30-day outliers appear in the 15+ day or 29–31 day bucket
- The chart is properly labeled with axis titles

---

## TC-RDV-309 — Throughput shows issues closed per week over 12-week rolling window

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Throughput (rfd-098) |
| **Requirement Ref** | MET-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Redmine issues have been closed over the past 12 weeks with the following weekly counts: [8, 10, 7, 12, 9, 11, 8, 10, 13, 9, 11, 10]

**Test Data:**
- 12-week weekly closure counts: 8, 10, 7, 12, 9, 11, 8, 10, 13, 9, 11, 10
- Average: 9.8 issues/week

**Steps:**
1. Navigate to Project → DevOps → Metrics → Throughput section or widget
2. Observe the throughput chart and summary value

**Expected Result:**
- The throughput widget shows the 12-week rolling window data
- Each of the 12 weeks is represented in the sparkline/bar chart
- Average throughput of approximately "9.8 issues/week" is displayed
- The `ThroughputCalculator` uses `DATE_TRUNC('week', closed_on)` GROUP BY correctly

---

## TC-RDV-310 — Throughput sparkline chart renders correctly

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Throughput (rfd-098) |
| **Requirement Ref** | MET-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Throughput data exists as per TC-RDV-309

**Test Data:**
- Weekly counts: 8, 10, 7, 12, 9, 11, 8, 10, 13, 9, 11, 10

**Steps:**
1. Navigate to Project → DevOps → Metrics → Throughput
2. Observe the sparkline chart

**Expected Result:**
- A sparkline chart (SVG or canvas) is rendered showing 12 data points
- The chart peaks at week 9 (13 issues) and dips at week 3 (7 issues)
- The chart is rendered within the widget boundaries without overflow

---

## TC-RDV-311 — Custom dashboard: drag-and-drop widget builder works

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User L (Manager/Lead) is logged in with `view_devops` permission
- The custom dashboard page is accessible

**Test Data:**
- Widget to add: `dora.deployment_frequency`
- Dashboard: user L's personal dashboard

**Steps:**
1. Navigate to Project → DevOps → Metrics → Custom Dashboard (or Dashboard builder page)
2. Locate the widget picker/catalog
3. Drag the "Deployment Frequency" widget from the catalog to the dashboard canvas
4. Drop it into position
5. Click "Save Layout"

**Expected Result:**
- The widget is added to the dashboard at the dropped position
- The dashboard layout is saved to `redmineflux_devops_dashboards` as `layout_json`
- The `layout_json` contains the new widget entry: `{widget_key: "dora.deployment_frequency", x: ..., y: ..., w: ..., h: ...}`
- After page reload, the widget remains in position

---

## TC-RDV-312 — Custom dashboard has 8 starter widgets available

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User L is on the custom dashboard builder page

**Test Data:**
- Expected widgets: dora.deployment_frequency, dora.lead_time, dora.change_failure_rate, dora.mean_time_to_recovery, flow.cycle_time, flow.throughput, tests.flaky, security.vulnerabilities

**Steps:**
1. Navigate to the custom dashboard builder
2. Open the widget catalog/picker
3. List all available widgets

**Expected Result:**
- All 8 starter widgets are available in the catalog:
  1. `dora.deployment_frequency` — Deployment Frequency
  2. `dora.lead_time` — Lead Time for Changes
  3. `dora.change_failure_rate` — Change Failure Rate
  4. `dora.mean_time_to_recovery` — Mean Time to Recovery
  5. `flow.cycle_time` — Cycle Time
  6. `flow.throughput` — Throughput
  7. `tests.flaky` — Flaky Tests
  8. `security.vulnerabilities` — Security Vulnerabilities
- All 8 are accessible and renderable

---

## TC-RDV-313 — Custom dashboard enforces maximum 50 widgets per layout (server-side)

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- User L already has a dashboard with 50 widgets saved
- User L attempts to add a 51st widget

**Test Data:**
- Current widget count: 50
- Attempt to add: 1 more widget (dora.deployment_frequency)

**Steps:**
1. Add 50 widgets to the dashboard via the drag-and-drop builder (or by directly posting a `layout_json` with 50 entries)
2. Attempt to save a layout with 51 widgets (either via UI or via a direct PUT request with a 51-widget `layout_json`)

**Expected Result:**
- The server-side JSON schema validation rejects the layout with 51 widgets
- A validation error is returned: e.g., "Layout exceeds maximum widget count of 50"
- The dashboard is NOT saved with 51 widgets
- The current 50-widget layout remains intact
- The validation is enforced server-side (not just client-side)

---

## TC-RDV-314 — Custom dashboard is per-user private by default

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User L (Manager) has created a custom dashboard with 3 widgets
- User M (Developer) is a different member of the same project

**Test Data:**
- User L's dashboard: 3 widgets, `shared = false`

**Steps:**
1. Log in as User L and create/save a custom dashboard with 3 widgets (shared = false / private)
2. Log out and log in as User M
3. Navigate to Project → DevOps → Metrics → Custom Dashboard

**Expected Result:**
- User M does NOT see User L's private dashboard
- User M sees either their own dashboard (empty or default) or a prompt to create one
- The `redmineflux_devops_dashboards` record for User L is not accessible to User M
- Per-user layout persistence is scoped to the authenticated user

---

## TC-RDV-315 — Shared dashboard visible to all project members

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User L (DevOps Engineer with `manage_devops_settings` permission) has a dashboard and sets it to shared
- User M (Developer) is a member of the same project

**Test Data:**
- User L's dashboard: `shared = true`

**Steps:**
1. Log in as User L
2. Navigate to the custom dashboard and enable the "Share with team" or "Shared" toggle
3. Save the dashboard
4. Log out and log in as User M
5. Navigate to Project → DevOps → Metrics or Dashboard

**Expected Result:**
- User M can see User L's shared dashboard
- The shared dashboard is labeled with the owner's name (e.g., "L's Dashboard — Shared")
- User M has read-only access (cannot modify User L's shared dashboard layout)

---

## TC-RDV-316 — Shared dashboard requires manage_devops_settings permission

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User M (Developer role) does NOT have `manage_devops_settings` permission
- User M has a private dashboard with 2 widgets

**Test Data:**
- User M: role = Developer, no `manage_devops_settings` permission

**Steps:**
1. Log in as User M
2. Navigate to the custom dashboard
3. Attempt to toggle the "Shared" flag to true (either via UI or direct PUT request setting `shared: true`)

**Expected Result:**
- The "Share" toggle is either not visible to User M or is disabled
- A direct PUT request to set `shared: true` returns HTTP 403 Forbidden
- The dashboard `shared` flag remains `false` in the database
- Per rfd-120: "shared flag allows a dashboard to be visible to all project members (requires `:manage_devops_settings`)"

---

## TC-RDV-317 — DORA metrics page accessible to Lead and PM roles

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- User N (Manager/Lead) is logged in
- User O (PM/Manager) is logged in
- "Phoenix Platform" has DORA metrics data

**Test Data:**
- User N: role = Manager/Lead
- User O: role = Manager (PM)

**Steps:**
1. Log in as User N (Lead) and navigate to Project → DevOps → Metrics
2. Log out, log in as User O (PM) and navigate to the same page

**Expected Result:**
- Both User N and User O can access the Metrics page (HTTP 200)
- All four DORA metric cards are visible and populated
- Per permissions matrix: Lead (Manager) and PM (Manager) have "View DORA Metrics" permission

---

## TC-RDV-318 — DORA metrics not accessible to QA role

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency (rfd-022) |
| **Requirement Ref** | MET-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User B (QA role) is logged in

**Test Data:**
- User B: role = QA

**Steps:**
1. Log in as User B (QA)
2. Navigate to Project → DevOps → Metrics (DORA section)

**Expected Result:**
- Per the permissions matrix: QA does NOT have "View DORA Metrics" permission
- The Metrics page is either not shown, returns HTTP 403, or shows a permission error
- DORA metric data is not exposed to QA role users

---

## TC-RDV-319 — Flow metrics (Cycle Time, Throughput) accessible to PM role

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Cycle Time (rfd-097), Throughput (rfd-098) |
| **Requirement Ref** | MET-005, MET-006 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- User O (PM/Manager role) is logged in

**Test Data:**
- User O: role = Manager (PM)

**Steps:**
1. Log in as User O (PM)
2. Navigate to Project → DevOps → Metrics → Cycle Time and Throughput sections

**Expected Result:**
- Cycle Time and Throughput widgets/sections are visible to PM role
- Data is displayed correctly (mean, median, P95 for cycle time; sparkline for throughput)
- Per requirements, PM is the target persona for both MET-005 (Cycle Time) and MET-006 (Throughput)

---

## TC-RDV-320 — Custom dashboard layout JSON schema validation: invalid widget key rejected

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- User L has a custom dashboard

**Test Data:**
- Invalid layout JSON: `[{"widget_key": "invalid.nonexistent_widget", "x": 0, "y": 0, "w": 4, "h": 2, "params": {}}]`

**Steps:**
1. Log in as User L
2. Send a direct PUT/PATCH request to the dashboard endpoint with the layout JSON containing an unregistered widget key "invalid.nonexistent_widget"

**Expected Result:**
- The server-side JSON schema validation rejects the layout
- HTTP 422 Unprocessable Entity (or 400 Bad Request) is returned
- An error message indicates "widget_key 'invalid.nonexistent_widget' is not a registered widget"
- The dashboard layout is NOT saved with the invalid widget key

---

## TC-RDV-321 — Custom dashboard layout JSON validation: params must be a Hash

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- User L has a custom dashboard

**Test Data:**
- Invalid layout JSON: `[{"widget_key": "dora.deployment_frequency", "x": 0, "y": 0, "w": 4, "h": 2, "params": "not-a-hash"}]`

**Steps:**
1. Send a PUT request to the dashboard endpoint with `params` set to a string instead of a Hash/object

**Expected Result:**
- The JSON schema validation rejects the layout
- HTTP 422 is returned with an error indicating `params` must be a Hash/object
- The layout is not saved

---

## TC-RDV-322 — Throughput shows zero correctly when no issues were closed in the period

| Field | Value |
|-------|-------|
| **Module** | Flow Metrics |
| **Feature** | Throughput (rfd-098) |
| **Requirement Ref** | MET-006 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Project "Orion API" exists with zero closed issues in the last 12 weeks

**Test Data:**
- Closed issues in last 12 weeks: 0

**Steps:**
1. Navigate to "Orion API" → DevOps → Metrics → Throughput

**Expected Result:**
- Throughput shows "0 issues/week"
- The sparkline chart renders 12 data points all at 0 (flat line at zero)
- No error or exception is thrown
- The `DATE_TRUNC('week', closed_on)` GROUP BY query handles zero results gracefully

---

## TC-RDV-323 — MTTR shows "No Data" when no resolved incidents exist

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Mean Time to Recovery (rfd-025) |
| **Requirement Ref** | MET-004 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- "Phoenix Platform" has no resolved incidents in `redmineflux_devops_incidents` for the selected period

**Test Data:**
- Resolved incidents in period: 0

**Steps:**
1. Navigate to Project → DevOps → Metrics → MTTR card

**Expected Result:**
- MTTR card shows "N/A" or "No data" instead of "0 hours"
- No classification badge is shown when MTTR cannot be calculated
- No division-by-zero error or NaN is displayed

---

## TC-RDV-324 — DORA metrics REST API endpoint returns all four metrics in JSON

| Field | Value |
|-------|-------|
| **Module** | DORA Metrics |
| **Feature** | Deployment Frequency / Lead Time / CFR / MTTR (rfd-022–rfd-025) |
| **Requirement Ref** | MET-001, MET-002, MET-003, MET-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- "Phoenix Platform" has DORA metrics data
- A valid API key for User N (Lead) is available

**Test Data:**
- API endpoint: `GET /projects/phoenix-platform/devops/metrics/dora.json`
- API key: valid (User N, Lead)

**Steps:**
1. Send `GET /projects/phoenix-platform/devops/metrics/dora.json` with header `X-Redmine-API-Key: [valid-key]`
2. Inspect the JSON response

**Expected Result:**
- HTTP 200 response
- JSON contains keys for all four DORA metrics: `deployment_frequency`, `lead_time`, `change_failure_rate`, `mttr`
- Each metric includes value, unit, and classification fields
- Response is suitable for MCP agent consumption (`redmineflux_devops_dora_metrics` tool)

---

## TC-RDV-325 — Custom dashboard backwards compatibility: existing fixed dashboards untouched

| Field | Value |
|-------|-------|
| **Module** | Custom Dashboard |
| **Feature** | Custom Metrics Dashboard (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- "Phoenix Platform" has an existing fixed/default DORA metrics dashboard (from before rfd-120 was implemented)
- No custom `redmineflux_devops_dashboards` record exists for User L yet

**Test Data:**
- Existing fixed dashboard: default DORA metrics view
- Custom dashboard for User L: not yet created

**Steps:**
1. Log in as User L (Manager/Lead)
2. Navigate to Project → DevOps → Metrics
3. Observe whether the existing fixed dashboard is still visible
4. Navigate to the custom dashboard builder
5. Create and save a new custom dashboard with 2 widgets
6. Navigate back to the standard Metrics page

**Expected Result:**
- The existing fixed DORA metrics dashboard remains unchanged and accessible
- Creating the custom dashboard does NOT overwrite or modify the existing fixed dashboard view
- Both the standard metrics view and the new custom dashboard are accessible independently
- rfd-120 "backwards-compatible: existing fixed dashboards untouched" requirement is satisfied
