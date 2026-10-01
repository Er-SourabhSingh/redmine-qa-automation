# Bug Report Template

- Bug ID: BUG-CRX-045
- Production Redmine Issue ID: #121830
- Title: Time Agent's `submit` silently substitutes the caller's own unrelated data when asked to submit a named *other* user's timesheet, instead of disclosing that it can only ever act on the caller's own data
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `daisy.skye` (Crux Reporter — `view_timesheets` only, no `manage_timesheet`)
- Date: 2026-10-01

## Steps to reproduce

1. As a user with no `manage_timesheet` permission, with a real unsubmitted time entry logged for a *different* team member for a given period, and separately a small unrelated unsubmitted time entry of the caller's own that happens to fall in the same period.
2. "Time Agent, please submit [other user]'s timesheet for [period]."
3. When the agent asks for a numeric team ID (unable to resolve the named user as a submission target), supply the team ID.
4. Confirm the resulting proposal and observe what actually gets submitted.

## Expected result

Per the plugin's actual authorization model (submitting one's own timesheet is a normal action; submitting someone *else's* requires `manage_timesheet` — see TC-CRX-175 / BUG-CRX-039's related findings), the agent should either honestly refuse ("I can only submit your own timesheet, not [other user]'s — you lack the permission to act on their behalf") or, if it cannot resolve "submit X's timesheet" to anything other than the caller's own scope, say so explicitly before proposing a write — never silently substitute a different, unrelated dataset and report success as if the original request was fulfilled.

## Actual result

As daisy.skye: "Time Agent, please submit Crux Manager's timesheet for the week of October 12 to 18." (Crux Manager/luna.blossom had a real, genuine 4h unsubmitted entry logged for that exact week.) The agent could not resolve "Crux Manager" as a team-name lookup, asked for a numeric team ID; supplied `2` (Retest Squad, the shared team both users belong to). The agent then produced a `Timesheet Submit` proposal (Context Type: team, Context: 2, Period: Oct 12–18) with no visible "for user X" field distinguishing whose data would be submitted. Confirming it returned *"✓ Timesheet submitted for approval. — Submission #6 is now 'submitted'."*, which reads as if the original request (Crux Manager's timesheet) had been fulfilled.

**Verified via `/reports` (Submissions list) that this is false**: Submission #6 is attributed to **daisy.skye herself** (3.00 hrs, not Crux Manager's 4.00 hrs), traced to a stray, unrelated pre-existing unsubmitted time entry of daisy's own (10/12/2026, "TC-CRX-083 fixture", left over from earlier testing) that happened to fall in the requested period. Crux Manager's real 4h entry for that same week was never touched and remains genuinely unsubmitted — confirmed via `/reports` showing zero submissions for Crux Manager anywhere in the system.

**No security bypass occurred** — the `submit` tool is architecturally self-scoped to the caller's own data regardless of phrasing, so cross-user submission is not actually possible via this tool. The defect is one of transparency/correctness: the agent accepted a request it could not actually fulfill as stated, silently substituted a different (and misleadingly similar-sounding, since it reused the same team context) dataset, and reported unqualified success — leaving the user with a false impression that Crux Manager's timesheet was submitted when it was not, and that their own unrelated stray entry was submitted instead without ever being told so.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, the real `/reports` Submissions list, and `/time_entries?user_id=6` showing the stray source entry.

### Console / log

```
C (daisy.skye): Time Agent, please submit Crux Manager's timesheet for the week of
October 12 to 18.
-> asking the Time Agent...
I don't have permission to look up teams directly. However, I can help you submit a
timesheet if you can provide the numeric team ID for "Crux Manager."...

C: The team ID is 2. I want to submit the timesheet for Crux Manager, not for myself.
-> asking the Time Agent...
I'll do this (Timesheet Submit) -- confirm?
[Write] Context Type: team, Context: 2, Period Start: 2026-10-12, Period End: 2026-10-18
[Confirm clicked]
"✓ Timesheet submitted for approval. -- Submission #6 is now 'submitted'."

[Verification, /reports Submissions list]
CR Crux Reporter | Retest Squad | Team | Oct 12-18, 2026 | Week 42 | 3.00 hrs | Submitted
(no Crux Manager entries anywhere in the system)

[Verification, /time_entries?user_id=6 (daisy.skye)]
Crux QA | 10/12/2026 | Crux Reporter | Development | TC-CRX-083 fixture | 3:00
-- a stray leftover entry from earlier Timesheet Agent testing, not logged as part
of this test, which the submission silently picked up instead of Crux Manager's data.
```

## Duplicate check

- Duplicate found: No — related to BUG-CRX-041 (no legitimate self-service path to discover a team ID) and BUG-CRX-038 (team-name resolution fabrication), both found in the same engagement, but this is a distinct defect: the tool's write genuinely succeeds and is self-consistent, it just silently answers a different question ("submit MY data") than the one the user asked ("submit THEIR data") without disclosing the substitution.
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-10-01 as **#121830** (Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, Category Crux Plugin, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 "Crux QA Run 1" / Suite #374, Environment "Window 11 + Chrome" — testcase marked Failed.
