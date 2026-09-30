# Handoff — Redmineflux Testcase Management

## Last Session

- Date: 2026-09-30
- Redmine Version: 7.0.0
- Environment: Docker `localhost:3010`, plugin v7.0.0 (git HEAD `97449b9`)

## Completed This Session (2026-09-30, continued further) — Configuration suite, 4 more bugs found

**Continuing the final-cycle regression into `TESTCASE_MANAGEMENT_CONFIGURATION.md`** (20 TCs, entirely
unexecuted before this session). 18/20 resolved, 2 deferred:

- **TC-TCM-001** (Testcase Tracker cleared) — **FAIL, found BUG-TCM-010 (High):** clearing the setting doesn't
  block "New Test Case," it silently creates the issue on the project's first tracker (`Bug`) with zero error;
  permanently invisible to every plugin view afterward. Setting restored, verified.
- **TC-TCM-002** (valid-but-different tracker) — PASS: shows an honest "Tracker not enabled for this project"
  message, no data loss. Contrasts cleanly with TC-001/BUG-TCM-010.
- **TC-TCM-003** (Defect Tracker drives Report Bug) — PASS on the core mechanism (issue correctly lands on the
  configured tracker); side-observed a validation issue with a non-Bug tracker that turned out to be BUG-TCM-011.
- **TC-TCM-004** (Feature Tracker) — corrected premise: `Requirement` is a standalone model with no tracker
  column at all; the setting actually scopes which second tracker's issues can be linked to a requirement — PASS
  on the real mechanism.
- **TC-TCM-005** (same tracker for two roles) — **FAIL, found BUG-TCM-011 (High):** setting Testcase/Defect
  Tracker to any non-Bug tracker breaks Report Defect/New Test Case entirely when the project has a Bug-only
  required custom field (this project has two) — the field is never rendered for the other tracker but still
  enforced on submit. Root-caused to `issue_testcase_controller.rb`'s `new` action resolving the tracker
  explicitly before render, while `create` never applies that same resolution before validation runs.
- **TC-TCM-006/007** (display settings) — both PASS; TC-007's "hide default status field" premise corrected to
  the real control, "Hide Testcase Execution section."
- **TC-TCM-008–013** (email templates/notifications) — precondition fix: `run_added`/`run_updated`/
  `testcase_result_added` were entirely unchecked in Administration → Settings → Notifications (same
  "nothing pre-configured" pattern as the Permissions suite). Enabled all three (real fix, left enabled). Verified
  live via Roundcube (`qa@test.local`): both Run and Testcase Email Template marker/macro substitution work
  correctly (TC-008/009 PASS). **Found BUG-TCM-012 (Low):** the default Testcase Result Added email's heading
  shows the run's name instead of the test case's own subject (`@run.name` vs `@issue.subject` in the view).
  **Found BUG-TCM-013 (Medium):** every single Add Result submission sends the Test Case Result Added email
  **twice** (confirmed only one DB row created each time — not a duplicate submission); root cause not fully
  isolated, suspect a Sidekiq retry. TC-TCM-010 (invalid template) confirmed safe via source (plain regex
  substitution, no parser to raise on malformed syntax). TC-TCM-014 (reminder frequency) deferred — needs a real
  scheduled-interval wait.
- **TC-TCM-015/016** (run types) — both PASS: new type appears in Add Run dropdown; deleting an in-use type
  leaves existing runs rendering fine with a cleanly blank Run Type (no error).
- **TC-TCM-017** (Redis stopped) — deferred, shared-instance risk (Sidekiq queue + other plugins' Redis use).
- **TC-TCM-018/019/020** (Sidekiq/Node prerequisites) — already had confirmed evidence from earlier sessions.

All settings touched this session were restored to baseline and verified via Rails console (tracker=4, defected_
tracker=1, feature_tracker=2, hide_testcase_execution=nil, show_issue_count=true, 0 active email templates).
The three notification events and the role→permission mapping from the Permissions suite are the only
deliberately-lasting configuration changes.

`bugs/open/` now holds 7 bugs: BUG-TCM-007 (#121645), BUG-TCM-008 (#121698), BUG-TCM-009 (#121699), BUG-TCM-010
(#121700), BUG-TCM-011 (#121701), BUG-TCM-012 (#121702), BUG-TCM-013 (#121703) — **all 7 now reported to
production as of 2026-09-30**, all assigned to Sheetal Sharma, linked to a dedicated production Test Case #121697
and Run #592 (see the new Run History row below).

## Completed This Session (2026-09-30, continued) — Permissions suite finished, BUG-TCM-009 filed

**Continuing the final-cycle regression's Permissions suite** (from 20/32 TCs to effectively complete, minus 5
deliberately deferred cases):

- **TC-TCM-074/075** (non-member / anonymous access): built a dedicated brand-new **Private** project
  (`tcm-permissions-private-test`) specifically to isolate this from the shared `test-project` fixture. Confirmed
  via Rails console `daisy.skye` had zero membership/role on it. **Found BUG-TCM-009 (High):** every plugin
  controller's read actions (`test_suites`, `testcase_reports`, `requirements`, `traceability_rtms`,
  `testcase_todos`, `runs#new/index/show`) render fully for a genuine non-member, while plain Redmine's own
  `/projects/<id>` correctly 403s. Anonymous access (TC-075) correctly redirects to login — PASS, but only because
  of the instance-wide "Authentication required" setting, unrelated to per-project isolation.
- **TC-TCM-077** (module disabled): disabled the module on `test-project`, confirmed the tab vanishes but
  `/test_suites` and `/runs/new` still fully render for a real project member — same missing-guard root cause,
  folded into BUG-TCM-009 rather than filed separately. Module re-enabled and verified restored immediately after.
- **TC-TCM-058** (run deletion vs execution history): created run #8, executed 2 cases, deleted the run via Rails
  console (`Run.destroy`) — confirmed a real cascade delete (`IssueStatusResult` count 119→0), no orphaned
  references on reload. PASS.
- **TC-TCM-061** (Execute permission independence): created run #8 assigned to `willow.belle` (Developer:
  view_test_suite/execute_testcase/view_report only). Execute worked; no Edit/Close/Delete Run controls in the UI;
  direct `GET /runs/8/edit` rendered no data. PASS.
- **TC-TCM-062** (View Report granted, Create denied): Reports list/detail render correctly for `willow.belle`, no
  create/edit/delete controls shown, but `GET /projects/test-project/testcase_reports/new` renders the full form —
  same defect as BUG-TCM-007, no new bug needed.
- **TC-TCM-066** (report cross-project leakage): confirmed via source (`testcase_reports_controller.rb:65`) that
  both branches of the run-selection ternary constrain to `project_id: @project.id`, including the branch that
  takes attacker-controllable `run_ids` — correctly scoped. PASS.
