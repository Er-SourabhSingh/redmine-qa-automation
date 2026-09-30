# Test Cases — Redmineflux Platform — Cross-Plugin CRUD Propagation Matrix

> **⏸ Execution paused here, 2026-09-30, by explicit user decision.** Team's section is done (TC-PLT-142–151, 199–203; only TC-PLT-152 deferred pending fixture setup) and produced BUG-PLT-013/014/015/016 — the last of which recommends consolidating every entity onto Platform's own screen (Roadmap Step 5). The user's reasoning for pausing: if that architectural recommendation is acted on, the remaining NOT-EXECUTED TCs in this file (Holiday Scheme Update/Delete, and all of Holiday/Leave Type/Leaves/Organizations/Contacts/Audit Events) may need to be rewritten anyway once consumer-plugin screens are retired — so further execution against the *current* 4-screens-per-entity architecture should wait rather than risk being redone. **Do not resume this file's remaining TCs without checking back with the user first**, even though most of them are still written and ready to run. Session moved to `PLATFORM_PERMISSIONS_AND_ACCESS.md` next.
>
> Source: explicit user directive, 2026-09-30 — complete cross-plugin CRUD propagation testing, not per-plugin CRUD in isolation. For every shared entity, every relevant "origin" plugin (a plugin with its own native Create/Update/Delete UI for that entity) must be tested performing the operation, with the result verified in: (1) the origin plugin itself, (2) Platform's own screen, (3) every other relevant consumer plugin, (4) dependent dropdowns/filters/relationships, (5) the underlying database, including that no stale/orphaned rows remain after Update/Delete.
>
> **This file is written before execution, per explicit instruction ("likh lo pehele" — write all test cases first).** Every TC below starts as NOT EXECUTED unless a result line is already present, cross-referencing prior work done in `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` where applicable (mainly Organizations) rather than re-doing identical work twice — those cross-references are noted explicitly, not silently assumed.
>
> Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

## Origin-plugin map (which plugins have their own native Create/Update/Delete UI for each entity)

