# Bug Report Template

- Bug ID: BUG-CRX-009
- Production Redmine Issue ID: #120616
- Title: Improve/Apply confirm endpoint reports `"ok":true` when the underlying write was silently refused by a real Redmine permission check — no error surfaced to the user anywhere
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP), plus a direct `fetch()` replay from the browser console to inspect the raw response body
- User role: `luna.blossom` (Manager) with "Edit issues"/"Edit own issues" temporarily unchecked on the Manager role (found while executing TC-CRX-050, `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md`)
- Date: 2026-09-15

## Steps to reproduce

1. As admin, temporarily uncheck "Edit issues" and "Edit own issues" on the Manager role (Administration → Roles → Manager → Permissions → Issue tracking), which `luna.blossom` holds on the Crux QA project. (No UI path exists to induce a transient/permission failure any other way on this path.)
2. As `luna.blossom`, open an issue she no longer has edit permission on (e.g. issue #6), click "Improve with Crux" → "Improve the description →". The suggest/preview step renders fine (read-only, not gated).
3. Click Apply.
4. Observe the UI response, and independently verify via a fresh reload of the issue whether the description actually changed.
5. Inspect the raw response body of the `POST /crux/improve/confirm` call (the browser MCP's own network-body inspector returned empty for this call; replay it manually via `fetch()` in the page context using the same CSRF token and `proposal_id`/`decision` payload captured from the real request).

## Expected result

- Per TC-CRX-050 (`CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md`) and #116773's own note that this "known-fixed bug class" (recording success with no parseable id / no honest failure) was previously fixed on two paths, a write that is refused by a real permission check must be reported as an honest failure with the real reason — never as success.

## Actual result

- The UI gives **no error at all** on Apply — the Improve panel just silently closes, exactly as it does on a genuine success. There is no toast, no inline error, nothing in the visible page state to tell the user the write did not happen.
- A fresh reload of the issue confirms the description was **not** changed — the write was correctly refused server-side.
- The raw response body of `POST /crux/improve/confirm`, captured via a manual `fetch()` replay (same CSRF token, same `{"proposal_id":"prop-126","decision":"confirm"}` payload, same 200 status/content-length as the original UI-triggered call): `{"ok":true,"result":{"issue_id":6,"updated":false},"run_id":null}`.
- This is a dishonest-success response: the top-level `"ok"` field is `true` on a call that did **not** perform the write (`"updated":false`), and no `error`/reason field is present anywhere in the payload for the frontend to surface. The frontend takes `ok:true` at face value and silently closes the panel as if nothing went wrong.
- This is distinct from BUG-CRX-006 (shared proxy discards core's real HTTP status, but the JSON body still correctly carries `ok:false` on failure) — here the JSON body's own `ok` field is itself wrong, which BUG-CRX-006's proxy-layer fix would not correct. The bug is upstream of the proxy, in how `crux_improve_controller`'s confirm action (or crux-core's `/api/improve/confirm`) decides what `ok` means when the underlying `update_issue` write is refused by Redmine's permission layer.
- Confirmed the same underlying refusal (no write occurs) is correctly enforced from a pure permission-boundary standpoint — see TC-CRX-052, which passed on that narrower question. This bug is specifically about the dishonest **reporting** of that refusal, not about the refusal itself failing to happen.

## Evidence

### Screenshot

Not captured — behavioral/API-response finding, not a rendering defect; verified via the real Redmine issue journal (no new entry), the captured response body, and a clean reload showing the unchanged description.

### Console / log

- `POST /crux/improve/confirm` (real UI-triggered call, via `luna.blossom` with Edit issues/Edit own issues removed from her Manager role): HTTP `200`, `content-length: 69`.
- Manual `fetch()` replay of the same call, from the page's own JS context: `{"status":200,"body":"{\"ok\":true,\"result\":{\"issue_id\":6,\"updated\":false},\"run_id\":null}"}`.
- Fresh reload of `/issues/6`: description unchanged, no new journal/history entry — confirms the write genuinely did not happen despite `ok:true`.
- After restoring "Edit issues"/"Edit own issues" on the Manager role and retrying the identical Apply flow (TC-CRX-048), the write succeeded cleanly with exactly one journal entry ("Description updated") — confirming the earlier attempt was a real, cleanly-recoverable refusal, not a partial/corrupted write.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (see "Actual result" for why this is distinct from BUG-CRX-006)

## 2026-09-16 retest — FIXED at code level; live confirmation blocked by an unrelated missing provider key

Dev's `CHANGES.md` handoff updated `improve.py`'s `_confirm_description()` exactly per the "never faked, verify the real object" pattern: after the `update_issue` call raises no exception, it now does a verification read (`GET_ISSUE_TOOL`) and compares `actual_description` against `new_description`. On a mismatch (the silent-permission-refusal case this bug describes), it now returns `{"ok": False, "error": "the write did not take effect — you may not have permission to edit this issue's description"}` instead of the old unconditional `{"ok": True, "result": {..., "updated": True}}`. Code comment explicitly cites BUG-CRX-008... (typo in comment, actually BUG-CRX-009) and describes the exact scenario from this bug's own reproduction.

**Retest attempt:** Reproduced the exact original setup — unchecked "Edit issues"/"Edit own issues" on the Manager role (`luna.blossom`'s role on `crux-qa`), logged in as `luna.blossom`, opened issue #6, clicked "Improve with Crux" → "Improve the description →". **Blocked**: the Improve feature specifically requires the "Anthropic" provider (hardcoded), which has no key configured in this environment (only OpenRouter was added this session) — `"couldn't propose a description: provider 'anthropic' has no key configured"`. This is an unrelated environment/configuration gap, not a regression of this bug, but it prevented reaching the actual Apply step live.

**Verdict: FIXED at the code level** (high confidence — the fix directly implements the exact verify-then-report pattern this bug asked for, at the exact call site identified in the root cause). **Not independently confirmed live** this session due to the missing Anthropic key. Restored "Edit issues"/"Edit own issues" on the Manager role afterward to avoid leaving other tests affected. Recommend a follow-up live confirmation once an Anthropic (or equivalent) provider key is available.

## Production report

Reported to production as issue **#120616** (`ztflux`, Tracker Bug, Priority **High**, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120486** (`CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md`, where it was found via TC-CRX-050), Environment "Window 11 + Chrome" — testcase marked **Failed**. Attachments: `BUG-CRX-009.pdf` (5.7 KB) and this MD file (5.1 KB), both confirmed size-exact against production.
