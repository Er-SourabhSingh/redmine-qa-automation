# User Guide — Redmineflux MCP

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.

---

## Getting Started

All operations in this test suite are performed through MCP (Model Context Protocol) prompts. Claude communicates with the Redmineflux MCP endpoint to perform CRUD operations. Playwright is used after each operation to navigate to the corresponding UI section and verify that the data change is reflected correctly.

**MCP Endpoint:** `https://dev-flux.zehntech.com/mcp/sse`

**Base Application URL:** `https://dev-flux.zehntech.com/`

---

## Key Screens

### Workload Module
- **Workload List:** Navigate to the Workloads section in the main Redmineflux menu.
- **Workload Detail:** Click a workload name to view assigned issues, users, hours, and allocation.
- **Dashboard:** The workload dashboard shows team/user allocation charts and utilization metrics.

### Team Management Module
- **Team List:** Navigate to Teams in the Redmineflux menu. Shows all teams with member count.
- **Team Detail:** Click a team to view members, roles, and permissions.

### Skill Management Module
- **Skill List:** Navigate to Skills in the Redmineflux menu. Lists all skills with assigned user count.
- **Skill Matrix:** Navigate to Skill Matrix to view a grid of users vs. skills with proficiency levels.

### Leave Management Module
- **Leave Requests:** Navigate to Leave in the Redmineflux menu. Shows leave requests with status badges.
- **Pending Approvals:** A separate view for the Leave Approver role to see all pending requests.

### Holiday Schema Module
- **Holiday Schemas:** Navigate to Administration > Redmineflux > Holiday Schemas. Lists all schemas.
- **Schema Detail:** Click a schema to view all holidays within it.

### Settings Module
- **Plugin Settings:** Navigate to Administration > Plugins > Configure (Redmineflux MCP).

---

## Step-by-Step Workflows

### Workflow 1: Create and Populate a Workload

1. Issue MCP prompt: `"Create workload QA Team June 2026"` (or equivalent with team, month, year).
2. Confirm MCP response contains success status and the new workload ID/name.
3. Issue MCP prompt: `"Add issue RM-101 to workload QA Team June 2026 with 20 hours assigned to John"`.
4. Confirm MCP response shows issue assigned.
5. Navigate via Playwright to the Workloads section.
6. Locate the workload "QA Team June 2026" in the list.
7. Click to open workload detail.
8. Verify issue RM-101 appears with 20 planned hours assigned to John.

### Workflow 2: Update and Delete a Workload

1. Issue MCP prompt: `"Update workload QA Team June 2026 allocation to 80%"`.
2. Confirm MCP response indicates successful update.
3. Navigate via Playwright to the workload detail page.
4. Verify allocation now shows 80%.
5. Issue MCP prompt: `"Delete workload QA Team June 2026"`.
6. Confirm MCP response indicates successful deletion.
7. Navigate via Playwright to the Workloads list.
8. Confirm "QA Team June 2026" no longer appears.

### Workflow 3: Create a Team and Manage Members

1. Issue MCP prompt: `"Create team Automation Team"`.
2. Confirm MCP response contains the new team ID.
3. Issue MCP prompt: `"Add John to Automation Team as Team Lead"`.
4. Confirm MCP response indicates John was added.
5. Navigate via Playwright to Teams, click "Automation Team".
6. Verify John appears with role "Team Lead".
7. Issue MCP prompt: `"Grant Manage Workload permission to John in Automation Team"`.
8. Navigate via Playwright and verify John's permission checkbox is checked.
9. Issue MCP prompt: `"Remove John from Automation Team"`.
10. Navigate via Playwright and verify John no longer appears in the team.

### Workflow 4: Manage Skills

1. Issue MCP prompt: `"Create skill Selenium"`.
2. Confirm MCP response with skill ID.
3. Issue MCP prompt: `"Assign Selenium skill to John with Expert level"`.
4. Navigate via Playwright to the Skill Matrix.
5. Verify John shows Expert level for Selenium.
6. Issue MCP prompt: `"Change John's Selenium level to Intermediate"`.
7. Navigate via Playwright and verify the level updated.
8. Issue MCP prompt: `"Remove Selenium skill from John"`.
9. Navigate via Playwright and verify John no longer appears in the Selenium row.

### Workflow 5: Apply and Approve Leave

1. Issue MCP prompt: `"Apply leave for John from June 10 to June 12"`.
2. Confirm MCP response with leave request ID.
3. Navigate via Playwright to Leave > John's requests.
4. Verify leave status is "Pending".
5. (As Leave Approver) Issue MCP prompt: `"Approve leave request [ID]"`.
6. Navigate via Playwright and verify status changed to "Approved".

### Workflow 6: Manage Holiday Schema

1. (As Admin) Issue MCP prompt: `"Create holiday schema India 2026"`.
2. Confirm MCP response with schema ID.
3. Issue MCP prompt: `"Add holiday Diwali on 10-Nov-2026 to India 2026"`.
4. Navigate via Playwright to Administration > Holiday Schemas > India 2026.
5. Verify Diwali appears with date 10-Nov-2026.
6. Issue MCP prompt: `"Delete Diwali holiday from India 2026"`.
7. Navigate via Playwright and verify Diwali no longer appears.

---

## UI Elements Reference

### Workload List Page
- Each row shows: Workload Name, Team, Date Range, Total Issues, Total Hours, Allocation %, Status
- Actions: View, Edit, Delete
- Filter bar at top: User, Team, Project, Issue, Date From, Date To, Status

### Workload Detail Page
- Header: Workload name, team, date range, overall allocation
- Issue table: Issue ID, Issue Title, Assignee, Planned Hours, Allocation %, Start Date, End Date
- Actions per issue row: Edit Hours, Edit Allocation, Remove

### Team List Page
- Each row shows: Team Name, Description, Member Count, Manager
- Actions: View, Edit, Delete

### Team Detail Page
- Member table: Username, Full Name, Role, Manage Workload (checkbox), Manage Leave (checkbox)
- Actions: Add Member, Edit Member, Remove Member

### Skill Matrix Page
- Grid: rows = Users, columns = Skills
- Cell value: Skill level badge (Beginner / Intermediate / Advanced / Expert) or empty
- Filters: Team, User, Skill, Skill Level

### Leave Requests Page
- Each row: Requester, Leave Type, From Date, To Date, Days, Status, Approver
- Status badge colors: Pending (yellow), Approved (green), Rejected (red), Cancelled (grey)

### Holiday Schema Page
- Each row: Schema Name, Region, Year, Holiday Count
- Detail page shows table of holidays: Name, Date, Day of Week

---

## Notes & Known Behavior

- MCP operations are authenticated through the session established when the MCP server starts; admin credentials are used for admin operations.
- If an MCP prompt references a user by first name only (e.g., "John"), the MCP server resolves the user by username or display name. Use exact usernames where required.
- Workload names must be unique; attempting to create a duplicate name should return an error.
- Leave requests reference a leave type — confirm valid leave types from the UI before testing.
- Holiday schemas enforce unique schema names (region + year combination).
- The skill matrix filters are applied server-side; results are paginated for large datasets.
