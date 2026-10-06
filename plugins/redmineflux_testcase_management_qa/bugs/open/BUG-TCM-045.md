# BUG-TCM-045

- Bug ID: BUG-TCM-045
- Production Redmine Issue ID: #122105
- Title: `link_defect`/`unlink_defect` permission denial reuses `bulk_create`'s assignee-specific error message ("you are not the assignee"), which describes a check these actions don't actually perform
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: N/A (direct API call)
- User role: Reporter (`reporter`, lacks `:execute_testcase`)
- Date: 2026-10-06

## Summary

`IssueStatusResultsController#link_defect`/`#unlink_defect` correctly reject a user lacking `:execute_testcase`
with HTTP 403 — the gating logic itself is correct and matches the spec (MED-10: the `assignee_id` branch
`bulk_create` uses is deliberately dropped on this path, replaced with a plain `User.current.admin? ||
User.current.allowed_to?(:execute_testcase, @project)` check). However, the error body reuses the
`error_permission_create_result` locale string verbatim:

<pre>
error_permission_create_result: "You cannot create the result because you are not the assignee."
</pre>

This message describes `bulk_create`'s assignee-specific denial, not the plain permission check `link_defect`
actually performs. There is no "assignee" concept at all in a cross-run bulk defect link (the spec's own MED-10
note explains why: a bulk link can span multiple runs/environments, so there is no single assignee context to
check against). A developer or support engineer troubleshooting a 403 on this endpoint would be misled into
investigating run-assignment state that has nothing to do with the actual cause.

## Steps to reproduce

1. As a user with no `:execute_testcase` permission in the project (e.g. Reporter), call:
   <pre>
   curl -i -X POST -H "X-Redmine-API-Key: <reporter key>" -H "Content-Type: application/json" \
     -d '{"project_id":1,"defect_issue_id":93,"execution_ids":[1]}' \
     http://<host>/testcase_status_results/link_defect.json
   </pre>

## Expected result

HTTP 403 with an error message describing the actual check performed (missing `:execute_testcase`), not an
assignee-specific message.

## Actual result

HTTP 403 — correct status code — but the body is `{"error":"You cannot create the result because you are not
the assignee."}`, which describes a check this action does not perform.

## Evidence

### Console / log

<pre>
$ curl -i -X POST -H "X-Redmine-API-Key: <reporter key>" ... /testcase_status_results/link_defect.json
HTTP/1.1 403 Forbidden
{"error":"You cannot create the result because you are not the assignee."}
</pre>

### Fix suggestion

Add a dedicated locale string (e.g. `error_permission_link_defect: "You do not have permission to link defects
in this project."`) and reference it in `link_defect`/`unlink_defect` instead of reusing
`error_permission_create_result`.

## Additional occurrence (2026-10-06, found while comprehensively testing #121876/rftc-009)

The identical root cause also fires on `Apis::CiTestRunController#bootstrap_run`'s `:execute_testcase` check — a
user holding `:create_run` and `:create_test_suite` but not `:execute_testcase` is correctly rejected (403), but
again via the reused `error_permission_create_result` string: `{"error":"You cannot create the result because
you are not the assignee."}`. Same fix applies: both call sites should use a dedicated, accurate message instead
of this one borrowed from `bulk_create`.

## Test case coverage

Found while comprehensively testing production feature #121875 (rftc-008) at the user's explicit request;
confirmed to recur on #121876 (rftc-009) during an equally thorough pass of that feature.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this error-message mismatch.

## Production report

Reported to production `ztflux` as #122105 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
