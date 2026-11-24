# Handoff — Redmineflux MCP Server

## Last Session

- Date: 2026-11-24
- Redmine Version: 6.0-bookworm (local Docker instance, localhost:3015)
- Environment: Local (`C:\crux-redmine`) + production `ztflux`

> Sessions between 2026-11-20 and 2026-11-24 (SDK2/OAuth suite completion, the Nuitka-binary coverage suite,
> BUG-MCP-004/005/006) were tracked in detail across `TIME_LOG.md` and this plugin's bug files; see
> `MCP_SDK2_OAUTH_SIGNIN.md` and `MCP_NUITKA_BINARY_COVERAGE.md` for that work's own status. This section
> always reflects only the most recent session — see Run History below for the full log.

## Completed This Session

- Read production **#129311** (Testcase Management tool coverage, 66→100 tools) and **#129322** (Helpdesk tool
  coverage, 77→87 tools), both "Implemented and ready/released for QA".
- Pulled `redmineflux_testcase_management` (master, rtc-048) and `redmineflux_helpdesk` (master, HD-13) onto
  `C:\crux-redmine`'s `plugins/`; confirmed `redmineflux-mcp` (already 1.1.16) already includes every commit
  both tickets name (`git merge-base --is-ancestor`), so no mcp pull was needed this time.
- Restarted `redmine` + `mcp`; one new core migration ran clean, both plugins re-detected cleanly, both tool
  counts (100 testcase, 87 helpdesk) matched each ticket's acceptance criterion exactly.
- Wrote two new draft suites: `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md` (TC-MCP-056–073) and
  `MCP_HELPDESK_TOOL_COVERAGE_V2.md` (TC-MCP-074–090), covering every capability/acceptance-criterion in both
  tickets. Only the 2 tool-count TCs are executed so far (both PASS).

## In Progress

- The 33 functional TCs across both new suites (TC-MCP-056–071, 073, 074–088, 090) are drafted but not yet
  executed — each needs fixture setup first (see each suite's own "Fixtures needed" section).

## Blockers

- None — fixtures are buildable locally, no external dependency.

## Next Session Start Point

- Build the fixtures listed in `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md` (Enable Milestones, a limited-member
  + non-member user, a second-project test case for the requirement cross-project case, a CI payload) and
  `MCP_HELPDESK_TOOL_COVERAGE_V2.md` (an org + support package + customers, active/inactive products, an import
  CSV, a Manager + Helpdesk Customer fixture), then execute both suites' remaining TCs.
- `bugs/open/` is empty (all MCP bugs closed, including BUG-MCP-006 as of this same day). The ~45 of 68 DevOps
  tools not yet directly exercised (per `MCP_DEVOPS_TOOL_COVERAGE.md`) remain a separate, lower-priority
  next-pass target.

## Open Bugs Found

- None — all 3 (BUG-MCP-001/002/003) closed, production synced.

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-11-19 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Sourabh Singh) | Wrote and executed `MCP_DEVOPS_TOOL_COVERAGE.md` directly at the MCP tool layer (no chat) per ticket #128756's own acceptance criteria — tool registration (0→68), permission-denial messaging, read-only mode blocking, "Error:" prefix convention, 8 pre-existing tools regression-checked, a 14-tool representative sweep, and `/api/devops` permission parity for 2 real non-admin users. 7/8 TC blocks PASS; found **BUG-MCP-003** (list_builds/list_commits missing the id get_build/get_commit require). BUG-MCP-002 (create_testcase 500 on test_suite_id) also retested and confirmed fixed this day after pulling+rebuilding `mcp` (RMCP-049, 1.0.12). Both closed, production synced to Done/100%. |
| 2026-11-20 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Sourabh Singh) | Created production Test Case #129187 for `MCP_DEVOPS_TOOL_COVERAGE.md`, moved into suite #308 "MCP", 0.75h estimated. Reviewed #128756 against its own 9 acceptance criteria and marked Done/100% with a QA sign-off note (2 caveats on record: screen-vs-tool comparison only literal for incidents; dev's own unit-suite claim not independently re-run). |
| 2026-11-24 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Prashant Chaurasia) | Read production #129311 (Testcase Management tool coverage, 66→100 tools) and #129322 (Helpdesk tool coverage, 77→87 tools), both "Implemented and ready/released for QA". Pulled `redmineflux_testcase_management` (master, acf042b→59b232e, rtc-048) and `redmineflux_helpdesk` (master, 8ef93ca→ac86f5b, includes HD-13 846e3a7) onto `C:\crux-redmine`'s `plugins/`; `redmineflux-mcp` was already at 1.1.16 (a8fc38c), confirmed via `git merge-base --is-ancestor` to already include all 4 commits both tickets name. Restarted `redmine` (one new core migration, `AddUniqueIndexOnUsersLogin`, ran clean) and `mcp` (both plugins re-detected with no errors). Live-confirmed both tool counts match each ticket's own acceptance criterion exactly: testcases_management 100 tools, helpdesk 87 tools. Wrote two new draft suites — `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md` (TC-MCP-056–073) and `MCP_HELPDESK_TOOL_COVERAGE_V2.md` (TC-MCP-074–090) — covering every capability/acceptance-criterion in both tickets; only the 2 tool-count TCs are executed (PASS) so far, the rest await fixture setup (Enable Milestones, a limited-permission + non-member user, an org+support package+customers, products, a CSV, a Manager + Helpdesk Customer fixture) before a future execution pass. |
