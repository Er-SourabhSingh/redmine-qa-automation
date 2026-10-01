# Bug Report Template

- Bug ID: BUG-CRX-039
- Production Redmine Issue ID: #121513
- Title: Time Agent's `submit` allows submitting a timesheet for the Redmine Administrator account, creating a self-approval scenario the native UI deliberately prevents by hiding the Submit control specifically for that account
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-29

## Steps to reproduce

1. In a Team Mode timesheet team with a 2-level approval schema, have the Redmine Administrator (superuser) account as a team member — team role assignment is irrelevant to this restriction (confirmed with the user: the native UI's Submit control is hidden specifically for the Administrator account itself, a deliberate exclusion built into the plugin, not something driven by team-role/schema-role status).
2. As the Administrator, log a real time entry for the current week.
3. Confirm the native "Submit" control is genuinely absent for the Administrator on the weekly timesheet grid (by design — see rationale below).
4. In Ask Crux chat, ask the Time Agent to submit that timesheet on the Administrator's behalf: "Time Agent, submit Redmine Admin's timesheet with context_type team, context_id [N], period [dates], now." (or by team name — see BUG-CRX-038 for the separate ID-fabrication issue on the by-name path).
5. Confirm the resulting proposal.
6. Check the Administrator's own Approver Dashboard (`/approvals`).

## Expected result

- Per the product's own design logic (confirmed with the user): the Administrator account sits above the entire approval chain as the fallback/last-resort approver — the KB's own rule ("if submitter is final-level approver, only admin can complete approval/rejection") exists specifically because the Administrator is meant to resolve deadlocks, not participate in the submit/approve cycle as an ordinary member. The Administrator already holds every permission, so there is no meaningful "approval" for anyone to grant, and no one is positioned above the Administrator to approve their submission either. This is exactly why the native UI deliberately hides the Submit control for the Administrator account specifically — a decision made when the plugin was built, independent of team-role/schema-role assignment. The Time Agent's `submit` tool should honor the same restriction and honestly refuse for the Administrator account, not silently succeed.

## Actual result

- The native UI genuinely has no way for Admin to submit — confirmed via direct DOM inspection: the underlying `#ts-submit-panel` form exists but stays `display:none` for Admin, with no discoverable trigger anywhere on the page (tested in both "My Timesheet" and "Team" views, across two different weeks). This UI behavior is correct and intentional, not itself a bug.
- However, "Time Agent, please submit Redmine Admin's timesheet ... now" (using the real numeric team ID) produced a genuine `Timesheet Submit` proposal, was confirmed, and genuinely succeeded: *"✓ Timesheet submitted for approval. — Submission #1 is now 'submitted'."* — verified real via the Audit Log (`SUBMIT`, `TimesheetSubmission #1`, `draft → submitted`, by Redmine Admin, timestamped).
- **This created exactly the illogical scenario the UI restriction exists to prevent**: Admin's own Approver Dashboard (`/approvals`) now shows this submission sitting in Admin's own pending-approval queue — *"PENDING: 1 ... USER: RA Redmine Admin ... TEAM Retest Squad ... Level 1 of 2 ... STATUS: SUBMITTED ... Actions: Review / Approve / Reject"* — meaning Admin could click "Approve" on their own submission, right now, via the native UI. No layer in the system stopped the agent from creating a state that undermines the entire point of the approval workflow.
- No error, no refusal, no honesty flag from the agent about this being an unusual/disallowed action for this user.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, the real `/audit_logs` page (genuine SUBMIT entry), and the real `/approvals` page (genuine self-targeted pending approval).

### Console / log

```
[Confirmed: native UI's Submit control is hidden for Admin — #ts-submit-panel style="display:none",
 no discoverable trigger anywhere on the weekly grid page, checked in both My Timesheet and Team views]

C (admin): Time Agent, submit Redmine Admin's timesheet with context_type team, context_id 2,
period 2026-09-28 to 2026-10-04, now.
-> asking the Time Agent...
I'll do this (Timesheet Submit) -- confirm?
[Write] Context Type: team, Context: 2, Period Start: 2026-09-28, Period End: 2026-10-04
[Confirm clicked]
"✓ Timesheet submitted for approval. -- Submission #1 is now 'submitted'."

[Verification, /audit_logs]
29 Sep 2026 10:06:50 | SUBMIT | TimesheetSubmission #1 | Redmine Admin | Previous status: draft,
New status: submitted

[Verification, /approvals -- Admin's own Approver Dashboard]
PENDING: 1
RA Redmine Admin | 28 Sep - 4 Oct 2026, Wk 40 | TEAM Retest Squad | 4.00h | Level 1 of 2 | SUBMITTED
14 minutes ago | Actions: Review / Approve / Reject
-- Admin's own submission is sitting in Admin's own approval queue, actionable by Admin.
```

## Duplicate check

- Duplicate found: No — related to BUG-CRX-038 (same `submit` tool, found in the same session) but a distinct defect: BUG-CRX-038 is about a fabricated string `context_id` causing a tool-call failure; this bug is about the tool succeeding when it should have refused entirely, for a user the business logic structurally excludes from submitting.
- Existing bug reference (if duplicate): BUG-CRX-038 (same tool, different defect)

## Production report

Reported to production 2026-09-29 as **#121513** (project `ztflux`, tracker Bug, Priority High, Defect Type Functional, Defect Severity High-severity, Defect priority High, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 / environment "Window 11 + Chrome" — testcase result marked Failed with defect #121513 attached, confirmed via `get_issue`.

## 2026-10-01 retest — CONFIRMED FIXED (original defect), new ✓-on-refusal observation cross-referenced to BUG-CRX-040

Dev's fix (`redmineflux_timesheet`, branch `master`, commit `3e9fde7` — `Api::TimesheetSubmissionsController#create` now refuses immediately with a real 403 when `User.current.admin?`, before any context/period validation; confirmed present in the local git checkout, plus its one new migration `019_allow_null_approver_id_on_approval_actions.rb` run).

Re-ran the exact original repro: "Time Agent, please submit Redmine Admin's timesheet for the Retest Squad team, week of Sep 28 to Oct 4 2026, now." (this run also doubled as BUG-CRX-038's retest — the team resolved honestly to numeric ID `2` via `team_list`). Confirming the proposal produced: *"✓ The Administrator account cannot submit its own timesheet — it sits above the entire approval chain as the fallback approver, so there is no one positioned to approve this submission. This matches the native UI, which hides the Submit control for this account for the same reason."* — text matches the dev's cited 403 response verbatim. Verified via `/admin_dashboard`: Total Submissions 0, Pending Approvals 0 — no phantom submission, genuine refusal, no silent bypass.

**Verdict: original defect (Admin self-submission silently succeeding) CONFIRMED FIXED.**

**New observation, not a continuation of this bug**: the refusal text above is prefixed with a misleading **`✓`** checkmark — identical defect pattern to the already-open **BUG-CRX-040** (Time Agent's `settings_update` prefixing a genuine "Permission denied" failure with "✓"), just surfacing here on the `submit` tool instead. Not filing a new bug for this — noting it here as a second confirmed instance of BUG-CRX-040's pattern, to fold into that bug's own retest (see `BUG-CRX-040.md`).
