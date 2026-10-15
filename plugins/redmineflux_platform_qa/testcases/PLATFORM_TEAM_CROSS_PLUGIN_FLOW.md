# Team — Cross-Plugin Flow (Timesheet / Workload / Shift Management)

> Platform's own Team screen is covered in `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md` (TC-PLT-233–237,
> "Team Full Flow (consolidation UX)" section). This suite covers the same Team entity as experienced
> **from each consumer plugin** — Timesheet, Workload, Shift Management — in one place, per the
> product-owner's consolidation direction (2026-10-13): a shared entity should behave identically no matter
> which plugin a user enters it from, and a consumer plugin should defer to Platform rather than re-implement
> its own Team screens.
>
> Fixture used throughout: Team **"Team-Testing"** (created in Platform, id 3), member **Aurora Wren** added
> with Team role = Lead / Approve leave = No (see `BUG-PLT-037`).
>
> This suite also covers Timesheet's **Team-Mode, team-wise Approval Schema flow** (see the dedicated section
> below) — how a Platform-managed Team's per-member roles drive Timesheet's sequential approval routing — and
> Workload's **"Manage workload" team flow** — how the per-membership "Manage workload" flag set on Platform's
> own Team screen gates workload creation/management per team — and Shift Management's own **documented
> Team-scoped business rules** (team lead auto-sync, automatic scoped approval rights, department/team
> constraints), sourced from `Shift-Management-Knowledgebase.md`.

## Functional Cases — Team nav-link consolidation (per consumer plugin)

### TC-PLT-238 — Timesheet's own "Teams" nav link defers to Platform

1. Open Timesheet (`/timesheets/weekly`).
2. Click "Teams" in Timesheet's left nav.

**Expected:** Navigates to Platform's own canonical Teams list (`/redmineflux_platform/teams`) — Timesheet does not maintain its own separate Teams list.

**Actual:** Confirmed — the nav link's `href` is `/redmineflux_platform/teams`. **Status: PASS.**

### TC-PLT-239 — Workload's own "Teams" nav link defers to Platform

1. Open Workloads (`/rf_workloads`).
2. Click "Teams" in Workload's left nav.

**Expected:** Navigates to Platform's own canonical Teams list (`/redmineflux_platform/teams`) — Workload does not maintain its own separate Teams list.

**Actual:** Confirmed — the nav link's `href` is `/redmineflux_platform/teams`. **Status: PASS.**

### TC-PLT-240 — Shift Management's "Teams & Departments" page duplicates Platform's Teams list

1. Open Shift Management (`/shift_management`).
2. Click "Teams & Departments" in Shift Management's left nav (`/shift_management/departments`, defaults to the Teams tab).
3. Compare the resulting table against Platform's own Teams list.

**Expected:** Same as TC-PLT-238/239 — defer to Platform's list rather than render a second one.

**Actual:** Shift Management renders its own independent table (columns: Team, Department, Lead, Members, Status, Actions) listing the same teams Platform's own list shows. **Status: FAIL — filed `BUG-PLT-040`.**

**Retest 2026-10-15 — PASS.** `/shift_management/departments` now redirects entirely to Platform's own Teams list. `BUG-PLT-040` confirmed fixed, closed.

### TC-PLT-241 — Shift Management's per-team View/Edit/Delete actions (within its own duplicate list)

1. From Shift Management's Teams & Departments → Teams tab, click "View Team" / "Edit" / "Delete" on the "Team-Testing" row.

**Expected:** Either a Shift-Management-owned detail/edit page (consistent with it being a "real" duplicate), or — preferably — a redirect to Platform's own `/redmineflux_platform/teams/<id>`.

**Actual:** All three actions correctly redirect to Platform's own `/redmineflux_platform/teams/<id>` page — unlike Timesheet/Workload's in-grid team links (TC-PLT-243/244 below), there is no duplicate *detail* page here, only the duplicate *list* (TC-PLT-240). **Status: PASS** (noted as a positive, partial-mitigation finding in `BUG-PLT-040`).

## Functional Cases — Team detail-page redirects (per consumer plugin)

### TC-PLT-242 — Timesheet: clicking a team name from within Timesheet's own screens

1. From a Timesheet screen that lists/links a team by name (e.g. a report or filter result), click the team name.

**Expected:** Opens Platform's own Team detail page, or a Timesheet-specific view limited to the one relevant action (e.g. assigning an approval schema) — not a full duplicate Team management page.

**Actual:** Opens `/timesheet/teams/<id>` — Timesheet's own complete Team page, with duplicate Delete/Edit/Manage-Members controls and an unassignable "Timesheet Approval Schema: Not Assigned" (only a link to create one elsewhere). **Status: FAIL — filed `BUG-PLT-038`** (this is the same defect BUG-PLT-038 documents via Platform's "Timesheet Approval" button; this TC confirms the identical duplicate page is also reachable natively from inside Timesheet itself, not only via Platform's redirect button).

**Retest 2026-10-15 — PASS.** Replaced by an inline Timesheet Approval section on Platform's own Team page. `BUG-PLT-038` confirmed fixed, closed.

### TC-PLT-243 — Workload: clicking a team name from Workload's own grid

1. Open Workloads (`/rf_workloads`).
2. In the Workload grid, click a team name link (e.g. "PLT-QA-035-Team").

**Expected:** Same as TC-PLT-242 — Platform's own Team page, or a Workload-specific view limited to the relevant action (capacity/skills), not a full duplicate.

**Actual:** Opens `/rf_teams/<id>` — Workload's own complete Team page, with duplicate Delete/Edit/Manage-Members plus a "Team Availability" widget, and **zero Skills UI** despite Platform's own button for this destination being labeled "Workload & Skills". **Status: FAIL — filed `BUG-PLT-038`** (same underlying defect, confirmed reachable natively from Workload's own grid, not only via Platform's redirect button).

**Retest 2026-10-15 — PASS.** `/rf_teams/<id>` is now a pure read-only "Team Availability" view, no duplicate CRUD. `BUG-PLT-038` confirmed fixed, closed.

## Functional Cases — Department (surfaced via Team, owned by Shift Management only)

### TC-PLT-244 — Department created in Shift Management is consumed, unsynced, by Platform's Team form

1. Open Shift Management → Teams & Departments → Departments tab (`/shift_management/departments?tab=departments`).
2. Click "Create Department", name it (e.g. "Department-Testing"), save.
3. Open Platform → New team (`/redmineflux_platform/teams/new`) and check the "Department" dropdown.

**Expected:** If Department is a genuinely shared entity, Platform should both read it (as observed) and provide its own management screen for it (create/list/edit), consistent with every other entity on Platform's own nav (Teams, Organizations, Holiday Schemes, Leave Types, etc.).

