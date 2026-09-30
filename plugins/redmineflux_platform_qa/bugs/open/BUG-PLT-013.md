# Bug Report Template

- Bug ID: BUG-PLT-013
- Production Redmine Issue ID: #121622
- Title: Adding, editing, OR removing a team member from Workload, Timesheet, or Shift Management never creates an Audit Event — all three bypass the shared `TeamService`/`AuditService.log` methods that Platform's own screen uses for every one of these actions
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_workload / redmineflux_timesheet / redmineflux_shift_management (gap affects all 3 consumer plugins; `redmineflux_platform`'s own screen is correct)
- Plugin version: `redmineflux_platform` branch — current branch tips of all 3 consumer plugins
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin. Create or use an existing team.
2. Add a member to that team from **Workload's** own screen (`/rf_teams/<id>` → "Add Member"), **or** from **Timesheet's** own screen (`/timesheet/teams/<id>` → "Add Member"), **or** from **Shift Management's** own screen (`/shift_management/teams/<id>` → "Add Member").
3. Confirm the membership succeeded (the UI shows the new member, member count increments, and the row exists in `rf_team_memberships`).
4. Go to **Redmineflux Platform → Audit events** (`/redmineflux_platform/list/audit_events`), or query `rf_audit_events` directly for that team's `auditable_id`.

## Expected result

- Per the plugin's own stated purpose ("who changed what" — a unified audit trail across all consumer plugins), adding a team member from **any** plugin's screen should record a `team_member_added` audit event, exactly as it does when the same action is performed from Platform's own Teams screen.

## Actual result

- The membership row IS created correctly (functional propagation confirmed to Platform/other consumer plugins/DB in TC-PLT-147 and TC-PLT-148 — see `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`), but **no audit event is ever written** for the add, from any of the 3 consumer plugins. Only additions made through Platform's own screen are audited.

### Live evidence (2026-09-30)

- `rf_audit_events` before this session's testing: max id 36 (last row: `id=36, Team #3, updated, 2026-09-30 08:11:29` — a rename done via Platform's own screen).
- Added Luna Blossom to team id 4 via **Workload**'s "Add Member" (TC-PLT-147) — DB confirms `rf_team_memberships (team_id=4, user_id=5)` exists.
- Added Daisy Skye to team id 5 via **Timesheet**'s "Add Member" (TC-PLT-148) — DB confirms `rf_team_memberships (team_id=5, user_id=6)` exists.
- Re-queried `rf_audit_events` after both actions: `MAX(id)` is **still 36** — neither addition produced any row at all (not even a crashed/incomplete one).
- By contrast, `id=31` and `id=32` (`Team #3, team_member_added`) exist and were produced earlier in this same session by adding 2 members to a team through **Platform's own** Teams screen — proving the audit mechanism itself works, it is just never invoked from the 3 consumer plugins' own screens.

```sql
SELECT id, auditable_type, auditable_id, action, performed_by, created_at
FROM rf_audit_events WHERE auditable_id IN (3,4,5,6) ORDER BY created_at DESC;
-- id 36: Team 3, updated        (Platform rename)
-- id 35: Team 6, created        (Shift Mgmt team create)
-- id 34: Team 5, created        (Timesheet team create)
-- id 33: Team 4, created        (Workload team create)
-- id 32: Team 3, team_member_added   (Platform add member)
-- id 31: Team 3, team_member_added   (Platform add member)
-- id 30: Team 3, created        (Platform team create)
-- ... no team_member_added row for team 4 or team 5, despite confirmed rf_team_memberships rows for both.
```

### Root cause (confirmed from source)

`RedminefluxPlatform::TeamService.add_member` (`plugins/redmineflux_platform/app/services/redmineflux_platform/team_service.rb`) is the **only** place `team_member_added` is ever logged:

```ruby
def add_member(team, user, role: nil, manage_workload: false, can_approve_leave: false)
  membership = TeamMembership.new(...)
  if membership.save
    AuditService.log(auditable: team, action: 'team_member_added',
                     performed_by: User.current,
                     metadata: { user_id: id_of(user), role_id: id_of(role) })
  end
  membership
end
```

Platform's own `RedminefluxPlatform::TeamMembershipsController#create` calls this shared service — so its adds are audited. All three consumer plugins instead build and save the membership **directly**, bypassing the shared service entirely, and none of them call `AuditService`/`AuditEvent` anywhere in the relevant controller:

