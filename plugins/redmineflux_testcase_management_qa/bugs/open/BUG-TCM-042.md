# BUG-TCM-042

- Bug ID: BUG-TCM-042
- Production Redmine Issue ID: #122098
- Title: `GET /projects/:project_id/get_testcases.json` ignores the `:project_id` entirely — any authenticated user can read every test case across the whole instance, regardless of project membership or visibility
- Severity: Critical
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (projects `qa-demo` [id 1] and `qa-demo-2` [id 2, private])
- Browser: N/A (direct API call)
- User role: Reporter (`reporter`, via API key) — zero membership on project 2
- Date: 2026-10-06

## Summary

`GET /projects/:project_id/get_testcases.json` (routed to `RunsController#get_testcases_attribute`) accepts a
`:project_id` in the URL, making the endpoint look project-scoped, but the controller **never actually uses
it**:
```ruby
def get_testcases_attribute
  tracker_id = Setting.plugin_redmineflux_testcase_management['tracker'].first.to_i
  ...
  @test_cases = Issue.where(tracker_id: tracker_id)   # NO project_id filter anywhere
  filter_by_attributes                                 # only adds subject/description/date filters, still no project scope
  ...
  render json: @test_cases, ...
end
```
There is also no permission or project-visibility check of any kind (no `allowed_to?`, no membership check, no
`rftc_require_project_visible!`). The result: `Issue.where(tracker_id: <the single global testcase tracker>)`
returns every test-case issue on the **entire Redmine instance**, across every project, to any authenticated
user holding any valid API key — completely independent of which project's URL they used to get there.

## Steps to reproduce

1. As `reporter` (member of project `qa-demo` [1] only, zero membership/role on private project `qa-demo-2`
   [2]): `curl -H "X-Redmine-API-Key: <reporter key>" "http://localhost:3015/projects/2/get_testcases.json"`.
2. Separately, hit **project 1's own URL** (the project `reporter` IS a legitimate member of) filtering for a
   subject string known to exist only in project 2's data: `curl -H "X-Redmine-API-Key: <reporter key>"
   "http://localhost:3015/projects/1/get_testcases.json?subject=Cross-project%20probe"`.

## Expected result

- Step 1: HTTP 403 or 404 — project 2's test cases must not be disclosed to a non-member.
- Step 2: an empty result (no project-1-scoped query should ever surface a project-2 issue).

## Actual result

- Step 1: HTTP 200, full JSON array of **every test case on the instance** (74 issues from project 1 alone
  included in one response, confirmed via `grep -o '"project_id":[0-9]*' | sort | uniq -c`).
- Step 2: HTTP 200, returns the exact project-2-only issue (`id:30, "project_id":2, subject:"Cross-project
  probe testcase"`) **even though the URL said `/projects/1/...`** — conclusively proving the `:project_id` URL
  segment is entirely decorative and never applied as a query filter. The actual scope of this endpoint for
  every caller, regardless of URL, is "every test case on the instance whose tracker matches the one globally
  configured testcase tracker," full stop.

## Evidence

### Console / log

```
$ curl -H "X-Redmine-API-Key: <reporter key>" "http://localhost:3015/projects/2/get_testcases.json"
HTTP/1.1 200 OK
(62211 bytes; grep -o '"project_id":[0-9]*' | sort | uniq -c -> 74 "project_id":1, 1 "project_id":2)

$ curl -H "X-Redmine-API-Key: <reporter key>" "http://localhost:3015/projects/1/get_testcases.json?subject=Cross-project%20probe"
[{"id":30,"tracker_id":4,"project_id":2,"subject":"Cross-project probe testcase",...}]
# requested PROJECT 1's url, got back a PROJECT 2 issue — the :project_id param is never consulted.
```

### Source

```ruby
# app/controllers/runs_controller.rb:1053-1069
def get_testcases_attribute
  tracker_id = Setting.plugin_redmineflux_testcase_management['tracker'].first.to_i
  ...
  @test_cases = Issue.where(tracker_id: tracker_id)   # <- no project scoping, no visibility/permission check
  filter_by_attributes
  ...
  render json: @test_cases, include: [:status, :priority, :assigned_to]
end
```

## Test case coverage

Found while executing TC-API-06-03 (P1, cross-project permission denial, `docs/qa/V1-TEST-CYCLE-7.1.0.md`). The
TC's own precondition (a non-member hitting another project's URL) only hints at the IDOR; live reproduction
revealed the scope is far broader than per-project IDOR — the project segment is unused entirely, making this an
instance-wide cross-tenant data disclosure, not a narrower cross-project leak. Confirmed per the standing lesson
in `feedback_verify_underlying_data_supports_security_claim` and `feedback_verify_hidden_ui_implies_blocked_access`
— verified against real, distinctly-named data in project 2 rather than trusting the absence of a 403 alone.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers `get_testcases_attribute`/
  `/projects/:project_id/get_testcases.json`. Distinct from BUG-TCM-037 (`TraceabilityRtmsController#index`, a
  different controller/route with the same "no auth check" root-cause family).

## Production report

Reported to production `ztflux` as #122098 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
