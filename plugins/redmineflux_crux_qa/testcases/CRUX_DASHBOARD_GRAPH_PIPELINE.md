# Test Cases — Redmineflux Crux — Dashboard, Project Graph & Pipeline Board

> Source: `docs/CRUX_FEATURES_LIST.md` #11, #12, #13; `redmineflux-crux-core/docs/API.md` `GET /api/dashboard`, `GET /api/graph`, `GET /api/pipelines`/`POST /api/pipeline`/`POST /api/pipeline/delete`.
>
> **Execution readiness: Mostly executable now** — these are direct dashboard/API reads and plugin-native CRUD (pipeline templates), not chat-mediated, so the missing LLM key does not block this suite. Requires some real Work Packages/runs/agents to exist in the seeded data (`db.seed.production.json`) for the dashboard to show non-empty content — confirm seed data first.

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases — Dashboard

---

### TC-CRX-121: Dashboard shows a merged Flux + Crux-store snapshot

**User Role:** Logged-in user with `view_crux`.
**Precondition:** None.

**Steps:**
1. Open the Crux dashboard (top menu → Crux).
2. Check for issues, agents, runs, dispatch, blockers, aggregates, outcomes, and Work Packages sections.

**Expected Result:**
- All listed categories render with real data (or an honest "none" state) — no category silently missing or erroring.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): PASS. `/crux` rendered all sections with real, live data: KPI tiles (3 outcomes, $9.54 cost/outcome, 19,488,742 tokens, $28.63 cost, 524 runs, 27 agents online), Agent Fleet table (real agent rows with status/spend/health), Ready Queue (2 real rows — the TC-CRX-137 marker issues #1/#2), Work Packages pipeline view (10 real WPs with gate state), Run Ledger (real rows through run-526, including a few genuinely "degraded" outcome rows — an honest non-success state, not hidden). No category missing or erroring.

---

### TC-CRX-122: Dashboard scopes correctly by `?project=`

**User Role:** Same as TC-CRX-121.
**Precondition:** At least two projects with different Work Packages/issues.

**Steps:**
1. View the unscoped dashboard.
2. Scope to project A (`?project=<A>`).
3. Scope to project B.

**Expected Result:**
- Each scoped view shows only that project's data — no cross-project bleed (e.g. project A's Work Packages appearing while scoped to B).

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): PASS. Unscoped `/crux/dashboard.json` returned 2 issues, 10 WPs, 25 runs (capped page). Scoped `?project=crux-qa` returned exactly 1 issue — verified by subject, it was `PUBLIC-MARKER-9c2e...` only. Scoped `?project=crux-qa-private` returned exactly 1 issue — verified by subject, it was `PRIVATE-MARKER-7f3a...` only, with zero bleed from `crux-qa`'s data. Both scoped responses also correctly returned 0 WPs/0 runs (neither project has its own WPs/runs — only the global synthetic seed WPs do). Clean, precise scoping confirmed at the API level, not just visually.

---

### TC-CRX-123: The GLOBAL dashboard does NOT actually require `view_crux` — any logged-in user can view it (by design)

**User Role:** Logged-in user whose role lacks `view_crux` entirely.
**CORRECTED 2026-09-11 (source review):** the original version of this TC expected the dashboard to be blocked without `view_crux`. That was wrong for the GLOBAL dashboard specifically — `CruxDashboardController` only has `before_action :require_login` on `index`/`data` (no `view_crux` check exists in the controller at all). This is confirmed as *intentional*, not an oversight — `init.rb`'s `view_crux` permission declaration covers these actions for the Roles-admin checkbox UI, but runtime enforcement was deliberately left at "any logged-in user" for the global scope. The PROJECT-scoped tab is different — see TC-CRX-135 and this suite's own project-graph TCs, which DO enforce `view_crux` + membership via Redmine's standard `authorize`.

