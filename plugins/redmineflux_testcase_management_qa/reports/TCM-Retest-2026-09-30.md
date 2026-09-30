# Testcase Management — Retest Testing Report — 2026-09-30

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-TCM-101 | PASS |

**Summary:** 1 executed — 1 Pass / 0 Fail / 0 Blocked / 0 Skipped

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-TCM-006 | Failed PDF generation still sends an email whose body promises an attachment | High | Closed — retest PASS | #120658 → Done, 100% |
| BUG-TCM-003 | Report emailed as PDF arrives with no attachment at all | High | Closed — verified via another tester's prior production retest (2026-09-28) | #120544 → Done, 100% |
| BUG-TCM-004 | (companion PDF-attachment finding) | High | Closed — same basis as BUG-TCM-003 | #120546 → Done, 100% |

## Fix Verification / Retesting

- Full environment setup completed first: Node/npm/Chromium installed (Installation step 6 had never been done on `localhost:3010`), SMTP wired to the local Docker mail server, `Setting.host_name` corrected, `admin`/`luna.blossom` pointed at real checkable mailboxes.
- Established a genuine PDF baseline (1,001,291 B, 32/32 streams inflate) before testing the fix.
- Reproduced two independent PDF-failure causes — missing `--no-sandbox` (found incidentally) and a bad `PUPPETEER_EXECUTABLE_PATH` (the bug's own documented repro). Both correctly fell back to an HTML attachment with a visible red warning banner, matching the fix's acceptance criterion exactly.
- Spot-checked a second report type (Defect Summary) to confirm the HTML-format path is not regressed.
- **Verdict: FIXED.** BUG-TCM-006 moved to `bugs/closed/`; production #120658 synced to Done/100% with a closing note citing both failure causes and the acceptance criterion met.
- BUG-TCM-003/BUG-TCM-004 closed locally on the strength of another tester's (Nidhi Singh) already-Done production retest of #120544/#120546 on 2026-09-28 — no new production write needed, already Done.

## Notes / Findings

- Redmine Version: not recorded this session
- Environment: `localhost:3010`
- Test Date: 2026-09-30
- `bugs/open/` reached zero after this retest, before the same day's regression pass (below) reopened it with new findings.
