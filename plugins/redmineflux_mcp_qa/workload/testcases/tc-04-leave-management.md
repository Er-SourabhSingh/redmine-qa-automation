# Test Cases — Leave Management — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Leave Management |
| **TC Range** | TC-RFM-038 to TC-RFM-047 |
| **Total TCs** | 10 |
| **Execution Order** | Suite 4 — Run after Team Management (tc-03) |
| **Feature Coverage** | RFM-F038 through RFM-F047 |

**Data Dependencies:**
- "Automation Team" must exist (created in TC-RFM-023, tc-03).
- john.doe, jane.doe, mike.smith must be members of "Automation Team" (TC-RFM-028 to TC-RFM-032).
- jane.doe has Manage Leave permission (TC-RFM-035) — she acts as Leave Approver.

---

## Leave Operations

---

## TC-RFM-038 — Apply leave via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Operations |
| **Feature** | RFM-F038 Apply leave |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin (on behalf of john.doe) |

**Preconditions:**
- john.doe is a member of "Automation Team" (from TC-RFM-028/030).
- No existing leave for john.doe in the June 16-18 range.

**Test Data:**
- User: john.doe (user_id from tc-03)
- Leave type: planned
- From: 2026-06-16
- To: 2026-06-18
- Reason: "Planned vacation leave"

**Steps:**
1. Call MCP `leave_create` with user_id = john.doe, leave_type = "planned", start_date = "2026-06-16", end_date = "2026-06-18", reason = "Planned vacation leave".
2. Validate MCP response:
   - Response confirms leave request created.
   - Response includes a leave request ID.
   - Response shows status = "Pending".
   - Response shows start_date = 2026-06-16, end_date = 2026-06-18.
   - Note the leave ID for TC-RFM-039, TC-RFM-040, TC-RFM-041.
3. Using Playwright, navigate to `/rf_leaves`.
4. Click "Team Approvals" tab (or filter for john.doe).
5. Verify the leave request appears with status "Pending" and correct dates.

**Expected Result:**
- MCP confirms leave request created with ID and Pending status.
- Playwright shows the leave request for john.doe with correct dates and Pending status.

---

## TC-RFM-039 — View leave requests via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Operations |
| **Feature** | RFM-F039 View leave requests |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- At least one leave request exists for john.doe (from TC-RFM-038).

**Test Data:**
- User: john.doe (user_id)

**Steps:**
1. Call MCP `leaves_list` with user_id = john.doe's user ID.
2. Validate MCP response:
   - Response contains a list of john.doe's leave requests.
   - Each record includes: request ID, leave type, start_date, end_date, status.
   - The leave from TC-RFM-038 is present with status = "Pending".
3. Using Playwright, navigate to `/rf_leaves` → "Team Approvals" tab.
4. Verify the count and details of john.doe's leave requests match the MCP response.

**Expected Result:**
- MCP returns all leave requests for john.doe.
- Playwright leave list for john.doe matches the MCP response.

---

## TC-RFM-040 — Read leave request details via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Operations |
| **Feature** | RFM-F040 Read leave details |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Leave request from TC-RFM-038 exists (leave ID noted).

**Test Data:**
- Leave ID from TC-RFM-038.

**Steps:**
1. Call MCP `leave_show` with leave_id from TC-RFM-038.
2. Validate MCP response for all detail fields:
   - Request ID
   - Requester: john.doe
   - Leave type: planned
   - start_date: 2026-06-16
   - end_date: 2026-06-18
   - Number of days
   - Status: Pending
3. Using Playwright, navigate to `/rf_leaves` and open the leave request detail.
4. Compare every field in the MCP response with the corresponding UI value.

**Expected Result:**
- MCP response contains a complete leave request detail record.
- Every field value matches the UI-displayed data.

---

## TC-RFM-041 — Cancel leave request via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Operations |
| **Feature** | RFM-F041 Cancel leave |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Leave request from TC-RFM-038 is in Pending status (leave ID noted).

**Test Data:**
- Leave ID from TC-RFM-038.

**Steps:**
1. Call MCP `leave_cancel` with leave_id from TC-RFM-038.
2. Validate MCP response:
   - Response confirms leave request cancelled.
   - Response shows status = "Cancelled".
3. Call MCP `leave_show` to confirm status = "Cancelled".
4. Using Playwright, navigate to `/rf_leaves` and locate the request.
5. Verify the status shows "Cancelled".

**Expected Result:**
- MCP confirms cancellation with status Cancelled.
- Playwright shows the leave request with Cancelled status.

---

## Leave Approval Workflow

---

## TC-RFM-042 — Approve leave request via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Approval |
| **Feature** | RFM-F042 Approve leave |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin (jane.doe has Manage Leave permission) |

**Preconditions:**
- A fresh Pending leave request exists for john.doe (create new one since TC-RFM-041 cancelled the previous).

**Test Data:**
- New leave: john.doe, leave_type = "planned", start_date = "2026-06-23", end_date = "2026-06-24", reason = "Approval test leave"

