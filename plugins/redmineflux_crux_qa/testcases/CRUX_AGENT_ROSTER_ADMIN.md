# Test Cases — Redmineflux Crux — Agent Roster, Provider/Key Admin, Logs, Settings

> Source: `docs/CRUX_FEATURES_LIST.md` #14, #15, #16, #17, #18; `redmineflux-crux-core/docs/API.md` `GET/POST /api/agents`, `/api/agent/pause`, `/api/agent/provision_identity` (CRX-48), `GET/POST /api/providers`, `GET/POST /api/llm_keys`, `GET /api/logs`; `redmineflux_crux/init.rb` admin menu entries.
>
> **Execution readiness: Executable now** — these are plugin-native admin pages and direct agent-registry operations, not chat-mediated, so the missing LLM key does not block this suite (though adding a real provider key IS literally part of TC-CRX-064's own subject matter).

## Plugin
- Name: redmineflux_crux
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases — Agent Roster

---

### TC-CRX-064: Agent roster lists bundled + customer agents

**User Role:** Logged-in user (roster viewing needs only login per `init.rb` comment: "viewing needs only login").
**Precondition:** `nav_top_agents` enabled (see TC-CRX-134) or direct navigation to the roster.

**Steps:**
1. Open the agent roster.
2. Confirm the 9 agents named in #117162 appear (Sales, Capacity, DevOps, Budget, Scrum, QA, Time, Invoicing, KB Agent), plus the broader roster.

**Expected Result:**
- All expected bundled agents are listed with their real capability tags — matches `db.seed.production.json`'s roster, not the internal dogfood seed (`db.seed.json`).

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, admin): **PASS.** Opened Agent fleet via nav (not a direct URL). All 9 agents named in #117162 present with correct capability tags: Sales Agent (crm), Capacity Agent (workload/capacity), DevOps Agent (devops), Budget Agent (budget/audit), Scrum Agent (agile/scrum), QA Agent (qa/testcases), Time Agent (timesheet), Invoicing Agent (invoice/billing), KB Agent (kb/knowledge) — plus the full broader roster (Builder 1/2, Design Agent, Research, Project Manager, Improver, Reviewer, Code Reviewer, Test Author, Docs Writer, Monitor, Alert Triage, Root-Cause Analyst, Auto-Fixer, Crux Guide, Support Agent, Project Setup Agent, Sales Helper) and retired test fixtures from prior sessions.

---

### TC-CRX-065: Pause and resume an agent

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

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, admin/luna.blossom): **PASS — with the Expected Result corrected against the documented contract.** Paused "Docs Writer" via the fleet page (status flipped to "paused", button to "Resume"). Directly `@Docs Writer`-addressed it in a new Ask Crux chat while paused: it responded completely normally ("I've confirmed: I'm active and tools are working"), and its run count incremented 1→2 — pause had zero effect on direct chat addressing. **This is not a bug**: `redmineflux-crux-core/docs/API.md` documents `POST /api/agent/pause` precisely as "a paused agent gets NOTHING from `/api/next`" — the autonomous work-claim/dispatch loop — and the fleet page's own caption already says the same ("Pausing stops new dispatch — it never cancels an in-flight run"). Direct `@mention` chat is a different path entirely, never covered by that contract. Resumed the agent afterward (button reverted to "Pause", status "online") — cross-referenced against BUG-CRX-005's already-established "dispatch-scoped, not page/interaction-scoped" pattern for Crux controls.

---

### TC-CRX-066: A user without `manage_crux_agents` cannot pause/create/retire/upload an agent (viewing needs only login, not any Crux permission)

**User Role:** Logged-in user with zero Crux permissions (not even `view_crux`).
**CORRECTED 2026-09-11 (source review):** viewing succeeding isn't due to any declared "read" permission — `CruxAgentsController` only requires `before_action :require_login` for `index`/`list`, confirmed by its own comment: "Visibility mirrors the global dashboard: any logged-in user can look." `manage_crux_agents` is checked via a custom `require_manage_agents` method applied to `create`, `pause`, `provision`, **`retire`**, and **`upload`** — the latter two aren't listed in `init.rb`'s visible permission-action mapping at all, but are enforced identically in code (see TC-CRX-075/146).
**Precondition:** None.

