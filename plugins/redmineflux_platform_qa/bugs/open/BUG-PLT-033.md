# Bug Report Template

- Bug ID: BUG-PLT-033
- Production Redmine Issue ID: #121866
- Title: Shift Management's own Edit Holiday form can never successfully change a holiday's date, in either direction — it never submits `end_date`, so a stale `end_date` left behind by the shared model's "fill end_date from date on create" default makes every subsequent date edit fail validation (either "End date is invalid" or a false-positive overlap)
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_shift_management (patches `RedminefluxPlatform::Holiday`)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Create a Holiday from Shift Management's own screen (`/shift_management/holiday_schemas/<id>` → "Add Holiday") with just a Name, Date, and Type — this form has no End Date field at all.
2. Open that same holiday's Edit form from the same screen and change the Date to any **later** date.
3. Save.
4. Separately, reproduce again (fresh holiday): open Edit and change the Date to any **earlier** date that happens to fall before another holiday already in the same scheme.
5. Save.

## Expected result

- Changing a holiday's date from its own origin plugin's Edit form should succeed and be reflected consistently everywhere (this is exactly `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-165's own premise), the same way it already works correctly when the same kind of edit is made from Helpdesk's own Edit form (confirmed working, TC-PLT-164) or Workload's own Edit form (confirmed working, same TC-165).

## Actual result

**Moving the date later** fails with a 422 and the message **"End date is invalid"**. Reproduced with `PLT-CRUD-Holiday-ShiftMgmt` (id 515): created at 2031-03-04 via Shift Management's own Add Holiday, then edited to 2031-06-20 via Shift Management's own Edit Holiday — rejected, DB confirms the row never changed (`date` still 2031-03-04).

**Moving the date earlier** does not fail with the same message, but fails anyway with a **false-positive overlap**: editing the same holiday to 2031-02-01 (no real overlap exists with this date alone) was rejected with **"overlaps PLT-CRUD-Holiday-Platform (Mar 01, 2031)"** — a holiday that is nowhere near 2031-02-01 on its own.

### Root cause (confirmed from source)

Shift Management's `HolidaysController#update` (`app/controllers/holidays_controller.rb`):
```ruby
def holiday_params
  params.require(:rf_holiday_management).permit(
    :name, :holiday_date, :holiday_type, :description,
    :recurring, :recurrence_type, :optional, :active, :schema_id
  )
end
```
`:holiday_date` is aliased to the shared model's `date` column (`alias_attribute :holiday_date, :date`, in `platform_holiday_patch.rb`). **`end_date` is never in this permit list and the Edit form has no End Date field at all** — Shift Management's whole UI treats "holiday" as single-day-only.

On **create**, `RedminefluxPlatform::Holiday` has a `before_save :set_end_date_if_blank` callback (`self.end_date = date if end_date.blank? && date.present?`) that fills `end_date` to match `date` automatically — so a Shift-Management-created holiday ends up with `date == end_date`, and Create works fine (confirmed, TC-PLT-163 PASS).

On **update**, `end_date` is **no longer blank** (it already holds the original date from creation), so `set_end_date_if_blank` does nothing. The controller changes `date` to the new value but `end_date` silently stays at the **old** date. Two validations on the shared model then correctly act on this now-genuinely-inconsistent record:
- `end_date_after_start_date` (`errors.add(:end_date, :invalid) if end_date < date`) fires when the new date is *later* than the stale `end_date` — this is "End date is invalid".
- `no_overlapping_dates_in_scheme` fires when the new date is *earlier* than the stale `end_date`, because the record's own effective range is now `[new_date, stale_old_end_date]` — a phantom multi-day span nobody intended — and if any other holiday in the scheme falls inside that phantom range, it is reported as an "overlap" even though no real overlap with the actual, intended single day exists.

**Net effect: Shift Management's Edit Holiday feature cannot successfully change a date at all**, for any holiday created in the normal way (end_date == date) — which is every holiday this plugin's own UI is capable of creating, since it never exposes an End Date field to set a genuinely different value in the first place.

## Evidence

### Screenshot

![Edit form rejecting a legitimate date change as a false-positive overlap, caused by a stale end_date left behind from a previous edit attempt](../../screenshots/BUG-PLT-033/shift-mgmt-edit-holiday-overlap-false-positive.png)

### Console / log

```
POST /shift_management/holidays/515 => 422 Unprocessable Content
Attempt 1 (date moved later, 2031-03-04 -> 2031-06-20): "End date is invalid"
Attempt 2 (date moved earlier, 2031-03-04 -> 2031-02-01): "overlaps PLT-CRUD-Holiday-Platform (Mar 01, 2031)"
```
DB confirms the row (`rf_holidays` id 515) never changed across either attempt — `date` and `end_date` both still read the original 2031-03-04 throughout.

## Duplicate check

- Duplicate found: No new finding of this exact mechanism in `bugs/_index.md`. Not the same as `BUG-PLT-012` (Leave Type create/update stale-param-key class) or `BUG-PLT-009`/`011` (similar stale-key family on Leaves) — those are about a wrong *key name* being read; this is about a *column this plugin's UI never exposes at all* (`end_date`) being left stale by an update that only ever touches a sibling column (`date`).

## Production report

Reported to production `ztflux` as **#121866** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121704 ("Cross-Plugin CRUD Matrix", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: High (priority_id 3); Defect custom fields: Type=Functional, Severity=High-severity, Priority=High.
