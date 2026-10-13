# Bug Report Template

- Bug ID: BUG-PLT-047
- Production Redmine Issue ID: (not yet reported — pending approval)
- Title: Shift Management's own role-permission list still exposes 5 permissions for entities now owned by Platform — "Manage Teams & Members", "Manage Departments", "Manage Policy Bands & Assignments", "Manage Leave Types", and "Manage Holidays" — a second permission source for capabilities Platform's own permissions already govern
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_shift_management (the 5 leftover permissions) / redmineflux_platform (should be the sole permission owner for these entities)
- Plugin version: current tip, both plugins
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-10-13

## Steps to reproduce

1. Open Administration → Roles and permissions → any role's edit page (`/roles/<id>/edit`).
2. Scroll to the "Shift Management" permissions group and read every checkbox.
3. Separately, scroll to the generic "Project" group (where Platform's own permissions are registered — confirmed during `BUG-PLT-042`'s investigation to sit outside any dedicated module fieldset) and compare against Platform's own "View teams"/"Create, edit and delete teams", "View holiday schemes"/"Create, edit and delete holiday schemes", "View holidays"/"Create, edit and delete holidays", "View leave types"/"Create, edit and delete leave types".

## Expected result

- Per the consolidation direction already established for Team (`BUG-PLT-040`/`041`/`042`), Leave (`BUG-PLT-044`/`045`), and Holiday (`BUG-PLT-046`), any entity now owned by Platform should have exactly **one** permission source governing who can manage it — Platform's own. A consumer plugin's role-permission list should not carry a second, independent permission for the same capability.

## Actual result

**Confirmed, live, via a full scan of every permission group on the role-edit page (not just the ones already suspected):** Shift Management's own "Shift Management" permission group still exposes exactly **5** permissions that duplicate a capability Platform's own permission set already governs:

| Shift Management's own permission | Duplicates Platform's own |
|---|---|
| `Manage Teams & Members` | "Create, edit and delete teams" (`View teams` for read) |
| `Manage Departments` | Recommended Platform ownership per `BUG-PLT-041`/`044` |
| `Manage Policy Bands & Assignments` | Recommended Platform ownership per `BUG-PLT-044` |
| `Manage Leave Types` | "Create, edit and delete leave types" |
| `Manage Holidays` | "Create, edit and delete holiday schemes" / "Create, edit and delete holidays" |

(`Manage Holidays` was not caught in this session's earlier, narrower note in `PLATFORM_MEMORY.md` — that note listed only 4; this full re-scan found a 5th.)

**Also confirmed by the same scan, as a scope boundary — not additional instances of this bug:**
- Workload's own legacy `Manage teams and skills` permission is the same class of issue, but already separately filed and confirmed dead as **`BUG-PLT-042`** — not re-filed here.
- CRM's `Manage Contacts`/`Manage Organizations` sit in the same generic "Project" permission group as Platform's own Contact/Organization permissions, but these are CRM's own long-standing, pre-consolidation permissions for CRM's own native screens — expected, documented, deliberate duplication per `PLATFORM_MEMORY.md`'s top-level note (Roadmap Step 5, "Consumer migration," not yet started) — not the same defect class as the 5 above, which are leftover gates for an entity whose actual CRUD now lives entirely on Platform. **Same end-state direction, different stage, not forgotten**: unlike Shift Management's 5 (whose screens already redirect to Platform, making the old permission a likely-dead leftover), CRM's own Organization/Contact screens do **not** redirect to Platform at all yet — `Manage Contacts`/`Manage Organizations` is still the only thing gating CRM's real, currently-functioning native screens, so it is not yet redundant with anything. **Once CRM's own Step 5 migration happens** (CRM's screens start deferring to Platform the way Shift Management's already do), `Manage Contacts`/`Manage Organizations` will become exactly this same kind of leftover orphan and should be retired the same way — flagged here so that follow-up isn't missed when CRM's migration eventually starts, not filed as a live defect today.
- Timesheet's own "Time tracking" permission group has no Team/Holiday/Leave-related permissions at all — no issue there.
- Helpdesk's own permission group (`View helpdesk`, `Manage helpdesk`, `Export helpdesk reports`, `Manage prepaid support hours`, `View email history`, Knowledge Base article permissions) exposes nothing granular for Organization/Holiday/SLA — those are gated by the single blanket `Manage helpdesk` permission, not a separate duplicating one.

Per the pattern already confirmed for Workload's analogous permission in `BUG-PLT-042` (toggling it has zero effect — Platform's own permission does the real gating instead), there is a real chance some or all of these 5 Shift Management permissions are similarly dead. `TC-PLT-280` (already written in `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md`, not yet executed) was written specifically to test `Manage Teams & Members` this way; the same live-test method should be applied to the other 4 before concluding they're dead too, rather than assuming it from the pattern alone.

## Evidence

### Screenshot

![Shift Management's own permission group — 5 permissions duplicating entities now owned by Platform](../../screenshots/BUG-PLT-047/shift-management-5-overlapping-permissions.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-047/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — permission-model architecture gap, not a crash.

## Duplicate check

- Duplicate found: No — supersedes the informal note already left in `PLATFORM_MEMORY.md` ("Two parallel permission systems..."), which flagged only 4 of these 5 permissions and had not yet been filed as a bug, per explicit user instruction to note it first and file later. This is that filing, corrected to the full count of 5 found on live re-verification. Related to, but distinct from, `BUG-PLT-042` (the analogous, already-confirmed-dead Workload permission).

## Recommendation (consolidation direction, 2026-10-13)

1. For each of the 5 permissions, confirm live (same method as `TC-PLT-280`, extended to all 5) whether it currently has any real effect, or whether — like Workload's `Manage teams and skills` — Platform's own permission has already silently taken over the actual gating.
2. Retire each permission once its entity's own Platform-consolidation work lands: `Manage Teams & Members` can likely be retired immediately (Team is already Platform's, per `BUG-PLT-040`/`041`); `Manage Departments` and `Manage Policy Bands & Assignments` should retire once `BUG-PLT-041`/`044` are fixed; `Manage Leave Types` and `Manage Holidays` should retire once Platform's own Leave Type and Holiday Scheme/Holiday ownership is confirmed complete (`BUG-PLT-044`/`046`).
3. Any role currently relying on one of these 5 permissions must be migrated to the equivalent Platform permission before retirement, so no existing role silently loses access.
4. Do not touch `Approve / Reject Leave`, `View Leave Applications`, `Manage Leave Balances`, `Approve Attendance Corrections`, `Approve / Reject Shift Change Requests`, or any of Shift Management's other genuinely exclusive permissions (Dashboard, Shift Calendar, Attendance, Shifts & Assignments, Reports) — these are correctly Shift-Management-owned and out of scope for this bug.

## Production report

Not yet reported to production — pending approval per `REDMINEFLUX-MCP-SETUP.md` §4.
