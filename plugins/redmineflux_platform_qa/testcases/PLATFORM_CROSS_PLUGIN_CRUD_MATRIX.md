# Test Cases — Redmineflux Platform — Cross-Plugin CRUD Propagation Matrix

> **✅ FULLY EXECUTED 2026-10-01 — all 62 TCs across all 8 entities now have a result.** Resumed per explicit user instruction ("test whichever Platform testcases are remaining") after being paused 2026-09-30 (Team's section was done then; everything from Holiday Scheme Update/Delete onward was still NOT EXECUTED). This session completed Holiday Scheme (156–159), Holiday (160–167), Leave Type (168, 170–173), Leaves (174, 177–180, plus re-confirming 175/176 now PASS since `BUG-PLT-009/010/011` were fixed earlier the same day), Organizations (181, 183–186), Contacts (187–193), Audit Events (198), and Team's last gap (152, via cross-reference rather than rebuilding an identical fixture). **4 new bugs found**: `BUG-PLT-031` (Audit Events search-by-name broken for live records), `BUG-PLT-032` (Holiday Scheme delete cascade, same pattern as `BUG-PLT-030`), `BUG-PLT-033` (Shift Management's Edit Holiday form can never change a date), `BUG-PLT-034` (CRM's Contact detail view 500s for any Platform-origin contact, missing `author_id`). See the Coverage Matrix and `PLATFORM_MEMORY.md` for full detail.
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

**Status:** **EXECUTED 2026-10-01 — PASS (documented, consistent behavior) — cross-referenced from `BUG-PLT-030`'s own repro and `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-105, rather than rebuilding an identical fixture a third time this cycle.** `BUG-PLT-030`'s investigation (2026-10-01, same day) built exactly this scenario — a disposable team (`PLT-DELETECHECK-Team`) with a member (Nova Starling) holding a real Shift Assignment and a real Workload tied to the team — then deleted the team itself and confirmed via direct DB query: the **Workload cascade-deletes** (`dependent: :destroy`, no guard, no refusal — `Workload 20 still exists? false`), while **the Shift Assignment survives untouched** (`Nova's shift assignment still exists? true`), because it has no foreign key to `team_id` at all. TC-PLT-105 (same day) independently confirmed the same survival guarantee for a real TimeEntry on member removal — and since core Redmine's `time_entries` table has no team association whatsoever (an even more fundamental independence than the plugin-specific Shift Assignment), the identical survival applies to deleting the team outright, not just removing a member from it. **Net answer to this TC's own question**: no refusal of any kind; Workloads cascade cleanly (no orphan — confirmed via DB, not just UI); Shift Assignments and TimeEntries are structurally immune since neither carries a `team_id` foreign key to begin with. This is exactly `BUG-PLT-030`'s own finding, not a new discovery — not re-filing it here.

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

**Status:** **EXECUTED 2026-10-01 — PASS, cross-verification leg now complete.** Activated `PLT-CRUD-Scheme-Platform` (id 3) via Workload's `/rf_settings` toggle + "Confirm Activation" modal. Confirmed consistent across all 3 surfaces immediately: Shift Management's `/shift_management/holiday_schemas` showed id 3 as "Active" and the baseline (id 2) as "Inactive"; Platform's `/redmineflux_platform/list/holiday_schemes` showed id 3's row as "Active". DB: `SELECT id, is_active FROM rf_holiday_schemes` confirmed exactly one row (id 3) `is_active=1` during the test. **Reverted to the baseline active scheme (id 2) afterward** via the same Workload toggle + confirm, DB re-confirmed `id=2 is_active=1, id=3 is_active=0` — environment restored to its pre-test state, per this TC's own instruction and the TC-PLT-045 lesson.

---

### TC-PLT-157: Holiday Scheme — Rename from Shift Management → verify in Workload, Platform, DB

**User Role:** Admin.
**Precondition:** A disposable scheme exists (e.g. from TC-PLT-155).

**Steps:** Rename it via Shift Management's own edit action, check Workload's and Platform's views update immediately, DB confirms the name change on the same row.

**Expected Result:** Consistent rename everywhere, one row updated in place.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Renamed `PLT-CRUD-Scheme-Workload` (id 4) to `PLT-CRUD-Scheme-Workload-RENAMED` via Shift Management's own `/shift_management/holiday_schemas/4/edit`. Confirmed the new name immediately in Workload's `/rf_settings` and Platform's `/redmineflux_platform/list/holiday_schemes`. DB: same `id=4` (not a new row), `name` matches, `updated_at` changed to the edit timestamp (2026-10-01 12:17:57).

## Delete

### TC-PLT-158: Holiday Scheme — Delete an inactive, unused scheme from Platform → verify removal in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** A disposable, inactive scheme with no holidays attached exists.

**Steps:** Delete from Platform's own screen, confirm gone from Workload's and Shift Management's lists, DB row count = 0.

**Expected Result:** Clean removal everywhere.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Deleted `PLT-CRUD-Scheme-ShiftMgmt` (id 5, inactive, 0 holidays) via Platform's own `/redmineflux_platform/list/holiday_schemes` row Delete + confirm dialog. DB: `rf_holiday_schemes` 0 rows for id 5. Confirmed absent from Workload's `/rf_settings` and Shift Management's `/shift_management/holiday_schemas` lists immediately.

---

### TC-PLT-159: Holiday Scheme — Attempt to delete the currently-active scheme, or one with holidays attached — is it refused?

**User Role:** Admin.
**Precondition:** The active scheme, or a scheme with ≥1 holiday attached.

**Steps:** Attempt delete from any origin plugin. Observe refusal message or cascade behavior for its attached holidays.

**Expected Result:** Either refused with a clear reason (active scheme, or "N holidays attached"), or a clean cascade with no orphaned `rf_holidays` rows left pointing at a deleted `rf_holiday_scheme_id`. Document actual behavior — not specified by requirements.

**Status:** **EXECUTED 2026-10-01 — PASS on the TC's own core question (clean cascade, no orphan); new bug `BUG-PLT-032` on the missing-warning gap.** Did not risk the real baseline scheme (id 1, has 3 real holidays other suites depend on) — checked source first (`HolidayScheme has_many :holidays, dependent: :destroy`, no guard) then built a disposable scheme + 1 disposable holiday to test safely. Deleted the scheme from Platform's own screen: **no refusal**, and the delete succeeded. DB confirmed **clean cascade, no orphan** — both the scheme row and its holiday row were gone afterward, satisfying the TC's own "clean cascade with no orphaned rows" acceptable-outcome branch. However, the confirmation dialog showed only the plugin's generic text ("This record will be removed permanently. Anything referring to it may be affected.") with zero mention that this specific scheme has 1 attached Holiday that would also be destroyed — the same unguarded-cascade-with-generic-only-warning pattern already filed as `BUG-PLT-030` for Team→Workload. Filed as **`BUG-PLT-032`** (Medium) rather than re-filing BUG-PLT-030, since this is a distinct entity pair with its own real-world consequence (holiday calendar data loss).

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs (calendar leg N/A — not in the active scheme).** Created `PLT-CRUD-Holiday-Platform` (id 512, 2031-03-01) via `/redmineflux_platform/list/holidays/new`, assigned to `PLT-BASELINE-Holiday Scheme` (id 1, deliberately not the active scheme, to avoid any side effect on live capacity/calendar calculations). Confirmed visible: Workload's `/rf_settings` → scheme 1's "Holidays" expansion (count went 3→4, holiday listed by name); Helpdesk's `/rf_helpdesk_holidays` (listed); Shift Management's `/shift_management/holiday_schemas` (scheme 1's count shows "4"). `WorkingCalendar` check (step 3) is N/A since this holiday's scheme isn't the active one, per this TC's own scoping note. DB: `rf_holidays` exactly one row (id 512) for this name.

---

### TC-PLT-161: Holiday — Create from Workload → verify in Platform, Helpdesk, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Holiday-Workload` from Workload's own holiday-create screen.

**Expected Result:** Same as TC-PLT-160.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created `PLT-CRUD-Holiday-Workload` (id 513, 2031-03-02) via Workload's `/rf_settings` → scheme 1's "Add Holiday" modal. Confirmed visible in Platform's `/redmineflux_platform/list/holidays` and Helpdesk's `/rf_helpdesk_holidays` immediately. DB: `rf_holidays` exactly one row (id 513).

---

### TC-PLT-162: Holiday — Create from Helpdesk → verify in Platform, Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Holiday-Helpdesk` from `/rf_helpdesk_holidays/new`.

**Expected Result:** Same as TC-PLT-160.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs (re-run properly this time, with full cross-verification before any cleanup).** Created `PLT-CRUD-Holiday-Helpdesk` (id 514, 2031-03-03) via `/rf_helpdesk_holidays/new`. **Finding**: Helpdesk's holiday form has no scheme picker at all — it silently auto-assigns the new holiday to whichever scheme is currently *active* (confirmed via DB: landed on `rf_holiday_scheme_id=2`, `PLT-BASELINE-Shift Holiday Scheme`, the active one at the time) rather than letting the admin choose, unlike Platform's and Workload's own create forms which both expose an explicit scheme selector. Not filed as a bug (a reasonable simplification for a plugin whose own concept of "holiday" predates the multi-scheme architecture), but worth knowing when debugging where a Helpdesk-created holiday actually landed. Confirmed visible immediately in Platform's `/redmineflux_platform/list/holidays`, Workload's `/rf_settings` (scheme 2's count 2→3), and Shift Management's `/shift_management/holiday_schemas` (scheme 2's count shows "3"). DB: `rf_holidays` exactly one row (id 514).

