# BUG-TCM-037

- Bug ID: BUG-TCM-037
- Production Redmine Issue ID: #122093
- Title: Traceability Matrix (`TraceabilityRtmsController#index`) has no permission or membership check at all — fully accessible to completely anonymous, unauthenticated callers
- Severity: Critical
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: N/A (direct HTTP, no session/cookies/API key at all)
- User role: Anonymous (no authentication whatsoever)
- Date: 2026-10-05

## Summary

`GET /traceability_rtms?project_id=<id>` — the Requirement → Test Case → Defect coverage matrix — renders fully
for a request carrying **zero** authentication: no session cookie, no API key, nothing. Every sibling controller
in this plugin (`TestcaseReportsController`, `TestSuitesController`, `IssueStatusResultsController`, etc.)
includes `RftcAccessControl` and calls `rftc_authorize_*`/`allowed_to?`; `TraceabilityRtmsController#index` does
neither — it only does `Project.find(params[:project_id])` and renders. This is worse than a missing
project-membership check (the kind rftc-012 fixed on other controllers): it's a missing **authentication** check
— the instance's own "Authentication required" setting is bypassed entirely for this one endpoint.

## Steps to reproduce

1. With no browser session, no cookies, and no API key, send:
   `GET http://localhost:3015/traceability_rtms?project_id=1`

## Expected result

- Per the module's own stated security posture (matching every sibling controller post rftc-012): denied
  (401/403/404) for an unauthenticated or non-member caller.

## Actual result

- `200 OK`, full page render, every time, with zero credentials supplied:
  ```
  $ curl -s -i "http://localhost:3015/traceability_rtms?project_id=1" -b /dev/null
  HTTP/1.1 200 OK
  ...
  ```
- Confirmed this discloses real project data, not just an empty shell: created a requirement titled
  "Confidential Requirement XYZ" in project `qa-demo`, then re-ran the exact same unauthenticated `curl` call —
  the title string appears verbatim in the anonymous response body.
- Root-caused by reading the controller: `TraceabilityRtmsController` has no `before_action` authorization
  callback at all, unlike every other controller in this plugin (confirmed via source read of
  `testcase_reports_controller.rb`, `test_suites_controller.rb`, `issue_status_results_controller.rb`, all of
  which include `RftcAccessControl` and call `rftc_authorize_*`).
- This is **not** scoped to "a non-member can see it" (already bad) — it's reachable by a request with no
  identity whatsoever, meaning it also bypasses the instance-wide "Authentication required" setting that every
  other page on this Redmine instance (including this same plugin's other pages) correctly enforces.

## Evidence

### Console / log

```
$ curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3015/traceability_rtms?project_id=1" -b /dev/null
200

$ curl -s "http://localhost:3015/traceability_rtms?project_id=1" -b /dev/null | grep -o "Confidential Requirement XYZ"
Confidential Requirement XYZ
```

## Test case coverage

Found while executing TC-REPORT-06-02 (P1, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — the test case itself predicted
this exact gap from a grounded source-code reading and asked to confirm it live before filing, rather than
treating a "passes through" result as a false alarm. Confirmed, and found the gap is broader than the TC's own
framing (anonymous, not just non-member).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers `TraceabilityRtmsController`.

## Production report

Reported to production `ztflux` as #122093 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
