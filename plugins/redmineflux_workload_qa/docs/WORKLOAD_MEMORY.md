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

- (none recorded yet)

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