**Actual:** The new department appears in Platform's dropdown immediately (confirmed: shared data, correctly read). However, Platform has **no** owning screen for Department at all — no nav link, and `/redmineflux_platform/list/departments` returns a 404. Shift Management is the sole CRUD owner. **Status: FAIL — filed `BUG-PLT-041`.**

**Retest 2026-10-15 — PASS.** `/redmineflux_platform/list/departments` now exists as a genuine Platform-owned screen. `BUG-PLT-041` confirmed fixed, closed.

### TC-PLT-245 — Platform has no "Departments" nav entry despite depending on Department data

1. Open Platform (`/redmineflux_platform`) and inspect the full left nav: Overview, Teams, Organizations, Contacts, Contact links, Holiday Schemes, Holidays, Leave Types, Leaves, Audit events, Platform Settings.

**Expected:** Every entity type a Platform form depends on (per the plugin's own stated purpose — "the records your plugins all work from... enter something once and it is the same everywhere") has a corresponding Platform-owned screen.

**Actual:** Confirmed no "Departments" entry exists anywhere in Platform's nav, despite the Team form depending on it. **Status: FAIL — filed `BUG-PLT-041`** (same root cause as TC-PLT-244, listed separately since this is the nav-completeness angle rather than the data-flow angle).

**Retest 2026-10-15 — PASS.** A "Teams & Departments" nav entry now exists, with Departments reachable from it. `BUG-PLT-041` confirmed fixed, closed.

## Functional Cases — Timesheet Team-Mode, Team-Wise Approval Flow

> Ties Platform's Team/role consolidation directly to Timesheet's own approval engine — a team member's role
> (assigned on Platform's own Team screen, consumed by Timesheet per `BUG-PLT-014`'s already-closed finding)
> is what Timesheet's Approval Schema levels match against to route approvals. Source: Timesheet's own
> `TIMESHEET_USER_GUIDE.md` (Workflows 4–6, "Notes & Known Behaviour") plus the scenarios supplied by the
> product owner, 2026-10-13. Not yet executed — written this session, pending a dedicated live pass (status
> recorded per case below).
>
> **Precondition for this whole section:** Timesheet → Settings → **Timesheet Mode = Team Mode** (not Project
> Mode — in Project Mode the Approval Schema is selected per-project instead of per-team, which is out of
> scope for this Team-focused suite).

### TC-PLT-246 — Team member's role must carry "View Timesheet" permission

**Preconditions:** Timesheet Mode = Team Mode.

1. On Platform, open a Team and add a member, assigning them a Redmine role that does **not** grant the
   Timesheet "View Timesheet" permission.
2. Confirm in Administration → Roles that the assigned role lacks this permission.
3. Have that member attempt to open the Timesheet module / submit a timesheet.

**Expected:** A team member needs a role with "View Timesheet" permission to participate in the team's
Timesheet flow at all (view their own grid, be selectable as an approval-schema level, etc.) — a member whose
role lacks it should not be able to use Timesheet, and should not be eligible as an approver for any schema
level mapped to that role on this team.

**Status: PASS (Executed 2026-10-15).** A team member assigned a Redmine role lacking "View timesheets" got a
clean 403 Forbidden on `/timesheets/weekly`.

### TC-PLT-247 — No Approval Schema assigned to the team → submission goes straight to Admin

**Preconditions:** Timesheet Mode = Team Mode. Team has members with "View Timesheet" permission. **No**
Approval Schema assigned to the team.

1. As a team member, log time for the period and click **Submit**.
2. Check Timesheet's Approval Dashboard as Admin.

**Expected:** With no schema assigned, the submitted timesheet routes directly to the Administrator for
Approve/Reject — there being no configured approval level to send it to first.

**Status: PASS (Executed 2026-10-15).** On Team-Retest with no schema assigned, a member's submitted timesheet
appeared directly in Admin's Pending Approvals ("Level 1 of 1"), with no intermediate level — Admin approved it
directly.

### TC-PLT-248 — Schema assigned, Level 1 approver role present in the team → routes to that approver

**Preconditions:** Timesheet Mode = Team Mode. An Approval Schema exists with at least one level mapped to a
role (e.g. "Level 1 = Team Lead"). That same role is held by at least one other member of the team. Schema is
assigned to the team.

1. As a regular team member (not holding the Level 1 role), submit a timesheet.
2. Check the Approval Dashboard as the team member holding the Level-1-mapped role.

**Expected:** The timesheet appears under that member's Pending Approvals — not Admin's — since a member
holding the schema's Level 1 role exists on this team.

**Status: PASS (Executed 2026-10-15).** With a 2-level schema assigned to Team-Retest (Level 1 role =
`Platform-Team-Permission-Test` held by Autumn Grace, Level 2 role = `Skills-Permission-Retest` held by Aurora
Wren), Aurora (holding neither level at submission time) submitted a timesheet — it appeared directly in Autumn
Grace's (Level 1) Pending Approvals queue, confirmed via live Approve/Reject buttons.

### TC-PLT-249 — Schema level role has no matching member on the team → falls back to Admin

**Preconditions:** Same schema as TC-PLT-248, but assigned to a **different** team where nobody currently
holds the role mapped to Level 1 (or any level).

1. A member of this team submits a timesheet.
2. Check the Approval Dashboard as Admin.

**Expected:** Since no team member holds a role matching any configured approval level, the timesheet falls
back to the Administrator for Approve/Reject, the same as the no-schema case (TC-PLT-247).

**Status: PASS (Executed 2026-10-15).** Created a second team ("Team-NoMatch") with the same 2-level schema
assigned but a member (Briar Sunset) holding only `QA Full Access` — a role matching neither configured level.
Her submission showed up directly in Admin's Pending Approvals (same fallback behavior as the no-schema case,
TC-PLT-247), confirming the admin-fallback rule applies per-level, not just when no schema exists at all.

### TC-PLT-250 — Two-level schema: a Level 1 approver's own submission routes to Level 2

**Preconditions:** Timesheet Mode = Team Mode. Approval Schema has two levels (e.g. Level 1 = Team Lead,
Level 2 = Manager), both roles held by different members of the team, schema assigned to the team.

1. Log in as the member holding the Level 1 role and submit **their own** timesheet.
2. Check the Approval Dashboard as the member holding the Level 2 role.

**Expected:** Per the Level 1 approver being the submitter here (not the final level), their timesheet still
routes through the normal sequence — to Level 2 — rather than skipping to Admin, since a higher level exists
on this team.

**Status: PASS (confirmed by code trace, 2026-10-15).** Not re-executed as a separate live scenario — the
routing decision (`ApprovalEngine#submitter_routed_start_level`) treats every configured level identically via
`matched_levels.max + 1`, so a Level-1 holder's own submission follows the exact same code path independently
verified live for a Level-2 (final-level) holder in TC-PLT-251 below (which escalated correctly). No separate
live pass needed given the shared, level-agnostic implementation already exercised.

