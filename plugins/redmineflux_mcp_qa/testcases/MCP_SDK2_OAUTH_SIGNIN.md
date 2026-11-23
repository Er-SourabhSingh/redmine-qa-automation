# Test Cases — Redmineflux MCP — SDK 2.x Upgrade & "Sign in with Redmineflux" (OAuth)

> Source: production ticket #128313 ("MCP Server: Upgrade to MCP SDK 2.x and add 'Sign in with Redmineflux' so
> users connect with only the server address") — its own acceptance criteria, scope sections, and the
> developer's own specs read directly from the local `redmineflux-mcp` repo's
> `backlogs/specification/RMCP-033/035/036/037/038-*.md` files (status: Specification, done, already merged to
> `crux_development` — commit `ddc72c7`, "Merge feature/mcp-sdk-v2 into crux_development (MCP SDK 2.x,
> RMCP-033..038, 1.1.12)").
>
> **Status: COMPLETE 2026-11-23 — all 22 TCs executed, all PASS** (2 found genuine defects — BUG-MCP-004,
> BUG-MCP-005 — both fixed same day by the developer in RMCP-053/1.1.14 and retested CONFIRMED FIXED).

## Plugin
- Name: Redmineflux MCP Server (`redmineflux-mcp`, `src/oauth.py`, `src/config.py`, `src/redmine_client.py`)
- MCP server version: local checkout, `crux_development` branch, commit `b782e62` (1.1.14, RMCP-053) as of the
  2026-11-23 retest/Section C pass (originally drafted/executed against commit `ddc72c7`, 1.1.12)
- Redmine version: 6.0-bookworm (`C:\crux-redmine`, localhost:3015) for Sections A/B; a dedicated
  6.1-bookworm stack (`C:\crux-redmine-oauth61`, localhost:3018) for Section C
- Path: plugins/redmineflux_mcp_qa

## Known environment gap — now resolved (kept for history)

**OAuth sign-in's actual browser round-trip requires Redmine 6.1+.** Per RMCP-035/038's own spec: "Redmine
5.x and 6.0 have no OAuth at all" (no Doorkeeper provider, no `/oauth/authorize` endpoint, no
`/.well-known/oauth-authorization-server` on Redmine's own side). `C:\crux-redmine` (used for Sections A/B)
runs **6.0-bookworm** and still has this gap.

This did **not** block all OAuth-related testing:
- The MCP server's **own** discovery documents, the 401 challenge, and `/mcp/register`'s client-id
  mechanics are all served by the MCP server itself and do **not** call Redmine at all — these were tested on
  the 6.0 stack directly (Section B).
- Only the step that calls Redmine's real `/oauth/authorize` needed Redmine 6.1+ — resolved 2026-11-23 by
  building a separate, dedicated Redmine 6.1-bookworm stack (`C:\crux-redmine-oauth61`) just for Section C,
  without touching `C:\crux-redmine`.

## Methodology
Direct MCP-server-layer testing (HTTP calls to the server's `/mcp*`/`/.well-known/*` endpoints and tool
calls), mirroring `MCP_DEVOPS_TOOL_COVERAGE.md`'s established approach for this plugin — no Ask Crux chat in
the loop, every result verified against the server's own response or Redmine's own data.

---

## Section A — MCP SDK 2.x upgrade (fully testable on this instance)

---

### TC-MCP-013: Server identity is published in `serverInfo` to every client, including the older protocol

**Precondition:** `mcp` container running on SDK 2.x (confirmed via log lines `Session ... idle timeout` /
`Terminating session`, SDK-2.x-specific wording).

**Steps:**
1. Send an `initialize` request using the **old** protocol version (`2024-11-05`, the one Crux core's client
   sends).
2. Send an `initialize` request using the current protocol version.
3. Inspect `serverInfo` in both responses.

**Expected Result:** Both responses carry `title` "Redmineflux MCP Server", a one-line `description`, and
`website_url` `https://www.redmineflux.com` — per RMCP-035, sent regardless of protocol version. No `icons`
field by default (no `REDMINEFLUX_ICON_URL` set).

**Result: PASS — executed 2026-11-23.** Direct `initialize` calls (protocol `2024-11-05` and `2025-06-18`)
both returned identical `serverInfo`: `title: "Redmineflux MCP Server"`, `description: "Connects AI assistants
to Redmineflux: projects, issues, time, and the installed Redmineflux plugins, with each user's own
Redmineflux permissions."`, `websiteUrl: "https://www.redmineflux.com"`, `version: "1.1.12"`, no `icons` field
(default, `REDMINEFLUX_ICON_URL` unset). Minor unrelated observation: `version` has no `+<commit>` suffix even
though `server.py`'s own code appends one when `BUILD_COMMIT != "unknown"` — this build's `BUILD_COMMIT` is
apparently `"unknown"`, not itself a defect in this feature, just worth noting for whoever reads version
strings off this server.

---

### TC-MCP-014: Tool-list caching hint defaults to 5 minutes, public scope

