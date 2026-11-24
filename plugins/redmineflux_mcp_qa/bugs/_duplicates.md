# Duplicate Bug Register — Redmineflux MCP Server

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| Tool-list caching hint (RMCP-035) absent from `tools/list` responses; `server/discover` method doesn't exist | Not a duplicate — first finding on this specific RMCP-035 sub-feature. Root-caused to the installed MCP SDK (2.3.0) never consuming `self.cache_hints` anywhere after storing it; `_server_identity()`'s own Python-level construction of the hint is correct. | BUG-MCP-004 |
| 401 challenge's `WWW-Authenticate` header missing `scope="..."` | Not a duplicate — different feature area (OAuth 401 challenge, RMCP-038) and different root cause (`oauth.py`'s `challenge()` never reads `oauth_scopes`, unrelated to BUG-MCP-004's SDK-level cache-hint gap). | BUG-MCP-005 |
| `devops`/`gantt` plugin auto-detection fails with zero projects | Not a duplicate — different area entirely (plugin detection at startup, Nuitka-compiled binary distribution, not the SDK 2.x/OAuth tickets). Root-caused to the project-scoped detection probe getting a 400 (no project id to retry with) instead of the 401/403 it can gracefully handle. | BUG-MCP-006 |
| Helpdesk `dashboard` tool's per-ticket "SLA breached" badge disagrees with every other SLA tool | Not a duplicate — a new tool (`dashboard`, RMCP-054/#129322), new finding. Not the same as any prior SLA-related bug (BUG-MCP-005 was about the OAuth 401 challenge header; this is about a tool's own internal per-ticket vs. aggregate SLA-breach disagreement). | BUG-MCP-007 |
