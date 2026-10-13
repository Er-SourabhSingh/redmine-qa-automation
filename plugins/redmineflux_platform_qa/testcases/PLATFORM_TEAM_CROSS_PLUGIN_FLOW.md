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

### TC-PLT-241 — Shift Management's per-team View/Edit/Delete actions (within its own duplicate list)

1. From Shift Management's Teams & Departments → Teams tab, click "View Team" / "Edit" / "Delete" on the "Team-Testing" row.

**Expected:** Either a Shift-Management-owned detail/edit page (consistent with it being a "real" duplicate), or — preferably — a redirect to Platform's own `/redmineflux_platform/teams/<id>`.

**Actual:** All three actions correctly redirect to Platform's own `/redmineflux_platform/teams/<id>` page — unlike Timesheet/Workload's in-grid team links (TC-PLT-243/244 below), there is no duplicate *detail* page here, only the duplicate *list* (TC-PLT-240). **Status: PASS** (noted as a positive, partial-mitigation finding in `BUG-PLT-040`).

## Functional Cases — Team detail-page redirects (per consumer plugin)

### TC-PLT-242 — Timesheet: clicking a team name from within Timesheet's own screens

1. From a Timesheet screen that lists/links a team by name (e.g. a report or filter result), click the team name.

**Expected:** Opens Platform's own Team detail page, or a Timesheet-specific view limited to the one relevant action (e.g. assigning an approval schema) — not a full duplicate Team management page.

**Actual:** Opens `/timesheet/teams/<id>` — Timesheet's own complete Team page, with duplicate Delete/Edit/Manage-Members controls and an unassignable "Timesheet Approval Schema: Not Assigned" (only a link to create one elsewhere). **Status: FAIL — filed `BUG-PLT-038`** (this is the same defect BUG-PLT-038 documents via Platform's "Timesheet Approval" button; this TC confirms the identical duplicate page is also reachable natively from inside Timesheet itself, not only via Platform's redirect button).

### TC-PLT-243 — Workload: clicking a team name from Workload's own grid

1. Open Workloads (`/rf_workloads`).
2. In the Workload grid, click a team name link (e.g. "PLT-QA-035-Team").

**Expected:** Same as TC-PLT-242 — Platform's own Team page, or a Workload-specific view limited to the relevant action (capacity/skills), not a full duplicate.

**Actual:** Opens `/rf_teams/<id>` — Workload's own complete Team page, with duplicate Delete/Edit/Manage-Members plus a "Team Availability" widget, and **zero Skills UI** despite Platform's own button for this destination being labeled "Workload & Skills". **Status: FAIL — filed `BUG-PLT-038`** (same underlying defect, confirmed reachable natively from Workload's own grid, not only via Platform's redirect button).

## Functional Cases — Department (surfaced via Team, owned by Shift Management only)

### TC-PLT-244 — Department created in Shift Management is consumed, unsynced, by Platform's Team form

1. Open Shift Management → Teams & Departments → Departments tab (`/shift_management/departments?tab=departments`).
2. Click "Create Department", name it (e.g. "Department-Testing"), save.
3. Open Platform → New team (`/redmineflux_platform/teams/new`) and check the "Department" dropdown.

**Expected:** If Department is a genuinely shared entity, Platform should both read it (as observed) and provide its own management screen for it (create/list/edit), consistent with every other entity on Platform's own nav (Teams, Organizations, Holiday Schemes, Leave Types, etc.).

**Actual:** The new department appears in Platform's dropdown immediately (confirmed: shared data, correctly read). However, Platform has **no** owning screen for Department at all — no nav link, and `/redmineflux_platform/list/departments` returns a 404. Shift Management is the sole CRUD owner. **Status: FAIL — filed `BUG-PLT-041`.**

### TC-PLT-245 — Platform has no "Departments" nav entry despite depending on Department data

1. Open Platform (`/redmineflux_platform`) and inspect the full left nav: Overview, Teams, Organizations, Contacts, Contact links, Holiday Schemes, Holidays, Leave Types, Leaves, Audit events, Platform Settings.

