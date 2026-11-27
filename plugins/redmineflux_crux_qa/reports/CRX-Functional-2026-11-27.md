# Redmineflux Crux — Functional Testing Report — 2026-11-27

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-CRX-940 | Pass |
| TC-CRX-818 | Pass |
| TC-CRX-1021 | Pass |
| TC-CRX-966 | Pass |
| TC-CRX-967 | Pass |
| TC-CRX-728 | Pass |
| TC-CRX-780 | Pass |
| TC-CRX-921 | Pass |
| TC-CRX-922 | Pass |
| TC-CRX-954 | Pass |
| TC-CRX-712 | Pass |
| TC-CRX-851 | Pass |
| TC-CRX-794 | Pass |
| TC-CRX-771 | Pass |
| TC-CRX-888 | Pass |
| TC-CRX-871 | Pass |
| TC-CRX-754 | Pass |
| TC-CRX-010 | Pass |
| TC-CRX-011 | Pass |
| TC-CRX-177 | Pass |
| TC-CRX-182 | Pass |
| TC-CRX-380 | Pass |
| TC-CRX-404 | Pass |
| TC-CRX-417 | Pass |
| TC-CRX-427 | Pass |
| TC-CRX-444 | Pass |
| TC-CRX-447 | Pass (initially Blocked — no 2-level timesheet approval chain fixture; built it, then PASS) |
| TC-CRX-487 | Pass |
| TC-CRX-496 | Pass |
| TC-CRX-506 | Pass |
| TC-CRX-512 | Pass |
| TC-CRX-527 | Pass |
| TC-CRX-541 | Pass (initially Blocked — Workload assignee wasn't a project member; added membership, then PASS) |
| TC-CRX-574 | Pass |
| TC-CRX-575 | Pass (initially Blocked — no Helpdesk SLA config; built it, then PASS) |
| TC-CRX-608 | Pass |
| TC-CRX-625 | **Fail — BUG-CRX-227** |
| TC-CRX-643 | Pass |
| TC-CRX-651 | Pass |
| TC-CRX-654 | Pass |
| TC-CRX-668 | Pass |
| TC-CRX-670 | Pass |
| TC-CRX-686 | Pass |
| TC-CRX-703 | Pass |
| TC-CRX-705 | Pass |
| TC-CRX-1076 | Pass |
| TC-CRX-1079 | Pass |
| TC-CRX-1087 | Pass |
| TC-CRX-1088 | Pass |

**Summary:** Total executed — 55 — Pass 54 / Fail 1 / Blocked 0 (3 initially-Blocked resolved to Pass same session) / Skipped 0

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-CRX-227 | Code Reviewer agent lacks DevOps build-lookup tools scoped to a PR — reports "No builds recorded" when the open PR isn't linked to any Redmine issue | Medium | Closed 2026-11-27 (fixed Round 72, retested PASS same day — see `CRX-Retest-2026-11-27.md`) | #129508 |

## Notes / Findings

- Full happy-flow sweep: 15/15 platform-level TCs + 40/40 agent-level TCs (one per bundled agent) executed fresh, each native-verified (DB/API checks, not the chat's own checkmark) rather than relying on the agent's own claimed success.
- 3 TCs (TC-CRX-575 Helpdesk, TC-CRX-541 Workload, TC-CRX-447 Timesheet) were initially BLOCKED on genuine missing fixtures — built the fixtures in-session and completed all 3 to PASS, including a first-ever genuine DB-verified execution of the Timesheet L2-before-L1-approval refusal scenario.
- TC-CRX-625 (Code Reviewer, reviewing an issue-unlinked open PR against a real GitHub repo/build/webhook) failed with a genuine defect — see BUG-CRX-227.
- Two previously-reported "defect" findings from an earlier batch (Root-Cause Analyst fabrication on ticket #4; Crux Guide misrouting on the "Improve with Crux" wand question) were re-reproduced live per explicit user request and came back correct and fully grounded both times — confirmed as non-reproducible one-offs, not filed as bugs.
- Redmine Version: 7.0.2 (local Docker, binary `crux-redmine-mcp-binary` stack, localhost:3016)
- Environment: Local Docker, binary crux-core/mcp stack, OpenRouter provider (anthropic/claude-sonnet-4.5 / claude-haiku-4.5)
- Test Date: 2026-11-27
