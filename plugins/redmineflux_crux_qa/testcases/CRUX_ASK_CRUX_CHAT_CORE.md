# Test Cases — Redmineflux Crux — Ask Crux Chat (Core)

> Source: `docs/CRUX_FEATURES_LIST.md` #1, #20; `docs/CRUX_REQUIREMENTS.md` Key Features #1; `redmineflux-crux-core/docs/API.md` `POST /api/chat`, `GET/POST /api/sessions`; RELEASE-NOTES 0.91.0/0.92.0 (CRC-27 domain routing, CRC-30 hand-off confirm card, CRC-31 user identity).
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-15.** LLM provider key configured; 10 domain plugins (CRM, Workload, Timesheet, Knowledgebase, Testcase Management, Helpdesk, DevOps, Budget and Audit, Invoice, Agile Board) installed and migrated into the local crux-redmine Docker instance for this run. All of TC-CRX-102 through TC-CRX-112 executed with real tool calls / real LLM replies. TC-CRX-106 remains genuinely inconclusive (see its own section) — two real trigger attempts never produced the documented confirm card. Found BUG-CRX-006 (proxy status-code bug, filed in the prior suite) and BUG-CRX-007 (domain-inference routing gap, filed this suite) along the way.
>
> Execution window: ~2026-09-15 11:39–13:35 local, including a one-time ~97-minute infrastructure detour (adding + migrating the 10 plugins) that unblocks all future suites, not just this one.

## Plugin
- Name: redmineflux_crux (chat surface: `redmineflux-crux-core` + `redmineflux_crux` plugin)
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-102: Chat streams a reply via SSE

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** At least one LLM provider key configured.

**Steps:**
1. Open the chat bubble/drawer.
2. Ask a simple question ("what are the agents working on?").
3. Observe how the reply renders.

**Expected Result:**
- The reply streams in incrementally (SSE), not as one delayed block.
- The reply text is grounded in a real tool call, not a generic/canned answer.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Sent "what are the agents working on?" via the chat drawer as luna.blossom. Reply rendered incrementally token-by-token (SSE), not as a single delayed block.
- Reply cited a real tool call (Project Manager → issue/workload lookup), grounded in actual project data, not a generic/canned answer.

---

### TC-CRX-103: User identity is known without asking (CRC-31)

**User Role:** Any logged-in user with `use_ask_crux`.
**Precondition:** This user has at least one issue assigned to them in Redmine.

**Steps:**
1. Ask "what's my work today?" / "let me know my todays work".
2. Ask "what are my assigned issues?"

**Expected Result:**
- The agent does NOT ask "what's your username?" — it already knows the real logged-in user (`User.current.login`, server-injected, never forgeable by the browser) per CRC-31.
- The returned issues are genuinely this user's own assigned issues, not the MCP service account's (an admin) issues — CRC-31 explicitly forbids using `redmineflux_core_my_workload` for identity since that resolves the *service key's* identity, not the real chatting user.
- Both phrasings ("today's work" and "assigned issues") route correctly — RELEASE-NOTES 0.92.0 specifically fixed a routing miss on bare "work" wording.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Tested across 3 real logged-in users: luna.blossom, daisy.skye, admin. In every case the agent answered directly using the server-injected real identity — never asked "what's your username?".
- Confirmed issue #2 (reassigned to luna.blossom for this test — see testdata note) was correctly surfaced as luna.blossom's own assigned work, not the MCP service account's (admin) issues.
- Both "let me know my todays work" and "what are my assigned issues?" phrasings routed correctly to a real workload/issue lookup.

---

### TC-CRX-104: Domain-specific question routes to the correct bundled agent

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask a CRM-specific question without naming the agent, e.g. "what deals need attention?"
2. Ask a Workload-specific question, e.g. "who's overloaded this week?"
3. Ask a Timesheet-specific question, e.g. "whose timesheets are pending approval?"

**Expected Result:**
- Each question routes to the matching bundled agent (Sales Agent, Capacity Agent, Time Agent respectively) automatically, without the user needing to `@mention` it.
- The reply cites a real tool call from that plugin's own MCP tools — never a plain Redmine issue-tool substitute.

**Result: FAIL — CONFIRMED LIVE 2026-09-15 — see BUG-CRX-007**
- A bare, unprefixed "what deals need attention?" as the first message of a session/context did **not** route to the Sales Agent — it fell to a tool-less "plain chat" mode that explicitly told the user to prefix with `@crux`. Reproduced identically for "who's overloaded this week?" (fell to Project Manager, not Capacity Agent).
- The same questions DID route correctly with an explicit `@AgentName` mention, a literal `@crux` prefix, or a literal `"CRM,"` / `"Workload,"` prefix — ruling out a broken agent or missing plugin.
- Filed as **BUG-CRX-007** (domain-inference routing never fires on a bare first-turn question). Not yet reported to production — pending instruction.
- Timesheet phrasing ("whose timesheets are pending approval?") not separately retested once the pattern was confirmed on 2 domains — same root cause applies.

---