**Expected:** Every entity type a Platform form depends on (per the plugin's own stated purpose — "the records your plugins all work from... enter something once and it is the same everywhere") has a corresponding Platform-owned screen.

**Actual:** Confirmed no "Departments" entry exists anywhere in Platform's nav, despite the Team form depending on it. **Status: FAIL — filed `BUG-PLT-041`** (same root cause as TC-PLT-244, listed separately since this is the nav-completeness angle rather than the data-flow angle).

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

**Status:** Not yet executed.

### TC-PLT-247 — No Approval Schema assigned to the team → submission goes straight to Admin

**Preconditions:** Timesheet Mode = Team Mode. Team has members with "View Timesheet" permission. **No**
Approval Schema assigned to the team.

1. As a team member, log time for the period and click **Submit**.
2. Check Timesheet's Approval Dashboard as Admin.

**Expected:** With no schema assigned, the submitted timesheet routes directly to the Administrator for
Approve/Reject — there being no configured approval level to send it to first.

**Status:** Not yet executed.

### TC-PLT-248 — Schema assigned, Level 1 approver role present in the team → routes to that approver

**Preconditions:** Timesheet Mode = Team Mode. An Approval Schema exists with at least one level mapped to a
role (e.g. "Level 1 = Team Lead"). That same role is held by at least one other member of the team. Schema is
assigned to the team.

1. As a regular team member (not holding the Level 1 role), submit a timesheet.
2. Check the Approval Dashboard as the team member holding the Level-1-mapped role.

**Expected:** The timesheet appears under that member's Pending Approvals — not Admin's — since a member
holding the schema's Level 1 role exists on this team.

**Status:** Not yet executed.

### TC-PLT-249 — Schema level role has no matching member on the team → falls back to Admin

**Preconditions:** Same schema as TC-PLT-248, but assigned to a **different** team where nobody currently
holds the role mapped to Level 1 (or any level).

1. A member of this team submits a timesheet.
2. Check the Approval Dashboard as Admin.

**Expected:** Since no team member holds a role matching any configured approval level, the timesheet falls
back to the Administrator for Approve/Reject, the same as the no-schema case (TC-PLT-247).

**Status:** Not yet executed.

### TC-PLT-250 — Two-level schema: a Level 1 approver's own submission routes to Level 2

**Preconditions:** Timesheet Mode = Team Mode. Approval Schema has two levels (e.g. Level 1 = Team Lead,
Level 2 = Manager), both roles held by different members of the team, schema assigned to the team.

1. Log in as the member holding the Level 1 role and submit **their own** timesheet.
2. Check the Approval Dashboard as the member holding the Level 2 role.

**Expected:** Per the Level 1 approver being the submitter here (not the final level), their timesheet still
routes through the normal sequence — to Level 2 — rather than skipping to Admin, since a higher level exists
on this team.

**Status:** Not yet executed.

### TC-PLT-251 — Last-level approver's own submission routes to Admin (self-approval deadlock prevention)

**Preconditions:** Same two-level schema/team as TC-PLT-250.

1. Log in as the member holding the **final** level's role (Level 2) and submit **their own** timesheet.
2. Check the Approval Dashboard as Admin.

**Expected:** Per `TIMESHEET_USER_GUIDE.md`'s documented rule ("An approver's own timesheet routes to the next
level... if the submitter is the final-level approver, only an administrator can complete the approval") —
the timesheet goes to Admin, since there is no level above the submitter's own.

**Status:** Not yet executed.

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

**Status:** Not yet executed.

### TC-PLT-253 — Rejection at any level restarts approval from Level 1 on resubmission

**Preconditions:** Same two-level schema/team as TC-PLT-250.

1. Submitter submits a timesheet; Level 1 approves it, advancing it to Level 2.
2. Level 2 **rejects** it.
3. Submitter edits and resubmits the same period's timesheet.
4. Check which level's Pending Approvals the resubmission appears under.

**Expected:** Regardless of which level rejected it (here, Level 2), a resubmission restarts the approval
sequence from **Level 1** again — it does not resume from the rejecting level.

**Status:** Not yet executed.

### TC-PLT-254 — Auto-Approve Threshold = 0 disables auto-approval (manual approval required for all)

**Preconditions:** Timesheet → Settings → **Auto-Approve Threshold = 0**.

1. Submit a timesheet with a very small total (e.g. 1 hour).
2. Check whether it is auto-approved or enters the normal approval workflow.

**Expected:** Per the documented rule ("`0` disables... it does not mean zero hours"), every timesheet
requires manual approval when the threshold is `0`, regardless of how few hours it totals.

**Status:** Not yet executed.

### TC-PLT-255 — Auto-Approve Threshold > 0: timesheet below threshold bypasses the workflow

**Preconditions:** Timesheet → Settings → **Auto-Approve Threshold** set to a nonzero value (e.g. 5 hours).

1. Submit a timesheet whose total hours are **below** the threshold.
2. Submit a separate timesheet (different period/user) whose total hours are **at or above** the threshold.

**Expected:** The below-threshold timesheet is automatically approved on submission, bypassing Level
1/Level 2/Admin entirely. The at-or-above-threshold timesheet enters the normal approval workflow as usual.

**Status:** Not yet executed.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed.

### TC-PLT-258a — Admin can create a workload for any team without being a member of it at all

**Preconditions:** A Platform Team where the Admin user holds **no membership row** whatsoever (not added as a
member, so no "Manage workload" flag exists for them on this team either).

1. Log in as Admin and create a workload for this team.

**Expected (per product owner, 2026-10-13):** Unlike a regular team member (TC-PLT-257/258, gated by the
per-membership "Manage workload" flag), **Admin has no such restriction** — Admin can create a workload for
any team without first being added to it. The "Manage workload" flag only constrains ordinary team members;
it is not a gate Admin has to pass through.

**Status:** Not yet executed.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed. If confirmed working, this would mean two of `BUG-PLT-039`'s three "overlapping
concepts" (team-level Team Lead, per-member Team role) are at least kept in sync with each other — narrowing
that bug's scope to the third, genuinely orphaned one (Approve leave) rather than three fully independent
fields.

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

**Status:** Not yet executed — flagged as the highest-priority case in this section given the direct
contradiction with already-filed `BUG-PLT-037`.

### TC-PLT-274 — Team Lead's automatic shift-change-request approval, scoped to own team only

**Preconditions:** Same team-lead setup as TC-PLT-273. A pending shift change request exists from a member of
the Lead's own team, and a separate one from a non-member.

1. Log in as the team's Lead and open Shifts → Shift Requests tab.
2. Attempt to approve the own-team member's pending request.
3. Check whether the non-member's pending request is even visible in this queue.

**Expected (per KB):** *"Team leads only see requests from members of their own team; administrators and
users with `approve_shift_changes` see every pending request."* The Lead should see and be able to act on
step 2's request, and should not see step 3's request at all (not merely blocked from acting on it).

**Status:** Not yet executed.

### TC-PLT-275 — Team Lead's automatic attendance-correction approval, scoped to own team only

**Preconditions:** Same team-lead setup. A pending attendance correction request exists from a member of the
Lead's own team, and a separate one from a non-member.

1. Log in as the team's Lead and open Attendance Corrections.
2. Check which pending requests are visible and actionable.

**Expected (per KB):** *"Approvers (HR/Admin see all; team leads see only their team's requests)."* Same
team-scoping as TC-PLT-274, for a different approval queue.

**Status:** Not yet executed.

### TC-PLT-276 — "Apply for Leave on Behalf of" is scoped to the team lead's own team members

**Preconditions:** Same team-lead setup. The Lead's team has at least one other member; at least one employee
exists who is not a member of the Lead's team.

1. Log in as the team's Lead and open Leave → New Leave Application → "Apply For" dropdown.
2. Check which employees are selectable.

**Expected (per KB):** *"team leads only see their own team's members"* in this dropdown — the non-member
employee should not be selectable (unlike admin/HR, who "see everyone").

**Status:** Not yet executed.

### TC-PLT-277 — Shift Calendar's "Team" filter reads Platform's consolidated Team membership

**Preconditions:** A Platform Team with known members, each with an assigned shift.

1. Open Shift Management's own Shift Calendar (`/shift_management/calendar`).
2. Apply the "Team" filter for this team.

**Expected:** The calendar narrows to exactly this team's current member list, as recorded on Platform's own
Team screen — confirming the calendar reads live from the shared/consolidated membership, not a stale or
separately-maintained copy.

**Status:** Not yet executed.

### TC-PLT-278 — Dashboard's "Team on leave today" widget reflects Platform Team membership

**Preconditions:** A Platform Team with a member on approved leave today.

1. Log in as a different member of the same team and open Shift Management's own Dashboard.
2. Check the "Team on leave today" panel.

**Expected:** The teammate on approved leave appears, confirming this widget also reads from the same
consolidated Team membership rather than a separate source.

**Status:** Not yet executed.

### TC-PLT-279 — A Department cannot be deleted while it still has teams

**Preconditions:** A Department with at least one Team assigned to it (via the Team's "Department" dropdown —
see `BUG-PLT-041`).

1. Attempt to delete the Department from Shift Management's own Departments tab.

**Expected (per KB):** *"A department cannot be deleted while it still has teams — deactivate it instead, or
move/delete its teams first."* The delete should be refused with a message to that effect, not silently
cascade-delete the teams (the inverse risk already seen for Team→Workload in `BUG-PLT-030`).

**Status:** Not yet executed. Directly relevant to `BUG-PLT-041`'s recommendation to migrate Department fully
onto Platform — this constraint needs to survive that migration.

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

**Status:** Not yet executed.

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

**Status:** Not yet executed. If confirmed inert, this is a new, distinct finding from `BUG-PLT-037` (a
different field on a different entity) but the same defect *shape* — worth filing together under the same
"inert label field" pattern if confirmed, rather than as something newly surprising.

### TC-PLT-297 — Reports' "Department" filter actually scopes results to that department's teams/employees

**Preconditions:** Two Departments exist, each with at least one Team and employees, with distinct leave/
attendance/shift data recorded for each.

1. Open Shift Management's own Reports page, pick any tab (per the KB: Summary/Attendance/Leave/Shift/Holiday),
   and apply the **Department** filter for one of the two departments.

**Expected:** Per the KB (*"Apply the available filters (date range, employee, team, department, status, leave
type, or shift)"*), only data belonging to employees/teams under the selected department should appear — the
other department's data should be excluded.

**Status:** Not yet executed.

### TC-PLT-298 — A Department with NO teams can be deleted cleanly (contrast to TC-PLT-279)

**Preconditions:** A Department exists with **zero** teams assigned to it.

1. Attempt to delete this Department from Shift Management's own Departments tab.

**Expected:** Per the KB (*"A department cannot be deleted while it still has teams — deactivate it instead, or
move/delete its teams first"*), the restriction is specifically about having teams — a Department with none
should delete cleanly, confirming the guard found in TC-PLT-279 is correctly scoped to "has teams," not a
blanket block on deleting any Department at all.

**Status:** Not yet executed.

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-238 | PASS | — | — |
| TC-PLT-239 | PASS | — | — |
| TC-PLT-240 | FAIL | BUG-PLT-040 | `screenshots/BUG-PLT-040/shift-management-duplicate-teams-list.png` |
| TC-PLT-241 | PASS | — | — |
| TC-PLT-242 | FAIL | BUG-PLT-038 | `screenshots/BUG-PLT-038/timesheet-approval-redirects-to-duplicate-team-page.png` |
| TC-PLT-243 | FAIL | BUG-PLT-038 | `screenshots/BUG-PLT-038/workload-skills-redirects-no-skills-ui.png` |
| TC-PLT-244 | FAIL | BUG-PLT-041 | `screenshots/BUG-PLT-041/shift-management-owns-department-crud.png`, `screenshots/BUG-PLT-041/platform-team-form-consumes-department-no-own-crud.png` |
| TC-PLT-245 | FAIL | BUG-PLT-041 | `screenshots/BUG-PLT-041/platform-departments-screen-404.png` |
| TC-PLT-246 – TC-PLT-255 | Not yet executed | — | Timesheet Team-Mode approval flow — written 2026-10-13, pending first live execution pass |
| TC-PLT-256 | FAIL | BUG-PLT-042 | `screenshots/BUG-PLT-042/autumn-skills-access-granted-via-platform-team-permission.png`, `screenshots/BUG-PLT-042/autumn-skills-403-with-only-legacy-workload-permission.png` |
| TC-PLT-257, TC-PLT-257a, TC-PLT-258, TC-PLT-258a, TC-PLT-259 – TC-PLT-261, TC-PLT-263 | Not yet executed | — | Workload "Manage workload" team flow — written 2026-10-13, pending first live execution pass |
| TC-PLT-262 | Cross-reference only | BUG-PLT-030 (already filed) | — |
| TC-PLT-272 – TC-PLT-280 | Not yet executed | — | Shift Management's own Team-scoped business rules (per KB) — written 2026-10-13, TC-PLT-273 flagged as highest priority (direct reconciliation needed against `BUG-PLT-037`), pending first live execution pass |
| TC-PLT-296 – TC-PLT-298 | Not yet executed | — | Department additional cases (Manager field inert-label check, Reports filter scoping, no-teams delete contrast) — written 2026-10-13, pending first live execution pass |

## Summary (2026-10-13)

Of 8 cross-plugin flow cases: 3 PASS (Timesheet and Workload's own nav links already defer correctly to Platform;
Shift Management's per-record actions on its duplicate list already redirect to Platform), 5 FAIL. The FAILs span
three distinct defect shapes: a duplicate **list** (Shift Management only, `BUG-PLT-040`), duplicate **detail**
pages reachable both via Platform's own redirect buttons and natively from within Timesheet/Workload
(`BUG-PLT-038`), and a **missing** Platform-side screen for an entity Platform itself already depends on
(Department, `BUG-PLT-041`). All three point the same direction as the Team-role/leave-approval findings
(`BUG-PLT-037`/`039`): Team and its related Department concept are not yet consistently consolidated under
Platform across all three consumer plugins, even though the underlying data is already correctly shared.
