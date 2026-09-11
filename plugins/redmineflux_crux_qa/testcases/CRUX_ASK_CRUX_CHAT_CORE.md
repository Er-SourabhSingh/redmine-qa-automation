# Test Cases — Redmineflux Crux — Ask Crux Chat (Core)

> Source: `docs/CRUX_FEATURES_LIST.md` #1, #20; `docs/CRUX_REQUIREMENTS.md` Key Features #1; `redmineflux-crux-core/docs/API.md` `POST /api/chat`, `GET/POST /api/sessions`; RELEASE-NOTES 0.91.0/0.92.0 (CRC-27 domain routing, CRC-30 hand-off confirm card, CRC-31 user identity).
>
> **Execution readiness: BLOCKED for most cases below** — no `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY` is configured on the local stack, so chat currently only returns the canned echo-provider fallback, not real routing/tool-call/streaming behavior. Write these TCs now (per project convention), execute once a key is added. TC-CRX-011 and TC-CRX-012 (bubble/UI presence only) may already be partially executable — everything from TC-CRX-013 onward needs a real provider.

## Plugin
- Name: redmineflux_crux (chat surface: `redmineflux-crux-core` + `redmineflux_crux` plugin)
- Version: crux-core 0.92.0 / plugin 0.39.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-011: Chat streams a reply via SSE

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** At least one LLM provider key configured.

**Steps:**
1. Open the chat bubble/drawer.
2. Ask a simple question ("what are the agents working on?").
3. Observe how the reply renders.

**Expected Result:**
- The reply streams in incrementally (SSE), not as one delayed block.
- The reply text is grounded in a real tool call, not a generic/canned answer.

---

### TC-CRX-012: User identity is known without asking (CRC-31)

**User Role:** Any logged-in user with `use_ask_crux`.
**Precondition:** This user has at least one issue assigned to them in Redmine.

**Steps:**
1. Ask "what's my work today?" / "let me know my todays work".
2. Ask "what are my assigned issues?"

**Expected Result:**
- The agent does NOT ask "what's your username?" — it already knows the real logged-in user (`User.current.login`, server-injected, never forgeable by the browser) per CRC-31.
- The returned issues are genuinely this user's own assigned issues, not the MCP service account's (an admin) issues — CRC-31 explicitly forbids using `redmineflux_core_my_workload` for identity since that resolves the *service key's* identity, not the real chatting user.
- Both phrasings ("today's work" and "assigned issues") route correctly — RELEASE-NOTES 0.92.0 specifically fixed a routing miss on bare "work" wording.

---

### TC-CRX-013: Domain-specific question routes to the correct bundled agent

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask a CRM-specific question without naming the agent, e.g. "what deals need attention?"
2. Ask a Workload-specific question, e.g. "who's overloaded this week?"
3. Ask a Timesheet-specific question, e.g. "whose timesheets are pending approval?"

**Expected Result:**
- Each question routes to the matching bundled agent (Sales Agent, Capacity Agent, Time Agent respectively) automatically, without the user needing to `@mention` it.
- The reply cites a real tool call from that plugin's own MCP tools — never a plain Redmine issue-tool substitute.

---

### TC-CRX-014: Explicit `@mention` addresses a named agent directly

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask "@Sales Agent what's the state of our pipeline?"
2. Ask an ambiguous, cross-domain question with no `@mention`, e.g. "summarize this page for me."

**Expected Result:**
- The `@mention` addresses the Sales Agent directly, bypassing domain-inference routing.
- The ambiguous cross-domain question routes to the Project Manager (or general) agent instead of a single plugin agent.

---

### TC-CRX-015: A hand-off between agents requires a confirm card (CRC-30)

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A question phrased to trigger a plain-chat hand-off suggestion (not a direct domain match).

**Steps:**
1. Ask a question that causes one agent to suggest handing off to another (e.g. a general question that could route to the Project Manager after an initial reply).
2. Observe whether the hand-off happens immediately or requires a click.

**Expected Result:**
- The hand-off renders as an explicit confirm card, not free text the user has to interpret and reply to.
- Nothing routes to another agent for real until an explicit, attributed human decision (card click, English yes/no fast path, or language-independent marker fallback).
- Confirming re-runs the original question through the Project Manager as a genuine delegated turn — verify the reply actually reflects delegation (e.g. different tone/agent attribution), not a repeat of the same non-delegated answer.

---

### TC-CRX-016: Domain-matching questions skip the hand-off card entirely

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask a clearly domain-matching question (e.g. a CRM question) that `_domain_route()` should catch directly.

**Expected Result:**
- No hand-off confirm card appears — the question routes directly to the matching agent on the first try, per RELEASE-NOTES 0.91.0 ("a domain-matching question never reaches this path at all").

---

### TC-CRX-017: Non-English question still routes correctly

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** None.

**Steps:**
1. Ask a domain-matching question in a non-English language containing a recognizable loanword (e.g. French, using "ticket").
2. Ask a hand-off-triggering question in the same non-English language and attempt to confirm via the language-independent marker fallback (not the English yes/no fast path).

**Expected Result:**
- The loanword-based question routes directly (RELEASE-NOTES 0.91.0 specifically verified this live in French — "a 'ticket' loanword skipped the card entirely").
- The non-English confirm attempt still works via the marker fallback, not just the English "yes"/"no" path.

---

### TC-CRX-018: Chat sessions — list, create, rename

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

---

### TC-CRX-019: Empty/unavailable plugin data is reported honestly, never guessed

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A plugin with genuinely no data for the question asked (e.g. a project with zero CRM deals).

**Steps:**
1. Ask a CRM question scoped to a project/entity with no CRM records at all.

**Expected Result:**
- The agent says data is empty/unavailable plainly — it does not fabricate a plausible-sounding number, count, or status. This is stated as an explicit "must never" rule for every one of the 9 agents — a strong candidate to actually try to break.

---

## Negative Cases

---

### TC-CRX-020: Unreachable plugin tools are reported honestly

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** A domain whose plugin is not installed/reachable in this deployment (if any exists on the QA stack) — otherwise simulate by temporarily breaking the MCP connection for one tool category, if feasible without disrupting other testing.

**Steps:**
1. Ask a question for the unreachable plugin's domain.

**Expected Result:**
- The agent states plainly that the plugin's tools aren't reachable — it does not answer from guesswork or general knowledge.

---

### TC-CRX-021: Chat never fabricates a figure it didn't just read

**User Role:** Logged-in user with `use_ask_crux`.
**Precondition:** Known real data for at least one entity (e.g. a specific deal's value).

**Steps:**
1. Ask for that entity's value/status.
2. Immediately ask a follow-up about a similarly-named but different entity.

**Expected Result:**
- The first answer matches the real, current value exactly (verify against the actual record via a read-only MCP/UI check).
- The second answer does not blur/reuse the first entity's figures for the differently-named entity — no cross-contamination between similarly named records.

---

## Evidence Map

- Case IDs: TC-CRX-011 through TC-CRX-021
- Screenshots: bugs only.
- Log: —
- Bug reference: —
