# BUG-TCM-086

- Bug ID: BUG-TCM-086
- Production Redmine Issue ID: #124227 (https://flux.zehntech.com/issues/124227) — assigned to Vaishnavi
  Bhawsar, priority High, Defect Type Functional / Defect Severity High-severity / Defect priority High,
  category Testcase Management Plugin, target version Testcase Management plugin Release 7.2.0. Linked to
  production Testcase #124225 ("RFTC043-9: Full DAST security_layer.py sweep executed live — found a real
  cross-project IDOR") in Run #612, environment Win + Chrome + Ver6, via `report_defect`.
- Title: `RunsController#get_testcases` (`GET /projects/:project_id/runs/:run_id/test-cases.json`) has zero
  authorization — any authenticated user of ANY project can read another project's full run execution
  grid (test case subjects, pass/fail results, assignees, linked defect ids) by guessing/incrementing a
  `run_id`, and the `:project_id` URL segment is not even checked against the run
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post-7.1.0, pre-7.2.0)
- Environment: Docker `localhost:3000` (`redmine6-redmine-1`), projects `rftc-016-ci-qa` (id=2),
  `rftc-038-multisuite-qa` (id=3)
- Browser: N/A — found via a direct API/security-tooling sweep (the rftc-043 DAST authz-matrix generator
  in `redmineflux-tcm-ci/harness/suites/security/security_layer.py`), confirmed via direct `httpx` calls
- User role: `dev1` — a real Redmine user, Developer role, member of project `rftc-038-multisuite-qa`
  (id=3) **only** — not a member of `rftc-016-ci-qa` (id=2) in any capacity
- Date: 2026-10-21

## Summary

Found while running the TCM Testing Harness's (rftc-042/043) DAST authz-matrix generator live, for the
first time ever, against `localhost:3000` with a full 4-persona roster (admin, qa.manager, reporter,
dev1) the user set up specifically for this purpose. The generator's `run_test_cases` probe
(`GET /projects/{p}/runs/{run_id}/test-cases.json`) returned **200 with real data** for `dev1` — a user
genuinely NOT a member of the project the run belongs to — on both the `primary` and `foreign` project
labels, which was flagged as a hard finding and independently reproduced by hand below.

## Steps to reproduce

1. On this instance: project `rftc-016-ci-qa` (id=2) owns Run #5. User `dev1` is a Redmine user who is a
   member of project `rftc-038-multisuite-qa` (id=3) **only**, role Developer, and has never been added to
   project 2 in any capacity.
2. As `dev1` (using their own, real Redmine API key), call:
   ```
   GET /projects/2/runs/5/test-cases.json
   Header: X-Redmine-API-Key: <dev1's key>
   ```
