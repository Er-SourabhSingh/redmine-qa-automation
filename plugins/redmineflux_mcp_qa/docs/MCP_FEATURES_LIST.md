# Features List — Redmineflux MCP Server

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/redmineflux-mcp/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | MCP server URL | Per-account, from Integrations → MCP Server | TC-RFM-001 |
| 2 | Redmine API key retrieval | My Account → API access key → Show / Reset | TC-RFM-002, 103 |
| 3 | Claude Desktop connection | `mcp-remote` bridge via `npx`, Node.js 18+ | TC-RFM-004 – 107 |
| 4 | Claude.ai web connection | Integrations → Model Context Protocol → Add Integration | TC-RFM-008, 109 |
| 5 | Claude Code CLI connection | `claude mcp add` with `--transport http`, project or `--scope user` | TC-RFM-010 – 112 |
| 6 | Claude Code config file | `.claude/mcp.json` or `~/.claude.json` | TC-RFM-013 |
| 7 | Connection verification | "Show me my Redmine projects" returns data | TC-RFM-014 |
| 8 | Plugin detection at startup | Only detected plugins' tools are registered | TC-RFM-015 – 205 |
| 9 | `redmineflux_system_version` | Reports version and detected plugins | TC-RFM-020, 207 |
| 10 | Detection refresh lag | Documented delay after install/uninstall | TC-RFM-022, 209 |
| 11 | Core tool coverage | ~90 core tools always available | TC-RFM-024 |
| 12 | Full tool coverage | 500+ with all plugins installed | TC-RFM-025 |
| 13 | Read operations | Issues, projects, time entries, boards, tickets, workload | TC-RFM-049 – 308 |
| 14 | Write operations | Create/update issues, log time, move cards, sprints, approvals | TC-RFM-059 – 410 |
| 15 | Custom field support | `custom_fields` parameter | TC-RFM-069 |
| 16 | Response formatting | Raw JSON formatted into a readable answer | TC-RFM-057, 310 |
| 17 | User-friendly error messages | Named as a product feature | TC-RFM-070 – 415 |
| 18 | Transient error retry | Automatic retry, per the KB | TC-RFM-074 |
| 19 | Per-user authentication | Each caller's own key and permissions | TC-RFM-031 – 904 |
| 20 | Permission enforcement | Actions limited to the key owner's rights | TC-RFM-035 – 910 |
| 21 | API key handling | Plain-text in client config; rotation via Reset | TC-RFM-041 – 913 |
| 22 | Data privacy | No Redmine data stored by the MCP server | TC-RFM-044 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **This is a hosted service, not an installed plugin.** There is no folder to place, no migration to run and no
  uninstall procedure — so the usual installation suite is replaced by a **connection** suite across four
  documented client paths. A defect can live in the client config, the hosted server, or the Redmine instance, and
  results should say which.
- **The single most important claim to verify is FAQ Q6**: *"The AI can only perform actions permitted by the
  Redmine user whose API key is configured."* Every write tool — create issue, log time, approve timesheet, move
  a card, manage helpdesk — is reachable through natural language by anyone holding the key. If the server
  executes anything the key's own user could not do directly, that is a **Critical** privilege escalation, and it
  would be reachable by simply asking for it. TC-RFM-035 to 910 exist for this and should be run before anything
  else.
- **`approve_timesheets` is the sharpest single permission in the table.** Approving a timesheet is a financial
  and governance action; an MCP path that performs it without the permission would bypass the Timesheet plugin's
  entire multi-level approval design (and see that plugin's own suite for the rules it is meant to enforce).
- **The API key sits in plain text in client config files** (`claude_desktop_config.json`, `.claude/mcp.json`,
  `~/.claude.json`). The KB warns not to commit it to version control — TC-RFM-041 and 912 treat that as a real,
  testable operational risk rather than a footnote, because a project-scoped `.claude/mcp.json` is exactly the
  file that gets committed by accident.
- **The KB's own convenience tip is a hazard worth recording**: "for full access without per-permission setup,
  grant the user Administrator access". That removes every boundary the permission table describes, and an
  administrator key handed to an AI assistant can do anything on the instance. TC-RFM-040 documents what that
  configuration actually permits, so the risk is stated rather than implied.
- **Plugin detection is stateful and lagging** (TC-RFM-022, 209). The KB documents staleness in both directions —
  tools missing after an install, tools lingering after an uninstall. A lingering tool for a removed plugin is the
  more interesting case, since it will fail at the API rather than being absent.
- **Write operations create real data.** Never run this suite against a production Redmine.
