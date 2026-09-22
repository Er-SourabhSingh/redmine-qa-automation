# Features List — Redmineflux MCP

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

---

## Feature List

| # | Feature ID | Feature | Description | Covered by TC |
|---|------------|---------|-------------|---------------|
| 1 | RFM-F001 | Create workload | Create a new workload with name, team, and date range via MCP | TC-RFM-079 |
| 2 | RFM-F002 | Read workload | Retrieve workload details by name or ID via MCP | TC-RFM-080 |
| 3 | RFM-F003 | Update workload | Edit workload name, description, dates, or allocation via MCP | TC-RFM-081 |
| 4 | RFM-F004 | Delete workload | Remove a workload and its issue assignments via MCP | TC-RFM-082 |
| 5 | RFM-F005 | Search workload | Search workloads by name keyword via MCP | TC-RFM-083 |
| 6 | RFM-F006 | List workloads | List all workloads with summary data via MCP | TC-RFM-084 |
| 7 | RFM-F007 | View workload details | Retrieve full workload details including all issue assignments | TC-RFM-085 |
| 8 | RFM-F008 | Add issue to workload | Assign a single Redmine issue to a workload | TC-RFM-086 |
| 9 | RFM-F009 | Add multiple issues | Assign multiple issues to a workload in one operation | TC-RFM-087 |
| 10 | RFM-F010 | Assign issue to user | Link an issue assignment in a workload to a specific user | TC-RFM-088 |
| 11 | RFM-F011 | Assign with planned hours | Set planned hours when assigning issue to workload | TC-RFM-089 |
| 12 | RFM-F012 | Assign with date range | Set start and end dates for an issue assignment | TC-RFM-090 |
| 13 | RFM-F013 | Update issue hours | Change the planned hours for an issue already in a workload | TC-RFM-091 |
| 14 | RFM-F014 | Update allocation percentage | Change allocation % for a user's issue assignment | TC-RFM-092 |
| 15 | RFM-F015 | Remove issue from workload | Remove an issue assignment from a workload | TC-RFM-093 |
| 16 | RFM-F016 | Reassign issue to user | Change the assigned user for an issue in a workload | TC-RFM-094 |
| 17 | RFM-F017 | Full issue assignment | Assign issue with user + hours + allocation + dates | TC-RFM-095 |
| 18 | RFM-F018 | Filter by user | Filter workloads or assignments by assigned user | TC-RFM-096 |
| 19 | RFM-F019 | Filter by team | Filter workloads by team | TC-RFM-097 |
| 20 | RFM-F020 | Filter by project | Filter workloads by Redmine project | TC-RFM-098 |
| 21 | RFM-F021 | Filter by issue | Filter workload assignments containing a specific issue | TC-RFM-099 |
| 22 | RFM-F022 | Filter by date range | Filter workloads active within a date range | TC-RFM-100 |
| 23 | RFM-F023 | Filter by status | Filter workloads by workload status | TC-RFM-101 |
| 24 | RFM-F024 | Dashboard by team | Retrieve workload dashboard data aggregated by team | TC-RFM-102 |
| 25 | RFM-F025 | Dashboard by user | Retrieve workload dashboard data for a specific user | TC-RFM-103 |
| 26 | RFM-F026 | Dashboard by project | Retrieve workload dashboard data filtered by project | TC-RFM-104 |
| 27 | RFM-F027 | Dashboard by workload | Retrieve dashboard data for a specific workload | TC-RFM-105 |
| 28 | RFM-F028 | Dashboard by date range | Retrieve dashboard data for a given date range | TC-RFM-106 |
| 29 | RFM-F029 | Dashboard utilization | View utilization and allocation percentage summaries | TC-RFM-107 |
| 30 | RFM-F030 | Dashboard consistency | MCP response data matches Playwright UI data | TC-RFM-108 |
| 31 | RFM-F031 | Create team | Create a new team with name and description via MCP | TC-RFM-109 |
| 32 | RFM-F032 | Read team | Retrieve team details by name or ID via MCP | TC-RFM-110 |
| 33 | RFM-F033 | Update team | Edit team name or description via MCP | TC-RFM-111 |
| 34 | RFM-F034 | Delete team | Remove a team via MCP | TC-RFM-112 |
| 35 | RFM-F035 | Search team | Search teams by name keyword via MCP | TC-RFM-113 |
| 36 | RFM-F036 | Add team member | Add a user to a team via MCP | TC-RFM-114 |
| 37 | RFM-F037 | Remove team member | Remove a user from a team via MCP | TC-RFM-115 |
| 38 | RFM-F038 | Update member role | Change a team member's role via MCP | TC-RFM-116 |
| 39 | RFM-F039 | Add member with role | Add user to team specifying a role (e.g., Team Lead) | TC-RFM-117 |
| 40 | RFM-F040 | Add member without role | Add user to team with no role assigned | TC-RFM-118 |
| 41 | RFM-F041 | Grant Manage Workload permission | Grant member the Manage Workload permission via MCP | TC-RFM-119 |
| 42 | RFM-F042 | Grant Manage Leave permission | Grant member the Manage Leave permission via MCP | TC-RFM-120 |
| 43 | RFM-F043 | Grant both permissions | Grant member both Manage Workload and Manage Leave | TC-RFM-121 |
| 44 | RFM-F044 | Add member no permissions | Add member with neither Manage Workload nor Manage Leave | TC-RFM-122 |
| 45 | RFM-F045 | Remove permission | Revoke a specific permission from a member via MCP | TC-RFM-123 |
| 46 | RFM-F046 | Create skill | Create a new skill (e.g., Selenium) via MCP | TC-RFM-124 |
| 47 | RFM-F047 | Read skill | Retrieve skill details by name or ID via MCP | TC-RFM-125 |
| 48 | RFM-F048 | Update skill | Edit skill name or description via MCP | TC-RFM-126 |
| 49 | RFM-F049 | Delete skill | Remove a skill via MCP | TC-RFM-127 |
| 50 | RFM-F050 | Assign skill to user | Link a skill to a user with a proficiency level | TC-RFM-128 |
| 51 | RFM-F051 | Update skill level | Change a user's proficiency level for a skill | TC-RFM-129 |
| 52 | RFM-F052 | Remove user skill | Remove a skill assignment from a user | TC-RFM-130 |
| 53 | RFM-F053 | Beginner level assignment | Assign skill with Beginner level | TC-RFM-131 |
| 54 | RFM-F054 | Expert level assignment | Assign skill with Expert level | TC-RFM-132 |
| 55 | RFM-F055 | View skill matrix | Open and read the full skill matrix via MCP | TC-RFM-133 |
| 56 | RFM-F056 | Filter matrix by team | Filter skill matrix by team | TC-RFM-134 |
| 57 | RFM-F057 | Filter matrix by level | Filter skill matrix by skill level | TC-RFM-135 |
| 58 | RFM-F058 | Filter matrix by user+skill | Filter skill matrix by specific user and skill | TC-RFM-136 |
| 59 | RFM-F059 | Apply leave | Submit a leave request for a date range via MCP | TC-RFM-137 |
| 60 | RFM-F060 | View leave requests | List all leave requests for a user via MCP | TC-RFM-138 |
| 61 | RFM-F061 | Read leave details | Retrieve details of a specific leave request via MCP | TC-RFM-139 |
| 62 | RFM-F062 | Cancel leave | Cancel a pending leave request via MCP | TC-RFM-140 |
| 63 | RFM-F063 | Approve leave | Leave Approver approves a pending request via MCP | TC-RFM-141 |
| 64 | RFM-F064 | Reject leave | Leave Approver rejects a pending request via MCP | TC-RFM-142 |
| 65 | RFM-F065 | View pending approvals | Leave Approver views pending leave requests via MCP | TC-RFM-143 |
| 66 | RFM-F066 | User leave self-service | Regular user can apply and view own leave only | TC-RFM-144 |
| 67 | RFM-F067 | Approver workflow | Leave Approver can approve and reject | TC-RFM-145 |
| 68 | RFM-F068 | Unauthorized leave access | Unauthorized user is denied leave management | TC-RFM-146 |
| 69 | RFM-F069 | Create holiday schema | Admin creates holiday schema (region + year) via MCP | TC-RFM-147 |
| 70 | RFM-F070 | Read holiday schema | Admin reads holiday schema details via MCP | TC-RFM-148 |
| 71 | RFM-F071 | Update holiday schema | Admin updates schema name or description via MCP | TC-RFM-149 |
| 72 | RFM-F072 | Delete holiday schema | Admin deletes holiday schema via MCP | TC-RFM-150 |
| 73 | RFM-F073 | Add holiday | Add individual holiday to a schema via MCP | TC-RFM-151 |
| 74 | RFM-F074 | Update holiday | Update holiday name or date in a schema via MCP | TC-RFM-152 |
| 75 | RFM-F075 | Delete holiday | Remove a holiday from a schema via MCP | TC-RFM-153 |
| 76 | RFM-F076 | View holidays | List all holidays in a schema via MCP | TC-RFM-154 |
| 77 | RFM-F077 | Non-admin holiday denied | Non-admin user cannot create/edit/delete schema or holidays | TC-RFM-155 |
| 78 | RFM-F078 | Read settings | Admin reads all plugin settings via MCP | TC-RFM-156 |
| 79 | RFM-F079 | Update settings | Admin updates plugin settings via MCP | TC-RFM-157 |
| 80 | RFM-F080 | Reset settings | Admin resets plugin settings to defaults via MCP | TC-RFM-158 |
| 81 | RFM-F081 | Non-admin settings denied | Non-admin user cannot read or update settings via MCP | TC-RFM-159 |
| 82 | RFM-F082 | Admin full access | Admin can perform all operations in all modules | TC-RFM-160 |
| 83 | RFM-F083 | User with permission | User with granted permissions can perform allowed operations | TC-RFM-161 |
| 84 | RFM-F084 | User without permission | User without permissions is denied restricted operations | TC-RFM-162 |
| 85 | RFM-F085 | Team manager access | Team manager can manage team-level operations | TC-RFM-163 |
| 86 | RFM-F086 | Leave approver access | Leave approver can only approve/reject leave | TC-RFM-164 |
| 87 | RFM-F087 | Error messages | Unauthorized access returns proper MCP error messages | TC-RFM-165 |

---

## Notes

- All features are exercised through MCP prompts — never through direct UI interaction for data creation.
- MCP endpoint: `https://dev-flux.zehntech.com/mcp/sse`
- Skill levels supported: Beginner, Intermediate, Advanced, Expert.
- Permission types: Manage Workload, Manage Leave.
- Leave status values: Pending, Approved, Rejected, Cancelled.
- Workload status values vary — confirm from UI during first test run.
