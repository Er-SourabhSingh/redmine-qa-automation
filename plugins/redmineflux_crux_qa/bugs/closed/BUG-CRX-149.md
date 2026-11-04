# Bug Report Template

- Bug ID: BUG-CRX-149
- Production Redmine Issue ID: #127554
- Title: Capacity Agent's `leave_create` NEVER auto-approves a leave request — always creates status `pending`,
  even when the actor is a Redmine admin or holds `can_approve_leave` on the target's team — contradicting the
  plugin's own documented/web-UI auto-approval design
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Capacity Agent) / redmineflux_workload (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin, luna.blossom (can_approve_leave on Team #7), daisy.skye (plain member)
- Date: 2026-11-03

## Steps to reproduce

Per the vendor's documented leave-approval business rule (and the native web UI's own leave-request modal,
which explicitly states: *"Select a team member to create leave on their behalf (will be **auto-approved if
you have permission**)"*), four scenarios were tested via the Capacity Agent chat, each phrased with
natural-language names only (team/user/leave-type), confirmed via the genuine confirm card, then
native-verified on `/rf_leaves`:

1. **Rule A1 — admin creates leave for another user**: as `admin`, "Create a leave request for Daisy Skye,
   type sick, 2026-11-26 to 2026-11-26..." → confirm card correctly resolved `Username: daisy.skye` → confirmed
   → chat reported *"✓ Leave created: #1 | Daisy Skye | Sick Leave | 2026-11-26 → 2026-11-26 (1.0 days) |
   **Status: pending**"*. Native-verified on `/rf_leaves` (Team Approvals tab, logged in as admin): the request
   sits in **Pending Approvals**, awaiting Luna Blossom (the real `can_approve_leave` holder on Team #7) — not
   auto-approved despite the actor being Redmine's own instance admin.
2. **Rule A2 — admin creates leave for self**: as `admin`, "Create a leave request for myself, type planned,
   2026-11-27 to 2026-11-27..." → confirm card showed `User: 0` (self-sentinel) → confirmed → *"✓ Leave
   created: #3 | Redmine Admin | Planned Leave | 2026-11-27 → 2026-11-27 (1.0 days) | **Status: pending**"*.
3. **Rule C — approver creates leave for another team member**: as `luna.blossom` (confirmed via
   `/rf_teams/7`: "Can approve leave" = **Enabled** for Luna, **Disabled** for Daisy), "Create a leave request
   for Daisy Skye, type planned, 2026-11-28 to 2026-11-28..." → confirm card correctly resolved `User: 6`
   (Daisy Skye's real user id) → confirmed → *"✓ Leave created: #4 | Daisy Skye | Planned Leave | 2026-11-28 →
   2026-11-28 (0.0 days) | **Status: pending**"* (0.0 days is correct — 2026-11-28 is a Saturday, non-working
   day — the status is the defect, not the day count).
4. (Rules B and D — a plain member requesting her own leave, and an approver requesting her own leave — were
   also exercised and both correctly land as `pending`, but this is coincidental: see Actual Result.)

## Expected result

Per the plugin's own business rule (confirmed both from the vendor KB/business description and the native web
UI's leave-request modal tooltip), a leave created **by an admin, or by a `can_approve_leave` holder, for
someone else**, should be **auto-approved immediately** (status `approved`, with `approved_by` set to the
actor) — never silently queued as `pending`. Only a plain member's own request (no `can_approve_leave`), or a
`can_approve_leave` holder's *own* request (which per business rule must go to an admin, since nobody can
self-approve), should ever land in `pending`.

## Actual result

Every single leave created via the Capacity Agent — regardless of actor (admin, `can_approve_leave` holder, or
plain member) and regardless of target (self or another user) — is created with status **`pending`**, with no
auto-approval path ever taken. Root cause confirmed by reading the actual Rails source
(`C:\crux-redmine\plugins\redmineflux_workload\app\controllers\apis\workload_leaves_controller.rb`, the API
controller the Crux/MCP tool calls): its `create` action hard-codes `leave.status = 'pending'` (line 28) and
contains **no auto-approve branch at all** — it only checks whether the actor is *permitted* to create the
leave for someone else (admin or `can_approve_leave`), then always saves it as `pending`. This is in direct
contrast to the plugin's own web-UI controller
(`app\controllers\rf_leaves_controller.rb`, lines 148–154), which explicitly *does* auto-approve when "created
by admin or approver creating for someone else": `@leave.approve!(User.current, ...)`. The same logical
action — e.g. an admin creating a leave for Daisy Skye — is auto-approved when done through the native web
"Request Leave" form, but always left pending when done through the API path that the Capacity Agent (and any
other MCP/API consumer) uses. This means: (a) Rule A (admin auto-approve) and Rule C (approver-for-other
auto-approve) are both impossible to achieve via Crux chat, ever; (b) every leave the Capacity Agent creates
silently requires a manual approval step the UI's own tooltip told the user wouldn't be necessary.

## Evidence

### Console / log

- Attempt 1 (admin → Daisy): confirm card `Username: daisy.skye`, `Leave Type: sick`, `2026-11-25...` *(earlier
  regression check, same defect visible)*; this test's instance: confirm card resolved correctly, chat result
  *"✓ Leave created: #1 | Daisy Skye | Sick Leave | 2026-11-26 → 2026-11-26 (1.0 days) | Status: pending"*.
  Native `/rf_leaves` (admin, Team Approvals tab): row present under **Pending Approvals** with
  Employee=Daisy Skye, Leave Type=Sick Leave, Start/End=11/26/2026, Days=1.0, Reason="rule A test - admin
  creating for another user", Actions=[View, Approve, Reject] — i.e. genuinely un-approved, awaiting action.
- Attempt 2 (admin → self): *"✓ Leave created: #3 | Redmine Admin | Planned Leave | 2026-11-27 → 2026-11-27
  (1.0 days) | Status: pending"*.
- Attempt 3 (Luna, can_approve_leave on Team #7 → Daisy, same team): *"✓ Leave created: #4 | Daisy Skye |
  Planned Leave | 2026-11-28 → 2026-11-28 (0.0 days) | Status: pending"*.
- Attempt 4 (Luna → self): *"✓ Leave created: #5 | Luna Blossom | Planned Leave | 2026-11-30 → 2026-11-30 (1.0
  days) | Status: pending"*.
- Attempt 5 (Daisy, plain member, no can_approve_leave → self): *"✓ Leave created: #6 | Daisy Skye | Sick Leave
  | 2026-12-01 → 2026-12-01 (1.0 days) | Status: pending"* — correctly pending, but for the same
  always-pending reason, not genuine rule-based evaluation.
- Source evidence: `workload_leaves_controller.rb` `create` action — `leave.status = 'pending'` unconditional,
  no `approve!` call anywhere in the method, versus `rf_leaves_controller.rb`'s web-form `create` action which
  does call `@leave.approve!(...)` under an explicit "Auto-approve if created by admin or approver creating
  for someone else" branch.

## Duplicate check

- Duplicate found: No. This is a distinct, newly-identified gap between the web-UI and API/MCP code paths for
  the same plugin action — not previously documented in this suite or in `bugs/_duplicates.md`. Related in
  theme to the general "two code paths disagree" class but no existing bug covers leave auto-approval
  specifically.

## Retest — 2026-11-04 (FIXED)

Developer pulled `redmineflux-crux-core`→`b6867e8`, `redmineflux-mcp`(`crux_development`)→`93d479c`,
`redmineflux_crux` plugin→`7751dc8`, `redmineflux_workload`→`0b304a3` (retest guide round 31). Migrations run,
all services restarted.

Retested Rule A (admin creates leave for another team member): as admin, Capacity Agent, "Create a leave
request for Daisy Skye, sick leave, from 2027-03-15 to 2027-03-16." Confirm card correctly resolved
`Username: daisy.skye`, `Leave Type: sick`. Confirmed → `"✓ Leave created: #7 | Daisy Skye | Sick Leave |
2027-03-15 → 2027-03-16 (2.0 days) | **Status: approved**"` — genuinely auto-approved this time, matching the
plugin's own documented business rule and the native web UI's identical behavior. **Status: FIXED.** Moved to
`bugs/closed/`.

(Incidental finding during retest, not re-filed separately: one earlier attempt in the same session resolved
the username as `daisy_skye` — underscore instead of the real `daisy.skye` — and failed with "No user found."
Retrying with the correct dotted username succeeded cleanly. Flagged for whoever retests BUG-CRX-019/551's
username-resolution fix, in case this is a fresh recurrence worth its own bug on a future pass.)