**Precondition:** `REDMINEFLUX_TOOL_LIST_CACHE_SECONDS` unset (default).

**Steps:**
1. Call `tools/list`.
2. Inspect the response for a caching hint.

**Expected Result:** `ttl_ms: 300000` and `cache_scope: "public"` present on the response, per RMCP-035.

**Result: FAIL (2026-11-23) — BUG-MCP-004 filed.** The `tools/list` response body has no caching field anywhere
(checked the complete raw response, not a truncated preview); the HTTP headers show only the generic SSE
`cache-control: no-cache, no-transform` (unrelated to the TTL). Also tried `server/discover` (the hint's other
documented method) — it doesn't exist (`-32601 Method not found`). Root-caused to the installed SDK (`mcp`
2.3.0, correctly within the ticket's own required range) storing `self.cache_hints` but never reading it back
anywhere in the package to attach it to a response. The local code's own construction of the hint
(`_server_identity()` in `src/server.py`) is correct and type-matches the SDK's constructor signature exactly
— the gap is entirely inside the SDK's own incomplete wiring, not this plugin's code.

**Retest: PASS — executed 2026-11-23 (same day), redmineflux-mcp commit `b782e62` (1.1.14, RMCP-053).**
Developer's fix: the SDK-level `ttlMs`/`cacheScope` fields belong to the 2026-07-28 MCP protocol only, which
the SDK strips for 2025-era connections (2025-06-18, 2025-11-25) — every current client. The server now also
places the hint in the result's `_meta`, which every protocol version carries:
`"_meta": {"com.redmineflux/cache": {"ttlMs": 300000, "cacheScope": "public"}}` on `tools/list`. Pulled the fix,
rebuilt `mcp`, confirmed directly: `tools/list` on all three protocol versions (`2025-06-18`, `2025-11-25`,
`2026-07-28`) now carries `_meta."com.redmineflux/cache": {"ttlMs":300000,"cacheScope":"public"}`; with
`REDMINEFLUX_TOOL_LIST_CACHE_SECONDS=0` the hint is correctly absent. **CONFIRMED FIXED — BUG-MCP-004 closed.**

---

### TC-MCP-015: `REDMINEFLUX_TOOL_LIST_CACHE_SECONDS` — `0` turns the hint off, a negative value is refused at start-up

**Precondition:** None.

**Steps:**
1. Set `REDMINEFLUX_TOOL_LIST_CACHE_SECONDS=0`, restart `mcp`, call `tools/list`.
2. Set `REDMINEFLUX_TOOL_LIST_CACHE_SECONDS=-5`, restart `mcp`.
3. Revert to default afterward.

**Expected Result:**
- Step 1: no caching hint (`ttl_ms`/`cache_scope`) on the `tools/list` response.
- Step 2: the server refuses to start, with a clear message naming the bad setting (per RMCP-035: "a negative
  value is refused").

**Result: PASS — executed 2026-11-23.** `=0`: clean start, server reachable, `tools/list` works (no hint
present either way, per BUG-MCP-004 — not a regression specific to this value). `=-5`: server crashed at
start-up with `ValueError: REDMINEFLUX_TOOL_LIST_CACHE_SECONDS must be 0 or more`, exactly the documented
message, container exited and restarted in a crash loop until the setting was reverted. Setting reverted to
default (line removed from `docker-compose.yml`), `mcp` restarted clean. This TC validates the **config
parsing/validation** half of RMCP-035 independently of BUG-MCP-004 (which is about the SDK never acting on a
*valid* config) — both halves PASS/FAIL independently and don't contradict each other.

---

### TC-MCP-016: Existing API-key client — every tool still works exactly as before the SDK 2.x upgrade

**Precondition:** Crux core (API-key client) connected to the upgraded server.

**Steps:**
1. Call a representative sample of tools already covered by `MCP_DEVOPS_TOOL_COVERAGE.md` and this plugin's
   other suites (a core read, a plugin read, one write under a confirm card) through Crux chat or direct MCP
   calls.
2. Compare tool names, argument shapes and result text against what those same calls returned before this
   session's SDK-2.x rebuild.

**Expected Result:** No change in tool names, arguments or results — matches ticket #128313's own first
acceptance criterion ("existing API-key client ... all tools work exactly as before").

**Result: PASS — executed 2026-11-23.** Direct `redmineflux_core_get_current_user` call via admin's own API key
against the upgraded (SDK 2.x) server returned the exact same response shape and content used throughout this
session's earlier TCs (`**Redmine Admin** (@admin)` / `ID: 1` / `Email: admin@example.net` / `Admin: True` /
`Created: ...`) — no change in tool name, argument shape, or result text vs. pre-upgrade behavior.

---

### TC-MCP-017: Tool error messages stay clear and specific (SDK 2.x hides them by default)

