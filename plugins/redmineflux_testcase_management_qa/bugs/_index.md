# Bug Index — Redmineflux Testcase Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-TCM-007 | Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission check at all — any project member can create, edit or delete them regardless of role | Open | High | 7.0.0 | #121645 | bugs/open/BUG-TCM-007.md |
| BUG-TCM-008 | Run detail page crashes with an unhandled 500 error whenever the run's environment-assignee user has been deleted | Open | Medium | 7.0.0 | #121698 | bugs/open/BUG-TCM-008.md |
| BUG-TCM-009 | Almost the entire plugin has no project-membership check at all — any logged-in user can view test suites, requirements, reports, traceability, to-dos and runs for a private project they are not a member of | Open | High | 7.0.0 | #121699 | bugs/open/BUG-TCM-009.md |
| BUG-TCM-010 | With the Testcase Tracker setting cleared, "New Test Case" silently creates a Bug instead of failing with a configuration error — the issue is invisible to every Testcase Management view from then on | Open | High | 7.0.0 | #121700 | bugs/open/BUG-TCM-010.md |
| BUG-TCM-011 | Report Defect (and New Test Case) cannot be completed at all when Defect/Testcase Tracker is set to anything other than "Bug" — two Bug-only required custom fields are enforced but never rendered | Open | High | 7.0.0 | #121701 | bugs/open/BUG-TCM-011.md |
| BUG-TCM-012 | Default "Test Case Result Added" notification email shows the run's name instead of the test case's own subject in its heading | Open | Low | 7.0.0 | #121702 | bugs/open/BUG-TCM-012.md |
| BUG-TCM-013 | Adding a single test result sends the "Test Case Result Added" notification email twice | Open | Medium | 7.0.0 | #121703 | bugs/open/BUG-TCM-013.md |
| BUG-TCM-014 | The Defects field on a Failed/Blocked Add Result form cannot find or link any existing defect — search always returns "No results found," for every query including blank | Open | High | 7.0.0 | #121836 | bugs/open/BUG-TCM-014.md |
| BUG-TCM-015 | "Attach files" to an execution result — documented in the User Guide's own Add Result steps — has no corresponding control anywhere on the Add Result form, for any status | Open | Medium | 7.0.0 | #121838 | bugs/open/BUG-TCM-015.md |
| BUG-TCM-017 | Test Suite Create and Edit modals have no Description field at all, despite the User Guide documenting one; leftover JS throws a console error on every modal open | Open | Low | 7.0.0 | #121839 | bugs/open/BUG-TCM-017.md |
| BUG-TCM-018 | "Add Sub Test Suite" silently creates an orphaned top-level suite instead of a 3rd nesting level — hidden parent-id field only populates one level deep | Open | Medium | 7.0.0 | #121840 | bugs/open/BUG-TCM-018.md |
| BUG-TCM-020 | Renaming an Environment updates the Environment list and new-run forms correctly, but every already-created run still shows the old environment name everywhere on its own page | Open | Medium | 7.0.0 | #121841 | bugs/open/BUG-TCM-020.md |
| BUG-TCM-021 | Any re-render of the New Test Case form (a Category change, or simply a failed validation submit) silently destroys already-entered Steps and removes the Steps/Requirements sections entirely | Open | High | 7.0.0 | #121842 | bugs/open/BUG-TCM-021.md |
| BUG-TCM-022 | Every "New Test Case" created via the plugin's own creation form lands on the Bug tracker instead of the correctly-configured Test case tracker | Open | Critical | 7.0.0 | #121843 | bugs/open/BUG-TCM-022.md |
| BUG-TCM-023 | The inline pencil-icon Subject editor on a test case's detail page has no way to save a change — Enter and blur both silently discard it | Open | Low | 7.0.0 | #121989 | bugs/open/BUG-TCM-023.md |
| BUG-TCM-024 | The Testcase Summary's "Search by subject or ID" box does not actually search by ID — searching a real issue's exact numeric ID returns no results | Open | Medium | 7.0.0 | #121845 | bugs/open/BUG-TCM-024.md |
| BUG-TCM-025 | There is no working UI path at all to associate an already-existing test case with a suite — drag-and-drop doesn't work, no "add existing cases" action exists, and the issue's own Edit form has no Suite field | Open | Critical | 7.0.0 | #121846 | bugs/open/BUG-TCM-025.md |
| BUG-TCM-026 | "Remove Testcase" from a suite returns 200 OK with the correct payload but does not actually remove the case — it silently remains in the suite's grid | Open | High | 7.0.0 | #121847 | bugs/open/BUG-TCM-026.md |
| BUG-TCM-027 | Removing a Requirement link via the issue Edit form's select2 widget does not persist — the requirement remains linked after submit | Open | Medium | 7.0.0 | #121848 | bugs/open/BUG-TCM-027.md |
| BUG-TCM-028 | A project with zero Runs cannot create any report at all — "Runs must have at least one selected" blocks creation even with "Include all test run" selected (the default) | Open | Medium | 7.0.0 | #121990 | bugs/open/BUG-TCM-028.md |
| BUG-TCM-029 | A rejected duplicate-name suite create leaves a stale "ghost" node in the suite tree until the page is reloaded | Open | Low | 6.x | #122071 | bugs/open/BUG-TCM-029.md |
| BUG-TCM-030 | Opening the "Add Test Suite" modal throws a JS TypeError (`Cannot read properties of null (reading 'addEventListener')`) every time | Open | Low | 6.x | #122072 | bugs/open/BUG-TCM-030.md |
| BUG-TCM-031 | Creating a Run scoped to a test suite that has zero test cases fails with the misleading message "Testsuite is not selected" | Open | Low | 6.x | #122073 | bugs/open/BUG-TCM-031.md |
| BUG-TCM-032 | The documented "one-command automation runner" (run-demo-tests.sh) always fails at Step 4 — it parses for a RUN_ID= line the current client tool no longer prints | Open | High | 6.x | #122074 | bugs/open/BUG-TCM-032.md |
| BUG-TCM-033 | The single-row drag "Copy Testcase"/"Move Testcase" popup is completely non-functional — it calls a TestcasesController that has never existed in the codebase | Open | Medium | 6.x | #122075 | bugs/open/BUG-TCM-033.md |
| BUG-TCM-034 | Switching the suite-tree chart's dimension never actually updates the chart — the real data refresh is chained inside a save call that always 404s | Open | High | 6.x | #122076 | bugs/open/BUG-TCM-034.md |
| BUG-TCM-035 | Test Environment "Select Components" picker is hardcoded to 3 generic placeholder values with no way to enter real component values, despite the model fully supporting free text | Open | Medium | 6.x | #122077 | bugs/open/BUG-TCM-035.md |
| BUG-TCM-036 | The execution_defects backfill migration (20261001000002) crashes immediately on MySQL whenever there is real defect_ids data to backfill — insert_all(unique_by:) is unsupported on this adapter | Open | High | 6.x | #122092 | bugs/open/BUG-TCM-036.md |
| BUG-TCM-037 | Traceability Matrix (TraceabilityRtmsController#index) has no permission or membership check at all — fully accessible to completely anonymous, unauthenticated callers | Open | Critical | 6.x | #122093 | bugs/open/BUG-TCM-037.md |
| BUG-TCM-038 | QA Milestone update/delete have no server-side permission check at all — any project member can edit or delete a milestone regardless of role | Open | High | 6.x | #122094 | bugs/open/BUG-TCM-038.md |
| BUG-TCM-039 | The Runs & Results "Closed" tab is unreachable whenever the project has at least one Active run — @current_tab always resolves to "Active" regardless of the requested tab param | Open | High | 6.x | #122095 | bugs/open/BUG-TCM-039.md |
| BUG-TCM-040 | bulk_testcase_create crashes with a 500 whenever steps_and_results is omitted, even though steps are clearly meant to be optional | Open | Medium | 6.x | #122096 | bugs/open/BUG-TCM-040.md |
| BUG-TCM-041 | GET /get_testcase/:id returns a 404 with a completely empty body, contradicting API.md's documented JSON error schema | Open | Low | 6.x | #122097 | bugs/open/BUG-TCM-041.md |
| BUG-TCM-042 | GET /projects/:project_id/get_testcases.json ignores :project_id entirely — any authenticated user can read every test case on the instance | Open | Critical | 6.x | #122098 | bugs/open/BUG-TCM-042.md |
| BUG-TCM-043 | bulk_testcase_create crashes with a raw 500 (not the documented 422) when the plugin tracker was never configured at all | Open | Medium | 7.0.0 | #122099 | bugs/open/BUG-TCM-043.md |
| BUG-TCM-044 | rftc-008 "link an existing defect" UI (picker, bulk-link action, per-execution display) is never integrated into the Run execution view — feature is API-only | Open | Critical | 6.x | #122104 | bugs/open/BUG-TCM-044.md |
| BUG-TCM-045 | link_defect/unlink_defect permission denial reuses bulk_create's assignee-specific error message, describing a check these actions don't perform | Open | Low | 6.x | #122105 | bugs/open/BUG-TCM-045.md |
| BUG-TCM-005 | Report emailed as PDF arrives with no attachment at all, while the body still says "Please find the attached Testcase Report" | Closed | High | 6.1.3 | #120588 | bugs/closed/BUG-TCM-005.md |
| BUG-TCM-003 | Bulk update result fails for every browser user because the bulk endpoint rejects the logged-in session and treats the request as an unauthenticated API call | Closed | High | 7.0.0 | #120544 | bugs/closed/BUG-TCM-003.md |
| BUG-TCM-004 | Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line | Closed | Low | 7.0.0 | #120546 | bugs/closed/BUG-TCM-004.md |
| BUG-TCM-006 | Failed PDF generation still sends an email whose body promises an attachment that is not there, with nothing surfaced in the UI | Closed | Medium | 6.1.3 | #120658 | bugs/closed/BUG-TCM-006.md |
| BUG-TCM-001 | CSV import silently drops the value of a step column whose header has leading/trailing whitespace | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-001.md |
| BUG-TCM-002 | CSV import silently discards the second occurrence of a duplicated column header with no warning | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-002.md |

- **BUG-TCM-009 extended 2026-10-01** while executing `TESTCASE_MANAGEMENT_TODO.md` TC-TCM-214: a 9th affected
  endpoint confirmed, `testcase_activities` (Activity log) — a non-member can view a private project's activity
  feed directly by URL, same missing-membership-guard root cause as the other 8 endpoints already documented.
- **BUG-TCM-022 extended 2026-10-01** while executing TC-TCM-209: beyond new test cases defaulting to the wrong
  tracker at creation, confirmed the tracker **cannot be corrected afterward either** — a genuine bulk-edit
  Tracker change to "Test case" does not persist (issue stays on Bug tracker after submit).

- **BUG-TCM-014, 015, 017, 018, 020, 021, 022, 024, 025, 026, 027 reported to production `ztflux` on 2026-10-01**,
  all assigned to Sheetal Sharma: #121836 (TCM-014), #121838 (TCM-015), #121839 (TCM-017), #121840 (TCM-018),
  #121841 (TCM-020), #121842 (TCM-021), #121843 (TCM-022), #121845 (TCM-024), #121846 (TCM-025), #121847
  (TCM-026), #121848 (TCM-027). Linked via `report_defect` against the same established Sanity testcase
  **#121697** / run **#592**, environment "Window 11 + Chrome" used for the earlier BUG-TCM-008–013 batch, each
  with `priority_id`/Defect Severity/Defect priority mapped from local severity and Defect Type = Functional.
  **BUG-TCM-023 could not be reported this round** — `create_issue` was denied twice by the session's own
  auto-mode permission classifier ("External System Writes"); per the tool's own guidance not to keep retrying
  past a denial, it was left for the user to approve/retry directly. All 11 other bugs in `bugs/open/` are now
  reported to production; only BUG-TCM-023 remains unreported.

- **BUG-TCM-023 and BUG-TCM-028 (the two remaining unreported open TCM bugs) reported to production `ztflux` on
  2026-10-05**, per explicit user approval: BUG-TCM-023 → **#121989** (Low), BUG-TCM-028 → **#121990** (Medium),
  both assigned to Sheetal Sharma. Linked via `report_defect` against the established production Sanity testcase
  **#121697** / Run **#592**, environment "Window 11 + Chrome" — confirmed via `get_run_testcases` showing both
  new IDs in the testcase's linked defects list. **Every bug in `bugs/open/` is now reported to production.**
- **BUG-TCM-028 (Medium) found 2026-10-05** while building the automation-first Playwright spec for
  `TESTCASE_MANAGEMENT_REPORTS.md` (TC-TCM-095): a project with zero Runs cannot create **any** report type at
  all — "Runs must have at least one selected" blocks creation even with the default "Include all test run"
  option selected (reproduced 4/4 report types tried). Contradicts TC-095's own expected "renders an explicit
  empty state" behavior. Not yet reported to production.

- **BUG-TCM-029, 030, 031 (all Low) found 2026-10-05** while executing the scoped V1 7.1.0 release cycle
  (`docs/qa/V1-TEST-CYCLE-7.1.0.md`) on a **different, freshly re-seeded Docker instance** (`localhost:3015`,
  project `qa-demo`) than the rest of this file's `localhost:3010` entries — environment field says so per bug.
  029: a rejected duplicate-name suite create leaves a stale ghost node in the tree until reload (DB confirms no
  real duplicate). 030: the Add Test Suite modal throws a harmless-but-real JS TypeError on every open. 031:
  scoping a new Run to a suite with zero test cases fails with "Testsuite is not selected" — initially
  misdiagnosed as a structural "checkboxes live outside the form" defect (true, but not the actual blocker);
  double-checked by scoping a Run to a non-empty suite (succeeded, Run #7) and to a dedicated empty probe suite
  (failed identically), isolating the real trigger to suite emptiness, not the picker mechanism. None yet
  reported to production.

- **BUG-TCM-033 corrected 2026-10-05**, same day it was filed: originally claimed TC-SUITE-05-01/05-02's
  checkbox-multi-select move/copy was broken. It is not — only the *separate* single-row drag "Copy
  Testcase"/"Move Testcase" popup (`copyTestcase()`/`moveTestcase()` → dead `TestcasesController`) is broken,
  exactly as the team's own `docs/qa/areas/SUITE-CASE.md` (TC-CASE-03-03, "Finding 1") already predicted. Caught
  after the user reported successfully moving a test case manually; re-scoped and re-executing TC-SUITE-05-01
  against the real mechanism (`TestSuitesController#add_issues`/`#copy_issues`).
- **BUG-TCM-032 (automation runner), BUG-TCM-033 (single-row drag, corrected), BUG-TCM-034 (chart dimension
  switch) found 2026-10-05** on the same `localhost:3015`/`qa-demo` 7.1.0 cycle — see each bug file for full
  root-cause detail (CI script's stale `RUN_ID=` parsing, dead `TestcasesController`, and the chart save call's
  `project_id` lookup always 404ing, respectively). None yet reported to production.
- **BUG-TCM-014 reconfirmed 2026-10-05** on `localhost:3015` (v7.1.0, the separate V1 7.1.0 cycle) while
  executing TC-EXEC-01-02: the Defects* field on a Failed Add Result form still has zero searchable options and
  fires no network request — identical symptom to the original v7.0.0 finding, confirming it's not fixed in
  7.1.0. Extended further the same day (TC-EXEC-06-01): it also fails to pre-populate an *already*-linked
  defect, not just search for a new one. See the bug file's "Reconfirmation" section.
- **BUG-TCM-036 (High) found 2026-10-05** while executing TC-DEFECT-05-03: the `execution_defects` backfill
  migration (`20261001000002`) calls `insert_all(rows, unique_by:)`, an option Rails' MySQL adapter does not
  support — it crashes with `ArgumentError` the moment any real `defect_ids` data exists to backfill. It shows as
  "already run" in `schema_migrations` only because it first ran against an empty table. TC-DEFECT-05-04 is
  blocked by this same bug. Not yet reported to production.
- **BUG-TCM-029 through BUG-TCM-035 (all 7) reported to production `ztflux` on 2026-10-05**, per explicit user
  instruction, assigned to **Vaishnavi Bhawsar** (id 192), Category Testcase Management Plugin, Target Version
  **"Testcase Management plugin Release 7.1.0 [07-10-2026]"** (version id 2066): BUG-TCM-029 → **#122071** (Low),
  030 → **#122072** (Low), 031 → **#122073** (Low), 032 → **#122074** (High), 033 → **#122075** (Medium), 034 →
  **#122076** (High), 035 → **#122077** (Medium). Priority/Defect Severity/Defect priority mapped from local
  severity per the standard table; Defect Type Functional for all 7. **Per explicit user instruction, none of
  these 7 were linked to a production Test Case or Run** — a deliberate deviation from the established
  Sanity-testcase+Run linking pattern used for this plugin's other bugs. Every bug from the V1 7.1.0 cycle
  (029–035) is now on production.
- **BUG-TCM-035 (Medium) found 2026-10-05** while executing TC-RUN-03-01: the Test Environment "Select
  Components" picker only offers 3 hardcoded generic options (Hardware/Software/Configuration) via a plain
  (non-tagging) select2 widget, even though `TestcaseEnvironment#components=` fully supports arbitrary free-text
  strings — confirmed directly via Rails console. Makes it impossible to record real environment descriptors
  (browser/OS versions) through the UI. TC-RUN-03-01 completed with a workaround (Hardware/Software substituted
  for the intended "Chrome 129"/"Windows 11") so dependent cases could proceed. Not yet reported to production.

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
- BUG-TCM-005 was found on a different instance than the others: Docker `localhost:3012` (`redmine-docker-6-redmine-1`, Redmine 6.1.3), not `localhost:3010`. Reported to production as **#120588** on 2026-09-14, assigned to Sheetal Sharma. Its attached `BUG-TCM-005.pdf` uploaded **corrupt** (2 bytes altered in transit; 1 of 4 content streams will not decompress) and needs replacing — see the handoff.
- **BUG-TCM-005 closed 2026-09-15** on its original scope — *PDF generation and attachment failure*. Root cause was
  an incomplete installation (KB Installation step 6 never run), not a code defect; after installing Node.js +
  Puppeteer + Chromium the PDF email delivers a valid 53,446-byte attachment (retest Test 1, 2026-09-14,
  TC-TCM-100 PASS). Production **#120588** must be synced to Done / 100% (`CLAUDE.md` §5) — pending write approval.
- **BUG-TCM-006 was split out of BUG-TCM-005** on 2026-09-15, not found independently. It carries the residual
  finding from that retest's Test 2: when PDF generation *fails*, the email is still sent with a body promising an
  attachment. Different assertion (TC-TCM-101 vs TC-TCM-100), different cause (code vs environment), and only
  reachable by deliberately breaking PDF generation. Reported to production as **#120658** on 2026-09-15,
  assigned to Sheetal Sharma; its description links back to #120588 and states the split explicitly. Its evidence
  JPEG (attachment id 93611) was checksum-verified byte-exact after upload.
- **BUG-TCM-003 and BUG-TCM-004 both retested PASS on 2026-09-15** after the developer switched branch on `localhost:3010`. Kept in `bugs/open/` at the time: `SENIOR_QA_STANDARDS.md` §26 gates closure on the affected-suite regression, and `TESTCASE_MANAGEMENT_TEST_RUNS.md` (TC-TCM-152–440) had never been executed.
- **BUG-TCM-003 and BUG-TCM-004 closed 2026-09-30**, on production evidence rather than a local regression run: while checking BUG-TCM-006's production status, found #120544 and #120546 were already **Status: Done, 100%**, retested live by **Nidhi Singh** on 2026-09-28 on two Redmine versions (6.0.11, 7.0.1, forge instances) with real Playwright evidence (route checks, network 201s, before/after grid/DOM state). **Per explicit user decision, accepted as satisfying §26** rather than re-running `TESTCASE_MANAGEMENT_TEST_RUNS.md` locally first. Production was already Done/100% for both — no write needed, local files brought in sync. `TESTCASE_MANAGEMENT_TEST_RUNS.md` regression remains genuinely unexecuted in this repo and should still be run as part of this plugin's overall test coverage, just not as a gate on these two bugs anymore.
- **BUG-TCM-006 retested PASS 2026-09-30** on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0, git HEAD `97449b9`, includes fix commits `dee611e`/`58c68d2`/`9e82662`). Two independent PDF-failure causes both produced the correct HTML-fallback + warning email; HTML format and a second report type (Defect Summary) both spot-checked. Full evidence in `bugs/closed/BUG-TCM-006.md`. Production **#120658 synced to Done / 100% 2026-09-30** (`CLAUDE.md` §5, approved).
- **`bugs/open/` was briefly empty on 2026-09-30**, then **BUG-TCM-007 (High) was found the same day** while executing the final-cycle regression's Permissions suite (`TESTCASE_MANAGEMENT_PERMISSIONS.md`): create/edit/delete for Test Suites, Reports, and Requirements (9 of 17 plugin permissions) have zero authorization check at all — live-confirmed a denied-role user (Reporter, zero Testcase Management grants) could create, edit and delete test suites and requirements, and create reports, via direct URLs/endpoints. Test Run Management, Test Execution, and To-Do Management were spot-checked as a control and are correctly protected. **Reported to production as #121645 on 2026-09-30**, assigned to Sheetal Sharma. Per `CLAUDE.md` §10, `STATUS.md` cannot read `Complete` while `bugs/open/` is non-empty.
- **BUG-TCM-014 (High) found 2026-10-01** while executing TC-TCM-174 (`TESTCASE_MANAGEMENT_TEST_RUNS.md`, final-cycle regression): the **Defects\*** field on a Failed/Blocked Add Result form can never find or link an already-existing defect — every search query, including a blank one, returns "No results found," and zero network requests are ever issued. Root-caused to the underlying `issue_status_result_defect_ids` Select2 `<select>` rendering with zero `<option>` elements and no AJAX data source configured at all; the only way it ever gets populated is "Report Defect" injecting a brand-new issue's option directly via JS. A tester is forced to create a fresh duplicate defect for every failing case, even when a real matching defect already exists from an earlier failure in the same run. Also newly confirmed this session: BUG-TCM-011 blocks ordinary **New Test Case** creation under this project's own current baseline config (not just a deliberately non-default one) — see that bug file's "Reconfirmation" section. Not yet reported to production.
- **BUG-TCM-015 (Medium) found 2026-10-01** while continuing `TESTCASE_MANAGEMENT_TEST_RUNS.md`: TC-TCM-176 found the Add Result panel has no file-attachment control at all for any Status, despite `TESTCASE_MANAGEMENT_USER_GUIDE.md` line 99 documenting it as step 7 of Record a Result. Not yet reported to production.
- **BUG-TCM-019 filed then retracted same day, 2026-10-01**, while executing TC-TCM-199: originally claimed
  deleting a test suite retrackers its contained test cases from Test case to Bug, based on the suite's own
  "Testcase Summary" grid showing the cases as Test case tracker before deletion. Later discovered **that grid
  does not filter by tracker at all** — it lists issues purely by `testsuite_id` association, so its presence
  proves nothing about tracker. Direct issue-page checks revealed the real, broader defect: **every single test
  case created this session via the New Test Case form lands on the Bug tracker from creation**, suite deletion
  or not — filed as **BUG-TCM-022** (Critical). BUG-TCM-019 deleted (never reported to production); TC-TCM-199's
  verdict corrected in the suite file.
- **BUG-TCM-021 (High) and BUG-TCM-022 (Critical) found 2026-10-01** while executing TC-TCM-128: BUG-TCM-021 is
  the New Test Case form's Steps/Requirements section vanishing (with already-entered content destroyed) on any
  form re-render — a Category change, or simply the near-guaranteed first-attempt validation failure from
  BUG-TCM-011. BUG-TCM-022 is the discovery above (every create lands on Bug tracker despite correct
  configuration) — likely the same GET/POST tracker-resolution gap as BUG-TCM-011, now shown to affect the actual
  tracker assignment, not just custom-field validation. Neither yet reported to production.
- **BUG-TCM-016 filed then retracted same day, 2026-10-01**, while executing TC-TCM-181: initially concluded the run grid's "Add Filter" dropdown had no defect-status filter because its top-level option list (Subject/Priority/Run result/Test case/Created at/Updated at) names nothing explicitly about defects. While setting up TC-TCM-188's bulk-update test on the same page moments later, discovered that **selecting "Test case" as the filter field reveals a second-level sub-filter with exactly "Without Defects"/"With Defects" options** — the feature does exist, just nested a level deeper than the initial check looked. Live-verified both values actually filter correctly ("With Defects" on run #22 correctly returned 0 of 17 since none of that run's cases had a linked defect yet; "Without Defects" correctly returned all 17). Deleted the bug file (never reported to production) and corrected TC-TCM-181 to PASS. Recorded as a reminder to drill into every sub-level of a compound filter control before concluding a documented option is absent.
- **BUG-TCM-010 (High) found 2026-09-30** while executing TC-TCM-001 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`): clearing the Testcase Tracker setting doesn't fail cleanly — "New Test Case" silently creates the issue on the project's first tracker (`Bug`) instead, permanently invisible to every Testcase Management view since those all filter by the configured tracker. Root-caused to a `||` fallback in `issue_testcase_controller.rb#new` that resolves a blank setting to "whichever tracker is first" instead of the error path the same controller already has elsewhere for a genuinely missing tracker. Setting restored immediately after. Not yet reported to production.
- **BUG-TCM-011 (High) found 2026-09-30** while executing TC-TCM-005 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`): setting Testcase Tracker and Defect Tracker to the same non-Bug tracker (also side-observed with Defect Tracker = Support during TC-003) breaks Report Defect entirely — two Bug-tracker-only required custom fields are validated on `create` even though they're never rendered on the form and the issue is correctly landing on the configured (non-Bug) tracker. Root-caused to `issue_testcase_controller.rb`'s `new` action resolving the tracker explicitly before rendering, while `create` never applies that same resolution before running validation. Reproduces identically across two different non-Bug tracker choices, confirming it's tracker-general. All tracker settings restored to baseline immediately after. Not yet reported to production.
- **BUG-TCM-013 (Medium) found 2026-09-30** while executing TC-TCM-009/013: submitting a single Add Result reliably sends the "Test Case Result Added" notification email **twice** — reproduced independently for 2 different test cases/templates, each time exactly one `IssueStatusResult` DB row was created (ruling out a duplicate form submission). Root cause not fully isolated — most likely a Sidekiq job retry against the local mail server, but needs live Sidekiq log access to confirm. Not yet reported to production.
- **BUG-TCM-012 (Low) found 2026-09-30** while executing TC-TCM-013 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`): enabled the `run_added`/`run_updated`/`testcase_result_added` notification events (unconfigured on this instance, none were checked — precondition fix, not a bug) and live-verified the Run Added and Test Case Result Added emails. Found the default (no-custom-template) Test Case Result Added email's body heading shows `@run.name` where `@issue.subject` belongs — email subject line is correct, only the in-body heading is wrong. Simple one-line view fix. Not yet reported to production.
- **BUG-TCM-009 (High) found 2026-09-30** while executing TC-TCM-074 (non-member access to a private project): built a dedicated brand-new Private project (`tcm-permissions-private-test`) specifically to isolate this check, confirmed via Rails console the test user had zero membership/role on it, then found that essentially every plugin controller's read actions (`test_suites`, `testcase_reports`, `requirements`, `traceability_rtms`, `testcase_todos`, `runs#new/index/show`) render fully for that non-member just by hitting the URL directly — only plain Redmine's own `/projects/<id>` correctly 403s. Distinct root cause from BUG-TCM-007: this is a missing **project-membership** check on **read** actions across nearly the whole plugin (not a missing role-permission check on writes in 3 controllers). **Extended same day with a TC-TCM-077 finding**: the plugin also never checks `@project.module_enabled?('testcase_management')` — disabling the module hides the TestCases tab but does not block direct URLs to `/test_suites` or `/runs/new`, same missing-guard pattern. Not yet reported to production.
- **BUG-TCM-010 (High) found 2026-09-30** while executing TC-TCM-001 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`, the plugin's own suite, not the Permissions one): cleared the instance-wide Testcase Tracker setting, expecting either a blocked create or a clear config error per the TC. Instead the "New Test Case" form rendered and submitted with no error at all, silently creating the issue on the project's first tracker (`Bug`) instead — permanently invisible to every Testcase Management view from then on (those all filter by the configured tracker). Root-caused to a `||` fallback in `issue_testcase_controller.rb#new` that resolves a blank setting to "whichever tracker is first" instead of the error path the same controller already has elsewhere. Setting restored to its correct value (`4`, Test case) immediately after the test; the stray misfiled issue (#1580) was left as the reproduction artifact and can be deleted once fixed. Not yet reported to production.
- **BUG-TCM-008 through BUG-TCM-013 (all 6 remaining open bugs) reported to production `ztflux` on 2026-09-30**, all assigned to Sheetal Sharma: #121698 (TCM-008), #121699 (TCM-009), #121700 (TCM-010), #121701 (TCM-011), #121702 (TCM-012), #121703 (TCM-013). Linked via `report_defect` against a dedicated production testcase **#121697** ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30", suite 6 "Testcase plugin") and run **#592** ("TCM Final-Cycle Regression 2026-09-30"), environment "Window 11 + Chrome" — the established Sanity-testcase pattern, not piled onto BUG-TCM-007's earlier fixture. Each defect's priority_id and the 4 Defect custom fields (43 Type=Functional, 44 Severity, 45 Priority) mirror the bug's local severity (High→3/High-severity/High, Medium→2/Medium-severity/Medium, Low→1/Low-severity/Low).
- BUG-TCM-003 (#120544) and BUG-TCM-004 (#120546) were reported to production `ztflux` on 2026-09-11, both assigned to Sheetal Sharma. Reported without Test Run / Environment / Test Case ID at the user's instruction. Their four Defect * custom fields carry project defaults, not the mapped values - see the handoff for what still needs correcting.
- BUG-TCM-001 and BUG-TCM-002 were closed on 2026-09-11 after a retest PASS on their original fixtures plus a full
  CSV Import suite regression (16/16 TCs PASS). Neither had a Production Redmine Issue ID, so there was no
  production status to sync on close (`CLAUDE.md` §5).
- **BUG-TCM-036 through BUG-TCM-043 (the last 8 open bugs, all previously un-reported) reported to production
  `ztflux` on 2026-10-06**, per explicit user request: #122092 (TCM-036), #122093 (TCM-037), #122094 (TCM-038),
  #122095 (TCM-039), #122096 (TCM-040), #122097 (TCM-041), #122098 (TCM-042), #122099 (TCM-043). All assigned to
  **Vaishnavi Bhawsar**, target version **"Testcase Management plugin Release 7.1.0"** (id=2066), tracker Bug
  (id=3), Defect Type/Severity/priority custom fields mapped from each bug's local severity (Critical→Blocker
  priority/"Critical"/"Urgent"; High→High/"High-severity"/"High"; Medium→Medium/"Medium-severity"/"Medium";
  Low→Low/"Low-severity"/"Low" — matching the exact convention already used on BUG-TCM-009/017/022). Created as
  **standalone bug issues via `redmineflux_core_create_issue`** — per explicit user instruction, no production
  Run or Testcase was created to link these via `report_defect`, unlike the earlier Sanity-testcase pattern used
  for BUG-TCM-008–013. Every bug in `bugs/open/` is now reported to production.
- **BUG-TCM-044 (Critical) and BUG-TCM-045 (Low) found 2026-10-06** while comprehensively testing production
  feature **#121875 (rftc-008, "Defect ↔ execution many-to-one linking")** at the user's explicit request. The
  entire backend (3 new JSON endpoints, the `ExecutionDefect` join, all-or-nothing bulk transaction, every
  permission/visibility/cross-project/self-link/gate/batch-cap rule, legacy-write-path reconciliation via
  `after_save`, cascade cleanup on destroy, and the reverse "Linked Test Executions" panel on the defect's own
  issue page) was verified live and works **correctly** — a genuinely thorough pass (effectively the full F1–F15
  functional matrix + several edge cases from the feature's own spec). But **BUG-TCM-044** found the actual
  forward-facing UI (the "Link defect" picker, the bulk-link multi-select action, the per-execution linked-defect
  chip list) was never wired into the Run execution view at all — the partial files exist on disk but are never
  rendered by any view or referenced by any JS, so the feature (INECO's #1-ranked request) is reachable only via
  the raw JSON API today, not through the product UI. Also surfaced, as context: the **pre-existing** legacy
  "Defect ID's" column on the Run view can never show any defect regardless of rftc-008, because its query
  requires the defect issue's own `run_id`/`environment` columns to match the viewed run — fields no defect ever
  has set. **BUG-TCM-045** is a minor, unrelated finding from the same pass: `link_defect`/`unlink_defect`'s 403
  denial reuses `bulk_create`'s assignee-specific error wording even though these actions don't check assignee at
  all. **Both reported to production `ztflux` on 2026-10-06**: #122104 (TCM-044) and #122105 (TCM-045), assigned
  to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0", standalone bug issues (no
  production Run/Testcase created), same convention as BUG-TCM-036–043.
