# Bug Report

- Bug ID: BUG-TCM-148
- Production Redmine Issue ID: #128488 — reported via `report_defect`, linked to testcase RFTC026-5 (#128453, suite #532) on Run #659 ("Testcase Release 7.3.0 Sign-off"), environment "Window 11 + Chrome". Target Version set to "Testcase Management plugin Release 7.3.0" (id 2070).
- Title: `GET /runs.json` (Runs & Results list) issues one extra SQL query per milestone-linked run (N+1) when Milestones (rtc-026, #127767) is enabled — scales linearly with run count
- Redmine version: 6.0.11 (Docker, localhost:3000)
- Plugin name: Redmineflux Testcase Management
- Plugin version: `master`, commit `dc7f7ff` ("Fix four issues found while testing the 7.4.0 release")
- Environment: Local Docker (Postgres)
- Browser: N/A — confirmed via API/backend (Rails integration-session request with real API-key auth), not a browser session
- User role: Administrator
- Date: 2026-11-16

## Steps to reproduce

1. On a project with multiple Runs, where several Runs have `version_id` set (i.e., linked to a Milestone) — this
   repro used `rftc-016-ci-qa` (project id 2): 46 total runs, 40 of them milestone-linked.
2. With plugin setting **Enable Milestones = OFF**, request `GET /runs.json?project_id=2` and capture the SQL
   query log for the request.
3. Set **Enable Milestones = ON** and repeat the exact same request, capturing the SQL query log again.
4. Compare the two logs.

## Expected result

- Turning Milestones ON should add at most a small, constant number of extra queries to this list endpoint (ideally
  the milestone name should be eager-loaded in the same batch as the rest of the run data) — it should not scale
  with the number of runs in the project. This is the same "shared-cells, fetched once" principle the feature's own
  performance target (spec §10) requires for the Milestones pages themselves.

## Actual result

- With Milestones OFF: request completes normally, no `versions` table queries appear in the log at all (the
  `if milestones_json?` guard correctly short-circuits).
- With Milestones ON: the SQL log shows **40 separate, identical-shape queries** —
  `SELECT "versions".* FROM "versions" WHERE "versions"."id" = $1 LIMIT $2` — each with a different bound id, one
  per milestone-linked run. This count (40) matches **exactly** the number of milestone-linked runs in the project
  (also 40) — a clean 1:1 N+1, not measurement noise.
- Root cause (confirmed by reading the code, `app/controllers/runs_controller.rb`, `index` action, ~lines 48–73):
  ```ruby
  @runs = Run.where(project_id: @project.id)
  if @runs.exists?
    serialized_runs = @runs.map do |run|
      { ... }.tap do |row|
        # rtc-026: only present when Milestones are on, so the JSON is unchanged otherwise
        row[:milestone] = rftc_milestone_json(run) if milestones_json?
      end
    end
  ```
  `rftc_milestone_json(run)` calls `run.milestone&.name`, which lazy-loads the `belongs_to :milestone` association
  per row since `@runs` is never eager-loaded with `.includes(:milestone)`.
- Functional correctness of the feature itself is **not** affected — the returned `milestone` JSON values are
  correct (separately confirmed via `TestcaseManagement::MilestoneSummary` / the MCP summary endpoint returning
  matching, unchanged stats). This is purely an extra-cost-per-row performance issue, not a data-correctness bug.
- Scales linearly: a project with hundreds of milestone-linked runs would issue hundreds of extra single-row
  queries on every load of this list endpoint.

## Evidence

### Screenshot

- N/A — this is a backend JSON API endpoint with no visual UI surface; evidence is the captured SQL query log
  below.

### Console / log

Two consecutive real SQL-log captures for `GET /runs.json?project_id=2`, same session, only the `enable_milestones`
plugin setting changed between them (captured via `ActiveSupport::Notifications.subscribe('sql.active_record')`
in a Rails integration-session test — no code changes made to produce this evidence):

```
OFF: 67 total queries, 0 queries against "versions"
ON:  101 total queries, 40 queries against "versions" — all of the exact shape:
     SELECT "versions".* FROM "versions" WHERE "versions"."id" = $1 LIMIT $2

Sanity check:
  project 2 total runs: 46
  project 2 runs with version_id present: 40   <-- matches the 40 extra queries exactly
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — checked `bugs/_duplicates.md` and `bugs/_index.md`; this is
  distinct from BUG-TCM-130 (Quality HQ's unrelated, much larger-scale N+1 in the ranked-list panels, already
  fixed), BUG-TCM-131 (Requirements page's ignored `limit` param), and the three now-fixed RFTC026-32/33/34
  API gaps on the same feature ticket #127767 — this is a new, separate performance defect.

## Notes

- Found while executing `RFTC026-5` (query-count baseline) in
  `plugins/redmineflux_testcase_management_qa/testcases/RFTC-026_EXTERNAL_SPEC_TESTCASE_MILESTONES.md`, during a
  2026-11-16 retest of feature #127767 (rtc-026 Testcase Milestones) after commits `01bee8f`/`dc7f7ff` fixed the
  three previously-filed API/automation gaps (RFTC026-32/33/34) on that same ticket.
- Suggested fix (not applied — QA does not patch app code): `@runs = Run.where(project_id: @project.id).includes(:milestone)`
  before the `.map` in `RunsController#index`. This is a standard Rails eager-load; it does not change the response
  shape or any returned value, only batches the milestone lookups into one additional `IN (...)` query instead of
  N single-row queries. The fix is DB-agnostic (plain ActiveRecord `includes`, no raw SQL) — behaves identically on
  PostgreSQL, MySQL, and MariaDB.
- **Verified 2026-11-16 that the HTML Runs & Results list page does NOT have this bug** — confirmed via Playwright
  (page load timing comparable with Milestones ON vs OFF — ~1.6–1.8s both times, no N+1 signature) and via source:
  `RunsController#index` line 116 builds `@milestone_names = ...@project.shared_versions.pluck(:id, :name).to_h`
  — a single query building a lookup hash — and the HTML views (`_active_run.html.erb`/`_closed_run.html.erb`)
  read from that hash per row (`@milestone_names[run.version_id]`), with zero extra queries regardless of run
  count. The buggy JSON path (line 73, `rftc_milestone_json(run)` → `run.milestone&.name`) is a separate,
  N+1-prone pattern that does the **same lookup the wrong way**, 43 lines away from an already-correct example in
  the same file. This makes the suggested fix even more clear-cut: reuse the existing `@milestone_names` hash in
  `rftc_milestone_json`/the `index` JSON branch instead of touching the `belongs_to :milestone` association at
  all, rather than merely adding `.includes(:milestone)`.
