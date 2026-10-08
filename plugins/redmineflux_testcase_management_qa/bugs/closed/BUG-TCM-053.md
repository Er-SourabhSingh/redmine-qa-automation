# BUG-TCM-053

> **CLOSED — 2026-10-07.** Production #122692 (https://flux.zehntech.com/issues/122692) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-053
- Production Redmine Issue ID: #122692 (https://flux.zehntech.com/issues/122692) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority High, Defect Severity High-severity
- Title: Editing a Run silently fails with a completely empty 422 whenever the editing user isn't a member of the run's project
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: High
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

User report was simply "unable to edit run," with no further detail. Investigated directly by replaying the real Edit Run modal's exact rendered form values via a direct authenticated HTTP request (logged in as Administrator). Resubmitting the form completely unchanged is rejected with `422 Unprocessable Content` and a **completely empty response body**.

## Root cause

The Edit Run form includes a hidden field that has nothing to do with the run's actual assignees:

```
# app/views/runs/_edit_form.html.erb line 97 (same pattern in new.html.erb line 260 for Add Run)
<%= hidden_field_tag 'assignee_id', User.current.id %>
```

-- unconditionally set to **whoever is currently editing the form**, not any run assignment. On `update`, the `rftc_authorize_run_update` before_action chains into `rftc_validate_run_assignees`, which was written to check that every run assignment's assignee is a real member of the run's project -- but it also sweeps in this unrelated top-level `assignee_id` param as if it were one of them:

```
assignee_ids = []
nested = params.dig(:run, :run_assignments_attributes)
if nested.respond_to?(:values)
  assignee_ids.concat(nested.values.map { |a| a[:assignee_id] if a.respond_to?(:[]) })
end
assignee_ids << params[:assignee_id] if params[:assignee_id].present?   # <-- the bug
invalid = assignee_ids.compact.reject(&:blank?).map(&:to_i).uniq
                      .reject { |aid| @project.users.exists?(id: aid) }
return true if invalid.empty?
rftc_render_error(:unprocessable_entity, l(:error_assignee_invalid_id, id: invalid.join(', ')))
```

So whoever is editing the run -- not the run's assignees -- must themselves be a project member, or the entire save is rejected, regardless of whether the actual `run[run_assignments_attributes]` being submitted are completely valid. Confirmed live: a test project had exactly one member; Administrator (not a member) hit this wall on every single edit attempt, even with completely valid assignment data.

Worse, the failure is completely silent. `rftc_render_error`'s JS-format branch is `format.js { render(js: "", status: status) }` -- an empty JS body with just a 422 status. In the real modal (loaded via AJAX, submitted via `data-remote`), this means the AJAX request returns 422 with nothing to render: no flash message, no inline error, nothing. The modal just sits there doing nothing when "Update" is clicked -- which matches the original "unable to edit run" report exactly.

## Steps to reproduce

