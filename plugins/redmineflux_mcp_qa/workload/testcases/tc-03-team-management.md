# Test Cases — Team Management — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Team Management |
| **TC Range** | TC-RFM-101 to TC-RFM-115 |
| **Total TCs** | 15 |
| **Execution Order** | Suite 3 — Run after Skill Management (tc-02) |
| **Feature Coverage** | RFM-F023 through RFM-F037 |

**Data Dependencies:**
- Skill "Selenium" must exist (created in TC-RFM-088, tc-02).
- Users: john.doe, jane.doe, mike.smith, alex.brown must exist in Redmine.

---

## Team CRUD

---

## TC-RFM-101 — Create team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — CRUD |
| **Feature** | RFM-F023 Create team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- No team named "Automation Team" exists.

**Test Data:**
- Team name: Automation Team

**Steps:**
1. Call MCP `team_create` with name = "Automation Team".
2. Validate MCP response:
   - Response includes team name "Automation Team" and a team ID.
   - Note the team ID — used in ALL subsequent Team, Leave, Workload, and Skill tests.
3. Using Playwright, navigate to `/rf_teams`.
4. Verify "Automation Team" appears in the team list.
5. Click "Automation Team" to open team detail and verify team name.

**Expected Result:**
- MCP confirms team creation with ID and name.
- "Automation Team" is visible in the Playwright Teams list.

---

## TC-RFM-102 — Read team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — CRUD |
| **Feature** | RFM-F024 Read team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Team "Automation Team" exists (from TC-RFM-101).

**Test Data:**
- Team ID from TC-RFM-101.

**Steps:**
1. Call MCP `team_data` with team ID from TC-RFM-101.
2. Validate MCP response:
   - Response contains team name, team ID, description (if any), member list.
3. Using Playwright, navigate to `/rf_teams` and open "Automation Team" detail.
4. Compare team name and member count with MCP response values.

**Expected Result:**
- MCP returns team record with name, ID, and member data.
- UI team data matches MCP response values.

---

## TC-RFM-103 — Edit team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — CRUD |
| **Feature** | RFM-F025 Update team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Team "Automation Team" exists (from TC-RFM-101).

**Test Data:**
- Team ID from TC-RFM-101.
- New description: "Test automation engineers team"

**Steps:**
1. Call MCP `team_update` with team ID and description = "Test automation engineers team".
2. Validate MCP response — confirms description updated.
3. Using Playwright, navigate to "Automation Team" detail page.
4. Verify the description field shows "Test automation engineers team".

**Expected Result:**
- MCP confirms description updated.
- Playwright UI shows the updated description for "Automation Team".

---

## TC-RFM-104 — Delete team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — CRUD |
| **Feature** | RFM-F026 Delete team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- A team named "Delete Test Team" does not exist yet.

**Test Data:**
- Team to create and delete: "Delete Test Team"

**Steps:**
1. Call MCP `team_create` with name = "Delete Test Team". Note the ID.
2. Call MCP `team_delete` with that team ID.
3. Validate MCP response — confirms successful deletion.
4. Using Playwright, navigate to `/rf_teams`.
5. Confirm "Delete Test Team" is no longer visible.
6. Call MCP `team_data` with the deleted ID — expect not-found response.

**Expected Result:**
- MCP confirms deletion.
- Team no longer appears in Playwright Teams list.
- Subsequent MCP read returns not-found.

---

## TC-RFM-105 — List all teams via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — CRUD |
| **Feature** | RFM-F027 List teams |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "Automation Team" exists (from TC-RFM-101).
- At least one other team exists in the system.

**Test Data:**
- No specific test data — just call teams list.

**Steps:**
1. Call MCP `teams` (list all teams).
2. Validate MCP response:
   - Response contains a list of teams including "Automation Team".
   - Each record includes team ID and name.
3. Using Playwright, navigate to `/rf_teams`.
4. Verify the count of teams in the UI matches the MCP response count.

**Expected Result:**
- MCP returns list including "Automation Team".
- UI teams list count is consistent with MCP response.

