# BUG-TCM-009

- Bug ID: BUG-TCM-009
- Production Redmine Issue ID: #121699
- Title: Almost the entire plugin has no project-membership check at all — any logged-in user can view test suites, requirements, reports, traceability, to-dos and runs for a PRIVATE project they are not a member of, just by knowing the project identifier
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (dedicated fixture project `tcm-permissions-private-test`, created Private specifically to isolate this check)
- Browser: Chromium (Playwright MCP)
- User role: Reporter (`daisy.skye`) — genuinely **not a member** of the target project at all (`membership` is `nil` in the DB), not merely a denied role within it
- Date: 2026-09-30

## Summary

`tcm-permissions-private-test` was created as a brand-new **Private** project (`is_public? == false`) with the
Testcase Management module enabled, and `daisy.skye` was never added as a member. Confirmed via Rails console:
`u.membership(p) == nil` and `u.allowed_to?(:view_project, p) == false`. Redmine's own core correctly returns
**403** for her on `/projects/tcm-permissions-private-test` (the plain project overview) — the project isolation
itself is configured correctly.

Yet every read-surface page of the Testcase Management plugin renders **fully and normally** for her on this same
project, just by hitting the URL directly with `project_id=tcm-permissions-private-test`:

| URL | Result for non-member `daisy.skye` |
|---|---|
| `/test_suites/releases?project_id=...` (Overview/dashboard) | 200 — full nav + dashboard chart render |
| `/test_suites?project_id=...` (Test Cases) | 200 — full suite tree page |
| `/runs/new?project_id=...` (Runs & Results) | 200 — full "Runs & Results" listing, tabs, search |
| `/projects/.../testcase_reports` (Reports) | 200 — full reports list page |
| `/requirements?project_id=...` (Requirement) | 200 — full requirements list page |
| `/traceability_rtms?project_id=...` (Traceability Matrix) | 200 — full RTM page |
| `/testcase_todos?project_id=...` (To Do) | 200 — full to-do listing page |
| `/projects/.../testcase_environment` (Environment) | 200 — full environment settings page |

Every single plugin nav tab is reachable. Only the plain Redmine `/projects/<id>` core page correctly blocks her —
proving this is not a project-configuration mistake, it is the plugin's own controllers never checking project
membership before rendering.

**This is a different, broader defect than BUG-TCM-007.** BUG-TCM-007 is about *write* actions (create/edit/delete)
in 3 controllers missing a **role-permission** check for a user who already has legitimate access to the project.
This bug is about *every* controller's *read* actions (`index`/`new`/`show`) missing the **project-membership**
check itself — it affects controllers already confirmed correctly permission-checked on their write side (e.g.
`runs_controller.rb`'s `create`/`edit`/`close`/`delete` all correctly call `allowed_to?`, but its own `new`/`index`
actions have none). This means a completely uninvolved, unrelated user on the Redmine instance can browse another
team's private QA test plans, requirements, defect traceability, and run results — a cross-project information
disclosure, not just a within-project privilege escalation.

Anonymous (fully logged-out) access to the same URLs correctly redirects to `/login` — this instance has Redmine's
"Authentication required" site setting on, which is what actually stops anonymous users, not anything in the
plugin. That global setting has nothing to do with per-project isolation, so it does not mitigate this at all for
any of the many other legitimate, logged-in, non-member users on a real multi-team Redmine instance.

**A second, related gap found the same day (TC-TCM-077): the plugin also never checks whether its own module is
enabled for the project.** On `test-project` (an existing, populated project — 807 test cases), the Admin disabled
the "Redmineflux Testcase Management" module in Project Settings → Modules. As `summer.rain` (a genuine project
*member*, just testing the module-disabled state): the "TestCases" tab correctly disappeared from the project's
top navigation (module-gating works correctly for the tab itself), but `GET /test_suites?project_id=test-project`
and `GET /runs/new?project_id=test-project` **both still rendered fully** — the entire 807-row Testcase Summary
grid with pagination, and the full Runs & Results listing, exactly as if the module were still enabled. This is
the same missing-guard pattern as the membership gap above (no check runs before the controller queries and
renders project data), just against a different precondition (`@project.module_enabled?('testcase_management')`
instead of `allowed_to?(:view_project, ...)`) — both belong on the same proposed shared guard.

## Steps to reproduce

1. Create a new **Private** project (e.g. `tcm-permissions-private-test`) with the Testcase Management module
   enabled. Do not add a particular user (e.g. `daisy.skye`) as a member.
2. Confirm in Rails console: `user.membership(project)` is `nil` and `user.allowed_to?(:view_project, project)` is
   `false`.
3. Log in as that user and request, directly by URL, any of: `/test_suites/releases?project_id=<id>`,
   `/test_suites?project_id=<id>`, `/runs/new?project_id=<id>`, `/projects/<id>/testcase_reports`,
   `/requirements?project_id=<id>`, `/traceability_rtms?project_id=<id>`, `/testcase_todos?project_id=<id>`.
4. Compare against requesting the plain `/projects/<id>` core Redmine page as the same user.

## Expected result

- Every plugin URL above should refuse access (403/redirect) exactly like the plain `/projects/<id>` page does,
  since the user has no membership and no role on this project at all.

## Actual result

