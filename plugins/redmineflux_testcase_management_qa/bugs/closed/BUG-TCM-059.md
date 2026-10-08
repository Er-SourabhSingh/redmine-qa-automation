# BUG-TCM-059

> **CLOSED — 2026-10-07.** Production #122779 (https://flux.zehntech.com/issues/122779) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-059
- Production Redmine Issue ID: #122779 (https://flux.zehntech.com/issues/122779) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: The API silently accepts a cross-project defect_ids value — returns 201 Created but never actually links the defect
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: Medium
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

The real browser UI correctly blocks a cross-project defect link in two places, each with a clear, visible
error: the issue's own **Relations** tab ("Related issue doesn't belong to the same project: #92") and Add
Result's **Defects** field search ("No defect found for this testcase" -- the cross-project id never even appears
as a selectable option). So a human tester cannot produce a cross-project defect link through the product.

But the plugin's own write endpoint (`POST /issue_status_results`, the same one the real Add Result form submits
to) has no equivalent check: sending a cross-project id in `defect_ids` returns **201 Created** -- looking exactly
like a success -- but the defect is never actually linked anywhere (no `ExecutionDefect` join row, no
`IssueRelation`), and the raw `defect_ids` column is left holding an id that isn't really connected to anything.
No error is returned to the caller at all. Anything that writes results via this endpoint directly rather than
through the browser (CI ingestion, the MCP `report_defect` tool's `defect_issue_id` branch, any future
integration) would have no way to know the link it just "successfully" requested never actually happened.

## Root cause

`IssueStatusResultsController#create` -> `IssueStatusResult.new(issue_status_result_params).save` -> the
model's `after_save :reconcile_execution_defects, if: :saved_change_to_defect_ids?` -> @ExecutionDefects::Linker
.reconcile_from_csv` -> for each id in the CSV, calls `validation_error_for@ before linking:

```
def validation_error_for(result, defect_issue, user, check_visibility: true)
  ...
  return I18n.t(:error_cross_project_link) if defect_issue.project_id != result.project_id
  ...
end
```

When this returns an error string, `reconcile_from_csv` does:

```
to_add.each do |defect_id|
  defect = Issue.find_by(id: defect_id)
  next if defect.nil?
  next if linker.send(:validation_error_for, result, defect, nil, check_visibility: false)   # <-- silently skipped
  ...
  linker.link(result: result, defect_issue: defect, user: User.current)
end
```

The error message is computed and then simply discarded (`next`) -- it's never surfaced back up to
`IssueStatusResultsController#create`'s response. The controller itself has no knowledge this happened; from its
point of view, `issue_status_result.save` succeeded, so it renders `201 Created` as normal. Compare this to the
single-create controller action's own `case_status.requires_defect_link? && defect_ids.blank?` check, which
**does** return a clean 422 -- that check only covers "is there at least one id present," not "is each id actually
a valid, linkable one." The cross-project rejection happens one layer deeper (inside the async `after_save`
reconcile), after the controller has already decided to respond with success.

## Steps to reproduce

1. Pick a Failed/Blocked test case in Project A, and a real defect issue that belongs to Project B.
1. `POST /issue_status_results.json` with that test case's `issue_id`/`run_id`/`testsuite_id`/`environment`, a
  failure-requiring `case_status_id`, and `defect_ids` set to the Project-B defect's id.
1. Check the response, then check whether the defect actually shows as linked (Run page's "Defect ID's" column,
  or `ExecutionDefect.linked_defects`).

## Expected result

Either the request should be rejected with a clear error (same `error_cross_project_link` message the model
validation already computes, just never returned), or the response should clearly indicate which ids failed to
link and why -- never a bare `201 Created` for a link that didn't happen.

## Actual result

`201 Created`, `{"status":"success", ..., "defect_ids":"92"}` -- looks like a complete success. The defect is
not actually linked anywhere.

## Evidence

Fresh, clean repro (not relying on old fixture data) -- test case #115 (project `compat-fresh-project`, id 3),
defect #92 (project `qa-demo`, id 1), run #33:

