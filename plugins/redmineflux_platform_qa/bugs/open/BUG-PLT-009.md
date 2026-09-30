# Bug Report Template

- Bug ID: BUG-PLT-009
- Production Redmine Issue ID: #121556
- Title: Shift Management's "Apply Leave" is completely broken — every submission fails with a 400 because the controller still expects the old `rf_leave_application` param key instead of the new `redmineflux_platform_leave` key the consolidated form actually sends
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_shift_management (surfaced via redmineflux_platform's consolidated Leave model)
- Plugin version: `redmineflux_platform` branch, commit `5db0312`
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-29

## Steps to reproduce

1. Log in as Admin, navigate to **Shift Management → Leave** (`/shift_management/leave`).
2. Click **Apply Leave**.
3. In the "Apply for Leave" modal, select any employee ("Apply For"), any Leave Type, valid From/To dates, and a Reason.
4. Click **Submit**.

## Expected result

- The leave application should be created successfully (as it is when the same action is performed from Platform's own "New Leave Request" screen, `/redmineflux_platform/list/leaves/new`, which works correctly), the modal should close, and the new request should appear in the Applications list.

## Actual result

**Every submission fails.** The modal's Submit button gets stuck permanently on "Saving..." with no error message shown to the user at all — there is no visible indication anything went wrong, the modal simply never completes or closes.

Underlying request: `POST /shift_management/leave` → **400 Bad Request**, empty response body, confirmed via `browser_network_requests`:
```
POST http://localhost:3013/shift_management/leave => [400] Bad Request
```

### Root cause (confirmed from server logs and source)

Server log for the failed request:
```
F, [...] FATAL -- : ActionController::ParameterMissing (param is missing or the value is empty: rf_leave_application):
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:199:in 'LeaveController#leave_params'
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:65:in 'LeaveController#create'
```

The request's actual submitted parameters (captured via `browser_network_request`, request-body):
```
"redmineflux_platform_leave" => {
  "user_id" => "1", "leave_type_id" => "4",
  "from_date" => "2026-11-02", "to_date" => "2026-11-03",
  "half_day" => "0", "half_day_period" => "", "reason" => "..."
}
```

`leave_controller.rb`'s `new`/`create` actions build the form and the record from **Platform's** consolidated model:
```ruby
def new
  @leave = RedminefluxPlatform::Leave.new(from_date: Date.today, to_date: Date.today)
  ...
end

def create
  @leave = RedminefluxPlatform::Leave.new(leave_params)
  ...
end
```
Since the form is built `form_with`-style from a `RedminefluxPlatform::Leave` instance, Rails auto-derives the param key as `redmineflux_platform_leave` — exactly what the browser actually sends (confirmed above). But `leave_params` (and `update_leave_params`, used by `edit`/`update` — same bug, not yet independently reproduced but shares the identical code path) still does:
```ruby
def leave_params
  params.require(:rf_leave_application).permit(
    :leave_type_id, :from_date, :to_date,
    :half_day, :half_day_period, :reason
  )
end
```
`rf_leave_application` was Shift Management's own pre-consolidation param key (presumably matching an old, now-replaced `RfLeaveApplication` model name). When the controller's `create`/`new` actions were updated to use the new consolidated `RedminefluxPlatform::Leave` model, `leave_params`/`update_leave_params` were never updated to match — they still `require` the old key, which is never present in a request built from the new model, so **every single submission raises `ActionController::ParameterMissing`**, which Rails' default exception handling turns into an unhandled 400 with no rendered error page/message — exactly matching the silent "stuck on Saving..." symptom the user sees.

This is not a partial/edge-case bug — it unconditionally fires on every Create (and very likely every Update, given `update_leave_params` has the identical `require(:rf_leave_application)`), for every user, every leave type, every date range, via Shift Management's UI. Platform's own "New Leave Request" screen (`/redmineflux_platform/list/leaves/new`) is unaffected — confirmed working, creates leave records cleanly — because it posts to Platform's own controller/route, not Shift Management's.

## Evidence

### Screenshot

![Apply Leave stuck on Saving, 400 in background](../../screenshots/BUG-PLT-009/apply-leave-stuck-saving-400.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-009/retest-yyyy-mm-dd-pass.png)

### Console / log

Browser console:
```
[ERROR] Failed to load resource: the server responded with a status of 400 (Bad Request) @ http://localhost:3013/shift_management/leave:0
```
Server log (full):
```
Started POST "/shift_management/leave" for ... at 2026-09-29 13:34:01 +0000
Processing by LeaveController#create as */*
  Parameters: {"authenticity_token"=>"...", "redmineflux_platform_leave"=>{"user_id"=>"1", "leave_type_id"=>"4", "from_date"=>"2026-11-02", "to_date"=>"2026-11-03", "half_day"=>"0", "half_day_period"=>"", "reason"=>"BUG-PLT investigation - testing Apply Leave 400 error"}}
  Current user: admin (id=1)
Completed 400 Bad Request in 12ms (ActiveRecord: 2.2ms (3 queries, 0 cached) | GC: 0.6ms)
FATAL -- : ActionController::ParameterMissing (param is missing or the value is empty: rf_leave_application):
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:199:in 'LeaveController#leave_params'
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:65:in 'LeaveController#create'
lib/redmine/sudo_mode.rb:78:in 'Redmine::SudoMode::Controller#sudo_mode'
```
Relevant source (`plugins/redmineflux_shift_management/app/controllers/leave_controller.rb`):
```ruby
def leave_params
  params.require(:rf_leave_application).permit(
    :leave_type_id, :from_date, :to_date,
    :half_day, :half_day_period, :reason
  )
end

def update_leave_params
  params.require(:rf_leave_application).permit(
    :leave_type_id, :from_date, :to_date,
    :half_day, :half_day_period, :reason
  )
end
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-09-29 as **#121556** (subject shortened to fit the 255-char limit: "Shift Management \"Apply Leave\" always fails with 400 — controller expects stale rf_leave_application param key"; project `ztflux`, tracker Bug, Priority Blocker, Defect Type Functional, Defect Severity Critical, Defect priority Urgent, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121476** (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121556 attached (in addition to #121548 and #121551 from BUG-PLT-007/008, all three on the same testcase).

## Retest 2026-09-30 — NOT RESOLVED (feature still broken end-to-end)

Fix commit `5874fa0` (redmineflux_shift_management) does genuinely fix the originally-reported crash: `leave_params`/`update_leave_params`/`determine_target_user_id` now use `redmineflux_platform_leave`, confirmed via server log — the `ActionController::ParameterMissing: rf_leave_application` exception is gone, and a submission now reaches `@leave.save` successfully (confirmed: leave record was created and auto-approved in the DB).

**However, the feature is still not usable end-to-end.** The same repro steps (Apply Leave → fill form → Submit) now crash on a *different* exception, immediately after the successful save, on the `auto_approve_eligible?` branch's audit-logging call:
```
ArgumentError (missing keywords: :entity, :performed_by):
plugins/redmineflux_timesheet/lib/redmineflux_timesheet/patches/platform_audit_patch.rb:109:in 'log'
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:78:in 'LeaveController#create'
```
Root cause: `redmineflux_shift_management` and `redmineflux_timesheet` each independently monkey-patch `RedminefluxPlatform::AuditEvent.log` with incompatible keyword signatures (`user_id:/resource_type:/resource_id:/ip_address:` vs. `entity:/performed_by:/metadata:`). Whichever plugin's `init.rb` applies its patch last silently overwrites the other's version — confirmed via source: `plugins/redmineflux_shift_management/lib/redmineflux_shift_management/patches/platform_audit_patch.rb:48` defines one signature, `plugins/redmineflux_timesheet/lib/redmineflux_timesheet/patches/platform_audit_patch.rb:109` defines the other, and Timesheet's is the one active on this environment.

**User-visible result is unchanged from the original report**: the modal gets stuck on "Saving..." with no error shown, and the request fails (500 instead of 400) — even though the leave record itself is now silently created behind the crash. Confirmed via DB query that the record exists and is approved, invisible in the UI until a manual page reload.

This is a genuinely different root cause than the one originally reported here (stale param key vs. a cross-plugin monkey-patch collision on a shared audit model), so per this repo's retest convention it gets its own bug rather than being folded back into this one — see **BUG-PLT-010**. **This bug (BUG-PLT-009) stays OPEN**: its own originally-reported symptom is fixed, but "Apply Leave works" as a whole is still false, and closing this one without linking to what's actually still blocking it would misrepresent the feature as usable when it is not.

Impact scope of the new defect (BUG-PLT-010) is much wider than just Leave — confirmed ~30 call sites across nearly all of `redmineflux_shift_management` (attendance, leave, shift assignments, shift change requests, user band assignments, a background auto-punch-out service, and the whole API v1 layer) use the same now-broken `AuditEvent.log(user_id: ...)` signature.
