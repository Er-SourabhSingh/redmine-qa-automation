# Bug Report Template

- Bug ID: BUG-PLT-012
- Production Redmine Issue ID: #121621
- Title: Shift Management's Leave Type Create and Update both fail with a 400 — `LeaveTypesController` still expects the stale `rf_leave_type` param key instead of the new `redmineflux_platform_leave_type` key the consolidated form actually sends
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_shift_management (surfaced via redmineflux_platform's consolidated LeaveType model)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, navigate to **Shift Management → Leave → Leave Types** tab (`/shift_management/leave?tab=types`).
2. Click **New Leave Type**.
3. Fill in a name, click **Create**.

## Expected result

- The leave type should be created successfully and appear in the Leave Types list, immediately usable from Leave Type dropdowns in both Shift Management and (per `PLATFORM_PLUGIN_TESTER_GUIDE.md`'s "Who shares what" table) any other consumer of `rf_leave_types`.

## Actual result

Submission fails with a 400. No error message is surfaced in the UI beyond the generic failed-request console error — the form simply doesn't redirect and nothing is created.

Underlying request confirmed via server log:
```
Started POST "/shift_management/leave_types" for ... at 2026-09-30 07:11:50 +0000
Processing by LeaveTypesController#create as */*
  Parameters: {"authenticity_token"=>"...", "redmineflux_platform_leave_type"=>{"name"=>"PLT-VERIFY-CrossPlugin-Type", "description"=>"", "paid"=>"1", "allow_half_day"=>"1", "monthly_accrual"=>"0", "carry_forward"=>"0", "active"=>"1", "accrual_days"=>"0.0", "max_carry_forward_days"=>"0.0"}}
Completed 400 Bad Request in 8ms

ActionController::ParameterMissing (param is missing or the value is empty: rf_leave_type):
plugins/redmineflux_shift_management/app/controllers/leave_types_controller.rb:86:in 'LeaveTypesController#leave_type_params'
plugins/redmineflux_shift_management/app/controllers/leave_types_controller.rb:26:in 'LeaveTypesController#create'
```
Confirmed no orphan data — the crash happens in `leave_type_params`, before `RedminefluxPlatform::LeaveType.new`/`@leave_type.save` is ever reached.

### Root cause (confirmed from source)

The exact same defect class as `BUG-PLT-009` (Shift Management's Leave) and `BUG-PLT-011` (Workload's Leave) — a **third occurrence in the same plugin**, this time for Leave Type:

```ruby
# plugins/redmineflux_shift_management/app/controllers/leave_types_controller.rb
def new
  @leave_type = RedminefluxPlatform::LeaveType.new(paid: true, allow_half_day: true, active: true)
  ...
end

def create
  @leave_type = RedminefluxPlatform::LeaveType.new(leave_type_params)
  ...
end

def update
  if @leave_type.update(leave_type_params)
  ...
end

def leave_type_params
  params.require(:rf_leave_type).permit(...)   # <-- stale key, no separate update_leave_type_params
end
```
Since the form is built from a `RedminefluxPlatform::LeaveType` instance, Rails auto-derives the param key as `redmineflux_platform_leave_type` — exactly what the browser sends (confirmed above). `leave_type_params` still requires the plugin's own pre-consolidation key, `:rf_leave_type`. `update` reuses the identical `leave_type_params` method, so **editing an existing leave type is equally broken**, not just creating one.

### Scope correction — this narrows what was said in `BUG-PLT-011`

`BUG-PLT-011` stated this defect class was "isolated to Leave, not a wider pattern" based on spot-checking Team (Shift Management) and Holiday (Helpdesk) creation, both of which worked correctly. **That conclusion was too broad** — it holds for Team/Holiday, but not for every consolidated entity: **Leave Type in Shift Management has the identical defect.** The accurate scope, confirmed so far: every consolidated-entity controller whose form was rebuilt against the new `RedminefluxPlatform::*` model — Leave (Shift Management, Workload) and now Leave Type (Shift Management) — has this bug; Team/Holiday/HolidayScheme/Organization/Contact controllers checked so far do not, because their views were never switched to the Rails-auto-derived key. Given this is now the third occurrence, **every remaining consolidated-entity controller across all 6 consumer plugins should be spot-checked for the same pattern before concluding the scope is fully mapped** — do not assume Team/Holiday/HolidayScheme/Organization/Contact are uniformly safe just because 2 of them were checked.

## Evidence

### Screenshot

![Leave Type create 400](../../screenshots/BUG-PLT-012/leave-type-create-400.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-012/retest-yyyy-mm-dd-pass.png)

### Console / log

Browser console:
```
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) @ http://localhost:3013/shift_management/leave_types:0
```
Server log: see Actual result above (full trace already included there).

## Duplicate check

- Duplicate found: No — related to `BUG-PLT-009`/`BUG-PLT-011` (same defect class, different controller/entity within the same plugin) but not a duplicate.
- Existing bug reference (if duplicate): See `BUG-PLT-009` (Shift Management Leave) and `BUG-PLT-011` (Workload Leave) for the analogous defects.

## Production report

Reported to production 2026-09-30 as **#121621** (project `ztflux`, tracker Bug, Priority Blocker, Defect Type Functional, Defect Severity Critical, Defect priority Urgent, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121476 (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121621 attached.

## Retest 2026-10-01 — CONFIRMED FIXED, closed

Pulled commit `0d8946f` (redmineflux_shift_management — confirmed in current `git log`), ran pending migrations, restarted, retested the exact original repro live: Shift Management → Leave → Leave Types tab → New Leave Type → Name "PLT-BUG012-Retest" → Create.

- `POST /shift_management/leave_types` → **302** (was 400), "Leave type created successfully." shown, new type appears in the list.
- Confirmed via DB the record was created cleanly (`RedminefluxPlatform::LeaveType`, `active: true`).
- Per the dev's journal, this fix also included a full sweep of every consolidated-entity form across all 6 consumer plugins (tracing the instance-variable each `form_for` is built from into every view it renders) to confirm no fourth instance of this defect class remains — every other form pins its param key explicitly via `as:`, this was the only one (plus the two Leave forms) that didn't.

Fixed. Test fixture leave type deleted after verification. Closed — moving to `bugs/closed/`.
