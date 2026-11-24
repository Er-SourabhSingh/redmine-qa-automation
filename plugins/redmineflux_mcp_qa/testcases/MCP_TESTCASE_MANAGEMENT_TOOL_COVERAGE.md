# Test Suite — MCP Server: Testcase Management Full Tool Coverage (production #129311)

> **Status: DRAFTED 2026-11-24 — not yet executed**, except TC-MCP-072 (tool-registration count), which was
> confirmed live while preparing this suite and is marked PASS below.
>
> Source: production ticket **#129311** ("MCP Server: Complete Testcase Management plugin tool coverage"),
> status In QA, done 90%. Implemented as:
>
> | Repository | Branch | Commit | Version |
> |---|---|---|---|
> | redmineflux_testcase_management | master | 59b232e | rtc-048 |
> | redmineflux-mcp | crux_development | 353add8, 08d4b81 (+ b782e62) | 1.1.14 (installed: 1.1.16) |
>
> Both repos were pulled onto `C:\crux-redmine` for this suite: `redmineflux_testcase_management` was
> fast-forwarded `acf042b..59b232e` (new commit, not previously on this stack); `redmineflux-mcp` was already at
> `a8fc38c`/1.1.16 from an unrelated earlier retest this session, which already fast-forwards past all three
> commits this ticket names (confirmed via `git merge-base --is-ancestor`). Stack: Redmine 6.0-bookworm,
> `localhost:3015`, admin API key `a47f42bc539c5bfe3a10cc392838fa5c8d2e7a35`.
>
> TC range: TC-MCP-056 to TC-MCP-073.

## What changed (per the ticket)

- **4 previously-broken milestone tools rewritten** against real endpoints (`get_milestone`, `create_milestone`,
  `update_milestone`, `delete_milestone` — previously always answered "not found", calling a route the plugin
  never had).
- **34 new tools added** (testcases_management: 66 → **100**, confirmed live): milestone report/burndown, run
  reassignment + a run's assignments, defect-execution linking + a run's Defects page, CI bootstrap + results
  upload, exploratory sessions (full lifecycle), Run Comparison, Automation Dashboard, Most Failed/Slow/Flaky,
  Quality HQ, Testcase Activity, requirements (full CRUD + publish + link/unlink), requirement templates, the
  runs a test case is in.
- New plugin-side endpoints live under `/testcase_mcp/` (`app/controllers/apis/`), same permissions/calculations
  as the plugin's own screens; browser controllers/views/`init.rb`/permissions unchanged, routes only appended.

## Fixtures needed (not yet created — needed before execution)

- **Enable Milestones** on in Testcase Management plugin settings (required for the milestone TCs).
- A project with the Testcase Management module enabled, at least one Version (for milestone tests), one Test
  Suite with several test cases, and at least one closed Run with a few results (some Failed, to exercise the
  defect-link and Most Failed/Slow/Flaky tools meaningfully).
- Three fixture users: **Admin** (full access), a **limited member** with only `view_testcase`/`execute_testcase`
  (no `add_requirement`/`edit_requirement`/`delete_requirement`, no `manage_versions`, not an administrator) to
  exercise every named-permission refusal, and a **non-member** (no membership on the project at all) to confirm
  the "not found/no access" message family.
- A small CI payload (JSON) matching the plugin's CI bootstrap/results-upload API shape, for TC-MCP-069.
- At least one requirement-eligible test case in a *different* project (wrong-project tracker) to exercise the
  "only visible same-project testcase-tracker cases are linked, others reported as skipped" rule in TC-MCP-064.

## Positive Cases — Milestones (the 4 rewritten tools + 2 brand-new ones)

- **TC-MCP-056** — Milestone full lifecycle: create → rename (update) → close → reopen → delete, each via its
  MCP tool, each confirmed on the native Roadmap/Milestones pages.
- **TC-MCP-057** — Milestone summary, report, and burndown numbers match the plugin's own Milestones/Roadmap
  screens for the same version.

## Positive Cases — Exploratory Sessions (brand new)

- **TC-MCP-058** — Session lifecycle: create → edit (add a note) → close → confirm a closed session refuses a
  further edit/note/close → delete.

## Positive Cases — Analysis Tools (brand new)

- **TC-MCP-059** — Run Comparison tool: compare two runs of the same suite, confirm the pass/fail/blocked deltas
  match what the native Run Comparison screen shows.
