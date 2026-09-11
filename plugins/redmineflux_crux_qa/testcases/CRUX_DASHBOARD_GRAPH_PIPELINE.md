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

### TC-CRX-062: Dashboard shows a merged Flux + Crux-store snapshot

**User Role:** Logged-in user with `view_crux`.
**Precondition:** None.

**Steps:**
1. Open the Crux dashboard (top menu → Crux).
2. Check for issues, agents, runs, dispatch, blockers, aggregates, outcomes, and Work Packages sections.

**Expected Result:**
- All listed categories render with real data (or an honest "none" state) — no category silently missing or erroring.

---

### TC-CRX-063: Dashboard scopes correctly by `?project=`

**User Role:** Same as TC-CRX-062.
**Precondition:** At least two projects with different Work Packages/issues.

**Steps:**
1. View the unscoped dashboard.
2. Scope to project A (`?project=<A>`).
3. Scope to project B.

**Expected Result:**
- Each scoped view shows only that project's data — no cross-project bleed (e.g. project A's Work Packages appearing while scoped to B).

---

### TC-CRX-064: The GLOBAL dashboard does NOT actually require `view_crux` — any logged-in user can view it (by design)

**User Role:** Logged-in user whose role lacks `view_crux` entirely.
**CORRECTED 2026-09-11 (source review):** the original version of this TC expected the dashboard to be blocked without `view_crux`. That was wrong for the GLOBAL dashboard specifically — `CruxDashboardController` only has `before_action :require_login` on `index`/`data` (no `view_crux` check exists in the controller at all). This is confirmed as *intentional*, not an oversight — `init.rb`'s `view_crux` permission declaration covers these actions for the Roles-admin checkbox UI, but runtime enforcement was deliberately left at "any logged-in user" for the global scope. The PROJECT-scoped tab is different — see TC-CRX-004 and this suite's own project-graph TCs, which DO enforce `view_crux` + membership via Redmine's standard `authorize`.

