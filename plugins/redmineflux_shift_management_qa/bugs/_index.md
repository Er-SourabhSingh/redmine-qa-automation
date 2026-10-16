# Bug Index — Redmineflux Shift Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-SFM-001 | Global JS double-binds confirm dialogs site-wide, requiring two clicks to accept/dismiss | Closed — retest PASS 2026-09-25; prod #121065 Done / 100% | High | 7.0.0 | #121065 | bugs/closed/BUG-SFM-001.md |
| BUG-SFM-002 | Shift Calendar never highlights a recurring Holiday's occurrence in any year but the one it was originally created in — Dashboard's own "Upcoming Holidays" correctly computes the recurrence, Calendar controller bypasses it with a raw literal-date query — CONFIRMED FIXED 2026-10-16 (dev fix pulled, `shift_dashboard_controller.rb`/`holiday_engine.rb` now use Platform's shared recurrence logic) | Closed | Medium | 6 | #123755 | bugs/closed/BUG-SFM-002.md |
| BUG-SFM-003 | `POST /shift_management/api/v1/leave` never checks `manage_rf_platform_leaves` — a user with zero leave-filing permission can still create their own leave via this REST API endpoint, bypassing the just-fixed web-form gate (`BUG-PLT-054`). Confirmed live: `marigold.rayne` (zero permission) successfully created Leave #15 via direct API call. Same root cause as `BUG-WKL-004` (Workload's equivalent endpoint), found the same day | Open | Medium | 6 | — | bugs/open/BUG-SFM-003.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
