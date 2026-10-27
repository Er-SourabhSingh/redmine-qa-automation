# Bug Report Template

- Bug ID: BUG-CRX-088
- Production Redmine Issue ID: #125496
- Title: "Report Defect" (the Failed/Blocked flow) silently bypasses the closed-run guard that "Create Status Result" explicitly has — writes a new testcase result + linked defect into a CLOSED run with no warning at all
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin... actually admin (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with run #4 ("Sprint 3 Full Fields Test") already **closed** (`is_closed=true`, closed earlier the same session via the agent's own Close Run action — see TC-CRX-335).
2. In Ask Crux chat (QA Agent): "for the 'Sprint 3 Full Fields Test' run, can you mark the test case 'Verify password reset email is sent' as Failed?"
3. Agent correctly explains "Failed" requires a linked `defect_ids` and offers to create a new defect.
4. Reply "Yes, please create a new defect for this failure," then supply a defect subject when asked.
5. Agent produces a `Testcases Management Report Defect` confirm card (`Project`, `Testcase: 7`, `Run: 4`, `Testsuite: 1`, `Environment: Staging`, `Case Status: 3`, `Defect Subject: ...`) — **no mention anywhere that run #4 is closed.**
6. Click Confirm.

## Expected result

Either the agent should refuse upfront (the same way `create_status_result` does: *"Cannot log results: run #{run_id} is closed. Use list_runs to see open runs."*), or at minimum the confirm card should disclose that the target run is closed before the user approves it — matching the explicit guard already present in the sibling tool for the exact same underlying action (recording a testcase result).

## Actual result

The write genuinely succeeded with zero warning: *"Testcase #7 marked 'Failed' with defect #10 'Password reset email not being sent on valid request' linked and visible in run."* Confirmed via DB:

```
SELECT id, issue_id, case_status_id, run_id, defect_ids, environment FROM issue_status_results WHERE run_id=4;
 id | issue_id | case_status_id | run_id | defect_ids | environment
----+----------+-----------------+--------+------------+-------------
  4 |        6 |               1 |      4 |            | Staging
  5 |        7 |               1 |      4 |            | Staging
 12 |        7 |               3 |      4 |         10 | Staging   <- new row, written after close
```

New defect issue #10 ("Password reset email not being sent on valid request") was also genuinely created and linked. **Root cause confirmed via MCP source**: `redmineflux_testcases_management_create_status_result` (line ~1090) has an explicit client-side pre-check —

```python
# BUG-TM-011: pre-check run is not closed before sending to API
...
if r.get("is_closed"):
    return f"Cannot log results: run #{run_id} is closed. Use list_runs to see open runs."
```

— but `redmineflux_testcases_management_report_defect` (line ~1913), the tool actually used for any Failed/Blocked status (the far more common real-world path, since Passed is the only status that doesn't require a defect), has **no such check at all** anywhere in its validation block. The two tools cover the identical underlying action (recording an `IssueStatusResult` against a run) but only one of them inherited the closed-run protection.

## Evidence

### Console / log

- Confirm card (verbatim table): `Project: Crux QA Agent Test Project`, `Testcase: 7`, `Run: 4`, `Testsuite: 1`, `Environment: Staging`, `Case Status: 3`, `Defect Subject: Password reset email not being sent on valid request` — no `Run Status`/`Closed` field shown anywhere.
- Post-confirm message (verbatim): `"Testcase #7 marked 'Failed' with defect #10 'Password reset email not being sent on valid request' linked and visible in run."`
- DB verification: `issue_status_results` row id=12 created against `run_id=4` (closed) with `defect_ids=10`; `issues` row id=10 (the new defect) created successfully.
- MCP source: `create_status_result` closed-run guard confirmed present (citing its own internal ticket `BUG-TM-011`); `report_defect` confirmed to have no equivalent check anywhere in its ~90-line body.

## Duplicate check

- Duplicate found: No — first instance of this specific inconsistency (closed-run protection present on one tool but missing on its sibling for the identical action). Not a duplicate of BUG-CRX-086 (that's a destructive silent write behind a *false failure* message on Update Run); here the write is genuinely intended to succeed and does, the defect is that a known, already-implemented safeguard (cited by its own code comment, `BUG-TM-011`) simply wasn't applied to this second code path.
