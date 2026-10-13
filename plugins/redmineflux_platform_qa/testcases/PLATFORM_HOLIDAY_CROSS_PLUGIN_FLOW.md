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

### TC-PLT-284 — Helpdesk's own "Holiday" tab is a flat, non-nested, standalone list

1. Open Helpdesk → Helpdesk Settings → "Holiday" tab (`/rf_helpdesk/setting?tab=holidays`).

**Expected:** Same standard as TC-PLT-282/283 — ideally no screen at all, or at minimum holidays nested under
their owning Holiday Scheme, not a flat independent list.

**Actual:** Confirmed — a flat list of individual Holiday records with no Holiday Scheme grouping shown
anywhere on this tab. "New Holiday" does correctly defer to Platform's own `/redmineflux_platform/list/holidays/new`
(write path is fine), but the list itself duplicates Platform's own, with no scheme context at all. This is
the exact example given at the very start of this testing cycle — confirmed still unresolved. **Status: FAIL —
filed `BUG-PLT-046`.**

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

**Status:** Not yet executed.

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

**Status:** Not yet executed.

### TC-PLT-289 — Gantt/timeline availability reflects the same holiday-adjusted capacity

**Preconditions:** Same setup as TC-PLT-287, holiday already added to the active scheme and capacity
recalculated.

1. Open the Workload's Gantt/timeline view and review the day the holiday falls on.

**Expected:** Per the KB (*"Capacity, approved leave, holidays, and weekends are considered when reviewing
timeline availability"*), the timeline's own availability figures for that day should match the
holiday-reduced capacity confirmed in TC-PLT-287 — whether or not the day is visually marked (the KB does not
document a specific visual treatment, so don't assume shading/color exists; check the underlying availability
numbers the timeline shows, not just appearance).

**Status:** Not yet executed.

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

**Status:** Not yet executed.

### TC-PLT-291 — A holiday selected on the SLA is skipped by the clock, but only with Working Hours set

**Preconditions:** Two SLAs: SLA-A has Working Hours set AND this holiday added to its own Holidays field.
SLA-B has the same holiday added to its Holidays field, but has **no** Working Hours window configured at all.

1. Open/create a ticket under SLA-A on the holiday date — check whether the clock skips that day.
2. Open/create a ticket under SLA-B on the same holiday date — check whether the clock skips that day.

**Expected:** Per the KB, SLA-A's clock should skip the holiday (the intended behavior). SLA-B's clock should
**not** skip it — per *"an SLA without a working-hours window ignores holidays entirely"* and instead uses
plain time addition for its deadline.

**Status:** Not yet executed.

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

**Status:** Not yet executed. **This is the one case in this section the KB itself does not document — treat
the live result as the actual finding, not a confirmation of something already known.** If escalation fires
anyway on the holiday date, that is a new, distinct defect from everything else in this suite.

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

**Status:** Not yet executed.

### TC-PLT-294 — Shift Calendar does NOT highlight a holiday from an INACTIVE scheme

**Preconditions:** A second Holiday Scheme, left Inactive, has a holiday dated on a different day in the same
visible month, with no holiday from the active scheme on that day.

1. Check that day's cell on the Shift Calendar.

**Expected:** Per the "only the active schema's holidays are used" rule, this day should show **no** holiday
highlighting — confirming the calendar correctly respects active-scheme-only, unlike Helpdesk's SLA picker
(`TC-PLT-286`).

**Status:** Not yet executed.

### TC-PLT-295 — Dashboard's "Upcoming holidays" panel only lists the active scheme's holidays

**Preconditions:** Same two-scheme setup as TC-PLT-293/294, both with upcoming holidays.

1. Open Shift Management's own Dashboard and check the "Upcoming holidays" panel.

**Expected:** Only the active scheme's upcoming holiday(s) should be listed — the inactive scheme's holiday
should not appear, consistent with TC-PLT-294.

**Status:** Not yet executed.

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-281 | FAIL | BUG-PLT-046 | `screenshots/BUG-PLT-046/platform-nav-holiday-scheme-and-holiday-separate-sections.png` |
| TC-PLT-282 | PASS | — | — |
| TC-PLT-283 | FAIL | BUG-PLT-046 | — |
| TC-PLT-284 | FAIL | BUG-PLT-046 | `screenshots/BUG-PLT-046/helpdesk-standalone-holiday-tab-flat-list.png` |
| TC-PLT-285 | PASS | — | `screenshots/BUG-PLT-046/sla-holiday-dropdown-after-create.png` |
| TC-PLT-286 | FAIL | BUG-PLT-046 | `screenshots/BUG-PLT-046/workload-scheme-inactive-status.png` |
| TC-PLT-287 – TC-PLT-289 | Not yet executed | — | Workload: active-scheme holiday effect on capacity/timeline — written 2026-10-13, pending first live execution pass |
| TC-PLT-290 – TC-PLT-292 | Not yet executed | — | Helpdesk: SLA holiday-selection nuance and escalation-on-holiday check — written 2026-10-13, TC-PLT-292 is undocumented by the KB and needs a genuine live answer, not an assumption |
| TC-PLT-293 – TC-PLT-295 | Not yet executed | — | Shift Management: calendar/dashboard active-scheme-only holiday display — written 2026-10-13, pending first live execution pass |

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
