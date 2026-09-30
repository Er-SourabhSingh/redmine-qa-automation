# BUG-TCM-008

- Bug ID: BUG-TCM-008
- Production Redmine Issue ID: #121698
- Title: Run detail page crashes with an unhandled 500 error whenever the run's environment-assignee user has been deleted
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator — reproduces for every role, this is not a permission issue
- Date: 2026-09-30

## Summary

Opening any run whose environment-assignee (`RunAssignment#assignee_id`) points at a Redmine user that no longer
exists crashes the entire run detail page with an unhandled `ActiveRecord::RecordNotFound`, shown to the user as
a generic error page (renders as Redmine's 404 template, though the server actually returns a 500). The run
becomes completely unviewable — no results, no test case grid, nothing — until the stale assignee is manually
fixed at the database level, since there is no UI path to reach or reassign it once the page itself won't load.

Found incidentally while executing `TESTCASE_MANAGEMENT_PERMISSIONS.md` (TC-TCM-060): two pre-existing runs in
`test-project` (runs #3 and #5, both fixtures from earlier sessions) turned out to be unviewable by any role,
including Admin — not a permission-denial as first suspected, but a genuine crash.

## Steps to reproduce

1. Create a run and assign it to an environment with a specific user as the environment's assignee.
2. Delete that user from Redmine (`Administration → Users → Delete`), or otherwise let the user record be removed.
3. Open the run's detail page (`/runs/<id>?project_id=<project>`).

## Expected result

- The page renders normally. If the assignee can no longer be resolved, it should show something like
  "(unknown user)" or blank, not crash the whole page.

## Actual result

- The page raises an unhandled `ActiveRecord::RecordNotFound` and the user sees a generic error page with no
  useful information. Confirmed for two separate pre-existing runs, both for Admin (rules out a permission cause):

```
Run 3 ("run3 dsafasd fasdf asd fasd fasd"): run_assignment environment=edge, assignee_id=49 — User 49 does not exist
Run 5 ("asdf"): run_assignment environment=fdsgsdf, assignee_id=48 — User 48 does not exist

GET /runs/3?project_id=test-project → 500 Internal Server Error
GET /runs/5?project_id=test-project → 500 Internal Server Error
```

## Root cause

`app/helpers/runs_helper.rb#enviroment_assignee`:

```ruby
def enviroment_assignee(run_id,enviroment)
  @run = Run.find(run_id)
  run_assignment = @run.run_assignments.find_by(environment: enviroment)
  assignee_id = run_assignment&.assignee_id
  user_name= User.find(assignee_id) if assignee_id   # <-- raises if the user no longer exists
  user_name.name
end
```

`User.find(assignee_id)` raises `ActiveRecord::RecordNotFound` when the referenced user has been deleted. This
is called directly from `app/views/runs/show.html.erb:138` while rendering the run's info panel, so the
exception propagates all the way up and takes down the entire page — there is no rescue anywhere in the call
chain. The method already correctly guards against a *missing run assignment* (via `run_assignment&.assignee_id`)
but not against a *missing user* for an assignment that still exists.

## Suggested fix

Use `User.find_by(id: assignee_id)` instead of `User.find(assignee_id)`, and handle the nil case explicitly, e.g.:

```ruby
def enviroment_assignee(run_id, enviroment)
  @run = Run.find(run_id)
  run_assignment = @run.run_assignments.find_by(environment: enviroment)
  assignee_id = run_assignment&.assignee_id
  return '' unless assignee_id
  user = User.find_by(id: assignee_id)
  user ? user.name : l(:label_user_deleted) # or similar fallback string
end
```

## Evidence

### Screenshot

![Run detail page crashes with a generic error page](../../screenshots/BUG-TCM-008/run-detail-500-error-deleted-assignee.png)

### Console / log

```
F, [...] FATAL -- : ActionView::Template::Error (Couldn't find User with 'id'=48)
Caused by: ActiveRecord::RecordNotFound (Couldn't find User with 'id'=48)
  plugins/redmineflux_testcase_management/app/helpers/runs_helper.rb:75:in 'RunsHelper#enviroment_assignee'
  plugins/redmineflux_testcase_management/app/views/runs/show.html.erb:138
```

(Same trace for run #3 with `User with 'id'=49`.)

## Test case coverage

Found while executing TC-TCM-060 (`TESTCASE_MANAGEMENT_PERMISSIONS.md`) — the initial 404 seen for a
zero-permission user on run #6 was a red herring (run #6 had genuinely been deleted earlier in the same
session as part of TC-TCM-057); re-verifying against runs #3 and #5 (which do exist) surfaced this real, separate
defect instead, reproducing for Admin too.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` — no existing bug covers run-detail rendering or stale user references.

## Production report

Reported to production `ztflux` as **#121698** on 2026-09-30, assigned to Sheetal Sharma. Linked via `report_defect`
against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and run
#592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom fields: Type=Functional,
Severity=Medium-severity, Priority=Medium.
