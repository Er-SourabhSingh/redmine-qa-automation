# Plugin Memory — Redmineflux Workload Plugin

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- (none recorded yet — populate during the first execution session)

## Confirmed Working

- (none confirmed yet via this plugin's own `testcases/` suite — still fully unexecuted. Two bugs have been found and fixed via Platform's own cross-plugin suites instead, see Recurring Issues below.)

## Recurring Issues

### `BUG-WKL-002` (Gantt's own naive holiday detection, ignoring `recurring`) — CONFIRMED FIXED 2026-10-16

Found 2026-10-15 while testing Platform's `PLATFORM_HOLIDAY_CROSS_PLUGIN_FLOW.md` (TC-PLT-318), not this plugin's own suite. `rf_workload_gantt_data_service.rb` had its own independent, naive `holiday?(date)` implementation (literal `date`/`end_date` range check) that ignored a Holiday's `is_recurring` flag entirely — even though this same plugin's Dashboard capacity numbers (`capacity_aggregator.rb`) and Timeline service both correctly delegated to Platform's shared `RedminefluxPlatform::WorkingCalendar`. A recurring holiday's current-year occurrence (e.g. Dec 25, 2026 for a holiday created Dec 25, 2025) never showed the "H" label or reduced capacity on the Gantt specifically.

**Retested 2026-10-16** after `git pull` (branch `redmineflux_platform`) touched `rf_workload_gantt_data_service.rb` + a new `test/functional/gantt_recurring_holidays_test.rb`, plus the shared `redmineflux_platform` fix, and a container restart. The Gantt now correctly shows the holiday label on Dec 25, 2026, matching the existing non-recurring holiday on Nov 20. Regression confirmed clean: Nov 20's label, Dec 26's weekend class, and the Workload's own top-level "Available Hours"/per-member capacity totals (792h/384h/408h) were all unchanged — expected, since those were already correctly computed via `capacity_aggregator.rb`, never part of this bug. Closed, production #123757 synced to Done/100%.

**Lesson: a plugin can have one correct, shared recurrence-aware calculation service (`WorkingCalendar`) and still have a second, completely independent screen that silently reinvents the same logic badly** — don't assume a fix or a correct result in one part of a plugin (Dashboard capacity) means an adjacent part (Gantt) reads from the same code path. Worth spot-checking every *consumer* of a shared data type, not just the data type's own service.

### `BUG-WKL-003` — the SAME file (`rf_workload_gantt_data_service.rb`) has a second, independent bug: Pending leave treated as Approved (2026-10-16)

Found the same day as the `BUG-WKL-002` retest closed, while the user asked for a full Leave-module pass on
Platform including "test leave is visible and calculation is proper in workload, shift management" after a
Policy Band is assigned. `fetch_user_leaves` (same file as `BUG-WKL-002`'s fix, line 88) queries
`RedminefluxPlatform::Leave.where(user_id: user_id, status: ['pending', 'approved'])` — explicitly including
`'pending'`. This same leave list feeds `working_day?`/`count_working_days`, which drives both the Gantt's "L"
marker and the member's actual available-capacity count for that workload. Confirmed via direct `rails runner`
call: counting working days with a Pending leave included gives 10; counting with only the Approved leave (the
correct scope) gives 11 — a full day (8h) wrongly deducted before any approver has acted.

**Second confirmed instance of the exact same architectural pattern as `BUG-WKL-002`**: this file keeps
re-implementing logic a separate, correct service already gets right — there it was holiday recurrence vs.
`WorkingCalendar`; here it's leave-approval-status scoping vs. `Workload::Dashboard::CapacityAggregator` (which
correctly scopes `status: 'approved'` only, confirmed in source at the same investigation). Cross-checked
against Shift Management's own Shift Calendar with the identical two leave records (one Pending, one Approved)
— it correctly shows "On Leave" only for the Approved date, proving the intended behavior is already
implemented correctly elsewhere in this same codebase.

**Lesson, sharpened from `BUG-WKL-002`'s own lesson above: a single file that reimplements shared logic once is
worth treating as a standing risk for reimplementing it AGAIN, elsewhere in the same file, for a different
shared concept.** Don't consider a service "cleaned up" just because one specific defect in it (holidays) was
fixed — check every other query/filter it independently re-derives (here, leave status) against whichever
service is supposed to be the canonical source for that same filter.

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
