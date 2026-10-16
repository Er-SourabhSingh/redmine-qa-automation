# Bug Index — Redmineflux Workload Plugin

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-WKL-001 | Existing workloads' capacity numbers go silently stale when Platform's shared "Working Hours Per Day" setting changes — no automatic recalculation and no UI button to trigger one manually — CONFIRMED FIXED 2026-10-15 (Setting.after_commit hook now recalculates all workloads automatically) | Closed | Medium | 6 | #123498 | bugs/closed/BUG-WKL-001.md |
| BUG-WKL-002 | Workload Gantt chart's own data service (`rf_workload_gantt_data_service.rb` + client-side `gantt_optimized.js`) re-implements holiday detection without recurrence support — a recurring holiday never highlights or reduces capacity past its creation year, unlike the Dashboard's correct `capacity_aggregator.rb`/`WorkingCalendar`-based figures. Same root-cause class as `BUG-SFM-002`/`BUG-HLP-071` filed the same day. CONFIRMED FIXED 2026-10-16 (dev fix pulled, `rf_workload_gantt_data_service.rb` now uses Platform's shared `WorkingCalendar`) | Closed | Medium | 6 | #123757 | bugs/closed/BUG-WKL-002.md |
| BUG-WKL-003 | `rf_workload_gantt_data_service.rb` queries Leave with `status: ['pending', 'approved']` instead of `'approved'`-only (unlike the correctly-scoped `CapacityAggregator`) — a still-Pending, unapproved leave already reduces a member's available capacity and blocks scheduling, confirmed via direct service call (10 vs 11 working days). Fixed 2026-10-16 (commit `1fcc816`, both Gantt and Capacity services now use a shared `Leave.taking_time_off` = approved-only scope) — CONFIRMED FIXED | Closed | Medium | 6 | #123791 | bugs/closed/BUG-WKL-003.md |
| BUG-WKL-004 | `POST /api/workload/leaves` never checks `manage_rf_platform_leaves` — a user with zero leave-filing permission can still create their own leave via this REST API endpoint, bypassing the just-fixed web-form gate (`BUG-PLT-054`). Confirmed live: `marigold.rayne` (zero permission) successfully created Leave #14 via direct API call. Same root cause as `BUG-SFM-003` (Shift Management's equivalent endpoint), found the same day | Open | Medium | 6 | — | bugs/open/BUG-WKL-004.md |

## Notes
- Bug ID format: `BUG-WKL-NNN`
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
