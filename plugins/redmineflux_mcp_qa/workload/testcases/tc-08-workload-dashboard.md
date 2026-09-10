# Test Cases — Workload Dashboard — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Workload Dashboard |
| **TC Range** | TC-RFM-071 to TC-RFM-077 |
| **Total TCs** | 7 |
| **Execution Order** | Suite 8 — Run after Workload Filtering (tc-07) |
| **Feature Coverage** | RFM-F071 through RFM-F077 |

**Data Dependencies:**
- "QA Team June 2026" workload exists with issues assigned to john.doe and jane.doe (tc-05 + tc-06).
- "Automation Team" exists (tc-03).
- Leaves exist for john.doe (tc-04) — approved leave on 2026-06-23 to 2026-06-24.

---

## TC-RFM-071 — View workload dashboard by team via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F071 Dashboard by team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" workload exists with at least 2 issues assigned.
- Automation Team exists (TC-RFM-023).

**Test Data:**
- Team ID from TC-RFM-023.

**Steps:**
1. Call MCP `dashboard` with team_id = Automation Team ID.
2. Validate MCP response:
   - Response contains dashboard data for Automation Team.
   - Includes total issues count, total planned hours, overall allocation %.
   - Includes per-user breakdown.
3. Using Playwright, navigate to `/workload_dashboard`.
4. Apply Team filter for "Automation Team".
5. Verify total issues, hours, and allocation % match MCP response.
6. Verify per-user allocation data matches MCP response.

**Expected Result:**
- MCP response contains team-scoped dashboard data.
- Playwright dashboard values match the MCP response.

---

## TC-RFM-072 — View workload dashboard by user via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F072 Dashboard by user |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe has at least one workload issue assignment (from tc-06).

**Test Data:**
- User: john.doe (user_id from tc-03).

**Steps:**
1. Call MCP `dashboard` with user_id = john.doe's user ID (and team_id = Automation Team ID).
2. Validate MCP response:
   - Response contains dashboard data scoped to john.doe.
   - Shows total issues assigned to john.doe, total hours, overall allocation %.
3. Using Playwright, navigate to `/workload_dashboard`.
4. Apply User filter for john.doe.
5. Verify total issues, hours, and allocation % match the MCP response.

**Expected Result:**
- MCP response contains john.doe's personal dashboard data.
- Playwright UI values match the MCP response for john.doe's workload metrics.

---

## TC-RFM-073 — View workload dashboard by specific workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F073 Dashboard by workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" exists with at least 2 issue assignments (tc-06).

**Test Data:**
- Workload ID from TC-RFM-048.

**Steps:**
1. Call MCP `workload_show` with workload ID from TC-RFM-048 (gives workload-scoped data).
2. Validate MCP response:
   - Contains metrics for "QA Team June 2026" only.
   - Includes issue count, total planned hours, per-user breakdown.
3. Using Playwright, navigate to `/workload_dashboard`.
4. Apply Workload filter for "QA Team June 2026".
5. Compare all displayed metrics against MCP response values.

**Expected Result:**
- MCP response contains workload-specific data.
- Playwright UI values match MCP response for "QA Team June 2026".

---

## TC-RFM-074 — View workload dashboard by date range via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F074 Dashboard by date range |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue assignments in "QA Team June 2026" have dates within June 2026 (tc-06).

**Test Data:**
- Team ID = Automation Team.
- Date range: 2026-06-01 to 2026-06-30.

**Steps:**
1. Call MCP `dashboard` with team_id = Automation Team ID, from_date = "2026-06-01", to_date = "2026-06-30".
2. Validate MCP response:
   - Response contains dashboard data filtered to June 2026.
   - Assignments outside this range are excluded from metrics.
3. Using Playwright, navigate to `/workload_dashboard`.
4. Set Date From = 2026-06-01 and Date To = 2026-06-30.
5. Compare displayed metrics against MCP response values.

**Expected Result:**
- MCP response contains date-range-scoped dashboard data for June 2026.
- Playwright UI values match the MCP response.

---

## TC-RFM-075 — View available hours report via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F075 Available hours report |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "Automation Team" exists with members (tc-03).
- john.doe has approved leave 2026-06-23 to 2026-06-24 (TC-RFM-042, tc-04).

**Test Data:**
- Team ID = Automation Team.
- Date range: 2026-06-01 to 2026-06-30.

**Steps:**
1. Call MCP `available_hours_report` with team_id = Automation Team ID, from_date = "2026-06-01", to_date = "2026-06-30".
2. Validate MCP response:
   - Report contains available hours per team member.
   - john.doe's available hours are reduced on 2026-06-23 and 2026-06-24 (leave days).
3. Using Playwright, navigate to the Dashboard capacity/available hours view.
4. Verify john.doe's availability reflects the approved leave.

**Expected Result:**
- MCP report shows reduced availability for john.doe on leave dates.
- Playwright availability view reflects the same leave impact.

---

## TC-RFM-076 — View capacity report via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F076 Capacity report |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "Automation Team" exists with at least 2 members and at least 1 workload (tc-05 + tc-06).

**Test Data:**
- Team ID = Automation Team.

**Steps:**
1. Call MCP `capacity` with team_id = Automation Team ID.
2. Validate MCP response:
   - Response contains capacity data per team member.
   - Shows planned hours vs. available hours.
   - Over-allocated / under-allocated indicators present.
3. Using Playwright, navigate to `/workload_dashboard` capacity view.
4. Verify capacity figures shown in UI match MCP response values.

**Expected Result:**
- MCP response contains capacity data with planned vs. available hours per user.
- Playwright capacity view values are consistent with MCP response.

---

## TC-RFM-077 — Dashboard data consistency: MCP response matches Playwright UI

| Field | Value |
|-------|-------|
| **Module** | Workload Dashboard |
| **Feature** | RFM-F077 Dashboard consistency check |
| **Priority** | High |
| **Scenario Type** | Data Consistency |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" has Issue-A (jane.doe, 40h) and Issue-B (john.doe, 30h) (from tc-06).
- Total planned hours = 70.

**Test Data:**
- Team ID = Automation Team.
- Expected: 2 issues, 70 planned hours total.

**Steps:**
1. Call MCP `dashboard` with team_id = Automation Team ID.
2. Record all numeric values: total issues, total hours, allocation % per user.
3. Using Playwright, navigate to `/workload_dashboard` filtered to "Automation Team".
4. Record all numeric values visible in the UI.
5. Compare every MCP value against the corresponding UI value.
6. Note any discrepancy where MCP value ≠ UI value — file a bug if found.

**Expected Result:**
- Every dashboard metric in the MCP response exactly matches the Playwright UI.
- No discrepancy between MCP data and UI-rendered data.
- Total planned hours = 70 (Issue-A: 40h + Issue-B: 30h).
