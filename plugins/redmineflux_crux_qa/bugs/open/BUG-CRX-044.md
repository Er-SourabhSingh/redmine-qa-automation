# Bug Report Template

- Bug ID: BUG-CRX-044
- Production Redmine Issue ID: #121829
- Title: Time Agent's timesheet-lookup tools (`approval_dashboard`, `timesheet_list`) report a definitive "no timesheets exist" when the real situation is that the data is scoped/invisible to the caller — recurrence of the BUG-CRX-026 fabricated-absence pattern on a different agent
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `daisy.skye` (Crux Reporter — `view_timesheets` only) and `luna.blossom` (Crux Manager — Level-1 approver)
- Date: 2026-10-01

## Steps to reproduce

1. As a user with `view_timesheets` only (no `manage_timesheet`), with a real submission pending at a *different* approval level than this user's own (e.g. escalated to Admin): "Time Agent, please approve [other user]'s timesheet for [period]."
2. As a Level-1 approver, immediately after a colleague genuinely submits a timesheet that should be pending at this user's own level: "Time Agent, please approve [that user]'s timesheet for [period]."

## Expected result

When the agent's own tool call returns no visible results for the caller's permission scope, the agent should report this honestly as a scoping/visibility limitation ("I don't have visibility into submissions outside my own approval level" or similar) — never as a flat, system-wide factual claim that no such record exists anywhere, when a real record demonstrably does exist (verified independently via admin/native UI).

## Actual result

**Reproduction 1** (daisy.skye, TC-CRX-171): "Time Agent, please approve Crux Developer's timesheet for the week of October 5 to 11." → *"There are no timesheets at all (in any status) for 'Crux Developer' for the week of October 5–11, 2026."* — stated as an absolute fact. In reality, a genuine submission (#3) existed for exactly that user/period, independently confirmed via admin's `/approvals` dashboard (sitting at "Level 3 of 3 — Admin escalation"). daisy.skye's own `timesheet_list` call is naturally scoped to what she's allowed to see; the agent reported the scoped-empty result as if it were a global fact.

**Reproduction 2** (luna.blossom, TC-CRX-172): "Time Agent, please approve Crux Reporter's timesheet for the week of September 28 to October 4." → *"There are no timesheet submissions found for the week of September 28 to October 4... Crux Reporter hasn't submitted a timesheet yet for that period..."* — again stated as fact, offering plausible-sounding reasons for the absence. In reality, Submission #5 had been created and genuinely submitted moments earlier by Crux Reporter and was sitting at exactly "Level 1 of 2" — luna.blossom's own approval level — independently confirmed via her own native `/approvals` dashboard immediately after. A follow-up prompt ("check the approval dashboard") made the agent call a *different* tool (`redmineflux_timesheet_approval_dashboard` + `redmineflux_timesheet_approval_review`) which then correctly surfaced the submission with full detail.

No fabricated success and no permission bypass occurred in either case — the agent correctly declined to approve anything it couldn't find — so this is a correctness/honesty defect, not a security one. But it is the same defect *class* already found and fixed once on the Scrum Agent (BUG-CRX-026: "fabricates a plausible 'backlog empty' answer instead of honestly reporting the Agile plugin is entirely unreachable"), now recurring on the Time Agent with a different root tool (`timesheet_list` apparently returning an unexpectedly narrow/empty result for an approval-context lookup, with the agent presenting that as a system-wide fact rather than flagging the possible scoping gap).

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and the real `/approvals` admin dashboard (both submissions genuinely existed and were pending at the moment the agent claimed they didn't).

### Console / log

```
[Reproduction 1 -- daisy.skye]
C: Time Agent, please approve Crux Developer's timesheet for the week of October 5 to 11.
-> asking the Time Agent...
There are no timesheets at all (in any status) for "Crux Developer" for the week of
October 5-11, 2026. This could mean: 1. The timesheet hasn't been created or submitted
yet for that period. 2. "Crux Developer" may be a team or context name rather than a
user name...

[Verification, admin /approvals]
Pending Approvals: 1 -- CD Crux Developer | 5 Oct - 11 Oct 2026 | Team Retest Squad |
4.00h | Level 3 of 3 -- Admin escalation for submitter-owned highest level | Submitted

[Reproduction 2 -- luna.blossom]
C: Time Agent, please approve Crux Reporter's timesheet for the week of September 28
to October 4.
-> asking the Time Agent...
There are no timesheet submissions found for the week of September 28 to October 4.
This could mean: 1. Crux Reporter hasn't submitted a timesheet yet for that period...

C: Yes, please check the approval dashboard for what's currently pending.
-> asking the Time Agent...
Here's the full review: Submission #5 -- Crux Reporter, Period: Sep 28-Oct 4, 2026,
Team: Retest Squad, Total Hours: 4.0h, Status: Submitted (awaiting your approval at
Level 1)...

[Verification, luna.blossom's own /approvals, immediately before the first Time Agent
query above]
Pending: 1 -- CR Crux Reporter | 28 Sep - 4 Oct 2026 | Team Retest Squad | 4.00h |
Level 1 of 2 | Submitted
```

## Duplicate check

- Duplicate found: No — same defect *class* as BUG-CRX-026 (Closed, fixed on the Scrum Agent), but a distinct code path (Time Agent's `timesheet_list`/approval-context lookup), found independently during TC-CRX-171/172 execution.
- Existing bug reference (if duplicate): BUG-CRX-026 (related pattern, different agent/tool, not a duplicate)

## Production report

Reported to production 2026-10-01 as **#121829** (Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, Category Crux Plugin, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 "Crux QA Run 1" / Suite #374, Environment "Window 11 + Chrome" — testcase marked Failed.
