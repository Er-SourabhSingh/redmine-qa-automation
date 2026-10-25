# BUG-TCM-115

- Bug ID: BUG-TCM-115
- Production Redmine Issue ID: 125093
- Title: `bulk_testcase_create` silently reports success with zero test cases created when the (global) testcase tracker isn't enabled on the target project, instead of returning an error
- Severity: Medium
- Redmine version: 6.0.11.stable (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`
- Browser: curl (API)
- User role: QA Engineer (`qa.engineer`, API key, holds `add_issues`)
- Date: 2026-10-24

## Steps to reproduce

1. Create a new project whose enabled trackers do **not** include the plugin's configured testcase tracker (the
   tracker set at Administration → Plugins → Redmineflux Testcase Management → Configure is instance-wide, not
   per-project — e.g. a fresh project only has Bug/Feature/Support enabled by default, not Testcase).
2. `POST /testcase/bulk_testcase_create.json` with a `test_cases` array targeting that project's id.
3. Inspect the HTTP status and body, then check whether any issue was actually created.

## Expected result

- Either the call creates the test case(s) successfully, or — if the tracker genuinely can't be used in this
  project — it fails with a clear error (e.g. 422/404 naming the tracker-not-available-on-project problem), so
  the caller can tell the difference between "nothing matched" and "a real configuration problem blocked this."

## Actual result

- `HTTP 200 {"success":true,"test_cases":[]}` — no error of any kind. The caller has no way to know anything went
  wrong; the response looks identical to "an empty `test_cases` array was legitimately requested."

## Root cause (confirmed via code read + live DB check)

`RunsController#bulk_testcase_create` reads the testcase tracker id from the **global** plugin setting
(`Setting.plugin_redmineflux_testcase_management['tracker']`), builds `Issue.new(... tracker_id: tracker_id ...)`
for the target project, and calls `.save`. If the project's own `projects_trackers` list doesn't include that
tracker id, `Issue` validation fails (`tracker_id` invalid for the project) and `.save` returns `false` — but the
`else` branch of `if test_case.save` is never populated into any response field; the failed row is just skipped,
and the method still responds `render json: { success: true, test_cases: created_test_cases }` with whatever
(possibly empty) array it built. No per-row error is collected or surfaced anywhere.

Confirmed live: project `no-tracker-proj` (tracker 4 "Testcase" enabled instance-wide via plugin settings, but
only trackers 1/2/3 added to this project) — `POST /testcase/bulk_testcase_create.json` with one test case
targeting it returned `200 {"success":true,"test_cases":[]}`, and no issue was created.

## Evidence

### API response

```json
{"success":true,"test_cases":[]}
```
HTTP 200, for a request that created nothing.

### Database check

```sql
select tracker_id from projects_trackers where project_id = 7;  -- 1, 2, 3 (no 4 = Testcase)
```
No new `issues` row exists for the attempted subject.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers `bulk_testcase_create`'s silent
  no-op on a tracker-not-enabled-on-project mismatch.
