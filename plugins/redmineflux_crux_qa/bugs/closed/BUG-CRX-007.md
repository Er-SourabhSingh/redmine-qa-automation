# Bug Report Template

- Bug ID: BUG-CRX-007
- Production Redmine Issue ID: #120609
- Title: Domain-inference chat routing (`_domain_route()`) never fires on a bare domain question — only an explicit `@crux` prefix, an `@AgentName` mention, or a literal `"Domain,"` prefix actually reaches an agent with tools
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: Administrator / `luna.blossom` (Manager, `use_ask_crux`)
- Date: 2026-09-15

## Steps to reproduce

1. With the CRM plugin genuinely installed and working (confirmed independently — see Evidence), start a **new** Ask Crux chat session (or send the first content-carrying message after context reset).
2. Send a clearly domain-specific question with no `@AgentName` mention, no leading `@crux`, and no domain keyword at the start of the message — e.g. exactly `what deals need attention?` (this is the literal example TC-CRX-104 itself uses, and closely matches the Sales Agent's own manifest description: *"CRM, what deals need attention?"*).
3. Compare against the same question sent with: (a) an explicit `@Sales Agent` mention, (b) an `@crux` prefix, (c) a literal `"CRM,"` prefix.

## Expected result

- Per TC-CRX-104 ("Each question routes to the matching bundled agent... automatically, without the user needing to `@mention` it") and RELEASE-NOTES 0.91.0 ("a domain-matching question never reaches [the hand-off] path at all — it's dispatched directly"), a clearly domain-matching question should reach a real, tool-equipped agent on its own, based on message content alone.

## Actual result

- **Bare question, no prefix, no @mention** (step 2): falls to a completely tool-less "plain chat" mode. Verbatim reply: *"I don't have tools available in this plain chat to check deals, pipelines, or any live data... Ask me again starting your message with `@crux`..."* No agent is asked, no tool is called, `_domain_route()` never fires.
- **Same question with `@Sales Agent` explicitly selected**: routes correctly, real tool call (`redmineflux_crm_pipeline`), accurate grounded answer (confirmed: "0 deals... $0 total pipeline value" on an empty CRM, later "USD 42,000" / "USD 15,750" on two real seeded deals).
- **Same question with `@crux` prefix**: routes correctly via the Project Manager, real tool call, accurate answer.
- **Same question with `"CRM,"` prefix**: routes correctly, directly to the Sales Agent, real tool call, accurate answer.
- So the actual mechanism works correctly in every case **except** the one TC-CRX-104 itself describes as the normal case: a bare, unprefixed domain question. This was reproduced 3 times (twice on the CRM domain, once on the Workload domain — `who's overloaded this week?`, which fell to Project Manager rather than Capacity Agent, though at least got a real tool call there since Project Manager's own tool grant happens to include Workload).
- This is reproducible with the CRM plugin fully functional (ruled out as a missing-plugin artifact — see Evidence) and after a full MCP/crux-core restart cycle (ruled out as a stale-session artifact).
- Note: a **follow-up** message within an already-CRM-context session does NOT need the prefix repeated (confirmed: "what about the Acme Industries Expansion deal?" correctly answered via Project Manager with a real tool call, no prefix, because the session already had CRM context from the prior message). The gap is specifically the *first* domain-establishing message of a routing context, not follow-ups.

## Evidence

### Screenshot

Not captured — behavioral/routing finding, not a rendering defect.

### Console / log

- `what deals need attention?` (bare, new session) → *"I don't have tools available in this plain chat... Ask me again starting your message with `@crux`..."* — 0 tool calls, 1,805 in / ~150 out tokens (near-minimum, consistent with no tool round-trip).
- `@Sales Agent` + `what deals need attention?` → `→ asking the Sales Agent…` real `Sources (1)` citation, correct data.
- `@crux what deals need attention?` → `→ asking the Project Manager…` real `Sources (1)` citation, correct data.
- `CRM, what deals need attention?` → `→ asking the Sales Agent…` real `Sources (1)` citation, correct data.
- CRM plugin confirmed genuinely installed and functional independent of this bug: Administration → Plugins lists "Redmineflux CRM Plugin" v7.0.0; `redmineflux-mcp` container log at startup: `Loaded plugin: crm — 43 tools (Contacts, companies, deals, leads, pipeline, activities — full CRUD)`; two real deals created via the CRM UI and correctly, distinctly retrieved via chat once a valid trigger was used (TC-CRX-112 evidence).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Note for triage

This may point to `_domain_route()` (or whatever routes the very first turn of a session/context) requiring a keyword match against the message's own leading tokens rather than a full-message semantic classification — worth checking whether the router's keyword list only matches when the domain word is the literal first word (`"CRM,"`, `"Workload,"`) rather than anywhere in a semantically-matching sentence (`"what deals need attention?"`). If so, this is a narrow, fixable trigger-pattern bug, not a deep routing-model problem — the underlying tool-calling and data accuracy are completely sound once *any* valid trigger is used.

## 2026-09-16 retest — FIXED, confirmed live

Not part of today's `CHANGES.md` file list, but `chat.py` now contains a `_domain_route()`/`_DOMAIN_ROUTES` mechanism (with its own code comment explicitly citing "BUG-CRX-007 found live 2026-09-15") that is checked in `_route()` before the generic PM/`_ROUTE_WORDS` fallback — this must have landed in an earlier fix pass than today's handoff.

**Retest (exact original repro):**
1. New chat → `what deals need attention?` (bare, no prefix, no @mention) → routed to **"the Sales Agent"** with a real, grounded, accurate answer (4 real deals cited by ID/value, real tool call, `Sources (2)`). Previously this fell to tool-less plain chat ("I don't have tools available...").
2. New chat → `who's overloaded this week?` (bare) → routed to **"the Capacity Agent"** specifically (not just the Project Manager's incidental Workload tool grant, which the original bug noted as a "happy accident") — real tool call, accurate empty-state answer.

**Verdict: FIXED.** Both bare-question reproductions now route correctly to the matching domain agent, exactly as TC-CRX-104 originally specified.

## Production report

Reported to production as issue **#120609** (`ztflux`, Tracker Bug, priority Medium, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120483** (`CRUX_ASK_CRUX_CHAT_CORE.md`, where it was found via TC-CRX-104), Environment "Window 11 + Chrome" — testcase marked **Failed**, defect relation `#120483 defect #120609` confirmed. Attachments: `BUG-CRX-007.pdf` (5943 bytes) and this MD file (5590 bytes), both confirmed byte-size-exact against the production copies.

**Correction (same day):** the issue was initially created without an explicit `tracker_id`, defaulting to "Task" instead of "Bug" like every other bug this session. Caught and fixed via `update_issue` (tracker_id=3) immediately after creation — no other fields affected, defect custom fields (Type/Severity/Priority) auto-populated correctly once corrected.
