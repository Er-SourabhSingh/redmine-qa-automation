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

## Summary (2026-10-13)

Of 8 cross-plugin flow cases: 3 PASS (Timesheet and Workload's own nav links already defer correctly to Platform;
Shift Management's per-record actions on its duplicate list already redirect to Platform), 5 FAIL. The FAILs span
three distinct defect shapes: a duplicate **list** (Shift Management only, `BUG-PLT-040`), duplicate **detail**
pages reachable both via Platform's own redirect buttons and natively from within Timesheet/Workload
(`BUG-PLT-038`), and a **missing** Platform-side screen for an entity Platform itself already depends on
(Department, `BUG-PLT-041`). All three point the same direction as the Team-role/leave-approval findings
(`BUG-PLT-037`/`039`): Team and its related Department concept are not yet consistently consolidated under
Platform across all three consumer plugins, even though the underlying data is already correctly shared.
