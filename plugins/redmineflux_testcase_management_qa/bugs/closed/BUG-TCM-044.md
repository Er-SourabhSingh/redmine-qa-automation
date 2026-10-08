# BUG-TCM-044

> **CLOSED — 2026-10-06.** Production #122104 (https://flux.zehntech.com/issues/122104) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-044
- Production Redmine Issue ID: #122104
- Title: rftc-008 "link an existing defect" UI (the picker, bulk-link action, and per-execution linked-defect display) is never integrated into the Run execution view — the feature is reachable only via the raw JSON API, not through the product UI at all
- Severity: Critical
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP) + direct API calls
- User role: QA Manager (`qa.manager`) / QA Engineer (`qa.engineer`)
- Date: 2026-10-06

## Summary

Per production issue #121875 (rftc-008, "Defect ↔ execution many-to-one linking"), the feature's stated goal is:
"From a failed or blocked execution in a run, a user with `:execute_testcase` can link one or more **existing**
defect issues... bulk-link a selected batch of failed/blocked executions to a single defect... see the linked
defect(s) on each execution." This was INECO's (the requesting customer) **#1**-ranked request, called "one of
the main factors that could hinder broader adoption."

I tested the full backend thoroughly (API endpoints, the `ExecutionDefect` join, the all-or-nothing bulk
transaction, permission/visibility/cross-project/self-link/gate enforcement, legacy-write-path reconciliation,
cascade cleanup, and the reverse "Linked Test Executions" panel on the defect's own issue page) — **all of it
works correctly**. However, **the forward-facing UI a QA engineer would actually use day-to-day does not exist
anywhere in the product**:

- `app/views/issue_status_results/_defect_link_picker.html.erb` (the in-project existing-defect search +
  "link to one defect" button) — file exists on disk, but is **never rendered by any view** (`grep -rln
  "defect_link_picker" app/views app/controllers` → only the file's own self-reference).
- `app/views/issue_status_results/_linked_defects.html.erb` (the per-execution linked-defect chip list with an
  unlink control) — same: file exists, **never rendered anywhere**.
- No JavaScript wiring either — `grep -rln "defect_link_picker\|link_defect\|defect-link"
  assets/javascripts/` → zero matches.

The only piece of this feature's UI that IS actually wired in is `_defect_executions_panel.html.erb` (the
reverse "Linked Test Executions" panel on the **defect's own** issue page, via the `view_issues_show_details_bottom`
hook) — confirmed rendering correctly live.

**Net effect**: a QA engineer running tests in the Run execution view has no "Link defect" button, no way to
search for and pick an existing defect, no multi-select "link selected to one defect" bulk action, and no visual
indicator per execution that a defect is linked — none of the actual INECO-requested workflow is reachable
through the UI. The only way to use this feature today is to call `POST
/testcase_status_results/link_defect.json` directly, which no end user would ever do.

## Steps to reproduce

1. Open any Run's execution view (`/runs/<id>?project_id=<id>`) with at least one Failed or Blocked execution.
2. Look for any control to link an *existing* defect to that execution (a "Link defect" button, an issue
   picker, a multi-select bulk-link action).
3. Separately, call the backend directly: `POST /testcase_status_results/link_defect.json` with a valid
   `project_id`, `defect_issue_id`, and `execution_ids` — confirm it succeeds (201, join row created,
   `defect_ids` CSV updated, `IssueRelation` created).
4. Reload the Run execution view for the now-linked execution and look for any indication the defect is linked.

## Expected result

Per the feature's own spec: a "Link defect" control should be present and functional on the Run execution view
for failed/blocked rows; a multi-select bulk-link action should exist; each execution should visibly show its
linked defect(s) once linked.

## Actual result

- Step 2: no such control exists anywhere in the Run execution view.
- Step 3: the backend call succeeds correctly (confirmed via direct testing — this part of the feature is solid).
- Step 4: the execution's row still shows **"No defects"** in its "Defect ID's" column even though the link
  genuinely exists in the database (`IssueStatusResult#defect_ids` correctly contains the defect's id,
  `ExecutionDefect` join row exists, `IssueRelation` exists) — because that column is rendered by a **different,
  pre-existing, already-broken** helper (`TestcaseReportsController#defect_ids(issue, env, run)` in
  `app/controllers/testcase_reports_controller.rb:1223`) that queries `Issue.where("... AND environment = ? AND
  run_id = ?", ..., env, run.id)` — requiring the **defect issue's own** `run_id`/`environment` columns to equal
  the currently-viewed run/environment. No defect issue (created via `report_defect`, manually, or via the new
  `link_defect` API) ever has those columns set — they're execution-context fields, not fields a defect issue
  itself carries — so this condition can never be true and the column shows "No defects" unconditionally,
  regardless of how many defects are actually linked. (This display bug predates rftc-008 and is not something
  the new code introduced, but it means that even after the picker UI above is built and wired in, this
  pre-existing column still won't reflect a real link unless it's also fixed or replaced by the new
  `_linked_defects` partial.)

## Evidence

### Backend verification (all PASS, for context — this is NOT what's broken)

<pre>
$ curl -X POST .../testcase_status_results/link_defect.json -d '{"project_id":1,"defect_issue_id":93,"execution_ids":[374,375]}'
{"status":"success","linked":[{"execution_id":374,...},{"execution_id":375,...}],"errors":[]}

$ rails runner 'puts IssueStatusResult.find(375).defect_ids'
93   # correctly recorded

$ curl .../defects/93/executions.json
{"status":"success","defect_issue_id":93,"executions":[...]}   # reverse panel + API both correct
</pre>

### UI integration check

<pre>
$ grep -rln "defect_link_picker\|linked_defects" app/views/ app/controllers/
app/views/issue_status_results/_linked_defects.html.erb   # only the file's own name, never referenced elsewhere

$ grep -rln "defect_link_picker\|link_defect\|defect-link" assets/javascripts/
(no matches)
</pre>

### Legacy display-column root cause

<pre>
# app/controllers/testcase_reports_controller.rb:1223
def defect_ids(issue, env, run)
  defect_ids = Setting.plugin_redmineflux_testcase_management['defected_tracker']&.map(&:to_i)
  issues_defect_ids = IssueRelation.where(issue_from_id: issue, relation_type: 'defect').select(:issue_to_id)
  total_defects = Issue.where("id IN (?) AND tracker_id IN (?) AND environment = ? AND run_id = ?", issues_defect_ids, defect_ids, env, run.id)
  return total_defects
end

$ rails runner 'd=Issue.find(93); puts "run_id=#{d.run_id.inspect} environment=#{d.environment.inspect}"'
run_id=nil environment=nil   # a defect issue never has these set; the query can never match
</pre>

## Test case coverage

Found while comprehensively testing production feature #121875 (rftc-008) at the user's explicit request,
cross-referencing the feature's own spec document
(`backlog/planning/rftc-008-feature-defect-execution-linking.md`) and its "QA Test Plan" section (steps 1-9),
which explicitly calls for a "Link defect" control, a bulk-link multi-select action, and a per-execution chip
list — none of which exist in the shipped UI. Not part of the formal 202-case V1-TEST-CYCLE-7.1.0.md (this
feature isn't in that doc's scope at all), tested directly against the production feature ticket per explicit
user request.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — BUG-TCM-036 covers the backfill migration crash (a
  different, data-layer issue); no existing bug covers the missing UI integration or the broken legacy display
  column.

## Production report

Reported to production `ztflux` as #122104 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).

---

## Production history (synced from #122104 on 2026-10-08)

### 2026-10-06 09:16 UTC — Vaishnavi Bhawsar

Fixed. On a Run's execution view, you can now link an existing defect straight from the bulk action bar — select one or more failed/blocked rows, type the defect's issue ID, and click "Link existing defect". Linked defects now show as removable chips in the Defects column (this column was previously always showing "No defects" even when a defect was linked — that display bug is fixed too). Each chip has an × to unlink it.

For QA:
1. Open a Run's execution view with at least one Failed or Blocked result (e.g. http://localhost:3011/runs/1?project_id=alpha-web).
2. Check the row's checkbox — the bulk action bar appears at the bottom with a "Link existing defect" box.
3. Enter a real defect (Bug tracker) issue ID from the same project and click "Link existing defect".
4. Confirm the page reloads and the Defects column for that row now shows the linked defect as a chip with an × remove control, instead of "No defects".
5. Click the × on the chip and confirm the defect is removed from the row.
6. Try linking a defect to a Passed row — it should be refused (a defect can only be linked to a failed/blocked execution).

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed (commit d75291d). A "Link existing defect" picker now appears on the Run execution grid once rows are selected, successfully links a real defect (201 Created, ExecutionDefect row created), and the per-execution "Defect ID's" column now correctly reflects real links instead of unconditionally showing "No defects." Note: a separate, later product decision is to retire this same bulk panel in favor of consolidating onto the Add Result flow (see BUG-TCM-014/048 locally) — that is a new scope change, not a reopening of this bug; the UI gap this bug reported is genuinely fixed.
