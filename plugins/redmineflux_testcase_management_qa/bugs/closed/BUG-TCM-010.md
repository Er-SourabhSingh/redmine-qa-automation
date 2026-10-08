# BUG-TCM-010

> **CLOSED — 2026-10-06.** Production #121700 (https://flux.zehntech.com/issues/121700) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-010
- Production Redmine Issue ID: #121700
- Title: With the Testcase Tracker setting cleared, "New Test Case" silently creates a Bug instead of failing with a configuration error — the issue is invisible to every Testcase Management view from then on
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-09-30

## Summary

Administration → Plugins → Redmineflux Testcase Management → Configuration has a **Select Tracker As Testcase**
setting that tells the plugin which Redmine tracker represents a "test case." With it cleared (blank), the
documented expectation (per this suite's own TC-TCM-001) is that creating a new test case should either fail with
a clear configuration message, or the feature should simply be unavailable — not a generic 500 and not a silent
wrong result.

**Actual behavior is worse than either of those options.** The `/projects/<id>/issue_testcase/new` form still
renders completely normally — full "Add Testcase" layout, every QA custom field, no warning of any kind — and
submitting it **succeeds**, redirecting back to the Test Suites list with no error. But the issue that gets
created is **not a test case at all**: it silently lands on the project's first tracker by list order (`Bug` in
this project), because the code's fallback-on-blank-setting logic resolves to "whatever tracker happens to be
first," not "refuse" or "ask." From that point on the new issue is permanently invisible to every plugin view
(Test Suites, Test Case grid, Reports, Traceability Matrix) since all of those filter `Issue.where(tracker_id: ...)`
against the (correctly-configured, in normal operation) Testcase Tracker setting — the data is not lost, but it is
silently misfiled and will never again be reachable through the Testcase Management UI.

This is a High-severity data-integrity defect on its own, and it is also the second time an assumption about this
setting has produced a wrong conclusion in this repo — the first was BUG-TCM-005's original (corrected) claim
that a missing prerequisite was "undeclared." A tester who clears this setting expecting a clean failure (as
TC-TCM-001 assumes) will instead create data that looks fine at creation time and quietly vanishes.

## Steps to reproduce

1. As Admin, go to Administration → Plugins → Redmineflux Testcase Management → Configuration.
2. Clear **Select Tracker As Testcase** (select the blank option) and click Apply. Confirm via Rails console:
   `Setting.plugin_redmineflux_testcase_management['tracker'] == [""]`.
3. In any project with the module enabled, go to Test Cases → **New Test Case** (`/projects/<id>/issue_testcase/new`).
4. Fill in the required fields and submit.
5. Open the created issue directly by its ID and check its tracker. Check the Test Suites list, Reports, and RTM
   for the same project.

## Expected result

- Per TC-TCM-001: either the create action is refused with an explicit "Testcase Tracker is not configured"
  message (no issue created), or the feature is not reachable at all while unconfigured.

## Actual result

- Live-confirmed: submitted the form with subject "TC-TCM-001 test - tracker cleared" plus all required custom
  fields. Redirected to `/test_suites?project_id=test-project` with **no error of any kind**.
- Rails console: `Issue.where(subject: "TC-TCM-001 test - tracker cleared").last` → **issue #1580,
  `tracker_id=1` (Bug)** — not the configured "Test case" tracker (id 4), and not any tracker the user selected
  (the "Add Testcase" form has no tracker selector at all).
- `/issues/1580` renders as **"Bug #1580: TC-TCM-001 test - tracker cleared"** — a completely ordinary Bug issue,
  carrying the QA custom-field values that were meant for a test case, but structurally indistinguishable from any
  other bug in the project.
- The Testcase Tracker setting was restored immediately after this test (`localhost:3010` is a shared instance);
  restoring it does **not** retroactively fix issue #1580 — it remains permanently filed as a Bug.

## Root cause

