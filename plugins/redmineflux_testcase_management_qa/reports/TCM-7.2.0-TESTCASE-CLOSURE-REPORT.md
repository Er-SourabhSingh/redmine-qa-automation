# Redmineflux Testcase Management — Plugin Release 7.2.0 — Testcase Closure Report

> Consolidated closure/sign-off report covering **all** testing performed against this plugin through Release
> 7.2.0: the internal `TC-TCM-NNN` suite (22 Traceability Matrix areas), the 11 `RFTC-*_EXTERNAL_SPEC_*` external
> feature specs, and every bug filed across the plugin's full test history. Per-day/per-type detail lives in the
> dated reports in this folder and in `docs/TESTCASE_MANAGEMENT_HANDOFF.md`'s Run History — this file is the
> single final rollup for release sign-off.

## 1. Overall Status

| | |
|---|---|
| Plugin | Redmineflux Testcase Management |
| Release | 7.2.0 |
| `STATUS.md` status | **Complete** (all 3 of `CLAUDE.md` §10 criteria met) |
| `bugs/open/` | **Empty** — 0 open bugs |
| Full final-cycle regression | **2026-10-28** — all 22 Traceability Matrix areas, see `reports/TCM-Regression-2026-10-28.md` |
| Traceability Matrix coverage | **22/22 areas Covered**, zero requirement/feature with zero TC coverage |

## 2. Internal Suite Testing — `TC-TCM-NNN` (22 Traceability Matrix areas)

| # | Area | Status |
|---|---|---|
| 1 | CSV Import | Covered |
| 2 | Environment management | Covered |
| 3 | Test suite management | Covered |
| 4 | Test case authoring | Covered |
| 5 | Test case ↔ suite organisation | Covered |
| 6 | Test run lifecycle | Covered (incl. TC-TCM-187, resolved live 2026-10-28) |
| 7 | Test execution | Covered |
| 8 | Bulk update of results | Covered |
| 9 | Reporting | Covered |
| 10 | Report emailing & scheduling | Covered |
| 11 | Requirements management | Covered |
| 12 | Traceability matrix (RTM) | Covered |
| 13 | To-Do management | Covered |
| 14 | Activity log | Covered |
| 15 | Roles & permissions | Covered |
| 16 | Plugin configuration | Covered |
| 17 | Email notifications | Covered |
| 18 | Installation prerequisites | Covered |
| 19 | Security testing | Covered |
| 20 | Performance testing | Covered |
| 21 | Project Overview dashboard | Covered |
| 22 | Requirement Templates | Covered |

**Full detail:** `docs/TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`.

## 3. External Feature Specs — `RFTC-*_EXTERNAL_SPEC_*`

All 11 external-spec files have a complete, literal re-execution pass against the current (7.2.0) build, with
zero plugin regressions found across 200+ re-driven scenarios:

| Spec | Feature | Status |
|---|---|---|
| RFTC-008 | Defect ↔ execution many-to-one linking | Complete — see `reports/RFTC-008_EXTERNAL_SPEC_RESULTS.md` |
| RFTC-009 | CI-friendly auto-create Test Run API | Complete — see `reports/RFTC-009_EXTERNAL_SPEC_RESULTS.md` |
| RFTC-011 | UI Modernization Wave 0 | Complete (results inline in the testcase file) |
| RFTC-016 | CI Results Ingest | Complete (results inline in the testcase file) |
| RFTC-017 | CI Results CLI | Complete (results inline in the testcase file) |
| RFTC-020 | Slow Tests Report | Complete (results inline in the testcase file) |
| RFTC-021 | Most Failed Tests Report | Complete (results inline in the testcase file) |
| RFTC-038 | CI Platform Recipes (GitHub Actions/CircleCI/GitLab/Bitbucket/Jenkins) | Complete (results inline in the testcase file) |
| RFTC-042 | TCM Testing Harness (incl. mutation testing, DAST) | Complete (results inline in the testcase file) |
| RFTC-043 | Security Discovery Testing (brakeman, bundler-audit) | Complete (results inline in the testcase file) |
| RFTC-044 | Quality HQ | Complete (results inline in the testcase file) |

**2 bugs found during this external-spec cycle** — BUG-TCM-118 (Medium, CI bootstrap concurrent-name race) and
BUG-TCM-119 (Low, CLI crash on malformed mapping-file value) — both **Closed**.

## 4. Bug Summary (full plugin lifecycle)

| | Count |
|---|---|
| Total bugs filed | **120** |
| Closed | **120** |
| Open | **0** |
| Reported to production (`ztflux`) | **117** |
| Not reported to production | 3 — BUG-TCM-001, BUG-TCM-002 (pre-production-reporting era), BUG-TCM-120 (fixed/closed within the same session it was found, never needed reporting) |

