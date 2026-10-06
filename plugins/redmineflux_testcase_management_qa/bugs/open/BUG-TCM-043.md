# BUG-TCM-043

- Bug ID: BUG-TCM-043
- Production Redmine Issue ID: #122099
- Title: `bulk_testcase_create` crashes with a raw 500 (not the documented 422) on a truly fresh instance where the plugin tracker was never configured at all
- Severity: Medium
- Redmine version: 7.0.0 (disposable throwaway Docker instance, see Evidence)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Throwaway Redmine 7.0.0 instance (`tcm-throwaway-7x`), fresh install, plugin migrated, `Setting.plugin_redmineflux_testcase_management` set to `{}` (no `tracker` key at all — the genuine never-configured state)
- Browser: N/A (direct API call)
- User role: Admin (`admin`, via API key)
- Date: 2026-10-06

## Summary

`RunsController#bulk_testcase_create` has an explicit guard clearly intended to return a clean `422` when the
testcase tracker isn't configured:
```ruby
tracker_id = Setting.plugin_redmineflux_testcase_management['tracker'].first.to_i
if tracker_id == 0
  return render json: { error: l(:error_tracker_missing_testcase) }, status: :unprocessable_entity
end
```
This assumes `Setting.plugin_redmineflux_testcase_management['tracker']` is always at least an empty array
(`[]`, whose `.first` is `nil`, whose `.to_i` is `0` — the intended path). But on a **genuinely fresh
instance where `testcase/set_tracker.json` has never been called even once**, the plugin settings hash has no
`'tracker'` key at all — `Setting.plugin_redmineflux_testcase_management['tracker']` is `nil`, and `nil.first`
raises `NoMethodError` before the `if tracker_id == 0` check is ever reached. The guard the developer wrote to
handle exactly this precondition never executes, because the crash happens one line earlier.

## Steps to reproduce

1. On a Redmine instance where the plugin has just been installed/migrated and `Setting
   .plugin_redmineflux_testcase_management` has never had its `tracker` key set (confirm via `rails runner
   'puts Setting.plugin_redmineflux_testcase_management.inspect'` → `{}`), call:
   ```
   curl -i -X POST -H "X-Redmine-API-Key: <admin key>" -H "Content-Type: application/json" \
     -d '{"test_cases":[{"testcase":{"project_id":1,"subject":"Bulk TC A","priority_id":1},"steps_and_results":[{"step":"1","expected":"Page loads"}]}]}' \
     http://<host>/testcase/bulk_testcase_create.json
   ```

## Expected result

- HTTP 422 with the documented `error_tracker_missing_testcase` message (per `API.md`: `422 | Invalid data /
  tracker not configured`); no issue created.

## Actual result

- HTTP 500, generic `{"status":500,"error":"Internal Server Error"}` body. Server log shows:
  ```
  NoMethodError (undefined method 'first' for nil):
  plugins/redmineflux_testcase_management/app/controllers/runs_controller.rb:1107:in 'RunsController#bulk_testcase_create'
  ```
  No issue was created (confirmed via `Issue.where(subject: "Bulk TC A").exists?` → `false`) — the crash happens
  before any write, so there's no data-corruption risk, just a misleading/unhelpful error response instead of
  the documented clean one.

## Evidence

### Console / log

```
$ rails runner 'puts Setting.plugin_redmineflux_testcase_management.inspect'
{}

$ curl -i -X POST -H "X-Redmine-API-Key: <key>" ... /testcase/bulk_testcase_create.json
HTTP/1.1 500 Internal Server Error
{"status":500,"error":"Internal Server Error"}

$ docker logs ... | tail
NoMethodError (undefined method 'first' for nil):
  .../runs_controller.rb:1107:in 'RunsController#bulk_testcase_create'

$ rails runner 'puts Issue.where(subject: "Bulk TC A").exists?'
false
```

### Fix suggestion

`Setting.plugin_redmineflux_testcase_management['tracker']&.first.to_i` (safe navigation) would let the
existing `if tracker_id == 0` guard handle this case exactly as already intended.

## Test case coverage

Found while executing TC-API-03-02 (P2, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — reproduced on a genuinely fresh,
never-configured instance (a disposable throwaway Redmine 7.0.0 container built specifically for this test,
since the precondition — "a project where the tracker was never configured" — cannot exist on an
already-running shared instance where the tracker setting is instance-wide, not per-project).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — related to but distinct from BUG-TCM-040 (same
  controller method, different line: BUG-TCM-040 is a missing-`steps_and_results` crash further down the
  method; this is a missing-tracker-setting crash earlier in the method, before BUG-TCM-040's code path is even
  reached).

## Production report

Reported to production `ztflux` as #122099 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
