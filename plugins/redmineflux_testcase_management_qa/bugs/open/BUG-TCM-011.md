# BUG-TCM-011

- Bug ID: BUG-TCM-011
- Production Redmine Issue ID: #121701
- Title: Report Defect (and New Test Case) cannot be completed at all when Defect/Testcase Tracker is set to anything other than "Bug" — two Bug-only required custom fields are enforced but never rendered
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-09-30

## Summary

This project has two issue custom fields scoped to the **Bug** tracker only and marked required at the field
level: **"QA Bug-Only Tracker Field"** (id 65) and **"QA Required Readonly Field"** (id 70) — confirmed via Rails
console: `is_required=true`, `trackers=["Bug"]` for both. Under normal Redmine behavior, a required custom field
scoped to one tracker should never be validated (or rendered) when creating an issue on a *different* tracker.

**Live-confirmed this rule is violated specifically by this plugin's shared "Add Testcase" / "Report Defect" form
and create action** (`issue_testcase_controller.rb`, used for both `New Test Case` and `Report Defect`/`Add
Defect`, distinguished only by a `defect_tracker_id` param). Reproduced twice, on two different non-Bug trackers:

| Defect/Testcase Tracker configured | Add Defect / New Test Case form | Submit result |
|---|---|---|
| Bug (the field's natural tracker) | Both fields render, fillable | **Succeeds** |
| Support | Neither field renders anywhere on the form | **Fails**: "Qa bug-only tracker field cannot be blank", "Qa required readonly field cannot be blank" |
| Test case | Neither field renders anywhere on the form | **Fails**: identical two errors |

The practical effect: **on any instance where an admin has configured a Bug-only required custom field (a very
ordinary setup — restricting a required field to one tracker is a standard Redmine pattern) and then sets the
plugin's Defect Tracker or Testcase Tracker to anything other than Bug, the Report Defect and New Test Case flows
become completely unusable.** The user cannot self-diagnose or work around this — the two required fields never
appear on the form at all, so there is no way to satisfy the validation; every submission fails with the same
two errors regardless of what else is filled in correctly.

## Steps to reproduce

1. Create (or use an existing) issue custom field scoped only to the Bug tracker and marked required.
2. In the plugin's Configuration, set **Select Tracker As Defect** (or **Select Tracker As Testcase**) to any
   tracker other than Bug — e.g. "Support".
3. In a project, open a run, fail a test case, click **Report Defect** (or go to **New Test Case** directly).
4. Fill in the subject and every required field the form actually shows, then submit.

## Expected result

- Either the Bug-only required field is correctly excluded from validation (matching how it's excluded from the
  form) since the issue isn't being created on the Bug tracker, or the plugin should not allow a configuration
  combination it cannot itself satisfy.

## Actual result

- Live-confirmed twice (Defect Tracker = Support, then Defect Tracker = Test case): the create request is
  rejected with `Qa bug-only tracker field cannot be blank` and `Qa required readonly field cannot be blank`,
  even though neither field is rendered anywhere on the form the user is filling in. No issue is created; the form
  re-renders the same way every time, giving the user no path forward.
- Confirmed by contrast: with Defect Tracker set back to **Bug** (the field's own natural tracker), both fields
  render normally, can be filled, and the create succeeds (issue #1581 created cleanly as evidence during this
  same session).

## Root cause

`app/controllers/issue_testcase_controller.rb`:
- `before_action :build_new_issue_from_params, only: [:new, :create]` initializes `@issue` identically for both
  actions (lines 207 ff.) — `@issue.safe_attributes = attrs` is the only place `@issue.tracker` gets set from
  request params.
- The `new` action (lines 93-96) has additional logic that explicitly resolves and assigns a tracker from
  `params[:defect_tracker_id]` or the plugin's Testcase Tracker setting:
  ```ruby
  default_tracker_id = params[:defect_tracker_id].present? ? params[:defect_tracker_id].to_i : Setting.plugin_redmineflux_testcase_management['tracker'].first.to_i
  @issue.tracker ||= @issue.project.trackers.find_by(id: default_tracker_id) || @issue.project.trackers.first
  ```
  This is only reachable on the GET request that renders the form — it is what makes the **displayed form**
  correctly hide Bug-only fields for a non-Bug tracker.
- The `create` action does capture `@tracker_id = params[:defect_tracker_id] if params[:defect_tracker_id].present?`
  (line 116), but this variable is used only when re-rendering the `new` template after a validation failure
  (line 176) — it is never applied to `@issue.tracker` before `@issue.save` is called. Whatever tracker the saved
  issue actually ends up on must therefore come from a hidden `tracker_id` form field the view renders (which
  does correctly resolve to the right tracker for a *successful* save — this session's own defects/test cases
  landed on the correct tracker). But the **custom field validation path being exercised on the failed attempts
  above is not reading that same resolved tracker** — the two Bug-only fields are being validated as if the issue
  were still tracker-less or on a tracker that includes them, which is only possible if the tracker context used
  for `editable_custom_field_values`/required-field validation diverges from the tracker context used for the
  final `tracker_id` column value. This split between `new`'s explicit tracker-resolution logic and `create`'s
  reliance on the submitted form field is the concrete asymmetry to start from; pinning the exact line where the
  two diverge needs a debugger session inside `create`, which this QA session did not have access to.

## Suggested fix

Apply the same tracker-resolution block that `new` already has (`default_tracker_id` from
`params[:defect_tracker_id]` or the relevant setting, `@issue.project.trackers.find_by(id: ...)`) inside `create`
as well, **before** any validation runs, so the tracker used for custom-field requiredness matches the tracker the
form actually rendered and the issue is ultimately saved under. This removes the asymmetry between the GET and
POST code paths that's the likely source of the mismatch.

## Reconfirmation — 2026-10-01 (scope escalation: affects the project's own standing configuration, not just a
deliberately-altered one)

While executing `TESTCASE_MANAGEMENT_TEST_RUNS.md` TC-TCM-168 (add a test case to a suite after run creation),
a completely ordinary **New Test Case** submission — under this project's *current, restored baseline* settings
(Testcase Tracker = "Test case" id 4, Defect Tracker = "Bug" id 1, confirmed live via Administration → Plugins →
Redmineflux Testcase Management → Configure) — failed with the exact same two errors: *"Qa bug-only tracker field
cannot be blank"*, *"Qa required readonly field cannot be blank"*. Neither field is rendered on the "Add Testcase"
form. Re-verified the two custom fields' scoping is unchanged (`QA Bug-Only Tracker Field` id 65: `tracker_ids:
["1"]` i.e. Bug only, `is_required: true` — confirmed via Administration → Custom fields → edit page, not altered
since the original finding).

**This means the defect isn't conditional on someone deliberately picking a non-Bug tracker** — it fires under
the project's own default, currently-configured Testcase Tracker, any time at least one Bug-only required custom
field exists (an ordinary, supported Redmine configuration). The project's 1,164 pre-existing "Test case"-tracker
issues almost certainly predate these two QA fixture fields (added specifically to test this scenario) or were
created via CSV import (a different code path, not this controller) — new test cases created through the "New
Test Case" UI form are blocked going forward. TC-TCM-168 is **BLOCKED** by this bug as a direct consequence.

## Evidence

### Console / log

```
IssueCustomField.find_by(name: "QA Bug-Only Tracker Field")  => is_required=true, trackers=["Bug"]
IssueCustomField.find_by(name: "QA Required Readonly Field") => is_required=true, trackers=["Bug"]

# Defect Tracker = Support:
Add Defect form: no "QA Bug-Only Tracker Field" or "QA Required Readonly Field" shown
Submit -> errors: "Qa bug-only tracker field cannot be blank", "Qa required readonly field cannot be blank"

# Defect Tracker = Test case (same value as Testcase Tracker, per TC-TCM-005):
Add Defect form: no "QA Bug-Only Tracker Field" or "QA Required Readonly Field" shown
Submit -> identical two errors

# Defect Tracker = Bug (restored):
Add Defect form: both fields shown, fillable
Submit -> issue #1581 created successfully, tracker_id=1 (Bug)
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_CONFIGURATION.md`:
- TC-TCM-003 (Defect Tracker drives the Report Bug flow) — side observation with Support tracker, not filed
  separately, now explained by this bug
- TC-TCM-005 (Same tracker selected for two roles) — **FAIL**, this is the blocking defect found while executing it

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers custom-field/tracker validation
  mismatch. Distinct from BUG-TCM-010 (which is about the *Testcase Tracker being blank entirely* silently
  misfiling to the wrong tracker with no error at all) — this bug is about a *validly configured, non-blank*
  non-Bug tracker producing an *unsatisfiable validation error* instead.

## Production report

Reported to production `ztflux` as **#121701** on 2026-09-30, assigned to Sheetal Sharma. Linked via `report_defect`
against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and run
#592, environment "Window 11 + Chrome". Priority: High (priority_id 3); Defect custom fields: Type=Functional,
Severity=High-severity, Priority=High.
