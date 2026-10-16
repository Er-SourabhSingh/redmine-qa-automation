# Bug Report Template

- Bug ID: BUG-WKL-004
- Production Redmine Issue ID: #123833
- Title: `POST /api/workload/leaves` never checks `manage_rf_platform_leaves` — a user with zero leave-filing permission can still create their own leave via the REST API, bypassing the just-fixed web-form gate (BUG-PLT-054)
- Redmine version: 6
- Plugin name: redmineflux_workload
- Plugin version: current (2026-10-16, after `redmineflux_platform` commit `d8a224d`)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: N/A — confirmed via direct `curl` request with a REST API key, not the browser UI
- User role: Non-admin test user (`marigold.rayne`), zero `rf_platform` permissions of any kind
- Date: 2026-10-16

## Steps to reproduce

1. Found while doing a Security pass (`SENIOR_QA_STANDARDS.md` §28: "Authorization/permission enforcement at the
   endpoint, not just hidden in the UI") after `BUG-PLT-054` ("File and decide leave requests" permission has
   zero effect) was just confirmed fixed and closed on the web form.
2. Confirm `marigold.rayne` holds zero `rf_platform` permissions, including `manage_rf_platform_leaves`
   (`u.allowed_to?(:manage_rf_platform_leaves, nil, global: true)` → `false`), and has no band assignment and no
   project role at all.
3. Fetch her Redmine API key (`User#api_key`) and confirm `Setting.rest_api_enabled?` is `true`.
4. `POST /api/workload/leaves` with her `X-Redmine-API-Key` header and a valid body
   (`{"leave":{"leave_type":"emergency","start_date":"2026-12-14","end_date":"2026-12-14","reason":"..."}}`).
5. First attempt returned `422` — but the *only* error was `"No leave band is assigned to Marigold Rayne..."`
   (the model-layer band check from `BUG-PLT-053`'s fix, correctly firing regardless of entry point) — there was
   **no** permission-related `403`/error at all, meaning the request reached full model validation despite zero
   `manage_rf_platform_leaves`.
6. To isolate the band check from the permission check, temporarily assigned her a real Leave Policy Band
   (`QA-Band-EmergencyOnly`, 2026) via `rails runner`, then repeated the exact same API request.
7. The second request succeeded outright: `201 Created`, a real Leave record (`#14`) created for her, status
   `Pending` — with `manage_rf_platform_leaves` still confirmed `false` at the time of the request.

## Expected result

- Per the Permissions report and the now-fixed `BUG-PLT-054`, a user without `manage_rf_platform_leaves` should
  not be able to file a leave through **any** entry point — the web form (now correctly blocked) and this
  REST API endpoint (Workload's own `/api/workload/leaves`) should both enforce the identical rule, per
  `SENIOR_QA_STANDARDS.md` §30's "the same rule... enforced identically in the UI and at the API/endpoint level."

## Actual result

- `Apis::WorkloadLeavesController#create` (`app/controllers/apis/workload_leaves_controller.rb`) never checks
  `manage_rf_platform_leaves` (or any Platform permission) for a user filing their **own** leave — its only
  authorization check (`has_leave_approval_for_user?`) only fires when `requested_user_id != User.current.id`,
  i.e. filing *for somebody else*. `WorkloadBaseController`'s own gate is just `before_action :require_login` —
  any authenticated, API-enabled user can reach `create` regardless of any `rf_platform` permission.
- The model-layer `leave_type_is_one_the_band_permits` validation (the `BUG-PLT-053` fix) does still correctly
  fire here, since it is a model validation, not a controller-level check — this is why the first attempt failed
  for a band reason, not a permission reason. But a user with any Leave Policy Band assigned (which this
  environment's own migration-backfill or an administrator could do for an unrelated reason) can file leave via
  this endpoint with **zero** `manage_rf_platform_leaves`, exactly reproducing the behavior `BUG-PLT-054` fixed
  on the web form.
- Root cause: `BUG-PLT-054`'s fix (`redmineflux_platform` commit `d8a224d`, removing the `open_to_all` bypass
  from `Entry#manage?`) only changes behavior reached through Platform's own `EntitiesController` (the web form
  path, consolidated by `BUG-PLT-045`). This separate, standalone REST API controller in `redmineflux_workload`
  was never routed through `Entry#manage?` at all — it has its own independent authorization logic that was
  never updated to check the permission.

## Evidence

### Screenshot

- N/A — this is a pure REST API finding, confirmed via `curl` with a real API key, not a browser session.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-WKL-004/retest-yyyy-mm-dd-pass.png)

### Console / log

First attempt (band check fires, no permission error at all):
```
$ curl -X POST http://localhost:3013/api/workload/leaves -H "X-Redmine-API-Key: <marigold's key>" \
  -d '{"leave":{"leave_type":"emergency","start_date":"2026-12-14","end_date":"2026-12-14","reason":"..."}}'
HTTP 422
{"errors":["No leave band is assigned to Marigold Rayne. Ask an administrator to assign one before requesting leave."]}
```

Second attempt, after temporarily assigning a band (permission bypass fully proven):
```
HTTP 201
{"leave":{"id":14,"user_id":19,"user_name":"Marigold Rayne","leave_type":"emergency",
  "leave_type_label":"Emergency Leave","start_date":"2026-12-14","end_date":"2026-12-14",
  "days":"1.0","status":"pending", ...}}
```
Confirmed `marigold.rayne.allowed_to?(:manage_rf_platform_leaves, nil, global: true)` was still `false` at the
exact time of this request. Leave #14 and the temporary band assignment were deleted immediately after
confirming the finding.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): Same root permission and same user-facing defect shape as the just-closed
  `BUG-PLT-054` (Platform's own web form) — this is the identical gap reachable through a different, Workload-owned
  entry point that `BUG-PLT-054`'s fix never touched. A parallel, separate finding (`BUG-SFM-003`) exists for
  Shift Management's own equivalent REST API endpoint, same root cause, same day.

## Production report

Reported to production as **#123833** on `flux.zehntech.com`, project `ztflux`, assigned to Prashant Chaurasia,
Category "Workload Plugin", Defect Type Security, Defect Severity Medium-severity, Defect priority Medium,
Priority Medium. Not linked to any Test Run/Test Case — same as `BUG-WKL-001`/`002`/`003`, no production
Run/Suite exists yet for this plugin's own test case set. Filed as a fresh issue (not a reopen of `BUG-PLT-054`)
per explicit user instruction, since the broken code lives in this plugin's own controller, not Platform's.
