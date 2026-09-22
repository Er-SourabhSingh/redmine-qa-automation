# Test Cases — Workload Filtering — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Workload — Filtering |
| **TC Range** | TC-RFM-143 to TC-RFM-148 |
| **Total TCs** | 6 |
| **Execution Order** | Suite 7 — Run after Workload Issue Assignment (tc-06) |
| **Feature Coverage** | RFM-F065 through RFM-F070 |

**Data Dependencies:**
- Workload "QA Team June 2026" exists with issues assigned (tc-05 + tc-06).
- john.doe and jane.doe have assignments in the workload (tc-06).
- "Automation Team" exists (tc-03).

---

## TC-RFM-143 — Filter workloads by user via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Filtering |
| **Feature** | RFM-F065 Filter by user |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe has at least one issue assigned in "QA Team June 2026" (from tc-06).

**Test Data:**
- User: john.doe (user_id from tc-03).

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID and look for john.doe's assignments.
2. Alternatively call MCP `search_members` to find workloads with john.doe.
3. Validate MCP response — returns workloads/assignments containing john.doe.
4. Using Playwright, navigate to `/rf_workloads`.
5. Apply the User filter for john.doe.
6. Verify Playwright-filtered results match MCP response.

**Expected Result:**
- MCP returns workloads containing john.doe's assignments.
- Playwright filtered results are consistent with the MCP response.

---

## TC-RFM-144 — Filter workloads by team via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Filtering |
| **Feature** | RFM-F066 Filter by team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" is associated with "Automation Team".
- At least one workload from a different team exists.

**Test Data:**
- Team: Automation Team (team_id from TC-RFM-101).

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID.
2. Validate MCP response:
   - "QA Team June 2026" appears in results.
   - All returned workloads belong to Automation Team.
3. Using Playwright, navigate to `/rf_workloads` and filter by "Automation Team".
4. Verify Playwright results match MCP response.

**Expected Result:**
- MCP returns only Automation Team workloads.
- Playwright filtered results match the MCP response.

---

## TC-RFM-145 — Filter workloads by date range via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Filtering |
| **Feature** | RFM-F067 Filter by date range |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" has issues with dates within June 2026 (from tc-06 assignments).

**Test Data:**
- Date range: from_date = 2026-06-01, to_date = 2026-06-30.

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID, from_date = "2026-06-01", to_date = "2026-06-30".
2. Validate MCP response:
   - "QA Team June 2026" is included (it has June 2026 assignments).
3. Using Playwright, navigate to `/rf_workloads`.
4. Apply Date From = 2026-06-01 and Date To = 2026-06-30 filters.
5. Verify Playwright results match the MCP response.

**Expected Result:**
- MCP returns workloads active during June 2026.
- Playwright filtered results are consistent with the MCP response.

---

## TC-RFM-146 — Filter workloads by issue via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Filtering |
| **Feature** | RFM-F068 Filter by issue |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-A is assigned in "QA Team June 2026" (from TC-RFM-133).

**Test Data:**
- Issue-A ID (discovered in TC-RFM-133).

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID.
2. Check the response to identify the workload containing Issue-A.
3. Validate that "QA Team June 2026" is included and Issue-A is present.
4. Using Playwright, navigate to `/rf_workloads`.
5. Apply an issue filter for Issue-A (if available in UI).
6. Verify the result shows the workload containing Issue-A.

**Expected Result:**
- MCP response confirms Issue-A is in "QA Team June 2026".
- Playwright confirms the workload containing Issue-A is visible.

---

## TC-RFM-147 — Filter workloads by status via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Filtering |
| **Feature** | RFM-F069 Filter by status |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" exists with status Active (or default status).

**Test Data:**
- Team ID = Automation Team.

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID.
2. Observe the status field in the response for "QA Team June 2026".
3. Note the actual status value returned by MCP.
4. Using Playwright, navigate to `/rf_workloads`.
5. Apply the Status filter (if available) to match the MCP-returned status.
6. Verify Playwright results match MCP response.
7. If no status filter exists in the UI or MCP, document in memory.md and mark as N/A.

**Expected Result:**
- MCP returns workloads with their status values.
- Playwright filter (if available) results match the MCP response.
- If status filter is not supported, behavior is documented.

---

## TC-RFM-148 — Workload search via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Filtering |
| **Feature** | RFM-F070 Search workloads |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" exists (from TC-RFM-126).
- At least one other workload exists with a different name.

**Test Data:**
- Search keyword: QA Team

**Steps:**
1. Call MCP `workloads_list` with team_id = Automation Team ID.
2. Validate all returned workloads belong to Automation Team.
3. Verify "QA Team June 2026" is present in the results.
4. Using Playwright, navigate to `/rf_workloads`.
5. Use the search/filter input to search for "QA Team".
6. Verify Playwright search results include "QA Team June 2026".

**Expected Result:**
- MCP returns results including "QA Team June 2026".
- Playwright search results are consistent with MCP results.