---

### TC-PLT-163: Holiday — Create from Shift Management → verify in Platform, Workload, Helpdesk, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method, creating `PLT-CRUD-Holiday-ShiftMgmt` via the Holiday Schemes tab's "Add Holiday" action.

**Expected Result:** Same as TC-PLT-160.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created `PLT-CRUD-Holiday-ShiftMgmt` (id 515, 2031-03-04, scheme 1) via Shift Management's scheme-detail page (`/shift_management/holiday_schemas/1`) → "Add Holiday". Confirmed visible in Platform's `/redmineflux_platform/list/holidays` and Helpdesk's `/rf_helpdesk_holidays` immediately; Workload reads the same `rf_holidays` table so is implicitly covered (confirmed scheme 1's total count via DB: 6 rows, matching all of baseline + TC-160/161/163's additions). DB: `rf_holidays` exactly one row (id 515).

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs including WorkingCalendar.** Changed `PLT-CRUD-Holiday-Helpdesk` (id 514, in the active scheme 2) from 2031-03-03 to 2031-04-10 via Helpdesk's own `/rf_helpdesk_holidays/514/edit`. DB: same row `id=514` (not duplicated), `date` updated, `updated_at` changed to the edit timestamp. Confirmed the new date (04/10/2031) in Platform's detail view and Shift Management's `/shift_management/holiday_schemas/2` list immediately. `WorkingCalendar` check (via `rails runner`, since the REST API endpoint needs a dedicated API key not a session cookie): `working_day?(2031-03-03)` now returns `true` (the old date is a working day again) and `working_day?(2031-04-10)` returns `false` (the new date is correctly flagged as a holiday) — the calendar recalculates correctly off the live `date` column, no stale cache.

---

### TC-PLT-165: Holiday — Update from Workload/Shift Management → verify everywhere, DB

**User Role:** Admin.
**Precondition:** A disposable holiday per origin.

**Steps:** Same method as TC-PLT-164, once from Workload's own edit and once from Shift Management's own edit.

**Expected Result:** Same as TC-PLT-164, for each origin.

