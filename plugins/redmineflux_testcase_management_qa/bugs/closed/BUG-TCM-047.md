# BUG-TCM-047

> **CLOSED — 2026-10-07.** Production #122673 (https://flux.zehntech.com/issues/122673) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-047
- Production Redmine Issue ID: #122673 (https://flux.zehntech.com/issues/122673) — created 2026-10-06, assigned to Vaishnavi Bhawsar, Priority High, Defect Severity High-severity
- Title: Add Result never actually saves the selected Defect(s) — defect_ids is silently dropped by strong parameters on every submission
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: High
- Reported by: Sourabh Singh
- Date: 2026-10-06
- Status: Closed (production: Done, 2026-10-07)

## Summary

`IssueStatusResultsController#create` builds the result entirely from `issue_status_result_params`:

```
params.require(:issue_status_result).permit(:case_status_id, :environment, :run_id, :testsuite_id, :notes,
  :issue_id, :defect_ids, :duration_ms, attachments_attributes: [...])
```

`:defect_ids` is permitted as a **scalar**. But the Defects field is rendered as a genuine HTML multi-select (`f.select :defect_ids, [], { multiple: true }`), which submits as `issue_status_result[defect_ids][]` — an **array**. Rails strong parameters silently drops an array value when only the scalar key is permitted (it does not raise); it must be declared `defect_ids: []` to accept an array. So `defect_ids` is always `nil` by the time @`issue_status_result.save` runs, regardless of what was selected in the UI.

This isn't caught by the method's own "Failed/Blocked requires a defect" guard, because that check reads the **raw, unpermitted** params directly — which genuinely is present — so validation passes and the result saves successfully with a completely empty `defect_ids` underneath. A user can go through the entire "mark Blocked -> Report Defect -> Submit" flow, see no error anywhere, and the defect link is simply never created.

Pre-existing, not a regression — `git log -p` shows `:defect_ids` has been a scalar permit in every version of this method's history.

## Steps to reproduce

1. Open a Run's execution grid, click a test case's current status link to open Add Result.
1. Set Status to **Blocked** (or Failed).
1. Click **Report Defect**, fill in a subject, create the defect — the Defects* field auto-populates with the new defect's id as a selected chip.
1. Click **Submit**.
1. Check the run grid's "Defect ID's" column for that row, and/or query the saved IssueStatusResult row directly.

## Expected result

The result saves with Status: Blocked **and** the selected defect genuinely linked — the grid should show "Linked defects: #<id>".

## Actual result

Live-confirmed on 3 independent submission attempts (result ids 486, 489, 490) — every one saved `case_status: Blocked` with `defect_ids: nil`, and zero corresponding `ExecutionDefect` rows. The defect issue itself was created successfully by "Report Defect" and exists correctly — only the link back to the execution is lost. Grid row permanently reads "No defects" despite the Blocked status and despite a real, existing defect created for exactly this purpose.

## Suggested fix

Change the permit call to `permit(..., defect_ids: [], ...)` so the array survives strong parameters, then also create the corresponding `ExecutionDefect` join row(s) (same join `link_defect` writes to) so Add Result and the dedicated link/unlink endpoints produce consistent results.

## Environment

Docker `localhost:3015` (project `qa-demo`), plugin v7.1.0, Chromium (Playwright MCP).

---

## Production history (synced from #122673 on 2026-10-08)

### 2026-10-06 14:05 UTC — Vaishnavi Bhawsar

Fixed. The Defects field lets you pick more than one defect, but the form was only accepting a single value underneath -- so whichever defect(s) you selected were thrown away before the result was even saved. The result itself still saved fine (Status: Blocked, for example), which is why nothing looked wrong, but the defect link was simply never created. A direct API submission with the field sent as a single value (as our API docs describe) still works exactly as before.

Verified end-to-end: marked a test case Blocked, used "Report Defect" to create a new defect, and submitted. Confirmed in the database that the result now correctly saves the defect's ID and the link to it, and confirmed on the grid that the row now shows "Linked defects: #<id>" instead of "No defects."

For QA:
1. Open Add Result on a test case, set Status to Failed or Blocked.
2. Either search for an existing defect or use Report Defect to create one -- confirm it shows as a selected chip in the Defects field.
3. Submit, and confirm the run grid's row now shows the linked defect instead of "No defects."

### 2026-10-07 06:58 UTC — Sourabh Singh

Retested on master `4b5a7a7`, end to end through the real UI (not a direct API call): searched for and selected an existing defect in the Add Result popup, submitted, and confirmed via a follow-up API read that a genuine IssueRelation(relation_type: 'defect') was persisted, and the run grid reflected it. The strong-parameters scalar/array gap is fixed. Closing.
