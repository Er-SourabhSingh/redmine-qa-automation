# Redmineflux Crux — Retest Testing Report — 2026-11-27

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> This is a Retest-type report — Fix Verification / Retesting section below applies.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-CRX-625 | Pass (retest — originally Fail, see `CRX-Functional-2026-11-27.md`) |

**Summary:** Total executed — 1 — Pass 1 / Fail 0 / Blocked 0 / Skipped 0

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-CRX-227 | Code Reviewer agent lacks DevOps build-lookup tools scoped to a PR — reports "No builds recorded" when the open PR isn't linked to any Redmine issue | Medium | Closed 2026-11-27 | #129508 |

## Fix Verification / Retesting

- Production issue #129508 moved to Fixed (Round 72, 2026-11-27). Developer's diff to `agents/code-reviewer.md`: Code Reviewer's tool list now includes `redmineflux_devops_list_builds`, `redmineflux_devops_get_pull_request`, `redmineflux_devops_get_commit`; its instructions find a PR's builds by its source branch and newest commit (via `list_commits`/`list_builds` with `branch`), independent of any issue link, and treat a Pending/Queued/Running build as "a build with no result yet," not "no build."
- Retested on `C:\crux-redmine` (localhost:3015, source-built stack) rather than the original binary `crux-redmine-mcp-binary` stack (localhost:3016) where the bug was found — the binary stack's `crux-core`/`mcp` are pre-built images with no mounted source repo and can never pick up a `git pull` at all (see `CRUX_MEMORY.md`, 2026-11-27 entry).
- Pulled `services/redmineflux-crux-core` (`ff731ef` → `5184a16`, 4 commits including CRC-128 "Code Reviewer finds PR builds by branch"), confirmed the `agents/code-reviewer.md` diff matches the developer's described fix exactly. Rebuilt and force-recreated `crux-core` (now reporting version 1.0.1, matching the developer's own journal) and restarted `mcp` (stale-MCP-session gotcha after a `crux-core` recreate). Verified via `docker compose ps` (fresh uptime) and `GET /api/health`.
- Re-ran the PR-review shape with Code Reviewer pinned on this instance's own DevOps fixture (`Crux DevOps Agent Test Project`, PR #1, branch `sourabhzehntech01-star-patch-1`, no linked issue). This instance's PR branch genuinely has a commit (`da47412f`) but no build row at all — confirmed via direct `redmineflux_devops_list_commits`/`list_builds` MCP calls, a different ground truth than the original repro's Pending build. Result: `Needs changes. PR #1 is open with the commit da47412f on branch sourabhzehntech01-star-patch-1 ... 1. No build. No CI/CD build has run for this branch...` — accurate and branch-scoped, and the agent correctly did not confuse the project's one unrelated Pending build (on branch `main`) with this PR's build, confirming the new branch-based lookup (not `issue_builds`) is what's driving the answer.
- Not re-verified live on this instance: the exact "Pending build named, 'can't tell yet'" wording, since no Pending build exists on this PR's own branch here without re-establishing the original repro's GitHub webhook/Cloudflare tunnel (out of scope for this retest). The pulled instruction text contains that wording verbatim, and the developer's own round-72 live verification (quoted in the production journal) already covers it.
- Verdict: **PASS.** BUG-CRX-227 moved to `bugs/closed/`, `bugs/_index.md` updated, production issue #129508 synced to Status Done / % done 100.

## Notes / Findings

- Redmine Version: 7.0.2 (plugin) on 6.0-bookworm local Docker (`C:\crux-redmine`, localhost:3015)
- Environment: Local Docker, source-built crux-core/mcp stack, OpenRouter provider (anthropic/claude-haiku-4.5)
- Test Date: 2026-11-27