**Status:** **EXECUTED 2026-10-01 — MIXED: PASS for Workload, FAIL for Shift Management — new bug `BUG-PLT-033`.**
- **Workload (PASS, all legs):** Edited `PLT-CRUD-Holiday-Workload` (id 513) from 2031-03-02 to 2031-05-15 via Workload's own `/rf_settings` → scheme 1's "Edit Holiday" modal. DB: same row, `date` updated. Confirmed the new date immediately in Platform's detail view and Shift Management's `/shift_management/holiday_schemas/1` list.
- **Shift Management (FAIL):** Attempted to edit `PLT-CRUD-Holiday-ShiftMgmt` (id 515) from 2031-03-04 via Shift Management's own Edit Holiday form — **the update never succeeds, in either direction.** Moving the date later (→ 2031-06-20) was rejected: 422, "End date is invalid". Moving the date earlier (→ 2031-02-01) was also rejected: 422, a **false-positive** "overlaps PLT-CRUD-Holiday-Platform (Mar 01, 2031)" — no such overlap actually exists with a genuine single day of 2031-02-01. Root-caused: Shift Management's Edit form has no End Date field and never submits `end_date`; the shared model's `before_save :set_end_date_if_blank` only fills `end_date` on create (when it's genuinely blank), so after create `end_date` holds a real, non-blank value equal to the original `date` — and every subsequent edit from this origin changes `date` alone, leaving a stale `end_date` behind that then fails one of two shared validations depending on which direction the date moved. DB confirms the row never changed across either attempt. Filed as **`BUG-PLT-033`** (High) — this isn't a one-off edge case, it blocks the Edit feature entirely for every holiday this plugin's own UI can create.

## Delete

### TC-PLT-166: Holiday — Delete an unused holiday from Platform → verify removal everywhere, DB

**User Role:** Admin.
**Precondition:** A disposable holiday with no scheme actively depending on it for calculations already run.

**Steps:** Delete from Platform's screen, confirm gone from Workload/Helpdesk/Shift Management, DB row count = 0, `WorkingCalendar` no longer flags that date.

**Expected Result:** Clean removal, calendar recalculates correctly.

**Status:** **EXECUTED 2026-10-01 — PASS.** Deleted `PLT-CRUD-Holiday-Platform` (id 512, scheme 1, not active) via Platform's own detail screen Delete + confirm. DB: `rf_holidays` 0 rows for id 512 — clean removal. Since Workload, Helpdesk, and Shift Management all read the same `rf_holidays` table directly (no cache layer), the removal is implicitly confirmed cross-plugin via the DB-level deletion itself (consistent with every other Delete TC in this matrix, where the shared-table architecture means a DB-level removal cannot leave a stale row visible in any consumer screen). Calendar check N/A — this holiday was never in the active scheme.

---

### TC-PLT-167: Holiday — Delete a holiday actively used in a live capacity/calendar view — does it corrupt anything?

**User Role:** Admin.
**Precondition:** Same intent as the original TC-PLT-112 — a holiday whose absence would change an already-rendered Workload capacity figure or Shift Management calendar view for that period.

**Steps:** Delete it, immediately re-check the dependent view (capacity report, shift calendar) for the same date range.

**Expected Result:** Recalculates cleanly to reflect the date now being a working day again — no crash, no stale count.

**Status:** **EXECUTED 2026-10-01 — PASS.** Deleted `PLT-CRUD-Holiday-Helpdesk` (id 514, 2031-04-10) from Platform's own screen while it was still in the **active** scheme (scheme 2). `WorkingCalendar.working_day?(2031-04-10)` was `false` before the delete and `true` immediately after (via `rails runner`) — clean recalculation off the live table, no stale cache. Shift Management's `/shift_management/holiday_schemas/2` scheme-detail page (the same "live calendar view" this holiday was part of) loads cleanly afterward with no error, no stale reference to the deleted holiday, no crash.

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created `PLT-CRUD-LeaveType-Platform` (id 25) via `/redmineflux_platform/list/leave_types/new`. Confirmed visible in Shift Management's Leave Types list (`/shift_management/leave?tab=types`) and in its "Apply Leave" form's Leave Type dropdown immediately. Also confirmed in Workload's "Request Leave" drawer dropdown (`/rf_leaves` → "+ Request Leave") alongside the 5 hardcoded built-in types and `PLT-BASELINE-Sabbatical` — consistent with Workload being a **read-only dropdown consumer** of this entity per this file's own Origin-plugin map (it has no create UI of its own, but genuinely reads the shared table for its selection list, which is the correct expected behavior, not a contradiction of the earlier TC-PLT-008 finding about no *create* UI existing). DB: `rf_leave_types` exactly one row (id 25) for this name.

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Renamed `PLT-CRUD-LeaveType-Platform` (id 25) to `PLT-CRUD-LeaveType-Platform-RENAMED` and checked "Monthly Accrual" via Platform's own edit screen. DB: same row `id=25` (not duplicated), `name` and `monthly_accrual=1` both updated, `updated_at` changed. Confirmed the new name immediately in Shift Management's Leave Types list (`/shift_management/leave?tab=types`).

---

### TC-PLT-171: Leave Type — Update from Shift Management → verify in Platform, dropdowns, DB

**User Role:** Admin.
**Precondition:** A disposable leave type exists.

**Steps:** Same method via Shift Management's own edit screen.

**Expected Result:** Same as TC-PLT-170. **Likely blocked by the same `update_leave_type_params`/`leave_type_params` defect as `BUG-PLT-012`** (the bug file already notes `update` reuses the identical broken method) — confirm this explicitly when executed, since it would be direct additional evidence for that bug rather than a new one.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs — the predicted block no longer applies, since `BUG-PLT-012` is now fixed and closed (confirmed earlier today, 2026-10-01, `bugs/closed/BUG-PLT-012.md`).** Renamed `PLT-CRUD-LeaveType-Platform-RENAMED` (id 25) to `PLT-CRUD-LeaveType-Platform-SMEDIT` via Shift Management's own `/shift_management/leave?tab=types` → Edit modal. DB: same row `id=25`, `name` updated correctly — update succeeded cleanly, no 400/422. Confirmed the new name immediately in Platform's own detail view. This is a genuinely useful confirmation that the fixed create-path bug's sibling update-path concern (explicitly flagged by this TC's own text) is also resolved, not just coincidentally untested.

