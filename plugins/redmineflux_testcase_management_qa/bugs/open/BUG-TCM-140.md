# Bug Report

- Bug ID: BUG-TCM-140
- Production Redmine Issue ID: #128233
- Title: Add Run form allows per-environment assignee selection but per-TC assignee column ignores it — same assignee shown on all environment tabs
- Redmine version: 6.0.11 (Docker)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (Release 7.4.0)
- Environment: localhost:3000
- Browser: Chrome (admin)
- User role: Admin
- Date: 2026-11-12

## Steps to reproduce

1. Navigate to TestCases → Runs & Results → New Run for a project.
2. Add two environments (e.g. Chrome and Edge) using the "Add Assignment" button.
3. Set a **different** env-level assignee for each environment — e.g. Chrome → Daisy Skye, Edge → Autumn Grace.
4. Set the global `assignee_id` field (Release 7.4.0 per-TC default) to any user (e.g. Daisy Skye).
5. Create the run.
6. Open the run. Observe the TC table under the Chrome tab — note the "Assignee" column value.
7. Switch to the Edge tab using the environment dropdown.

## Expected result

- Under the Chrome tab, all TCs should show the Chrome env-level assignee (Daisy Skye) in the per-TC Assignee column.
- Under the Edge tab, all TCs should show the Edge env-level assignee (Autumn Grace) in the per-TC Assignee column.
- The Add Run form's per-environment assignee fields imply that each environment's TCs will carry that environment's assignee, which is what the client specifically requested ("har environment har testcase alag assignee").

## Actual result

- Under both Chrome and Edge tabs, all TCs show **Daisy Skye** in the per-TC Assignee column — only the first environment's assignee is used.
- The Edge env-level assignee (Autumn Grace) appears correctly in the **run summary** ("Assignee: Autumn Grace") when the Edge tab is active, but does **not** flow through to individual TC rows.
- The env-level assignee settings in the Add Run form have no per-environment effect on the per-TC Assignee column.

## Root cause (source-verified)

`run.rb` line 115–120 (`before_create :apply_default_case_assignee`):

```ruby
def apply_default_case_assignee
    default = run_assignments.map(&:assignee_id).compact.first  # ← only FIRST env's assignee
    return if default.blank?
    run_issues.each { |ri| ri.assignee_id = default if ri.assignee_id.blank? }
end
```

- On run creation, **only the first environment's assignee** is used as the per-TC default for all `RunIssue` records — regardless of how many environments are configured or which env's tab is currently viewed.
- Chrome → Daisy Skye is env index 0 (first) → all 52 TCs get Daisy Skye's ID written to `run_issues.assignee_id`.
- Edge → Autumn Grace is env index 1 — its assignee is **never read** by this method, so it has zero effect on TC-level assignment.
- The per-TC assignee is a **single shared value per (Run, TC)** stored in `run_issues.assignee_id`. There is no `run_issues.assignee_id_per_environment` or similar column — the data model itself does not support per-env TC assignment.

## Impact

- **UI is misleading in two ways:**
  1. The Add Run form allows setting different assignees per environment, implying per-environment TC assignment — but only the first env's assignee actually populates TC rows.
  2. Switching between Chrome and Edge tabs shows the same TC assignees, even though each env's summary header correctly shows its own env-level assignee.
- **Client's requirement unmet:** "har environment har testcase alag assignee" requires per-(Run, TC, Environment) assignment. The current data model and business logic only support per-(Run, TC) assignment shared across all environments.
- **Confirmed in scope (2026-11-12):** Per-environment TC assignment is a confirmed in-scope requirement. This is a real functional bug, not a design gap or enhancement request.
- **Fix scope:** Requires both a data model change (`run_issues` or `issue_status_results` needs an env-scoped assignee column) and UI/logic changes to `apply_default_case_assignee`, the reassign endpoint, and the TC table rendering per active environment tab.
- Found during RFTC045-6 (multi-env design check), Run #44, project `rftc-016-ci-qa`.

## Evidence

### Chrome tab — per-TC assignee = Daisy Skye
![Chrome tab TC column](../../screenshots/RFTC045/rftc045-6-run44-tc-list.png)

### Edge tab — run summary shows Autumn Grace (env-level correct) but TC column still shows Daisy Skye
![Edge tab run summary](../../screenshots/BUG-TCM-140/bug-tcm-140-edge-run-summary-autumn-grace.png)
![Edge tab TC column](../../screenshots/BUG-TCM-140/bug-tcm-140-edge-tc-column-daisy-skye.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-140/retest-yyyy-mm-dd-pass.png)

### Console / log

- No console errors — this is a data/logic issue, not a JS crash.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` — no existing bug for per-env assignee not flowing to TC column.
