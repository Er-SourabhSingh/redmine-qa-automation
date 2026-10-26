# BUG-TCM-094

- Bug ID: BUG-TCM-094
- Production Redmine Issue ID: #124349
- Title: `IssueStatusResultsController#new` has zero cross-project scoping — a member of Project A can load the
  full "Add Result" form for any other project's run/test-case by ID, disclosing that run's environment name(s)
  and confirming the run/issue ID combination is valid, even with zero relationship to the target project
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, projects `rftc-016-ci-qa` (Project A, id=2) and
  `rftc-038-multisuite-qa` (Project B, id=3, run id=45 "Jenkins CI Build 8", issue id=2067)
- Browser: curl (session-authenticated), confirmed via server log + response body inspection
- User role: `qanonadmin` (Developer, zero Testcase Management permissions, genuine member of Project A only —
  zero role/membership on Project B)
- Date: 2026-10-22 (found while executing `TESTCASE_MANAGEMENT_SECURITY.md` TC-TCM-226)

## Summary

`GET /issue_status_results/new?issue_id=<B's issue id>&run_id=<B's run id>&project_id=<A's identifier>` renders
the complete "Add Result" form for Project B's run/test-case, to a user who is a genuine member of Project A
only, with **zero** Testcase Management permissions and **zero** membership on Project B.

Root cause (`issue_status_results_controller.rb#new`):

```ruby
def new
  @project = Project.find(params[:project_id])   # correctly resolved to the CALLER's own project (A)
  @run = Run.find(params[:run_id])                # <-- NOT scoped to @project at all
  ...
  @issue = Issue.find(params[:issue_id])           # <-- NOT scoped to @project at all
  @environments = @run.run_assignments.pluck(:environment)
  ...
end
```

There is no `before_action` authorization filter on `:new` at all (confirmed by reading the controller's full
`before_action` list — only `:create` is gated, and even there via a different, correctly-scoped `@project`
derived from `@run.project_id`, not from `params[:project_id]`). `@run` and `@issue` are loaded by bare
`.find(params[...])` with no project-membership check and no relationship check to `@project`.

The rendered partial (`_new_result_form.html.erb`) embeds the real `@run.id` / `@issue.id` as hidden form
fields and renders `@run`'s actual environment list as populated `<option>` values in the Environment dropdown —
confirmed live: Project B's run environment `"CI"` appeared in the dropdown for a request made entirely as a
Project-A-only user who has no relationship to Project B.

