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

### Retest screenshot — PASS (2026-09-15, pass 2)

Run grid filtered to environment `chrome`, showing #437 and #448 saved as `Passed` by the bulk update:

![Retest 2026-09-15 PASS — bulk update saved both test cases](../../screenshots/BUG-TCM-003/retest-2026-09-15-pass.png)

Earlier the same day on the previous branch — Submit stuck on "Saving…" after a 401:

![Retest 2026-09-15 FAIL — Submit stuck on Saving](../../screenshots/BUG-TCM-003/retest-2026-09-15-fail.png)

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

## Retest 2026-09-15 — PASS (second pass, after branch switch)

Retested twice on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0), project `test-project`, run **#4 `reyer`**, as
`admin` via Playwright MCP headed, navigating through the real UI each time.

| Pass | Branch state | Result |
|---|---|---|
| 1 | Branch as checked out at 11:21 | **FAIL** — reproduced identically (detail retained below) |
| 2 | **After the developer switched branch and restarted the container** (Redis + Sidekiq restarted by QA) | **PASS** |

### Pass 2 — PASS

Test cases **#437 and #448**, both `Untested` beforehand, so a successful save would be unambiguous. Status
`Passed`, Environment `chrome`.

```
Started POST "/issue_status_results/bulk_create" for 172.19.0.1 at 2026-09-15 11:35:19
Processing by IssueStatusResultsController#bulk_create as JSON
  Parameters: {"run_id" => 4, "testsuite_id" => 1, "issue_status_results" => [{"issue_id" => 437, "case_status_id" => 2, "environment" => "chrome", "notes" => ""}, {"issue_id" => 448, ...}]}
  Current user: admin (id=1)
Completed 201 Created in 97ms
```

