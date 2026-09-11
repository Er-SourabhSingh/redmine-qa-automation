# Bug Index — Redmineflux Testcase Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-TCM-003 | Bulk update result fails for every browser user because the bulk endpoint rejects the logged-in session and treats the request as an unauthenticated API call | Open | High | 7.0.0 | #120544 | bugs/open/BUG-TCM-003.md |
| BUG-TCM-004 | Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line | Open | Low | 7.0.0 | #120546 | bugs/open/BUG-TCM-004.md |
| BUG-TCM-001 | CSV import silently drops the value of a step column whose header has leading/trailing whitespace | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-001.md |
| BUG-TCM-002 | CSV import silently discards the second occurrence of a duplicated column header with no warning | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-002.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
- BUG-TCM-003 (#120544) and BUG-TCM-004 (#120546) were reported to production `ztflux` on 2026-09-11, both assigned to Sheetal Sharma. Reported without Test Run / Environment / Test Case ID at the user's instruction. Their four Defect * custom fields carry project defaults, not the mapped values - see the handoff for what still needs correcting.
- BUG-TCM-001 and BUG-TCM-002 were closed on 2026-09-11 after a retest PASS on their original fixtures plus a full
  CSV Import suite regression (16/16 TCs PASS). Neither had a Production Redmine Issue ID, so there was no
  production status to sync on close (`CLAUDE.md` §5).
