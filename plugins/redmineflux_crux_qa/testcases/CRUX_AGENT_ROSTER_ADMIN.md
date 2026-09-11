# Test Cases — Redmineflux Crux — Agent Roster, Provider/Key Admin, Logs, Settings

> Source: `docs/CRUX_FEATURES_LIST.md` #14, #15, #16, #17, #18; `redmineflux-crux-core/docs/API.md` `GET/POST /api/agents`, `/api/agent/pause`, `/api/agent/provision_identity` (CRX-48), `GET/POST /api/providers`, `GET/POST /api/llm_keys`, `GET /api/logs`; `redmineflux_crux/init.rb` admin menu entries.
>
> **Execution readiness: Executable now** — these are plugin-native admin pages and direct agent-registry operations, not chat-mediated, so the missing LLM key does not block this suite (though adding a real provider key IS literally part of TC-CRX-074's own subject matter).

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases — Agent Roster

---

### TC-CRX-074: Agent roster lists bundled + customer agents

**User Role:** Logged-in user (roster viewing needs only login per `init.rb` comment: "viewing needs only login").
**Precondition:** `nav_top_agents` enabled (see TC-CRX-003) or direct navigation to the roster.

**Steps:**
1. Open the agent roster.
2. Confirm the 9 agents named in #117162 appear (Sales, Capacity, DevOps, Budget, Scrum, QA, Time, Invoicing, KB Agent), plus the broader roster.

**Expected Result:**
- All expected bundled agents are listed with their real capability tags — matches `db.seed.production.json`'s roster, not the internal dogfood seed (`db.seed.json`).

---

### TC-CRX-075: Pause and resume an agent

**User Role:** Logged-in user with `manage_crux_agents` (global permission).
**Precondition:** None.

**Steps:**
1. Pause a specific agent.
2. Attempt to address that agent via chat while paused.
3. Resume the agent.
4. Address it again.

**Expected Result:**
- While paused, the agent does not respond (or responds with an explicit "paused" state) — a real pause, not cosmetic.
- After resume, normal behavior returns.

---

### TC-CRX-076: A user without `manage_crux_agents` cannot pause/create/retire/upload an agent (viewing needs only login, not any Crux permission)

**User Role:** Logged-in user with zero Crux permissions (not even `view_crux`).
**CORRECTED 2026-09-11 (source review):** viewing succeeding isn't due to any declared "read" permission — `CruxAgentsController` only requires `before_action :require_login` for `index`/`list`, confirmed by its own comment: "Visibility mirrors the global dashboard: any logged-in user can look." `manage_crux_agents` is checked via a custom `require_manage_agents` method applied to `create`, `pause`, `provision`, **`retire`**, and **`upload`** — the latter two aren't listed in `init.rb`'s visible permission-action mapping at all, but are enforced identically in code (see TC-CRX-145/146).
**Precondition:** None.

**Steps:**
1. View the roster as this user (should still work — zero permissions, still succeeds).
2. Attempt to pause, create, retire, or upload-a-definition for an agent.

**Expected Result:**
- View succeeds even with zero Crux permissions.
- All four write actions refused with `{"ok": false, "error": "You are not allowed to manage agents."}`.

---

### TC-CRX-077: Provision a real Redmine identity for an agent (CRX-48)

**User Role:** Logged-in user with `manage_crux_agents`.
**Precondition:** An agent without a provisioned identity yet.

**Steps:**
1. Provision a real Redmine identity for the agent (confirm-gated per CRX-48).
2. Verify a real Redmine user account now exists/is linked for that agent.
3. Attempt on an agent that already has one, or with invalid target data.

**Expected Result:**
- Successful provisioning creates/links a genuine Redmine user, reported honestly.
- A partial or already-provisioned case reports honestly (per API.md: "confirm-gated, honest partial reports") rather than claiming full success incorrectly.

---

## Positive Cases — LLM Provider/Key Admin

---

### TC-CRX-078: Add an LLM provider key and verify it with the live credential test

**User Role:** Administrator (Administration → Crux — providers & keys is `require_admin`).
**Precondition:** A real (or intentionally invalid, for the negative case) provider API key.

**Steps:**
1. Add a new provider/key.
2. Use the live credential test action.
3. Set it as the default for its provider.

**Expected Result:**
- The test action genuinely calls the provider and reports real success/failure — not a client-side format check only.
- Only one default exists per provider at a time; setting a new default un-defaults the previous one.
- **This TC is also the actual fix for the "no LLM key configured" environment gap** — once a valid key passes its live test here, re-run every chat-dependent suite (Ask Crux Core, Write Confirm Gate, Project Creation/Improve, Chat Capabilities, all 9 per-agent CRUD suites) that was previously blocked.

- **CONFIRMED LIVE 2026-09-11** (Local, `crux-redmine` localhost:3014, admin): **PASS on adding/verifying a key, but the "Test connection" step itself is FAIL — filed as BUG-CRX-001 (High).** Navigated Crux → Providers & keys. An "OpenRouter" custom provider + key already existed (added by "admin" 2026-08-19) but was non-functional — root-caused to a lost `CRUX_SECRET` after an environment refresh (full chain in `docs/CRUX_HANDOFF.md`). Fixed by setting a real `CRUX_SECRET` and re-adding the key via `POST /api/llm_key` (API-level; UI "+ Add Key" form not separately exercised since the record already existed post-fix). Clicked "Test connection" on the OpenRouter row — showed `ok · 454ms`. **This is a false positive**: proved independently that OpenRouter's `/models` endpoint (what the test call hits) returns HTTP 200 with no `Authorization` header at all, and even with a deliberately invalid key — the test provides no real signal about key validity. A genuine chat call (see TC-CRX-001 in `CRUX_NAVIGATION_AND_PERMISSIONS.md`) is what actually proved the key works, not this button.

---

### TC-CRX-079: Keys are always masked in the UI/API

**User Role:** Administrator.
**Precondition:** At least one key configured.

**Steps:**
1. View the providers & keys page.
2. Inspect the underlying API response (`GET /api/llm_keys`) directly if possible.

**Expected Result:**
- The key value is masked everywhere (UI and raw API response) — never returned in plain text after initial entry.

---

### TC-CRX-080: Delete a provider key

**User Role:** Administrator.
**Precondition:** A non-default provider key exists.

**Steps:**
1. Delete it.
2. Confirm chat behavior for that provider falls back appropriately (echo, or another configured provider) rather than erroring.

**Expected Result:**
- Deletion succeeds; no crash/500 on subsequent chat turns that would have used that provider.

---

## Positive Cases — Logs

---

### TC-CRX-081: Structured log viewer filters correctly

**User Role:** Administrator (Administration → Crux — logs is `require_admin`).
**Precondition:** Recent activity exists (chat turns, writes, etc.) to generate log entries.

**Steps:**
1. Open the log viewer.
2. Filter by `level=`, `component=`, `act=`, and `q=` (per `GET /api/logs` params).

**Expected Result:**
- Each filter narrows results correctly and matches real recent activity — not stale/cached data.

---

## Positive Cases — Crux Settings Page

---

### TC-CRX-082: Set the core service URL from the Crux nav rail

**User Role:** Whichever role the settings page actually requires (confirm live — the plugin README says "no admin section needed" for this specific page, CRX-50).
**Precondition:** None.

**Steps:**
1. Reach the Crux settings page via the in-app nav rail (not Administration → Plugins).
2. Change the core URL setting to a deliberately wrong value, save, then verify chat breaks accordingly (proving the setting is live/functional, not just stored).
3. Restore the correct value.

**Expected Result:**
- The page is reachable without going through the standard Administration → Plugins path.
- The setting genuinely controls where the plugin proxies to — verified by the deliberate-break/restore round-trip.
- Saving merges into existing settings rather than replacing them wholesale (test by changing only one field and confirming other previously-set fields survive).

- **CONFIRMED LIVE 2026-09-11** (Local, `crux-redmine` localhost:3014, admin): **PASS — and this TC caught a real, significant misconfiguration already present on the stack, not something I introduced.** Reached the Settings page via the Crux nav rail (not Administration → Plugins). Found "Crux core service URL" already set to the wrong value for this Docker setup (`http://localhost:8787`), causing the dashboard to show "⚠ crux-core unreachable at http://localhost:8787: Errno::ECONNREFUSED" and every widget stuck on "Loading...". Changed it to `http://crux-core:8787` (correct Docker service hostname) and saved — "Successful update." confirmed. Verified the fix took effect live: the "Chat agents" picker, which showed "No agents found" before the fix, populated with the full 26-agent roster immediately after, with no restart needed. Not filing this specific misconfiguration as a product bug — the plugin README already documents both values correctly as an expected per-deployment step; it just hadn't been completed on this QA stack. Full detail in `docs/CRUX_HANDOFF.md`.
- **Bonus finding while on this page (filed as BUG-CRX-002, Medium):** the "Chat agents" picker's persona descriptions for 6 of the 9 agents in #117162's scope (DevOps, Budget, Scrum, Time, Invoicing, Capacity) explicitly claim read-only/never-writes behavior, directly contradicting their actual `allowed_tools` CRUD capability confirmed earlier this session. See `bugs/open/BUG-CRX-002.md`.

---

## Negative Cases

---

### TC-CRX-083: Non-admin cannot reach providers & keys, logs, or settings pages meant for admins

**User Role:** Non-admin user with all five Crux role permissions (cross-ref TC-CRX-008).
**Precondition:** None.

**Steps:**
1. Attempt direct navigation to each admin-only page.

**Expected Result:**
- All refused — duplicate of TC-CRX-008's coverage from this suite's own angle; confirm consistent results between both TCs.

---

### TC-CRX-084: Invalid/expired provider key fails its live test honestly

**User Role:** Administrator.
**Precondition:** A deliberately invalid API key string.

**Steps:**
1. Add the invalid key.
2. Run the live credential test.

**Expected Result:**
- The test reports a genuine failure with a real reason (e.g. 401 from the provider) — not a false "success," and not a generic unhelpful error.

---

## Additional Cases (added 2026-09-11 after full controller/route source review)

> `retire` and `upload` had zero test coverage — both are real write actions gated by `manage_crux_agents` exactly like `create`/`pause`/`provision`, but neither appears in `init.rb`'s visible permission-action array (only enforced via the controller's own `require_manage_agents` method). Worth testing independently rather than assuming they're covered by TC-CRX-075/077's coverage of the other three actions.

