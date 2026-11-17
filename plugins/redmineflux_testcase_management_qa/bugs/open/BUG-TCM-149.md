# Bug Report Template

- Bug ID: BUG-TCM-149
- Production Redmine Issue ID: #128776
- Title: `RunsController#create` (POST /runs.json) crashes with an unhandled 500 (ForbiddenAttributesError) when called with the plausible `run[run_assignments]` param shape instead of the correct `run_assignments_attributes`
- Redmine version: 6.0.0 (bookworm)
- Plugin name: redmineflux_testcase_management
- Plugin version: dev (0.0.0-dev, fresh happy-flow cross-DB instance)
- Environment: PostgreSQL (isolated Docker instance, `redmine6-happyflow-pg`, `localhost:3020`)
- Browser: N/A — found via direct REST API call (curl), not browser UI
- User role: Admin
- Date: 2026-11-17

## Steps to reproduce

1. `POST /runs.json` with a JSON body containing `run: { name, include_testcase: "true", run_assignments: [{ environment, assignee_id }] }` (plain array under the key `run_assignments` — not `run_assignments_attributes`, the actually-permitted nested-attributes key `params_run` whitelists at `runs_controller.rb:2145`).
2. Authenticate via a valid admin API key (`X-Redmine-API-Key` header).

```
curl -X POST "http://localhost:3020/runs.json" -H "X-Redmine-API-Key: <key>" -H "Content-Type: application/json" \
  -d '{"project_id":1,"run":{"name":"Milestone Summary Check Run","include_testcase":"true","run_assignments":[{"environment":"CI","assignee_id":1}]}}'
```

## Expected result

- Either the run is created successfully (if `run_assignments` is meant to be an accepted alternate shape), or the server returns a clean `422 Unprocessable Entity` / `400 Bad Request` with a descriptive validation message — consistent with how every other malformed-input case in this controller behaves (see e.g. BUG-TCM-043, BUG-TCM-046, BUG-TCM-053, all previously closed for the same "raw 500 instead of a clean error" class of defect).

## Actual result

- The server returns a raw, unhandled `500 Internal Server Error` (`{"status":500,"error":"Internal Server Error"}`), with the real exception being an uncaught `ActiveModel::ForbiddenAttributesError`.
- Root cause (confirmed by reading `app/controllers/runs_controller.rb`): lines 299–302 of `#create` iterate the **raw, unpermitted** `params[:run][:run_assignments]` array and pass each raw `ActionController::Parameters` hash directly into `@run.run_assignments.build(assignment_params)`, with no `.permit(...)` call — unlike the correctly-permitted `run_assignments_attributes` path used elsewhere in the same controller (`params_run`, line ~2145) and unlike the equivalent code in a sibling action (`update`, around line 1568–1580) which does call a `permitted_params` step before `.build`.
- Confirmed the crash is specifically caused by the bare `run_assignments` key, independent of any other param (e.g. `milestone_id` alone, without `run_assignments`, does **not** crash — it correctly proceeds to normal validation).
- Using the correct `run_assignments_attributes` shape instead creates the run successfully (HTTP 201), confirming this is a parameter-shape-specific crash, not a general creation failure.

## Evidence

### Screenshot

N/A — reproduced via direct REST API call (curl), not browser UI. See the Redmine production log excerpt below for the full server-side stack trace.

### Console / log

```
[47d3f7e8-b8b4-4131-8b88-076400a6ac68] Started POST "/runs.json" for 172.23.0.1
[47d3f7e8-b8b4-4131-8b88-076400a6ac68] Processing by RunsController#create as JSON
[47d3f7e8-b8b4-4131-8b88-076400a6ac68]   Parameters: {"project_id"=>1, "run"=>{"name"=>"Milestone Summary Check Run", "include_testcase"=>"true", "milestone_id"=>1, "run_assignments"=>[{"environment"=>"CI", "assignee_id"=>1}]}}
[47d3f7e8-b8b4-4131-8b88-076400a6ac68]   Current user: admin (id=1)
[47d3f7e8-b8b4-4131-8b88-076400a6ac68] Completed 500 Internal Server Error in 40ms
F, FATAL -- :
[47d3f7e8-b8b4-4131-8b88-076400a6ac68] ActiveModel::ForbiddenAttributesError (ActiveModel::ForbiddenAttributesError):
[47d3f7e8-b8b4-4131-8b88-076400a6ac68]   plugins/redmineflux_testcase_management/app/controllers/runs_controller.rb:301:in `block in create'
[47d3f7e8-b8b4-4131-8b88-076400a6ac68]   plugins/redmineflux_testcase_management/app/controllers/runs_controller.rb:300:in `each'
[47d3f7e8-b8b4-4131-8b88-076400a6ac68]   plugins/redmineflux_testcase_management/app/controllers/runs_controller.rb:300:in `create'
```

Isolation test confirming `milestone_id` alone is NOT the cause (proceeds to normal 422 validation instead of 500):
```
curl ... -d '{"project_id":1,"run":{"name":"Milestone Only Check Run","include_testcase":"true","milestone_id":1}}'
→ ["Start date cannot be blank","Due date cannot be blank","Environment and assignee cannot be blank", ...]  (HTTP 422, as expected)
```

Confirmation that the correctly-permitted shape works (HTTP 201):
```
curl ... -d '{"project_id":1,"run":{"name":"Milestone Summary Check Run v2","include_testcase":"true","milestone_id":1,"start_date":"2026-11-17","due_date":"2026-11-20","state":1,"run_assignments_attributes":{"0":{"environment":"CI","assignee_id":1}}}}'
→ {"message":"Run created successfully","run":{"id":9, ...}}  (HTTP 201)
```

## Severity / impact note

- Low-to-Medium: this was found while investigating RFTC-033's (Milestone Summary Report) happy-flow blocker on a cross-DB pass — the milestone feature itself works correctly once the correct param shape is used (confirmed: run created with `milestone_id`, and `/testcase_mcp/milestones/:id/{summary,report,burndown}.json` all correctly reflect it).
- The practical risk is any caller (a documented API consumer, an older client version, or a copy-paste mistake from the `run_assignments_attributes` naming) that sends the plausible-but-wrong `run_assignments` key gets an opaque 500 instead of a clean, actionable error — the same class of defect as several already-closed bugs in this plugin (BUG-TCM-043, BUG-TCM-046, BUG-TCM-053).
- Not confirmed whether any real documented client/UI path currently sends this exact shape (the modern "Add Run" web form appears to use `run_assignments_attributes` based on `params_run`'s permit list) — if nothing calls it, this is dead/unreachable code that should still be hardened (either removed, or made to `.permit` before `.build`, or rescued into a clean 422) rather than left to crash raw.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — closest prior pattern is the "raw 500 instead of clean validation error" class (BUG-TCM-043, BUG-TCM-046, BUG-TCM-053), but none of those cover this specific `run_assignments` (non-`_attributes`) param path.