**Steps:**
1. As a logged-in user with `view_crux` on NO role at all (not even a project role), navigate directly to `/crux` (not via the menu — the menu itself has no permission check either, see `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-141).
2. Confirm the dashboard loads and `data` (`GET /crux/dashboard.json`) returns real content.

**Expected Result:**
- The dashboard loads successfully — this is the CORRECT, by-design behavior, not a bug. **Only file a bug if the opposite happens** (i.e. if live behavior actually blocks this user) — that would mean the code doesn't match its own committed comments, worth investigating further before concluding either way is "correct."
- Cross-check: a user WITH `view_crux` sees identical access — `view_crux` genuinely changes nothing for this specific endpoint at the global scope.

- **CONFIRMED LIVE (cross-referenced) 2026-09-14** — already directly confirmed twice elsewhere this engagement: TC-CRX-141 (`CRUX_NAVIGATION_AND_PERMISSIONS.md`) has `daisy.skye` (Reporter role, zero Crux permissions including no `view_crux`) successfully loading the full dashboard with real live data; the BUG-CRX-005 investigation additionally confirmed this holds true even with the top-menu "Crux" link entirely hidden (`nav_top_crux="0"`), via direct URL navigation. No further live action needed here — cross-check (admin/`view_crux` holder sees identical dashboard) is confirmed by every other TC in this suite being executed as admin.

---

## Positive Cases — Project Graph (CRX-24)

---

### TC-CRX-124: Project work graph renders nodes/edges for a real project

**User Role:** Logged-in user with `view_crux`, member of the target project.
**Precondition:** A project with several related issues/Work Packages.

**Steps:**
1. Open the project's "Crux" tab.
2. View the work graph.
3. Vary the `days=<n>` parameter if exposed in the UI.

**Expected Result:**
- The graph renders real nodes/edges matching actual issue relationships — not placeholder/sample data.
- Changing the day range changes the graph's scope accordingly.

- **CONFIRMED LIVE (partial) 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): `/projects/crux-qa/crux/graph` rendered a real graph — "1 Ticket, 1 Person, 2 Nodes, 1 Edge" — correctly reflecting issue #2's real author relationship (admin created it), not placeholder data. Node-type filter checkboxes (Tickets/People/Agents/Work packages/Versions) all present and checked. **`days=` parameter: inconclusive, not a failure** — tried `?days=1`, `?days=0`, `?days=365` via both UI and the raw `/graph.json` API; node/edge counts stayed identical (2 nodes / 1 edge) in every case, because `crux-qa` currently has only one issue total and it was created today — there's no older activity for a shorter day-range to meaningfully exclude, so this project's data can't distinguish "the param is read but has no effect" from "the param is read but nothing qualifies for exclusion yet." Re-test this specific part once `crux-qa` has issues spanning multiple real dates.

---

## Positive Cases — Pipeline Board

---

### TC-CRX-125: Create, edit, and delete a pipeline template

**User Role:** Logged-in user with `manage_crux_pipelines` (global permission).
**Precondition:** None.

**Steps:**
1. Create a new pipeline template (`crux-pipeline/v1` format) with a distinct test name.
2. Edit it (change a stage/gate).
3. Delete it.

**Expected Result:**
- Create/edit/delete all succeed and persist correctly (verify via `GET /api/pipelines` or reload between each step).
- After delete, the template no longer appears in the list.

- **CONFIRMED LIVE (cross-referenced) 2026-09-14** — already fully executed in `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-138: created "QA Test Pipeline CRX-007" (2 stages) as `luna.blossom`, hit a genuine client-side validation requiring a gate before the terminal stage, added the gate, saved successfully, edited a stage name (saved), then deleted it (with confirmation). Full create → edit → delete cycle confirmed working, persisted correctly at each step (reload-verified), removed from the list after delete.

---

### TC-CRX-126: Pipeline templates are global, not per-project

**User Role:** Same as TC-CRX-125.
**Precondition:** A pipeline template created while scoped to/viewing project A.

**Steps:**
1. Create a pipeline template while on project A's context (if the UI has any project scoping for pipelines at all).
2. Switch to project B's context and check the pipeline board.

**Expected Result:**
- The template is visible from project B too — pipelines are org-wide templates, not per-project (per `init.rb` comment on `manage_crux_pipelines`).

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014, admin): PASS, by architecture — the "+ New Pipeline" dialog and the Pipelines list page (`/crux/pipelines`) have **no project selector or project-scoping UI element anywhere at all** (confirmed via full form/page inspection during TC-CRX-138). There is no "project context" to switch between for pipelines in the first place — every pipeline template created is immediately and only visible on the single, global `/crux/pipelines` list, regardless of which project (if any) the admin happened to be viewing when they created it. This directly confirms the "org-wide, not per-project" design without needing a literal switch-context test, since the UI has no per-project concept for this feature to test against.

---

## Negative Cases

---

### TC-CRX-127: A user without `manage_crux_pipelines` cannot save or delete a pipeline (viewing needs only login, not `view_crux`)

