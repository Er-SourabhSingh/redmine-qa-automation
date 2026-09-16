# Bug Index — Redmineflux Testcase Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-TCM-003 | Bulk update result fails for every browser user because the bulk endpoint rejects the logged-in session and treats the request as an unauthenticated API call | Open | High | 7.0.0 | #120544 | bugs/open/BUG-TCM-003.md |
| BUG-TCM-004 | Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line | Open | Low | 7.0.0 | #120546 | bugs/open/BUG-TCM-004.md |
| BUG-TCM-006 | Failed PDF generation still sends an email whose body promises an attachment that is not there, with nothing surfaced in the UI | Open | Medium | 6.1.3 | #120658 | bugs/open/BUG-TCM-006.md |
| BUG-TCM-005 | Report emailed as PDF arrives with no attachment at all, while the body still says "Please find the attached Testcase Report" | Closed | High | 6.1.3 | #120588 | bugs/closed/BUG-TCM-005.md |
| BUG-TCM-001 | CSV import silently drops the value of a step column whose header has leading/trailing whitespace | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-001.md |
| BUG-TCM-002 | CSV import silently discards the second occurrence of a duplicated column header with no warning | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-002.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
- BUG-TCM-005 was found on a different instance than the others: Docker `localhost:3012` (`redmine-docker-6-redmine-1`, Redmine 6.1.3), not `localhost:3010`. Reported to production as **#120588** on 2026-09-14, assigned to Sheetal Sharma. Its attached `BUG-TCM-005.pdf` uploaded **corrupt** (2 bytes altered in transit; 1 of 4 content streams will not decompress) and needs replacing — see the handoff.
- **BUG-TCM-005 closed 2026-09-15** on its original scope — *PDF generation and attachment failure*. Root cause was
  an incomplete installation (KB Installation step 6 never run), not a code defect; after installing Node.js +
  Puppeteer + Chromium the PDF email delivers a valid 53,446-byte attachment (retest Test 1, 2026-09-14,
  TC-TCM-523 PASS). Production **#120588** must be synced to Done / 100% (`CLAUDE.md` §5) — pending write approval.
- **BUG-TCM-006 was split out of BUG-TCM-005** on 2026-09-15, not found independently. It carries the residual
  finding from that retest's Test 2: when PDF generation *fails*, the email is still sent with a body promising an
  attachment. Different assertion (TC-TCM-524 vs TC-TCM-523), different cause (code vs environment), and only
  reachable by deliberately breaking PDF generation. Reported to production as **#120658** on 2026-09-15,
  assigned to Sheetal Sharma; its description links back to #120588 and states the split explicitly. Its evidence
  JPEG (attachment id 93611) was checksum-verified byte-exact after upload.
- **BUG-TCM-003 and BUG-TCM-004 both retested PASS on 2026-09-15** after the developer switched branch on `localhost:3010`. Kept in `bugs/open/` deliberately: `SENIOR_QA_STANDARDS.md` §26 gates closure on the affected-suite regression, and `TESTCASE_MANAGEMENT_TEST_RUNS.md` (TC-TCM-401–440) has never been executed. Production #120544 / #120546 unchanged until that runs.
- BUG-TCM-003 (#120544) and BUG-TCM-004 (#120546) were reported to production `ztflux` on 2026-09-11, both assigned to Sheetal Sharma. Reported without Test Run / Environment / Test Case ID at the user's instruction. Their four Defect * custom fields carry project defaults, not the mapped values - see the handoff for what still needs correcting.
- BUG-TCM-001 and BUG-TCM-002 were closed on 2026-09-11 after a retest PASS on their original fixtures plus a full
  CSV Import suite regression (16/16 TCs PASS). Neither had a Production Redmine Issue ID, so there was no
  production status to sync on close (`CLAUDE.md` §5).
