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

- **Report PDF export depends on Node.js + Puppeteer/Chromium via the `grover` gem, and fails silently when they're absent.** `run_mailer.rb` builds the PDF with `Grover.new(html).to_pdf`; on a container without `node` this raises `Errno::ENOENT`, and the `rescue` block **still calls `mail(...)`**, so an attachment-less email goes out with a body that says "Please find the attached Testcase Report". No UI error, no failed job. This is BUG-TCM-005. Whenever a PDF-format report email "arrives but has nothing attached", check `which node` inside the Redmine container first — and check the Sidekiq log for `Error generating PDF:`, which is the only place the failure is recorded.
- The report email format is a single radio group confusingly named `testcase_report[email_as_html]` with values `pdf` / `html` (ids `#email_as_pdf` / `#email_as_html`); PDF is the default. The model stores it as two booleans, `email_as_html` and `email_ad_pdf` (note the typo `ad`).

- **`initialize.sh` is broken as shipped on Debian 12.** It requests `libgdk-pixbuf2.0-0`, which has no installation candidate on this release (now `libgdk-pixbuf-2.0-0`). `apt-get` aborts the entire install on that single bad name, so a user following the documented procedure ends up with **nothing** installed and only a buried error. Substitute the corrected package name when running it.
- **Grover resolves the browser from the Sidekiq process environment**, via `ENV['PUPPETEER_EXECUTABLE_PATH']` (falling back to `npx puppeteer executablePath`) and `GROVER_NO_SANDBOX`. Installing Node is not sufficient on its own — **Sidekiq must be restarted with those variables exported**, which is what `initialize.sh` does. A hand-started `bundle exec sidekiq` will not have them.

- **Redmine caps a custom field name at 30 characters.** Creating one with a longer name fails validation and re-renders the form — and because that re-render returns HTTP 200, a scripted POST loop will report success while silently creating nothing. Always verify the resulting list, not the response status. (Hit this creating fixtures for TC-TCM-037: 10 of 25 names were silently rejected.)
- **Redmine's CSV export separator AND encoding vary by instance/locale** — `localhost:3010`: comma + Windows-1252; `localhost:3012`: comma + UTF-8; `localhost:3011` (German locale): **semicolon** + cp1252, because Redmine uses `;` where the locale's decimal separator is a comma. Import step 1's **Field Separator** and **Encoding** must both match the file or the wizard misreads it. The testcase import wizard defaults to UTF-8, so a freshly exported issue CSV must have **Encoding** switched to Windows-1252 on import step 1 or the content mangles. The "All Columns" export option is `c[]=all_inline` (`columns=all` does nothing).

## Confirmed Working

- CSV import — **full suite re-verified 2026-09-11, 16/16 TCs PASS** (see the Regression Run table at the bottom of `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`): legacy single `Steps`/`Expected` columns, 0–50 step range, varying step counts per row (1/3/7/15/30 with no cross-contamination), non-sequential step numbering (preview shows 1/3/5, saved case renumbers 1/2/3), unicode/emoji/embedded-newline content round-tripping exactly, the 2000 vs 2001-char boundary, oversized-text rejection with a precise error, 100×3-step bulk import in ~0.5 s, header-only and empty-file handling, and whole-column-family-absent handling in both directions.
- CSV import fixtures live in `automation/testdata/csv-test-data/` (17 files, numbered, with a `README.md` mapping each to its purpose and expected outcome) — **not** in `automation/uploads/` as the older TC file's Evidence Map used to claim. Use these for any CSV import regression; they cover every TC in the suite.
- Single-test-case **Add Result** inside a run (`POST /issue_status_results`, format JS) — saves correctly as the logged-in user. Verified 2026-09-11 on `localhost:3010`, run #4.
- **Report email — all six report types verified 2026-09-14** (Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Overdue Run Summary, Requirement Coverage): **HTML works for all six**; **PDF failed for all six *pre-install*** and works after completing Installation step 6 (BUG-TCM-005, closed 2026-09-15). The report type is irrelevant — all six share the single `send_report` method in `run_mailer.rb`, so only the format branch decides the outcome. Don't re-test per-type; test per-format.
- **Activity Summary requires an Activity Date Range** (start + end date) that the other five types don't. Submitting without it correctly fails validation ("Start date cannot be blank / End date cannot be blank") and creates nothing — working as intended. Worth knowing because the date fields only render after the report-type `change` event fires, so a script that fills the form too quickly will miss them and the creation will silently not happen.
- **CSV import with a very wide CSV** (45 columns from an all-columns issue export, 500 rows, 121 KB): step 4 renders the preview correctly, no session-cookie overflow. Verified 2026-09-15 on **all three supported Redmine versions** as a retest of production #118789: `localhost:3010` (Redmine 7.0.0, 45 cols), `localhost:3012` (Redmine 6.1.3, 44 cols), `localhost:3011` (Redmine 5.1.12, 38 cols). The fix is not version-specific. The fix stores `csv_columns`/`field_mappings` in `tmp/import_meta_<user_id>.yml` instead of the session — confirmed present in v7.0.0 at `testcase_import_controller.rb:575-588`.
- **Report email — PDF format, on a correctly installed server**: verified 2026-09-14 on `localhost:3012` after completing Installation step 6 — delivers as `multipart/mixed` with a valid 53 KB PDF (9/9 streams inflate cleanly). The PDF path is functional; it was only ever the environment that was incomplete.
- **Report email — HTML format** (`Email the report as HTML attachment`): delivers correctly as `multipart/mixed` with a real `<name>.html` attachment containing the rendered report. Verified 2026-09-14 on `localhost:3012` with a Requirement Coverage report (14,074-byte attachment, correct content). It is also the fallback worth suggesting whenever the PDF path is in doubt.
- `bulk_create`'s own business logic — verified 2026-09-11 by calling `POST /testcase_status_results/bulk_create.json` with HTTP Basic (API) auth: returns `201 Created` and writes the result rows. Only the browser-session path into it is broken.

- **The run grid is filtered per environment — check the filter before judging a result as missing.** A run's test
  case grid shows the status *for the currently selected environment* (`#environment_select`, also an
  `environment=` query param). A result saved against `chrome` will show as `Untested` while the grid is filtered
  to `fdsgsdf`. This nearly produced a false FAIL on the BUG-TCM-003 retest: the bulk update had genuinely written
  both rows, but the grid looked unchanged. Switch the filter to the environment you saved against, or check
  `issue_status_results` directly, before concluding nothing saved.
- **Conversely, a status already showing in the grid is not proof your action worked.** The same retest showed
  #434/#435 as `Passed` *before* the submit, from results four days old. Verify by `created_at` and environment,
  not by what the cell reads.

## Recurring Issues

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
