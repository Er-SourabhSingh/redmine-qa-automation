# Handoff — Redmineflux MCP Issue Template

## Last Session

- Date: 2026-06-16
- Redmine Version: Flux (dev-flux.zehntech.com)
- Environment: Forge

## Completed This Session

- Created full folder structure per CLAUDE.md
- Configured 3 MCP server instances in `~/.claude/settings.json` (admin, user_perm, user_noperm)
- Filled all docs: requirements.md, features-list.md, user-guide.md, scope.md, flow.md
- Created testcases/issue-template-mcp.md (18 TCs planned)
- Executed TC-RIT-001 through TC-RIT-015 (all admin-user TCs)
- Results: 13 PASS, 1 FAIL (TC-RIT-006 → BUG-RIT-001), 0 BLOCKED
- Filed BUG-RIT-001: list_templates 500 on project_id filter
- Generated tc-report.html, defects-summary.html, final-bug-report.md
- Updated STATUS.md, changelog.md

## In Progress

- TC-RIT-016, TC-RIT-017, TC-RIT-018 — permission tests for user_perm and user_noperm users
- These require a Claude Code session restart so the new MCP servers activate

## Blockers

- None for admin TCs
- TC-RIT-016/017/018 blocked pending session restart (MCP servers added mid-session cannot be used until restart)

## Next Session Start Point

1. **Restart Claude Code** to activate `redmineflux_user_perm` and `redmineflux_user_noperm` MCP servers
2. Read this handoff.md + memory.md before doing anything
3. Execute TC-RIT-016 using `redmineflux_user_perm` server: `list_templates`
4. Execute TC-RIT-017 using `redmineflux_user_perm` server: `create_template`
5. Execute TC-RIT-018 using `redmineflux_user_noperm` server: list + create + delete (all should be blocked)
6. Update tc-report.html with final results for these 3 TCs
7. Check if BUG-RIT-001 is fixed — retest TC-RIT-006 with project_id filter
8. Update STATUS.md with final open bug count and session result

## Open Bugs Found

| Bug ID | Title | Severity |
|--------|-------|----------|
| BUG-RIT-001 | list_templates returns 500 internal server error when project_id filter is applied | High |