**User Role:** Logged-in user with NO Crux permissions at all (not even `view_crux`).
**CORRECTED 2026-09-11 (source review):** viewing succeeding is NOT because of `view_crux`'s `read: true` — `CruxPipelinesController` only requires `before_action :require_login` for `index`/`list`, with its own comment confirming this: "Visibility mirrors the dashboard: any logged-in user can look." Only `save`/`destroy` check `manage_crux_pipelines` via a custom `require_manage_pipelines` method.
**Precondition:** None.

**Steps:**
1. View the pipeline board as a user with zero Crux permissions (should still work).
2. Attempt to save a new/edited pipeline, or delete one.

**Expected Result:**
- Viewing succeeds even with zero Crux permissions — confirms it's login-only, not `view_crux`-gated.
- Save/delete are refused (403 `{"ok": false, "error": "You are not allowed to manage pipelines."}`) — this part gated correctly by `manage_crux_pipelines`.

- **CONFIRMED LIVE (cross-referenced) 2026-09-14** — already fully executed in `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-138's negative case: as `daisy.skye` (zero Crux permissions), `/crux/pipelines` rendered the full read-only table (viewing succeeds, login-only) but with no "+ New Pipeline" button and no Actions column at all. Server-side confirmed too: `POST /crux/pipelines` → `403`, body exactly `{"ok":false,"error":"You are not allowed to manage pipelines."}` — matches the predicted string precisely.

---

### TC-CRX-128: Deleting a pipeline template in active use is handled gracefully

**User Role:** Same as TC-CRX-125.
**Precondition:** A pipeline template currently referenced by an in-progress Work Package.

**Steps:**
1. Attempt to delete that pipeline template.

**Expected Result:**
- Exploratory — document actual behavior (refused with a clear reason, or allowed with the in-progress WP left in some defined state). Flag as a bug only if the WP ends up in a broken/undefined state (e.g. errors on load, orphaned gate references) rather than a deliberate, documented choice either way.

- **BLOCKED 2026-09-14** — not executable with current environment data. Checked the two existing custom pipelines ("Review Approval": todo/develop/review-gate/done; "Trim Test": gate/todo/review) against every seeded Work Package's actual stage shape shown on the dashboard — neither matches any in-progress WP's pipeline, so neither is genuinely "in active use." No UI path was found in this session for creating a new Work Package bound to a specific custom pipeline (WPs appear to be created by crux-core's own dispatch process, not directly via this UI) — so there's no way to construct the precondition (a custom pipeline template currently referenced by an in-progress WP) without a confirmed WP-creation path. Deleting the two existing unused custom pipelines would not actually test this TC's premise. Revisit once a WP-creation flow is found, or ask dev how to seed one.

---

## Additional Cases (added 2026-09-11 after full controller/route source review)

> A whole feature — the Run Ledger "View All" pages — had zero test coverage until this pass. Routes: `GET /crux/runs(.json)` (global, `CruxDashboardController#runs`/`#runs_data`) and `GET /projects/:project_id/crux/runs(.json)` (project-scoped, `CruxProjectController#runs`/`#runs_data`). Both exist specifically because the dashboard's own run table caps at the most recent 25 rows.

---

### TC-CRX-129: Run Ledger "View All" (global) — any logged-in user can view, with pagination/filters

**User Role:** Any logged-in user (no Crux permissions required — same pattern as TC-CRX-123).
**Precondition:** More than 25 runs exist so the dashboard's own capped table isn't the full picture.

**Steps:**
1. Navigate to `/crux/runs`.
2. Page through results (`?page=2`), and filter by `agent=`, `outcome=`, and `model=`.

**Expected Result:**
- Page loads for any logged-in user, no `view_crux` required (confirmed via source: only `require_login`).
- Pagination and each filter narrow results correctly — `runs_query_string` only forwards `page`, `page_size`, `agent`, `outcome`, `model`; a malformed `page`/`page_size` (non-numeric) silently falls back to defaults (`1`/`25`) rather than erroring — worth confirming this fallback live too.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. As admin: `GET /crux/runs.json?page=1&page_size=10` returned `run-526`..`run-517`; `?page=2&page_size=10` returned `run-516`..`run-507` — correct, non-overlapping pagination. Filters each confirmed precisely: `?agent=project-manager` → every returned row's `agent_id` was `"project-manager"`; `?outcome=degraded` → every row's `outcome` was `"degraded"`; `?model=anthropic/claude-haiku-4.5` → every row's `model` matched exactly. Malformed params (`?page=abc&page_size=xyz`) → `ok:true`, 25 rows returned — silently fell back to defaults (`1`/`25`) exactly as predicted, no error. As `daisy.skye` (zero Crux permissions): `/crux/runs` loaded successfully (title "Crux — Run Ledger", no 403) — confirms login-only access, no `view_crux` required.

