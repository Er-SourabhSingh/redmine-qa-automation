# Bug Report Template

- Bug ID: BUG-CRX-038
- Production Redmine Issue ID: #121511
- Title: Time Agent's `submit` fabricates a string slug (e.g. `"retest_squad"`) as `context_id` for a named team instead of resolving the real numeric team ID, causing the write to fail with a validation error
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-29

## Steps to reproduce

1. Have a real team (e.g. "Retest Squad") with a submittable timesheet (a logged time entry for a team member, current week, Team Mode).
2. In Ask Crux chat: "Time Agent, please submit [user]'s timesheet for the [Team Name] team, week of [dates], now." — naming the team by its display name, not its numeric ID.
3. Observe the resulting proposal and its outcome after confirming.

## Expected result

- Per `agents/timesheet.md`'s own rule #1 ("Resolve a named project honestly — this plugin's tools have no project-name lookup of their own; `context_id` on `list`/`report`/`time_entries` must be a numeric project or team id... never guess one"), the agent should either look up the team's real numeric ID (via `team_list`) before proposing, or ask the user for it — never fabricate a value.

## Actual result

- "Time Agent, please submit Redmine Admin's timesheet for the Retest Squad team, week of Sep 28 to Oct 4 2026, now." → produced a `Timesheet Submit` proposal with **Context: `retest_squad`** — a lowercased, underscored slug of the team's display name, not a real numeric team ID.
- Confirming the proposal failed: *"write failed: tool 'redmineflux_timesheet_submit' failed: Error executing tool redmineflux_timesheet_submit: 1 validation error for redmineflux_timesheet_submitArguments context_id Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='retest_squad', input_type=str]"*.
- Retrying by clicking Confirm again on the same stale proposal repeated the identical failure — the agent did not self-correct or regenerate a fixed proposal.
- **Confirmed this is an agent resolution defect, not a broken tool**: cancelled and re-asked with the real numeric team ID supplied explicitly ("submit Redmine Admin's timesheet with context_type team, context_id 2 ... now") → produced a correct proposal with **Context: `2`** → confirmed → *"✓ Timesheet submitted for approval. — Submission #1 is now 'submitted'."* → genuinely persisted, verified via the native Admin Dashboard (`/admin_dashboard`): "TOTAL SUBMISSIONS: 1", "PENDING APPROVALS: 1", "Submitted: 1".
- **Impact**: a user following the natural workflow (naming the team by its familiar display name, exactly as every other Timesheet chat interaction in this engagement has worked) hits an opaque Pydantic validation error instead of a working submission — the only way around it is already knowing to supply the raw numeric team ID, which isn't discoverable without separately calling `team_list`.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and the real `/admin_dashboard` page (submission count genuinely incremented only after the numeric-ID retry).

### Console / log

```
C (admin): Time Agent, please submit Redmine Admin's timesheet for the Retest Squad team, week of
Sep 28 to Oct 4 2026, now.
-> asking the Time Agent...
I'll do this (Timesheet Submit) -- confirm?
[Write] Context Type: team, Context: retest_squad, Period Start: 2026-09-28, Period End: 2026-10-04
[Confirm clicked]
write failed: tool 'redmineflux_timesheet_submit' failed: Error executing tool
redmineflux_timesheet_submit: 1 validation error for redmineflux_timesheet_submitArguments
context_id Input should be a valid integer, unable to parse string as an integer
[type=int_parsing, input_value='retest_squad', input_type=str]
[Confirm clicked again -- identical failure, no self-correction]
[Cancelled]

C: Time Agent, submit Redmine Admin's timesheet with context_type team, context_id 2 (the numeric
team ID), period 2026-09-28 to 2026-10-04, now.
-> asking the Time Agent...
I'll do this (Timesheet Submit) -- confirm?
[Write] Context Type: team, Context: 2, Period Start: 2026-09-28, Period End: 2026-10-04
[Confirm clicked]
"✓ Timesheet submitted for approval. -- Submission #1 is now 'submitted'."

[Verification, /admin_dashboard]
TOTAL SUBMISSIONS: 1 | PENDING APPROVALS: 1 | Approval Status -> Submitted: 1
-- confirms the numeric-ID submission genuinely persisted; the slug-based attempt never did.
```

## Duplicate check

- Duplicate found: No — same general defect *class* as BUG-CRX-015/021 (an agent guessing/fabricating a numeric ID or context value instead of resolving it honestly), but this is the first confirmed instance specifically in the Timesheet Agent's `submit` tool, and specifically a fabricated *slug string* rather than a wrong numeric guess.
- Existing bug reference (if duplicate): BUG-CRX-015 (CRM, unresolvable project_id), BUG-CRX-021 (Invoicing, wrong numeric project ID) — related pattern, not duplicates

## Production report

Reported to production 2026-09-29 as **#121511** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 / environment "Window 11 + Chrome" — testcase result marked Failed with defect #121511 attached, confirmed via `get_issue`.

## 2026-10-01 retest — CONFIRMED FIXED

Dev's fix (`redmineflux-crux-core`, branch `master`, commit `501a075` — widened `agents/timesheet.md`'s Rule 1 to explicitly cover `submit`/`approve`/`reject`/`withdraw`/`withdraw_bulk`, not just the read tools; confirmed present in the local git checkout). A prompt-only change, so re-verified against a live model exactly as the dev requested.

Re-ran the exact original repro, fresh chat session, naming the team by display name only: "Time Agent, please submit Redmine Admin's timesheet for the Retest Squad team, week of Sep 28 to Oct 4 2026, now." The resulting proposal showed **Context: `2`** — the real numeric team ID, not a fabricated slug. Expanding "Sources (1)" confirmed the agent genuinely called `redmineflux_timesheet_team_list` before proposing, exactly matching the fix's intent. **Verdict: CONFIRMED FIXED.** Recommend closing.

(Confirming this proposal also surfaced BUG-CRX-039's retest result — see that bug file for the Admin self-submission refusal, and the new `✓`-on-refusal observation cross-referenced to BUG-CRX-040.)
