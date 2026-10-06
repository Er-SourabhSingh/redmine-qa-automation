# BUG-TCM-014

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
