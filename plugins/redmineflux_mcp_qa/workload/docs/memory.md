# Plugin Memory — Redmineflux MCP

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- `workload_show` returns 500 (not 404) for deleted workload IDs — BUG-RFM-004 (open).
- `team_data` returns 500 (not 404) for deleted team IDs — BUG-RFM-002 (open).
- `allocation_update_dates` requires `allocation_id` (alloc#N from `workload_gantt`), NOT `workload_issue_id`.
- `update_planned_hours` requires `workload_user_id` (wuid), NOT the regular `user_id`.
- `planned_hours` cannot be set to 0 — system rejects with "Planned hours must be greater than 0". Use `remove_issue` to fully unassign.
- `member_update` and `member_add` use `role_id` (integer), NOT `role` (string). Role is correctly applied when using `role_id`. BUG-RFM-003 FIXED.
- Holiday modal for non-active schemes now correctly shows holidays — BUG-RFM-001 FIXED.
- MCP `dashboard` returns Total Logged = 0h and capacity ~1242h for Automation Team (June 2026), while UI shows 109.5h logged and 993.6h capacity — BUG-RFM-005 (open, retested 2026-06-12, unchanged).
- `holiday_scheme_show` with a non-existent scheme_id returns "Not found" (correct 404 behavior).
- Workload endpoints return 404 (not 403) for non-admin access — this is standard Redmine behavior (hides existence of resources).
- MCP SSE connection can drop during long sessions; all redmineflux tools disappear until reconnect. Must use ToolSearch to reload after reconnect.
- Playwright session expires after ~30-40 min of inactivity — re-login required.

## Confirmed Working

- Holiday scheme CRUD: create, update, show, list, delete, clone, activate, add holidays ✓
- Skill CRUD: create, update, show, list, delete ✓
- Team CRUD: create, update, show, list, delete, member operations ✓
- Leave lifecycle: create, approve, reject, cancel, calculate_days, available_hours_report ✓
- Workload CRUD: create, show, list, update, delete ✓
- Workload issue assignment: add_issue, update_planned_hours, allocation_update_dates, workload_gantt ✓
- Workload filtering: workloads_list with team_id, date range, user filters ✓
- Dashboard: dashboard (KPIs, team summary, per-user breakdown) ✓
- Available hours report: correctly reflects approved leaves ✓
- Capacity report: shows planned vs available hours per user ✓
- Settings: settings_get, settings_update ✓
- Admin access control: all 7 modules accessible as admin ✓
- Non-admin access: settings, team, skill creation denied (403/404) ✓

## Recurring Issues

- MCP SSE disconnects under long sessions — restart or reconnect MCP in Claude Code settings.
- `workload_show` / `team_data` both return 500 for deleted IDs — endemic pattern, not isolated.
- Playwright login session expires frequently — always check URL after navigation.
- MCP `dashboard` logged hours and capacity values differ from UI (BUG-RFM-005).

## Environment Notes

- MCP endpoint: `https://dev-flux.zehntech.com/mcp/sse`
- Application URL: `https://dev-flux.zehntech.com/`
- Admin login: admin / 12345678
- Admin API key: d8ff92a06082fbf9efc0adfead1616aa1ba7198d
- ajay.joshi API key: 098f978c75a41b485cccb4f910e318f35776251b (non-admin, id=14)
- All MCP operations require authenticated session; Claude connects via MCP SSE transport.
- Playwright verifies results in the browser after every MCP operation — never used for data creation.

## Test Data Notes

- Workload #18 "QA Team June 2026" — team_id=27, 2026-06-01→2026-06-30, 7 users, 2 issues (110h total)
- Team #27 "Automation Team" — 7 members: Ajay Joshi (id=14), Aditi Jain (id=347), Mitisha Agrawal (id=36), Aakash Rao (id=594), Ankit Sen (id=616), Shubham Ahirwar (id=689), Shrishtee Bajpai (id=694)
- Issue assignments: #10292 (Ajay 40h alloc#25 + Aditi 40h alloc#26), #10371 (Ajay 30h alloc#27)
- Ajay Joshi approved leave: 2026-06-23→2026-06-24 (leave_id=14)
- Active holiday scheme: "updated mcp holiday" (#6, 7 holidays)
- Skills: Selenium(#28), Cypress(#31), Jest(#32), Postman(#33), Appium(#34), JMeter(#35), testNG(#36)

## Permission Testing Notes

- Test accounts "permitted.user", "team.manager", "leave.approver" DO NOT exist in dev environment.
- TC-RFM-161, TC-RFM-163, TC-RFM-164 are BLOCKED until these accounts are created.
- Use ajay.joshi (id=14) as proxy for "user without permissions" testing.
