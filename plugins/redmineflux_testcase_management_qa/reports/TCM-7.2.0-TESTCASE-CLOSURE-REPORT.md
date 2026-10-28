# Redmineflux Testcase Management — Plugin Release 7.2.0 — Testcase Closure Report

> Consolidated closure/sign-off report for **Release 7.2.0 only**. Scope is production-verified: every item below
> is confirmed against production `ztflux`'s own **Target Version = "Testcase Management plugin Release 7.2.0"**
> (id=2067), not inferred from local file dates or "plugin version" notes. Bugs found during earlier releases
> (7.0.0, 7.1.0) are out of scope for this report even though they are also Closed — see `bugs/_index.md` for the
> plugin's full historical list (120 bugs across all releases).

## 1. Overall Status

| | |
|---|---|
| Plugin | Redmineflux Testcase Management |
| Release | 7.2.0 (production Target Version id=2067, due 2026-10-21, currently **open**) |
| Bugs tagged to this release in production | **54**, all **Done** |
| Features/Tasks tagged to this release in production | **9** (the RFTC-* specs) |
| ⚠️ Feature/Task production status | **All 9 still "In QA"** — QA-complete, results ready to post, none marked "Done" yet (see §3) |
| Internal QA suite status (`STATUS.md`) | Complete — full 22-area Traceability Matrix regression passed 2026-10-28 |

## 2. Internal Suite Regression (22 Traceability Matrix areas) — summary

This plugin's entire `TC-TCM-NNN` suite (all 22 Traceability Matrix areas) was regressed against the 7.2.0 build,
completing 2026-10-28. Full detail: `docs/TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md` and
`reports/TCM-Regression-2026-10-28.md`. All 22 areas: **Covered**, zero requirement/feature with zero TC coverage.

## 3. Features/Tasks tagged to Release 7.2.0 in production — results, ready to post before marking Done

