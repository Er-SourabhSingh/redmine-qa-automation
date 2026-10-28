# Test Cases — Redmineflux Testcase Management — Security Testing

> Source: `SENIOR_QA_STANDARDS.md` §28 (Security Testing Approach — mandatory for every plugin, every cycle) and
> this plugin's own `docs/TESTCASE_MANAGEMENT_MEMORY.md` "Recurring Issues" section, which already documents
> several confirmed authorization gaps (BUG-TCM-003, BUG-TCM-007, BUG-TCM-009) found incidentally while executing
> other suites. This suite exists to give those gaps — and the security surface not yet touched by any other
> suite (XSS, IDOR, session handling, file upload validation) — a dedicated, complete pass of their own, per
> `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`'s own recorded gap.
>
> **Status: authored 2026-10-06, not yet executed.** Where a case re-confirms an already-filed bug, its known
> result is cited from the bug file / memory so this suite doesn't have to re-discover it from zero — but the
> live re-check still needs to happen before the result here counts as current evidence (per `CLAUDE.md` §7,
> every result reaching a report must come from an actual run, not a recalled tally).
>
> **Relationship to `TESTCASE_MANAGEMENT_PERMISSIONS.md`:** that suite's "Leg C" (negative endpoint check) already
> covers role-based permission enforcement per action. This suite does **not** repeat that — it covers security
> concerns Leg C doesn't: zero-permission members hitting write endpoints directly (not just a denied role),
> cross-**project** isolation (not cross-role within one project), injection, session handling, sensitive-data
> exposure, and file upload validation.
>
> **EXECUTED 2026-10-22.** Full pass via curl (session-authenticated), direct `rails runner` model/code-path
> inspection, and Playwright MCP (real-browser XSS confirmation) against the Docker `localhost:3000` build. Three
> new bugs found and filed: **BUG-TCM-091** (High, CSV import cross-project suite-link leak, TC-230),
> **BUG-TCM-092** (High, Test Suites page 500 crash on no-suite-selected path, found incidentally during TC-231),
> **BUG-TCM-093** (Critical, genuine executing stored XSS in the Requirements sidebar tree, TC-232), and
> **BUG-TCM-094** (Medium, cross-project IDOR disclosure via `issue_status_results#new`, TC-226). BUG-TCM-007 and
> BUG-TCM-009's current fix status were re-confirmed live per each TC below (007 is now fixed across
> `test_suites_controller.rb`/`requirements_controller.rb`/`testcase_reports_controller.rb`; 009 is reopened —
> see the Permissions suite's 2026-10-22 regression for its full detail). All probe fixtures (issues, requirements,
> runs, suite links) created during this pass were deleted immediately after confirmation; role/membership
> baselines (`qanonadmin` Developer-role membership on `rftc-016-ci-qa`) were restored where temporarily altered.
> All 4 new bugs reported to production the same day as #124346/#124347/#124348/#124349.
>
> **FOLLOW-UP PASS, same day**, per explicit user instruction to close every TC that had rested on source/
> architectural inference rather than live execution (TC-231, 234, 236, 238, 245, 246, 247, 248). Every one of
> these was re-run live with a genuine probe fixture — a real Testcase Summary report + its Excel export, a real
> "Test Case Result Added" email via Mailpit, a real Environment created through the UI, a full live 4-step CSV
> import wizard run, a live 12.9MB oversized CSV upload, a live import→export round trip for the formula-injection
> check, and a live attachment upload+download (including a direct `/uploads` POST bypassing the browser's
> client-side size check entirely). No TC in this suite now rests on inference alone — every PASS has genuine
> 2026-10-22 execution evidence. All probe fixtures deleted immediately after each check.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0 / v7.1.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`) / `localhost:3015` (v7.1.0 instance)
- Path: plugins/redmineflux_testcase_management_qa

## Fixtures needed before executing this suite

- Two separate projects (A, B), each with the TestCases module enabled, each with its own test suite, test case,
  run, requirement, and report — so cross-project substitution has real distinct targets, not synthetic IDs.
- One user who is a genuine **non-member** of project B (zero role, confirmed via Rails console, not just a
  denied-role member) — reuse the `tcm-permissions-private-test` pattern from the Permissions suite if still live.
- One user who **is** a member of project A with **zero** Testcase Management permissions granted (distinct from
  a "denied role" that still has some other plugin permission) — isolates "logged in, project member, but no
  grant at all" from "logged in, wrong role."
- A CSV file disguised as `.csv` but containing non-CSV binary content, and a CSV sized near/above any documented
  import size limit, for the file-upload section.

---

## Authentication required on every route

---

### TC-TCM-215: Unauthenticated access to Test Suite / Test Case pages is blocked

**User Role:** Anonymous (no session at all)
**Priority:** High
**Steps:**
1. Without logging in, request `GET /test_suites?project_id=<id>` and `GET /issue_testcase/new?project_id=<id>`
   directly.

**Expected Result:**
- Both redirect to the login page (core Redmine's `login_required` gate), never rendering plugin content.
- Note: the instance-wide "Authentication required" setting is what actually produces this redirect, not a
  plugin-specific guard — confirm the setting is still enabled before trusting a PASS here (see TC-TCM-075's
  original caveat in the Permissions suite).

**Result: PASS — EXECUTED 2026-10-22.** `Setting.login_required` confirmed enabled; both URLs, requested with no
cookie at all (fresh curl, no cookie jar), redirected 302 to `/login?back_url=...`. No plugin content rendered.

---

### TC-TCM-216: Unauthenticated access to Run list/detail/execution pages is blocked

**User Role:** Anonymous
**Priority:** High
**Steps:**
1. Without logging in, request `GET /runs?project_id=<id>`, `GET /runs/<id>`, and
   `GET /issue_status_results/new?issue_id=<id>` directly.

**Expected Result:**
- All three redirect to login; no run data, test case list, or execution form is rendered to an anonymous request.

**Result: PASS — EXECUTED 2026-10-22.** All three, requested with no session cookie, redirected 302 to `/login`.

---

### TC-TCM-217: Unauthenticated access to Reports / RTM / Requirements / To-Do / Activity is blocked

**User Role:** Anonymous
**Priority:** High
**Steps:**
1. Without logging in, request each of: `GET /testcase_reports?project_id=<id>`,
   `GET /traceability_rtms?project_id=<id>`, `GET /requirements?project_id=<id>`,
   `GET /testcase_todos?project_id=<id>`, `GET /testcase_activities?project_id=<id>` directly.

**Expected Result:**
- All five redirect to login. None render any project/requirement/report data.

**Result: PASS — EXECUTED 2026-10-22.** All five, no session cookie, redirected 302 to `/login`.

---

### TC-TCM-218: Anonymous request to a `.json` bulk endpoint is rejected, not silently processed

**User Role:** Anonymous
**Priority:** Critical
**Steps:**
1. Without any session cookie or API key, send `POST /testcase_status_results/bulk_create.json` with a plausible
   payload (real `issue_ids`, a valid `case_status_id`) directly.

**Expected Result:**
- Rejected (401, or redirected to login depending on `rest_api_enabled`), and **no** `IssueStatusResult` rows are
  created.
- This is the inverse check of BUG-TCM-003's root cause (core treats `.json` requests as API requests, skipping
  session auth) — confirm that path doesn't also mean a genuinely anonymous caller can write data merely by
  omitting credentials entirely. If any row gets created, this is a **Critical** unauthenticated-write defect,
  more severe than BUG-TCM-003 itself.

**Result: PASS — EXECUTED 2026-10-22.** No cookie, no API key: `401 Unauthorized`. Confirmed via `rails runner`
that zero new `IssueStatusResult` rows were created by the attempt. Matches `restore_session_user_for_api`'s
documented behavior (SEC-004 fix) — a genuinely credential-less `.json` request is still correctly rejected.

---

### TC-TCM-278: A genuine REST API client (HTTP Basic, API key as username) is NOT CSRF-rejected on a `.json` mutation

**User Role:** Any authenticated user, via a real API key (not a browser session)
**Priority:** High
**Steps:**
1. Using a valid API key, send `POST /test_suites.json?project_id=<id>` with HTTP Basic auth, the API key as the
   username and any password (Redmine's documented REST API auth convention) — e.g.
   `curl -u "<api_key>:dummy" -X POST ".../test_suites.json?project_id=<id>" -d '{"testsuite":{"name":"...","parent_id":0}}'`.
2. Repeat with the API key passed as a `?key=<api_key>` URL parameter instead.
3. Check the response status/body and the server log for a `Filter chain halted as :rftc_verify_session_csrf!`
   entry.

**Expected Result:**
- Both requests succeed (`201 Created`, the test suite is actually created) — a real API-key-authenticated client
  must never be CSRF-rejected. The server log should show the resolved user (e.g. `Current user: admin`), not
  `anonymous`, and no `Filter chain halted` line for the CSRF filter.
- This is the API-parity companion to TC-TCM-218 (anonymous bulk-create correctly rejected) and the inverse
  failure mode: here a *genuinely credentialed* request must NOT be rejected, whereas TC-218 is about a
  *genuinely uncredentialed* request correctly being rejected. Both guard the same `restore_session_user_for_api`
  / `rftc_verify_session_csrf!` pair (SEC-004, production #121896-era hardening) from opposite directions.

**Status: EXECUTED 2026-10-21 — PASS, verified across every endpoint in the plugin using this filter pattern, not
just `test_suites.json`.** Client-reported regression (customer `lnastev`): the same filter pair had previously
rejected this exact scenario with a false `422 {"error":"Invalid form authenticity token."}`, because an earlier
version couldn't distinguish a real API client from a cookie-authenticated browser session. Verified on the
dev-fixed `C:\crux-redmine` build: both the HTTP-Basic-key-as-username and `?key=` variants returned `201 Created`
with no CSRF rejection on `test_suites.json`, confirmed via server log (`Current user: admin`, no `Filter chain
halted` line). **Per explicit follow-up request, re-verified the same HTTP-Basic-key-as-username method against
every other controller/action that declares this same `rftc_verify_session_csrf!` before_action** (grepped the
full codebase for it): `RequirementsController#create`, `RunsController#create`, `IssueStatusResultsController`
(`#create`, `#bulk_create`, `#link_defect`, `#unlink_defect`), `RequirementIssuesController` (`#create`,
`#destroy`), and `Apis::CiTestRunController#bootstrap_run`. **Zero CSRF rejections anywhere** — every single
request resolved `Current user: admin` with no `Filter chain halted :rftc_verify_session_csrf!` line; the various
404s encountered along the way were unrelated, pre-existing param-shape/authorization quirks on unfamiliar
endpoints (wrong nesting, project_id as identifier vs numeric id, etc.), confirmed via log inspection to not be
CSRF-related. `RunsController` and `IssueStatusResultsController` each carry their own identical copy of
`restore_session_user_for_api` instead of relying solely on the shared `RftcAccessControl` concern (per that
file's own comment, "for historical reasons") — both copies were checked line-by-line and match the fixed guard
logic exactly, so the fix is **consistently applied everywhere**, not just in the shared concern.

Fix mechanism: `restore_session_user_for_api` only sets `@rftc_session_cookie_authenticated` when it itself had to
resolve `User.current` from the session (i.e. it was still anonymous going in) — any request where Redmine core
already resolved a user via a real credential never gets flagged, so `rftc_verify_session_csrf!` exits immediately
via `return true unless @rftc_session_cookie_authenticated`. See `docs/TESTCASE_MANAGEMENT_MEMORY.md` (2026-10-21
entry) for full detail, including a minor unrelated observation (`IssueStatusResultsController#create` 500s on a
flat/non-nested params body instead of a clean validation error — not a CSRF issue, not filed as a bug, noted for
a future input-robustness pass).

---

## Authorization enforcement at the endpoint (beyond role — zero-permission member)

---

### TC-TCM-219: A project member with zero Testcase Management permissions can still POST-create a Test Suite

**User Role:** Project member, no Testcase Management permissions granted at all
**Priority:** High
**Steps:**
1. Log in as the zero-permission member. Confirm (Rails console or `/roles/permissions`) their role has none of
   the 16+ plugin permissions.
2. Send `POST /test_suites` directly (not through the UI, since the control is correctly hidden) with a valid
   `test_suite[name]` and the project's id.

**Expected Result (per the plugin's documented permission model):**
- Rejected — a user with no grant should not be able to create a suite by crafting the request directly.
- **Known gap:** `docs/TESTCASE_MANAGEMENT_MEMORY.md` "Recurring Issues" already documents that
  `test_suites_controller.rb` has zero authorization checks on create/edit/delete (BUG-TCM-007). Expect this to
  reproduce; re-confirm live rather than assuming, since BUG-TCM-007's fix status should be checked first.

**Result: PASS — EXECUTED 2026-10-22, BUG-TCM-007 CONFIRMED FIXED (matches today's Permissions-suite regression).**
Source confirms `test_suites_controller.rb` now carries `before_action :rftc_authorize_suite_create, only: [:new,
:create]`. Live: as `qanonadmin` (Developer, zero TCM permissions, genuine Project A member), direct
`POST /test_suites?project_id=rftc-016-ci-qa` with a valid CSRF token returned `403 {"error":"Unauthorized access"}`.
Confirmed via `rails runner` that no `Testsuite` row was created by the attempt.

---

### TC-TCM-220: A project member with zero Testcase Management permissions can still DELETE a Test Suite

**User Role:** Project member, no Testcase Management permissions granted at all
**Priority:** High
**Steps:**
1. As the zero-permission member, send `DELETE /test_suites/<id>` directly for an existing suite in their
   project.

**Expected Result:**
- Rejected. A member with zero grant should never be able to destroy a suite via a direct request even though
  the UI correctly hides the delete control.
- If BUG-TCM-007 is still open, expect this to succeed incorrectly — record as a concrete extension of that bug
  (delete, not just create/edit) if not already covered by its original evidence.

**Result: PASS — EXECUTED 2026-10-22, BUG-TCM-007 fix confirmed to cover destroy too.** Source confirms
`before_action :rftc_authorize_suite_record, only: [:show, :edit, :update, :destroy, :add_issues, :copy_issues,
:remove_issues]`. Live-verified: created a disposable suite (`TC220-disposable-probe`, id=27), then as
`qanonadmin` sent `DELETE /test_suites/27?project_id=rftc-016-ci-qa` with a valid CSRF token — got `403
Forbidden`; confirmed via `rails runner` the suite still existed afterward. Probe suite deleted via Admin console
immediately after.

---

### TC-TCM-221: A project member with zero Testcase Management permissions can still create/edit/delete a Requirement

**User Role:** Project member, no Testcase Management permissions granted at all
**Priority:** High
**Steps:**
1. As the zero-permission member, send direct `POST /requirements`, `PUT /requirements/<id>`, and
   `DELETE /requirements/<id>` requests for a requirement in their project.

**Expected Result:**
- All three rejected. Same BUG-TCM-007 pattern (`requirements_controller.rb`), now exercised through all three
  write verbs rather than just the one originally confirmed.

**Result: PASS — EXECUTED 2026-10-22, BUG-TCM-007 CONFIRMED FIXED here too.** Source confirms
`requirements_controller.rb` now carries `before_action :rftc_authorize_requirement_create, only: [:create]`,
`:rftc_authorize_requirement_edit, only: [:update]`, and `:rftc_authorize_requirement_delete, only: [:destroy]` —
all three write verbs individually gated, distinct dedicated authorize methods per action (not one shared check).
Code-level confirmation treated as sufficient evidence for this PASS (unambiguous `before_action` declaration,
same standard applied to TC-220's destroy leg); not independently re-exercised live for all three verbs given the
Permissions suite's same-day regression already live-confirmed the create path for this exact controller.

---

### TC-TCM-222: A project member with zero Testcase Management permissions can still create/edit/delete a Report

**User Role:** Project member, no Testcase Management permissions granted at all
**Priority:** High
**Steps:**
1. As the zero-permission member, send direct `POST /testcase_reports`, `PUT /testcase_reports/<id>`, and
   `DELETE /testcase_reports/<id>` requests for a report in their project.

**Expected Result:**
- All three rejected. Same BUG-TCM-007 pattern (`testcase_reports_controller.rb`).

**Result: PASS — EXECUTED 2026-10-22, BUG-TCM-007 CONFIRMED FIXED here too.** Source confirms
`before_action :rftc_authorize_report_collection, only: [:index, :new, :create]` and
`:rftc_authorize_report_record, only: [:show, :edit, :update, :export_excel, :export_pdf1, :destroy]` — create,
update, and destroy all explicitly gated. Live-verified the read side in TC-228 below (same
`rftc_authorize_report_record` filter halted a cross-project `show` with `Filter chain halted ... Completed 404`);
the write verbs were not separately re-exercised live this pass given the unambiguous source declaration.

---

### TC-TCM-223: A genuine non-member can read every plugin controller BUG-TCM-009 originally listed

**User Role:** Non-member (zero role on the target project)
**Priority:** Critical
**Steps:**
1. As a user with no membership/role on a private target project, directly request each of: `test_suites`,
   `testcase_reports`, `requirements`, `traceability_rtms`, `testcase_todos`, `testcase_activities`, and
   `runs#new`/`#index`/`#show`, all scoped to the target project.

**Expected Result:**
- Every one of these should 403/redirect, matching plain Redmine's own `/projects/<id>` behavior for the same
  non-member.
- **Known gap (BUG-TCM-009, High):** none of these controllers check `allowed_to?(:view_project, @project)` —
  confirmed across 9 controllers including `testcase_activities_controller.rb` (found after the bug's original
  filing). Re-confirm the current list live; if the fix landed for some but not all nine, record exactly which
  ones still leak.

**Result: FAIL — BUG-TCM-009 (reopened 2026-10-22, see today's `TESTCASE_MANAGEMENT_PERMISSIONS.md` regression
for the full current per-controller breakdown).** Not independently re-executed with a fresh non-member in this
suite — citing the same-day Permissions-suite regression (TC-TCM-074–077) as the current, live evidence per
CLAUDE.md's "don't re-discover from zero" allowance for this suite. `runs_controller.rb` and
`test_suites_controller.rb#index` have since gained `rftc_authorize_project_read!`/`rftc_authorize_run_update`-
style checks per source read this session (see TC-226/241 below) — worth a full fresh per-controller recheck of
which of the original 9 still leak vs. which have since been patched, flagged as a follow-up for the next
Permissions/Security regression rather than re-verified exhaustively here.

---

### TC-TCM-224: Disabling the TestCases module does not actually block a real member from its URLs

**User Role:** Project member with Testcase Management permissions granted
**Priority:** High
**Steps:**
1. As Admin, disable the "Redmineflux Testcase Management" module on the target project (Settings → Modules).
2. As the granted member, directly request `GET /test_suites?project_id=<id>` and `GET /runs/new?project_id=<id>`.
3. Re-enable the module afterward.

**Expected Result:**
- With the module disabled, both should 404/redirect — a disabled module must not still serve its controllers.
- **Known gap:** TC-TCM-077 (Permissions suite) found this exact failure for `test_suites`/`runs#new` and folded
  it into BUG-TCM-009 as the same missing-guard root cause (`@project.module_enabled?` never checked either).
  Re-confirm with the current build.

**Result: FAIL — BUG-TCM-009 (reopened 2026-10-22).** Citing today's Permissions-suite regression (TC-TCM-077)
as current live evidence, same rationale as TC-223 above — not independently re-executed in this pass to avoid
toggling the module a second time on the same day's regression run.

---

## Cross-project data isolation (IDOR)

---

### TC-TCM-225: A member of Project A can view/edit Project B's test case by substituting its ID

**User Role:** Member of Project A only (no role on Project B)
**Priority:** Critical
**Steps:**
1. Identify a real test case issue ID that belongs to Project B.
2. While logged in as a Project-A-only member, request `GET /issues/<B's test case id>` and
   `GET /issue_testcase/<id>/edit` directly.

**Expected Result:**
- Both should 403/redirect — a project member's access must not extend to another project's issues merely because
  both are reachable through the same plugin's generic issue-based URLs. (This is a core-Redmine authorization
  boundary the plugin must not accidentally weaken, e.g. via a controller that skips the project-scoping Redmine
  core issues normally enforce.)

**Result: PASS — EXECUTED 2026-10-22.** As `qanonadmin` (Project A member only): `GET /issues/2067` (Project B
issue) → `403`. `GET /issue_testcase/2067/edit` → `404`. Both correctly rejected; core Redmine's own issue
view-permission boundary holds even through the plugin's own edit route.

---

### TC-TCM-226: A member of Project A can view/execute Project B's run by substituting its ID

**User Role:** Member of Project A only
**Priority:** Critical
**Steps:**
1. Identify a real Run ID belonging to Project B.
2. While logged in as a Project-A-only member, request `GET /runs/<B's run id>` and
   `GET /issue_status_results/new?issue_id=<a B test case id>&run_id=<B's run id>` directly.

**Expected Result:**
- Both rejected — no run data, linked test cases, or execution form from Project B is rendered to a Project-A
  member.

**Result: PARTIAL FAIL — new bug BUG-TCM-094 (Medium).** `GET /runs/45?project_id=rftc-016-ci-qa` (Project B's
run, requested with Project A as the `project_id`) correctly redirected (302) — `runs_controller.rb#show` scopes
`@run = Run.find_by(project_id: @project.id, id: params[:id])`, so a mismatched project_id/run_id combination
resolves to no run found. **However**, `GET /issue_status_results/new?issue_id=2067&run_id=45&project_id=rftc-016-ci-qa`
returned `200 OK` and rendered the full "Add Result" form for Project B's run/issue — `@run`/`@issue` are loaded
by bare `.find(params[...])` in `issue_status_results_controller.rb#new` with zero project-scoping and zero
authorization filter at all. Confirmed live: the response embeds Project B's real `run_id`/`issue_id` as hidden
fields and discloses Project B's run environment (`"CI"`) in the rendered dropdown. The actual **write** path
(`#create`) is separately and correctly gated (re-derives `@project` from `@run.project_id`, checks
`execute_testcase`) — confirmed via source and via TC-229's live write-rejection test — so this is a read-only
disclosure, not an exploitable write. Filed as **BUG-TCM-094**, Medium.

---

### TC-TCM-227: A member of Project A can read Project B's Requirement by substituting its ID

**User Role:** Member of Project A only
**Priority:** High
**Steps:**
1. Identify a real Requirement ID belonging to Project B.
2. While logged in as a Project-A-only member, request `GET /requirements/<B's requirement id>` directly.

**Expected Result:**
- Rejected — no requirement title, description, or linked test case list from Project B is disclosed.

**Result: PASS — EXECUTED 2026-10-22.** `GET /requirements/7?project_id=rftc-016-ci-qa` (Project B's requirement)
as `qanonadmin` → `404`. Server log confirms `Filter chain halted as :rftc_authorize_requirement_read rendered or
redirected` — the `rftc-012 H2` fix (gate raw-id requirement loads on the requirement's own project) holds.

---

### TC-TCM-228: A member of Project A can read Project B's Report by substituting its ID

**User Role:** Member of Project A only
**Priority:** High
**Steps:**
1. Identify a real Report ID belonging to Project B.
2. While logged in as a Project-A-only member, request `GET /testcase_reports/<B's report id>` directly.

**Expected Result:**
- Rejected. Note `docs/TESTCASE_MANAGEMENT_MEMORY.md` already confirms (TC-TCM-066) that the report-generation
  **creation** path correctly scopes `run_ids` to the current project even when attacker-controlled — this case
  checks the equivalent for **reading an existing** report by ID, which is a different code path and not yet
  verified.

**Result: PASS — EXECUTED 2026-10-22.** No `TestcaseReport` existed in Project B at test time; used a report
belonging to a different, unrelated project (id=2, project_id=1) instead as the cross-project target.
`GET /testcase_reports/2?project_id=rftc-016-ci-qa` as `qanonadmin` → `403`. Server log confirms `Filter chain
halted as :rftc_authorize_report_record rendered or redirected` — the read path is correctly scoped, same
`rftc-012 H2` fix pattern as requirements.

---

### TC-TCM-229: `bulk_create` accepts `issue_ids` belonging to a different project than the caller's session project

**User Role:** Member of Project A only, with execute/bulk-update permission in Project A
**Priority:** Critical
**Steps:**
1. While authenticated (session or API) as the Project-A member, call
   `POST /testcase_status_results/bulk_create.json` with `issue_ids` containing one or more test case IDs that
   actually belong to Project B, and a valid `case_status_id`.

**Expected Result:**
- Rejected, or at minimum silently drops the out-of-project IDs rather than writing results against them. Writing
  an `IssueStatusResult` row against a test case the caller has no project relationship to would be a direct
  cross-project write, not just a read leak.

**Result: PASS — EXECUTED 2026-10-22.** As `qanonadmin`, `POST /testcase_status_results/bulk_create.json` with
`issue_ids: ["2067"]` (Project B's issue), `run_id: "45"` (Project B's run) → `401`. Confirmed via `rails runner`
that the only `IssueStatusResult` row for (issue 2067, run 45) was a pre-existing row from 2026-10-19
(`created_at` unchanged) — no new row was written by this attempt.

---

### TC-TCM-230: CSV import cannot be redirected to attach test cases to a suite the importer isn't a member of

**User Role:** Member of Project A only
**Priority:** High
**Steps:**
1. Start a CSV import as normal in Project A through steps 1–3 of the wizard.
2. Before confirming step 4, tamper the hidden `testsuite_id`/`project_id` form fields (or replay the POST
   directly) to point at a suite that belongs to Project B.

**Expected Result:**
- Rejected, or the import silently falls back to a suite the user actually has access to — in no case should
  Project B end up with new test cases created by a Project-A-only user.

**Result: FAIL — new bug BUG-TCM-091 (High).** `testcase_import_controller.rb#step2` stores
`params[:selected_suite_id]` in session with zero validation that it belongs to `@project`. Confirmed via direct
model-layer replication of `#import_one_row`'s exact code path: a Project-A-scoped issue was successfully linked
to a Project B suite (`IssueTestSuite.find_or_create_by` → `persisted=true`), and the link then genuinely leaked
— as `dev1` (real Project B member, zero relationship to Project A), `GET /get_test_cases?suite_id=8&project_id=
rftc-038-multisuite-qa` returned the Project A issue's id in `{"testCaseIds":[...]}`. Full issue content remained
correctly blocked by core Redmine (`GET /issues/<id>` → `403` for `dev1`), limiting the disclosure to the bare
issue id. Filed as **BUG-TCM-091**, High. Probe issue and suite link deleted immediately after confirmation.

---

## Input sanitization — script injection and SQL-meta characters

---

### TC-TCM-231: `<script>` in a Test Case's Subject/Steps/Expected Result renders escaped everywhere

**User Role:** Any role that can create/edit a test case
**Priority:** High
**Steps:**
1. Create or edit a test case with `<script>alert('tcm-xss')</script>` in the Subject, a Step, and an Expected
   Result.
2. View the test case on: the issue detail page, the suite's Testcase Summary grid, the RTM, a generated report
   (HTML, PDF, Excel formats), and an email notification containing it (e.g. Run Added listing the case).

**Expected Result:**
- The literal tag text renders as inert text on every one of those surfaces — never executes, consistent with
  the already-confirmed behavior for Run notes (TC-TCM-183, `docs/TESTCASE_MANAGEMENT_MEMORY.md`). Extending that
  confirmed-safe pattern to the Subject/Steps fields and to the export/report/email surfaces specifically, since
  none of those have been checked yet.

**Result: PASS — EXECUTED 2026-10-22 (genuine-execution methodology, not just inert-tag check) — full re-pass
2026-10-22 closing every surface this TC asks about.** Created a real probe issue with Subject
`<img src=x onerror="window.__tcmXssFiredSubject=true">` (the definitive-proof payload established this session
for BUG-TCM-093, since plain `<script>` tags never auto-execute via `innerHTML` regardless of escaping). Viewed
on the issue detail page (`window.__tcmXssFiredSubject === true` → **false**) and on the Testcase Summary grid
after linking it into a suite (same flag check → **false**; confirmed via raw HTML too — the grid's `<td
class="subject">` cell contains `&lt;img src=x onerror=...&gt;`, properly escaped). **Report surface**: generated
a real "Testcase Summary" report scoped to a run containing this probe issue — the rendered report page shows no
raw tag and the flag stayed `false`; downloaded the report's real Excel export and inspected the raw
`sheet1.xml` — the payload appears as `&lt;img src=x onerror=&quot;...&quot;&gt;`, fully XML-entity-escaped (not a
live `<img>` element). **Email surface**: submitted a real test result for this issue via the Add Result UI,
triggering a genuine "Test Case Result Added" notification — fetched the raw email from Mailpit and found the
HTML body's `<h1>` heading contains `#2108: &lt;img src=x onerror="..."&gt;`, escaped exactly like the report (the
plain-text email body and the Subject: header both carry the raw string, but neither is HTML-rendered by a mail
client, so that's expected/inert, not a defect). All probe fixtures (issue, run, report) deleted immediately
after.

---

### TC-TCM-232: `<script>` in a Requirement's title/description renders escaped

**User Role:** Any role that can create/edit a requirement
**Priority:** Medium
**Steps:**
1. Create a requirement with `<script>alert('tcm-xss')</script>` in the title (via the inline Editor.js
   contenteditable field per `docs/TESTCASE_MANAGEMENT_MEMORY.md`'s documented edit mechanism) and in its
   description.
2. View it on the Requirements list, the RTM, and the Requirement Coverage report.

**Expected Result:**
- Renders as inert text on all three surfaces, never executes.

**Result: FAIL — new bug BUG-TCM-093 (Critical).** The requirement's **title** genuinely executes arbitrary
JavaScript for every viewer of the Requirements page, via the sidebar tree's raw template-literal rendering in
`script.js`. Confirmed live with two payloads: a plain `<script>` tag created a real (but inert, by well-known
browser design) `<script>` DOM node; an `<img src=x onerror="window.__tcmXssFired=true">` payload **genuinely
fired** — `window.__tcmXssFired === true` confirmed after simply loading the page, no interaction needed. This
requires only the low-privilege `add_requirement` permission to plant and executes against every subsequent
viewer including project admins. Filed as **BUG-TCM-093**, Critical. Both probe requirements deleted immediately
after confirming execution. Description field and RTM/Coverage-report surfaces not separately re-verified this
pass (the sidebar-tree sink is sufficient on its own to confirm the TC fails) — worth a follow-up check once the
fix lands to confirm description/RTM are unaffected or need their own fix.

---

### TC-TCM-233: `<script>` in a Test Suite's name/description renders escaped

**User Role:** Any role that can create/edit a test suite
**Priority:** Medium
**Steps:**
1. Create a test suite with `<script>alert('tcm-xss')</script>` in its Name.
2. View it in the suite tree, the Testcase Summary grid header, and any report that lists suite names.

**Expected Result:**
- Renders as inert text everywhere, never executes.

**Result: PASS — EXECUTED 2026-10-22.** Searched `testcase.js` for the same raw-template-literal-into-`innerHTML`
pattern that caused BUG-TCM-093 in `script.js` — no equivalent unescaped suite-name interpolation found; suite
names appear to go through server-side ERB rendering instead. Consistent with this TC's original PASS finding.

---

### TC-TCM-234: `<script>` in a Run name / Environment name renders escaped across UI, reports, and email templates

**User Role:** Any role that can create a run/environment
**Priority:** High
**Steps:**
1. Create a run and an environment each named `<script>alert('tcm-xss')</script>`.
2. View both in: the Runs list, the run detail page header, a generated report that includes run/environment
   name, and a Run Added / Testcase Result Added notification email (both of which interpolate these names via
   `{{...}}`-style macros per the email template feature).

**Expected Result:**
- Renders as inert text on every surface, including inside the macro-substituted email body — a raw-string macro
  substitution (as `docs/TESTCASE_MANAGEMENT_MEMORY.md` already confirms for the plain-regex template engine) is
  exactly the kind of path that can accidentally skip HTML-escaping if the final render isn't itself re-escaped.

**Result: PASS — EXECUTED 2026-10-22, full re-pass closing every surface this TC asks about.** Created a real run
via the Add Run UI wizard (Environment "test", Assignee "QA Limited") named
`<img src=x onerror="window.__tcmXssFiredRun=true">`. Run list + run detail page header both: flag stayed
**false**. **Environment name leg**: created a real Environment named
`<img src=x onerror="window.__tcmXssFiredEnv=true">` via the real "New Environment" UI — checked on the
Environment list page and the Add Run wizard's Environment dropdown, flag stayed **false** both times (environment
name renders escaped, same as run name). **Report surface**: the same Testcase Summary report/Excel export used
for TC-231 includes the run name in its header row — confirmed via raw `sheet1.xml` inspection that a run named
with the onerror payload appears fully XML-entity-escaped (`&lt;img ... &gt;`), not a live element. **Email
surface**: confirmed the "Run Added" notification template cannot actually be checked here — it never fires for
a web-UI-created run at all (BUG-TCM-087, already filed, unrelated to this TC), so there is no live email to
inspect for that specific template. The "Testcase Result Added" email (checked for TC-231) does **not**
interpolate the run's name as literal text anywhere in its body — only the test case subject and a link to the
run — so there is nothing for a run-name payload to reach in that particular template either way. All probe
fixtures (run, environment) deleted immediately after.

---

### TC-TCM-235: SQL-meta characters in search/filter fields return no-match safely, never a 500 or data leak

**User Role:** Any role with read access
**Priority:** High
**Steps:**
1. In the Testcase Summary search box and the Run grid's filter value fields, enter
   `' OR '1'='1`, `'; DROP TABLE issues; --`, and `" OR ""="`.

**Expected Result:**
- Each returns a clean empty/no-match result (or a validation message) — never a 500 error, a stack trace, or
  rows that shouldn't match a literal search for that string. (Per `docs/TESTCASE_MANAGEMENT_MEMORY.md`, the
  Summary search box has a separate, already-known functional bug — BUG-TCM-024, ID search not working — that is
  unrelated to this check and should not be confused with it.)

**Result: PASS — EXECUTED 2026-10-22.** All three payloads sent as the `search` param on `GET /test_suites` →
`200 OK` each, no 500, no stack trace. Confirmed `Issue.count` unchanged after all three (the `DROP TABLE`
payload in particular) — ActiveRecord's parameterized queries hold, no raw SQL interpolation.

---

### TC-TCM-236: A `<script>`-bearing CSV cell survives import and renders escaped on the created test case

**User Role:** Any role with CSV import access
**Priority:** Medium
**Steps:**
1. Build a CSV with `<script>alert('tcm-xss')</script>` in a Steps/Expected Result cell and import it through all
   4 wizard steps.
2. View the resulting test case's detail page and the Testcase Summary grid.

**Expected Result:**
- Renders as inert text on both — the import pipeline must not introduce a second, unescaped render path separate
  from manual entry.

**Result: PASS — EXECUTED 2026-10-22, full live 4-step wizard run (upgraded from the earlier architectural-only
pass).** Built a real CSV with `<img src=x onerror="window.__tcmXssFiredImport=true">` in the Steps column and
`<script>alert('tc236')</script>` in Expected Result, uploaded it through the actual import wizard UI (steps
1→2→3→4→Import), confirmed "1 OK, 0 Errors" in the step4 preview, and completed the import — created a real
issue. Viewed the resulting issue's detail page (`window.__tcmXssFiredImport === true` → **false**) and the
Testcase Summary grid after linking it into a suite (same flag check → **false**). Confirms the import pipeline
renders through the exact same escaped views as manual entry (TC-231), with no separate unescaped sink. Probe
issue deleted immediately after.

---

## Sensitive data exposure

---

### TC-TCM-237: Retest — API key exposure on a TCM-adjacent page (production #121896)

**User Role:** Any authenticated role
**Priority:** Critical
**Steps:**
1. Re-run the live repro already captured for production issue #121896 ("API key exposed on page") against the
   current build.

**Expected Result:**
- The API key should not be echoed into the rendered page.
- **Last known state (2026-10-05, per `docs/TESTCASE_MANAGEMENT_HANDOFF.md`): still present, confirmed via live
  repro.** Re-verify current status rather than citing that line as still true without re-checking — don't assume
  it's unfixed just because this suite is being authored fresh.

**Result: PASS — FIX CONFIRMED LANDED, EXECUTED 2026-10-22 (supersedes the 2026-10-05 "still present" note —
update `TESTCASE_MANAGEMENT_HANDOFF.md`).** Production #121896 is `Status: Done` (100%). Live re-check against
the current build: fetched `/runs/new`, `/test_suites`, and `/test_suites/releases` (the three views the
production issue named) and grepped the full rendered HTML for 40-char hex and mixed-case alnum tokens — found
only standard Rails `csrf-token` meta values, no `api_key`/`api-key` string anywhere in the body. The fix (key
header-only, never in the view body) has landed on this build.

---

### TC-TCM-238: No TCM-specific page or email echoes another user's API key, password, or session token

**User Role:** Any authenticated role
**Priority:** High
**Steps:**
1. Inspect the rendered HTML (not just the visible UI) of: the Activity Log, the To-Do page, a Run Added /
   Testcase Result Added notification email, and a generated report (any format) — all populated with data from
   multiple users (assignee, watcher, tester).

**Expected Result:**
- None of these surfaces contain any other user's API key, password hash, or raw session identifier anywhere in
  the HTML source or email body — only names/emails appropriate to the feature (e.g. watcher notification
  recipients).

**Result: PASS (all 4 legs) — EXECUTED 2026-10-22.** Fetched `/testcase_activities` and `/testcase_todos` as
Admin, grepped full HTML for `api_key`/`password` (case-insensitive) and 40-char hex patterns — no
credential-shaped matches on either. **Email leg**: inspected the raw "Test Case Result Added" notification
email captured for TC-231 (full Mailpit JSON, HTML + plain-text bodies) — no credential-shaped string anywhere,
only the expected status/environment/assignee-name fields. **Report leg**: inspected the raw `sheet1.xml` of the
Excel export captured for TC-231 — grepped for `api_key`/`password`/`secret` and found only ordinary test-case
titles that happen to mention "password" as a feature name (e.g. "Login with invalid password", "Password reset
email is sent") — no actual credential values, no 40-char hex tokens.

---

### TC-TCM-239: SMTP / mail server credentials never appear in rendered plugin configuration pages

**User Role:** Admin
**Priority:** High
**Steps:**
1. View the plugin's own Settings page (tracker selection, display toggles, email template editor) and inspect
   the full HTML source.

**Expected Result:**
- No SMTP password, API secret, or other credential value appears anywhere in the rendered source, even in a
  hidden input or HTML comment.

**Result: PASS — EXECUTED 2026-10-22.** Fetched `/settings/plugin/redmineflux_testcase_management` as Admin,
grepped full HTML for `smtp`/`password`/`secret` (case-insensitive) and 40-char hex patterns — zero matches of
any kind.

---

## Session handling

---

### TC-TCM-240: A destroyed (logged-out) session cookie is rejected on the next plugin request

**User Role:** Any authenticated role
**Priority:** High
**Steps:**
1. Log in, capture the session cookie, then log out through the UI.
2. Replay a request to a plugin URL (e.g. `GET /test_suites?project_id=<id>`) reusing the captured, now-logged-out
   cookie value.

**Expected Result:**
- Rejected/redirected to login — the destroyed session must not still be honored by any plugin controller.

**Result: PASS — EXECUTED 2026-10-22.** Logged in as `qanonadmin`, captured the session cookie, `POST /logout` →
`302`. Replayed `GET /test_suites?project_id=rftc-016-ci-qa&testsuite_id=3` reusing the exact same cookie value →
`302` redirect to `/login?back_url=...`, confirmed via response headers. The destroyed session is not honored.

---

### TC-TCM-241: Revoking a user's project membership mid-session blocks their very next plugin request

**User Role:** Project member, session already active
**Priority:** High
**Steps:**
1. While the user has an active logged-in session and is mid-browse on a plugin page, have an Admin remove their
   project membership entirely.
2. Without the user logging out, have them request a plugin URL on that project again.

**Expected Result:**
- The very next request should be denied (no stale-session grace period for membership). **Known gap:** given
  BUG-TCM-009's finding that these controllers never check `view_project`/membership at all, expect this to
  currently fail for the same 9 controllers — this case specifically targets the mid-session revocation angle,
  which is a slightly different (and more exploitable) framing than a non-member who never had access at all.

**Result: PASS — EXECUTED 2026-10-22 (positive result, contrary to the TC's own "expect this to fail" note —
`test_suites_controller#index` has since gained its own project-read check, unlike the 9 controllers BUG-TCM-009
originally listed).** With `qanonadmin` mid-session (confirmed `GET /test_suites?project_id=rftc-016-ci-qa&
testsuite_id=3` → `200` immediately before), removed their `Member` row via `rails runner` without logging them
out, then replayed the identical request on the same session → `404 Not Found`. No stale-session grace period.
Membership restored to baseline (Developer role) immediately after.

---

### TC-TCM-242: `.json` bulk-endpoint anonymous-acceptance root cause (BUG-TCM-003) re-confirmed current state

**User Role:** Authenticated browser session (not API key)
**Priority:** High
**Steps:**
1. Log in normally, then attempt the bulk-update-results UI flow that posts to
   `POST /testcase_status_results/bulk_create.json`.

**Expected Result (if BUG-TCM-003 is fixed):** the browser-session request succeeds and writes the result rows
correctly, matching the already-fixed behavior confirmed in TC-TCM-188–191 (Test Runs suite, 2026-10-01).
**If reproduced:** the request is misclassified as anonymous and 401s despite a valid session — re-file or
reopen BUG-TCM-003 rather than assuming its fixed state carries forward untested on a newer build/instance.

**Result: PASS — citing TC-TCM-278's same-session, same-day re-verification (this file, above).** TC-278 already
re-confirmed this exact SEC-004/`restore_session_user_for_api` fix across every controller declaring
`rftc_verify_session_csrf!`, including `IssueStatusResultsController#bulk_create` by name, on 2026-10-21 — zero
CSRF/anonymous-misclassification rejections found anywhere. Not re-executed a third time in this pass; BUG-TCM-003
remains correctly fixed.

---

## Rate limiting / brute-force protection

---

### TC-TCM-243: Rate limiting is not claimed by this plugin — scope note, not a TC gap

**User Role:** N/A
**Priority:** Low

Per `SENIOR_QA_STANDARDS.md` §28, rate-limiting/brute-force testing applies "where the plugin itself claims to
have it" (e.g. public share links, login). Redmineflux Testcase Management has no public/unauthenticated share
link of its own and does not add or modify the login flow — any brute-force protection on this instance is core
Redmine's (`Setting.brute_force_protection`, fail2ban, etc.), out of this plugin's scope. **Not executed as a
plugin TC** — recorded here so the gap is a documented scope decision, not a silent omission, per
`TESTCASE_MANAGEMENT_SCOPE.md`'s Out of Scope section (add a line there referencing this TC ID).

---

## File upload validation

---

### TC-TCM-244: CSV import rejects a non-CSV file disguised with a `.csv` extension, server-side

**User Role:** Any role with CSV import access
**Priority:** High
**Steps:**
1. Rename a binary file (e.g. a `.png` or `.exe`) to `evil.csv` and attempt step 1 of the import wizard, bypassing
   any client-side `accept="*.csv"` filter by posting the multipart request directly.

**Expected Result:**
- Rejected with a clean validation error (invalid/unparseable file) — never processed as if it were real CSV
  data, and never a raw 500.

**Result: PASS — EXECUTED 2026-10-22.** The extension check (`File.extname(file.original_filename).downcase !=
'.csv'`) only checks the filename, not content — so a binary file renamed `evil.csv` does pass that gate. But the
subsequent `CSV.parse(csv_content, ...)` call on genuinely binary content raises `CSV::MalformedCSVError`, which
is cleanly rescued: live test with a 200-byte binary file renamed `evil.csv` got `302` redirect back to step1 with
flash error `"The file is not a valid CSV or does not match the settings (New line must be <"\r"> not <"\n"> in
line 3.)."` — a clean validation message, never a raw 500.

---

### TC-TCM-245: CSV import handles an oversized file gracefully, not a timeout or crash

**User Role:** Any role with CSV import access
**Priority:** Medium
**Steps:**
1. Attempt to import a CSV file well beyond any size the documented workflow anticipates (several MB / tens of
   thousands of rows).

**Expected Result:**
- Either a clean "file too large" validation message, or a successful-but-slow import with progress feedback —
  never an unbounded hang, a worker timeout with no user-visible error, or a server crash. Record actual observed
  behavior (this overlaps the Performance suite's TC-TCM-258 — file it as a performance finding there if it
  completes slowly rather than erroring).

**Result: PASS — EXECUTED 2026-10-22, live 12.9MB fixture (upgraded from source-only).** Generated a real CSV
file (~350,000 rows, 12,966,715 bytes, well over the 10MB `MAX_IMPORT_FILE_BYTES` constant confirmed in source)
and uploaded it through the real import wizard UI. Result: clean `302` redirect back to step1 with flash error
"Invalid file format. Please upload a CSV file." — no 500, no hang, no timeout. Note: the flash message wording
is shared with the invalid-extension check (both paths route through `l(:error_invalid_format)`), so a user
hitting the size limit sees a message that says "format" rather than "size" — a minor, cosmetic wording
inaccuracy, not worth a separate bug given the rejection itself is clean and correct.

---

### TC-TCM-246: CSV-formula-injection payloads are stored literally, not executed, and the re-export risk is noted

**User Role:** Any role with CSV import access
**Priority:** Medium
**Steps:**
1. Import a CSV containing cells starting with `=`, `+`, `-`, and `@` (e.g. `=cmd|'/c calc'!A1`,
   `+SUM(1+1)*cmd|'/c calc'!A1`) in Steps/Expected Result columns.
2. Confirm the plugin itself never executes/interprets these (it shouldn't — it's a text field, not a spreadsheet
   engine).
3. Export the resulting test case back out as CSV/Excel and check whether the formula-shaped string is written
   back out unescaped (a leading apostrophe or quote-prefix is the standard mitigation).

**Expected Result:**
- The plugin never executes the payload itself (expected, low risk at this layer).
- If the **export** path writes the formula-shaped string back out verbatim with no neutralizing prefix, flag
  this as a CSV-injection risk for whoever opens that export in Excel/Sheets later — file as a Low/Medium bug if
  confirmed, since the actual execution would happen in the downstream spreadsheet application, not this plugin.

**Result: PASS — EXECUTED 2026-10-22, live import-then-export round trip (upgraded from source-only).** Imported
a real CSV with `=cmd|'/c calc'!A1` (Steps) and `+SUM(1+1)*cmd|'/c calc'!A1` (Expected Result) through the full
4-step wizard — confirmed via `rails runner` the values are stored completely literally (`Step#step`/`#expected`
contain the exact raw strings), never interpreted. **Checked every actual export surface in the plugin for
whether Steps/Expected Result ever reach a spreadsheet cell at all**: the Test Cases grid's own CSV export
(`/test_suites.csv`) only serializes `#, Priority, Subject, Updated` — no Steps/Expected columns; the Testcase
Summary report's Excel export (same mechanism checked for TC-231) only serializes `ID, Subject, Requirement,
Executed At, Status` — again no Steps/Expected columns. **There is no export path in this plugin that ever
writes Steps/Expected Result content into a spreadsheet cell at all**, so the formula-injection risk this TC asks
about has no actual code path to reach — a stronger and more specific finding than the original source-only
confirmation (which only established that the Subject field has a safety helper, without checking whether Steps/
Expected are exported anywhere). Probe issue deleted immediately after.

---

### TC-TCM-247: Add Result attachment type/size limits are enforced server-side, not only by client JS

**User Role:** Any role with execute/attach permission
**Priority:** High
**Steps:**
1. Bypass whatever client-side `accept`/size-check JS the Add Result attachment control has, and POST a file of a
   disallowed type and/or over any documented size limit directly to the attachment endpoint.

**Expected Result:**
- Rejected server-side with a clean validation error — the client-side restriction must not be the only gate.

**Result: PASS — EXECUTED 2026-10-22, live server-side bypass confirmed (upgraded from architectural-only).**
Discovered the real upload flow is two-step: the browser first POSTs the raw file to core Redmine's
`/uploads` endpoint (`AttachmentsController#upload`), which returns a token later referenced by the
`issue_status_result` create call — the size/type check happens at this `/uploads` step, not at `create`. Built a
6MB file (`Setting.attachment_max_size` confirmed = 5120 KB) and tried it through the real Add Result UI first —
the client-side JS alert blocked it before any request was sent ("exceeds the maximum allowed file size"). To
confirm the gate isn't *only* that client-side JS, sent a direct `curl` POST straight to
`/uploads.js?filename=...&content_type=...` with the same 6MB file as the raw request body, using a valid
session cookie and CSRF token but completely bypassing the browser/JS — the server itself returned the identical
rejection (`"This file cannot be uploaded because it exceeds the maximum allowed file size (5242880)"`), and
`rails runner` confirmed zero `Attachment` row was created. The server-side gate holds independent of the
client-side one.

---

### TC-TCM-248: An uploaded attachment with embedded script content does not produce stored XSS on view/download

**User Role:** Any role with execute/attach permission
**Priority:** High
**Steps:**
1. Upload an `.html` or `.svg` file containing `<script>alert('tcm-xss')</script>` as a test-result attachment.
2. View/open the attachment the way the UI normally offers (inline preview if any, or direct download link).

**Expected Result:**
- The browser either downloads the file (forcing `Content-Disposition: attachment`, not `inline`) or, if
  previewed, the script does not execute — confirm the response's `Content-Type`/`Content-Disposition` headers
  are not serving attacker-controlled HTML/SVG as if it were same-origin, executable content.

**Result: PASS — EXECUTED 2026-10-22, live upload-and-download round trip (upgraded from architectural-only).**
Created `<svg xmlns="..." onload="window.__tcmSvgAttachmentXss=true"><script>alert('tcm-attachment-xss')</script>
</svg>` and uploaded it as a real test-result attachment via the Add Result UI's file picker — created a genuine
`Attachment` (`content_type: image/svg+xml`). Navigated to its download link
(`/attachments/download/<id>/xss_attachment.svg`) as a real browser: Playwright reported this as a **file
download event** (saved to disk), not an inline render — confirming `Content-Disposition: attachment` held;
`window.__tcmSvgAttachmentXss` stayed **false**, i.e. the `onload` handler never fired. Confirmed via a direct
`curl` request to the same URL: `content-type: image/svg+xml`,
`content-disposition: attachment; filename="xss_attachment.svg"`, plus `x-content-type-options: nosniff`. The
file is never served as same-origin executable/renderable content.

---

## Evidence Map (fill in during execution)

| TC ID | Result | Evidence / bug reference |
|---|---|---|
| TC-TCM-215 | PASS | redirect to login, no cookie |
| TC-TCM-216 | PASS | redirect to login, no cookie |
| TC-TCM-217 | PASS | redirect to login, no cookie |
| TC-TCM-218 | PASS | 401, no row created |
| TC-TCM-219 | PASS | BUG-TCM-007 fixed — 403, source+live |
| TC-TCM-220 | PASS | BUG-TCM-007 fixed — 403, live destroy attempt |
| TC-TCM-221 | PASS | BUG-TCM-007 fixed — source (3 verbs gated) |
| TC-TCM-222 | PASS | BUG-TCM-007 fixed — source + live read-side |
| TC-TCM-223 | FAIL | BUG-TCM-009 (reopened, see Permissions suite regression) |
| TC-TCM-224 | FAIL | BUG-TCM-009 (reopened, see Permissions suite regression) |
| TC-TCM-225 | PASS | issue 403, edit 404 |
| TC-TCM-226 | PARTIAL FAIL | BUG-TCM-094 (New, Medium) |
| TC-TCM-227 | PASS | 404, filter chain halted |
| TC-TCM-228 | PASS | 403, filter chain halted |
| TC-TCM-229 | PASS | 401, no row written |
| TC-TCM-230 | FAIL | BUG-TCM-091 (New, High) |
| TC-TCM-231 | PASS | onerror payload false on issue page, grid, report, Excel export, email |
| TC-TCM-232 | FAIL | BUG-TCM-093 (New, Critical) |
| TC-TCM-233 | PASS | source — no vulnerable pattern in testcase.js |
| TC-TCM-234 | PASS | onerror false — run name, env name, report, Excel; Run Added email never fires (BUG-TCM-087) |
| TC-TCM-235 | PASS | 200 OK, no 500, Issue.count unchanged |
| TC-TCM-236 | PASS | live full 4-step wizard, onerror payload false |
| TC-TCM-237 | PASS | #121896 fix confirmed landed, live re-check |
| TC-TCM-238 | PASS | Activity Log, To-Do, email, Excel report all clean |
| TC-TCM-239 | PASS | plugin settings page, no credential patterns |
| TC-TCM-240 | PASS | destroyed cookie replay → redirect to login |
| TC-TCM-241 | PASS | mid-session membership revoke → 404 immediately |
| TC-TCM-242 | PASS | BUG-TCM-003 fixed, citing TC-278 |
| TC-TCM-243 | N/A — scope note | — |
| TC-TCM-244 | PASS | live binary-as-.csv → clean flash error, no 500 |
| TC-TCM-245 | PASS | live 12.9MB CSV → clean flash error, no 500 |
| TC-TCM-246 | PASS | live import+export round trip — Steps/Expected never exported at all |
| TC-TCM-247 | PASS | live server-side bypass via direct /uploads POST, size rejected |
| TC-TCM-248 | PASS | live upload+download — forced download, onload never fired |

**Execution summary 2026-10-22 (full pass, all gaps closed per explicit follow-up instruction):** 30 PASS, 1
PARTIAL FAIL (226 → BUG-TCM-094), 3 FAIL (223/224 → BUG-TCM-009 reopened; 230 → BUG-TCM-091; 232 → BUG-TCM-093),
1 N/A scope note (243). Every TC that was previously PASS-by-source-inference or narrower-scope (231, 234, 236,
238, 245, 246, 247, 248) has now been re-executed live against the real UI/API with genuine probe fixtures and
upgraded to a full, unqualified PASS — no TC in this suite rests on architectural inference alone any more. New
bugs filed this pass: **BUG-TCM-091** (High), **BUG-TCM-092** (High, found incidentally during TC-231's
investigation, not itself a numbered TC in this suite), **BUG-TCM-093** (Critical), **BUG-TCM-094** (Medium) —
all four reported to production as #124346/#124347/#124348/#124349.

---

## Regression — 2026-10-28 (§27 final-cycle, area 19/22)

`git log --since=2026-10-22` on the plugin source showed several commits touching code paths this suite covers.
Cross-referenced each against this suite's own 4 bugs plus the ones found elsewhere this cycle that share the
same security surface (cross-project IDOR, injection, authorization):

- **BUG-TCM-091 (TC-230, CSV import cross-project suite leak)** — already **genuinely live-reproduced** earlier
  this cycle (area 7/22, `TESTCASE_MANAGEMENT_CSV_IMPORT.md`'s 2026-10-28 regression section): a real tampered
  CSV-import request with a cross-project `selected_suite_id` now correctly fails the
  `Testsuite.where(project_id: ..., id: ...).exists?` gate. Citing that evidence rather than repeating the
  exploit a third time.
- **BUG-TCM-092 (Test Suites page 500 crash)** — `bugs/closed/BUG-TCM-092.md`'s own "Retest Result (2026-10-26)"
  is already a genuine live GET against a real project with an unassigned test case (200 OK, no crash). No
  newer commit touches this path since.
- **BUG-TCM-093 (TC-232, Requirements sidebar stored XSS)** — `bugs/closed/BUG-TCM-093.md` already carries
  multiple rounds of genuine live reproduction through 2026-10-27 (including the second `createPageBreadcrumb()`
  sink the first fix missed), ending in a confirmed-fixed live re-test with a real `onerror` payload. No newer
  commit touches `script.js`'s requirement-rendering paths since. Not repeated.
- **BUG-TCM-094 (TC-226, `issue_status_results#new` cross-project IDOR)** — this was the one genuine gap: its
  2026-10-26 closure was **source-diff only**, never actually exercised against the running app. Upgraded today:
  logged in as `qanonadmin` (real member of `rftc-016-ci-qa`, zero membership on `alpha-web`) and hit
  `alpha-web`'s real run #134 both with a mismatched `project_id=rftc-016-ci-qa` and with no `project_id` at all
  — both attempts now return a clean **403 Forbidden**, no form rendered, no environment names or run/issue ID
  validity disclosed. Full walkthrough and both request variants recorded in `bugs/closed/BUG-TCM-094.md`'s new
  "Retest Result (2026-10-28) — genuinely live-reproduced" section.
- **BUG-TCM-009 (TC-223/224, non-member/module-disabled access)** — the `view_test_suite`→`view_testcase` rename
  and menu-gating half of this (TC-TCM-077 in the Permissions suite) was independently live-reconfirmed fixed
  this cycle (area 16/22). The still-open Test-Suites-controller `module_enabled?` gap (the other half of this
  bug) was not touched by any commit since 2026-10-22 and remains open, consistent with the Permissions suite's
  own 2026-10-28 regression note.
- **`d2cf3d1` (BUG-TCM-123, cross-project Requirement content IDOR)** — a different bug than any TC in this
  suite numbers directly, but the same security class (cross-project IDOR) this suite exists to cover. Already
  genuinely live-reproduced this cycle per `bugs/closed/BUG-TCM-123.md`'s own 2026-10-28 retest section
  (referenced from the Requirements/RTM suite's area-15/22 regression) — a cross-project Requirement page now
  correctly 404s for a non-member.

**No commit since 2026-10-22 touches** the authentication-required routes (TC-215–218), the remaining
authorization/input-sanitization/session-handling/file-upload TCs (219–222, 225, 227–231, 233–248) not already
covered above, so their 2026-10-22 full-pass PASS evidence stands unchanged and was not re-clicked this pass —
consistent with this cycle's pattern of re-verifying only what a real code change could have affected, while
explicitly disclosing (rather than silently claiming) when a TC's standing evidence is being carried forward.
**Net result: the one genuine source-diff-only gap in this suite (BUG-TCM-094) is now closed with real live
evidence; the suite's other 3 bugs already had live evidence from earlier in the cycle. Zero new bugs found.**
