# Test Cases — Workload Issue Assignment — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Workload — Issue Assignment |
| **TC Range** | TC-RFM-133 to TC-RFM-142 |
| **Total TCs** | 10 |
| **Execution Order** | Suite 6 — Run after Workload CRUD (tc-05) |
| **Feature Coverage** | RFM-F055 through RFM-F064 |

**Data Dependencies:**
- Workload "QA Team June 2026" must exist (TC-RFM-126, tc-05).
- "Automation Team" with john.doe and jane.doe as members (tc-03).
- Valid Redmine issues (RM-101, RM-102, RM-103, RM-104) must exist in the system.

---

## TC-RFM-133 — Add single issue to workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F055 Add issue to workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Workload "QA Team June 2026" exists (TC-RFM-126).
- A valid Redmine issue exists (use the first available issue ID found via `search_issues`).

**Test Data:**
- Workload ID from TC-RFM-126.
- Issue: first available issue ID (discover via MCP `search_issues` or `eligible_issues`).

**Steps:**
1. Call MCP `search_issues` or `eligible_issues` with workload ID to find assignable issues. Note first issue ID (call it Issue-A).
2. Call MCP `add_issue` with workload_id and Issue-A's ID.
3. Validate MCP response — confirms Issue-A added to the workload. Note the allocation ID.
4. Using Playwright, navigate to "QA Team June 2026" workload detail.
5. Verify Issue-A appears in the issue assignment table.

**Expected Result:**
- MCP confirms Issue-A added to the workload.
- Playwright UI shows Issue-A in the workload issue list.

---

## TC-RFM-134 — Add multiple issues to workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F056 Add multiple issues |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Workload "QA Team June 2026" exists (TC-RFM-126).
- At least 2 more issues are available (Issue-B and Issue-C).

**Test Data:**
- Workload ID from TC-RFM-126.
- Issue-B and Issue-C IDs (discovered via MCP).

**Steps:**
1. Call MCP `add_issue` with workload_id and Issue-B's ID. Confirm success.
2. Call MCP `add_issue` with workload_id and Issue-C's ID. Confirm success.
3. Call MCP `workload_show` to verify all 3 issues (A, B, C) are in the workload.
4. Using Playwright, navigate to "QA Team June 2026" workload detail.
5. Verify Issue-B and Issue-C appear in the issue assignment table.

**Expected Result:**
- Both issues added successfully via MCP.
- All added issues appear in the Playwright workload detail.

---

## TC-RFM-135 — Assign issue to user in workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F057 Assign issue to user |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-A is in the workload (from TC-RFM-133).
- john.doe is a member of "Automation Team".

**Test Data:**
- Allocation ID for Issue-A (from TC-RFM-133).
- Assignee: john.doe (user_id from tc-03).

**Steps:**
1. Call MCP `update_planned_hours` or the allocation update tool with Issue-A's allocation ID and user_id = john.doe.
2. Validate MCP response — confirms Issue-A assigned to john.doe in the workload.
3. Using Playwright, navigate to "QA Team June 2026" detail.
4. Locate Issue-A — verify Assignee column shows john.doe.

**Expected Result:**
- MCP confirms Issue-A is assigned to john.doe.
- Playwright UI shows john.doe as assignee for Issue-A.

---

## TC-RFM-136 — Assign issue with planned hours via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F058 Assign with planned hours |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-A is in the workload assigned to john.doe (from TC-RFM-135).

**Test Data:**
- Allocation ID for Issue-A.
- Planned hours: 20

**Steps:**
1. Call MCP `update_planned_hours` with Issue-A's allocation ID and planned_hours = 20.
2. Validate MCP response — confirms 20 planned hours set.
3. Using Playwright, navigate to "QA Team June 2026" detail.
4. Locate Issue-A — verify Planned Hours column shows 20.

**Expected Result:**
- MCP confirms 20 planned hours set for Issue-A.
- Playwright UI shows 20 hours for Issue-A in the workload.

---

## TC-RFM-137 — Assign issue with start and end dates via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F059 Assign with date range |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-A is in the workload (from TC-RFM-133).

**Test Data:**
- Allocation ID for Issue-A.
- Start date: 2026-06-01
- End date: 2026-06-15

**Steps:**
1. Call MCP `allocation_update_dates` with Issue-A's allocation ID, start_date = "2026-06-01", end_date = "2026-06-15".
2. Validate MCP response — confirms date range set.
3. Using Playwright, navigate to "QA Team June 2026" detail.
4. Locate Issue-A — verify Start Date = 2026-06-01 and End Date = 2026-06-15.