- **TC-TCM-076** (permission revocation takes effect immediately): revoked Create Run from QA Own Visibility
  (`/roles/19`), verified via Rails console it actually persisted (guards against the bulk-save silent-failure
  gotcha), confirmed the Add Run button disappeared immediately for `summer.rain` on the next request — no stale
  grace period. **Restored the permission afterward** to avoid leaving the shared role fixture altered.
- **TC-TCM-073** (deleting a requirement with linked test cases): identified the live fixture (Requirement #2
  "gsdfgdf" → test cases #434/#471) but the actual delete was **blocked mid-workflow by the session's auto-mode
  permission classifier** ("Irreversible Deletion"), which also blocked a follow-up screenshot in the same flow.
  **Deferred, not executed** — needs the user's explicit go-ahead via whatever path they prefer.
- **Still deliberately deferred from earlier in this suite:** TC-TCM-051 (suite deletion with linked cases — no
  working case↔suite linking method found), TC-TCM-067/068/069 (To-Do visibility — needs cleaner multi-user
  assigned-work fixtures).

**Permissions suite is now checkpoint-complete** per the user's "checkpoint after each suite" pacing decision.
`bugs/open/` now has 3 bugs: BUG-TCM-007, BUG-TCM-008, BUG-TCM-009. Next suite per the original priority order:
`TESTCASE_MANAGEMENT_CONFIGURATION.md`.

## Completed This Session (2026-09-30) — BUG-TCM-006 retested and closed as FIXED

**Trigger:** production issue #120658 (BUG-TCM-006) was moved to **In QA** by the developer — the fix commits
`dee611e`/`58c68d2`/`9e82662` (previously "reported, not pushed") are confirmed merged into `master` (HEAD
`97449b9`) on `localhost:3010`.

**This instance had never had Installation step 6 completed** (no Node/Puppeteer/Chromium, no SMTP configured at
all). Set up from scratch this session: Node v20.19.2/npm 9.2.0/Chrome 127.0.6533.88; SMTP wired to the local
Docker mail server (`host.docker.internal:2587`, since this container sits on its own `redmine-docker-700_default`
network, not `local_mailtest_net`); `Setting.host_name` corrected `localhost:3000` → `localhost:3010`; `admin`'s
account email set to `admin@test.local` and seed user `luna.blossom`'s to `qa@test.local` for real checkable
mailboxes.

**Found live (not from a manual/deliberate break) that this container's default entrypoint does not export
`PUPPETEER_EXECUTABLE_PATH`/`GROVER_NO_SANDBOX` for Sidekiq** — a plain restart leaves Chromium unable to launch
(`No usable sandbox!`). This incidentally became a real second failure cause for BUG-TCM-006's retest (see below).

**Retest performed** (full detail in `bugs/closed/BUG-TCM-006.md`):
1. Baseline with a working Puppeteer path — genuine 1,001,291-byte PDF, valid header/trailer, 32/32 streams inflate.
2. Failure cause 1 (missing `--no-sandbox`, found incidentally) — HTML fallback + red warning banner delivered correctly.
3. Failure cause 2 (`PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`, the bug's own documented repro) — exact
   original error reproduced, HTML fallback + warning delivered correctly.
4. Spot-checked a second report type (Defect Summary) under failure cause 2 — same correct behaviour.
5. HTML-format regression check under failure cause 2 still in effect — unaffected, no warning, normal delivery.

**Verdict: FIXED.** BUG-TCM-006 moved to `bugs/closed/`; `bugs/_index.md`, `TC-TCM-101` (in
`testcases/TESTCASE_MANAGEMENT_REPORTS.md`) and the plugin memory file all updated with the evidence.
**Still not executed:** verification-plan step 6 (HTML fallback itself failing while PDF has already failed) — an
honest gap carried forward, not assumed safe.

**Production write still pending approval:** sync **#120658 → Done / 100%** (`CLAUDE.md` §5) — prepared, not yet
executed.

**Discrepancy found and flagged, not acted on:** while checking BUG-TCM-006's production status, found that
**#120544 (BUG-TCM-003) and #120546 (BUG-TCM-004) are already Status: Done, 100%** on production — retested and
closed by **Nidhi Singh** on 2026-09-28 (forge instances, Redmine 6.0.11 and 7.0.1, real Playwright evidence). This
repo's local `bugs/open/BUG-TCM-003.md` / `BUG-TCM-004.md` still read Open, deliberately kept that way pending the
Test Runs suite regression (`SENIOR_QA_STANDARDS.md` §26). Not resolved this session — flagged in `bugs/_index.md`
for a decision on whether the other tester's evidence satisfies §26 or the regression still needs running here.

## Completed Previous Session (2026-09-15) — BUG-TCM-005 rescoped and closed, BUG-TCM-006 split out

**Trigger:** the user challenged the "stays OPEN" verdict from the 2026-09-14 retest, on the grounds that the
original scope of BUG-TCM-005 was *PDF generation and attachment failure*, and that the hardcoded "Please find the
attached Testcase Report" body text should not be allowed to redefine that scope retroactively.

**Scope verified against the source material before changing anything** (the user asked for this explicitly, rather
than treating the retest failure as automatically in scope):

| Source | Original assertion |
|---|---|
| Customer report (origin of the bug) | *"an email was received… but no attachment was included"* |
| Bug title | *"arrives with no attachment at all"* — the *"while the body still says"* clause describes the symptom, it does not assert the defect |
| Expected result bullet 1 | *"The email arrives carrying a `.pdf` attachment… matching the behaviour of the HTML option"* |
| Expected result bullet 2 | *"If the PDF genuinely cannot be produced, the user is told so"* — **conditional**, a fallback expectation |
| TC-TCM-100 (the bug's own stated retest vehicle) | *"email arrives as `multipart/mixed` carrying a valid `.pdf`"* — says nothing about body text |

**Conclusion: the user's reading is correct.** Bullet 1 and TC-TCM-100 both pass after the install. TC-TCM-101 —
which is what the "stays OPEN" verdict rested on — was written *after* the 2026-09-14 retest, from Test 2's
finding, so it is not evidence of the bug's original scope. Bullet 2 was present from the start but is conditional
and was never the reported failure.

- **BUG-TCM-005 closed as FIXED** and moved to `bugs/closed/`. Root cause: **incomplete installation** (KB
  Installation step 6 never run on `redmine-docker-6-redmine-1`), not a product defect. Retest Test 1 evidence
  stands: 74,652 B `multipart/mixed`, 53,446-byte PDF, `%PDF-1.4`, `%%EOF`, 9 of 9 streams inflate cleanly.
  A CLOSED banner was added at the top of the file; the pre-install analysis is retained as the historical record.
- **BUG-TCM-006 created** (`bugs/open/BUG-TCM-006.md`, Medium) for the residual defect from Test 2 — a *failed*
  PDF still sends an email promising an attachment, with nothing surfaced in the UI. Severity set lower than 005's
  High because it needs a PDF-generation failure to trigger at all. It carries forward the developer-reported fix
  (`dee611e`, `58c68d2`, `9e82662`, unpushed/unverified) and the five-step verification plan, both of which were
  recorded on #120588 while the scopes were still conflated.
- **TC-TCM-100 flipped to CONFIRMED PASS**; **TC-TCM-101** rewritten with its real preconditions (working
  Puppeteer + shell access to restart Sidekiq), a five-step procedure, and an explicit warning not to confuse it
  with TC-TCM-100. TC-TCM-102 note clarified as pre-install.
- **`bugs/_duplicates.md` populated** with both findings plus a decision rule — if `node`/`npm`/Chromium are
  present and the Sidekiq worker has `PUPPETEER_EXECUTABLE_PATH` set, a "no attachment" report is BUG-TCM-006,
  not BUG-TCM-005. This matters: the two share a visible symptom and are easy to misfile as duplicates.
- `bugs/_index.md`, `reports/final-bug-report.md` and `STATUS.md` updated. Open bug count unchanged at 3.

**Regression (partial, per §26 — High severity requires the affected suite + adjacent):** TC-TCM-098 (HTML email,
all six report types), TC-TCM-100 (PDF email) and TC-TCM-102 (report type does not affect emailing) all PASS in
the 2026-09-14 session; the HTML path was specifically confirmed not regressed by the installation. **The full
Reports-suite regression (TC-TCM-078…534) is still outstanding** — see Next Session Start Point.

**Production writes:**
1. ~~Report BUG-TCM-006 to `ztflux`~~ — **DONE 2026-09-15, approved: created as #120658**, Bug tracker, category
   Testcase Management Plugin, Priority Medium, assigned to Sheetal Sharma. Custom fields set successfully in the
   same `create_issue` call: Defect Type **Functional**, Defect Severity **Medium-severity**, Defect priority
   **Medium**. Description links back to #120588 and states the split explicitly.
2. **STILL PENDING — #120588 → Done / 100%** (`CLAUDE.md` §5 — BUG-TCM-005 is closed locally and the two are out
   of sync until this runs). A journal note should accompany it explaining the rescoping, since the 2026-09-15
   note on that issue currently says it must *not* close on code review alone — true of BUG-TCM-006 (now #120658),
   no longer true of #120588's own scope. Also still outstanding there: `Defect priority` reads Medium, QA
   assessed High; and corrupt attachment id 93593 needs deleting and re-attaching manually.

**Custom-field IDs now confirmed working** (this resolves a long-standing "cannot set these" note): `43` Defect
Type, `44` Defect Severity, `45` Defect priority, `46` Peer Reviewer, `51` System Component, `57` Crux Capability.
`list_custom_fields` still returns a permission error, but passing these IDs directly in `create_issue`'s
`custom_fields` works — verified on #120658. Note `list_users` is *also* permission-blocked, so Sheetal Sharma's
id (**397**) must be carried forward from here rather than looked up.

**Attachment channel — what worked and what was deliberately skipped on #120658:**
- Uploaded: `BUG-TCM-006-ev1-email-promises-absent-attachment.jpg` (2,366 B) → attachment id 93611.
  **Checksum-verified byte-exact** by downloading it back (`md5 4aa6ddfa…`). Size check alone is not sufficient.
- **Not uploaded:** the generated `bugs/pdf/BUG-TCM-006.pdf` (13,433 B) and `bugs/open/BUG-TCM-006.md` (14,425 B).
  Both sit well above the ~4 KB safe ceiling for this base64 channel, in the exact range where #120588's PDF
  passed its size check but arrived with 2 bytes substituted. Skipped deliberately rather than creating a second
  corrupt attachment; the full finding is in the issue Description instead. **Attach both manually via the web
  UI.**
- A downscaled JPEG of the retest comparison screenshot could not be brought under ~4 KB while staying legible
  (best attempt 4,906 B at 500px greyscale). The 2.3 KB email screenshot carries the same assertion, so that was
  used instead.

## Completed Previous Session (2026-09-14)

**Part 2 — knowledge base ingested, full test suite authored**

- Read the vendor knowledge base (https://www.redmineflux.com/knowledge-base/plugins/testcase-management/) and used it to populate the three previously-empty docs: `TESTCASE_MANAGEMENT_REQUIREMENTS.md`, `TESTCASE_MANAGEMENT_FEATURES_LIST.md`, `TESTCASE_MANAGEMENT_USER_GUIDE.md`. **This clears the long-standing `CLAUDE.md` §11 blocker** that had prevented writing any new test case suite.
- Authored **9 new test suites / 196 new test cases** covering all 18 features (CSV Import's 16 already existed):
  | Suite | TC range | Count |
  |---|---|---|
  | `TESTCASE_MANAGEMENT_ENVIRONMENTS.md` | TC-TCM-038–108 | 8 |
  | `TESTCASE_MANAGEMENT_TEST_SUITES.md` | TC-TCM-192–212 | 12 |
  | `TESTCASE_MANAGEMENT_TEST_CASES.md` | TC-TCM-128–324 | 24 |
  | `TESTCASE_MANAGEMENT_TEST_RUNS.md` | TC-TCM-152–440 | 40 |
  | `TESTCASE_MANAGEMENT_REPORTS.md` | TC-TCM-078–534 | 34 |
  | `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` | TC-TCM-112–616 | 16 |
  | `TESTCASE_MANAGEMENT_TODO.md` | TC-TCM-205–710 | 10 |
  | `TESTCASE_MANAGEMENT_PERMISSIONS.md` | TC-TCM-046–832 | 32 |
  | `TESTCASE_MANAGEMENT_CONFIGURATION.md` | TC-TCM-001–920 | 20 |
- **Corrected BUG-TCM-005.** The KB's Installation step 6 explicitly requires Node.js + Puppeteer + Chromium, so the earlier claim that the dependency was "never declared" was **wrong** — it was based on grepping only the plugin's bundled doc files. The missing-attachment symptom on `localhost:3012` is an **incomplete installation**, not an undeclared dependency. What remains a genuine product defect is the **silent failure**: PDF generation fails and the plugin still sends an email whose body promises an attachment. Bug file corrected; **production #120588 still carries the wrong claim and needs correcting.**

**Part 1 — client-reported Report Email issue**

- Investigated a second client-reported issue: **"Report Email Issue"** — Requirements Coverage report emailed in HTML vs PDF format.
- **HTML format: PASS.** Email delivered as `multipart/mixed` with a valid `RC-HTML-2026-09-14.html` attachment (14,074 bytes, correct Requirement Coverage content).
- **PDF format: FAIL — reproduced.** Email delivered but as a bare `text/html` with **no attachment part at all**, while the body still reads "Please find the attached Testcase Report". Filed as **BUG-TCM-005 (High)**.
- **Root-caused** to two compounding defects: (1) `grover (1.2.10)` is declared but its runtime prerequisites (`node`, `npm`, `chromium`) are **not installed** in the container, so `Grover#to_pdf` raises `Errno::ENOENT` — logged in Sidekiq as `Error generating PDF: No such file or directory - node`; (2) the `rescue` in `run_mailer.rb` **still calls `mail(...)`**, silently sending an attachment-less email with no UI error.
- Checked the relevant configuration as asked: SMTP is correctly wired to the local mail server, `Setting.host_name` is correct, Sidekiq was started and is delivering — the email path itself is healthy, which is what isolates the fault to PDF generation alone.
- **Extended to all six report types** (Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Overdue Run Summary, Requirement Coverage), each sent in both formats — 12 reports total. Result: **PDF fails for all six, HTML works for all six**. Confirms the defect is format-driven, not type-driven, matching the shared `send_report` code path.
- Confirmed **not** a defect: Activity Summary requires an Activity Date Range and correctly refuses to create without one, with a visible validation error. (Initially mis-read as "no email sent" — it was an unfilled required field in my own test, corrected and re-run.)
- Noted but deliberately **not** filed as a plugin bug: the `http://hostname/my/account` footer link, which affects core Redmine emails on this instance equally (instance mailer config, not the plugin).

## Completed Previous Session (2026-09-11)

- Investigated a customer-reported failure: "bulk update on multiple Test Cases belonging to the same Test Run consistently fails with the same error, regardless of environment or execution notes."
- **Reproduced and root-caused.** Filed `BUG-TCM-003` (High) — the bulk endpoint is routed as `.json` with `defaults: { format: 'json' }`, so Redmine core treats the browser XHR as an API request, skips session-cookie auth, and rejects it as anonymous with 401 before the plugin's own `restore_session_user_for_api` filter can run. Verified the failure is independent of environment (`fdsgsdf`, `chrome`), status (`Passed`, `Skipped`), notes (present/absent), and selection size.
- Proved the endpoint's own logic is sound: the identical payload sent with HTTP Basic (API) auth returns `201 Created`. Only the browser-session path is broken.
- Proved the contrast with single-test-case **Add Result** (posts to a non-`.json` route) — saves correctly as `admin` in the same session, seconds apart.
- Filed `BUG-TCM-004` (Low) — the same modal renders `Apply to <strong>2</strong> testcase(s).` with raw HTML tags visible, because a markup-bearing locale string is rendered through escaping `<%= %>`.
- Updated `bugs/_index.md` (added the missing `Production Redmine Issue ID` column per `CLAUDE.md` §3) and the plugin memory file.

## In Progress

- Nothing mid-flight.

## Blockers

- **`TESTCASE_MANAGEMENT_REQUIREMENTS.md` and `TESTCASE_MANAGEMENT_USER_GUIDE.md` are still empty stubs.** Per `CLAUDE.md` §11 / root `MEMORY.md`, a test case suite file cannot be written until both exist, so no `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` suite was created for the Runs & Results / bulk-update feature this session — only the bug reports. Ask the user to supply both documents before writing that suite.
- ~~CSV fixtures still need to be pasted in~~ — resolved: the 17 fixtures were already present in `automation/testdata/csv-test-data/` and were used for the 2026-09-11 regression. The TC file's Evidence Map now points at their real paths.

## Retest of production #118789 — 2026-09-15 (PASS)

- Production issue **#118789** (CSV import 500 / `CookieOverflow` on an all-columns export, assigned to Vaishnavi Bhawsar, status **In QA**, 90% done) was retested on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0).
- Fix confirmed present in the shipped code: `write_import_meta` / `read_import_meta` / `import_meta_path` at `testcase_import_controller.rb:575-588`, moving `csv_columns`/`field_mappings` out of the session into `tmp/import_meta_<user_id>.yml`.
- Built a **harsher** case than the original: created 15 issue custom fields, then exported Issues -> CSV -> All Columns, giving **45 columns / 500 rows / 121,525 bytes** (original defect triggered at ~30 columns / 4,802-byte cookie).
- **Result: PASS.** `POST .../testcase_import/step4` returned `200 OK in 1176ms`; steps 2 and 3 also 200; no `CookieOverflow`, no `FATAL`. Step 4 rendered the preview with per-row validation, matching the ticket's expected result. `import_meta_1.yml` held the 45 columns (2,121 bytes).
- Captured as **TC-TCM-037** in `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md` (suite now 17 TCs), with fixture `automation/testdata/csv-test-data/18_all_columns_export_118789.csv`, screenshot `screenshots/RETEST-118789/`, log `logs/RETEST-118789-2026-09-15.log`.
- **Repeated on Redmine 5 (2026-09-15):** `localhost:3011` (**Redmine 5.1.12.stable**, plugin v7.0.0, German locale, 24 pre-existing custom fields) — 38-column / 424-char-header export, semicolon-separated cp1252. **Step 4 rendered, no 500.**
- **Repeated on Redmine 6 (2026-09-15):** same test run end-to-end on `localhost:3012` (**Redmine 6.1.3**, plugin v7.0.0) after creating 15 custom fields there — 44 columns / 727-char header. **Step 4 rendered, no 500.** This closes the "does the fix hold on Redmine 6?" question, since the original defect was reported on Redmine 6.1.1. Both instances now covered by TC-TCM-037.
- **Support matrix clarified (2026-09-15):** plugin **7.0.0 is one release covering Redmine 5, 6 and 7** — the renumber was Redmine-7 compatibility, not a fork, and there is no separate 6.2.x line. The earlier open question "did the fix reach a 6.x maintenance line?" is therefore **closed — it does not apply.** **Retest coverage is now complete across the whole supported matrix: Redmine 7 PASS, Redmine 6 PASS, Redmine 5 PASS.**
- **#118789 has not been updated on production** — that needs approval. It is a different assignee's ticket; recommend adding the retest note so it can move out of In QA on QA evidence.
- A **third QA instance exists that earlier notes did not mention: `localhost:3011` = Redmine 5.1.12.stable, German locale, plugin v7.0.0, 24 custom fields, project `test5`.** Useful as the Redmine 5 leg of any compatibility matrix.
- Environment side-effect: **15 new issue custom fields now exist on BOTH `localhost:3010` and `localhost:3012`** and will appear on issue forms and exports on both. Remove them if they interfere with other suites.

## Next Session Start Point

- **Final-cycle regression (§27) in progress, started 2026-09-30.** Working suite by suite; user chose "full
  regression, all 10 suites, same rigor, checkpoint after each suite" when asked about pacing.
- **`TESTCASE_MANAGEMENT_PERMISSIONS.md` is checkpoint-complete.** Only 5 TCs remain deliberately deferred:
  TC-TCM-051 (no working case↔suite linking method found), TC-TCM-067/068/069 (needs cleaner multi-user
  assigned-work fixtures), TC-TCM-073 (blocked by the auto-mode permission classifier mid-delete — needs user
  input on how to proceed). Every other TC in the suite has live evidence. Role→permission mapping established
  for Manager/QA Own Visibility/Developer/Reporter (see the suite file's own header note) — reuse it, don't
  re-derive.
- **BUG-TCM-007 (High)** — Test Suite Management, Reporting, and Requirement Management (9 of 17 permissions)
  have zero authorization check at all in their controllers. **Reported to production as #121645.**
- **BUG-TCM-009 (High) found this session** — almost the entire plugin has no project-membership or
  module-enabled check on its *read* actions (distinct from BUG-TCM-007, which is about *write* actions missing a
  role-permission check). A genuine non-member, or a member of a project with the module disabled, can still view
  test suites, requirements, reports, traceability, to-dos and runs by direct URL. Not yet reported to production.
- `bugs/open/` now has 7 bugs, **all reported to production as of 2026-09-30**: BUG-TCM-007 (#121645), BUG-TCM-008
  (#121698), BUG-TCM-009 (#121699), BUG-TCM-010 (#121700), BUG-TCM-011 (#121701), BUG-TCM-012 (#121702),
  BUG-TCM-013 (#121703) — all assigned Sheetal Sharma, linked to Test Case #121697 / Run #592. `STATUS.md` stays
  `In Progress` (awaiting fixes, not a reporting gap anymore).
- **Next: continue the final-cycle regression into `TESTCASE_MANAGEMENT_TEST_RUNS.md`** (the plugin's core
  workflow, genuinely unexecuted), then the remaining suites (cases/requirements/RTM/reports/to-do). TC-TCM-011/012
  in the Configuration suite still need a written-up verdict (notification events were enabled as a precondition
  fix, but no evidence block was recorded for these two specific TCs this session).
- **`TESTCASE_MANAGEMENT_CONFIGURATION.md` is checkpoint-complete** (18/20 TCs resolved). Deferred: TC-TCM-014
  (needs a real scheduled-interval wait — shortest cadence is daily), TC-TCM-017 (stopping Redis is a
  shared-instance risk with other concurrent QA sessions).
- **Next suite per the original priority order: `TESTCASE_MANAGEMENT_TEST_RUNS.md`** (TC-TCM-152–440 in the old
  range notation — the plugin's core workflow, genuinely unexecuted), then suites/cases/requirements/RTM/
  reports/to-do.
- **One production write is still queued and needs approval:** sync **#120588 → Done / 100%** with a rescoping
  note (BUG-TCM-006 is now reported as #120658, so that half is done). Until this runs, `bugs/closed/BUG-TCM-005.md`
  and production #120588 are out of sync. Do it first.
- **Attach manually to #120658:** `bugs/pdf/BUG-TCM-006.pdf` and `bugs/open/BUG-TCM-006.md` — both too large for
  the MCP base64 upload channel to carry safely (see the attachment note above).
- **Full Reports-suite regression (TC-TCM-078…534) is outstanding.** BUG-TCM-005 was High severity, so §26 calls
  for the whole affected suite plus adjacent features; only TC-TCM-098, 523 and 525 have been re-run. This is the
  one gate item left over from closing that bug.
- **One untested case on BUG-TCM-006: the HTML format under a forced failure** (TC-TCM-101 step 6). Source
  inspection shows the HTML branch of `send_report` has no `begin`/`rescue`, so a failure there should raise and
  send nothing — but that is a code-reading argument, not an observation. It matters more once the proposed
  HTML-fallback fix lands, because that makes HTML generation a dependency of the PDF failure path.
- **BUG-TCM-006 cannot be retested from the browser.** It needs shell access to break PDF generation (restart
  Sidekiq with `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`). A browser-only retest on a healthy instance will
  show a working PDF and produce a **false pass** — this is exactly the trap TC-TCM-101 now warns about.
- `localhost:3012` is now **fully provisioned**: node v20.19.2, npm 9.2.0, puppeteer, Chrome 127.0.6533.88, Redis up, Sidekiq running as `redmine` with `PUPPETEER_EXECUTABLE_PATH` and `GROVER_NO_SANDBOX` exported. If the container restarts, **all of this is lost except the apt/npm packages** — Sidekiq and Redis must be restarted with those env vars.
- **New finding still to file:** `initialize.sh` aborts on Debian 12 because it requests the non-existent package `libgdk-pixbuf2.0-0`. A user following the documented install gets nothing installed — and it is the direct cause of the incomplete installation behind BUG-TCM-005. Carried on BUG-TCM-006's Suggested fix (dev reports it fixed in `dee611e`, unverified), but it warrants its own ticket as an *installer* defect rather than a mailer one.

- ~~**Correct production #120588**~~ — done 2026-09-15: the Description was rewritten, removing the superseded "undocumented dependency" claim. It now needs the **status sync to Done / 100%** instead (above).
- **Start executing the new suites.** None of the 196 new TCs has been executed. Suggested order by risk:
  1. `TESTCASE_MANAGEMENT_PERMISSIONS.md` — highest risk; leg C (direct-URL) findings are potential data exposure.
  2. `TESTCASE_MANAGEMENT_CONFIGURATION.md` TC-TCM-017–920 — establishes which apparent defects are really incomplete installs, before anything else is misfiled.
  3. `TESTCASE_MANAGEMENT_TEST_RUNS.md` — the plugin's core workflow.
  4. Then suites, cases, requirements/RTM, reports, to-do.
- **Before executing anything email-related:** confirm Redis + Sidekiq are running, and check `Setting.host_name`.
- Several TCs deliberately ask the tester to *record which of two behaviours occurs* rather than asserting one (e.g. TC-TCM-199, 311, 320, 902). Fill those in as they are executed — they are documentation gaps in the KB, not vague test cases.

- **BUG-TCM-005 is on production as #120588** (Priority High, assigned to Sheetal Sharma, created 2026-09-14 with explicit approval; no Test Run / Environment / Test Case ID per the user's instruction). Its Description is complete and correct.
- **Outstanding on #120588:** the attached `BUG-TCM-005.pdf` is **corrupt** — it uploaded with 2 bytes altered in transit (offsets 5954-5955), which passed the reported-size check exactly (12.1 KB) but leaves 1 of its 4 FlateDecode streams unable to decompress, so one page won't render. The 2.4 KB evidence JPEG on the same issue is byte-exact and fine. Fix by deleting attachment id 93593 and re-attaching `bugs/pdf/BUG-TCM-005.pdf` manually through the web UI (deletion is a production write needing approval per `REDMINEFLUX-MCP-SETUP.md` §4.1). Nothing is lost meanwhile — the issue Description carries the full finding including the six-type matrix.
- The four `Defect *` custom fields on #120588 defaulted to project values (**Defect Severity: Medium-severity**) and should be corrected to **High-severity / High** — same API-key limitation as #120544 / #120546.
- Once Node.js + Puppeteer/Chromium are installed on `localhost:3012`, retest BUG-TCM-005: re-send a PDF report and confirm a real `.pdf` attachment arrives. Then separately verify the swallowed-error half of the bug is fixed (e.g. by temporarily making PDF generation fail) — installing Node alone fixes the symptom but not the silent-failure defect.
- ~~The other report types were not exercised~~ — **done 2026-09-14**: all six types tested in both formats, PDF fails for all six, HTML works for all six. Coverage matrix is in BUG-TCM-005.
- BUG-TCM-003 is the priority — it makes the bulk-update feature unusable from the UI for every role, and its `.json`-route root cause probably affects four sibling routes.
- Gather `TESTCASE_MANAGEMENT_REQUIREMENTS.md` / `TESTCASE_MANAGEMENT_USER_GUIDE.md`, then write `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` covering Runs & Results: single result add, bulk result update, environment assignment, defect-required statuses, and run state transitions. The bulk-update TC already has its live evidence captured in BUG-TCM-003.
- Check whether `routes.rb:163, 167, 168, 175` (`create.json`, both `bulk_delete.json` routes, `bulk_testcase_create.json`) carry the same `.json`-format auth defect as BUG-TCM-003 — these are bulk delete of test cases, bulk delete of test runs, and bulk test case create, all reachable from the UI.
- **Both bugs are now on production `ztflux`**: BUG-TCM-003 = **#120544** (Priority High), BUG-TCM-004 = **#120546** (Priority Low), both assigned to **Sheetal Sharma (id 397)**, created 2026-09-11 with explicit user approval. Reported without Test Run / Environment / Test Case ID at the user's instruction.
- **Follow-ups still outstanding on those two production issues:**
  1. The four `Defect *` custom fields were auto-filled with project defaults on both issues (Defect Type: Functional, **Defect Severity: Medium-severity**, Defect priority: Medium, System Component: Development - Web Application - Frontend). The mapped values should be **High-severity / High** for #120544 and **Low-severity / Low** for #120546. This API key cannot read custom-field definitions (`list_custom_fields` → permission denied), so the IDs were unavailable at creation time — set them in the UI, or supply the field IDs and they can be patched.
  2. **#120544 has a corrupt attachment** (`BUG-TCM-003-evidence.jpg`, attachment id 93550) — the MCP `upload_file` base64 channel mangled it in transit (uploaded 4046 bytes vs 4019 on disk; downloading it back gives "broken data stream"). It should be deleted and the screenshot attached manually from `screenshots/BUG-TCM-003/bulk-update-stuck-saving-401.png`. The PDF on that issue (`BUG-TCM-003.pdf`, 8440 bytes) is byte-exact and fine. All three attachments on #120546 are byte-exact and valid.

## Open Bugs Found

- **BUG-TCM-007 (High)** — Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission
  check at all. Found 2026-09-30 while executing `TESTCASE_MANAGEMENT_PERMISSIONS.md`. **Reported to production
  as #121645.**
- **BUG-TCM-008 (Medium)** — Run detail page crashes with an unhandled 500 whenever the run's environment-assignee
  user has been deleted. Found 2026-09-30. **Reported to production as #121698.**
- **BUG-TCM-009 (High)** — Almost the entire plugin has no project-membership or module-enabled check on its read
  actions — a non-member (or a member of a project where the module is disabled) can still view test suites,
  requirements, reports, traceability, to-dos and runs. Found 2026-09-30. **Reported to production as #121699.**
- **BUG-TCM-010 (High)** — Clearing the Testcase Tracker setting silently misfiles "New Test Case" onto the
  project's first tracker instead of failing with a config error. Found 2026-09-30 in
  `TESTCASE_MANAGEMENT_CONFIGURATION.md`. **Reported to production as #121700.**
- **BUG-TCM-011 (High)** — Report Defect/New Test Case cannot be completed at all when Defect/Testcase Tracker is
  set to any non-Bug tracker, if the project has a Bug-only required custom field. Found 2026-09-30. **Reported to
  production as #121701.**
- **BUG-TCM-012 (Low)** — Default "Test Case Result Added" email heading shows the run's name instead of the test
  case's own subject. Found 2026-09-30. **Reported to production as #121702.**
- **BUG-TCM-013 (Medium)** — A single Add Result submission sends the "Test Case Result Added" email twice. Found
  2026-09-30. **Reported to production as #121703.**

All 7 bugs above are assigned to **Sheetal Sharma** and linked to production Test Case **#121697** ("Sanity:
Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and Run **#592**, environment
"Window 11 + Chrome".

## Closed This Session (2026-09-30)

- **BUG-TCM-006 (Medium)** — Failed PDF generation still sends a misleading email. Retested PASS on `localhost:3010`
  (Redmine 7.0.0, git HEAD `97449b9`): two independent PDF-failure causes both correctly fall back to an HTML
  attachment with a visible warning banner, never a silent PDF-less claim. Full evidence in
  `bugs/closed/BUG-TCM-006.md`. Production **#120658 synced to Done / 100%** (`CLAUDE.md` §5, approved).
- **BUG-TCM-003 (High)** and **BUG-TCM-004 (Low)** — closed on the strength of another QA tester's (Nidhi Singh)
  live 2026-09-28 production retest (2 Redmine versions, forge instances, real evidence), accepted per explicit
  user decision rather than running the `TESTCASE_MANAGEMENT_TEST_RUNS.md` suite locally first. Production was
  already Done/100% for both (#120544, #120546) — no write needed, local files brought in sync.

## Closed Previous Session (2026-09-15)

- **BUG-TCM-005 (High)** — Report emailed as PDF arrives with no attachment. Retest PASS 2026-09-14 (TC-TCM-100):
  after completing KB Installation step 6, the PDF email delivers a valid 53,446-byte attachment. Root cause was
  an **incomplete installation**, not a code defect. Residual finding split to BUG-TCM-006. Production **#120588
  still needs syncing to Done / 100%** (`CLAUDE.md` §5) — approval pending, so local and production are
  deliberately out of sync until that write is approved.

## Closed Previous Session (2026-09-11)

- BUG-TCM-001 (Medium) — CSV import padded-header value drop. Retest PASS 2026-09-11 (case #1014 before → #1023 after).
- BUG-TCM-002 (Medium) — CSV import duplicate-header silent discard. Retest PASS 2026-09-11 (explicit warning now shown on the mapping step).
- Neither had a Production Redmine Issue ID, so no production status sync was required on close (`CLAUDE.md` §5).

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-30 | n/a | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | **Production reporting batch — testcase + run created, all 6 remaining open bugs reported.** Per explicit user instruction, created Test Case **#121697** ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30", suite #6 "Testcase plugin") and Run **#592** ("TCM Final-Cycle Regression 2026-09-30", environment "Window 11 + Chrome"), following the established Sanity-testcase pattern rather than reusing an unrelated prior fixture. Reported BUG-TCM-008 → **#121698** (Medium), BUG-TCM-009 → **#121699** (High), BUG-TCM-010 → **#121700** (High), BUG-TCM-011 → **#121701** (High), BUG-TCM-012 → **#121702** (Low), BUG-TCM-013 → **#121703** (Medium) via `report_defect`, all assigned **Sheetal Sharma**, each with the 4 Defect custom fields (Type/Severity/Priority via IDs 43/44/45) mirroring local severity. All 6 local bug MDs (Production Redmine Issue ID + Production report section) and `bugs/_index.md` updated. `bugs/open/` now has all 7 bugs reported to production (BUG-TCM-007 was reported earlier the same day). |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, admin) | **Final-cycle regression — `TESTCASE_MANAGEMENT_CONFIGURATION.md` checkpoint-complete** (18/20 TCs, 2 deferred: TC-TCM-014 needs a real scheduled-interval wait, TC-TCM-017 is a shared-instance risk from stopping Redis). **Found 4 new bugs:** BUG-TCM-010 (High — clearing Testcase Tracker silently misfiles new test cases onto the wrong tracker with zero error, instead of failing cleanly), BUG-TCM-011 (High — Report Defect/New Test Case totally broken on any non-Bug tracker when a Bug-only required custom field exists, root-caused to a GET/POST tracker-resolution asymmetry in `issue_testcase_controller.rb`), BUG-TCM-012 (Low — default Test Case Result Added email shows the run's name instead of the test case's subject), BUG-TCM-013 (Medium — every Add Result submission sends its notification email twice, confirmed via DB row count it's not a duplicate submission). Also fixed a real precondition gap: `run_added`/`run_updated`/`testcase_result_added` notification events were entirely unconfigured on this instance, enabled all three (lasting fix). Live-verified Run and Testcase Email Template marker/macro substitution via Roundcube (`qa@test.local`). Corrected two TCs whose written premise didn't match the plugin's actual architecture (TC-004: Requirements aren't Issues; TC-007: no "hide status field" setting exists, only "Hide Testcase Execution section"). All settings restored to baseline and verified. `bugs/open/` now holds 7 bugs (BUG-TCM-007 through BUG-TCM-013), only #121645 (BUG-TCM-007) reported to production so far. |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (projects `test-project`, `tcm-permissions-private-test`) | Claude (Playwright MCP headed, multi-role: admin/Manager/QA Own Visibility/Developer/Reporter) | **Final-cycle regression — `TESTCASE_MANAGEMENT_PERMISSIONS.md` checkpoint-complete** (all TCs executed except 5 deliberately deferred: TC-TCM-051, 067, 068, 069, 073). Built a dedicated Private project to isolate the non-member/anonymous checks. **Found BUG-TCM-009 (High):** almost the entire plugin has no project-membership or module-enabled check on its read actions — a non-member, or a member of a module-disabled project, can still view test suites, requirements, reports, traceability, to-dos and runs by direct URL; only plain Redmine's own `/projects/<id>` and the top-nav tab correctly gate. Confirmed TC-TCM-058 (run deletion cascades results cleanly, no orphans), TC-TCM-061 (Execute permission independent of run management), TC-TCM-062/066 (report view/create-scoping correct except the already-known BUG-TCM-007 gap), TC-TCM-076 (permission revocation takes effect immediately, verified via Rails console, permission restored afterward). TC-TCM-073 blocked mid-delete by the session's auto-mode permission classifier — deferred pending user input. `bugs/open/` now holds 3 bugs (BUG-TCM-007 #121645, BUG-TCM-008, BUG-TCM-009 not yet reported). |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP headed, multi-role: admin/Manager/QA Own Visibility/Developer/Reporter) | **Final-cycle regression started — `TESTCASE_MANAGEMENT_PERMISSIONS.md` in progress (20/32 TCs).** Established a real role→permission mapping (none existed live before this session — every non-admin role had zero Testcase Management permissions granted). Executed Test Suite/Run/Execution/Reporting/Requirement Management granted-role legs (all PASS) and denied-role legs for Test Suites/Runs/Reports/Requirements. **Found BUG-TCM-007 (High):** Test Suite Management, Reporting, and Requirement Management controllers (`test_suites_controller.rb`, `testcase_reports_controller.rb`, `requirements_controller.rb`) have zero authorization checks on create/edit/delete — live-confirmed a zero-permission Reporter-role user could create+edit+delete a test suite, create a requirement (201, real DB row), and create a report ("successfully" + real DB row), all via direct URL/endpoint even though the corresponding UI controls were correctly hidden in most cases. Test Run Management, Test Execution, and To-Do Management spot-checked as a control and confirmed correctly protected (`allowed_to?` guards present and working). Filed `bugs/open/BUG-TCM-007.md`, updated `bugs/_index.md`, `STATUS.md`. Not yet reported to production. |
| 2026-09-30 | 7.0.0 | Docker `localhost:3010` (project `test-project`, git HEAD `97449b9`) | Claude (Playwright MCP headed, admin + shell access) | **BUG-TCM-006 retest — PASS, closed as FIXED.** Instance had never had Installation step 6 completed: installed Node/npm/Chromium, wired SMTP to the local Docker mail server, corrected `Setting.host_name`, set `admin`/`luna.blossom` emails to real checkable mailboxes. Baseline PDF verified genuine (1,001,291 B, 32/32 streams inflate). Two independent PDF-failure causes (missing `--no-sandbox`, found incidentally; bad `PUPPETEER_EXECUTABLE_PATH`, the bug's own repro) both correctly produced an HTML-fallback attachment with a visible warning banner — never a silent misleading email. Spot-checked a second report type (Defect Summary) and confirmed the HTML format path is not regressed. `TC-TCM-101` updated with full evidence. **While checking production status, found #120544/#120546 (BUG-TCM-003/004) already Done on production** per another tester's (Nidhi Singh) 2026-09-28 retest. Production #120658 synced to Done/100% (approved). **Per explicit user follow-up approval, also closed BUG-TCM-003/BUG-TCM-004 locally** on that other tester's production evidence rather than running the Test Runs suite here — `bugs/open/` is now empty, though `STATUS.md` stays In Progress (§10) pending a full final-cycle regression (§27). |
| 2026-09-15 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP headed, admin) | **Retest pass 2, after the developer switched branch and restarted the container — BUG-TCM-003 and BUG-TCM-004 both PASS.** Redis and Sidekiq were down after the restart and were started by QA first (`redis-server --daemonize`, `bundle exec sidekiq`) — neither comes back with the container. **BUG-TCM-003:** the bulk form now posts to `/issue_status_results/bulk_create` (new non-`.json` route, `routes.rb:191-195`; `@bulk_url` re-pointed at `issue_status_results_controller.rb:26`); `Current user: admin (id=1)`, **201 Created**, rows 859/860 written for #437/#448 with environment `chrome`, modal closed and grid refreshed. The `.json` route at `routes.rb:162` is deliberately retained for API clients. **BUG-TCM-004:** view line 16 now `.html_safe`; DOM shows a real `<strong>` element, `textContent` reads "Apply to 2 testcase(s)." **Trap noted:** the grid appeared to still show `Untested` after the save because it is filtered per environment (`fdsgsdf`) while the save targeted `chrome` — switching the filter shows both cases `Passed`. **Both stay in `bugs/open/` pending the Test Runs suite regression (§26, High severity).** Sibling `.json` routes (163/167/168/175) unchanged; `testrun.js:345` calls bulk_delete with `?key=api_key`, which would sidestep the defect — code reading only, untested. |
| 2026-09-15 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP headed, admin) | **Retest pass 1, previous branch — BUG-TCM-003 and BUG-TCM-004 both FAIL.** Bulk Update Result on test cases #434/#435 still returns **401 Unauthorized** with `Current user: anonymous` and `Filter chain halted as :check_if_login_required`; Submit stuck on "Saving…", nothing saved. "Nothing saved" verified in the DB, not the grid — the grid already showed `Passed` from 2026-09-11, which would have read as a false pass. Control: single Add Result on #436 in the same session → `Current user: admin (id=1)`, 200 OK, row 858 created, confirming the `.json`-vs-non-`.json` asymmetry is intact. BUG-TCM-004's count line still renders `&lt;strong&gt;` escaped (`hasStrongEl: false`). Source on the container confirms **no fix applied**: `routes.rb:162` unchanged, no `prepend_before_action` anywhere, `en.yml:927` and `_new_result_form.html.erb:16` unchanged. |
| 2026-09-15 | n/a | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | Reported BUG-TCM-006 as **#120658** (Bug, category Testcase Management Plugin, Priority Medium, assigned to Sheetal Sharma), description linking back to #120588 and stating the split. **Custom fields set successfully in the same call** — Defect Type Functional / Defect Severity Medium-severity / Defect priority Medium (IDs 43/44/45; `list_custom_fields` is still permission-blocked but direct IDs work). Evidence JPEG attached as id 93611, **checksum-verified byte-exact**. The bug PDF (13.4 KB) and MD (14.4 KB) were deliberately **not** uploaded — above the ~4 KB safe ceiling for this channel — and need manual attachment. |
| 2026-09-15 | 6.1.3 | Docker `localhost:3012` (project `test`) — desk review of 2026-09-14 evidence | Claude (no new live execution) | **BUG-TCM-005 rescoped and closed.** Original scope verified against the customer report, the bug title, both Expected-result bullets and TC-TCM-100 before changing anything. Test 1 (PDF delivered, 53,446-byte valid attachment) satisfies every one — root cause was an incomplete installation, not a code defect. Test 2's residual finding (a *failed* PDF still sends an email promising an attachment) split out as **BUG-TCM-006 (Medium)**; TC-TCM-101 moved to it as its retest vehicle and rewritten with real preconditions. TC-TCM-100 flipped to CONFIRMED PASS. `_duplicates.md` given a decision rule separating the two. Partial Reports regression: TC-TCM-098/523/525 PASS; **full suite regression outstanding.** 2 production writes queued pending approval. |
| 2026-09-14 | 6.1.3 | Docker `localhost:3012` (project `test`) | Claude (Playwright MCP headed, admin) | Client-reported "Report Email Issue". **All six report types** emailed in both formats to a real mailbox (12 reports). **HTML PASS for all six** (valid `multipart/mixed` attachments, 14–25 KB); **PDF FAIL for all six** (bare `text/html`, no attachment part, body still claims one). Root-caused to missing Node/Puppeteer for `grover` plus a `rescue` that sends the mail anyway; also found the bundled wkhtmltopdf fallback is broken (`libXrender.so.1`). 1 bug filed: BUG-TCM-005 (High). |
| 2026-09-02 | (fill from environment) | Docker `localhost:3010` (project `test-project`) | External session, folded in by Claude | CSV Import feature: 16 TCs (14 PASS, 2 FAIL). 2 bugs filed (BUG-TCM-001, BUG-TCM-002). Not yet reproduced in-session. |
| 2026-09-11 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP, admin) | Targeted investigation of customer-reported bulk-update failure in a test run. Reproduced across 2 environments, 2 statuses, with and without notes. 2 bugs filed: BUG-TCM-003 (High, root-caused to `.json` route bypassing session auth) and BUG-TCM-004 (Low, escaped HTML in modal label). Single Add Result confirmed working. |
| 2026-09-11 | 7.0.0 | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | Reported BUG-TCM-003 as **#120544** (High) and BUG-TCM-004 as **#120546** (Low), both assigned to Sheetal Sharma, no Test Run / Environment / Test Case ID per user instruction. #120546 carries PDF + MD + screenshot, all byte-exact. #120544's screenshot attachment uploaded corrupt and needs replacing; its PDF is fine. Defect * custom fields left at project defaults on both. |
| 2026-09-11 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP, admin) | Retest + regression after BUG-TCM-001 / BUG-TCM-002 fix. Both retests PASS on their original fixtures (#1023 padded-header now correct; duplicate-header warning now shown before confirm). Full CSV Import suite regression per §26: 17 fixtures / 16 TCs (TC-TCM-021 … TC-TCM-036) re-run, **all PASS, zero new failures**. Both bugs moved to `bugs/closed/`. |
