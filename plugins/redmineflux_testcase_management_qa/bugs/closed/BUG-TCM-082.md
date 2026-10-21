# BUG-TCM-082

- Bug ID: BUG-TCM-082
- Production Redmine Issue ID: #124178 (https://flux.zehntech.com/issues/124178) — assigned to Vaishnavi Bhawsar, priority Urgent, Defect Type Functional / Defect Severity Critical / Defect priority Urgent, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #124143 (Quality HQ) and #123951 (CI ingest authorization, same testcase as BUG-TCM-067) in Run #612, environment Win + Chrome + Ver6.
- Title: The BUG-TCM-079 fix commit silently deleted ~41 unrelated locale keys — Quality HQ, the Run Show suite-picker, the donut chart, and BUG-TCM-067's own fix all broke at once
- Severity: Critical
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (commit `ebeda18`, post-7.1.0, pre-7.2.0)
- Environment: Docker `localhost:3000` (`redmine6-redmine-1`), project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-10-21

## Summary

While retesting earlier bugs this session, the user spotted "Translation missing: en.label_quality_hq" and
several other raw i18n placeholders scattered across the Quality HQ dashboard and the Test Suite tree/Run Show
pages. Investigating the plugin's own git history (inside the `redmine6-redmine-1` container) found the exact
root cause: commit `ebeda18` ("Allow much longer step and expected-result text on test case steps" — the commit
that correctly fixed `BUG-TCM-079`'s CSV-import 2000→40000-char limit) was evidently authored against a **stale,
older checkout of `config/locales/en.yml`** that predated several already-shipped features. When that commit's
en.yml was saved, it silently reverted every locale key those later features had added — not as an intentional
revert, just as a side effect of committing a version of the file that was missing content newer than the base
the author was working from.

This is **not limited to BUG-TCM-067** (which is the one symptom this session happened to catch first) — it is a
single root cause that broke **five unrelated feature areas at once**, deleting a combined 41 locale lines:

1. **`error_execute_testcase_permission_required`** — the exact key `BUG-TCM-067`'s own fix (commit `78f4f0c`)
   had just added. Its removal is why that bug's retest found a "Translation missing" placeholder instead of
   either the old wrong message or the intended new one — the fix was never actually missing a key, it was
   fixed correctly and then un-fixed by this later, unrelated commit.
2. **The entire `rftc-044` Quality HQ feature's label set** — `label_quality_hq`, every `label_qhq_*`
   (projects_tracked, active_runs, overall_pass_rate, total_failing, overdue_runs, passed, failed, blocked,
   pass_rate, coverage, health, no_data, view_reports, most_failed, slow_tests, flaky, health_green/amber/red/none),
   every `text_qhq_*` (subtitle, no_projects, metric_unavailable, refreshing_row, refreshing), and
   `error_qhq_forbidden`. The entire Quality HQ dashboard page (global top-nav entry, previously confirmed
   4/4 PASS in this session's own 2026-10-19 regression) is now a wall of "Translation missing" text.
3. **Test Suite tree panel labels** — `label_test_suites`, `label_find_a_suite` (the suite-search input's
   placeholder), `label_collapse_test_suite_panel`.
4. **`rtc-019` Run Show suite-picker dropdown** — `label_to_run`, `label_suite_colon`, `label_all_suites`,
   `label_all_suites_in_run`, `label_n_more_defects`.
5. **`rtc-019` Run Show donut chart** — `chart_total_label`, `text_showing_testcases_prefix`,
   `text_showing_testcases`.

## Steps to reproduce

1. Open any project with the Testcase Management module enabled on `localhost:3000`.
2. Open the top navigation bar — the "Quality HQ" menu item itself reads "Translation missing: en.label_quality_hq".
3. Click it (or navigate directly to `/quality_hq`) — the entire dashboard page is "Translation missing" text
   for its title, subtitle, all 5 KPI tile labels, and all 3 chart-link labels.
4. Open any project's Test Suite tree (`/test_suites?project_id=<id>`) — the suite-search box's placeholder
   reads "Translation missing: en.label_find_a_suite".
5. Open any Run's show page (`/runs/<id>?project_id=<id>`) — the suite-picker dropdown shows "Translation
   missing: en.label_suite_colon Translation missing: en.label_all_suites".
6. Separately, as a non-admin user lacking `execute_testcase`, submit a result via the manual Add Result form or
   CI ingest — the denial message is "Translation missing: en.error_execute_testcase_permission_required" (this
   is `BUG-TCM-067`'s own symptom, now explained by this same root cause).

## Expected result

Every one of the 41 locale keys listed above should render its intended English text, matching the behavior
already confirmed working in this session's 2026-10-19 regression pass (Quality HQ 4/4 PASS) and in
`BUG-TCM-067`'s original fix commit.

## Actual result

All 41 keys render as raw Rails i18n "Translation missing: en.<key>" placeholders across 5 distinct screens,
confirmed live on `localhost:3000`:

- `/quality_hq` — confirmed via `browser_navigate`, page title itself is "Translation missing: en.label_quality_hq - Redmine".
- `/runs/5?project_id=rftc-016-ci-qa` — confirmed via DOM scan: `"Translation missing: en.label_suite_colon Translation missing: en.label_all_suites"`.
- `/test_suites?project_id=rftc-016-ci-qa` — confirmed via DOM scan of the search input's `placeholder` attribute: `"Translation missing: en.label_find_a_suite"`.
- The CI-ingest/Add-Result denial message (`BUG-TCM-067`'s own symptom) — confirmed via a direct, read-only
  `I18n.t(:error_execute_testcase_permission_required)` evaluation inside the container:
  `"Translation missing: en.error_execute_testcase_permission_required"`.

## Root cause (confirmed via git history inside the container)

Git log for `config/locales/en.yml` in the plugin's own repo (`/usr/src/redmine/plugins/redmineflux_testcase_management`):

```
78f4f0c  Fix 5 testcase plugin bugs: wrong permission message, CI ingest skip option, ...   <- adds error_execute_testcase_permission_required
ebeda18  Allow much longer step and expected-result text on test case steps                 <- BUG-TCM-079's fix, but SILENTLY REMOVES 41 unrelated keys
```

`git show ebeda18 -- config/locales/en.yml` shows the step/expected-length changes this commit actually intended
(correct — `error_step_max_length`/`error_expected_max_length`/`error_result_max_length` 2000→40000) **alongside**
41 unrelated `-` (deletion) lines removing the Quality HQ block, the suite-tree/Run-Show labels, and the
`BUG-TCM-067` fix key — none of which this commit's own message or intent has anything to do with. This is the
classic symptom of committing a file that was edited starting from an older base than the branch's actual tip
(a stale local checkout, or a merge/rebase that picked the wrong side of a conflict for this file), silently
clobbering everything added to that file since the stale base was taken.

Confirmed this is still the current state of the live container (not already re-fixed):
`git diff --ignore-all-space HEAD -- config/locales/en.yml` shows zero difference from the current commit, and
direct `grep` of the live file for any of these 41 key names returns zero matches.

## Suggested fix

Restore all 41 removed lines to `config/locales/en.yml` (and verify no other locale file — `de.yml`, `es.yml`,
etc. — suffered the same silent loss, as those translations may have had analogous recent additions too). Given
this is now the second time in one day a commit has silently dropped unrelated locale content, it's worth adding
a lightweight CI check that fails a PR if `config/locales/en.yml`'s key count decreases without that decrease
being explicitly called out in the PR description.

## Evidence

- `screenshots/BUG-TCM-082/quality-hq-translation-missing.png` — full Quality HQ dashboard page.
- `screenshots/BUG-TCM-082/run-show-suite-picker-translation-missing.png` — Run Show page's suite-picker dropdown.
- Full `git show ebeda18 -- config/locales/en.yml` diff available on request; the removed-lines excerpt is quoted
  in full under "Summary" above.

## Test case coverage

Found 2026-10-21 while investigating a user-reported screenshot during this session's broader bug-reopen/retest
pass. Not yet mapped to an automation TC — "no locale key regresses to Translation missing across a release" is
not currently covered in `testcases/`; worth adding a dedicated smoke-test TC that asserts zero "Translation
missing" strings appear across a fixed list of key pages, specifically to catch this class of regression early.

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — this is the root cause behind `BUG-TCM-067`'s "still
  broken, in a new form" retest finding from earlier this session, but is filed as its own bug rather than
  folded into 067 because its actual blast radius (Quality HQ, Run Show, Test Suite tree) is far wider than
  067's single denial-message symptom, and the two have genuinely different fixes (067 would only need its one
  key restored; this bug covers all 41).

## Retest — 2026-10-21 (FIXED)

Though this bug's production status was never moved out of New/0% (only its sibling BUG-TCM-067, which shares
the same root cause, was marked In QA), it was retested anyway after the developer's general fix pull and
`localhost:3000` restart, since the fix for 067 was expected to restore the same 41 locale keys together.

- `/quality_hq` — page title is now "Quality HQ - Redmine" (was "Translation missing: en.label_quality_hq -
  Redmine"); zero "Translation missing" strings found anywhere via `document.body.innerText` scan.
- `/runs/5?project_id=rftc-016-ci-qa` — zero "Translation missing" strings found via the same scan (previously
  showed `label_suite_colon`/`label_all_suites` placeholders).
- `/test_suites?project_id=rftc-016-ci-qa` — the suite-search input's placeholder is no longer "Translation
  missing: en.label_find_a_suite"; it now reads "Search" (a simplified label, but not a broken placeholder).
- Direct grep confirmation: a combined pattern for the key families (`label_quality_hq`, `label_qhq_*`,
  `label_find_a_suite`, `label_all_suites_in_run`, `label_to_run`, `label_suite_colon`, `chart_total_label`) now
  returns 26 matches in the live `en.yml` (was 0).
- **Verdict: FIXED.** Moving this bug to `bugs/closed/`.

## Production report

Reported 2026-10-21 as issue #124178 on `ztflux`, via `redmineflux_core_create_issue`, per explicit user approval.
Linked to production Testcase #124143 (Quality HQ) and #123951 (CI ingest authorization, same testcase as
BUG-TCM-067) in Run #612 via `report_defect`.
