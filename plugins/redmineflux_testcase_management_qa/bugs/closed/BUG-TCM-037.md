# BUG-TCM-037

> **CLOSED — 2026-10-06.** Production #122093 (https://flux.zehntech.com/issues/122093) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

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

---

## Production history (synced from #122093 on 2026-10-08)

### 2026-10-06 09:43 UTC — Vaishnavi Bhawsar

Already fixed — this was addressed by an earlier, already-shipped fix for BUG-TCM-009, which added the exact rftc_authorize_project_read! check this ticket asks for to TraceabilityRtmsController#index (among several other sibling controllers found to have the same gap at the time).

Verified live on the demo instance: an unauthenticated request (no session, no API key at all) to GET /traceability_rtms?project_id=1 now returns 403 Forbidden, not the 200 OK with full page content this ticket describes.

For QA: Re-run this ticket's own repro -- GET /traceability_rtms?project_id=<id> with zero credentials (no cookies, no API key) -- and confirm it's rejected (403/404), not rendered.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Anonymous (zero credentials) GET to the Traceability Matrix now returns 403, down from a fully-rendered 200 with real project data.
