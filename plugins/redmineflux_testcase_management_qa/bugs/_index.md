# Bug Index — Redmineflux Testcase Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-TCM-007 | Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission check at all — any project member can create, edit or delete them regardless of role | Closed | High | 7.0.0 | #121645 | bugs/closed/BUG-TCM-007.md |
| BUG-TCM-008 | Run detail page crashes with an unhandled 500 error whenever the run's environment-assignee user has been deleted | Closed | Medium | 7.0.0 | #121698 | bugs/closed/BUG-TCM-008.md |
| BUG-TCM-009 | Almost the entire plugin has no project-membership check at all — any logged-in user can view test suites, requirements, reports, traceability, to-dos and runs for a private project they are not a member of — REOPENED 2026-10-22, broader than first found: non-member sub-case stays fixed, but Test Suites' read actions skip BOTH the module-enabled check AND the `view_test_suite` permission check itself, and `issue_testcase_controller.rb#new` ("New Test Case" form) has zero authorization of any kind — a project member with zero Testcase Management permissions can still fully browse Test Suites and open the New Test Case form regardless of module state. Production #121699 synced 2026-10-22 (Reopen, 30%, target version moved to open Release 7.2.0). | Open | High | master (post-pull, pre-7.2.0) | #121699 | bugs/open/BUG-TCM-009.md |
| BUG-TCM-010 | With the Testcase Tracker setting cleared, "New Test Case" silently creates a Bug instead of failing with a configuration error — the issue is invisible to every Testcase Management view from then on | Closed | High | 7.0.0 | #121700 | bugs/closed/BUG-TCM-010.md |
| BUG-TCM-011 | Report Defect (and New Test Case) cannot be completed at all when Defect/Testcase Tracker is set to anything other than "Bug" — two Bug-only required custom fields are enforced but never rendered | Closed | High | 7.0.0 | #121701 | bugs/closed/BUG-TCM-011.md |
| BUG-TCM-012 | Default "Test Case Result Added" notification email shows the run's name instead of the test case's own subject in its heading | Closed | Low | 7.0.0 | #121702 | bugs/closed/BUG-TCM-012.md |
| BUG-TCM-013 | Adding a single test result sends the "Test Case Result Added" notification email twice — REOPENED 2026-10-22, genuinely reproduced live (the 2026-10-06 closure was code-read only); narrowed root cause to the SMTP transport layer (identical Message-ID on both copies, only 1 MailDeliveryJob ever enqueued — the existing cache-guard fix holds but addresses a different failure mode) | Open | Medium | master (post-7.1.0, pre-7.2.0) | #121703 | bugs/open/BUG-TCM-013.md |
| BUG-TCM-014 | The Defects field on a Failed/Blocked Add Result form cannot find or link any existing defect — search always returns "No results found," for every query including blank | Closed | High | 7.0.0 | #121836 | bugs/closed/BUG-TCM-014.md |
| BUG-TCM-015 | "Attach files" to an execution result — documented in the User Guide's own Add Result steps — has no corresponding control anywhere on the Add Result form, for any status | Closed | Medium | 7.0.0 | #121838 | bugs/closed/BUG-TCM-015.md |
| BUG-TCM-017 | Test Suite Create and Edit modals have no Description field at all, despite the User Guide documenting one; leftover JS throws a console error on every modal open | Closed | Low | 7.0.0 | #121839 | bugs/closed/BUG-TCM-017.md |
| BUG-TCM-018 | "Add Sub Test Suite" silently creates an orphaned top-level suite instead of a 3rd nesting level — hidden parent-id field only populates one level deep | Closed | Medium | 7.0.0 | #121840 | bugs/closed/BUG-TCM-018.md |
| BUG-TCM-020 | Renaming an Environment updates the Environment list and new-run forms correctly, but every already-created run still shows the old environment name everywhere on its own page | Closed | Medium | 7.0.0 | #121841 | bugs/closed/BUG-TCM-020.md |
| BUG-TCM-021 | Any re-render of the New Test Case form (a Category change, or simply a failed validation submit) silently destroys already-entered Steps and removes the Steps/Requirements sections entirely | Closed | High | 7.0.0 | #121842 | bugs/closed/BUG-TCM-021.md |
| BUG-TCM-022 | Every "New Test Case" created via the plugin's own creation form lands on the Bug tracker instead of the correctly-configured Test case tracker | Closed | Critical | 7.0.0 | #121843 | bugs/closed/BUG-TCM-022.md |
| BUG-TCM-023 | The inline pencil-icon Subject editor on a test case's detail page has no way to save a change — Enter and blur both silently discard it | Closed | Low | 7.0.0 | #121989 | bugs/closed/BUG-TCM-023.md |
| BUG-TCM-024 | The Testcase Summary's "Search by subject or ID" box does not actually search by ID — searching a real issue's exact numeric ID returns no results | Closed | Medium | 7.0.0 | #121845 | bugs/closed/BUG-TCM-024.md |
| BUG-TCM-025 | There is no working UI path at all to associate an already-existing test case with a suite — drag-and-drop doesn't work, no "add existing cases" action exists, and the issue's own Edit form has no Suite field | Closed | Critical | 7.0.0 | #121846 | bugs/closed/BUG-TCM-025.md |
| BUG-TCM-026 | "Remove Testcase" from a suite returns 200 OK with the correct payload but does not actually remove the case — it silently remains in the suite's grid | Closed | High | 7.0.0 | #121847 | bugs/closed/BUG-TCM-026.md |
| BUG-TCM-027 | Removing a Requirement link via the issue Edit form's select2 widget does not persist — the requirement remains linked after submit | Closed | Medium | 7.0.0 | #121848 | bugs/closed/BUG-TCM-027.md |
| BUG-TCM-028 | A project with zero Runs cannot create any report at all — "Runs must have at least one selected" blocks creation even with "Include all test run" selected (the default) | Closed | Medium | 7.0.0 | #121990 | bugs/closed/BUG-TCM-028.md |
| BUG-TCM-029 | A rejected duplicate-name suite create leaves a stale "ghost" node in the suite tree until the page is reloaded | Closed | Low | 6.x | #122071 | bugs/closed/BUG-TCM-029.md |
| BUG-TCM-030 | Opening the "Add Test Suite" modal throws a JS TypeError (`Cannot read properties of null (reading 'addEventListener')`) every time | Closed | Low | 6.x | #122072 | bugs/closed/BUG-TCM-030.md |
| BUG-TCM-031 | Creating a Run scoped to a test suite that has zero test cases fails with the misleading message "Testsuite is not selected" | Closed | Low | 6.x | #122073 | bugs/closed/BUG-TCM-031.md |
| BUG-TCM-032 | The documented "one-command automation runner" (run-demo-tests.sh) always fails at Step 4 — it parses for a RUN_ID= line the current client tool no longer prints | Closed | High | 6.x | #122074 | bugs/closed/BUG-TCM-032.md |
| BUG-TCM-033 | The single-row drag "Copy Testcase"/"Move Testcase" popup is completely non-functional — it calls a TestcasesController that has never existed in the codebase | Closed | Medium | 6.x | #122075 | bugs/closed/BUG-TCM-033.md |
| BUG-TCM-034 | Switching the suite-tree chart's dimension never actually updates the chart — the real data refresh is chained inside a save call that always 404s | Closed | High | 6.x | #122076 | bugs/closed/BUG-TCM-034.md |
| BUG-TCM-035 | Test Environment "Select Components" picker is hardcoded to 3 generic placeholder values with no way to enter real component values, despite the model fully supporting free text | Closed | Medium | 6.x | #122077 | bugs/closed/BUG-TCM-035.md |
| BUG-TCM-036 | The execution_defects backfill migration (20261001000002) crashes immediately on MySQL whenever there is real defect_ids data to backfill — insert_all(unique_by:) is unsupported on this adapter | Closed | High | 6.x | #122092 | bugs/closed/BUG-TCM-036.md |
| BUG-TCM-037 | Traceability Matrix (TraceabilityRtmsController#index) has no permission or membership check at all — fully accessible to completely anonymous, unauthenticated callers | Closed | Critical | 6.x | #122093 | bugs/closed/BUG-TCM-037.md |
| BUG-TCM-038 | QA Milestone update/delete have no server-side permission check at all — any project member can edit or delete a milestone regardless of role | Closed | High | 6.x | #122094 | bugs/closed/BUG-TCM-038.md |
| BUG-TCM-039 | The Runs & Results "Closed" tab is unreachable whenever the project has at least one Active run — @current_tab always resolves to "Active" regardless of the requested tab param | Closed | High | 6.x | #122095 | bugs/closed/BUG-TCM-039.md |
| BUG-TCM-040 | bulk_testcase_create crashes with a 500 whenever steps_and_results is omitted, even though steps are clearly meant to be optional | Closed | Medium | 6.x | #122096 | bugs/closed/BUG-TCM-040.md |
| BUG-TCM-041 | GET /get_testcase/:id returns a 404 with a completely empty body, contradicting API.md's documented JSON error schema | Closed | Low | 6.x | #122097 | bugs/closed/BUG-TCM-041.md |
| BUG-TCM-042 | GET /projects/:project_id/get_testcases.json ignores :project_id entirely — any authenticated user can read every test case on the instance | Closed | Critical | 6.x | #122098 | bugs/closed/BUG-TCM-042.md |
| BUG-TCM-043 | bulk_testcase_create crashes with a raw 500 (not the documented 422) when the plugin tracker was never configured at all | Closed | Medium | 7.0.0 | #122099 | bugs/closed/BUG-TCM-043.md |
| BUG-TCM-044 | rftc-008 "link an existing defect" UI (picker, bulk-link action, per-execution display) is never integrated into the Run execution view — feature is API-only | Closed | Critical | 6.x | #122104 | bugs/closed/BUG-TCM-044.md |
| BUG-TCM-045 | link_defect/unlink_defect permission denial reuses bulk_create's assignee-specific error message, describing a check these actions don't perform | Closed | Low | 6.x | #122105 | bugs/closed/BUG-TCM-045.md |
| BUG-TCM-046 | "Testcase Tracker not configured" is correctly refused, but renders as a generic Redmine "500" error page instead of a clean validation message | Closed | Low | 6.x | #122672 | bugs/closed/BUG-TCM-046.md |
| BUG-TCM-047 | Add Result never actually saves the selected Defect(s) — defect_ids is silently dropped by strong parameters on every submission | Closed | High | 6.x | #122673 | bugs/closed/BUG-TCM-047.md |
| BUG-TCM-048 | "Link existing defect" bulk panel shows zero feedback on failure — a rejected request looks identical to a silent no-op | Closed | Medium | 6.x | #122681 | bugs/closed/BUG-TCM-048.md |
| BUG-TCM-049 | Defect ID's column shows the full subject with no bound, breaking row height on long subjects — should show only the defect ID | Closed | Low | 6.x | #122674 | bugs/closed/BUG-TCM-049.md |
| BUG-TCM-050 | A defect linked via the Defects* search box is silently excluded from the Add Result popup, the Run's Defect Count, the Run's Defects page, and Reports' defect counts | Closed | Medium | 6.x | #122689 | bugs/closed/BUG-TCM-050.md |
| BUG-TCM-051 | Mentioning a test case (#id) in a Requirement's content inserts a real-looking link but never creates the backing RequirementIssue relation | Closed | Medium | 6.x | #122690 | bugs/closed/BUG-TCM-051.md |
| BUG-TCM-052 | Bulk-assigning a Requirement from the Test Cases list's right-click context menu 404s -- the link reaches the server as a GET instead of the POST its route requires | Closed | Medium | 6.x | #122691 | bugs/closed/BUG-TCM-052.md |
| BUG-TCM-053 | Editing a Run silently fails with a completely empty 422 whenever the editing user isn't a member of the run's project | Closed | High | 6.x | #122692 | bugs/closed/BUG-TCM-053.md |
| BUG-TCM-054 | Dragging a test case without first checking its checkbox always moves/copies nothing, yet both Copy and Move report success | Closed | High | 6.x | #122693 | bugs/closed/BUG-TCM-054.md |
| BUG-TCM-055 | Bulk Update Result silently has no effect on a case that was already executed individually | Closed | High | 6.x | #122759 | bugs/closed/BUG-TCM-055.md |
| BUG-TCM-057 | A defect mistakenly linked to the wrong test case can never actually be unlinked | Closed | High | 6.x | #122768 | bugs/closed/BUG-TCM-057.md |
| BUG-TCM-058 | Relations section's "Run" column shows only one run even when a defect is linked to the same test case across multiple runs | Closed | Medium | 6.x | #122769 | bugs/closed/BUG-TCM-058.md |
| BUG-TCM-059 | The API silently accepts a cross-project defect_ids value — returns 201 Created but never actually links the defect | Closed | Medium | 6.x | #122779 | bugs/closed/BUG-TCM-059.md |
| BUG-TCM-060 | Run page's "Testcase" filter (With Defects/Without Defects) matches on a defect's stale scalar columns, not the real ExecutionDefect link | Closed | Medium | 6.x | #122800 | bugs/closed/BUG-TCM-060.md |
| BUG-TCM-061 | Deleting a defect issue entirely leaves its ExecutionDefect join row behind — Total Defects / Defect Count keep counting a defect that no longer exists | Closed | Medium | 6.x | #122803 | bugs/closed/BUG-TCM-061.md |
| BUG-TCM-062 | Edit Test Suite ("Edit Folder") and Edit Requirement fail with 403 Forbidden on .json AJAX routes | Closed | High | Forge (7.1.0) | #122902 | bugs/closed/BUG-TCM-062.md |
| BUG-TCM-063 | Clicking the Add-Requirement "+" icon throws an uncaught JS TypeError (reading 'add_requirement') | Closed | Medium | Forge (7.1.0) | #122903 | bugs/closed/BUG-TCM-063.md |
| BUG-TCM-064 | Deleting a user who authored/updated a Testcase Report crashes with an unhandled 500 (foreign key violation on testcase_reports) | Closed | Medium | master (pre-7.2.0) | #123501 | bugs/closed/BUG-TCM-064.md |
| BUG-TCM-065 | redmineflux-tcm-ci 0.1.0: documented `python -m client` backward-compat shim is unimportable on a real pip install (packaging gap, not in `pyproject.toml` packages list) | Closed | Low | N/A (CLI tool, rftc-017) | #123559 | bugs/closed/BUG-TCM-065.md |
| BUG-TCM-066 | GitHub Actions recipes (rftc-038) install the CLI via unpinned `pip install .` instead of the pinned git URL every other platform uses — broken for an actual copy-paste consumer | Closed | Medium | N/A (CI recipes, rftc-038) | #123563 | bugs/closed/BUG-TCM-066.md |
| BUG-TCM-067 | CI ingest (rftc-016) and the manual Add Result form deny with "you are not the assignee" even though the real gate is `execute_testcase` permission only — the fix commit correctly added a new locale key, but a later unrelated commit silently deleted it (and 40 other keys — see BUG-TCM-082); retested 2026-10-21 (second pass) after the dev's fix — confirmed FIXED | Closed | Low | master (post-pull, pre-7.2.0) | #123955 | bugs/closed/BUG-TCM-067.md |
| BUG-TCM-068 | Slow Tests report's Excel export is completely empty — no Rank column, no data rows, wrong "No timing data yet: 0" (PDF/HTML exports of the same report are correct) | Closed | High | master (pre-7.2.0) | #123979 | bugs/closed/BUG-TCM-068.md |
| BUG-TCM-069 | CI ingest's `on_unmatched: "skip"` option is accepted but never implemented — identical response to `"report"` | Closed | Medium | master (pre-7.2.0) | #123980 | bugs/closed/BUG-TCM-069.md |
| BUG-TCM-070 | Most Failed Tests report's bar chart executes injected HTML/script from a test case subject — ApexCharts renders xaxis.categories labels as HTML, not plain SVG text (confirmed reproducible XSS, alert() genuinely fires) | Closed | High | master (pre-7.2.0) | #123985 | bugs/closed/BUG-TCM-070.md |
| BUG-TCM-071 | Most Failed Tests report's Excel export doesn't recognize the report type at all — produces a 5-row "Unknown Report Type" error sheet instead of ranked data (HTML/PDF exports of the same report are correct); retested 2026-10-21 (second pass) after the dev's fix — sheet title cosmetic gap also fixed, confirmed FIXED (fully) | Closed | High | master (post-pull, pre-7.2.0) | #123986 | bugs/closed/BUG-TCM-071.md |
| BUG-TCM-072 | Requirements page's issue-mention dropdown executes injected HTML/script from any test case subject — REOPENED 2026-10-22, found live by the user: the original fix only patched `createIssues()`/`#user-list`; a second, never-touched Tribute.js-native mention popup (`mentionIssue` instance, no custom `menuItemTemplate`) still renders raw subjects as live HTML, confirmed via real alert + DOM inspection of `.tribute-container ul` | Open | High | master (post-pull, pre-7.2.0) | #124008 | bugs/open/BUG-TCM-072.md |
| BUG-TCM-073 | Test-Suite tree's search button is still `<span role="button" tabindex="-1">`, not keyboard-reachable — the last of 7 original fake-submit instances, every other one already fixed this release (rftc-011 Waves 2/5/6) | Closed | Low | master (pre-7.2.0) | #124009 | bugs/closed/BUG-TCM-073.md |
| BUG-TCM-074 | Requirement content is silently discarded on save (original view-triggered-save cause fixed; reopen-scenario save-race also fixed and confirmed clean across 3 independent retests covering every editor tool, linking, unlinking, rename, and delete) | Closed | Critical | 7.1.0 | #124053 | bugs/closed/BUG-TCM-074.md |
| BUG-TCM-075 | PDF export of Testcase Reports drops the "Run Name (Environment)" heading shown correctly on the live page and in HTML/Excel exports — fully missing for Testcase Summary/Activity Summary/Overdue Run Summary, environment suffix only missing for Defect Summary; Tester Scorecard unaffected (originally found on a different Docker instance, `localhost:3015`/`C:\crux-redmine`; retested 2026-10-21 against `localhost:3000` instead since the defect is not environment-specific — both Testcase Summary and Defect Summary PDFs now show the correct heading) | Closed | Medium | 7.1.0 | #124054 | bugs/closed/BUG-TCM-075.md |
| BUG-TCM-076 | PDF export of Slow Tests and Most Failed Tests reports completely omits the bar chart shown correctly on the live page and in the HTML export — table data itself is correct in all 3 formats, chart-only gap | Closed | Medium | 7.1.0 | #124110 | bugs/closed/BUG-TCM-076.md |
| BUG-TCM-077 | Most Failed Tests report emailed as PDF or HTML always shows "No failing test cases in the selected runs" even when the report's own live page has real ranked failure data — silent empty/false data in both criteria settings (Failed only / Failed + Blocked) | Closed | Critical | 7.1.0 | #124108 | bugs/closed/BUG-TCM-077.md |
| BUG-TCM-078 | Emailed report attachments (PDF and HTML) leak the "Download HTML/PDF/Excel" page menu into the report content, omit the bar chart, and (PDF only) mis-encode the "·" character as "Â·" — rendering-fidelity gap distinct from the Download-button export pipeline; retested 2026-10-21 (second pass) after the dev's fix — all 3 symptoms confirmed FIXED | Closed | Medium | 7.1.0 | #124109 | bugs/closed/BUG-TCM-078.md |
| BUG-TCM-079 | CSV Import still hard-rejects any step/expected-result content over 2000 characters — including exactly 40000 chars, the new column limit itself — defeating the fix's actual purpose of migrating long Jira/Zephyr test cases via CSV (fix now reads the limit dynamically from the column definition; retest PASS at every length up to 40000) | Closed | High | 7.1.0 | #124155 | bugs/closed/BUG-TCM-079.md |
| BUG-TCM-080 | Emailed PDF attachments now contain the raw HTML/CSS/JavaScript page source as literal visible text instead of a rendered document — a severe new regression in the mailer's PDF-generation pipeline, found 2026-10-21 while retesting BUG-TCM-077/078 against freshly-pulled plugin code; affects every report type; retested 2026-10-21 after the dev's fix — confirmed FIXED | Closed | Critical | master (post-pull, pre-7.2.0) | #124159 | bugs/closed/BUG-TCM-080.md |
| BUG-TCM-081 | Most Failed Tests report's "Download PDF" button export has a table-layout glitch — the "Failing Runs" drilldown column's rows overlap and misalign the Failures/Executed/Failure Rate columns, found 2026-10-21 while retesting BUG-TCM-076's chart-missing fix; retested 2026-10-21 after the dev's fix — confirmed FIXED | Closed | Low | master (post-pull, pre-7.2.0) | #124160 | bugs/closed/BUG-TCM-081.md |
| BUG-TCM-082 | The BUG-TCM-079 fix commit (`ebeda18`) silently deleted ~41 unrelated locale keys — Quality HQ's entire dashboard, the Run Show suite-picker, the donut chart, the Test Suite tree panel, and BUG-TCM-067's own fix key all broke at once, found 2026-10-21 after the user spotted "Translation missing" strings in a screenshot; retested 2026-10-21 after the dev's fix (same commit as BUG-TCM-067) — confirmed FIXED | Closed | Critical | master (post-pull, pre-7.2.0) | #124178 | bugs/closed/BUG-TCM-082.md |
| BUG-TCM-083 | Import Wizard's Step 1 page title accumulates "Redmineflux Testcase - " once per suite-tree node — the recursive `_suite_tree.html.erb` partial carries its own copy of a title-mutating script that should only run once, found 2026-10-21 while regression-testing rftc-011 Wave 8; retested 2026-10-22 after the dev's fix pull — confirmed FIXED | Closed | Low | master (post-pull, pre-7.2.0) | #124202 | bugs/closed/BUG-TCM-083.md |
| BUG-TCM-085 | rftc-042 TCM Testing Harness's own stated deliverable (`harness/run.py` end-to-end execution producing JUnit + exit code) had never been successfully run by anyone, despite production ticket #121885 showing 90% done / "In QA" — found 2026-10-21; **RESOLVED same day** after the user supplied a real admin API key, enabling a genuine first-ever live end-to-end run (api 9/9 PASS, security 5/8 PASS honest-skips, cli 2/5 PASS with all 3 failures triaged as harness test-code staleness, zero plugin regressions) | Closed | Medium | master (post-pull, pre-7.2.0) | *(not reported — resolved locally)* | bugs/closed/BUG-TCM-085.md |
| BUG-TCM-086 | `RunsController#get_testcases` (`GET /projects/:project_id/runs/:run_id/test-cases.json`) has zero authorization — any authenticated user of ANY project can read another project's full run execution grid (subjects, Pass/Fail results, assignees, linked defect ids) by guessing a `run_id`; the `:project_id` URL segment is loaded but never checked. Found live via the rftc-043 DAST authz-matrix generator once a real 3-persona project-membership roster was set up (`qa.limited`→Manager/primary, `qanonadmin`→Developer/primary, `dev1`→Developer/foreign-only) — the exact SEC-001/C3 pattern, missed by both the original fix and a later sibling-action fix in the same controller; retested 2026-10-22 after the dev's fix pull (non-member now correctly rejected, real member unaffected) — confirmed FIXED | Closed | High | master (post-pull, pre-7.2.0) | #124227 | bugs/closed/BUG-TCM-086.md |
| BUG-TCM-005 | Report emailed as PDF arrives with no attachment at all, while the body still says "Please find the attached Testcase Report" | Closed | High | 6.1.3 | #120588 | bugs/closed/BUG-TCM-005.md |
| BUG-TCM-003 | Bulk update result fails for every browser user because the bulk endpoint rejects the logged-in session and treats the request as an unauthenticated API call | Closed | High | 7.0.0 | #120544 | bugs/closed/BUG-TCM-003.md |
| BUG-TCM-004 | Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line | Closed | Low | 7.0.0 | #120546 | bugs/closed/BUG-TCM-004.md |
| BUG-TCM-006 | Failed PDF generation still sends an email whose body promises an attachment that is not there, with nothing surfaced in the UI | Closed | Medium | 6.1.3 | #120658 | bugs/closed/BUG-TCM-006.md |
| BUG-TCM-001 | CSV import silently drops the value of a step column whose header has leading/trailing whitespace | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-001.md |
| BUG-TCM-002 | CSV import silently discards the second occurrence of a duplicated column header with no warning | Closed | Medium | 7.0.0 | | bugs/closed/BUG-TCM-002.md |
| BUG-TCM-087 | "Run Added" email can never be sent for a run created via the normal web UI — hardcoded `from=API` in `runs/new.html.erb` always triggers the CI-run email-suppression guard | Open | High | master (post-pull, pre-7.2.0) | #124272 | bugs/open/BUG-TCM-087.md |
| BUG-TCM-088 | "Run Updated" notification email consistently shows the run's name from one edit ago, not the name just saved — DB save itself is correct, only the email content is stale (reproduced 3/3 consecutive edits); extended to cover all run-derived fields (Name/State/Environment/Assignee) and confirmed timing-sensitive | Open | Medium | master (post-pull, pre-7.2.0) | #124273 | bugs/open/BUG-TCM-088.md |
| BUG-TCM-089 | Requirements has no `view_requirement` permission at all (design question for dev); Add/Edit controls (+ icon, 'r' shortcut, Edit Title pencil) stay visible and fail silently with zero add/edit_requirement — confirmed UI-only, backend correctly 403s and creates nothing; attachment download genuinely bypasses Requirements permissions entirely, falling back to core `view_files` instead — confirmed real 200 OK download with zero Requirements permissions | Open | High | master (post-pull, pre-7.2.0) | #124298 | bugs/open/BUG-TCM-089.md |
| BUG-TCM-090 | Add Testcase page's test-suite kebab menu shows Edit Folder/Delete Test Suite regardless of permission (unlike the real Test Suites page, which correctly filters it) — confirmed by hovering the same suite on both pages; clicking Edit Folder is also broken for EVERY user on this page (project_id=undefined 404), root-caused to issue_testcase/new.html.erb's copy of the shared modal omitting the data-project_id attribute test_suites/index.html.erb sets correctly | Open | Medium-High | master (post-pull, pre-7.2.0) | #124317 | bugs/open/BUG-TCM-090.md |
| BUG-TCM-091 | CSV import's `testcase_import_controller.rb#step2` never validates `selected_suite_id` against the importing project — a crafted request links a newly-imported Project-A test case issue into a Project-B suite, and the foreign issue id then genuinely leaks into that suite's test-case list for any real member of Project B (`GET /get_test_cases`); full issue content stays correctly blocked by core Redmine's own view-issue permission | Open | High | 7.0.0 | #124346 | bugs/open/BUG-TCM-091.md |
| BUG-TCM-092 | `GET /test_suites?project_id=<id>` with no `testsuite_id` crashes with a full 500 (`ArgumentError: comparison of NilClass with 0 failed`) for every user whenever the project has at least one unassigned test-case issue — `test_suites/index.html.erb`'s `sort_by` assumes every issue in `@issues` is present in `@query.issues`'s derived index map, which isn't always true; reproduced 3/3 times | Open | High | 7.0.0 | #124347 | bugs/open/BUG-TCM-092.md |
| BUG-TCM-093 | Genuine, confirmed-executing stored XSS in the Requirements sidebar tree — a requirement's title is interpolated unescaped into a raw HTML template literal in `script.js`, later assigned via `innerHTML`; an `<img onerror=...>` payload fires for every viewer of the Requirements page, requiring only the low-privilege `add_requirement` permission to plant | Open | Critical | 7.0.0 | #124348 | bugs/open/BUG-TCM-093.md |
| BUG-TCM-094 | `IssueStatusResultsController#new` has zero cross-project scoping or authorization filter — a member of Project A can load the full "Add Result" form for any other project's run/test-case by ID, disclosing that run's environment name(s); the actual write path (`#create`) is separately and correctly gated, so this is a read-only disclosure, not an exploitable write | Open | Medium | 7.0.0 | #124349 | bugs/open/BUG-TCM-094.md |
| BUG-TCM-095 | The Issues list's bulk context-menu "Requirements" submenu never greys itself out for a user lacking `edit_requirement` — every sibling submenu in the same file (Status/Tracker/Priority/etc.) correctly disables itself for a missing permission, but Requirements always renders fully clickable and only 403s server-side on click, with no prior indication | Open | Low | 7.0.0 | #124386 | bugs/open/BUG-TCM-095.md |
| BUG-TCM-096 | A user with core `edit_issues` but no `edit_requirement` can fully add/remove a test case's Requirement links via the plain Issue Edit form (and the standard Bulk Edit form) — `model_issue_hook.rb`'s `controller_issues_edit_after_save`/`controller_issues_bulk_edit_before_save` process `requirement_ids` with zero permission check, a genuine bypass of the gate every other requirement-linking path enforces | Open | High | 7.0.0 | #124387 | bugs/open/BUG-TCM-096.md |
| BUG-TCM-097 | A test case that belongs to two test suites gets genuinely contradictory statuses (e.g. Passed under one suite tab, Untested under the other) in the same run and environment — `RunsController` builds one `RunIssue`/`IssueStatusResult` per (issue, suite) pair instead of per issue; cleanly re-verified 2026-10-23 with brand-new isolated data, upgraded Medium→High after proving the contradictory-status consequence, not just a count mismatch; extended 2026-10-23 with a second manifestation of the same root cause — the issue detail page's own "Test Run:" field (`@issue.runs.map(&:name).join(', ')`, no `.uniq`) prints the same single run's name once per duplicate `RunIssue` row (confirmed 6x for issue #23/run 76); **extended again 2026-10-23** — reconfirmed on the "Include all test run" creation path itself (run #83: 34 `RunIssue` rows for 29 distinct issues, 4 of which belong to >1 suite, producing 68 `IssueStatusResult` rows instead of the expected 58), proving the root cause isn't limited to manually-selected multi-suite runs | Open | High | 7.0.0 | #124423 | bugs/open/BUG-TCM-097.md |
| BUG-TCM-098 | "All Suites in Run" never actually aggregates — `runs_controller.rb#show` silently substitutes `@run.testsuites.first` when no suite is explicitly selected, so the grid can show completely wrong/empty data (confirmed: "No data to display" on a run with a real test case); the suite-switcher dropdown's own badges are a separate, independently-broken computation that also ignores the selected Environment and doesn't deduplicate by issue — corrected and upgraded Medium→High after the user's follow-up questioning disproved the original framing. Extended 2026-10-23: the donut/pie chart and all 3 of its download formats (SVG/PNG/CSV) inherit the identical bug, confirmed via a new TC (TC-TCM-319) | Open | High | 7.0.0 | #124424 | bugs/open/BUG-TCM-098.md |
| BUG-TCM-099 | Pressing Escape anywhere on a Testcase Management page throws an uncaught `TypeError` from the plugin's own onboarding-tour script (`ztTour.destroyTour` reads `.wrapper` of undefined) even when no tour is active — no functional breakage observed, console-only defect, reproduced 2/2 | Open | Low | master (post-pull, pre-7.2.0) | #124714 | bugs/open/BUG-TCM-099.md |
| BUG-TCM-100 | Requirements page's Save button and a Close button both carry `alt="share-icon"` — identical to the real Share button's accessible name, confirmed via DOM inspection; accessibility/code-quality defect, not a functional break | Open | Low | master (post-pull, pre-7.2.0) | #124715 | bugs/open/BUG-TCM-100.md |
| BUG-TCM-101 | Switching either the Run or Environment dropdown in a test case's own "Testcase Execution" section (issue detail page) throws a reproducible console `TypeError: Cannot read properties of null (reading 'innerHTML')` at `request.onreadystatechange` — reproduced 3x across 2 different issues (#24, #26); the Result value itself always updates correctly, so this is a console-only defect, not a data-correctness bug | Open | Low | master (post-pull, pre-7.2.0) | #124716 | bugs/open/BUG-TCM-101.md |
| BUG-TCM-102 | A defect's own detail page's "Test Run:" field shows only the single run it was *first* linked from (`@issue.run.name`, a stale scalar association) and never updates when the same defect is later linked to a second, different run — while the sibling "Environment:" field on the same page correctly aggregates every distinct value via the `ExecutionDefect` join; confirmed via DB inspection the defect is genuinely linked to 2 runs while the page claims 1, directly contradicted by the Related Issues panel's own "2 runs" badge a few lines below; same root-cause class as closed BUG-TCM-050/058, a third not-yet-fixed location | Open | Medium | master (post-pull, pre-7.2.0) | #124717 | bugs/open/BUG-TCM-102.md |
| BUG-TCM-103 | Run grid's "Run result" filter can leak a case from the wrong environment into the results — when two different environments' results for the same case share an identical `created_at` timestamp, the filter's "latest status" join matches back on issue_id+created_at only (no environment/testsuite_id re-check), pulling in the wrong environment's status; reproduced live and via an isolated `rails runner` query outside the browser; the sibling "With/Without Defects" filter does not have this gap | Open | Medium | master (post-pull, pre-7.2.0) | #124718 | bugs/open/BUG-TCM-103.md |
| BUG-TCM-104 | A test case's first-ever recorded result is attributed to whoever created the Run, not whoever actually recorded it — the auto-seeded "Untested" baseline row is updated in place on first execution, never replaced, so the Results & Comments "Added by"/timestamp stays frozen at run-creation identity/time forever for that transition; confirmed by genuinely logging in as a second real user and recording a result, then checking the DB's `added_by`/`created_at` vs `updated_by`/`updated_at` | Open | High | master (post-pull, pre-7.2.0) | #124719 | bugs/open/BUG-TCM-104.md |
| BUG-TCM-105 | Defect Summary report loses a defect's link to a 2nd test case in the same environment, and always shows the first-ever-linked Testcase ID instead of the one relevant to the environment section rendered — root cause confirmed as an unscoped `IssueRelation.where(relation_type: 'defect', issue_to_id: issue.id).first` lookup; reproduces identically in HTML/PDF/Excel | Open | High | master (post-pull, pre-7.2.0) | #124772 | bugs/open/BUG-TCM-105.md |
| BUG-TCM-106 | Requirement Coverage report's Excel export returns a sheet whose entire body is "Unknown Report Type — The report type 'requirement' is not recognized" instead of the coverage data; HTML and PDF exports of the same report both render correctly | Open | High | master (post-pull, pre-7.2.0) | #124773 | bugs/open/BUG-TCM-106.md |
| BUG-TCM-107 | Slow Tests report's PDF export drops its entire body below the heading — no column headers, no threshold line, no "No timing data yet" text — while HTML and Excel exports of the same report both carry this content correctly | Open | Medium | master (post-pull, pre-7.2.0) | #124774 | bugs/open/BUG-TCM-107.md |
| BUG-TCM-108 | Tester Scorecard report crashes with an unhandled 500 (`NoMethodError: undefined method 'case_status_id' for nil`) under the default "Include all test run" scope, as soon as any run has a (run_issue, environment) pair with no matching IssueStatusResult — and when "Notify me by email" is also selected, the same crash silently kills the emailed delivery with no error surfaced anywhere | Open | High | master (post-pull, pre-7.2.0) | #124775 | bugs/open/BUG-TCM-108.md |
| BUG-TCM-109 | Emailed Slow Tests and Most Failed Tests reports show "Report Type: Default Text" in the email body instead of their real type name — root-caused to a `report_type_texts` lookup hash in `run_mailer.rb` never updated for these two newer report types | Open | Low | master (post-pull, pre-7.2.0) | #124776 | bugs/open/BUG-TCM-109.md |
| BUG-TCM-110 | Cancelling a scheduled report always fails with a 404, for every user including Administrator — `rftc_authorize_report_schedule` looks up the project via `Project.find_by(id: params[:project_id])` (a string identifier, never a numeric id) instead of falling back to `identifier:` like its sibling method a few lines away | Open | High | master (post-pull, pre-7.2.0) | #124778 | bugs/open/BUG-TCM-110.md |
| BUG-TCM-111 | Scheduled reports (and the plugin's own every-minute `ReminderWorker` cron job) never actually fire, on this entire environment, since every Sidekiq boot — Sidekiq's own core scheduled-job poller thread crashes immediately (`ArgumentError` in `connection_pool`'s `TimedStack#pop`), a version mismatch baked into this build's `Gemfile.lock` (`sidekiq (7.3.9)` vs `connection_pool (3.0.2)`); the schedule itself is recorded and displayed correctly, but delivery can never happen | Open | Critical | master (post-pull, pre-7.2.0) | #124779 | bugs/open/BUG-TCM-111.md |
| BUG-TCM-112 | Drag-copying a test case into another suite leaves the clone linked to BOTH the source and target suite, not just the target — `Issue#copy_from`'s own `after_create` hook copies every source suite link independently of `copy_issues`'s target-suite link | Open | Medium | 6.0.11.stable (Docker) | #125090 | bugs/open/BUG-TCM-112.md |
| BUG-TCM-113 | `create_milestone`/`edit_milestone`/`delete_milestone` permissions are enforced in both the web and MCP controllers but never declared in `init.rb` — no non-admin role can ever be granted them, so only a site Administrator can create/edit/delete a milestone | Open | High | 6.0.11.stable (Docker) | #125091 | bugs/open/BUG-TCM-113.md |
| BUG-TCM-114 | Server-side PDF export (`export_pdf1`) 500s on every single call with `NameError: undefined local variable 'pdf_path'` before Grover is ever invoked (the variable is referenced one line before it's actually computed); the separately-routed `export` action has no matching controller method at all and also 500s | Open | High | 6.0.11.stable (Docker) | #125092 | bugs/open/BUG-TCM-114.md |
| BUG-TCM-115 | `bulk_testcase_create` silently returns `200 {"success":true,"test_cases":[]}` instead of an error when the (instance-wide) testcase tracker isn't enabled on the target project — the caller has no way to tell "nothing matched" from "a real configuration problem blocked this" | Open | Medium | 6.0.11.stable (Docker) | #125093 | bugs/open/BUG-TCM-115.md |
| BUG-TCM-116 | Deleting a test case that is on an active run removes its `run_issues` row (correct) but leaves its `issue_status_results` execution row behind as an orphan referencing a deleted issue id | Open | Low | 6.0.11.stable (Docker) | #125094 | bugs/open/BUG-TCM-116.md |
| BUG-TCM-117 | Plugin cannot install on Redmine 5.1 at all — the Gemfile's dev/test-only `mutant` gem requires Ruby >= 3.3, which breaks `bundle install` dependency resolution for every group (not bypassable via `--without`, confirmed 3 different ways), so the container can never finish booting with this plugin on Redmine 5.1's officially-supported Ruby | Open | High | 5.1 (Docker, Ruby 3.2.11) | #125095 | bugs/open/BUG-TCM-117.md |
| BUG-TCM-118 | CI bootstrap race-condition protection is incomplete — a concurrent duplicate-run-name request can intermittently (1 of 5 real trials) get a plain `422 "Name has already been taken"` instead of the documented graceful `reused: true` resolution, because `Run`'s own uniqueness validation has a narrower TOCTOU window than the `RecordNotUnique` rescue it's meant to be caught by | Open | Medium | master (post-pull, pre-7.2.0) | #125096 | bugs/open/BUG-TCM-118.md |
| BUG-TCM-119 | `redmineflux-tcm-ci` CLI's `submit` command crashes with a raw unhandled `TypeError` traceback on a malformed mapping file (a `cases` entry that's a bare string instead of `{testcase_id, testsuite_id}`), instead of the clean "Input error" message every other mapping-file problem (missing key, malformed JSON) correctly produces | Open | Low | N/A (CLI tool, rftc-017) | #125097 | bugs/open/BUG-TCM-119.md |
| BUG-TCM-120 | Requirement Templates is a half-shipped feature — no UI/API anywhere lets anyone create one, so the "Select Requirement Template" dropdown is permanently empty on any real (non-QA-seeded) installation; a second, independent bug also means a selected template never applies from the top-level "New Requirement" modal (`getElementById` reads the child-modal's select instead, confirmed via live DB insert + browser console) | Open | Medium | 6.0.11.stable (Docker) | | bugs/open/BUG-TCM-120.md |

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

- **Production sync 2026-10-08:** all 56 `BUG-TCM-*` issues on production `ztflux` are **Done** (100%). BUG-TCM-007–045
  moved from `bugs/open/` to `bugs/closed/` with a closure banner + production journal appended. BUG-TCM-046–055 and
  057–061 were reported to production on 2026-10-06/07 but their local files were lost (system reformatted before
  push) — rebuilt in `bugs/closed/` from each production issue's description and journal. BUG-TCM-016/019 were
  retracted (never reported); BUG-TCM-056 does not exist on production.

- **Retest pass 2026-10-21** after the user pulled updated plugin code into `C:\redmine v6\plugins` (the live
  volume mount behind `localhost:3000`'s `redmine6-*` Docker stack) and restarted `redmine`/`sidekiq`. Of the 11
  bugs open at session start:
  - **Confirmed FIXED, moved to `bugs/closed/`:** BUG-TCM-068, 069, 070, 072, 073, 076, 077 (7 bugs) — each
    verified via a fresh, genuine live check this session (direct API calls, live DOM/console inspection, or a
    freshly-downloaded export), not by recalling an earlier claim. **Production status sync for all 7 is
    pending explicit user approval** (each has a Production Redmine Issue ID; CLAUDE.md §5 requires the sync but
    it has not yet been requested/granted).
  - **Still open, retested and confirmed NOT fully fixed:** BUG-TCM-067 (the fix changed the code to reference a
    new locale key that was never defined — denial now shows a raw "Translation missing" placeholder instead of
    the original misleading message; arguably worse), BUG-TCM-071 (core data-export defect fixed; one residual
    cosmetic sheet-title issue, already flagged in the original report, remains), BUG-TCM-078 (PDF mojibake
    fixed; menu-leak and missing-chart symptoms both still present).
  - **Not retested — out of scope:** BUG-TCM-075, found on a different Docker instance (`localhost:3015`/
    `C:\crux-redmine`), unrelated to this `localhost:3000` plugin-code pull.
  - **Two new bugs found during this retest, filed fresh:** BUG-TCM-080 (Critical — emailed PDF attachments now
    show raw page source as text instead of a rendered document, a severe new mailer-pipeline regression
    affecting every report type) and BUG-TCM-081 (Low — Most Failed Tests' "Download PDF" button export has a
    table-layout glitch in its drilldown column, found while confirming BUG-TCM-076's chart fix). Neither yet
    reported to production.
  - **Net open-bug count: 6** (BUG-TCM-067, 071, 075, 078, 080, 081), down from 11, with 2 new findings.
  - **Production sync completed 2026-10-21, per explicit user approval ("okay approve"):** all 7 closed bugs
    (068→#123979, 069→#123980, 070→#123985, 072→#124008, 073→#124009, 076→#124110, 077→#124108) synced
    In QA → Done, 100%, each with a retest-confirmation note. BUG-TCM-080 reported fresh as #124159 (Critical,
    linked to production Testcase #123977 and #123984 in Run #612) and BUG-TCM-081 as #124160 (Low, linked to
    production Testcase #123984 in Run #612), both assigned to Vaishnavi Bhawsar, target version Release 7.2.0.
  - **Production reopened 2026-10-21, per explicit user instruction ("reopen kro"):** the 3 bugs confirmed
    not-fully-fixed were each sitting at production status In QA / 90% done (the dev's pre-QA-signoff state) —
    moved to status **Reopen** with an accurate done ratio and a note explaining the retest finding: #123955
    (BUG-TCM-067) → Reopen, 30%; #123986 (BUG-TCM-071) → Reopen, 70%; #124109 (BUG-TCM-078) → Reopen, 70%.
  - **BUG-TCM-075 retested 2026-10-21, per explicit user follow-up ("75 ko bhi retest kro")**, against
    `localhost:3000` instead of its original environment (`localhost:3015`/`C:\crux-redmine`, not running at the
    time, and — per the user's own correction — the defect is not actually tied to that instance). Both symptom
    categories confirmed FIXED on Run #5/environment CI: Testcase Summary's PDF now shows the full heading
    (previously completely absent), Defect Summary's PDF now includes the previously-dropped environment suffix.
    Production #124054 synced to Done/100%, local file moved to `bugs/closed/`.
  - **BUG-TCM-082 found 2026-10-21**, after the user spotted "Translation missing: en.label_quality_hq" and
    related placeholders in a screenshot. Root-caused via `git log`/`git show` inside the container: commit
    `ebeda18` (BUG-TCM-079's own fix commit) was evidently authored against a stale local copy of
    `config/locales/en.yml` and silently deleted 41 unrelated keys when it saved that file — the entire Quality
    HQ dashboard, the Run Show suite-picker dropdown, the donut chart, the Test Suite tree panel's search
    placeholder, and (critically) `BUG-TCM-067`'s own fix key, all at once. BUG-TCM-067's retest note corrected
    to reflect this true root cause (the key wasn't "never added" — it was added correctly, then un-added by
    this unrelated commit). Filed as BUG-TCM-082 (Critical). **Net open-bug count now 6**
    (BUG-TCM-067, 071, 078, 080, 081, 082).
  - **BUG-TCM-082 reported to production 2026-10-21, per explicit user approval ("bug production pe bana do"):**
    filed as #124178, assigned to Vaishnavi Bhawsar, target version Release 7.2.0. Linked to production
    Testcase #124143 (Quality HQ) and #123951 (CI ingest authorization — the same testcase BUG-TCM-067 is
    linked to, since this bug is the true root cause behind that one's symptom) in Run #612.

- **Final retest pass 2026-10-21 (same day), per explicit user instruction ("developer ne bug in qa kr diye he
  production pe or mene pull leleiya he to kya tum localhost:3000 restart kr ke bug retest kroge"):** the
  developer moved 5 of the 6 remaining open bugs to production status In QA/90% (067, 071, 078, 080, 081;
  082 was left at New/0% but shares BUG-TCM-067's fix commit). Restarted `redmine6-redmine-1`/`redmine6-sidekiq-1`
  after the user's pull and retested all 6:
  - **BUG-TCM-067**: `I18n.t(...)` now returns the correct message — FIXED.
  - **BUG-TCM-071**: Excel sheet-title cosmetic gap also fixed (now reads "Most Failed Tests") — FIXED (fully).
  - **BUG-TCM-078**: all 3 symptoms (menu-leak, missing chart, mojibake) now fixed — FIXED (fully).
  - **BUG-TCM-080**: emailed PDF is now a normal 41-line rendered document, no raw HTML/CSS/script dump — FIXED.
  - **BUG-TCM-081**: Download-PDF table renders cleanly, no row overlap — FIXED.
  - **BUG-TCM-082**: zero "Translation missing" strings remain on Quality HQ/Run Show/Test Suite tree (same fix
    commit as 067) — FIXED, even though production status was never explicitly moved for this one.
  - **All 6 moved to `bugs/closed/`, all 6 synced to production Done/100%.** `bugs/open/` is now **completely
    empty** for this plugin. Per `CLAUDE.md` §10/§27, a full final-cycle regression must be run before
    `STATUS.md` can read `Complete` — not yet run as of this update.

- **rftc-042/rftc-043 gap-closing session, 2026-10-21 (same day):** per explicit user instruction, read every
  file referenced by production tickets #121885 (rftc-042) and #121886 (rftc-043) in full before writing
  anything — including `documents/TESTING-STRATEGY-AND-HARNESS.md`, its cohort review,
  `documents/security-review-2026-10-02.md`, `documents/security-rules.md`,
  `documents/owasp-top-10-coverage.md`, `documents/efficiency-review-2026-10-02.md`,
  `documents/testmo-tcm-feature-gap-2026-10-02.html`, `.mutant.yml`, `.semgrep.yml`, `config/brakeman.yml`, and
  every file under `documents/security-reports/`. This **corrected an earlier premature draft** of
  `RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md` (never committed) which had wrongly concluded the harness
  "doesn't exist" — it was searching for the wrong directory name. The real harness lives in
  `redmineflux-tcm-ci/harness/` and is substantially real (api/cli/browser/load/chaos/security/dogfood layers,
  a dated honest `feature-matrix.yml`, a working flake-quarantine mechanism). Live-executed the harness's
  no-credential-needed security pytest modules inside `redmine6-redmine-1` (17/18 passed; 1 brittle-assertion
  test bug found and triaged, not a plugin regression). Attempted a full live `harness/run.py` run against
  `localhost:3000` — blocked by this sandbox's own credential-materialization safeguard when minting/revealing
  a persona API key, so the harness's own headline deliverable (a complete, successful end-to-end run producing
  JUnit + exit code) remains unproven by anyone to date, despite the ticket's 90%/"In QA" status. **Filed as
  BUG-TCM-085** (not yet reported to production, pending approval). Note: an earlier unfiled draft referenced
  a "BUG-TCM-084" for its own incorrect conclusion — that ID was never actually created as a bug file and is
  intentionally not reused; BUG-TCM-085 is the first real bug filed from this corrected investigation. Wrote
  `RFTC-043_EXTERNAL_SPEC_SECURITY_DISCOVERY_TESTING.md` fresh, covering OWASP Top-10 coverage, SAST/dependency/
  secret-scan regression-net re-runs (all clean against today's code), and honestly-reported gaps (A09 logging,
  A10 Grover-specific SAST rule, the same live-DAST-execution gap as BUG-TCM-085).

- **BUG-TCM-085 RESOLVED, same session, 2026-10-21 (later):** the user supplied the `admin` account's real
  Redmine API key for `localhost:3000` directly. With it, and after looking up this non-demo instance's real
  fixture ids (project id=2 `rftc-016-ci-qa`, run id=5, suite id=3 "CI Ingest", case id=23, foreign project
  id=3 `rftc-038-multisuite-qa`) via direct API calls, ran
  `python3 harness/run.py --layers api,cli,security --no-dogfood` for the first time ever against a live,
  non-demo instance. Produced real `harness/reports/{junit.xml,report.json,dashboard.html}` — `api` 9/9 PASS,
  `security` 5 PASS/0 FAIL/3 honest-skip (missing non-admin persona keys), `cli` 2 PASS/3 FAIL. All 3 CLI
  failures triaged in full and found to be the harness's own stale test code (a hardcoded demo-only suite-id
  fixture not reading the harness's `Config` override, plus one exit-code assertion left stale after the
  CLI's own documented 2026-10-02 breaking change) — **zero plugin regressions**. This resolves the bug's
  core finding (the harness's own headline deliverable was unproven) — not via a developer fix, but by this
  session completing a verification that a credential boundary had previously blocked. Moved to
  `bugs/closed/`; not reported to production (resolved locally, nothing to report). Updated
  `RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md` (RFTC042-7 now PASS, new RFTC042-11 for the CLI triage).

- **BUG-TCM-086 found 2026-10-21 (later same session) — a genuine, real cross-project IDOR, not a harness
  artifact.** The user set up a real 3-persona project-membership roster specifically to let the rftc-043
  DAST authz-matrix generator run with its full intended roster: `qa.limited` (Manager, primary project
  `rftc-016-ci-qa` only), `qanonadmin` (Developer, same project — chosen because this instance's actual
  "Reporter" role already carries `execute_testcase`, so "Developer" was used instead to get a genuinely
  no-execute persona), `dev1` (a brand-new user, Developer role, member of the foreign project
  `rftc-038-multisuite-qa` ONLY). With all 4 personas (admin/qa.manager/reporter/dev1) resolved, the live
  `harness/run.py --layers security` run's `run_test_cases` authz-matrix probe returned `200` with real
  data for `dev1` — a user with zero relationship to the primary project — on both project-id path
  variants. Independently reproduced by hand via direct `httpx` calls (not just trusting the harness's own
  verdict). Root-caused via source read: `RunsController#get_testcases` (the action behind
  `GET /projects/:project_id/runs/:run_id/test-cases.json`, which powers the Run Execution view's
  test-case grid) checks only `User.current.anonymous?` — the `:project_id` it loads is never actually
  used to scope or validate `@run`, which is loaded by raw id alone. This is the exact SEC-001/C3 pattern,
  confirmed to have been fixed for `update`/`destroy`/`close_run` and separately for the sibling action
  `get_testcases_attribute` (whose own inline comment cites this exact bug class) — but **missed** for
  `get_testcases` itself. Filed as **BUG-TCM-086 (High)**.
- **BUG-TCM-086 reported to production 2026-10-21, per explicit user approval ("okay create bug on
  production"):** filed as #124227, assigned to Vaishnavi Bhawsar, target version Release 7.2.0. Before
  this, created production test suites `RFTC-042 TCM Testing Harness` (#452) and
  `RFTC-043 Security Discovery Testing` (#453) — both nested under parent suite #6 "Testcase plugin" —
  and all 22 corresponding testcases (RFTC042-1 through RFTC042-11 incl. 7a; RFTC043-1 through RFTC043-10),
  mirroring both local external-spec testcase files in full. Added all 22 to Run #612 and recorded results:
  21 Passed, 1 Failed (RFTC043-9, linked to #124227 via `report_defect`).

- **Final retest pass, 2026-10-22:** per user instruction ("restart redmine localhost:3000" then "retest tcm
  bugs"), restarted `redmine6-redmine-1`/`redmine6-sidekiq-1` after the dev's fix pull. Confirmed both fix
  commits via `git log`/`git show`: `6d0055e` ("Fix import wizard page title repeating itself" — removes the
  duplicate `document.title` line from `_suite_tree.html.erb`) and `ad6437c` ("Fix cross-project data leak in
  the run execution test-cases API" — adds `rftc_authorize_project_read!` + scopes `@run` to its project,
  explicitly citing #124227). Live-retested both: **BUG-TCM-083** — `document.title` on the Import Wizard
  Step 1 page now shows a single prefix, no duplication. **BUG-TCM-086** — `dev1` (non-member) now correctly
  gets 404 on both project-id URL variants; `qa.limited` (real member) still gets 200 with correct data, no
  regression. Spot-checked the Run Execution view (`/runs/5`) renders its test-case grid correctly for the
  legitimate admin session. **Both CONFIRMED FIXED**, moved to `bugs/closed/`, production issues #124202 and
  #124227 synced to Done/100%. **`bugs/open/` is completely empty again.**

- **Full-plugin regression continued, 2026-10-22 — `TESTCASE_MANAGEMENT_CONFIGURATION.md` suite.** Per user
  instruction to start the post-fix-pull §27 regression from the Configuration suite: re-verified TC-TCM-001
  (blank tracker → clean error, BUG-TCM-010 stays fixed), TC-TCM-005 (same tracker for Testcase+Defect →
  Report Defect completes cleanly, BUG-TCM-011 stays fixed), TC-TCM-006 (Show Testcase Count — verified in
  BOTH the Test Cases section tree AND the New Test Case form's suite picker, both PASS), TC-TCM-007 (Hide
  Testcase Execution section — PASS both directions), TC-TCM-014 (Email Reminder — previously deferred as
  "needs 24h wait," now PASS by directly invoking `ReminderWorker`'s real send methods via `rails runner`,
  confirmed real reminder emails in Mailpit).
  - **Found BUG-TCM-087 (High, new):** "Run Added" email can never be sent for a run created via the normal
    web UI — `app/views/runs/new.html.erb:254` hardcodes `hidden_field_tag 'from', 'API'` unconditionally,
    which `run.rb`'s CI-run-suppression guard (`return if from == 'API'`) treats as "don't email," for every
    single web-created run, 100% of the time. Confirmed independently with two different assignees (self and
    a different real user) to rule out self-notification suppression. Filed, not yet reported to production.
  - **"Run Updated" and "Testcase Result Added" emails both confirmed genuinely working** (unlike "Run
    Added") — editing a run and recording a result both triggered real, correctly-templated emails in
    Mailpit.
  - **BUG-TCM-013 REOPENED** — "Testcase Result Added" duplicate-email genuinely reproduced live (the
    2026-10-06 closure had been code-read only, never live-retested). Root cause narrowed via
    `docker logs`: only ONE `MailDeliveryJob` was ever enqueued/performed (the existing cache-guard fix
    correctly prevents a double enqueue), yet Mailpit received 2 messages with the IDENTICAL Message-ID —
    pointing to the duplication happening at the SMTP transport layer, a different failure mode than the
    existing fix addresses. Production #121703 reopened (Reopen, 30%) with full evidence; local file moved
    back to `bugs/open/`.

- **BUG-TCM-088 (Medium) found 2026-10-22**, while testing the notification Enabled/Disabled toggle at the
  user's explicit request (`settings?tab=notifications`): disabling "Run updated" correctly suppresses the email
  (confirmed via `docker logs` — the job still runs but the mailer's internal guard returns before `mail(...)`).
  Re-enabling it and editing the same run again correctly resumes delivery — **but 3 consecutive real edits in a
  row each produced an email showing the PREVIOUS edit's run name, not the name just saved**, even though
  `Run.find(70).name` confirmed the DB save itself was correct every time. Not a duplicate-delivery issue
  (distinct from BUG-TCM-013) and not the already-fixed hardcoded-label issue (BUG-TCM-012) — this is specifically
  about which version of the run's data the email renders. **Extended per follow-up ("assignee or environment
  bhi")**: a multi-field edit (Name/Status/Run Type/Due Date/Assignee) ~6 min after the prior edit rendered
  entirely correctly, but an immediate follow-up edit ~15 seconds later reproduced the staleness across Name,
  State, Environment AND Assignee in the email's summary box — while the separately-computed "Changes:" diff
  line stayed correct. Confirms the bug is timing-sensitive (rapid repeat edits) and affects every field read
  off the `run` object, not just name.

- **BUG-TCM-087 and BUG-TCM-088 reported to production `ztflux` on 2026-10-22**, per explicit user instruction
  ("bug production pe report kr do"): BUG-TCM-087 → **#124272** (High), BUG-TCM-088 → **#124273** (Medium), both
  assigned to **Vaishnavi Bhawsar**, category Testcase Management Plugin, standard severity mapping (High →
  priority High/High-severity/High; Medium → priority Medium/Medium-severity/Medium; Defect Type Functional for
  both). Created as **standalone bug issues via `redmineflux_core_create_issue`** — per explicit user instruction
  ("inko run me nhi dalna he"), neither was linked to a production Test Run or Test Case.

- **BUG-TCM-072 REOPENED 2026-10-22**, found live by the user while normally using the Requirements page (typed
  `#` in a requirement's content editor, a real `alert('export-xss')` fired). Root-caused to a **second,
  completely separate mention-dropdown** on the same page that the original 2026-10-21 fix never touched: the
  fix correctly patched `createIssues()`/`#user-list` (confirmed still escaping correctly), but `script.js` also
  wires up an independent Tribute.js instance (`mentionIssue`, triggered on `#`) populated with raw, unescaped
  issue subjects and no custom `menuItemTemplate` override — so it falls back to the vendored Tribute library's
  own default template (`return e.string`), inserted via unescaped `innerHTML`. Confirmed live via
  `document.querySelector('.tribute-container ul').innerHTML` showing genuine `<img src=x onerror=...>` elements
  for issues #35 and #2063. Only visible in `RFTC-016 CI Ingest QA` because that's the one project containing
  the crafted XSS-payload test fixtures — the sink itself is universal, not project-scoped. Moved back to
  `bugs/open/`. **Production #124008 reopened 2026-10-22, per explicit user approval** — moved Done/100% →
  Reopen/30%, with a full note explaining the second, never-patched Tribute.js rendering path.

- **BUG-TCM-009 REOPENED 2026-10-22 (narrower)**, found while regressing the Permissions suite on this build.
  The non-member sub-case (this bug's main original scope) stays genuinely fixed — re-verified live with `dev1`
  (confirmed non-member of `rftc-016-ci-qa`), correctly refused on all 8 original URLs. But the separate
  module-disabled sub-case (TC-TCM-077, folded into this bug 2026-09-30) only holds for 8 of 9 endpoints —
  **Test Suites alone was never actually fixed for this sub-case**: disabling the module on the project still
  leaves `GET /test_suites?project_id=...` and `/test_suites/releases?project_id=...` rendering full real suite
  data for a genuine member. Root-caused precisely: `test_suites_controller.rb`'s `rftc_authorize_suite_read`
  calls `rftc_project_readable?` (checks visibility only), while the other 8 controllers correctly use
  `rftc_authorize_project_read!` (checks visibility AND `module_enabled?`) — the 2026-10-06/07 fix wave rolled
  the comprehensive helper out everywhere except this one controller, and its own closing note's "For QA" repro
  steps never actually listed Test Suites to re-verify. **Confirmed live via a real Playwright browser session**
  (not just curl) — the TestCases nav tab correctly disappears, but navigating directly to the Test Suites page
  still renders the full suite tree and a working "New Test Case" button. **Extended further, found by the
  user directly testing the actual role**: removed every Testcase Management permission from the `Manager`
  role (leaving `view_test_suite` explicitly unchecked) with the module left fully **enabled** this time —
  `qa.limited` could still browse the entire suite tree and reach the "Add Testcase" form. Confirmed via
  `rails runner`: `allowed_to?(:view_test_suite, project) == false`, yet the page rendered fully regardless.
  Neither `rftc_project_readable?` nor `rftc_authorize_project_read!` ever checks `view_test_suite` (or any
  Testcase Management permission) at all — this is a second, independent gap on top of the module-enabled one,
  same class of defect as BUG-TCM-007 but on the *read* side of this one controller. **Per further user
  follow-up, re-confirmed both affected URLs precisely**: `GET /test_suites?project_id=...` AND
  `GET /projects/.../issue_testcase/new` (the "New Test Case" form itself) — both render in full with
  `view_test_suite == false`. The second URL is a **separate controller** (`IssueTestcaseController#new`,
  distinct from `TestSuitesController`) with the exact same missing-permission shape — it has zero
  authorization of any kind, unlike its own `#create` action which at least checks the generic Redmine
  `add_issues` permission. **Severity upgraded to High.** Role permissions restored immediately after.
  **Production #121699 synced 2026-10-22**, per explicit user approval ("production pe bhi sync he bug jo bhi
  findings he") — `fixed_version_id` moved from the closed Release 7.1.0 to the open Release 7.2.0 first (same
  precedent as BUG-TCM-013/072), then `status_id` → Reopen, `done_ratio` → 30%, with full notes covering both
  findings (Test Suites' missing module-enabled + `view_test_suite` checks, and
  `issue_testcase_controller.rb#new`'s zero-authorization gap), the 3-part suggested fix, and references to all
  three local screenshots. Verified via follow-up `get_issue`.

- **BUG-TCM-089 NEW 2026-10-22**, found while the user manually stripped all Requirement permissions from the
  Manager role and poked around the real Requirements screen. Three findings. **(1) Design question, not a
  defect**: confirmed via `Redmine::AccessControl.permissions` that Requirements has no `view_requirement`
  permission registered at all — unlike Test Suites/Reports, which both have their own view permission;
  flagged for the dev to decide intentionally, not assumed to need a code fix. **(2) UI-only gap, backend
  confirmed safe**: the "+" Add Requirement icon, the "r" keyboard shortcut, and the Edit Title pencil all stay
  visible and operable with zero `add_requirement`/`edit_requirement` — but submitting either silently fails
  with **no error message at all**, confirmed via `Requirement.where(title: ...).count == 0` after a probe
  create attempt, and via direct curl POST/PUT both returning 403 Forbidden. Backend genuinely holds; this is a
  UI-visibility + missing-feedback defect, not a bypass. **(3) Real bypass, High severity**: attached a real
  file to Requirement #6, then downloaded it via `/requirement/download?id=...` as a role with every
  Requirements permission stripped — got a clean 200 OK with the full file. Root-caused to
  `allowed_to_download_requirement_attachment?` falling back to `@attachment.visible?(User.current)`, which
  resolves to core Redmine's `view_files` permission (confirmed still `true` on the stripped Manager role
  throughout) — completely unrelated to any Testcase Management permission. An admin who deliberately removes
  all Requirements access from a role cannot actually stop that role downloading Requirement attachments.
  Role permissions restored to the documented 17-permission baseline immediately after. **Reported to
  production 2026-10-22 as #124298** per explicit user instruction ("create bug on production") — standalone
  issue (no Test Run/Testcase link, matching the BUG-TCM-087/088 pattern), Bug tracker, Priority High, Category
  "Testcase Management Plugin", Target version Release 7.2.0, assigned to Vaishnavi Bhawsar.

- **BUG-TCM-090 NEW 2026-10-22**, found by the user with a role granted only `create_test_suite` (no view/edit/
  delete). Two findings on `/projects/<project>/issue_testcase/new` ("Add Testcase"). **(1)** The test-suite
  tree's "⋮" kebab menu correctly shows only "Add Sub Test Suite" on the real Test Suites page for this role,
  but shows **all three options** ("Edit Folder", "Add Sub Test Suite", "Delete Test Suite") for the identical
  suite on the Add Testcase page — confirmed by hovering the same "CI Ingest" suite on both pages back to back.
  **(2)** Clicking "Edit Folder" on this page 404s (`GET /test_suites/3/edit?project_id=undefined`) —
  **reproduced identically as Admin** (full permissions), confirming it's a plain functional bug, not a
  permission-gated failure. Root-caused precisely: `test_suites/index.html.erb`'s `#subfolder-modal` sets
  `data-project_id="<%= @project.identifier %>"`; `issue_testcase/new.html.erb`'s copy of the same modal never
  sets this attribute at all, so `#subfolder_edit`/`#delete_folder`'s shared JS handler always reads
  `project_id=undefined` on this page. "Delete Test Suite" shares the identical broken dependency (confirmed
  via source, not executed — blocked by the session's own irreversible-deletion safety guard before any real
  delete was attempted). No role permissions were changed during this investigation. **Reported to production
  2026-10-22 as #124317** per explicit user instruction ("bug report kro production pe") — standalone issue (no
  Test Run/Testcase link, matching the BUG-TCM-087/088/089 pattern), Bug tracker, Priority High, Category
  "Testcase Management Plugin", Target version Release 7.2.0, assigned to Vaishnavi Bhawsar.

- **BUG-TCM-091/092/093/094 NEW 2026-10-22**, all four found while executing `TESTCASE_MANAGEMENT_SECURITY.md`
  (the Security suite's first full execution pass, per "secrity bhi kr lo test"). **091** (High): CSV import's
  `step2` never validates `selected_suite_id` against the importing project — confirmed via direct model-layer
  replication of the exact controller code path, then a live leak confirmation as `dev1` (genuine non-member)
  via `GET /get_test_cases`. **092** (High): found incidentally while investigating 091/TC-231 — the default
  `/test_suites?project_id=<id>` page (no `testsuite_id`) crashes with a full 500 for every user whenever the
  project has any unassigned test-case issue, reproduced 3/3 times, confirmed unrelated to 091's probe. **093**
  (Critical): genuine, confirmed-executing stored XSS in the Requirements sidebar tree — proven definitively with
  an `<img onerror=...>` payload (distinguishing real execution from a merely-inert injected `<script>` tag,
  since browsers never auto-execute `<script>` elements inserted via `innerHTML` regardless of escaping gaps).
  **094** (Medium): `issue_status_results_controller.rb#new` has zero project-scoping or authorization filter at
  all — a Project-A-only member can load Project B's "Add Result" form by ID and see its environment name(s);
  the separate `#create` (write) path independently re-derives and correctly checks project membership, so this
  is read-only disclosure, not an exploitable write. All four root-caused precisely to exact file/line, all probe
  fixtures (issues, requirements, suite links, a disposable suite, a disposable run) deleted immediately after
  confirmation, and `qanonadmin`'s baseline Developer-role membership on `rftc-016-ci-qa` was restored after a
  mid-session revoke-and-restore test (TC-TCM-241). **Reported to production 2026-10-22 as #124346 (091) /
  #124347 (092) / #124348 (093) / #124349 (094)**, per explicit user instruction ("bugs report kr do production
  pe") — all four standalone issues (no Test Run/Testcase link, matching the BUG-TCM-087/088/089/090 pattern),
  Bug tracker, Category "Testcase Management Plugin", Target version Release 7.2.0, assigned to Vaishnavi
  Bhawsar. Priority: 091/092 High, 093 Blocker (Critical-severity, no native "Critical" priority level — same
  mapping as BUG-TCM-082), 094 Medium. Custom fields left at project defaults (`list_custom_fields` permission
  error for this account, same limitation as every prior production report this session).

- **BUG-TCM-095 NEW 2026-10-22**, found while regressing `TESTCASE_MANAGEMENT_TEST_CASES.md` per explicit user
  request (three specific concerns: the current 40000-char Step/Expected boundary, Requirement linking from both
  Create and Edit forms, and a permission question about the bulk Requirements context-menu action). The first
  two concerns both came back genuinely fixed/working on the current build (BUG-TCM-021/022 confirmed still
  fixed, requirement linking confirmed working from both Create and Edit). The third — the user's own suspicion
  that this bulk action should be gated by core `edit_issue` rather than the plugin's `edit_requirement` — turned
  out to be a UI-consistency gap rather than a permission-choice error: the server-side gate (`edit_requirement`)
  is deliberate and consistent with the single-issue equivalent, but the Requirements submenu in
  `context_menus/issues.html.erb` is the one submenu in that file that never passes `:disabled` based on
  permission, unlike every sibling submenu (Status/Tracker/Priority/etc.), so it looks usable to a user who
  actually can't use it, then 403s on click. Filed as **BUG-TCM-095**, Low. **Reported to production 2026-10-22
  as #124386**, per explicit user instruction, after confirming with the user this is genuinely distinct from
  (not a duplicate of) BUG-TCM-096 below — related in class, but different root cause and fix location.

- **BUG-TCM-096 NEW 2026-10-22**, found as a direct consequence of the user's own sharp follow-up question on
  BUG-TCM-095: "if the Edit form already lets a user add a requirement, shouldn't the issue-list action work the
  same way too?" Checking this precisely surfaced something more serious than an inconsistency — **the Edit Issue
  form's own Requirement linking has no permission check at all**. Confirmed live: as `qanonadmin` (core
  `edit_issues` granted, `edit_requirement` explicitly denied, verified via `User#allowed_to?` before the test),
  opened a fresh probe issue for Edit, selected a Requirement in the dropdown, saved — the `RequirementIssue` row
  was genuinely created. Root-caused to `model_issue_hook.rb`'s `controller_issues_edit_after_save` (and the
  identical gap in `controller_issues_bulk_edit_before_save` for the standard Bulk Edit form), which process
  `requirement_ids` with zero `allowed_to?(:edit_requirement, ...)` check, unlike every other path that performs
  the same mutation (`RequirementIssuesController#create`, `TestSuitesController#assign_requirement`). Filed as
  **BUG-TCM-096**, High (a genuine authorization bypass, not a cosmetic gap like BUG-TCM-095). **Reported to
  production 2026-10-22 as #124387**, per explicit user instruction, alongside BUG-TCM-095 (#124386).

- **BUG-TCM-097 (Medium) found 2026-10-23** while executing TC-TCM-151 ("a test case in multiple suites") as part
  of resuming the §27 full-plugin regression. Since BUG-TCM-025 is now fixed, re-checked whether multi-suite
  membership is genuinely supported end-to-end — it is at the data layer (`Testsuite has_many :issues, through:
  issue_test_suites`), but a Run covering two suites a test case belongs to builds **two separate `RunIssue`/
  `IssueStatusResult` rows** for that one case instead of one, so it can be marked Passed under one suite tab and
  Failed under the other in the same run, and the run's own aggregate total double-counts it. Deliberately isolated
  to a single environment to rule out legitimate multi-environment tracking as the explanation (confirmed with the
  user, who separately raised the valid point that multiple environments *should* produce separate, legitimate
  per-environment results — this bug is not that; it reproduces with only one environment). Not yet reported to
  production.
- **BUG-TCM-098 (Medium) found 2026-10-23**, spotted directly by the user comparing two of their own screenshots
  from Run #76 (`TC-TCM-042-env-rename-run`, which has 2 environments): the suite-switcher dropdown's "to run"
  badges stayed identical (e.g. "CI Ingest: 25 to run") no matter which environment was selected, while the donut
  chart and results grid directly below correctly re-filtered to the selected environment's real total (12).
  Confirmed via `rails runner`: the dropdown reads a raw, non-deduplicated, environment-unfiltered `run_issues`
  count (25, inflated partly by BUG-TCM-097's per-suite duplication) instead of the same distinct-issue,
  environment-scoped query the grid/donut already use. Not yet reported to production.
- **BUG-TCM-097 re-verified and upgraded to High, 2026-10-23**, per the user's direct question ("ek testcase do
  different testsuite me kaise ho sakta he") and explicit request to redo the test cleanly on a brand-new run with
  2 environments. Confirmed again: no UI path exists today to create this state (Move removes from other suites,
  Copy duplicates the issue) — only a direct `IssueTestSuite` write reaches it, though BUG-TCM-091's CSV-import
  cross-project suite link proves the general class of "an issue linked to a suite outside the normal move/copy
  flow" is already a real, reachable condition. With 2 brand-new suites, a brand-new test case, and a brand-new
  run (#78, 2 environments, zero historical data), marked the case **Passed** under one suite's tab and
  immediately confirmed the same case still read **Untested** under the other suite's tab — a genuinely
  contradictory status in the same run/environment, with "All Suites in Run" silently showing only one of the two
  truths (Passed). This is a real data-integrity defect, not just a double-counted total — severity raised
  Medium→High. Also reconfirmed the suite-switcher dropdown badge mismatch (BUG-TCM-098's symptom) on this same
  clean run: "All Suites in Run: 1 Passed, 0 Failed, 1 to run" (sums to 2) against the true count of 1 test case.
- **BUG-TCM-098 corrected and upgraded Medium→High, 2026-10-23**, after the user pushed back on the original
  framing: they spotted a different run (#80, suites `test1` [parent] + `t3` [child]) where the dropdown's own
  numbers actually summed correctly, correctly doubting the first write-up. Re-investigating the user's own
  question — "shouldn't 'All Suites in Run' show every test case from every suite in the run?" — found the real,
  more severe root cause in `runs_controller.rb#show`: when no `testsuite_id` param is present (exactly the "All
  Suites in Run" state), the controller does not aggregate across the run's suites at all — it silently picks
  `@run.testsuites.first` and shows only that one suite's cases under the "All Suites in Run" heading. Confirmed
  live on Run #80: the grid showed "No data to display" / "0 of 0 tested" even though the run has one genuine test
  case (only visible by explicitly selecting suite `t3`), because `.first` happened to resolve to the empty parent
  suite `test1`. The original dropdown-badge finding (environment-blind, non-deduplicated) on Run #76 was
  re-confirmed as still real and independent, but is now documented as the secondary issue, not the primary one.
  Also explicitly tested and ruled out the user's hypothesis that Edit Run → Save causes or fixes the stale badge
  — confirmed no effect either way on Run #78. A minor additional UI observation (dropdown panel overlapping page
  content on a short run name) was also noted for follow-up, not yet root-caused.
- **BUG-TCM-097 and BUG-TCM-098 reported to production `ztflux` on 2026-10-23** as #124423 and #124424
  respectively, per explicit user instruction ("dono bug production pe create kr do"). Both Bug tracker, Priority
  High, Category "Testcase Management Plugin", Target version Release 7.2.0, assigned to Vaishnavi Bhawsar,
  standalone issues (no Test Run/Testcase link). Every bug in `bugs/open/` is now reported to production.
- **BUG-TCM-097 extended 2026-10-23**, same day, after the user reported "testcase detail page pe run name
  multiple time dikh raha he" on issue #23's ("test_login_valid") own detail page, then clarified it meant one
  single run's name repeating several times, not several different runs. Root-caused to the exact same underlying
  defect as the main finding (`RunIssue` keyed per issue+run+testsuite instead of per issue+run) now corrupting a
  second page: `app/views/issues/_steps_list.html.erb`'s "Test Run:" field does
  `@issue.runs.map(&:name).join(', ')`, and `Issue#runs` (`has_many :runs, through: :run_issues`) has no
  `.distinct`, so it returns the same `Run` once per duplicate `RunIssue` row. Confirmed directly: issue #23 has 6
  separate `RunIssue` rows for run 76 alone (`testsuite_ids [3, 3, 5, 6, 7, 22]`), exactly matching the screenshot's
  6x-repeated run name. Documented as an "Additional manifestation" in BUG-TCM-097.md rather than a new bug, since
  it is the same root cause on a different page; the same suggested fix (dedupe `RunIssue` to one row per issue per
  run) resolves both. Also flagged, as an open follow-up (not asserted as a confirmed defect): the same page's
  "Test Suite:" field showed 3 suite names in the screenshot while the issue's current `issue_test_suites` has only
  1 row — not yet reconciled. Not yet reported to production as a separate item (folds into #124423 once that's
  updated, pending user instruction).
- **BUG-TCM-097's extension reported to production 2026-10-23**, per explicit user instruction ("han kr do"):
  added as a comment to the existing production issue **#124423** (not a new issue), describing the second
  manifestation (issue detail page's "Test Run:" field repeating a run's name) and its shared root cause/fix with
  the main finding.
- **BUG-TCM-099 and BUG-TCM-100 (both Low) found 2026-10-23** while thoroughly re-testing
  `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md`'s Requirements page per explicit user instruction to check every
  editor feature, attachment, search, download and share functionality without skipping anything. BUG-TCM-099:
  pressing Escape anywhere throws a console `TypeError` from the plugin's onboarding-tour script, reproduced 2/2,
  no functional breakage. BUG-TCM-100: the Save and Close icon buttons both carry `alt="share-icon"`, identical
  to the real Share button, confirmed via DOM inspection. Neither reported to production yet (pending approval).
  **Three other suspected findings were investigated and correctly discarded as false alarms** before being
  written up, each traced to a flaw in the test script itself rather than the product: (1) Code/Quote/Delimiter/
  Table/Image block insertion appeared to throw errors and fail — root-caused to the test script always clicking
  the *first* (stale, invisible) `.ce-popover` element in the DOM instead of the genuinely open one; corrected by
  checking `offsetParent !== null`, after which all 12 block types inserted cleanly. (2) The Image block appeared
  to lose its content on reload — a `textContent`-based check is meaningless for an `<img>` tag; the actual
  `src` attribute and a byte-for-byte MD5 comparison confirmed the image persisted perfectly. (3) The Requirements
  search feature appeared to return "0 results" for a term known to exist in a requirement's body — caused by the
  test script's `.fill()` call not triggering the live-search component's real keystroke listener; retyping with
  genuine keyboard events produced the correct result. One genuine, minor, non-bug observation was also recorded:
  the Highlight/marker inline tool's `style` attribute does not survive reload (likely stripped by this plugin's
  own prior XSS-hardening sanitization, not a new regression), and the content search only matches requirement
  body text, never the title (a minor feature gap, not asserted as a defect).
- **Requirement↔testcase linking/unlinking thoroughly re-tested 2026-10-23**, same day, per direct user
  follow-up asking specifically where these test cases live and whether every real linking surface was covered.
  Tested all 3 surfaces for both link and unlink: the plain Issue Edit form's Requirement select2 field (link
  confirmed working — TC-TCM-310, after correcting a false-negative first attempt where the whole form
  submission silently hadn't gone through; unlink reconfirms the already-open **BUG-TCM-027** with cleaner
  evidence — server returns "Successful update." while nothing actually persists, TC-TCM-311), the Testcase-grid
  right-click context menu (confirmed assign-only, no unlink/remove option exists in the Requirements submenu at
  all — TC-TCM-312, documented as an existing gap, not a new bug), and the requirement page's own `#`-mention
  (already covered by TC-TCM-271/272, both PASS). Also verified the RTM's own counts against the real underlying
  data: "Total Defects Found" (10) matches an independent `ExecutionDefect`-based count exactly (TC-TCM-313);
  "Total Linked Testcases" (12) correctly excludes 2 dangling `RequirementIssue` rows pointing to already-deleted
  test cases #2121/#2124 (TC-TCM-314 — a data-hygiene observation, same general pattern as BUG-TCM-061's orphan
  rows, not filed as a new bug since the RTM itself handles it correctly). Re-confirmed, per direct user
  question, that the RTM itself never shows whether a linked test case belongs to any Run — only the separate
  Requirement Coverage report does (TC-TCM-315, same finding as TC-TCM-123/126). Zero new bugs this round.
- **TESTCASE_MANAGEMENT_TEST_RUNS.md regressed 2026-10-23**, per user instruction to check the Run suite next.
  Executed the one TC in that file that had never run (TC-TCM-170, Record a Passed result — PASS) and
  re-verified the 3 TCs whose 2026-10-01 findings were blocked by/filed as now-closed bugs: **BUG-TCM-011**
  (TC-TCM-168 — creating a new test case after BUG-011's fix submits cleanly on the Testcase tracker; the new
  case correctly does NOT retroactively appear in a specifically-scoped run, consistent documented behavior),
  **BUG-TCM-014** (TC-TCM-174 — searching the Defects* field by a real existing defect's numeric ID now
  correctly finds and links it, no duplicate issue created), **BUG-TCM-015** (TC-TCM-176 — the Add Result panel
  now has a real file-upload control; attached file round-trips byte-identical via its download link). All 3
  bugs confirmed genuinely fixed and were already in `bugs/closed/` from an earlier untracked session. Zero new
  bugs this pass.
- **Correction, 2026-10-23 (same day)**: the above was initially reported to the user as "TEST_RUNS.md fully
  regressed," but only 4 of ~40 TCs had actually been live-reverified. The user asked directly whether every TC
  had been tested. Checked `git log` on this suite's controllers/models/views since 2026-10-01 and found dozens
  of relevant commits (a Run Results page redesign, bulk-update-on-already-executed-case fix, closed-run 500
  fix, defect-field fixes, and more) — unlike `TESTCASE_MANAGEMENT_CSV_IMPORT.md`, where the same check found
  zero relevant changes and justified a narrow spot-check, this suite's code had genuinely moved and the
  original claim was premature. Performed a real follow-up pass: live-reverified TC-TCM-152 (create with all
  fields, on the redesigned Add Run modal), TC-TCM-157 (edit — due date + assignee), TC-TCM-158/159 (close run,
  closed-run execution block, no 500), TC-TCM-160/161 (delete + cancel, DB-confirmed deletion), TC-TCM-165
  (Active/Closed tab partition), and — most importantly — **re-ran TC-TCM-188/190 specifically against the
  "bulk update silently not applying to an already-executed case" bug the Oct-7 commit targeted**: bulk-updated
  12 cases including one already Passed, confirmed it also changed to Skipped. All PASS. ~30 of the suite's 40
  TCs still only carry 2026-10-01 evidence and were not re-clicked this pass — disclosed plainly in the suite
  file rather than claimed as covered.
- **Second TEST_RUNS.md follow-up pass, same day (2026-10-23)**, per the user's own extremely specific checklist
  (run create/edit data integrity, select-all vs. specific selection, multi-environment, run-list column
  accuracy, bulk-update real persistence, Failed/Blocked + donut-chart behavior, and issue-detail-page result
  reflection). Created run #83 ("TC-TCM-153-154-regress-all-cases-multienv", "Include all test run" + 2
  environment/assignee rows) and DB-verified it end to end (after fixing an own query bug —
  `Testsuite#project_id` stores the project's string identifier, not its numeric ID): every run-list column
  matched the DB exactly; the run's 29 distinct cases exactly matched the full project (zero missing/extra); but
  34 `RunIssue` rows exist for those 29 issues because 4 belong to >1 suite — **BUG-TCM-097's root cause
  reconfirmed on the "Include all" creation path itself**, not just manually-selected multi-suite runs (bug file
  updated). Set case #24 Failed (defect #3642) and case #26 Blocked (same defect #3642 reused) via the run grid —
  donut chart correctly updated through Untested(18)→Untested(17)/Failed(1)→Untested(17)/Failed(1)/Blocked(1),
  each with correct percentages; "Linked defects" count stayed correctly at 1 (not double-counted). One real
  tooling gotcha hit and corrected along the way: the Defects* multi-select's auto-highlighted search match is
  not actually committed until the option is explicitly clicked — submitting on the auto-highlight alone throws a
  client-side "Please select an item in the list." validation popup with no network request fired. Cross-checked
  both the grid-set (Failed/Blocked) and an earlier bulk-updated result via each case's own issue detail page
  "Testcase Execution" section — Result values matched the grid/DB exactly in every case, confirming data
  correctness end to end. However, every single Run/Environment dropdown switch on that section throws a
  reproducible console `TypeError: Cannot read properties of null (reading 'innerHTML')` — reproduced 3x across
  issues #24 and #26, Result data unaffected both times. Filed as **BUG-TCM-101 (Low)**. One new bug this pass
  (BUG-TCM-101); one pre-existing bug (BUG-TCM-097) further corroborated, no new root cause.
- **BUG-TCM-102 (Medium) found 2026-10-23**, same day, per direct user follow-up asking specifically whether a
  defect created/linked against an existing run+environment shows the correct run/environment on its own detail
  page. Linked the same existing defect (#3642) to a case in a second, completely different run
  (`TC-TCM-042-env-rename-run`, run 76) via the Defects* search box, then reopened the defect's own issue page:
  "Test Run:" still showed only the first run (`TC-TCM-153-154-regress-all-cases-multienv`), missing the second
  entirely, directly contradicted by the Related Issues panel's own "2 runs" badge a few lines below on the same
  page. "Environment" on the same page correctly listed all 3 distinct environments across both runs. Confirmed
  via DB inspection (rails runner): the defect has 4 real `ExecutionDefect` rows spanning 2 distinct runs, but
  `@issue.run.name` (the stale scalar association rendered by `_steps_list.html.erb`'s defect-tracker branch)
  only ever reflects the first. Root-caused to the exact same bug class as closed BUG-TCM-050/058 (stale scalar
  `run`/`run_id` instead of the `ExecutionDefect` join), in a third, not-yet-fixed location — immediately next to
  the Environment field that already received the equivalent fix. Also explicitly confirmed, per the user's
  separate question, that a **closed** defect's ID correctly shows with a strikethrough, in both the Run's
  "Linked defects" summary panel and the grid's own "Defect ID's" column (confirmed via DOM inspection after an
  initial visual miss at low screenshot resolution). Not yet reported to production.
- **Third same-day pass, 2026-10-23**, per explicit user instruction to test everything remaining in
  `TESTCASE_MANAGEMENT_TEST_RUNS.md` without stopping. Re-verified 17 more TCs (155, 156, 162, 163, 166, 167, 171,
  172, 173, 177, 178, 180, 181, 182, 183, 185, 191). Two more new bugs found: **BUG-TCM-103** (Medium) — the Run
  result filter's "latest status" join can pull in a different environment's status when two environments'
  results for the same case share an identical `created_at`, reproduced both live and via an isolated query
  outside the browser. **BUG-TCM-104** (High) — a case's first-ever execution is misattributed in the Results &
  Comments view to whoever created the Run, not whoever actually recorded it, because the auto-seeded baseline
  row is updated in place rather than replaced; found by resetting `qa.limited`'s drifted password to the shared
  QA convention and genuinely logging in as a second real user to record a result, then confirming via DB that
  `added_by`/`created_at` stayed frozen at run-creation identity/time while `updated_by`/`updated_at` correctly
  showed the real actor. TC-169 could not be re-executed (destructive-action permission denial on deleting a test
  case). TC-164/184/186/189 still carry only 2026-10-01 evidence (mailbox/Sidekiq/bulk-notes checks not repeated
  this pass). Updated the suite file (13 inline retest notes + banner), both new bug files, bugs/_index.md,
  traceability matrix, plugin memory, STATUS.md, handoff, TIME_LOG.md same turn.
- **BUG-TCM-099 through BUG-TCM-104 (all 6 remaining unreported bugs) reported to production `ztflux` on
  2026-10-23**, per explicit user instruction ("jo bhi bugs abhi tak production pe created nhi he unko report kr
  do"): #124714 (TCM-099), #124715 (TCM-100), #124716 (TCM-101), #124717 (TCM-102), #124718 (TCM-103), #124719
  (TCM-104). All created as standalone issues via `redmineflux_core_create_issue` (no Test Run/Testcase link),
  Bug tracker, Category "Testcase Management Plugin" (2085), Target version "Testcase Management plugin Release
  7.2.0" (2067), assigned to Vaishnavi Bhawsar (192) — same convention used for every recent batch in this
  plugin. Priority/Defect Severity/Defect priority mapped from each bug's local severity per the standard table
  (Low→1/Low-severity/Low ×3, Medium→2/Medium-severity/Medium ×2, High→3/High-severity/High ×1); Defect Type
  Functional for all 6. **Every bug in `bugs/open/` is now reported to production.**
- **Reports suite (`TESTCASE_MANAGEMENT_REPORTS.md`) regression, 2026-10-23**, per explicit user instruction to
  test report creation, all 3 download formats (HTML/PDF/Excel) with real content verification for every report
  type, email delivery (PDF/HTML), scheduling, and CRUD, writing any missing test cases along the way. Created 8
  reports (#136–143, one per report type) against run #83. Added the 2 missing creation TCs (TC-TCM-316 Slow
  Tests, TC-TCM-317 Most Failed Tests — these report types existed with bug history but had no creation TC).
  Confirmed **BUG-TCM-075 (fixed)** — re-verified the Run Name/Environment PDF heading is correct across Testcase
  Summary/Activity Summary/Defect Summary/Overdue Run Summary on this build. Confirmed BUG-TCM-097 (duplicate
  RunIssue rows) propagates into 4 more report types (Testcase Summary, Activity Summary, Tester Scorecard,
  Requirement Coverage) — not separately filed, noted as an extension in TC-TCM-079. **3 new bugs found and
  reported to production**: BUG-TCM-105 (High, Defect Summary wrong/missing Testcase ID — root-caused to an
  unscoped `IssueRelation` lookup), BUG-TCM-106 (High, Requirement Coverage Excel export returns "Unknown Report
  Type" instead of data), BUG-TCM-107 (Medium, Slow Tests PDF export drops its entire body). An ambiguous
  `pdftotext -layout` column-garbling artifact on the Overdue Run Summary PDF was investigated but not filed —
  cross-checked against plain `pdftotext` output (clean), concluded likely a text-extraction heuristic limitation,
  not a confirmed rendering defect; flagged for a future session with a PDF-to-image tool available. **Email
  delivery (all 8 types, PDF/HTML) and scheduling were covered in the same-day follow-up passes below; CRUD
  (TC-TCM-088–090) still not covered.**
- **Correction, 2026-10-23: 3 production issue subjects (#124772–#124776, BUG-TCM-105–109) and 2 earlier-session
  issues (#124423 BUG-TCM-097, #124424 BUG-TCM-098) were missing the `BUG-TCM-NNN:` subject prefix convention —
  user caught this directly.** All 5 corrected via `redmineflux_core_update_issue` to the standard
  `BUG-TCM-NNN: <title>` format, matching every other production issue in this plugin. Checked every other
  production issue created this session (#124714–#124719, #124054) — all already had the correct prefix, no
  further changes needed. **Lesson for every future production report: always include `BUG-TCM-NNN:` as the
  literal first token of the subject, not just in the description.**
- **Reports suite emailing phase, 2026-10-23 (same day, continued).** Emailed all 8 report types in both HTML and
  PDF format to `qa.limited@test.local` via Mailpit (`localhost:8025`), verifying actual delivered content (not
  just "an email arrived") — real `.html`/`.pdf` attachments downloaded and inspected via the Mailpit API,
  including a full `pdftotext` content check on one PDF attachment (valid 8-page `%PDF-1.4` document, correct
  data). **2 new bugs found and reported to production**: BUG-TCM-108 (High, prod #124775) — Tester Scorecard
  crashes with an unhandled 500 under the default "Include all test run" scope as soon as any run in the project
  has a test case/environment pair with no recorded execution (an entirely normal, easily-reached state), and the
  same crash silently kills the report's emailed delivery with zero error surfaced anywhere; root-caused to an
  unguarded `nil.case_status_id` call in `testcase_reports_controller.rb`, confirmed via a direct DB query
  identifying the exact nil `(run, issue, environment)` combinations across all 41 of the project's runs
  (`@report.runs` resolves to every run under "Include all test run", not just the one the user was working
  with). BUG-TCM-109 (Low, prod #124776) — the emailed body's "Report Type:" line reads "Default Text" instead of
  the real name for Slow Tests and Most Failed Tests, in both HTML and PDF format; root-caused to a
  `report_type_texts` lookup hash in `run_mailer.rb` that was never updated when these two report types were
  added. Both bugs reveal the same underlying pattern already seen in BUG-TCM-106 this session: newer report
  types (Slow Tests, Most Failed Tests) and newer scope options get added to the UI without every downstream code
  path (Excel export, email body label, and now the Tester Scorecard controller logic itself) being updated to
  match. Updated the suite file (inline retest notes on TC-TCM-098/100/102), both new bug files, bugs/_index.md,
  same turn.
- **Reports suite scheduling phase, 2026-10-23 (same day, continued further).** Created a daily, a weekly, and a
  monthly scheduled report; confirmed all 3 list correctly in Scheduled Reports (interval/weekday/day-of-month/
  time all accurate) and that the stored `scheduled_time` is correctly interpreted as UTC with no drift
  (DB-confirmed against the form's entered values). **2 more bugs found and reported to production**:
  **BUG-TCM-110 (High, prod #124778)** — cancelling a scheduled report always 404s for every user including
  Administrator; root-caused to the authorization filter looking up the project by numeric `id` instead of its
  string `identifier`, confirmed via server log showing the DELETE request correctly reaching the controller as
  `admin` before the filter halted it with a 404 — the user asked for independent confirmation of this finding
  before it was filed, which held up on re-examination. **BUG-TCM-111 (Critical, prod #124779)** — far more
  severe: scheduled reports (and the plugin's own every-minute `ReminderWorker` cron job) never actually fire at
  all, on this entire environment, since every single Sidekiq boot — confirmed across 4 separate restarts
  spanning two days. Root-caused to Sidekiq's own core scheduled-job poller thread crashing immediately on boot
  (`ArgumentError` in `connection_pool`'s `TimedStack#pop`), a version incompatibility baked into this build's own
  `Gemfile.lock` (`sidekiq 7.3.9` vs `connection_pool 3.0.2`) — not a missing installation step, a genuine
  resolved-dependency defect. The schedule itself is recorded and displayed correctly in the UI (matching
  TC-TCM-107/108/109's own listing checks), but delivery can never happen — this silently breaks the entire
  "Scheduled Reports" feature, with nothing anywhere in the UI indicating a failure. **CRUD (TC-TCM-088–090) was
  completed in the same session — Edit, Delete, and Cancel deletion all PASS with zero new bugs — making this the
  first complete, suite-wide 2026-10-23 regression of `TESTCASE_MANAGEMENT_REPORTS.md`.** Updated the suite file
  (inline retest notes on TC-TCM-088/089/090/107/108/109/110/111, Evidence Map, top banner — now "fully
  regressed"), both new bug files, bugs/_index.md, same turn.
- **`TESTCASE_MANAGEMENT_TODO.md` regression, 2026-10-23** — the plugin's last remaining suite. `git log` on
  `testcase_todos_controller.rb`/`testcase_activities_controller.rb` since 2026-10-01 showed exactly one relevant
  commit (`618e599`, 2026-10-06/07), adding a missing project-access check to both. **TC-TCM-214 (Activity log
  cross-project leak, originally FAIL, extension of BUG-TCM-009) CONFIRMED FIXED** — re-tested a genuine
  non-member against a private project, `/testcase_activities` now correctly 404s. **TC-TCM-209** (To-Do
  project-scope leak, originally BLOCKED by BUG-TCM-022) — that blocker is now closed, but a fresh re-attempt to
  build the full two-project fixture hit a different, unrelated QA-fixture data issue (`rftc-perf-500`'s test
  suites were seeded with the project's numeric id instead of its string identifier by an earlier session's seed
  script, breaking Run creation there) — not a product bug, documented in plugin memory. TC-209 stays formally
  blocked on that specific fixture scenario, but its underlying security concern was independently confirmed
  fixed via the same direct non-member re-test approach used for TC-214 (`/testcase_todos` now correctly 404s
  too). Added a reconfirmation note to `BUG-TCM-009.md` documenting both instances remain fixed, unaffected by
  its later-reopened, narrower scope (Test Suites + `issue_testcase_controller.rb#new`). Remaining 8 TCs
  (205–208, 210–213) have zero relevant commits since 2026-10-01, not re-executed this pass, consistent with this
  session's established practice for suites with no code changes to re-test against. **Zero new bugs.** This
  completes the plugin's full current-build suite coverage — every suite has now been regressed or confirmed
  unchanged against build HEAD `d4f960b`. Updated the suite file (inline retest notes, top banner, Evidence Map),
  `BUG-TCM-009.md`, plugin memory, traceability matrix, same turn.
- **Search-field and chart-download coverage check, 2026-10-23 (same day, continued yet further)**, per direct
  user follow-up asking whether search fields across the plugin were actually tested and had TCs written, and
  whether the Run page's chart Download SVG/PNG/CSV was verified against the real grid data. Found 2 genuine
  coverage gaps and added TCs for both: **TC-TCM-318** (Run grid's own "Add filter → Subject" box, distinct from
  the Runs & Results list search and the Testcase Summary search) and **TC-TCM-320** (the To-Do page's own
  "Search by name or ID" box) — both executed live, both PASS (full name, partial name, numeric ID, and
  non-matching-term legs all correct). **TC-TCM-319** (Run chart Download SVG/PNG/CSV correctness) — the
  download itself is accurate to what the chart shows, but the chart was found to only reflect the **first**
  of a run's test suites under the default "All Suites in Run" view, silently excluding the other 7 (confirmed:
  run #84 has 8 suites with 18/3/3/4/1/1/1/2 distinct issues; chart/CSV show only the first suite's 18). **Not a
  new bug** — this is the identical root cause as already-open **BUG-TCM-098**, confirmed to also affect the
  grid underneath the chart in this same view. Appended as an extension to `BUG-TCM-098.md` rather than filed
  separately. Updated `TESTCASE_MANAGEMENT_TEST_RUNS.md` (TC-TCM-318/319, Evidence Map, top banner) and
  `TESTCASE_MANAGEMENT_TODO.md` (TC-TCM-320, Evidence Map, top banner), `BUG-TCM-098.md`, `bugs/_index.md`, same
  turn.
- **New suite authored: `TESTCASE_MANAGEMENT_OVERVIEW.md`, 2026-10-23**, per direct user request after the user
  pointed out the project's Overview/landing dashboard (`/test_suites/releases`) had never been tested — confirmed
  via `grep` it had zero mentions in `FEATURES_LIST.md`, the User Guide, or any testcase file. Authored and
  executed 8 new TCs (TC-TCM-321–328) covering: the chart's 3 dimensions (Activity/Defects/Result — all 3
  confirmed via real network-request inspection to be wired correctly), the date-range picker, Copy to Clipboard
  (confirmed copies `image/png`, not text — a first check via `readText()` looked like a failure before checking
  the right clipboard format), the chart's Download SVG/PNG/CSV (CSV column sums verified to match the on-screen
  legend exactly, 5-for-5), the Execution Details table's Run ID and Total Defects redirects, and the Test
  Runs/To-Do summary panels' redirects. **Zero new bugs** — one low-severity wording observation recorded but not
  filed (some runs show "By Unknown User" instead of "Unassigned," traced to a blank `Run#assignee_id`, which is
  technically accurate just unclearly worded). **One self-caught false positive avoided**: a synthetic
  `dispatchEvent` test of the dimension dropdown produced `dimensions=null` in the outgoing request, which looked
  exactly like a real bug — redoing it with a genuine Playwright `selectOption()` showed the dropdown actually
  works correctly; documented as a testing-methodology gotcha in plugin memory rather than filed as a defect.
  Updated `FEATURES_LIST.md` (new row #19), traceability matrix (new row #21), plugin memory (2 new lessons),
  `bugs/_index.md`, same turn.
- **BUG-TCM-112 through 119 (the last 8 unreported open TCM bugs) reported to production `ztflux` on 2026-10-25**,
  per explicit user instruction ("jo tcm ke bug abhi tak production pe reported nhi he unko report kro"), all
  assigned to **Vaishnavi Bhawsar** (id 192), Category Testcase Management Plugin, via
  `redmineflux_core_create_issue` (none of these 8 trace back to a TC-TCM-NNN suite/run, so no Test Run/Environment/
  Test Case ID/`report_defect` linkage applies — each stands alone as its own issue): #125090 (TCM-112, Medium),
  #125091 (TCM-113, High), #125092 (TCM-114, High), #125093 (TCM-115, Medium), #125094 (TCM-116, Low), #125095
  (TCM-117, High), #125096 (TCM-118, Medium), #125097 (TCM-119, Low — filed under `ztflux` even though its "Plugin
  name" is the separate `redmineflux-tcm-ci` CLI repo, not the Redmine plugin itself). `bugs/open/BUG-TCM-112.md`
  through `.../BUG-TCM-119.md` Production Redmine Issue ID fields filled in the same turn. **Every bug in
  `bugs/open/` that predates this session is now reported to production** (bugs opened later in this same session,
  if any, are tracked separately).
