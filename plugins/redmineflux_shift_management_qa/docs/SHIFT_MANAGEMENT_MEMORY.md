# Plugin Memory — Redmineflux Shift Management

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The plugin's JS asset (`shift_management-*.js`) is loaded on EVERY page of the Redmine instance via the
  plugin-asset mechanism, not just its own feature pages — confirmed via `document.scripts` filtered to
  `plugin_assets` on an unrelated core admin page (Custom Fields).
- That same JS re-implements `[data-confirm]` click handling with an unscoped
  `document.querySelectorAll('[data-confirm]')`, duplicating Rails UJS's own native handling. Result: every
  native confirm dialog anywhere in the instance needs two accepts instead of one before the action proceeds.
  See `BUG-SFM-001`. **Fixed in plugin commit `d29e480` (rsm-093), retest PASS 2026-09-25** — handler removed;
  served asset fingerprint changed `-02242f4f.js` → `-c2dd912b.js`. Checking the served asset content for the
  old snippet is a quick way to tell whether a server actually has the fix.

## Confirmed Working

- Single-click native confirm on `data-confirm` links, both core (Custom Fields Delete) and the plugin's own
  (Attendance detail → Delete, "Delete this record?") — 2026-09-25.

## Recurring Issues

### ⚠️ Shift Calendar bypasses the plugin's own `HolidayEngine` — recurring holidays never highlight past their creation year (`BUG-SFM-002`, 2026-10-15)

Tested at the user's direct request: a Platform Holiday dated in a past year (`2025-12-25`), marked Recurring,
correctly highlights on the Shift Calendar for that literal year, but the exact same date one year later
(`2026-12-25`) shows no highlighting at all — plain `sm-shift-off`, not `sm-shift-holiday`. Root-caused from
source: `shift_dashboard_controller.rb`'s `calendar` action queries
`active_schema.rf_holiday_managements.active.where(holiday_date: @start_date..@end_date)`, a literal date-range
match with no `recurring` awareness, instead of calling the plugin's own `HolidayEngine` service
(`app/services/holiday_engine.rb`), which already implements correct recurrence (`holiday_on?`,
`holidays_for_year`, `generate_recurring`) and is what the Dashboard's "Upcoming Holidays" panel correctly uses.
**Lesson: this plugin has two independent, disagreeing code paths for "is this date a holiday" — don't assume
one screen's correct recurrence handling means another screen using the same underlying Holiday data gets it
right too.** Filed `BUG-SFM-002`.

**CONFIRMED FIXED 2026-10-16** after `git pull` (branch `redmineflux_platform`) touched `shift_dashboard_controller.rb` and `holiday_engine.rb` — Dec 25, 2026 now correctly shows `sm-shift-holiday`. Closed, production #123755 synced to Done/100%.

## Environment Notes

- Manual attendance entry (Attendance → + Manual Entry) requires Employee, Date, Punch In AND Punch Out; the
  default Status is Absent. The attendance detail page `/shift_management/attendance/:id` (the only page with
  a `data-confirm` Delete link) has no inbound link in the UI — the calendar opens an edit modal instead.
- Other plugin deletes (departments, teams, holidays, holiday schemas) use in-page modals, not `data-confirm`.

- Plugin source (read-only from this QA session) at
  `C:/redmine-docker-7.0.0/plugins/redmineflux_shift_management/` on the Docker host.

## ⚠️ This plugin's own REST API (`/shift_management/api/v1/leave`) doesn't go through Platform's permission model at all — `BUG-SFM-003` (2026-10-16)

`ShiftManagementApi::V1::LeaveController#create` builds `RedminefluxPlatform::Leave.new(leave_params)` and calls
`.save` directly — it never routes through `RedminefluxPlatform::SharedEntities.find('leaves').manage?`, so
`redmineflux_platform`'s `manage_rf_platform_leaves` permission (just fixed on Platform's own web form via
`BUG-PLT-054`) has zero effect here. Any logged-in, API-enabled user can file their own leave through this
endpoint regardless of that permission, confirmed live with a zero-permission user's own API key. The Leave
Policy Band check (`BUG-PLT-053`'s fix) correctly fires here too, since that one lives on the model itself and
is therefore entry-point-independent — this bug is specifically about the permission check, which is
controller-level and was only ever added to Platform's web controller. **Lesson: when this plugin's own REST API
controllers touch a shared Platform model directly, they need their own explicit permission check mirroring
whatever Platform's own controller enforces — being a thin wrapper around a shared model does not inherit that
model's caller's authorization for free.**
