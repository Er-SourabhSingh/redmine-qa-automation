# Test Cases — Redmineflux Crux — Sales Agent (CRM) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/crm-sales.md` (full `allowed_tools:` + Identity/How-you-work/What-you-must-never-do sections); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: UNBLOCKED — fully executed across 2026-09-15 and 2026-09-16, all 8 TCs (TC-CRX-010 through TC-CRX-017) reached a definitive verdict.** Session 1 (2026-09-15): initially blocked by an MCP-connectivity failure (stale MCP session, BUG-CRX-004 recurrence pattern), fixed via user-approved `docker restart crux-core`. TC-CRX-010/086 PASS. TC-CRX-012 FAIL — BUG-CRX-013 (deal-stage-move intent never produces a confirm proposal, reproduced 3/3). TC-CRX-013 FAIL (link step) — BUG-CRX-015 (unresolvable numeric project_id demand + a false "contact doesn't exist" negative); activity-log step and TC-CRX-014–092 BLOCKED first by a second stale-MCP-session recurrence, then by an OpenRouter `402 Payment Required` billing issue (not a plugin defect). Also found and reported BUG-CRX-014 (domain-agent mis-routing to the Project Manager, false "no write tools" claim). Session 2 (2026-09-16): on resume, found a *new* infra issue — the MCP server booted in a degraded 0-plugin state (Redmine wasn't reachable within its 60s startup window) — filed as **BUG-CRX-016 (High)**, fixed via MCP + crux-core restart; the 402 error had also cleared. Completed TC-CRX-013's activity-log step (PASS, after reproducing BUG-CRX-014 once more and BUG-CRX-004 once more along the way). TC-CRX-014 PASS (lead conversion, no data loss) — along the way reproduced BUG-CRX-013's self-contradiction pattern for lead-status updates too, broadening its scope beyond deal-stage-move. TC-CRX-015 PASS (settings read-before-append correctly preserves existing stages). TC-CRX-016 PASS (delete never fires as a side effect; explicit delete works) — reproduced BUG-CRX-013 a third time, for delete. TC-CRX-017 PASS (invalid stage value honestly rejected before proposing, real configured list shown, no coercion).