1. As a user who is not a member of a given project (e.g. an Administrator who hasn't been added as a project member), open any existing Run in that project and click Edit.
1. Change nothing, or change only the Run's own fields (name, dates, etc.) -- leave the actual environment/assignee rows as they already are.
1. Click Update.

## Expected result

The run saves successfully (assuming the actual assignment data is valid), or at minimum a clear, visible error explains what's wrong.

## Actual result

Replayed the exact rendered form (no changes) via POST with `_method=patch`: **422 Unprocessable Content, content-length: 0** -- completely empty body. Root-caused to the hidden `assignee_id` field (the editing Administrator's own id, not a project member) being swept into `rftc_validate_run_assignees`'s membership check alongside the genuinely valid run assignments. The actual run assignments themselves were never the problem.

## Suggested fix

Drop the stray `params[:assignee_id] if params[:assignee_id].present?` line from `rftc_validate_run_assignees` -- it should only ever validate the actual `run[run_assignments_attributes][*][assignee_id]` values, never the editing user's own id. Separately, fix `rftc_render_error`'s `format.js { render(js: "", status: status) }` branch to actually render the error message (e.g. updating the modal's own `#flash_error` div) instead of a silent empty body.

## Environment

- Redmine version: 6.x (Docker)
- Plugin version: 7.1.0
- Environment: Docker localhost:3015 (project compat-fresh-project)
- User role: Administrator (not a member of the project being tested)

---

## Production history (synced from #122692 on 2026-10-08)

### 2026-10-07 06:37 UTC — Vaishnavi Bhawsar

Fixed both halves of this.

The main one: a hidden field was quietly sending along whoever is currently editing the form as if they were one of the run's assignees, and the save was being blocked on THAT, not on anything actually wrong with the run itself. Editing a run no longer depends on whether the person doing the editing happens to belong to that project — only the run's real assignees need to be valid, same as before.

The other half, which was making this so confusing to begin with: when a save genuinely is invalid, the popup used to just sit there doing absolutely nothing, with no message at all. Attached screenshot shows this part fixed directly — I tried saving a run with a genuinely incomplete field (no environment picked), and it now shows a clear red message explaining exactly what's wrong, instead of the screen going silent.

For QA:
1. As a user who is NOT a member of a project, open an existing run there and click Edit, change nothing, and click Update — it should save normally (assuming the run's own assignees are already valid), not get rejected.
2. Separately, try saving a run with something genuinely invalid (e.g. no environment picked, as in the attached screenshot) — confirm you now see a clear on-screen error instead of the button doing nothing.

### 2026-10-07 07:25 UTC — Sourabh Singh

Retested on master `c43c588` (commit 852b127, which cites this bug by name). The stray line sweeping the editing user's own id into the assignee-membership check has been removed -- only the run's actual assignment data is validated now. Separately, the previously-silent error-rendering path now actually shows the message in the modal's own flash area instead of an empty body. Confirmed a non-member Administrator can now save a run successfully (200, was 422 empty body), and confirmed a genuinely invalid assignee is still correctly rejected, now with a visible error message. Closing.

### 2026-10-07 09:51 UTC — Sonam Goutam

Reopening — reproduced on the current build (https://flux-f1ps7u6rd50.forge.zehntech.com/, Testcase Management plugin 7.1.0) during P1 release-gate execution of EX-710-RUN-02 (test case #122267).

Steps:
1. Logged in as admin (admin is not a project member of "Testcase Management Project", id 10).
2. Created run #28 with environments Development + Staging, seeded one Passed and one Failed+defect result in Staging.
3. Opened Edit Run in the browser, removed the Staging environment row only, left everything else as rendered, clicked Update.

Actual: AJAX POST to `/runs/28?project_id=testcase-management` (`_method=patch`) returned **422 with an empty body**. No flash, no inline error — the modal just sat there, matching this bug's description exactly. The run's assignments were unchanged after the "save".

This matches the root cause already documented here (the hidden top-level `assignee_id` field being swept into `rftc_validate_run_assignees`'s membership check): admin's own id isn't a project member, so the save is rejected regardless of whether the submitted `run_assignments_attributes` are valid. Confirmed the workaround also described here: the identical change succeeds when sent as `PUT /runs/update_run/28.json` with Basic auth (API path bypasses the web form's stray `assignee_id` field) — only the web Edit Run modal is affected.

Found: 2026-10-07 by Claude Code on behalf of Sonam Goutam, during TCM 7.1.0 P1 release-gate execution (flux run #599).

### 2026-10-07 10:12 UTC — Vaishnavi Bhawsar

Re-checked this just now using your exact reopen steps — a run with two environments, as a non-member admin, removing just one environment row and saving.

I reproduced this exact scenario directly on the current code: two environments on a run, logged in as a non-member admin, removed one environment row only, left everything else as-is, and saved. It went through cleanly — the removed environment was genuinely gone afterward, no empty error, nothing stuck.

The forge link in the reopen note (flux-f1ps7u6rd50.forge.zehntech.com) looks like it may be a separate deployment that hasn't picked up this fix yet — the fix itself was already pushed and confirmed working before that retest happened. Could you confirm which build/server that forge link points to, and retest against a fresh pull of current master? If it's still failing there after that, please reopen again and I'll look right away.

### 2026-10-07 12:29 UTC — Sourabh Singh

Reopen note (Sonam Goutam) was reproduced against a stale forge deployment (flux-f1ps7u6rd50.forge.zehntech.com), not current master -- confirmed as such and asked to retest fresh.

Retested on fresh master (`c43c588`→`1f671e0`→`983403a`). Built a fresh fixture via the real "Add Run" UI form this time (not a hand-patched Rails-console row), as a non-member admin, in a project where admin genuinely has no membership. Opened Edit Run via the real action-menu path and submitted the form completely unchanged -- the exact original repro:

`POST /runs/54?project_id=compat-fresh-project (_method=patch, unchanged) -> 200 OK`

Confirmed via Rails console: `run.updated_at` advanced to the request time, both environment assignments intact -- a genuine, successful save, not a silent no-op. Also re-confirmed the other half: a genuinely invalid submission (missing Testsuite/Start date/Due date) renders a clear, visible error in `#flash_error` instead of a silent empty response. Both halves of the fix hold on current master; the earlier reopen was against stale infrastructure, not a regression. Closing.
