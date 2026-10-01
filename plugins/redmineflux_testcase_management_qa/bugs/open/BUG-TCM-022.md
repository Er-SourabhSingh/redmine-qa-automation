# BUG-TCM-022

- Bug ID: BUG-TCM-022
- Production Redmine Issue ID: #121843
- Title: Every "New Test Case" created via the plugin's own creation form lands on the Bug tracker instead of the correctly-configured Test case tracker
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

Every single test case created this session via `/projects/test-project/issue_testcase/new` — regardless of
which fields were filled, what suite it was assigned to, or whether the Category field was ever touched — lands
on the **Bug** tracker, not the configured **Test case** tracker. Confirmed via the Redmine issues list
(`/projects/test-project/issues?sort=id:desc`): every issue from **#1587 through #1593** (7 consecutive new test
cases created across this session) shows tracker **Bug**. A pre-existing test case from an earlier session
(**#434**) correctly shows tracker **Test case**, confirming this is not how the plugin behaved before and is not
a display-only quirk.

This happens despite:
- The plugin's own **Testcase Tracker** setting correctly reading "Test case" (re-verified live via
  Administration → Plugins → Redmineflux Testcase Management → Configuration, both before and after the
  affected creates).
- The **Test case** tracker (id 4) being confirmed enabled for this project (Administration → Projects →
  test-project → Settings → Trackers).

## Important correction to this session's own prior finding (BUG-TCM-019 retracted)

A bug was previously filed this session as **BUG-TCM-019**, claiming that *deleting* a test suite retrackers its
contained test cases from Test case to Bug. That filing's evidence relied on the suite's own "Testcase Summary"
grid (`/test_suites?testsuite_id=X`) to prove the issues were Test case tracker *before* deletion. **That grid
does not filter by tracker at all** — live-confirmed by finding that known Bug-tracker issues (#1590, #1591,
both created fresh via the New Test Case form with no suite ever deleted) still appear in their suite's grid
alongside Test-case-tracker issues. The grid simply lists issues by `testsuite_id` custom-field association,
regardless of tracker. This means BUG-TCM-019's two test cases (#1587, #1588) were very likely **already** on
the Bug tracker from the moment of creation — the same defect documented here — and the suite deletion had
nothing to do with it. **BUG-TCM-019 has been deleted/retracted** as a result; this bug (BUG-TCM-022) is the
real, underlying defect.

## Steps to reproduce

1. Confirm Testcase Tracker setting = "Test case" (Administration → Plugins → Redmineflux Testcase Management →
   Configuration).
2. **New Test Case** (`/projects/test-project/issue_testcase/new`). Fill Subject and any required custom fields
   (the submission will very likely fail once on the hidden Bug-only required fields per BUG-TCM-011 — fill
   those too on the retry).
3. Submit until it succeeds.
4. Open the created issue directly and read its tracker from the page title/heading.

## Expected result

- The created issue's tracker is **Test case**, matching the plugin's own configured setting.

## Actual result

- The created issue's tracker is **Bug**. Reproduced for every one of 7 consecutive creates this session
  (`/issues/1587` through `/issues/1593`), each showing "Bug #<id>: <subject>" instead of "Test case #<id>: ...".
- A pre-existing, older test case (`/issues/434`) correctly shows "Test case #434: ..." — confirms this is a
  currently-active defect, not something that has always been true of every issue on this tracker/project.
- Ruled out both obvious configuration explanations (global plugin setting, project tracker enablement) by
  re-checking both live and finding them correct.

## Root cause (inferred, no source access this session)