---

## Team Member Management

---

## TC-RFM-106 — Add member to team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Members |
| **Feature** | RFM-F028 Add team member |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Team "Automation Team" exists (from TC-RFM-101).
- john.doe is NOT currently a member of "Automation Team".

**Test Data:**
- Team ID from TC-RFM-101.
- User: john.doe

**Steps:**
1. Call MCP `member_add` with team ID and john.doe's user ID.
2. Validate MCP response — confirms john.doe added to team. Note the membership ID.
3. Using Playwright, navigate to "Automation Team" detail.
4. Verify john.doe appears in the member table.

**Expected Result:**
- MCP confirms john.doe added to "Automation Team".
- Playwright shows john.doe as a team member.

---

## TC-RFM-107 — Remove member from team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Members |
| **Feature** | RFM-F029 Remove team member |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe is a member of "Automation Team" (from TC-RFM-106).

**Test Data:**
- Membership ID from TC-RFM-106.

**Steps:**
1. Call MCP `member_remove` with the membership ID from TC-RFM-106.
2. Validate MCP response — confirms john.doe removed.
3. Using Playwright, navigate to "Automation Team" detail.
4. Verify john.doe no longer appears in the member table.

**Expected Result:**
- MCP confirms john.doe removed.
- Playwright shows john.doe is no longer a member of "Automation Team".

---

## TC-RFM-108 — Update member role in team via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Members |
| **Feature** | RFM-F030 Update member role |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe is NOT a member of "Automation Team" (removed in TC-RFM-107). Re-add for this TC.

**Test Data:**
- Re-add john.doe to "Automation Team" without role first.
- New role to set: Team Lead

**Steps:**
1. Call MCP `member_add` to re-add john.doe to "Automation Team" (note new membership ID).
2. Call MCP `member_update` with membership ID and role = "Team Lead".
3. Validate MCP response — confirms role updated to "Team Lead".
4. Using Playwright, navigate to "Automation Team" detail.
5. Locate john.doe — verify Role column shows "Team Lead".

**Expected Result:**
- MCP confirms role updated to Team Lead for john.doe.
- Playwright shows john.doe with role "Team Lead" in the team.

---

## TC-RFM-109 — Add member to team with role via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Members |
| **Feature** | RFM-F031 Add member with role |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Team "Automation Team" exists (from TC-RFM-101).
- jane.doe is NOT a member of "Automation Team".

**Test Data:**
- User: jane.doe
- Role: Team Lead

**Steps:**
1. Call MCP `member_add` with team ID, jane.doe's user ID, and role = "Team Lead".
2. Validate MCP response — confirms jane.doe added with role "Team Lead". Note membership ID.
3. Using Playwright, navigate to "Automation Team" detail.
4. Verify jane.doe appears with role "Team Lead" in the member table.

**Expected Result:**
- MCP confirms jane.doe added with the "Team Lead" role.
- Playwright shows jane.doe as "Team Lead" in "Automation Team".

---

## TC-RFM-110 — Add member to team without role via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Members |
| **Feature** | RFM-F032 Add member without role |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Team "Automation Team" exists (from TC-RFM-101).
- mike.smith is NOT a member of "Automation Team".

**Test Data:**
- User: mike.smith
- No role specified.

**Steps:**
1. Call MCP `member_add` with team ID and mike.smith's user ID (no role).
2. Validate MCP response — confirms mike.smith added without a role. Note membership ID.
3. Using Playwright, navigate to "Automation Team" detail.
4. Verify mike.smith appears in the member table with no role or default role.

**Expected Result:**
- MCP confirms mike.smith added without a role.
- Playwright shows mike.smith in the team with no role or default role.

---

## Team Permissions

---

## TC-RFM-111 — Grant Manage Workload permission to member via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Permissions |
| **Feature** | RFM-F033 Grant Manage Workload permission |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe is a member of "Automation Team" (from TC-RFM-108, membership ID noted).

**Test Data:**
- john.doe membership ID.
- Permission: manage_workload = true