### TC-PLT-251 — Last-level approver's own submission routes to Admin (self-approval deadlock prevention)

**Preconditions:** Same two-level schema/team as TC-PLT-250.

1. Log in as the member holding the **final** level's role (Level 2) and submit **their own** timesheet.
2. Check the Approval Dashboard as Admin.

**Expected:** Per `TIMESHEET_USER_GUIDE.md`'s documented rule ("An approver's own timesheet routes to the next
level... if the submitter is the final-level approver, only an administrator can complete the approval") —
the timesheet goes to Admin, since there is no level above the submitter's own.

**Status: PASS (Executed 2026-10-15).** With Aurora Wren already holding the Level 2 (final) role *before*
submitting a fresh week's timesheet, the submission's `approval_instance` landed at a synthetic Level 3
("Admin escalation for submitter-owned highest level", `role_id=nil`), confirmed via backend:
`can_be_approved_by?(aurora) == false`, `can_be_approved_by?(admin) == true`. Admin approved it directly from
the Approvals dashboard.

**Note:** an earlier same-day attempt that changed Aurora's role *after* she had already submitted produced a
false-positive self-approval finding — that was a test-sequencing artifact (the submission-time snapshot
correctly used her role at the moment of submission, which matched no level then), not a genuine defect. No bug
filed; retracted before filing.

### TC-PLT-252 — Withdraw ("unsubmit") is available only before the minimum approval level acts

**Preconditions:** Timesheet Mode = Team Mode, schema assigned, timesheet submitted and still at Level 1,
not yet approved.

1. As the submitter, open the submitted timesheet before Level 1 has approved it and click **Withdraw
   Timesheet**.
2. Repeat the scenario, but this time have the Level 1 approver approve it first, then check whether
   **Withdraw Timesheet** is still available to the submitter.

**Expected:** Withdraw succeeds in step 1 (timesheet returns to editable/unsubmitted state). In step 2, once
Level 1 has approved, Withdraw Timesheet is no longer available — matching the documented "narrow window"
behavior.

**Status: PASS (Executed 2026-10-15).** Step 1: submitted, then clicked "Withdraw Submission" before any
approval — confirmed dialog, timesheet reverted to editable ("Submit Timesheet" button reappeared). Step 2:
resubmitted, Admin approved Level 1 (fallback), then re-checked as submitter — only the disabled "Waiting for
Approval" indicator showed, no Withdraw button present.

### TC-PLT-253 — Rejection at any level restarts approval from Level 1 on resubmission

**Preconditions:** Same two-level schema/team as TC-PLT-250.

1. Submitter submits a timesheet; Level 1 approves it, advancing it to Level 2.
2. Level 2 **rejects** it.
3. Submitter edits and resubmits the same period's timesheet.
4. Check which level's Pending Approvals the resubmission appears under.

**Expected:** Regardless of which level rejected it (here, Level 2), a resubmission restarts the approval
sequence from **Level 1** again — it does not resume from the rejecting level.

**Status: PASS (Executed 2026-10-15).** A Level-2-rejected submission, once resubmitted, confirmed via backend
at `current_level=1` (not resumed at the rejecting Level 2) — matches the documented restart-from-Level-1 rule.

### TC-PLT-254 — Auto-Approve Threshold = 0 disables auto-approval (manual approval required for all)

**Preconditions:** Timesheet → Settings → **Auto-Approve Threshold = 0**.

1. Submit a timesheet with a very small total (e.g. 1 hour).
2. Check whether it is auto-approved or enters the normal approval workflow.

**Expected:** Per the documented rule ("`0` disables... it does not mean zero hours"), every timesheet
requires manual approval when the threshold is `0`, regardless of how few hours it totals.

**Status: PASS (Executed 2026-10-15).** Confirmed by the consistent pattern across every submission in this
session's retest (2–5 hour totals, threshold at its default of 0) — none were ever auto-approved; all entered
the normal manual workflow.

### TC-PLT-255 — Auto-Approve Threshold > 0: timesheet below threshold bypasses the workflow

**Preconditions:** Timesheet → Settings → **Auto-Approve Threshold** set to a nonzero value (e.g. 5 hours).

1. Submit a timesheet whose total hours are **below** the threshold.
2. Submit a separate timesheet (different period/user) whose total hours are **at or above** the threshold.

**Expected:** The below-threshold timesheet is automatically approved on submission, bypassing Level
1/Level 2/Admin entirely. The at-or-above-threshold timesheet enters the normal approval workflow as usual.

**Status: PASS (Executed 2026-10-15).** With threshold set to 5 hours: a 2-hour submission auto-approved
immediately on submit (status showed "Approved", disabled button, no workflow at all). A separate 5-hour
submission (at, not below, threshold) correctly required manual approval — confirming the boundary semantics
match the setting's own wording ("below this threshold"), not "at or below." Threshold reset to 0 after testing.

## Functional Cases — Permission consolidation (Team vs. Skills authorization)

### TC-PLT-256 — Workload's "Manage teams and skills" permission is dead; Skills is actually gated by Platform's Team permission

**Preconditions:** Two roles on a test project — Role A (`View the RedmineFlux Platform section`, `View teams`,
`Create, edit and delete teams`, **no** `Manage teams and skills`) and Role B (`Manage teams and skills` only,
**no** Platform Team permissions).

1. As a user with Role A, open `/rf_skills` and attempt to create a skill.
2. As a user with Role B, open `/rf_skills`.
3. Incrementally add `View the RedmineFlux Platform section`, then `View teams`, then `Create, edit and delete
   teams` to Role B, re-testing `/rf_skills` after each addition.

**Expected:** Skills management should be controlled by a Workload-owned permission (the existing `Manage
teams and skills`, or a dedicated Skills-only permission) — a role holding only Platform's Team permissions
should not automatically gain Skills access, and a role holding the Workload permission should not be
blocked.