The New Test Case form (unlike a standard Redmine issue form) has **no `tracker_id` field anywhere in its HTML**
— confirmed via a full form-field enumeration. Combined with BUG-TCM-011's already-documented pattern (the
`create` action does not apply the same tracker resolution the `new`/GET action does before rendering), this
strongly suggests the `create` action falls back to `Tracker.first` (or similar) when no `tracker_id` is
submitted and its own resolution logic doesn't substitute the configured Testcase Tracker early enough — landing
every created issue on whatever tracker sorts/queries first (here, "Bug", tracker_id 1). Every creation this
session happened to go through at least one failed-then-retried submission (per BUG-TCM-011); whether a true
single-pass success would avoid this was not isolated given that precondition is effectively unavoidable on this
project's current custom-field configuration.

## Suggested fix

The `create` action for the Testcase form must resolve and persist the configured Testcase Tracker explicitly,
the same way `new` already does for rendering — not rely on an implicit/default tracker fallback. This is likely
the same underlying resolution gap documented in BUG-TCM-011, now shown to affect the actual `tracker_id` column,
not only custom-field validation.

## Evidence

### Console / log

```
/projects/test-project/issues?sort=id:desc (first 8 rows):
  1593 | Bug | New | Normal  | QA-TRACKER-CHECK-CLEAN
  1592 | Bug | New | High    | QA-TC-128-ALL-FIELDS
  1591 | Bug | New | Normal  | QA-TC-202-CHILD-CASE
  1590 | Bug | New | Normal  | QA-TC-202-PARENT-CASE
  1589 | Bug | New | Normal  | TC-TCM-114-baseline-no-requirement   (another session's fixture — same defect)
  1588 | Bug | New | Normal  | QA-TC-199-CASE-B
  1587 | Bug | New | Normal  | QA-TC-199-CASE-A

/issues/434 (pre-existing, older fixture): page title "Test case #434: Verify user can add item to wishlist"

Plugin config re-verified live: settings[tracker][] selected = "Test case" (unchanged, correct)
Project Trackers settings re-verified live: tracker id 4 ("Test case") checkbox checked = true

New Test Case form field enumeration: no <input>/<select> named or containing "tracker" anywhere in the form.
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_CASES.md` (TC-TCM-128 investigation) and retroactively
explains the evidence originally (incorrectly) attributed to the now-retracted BUG-TCM-019 in
`testcases/TESTCASE_MANAGEMENT_TEST_SUITES.md` TC-TCM-199.

## Update 2026-10-01 — scope extended: the tracker cannot be corrected afterward either

While setting up a cross-project fixture for `testcases/TESTCASE_MANAGEMENT_TODO.md` TC-TCM-209, attempted the
one standard-Redmine mechanism that normally lets an admin fix a wrong tracker after the fact: `/issues/bulk_edit`
on the affected issue (project `TCM Permissions Private Test`, issue #1596, itself freshly created via this same
defect). Selected Tracker = "Test case" in the bulk-edit form, clicked the real Submit button (confirmed via a
fresh page snapshot locating the actual submit control — an earlier generic `querySelector` click had silently
hit the live-preview AJAX endpoint `/issues/bulk_edit.js` instead and not the real update). After the genuine
submit, reloading `/issues/1596` still shows **"Bug #1596"**, unchanged. So this is worse than originally scoped:
it is not just that new test cases default to the wrong tracker at creation — **the tracker cannot be corrected
afterward via bulk edit either**, the one normal Redmine path for fixing exactly this kind of mistake. (The
single-issue `/issues/<id>/edit` form has no tracker field at all for these issues, consistent with the plugin
suppressing the standard tracker control entirely.) Not filed as a separate bug — same root cause, extends this
bug's impact rather than being a new defect.

## Duplicate check

- Duplicate found: No (as a distinct filed bug) — but see the correction note above: this supersedes/replaces
  the retracted BUG-TCM-019, and is closely related to BUG-TCM-011 (same GET/POST tracker-resolution asymmetry,
  now shown to also affect the actual tracker assignment, not only custom-field validation). Checked
  `bugs/_duplicates.md` — no separate existing entry.

## Production report

Reported to production `ztflux` as **#121843** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Critical (priority_id 4, Blocker);
Defect custom fields: Type=Functional, Severity=Critical, Priority=Urgent.