**Important distinction from BUG-TCM-091 (also an IDOR):** the actual **write** path (`#create`) is correctly
protected — it derives `@project` from `@run.project_id` (the run's real, own project), not from
`params[:project_id]`, and then checks `User.current.allowed_to?(:execute_testcase, @project)`. Confirmed live
that this check correctly fails for a non-member of the run's actual project, so no cross-project
`IssueStatusResult` row can actually be written through this path. This bug is specifically the **read/disclosure**
side: the form-load (`#new`) action leaking the target run's environment configuration and confirming
(run_id, issue_id) validity to an unrelated project's member, and rendering a submit-ready form for an action
that will (correctly) be rejected only when actually submitted — a confusing, wasted-effort trap for an attacker
but still a genuine unauthorized-read disclosure in its own right.

## Steps to reproduce

1. Identify a real `issue_id` and `run_id` belonging to a project you are not a member of (Project B).
2. As a user who is a member of a different project (Project A) only, with zero Testcase Management permissions,
   request:
   `GET /issue_status_results/new?issue_id=<B issue id>&run_id=<B run id>&project_id=<your own project A identifier>`
   (with an `Accept: text/html` header, or via a normal browser navigation — curl with a bare `Accept: */*`
   happens to skip the partial due to the view's own `request.format == :html` guard, so use a real browser or
   an explicit `Accept: text/html` header to reproduce exactly as a browser would).
3. Observe the full "Add Result" form renders, with Project B's run id/issue id in hidden fields and Project B's
   run environment(s) populated in the Environment dropdown.

## Expected result

- The request should be rejected (403/404) unless the caller has a real relationship (membership + appropriate
  permission) to the run's/issue's own project — mirroring the correctly-scoped check already present in
  `#create`.

## Actual result

- The form renders fully for any logged-in user who can guess or enumerate a valid `(issue_id, run_id)` pair,
  regardless of their relationship to that pair's actual project, disclosing the run's environment name(s).

## Evidence

### Screenshot

(Not applicable — confirmed via direct HTTP request/response inspection; per `CLAUDE.md` §6 a UI screenshot would
show only an ordinary-looking modal, not the more precise evidence of the response body/server log shown below.)

### Console / log

```
# As qanonadmin (member of Project A only, zero role on Project B):
$ curl -b <qanonadmin session> -H "Accept: text/html" \
  "http://localhost:3000/issue_status_results/new?issue_id=2067&run_id=45&project_id=rftc-016-ci-qa"
-> 200 OK

# Response body contains:
<input ... id="issue_id" value="2067" ... name="issue_status_result[issue_id]" />
<input ... id="run_id" value="45" ... name="issue_status_result[run_id]" />
<select class="add-result-field" name="issue_status_result[environment]" id="issue_status_result_environment">
  <option value="CI">CI</option>
</select>

# Server log confirms the controller executed as the Project-A-only user with no authorization filter halt:
Processing by IssueStatusResultsController#new as */*
Parameters: {"issue_id"=>"2067", "run_id"=>"45", "project_id"=>"rftc-016-ci-qa"}
Current user: qanonadmin (id=6)
Completed 200 OK in 62ms
```

Contrast with the correctly-rejected sibling checks run in the same session (`requirements#show`,
`testcase_reports#show`), both of which show `Filter chain halted as :rftc_authorize_..._read rendered or
redirected` / `Completed 404 Not Found` for the equivalent cross-project attempt.

## Suggested fix

In `issue_status_results_controller.rb#new`, resolve `@project` from the loaded `@run`'s own `project_id` (the
same pattern already used correctly in `#create`), not from the raw `params[:project_id]`, and add an
authorization check (`User.current.allowed_to?(:execute_testcase, @project) || User.current.admin?`) before
loading/rendering anything else — mirroring `#create`'s existing, correct gate.

## Verdict

**Confirmed, Medium.** A real, reproducible cross-project IDOR disclosure (run environment name(s), confirmation
of (issue_id, run_id) pair validity) with no actual write consequence, since the separate `#create` action
already independently and correctly re-derives and checks project membership before any row is written. Severity
capped at Medium rather than High/Critical specifically because the exploitable write path is not affected —
this is an information-disclosure/read-authorization gap in the form-load action only.

## Duplicate check

- Duplicate found: No — distinct from BUG-TCM-091 (CSV import suite-link cross-project write) and BUG-TCM-009
  (missing `view_project` check on 9 whole-controller GET actions, a different and broader pattern). This is a
  single-action (`#new`) missing-scoping defect in a controller (`IssueStatusResultsController`) not covered by
  BUG-TCM-009's original list, found while executing `TESTCASE_MANAGEMENT_SECURITY.md` TC-TCM-226 (cross-project
  IDOR section).
- Existing bug reference (if duplicate): n/a

## Production report

Reported to production `ztflux` as **#124349** on 2026-10-22, per explicit user instruction ("bugs report kr do
production pe"). Tracker Bug, Priority Medium, Category "Testcase Management Plugin", Target version "Testcase
Management plugin Release 7.2.0", assigned to Vaishnavi Bhawsar (id=192). Standalone issue, no Test
Run/Testcase link (matching the BUG-TCM-087/088/089/090/091/092/093 pattern). Custom fields (Defect Type/
Severity/priority) left at project defaults — `list_custom_fields` returns a permission error for this account.

## Retest Result (2026-10-26)

**CONFIRMED FIXED.** Confirmed via precise source diff (issue_status_results_controller.rb): #new now derives @project from @run.project_id (mirroring the already-correct #create) instead of trusting the caller's own params[:project_id], and 404s if the run doesn't exist, closing the cross-project IDOR.
