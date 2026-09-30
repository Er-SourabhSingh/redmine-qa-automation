# Bug Report Template

- Bug ID: BUG-PLT-010
- Production Redmine Issue ID: #121588
- Title: `redmineflux_shift_management` and `redmineflux_timesheet` each monkey-patch `RedminefluxPlatform::AuditEvent.log` with incompatible signatures — whichever plugin's `init.rb` loads last silently breaks the other's audit logging across ~30 call sites
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_shift_management / redmineflux_timesheet (collision affects RedminefluxPlatform::AuditEvent, the shared model)
- Plugin version: `redmineflux_platform` branch — `redmineflux_shift_management` commit `5874fa0`, `redmineflux_timesheet` at its current branch tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin, navigate to **Shift Management → Leave** (`/shift_management/leave`).
2. Click **Apply Leave**, fill in any employee, leave type, valid dates, and a reason for an admin (which triggers the auto-approve path).
3. Click **Submit**.

(This is the shortest reliable repro; per the impact scope below, ~30 other call sites across Shift Management would reproduce the same crash by the same mechanism, since they all call the same now-broken class method.)

## Expected result

- The leave application should be created and auto-approved successfully, with an audit event recorded, and the modal should close cleanly with a success message.

## Actual result

The leave record IS created and auto-approved (confirmed via DB query), but the request then crashes with a 500 on the very next line — the audit-logging call — leaving the modal stuck with no success confirmation shown to the user:

```
ArgumentError (missing keywords: :entity, :performed_by):
plugins/redmineflux_timesheet/lib/redmineflux_timesheet/patches/platform_audit_patch.rb:109:in 'log'
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:78:in 'LeaveController#create'
lib/redmine/sudo_mode.rb:78:in 'Redmine::SudoMode::Controller#sudo_mode'
```

### Root cause (confirmed from source)

Both `redmineflux_shift_management` and `redmineflux_timesheet` ship their own `PlatformAuditPatch` module, and each independently `class_eval`s `RedminefluxPlatform::AuditEvent` to define a class method `self.log`, with **different, incompatible keyword signatures**:

`plugins/redmineflux_shift_management/lib/redmineflux_shift_management/patches/platform_audit_patch.rb:48`:
```ruby
def self.log(user_id:, action:, resource_type: nil, resource_id: nil,
             changes_data: nil, ip_address: nil)
  create!(
    performed_by: user_id, action: action,
    auditable_type: resource_type.presence || 'ShiftManagement',
    auditable_id: resource_id, changes_json: changes_data.presence,
    ip_address: ip_address, created_at: Time.now.utc
  )
rescue StandardError => e
  Rails.logger.error("[redmineflux_shift_management] audit write failed: #{e.message}")
  nil
end
```

`plugins/redmineflux_timesheet/lib/redmineflux_timesheet/patches/platform_audit_patch.rb:109`:
```ruby
def self.log(entity:, action:, performed_by:, metadata: {})
  RedminefluxPlatform::AuditService.log(
    auditable: entity || ['Unknown', nil], action: action,
    performed_by: performed_by.respond_to?(:id) ? performed_by.id : performed_by,
    metadata: metadata
  )
end
```

Each plugin's `init.rb` applies its own patch unconditionally on boot:
```
plugins/redmineflux_shift_management/init.rb:49:  RedminefluxShiftManagement::Patches::PlatformAuditPatch.apply!
plugins/redmineflux_timesheet/init.rb:37:      RedminefluxTimesheet::Patches::PlatformAuditPatch.apply!
```
Ruby's `class_eval; def self.log(...)` simply **redefines** the singleton method — there is no error, no warning, the earlier definition is just gone. Redmine loads plugins in directory order, and `redmineflux_shift_management` sorts before `redmineflux_timesheet` alphabetically, so Shift Management's patch applies first and Timesheet's applies second, silently overwriting it. **Timesheet's version is the one active on this environment** — confirmed by the exact stack trace above, which enters Timesheet's `log` method (line 109) from a Shift Management call site that still uses `user_id:`/`resource_type:`/`resource_id:`/`ip_address:` — none of which match Timesheet's `entity:`/`performed_by:`/`metadata:` signature, so Ruby raises `ArgumentError: missing keywords: :entity, :performed_by` before Timesheet's own method body (including its own internal error handling) ever runs.

Each patch does guard against being **re-applied to itself** (`shift_patch_applied?` / `timesheet_patch_applied?`), but neither guards against **the other plugin's patch already being active** — so there is no defense against this specific collision at all.

### Impact scope

Confirmed via `grep -rn "AuditEvent.log(" plugins/redmineflux_shift_management/` — **~30 call sites** across nearly the entire plugin use the now-broken `user_id:`/`resource_type:`/`resource_id:`/`ip_address:` signature, meaning this is not limited to Leave:

- `app/controllers/attendance_controller.rb` (create/update attendance)
- `app/controllers/attendance_corrections_controller.rb` (3 call sites)
- `app/controllers/leave_balances_controller.rb` (4 call sites)
- `app/controllers/leave_controller.rb` (auto_approve_leave, revoke_leave, approve_leave)
- `app/controllers/shift_assignments_controller.rb` (update/delete)
- `app/controllers/shift_change_requests_controller.rb` (6 call sites)
- `app/controllers/user_band_assignments_controller.rb`
- `app/services/attendance_auto_punch_out_service.rb` (a **background** job, not just interactive requests)
- The entire `app/controllers/shift_management_api/v1/` namespace (attendance corrections, leave, shift change requests, user band assignments)

Every one of these will crash the same way — the underlying action typically still completes (the record saves), but the response 500s with no success confirmation shown to the user, exactly matching the symptom reproduced above.

## Evidence

### Screenshot

![Apply Leave 500 from audit-log signature collision](../../screenshots/BUG-PLT-010/apply-leave-500-audit-collision.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-010/retest-yyyy-mm-dd-pass.png)

### Console / log

Browser console:
```
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://localhost:3013/shift_management/leave:0
```
Server log (full, from a fresh repro 2026-09-30):
```
F, [2026-09-30T06:34:19.954497 #1] FATAL -- :
ArgumentError (missing keywords: :entity, :performed_by):
plugins/redmineflux_timesheet/lib/redmineflux_timesheet/patches/platform_audit_patch.rb:109:in 'log'
plugins/redmineflux_shift_management/app/controllers/leave_controller.rb:78:in 'LeaveController#create'
lib/redmine/sudo_mode.rb:78:in 'Redmine::SudoMode::Controller#sudo_mode'
```
Confirmed via DB query that the underlying leave record was created and auto-approved despite the crash (test row deleted after capturing evidence, no UI delete/cancel path exists for an already-approved leave in Shift Management's own view):
```sql
SELECT id, reason, status FROM rf_leaves WHERE reason LIKE '%BUG-PLT-010%';
-- id: 8, reason: BUG-PLT-010 evidence capture, status: approved
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (this is the follow-on defect flagged during BUG-PLT-009's retest — see that bug's "Retest 2026-09-30" section)

## Production report

Reported to production 2026-09-30 as **#121588** (project `ztflux`, tracker Bug, Priority Blocker, Defect Type Functional, Defect Severity Critical, Defect priority Urgent, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121476** (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121588 attached.