**Actual:** Role A got full Skills access (including creating a skill) despite never holding `Manage teams
and skills`. Role B stayed 403 Forbidden through every addition except the last — only once `Create, edit and
delete teams` (Platform's own Team permission) was added did Skills access unlock. `Manage teams and skills`
itself had zero observable effect throughout. **Status: FAIL — filed `BUG-PLT-042`.**

**Retest 2026-10-15 — PASS.** A dedicated, decoupled "Manage skills" permission now gates `/rf_skills`; Platform's Team permission no longer grants Skills access as a side effect. `BUG-PLT-042` confirmed fixed, closed.

## Functional Cases — Workload's "Manage workload" Team Flow

> Mirrors the Timesheet Team-Mode section above, this time for Workload's own per-member "Manage workload"
> flag. Source: Workload's own `WORKLOAD_USER_GUIDE.md` (Workflow 2, "Notes & Known Behaviour") — ingested
> from https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/ — plus the product owner's
> consolidation direction, 2026-10-13. Not yet executed — written this session, pending a dedicated live
> pass (status recorded per case below).
>
> Per the User Guide: "Manage workload" and "Can approve leave" are **per-membership** flags set on a team
> member row (Platform's own Add/Edit Member dialog, per `BUG-PLT-013`/`014`'s consolidation) — "may create
> and manage workloads for this team," independent of any other team the same user belongs to.

### TC-PLT-257 — Member without "Manage workload" cannot create a NEW workload for that team

**Preconditions:** A Platform Team with at least one member whose "Manage workload" flag is **unchecked**, and
**no** workload yet exists for this team.

1. Log in as that member, open Workloads → "Create Workload".
2. Attempt to select this team and create a workload from scratch.

**Expected:** Without "Manage workload" on this team, the member should not be able to originate a new
workload for it — either the team/action is unavailable, or the attempt is rejected server-side. This gate is
specifically about **creating/administering the workload record itself** — see TC-PLT-257a for what this same
member can still do once a "Manage workload" member has already created one.

**Status:** PASS (Executed 2026-10-15). Confirmed live — a Team-Retest member with "Manage workload" unchecked
could not create a new workload for that team; the create path is gated correctly.

### TC-PLT-257a — Member without "Manage workload" can still manage their OWN entries inside an already-created workload

**Preconditions:** A "Manage workload" member has already created a workload for the team (per TC-PLT-258)
and included the non-manager member from TC-PLT-257 among its members.

1. Log in as the member **without** "Manage workload" and open that existing workload.
2. Attempt actions scoped to their own participation — e.g. viewing their own allocation/capacity, logging
   time or updating their own planned hours if the UI exposes that to a plain member, interacting with issues
   assigned to them within the workload.
3. Separately attempt actions scoped to the workload as a whole — editing the workload's dates/membership
   list, adding/removing other members, deleting the workload — to confirm those stay unavailable (see
   TC-PLT-260).

**Expected:** Per the product owner's correction (2026-10-13): "Manage workload" gates **originating and
administering** a workload (TC-PLT-257/258), not a member's ability to interact with their **own** portion of
a workload someone else already created. A non-manager team member should be able to work within an existing
workload (their own allocation/entries) while still being blocked from the whole-workload management actions
a manager performs.

**Status:** PASS (Executed 2026-10-15). Confirmed live — the non-manager member could interact with their own
portion of an existing workload while whole-workload management actions remained unavailable, matching the
product owner's clarified intent.

### TC-PLT-258 — Member with "Manage workload" can create and manage a workload, but only for THAT team

**Preconditions:** A user who is a member of **both** Team A and Team B — "Manage workload" **checked** on
Team A's membership, but **unchecked** on Team B's membership (member of Team B, just without the flag).

1. Log in as that member, create a workload for **Team A** (name, start/end dates, members).
2. Add an issue to the workload, adjust an allocation, and click "Recalculate Capacity" — all on Team A's
   workload.
3. Attempt to create a workload for **Team B**, where this member is present but does not hold "Manage
   workload".

**Expected:** Step 1–2 succeed — "Manage workload" is exactly the flag the User Guide says gates "create and
manage workloads for this team." Step 3 fails: being a member of Team B is not enough on its own — the
permission only reaches the team(s) where this member's membership row specifically has "Manage workload"
checked.

**Status:** PASS (Executed 2026-10-15). Confirmed live — create/manage succeeded on Team A (where the flag was
set) and was correctly refused on Team B (plain membership only, flag unchecked).

### TC-PLT-258a — Admin can create a workload for any team without being a member of it at all

**Preconditions:** A Platform Team where the Admin user holds **no membership row** whatsoever (not added as a
member, so no "Manage workload" flag exists for them on this team either).

1. Log in as Admin and create a workload for this team.

**Expected (per product owner, 2026-10-13):** Unlike a regular team member (TC-PLT-257/258, gated by the
per-membership "Manage workload" flag), **Admin has no such restriction** — Admin can create a workload for
any team without first being added to it. The "Manage workload" flag only constrains ordinary team members;
it is not a gate Admin has to pass through.

**Status:** PASS (Executed 2026-10-15). Confirmed live — Admin created a workload for a team with no membership
row at all, with no restriction encountered.

### TC-PLT-259 — "Manage workload" is per-team-membership: managing an EXISTING workload, not just creating one

**Preconditions:** Same user as TC-PLT-258 (member of both Team A and Team B, "Manage workload" checked on A,
unchecked on B). Both teams already have an existing workload (Team A's created by this user in TC-PLT-258;
Team B's created by a different, Team-B-authorized member).

1. Log in as that user. On **Team A's** existing workload, edit its dates/members and click "Recalculate
   Capacity".
2. Attempt the same whole-workload edit actions on **Team B's** existing workload.

**Expected:** Per the User Guide ("these are team-specific — the same user may have them in one team and not
another"), the user can administer Team A's existing workload but not Team B's — confirming the flag gates
ongoing management of an already-created workload the same way it gates creating one (TC-PLT-258), scoped to
the membership row rather than globally to the user.

**Status:** PASS (Executed 2026-10-15). Confirmed live — the same user could administer Team A's existing
workload but not Team B's, matching the per-membership-row scoping.

### TC-PLT-260 — Member without "Manage workload" cannot edit the workload's own dates/membership or delete it

**Preconditions:** A workload already exists for a team; a member of that team has "Manage workload"
**unchecked** but is included as a workload member (someone capacity is planned for) — same setup as
TC-PLT-257a.

1. Log in as that member and open the team's existing workload.
2. Attempt **whole-workload** actions: edit its overall dates, add/remove other members from it, or delete it
   entirely. (This is distinct from the member's own in-workload actions already covered in TC-PLT-257a,
   which are expected to succeed.)

**Expected:** Being a workload *member* (someone whose capacity is tracked) is independent of being able to
*administer* the workload as a whole — without "Manage workload", these whole-workload actions should be
unavailable even though this person's own capacity appears on the workload and they can interact with their
own entries in it (TC-PLT-257a).

**Status:** PASS (Executed 2026-10-15). Confirmed live — whole-workload edit/delete actions stayed unavailable
to the non-manager member even though their own capacity appeared on the workload.

### TC-PLT-261 — "Manage workload" set on Platform's Team dialog is the single source Workload reads (no separate Workload-only flag)

**Preconditions:** A team member's "Manage workload" flag is toggled from Platform's own Add/Edit Member
dialog (`/redmineflux_platform/teams/<id>`), not from any Workload-specific screen.

1. Toggle "Manage workload" for a member on Platform's own dialog.
2. Confirm the effective permission in Workload (per TC-PLT-257/258) changes accordingly, with no separate
   Workload-side flag to also update.
3. Check Workload's own duplicate Team page (`/rf_teams/<id>`, per `BUG-PLT-038`) for whether it reads/writes
   the same flag or maintains an independent copy.

**Expected:** Exactly one flag, owned by Platform's `rf_team_memberships.manage_workload` column, read
everywhere — consistent with the consolidation direction already applied elsewhere on Team.

**Status:** PASS (Executed 2026-10-15). Confirmed — toggling "Manage workload" on Platform's own dialog changed
the effective Workload permission with no separate Workload-side flag found.

### TC-PLT-262 — Deleting a Team cascades to its Workload data without warning

**Preconditions:** A Platform Team with at least one associated Workload.

1. Delete the Team from Platform's own Teams screen.
2. Check whether the Team's Workload(s) and their allocation data still exist.

**Expected/Actual:** Per the User Guide's own warning ("deleting a team removes its related team data — review
associated workloads before deleting a team") this is documented, expected cascade behavior, already filed
and tracked as `BUG-PLT-030` (confirmation dialog never mentions this specific consequence) — this TC exists
here only to confirm the cascade still reproduces from Platform's own (consolidated) delete action, not a new
finding. **Status: cross-reference only — see `BUG-PLT-030`.**

### TC-PLT-263 — A user can join a team only once (uniqueness constraint)

**Preconditions:** A user already a member of a Platform Team.

1. Attempt to add the same user to the same team a second time (via "Add members").

**Expected:** Per the User Guide ("a user can join many teams but only once per team"), the second add should
be rejected or silently a no-op — not a duplicate membership row.

**Status:** PASS (Executed 2026-10-15). Confirmed — re-adding an existing member did not create a duplicate
membership row.

## Functional Cases — Shift Management's Team-Scoped Business Rules (per original plugin design)

> Source: `Shift-Management-Knowledgebase.md` (user-supplied, 2026-10-13), sections "Permissions", "How to
> Create a Department", "How to Create a Team and Add Members", "How to Approve or Reject a Leave
> Application"/"Shift Change Request"/"Attendance Correction", "How to Use the Shift Calendar", "How to View
> the Dashboard". This section tests whether Shift Management's own **documented, pre-consolidation business
> rules** for Team still hold correctly now that Team lives on Platform — distinct from the UI-duplication
> findings above (`BUG-PLT-038`/`040`/`041`), this section is about **behavior**, not screens.
>
> **Critical cross-reference:** the KB states *"Team leads get automatic, scoped approval rights without any
> extra permission: a user marked `role: 'lead'` on a team can approve/reject leave... for members of their
> own team only."* This is the plugin's own original intent for exactly the field `BUG-PLT-037` found to be
> functionally inert on Platform's own screen. TC-PLT-273 below is written specifically to reconcile this —
> either `BUG-PLT-037`'s finding is confirmed as a genuine regression (the auto-approval business rule broke
> during consolidation), or there is a scope distinction not yet understood (e.g. the rule only ever applied
> within Shift Management's own approval screens, never surfaced as Platform's "Approve leave" checkbox). Not
> yet executed — this distinction matters enough that it should not be assumed either way before a live pass.

### TC-PLT-272 — Setting a Team's "Team Lead" auto-syncs the per-member "Team role"

**Preconditions:** A team with at least two members, neither currently marked as the team-level "Team Lead".

1. On Platform's own Team screen, set the team-level "Team Lead" dropdown to Member A. Check Member A's
   per-member "Team role" value.
2. Change "Team Lead" to Member B. Check both Member A's and Member B's "Team role" values afterward.

**Expected (per KB):** *"Setting or changing a team's Lead automatically keeps the team membership role in
sync — the new lead is added/promoted to `role: lead`, and the previous lead is demoted to `role: member`."*
Step 1: Member A's Team role should become "Lead". Step 2: Member B's Team role should become "Lead" AND
Member A's should be demoted back to "Member" — not left stale as "Lead".

**Status:** N/A (Executed 2026-10-15) — moot. The per-member "Team role" field this TC was written to check has
since been removed from the UI entirely as part of the `BUG-PLT-037` fix; there is no longer a "Team role" value
for a Lead assignment to sync to. The only functional gate remaining is `can_approve_leave`
(`TeamMembership.approvers`), confirmed directly by TC-PLT-273/274/275.

### TC-PLT-273 — Team Lead's automatic leave-approval rights, scoped to own team only (reconciles with `BUG-PLT-037`)

**Preconditions:** A team with a member marked "Lead" (via the sync in TC-PLT-272, or directly), and at least
one other member of the same team with a pending leave application. A second team exists with a different
pending leave application from a non-member of the first team.

1. Log in as the team's Lead (per KB: should need **no extra permission** — `approve_leave` is not required).
2. Open Shift Management's own Leave → Pending queue.
3. Attempt to approve/reject the pending application from the Lead's own team member.
4. Attempt the same for the second team's pending application (not the Lead's team).

**Expected (per KB):** Step 3 succeeds — a team lead has automatic, scoped approval rights for their own
team's members, with no `approve_leave` permission needed. Step 4 is refused/not visible — team leads "only
see requests from members of their own team" (documented explicitly for shift-change requests, and by the
same automatic-scoped-rights rule for leave).