```
$ curl -X POST http://localhost:3015/issue_status_results.json \
    -H "X-Redmine-API-Key: ..." \
    -d "issue_status_result[run_id]=33" \
    -d "issue_status_result[testsuite_id]=12" \
    -d "issue_status_result[issue_id]=115" \
    -d "issue_status_result[case_status_id]=3" \
    -d "issue_status_result[environment]=Window 11 + Chrome" \
    -d "issue_status_result[defect_ids]=92"
```

-> 201 Created
   {"status":"success","issue_status_result":{"id":853,"issue_id":115,"project_id":3,
    "defect_ids":"92","environment":"Window 11 + Chrome", ...}}

Immediately after, via Rails console:

```
IssueStatusResult.find(853).defect_ids
# => "92"   -- the raw column says it's linked
```

ExecutionDefect.where(issue_status_result_id: 853)
1. => []     -- but no join row was ever created

ExecutionDefect.linked_defects(issue: Issue.find(115), run: Run.find(33), environment: "Window 11 + Chrome")
1. => []     -- not linked, not counted, won't show in the Defect ID's column either

For comparison, the two real UI paths both correctly refuse this up front, with a visible error:
- Relations tab, adding issue #92 as a related issue: "Related issue doesn't belong to the same project: #92"
- Add Result's Defects field, searching "92": "No defect found for this testcase" (search is project-scoped, so
  a cross-project defect never appears as a selectable result)

## Suggested fix

Have `ExecutionDefects::Linker.reconcile_from_csv` collect the skipped ids and their error messages (instead of
silently `next`-ing past them) and return them, so `IssueStatusResultsController#create`/`#bulk_create` can
include a `partial_errors` (or similar) field in the response when some requested defect ids didn't actually
link -- rather than reporting a bare, misleading `201`/success for a request where part of what was asked for
silently didn't happen.

## QA reference

Local bug file: bugs/open/BUG-TCM-059.md . Test case: TC-TCM-273 (TESTCASE_MANAGEMENT_TEST_RUNS.md). Related to
BUG-TCM-057 (#122768) -- same general area (defect-linking consistency), distinct mechanism: 057 is about an
already-linked defect never coming unlinked; this is about a requested link silently never happening, with a
false-success response.

---

## Production history (synced from #122779 on 2026-10-08)

### 2026-10-07 11:29 UTC — Vaishnavi Bhawsar

Fixed using your suggested approach — the response now tells you when part of a request silently didn't go through.

The actual block on cross-project defects was already correctly in place one layer deeper in the system — it just never made its way back up to the response, so a request could be rejected internally while the caller was told everything succeeded. Now whenever any requested defect id doesn't actually get linked (cross-project, or any other reason), the response still shows success for what was saved, but adds a clear note listing exactly which defect id didn't link and why — for both a single result and a bulk submit.

Screenshot attached: the exact repro from this ticket, replayed live — still 201 Created, but now with a "partial_errors" entry naming defect 284 and explaining it couldn't be linked because it belongs to a different project.

For QA:
1. Submit a result (single or bulk) with a case status that requires a defect, using a defect_ids value from a different project.
2. Confirm the response is still a success (the result itself saves), but now includes a clear note about which defect id failed to link and why.
3. Confirm that defect still does not show as linked anywhere (Defect ID's column, run's defect count, Reports) — only the note changed, not the actual (correct) blocking behavior.
4. Confirm a normal, valid defect link still responds exactly as before, with no such note.

### 2026-10-07 12:28 UTC — Sourabh Singh

Retested on fresh master (commit `983403a`, which cites this bug by name). `ExecutionDefects::Linker.reconcile_from_csv` now returns every skipped defect id with its reason instead of discarding it, and both the single-create and bulk-create controller actions surface it as a `partial_errors` field in the response.

Confirmed live: the exact original repro (`POST /issue_status_results.json` with a cross-project `defect_ids` value) now returns `201 Created` with `"partial_errors":[{"defect_id":92,"error":"The execution and the defect must belong to the same project."}]` alongside the normal success payload -- no longer indistinguishable from a complete success. Closing.
