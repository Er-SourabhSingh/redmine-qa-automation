# Bug Report Template

- Bug ID: BUG-CRX-042
- Production Redmine Issue ID: #121828
- Title: Time Agent's `submit` on an empty (no time logged) week returns a misleading error claiming "a corrupted approval schema" and tells the user to contact an administrator, for a completely normal, everyday situation
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `daisy.skye` (Crux Reporter — non-admin team member)
- Date: 2026-09-29

## Steps to reproduce

1. As a team member with zero time logged for a given period (a completely normal state — e.g. a week not yet worked, or simply not logged yet).
2. Confirm the native UI's own proactive client-side check on the "Submit Timesheet" button: it correctly refuses with a plain, accurate message (see Actual Result).
3. In Ask Crux chat, ask the Time Agent: "Time Agent, please submit my timesheet for [that same empty period]." (supply the team ID directly if needed — see BUG-CRX-041 for why an ordinary user can't normally get this).
4. Confirm the resulting proposal (note: the agent did not proactively warn that the period is empty before proposing — it produced a normal-looking `Timesheet Submit` proposal regardless).
5. Observe the failure message after confirming.

## Expected result

- Per the native UI's own correct behavior (`"⚠️ Cannot submit an empty timesheet. Please log time first."`), the Time Agent's failure message should be equally plain, accurate, and non-alarming — this is one of the most common, everyday situations a user can hit (forgetting to log time, or a genuinely unworked period), not a data-integrity emergency.

## Actual result

- Native UI (client-side check, for comparison): *"⚠️ Cannot submit an empty timesheet. Please log time first."* — correct, plain, non-alarming.
- Time Agent chat, same exact scenario: *"Validation error: Submission failed due to a data error: No time entries found for this week. **This may indicate a corrupted approval schema for team #2. Contact an administrator.** Correct the value(s) above and try again."*
- This message is misleading in two ways: (1) it frames a routine "no time logged" state as a possible **data corruption** issue, which it is not, and (2) it tells an ordinary user to **contact an administrator** for something they can resolve themselves in seconds (log some time, then submit) — likely to generate unnecessary alarm and spurious admin escalations for completely normal usage.
- No security/data-integrity issue: independently verified no phantom submission was created — the native weekly grid still shows "Submit Timesheet" available (not a submitted state), 0:00 total, and the "+" log-time buttons still present after the failed attempt.
- Separately noted: the agent did not proactively warn "this period has no logged time" *before* generating the write proposal — it only surfaced the (misleadingly-worded) failure after the user had already confirmed. A better flow would check and warn before proposing at all, matching the native UI's own proactive client-side check.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and the native UI's own comparison message on the same period.

### Console / log

```
[Native UI, as daisy.skye, week of 2026-10-19, 0:00 logged]
Clicked "Submit Timesheet" button ->
"⚠️ Cannot submit an empty timesheet. Please log time first."

[Ask Crux, same user, same period]
C: Time Agent, please submit my timesheet for the week of October 19 to 25.
-> asking the Time Agent...
I need the numeric team ID for "Retest Squad" to submit your timesheet.
C: The team ID is 2.
-> asking the Time Agent...
I'll do this (Timesheet Submit) -- confirm?
[Write] Context Type: team, Context: 2, Period Start: 2026-10-19, Period End: 2026-10-25
[Confirm clicked]
"Validation error: Submission failed due to a data error: No time entries found for this week.
This may indicate a corrupted approval schema for team #2. Contact an administrator.
Correct the value(s) above and try again."

[Verification]
Reloaded /timesheets/weekly?week_start=2026-10-19 -> "Submit Timesheet" button still present
(not submitted), Total still 0:00, "+" log-time buttons still present -- no phantom submission,
no data corruption, genuinely just an empty week.
```

## Duplicate check

- Duplicate found: No — a distinct message-quality defect, found while investigating BUG-CRX-041 (empty-timesheet submission scenario, tested per explicit user request).
- Existing bug reference (if duplicate): —

## Production report

Reported to production 2026-10-01 as **#121828** (Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, Category Crux Plugin, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 "Crux QA Run 1" / Suite #374, Environment "Window 11 + Chrome" — testcase marked Failed.