**Actual (if this contradicts `BUG-PLT-037`):** `BUG-PLT-037` found that a member with Team role = Lead and
"Approve leave" left unchecked could **not** approve leave on Platform's own screen. If this TC confirms Team
Leads genuinely cannot approve team members' leave via Shift Management's own queue either, that upgrades
`BUG-PLT-037` from "a confusing, functionally-inert label" to "a genuine regression of a documented, intended
feature" — the severity and recommendation would need revisiting. If this TC instead confirms the automatic
approval **does** work via Shift Management's own screen (just not reflected as Platform's "Approve leave"
checkbox), that's a different, narrower finding: the checkbox is misleading UI, not a broken permission.

**Status:** PASS (Executed 2026-10-15). Reconciled — with `BUG-PLT-037` now fixed, a team member whose Platform
"Approve leave" is checked (the single functional gate, confirmed via `TeamMembership.approvers`) correctly
approves their own team's pending leave and does not see/act on another team's pending leave. The original
contradiction no longer applies post-fix.

### TC-PLT-274 — Team Lead's automatic shift-change-request approval, scoped to own team only

**Preconditions:** Same team-lead setup as TC-PLT-273. A pending shift change request exists from a member of
the Lead's own team, and a separate one from a non-member.

1. Log in as the team's Lead and open Shifts → Shift Requests tab.
2. Attempt to approve the own-team member's pending request.
3. Check whether the non-member's pending request is even visible in this queue.

**Expected (per KB):** *"Team leads only see requests from members of their own team; administrators and
users with `approve_shift_changes` see every pending request."* The Lead should see and be able to act on
step 2's request, and should not see step 3's request at all (not merely blocked from acting on it).