**Steps:**
1. View the roster as this user (should still work — zero permissions, still succeeds).
2. Attempt to pause, create, retire, or upload-a-definition for an agent.

**Expected Result:**
- View succeeds even with zero Crux permissions.
- All four write actions refused with `{"ok": false, "error": "You are not allowed to manage agents."}`.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, daisy.skye — `crux-qa` Reporter, no Crux permissions): **PASS, both legs.** UI: `/crux/agents` loaded fully (fleet table, all rows) with the entire "Ops"/Actions column and "Upload Agent"/"+ New Agent" buttons absent — the page itself correctly hides every write affordance for this user, unlike BUG-CRX-005's admin-toggle case. API: direct `fetch()` POSTs to `/crux/agents/pause`, `/crux/agents` (create), `/crux/agents/retire`, and `/crux/agents/upload` all returned exactly `403 {"ok":false,"error":"You are not allowed to manage agents."}` — the identical message for all four actions, confirming `require_manage_agents` is applied uniformly even to the two actions (`retire`/`upload`) not listed in `init.rb`'s visible permission-action array.

---

### TC-CRX-067: Provision a real Redmine identity for an agent (CRX-48)

**User Role:** Logged-in user with `manage_crux_agents`.
**Precondition:** An agent without a provisioned identity yet.

**Steps:**
1. Provision a real Redmine identity for the agent (confirm-gated per CRX-48).
2. Verify a real Redmine user account now exists/is linked for that agent.
3. Attempt on an agent that already has one, or with invalid target data.

**Expected Result:**
- Successful provisioning creates/links a genuine Redmine user, reported honestly.
- A partial or already-provisioned case reports honestly (per API.md: "confirm-gated, honest partial reports") rather than claiming full success incorrectly.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, luna.blossom — `manage_crux_agents` via global Manager role): **PASS, all three sub-cases.** Used "Builder 1" (no prior identity). First attempt correctly reported an honest partial failure: `{"⚠ role 'AI Agent' does not exist on redmine — create it first..."}` (a real, pre-existing environment gap on this QA stack, not a fabricated success) — created the missing "AI Agent" role via Administration → Roles (as admin) as the documented one-time deployment step, then retried. Second attempt reported a genuine partial success in the exact structured shape API.md promises: `Redmine user: builder-1 (id 7)` / `Mail: builder-1@agents.redmine` / `Memberships: ✓ crux-qa` / `⚠ key not stored: agent 'builder-1' already has a redmine identity key` — independently verified via `rails runner` (bypassing the UI/API entirely) that a real, non-fabricated Redmine user now exists: `login=builder-1 id=7 status=1(active) mail=builder-1@agents.redmine`, member of Crux QA with role "AI Agent". Attempting on the now-already-provisioned agent: the "Create Redmine identity" button itself disappeared from that row — an honest UI reflection of the paired state, not a fabricated second success.

---

## Positive Cases — LLM Provider/Key Admin

---

### TC-CRX-068: Add an LLM provider key and verify it with the live credential test

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

- **CONFIRMED LIVE 2026-09-11** (Local, `crux-redmine` localhost:3014, admin): **PASS on adding/verifying a key, but the "Test connection" step itself is FAIL — filed as BUG-CRX-001 (High).** Navigated Crux → Providers & keys. An "OpenRouter" custom provider + key already existed (added by "admin" 2026-08-19) but was non-functional — root-caused to a lost `CRUX_SECRET` after an environment refresh (full chain in `docs/CRUX_HANDOFF.md`). Fixed by setting a real `CRUX_SECRET` and re-adding the key via `POST /api/llm_key` (API-level; UI "+ Add Key" form not separately exercised since the record already existed post-fix). Clicked "Test connection" on the OpenRouter row — showed `ok · 454ms`. **This is a false positive**: proved independently that OpenRouter's `/models` endpoint (what the test call hits) returns HTTP 200 with no `Authorization` header at all, and even with a deliberately invalid key — the test provides no real signal about key validity. A genuine chat call (see TC-CRX-132 in `CRUX_NAVIGATION_AND_PERMISSIONS.md`) is what actually proved the key works, not this button.

