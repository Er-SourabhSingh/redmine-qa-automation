# Bug Report Template

- Bug ID: BUG-CRX-046
- Production Redmine Issue ID: #121831
- Title: Timesheet `withdraw` action has no Audit Log entry at all — Submit/Approve are logged, Withdraw is not
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain) / redmineflux_timesheet
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `crux.developer` (Crux Developer)
- Date: 2026-10-01

## Steps to reproduce

1. As a team member, submit a real timesheet (not yet approved).
2. Withdraw that same submission (via chat or native UI).
3. Check `/audit_logs` for a corresponding WITHDRAW entry.

## Expected result

Per the Audit Logs page's own stated purpose ("Track every critical timesheet action"), a withdraw — which reverts a submission out of the approval queue, a materially significant state change — should produce a logged entry, consistent with how Submit and Approve actions are already logged.

## Actual result

"Time Agent, please withdraw my timesheet for the week of September 28 to October 4." → real `Timesheet Withdraw` proposal (Submission: 4) → confirmed → *"✓ Timesheet withdrawn. You can edit and submit again."* — the withdrawal itself is genuine and correctly took effect (verified: native "Submit Timesheet" button re-enabled, `/admin_dashboard` Pending Approvals count dropped from 2 to 1).

However, `/audit_logs` shows **no entry at all** for this withdrawal. The most recent entry for Submission #4 remains its original "Submit" action (`Previous status: draft, New status: submitted`) — no subsequent entry reflects the status actually changing back out of "submitted". The Audit Logs page's own "Approvals" category count (Submit/Approve/Reject) totals exactly the number of Submit+Approve actions performed, with no separate Withdraw tally and no Withdraw row anywhere in the log — the log appears to have no coverage for this action type at all, not merely a display/filtering gap.

This is an audit-trail completeness gap, not a functional or security defect — the withdrawal mechanism itself works correctly.

## Evidence

### Screenshot

Not captured — confirmed via live `/audit_logs` listing (9 total entries at the time, all Submit or Settings Update actions, none for the withdraw performed moments earlier) and the native UI state changes confirming the withdrawal's real effect.

### Console / log

```
C (crux.developer): Time Agent, please withdraw my timesheet for the week of
September 28 to October 4.
-> asking the Time Agent...
I'll do this (Timesheet Withdraw) -- confirm?
[Write] Submission: 4
[Confirm clicked]
"✓ Timesheet withdrawn. You can edit and submit again."

[Verification, native UI]
/timesheets/weekly (week of Sep 28) -> "Submit Timesheet" button re-enabled (was
disabled while submitted) -- withdrawal genuinely took effect.

[Verification, /audit_logs, immediately after]
Most recent entries (newest first):
  1 Oct 2026 12:02:33 | Submit | TimesheetSubmission #4 | Crux Developer | draft -> submitted
  (no entry for the withdraw that happened ~1 minute after this timestamp)
Audit Log stats: Total Entries 9, Approvals 3 (= exactly 3 Submit actions logged
this session, no Withdraw category/count exists)
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-10-01 as **#121831** (Priority Low, Defect Type Functional, Defect Severity Low-severity, Defect priority Low, Category Crux Plugin, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 "Crux QA Run 1" / Suite #374, Environment "Window 11 + Chrome" — testcase marked Failed.
