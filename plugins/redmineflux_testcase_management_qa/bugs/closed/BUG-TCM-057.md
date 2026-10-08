# BUG-TCM-057

> **CLOSED — 2026-10-07.** Production #122768 (https://flux.zehntech.com/issues/122768) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-057
- Production Redmine Issue ID: #122768 (https://flux.zehntech.com/issues/122768) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority High, Defect Severity High-severity
- Title: A defect mistakenly linked to the wrong test case can never actually be unlinked
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

Scenario: a defect (e.g. #127) was mistakenly linked to **Test Case A** when it actually belongs to **Test Case B**.
Expected fix: open Add Result on Test Case A, remove the defect via the × in the Defects field, change the
result if needed, submit -- then link the defect to Test Case B instead.

The status/result change itself works correctly (submitting a new status after removing the chip succeeds, no
error). **But the defect is never actually unlinked from Test Case A** -- it keeps showing as linked in the run's
defect count/list, Reports, and anywhere else this plugin reads "which defects does this test case have."
Deleting the relation from the issue's own **Relations** section (Redmine's standard related-issues panel) also
does not fix it -- it removes the on-screen relation but does not clean up this plugin's own internal defect-link
records, so the defect still counts as linked anyway.

Net effect: there is currently no way to fully and permanently sever a mistakenly-linked defect from a test case
once any of its results has carried that defect, via any UI path this plugin or Redmine core exposes.

## Root cause

Three representations of "defect X is linked to test case Y" exist and are meant to be kept in sync by
`ExecutionDefects::Linker` (`app/services/execution_defects/linker.rb`): the `execution_defects` join table
(authoritative), the `issue_status_results.defect_ids` CSV column (derived cache), and the
`IssueRelation(relation_type: 'defect')` (the issue-page representation).

**Path 1 -- Add Result's Defects field never actually updates the row that matters.**
`IssueStatusResultsController#create` (the single, non-bulk Add Result action a human uses) *always inserts a
brand-new* `IssueStatusResult` row (@`issue.issue_status_results.new(...)`, line 62) -- it never updates an
existing row's `defect_ids` in place. The CSV->join reconcile (`Linker.reconcile_from_csv`) only fires via
`IssueStatusResult#after_save, if: :saved_change_to_defect_ids?` -- which requires an **existing** row's
`defect_ids` column to actually change. Since "removing" a defect in the Add Result modal always produces a
**new, separate result row** instead of editing the old one, the old row's `defect_ids` never changes, the
reconcile never runs for it, and its `ExecutionDefect` join row is never destroyed. The run's defect view
intentionally aggregates defects across **every** result ever recorded for that issue in the run/testsuite/
environment scope (by deliberate design -- a later Pass doesn't make an earlier, still-open defect stop being
relevant) -- so the old, untouched link keeps showing up forever.

**Path 2 -- the Relations panel's delete is Redmine core, with zero awareness of this plugin's join table.**
Deleting an `IssueRelation` via Redmine's own standard relation-delete endpoint only touches the
`issue_relations` table. `ExecutionDefect#cleanup_relation_and_csv` (the code that recomputes the CSV and
retires the relation) is wired as a `before_destroy` **on `ExecutionDefect` itself** -- it only runs when the join
row is destroyed, directly or via a cascade from its parent result. There is no hook running in the other
direction, so deleting the relation leaves the `ExecutionDefect` row and the `defect_ids` CSV both stale.