---

### TC-CRX-145: Retire an agent — one-way, permanent, locks the paired Redmine user (CRX-48 rule 3)

**User Role:** Logged-in user with `manage_crux_agents`.
**Precondition:** An agent with a provisioned Redmine identity (from TC-CRX-077).

**Steps:**
1. Retire the agent, with the explicit confirm checkbox checked (`confirm=true` — the controller never forces this itself; an unconfirmed call must be honestly refused by core).
2. Verify the agent's paired Redmine user account is now locked.
3. Attempt to retire the same agent again, or un-retire it.

**Expected Result:**
- Retiring with `confirm=true` succeeds and genuinely locks the paired Redmine user (verify via Administration → Users, not just trusting the chat/UI response).
- This is explicitly one-way per its own spec comment ("one-way, permanent") — confirm there is no un-retire path; attempting to retire an already-retired agent reports honestly (not a fabricated second success).
- Retiring WITHOUT `confirm=true` is refused by core, not silently treated as confirmed.

---

### TC-CRX-146: Upload a customer-authored agent definition (CRX-23)

**User Role:** Logged-in user with `manage_crux_agents`.
**Precondition:** A valid agent-definition text file matching the `AGENT-TEMPLATE.md` shape; separately, a deliberately malformed one for the negative case.

**Steps:**
1. Upload the valid definition (`raw_text` — the client reads the file as text and sends it verbatim; the controller is a pure pass-through, core does all parsing/validation/upserting).
2. Verify the new customer agent appears correctly in the roster.
3. Upload the malformed definition.

**Expected Result:**
- Valid upload succeeds, and the created/updated agent record matches the uploaded definition exactly — the controller does zero transformation, so any discrepancy points to a core-side bug, not a proxy bug.
- Malformed upload fails with the real, specific list of validation errors from core (per the route's own comment: "the response ... passes through unchanged so the form can render exactly what core said, never a re-interpreted summary") — not a generic failure message.
- A user without `manage_crux_agents` cannot upload at all (403, same as create/pause/provision/retire).

---

## Evidence Map

- Case IDs: TC-CRX-074 through TC-CRX-084, TC-CRX-145 through TC-CRX-146
- Screenshots: bugs only.
- Log: —
- Bug reference: —
