# Bug Index — Redmineflux Shift Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-SFM-001 | Global JS double-binds confirm dialogs site-wide, requiring two clicks to accept/dismiss | Closed — retest PASS 2026-09-25; prod #121065 Done / 100% | High | 7.0.0 | #121065 | bugs/closed/BUG-SFM-001.md |
| BUG-SFM-002 | Shift Calendar never highlights a recurring Holiday's occurrence in any year but the one it was originally created in — Dashboard's own "Upcoming Holidays" correctly computes the recurrence, Calendar controller bypasses it with a raw literal-date query — CONFIRMED FIXED 2026-10-16 (dev fix pulled, `shift_dashboard_controller.rb`/`holiday_engine.rb` now use Platform's shared recurrence logic) | Closed | Medium | 6 | #123755 | bugs/closed/BUG-SFM-002.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
