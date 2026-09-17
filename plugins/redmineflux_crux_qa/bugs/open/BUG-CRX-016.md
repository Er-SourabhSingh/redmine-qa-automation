# Bug Report Template

- Bug ID: BUG-CRX-016
- Production Redmine Issue ID: #120696
- Title: redmineflux-mcp's one-shot startup plugin-detection sweep has no retry-after-degraded-start — if Redmine isn't reachable within 60s of MCP's own boot, ALL plugin tools (CRM, Timesheet, Workload, etc.) are silently and permanently disabled until the MCP container is manually restarted
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (surfaced via the Sales Agent / Ask Crux chat, but the defect itself lives in `redmineflux-mcp`)
- Plugin version: redmineflux-mcp v0.2.2 / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`, MCP `crux-redmine-docker-mcp-1`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (process-wide — affects every user and every domain agent, not per-user)
- Date: 2026-09-16

## Steps to reproduce

1. Start (or restart, e.g. via a host reboot / `docker compose up`) the full stack such that the `redmineflux-mcp` container and the `crux-redmine` (Redmine) container boot at roughly the same time, with Redmine taking longer than ~60 seconds to become reachable at `http://redmine:3000` (a real, unremarkable scenario — Redmine/Rails is a heavier service than the MCP server and commonly takes longer to become ready, especially on a cold host boot with many containers starting simultaneously).
2. Once everything reports "Up" in `docker ps`, ask any domain agent a real question via Ask Crux chat, e.g. "CRM, what's the state of our pipeline?"
3. Observe the response.

## Expected result

- Plugin tool availability should reflect the CRM plugin's real, current installed state — which does not change based on how long Redmine took to boot. Ideally the MCP server would retry its plugin-detection sweep (or at least retry on next demand) rather than caching a one-time failure for its entire process lifetime.

## Actual result

- `docker logs crux-redmine-docker-mcp-1` showed the server's own startup self-test failing 15 times over 60 seconds ("cannot reach http://redmine:3000 yet ... retrying") before giving up: `ERROR:redmineflux-mcp:Startup self-test FAILED: http://redmine:3000 still unreachable after 60s (15 attempts)`, followed by `WARNING:redmineflux-mcp:Redmine not reachable or API key invalid. Server starting in degraded state — tools will return errors.`
- Because of this, the server's one-time plugin-detection sweep (which itself depends on reaching Redmine) found **0 of 14 known plugins** and logged `Plugin not detected: crm (skipped)` (and the same for all 13 others). The final tool count was `94 tools (92 core + 0 plugin + 2 crux)` — every single plugin-specific tool set (CRM, Timesheet, Workload, Helpdesk, Invoice, Knowledgebase, Testcase Management, DevOps, Budget/Audit) was unavailable for the entire remaining life of the container, **even though Redmine came up normally moments later and was fully reachable and serving real CRM data the whole time this was reported**.
- The user-visible symptom in chat: asking the Sales Agent "CRM, what's the state of our pipeline?" produced a confident, well-formed, but **entirely false** answer: *"I see that the tools loaded are Redmine project/issue tools, not CRM-specific tools... This Redmine instance does not appear to have the CRM plugin enabled."* The CRM plugin was demonstrably enabled and populated with real data the whole time (contacts, companies, deals, leads all visible on `/crm`, `/contacts`, `/deals`, etc.) — the agent's diagnosis was confidently wrong because it correctly read its own (broken) tool list, but had no way to know that tool list itself was stale/wrong.
- **Fix that worked:** `docker restart crux-redmine-docker-mcp-1` (now that Redmine was definitely reachable) — the restarted MCP server immediately detected 9/14 plugins correctly (`crm — 43 tools`, plus timesheet, workload, knowledgebase, testcases_management, helpdesk, budget_audit, invoice, devops), for a total of `451 tools (92 core + 357 plugin + 2 crux)`. A follow-up `docker restart crux-core` (so crux-core's own MCP client singleton would pick up a fresh session against the now-healthy MCP server) and then the same "CRM, what's the state of our pipeline?" question produced a fully correct, grounded answer citing all 3 real deals and the real $76,250 total pipeline value.
- **Impact:** this is a full, silent outage of every plugin-domain agent's write AND read capability (CRM, Timesheet, Workload, Helpdesk, Invoice, KB, Testcase Management, DevOps, Budget/Audit) triggered purely by container startup ordering/timing — not by any actual configuration problem, plugin uninstall, or user action. It will recur on every host reboot or `docker compose` restart where Redmine happens to take over 60 seconds to become reachable, which is a normal occurrence, not an edge case. Unlike BUG-CRX-004 (a stale MCP *session* that crux-core's own client fails to self-heal from), this is the MCP server's own one-shot plugin-detection sweep at process boot having no retry/refresh path at all afterward — a distinct root cause needing a distinct fix (e.g. retry plugin detection lazily on first plugin-tool-call attempt, or periodically in the background, rather than only once at startup with a hard timeout).

