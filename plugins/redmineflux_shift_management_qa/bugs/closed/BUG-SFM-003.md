# Bug Report Template

- Bug ID: BUG-SFM-003
- Production Redmine Issue ID: #123834
- Title: `POST /shift_management/api/v1/leave` never checks `manage_rf_platform_leaves` — a user with zero leave-filing permission can still create their own leave via the REST API, bypassing the just-fixed web-form gate (BUG-PLT-054)
- Redmine version: 6
- Plugin name: redmineflux_shift_management
- Plugin version: current (2026-10-16, after `redmineflux_platform` commit `d8a224d`)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: N/A — confirmed via direct `curl` request with a REST API key, not the browser UI
- User role: Non-admin test user (`marigold.rayne`), zero `rf_platform` permissions of any kind
- Date: 2026-10-16

## Steps to reproduce

1. Found via the same Security pass that found the identical defect on Workload's own leave API
   (`BUG-WKL-004`) — both plugins independently expose a REST leave-creation endpoint that was never updated for
   `BUG-PLT-054`'s fix.
2. Confirm `marigold.rayne` holds zero `rf_platform` permissions (`manage_rf_platform_leaves` → `false`), with a
   temporary Leave Policy Band assignment (`QA-Band-EmergencyOnly`, 2026) added via `rails runner` purely to keep
   the already-fixed `BUG-PLT-053` band check from masking this permission check.
3. `POST /shift_management/api/v1/leave` with her `X-Redmine-API-Key` header and
   `{"leave":{"leave_type_id":3,"from_date":"2026-12-16","to_date":"2026-12-16","reason":"..."}}` (Leave Type
   id 3 = Emergency Leave).
4. The request succeeded outright: `201 Created`, a real Leave record (`#15`) created for her, status `Pending`,
   `applied_by` correctly recorded as herself — with `manage_rf_platform_leaves` confirmed `false` throughout.

## Expected result

- Per the now-fixed `BUG-PLT-054` and `SENIOR_QA_STANDARDS.md` §30 ("the same rule... enforced identically in the
  UI and at the API/endpoint level"), a user without `manage_rf_platform_leaves` should not be able to file a
  leave through any entry point, including Shift Management's own REST API.

## Actual result

- `ShiftManagementApi::V1::LeaveController#create` builds `RedminefluxPlatform::Leave.new(leave_params)` and calls
  `.save` directly, with **no** check of `manage_rf_platform_leaves` (or any Platform permission) anywhere in the
  action or in its class-level `before_action`s (`find_leave` and `authorize_leave_approval` only apply to
  `show`/`update`/`destroy`/`approve`/`reject` — never `create`). The controller's only gate is whatever its
  `BaseController` requires, which is plain login, not any specific permission.
- The model-layer band-check validation (`BUG-PLT-053`'s fix) does correctly fire here too, confirming it is
  genuinely model-level and entry-point-independent — but once a band exists (for any reason), this endpoint lets
  anyone file a leave regardless of `manage_rf_platform_leaves`.
- Root cause: identical to `BUG-WKL-004` — `BUG-PLT-054`'s fix only changed behavior reached through Platform's
  own `EntitiesController` (the consolidated web form from `BUG-PLT-045`). This plugin's own standalone REST API
  controller (`shift_management/api/v1/leave`, routed with full CRUD unlike its web-UI route which is deliberately
  `only: [:index, :show, :new]` per the consolidation) was never routed through `Entry#manage?` and was never
  updated.

## Evidence

### Screenshot

- N/A — pure REST API finding, confirmed via `curl` with a real API key, not a browser session.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-SFM-003/retest-yyyy-mm-dd-pass.png)

### Console / log

```
$ curl -X POST http://localhost:3013/shift_management/api/v1/leave -H "X-Redmine-API-Key: <marigold's key>" \
  -d '{"leave":{"leave_type_id":3,"from_date":"2026-12-16","to_date":"2026-12-16","reason":"..."}}'
HTTP 201
{"data":{"id":15,"user":{"id":19,"name":"Marigold Rayne", ...},"leave_type":{"id":3,"name":"Emergency Leave"},
  "from_date":"2026-12-16","to_date":"2026-12-16","days_count":"1.0","status":"pending",
  "applied_by":{"id":19,"name":"Marigold Rayne", ...}}, "message":"Leave submitted"}
```
Confirmed `marigold.rayne.allowed_to?(:manage_rf_platform_leaves, nil, global: true)` was `false` at the exact
time of this request. Leave #15 and the temporary band assignment were deleted immediately after confirming the
finding.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): Same root permission and same shape as the just-closed `BUG-PLT-054`
  (Platform's own web form), reachable through a different, Shift-Management-owned entry point that
  `BUG-PLT-054`'s fix never touched. A parallel finding (`BUG-WKL-004`) exists for Workload's own equivalent REST
  API endpoint, same root cause, same day.

## Production report

Reported to production as **#123834** on `flux.zehntech.com`, project `ztflux`, assigned to Prashant Chaurasia,
Category "Shift Management", Defect Type Security, Defect Severity Medium-severity, Defect priority Medium,
Priority Medium. Not linked to any Test Run/Test Case — no production Run/Suite exists yet for this plugin's own
test case set. Filed as a fresh issue (not a reopen of `BUG-PLT-054`) per explicit user instruction, since the
broken code lives in this plugin's own controller, not Platform's.

## Retest (2026-10-16, same day) — CONFIRMED FIXED

`git pull` landed commit `59cd3af` ("Leave API follows the Platform's leave permission (BUG-SFM-003)"), citing
this bug by number — `ShiftManagementApi::V1::LeaveController#create` now checks the Platform leaves entry's
permission before saving, the same pattern as Workload's own fix (`BUG-WKL-004`).

**Retested live**: `POST /shift_management/api/v1/leave` with `marigold.rayne`'s own API key (confirmed zero
`manage_rf_platform_leaves`) now returns **403 Forbidden** (`{"error":"Forbidden"}`) instead of succeeding.
Confirmed via `rails runner` that no Leave record was created.

**Status: CONFIRMED FIXED.** Moving to `bugs/closed/`.
