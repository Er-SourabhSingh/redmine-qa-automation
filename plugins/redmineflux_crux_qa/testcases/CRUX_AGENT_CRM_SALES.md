# Test Cases — Redmineflux Crux — Sales Agent (CRM) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/crm-sales.md` (full `allowed_tools:` + Identity/How-you-work/What-you-must-never-do sections); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key to generate write proposals with correctly-filled fields. Write now, execute once a key is added (see TC-CRX-078).

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
- Bug reference: —