**Steps:**
1. As a logged-in user with `view_crux` on NO role at all (not even a project role), navigate directly to `/crux` (not via the menu — the menu itself has no permission check either, see `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-010).
2. Confirm the dashboard loads and `data` (`GET /crux/dashboard.json`) returns real content.

**Expected Result:**
- The dashboard loads successfully — this is the CORRECT, by-design behavior, not a bug. **Only file a bug if the opposite happens** (i.e. if live behavior actually blocks this user) — that would mean the code doesn't match its own committed comments, worth investigating further before concluding either way is "correct."
- Cross-check: a user WITH `view_crux` sees identical access — `view_crux` genuinely changes nothing for this specific endpoint at the global scope.

---

## Positive Cases — Project Graph (CRX-24)

---

### TC-CRX-065: Project work graph renders nodes/edges for a real project

**User Role:** Logged-in user with `view_crux`, member of the target project.
**Precondition:** A project with several related issues/Work Packages.

**Steps:**
1. Open the project's "Crux" tab.
2. View the work graph.
3. Vary the `days=<n>` parameter if exposed in the UI.

**Expected Result:**
- The graph renders real nodes/edges matching actual issue relationships — not placeholder/sample data.
- Changing the day range changes the graph's scope accordingly.

---

## Positive Cases — Pipeline Board

---

### TC-CRX-066: Create, edit, and delete a pipeline template

**User Role:** Logged-in user with `manage_crux_pipelines` (global permission).
**Precondition:** None.

**Steps:**
1. Create a new pipeline template (`crux-pipeline/v1` format) with a distinct test name.
2. Edit it (change a stage/gate).
3. Delete it.

**Expected Result:**
- Create/edit/delete all succeed and persist correctly (verify via `GET /api/pipelines` or reload between each step).
- After delete, the template no longer appears in the list.

---

### TC-CRX-067: Pipeline templates are global, not per-project

**User Role:** Same as TC-CRX-066.
**Precondition:** A pipeline template created while scoped to/viewing project A.

**Steps:**
1. Create a pipeline template while on project A's context (if the UI has any project scoping for pipelines at all).
2. Switch to project B's context and check the pipeline board.

**Expected Result:**
- The template is visible from project B too — pipelines are org-wide templates, not per-project (per `init.rb` comment on `manage_crux_pipelines`).

---

## Negative Cases

---

### TC-CRX-068: A user without `manage_crux_pipelines` cannot save or delete a pipeline (viewing needs only login, not `view_crux`)

**User Role:** Logged-in user with NO Crux permissions at all (not even `view_crux`).
**CORRECTED 2026-09-11 (source review):** viewing succeeding is NOT because of `view_crux`'s `read: true` — `CruxPipelinesController` only requires `before_action :require_login` for `index`/`list`, with its own comment confirming this: "Visibility mirrors the dashboard: any logged-in user can look." Only `save`/`destroy` check `manage_crux_pipelines` via a custom `require_manage_pipelines` method.
**Precondition:** None.

**Steps:**
1. View the pipeline board as a user with zero Crux permissions (should still work).
2. Attempt to save a new/edited pipeline, or delete one.

**Expected Result:**
- Viewing succeeds even with zero Crux permissions — confirms it's login-only, not `view_crux`-gated.
- Save/delete are refused (403 `{"ok": false, "error": "You are not allowed to manage pipelines."}`) — this part gated correctly by `manage_crux_pipelines`.

---

### TC-CRX-069: Deleting a pipeline template in active use is handled gracefully

**User Role:** Same as TC-CRX-066.
**Precondition:** A pipeline template currently referenced by an in-progress Work Package.

**Steps:**
1. Attempt to delete that pipeline template.

**Expected Result:**
- Exploratory — document actual behavior (refused with a clear reason, or allowed with the in-progress WP left in some defined state). Flag as a bug only if the WP ends up in a broken/undefined state (e.g. errors on load, orphaned gate references) rather than a deliberate, documented choice either way.

---

## Additional Cases (added 2026-09-11 after full controller/route source review)

> A whole feature — the Run Ledger "View All" pages — had zero test coverage until this pass. Routes: `GET /crux/runs(.json)` (global, `CruxDashboardController#runs`/`#runs_data`) and `GET /projects/:project_id/crux/runs(.json)` (project-scoped, `CruxProjectController#runs`/`#runs_data`). Both exist specifically because the dashboard's own run table caps at the most recent 25 rows.

---

### TC-CRX-142: Run Ledger "View All" (global) — any logged-in user can view, with pagination/filters

**User Role:** Any logged-in user (no Crux permissions required — same pattern as TC-CRX-064).
**Precondition:** More than 25 runs exist so the dashboard's own capped table isn't the full picture.

**Steps:**
1. Navigate to `/crux/runs`.
2. Page through results (`?page=2`), and filter by `agent=`, `outcome=`, and `model=`.

**Expected Result:**
- Page loads for any logged-in user, no `view_crux` required (confirmed via source: only `require_login`).
- Pagination and each filter narrow results correctly — `runs_query_string` only forwards `page`, `page_size`, `agent`, `outcome`, `model`; a malformed `page`/`page_size` (non-numeric) silently falls back to defaults (`1`/`25`) rather than erroring — worth confirming this fallback live too.

---

### TC-CRX-143: Run Ledger "View All" (project-scoped) — requires `view_crux` + project membership

**User Role:** (a) Project member with `view_crux`; (b) logged-in user who is NOT a member of the project.
**Precondition:** A project with more than 25 runs.

**Steps:**
1. As user (a), navigate to `/projects/<id>/crux/runs`.
2. As user (b), attempt the same.

**Expected Result:**
- User (a) succeeds, sees only that project's runs (per `CruxProjectController#runs_data`'s `project=<identifier>` scoping — confirm no cross-project bleed, similar to TC-CRX-063).
- User (b) is refused — `CruxProjectController` uses standard Redmine `before_action :authorize`, which is genuinely membership + `view_crux` scoped (unlike the global dashboard in TC-CRX-064/142). This is the real contrast case proving the global-vs-project distinction is deliberate, not accidental.

---

### TC-CRX-144: Crux project module disabled — project tab and all project-scoped routes are blocked, even for a `view_crux`-holding member

**User Role:** A project member with `view_crux` on their project role.
**Precondition:** The "Redmineflux Crux" module is DISABLED for this project (project → Settings → Modules).

**Steps:**
1. Open the project — check for the "Crux" tab.
2. Attempt direct navigation to `/projects/<id>/crux`, `/projects/<id>/crux/graph`, and `/projects/<id>/crux/runs`.

**Expected Result:**
- The tab is absent (module disabled removes the menu item's project-module gate).
- All three direct URLs are blocked server-side (not just hidden) — re-enable the module and confirm the exact same user/permission combo now succeeds, isolating the module toggle as the actual variable.

---

## Evidence Map

- Case IDs: TC-CRX-062 through TC-CRX-069, TC-CRX-142 through TC-CRX-144
- Screenshots: bugs only.
- Log: —
- Bug reference: —