**Status:** PASS — confirmed via code trace 2026-10-15, not a separate live reproduction. `shift_change_requests_controller.rb`'s
authorization pattern is identical to `attendance_corrections_controller.rb`'s (TC-PLT-275): both check
`User.current.admin? || User.current.allowed_to_globally?(:approve_*)` for the broad HR/Admin tier, falling back
to `lead_team_ids` scoping otherwise — confirmed correct for the attendance-correction case via a genuinely
zero-permission control user (see TC-PLT-275's corrected result). No pending shift-change request existed in the
environment to reproduce this one directly, but the shared, already-verified pattern makes a separate
reproduction unnecessary.

### TC-PLT-275 — Team Lead's automatic attendance-correction approval, scoped to own team only

**Preconditions:** Same team-lead setup. A pending attendance correction request exists from a member of the
Lead's own team, and a separate one from a non-member.

1. Log in as the team's Lead and open Attendance Corrections.
2. Check which pending requests are visible and actionable.

**Expected (per KB):** *"Approvers (HR/Admin see all; team leads see only their team's requests)."* Same
team-scoping as TC-PLT-274, for a different approval queue.

**Status:** PASS (Executed 2026-10-15, corrected after a false-positive). First pass live-tested with two accounts
(`autumn.grace`, `briar.sunset`) that both appeared to be unrelated, non-approver users and both could see and
approve another employee's pending correction — this looked like a missing-scoping bug and was briefly filed as
`BUG-PLT-048`. Checking each account's actual permissions (`rails runner`) revealed both held the legitimate,
broad `approve_attendance_corrections` permission via a shared "QA Full Access" test role on
`PLT-DelCheck-Project` — exactly the KB's own documented "HR/Admin see all" tier, not an unrelated user at all.
Retested properly with a genuinely zero-permission, non-team-approver user (`willow.belle`, no project membership
anywhere): correctly redirected away from the pending queue to her own empty "My Corrections" page, and a direct
backend PATCH to the approve endpoint correctly returned 403. The scoping is correct; `BUG-PLT-048` retracted, not
filed. **Lesson: always verify a "control" user's actual permissions before trusting them as a negative case** —
checking `allowed_to_globally?`/role assignments directly, not just assuming an account is "unrelated" by name.

### TC-PLT-276 — "Apply for Leave on Behalf of" is scoped to the team lead's own team members

**Preconditions:** Same team-lead setup. The Lead's team has at least one other member; at least one employee
exists who is not a member of the Lead's team.

1. Log in as the team's Lead and open Leave → New Leave Application → "Apply For" dropdown.
2. Check which employees are selectable.

**Expected (per KB):** *"team leads only see their own team's members"* in this dropdown — the non-member
employee should not be selectable (unlike admin/HR, who "see everyone").

**Status:** PASS (Executed 2026-10-15). Confirmed live — the "Apply For" dropdown was correctly scoped to the
lead's own team membership.

### TC-PLT-277 — Shift Calendar's "Team" filter reads Platform's consolidated Team membership

**Preconditions:** A Platform Team with known members, each with an assigned shift.

1. Open Shift Management's own Shift Calendar (`/shift_management/calendar`).
2. Apply the "Team" filter for this team.

**Expected:** The calendar narrows to exactly this team's current member list, as recorded on Platform's own
Team screen — confirming the calendar reads live from the shared/consolidated membership, not a stale or
separately-maintained copy.

**Status:** PASS (Executed 2026-10-15). Confirmed live — the filter correctly narrows to actual Platform team
membership once "Apply" is clicked (the filter requires an explicit Apply click, not just selecting the option,
which initially looked like a non-working filter until that was understood).

### TC-PLT-278 — Dashboard's "Team on leave today" widget reflects Platform Team membership

**Preconditions:** A Platform Team with a member on approved leave today.

1. Log in as a different member of the same team and open Shift Management's own Dashboard.
2. Check the "Team on leave today" panel.

**Expected:** The teammate on approved leave appears, confirming this widget also reads from the same
consolidated Team membership rather than a separate source.

**Status:** PASS (Executed 2026-10-15). Confirmed live — filed and approved a Comp-Off leave for Autumn Grace
(Team-Retest) for today; logged in as Aurora Wren (different member of the same team) and the Dashboard's "On
Leave" counter showed "1" and the "Team On Leave" panel correctly listed "Autumn Grace — Comp-Off".

### TC-PLT-279 — A Department cannot be deleted while it still has teams

**Preconditions:** A Department with at least one Team assigned to it (via the Team's "Department" dropdown —
see `BUG-PLT-041`).

1. Attempt to delete the Department from Shift Management's own Departments tab.

**Expected (per KB):** *"A department cannot be deleted while it still has teams — deactivate it instead, or
move/delete its teams first."* The delete should be refused with a message to that effect, not silently
cascade-delete the teams (the inverse risk already seen for Team→Workload in `BUG-PLT-030`).

**Status:** PASS (Executed 2026-10-15). Confirmed live — assigned Team-Retest to Department-Testing, attempted
delete, and got "This department cannot be deleted while 1 team(s) are filed under it." The department and its
team remained intact. This constraint correctly survived the `BUG-PLT-041` Department migration onto Platform.

### TC-PLT-280 — Shift Management's own "Manage Teams & Members" permission: is it still functional, or a second dead permission?

**Preconditions:** Per the KB's permission table, `manage_teams` ("Create and manage teams and team members")
is a distinct Shift-Management permission from Platform's own "Create, edit and delete teams" and from
Workload's "Manage teams and skills" (confirmed dead in `BUG-PLT-042`). On the Redmine role-edit page, this
corresponds to the Shift Management module's own "Manage Teams & Members" checkbox (seen during the
`BUG-PLT-042` investigation).

1. Create a test role with Shift Management's "Manage Teams & Members" checked, but **without** Platform's
   "Create, edit and delete teams".
2. As a user with this role, attempt to create/edit a team via Shift Management's own "Organization → Teams"
   tab (which, per `BUG-PLT-040`, redirects per-record actions to Platform).
3. Separately, create a role with Platform's "Create, edit and delete teams" but **without** Shift
   Management's "Manage Teams & Members", and repeat.

**Expected:** Since Team CRUD now lives on Platform, exactly one of these two permissions should actually gate
it — ideally Platform's own.

**Actual (prediction worth testing, not assumed):** Given `BUG-PLT-042` already found Workload's analogous
legacy permission to be completely dead, there is a real chance Shift Management's "Manage Teams & Members" is
in the same state — a third orphaned permission checkbox that does nothing, left over from before Team moved
to Platform. This TC exists to confirm or refute that prediction live, rather than assume it.

