# Bug Report Template

- Bug ID: BUG-PLT-016
- Production Redmine Issue ID: #121629
- Title: Every shared entity Platform manages (Team, Holiday Scheme, Holiday, Leave Type, Leaves, Organizations, Contacts, Audit Events) is independently re-implemented in 2–4 consumer plugins, and Team already proves this drifts into real, silent data/UX bugs — the same risk exists everywhere else this pattern repeats
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform / redmineflux_workload / redmineflux_timesheet / redmineflux_shift_management / redmineflux_crm / redmineflux_helpdesk / redmineflux_invoice
- Plugin version: `redmineflux_platform` branch — current branch tips of all plugins
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-30

## Steps to reproduce

There is no single repro step — this is a plugin-wide architectural observation, not one bounded defect. The concrete evidence is Team, which has now been tested exhaustively across all 4 of its origins (`PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md`, TC-PLT-142–203) and found to have 3 confirmed, independent bugs (BUG-PLT-013/014/015) purely from 4 plugins each maintaining their own copy of "manage a team's members." The same architecture — one shared table, 2–4 independently-implemented UI/controller layers on top of it — exists for every other entity Platform owns:

| Entity | Independently implemented in |
|---|---|
| Team | Platform, Workload, Timesheet, Shift Management |
| Holiday Scheme | Platform, Workload, Shift Management |
| Holiday | Platform, Workload, Helpdesk, Shift Management |
| Leave Type | Platform, Shift Management |
| Leaves | Platform, Workload, Shift Management |
| Organizations | Platform, CRM, Helpdesk |
| Contacts | Platform, CRM |

Team is simply the entity that happened to get the most thorough cross-plugin testing this cycle. Nothing about Team's implementation is unusual compared to the others — there is no reason to expect Holiday Scheme's 3 implementations, or Organizations' 3 implementations, to be any more disciplined about staying in sync than Team's 4 were, and BUG-PLT-012 (Leave Type, Shift Management) and BUG-PLT-009/010/011 (Leave, 2 different plugins) already show the identical *class* of drift (stale param keys, broken audit calls) recurring in entities other than Team, independently of this bug.

## Expected result

- A shared entity should have **one** place where its create/update/delete logic and its display logic actually live — Platform's own screen and shared services — with every consumer plugin either linking to that one implementation or, at minimum, delegating to Platform's shared service/model logic rather than re-deriving its own persistence and display code from scratch.

## Actual result

Confirmed concretely for Team (BUG-PLT-013/014/015): 4 independent implementations of the same "manage team members" concept have drifted into 3 distinct, user-visible defects — a Role field that means something different depending which screen wrote it, an audit trail that silently only works from 1 of the 4 screens, and a missing Edit capability on 2 of the 4 screens (including Platform's own, the one meant to be canonical). None of these were caught by testing any single plugin in isolation — each only surfaced once the same data was checked across all 4 screens side by side.

The same underlying pattern — an entity whose real logic lives in `redmineflux_platform`, re-implemented separately by each consumer plugin's own controller instead of calling into Platform's shared services/models — already has confirmed instances of the identical defect *class* in other entities too: `BUG-PLT-009`/`BUG-PLT-010`/`BUG-PLT-011` (Leave, broken in 2 different plugins by 2 different mechanisms) and `BUG-PLT-012` (Leave Type, Shift Management). There is no reason to assume Holiday Scheme, Holiday, Organizations, or Contacts are exempt from this same risk just because they have not yet been tested with the same exhaustive add/edit/remove/cross-plugin-display/audit-trail rigor that Team just received.

## Recommendation

Standardize on Platform's own screen and shared services (`TeamService`, `AuditService`, and the equivalent for each other entity) as the single implementation for every entity Platform owns, and have Workload, Timesheet, Shift Management, CRM, Helpdesk, and Invoice retire their own separate implementations in favor of linking to Platform's screens — this is the plugin's own Roadmap Step 5, "Consumer migration," already planned but not yet started (`PLATFORM_PLUGIN_README.md`). This bug's purpose is to state plainly, with Team as the now-proven example, that deferring Step 5 is not a neutral choice with no downside — every entity still following the "re-implement it separately in each consumer plugin" pattern is carrying the same latent risk Team just demonstrated concretely, and the fix is the same one already on the roadmap, not a new architectural direction.

## Evidence

### Screenshot

(See `screenshots/BUG-PLT-013/`, `screenshots/BUG-PLT-014/`, `screenshots/BUG-PLT-015/` for Team's concrete evidence — this bug generalizes what that evidence already proves to every other entity following the same architecture.)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-016/retest-yyyy-mm-dd-pass.png)

### Console / log

- N/A — this is an architectural/product observation generalized from BUG-PLT-013/014/015's confirmed technical evidence, not a new isolated technical error.

## Duplicate check

- Duplicate found: No, but intentionally related to BUG-PLT-013/014/015 (Team-specific proof of the pattern) and BUG-PLT-009/010/011/012 (the same "re-implemented instead of shared" pattern already confirmed in Leave/Leave Type). This bug's scope is broader than any one of those — it is the plugin-wide recommendation, not a fifth Team-specific defect.

## Production report

Reported to production 2026-09-30 as **#121629** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #121476 (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121629 attached. Cross-references BUG-PLT-013 (#121622), BUG-PLT-014 (#121623), BUG-PLT-015 (#121624), BUG-PLT-009/010/011 (#121556/#121588/#121589), and BUG-PLT-012 (#121621) in its Description.
