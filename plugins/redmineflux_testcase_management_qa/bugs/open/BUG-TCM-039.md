# BUG-TCM-039

- Bug ID: BUG-TCM-039
- Production Redmine Issue ID: #122095
- Title: The Runs & Results "Closed" tab is unreachable whenever the project has at least one Active run — `@current_tab` always resolves to "Active" regardless of the requested `tab` param
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: QA Manager (`qa.manager`)
- Date: 2026-10-05

## Summary

`RunsController#new` (which renders the combined Runs & Results list + Add Run page) computes which tab is
"current" with this logic, independent of any search term:

```ruby
if @active_runs.any?
  @current_tab = 'Active'
elsif @closed_runs.any?
  @current_tab = 'Closed'
else
  @current_tab = params[:tab] || 'Active'
end
```

This only falls back to honoring `params[:tab]` when **both** `@active_runs` and `@closed_runs` are empty. In any
project that has at least one Active run (the overwhelmingly common case — a project with zero active runs is an
edge case, not the norm), `@current_tab` is unconditionally forced to `'Active'`, completely ignoring whatever
tab the request actually asked for. Requesting `?tab=Closed` renders the Active list every time, with no way to
reach the Closed tab's content through this parameter at all.

## Steps to reproduce

1. With a project that has at least one open/Active run (true of essentially every project in real use) and at
   least one closed run too:
2. Request `GET /runs/new?project_id=<id>&tab=Closed` (the same URL the "Closed" tab link itself points to).

## Expected result

- The Closed runs list renders (the closed runs, not the active ones).

## Actual result

- The Active runs list renders instead, every time, as long as any Active run exists. Confirmed directly:
  ```
  GET /runs/new?project_id=qa-demo&tab=Closed   (no search term)
  -> table shows runs 17, 14, 12, 9, 8, 5 — all confirmed is_closed: false
  -> the project's actual 3 closed runs (1, 2, 4) do not appear at all
  ```
- Also reproduces identically **with** a search term present (`?search=1&tab=Closed` shows the same open runs),
  which is the narrower symptom TC-RUN-04-07 set out to probe — but the root cause is unconditional, not limited
  to the search interaction the test case anticipated.

## Evidence

### Console / log

```
$ curl .../runs/new?project_id=qa-demo&tab=Closed  (rendered page)
table rows: 17 (F-EXEC-05 Upsert Test), 14 (CI Race Test), 12 (CI Build Suffix Test #3),
            9 (CI Build Dup Test), 8 (CI Build 1423), 5 (Two-Env Fanout Test)

$ rails runner 'puts Run.where(id:[17,14,12,9,8,5]).pluck(:id,:is_closed)'
[[17,false],[14,false],[12,false],[9,false],[8,false],[5,false]]   # all open, none closed
```

## Test case coverage

Found while executing TC-RUN-04-07 (P3, exploratory, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — the test case's own
framing ("search always lands on the tab actually containing a hit... toggle between tabs manually after a
search") anticipated a narrower search-only inconsistency; live testing found the gap is unconditional and not
search-dependent, confirmed by reproducing it with no search term at all.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers the Runs & Results tab-selection
  logic.

## Production report

Reported to production `ztflux` as #122095 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).
