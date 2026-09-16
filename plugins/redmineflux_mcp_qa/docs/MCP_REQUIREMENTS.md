# Plugin Requirements — Redmineflux MCP Server

> Source: https://www.redmineflux.com/knowledge-base/plugins/redmineflux-mcp/ (official vendor knowledge base,
> ingested 2026-09-15).

## Overview

An AI integration layer that exposes a Redmine instance to MCP-compatible AI clients (Claude Desktop, Claude.ai,
Claude Code). It translates natural-language requests into authenticated Redmine REST API calls and formats the
responses back. It is **hosted by Redmineflux**, not installed into Redmine — which makes it structurally unlike
every other item in this set.

Three properties define its risk profile:

- **It is a write path.** The AI can create issues, log time, move cards, approve timesheets and handle tickets.
- **Authority comes entirely from one Redmine API key** carried in the `X-Redmine-API-Key` header.
- **The key lives in client-side config files** — `claude_desktop_config.json`, `.claude/mcp.json`,
  `~/.claude.json` — in plain text.

## Key Features

1. **Per-user authentication** — every request carries the caller's own API key, so actions run with that user's
   Redmine permissions even when a whole team shares one MCP server URL.
2. **Automatic plugin detection at startup** — the server probes the Redmine instance and registers tools **only**
   for detected plugins, so uninstalled plugins produce no tools rather than failing tools.
3. **Tool coverage** — ~90 core Redmine tools always available; **over 500** with every Redmineflux plugin
   installed (Agile Board, Workload, Timesheet, Helpdesk, Checklist, Knowledge Base, Issue Template, Invoice, CRM,
   Tags, Budget & Audit, Testcase Management, DevOps).
4. **Four documented client connection paths** — Claude Desktop via the `mcp-remote` bridge (Node.js 18+),
   Claude.ai web via Integrations → Model Context Protocol, Claude Code via direct HTTP (CLI or config file), and
   any other MCP-compatible client via direct HTTP.
5. **`redmineflux_system_version` tool** — reports the server version and the detected plugin list.
6. **Custom field support** — `custom_fields` parameter, e.g. `[{"id": 5, "value": "Production"}]`.
7. **Transient error retry** — the KB states transient errors are automatically retried.

## Permissions Matrix

The KB publishes a **required-permission table**, which is unusual and useful: it maps capabilities to specific
Redmine permissions rather than inventing its own model.

| Permission | Required for |
|---|---|
| `view_issues` | Reading issues, checklists, search |
| `add_issues` / `edit_issues` / `delete_issues` | Creating / updating / deleting issues |
| `log_time` / `view_time_entries` | Logging time; viewing time reports |
| `edit_project` | Archiving/unarchiving and project settings |
| `view_agile_board` / `manage_agile_board_settings` / `manage_sprints` | Agile board read / settings / sprints |
| `manage_tags`, `view_tags`, `manage_issues_tags`, `manage_project_tags`, `manage_time_entries_tags` | Tag operations |
| `view_issue_templates`, `create_issue_templates`, `apply_issue_templates`, `edit_issue_templates`, `delete_issue_templates` | Issue template operations |
| `manage_helpdesk` | Helpdesk SLA, holiday, organization, support level |
| `approve_timesheets` | Approving a submitted timesheet |
| `manage_deals` | CRM deals |

Plus plugin-specific permissions for Invoice, Workload, Checklist and Knowledge Base.

**The governing rule (FAQ Q6):** *"The AI can only perform actions permitted by the Redmine user whose API key is
configured."* Everything in the permissions suite tests that single claim — it is the only thing standing between
an AI assistant and the whole instance.

| Action via MCP | Admin key | Scoped-role key | Read-only key | Locked-account key | No key |
|---|---|---|---|---|---|
| List issues | | | | | |
| Create / update / delete an issue | | | | | |
| Log time | | | | | |
| Approve a timesheet | | | | | |
| Read another project's data | | | | | |
| Change plugin settings | | | | | |

## Known Constraints

- **Pro Plan or above** is required for MCP integration.
- **Claude Desktop needs Node.js 18+** for `npx` to run the `mcp-remote` bridge; the other clients connect
  directly over HTTP.
- **Outbound HTTPS only** — no inbound access, public URL or port forwarding is needed.
- **The MCP server URL is per account**, found under Integrations → MCP Server in the Redmineflux Cloud dashboard.
- **Plugin detection happens at startup** and may take a few minutes to refresh after a plugin is installed or
  removed — the KB names stale detection as a known troubleshooting item in both directions.
- **The API key has exactly the permissions of its Redmine user.** The KB's own tip — "for full access without
  per-permission setup, grant the user Administrator access" — is convenient and is precisely the configuration
  that removes every safety boundary, so it should be treated as a risk worth flagging, not a recommendation to
  follow blindly.
- The vendor recommends a **dedicated user** (e.g. `mcp-bot`) with minimum permissions and periodic key rotation.

## Installation Prerequisites

1. A Redmineflux Cloud account on the Pro Plan or above, and its MCP server URL.
2. A Redmine API key from My Account → API access key.
3. For Claude Desktop: Node.js 18+.
4. **Several API keys with different permission levels** — admin, a scoped role, a read-only role, and a locked
   account. The permission suite is untestable with a single admin key, and an admin key would make every case
   pass for the wrong reason.
5. A test Redmine instance where write operations are acceptable. **MCP tools write real data**, so never point
   these cases at a production instance.
