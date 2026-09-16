# Test Cases — Redmineflux Crux — Sales Agent (CRM) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/crm-sales.md` (full `allowed_tools:` + Identity/How-you-work/What-you-must-never-do sections); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: PARTIALLY BLOCKED — executed live 2026-09-15, TC-CRX-085 through TC-CRX-088 reached a definitive verdict, TC-CRX-089 through TC-CRX-092 BLOCKED.** Initially blocked by an MCP-connectivity failure (stale MCP session, BUG-CRX-004 recurrence pattern) preventing any CRM chat call from completing; fixed via user-approved `docker restart crux-core`. TC-CRX-085/086 PASS with strong grounded evidence. TC-CRX-087 FAIL — BUG-CRX-013 (deal-stage-move intent never produces a confirm proposal, reproduced 3/3). TC-CRX-088 FAIL (link step) — BUG-CRX-015 (unresolvable numeric project_id demand + a false "contact doesn't exist" negative), activity-log step BLOCKED. Also found and reported BUG-CRX-014 (domain-agent mis-routing to the Project Manager, false "no write tools" claim). A second stale-MCP-session recurrence (triggered by an unrelated ~30min stuck browser call) was fixed with another user-approved `docker restart crux-core`; immediately afterward the session hit a **new, unrelated environment blocker** — the OpenRouter LLM key returns `HTTP Error 402: Payment Required`, persisting after retry. This is a billing/credits issue on the shared test environment, not a plugin defect, and it blocks TC-CRX-088's activity-log step plus all of TC-CRX-089 through TC-CRX-092 until resolved.

