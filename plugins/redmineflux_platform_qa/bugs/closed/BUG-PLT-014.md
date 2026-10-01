# Bug Report Template

- Bug ID: BUG-PLT-014
- Production Redmine Issue ID: #121623
- Title: Team member "Role" is two disconnected columns — Shift Management's Member/Lead and Platform/Workload/Timesheet's Redmine-role dropdown never see each other's value
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform (shared `rf_team_memberships` table/model) / redmineflux_shift_management / redmineflux_workload / redmineflux_timesheet
- Plugin version: `redmineflux_platform` branch — current branch tips of all 4 plugins
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin. Create a team from **Shift Management**'s own screen and add a member with Role = **"Lead"** (Shift Management's Add Members form has a Role dropdown: Member/Lead).
2. View the same team/member in **Platform**'s, **Workload**'s, or **Timesheet**'s own screen.
3. Separately: create a team from **Platform**, **Workload**, or **Timesheet** and add a member with Role = **"Manager"**/"Developer"/"Reporter" (their Add forms have a different Role dropdown: None/Manager/Developer/Reporter).
4. View the same team/member in **Shift Management**'s own screen.

## Expected result

- A Role set on any one plugin's Add-member form should be the same Role shown on every other plugin's view of that member — this is the entire premise of the shared `rf_team_memberships` table ("Enter something once and it is the same everywhere").

## Actual result

**Confirmed bidirectionally, live, 2026-09-30:**

- Added Willow Belle to a Shift-Management-origin team with Role = **"Lead"**. Shift Management's own table correctly shows "Lead". Platform's member table shows **"—"** (empty). Workload's shows **"-"**. Timesheet's shows **"-"**. None of the 3 other plugins show any trace of "Lead".
- Added 3 separate members (Isla Moon / Selene Frost / Summer Rain) to 3 separate teams via Platform / Workload / Timesheet respectively, each with Role = Manager / Developer / Reporter. Each propagated correctly across Platform/Workload/Timesheet (the 3 plugins that share the same Role concept). But viewing the **Platform-origin** team's member (Isla Moon, Role = "Manager") in **Shift Management**'s own screen shows Role = **"Member"** — the silent default, not "Manager".

### Root cause (confirmed from DB)

`rf_team_memberships` has **two separate role columns**:

```
role       varchar(255)  default 'member'   -- Shift Management's Member/Lead concept
role_id    int           FK to Redmine roles -- Platform/Workload/Timesheet's None/Manager/Developer/Reporter concept
```

```sql
SELECT team_id, user_id, role, role_id FROM rf_team_memberships WHERE team_id IN (7,8,9,10);
-- team_id=7  (added via Platform,   Role=Manager)   -> role='member' (untouched default), role_id=3
-- team_id=8  (added via Workload,   Role=Developer)  -> role='member' (untouched default), role_id=4
-- team_id=9  (added via Timesheet,  Role=Reporter)   -> role='member' (untouched default), role_id=5
-- team_id=10 (added via ShiftMgmt,  Role=Lead)        -> role='lead',                        role_id=NULL
```

Platform's, Workload's, and Timesheet's Add/Edit forms and member-table "Role" column all read/write **`role_id`** exclusively — they never touch `role`. Shift Management's Add form and member-table "Role" column read/write **`role`** exclusively — it never touches `role_id`. Each side of this shared table has its own, completely independent notion of "the member's role" living in a different column, and nothing reconciles them. Setting one is invisible to the other 3 plugins; the display in the other 3 always shows either the silent default ("Member"/`role='member'`) or empty (`role_id` NULL → "—"/"-").

This is the same *class* of defect as BUG-PLT-013 (a consolidated entity where one origin's write path doesn't line up with what the others read) but a different, distinct root cause — not a missing audit call, but two genuinely separate data columns being used as if they were one shared concept.

### Impact scope

- Every team member's Role, as seen from Shift Management, is unreliable/misleading whenever that member was added via Platform, Workload, or Timesheet — it will always show the default "Member" regardless of what was actually assigned.
- Every team member's Role, as seen from Platform, Workload, or Timesheet, is unreliable/misleading whenever that member was added via Shift Management — it will always show "—"/empty regardless of "Member" or "Lead" having been explicitly chosen.
- Anything downstream that keys off `role_id` for permissions (e.g. `manage_rf_teams`-granting roles, referenced in `TeamService.can_manage?`) is silently inert for any member added through Shift Management, since `role_id` is never populated there.
- Found while executing TC-PLT-203 (a test case added specifically to check whether Add-time Role/flag fields — not just the user picker — actually propagate; the user flagged that this had never been tested at add time, only via a later Edit).

## Recommendation

See **BUG-PLT-016** for the cumulative end-user-experience impact of this bug together with BUG-PLT-013/015. See **BUG-PLT-015**'s "Recommendation" section — the user's explicit suggestion is to standardize team-membership management on Platform's own screen and have Workload/Timesheet/Shift Management retire their duplicate screens (accelerating the plugin's own already-planned Roadmap Step 5, "Consumer migration"), rather than reconciling `role` and `role_id` as two permanently-parallel columns.

## Evidence

### Screenshot

![Shift Management shows "Member" for a member whose Role was actually set to "Manager" via Platform](../../screenshots/BUG-PLT-014/shiftmgmt-shows-member-not-manager.png)

![Platform shows "—" for a member whose Role was actually set to "Lead" via Shift Management](../../screenshots/BUG-PLT-014/platform-shows-dash-not-lead.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-014/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error, browser or server — this is a silent, unflagged data mismatch, not a crash.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — related in spirit to BUG-PLT-013 (another team-membership consolidation gap found in the same testing pass) but a distinct root cause (disconnected columns vs. missing audit call), filed separately.

## Production report

Reported to production 2026-09-30 as **#121623** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121476 (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121623 attached.

## Retest 2026-10-01 — CONFIRMED FIXED, closed

Pulled commit `7012219` (redmineflux_platform — same commit also fixes BUG-PLT-013/015, confirmed in current `git log`), ran pending migrations, restarted, retested live on Platform's own Teams screen (`/redmineflux_platform/teams/1`):

- The member table now shows **two distinct columns**, "Redmine role" and "Team role", side by side — not one column silently overwritten by the other. Confirmed real, non-blank values on the same row: Redmine Admin → Redmine role **"Manager"**, Team role **"Member"** — genuinely different values for the same person, both visible simultaneously.
- Opened the new "Edit member" dialog (also part of this same fix, see BUG-PLT-015) — both fields are independently editable there too, each with its own explanatory text ("A Redmine role. Team permissions are resolved through it..." vs. "Whether this person leads the team. Separate from the Redmine role above...").

The two role systems no longer silently clobber each other — both are now visible and independently settable from every screen. Fixed. Closed — moving to `bugs/closed/`.
