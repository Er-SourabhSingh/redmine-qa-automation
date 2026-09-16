# Test Cases — Redmineflux MCP — Client Connection & Plugin Detection

> Source: vendor KB — "System Requirements", "Finding Your MCP Server URL", the three connection guides
> (Claude Desktop / Claude.ai / Claude Code), "How To: Get Your Redmine API Key",
> "How To: Check Which Plugins Are Detected", "Plugin Tools Overview", Troubleshooting, FAQ Q3, Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux MCP Server (hosted)
- MCP server version: (record via `redmineflux_system_version` at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mcp_qa

## Methodology note

This is a **hosted service with client-side configuration**, so there is no installation suite. A failure can live
in three places — the client config, the hosted MCP server, or the Redmine instance — and every result should say
which was observed. Record the client and its version alongside each case.

> **Never point these cases at a production Redmine.** The tools write real data.

---

## Functional Cases — Prerequisites

---

### TC-RFM-101: Locate the account's MCP server URL

**User Role:** Account owner
**Steps:**
1. Open the Redmineflux Cloud dashboard → **Integrations → MCP Server**.

**Expected Result:**
- A unique per-account URL is shown and can be copied.
- Confirm it is account-specific rather than shared — the KB's example (`https://acme-corp.redmineflux.com/mcp`)
  is explicitly labelled as illustrative only.

---

### TC-RFM-102: Retrieve a Redmine API key

**User Role:** Any Redmine user
**Steps:**
1. Redmine → username → **My Account** → **API access key** → **Show**.

**Expected Result:**
- The key is revealed and copyable.

---

### TC-RFM-103: Reset the API key invalidates the old one

**User Role:** Any Redmine user
**Steps:**
1. Connect successfully with the current key.
2. **Reset** the key in My Account.
3. Make an MCP request using the **old** key.

**Expected Result:**
- The old key is refused with the documented authentication error.
- **Reset is the only revocation mechanism available** — if an old key keeps working, a leaked key cannot be
  withdrawn, which would make the KB's own rotation advice useless. High severity if it survives.

---

## Functional Cases — Claude Desktop

---

### TC-RFM-104: Connect Claude Desktop with the documented config

**User Role:** Any
**Preconditions:** Node.js 18+ installed (`node --version`).
**Steps:**
1. Add the `mcpServers.redmineflux` entry exactly as documented, with `npx`, `mcp-remote@0.1.17`, the server URL,
   `--transport http-only` and the `X-Redmine-API-Key` header.
2. Restart Claude Desktop.

**Expected Result:**
- The Redmineflux tools become available after the first `npx` fetch.

---

### TC-RFM-105: Verification prompt returns data

**User Role:** Any
**Steps:**
1. In a new conversation, ask *"Show me my Redmine projects"*.

**Expected Result:**
- The user's project list is returned — the KB's own verification step.

---

### TC-RFM-106: Missing Node.js

**User Role:** Any
**Steps:**
1. On a machine without Node.js 18+, apply the same config and restart.

**Expected Result:**
- The connection fails and the cause is discoverable.
- The KB lists "confirm Node.js is installed" under *No tools available*, which implies the symptom is a generic
  absence of tools rather than a clear message. Record how discoverable the real cause is — an unexplained empty
  tool list is a genuine diagnosability problem.

---

### TC-RFM-107: Malformed Desktop config

**User Role:** Any
**Steps:**
1. Introduce, in turn: invalid JSON; a wrong server URL; a missing `--header` argument.
2. Restart after each.

**Expected Result:**
- Each fails without breaking Claude Desktop itself, and the failures are distinguishable enough to act on.

---

## Functional Cases — Claude.ai web

---

### TC-RFM-108: Connect via Claude.ai Integrations

**User Role:** Any
**Steps:**
1. claude.ai → Settings → **Integrations → Model Context Protocol** → **Add Integration** → enter the URL →
   **Connect** → provide the API key when prompted.

**Expected Result:**
- The integration connects and the tools are usable in conversation.

---

### TC-RFM-109: Two users share one server URL

**User Role:** Two Redmine users with different permissions
**Steps:**
1. Both connect to the **same** MCP server URL, each with their own API key.
2. Each asks for their own projects and issues.

**Expected Result:**
- Each sees only their own data, per FAQ Q2.
- **This is the multi-tenant claim and it must be verified with two genuinely different keys.** If one user's
  session returns another's data, the per-user authentication model has failed — Critical, and undetectable with a
  single account.

---

## Functional Cases — Claude Code

---

### TC-RFM-110: Add via the CLI for the current project

**User Role:** Any
**Steps:**
1. Run `claude mcp add redmineflux --transport http <URL> --header "X-Redmine-API-Key: <KEY>"`.
2. Ask *"List my Redmine projects"*.

**Expected Result:**
- The server is registered for that project and returns data.

---

### TC-RFM-111: Add globally with `--scope user`

**User Role:** Any
**Steps:**
1. Repeat with `--scope user` and verify from a **different** project directory.

**Expected Result:**
- The server is available in every project.

---

### TC-RFM-112: Project scope does not leak into other projects

**User Role:** Any
**Steps:**
1. Register project-scoped only, then open an unrelated project directory.

**Expected Result:**
- The tools are **not** available there — the two scopes behave distinctly, as documented.

---

### TC-RFM-113: Manual config files

**User Role:** Any
**Steps:**
1. Configure via `.claude/mcp.json` (project) and `~/.claude.json` (global) using the documented `type: "http"`
   shape.

**Expected Result:**
- Both work identically to the CLI registration.

---

### TC-RFM-114: Verify in VS Code

**User Role:** Any
**Steps:**
1. Open the Claude panel and ask *"List my Redmine projects"*.

**Expected Result:**
- Projects are fetched and displayed.

---

## Functional Cases — Plugin detection

---

### TC-RFM-201: Only detected plugins' tools are registered

**User Role:** Any
**Preconditions:** At least one Redmineflux plugin installed and at least one **not** installed.
**Steps:**
1. Enumerate the available tools.

**Expected Result:**
- Tools exist for installed plugins and **not at all** for uninstalled ones, per FAQ Q3.
- This is the plugin's stated design intent — absent rather than failing tools.

---

### TC-RFM-202: Asking about an uninstalled plugin

**User Role:** Any
**Steps:**
1. Ask for a capability belonging to a plugin that is not installed, e.g. *"Show pending timesheet approvals"* on
   an instance without the Timesheet plugin.

**Expected Result:**
- The assistant reports that the capability is unavailable, rather than calling a tool that returns a confusing
  API error — the exact confusion the KB says detection exists to prevent.

---

### TC-RFM-203: Installing a plugin registers its tools

**User Role:** Admin + MCP user
**Steps:**
1. Install and enable a plugin in Redmine.
2. Reconnect the client and re-check the tool list, allowing a few minutes for detection to refresh.

**Expected Result:**
- The new plugin's tools appear.
- Record how long the refresh actually took — the KB says "a few minutes" without being specific, and that
  vagueness is what users will report as a bug.

---

### TC-RFM-204: Module enabled per project

**User Role:** Admin + MCP user
**Steps:**
1. With a plugin installed but its module disabled on a project, attempt a plugin operation on that project.

**Expected Result:**
- Refused consistently with Redmine's own module gating. Tool availability is instance-wide, but the operation
  must still honour the project's module state.

---

### TC-RFM-205: Core tools are always available

**User Role:** Any
**Steps:**
1. On an instance with **no** Redmineflux plugins, enumerate the tools.

**Expected Result:**
- The core Redmine tools are present — the KB says around 90 are always available.

---

### TC-RFM-206: `redmineflux_system_version` reports version and plugins

**User Role:** Any
**Steps:**
1. Ask *"Show the MCP server version and installed plugins"*.

**Expected Result:**
- The tool returns the server version and the detected plugin list.
- **Cross-check that list against Administration → Plugins.** A detected-plugins list that disagrees with what is
  actually installed makes every other detection case unreliable, and this tool is what the KB tells users to
  include in a support ticket.

---

### TC-RFM-207: Version reporting is usable for support

**User Role:** Any
**Steps:**
1. Record the exact output.

**Expected Result:**
- A specific version string, not a placeholder — the KB asks users to quote it when reporting problems.

---

### TC-RFM-208: Detection after uninstalling a plugin

**User Role:** Admin + MCP user
**Steps:**
1. Uninstall a plugin, wait, reconnect, and attempt one of its operations.

**Expected Result:**
- Its tools eventually disappear.
- **Record what happens in the interim.** The KB documents lingering tools as a known condition; a stale tool will
  fail at the Redmine API, so the interesting question is whether the failure is intelligible or a raw error.

---

### TC-RFM-209: Detection does not require a client restart to be correct

**User Role:** Any
**Steps:**
1. After a plugin change, note whether the client must be restarted or the integration re-added.

**Expected Result:**
- Record the actual requirement. The KB describes detection as happening at server startup, which means client
  behaviour here is not fully specified — documenting it is part of the deliverable.

---

### TC-RFM-210: Tool count is plausible

**User Role:** Any
**Steps:**
1. Count the registered tools with no plugins, then with several installed.

**Expected Result:**
- Roughly 90 core tools, growing substantially with plugins — the KB claims over 500 with everything installed.
- Exact figures are not the point; a wildly different count indicates detection is not working as described.

---

## Negative Cases

---

### TC-RFM-211: Invalid API key

**User Role:** Any
**Steps:**
1. Configure a malformed key, then a well-formed but wrong key, and make a request.

**Expected Result:**
- The documented error — *"Authentication failed — your API key is invalid or expired"* — rather than a raw HTTP
  error or a silent empty result.

---

### TC-RFM-212: Locked Redmine account

**User Role:** A locked account's key
**Steps:**
1. Lock the Redmine user, then make an MCP request with their key.

**Expected Result:**
- Refused.
- **A locked account must lose MCP access immediately.** Locking is how an organisation removes a departing
  employee's access; if their key keeps working through MCP, the offboarding is incomplete — High severity.

---

### TC-RFM-213: No API key supplied

**User Role:** Any
**Steps:**
1. Remove the `X-Redmine-API-Key` header from the config and connect.

**Expected Result:**
- No tools, or every call refused. **Nothing is readable without a key** — an unauthenticated path to Redmine data
  would be Critical.

---

### TC-RFM-214: Wrong server URL

**User Role:** Any
**Steps:**
1. Point the client at another account's MCP URL using this account's key; then at a non-existent subdomain.

**Expected Result:**
- Both refused.
- **The cross-account case matters most**: a key from one Redmineflux account must not authenticate against
  another account's MCP server. Any success there is a multi-tenancy breach — Critical.

---

### TC-RFM-215: No outbound HTTPS access

**User Role:** Any
**Steps:**
1. Block outbound access to the MCP URL and start the client.

**Expected Result:**
- Tools are unavailable and the failure is diagnosable — the KB's *No tools available* checklist covers exactly
  this case.

---

### TC-RFM-216: Redmine unreachable from the MCP server

**User Role:** Any
**Steps:**
1. With the client connected, make the Redmine instance unavailable and issue a request.

**Expected Result:**
- A clear error naming the upstream problem, not a hang.
- The KB claims transient errors are retried automatically — record whether a retry occurs and whether it is
  bounded (see TC-RFM-416).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