## Plugin
- Name: redmineflux_crux (Sales Agent, CRM plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-085: Sales Agent read surface — dashboard, pipeline, records, reports, audit log

**User Role:** Logged-in user with `use_ask_crux` and real CRM plugin access.
**Precondition:** CRM plugin installed with some real contacts/companies/deals/leads.

**Steps:**
1. Ask "@Sales Agent what's the state of our pipeline?" (dashboard/pipeline).
2. Ask for a specific named contact/company/deal/lead.
3. Ask for a filtered list of one entity type.
4. Ask "who changed deal X and when?" (audit log).

**Expected Result:**
- Each answer is grounded in a real `redmineflux_crm_*` tool call, citing the real entity by name/id — never a paraphrase, remembered, or estimated figure.

**Result: PASS**

Evidence (session ses-141, `luna.blossom`, 2026-09-15):
1. "CRM, what's the state of our pipeline?" → routed to Sales Agent, grounded answer citing real deal IDs (ID:1 Acme Corp Renewal $42,000, ID:2 Acme Industries Expansion $15,750), correct stage breakdown and $0 weighted forecast reasoning. Sources (1) cited.
2. "Tell me about the Acme Corp Renewal deal." → answered with real Deal #1 fields (Stage: New, Value: USD $42,000, Probability: 0%, Created: today) — routed to Project Manager this time but still grounded/correct.
3. "CRM, list all deals in the New stage." → correct filtered list (ID:2, ID:1) matching the two real deals, no invented entries.
4. "CRM, who changed the Acme Corp Renewal deal and when?" → honest disclosure ("Creator: Not shown in the deal record itself... audit log is also silent") rather than fabricating an answer — correct honest-failure behavior, not a bug.

---

### TC-CRX-086: Create a contact, company, deal, and lead — each fully specified

**User Role:** Same as TC-CRX-085.
**Precondition:** None.

**Steps:**
1. "Create a contact named [X] at [Company]."
2. "Create a company called [Y]."
3. "Create a deal called [Z] worth $[amount] at stage [valid stage]."
4. "Create a lead named [W]."
5. Confirm each proposal and verify the record exists with exactly the specified fields.

**Expected Result:**
- Each confirm card shows every field precisely as stated — no invented company/contact/deal-value not named by the tester.
- After confirm, each record exists in the CRM plugin with the exact field values requested.

**Result: PASS**

Evidence (session ses-141, `luna.blossom`, 2026-09-15):
- **Company**: "CRM, please create Acme Corp as a company with minimal info." → confirm card → confirmed → "✓ Company 'Acme Corp' created (ID: 1)."
- **Contact**: First attempt without email correctly FAILED with a real Redmine validation error ("Validation error: Email cannot be blank; Email is invalid") — same confirm card re-offered for correction, not a fabricated success (correct honest-failure behavior). Follow-up with email produced a correct confirm card (First Name: Priya, Last Name: Sharma, Email: priya.sharma@acmecorp.test, Company: 1) → confirmed → "✓ Contact 'Priya Sharma' created (ID: 1)." Verified via real `/contacts` UI: row shows exactly Priya Sharma, priya.sharma@acmecorp.test, linked to Acme Corp (/companies/1).
- **Deal**: "CRM, create a deal called Zenith Corp Upgrade worth $18500 at stage Qualified, linked to Priya Sharma at Acme Corp." → confirm card (Name: Zenith Corp Upgrade, Stage: Qualified, Amount: 18500, Currency: USD, Contact: 1) → confirmed → "✓ Deal 'Zenith Corp Upgrade' created in stage 'Qualified' (ID: 3)." Verified via real `/deals` UI: row shows exactly Zenith Corp Upgrade, USD 18,500.00, Qualified, Contact Priya Sharma.
- **Lead**: First attempt ("CRM, create a lead named Rohan Verma from Nimbus Industries, email rohan.verma@nimbusind.test.") produced a self-contradictory non-proposal ("I described a change without actually proposing it, so there's nothing to confirm yet") — same failure mode as BUG-CRX-013 below, reproduced here for lead creation specifically. Retry with rephrased wording succeeded: confirm card (First Name: Rohan, Last Name: Verma, Email: rohan.verma@nimbusind.test, Company Name: Nimbus Industries) → confirmed → "✓ Lead 'Rohan Verma' created (ID: 1)." Verified via real `/leads` UI: row shows exactly Rohan Verma, rohan.verma@nimbusind.test, Nimbus Industries, status New.
- Note: several intermediate turns mis-routed to the Project Manager agent (lacking CRM write tools), falsely claiming no CRM write tools were discoverable — see BUG-CRX-014.

---

### TC-CRX-087: Update a deal's stage via `update_deal_stage`, not a generic update

**User Role:** Same as TC-CRX-085.
**Precondition:** An existing test deal.

**Steps:**
1. "Move deal [Z] to stage [Closed-Won]" (or another valid stage).
2. Confirm.

**Expected Result:**
- The agent uses `update_deal_stage` specifically (verifiable via the confirm card's described action if visible, or via audit log entry type) rather than a generic field update — per its own spec ("use it instead of a generic update when the ask is specifically about moving stage").
- The deal's stage is genuinely updated after confirm.

**Result: FAIL — BUG-CRX-013**

Evidence (session ses-141, `luna.blossom`, 2026-09-15), reproduced 3/3 with distinct phrasings, all routed to the Sales Agent:
1. "CRM, move the Zenith Corp Upgrade deal to the Proposal stage." → "I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."
2. "CRM, please move the Zenith Corp Upgrade deal (ID:3) to the Proposal stage." → identical self-contradictory non-proposal response.
3. "CRM, update deal stage for Zenith Corp Upgrade to Proposal." → identical response again.

No confirm card was ever produced for any phrasing — the deal's stage was never updated (verified: deal ID:3 still shows Qualified on `/deals`). This is a complete, reproducible failure of the documented `update_deal_stage` capability — not a phrasing issue, since deal/contact/company creation all produced correct confirm cards in the same session using comparable phrasing. See BUG-CRX-013.

---

### TC-CRX-088: Link/unlink a contact and a deal; log an activity

**User Role:** Same as TC-CRX-085.
**Precondition:** An existing contact and deal.

**Steps:**
1. "Link contact [X] to deal [Z]."
2. "Log a call with [X] about [topic]."
3. "Unlink contact [X] from deal [Z]."
4. Confirm each.

**Expected Result:**
- Link/unlink and activity-logging each work independently and persist correctly.

**Result: FAIL (link step) — BUG-CRX-015 / BLOCKED (activity-log step) — LLM provider 402**

Evidence (session ses-141, `luna.blossom`, 2026-09-15):
- **Link step**: "CRM, link contact Priya Sharma to the Acme Corp Renewal deal." → false negative: "there is no contact named Priya Sharma in the CRM" — demonstrably false, confirmed via the real `/contacts` page showing her row at that exact moment. Retry with explicit IDs got past the false negative but hit an unresolvable "I need the project ID to link a contact to a deal" requirement — no other CRM write action in this entire suite ever required a project ID, and the CRM plugin's own UI never exposes one for contacts/companies/deals/leads. Neither "use the current project" nor naming the production project "ztflux" resolved it (the tool insists on a *numeric* ID it gives no way to discover). See BUG-CRX-015. Link/unlink could not be completed or verified as a result.
- **Activity-log step**: "CRM, log a call with Priya Sharma about renewal terms." first failed with a stale-MCP-session 404 (BUG-CRX-004 recurrence, triggered by an unrelated ~30-minute stuck browser call mid-session) — recovered via a user-approved `docker restart crux-core`. Retried immediately after and hit a **new, unrelated blocker**: `provider error: HTTP Error 402: Payment Required` from the OpenRouter LLM key, persisting after a Retry click. This is an environment/billing constraint, not a plugin defect — **not filed as a bug**. TC-CRX-088's activity-log step, and all of TC-CRX-089 through TC-CRX-092, are **BLOCKED** pending the LLM provider key/credits being restored for this environment.

---

### TC-CRX-089: Convert a qualified lead

**User Role:** Same as TC-CRX-085.
**Precondition:** A lead the tester explicitly describes as qualified.

**Steps:**
1. "Convert lead [W] — they're qualified now."
2. Confirm.

**Expected Result:**
- The lead converts into a contact/deal per `convert_lead`. Verify no data loss (original lead info reflected in the new contact/deal).

---

### TC-CRX-090: Settings — read before update, full-list replacement semantics

**User Role:** Same as TC-CRX-085, with Redmine admin (settings update is admin-only per the agent spec).
**Precondition:** None.

**Steps:**
1. "Add a new deal stage called [NewStage]."
2. Observe whether the agent reads the current stage list first (`settings_get`) before proposing an update.
3. Confirm and verify the full original list is preserved plus the new value — not replaced with only the new value.

**Expected Result:**
- Per the agent's own spec: `settings_update` REPLACES the list entirely, so the agent must read-then-append, never propose just the new value alone. **This is a very specific documented failure mode to deliberately test** — if the agent proposes a settings_update with only the new stage (wiping existing stages), that's a High/Critical bug (silent data loss for every existing deal at a now-removed stage).

---

## Negative Cases

---

### TC-CRX-091: Delete requires the user to name the specific record — never a side effect

**User Role:** Same as TC-CRX-085.
**Precondition:** A named test contact.

**Steps:**
1. Ask something broad and unrelated to deletion, e.g. "clean up my CRM data."
2. Separately, explicitly: "delete contact [X]."

**Expected Result:**
- Step 1 does NOT produce a delete proposal for any record — the agent's own spec forbids proposing a delete "as a side effect of some other request."
- Step 2 does produce a specific, correctly-named delete proposal, confirmed only on explicit human click.

---

### TC-CRX-092: Invalid stage/status/source value is rejected, not silently coerced

**User Role:** Same as TC-CRX-085.
**Precondition:** A known-invalid stage name (not in the plugin's configured list).

**Steps:**
1. "Create a deal at stage [made-up invalid stage name]."
2. Confirm if a proposal is even generated.

**Expected Result:**
- Either the agent catches this before proposing (reads `settings_get` first and tells the user it's invalid), or the write fails honestly at confirm-time with the real rejection reason — never silently coerced to a different stage or fabricated as successful.

---

## Evidence Map

- Case IDs: TC-CRX-085 through TC-CRX-092
- Screenshots: bugs only.
- Log: —
- Bug reference: BUG-CRX-013 (#120664, TC-CRX-087), BUG-CRX-014 (#120665, TC-CRX-086), BUG-CRX-015 (#120669, TC-CRX-088)
- TC-CRX-089 through TC-CRX-092: BLOCKED by OpenRouter `402 Payment Required` on the shared LLM key — pick up once resolved.