QA execution is complete for all 9; the result below is what should be posted as a comment on each production
issue (per `REDMINEFLUX-MCP-SETUP.md`'s write-approval process) before its status moves In QA → Done.

| Issue | Feature | Result | Bugs found (this feature) |
|---|---|---|---|
| #121879 | rftc-011 — TCM UI modernization (Wave 0) | **15/16 PASS**, 1 confirmed fixed, zero new bugs | — |
| #121880 | rftc-016 — CI results ingest (JUnit → executions + auto-defect) | **41/43 PASS**, 2 confirmed fixed, 1 finding reversed, zero new bugs | — |
| #121881 | rftc-017 — Ship the CI results CLI | **42/42 PASS** (shipped pytest suite) + **14/14 PASS** (manual live-server CLI checks) | BUG-TCM-065 (fixed) |
| #121882 | rftc-020 — Per-test duration + slow-test detection | **16/17 PASS**, 1 cross-referenced to an already-tracked plugin-wide bug (BUG-TCM-114), zero new bugs this pass | BUG-TCM-068 (fixed) |
| #121883 | rftc-021 — Most-failed-tests metric | **8/10 PASS**, 2 bugs found — both confirmed fixed | BUG-TCM-070 (High), BUG-TCM-071 (High) — both fixed |
| #121884 | rftc-038 — CI platform recipes (GitHub/GitLab/CircleCI/Bitbucket/Jenkins) | **24/24 PASS** (genuinely re-driven live, incl. a real end-to-end Jenkins run), zero new bugs | BUG-TCM-066 (fixed) |
| #121885 | rftc-042 — TCM Testing Harness (CLI/API/browser/load/chaos) | Harness operational end-to-end (real `harness/run.py` run completed): **api 9/9 PASS**, **security 7/8 PASS** (upgraded from 5/8 once all personas resolved), **cli 2/5 PASS** (3 known, non-blocking failures, same root cause each re-run) | — (no plugin bugs; CLI-module gaps are in the companion harness repo, not the plugin) |
| #121886 | rftc-043 — Static/dynamic security + discovery testing | Brakeman clean, bundler-audit CVE count reduced via a Rails version bump, harness fuzz/property tests **17/18 PASS** (1 known brittle assertion, cross-referenced to rftc-042) | — |
| #121887 | rftc-044 — Quality HQ: org-wide QA command center | **PASS**, re-verified correct against real, much larger live data (6 projects, 127 active runs, 60% overall pass rate) | — |

**Net: all 9 features are QA-complete with zero outstanding plugin-side bugs** (every bug any of them surfaced is
already in §4's closed-54 list). Full detail per feature: `testcases/RFTC-*_EXTERNAL_SPEC_*.md`
(dedicated results files exist for two: `reports/RFTC-008_EXTERNAL_SPEC_RESULTS.md` and
`RFTC-009_EXTERNAL_SPEC_RESULTS.md`).

**Production still shows all 9 as "In QA", not "Done."** Recommended next step: post the result row above as a
comment on each of the 9 issues, then update status In QA → Done and done-ratio → 100 — this is a production
write and needs explicit approval first (same as any other production change, `REDMINEFLUX-MCP-SETUP.md` §4).

## 4. Bugs found during Release 7.2.0's testing/regression — production-verified (54 total, all Done)

Source: production `ztflux`, Target Version id=2067 filter, Tracker=Bug. All 54 show **Done** status in production.

| Bug ID | Title (abridged) | Severity | Production Issue |
|---|---|---|---|
| BUG-TCM-009 | Almost the entire plugin has no project-membership check at all | High | #121699 |
| BUG-TCM-013 | Adding a single test result sends the notification email twice | Medium | #121703 |
| BUG-TCM-064 | Deleting a user who authored/updated a Testcase Report crashes with 500 | Medium | #123501 |
| BUG-TCM-065 | redmineflux-tcm-ci: documented `python -m client` shim is unimportable | Low | #123559 |
| BUG-TCM-066 | GitHub Actions recipes install the CLI via unpinned `pip install .` | Medium | #123563 |
| BUG-TCM-067 | CI ingest/Add Result deny with the wrong permission message | Low | #123955 |
| BUG-TCM-068 | Slow Tests report's Excel export is completely empty | High | #123979 |
| BUG-TCM-069 | CI ingest's `on_unmatched: "skip"` is accepted but never implemented | Medium | #123980 |
| BUG-TCM-070 | Most Failed Tests bar chart executes injected HTML/script (stored XSS) | High | #123985 |
| BUG-TCM-071 | Most Failed Tests Excel export doesn't recognize the report type | High | #123986 |
| BUG-TCM-072 | Requirements issue-mention dropdown executes injected HTML/script (XSS) | High | #124008 |
| BUG-TCM-073 | Test-Suite tree's search button not keyboard-reachable | Low | #124009 |
| BUG-TCM-075 | PDF export of Testcase Reports drops the Run Name/Environment heading | Medium | #124054 |
| BUG-TCM-076 | PDF export of Slow Tests/Most Failed Tests omits the bar chart | Medium | #124110 |
| BUG-TCM-077 | Most Failed Tests emailed report always shows "No failing test cases" | Critical | #124108 |
| BUG-TCM-078 | Emailed report attachments leak the page's Download nav menu | Medium | #124109 |
| BUG-TCM-080 | Emailed PDF attachments contain raw HTML/CSS/JS as literal text | Critical | #124159 |
| BUG-TCM-081 | Most Failed Tests PDF export has a table-layout glitch | Low | #124160 |
| BUG-TCM-082 | BUG-TCM-079's fix commit silently deleted ~41 unrelated locale keys | Critical | #124178 |
| BUG-TCM-083 | Import Wizard's Step 1 title accumulates text once per suite-tree node | Low | #124202 |
| BUG-TCM-086 | `RunsController#get_testcases` has zero authorization (cross-project IDOR) | High | #124227 |
| BUG-TCM-089 | Requirements has no `view_requirement` permission; attachment download bypasses Requirements permissions | High | #124298 |
| BUG-TCM-090 | Add Testcase kebab menu ignores permission; Edit Folder broken for everyone | Medium-High | #124317 |
| BUG-TCM-091 | CSV import never validates `selected_suite_id` — cross-project suite-link leak | High | #124346 |
| BUG-TCM-092 | Test Suites page crashes with 500 on no `testsuite_id` | High | #124347 |
| BUG-TCM-093 | Stored XSS in the Requirements sidebar tree | Critical | #124348 |
| BUG-TCM-094 | `issue_status_results#new` has zero cross-project scoping (IDOR) | Medium | #124349 |
| BUG-TCM-095 | Bulk "Requirements" submenu never greys out for a user lacking `edit_requirement` | Low | #124386 |
| BUG-TCM-096 | `edit_issues` without `edit_requirement` can still add/remove Requirement links | High | #124387 |
| BUG-TCM-097 | A test case in two suites gets contradictory statuses in the same run | High | #124423 |
| BUG-TCM-098 | "All Suites in Run" never aggregates; dropdown badges ignore Environment | High | #124424 |
| BUG-TCM-099 | Escape key throws an uncaught TypeError from the onboarding-tour script | Low | #124714 |
| BUG-TCM-100 | Requirements Save/Close buttons both carry `alt="share-icon"` | Low | #124715 |
| BUG-TCM-101 | Switching Run/Environment dropdown throws a console TypeError | Low | #124716 |
| BUG-TCM-102 | A defect's "Test Run:" field never updates past the first-linked run | Medium | #124717 |
| BUG-TCM-103 | Run result filter can leak a different environment's status | Medium | #124718 |
| BUG-TCM-104 | First-ever execution misattributed to the Run's creator, not the executor | High | #124719 |
| BUG-TCM-105 | Defect Summary report loses a defect's link to a 2nd test case | High | #124772 |
| BUG-TCM-106 | Requirement Coverage Excel export returns "Unknown Report Type" | High | #124773 |
| BUG-TCM-107 | Slow Tests PDF export drops its entire body below the heading | Medium | #124774 |
| BUG-TCM-108 | Tester Scorecard crashes with 500 under "Include all test run" | High | #124775 |
| BUG-TCM-109 | Emailed Slow Tests/Most Failed Tests show "Report Type: Default Text" | Low | #124776 |
| BUG-TCM-110 | Cancelling a scheduled report always fails with a 404 | High | #124778 |
| BUG-TCM-111 | Scheduled reports / ReminderWorker never fire (Sidekiq poller crash) | Critical | #124779 |
| BUG-TCM-112 | Drag-copying a test case links the clone to both source and target suite | Medium | #125090 |
| BUG-TCM-113 | Milestone permissions enforced in code but never declared in `init.rb` | High | #125091 |
| BUG-TCM-114 | Server-side PDF export 500s with `NameError` on every call | High | #125092 |
| BUG-TCM-115 | `bulk_testcase_create` silently reports success with zero cases created | Medium | #125093 |
| BUG-TCM-116 | Deleting a test case on an active run leaves an orphaned execution row | Low | #125094 |
| BUG-TCM-117 | Plugin cannot install on Redmine 5.1 at all (Gemfile `mutant` gem) | High | #125095 |
| BUG-TCM-118 | CI bootstrap race-condition protection is incomplete | Medium | #125096 |
| BUG-TCM-119 | `redmineflux-tcm-ci submit` crashes with a raw unhandled TypeError | Low | #125097 |
| BUG-TCM-123 | `RequirementsController#content` has zero cross-project scoping (IDOR) | High | #125461 |
| BUG-TCM-124 | Recording a result on "All Suites" view is broken two ways | Medium | #125531 |

**Severity breakdown (these 54 only):** Critical 5 · High 21 · Medium-High 1 · Medium 15 · Low 12

Full untruncated descriptions, steps-to-reproduce and retest evidence: `bugs/closed/BUG-TCM-<NNN>.md`.

## 5. Final Regression Closeout (2026-10-28)

The last regression pass before this closure report upgraded 6 bug closures from source-diff-only confirmation to
genuinely live-reproduced evidence (BUG-TCM-089 Finding 3, 091, 094, 101, 108, 110) and resolved the plugin's one
remaining tooling-blocked test case (TC-TCM-187, concurrent execution by two independently-authenticated users).
Zero new bugs found in this final pass. Full detail: `reports/TCM-Regression-2026-10-28.md`.

## 6. Sign-off

- [x] All 54 Release-7.2.0 bugs are Done in production
- [x] Internal `bugs/open/` empty (plugin-wide, including these 54)
- [x] Full final-cycle regression run and passed, 2026-10-28, all 22 Traceability Matrix areas
- [x] All 9 RFTC-* feature specs fully QA-tested
- [ ] **Open item: the 9 RFTC-* Feature/Task issues (#121879–#121887) are still "In QA" in production, not "Done"** — needs a production status update before Release 7.2.0 is fully closed on the Redmine side.

**QA testing for Release 7.2.0 is complete. One administrative item remains: moving the 9 feature/task issues from
"In QA" to "Done" in production — this is not a QA/testing gap, just a production status sync still pending.**

## Notes

- Redmine version tested against: 6.x (Docker `localhost:3000`, primary) + historical 5.1/7.0.0 disposable
  instances for compatibility checks; MySQL-backed instance (`redmine7mysql`, port 3002) separately verified clean
  on 2026-10-28 (plugin pull verified, Sidekiq added and confirmed healthy).
- Report date: 2026-10-28
- For the plugin's full bug history across all releases (120 bugs total, 7.0.0 through 7.2.0), see `bugs/_index.md`.