3. Observe the response.
4. Also try the same run id through the OTHER (dev1's own, project 3) URL segment:
   ```
   GET /projects/3/runs/5/test-cases.json
   ```

## Expected result

Both requests should be rejected (403 Forbidden, or 404 if the controller chooses not to disclose
existence) — `dev1` is not a member of project 2 and has no relationship to Run #5, which belongs to
project 2.

## Actual result

**Both requests return `200 OK` with the full, real run execution grid** — identical in both cases,
proving the `:project_id` URL segment is not validated against the run at all:

```json
{"test_suites":[{"id":3,"name":"CI Ingest","environments":{"CI":{"test_cases":[
  {"id":23,"subject":"test_login_valid","result":"Passed","priority":"Normal",
   "assigned_to":"Redmine Admin","defects":[]},
  {"id":24,"subject":"Apply valid discount code at checkout","result":"Failed","priority":"Normal",
   "assigned_to":"Redmine Admin","defects":[25]},
  ... (full list of every test case in the run, its latest result, assignee, and any linked defect ids)
]}}}]}
```

This is real operational QA data (who tested what, what failed, which defect it's linked to) leaked
cross-project to a user with zero relationship to the owning project.

## Root cause (confirmed via source read inside the container)

`app/controllers/runs_controller.rb:1030-1046` (`get_testcases`):

```ruby
def get_testcases
  if User.current.anonymous?
    render json: { error: l(:error_unauthorized_action) }, status: :forbidden
    return
  end
  project_id = params[:project_id]
  run_id = params[:run_id]
  project = Project.find_by(id: project_id)
  unless project
    render json: { error: l(:error_project_not_found_id, id: project_id) }, status: :not_found
    return
  end
  @run = Run.find_by(id: run_id)
  unless @run
    render json: { error: l(:error_run_not_found_id, id: run_id) }, status: :not_found
    return
  end
  @test_suites = @run.testsuites
  ...
```

The `project` variable is loaded from the URL's `:project_id` but is **never used again anywhere in the
method** — it is dead code, present only to produce a plausible-looking 404 if the id is garbage. `@run`
is loaded by raw `run_id` with **no scoping to `project` at all**, and no `allowed_to?`/`visible?` check
against either. The only gate in the whole action is "is this user anonymous" — any authenticated user of
any project on the instance passes.

**This is the exact SEC-001 / C3 pattern** ("authorize every action on the record's own project —
authenticate is not authorize") that `documents/security-rules.md` and the 2026-10-02 security review
already documented and fixed elsewhere in this same controller — but **not in this specific action**.
Confirmed via the controller's own `before_action` list (line 10-27): `rftc_authorize_run_update`,
`rftc_authorize_run_destroy`, and `rftc_authorize_run_close` gate `update`/`destroy`/`close_run`
respectively (the original C3 fix's scope), and `find_project` + the sibling action
`get_testcases_attribute` was separately and explicitly patched later (its own inline comment reads:
*"rftc-012 (TCM-042): the :project_id in the URL was never applied to the query or checked for
visibility, so this returned every test case on the instance to any authenticated user regardless of
which project they asked for"* — the exact same bug class, already recognized and fixed in that sibling
action). **`get_testcases` itself was missed by both the original C3 fix and the later
`get_testcases_attribute` follow-up fix**, despite being the action that actually powers the Run
Execution view's test-case grid in the UI.

## Suggested fix

Add the same `rftc_authorize_project_read!(@project)` (or equivalent) gate already used by
`get_testcases_attribute`, and scope `@run` to the resolved project
(`Run.find_by(id: run_id, project_id: project.id)`) instead of loading it by raw id alone — mirroring
exactly what was already done for the sibling action and for `update`/`destroy`/`close_run`.

## Test case coverage

Found 2026-10-21 via a live run of the TCM Testing Harness's rftc-043 DAST authz-matrix generator
(`redmineflux-tcm-ci/harness/suites/security/security_layer.py`), after the user set up a full 4-persona
test roster (`qa.limited`→Manager/project 2, `qanonadmin`→Developer/project 2, `dev1`→Developer/project 3
only) specifically to exercise this probe properly. Independently reproduced by hand via direct `httpx`
calls (see Steps to reproduce). Not yet mapped to an automation TC or added to
`RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md`/`RFTC-043_EXTERNAL_SPEC_SECURITY_DISCOVERY_TESTING.md` —
should be added to both as the concrete, real finding the harness's security layer was built to catch.

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this specific action.
  Distinct from the already-fixed C3 findings (`update`/`destroy`/`close_run`, and the separately-fixed
  `get_testcases_attribute`) — this is a 5th, previously-missed instance of the same root-cause pattern in
  a 6th action of the same controller.

## Production report

Reported 2026-10-21 as issue #124227 on `ztflux`, via `redmineflux_core_create_issue`, per explicit user
approval ("okay create bug on production"). Linked to production Testcase #124225 in Run #612 via
`report_defect`. Production test suites `RFTC-042 TCM Testing Harness` (#452) and
`RFTC-043 Security Discovery Testing` (#453) — nested under parent suite #6 "Testcase plugin" — and all
22 corresponding testcases (RFTC042-1..11 incl. 7a, RFTC043-1..10) were created and executed in the same
session, mirroring both local external-spec testcase files in full.
