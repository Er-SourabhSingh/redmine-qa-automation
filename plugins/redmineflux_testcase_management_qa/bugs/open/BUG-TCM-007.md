# BUG-TCM-007

- Bug ID: BUG-TCM-007
- Production Redmine Issue ID: #121645 (https://flux.zehntech.com/issues/121645) — created 2026-09-30, assigned to Sheetal Sharma, Priority High, Defect Severity High-severity
- Title: Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission check at all — any project member can create, edit or delete them regardless of role
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Reporter (`daisy.skye`) — a role deliberately configured with **zero** Testcase Management permissions, as the "denied role" fixture for `TESTCASE_MANAGEMENT_PERMISSIONS.md`
- Date: 2026-09-30

## Summary

Of the plugin's 17 permissions across 6 groups, **9 are completely unenforced at the controller level**:

- **Test Suite Management**: `create_test_suite`, `edit_test_suite`, `delete_test_suite`
- **Reporting**: `create_report`, `edit_report`, `delete_report`
- **Requirement Management**: `add_requirement`, `edit_requirement`, `delete_requirement`

A logged-in project member holding **none** of these permissions can still create, edit, and delete test suites, reports, and requirements — either via a direct URL (the create/edit forms render normally) or via a direct POST to the create endpoint. The UI correctly *hides* the buttons/icons for a denied role in most cases (a good sign the permission is at least known to the front end), but the corresponding controller actions never check it, so hiding the control is security theater, not a security boundary.