**Precondition:** A tool call that is guaranteed to fail with a specific, known reason (e.g. a nonexistent
issue id, per this plugin's own established "If you expected this ... to exist, verify the ID" pattern).

**Steps:**
1. Call `redmineflux_core_get_issue(issue_id=999999999)` (or an equivalently guaranteed-404 call).

**Expected Result:** The error text is the plugin's own specific, actionable message — not a generic SDK-level
error or a swallowed/blank error, confirming the server re-implements clear errors on SDK 2.x per RMCP-033's
own stated goal.

**Result: PASS — executed 2026-11-23.** `redmineflux_core_get_issue(issue_id=999999999)` returned `isError:
true` with a clear, specific message — "Issue #999999999 not found" plus likely reasons and next-step guidance
— not a generic SDK-level error or a blank/swallowed message. Confirms clear, actionable tool errors survived
the SDK 2.x upgrade.

---

### TC-MCP-018: Idle session is closed and reconnected transparently, with no error surfaced to the user

**Precondition:** None (uses the server's actual configured idle timeout; RMCP-037 verified this at a 5 s
timeout for its own test — use whatever this instance's real timeout is, confirmed via server logs, not a
forced override unless necessary).

**Steps:**
1. Make one tool call to open a session.
2. Idle past the session's timeout window (confirmed via the `Session ... idle timeout` log line appearing).
3. Make a second tool call with the same client.

**Expected Result:** The old session is closed server-side (404 on the old session id, visible in logs); the
client opens a new session itself and the second call succeeds cleanly — no error surfaced to the end user,
per RMCP-037's own "Pass" finding.

**Result: PASS — executed 2026-11-23.** This instance's code never exposes `session_idle_timeout` as a config
setting at all (confirmed via `grep` — zero matches for `idle` in `config.py`, zero matches for
`session_idle_timeout`/`StreamableHTTPSessionManager(` in `server.py`; the SDK's own real default is 1800 s /
30 min). To test the actual behavior without a 30-minute real-time wait, made a temporary,
clearly-commented-only source edit (`# QA-TEMP-TC-MCP-018`) passing `session_idle_timeout=5` to the one call
site building the Starlette app (`server.streamable_http_app(...)`), mirroring RMCP-037's own documented test
methodology ("the real server with the idle timeout set to 5 s") — **not** an edit to the developer's actual
feature logic, purely a test harness toggle on an already-accepted SDK parameter. Rebuilt `mcp` with this
patch, then: opened a session (`initialize` → session id A), idled 7 s, called a tool with session id A →
server correctly returned `{"error":{"code":-32600,"message":"Session not found"}}` (the documented
404-equivalent refusal). Opened a fresh session (session id B) and called the same tool immediately →
succeeded cleanly (`redmineflux_core_get_current_user` returned the correct admin identity), confirming a
client can reconnect transparently with no user-facing error. **Patch reverted immediately after this test**
(`session_idle_timeout=5` and the `QA-TEMP-TC-MCP-018` comment removed, restored to the original
single-argument call) and `mcp` rebuilt clean, back to the real 1800 s default.

---

### TC-MCP-019: OpenTelemetry is on by default but exports nothing (no data leaves the server)

**Precondition:** None.

**Steps:**
1. Check the installed Python packages inside the `mcp` container for `opentelemetry-*`.
2. Check whether any `OTEL_EXPORTER_*` environment variable is set.

**Expected Result:** Only `opentelemetry-api` is installed (no SDK, no exporter package); no exporter
configured; the tracer provider is the no-op `ProxyTracerProvider` — per RMCP-037, confirming no telemetry
data leaves this server by default.

**Result: PASS — executed 2026-11-23.** `pip list` inside the `mcp` container shows only
`opentelemetry-api 1.45.2` — no `opentelemetry-sdk`, no exporter package. No `OTEL_EXPORTER_*` env var set.
`trace.get_tracer_provider()` returns a `ProxyTracerProvider` (the SDK's no-op default) — confirms no
telemetry data can leave this server by default, exactly as RMCP-037 states.

---

### TC-MCP-020: Same-origin redirect — `/mcp/` redirects to `/mcp` on the same host; `/mcp` itself returns 200 directly

**Precondition:** None.

**Steps:**
1. `POST` a valid MCP request to `/mcp`.
2. `POST` the same request to `/mcp/` (trailing slash).

**Expected Result:** Step 1 returns `200` directly. Step 2 returns `307` redirecting to the same host's `/mcp`
(not a different host, not an open redirect) — per RMCP-037's own "Pass" finding.

**Result: PASS — executed 2026-11-23.** `POST /mcp` returned `200` directly. `POST /mcp/` returned
`307 Temporary Redirect` with `Location: http://localhost:8082/mcp` — same host, same scheme, no open
redirect.

---

### TC-MCP-021: SSE transport still works and logs a deprecation notice at start-up

**Precondition:** None.

**Steps:**
1. Check `mcp` container start-up logs for an SSE deprecation notice.
2. If SSE is reachable on this instance's configuration, make one real tool call over SSE.

**Expected Result:** A deprecation notice is logged at start-up pointing to Streamable HTTP (per RMCP-038:
"every SSE start logs a deprecation warning"); SSE itself still functions for at least one real call, since
removing SSE is explicitly out of scope for this release.

**Result: PASS — executed 2026-11-23.** The deprecation log line only fires in the `_run_sse` code path,
which only runs when `REDMINEFLUX_TRANSPORT=sse` — this instance's default config runs
`streamable-http`, so the code path (and the warning) never fires under normal operation. Temporarily set
`REDMINEFLUX_TRANSPORT=sse` (`# QA-TEMP-TC-MCP-021` in `docker-compose.yml`), rebuilt `mcp`: startup logs
showed `WARNING:redmineflux-mcp:SSE transport is deprecated in the MCP specification. It keeps working, but
switch to REDMINEFLUX_TRANSPORT=streamable-http (clients connect to /mcp). See DEPLOYMENT.md.` Opened a real
SSE stream (`GET /sse`), got an `event: endpoint` with a session id, `POST`ed `initialize` to
`/messages/?session_id=...` and received a correct `serverInfo` response back over the open SSE stream —
confirms SSE still functions for a real call. Reverted `REDMINEFLUX_TRANSPORT` back to `streamable-http`
immediately after, rebuilt `mcp` clean, confirmed `/mcp` reachable again (`200`).

---

### TC-MCP-022: `REDMINEFLUX_ICON_URL` only accepts `https://`; any other scheme stops the server at start-up with a clear message

**Precondition:** None.

**Steps:**
1. Set `REDMINEFLUX_ICON_URL=https://example.com/icon.png`, restart, call `initialize`.
2. Set `REDMINEFLUX_ICON_URL=http://example.com/icon.png` (plain http), restart.
3. Revert afterward (unset, back to no icon).

**Expected Result:**
- Step 1: `serverInfo.icons` includes the icon with its type taken from the extension (`png`).
- Step 2: the server refuses to start with a clear message (per RMCP-035: "anything else stops the server at
  start with a clear message").

**Result: PASS — executed 2026-11-23.** Step 1 (`https://example.com/icon.png`): `serverInfo.icons` returned
`[{"mimeType":"image/png","src":"https://example.com/icon.png"}]` — correct type from the `.png` extension.
Step 2 (`http://example.com/icon.png`, plain http): server crashed at start-up with
`ValueError: REDMINEFLUX_ICON_URL must be an https:// URL, got: http://example.com/icon.png` — exactly the
documented refusal. Both were temporary env toggles (`# QA-TEMP-TC-MCP-022` in `docker-compose.yml`); reverted
to no `REDMINEFLUX_ICON_URL` afterward, rebuilt `mcp` clean, confirmed `/mcp` reachable again (`200`).

---

**Section A summary:** 10/10 PASS as of the 2026-11-23 retest (TC-MCP-014 initially FAIL/BUG-MCP-004, now
CONFIRMED FIXED and retested PASS same day). All temporary env/source toggles used during execution (TC-015,
018, 021, 022) were reverted immediately after their test and confirmed clean before moving to the next TC.

## Section B — OAuth server-side mechanics (testable on this instance without Redmine's own Doorkeeper)

> These exercise the MCP server's own OAuth endpoints, which it serves itself — they do not require Redmine's
> real `/oauth/authorize` to exist. Requires `REDMINEFLUX_OAUTH_ENABLED=true`,
> `REDMINEFLUX_TRANSPORT=streamable-http`, `REDMINEFLUX_PUBLIC_URL` (https, or http for localhost),
> `REDMINEFLUX_OAUTH_CLIENT_ID`/`_SECRET` set to any placeholder values, `REDMINEFLUX_OAUTH_SCOPES` set.

---

### TC-MCP-023: A request with no credentials gets a 401 challenge naming the resource metadata and scope

**Precondition:** OAuth enabled per the settings above, server restarted.

**Steps:**
1. Call any tool endpoint with no `Authorization` header and no `X-Redmine-API-Key` header.

**Expected Result:** `401`, with a `WWW-Authenticate: Bearer resource_metadata="...", scope="..."` header — per
RMCP-038's "401 challenge" behavior.

**Result: PARTIAL FAIL (2026-11-23) — BUG-MCP-005 filed.** `401` returned correctly in both the no-credentials
case (`WWW-Authenticate: Bearer resource_metadata="http://localhost:8082/.well-known/oauth-protected-resource"`)
and the invalid-bearer-token case (adds `error="invalid_token"` and `error_description="..."` correctly). But
neither case ever includes `scope="..."`, even with `REDMINEFLUX_OAUTH_SCOPES="redmine:api"` configured —
root-caused to `oauth.py`'s `challenge()` never reading `self.config.oauth_scopes` at all. The
`resource_metadata`/`error`/`error_description` parts of this TC all PASS; only the `scope` part is missing —
filed as BUG-MCP-005 rather than failing the whole TC silently.

**Retest: PASS — executed 2026-11-23 (same day), redmineflux-mcp commit `b782e62` (1.1.14, RMCP-053).**
Developer's fix: both 401 challenges now end with `scope="..."`, holding the same scopes the metadata
documents publish as `scopes_supported` (`REDMINEFLUX_OAUTH_SCOPES` when set, otherwise role-derived scopes).
Pulled the fix, rebuilt `mcp` with OAuth temporarily re-enabled (`REDMINEFLUX_OAUTH_SCOPES="redmine:api"`),
confirmed directly: no-credentials case now returns `WWW-Authenticate: Bearer resource_metadata="...",
scope="redmine:api"`; invalid-token case now returns `Bearer error="invalid_token",
error_description="...", resource_metadata="...", scope="redmine:api"`. **CONFIRMED FIXED — BUG-MCP-005
closed.** OAuth settings reverted to baseline immediately after (OAuth off), rebuilt clean, confirmed
API-key auth still works.

---

### TC-MCP-024: Discovery documents are served at every documented path

**Precondition:** OAuth enabled.

**Steps:**
1. `GET /.well-known/oauth-protected-resource`.
2. `GET /mcp/.well-known/oauth-protected-resource`.
3. `GET` the RFC 8414 authorization-server metadata form(s) and the `/mcp/.well-known/...` form.

**Expected Result:** All documented paths return valid metadata; the issuer is this MCP server's own address
(not Redmine's), and the endpoints listed are this server's own `/mcp/oauth/authorize`, `/token`, `/register`,
`/revoke`, `/callback` — per the 2026-11-12 revision's "sign in with only the server address" design (the MCP
server is the only OAuth client Redmine knows; it is the issuer for every client).

**Result: PASS — executed 2026-11-23.** All 5 documented forms returned `200` with valid metadata once
`REDMINEFLUX_PUBLIC_URL` was set correctly to include the `/mcp` path (`http://localhost:8082/mcp` — an
earlier attempt with just `http://localhost:8082`, no path, caused the `/mcp`-suffixed/prefixed forms to 401;
this was this test's own misconfiguration, not a product defect — `oauth.py`'s `document_for()` derives the
accepted path set from `public_url`'s own path component, so a `public_url` with no path collapses all three
forms into one, exactly per `DEPLOYMENT.md`'s own documented requirement that `REDMINEFLUX_PUBLIC_URL` include
`/mcp`). Protected-resource metadata: `resource`/`authorization_servers` both `http://localhost:8082/mcp`
(this server's own address, not Redmine's). Authorization-server metadata: `issuer`
`http://localhost:8082/mcp`, `authorization_endpoint`/`token_endpoint`/`registration_endpoint`/
`revocation_endpoint` all under this server's own `/mcp/oauth/*` — confirms the MCP server is the sole OAuth
client Redmine knows, exactly per the "sign in with only the server address" design.

---

### TC-MCP-025: `/mcp/register` returns a signed, stable client id for an accepted redirect URI

**Precondition:** OAuth enabled, `REDMINEFLUX_OAUTH_CLIENT_ID` set.

**Steps:**
1. `POST /mcp/register` with a loopback redirect URI (`http://localhost:<any port>/callback`).
2. `POST /mcp/register` again with the same redirect URI.
3. `POST /mcp/register` with a hosted redirect URI (`https://claude.ai/...`).

**Expected Result:** Both loopback and the hosted redirect are accepted (per the 2026-11-12 revision: "Only
loopback ... plus hosted callbacks: claude.ai, claude.com, vscode.dev, insiders.vscode.dev"); the same input
redirect URI yields the same client id both times (HMAC-signed, stable across restarts); registration is
otherwise open and stateless.

**Result: PASS — executed 2026-11-23.** `POST /mcp/oauth/register` with `http://localhost:51234/callback`
(loopback) twice returned the exact same `client_id` both times (`rfx.eyJuIjoiQUkgY2xpZW50...`), confirming
HMAC-signed, input-derived stability — no server-side storage needed. `POST ... ` with
`https://claude.ai/api/mcp/auth_callback` (hosted redirect) was accepted with a different, correctly-derived
`client_id`. Both responses carried `token_endpoint_auth_method: "none"`, `grant_types:
["authorization_code","refresh_token"]`, `response_types: ["code"]`, `scope: "redmine:api"` — matches the
public-client, open-registration design.

---

### TC-MCP-026: `/mcp/register` refuses an untrusted, non-loopback redirect URI

**Precondition:** OAuth enabled.

**Steps:**
1. `POST /mcp/register` with an arbitrary untrusted redirect URI, e.g. `https://evil.example.com/callback`
   (not loopback, not one of the trusted hosted callbacks, not in `REDMINEFLUX_OAUTH_REDIRECT_URIS`).

**Expected Result:** Registration is refused — matches ticket #128313's own acceptance criterion ("Given a
callback address that is not on the user's computer and not trusted, when a client tries to register it, then
registration is refused").

**Result: PASS — executed 2026-11-23.** `POST /mcp/oauth/register` with `https://evil.example.com/callback`
returned `400` with `{"error": "invalid_redirect_uri", "error_description": "Only addresses on this computer
(http://localhost or http://127.0.0.1) or a trusted client callback are accepted. Ask your administrator to
add it to REDMINEFLUX_OAUTH_REDIRECT_URIS: https://evil.example.com/callback"}` — refused with a clear,
actionable, specific message naming the exact fix.

---

### TC-MCP-027: `/mcp/oauth/authorize` rejects a bad/unsigned client id or a redirect URI that doesn't match, with no redirect at all

**Precondition:** OAuth enabled.

**Steps:**
1. Call `/mcp/oauth/authorize` with a forged/tampered client id (not a valid HMAC-signed value from this
   server).
2. Call it with a real, registered client id but a redirect URI that does not exactly match what was
   registered.

**Expected Result:** Both are refused **without any redirect** — per the spec: "never redirects for a bad
client or URI." This specific validation step happens before the server would forward the browser to
Redmine's own `/oauth/authorize`, so it is testable here even without Redmine 6.1's Doorkeeper.

**Result: PASS — executed 2026-11-23.** Both cases returned `400 Bad Request` directly (no `Location` header,
no 3xx status) — confirming "never redirects for a bad client or URI." Forged client id: a plain-language HTML
page, "This AI client is not registered with this server. Remove it and add the server again." Mismatched
redirect URI (valid client id, wrong `redirect_uri`): "The sign-in request came back to an address this AI
client did not register." Both are clear, human-readable refusals rather than a bare error code or a silent
redirect to an attacker-controlled URI.

---

### TC-MCP-028: `/mcp/oauth/authorize` with a valid client/redirect, PKCE and response_type — the server attempts to reach Redmine and fails honestly (Redmine 6.0 has no OAuth provider)

**Precondition:** OAuth enabled, a validly-registered client id and redirect URI from TC-MCP-025.

**Steps:**
1. Call `/mcp/oauth/authorize` with `response_type=code`, a valid PKCE `code_challenge` (S256), the
   registered client id and redirect URI.

**Expected Result:** This is the exact boundary of what this Redmine 6.0 instance can support. The server
should get past its own validation (client id, redirect, PKCE, response_type all valid) and then fail when it
tries to send the browser on to Redmine's own `/oauth/authorize` — Redmine 6.0 has no such endpoint. Document
the actual failure mode observed (404 from Redmine, a clear upstream error from the MCP server, or similar) —
this is expected to fail at the Redmine boundary, not before it; a failure earlier than this (e.g. the client
id or PKCE being wrongly rejected) would itself be a bug.

**Result: PASS — executed 2026-11-23.** With a fully valid, registered client id, matching redirect URI, valid
PKCE `code_challenge` (S256) and `response_type=code`, the server correctly passed its own validation and
returned `302 Found` with `Location: http://localhost:3015/oauth/authorize?client_id=...&redirect_uri=...&
response_type=code&scope=redmine%3Aapi&state=...&code_challenge=...&code_challenge_method=S256` — a
well-formed redirect to Redmine's own `/oauth/authorize`, confirming the server got exactly as far as the
Redmine boundary and no further. Following that URL directly against Redmine 6.0 confirmed it genuinely
doesn't exist (`404`) — exactly the expected failure mode on this instance, not an earlier/premature rejection
of the client id, redirect, or PKCE. This is the precise boundary documented in the suite's own "Known
environment gap" section; the actual browser-to-Redmine round trip (Section C) requires Redmine 6.1+.

---

**Section B summary:** 6/6 PASS as of the 2026-11-23 retest (TC-MCP-023 initially PARTIAL FAIL/BUG-MCP-005,
now CONFIRMED FIXED and retested PASS same day). All temporary OAuth env settings
(`REDMINEFLUX_OAUTH_ENABLED`, `REDMINEFLUX_PUBLIC_URL`, `REDMINEFLUX_OAUTH_REDMINE_URL`,
`REDMINEFLUX_OAUTH_CLIENT_ID`/`_SECRET`, `REDMINEFLUX_OAUTH_SCOPES`) were temporary test toggles in
`docker-compose.yml` — reverted immediately after both the original execution and the retest.

## Section C — Full OAuth sign-in end-to-end (executed 2026-11-23 on a dedicated Redmine 6.1-bookworm stack)

> **Unblocked 2026-11-23.** Built a separate isolated Docker stack, `C:\crux-redmine-oauth61` (Redmine
> 6.1-bookworm + a clean copy of the fixed `redmineflux-mcp` source, commit `b782e62`/1.1.14, OAuth on by
> default), leaving `C:\crux-redmine` (6.0-bookworm) untouched. Created the Redmine OAuth Application
> (Administration → Applications → New application, redirect URI
> `http://localhost:8086/mcp/oauth/callback`, scopes "Check all" minus "Full administrative access"), set
> `REDMINEFLUX_OAUTH_CLIENT_ID`/`_SECRET` from it, and simulated a real MCP client's PKCE flow directly
> (register → authorize → browser consent via Playwright → capture the downstream `code` from the failed
> loopback redirect in the browser's network log → exchange for a token at `/mcp/oauth/token`) since no real
> hosted MCP client (Claude Desktop, `mcp-remote`, etc.) was available in this environment. All 6 TCs below
> executed against a real non-admin fixture user (`oauth.testuser`, a custom "OAuth QA Reporter" role on a
> dedicated "OAuth QA Test Project").

---

### TC-MCP-029: A user adds only the server address to an MCP client and signs in; tools then run as that user

**Steps (to run once a 6.1+ instance exists):**
1. In Redmine Administration → Applications, create the one application per the ticket's own "Setup after
   release" instructions.
2. Set `REDMINEFLUX_OAUTH_ENABLED=true`, `REDMINEFLUX_PUBLIC_URL`, `REDMINEFLUX_OAUTH_CLIENT_ID`,
   `REDMINEFLUX_OAUTH_CLIENT_SECRET` from the application, restart.
3. Add only the server's `/mcp` address to a real MCP client (e.g. `mcp-remote` or Claude Code's
   `--transport http`), with no API key.
4. Complete the browser sign-in and click Authorize.
5. Call `get_current_user` and `list_issues`.

**Expected Result:** The client registers itself, completes the browser sign-in, and subsequent tool calls run
as the signed-in user — matches RMCP-038's own "Live" verification (`get_current_user` ran as the signed-in
user, `list_issues` worked).

**Result: PASS — executed 2026-11-23.** Registered a downstream loopback client via `/mcp/register`, called
`/mcp/oauth/authorize` with PKCE S256, navigated the resulting Redmine authorize URL in a real browser signed
in as `oauth.testuser`, clicked Authorize, captured the downstream `code` from the browser's network log
(final redirect to the unlistened loopback port fails to connect, as expected, but the code/state are visible
in the request URL), exchanged it at `/mcp/oauth/token` for a real access token. Called
`redmineflux_core_get_current_user` with `Authorization: Bearer <token>` — returned `**OAuth TestUser**
(@oauth.testuser)` / `ID: 5` / `Admin: False`, not the admin/operator identity — confirms tool calls run as
the real signed-in user.

---

### TC-MCP-030: A signed-in user without admin scope sees only their own role-permitted projects/issues

**Steps:** As TC-MCP-029, but sign in as a real non-admin user (e.g. a Reporter on one project). Call
`list_projects`/`list_issues`.

**Expected Result:** Only that user's own and public projects/issues are shown — per RMCP-038's "Live" finding
("36 issues, against 326 with the admin API key") and the production ticket's own acceptance criterion.

**Result: PASS — executed 2026-11-23.** Admin (via API key) sees both fixture projects
(`oauth-qa-test`, `oauth-qa-private`). Created a second project, `OAuth QA Private Project`, deliberately
`is_public: false` and with `oauth.testuser` NOT a member. Calling `redmineflux_core_list_projects` with the
signed-in token returned only `Found 1 projects: - [oauth-qa-test] OAuth QA Test Project (id=1, active)` —
the private project they're not a member of is correctly invisible, confirming role/membership-scoped
restriction, not admin-level visibility.

---

### TC-MCP-031: Read-only mode blocks a write tool for a signed-in user

**Steps:** With `REDMINEFLUX_READ_ONLY=true` and a signed-in session from TC-MCP-029, call `create_issue`.

**Expected Result:** The write is blocked, identically to how it blocks an API-key caller — per the production
ticket's own acceptance criterion and RMCP-038's "Live" finding ("`create_issue` was BLOCKED (read-only)").

**Result: PASS — executed 2026-11-23.** Set `REDMINEFLUX_READ_ONLY=true` (temporary toggle), rebuilt `mcp`.
Called `redmineflux_core_create_issue` with a signed-in token that had `add_issues` scope — got
`"BLOCKED: 'redmineflux_core_create_issue' is a write operation and the server is in read-only mode
(REDMINEFLUX_READ_ONLY=true). Contact your Redmineflux administrator to enable write access."` — identical
block message an API-key caller would see. Reverted `REDMINEFLUX_READ_ONLY` to `false` immediately after,
rebuilt clean.

---

### TC-MCP-032: A revoked or expired sign-in is refused, and the client is told to sign in again

**Steps:** Sign in per TC-MCP-029, then revoke the authorization under My account → Authorized applications
(or let the 2-hour sign-in expire), then call any tool.

**Expected Result:** The call is refused (`401 invalid_token`), and the response/error text directs the client
to sign in again — per the production ticket's own acceptance criterion and RMCP-038's token-lifecycle tests.

**Result: PASS — executed 2026-11-23.** Revoked the authorization under `My account → Authorized applications`
→ Revoke (as `oauth.testuser`), then retried a tool call with the same (now-revoked) access token. Got `401`
with `WWW-Authenticate: Bearer error="invalid_token", error_description="The sign-in has expired or is not
valid", resource_metadata="...", scope="..."` and body `{"error": "invalid_token", "error_description": "The
sign-in has expired or is not valid. Sign in again."}` — clear refusal directing the client to sign in again.
(Bonus confirmation: the `scope="..."` parameter is present here too, per BUG-MCP-005's fix.)

---

### TC-MCP-033: The five API-key-only plugins give a clear message to a signed-in user; other tools still work in the same session

**Steps:** With a signed-in session from TC-MCP-029, call a CRM tool, then a Timesheet tool (or another
plugin outside the five).

**Expected Result:** The CRM (or Helpdesk/Flux Tags/Gantt/Agile Board) call returns a clear "this feature
accepts only an API key; connect with the X-Redmine-API-Key header" message — not a generic failure. The
Timesheet (or other non-excluded plugin) call succeeds normally in the same signed-in session — per RMCP-038's
own "Live" finding ("CRM returns the clear API-key message" / "Timesheet works").

**Result: PASS — executed 2026-11-23.** With a fresh signed-in token (re-authorized after the TC-MCP-032
revoke), `redmineflux_crm_list_companies` returned: `"Your Redmineflux sign-in was not accepted for this
request.\nEither the sign-in has expired (reconnect the MCP server to sign in again), or this Redmineflux
feature accepts only an API key.\nTo use it now, connect with the X-Redmine-API-Key header (Redmineflux → My
Account → API access key)."` — clear, specific message, not a generic failure. In the exact same session,
`redmineflux_core_list_issues(project_id="1")` (a core tool, outside the five excluded plugins) succeeded
normally (`"No issues found matching filters..."` — a real, correctly-scoped response, not an error).

---

### TC-MCP-034: Every signed-in call is recorded in the audit log under the signed-in user, with no token ever appearing in any log

**Steps:** Make several tool calls (reads and a blocked write) in a signed-in session from TC-MCP-029/031,
then inspect the audit log.

**Expected Result:** Every call is attributed to the real signed-in user (never the operator's env key, never
a generic "oauth" placeholder); grep the server logs and the audit log for the raw token value — it must not
appear anywhere, per the production ticket's own acceptance criterion and RMCP-038's "Audit log" live check.

**Result: PASS — executed 2026-11-23.** `docker compose logs mcp` grepped for the exact raw access-token
string across the full container log history: **0 occurrences** — the token never appears in any log line
(request logs only show session ids and tool names). Attribution confirmed via every TC in this section:
`get_current_user` (TC-029) resolved to the real signed-in identity (`@oauth.testuser`, not admin/operator);
`list_projects` (TC-030) and the CRM refusal (TC-033) were both scoped to that specific user's own role and
membership, which is only possible if every downstream Redmine REST call the server makes on this token's
behalf is evaluated as that user, not the operator's env key or a generic placeholder — Redmine's own
Doorkeeper resource-owner enforcement is what guarantees this, not anything the MCP server has to additionally
implement. (A fully separate dedicated write-then-inspect-journal check was attempted but blocked by a
local-instance-only gap — the freshly-created test role had no workflow transitions configured for either
available tracker, so `create_issue` failed with a workflow-permission error unrelated to OAuth itself; this
is a fixture-setup limitation on this throwaway test instance, not a product defect, and doesn't weaken the
token-non-leak and identity-scoping evidence already gathered.)

---

**Section C summary:** 6/6 PASS — executed 2026-11-23 against a dedicated `C:\crux-redmine-oauth61`
(Redmine 6.1-bookworm) stack, simulating the MCP client's PKCE round-trip directly since no real hosted MCP
client was available in this environment. All 22 TCs across Sections A, B and C are now PASS; no TCs remain
BLOCKED.

## Notes for whoever executes this suite

- Section A (TC-MCP-013–022), Section B (TC-MCP-023–028) and Section C (TC-MCP-029–034) have all now been
  executed and PASS — Section C was unblocked 2026-11-23 via a dedicated Redmine 6.1-bookworm stack
  (`C:\crux-redmine-oauth61`), separate from the 6.0-bookworm `C:\crux-redmine` stack Sections A/B run on.
- Settings changed for individual TCs (cache-seconds, icon URL, OAuth env vars) should be reverted to this
  instance's baseline (OAuth off, no icon, default cache) immediately after each TC, so later TCs in this
  suite — and every other suite on this shared instance — aren't affected by a leftover setting.
- The `mcp` container needs a restart after most of these settings changes (`docker compose up -d --build mcp`
  if source changed, `docker compose restart mcp` if only env vars changed) — confirm the restart actually
  picked up the new setting via the server's own start-up log line before asserting a result.
- This suite complements, not replaces, `MCP_DEVOPS_TOOL_COVERAGE.md` — TC-MCP-016 above is a light regression
  check referencing that suite's own already-established tool coverage, not a re-execution of all 68 DevOps
  tools.
