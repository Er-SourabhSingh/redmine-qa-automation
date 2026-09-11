# BUG-TCM-003

- Bug ID: BUG-TCM-003
- Production Redmine Issue ID: #120544 (https://flux.zehntech.com/issues/120544) — created 2026-09-11, assigned to Sheetal Sharma, Priority High
- Title: Bulk update result fails for every browser user because the bulk endpoint rejects the logged-in session and treats the request as an unauthenticated API call
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`, run #4 `reyer`, suite `workload`)
- Browser: Chromium 152 (Playwright MCP)
- User role: Administrator (`admin`) — reproduces for every role, see Analysis
- Date: 2026-09-11

## Summary

Selecting two or more test cases inside a test run and using **Bulk Update Result** never saves anything. The
browser's `POST /testcase_status_results/bulk_create.json` is answered with **401 Unauthorized** even though the
user is fully logged in and the very same session is accepted on every other page in the same tab.

This is **not** an environment, notes, permission, or run-configuration problem. The endpoint is registered with
`defaults: { format: 'json' }`, which makes Redmine core classify it as an **API request** and skip session-cookie
authentication entirely, so `User.current` is `anonymous` before the plugin's own code ever runs.

## Steps to reproduce

1. Log in to `http://localhost:3010` as `admin`.
2. Open project **test project** → **TestCases** tab → **Runs & Results**.
3. Open run **#4 `reyer`** (suite `workload`, 15 test cases, environment `fdsgsdf`).
4. Tick the checkbox of two or more test cases in the grid (e.g. #436 and #437).
5. Click the **Bulk Update Result** button that appears above the grid.
6. In the modal, choose a **Status**, leave **Environment** at any assigned value, optionally type **Notes**.
7. Click **Submit**.

## Expected result

- A result row is created for every selected test case with the chosen status, environment and notes.
- The modal closes and the run grid refreshes showing the new statuses, exactly as a single-test-case
  **Add Result** does.

## Actual result

- Nothing is saved. No result row is created for any of the selected test cases.
- The **Submit** button changes to **"Saving…"** and stays there permanently — the modal never closes and never
  reports a reason (on this instance `rest_api_enabled` is on, so Redmine answers with a
  `WWW-Authenticate: Basic realm="Redmine API"` challenge that the browser holds open instead of delivering to the
  page). On an instance where the challenge is not issued, the same failure surfaces as the generic message
  **"Request failed (401)."**
- Server log: `Current user: anonymous` → `Filter chain halted as :check_if_login_required rendered or redirected`
  → `Completed 401 Unauthorized`.

Reproduced identically with: 2 test cases and 15 test cases; environments `fdsgsdf` and `chrome`; statuses
`Passed` and `Skipped`; with execution notes and with the notes field empty. The outcome never changes, which
matches the customer's report that different correctly-assigned environments and the presence/absence of notes
make no difference.

## Analysis — root cause

1. `config/routes.rb:162`
   ```ruby
   post '/testcase_status_results/bulk_create.json', to: 'issue_status_results#bulk_create', defaults: { format: 'json' }
   ```
   forces `params[:format] == 'json'`, so Redmine core's `api_request?`
   (`app/controllers/application_controller.rb:723`) returns `true`.

2. Redmine core `find_current_user` (`app/controllers/application_controller.rb:112-129`) reads the session
   **only** when the request is *not* an API request:
   ```ruby
   unless api_request?
     if session[:user_id]
       user = User.active.find(session[:user_id]) ...
   ```
   The bulk XHR carries only the session cookie and an `X-CSRF-Token` header — no API key, no HTTP Basic header,
   no OAuth token — so `user` stays `nil` and `User.current` becomes **anonymous**.

3. `check_if_login_required` is declared on `ApplicationController` (`application_controller.rb:64`) and therefore
   runs **before** any `before_action` declared in the subclass. The plugin's own compensating filter
   ```ruby
   before_action :restore_session_user_for_api, only: [:create, :bulk_create]   # issue_status_results_controller.rb:6
   ```
   is registered after it, so the chain is already halted with 401 and `restore_session_user_for_api` never
   executes. The workaround that was meant to fix exactly this is dead code on this path.

4. The single-test-case **Add Result** flow is unaffected because it posts to a non-`.json` route:
   `app/views/issue_status_results/_new_result_form.html.erb:4` uses
   `{ controller: "issue_status_results", action: "create" }` (→ `POST /issue_status_results`, format JS) when
   `bulk_mode` is false, and only switches to `@bulk_url = "/testcase_status_results/bulk_create.json"`
   (`issue_status_results_controller.rb`, `new`) when `bulk_mode` is true. That asymmetry is the whole difference
   between "single update works" and "bulk update always fails".

### Proof that the endpoint's own logic is correct

The same payload, same run, same environment, sent to the same URL with **HTTP Basic (API) auth** instead of the
browser session succeeds:

```
# browser session cookie (valid, returns 200 on /my/page)
POST /testcase_status_results/bulk_create.json   ->  401 Unauthorized
                                                     www-authenticate: Basic realm="Redmine API"
                                                     content-length: 0

# same request, HTTP Basic auth
POST /testcase_status_results/bulk_create.json   ->  201 Created
{"status":"success","message":"All testcase results added successfully", ...}
```

So `bulk_create` itself works. Only the browser-session authentication path into it is broken — which means the
feature is 100% unusable from the UI for every user and every role, while remaining usable over the REST API.

### Suggested fix

Stop forcing the JSON format on this browser-facing route (drop `.json` / `defaults: { format: 'json' }` and let
it respond as JS/JSON on a normal route), or — if the endpoint must stay API-shaped — move the session restore so
it runs before core's `check_if_login_required` (e.g. `prepend_before_action`), and keep `accept_api_auth` for
genuine API clients. The same `.json` + `defaults` pattern is used on
`routes.rb:163, 167, 168, 175` (`create.json`, both `bulk_delete.json` routes, `bulk_testcase_create.json`), so
those paths should be checked for the identical defect.

## Evidence

### Screenshot

![Bulk Update Result stuck on Saving after a 401](../../screenshots/BUG-TCM-003/bulk-update-stuck-saving-401.png)

*Status `Skipped`, environment `chrome`, execution notes filled, test cases #436 and #437 selected — Submit stuck
on "Saving…" with nothing saved.*

### Retest screenshot (fill after fix is verified)

<!-- ![Retest result](../../screenshots/BUG-TCM-003/retest-yyyy-mm-dd-pass.png) -->

### Console / log

Full excerpt: [`logs/BUG-TCM-003-bulk-create-401.log`](../../logs/BUG-TCM-003-bulk-create-401.log)

```
Started POST "/testcase_status_results/bulk_create.json" for 172.19.0.1
Processing by IssueStatusResultsController#bulk_create as JSON
  Parameters: {"run_id" => 4, "testsuite_id" => 1, "issue_status_results" => [{"issue_id" => 436, "case_status_id" => 6, "environment" => "chrome", "notes" => "<p>Bulk retest with execution notes</p>"}, {"issue_id" => 437, ...}]}
  Current user: anonymous
Filter chain halted as :check_if_login_required rendered or redirected
Completed 401 Unauthorized in 5ms
```

Contrast — single-test-case Add Result, same session, seconds apart:

```
Started POST "/issue_status_results?project_id=test-project" for 172.19.0.1
Processing by IssueStatusResultsController#create as JS
  Current user: admin (id=1)
Completed 200 OK in 509ms
```

Browser console shows no error from this request (one pre-existing unrelated error,
`Identifier 'lastJstPreviewed' has already been declared`).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` (BUG-TCM-001, BUG-TCM-002) and `bugs/_duplicates.md` — both existing bugs are CSV
  import defects with unrelated root causes.