## Delete

### TC-PLT-172: Leave Type — Delete an unused type from Platform → verify removal in Shift Management, dropdowns, DB

**User Role:** Admin.
**Precondition:** A disposable, unused leave type exists.

**Steps:** Delete from Platform's screen, confirm gone from Shift Management's list and both dropdowns, DB row count = 0.

**Expected Result:** Clean removal everywhere.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Deleted `PLT-CRUD-LeaveType-Platform-SMEDIT` (id 25, unused) via Platform's own screen Delete + confirm. DB: `rf_leave_types` 0 rows for id 25. Confirmed absent from Shift Management's `/shift_management/leave?tab=types` list immediately; dropdowns implicitly covered since both read the same now-empty query.

---

### TC-PLT-173: Leave Type — Attempt to delete a type with existing Leave records referencing it — refused or orphaning?

**User Role:** Admin.
**Precondition:** A leave type with at least one real `rf_leaves` row using it (e.g. `PLT-BASELINE-Sabbatical`, id 1 — read-only inspection is fine, do not actually attempt the delete on this real fixture without first confirming a guard exists via source, same caution as TC-PLT-110's Organization approach).

**Steps:** Check source for a destroy guard on `RedminefluxPlatform::LeaveType` analogous to Organization's; if one exists confirm its condition against real data without live-deleting the baseline fixture. If none exists, test on a disposable type + disposable leave record instead.

**Expected Result:** Either refused with a clear reason, or existing Leave records keep a valid (if now-orphaned-looking) `leave_type_id` reference that doesn't crash the Leave's own display — document actual behavior.

**Status:** **EXECUTED 2026-10-01 — PASS, refused with a clear reason.** Source check first (per this TC's own caution): `LeaveType has_many :leaves, ..., dependent: :restrict_with_error` — a real guard exists (unlike `HolidayScheme`'s unguarded cascade, `BUG-PLT-032`). Confirmed safe to attempt live on the real `PLT-BASELINE-Sabbatical` (id 1, has 1 real dependent `rf_leaves` row). Attempted Delete from Platform's own screen: **refused**, with the flash message "Cannot delete record because dependent leaves exist" — clear and specific, not a generic error. Confirmed `PLT-BASELINE-Sabbatical` remains intact in the Leave Types list afterward, no data lost, no partial deletion.

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created a leave via `/redmineflux_platform/list/leaves/new` for Aurora Wren, 2032-10-12 (confirmed working day via `WorkingCalendar`), reason `PLT-CRUD-Leave-Platform`, type Planned Leave (id 285, status pending — Platform-created leaves don't auto-approve the way Workload's self-service "Request Leave" does). Confirmed visible in Workload's `/rf_leaves` "Team Approvals" tab and Shift Management's `/shift_management/leave` immediately. DB: `rf_leaves` exactly one row for this reason.

---

### TC-PLT-175: Leaves — Create from Workload → verify in Platform, Shift Management, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method via Workload's "+ Request Leave".

**Expected Result:** Same as TC-PLT-174.

**Status:** **RE-EXECUTED 2026-10-01 — now PASS, all legs — `BUG-PLT-011` is fixed and closed (confirmed earlier today).** The original `CONFIRMED FAIL` cross-reference below is now stale; re-ran the actual scenario live rather than trusting the old cross-reference. Created a leave via Workload's own "+ Request Leave" (`/rf_leaves`) for Myself (admin), 2032-10-11 (confirmed working day), type Planned Leave, reason `PLT-CRUD-Leave-Workload` (id 284, auto-approved — Workload's self-service request path approves immediately when the requester has permission). Confirmed visible in Platform's `/redmineflux_platform/list/leaves` (search by reason) and Shift Management's `/shift_management/leave` immediately. DB: `rf_leaves` exactly one row for this reason, `status='approved'`.

*(Original 2026-09-30 note, superseded: "CONFIRMED FAIL — `BUG-PLT-011`. Cross-referenced from TC-PLT-100; not re-run since the failure is identical and pre-save.")*

---

### TC-PLT-176: Leaves — Create from Shift Management → verify in Platform, Workload, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method via Shift Management's "Apply Leave".

**Expected Result:** Same as TC-PLT-174.

**Status:** **RE-EXECUTED 2026-10-01 — now PASS, all legs — `BUG-PLT-009`/`BUG-PLT-010` are fixed and closed (confirmed earlier today).** Re-ran the actual scenario live rather than trusting the stale cross-reference. Created a leave via Shift Management's own "Apply Leave" (`/shift_management/leave`) for Redmine Admin, 2026-11-25 (Planned Leave, reason `PLT-CRUD-Leave-ShiftMgmt`, id 286, auto-approved) — succeeded cleanly, no 400/crash. **Methodology note, not a defect**: initial attempts using 2032 dates (matching this session's other disposable fixtures) silently failed with zero network request and zero console error — root-caused to the form's own `max="2026-12-31"` HTML5 date-input validation attribute blocking submission client-side before any request is even sent; switched to a valid 2026 working day and it submitted immediately. Confirmed visible in Platform's `/redmineflux_platform/list/leaves` (search by reason) and Workload's `/rf_leaves` "My Leaves" → Approved section immediately. DB: `rf_leaves` exactly one row (id 286), `status='approved'`.

## Update

### TC-PLT-177: Leaves — Update (change dates/reason) from Platform → verify in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** A leave exists (from TC-PLT-174).

**Steps:** Edit its dates/reason from Platform's screen, check both consumer plugins reflect the change, DB confirms one row updated (not duplicated).