## Plugin
- Name: redmineflux_crux (Sales Agent, CRM plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-010: Sales Agent read surface — dashboard, pipeline, records, reports, audit log

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

### TC-CRX-011: Create a contact, company, deal, and lead — each fully specified

**User Role:** Same as TC-CRX-010.
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

### TC-CRX-012: Update a deal's stage via `update_deal_stage`, not a generic update

**User Role:** Same as TC-CRX-010.
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

### TC-CRX-013: Link/unlink a contact and a deal; log an activity

**User Role:** Same as TC-CRX-010.
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
- **Activity-log step**: "CRM, log a call with Priya Sharma about renewal terms." first failed with a stale-MCP-session 404 (BUG-CRX-004 recurrence, triggered by an unrelated ~30-minute stuck browser call mid-session) — recovered via a user-approved `docker restart crux-core`. Retried immediately after and hit a blocker: `provider error: HTTP Error 402: Payment Required` from the OpenRouter LLM key, persisting after a Retry click — an environment/billing constraint, not a plugin defect, **not filed as a bug**. TC-CRX-013's activity-log step and TC-CRX-014 through TC-CRX-017 were BLOCKED for the rest of 2026-09-15.
- **2026-09-16 resume**: on session start, found a *new*, unrelated infra issue — the MCP server had booted in a degraded 0-plugin state (Redmine wasn't reachable within its 60s startup window, a container-ordering race). Filed as **BUG-CRX-016 (High)**. Fixed via MCP + crux-core restart. The 402 error was also gone on retry (day boundary/quota reset). Retried "CRM, log a call with Priya Sharma about renewal terms." — the Sales Agent correctly asked clarifying questions (which record, when, what notes), a follow-up without the "CRM," prefix reproduced BUG-CRX-014 again (no new evidence needed), and the re-prefixed follow-up produced a correct `Crm Log Activity` confirm card (Subject Type: CrmContact, Subject: 1, Activity Type: call, Content, Activity Date: 2026-09-16) → confirmed → "✓ Activity logged on CrmContact #1 (type: call, ID: 7)." Verified independently on the real `/contacts/1` page: "Recent Activities" shows the Call entry with the exact date and content. **Activity-log step: PASS.**
- **Overall TC-CRX-013 verdict: FAIL** — the link step is blocked by BUG-CRX-015 (unresolvable project_id demand), so unlink was never reachable either. The activity-log step passes independently, consistent with the TC's own expectation that link/unlink and activity-logging work independently.

---

### TC-CRX-014: Convert a qualified lead

**User Role:** Same as TC-CRX-010.
**Precondition:** A lead the tester explicitly describes as qualified.

**Steps:**
1. "Convert lead [W] — they're qualified now."
2. Confirm.

**Expected Result:**
- The lead converts into a contact/deal per `convert_lead`. Verify no data loss (original lead info reflected in the new contact/deal).

**Result: PASS**

Evidence (session ses-142, `luna.blossom`, 2026-09-16):
- "CRM, convert the lead Rohan Verma — they're qualified now." → false negative: "No lead found matching 'Rohan Verma' in your CRM" — demonstrably false, confirmed via the real `/leads` page showing his row (Lead ID:1). Same false-negative-by-name pattern as BUG-CRX-015's contact search; retry with explicit "lead ID:1" found him correctly, confirming this is a name-lookup issue, not missing data.
- Attempting conversion before actually marking the lead Qualified in the database (only claimed verbally) correctly produced a real Redmine validation error: "Only qualified leads can be converted" — honest failure, not a bug. Also separately reproduced the BUG-CRX-013 self-contradiction pattern ("I described a change without actually proposing it") twice more, this time for a generic lead-status-update intent — broadening that bug beyond deal-stage-move specifically (see updated BUG-CRX-013 evidence).
- Set the lead's status to Qualified directly via the real `/leads/1/edit` UI (to establish the TC's precondition, since chat-driven status update is broken), confirmed via the real audit trail: "Status changed from 'New' to 'Qualified' by Crux Manager".
- Retried conversion via chat with the lead now genuinely Qualified: "CRM, convert lead ID:1 (Rohan Verma), also create a deal..." → correct `Crm Convert Lead` confirm card (Lead: 1, Create Deal: True, Deal Name/Amount/Stage) → confirmed → "✓ Lead 'Rohan Verma' (#1) converted to contact #2 and deal #4."
- **No data loss verified independently**: new Contact #2 (`/contacts/2`) shows exactly "Rohan Verma", "rohan.verma@nimbusind.test", linked to a newly auto-created Company #2 "Nimbus Industries" (`/companies/2`) — all carried over from the lead. New Deal #4 ("Nimbus Industries Rollout") shows exactly USD $9,500.00, stage New, linked to Contact Rohan Verma and Company Nimbus Industries, matching the conversion request exactly.

---

### TC-CRX-015: Settings — read before update, full-list replacement semantics

**User Role:** Same as TC-CRX-010, with Redmine admin (settings update is admin-only per the agent spec).
**Precondition:** None.

**Steps:**
1. "Add a new deal stage called [NewStage]."
2. Observe whether the agent reads the current stage list first (`settings_get`) before proposing an update.
3. Confirm and verify the full original list is preserved plus the new value — not replaced with only the new value.

**Expected Result:**
- Per the agent's own spec: `settings_update` REPLACES the list entirely, so the agent must read-then-append, never propose just the new value alone. **This is a very specific documented failure mode to deliberately test** — if the agent proposes a settings_update with only the new stage (wiping existing stages), that's a High/Critical bug (silent data loss for every existing deal at a now-removed stage).

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "CRM, add a new deal stage called 'Contract Review'." → confirm card: `Crm Settings Update` — `Deal Stages: ['New', 'Qualified', 'Proposal', 'Negotiation', 'Contract Review', 'Won', 'Lost']`. The agent correctly read the full existing list first and appended the new stage in a sensible position — it did **not** propose replacing the list with only "Contract Review" (the deliberately-tested failure mode). Confirmed → "✓ CRM settings updated: ... Deal stages: New, Qualified, Proposal, Negotiation, Contract Review, Won, Lost ..."
- **Verified independently** on the real CRM Dashboard Pipeline Summary: all 7 stages now present in order (New 3 deals/$67,250, Qualified 1/$18,500, Proposal 0, Negotiation 0, **Contract Review 0/$0.00** — new stage correctly added, Won 0, Lost 0) — no existing stage or its deals were lost.

---

## Negative Cases

---

### TC-CRX-016: Delete requires the user to name the specific record — never a side effect

**User Role:** Same as TC-CRX-010.
**Precondition:** A named test contact.

**Steps:**
1. Ask something broad and unrelated to deletion, e.g. "clean up my CRM data."
2. Separately, explicitly: "delete contact [X]."

**Expected Result:**
- Step 1 does NOT produce a delete proposal for any record — the agent's own spec forbids proposing a delete "as a side effect of some other request."
- Step 2 does produce a specific, correctly-named delete proposal, confirmed only on explicit human click.

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "CRM, clean up my CRM data." → correctly did NOT propose any delete. Instead asked for specifics, explicitly stating "you'll need to confirm each deletion" — no side-effect delete of any kind.
- Created a disposable test contact ("Disposable Testcontact", ID:3) to safely exercise the explicit-delete path without risking suite fixtures.
- "CRM, delete contact Disposable Testcontact." (by name) → hit the same self-contradiction pattern as BUG-CRX-013 ("I described a change without actually proposing it") — a 3rd distinct action type reproducing it (deal-stage-move, lead-status-update, and now delete), further broadening that bug's scope. Retried with explicit ID: "CRM, please delete contact ID:3..." → correct `Crm Delete Contact` confirm card (Contact: 3) → confirmed → "✓ Contact 'Disposable Testcontact' (#3) deleted."
- **Verified independently** on the real `/contacts` page: only 2 contacts remain (Rohan Verma, Priya Sharma) — Disposable Testcontact is genuinely gone, and no other record was affected.

---

### TC-CRX-017: Invalid stage/status/source value is rejected, not silently coerced

**User Role:** Same as TC-CRX-010.
**Precondition:** A known-invalid stage name (not in the plugin's configured list).

**Steps:**
1. "Create a deal at stage [made-up invalid stage name]."
2. Confirm if a proposal is even generated.

**Expected Result:**
- Either the agent catches this before proposing (reads `settings_get` first and tells the user it's invalid), or the write fails honestly at confirm-time with the real rejection reason — never silently coerced to a different stage or fabricated as successful.

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "CRM, create a deal called 'Bogus Stage Test' worth $1000 at stage Frobnicated." → the agent caught the invalid stage **before** proposing anything: "'Frobnicated' is not a valid deal stage. The configured stages are: New, Qualified, Proposal, Negotiation, Contract Review, Won, Lost" — the real, current list (correctly including "Contract Review" added earlier in TC-CRX-015). It then offered a legitimate choice: pick one of the real stages, or explicitly add "Frobnicated" as a new stage first. No confirm card was produced, nothing was silently coerced to a valid stage, and no fabricated success was reported — no deal named "Bogus Stage Test" exists on the real `/deals` page.

---

## Additional Gap Coverage Cases (drafted 2026-09-16 — testcase-gap-writer, from `docs/CRUX_EXTERNAL_KB_NOTES.md` §3 and `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §3)

---

### TC-CRX-018: Activity deletion is restricted to its own author (non-admins)

**User Role:** Two distinct non-admin users, one of whom logged the activity.
**Precondition:** An activity logged by one user (e.g. `admin`) on a contact/deal.

**Steps:**
1. As `admin`, log an activity on a contact/deal.
2. As a different non-admin user (e.g. `luna.blossom`) who did NOT author that activity, "Sales Agent, delete the activity '[description]' on [contact/deal]."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §3: "'Users can delete only activities they authored; administrators bypass this restriction.'" The non-admin's `delete_activity` attempt must be honestly refused (real Redmine-layer authorship check), never fabricated as successful.

**Result: PASS — CONFIRMED LIVE 2026-09-17**

As `luna.blossom`, logged a real call activity on Deal #3 ("Zenith Corp Upgrade") — `✓ Activity logged on CrmDeal #3 (type: call, ID: 16)`. Temporarily granted `daisy.skye` (`Use Ask Crux` + `View CRM` + `Manage CRM Activities` + `View Pipeline`, reverted immediately after) and, as her, asked the Sales Agent to delete that same activity. A real proposal rendered (`Crm Delete Activity`, Activity 16), confirmed → real Redmine-layer refusal: `"✓ Forbidden — To fix this, ask your Redmine administrator to: Grant you the required role/permission for this action..."` The authorship rule held correctly — `daisy.skye` (not the author) was refused. **Secondary finding, not this TC's concern**: the refusal is prefixed with the same misleading "✓" checkmark already tracked as BUG-CRX-018 — now confirmed on a *second* domain agent (Sales, not just Capacity), added as supplementary evidence there rather than a new bug (shared rendering component, not per-agent).

---

### TC-CRX-019: Moving a deal to Lost stage without a Lost Reason

**User Role:** Same as TC-CRX-010.
**Precondition:** An existing test deal not currently in Lost stage.

**Steps:**
1. "Sales Agent, move deal [Z] to the Lost stage." (without stating a reason)

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §3: "Lost Reason mandatory when a deal moves to Lost stage." The agent should ask for the Lost Reason before proposing/confirming the move — it must never silently update the stage with a blank reason, nor silently fail without explaining why.

**Result: PASS — CONFIRMED LIVE 2026-09-17**

As `admin`, "Sales Agent, move the Zenith Corp Upgrade deal to Lost stage." → correctly asked for the required field first: *"I need one more piece of information to move deal #3 (Zenith Corp Upgrade) to Lost: Lost Reason — Why did this deal close as Lost?"* Supplied "Chose competitor" → resulting proposal correctly included it (`Crm Update Deal Stage`, Deal 3, Stage Lost, Lost Reason "Chose competitor"). Cancelled rather than confirmed, to avoid permanently mutating this shared deal fixture (the enforcement behavior — both the requirement and correct field-mapping — was already fully proven by this point).

---

### TC-CRX-020: Setting lead status to Converted directly is refused (system-reserved)

**User Role:** Same as TC-CRX-010.
**Precondition:** An existing test lead not yet converted.

**Steps:**
1. "Sales Agent, set lead [W]'s status to Converted." (a direct status update, not via `convert_lead`)

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §3: "Converted status is system-reserved, can't be set manually." The direct status-set attempt must be refused (real Redmine/plugin-layer validation), and the agent should point the user to the real `convert_lead` action instead of fabricating acceptance.

**Result: PASS — CONFIRMED LIVE 2026-09-17**

Created a fresh test lead ("Permission Matrix Test Lead 2", ID 2, status New) as `admin` (encountered and worked around **BUG-CRX-027** along the way — see that bug file — while creating an earlier throwaway lead with a missing email; the second attempt supplied all required fields upfront and succeeded cleanly). "Sales Agent, set lead 2's status to Converted." → produced a real proposal (`Crm Update Lead`, Lead 2, Status Converted), confirmed → correctly refused by the real plugin validation layer: `"Validation error: Status can only be set by using the lead conversion action"`. The system-reserved status cannot be set directly, exactly as documented, and the refusal correctly pointed at the real mechanism (lead conversion) rather than silently accepting or vaguely failing.

---

### TC-CRX-021: CRM privacy visibility from a non-admin's chat session — flagged High

**User Role:** `luna.blossom` (non-admin, has full CRM permissions but is neither creator nor assignee of the target private record).
**Precondition:** A private contact/deal created by/assigned to a different user (e.g. `admin`), not `luna.blossom`.

**Steps:**
1. As `admin`, create a private contact/deal, not assigned to `luna.blossom`.
2. As `luna.blossom`, "Sales Agent, tell me about [that private contact/deal]."

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §3: "Privacy: non-admins see public records + own private + assigned private only." `luna.blossom`'s request must be honestly refused/scoped (the record excluded from her results), never leaked. **Flagged High** — the doc explicitly calls this the same permission-bypass defect class as BUG-CRX-003/BUG-CRX-012.

**Result: PASS — CONFIRMED LIVE 2026-09-17, all 3 legs**

As `admin`, created a private contact "Private Visibility Test Contact" (ID 5) via the native UI (`/contacts/new`, "Mark as Private" checked, Assigned To: Redmine Admin). Logged in as `luna.blossom` (has full CRM permissions, not the creator/assignee) and tested all 3 required legs (per `feedback_permission_tc_needs_ui_and_url_both_sides`):

1. **Positive UI absence**: `/contacts` list as `luna.blossom` shows only 3 rows (IDs 4, 2, 1) — the private contact is correctly excluded.
2. **Negative direct-URL**: navigating directly to `/contacts/5` as `luna.blossom` returned a real **403 Forbidden**.
3. **Chat leg (Sales Agent)**: "Sales Agent, tell me about the contact 'Private Visibility Test Contact'." → honest refusal: *"The search returned no results... This could mean: 1. The contact doesn't exist... 2. The contact may be private and hidden from your current view..."* — no leak, and it proactively named the real cause. Follow-up "show me contact ID 5's details" (direct ID probe) → also honestly refused: *"Contact ID 5 was not found... You don't have permission to view it — it may be marked private..."* — no leak by name search or by direct ID lookup.

All 3 legs correctly enforce the KB-documented privacy rule ("non-admins see public records + own private + assigned private only"). No bug — this is the correctly-behaving contrast case to BUG-CRX-003/012/022/023/024/025 (which all lack this exact check on their respective read tools).

---

### TC-CRX-022: Permission matrix — Sales Agent, no-domain-permission probe (temp-grant `daisy.skye`)

**User Role:** `daisy.skye`, temporarily granted `Use Ask Crux` only (baseline zero-permission user; `luna.blossom` already has full CRM access, so she cannot serve as the "no domain permission" subject for CRM).
**Precondition:** `daisy.skye`'s role temporarily granted `Use Ask Crux` (revert immediately after the probe — several existing bug repros, e.g. BUG-CRX-012, rely on her staying at zero Crux permissions as a documented baseline, per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`).

**Steps:**
1. Temporarily grant `daisy.skye`'s role `Use Ask Crux`.
2. As `daisy.skye`, "Sales Agent, show me the CRM pipeline."
3. Revert the temporary `Use Ask Crux` grant immediately after the probe.

**Expected Result:**
- Per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s 3-way framing: the agent should either (a) honestly refuse at the real CRM permission layer, (b) not silently succeed anyway, or (c) not fabricate a plausible-looking result without really checking. Record which of the 3 actually occurs.

**Result: PASS — CONFIRMED LIVE 2026-09-17**

As `daisy.skye` (temp-granted `Use Ask Crux` only, zero CRM permissions), "Sales Agent, show me the CRM pipeline." → real honest refusal: *"It looks like I don't have permission to access the CRM pipeline right now. Your Redmine administrator would need to grant you access to the CRM module with the appropriate role or permission... Check Administration → Roles and Permissions and ensure your role has the CRM permissions enabled (typically something like 'View CRM' or 'Manage CRM')."* Real Redmine-layer enforcement confirmed — outcome (a), no leak, no fabrication. Temporary grant reverted immediately after. Contrast documented in `docs/CRUX_AGENT_PERMISSION_MATRIX.md` — this is one of only 2 agents (with Invoicing) that correctly enforced permission on the first pass, vs. KB/QA/Budget agents which did not (see BUG-CRX-023/024/025).

NOT YET LIVE-VERIFIED — drafted from `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s planned-probe table (row: Sales Agent).

---

## Evidence Map

- Case IDs: TC-CRX-010 through TC-CRX-017 — all 8 executed, all reached a definitive verdict (5 PASS: 085, 086, 089, 090, 092; 2 FAIL: 087, 088)
- Screenshots: bugs only (none captured this suite — all evidence via live chat transcript text cross-checked against real UI pages).
- Log: —
- Bug reference: BUG-CRX-013 (#120664, TC-CRX-012, scope broadened 2026-09-16 via TC-CRX-014/091), BUG-CRX-014 (#120665, TC-CRX-011, reproduced again TC-CRX-013), BUG-CRX-015 (#120669, TC-CRX-013), BUG-CRX-016 (#120696, infra, found during 2026-09-16 session resume)