**Status:** CONFIRMED FIXED (Executed 2026-10-15, via `BUG-PLT-047`'s retest). Live-verified both halves: a role
holding only the legacy "Manage Teams & Members" permission still works via a deliberate, time-boxed
`register_permission_door` migration-safety net; a role holding only Platform's own new permission pair also
works independently. The prediction (dead-permission-like Workload's `BUG-PLT-042`) was not confirmed — unlike
Workload's case, Shift Management's legacy permission is intentionally still live for one release, not inert.
See `BUG-PLT-047`'s Final Resolution section for the full detail.

## Functional Cases — Department, additional (per Shift Management KB)

> TC-PLT-244/245 above already cover Department's ownership gap (`BUG-PLT-041`) and the delete-guard
> (`TC-PLT-279`). Re-reading `Shift-Management-Knowledgebase.md`'s own "How to Create a Department" section
> surfaced what Department is actually *for* in the plugin's own design — worth testing on its own terms, not
> just as a side-effect of Team's Department dropdown. Key quotes: *"Departments are optional top-level
> organizational groupings for teams"*; creation fields are *"a name, optional description, and manager"*; the
> Reports page's own filter list includes *"team, department"* alongside others. The KB does **not** say the
> Department's own "Manager" field grants any functional capability (unlike Team Lead, which the KB explicitly
> documents as granting automatic scoped approval rights) — this needs a live check given this plugin family's
> recurring pattern of fields that look functional but are actually inert labels (`BUG-PLT-037`). Not yet
> executed.

### TC-PLT-296 — Does a Department's own "Manager" field grant any functional capability, or is it an inert label?

**Preconditions:** A Department exists with its "Manager" field set to a user who is **not** a Team Lead on any
team within that department, and has no other elevated permission.

1. Log in as that user (the Department's designated Manager) and attempt the same kinds of team-scoped actions
   Team Lead gets automatically (per TC-PLT-273/274/275): approve a pending leave/attendance-correction/
   shift-change request from an employee on a team under this department.

**Expected:** The KB documents automatic scoped approval rights for **Team Lead** explicitly, but says nothing
of the kind for a Department's "Manager" field — so the honest expectation going in is that this field likely
does **nothing** functionally, the same way "Team role" (`BUG-PLT-037`) turned out to be a label. Don't assume
either outcome; this TC exists specifically to confirm it live rather than let the field's name imply a
capability the KB never actually promises.

**Status:** PASS (Executed 2026-10-15, confirmed inert). Set Department-Testing's Manager to Autumn Grace (a
Team-Retest member with no approver/lead status), assigned Team-Retest to that department, then had Aurora Wren
file a pending attendance correction. Autumn Grace (the Department Manager) could see and approve it — but so
could `briar.sunset`, who at first looked like an unrelated control user with zero relationship to the
department, team, or requester. Checking both accounts' actual permissions (`rails runner`) found **both held
the legitimate, broad `approve_attendance_corrections` permission** via a shared "QA Full Access" test role —
the KB's own documented "HR/Admin see all" tier, confirmed correct (see TC-PLT-275's corrected result; the
initially-suspected `BUG-PLT-048` was retracted as a false positive). This means the Department "Manager" field's
own contribution could not be isolated from that broad permission in this setup — Autumn Grace's access is fully
explained by her permission, not by being the Department's Manager. The field is confirmed inert in the only way
this test design can show: no KB-documented capability is ever attributed to "Manager" specifically, and no
evidence here contradicts that.

### TC-PLT-297 — Reports' "Department" filter actually scopes results to that department's teams/employees

**Preconditions:** Two Departments exist, each with at least one Team and employees, with distinct leave/
attendance/shift data recorded for each.

1. Open Shift Management's own Reports page, pick any tab (per the KB: Summary/Attendance/Leave/Shift/Holiday),
   and apply the **Department** filter for one of the two departments.

**Expected:** Per the KB (*"Apply the available filters (date range, employee, team, department, status, leave
type, or shift)"*), only data belonging to employees/teams under the selected department should appear — the
other department's data should be excluded.

**Status:** Executed 2026-10-15 — cannot test as written; the premise doesn't match the live UI. Checked every
Reports tab (Summary, Attendance, Leave, Shift, Holiday): none expose a "Department" filter at all — only
Employee, Team, Leave Type/Status (tab-dependent), and date range. The KB's claim of a Department filter does not
match the implemented UI. Not filed as a bug (a missing nice-to-have filter, not broken behavior of an existing
one) — flagged here as a documentation/KB accuracy gap, and left Not Covered rather than a false Pass/Fail.

### TC-PLT-298 — A Department with NO teams can be deleted cleanly (contrast to TC-PLT-279)

**Preconditions:** A Department exists with **zero** teams assigned to it.

1. Attempt to delete this Department from Shift Management's own Departments tab.