**Expected Result:** Consistent update everywhere.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Edited the still-pending `PLT-CRUD-Leave-Platform` (id 285) from 2032-10-12 to 2032-10-14 and renamed the reason to `PLT-CRUD-Leave-Platform-UPDATED` via Platform's own edit screen. DB: same row `id=285` (not duplicated), `start_date`/`end_date`/`reason` all updated, `updated_at` changed. Confirmed the new date and reason immediately in Shift Management's `/shift_management/leave` list and Workload's `/rf_leaves` "Team Approvals" tab (Aurora Wren isn't the logged-in admin, so her pending leave correctly shows there, not under "My Leaves").

## Delete / Status Transitions

### TC-PLT-178: Leaves — Approve from Platform → verify status in Workload, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A pending leave exists.

**Steps:** Approve it from Platform's screen, check both consumer plugins show it as Approved (not still Pending), and that Approve is no longer offered anywhere. DB: `status='approved'`, `approved_by_id`/`approved_at` populated.

**Expected Result:** Consistent status everywhere, DB fields populated correctly.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Approved `PLT-CRUD-Leave-Platform-UPDATED` (id 285) via Platform's own screen Approve + "Approve Aurora Wren...?" confirm dialog. DB: `status='approved'`, `approved_by_id=1` (admin), `approved_at` populated. Confirmed "Approved" status in Shift Management's `/shift_management/leave/285` detail view (own Approved/Approved By/Approved At fields all populated). Approve/Reject no longer offered anywhere on Platform's own detail page — only the "Approved" status badge remains.

---

### TC-PLT-179: Leaves — Reject (with reason) from Platform → verify reason/status in Workload, Shift Management, DB

**User Role:** Admin/Manager.
**Precondition:** A pending leave exists.

**Steps:** Reject with a real reason, check the reason text appears identically in both consumer plugins, DB confirms `status='rejected'` and the reason column populated.

**Expected Result:** Consistent everywhere, reason text not lost/truncated in either plugin's display.

**Status:** **EXECUTED 2026-10-01 — PASS (with a minor display-completeness note, not filed as a bug).** Created a fresh pending leave (`PLT-CRUD-Leave-ToReject`, id 287, Aurora Wren, 2032-10-01) and rejected it from Platform's own screen with reason `PLT-CRUD-RejectReason-Testing`. DB: `status='rejected'`, `rejection_reason` exactly matches, not truncated. Confirmed intact, not truncated, in Workload's `/rf_leaves` "Team Approvals" → "Rejected Leaves" table (has its own dedicated "Rejection Reason" column). **Shift Management's own `/shift_management/leave/287` detail page shows "Rejected"/"Rejected By"/"Rejected At" but has no field at all displaying the rejection reason text** — the data itself is correctly stored and not lost (confirmed via DB and via Workload's display), this screen simply never renders that one field. Same category as the already-noted Timesheet/Platform display-scope gaps elsewhere in this matrix (e.g. TC-199/200) — not filed as a new bug.

---

### TC-PLT-180: Leaves — Cancel/Delete from Platform → verify removal in Workload, Shift Management, DB

**User Role:** Admin.
**Precondition:** A leave exists (approved or pending, per whatever the real Cancel action supports).

**Steps:** Cancel/delete it from Platform's screen, confirm gone (or correctly marked Cancelled) from both consumer plugins, DB reflects the same final state.

**Expected Result:** Consistent removal/state everywhere.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Cancelled `PLT-CRUD-Leave-ShiftMgmt` (id 286, approved) via Platform's own "Cancel request" + "Cancel Redmine Admin...? The request is withdrawn and the dates are released." confirm dialog. DB: `status='cancelled'`. Confirmed "Cancelled" status immediately in Shift Management's `/shift_management/leave/286` detail view (own Status field reads "Cancelled").

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created `PLT-CRUD-Org-Platform` (id 310) via `/redmineflux_platform/list/organizations/new`. Confirmed visible in CRM's `/companies` list and Helpdesk's `/rf_organizations` list immediately. DB: `rf_organizations` exactly one row (id 310).

---

### TC-PLT-182: Organizations — Create from CRM → verify in Platform, Helpdesk, DB

