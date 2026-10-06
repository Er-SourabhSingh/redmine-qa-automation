# Test Scope — Redmineflux Testcase Management

## In Scope

- [ ] Functional testing
- [ ] Permission testing
- [ ] Workflow testing
- [ ] Negative testing
- [ ] UI validation
- [ ] Multi-language testing
- [x] Security testing (mandatory — see `SENIOR_QA_STANDARDS.md` §28) — `testcases/TESTCASE_MANAGEMENT_SECURITY.md`, TC-TCM-215–248
- [x] Performance testing (mandatory — see `SENIOR_QA_STANDARDS.md` §29) — `testcases/TESTCASE_MANAGEMENT_PERFORMANCE.md`, TC-TCM-249–268
- [ ] Code quality review (mandatory — see `SENIOR_QA_STANDARDS.md` §30) — folded into root-cause investigations per §30's own rule, not a dedicated suite

## Out of Scope

- **Rate limiting / brute-force protection** (Security, TC-TCM-243) — this plugin has no public share link and
  does not modify the login flow; any brute-force protection present is core Redmine's, not a plugin feature to
  test. See the TC's own scope note.
- **Auto-refresh / polling degradation** (Performance, TC-TCM-262) — no screen in this plugin currently
  auto-refreshes or polls; nothing to exercise for this §29 check today.

## Redmine Version

## Environment

## Test Cycle
