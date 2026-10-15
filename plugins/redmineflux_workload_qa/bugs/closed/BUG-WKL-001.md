# Bug Report Template

- Bug ID: BUG-WKL-001
- Production Redmine Issue ID: #123498
- Title: Existing workloads' capacity numbers go silently stale when Platform's shared "Working Hours Per Day" setting changes — no automatic recalculation and no UI button to trigger one manually
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_workload (missing recalculation trigger / missing UI control) — found via redmineflux_platform cross-plugin integration testing (the shared `SettingsService.working_hours_per_day` value this bug is about is Platform-owned)
- Plugin version: current tip, both plugins
- Environment: `redmine v6 - platform` (`redmine-docker-6-platform`), `localhost:3013`
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-10-15

## Steps to reproduce

1. Note Platform Settings' (`/redmineflux_platform/settings`) "Working hours per day" value (e.g. 7.5).
2. Create a Workload for a team with members, date range spanning several working days (e.g. 11 working days).
   Confirm its "Available Hours" / per-member "capacity" reflects the current setting (e.g. 11 × 7.5 = 82.5h ≈
   displayed as 83h per member, 165h total for 2 members).
3. Change Platform Settings' "Working hours per day" to a different value (e.g. 9.0) and save.
4. Reload the **existing** workload from step 2. Separately, open it via "Edit" and click "Update Workload"
   without changing any field.
5. Create a **brand-new** workload, same team, same date range, and open it.

## Expected result

Per the setting's own description ("Used by every plugin that converts days to hours — workload capacity,
timesheet expectations and availability reports") and the precedent already set by this same plugin for Holiday
and Leave changes (see Actual/root cause below — both of those **do** auto-recalculate every affected existing
workload), changing this shared setting should either:
- automatically recalculate every existing workload's capacity to reflect the new value, the same way a Holiday
  or Leave change already does, or at minimum
- expose a "Recalculate Capacity" control in the workload's own UI so a user can manually refresh it — which
  `WORKLOAD_USER_GUIDE.md`/the plugin's own published KB already documents as existing ("run Recalculate
  Capacity from the workload detail page").

Either way, a workload's displayed capacity should never silently diverge from what the current, live
Working Hours Per Day value would actually produce.

## Actual result

**Confirmed both halves, live:**

1. **Existing workload stays stale.** After changing the setting from 7.5 → 9.0: reloading the existing workload
   (id 3, "TC-258 Aurora Workload") still showed the old **165h total / 83h per member** (computed under 7.5).
   Opening "Edit" and clicking "Update Workload" with **no fields changed** also left it unchanged — confirmed
   in `rf_workloads_controller.rb#update`, recalculation only fires when `saved_change_to_start_date?`,
   `saved_change_to_end_date?`, or the workload's own **per-record override** `saved_change_to_working_hours_per_day?`
   is true; none of those are true for a plain re-save, and none of them is triggered by the **shared Platform
   setting** changing at all.
2. **New workload picks it up correctly.** Creating a fresh workload for the same team and the same date range
   immediately showed **198h total / 99h per member** (11 × 9.0) — confirming the live value is read correctly
   at creation time via `RfWorkload#effective_working_hours_per_day` → `RedminefluxPlatform::SettingsService.working_hours_per_day`.
3. **No "Recalculate Capacity" button exists anywhere in the UI** — confirmed by searching every view in
   `app/views/` for the string; the KB/User Guide's reference to one does not correspond to anything currently
   rendered.
4. **The backend recalculation logic itself is correct** — manually invoking the capacity calculator
   (`RfWorkloadCapacityCalculator.new(workload, user, workload_user).calculate_and_persist!`) for the stale
   workload correctly updated `available_hours` to `99` per member, and the page then displayed the correct
   **198h / 99h** once reloaded. This confirms the gap is specifically the missing *trigger* (automatic hook or
   manual button), not a defect in the calculation itself.

Root cause: `lib/redmineflux_workload/patches/platform_holiday_patch.rb` and
`lib/redmineflux_workload/patches/platform_leave_patch.rb` both call
`RfWorkloadCapacityCalculator.recalculate_all` / `.recalculate_for_date_range` / `.recalculate_for_user_date_range`
automatically whenever a Platform Holiday or Leave changes. **No equivalent hook exists for
`RedminefluxPlatform::SettingsService`'s `working_hours_per_day` value changing** — this is the one input
`effective_working_hours_per_day` depends on that has no corresponding "something changed, go recalculate"
patch, even though the calculator (`RfWorkloadCapacityCalculator.recalculate_all`) already exists and is fully
capable of doing exactly that in one call.