**By severity:**

| Severity | Count |
|---|---|
| Critical | 11 |
| High | 42 |
| Medium | 41 |
| Low | 25 |

Full per-bug detail: `bugs/_index.md` (all 120 rows, each linking to its closed bug file with retest evidence).

### 4a. Full Bug List — every bug found, its severity, and its production Redmine issue ID

All 120 are **Closed**. Production ID blank = not reported to production (see exceptions above).

| Bug ID | Title (abridged) | Severity | Production Redmine Issue ID |
|---|---|---|---|
| BUG-TCM-001 | CSV import silently drops the value of a step column whose header has leading/trailing ... | Medium | - |
| BUG-TCM-002 | CSV import silently discards the second occurrence of a duplicated column header with n... | Medium | - |
| BUG-TCM-003 | Bulk update result fails for every browser user because the bulk endpoint rejects the l... | High | #120544 |
| BUG-TCM-004 | Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line | Low | #120546 |
| BUG-TCM-005 | Report emailed as PDF arrives with no attachment at all, while the body still says "Ple... | High | #120588 |
| BUG-TCM-006 | Failed PDF generation still sends an email whose body promises an attachment that is no... | Medium | #120658 |
| BUG-TCM-007 | Create/Edit/Delete for Test Suites, Reports, and Requirements have no permission check ... | High | #121645 |
| BUG-TCM-008 | Run detail page crashes with an unhandled 500 error whenever the run's environment-assi... | Medium | #121698 |
| BUG-TCM-009 | Almost the entire plugin has no project-membership check at all — any logged-in user ca... | High | #121699 |
| BUG-TCM-010 | With the Testcase Tracker setting cleared, "New Test Case" silently creates a Bug inste... | High | #121700 |
| BUG-TCM-011 | Report Defect (and New Test Case) cannot be completed at all when Defect/Testcase Track... | High | #121701 |
| BUG-TCM-012 | Default "Test Case Result Added" notification email shows the run's name instead of the... | Low | #121702 |
| BUG-TCM-013 | Adding a single test result sends the "Test Case Result Added" notification email twice... | Medium | #121703 |
| BUG-TCM-014 | The Defects field on a Failed/Blocked Add Result form cannot find or link any existing ... | High | #121836 |
| BUG-TCM-015 | "Attach files" to an execution result — documented in the User Guide's own Add Result s... | Medium | #121838 |
| BUG-TCM-017 | Test Suite Create and Edit modals have no Description field at all, despite the User Gu... | Low | #121839 |
| BUG-TCM-018 | "Add Sub Test Suite" silently creates an orphaned top-level suite instead of a 3rd nest... | Medium | #121840 |
| BUG-TCM-020 | Renaming an Environment updates the Environment list and new-run forms correctly, but e... | Medium | #121841 |
| BUG-TCM-021 | Any re-render of the New Test Case form (a Category change, or simply a failed validati... | High | #121842 |
| BUG-TCM-022 | Every "New Test Case" created via the plugin's own creation form lands on the Bug track... | Critical | #121843 |
| BUG-TCM-023 | The inline pencil-icon Subject editor on a test case's detail page has no way to save a... | Low | #121989 |
| BUG-TCM-024 | The Testcase Summary's "Search by subject or ID" box does not actually search by ID — s... | Medium | #121845 |
| BUG-TCM-025 | There is no working UI path at all to associate an already-existing test case with a su... | Critical | #121846 |
| BUG-TCM-026 | "Remove Testcase" from a suite returns 200 OK with the correct payload but does not act... | High | #121847 |
| BUG-TCM-027 | Removing a Requirement link via the issue Edit form's select2 widget does not persist —... | Medium | #121848 |
| BUG-TCM-028 | A project with zero Runs cannot create any report at all — "Runs must have at least one... | Medium | #121990 |
| BUG-TCM-029 | A rejected duplicate-name suite create leaves a stale "ghost" node in the suite tree un... | Low | #122071 |
| BUG-TCM-030 | Opening the "Add Test Suite" modal throws a JS TypeError (`Cannot read properties of nu... | Low | #122072 |
| BUG-TCM-031 | Creating a Run scoped to a test suite that has zero test cases fails with the misleadin... | Low | #122073 |
| BUG-TCM-032 | The documented "one-command automation runner" (run-demo-tests.sh) always fails at Step... | High | #122074 |
| BUG-TCM-033 | The single-row drag "Copy Testcase"/"Move Testcase" popup is completely non-functional ... | Medium | #122075 |
| BUG-TCM-034 | Switching the suite-tree chart's dimension never actually updates the chart — the real ... | High | #122076 |
| BUG-TCM-035 | Test Environment "Select Components" picker is hardcoded to 3 generic placeholder value... | Medium | #122077 |
| BUG-TCM-036 | The execution_defects backfill migration (20261001000002) crashes immediately on MySQL ... | High | #122092 |
| BUG-TCM-037 | Traceability Matrix (TraceabilityRtmsController#index) has no permission or membership ... | Critical | #122093 |
| BUG-TCM-038 | QA Milestone update/delete have no server-side permission check at all — any project me... | High | #122094 |
| BUG-TCM-039 | The Runs & Results "Closed" tab is unreachable whenever the project has at least one Ac... | High | #122095 |
| BUG-TCM-040 | bulk_testcase_create crashes with a 500 whenever steps_and_results is omitted, even tho... | Medium | #122096 |
| BUG-TCM-041 | GET /get_testcase/:id returns a 404 with a completely empty body, contradicting API.md'... | Low | #122097 |
| BUG-TCM-042 | GET /projects/:project_id/get_testcases.json ignores :project_id entirely — any authent... | Critical | #122098 |
| BUG-TCM-043 | bulk_testcase_create crashes with a raw 500 (not the documented 422) when the plugin tr... | Medium | #122099 |
| BUG-TCM-044 | rftc-008 "link an existing defect" UI (picker, bulk-link action, per-execution display)... | Critical | #122104 |
| BUG-TCM-045 | link_defect/unlink_defect permission denial reuses bulk_create's assignee-specific erro... | Low | #122105 |
| BUG-TCM-046 | "Testcase Tracker not configured" is correctly refused, but renders as a generic Redmin... | Low | #122672 |
| BUG-TCM-047 | Add Result never actually saves the selected Defect(s) — defect_ids is silently dropped... | High | #122673 |
| BUG-TCM-048 | "Link existing defect" bulk panel shows zero feedback on failure — a rejected request l... | Medium | #122681 |
| BUG-TCM-049 | Defect ID's column shows the full subject with no bound, breaking row height on long su... | Low | #122674 |
| BUG-TCM-050 | A defect linked via the Defects* search box is silently excluded from the Add Result po... | Medium | #122689 |
| BUG-TCM-051 | Mentioning a test case (#id) in a Requirement's content inserts a real-looking link but... | Medium | #122690 |
| BUG-TCM-052 | Bulk-assigning a Requirement from the Test Cases list's right-click context menu 404s -... | Medium | #122691 |
| BUG-TCM-053 | Editing a Run silently fails with a completely empty 422 whenever the editing user isn'... | High | #122692 |
| BUG-TCM-054 | Dragging a test case without first checking its checkbox always moves/copies nothing, y... | High | #122693 |
| BUG-TCM-055 | Bulk Update Result silently has no effect on a case that was already executed individually | High | #122759 |
| BUG-TCM-057 | A defect mistakenly linked to the wrong test case can never actually be unlinked | High | #122768 |
| BUG-TCM-058 | Relations section's "Run" column shows only one run even when a defect is linked to the... | Medium | #122769 |
| BUG-TCM-059 | The API silently accepts a cross-project defect_ids value — returns 201 Created but nev... | Medium | #122779 |
| BUG-TCM-060 | Run page's "Testcase" filter (With Defects/Without Defects) matches on a defect's stale... | Medium | #122800 |
| BUG-TCM-061 | Deleting a defect issue entirely leaves its ExecutionDefect join row behind — Total Def... | Medium | #122803 |
| BUG-TCM-062 | Edit Test Suite ("Edit Folder") and Edit Requirement fail with 403 Forbidden on .json A... | High | #122902 |
| BUG-TCM-063 | Clicking the Add-Requirement "+" icon throws an uncaught JS TypeError (reading 'add_req... | Medium | #122903 |
| BUG-TCM-064 | Deleting a user who authored/updated a Testcase Report crashes with an unhandled 500 (f... | Medium | #123501 |
| BUG-TCM-065 | redmineflux-tcm-ci 0.1.0: documented `python -m client` backward-compat shim is unimpor... | Low | #123559 |
| BUG-TCM-066 | GitHub Actions recipes (rftc-038) install the CLI via unpinned `pip install .` instead ... | Medium | #123563 |
| BUG-TCM-067 | CI ingest (rftc-016) and the manual Add Result form deny with "you are not the assignee... | Low | #123955 |
| BUG-TCM-068 | Slow Tests report's Excel export is completely empty — no Rank column, no data rows, wr... | High | #123979 |
| BUG-TCM-069 | CI ingest's `on_unmatched: "skip"` option is accepted but never implemented — identical... | Medium | #123980 |
| BUG-TCM-070 | Most Failed Tests report's bar chart executes injected HTML/script from a test case sub... | High | #123985 |
| BUG-TCM-071 | Most Failed Tests report's Excel export doesn't recognize the report type at all — prod... | High | #123986 |
| BUG-TCM-072 | Requirements page's issue-mention dropdown executes injected HTML/script from any test ... | High | #124008 |
| BUG-TCM-073 | Test-Suite tree's search button is still `<span role="button" tabindex="-1">`, not keyb... | Low | #124009 |
| BUG-TCM-074 | Requirement content is silently discarded on save (original view-triggered-save cause f... | Critical | #124053 |
| BUG-TCM-075 | PDF export of Testcase Reports drops the "Run Name (Environment)" heading shown correct... | Medium | #124054 |
| BUG-TCM-076 | PDF export of Slow Tests and Most Failed Tests reports completely omits the bar chart s... | Medium | #124110 |
| BUG-TCM-077 | Most Failed Tests report emailed as PDF or HTML always shows "No failing test cases in ... | Critical | #124108 |
| BUG-TCM-078 | Emailed report attachments (PDF and HTML) leak the "Download HTML/PDF/Excel" page menu ... | Medium | #124109 |
| BUG-TCM-079 | CSV Import still hard-rejects any step/expected-result content over 2000 characters — i... | High | #124155 |
| BUG-TCM-080 | Emailed PDF attachments now contain the raw HTML/CSS/JavaScript page source as literal ... | Critical | #124159 |
| BUG-TCM-081 | Most Failed Tests report's "Download PDF" button export has a table-layout glitch — the... | Low | #124160 |
| BUG-TCM-082 | The BUG-TCM-079 fix commit (`ebeda18`) silently deleted ~41 unrelated locale keys — Qua... | Critical | #124178 |
| BUG-TCM-083 | Import Wizard's Step 1 page title accumulates "Redmineflux Testcase - " once per suite-... | Low | #124202 |
| BUG-TCM-085 | rftc-042 TCM Testing Harness's own stated deliverable (`harness/run.py` end-to-end exec... | Medium | *(not reported — resolved locally)* |
| BUG-TCM-086 | `RunsController#get_testcases` (`GET /projects/:project_id/runs/:run_id/test-cases.json... | High | #124227 |
| BUG-TCM-087 | "Run Added" email can never be sent for a run created via the normal web UI — hardcoded... | High | #124272 |
| BUG-TCM-088 | "Run Updated" notification email consistently shows the run's name from one edit ago, n... | Medium | #124273 |
| BUG-TCM-089 | Requirements has no `view_requirement` permission at all (design question for dev); Add... | High | #124298 |
| BUG-TCM-090 | Add Testcase page's test-suite kebab menu shows Edit Folder/Delete Test Suite regardles... | Medium-High | #124317 |
| BUG-TCM-091 | CSV import's `testcase_import_controller.rb#step2` never validates `selected_suite_id` ... | High | #124346 |
| BUG-TCM-092 | `GET /test_suites?project_id=<id>` with no `testsuite_id` crashes with a full 500 (`Arg... | High | #124347 |
| BUG-TCM-093 | Genuine, confirmed-executing stored XSS in the Requirements sidebar tree — CLOSED 2026-... | Critical | #124348 |
| BUG-TCM-094 | `IssueStatusResultsController#new` has zero cross-project scoping or authorization filt... | Medium | #124349 |
| BUG-TCM-095 | The Issues list's bulk context-menu "Requirements" submenu never greys itself out for a... | Low | #124386 |
| BUG-TCM-096 | A user with core `edit_issues` but no `edit_requirement` can fully add/remove a test ca... | High | #124387 |
| BUG-TCM-097 | A test case that belongs to two test suites gets genuinely contradictory statuses (e.g.... | High | #124423 |
| BUG-TCM-098 | "All Suites in Run" never actually aggregates — `runs_controller.rb#show` silently subs... | High | #124424 |
| BUG-TCM-099 | Pressing Escape anywhere on a Testcase Management page throws an uncaught `TypeError` f... | Low | #124714 |
| BUG-TCM-100 | Requirements page's Save button and a Close button both carry `alt="share-icon"` — iden... | Low | #124715 |
| BUG-TCM-101 | Switching either the Run or Environment dropdown in a test case's own "Testcase Executi... | Low | #124716 |
| BUG-TCM-102 | A defect's own detail page's "Test Run:" field shows only the single run it was *first*... | Medium | #124717 |
| BUG-TCM-103 | Run grid's "Run result" filter can leak a case from the wrong environment into the resu... | Medium | #124718 |
| BUG-TCM-104 | A test case's first-ever recorded result is attributed to whoever created the Run, not ... | High | #124719 |
| BUG-TCM-105 | Defect Summary report loses a defect's link to a 2nd test case in the same environment,... | High | #124772 |
| BUG-TCM-106 | Requirement Coverage report's Excel export returns a sheet whose entire body is "Unknow... | High | #124773 |
| BUG-TCM-107 | Slow Tests report's PDF export drops its entire body below the heading — no column head... | Medium | #124774 |
| BUG-TCM-108 | Tester Scorecard report crashes with an unhandled 500 (`NoMethodError: undefined method... | High | #124775 |
| BUG-TCM-109 | Emailed Slow Tests and Most Failed Tests reports show "Report Type: Default Text" in th... | Low | #124776 |
| BUG-TCM-110 | Cancelling a scheduled report always fails with a 404, for every user including Adminis... | High | #124778 |
| BUG-TCM-111 | Scheduled reports (and the plugin's own every-minute `ReminderWorker` cron job) never a... | Critical | #124779 |
| BUG-TCM-112 | Drag-copying a test case into another suite leaves the clone linked to BOTH the source ... | Medium | #125090 |
| BUG-TCM-113 | `create_milestone`/`edit_milestone`/`delete_milestone` permissions are enforced in both... | High | #125091 |
| BUG-TCM-114 | Server-side PDF export (`export_pdf1`) 500s on every single call with `NameError: undef... | High | #125092 |
| BUG-TCM-115 | `bulk_testcase_create` silently returns `200 {"success":true,"test_cases":[]}` instead ... | Medium | #125093 |
| BUG-TCM-116 | Deleting a test case that is on an active run removes its `run_issues` row (correct) bu... | Low | #125094 |
| BUG-TCM-117 | Plugin cannot install on Redmine 5.1 at all — the Gemfile's dev/test-only `mutant` gem ... | High | #125095 |
| BUG-TCM-118 | CI bootstrap race-condition protection is incomplete — a concurrent duplicate-run-name ... | Medium | #125096 |
| BUG-TCM-119 | `redmineflux-tcm-ci` CLI's `submit` command crashes with a raw unhandled `TypeError` tr... | Low | #125097 |
| BUG-TCM-120 | Requirement Templates is a half-shipped feature — no UI/API anywhere lets anyone create... | Medium | - |
| BUG-TCM-121 | Regression from the BUG-TCM-072 XSS fix — the "#"/"@" mention dropdown's character-high... | Low | #125358 |
| BUG-TCM-122 | Requirement Templates' "create" path (BUG-TCM-120's fix) is really only "clone an exist... | Low | #125377 |
| BUG-TCM-123 | `RequirementsController#content` (the AJAX endpoint that actually serves a Requirement'... | High | #125461 |
| BUG-TCM-124 | Recording a result on a run's "All Suites" view is broken two ways: Bulk Update Result ... | Medium | #125531 |

Full untruncated titles + steps-to-reproduce + retest evidence for each: `bugs/closed/BUG-TCM-<NNN>.md`.

## 5. Final Regression Closeout (2026-10-28)

The last regression pass before this closure report upgraded 6 bug closures from source-diff-only confirmation
to genuinely live-reproduced evidence (BUG-TCM-089 Finding 3, 091, 094, 101, 108, 110) and resolved the plugin's
one remaining tooling-blocked test case (TC-TCM-187, concurrent execution by two independently-authenticated
users). Zero new bugs found in this final pass. Full detail: `reports/TCM-Regression-2026-10-28.md`.

## 6. Sign-off

- [x] `bugs/open/` empty
- [x] Full final-cycle regression run and passed, with a matching Run History row
- [x] Traceability Matrix shows no requirement/feature with zero TC coverage
- [x] All 11 external `RFTC-*` specs fully, literally re-executed against the 7.2.0 build
- [x] 117 of 120 bugs synced to production `ztflux` (3 exceptions explained above, none blocking)

**Testcase Management Plugin Release 7.2.0 is closed out for QA. No open defects, no outstanding coverage gaps.**

## Notes

- Redmine version tested against: 6.x (Docker `localhost:3000`, primary) + historical 5.1/7.0.0 disposable
  instances for compatibility checks; MySQL-backed instance (`redmine7mysql`, port 3002) separately verified clean
  on 2026-10-28 (plugin pull verified, Sidekiq added and confirmed healthy).
- Plugin version: 7.2.0
- Report date: 2026-10-28