**No working alternative UI exists either.** The plugin used to have a bulk "Link existing defect" panel with a
per-chip unlink (x) on the Run's defect column, but it was removed entirely by product decision while fixing a
prior defect-linking bug (BUG-TCM-048) -- the code's own comments confirm "the per-chip unlink (x) control... is
also removed now (the Defect ID's column is plain, read-only id display), so there is nothing left in this file
to wire it up to." So Add Result's own Defects multi-select is the only remaining UI path meant to change a
link -- and it's broken for this exact purpose, per Path 1 above.

## Steps to reproduce

1. Link a defect to a Failed/Blocked test case (Test Case A).
1. Open Add Result on Test Case A, remove the defect from the Defects field (x or Backspace), change Status to
  something that doesn't require a defect (e.g. Retest), and Submit. The submit succeeds.
1. Check the run's defect count / defect list for Test Case A (or query `ExecutionDefect.linked_defects`).
1. Separately: go to the defect issue's own page, find the relation to Test Case A in the Relations section, and
  delete it.
1. Re-check the run's defect count / defect list for Test Case A again.

## Expected result

After step 2, the defect should no longer be counted/shown as linked to Test Case A. After step 4 (deleting the
relation), the defect should likewise no longer be counted/shown as linked anywhere.

## Actual result

After step 2: the defect still shows as linked -- confirmed via `ExecutionDefect.linked_defects` still returning
it, the old `IssueStatusResult` row's `defect_ids` column unchanged, and its `ExecutionDefect` join row
untouched. After step 4 (relation deleted): the `IssueRelation` is genuinely gone, but the `ExecutionDefect` join
row and the `defect_ids` CSV still exist -- `ExecutionDefect.linked_defects` still returns the defect.

## Evidence

Clean run #51 (testsuite "Authentication", environment "CI"), Test Case A = issue #3, defect = issue #15
(standing in for the originally-reported #127 -- same tracker/mechanism).

```
Baseline: linked defect 15 to issue 3 as Failed via POST /issue_status_results.json
  -> IssueStatusResult #846 (issue 3, case_status_id 3/Failed, defect_ids "15")
  -> ExecutionDefect #107 (issue_status_result_id 846, defect_issue_id 15)
  -> IssueRelation #1 (issue_from 3, issue_to 15, relation_type "defect")
```

Real browser: opened Add Result on issue 3, removed the x chip (chips: []), changed Status to Retest
(does not require a defect), submitted -> POST /issue_status_results -> 200 OK.

DB state immediately after:
  IssueStatusResult.where(run_id:51, issue_id:3) =>
    [840, case_status_id 1, defect_ids nil]   -- seeded Untested, untouched
    [846, case_status_id 3, defect_ids "15"]  -- the ORIGINAL Failed row -- COMPLETELY UNCHANGED
    [847, case_status_id 4, defect_ids ""]    -- a NEW row for the Retest submit -- this is what "worked"

  ExecutionDefect.joins(:issue_status_result).where(issue_status_results: {issue_id:3, run_id:51})
    => [[107, 846, 15]]   -- still exists, still pointing at the stale row

  ExecutionDefect.linked_defects(issue: Issue.find(3), run: Run.find(51), environment: "CI")
    => [15]   -- STILL reports defect 15 as linked to Test Case A, despite the "successful" removal+submit

Then: DELETE /relations/1.json -> 204 No Content (relation genuinely deleted).

DB state immediately after:
  IssueRelation.where(issue_from_id:3, issue_to_id:15) => []          -- gone, as expected
  ExecutionDefect.where(issue_status_result_id: 846, defect_issue_id: 15) => [still id 107, untouched]
  IssueStatusResult.find(846).defect_ids => "15"                      -- still there
  ExecutionDefect.linked_defects(...) => [15]
    -- STILL linked, even after explicitly deleting the relation expected to fully sever it

## Suggested fix

Make Add Result's Defects field actually **update** the relevant existing result rather than always inserting a
new one -- route the single Add Result action through the same seeded-Untested-transition/update logic the bulk
and CI paths already use via `IssueStatusResultWriter`/`Linker.reconcile_from_csv`, since an in-place
`defect_ids` change is exactly what triggers the CSV->join reconcile correctly. Separately, the Relations-panel
gap could be closed by hooking Redmine's `IssueRelation` deletion (e.g. via an `after_destroy` scoped to
`relation_type: 'defect'`) to also destroy any matching `ExecutionDefect` rows -- today that direction of cleanup
simply doesn't exist.

## QA reference

Local bug file: bugs/open/BUG-TCM-057.md . Test case: TC-TCM-271 (TESTCASE_MANAGEMENT_TEST_RUNS.md).

---

## Production history (synced from #122768 on 2026-10-08)

### 2026-10-07 10:27 UTC — Sourabh Singh

## Additional notes (2026-10-07) — Run page's defect-count metrics are inconsistent in 3 different ways

While verifying this bug, two related counting problems were found on the Run page and Runs listing page. Noting them here since they involve the same defect-linking machinery this bug is about.

### 1. "Defect Count :" on the Run detail page double-counts a defect shared across test cases

`RunsHelper#count_defects` (`app/helpers/runs_helper.rb:99-107`) sums each test case's own linked-defect count instead of counting distinct defects once:

```
def count_defects(run, environment)
  defects_count = 0
  run.issues.each { |d| defects_count += defect_ids(d, environment, run).size }
  defects_count
end
```

Confirmed live on run #48 (environment "CI"): defect #15 is linked to 4 different test cases and #16 to 1 — only **2** distinct defects, but "Defect Count :" shows **5** (1+1+2+1). Expected: 2 (count of distinct defects linked anywhere in the run/environment), not a sum of per-test-case counts.

### 2. A cross-project defect silently disappears from every count and column

Run #33 (`compat-fresh-project`, environment "Window 11 + Chrome"): a Failed result carries `defect_ids: "92"` in its raw column, but defect #92 belongs to a **different project** (qa-demo) than the test case (compat-fresh-project). `ExecutionDefects::Linker`'s cross-project check correctly rejects the link (by design — no cross-project linking), so no `ExecutionDefect` join row and no `IssueRelation` were ever created for it. Confirmed: `ExecutionDefect.linked_defects` for that test case returns only `[116, 121]`, never 92, and the real Run page's "Defect ID's" column shows only "#116, #121" — #92 is invisible everywhere even though the raw column still says "92". A tester who linked that defect would see no trace of it anywhere.

### 3. A THIRD, separately-broken counting mechanism on the Runs listing page

The Runs listing page's "TOTAL DEFECTS" column (`_active_run.html.erb` / `_closed_run.html.erb`) shows yet a different number again for the same run #33: **"1"**, versus the detail page's **"4"** (see point 1) and the true distinct count of **3** (`#116`, `#121`, `#110`, the defects actually linked across this run's two executed test cases).

Root cause: `TestSuitesHelper#total_defect_count` (`app/helpers/test_suites_helper.rb:203-209`) is a **7th call site** using the same stale-scalar-column anti-pattern already fixed at 5 sites by BUG-TCM-050 and found unfixed at a 6th site (the Relations panel) in BUG-TCM-058:

```
def total_defect_count(run)
  defect_ids = Setting.plugin_redmineflux_testcase_management['defected_tracker']&.map(&:to_i)
  issueIds = IssueRelation.where(issue_from_id: run.issues, relation_type: "defect").pluck(:issue_to_id)
  defects = Issue.where("issues.id IN (?) AND issues.tracker_id IN (?) AND issues.run_id = ?", issueIds, defect_ids, run.id)
  return defects.count
end
```

It filters by `issues.run_id = run.id` — the defect issue's own single scalar `run_id` column (set once, to whichever run it was first linked from), not the `ExecutionDefect` join. Confirmed live: defect #116's own `run_id` is blank, #110's is blank, but #121's happens to equal 33 — so only #121 survives the filter, giving count = 1 instead of the real 3. (The same query also surfaced defect #119 via a stale `IssueRelation` that no longer corresponds to any current result's `defect_ids` at all — consistent with this bug's main finding that old links are never cleaned up.)

### Net picture

Three different places in the UI show three different numbers for "how many defects does run #33 have": Run detail page **4** (double-counts shared defects), Runs listing page **1** (stale-scalar `run_id` filter drops almost everything), true distinct count **3**. None of the three agree, and a cross-project link can vanish from all of them with zero indication to the user.

QA reference: local notes in `bugs/open/BUG-TCM-057.md`, TC-TCM-271 (`TESTCASE_MANAGEMENT_TEST_RUNS.md`).

### 2026-10-07 10:27 UTC — Sourabh Singh

## Additional notes (2026-10-07) — Run page's defect-count metrics are inconsistent in 3 different ways

While verifying this bug, two related counting problems were found on the Run page and Runs listing page. Noting them here since they involve the same defect-linking machinery this bug is about.

### 1. "Defect Count :" on the Run detail page double-counts a defect shared across test cases

`RunsHelper#count_defects` (`app/helpers/runs_helper.rb:99-107`) sums each test case's own linked-defect count instead of counting distinct defects once:

```
def count_defects(run, environment)
  defects_count = 0
  run.issues.each { |d| defects_count += defect_ids(d, environment, run).size }
  defects_count
end
```

Confirmed live on run #48 (environment "CI"): defect #15 is linked to 4 different test cases and #16 to 1 — only **2** distinct defects, but "Defect Count :" shows **5** (1+1+2+1). Expected: 2 (count of distinct defects linked anywhere in the run/environment), not a sum of per-test-case counts.

### 2. A cross-project defect silently disappears from every count and column

Run #33 (`compat-fresh-project`, environment "Window 11 + Chrome"): a Failed result carries `defect_ids: "92"` in its raw column, but defect #92 belongs to a **different project** (qa-demo) than the test case (compat-fresh-project). `ExecutionDefects::Linker`'s cross-project check correctly rejects the link (by design — no cross-project linking), so no `ExecutionDefect` join row and no `IssueRelation` were ever created for it. Confirmed: `ExecutionDefect.linked_defects` for that test case returns only `[116, 121]`, never 92, and the real Run page's "Defect ID's" column shows only "#116, #121" — #92 is invisible everywhere even though the raw column still says "92". A tester who linked that defect would see no trace of it anywhere.

### 3. A THIRD, separately-broken counting mechanism on the Runs listing page

The Runs listing page's "TOTAL DEFECTS" column (`_active_run.html.erb` / `_closed_run.html.erb`) shows yet a different number again for the same run #33: **"1"**, versus the detail page's **"4"** (see point 1) and the true distinct count of **3** (`#116`, `#121`, `#110`, the defects actually linked across this run's two executed test cases).

Root cause: `TestSuitesHelper#total_defect_count` (`app/helpers/test_suites_helper.rb:203-209`) is a **7th call site** using the same stale-scalar-column anti-pattern already fixed at 5 sites by BUG-TCM-050 and found unfixed at a 6th site (the Relations panel) in BUG-TCM-058:

```
def total_defect_count(run)
  defect_ids = Setting.plugin_redmineflux_testcase_management['defected_tracker']&.map(&:to_i)
  issueIds = IssueRelation.where(issue_from_id: run.issues, relation_type: "defect").pluck(:issue_to_id)
  defects = Issue.where("issues.id IN (?) AND issues.tracker_id IN (?) AND issues.run_id = ?", issueIds, defect_ids, run.id)
  return defects.count
end
```

It filters by `issues.run_id = run.id` — the defect issue's own single scalar `run_id` column (set once, to whichever run it was first linked from), not the `ExecutionDefect` join. Confirmed live: defect #116's own `run_id` is blank, #110's is blank, but #121's happens to equal 33 — so only #121 survives the filter, giving count = 1 instead of the real 3. (The same query also surfaced defect #119 via a stale `IssueRelation` that no longer corresponds to any current result's `defect_ids` at all — consistent with this bug's main finding that old links are never cleaned up.)

### Net picture

Three different places in the UI show three different numbers for "how many defects does run #33 have": Run detail page **4** (double-counts shared defects), Runs listing page **1** (stale-scalar `run_id` filter drops almost everything), true distinct count **3**. None of the three agree, and a cross-project link can vanish from all of them with zero indication to the user.

QA reference: local notes in `bugs/open/BUG-TCM-057.md`, TC-TCM-271 (`TESTCASE_MANAGEMENT_TEST_RUNS.md`).

### 2026-10-07 10:33 UTC — Sourabh Singh

## Correction to point 2 of the previous note (2026-10-07)

Point 2 of my earlier note ("A cross-project defect silently disappears from every count and column") needs a
correction after checking the real UI directly.

I had found result #741 (run #33, issue #109) carrying `defect_ids: "92"` even though defect #92 belongs to a
different project, and concluded a tester could trigger this invisible-link state. **That conclusion was wrong.**
Checked live: both real UI paths correctly block a cross-project link **with a visible error**:
- The issue's own **Relations** tab shows "Related issue doesn't belong to the same project: #92" when adding it
  there.
- Add Result's **Defects** field search returns "No defect found for this testcase" for a cross-project id — there
  is nothing to select in the first place.

So a human tester cannot produce the `defect_ids: "92"` state through the product at all. Result #741 is old
fixture data, almost certainly written by a raw API call during an earlier API/compat-testing cycle, not by a
real user action. **Downgrading this from "a bug a tester can hit" to an API/data-layer-only observation**: a
direct write to `IssueStatusResult.defect_ids` (e.g. CI ingestion, or the MCP `report_defect` tool's
`defect_issue_id` branch) does not reject a cross-project id up front the way the UI does — it silently never
links it instead. That is worth tightening for API/CI callers, but it is not a user-facing defect, and should
not be read as "linking a defect through the app can make it vanish" — the app's own validation is correct and
visible everywhere a human can actually act.

Point 1 (defect-count double-counting) and point 3 (the `total_defect_count` stale-scalar-column anti-pattern,
7th call site matching BUG-TCM-050/058) both remain as reported — those are independent, genuinely UI-reachable
findings using same-project defects, unaffected by this correction.

### 2026-10-07 11:13 UTC — Vaishnavi Bhawsar

Fixed, using the scope we agreed on: the Relations section's own remove link is now the one real way to fully sever a mistakenly-linked defect — it clears the link everywhere it was recorded (every run), not just on screen.

Removing the defect from a new result's Defects field and submitting still won't retroactively edit a past result (that's intentional — an earlier, still-open defect shouldn't quietly disappear just because a later result passed). The real fix is on the delete side: deleting the relation from the issue's Relations section now actually finishes the job it looked like it was already doing — it clears the internal link records and recomputes every affected result's defect list, for every run that link touched, not just the one shown here.

While checking this, also looked carefully at the extra notes you added and fixed both:
- The run page's own "Defect Count" was adding up each test case's defects separately, so one defect shared across several test cases got counted more than once. It now counts each distinct defect once.
- The Runs list's "Total Defects" column was quietly dropping almost every defect that wasn't first reported from that exact run. It now counts every defect genuinely linked anywhere in that run.

(The cross-project defect disappearing is expected, by design — cross-project linking is deliberately blocked, so no code change there.)

Screenshot attached: deleted the relation for a defect linked across 2 runs, and the entire row disappeared cleanly — no leftover trace anywhere.

For QA:
1. Link a defect to the wrong test case, across more than one run if possible.
2. Delete the relation from the Relations section (the × icon).
3. Confirm the defect no longer appears in: the run's Defect Count, the Defect ID's column, Reports, or the Relations section itself — in every run it was linked through, not just one.
4. Separately, check a run's own Defect Count and the Runs list's Total Defects column both now show sensible, matching numbers for a defect shared across multiple test cases or linked from elsewhere.

### 2026-10-07 12:27 UTC — Sourabh Singh

Retested on fresh master (commit `1f671e0`, which cites this bug by name). The fix adds an `after_destroy` hook on `IssueRelation` (scoped to `relation_type: 'defect'`) that destroys every `ExecutionDefect` row for that exact (testcase, defect) pair across every run/execution, not just a per-run partial cleanup.

Confirmed live: linked defect #16 to a test case across 2 different runs, deleted the relation, and verified -- `ExecutionDefect` rows for that pair across ALL runs are now genuinely gone, `linked_defects` no longer returns it for either run, and the stale `defect_ids` CSV column is correctly recomputed/cleared. Closing.
