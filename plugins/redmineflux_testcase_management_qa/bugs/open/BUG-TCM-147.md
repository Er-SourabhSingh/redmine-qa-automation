# Bug Report

- Bug ID: BUG-TCM-147
- Production Redmine Issue ID: #128396
- Title: Renaming an Environment via the project's Environment Settings page does not move its per-environment test case assignee rows — they are silently lost (#128320 incomplete fix for rftc-TCM-020's rename cascade)
- Redmine version: 6.0.11 (Docker, localhost:3000)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (commit `4e0170a`)
- Environment: localhost:3000
- Browser: Chrome (admin)
- User role: Admin

## Steps to reproduce

1. On a Run spanning 2+ environments, inline-reassign a test case's per-environment assignee under one specific environment's tab to a distinct value (e.g. set TC #324 under the "Firefox" tab to "Opal Sparrow").
2. Go to the project's Environment settings page (TestCases → Environment), click Edit on that environment, and rename it (e.g. "Firefox" → "Firefox-Renamed"). Save.
3. Return to the Run and switch to the renamed environment's tab (now "Firefox-Renamed"). Check the same test case's assignee.

## Expected result

- The per-environment assignee override set in step 1 should move with the rename, same as every other place the environment name is duplicated as a string (per the existing `rftc-TCM-020` fix's own stated intent: "the environment's name is duplicated as a plain string... on runs, run_assignments, issue_status_results, issues and time_entries... Propagate the rename to all of them").

## Actual result

- The test case's assignee reverts to the shared Test-Case-level fallback value ("Luna Blossom" in this repro) — the explicit per-environment override ("Opal Sparrow") is gone. It was not moved to the new environment name; it is simply orphaned under the old, now-nonexistent environment name string, so it's unreachable.
- The Run's environment-level (summary header) assignee, by contrast, DOES correctly follow the rename — only the per-test-case `RunIssueAssignment` rows are left behind.

## Root cause (source-verified, `TestcaseEnvironment` model)

```ruby
# rftc-TCM-020: the environment's name is duplicated as a plain string (not a
# foreign key) on runs, run_assignments, issue_status_results, issues and
# time_entries, so renaming it here previously left every already-created run
# showing the old name everywhere it appeared. Propagate the rename to all of
# them, scoped to this environment's own project so a same-named environment
# in a different project is never touched.
after_update :rename_environment_references, if: :saved_change_to_name?

def rename_environment_references
  old_name, new_name = saved_change_to_name
  return if old_name.blank?

  Run.where(project_id: project_id, environment: old_name).update_all(environment: new_name)
  RunAssignment.joins(:run).where(runs: { project_id: project_id }, run_assignments: { environment: old_name }).update_all(environment: new_name)
  IssueStatusResult.where(project_id: project_id, environment: old_name).update_all(environment: new_name)
  Issue.where(project_id: project_id, environment: old_name).update_all(environment: new_name)
  TimeEntry.where(project_id: project_id, environment: old_name).update_all(environment: new_name)
end
```

This callback, from the original BUG-TCM-020 fix (pre-#128320), enumerates every place the environment name is duplicated as a plain string and cascades the rename to each. **`RunIssueAssignment` — the new table #128320 introduced specifically to hold per-environment test case assignees, also keyed by this same plain-string environment name — is missing from this list.** When #128320 added a new place where the environment name is duplicated, this already-existing, purpose-built rename-cascade callback was never updated to include it, so BUG-TCM-020's own fix is now incomplete for the newest consumer of the environment name string.

(Separately, there IS a rename cascade that includes `RunIssueAssignment` inside `runs_controller.rb#update` — but only for a rename performed *through the Edit Run form's own environment dropdown*, not through the project's Environment Settings page, which is the normal/primary way to rename an environment.)

## Impact

- Any hand-set per-environment test case assignment is silently lost the moment someone renames that environment via the standard Environment Settings UI — with no warning, error, or indication anything happened. The data simply becomes unreachable (still in the database under the old name string, but no UI path references it anymore).
- This is a silent data-loss bug for exactly the kind of manual reassignment work the per-environment assignee feature exists to support.
- Severity: High — silent loss of user-entered data, not just a display inconsistency.

## Evidence

### Screenshot

Not separately captured for this bug — see the retest workflow in `BUG-TCM-145.md`'s evidence for the same Run/project context; confirmed via live reproduction (DB-level check: `RunIssueAssignment` row for the test case remained under the old environment name after rename, while `RunAssignment.environment` correctly updated to the new name).

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-147/retest-yyyy-mm-dd-pass.png)

### Console / log

- No console error — server-side logic gap (missing model in a cascade list), not a crash.
- Source-verified in `app/models/testcase_environment.rb`'s `rename_environment_references` private method.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` — no existing bug for this specific gap.
- Related to the original BUG-TCM-020 (closed) — this is a regression of that fix's completeness, introduced by #128320 adding a new string-keyed table without updating the existing rename-cascade list. Also related to BUG-TCM-145/BUG-TCM-146 (same feature area, Edit Run / Environment lifecycle cascades) but a distinct code path (model callback, not controller action).
