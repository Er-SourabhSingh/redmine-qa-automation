# User Guide — Redmineflux MCP Server

> This file must be read before writing any test case. It describes real end-user behaviour and setup flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/redmineflux-mcp/ (ingested 2026-09-15).
> Confirm each flow against the live service during the first execution session and correct this file where the
> real behaviour differs.

## Getting Started

There is nothing to install into Redmine. Redmineflux hosts the MCP server; the work is on the **client** side —
pointing an AI client at the account's MCP server URL and supplying a Redmine API key.

Requires the Pro Plan or above.

## Key Screens and Files

| Item | Where | Purpose |
|------|-------|---------|
| MCP server URL | Redmineflux Cloud dashboard → Integrations → MCP Server | The endpoint to connect to |
| Redmine API key | Redmine → My Account → API access key → Show / Reset | Authenticates every request |
| `claude_desktop_config.json` | macOS `~/Library/Application Support/Claude/`; Windows `%APPDATA%\Claude\` | Claude Desktop config |
| Claude.ai Integrations | claude.ai → Settings → Integrations → Model Context Protocol | Web client connection |
| `.claude/mcp.json` | Project folder | Claude Code, one project |
| `~/.claude.json` | Home directory (`%USERPROFILE%\.claude.json` on Windows) | Claude Code, all projects |

## Step-by-Step Workflows

### Workflow 1: Get the prerequisites

1. Find the MCP server URL under **Integrations → MCP Server**, e.g. `https://acme-corp.redmineflux.com/mcp`.
2. In Redmine, click your username → **My Account** → **API access key** → **Show**, and copy the key.
   **Reset** generates a new one.

Treat the key like a password: it carries the same permissions as your Redmine account.

### Workflow 2: Connect Claude Desktop (Mac / Windows)

1. Open the config file for your platform.
2. Add the server inside `mcpServers`:

   ```json
   {
     "mcpServers": {
       "redmineflux": {
         "command": "npx",
         "args": [
           "mcp-remote@0.1.17",
           "<YOUR_MCP_SERVER_URL>",
           "--transport", "http-only",
           "--header", "X-Redmine-API-Key: <YOUR_API_KEY>"
         ]
       }
     }
   }
   ```
3. Restart Claude Desktop. The first connection fetches `mcp-remote` via `npx`.
4. Verify by asking: *"Show me my Redmine projects"*.

Requires **Node.js 18+** so `npx` can run.

### Workflow 3: Connect Claude.ai Web

1. claude.ai → profile → **Settings** → **Integrations** → **Model Context Protocol** → **Add Integration**.
2. Enter the MCP server URL → **Connect**.
3. Provide the Redmine API key when prompted.

Every request carries your own key, so your actions use your own permissions even when the whole team connects to
the same server.

### Workflow 4: Connect Claude Code (CLI / VS Code)

For the current project only:

```
claude mcp add redmineflux --transport http <YOUR_MCP_SERVER_URL> --header "X-Redmine-API-Key: <YOUR_API_KEY>"
```

For every project:

```
claude mcp add redmineflux --transport http --scope user <YOUR_MCP_SERVER_URL> --header "X-Redmine-API-Key: <YOUR_API_KEY>"
```

Or edit `.claude/mcp.json` (project) or `~/.claude.json` (global) with the equivalent `type: "http"` entry.

Verify in VS Code by opening the Claude panel and asking *"List my Redmine projects"*.

### Workflow 5: Use it

Ask in natural language; Claude picks the tool. Examples from the KB:

- **Issues** — "Show all open bugs in the Mobile App project"; "Update issue #1042 status to In Progress".
- **Time** — "Log 2.5 hours on issue #1023 for development".
- **Agile** — "Move issue #1042 to Done column"; "Create a sprint named 'Sprint 5' for 2 weeks".
- **Workload** — "Who is over-allocated this week?"
- **Timesheet** — "Approve timesheet for user …"; "Show pending timesheet approvals".
- **Helpdesk** — "Show SLA status for ticket #205".
- **Knowledge Base**, **Checklists**, **Test Cases**, **DevOps** — similar natural-language requests.

### Workflow 6: Check what is connected

Ask *"Which Redmineflux plugins are detected?"* or *"Show the MCP server version and installed plugins"*. Claude
calls `redmineflux_system_version` and reports the version and the detected plugin list.

## Notes & Known Behaviour

- **Plugin tools are registered at startup** based on what is actually installed. An uninstalled plugin's tools do
  not exist at all, rather than existing and failing.
- **Detection can lag.** After installing or uninstalling a plugin, the KB says to wait a few minutes.
- **Permissions are the Redmine user's.** The AI can do exactly what that user could do — no more. To restrict
  what the AI can do, create a role with only the permitted actions and use that user's key.
- **The vendor's shortcut — granting the key's user Administrator access — removes every restriction.** It is
  offered as convenience, but it means anything anyone asks the assistant to do, it can do.
- **Recommended practice:** a dedicated `mcp-bot` user with minimum permissions, and periodic key rotation via
  My Account → API access key → **Reset**.
- **The key is stored in plain text in client config files.** `.claude/mcp.json` lives in a project folder, which
  makes accidental commits a realistic way to leak it.
- Data is sent to the AI model to answer the request and, per FAQ Q1, is not stored by the MCP server itself.
- Transient errors are retried automatically; persistent timeouts point at Redmine health or the network.
