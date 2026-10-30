# Test Cases — Redmineflux Crux — Time Agent (Timesheet plugin) Full CRUD

> **New suite, drafted 2026-10-30, not yet executed.** This agent/plugin domain was previously tested only
> against the OLD Redmine 7.0.0 stack — see `testcases/old_suites/CRUX_AGENT_TIMESHEET.md` for that
> historical record (not re-verified on the current Redmine 6 build, and its TC-CRX numbers are NOT reused
> here per CLAUDE.md §4a). This is the first execution pass for this domain on the current
> `localhost:3015` stack.
>
> **Why this suite is unusually deep ("plugin is logic-based," per explicit user instruction):** unlike
> most Crux domain agents (thin wrappers over simple CRUD), the Timesheet plugin has real, multi-step
> business logic — a sequential multi-level approval state machine, a self-approval guard, an
> admin-approve-bypass that is NOT what the model layer's own `can_be_approved_by?` implies, a
> schema-snapshot-at-submission-time immutability rule, and layered withdraw/edit restrictions. Every TC
> below is grounded in a direct read of the plugin's own Ruby source (models + controllers), not just the
> Time Agent's persona file — read in full before drafting:
> - `agents/timesheet.md` (full persona — 20 tools, extensively annotated with 7 historical bug citations:
>   BUG-CRX-038, 039, 041, 042, 044, 045, 058)
> - `app/models/timesheet/timesheet_submission.rb` — status state machine (`draft→submitted→approved/
>   rejected`), `submittable?`/`approvable?`/`rejectable?` guards, `can_be_approved_by?` (model-layer
>   admin-as-fallback-only logic — see below, the REAL rule differs), `reopen!`
> - `app/models/timesheet/approval_instance.rb` — sequential `current_level` state machine, `schema_snapshot`
>   captured once at creation (JSON), `restart!` (rejected→pending, `cycle_number += 1`, back to level 1)
> - `app/controllers/api/approvals_controller.rb#authorize_approval_access` — **the real, enforced rule**:
>   self-approval is blocked UNCONDITIONALLY, even for admin (`@submission.user_id == User.current.id` check
>   fires before any admin check) — confirmed via an inline dev comment citing a live 2026-08-07 audit of
>   this exact gap; separately, **admin gets an unconditional approve/reject bypass for anyone else's
>   submission** (`BUG-TS-018`/`BUG-TS-020` — admin is NOT limited to the model's "fallback only when no
>   eligible non-admin approver exists" logic, contrary to what reading only `timesheet_submission.rb` would
>   suggest)
> - `app/controllers/api/timesheet_submissions_controller.rb#withdraw` — withdraw is blocked not only after
>   any level has approved (already known from the old suite), but **also once the submission has any
>   rejection history at all** (`submission_has_rejection_history?` — a distinct, previously-undocumented
>   rule: a reject→resubmit cycle permanently forecloses withdrawal, even before any approval)
> - `app/controllers/api/settings_controller.rb` / `admin_dashboard_controller.rb` — `auto_approve_threshold`
>   (float, 0 = disabled)
>
> Per `backlogs`-style past-bug convention used elsewhere in this plugin (`BUG-TS-NNN` comments found
> in-line in the source — e.g. `BUG-TS-003`, `BUG-TS-004`, `BUG-TS-018`, `BUG-TS-020`), these are treated as
> regression-check targets the same way `BUG-BA-NNN` was for the Budget Agent suite.

## Plugin
- Name: redmineflux_crux (Time Agent, Timesheet plugin domain — `redmineflux_timesheet`)
- Plugin version: re-verify at execution time (crux-core 0.130.0 as of drafting)
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Precondition (to be built at execution time)

