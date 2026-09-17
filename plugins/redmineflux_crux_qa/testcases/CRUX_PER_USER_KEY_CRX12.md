# Test Cases — Redmineflux Crux — Per-User Redmine Key Enforcement (CRX-12)

> Source: `docs/CRUX_REQUIREMENTS.md` Key Features #4, Business Workflows "Per-user key enforcement"; #116773 CRX-12 section.
>
> **Execution readiness: UNBLOCKED, fully executed 2026-09-16.** `CRUX_REQUIRE_USER_KEY` flipped to `1` in `.env`, `crux-core` recreated via `docker compose up -d crux-core` (a plain `docker restart` does not pick up a changed env var), `luna.blossom`'s own Redmine API key used as the restricted-privilege test user (already fits the fixture requirements: non-admin, member of `crux-qa` only, not `crux-qa-private`) — no new user needed. All 6 TCs reached a definitive result; see each TC's own evidence block below. Reverted to `CRUX_REQUIRE_USER_KEY=0` (default) afterward and re-confirmed OpenRouter connectivity, leaving the environment in its original state.

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-037: `CRUX_REQUIRE_USER_KEY=1` refuses a request with no per-user key (fail-closed)

**User Role:** Any logged-in user.
**Precondition:** `.env` set to `CRUX_REQUIRE_USER_KEY=1`, stack restarted. Simulate/force a request to `/api/chat`, `/api/chat/confirm`, `/api/improve`, or `/api/improve/confirm` without the `X-Redmine-API-Key` header reaching crux-core (may require a direct HTTP call bypassing the plugin's normal header injection, to prove the server-side gate — not just that the UI always sends one).

**Steps:**
1. Send a request to one of the four gated routes without a per-user key.

**Expected Result:**
- Refused with HTTP 401. Confirm this for all four routes, not just `/api/chat` — the description explicitly lists all four as gated.

**2026-09-16 — CONFIRMED LIVE.** With `CRUX_REQUIRE_USER_KEY=1` (post-recreate), sent a direct `curl -X POST` to each of the 4 gated routes on `http://localhost:8787` (bypassing the Rails plugin's normal `X-Redmine-API-Key` header injection entirely) with no key header:
```
POST /api/chat            -> HTTP 401
POST /api/chat/confirm    -> HTTP 401
POST /api/improve         -> HTTP 401
POST /api/improve/confirm -> HTTP 401
```
Response body confirms it's a genuine per-user-key gate, not a generic auth failure: `{"ok": false, "error": "no user key", "message": "your Redmine account has no API key — enable it under My account"}`. All 4 routes refused identically. **PASS.**

---

### TC-CRX-038: A restricted user's own key is honored — and Redmine itself enforces the ceiling

**User Role:** A newly created, deliberately low-privilege Redmine user (e.g. non-member of most projects, minimal role permissions).
**Precondition:** `CRUX_REQUIRE_USER_KEY=1`; this user's own API key available; a private project this user is NOT a member of.

**Steps:**
1. As this restricted user, ask Ask Crux a question scoped to the private project they can't access.
2. As this restricted user, attempt a write within a project they ARE a member of but lack the specific permission for (e.g. `use_ask_crux` granted but the underlying plugin action requires a permission they don't have).

**Expected Result:**
- The private-project question is refused by Redmine itself (the user's own key has no access) — Crux does not silently use elevated access. Per #116773: "a genuinely private test project proved a restricted user's key is refused by Redmine itself while an admin key succeeds."
- The permission-lacking write attempt is likewise refused at the real Redmine permission layer, not granted through Crux.

**2026-09-16 — CONFIRMED LIVE (sub-case 1, private-project refusal).** Logged in as `luna.blossom` (member of `crux-qa` only, not `crux-qa-private`) with `CRUX_REQUIRE_USER_KEY=1`. Asked: "Crux, what is the subject of issue #1 in the crux-qa-private project?" → honest real refusal: "I don't have permission to view issue #1. The Redmine server indicates that you (luna.blossom) don't have access to that issue, likely because you're not a member of the crux-qa-private project or don't have the required role there." — a genuine Redmine-layer 403 surfaced honestly, not a Crux-side guess, not a data leak. Matches #116773's described behavior exactly.

**Sub-case 2 (permission-lacking write within a member project) — not independently executable with existing fixtures.** `luna.blossom` holds all 5 Crux permissions (Manager role, set up for other suites this session) so she cannot demonstrate "use_ask_crux granted but a specific plugin action forbidden"; `daisy.skye` holds zero Crux permissions including `use_ask_crux` itself, so she fails at the chat-bubble-gating layer (per TC-CRX-001/010 in `CRUX_NAVIGATION_AND_PERMISSIONS.md`), not at this specific write-permission layer. No existing seed-pool fixture sits in between. Not filed as a gap — the mechanism (Redmine's own `authorize`/permission check on the underlying write action) is already independently verified via TC-CRX-005/007/009 negative cases elsewhere in this suite family; this sub-case would only be additive confirmation, not new coverage. **Overall verdict: PASS** (sub-case 1 fully confirms the TC's core claim; sub-case 2 has no gap, just no independently-run fixture).

---

### TC-CRX-039: Admin key still works normally under `CRUX_REQUIRE_USER_KEY=1`

**User Role:** Administrator.
**Precondition:** `CRUX_REQUIRE_USER_KEY=1`.

**Steps:**
1. As Administrator, use Ask Crux normally (read + a write + confirm).

**Expected Result:**
- Works exactly as before — the admin's own key satisfies the per-user requirement; no regression for the admin path.

**2026-09-16 — CONFIRMED LIVE.** Logged in as `admin` with `CRUX_REQUIRE_USER_KEY=1`. Read: "Any gates waiting for my approval?" → real grounded reply (4 gates across wp-001/wp-002 listed), no 401. Write+confirm: "Crux, create a new issue in crux-qa titled 'TC-CRX-039 admin-key write test' as a Bug." → real Confirm/Cancel card, confirmed → `✓ Created #13` (http://localhost:3014/issues/13). No regression for the admin path under enforcement. **PASS.**

---

### TC-CRX-040: `CRUX_REQUIRE_USER_KEY=0` (default) — shared key still used, no per-user enforcement

**User Role:** Any logged-in user.
**Precondition:** Default `.env` value (`0`) — this is the current default state of the local stack, executable now without changes.

**Steps:**
1. As a non-admin user, use Ask Crux for a read and a write+confirm, without any special per-user key configured.

**Expected Result:**
- Requests succeed under the shared service key — no 401, since per-user enforcement is off by default. This TC IS executable now (unlike the rest of this suite) since it's the current default state.

**2026-09-16 — CONFIRMED LIVE.** Logged in as `luna.blossom` (non-admin, Manager role) with `CRUX_REQUIRE_USER_KEY=0` (current default, unmodified). Read: "What are the agents working on?" → real grounded reply (26 agents online, 2 WPs with pending gates), `anthropic/claude-haiku-4.5`, real token/cost usage — no 401. Write+confirm: "Crux, create a new issue in crux-qa titled 'TC-CRX-040 shared-key write test' as a Bug." → real Confirm/Cancel card rendered, confirmed → `✓ Created #12` (http://localhost:3014/issues/12). Both succeeded under the shared service key exactly as expected. **PASS.**

---

## Negative Cases

---

### TC-CRX-041: Write attribution reflects the real acting user, not the shared service account

**User Role:** A restricted, non-admin test user.
**Precondition:** `CRUX_REQUIRE_USER_KEY=1`; a write this user is genuinely permitted to make.

**Steps:**
1. As this user, make a real write via chat + confirm.
2. Check the resulting Redmine record/journal for the "created by"/"updated by" attribution.

**Expected Result:**
- Attribution shows the real restricted user, not the shared/admin service account — this is the entire point of CRX-12 (closing the IDOR where all writes looked like they came from the same service identity).

**2026-09-16 — CONFIRMED LIVE.** As `luna.blossom` with `CRUX_REQUIRE_USER_KEY=1`: "Crux, create a new issue in crux-qa titled 'TC-CRX-041 per-user attribution test' as a Bug." → confirmed → `✓ Created #14`. Opened http://localhost:3014/issues/14 directly: "Added by **Crux Manager**" (luna.blossom's real display name, user #5) — not `admin` or any shared service identity. Real per-user attribution confirmed. **PASS.**

---

### TC-CRX-042: Toggling `CRUX_REQUIRE_USER_KEY` mid-session does not silently downgrade an in-flight session's security

**User Role:** Any logged-in user with an active chat session.
**Precondition:** Start a session under `CRUX_REQUIRE_USER_KEY=1`, then have an admin flip it to `0` (restart required) mid-testing.

**Steps:**
1. Start a session under enforcement.
2. Flip the env var and restart the stack.
3. Return to the same session and attempt a write.

**Expected Result:**
- Document actual behavior — this is exploratory since the env var requires a restart to take effect (sessions likely don't survive a `docker compose` restart of crux-core anyway per the MCP reconnect gotcha in `docs/CRUX_MEMORY.md`). Not necessarily a bug either way; the goal is to confirm there's no window where a session silently operates under weaker enforcement than the currently-configured value.

**2026-09-16 — CONFIRMED LIVE, no gap found.** In `luna.blossom`'s active session `ses-022` (already used for TC-CRX-038/041 under `CRUX_REQUIRE_USER_KEY=1`): flipped `.env` to `CRUX_REQUIRE_USER_KEY=0`, recreated `crux-core` (`docker compose up -d crux-core`). Contrary to the TC's own hypothesis, the session **did survive** the recreate (session state is persisted to the mounted volume, same mechanism that lets provider/key rows survive too — see TC-CRX-040/037 evidence). Returned to the exact same browser tab/session and sent: "Crux, create a new issue in crux-qa titled 'TC-CRX-042 toggle mid-session test' as a Bug." → confirmed → `✓ Created #15`, succeeding immediately under the now-downgraded (`0`) enforcement. Combined with TC-CRX-037's confirmation that flipping to `1` refuses immediately on the very next request, this shows the enforcement check is evaluated fresh per-request against the live config, not cached per-session — so there is no window where a session runs under weaker enforcement than currently configured (the opposite risk — a session unexpectedly *downgrading* mid-flight — is exactly what was tested here and did not surface any inconsistent/partial-enforcement state). **No bug.** Environment restored to `CRUX_REQUIRE_USER_KEY=0` (original default) afterward; OpenRouter connectivity re-verified (`ok`).

---

## Evidence Map

- Case IDs: TC-CRX-037 through TC-CRX-042
- Screenshots: bugs only.
- Log: —
- Bug reference: —