## Evidence

### Screenshot

Not applicable — a backend startup-timing/plugin-detection defect, evidenced via container logs and a live chat exchange, not a UI rendering issue.

### Console / log

```
--- crux-redmine-docker-mcp-1, at container boot (today) ---
WARNING:redmineflux-mcp:Startup self-test: cannot reach http://redmine:3000 yet (attempt 1) -- Redmine may still be starting, retrying...
... (attempts 2-15, ~4s apart) ...
ERROR:redmineflux-mcp:Startup self-test FAILED: http://redmine:3000 still unreachable after 60s (15 attempts)
WARNING:redmineflux-mcp:Redmine not reachable or API key invalid. Server starting in degraded state -- tools will return errors.
INFO:redmineflux-mcp:Detecting installed plugins (14 known)...
INFO:redmineflux-mcp:Plugin not detected: crm (skipped)
... (all 14 plugins skipped) ...
INFO:redmineflux-mcp:Redmineflux MCP v0.2.2: 94 tools (92 core + 0 plugin + 2 crux). Detected plugins: none (0/14).

--- chat exchange while MCP was in this degraded state ---
C: CRM, what's the state of our pipeline?
-> asking the Sales Agent...
I see that the tools loaded are Redmine project/issue tools, not CRM-specific tools. It appears the CRM
plugin tools (redmineflux_crm_dashboard, redmineflux_crm_pipeline, etc.) are not available in this
deployment. This Redmine instance does not appear to have the CRM plugin enabled.

--- after `docker restart crux-redmine-docker-mcp-1` (Redmine now reachable) ---
INFO:httpx:HTTP Request: GET http://redmine:3000/api/crm.json "HTTP/1.1 200 OK"
INFO:redmineflux-mcp:Loaded plugin: crm -- 43 tools (Contacts, companies, deals, leads, pipeline, activities -- full CRUD)
INFO:redmineflux-mcp:Redmineflux MCP v0.2.2: 451 tools (92 core + 357 plugin + 2 crux). Detected plugins: knowledgebase, timesheet, workload, budget_audit, testcases_management, helpdesk, invoice, devops, crm (9/14).

--- after also `docker restart crux-core`, same question re-asked ---
C: CRM, what's the state of our pipeline?
-> asking the Sales Agent...
[real grounded answer citing all 3 deals -- Acme Corp Renewal, Acme Industries Expansion, Zenith Corp
Upgrade -- and the correct total pipeline value of $76,250]
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but a distinct root cause from, BUG-CRX-004 — that bug is crux-core's MCP *client* failing to self-heal from a stale/expired session against an otherwise-healthy MCP server with plugins already loaded; this bug is the MCP *server* itself never discovering the plugins in the first place, because its one-shot startup sweep raced Redmine's own boot time and gave up permanently)

## Note for triage

Suggested fix direction for dev: make plugin detection retryable rather than a one-shot startup check — e.g. lazily re-attempt detection for a plugin the first time one of its tools is actually invoked and found "not loaded" (mirroring how `tools/list` is called fresh per session anyway), or run a low-frequency background retry for some bounded window after a degraded start, so a slow Redmine boot doesn't permanently disable plugin tools for the container's entire remaining lifetime.

## Production report

Reported to production as issue **#120696** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`) — testcase marked Failed.