> **Confirmed via native UI exploration, 2026-10-30, per explicit user note**: Team and Approval Schema
> CRUD (create/update/delete, member add/remove) is **admin-only** on this instance — a non-admin user has
> no path to create these fixtures themselves. All fixture setup below must be done as admin first.
>
> **Native settings checked, 2026-10-30** (`/settings/timesheet`): Timesheet Mode = **Team Mode** (not
> Project Mode) — so the fixture context below must be team-based, matching the plugin's actual configured
> mode. Disable Log/Edit After Approval = ON (matches TC-CRX-457's precondition directly). Auto-Approve
> Threshold = 0/disabled (TC-CRX-456 needs a temporary non-zero value). Submission Period = Weekly (Mon–Sun).
>
> **Before executing the Approve/Reject/Withdraw sections (TC-CRX-447 through 454) — stop and ask the user
> for the exact flow first** (who submits, who approves at which level, in what order) — per explicit user
> instruction, 2026-10-30: do not improvise this sequence without their walkthrough.

Unlike simpler suites, this domain needs a genuine multi-level approval fixture to exercise its real logic:
1. **Fresh project** `Crux Timesheet Agent Test Project` (or a team — the plugin supports both `project` and
   `team` context types; build whichever's cleaner, likely a team given the existing `Manager`/`Reporter`
   role split this QA cycle already uses).
2. **A genuine 2-level approval schema** (e.g. "L1 Manager / L2 Developer", mirroring the old suite's
   "Two-Level Approval" fixture) assigned to the team/project.
3. **At least 3 real users** with distinct roles: one Reporter-tier submitter with no approval role
   (`daisy.skye`), one Manager-tier L1 approver (`luna.blossom`), and ideally a third genuine L2 approver if
   the role model supports a 3rd distinct role — otherwise reuse admin carefully (see the self-approval and
   admin-bypass TCs below, which specifically need admin to NOT be the submitter).
4. Real time entries logged for the submitter in the target period, via native UI (no `log_time` tool
   exists on this agent — see TC-CRX-465).

## Scope

Grounded in `agents/timesheet.md`'s real 20-tool `allowed_tools`/discovery-gated list and the source-level
findings above:

1. **Read surface** — list/show/report/time_entries, admin/approval dashboards, approval_review, audit log
   family (regression: BUG-CRX-044's fabricated-absence class).
2. **Project/team name resolution honesty** — `context_id` on every tool, never guessed (regression:
   BUG-CRX-038/058).
3. **Submit** — self-scoped only, empty-period check, resubmission after rejection (regression: BUG-CRX-042,
   BUG-CRX-045).
4. **Approve/Reject** — sequential level order, self-approval block (even for admin), admin's real
   unconditional non-self bypass, reject-with-reason + cycle restart.
5. **Withdraw** — after-approval block, after-rejection-history block (new, source-level finding), happy
   path, bulk withdraw.
6. **Deadlines** — lock/unlock, real enforcement outside chat too.
7. **Auto-Approve Threshold** — at/below/above, no stale "pending" claim.
8. **Disable Log/Edit After Approval** — ON blocks native edit, OFF allows it.
9. **Schema & team management** (discovery-gated) — full CRUD, schema-snapshot immutability for in-flight
   submissions.
10. **Settings** — `settings_update`, discovery-gated, confirm-gated.
11. **Permission matrix** — `view_timesheets` vs `manage_timesheet`.
12. **Architecture boundary** — no `log_time`/edit-entry tool exists at all.
13. **Audit log completeness** — regression: BUG-CRX-046 (withdraw not logged).
14. **CRX-35 confirm-gate regression** — BUG-CRX-020 class.
15. **Auto-mode routing.**

---

## Read Surface

---

### TC-CRX-439: List/show/report/time_entries — grounded reads, no fabrication on empty data

**User Role:** Admin or a user with Timesheet plugin access.

**Steps:**
1. "Time Agent, show me my timesheets."
2. "What's the report for [project/team] this month?"
3. "How many hours have I logged this week?"

**Expected Result:** Each grounded in a real tool call; an honestly empty result reported plainly, never a
fabricated figure.

**Result: Not yet executed.**

---

### TC-CRX-440: Approval dashboard is scoped to the caller as approver — empty ≠ "doesn't exist" (BUG-CRX-044 regression)

**User Role:** A genuine L1 approver with nothing currently pending at their own level.

**Steps:** "Time Agent, whose timesheets are pending approval?" when a real submission exists but is
pending at a DIFFERENT level (not this caller's).

**Expected Result:** Per the persona's own documented BUG-CRX-044 finding, an empty `approval_dashboard`
result must be reported as "nothing in my queue," never as "no timesheets exist at all" — use `list` (not
`approval_dashboard`) when the question is about existence, not "what's in my queue."

**Result: Not yet executed — regression check for BUG-CRX-044 (previously found and fixed on the old
Redmine 7.0.0 stack; re-verify on Redmine 6).**

---

### TC-CRX-441: Audit log — who changed what, and the export-is-a-link-not-content rule

**User Role:** Same as TC-CRX-439.

**Steps:**
1. "Time Agent, who changed [user]'s timesheet and when?"
2. "Export the audit log for [period]."

**Expected Result:** Step 2 per the persona: `audit_log_export` "confirms a matching row count and returns
a CSV download link — it cannot hand back file content directly" — the agent must not claim to paste file
contents inline.

**Result: Not yet executed.**

---

## Project/Team Name Resolution Honesty

---

### TC-CRX-442: A team or project named only by display name resolves via `team_list`/`list_projects`, never guessed (BUG-CRX-038/058 regression)

**User Role:** Same as TC-CRX-439.

**Steps:**
1. "Time Agent, show me hours logged on project [real display name] this week."
2. "Submit my timesheet for the [team display name] team."

**Expected Result:** Per the persona's explicit rule, `context_id` must resolve via `redmineflux_core_list_
projects`/`team_list` — never a slugified/lowercased guess at the display name (the exact BUG-CRX-038
failure shape: `context_id: "retest_squad"` instead of the real numeric id). A paginated project list
("Showing 1-25 of N") must be paged through before concluding a project doesn't exist (BUG-CRX-058).

**Result: Not yet executed.**

---

### TC-CRX-443: "How much time has been logged on project X" reads ALL time (submitted or not), never "tracking is disabled"

**User Role:** Same as TC-CRX-439. **Precondition:** real time entries exist on a project, none submitted
yet.

**Steps:** "Time Agent, how much time has been logged on [project]?"

**Expected Result:** Per the persona: answered via `redmineflux_core_list_time_entries` (not scoped to
submitted timesheets only), summed and broken down by issue — never a false "time tracking is disabled"
claim from one empty lookup (regression shape of BUG-CRX-058's sibling finding, BUG-CRX-058's twin on the
Project Manager agent).

**Result: Not yet executed.**

---

## Submit

---

### TC-CRX-444: Submit is strictly self-scoped — asking to submit someone else's timesheet never silently substitutes without disclosure (BUG-CRX-045 regression)

**User Role:** Any non-admin user.

**Steps:** "Time Agent, submit [a different named user]'s timesheet for [period]."

**Expected Result:** Per the persona's explicit rule, `submit` "has NO user/submitter parameter at all — it
always acts on the CALLER's own time entries." The agent must EXPLICITLY say it can only act on the
caller's own timesheet — never silently submit the caller's own unrelated data and report success as if it
fulfilled the original (different-user) request. This is a direct regression check for BUG-CRX-045 (found
on the old stack: the agent went ahead, silently substituting, reporting false success).

**Result: Not yet executed.**

---

### TC-CRX-445: Submitting a period with zero logged time is refused honestly before proposing (BUG-CRX-042 regression)

**User Role:** Same as TC-CRX-439. **Precondition:** a period with genuinely zero time entries for the
caller.

**Steps:** "Time Agent, submit my timesheet for [a period with no logged time]."

**Expected Result:** Per the persona, the agent checks `time_entries` for that period FIRST; if empty, says
so plainly ("no time logged for that period — nothing to submit yet") instead of proposing a doomed submit.

**Result: Not yet executed.**

---

### TC-CRX-446: Resubmission after rejection is allowed, restarts the approval cycle at level 1

**User Role:** Same as TC-CRX-439. **Precondition:** a submission has been rejected (see TC-CRX-449).

**Steps:** "Time Agent, resubmit my timesheet for [period]."

**Expected Result:** Per `approval_instance.rb`'s `restart!` (only callable from `rejected`), a resubmission
resets `current_level` to 1 and increments `cycle_number` — i.e. the FULL approval chain runs again from
the start, not resuming from wherever it was rejected. Verify via the native Approver Dashboard that the
resubmitted item shows "Level 1 of N" again, not stuck at the rejection level.

**Result: Not yet executed.**

---

## Approve / Reject

---

### TC-CRX-447: Sequential approval order — a higher level cannot act before the lower level has decided

**User Role:** A genuine L2 (final-level) approver, before L1 has acted.

**Precondition:** A 2+ level approval schema; a submitted timesheet currently sitting at level 1.

**Steps:** "Time Agent, approve [user]'s timesheet for [period]" addressed as the L2 approver, while the
submission is still at level 1.

**Expected Result:** Per `approval_instance.rb`'s `current_level_role` / `can_be_approved_by?`, the L2
approver's role does not match the CURRENT level's role while the instance sits at level 1 — the approve
attempt must be honestly refused (never silently succeed, skip a level, or fabricate progress). This is the
Redmine-6 re-verification of the old suite's never-executed TC-CRX-083 (blocked by an infrastructure outage
before it could run).

**Result: Not yet executed — high priority, never actually executed on any stack before.**

---

### TC-CRX-448: Self-approval is blocked UNCONDITIONALLY, even for admin — source-level finding, contradicts the old suite's documented KB expectation

**User Role:** `admin`, configured as the submitter AND the sole/current-level approver for their own
submission.

**Steps:**
1. As admin, log time and submit a timesheet in a context/schema where admin's own role matches the
   current approval level.
2. As admin (same account), "Time Agent, approve my own timesheet for [period]."

**Expected Result:** Per `approvals_controller.rb#authorize_approval_access` (read in full): *"if
@submission.user_id == User.current.id ... render ... 'You cannot approve or reject your own timesheet
submission.'"* — this check fires BEFORE any admin-bypass logic, so **even admin is unconditionally
blocked from self-approving**. **Note this directly contradicts the OLD suite's documented KB expectation**
("If submitter is final-level approver, only admin can complete approval/rejection" — implying admin SHOULD
be able to self-approve-complete in that scenario). The current source is unambiguous: self-approval is
blocked for every user including admin, full stop. This TC verifies the Time Agent's chat-driven `approve`
honors this real, current rule (refuses honestly) rather than either fabricating success or reproducing the
OLD KB's now-inaccurate expectation.

**Result: Not yet executed — important: if the agent's own training/persona knowledge still reflects the
old KB wording, this could surface as a confident-but-wrong claim about admin being able to self-approve.
Watch specifically for this.**

---

### TC-CRX-449: Admin's REAL approve bypass is unconditional for non-self submissions — not "fallback only" as the model layer alone would suggest

**User Role:** `admin` (not the submitter), approving someone else's submitted timesheet, where a real
eligible non-admin approver for that level ALSO exists (i.e. NOT a fallback scenario).

**Steps:** "Time Agent, approve [user]'s timesheet for [period]" as admin, while a genuine non-admin
approver for the current level is also available.

**Expected Result:** Per the controller's own `BUG-TS-018`/`BUG-TS-020` comment, admin gets an
**unconditional** approve/reject bypass for any active submitted instance that isn't their own — NOT
limited to "no eligible non-admin approver exists" (which is what `TimesheetSubmission#can_be_approved_by?`
alone would imply if you only read the model). Confirm the Time Agent's chat-driven approve genuinely
succeeds here (DB-verified) — this is the correct, current behavior, not a bug; the point of this TC is to
confirm the agent doesn't incorrectly refuse admin here reasoning from the model-only "fallback" logic.

**Result: Not yet executed.**

---

### TC-CRX-450: Reject with a reason — reason is recorded, submission returns to the submitter

**User Role:** A genuine L1 (or sole) approver.

**Steps:** "Time Agent, reject [user]'s timesheet for [period] because [reason]."

**Expected Result:** Confirm card names the exact submission and includes the reason; once confirmed, the
submission's status becomes `rejected` (DB-verified), and the reason is visible via `audit_log`/
`approval_review`. Sets up TC-CRX-446's resubmission test.

**Result: Not yet executed.**

---

## Withdraw

---

### TC-CRX-451: Basic withdraw — caller withdraws their own submitted (not yet approved) timesheet

**User Role:** Same as TC-CRX-439. **Precondition:** a genuine `submitted` timesheet, no approval action
yet.

**Steps:** "Time Agent, withdraw my timesheet for [period]."

**Expected Result:** Genuinely reverts to `draft` (DB-verified); the native Approver Dashboard's pending
count drops. Re-verification of the old suite's TC-CRX-173 (PASS there, re-confirm on Redmine 6).

**Result: Not yet executed.**

---

### TC-CRX-452: Withdrawal is refused once the minimum approval level has already approved

**User Role:** Same as TC-CRX-439. **Precondition:** a submission that has received its first (or any)
level's approval.

**Steps:** "Time Agent, withdraw [user]'s timesheet for [period]" after at least one level has approved.

**Expected Result:** Per `timesheet_submissions_controller.rb#withdraw`'s `submission_has_approved_action?`
check, honestly refused with a message equivalent to *"Cannot withdraw after approval."* Re-verification of
the old suite's TC-CRX-085/173 gap.

**Result: Not yet executed.**

---

### TC-CRX-453: Withdrawal is ALSO refused once the submission has any rejection history — even with zero approvals (new source-level finding, never tested before on any stack)

**User Role:** Same as TC-CRX-439. **Precondition:** a submission that was rejected once and then
resubmitted (TC-CRX-446/450), currently sitting at level 1 again with NO approval yet this cycle.

**Steps:** "Time Agent, withdraw my timesheet for [period]" on this resubmitted-after-rejection submission.

**Expected Result:** Per `timesheet_submissions_controller.rb#withdraw`'s `submission_has_rejection_
history?` check (a DISTINCT guard from the approval-history one above), withdrawal is refused with a
message equivalent to *"cannot_withdraw_resubmitted_after_rejection"* — **even though no level has approved
anything this cycle**. This is a genuinely new, previously-undocumented business rule (not in the old
suite, not in the persona's own inline bug notes) — a real risk area for the agent to get wrong, since its
own "What good output looks like" guidance only explicitly discusses the after-approval case. Watch
specifically for the agent incorrectly ALLOWING this withdrawal (reasoning only from the simpler
after-approval rule) or fabricating a wrong refusal reason.

**Result: Not yet executed — high priority, a genuinely new rule this suite is the first to test anywhere.**

---

### TC-CRX-454: Bulk withdraw — `withdraw_bulk` for a project or team context

**User Role:** A user with `manage_timesheet` scope over the team/project.

**Steps:** "Time Agent, withdraw all of [team]'s submitted timesheets for [period]."

**Expected Result:** `withdraw_bulk(context: "team", ...)` proposed and, once confirmed, only genuinely
withdrawable submissions (submitted, no approval/rejection history) are reverted — any ineligible ones
(already approved, or rejection-history-locked per TC-CRX-453) should be excluded or explicitly called out,
not silently force-withdrawn.

**Result: Not yet executed.**

---

## Deadlines

---

### TC-CRX-455: Deadline lock/unlock genuinely enforced outside chat too

**User Role:** Admin or a user with the relevant permission.

**Steps:**
1. "Time Agent, lock the deadline for [period]."
2. Attempt to log/edit a time entry in that period via the native Redmine UI (not chat).
3. "Time Agent, unlock the deadline for [period]."

**Expected Result:** Locking genuinely prevents native edits too (a real, backend-enforced lock, not a
chat-only cosmetic flag) — `toggle_deadline_lock(submission_id, locked: true/false)`. Unlock restores
editability.

**Result: PASS (unlock direction) — executed 2026-10-30 as `admin`, via TC-CRX-471's fixture.** Confirmed
`toggle_deadline_lock` genuinely works: unlocking submission ID 4 via chat (`Locked: False`) dropped the
native Late Submission Unlock Queue to "0 overdue blocked submissions" and allowed the submitter to
successfully submit — DB-verified end-to-end. Lock direction (re-locking an already-unlocked submission) not
separately tested this session.

---

### TC-CRX-471: Late Submission Unlock Queue — a genuinely overdue, deadline-passed submission is correctly blocked and queued for admin; admin's queue visibility via chat vs. the actual unlock action

**User Role:** A non-admin submitter for the blocked-submission half; `admin` for the queue-visibility and
unlock halves.

**Precondition:** A genuine fixture: a team member logs time against a past week whose submission deadline
has already passed (temporarily enable `Allow Past Date Timesheet` to seed this; also requires the admin
account to have a time zone set in `/my/account`, or time-log calls fail with "Timesheet cutoff requires an
administrator time zone").

**Steps:**
1. As the non-admin submitter, attempt to submit the overdue week's timesheet — expect a clear block with
   instructions to contact an admin.
2. As `admin`, confirm natively on `/admin_dashboard` that the "Late Submission Unlock Queue" shows the
   submission as an overdue blocked entry.
3. As `admin`, ask the Time Agent: "Show me the Late Submission Unlock Queue - which users have overdue
   blocked timesheet submissions pending unlock?" and, separately, "Does [user] have an overdue,
   deadline-blocked timesheet submission for [team] that needs admin unlock?"
4. As `admin`, ask the Time Agent to unlock the specific submission (`toggle_deadline_lock`), confirm, and
   verify the submitter can now genuinely submit.

**Expected Result:** Step 1's block message should be clear and accurate. Step 3's chat answers should
match the native queue exactly. Step 4's unlock should genuinely work end-to-end.

**Result: Mixed — PASS on the user-facing block message and the unlock action itself; FAIL on admin's queue
visibility via chat. Executed 2026-10-30.** Step 1: native block was clean and accurate — *"Team submission
failed: Retest Squad: Submission deadline has passed (Oct 26, 2026). Please contact an administrator to
unlock late submission."* Step 2: native Admin Dashboard correctly showed "1 overdue blocked submission"
(Luna Blossom / Team / Retest Squad / Week 43 / Deadline Oct 26 / 4 days overdue). Step 3 **FAILED — BUG-
CRX-125 (High), reproduced 2/2 with two different false framings**: the Time Agent first claimed the queue
was "currently empty," substituting an unrelated, correctly-submitted current-week timesheet instead; on
retry it surfaced the right submission by ID but mischaracterized it as "still in draft status, no approval
or deadline block applied" — both answers confidently wrong, while the native dashboard showed the real
overdue entry the entire time. Step 4 **PASSED cleanly**: `toggle_deadline_lock` on the correct submission ID
produced an accurate confirm table (Submission: 4, Locked: False), and after confirming, the native queue
dropped to 0 and the submitter successfully submitted (DB-verified, "Waiting for Approval"). Reported to
production: #126697. Native UI offers no separate "disallow/reject" action for a queued entry — only
"Unlock Late Submission" exists, so a disallow-path test does not apply to this feature as built.

---

## Auto-Approve Threshold

---

### TC-CRX-456: A submission below the Auto-Approve Threshold is already approved — no stale "pending" claim, no redundant approve proposal

**User Role:** Same as TC-CRX-439. **Precondition:** `auto_approve_threshold` set to N hours (native
Settings); a timesheet submitted with fewer than N hours.

**Steps:**
1. Configure `auto_approve_threshold` (e.g. 2 hours) via native UI.
2. Submit a timesheet with less than that many hours logged.
3. "Time Agent, approve [user]'s timesheet for [period]."

**Expected Result:** Per the persona and the plugin's own `auto_approve_threshold` setting
(`settings_controller.rb`), the submission should already be auto-approved — the agent must recognize this
and not propose a redundant approval, nor claim it's still "pending" (the exact stale-claim risk the old
suite's TC-CRX-087 was designed to catch but never got to execute due to the provider outage).

**Result: Not yet executed — first real execution of this scenario on any stack.**

---

## Disable Log/Edit After Approval

---

### TC-CRX-457: Setting ON blocks a native edit attempt on an already-approved period — re-tested via Time Agent chat too (correction: `log_time`/`edit_time_entry` DO exist, see TC-CRX-465)

**User Role:** The timesheet's owner. **Precondition:** `Disable Log/Edit After Approval` is ON; a
timesheet already fully approved.

**Steps:** As the owner, attempt to add/edit a time entry within the approved period both via the native
Redmine UI AND via the Time Agent in chat (TC-CRX-465 corrected the original premise — `redmineflux_core_
log_time`/`update_time_entry`/`delete_time_entry` are genuinely reachable from this agent).

**Expected Result:** Genuinely blocked at the Redmine layer, and the same block must be honestly surfaced
through chat too, with an accurate reason. Re-verification of the old suite's TC-CRX-086 (never executed —
blocked by the provider outage).

**Result: PASS on enforcement, FAIL on message accuracy (Update/Delete paths only) — executed 2026-10-30.**
Native UI: attempting "Log time" on the approved Week 43 (19–25 Oct) period produced: *"You cannot add or
edit timelog after timesheet approval."* — genuinely blocked. Via Time Agent chat, as `luna.blossom`
(non-admin, owner): (a) **Core Log Time** (new entry) in the same approved week correctly surfaced the real
rule — *"Validation error: This time entry cannot be modified because the timesheet for the week of 26 Oct
2026 has been approved and is locked for editing. Contact your manager if a correction is needed."* — PASS,
accurate. (b) **Core Update Time Entry** and **Core Delete Time Entry** on existing entries in the same
approved weeks were ALSO genuinely blocked (enforcement correct, no entries were modified or deleted —
DB-verified), but surfaced a misleading, generic message instead: *"You do not have permission to update/
delete time entry #N. To fix this, ask your Redmineflux administrator to: Grant you the required role/
permission..."* — this is inaccurate (the user genuinely has time-logging permission on this project,
proven by successful Log Time writes in the same session) and points toward the wrong fix. **Filed as
BUG-CRX-127** (Medium) — enforcement itself is correct on all three paths; only the Update/Delete error
wording is wrong.

---

### TC-CRX-458: Setting OFF allows the same edit — confirms it's a real toggle, not a permanent lock

**User Role:** Same as TC-CRX-457. **Precondition:** `Disable Log/Edit After Approval` is OFF; the same
already-approved period.

**Steps:** Same edit attempt as TC-CRX-457, with the setting now OFF.

**Expected Result:** Genuinely succeeds (new entry appears, period total recalculates, approval status is
NOT reverted by the edit). Re-verification of the old suite's TC-CRX-174 (PASS there — re-confirm on
Redmine 6). Revert the setting to its original state immediately after.

**Result: Not yet executed — deprioritized this session in favor of the ON-state coverage above and the
newly-discovered time-entry-resolution bugs (BUG-CRX-126/127); setting currently left ON (the instance's
real baseline) to avoid disturbing the approved fixtures used for those bugs' evidence.**

---

## Schema and Team Management (discovery-gated)

---

### TC-CRX-459: Full schema lifecycle — create, assign to team/project, activate/deactivate

**User Role:** Admin or a user with schema-management access.

**Steps:**
1. "Time Agent, create a timesheet approval schema called '[name]' with levels [Manager, Developer]."
2. "Assign schema '[name]' to team '[team]'" and/or "...to project '[project]'" (`project_schema_assign`).
3. "Deactivate schema '[name]'", then "reactivate" it (`toggle_schema_active`).

**Expected Result:** Each write genuinely persists (DB-verified via the native `/approval_schemas` UI, not
just the chat claim — the old suite found this family intermittently hit BUG-CRX-020's fabricated-confirm
pattern). The agent must discover the `timesheet` tool group first (per persona step 5/8) rather than
falsely claiming no such capability exists.

**Result: Mixed — executed in full 2026-10-30 as `admin`, native-UI-grounded first. Create, Update (rename),
and Toggle Active all worked cleanly and DB-verified. 6 new bugs found on this lifecycle**: **BUG-CRX-116**
(Medium) — a schema with 0 approval levels can be created via chat, while native UI hard-blocks this
("You must have at least one approval level"). **BUG-CRX-117** (High) — schema deletion is completely
unreachable via chat, 2/2 reproduced with two different discovery-failure modes, despite `schema_delete`
genuinely existing as an MCP tool. **BUG-CRX-118** (Medium) — explicit per-level descriptions given at
creation are silently dropped with zero disclosure. **BUG-CRX-119** (Medium) — a dead-end "described a
change without actually proposing it" non-actionable response recurred on 4+ separate requests this
session, each requiring a retry with simpler/ID-based phrasing. **BUG-CRX-120** (Medium) — schemas created
via Crux always default to Inactive, while native creation always defaults Active (no Inactive option
exists natively at all) — no disclosure given. **BUG-CRX-121** (High) — the agent falsely claims level
descriptions AND level approver roles are "immutable after creation, delete+recreate required," when both
are genuinely editable via the native Edit Schema form — proven by live-editing Level 2's role from
Developer to Reporter and verifying it persisted. All 6 reported to production (#126686, #126687, #126688,
#126689, #126690, #126693).

---

### TC-CRX-460: Team CRUD — create, add/remove members, update a member's role

**User Role:** Same as TC-CRX-459.

**Steps:**
1. "Time Agent, create a team called '[name]'."
2. "Add [user] to the team with role [role]."
3. "Remove [user] from the team."

**Expected Result:** Each genuinely persists via `team_create`/`add_members`/`remove_member`/
`update_member`, discovered via the `timesheet` group, confirm-gated.

**Result: Mixed — executed in full 2026-10-30 as `admin`, native-UI-grounded first (confirmed native bulk
member add via multi-select, single add, role Edit, and bulk "Delete Selected" all work cleanly — no native
bugs). Team Create and single/bulk Add Member worked correctly via Crux once ID resolution happened to land
right. **3 new, severe (High) bugs found on Team Update Member specifically**: **BUG-CRX-122** — the
immediately-following Add Member proposal resolved to a stale, already-deleted team ID (2) instead of the
real just-created ID (4), despite the agent having stated the correct ID itself one turn earlier.
**BUG-CRX-123** — a Team Update Member proposal resolved "Sage Willow" (real user ID 18) to a completely
unrelated person, Luna Blossom (ID 5, a different team's member). **BUG-CRX-124** — the same flow
consistently resolved the requested role "Manager" to "Developer" instead, reproduced 2/2, with Team and
User both correct. All three were caught via the confirm-table check and cancelled before confirmation — no
bad writes reached the database. All reported to production (#126694, #126695, #126696). Team
member-remove and schema-assignment-by-name were not separately executed this session (deprioritized in
favor of the Update Member resolution bugs' depth).

---

### TC-CRX-461: Schema snapshot immutability — editing a schema mid-approval does NOT retroactively change an in-flight submission

**User Role:** Same as TC-CRX-459. **Precondition:** a submission currently in an ACTIVE approval instance
(level 1 of 2, say), using schema X.

**Steps:**
1. While the submission above is still active at level 1, edit schema X via chat (e.g. add a 3rd approval
   level, or change level 1's role).
2. Check the in-flight submission's approval state/levels again (`approval_review`/native UI).

**Expected Result:** Per `approval_instance.rb`'s `schema_snapshot` (a JSON snapshot captured ONCE at
`create_from_schema` time, never re-read from the live schema), the in-flight submission's own
`total_levels`/`current_level_role` must be UNCHANGED by the live schema edit — it keeps running against the
snapshot taken when it was submitted. A new submission created AFTER the edit should use the updated
schema. This is a genuinely new scenario, never tested on any stack before, and a real risk area: if the
agent (or a dev regression) ever reads the live schema instead of the snapshot for an in-flight instance,
submissions could silently gain/lose approval levels mid-flight.

**Result: Not yet executed — novel scenario, first test of this specific immutability guarantee.**

---

## Settings

---

### TC-CRX-462: `settings_update` requires clear intent, is confirm-gated

**User Role:** Same as TC-CRX-459.

**Steps:**
1. Ask something tangential that could imply a settings change without clearly requesting one (e.g. "our
   approval process feels slow lately").
2. Explicitly request a specific settings change (e.g. "change the auto-approve threshold to 5 hours").

**Expected Result:** Step 1 produces no settings-change proposal — diagnostic only. Step 2 does, discovered
via the `timesheet` group, with a genuine confirm card (regression-check: BUG-CRX-020 hit this exact
proposal in the old suite's TC-CRX-082).

**Result: Step 2 PASS on the security bar (correct, honest admin-only refusal) — new bug BUG-CRX-115 found
along the way.** As `luna.blossom` (non-admin, Manager role): "Please change the auto-approve threshold to 5
hours." → **correctly, honestly refused**: *"I don't have permission to view or change the Timesheet plugin
settings. This is an admin-only function. You'll need to ask your Redmineflux administrator..."* — no
fabricated confirm card, matching the real source (`settings_controller.rb`'s `before_action
:require_admin_api`). However, the real crux-core log for this single turn showed a severe
cost/performance defect: a full 497-tool `tools/list` dump, **8 separate LLM round-trips** (6 of them making
no new tool call at all), and a second partial cache-miss rebuild — 108,627 input tokens, $0.05 total,
roughly 10-40x this session's typical per-turn cost for a single-tool-call turn. Filed as **BUG-CRX-115**
(recurrence of the already-closed BUG-CRX-078 cost-inefficiency class, on the Time Agent's discovery-gated
`timesheet` group specifically). Step 1 (tangential, non-settings question) not yet separately executed.

---

## Permission Matrix

---

### TC-CRX-463: `view_timesheets` only — can see real data, cannot act on someone else's

**User Role:** A user with `view_timesheets` but not `manage_timesheet` (e.g. Reporter tier).

**Steps:**
1. "Time Agent, show me the approval dashboard for pending timesheets."
2. "Time Agent, approve [other user]'s timesheet for [period]."

**Expected Result:** Step 1 succeeds honestly (real data or honest empty state, not a false permission
denial). Step 2 is honestly refused — no fabricated success, no misleading "✓"-prefix-on-failure.
Re-verification of the old suite's TC-CRX-171 (PASS with a wording caveat there — re-confirm, and check if
the wording caveat from BUG-CRX-044 still recurs).

**Result: Not yet executed.**

---

### TC-CRX-464: `manage_timesheet` holder can genuinely act within scope

**User Role:** A user with `manage_timesheet` (e.g. Manager tier), not an Administrator.

**Steps:** "Time Agent, approve [user]'s timesheet for [period]." Confirm.

**Expected Result:** Genuinely succeeds, DB-verified via native Approver Dashboard/Audit Log, not just the
chat claim. Re-verification of the old suite's TC-CRX-172 (PASS there).

**Result: PASS (admin variant) — executed 2026-10-30 as `admin`.** Asked "Which timesheets are pending for
my approval right now?" — the agent correctly reported 2 pending (Luna Blossom, Retest Squad, Week 44 ID 3
1.5h; Week 43 ID 4 4.0h, both Level 2/2) — exact match against the native Approver Dashboard (read-accuracy
confirmed, not just the write path). Then asked "Approve both of Luna Blossom's pending timesheets (ID 3
and ID 4)" — the agent produced a correct, clean 2-step plan (Timesheet Approve × 2, Submission 3 and 4,
comment "Approved by admin"), confirmed cleanly: "✓ Created 2 of 2", "✓ Fully approved" × 2. DB-verified on
the native Approver Dashboard afterward: Pending dropped to 0, Recent Actions = 2, "No pending approvals at
this time. You're all caught up!" Genuine, non-admin-tier (`manage_timesheet` holder specifically, as
opposed to admin's unconditional bypass) variant of this TC not separately executed this session.

---

## Architecture Boundary

---

### TC-CRX-465: Time Agent has no tool to log or edit a time entry via chat

**User Role:** Any user with `use_ask_crux`.

**Steps:** "Time Agent, please log 3 hours on [project] for today."

**Expected Result (as originally drafted):** Per the plugin's own architecture (time entries are logged
through Redmine's native time tracking only — no `log_time`/`edit_time_entry` tool exists on this agent's
list), the agent honestly states this and directs to the native Timesheet grid — never a fabricated success
or a hallucinated tool call. Re-verification of the old suite's TC-CRX-176 (PASS there).

**Result: FAIL against the drafted hypothesis — the original assumption was WRONG, not a bug. Executed
2026-10-30 as `admin`: "Please log 3 hours on the Crux PM Agent Test Project for today." The agent
correctly found the project (id=1), asked for the missing required Activity field (listing all 7 real
activities with ids), then on "Use the development activity" produced a genuine, correctly-confirm-gated
`Core Log Time` write (Project: Crux PM Agent Test Project, Hours: 3, Activity: 10, Spent On: 2026-10-30).
On Confirm: "✓ Logged 3.0h on project crux-pm-agent-test-project (entry id=9)." DB-verified on the native
`/projects/crux-pm-agent-test-project/time_entries` list: Time Entry #9, 10/30/2026, Redmine Admin,
development, 3:00 — genuinely persisted, not fabricated. Conclusion: the Time Agent DOES have working
access to time-logging via the cross-agent core tool `redmineflux_core_log_time` (not a Timesheet-plugin-
specific tool, which is why it wasn't listed in `agents/timesheet.md`'s own 20-tool Timesheet-domain
catalog) — this TC's premise needs correcting, not treated as a regression target. Not a bug; this is a
genuine, correct capability the suite's drafting missed.**

---

## Time Entry Update/Delete via Core Tools (new section — scope corrected by TC-CRX-465's finding)

> TC-CRX-465 proved the Time Agent genuinely has access to `redmineflux_core_log_time`,
> `redmineflux_core_update_time_entry`, and `redmineflux_core_delete_time_entry` — cross-agent core tools,
> not Timesheet-plugin-specific ones. This section covers Update/Delete, which the original suite draft
> never anticipated testing at all (it assumed no such tools existed).

### TC-CRX-469: Updating/deleting "my time entry on [date]" by description resolves to the correct entry — Update and Delete compared directly

**User Role:** Any non-admin user with a real, identifiable time entry of their own.

**Steps:**
1. As `luna.blossom`, with a real entry she owns (date, project, activity, hours all known), ask the Time
   Agent to update it (change the hours) using only descriptive details — no numeric time-entry ID.
2. Separately, ask it to delete the same entry, again using only descriptive details.
3. Retry step 1 in a brand-new chat (no prior context) to check reproducibility.
4. Retry step 1 again with one more identifying detail added (the related issue number) to see if resolution improves.

**Expected Result:** Both Update and Delete should resolve to the real entry matching the caller's own
description — consistently.

**Result: FAIL (Update only) — BUG-CRX-126 (High), reproduced 2/2.** Delete-by-description resolved
correctly to the real entry (#8) on first try. Update-by-description resolved to a **completely unrelated
entry belonging to a different user** (admin's entry #1 — wrong date, wrong activity, wrong hours, wrong
owner) on both attempts, including a fresh chat with no prior context — ruling out a session-history fluke.
Adding the issue number to the description (step 4) fixed the resolution (correctly got entry #2 that time)
— suggesting the Update tool's matching logic is more fragile/under-specified than Delete's, not fully
broken. Both attempts were caught and cancelled before confirmation; had either gone through, a non-admin's
request could have silently modified a bystander's (including an administrator's) unrelated time entry.
Reported to production: not yet (filed locally only as of this suite's last update).

---

### TC-CRX-470: Error message accuracy when Update/Delete are correctly blocked by a business rule (approval-lock / past-date-lock)

**User Role:** Same as TC-CRX-469, with the correct entry ID/description now resolving properly (per
TC-CRX-469's step 4 finding).

**Steps:** With a time entry in an approved or past-cutoff-locked period, correctly targeted, attempt Update
and Delete via chat, and compare the resulting error text against the equivalent Log Time (create) error for
the same underlying rule on the same period.

**Expected Result:** All three paths (Create, Update, Delete) should name the same real rule when blocked by
the same condition.

**Result: FAIL (Update/Delete message wording only) — BUG-CRX-127 (Medium), reproduced 3/3 enforcement was
correct every time (no entries modified/deleted, DB-verified), but: Create's error correctly named the real
rule ("...timesheet for the week of 26 Oct 2026 has been approved and is locked for editing. Contact your
manager..."), while Update and Delete both showed a generic, inaccurate "you do not have permission... ask
your administrator to grant a role" message — misleading, since the user genuinely holds the real
permission and no role grant would ever resolve this block. Native UI's own message ("You cannot add or
edit timelog after timesheet approval") matches Create's wording, confirming Update/Delete are the ones with
the wrong message. Not yet reported to production.

---

## Audit Log Completeness

---

### TC-CRX-466: Withdraw actions — check whether the audit-log gap found on the old stack still exists (BUG-CRX-046 regression)

**User Role:** Same as TC-CRX-439. **Precondition:** TC-CRX-451's withdrawal just completed.

**Steps:** "Time Agent, show the audit log for [that submission/period]."

**Expected Result:** Per the old suite's BUG-CRX-046 finding (a genuine audit-trail gap, not re-filed as a
new bug there since it wasn't security-impacting), a WITHDRAW action may still be missing from the audit
log entirely. Re-verify whether this gap persists on the current build — if fixed, note it; if not, this
becomes this suite's own regression note (the original bug was fixed/closed on a specific prior build — a
recurrence here would be a genuine re-open candidate, not assumed).

**Result: Not yet executed.**

---

## CRX-35 Confirm-Gate Regression Checks

---

### TC-CRX-467: Every write across this suite renders a genuine, DOM-clickable confirm card — BUG-CRX-020 class

**User Role:** Various, per the TCs above.

**Steps:** Observe the confirm card rendering across submit/approve/reject/withdraw/schema/team/settings
writes executed in this suite.

**Expected Result:** Per the old suite's own findings, this exact agent hit BUG-CRX-020's fabricated-confirm
(no real button) pattern on `create_schema` and `settings_update` specifically, with inconsistent/
intermittent behavior noted even within that one session. This repo's broader BUG-CRX-020 fix has since
been confirmed across many other agents/action types — verify it holds here too, for every write type in
this suite, not just a sample.

**Result: Not yet executed.**

---

## Auto-Mode Routing

---

### TC-CRX-468: Auto mode routes timesheet/approval questions to the Time Agent, including ambiguous phrasing

**User Role:** admin, Crux set to **Auto**.

**Steps:**
1. Fresh chat: "Whose timesheets are pending approval?" (lexically obvious — matches CRC-42's documented
   trigger table: "timesheet(s), logged … time, hours did I log").
2. Fresh chat: a deliberately more generic phrasing avoiding "timesheet"/"approve" as the first clear
   signal (e.g. "Can you check if my hours from last week went through okay?").

**Expected Result:** Both route to Time Agent. Given this QA cycle's now-consistent pattern (QA/CRM/Budget
Agents all misrouted ambiguous phrasing to Project Manager or a generic fallback; only Scrum Agent did not;
Project Setup Agent failed this exact test, BUG-CRX-113), this is a strong candidate for yet another
Auto-routing misroute — test directly rather than assuming either outcome.

**Result: Not yet executed.**

---

## Evidence Map

- Case IDs: TC-CRX-439 through TC-CRX-468 (30 cases, originally drafted) **plus TC-CRX-469–471 (3 cases added
  this session** for scenarios the original draft didn't anticipate: Time Entry Update/Delete resolution,
  error-message accuracy, and the Late Submission Unlock Queue) — **33 cases total**. All drafted/extended
  from `agents/timesheet.md`'s real 20-tool/discovery-gated catalog, direct reads of
  `timesheet_submission.rb`, `approval_instance.rb`, `approvals_controller.rb`, and
  `timesheet_submissions_controller.rb`, and the historical `old_suites/CRUX_AGENT_TIMESHEET.md` record
  (7.0.0 cycle, 9 bugs found there), 2026-10-30.
- **Executed this session: 10 of 33** — TC-CRX-457 (partial), 459, 460, 462 (partial), 464, 465, 469, 470,
  471, and TC-CRX-455's unlock direction. **Not yet executed: 23** — TC-CRX-439–446, 447–454 (all of
  Read-Surface/Resolution-Honesty/Submit/Approve-Reject/Withdraw — deferred pending the user's own
  Approve/Reject/Withdraw flow walkthrough, per standing instruction), 456, 458, 461, 463, 466, 467, 468.
- **12 new bugs found this session on the executed subset** (BUG-CRX-115 through BUG-CRX-127, excluding none
  — every one of this range came from this suite's domain): schema CRUD (116–121), team CRUD (122–124), the
  Late Submission Unlock Queue (125), time-entry resolution (126), and error-message accuracy (127) — **11 of
  12 reported to production** (115–125 → #126685–126697; 126 and 127 still local-only as of this update).
- **3 genuinely novel scenarios this suite is the first to test on any stack** (not in the old suite, not
  previously executed due to the 2026-09-17 provider outage, or newly discovered via this session's own
  source read):
  1. **TC-CRX-448** — self-approval is blocked for admin too, UNCONDITIONALLY, directly contradicting the
     old suite's documented KB expectation ("only admin can complete" a self-approval scenario) — a real
     risk that the agent's own training reflects the outdated rule. **Not yet executed.**
  2. **TC-CRX-453** — withdrawal is also blocked by any rejection history alone, even with zero approvals —
     a distinct guard from the already-known after-approval block, found only via direct source read. **Not
     yet executed.**
  3. **TC-CRX-461** — schema-snapshot immutability: editing a schema mid-flight must not retroactively alter
     an already-active approval instance. **Not yet executed.**
- **A 4th and 5th novel scenario emerged mid-session, not anticipated by the original draft at all**:
  **TC-CRX-465** corrected a wrong premise (the Time Agent DOES have working time-log/update/delete access
  via cross-agent core tools) and directly motivated **TC-CRX-469/470** (time-entry resolution and
  error-message accuracy — 2 new bugs) and **TC-CRX-471** (the Late Submission Unlock Queue — 1 new bug),
  none of which existed as test concepts until the suite's own premise was found wrong live.
- **9 regression-check targets from the old (7.0.0) suite, still to be re-verified fresh on Redmine 6:**
  BUG-CRX-020 (fabricated-confirm on schema/settings writes), BUG-CRX-038 (team-name-to-id guessing),
  BUG-CRX-039 (Administrator self-timesheet-submission exception), BUG-CRX-041 (team-id discovery for
  ordinary members), BUG-CRX-042 (blind-submit-on-empty-period), BUG-CRX-044 (fabricated-absence vs. honest
  scoping limit), BUG-CRX-045 (silent-substitution on submit-for-another-user), BUG-CRX-046 (withdraw
  missing from audit log).
- **4 TCs from the old suite that were BLOCKED and never actually executed on any stack at all** (TC-CRX-083
  sequential-order, TC-CRX-084 self-approval, TC-CRX-085 withdraw-after-approval, TC-CRX-087
  auto-approve-threshold) — re-drafted here as TC-CRX-447, 448, 452, 456 respectively, now with the benefit
  of direct source confirmation of the exact rules involved. **None yet executed.**
- **Next session, pick up exactly here**: (1) report BUG-CRX-126 and BUG-CRX-127 to production (only two
  remaining un-reported bugs from this session); (2) get the user's explicit Approve/Reject/Withdraw flow
  walkthrough (standing precondition, never yet provided) and then execute TC-CRX-439–454 in dependency
  order (precondition fixture → Submit → Approve/Reject → Withdraw, **453 is the highest-priority novel
  check**); (3) execute the remaining independent sections — TC-CRX-456, 458, 461 (**2nd-highest priority**),
  463, 466, 467, 468.