- The plain `/projects/<id>` page correctly returns 403.
- All seven plugin URLs listed above return 200 and render their full, normal content for the same non-member
  user on the same private project.

## Root cause

Every one of the plugin's controllers resolves `@project` the same insufficient way and never follows it with an
access check:

`app/controllers/test_suites_controller.rb`:
```ruby
def find_project
  @project = Project.find(params[:project_id])
end
```
(used as a `before_action` for `:index, :new, :create, :edit, :update, :show` — no `allowed_to?`/membership check
anywhere after it)

`app/controllers/testcase_reports_controller.rb`:
```ruby
def set_project
  @project = Project.find(params[:project_id])
end
```
(`require_login` is present, but that only proves the user is *someone*, not that they belong to *this* project)

`app/controllers/requirements_controller.rb#index`:
```ruby
def index
  @project = Project.find(params[:project_id])
  @requirements = Requirement.where(project_id: @project.id)
  ...
```
(no `require_login` at all on `index`, no permission/membership check)

`app/controllers/traceability_rtms_controller.rb#index` — identical pattern, `@project = Project.find(...)` with
zero checks of any kind (not even `require_login`).

`app/controllers/testcase_todos_controller.rb#index` — same `@project = Project.find(...)`; it does branch on
`allowed_to?(:view_all_todos, @project)` to decide *whose* to-dos to list, but never gates whether this user
should see this project's to-do list *at all*.

`app/controllers/runs_controller.rb` — `before_action :authorize, only: [:index]` is **commented out** (line 10),
and `before_action :require_login` is scoped to `only: [:index, :create]`, leaving `new` and `show` with no login
requirement and no project check whatsoever. The controller's `create`/`edit`/`close_run`/`delete` actions do
correctly call `User.current.allowed_to?(:create_run, @project) || User.current.admin?` etc. — proving the
project/permission relationship is understood and used correctly for writes, just never applied to reads.

The consistent, missing piece everywhere is a guard equivalent to:
```ruby
unless User.current.allowed_to?(:view_project, @project) || User.current.admin?
  render_403
  return
end
```
run right after `@project` is resolved and before any data for that project is queried or rendered — the same
shape of check the write actions in `runs_controller.rb` already use correctly, just for `view_project` and on
the read actions instead.

## Suggested fix

Add a `before_action` (e.g. `:authorize_project_access`) to every plugin controller that resolves `@project` from
`params[:project_id]`, checking **both** conditions Redmine core already checks on `/projects/<id>`:
`User.current.allowed_to?(:view_project, @project) || User.current.admin?` **and**
`@project.module_enabled?('testcase_management')` — rendering/redirecting 403 on failure either way. This should
be centralized (e.g. a shared concern/module included by all these controllers) rather than repeated seven-plus
times, both to fix the current gap and to prevent a new controller from reintroducing it.

## Evidence

### Screenshot

![Non-member daisy.skye fully views the private project's Test Cases page](../../screenshots/BUG-TCM-009/non-member-daisy-views-private-project-test-suites.png)

### Console / log

Rails console, confirming the access-control baseline this bug violates:
```
user: 112 daisy.skye
project: 11 tcm-permissions-private-test is_public=false
membership: nil
allowed_to?(:create_run): false
allowed_to?(:view_project): false
```

Live requests (all as `daisy.skye`, same session):
```
GET /projects/tcm-permissions-private-test                          -> 403 Forbidden   (core Redmine, correct)
GET /test_suites/releases?project_id=tcm-permissions-private-test   -> 200 (full dashboard rendered)
GET /test_suites?project_id=tcm-permissions-private-test            -> 200 (full suite tree rendered)
GET /runs/new?project_id=tcm-permissions-private-test               -> 200 (full Runs & Results page)
GET /projects/tcm-permissions-private-test/testcase_reports         -> 200 (full Reports list)
GET /requirements?project_id=tcm-permissions-private-test           -> 200 (full Requirements list)
GET /traceability_rtms?project_id=tcm-permissions-private-test      -> 200 (full RTM page)
GET /testcase_todos?project_id=tcm-permissions-private-test         -> 200 (full To Do page)
GET /projects/tcm-permissions-private-test/testcase_environment     -> 200 (full Environment settings page)
```

Anonymous (logged-out) requests to the same URLs redirect to `/login` — blocked only by the instance-wide
"Authentication required" setting, not by anything project-specific in the plugin.

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_PERMISSIONS.md` (final-cycle regression, 2026-09-30):
- TC-TCM-074 (Non-member cannot reach any plugin area of a private project) — **FAIL**
- TC-TCM-077 (Module disabled removes all access) — **FAIL** (tab correctly hidden, but direct URLs still work)

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — BUG-TCM-007 is related (also a missing-authorization defect
  found in the same session) but is a distinct root cause: BUG-TCM-007 is a missing **role-permission** check on
  *write* actions in 3 controllers for users who already belong to the project; this bug is a missing **project-
  membership** check on *read* actions across effectively the whole plugin, including controllers whose write
  actions are already correctly protected.

## Production report

Reported to production `ztflux` as **#121699** on 2026-09-30, assigned to Sheetal Sharma. Linked via `report_defect`
against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and run
#592, environment "Window 11 + Chrome". Priority: High (priority_id 3); Defect custom fields: Type=Functional,
Severity=High-severity, Priority=High.