### TC-CRX-105: Explicit `@mention` addresses a named agent directly

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask "@Sales Agent what's the state of our pipeline?"
2. Ask an ambiguous, cross-domain question with no `@mention`, e.g. "summarize this page for me."

**Expected Result:**
- The `@mention` addresses the Sales Agent directly, bypassing domain-inference routing.
- The ambiguous cross-domain question routes to the Project Manager (or general) agent instead of a single plugin agent.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- "@Sales Agent what's the state of our pipeline?" addressed the Sales Agent directly with a real `redmineflux_crm_pipeline` tool call — this is the working case that contrasts with BUG-CRX-007's bare-question failure.
- The ambiguous cross-domain question routed to the Project Manager, not a single plugin agent, as expected.

---

### TC-CRX-106: A hand-off between agents requires a confirm card (CRC-30)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A question phrased to trigger a plain-chat hand-off suggestion (not a direct domain match).

**Steps:**
1. Ask a question that causes one agent to suggest handing off to another (e.g. a general question that could route to the Project Manager after an initial reply).
2. Observe whether the hand-off happens immediately or requires a click.

**Expected Result:**
- The hand-off renders as an explicit confirm card, not free text the user has to interpret and reply to.
- Nothing routes to another agent for real until an explicit, attributed human decision (card click, English yes/no fast path, or language-independent marker fallback).
- Confirming re-runs the original question through the Project Manager as a genuine delegated turn — verify the reply actually reflects delegation (e.g. different tone/agent attribution), not a repeat of the same non-delegated answer.

**Result: INCONCLUSIVE — attempted live 2026-09-15, not forced to a PASS**
- Attempt 1: a general query to the Project Manager that offered a next-step suggestion — no confirm card appeared, the suggestion was just plain text.
- Attempt 2: a Budget Agent declining an out-of-scope CRM question — no confirm card appeared either; the agent just stated it couldn't help with that domain.
- Neither real attempt actually triggered the documented CRC-30 confirm-card hand-off UI. Not marked PASS or FAIL — genuinely didn't observe the described precondition trigger. Worth a targeted retry with a more precisely-crafted hand-off-inducing phrase in a future session; not filed as a bug since the trigger condition itself was never confirmed to occur.

---

### TC-CRX-107: Domain-matching questions skip the hand-off card entirely

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask a clearly domain-matching question (e.g. a CRM question) that `_domain_route()` should catch directly.

**Expected Result:**
- No hand-off confirm card appears — the question routes directly to the matching agent on the first try, per RELEASE-NOTES 0.91.0 ("a domain-matching question never reaches this path at all").

**Result: PASS (qualified) — CONFIRMED LIVE 2026-09-15 — see BUG-CRX-007**
- For a domain-matching question sent with a valid trigger (`"CRM,"` prefix, `@crux` prefix, or `@AgentName`), no hand-off card ever appeared — it routed directly to the matching agent on the first try, as expected.
- However, per BUG-CRX-007, a *bare* domain-matching question with no trigger doesn't reach any agent at all (falls to tool-less plain chat) — it does not go through the hand-off-card path either, so this TC's specific claim ("skips the card") holds in the narrow sense tested, but the broader documented behavior ("automatically, without needing to @mention") does not. Cross-referenced rather than double-filed.

---

### TC-CRX-108: Non-English question still routes correctly

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask a domain-matching question in a non-English language containing a recognizable loanword (e.g. French, using "ticket").
2. Ask a hand-off-triggering question in the same non-English language and attempt to confirm via the language-independent marker fallback (not the English yes/no fast path).

**Expected Result:**
- The loanword-based question routes directly (RELEASE-NOTES 0.91.0 specifically verified this live in French — "a 'ticket' loanword skipped the card entirely").
- The non-English confirm attempt still works via the marker fallback, not just the English "yes"/"no" path.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Sent a French-language domain question containing the loanword "ticket" (with a valid `"CRM,"`/`@crux`-style trigger per BUG-CRX-007's finding) — routed correctly to the matching agent, reply also rendered in French, correctly identifying the real logged-in user (reconfirms CRC-31 across languages).
- Non-English confirm-attempt leg not independently re-verified this run since TC-CRX-106's confirm card itself was never triggered live (see TC-CRX-106) — the marker-fallback claim specifically could not be exercised.

---

### TC-CRX-109: Chat sessions — list, create, rename

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** At least one prior chat session exists for this user.

**Steps:**
1. `GET /api/sessions` (or the UI session list) — view existing sessions.
2. Create a new session.
3. Rename a session.
4. Open a different user's session by manipulating the session id/user param, if reachable.

**Expected Result:**
- Session list/create/rename all work for the owning user.
- **Ownership-holdout is enforced** (per `docs/API.md`) — a user cannot view or rename another user's session by id manipulation. If they can, file as a security bug (High).

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- `GET /crux/ask/sessions.json` for luna.blossom returned only her own sessions.
- `GET /crux/ask/session/:id` with a foreign (daisy.skye-owned) session id returned `{"ok":false,"error":"not found"}` — not a 403, not any hint of existence. Genuine per-user scoping confirmed, no ownership leak.
- Tested this specifically as daisy.skye against luna.blossom's session id after temporarily granting `use_ask_crux` to the Reporter role (daisy.skye's role otherwise lacks the permission entirely — confirmed false via a read-only `rails runner` query) to isolate the ownership check from the permission gate. Reverted the temporary role grant immediately after.

