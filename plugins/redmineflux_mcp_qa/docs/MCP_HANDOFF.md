# Handoff — Redmineflux MCP Server

## Last Session

- Date: 2026-11-20
- Redmine Version: 6.0-bookworm (local Docker instance, localhost:3015)
- Environment: Local (`C:\crux-redmine`) + production `ztflux`

## Completed This Session

- Created a production Test Case (#129187, "MCP_DEVOPS_TOOL_COVERAGE — DevOps MCP tool-layer direct coverage
  (#128756)") for `testcases/MCP_DEVOPS_TOOL_COVERAGE.md`, moved into suite #308 "MCP", description lists all
  12 TCs with their results; estimated hours set to 0.75h (from `TIME_LOG.md`'s actual testing time).
- Production ticket **#128756** ("Complete DevOps plugin tool coverage") reviewed against its own 9 acceptance
  criteria and marked **Done/100%**, with a QA sign-off note listing what passed and two caveats on record (not
  literally screen-compared for every new read tool beyond incidents; the dev team's own unit-suite claim not
  independently re-run by QA).
- See `plugins/redmineflux_crux_qa/docs/CRUX_HANDOFF.md`'s 2026-11-19/2026-11-20 entries for the BUG-MCP-002/003
  retest-and-close detail (pull+rebuild `mcp` to RMCP-049/050, 1.0.12/1.0.13) — that work spans both plugins
  since the fixes live in `redmineflux-mcp` but the test suite is `MCP_DEVOPS_TOOL_COVERAGE.md` here.

## In Progress

- Nothing currently in progress.

## Blockers

- None.

## Next Session Start Point

- `bugs/open/` is empty (all 3 MCP bugs closed). The ~45 of 68 DevOps tools not yet directly exercised (per
  `MCP_DEVOPS_TOOL_COVERAGE.md`'s own "Notes for whoever executes this suite" section — write tools like
  `save_dashboard`, `save_freeze`, `update_settings`, `create_branch`, etc.) are a reasonable next-pass target.
- The installation/configuration and permissions suites from the original scaffold are still the right order
  for anything not yet executed in `testcases/`.

## Open Bugs Found

- None — all 3 (BUG-MCP-001/002/003) closed, production synced.

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-11-19 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Sourabh Singh) | Wrote and executed `MCP_DEVOPS_TOOL_COVERAGE.md` directly at the MCP tool layer (no chat) per ticket #128756's own acceptance criteria — tool registration (0→68), permission-denial messaging, read-only mode blocking, "Error:" prefix convention, 8 pre-existing tools regression-checked, a 14-tool representative sweep, and `/api/devops` permission parity for 2 real non-admin users. 7/8 TC blocks PASS; found **BUG-MCP-003** (list_builds/list_commits missing the id get_build/get_commit require). BUG-MCP-002 (create_testcase 500 on test_suite_id) also retested and confirmed fixed this day after pulling+rebuilding `mcp` (RMCP-049, 1.0.12). Both closed, production synced to Done/100%. |
| 2026-11-20 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Sourabh Singh) | Created production Test Case #129187 for `MCP_DEVOPS_TOOL_COVERAGE.md`, moved into suite #308 "MCP", 0.75h estimated. Reviewed #128756 against its own 9 acceptance criteria and marked Done/100% with a QA sign-off note (2 caveats on record: screen-vs-tool comparison only literal for incidents; dev's own unit-suite claim not independently re-run). |