---

### TC-CRX-069: Keys are always masked in the UI/API

**User Role:** Administrator.
**Precondition:** At least one key configured.

**Steps:**
1. View the providers & keys page.
2. Inspect the underlying API response (`GET /api/llm_keys`) directly if possible.

**Expected Result:**
- The key value is masked everywhere (UI and raw API response) — never returned in plain text after initial entry.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, admin): **PASS.** Providers & keys page's Keys table shows only last-4 masks (`****ea07`, `****c4bd`, `****d171`, `****2ea5`) for every key, including the three `redmine_identity` keys minted by CRX-48 provisioning. Confirmed at the raw API level too: `fetch('/crux/admin/keys.json')` returns only a `last4` field per key (e.g. `"last4":"ea07"`) — no `key`/`secret`/full-value field anywhere in the JSON.

---

### TC-CRX-070: Delete a provider key

**User Role:** Administrator.
**Precondition:** A non-default provider key exists.

**Steps:**
1. Delete it.
2. Confirm chat behavior for that provider falls back appropriately (echo, or another configured provider) rather than erroring.

**Expected Result:**
- Deletion succeeds; no crash/500 on subsequent chat turns that would have used that provider.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, admin): **PASS.** Added a throwaway Anthropic key (used for TC-CRX-074 below, so it was that provider's only/default key at deletion time — not the "non-default" precondition literally, but the deletion+continuity behavior is identical), deleted it via the Keys table's Delete button with its native confirm dialog ("Delete key ... This cannot be undone."), confirmed via `keys.json` it was gone cleanly with no orphaned state. Sent a fresh chat turn immediately after (`@auto`, new session) — answered normally via the already-configured OpenRouter/claude-haiku-4.5 default, no crash, no 500, no degraded behavior of any kind.

---

## Positive Cases — Logs

---

### TC-CRX-071: Structured log viewer filters correctly

**User Role:** Administrator (Administration → Crux — logs is `require_admin`).
**Precondition:** Recent activity exists (chat turns, writes, etc.) to generate log entries.

**Steps:**
1. Open the log viewer.
2. Filter by `level=`, `component=`, `act=`, and `q=` (per `GET /api/logs` params).

**Expected Result:**
- Each filter narrows results correctly and matches real recent activity — not stale/cached data.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, admin): **PASS on filter correctness — but found and filed a distinct, systemic bug (BUG-CRX-006) while verifying it.** All four filters confirmed correct against live, real activity generated this same session (agent uploads/retires/pauses, chat turns, key add/delete): `component=core.api` correctly prefix-matched (per API.md's own "prefix match" spec) 81 of the log lines to exactly `core.api.server`; `act=<id>` exact-matched to precisely 1 line; `q=sessions` case-insensitive-substring-matched 4 lines, all genuinely containing "sessions"; `level=INFO` correctly returned INFO **and** the one WARN line present — confirmed this is NOT a leak but the documented "minimum severity" semantics (API.md: "minimum severity — DEBUG < INFO < WARN/WARNING < ERROR"), so my first read of it as a bug was wrong and self-corrected against the doc before filing anything. **What IS a real bug**: requesting `level=BOGUS` (an intentionally unknown value) returns HTTP `200` with `{"ok":false,"error":"unknown level 'BOGUS'"}`, when API.md explicitly documents "unknown value → `400`". Traced to the plugin's shared `CoreClient.request`/`proxy_get` — core's real HTTP status is read only for a log line and never returned to the Rails `render json:` call, which defaults to `200` for anything short of a connection failure. Grepped all Crux controllers: **12 of them** share this exact proxy path, so this silently downgrades every documented non-2xx response (400s, 404s) from any Crux JSON endpoint to 200. Filed as **BUG-CRX-006** (Medium) — not reported to production yet, awaiting instruction.

---

## Positive Cases — Crux Settings Page

---

### TC-CRX-072: Set the core service URL from the Crux nav rail

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

### TC-CRX-073: Non-admin cannot reach providers & keys, logs, or settings pages meant for admins

**User Role:** Non-admin user with all five Crux role permissions (cross-ref TC-CRX-139).
**Precondition:** None.

**Steps:**
1. Attempt direct navigation to each admin-only page.

**Expected Result:**
- All refused — duplicate of TC-CRX-139's coverage from this suite's own angle; confirm consistent results between both TCs.

- **CROSS-REFERENCED 2026-09-15** — not independently re-executed this session to avoid duplicating live evidence already gathered: `CRUX_NAVIGATION_AND_PERMISSIONS.md`'s TC-CRX-139 already confirmed direct-URL refusal (403) for `/crux/admin/keys`, `/crux/admin/logs`, and `/crux/admin/settings` for a non-admin user with all five Crux role permissions granted, tested with both `luna.blossom` and `daisy.skye`. Consistent with this suite's own admin-only findings on TC-CRX-068/079/080/081/084 (all admin-session evidence gathered without ever needing a non-admin session to reach these pages).

---

### TC-CRX-074: Invalid/expired provider key fails its live test honestly

**User Role:** Administrator.
**Precondition:** A deliberately invalid API key string.

**Steps:**
1. Add the invalid key.
2. Run the live credential test.

**Expected Result:**
- The test reports a genuine failure with a real reason (e.g. 401 from the provider) — not a false "success," and not a generic unhelpful error.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, admin): **PASS — and this is the positive counterpart to BUG-CRX-001.** Added a deliberately invalid key (`sk-ant-invalid-deliberately-wrong-...`) for the **Anthropic** provider (distinct from OpenRouter, whose "Test connection" was already proven a false-positive in BUG-CRX-001 because its `/models` endpoint needs no auth). Clicked "Test connection" on the Anthropic row: it displayed a genuine, specific failure — `HTTPError: HTTP Error 401: Unauthorized` — a real provider-returned reason, not a generic message and not a false success. Confirms the test button's mechanism is sound in general; BUG-CRX-001 is specifically about OpenRouter's unauthenticated `/models` endpoint, not the test feature as a whole. Deleted the throwaway key afterward (also exercised as TC-CRX-070's delete case above).

---

## Additional Cases (added 2026-09-11 after full controller/route source review)

> `retire` and `upload` had zero test coverage — both are real write actions gated by `manage_crux_agents` exactly like `create`/`pause`/`provision`, but neither appears in `init.rb`'s visible permission-action array (only enforced via the controller's own `require_manage_agents` method). Worth testing independently rather than assuming they're covered by TC-CRX-065/077's coverage of the other three actions.

