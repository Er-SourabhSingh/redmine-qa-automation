# Test Case Report — Redmineflux Shift Management — 2026-09-25

> One consolidated report per testing cycle. Do not split this into separate defect/regression/pass-fail reports — see CLAUDE.md §7.

## Testing Performed

- [ ] Functional testing
- [ ] Permission testing
- [ ] Workflow testing
- [ ] Negative testing
- [ ] UI validation
- [x] Regression testing (bug retest + affected-feature regression)

This cycle was a bug retest only. The plugin has no test case suites yet (see handoff).

## Test Case Execution Summary

| Total TCs | Pass | Fail | Blocked | Skipped |
|-----------|------|------|---------|---------|
| 0 (no suites written) | – | – | – | – |

Retest / regression checks run: 4 — 4 PASS, 0 FAIL.

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-SFM-001 | Global JS double-binds confirm dialogs site-wide, requiring two clicks to accept/dismiss | High | Closed — retest PASS; prod #121065 Done / 100% | #121065 |

No new bugs found this cycle.

## Fix Verification / Retesting

**BUG-SFM-001 — PASS (FIXED).** Fix: plugin commit `d29e480` (rsm-093) removes the unscoped
`document.querySelectorAll('[data-confirm]')` click handler from `shift_management.js`.

- The server sends the new asset `shift_management-c2dd912b.js` (was `-02242f4f.js`); its content no longer has the handler.
- Original reproduction (Administration → Custom fields → Delete on a throwaway field): one dismiss cancels, one accept deletes ("Successful deletion.").

![Retest PASS](../screenshots/BUG-SFM-001/retest-2026-09-25-pass.png)

## Regression Testing Results

| Area | Check | Result |
|------|-------|--------|
| Core — Custom Fields Delete | Dismiss once → dialog closes, field kept | PASS |
| Core — Custom Fields Delete | Accept once → deleted | PASS |
| Plugin — Attendance detail Delete (`data-confirm="Delete this record?"`) | Dialog still shown; dismiss once → record kept | PASS |
| Plugin — Attendance detail Delete | Accept once → deleted | PASS |

The plugin's other delete actions (departments, teams, holidays, holiday schemas) use in-page modals, not
`data-confirm`, so the fix doesn't touch them. Both throwaway records (custom field #92, attendance #1) were deleted during the test.

## Final Overall Testing Status

- Redmine Version: 7.0.0
- Environment: localhost:3010 (redmine-docker-700-redmine-1)
- Test Date: 2026-09-25
- Status: `In Progress` — BUG-SFM-001 is verified fixed, but no feature test cycle has been run for this plugin yet.
