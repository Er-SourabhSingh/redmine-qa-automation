# Bug Report

- Bug ID: BUG-TCM-142
- Production Redmine Issue ID:
- Title: Edit Run form assignee_id field updates Run record but does not cascade to per-TC assignees — misleading UX
- Redmine version: 6.0.11 (Docker)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (Release 7.4.0)
- Environment: localhost:3000
- Browser: Chrome (admin)
- User role: Admin
- Date: 2026-11-12

## Steps to reproduce

1. Create a run with TCs auto-populated with Assignee A (via Add Run → env-level assignee → first env gets applied to all TCs via `apply_default_case_assignee`).
2. Navigate to Edit Run for that run.
3. In the Edit Run form, change the `assignee_id` field (the top-level run-level assignee selector) to Assignee B.
4. Submit the Edit Run form.
5. Return to the run's TC table and observe the per-TC Assignee column.

## Expected result

- After editing the run-level assignee to Assignee B, all TCs that previously had no explicit per-TC assignee, or all TCs if the form implies a default cascade, should update their per-TC Assignee to Assignee B.
- If the Edit Run form's assignee field controls the env-level default (not TC-level), that should be clearly communicated — the form currently presents the field identically to the Add Run form, which DOES populate TC rows at creation.

## Actual result

- The Edit Run form accepts and saves the `assignee_id` value to `Run.assignee_id` (the Run model record), but **per-TC assignees (RunIssue records) are NOT updated**.
- The TC table still shows Assignee A for all TCs — the Edit Run submit has zero effect on the per-TC Assignee column.
- The user expects parity with Add Run behavior (where setting an env-level assignee populates all TC rows), but Edit Run intentionally does not invoke `apply_default_case_assignee` (it is `before_create` only).

## Root cause (source-verified)

**run.rb:**
```ruby
before_create :apply_default_case_assignee  # ← before_create ONLY, never before_update
```

**runs_controller.rb line 571:**
```ruby
@run.assignee_id = params[:assignee_id] if params[:assignee_id].present?
```
This sets the Run model's `assignee_id` column but does NOT trigger `apply_default_case_assignee` (create-only), so RunIssue records are untouched.

**runs_controller.rb line 2066 (`update_params`):**
```ruby
# Top-level assignee_id is NOT in update_params permitted list —
# only run_assignments_attributes: [:id, :environment, :assignee_id, :_destroy]
```
So `params[:assignee_id]` on Edit Run goes through line 571 (a direct model assignment), not through the standard strong-params update path that would cascade.

**Net result:** Editing the run-level assignee on Edit Run form is a no-op for per-TC rows — it only updates `runs.assignee_id` column (the run record itself), which is not what the user intends.

## Impact

- **Misleading UX:** The Edit Run form's assignee field looks like it will update TC-level defaults (consistent with Add Run), but it has no effect on the per-TC Assignee column.
- **No feedback to user:** The form submits successfully with no error or warning that TC-level assignees were not changed.
- **Silent overwrite risk:** If a user opens Edit Run and accidentally changes the assignee field, they expect all TC assignees to update — but nothing happens. Conversely, if the field were made to work (cascade to RunIssue records), it would silently overwrite any manual inline/bulk reassignments already done inside the run.
- **Recommended fix:** Remove the `assignee_id` field from the Edit Run form entirely.
  - Reason: Bulk reassignment (available inside the run) is the correct and already-implemented tool for TC-level assignment. The Edit Run form has no safe behavior for this field — either it does nothing (current, misleading) or it mass-overwrites existing TC assignments (destructive).
  - Add Run can keep the field as a creation-time default, but only if it correctly cascades per-environment (see BUG-TCM-140).
- Severity: Medium — data integrity is not at risk, but users will be confused when Edit Run appears to have no effect on TC assignments.

## Evidence

- Source read: `run.rb` line 20 — `before_create :apply_default_case_assignee` (not `before_save`).
- Source read: `runs_controller.rb` line 571 — direct `@run.assignee_id = params[:assignee_id]` with no RunIssue cascade.
- Source read: `runs_controller.rb` line 2066 — `update_params` does not include top-level `assignee_id`.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-142/retest-yyyy-mm-dd-pass.png)

### Console / log

- No console errors — this is a logic gap, not a crash.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` — no existing bug for Edit Run assignee field not cascading to TC rows.
- Related to BUG-TCM-140 (Add Run per-env assignee not reflected in TC column) and BUG-TCM-141 (no email on TC reassignment) — all three are gaps in the Release 7.4.0 per-run TC assignee feature.
