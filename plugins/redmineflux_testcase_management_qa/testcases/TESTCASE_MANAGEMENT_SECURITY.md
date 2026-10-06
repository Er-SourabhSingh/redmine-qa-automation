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

---

### TC-TCM-216: Unauthenticated access to Run list/detail/execution pages is blocked

**User Role:** Anonymous
**Priority:** High
**Steps:**
1. Without logging in, request `GET /runs?project_id=<id>`, `GET /runs/<id>`, and
   `GET /issue_status_results/new?issue_id=<id>` directly.

**Expected Result:**
- All three redirect to login; no run data, test case list, or execution form is rendered to an anonymous request.

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

---

### TC-TCM-222: A project member with zero Testcase Management permissions can still create/edit/delete a Report

**User Role:** Project member, no Testcase Management permissions granted at all
**Priority:** High
**Steps:**
1. As the zero-permission member, send direct `POST /testcase_reports`, `PUT /testcase_reports/<id>`, and
   `DELETE /testcase_reports/<id>` requests for a report in their project.

**Expected Result:**
- All three rejected. Same BUG-TCM-007 pattern (`testcase_reports_controller.rb`).

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

---

### TC-TCM-227: A member of Project A can read Project B's Requirement by substituting its ID

**User Role:** Member of Project A only
**Priority:** High
**Steps:**
1. Identify a real Requirement ID belonging to Project B.
2. While logged in as a Project-A-only member, request `GET /requirements/<B's requirement id>` directly.

**Expected Result:**
- Rejected — no requirement title, description, or linked test case list from Project B is disclosed.

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

---

### TC-TCM-233: `<script>` in a Test Suite's name/description renders escaped

**User Role:** Any role that can create/edit a test suite
**Priority:** Medium
**Steps:**
1. Create a test suite with `<script>alert('tcm-xss')</script>` in its Name.
2. View it in the suite tree, the Testcase Summary grid header, and any report that lists suite names.

**Expected Result:**
- Renders as inert text everywhere, never executes.

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

---

### TC-TCM-247: Add Result attachment type/size limits are enforced server-side, not only by client JS

**User Role:** Any role with execute/attach permission
**Priority:** High
**Steps:**
1. Bypass whatever client-side `accept`/size-check JS the Add Result attachment control has, and POST a file of a
   disallowed type and/or over any documented size limit directly to the attachment endpoint.

**Expected Result:**
- Rejected server-side with a clean validation error — the client-side restriction must not be the only gate.

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

---

## Evidence Map (fill in during execution)

| TC ID | Result | Evidence / bug reference |
|---|---|---|
| TC-TCM-215 | | |
| TC-TCM-216 | | |
| TC-TCM-217 | | |
| TC-TCM-218 | | |
| TC-TCM-219 | | likely BUG-TCM-007 |
| TC-TCM-220 | | likely BUG-TCM-007 |
| TC-TCM-221 | | likely BUG-TCM-007 |
| TC-TCM-222 | | likely BUG-TCM-007 |
| TC-TCM-223 | | likely BUG-TCM-009 |
| TC-TCM-224 | | likely BUG-TCM-009 |
| TC-TCM-225 | | |
| TC-TCM-226 | | |
| TC-TCM-227 | | |
| TC-TCM-228 | | |
| TC-TCM-229 | | |
| TC-TCM-230 | | |
| TC-TCM-231 | | |
| TC-TCM-232 | | |
| TC-TCM-233 | | |
| TC-TCM-234 | | |
| TC-TCM-235 | | |
| TC-TCM-236 | | |
| TC-TCM-237 | | #121896 |
| TC-TCM-238 | | |
| TC-TCM-239 | | |
| TC-TCM-240 | | |
| TC-TCM-241 | | likely BUG-TCM-009 |
| TC-TCM-242 | | BUG-TCM-003 |
| TC-TCM-243 | N/A — scope note | — |
| TC-TCM-244 | | |
| TC-TCM-245 | | |
| TC-TCM-246 | | |
| TC-TCM-247 | | |
| TC-TCM-248 | | |