## Evidence

### Console / log

```
# Before setting change (Working Hours Per Day = 7.5):
Workload #3 (Team-Retest, 11 working days): Available Hours = 165h, per-member capacity = 83h

# After changing setting to 9.0, reload + "Update Workload" with no field changes:
Workload #3: still 165h / 83h (unchanged)

# New workload created after the setting change, same team/dates:
Workload #4: Available Hours = 198h, per-member capacity = 99h (correct)

# Manually invoking RfWorkloadCapacityCalculator on the stale Workload #3:
autumn.grace: available_hours = 99.0
aurora.wren:  available_hours = 99.0
# Page reload after this manual call now correctly shows 198h / 99h
```

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-WKL-001/retest-yyyy-mm-dd-pass.png)

## Duplicate check

- Duplicate found: No — this is the Working-Hours-Per-Day-specific instance of the plugin's broader
  "capacity numbers need an explicit recalculation trigger" design; Holiday and Leave changes already have
  correct, automatic hooks for the same underlying calculator, so this is a gap in hook coverage, not a new
  mechanism needing to be invented.

## Recommendation

1. Add a hook (mirroring `platform_holiday_patch.rb`/`platform_leave_patch.rb`'s pattern) on
   `RedminefluxPlatform::SettingsService`'s working-hours-per-day update path that calls
   `RfWorkloadCapacityCalculator.recalculate_all` for every workload that does **not** have its own per-record
   override set (workloads using an explicit override should correctly keep using that override, not the
   changed global default).
2. Independently of (1), expose the existing `recalculate_capacity` action (already routed, already functionally
   correct — confirmed above) as a visible "Recalculate Capacity" button on the workload detail page, matching
   what the plugin's own User Guide/KB already documents, so a user has a manual fallback even before/without (1)
   landing.

## Retest (2026-10-15) — CONFIRMED FIXED

Dev pushed a fix (`lib/redmineflux_workload/patches/setting_patch.rb`, pulled this session) — a `Setting.after_commit`
hook that calls `RfWorkloadCapacityCalculator.recalculate_all` whenever any of the watched settings actually
change: Platform's `working_hours_per_day`, the legacy Workload/Timesheet equivalents it falls back to, or
Redmine's own `non_working_week_days`. Hooked on `::Setting` directly (not the Platform's settings controller), so
a save from Administration → Plugins → Configure, a legacy screen, or a console all trigger it the same way.

**Live-verified, clean repro:** noted Workload #3 ("TC-258 Aurora Workload", Team-Retest, 2 members) at the
then-current 5.0h/day setting — 50h capacity for Autumn Grace, 60h for Aurora Wren, 110h total. Changed Platform
Settings' "Working hours per day" to 8.0 and saved. Reloaded the **existing** workload with **zero** manual
action (no Edit, no "Update Workload" click, no console command) — capacity had already recalculated to **80h /
96h / 176h total**, exactly matching the new rate (50×8/5=80, 60×8/5=96). Confirms the automatic hook genuinely
fires and the existing workload no longer goes stale.

The second half of the original Recommendation (a visible "Recalculate Capacity" button as a manual fallback) was
**not** added — no match for "Recalculate Capacity" anywhere in `app/views/`. Not a blocker: the automatic hook is
the actual fix for the reported symptom (silent staleness), and the manual button was always framed as an
independent, optional fallback, not a requirement for closing this bug.

**CONFIRMED FIXED.** Production issue **#123498** synced In QA/reported → Done, 100%.

## Production report

Reported to production as **#123498** on `flux.zehntech.com`, project `ztflux`. Not linked to any Test Run/Test
Case (per explicit instruction — no production Run/Suite exists yet for the Workload plugin). Category: Workload
Plugin. Assigned to Prashant Chaurasia. Priority: Medium | Defect Severity: Medium-severity | Defect priority:
Medium | Defect Type: Functional.

**Closed 2026-10-15** — status synced to production: Done, 100% (confirmed fixed — see Retest section above).
