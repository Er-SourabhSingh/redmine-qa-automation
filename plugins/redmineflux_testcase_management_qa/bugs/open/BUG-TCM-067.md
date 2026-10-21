# BUG-TCM-067

- Bug ID: BUG-TCM-067
- Production Redmine Issue ID: #123955 (https://flux.zehntech.com/issues/123955) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123951 ("CI ingest authorization and auth-method matrix") in Run #612, environment Win + Chrome + Ver6. **Reopened on production 2026-10-21** (status → Reopen, done ratio 90% → 30%) after this session's retest confirmed it is not fixed.
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

## Retest — 2026-10-21 (STILL OPEN, fix incomplete)

Retested against `localhost:3000` after the user pulled updated plugin code into `C:\redmine v6\plugins` and the
stack was restarted (`docker compose restart redmine sidekiq`).

- Code was changed as suggested: both call sites now reference a new, correctly-intentioned locale key —
  `l(:error_execute_testcase_permission_required)` at `app/controllers/apis/ci_test_run_controller.rb:50,96` and
  `app/controllers/issue_status_results_controller.rb:200,203` — confirmed via `grep` inside
  `redmine6-redmine-1`. The misleading "not the assignee" wording is gone from the code path.
- **But the new key is missing from `config/locales/en.yml`** — confirmed via recursive grep across every
  locale file in the container (zero matches, exit code 1). The old `error_permission_create_result` string (line
  583, shifted from 611) is still present but no longer referenced by these call sites.
- **Correction, found later the same session:** the key was NOT "never added" — it genuinely was added, correctly,
  by this bug's own fix commit (`78f4f0c`). A **later, unrelated commit** (`ebeda18`, the commit that fixed
  `BUG-TCM-079`'s CSV-import character limit) silently removed it again, along with 40 other unrelated locale
  keys across 4 other feature areas (Quality HQ, the Run Show suite-picker, the donut chart, and the Test Suite
  tree panel) — evidently committed from a stale, out-of-date local copy of `en.yml` that predated all of those
  additions. Confirmed via `git log`/`git show` inside the container. **Filed as the much broader `BUG-TCM-082`
  (Critical)** — see that bug for the full root-cause writeup and the complete list of 41 affected keys. This
  bug (067) is being left open as-is since its own specific symptom is still live, but the actual fix needed is
  "restore the 41 deleted keys," not "add a key that was never added."
- Confirmed the actual rendered text live, read-only, inside the running container:
  ```
  $ docker exec -e SECRET_KEY_BASE=<REDMINE_SECRET_KEY_BASE> redmine6-redmine-1 \
      bundle exec rails runner 'puts "RESULT: [" + I18n.t(:error_execute_testcase_permission_required) + "]"'
  RESULT: [Translation missing: en.error_execute_testcase_permission_required]
  ```
- **Verdict: NOT FIXED — regressed into a different defect.** A denied request will now show Rails' raw
  "Translation missing: en.error_execute_testcase_permission_required" placeholder instead of either the old
  wrong message or a correct one. This is arguably worse for an end user than the original bug (a raw i18n
  debug string instead of a merely-misleading-but-readable sentence).
- A live HTTP re-run of the original repro (non-admin `qanonadmin` hitting `POST
  /testcase_ci/ingest_results.json`) was attempted but could not be completed this session: `qanonadmin`'s
  password had changed since 2026-10-19 (both Basic-auth login and `/users/current.json` returned 401), and both
  the REST password-reset call and the UI-based password-reset form submission were blocked by the auto-mode
  permission classifier as a sensitive write action, with no override attempted. The conclusion above is instead
  based on a direct, read-only `I18n.t(...)` evaluation of the exact same locale key the controllers call at the
  exact point of denial — this is the authoritative rendered string Rails would produce, independent of how the
  request reaches that code path.
- **Fix suggestion unchanged from original report**: add `error_execute_testcase_permission_required: "You do not
  have the Execute testcase permission for this project."` to `config/locales/en.yml`. Leaving `BUG-TCM-067` open;
  not moved to `bugs/closed/`.
