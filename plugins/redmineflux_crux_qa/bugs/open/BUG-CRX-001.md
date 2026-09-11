# Bug Report

- Bug ID: BUG-CRX-001
- Production Redmine Issue ID: #120514 (ztflux, flux.zehntech.com — reported 2026-09-11, linked to testcase #120489 in run #569 "Crux QA Run 1")
- Title: LLM provider "Test Connection" reports false-positive success regardless of key validity
- Redmine version: 7.0.0 (local Docker, `crux-redmine`)
- Plugin name: redmineflux_crux (crux-core service, CRX-49 provider admin)
- Plugin version: crux-core 0.92.0
- Environment: Local — `C:\Crux-Redmine-Docker`, crux-core `http://localhost:8787`
- Browser: Chromium (Playwright MCP) — **confirmed through the real UI 2026-09-11**, not just the raw API (see Evidence)
- User role: N/A (API-level; UI action is Administrator-only per `init.rb`)
- Date: 2026-09-11

## Steps to reproduce

1. Have an LLM provider configured with `kind: openai-compatible` and a `base_url` whose `/models` endpoint allows anonymous/unauthenticated access (confirmed true for OpenRouter's `https://openrouter.ai/api/v1/models` — returns HTTP 200 with no `Authorization` header at all).
2. Call `POST /api/provider/test` with that provider's id (or click "Test" on the Administration → Crux — providers & keys page for that provider).
3. Separately, confirm the actual stored key for that provider is broken/unusable for a real request — e.g. by making a real `POST /api/chat` call and observing it fail.

## Expected result

- The "Test Connection" action should genuinely exercise the provider's stored, decrypted API key — a failing/invalid/undecryptable key should report failure, not success.

## Actual result

- `POST /api/provider/test` reports `{"ok": true, "latency_ms": 446.2, "detail": "models list OK (439 models)"}` for the "openrouter" provider, **even while the provider's real chat requests were failing with a genuine 401 Unauthorized** (root cause: the stored key was obfuscated under a `CRUX_SECRET` value that no longer matched the running container's `CRUX_SECRET`, producing garbage on decryption — see `docs/CRUX_HANDOFF.md` 2026-09-11 entry for the full chain).
- Root cause confirmed directly: OpenRouter's `/models` endpoint returns HTTP 200 with **no** `Authorization` header, and also with a **deliberately invalid** key (`Bearer sk-or-v1-totally-invalid-fake-key-000000`) — both tested directly via curl, both returned 200. This strongly suggests `/api/provider/test`'s implementation calls `/models` and treats any 200 as "the key works," without the request ever actually carrying the provider's real, stored, decrypted key — or without the target endpoint requiring auth at all, either way the test provides no real signal about key validity.
- Practical impact: an admin (or QA) has no reliable way to confirm a provider's key actually works via the "Test" button for any `openai-compatible` provider whose `/models` endpoint doesn't require auth (OpenRouter confirmed; unconfirmed whether real OpenAI's `/models` endpoint has the same property — worth checking separately, since if it also allows anonymous listing, this bug affects the built-in "OpenAI" provider option too, not just custom ones like OpenRouter).

## Evidence

### Screenshot

N/A — no screenshot captured (per `CLAUDE.md` §6, screenshots aren't required for a passing/confirmed test action; this is confirmed via accessibility snapshot instead). **UI-level confirmation (2026-09-11):** navigated to `http://localhost:3014/crux/admin/keys` as Administrator, clicked "Test connection" on the OpenRouter provider row — button text updated to `ok · 454ms` in the real rendered page, via the same `/api/provider/test` call already proven (via direct curl testing) to return success regardless of the actual key's validity. The UI surface and the raw API are confirmed to be the same underlying bug, not a UI-only or API-only quirk.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-001/retest-yyyy-mm-dd-pass.png)

### Console / log

```
# Test reports success on a provider whose real stored key is currently broken:
$ curl -s -X POST http://localhost:8787/api/provider/test -d '{"id":"openrouter"}'
{"ok": true, "latency_ms": 446.2, "detail": "models list OK (439 models)"}

# But a real chat call with the same (at-the-time broken) key fails:
$ curl -s -X POST http://localhost:8787/api/chat -d '{"message":"...","user":"qa-test"}'
{"ok": false, "error": "provider error: HTTP Error 401: Unauthorized"}

# Root cause proof — OpenRouter's /models endpoint requires no auth at all:
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" https://openrouter.ai/api/v1/models
HTTP 200
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" https://openrouter.ai/api/v1/models \
    -H "Authorization: Bearer sk-or-v1-totally-invalid-fake-key-000000"
HTTP 200
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- This bug was found while diagnosing an unrelated environment issue (a lost `CRUX_SECRET` after a folder refresh broke the stored OpenRouter key's decryption — see `docs/CRUX_HANDOFF.md` 2026-09-11 for the full root-cause chain). The `CRUX_SECRET` issue itself was a local environment/config problem, not a product bug, and has since been fixed locally. **This bug is the separate, genuine product-level finding that surfaced along the way**: the Test Connection feature's validation logic doesn't prove what it claims to prove.
- Reported to production 2026-09-11 as issue **#120514** in `ztflux`, via `redmineflux_testcases_management_report_defect` (user approval obtained). Linked to testcase #120489, Run #569 "Crux QA Run 1", Environment "Window 11 + Chrome". Testcase #120489 marked Failed in the run.
