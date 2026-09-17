# Bug Report Template

- Bug ID: BUG-CRX-004
- Production Redmine Issue ID: #120575 (ztflux, flux.zehntech.com — reported 2026-09-14, linked to testcase #120481 in run #569 "Crux QA Run 1")
- Title: Ask Crux's MCP client never recovers from a stale/invalid session — a single expired session permanently breaks chat for ALL users until crux-core is manually restarted
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`, crux-core `http://localhost:8787`, MCP `http://localhost:8082/mcp`
- Browser: Chromium (Playwright MCP) + manual (user's browser)
- User role: `luna.blossom` (any authenticated user is affected — this is process-wide, not per-user)
- Date: 2026-09-14

## Steps to reproduce

1. Use Ask Crux normally (works fine while the underlying MCP session is fresh).
2. Let the environment sit idle for an extended period (in this case, several days between test sessions) — long enough for the MCP server's Streamable-HTTP session (`Mcp-Session-Id`) to expire or be evicted server-side.
3. Ask Crux anything again (in a brand-new chat session, not resuming an old one).

## Expected result

- The client should detect that its cached MCP connection/session is no longer valid (e.g. on a `404` from the MCP endpoint) and transparently re-establish a fresh session (re-run the `initialize` handshake), so the user's request succeeds without anyone needing to intervene — consistent with the module's own stated design goal (`_connection()`'s docstring: "Lazy singleton with reconnect-on-drop AND reconnect-on-identity-change").

## Actual result

- Every chat message — including in a **brand-new** chat session (ruling out a stale browser-side session as the cause) — failed identically: *"I couldn't reach the tool server: Streamable HTTP POST to MCP failed: HTTP Error 404: Not Found."*
- Root-caused via `redmineflux-crux-core/crux_core/askcrux/mcp_client.py`: `_connection()` keeps a single **process-wide singleton** (`_CONN`), reused across every chat session and every user. It only tears down and reconnects when (a) the connection is already marked `dead`, or (b) the acting Redmine identity/API key changes. **It has no logic to detect a `404` (invalid/expired `Mcp-Session-Id`) as "this session is gone, reconnect"** — `_StreamableConnection._post()` just raises `McpError` and the exception propagates up as a failed reply; the singleton itself is left in place, still holding the now-dead `self._session_id`, so **every subsequent call from every user fails the same way forever**.
- Confirmed via container logs (`docker logs crux-core`): two calls at `11:00:28` and `11:01:21` both failed identically for `tool=tools/list`, correlated with the MCP container's own access log showing the exact same `POST /mcp → 404` at those timestamps — with no preceding "auth rejected" warning, i.e. auth succeeded and the request reached the session-handling layer before failing.
- **Fix that worked:** manually restarting the `crux-core` container (`docker restart crux-core`) — which resets the in-process Python global `_CONN` to `None` — immediately fixed it; the next call did a fresh `initialize` and succeeded (verified: `tools/list` returned 94 tools, followed by successful `redmineflux_core_search`/`redmineflux_core_get_issue` calls).
- **Impact:** this is a full outage of the Ask Crux chat feature for every user simultaneously (the singleton is global, not per-user/per-session), with no automatic recovery and no visible admin-facing alert — only individual users seeing a raw error message. It will recur after any sufficiently long idle period (overnights, weekends) in a real deployment, not just in this local dev environment.

## Evidence

### Screenshot

Not applicable — this is a backend session-management defect, evidenced via server logs and source review, not a UI rendering issue.

### Console / log

```
crux-core:  2026-09-14T11:00:28.147+00:00 WARN [core.askcrux.mcp] [ses:ses-105] mcp call tool=tools/list ok=false error=Streamable HTTP POST to MCP failed: HTTP Error 404: Not Found
crux-core:  2026-09-14T11:01:21.167+00:00 WARN [core.askcrux.mcp] [ses:ses-105] mcp call tool=tools/list ok=false error=Streamable HTTP POST to MCP failed: HTTP Error 404: Not Found
crux-core:  2026-09-14T11:05:07.411+00:00 WARN [core.askcrux.mcp] [ses:ses-106] mcp call tool=tools/list ok=false error=Streamable HTTP POST to MCP failed: HTTP Error 404: Not Found   <- brand-new chat session, same failure
mcp:        172.22.0.3:xxxxx - "POST /mcp HTTP/1.1" 404 Not Found   (x3, no auth-rejection warning preceding any of them)

--- after `docker restart crux-core` ---
crux-core:  2026-09-14T11:07:22.461+00:00 INFO [core.askcrux.mcp] [ses:ses-107] mcp call tool=tools/list ok=true tools=94
crux-core:  2026-09-14T11:07:27.144+00:00 INFO [core.askcrux.mcp] [ses:ses-107] mcp call tool=redmineflux_core_search ok=true
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff updated `mcp_client.py` exactly per the suggested fix direction below: `_StreamableConnection._post()` now catches `urllib.error.HTTPError` specifically when `e.code == 404 and self._session_id`, calls `self.dead.set()`, and raises a distinct `McpError("MCP session expired (404) — reconnecting on next call")`. `_connection()`'s existing reconnect-on-drop check (`if _CONN is None or _CONN.dead.is_set()`) then opens a fresh session automatically on the very next call — no code changes needed there since the drop-detection path already existed for other failure modes.

**Retest steps:** With `crux-core` already running with a live, working MCP singleton connection (proven by earlier successful chat calls in this session), restarted **only** `crux-redmine-docker-mcp-1` via `docker restart` — deliberately never touching `crux-core` — to invalidate the MCP-side session the same way a multi-day idle period originally did. Then, as `luna.blossom`, started a brand-new Ask Crux chat session and sent "What are the agents working on?" (a tool-calling query).

**Result:** The call succeeded immediately and cleanly — `mcp call tool=tools/list ok=true tools=453` followed by a full successful chat turn (`outcome=success`), with zero errors logged. Under the original bug, this exact sequence (MCP-side session gone, `crux-core` never restarted) produced a permanent `"Streamable HTTP POST to MCP failed: HTTP Error 404: Not Found"` on every subsequent call from every user, recoverable only via a manual `docker restart crux-core`. This time, no manual `crux-core` restart was performed at any point, and chat kept working normally.

**Verdict: FIXED.** The self-healing behavior described in the suggested fix direction is confirmed live, not just at the code level.

## Note for triage

Suggested fix direction for dev: in `_StreamableConnection._post()` (or the caller in `mcp_client.py`), treat an `HTTPError` with code `404` (or any error indicating an unrecognized `Mcp-Session-Id`) as "session invalid" — mark the connection `dead` (or clear `self._session_id`) and let `_connection()`'s existing reconnect-on-drop path re-run `initialize` on the next call, the same way a genuinely dropped connection is already handled. This would make the singleton self-healing without needing an operator to restart the whole crux-core process.

Reported to production 2026-09-14 as issue **#120575** in `ztflux`, via `redmineflux_testcases_management_report_defect` (user approval obtained). Linked to testcase #120481, Run #569 "Crux QA Run 1", Environment "Window 11 + Chrome". Testcase #120481 marked Failed. This bug MD file attached to #120575 (2026-09-14, via `upload_file` + `update_issue`).

Assigned to **Prashant Chaurasia** (user id 410) on production, 2026-09-15.
