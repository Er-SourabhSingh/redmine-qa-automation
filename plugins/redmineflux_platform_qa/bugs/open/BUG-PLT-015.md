# Bug Report Template

- Bug ID: BUG-PLT-015
- Production Redmine Issue ID: #121624
- Title: Platform's own Teams screen (and Shift Management's) has no way to edit an existing member's role after adding them — only Remove, unlike Workload/Timesheet which both have a per-member Edit
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform / redmineflux_shift_management
- Plugin version: `redmineflux_platform` branch — current branch tips
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

1. Log in as Admin. From **Platform's own Teams screen** (`/redmineflux_platform/teams/<id>`), add a member with Role = "Manager".
2. Try to change that member's Role afterward — e.g. because they moved to a different position, or the role was chosen wrong.
3. Look at the member row's Actions column.

## Expected result

- A per-member "Edit" action, letting the Role/`manage_workload`/`can_approve_leave` be changed on an existing membership without removing and re-adding the member — matching the capability that already exists on 2 of the 4 plugins sharing this exact same data (Workload's `/rf_teams/<id>` and Timesheet's `/timesheet/teams/<id>` both have a per-row "Edit" button opening an "Edit Member" modal with these same fields).

## Actual result

- Platform's own member table (`/redmineflux_platform/teams/<id>`) offers only a single action per row: **"Remove from team"**. There is no Edit control anywhere on the page — confirmed via `grep -i edit` against the full page snapshot, which returns exactly one match, and it is the **team-level** "Edit" (rename) link at the top of the page, not anything per-member.
- Shift Management's own member table (`/shift_management/teams/<id>`) has the identical gap: only a "Remove member" button per row, no Edit.
- The only way to change an already-added member's Role/flags from Platform's or Shift Management's own screen is to remove them and re-add them — which loses whatever `joined_on` date was recorded and produces an extra remove+add pair in the audit trail (when that trail works at all — see BUG-PLT-013) instead of a single, clean update.
- By contrast, Workload's and Timesheet's own screens both have a working per-row "Edit" action (`Edit Member` modal, confirmed live — see TC-PLT-199/200 in `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`) that updates the existing `rf_team_memberships` row in place.

### Why this matters specifically for Platform

Platform's own screen is meant to be the **canonical** one — the plugin's stated purpose is "Enter something once and it is the same everywhere," with Platform positioned as the unified management surface consumer plugins optionally still duplicate. Here the opposite is true: 2 of the 4 screens managing the *exact same underlying data* (`rf_team_memberships`) have a capability the canonical screen itself lacks. An admin using only Platform's screen (the one meant to need no other plugin) cannot correct a member's role without a destructive remove/re-add workaround.

## Related

See **BUG-PLT-016** for the cumulative end-user-experience impact of this bug together with BUG-PLT-013/014 (the "which screen do I trust" problem, stated from the user's perspective rather than each bug's individual technical root cause).

## Recommendation — user's explicit suggestion, 2026-09-30

This bug, together with BUG-PLT-013 (audit trail silently broken for 3 of 4 origins) and BUG-PLT-014 (Role stored in two disconnected columns depending on which origin wrote it), are three separate symptoms of the same underlying cause: **Team-membership management is independently re-implemented four times** (Platform, Workload, Timesheet, Shift Management), and each implementation has drifted from the others in a different way. Patching each symptom individually (add the missing Edit button here, add the missing audit call there, reconcile the two role columns) still leaves four codepaths that can drift apart again the next time any one of them changes.

The user's recommendation: rather than patching each consumer plugin's own screen to match Platform one field at a time, **standardize on Platform as the single, canonical place team membership is managed**, and have Workload, Timesheet, and Shift Management **remove their own duplicate Team-management screens** in favor of linking/redirecting to Platform's. This is exactly what the plugin's own roadmap already calls for — `PLATFORM_PLUGIN_README.md`'s Roadmap Step 5, "Consumer migration," described as not yet started (see `PLATFORM_MEMORY.md`'s "Duplicate native UI... is DELIBERATE" note) — so this isn't a new architectural direction, it's a request to prioritize the step the plugin's own docs already planned, specifically because BUG-PLT-013/014/015 show concretely what keeps breaking while that step is deferred: every additional cycle these 4 screens stay independently maintained is another chance for their behavior to silently diverge in exactly this way.

## Evidence

### Screenshot

![Platform's team member table showing only "Remove from team," no Edit action](../../screenshots/BUG-PLT-015/platform-no-edit-member-action.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-015/retest-yyyy-mm-dd-pass.png)

### Console / log

- N/A — this is a missing UI capability, not an error.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — was noted as a scope observation inside BUG-PLT-013 (its "Note:" line) before being split out into its own bug at the user's explicit request, since it's a distinct, independently reproducible gap (missing feature) rather than part of BUG-PLT-013's root cause (missing audit call).

## Production report

Reported to production 2026-09-30 as **#121624** (project `ztflux`, tracker Bug, Priority Low, Defect Type Usability, Defect Severity Low-severity, Defect priority Low, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121476 (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121624 attached.
