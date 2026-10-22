# Bug Index — Redmineflux Testcase Management

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-TCM-007 | Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission check at all — any project member can create, edit or delete them regardless of role | Closed | High | 7.0.0 | #121645 | bugs/closed/BUG-TCM-007.md |
| BUG-TCM-008 | Run detail page crashes with an unhandled 500 error whenever the run's environment-assignee user has been deleted | Closed | Medium | 7.0.0 | #121698 | bugs/closed/BUG-TCM-008.md |
| BUG-TCM-009 | Almost the entire plugin has no project-membership check at all — any logged-in user can view test suites, requirements, reports, traceability, to-dos and runs for a private project they are not a member of | Closed | High | 7.0.0 | #121699 | bugs/closed/BUG-TCM-009.md |
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
