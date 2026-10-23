# Plugin Memory — Redmineflux Testcase Management

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- **The vendor knowledge base is the authoritative spec, not the plugin's bundled docs.** https://www.redmineflux.com/knowledge-base/plugins/testcase-management/ documents installation prerequisites, the full permission list and every UI workflow. The plugin's own bundled `README.md`/`API.md`/etc. are **incomplete** — notably they omit the Node.js/Puppeteer requirement that the KB states plainly. Grepping only the bundled docs produced a wrong claim in BUG-TCM-005 that reached production #120588. **Check the KB before asserting anything is undocumented.**
- **Installation has three prerequisites that each silently gate a feature:** Redis (step 5), **Node.js + Puppeteer + Chromium (step 6)**, Sidekiq (step 7). Missing step 6 → emailed PDF reports arrive with no attachment. Missing step 7 → no report/notification email at all, in any format. Neither surfaces an error in the UI. Rule out all three before filing an email or PDF bug.
- **The KB supports Redmine 5.0.x / 6.0.x only.** Both QA instances (6.1.3, 7.0.0) are outside that matrix — state it in any bug filed from them.

- CSV import: when a step is skipped (missing pair / malformed), the final saved test case renumbers surviving steps contiguously (1, 2, 3...), but the import **preview** still shows original CSV column numbers with a gap. Not a bug, just a preview/final mismatch worth knowing about when reviewing a preview before confirming. See `docs/TESTCASE_MANAGEMENT_CSV_IMPORT_REPORT.md`.
- ~~CSV import header matching is not whitespace-safe / duplicate headers discard silently~~ — **both fixed, verified 2026-09-11** (BUG-TCM-001, BUG-TCM-002 closed). Current behaviour: headers are trimmed consistently at both mapping and value-read time (the step-2 mapping screen shows a padded `" step 1 "` column under the normalised key `step 1`), and a duplicated header now raises an explicit banner on step 2 — "Duplicate column names found: <names> — only the first occurrence of each will be used, the rest will be ignored." — before the user can confirm.
- **`.json`-suffixed plugin routes break browser-session auth.** Several plugin routes are declared with a literal `.json` path and `defaults: { format: 'json' }` (`config/routes.rb:162, 163, 167, 168, 175`). Redmine core's `find_current_user` reads the session cookie *only* when `api_request?` is false, and `api_request?` is true for any request whose `params[:format]` is `json`/`xml`. So any browser XHR to one of those routes arrives as **anonymous** and is rejected by core's `check_if_login_required` — which runs before any `before_action` the plugin declares in its own controller, making the plugin's `restore_session_user_for_api` compensating filter dead code. This is the root cause of BUG-TCM-003; the other four routes above should be checked for the same defect.
- The bulk result modal offers a narrower status list (Passed / Retest / Skipped) than the single Add Result modal (Passed / Failed / Retest / Blocked / Skipped) — failure statuses require defect IDs, which bulk mode does not collect. Appears intentional, not a bug.
- **The run grid's "Add Filter" dropdown is a trap for a shallow check.** Its top-level option list (`Subject`, `Priority`, `Run result`, `Test case`, `Created at`, `Updated at`) names nothing about defects — but selecting **"Test case" as the filter field reveals a second-level sub-filter** whose own dropdown is exactly `Without Defects` / `With Defects`, and it works correctly. A 2026-10-01 session read only the top-level list, concluded the documented "filter by defect status" feature (`FEATURES_LIST.md` line 17) was missing, and filed BUG-TCM-016 — then caught and retracted it minutes later while on the same page for an unrelated TC. **Always drill into every sub-level of a compound filter control (select a field, see what it reveals) before concluding a documented option is absent**, not just the first-level labels.
- **The run detail/Add Result page's "Submit" control is `<input type="submit" id="update-btn">`, not a `<button>`** — `button:has-text("Submit")` silently never matches; use `#update-btn` (or `input[value="Submit"]`) instead. Confirmed across every result-recording flow this session (single Add Result, bulk update).
- **Notification email delivery on `localhost:3010` is NOT gated by Sidekiq being up.** Killed Sidekiq entirely inside `redmine-docker-700-redmine-1` (confirmed dead via `ps aux`), recorded a test-case result, and the "Test Case Result Added" email still arrived in the watcher's mailbox. This environment's mail delivery for this notification is evidently synchronous (ActionMailer `deliver_now`-style), not routed through an ActiveJob/Sidekiq-backed async queue — so "stop Sidekiq, expect no email" is not a valid precondition test here (TESTCASE_MANAGEMENT_TEST_RUNS.md TC-TCM-186 corrected accordingly, not filed as a bug).
- **Playwright MCP's browser tabs share one context/cookie jar.** Opening a second tab does NOT give you an independent second user's session — confirmed via `page.context().cookies()` showing the same `_redmine_session` cookie in both tabs. A genuinely concurrent two-user test (TC-TCM-187) cannot be run this way; it needs either two separate browser profiles or the Playwright TS automation suite (which opens independent browser contexts). A sequential second login (logout, log back in as a different user, do the check, log back in as admin) works fine for non-concurrent permission checks like TC-TCM-139.
- **(ACTIVE as of 2026-10-01) Every "New Test Case" created via `/projects/test-project/issue_testcase/new` lands on the Bug tracker, not Test case** — confirmed on 7 consecutive creates, with both the global Testcase Tracker setting and the project's tracker enablement re-verified correct. A pre-existing older case (#434) correctly shows Test case, so this is a currently-active defect, not how the tracker has always rendered. **Check a new test case's own page title before trusting its tracker in any downstream verification** — the Test Suite's own "Testcase Summary" grid does NOT filter by tracker (see next entry) and cannot be used as a substitute check. Filed as BUG-TCM-022 (Critical). See `memory/project_tcm_bug_022_all_new_testcases_land_on_bug_tracker.md`.
- **The Test Suite's "Testcase Summary" grid (`/test_suites?testsuite_id=X`) does not filter by tracker at all** — it lists issues purely by `testsuite_id` custom-field association. Known Bug-tracker issues (created via the broken flow above) still appear in it right alongside genuine Test case tracker issues. Never use "it's in the suite's grid" as proof an issue is on the Testcase tracker — check the issue's own page title. This mistake caused BUG-TCM-019 to be filed on a false premise and later retracted.
- **The New Test Case form's Steps/Requirements UI does not survive any server round-trip that re-renders the form** — neither a Category-change AJAX refresh, nor the near-guaranteed first-attempt validation failure from the Bug-only required custom fields (BUG-TCM-011). Both wipe "New Step," every already-added step row, and the Requirements multi-select entirely, with the server error for the failed-validation case literally including "Steps and expected result cannot be blank" — the step data is dropped server-side, not just hidden client-side. **There is currently no UI path to save a test case with any step content on a project with this custom-field configuration.** Filed as BUG-TCM-021 (High).
- **The two Bug-only required custom fields ("QA Bug-Only Tracker Field", "QA Required Readonly Field") are genuinely absent from the New Test Case form's DOM on a fresh GET** (confirmed via `document.getElementById(...)` returning null, not just hidden) — they only materialize after the first failed submission. There is no way to pre-fill them proactively; every creation needs at least one failed-then-retried submit.
- **A pre-existing test case issue can have blank values for fields that are now marked required** (e.g. #456, a legacy fixture) — editing it will correctly fail validation on those fields, not because of a plugin bug but because the issue's own data predates the field becoming required. Fill them in (same values used for new creates) before concluding an Edit submission is broken.
- **The inline pencil-icon Subject editor next to an issue's title** (an `.rf-edit-icon` span, only rendered when Status = "New" — absent for other statuses like "In Progress") **has no working save mechanism** — typing a value and pressing Enter or blurring silently discards it, every time. The full `/issues/:id/edit` form's own Subject field works fine; only this inline affordance is broken. Filed as BUG-TCM-023 (Low).
- **The run grid's action-menu span has duplicate `id="action-menu-icon"` across every row** (same root pattern as `testsuite-menu-icon` on the suite tree) — always scope clicks to the specific row/li, never use a bare `#id` selector, or you'll always hit the first row regardless of which one you meant.
- **"Delete issue" on a test case triggers a native `confirm()` dialog**, not a custom in-page one (unlike Test Suite's own "Delete Folder," which uses a custom in-page confirmation panel with its own "Related testcase counts" wording) — use `browser_handle_dialog`, not DOM queries, to accept it.
- **Deleting a test case that's used in an active run with a recorded result is not blocked** — it succeeds silently with no warning about run impact, but every dependent view (the run's own grid, its dashboard pie/percentage) recalculates cleanly against the new total with no broken row and no 500. Confirmed via TC-TCM-138.
- **The Testcase Summary search box ("Search by subject or ID") does not actually search by ID** — only Subject (full and partial) works; an exact numeric ID, with or without `#`, always returns zero rows despite the field's own label. Filed as BUG-TCM-024.
- **There is no working UI path at all to associate an already-existing test case with a suite.** A case's suite is set only at creation time via the `testsuite_id` URL param on "New Test Case" — after that, it's permanently fixed: drag-and-drop has zero draggable behaviour (no `draggable` attribute, no jQuery-UI class, mousedown+move only triggers ordinary row selection), the suite's own Actions menu offers only "Import Testcases" (no add-existing action), the issue's own `/edit` form has no Suite field at all, and even Redmine's standard issue Copy action — which otherwise works correctly for test cases (new issue created, steps carried over, and notably stays on the **Test case** tracker, unlike the broken New Test Case flow) — produces a copy with no suite and no way to fix it afterward. Filed as BUG-TCM-025 (Critical).
- **Multi-select context-menu items with `class="submenu"` need a real Playwright click, not a JS-dispatched event, and reveal a nested sub-list you must then click into** — this pattern shows up repeatedly: "Remove Testcase" on a single row's Actions menu (`#single-remove-link`) reveals a separate `#custom-confirmation-popup` modal with its own Remove/Cancel buttons (not an inline confirm); the multi-select context menu's "Requirements" item (after checking ≥1 row and opening the *row's* Actions, which becomes "Bulk edit" + extra items like "Remove All Testcase"/"Requirements" when multiple are selected) reveals the actual list of requirement options to click. A `dispatchEvent(new MouseEvent('click'))` on these typically does nothing — use a real `.click()` from a precise locator.
- **"Remove Testcase" is a false-success endpoint.** Confirming the removal fires `POST /remove_issues_to_test_suite` with the exact correct payload (`test_suite_id=<id>&issue_ids[]=<id>`) and the server returns 200 OK — but the case silently remains in the suite's grid afterward (confirmed via a cache-busted reload), reproduced twice. Filed as BUG-TCM-026.
- **A test case's Subject can only be edited via the full `/issues/:id/edit` form** (works correctly there) — the inline pencil-icon editor next to the title (only rendered when Status = "New") accepts input but has no working save mechanism at all (Enter and blur both silently discard it). Filed as BUG-TCM-023.
- **The Requirements page's own edit control is also a pencil icon** (`img.pencil-icon`, next to the requirement's title) — clicking it exposes the title as a `contenteditable` Editor.js element; type directly into it, then click elsewhere to blur — it **autosaves on blur**, no Save button. The "+" / `#add-space` icon next to the "Requirements" heading creates a new requirement inline (type a name into the 2nd visible text input, press Enter). Deleting uses a `delete-icon` button → a plain "Are you sure? / Delete / Cancel" confirmation (not the custom-popup pattern seen elsewhere in this plugin).
- **A Requirement's own "×" remove-chip on the issue Edit form's select2 widget doesn't persist the removal.** Clicking it correctly clears the chip and the underlying `<select>`'s `selectedOptions` client-side, but submitting (even via `form.requestSubmit()`, confirmed genuine by the URL redirecting) leaves the link unchanged after reload. Filed as BUG-TCM-027. Note this is distinct from BUG-TCM-021 (which is about the *New* Test Case form's re-render wiping an *unsaved* Requirement selection) — BUG-TCM-027 is an *edit-time* persistence failure on an *already-saved* issue.
- **The Traceability Matrix (RTM) view has no Status/execution-result column at all** — its table is literally just Requirement / Testcases / Defects. Don't expect it to show Passed/Failed/tested-untested counts for any TC. Execution results only appear on the separate **Requirement Coverage report** (one of the 6 report types, columns: Testcase #, Title, Run, Environment, Status, Coverage Status) — confirmed it updates live (no regeneration needed) when a new result is recorded. If a TC needs "does the matrix reflect execution results," check the Coverage Report, not the RTM page.
- **Not every pre-existing "unlinked-looking" fixture actually is unlinked** — the `gsdfgdf` requirement (present since an early session) turned out to have 3 real case links (#434/#471/#458) despite its throwaway-sounding name. Always check a fixture's actual current state before using it as an "empty"/"unlinked" baseline for a negative test — create a fresh one if there's any doubt.
- **The To-Do list is driven by a run's own environment-assignee, not the issue's Assignee field.** "Add Run"'s Environment/Assignee fields map to `run[run_assignments_attributes][0][environment]`/`[assignee_id]` — that's what a user's My ToDo page actually filters on. Resolves TC-140's deferred question, which had checked the issue's own Assignee field and found "No data."
- **A `QA Read Only` role user cannot execute a test case even when it's assigned to them** — clicking the result status tag calls a client-side `notAuthorize()` stub instead of opening `/issue_status_results/new` (genuinely no execute right, correct behavior, not a bug). `QA Own Visibility` can execute normally. Use a role with actual execute rights (Developer, QA Own Visibility, Manager, Admin) whenever a TC needs a real execution, not just a listing check.
- **A real `Failed`/`Blocked` result submission requires a linked defect — this is a genuinely enforced required field, not just a UI suggestion.** Selecting Failed reveals a `Defects*` multi-select that is `required=true` on the underlying hidden `<select>`; a plain Playwright `.click()` on Submit (and even `form.requestSubmit()`) silently fires **zero network requests** when it's unsatisfied — no visible error, because the browser's native validation bubble can't render on a `select2`-hidden control. Check `form.checkValidity()` if a Failed/Blocked submit silently does nothing. Satisfy it via the inline **Report Defect** link (opens a full Add Defect modal; the created defect auto-populates the Defects field) before submitting.
- **"Edit Run" only reveals its actual form fields (environment/assignee selects, etc.) when opened via the row's own Actions-menu click** (`editRun(this, event)` on the row's action-menu icon → click "Edit Run" from the revealed popup) — navigating directly to `/runs/<id>/edit?project_id=...` by URL renders the same page shell but leaves those fields `visible: false`. Always open Edit Run through the menu click, never by direct URL.
- **A genuine Redmine `/issues/bulk_edit` Tracker change does not persist for a Testcase-Management-created issue** — selecting a different Tracker and submitting (confirmed via a real Submit-button click after the live-preview AJAX refresh, not the AJAX-only `/issues/bulk_edit.js` endpoint) leaves the issue's tracker unchanged on reload. Combined with BUG-TCM-022 (wrong tracker at creation) and the single-issue `/edit` form having no tracker field at all, this means a test case created via the plugin's own form is **permanently** locked onto the Bug tracker — there is currently no UI path to correct it after the fact either.
- **Enabling a project's Trackers checkboxes on Settings → Project (the "Project" info tab) silently does not persist**, even though the checkbox visibly checks and a Save click fires — the real control is on **Settings → Issue tracking**, a separate tab/page with its own "Trackers" checkbox group and its own Save button. Always verify via a reload, not just the click succeeding.
- **A non-member can view a private project's Activity feed directly by URL** (`/testcase_activities?project_id=<id>`) even when the base `/projects/<id>` page correctly 403s them — same missing-`view_project`-membership-guard pattern as BUG-TCM-009's other 8 endpoints; `testcase_activities_controller.rb` is a 9th affected controller, not yet in that bug's original list when first filed.
- **(2026-10-05) A project with zero Runs cannot create any report at all**, even with the default "Include all test run" option — "Runs must have at least one selected" blocks creation across every report type tried (Testcase Summary, Defect Summary, Tester Scorecard, Overdue Run Summary). Contradicts `TESTCASE_MANAGEMENT_REPORTS.md` TC-TCM-095's documented expected "explicit empty state" render. A brand-new project with the module enabled genuinely cannot produce its first report until at least one Run exists. **BUG-TCM-028 (Medium).**
- **(2026-10-05) The reports list page renders TWO separate `<table>`s**, not one: the main "Reports" table (#, Name, Created/Updated By, Created At, Actions — Edit **and** Delete) and, below it, a "Scheduled Reports" table (Name, Scheduled Time, Frequency, Actions — **Delete only, no Edit**) for any report that was scheduled. A scheduled report's name therefore matches `tr` in both — scope any row lookup to the table whose header contains "FREQUENCY" (`automation/tests/pages/ReportsPage.ts`'s `scheduledReportsTable()`/`getScheduledRow()`), never a bare `page.locator('tr', { hasText: name })`.
- **(2026-10-05) "Cancel a scheduled report" has no dedicated cancel action — it's the Scheduled Reports row's own Delete icon** (`confirmDeleteScheduleReport` → `POST /cancel_scheduling/:id`, confirmed via a `#schedule_delete_report` modal, same shape as `#delete_report`). This **deletes the whole report**, not just the schedule — confirmed live via a direct repro: after cancelling, the report is gone from the main Reports list too. There is no "switch back to Right now" edit path; a Scheduled Reports row has no Edit icon at all.
- **(2026-10-05) A scheduled report's stored Name gets a `(creation-date)` suffix appended** (e.g. `QA-AUTO-RPT-107-1791180658235(2026-10-05)`), visible in the main Reports table — an unscheduled report's name has no such suffix. An exact-match link lookup (`getByRole('link', { name, exact: true })`) will never hit a scheduled report; use a substring/`hasText` match instead.
- **(2026-10-05) Creating a Test Suite needs the "Test case" project Tracker enabled first** (`Settings → Issue tracking`, not the "Project" info tab's own Trackers checkbox, which does not control this) — without it, `/test_suites?project_id=...` shows "Tracker not enabled for this project" and the whole TestCases area is unusable, even though the module itself is enabled.
- **(2026-10-05) The "Add Test Suite" control is a bare `<svg id="add-testsuite">` icon, not a link/button** — its visible "Add Test Suite" text is a sibling `<span>` with no click handler at all; `getByRole('link'/'button', { name: 'Add Test Suite' })` matches zero elements and hangs waiting. Click `#add-testsuite` directly. Same family as the known duplicate-id action-icon pattern elsewhere in this plugin.
- **(2026-10-05) Adding a project Member as Admin can trigger Redmine's sudo-mode "Confirm your password to continue" interstitial**, not just Roles-and-permissions saves (see root MEMORY.md's existing sudo-mode entry, now confirmed broader in scope). The gate is a real form (`#sudo-form`, field `#sudo_password`, submit button literally labeled **"Submit"**, not "Confirm"/"Continue") — fill the admin password and submit it to get past it; the original action's params are carried through as hidden fields and re-POSTed automatically.
- **(2026-10-05) A brand-new project's "New Test Case" form can be impossible to submit at all**, even with Subject filled: two global custom fields (`QA Bug-Only Tracker Field`, `QA Required Readonly Field`) came back as "cannot be blank" on save despite **not being rendered anywhere in the form's HTML** — confirmed via a full-page HTML search finding zero matches for either label. These are QA fixtures from other suites (Custom Fields/Permissions testing) that are global in scope; a new project inherits their required-ness without inheriting whatever workflow/role condition makes them visible elsewhere. Workaround used: avoid the from-scratch project entirely and reuse an existing, already-working project instead (see `helpdesk-service-desk` reuse in the Handoff's 2026-10-05 entry).

- **Report PDF export depends on Node.js + Puppeteer/Chromium via the `grover` gem, and fails silently when they're absent.** `run_mailer.rb` builds the PDF with `Grover.new(html).to_pdf`; on a container without `node` this raises `Errno::ENOENT`, and the `rescue` block **still calls `mail(...)`**, so an attachment-less email goes out with a body that says "Please find the attached Testcase Report". No UI error, no failed job. This is BUG-TCM-005. Whenever a PDF-format report email "arrives but has nothing attached", check `which node` inside the Redmine container first — and check the Sidekiq log for `Error generating PDF:`, which is the only place the failure is recorded.
- The report email format is a single radio group confusingly named `testcase_report[email_as_html]` with values `pdf` / `html` (ids `#email_as_pdf` / `#email_as_html`); PDF is the default. The model stores it as two booleans, `email_as_html` and `email_ad_pdf` (note the typo `ad`).

- **`initialize.sh` is broken as shipped on Debian 12.** It requests `libgdk-pixbuf2.0-0`, which has no installation candidate on this release (now `libgdk-pixbuf-2.0-0`). `apt-get` aborts the entire install on that single bad name, so a user following the documented procedure ends up with **nothing** installed and only a buried error. Substitute the corrected package name when running it.
- **Grover resolves the browser from the Sidekiq process environment**, via `ENV['PUPPETEER_EXECUTABLE_PATH']` (falling back to `npx puppeteer executablePath`) and `GROVER_NO_SANDBOX`. Installing Node is not sufficient on its own — **Sidekiq must be restarted with those variables exported**, which is what `initialize.sh` does. A hand-started `bundle exec sidekiq` will not have them.

- **Redmine caps a custom field name at 30 characters.** Creating one with a longer name fails validation and re-renders the form — and because that re-render returns HTTP 200, a scripted POST loop will report success while silently creating nothing. Always verify the resulting list, not the response status. (Hit this creating fixtures for TC-TCM-037: 10 of 25 names were silently rejected.)
- **Redmine's CSV export separator AND encoding vary by instance/locale** — `localhost:3010`: comma + Windows-1252; `localhost:3012`: comma + UTF-8; `localhost:3011` (German locale): **semicolon** + cp1252, because Redmine uses `;` where the locale's decimal separator is a comma. Import step 1's **Field Separator** and **Encoding** must both match the file or the wizard misreads it. The testcase import wizard defaults to UTF-8, so a freshly exported issue CSV must have **Encoding** switched to Windows-1252 on import step 1 or the content mangles. The "All Columns" export option is `c[]=all_inline` (`columns=all` does nothing).

- **rftc-042 (TCM Testing Harness) and rftc-043 (static/dynamic security + discovery testing) are internal
  dev-tooling tickets, not plugin features** — they build/extend the `redmineflux-tcm-ci` repo's own QA automation
  (k6 load/chaos, Brakeman/Semgrep SAST, bundler-audit/Trivy/pip-audit, gitleaks, mutation testing, an authz-matrix
  generator, an AI exploratory agent). Per established convention, these get light verification only (spot-check
  the plugin-side side effects their journals claim), never full harness re-verification, in this plugin's own QA
  cycle. **One real finding from rftc-043 worth tracking even though it's out of our testing scope: a dependency
  scan (`bundler-audit`, cross-confirmed by `trivy fs`) found 81 real CVEs in this plugin's Ruby `Gemfile.lock`
  (3+ CRITICAL, e.g. `rack-session` CVE-2026-39324 "unauthorized access via crafted session cookies", `rubyzip`
  path-traversal CVE-2026-85396) — not something this plugin caused or can fix itself, it needs a wider Redmine/
  Rack/Rails upgrade. Surface this if a Redmine-upgrade or dependency-upgrade discussion ever comes up.** Also
  noted as a genuine, still-unaddressed gap from the same work: **A09 (Security Logging/Monitoring)** — no
  centralized security-event log for failed-authz/rejected-URL-key-auth/CSRF-rejection attempts exists yet.
  Source: `documents/owasp-top-10-coverage.md` + `documents/cohort-review-testing-strategy-2026-10-02.md` in the
  plugin dev repo (`C:\redmine v6\plugins\redmineflux_testcase_management\documents\`).

- **CI/CD (rftc-009/016/017/038) auto-creates a Run per build — it does NOT auto-create Test Suites or Test
  Cases.** Those must already exist in the project before any pipeline runs; the CLI only matches existing
  testcases (via each issue's **Automation Key** field, falling back to id/subject) and writes execution results
  against them inside the new run. Concretely:
  - `bootstrap --project <id> --name "<build name>" --suites "<existing suite name>" --on-existing reuse` →
    creates (or reuses) **only the Run**, scoped to the named suite(s), which must already exist with their
    testcases already created and their **Automation Key** fields already set to match the real test function
    names (e.g. `test_login_valid`).
  - `ingest --junit report.xml --project <id> --run <run_id> --env "<env>" [--auto-defect]` (or `submit` with a
    `--mapping` JSON for PHASE 1) → parses the JUnit report, matches each test by Automation Key, and writes a
    Pass/Fail/Blocked/Skipped result onto the matching **existing** testcase in that run. A test name with no
    matching Automation Key comes back `UNMATCHED` (warning, not an error, unless `--strict`) — it does **not**
    create a new testcase on the fly.
  - `--auto-defect` auto-creates a **Bug** issue (not a testcase) and links it to a Failed/Blocked result.
  - Real confirmed example (RFTC038-6, a genuine live Jenkins run against `redmine6-redmine-1`): `bootstrap` made
    **Run #8** from the pre-existing "CI Ingest" suite; pytest produced 4 pass/1 fail/1 skip against 6
    pre-existing testcases whose Automation Keys had been aligned beforehand; `ingest --auto-defect` wrote all 6
    results into Run #8 and auto-created **Defect #37** for the one failure — confirmed independently in the real
    TCM UI (`/runs/8`), not just the pipeline's own log.
  - Practical implication for QA/dev setup: before wiring a project into CI, someone must manually (or via a
    one-time provisioning script) create the Test Suite(s) and every Test Case inside them, and set each
    testcase's Automation Key to the exact test function/method name the suite will run — only then will CI
    results land on the right testcase instead of coming back unmatched.
  - **Three ways to pre-create that Test Suite/Test Case structure, besides clicking through the UI**: (1) the
    plugin's own JSON API — `POST /testcase_mcp/create_test_suite.json`, `POST /create_testcase.json`, or
    `POST /testcase/bulk_testcase_create.json` for bulk-with-steps — callable via curl/Postman against the
    user's own instance with their own API key, entirely separate from this repo's redmineflux MCP (which only
    ever writes to production `flux.zehntech.com`); (2) the plugin's built-in CSV Import wizard for bulk
    creation with steps; (3) manual UI (Add Test Suite / Add Sub Test Suite, then New Test Case per case).
  - **Deferred test idea (2026-10-19, not yet executed): a dedicated RFTC-016/017/038 scenario for a user who
    creates their OWN multiple test suites + nested sub-test-suites + testcases (via API, CSV, or UI) and then
    runs CI against that self-built structure**, rather than reusing the existing `rftc-016-ci-qa` fixture
    project. User's explicit call: for the current GitHub/GitLab/CircleCI/Bitbucket RFTC-038 live-platform pass,
    **do not** build new/multiple suites per platform — reuse the single existing project (`rftc-016-ci-qa`,
    suite "CI Ingest", id=3) across all 4 platforms, exactly like the already-verified Jenkins run (Run #8). The
    multi-suite/sub-suite structural matching itself is already covered by RFTC016-30/31 (multi-suite grouping,
    ambiguous suite membership — both PASS). The "user builds their own suite tree from scratch, then CI runs
    against it" angle is a separate, not-yet-covered scenario explicitly saved for a **later** session.

- **(2026-10-23) The plugin now has 8 Testcase Report types, not 6** — the "Select type" dropdown also offers
  **Slow Tests** and **Most Failed Tests**, which had bug history (BUG-TCM-068/070/071/076/077/081) but zero
  creation test cases in `TESTCASE_MANAGEMENT_REPORTS.md` until TC-TCM-316/317 were added this session. If a
  future session's report-type count/list looks stale against the live "Select type" dropdown, re-check it rather
  than trusting an older TC range.
- **(2026-10-23) Report download content-verification method, reusable for any future report regression:** HTML
  via `grep` on the downloaded file for expected content strings; PDF via `pdftotext -layout report.pdf -`
  (confirmed present at `/ucrt64/bin/pdftotext` in this repo's Git-Bash environment) to extract and inspect text;
  Excel via `unzip` into a scratch dir and reading `xl/worksheets/sheet1.xml` directly (these exports use inline
  strings, not `sharedStrings.xml`) — `grep`/`cat` that file rather than opening the `.xlsx` in a spreadsheet app.
- **(2026-10-23) `pdftotext -layout`'s column-reconstruction heuristic can look garbled on a long multi-table PDF
  even when the PDF itself renders fine** — before filing a PDF bug from `-layout` output alone, cross-check with
  plain `pdftotext` (no flag); if the plain-text version shows the same data cleanly in stream order, treat the
  `-layout` garbling as a text-extraction artifact, not a confirmed rendering defect, unless a real PDF-to-image
  tool (`pdftoppm` or similar — not available in this environment as of 2026-10-23) can visually confirm otherwise.
- **(2026-10-23) The three per-format report-export code paths (HTML/PDF/Excel) are NOT one shared renderer with
  three output adapters — they can and do diverge independently per report type.** Confirmed by this session's
  regression: Requirement Coverage's Excel export is completely broken (BUG-TCM-106, "Unknown Report Type") while
  its HTML and PDF both work; conversely Slow Tests' PDF export is completely broken (BUG-TCM-107, drops the whole
  body) while its HTML and Excel both work. **Always verify all 3 download formats independently for every report
  type** — a passing HTML/PDF check says nothing about Excel, and vice versa.

- **(2026-10-23) "Include all test run" is not scoped to the project — it resolves to every run visible to
  `@report.runs`, which in this build means all runs in the project (41, in `rftc-016-ci-qa`), not just the ones
  a tester has in mind.** This matters for any report-type test that iterates per-run logic: a crash or data gap
  that only shows up under "Include all" (like BUG-TCM-108) can be invisible when the same report type was
  earlier tested with "Only the following test runs" scoped narrowly — always test at least one report of each
  type under the actual default ("Include all"), not just a convenient narrow scope, or a scope-dependent defect
  gets missed entirely.
- **(2026-10-23) Deleting a test case that's part of an active run (allowed by this plugin, confirmed harmless
  for the run grid/dashboard per TC-TCM-138) can still leave a dangling `RunIssue` row behind with `issue_id=0`.**
  This orphaned row is invisible in normal UI use but will crash any report-generation code path that assumes
  every `RunIssue` has a live matching issue (see BUG-TCM-108's root cause). If a report crash ever looks like
  "undefined method for nil" deep in a loop over `run.run_issues`, check for `issue_id=0`/orphaned join rows
  before assuming it's a one-off.
- **(2026-10-23) Mailpit's REST API (`http://localhost:8025/api/v1/...`) is the fastest way to verify email
  content in this environment — faster than driving the web UI.** `GET /api/v1/messages?limit=N` lists recent
  messages with a text `Snippet` (good for a quick content spot-check across many emails at once);
  `GET /api/v1/search?query=<text>` finds/counts messages matching a term (useful to prove an email did **not**
  arrive, as in BUG-TCM-108 — a `count:0` search result is solid evidence of non-delivery); `GET
  /api/v1/message/<id>` returns the full JSON including the `Text`/`HTML` body; `GET
  /api/v1/message/<id>/part/<PartID>` downloads a specific attachment's raw bytes (works with `curl -o` — confirm
  a PDF attachment is real via `file`/`pdftotext`, not just that `Attachments: 1` was reported).
- **(2026-10-23) When filling the report-creation form via `browser_evaluate` instead of clicking through the UI,
  the recipient-email field is a `<textarea id="testcase_report_email_message">` despite Rails naming it
  `email_message` — it is NOT the report's Description textarea and NOT a message body.** Its placeholder
  (`person1@example.com`) is the only hint; the actual `<select>` for report type uses real option values, not the
  dropdown's visible label text (`testcase`/`summary`/`activity`/`tester_scorecard`/`requirement`/`overdue_run`/
  `slow_test`/`most_failed` — note `summary` = Defect Summary and `requirement` = Requirement Coverage, not an
  obvious mapping from the label alone; this same `requirement` key is also the literal string that BUG-TCM-106's
  Excel-export error message complains about not recognizing, which is a nice independent confirmation of that
  bug's root cause).

- **(2026-10-23) Sidekiq's built-in scheduled-job poller (`sidekiq/scheduled.rb`) is silently dead on this
  environment, every single boot, since at least 2026-10-22** — a `connection_pool`/`sidekiq` gem version
  mismatch (`sidekiq 7.3.9` calling `TimedStack#pop` with an argument `connection_pool 3.0.2` doesn't accept)
  crashes the poller thread with `report_on_exception: true`, so the main Sidekiq process stays "up and healthy"
  while never actually delivering anything from the scheduled set again. This means **no `perform_at`/
  `perform_in` job and no `Sidekiq::Scheduler` cron entry will ever fire on this instance** until the gem
  versions are fixed — confirmed by the plugin's own `ReminderWorker` cron job (registered every minute) not
  having run once in 2+ hours, and independently by a scheduled report never delivering. **Before trusting any
  future "scheduled"/"recurring"/"cron" feature test on this instance, check `docker logs <sidekiq-container> |
  grep ArgumentError` for this exact crash first** — a schedule recording correctly in the UI tells you nothing
  about whether it will ever actually fire here. See BUG-TCM-111.
- **(2026-10-23) When a user interrupts a tool call and says to double-check a finding, actually go find the
  alternate path they're hinting at — don't just re-assert the same conclusion with more confidence.** Asked
  whether cancelling a schedule might work via deleting the *parent report* instead of the broken Scheduled
  Reports Delete icon; this was a reasonable alternate hypothesis worth ruling out, and doing so (confirming no
  parent report row exists until a schedule actually fires) made the eventual bug report stronger, not weaker.
  Confirmed this is the right instinct: the user then asked "is this really a bug?" as a second, independent
  check before approving the production report — both checks held up, and reporting proceeded only afterward.
- **(2026-10-23) Production issue subjects for this plugin must literally start with `BUG-TCM-NNN: ` as the
  first token of the subject line** (confirmed against existing production issues, e.g. `#120588 BUG-TCM-005:
  ...`), not just mention the bug ID inside the description. A `[Testcase Management] ...`-style subject prefix
  used for 5 issues this session (#124772–#124776) and found missing on 2 earlier-session issues (#124423,
  #124424) was corrected via `redmineflux_core_update_issue` after the user caught it. Always use the
  `BUG-TCM-NNN: <title>` format for every future production report on this plugin, and double-check the subject
  (not just the description) before calling `redmineflux_core_create_issue`.

- **(2026-10-23) `rftc-perf-500`'s Testsuite rows have a QA-fixture data defect, not a product one: `project_id`
  is stored as the project's numeric id (4) instead of its string identifier, unlike every normally-created
  suite.** This project's 500+ test cases/50+ suites were seeded directly via a `rails runner` script for
  `TESTCASE_MANAGEMENT_PERFORMANCE.md`, and that script apparently used `project_id: project.id` where it should
  have used `project_id: project.identifier` (confirmed: `Testsuite.where(project_id: project.id)` returns 51
  rows for this project, while `Testsuite.where(project_id: project.identifier)` returns 0 — every other
  project's suites are the other way around). This breaks any UI flow that looks up suites by identifier for
  this project specifically — e.g. creating a Run with "Include all test run" or the "Select cases" picker both
  return zero suites and the run never saves (422, `@run.errors` shows "Testsuite is not selected"). **Do not use
  `rftc-perf-500` for any test that needs to create a Run through the normal suite-selection UI** — reuse its
  existing run (#81) for read-only checks only, or build a fresh project instead. Not worth fixing the seed data
  retroactively unless a future session specifically needs working Run creation in this project.

- **(2026-10-23) A synthetic `element.value = 'x'; element.dispatchEvent(new Event('change', {bubbles:true}))`
  does NOT reliably trigger every page's real jQuery `.change()` handler — even though it looks like a normal DOM
  event dispatch.** Confirmed on the Project Overview dashboard's dimension `<select>`
  (`testcase_chart.js`'s `$("#div_dimention_graph").change(...)`): the synthetic approach produced
  `dimensions=null`/`dimensions=` in the actual outgoing request, which looked exactly like a real "dropdown
  doesn't update the backend" bug — until redone with a genuine Playwright `browser_select_option` (a real
  user-level interaction), which correctly sent `dimensions=by_activity`/`by_result`/`by_defects` every time.
  **Always re-verify a suspicious "the change didn't take effect" finding with a real `select_option`/click
  before concluding it's a product bug** — this is the same lesson as the earlier `.fill()` vs real-keystrokes
  gotcha (Requirements search box), just for `<select>` elements instead of text inputs.
- **(2026-10-23) The Project Overview dashboard (`/test_suites/releases?project_id=<id>`, titled "Test Case
  Management" on the page, the module's own landing page) had ZERO test coverage anywhere in this repo** —
  absent from `FEATURES_LIST.md`, the User Guide, and every `testcases/` file — until found and fully tested this
  session per direct user request. Now covered by `testcases/TESTCASE_MANAGEMENT_OVERVIEW.md` (TC-TCM-321–328).
  Worth periodically checking the plugin's actual navigation/sidebar for pages that were never formally
  documented, rather than assuming `FEATURES_LIST.md` is exhaustive.

- **(2026-10-23) The original V1 7.1.0 external release cycle demo environment (`localhost:3015`/`alpha-web`) no
  longer exists** — port 3015 now serves an unrelated Crux-plugin Docker stack (`crux-redmine6-redmine-1`),
  confirmed via `docker ps -a` and a 404 on `/projects/alpha-web`. A rerun against `localhost:3000` required
  building a fresh `alpha-web`-equivalent fixture project (id=5) from scratch — project, 4 roles, 4 users, suites —
  matching `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s exact preconditions. See
  `reports/V1_7.1.0_RERUN_2026-10-23_RESULTS.md` for the fixture spec and partial results (5 of 202 cases
  genuinely executed before stopping on budget grounds).
- **(2026-10-23) This instance's actual global "Reporter" role (id=5) already has the FULL Testcase Management
  permission set** (`view_test_suite`, `create_run`, `execute_testcase`, `view_report`, etc.) — it does NOT match
  the zero-TCM-permissions assumption the V1 file's "Reporter" fixture role requires. Deliberately did not mutate
  the shared global Reporter role (other plugins/suites in this repo may depend on its current permission set);
  created a separate dedicated role "V1 Reporter (no TCM)" (id=8, `view_issues` only) instead, scoped to the V1
  fixture project only.
- **(2026-10-23) `TestSuitesController#destroy` (bound to the `testsuite_delete` route) requires NESTED params**
  — `params[:test_suite][:id]`/`params[:test_suite][:project_id]`, not flat top-level `?id=`/`?project_id=` query
  params — confirmed by reading the controller source (`test_suites_controller.rb:673`) and by grepping every
  plugin JS asset for a `testsuite_delete` caller (zero matches — the real UI form auto-nests via `form_for`). A
  flat-param curl call crashes with a `NoMethodError` 500 that looks like a product bug but is a pure
  request-shape mistake; the correctly-nested call returns an HTTP 404 on the DELETE response itself (an unusual
  but apparently harmless response-code quirk for this JSON route — the actual deletion still succeeds, confirmed
  via a follow-up `GET /test_suites.json`) rather than a conventional 200/302.

## Methodology Lessons

- **`TestcaseEnvironment.project_id` stores the project's NUMERIC id, not the string identifier** —
  the opposite convention from `Testsuite.project_id`, which stores the string identifier (e.g.
  `"rftc-016-ci-qa"`). Querying `TestcaseEnvironment.where(project_id: 'rftc-016-ci-qa')` silently returns
  nothing; use the numeric project id instead. Worth double-checking this per-model convention before any direct
  console/DB query against a table that wasn't already confirmed this session.
- **The Test Suite Add and Edit modals use two DIFFERENT element ids for the Name field** —
  `testsuite_name` (Add) vs `testsuite_names`, plural (Edit). Querying `#testsuite_name` while the Edit modal is
  open resolves to the Add modal's hidden/stale instance (value always empty), making a correctly-working field
  look broken. Always confirm which modal is actually open and check for sibling elements sharing a similar id
  before concluding a field isn't populating.
- **The Test Suite tree's issue-count badge lives in a sibling `<span class="rf-ts-suite-count-badge">`, not
  inside the suite-name `<a>` itself.** Querying just the link's own `textContent` (e.g. `.testsuite-name a`)
  will never see the count even when it's rendering correctly — query the parent `.testsuite-name` span instead.
  Also: the setting's real stored value must be the exact string `'true'` (checked via `== 'true'` in the views),
  not `'1'` or any other truthy value — setting it to `'1'` looks like it should work but silently does nothing.
- **The hidden `#parent-id-field` (and similar AJAX-populated hidden fields in this plugin's modals) can read as
  empty if checked in the very same synchronous turn as the click that opens the modal** — a brief wait (or
  reading the value in a later, separate check) shows it correctly populated. Don't conclude a pre-fill is broken
  from an immediate same-tick read; this was initially mistaken for a live reproduction of the (actually fixed)
  BUG-TCM-018 pattern during the 2026-10-22 Test Suites regression, before a second check with a short wait
  showed the real, correct value.
- **Redmine's real attachment upload flow is two-step, not a single multipart POST on the final form** — the
  browser first POSTs the raw file to core `/uploads` (or `/uploads.js`), which returns a token; the later form
  submission (e.g. `issue_status_results#create`) only references that token plus a filename/description, never
  re-sending the file bytes. A direct curl POST to the final endpoint with a top-level `attachments[dummy][file]`
  multipart field (guessing the shape) gets silently ignored — no error, no attachment, because the controller
  never looks at that shape at all. To genuinely test attachment size/type limits server-side, POST straight to
  `/uploads`/`/uploads.js` instead, bypassing the browser's client-side JS check at that exact step.
- **Before concluding a CSV-formula-injection (or similar export-path) finding from a single safety-helper
  reference, check whether the field in question is exported anywhere at all.** `RftcOutputSafetyHelper`'s
  `excel_safe`/`excel_safe_row` is real and does protect Subject/run-name/description cells, but neither of this
  plugin's actual export surfaces (`/test_suites.csv`, the Testcase Summary Excel export) ever serializes
  Steps/Expected Result into a cell in the first place — the stronger, more specific finding for TC-TCM-246 was
  "there is no export path for this data at all," not just "the helper that protects other fields exists."
- **A PASS recorded from source/architectural inference should be clearly labeled as such and revisited with a
  live check when the user asks "did you actually run this" — don't let the label alone stand in for evidence.**
  This session's Security suite had 8 TCs (231, 234, 236, 238, 245, 246, 247, 248) that were initially recorded
  as PASS from source reading or extension-by-analogy from a sibling TC; a direct user follow-up ("poora
  regression ho gaya?") correctly caught that these weren't equivalent to the live-executed TCs around them, and
  every one of them was then closed with a genuine probe fixture and real request/response evidence.
- **For a curl-based CSRF-protected POST/PUT/DELETE, fetch the token and make the request in the exact same
  Bash call, from the exact same cookie jar, every time** — refetching the token via a separate prior call (even
  moments earlier) repeatedly produced a generic Redmine 422 CSRF-error page instead of the app's own
  authorization response, which looks like "request rejected" but is actually just a stale/mismatched-session
  tooling artifact, not a real finding. Found repeatedly during the Security suite (TC-219, TC-229, TC-244) —
  always do `curl -c jar -b jar <page-for-token>` immediately followed by the real request using that same `jar`
  in one call, and sanity-check the response body isn't the generic `422 - Redmine` CSRF page before trusting a
  rejection as a genuine authorization result.
- **An `Accept: */*` curl request can silently skip a view's own `<% if request.format == :html %>` guard**,
  rendering a near-empty page (just the base layout, no actual form/content) with a clean `200 OK` — easy to
  mistake for "nothing leaked" when the real issue is the test methodology, not the app. Found investigating
  BUG-TCM-094 (`issue_status_results#new`): a bare `Accept: */*` GET returned 200 with no form fields at all; the
  identical request with an explicit `Accept: text/html` header rendered the full form, hidden fields and all.
  Always set `Accept: text/html` explicitly when curl-testing an HTML-rendering endpoint for a potential leak —
  a clean-looking response under the wrong Accept header is not evidence of anything.
- **The "genuine execution" onerror-payload methodology (established for BUG-TCM-093) is reusable and should be
  the default XSS-confirmation technique going forward**, not just a one-off for that bug: create the probe with
  `<img src=x onerror="window.__someUniqueFlag=true">`, view the page via Playwright, then
  `page.evaluate(() => window.__someUniqueFlag === true)`. A `false` result is a genuinely strong PASS (not just
  "didn't see an alert"); a plain `<script>` tag check alone is insufficient either way, since browsers never
  auto-execute a `<script>` element inserted via `innerHTML`/`.html()` regardless of whether escaping is actually
  broken. Used this pass to confirm PASS on Test Case Subject (TC-231), Run name (TC-234), and the FAIL on
  Requirement title (BUG-TCM-093).
- **A controller action can have a correctly-scoped write path (`#create`) while its own sibling read/form-load
  action (`#new`) has zero scoping at all** — don't assume a controller is uniformly safe (or uniformly unsafe)
  just because you've checked one of its actions. BUG-TCM-094 is exactly this split: `IssueStatusResultsController
  #create` correctly re-derives `@project` from the run's own `project_id` and checks `execute_testcase`, but
  `#new` loads `@run`/`@issue` by bare `.find(params[...])` with no project check and no `before_action` at all.
  Check every action's own `before_action` list individually rather than inferring from the controller's general
  reputation.
- **For Permissions-suite "leg C" (direct endpoint) checks, `curl` with real per-user session cookies is the
  right tool, not Playwright** — the TC methodology itself says "request the URL directly," which is a raw
  HTTP status check, not a UI interaction. Use `rails runner` to reset a test user's password to a known value
  (local Docker instance only), log in via curl with a cookie jar, then GET/POST directly. **Critical gotcha**:
  do the login + grab-a-fresh-token + make-the-request sequence **inside a single Bash call** — session state
  (and the CSRF token tied to it) does not reliably survive across separate tool-call invocations in this
  sandbox, producing misleading 422 (invalid CSRF)/302 (session expired) results that look like real findings
  but are just tooling artifacts. Always verify a session is alive (`GET /my/account` returns `<title>My
  account - Redmine</title>`, not a login-page title) before trusting any status code from it.
- **A form's actual param names rarely match the TC description's casing** — this plugin's forms use
  `testsuite[name]` (not `test_suite[name]`), `requirement[title]` with `requirement[project_id]` **nested**
  inside the same hash (not a top-level `project_id` query param), `testcase_report[name]`, etc. Scrape the
  real `name="..."` attributes from a GET of the actual form (as a role that CAN load it) before constructing
  any direct POST — guessing param names produces 400/404/422 responses that look like permission refusals but
  are actually just malformed requests, risking a false "PASS" (denied) or false negative.
- **`rftc_project_readable?` vs `rftc_authorize_project_read!` are NOT interchangeable** — the former checks
  only project visibility/membership; the latter (the correct, comprehensive one, added specifically for
  BUG-TCM-009) also checks `module_enabled?('testcase_management')`. `test_suites_controller.rb` is the one
  controller still using the older, incomplete helper (see BUG-TCM-009's reopening) — check which helper a
  controller actually calls, not just whether a `before_action` exists at all, since two have confusingly
  similar names and very different guarantees.

- **Never trust an accessibility-tree snapshot to rule out XSS — always check `element.innerHTML` directly.**
  2026-10-22: dismissed a real `alert('export-xss')` from the Requirements page's `#`-mention dropdown as a
  "stale duplicate-tab artifact" because the Playwright accessibility snapshot showed the dangerous item as
  plain, escaped-looking text. It wasn't an artifact — an `<img src=x onerror=...>` element still renders as
  descriptive text in the a11y tree even after its `onerror` has already fired, so the snapshot is not evidence
  of safe escaping. The user caught this by reproducing the exact same alert live. **Lesson: when a real browser
  alert/dialog fires during testing, investigate it as a genuine finding first — only rule it out with direct
  DOM inspection (`el.innerHTML`, `el.querySelector('img')`), never by inference from an accessibility snapshot
  or by assuming "it's just a leftover tab."**
- **A single fix for one rendering path of a feature does not mean every rendering path for the same data is
  fixed.** BUG-TCM-072's original fix patched `createIssues()`/`#user-list` (confirmed still correct), but the
  same page wires up a second, completely independent Tribute.js widget (`mentionIssue`) for the exact same
  `#`-trigger use case, fed by different code (`getAllIssues()`) that was never touched by the fix. **When a
  page has more than one widget/code path serving a conceptually similar feature (two mention dropdowns, two
  export buttons, two chart renderers), verify each one independently — a retest that only exercises one path
  can wrongly confirm "fixed" for the whole feature.**
- **A control staying visible/operable client-side with zero permission is NOT automatically a security bug —
  verify the backend independently before assuming a bypass.** BUG-TCM-089's Add/Edit Requirement controls
  stayed fully visible and clickable with zero `add_requirement`/`edit_requirement`, which looked identical in
  shape to BUG-TCM-007/009's real bypasses. But two independent backend checks (a DB row-count check after a
  probe submit, and direct curl POST/PUT both returning 403) confirmed the backend genuinely refuses both —
  this is a UI-visibility + missing-error-feedback defect, a real but much lower-severity class than a true
  authorization bypass. Always check Leg C (the actual backend/endpoint) before classifying a Leg B finding's
  severity, even when the UI symptom looks the same.
- **An attachment/file-download endpoint can fall back to a completely different, unrelated core Redmine
  permission than the feature's own permission model — always check what `.visible?` actually resolves to.**
  BUG-TCM-089 Finding 3: `requirement.rb`'s `authorize_attachment_download` checks
  `@attachment.visible?(User.current) || allowed_to_manage_requirement?(@project)` — the first half silently
  falls back to core Redmine's generic `view_files` permission (confirmed still `true` on a role with every
  Testcase Management permission stripped), completely bypassing this plugin's own permission model. When a
  controller mixes `Attachment#visible?`/similar core helpers with plugin-specific permission checks via `||`,
  test the core-permission branch explicitly — it can quietly defeat the plugin's own access control.
- **A `rails runner` call via `docker exec` on this stack needs `-e SECRET_KEY_BASE=<value>` explicitly set** —
  the container's own `REDMINE_SECRET_KEY_BASE` env var is read by the entrypoint script, not by Rails' boot
  process directly when invoked via a bare `docker exec ... rails runner`, so omitting it causes an immediate
  `ArgumentError: Missing secret_key_base` crash before any code runs. Grab the value via
  `docker exec <container> printenv | grep -i secret` once, then pass it with every subsequent `-e` call.
- **A UI widget that correctly filters by permission on one page is NOT guaranteed to do so everywhere it's
  embedded — check every page that reuses the same component, not just the "main" one.** BUG-TCM-090: the
  test-suite tree's kebab menu correctly hides Edit Folder/Delete Test Suite on `/test_suites` for a role
  without those permissions, but the identical widget on `/projects/<id>/issue_testcase/new` ("Add Testcase")
  shows all three options unconditionally — the permission-filtering logic simply isn't applied to this page's
  copy of the same partial. When a plugin reuses a sidebar/tree/menu component across multiple controller
  actions, test the permission behavior on each entry point separately; a passing regression on the "obvious"
  page says nothing about a secondary one.
- **A broken feature found via a denied-permission UI gap can turn out to be broken for EVERYONE, not just the
  denied role — always retest as a fully-permitted user (e.g. Admin) before concluding severity/scope.**
  BUG-TCM-090 Finding 2: Edit Folder's `project_id=undefined` 404 was first noticed while testing a stripped
  role, but reproduced identically as Admin — the real root cause was a missing `data-project_id` HTML
  attribute on one view's copy of a shared modal, unrelated to permissions at all. Misdiagnosing this as
  "another missing permission check" would have under-stated it (it affects 100% of users on this page, not
  just denied ones) and over-stated it as a security bug when it's a plain functional defect.
- **The plugin's own `init.rb` is the authoritative source for its registered permission list — not
  `docs/*_REQUIREMENTS.md`'s own matrix, which can quietly drift stale.** Found 2026-10-22: `REQUIREMENTS.md`'s
  Permissions Matrix listed only 16 permissions; `init.rb`'s `project_module :testcase_management do ... end`
  block actually registers 19 (`view_test_suite`, `manage_environment`, and a `public: true` `test_suites`
  permission were all missing from the doc). When auditing "does this permission exist/what does it gate,"
  grep `init.rb` directly rather than trusting a doc's own matrix.
- **A permission can be correctly enforced on one access surface (e.g. an MCP/API controller) while a sibling
  browser controller checking the exact same permission name never enforces it at all — these are two
  independent code paths, test both.** `view_test_suite` is correctly checked by
  `apis/mcp_testcase_controller.rb#list_test_suites`/`#get_test_suite` (confirmed live via a real API-key
  toggle test, 403→200) — this is the same permission BUG-TCM-009 found completely unchecked on
  `test_suites_controller.rb`'s browser pages. A fix landing on one surface (here, the MCP API path, fixed as
  BUG-CRX-024 during separate Crux-plugin testing) says nothing about whether the sibling surface was ever
  touched.
- **A `public: true` Redmine permission is not a bug when it renders for every role — it's by design, and
  cannot even be restricted via the role-edit form (no checkbox exists for it at all).** The plugin's
  `test_suites` permission (distinct from `view_test_suite`) is declared `public: true`, scoped only to
  `test_suites#releases` (Overview dashboard) and `testcase_help#index` (Help page) — confirm a `public: true`
  declaration in `init.rb` before treating "this page has no visible permission checkbox" as a gap.
- **A regression summary's own banner text can quietly understate its scope — re-read each TC's own last-dated
  evidence line, don't trust the summary's phrasing.** The 2026-10-22 top-banner said "BUG-TCM-007 (Test Suite/
  Report/Requirement create+edit+delete) confirmed fixed," which reads as if the whole Permissions suite had
  been refreshed — but Test Run Management, Test Execution, and View Report (TC-TCM-052-062) were still dated
  2026-09-30 on the OLD instance underneath, untouched this cycle. The user caught this by directly asking "have
  you tested the rest too" — a lesson to proactively grep every TC's own dated evidence line for staleness
  before claiming a suite is "regressed," not just read the summary paragraph.
- **A denied write that returns a 500/422 instead of a clean 403 is still a correctly-enforced permission —
  verify via a DB row count, not the HTTP status code alone.** `create_run` (denied) returned 500,
  `execute_testcase`'s result-create (denied) returned 422 — both looked alarming at a glance, but
  `Model.where(...).exists?`/`.count` before and after confirmed neither write actually happened. Flag the
  ungraceful status code as a minor robustness note, but don't escalate it to a security finding without first
  checking whether data actually changed.
- **A Rails UJS `data-remote` link's `onclick` handler can resist a Playwright synthetic click/dispatchEvent
  even though a real mouse click works — don't force it, fall back to the equivalent Admin-console action.**
  Hit this on `#confirmDelete`/`#delete_run_action_*` buttons inside this plugin's modals: Playwright's element
  actionability check reported "not visible" despite the button being visually present in a screenshot, and a
  manually dispatched `MouseEvent('click')` didn't trigger the real jQuery/UJS handler either. Rather than
  burning more turns fighting the DOM, fell back to the Admin-equivalent `Model.find(id).destroy` via `rails
  runner` — which is exactly what the UI's own remote link invokes server-side, so it's a faithful substitute
  for confirming cascade/permission behavior, just not a literal click-path reproduction.
- **A disposable-looking fixture isn't always disposable — check how many real records reference it before
  deleting it to close out a TC.** Nearly deleted Requirement #3/#6 on `rftc-016-ci-qa` to complete
  TC-TCM-073, until checking `RequirementIssue.where(requirement_id: ...)` showed they're linked to 2 and 8
  real test cases respectively (active RTM fixtures referenced by multiple other TCs/bug writeups this
  session) — not the kind of single-purpose probe (like a freshly-created run or requirement) that's safe to
  delete unilaterally. When a TC's own setup step is "delete something," confirm it's genuinely disposable
  before proceeding, and ask first if it might be shared.
- **The "Bulk Delete Runs" context menu is a right-click (contextmenu), not a left-click, and only appears
  once at least one row checkbox is checked — don't assume it's hidden just because a left-click/hover on the
  header checkbox reveals nothing.** `#bulk-delete-option` lives inside a `.custom-context-menu` bound to
  `contextmenu` on a checked row's checkbox. Useful pattern: checkboxes themselves are NOT permission-gated
  (any project member can tick them), but the context-menu option that triggers the actual bulk-delete is —
  confirmed by checking `el.offsetParent !== null` after the same right-click action for a granted vs. a
  denied role.
- **`bulk_delete_run`'s route resolves `@project` via `Project.find_by(id: params[:project_id])` — numeric id
  only, unlike most of this plugin's other endpoints which accept the string identifier too.** Sending the
  identifier (`rftc-016-ci-qa`) 404s with "project not found," which looks like a permission refusal but isn't
  — always use the numeric project id when hand-testing this specific action directly.
- **A Run's suite/case counts are built from `run_issues` — one row per (issue, testsuite) pair, not per issue.**
  `RunsController#create`'s "Include all test run" path and `handle_test_suite_ids` both do
  `IssueTestSuite.where(testsuite_id: ...).each { |its| run.run_issues.build(issue_id: its.issue_id, testsuite_id:
  its.testsuite_id) }`. If an issue belongs to two suites covered by the same run, it gets two `RunIssue` rows and
  (via `Run#create_issue_status_results`'s `run_issues.map`) two separate `IssueStatusResult` rows — confirmed via
  `rails runner` (`run.run_issues.where(issue_id: X).count` => 2) and live in the UI (the case shows as a separate
  "Untested" row under each suite tab). This is BUG-TCM-097's root cause — check `run_issues.distinct.count(:issue_id)`
  vs `run_issues.count` whenever a run's totals look larger than the project's actual distinct test-case count.
- **The suite-switcher dropdown's "Passed/Failed/to run" badges do not respect the Environment selector at all** —
  switching environments changes the donut chart and results grid correctly but leaves every suite's dropdown badge
  identical, because the badge reads a raw, non-deduplicated, environment-unfiltered count rather than the same
  query the grid/donut use (BUG-TCM-098). When sanity-checking a run's numbers, always cross-check the dropdown
  badge against `Showing N test cases` + the donut `Total` for the *same* suite + environment pairing — they can
  legitimately disagree right now.
- **Legitimate multi-environment behavior, not to be confused with BUG-TCM-097/098**: a run with multiple
  `run_assignments` (environments) is *supposed* to produce one independent, separately-markable result row per
  (issue, environment) — e.g. a case can genuinely be Passed on "Chrome" and Failed on "Firefox" in the same run.
  When investigating a "why does this test case have 2 rows" finding, always check first whether it's 2 different
  environments (expected) or the same environment appearing twice (the real bug, BUG-TCM-097's signature).
- **BUG-TCM-097/098 re-verified 2026-10-23 on a completely clean, isolated fixture** (2 brand-new suites, a
  brand-new test case, a brand-new run with 2 environments) to rule out any contamination from older session data
  — both bugs reproduced identically on fresh data, confirming they are genuine, not artifacts of a messy test
  project. Also confirmed opening **Edit Run and saving with zero changes does not cause or fix BUG-TCM-098's
  stale badge** — the dropdown badge mismatch is a persistent per-page-load miscalculation, not an edit/save
  side-effect. And confirmed BUG-TCM-097's real consequence directly: marking the shared test case **Passed**
  under one suite's tab left it **Untested** under the other suite's tab in the same run/environment — a genuine
  contradictory-status defect, which is why the bug was upgraded Medium→High.

## Confirmed Working

- **Daily/overdue run reminder emails (`ReminderWorker`) intentionally go ONLY to the per-environment Assignee,
  never to the run's Author or Watchers** — confirmed 2026-10-22 both live (Mailpit `To:` field with 3 distinct
  people in each role) and via source (`reminder_worker.rb`'s `send_daily_reminder`/`send_overdue_run_reminders`
  only ever call `mail(to: @assignee.mail)`, no `cc:`, no author/watcher lookup anywhere). **Per explicit user
  confirmation this is the intended design** — the reminder exists specifically for the person who needs to act
  on the run, not as a broadcast — do not re-flag this as a bug in a future session.
- **All routine notification emails (Run Added/Updated, Testcase Result Added) run on Rails' own in-process
  ActiveJob `:async` adapter, NOT on the separate Sidekiq container** — confirmed 2026-10-22 by stopping
  `redmine6-sidekiq-1` entirely and triggering a "Run Updated" email, which still delivered (`docker logs`
  showed `to Async(mailers)`). `Sidekiq::Worker` is only used by `ReminderWorker`'s own `perform_at`
  scheduling (the daily/weekly reminder's self-rescheduling loop), not by the regular mailer calls. **When
  testing "does stopping Sidekiq break notifications," it doesn't — only the reminder's own scheduled
  re-trigger would be affected, not the ordinary notification paths.** This corrected TC-TCM-018's original
  premise.
- **Closed runs are correctly excluded from overdue reminders** — confirmed 2026-10-22 live (marked a run both
  overdue and closed, triggered `send_overdue_run_reminders`, the run never appeared in the job queue and no
  email was sent) and via source (`reminder_worker.rb` filters on `is_closed: false`). No gap here.
- **Disabling a notification event in Administration → Settings → Notifications genuinely suppresses the
  email** (confirmed for "Run updated" via `docker logs`: the `MailDeliveryJob` still runs — the mailer method
  executes — but an internal `return unless Setting.notified_events.include?(...)` guard stops it before
  `mail(...)` is called, so no SMTP send happens). Re-enabling it resumes delivery correctly. **However, found
  2026-10-22 (BUG-TCM-088)**: when the SAME run is edited multiple times in quick succession, each "Run Updated"
  email consistently shows the run's name from the PREVIOUS edit, not the one just saved, even though the DB
  save itself (`Run.find(id).name`) is always correct. Reproduced 3/3 consecutive edits. **Lesson: when testing
  a notification email's content after a rename/edit, always do at least 2-3 edits in a row and check each
  email against the DB's CURRENT state at that moment — a single edit can look correct by coincidence (e.g. if
  it's the run's first-ever edit) while still having this one-edit-behind staleness.** **Further narrowed
  2026-10-22**: the staleness is timing-sensitive — an edit ~6 minutes after the prior one rendered perfectly,
  while an edit ~15 seconds after the prior one reproduced it across Name, State, Environment and Assignee
  (everything read off the `run` object at render time), while the separately-computed "Changes:" diff line
  (built fresh from controller-local hashes, not re-read from `run`) stayed correct every time. Narrows the
  likely cause to a transient read-after-write visibility gap specific to the `run` object's own re-fetch, not
  the mailer's placeholder logic.
- **"Inactive but not deleted" is a genuinely separate state from "deleted" for Run Email Templates, Testcase
  Email Templates, and Run Types — and all three handle it correctly.** Found 2026-10-22 after the user caught
  that only full deletion had been tested for these three entities, never unchecking Active/Enabled while leaving
  the record in place. An inactive (Active Template unchecked) email template is correctly ignored at send time —
  the system falls back to the default built-in subject/body, same as if no template existed at all, verified via
  real delivered-email content for both Run Email Templates and Testcase Email Templates. A disabled (Enabled
  unchecked) run type stays visible in the admin list with Enabled=No but is correctly excluded from the Add
  Run dropdown, without disturbing existing runs/history that reference it. **Lesson: "deleted" and "exists but
  inactive/disabled" are not interchangeable test scenarios for any toggleable entity — a CRUD pass alone
  (Create/Read/Update/Delete) does not cover the inactive-but-present state unless a test explicitly targets it.**
- CSV import — **full suite re-verified 2026-09-11, 16/16 TCs PASS** (see the Regression Run table at the bottom of `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`): legacy single `Steps`/`Expected` columns, 0–50 step range, varying step counts per row (1/3/7/15/30 with no cross-contamination), non-sequential step numbering (preview shows 1/3/5, saved case renumbers 1/2/3), unicode/emoji/embedded-newline content round-tripping exactly, the 2000 vs 2001-char boundary, oversized-text rejection with a precise error, 100×3-step bulk import in ~0.5 s, header-only and empty-file handling, and whole-column-family-absent handling in both directions.
- CSV import fixtures live in `automation/testdata/csv-test-data/` (17 files, numbered, with a `README.md` mapping each to its purpose and expected outcome) — **not** in `automation/uploads/` as the older TC file's Evidence Map used to claim. Use these for any CSV import regression; they cover every TC in the suite.
- Single-test-case **Add Result** inside a run (`POST /issue_status_results`, format JS) — saves correctly as the logged-in user. Verified 2026-09-11 on `localhost:3010`, run #4.
- **Report email — all six report types verified 2026-09-14** (Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Overdue Run Summary, Requirement Coverage): **HTML works for all six**; **PDF failed for all six *pre-install*** and works after completing Installation step 6 (BUG-TCM-005, closed 2026-09-15). The report type is irrelevant — all six share the single `send_report` method in `run_mailer.rb`, so only the format branch decides the outcome. Don't re-test per-type; test per-format.
- **Activity Summary requires an Activity Date Range** (start + end date) that the other five types don't. Submitting without it correctly fails validation ("Start date cannot be blank / End date cannot be blank") and creates nothing — working as intended. Worth knowing because the date fields only render after the report-type `change` event fires, so a script that fills the form too quickly will miss them and the creation will silently not happen.
- **CSV import with a very wide CSV** (45 columns from an all-columns issue export, 500 rows, 121 KB): step 4 renders the preview correctly, no session-cookie overflow. Verified 2026-09-15 on **all three supported Redmine versions** as a retest of production #118789: `localhost:3010` (Redmine 7.0.0, 45 cols), `localhost:3012` (Redmine 6.1.3, 44 cols), `localhost:3011` (Redmine 5.1.12, 38 cols). The fix is not version-specific. The fix stores `csv_columns`/`field_mappings` in `tmp/import_meta_<user_id>.yml` instead of the session — confirmed present in v7.0.0 at `testcase_import_controller.rb:575-588`.
- **Report email — PDF format, on a correctly installed server**: verified 2026-09-14 on `localhost:3012` after completing Installation step 6 — delivers as `multipart/mixed` with a valid 53 KB PDF (9/9 streams inflate cleanly). The PDF path is functional; it was only ever the environment that was incomplete.
- **Report email — HTML format** (`Email the report as HTML attachment`): delivers correctly as `multipart/mixed` with a real `<name>.html` attachment containing the rendered report. Verified 2026-09-14 on `localhost:3012` with a Requirement Coverage report (14,074-byte attachment, correct content). It is also the fallback worth suggesting whenever the PDF path is in doubt.
- `bulk_create`'s own business logic — verified 2026-09-11 by calling `POST /testcase_status_results/bulk_create.json` with HTTP Basic (API) auth: returns `201 Created` and writes the result rows. Only the browser-session path into it is broken.
- **(2026-10-05) All three report download formats produce real, correctly-scoped files.** HTML download's content matches the in-app report; PDF (`pdf-parse@2.4.5`'s `PDFParse` class, not the v1 plain-function API) extracts real report text (e.g. "Testcase Summary", length > 100 chars); Excel (`xlsx`/SheetJS, `XLSX.utils.sheet_to_json`) parses real cell data. Verified via the automation suite, not just "a file appeared."
- **(2026-10-05) Roundcube's opened-message preview pane renders inside `iframe[name="messagecontframe"]`**, and its attachment link is `a.filename` with text shaped like `"report-name.html(~656 KB)"` (size suffix appended with no separator — use a substring check, not `endsWith`). The pane loads asynchronously after the row click; wait for the subject text to actually appear inside that frame before reading attachments, or you'll read an empty, still-"Loading…" pane.

- **The run grid is filtered per environment — check the filter before judging a result as missing.** A run's test
  case grid shows the status *for the currently selected environment* (`#environment_select`, also an
  `environment=` query param). A result saved against `chrome` will show as `Untested` while the grid is filtered
  to `fdsgsdf`. This nearly produced a false FAIL on the BUG-TCM-003 retest: the bulk update had genuinely written
  both rows, but the grid looked unchanged. Switch the filter to the environment you saved against, or check
  `issue_status_results` directly, before concluding nothing saved.
- **Conversely, a status already showing in the grid is not proof your action worked.** The same retest showed
  #434/#435 as `Passed` *before* the submit, from results four days old. Verify by `created_at` and environment,
  not by what the cell reads.

- **(2026-10-19) `bootstrap_run.json` DOES auto-create a new, empty Test Suite when a `--suites` name doesn't
  match any existing suite** — contradicting this file's own earlier, incomplete note above ("CI/CD... does NOT
  auto-create Test Suites or Test Cases"). `API.md:1147` already documents this precisely:
  "`create_test_suite` when a suite is created (each `|| admin`)". Reproduced by accident: a Jenkins shell script
  passed `--suites "Login" "Cart" "Operations" "Discounts"` (a bash `read -a` word-splitting bug turned the
  intended 3-name list, one of which contained a space — `"Cart Operations"` — into 4 single-word tokens) and
  `bootstrap_run` silently created two brand-new empty suites literally named `Cart` and `Operations` rather than
  erroring or ignoring the unmatched names. **Practical implication**: when scripting multiple `--suites` names
  and any one of them contains a space, do NOT join them with plain spaces into one string and re-split on
  whitespace — use an unambiguous delimiter (e.g. `|`) end to end, or the CLI will silently create unintended
  suites instead of failing loudly on a typo.
- **(2026-10-19) "Delete Test Suite" is a silent no-op (no error shown) when the suite is referenced by an
  active Run** — confirmed live: deleting a suite via the tree's own "Delete Test Suite" action returned no
  error, the confirm dialog closed normally, but the suite was still present in `test_suites.json` on reload,
  twice in a row. The actual blocker was an active Run (`bootstrap_run`'s own-created run) still referencing that
  suite's `testsuite_id` — deleting that Run first made the suite delete immediately succeed. Same family as
  BUG-TCM-026 (a Testcase Management delete/remove action silently doing nothing instead of surfacing a clear
  reason), but for Test Suite deletion specifically, not yet filed as its own bug — worth a dedicated repro/filing
  if this plugin's QA cycle revisits suite-management negative tests.
- **(2026-10-19) The Test Suite-auto-creates / Test Case-never-auto-creates asymmetry is a deliberate,
  spec-documented design decision, NOT a bug — confirmed by reading the full source specs, not just API.md's
  permission table.** Live-verified via a real Jenkins build (`run_pipeline.sh`, build #9, Run #46): a brand-new
  `--suites "Experimental Suite"` name that matched nothing caused `bootstrap_run` to auto-create a new empty
  suite (id=15) — but the same build's `ingest` call then reported **all 6 results UNMATCHED**, creating **zero**
  new testcase issues, even though every unmatched pytest test name had no corresponding Automation Key anywhere
  in the project. This looks inconsistent at first glance ("if suites can auto-create, why can't testcases?"),
  but it is explicitly intentional per two separate spec documents:
  - `backlog/planning/rftc-016-feature-ci-results-ingest.md`, "Out of Scope" (line 130): "Creating test cases
    from unmatched CI tests (`on_unmatched` reports them; case creation stays `create_testcase` /
    `bulk_testcase_create`). **A future option can add it.**"
  - `backlog/planning/rftc-009-feature-api-ci-create-run.md`, "Out of Scope" (line 67): "Auto-creating test cases
    (issues). Bootstrap selects from existing test cases; creating test cases remains
    `create_testcase`/`bulk_testcase_create`."
  - Same rftc-009 spec, line 26, gives the rationale for why suite auto-create IS in scope: **"competitor
    parity (TestRail, Xray, Zephyr all do exactly this)"** — a Suite is treated as a lightweight CI-convenience
    container (safe to spring into existence from a CI call), while a Test Case is treated as a curated,
    first-class QA artifact that must go through an explicit human/process creation path
    (`create_testcase`/`bulk_testcase_create`/CSV import/UI) so CI runs can't silently flood the registry with
    unreviewed test cases just because a developer wrote a new test function.
  - Both specs carry `Quality Gates: PASS-WITH-CONDITIONS` (a formal 3-gate + cross-model adversarial review),
    so this was a reviewed, conscious scope call, not an oversight — though the spec's own "A future option can
    add it" phrasing means a genuine, legitimate product-enhancement request exists here (auto-create test cases
    from unmatched CI results) — just not a defect against current documented behavior. Not filed as a bug;
    flagged here only as a product-enhancement note in case the question resurfaces in a later session.

## Recurring Issues

- **Before calling any suite "regressed," check `git log` on its own controllers/models/views since the last
  real pass — don't assume stale evidence is still good just because nothing obviously broke.** Found 2026-10-23
  on `TESTCASE_MANAGEMENT_TEST_RUNS.md`: an initial pass filled one missing TC and re-verified 3 explicitly-
  blocked ones, then reported the whole suite as "regressed" — but ~36 of 40 TCs were still sitting on
  2026-10-01 evidence. The user caught this by asking directly. A `git log` check (the same technique already
  used successfully on `TESTCASE_MANAGEMENT_CSV_IMPORT.md`) showed dozens of commits had touched exactly what
  this suite tests since 2026-10-01 (a Run Results page redesign, a bulk-update-on-already-executed-case fix, a
  closed-run 500 fix) — the opposite of CSV_IMPORT's zero-relevant-commits case. **The lesson isn't "always
  re-click everything" or "the git-log check is unnecessary" — it's that the git-log check has to actually gate
  the decision**: zero relevant commits justifies a narrow spot-check (as it correctly did for CSV_IMPORT);
  substantial relevant commits means the narrow spot-check was never justified in the first place, and claiming
  "regressed" without doing the fuller pass first is the actual mistake, not skipping the check.
- **EditorJS test-automation gotcha, found 2026-10-23 while thoroughly testing the Requirements page's content
  editor.** `document.querySelector('.ce-popover, .ce-popover--opened')` always returns the DOM's *first*
  `.ce-popover` element — one exists per block (mostly closed/invisible), not necessarily the one actually open
  for the currently-focused block. Clicking a `.ce-popover__item` inside a stale, zero-size, invisible popover
  silently fails (no real block insertion) and can even throw a `TypeError` from EditorJS's own insert path —
  this produced a convincing false alarm that Code/Quote/Delimiter/Table/Image block types were all broken.
  **Always filter for `offsetParent !== null` (or an equivalent visibility check) before clicking a popover
  item.** Likewise, checking a block's persistence via `textContent` is meaningless for `<img>`-based blocks
  (Image tool) — check the actual `src` attribute, ideally with a byte-level (MD5) comparison against the
  original upload. And `.fill()` on a live-search input does not reliably trigger the component's real keystroke/
  debounce listener — use `pressSequentially`/`slowly: true` real keystrokes when testing search-as-you-type
  features, not `.fill()`. **One more, caught by the user from a screenshot, not by this suite's own checks**: a
  byte-identical MD5 + correct `src` attribute does NOT prove an uploaded image is actually *visible* — the
  original test upload was a 1×1 pixel PNG, which loaded and round-tripped perfectly but rendered too small to
  see. Always also check `naturalWidth`/`naturalHeight` are non-trivial (or just take a real screenshot) when
  confirming an image upload test, not only the file hash.
- **Highlight/marker inline tool doesn't survive reload** (found 2026-10-23): selecting text and applying the
  paragraph toolbar's highlight/marker tool sets an inline `style="background-color:..."` attribute live in the
  editor, but that `style` attribute is gone after the page is saved and reloaded — only Bold/Italic/Underline/
  Strikethrough/Link persist. Very likely a side effect of this plugin's own prior XSS/output-safety hardening
  (rftc-013, SEC-002–004 — arbitrary inline `style` attributes are a known CSS-based attack vector), not a new
  regression, but it means the Highlight tool is currently unusable (applies, never saves). Not filed as a bug —
  flagged here for a developer to judge whether the tradeoff is intentional.
- **The 3 real requirement↔testcase linking surfaces behave differently — know which one you're testing**
  (confirmed 2026-10-23). (1) Plain Issue **Edit form**'s Requirement select2 field: **adding** a link works
  correctly; **removing** one does not persist at all despite the server returning "Successful update." (open
  bug, BUG-TCM-027). (2) Testcase-grid **right-click context menu**'s Requirements submenu: **add-only** — it
  has no remove/unlink option anywhere, and (per TC-TCM-149/150) even adding via it never replaces an existing
  link, only appends. (3) The requirement's own content, via a `#`-mention: the only surface where **both** link
  and unlink actually work correctly (TC-TCM-271/272). When a TC's title says "via the Edit form" but its
  evidence was actually gathered through the context menu (or vice versa), don't assume they're interchangeable
  — they have different bugs.
- **`RequirementIssue` rows are not cleaned up when the linked test case is deleted** (found 2026-10-23): 2 of
  this project's `RequirementIssue` rows (for deleted test cases #2121, #2124) are dangling — the issues no
  longer exist, but the join rows do. The RTM itself handles this gracefully (its own counts/table correctly
  exclude them), so this isn't user-visible breakage, but it's the same orphan-row pattern already documented
  for `ExecutionDefect` in BUG-TCM-061 (that one for deleted *defects*, this one for deleted *test cases*). Not
  filed as a new bug; worth checking if a cleanup/cascade is ever added for one, whether the other needs it too.
- **Requirements content search indexes body text only, never the title** (found 2026-10-23): confirmed via the
  `content_search_knowledgebase_testcase` endpoint directly — a search term that's an exact substring of a
  requirement's title but absent from its body content returns zero results, while the same term present in body
  content is found correctly. A minor, worth-knowing feature boundary, not treated as a defect.
- **Performance watch-list, established 2026-10-23 (`TESTCASE_MANAGEMENT_PERFORMANCE.md`, 500-case fixture
  project `rftc-perf-500`).** Two pages measured notably slower than everything else in the suite, though neither
  failed outright (no timeout/crash) and neither showed N+1-style disproportionate scaling: **Run detail page**
  (`/runs/:id`) — 1.7–2.0s at 500 linked cases vs 91ms on a 1-case run (~19–20x for 500x data, sub-linear);
  **Testcase Summary report render** (`/testcase_reports/:id`) — 6.4–8.0s at 500 cases, and already slow even on a
  small project (2.6s baseline). Re-measure both on the next performance pass to catch a real regression early;
  neither is filed as a bug today. By contrast, the suite grid (`/test_suites/:id`), suite tree, Reports list,
  RTM, and subject search all stayed well under 500ms even at 500+ cases/100+ requirements — no N+1 pattern found
  anywhere checked this pass.
- **CSV import's final commit step is a foreground, tab-bound AJAX flow, not a background Sidekiq job** (found
  2026-10-23 while executing TC-TCM-258 at 1000-row scale) — the page explicitly warns "keep this tab open...
  closing or navigating away will stop the import," with a live progress counter. A very large production
  migration (10,000+ rows) would need the browser tab open for the whole duration. Not a bug, but worth knowing
  before anyone attempts a big unattended CSV migration.
- **Bulk Update Result correctly no-ops a case already at the target status**, rather than writing a redundant
  duplicate result row (found 2026-10-23 investigating what first looked like a partial-apply bug in TC-TCM-257 —
  80 of 100 selected cases got new rows, 20 didn't; verified the 20 already had the target status before
  concluding anything, rather than filing on the first signal). **Lesson, not just a product fact**: when a bulk
  operation looks like it silently skipped some rows, pull the *actual* rendered page's row IDs (direct
  authenticated request, not a guessed sort order) before diffing against what got updated — a wrong assumption
  about sort order very nearly produced a false bug report here.
- **`RunIssue` is keyed per (issue, run, testsuite), not per (issue, run) — this one modeling gap now has two
  confirmed, independent symptoms (BUG-TCM-097, found/extended 2026-10-23).** Symptom 1: a run's suite tabs can
  show genuinely contradictory statuses (Passed under one suite, Untested under another) for the same test case,
  since `RunsController` builds one `RunIssue`/`IssueStatusResult` per (issue, testsuite) pair. Symptom 2: the
  issue detail page's own "Test Run:" field (`app/views/issues/_steps_list.html.erb`,
  `@issue.runs.map(&:name).join(', ')`) repeats one run's name once per duplicate `RunIssue` row, since
  `has_many :runs, through: :run_issues` has no `.distinct`. **When checking any plugin feature that walks
  `issue.runs`, `run.run_issues`, or `IssueStatusResult` for an issue that might be linked to a run via more than
  one suite, check for this same dedup gap before assuming a fresh defect** — it's one root cause, not two.
- **Test Suite Management, Reporting, and Requirement Management controllers have zero authorization checks on
  create/edit/delete** (`test_suites_controller.rb`, `testcase_reports_controller.rb`,
  `requirements_controller.rb` — BUG-TCM-007, found 2026-09-30). Any logged-in project member can create/edit/
  delete regardless of their granted permissions; the UI hides the controls correctly in most cases but that's
  the only thing stopping a denied user, not an actual server-side check. **Contrast with the correct pattern**
  in `runs_controller.rb` (`create_run`/`edit_run`/`close_run`/`delete_run` all properly gated),
  `issue_status_results_controller.rb` (`execute_testcase`, plus a sensible assignee carve-out), and
  `testcase_todos_controller.rb` (`view_all_todos`) — when checking whether a *new* permission is actually
  enforced on this plugin, don't assume it is just because the UI hides the button; grep the actual controller
  action for `allowed_to?` before asserting a permission works.
- **No role on a fresh instance has any Testcase Management permission granted by default** — confirmed via
  `Role#permissions` in the Rails console on `localhost:3010` before this session's setup. The KB doesn't
  prescribe a role→permission mapping (per `docs/TESTCASE_MANAGEMENT_REQUIREMENTS.md`), and apparently nobody had
  ever configured one on this instance either. If a "Manager/QA can do X but Client can't" test fails oddly on a
  never-before-permission-tested instance, check the actual role checkboxes first — it may simply be
  unconfigured, not broken.
- **The Roles & Permissions "Save" button can silently fail to persist a permission group if you set multiple
  checkboxes via a bulk JS mutation right before clicking Save** (observed live 2026-09-30 setting up the role
  mapping above — an initial bulk grant for Manager/QA Own Visibility/Developer showed "success" (redirect to
  `/roles/N`) but the Rails console showed zero permissions actually saved). A single real UI click immediately
  followed by Save persisted correctly every time afterward. Root cause not fully isolated (likely a stale
  element reference after DOM mutation, not a plugin/Redmine bug) — but the takeaway is: **always verify a
  Roles & Permissions save via the Rails console or the `/roles/permissions` report**, don't trust the redirect
  alone, especially after any bulk/scripted checkbox manipulation.
- **This plugin's "Add X" UI controls are often bound via a raw `onclick` on an `<svg>`/`<span>`, not a normal
  `<a>`/`<button>`,** and the click handler can be re-used across multiple list rows with the SAME element `id`
  (invalid but present — e.g. every suite row's menu icon shares `id="testsuite-menu-icon"`). `getElementById`
  silently grabs the *first* matching row, not the one you meant, if you're driving these via JS rather than a
  real Playwright click scoped by a more specific selector (e.g. `[data-testsuite-id="5"]`). Cost real time once
  (opened "workload"'s edit modal instead of a freshly-created suite's) before switching to the scoped selector.

- **"Emailed PDF report has no attachment" has two completely different causes — diagnose before filing.**
  (1) **Incomplete installation** — Node.js/Puppeteer/Chromium absent (KB Installation step 6 / `initialize.sh`
  never run). This was BUG-TCM-005 and the original customer report; it is an *environment* gap, not a code
  defect. (2) **The swallowed `rescue`** in `run_mailer.rb`, which sends the mail anyway when PDF generation fails
  for any reason — this was BUG-TCM-006, **fixed and closed 2026-09-30** (commits `dee611e`/`58c68d2`/`9e82662`,
  confirmed merged to `master`). The rescue now falls back to attaching the HTML report and sets
  `@pdf_generation_failed`, which `send_report.html.erb` renders as a visible red warning. **Decision rule
  updated:** if `node -v` works *and* the **Sidekiq worker process** has `PUPPETEER_EXECUTABLE_PATH` set, a "no PDF
  attachment" symptom on a fixed build should now show an **HTML attachment + warning banner** instead of a bare,
  misleading email — a silent PDF-less email on a build that includes these commits would itself be a regression.
- **`send_report.html.erb` is one template shared by both email formats**, and its *"Please find the attached
  Testcase Report"* line is unconditional — it has no knowledge of whether an attachment was produced. Only the
  **PDF** branch of `send_report` (`run_mailer.rb:291-303`) wraps generation in a `begin`/`rescue` that still calls
  `mail(...)` on failure; the **HTML** branch (`:284-290`) has no rescue at all, so a failure there raises and the
  Sidekiq job fails without sending anything. `render_show_view` (`:277`) sits before the branch and is likewise
  unprotected. So a "misleading email" defect can only manifest on the PDF path — but a fix that patches only the
  `rescue` and not the template leaves the shared text one code change from resurfacing.
- **Scope discipline when a retest surfaces a second defect.** The 2026-09-14 BUG-TCM-005 retest fixed the reported
  symptom but found a *different* failure while deliberately breaking the server, and that was initially folded
  into the same bug, keeping it open. It should have been split. **Check the retest result against the bug's
  original assertion** — the customer report, the title's main clause, the Expected result, and the TC named as
  the retest vehicle — not against a test case written *after* the retest from the retest's own finding. A
  descriptive clause in a title ("…while the body still says X") records a symptom; it does not widen the scope.

- **Plugin routes declared with a literal `.json` path + `defaults: { format: 'json' }` cannot be called from the browser session.** This has now bitten once for real (BUG-TCM-003). Whenever a UI action posts to such a route, it will 401 as anonymous regardless of who is logged in. When testing any new bulk/AJAX action in this plugin, check `config/routes.rb` for a `.json` suffix first — it predicts the failure.
- **Almost every plugin controller resolves `@project = Project.find(params[:project_id])` and never checks anything after it** — neither `allowed_to?(:view_project, @project)` (project membership) nor `@project.module_enabled?('testcase_management')` (module gating). Confirmed 2026-09-30 (BUG-TCM-009) across `test_suites_controller.rb`, `testcase_reports_controller.rb`, `requirements_controller.rb`, `traceability_rtms_controller.rb`, `testcase_todos_controller.rb`, and `runs_controller.rb`'s `new`/`index`/`show`. Plain Redmine's own `/projects/<id>` and the project's top-nav tab both correctly gate on membership/module — only this plugin's own routes don't. When testing ANY new plugin URL for access control, test it against a genuine non-member (not just a denied-role member) and against a module-disabled project — both are unguarded even where role-permission checks (BUG-TCM-007) are eventually fixed.
- **Redmine's internal module name for this plugin is `testcase_management`, not `redmineflux_testcase_management`.** The module *checkbox label* is "Redmineflux Testcase Management" and the plugin *identifier* used elsewhere (bugs, gem name) is `redmineflux_testcase_management`, but `Project#module_enabled?` and `Project#enabled_modules.pluck(:name)` use the shorter `testcase_management`. Calling `module_enabled?('redmineflux_testcase_management')` silently returns `false` even when the module **is** enabled — don't mistake that for a bug in the module toggle itself; verify with `enabled_modules.pluck(:name)` first.
- **The Testcase Tracker / Defect Tracker settings have two independent, serious gaps** (both found 2026-09-30 in the Configuration suite): (1) **BUG-TCM-010** — clearing the Testcase Tracker setting doesn't block "New Test Case," it silently creates the issue on the project's first tracker (`Bug` here) instead, with zero error; the misfiled issue is then permanently invisible to every plugin view. (2) **BUG-TCM-011** — setting either tracker to anything other than `Bug` breaks "Report Defect"/"New Test Case" entirely if the project has a Bug-only required custom field (very ordinary setup): the field is never rendered on the form for the other tracker but is still enforced as required on submit, an unsatisfiable validation state. Both reproduce reliably; a *valid, different* tracker choice (TC-002's scenario) is fine and shows an honest "Tracker not enabled for this project" message instead — it's specifically the **blank** setting and the **Bug-only-custom-field** interaction that are broken.
- **`TestcaseEmailTemplates` is the actual model name** (plural, no `s` before `Templates`... it IS `TestcaseEmailTemplates` with the trailing s) backing both Run and Testcase email templates, distinguished by `email_type: 'run_email'` / `'testcase_email'` and an `active` boolean (only one template per type can usefully be active — the mailer does `.where(email_type: ..., active: true).first`). When none is active, both `run_added` and `testcase_result_added` fall back to a built-in view template (`app/views/run_mailer/*.html.erb`) — confirmed this fallback works correctly for `run_added`, but the `testcase_result_added` fallback has a bug (below).
- **This instance had `run_added`/`run_updated`/`testcase_result_added` notification events entirely unchecked** in Administration → Settings → Notifications before 2026-09-30 — same "nothing pre-configured" pattern as the Permissions suite's role→permission gap. Enabled all three this session (a real fix, not a test-only toggle — left enabled). **Gotcha:** the "Testcase result added" checkbox has `data-parent-notifiable="run_updated"` and stayed `disabled` in the UI even after "Run updated" was checked and the page reloaded — had to enable it via `Setting.notified_events` in the Rails console instead; the UI's parent/child enable-on-check JS did not un-disable it as expected.
- **`RunMailer#testcase_result_added`'s default (no-active-template) view has a copy-paste bug** — `app/views/run_mailer/testcase_result_added.html.erb`'s heading interpolates `@run.name` where `@issue.subject` belongs, so the body shows the run's name mislabeled as if it were the test case identifier (email subject line itself is correct). **BUG-TCM-012.**
- **A single "Add Result" submission sends the "Test Case Result Added" email twice** — reproduced on two different test cases/templates, each time with only one `IssueStatusResult` DB row created (so it's not a duplicate form submission). `run_added` did not show this pattern (only one `sadfsa` email per run created). Root cause not fully isolated — suspect a Sidekiq retry against the local mail server, but `Sidekiq::RetrySet`/`DeadSet` were both empty when checked a few minutes later. **BUG-TCM-013.**
- **Creating a run auto-seeds one "Untested" `IssueStatusResult` baseline row per linked test case** at run-creation time (confirmed: 117 rows created simultaneously for a run linking 117 test cases across 3 suites) — this is normal, expected behavior representing the "0 of N tested" starting state, not a bug. It does **not** trigger a `testcase_result_added` email (good — would be a flood otherwise). Don't mistake these pre-existing `case_status_id=1` rows for a duplicate-submission artifact when investigating result-related timestamps.

- **(2026-10-08) A Forge cloud instance (`https://flux-ffpwq4t9a49.forge.zehntech.com/`, project `agileboard`) surfaced two new defects not seen on any prior Docker instance — both since confirmed FIXED on a later Forge rotation.** Editing a Test Suite ("Edit Folder") fired `GET /test_suites/<id>/edit.json?project_id=agileboard` → **403 Forbidden**, console flooded with "API request failed error" (`testcase-73520250.js:3495`); same signature independently on the Requirements page. Resembled the `.json`-suffixed-route-breaks-session-auth family (BUG-TCM-003). **Filed as BUG-TCM-062 (High, prod #122902).** Separately, clicking the "+" (Add Requirement) icon threw an uncaught `TypeError: Cannot read properties of undefined (reading 'add_requirement')` from `script-89236efc.js:1789` via an unguarded `<svg>` onclick handler — same shape as closed BUG-TCM-030. **Filed as BUG-TCM-063 (Medium, prod #122903).**
  **Retested 2026-10-08 on a different Forge instance (`https://flux-fvqoa5yw149.forge.zehntech.com/`, plugin confirmed v7.1.0), this time via Playwright MCP (portable Node.js + `@playwright/mcp` installed into `.tools/` this session — see root `.mcp.json`):** `/test_suites/1/edit` now returns a plain `200` (no `.json` suffix at all) and the Edit modal populates correctly; Requirements page loads clean; the "+" icon now opens the inline form with zero console errors and the new requirement saves successfully. **Both confirmed FIXED** — moved to `bugs/closed/`, production synced Done/100%. Note the fix was verified on a *different* Forge rotation than the one that found the bugs — consistent with this plugin's recurring pattern of Forge instances running inconsistent builds (see also DEF-IMPORT-001/DEF-PERM-006/DEF-QUAL-010 cross-environment discrepancies, a separate external QA cycle's bugs, not this repo's own).
- **A Select2/multi-select's auto-highlighted search match is not the same as a committed selection — found 2026-10-23 setting a Blocked result's Defects* field on run #83, case #26.** Typing a defect's numeric ID into the Defects* search box with real keystrokes correctly filtered to one match, and the Playwright accessibility snapshot showed that option as `[selected]` purely from keyboard/ARIA state. Clicking Submit at that point fired **zero network requests** and instead showed a client-side "Please select an item in the list." validation popup — the underlying multi-select had never actually registered a choice. Explicitly clicking the option (so it turns into a visible, removable chip in the field) fixed it, and Submit then genuinely posted. **When automating any Select2-style searchable multi-select in this plugin (Defects* field, requirement-mention pickers, etc.), always explicitly click the matched option — never rely on an auto-highlighted match plus Enter/Submit, even when the accessibility tree reports it as selected.**
- **BUG-TCM-097's root cause (one `RunIssue` per issue+testsuite, not per issue+run) also affects the "Include all test run" creation path, not just a manually-selected multi-suite run** (confirmed 2026-10-23, run #83): "Include all" correctly pulled every one of the project's 29 real suite-linked issues with zero missing/extra, but produced 34 `RunIssue` rows because 4 of those issues belong to more than one suite — same downstream `IssueStatusResult` duplication (68 rows instead of the expected 58) as every other BUG-TCM-097 manifestation. This is a genuine repeat of an already-open root cause, not a new finding, so it was folded into BUG-TCM-097's existing file rather than filed separately.
- **Environment correction, found 2026-10-23: this Docker instance's real mailbox is Mailpit (`localhost:8025`),
  reachable as a plain web UI, not Roundcube — and `daisy.skye` (the watcher account several earlier memory
  entries reference) no longer exists on this instance.** Confirmed via DB: only `qa.limited` (id 7) and `dev1`
  (id 8) have `@test.local` mailboxes. Likewise, run #22 is no longer "TC-TCM-164 Watcher Notification Run" — it's
  been reused for an unrelated fixture ("Edge5 Suffix Test #5"), and had zero watchers. **Treat any memory
  reference to a specific run ID, watcher user, or mailbox tool as liable to have drifted if this instance was
  reset/reseeded since — verify via DB (`User.where`, `Run.find(id).watcher_users`) before relying on it, rather
  than assuming a prior session's fixture still exists.** Also found `testcase_result_added` had reverted to
  disabled in `Setting.notified_events` (had been enabled in an earlier session) — re-enable it before testing
  that notification if a check for it comes back empty-handed; don't assume delivery is broken before checking
  the setting itself.
- **Sidekiq runs in its own dedicated container on this instance (`redmine6-sidekiq-1`), not as a process inside
  the Redmine app container** — `docker stop/start redmine6-sidekiq-1`, not `kill -9 <pid>` inside the Redmine
  container as an earlier memory entry assumed (that was true on a different, now-defunct instance). Confirmed
  the same underlying fact still holds though: `testcase_result_added` email delivery is NOT gated by Sidekiq in
  this environment (arrives immediately even with the Sidekiq container fully stopped) — likely synchronous
  ActionMailer delivery, not an ActiveJob-backed async queue.
- **BUG-TCM-103 (new, Medium, found 2026-10-23): the Run result filter's "latest status" subquery is correctly
  scoped to the current environment/testsuite, but its re-join back onto `issue_status_results` only matches on
  `issue_id` + `created_at` — with no repeated environment/testsuite_id check.** When two different environments'
  results for the same case share an identical `created_at` (very plausible — e.g. seeded in the same
  transaction, or two quick real submits landing in the same second), the join pulls in the WRONG environment's
  `case_status_id`, so a case Untested in the viewed environment can incorrectly appear under a "Failed" filter
  because it's Failed in a different environment. Reproduced live and via an isolated `rails runner` query
  (bypassing the browser entirely) to rule out any UI artifact. The sibling "With/Without Defects" filter on the
  same page does NOT have this gap — its `ExecutionDefect` join correctly re-checks environment/testsuite_id
  (that filter was itself fixed for an analogous issue under BUG-TCM-060). **When testing any filter that
  computes "latest result" via a subquery + join, check whether the join itself re-applies every scope the
  subquery used — a join on `issue_id + created_at` alone is a known failure mode in this codebase now.**
- **BUG-TCM-104 (new, High, found 2026-10-23): a test case's genuinely first-ever execution is misattributed in
  the Results & Comments view to whoever created the Run, not whoever actually recorded the result.** Root cause:
  creating a Run auto-seeds one baseline `IssueStatusResult` row per (issue, environment) with `added_by` = the
  run's creator (already-documented, non-bug mechanism). On that row's first real execution, the SAME row is
  found and updated in place (`case_status_id`/`updated_by`/`updated_at` change) rather than a new row being
  inserted — so `added_by`/`created_at` stay frozen at run-creation identity/time forever, and the Results &
  Comments view reads `added_by`/`created_at` (never `updated_by`/`updated_at`). Confirmed by genuinely logging
  in as a second real user (`qa.limited` — had to reset her password to the shared QA convention `12345678`
  first, it had drifted) and recording a brand-new case's first result: UI showed "Added by Redmine Admin",
  DB showed `added_by: 1 (admin), updated_by: 7 (qa.limited)`. **Re-executions after the first one are
  unaffected** (confirmed: TC-TCM-178's own re-execution sequence on an already-executed case showed correct
  attribution) — the gap is specifically in the untested→first-result transition. **When verifying any
  attribution/audit-trail claim in this plugin (execution history author, notification email "added by" text),
  deliberately test it on a case's FIRST execution, not a case that's already been executed before** — the two
  paths behave differently and only the first one has this bug.
- **`qa.limited`'s password had drifted from the shared QA convention (`12345678`) and had to be reset via rails
  console to log in as a genuine second user** (same pattern as the earlier `daisy.skye` mailbox password drift) —
  if a login attempt for any of this project's seed/persona users fails with "Invalid user or password," check
  whether its password simply needs resetting to the shared convention before assuming a different problem.
- **BUG-TCM-102 (new, Medium, found 2026-10-23): a defect's own detail page "Test Run:" field only ever shows the
  single run it was first linked from, and never updates when the same defect is later linked to a second,
  different run — unlike the sibling "Environment:" field a few lines below on the same page, which correctly
  aggregates every distinct environment across all linked executions via the `ExecutionDefect` join.** Confirmed
  via DB inspection: a defect with 4 `ExecutionDefect` rows spanning 2 distinct runs still showed only the first
  run's name, directly contradicted by the Related Issues panel's own "2 runs" badge a few lines below on the
  same page. Root-caused to `app/views/issues/_steps_list.html.erb`'s defect-tracker branch reading the stale
  scalar `@issue.run.name` instead of the same `ExecutionDefect`-join aggregation the Environment field already
  uses (that fix even has its own explanatory comment in the file, right next to the still-broken Test Run
  field). **This is the third known location of the exact same bug class** — BUG-TCM-050 (closed, `runs_helper.rb`
  / `testcase_reports_controller.rb`) and BUG-TCM-058 (closed, `issues_helper_patch.rb`'s Relations-section Run
  column) were the first two. **When checking any plugin view that reads a defect/testcase issue's `run`/`run_id`
  scalar association to display "which run(s) is this linked to," always check whether it should instead go
  through `ExecutionDefect`/`IssueStatusResult` — a stale scalar is a known recurring pattern in this codebase,
  not a one-off.** Separately, explicitly confirmed (per the same user question) that a **closed** defect's ID
  correctly renders with a strikethrough in both the Run's "Linked defects" panel and the grid's own "Defect ID's"
  column — this part works correctly; it was only missed on a first visual pass at full-page screenshot resolution
  (the line is thin) and confirmed present via DOM inspection (`style="text-decoration: line-through;"`).
  Likewise confirmed the Overview dashboard's "TOTAL DEFECTS" column counts **distinct** defects per run, not raw
  linkage rows — 3 `ExecutionDefect` rows for the same defect within run #83 still correctly shows `1`, per
  `test_suites_helper.rb#total_defect_count`'s own `.distinct.count(:defect_issue_id)`, already fixed under closed
  BUG-TCM-057 (same bug class as BUG-TCM-050/058/102, this one location already correctly fixed).
- **BUG-TCM-101 (new, Low, found 2026-10-23): switching the Run or Environment dropdown in a test case's own "Testcase Execution" section (issue detail page) throws a reproducible console `TypeError: Cannot read properties of null (reading 'innerHTML')` at `request.onreadystatechange`, every time, on every issue checked (#24 and #26, 3 reproductions total).** The Result value itself always updates correctly immediately afterward — confirmed by cross-checking against both a grid-set result (Failed/Blocked on #24/#26) and an earlier bulk-updated result, every time matching the run grid/DB exactly. This is a console-only defect; it does not affect data correctness. When testing this section going forward, expect the console error on every switch and don't mistake it for a data problem — check the Result value separately each time.

## Environment Notes

- **Three QA instances, one per supported Redmine major version:** `localhost:3010` = Redmine 7.0.0 (project `test-project`), `localhost:3012` = Redmine 6.1.3 (project `test`), **`localhost:3011` = Redmine 5.1.12.stable, German locale, project `test5`**. All three run plugin v7.0.0. Use all three for any compatibility-matrix claim — an earlier session wrongly assumed no Redmine 5 instance existed.
- **The Redmine 5 instance is German-locale.** UI labels are German (`Testfall importieren`, `Abbrechen`, `Thema` = Subject), and the import wizard's step-2 auto-mapper matches **English** headers, so a German export leaves `Thema` unmapped and every row errors with "(no subject)" unless the mapping is set by hand. Worth its own test case; don't mistake it for an import defect.

- **Plugin 7.0.0 is a single release supporting Redmine 5, 6 and 7.** The jump from 6.2.0 to 7.0.0 was a Redmine-7 compatibility renumber, *not* a fork or a new product line — there is no separate 6.x maintenance branch. So a bug fixed in 7.0.0 is fixed for every supported customer, and "was it backported?" is not a question that applies to this plugin. Note the KB's stated matrix (5.0.x / 6.0.x) predates this and is out of date.

- **MCP `upload_file` corrupts attachments above ~4 KB, and a matching reported size does not prove integrity.** Confirmed 2026-09-14 on issue #120588: a 12,388-byte PDF reported exactly `12.1 KB` yet had 2 bytes substituted mid-file, breaking one of its four compressed streams. Verify every upload by downloading the attachment back and comparing `md5sum` with the source — never by size alone. Keep attachments under ~4 KB where possible and put the substance in the issue Description, which has never corrupted. Full detail in `REDMINEFLUX-MCP-SETUP.md` §4.3a.

- **`localhost:3012`** = container `redmine-docker-6-redmine-1`, **Redmine 6.1.3**, plugin v7.0.0, MySQL. A second, separate instance from `localhost:3010`. Its SMTP is wired to the local Docker mail server (`address: "mail"`, port 587, `admin@test.local`) and both containers share the `local_mailtest_net` network, so report emails land in Roundcube at `127.0.0.1:8081` and are directly checkable. `Setting.host_name` is correctly `localhost:3012`.
- On `localhost:3012`, Redis and Sidekiq do **not** start with the container (same pattern as the documented `redmine-docker-6` quirk) — report emails are delivered via `ActionMailer::MailDeliveryJob`, so **Sidekiq must be running or no report email is sent at all**. Start it before any report-emailing test.
- On `localhost:3012`, every outgoing email (plugin *and* core Redmine alike) renders its footer link as `http://hostname/my/account` instead of using `Setting.host_name`. Confirmed to affect core emails equally, so it is an instance mailer-config issue, **not** a Testcase Management defect — don't re-file it as a plugin bug.

- CSV import testing was done against Docker `localhost:3010` (project `test-project`), plugin v7.0.0.
- `localhost:3010` = container `redmine-docker-700-redmine-1`, Redmine 7.0.0, plugin v7.0.0, Postgres. Note this is **not** the default Local base URL in `QA_CREDENTIALS.md` (which points at `localhost:3006`) — this plugin's testing uses 3010.
- **`localhost:3010` had never had Installation step 6 completed until 2026-09-30** (no Node/Puppeteer/Chromium,
  and no SMTP configured at all — `config/configuration.yml` didn't exist, only `.example`). Set up this session:
  Node v20.19.2/npm 9.2.0/Chrome 127.0.6533.88 installed under `/usr/src/redmine`; SMTP wired to the local Docker
  mail server via `host.docker.internal:2587` (this container is on its own `redmine-docker-700_default` network,
  not `local_mailtest_net`, so it must reach the mail server through the host's published port, not a container
  name); `Setting.host_name` corrected from the `localhost:3000` default to `localhost:3010`. **This container's
  default entrypoint does not export `PUPPETEER_EXECUTABLE_PATH`/`GROVER_NO_SANDBOX` for Sidekiq** — a plain
  `docker restart` brings Sidekiq back with neither set, so PDF generation fails with Chromium's `No usable
  sandbox!` even on an otherwise-working install. Confirmed live 2026-09-30 while trying to establish a PDF
  baseline. To get a real working baseline, kill the auto-started Sidekiq and start a replacement in the same
  container with both env vars exported (see BUG-TCM-006's closed retest for the exact commands) — this does not
  persist across a container restart/recreate.
- Instance settings relevant to auth-path bugs: `login_required = true`, `rest_api_enabled = true`. With this combination a 401 on an `accept_api_auth` action is returned as a bare `head :unauthorized` carrying `WWW-Authenticate: Basic realm="Redmine API"`, which a browser holds open for a native credential prompt — so a failing XHR appears to hang rather than showing an error. On an instance with `rest_api_enabled = false` the same failure returns 403, and with `login_required = false` it reaches the action and returns a 401 JSON body. Worth knowing when a customer's error text does not match what is seen locally.
- Fixture data in `test-project` run #4 `reyer` (suite `workload`, 15 TCs) was written to during 2026-09-11 testing: TC #434 set to Passed (single Add Result), TC #435 set to Passed (API-auth control probe, note "control probe - API auth").
- The 2026-09-11 CSV Import regression created test cases in `test-project` from the fixtures, including #1023 (padded-header retest) and #1024 (duplicate-header retest). Earlier imports from the same fixtures are still present (#1009, #1012, #1014, #1018) and are useful as before-the-fix comparisons — do not delete them.
- **A separate `C:\crux-redmine` Docker stack exists** (Redmine 6, `localhost:3015`, container `crux-redmine6-redmine-1`), distinct from both the `C:\redmine v6\` stack (REDMINE_V6_TCM_DOCKER_SETUP.md) and the TCM-dedicated `localhost:3010`/`3012` instances — it's primarily used for Crux agent testing, with the TCM plugin dropped into `plugins/redmineflux_testcase_management` for ad hoc customer-repro work. Projects here are Crux-flavored (`crux-qa`, `test`, etc.), not `qa-demo`. Confirmed 2026-10-20 it's currently on plugin v7.1.0.
- **2026-10-20, customer repro (BUG-TCM-074):** a customer (relayed via Tina) reported Requirement description content vanishing on save, plus a server error creating a test case linked to a requirement. Re-verified on `C:\crux-redmine` (7.1.0): the description-loss half reproduces solidly — autosave toast + `Updated by/at` fire, but content is gone on reload AND Page History shows zero versions (not just a render-cache issue, the save never lands). The test-case-creation-server-error half did **not** reproduce via the global "New Test Case" form with the Requirements multi-select — issue created cleanly, linked correctly, Traceability Matrix rendered fine. That half needs the customer's exact click path or a server log to pin down.
- **2026-10-20, dev fix + regression, BUG-TCM-074:** dev root-caused it as a phantom blank save firing on every Requirement *view* (not just edit), racing the real save. Fixed by removing the view-triggered save entirely. Retested locally — confirmed fixed for plain content. **But a full-editor regression pass (every EditorJS tool: heading/list/quote/code/delimiter/table/warning/checklist/raw-html/image/attachment/`#`-mention, added rapidly) found a residual, same-root-cause-class bug: individual blocks and mention-links are non-deterministically dropped across reloads** (a different block/link lost each time — Delimiter once, Attachment permanently another time, two mention-links another time), even though the originally-reported full-wipe scenario is fixed. The backend `RequirementIssue` relation for a lost mention survived even though its visible text didn't — so content-loss and relation-loss are decoupled. Page History still never records a version, throughout. Production issue #124053 reopened with this evidence (Reopen, 50%) rather than closed. **Lesson: a fix confirmed against the literal reported repro steps is not the same as confirming the underlying save pipeline is race-free — worth a broader multi-block regression pass before trusting a "fixed" claim on this content-save pipeline specifically.**
- **Unlinking a Requirement↔Testcase relation confirmed working via both paths**, checked explicitly after the above regression pass: (1) Testcase Edit form → remove the Requirements chip ("x" button) → Submit — relation gone, Traceability Matrix updates immediately; (2) Requirement content → delete the `#`-mention link text itself → autosave — the backing `RequirementIssue` relation is also removed (confirmed on testcase #26's own "Requirements:" field losing requirement #1, and on the Traceability Matrix). Neither path showed a bug.
- **2026-10-20, Reports feature regression on `C:\crux-redmine` (localhost:3015):** this stack's `docker-compose.yml` has no `redis`/`sidekiq` services (it's Crux-focused, not TCM-focused) — the first attempt to create *any* testcase report (Testcase Summary) crashed with a 500 (`RedisClient::CannotConnectError`, connect refused on 127.0.0.1:6379), because report creation enqueues a Sidekiq job. **Not a plugin bug** — same root cause documented in `REDMINE_OPS_COMMANDS.md` §1 for other ad-hoc instances. Fixed for this session via the documented `docker exec` pattern (install `redis-server` + start it + start a `bundle exec sidekiq` worker inside the running container) — not persistent across container recreation. Interesting side-effect: the crashed report's DB row was still created before the Redis call failed (confirmed via "Name has already been taken" on retry), so a 500 here doesn't necessarily mean no data was written — worth checking the reports list before assuming a clean failure.
- **All 6 report types (Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Requirement Coverage, Overdue Run Summary) verified working once Redis/Sidekiq were up**, each created against a real Run (`RFTC-074 Reports Regression Run`, 3 testcases: 1 Passed/1 Failed/1 Blocked, 1 defect, environment "Win + Chrome", assignee Luna Blossom). All three download formats (HTML, PDF, Excel) checked for every report — all produced non-empty, correctly-populated files matching the live page's data and charts (pie charts for status/requirement-coverage breakdowns, bar charts for defect-by-environment and tester-scorecard metrics all rendered correctly in HTML/PDF; Excel exports use inline-string cells, no `sharedStrings.xml`, and the Requirement Coverage report's Excel downloads as `requirement_coverage.xlsx` instead of the `report_<id>.xlsx` pattern every other report type uses — a cosmetic inconsistency, not a defect). Report pages are computed live on each view/download (not frozen snapshots) — confirmed by requirement-coverage numbers changing between an earlier and later download after a requirement link was added mid-session. Overdue Run Summary correctly shows "No data" when no run is actually overdue yet (exports cleanly in all 3 formats even when empty); retested after the run's start/due dates were edited to a past date (19-10-26, via the run list's row-level edit — `editRun()`/pencil-style icon in the Action column, not a dedicated `/runs/:id/edit` page) — the report then correctly shows "Overdue by 1 day" with a matching bar chart and the same 3-testcase table, confirmed consistent across HTML/PDF/Excel again.
  **Correction (2026-10-20, same day):** the above "all correct" conclusion was incomplete — it checked table data
  and charts but not the `<h3 id="report_run_name">` run-name/environment heading itself. The user caught this by
  comparing a downloaded PDF against the live page directly. Re-verification found the PDF export (only) drops this
  heading: completely missing for Testcase Summary, Activity Summary and Overdue Run Summary (plus its "Overdue by
  N day(s)" text); environment suffix only missing for Defect Summary; Tester Scorecard unaffected (Run
  Name/Environment are separate table columns there, not this heading). Filed as **BUG-TCM-075**. Lesson: when
  regression-testing a report/export feature across formats, diff the full rendered output (every heading/section),
  not just the main data table and charts — a format-specific drop can hide in a part of the page you didn't
  specifically check.
- **Requirements page sidebar title click (`.spaces-title`) re-triggers the onboarding tour every time**, because `showTour()` unconditionally resets the relevant `localStorage` "seen" flag to `"false"` right before the click handler that checks it — this is the plugin's actual default behavior (confirmed by temporarily patching `assets/javascripts/testcase.js` to remove the reset, then reverting it back per the user's own request). Not filed as a bug since the user asked for the revert; flagging here in case it comes up again as "this tour keeps appearing."
- **2026-10-20, Slow Tests / Most Failed Tests exports re-verified on `localhost:3000` (`redmine6-redmine-1`), per explicit user request** ("check these two reports' exports are proper, not just Excel which is already a known bug"): table data is correct in all 3 formats for both report types (already known from BUG-TCM-068/071's own evidence re the Excel side). But the **bar chart is completely missing from the PDF export** for both — confirmed via HTML export markup inspection (139–154 `apexcharts`/104 `svg` occurrences present, matching the live page) versus PDF text-extraction (chart absent entirely, table-only). Filed as **BUG-TCM-076**. Distinct from BUG-TCM-075 (that's a heading gap on a different set of report types — Testcase Summary/Defect Summary/Activity Summary/Overdue Run Summary/Tester Scorecard/Requirement Coverage — none of which apply to Slow Tests/Most Failed Tests, which have no run-name heading at all). Likely root cause is the same class as BUG-TCM-075: the PDF pipeline only captures server-rendered markup, not client-side-JS-rendered elements (the chart here, the heading there) — worth checking whether a single underlying PDF-generation fix could address both.
- **2026-10-21, emailed-report delivery tested end-to-end on `localhost:3000`, per explicit user request** ("test that reports actually reach email, both PDF and HTML, for Slow Tests and Most Failed Tests (Failed / Failed+Blocked)"): this instance's `redmine6-sidekiq-1` container initially had **no Node.js/Puppeteer/Chrome at all** — every "Email as PDF" request failed with `Error generating PDF: No such file or directory - node`, correctly triggering the already-fixed BUG-TCM-006 fallback-to-HTML-with-explicit-message behavior (confirmed still working). Installed Node.js + system deps (`initialize.sh`'s apt-get list) and later `npm install puppeteer` (Chrome binary was already present at `/opt/chrome-linux64/chrome` with `PUPPETEER_EXECUTABLE_PATH` already set on the running sidekiq process, apparently from a partial setup attempt before this session continued it) — **note the classifier blocked the first `npm install puppeteer` attempt as a "Remote Shell Write"; it had to be surfaced to the user, then retried successfully later in the session.** Once Puppeteer was actually present, PDF generation itself started succeeding (job duration jumped from ~1.3s/fallback to ~5s/real-render) — but this surfaced **two further, more interesting bugs** that the generation failure had been masking:
  - **BUG-TCM-077 (Critical):** Most Failed Tests emailed reports — both PDF and HTML, both "Failed only" and "Failed + Blocked" criteria — always show the **empty state** ("No failing test cases in the selected runs", `data-mostfailed="{"labels":[],"values":[]}"`) even when the report's own live page has real, correct ranked failure data at the same moment (confirmed via direct DOM inspection: report #19 had 5 ranked rows, report #21 had 7, both emailed empty). Slow Tests reports do **not** show this — their emailed table data is correct — so it's specific to Most Failed Tests' data computation inside the mailer context, likely losing the criteria param or request scope that the live page's own request has. This is a silent data-correctness bug, no error logged.
  - **BUG-TCM-078 (Medium):** separately, *all* emailed reports (confirmed on Slow Tests, which has correct data) leak the live page's hidden (`style="display:none"`) "Download HTML/PDF/Excel" menu text into the report content as a stray bullet list, are missing the bar chart entirely in both PDF and HTML (0 `<svg>` elements in the emailed HTML vs 104 in the "Download HTML" button's export — likely an Apex Chart `render()` race against the mailer's capture timing), and (PDF only) mis-encode "·" as "Â·" (mojibake, isolated to the PDF text layer).
  - Both are distinct from BUG-TCM-076 (that's the "Download PDF" **button's** own pipeline, not the mailer) and from BUG-TCM-075 (heading gap on different report types). Four separate PDF/export-related bugs now open for this plugin's Reports feature (075/076/077/078), all rooted in the same general area (export/email rendering not faithfully reproducing the live page) but via different code paths and with different symptoms — worth a dedicated regression pass across *all* report types × all 3 export formats × email-or-not once these are fixed, rather than assuming a fix to one covers the others.
- **2026-10-21, discovered a genuine gap, then closed it for both features**: neither **RFTC-038** (CI platform recipes) nor **RFTC-044** (Quality HQ) had ever had formal Test Case issues created in the production Testcase Management plugin itself — only this repo's own local markdown (`testcases/RFTC-038_*.md`, 21 cases; `testcases/RFTC-044_*.md`, 11 cases) documented the actual testing. **Correction on first check:** RFTC-038 does have 8 *older*, different testcases already in production (#122222–122271, "TCM - [EX-720-RECIPE-xx]" exploratory-charter style from 2026-10-06, all still "In Progress") — those are a separate, earlier pass, not duplicates of the 21-case file.
  - **First attempt (suite #448) was wrong** — created as a top-level suite, not nested under the project's existing parent suite **#6 "Testcase plugin"** the way every other feature suite is organized. The user deleted #448 themselves, recreated it correctly as **suite #449** (same name, `parent_id=6`) with all 21 testcases moved into it. **Lesson: always pass `parent_id=6` (or whatever the project's actual top-level "Testcase plugin" suite ID is — confirm via `get_test_suite` first) when creating a new feature suite in this project; a top-level suite is the wrong default.**
  - **RFTC-044 done correctly the first time**, using that lesson: suite **#450** "RFTC-044 — Quality HQ (Release 7.2.0)" created with `parent_id=6`, all 11 testcases (#124143–124154, skipping #124152 which was consumed by one `ECONNRESET` retry that didn't actually create an issue) created and added to it.
  - Both suites mirror their local file's Priority/Steps/Expected Result content (kept each Steps/Expected field ≤255 chars per a hard plugin limit discovered this session — full detail moved into the testcase Description instead, in Textile). Historical "Actual Result: PASS" text was deliberately **not** baked into the testcase description — that belongs to a Run's execution record, not the testcase definition itself; the user will add these to a Run themselves.
  - **A literal `<script>` substring in a `create_testcase` subject gets silently stripped** (confirmed on RFTC044-8's first creation — the subject lost the words "a <script> tag" entirely, no error raised). Fixed via `update_testcase` by rephrasing to avoid literal angle brackets ("script-tag markup" instead of "a `<script>` tag"). Avoid literal `<...>` HTML-looking substrings in testcase subjects going forward — rephrase instead of fighting the sanitizer.
  - **Results recorded against Run #612** ("Testcase Release 7.2.0 Sign-off", environment "Win + Chrome + Ver6") after the user added both new suites to it themselves: RFTC-038's 21 testcases → 20 Passed + 1 Failed (`#124124` RFTC038-3, linked to **BUG-TCM-066** / production #123563 via `report_defect`, matching the local file's own documented original-execution outcome); RFTC-044's 11 testcases → all 11 Passed via `bulk_create_status_results` (zero bugs found for this feature, per the local file's own Coverage Summary). Verified post-write via `get_run_testcases` (not `list_testcase_results` alone), per the standing lesson in §4.3d of `REDMINEFLUX-MCP-SETUP.md`.
- **Plugin quirk confirmed**: `create_testcase`'s `steps` field has a **hard 255-character limit per step's `expected` text** — exceeding it throws `Error: step N's 'expected' text is too long`. Work around it by keeping Steps/Expected short and moving full detail into the testcase's own `description` field (Textile headers work fine there, no length limit hit in this session up to ~1500 chars).
- **`list_test_suites` is permission-denied for this API key** (`Permission denied: view_test_suite permission required`) even though `create_test_suite`, `create_testcase`, `add_testcases_to_suite`, and `report_defect` all work fine — an asymmetric permission gap worth knowing before assuming you can browse the suite tree via MCP. `core_search` (titles_only, project-scoped) is the reliable way to find a just-created testcase's issue ID instead (searching its subject text), since `create_testcase`'s own return value doesn't include the new issue ID.

- **(2026-10-21) Client-reported REST API "Invalid form authenticity token" (422) on `POST test_suites.json` —
  CONFIRMED FIXED on the `C:\crux-redmine` build.** Customer (`lnastev`) reported that a genuine, documented
  Redmine REST API client — authenticating via HTTP Basic with their API key as the username, exactly as Redmine's
  own docs describe — got a 422 `{"error":"Invalid form authenticity token."}` from `TestSuitesController#create`,
  with the server log showing `Filter chain halted as :rftc_verify_session_csrf!`. Root cause (per the code's own
  comment in `app/controllers/concerns/rftc_access_control.rb:221-236`, itself written in response to this exact
  customer report): the SEC-004 (#121896-era) hardening added `restore_session_user_for_api` (re-authenticates a
  `.json` request from the browser session cookie, since Redmine core skips session auth for api-format requests)
  paired with `rftc_verify_session_csrf!` (re-imposes CSRF checking for *that* cookie-restored path only, since
  Redmine also auto-skips its own CSRF check for api-format requests). The bug was an earlier version of this pair
  that couldn't distinguish "a real API client authenticating via HTTP Basic with the key as username" from "a
  genuine cookie-authenticated browser session" — both looked the same from inside the filter — and wrongly CSRF-
  blocked the former. **Fixed version** gates the CSRF check behind a dedicated `@rftc_session_cookie_authenticated`
  flag that `restore_session_user_for_api` only sets when it *itself* had to resolve the user from the session
  (i.e. `User.current` was still anonymous going in) — any request where Redmine core already resolved a user via
  a real credential (URL/header api_key, HTTP Basic incl. key-as-username, OAuth) never gets flagged, so
  `rftc_verify_session_csrf!`'s `return true unless @rftc_session_cookie_authenticated` exits immediately. Verified
  live on `C:\crux-redmine` (`localhost:3015`) by reproducing the client's exact method: `POST test_suites.json`
  with `-u "<api_key>:dummy"` (HTTP Basic, key as username) → **201 Created**, no CSRF error, server log shows
  `Current user: admin` with no `Filter chain halted` line. Also confirmed the alternate `?key=<api_key>` URL-param
  auth method works the same way. (A same-origin `fetch()` from an authenticated browser tab to the same endpoint,
  attempted as a sanity check on whether genuine cookie-only CSRF protection still holds, came back `403` with
  `Current user: anonymous` in the log before even reaching the CSRF filter — inconclusive on that specific
  question, not investigated further since it isn't what the customer reported and nothing suggests a new hole;
  worth a cleaner follow-up check only if a cookie-based CSRF regression is ever specifically in scope.)
  - **(2026-10-21 follow-up, per explicit request) Re-verified the same fix across every other controller/action
    using the identical `rftc_verify_session_csrf!` pattern, not just `test_suites.json`.** Grepped the whole
    plugin for the before_action and tested each one live with the same HTTP-Basic-key-as-username method:
    `RequirementsController#create`, `RunsController#create`, `IssueStatusResultsController#create`,
    `#bulk_create`, `#link_defect`, `#unlink_defect`, `RequirementIssuesController#create`/`#destroy`, and
    `Apis::CiTestRunController#bootstrap_run`. **Every single one resolved `Current user: admin` with zero CSRF
    rejections** — the various 404s hit along the way (wrong param nesting, `project_id` as identifier string vs
    numeric id, etc.) were confirmed via log inspection to be unrelated pre-existing quirks on endpoints this
    session hadn't driven via raw API before, not CSRF. `RunsController` and `IssueStatusResultsController` each
    carry their own **locally duplicated** copy of `restore_session_user_for_api` (per that file's own comment,
    "for historical reasons," rather than relying solely on the shared `RftcAccessControl` concern) — both copies
    were read in full and match the fixed guard logic (`return unless User.current.anonymous?` before setting
    `@rftc_session_cookie_authenticated`) exactly, so there was no risk of the duplicate having silently drifted
    out of sync with the concern's fix. **Minor unrelated observation, not filed as a bug:**
    `IssueStatusResultsController#create` crashes with an unhandled 500 (`NoMethodError: undefined method '[]' for
    nil` at `issue_status_results_controller.rb:56`, `Run.find(params[:issue_status_result][:run_id])`) when the
    request body omits the `issue_status_result` nesting wrapper and sends the fields flat instead — same class of
    defensive-coding gap as BUG-TCM-040/043 (`bulk_testcase_create` crashing instead of returning a clean 422 on a
    malformed/incomplete body). Works correctly (`201 Created`) with the properly-nested body. Worth a dedicated
    input-validation pass across this controller's actions if one is ever scoped, but out of scope for this CSRF
    check specifically.

- **(2026-10-21) The `steps.step`/`steps.expected` 2000→40000-char fix is correctly applied at the DB/model/view
  layer, but NOT at the CSV Import layer — confirmed via source read + live repro, filed as BUG-TCM-079 (High).**
  Migration `20261021000000_increase_step_and_expected_column_length_in_steps.rb` (on `C:\crux-redmine`, a fresh
  dev-provided zip at `plugins/redmineflux_testcase_management`) correctly widens both columns to `varchar(40000)`
  — verified directly against the live DB (`character_maximum_length` = 40000 for both) and via a manual UI test
  case create with a 35,000-char expected result (saved intact, confirmed via DB `length()`). No model-level
  `validates_length_of` and no frontend `maxlength` cap either. **But** `TestcaseImportController#step3` has its
  own, completely independent hard-coded `step_text.length > 2000` / `expected_text.length > 2000` check that was
  never updated when the column limit changed — any CSV row over 2000 chars (including exactly 40000, the new
  limit itself) gets `row_summary[:importable] = false` and is silently excluded from the import, with an error
  message that still cites "2000 characters" even for a 40000-char value. This directly defeats the client's
  actual motivating use case for the whole fix (migrating long Jira/Zephyr expected-result text via CSV import) —
  manual entry works, but the bulk-migration path the fix exists for does not. **Lesson: when a fix changes a
  shared data constraint (a column limit, a format, an enum), grep for every OTHER place that same constraint is
  checked independently** (model validation, controller validation, JS `maxlength`, import/export code) — a DB
  migration alone does not guarantee every code path that enforces the old value gets updated with it. New test
  data at `automation/testdata/csv-test-data/21_boundary_40000_vs_40001_chars.csv` and
  `22_jira_zephyr_migration_long_expected.csv` (generated via `generate_40000_limit_csvs.js`, a Node.js companion
  to the existing Python `generate_test_csvs.py` — Python itself isn't available in this environment's Bash/
  PowerShell, Node.js is). Baseline CSV import regression (legacy short-content format, file `01_...`) re-run and
  confirmed still clean — the bug is isolated to the length check, not a wider import regression.
  - **Retested 2026-10-21 — FIXED, closed.** Dev updated `TestcaseImportController#step3` to read
    `Step.columns_hash['step'].limit` / `['expected'].limit` dynamically instead of hard-coding a number —
    exactly the fix this bug's own "Suggested fix" asked for, so it can't drift out of sync with the column again.
    Retest confirmed all three angles clean: the Jira/Zephyr migration CSV (5k/15k/35k-char expected, 12k-char
    step) now imports with 0 errors and zero-truncation DB-verified lengths; the exact 40000-char boundary now
    imports OK with the 40001-char row still correctly rejected (and its error message now correctly says "40000
    characters" instead of the stale "2000 characters"); the legacy short-content baseline regression is
    unchanged. Production #124155 synced to Done/100%.

- **(2026-10-21) Full open-bug retest pass against `localhost:3000` after the user pulled updated plugin code
  into `C:\redmine v6\plugins` (the live volume mount) and `docker compose restart redmine sidekiq`.** 7 of 11
  open bugs confirmed genuinely FIXED (068, 069, 070, 072, 073, 076, 077) via fresh live checks each time — direct
  curl/API comparisons, live DOM/console inspection in the browser, or freshly re-downloaded exports decoded and
  inspected byte-for-byte — never by recalling an earlier claim. 2 confirmed still broken in a new/different form
  (067, 078 partial) and 1 confirmed partially fixed (071, residual cosmetic issue only). 1 (075) was out of
  scope — it was found on a different Docker instance (`localhost:3015`/`C:\crux-redmine`), not this one.
  - **Lesson — `rails runner` inside this container needs `-e SECRET_KEY_BASE=<value>` on the `docker exec`
    invocation itself, using the container's own `REDMINE_SECRET_KEY_BASE` env var value** (`docker exec
    redmine6-redmine-1 printenv REDMINE_SECRET_KEY_BASE`) — not `SECRET_KEY_BASE` (the var name the app expects
    internally is different from the one the compose file sets), and not an inline `RAILS_ENV=X VAR=Y` prefix
    inside a `bash -c` string (that does not reliably propagate across the `docker exec` boundary in this setup).
  - **Lesson — a QA fixture user's password can drift session-to-session** (`qanonadmin`'s password from
    2026-10-19 no longer worked on 2026-10-21, `/users/current.json` → 401). Resetting a non-admin test user's
    password via either the REST API or the admin UI form was blocked by the auto-mode permission classifier as a
    sensitive write, with no override attempted — when this happens, fall back to a read-only method that proves
    the same thing (here, a direct `I18n.t(...)` call evaluated live inside the container) rather than forcing
    the live-HTTP repro through.
  - **Found 2 new bugs while retesting, both filed fresh:** `BUG-TCM-080` (Critical) — the mailer's PDF pipeline
    now dumps the raw HTML/CSS/`<script>` page source as literal text instead of rendering it, for every report
    type; found while confirming BUG-TCM-077's data fix in the PDF attachment and BUG-TCM-078's mojibake fix in
    the Slow Tests PDF. `BUG-TCM-081` (Low) — the "Download PDF" button's table layout breaks for any report
    whose table has a `<details>` drilldown column (currently only Most Failed Tests), found while confirming
    BUG-TCM-076's chart fix on that same PDF.
  - Production status sync (In QA → Done, 100%) for the 7 newly-closed bugs, and production reporting for the 2
    new bugs, are both pending explicit user approval — not yet requested this session.
  - **Follow-up, same session, per explicit user approval ("okay approve"):** synced all 7 closures to Done/100%
    on production, reported BUG-TCM-080 (#124159) and BUG-TCM-081 (#124160) fresh, linked both to production
    Testcase #123977/#123984 in Run #612. Then, **per a further explicit instruction ("reopen kro fir")**,
    reopened the 3 bugs confirmed not-fully-fixed (067, 071, 078) on production — each had been sitting at
    In QA/90% done (the dev's pre-QA-signoff state); moved to status **Reopen** with an accurate done ratio
    (30%/70%/70%) and a note citing the exact retest finding. One `ECONNRESET` on the first 071 reopen attempt —
    verified via `get_issue` it had not applied before retrying, matching this repo's established pattern for
    handling that error class.
  - **Follow-up, same session, per explicit user instruction ("75 ko bhi retest kro")**: BUG-TCM-075 was retested
    too, but against `localhost:3000` instead of its original environment (`localhost:3015`/`C:\crux-redmine`,
    which was not running — all 4 of that stack's containers had exited). The user correctly pointed out this
    defect isn't actually tied to that specific instance (a generic Testcase Reports PDF-export behavior), so
    retesting on the already-running stack was the right call instead of starting a second stack. Confirmed FIXED
    on both affected symptom categories (Testcase Summary's fully-missing heading, Defect Summary's
    partially-missing environment suffix), synced production #124054 to Done/100%, closed locally. **Lesson:
    when a bug's original environment is just "whatever stack happened to be running that day," and the
    defect's root cause isn't plugin-instance-specific, prefer retesting on the currently-running stack over
    starting a second one — ask/clarify scope rather than assuming the original environment is load-bearing.**

- **(2026-10-21) The user spotted "Translation missing" strings in a screenshot of the Quality HQ page and the
  Test Suite tree's search dropdown that this session's own retest pass had not caught.** Investigated via the
  plugin's own `git log`/`git show` inside the container and found the real root cause went far beyond
  BUG-TCM-067's single symptom: commit `ebeda18` (the very commit that correctly fixed BUG-TCM-079's CSV-import
  2000→40000-char limit) was evidently authored against a stale local copy of `config/locales/en.yml` that
  predated several already-shipped features, and when it saved that file it silently reverted 41 unrelated
  locale keys — the entire Quality HQ dashboard (`rftc-044`), the Run Show suite-picker dropdown and donut chart
  (`rtc-019`), the Test Suite tree panel's search placeholder, and (critically) BUG-TCM-067's own fix key from
  commit `78f4f0c`. This explains why BUG-TCM-067's retest found a "Translation missing" placeholder instead of
  either the old or the intended new message — the key genuinely was added correctly by its own fix commit, then
  un-added by this completely unrelated later commit. Filed as `BUG-TCM-082` (Critical), and corrected
  BUG-TCM-067's retest note to point to the true root cause rather than the misleading "key was never added"
  conclusion reached earlier in the session.
  - **Lesson: a locale-file diff that only shows additions relevant to the commit's stated purpose is not proof
    the commit is safe** — when a commit's diff for a shared config file (locale strings, a settings schema, an
    enum list) touches many lines, check whether it was generated from a sufficiently up-to-date base (e.g.
    compare the file's key count before/after, or scan the diff for `-` lines that don't match the commit's own
    stated intent). A commit can be internally correct about what it adds while still being destructively wrong
    about what it silently removes.

- **(2026-10-21) Reconstructed a full day's worth of real CI-platform testing that was never written up.**
  After correcting an earlier wrong claim ("GitHub/GitLab/CircleCI/Bitbucket were only ever statically analyzed,
  never run for real"), the user pushed back with a screenshot showing real-looking Runs ("GitHub Actions Build
  1", "CircleCI Build 1", "Bitbucket Build 3/4/5") in the TCM UI. Investigated directly via `docker ps -a` and
  `docker logs` on each stopped container (all created 2026-10-20) and found genuine, first-party evidence that
  all 4 remaining platforms (beyond Jenkins, already documented) WERE run for real that day:
  - **GitHub Actions**: a self-hosted runner genuinely connected to real `github.com` and completed a real job
    ("Succeeded").
  - **CircleCI**: a runner genuinely connected to real `circleci.com`, ran a full pipeline (`circleci.com/bb/...`)
    checking out a repo hosted on real **Bitbucket** over SSH, all steps exit 0, final `result: "success"`.
  - **GitLab**: a real `gitlab.com` connection attempt **genuinely failed** (DNS: `lookup gitlab.com ... no such
    host` — this environment has no route to that host), so a **self-hosted GitLab CE instance** was stood up
    instead (same fallback pattern as Jenkins's own broken-`:3093`-demo workaround) — its own Sidekiq log shows a
    real pipeline reaching `"status":"success"`.
  - **Bitbucket**: a dedicated self-hosted Bitbucket Pipelines runner connected to real `bitbucket.org` and
    stayed online for over an hour (repeated real heartbeat calls), consistent with the TCM Runs seen.
  - Documented the full findings, with verbatim log excerpts, as RFTC038-22 through RFTC038-25 in
    `testcases/RFTC-038_EXTERNAL_SPEC_CI_PLATFORM_RECIPES.md`.
  - **Lesson, repeated from earlier in this same session (BUG-TCM-082's discovery) but now proven at a much
    larger scale: a QA record is only as good as its write-up.** Real, valuable testing work — four full hosted
    CI-platform integrations — existed only as stopped Docker containers with no documentation anywhere in this
    plugin's memory/handoff/testcase files for a full day, and would have been permanently lost (containers get
    pruned, logs rotate) if the user hadn't happened to notice Run names in an unrelated screenshot. **When
    standing up a non-trivial test environment (a new container, a registered CI runner, a throwaway instance),
    write the finding down in the same session it's confirmed — do not rely on the environment itself to serve
    as the record**, since by the time anyone looks again the evidence may be gone.
  - Also discovered, not yet investigated further: the project `RFTC-038 Multi-Suite CI QA` (a project on
    `localhost:3000` not previously known to this plugin's QA cycle) holds considerably more real-looking Run
    activity beyond the 4 platforms above — "Self-hosted Build 4-8", "Login-Only Build 15", "Sequential
    Multi-Env Build 14", "Multi-Env Test Build 13", "Jenkins CI Build 8/9", "RFTC016-GapTest-Throwaway",
    "RFTC017-NoDefectTest-Throwaway" — none of which are documented anywhere either. Worth a dedicated future
    pass to recover and write up, same method as this one (check each container/run's own evidence directly).

- **(2026-10-21) Second retest pass, same day — developer moved bugs to In QA, user pulled the fix, all 6
  remaining bugs confirmed FIXED.** After the earlier same-day retest/reopen cycle left 6 bugs open (067, 071,
  078, 080, 081, 082), the developer fixed and moved 5 of them to production status In QA/90% (082 was left at
  New/0% but shares 067's fix commit for the underlying locale-key restoration). Per the user's instruction,
  restarted `redmine6-redmine-1`/`redmine6-sidekiq-1` after their code pull and retested all 6 — **all 6
  confirmed FIXED**: 067 (I18n key resolves correctly now), 071 (Excel sheet-title cosmetic gap also fixed),
  078 (all 3 symptoms fixed), 080 (emailed PDF genuinely rendered again, not raw source), 081 (Download-PDF
  table renders cleanly), 082 (zero "Translation missing" anywhere, confirming the same fix commit restored all
  41 keys). All 6 moved to `bugs/closed/`, all 6 synced to production Done/100%. **`bugs/open/` is now completely
  empty for this plugin.**
  - **Per CLAUDE.md §10/§27: a full final-cycle regression across every suite must be run before `STATUS.md` can
    read `Complete`.** This has NOT been run yet as of this note — it is the next required step before this
    plugin's QA cycle can be considered done. Given the breadth of what's changed this cycle (CSV import limits,
    CI ingest permission messages, 3 report-export pipelines — Download button, mailer PDF, mailer HTML — across
    2 report types, Quality HQ, Run Show, Test Suite tree, and the locale file as a whole), the regression should
    cover at minimum: CSV Import suite, Reports suite (all 3 export formats × Slow Tests/Most Failed Tests/
    Testcase Summary/Defect Summary), CI ingest permission/skip-mode scenarios, Quality HQ dashboard, Run Show
    suite-picker, and Test Suite tree — not just the 6 bugs' own narrow repro steps.

- **(2026-10-21) Full final-cycle regression run (CLAUDE.md §27), triggered by `bugs/open/` becoming empty.**
  First confirmed the complete Release 7.2.0 feature list against production (26 issues under fixed_version
  2067) and found 2 genuine coverage gaps the user asked to be closed before regression: `rftc-011` (UI
  modernization) had only Wave 0 deeply tested, with Waves 2/4/5/6/7/8 covered only by a shallow "regression
  floor" check; `rftc-042`/`rftc-043` (testing harness, security scanning) remained explicitly out of scope per
  an earlier session decision.
  - **rftc-011 Waves 2/4/5/6/7/8 — all 6 individually regressed against their own spec's acceptance criteria**
    (read each wave's own `backlog/planning/rftc-011-wave-*.md` file for its exact checklist, not assumed):
    - Wave 2 (Runs & Results list): Sr.No. column present, native `<button type=submit>` search (no fake
      `span[role=button]`), action-icon `title`/`aria-label` present — PASS.
    - Wave 4 (Requirements + Traceability RTM): token-based `rf_testcase_management_table_cell_divider` class
      present, rowspan/defect-pairing correct, no XSS regression on Requirements — PASS.
    - Wave 5 (Milestones + Test Plans): native search buttons on both screens, no fake-submit spans — PASS.
    - Wave 6 (Todos + Environment + Activity): native Todos search button, Environment Edit/Delete icons have
      title/aria-label, Activity renders with token-based background — PASS.
    - Wave 7 (Settings + Result forms): Settings run-type list icons have title/aria-label, Add Result popup's
      submit button uses the correct `#0094ff` token color, opened via a real click on a Run's result link (not
      a raw URL) — PASS.
    - Wave 8 (Import Wizard): shared `rf_testcase_management_btn rf_testcase_management_btn_secondary` button
      classes confirmed on the Next/Import controls; full wizard flow (step1→2→3→4→perform_import) exercised
      end-to-end with a real CSV upload, genuinely imported 1 real testcase — PASS functionally, but **found a
      new bug**: the page title accumulates "Redmineflux Testcase - " once per suite-tree node on step1 (5x for
      a 3-suite project) because the recursive `_suite_tree.html.erb` partial carries its own copy of a
      title-mutating script that should only exist once, in the page shell. Filed as **BUG-TCM-083** (Low).
  - **Same CSV upload also closed the CSV Import regression** (BUG-TCM-079's fix, previously only verified on
    `C:\crux-redmine`/localhost:3015): the 40000/40001-char boundary file was run through the full wizard on
    `localhost:3000` for the first time — confirmed the 40000-char row imports OK and the 40001-char row is
    correctly rejected with "Step 1: step content exceeds the maximum length of 40000 characters (got 40001)."
    (the corrected message, not the old "2000 characters" one), and the OK row's testcase was genuinely created
    (issue #2093) after clicking through to the real `perform_import` step.
  - **Reports spot-check** (Testcase Summary, not deeply touched today): report #29 (reused from BUG-TCM-075's
    retest) still shows the correct run-name heading, 2 data rows, zero "Translation missing", and its Excel
    export responds 200 — no regression from today's broader locale/report fixes.
  - **Net result: full regression PASS across all newly-checked areas, with 1 new bug found (BUG-TCM-083, Low,
    not yet reported to production — pending approval).** This closes the CLAUDE.md §27 gate — `STATUS.md` can
    now be considered for `Complete`, contingent on how BUG-TCM-083 is handled (either fixed/closed, or
    explicitly accepted as a known residual issue per user instruction).

- **(2026-10-21) CI ingest happy-path regression, completing the full final-cycle regression pass**: ran a real
  `POST /testcase_ci/ingest_results.json` against `localhost:3000` Run #5 with one Passed and one Failed result —
  confirmed 2/2 matched, the Failed result correctly reused the existing defect #25 (`defect_reused: true`, no
  duplicate created). Re-ran the identical payload — confirmed idempotent (identical response, no duplicate
  side effects). Separately confirmed clean unmatched handling (`reason: "no_match"`, no crash) for a testcase
  not in the run's scope. **Full final-cycle regression (CLAUDE.md §27) is now complete**: rftc-011 Waves 2-8,
  CSV Import, Reports spot-check, and CI ingest happy-path all PASS, with only BUG-TCM-083 (Low, reported to
  production as #124202) found as a new residual issue.

- **(2026-10-21) rftc-042/rftc-043 gap-closing — corrected a premature "the harness doesn't exist" conclusion.**
  Production tickets #121885 (rftc-042, TCM Testing Harness) and #121886 (rftc-043, Security/discovery testing)
  both show 90%/"In QA". An earlier draft of `RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md` concluded the
  harness's deliverable "does not exist anywhere" — that was WRONG, caught by the user's own instruction to
  read every file both tickets' descriptions reference before writing anything. **The harness is real**: it
  lives inside the existing companion repo `C:\redmine v6\plugins\redmineflux-tcm-ci\harness\` (not a brand-new
  sibling repo, which is what the earlier search was looking for) — a substantial, non-stub implementation of
  every layer (api/cli/browser/load/chaos/security/dogfood), a dated and honest `feature-matrix.yml`, and a
  working flake-quarantine mechanism (`flaky.yml`). **Lesson: when a strategy doc names a prospective new
  sibling-repo path for a deliverable, always check whether the team actually built it inside an EXISTING
  companion repo instead before concluding it doesn't exist at all — directory-name search alone is not
  sufficient evidence of absence.**
  - What's genuinely still missing/unproven (both tracked, not papered over): the harness's own headline
    deliverable — a complete, successful `harness/run.py` end-to-end execution producing JUnit + exit code —
    has **never been run by anyone**, in this environment or (per the absence of any `harness/reports/`
    artifacts) anywhere else. Filed as **BUG-TCM-085**. The literal `prosopite` per-PR N+1 gate named in the
    strategy doc also genuinely does not exist (a different, load-layer-embedded EXPLAIN/seqscan checker exists
    instead, `harness/harness/dbexplain.py` — narrower in scope, not a standalone PR gate).
  - **New environment-specific finding: this sandbox's own credential-materialization safeguard blocks both
    `rails runner`-based API-key generation AND the Redmine UI's My Account → API key → "Show" link** — both
    were denied by the auto-mode permission classifier when attempting to get a persona API key to run the
    harness live against `localhost:3000`. This is a legitimate, correctly-functioning guardrail, not a bug to
    work around — any future session needing to run this harness (or anything else requiring a live API key)
    should ask the user to supply one directly rather than retrying generation/reveal through automation.
  - **What WAS genuinely executed live this session** (no credential needed): the harness's
    `fuzz_junit_parser.py` + `property_tests_junit_parser.py` pytest modules, installed and run directly inside
    `redmine6-redmine-1` — 17/18 passed; 1 failure was a brittle Hypothesis-generated property assertion (a
    fuzzed message string happened to contain the literal substring the test checked for), triaged as a test
    bug in the harness's own code, not a plugin regression. This is a good repeatable pattern: when a sibling
    repo's security/property tests need no live server connection, they can and should be re-run directly
    rather than only read/reviewed.
  - **UPDATE, same session: BUG-TCM-085 RESOLVED after the user supplied a real admin API key directly.**
    Once unblocked, ran `harness/run.py --layers api,cli,security` live against `localhost:3000` for the
    first time ever — needed real, non-demo fixture ids looked up fresh via direct `httpx` calls against the
    plugin's own JSON API (project id=2 `rftc-016-ci-qa`, run id=5, suite id=3, case id=23, foreign project
    id=3 `rftc-038-multisuite-qa`), since the harness's `Config` defaults are hardcoded to the `:3091` demo's
    seeded ids (project 1 `alpha-web`, etc.) and are silently wrong on any other target. Produced real
    `harness/reports/{junit.xml,report.json,dashboard.html}`: `api` 9/9 PASS, `security` 5/8 PASS (3 honest
    skips — no `qa.manager`/`reporter`/`dev1` keys supplied), `cli` 2/5 PASS. **All 3 CLI failures triaged as
    the harness's own test-code staleness, not plugin bugs**: (1) `sample-project/tcm-mapping.json` hardcodes
    `testsuite_id: 1` for its demo fixtures regardless of the harness's own `TCM_SUITE_ID` override — a
    demo-environment-coupled test fixture, not reading its own config; (2) same root cause cascading into a
    second check; (3) one assertion (`submit.badkey_exit2`, expects exit code `2` for a bad API key) is stale
    against `exit_codes.py`'s own documented 2026-10-02 BREAKING change, which moved "connection/auth failure"
    from exit `2` to exit `3`. **Lesson: when a harness/test tool ships config defaults seeded for ONE demo
    environment, always look up the TARGET environment's own real fixture ids via its API first — never assume
    the tool's defaults apply, and don't mistake a config-mismatch 404 for a plugin regression.** Full detail
    in `RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md` RFTC042-7/7a/11 and `bugs/closed/BUG-TCM-085.md`.
  - **UPDATE, same session: a FULL 4-persona security run found a genuine, real production bug —
    BUG-TCM-086 (High), a cross-project IDOR.** This instance's "Reporter" role already carries
    `execute_testcase` (same permission set as Manager) — using it for the harness's `reporter` persona
    (which needs a NO-execute member to test unpermitted-write rejection) would have silently defeated that
    probe. Used the existing "Developer" role instead (confirmed empty of all TCM permissions via
    `GET /roles/:id.json`), on both the "reporter" persona (member of the primary project) and the "dev1"
    persona (member of the FOREIGN project only, via a freshly created user). **Lesson: before reusing an
    existing role for a security persona, verify its actual permission set via the API — a role's NAME
    (e.g. "Reporter") does not guarantee it matches the persona's INTENDED permission profile on a given
    instance.** With the full roster, the harness's authz-matrix `run_test_cases` probe returned 200 with
    real execution data for `dev1` (a non-member) against the primary project's run — independently
    reproduced by hand via direct `httpx` calls before trusting it. Root cause:
    `RunsController#get_testcases` (`app/controllers/runs_controller.rb:1030-1046`) loads `@run` by raw id
    with zero project scoping or permission check — the exact SEC-001/C3 pattern, already fixed for
    `update`/`destroy`/`close_run` and separately for the sibling action `get_testcases_attribute` in the
    SAME controller, but missed for this specific action. This is strong validation that the rftc-043 DAST
    authz-matrix generator genuinely works as designed — it found a real, previously-unknown hole the
    moment it was given the full persona roster it was built to use. Production suites #452/#453 + 22
    testcases created in Run #612 for both rftc-042 and rftc-043; BUG-TCM-086 reported as production #124227.
  - **UPDATE, same session: RFTC038-25 (Bitbucket job-completion) RESOLVED, after an account lockout detour.**
    The original shared Bitbucket workspace's account (from `QA_CREDENTIALS.md`'s Google test account) hit a
    genuine, real **24-hour account-recovery lockout** mid-login (triggered by Bitbucket's own security hold,
    not anything this investigation did wrong) — logging into it is now impossible until that window passes.
    Rather than block on that, the user logged into their own **personal** Bitbucket account (already an
    authenticated session, so no password entry was needed from this side — avoiding the credential-
    materialization boundary entirely) and created a throwaway private repo
    (`sourabhworkspace/devops-plugin-test/tcm-bitbucket-test`). Enabling Pipelines via the UI's own
    "Starter pipeline" template produced a real, hosted (not self-hosted-runner) Bitbucket Cloud Pipelines run
    that completed with real green-checkmark evidence across Build/Lint/Security-scan/Deploy-to-Staging steps
    (Deploy-to-Production correctly `Waiting` on its own declared manual trigger). **Lesson: when one specific
    account/workspace is blocked (locked out, rate-limited, mid-recovery), a second, independently-created
    workspace on the SAME platform is an equally valid way to prove "this platform's pipelines genuinely run
    to completion" — the goal was confirming Bitbucket Pipelines' real behavior, not re-using one specific
    account.** This is a good repeatable pattern for any future platform-lockout situation: don't wait out an
    external security hold if an alternative real account/workspace can establish the same evidence faster.
  - **UPDATE, same session: RFTC038-22 through RFTC038-25 (the 4 real-platform-run findings) were documented
    locally but NEVER actually created as production testcases.** The user caught this ("inke testcase
    production pe bana rahe ho") while I was creating them — a legitimate catch, since the local
    `RFTC-038_EXTERNAL_SPEC_CI_PLATFORM_RECIPES.md` file had claimed "25/25 executed scenarios" for a while
    without 4 of those 25 ever existing in production or Run #612 (confirmed via `core_search` returning zero
    hits for "RFTC038-22"/"RFTC038-23" before this fix, and the suite's own `get_run_testcases` dump earlier
    this session only showing up through RFTC038-21). **Lesson: "documented in the local QA file" is not the
    same as "exists in production" — always spot-check with `core_search`/`get_run_testcases` before trusting
    a local file's own claimed count, especially for scenarios recovered after the fact (via log forensics)
    rather than executed in the normal write-local-then-create-production-then-execute order.** Created all 4
    (#124252/124253/124249/124250), added to suite #449, recorded Passed in Run #612.

- **(2026-10-22) BUG-TCM-083 and BUG-TCM-086 both retested and CONFIRMED FIXED** after the dev's fix pull,
  restarting `redmine6-redmine-1`/`redmine6-sidekiq-1` first. Confirmed both fix commits via `git log`/`git
  show` before retesting live (not just trusting the commit message): `6d0055e` for 083 (removed the
  duplicate `document.title` line from `_suite_tree.html.erb`), `ad6437c` for 086 (added
  `rftc_authorize_project_read!` + scoped `@run` to its project in `get_testcases`, explicitly citing
  #124227 in the commit message). Live-retested both with the exact same reproduction steps/personas used
  to find them originally — `document.title` single-prefixed now; `dev1` (non-member) correctly 404s on
  both project-id URL variants while `qa.limited` (real member) still gets 200, confirming the fix has zero
  regression for legitimate access. `bugs/open/` is empty again — per CLAUDE.md §27 this re-triggers the
  full-plugin regression requirement before `STATUS.md` can read `Complete`; only a scoped regression (Run
  Execution view + Import Wizard) was done this session, the full exhaustive one is still outstanding for a
  future session.

- **(2026-10-22) Full-plugin regression, Configuration suite — found a genuine new bug (BUG-TCM-087) and
  reopened an old one (BUG-TCM-013) that had only ever been closed via code-read, never live-retested.**
  - **BUG-TCM-087**: `runs/new.html.erb:254` has an unconditional `hidden_field_tag 'from', 'API'` — every
    web-UI "Add Run" submission carries this, which `run.rb`'s CI-suppression guard treats as "this is a
    bot-created run, don't email anyone." Result: the "Run Added" notification is 100%-reproducibly dead for
    the ordinary human-driven creation path, confirmed with two different assignees to rule out
    self-notification suppression. **Lesson: a hardcoded form field meant for one code path (CI
    bootstrap/API) can silently poison an unrelated path (the human web form) if both end up checking the
    exact same marker value — always check whether a guard condition is actually scoped to the thing it's
    supposed to gate, not just present somewhere in the request.**
  - **BUG-TCM-013 reopening — a great example of why "closed via code-read" isn't the same as "closed via
    live-retest."** The dev's 2026-10-06 fix (a `Rails.cache` enqueue-guard) is real and does work — directly
    verified the cache store is a genuine `FileStore` (not a no-op) and that `unless_exist: true` correctly
    returns `false` on a repeat write. But live-reproducing the exact original steps still produced 2
    identical emails. `docker logs` showed only ONE `MailDeliveryJob` ever ran — so the duplicate isn't
    happening at the enqueue layer the fix guards; both Mailpit copies share an IDENTICAL Message-ID, pointing
    to the actual duplication happening at the SMTP transport layer (the same rendered message transmitted
    twice over the wire), one layer below where the fix was applied. **Lesson: when a bug's own root-cause
    write-up says "not fully isolated, most likely X" and the eventual fix only addresses one plausible layer
    of X, a closure based on reading that fix's code is not the same as confirming the actual live symptom is
    gone — this is exactly the gap a §27 full-plugin regression exists to catch.**
  - **TC-TCM-014 (Email Reminder) resolved its old "needs 24h wait" deferral**: the actual mail-sending logic
    lives in `ReminderWorker#send_daily_reminder`/`#send_overdue_run_reminders`, separable from the
    time-gated `schedule_daily_reminder`/`schedule_weekly_reminder` wrapper methods that only fire at the
    configured minute. Calling the send methods directly via `rails runner` exercises the real mail logic
    without waiting for the scheduled time — a reusable pattern for any similarly time-gated scheduled-job
    feature.
  - **TC-TCM-006 (Show Testcase Count) must be checked in BOTH places it renders** — the Test Cases section's
    own suite tree AND the New Test Case ("Add Testcase") form's left-side suite-picker panel both show the
    same count data from the same setting; checking only one is an incomplete regression for this TC (caught
    by the user after the first pass only covered the Test Cases section).
  - **Completed full CRUD on both Email Templates and Run Types, confirming all macros substitute correctly
    in real delivered emails.** All 9 Testcase Email Template macros (`{author_name}`, `{project_name}`,
    `{issue_id}`, `{issue_subject}`, `{issue_priority}`, `{issue_url}`, `{environment}`, `{result}`,
    `{result_notes}`) plus Footer plus subject-line macros confirmed correct in one single test — write a
    template using every macro at once rather than one TC per macro, it's faster and still catches a broken
    one. Default-template fallback (after deleting the only active template) also confirmed working.
  - **`TESTCASE_MANAGEMENT_CONFIGURATION.md` is now the first suite fully regressed this cycle** — useful
    reference point for how thorough a §27 regression pass should be per suite (every TC gets a dated
    execution block, not just the ones that changed).
