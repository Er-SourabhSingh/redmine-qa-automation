# Bug Report Template

- Bug ID: BUG-CRX-087
- Production Redmine Issue ID:
- Title: QA Agent's "Run progress/results table" fabricates an extra testcase row for a testcase that was never actually added to that run — it appears to substitute "all testcases in the run's suite" for "testcases actually linked to this run," inventing a fake "Untested" result for a testcase genuinely absent from the run
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with run #1 ("Sprint 1 Regression") genuinely containing exactly **one** testcase: #6 ("Reset password with valid email"), linked to suite #1 ("Login and Auth") — confirmed via DB (`run_issues` for run_id=1 → exactly 1 row, issue_id=6) and via the native UI's own "Runs & Results" page for this run, which shows "Showing 1 test cases" and a pie chart reading "Total 1".
2. Separately, suite #1 ("Login and Auth") itself has **two** testcases in total: #6 and #7 ("Verify password reset email is sent") — #7 was added to the suite earlier in this session but was only ever added to a *different* run (#3, "Sprint 2 Targeted Test"), never to run #1.
3. In Ask Crux chat (QA Agent): "in the Crux QA Agent Test Project, can you show me the full progress and results table for the 'Sprint 1 Regression' run — pass/fail counts and status of each test case in it?"
4. Observe the table and summary counts returned.
5. Compare against the native UI's own "Runs & Results" page for the same run, and against the DB.

## Expected result

The results table for run #1 should list exactly the testcases genuinely included in that run — in this case, only #6 — matching both the database (`run_issues`) and the native "Runs & Results" page's own "Showing 1 test cases" / "Total 1" display.

## Actual result

The agent's table listed **two** rows — #6 and #7 — both shown with `Status: Untested`, and the summary block read `Total testcases: 2, Passed: 0, Failed: 0, Untested: 2`. Testcase #7 was never added to run #1 at any point; it was only ever added to run #3. The native UI for this exact run (screenshot captured by the user) shows only testcase #6, "Showing 1 test cases," and a pie chart reading "Total 1" — directly contradicting the chat's "2" count. Verified via DB: `run_issues` for `run_id=1` has exactly one row (`issue_id=6`); `issue_status_results` for `run_id=1` has exactly one row (also `issue_id=6`). Testcase #7 appears nowhere in either table for this run.

This was caught by the user directly comparing the chat's claimed table against the real "Runs & Results" native UI page, not through DB inspection alone — a strong signal of how easily this fabrication could mislead a real tester relying on the chat's summary instead of checking the native UI.

## Evidence

### Console / log

- Chat response (verbatim table rows): `#6 — Reset password with valid email — Untested — Low`, `#7 — Verify password reset email is sent — Untested — Low`.
- Chat summary (verbatim): `Total testcases: 2`, `Passed: 0`, `Failed: 0`, `Untested: 2`.
- Native UI ("Runs & Results" page for this run, screenshot): "Passed: 0% — 0 of 1 tested (0.00%)", pie chart "Total 1", "Showing 1 test cases", single row for testcase #6 only.
- DB: `SELECT * FROM run_issues WHERE run_id=1` → 1 row (issue_id=6). `SELECT * FROM issue_status_results WHERE run_id=1` → 1 row (issue_id=6, case_status_id=1/Untested at the time of this repro).

## Note for triage

Likely root cause: the agent appears to have substituted "all testcases belonging to the run's suite" (a `list_testcases_in_suite`-style lookup, which would correctly return both #6 and #7 since both are genuinely in suite #1) for "testcases actually linked to this specific run" (what `get_run_testcases` is meant to return, scoped by `run_id` via `/projects/:id/runs/:id/test-cases.json`). This is a new, distinct failure shape from every other finding in this suite: not a wrong ID, not a self-contradiction, not a misleading checkmark, and not a destructive write (BUG-CRX-086) — this is a **read-path fabrication that invents a plausible-looking but false data row**, which is particularly dangerous because the fabricated row is internally consistent (correct testcase subject, correct suite) and would pass a cursory sanity check; only a side-by-side comparison with the native UI or a DB query reveals it.

## Duplicate check

- Duplicate found: No — first instance in this suite of a read query returning a fabricated/wrong *scope* (suite-level data presented as run-level data) rather than a wrong value, wrong ID, or wrong write target. Distinct from BUG-CRX-086 (a destructive write) and from the wrong-ID family (BUG-CRX-079, values guessed, not rows invented).
