# Test Cases — Workload CRUD — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Workload — CRUD |
| **TC Range** | TC-RFM-126 to TC-RFM-132 |
| **Total TCs** | 7 |
| **Execution Order** | Suite 5 — Run after Team Management (tc-03) |
| **Feature Coverage** | RFM-F048 through RFM-F054 |

**Data Dependencies:**
- "Automation Team" must exist (TC-RFM-101, tc-03).
- "India 2026" holiday schema must exist (TC-RFM-079, tc-01).
- john.doe, jane.doe must be members of "Automation Team" (tc-03).

---

## TC-RFM-126 — Create workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F048 Create workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "Automation Team" exists (TC-RFM-101).
- No workload named "QA Team June 2026" exists.

**Test Data:**
- Workload name: QA Team June 2026
- Team: Automation Team (team_id from TC-RFM-101)

**Steps:**
1. Call MCP `workload_create` with name = "QA Team June 2026" and team_id from TC-RFM-101.
2. Validate MCP response:
   - Response confirms creation.
   - Response includes workload name "QA Team June 2026" and a workload ID.
   - Note the workload ID for all subsequent workload tests.
3. Using Playwright, navigate to `/rf_workloads`.
4. Verify "QA Team June 2026" appears in the workload list.
5. Click the workload to open its detail page and verify the name.

**Expected Result:**
- MCP response confirms creation with workload ID and name.
- "QA Team June 2026" is visible in the Playwright Workloads list.

---

## TC-RFM-127 — Read workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F049 Read workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Workload "QA Team June 2026" exists (from TC-RFM-126).

**Test Data:**
- Workload ID from TC-RFM-126.

**Steps:**
1. Call MCP `workload_show` with workload ID from TC-RFM-126.
2. Validate MCP response:
   - Response contains workload name "QA Team June 2026".
   - Response contains workload ID.
   - Response contains team, date range, allocation data.
3. Using Playwright, navigate to `/rf_workloads` and open "QA Team June 2026" detail.
4. Compare UI-displayed values (name, dates, status) against MCP response data.

**Expected Result:**
- MCP response returns the workload record with all fields.
- UI workload data matches the MCP response values.

---

## TC-RFM-128 — Edit workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F050 Update workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Workload "QA Team June 2026" exists (from TC-RFM-126).

**Test Data:**
- Workload ID from TC-RFM-126.
- Updated allocation: 80%

**Steps:**
1. Call MCP `workload_update` with workload ID and allocation = 80 (or the supported update parameter).
2. Validate MCP response — confirms update and shows updated value.
3. Using Playwright, navigate to the "QA Team June 2026" detail page.
4. Verify the updated field reflects 80%.

**Expected Result:**
- MCP response confirms the workload was updated.
- Playwright UI shows the updated value on the workload detail page.

---

## TC-RFM-129 — Delete workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F051 Delete workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- A disposable workload "Delete Test Workload" does not exist yet.

**Test Data:**
- Workload to create and delete: "Delete Test Workload"
- Team: Automation Team

**Steps:**
1. Call MCP `workload_create` with name = "Delete Test Workload", team_id = Automation Team ID. Note ID.
2. Call MCP `workload_delete` with that workload ID.
3. Validate MCP response — confirms successful deletion.
4. Using Playwright, navigate to `/rf_workloads`.
5. Confirm "Delete Test Workload" is no longer visible.
6. Call MCP `workload_show` with the deleted ID — expect not-found response.

**Expected Result:**
- MCP confirms deletion.
- Workload no longer appears in Playwright UI.
- Subsequent MCP read returns not-found.

---

## TC-RFM-130 — Search workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F052 Search workload |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" exists (from TC-RFM-126).
- At least one workload without "QA Team" in the name exists.

**Test Data:**
- Search keyword: QA Team

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID (filter by team to avoid BUG-RFM-001 pattern for large teams).
2. Validate MCP response:
   - "QA Team June 2026" appears in results.
   - All returned workloads belong to Automation Team.
3. Using Playwright, navigate to `/rf_workloads`.
4. Use the search/filter field to search for "QA Team" or filter by "Automation Team".
5. Verify Playwright results are consistent with MCP response.

**Expected Result:**
- MCP returns workloads matching the filter.
- Playwright UI results are consistent with MCP results.

---

## TC-RFM-131 — List workloads for team via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F053 List workloads by team |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" exists for Automation Team (from TC-RFM-126).

**Test Data:**
- Team ID from TC-RFM-101.

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID.
2. Validate MCP response:
   - Response contains "QA Team June 2026".
   - Each record includes workload ID, name, status.
3. Using Playwright, navigate to `/rf_workloads` and filter by "Automation Team".
4. Verify count and workload names match the MCP response.

**Expected Result:**
- MCP returns all workloads for Automation Team.
- Playwright filtered list matches MCP response count and names.

---

## TC-RFM-132 — View workload details via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload CRUD |
| **Feature** | RFM-F054 View workload details |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Workload "QA Team June 2026" exists with at least one issue assigned (issues assigned in tc-06).
- If no issues are yet assigned, verify the workload header data only.

**Test Data:**
- Workload ID from TC-RFM-126.

**Steps:**
1. Call MCP `workload_show` with workload ID from TC-RFM-126.
2. Validate MCP response for all detail fields:
   - Workload name
   - Team (Automation Team)
   - Date range (if set)
   - Overall allocation percentage
   - List of assigned issues (may be empty before tc-06)
3. Using Playwright, navigate to the workload detail page for "QA Team June 2026".
4. Verify each field value from the MCP response matches the UI.

**Expected Result:**
- MCP returns a complete workload detail record.
- Every field value in the MCP response is consistent with the Playwright UI display.
