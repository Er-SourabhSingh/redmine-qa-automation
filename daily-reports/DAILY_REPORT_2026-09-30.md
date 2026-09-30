# Daily Testing Report — 2026-09-30

> Daily snapshot across every plugin worked on today. Distinct from the per-cycle
> `<PREFIX>-tc-report-<date>.md` (CLAUDE.md §7), which wraps up one plugin's full cycle.

## Redmineflux Testcase Management

**Testing performed today:** Functional, Permission, Regression (bug retest), Bug reporting to production.

**Test cases executed:**

Bug retest / production-status follow-up (`TC-TCM-101`):

| TC ID | Result |
|-------|--------|
| TC-TCM-101 | PASS (BUG-TCM-006 retest — closed FIXED) |

`TESTCASE_MANAGEMENT_PERMISSIONS.md` (final-cycle regression):

| TC ID | Result | TC ID | Result | TC ID | Result |
|-------|--------|-------|--------|-------|--------|
| TC-TCM-046 | PASS | TC-TCM-057 | PASS | TC-TCM-070 | FAIL (BUG-TCM-007) |
| TC-TCM-047 | PASS | TC-TCM-058 | PASS | TC-TCM-071 | FAIL (BUG-TCM-007) |
| TC-TCM-048 | FAIL (BUG-TCM-007) | TC-TCM-059 | PASS | TC-TCM-072 | FAIL (BUG-TCM-007) |
| TC-TCM-049 | FAIL (BUG-TCM-007) | TC-TCM-060 | PASS | TC-TCM-073 | BLOCKED (deferred — auto-mode "Irreversible Deletion" guard) |
| TC-TCM-050 | FAIL (BUG-TCM-007) | TC-TCM-061 | PASS | TC-TCM-074 | FAIL (BUG-TCM-009) |
| TC-TCM-052 | PASS | TC-TCM-062 | PASS | TC-TCM-075 | PASS |
| TC-TCM-053 | PASS | TC-TCM-063 | FAIL (BUG-TCM-007) | TC-TCM-076 | PASS |
| TC-TCM-054 | PASS | TC-TCM-064 | FAIL (BUG-TCM-007) | TC-TCM-077 | FAIL (folded into BUG-TCM-009) |
| TC-TCM-055 | PASS | TC-TCM-065 | FAIL (BUG-TCM-007) | | |
| TC-TCM-056 | PASS | TC-TCM-066 | PASS | | |

`TESTCASE_MANAGEMENT_CONFIGURATION.md` (final-cycle regression, first execution ever for this suite):

| TC ID | Result | TC ID | Result |
|-------|--------|-------|--------|
| TC-TCM-001 | FAIL (BUG-TCM-010) | TC-TCM-010 | PASS |
| TC-TCM-002 | PASS | TC-TCM-011 | SKIPPED — no evidence recorded this session, needs follow-up |
| TC-TCM-003 | PASS | TC-TCM-012 | SKIPPED — no evidence recorded this session, needs follow-up |
| TC-TCM-004 | PASS (corrected premise) | TC-TCM-013 | FAIL (BUG-TCM-012, BUG-TCM-013) |
| TC-TCM-005 | FAIL (BUG-TCM-011) | TC-TCM-014 | SKIPPED — deferred (requires a real scheduled-interval wait) |
| TC-TCM-006 | PASS | TC-TCM-015 | PASS |
| TC-TCM-007 | PASS (corrected premise) | TC-TCM-016 | PASS |
| TC-TCM-008 | PASS | TC-TCM-017 | SKIPPED — deferred (stopping Redis risks other sessions on shared instance) |
| TC-TCM-009 | PASS | | |

**Summary:** 46 executed/addressed — 27 Pass / 14 Fail / 1 Blocked / 4 Skipped

**Bugs reported today:**

| Bug ID | Title | Severity | Status |
|--------|-------|----------|--------|
| BUG-TCM-007 | Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission check at all | High | New — reported to production as #121645 |
| BUG-TCM-008 | Run detail page crashes with an unhandled 500 error when the run's environment-assignee user has been deleted | Medium | New — reported to production as #121698 |
| BUG-TCM-009 | Almost the entire plugin has no project-membership check at all | High | New — reported to production as #121699 |
| BUG-TCM-010 | With the Testcase Tracker setting cleared, "New Test Case" silently creates a Bug instead of failing | High | New — reported to production as #121700 |
| BUG-TCM-011 | Report Defect cannot be completed when Defect/Testcase Tracker is anything other than "Bug" | High | New — reported to production as #121701 |
| BUG-TCM-012 | Default "Test Case Result Added" email shows the run's name instead of the test case's subject | Low | New — reported to production as #121702 |
| BUG-TCM-013 | Adding a single test result sends the "Test Case Result Added" notification email twice | Medium | New — reported to production as #121703 |
| BUG-TCM-003 | Bulk update result fails for every browser user | High | Retested-fixed — closed (production already Done/100% via another tester's 2026-09-28 retest) |
| BUG-TCM-004 | Bulk Update Result modal shows raw HTML markup | Low | Retested-fixed — closed (production already Done/100%) |
| BUG-TCM-006 | Failed PDF generation still sends an email promising an attachment that isn't there | Medium | Retested-fixed — closed, production #120658 synced to Done/100% |

All 6 bugs found this session (BUG-TCM-008 through BUG-TCM-013) plus BUG-TCM-007 (found earlier the same day) were linked to a
new production Test Case **#121697** ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and
Run **#592**, and assigned to **Sheetal Sharma**.

## Grand Total

- Plugins touched: 1 (redmineflux_testcase_management)
- Test cases executed: 46 (27 Pass / 14 Fail / 1 Blocked / 4 Skipped)
- Bugs reported: 10 total activity — 7 new (5 High, 2 Medium, 0 wait see below) + 3 closed via retest
  - By severity (new bugs only): High × 4 (007, 009, 010, 011), Medium × 2 (008, 013), Low × 1 (012)
  - Closed via retest: High × 1 (003), Medium × 1 (006), Low × 1 (004)
