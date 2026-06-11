# QA Process Flow — Redmineflux Advanced Field

---

## Bug Lifecycle

### Rule: Move bug file on retest pass

When a bug is retested and confirmed **FIXED**, the bug file **must** be moved from `bugs/open/` to `bugs/closed/` before closing the session. The `bugs/open/` folder must never retain a bug that has a confirmed-fixed retest result.

**Steps on every fix + retest:**

1. Complete retest — confirm the bug is fixed across all blocked TCs
2. Update the bug file status, fix date, retest date, and retest result
3. **Move the file:** `bugs/open/BUG-RAF-XXX.md` → `bugs/closed/BUG-RAF-XXX.md`
4. Update `bugs/_index.md` — change Status to `Closed`, file path to `bugs/closed/BUG-RAF-XXX.md`
5. Update `reports/final-bug-report.md` — move bug to Closed Bugs section
6. Update `reports/defects-summary.html` — flip counters, mark bug as Fixed
7. Update `reports/tc-report.html` — change BLOCKED → PASS for all affected TCs, add fix reference note
8. Update `docs/changelog.md` — add a row for the fix retest session
9. Update `docs/handoff.md` — clear blockers section, update next session state

### Bug file naming

| State | Location | Example |
|-------|----------|---------|
| Open (confirmed, not yet fixed) | `bugs/open/` | `bugs/open/BUG-RAF-001.md` |
| Closed (fix confirmed by retest) | `bugs/closed/` | `bugs/closed/BUG-RAF-001.md` |
| Duplicate / not reproducible | `bugs/_duplicates.md` | entry in the duplicates log |

---

## Test Case Lifecycle

### States

| State | Meaning |
|-------|---------|
| PASS | TC executed and all assertions met |
| FAIL | TC executed and at least one assertion failed (no bug blocking it) |
| BLOCKED | TC cannot be executed because an open bug prevents reaching the test step |
| FIXED ✓ | Bug retest entry — fix confirmed by retest |

### Rule: BLOCKED → PASS on fix retest

When a bug is fixed, all TCs that were BLOCKED by that bug must be retested and updated to PASS in `reports/tc-report.html`. Add a `fix-ref` note referencing the bug ID and retest date.

---

## Report Files

| File | When to update |
|------|---------------|
| `reports/tc-report.html` | After every test session and after every fix retest |
| `reports/defects-summary.html` | After every bug is found or closed |
| `reports/final-bug-report.md` | After every fix retest (move bugs Open→Closed section) |
| `docs/changelog.md` | After every session (test or retest) |
| `docs/handoff.md` | At the end of every session |
| `bugs/_index.md` | When any bug is opened or closed |

---

## Session End Checklist

- [ ] All executed TCs recorded in `tc-report.html`
- [ ] Any new bugs filed in `bugs/open/` and added to `bugs/_index.md`
- [ ] Any fixed bugs moved from `bugs/open/` to `bugs/closed/`
- [ ] `defects-summary.html` counters correct
- [ ] `final-bug-report.md` in sync with bug file states
- [ ] `changelog.md` row added for this session
- [ ] `handoff.md` updated with next session start point