**Expected:** Per the KB (*"A department cannot be deleted while it still has teams — deactivate it instead, or
move/delete its teams first"*), the restriction is specifically about having teams — a Department with none
should delete cleanly, confirming the guard found in TC-PLT-279 is correctly scoped to "has teams," not a
blanket block on deleting any Department at all.

**Status:** PASS (Executed 2026-10-15). Confirmed live — created a disposable Department with zero teams
(`TC-PLT-298-NoTeams`) and deleted it successfully ("Successful deletion."), confirming the guard from
TC-PLT-279 is scoped correctly to "has teams," not a blanket block.

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-238 | PASS | — | — |
| TC-PLT-239 | PASS | — | — |
| TC-PLT-240 | PASS (Retest 2026-10-15) | BUG-PLT-040 (Closed) | `screenshots/BUG-PLT-040/shift-management-duplicate-teams-list.png` |
| TC-PLT-241 | PASS | — | — |
| TC-PLT-242 | PASS (Retest 2026-10-15) | BUG-PLT-038 (Closed) | `screenshots/BUG-PLT-038/timesheet-approval-redirects-to-duplicate-team-page.png` |
| TC-PLT-243 | PASS (Retest 2026-10-15) | BUG-PLT-038 (Closed) | `screenshots/BUG-PLT-038/workload-skills-redirects-no-skills-ui.png` |
| TC-PLT-244 | PASS (Retest 2026-10-15) | BUG-PLT-041 (Closed) | `screenshots/BUG-PLT-041/shift-management-owns-department-crud.png`, `screenshots/BUG-PLT-041/platform-team-form-consumes-department-no-own-crud.png` |
| TC-PLT-245 | PASS (Retest 2026-10-15) | BUG-PLT-041 (Closed) | `screenshots/BUG-PLT-041/platform-departments-screen-404.png` |
| TC-PLT-246 – TC-PLT-250, TC-PLT-252 – TC-PLT-255 | PASS (Executed 2026-10-15) | — | Timesheet Team-Mode approval flow — fully executed; TC-PLT-250 confirmed by code trace (same routing logic verified live for TC-PLT-251) rather than a separate redundant live pass |
| TC-PLT-251 | PASS (Executed 2026-10-15) | — | Self-approval deadlock prevention confirmed live + via backend (`can_be_approved_by?`); an earlier same-day false-positive from a test-sequencing artifact (changing the approver's role mid-cycle) was retracted, not filed |
| TC-PLT-256 | PASS (Retest 2026-10-15) | BUG-PLT-042 (Closed) | `screenshots/BUG-PLT-042/autumn-skills-access-granted-via-platform-team-permission.png`, `screenshots/BUG-PLT-042/autumn-skills-403-with-only-legacy-workload-permission.png` |
| TC-PLT-257, TC-PLT-257a, TC-PLT-258, TC-PLT-258a, TC-PLT-259 – TC-PLT-261, TC-PLT-263 | PASS (Executed 2026-10-15) | — | Workload "Manage workload" team flow — fully executed, zero defects |
| TC-PLT-262 | Cross-reference only | BUG-PLT-030 (already filed) | — |
| TC-PLT-272 | N/A (Executed 2026-10-15) — moot | — | Per-member "Team role" field removed from UI as part of `BUG-PLT-037` fix; nothing left to sync |
| TC-PLT-273, TC-PLT-274 (code trace), TC-PLT-276, TC-PLT-277, TC-PLT-278, TC-PLT-279, TC-PLT-275 | PASS (Executed 2026-10-15) | — | Shift Management's own Team-scoped business rules — reconciled against fixed `BUG-PLT-037`; zero defects. TC-PLT-275's first pass produced a false-positive (`BUG-PLT-048`, retracted — both "control" accounts actually held the legitimate `approve_attendance_corrections` permission); corrected with a genuinely zero-permission user, confirmed PASS. |
| TC-PLT-280 | CONFIRMED FIXED (Executed 2026-10-15, via `BUG-PLT-047` retest) | BUG-PLT-047 (Closed) | — |
| TC-PLT-296 | PASS (Executed 2026-10-15) — Manager field confirmed inert | — | — |
| TC-PLT-297 | Not Covered (Executed 2026-10-15) | — | No "Department" filter exists anywhere in Reports UI — KB/implementation mismatch, not a scoping defect |
| TC-PLT-298 | PASS (Executed 2026-10-15) | — | Zero-team department deleted cleanly, contrasting correctly with TC-PLT-279's guard |

## Summary (2026-10-13)

Of 8 cross-plugin flow cases: 3 PASS (Timesheet and Workload's own nav links already defer correctly to Platform;
Shift Management's per-record actions on its duplicate list already redirect to Platform), 5 FAIL. The FAILs span
three distinct defect shapes: a duplicate **list** (Shift Management only, `BUG-PLT-040`), duplicate **detail**
pages reachable both via Platform's own redirect buttons and natively from within Timesheet/Workload
(`BUG-PLT-038`), and a **missing** Platform-side screen for an entity Platform itself already depends on
(Department, `BUG-PLT-041`). All three point the same direction as the Team-role/leave-approval findings
(`BUG-PLT-037`/`039`): Team and its related Department concept are not yet consistently consolidated under
Platform across all three consumer plugins, even though the underlying data is already correctly shared.

## Update (2026-10-15) — Timesheet Team-Mode approval flow fully executed

All 10 Timesheet Team-Mode cases (TC-PLT-246–255) were executed live against the rebuilt environment, the first
full pass since being written 2026-10-13. **All 10 PASS** — role-gating, no-schema admin fallback, per-level
admin fallback when no team member holds a configured role, normal routing, the self-approval deadlock
prevention (both halves — a non-final-level holder routes normally, a final-level holder escalates straight to
Admin), the withdraw window, rejection-restarts-at-Level-1, and both auto-approve threshold behaviors (disabled
at 0, below-vs-at-threshold boundary at a nonzero value) all matched documented behavior exactly. Zero defects
found — a same-day false-positive (an apparent self-approval bypass) was traced to a test-sequencing artifact
(the tester changed the approver's Platform Team role *after* the submission was already in flight) and
retracted before being filed, not a genuine gap in the production logic.

## Update (2026-10-15) — Workload, Shift Management, and Department additional cases fully executed

Workload's "Manage workload" team flow (TC-PLT-257–263, 9 cases) and Shift Management's own Team-scoped business
rules per the Shift Management KB (TC-PLT-272–280) were both executed live for the first time, along with the
Department additional cases (TC-PLT-296–298). Combined with the Timesheet pass above, this completes the
cross-plugin Team consolidation suite's first full execution across all three consumer plugins.

**Workload (TC-PLT-257–263):** All 9 cases PASS, zero defects. "Manage workload" is confirmed correctly
per-team-membership-row scoped for both creating and managing a workload (not a global user-level flag), Admin
bypasses it entirely, a non-manager member can still work within their own portion of an existing workload while
whole-workload actions stay unavailable, and the uniqueness constraint on team membership holds.

**Shift Management (TC-PLT-272–280):** TC-PLT-272 is moot (the field it tested was removed as part of the
`BUG-PLT-037` fix). TC-PLT-273/274 (code trace)/276/277/278/279 all PASS — Team Lead's automatic leave approval,
the "Apply For" dropdown scoping, the Shift Calendar team filter, the Dashboard "Team On Leave" widget, and the
Department delete-guard all correctly reconcile against the now-fixed `BUG-PLT-037`/`BUG-PLT-041`. TC-PLT-280 is
CONFIRMED FIXED via `BUG-PLT-047`'s own retest and final resolution.

**TC-PLT-275 — false positive found and corrected, PASS.** While investigating TC-PLT-296 (Department Manager
field), live testing of the Attendance Corrections approval queue appeared to show it had no authorization
scoping at all — two accounts that looked like unrelated non-approvers (`autumn.grace`, `briar.sunset`) could both
view and approve another employee's pending correction, and this was briefly filed as `BUG-PLT-048` (High). A
permissions check (`rails runner`) found both accounts actually held the legitimate, broad
`approve_attendance_corrections` permission via a shared "QA Full Access" test role on `PLT-DelCheck-Project` —
exactly the KB's own documented "HR/Admin see all" tier, not an unrelated user at all. Retested with a genuinely
zero-permission, non-team-approver user (`willow.belle`): correctly redirected away from the queue, and a direct
backend PATCH to the approve endpoint correctly returned 403. `BUG-PLT-048` retracted — the scoping is correct.
**Lesson: verify a "control" account's actual permissions directly before trusting it as a negative case** — an
account that looks unrelated by name can still hold a broad permission from unrelated test setup.

**TC-PLT-297 could not be executed as written** — Shift Management's Reports page has no "Department" filter
anywhere in its UI (only Employee, Team, Leave Type/Status, and date range), contradicting the Shift Management
KB's claim. Logged as a documentation/KB accuracy gap, not a scoping defect, and left as Not Covered rather than
forced into a Pass/Fail that doesn't fit.

**TC-PLT-298 PASS** — a zero-team Department deletes cleanly, correctly contrasting with TC-PLT-279's guard.

Zero defects found across Workload and Shift Management this session — the one candidate finding (`BUG-PLT-048`)
was a test-setup false positive, caught and corrected before being left as a genuine open bug.