`app/controllers/issue_testcase_controller.rb#new` (lines 93-96):
```ruby
default_tracker_id = params[:defect_tracker_id].present? ? params[:defect_tracker_id].to_i : Setting.plugin_redmineflux_testcase_management['tracker'].first.to_i
@issue.tracker ||= @issue.project.trackers.find_by(id: default_tracker_id) || @issue.project.trackers.first
```
When the setting is blank, `Setting.plugin_redmineflux_testcase_management['tracker']` is `[""]`, so
`.first.to_i` evaluates `"".to_i` → `0`. `@issue.project.trackers.find_by(id: 0)` correctly finds nothing — but
the `||` fallback then silently picks `@issue.project.trackers.first`, i.e. **whichever tracker happens to be
first for the project**, rather than surfacing an error. The codebase does have a real "no tracker" error path
elsewhere in the same controller (`render_error l(:error_no_tracker_in_project)` /
`error_no_tracker_allowed_for_new_issue_in_project`, lines 237-241), proving the developer considered this case —
but that path is in a different method and is never reached here because the fallback to `trackers.first` almost
always succeeds (any project with at least one tracker at all).

## Suggested fix

In `issue_testcase_controller.rb#new` (and the equivalent resolution in `#create`), when
`Setting.plugin_redmineflux_testcase_management['tracker']` is blank or does not resolve to a real tracker on the
project, render the existing `error_no_tracker_in_project`-style error instead of falling back to
`@issue.project.trackers.first`. The fallback that exists today is appropriate for "no tracker was explicitly
requested" scenarios elsewhere in the codebase, but wrong here — this is the one path where a blank result means
"the plugin itself is unconfigured," which should never silently resolve to an arbitrary tracker.

## Evidence

### Screenshot

![Issue created as a plain Bug, not a test case, after the Testcase Tracker setting was cleared](../../screenshots/BUG-TCM-010/testcase-created-as-bug-tracker-instead-of-error.png)

### Console / log

```
Setting.plugin_redmineflux_testcase_management['tracker'] => [""]
Issue.where(subject: "TC-TCM-001 test - tracker cleared").last
=> #<Issue id: 1580, tracker_id: 1, ...>   # tracker_id 1 = Bug, not 4 = Test case
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_CONFIGURATION.md`:
- TC-TCM-001 (Testcase Tracker is required for test case creation) — **FAIL**

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers tracker-configuration fallback
  behavior. Related to the general "check config before filing" lesson from BUG-TCM-005, but a distinct, new
  defect (silent misfiling, not a missing-dependency diagnosis error).

## Production report

Reported to production `ztflux` as **#121700** on 2026-09-30, assigned to Sheetal Sharma. Linked via `report_defect`
against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and run
#592, environment "Window 11 + Chrome". Priority: High (priority_id 3); Defect custom fields: Type=Functional,
Severity=High-severity, Priority=High.

---

## Production history (synced from #121700 on 2026-10-08)

### 2026-10-06 06:50 UTC — Vaishnavi Bhawsar

Fixed. "New Test Case" used to quietly fall back to whatever tracker happened to be first in the project's list whenever the "Select Tracker As Testcase" setting was left blank — so the test case got created, but as an ordinary Bug, invisible to Test Suites/Reports/Traceability from then on. Now, if that setting isn't properly configured for the project, the form stops with a clear "No tracker is associated to this project. Please check the Project settings." message instead, and nothing gets silently created.

Fix is committed and pushed (commit dce136d).

I verified it by clearing the "Select Tracker As Testcase" setting and opening New Test Case — it now shows the clear error message and creates nothing, confirmed via the database (0 new issues). Then restored the setting and confirmed New Test Case works completely normally again. Screenshot attached shows the error message.

For QA:
1. Go to Administration > Plugins > Redmineflux Testcase Management > Configure, and clear "Select Tracker As Testcase", then Apply.
2. In any project, go to Test Cases > New Test Case.
3. Confirm you see a clear message that no tracker is configured, and that no test case/issue gets created.
4. Set "Select Tracker As Testcase" back to its normal tracker, Apply, and confirm New Test Case works normally again (form renders, saves properly, appears in Test Suites/Reports as before).

### 2026-10-06 13:31 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Clearing the Testcase Tracker setting now refuses "New Test Case" outright with a clear "No tracker is associated to this project" message; no issue is silently created on the Bug tracker anymore. (Separately filed BUG-TCM-046, Low, for the refusal rendering as a generic "500" page instead of a friendlier validation message — the core defect here is resolved.)