- `plugins/redmineflux_workload/app/controllers/rf_team_memberships_controller.rb#create` — `@rf_team.rf_team_memberships.new(...).save` directly (also runs its own workload-capacity side effects inline). Confirmed zero `AuditEvent`/`AuditService` references anywhere in the entire `redmineflux_workload` plugin (`grep -rl AuditEvent` returns nothing).
- `plugins/redmineflux_timesheet/app/controllers/timesheet/rf_team_memberships_controller.rb#create` — same shape, membership built/saved directly, no audit call in this controller (the plugin does have its own separate `AuditEvent`/`AuditLogger` machinery for timesheet-specific actions like approvals, but this controller doesn't invoke it either).
- `plugins/redmineflux_shift_management/app/controllers/team_members_controller.rb#create` — `@team.team_members.build(user_id: uid, member_role: role, joined_on: joined_on).save`, no audit call anywhere in the file.

This is a **different root cause** from BUG-PLT-010 (that one is a monkey-patch signature collision that makes an *attempted* audit-log call crash). Here, the call is simply never made — three separate controllers each reimplemented team-membership persistence instead of delegating to the one shared service that also does the logging, so there is nothing to crash.

### Impact scope

- Every team-membership add **or edit** from Workload, Timesheet, or Shift Management's own screen is invisible in Platform's unified Audit Events view — directly undermining the plugin's stated core value ("Enter something once and it is the same everywhere" / a single "who changed what" trail).
- **Confirmed for Edit as well as Add (2026-09-30, TC-PLT-199):** edited an existing member's role and `can_approve_leave` flag via Workload's own per-row "Edit" control (`/rf_teams/4` → member row → Edit → Save). The change persisted correctly (DB: same `rf_team_memberships` row updated in place, `updated_at` changed) and propagated correctly to Platform's and Timesheet's views — but again produced **zero** rows in `rf_audit_events` (`MAX(id)` unchanged). Source confirms: `plugins/redmineflux_workload/app/controllers/rf_team_memberships_controller.rb#update` (line 95) has no `AuditEvent`/`AuditService` reference either, the same shape as its `create`. So the gap is not narrowly "add member" — it is "team-membership mutations initiated from a consumer plugin's own screen", at least for Workload's `create` and `update`.
- **Confirmed for Timesheet's Edit too (TC-PLT-200):** edited Daisy Skye's role via Timesheet's own per-row "Edit" (`/timesheet/teams/5`) — persisted correctly (same DB row, `updated_at` changed) and propagated to Platform/Workload, but again zero audit rows.
- **Confirmed for Remove, across all 3 consumer plugins (TC-PLT-202):** removed the sole member from a Workload-origin team, a Timesheet-origin team, and a Shift-Management-origin team, one per origin. All 3 removed cleanly (DB: `COUNT(*)` = 0 for all 3 team's memberships, no orphaned rows) and propagated correctly everywhere — but none of the 3 produced an audit row (`rf_audit_events` `MAX(id)` unchanged across all 3 removals).
- **Control case confirmed (TC-PLT-201):** removing a member via **Platform's own** screen DOES correctly log a `team_member_removed` audit event (`id=37`) — Platform's own controller is consistent across create/update/destroy, calling the shared `TeamService` (and therefore `AuditService.log`) every time. The bug is entirely confined to the 3 consumer plugins' own controllers, which reimplement persistence directly for every mutating action (create/update/destroy) instead of delegating to the shared service, and is now confirmed across the full CRUD surface for team membership: **add, edit, and remove, from all 3 consumer plugins.**
- **Note:** Platform's own team screen and Shift Management's own team screen do not offer a per-member "Edit role" UI control at all (only "Remove from team"/"Remove member" respectively) — so this bug's Edit half can only be reproduced via Workload or Timesheet, the 2 origins that do have an edit control. Split out into its own bug at the user's request: **BUG-PLT-015**.
- Scope is Team membership only; Team **creation, rename, AND deletion** are all unaffected (confirmed 2026-09-30: all 3 consumer-plugin origins correctly log `created` events on team creation, and — newly confirmed via TC-PLT-151 — all 3 also correctly log `deleted` events on team deletion, e.g. `id=39/40/41` for Workload/Timesheet/Shift-Management-initiated deletes respectively). The reason team-level actions are always safe regardless of origin, while membership-level actions are not, is now fully explained by source: `RedminefluxPlatform::Team` (`app/models/redmineflux_platform/team.rb:21`) `include`s `RedminefluxPlatform::Concerns::Auditable` — a model-level concern that hooks `after_commit`/callbacks so **every** create/update/destroy is audited automatically, regardless of which controller or plugin triggered it. `RedminefluxPlatform::TeamMembership` does **not** include this concern — its auditing is entirely opt-in, happening only when the calling code explicitly invokes `TeamService.add_member`/`remove_member` (which manually call `AuditService.log`). Platform's own `TeamMembershipsController` does this for `create`/`update`/`destroy`; the 3 consumer plugins' controllers never do, for any of the 3 actions. **This gives a precise, minimal fix path:** either add the same `Auditable` concern to `TeamMembership` (mirroring `Team`'s approach — automatic, origin-independent, arguably the more robust fix), or make the 3 consumer controllers delegate to `TeamService` instead of reimplementing persistence directly (matches Platform's current pattern, but leaves the same class of gap possible for any *future* consumer controller that forgets to delegate).

## Evidence

### Screenshot

![Audit events list showing team `created` rows but no `team_member_added` rows for the Workload/Timesheet-added teams](../../screenshots/BUG-PLT-013/audit-events-missing-team-member-added.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-013/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error is logged anywhere (browser or server) — this is a silent omission, not a crash. That is precisely what makes it easy to miss without a direct DB/audit-log cross-check, which is how it was found here (TC-PLT-147/148 cross-plugin CRUD verification).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — related in spirit to BUG-PLT-010 (both are "cross-plugin audit trail is incomplete for consolidated entities"), but a distinct root cause and distinct fix (missing delegation to a shared service vs. a monkey-patch signature collision), so filed separately rather than folded in.

## Recommendation

See **BUG-PLT-016** for the cumulative end-user-experience impact of this bug together with BUG-PLT-014/015. See **BUG-PLT-015**'s "Recommendation" section — the user's explicit suggestion is to standardize team-membership management on Platform's own screen and have Workload/Timesheet/Shift Management retire their duplicate screens (accelerating the plugin's own already-planned Roadmap Step 5, "Consumer migration"), rather than patching each of this bug's 3 origins to individually call the shared audit service.

## Production report

Reported to production 2026-09-30 as **#121622** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121476 (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121622 attached.