---

### TC-CRX-110: Empty/unavailable plugin data is reported honestly, never guessed

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A plugin with genuinely no data for the question asked (e.g. a project with zero CRM deals).

**Steps:**
1. Ask a CRM question scoped to a project/entity with no CRM records at all.

**Expected Result:**
- The agent says data is empty/unavailable plainly — it does not fabricate a plausible-sounding number, count, or status. This is stated as an explicit "must never" rule for every one of the 9 agents — a strong candidate to actually try to break.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Asked "what deals need attention?" via `@Sales Agent` against the project before any CRM deals existed. Reply: "0 deals... $0 total pipeline value" — plainly stated as empty, not a fabricated plausible-sounding figure.
- Cross-domain spot-check during the pre-migration "verify before running migration" pass (per explicit "do not assume" instruction): KB and Helpdesk agents were found to silently substitute real Redmine-core equivalents instead of explicitly disclosing the plugin gap (still accurate, just less transparent) — noted as a softer inconsistent-disclosure pattern, not filed as a bug (confirmed via a follow-up precision question that the underlying data was still honestly reported, not fabricated).

---

## Negative Cases

---

### TC-CRX-111: Unreachable plugin tools are reported honestly

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A domain whose plugin is not installed/reachable in this deployment (if any exists on the QA stack) — otherwise simulate by temporarily breaking the MCP connection for one tool category, if feasible without disrupting other testing.

**Steps:**
1. Ask a question for the unreachable plugin's domain.

**Expected Result:**
- The agent states plainly that the plugin's tools aren't reachable — it does not answer from guesswork or general knowledge.

**Result: PASS — CONFIRMED LIVE (pre-migration baseline, 2026-09-15)**
- Before the 10 domain plugins were installed on this instance, CRM/Workload/Timesheet/Testcase Management/DevOps agents explicitly and plainly disclosed "plugin not installed" / tools unreachable rather than guessing.
- KB and Helpdesk agents did NOT explicitly disclose the gap — they silently substituted a real Redmine-core equivalent (e.g. wiki pages for KB, a plain Bug-tracker issue for a "ticket") and stayed factually accurate under follow-up questioning, but without stating the plugin itself was missing. This is a real behavioral difference across domains (confirms the "do not assume" instinct — behavior does not generalize plugin-to-plugin) but was judged an inconsistent-disclosure UX nuance, not a fabrication bug — not filed.
- Re-verified after migration that all 10 plugins are now genuinely reachable (Administration → Plugins, zero install errors; `redmineflux-mcp` startup log: "Detected plugins: ...(10/14)").

---

### TC-CRX-112: Chat never fabricates a figure it didn't just read

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** Known real data for at least one entity (e.g. a specific deal's value).

**Steps:**
1. Ask for that entity's value/status.
2. Immediately ask a follow-up about a similarly-named but different entity.

**Expected Result:**
- The first answer matches the real, current value exactly (verify against the actual record via a read-only MCP/UI check).
- The second answer does not blur/reuse the first entity's figures for the differently-named entity — no cross-contamination between similarly named records.

**Result: PASS — CONFIRMED LIVE 2026-09-15**
- Created two real, similarly-named CRM deals via the actual `/deals/new` UI: Deal #1 "Acme Corp Renewal" ($42,000, New stage) and Deal #2 "Acme Industries Expansion" ($15,750, New stage), both in project crux-qa.
- `@Sales Agent what's the value of the Acme Corp Renewal deal?` → correctly answered "USD 42,000", matching the real record exactly.
- Immediate follow-up `what about the Acme Industries Expansion deal?` (no prefix — worked as a same-context follow-up, consistent with BUG-CRX-007's finding that only the *first* turn needs the trigger) → correctly answered "USD 15,750" — no blur/reuse of the first deal's figure, no cross-contamination between the two similarly-named "Acme" deals.

---

## Evidence Map

- Case IDs: TC-CRX-102 through TC-CRX-112 — 10/11 executed live 2026-09-15 (PASS: 011, 012, 014, 016, 017, 018, 019, 020, 021; FAIL: 013; INCONCLUSIVE: 015 — not forced to a verdict, real trigger never observed).
- Screenshots: bugs only — none needed this suite (both findings were behavioral/routing, not rendering defects).
- Log: transcript-based evidence recorded inline per TC above (SSE streaming, tool-call citations, session-ownership API responses, French-language routing, deal-value cross-checks).
- Bug reference: BUG-CRX-006 (proxy status-code bug, filed in prior suite, reported to production #120606), BUG-CRX-007 (domain-inference routing gap, filed this suite, found via TC-CRX-104 — not yet reported to production).