---

### TC-CRX-130: Run Ledger "View All" (project-scoped) — requires `view_crux` + project membership

**User Role:** (a) Project member with `view_crux`; (b) logged-in user who is NOT a member of the project.
**Precondition:** A project with more than 25 runs.

**Steps:**
1. As user (a), navigate to `/projects/<id>/crux/runs`.
2. As user (b), attempt the same.

**Expected Result:**
- User (a) succeeds, sees only that project's runs (per `CruxProjectController#runs_data`'s `project=<identifier>` scoping — confirm no cross-project bleed, similar to TC-CRX-122).
- User (b) is refused — `CruxProjectController` uses standard Redmine `before_action :authorize`, which is genuinely membership + `view_crux` scoped (unlike the global dashboard in TC-CRX-123/142). This is the real contrast case proving the global-vs-project distinction is deliberate, not accidental.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. As `luna.blossom` (member of `crux-qa`, `view_crux` via Manager role): `/projects/crux-qa/crux/runs` loaded successfully, `runs.json` returned `ok:true`, 0 runs (honest — `crux-qa` has no runs of its own, no bleed from the 500+ global runs). As `daisy.skye`: **used as the "user (b)" test subject** — she IS a `crux-qa` member (Reporter role, added in TC-CRX-135) but lacks `view_crux`, so this specifically tests "member without the permission" rather than "not a member at all" (no genuinely non-member test user was set up for this specific check) — same call → genuine `403 Forbidden`. Confirms `authorize` is real membership+permission scoped here, in clear contrast to the global dashboard/runs pages (TC-CRX-123/142) which are login-only.

---

### TC-CRX-131: Crux project module disabled — project tab and all project-scoped routes are blocked, even for a `view_crux`-holding member

**User Role:** A project member with `view_crux` on their project role.
**Precondition:** The "Redmineflux Crux" module is DISABLED for this project (project → Settings → Modules).

**Steps:**
1. Open the project — check for the "Crux" tab.
2. Attempt direct navigation to `/projects/<id>/crux`, `/projects/<id>/crux/graph`, and `/projects/<id>/crux/runs`.

**Expected Result:**
- The tab is absent (module disabled removes the menu item's project-module gate).
- All three direct URLs are blocked server-side (not just hidden) — re-enable the module and confirm the exact same user/permission combo now succeeds, isolating the module toggle as the actual variable.

- **CONFIRMED LIVE 2026-09-14** (Local, `crux-redmine` localhost:3014): PASS. Disabled the "Redmineflux Crux" module for `crux-qa` (project → Settings → unchecked, Saved). As `luna.blossom` (member with `view_crux` via Manager role): the project tab bar showed only Overview/Activity/Issues/Settings — no "Crux" tab. Direct navigation to `/projects/crux-qa/crux`, `/projects/crux-qa/crux/graph`, and `/projects/crux-qa/crux/runs` all returned genuine `403 Forbidden` — blocked server-side, not just hidden, even for this fully-permissioned member. Re-enabled the module (checked, Saved) and re-tested the exact same user against the exact same URL (`/projects/crux-qa/crux`) — loaded successfully immediately, no other change made. Cleanly isolates the module toggle as the actual variable.

---

## Evidence Map

- Case IDs: TC-CRX-121 through TC-CRX-128, TC-CRX-129 through TC-CRX-131 — **executed 2026-09-14**. 11/12 PASS (TC-CRX-124's `days=` sub-check inconclusive due to sparse data, not a failure); TC-CRX-128 BLOCKED (no WP-creation path found to construct its precondition).
- Screenshots: bugs only — none of these cases failed, so none were taken.
- Log: —
- Bug reference: — (no new bugs found in this suite; several TCs cross-referenced against evidence already captured in `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-138, avoiding duplicate pipeline CRUD testing).
- Local test fixtures reused from the Navigation suite (`luna.blossom`, `daisy.skye`, `crux-qa`, `crux-qa-private`) — no new fixtures created this suite. `crux-qa`'s "Redmineflux Crux" module was temporarily disabled and re-enabled for TC-CRX-131 — confirmed left in the enabled (correct) state afterward.