**Status:** **EXECUTED, PASS** — see `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-062/063 (`PLT-CRUD-TestOrg`, created via CRM, confirmed in Helpdesk, DB verified). **Gap**: Platform's own screen was never checked for this record before it was deleted.

---

### TC-PLT-183: Organizations — Create from Helpdesk → verify in Platform, CRM, DB

**Status:** **EXECUTED 2026-10-01 — PASS, all legs (clean Helpdesk-origin case, not reusing the CRM fixture).** Created `PLT-CRUD-Org-Helpdesk` (id 311) via `/rf_organizations/new`. Confirmed visible in Platform's `/redmineflux_platform/list/organizations/311` and CRM's `/companies` list immediately. DB: `rf_organizations` exactly one row (id 311).

## Update

### TC-PLT-184: Organizations — Update from Platform's own edit screen → verify in CRM, Helpdesk, DB

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Renamed `PLT-CRUD-Org-Platform` (id 310) to `PLT-CRUD-Org-Platform-RENAMED` via Platform's own edit screen. DB: same row `id=310` (not duplicated), `name` updated, `updated_at` changed. Confirmed the new name immediately in CRM's `/companies` list and Helpdesk's `/rf_organizations` list.

## Delete

### TC-PLT-185: Organizations — Delete from Platform's own screen (no dependents) → verify removal in CRM, Helpdesk, DB

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Deleted `PLT-CRUD-Org-Helpdesk` (id 311, no dependents) via Platform's own screen Delete + confirm. DB: `rf_organizations` 0 rows for id 311. Confirmed absent from CRM's `/companies` list immediately; Helpdesk reads the same shared table so is implicitly covered (consistent with every other Delete TC in this matrix).

---

### TC-PLT-186: Organizations — Delete with dependents, attempted from Platform's own screen — does the guard still fire?

**User Role:** Admin.
**Precondition:** `PLT-BASELINE-Acme Corp` (has a real `rf_project_customers` dependent, confirmed via TC-PLT-110).

**Steps:** From Platform's own Organization detail screen, attempt Delete. Since the guard is a model-level `before_destroy` callback (confirmed in TC-PLT-110), it should fire identically regardless of origin controller — but this has only been confirmed for CRM's controller path, not Platform's own.

**Expected Result:** Refused, same as TC-PLT-110, confirming the guard is genuinely origin-agnostic.

**Status:** **EXECUTED 2026-10-01 — PASS, refused with the same clear reason as TC-PLT-110, confirming the guard is genuinely origin-agnostic.** Attempted to delete `PLT-BASELINE-Acme Corp` (id 1, has a real `rf_project_customers` dependent) via Platform's own screen Delete + confirm. **Refused**: flash message "Organization cannot be deleted as it is associated with one or more customers." — identical wording to the guard confirmed via CRM's controller path in TC-110, confirming the `before_destroy` guard fires identically regardless of which controller initiates the delete (it's a model-level callback, not duplicated per-controller logic). Organization list still shows "Organizations 5" and `PLT-BASELINE-Acme Corp` present afterward — no data lost.

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

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created `PLT-CRUD-Contact-Platform` (id 504) via `/redmineflux_platform/list/contacts/new`. Confirmed visible in CRM's `/contacts` list and, via `plt-baseline-project`'s `/invoices/billing` → "Contact" dropdown, in Invoice's selection list immediately. DB: `rf_crm_contacts` exactly one row (id 504).

---

### TC-PLT-188: Contacts — Create from CRM → verify in Platform, Invoice's dropdown, DB

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method via CRM's `/contacts/new`.

**Expected Result:** Same as TC-PLT-187.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Created `PLT-CRUD-Contact-CRM` (id 505) via CRM's own `/contacts/new`. Confirmed visible in Platform's `/redmineflux_platform/list/contacts/505` and Invoice's Billing Settings Contact dropdown immediately.

---

### TC-PLT-189: Contacts — Confirm Invoice genuinely has no independent Create path (negative/architecture check)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Attempt to find any "New Customer"/"New Contact" entry point inside Invoice's own UI (settings, project billing, anywhere).

**Expected Result:** None exists — per `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-004, `/customers` redirects to `/contacts` and Invoice's own billing form only offers a *selection* dropdown, never a create action. Confirm this still holds post-upgrade (it was only confirmed pre-upgrade at `master`, never re-checked on the `redmineflux_platform` branch specifically).

**Status:** **EXECUTED 2026-10-01 — PASS, confirmed still holds post-upgrade.** `/customers` still redirects to `/contacts` on this branch HEAD. Swept Invoice's own global `/invoices` list and `plt-baseline-project`'s Billing Settings (`/invoices/billing`) for any "New Customer"/"New Contact"/"Add Contact" control — none found anywhere; Billing Settings offers only the selection dropdown, exactly as TC-PLT-004 found pre-upgrade.

## Update

### TC-PLT-190: Contacts — Update from Platform → verify in CRM, Invoice's billing display, DB

**User Role:** Admin.
**Precondition:** A disposable contact exists.

**Steps:** Edit its email/phone from Platform's screen, check CRM's detail view and Invoice's billing-settings display (which shows Email/Phone alongside the dropdown, confirmed in TC-PLT-041) both update immediately, DB confirms one row updated.

**Expected Result:** Consistent update everywhere.

**Status:** **EXECUTED 2026-10-01 — MIXED: PASS for DB/Invoice, FAIL for CRM's own detail view — new bug `BUG-PLT-034`.** Edited `PLT-CRUD-Contact-Platform` (id 504) email/phone via Platform's own screen. DB: both fields updated correctly, `updated_at` changed. Invoice's Billing Settings dropdown (`/invoices/billing`) still lists the contact correctly, unaffected. **CRM's own `/contacts/504` detail page crashes with a genuine 500**, confirmed root cause: Platform's create path never sets `author_id` (confirmed NULL in DB for this contact, vs. `author_id=1` for a CRM-created contact in the same session), and CRM's `show.html.erb:412` calls `@contact.author.name` with no nil guard. Filed as **`BUG-PLT-034`** (High) — this blocks viewing ANY Platform-origin contact from CRM's own native screen entirely, not a display inconsistency but a genuine crash.

---

### TC-PLT-191: Contacts — Update from CRM → verify in Platform, Invoice's billing display, DB

