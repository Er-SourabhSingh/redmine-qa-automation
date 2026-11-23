# Bug Report Template

- Bug ID: BUG-MCP-004
- Production Redmine Issue ID: #129246 (reported, assigned to Prashant Chaurasia)
- Title: Tool-list caching hint (RMCP-035) is never actually attached to `tools/list` responses — `cache_hints` is stored on the SDK server instance but never read anywhere in the installed MCP SDK (2.3.0); `server/discover` (the hint's other documented method) doesn't exist as a method at all
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux-mcp (MCP Server, SDK 2.x upgrade feature RMCP-035, production ticket #128313)
- Plugin version: `crux_development` branch, commit `ddc72c7` (1.1.12), `mcp` SDK package 2.3.0
- Environment: Local Docker QA stack
- Browser: N/A (direct MCP protocol calls via curl)
- User role: Admin
- Date: 2026-11-23

## Steps to reproduce

1. Confirm SDK 2.x is active (server logs show SDK-2.x-specific idle-session wording).
2. Call `initialize` (either protocol version `2024-11-05` or `2025-06-18`) to open a session.
3. Call `tools/list` using that session.
4. Inspect the full raw JSON-RPC response body **and** the HTTP response headers for any caching metadata
   (`ttl_ms`, `cache_scope`, or an HTTP `Cache-Control` reflecting the configured TTL).
5. Call `server/discover` — the other method RMCP-035 says carries the same hint.

## Expected result

- Per RMCP-035 ("Adopted — 2. Tool-list caching"): "`tools/list` and `server/discover` carry `ttl_ms`
  (default 300 000 = 5 minutes) and `cache_scope = public`." `REDMINEFLUX_TOOL_LIST_CACHE_SECONDS` is unset
  here, so the default (300) applies — `tools/list`'s response should carry this hint, and `server/discover`
  should be a real, callable method carrying the same hint.

## Actual result

- `tools/list`'s response contains **no** caching-related field anywhere — no `ttl_ms`, no `cache_scope`, no
  `_meta` block with either name, in the JSON-RPC body. The HTTP response headers show only the generic SSE
  `cache-control: no-cache, no-transform` (the stream-level header, unrelated to the tool-list TTL).
- `server/discover` is **not a real method** — calling it returns a standard JSON-RPC `-32601 Method not
  found` error. The method named in RMCP-035's own spec simply doesn't exist in this build.
- Root-caused via source: `src/server.py`'s `_server_identity()` correctly builds
  `identity["cache_hints"] = {"tools/list": hint, "server/discover": hint}` with a real `CacheHint(ttl_ms=300000,
  scope="public")` object, and this is correctly unpacked into the `RedminefluxServer(...)` constructor
  (`**_server_identity(config)`). The installed SDK's `MCPServer.__init__` (`mcp/server/mcpserver/server.py`)
  correctly forwards `cache_hints` down into the low-level `Server.__init__`
  (`mcp/server/lowlevel/server.py:220`), which stores it: `self.cache_hints: dict[str, CacheHint] =
  validate_cache_hints(cache_hints)` (line 429). **That is the only place `cache_hints` is referenced anywhere
  in the entire installed `mcp` package** — confirmed via `grep -rn "self.cache_hints" <site-packages>/mcp/` —
  nothing ever reads `self.cache_hints` back out to attach it to a `tools/list` response, and no handler for a
  `server/discover` method exists at all.
- This is honest, non-destructive behavior (no wrong/corrupted data, just a silently-absent feature) — but it
  means RMCP-035's own "Adopted" claim and the unit test coverage it describes
  (`tests/unit/test_server_identity.py`: "the cache hint defaults to 5 minutes public, can be turned off, and
  a negative value is refused") must be testing the Python-level config/identity-building function in
  isolation (confirmed to work correctly, per TC-MCP-015's own config-validation half) rather than the real
  end-to-end wire behavior through the installed SDK — the gap is specifically in the **SDK's own** handling
  of the `cache_hints` constructor parameter it otherwise validates and accepts without complaint.

## Evidence

### Console / log

- `curl -s -X POST http://localhost:8082/mcp ... tools/list` → full response body has no `ttl_ms`/`cache_scope`
  anywhere (confirmed via `grep` over the complete saved response, not just a truncated preview).
- `curl -s -X POST http://localhost:8082/mcp ... server/discover` → `{"error":{"code":-32601,"message":"Method
  not found","data":"server/discover"}}`.
- `docker compose exec mcp sh -c 'grep -rln "cache_hints|CacheHint" /usr/local/lib/python3.12/site-packages/mcp/'`
  → only `server/__init__.py`, `server/lowlevel/server.py`, `server/mcpserver/server.py`, `server/caching.py`,
  `server/runner.py` (the file defining/exposing the types and forwarding the parameter) — no file that
  actually consumes `self.cache_hints` to attach it to a response.
- `pip show mcp` inside the `mcp` container → `Version: 2.3.0`, correctly within the ticket's own required
  range (`mcp >= 2.3, < 3.0`), so this is not a case of the wrong SDK version being installed.

## Duplicate check

- Duplicate found: No — first finding against this specific feature (RMCP-035's tool-list caching hint).
- Existing bug reference: — (related acceptance criteria on the same production ticket, #128313, e.g. server
  identity in `serverInfo` — TC-MCP-013 — were separately confirmed PASS; this bug is scoped only to the
  caching-hint half of RMCP-035).