**Steps:**
1. Call MCP `member_update` with john.doe's membership ID and manage_workload = true.
2. Validate MCP response — confirms Manage Workload permission granted.
3. Using Playwright, navigate to "Automation Team" detail.
4. Locate john.doe — verify "Manage Workload" is checked/enabled.

**Expected Result:**
- MCP confirms Manage Workload permission granted.
- Playwright shows the Manage Workload permission as active for john.doe.

---

## TC-RFM-112 — Grant Manage Leave permission to member via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Permissions |
| **Feature** | RFM-F034 Grant Manage Leave permission |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- mike.smith is a member of "Automation Team" (from TC-RFM-110, membership ID noted).

**Test Data:**
- mike.smith membership ID.
- Permission: manage_leave = true

**Steps:**
1. Call MCP `member_update` with mike.smith's membership ID and manage_leave = true.
2. Validate MCP response — confirms Manage Leave permission granted.
3. Using Playwright, navigate to "Automation Team" detail.
4. Locate mike.smith — verify "Manage Leave" is checked/enabled.

**Expected Result:**
- MCP confirms Manage Leave permission granted to mike.smith.
- Playwright shows Manage Leave as active for mike.smith in the team.

---

## TC-RFM-113 — Grant both permissions to member via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Permissions |
| **Feature** | RFM-F035 Grant both permissions |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- jane.doe is a member of "Automation Team" (from TC-RFM-109, membership ID noted) with "Team Lead" role.

**Test Data:**
- jane.doe membership ID.
- Permissions: manage_workload = true, manage_leave = true

**Steps:**
1. Call MCP `member_update` with jane.doe's membership ID, manage_workload = true, manage_leave = true.
2. Validate MCP response — confirms both permissions granted.
3. Using Playwright, navigate to "Automation Team" detail.
4. Locate jane.doe — verify BOTH "Manage Workload" and "Manage Leave" are checked/enabled.

**Expected Result:**
- MCP confirms both permissions granted.
- Playwright shows both permissions active for jane.doe.

---

## TC-RFM-114 — Add member with no permissions via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Permissions |
| **Feature** | RFM-F036 Add member no permissions |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Team "Automation Team" exists (from TC-RFM-101).
- alex.brown is NOT a member.

**Test Data:**
- User: alex.brown
- No role, no permissions.

**Steps:**
1. Call MCP `member_add` with team ID and alex.brown's user ID (no role, no permissions). Note membership ID.
2. Validate MCP response — confirms alex.brown added with no permissions.
3. Using Playwright, navigate to "Automation Team" detail.
4. Locate alex.brown — verify both "Manage Workload" and "Manage Leave" are unchecked/disabled.

**Expected Result:**
- MCP confirms alex.brown added with no workload or leave permissions.
- Playwright shows both permissions as inactive for alex.brown.

---

## TC-RFM-115 — Remove permission from member via MCP

| Field | Value |
|-------|-------|
| **Module** | Team Management — Permissions |
| **Feature** | RFM-F037 Remove permission |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe has Manage Workload permission active in "Automation Team" (from TC-RFM-111).

**Test Data:**
- john.doe membership ID.
- Permission to remove: manage_workload = false

**Steps:**
1. Call MCP `member_update` with john.doe's membership ID and manage_workload = false.
2. Validate MCP response — confirms Manage Workload permission revoked.
3. Using Playwright, navigate to "Automation Team" detail.
4. Locate john.doe — verify "Manage Workload" is now unchecked/disabled.
5. Verify "Manage Leave" (if set) remains unchanged.

**Expected Result:**
- MCP confirms Manage Workload permission removed from john.doe.
- Playwright shows Manage Workload as inactive for john.doe while other state remains unchanged.

---

**End of Suite — Team State After TC-RFM-115:**
- john.doe: member, Team Lead role, no Manage Workload, no Manage Leave
- jane.doe: member, Team Lead role, Manage Workload ✓, Manage Leave ✓
- mike.smith: member, no role, no Manage Workload, Manage Leave ✓
- alex.brown: member, no role, no permissions