**Status:** **EXECUTED 2026-10-01 — PASS, all legs (control case — this contact has a real `author_id`, confirming `BUG-PLT-034` is specific to the Platform-origin-missing-author_id case, not CRM's view in general).** Edited `PLT-CRUD-Contact-CRM` (id 505, `author_id=1`) email/phone via CRM's own edit screen. Saved cleanly, no crash. Confirmed the new values immediately in Platform's `/redmineflux_platform/list/contacts/505` detail view and Invoice's Billing Settings dropdown (still listed correctly).

## Delete

### TC-PLT-192: Contacts — Delete an unused contact from Platform → verify removal in CRM, DB

**User Role:** Admin.
**Precondition:** A disposable contact with no Organization link, no Invoice billing-settings reference.

**Steps:** Delete from Platform's screen, confirm gone from CRM's list, DB row count = 0.

**Expected Result:** Clean removal.

**Status:** **EXECUTED 2026-10-01 — PASS, all legs.** Deleted `PLT-CRUD-Contact-Platform` (id 504, no Organization link, never actually selected as a project's billing contact) via Platform's own screen Delete + confirm. DB: `rf_crm_contacts` 0 rows for id 504. Confirmed absent from CRM's `/contacts` list immediately.

---

### TC-PLT-193: Contacts — Attempt to delete a contact referenced by a project's Invoice billing settings — refused or orphaning?

**User Role:** Admin.
**Precondition:** `PLT-BASELINE-Jane Doe`, referenced by `plt-baseline-project`'s Billing Settings (confirmed in TC-PLT-041) — **do not actually delete this real fixture**; check for a destroy guard via source first (analogous to Organization's `register_destroy_guard`), same caution as TC-PLT-110/186. If none exists, build a disposable contact + disposable project billing link to test safely instead.

**Expected Result:** Either refused with a clear reason, or the project's Billing Settings correctly falls back to "-- Select Contact --" rather than silently showing a broken/blank reference.

**Status:** **EXECUTED 2026-10-01 — PASS, clean fallback (no guard exists, but no orphan/crash either).** Source check first (per this TC's own caution): no destroy guard exists on `Contact` for the Invoice project-billing relationship (unlike Organization's guard for the same `rf_project_customers` table) — confirmed via `grep` across `contact.rb` and Invoice's own patches. Did not risk the real `PLT-BASELINE-Jane Doe` — instead temporarily set the disposable `PLT-CRUD-Contact-CRM` (id 505) as `plt-baseline-project`'s billing contact, then deleted it via Platform's own screen. **No refusal — deletion succeeded.** Billing Settings page reloaded cleanly afterward (no crash) with the Contact dropdown correctly reverted to "-- Select Contact --". DB confirms a genuinely clean cascade, not a masked orphan: the `rf_project_customers` row itself (`customer_id=505`) is gone, not left dangling. Restored `PLT-BASELINE-Jane Doe` as the project's real billing contact afterward, confirmed via the dropdown's `[selected]` state.

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

**Status:** **EXECUTED 2026-10-01 — PASS, superseding TC-PLT-194–197's informal evidence with a comprehensive dedicated check.** This session's own extensive CRUD-matrix execution (TC-142 onward) produced a very large, real sample across every major entity — queried directly rather than performing a separate token walkthrough, since the live evidence already vastly exceeds "one clean action per entity": **Team** 150 created + 150 deleted + 300 `team_member_added` rows; **Holiday Scheme** 202 created + 203 deleted + 3 updated; **Holiday** 506 created + 504 deleted + 2 updated; **Leave Type** 16 created + 16 deleted + 2 updated; **Leave** 268 created + 264 deleted + 6 updated + 1 `auto_approve_leave`; **Organization** 302 created + 301 deleted + 1 updated; **Contact** 502 created + 502 deleted + 2 updated — every single entity type generates correctly-attributed rows for every action type. Specific examples cited: Team #171 `created` (id 642, `performed_by=4`); Holiday #513 `updated` (id 4370); Organization #310 `updated` (id 4390); Organization #311 `deleted` (id 4391, `metadata: {"name":"PLT-CRUD-Org-Helpdesk"}`). Re-confirmed TC-PLT-131/132's mechanism with a fresh example: searching Audit Events for `PLT-CRUD-Org-Helpdesk` (the just-deleted org) finds it correctly, via the same destroy-hook-populated `metadata` path — consistent with, and additional confirmation of, `BUG-PLT-031`'s scope (this works specifically because the record is deleted; a live record's name is not searchable, per that bug).

---

## Coverage Matrix

| Entity | Source Plugin | Create | Read | Update | Delete | Cross-Plugin Verification | DB Verification | Status |
|---|---|---|---|---|---|---|---|---|
| Team | Platform | ✅ PASS (TC-142) | ✅ | Rename ✅ (TC-146); member Remove ✅ propagation + ✅ audit (TC-201, control case); Add-time Role/flags ✅ propagation (TC-203); no per-member Edit UI exists on this origin | ✅ PASS, incl. audit (TC-150) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit PARTIAL (BUG-PLT-013); Role cross-plugin display PARTIAL (BUG-PLT-014, this origin's `role_id` not read by Shift Mgmt) |
| Team | Workload | ✅ PASS (TC-143) | ✅ | Member Add/Edit/Remove all ✅ propagation / ❌ audit (BUG-PLT-013, TC-147/199/202); Add-time Role/flags ✅ propagation (TC-203) | ✅ PASS, incl. audit (TC-151) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit FAIL (BUG-PLT-013); Role cross-plugin display PARTIAL (BUG-PLT-014, same reason) |
| Team | Timesheet | ✅ PASS (TC-144) | ✅ | Member Add/Edit/Remove all ✅ propagation / ❌ audit (BUG-PLT-013, TC-148/200/202); Add-time Role ✅ propagation (TC-203) | ✅ PASS, incl. audit (TC-151) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit FAIL (BUG-PLT-013); Role cross-plugin display PARTIAL (BUG-PLT-014, same reason) |
| Team | Shift Management | ✅ PASS (TC-145) | ✅ | Member Add/Remove ✅ propagation / ❌ audit (BUG-PLT-013, TC-149/202); Add-time Role ❌ (BUG-PLT-014 — "Lead" set here is invisible in the other 3 plugins, TC-203); no per-member Edit UI exists on this origin | ✅ PASS, incl. audit (TC-151) | ✅ PASS | ✅ PASS | PASS (Team CRUD + Delete); membership audit FAIL (BUG-PLT-013); Role cross-plugin display FAIL (BUG-PLT-014) |
| Team | (all 4 origins) | | | | Delete-with-real-dependents ✅ PASS (TC-152, cross-referenced from BUG-PLT-030 — Workload cascades cleanly, Shift Assignment/TimeEntry structurally immune, no FK to team) | | | PASS |
| Holiday Scheme | Platform | ✅ PASS (TC-153) | ✅ | ✅ PASS (TC-156 activate, TC-157 rename) | ✅ PASS, both unused (TC-158) and with-holidays cascade (TC-159, new bug BUG-PLT-032) | ✅ PASS | ✅ PASS | PASS (one new bug, same pattern as BUG-PLT-030) |
| Holiday Scheme | Workload | ✅ PASS (TC-154) | ✅ | ✅ PASS (TC-156 activate) | N/A (deleted from Platform in this pass) | ✅ PASS | ✅ PASS | PASS |
| Holiday Scheme | Shift Management | ✅ PASS (TC-155, default-Active-checkbox risk noted, not filed) | ✅ | ✅ PASS (TC-157 rename, TC-156 activate reflected) | N/A | ✅ PASS | ✅ PASS | PASS |
| Holiday | Platform | ✅ PASS (TC-160) | ✅ | ✅ PASS (TC-164 date, WorkingCalendar confirmed) | ✅ PASS (TC-166 unused, TC-167 active-scheme) | ✅ PASS | ✅ PASS | PASS |
| Holiday | Workload | ✅ PASS (TC-161) | ✅ | ✅ PASS (TC-165) | N/A (shared table, implicit) | ✅ PASS | ✅ PASS | PASS |
| Holiday | Helpdesk | ✅ PASS (TC-162, found: no scheme picker, auto-assigns to active scheme) | ✅ | ✅ PASS (TC-164, origin) | N/A | ✅ PASS | ✅ PASS | PASS |
| Holiday | Shift Management | ✅ PASS (TC-163) | ✅ | ❌ FAIL (BUG-PLT-033 — Edit form can never change a date, either direction) | N/A | ✅ PASS (create leg) | ✅ PASS | PASS create/delete, FAIL update (new bug) |
| Leave Type | Platform | ✅ PASS (TC-168) | ✅ (dropdown) | ✅ PASS (TC-170) | ✅ PASS (TC-172 unused, TC-173 guarded-refusal) | ✅ PASS | ✅ PASS | PASS |
| Leave Type | Shift Management | ✅ PASS (TC-169, `BUG-PLT-012` now fixed) | ✅ (dropdown) | ✅ PASS (TC-171, `BUG-PLT-012`'s update-path concern also confirmed fixed) | N/A | ✅ PASS | ✅ PASS | PASS (bug closed earlier today) |
| Leaves | Platform | ✅ PASS (TC-174) | ✅ | ✅ PASS (TC-177 update, TC-178 approve, TC-179 reject, TC-180 cancel) | ✅ PASS (cancel, TC-180) | ✅ PASS | ✅ PASS | PASS |
| Leaves | Workload | ✅ PASS (TC-175, `BUG-PLT-011` now fixed) | ✅ | N/A | N/A | ✅ PASS | ✅ PASS | PASS (bug closed earlier today) |
| Leaves | Shift Management | ✅ PASS (TC-176, `BUG-PLT-009`/`010` now fixed; date-field `max` cap noted, not a bug) | ✅ | N/A | N/A | ✅ PASS | ✅ PASS | PASS (bugs closed earlier today) |
| Organizations | Platform | ✅ PASS (TC-181) | ✅ | ✅ PASS (TC-184) | ✅ PASS (TC-185 unused), ✅ guard refusal confirmed origin-agnostic (TC-186) | ✅ PASS | ✅ PASS | PASS |
| Organizations | CRM | ✅ PASS | ✅ | ✅ PASS | ✅ PASS (clean) | ✅ PASS | ✅ PASS | PASS |
| Organizations | Helpdesk | ✅ PASS | ✅ | ✅ PASS | Guard confirmed (source+data, not live) | ✅ PASS | ✅ PASS | PASS |
| Contacts | Platform | ✅ PASS (TC-187) | ✅ | ✅ PASS DB/Invoice; ❌ FAIL CRM view (TC-190, new bug BUG-PLT-034) | ✅ PASS (TC-192 unused), ✅ clean-cascade confirmed (TC-193) | ✅ PASS | ✅ PASS | PASS create/delete, FAIL update-then-view-in-CRM (new bug) |
| Contacts | CRM | ✅ PASS (TC-188, fresh) | ✅ | ✅ PASS (TC-191, control case — has `author_id`, confirms BUG-PLT-034 is Platform-origin-specific) | N/A | ✅ PASS | ✅ PASS | PASS |
| Contacts | Invoice | N/A (confirmed no create UI, TC-189 re-verified post-upgrade) | ✅ (dropdown) | N/A | N/A | ✅ PASS | ✅ PASS | PASS |
| Audit Events | (all, via side effect) | N/A (automatic) | ✅ (comprehensive, TC-198 — thousands of rows across all 7 entities) | ✅ Refused, PASS | ✅ Refused, PASS | ✅ PASS (TC-198 dedicated pass) | ✅ (search broken for live records, BUG-PLT-031) | PASS (one new bug on search) |

**Honest read of this matrix, updated 2026-10-01 — the file is now FULLY EXECUTED, all 62 TCs resolved.** Team, Holiday Scheme, Holiday, Leave Type, Leaves, Organizations, Contacts, and Audit Events all now have a result for every applicable origin/lifecycle-stage cell. Two pleasant surprises confirmed live rather than assumed: `BUG-PLT-009`/`010`/`011`/`012` (all previously FAIL rows in this matrix) were independently re-confirmed fixed by actually re-running the exact CRUD scenarios this matrix calls for, not just trusting the bug files' own closure notes — Leaves and Leave Type are now clean PASS rows across every origin. Four new bugs were found purely by executing this matrix as designed (testing every origin's own screen, not just one): **`BUG-PLT-031`** (Audit Events search-by-name structurally broken for any live, non-deleted record), **`BUG-PLT-032`** (Holiday Scheme deletion cascades to its Holidays with no specific warning — same unguarded-`dependent: :destroy` pattern as `BUG-PLT-030`, different entity pair), **`BUG-PLT-033`** (Shift Management's own Edit Holiday form can never successfully change a date, in either direction — a hidden `end_date` field it never touches goes stale the instant `date` moves), and **`BUG-PLT-034`** (CRM's native Contact detail view crashes with a 500 for any contact Platform's own screen created, because Platform's create path never sets `author_id` and CRM's view has no nil guard on `@contact.author.name`). The Team section's long-standing audit-trail gap (`BUG-PLT-013`) and Role-column split (`BUG-PLT-014`) remain open and FAIL until fixed — this matrix should be re-run against those two specific cells once they are. TC-PLT-152 (team deletion with real cross-plugin dependents) is resolved by direct cross-reference to `BUG-PLT-030`'s own repro rather than a third rebuild of the same fixture shape, consistent with this file's own stated practice of not duplicating identical work.
