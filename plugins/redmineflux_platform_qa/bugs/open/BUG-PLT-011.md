# Bug Report Template

- Bug ID: BUG-PLT-011
- Production Redmine Issue ID: #121589
- Title: Workload's "Request Leave" is completely broken — Create and Update both fail with a 400 because `RfLeavesController#leave_params` still expects the old `rf_leave` param key instead of the new `redmineflux_platform_leave` key the consolidated form actually sends
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_workload (surfaced via redmineflux_platform's consolidated Leave model)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, navigate to **Workloads → Leaves** (`/rf_leaves`).
2. Click **+ Request Leave**.
3. In the drawer, pick a From/To date, a Leave Type, and a Reason.
4. Click **Request**.

## Expected result

- The leave application should be created successfully (as it is when the same action is performed from Platform's own "New Leave Request" screen, `/redmineflux_platform/list/leaves/new`, which works correctly), the drawer should close, and the new request should appear in the leave list.

## Actual result

Every submission fails. The drawer does at least surface a visible error to the user this time ("Error submitting leave request. Please try again.") — better than Shift Management's silent hang (BUG-PLT-009's original symptom) — but the feature is completely non-functional; no leave record is created.

Underlying request: `POST /rf_leaves` → **400 Bad Request**, confirmed via server log:
```
Started POST "/rf_leaves" for ... at 2026-09-30 06:25:50 +0000
Processing by RfLeavesController#create as JS
  Parameters: {"redmineflux_platform_leave"=>{"user_id"=>"1", "start_date"=>"2026-11-20", "end_date"=>"2026-11-21", "leave_type"=>"unpaid", "reason"=>"..."}, "commit"=>"Request"}
  Current user: admin (id=1)
Completed 400 Bad Request in 9ms (ActiveRecord: 2.1ms (3 queries, 0 cached) | GC: 0.8ms)

ActionController::ParameterMissing (param is missing or the value is empty: rf_leave):
plugins/redmineflux_workload/app/controllers/rf_leaves_controller.rb:469:in 'RfLeavesController#leave_params'
plugins/redmineflux_workload/app/controllers/rf_leaves_controller.rb:118:in 'RfLeavesController#create'
```

Confirmed no orphan data — this crash happens in `leave_params`, before `RedminefluxPlatform::Leave.new`/`@leave.save` is ever reached, so unlike BUG-PLT-010's crash (which happens after save), nothing is written to the DB.

### Root cause (confirmed from source)

This is the exact same defect class as the original BUG-PLT-009 (Shift Management's stale `rf_leave_application` key), but in a **different plugin/controller that was never touched by any fix**:

```ruby
# plugins/redmineflux_workload/app/controllers/rf_leaves_controller.rb:117
def create
  @leave = RedminefluxPlatform::Leave.new(leave_params)
  ...
```
```ruby
# line 468
def leave_params
  params.require(:rf_leave).permit(
    ...
  )
end
```
```ruby
# line 212-216
def update
  ...
  if @leave.update(leave_params)
```
Since the record is built from `RedminefluxPlatform::Leave`, the actual submitted param key is `redmineflux_platform_leave` (confirmed above) — but `leave_params` still requires the plugin's own pre-consolidation key, `:rf_leave`. `update` reuses the identical `leave_params` method, so **editing an existing leave via Workload's UI is equally broken**, not just creating one.

### Scope check — CORRECTED 2026-09-30, was too broad

Before filing, checked whether the same stale-key defect exists for other entities across all 6 consumer plugins. At the time, only Team (Shift Management's native "New Team") and Holiday (Helpdesk's native "New Holiday") were spot-checked live, both succeeding with no error — this was generalized into "isolated to Leave," which turned out to be **wrong**. Executing `PLATFORM_DATA_MIGRATION_INTEGRITY.md` TC-PLT-046 immediately afterward found the identical defect a third time, in the same plugin, for **Leave Type**: `plugins/redmineflux_shift_management/app/controllers/leave_types_controller.rb`'s `leave_type_params` still requires `:rf_leave_type` instead of the Rails-auto-derived `redmineflux_platform_leave_type` — filed as **`BUG-PLT-012`**.

**Corrected scope**: this defect class is not "isolated to Leave" — it affects every consolidated-entity controller whose form was rebuilt against the new `RedminefluxPlatform::*` model (confirmed so far: Leave in both Shift Management and Workload, Leave Type in Shift Management), while entities whose views were never touched (Team, Holiday, confirmed working) are unaffected. HolidayScheme, Organization, and Contact controllers across all 6 plugins have **not yet been individually verified** and should not be assumed safe — see `BUG-PLT-012`'s note recommending a full sweep before considering this scope fully mapped.

## Evidence

### Screenshot

![Workload Request Leave 400 error](../../screenshots/BUG-PLT-011/workload-request-leave-400-error.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-011/retest-yyyy-mm-dd-pass.png)

### Console / log

Browser console:
```
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) @ http://localhost:3013/rf_leaves:0
```
Server log (full):
```
Started POST "/rf_leaves" for 172.18.0.1 at 2026-09-30 06:25:50 +0000
Processing by RfLeavesController#create as JS
  Parameters: {"redmineflux_platform_leave"=>{"user_id"=>"1", "start_date"=>"2026-11-20", "end_date"=>"2026-11-21", "leave_type"=>"unpaid", "reason"=>"BUG-PLT-009 investigation - testing Workload leave request path"}, "commit"=>"Request"}
  Current user: admin (id=1)
Completed 400 Bad Request in 9ms (ActiveRecord: 2.1ms (3 queries, 0 cached) | GC: 0.8ms)
FATAL -- :
ActionController::ParameterMissing (param is missing or the value is empty: rf_leave):
plugins/redmineflux_workload/app/controllers/rf_leaves_controller.rb:469:in 'RfLeavesController#leave_params'
plugins/redmineflux_workload/app/controllers/rf_leaves_controller.rb:118:in 'RfLeavesController#create'
lib/redmine/sudo_mode.rb:78:in 'Redmine::SudoMode::Controller#sudo_mode'
```

## Duplicate check

- Duplicate found: No — related to BUG-PLT-009 (same defect class, different plugin/controller, never fixed there) but not a duplicate.
- Existing bug reference (if duplicate): See BUG-PLT-009 for the analogous Shift Management defect.

## Production report

Reported to production 2026-09-30 as **#121589** (project `ztflux`, tracker Bug, Priority Blocker, Defect Type Functional, Defect Severity Critical, Defect priority Urgent, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121476** (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121589 attached.
