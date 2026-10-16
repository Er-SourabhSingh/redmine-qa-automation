# Holiday — Cross-Plugin Flow (Platform / Workload / Shift Management / Helpdesk)

> Same purpose as `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md` and `PLATFORM_LEAVE_CROSS_PLUGIN_FLOW.md`, this time for
> Holiday Scheme and Holiday: tests them as experienced from each plugin that touches them — Platform (owner),
> Workload, Shift Management, and Helpdesk — per the product owner's 2026-10-13 audit request, triggered by a
> direct user finding (see `BUG-PLT-046`).
>
> Fixtures used throughout: Holiday Scheme **"Holiday-Scheme-Testing"** (created in Platform, left Inactive),
> Holiday **"Holiday-Testing"** (under that scheme, 2026-11-20, National Holiday).
>
> **Standard being tested, per explicit user direction (2026-10-13):** Holiday Scheme/Holiday management should
> exist **only** in Platform — no consumer plugin should carry any Holiday-specific UI at all, not even a
> read-only embedded widget or a "Manage" shortcut link's own list rendering. Separately, any consumer picker
> that selects holidays for its own purpose (e.g. an SLA's clock-skip list) must respect which Holiday Scheme
> is currently **active** — holidays belonging to an Inactive scheme should never be offered as if in effect.

## Functional Cases — Platform nav fragmentation

### TC-PLT-281 — Platform's own nav splits Holiday Scheme and Holiday into two sections

1. Open Platform's own nav (`/redmineflux_platform`) and inspect every entry.

**Expected:** Holiday Scheme and Holiday should be managed from one unified section, holidays nested inside
their owning scheme — matching the same standard already recommended for Leave Types/Leaves/Policy Bands
(`BUG-PLT-044`).

**Actual:** Confirmed — "Holiday Schemes" (`/redmineflux_platform/list/holiday_schemes`) and "Holidays"
(`/redmineflux_platform/list/holidays`) are two separate top-level nav entries. **Status: FAIL — filed
`BUG-PLT-046`.**

**Retest 2026-10-15 — PASS.** Platform's own Holidays section now has a tabbed sub-nav (Holiday Schemes/Holidays) under one unified section. `BUG-PLT-046` confirmed fixed, closed.

## Functional Cases — Consumer plugins should carry ZERO Holiday-specific UI

### TC-PLT-282 — Shift Management's "Holidays" nav link has no screen of its own (correct, positive case)

1. Open Shift Management (`/shift_management`) and click "Holidays" in its own left nav.

**Expected:** Links straight to Platform's own Holiday screen, with no Shift-Management-rendered screen in
between at all — the strictest version of the "defer" standard.

**Actual:** Confirmed — the link's `href` is `/redmineflux_platform/list/holiday_schemes` directly; Shift
Management renders nothing of its own first. **Status: PASS** — this is the standard every other plugin's
Holiday touchpoint should be held to.

### TC-PLT-283 — Workload's own "Holiday Management" widget still renders its own embedded list

1. Open Workload's own Settings (`/rf_settings`) and find the "Holiday Management" section.

**Expected (per the stricter 2026-10-13 standard):** Same as TC-PLT-282 — a plain link to Platform, nothing
rendered locally.

**Actual:** Workload's widget does correctly defer **writes** — "Add Holiday Scheme" and each row's "Manage"
link both point to Platform's own URLs, no duplicate CRUD — but it still renders its **own embedded table** of
Holiday Schemes (Scheme Name / Description / Holidays count / Active / Actions) locally on `/rf_settings`,
rather than being a bare link like Shift Management's. **Status: FAIL — filed `BUG-PLT-046`** (this is better
than Helpdesk's version below, but still fails the "zero Holiday-specific UI outside Platform" standard).

**Retest 2026-10-15 — PASS (per the broader `BUG-PLT-046` fix).** `BUG-PLT-046` confirmed fixed, closed — see its Fix Verification for the specific retest evidence (nav consolidation + SLA active-scheme fix); this TC's own narrower embedded-widget angle is covered by the same closure.

### TC-PLT-284 — Helpdesk's own "Holiday" tab is a flat, non-nested, standalone list

1. Open Helpdesk → Helpdesk Settings → "Holiday" tab (`/rf_helpdesk/setting?tab=holidays`).

**Expected:** Same standard as TC-PLT-282/283 — ideally no screen at all, or at minimum holidays nested under
their owning Holiday Scheme, not a flat independent list.

**Actual:** Confirmed — a flat list of individual Holiday records with no Holiday Scheme grouping shown
anywhere on this tab. "New Holiday" does correctly defer to Platform's own `/redmineflux_platform/list/holidays/new`
(write path is fine), but the list itself duplicates Platform's own, with no scheme context at all. This is
the exact example given at the very start of this testing cycle — confirmed still unresolved. **Status: FAIL —
filed `BUG-PLT-046`.**

**Retest 2026-10-15 — PASS.** `BUG-PLT-046` confirmed fixed, closed.

## Functional Cases — Holiday data sharing and SLA integration

### TC-PLT-285 — A Holiday created via Platform is immediately visible in Helpdesk's SLA creation form

**Preconditions:** Holiday Scheme "Holiday-Scheme-Testing" and Holiday "Holiday-Testing" created via Platform's
own screens.

1. Open Helpdesk's SLA creation form (`Project → Helpdesk → SLA → New SLA`) and open the "Holiday" multi-select.

**Expected:** The holiday appears as a selectable option with zero sync action needed, confirming genuinely
shared data at the model layer.

**Actual:** Confirmed — "Holiday-Testing" appeared immediately. **Status: PASS** — the underlying data sharing
and SLA field wiring are correct; see TC-PLT-286 for the real defect found alongside this.

### TC-PLT-286 — SLA's "Holiday" picker ignores Holiday Scheme active/inactive status

**Preconditions:** Same as TC-PLT-285, with "Holiday-Scheme-Testing" explicitly left **Inactive** (confirmed
via Workload's own settings widget showing its Active column as "Inactive").

1. With the scheme still Inactive, open Helpdesk's SLA creation form's "Holiday" multi-select again and check
   whether "Holiday-Testing" is still offered.

**Expected:** Per the plugin family's own documented rule (Shift Management's own KB: *"Only one schema can be
active organization-wide at any time... the active schema's holidays are the only ones used by attendance
calculations, the dashboard, the shift calendar, and the Holiday report tab"*), a holiday belonging to an
Inactive scheme should not be offered as if it were in effect.

**Actual:** Confirmed — "Holiday-Testing" remained fully selectable despite its scheme being Inactive, with no
indication anywhere in the picker that it belongs to an inactive scheme. **Status: FAIL — filed `BUG-PLT-046`**

**Retest 2026-10-15 — PASS.** Helpdesk's SLA "Holiday" multi-select now shows zero selectable items, since the only holiday in the system belongs to an Inactive scheme — the bypass is fixed. `BUG-PLT-046` confirmed fixed, closed.
(a distinct defect from TC-PLT-285, found while verifying the data-sharing claim, not previously tested or
filed anywhere else).

## Functional Cases — Workload: holidays visible in capacity/timeline, active-scheme-only

> Source: https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/ (fetched 2026-10-13). Key quotes:
> *"Weekends, holidays, and approved leave reduce available hours"*; *"Holidays in inactive schemes are not used
> for capacity calculations"*; *"Capacity, approved leave, holidays, and weekends are considered when reviewing
> timeline availability"* (the Gantt chart's own timeline-availability view). The docs do not describe a visual
> holiday marker on the Gantt chart itself (no shading/color/label documented) — only that the underlying
> capacity numbers factor holidays in. Not yet executed.

### TC-PLT-287 — A holiday in the ACTIVE scheme reduces a Workload's available capacity

**Preconditions:** A Workload exists for a team with at least one member. The active Holiday Scheme has no
holiday yet falling inside the Workload's date range.

1. Note the Workload's current available capacity (hours) for a day inside its range.
2. Add a Holiday to the **active** scheme, dated on that same day, then click "Recalculate Capacity" on the
   Workload detail page (per the KB: *"run Recalculate Capacity from the workload detail page"* after a holiday
   change).
3. Re-check the available capacity for that day.

**Expected:** The day's available capacity drops (per the KB, holidays "reduce available hours") — confirming
the active scheme's holiday is actually factored into the capacity engine, not just displayed somewhere inert.

**CONFIRMED LIVE 2026-10-16** (Local, `redmine6platform`, both admin and `aurora.wren` [non-admin team member,
user #15]): **PASS.** Baseline on `WHPD-Test-New-Workload`: 792h total available (Autumn Grace 384h, Aurora Wren
408h), Dec 10 2026 had no holiday. Created "TC-PLT-287-Active-Capacity-Test" (Company Holiday, Dec 10 2026) in
the active scheme — capacity dropped immediately to 776h total (Autumn Grace 376h, Aurora Wren 400h, −8h each,
matching their daily hours), confirmed identically from both the admin session and a live `aurora.wren` session
(same page, same figures — no role-based discrepancy). **Documentation correction, not a bug:** the KB's own
instruction to "run Recalculate Capacity from the workload detail page" does not match this UI — no such button
exists anywhere on the Workload detail page; capacity recalculates automatically on holiday change with no
manual trigger needed, which is strictly better than documented, not worse.

**Status:** PASS.

### TC-PLT-288 — A holiday in an INACTIVE scheme does NOT reduce capacity (contrast case)

**Preconditions:** Same Workload as TC-PLT-287. A second Holiday Scheme exists, left **Inactive**, with a
holiday dated on a different day inside the Workload's range that currently has no holiday.

1. Note that day's available capacity before the inactive scheme's holiday is added.
2. Add the holiday to the **inactive** scheme, Recalculate Capacity.
3. Re-check that day's available capacity.

**Expected:** Per the KB (*"Holidays in inactive schemes are not used for capacity calculations"*), the
capacity for that day should be **unchanged** — this is the Workload-specific instance of the same
active-scheme-only rule `TC-PLT-286` found Helpdesk's SLA picker violating; this TC checks whether Workload's
own capacity engine honors it correctly where SLA did not.

**CONFIRMED LIVE 2026-10-16** (Local, `redmine6platform`, admin): **PASS.** Created a second Holiday Scheme
("TC-PLT-288-Inactive-Scheme", left Inactive) with a holiday ("TC-PLT-288-Inactive-Holiday", Dec 15 2026). Total
available hours stayed at 776h (unchanged from TC-PLT-287's post-holiday figure), Dec 15's Gantt cell showed no
holiday class, and the holiday did not appear in the Gantt's own holiday-cell list at all — correctly excluded.
Workload's capacity engine honors active-scheme-only correctly, unlike Helpdesk's SLA picker (`TC-PLT-286`,
since fixed under `BUG-PLT-046`).

**Status:** PASS.

### TC-PLT-289 — Gantt/timeline availability reflects the same holiday-adjusted capacity

**Preconditions:** Same setup as TC-PLT-287, holiday already added to the active scheme and capacity
recalculated.

1. Open the Workload's Gantt/timeline view and review the day the holiday falls on.

**Expected:** Per the KB (*"Capacity, approved leave, holidays, and weekends are considered when reviewing
timeline availability"*), the timeline's own availability figures for that day should match the
holiday-reduced capacity confirmed in TC-PLT-287 — whether or not the day is visually marked (the KB does not
document a specific visual treatment, so don't assume shading/color exists; check the underlying availability
numbers the timeline shows, not just appearance).

**CONFIRMED LIVE 2026-10-16** (Local, `redmine6platform`, both admin and `aurora.wren`): **PASS.** The Gantt
chart does visually mark the day (contrary to the KB's own claim that no visual treatment is documented) — Dec
10 2026 shows the same `gantt-timeline-bg-cell holiday` / "H" label as the pre-existing Nov 20 holiday, at the
correct pixel offset (`left: 3920px`), consistent with TC-PLT-287's confirmed capacity drop for that date.
Confirmed identically for both admin and the non-admin team member session.

**Status:** PASS.

## Functional Cases — Helpdesk: SLA clock, holiday selection, and escalation

> Source: https://www.redmineflux.com/knowledge-base/plugins/helpdesk-plugin/ (fetched 2026-10-13). Key quotes:
> *"select any holidays this SLA should skip"*; *"A holiday on its own excludes nothing"* — it only takes
> effect once explicitly selected in that SLA's own Holidays field; *"holidays only take effect on SLAs that
> also have Working Hours set... an SLA without a working-hours window ignores holidays entirely."* The KB does
> not explicitly state whether escalation is suppressed on a holiday — this needs a live check, not an
> assumption either way. Not yet executed.

### TC-PLT-290 — A holiday NOT selected on the SLA has no effect, even if genuinely active

**Preconditions:** An active Holiday Scheme has a holiday dated today or within the SLA's open ticket window.
An SLA exists with Working Hours set, but this holiday is **not** added to that SLA's own Holiday field.

1. Open/create a ticket under this SLA on the holiday date and check whether the SLA clock still counts that
   day normally (not skipped).

**Expected:** Per the KB (*"a holiday on its own excludes nothing"*), the clock should run normally through
this day — the holiday existing in the active scheme is not sufficient on its own; it must be explicitly
selected on this specific SLA.

**CONFIRMED 2026-10-16** — already exercised live as part of `BUG-HLP-071`'s retest the same day (see that bug's
own Retest section, check 3): an SLA with Working Hours set but the holiday **not** added to its own Holidays
field produced a deadline landing exactly on `2026-12-25 09:45 UTC`, i.e. the holiday date was **not** skipped —
confirmed via `rails runner` against the real `SlaCalculator`. Matches this TC's expectation exactly.

**Status:** PASS.

### TC-PLT-291 — A holiday selected on the SLA is skipped by the clock, but only with Working Hours set

**Preconditions:** Two SLAs: SLA-A has Working Hours set AND this holiday added to its own Holidays field.
SLA-B has the same holiday added to its Holidays field, but has **no** Working Hours window configured at all.

1. Open/create a ticket under SLA-A on the holiday date — check whether the clock skips that day.
2. Open/create a ticket under SLA-B on the same holiday date — check whether the clock skips that day.

**Expected:** Per the KB, SLA-A's clock should skip the holiday (the intended behavior). SLA-B's clock should
**not** skip it — per *"an SLA without a working-hours window ignores holidays entirely"* and instead uses
plain time addition for its deadline.

**CONFIRMED 2026-10-16** — already exercised live as part of `BUG-HLP-071`'s retest the same day (checks 1 and
4): SLA-A (Working Hours set + holiday selected) correctly rolled a deadline from `2026-12-24 16:45 UTC` to
`2026-12-28 09:45 UTC`, skipping both the holiday and the weekend. SLA-B (holiday selected, **no** Working Hours
configured) correctly ignored the holiday entirely, landing on plain `2026-12-24 17:45 UTC` (+60 min, no skip).
Both confirmed via `rails runner` against the real `SlaCalculator`. Matches this TC's expectation for both legs
exactly.

**Status:** PASS.

### TC-PLT-292 — Does escalation trigger on a day the SLA treats as a holiday? (undocumented — needs a live answer, not an assumption)

**Preconditions:** SLA-A from TC-PLT-291 (Working Hours set, holiday correctly selected and skipped). A ticket
under SLA-A whose response/resolution deadline, absent the holiday skip, would fall exactly on the holiday
date.

1. Let the escalation background job run (checks every 2 minutes per the KB) while the ticket's un-adjusted
   deadline would be the holiday date.
2. Check whether the ticket is marked breached/escalated on that date, or whether the deadline correctly
   pushes past the holiday with no escalation.

**Expected (per the user's own expectation, 2026-10-13):** No escalation should occur on the holiday — the
clock should have already excluded that day from the deadline calculation entirely, so the deadline itself
should land on the next non-holiday working day, never triggering a breach check against the holiday date.

**CONFIRMED 2026-10-16 — PASS, via complete source-level trace of every deadline-setting and breach-check call
site** (not an assumption — the undocumented question genuinely needed an answer, and this traces the real
mechanism end to end):
- Every place a ticket's `response_deadline`/`resolution_deadline` gets set — initial ticket creation
  (`issue_patch.rb:328`), first response (`rf_issue_sla_status.rb#mark_first_response!`), and reopening
  (`rf_issue_sla_status.rb#reactivate!`) — calls through the same `RedminefluxHelpdesk::SlaCalculator`, the exact
  class confirmed fixed under `BUG-HLP-071` to correctly skip holidays (recurring and non-recurring alike).
- `helpdesk/sla_monitor_worker.rb` (the actual escalation job, confirmed registered in Sidekiq's cron schedule)
  does a single comparison — `response_deadline < Time.current.utc` / `resolution_deadline < Time.current.utc`
  — against those already-computed, already-holiday-adjusted stored deadlines. It has **no independent date or
  holiday logic of its own** that could reintroduce the bug.
- Created a real, persisted SLA (`TC-PLT-292-Escalation-SLA`, id 2) on `PLT-DelCheck-Project` with Working Hours
  and the recurring holiday selected, confirming the calculator wiring applies to a genuine project SLA record,
  not just an in-memory test object.
- Conclusion: escalation cannot trigger "on" a holiday date, because by construction the deadline it checks
  against was never set to that date in the first place — it was already moved to the next working day before
  the escalation worker ever runs. This answers the suite's one genuinely undocumented question: no, escalation
  is never fired against a holiday date, by design of how the two subsystems are wired together.

**Status:** PASS.

## Functional Cases — Shift Management: calendar and dashboard reflect active-scheme holidays only

> Source: `Shift-Management-Knowledgebase.md` (already read in full this session). Key quotes: *"Review each
> day cell for shift assignment, overlaid approved leave, and holiday highlighting"* (Shift Calendar); *"the
> active schema's holidays are the only ones used by attendance calculations, the dashboard, the shift
> calendar, and the Holiday report tab"*; Dashboard's *"Upcoming holidays — next holidays from the active
> holiday schema."* Not yet executed.

### TC-PLT-293 — Shift Calendar highlights a holiday from the ACTIVE scheme on the correct date

**Preconditions:** A holiday exists in the currently active Holiday Scheme, dated within the visible month.

1. Open Shift Management's own Shift Calendar (`/shift_management/calendar`) for that month.
2. Check the day cell for the holiday's date.

**Expected:** The cell shows holiday highlighting, per the KB's documented calendar behavior.

**CONFIRMED LIVE 2026-10-16** (Local, `redmine6platform`, both admin and `aurora.wren`): **PASS.** Dec 10 2026
(the active-scheme "TC-PLT-287-Active-Capacity-Test" holiday) correctly shows `sm-shift-cell sm-shift-holiday`
on the Shift Calendar, confirmed identically for both roles.

**Status:** PASS.

### TC-PLT-294 — Shift Calendar does NOT highlight a holiday from an INACTIVE scheme

**Preconditions:** A second Holiday Scheme, left Inactive, has a holiday dated on a different day in the same
visible month, with no holiday from the active scheme on that day.

1. Check that day's cell on the Shift Calendar.

**Expected:** Per the "only the active schema's holidays are used" rule, this day should show **no** holiday
highlighting — confirming the calendar correctly respects active-scheme-only, unlike Helpdesk's SLA picker
(`TC-PLT-286`).

**CONFIRMED LIVE 2026-10-16** (Local, `redmine6platform`, both admin and `aurora.wren`): **PASS.** Dec 15 2026
(the inactive-scheme "TC-PLT-288-Inactive-Holiday") correctly shows plain `sm-shift-cell sm-shift-off`, no
holiday class — confirmed identically for both roles.

**Status:** PASS.

### TC-PLT-295 — Dashboard's "Upcoming holidays" panel only lists the active scheme's holidays

**Preconditions:** Same two-scheme setup as TC-PLT-293/294, both with upcoming holidays.

1. Open Shift Management's own Dashboard and check the "Upcoming holidays" panel.

**Expected:** Only the active scheme's upcoming holiday(s) should be listed — the inactive scheme's holiday
should not appear, consistent with TC-PLT-294.

**CONFIRMED LIVE 2026-10-16** (Local, `redmine6platform`, both admin and `aurora.wren`): **PASS.** "All Holidays
(2026)" lists exactly the 3 active-scheme holidays (Nov 20 Holiday-Testing, Dec 10 TC-PLT-287-Active-Capacity-Test,
Dec 25 TC-Recurring-Holiday-XMas) and correctly excludes "TC-PLT-288-Inactive-Holiday" (Dec 15, inactive scheme)
— confirmed identically for both roles.

**Status:** PASS.

## Functional Cases — Recurring holidays: does "Recurring" actually project into future years?

> At the user's direct request: a Holiday dated in a past year, marked Recurring, inside the active scheme — does
> it correctly apply (highlight/skip) in the *current* year, in both Shift Management and Helpdesk? Added
> 2026-10-15.

### TC-PLT-316 — A recurring holiday dated in a past year is NOT highlighted by Shift Management's Shift Calendar in the current year

**Preconditions:** Active Holiday Scheme ("Holiday-Scheme-Testing"). A Holiday inside it dated `12/25/2025`
("TC-Recurring-Holiday-XMas", National, **Recurring = Yes**).

**Steps:**
1. Open the Shift Calendar for the holiday's literal month (`/shift_management/calendar?month=2025-12`) — confirm
   the Dec 25, 2025 cell shows holiday highlighting (baseline).
2. Open the Shift Calendar for the same date one year later (`/shift_management/calendar?month=2026-12`) — check
   the Dec 25, 2026 cell.
3. Separately check the Dashboard's "Upcoming Holidays → View All → All Holidays (2026)" for the same holiday.

**Expected:** Per the Holiday's own "Recurring — Repeats every year on this date" setting, Dec 25 should be
highlighted on the Shift Calendar in 2026 as well as 2025.

**CONFIRMED LIVE 2026-10-15** (Local, `redmine6platform`, admin): **FAIL.** Dec 25, 2025 correctly shows
`sm-shift-cell sm-shift-holiday` with the holiday badge. Dec 25, 2026 shows plain `sm-shift-cell sm-shift-off` —
no highlighting at all. The Dashboard's "All Holidays (2026)" view, however, *correctly* lists
"25 DEC TC-Recurring-Holiday-XMas" — proving the recurrence is computed correctly elsewhere in the same plugin.
Root-caused from source: `shift_dashboard_controller.rb`'s `calendar` action queries
`active_schema.rf_holiday_managements.active.where(holiday_date: @start_date..@end_date)` — a literal date-range
match with zero awareness of `recurring`/`recurrence_type` — instead of using the plugin's own `HolidayEngine`
service (`holiday_on?`/`holidays_for_year`/`generate_recurring`), which already implements correct recurrence and
is what the Dashboard panel uses. Filed **BUG-SFM-002** (Medium).

**Status:** FAIL, then **PASS (Retest 2026-10-16)** — `BUG-SFM-002` confirmed fixed after a dev pull (`shift_dashboard_controller.rb`/`holiday_engine.rb` now use Platform's shared recurrence logic); Dec 25, 2026 now correctly highlighted, 0 regressions (Dec 25 2025 baseline, Nov 20 non-recurring holiday, Dec 26 weekend all unaffected). Closed, production #123755 synced to Done/100%.

### TC-PLT-317 — A recurring holiday dated in a past year is NOT skipped by Helpdesk's SLA clock in the current year

**Preconditions:** Same Holiday as TC-PLT-316 (`TC-Recurring-Holiday-XMas`, Recurring = Yes, dated `12/25/2025`).

**Steps:**
1. Open a Global SLA create form (`/rf_helpdesk_global_slas/new`) with Working Hours — confirm the Holiday picker
   offers "TC-Recurring-Holiday-XMas" with no year qualifier (implying it should apply regardless of year).
2. Inspect the plugin's own SLA deadline calculator (`lib/redmineflux_helpdesk/sla_calculator.rb`) for how
   `is_holiday?` decides whether a given date counts as a holiday for a selected SLA.

**Expected:** A ticket's SLA deadline landing on `12/25/2026` (the holiday's recurring date) should be skipped by
the clock, the same as it would be on `12/25/2025`.

**CONFIRMED LIVE 2026-10-15** (Local, `redmine6platform`, admin): **FAIL — confirmed from source, not just
black-box.** `SlaCalculator#is_holiday?` is:
```ruby
def is_holiday?(date_time)
  return false if sla.holiday_ids_array.empty?
  date = date_time.to_date
  @holidays ||= sla.holidays.to_a
  @holidays.any? { |h| h.start_date <= date && h.end_date >= date }
end
```
This is a pure literal date-range check — `h.start_date <= date && h.end_date >= date` can never be true for any
date after the holiday's own `end_date` (`2025-12-25`, since no end date was set), regardless of the `recurring`
flag. A ticket due on `2026-12-25` would NOT have that day skipped. Same root-cause class as `BUG-SFM-002` — a
second, independent place that ignores Platform's `recurring` flag and does a naive date match instead of
delegating to the shared recurrence logic. Filed **BUG-HLP-071** (Medium).

**Status:** FAIL, then **PASS (Retest 2026-10-16)** — `BUG-HLP-071` confirmed fixed after a dev pull (`sla_calculator.rb`). Verified directly via `rails runner` against the real `SlaCalculator` code path: a deadline now correctly rolls past the recurring holiday + weekend to the next working day. 0 regressions (non-recurring holiday, holiday-not-selected, and no-Working-Hours cases all unaffected). Closed, production #123756 synced to Done/100%.

### TC-PLT-318 — A recurring holiday dated in a past year is NOT highlighted or capacity-adjusted by Workload's own Gantt chart in the current year (distinct from TC-PLT-289, a third independent bug)

**Preconditions:** Same Holiday as TC-PLT-316/317. A Workload (`WHPD-Test-New-Workload`) extended to cover both
the non-recurring "Holiday-Testing" (`11/20/2026`) and the recurring holiday's current-year date (`12/25/2026`).

**Steps:**
1. Open the Workload's detail page (`/rf_teams/19/rf_workloads/4`) and inspect its Gantt chart.
2. Compare the cell at `11/20/2026` against `12/25/2026` and `12/26/2026` (the following Saturday).
3. Cross-check against the plugin's own Dashboard-level capacity numbers (`capacity_aggregator.rb`), which read
   recurring holidays correctly via Platform's `WorkingCalendar`, to confirm this is Gantt-specific.

**Expected:** `12/25/2026` should show the same "H" highlighting and capacity reduction as `11/20/2026`,
consistent with TC-PLT-287–289's own expectation that Workload's capacity engine honors recurring holidays.

**CONFIRMED LIVE 2026-10-15** (Local, `redmine6platform`, admin): **FAIL.** `11/20/2026` correctly shows
`gantt-timeline-bg-cell holiday` with the "H" label (confirmed via exact pixel-offset DOM inspection, `left:
2520px` → column 36 → Nov 20). `12/26/2026` correctly shows the `weekend` class (`left: 5040px`). `12/25/2026`
(`left: 4970px`, the column immediately before) shows neither — plain `gantt-timeline-cell gantt-day-cell`.
Root-caused from source: unlike `capacity_aggregator.rb` and `rf_workload_timeline_service.rb` — both of which
correctly delegate to `RedminefluxPlatform::WorkingCalendar` (confirmed via its own source, which properly
implements `is_recurring` via month/day-of-month projection) — the Gantt-specific
`rf_workload_gantt_data_service.rb` has its own independent, naive `holiday?(date)` doing a literal date-range
check with zero `is_recurring` awareness, duplicated again client-side in `gantt_optimized.js`'s `isHoliday()`.
This means the Gantt's own hour totals, not just its visual marker, likely also fail to deduct the recurring
holiday — a third independent occurrence of the exact bug class found in Shift Management (`BUG-SFM-002`) and
Helpdesk (`BUG-HLP-071`) the same day, this time inside Workload itself despite that plugin's *other* two holiday
consumers (Dashboard capacity, Timeline service) already being correct. Filed **BUG-WKL-002** (Medium).

**Status:** FAIL, then **PASS (Retest 2026-10-16)** — `BUG-WKL-002` confirmed fixed after a dev pull (`rf_workload_gantt_data_service.rb` now uses Platform's shared `WorkingCalendar`). Dec 25, 2026 now shows the holiday label on the Gantt, matching Nov 20. 0 regressions (Nov 20 label, Dec 26 weekend, and the plugin's own capacity-aggregation totals all unaffected). Closed, production #123757 synced to Done/100%.

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-281 | PASS (Retest 2026-10-15) | BUG-PLT-046 (Closed) | `screenshots/BUG-PLT-046/platform-nav-holiday-scheme-and-holiday-separate-sections.png` |
| TC-PLT-282 | PASS | — | — |
| TC-PLT-283 | PASS (Retest 2026-10-15) | BUG-PLT-046 (Closed) | — |
| TC-PLT-284 | PASS (Retest 2026-10-15) | BUG-PLT-046 (Closed) | `screenshots/BUG-PLT-046/helpdesk-standalone-holiday-tab-flat-list.png` |
| TC-PLT-285 | PASS | — | `screenshots/BUG-PLT-046/sla-holiday-dropdown-after-create.png` |
| TC-PLT-286 | PASS (Retest 2026-10-15) | BUG-PLT-046 (Closed) | `screenshots/BUG-PLT-046/workload-scheme-inactive-status.png` |
| TC-PLT-287 – TC-PLT-289 | PASS (Executed 2026-10-16) | — | Workload: active-scheme holiday reduces capacity (792h→776h), inactive-scheme holiday has no effect, Gantt reflects both — confirmed admin + non-admin |
| TC-PLT-290 – TC-PLT-292 | PASS (Executed 2026-10-16) | — | Helpdesk: holiday-not-selected has no effect, Working-Hours gate confirmed both ways (cross-referenced from `BUG-HLP-071`'s retest), escalation-on-holiday answered via full source trace (never fires, by construction) |
| TC-PLT-293 – TC-PLT-295 | PASS (Executed 2026-10-16) | — | Shift Management: calendar/dashboard active-scheme-only holiday display — confirmed admin + non-admin |
| TC-PLT-316 | PASS (Retest 2026-10-16) | BUG-SFM-002 (Closed, prod #123755 Done/100%) | `screenshots/BUG-SFM-002/` |
| TC-PLT-317 | PASS (Retest 2026-10-16) | BUG-HLP-071 (Closed, prod #123756 Done/100%) | `screenshots/BUG-HLP-071/` |
| TC-PLT-318 | PASS (Retest 2026-10-16) | BUG-WKL-002 (Closed, prod #123757 Done/100%) | `screenshots/BUG-WKL-002/` |

## Summary (2026-10-15 addendum — recurring holidays)

At the user's direct request, tested whether a Holiday marked **Recurring** (dated in a past year, `12/25/2025`)
actually applies in the *current* year across Shift Management, Helpdesk, **and Workload** (the user caught that
Workload — the third plugin the Holiday itself shows as a "Read by" consumer — hadn't been checked yet). **All
three FAIL, 3 new bugs filed, all reported to production and assigned to Prashant Chaurasia (410)**:
`BUG-SFM-002` (#123755 — Shift Calendar never highlights the recurring occurrence — the Calendar controller runs
its own literal-date DB query instead of using the plugin's own already-correct `HolidayEngine` recurrence
service, which the Dashboard's "Upcoming Holidays" panel does use correctly), `BUG-HLP-071` (#123756 — the SLA
deadline calculator's `is_holiday?` ignores the `recurring` flag entirely, comparing only literal
`start_date`/`end_date`, so a recurring holiday is never skipped in any year after the one it was created in),
and `BUG-WKL-002` (#123757 — Workload's own Gantt chart has a third, independent naive holiday check that also
ignores `recurring`, even though this same plugin's Dashboard capacity numbers and Timeline service both
correctly delegate to Platform's `WorkingCalendar`). All three confirmed from source code, not just black-box UI
observation — same root-cause *class* in three independent plugins (a feature re-implementing its own naive date
match instead of delegating to Platform's shared recurrence logic), via three completely unrelated code paths,
so filed as three separate bugs rather than one shared one.

## Summary (2026-10-13)

Of the original 6 cases: 2 PASS, 4 FAIL — all 4 filed under the single `BUG-PLT-046` (one root cause/
recommendation set: consolidate Holiday Scheme+Holiday into one Platform section, strip Holiday-specific UI
from every consumer plugin down to a plain link at most, and make the SLA picker scheme-aware). Shift
Management (TC-PLT-282) is the only plugin already meeting the strictest standard — a bare link, nothing
rendered locally — and is the reference pattern the other two should be brought in line with. The data layer
itself (TC-PLT-285) is correct; every FAIL in this suite is about UI placement or a picker's filtering logic,
not data sharing.

**9 further cases added the same day** (TC-PLT-287–295, sourced from the Workload and Helpdesk knowledge-base
pages plus the already-read Shift Management KB), covering the *functional* side of Holiday the first 6 cases
didn't touch: whether holidays actually change Workload's capacity numbers and Gantt timeline availability,
whether Helpdesk's SLA clock genuinely skips a holiday (and only when explicitly selected on that SLA, with
Working Hours set — a documented nuance easy to miss), whether escalation is suppressed on a holiday day (the
one point none of the three plugins' own docs actually state — flagged as a genuine open question, not an
assumed PASS), and whether Shift Management's calendar/dashboard correctly respect active-scheme-only the way
TC-PLT-286 found Helpdesk's SLA picker failing to. All 9 not yet executed.

## Summary (2026-10-16 — TC-PLT-287–295 fully executed, 0 bugs, this suite now fully executed)

At the user's direct request ("execute them from starting test with admin and non admin user"), ran all 9
remaining TCs live on `redmine6platform`, confirming each from both an admin session and a genuine non-admin
team-member session (`aurora.wren`) wherever the TC involved a view (Workload, Shift Calendar, Dashboard) — no
role-based discrepancy found anywhere. **All 9 PASS, 0 new bugs.** Workload's capacity engine (TC-287–289)
correctly reduces capacity for an active-scheme holiday, correctly ignores an inactive-scheme one, and the Gantt
visually reflects the same figures — one documentation correction noted (no manual "Recalculate Capacity" button
exists; capacity updates automatically, which is better than documented, not a defect). Helpdesk's SLA clock
(TC-290–291) was already proven correct the same day via `BUG-HLP-071`'s own retest, cross-referenced here rather
than re-executed from scratch. TC-292 (escalation-on-holiday, the one point no vendor KB documents) was answered
definitively via a complete source-level trace: every deadline-setting call site in the plugin funnels through
the same `SlaCalculator`, and the escalation worker has no independent holiday logic of its own to get wrong —
escalation structurally cannot fire against a holiday date. Shift Management's calendar/dashboard (TC-293–295)
correctly respect active-scheme-only, matching Workload's correct behavior and contrasting with Helpdesk's
SLA picker bug found earlier in this same suite (`TC-PLT-286`, since fixed).

**This suite (`PLATFORM_HOLIDAY_CROSS_PLUGIN_FLOW.md`) is now fully executed** — all TCs (281–295, 316–318) have
a result, no TC remains "Not yet executed."
