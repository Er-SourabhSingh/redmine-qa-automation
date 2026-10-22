# BUG-TCM-083

- Bug ID: BUG-TCM-083
- Production Redmine Issue ID: #124202 (https://flux.zehntech.com/issues/124202) — assigned to Vaishnavi Bhawsar, priority Low, Defect Type Functional / Defect Severity Low-severity / Defect priority Low, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #124004 ("UI modernization (Waves 2-8) — security/mechanical regression floors hold") in Run #612, environment Win + Chrome + Ver6.
- Title: Import Wizard's Step 1 page title accumulates "Redmineflux Testcase - " once per suite-tree node — because the recursive suite-tree partial re-runs a page-title-mutating script on every render
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post-7.1.0, pre-7.2.0)
- Environment: Docker `localhost:3000` (`redmine6-redmine-1`), project `RFTC-016 CI Ingest QA` (id=2)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-10-21

## Summary

Found while regression-testing `rftc-011` Wave 8 (Import Wizard UI modernization). The Import Wizard's Step 1
page (`/projects/<id>/testcase_import/step1`) ends up with a page `<title>` of
`"Redmineflux Testcase - Redmineflux Testcase - Redmineflux Testcase - Redmineflux Testcase - Redmineflux
Testcase - <Project Name> - Redmine"` — the prefix repeated 5 times — instead of the single prefix every other
screen in the plugin correctly shows (e.g. `"Redmineflux Testcase - <Project Name> - Redmine"`).

## Steps to reproduce

1. Open any project with the Testcase Management module enabled and at least 2-3 test suites.
2. Navigate to **Test Cases** → **Import Testcases** (`/projects/<id>/testcase_import/step1`).
3. Look at the browser tab title / `document.title`.

## Expected result

The page title should show the standard single `"Redmineflux Testcase - "` prefix, same as every other screen in
the plugin.

## Actual result

The prefix is repeated once per suite-tree node rendered on the page (confirmed 5 times against a project with 3
top-level suites and no nested children). Confirmed via direct DOM inspection:

```js
document.title
// "Redmineflux Testcase - Redmineflux Testcase - Redmineflux Testcase - Redmineflux Testcase - Redmineflux Testcase - RFTC-016 CI Ingest QA - Redmine"

document.querySelectorAll('script')  // filtered to ones containing 'document.title'
// 5 matches, each containing the identical line:
// document.title = "Redmineflux Testcase - " + document.title;
```

Reproducible on a fresh page load (not a session-accumulation artifact — confirmed by reloading the page and
seeing the same 5x-repeated title each time).

## Root cause (confirmed via source read inside the container)

`app/views/testcase_import/step1.html.erb:118` sets the page title via an inline script:
```erb
document.title = "<%= l(:label_testcase_page_title) %> - " + document.title;
```

The same screen also renders the suite-picker tree via a **recursive partial**,
`app/views/testcase_import/_suite_tree.html.erb`, which calls itself once per child suite
(`_suite_tree.html.erb:27`, `render partial: 'suite_tree', locals: { suite: child_suite }`). That partial
carries its **own copy of the identical title-mutating script** at its own line 35:
```erb
document.title = "<%= l(:label_testcase_page_title) %> - " + document.title;
```

Since `document.title = "X - " + document.title` is applied cumulatively (not set to a fixed value), every
single render of `_suite_tree.html.erb` — once per top-level suite in the loop at `step1.html.erb:63`, plus once
more for each recursive child-suite call — re-prepends the prefix on top of whatever it already was. With 3
top-level suites (no children), this produces the title-mutation script 4 times from the partial plus
`step1.html.erb`'s own copy = the 5 occurrences confirmed in the DOM.

This is a classic "page-title side effect baked into a partial that gets rendered N times" bug — the script
belongs in the page shell (rendered exactly once), not in a partial that is deliberately designed to recurse.

## Suggested fix

Remove the `document.title = ...` line from `_suite_tree.html.erb` entirely (it should never have been there —
a suite-tree *node* partial has no business mutating the page title) and keep only the single copy already
present in `step1.html.erb`. Given the same recursive partial is also used elsewhere in the plugin (confirmed via
`grep` — `test_suites/index.html.erb`'s own suite tree does not show this bug, suggesting it renders the tree via
a different mechanism, e.g. client-side/AJAX, rather than this same server-rendered recursive partial — worth
confirming during the fix whether `_suite_tree.html.erb` is shared between both screens or if there are two
separate near-identical partials).

## Evidence

Live DOM confirmation (repeatable): `document.title` and a `document.querySelectorAll('script')` filter both
confirm 5 identical copies of the title-mutating line, reproduced on two independent fresh page loads.

Code references:
- `app/views/testcase_import/step1.html.erb:63` — the loop that calls `_suite_tree` once per top-level suite
- `app/views/testcase_import/step1.html.erb:118` — this screen's own (correct, singular) title-mutation line
- `app/views/testcase_import/_suite_tree.html.erb:27` — the recursive self-render call
- `app/views/testcase_import/_suite_tree.html.erb:35` — the duplicate title-mutation line that should be removed

## Test case coverage

Found 2026-10-21 while regression-testing `rftc-011` Wave 8 (Import Wizard) as part of this session's full
final-cycle regression (triggered by `bugs/open/` becoming empty — CLAUDE.md §27). Not yet mapped to an
automation TC; should be added once this is fixed.

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers a page-title accumulation defect
  anywhere in this plugin. Not a duplicate of any locale/translation-missing bug (BUG-TCM-067/082) — this is a
  client-side string-concatenation bug, not a missing locale key (the key `label_testcase_page_title` itself
  resolves correctly each time; the bug is that it resolves *repeatedly*).

## Production report

Reported 2026-10-21 as issue #124202 on `ztflux`, via `redmineflux_core_create_issue`, per explicit user approval.
Linked to production Testcase #124004 in Run #612 via `report_defect`.

## Retest — 2026-10-22 (FIXED)

Restarted `redmine6-redmine-1`/`redmine6-sidekiq-1` after the user pulled updated plugin code. Confirmed via
`git log` the dev's fix commit `6d0055e` ("Fix import wizard page title repeating itself") is present — it
removes the duplicate `document.title = ...` line from `_suite_tree.html.erb:35`, keeping only the single copy
in `step1.html.erb`, exactly as suggested.

Live-verified via Playwright against `http://localhost:3000/projects/rftc-016-ci-qa/testcase_import/step1`:
`document.title` now reads `"Redmineflux Testcase - RFTC-016 CI Ingest QA - Redmine"` — a single prefix, no
duplication. **CONFIRMED FIXED.**
