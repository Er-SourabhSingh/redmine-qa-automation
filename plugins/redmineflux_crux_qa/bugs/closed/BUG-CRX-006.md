# Bug Report Template

- Bug ID: BUG-CRX-006
- Production Redmine Issue ID: #120606 (ztflux, flux.zehntech.com — reported 2026-09-15, linked to testcase #120489 in run #569 "Crux QA Run 1")
- Title: The shared `RedminefluxCrux::Proxy`/`CoreClient` module discards crux-core's real HTTP status on every proxied JSON call — all 12 Crux controllers always answer 200, even when core documents 400/404/etc.
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP), plus direct `fetch()` calls from the browser console
- User role: Administrator (found while executing TC-CRX-081, Structured log viewer)
- Date: 2026-09-15

## Steps to reproduce

1. As Administrator, open Administration → Crux — Logs, or call `GET /crux/admin/logs.json?level=BOGUS&limit=10` directly.
2. `redmineflux-crux-core/docs/API.md` documents `GET /api/logs?level=...`: `"level" | minimum severity — DEBUG < INFO < WARN/WARNING < ERROR; unknown value → 400`.
3. Observe the actual HTTP response status code returned to the browser, not just the JSON body.

## Expected result

- Per core's own documented contract, an unknown `level` value should produce an HTTP `400` response (the JSON body's `ok:false` is a secondary signal, not a replacement for the status code — this matches the same doc's own opening statement: "validation/caller errors are `400`... missing resources `404`... provider/upstream failures `502`").

## Actual result

- The response is HTTP `200 OK` with body `{"ok":false,"error":"unknown level 'BOGUS'"}` — the JSON correctly reports the failure, but the HTTP status line lies about it.
- Root-caused in the plugin source, not core: `redmineflux_crux/lib/redmineflux_crux/core_client.rb`'s `self.request` (used by both `self.get` and `self.post`) does `JSON.parse(res.body)` as its sole return value — `res.code` (core's real HTTP status) is read only for a log line (`log(:info, "core #{req.method} #{path} status=#{res.code} ...")`) and is then thrown away. It never reaches the caller.
- `redmineflux_crux/lib/redmineflux_crux/proxy.rb`'s `proxy_get`/`proxy_post` then do `render json: RedminefluxCrux::CoreClient.get(path)` with **no `status:` option at all** — Rails defaults every such response to `200`, regardless of what core actually returned, UNLESS the connection itself failed (`CoreUnavailable`, correctly mapped to `502`).
- This is not confined to the Logs page: `grep` shows **12 controllers** share this exact `proxy_get`/`proxy_post` path — `crux_project_controller.rb`, `crux_pipelines_controller.rb`, `crux_mentions_controller.rb`, `crux_issue_controller.rb`, `crux_improve_controller.rb`, `crux_frozen_rules_controller.rb`, `crux_dashboard_controller.rb`, `crux_ask_controller.rb`, `crux_agents_controller.rb`, `crux_admin_settings_controller.rb`, `crux_admin_logs_controller.rb`, `crux_admin_keys_controller.rb`. Every documented non-2xx response from core on any of these paths (validation `400`s, `404`s for missing resources, etc.) is silently downgraded to `200` by the time it reaches the browser or any API consumer.
- Impact: any client, script, monitoring/alerting rule, or future frontend code that follows the standard REST convention of checking the HTTP status code (rather than parsing every response body for `ok:false`) will incorrectly treat these as successful calls. This also makes core's own documented status-code contract (API.md's own words: "Status codes: validation/caller errors are `400`... missing resources `404`... provider/upstream failures `502`") systematically false once anything goes through this Redmine-side proxy.
- Note: the streaming path (`post_stream`, used for chat) is NOT affected — `StreamRefusal` explicitly carries and can pass through `status`/`body` separately; this bug is specific to the non-streaming `request`/`proxy_get`/`proxy_post` path.

## Evidence

### Screenshot

Not captured — this is an HTTP-status-level finding, not a rendering defect; verified via direct `fetch()` calls (see Console/log) and confirmed against source.

### Console / log

- `fetch('/crux/admin/logs.json?limit=10&level=BOGUS')` → `status: 200`, body `{"ok":false,"error":"unknown level 'BOGUS'"}` (documented expectation: `400`).
- Source: `redmineflux_crux/lib/redmineflux_crux/core_client.rb:141-149` (`res = http.request(req)` ... `JSON.parse(res.body)` — `res.code` never returned) and `redmineflux_crux/lib/redmineflux_crux/proxy.rb:10-14` (`render json: ...` with no `status:`).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff updated `core_client.rb` and `proxy.rb` exactly per the root-cause description above: `CoreClient.request` now returns `[res.code.to_i, JSON.parse(res.body)]` instead of discarding the status, and `proxy_get`/`proxy_post` destructure `status, body` and pass `status:` through to `render json: body, status: status`. The three direct callers in `crux_admin_settings_controller.rb` (`capability_map`, `capability_map_save`, `capability_map_delete`) were updated the same way.

**Retest:** Navigated directly to `http://localhost:3014/crux/admin/logs.json?level=BOGUS&limit=10` (same exact repro URL as the original finding). Playwright's own navigation result reports **`HTTP status: 400 Bad Request`**, body unchanged (`{"ok":false,"error":"unknown level 'BOGUS'"}`). Previously this was always `200`.

**Verdict: FIXED.** Not separately re-verified against all 12 affected controllers this session, but the fix is in the one shared module (`CoreClient`/`Proxy`) every controller funnels through, so the single confirmed case generalizes.

Reported to production 2026-09-15 as issue **#120606** in `ztflux`, via `redmineflux_testcases_management_report_defect`. Linked to testcase #120489, Run #569 "Crux QA Run 1", Environment "Window 11 + Chrome". Testcase #120489 marked Failed. This bug MD file attached to #120606 (2026-09-15, via `upload_file` + `update_issue`).

Assigned to **Prashant Chaurasia** (user id 410) on production, 2026-09-15.
