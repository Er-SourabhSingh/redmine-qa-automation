# Test Cases — Permission Testing — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Cross-Module Permission Testing |
| **TC Range** | TC-RFM-160 to TC-RFM-165 |
| **Total TCs** | 6 |
| **Execution Order** | Suite 10 — Run last (depends on all prior suites) |
| **Feature Coverage** | RFM-F082 through RFM-F087 |

---

## TC-RFM-160 — Admin can perform all operations across all modules

| Field | Value |
|-------|-------|
| **Module** | Permission Testing |
| **Feature** | RFM-F082 Admin full access |
| **Priority** | High |
| **Scenario Type** | Permission — Positive |
| **User Role** | Admin |

**Preconditions:**
- MCP session authenticated as Admin.
- Necessary test data exists (workload, team, skill, leave, holiday schema).

**Test Data:**
- Admin MCP prompts covering one operation per module.

**Steps:**
1. (As Admin) Issue one representative operation per module:
   - Workload: `"List all workloads"` — verify success.
   - Dashboard: `"Show workload dashboard for QA Team"` — verify success.
   - Team: `"Show team Automation Team"` — verify success.
   - Skill: `"Show skill matrix"` — verify success.
   - Leave: `"Show john.doe's leave requests"` — verify success.
   - Holiday Schema: `"Show holiday schema India 2026"` — verify success.
   - Settings: `"Show Redmineflux plugin settings"` — verify success.
2. Verify each MCP response returns a success status (no access denied errors).
3. Using Playwright, confirm the data is visible in the UI for each module.

**Expected Result:**
- Admin MCP responses for all 7 modules return success without any access denied errors.
- All module data is visible in Playwright UI.

---

## TC-RFM-161 — User with permission can perform allowed operations

| Field | Value |
|-------|-------|
| **Module** | Permission Testing |
| **Feature** | RFM-F083 User with permission |
| **Priority** | High |
| **Scenario Type** | Permission — Positive |
| **User Role** | User With Manage Workload Permission |

**Preconditions:**
- User "permitted.user" exists with Manage Workload permission in at least one team.
- MCP session authenticated as permitted.user.
- Workload "QA Team June 2026" and team "Automation Team" exist.

**Test Data:**
- Permitted operations to test: create workload, list workloads, add issue to workload, view team.

**Steps:**
1. (As permitted.user) Issue MCP prompt: `"List all workloads"`.
2. Verify response returns workloads without access denied.
3. Issue MCP prompt: `"Create workload Permission Test Workload"`.
4. Verify response confirms creation.
5. Issue MCP prompt: `"Add issue RM-101 to workload Permission Test Workload"`.
6. Verify response confirms issue added.
7. Using Playwright, verify the new workload and issue assignment appear in the UI.
8. Clean up: Issue MCP prompt `"Delete workload Permission Test Workload"`.

**Expected Result:**
- All permitted operations succeed for permitted.user.
- Playwright confirms created data is visible in the UI.
- No access denied errors for operations the user has permission to perform.

---

## TC-RFM-162 — User without permission is denied restricted operations

| Field | Value |
|-------|-------|
| **Module** | Permission Testing |
| **Feature** | RFM-F084 User without permission |
| **Priority** | High |
| **Scenario Type** | Permission — Negative |
| **User Role** | User Without Permissions |

**Preconditions:**
- User "no.perm.user" exists with no special Redmineflux permissions.
- MCP session authenticated as no.perm.user.

**Test Data:**
- Restricted operations: create workload, delete workload, create team, delete team, create skill, manage holiday schemas, read settings.

**Steps:**
1. (As no.perm.user) For each restricted operation, issue an MCP prompt and capture the response:
   - `"Create workload No Perm Test"` → expect access denied.
   - `"Delete workload QA Team June 2026"` → expect access denied.
   - `"Create team No Perm Team"` → expect access denied.
   - `"Create skill No Perm Skill"` → expect access denied.
   - `"Create holiday schema No Perm 2026"` → expect access denied.
   - `"Show Redmineflux plugin settings"` → expect access denied or restricted response.
2. For each operation, verify the MCP response contains a clear error or access denied message.
3. Using Playwright, verify no data was created, modified, or deleted in any module.

**Expected Result:**
- All 6 restricted MCP operations return access denied or permission error.
- No data is created, modified, or deleted in any module.
- Playwright confirms no new records exist as a result of the denied operations.

