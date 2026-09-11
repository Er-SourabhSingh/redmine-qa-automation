# Test Cases — Redmineflux Crux — Per-User Redmine Key Enforcement (CRX-12)

> Source: `docs/CRUX_REQUIREMENTS.md` Key Features #4, Business Workflows "Per-user key enforcement"; #116773 CRX-12 section.
>
> **Execution readiness: BLOCKED.** Requires (1) `CRUX_REQUIRE_USER_KEY=1` set in `.env` and the stack restarted (currently `0`), and (2) a second, restricted-privilege Redmine test user with their own API key (only the admin/shared key currently exists). Write steps now; execute once both are in place — see `docs/CRUX_HANDOFF.md`.

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

---

### TC-CRX-039: Admin key still works normally under `CRUX_REQUIRE_USER_KEY=1`

**User Role:** Administrator.
**Precondition:** `CRUX_REQUIRE_USER_KEY=1`.

**Steps:**
1. As Administrator, use Ask Crux normally (read + a write + confirm).

**Expected Result:**
- Works exactly as before — the admin's own key satisfies the per-user requirement; no regression for the admin path.

---

### TC-CRX-040: `CRUX_REQUIRE_USER_KEY=0` (default) — shared key still used, no per-user enforcement

**User Role:** Any logged-in user.
**Precondition:** Default `.env` value (`0`) — this is the current default state of the local stack, executable now without changes.

**Steps:**
1. As a non-admin user, use Ask Crux for a read and a write+confirm, without any special per-user key configured.

**Expected Result:**
- Requests succeed under the shared service key — no 401, since per-user enforcement is off by default. This TC IS executable now (unlike the rest of this suite) since it's the current default state.

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

---

## Evidence Map

- Case IDs: TC-CRX-037 through TC-CRX-042
- Screenshots: bugs only.
- Log: —
- Bug reference: —
