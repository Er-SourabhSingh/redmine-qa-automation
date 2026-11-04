# Test Cases — Redmineflux Testcase Management — Security Review & Hardening (Ticket #121640)

> **Source:** Production ticket [#121640](http://flux.zehntech.com/issues/121640) — "Security review and
> hardening (suite/run/report permissions, IDOR, attachments, XSS, CSRF, API parity) on Redmine 5, 6 and 7."
> Feature ticket, Target Version "Testcase Management plugin Release 7.3.0", assigned Vaishnavi Bhawsar.
>
> **This is a SEPARATE suite from `TESTCASE_MANAGEMENT_SECURITY.md`** (the plugin's own general security pass,
> executed 2026-10-22, 34 TCs). That suite covers the security surface QA found on its own. This suite
> independently re-verifies the **specific 28 findings the developer's own security review fixed** for this
> ticket (per `backlog/specification/TCM-security-review-findings-register.md` in the plugin repo, branch
> `release/7.3.0`, reviewed 2026-11-02) plus the ticket's own cross-cutting acceptance criteria. The developer's
> own `test/security/tcm_security_test.rb` (red/green unit tests) is NOT a substitute for this — per
> `CLAUDE.md`'s automation-first rule, QA's own independent verification is what reaches a report, not the
> developer's self-reported test suite.
>
> **Status: all 30 TCs executed 2026-11-04. 28 PASS, 2 FAIL (TC-TCM-343 → BUG-TCM-134, TC-TCM-352 → BUG-TCM-135).**
> This pass covers Redmine 6.x/Postgres only (`localhost:3000`) — see "Out of scope for this pass" above for the
> Redmine 5.x/7.x follow-up.
>
> **Full results (2026-11-04), via `curl` (anonymous + authenticated sessions, real CSRF tokens captured from live
> form submissions — not guessed), live Playwright browser checks, a genuine live anonymous sweep of all 236
> plugin routes, and direct source reads of the plugin's own controllers/models/helpers/mailer views
> (`C:\redmine v6\plugins\redmineflux_testcase_management`, branch `release/7.3.0`, `a67d393`) against
> `localhost:3000` (Postgres, admin/daisy.skye/luna.blossom/Project B fixtures):**
>
> | TC ID | Result | Notes |
> |-------|--------|-------|
> | TC-TCM-337 | PASS | Anonymous `GET /load_test_cases` → 403, no suite/case data |
> | TC-TCM-338 | PASS | Anonymous `GET /get_test_cases.json` → 403 |
> | TC-TCM-339 | PASS | Anonymous steps 1/2 → 403; daisy.skye (Project A only) cross-project `testsuite_id` → 404, no 500 |
> | TC-TCM-340 | PASS | Anonymous `GET /steps/new` → 403; `POST /steps` → 422 (CSRF), confirmed no step row created |
> | TC-TCM-341 | PASS | Anonymous `DELETE` → 422 (CSRF); daisy.skye w/ valid CSRF token on cross-project issue → genuine app-level 403, no 500/NameError |
> | TC-TCM-342 | PASS | Anonymous and daisy.skye (non-member) → 403 both steps |
> | TC-TCM-343 | **FAIL** | `GET /runs/2/edit` (Project B's run) as daisy.skye (Project A only) → **HTTP 200**, not 403/404; Project B's project name/nav disclosed (run fields themselves not leaked — `#content` empty). Filed as **BUG-TCM-134** |
> | TC-TCM-344 | PASS | `GET /defects?run_id=2` as daisy.skye → 404 |
> | TC-TCM-345 | PASS | `GET /run_close_status/2.json` as daisy.skye → 403 |
> | TC-TCM-346 | PASS | Step 1: `POST /runs` for Project A naming Project B's suite/case, `from=api` → clean 422, `"Invalid test suite IDs. These do not belong to the current project: [2]"`. Step 2: malformed JSON selection → clean 422, not 500 |
> | TC-TCM-347 | PASS | Resolved via a source read of `runs_controller.rb#update` (black-box guessing of the wire format had been inconclusive). Step 1: `selected_testduite_and_testcase_ids` goes through the same `rftc_validated_selection`/`rftc_invalid_suite_case_selection` the create path uses (`rftc_suites_of(@project)` checks both `identifier` and numeric id), rejecting any suite not genuinely in `@project` — same shared code path already confirmed working live via TC-346. Step 2: `issue[watcher_user_ids]` is filtered to `@project.users.pluck(:id)` before being applied — confirmed live, `PUT /runs/1` naming a genuine Project-A non-member (user id 2) left the run's own Watchers list empty afterward. Step 3: the `Testsuite#project_id` identifier-vs-numeric-id confusion is resolved by `rftc_suites_of` checking `[project.identifier, project.id.to_s]` together, used by both create and update |
> | TC-TCM-348 | PASS | `GET /test_suites?project_id=A&testsuite_id=<B>` as daisy.skye → 404, no Project B suite/case data |
> | TC-TCM-349 | PASS | Add-result form with an issue not attached to the run → 404 |
> | TC-TCM-350 | PASS | luna.blossom (edit_requirement on A, non-member of B) `PUT /content_update_testcase/2` (B's requirement) → 403, content unchanged |
> | TC-TCM-351 | PASS | luna.blossom `PUT /generate_url_testcase/2` (B's requirement) → 403 |
> | TC-TCM-352 | **FAIL** | 3 of 7 read endpoints leak Project B data to ANY authenticated non-member: `GET /knowlegebase_pages_testcase/2?project_id=4` (full requirement content), `GET /requirement/testcases?project_id=4` (full testcase list), `GET /user_project/4` (member list) — all `200` with real data; anonymous correctly refused (403) on the same URLs, isolating the gap to project-scoping. Reproduced with 2 different users/roles. The other 4 endpoints (`content_search_knowledgebase_testcase`, `version_change_knowledgebase`, `version_data_knowledgebase`, `page_attachments`) correctly 404/422. Filed **BUG-TCM-135** (High) |
> | TC-TCM-353 | PASS | luna.blossom (permission on A) `POST /version_management_knowledgebase` naming `project_id=A` but `page_id=2` (B's page) → 403, write did not land on B's page |
> | TC-TCM-354 | PASS | `PUT /requirements/1` with `project_id=4` in the payload → title updated (confirms processed), `project_id` stayed 2 (A) — param ignored |
> | TC-TCM-355 | PASS | `add_issues_to_test_suite`/`copy_issues_to_test_suite` naming Project B's issue 284 into Project A's suite → both 404, suite's own case list unchanged |
> | TC-TCM-356 | PASS | Step 1: cross-project `assign_requirement` link → issue not linked (query correctly scoped to `@project.id`). Step 2: issue with `<script>alert('tcm18')</script>` subject linked to an authorized requirement → rendered as `&lt;script&gt;...&lt;/script&gt;` in the requirement content and on the Test Cases list, confirmed no dialog fires live |
> | TC-TCM-357 | PASS (source-verified) | `TestcaseReport` model validates `requirement_in_project` (`Requirement.exists?(id:, project_id:)`) — an unbypassable model-layer boundary regardless of controller path. `RftcOutputSafetyHelper.rftc_valid_recipients` (regex-validated, deduped) confirmed called identically in the controller, `ReportCreationWorker`, and `RunMailer` — a header-injection string fails the email regex and is dropped |
> | TC-TCM-358 | PASS (source-verified) | `_closed_run.html.erb` renders `run.notes` via `rftc_sanitize_rich`; `run_updated.html.erb` renders every changed old/new value AND `@run.notes` via the same helper (`Rails::Html::SafeListSanitizer` with an explicit tag/attribute allow-list — `onerror` not included) |
> | TC-TCM-359 | PASS (source-verified) | All 4 JS error-flash views (`testsuite_update_error.js.erb`, `testsuite_new_error.js.erb`, `runs/error.js.erb`, `issue_status_results/new_result_error.js.erb`) use `j(rftc_sanitize_rich(...))` — sanitize strips tags, `j()` (`escape_javascript`) escapes any surviving quote so it can't terminate the JS string |
> | TC-TCM-360 | PASS (source-verified) | `rftc_error_message` (9 call sites across MCP/runs/import/suites controllers) returns the real message only for `ActiveRecord::RecordInvalid`; everything else is logged server-side and replaced with a generic line. Live attempts to force a non-validation crash didn't reproduce one (app proved robust against the probes tried), so this is source-verified rather than observed-live |
> | TC-TCM-361 | PASS (source-verified) | `rftc_allowed_import_mappings` filters every posted column mapping against an explicit `IMPORTABLE_FIELDS` allow-list + `steps_N`/`expected_N`/`cf_N` pattern before it's ever persisted to `import_meta` — `created_on`/`parent_id`/`lock_version`/`id` all fall outside both and are silently dropped |
> | TC-TCM-362 | PASS (source-verified) | `Run.sanitize_sql_like`/`Issue.sanitize_sql_like`/`Requirement.sanitize_sql_like` used in Runs search, Run subject filter (both locations), and To-Do search — exactly the 3 surfaces named |
> | TC-TCM-363 | PASS (source-verified) | `SwaggerProjectsController#require_login_by_key_or_basic_auth` checks `Setting.rest_api_enabled?` and returns 403 BEFORE any key/basic-auth attempt, for both `index` (`get_project_list.json`) and `show` (`get_project/:id.json`) |
> | TC-TCM-365 | PASS | Extracted the live route table via `rails runner` (238 routes) and swept all 236 non-public-by-design plugin routes anonymously via `curl` — **zero offenders** (every route returned 3xx/4xx, never 2xx/5xx). `grep -rn api_key app/views app/assets` → zero leaked values (2 unrelated comments only) |
> | TC-TCM-366 | PASS | As daisy.skye (normal Project A Developer): browsed Test Suites/Test Cases (282 issues, paginated correctly, the TC-356 XSS payload subject renders as inert literal text), opened Run #1, recorded a Passed result (donut chart updated 0%→100% live), opened To Do — every normal action worked exactly as before, no new check blocked her |
>
> **Final tally: 30/30 TCs executed, 28 PASS, 2 FAIL.** Open bugs from this suite: **BUG-TCM-134** (Medium —
> `GET /runs/:id/edit` wrong status code + project-name/nav disclosure) and **BUG-TCM-135** (High — 3 read
> endpoints leak full cross-project data to any authenticated non-member). Neither yet reported to production.
>
> **Not carried into this suite as individual TCs** (see the findings register's "Not fixed / observations"
> table for full detail — these are deliberate non-fixes, not gaps):
> TCM-27 (`swagger_projects` still accepts `?key=`/`?api_key=` in the URL — matches core Redmine's own
> behavior, changing it breaks existing API clients), TCM-28 (harmless `new` vs `:new` typo in a `before_action`
> filter list), TCM-29 (a pre-existing functional bug, not a security issue, fails closed), TCM-30 (report
> emails to external addresses are by design), TCM-31 (CSV import's broad `Issue.new` scope is intentional for
> an importer with `add_issues`), TCM-32 (dead routes with no controller behind them — routing error only, not
> reachable), TCM-33 (Redmine core's own validation already covers this, confirmed by a guard test).

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `a67d393` or later (must include `ede2235` — "Security review: close
  data-leak and access-control gaps across the plugin" — the commit that fixed all findings below)
- Redmine version: 6.0.11 (Docker, `localhost:3000`) — the ticket's own scope also calls for Redmine 5.x/7.x
  parity checks; those are tracked separately (see "Out of scope for this pass" below) since this plugin's
  primary QA environment is Redmine 6.x
- Path: plugins/redmineflux_testcase_management_qa

## Out of scope for this pass

- Full Redmine 5.x/7.x re-execution of every TC below (the ticket's own "Environment / compatibility" section
  asks for all three). This pass executes against the primary Redmine 6.x/Postgres instance only; a second pass
  against the existing Redmine 7.x stacks (`localhost:3002` MySQL, `localhost:3012`/`3004`/`3005` Postgres) is a
  follow-up, not blocking this suite's own PASS/FAIL per TC.
- Formal penetration testing of the hosting environment (ticket's own "Out of scope" section).

## Fixtures needed before executing this suite

- **Project A** = `rftc-016-ci-qa` (id=2, already exists on this instance, has the Testcase Management module
  enabled and existing test suites/cases/runs from prior sessions).
- **Project B** — a second project with its own Testcase Management module, test suite, test case, run, and
  (if Requirements module is enabled) requirement, so cross-project substitution has a genuine distinct target.
  Created fresh for this suite if it doesn't already exist: `rftc-121640-project-b`.
- **User roles needed**, all already available via the standard QA seed-user pool (`QA_CREDENTIALS.md`):
  - A member of Project A only, with a Reporter/Developer-equivalent role (e.g. `daisy.skye`), used as the
    "user of project A" attacker persona.
  - A user who is a genuine **non-member** of Project B at all (zero role) — any seed user never added to
    Project B.
  - Admin (`admin`), used as the control/setup identity and for the anonymous-vs-authenticated contrast.
- Anonymous (no session) — tested via `curl` with no cookie/API key, or a logged-out Playwright context.
- One real test suite + test case + run in EACH project, so every finding below has a genuine target id, not a
  synthetic/guessed one.

---

## Authentication (TCM-01, 02, 03, 12, 13, 34)

### TC-TCM-337: `GET /load_test_cases?suite_id=` requires login and a project-read check

**Severity:** High (TCM-01)
**User Role:** Anonymous
**Steps:**
1. Without logging in, request `GET /load_test_cases?suite_id=<a real suite id in Project A>` directly (`curl`,
   no cookie).

**Expected Result:**
- Redirected to login / refused (302 or 403), never the suite name, test case ids or subjects of Project A.
- **Before fix:** returned Project A's suite/case data to a fully anonymous caller.

**Result: PASS** (2026-11-04) — anonymous `curl` got `403 {"error":"You are not authorized to perform this action."}`, no suite/case data.

---

### TC-TCM-338: `GET /get_test_cases.json?suite_id=` requires login and a project-read check

**Severity:** High (TCM-02)
**User Role:** Anonymous
**Steps:**
1. Without logging in, request `GET /get_test_cases.json?suite_id=<a real suite id in Project A>` directly.

**Expected Result:**
- Refused — no test case ids returned to an anonymous caller, regardless of the `project_id` in the URL (the
  fix resolves the project from the suite's own record, not the trusted-looking URL param).

---

### TC-TCM-339: "Select test cases" window requires login, project-read, and doesn't 500 on a bad `testsuite_id`

**Severity:** High (TCM-03)
**User Role:** Anonymous, then a Project-A member
**Steps:**
1. Without logging in, request `GET /show_select_cases_model?project_id=<A>`.
2. Request the same URL with `&testsuite_id=<a suite id from Project B>` appended.
3. Log in as a Project-A member and repeat step 2 with a genuinely cross-project `testsuite_id`.

**Expected Result:**
- Step 1/2: refused, not the suite/case list of Project A, and no 500 error.
- Step 3: the project is resolved (by id or identifier) and read-checked; a suite that does not belong to it is
  rejected (404/422), not silently rendered and not a 500.

---

### TC-TCM-340: `POST /steps` / `GET /steps/new` require login

**Severity:** Medium (TCM-13)
**User Role:** Anonymous
**Steps:**
1. Without logging in, `GET /steps/new?...` and `POST /steps` with a plausible step payload for a real test
   case id.

**Expected Result:**
- Both refused; no step row is created by an anonymous caller. **Before fix:** anonymous visitors could write
  step rows directly.

---

### TC-TCM-341: `DELETE .../delete_issue_testcase_field` and `POST .../update_issue_testcase_field` require login + ownership

**Severity:** High (TCM-12)
**User Role:** Anonymous, then a non-member of the issue's project
**Steps:**
1. Without logging in, `DELETE /issues/<a real issue id>/delete_issue_testcase_field`.
2. Logged in as a user with no membership on that issue's project, `POST /issues/<id>/update_issue_testcase_field`
   with a plausible run-link payload.

**Expected Result:**
- Step 1: refused outright (no login).
- Step 2: refused (403/404) — the issue must be visible and the caller needs `edit_issues` on its project; the
  test case must genuinely be linked to a run of a project the caller can read (via the real `RunIssue` model,
  not a nonexistent `RunTestcase` constant — confirm no `NameError`/500 either).

---

### TC-TCM-342: `GET /testcase/defects` (`search_related_issues`) requires login + project scope, matching `#new`'s own pattern

**Severity:** High (TCM-34)
**User Role:** Anonymous
**Steps:**
1. Without logging in, request `GET /testcase/defects?issue_id=<a real issue id>&run_id=<a real run id in Project A>`.
2. Repeat as a logged-in user who is not a member of Project A, with `execute_testcase` not granted.

**Expected Result:**
- Both refused. The project is resolved from the run's own `run_id` (not a trusted URL `project_id`), and
  `execute_testcase` is required on it. Any defects returned are independently re-checked against
  `Issue.visible` for the caller (not just the run's project), so a cross-linked defect from a third project
  can't leak through either.
- **Before fix:** any anonymous visitor who knew/guessed an `issue_id` got the id and subject of every linked
  defect, across any project.

---

## Cross-project IDOR — runs, defects, environments (TCM-04, 05, 06, 14, 15, 17, 19)

### TC-TCM-343: `GET /runs/:id/edit` is scoped to the run's OWN project, not just the URL's project

**Severity:** High (TCM-04)
**User Role:** Member of Project A only
**Steps:**
1. Logged in as the Project-A-only member, request `GET /runs/<a real run id belonging to Project B>/edit`
   (optionally with `?project_id=<A>` to mimic the old trusted-param pattern).

**Expected Result:**
- Refused (403/404) — the edit form (name, notes, assignees) of Project B's run is not rendered, and the
  suites offered (if the request somehow proceeds) are never Project B's.
- **Before fix:** a member of Project A could open the edit form of a run belonging to Project B.

---

### TC-TCM-344: `GET /defects?run_id=` is scoped to the run's own project

**Severity:** Medium (TCM-05)
**User Role:** Member of Project A only
**Steps:**
1. Request `GET /defects?run_id=<a real run id in Project B>` as the Project-A-only member.

**Expected Result:**
- Refused — no defects or environments of Project B's run are returned.

---

### TC-TCM-345: `GET /run_close_status/:id.json` is scoped to the run's own project

**Severity:** Medium (TCM-06)
**User Role:** Member of Project A only
**Steps:**
1. Request `GET /run_close_status/<a real run id in Project B>.json`.

**Expected Result:**
- Refused — the closing summary (counts, issues per suite) of Project B's run is not returned to a Project-A
  member.

---

### TC-TCM-346: `POST /runs` with `from` (CI/API flag) still enforces suite/case project checks; malformed JSON selection gives 422, not 500

**Severity:** High (TCM-14)
**User Role:** A user with `create_run` on Project A
**Steps:**
1. `POST /runs` for Project A with `from=api` (or whatever value the CI/API path uses) and a suite/test-case
   selection naming real suites/cases from Project B.
2. Repeat with the selection payload malformed (not valid JSON, to mimic what a real API client might send).

**Expected Result:**
- Step 1: refused — a run of Project A cannot be built from Project B's suites/cases regardless of the `from`
  value; no Project-B suite/case names are echoed in the response.
- Step 2: a clean `422`, not an unhandled `500`.

---

### TC-TCM-347: `PUT /runs/:id` (and the `update_run` API) reject cross-project suite/case ids and non-member watchers

**Severity:** High (TCM-15)
**User Role:** A user with `edit_run` on Project A
**Steps:**
1. `PUT /runs/<a Project-A run id>` with a suite id or test-case id that actually belongs to Project B.
2. Repeat with a `watcher` user id who is not a member of Project A.
3. Repeat via the `update_run` API specifically comparing a project identifier string against a numeric id (the
   original confusion between `Testsuite#project_id` storing the identifier vs. a numeric project id).

**Expected Result:**
- All three rejected — every (suite, test case) pair must genuinely exist together, watchers must be real
  project members, and the id/identifier comparison no longer silently mismatches.

---

### TC-TCM-348: `GET /test_suites?project_id=A&testsuite_id=<suite of B>` cannot open a foreign project's suite

**Severity:** Medium (TCM-17)
**User Role:** Member of Project A only
**Steps:**
1. Request `GET /test_suites?project_id=rftc-016-ci-qa&testsuite_id=<a real suite id belonging to Project B>`.

**Expected Result:**
- Refused / suite not found — the suite must belong to the project named on the page, not just exist somewhere.

---

### TC-TCM-349: The "add result" form only loads an issue that is actually part of the run

**Severity:** Medium (TCM-19)
**User Role:** A user with `execute_testcase` on the run's project
**Steps:**
1. Open the "add result" form for a real run, substituting an issue id that exists but is **not** attached to
   that run (could be from the same project or a different one).

**Expected Result:**
- 404 (or equivalent refusal) — not the subject/steps of an issue that isn't part of the run.

---

## Cross-project IDOR — suites, requirements, test cases (TCM-07, 08, 09, 10, 11, 16, 18)

### TC-TCM-350: `PUT /content_update_testcase/:id` requires `edit_requirement` on the requirement's OWN project

**Severity:** Critical (TCM-07)
**User Role:** Any signed-in user with no membership on the requirement's project
**Steps:**
1. Logged in as any signed-in user (no membership needed on the target project in the old behavior), `PUT
   /content_update_testcase/<a real requirement id in a project the caller cannot edit>` with new content and
   an `updated_by` value naming a different user.

**Expected Result:**
- Refused (403) unless the caller genuinely has add/edit-requirement on that requirement's own project.
- `updated_by` is always the actual signed-in user, never attacker-chosen.
- **Before fix:** any signed-in user, with zero membership needed, could overwrite the content of any
  requirement project-wide and attribute it to anyone.

---

### TC-TCM-351: `PUT /generate_url_testcase/:id` requires the same permission check

**Severity:** High (TCM-08)
**User Role:** Any signed-in user with no membership on the requirement's project
**Steps:**
1. `PUT /generate_url_testcase/<a real requirement id in a project the caller cannot edit>`.

**Expected Result:**
- Refused — a public link (key + URL) for a requirement outside the caller's permission is not created or
  replaced.

---

### TC-TCM-352: Requirement read endpoints are scoped to the requirement's own (enabled + visible) project

**Severity:** High (TCM-09)
**User Role:** A non-member of Project B
**Steps:**
1. As a non-member of Project B, call each of: `GET /knowlegebase_pages_testcase/:id` (full content), `GET
   /requirement/testcases?project_id=B`, `GET /user_project/:id` (member names), `GET
   /content_search_knowledgebase_testcase?project_id=B&q=%`, `GET /version_change_knowledgebase`, `GET
   /version_data_knowledgebase`, `GET /page_attachments` — each pointed at Project B's requirement/page ids.

**Expected Result:**
- Every one refused for the non-member (project-enabled + visible check on the requirement's own project).
- The issue list returned by `requirement/testcases` (when accessible) is limited to visible issues.
- The search in `content_search_knowledgebase_testcase` is not a raw `LIKE` pattern (a lone `%` should not act
  as a wildcard matching everything — cross-check against TC-TCM-361's `sanitize_sql_like` fix too).

---

### TC-TCM-353: `POST /version_management_knowledgebase` checks permission AND writes to the authorized page only, with the real author

**Severity:** High (TCM-10)
**User Role:** A user with permission on Project A but targeting a page in Project B
**Steps:**
1. `POST /version_management_knowledgebase` with `project_id=A` (where the caller has permission) in the
   request but a `page_id` that actually belongs to Project B, and an `updated_by` naming a different user.

**Expected Result:**
- Refused, or at minimum the write never lands on Project B's page — permission is checked on the
  **requirement's own** project (derived from the real `page_id`), not the project named in the request, and
  the author is always the real signed-in user.

---

### TC-TCM-354: `PUT /requirements/:id` cannot move a requirement into another project via `project_id`

**Severity:** Medium (TCM-11)
**User Role:** A user with `edit_requirement` on the requirement's current project
**Steps:**
1. `PUT /requirements/<a real requirement id>` including `project_id=<a different project>` in the payload.

**Expected Result:**
- The requirement's `project_id` is unchanged after the update — the param is ignored, not honored.

---

### TC-TCM-355: `add_issues_to_test_suite` / `copy_issues_to_test_suite` only accept issues from the suite's own project

**Severity:** High (TCM-16)
**User Role:** A user with suite-management permission on Project A
**Steps:**
1. On a suite in Project A, attempt to add/copy issue ids that actually belong to Project B.

**Expected Result:**
- Refused (404) for the Project-B issue ids — they are not pulled out of Project B's own suites, and no copy
  is created anywhere as a result.
- **Before fix:** this genuinely exfiltrated another project's test cases out of their own suites and created a
  copy inside the attacker's project.

---

### TC-TCM-356: `assign_requirement` only links issues/requirements within the authorized project, and escapes the issue subject

**Severity:** High (TCM-18)
**User Role:** A user with `edit_requirement` on Project A
**Steps:**
1. Attempt `assign_requirement` linking a Project-B issue to a Project-A requirement (or vice versa).
2. Separately, link an issue whose subject contains `<script>alert('tcm18')</script>` to a requirement the
   caller IS authorized for, then open that requirement's page.

**Expected Result:**
- Step 1: refused — issues and requirements are both limited to the authorized project.
- Step 2: the subject renders as plain escaped text in the requirement's HTML; no script executes (this was a
  genuine stored XSS before the fix — the issue subject was written unescaped).

---

## Reports, scheduling, and email safety (TCM-20, 21, 22, 23)

### TC-TCM-357: A report's `requirement_id` must belong to the report's own project; email recipient list is validated

**Severity:** Medium (TCM-20)
**User Role:** A user who can create reports on Project A
**Steps:**
1. Create/edit a Testcase Report on Project A, setting `requirement_id` to a requirement that actually belongs
   to Project B.
2. Separately, set the report's email recipient list to a value with line breaks and a header-injection attempt
   (e.g. `victim@example.com\nBcc: attacker@evil.com`), then trigger the scheduled-email path (controller,
   scheduled worker, and the mailer itself — all three use the same validator).

**Expected Result:**
- Step 1: rejected by model validation — Project B's runs are not pulled into Project A's report page.
- Step 2: `RftcOutputSafetyHelper.rftc_valid_recipients` strips anything not a well-formed, unique email address
  before it reaches the mail headers — no header injection, no duplicate/malformed addresses delivered to.

---

### TC-TCM-358: Stored XSS via `run.notes` (closed-runs list) and the run-updated mail's changed-value rendering

**Severity:** Medium (TCM-21)
**User Role:** A user who can create/edit a run
**Steps:**
1. Set a run's notes (or name) to `<img src=x onerror=alert('tcm21')>`, close the run, and view the closed-runs
   list.
2. Separately, edit a run's name/notes to a similar payload and trigger the "run updated" notification email;
   inspect the rendered email body (e.g. via Mailpit).

**Expected Result:**
- Neither the closed-runs list nor the email executes the script — both now go through `rftc_sanitize_rich`
  (same allow-list as the plugin's other sanitized views), not a raw `raw(...)` render.

---

### TC-TCM-359: JS error-flash responses don't break out of their quoted string

**Severity:** Low (TCM-22)
**User Role:** Any authenticated user able to trigger a validation-error JS response (e.g. a bad "Add Test
Suite"/"Add Run" submission)
**Steps:**
1. Trigger one of the 4 JS error-flash responses with a payload containing a double quote followed by a `<script>`
   tag in the field that surfaces in the flash message.

**Expected Result:**
- The quote does not terminate the JS string early — no injected tag executes. The flash is built via
  `j(rftc_sanitize_rich(...))`, not a raw interpolation.

---

### TC-TCM-360: Internal exception text is never returned to the client (MCP/run/import error paths)

**Severity:** Medium (TCM-23)
**User Role:** Any authenticated user able to trigger a server-side exception on one of the ~43 affected
endpoints (MCP, run, import controllers)
**Steps:**
1. Trigger a genuine server error on at least 2-3 representative endpoints across MCP/run/import (e.g. a
   malformed payload likely to raise a DB-level error) and inspect the JSON error response.

**Expected Result:**
- A validation-style message (if the error is a real validation failure) or a short generic line — never a raw
  database/internal exception message (no SQL text, no file paths, no Ruby backtrace fragments). The real error
  is still logged server-side via `rftc_error_message(e)`.

---

## Input handling — CSV import, LIKE queries, REST toggle (TCM-24, 25, 26)

### TC-TCM-361: CSV import's column mapping only sets allow-listed `Issue` attributes

**Severity:** Medium (TCM-24)
**User Role:** A user with `add_issues` performing a CSV import
**Steps:**
1. During a CSV import, submit a column-mapping payload (as the browser would, but doctored) naming a
   dangerous attribute such as `created_on`, `parent_id`, `lock_version`, or `id` instead of one of the fields
   the page actually offers.

**Expected Result:**
- The dangerous attribute is not applied to the created `Issue` — only the fields the page offers (plus
  `steps_n`/`expected_n`/`cf_n`) can be set, regardless of what the posted mapping claims.

---

### TC-TCM-362: LIKE-query search/filter fields don't treat `%`/`_` in user input as wildcards

**Severity:** Low (TCM-25)
**User Role:** Any authenticated user with search/filter access
**Steps:**
1. In the Runs search, Run filters, and To-Do search fields, search for a literal string containing `%` and `_`
   (e.g. `test%case_1`) and confirm the match behavior.

**Expected Result:**
- `%`/`_` in the typed text are escaped (`sanitize_sql_like`) and treated as literal characters, not SQL
  wildcards — a search for `test%case_1` does not match every row.

---

### TC-TCM-363: `/get_project_list.json` and `/get_project/:id.json` honor `Setting.rest_api_enabled`

**Severity:** Low (TCM-26)
**User Role:** Admin (to toggle the setting), then any API caller
**Steps:**
1. As admin, disable "Enable REST web service" (Administration → Settings → API).
2. With the setting disabled, call `GET /get_project_list.json` and `GET /get_project/<id>.json`.

**Expected Result:**
- Both refused while the setting is off, matching every other REST endpoint's behavior — not an exception
  carved out for these two.

---

## Dead routes removed (TCM-35)

### TC-TCM-364: `/run_testcases/:testsuite_id` and `/get_testcase_ids_by_testsuit/:testsuite_id` no longer exist

**Severity:** Low (TCM-35)
**User Role:** Anonymous
**Steps:**
1. Without logging in, request `GET /run_testcases/<any id>` and `GET
   /get_testcase_ids_by_testsuit/<any id>`.

**Expected Result:**
- A genuine 404 (routing error) for both — not Rails' old implicit-rendering behavior that quietly served an
  empty view with a `200 OK` to anyone, logged in or not.

---

## Cross-cutting acceptance criteria (ticket-level, not tied to a single finding)

### TC-TCM-365: Every plugin route refuses an anonymous (no-session, no-key) request

**Severity:** High — this is Acceptance Criterion #1 of the ticket
**User Role:** Anonymous
**Steps:**
1. Enumerate every route this plugin registers (`rails routes` filtered to the plugin's own controllers, or the
   developer's own `TcmAnonymousSweepTest`'s route list — confirm independently, don't just trust the dev test's
   self-reported count).
2. Request every one of them with no session cookie and no API key.
3. Separately, view the raw page source of any page that DOES render for an authenticated session and confirm
   no `api_key` value appears anywhere in the HTML/JS (`grep -rn 'api_key' app/views/ assets/` should also be
   re-run against the actual deployed code, excluding vendored bundles).

**Expected Result:**
- Every route either requires login (redirect/403) or is on an explicit, deliberate public-by-design allowlist
  (e.g. `issue_testcase#api_show`, confirmed intentional per the findings register's 2026-11-03 follow-up note).
  No route serves plugin data to a fully anonymous caller outside that allowlist.
- Zero `api_key` values appear in any rendered page's HTML or inline JS.

---

### TC-TCM-366: Normal testing workflows are unaffected by the security fixes

**Severity:** High — this is Acceptance Criterion #10 of the ticket ("normal tester... works exactly as before")
**User Role:** A genuine project member with a normal QA role (e.g. Reporter/Developer on Project A)
**Steps:**
1. As a normal, properly-permissioned member of Project A, perform the everyday workflow this security pass
   touched: create a test suite, add a test case, create a run, record a result, link/report a defect, add a
   requirement and link an issue to it, run a CSV import, generate a report and email it, search/filter runs.

**Expected Result:**
- Every one of these normal, in-project actions succeeds exactly as before — none of the added authorization/
  sanitization/allow-list checks block a legitimate same-project user doing their normal job.