---

## TC-RFM-163 — Team manager can manage team-level operations

| Field | Value |
|-------|-------|
| **Module** | Permission Testing |
| **Feature** | RFM-F085 Team manager access |
| **Priority** | High |
| **Scenario Type** | Permission — Positive |
| **User Role** | Team Manager |

**Preconditions:**
- User "team.manager" exists with Team Manager role/permission.
- MCP session authenticated as team.manager.
- "Automation Team" exists.

**Test Data:**
- Team operations: create team, read team, add member, remove member, update member role.

**Steps:**
1. (As team.manager) Issue MCP prompt: `"Create team Manager Test Team"`.
2. Verify response confirms team created.
3. Issue MCP prompt: `"Add john.doe to Manager Test Team"`.
4. Verify response confirms member added.
5. Issue MCP prompt: `"Update john.doe role in Manager Test Team to Team Lead"`.
6. Verify response confirms role updated.
7. Issue MCP prompt: `"Remove john.doe from Manager Test Team"`.
8. Verify response confirms member removed.
9. Using Playwright, verify each step's outcome in the Teams UI.
10. Clean up: Issue MCP prompt `"Delete Manager Test Team"`.

**Expected Result:**
- All team-level operations succeed for team.manager.
- Playwright confirms each team management action in the UI.

---

## TC-RFM-164 — Leave approver can only manage leave operations

| Field | Value |
|-------|-------|
| **Module** | Permission Testing |
| **Feature** | RFM-F086 Leave approver access |
| **Priority** | High |
| **Scenario Type** | Permission — Boundary |
| **User Role** | Leave Approver |

**Preconditions:**
- User "leave.approver" exists with Leave Approver role/permission.
- MCP session authenticated as leave.approver.
- At least one Pending leave request exists.

**Test Data:**
- Allowed: show pending approvals, approve leave, reject leave.
- Not allowed: create workload, create team, manage holiday schemas, update settings.

**Steps:**
1. (As leave.approver) Test allowed operations:
   - `"Show pending leave approvals"` → expect success with leave list.
   - Take one pending request ID from step 1 response.
   - `"Approve leave request [ID]"` → expect success.
2. Verify Playwright shows the approved status.
3. Test restricted operations:
   - `"Create workload Approver Test"` → expect access denied.
   - `"Create team Approver Team"` → expect access denied.
   - `"Show Redmineflux plugin settings"` → expect access denied or restricted.
4. Verify all restricted operations return access denied in MCP response.
5. Using Playwright, confirm no workload or team was created.

**Expected Result:**
- Leave operations (view pending, approve) succeed for leave.approver.
- Non-leave operations (workload, team, settings) return access denied.
- Playwright confirms no unauthorized data was created.

---

## TC-RFM-165 — Unauthorized access returns proper MCP error messages

| Field | Value |
|-------|-------|
| **Module** | Permission Testing |
| **Feature** | RFM-F087 Error messages |
| **Priority** | High |
| **Scenario Type** | Negative / Error Handling |
| **User Role** | User Without Permissions |

**Preconditions:**
- User "no.perm.user" exists with no special permissions.
- MCP session authenticated as no.perm.user.

**Test Data:**
- Multiple restricted operations across modules.

**Steps:**
1. (As no.perm.user) Issue the following restricted MCP prompts and capture responses:
   - `"Delete workload QA Team June 2026"`
   - `"Delete team Automation Team"`
   - `"Delete skill Selenium"`
   - `"Approve leave request [any-pending-ID]"`
   - `"Delete holiday schema India 2026"`
   - `"Update Redmineflux setting default_allocation_percent to 99"`
2. For each response, validate:
   - Response is NOT a server error (no 500-level error or unhandled exception message).
   - Response contains a human-readable error message indicating the operation is not allowed.
   - Error message does NOT leak internal implementation details (stack traces, SQL, file paths).
   - Error message clearly indicates the nature of the denial (e.g., "Access denied", "Insufficient permissions", "You do not have permission to...").
3. Using Playwright, confirm none of the above operations affected any data.

**Expected Result:**
- All 6 unauthorized operations return clear, user-readable error messages via MCP.
- No 500-level errors or internal error details are exposed.
- No data is modified in any module.
- Playwright confirms all data remains unchanged.
