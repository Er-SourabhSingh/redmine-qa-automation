# BUG-TCM-014

> **CLOSED — 2026-10-07.** Production #121836 (https://flux.zehntech.com/issues/121836) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-014
- Production Redmine Issue ID: #121836
- Title: The Defects field on a Failed/Blocked Add Result form cannot find or link any existing defect — search always returns "No results found," for every query including blank
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

When recording a **Failed** or **Blocked** result on a test case inside a run, the Add Result panel shows a
required **Defects\*** multi-select (Select2 widget) with a search box, intended to let the user either create a
new defect via the adjacent "Report Defect" button, or **search for and link an already-existing one**. The
search half of this is completely non-functional: typing any query — the exact numeric ID of a real, open defect
in the same project ("1583"), an exact subject-text fragment of that same defect ("TC-TCM-173"), a generic word
("defect"), or no text at all (just opening the dropdown) — always shows **"No results found."**, and **zero
network requests are ever issued** (confirmed via Playwright's network log and `performance.getEntriesByType`),
so this isn't a slow/failing AJAX call — the search mechanism never actually runs.

The only way a defect ever appears in this field is when **"Report Defect" creates a brand-new issue**, which a
JS callback then injects directly into the (otherwise permanently empty) `<select>` as a pre-selected option. This
means a tester can never attach an already-existing defect to a second (or third) failing test case — every
Failed/Blocked result that needs a defect is forced to create its own new issue, even when the real-world defect
behind it already has an open issue from an earlier failure in the same run.

## Steps to reproduce

1. In a run, set any test case's result to **Failed** (or **Blocked**).
2. In the **Defects\*** field, click into the search box and type the exact ID of a real, existing open issue in
   the same project (e.g. a defect reported from a different test case moments earlier).
3. Observe the dropdown.
4. Repeat with an exact subject-text fragment of that same issue, a generic single word, and with the search box
   left empty.

## Expected result

- At least one of the queries (especially the exact numeric ID or exact subject text) returns the matching
  existing defect, allowing it to be selected and linked without creating a duplicate issue.

## Actual result

- Every query, including no query at all, returns **"No results found."** No network request for the search is
  ever made (checked via `browser_network_requests`, which showed zero search/autocomplete/defect-related
  requests across four different query attempts). The underlying `<select>` element itself is the root cause:

```html
<select multiple name="issue_status_result[defect_ids][]" id="issue_status_result_defect_ids"
        class="select2-hidden-accessible" data-select2-id="select2-data-issue_status_result_defect_ids" required>
</select>
```

Zero `<option>` elements, and no `data-ajax`/search-endpoint configuration anywhere on the element — Select2 is
wired to search a permanently empty local data source. The only way this select ever receives an `<option>` is
via "Report Defect"'s own JS success callback injecting the newly-created issue directly, which is why that path
(tested working in BUG-TCM-... TC-TCM-173/175) appears to "work" while the search box next to it does nothing.

## Root cause

The `issue_status_result_defect_ids` Select2 instance is initialized without either (a) a server-rendered list of
the project's existing open defects as `<option>` elements, or (b) an AJAX `data`/`transport` configuration
pointing at a real search endpoint (e.g. an issues-search action scoped to the Defect tracker). Either omission
alone would explain the observed behaviour — no options to filter locally, and no endpoint to query remotely.

## Suggested fix

Wire the `Defects*` Select2 to a real data source: either pre-populate it with the project's current open
Defect-tracker issues (feasible if the list is usually small) or, more scalably, configure Select2's `ajax`
option to hit a search endpoint (e.g. reusing whatever endpoint/logic "Report Defect"'s own issue-creation uses to
build its success payload) filtered by `tracker_id = <configured Defect Tracker>` and `project_id`, so an existing
defect's ID or subject becomes findable and selectable without creating a duplicate issue.

## Evidence

### Screenshot

![Defects search returns "No results found" for every query, including the exact ID of a real open defect](../../screenshots/BUG-TCM-014/defect-search-no-results-found.png)

### Console / log

```
Typed queries tried on the Defects* search box (case #453, Failed status): "1583" (exact ID of a real open
defect, #1583, reported minutes earlier via Report Defect on this same run), "TC-TCM-173" (exact subject
fragment of #1583), "defect" (generic word), "" (empty/just-opened dropdown).
Result for all four: "No results found."

browser_network_requests (static: false) after all four attempts: zero requests matching
search/autocomplete/defect — only pre-existing time_tracker polling and the original page-load GET.

DOM: <select multiple name="issue_status_result[defect_ids][]" id="issue_status_result_defect_ids"
  class="select2-hidden-accessible" required></select>  — zero <option> children, no data-ajax attribute.
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md`:
- TC-TCM-174 (Link an existing defect to a failed execution) — **FAIL**, this is the blocking defect.
- TC-TCM-173/175 (Report a new bug from Failed/Blocked) — **PASS**, unaffected since "Report Defect" injects its
  own option directly rather than relying on the broken search.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers the Defects field's search/link
  mechanism. Distinct from BUG-TCM-011 (that's about Bug-only custom-field validation on tracker mismatch; this
  is the Defects multi-select never having any searchable data at all).

## Reconfirmation (2026-10-05, different instance/version)

Reproduced identically on `localhost:3015` (project `qa-demo`, plugin **v7.1.0** — a newer version than the
`localhost:3010`/v7.0.0 instance this bug was originally filed against), while executing TC-EXEC-01-02
(`docs/qa/V1-TEST-CYCLE-7.1.0.md`, a separate 235-case cycle — see `TESTCASE_MANAGEMENT_HANDOFF.md`'s note on
this being a different test cycle/environment from the rest of this file). Set Status to Failed on a real Add
Result form (issue 14, run 1, Safari environment); typing "17" (an existing defect's exact numeric id, same
project) into the Defects* search box produced "No results found" with **zero network requests fired** — same
symptom as originally documented. Confirmed via DOM: `#issue_status_result_defect_ids` has 0 `<option>`
elements. This bug is **not fixed in 7.1.0** either. The single-result API path (`POST
/issue_status_result/create.json` with `defect_ids` set directly) still works correctly as a workaround,
confirmed separately this same session.

**Extends further than originally scoped**, found while executing TC-EXEC-06-01: even when a testcase already
has a genuine linked defect (a real `IssueRelation(relation_type:'defect')` row, confirmed via Rails console),
opening its Add Result form (`GET /issue_status_results/new`) does **not** pre-populate that existing defect into
the Defects select either — `@selected_defects` renders zero options regardless of whether any defect is
already linked. So this bug covers both halves of the field: it can't search for new defects AND it can't show
already-linked ones.

## Production report

Reported to production `ztflux` as **#121836** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: High (priority_id 3); Defect custom
fields: Type=Functional, Severity=High-severity, Priority=High.

---

## Production history (synced from #121836 on 2026-10-08)

### 2026-10-06 07:24 UTC — Vaishnavi Bhawsar

Fixed, and found exactly why it was happening. The Defects search box really was completely dead — every time the "Add Result" form opened, a small leftover piece of setup code (meant only to pre-fill already-linked defects) was re-initializing the search field in a way that silently threw away its real search connection. That's why typing anything, including a real existing defect's exact ID, always just showed "No results found" with no network request ever firing — confirmed that part of your original report exactly.

Fix is committed and pushed (commit 3400fdd, included with a small batch of related fixes).

I verified it by creating a real open defect linked to a test case, then opening Add Result for that test case and typing the defect's ID into the Defects field — it now correctly shows up in the dropdown and can be selected. Screenshot attached shows the match found and selected.

For QA:
1. In a run, set a test case's result to Failed or Blocked.
2. In the Defects field, type the exact ID of a real existing open defect already related to that test case.
3. Confirm it now appears in the dropdown and can be selected (instead of "No results found").
4. Confirm "Report Defect" still works as before (no regression) and that defects it creates still show up correctly in the field afterward.

### 2026-10-06 13:33 UTC — Sourabh Singh

Reopened 2026-10-06 — retested against master 67631e0 (commit 3400fdd). The search mechanism itself now works (real AJAX requests fire, confirmed via network log), but it is scoped to IssueRelation.where(issue_from_id: issue_id, ...) — defects already related to the exact test case being searched FROM only. This means it can never find a defect that lives on a different test case, which was this bug's actual, central complaint ("a tester can never attach an already-existing defect to a second/third failing test case"). Live-confirmed: searching from test case #41 (no defect ever linked to it) for defect ids 92 or 93 (both real, open, linked to OTHER test cases in the same run) returns "No related issues found" for both — identical in effect to the original symptom. Escalated to the product team, who confirmed the Add Result Defects field is meant to search the whole project's existing defects, not just self-related ones — this is now the confirmed spec requirement, not just a QA interpretation. Not fixed.

### 2026-10-06 13:37 UTC — Sourabh Singh

Evidence for the reopen — the actual documented scenario (search for a defect that lives on a DIFFERENT test case), not a self-referential one:
```
$ curl /bugs/search?term=92&issue_id=41&run_id=18&test_suite_id=6&defect_tracker=5
{"status":"success","data":[],"message":"No related issues found."}

$ curl /bugs/search?term=93&issue_id=41&run_id=18&test_suite_id=6&defect_tracker=5
{"status":"success","data":[],"message":"No related issues found."}
```
Both 92 and 93 are real, open, currently-linked defects (to sibling test cases #37/#39/#42 in the same run) — test case #41 has never had a defect linked to it. Root cause confirmed in search_issues:
```
related_issue_ids = IssueRelation.where(issue_from_id: issue_id, relation_type: 'defect').pluck(:issue_to_id)
```
This scopes strictly to defects already linked to the CURRENT test case, so it can never surface a defect from a different one — structurally the same end result as the original "No results found" symptom, just via a different code path (the AJAX mechanism itself was fixed by commit 3400fdd, the search's scope was not).
Escalated to the product team, who confirmed this Defects field must search the whole project's existing defects, not just self-related ones — now the authoritative spec, not just this QA team's reading of the original report.

### 2026-10-06 14:50 UTC — Vaishnavi Bhawsar

Fixed properly this time -- addressed the actual scoping problem, not just the symptom from before.

The search was only ever looking for a defect that was already linked to the exact test case the form was open for. That's why it could never find a real, existing defect sitting on a different test case -- which, as confirmed, is the whole point of this field. On top of that, it was also comparing candidates against fields a defect issue never has set in the first place, so even loosening that first restriction on its own would still have come back empty. The search now looks across every open defect in the same project, matching the confirmed spec.

Verified directly, reproducing the exact scenario from the reopen: opened Add Result for a test case that has never had any defect linked to it, set it to Failed, and typed the ID of a real, open defect that's linked to a completely different test case in the same run. It now shows up correctly in the dropdown and can be selected (screenshot attached). Also confirmed it correctly does NOT find a defect belonging to a different project, and that "Report Defect" still works exactly as before.

For QA:
1. Pick a test case that has never had any defect linked to it. Set its result to Failed or Blocked.
2. In the Defects field, type the exact ID of a real, open defect that's linked to a DIFFERENT test case in the same project (not this one).
3. Confirm it now appears in the dropdown and can be selected.
4. Confirm a defect from a different project is still correctly not found.
5. Confirm "Report Defect" still works as before.

### 2026-10-07 06:58 UTC — Sourabh Singh

Retested on master `4b5a7a7` (commit "Let the Defects search box actually find a defect from a different test case"). Confirmed live: searching from a test case with zero prior relation to a given defect now correctly finds it, for two independent defects across different test cases in the same run -- the search is no longer limited to defects already linked to the current test case. Closing.
