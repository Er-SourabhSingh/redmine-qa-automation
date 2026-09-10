# Test Scope — Redmineflux MCP

## In Scope

- [x] Module 1: Workload CRUD (create, read, update, delete, search, list, detail)
- [x] Module 1: Workload issue assignment (add, update, reassign, remove issues)
- [x] Module 1: Workload filtering (by user, team, project, issue, date range, status)
- [x] Module 2: Workload dashboard read operations (by team, user, project, workload, date range, utilization)
- [x] Module 3: Team CRUD (create, read, update, delete, search)
- [x] Module 3: Team member management (add, remove, update role)
- [x] Module 3: Team member permission management (Manage Workload, Manage Leave)
- [x] Module 4: Skill CRUD (create, read, update, delete)
- [x] Module 4: Skill user assignment (assign, update level, remove)
- [x] Module 4: Skill matrix (view, filter by team/user/skill/level)
- [x] Module 5: Leave operations (apply, view, cancel)
- [x] Module 5: Leave approval workflow (approve, reject, view pending)
- [x] Module 5: Leave permission testing (user self-service, approver workflow, unauthorized access)
- [x] Module 6: Holiday schema CRUD (create, read, update, delete) — Admin only
- [x] Module 6: Holiday CRUD inside schema (add, update, delete, view)
- [x] Module 6: Holiday schema permission validation (admin allowed, non-admin denied)
- [x] Module 7: Settings (read, update, reset, validate) — Admin only
- [x] Module 7: Settings permission validation (admin allowed, non-admin denied)
- [x] Cross-module permission testing (Admin, User With Permission, User Without Permission, Team Manager, Leave Approver)
- [x] MCP response validation (status codes, success/error messages, returned data)
- [x] Playwright UI verification after each MCP operation
- [x] Data consistency validation (MCP response vs. UI state)

## Out of Scope

- Performance/load testing of MCP endpoints
- MCP server infrastructure testing (SSE connection stability, reconnect behavior)
- Redmine core feature testing (issues, projects, users) beyond what is required as test data
- Plugin source code review
- Database-level verification (all verification through Playwright UI)
- PDF report generation (only on explicit request)
- Email notification delivery testing
- Mobile/responsive UI testing

## Redmine Version

- Target: as reported by `https://dev-flux.zehntech.com/` (confirm at session start)

## Environment

- Application URL: `https://dev-flux.zehntech.com/`
- MCP Endpoint: `https://dev-flux.zehntech.com/mcp/sse`
- Admin credentials: admin / 12345678

## Test Cycle

- Cycle 1 (Current): Full coverage of all 87 test cases across all 7 modules
- Status: Not Started
- Target start: TBD