| | Before | After |
|---|---|---|
| Form action | `/testcase_status_results/bulk_create.json` | **`/issue_status_results/bulk_create`** (no `.json`) |
| `Current user` | `anonymous` | **`admin (id=1)`** |
| HTTP status | 401 Unauthorized | **201 Created** |
| Submit button | stuck on "Saving…" | **modal closed, grid refreshed** |
| Rows created | none | **2** — ids 859 (#437) and 860 (#448), `case_status_id 2`, environment `chrome` |

Rows confirmed in the database, not just the grid:

```
 id  | issue_id | case_status_id | environment |         created_at
 860 |      448 |              2 | chrome      | 2026-09-15 11:35:19.482568
 859 |      437 |              2 | chrome      | 2026-09-15 11:35:19.428315
```

**Grid check — read the environment filter before judging it.** Immediately after the save the grid still showed
#437/#448 as `Untested`, which looks like a partial failure. It isn't: the grid was filtered to environment
`fdsgsdf` while the results were saved against `chrome`. Switching the filter to `chrome` shows **exactly #437 and
#448 as `Passed`** and every other case `Untested`. The grid was correct throughout — it is environment-scoped.

### The applied fix

Not the route deletion originally suggested, but the equivalent: a **new non-`.json` route** was added and the
browser form re-pointed at it, while the `.json` route is retained for genuine API clients.

- `config/routes.rb:191-195` — new `resources :issue_status_results do collection { post 'bulk_create' } end`
- `issue_status_results_controller.rb:26` — `@bulk_url = bulk_create_issue_status_results_path` (was the `.json` URL)
- `config/routes.rb:162` — the old `.json` route is **still declared**, and correctly so: `accept_api_auth` still
  covers real API clients.

Note the log still reads `as JSON` — that comes from the XHR's `Accept: application/json` header. What matters is
that `params[:format]` is no longer *forced*, so core's `api_request?` returns false, session lookup runs, and
`User.current` is the logged-in user. The `before_action :restore_session_user_for_api` filter is unchanged and
still a subclass filter; it is simply no longer needed on this path.

### Verdict

**PASS. Ready to close pending regression** — see the note at the end of this section.

<details>
<summary>Pass 1 (earlier the same day, previous branch) — FAIL, retained for the record</summary>

Selected test cases **#434 and #435**, Status `Passed` / Environment `chrome`.

#### Result: reproduced identically

| | 2026-09-11 (original) | 2026-09-15 (retest) |
|---|---|---|
| Form action | `/testcase_status_results/bulk_create.json` | **unchanged** |
| `Current user` in log | `anonymous` | **`anonymous`** |
| Filter chain | halted as `:check_if_login_required` | **halted as `:check_if_login_required`** |
| HTTP status | 401 Unauthorized | **401 Unauthorized** (16 ms) |
| Submit button | stuck on "Saving…" | **stuck on "Saving…", disabled, modal never closes** |
| Rows created | none | **none** |

```
Started POST "/testcase_status_results/bulk_create.json" for 172.19.0.1 at 2026-09-15 11:21:18
Processing by IssueStatusResultsController#bulk_create as JSON
  Parameters: {"run_id" => 4, "testsuite_id" => 1, "issue_status_results" => [{"issue_id" => 434, "case_status_id" => 2, "environment" => "chrome", "notes" => ""}, {"issue_id" => 435, ...}]}
  Current user: anonymous
Filter chain halted as :check_if_login_required rendered or redirected
Completed 401 Unauthorized in 16ms
```

The pending XHR never receives response headers at all — matching the original note that the browser holds the
`WWW-Authenticate: Basic` challenge open rather than delivering it to the page.

### "Nothing was saved" verified against the database, not the grid

The grid showed #434/#435 as `Passed` **before** the submit, which could have been mistaken for a successful bulk
update. Checking the rows directly disproves that — the newest results for both predate this retest by four days
and carry a different environment:

```
 id  | issue_id | case_status_id | environment |         created_at
 857 |      435 |              2 | fdsgsdf     | 2026-09-11 13:58:10
 856 |      434 |              2 | fdsgsdf     | 2026-09-11 13:56:43
```

No row exists with `created_at` on 2026-09-15 for either test case, and none with environment `chrome`.

### Control — the session is valid and the non-`.json` route still works

Two minutes later, in the same tab and session, a **single** Add Result on test case **#436** (Status `Skipped`):

```
Started POST "/issue_status_results?project_id=test-project"
Processing by IssueStatusResultsController#create as JS
  Current user: admin (id=1)
Completed 200 OK in 230ms
```

Row `858` created (`issue_id 436`, `case_status_id 6`). This is the asymmetry the bug describes, still intact:
**the same session is `admin` on the non-`.json` route and `anonymous` on the `.json` one.**

#### Root cause present in that branch

- `config/routes.rb:162` — `post '/testcase_status_results/bulk_create.json', … defaults: { format: 'json' }`
- `issue_status_results_controller.rb:26` — `@bulk_url` still pointed at that `.json` URL
- No `prepend_before_action` anywhere in the plugin's controllers

</details>

## Sibling `.json` routes — still open as a question

The Suggested fix flagged four sibling routes using the same pattern (`routes.rb:163, 167, 168, 175`). They are
**unchanged**, and one of them *is* called from the browser:

```js
// assets/javascripts/testrun.js:345
url: `${window.TC_ROOT_PATH || ''}/projects/${projectId}/test-run/bulk_delete.json?key=${api_key}`
```

It appends `?key=${api_key}`, so it authenticates as an API client rather than by session — which would sidestep
this defect by a different route than the bulk_create fix took. **That is a code reading, not a test result.**
Bulk delete of a test run and of test cases has not been exercised, and should be covered in the regression for
this fix rather than assumed safe.

## Closing gate — regression still required

`SENIOR_QA_STANDARDS.md` §26: BUG-TCM-003 is **High**, so closing requires *all TCs in the affected suite plus
adjacent feature TCs*, not just this retest. The affected suite is `TESTCASE_MANAGEMENT_TEST_RUNS.md`
(TC-TCM-401–440), **none of which has been executed yet**. Until that runs, this bug stays in `bugs/open/` with a
PASS recorded, and production **#120544** is unchanged.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` (BUG-TCM-001, BUG-TCM-002) and `bugs/_duplicates.md` — both existing bugs are CSV
  import defects with unrelated root causes.