| Entity | Origin plugins (own CRUD UI) | Read-only consumers (no own CRUD UI, but shows the data) |
|---|---|---|
| Team | Platform, Workload, Timesheet, Shift Management | — |
| Holiday Scheme | Platform, Workload, Shift Management | Helpdesk (reads holidays, not schemes) |
| Holiday | Platform, Workload, Helpdesk, Shift Management | — |
| Leave Type | Platform, Shift Management | Workload (dropdown only, no create/edit/delete UI of its own) |
| Leaves | Platform, Workload, Shift Management | — |
| Organizations | Platform, CRM, Helpdesk | Invoice (references via Contact, not Organization directly) |
| Contacts | Platform, CRM | Invoice (its own "Customer" create form was retired pre-platform — `/customers` redirects to `/contacts`, confirmed `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-004 — Invoice has no independent Contact-create UI at all) |
| Audit Events | — (no plugin has a direct "create audit event" form; every row is a side effect of some other action) | Platform (unified view); legacy per-plugin audit UIs were retired along with their old tables (migrations 021/031 dropped `rf_audit_logs`/`timesheet_audit_logs` outright, unlike Team/Org/Holiday which kept their old tables under the "adopt, don't retire the UI yet" pattern — Audit is architecturally different from the other 7 entities for this reason) |

---

# TEAM

Shared table: `rf_teams` / `rf_team_memberships`. Baseline fixture: `PLT-BASELINE-QA Squad` (id 1) — do **not** use for destructive (Delete) TCs; create disposable `PLT-CRUD-Team-<Origin>` fixtures for those instead.

## Create

### TC-PLT-142: Team — Create from Platform → verify in Workload, Timesheet, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/teams` → "New team", create `PLT-CRUD-Team-Platform` with 2 members.
2. Verify it appears correctly in Platform's own Teams list/detail.
3. Verify it appears in Workload's `/rf_teams` list with the same id/name/member count.
4. Verify it appears in Timesheet's `/timesheet/teams` list, same way.
5. Verify it appears in Shift Management's `/shift_management/departments?tab=teams` list, same way.
6. Check every team-select dropdown reachable in this pass (e.g. an issue's team field, a workload allocation's team filter) lists the new team.
7. DB: `SELECT id, name FROM rf_teams WHERE name='PLT-CRUD-Team-Platform'` — exactly one row; `SELECT COUNT(*) FROM rf_team_memberships WHERE team_id=<that id>` — equals 2.

**Expected Result:** Single row, immediately visible in all 3 consumer plugins with no sync step, DB confirms exactly one team row and the correct membership count, dropdowns show it.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created `PLT-CRUD-Team-Platform` (id 3) via `/redmineflux_platform/teams` → "New team", added 2 members (Aurora Wren, Autumn Grace) via "Add members". Confirmed identical (same id, same 2 members) in Workload's `/rf_teams`, Timesheet's `/timesheet/teams`, and Shift Management's `/shift_management/departments?tab=teams`. Confirmed in Shift Management's Shift Calendar "Filter by Team" dropdown. DB: `rf_teams` exactly 1 row (id 3), `rf_team_memberships` exactly 2 rows for `team_id=3`.

---

### TC-PLT-143: Team — Create from Workload → verify in Platform, Timesheet, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-142, creating `PLT-CRUD-Team-Workload` from Workload's `/rf_teams` → "New Team", checking Platform + Timesheet + Shift Management + DB.

**Expected Result:** Same as TC-PLT-142.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created `PLT-CRUD-Team-Workload` (id 4) via Workload's `/rf_teams` → "New Team". Confirmed identical (same id 4) in Platform's `/redmineflux_platform/teams`, Timesheet's `/timesheet/teams`, and Shift Management's `/shift_management/departments?tab=teams`. DB: `rf_teams` exactly 1 row (id 4).

---

### TC-PLT-144: Team — Create from Timesheet → verify in Platform, Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Team-Timesheet` from Timesheet's `/timesheet/teams` create action, checking Platform + Workload + Shift Management + DB.

**Expected Result:** Same as TC-PLT-142.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created `PLT-CRUD-Team-Timesheet` (id 5) via Timesheet's `/timesheet/teams` → "New Team". Confirmed identical (same id 5) in Platform, Workload, Shift Management. DB: `rf_teams` exactly 1 row (id 5).

---

### TC-PLT-145: Team — Create from Shift Management → verify in Platform, Workload, Timesheet, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Team-ShiftMgmt` from `/shift_management/departments?tab=teams` → "New Team", checking Platform + Workload + Timesheet + DB.

**Expected Result:** Same as TC-PLT-142.

**Status:** **RE-EXECUTED 2026-09-30 — PASS, all legs.** (Superseding the earlier incomplete attempt with `SM-Native-Team-Verify`, which was deleted before cross-verification.) Created `PLT-CRUD-Team-ShiftMgmt` (id 6) via `/shift_management/departments?tab=teams` → "New Team". Confirmed identical (same id 6) in Platform, Workload, Timesheet. DB: `rf_teams` exactly 1 row (id 6).

## Update

### TC-PLT-146: Team — Update (rename) from Platform → verify in Workload, Timesheet, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-142 executed (uses that fixture, or an equivalent disposable one if 142 wasn't run first).

**Steps:**
1. Rename the team from Platform's own edit screen to `PLT-CRUD-Team-Platform-RENAMED`.
2. Check the new name shows immediately in Workload, Timesheet, Shift Management (no stale cached name anywhere).
3. DB: `SELECT name, updated_at FROM rf_teams WHERE id=<id>` — name matches, `updated_at` changed.

**Expected Result:** New name everywhere immediately, one row updated in place (not a new row), DB `updated_at` reflects the change.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Renamed `PLT-CRUD-Team-Platform` (id 3) to `PLT-CRUD-Team-Platform-RENAMED` via Platform's own edit screen. Confirmed the new name in Workload, Timesheet, and Shift Management immediately, no stale name anywhere. DB: same id 3, `updated_at` changed to the edit timestamp.

---

### TC-PLT-147: Team — Update (membership) from Workload → verify in Platform, Timesheet, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A team exists with a known member count.

**Steps:**
1. Add a member to the team from Workload's own team-edit screen.
2. Check the new member appears in Platform's, Timesheet's, and Shift Management's view of the same team.
3. DB: `SELECT COUNT(*) FROM rf_team_memberships WHERE team_id=<id>` — count incremented by exactly 1; confirm the new row's `user_id` matches who was added.

**Expected Result:** New member visible everywhere immediately, exactly one new membership row, no duplicate membership rows for the same user.

**Status:** **EXECUTED 2026-09-30 — PASS (functional propagation), FAIL (audit trail) — see BUG-PLT-013.** (Also fulfills the originally-planned TC-PLT-061, same intent — Workload was used as the origin here instead of Timesheet, equally valid.) Added Luna Blossom to `PLT-CRUD-Team-Workload` (id 4) via Workload's own "Add Member". Confirmed "1 member" in Platform, Timesheet, and Shift Management immediately. DB: `rf_team_memberships` exactly 1 row for `team_id=4`, `user_id=5` (Luna Blossom). **New finding on re-check:** no `team_member_added` row was ever written to `rf_audit_events` for this addition (confirmed by re-querying `MAX(id)` after both TC-PLT-147 and TC-PLT-148 — no new rows), even though the team's own `created` event logged correctly minutes earlier from the same origin. Root cause traced to source: Workload's `RfTeamMembershipsController#create` builds/saves the membership directly and never calls the shared `RedminefluxPlatform::TeamService.add_member`, which is the only place `AuditService.log(..., 'team_member_added', ...)` is ever called. Filed as **BUG-PLT-013**.

---

### TC-PLT-148: Team — Update (membership) from Timesheet → verify in Platform, Workload, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A team exists.

**Steps:** Same method as TC-PLT-147, adding/removing a member from Timesheet's own team-edit screen (`/timesheet/teams/<id>` → "Add Member" — confirmed this control exists live).

**Expected Result:** Same as TC-PLT-147.

**Status:** **EXECUTED 2026-09-30 — PASS (functional propagation), FAIL (audit trail) — see BUG-PLT-013.** Added Daisy Skye to `PLT-CRUD-Team-Timesheet` (id 5) via Timesheet's own "Add Member" (`/timesheet/teams/5`). Hit the known custom-multi-select-intercepts-submit-button UI snag (Escape-then-retry workaround applied — see PLATFORM_MEMORY.md). Confirmed "1 member" in Platform's Teams list, Workload's `/rf_teams`, and Shift Management's `/shift_management/departments?tab=teams` immediately. DB: `rf_team_memberships` exactly 1 row for `team_id=5`, `user_id=6` (Daisy Skye). Same audit-trail gap as TC-PLT-147: no `team_member_added` row written to `rf_audit_events` (`MAX(id)`=36 before and after). Source confirmed: Timesheet's `Timesheet::RfTeamMembershipsController#create` also builds/saves the membership directly, never calling `TeamService.add_member`. Third confirmed occurrence of the same defect class — see **BUG-PLT-013**.

---

### TC-PLT-149: Team — Update (membership) from Shift Management → verify in Platform, Workload, Timesheet, DB

**User Role:** Admin/Manager.
**Precondition:** A team exists.

**Steps:** Same method, via Shift Management's own team-edit screen.

**Expected Result:** Same as TC-PLT-147.

**Status:** **EXECUTED 2026-09-30 — PASS (functional propagation), FAIL (audit trail) — see BUG-PLT-013.** Added Ivy Skylark to `PLT-CRUD-Team-ShiftMgmt` (id 6) via Shift Management's own "Add Members" (`/shift_management/teams/6`). Same custom-multi-select-intercepts-submit-button UI snag, same Escape-then-click workaround applied successfully. Confirmed "1 member"/"Members = 1" in Platform's Teams list, Workload's `/rf_teams`, and Timesheet's `/timesheet/teams` immediately. DB: `rf_team_memberships` exactly 1 row for `team_id=6`, `user_id=16` (Ivy Skylark). Audit trail: `rf_audit_events` `MAX(id)` unchanged at 36 before and after — no `team_member_added` row, confirming the source-code prediction (Shift Management's `TeamMembersController#create` bypasses `TeamService.add_member`, identical to Workload/Timesheet). Third and final confirmed occurrence across all 3 consumer-plugin origins for BUG-PLT-013. Also noted: Shift Management's member row shows only a "Remove member" action, no per-row "Edit" — relevant to TC-PLT-200 (may not have an edit-role UI at all for this origin; needs confirming when TC-PLT-200 is executed).

---

### TC-PLT-199: Team — Edit an existing member's role/attributes from Workload → verify in Platform, Timesheet, DB

**User Role:** Admin/Manager.
**Precondition:** A team with at least one existing member (e.g. from TC-PLT-142/147).

**Steps:**
1. From Workload's own team detail screen (`/rf_teams/<id>`), click the member row's "Edit" action (not "Add Member" — the per-row edit control) and change the member's role and/or `manage_workload`/`can_approve_leave` flags.
2. Save, and check the changed value is reflected in Platform's and Timesheet's view of the same member row.
3. DB: `SELECT role_id, manage_workload, can_approve_leave, updated_at FROM rf_team_memberships WHERE id=<membership id>` — values match the edit, `updated_at` changed, same row (not a new one).

**Expected Result:** Edited attributes visible everywhere immediately, one row updated in place.

**Status:** NOT EXECUTED — this TC did not exist before 2026-09-30; added after the user flagged that the matrix's "Update (membership)" TCs (147–149) only covered *adding* a member, never *editing* one.

**Correction made while scoping this TC (2026-09-30):** originally drafted assuming Platform's own screen has the per-row "Edit" control — live-checked and that is **wrong**. A `grep -i edit` of Platform's team-3 detail page (`/redmineflux_platform/teams/3`) shows only one Edit link on the whole page, and it is the team-level "Edit" (rename), not a per-member one — Platform's member table offers only "Remove from team" per row. The Edit button seen earlier belonged to **Timesheet's** screen, not Platform's. Live-checked Workload's team-4 page (`/rf_teams/4`) and confirmed it also has genuine per-row "Edit"+"Delete" buttons (distinct from the team-level Edit/Delete at the top of the page). So this TC is re-targeted at Workload (confirmed to have the control) rather than Platform (confirmed not to).

**Status:** **EXECUTED 2026-09-30 — PASS (functional propagation), FAIL (audit trail) — same BUG-PLT-013, now confirmed to also cover Edit, not just Add.** Edited Luna Blossom's membership on team 4 via Workload's per-row "Edit" (`/rf_teams/4`): set Role → Manager, checked "Can approve leave". Saved successfully. DB: same row `id=8` (not a new one), `role_id=3`, `can_approve_leave=1`, `updated_at` changed to 08:34:33 — confirms in-place update, no duplicate row. Confirmed "Manager" role and "Yes" approve-leave in Platform's team-4 view (`/redmineflux_platform/teams/4`) and "Manager" role in Timesheet's team-4 view (`/timesheet/teams/4` — note: Timesheet's member table has no Manage-workload/Approve-leave columns at all, only Role; a display-scope difference, not necessarily a defect, since those 2 flags are workload/leave-specific and arguably out of Timesheet's concern). Audit trail: `rf_audit_events` `MAX(id)` unchanged at 36 — no `team_member_updated` event. Source confirms: Workload's `RfTeamMembershipsController#update` (line 95) also has zero `AuditEvent`/`AuditService` references, same as its `create`. **BUG-PLT-013 updated to reflect this broader scope** — the gap is "team-membership mutations from consumer plugins" generally, not narrowly "add member".

---

### TC-PLT-200: Team — Edit an existing member's role/attributes from Timesheet → verify in Platform, Workload, DB

**User Role:** Admin/Manager.
**Precondition:** Same as TC-PLT-199.

**Steps:** Same method as TC-PLT-199, from Timesheet's own member-edit control (`/timesheet/teams/<id>`, confirmed live to have per-row "Edit"+"Delete" buttons during TC-PLT-148).

**Expected Result:** Same as TC-PLT-199.

**Status:** **EXECUTED 2026-09-30 — PASS (functional propagation), FAIL (audit trail) — same BUG-PLT-013.** Edited Daisy Skye's membership on team 5 via Timesheet's per-row "Edit" (`/timesheet/teams/5`): set Role → Reporter. Saved successfully. DB: same row `id=9` (not a new one), `role_id=5`, `updated_at` changed to 08:36:24 — in-place update confirmed. Confirmed "Reporter" role in Platform's team-5 view and Workload's team-5 view immediately. (Timesheet's own edit modal only exposes Role — no `manage_workload`/`can_approve_leave` checkboxes, unlike Workload's edit modal; consistent with Timesheet's member table also not displaying those 2 columns, noted in TC-PLT-199 — a display/edit-scope difference, not a defect, since those flags are workload/leave-specific.) Audit trail: `rf_audit_events` `MAX(id)` unchanged at 36 — no `team_member_updated` event, confirming the gap extends to Timesheet's `update` action too, not just Workload's.

**Scope note:** Platform and Shift Management do **not** have a per-member edit control at all (confirmed live for both — Platform only offers "Remove from team"; Shift Management's member row only offers "Remove member", noted during TC-PLT-149). So "edit member from Platform" and "edit member from Shift Management" are not testable as written — there is no UI path to attempt. This asymmetry (2 of the 4 origins can edit a member's role, 2 cannot, and the "canonical" Platform screen is one of the 2 that cannot) was flagged to the user and filed as its own bug: **BUG-PLT-015**.

---

### TC-PLT-201: Team — Remove a single member (not the whole team) from Platform → verify in Workload, Timesheet, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A team with at least 2 members (so removing one leaves the team itself intact).

**Steps:**
1. From Platform's own team detail screen, click the member row's "Delete"/"Remove" action for a single member (not the team's own Delete button).
2. Confirm the member disappears from Workload's, Timesheet's, and Shift Management's view of the same team, member count decrements by exactly 1 everywhere, the team itself still exists.
3. DB: `SELECT COUNT(*) FROM rf_team_memberships WHERE team_id=<id>` decremented by exactly 1; the specific `(team_id, user_id)` row is gone; `rf_teams` row for that team still exists.
4. Audit check (given BUG-PLT-013): does `rf_audit_events` get a `team_member_removed` row for this? (Platform's own `TeamMembershipsController#destroy` calls `TeamService.remove_member`, which does call `AuditService.log` — expect this one to actually log correctly from Platform; the open question is only whether Workload/Timesheet/Shift Management's own remove-member actions do the same, per TC-PLT-202.)

**Expected Result:** Clean single-member removal everywhere, team itself untouched, no orphaned row, audit event present (from Platform's own screen).

**Status:** **EXECUTED 2026-09-30 — PASS, all legs, including audit trail.** Removed Autumn Grace from team 3 via Platform's own "Remove from team" (with confirmation dialog). Team now shows "1" member (Aurora Wren) on Platform's own screen. DB: `rf_team_memberships` for `team_id=3` down to exactly 1 row (`user_id=15`, Aurora Wren) — Autumn Grace's row (`user_id=7`) is gone, not just hidden. Confirmed "1 member"/Aurora Wren only in Workload's `/rf_teams/3` and Timesheet's `/timesheet/teams/3`. **Audit trail: PASS this time** — `rf_audit_events` got a new row (`id=37, Team #3, team_member_removed, 2026-09-30 08:37:16`), confirming Platform's own `TeamMembershipsController#destroy` calls `TeamService.remove_member` → `AuditService.log` correctly, exactly as its `create` does via `TeamService.add_member`. Platform's own controller is consistent across create/update/destroy — the BUG-PLT-013 gap is specific to the 3 *consumer* plugins' own controllers, which reimplement persistence directly instead of calling the shared service, for every action tested so far (create, update). This TC's PASS is the expected control case. The open question for TC-PLT-202 is whether Workload's/Timesheet's/Shift Management's own remove-member actions call the shared service (and thus log correctly) or bypass it like their create/update do.

---

### TC-PLT-202: Team — Remove a single member from Workload / Timesheet / Shift Management → verify everywhere, DB, audit trail

**User Role:** Admin/Manager.
**Precondition:** Same as TC-PLT-201, one run per origin.

**Steps:** Same method as TC-PLT-201, once from each of Workload's, Timesheet's, and Shift Management's own per-row member-remove control. For the audit check, look at each origin's controller source for a call to `TeamService.remove_member` or `AuditService.log` before assuming either way.

**Expected Result:** Same functional-propagation result as TC-PLT-201, for each origin. Audit-trail result may legitimately differ per origin (this is exactly the kind of gap BUG-PLT-013 already found for *add* member — do not assume remove is fixed just because add is broken, or vice versa; check each independently).

**Status:** **EXECUTED 2026-09-30 — PASS (functional propagation), FAIL (audit trail) — same BUG-PLT-013, now confirmed to cover Remove too, completing the sweep across Add/Edit/Remove.** Removed the sole member from each of the 3 remaining fixture teams, one per origin: Luna Blossom from team 4 via Workload (`/rf_teams/4`, confirm dialog "Delete Team Member?"), Daisy Skye from team 5 via Timesheet (`/timesheet/teams/5`, same dialog pattern), Ivy Skylark from team 6 via Shift Management (`/shift_management/teams/6`, dialog "Remove Member?"). All 3 succeeded with a UI success message ("Team member was successfully removed." / member count → 0). DB: `SELECT COUNT(*) FROM rf_team_memberships WHERE team_id IN (4,5,6)` = 0 — clean removal, no orphaned rows for any of the 3. Cross-plugin: confirmed 0 members for team 4 in both Platform's and Timesheet's views (Workload was the origin); the other 2 origins' team pages were re-checked via their own screens post-removal and matched (0 members). Audit trail: `rf_audit_events` `MAX(id)` unchanged at 37 across all 3 removals — none of Workload's, Timesheet's, or Shift Management's own remove-member actions log an audit event, exactly like their add/edit actions. **BUG-PLT-013 now fully confirmed across the entire team-membership CRUD surface (add, edit, remove) for all 3 consumer plugins** — only Platform's own screen (TC-PLT-201) logs correctly, for every action.

## Delete

### TC-PLT-150: Team — Delete from Platform (no dependents) → verify removal in Workload, Timesheet, Shift Management, DB

**User Role:** Admin.
**Precondition:** A disposable team with no real dependent records (no shift assignments/timesheets/workload allocations).

**Steps:**
1. Delete the team from Platform's own screen.
2. Confirm it's gone from Workload's, Timesheet's, and Shift Management's team lists — no stale/ghost row anywhere.
3. DB: `SELECT COUNT(*) FROM rf_teams WHERE id=<id>` = 0; `SELECT COUNT(*) FROM rf_team_memberships WHERE team_id=<id>` = 0 (no orphaned membership rows left behind).

**Expected Result:** Clean removal everywhere, no orphaned membership rows.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs, including audit trail.** Deleted `PLT-CRUD-Team-Platform-RENAMED` (id 3, 1 remaining member, no shift/timesheet/workload dependents) via Platform's own "Delete" (with confirmation dialog). Redirected to Teams list, team gone (count implicitly down). DB: `rf_teams` 0 rows for id 3, `rf_team_memberships` 0 rows for `team_id=3` — clean, no orphan. Confirmed absence in Workload (`/rf_teams`, count dropped 5→4 teams), Timesheet (`/timesheet/teams`, count dropped 5→4 teams), and Shift Management (`/shift_management/departments?tab=teams`, `grep` for the name returns nothing). Audit trail: PASS — `rf_audit_events` got `id=38, Team #3, deleted, 2026-09-30 08:42:27`, consistent with Platform's own controller correctly auditing every action (create/update/destroy), matching TC-PLT-201's control-case finding.

---

### TC-PLT-151: Team — Delete from Workload/Timesheet/Shift Management (no dependents) → verify removal everywhere, DB

**User Role:** Admin.
**Precondition:** Same as TC-PLT-150, one disposable team per origin plugin (3 separate runs, or documented if one run is used to represent the pattern and the other two are spot-checked for the delete route/confirmation existing at minimum).

**Steps:** Same method as TC-PLT-150, once from each of Workload's, Timesheet's, and Shift Management's own delete action.

**Expected Result:** Same as TC-PLT-150, for each origin.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs, all 3 origins, including audit trail.** Deleted the 3 remaining fixture teams, one per origin, each already emptied of members by TC-PLT-202: `PLT-CRUD-Team-Workload` (id 4) via Workload's own team-level "Delete" button + "Delete Team?" confirm; `PLT-CRUD-Team-Timesheet` (id 5) via Timesheet's own team-level "Delete" + same confirm pattern; `PLT-CRUD-Team-ShiftMgmt` (id 6) via Shift Management's **Teams & Departments list** page (`/shift_management/departments?tab=teams` — this origin has no team-level Delete on its own detail page, only from the list row's actions) + "Delete Team?" confirm ("and all its members will be permanently deleted"). All 3 succeeded; Shift Management's own list dropped from "2 teams" to "Showing 1–1 of 1 teams" (only the untouched baseline team left). DB: `rf_teams` 0 rows for ids 4/5/6; `rf_team_memberships` 0 rows for `team_id IN (4,5,6)` — clean, no orphans. Audit trail: **PASS for all 3** — `rf_audit_events` got `id=39` (Team #4, deleted, Workload-initiated), `id=40` (Team #5, deleted, Timesheet-initiated), `id=41` (Team #6, deleted, Shift-Management-initiated). This is the key finding that pins down BUG-PLT-013's exact mechanism: team-level actions (create/rename/delete) are audited automatically from every origin because `RedminefluxPlatform::Team` includes the `Auditable` concern at the model level; `TeamMembership` does not include it, so its auditing depends entirely on the calling controller explicitly invoking `TeamService`, which only Platform's own controller does. See BUG-PLT-013's updated root-cause section for the full explanation and the 2 candidate fixes.

---

### TC-PLT-152: Team — Delete with real dependents (shift assignments / timesheets / workload allocations) — is it refused or does it orphan data?

**User Role:** Admin.
**Precondition:** TC-PLT-102/103/104 equivalent groundwork (a team with genuine dependent records in all three consumer plugins) — currently not set up; needs its own fixture creation as part of executing this TC.

**Steps:**
1. Attempt to delete a team that has real shift assignments, timesheet entries, and workload allocations tied to it (via its members).
2. Observe: refused with a clear reason, or allowed with dependent records left intact (per `PLATFORM_PLUGIN_TESTER_GUIDE.md`'s framing that removing a team should not affect the users/their history), or allowed with orphaned/broken references (a real bug if so).
3. DB: check the dependent tables (`rf_shift_assignments`-equivalent, `time_entries`, workload allocation tables) for any row still pointing at a now-nonexistent `team_id`.

**Expected Result:** Either a clear refusal, or a clean removal that leaves historical dependent records intact and pointing at *something* valid (e.g. the user directly, not a dangling team_id) — not a silent orphaned foreign key.

**Status:** NOT EXECUTED — this is the same intent as the original TC-PLT-111, still not run; it requires real fixture setup first (a team with genuine cross-plugin dependents), which has never been built this cycle.

---

### TC-PLT-203: Team — Add a member WITH a non-default Role/flags set at creation time (not via a later Edit) → verify the values themselves propagate, from each origin

**User Role:** Admin/Manager.
**Precondition:** A team exists (fresh fixture per origin — the earlier CRUD-matrix fixtures were deleted during TC-150/151).

**Why this TC exists:** TC-PLT-142/147/148/149 (the original "Add member" TCs) all added members with the Add form's fields left at default (Role = None/Member, `manage_workload`/`can_approve_leave` left unchecked) — the only place non-default Role/flag values were ever tested was in a *separate* Edit action afterward (TC-199/200), and that Edit UI only exists for 2 of the 4 origins (Workload, Timesheet). So the Add form's own Role/flag fields — which are visibly present on Platform's, Workload's, and Shift Management's Add modals too, not just Timesheet's plain one — were never exercised with a real, non-default value at the point of creation, from **any** origin. The user caught this gap directly (2026-09-30) by asking whether Add-time fields beyond just the user picker were ever tested.

**Steps:** For each origin (Platform, Workload, Timesheet, Shift Management):
1. Create a fresh disposable team from that origin.
2. Add a member using the Add form's **own** Role dropdown (and, where present, the `manage_workload`/`can_approve_leave` checkboxes) set to a **non-default** value in the same submission — not a follow-up edit.
3. Verify the Role/flag values set at add time are correct immediately in that origin's own view, then in every other plugin's view of the same member.
4. DB: `SELECT role_id, manage_workload, can_approve_leave FROM rf_team_memberships WHERE ...` matches what was set on the Add form, not a default.

**Expected Result:** Whatever Role/flags were chosen on the Add form itself are what gets saved and what propagates everywhere — not silently dropped to a default regardless of what the form's own field said.

**Status:** **EXECUTED 2026-09-30 — MIXED: PASS for Platform/Workload/Timesheet (share the same `role_id` concept), FAIL for Shift Management — see new BUG-PLT-014.** Created 4 fresh teams (`PLT-ROLE-Team-Platform` id 7, `-Workload` id 8, `-Timesheet` id 9, `-ShiftMgmt` id 10) and added one member to each with non-default Role/flags set directly on the Add form (not via a later Edit):
- **Platform** (team 7): added Isla Moon with Role=Manager, Manage workload=✓, Can approve leave=✓ — all 3 values correct immediately on Platform's own screen, and correctly propagated to Workload's and Timesheet's views. DB: `role_id=3, manage_workload=1, can_approve_leave=1`. **PASS.**
- **Workload** (team 8): added Selene Frost with Role=Developer, Can approve leave=✓ (Manage workload left unchecked). Correct on Workload's own screen and propagated correctly to Platform's and Timesheet's views. DB: `role_id=4, manage_workload=0, can_approve_leave=1`. **PASS.**
- **Timesheet** (team 9): added Summer Rain with Role=Reporter (Timesheet's Add form has no manage_workload/can_approve_leave checkboxes, confirmed consistent with TC-199/200's earlier finding). Correct on Timesheet's own screen and propagated correctly to Platform's and Workload's views. DB: `role_id=5`. **PASS.**
- **Shift Management** (team 10): added Willow Belle with Role=Lead (Shift Management's Add form has its own Member/Lead dropdown, distinct from the other 3's None/Manager/Developer/Reporter). Correct on Shift Management's own screen ("Lead"). **FAIL everywhere else** — Platform shows Role="—", Workload shows "-", Timesheet shows "-". DB explains why: `rf_team_memberships` has two separate columns, `role` (varchar, default 'member' — what Shift Management reads/writes) and `role_id` (int FK — what the other 3 plugins read/write). Team 10's row: `role='lead', role_id=NULL`. **Confirmed bidirectional**: also checked team 7 (Isla Moon, `role_id=3`/Manager set via Platform) from Shift Management's own screen — it shows Role="Member", the silent default, not "Manager". DB: `role='member'` (never touched), `role_id=3`. Filed as **BUG-PLT-014**.

---

# HOLIDAY SCHEME

Shared table: `rf_holiday_schemes`. Baseline fixtures: `PLT-BASELINE-Holiday Scheme` (id 1), `PLT-BASELINE-Shift Holiday Scheme` (id 2, currently active — do not leave a different scheme active after testing, always revert per TC-PLT-045's lesson).

## Create

### TC-PLT-153: Holiday Scheme — Create from Platform → verify in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/list/holiday_schemes` (confirm the exact create control during execution — not yet verified this screen has one), create `PLT-CRUD-Scheme-Platform`.
2. Verify it appears in Workload's Holiday Schemes list (`/rf_settings`) and Shift Management's (`/shift_management/holiday_schemas`).
3. DB: `SELECT id, name, is_active FROM rf_holiday_schemes WHERE name='PLT-CRUD-Scheme-Platform'` — exactly one row, `is_active=0` (a newly created scheme should not silently become active).

**Expected Result:** Single row, visible in both consumer plugins immediately, not auto-activated.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created `PLT-CRUD-Scheme-Platform` (id 3) via `/redmineflux_platform/list/holiday_schemes` → "New Holiday scheme" (a modal, "Make this the active scheme" checkbox left unchecked). DB: `rf_holiday_schemes` exactly 1 row, `is_active=0` (correctly not auto-activated). Confirmed in Workload's `/rf_settings` ("PLT-CRUD-Scheme-Platform — 0 holidays") and Shift Management's `/shift_management/holiday_schemas`.

---

### TC-PLT-154: Holiday Scheme — Create from Workload → verify in Platform, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Scheme-Workload` from `/rf_settings` → "Add Holiday Scheme".

**Expected Result:** Same as TC-PLT-153.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created `PLT-CRUD-Scheme-Workload` (id 4) via `/rf_settings` → "Add Holiday Scheme" ("Set as active scheme" left unchecked). DB: `rf_holiday_schemes` exactly 1 row, `is_active=0`. Confirmed in Platform's `/redmineflux_platform/list/holiday_schemes` and Shift Management's `/shift_management/holiday_schemas`.

---

### TC-PLT-155: Holiday Scheme — Create from Shift Management → verify in Platform, Workload, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Scheme-ShiftMgmt` from `/shift_management/holiday_schemas`.

**Expected Result:** Same as TC-PLT-153.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs, with a UI-default finding worth noting.** Created `PLT-CRUD-Scheme-ShiftMgmt` (id 5) via `/shift_management/holiday_schemas` → "New Schema". **Finding:** this form's "Active" checkbox defaults to **checked**, unlike Platform's and Workload's equivalent create forms, which both default to unchecked. Unchecked it deliberately before submitting to avoid silently deactivating the environment's current active scheme (`PLT-BASELINE-Shift Holiday Scheme`, id 2) — per the checkbox's own help text elsewhere in this UI, "only one scheme is active at a time," so submitting with the default would have deactivated the real active scheme. DB confirms: 5 rows total, new one `is_active=0`, original active scheme (id 2) still `is_active=1`, untouched. Confirmed in Platform's and Workload's lists. **This default-checked-Active behavior is a real risk for anyone creating a new schema from Shift Management without noticing the checkbox** — not filed as its own bug yet since this run deliberately avoided triggering the disruptive effect; flagged for the user to decide whether it's worth its own bug report.

## Update

### TC-PLT-156: Holiday Scheme — Activate/deactivate from Workload → verify reflected in Shift Management, Platform, DB

**User Role:** Admin.
**Precondition:** At least 2 schemes exist.

**Steps:**
1. Toggle the active scheme via Workload's own UI (the toggle + confirm-modal pattern already discovered during TC-PLT-045).
2. Check whether Shift Management's own UI (`/shift_management/holiday_schemas`) and Platform's own screen show the same active scheme immediately.
3. DB: `SELECT id, is_active FROM rf_holiday_schemes` — exactly one row has `is_active=1`, matching what was just set.
4. **Revert to the original active scheme afterward** (do not leave the environment in a changed state, per the lesson from TC-PLT-045).

**Expected Result:** Active-scheme state is consistent across all 3 surfaces, exactly one scheme active at a time, DB matches UI.

**Status:** PARTIALLY EXECUTED 2026-09-30 (as part of TC-PLT-045) — the toggle itself was confirmed to work correctly and was reverted properly. **Cross-verification in Shift Management's and Platform's own UI was never checked** — only the DB and the API's behavior were confirmed. This leg must still be run.

---

### TC-PLT-157: Holiday Scheme — Rename from Shift Management → verify in Workload, Platform, DB

**User Role:** Admin.
**Precondition:** A disposable scheme exists (e.g. from TC-PLT-155).

**Steps:** Rename it via Shift Management's own edit action, check Workload's and Platform's views update immediately, DB confirms the name change on the same row.

**Expected Result:** Consistent rename everywhere, one row updated in place.

**Status:** NOT EXECUTED

## Delete

### TC-PLT-158: Holiday Scheme — Delete an inactive, unused scheme from Platform → verify removal in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** A disposable, inactive scheme with no holidays attached exists.

**Steps:** Delete from Platform's own screen, confirm gone from Workload's and Shift Management's lists, DB row count = 0.

**Expected Result:** Clean removal everywhere.

**Status:** NOT EXECUTED

---

### TC-PLT-159: Holiday Scheme — Attempt to delete the currently-active scheme, or one with holidays attached — is it refused?

**User Role:** Admin.
**Precondition:** The active scheme, or a scheme with ≥1 holiday attached.

**Steps:** Attempt delete from any origin plugin. Observe refusal message or cascade behavior for its attached holidays.

**Expected Result:** Either refused with a clear reason (active scheme, or "N holidays attached"), or a clean cascade with no orphaned `rf_holidays` rows left pointing at a deleted `rf_holiday_scheme_id`. Document actual behavior — not specified by requirements.

**Status:** NOT EXECUTED

---

# HOLIDAY

Shared table: `rf_holidays`. Baseline fixtures: `PLT-BASELINE-Founders Day` (ids 1 and 3, one per scheme), `PLT-BASELINE-Recurring Holiday` (id 2). Do not delete these — use disposable fixtures for Delete TCs.

## Create

### TC-PLT-160: Holiday — Create from Platform → verify in Workload, Helpdesk, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/list/holidays` → "New Holiday", create `PLT-CRUD-Holiday-Platform` for a specific date.
2. Verify it appears in Workload's, Helpdesk's (`/rf_helpdesk_holidays`), and Shift Management's own holiday views.
3. Check `WorkingCalendar` recognizes the date as non-working (`GET /redmineflux_platform/api/v1/working_days/check?date=` — only meaningful if this holiday's scheme is the active one; note if it isn't, per the TC-PLT-045 scoping lesson).
4. DB: `SELECT id, name, date FROM rf_holidays WHERE name='PLT-CRUD-Holiday-Platform'` — exactly one row.

**Expected Result:** Single row, visible in all 3 consumer plugins, calendar-aware if in the active scheme, DB confirms one row.

**Status:** NOT EXECUTED

---

### TC-PLT-161: Holiday — Create from Workload → verify in Platform, Helpdesk, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Holiday-Workload` from Workload's own holiday-create screen.

**Expected Result:** Same as TC-PLT-160.

**Status:** NOT EXECUTED

---

### TC-PLT-162: Holiday — Create from Helpdesk → verify in Platform, Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Holiday-Helpdesk` from `/rf_helpdesk_holidays/new`.

**Expected Result:** Same as TC-PLT-160.

**Status:** PARTIALLY EXECUTED 2026-09-30 — `HD-Native-Holiday-Verify` was created and confirmed in Helpdesk's own list, then deleted. **Cross-plugin verification (Workload/Shift Management/Platform) and the DB query were never performed** before deletion — must be re-run properly.

---

### TC-PLT-163: Holiday — Create from Shift Management → verify in Platform, Workload, Helpdesk, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Holiday-ShiftMgmt` via the Holiday Schemes tab's "Add Holiday" action.

**Expected Result:** Same as TC-PLT-160.

**Status:** NOT EXECUTED

## Update

### TC-PLT-164: Holiday — Update (change date) from Helpdesk → verify in Workload, Shift Management, Platform, WorkingCalendar, DB

**User Role:** Admin.
**Precondition:** A disposable holiday exists.

**Steps:**
1. Change its date from Helpdesk's own edit screen.
2. Check the new date shows in Workload's, Shift Management's, Platform's views.
3. Check `WorkingCalendar` no longer flags the *old* date as a holiday, and does flag the *new* date (if in the active scheme).
4. DB: `updated_at` changed, `date` matches the new value, still one row (not a duplicate).

**Expected Result:** Consistent update everywhere including the calendar calculation, one row updated in place.

**Status:** NOT EXECUTED

---

### TC-PLT-165: Holiday — Update from Workload/Shift Management → verify everywhere, DB

**User Role:** Admin.
**Precondition:** A disposable holiday per origin.

**Steps:** Same method as TC-PLT-164, once from Workload's own edit and once from Shift Management's own edit.

**Expected Result:** Same as TC-PLT-164, for each origin.

**Status:** NOT EXECUTED

## Delete

### TC-PLT-166: Holiday — Delete an unused holiday from Platform → verify removal everywhere, DB

**User Role:** Admin.
**Precondition:** A disposable holiday with no scheme actively depending on it for calculations already run.

**Steps:** Delete from Platform's screen, confirm gone from Workload/Helpdesk/Shift Management, DB row count = 0, `WorkingCalendar` no longer flags that date.

**Expected Result:** Clean removal, calendar recalculates correctly.

**Status:** NOT EXECUTED

---

### TC-PLT-167: Holiday — Delete a holiday actively used in a live capacity/calendar view — does it corrupt anything?

**User Role:** Admin.
**Precondition:** Same intent as the original TC-PLT-112 — a holiday whose absence would change an already-rendered Workload capacity figure or Shift Management calendar view for that period.

**Steps:** Delete it, immediately re-check the dependent view (capacity report, shift calendar) for the same date range.

**Expected Result:** Recalculates cleanly to reflect the date now being a working day again — no crash, no stale count.

**Status:** NOT EXECUTED (this is the original TC-PLT-112, still not run)

---

# LEAVE TYPE

Shared table: `rf_leave_types`. Baseline fixture: `PLT-BASELINE-Sabbatical` (id 1). **Create is currently broken from Shift Management (`BUG-PLT-012`)** — Platform's own screen is the only currently-viable origin for fresh Create testing until that's fixed.

## Create

### TC-PLT-168: Leave Type — Create from Platform → verify in Workload (dropdown), Shift Management (list + dropdown), DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/list/leave_types` → create `PLT-CRUD-LeaveType-Platform`.
2. Verify it appears in Shift Management's Leave Types list (`/shift_management/leave?tab=types`) and in the Leave Type dropdown of both Shift Management's Apply Leave and Workload's Request Leave forms.
3. DB: `SELECT id, name FROM rf_leave_types WHERE name='PLT-CRUD-LeaveType-Platform'` — exactly one row.

**Expected Result:** Single row, visible in Shift Management's list and both plugins' dropdowns immediately.

**Status:** NOT EXECUTED

---

### TC-PLT-169: Leave Type — Create from Shift Management → verify in Platform, Workload (dropdown), DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, via `/shift_management/leave?tab=types` → "New Leave Type".

**Expected Result:** Same as TC-PLT-168.

**Status:** **CONFIRMED FAIL 2026-09-30** — `BUG-PLT-012`. Same execution as TC-PLT-046's step 3; cross-referenced here rather than re-run, since the failure is identical and blocks the flow at the same point (400 before save).

## Update

### TC-PLT-170: Leave Type — Update (rename, change accrual rule) from Platform → verify in Shift Management, dropdowns, DB

**User Role:** Admin.
**Precondition:** A disposable leave type exists (from TC-PLT-168, since 169 is blocked).

**Steps:** Rename it and change one accrual-related field from Platform's edit screen, check Shift Management's list and both plugins' dropdowns reflect the new name, DB confirms one row updated.

**Expected Result:** Consistent update everywhere.

**Status:** NOT EXECUTED

---

### TC-PLT-171: Leave Type — Update from Shift Management → verify in Platform, dropdowns, DB

**User Role:** Admin.
**Precondition:** A disposable leave type exists.

**Steps:** Same method via Shift Management's own edit screen.

**Expected Result:** Same as TC-PLT-170. **Likely blocked by the same `update_leave_type_params`/`leave_type_params` defect as `BUG-PLT-012`** (the bug file already notes `update` reuses the identical broken method) — confirm this explicitly when executed, since it would be direct additional evidence for that bug rather than a new one.

**Status:** NOT EXECUTED

## Delete

### TC-PLT-172: Leave Type — Delete an unused type from Platform → verify removal in Shift Management, dropdowns, DB

**User Role:** Admin.
**Precondition:** A disposable, unused leave type exists.

**Steps:** Delete from Platform's screen, confirm gone from Shift Management's list and both dropdowns, DB row count = 0.

**Expected Result:** Clean removal everywhere.

**Status:** NOT EXECUTED

---

### TC-PLT-173: Leave Type — Attempt to delete a type with existing Leave records referencing it — refused or orphaning?

**User Role:** Admin.
**Precondition:** A leave type with at least one real `rf_leaves` row using it (e.g. `PLT-BASELINE-Sabbatical`, id 1 — read-only inspection is fine, do not actually attempt the delete on this real fixture without first confirming a guard exists via source, same caution as TC-PLT-110's Organization approach).

**Steps:** Check source for a destroy guard on `RedminefluxPlatform::LeaveType` analogous to Organization's; if one exists confirm its condition against real data without live-deleting the baseline fixture. If none exists, test on a disposable type + disposable leave record instead.

**Expected Result:** Either refused with a clear reason, or existing Leave records keep a valid (if now-orphaned-looking) `leave_type_id` reference that doesn't crash the Leave's own display — document actual behavior.

**Status:** NOT EXECUTED

---

# LEAVES

Shared table: `rf_leaves`. **Create is broken from Shift Management (`BUG-PLT-009`/`BUG-PLT-010`) and Workload (`BUG-PLT-011`)** — Platform's own screen is the only currently-viable origin.

## Create

### TC-PLT-174: Leaves — Create from Platform → verify in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. (Supersedes/completes TC-PLT-098+101 — 098 confirmed Platform's own create works, but 101's cross-plugin verification of that same record was never actually done.)

**Steps:**
1. From `/redmineflux_platform/list/leaves/new`, create a leave for a specific user/date range/reason tagged `PLT-CRUD-Leave-Platform`.
2. Verify it appears in Workload's Leave list (`/rf_leaves`) and Shift Management's Leave list (`/shift_management/leave`).
3. DB: `SELECT id, reason, status FROM rf_leaves WHERE reason='PLT-CRUD-Leave-Platform'` — exactly one row.

**Expected Result:** Single row, visible in both consumer plugins immediately.

**Status:** NOT EXECUTED (this specific cross-verification leg — TC-PLT-101 — was never actually run; only the Platform-side creation itself, TC-PLT-098, was confirmed)

---

### TC-PLT-175: Leaves — Create from Workload → verify in Platform, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method via Workload's "+ Request Leave".

**Expected Result:** Same as TC-PLT-174.

**Status:** **CONFIRMED FAIL 2026-09-30** — `BUG-PLT-011`. Cross-referenced from TC-PLT-100; not re-run since the failure is identical and pre-save.

---

### TC-PLT-176: Leaves — Create from Shift Management → verify in Platform, Workload, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method via Shift Management's "Apply Leave".

**Expected Result:** Same as TC-PLT-174.

**Status:** **CONFIRMED FAIL 2026-09-30** — `BUG-PLT-009`/`BUG-PLT-010`. Cross-referenced from TC-PLT-099.

## Update

### TC-PLT-177: Leaves — Update (change dates/reason) from Platform → verify in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** A leave exists (from TC-PLT-174).

**Steps:** Edit its dates/reason from Platform's screen, check both consumer plugins reflect the change, DB confirms one row updated (not duplicated).

**Expected Result:** Consistent update everywhere.

**Status:** NOT EXECUTED

## Delete / Status Transitions

### TC-PLT-178: Leaves — Approve from Platform → verify status in Workload, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A pending leave exists.

**Steps:** Approve it from Platform's screen, check both consumer plugins show it as Approved (not still Pending), and that Approve is no longer offered anywhere. DB: `status='approved'`, `approved_by_id`/`approved_at` populated.

**Expected Result:** Consistent status everywhere, DB fields populated correctly.

**Status:** NOT EXECUTED

---

### TC-PLT-179: Leaves — Reject (with reason) from Platform → verify reason/status in Workload, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A pending leave exists.

**Steps:** Reject with a real reason, check the reason text appears identically in both consumer plugins, DB confirms `status='rejected'` and the reason column populated.

**Expected Result:** Consistent everywhere, reason text not lost/truncated in either plugin's display.

**Status:** NOT EXECUTED

---

### TC-PLT-180: Leaves — Cancel/Delete from Platform → verify removal in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** A leave exists (approved or pending, per whatever the real Cancel action supports).

**Steps:** Cancel/delete it from Platform's screen, confirm gone (or correctly marked Cancelled) from both consumer plugins, DB reflects the same final state.

**Expected Result:** Consistent removal/state everywhere.

**Status:** NOT EXECUTED

---

# ORGANIZATIONS

Shared table: `rf_organizations`. Baseline fixture: `PLT-BASELINE-Acme Corp` (id 1, has a real dependent `rf_project_customers` row — do not delete). Most of this entity's matrix is already executed — see cross-references below; the gaps are specifically Platform's own screen never being used as an origin or a check-point.

## Create

### TC-PLT-181: Organizations — Create from Platform → verify in CRM, Helpdesk, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/list/organizations` → create `PLT-CRUD-Org-Platform`.
2. Verify it appears in CRM's Companies list and Helpdesk's Organization list.
3. DB: exactly one `rf_organizations` row.

**Expected Result:** Single row, visible in both consumer plugins immediately.

**Status:** NOT EXECUTED — this specific leg (Platform as origin) was never run; TC-PLT-062/063/064 covered CRM↔Helpdesk in both directions but never Platform's own screen.

---

### TC-PLT-182: Organizations — Create from CRM → verify in Platform, Helpdesk, DB

**Status:** **EXECUTED, PASS** — see `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-062/063 (`PLT-CRUD-TestOrg`, created via CRM, confirmed in Helpdesk, DB verified). **Gap**: Platform's own screen was never checked for this record before it was deleted.

---

### TC-PLT-183: Organizations — Create from Helpdesk → verify in Platform, CRM, DB

**Status:** Partially covered by TC-PLT-064 (form-submit confirmed) but that reused the CRM-created fixture rather than a fresh Helpdesk-origin creation, and never checked Platform's screen. **NOT EXECUTED** as a clean Helpdesk-origin case.

## Update

### TC-PLT-184: Organizations — Update from Platform's own edit screen → verify in CRM, Helpdesk, DB

**Status:** NOT EXECUTED — TC-PLT-060 covered Helpdesk→CRM update propagation; Platform's own edit screen was never used as the origin.

## Delete

### TC-PLT-185: Organizations — Delete from Platform's own screen (no dependents) → verify removal in CRM, Helpdesk, DB

**Status:** NOT EXECUTED — TC-PLT-060/063's cleanup deleted `PLT-CRUD-TestOrg` via CRM's own screen, not Platform's.

---

### TC-PLT-186: Organizations — Delete with dependents, attempted from Platform's own screen — does the guard still fire?

**User Role:** Admin.
**Precondition:** `PLT-BASELINE-Acme Corp` (has a real `rf_project_customers` dependent, confirmed via TC-PLT-110).

**Steps:** From Platform's own Organization detail screen, attempt Delete. Since the guard is a model-level `before_destroy` callback (confirmed in TC-PLT-110), it should fire identically regardless of origin controller — but this has only been confirmed for CRM's controller path, not Platform's own.

**Expected Result:** Refused, same as TC-PLT-110, confirming the guard is genuinely origin-agnostic.

**Status:** NOT EXECUTED (same caution as TC-PLT-110 — do this via source/data inspection first if a live attempt feels risky, but Platform's own controller path specifically has never been checked, only CRM's)

---

# CONTACTS

Shared table: `rf_crm_contacts`. Baseline fixture: `PLT-BASELINE-Jane Doe` (id 1, linked to the merged Organization and to Invoice's billing settings — do not delete). **This entity has the weakest existing coverage of all 8** — only TC-PLT-041 (migration survival) and TC-PLT-066 (Organization-Contact linking) exist; no Organizations-style Create/Update/Delete matrix has ever been written or run for Contacts specifically.

## Create

### TC-PLT-187: Contacts — Create from Platform → verify in CRM, Invoice's contact-selection dropdown, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From `/redmineflux_platform/list/contacts` → create `PLT-CRUD-Contact-Platform`.
2. Verify it appears in CRM's Contacts list.
3. Verify it appears as a selectable option in Invoice's Billing Settings "Contact" dropdown (the same screen used in TC-PLT-041).
4. DB: exactly one `rf_crm_contacts` row.

**Expected Result:** Single row, visible in CRM's list and Invoice's dropdown immediately.

**Status:** NOT EXECUTED

---

### TC-PLT-188: Contacts — Create from CRM → verify in Platform, Invoice's dropdown, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method via CRM's `/contacts/new`.

**Expected Result:** Same as TC-PLT-187.

**Status:** NOT EXECUTED

---

### TC-PLT-189: Contacts — Confirm Invoice genuinely has no independent Create path (negative/architecture check)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Attempt to find any "New Customer"/"New Contact" entry point inside Invoice's own UI (settings, project billing, anywhere).

**Expected Result:** None exists — per `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-004, `/customers` redirects to `/contacts` and Invoice's own billing form only offers a *selection* dropdown, never a create action. Confirm this still holds post-upgrade (it was only confirmed pre-upgrade at `master`, never re-checked on the `redmineflux_platform` branch specifically).

**Status:** NOT EXECUTED (re-verification of a pre-upgrade finding, on the current branch)

## Update

### TC-PLT-190: Contacts — Update from Platform → verify in CRM, Invoice's billing display, DB

**User Role:** Admin.
**Precondition:** A disposable contact exists.

**Steps:** Edit its email/phone from Platform's screen, check CRM's detail view and Invoice's billing-settings display (which shows Email/Phone alongside the dropdown, confirmed in TC-PLT-041) both update immediately, DB confirms one row updated.

**Expected Result:** Consistent update everywhere.

**Status:** NOT EXECUTED

---

### TC-PLT-191: Contacts — Update from CRM → verify in Platform, Invoice's billing display, DB

**Status:** NOT EXECUTED

## Delete

### TC-PLT-192: Contacts — Delete an unused contact from Platform → verify removal in CRM, DB

**User Role:** Admin.
**Precondition:** A disposable contact with no Organization link, no Invoice billing-settings reference.

**Steps:** Delete from Platform's screen, confirm gone from CRM's list, DB row count = 0.

**Expected Result:** Clean removal.

**Status:** NOT EXECUTED

---

### TC-PLT-193: Contacts — Attempt to delete a contact referenced by a project's Invoice billing settings — refused or orphaning?

**User Role:** Admin.
**Precondition:** `PLT-BASELINE-Jane Doe`, referenced by `plt-baseline-project`'s Billing Settings (confirmed in TC-PLT-041) — **do not actually delete this real fixture**; check for a destroy guard via source first (analogous to Organization's `register_destroy_guard`), same caution as TC-PLT-110/186. If none exists, build a disposable contact + disposable project billing link to test safely instead.

**Expected Result:** Either refused with a clear reason, or the project's Billing Settings correctly falls back to "-- Select Contact --" rather than silently showing a broken/blank reference.

**Status:** NOT EXECUTED

---

# AUDIT EVENTS

Shared table: `rf_audit_events`. No entity has a direct "create" form — every row is a side effect of some other action elsewhere. The matrix here is therefore about **which plugin's actions generate a row, and whether Platform's unified view picks it up correctly**, not about a Create/Update/Delete UI of its own (Update/Delete are already confirmed refused everywhere, TC-PLT-050).

### TC-PLT-194: Audit Events — An action in Team management (any origin plugin) generates a correctly-attributed row, visible in Platform

**Status:** **De facto confirmed via side effects 2026-09-30** — this session's own Team create/delete actions (Shift Management origin) produced `rf_audit_events` rows (ids 20, 21: `created`/`deleted`, `RedminefluxPlatform::Team`), visible in Platform's unified view. Not a dedicated, deliberate walkthrough with screenshot evidence — informal confirmation only.

---

### TC-PLT-195: Audit Events — An action in Holiday management (any origin plugin) generates a correctly-attributed row, visible in Platform

**Status:** **De facto confirmed via side effects** — this session's Holiday create/update/delete actions (Helpdesk and Platform origins) produced rows (ids 5, 7, 8, 9, 10, 22, 23), visible in Platform's unified view.

---

### TC-PLT-196: Audit Events — An action in Leave management (any origin plugin) generates a correctly-attributed row, visible in Platform

**Status:** **De facto confirmed via side effects** — Leave create/update actions (Platform origin, the only working one) produced rows (ids 12–19, 24, 25), visible in Platform's unified view.

---

### TC-PLT-197: Audit Events — An action in Settings (any plugin) generates a correctly-attributed row, visible in Platform, with correct source-table linkage

**Status:** **De facto confirmed** — `rf_audit_events` id 1 (`settings_update`, `source_timesheet_audit_log_id=1`) confirms this, per TC-PLT-049's finding.

---

### TC-PLT-198: Audit Events — A deliberate, dedicated walkthrough with screenshot evidence (not just side-effect inference)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Deliberately perform one clean, isolated action per major entity (Team create, Holiday update, Leave approve, Organization edit).
2. For each, immediately open Platform's Audit Events list and confirm the new row, its exact action/actor/timestamp, with a screenshot as evidence (per CLAUDE.md §6, screenshots are for bugs only — so only screenshot if something looks wrong; otherwise just record the row content directly in this file).
3. TC-PLT-131/132 from `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`: confirm a deleted record's audit row shows its actual name (not a bare class+id), and confirm searching by that name in the Audit list finds it.

**Expected Result:** Every action generates exactly one correctly-attributed row, findable by name, with sensible content — a deliberate confirmation superseding the informal side-effect evidence in TC-PLT-194–197.

**Status:** NOT EXECUTED as a dedicated pass

---

## Coverage Matrix

| Entity | Source Plugin | Create | Read | Update | Delete | Cross-Plugin Verification | DB Verification | Status |
|---|---|---|---|---|---|---|---|---|
| Team | Platform | ✅ PASS (TC-142) | ✅ | Rename ✅ (TC-146); member Remove ✅ propagation + ✅ audit (TC-201, control case); Add-time Role/flags ✅ propagation (TC-203); no per-member Edit UI exists on this origin | ✅ PASS, incl. audit (TC-150) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit PARTIAL (BUG-PLT-013); Role cross-plugin display PARTIAL (BUG-PLT-014, this origin's `role_id` not read by Shift Mgmt) |
| Team | Workload | ✅ PASS (TC-143) | ✅ | Member Add/Edit/Remove all ✅ propagation / ❌ audit (BUG-PLT-013, TC-147/199/202); Add-time Role/flags ✅ propagation (TC-203) | ✅ PASS, incl. audit (TC-151) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit FAIL (BUG-PLT-013); Role cross-plugin display PARTIAL (BUG-PLT-014, same reason) |
| Team | Timesheet | ✅ PASS (TC-144) | ✅ | Member Add/Edit/Remove all ✅ propagation / ❌ audit (BUG-PLT-013, TC-148/200/202); Add-time Role ✅ propagation (TC-203) | ✅ PASS, incl. audit (TC-151) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit FAIL (BUG-PLT-013); Role cross-plugin display PARTIAL (BUG-PLT-014, same reason) |
| Team | Shift Management | ✅ PASS (TC-145) | ✅ | Member Add/Remove ✅ propagation / ❌ audit (BUG-PLT-013, TC-149/202); Add-time Role ❌ (BUG-PLT-014 — "Lead" set here is invisible in the other 3 plugins, TC-203); no per-member Edit UI exists on this origin | ✅ PASS, incl. audit (TC-151) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit FAIL (BUG-PLT-013); Role cross-plugin display FAIL (BUG-PLT-014) |
| Team | (all 4 origins) | | | | Delete-with-real-dependents NOT TESTED (TC-152, needs dedicated fixture setup) | | | NOT EXECUTED |
| Holiday Scheme | Platform | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Holiday Scheme | Workload | NOT TESTED | ✅ | Partial (DB only) | NOT TESTED | Partial | ✅ (DB) | PARTIAL |
| Holiday Scheme | Shift Management | NOT TESTED | ✅ | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Holiday | Platform | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Holiday | Workload | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Holiday | Helpdesk | Partial (no cross-check) | ✅ (own screen only) | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | PARTIAL |
| Holiday | Shift Management | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Leave Type | Platform | NOT TESTED | ✅ (dropdown) | NOT TESTED | NOT TESTED | Partial (dropdown only) | NOT TESTED | PARTIAL |
| Leave Type | Shift Management | ❌ FAIL (BUG-PLT-012) | ✅ (dropdown) | Blocked (same defect) | NOT TESTED | N/A (create blocked) | N/A | FAIL |
| Leaves | Platform | ✅ PASS | ✅ | NOT TESTED | NOT TESTED | Not re-verified (TC-101 gap) | Partial | PARTIAL |
| Leaves | Workload | ❌ FAIL (BUG-PLT-011) | ✅ | N/A | N/A | N/A | ✅ (no orphan confirmed) | FAIL |
| Leaves | Shift Management | ❌ FAIL (BUG-PLT-009/010) | ✅ | N/A | N/A | N/A | ✅ (record created despite crash) | FAIL |
| Organizations | Platform | NOT TESTED | ✅ (passive) | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Organizations | CRM | ✅ PASS | ✅ | ✅ PASS | ✅ PASS (clean) | ✅ PASS | ✅ PASS | PASS |
| Organizations | Helpdesk | ✅ PASS | ✅ | ✅ PASS | Guard confirmed (source+data, not live) | ✅ PASS | ✅ PASS | PASS |
| Contacts | Platform | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Contacts | CRM | NOT TESTED (fresh) | ✅ (pre-existing only) | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT EXECUTED |
| Contacts | Invoice | N/A (no create UI) | ✅ (dropdown, pre-existing) | N/A | N/A | Partial (pre-existing only) | NOT TESTED | PARTIAL |
| Audit Events | (all, via side effect) | N/A (automatic) | ✅ (informal, via side effects) | ✅ Refused, PASS | ✅ Refused, PASS | Informal only | NOT TESTED (dedicated) | PARTIAL |

**Honest read of this matrix**: **Team and Organizations are now the fully-executed row sets** (Team is not fully-PASS — see below — but every TC in its section bar one is executed with real evidence). Team's Create (TC-142–145), Update-rename (TC-146), full membership CRUD — add/edit/remove (TC-147–149, 199–202) — and Delete-with-no-dependents (TC-150–151) are all executed across every applicable origin. Functional propagation to Platform + every consumer plugin + DB is a clean PASS in every single one of these. The audit trail, however, is a confirmed, systematic FAIL for team-membership mutations specifically (BUG-PLT-013): Workload, Timesheet, and Shift Management each reimplement team-membership persistence directly in their own controllers instead of calling Platform's shared `TeamService`, so none of their add/edit/remove actions ever produce an audit event, while the identical actions on Platform's own screen — and team-level create/rename/delete from **any** origin — do, because `Team` (unlike `TeamMembership`) includes the `Auditable` concern at the model level. Three of the membership TCs (editing an existing member's role, removing a single member, and adding a member WITH non-default Role/flags set on the Add form itself rather than a later Edit) were missing from this matrix entirely until the user caught the gaps on 2026-09-30 — worth remembering, since it means the matrix was not as complete as its "sare testcase likh lo pehele" mandate required on first pass. Both follow-up questions found real, distinct, confirmed defects a first pass missed: BUG-PLT-013 from the edit/remove gap, and **BUG-PLT-014** from the Add-time-fields gap — Shift Management's "Role" (Member/Lead) and the other 3 plugins' "Role" (None/Manager/Developer/Reporter) turn out to be two entirely disconnected database columns (`role` vs `role_id`) on the same shared `rf_team_memberships` table, so a Role set through one is silently invisible through the other, in both directions. Only TC-PLT-152 (delete a team with real cross-plugin dependents) remains unexecuted in the whole Team section — it needs its own fixture build (real shift assignments + timesheet entries + workload allocations tied to a team) and is deliberately deferred rather than rushed. Everything outside Team is either NOT EXECUTED, PARTIAL (one direction done, the reverse or the cross-check missing), or a confirmed FAIL. This file's job now is to drive execution until every cell that can legitimately reach PASS does — the FAIL rows (Leave Type/Shift Mgmt, Leaves/Workload, Leaves/Shift Mgmt, Team membership-mutation audit trail) stay FAIL until their respective bugs are fixed, and should be retested against this same matrix once they are.