**Steps:**
1. Call MCP `leave_create` for john.doe with dates 2026-06-23 to 2026-06-24. Note new leave ID.
2. Call MCP `leave_approve` with leave_id from step 1.
3. Validate MCP response:
   - Response confirms leave approved.
   - Response shows status = "Approved".
4. Call MCP `leave_show` to confirm status = "Approved".
5. Using Playwright, navigate to `/rf_leaves` → Team Approvals.
6. Verify the leave request shows status "Approved".

**Expected Result:**
- MCP confirms approval with status Approved.
- Playwright shows the leave request with Approved status.

---

## TC-RFM-043 — Reject leave request via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Approval |
| **Feature** | RFM-F043 Reject leave |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- A fresh Pending leave request exists for john.doe.

**Test Data:**
- New leave: john.doe, leave_type = "planned", start_date = "2026-06-25", end_date = "2026-06-26", reason = "Rejection test leave"
- Rejection reason: "Team unavailability"

**Steps:**
1. Call MCP `leave_create` for john.doe with dates 2026-06-25 to 2026-06-26. Note leave ID.
2. Call MCP `leave_reject` with leave_id and reason = "Team unavailability".
3. Validate MCP response:
   - Response confirms rejection.
   - Response shows status = "Rejected".
4. Call MCP `leave_show` to confirm status = "Rejected".
5. Using Playwright, navigate to `/rf_leaves` → Team Approvals.
6. Verify the leave request shows status "Rejected".

**Expected Result:**
- MCP confirms rejection with status Rejected.
- Playwright shows the leave request with Rejected status.

---

## TC-RFM-044 — View pending leave approvals via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Approval |
| **Feature** | RFM-F044 View pending approvals |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- At least one Pending leave request exists (create fresh for mike.smith).

**Test Data:**
- New pending leave: mike.smith, leave_type = "sick", start_date = "2026-06-30", end_date = "2026-06-30", reason = "Pending approval test"

**Steps:**
1. Call MCP `leave_create` for mike.smith with date 2026-06-30. Note leave ID.
2. Call MCP `leaves_list` with status = "pending".
3. Validate MCP response:
   - Response contains a list of pending leave requests.
   - mike.smith's leave from step 1 is present.
   - Each record includes: request ID, requester, leave type, start_date, end_date.
4. Using Playwright, navigate to `/rf_leaves` → "Team Approvals" tab.
5. Verify the pending leave count and details match the MCP response.

**Expected Result:**
- MCP returns all pending leave requests.
- Playwright pending approvals list matches the MCP response.

---

## Permission Testing

---

## TC-RFM-045 — Admin can view all leave requests via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Permissions |
| **Feature** | RFM-F045 Admin full leave access |
| **Priority** | High |
| **Scenario Type** | Permission |
| **User Role** | Admin |

**Preconditions:**
- Multiple leave requests exist for multiple users (from TC-RFM-038 through TC-RFM-044).

**Test Data:**
- No specific test data — call leaves_list without filters.

**Steps:**
1. Call MCP `leaves_list` (no filters).
2. Validate MCP response:
   - Response contains leaves from multiple users (john.doe, mike.smith at minimum).
   - Leaves in different statuses are visible (Pending, Approved, Rejected, Cancelled).
3. Using Playwright, navigate to `/rf_leaves` → "Team Approvals" tab.
4. Verify all leave statuses are visible and match MCP response.

**Expected Result:**
- Admin MCP can see all leave requests regardless of user or status.
- Playwright Team Approvals tab shows the same data.

---

## TC-RFM-046 — Leave calculate days via MCP

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Utility |
| **Feature** | RFM-F046 Calculate leave days |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- India 2026 holiday schema exists (from TC-RFM-001, tc-01).
- The active holiday scheme is applied to the system.

**Test Data:**
- Date range: 2026-06-15 to 2026-06-19 (Mon to Fri — 5 working days)

**Steps:**
1. Call MCP `leave_calculate_days` with start_date = "2026-06-15", end_date = "2026-06-19".
2. Validate MCP response:
   - Response includes total days, working days, and excluded days (weekends/holidays).
   - Working days = 5 (June 15 Mon, 16 Tue, 17 Wed, 18 Thu, 19 Fri — no holidays in this range).
3. Compare the calculation with a manual count.

**Expected Result:**
- MCP returns correct working day count for a standard work week.
- Total days = 5, working days = 5, excluded = 0 (assuming no holidays in this range).

---

## TC-RFM-047 — View team members on leave on a specific date

| Field | Value |
|-------|-------|
| **Module** | Leave Management — Operations |
| **Feature** | RFM-F047 Team on leave today |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe has an approved leave for 2026-06-23 to 2026-06-24 (from TC-RFM-042).

**Test Data:**
- Date to check: 2026-06-23

**Steps:**
1. Call MCP `team_on_leave` with date = "2026-06-23".
2. Validate MCP response:
   - Response lists john.doe as on leave on 2026-06-23.
   - Shows leave type and date range.
3. Using Playwright, navigate to `/rf_leaves` → Team Approvals.
4. Verify john.doe's approved leave is visible for that date.

**Expected Result:**
- MCP returns john.doe as on leave on 2026-06-23.
- Playwright confirms the approved leave is visible.
