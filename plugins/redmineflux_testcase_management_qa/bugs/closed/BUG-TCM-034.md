# BUG-TCM-034

> **CLOSED — 2026-10-06.** Production #122076 (https://flux.zehntech.com/issues/122076) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-034
- Production Redmine Issue ID: #122076
- Title: Switching the suite-tree chart's dimension never actually updates the chart — the real data refresh is chained inside a save call that always 404s
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: QA Manager (`qa.manager`)
- Date: 2026-10-05

## Summary

Changing the chart's dimension (Activity/Defects/Result) on the Releases/suite-tree chart widget is supposed to
both re-render the chart with the new dimension's data **and** persist the choice via `POST
/testcase_graph_filter`, so it survives a page reload. Neither half works: the save call 404s every time
(`{"error":"Unauthorized access"}`, every user, every role), and because `testcase_chart.js` only fetches the new
chart data (`GET /show_chart_data`) **inside the save call's `success:` callback**, the chart itself never
refreshes either — switching the dropdown from "Activity" to "Defects" to "Result" silently keeps showing
whatever rendered on initial page load, with no visual indication anything is wrong. Confirmed directly: the
chart's legend values (`Passed: 42, Failed: 8, Blocked: 6, Retest: 4, Skipped: 3`) are byte-identical before and
after switching dimension — the control is completely inert, not just non-persistent.

## Steps to reproduce

1. On the Releases dashboard (`/test_suites/releases?project_id=qa-demo`) chart widget, change the dimension
   dropdown (e.g. Activity → Result).
2. Open the browser console.

## Expected result

- Per the test cycle's own description: the chart partial re-renders with the newly selected dimension's data,
  and after a reload the previously-saved `(start_date, end_date, filter_dimensions)` is restored instead of
  defaulting back to "this month".

## Actual result

- The console immediately logs: `Error saving date range: Not Found` (from
  `testcase_chart-....js:582`), and network shows `POST /testcase_graph_filter.json → 404`.
- **The chart silently never updates.** Captured the chart legend's exact values on a fresh page load
  (`Activity` dimension, the default): `Passed: 42, Failed: 8, Blocked: 6, Retest: 4, Skipped: 3`. Switched the
  dropdown to `Defects`, then to `Result` — the legend values were **identical** after each switch, byte-for-byte.
  There is no visual error shown to the user; the control simply does nothing.
- Root cause, confirmed by reading `app/controllers/test_suites_controller.rb` and
  `assets/javascripts/testcase_chart.js`:
  - `save_testcase_graph_filter` has `before_action :rftc_authorize_suite_read, only: [..., :save_testcase_graph_filter]`.
  - `rftc_authorize_suite_read` does `@project ||= rftc_resolve_project(params[:project_id])`, and 404s
    (`rftc_not_found`) if that resolves to nil.
  - But the only real caller, `assets/javascripts/testcase_chart.js`'s `updateTestcaseGraphFilter()`, POSTs a JSON
    body shaped `{ testcase_graph_filter: { start_date, end_date, filter_dimensions, project_id, user_id } }` —
    there is **no top-level `project_id`** in the request at all, only the nested one inside
    `testcase_graph_filter`. So `params[:project_id]` is always nil for this specific action, and the
    authorization check always 404s, independent of the user's actual permissions.
  - Confirmed with a direct authenticated repro matching the real JS call exactly (same content-type, same nested
    JSON shape, valid CSRF token, logged in as `qa.manager` who has full permissions):
    ```
    POST /testcase_graph_filter.json  (body: {testcase_graph_filter: {..., project_id: 'qa-demo', ...}})
    -> 404 {"error":"Unauthorized access"}
    ```
  - This is distinct from the generic `TestcasesController`-missing bugs (BUG-TCM-033): here the route and
    controller action both genuinely exist and are correctly wired; only the authorization check's parameter
    lookup is wrong for this specific action's request shape.
  - The chart-refresh consequence: `updateTestcaseGraphFilter()` wraps the `GET /show_chart_data` call (which
    fetches the dimension-specific chart partial) inside the save `$.ajax(...).success` handler. Since save always
    404s, `error:` fires instead of `success:`, and `GET /show_chart_data` is **never called at all** — the chart
    partial is never re-fetched, so the dropdown has no visible effect on the page whatsoever.

## Evidence

### Console / log

```
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3015/testcase_graph_filter.json:0
[ERROR] Error saving date range: Not Found @ http://localhost:3015/assets/plugin_assets/redmineflux_testcase_management/testcase_chart-15b7dd38.js:582

$ fetch('/testcase_graph_filter.json', {method:'POST', body: JSON.stringify({testcase_graph_filter:{...project_id:'qa-demo'...}})})
  status: 404
  body: {"error":"Unauthorized access"}
```

## Test case coverage

Found while executing TC-SUITE-06-01 (P3, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — **FAIL**. Initial page load of the
chart (default dimension) renders correctly with no 500; the entire dimension-switching interaction (the TC's
actual described step: "set dimension = by result") does not work at all, and the filter is never saved for
reload either. Also directly relevant to TC-SUITE-06-02 (P3, exploratory charter) — "filter resets" / "a chart
dimension that silently renders empty instead of erroring" is exactly this behavior, except it renders *stale*
rather than empty.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers the graph filter save endpoint.

## Production report

Reported to production 2026-10-05 as **#122076** (`ztflux`), tracker Bug, Priority High, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity High-severity, Defect
priority High. Per explicit user instruction, not linked to any production Test Case/Run.

---

## Production history (synced from #122076 on 2026-10-08)

### 2026-10-06 09:44 UTC — Vaishnavi Bhawsar

Fixed. Two issues, both addressed:
1. save_testcase_graph_filter's authorization check only looked at a top-level project_id param, but the real caller only ever sends it nested under testcase_graph_filter -- so the save 404'd for every user, every role. It now falls back to the nested value.
2. The chart refresh (GET /show_chart_data) was wrongly chained inside the save call's success handler, so a save failure (as above, always) meant the chart never refreshed either, with no visible error to the user. The chart refresh and the filter save are now independent requests -- the chart updates regardless of whether saving the preference succeeds.

Verified end-to-end: switched the dimension dropdown from Activity to Result. Network tab confirmed GET /show_chart_data returned 200 with the new dimension's data (chart legend changed from Passed/Failed/Blocked/Retest/Skipped counts to the Result-dimension breakdown) AND POST /testcase_graph_filter.json returned 201 Created (previously always 404). Reloaded the page afterward and confirmed the dropdown still showed "Result" -- the saved preference now actually persists across reloads. Zero console errors (previously always logged "Error saving date range: Not Found"). Screenshot attached.

For QA:
1. On a project's Releases dashboard, change the chart dimension dropdown (Activity/Defects/Result).
2. Confirm the chart visibly updates with different data for the new dimension (not identical values as before).
3. Reload the page and confirm the dropdown still shows the dimension you last picked, instead of resetting to Activity.
4. Check the browser console -- no "Error saving date range" error should appear.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — confirmed fixed via code read (commit a0d5298). The chart dimension dropdown's refresh is now independent of the preference-save call, so the chart updates even if saving the preference fails.
