# Handoff — Redmineflux MCP

## Last Session

- Date: 2026-06-17
- Redmine Version: Flux (dev-flux.zehntech.com)
- Environment: https://dev-flux.zehntech.com/

## Completed This Session (2026-06-17)

Full retest of all bugs plus controlled BUG-RFM-005 verification:

| Bug ID | Title | Retest Result |
|--------|-------|---------------|
| BUG-RFM-005 | `dashboard` logged hours vs UI | **FIXED — CLOSED** (3 consecutive calls, all 9 metrics match; workload #30 40h controlled test) |
| BUG-RFM-009 | `team_data` no created_by | STILL OPEN (UI now shows created_by; MCP still missing) |
| BUG-RFM-010 | Disabling overload silently clips Gantt | STILL OPEN — classified as UI-only; MCP `workload_show` unaffected; screenshots embedded |
| BUG-RFM-011 | Allocation split DB error | STILL OPEN — core failure unchanged; tested alloc#79 workload#32 |

## In Progress

— Retest complete.

## Blockers

- TC-RFM-161, TC-RFM-163, TC-RFM-164: BLOCKED — permission test accounts still not created:
  - "permitted.user" with Manage Workload permission
  - "team.manager" with Team Manager role
  - "leave.approver" with Leave Approver role

## Pre-Retest Steps (Developer Instructions — 2026-06-18)

Developer confirmed fixes are ready. Tester must run these 3 steps **before** retesting:

**Step 1 — Run DB migration** (required for BUG-RFM-009 — adds `created_by_id` column):
```
RAILS_ENV=production bundle exec rails redmine:plugins:migrate
```

**Step 2 — Restart Redmine server** (picks up plugin Ruby changes)

**Step 3 — Restart MCP server** (picks up Python changes):
```
python -m src.server
```

> Developer says: "After these 3 steps, all the reported bugs should be resolved."

## Next Session Start Point

After completing the 3 pre-retest steps above:
1. Retest BUG-RFM-002 — `team_data` 500 on deleted team ID
2. Retest BUG-RFM-004 — `workload_show` 500 on deleted workload ID
3. Retest BUG-RFM-009 — `team_data` missing `created_by` (DB migration fix)
4. Retest BUG-RFM-010 — overload setting silently clips Gantt hours
5. Retest BUG-RFM-011 — allocation split DB duplicate-key error
6. Re-run TC-RFM-161, TC-RFM-163, TC-RFM-164 once permission test accounts are created

## Open Bugs (5 remaining)

| Bug ID | Summary | Severity |
|--------|---------|---------|
| BUG-RFM-002 | `team_data` returns 500 for deleted team ID | Medium |
| BUG-RFM-004 | `workload_show` returns 500 for deleted workload ID | Medium |
| BUG-RFM-009 | `team_data` does not show created_by author | Low |
| BUG-RFM-010 | Disabling overload silently clips Gantt (UI-only) | High |
| BUG-RFM-011 | Allocation split fails (DB schema constraint) | High |