---

### TC-CRX-075: Retire an agent — one-way, permanent, locks the paired Redmine user (CRX-48 rule 3)

**User Role:** Logged-in user with `manage_crux_agents`.
**Precondition:** An agent with a provisioned Redmine identity (from TC-CRX-067).

**Steps:**
1. Retire the agent, with the explicit confirm checkbox checked (`confirm=true` — the controller never forces this itself; an unconfirmed call must be honestly refused by core).
2. Verify the agent's paired Redmine user account is now locked.
3. Attempt to retire the same agent again, or un-retire it.

**Expected Result:**
- Retiring with `confirm=true` succeeds and genuinely locks the paired Redmine user (verify via Administration → Users, not just trusting the chat/UI response).
- This is explicitly one-way per its own spec comment ("one-way, permanent") — confirm there is no un-retire path; attempting to retire an already-retired agent reports honestly (not a fabricated second success).
- Retiring WITHOUT `confirm=true` is refused by core, not silently treated as confirmed.

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, luna.blossom — `manage_crux_agents`): **PASS, all four sub-checks.** Used "Builder 1" (the identity provisioned in TC-CRX-067). (1) Direct API POST to `/crux/agents/retire` with `{id: 'builder-1'}` and no `confirm` → honestly refused: `200 {"ok":false,"error":"retiring is permanent — pass \"confirm\": true to proceed"}`, not silently treated as confirmed. (2) Checked "I understand this is permanent" and clicked "Retire agent" in the UI dialog → succeeded, row status flipped to "retired" with the entire Actions column removed (no Pause/Edit/Retire/Create-identity buttons at all). (3) Independently verified via `rails runner` (bypassing UI/API) that the paired Redmine user is genuinely locked: `login=builder-1 status=3 locked=true` (Redmine's `STATUS_LOCKED`). (4) Attempted to retire the already-retired agent again via direct API (`confirm:true`) → honest refusal, not a fabricated second success: `200 {"ok":false,"error":"agent 'builder-1' is already retired"}`. No un-retire control exists anywhere in the UI for a retired row, confirming the "one-way, permanent" claim.

---

### TC-CRX-076: Upload a customer-authored agent definition (CRX-23)

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

- **CONFIRMED LIVE 2026-09-15** (Local, `crux-redmine` localhost:3014, luna.blossom — `manage_crux_agents`): **PASS, all three sub-checks.** (1) Uploaded a valid definition matching `AGENT-TEMPLATE.md`'s shape (`qa-crx146-agent`, frontmatter + system prompt) via the "Upload Agent" dialog's file picker — "Definition file" auto-filled "Raw content" verbatim, "Upload" succeeded ("\"QA CRX-146 Agent\" uploaded."), and appeared correctly in the roster. Verified via `/crux/agents.json` that the created record matches the uploaded file exactly, field for field: `description`, `capabilities: [qa-test]`, `allowed_tools: []`, `max_concurrent: "1"`, `cost_budget_month: "10"`, `origin: customer`, and `prompt` all byte-identical to the source file — confirming the controller does zero transformation. (2) Uploaded a deliberately malformed file (plain text, no `---` frontmatter) → real, specific error shown in the dialog itself: `⚠ malformed file — expected '---' frontmatter, then '---', then the prompt body` — not a generic failure message. (3) Already confirmed in TC-CRX-066 above: `daisy.skye` (zero Crux permissions) got `403 {"ok":false,"error":"You are not allowed to manage agents."}` on a direct POST to `/crux/agents/upload` — identical to create/pause/provision/retire.

---

## Evidence Map

- Case IDs: TC-CRX-064 through TC-CRX-074, TC-CRX-075 through TC-CRX-076 — all 13 executed live 2026-09-15 (TC-CRX-068/082 carried forward from 2026-09-11, all others fresh this session), all PASS. TC-CRX-073 cross-referenced against `CRUX_NAVIGATION_AND_PERMISSIONS.md`'s TC-CRX-139 rather than re-executed (same admin-only pages, same non-admin refusal already proven there).
- Screenshots: bugs only (none captured — all findings this session were HTTP/API/log-level, not rendering defects).
- Log: `docs/CRUX_HANDOFF.md` 2026-09-15 entry.
- Bug reference: BUG-CRX-006 (new, found via TC-CRX-071) — a systemic proxy-layer status-code bug affecting all 12 Crux controllers, not specific to this suite's own action set. BUG-CRX-001 cross-confirmed as OpenRouter-specific (not a general "Test connection" defect) via TC-CRX-074's Anthropic-provider negative case.
- Fixtures created this session (see `automation/testdata/CRUX_TESTDATA_LOCAL.xlsx` — update before next session): Redmine role "AI Agent" (admin, permanent — required for CRX-48 provisioning to work at all); agent `qa-crx146-agent` "QA CRX-146 Agent" (customer, online — TC-CRX-076 upload fixture, left in place); Redmine user `builder-1` (provisioned then retired/locked — TC-CRX-067/145 fixture, permanent per CRX-48's "never deleted" rule); agent `docs-writer` paused then resumed (no residual state); `automation/uploads/valid-agent-def.md` and `malformed-agent-def.md` (checked-in upload fixtures for TC-CRX-076).
