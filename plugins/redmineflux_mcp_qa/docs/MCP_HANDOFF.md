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
- Wrote and **fully executed** two new suites: `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md` (TC-MCP-056–073,
  18/18 PASS) and `MCP_HELPDESK_TOOL_COVERAGE_V2.md` (TC-MCP-074–090, 17/17 PASS after reclassification — see
  below). Built all fixtures live: Enable Milestones (plugin setting), a limited-member/non-member/private-project
  trio for the Testcase Management permission TCs, and an org+global-SLA+support-package+products+customer+
  KB-attachment set for Helpdesk, plus an Issue Category + approved-hours budget needed only because
  `redmineflux_budget_and_audit` is also installed on this instance.
- Found, reported, then **closed as not-a-bug BUG-MCP-007**: the new Helpdesk `dashboard` tool's per-ticket
  "SLA breached" badge initially looked like it disagreed with its own aggregate counter and with
  `get_sla_status`/`sla_analytics`/`list_tickets(sla=...)`. Reported to production (#129351), developer
  responded that this was a missing-Sidekiq-worker environment issue, not a code defect. **Independently
  re-verified this claim in full** (not taken on faith) by manually starting `Helpdesk::SlaMonitorWorker`'s
  Sidekiq process against the same stack/DB and confirming all 4 tools converged exactly after one 2-minute
  cron cycle. Closed #129351 (Done/closed-category; "Won't Fix" was attempted first but refused by this
  account's workflow permissions on the Bug tracker). Full before/after evidence in
  `bugs/closed/BUG-MCP-007.md` and as a Known Quirk in `MCP_MEMORY.md`.
- Investigated and ruled out two further apparent bugs as pre-existing, documented, non-regression behavior
  (not filed): a permission-check "bypass" that was actually a fixture user's own incidental cross-project role
  (Helpdesk's Reports gate is intentionally global, not project-scoped, per its own `BUG-HLP-057` comment),
  and `update_project_customer`'s silently-ignored `rf_organization_id` param (organization now lives on the
  customer record only, per `BUG-HLP-064/065`, already fixed before this session).

## In Progress

- Nothing currently in progress — both new suites are complete, 0 open bugs from this round.

## Blockers

- None.

## Next Session Start Point

- Two non-bug tool-gap notes worth raising with the developer if a future round touches these tools again:
  (1) a *non-CI* run has no MCP path to link to a testcase milestone — only `ci_bootstrap_run`'s own
  `milestone` parameter can set one; (2) `get_run_testcases`'s formatted output doesn't surface the per-result
  assignee field `reassign_run_testcases` correctly sets (confirmed present in the raw REST response).
- If a future session needs to test SLA-breach-dependent tools on `C:\crux-redmine`, start Sidekiq first (see
  `MCP_MEMORY.md`'s Known Quirks) — this stack has no Sidekiq service in `docker-compose.yml` by default.
- The ~45 of 68 DevOps tools not yet directly exercised (per `MCP_DEVOPS_TOOL_COVERAGE.md`) remain a separate,
  lower-priority next-pass target.

## Open Bugs Found

- None — BUG-MCP-001 through BUG-MCP-006 all closed, production synced. BUG-MCP-007 closed same-day as
  not-a-bug (see above), never left open.

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-11-19 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Sourabh Singh) | Wrote and executed `MCP_DEVOPS_TOOL_COVERAGE.md` directly at the MCP tool layer (no chat) per ticket #128756's own acceptance criteria — tool registration (0→68), permission-denial messaging, read-only mode blocking, "Error:" prefix convention, 8 pre-existing tools regression-checked, a 14-tool representative sweep, and `/api/devops` permission parity for 2 real non-admin users. 7/8 TC blocks PASS; found **BUG-MCP-003** (list_builds/list_commits missing the id get_build/get_commit require). BUG-MCP-002 (create_testcase 500 on test_suite_id) also retested and confirmed fixed this day after pulling+rebuilding `mcp` (RMCP-049, 1.0.12). Both closed, production synced to Done/100%. |
| 2026-11-20 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Sourabh Singh) | Created production Test Case #129187 for `MCP_DEVOPS_TOOL_COVERAGE.md`, moved into suite #308 "MCP", 0.75h estimated. Reviewed #128756 against its own 9 acceptance criteria and marked Done/100% with a QA sign-off note (2 caveats on record: screen-vs-tool comparison only literal for incidents; dev's own unit-suite claim not independently re-run). |
| 2026-11-24 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Prashant Chaurasia) | Read production #129311 (Testcase Management tool coverage, 66→100 tools) and #129322 (Helpdesk tool coverage, 77→87 tools), both "Implemented and ready/released for QA". Pulled `redmineflux_testcase_management` (master, acf042b→59b232e, rtc-048) and `redmineflux_helpdesk` (master, 8ef93ca→ac86f5b, includes HD-13 846e3a7) onto `C:\crux-redmine`'s `plugins/`; `redmineflux-mcp` was already at 1.1.16 (a8fc38c), confirmed via `git merge-base --is-ancestor` to already include all 4 commits both tickets name. Restarted `redmine` (one new core migration, `AddUniqueIndexOnUsersLogin`, ran clean) and `mcp` (both plugins re-detected with no errors). Live-confirmed both tool counts match each ticket's own acceptance criterion exactly: testcases_management 100 tools, helpdesk 87 tools. Wrote two new draft suites — `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md` (TC-MCP-056–073) and `MCP_HELPDESK_TOOL_COVERAGE_V2.md` (TC-MCP-074–090) — covering every capability/acceptance-criterion in both tickets; only the 2 tool-count TCs are executed (PASS) so far, the rest await fixture setup (Enable Milestones, a limited-permission + non-member user, an org+support package+customers, products, a CSV, a Manager + Helpdesk Customer fixture) before a future execution pass. |
| 2026-11-24 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) | Claude (guided by Prashant Chaurasia) | Executed both suites drafted earlier the same day. Built all fixtures live (Enable Milestones plugin setting, limited/non-member/private-project users for Testcase Management permission TCs; a global SLA, 2 support packages, active/inactive products, a properly-organization-linked customer, an Issue Category + budget for the unrelated `redmineflux_budget_and_audit` cross-plugin precondition, for Helpdesk). `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md`: 18/18 TCs PASS, 0 bugs. `MCP_HELPDESK_TOOL_COVERAGE_V2.md`: 17 TCs, 16 PASS, 1 bug — filed **BUG-MCP-007** (dashboard tool's per-ticket SLA-breached badge disagrees with its own aggregate count and every other SLA tool). Ruled out two apparent bugs as pre-existing/by-design during investigation (a fixture user's incidental cross-project role masquerading as a permission bypass; `update_project_customer`'s already-fixed BUG-HLP-064/065 organization-field behavior) rather than mis-filing them. Not yet reported to production this session. |
| 2026-11-24 | 6.0-bookworm (local Docker, localhost:3015) | Local (`C:\crux-redmine`) + production `ztflux` | Claude (guided by Prashant Chaurasia) | Reported BUG-MCP-007 to production (#129351, journal + defect link to testcase #129350/run #689), then received the developer's investigation claiming it was a missing-Sidekiq-worker environment issue, not a code defect. Independently re-verified in full rather than accepting at face value: confirmed via source read that `Helpdesk::SlaMonitorWorker` (a 2-minute Sidekiq cron job) is the only writer of the `response_breached`/`resolution_breached` DB flags `get_sla_status`/`sla_analytics`/`list_tickets` read, while `dashboard`'s badge also live-checks the deadline; confirmed `C:\crux-redmine` has no Sidekiq service; manually started Sidekiq against the live stack, waited for one real cron cycle, and confirmed all 4 tools converged exactly afterward on the same 2 tickets from the original finding. Closed #129351 as Done (Won't Fix was blocked by workflow permissions), updated #129350's description, moved the local bug file to closed/, updated MCP_MEMORY.md with a new Known Quirk and MCP_HELPDESK_TOOL_COVERAGE_V2.md's result from 16/17+1-bug to 17/17 PASS. |