**Expected Result:**
- MCP confirms date range set correctly for Issue-A.
- Playwright UI reflects the correct start and end dates.

---

## TC-RFM-138 — Update issue workload hours via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F060 Update issue hours |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-A in workload has 20 planned hours (from TC-RFM-136).

**Test Data:**
- Allocation ID for Issue-A.
- New planned hours: 40

**Steps:**
1. Call MCP `update_planned_hours` with Issue-A allocation ID and planned_hours = 40.
2. Validate MCP response — confirms hours updated from 20 to 40.
3. Using Playwright, navigate to "QA Team June 2026" detail.
4. Locate Issue-A — verify Planned Hours shows 40.

**Expected Result:**
- MCP confirms hours updated from 20 to 40.
- Playwright UI shows 40 planned hours for Issue-A.

---

## TC-RFM-139 — Remove issue from workload via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F061 Remove issue from workload |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-C is in "QA Team June 2026" workload (from TC-RFM-134).

**Test Data:**
- Workload ID from TC-RFM-126.
- Issue-C's ID.

**Steps:**
1. Call MCP `remove_issue` with workload_id and Issue-C's ID.
2. Validate MCP response — confirms Issue-C removed.
3. Using Playwright, navigate to "QA Team June 2026" detail.
4. Verify Issue-C is no longer in the issue assignment table.
5. Confirm the workload itself still exists.

**Expected Result:**
- MCP confirms Issue-C removed.
- Playwright UI no longer shows Issue-C in the workload.
- The workload "QA Team June 2026" itself still exists.

---

## TC-RFM-140 — Reassign issue to another user via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F062 Reassign issue to user |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Issue-A is assigned to john.doe in the workload (from TC-RFM-135).
- jane.doe is a member of "Automation Team" (from TC-RFM-109).

**Test Data:**
- Issue-A allocation ID.
- New assignee: jane.doe (user_id from tc-03).

**Steps:**
1. Call MCP allocation update tool with Issue-A allocation ID and user_id = jane.doe.
2. Validate MCP response — confirms Issue-A now assigned to jane.doe.
3. Using Playwright, navigate to "QA Team June 2026" detail.
4. Locate Issue-A — verify Assignee shows jane.doe.

**Expected Result:**
- MCP confirms Issue-A assigned to jane.doe.
- Playwright UI shows jane.doe as assignee for Issue-A.

---

## TC-RFM-141 — Assign issue with all parameters via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F063 Full issue assignment |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Workload "QA Team June 2026" exists.
- Issue-B is in the workload (from TC-RFM-134).
- john.doe is a team member.

**Test Data:**
- Issue-B allocation ID.
- Planned hours: 30
- Start date: 2026-06-10
- End date: 2026-06-30
- Assignee: john.doe

**Steps:**
1. Call MCP `update_planned_hours` with Issue-B allocation ID and planned_hours = 30.
2. Call MCP `allocation_update_dates` with Issue-B allocation ID, start = "2026-06-10", end = "2026-06-30".
3. Call MCP allocation update with user_id = john.doe.
4. Call MCP `workload_show` to verify all parameters on Issue-B.
5. Using Playwright, navigate to "QA Team June 2026" detail.
6. Locate Issue-B — verify hours = 30, start = 2026-06-10, end = 2026-06-30, assignee = john.doe.

**Expected Result:**
- MCP confirms all parameters are set on Issue-B.
- Playwright UI shows all values matching for Issue-B.

---

## TC-RFM-142 — View workload details with all assignments via MCP

| Field | Value |
|-------|-------|
| **Module** | Workload Issue Assignment |
| **Feature** | RFM-F064 Workload with assignments |
| **Priority** | High |
| **Scenario Type** | Data Consistency |
| **User Role** | Admin |

**Preconditions:**
- "QA Team June 2026" has Issue-A (assigned to jane.doe, 40h) and Issue-B (assigned to john.doe, 30h).

**Test Data:**
- Workload ID from TC-RFM-126.

**Steps:**
1. Call MCP `workload_show` with workload ID from TC-RFM-126.
2. Record all values: issue list, assignees, planned hours, dates.
3. Using Playwright, open "QA Team June 2026" workload detail.
4. Compare every MCP value against the corresponding UI-displayed value.
5. Verify issue count, assignees, hours, and dates all match between MCP and UI.

**Expected Result:**
- Every issue assignment field in the MCP response matches the Playwright UI.
- No field discrepancy between MCP response data and UI-rendered data.
