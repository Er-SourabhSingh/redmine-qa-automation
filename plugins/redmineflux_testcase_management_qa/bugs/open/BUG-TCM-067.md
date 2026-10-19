# BUG-TCM-067

- Bug ID: BUG-TCM-067
- Production Redmine Issue ID: #123955 (https://flux.zehntech.com/issues/123955) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123951 ("CI ingest authorization and auth-method matrix") in Run #612, environment Win + Chrome + Ver6.
- Title: CI ingest (`rftc-016`) and the manual "Add Result" form deny with "you are not the assignee" even though the actual gate is `execute_testcase` permission — the message names the wrong reason for the denial
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (post-7.1.0, pre-7.2.0 — rftc-016/017/020/021/038/042/043/044 merged)
- Environment: Docker `redmine6-redmine-1`, project `RFTC-016 CI Ingest QA` (id=2, identifier `rftc-016-ci-qa`), Run #5
- Browser: N/A (API endpoint, verified via `curl`)
- User role: Non-admin project member (`qanonadmin`, Reporter then Developer role), compared against Admin
- Date: 2026-10-19

## Steps to reproduce

1. On Run #5 (environment `CI`), confirm `run_assignments` lists **only `admin`** as the assignee for `CI`.
2. Add a non-admin user (`qanonadmin`) to the project with the **Developer** role, which does **not** carry
   `execute_testcase` by default.
3. Also insert a `run_assignments` row making `qanonadmin` an assignee of Run #5 / `CI` (so the user genuinely *is*
   an assignee, just without the permission).
4. As `qanonadmin` (HTTP Basic auth), `POST /testcase_ci/ingest_results.json`:
   ```json
   {"run_id": 5, "environment": "CI", "match_by": ["id"], "results": [{"key": "23", "status": "passed"}]}
   ```
5. Separately, as `qanonadmin` with the **Reporter** role (which *does* carry `execute_testcase` by default) and
   **not** an assignee of the run at all, repeat the same request.

## Expected result

The error message, when denial happens, should name the actual reason the request was rejected. Since the real
authorization gate in both `Apis::CiTestRunController#ingest_results` (`app/controllers/apis/ci_test_run_controller.rb:85-88`)
and the manual "Add Result" form's `IssueStatusResultsController#create`
(`app/controllers/issue_status_results_controller.rb:103-105`) is:

```ruby
if User.current.admin? || User.current.allowed_to?(:execute_testcase, @project)
```

— with the controller's own comment explicitly stating (`issue_status_results_controller.rb:101-102`, rftc-012 C4):
*"Being the recorded assignee must never, on its own, grant the ability to write results — that was a durable
permission bypass (assignments are not purged when a role changes)."* — a denial should say something like "you do
not have the Execute testcase permission for this project," not mention the run assignee at all.

## Actual result

Both the CI ingest endpoint and the manual form return the **same fixed string**, from
`config/locales/en.yml:611`:

```yaml
error_permission_create_result: "You cannot create the result because you are not the assignee."
```

Confirmed via direct test:

- Step 4 (Developer role, no `execute_testcase`, but genuinely **IS** the run's assignee) → still denied:
  ```json
  {"error":"You cannot create the result because you are not the assignee."}
  ```
  HTTP 403 — **despite being the assignee**, which proves assignee status plays no role in the actual gate; the
  message is simply wrong for this case (the real reason is the missing permission).

- Step 5 (Reporter role, has `execute_testcase`, **NOT** the run's assignee at all) → succeeds (HTTP 200,
  `"status":"success"`), which is correct per the real logic, but further confirms the message's wording ("not the
  assignee") has nothing to do with what the code is actually checking.

In short: `run_assignment`/`assignee_id` is fetched by the controller (`issue_status_results_controller.rb:59-60`)
but never consulted in the authorization decision — it is dead weight left over from before rftc-012's
BUG-TCM-055-adjacent fix closed the "assignee alone grants write access" bypass. The locale string was never
updated to match, so every permission-denied response on this path tells the caller to go get assigned to the run
— advice that will never actually fix the problem, since the fix is a role/permission change
(`execute_testcase`), not an assignment change.

## Root cause

The `error_permission_create_result` locale string predates the rftc-012 fix that removed assignee-based
authorization entirely. When the gate was rewritten to be permission-only, the error message was not updated to
match, leaving a stale, misleading string in two call sites (`ci_test_run_controller.rb:86` and
`issue_status_results_controller.rb:190/193`).

## Suggested fix

Either:
- Add a new, accurate locale key (e.g. `error_execute_testcase_permission_required: "You do not have the Execute
  testcase permission for this project."`) and use it at both call sites, or
- Reword the existing `error_permission_create_result` string itself if nothing else legitimately depends on its
  current wording.

## Evidence

### Console / log

```
$ curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "http://localhost:3000/testcase_ci/ingest_results.json" \
  -u "qanonadmin:12345678" -H "Content-Type: application/json" \
  -d '{"run_id":5,"environment":"CI","match_by":["id"],"results":[{"key":"23","status":"passed"}]}'

# qanonadmin = Developer role (no execute_testcase), but IS a run_assignments row for run 5 / CI:
{"error":"You cannot create the result because you are not the assignee."}
HTTP_STATUS:403

# qanonadmin = Reporter role (has execute_testcase by default), NOT in run_assignments at all:
{"status":"success","message":"Ingested 1 results (1 matched, 0 unmatched)", ...}
HTTP_STATUS:200
```

Code references:
- `app/controllers/apis/ci_test_run_controller.rb:85-88` — CI ingest gate (permission-only)
- `app/controllers/issue_status_results_controller.rb:59-60` — `assignee_id` fetched but unused in the gate
- `app/controllers/issue_status_results_controller.rb:101-105` — manual form gate (permission-only) + the rftc-012
  C4 comment explaining assignee was deliberately removed from authorization
- `config/locales/en.yml:611` — the stale `error_permission_create_result` string

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers this message/logic mismatch. Not
  the same as `BUG-TCM-055` (a different, already-fixed row-identity bug referenced only in a code comment here)
  or any of the rftc-012 permission-bypass fixes (those are the fix that *caused* this stale string, not a
  reopening of the original bypass).