**By contrast, the other 3 permission groups are implemented correctly** and were spot-checked as a control: `create_run`/`edit_run`/`close_run`/`delete_run` (`runs_controller.rb`), `execute_testcase` (`issue_status_results_controller.rb`, with a sensible additional carve-out for the case's own assignee), and `view_all_todos` (`testcase_todos_controller.rb`) all call `User.current.allowed_to?(...)` before acting and correctly refuse. This proves the gap is a real omission in 3 specific controllers, not a deliberate design choice or an environment issue.

## Steps to reproduce

1. Confirm the target role/user holds none of `create_test_suite`, `edit_test_suite`, `delete_test_suite`, `create_report`, `edit_report`, `delete_report`, `add_requirement`, `edit_requirement`, `delete_requirement` (here: Reporter role, granted zero Testcase Management permissions).
2. Log in as that user and, in a project with the TestCases module enabled:
   - Request `/test_suites/new?project_id=<id>` directly.
   - Request `/projects/<id>/testcase_reports/new` directly.
   - POST directly to `/requirements` with a `requirement[title]` and `requirement[project_id]`.
3. Observe whether the forms render and whether submitting them succeeds.
4. As an Admin/Manager afterward, check whether the resulting test suite / report / requirement actually exists.

## Expected result

- Every one of these 9 actions should return a 403/redirect with no write performed, matching the behavior already correctly implemented for Test Run Management, Test Execution, and To-Do Management.

## Actual result

Live-confirmed, three separate write paths, same denied user (`daisy.skye`, Reporter, zero Testcase Management permissions):

| Action | Path | Result |
|---|---|---|
| Create Test Suite | `GET /test_suites/new` renders full form → submitted | **Suite created** (`testsuite_id=6`) |
| Edit Test Suite | `GET /test_suites/6/edit` | Full edit form rendered normally |
| Delete Test Suite | `POST /test_suites/6` with `_method=delete` | **Suite genuinely deleted** — confirmed absent from the list afterward |
| Create Requirement | `POST /requirements` with `requirement[title]=...` | **201 Created**, real `id=4` returned in the JSON body |
| Create Report | `GET /projects/test-project/testcase_reports/new` renders full form → submitted | **"Report created successfully"** flash shown; confirmed via Rails console: `TestcaseReport id=12, created_by_id=112` (Daisy's own user id) |

The Requirements and Reports UI does hide the relevant create/edit controls for this role in the normal navigation flow (a partial mitigation — an attacker needs to know or guess the URL/endpoint), but the **Test Suite Management** UI does not even do that: the "Add Test Suite" icon in the sidebar tree is gated correctly by `User.current.admin? || User.current.allowed_to?(:create_test_suite, @project)` in `test_suites/index.html.erb`, so it *is* hidden for a denied role — but the `/test_suites/new` and `/test_suites/:id/edit` routes it points to, and the `create`/`update`/`destroy` actions, have no such check at all, so any project member who knows or is sent the URL can act regardless of what the sidebar shows them.

## Root cause

`app/controllers/test_suites_controller.rb` — `new`, `create`, `edit`, `update`, `destroy` (lines 350–620ish): no `before_action :authorize`, no `allowed_to?` call anywhere in any of the five actions.

`app/controllers/testcase_reports_controller.rb` — `new`, `create`, `edit`, `update`, `destroy`: only `before_action :require_login`; no permission check. `destroy` in particular (~line 397) looks up the report by ID from params and destroys it unconditionally for any logged-in user.

`app/controllers/requirements_controller.rb` — `create`, `update`, `destroy` (lines 41–64): no permission check in the action bodies. The `allowed_to?(:add_requirement, ...)` / `allowed_to?(:edit_requirement, ...)` calls that do exist in this file (lines 88–90, 132, 280, 353–354) are all in *other* methods that compute UI-facing permission flags (what buttons to show) or handle a different code path — they are never invoked as a guard on `create`/`update`/`destroy` themselves.

Compare with the correct pattern already used elsewhere in the plugin, e.g. `runs_controller.rb`:
```ruby
def create
  ...
  unless User.current.allowed_to?(:create_run, @project) || User.current.admin?
    respond_to do |format|
      format.html { redirect_back fallback_location: root_path, alert: l(:error_unauthorized_access) }
      format.json { render json: { error: l(:error_unauthorized_access) }, status: :forbidden }
    end
    return
  end
  ...
end
```

## Suggested fix

Add the equivalent `User.current.allowed_to?(:<permission>, @project) || User.current.admin?` guard (rendering/redirecting with 403 when it fails, matching the existing pattern in `runs_controller.rb`, `issue_status_results_controller.rb`, and `testcase_todos_controller.rb`) to:
- `test_suites_controller.rb#new/create` (`create_test_suite`), `#edit/update` (`edit_test_suite`), `#destroy` (`delete_test_suite`)
- `testcase_reports_controller.rb#new/create` (`create_report`), `#edit/update` (`edit_report`), `#destroy` (`delete_report`)
- `requirements_controller.rb#create` (`add_requirement`), `#update` (`edit_requirement`), `#destroy` (`delete_requirement`)

## Evidence

### Screenshot

![Reporter (zero Testcase Management permissions) can reach the full "New report" creation form directly](../../screenshots/BUG-TCM-007/reporter-can-reach-new-report-form.png)

### Console / log

Rails console confirmation that the denied user's write actually persisted:
```
TestcaseReport.where(name: "BUG-TCM-Denied-Reporter-CanCreateReport").first
=> EXISTS id=12 created_by=112   # 112 = daisy.skye's user id

fetch('/requirements', { method: 'POST', ... requirement[title]=... })
=> 201 {"id":4,"title":"BUG-TCM-Denied-Reporter-CanCreateRequirement", ...}
```

Both fixtures (`TestcaseReport` id 12, `Requirement` id 4) and the test suite (`testsuite_id=6`) created during this investigation were cleaned up afterward — none are load-bearing test data.

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_PERMISSIONS.md` (final-cycle regression, 2026-09-30):
- TC-TCM-048 (Create Test Suite, endpoint leg) — **FAIL**
- TC-TCM-049 (Edit Test Suite, endpoint leg) — **FAIL**
- TC-TCM-050 (Delete Test Suite, endpoint leg) — **FAIL**
- TC-TCM-063 (Create Report, endpoint leg) — **FAIL**
- TC-TCM-064 (Edit Report, endpoint leg) — **FAIL** (by source-code inspection; live-verified for create/destroy)
- TC-TCM-065 (Delete Report, endpoint leg) — **FAIL** (by source-code inspection, `destroy` has no guard)
- TC-TCM-070 (Add Requirement, endpoint leg) — **FAIL**
- TC-TCM-071 (Edit Requirement, endpoint leg) — **FAIL** (by source-code inspection)
- TC-TCM-072 (Delete Requirement, endpoint leg) — **FAIL** (by source-code inspection)

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` — BUG-TCM-003 is a related but distinct defect (a `.json`-route auth bypass specific to Runs' bulk-update endpoint, already fixed). This bug is a different root cause (missing authorization checks entirely, not a routing/format issue) affecting different controllers.

## Production report

Reported to `ztflux` on 2026-09-30 as **#121645**, Bug tracker, category Testcase Management Plugin, Priority
High, assigned to Sheetal Sharma. Custom fields set in the same `create_issue` call: Defect Type Functional,
Defect Severity High-severity, Defect priority High (IDs 43/44/45). Description in Textile, no attachments (per
the established channel-size caution for this repo) — full evidence carried in the Description text instead.
