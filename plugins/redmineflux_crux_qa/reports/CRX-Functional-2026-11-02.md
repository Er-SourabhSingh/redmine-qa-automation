# Redmineflux Crux (Time Agent / Timesheet domain) — Functional Testing Report — 2026-11-02

> One report per testing type, per day performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

Source: `testcases/CRUX_AGENT_TIMESHEET.md`, executed live against the Ask Crux chat UI (Time Agent persona)
on Redmine 6.0-bookworm, `http://localhost:3015`. Every result below is sourced directly from a live chat
session with native-UI/DB cross-verification before being recorded — not a manually-recalled tally.

| TC ID | Result |
|-------|--------|
| TC-CRX-439 | PASS |
| TC-CRX-440 | PASS |
| TC-CRX-441 | FAIL (step 1 only) — BUG-CRX-131 |
| TC-CRX-442 | PASS |
| TC-CRX-443 | PASS |
| TC-CRX-444 | PASS |
| TC-CRX-445 | PASS (mostly) |
| TC-CRX-446 | PASS |
| TC-CRX-447 | PASS (first-ever execution on any stack) |
| TC-CRX-448 | PARTIAL PASS (non-admin case only) |
| TC-CRX-449 | FAIL — BUG-CRX-130 |
| TC-CRX-450 | PASS |
| TC-CRX-451 | PASS |
| TC-CRX-452 | PASS |
| TC-CRX-453 | PASS |
| TC-CRX-454 | PASS (with a noted gap, not filed as a bug) |
| TC-CRX-456 | PASS (core behavior) |
| TC-CRX-458 | PASS |
| TC-CRX-461 | PASS (via a stronger guarantee than originally envisioned) |
| TC-CRX-463 | PASS |
| TC-CRX-466 | MIXED — underlying data gap (BUG-CRX-046) fixed, new retrieval defect BUG-CRX-131 found |
| TC-CRX-467 | PASS (synthesized from cumulative session evidence) |
| TC-CRX-468 | FAIL (step 2 only) — reproduces BUG-CRX-113 |
| TC-CRX-472 | PASS |

**Summary:** Total executed today — 24. Pass — 18 (plus 2 mostly/partial-pass: TC-445, TC-448). Fail — 3
(TC-441, TC-449, TC-468). Mixed — 1 (TC-466). Blocked — 0 (TC-473 was assessed in an earlier session, not
today). This completes the full 35-case `CRUX_AGENT_TIMESHEET.md` suite: all 35 cases now carry a recorded
result (34 judged + TC-CRX-473 blocked by a genuine fixture limitation, not a plugin defect).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-CRX-130 | Admin's unconditional approve-bypass fails on a resubmitted-after-rejection submission — two different false refusals, contradicting native Admin Dashboard data | High | Open | — (not yet reported) |
| BUG-CRX-131 | Asking the Time Agent for a specific timesheet submission's audit log fails 2/2 with two different wrong answers, while the native Audit Log has the real, correct entries both times | High | Open | — (not yet reported) |

**Also reproduced today (not a new bug — added as a follow-up to an existing one):** BUG-CRX-113 (Auto-mode
routing failure + false capability denial) reproduced on the Timesheet domain via TC-CRX-468 step 2 —
documented as a follow-up section in `bugs/open/BUG-CRX-113.md`, not filed separately, since the root cause
(Auto-mode's routing failing over to a capability-blind generic fallback) is identical, not domain-specific.

**Also found and documented (gap only, not a bug):** TC-CRX-454's bulk-withdraw plan did not proactively
exclude a rejection-history-locked submission before proposing it — data integrity held (the backend's own
validation blocked the write and the failure was explicitly surfaced, not silent), so this is recorded as a
quality observation in the TC itself rather than filed as a separate bug.

## Notes / Findings

- Redmine Version: 6.0-bookworm (local Docker instance)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Test Date: 2026-11-02
- This session completed the `CRUX_AGENT_TIMESHEET.md` suite in full (35/35 cases now have a recorded
  result). Remaining open item: TC-CRX-473 needs a fixture fix (give the L2/final-level role, Sage Willow,
  genuine time-logging rights) before the last-level-escalates-to-admin flow can be executed.
- 2 new bugs this session (BUG-CRX-130, BUG-CRX-131), both High severity, both not yet reported to
  production — pending alongside BUG-CRX-128 and BUG-CRX-129 from the 2026-11-02 Approve/Reject/Withdraw
  pass earlier the same day.
