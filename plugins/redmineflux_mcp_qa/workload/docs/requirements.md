# Plugin Requirements — Redmineflux MCP

## Overview

The Redmineflux MCP plugin exposes workforce management capabilities through a Model Context Protocol (MCP) interface hosted at `/mcp/sse`. This enables Claude and other MCP-compatible clients to create, read, update, and delete workload plans, team structures, skill records, leave requests, holiday schemas, and plugin settings — all through natural-language MCP prompts without directly logging into the Redmine UI.

Playwright is used exclusively for post-action verification of data in the browser UI.

---

## Key Features

### Module 1 — Workload
- Create, read, update, and delete workloads
- Add/remove issues from workloads
- Assign issues to users with planned hours, allocation percentage, and date ranges
- List and search workloads
- Filter workloads by user, team, project, issue, date range, and status

### Module 2 — Workload Dashboard
- Retrieve workload dashboard data by team, user, project, workload, date range, allocation, and utilization
- Verify chart counts, allocation percentages, and utilization summaries

### Module 3 — Team Management
- Create, read, update, and delete teams
- Add, update, and remove team members
- Assign member roles (e.g., Team Lead, Member)
- Grant and revoke per-member permissions: Manage Workload, Manage Leave

### Module 4 — Skill Management
- Create, read, update, and delete skills
- Assign skills to users with level (Beginner / Intermediate / Advanced / Expert)
- Update and remove user skill assignments
- View and filter the skill matrix by team, user, skill, and skill level

### Module 5 — Leave Management
- Apply, view, and cancel leave requests
- Approve and reject leave requests (Leave Approver role)
- View pending approvals
- Enforce role-based access: regular users manage own leaves; approvers manage team leaves

### Module 6 — Holiday Schema (Admin only)
- Create, read, update, and delete holiday schemas
- Add, update, and remove individual holidays within a schema
- View all holidays in a schema
- Enforce admin-only access

### Module 7 — Settings (Admin only)
- Read, update, and reset plugin settings via MCP
- Validate configuration changes persist
- Enforce admin-only access

---

## Business Workflows

### Workflow 1 — Workload Planning
1. Admin or Workload Manager creates a workload (e.g., "QA Team June 2026").
2. Issues are added to the workload with assigned users, planned hours, and date ranges.
3. Allocation percentages are set and updated as scope changes.
4. Dashboard data reflects the current workload state per team and user.
5. Workload is deleted when the planning cycle ends.

### Workflow 2 — Team & Skill Setup
1. Team Manager creates a team and adds members with roles and permissions.
2. Skills are created and assigned to team members with proficiency levels.
3. Skill matrix is reviewed to identify coverage gaps.

### Workflow 3 — Leave Approval
1. User applies for leave for a date range via MCP.
2. Leave Approver reviews pending leave requests.
3. Approver approves or rejects the leave request.
4. Leave status is updated and reflected in the UI.

### Workflow 4 — Holiday Schema Management
1. Admin creates a holiday schema for a region/year (e.g., "India 2026").
2. Individual holidays are added to the schema.
3. Holidays are updated or removed as needed.
4. Schema is deleted at end of the applicable year.

---

## Permissions Matrix

| Action | Admin | Team Manager | Leave Approver | User With Permission | User Without Permission |
|--------|-------|--------------|----------------|----------------------|-------------------------|
| Create workload | Yes | Yes | No | Yes | No |
| Read workload | Yes | Yes | Yes | Yes | No |
| Edit workload | Yes | Yes | No | Yes | No |
| Delete workload | Yes | Yes | No | No | No |
| Add issue to workload | Yes | Yes | No | Yes | No |
| Remove issue from workload | Yes | Yes | No | Yes | No |
| Create team | Yes | Yes | No | No | No |
| Edit team | Yes | Yes | No | No | No |
| Delete team | Yes | Yes | No | No | No |
| Add team member | Yes | Yes | No | No | No |
| Remove team member | Yes | Yes | No | No | No |
| Grant member permissions | Yes | Yes | No | No | No |
| Create skill | Yes | No | No | No | No |
| Assign skill to user | Yes | Yes | No | No | No |
| Apply leave | Yes | Yes | Yes | Yes | Yes |
| View own leave | Yes | Yes | Yes | Yes | Yes |
| Approve/Reject leave | Yes | No | Yes | No | No |
| Create holiday schema | Yes | No | No | No | No |
| Edit holiday schema | Yes | No | No | No | No |
| Delete holiday schema | Yes | No | No | No | No |
| Read settings | Yes | No | No | No | No |
| Update settings | Yes | No | No | No | No |

---

## Known Constraints

- All MCP operations require valid authentication via the MCP SSE endpoint.
- MCP endpoint: `https://dev-flux.zehntech.com/mcp/sse`
- Playwright is used for UI verification only — never for data creation.
- Screenshots are taken only when a bug is found.
- Permission violations must return a clear error message through MCP response.