- **TC-MCP-060** — Automation Dashboard tool: confirm automation-source/result figures match the native
  Automation Dashboard screen.
- **TC-MCP-061** — Most Failed / Slow / Flaky lists: confirm each list's top entries match the native screens
  for the same project/date range.
- **TC-MCP-062** — Quality HQ rollup tool: confirm the rolled-up pass-rate/coverage figures match the native
  Quality HQ screen for a project the caller can view.
- **TC-MCP-063** — Testcase Activity tool: confirm the activity feed entries match the native Testcase Activity
  screen (same events, same order).

## Positive Cases — Requirements (brand new)

- **TC-MCP-064** — Requirement full lifecycle: create → update → publish → link test cases → unlink → delete.
  For the link step, pass a mixed set of test case ids (some same-project/testcase-tracker, some from a
  different project or a non-testcase tracker) — confirm only the valid ones are linked and the rest come back
  explicitly reported as skipped, not silently dropped or erroring the whole call.
- **TC-MCP-065** — Requirement templates are administrator-only: as Admin, create/apply a template
  successfully; as the limited member (not an administrator), the same call is refused naming the missing
  permission.

## Positive Cases — Runs, Reassignment, Defects (brand new)

- **TC-MCP-066** — Reassign a test case inside a run to a different assignee; list a run's assignments and
  confirm the new assignee appears.
- **TC-MCP-067** — Link a defect to a specific execution (a failed result) and confirm it appears on a run's
  Defects page tool; unlink it and confirm it's gone from both.
- **TC-MCP-068** — "Runs a test case is in" tool: confirm it lists every run containing a given test case,
  matching the test case's own native "included in these runs" view.

## Positive Cases — CI (brand new)

- **TC-MCP-069** — CI run bootstrap + automation results upload: bootstrap a CI-driven run via the tool, upload
  a small results payload, confirm the run's results and the Automation Dashboard both reflect the upload.

## Negative / Cross-Cutting Cases

- **TC-MCP-070** — Permission enforcement across a representative sample of the new tools (one write-capable
  tool from each group above): the limited member gets a refusal naming the specific missing permission (e.g.
  `add_requirement`, `manage_versions`); the non-member gets "not found, or you don't have access" rather than
  any real data or a generic 500.
- **TC-MCP-071** — `REDMINEFLUX_READ_ONLY=true` blocks every new write tool from this ticket (milestone
  create/update/delete, session create/edit/close/delete, requirement create/update/delete/publish/link/unlink,
  reassign, defect link/unlink, CI bootstrap/upload) with the same BLOCKED message family already confirmed
  for the original 66 tools (`MCP_SDK2_OAUTH_SIGNIN.md` TC-MCP-031 precedent).
- **TC-MCP-072** — Tool registration count matches the ticket's own acceptance criterion: testcases_management
  reports **100 tools** (66 pre-existing + 34 new) once the MCP server restarts against the pulled plugin.

  **Result: PASS.** Confirmed live while pulling the two repos onto `C:\crux-redmine` for this suite (before
  any functional TC above was executed): `docker compose restart mcp` → startup log —
  `INFO:redmineflux-mcp:Loaded plugin: testcases_management — 100 tools (Testcases, test suites, runs, execution
  status results, project mapping — full CRUD)`. Exactly matches the ticket's stated "Testcase tools: 66 → 100."

- **TC-MCP-073** — Existing (pre-#129311) representative tools — `list_testcases`, `get_run`,
  `create_status_result` — still work with no regression against the pulled plugin version (spot-check, not a
  full re-run of every original TC; the ticket's own acceptance criteria call for "no regression," not a full
  66-tool re-certification in this suite specifically).

## Execution Notes

- Follow this repo's established pattern (`MCP_SDK2_OAUTH_SIGNIN.md`, `MCP_NUITKA_BINARY_COVERAGE.md`): native
  MCP tool calls for every positive/negative case, cross-verify each write against the plugin's own native UI
  screen, never trust a tool's own success message alone.
- File any genuine defect per CLAUDE.md §5 (check `bugs/_duplicates.md` first, next number after BUG-MCP-006).
- This file is a **draft awaiting execution** — fixtures listed above (Enable Milestones, the limited-member
  role, a non-member user, a second project for the cross-project requirement-link case) need to be built
  first; none of that setup exists on `C:\crux-redmine` yet as of this write-up.
