# Test Cases — Redmineflux Crux — Sales Agent (CRM) Full CRUD (#117162)

> **⚠ TC-CRX-010 through TC-CRX-022 below are the historical record of the OLD Redmine 7.0.0 environment** (`C:/Crux-Redmine-Docker`, `localhost:3014`, crux-core 0.92.0). They have **not** been re-verified against the new Redmine 6 stack and are kept as-is for reference (bug discovery context, phrasing patterns that worked/failed). **Active retest work for the new Redmine 6 stack (`C:/crux-redmine`, `localhost:3015`) starts at TC-CRX-245 below** — moved out of `testcases/old_suites/` into this active file on 2026-10-12, per explicit user instruction, rather than creating a second file, so the CRM agent's full history lives in one place (the same convention already used for `BUG-CRX-*.md` retest sections).

## 2026-10-12 — New Redmine 6 cycle: scope, fixtures, and methodology

Read before writing/executing anything below: `docs/CRUX_REQUIREMENTS.md`/`CRUX_FEATURES_LIST.md` (Sales Agent rows), and the CRM plugin's own in-app documentation at `http://localhost:3015/crm/docs` (Version 7.0.0, commit `fb5359a`) — the latter is the authoritative, up-to-date source for every business rule referenced below (permissions table, protected stage/status values, lead-conversion mapping, deal-currency behavior, delete-cascade behavior, etc.). Citations below use `[docs §X]` to point at that page's section anchors.

**All testing in this cycle is performed through Crux (Ask Crux chat), not the native CRM UI** — the native UI is used only for (a) precondition/fixture setup where a clean starting state is needed, and (b) independent verification of what Crux's chat claims to have done. This matches the methodology already used for `CRUX_AGENT_PROJECT_MANAGER.md`.

### Permission model (from `[docs §Permissions]`)

CRM data and permissions are **global, not per-project** (except `link_crm_to_issues`, checked on the issue's own project) — a user who holds a role with a CRM permission in *any* project has that permission across the whole CRM. 10 permissions total: `view_crm` (gate for every CRM page/menu entry), `manage_leads`, `manage_contacts`, `manage_companies`, `manage_deals`, `view_pipeline`, `manage_crm_activities`, `delete_crm_data` (deletion is granted separately from "manage"), `view_audit_log`, `link_crm_to_issues`. **CRM Settings and `/crm/swagger` are restricted to Redmine administrators regardless of role** — no permission unlocks them for a non-admin.

### Fixtures created this session

- **Roles reconfigured** (`/roles`): **Manager** (role id 3) — all 10 CRM permissions checked (previously had none). **Reporter** (role id 5) — `Use Ask Crux` checked, all CRM permissions left unchecked (previously had neither).
- **New project**: `Crux CRM Agent Test Project` (identifier `crux-crm-agent-test-project`) — dedicated fixture project, mirroring the existing `Crux PM Agent Test Project` convention, so CRM's issue-linking tests (`link_crm_to_issues`, checked per-project) have a clean home that doesn't collide with the Project Manager suite's own fixtures.
- **Members added**: `luna.blossom` as **Manager** (→ full CRM access, all 10 permissions, globally) — the "with permission" user. `daisy.skye` as **Reporter** (→ `Use Ask Crux` only, zero CRM permissions, globally) — the "without permission" user, able to open an Ask Crux chat but with every CRM capability honestly gated.
- **Verified via native UI** (`/projects/crux-crm-agent-test-project/settings/members`): both memberships show the correct role. CRM data confirmed completely empty on this instance before any fixture work began (`/companies` → "No companies yet").

### 3-tier testing pattern for every CRUD operation below

1. **Admin** — baseline, should always succeed (admin bypasses role permissions entirely).
2. **`luna.blossom` (full CRM permission)** — should succeed identically to admin for every permission she holds (all 10).
3. **`daisy.skye` (zero CRM permission)** — should get an honest, correctly-scoped refusal naming the real missing permission (or a clean absence of the CRM menu/capability) — never a leak, never a silent success, and never a crash/stall.

### What to scrutinize on every single turn (explicit instruction this session)

- **Human-readable language**: does Crux's reply read like something a non-technical salesperson would understand, or does it leak raw tool/field/error internals? Flag anything that reads like a stack trace or an unexplained code/enum value.
- **Success and error message wording**: read every word, not just the headline. Check for the already-known defect shapes from the Project Manager suite — a misleading ✓ on a failure (BUG-CRX-054 pattern), a fabricated confirm card with no real buttons (BUG-CRX-020/056 pattern), a false "couldn't confirm whether this is available" denial for a tool that actually exists (BUG-CRX-061/062 pattern), a per-turn token-budget stall (BUG-CRX-060 pattern), or a hallucinated/wrong ID when the user only gave a name (stage, currency, company, contact — BUG-CRX-050/052 pattern, "deal stage" being the CRM-specific analogue of the Project Manager suite's "priority"/"category" find).


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

## Evidence Map (historical, 7.0.0 cycle)

- Case IDs: TC-CRX-010 through TC-CRX-017 — all 8 executed, all reached a definitive verdict (5 PASS: 085, 086, 089, 090, 092; 2 FAIL: 087, 088)
- Screenshots: bugs only (none captured this suite — all evidence via live chat transcript text cross-checked against real UI pages).
- Log: —
- Bug reference: BUG-CRX-013 (#120664, TC-CRX-012, scope broadened 2026-09-16 via TC-CRX-014/091), BUG-CRX-014 (#120665, TC-CRX-011, reproduced again TC-CRX-013), BUG-CRX-015 (#120669, TC-CRX-013), BUG-CRX-016 (#120696, infra, found during 2026-09-16 session resume)

---
---

# New Redmine 6 cycle (2026-10-12 onward) — TC-CRX-245+

> All TCs below run against `Crux CRM Agent Test Project` on `localhost:3015`, via Ask Crux chat, per the methodology and fixtures described at the top of this file.

## Leads — Create / Read / Update / Delete

---

### TC-CRX-245: Create a lead — admin, full-permission, and no-permission tiers

**User Role:** Admin; `luna.blossom` (full CRM); `daisy.skye` (zero CRM).
**Precondition:** None. Per `[docs §Leads]`, only First Name and Email are required.

**Steps:**
1. As admin, in Ask Crux: "Create a lead named Priya Sharma, email priya.sharma@acmecorp-crmtest.local, from Acme Corp, source Website."
2. As `luna.blossom`, same request with a distinct name/email.
3. As `daisy.skye`, same request with a distinct name/email.
4. For each, confirm (if a confirm card appears) and independently verify via native `/leads`.

**Expected Result:**
- Admin and `luna.blossom` (holds `manage_leads`): genuine confirm card naming every field exactly as given, confirms successfully, real lead row appears in `/leads` with exactly those fields, status "New".
- `daisy.skye` (lacks `manage_leads` and `view_crm`): an honest, human-readable refusal naming the real missing capability — never a fabricated success, never a crash, never the generic "couldn't confirm whether this is available" non-answer for a tool that genuinely requires a permission she's missing (that phrasing is only a bug when the tool exists and no permission issue is the real cause — here a real permission gate is the correct explanation, so the refusal should say so, not hedge).
- No new lead for the no-permission attempt in `/leads`.

**Result: PASS (core behavior correct), 2 new bugs found**

Evidence (2026-10-12):
- **Admin**: "Create a lead named Priya Sharma, email priya.sharma@acmecorp-crmtest.local, from Acme Corp, source Website." → genuine confirm card (`Crm Create Lead`, exact fields) → confirmed → "✓ Lead 'Priya Sharma' created (ID: 1)." Verified via `/leads`: row matches exactly.
- **`luna.blossom`** (full CRM): "Create a lead named Celeste Dawn, email celeste.dawn@novatech-crmtest.local, from Nova Tech, source Referral." → genuine confirm card, exact fields → confirmed → "✓ Lead 'Celeste Dawn' created (ID: 2)." Verified via `/leads`.
- **`daisy.skye`** (zero CRM): "Create a lead named Ember Lilac, email ember.lilac@testco-crmtest.local, from TestCo, source Cold Call." → Crux produced a genuine confirm card first (the agent doesn't pre-check permission before proposing — acceptable, consistent with how other entity types in the Project Manager suite behave) → on Confirm, the real permission layer correctly fired: `✓ Forbidden To fix this, ask your Redmineflux administrator to: ...` — **no lead was created** (verified via `/leads` as admin, still exactly 2 rows) — the permission enforcement itself is genuinely correct, no bypass.
- **2 new bugs found during this TC, neither a permission-bypass or data-integrity issue**:
  - **BUG-CRX-066** (Low-Medium): before even sending the message, `daisy.skye`'s agent-picker showed the raw internal slug "crm-sales" instead of "Sales Agent" — traced to `/crux/agents.json` returning 403 for her (she holds `Use Ask Crux` but not the separate `view_crux` permission) and the frontend falling back to the raw slug.
  - **BUG-CRX-067** (Medium): the genuine "Forbidden" refusal above is prefixed with a misleading ✓ checkmark — the same already-known-and-previously-fixed pattern as BUG-CRX-018 (this same Sales Agent, 7.0.0 cycle) and BUG-CRX-054 (Project Manager agent, fixed earlier today), now recurring on this specific agent/tool combination on the new stack.

---

### TC-CRX-246: Create a lead — missing required field, invalid email, duplicate email

**User Role:** Admin or `luna.blossom`.
**Precondition:** TC-CRX-245's lead(s) exist (for the duplicate-email check).

**Steps:**
1. "Create a lead with only the name John Smith, no email."
2. "Create a lead named Jane Doe with email 'not-an-email'."
3. "Create a lead named Priya Sharma 2 with email priya.sharma@acmecorp-crmtest.local" (same email as TC-245's lead — `[docs §Leads]`: each email can belong to only one lead).

**Expected Result:**
- All 3 should fail honestly — either caught before the confirm card (the agent asks for the missing/corrected field) or a real Redmine/plugin validation error on confirm — never a fabricated success, never silently dropping the conflicting field.

**Result: PASS — no bugs**

Evidence (2026-10-12, admin):
1. **Missing email**: confirm card correctly built with only First/Last Name (no Email row) — Confirm → honest failure: "Validation error: Email cannot be blank; Email is invalid" — no checkmark.
2. **Invalid email ('not-an-email')**: confirm card correctly carried the invalid value verbatim (no silent correction) — Confirm → honest failure: "Validation error: Email is invalid" — no checkmark.
3. **Duplicate email**: confirm card built normally (First: Priya, Last: "Sharma 2", Email: priya.sharma@acmecorp-crmtest.local) — Confirm → honest failure: "Validation error: Email has already been taken" — no checkmark.

Independently verified via `/leads`: still exactly 2 rows (Celeste Dawn, Priya Sharma) after all 3 attempts — no partial/duplicate/stray record created. All 3 failure messages were real, specific, and human-readable — no instance of the misleading-✓ pattern (BUG-CRX-067) on this TC's failure paths.

---

### TC-CRX-246b: Create a lead with a Source value not in the configured list

**User Role:** Admin.
**Precondition:** Confirmed via `/crm/settings` the real configured Lead Sources list: Website, Referral, Cold Call, Email Campaign, Social Media, Other.

**Steps:**
1. "Create a lead named Marigold Rayne, email marigold.rayne@testco2-crmtest.local, source TikTok Ad." ("TikTok Ad" is not a configured source.)

**Expected Result:** Per the same principle as the old suite's TC-CRX-017 (invalid deal stage) — the agent should catch the invalid value before proposing anything (ideally by actually checking the real configured list first), tell the user the real valid options, and not silently coerce or fabricate success.

**Result: PASS — excellent handling, no bug**

Evidence (2026-10-12, admin): Crux caught the invalid source **before building any confirm card** and replied: *"The lead source 'TikTok Ad' is not in the valid list. The available sources are:"* followed by the exact real list (Website, Referral, Cold Call, Email Campaign, Social Media, Other — matching `/crm/settings` exactly). It then went a step further than the minimum bar: *"'TikTok Ad' would fall under 'Social Media' since TikTok is a social media platform. Should I create the lead with source 'Social Media', or would you prefer a different source from the list?"* — a genuinely helpful, correct suggestion, still phrased as a question requiring the user's explicit choice rather than silently substituting. No confirm card was ever shown for the invalid value, and no lead was created with a bad or substituted source without asking first. This is a clean positive result — flagging it specifically because it's a good example of the kind of response quality this whole suite is checking for (human-readable, grounded in the real settings, no silent coercion).

---

### TC-CRX-247: Read / list / filter leads

**User Role:** Admin, `luna.blossom`, and `daisy.skye`.
**Precondition:** At least 2 leads with different statuses/sources exist.

**Steps:**
1. "List all leads."
2. "Show me leads with status New."
3. "Show me leads from source Website."
4. As `daisy.skye`: same 3 questions.

**Expected Result:**
- Admin/`luna.blossom` (both hold `view_crm`): accurate, grounded answers matching native `/leads` filters exactly — real names/emails/statuses, never invented rows, never silently dropping real ones.
- `daisy.skye` (lacks `view_crm`): honest refusal/empty — the CRM menu and every CRM read path should be consistently gated, not leaking record data through chat even though the UI itself would 403.

**Result: PASS — no bugs**

Evidence (2026-10-12):
- **Admin**: "List all leads." → correctly listed both real leads with exact Status/Company/Source (Celeste Dawn — New/Nova Tech/Referral; Priya Sharma — Contacted/Acme Corp/Website, status updated via native UI as a fixture step for this TC). "Show me leads with status New." → correctly returned only Celeste Dawn. "Show me leads from source Website." → correctly returned only Priya Sharma. All 3 grounded, zero invented/dropped rows.
- **`daisy.skye`** (zero CRM): all 3 identical questions correctly and honestly refused — "I don't have permission to list all leads..." / "You don't have permission to view leads in Redmineflux..." (×2) — no leak of either lead's data, consistent with her lacking `view_crm`.
- **Checked for BUG-CRX-067's checkmark pattern and ruled it out here**: the accessibility snapshot initially looked like it showed a `✓` on these refusals too, but a real screenshot of the rendered page shows the refusal text in plain black with no checkmark — the `✓` in the snapshot belonged to a separate, collapsed "Checked N things" tool-call disclosure, not the visible reply. Confirmed false positive and corrected in `BUG-CRX-067.md` — this TC's refusals are clean.

---

### TC-CRX-247b: Read — filter by company, filter/query by Assignee, direct by-name lookup

**User Role:** Admin.
**Precondition:** Celeste Dawn (#2) assigned to Redmine Admin via native UI (chat-driven assignment is blocked by BUG-CRX-068); Priya Sharma (#1) left unassigned.

**Steps:**
1. "Show me leads for company NovaTech Solutions."
2. "Which leads are assigned to admin?"
3. "Tell me about Priya Sharma." (direct by-name lookup, full profile)

**Expected Result:** All 3 should return accurate, correctly-filtered/grounded answers matching native ground truth — company filter returns only the real match, assignee filter returns only leads genuinely assigned to that user, direct-name lookup returns the real record's fields.

**Result: Step 1 PASS, Step 2 FAIL — BUG-CRX-068 Repro 3, Step 3 PASS**

Evidence (2026-10-12, admin):
1. **Company filter**: "Show me leads for company NovaTech Solutions." → correctly returned exactly 1 lead (Celeste Dawn), matching native ground truth. Clean.
2. **Assignee filter**: "Which leads are assigned to admin?" → **FAILED** — replied "You have 2 leads in the CRM: 1. Celeste Dawn... 2. Priya Sharma... Both leads are in the system." The filter was completely ignored; Priya Sharma (genuinely unassigned) was wrongly included, and the Assignee value was never even shown per-lead in the listing. Folded into **BUG-CRX-068 as Repro 3** — same root cause as the write-side finding (the agent doesn't model the Assigned To field's existence at all, on either read or write).
3. **Direct by-name lookup**: "Tell me about Priya Sharma." → correct, complete, human-readable full profile (Email, Company, Status, Source, Created date), plus a sensible contextual follow-up suggestion. Clean.

---

### TC-CRX-248: Update a lead — status transition rules (`[docs §Leads]` status table)

**User Role:** Admin or `luna.blossom`.
**Precondition:** A lead in status New.

**Steps:**
1. "Set lead [name]'s status to Contacted."
2. "Set lead [name]'s status to Converted" (direct, not via conversion — system-reserved per `[docs §Leads]`: "Set automatically by conversion. It cannot be selected by hand").
3. "Set lead [name]'s status to Qualified."

**Expected Result:**
- Step 1: genuine success, status genuinely Contacted on `/leads`.
- Step 2: honestly refused — real validation error naming the real reason (status is system-reserved), not a fabricated success and not a vague/generic denial.
- Step 3: genuine success, status genuinely Qualified (sets up TC-CRX-250's conversion precondition).

**Result: PASS — no bugs, 1 minor phrasing nitpick noted (not filed)**

Evidence (2026-10-12, admin, on lead #2 "Celeste Dawn"):
1. **New → Contacted**: genuine `Crm Update Lead` confirm card (Lead: 2, Status: Contacted) → confirmed → "✓ Lead #2 updated successfully." Verified via `/leads/2`'s own activity trail: "Status changed from 'New' to 'Contacted' by Redmine Admin."
2. **Contacted → Converted (direct)**: correctly refused **before any confirm card** — "'Converted' is not a valid lead status in the CRM. The valid lead statuses are: New, Contacted, Qualified, Unqualified" — then correctly offered the real alternative (set to Qualified, or use the separate `convert_lead` action) and asked which was intended. No write attempted, no fabricated success.
   - **Minor phrasing nitpick, not filed as a bug**: per `[docs §Leads]`, Converted *is* a real, valid status ("a system status and is always available"), just not one settable by hand — Crux's wording ("not a valid lead status") slightly overstates this (implies it doesn't exist at all, rather than "exists but is system-set-only"). The practical behavior is still correct (refuses the direct set, redirects to the real mechanism), so this doesn't reach the bar of a defect — captured here for awareness in case it compounds with something else later.
3. **Contacted → Qualified**: genuine confirm card (Lead: 2, Status: Qualified) → confirmed → "✓ Lead #2 updated successfully." Verified via `/leads/2`: Status now genuinely "Qualified," activity trail shows "Status changed from 'Contacted' to 'Qualified' by Redmine Admin." Sets up TC-CRX-250's conversion precondition.

---

### TC-CRX-248b: Update a lead — non-status fields, multi-field request in one message

**User Role:** Admin.
**Precondition:** An existing lead (Celeste Dawn, #2). Per `[docs §Contacts]`-equivalent lead form fields: First Name, Last Name, Email, Phone, Company Name, Source, Status, Assigned To, Notes are all independently editable.

**Steps:**
1. "For lead Celeste Dawn, update her phone to +1-555-0142, her company name to NovaTech Solutions, and assign her to admin." — 3 distinct field changes in one request.
2. Confirm.
3. Independently verify all 3 fields via `/leads/2`.

**Expected Result:** All 3 requested changes apply, or any that can't are explicitly disclosed — never a silent, undisclosed partial completion reported as a full, unqualified success.

**Result: FAIL — BUG-CRX-068**

Evidence (2026-10-12, admin): Confirm card showed only 2 of the 3 requested fields (`Phone: +1-555-0142`, `Company Name: NovaTech Solutions`) — **no `Assigned To` row, and no text anywhere disclosing that the assignment request was being skipped**. After Confirm: `✓ Lead #2 updated successfully.` — an unqualified success claim. Independently verified via `/leads/2`: Phone and Company Name genuinely updated (confirmed in the lead's own activity trail), but **Assigned To is still blank** — exactly as before, with zero record anywhere that it was ever requested. Filed as **BUG-CRX-068** (Medium-High) — a user has no way to know, without manually re-checking, that 1 of their 3 explicit requests silently never happened.

---

### TC-CRX-249: Delete a lead — permission-gated, converted-lead exception

**User Role:** Admin/`luna.blossom` (full) and `daisy.skye` (none).
**Precondition:** One disposable, unconverted lead; one already-converted lead (from TC-CRX-250, run this TC after it, or create a second disposable lead and convert it first).

**Steps:**
1. As `daisy.skye` (lacks `delete_crm_data`): "Delete lead [disposable name]."
2. As admin/`luna.blossom`: "Delete lead [disposable name]."
3. As admin/`luna.blossom`: "Delete the converted lead [converted name]" — per `[docs §Converting a lead]`: "A converted lead can no longer be converted again or deleted."

**Expected Result:**
- Step 1: honest refusal naming the real missing permission (`delete_crm_data` — note `manage_leads` alone is NOT enough per the permissions table, a useful distinction to verify Crux gets right rather than conflating "manage" and "delete").
- Step 2: genuine success, lead gone from `/leads`.
- Step 3: honestly refused with the real documented reason (converted leads are delete-protected), not silently succeeding and not a generic error.

**Result: PASS — all 3 steps, no bugs**

Evidence (2026-10-12): Created a disposable lead ("Disposable Test Lead", #3) via chat as admin first.
1. As `daisy.skye`: "Delete lead Disposable Test Lead." → honestly refused: *"I don't have permission to list or delete leads in this Redmineflux deployment... likely `delete_crm_data`..."* — correctly named the real, specific permission (not a vague generic denial).
2. As admin: same request → genuine `Crm Delete` confirm card (Entity Type: lead, Entity: 3) → confirmed → "✓ Lead #3 deleted." Verified via `/leads`: only Celeste Dawn and Priya Sharma remain, lead #3 genuinely gone.
3. As admin, after converting Celeste Dawn in TC-CRX-250: "Delete the converted lead Celeste Dawn." → genuine confirm card proposed, but on Confirm the real validation layer honestly refused: *"Validation error: Cannot delete a Converted lead (contact #1 was created from this lead). Convert leads are part of the audit trail."* Verified via `/leads/2`: lead still exists, genuinely protected.

---

## Lead Conversion

---

### TC-CRX-250: Convert a qualified lead — full conversion, with deal

**User Role:** Admin or `luna.blossom`.
**Precondition:** A lead in status Qualified with a company name set (from TC-CRX-248).

**Steps:**
1. "Convert lead [name] — create a deal too, called '[Deal Name]', amount $[X]."
2. Confirm.
3. Independently verify: new Contact exists with the lead's name/email; new Company exists (if the lead had a company name) or an existing one is reused, never duplicated (`[docs §Converting a lead]`); new Deal exists, linked to both, in the Default Currency; the lead's own page shows status Converted and a Conversion Results card.

**Expected Result:**
- All 3 new/reused records exist exactly as documented, no data loss, no duplicate company if one with that name already existed.

**Result: PASS — no bugs**

Evidence (2026-10-12, admin): "Convert lead Celeste Dawn — create a deal too, called 'NovaTech Solutions Rollout', amount $12000." → genuine `Crm Convert Lead` confirm card (Lead: 2, Create Deal: True, Deal Name: NovaTech Solutions Rollout, Deal Amount: 12000) → confirmed → "✓ Lead 'Celeste Dawn' (#2) converted to contact #1 and deal #1." Independently verified all 3 records:
- **Lead #2**: heading now "Celeste Dawn Converted", Status genuinely Converted, Conversion Results card present, activity trail logs "Status changed from 'Qualified' to 'Converted'" and "Lead converted to Contact 'Celeste Dawn' and Deal 'NovaTech Solutions Rollout'".
- **Contact #1**: exact name/email carried over from the lead, linked to Company "NovaTech Solutions".
- **Company**: only 1 "NovaTech Solutions" company exists on `/companies` — created fresh since none existed with that name before conversion (no duplicate).
- **Deal #1**: Amount USD 12,000.00, Stage New, Currency USD (Default), Contact Celeste Dawn, Company NovaTech Solutions — all exactly as requested, no data loss.

---

### TC-CRX-251: Convert a non-Qualified lead — refused

**User Role:** Admin or `luna.blossom`.
**Precondition:** A lead in status New or Contacted (not Qualified).

**Steps:**
1. "Convert lead [name]."

**Expected Result:**
- Honestly refused — per `[docs §FAQ]`, "Only leads with status Qualified can be converted" — real validation error, not a fabricated success, not silently auto-advancing the status to Qualified first.

**Result: PASS — no bugs, good UX**

Evidence (2026-10-12, admin): "Convert lead Priya Sharma." (status Contacted, not Qualified) → Crux proactively caught this **before building any confirm card**: *"Priya Sharma (lead #1) is in 'Contacted' status — not yet 'Qualified.' To convert her into a contact, the CRM plugin typically requires the lead to be in a Qualified state first. Would you like me to: 1. Update her status to 'Qualified' first, then convert... or 2. Attempt the conversion as-is..."* — honest, correct, and offered a sensible path forward without ever silently auto-advancing the status or fabricating success. Independently verified via `/leads/1`: still a plain "Priya Sharma" lead, no conversion occurred.

---

## Contacts — Create / Read / Update / Delete

---

### TC-CRX-252: Create a contact — admin, full-permission, no-permission tiers

**User Role:** Admin; `luna.blossom`; `daisy.skye`.
**Precondition:** None. Per `[docs §Contacts]`, First Name and Email required; a contact belongs to at most one company.

**Steps:**
1. As admin: "Create a contact named Celeste Dawn, email celeste.dawn@crmtest.local, job title Sales Director, company [a company from TC-CRX-250 or create one inline]."
2. As `luna.blossom`: same pattern, distinct contact.
3. As `daisy.skye`: same pattern.

**Expected Result:** Same 3-tier pattern as TC-CRX-245 — admin/`luna.blossom` succeed with exact fields, `daisy.skye` honestly refused (lacks `manage_contacts`).

**Result:** _execute and record here_

---

### TC-CRX-253: Update a contact — reassign company, mark private

**User Role:** Admin or `luna.blossom`.
**Precondition:** A contact and two companies.

**Steps:**
1. "Move contact [name] to company [other company]."
2. "Mark contact [name] as private, assigned to [some user]."
3. As a 3rd user who is neither the creator nor the assignee but DOES hold `view_crm` (if available) or as `daisy.skye`: "Tell me about contact [name]."

**Expected Result:**
- Steps 1-2 genuinely apply (verified via native `/contacts/<id>`, Visibility sidebar shows Private).
- Step 3: per `[docs §Record visibility]`, private records are visible only to creator/assignee/admins — a non-privileged viewer must get an honest "not found / may be private" refusal, never a leak of the private contact's details (same contrast case as the old suite's TC-CRX-021, now re-verified on Redmine 6).

**Result:** _execute and record here_

---

### TC-CRX-254: Delete a contact — cascade behavior (deals survive, unlinked)

**User Role:** Admin/`luna.blossom` (full) and `daisy.skye` (none).
**Precondition:** A disposable contact linked to at least one deal.

**Steps:**
1. As `daisy.skye`: "Delete contact [name]."
2. As admin/`luna.blossom`: "Delete contact [name]."
3. Independently verify the deal that was linked to this contact still exists, per `[docs §Deleting a contact]`: "Its deals are kept, but they are no longer linked to a contact."

**Expected Result:**
- Step 1 honestly refused (missing `delete_crm_data`).
- Step 2 genuinely succeeds; the linked deal is independently confirmed to still exist and now shows no contact — this is the specific data-integrity behavior worth checking (a wrong implementation might cascade-delete the deal, or leave a dangling/broken reference instead of cleanly unlinking it).

**Result:** _execute and record here_

---

## Companies — Create / Read / Update / Delete

---

### TC-CRX-255: Create a company — uniqueness, auto-https, admin/full/no-permission tiers

**User Role:** Admin; `luna.blossom`; `daisy.skye`.
**Precondition:** None. Per `[docs §Companies]`: Company Name required and must be unique; a website without `https://` gets it added automatically.

**Steps:**
1. As admin: "Create a company called Acme Dynamics, website acmedynamics-crmtest.local, industry Manufacturing."
2. Immediately retry with the exact same name — per `[docs §Companies]`, name must be unique.
3. As `luna.blossom`: a distinct company.
4. As `daisy.skye`: a distinct company.

**Expected Result:**
- Step 1: genuine success; the website field on `/companies/<id>` shows `https://acmedynamics-crmtest.local` (auto-prefixed), not the raw value typed.
- Step 2: honestly rejected as a duplicate (real validation error), not silently creating a second identical company.
- Steps 3-4: same 3-tier pattern as TC-CRX-245/252.

**Result:** _execute and record here_

---

### TC-CRX-256: Delete a company — cascade behavior (contacts/deals survive, unlinked)

**User Role:** Admin/`luna.blossom` (full) and `daisy.skye` (none).
**Precondition:** A disposable company with at least one contact and one deal attached.

**Steps:**
1. As `daisy.skye`: "Delete company [name]."
2. As admin/`luna.blossom`: "Delete company [name]."
3. Independently verify the attached contact and deal both still exist, per `[docs §Deleting a company]`: "Its contacts and deals are not deleted; they remain in the CRM without a company."

**Expected Result:** Same shape as TC-CRX-254 — honest refusal without permission, clean unlink (not cascade-delete, not a dangling reference) with it.

**Result:** _execute and record here_

---

## Deals — Create / Read / Update / Delete, Stage Rules, Currency

---

### TC-CRX-257: Create a deal — name uniqueness, currency is never user-settable

**User Role:** Admin; `luna.blossom`; `daisy.skye`.
**Precondition:** A contact and company from earlier TCs. Per `[docs §Deals]`: Deal Name required and unique; Currency field is read-only, always stamped with the Default Currency from Settings regardless of what's asked.

**Steps:**
1. As admin: "Create a deal called 'CRM Test Renewal', amount $25000, stage New, linked to contact [X] and company [Y], due date [+30 days]."
2. "Create a deal called 'CRM Test Renewal' worth $500 in EUR" (same name — uniqueness check; also deliberately asks for a different currency than the Default — per docs this should be silently ignored/stamped with Default, not honored).
3. As `luna.blossom`/`daisy.skye`: same 3-tier Create pattern.

**Expected Result:**
- Step 1: genuine success, correct fields, Currency shows the real configured Default Currency (not assumed — check Settings first).
- Step 2: honestly rejected for the duplicate name; separately, if a currency other than Default was requested anywhere in this TC, confirm Crux either declines to promise a non-default currency or honestly explains the currency is fixed by Settings — it must never claim to have set EUR when the real record will show the Default Currency (a believable but false claim, the deal-level analogue of BUG-CRX-052's wrong-field-resolution pattern).

**Result:** _execute and record here_

---

### TC-CRX-258: Move a deal to Won — automatic probability/closed-date behavior

**User Role:** Admin or `luna.blossom`.
**Precondition:** An open deal not yet Won/Lost.

**Steps:**
1. "Move deal [name] to Won."
2. Independently verify on `/deals/<id>`: probability automatically 100%, closed date automatically today (per `[docs §Closing a deal]`), **and that the deal can no longer be moved to another stage from the pipeline** (`[docs §Pipeline view]`: "Once a deal is Won or Lost, it can no longer be dragged to another stage on the board" — try "Move deal [name] back to New" via chat too, should be honestly refused or require an explicit edit path, not a silent success).

**Expected Result:** Automatic fields correct; the Won→other-stage block (if real) is honestly reported, not silently bypassed.

**Result:** _execute and record here_

---

### TC-CRX-259: Move a deal to Lost — Lost Reason mandatory (regression of old-suite TC-CRX-019, now with an actual confirm instead of Cancel)

**User Role:** Admin or `luna.blossom`.
**Precondition:** A second open deal.

**Steps:**
1. "Move deal [name] to Lost." (no reason given)
2. Supply a Lost Reason when asked.
3. Confirm this time (the old-suite TC-CRX-019 stopped at Cancel to protect a shared fixture — this is a disposable deal, so confirm through to completion).

**Expected Result:**
- Step 1: the agent must ask for Lost Reason before proposing/confirming — never silently move to Lost with a blank reason.
- Step 3: genuine success; `/deals/<id>` shows stage Lost, probability 0%, closed date today, and the Lost Reason text saved.

**Result:** _execute and record here_

---

### TC-CRX-260: Won/Lost stages and Qualified lead status cannot be renamed or removed (`[docs §Initial setup, Protected values]`)

**User Role:** Admin (Settings is admin-only).
**Precondition:** None.

**Steps:**
1. "Remove the Lost stage from CRM settings."
2. "Rename the Won stage to 'Closed-Won'."

**Expected Result:** Both honestly refused — per docs, Won/Lost (deal stages) and Qualified (lead status) are protected: "shown with a lock and cannot be removed or renamed." The agent should explain why, not silently drop the request or silently succeed against a protected value.

**Result:** _execute and record here_

---

### TC-CRX-261: Pipeline view — read requires `view_pipeline`, move requires `manage_deals` separately

**User Role:** `luna.blossom` (has both) and a 4th permission combination: temporarily grant a throwaway/seed user `view_crm` + `view_pipeline` only (NOT `manage_deals`), to test the split documented at `[docs §Pipeline view]`: "Viewing the board requires `view_pipeline`; moving cards also requires `manage_deals`."

**Steps:**
1. As the `view_pipeline`-only user: "Show me the deal pipeline." (should work — read-only)
2. Same user: "Move deal [name] to Proposal." (should be honestly refused — missing `manage_deals`)

**Expected Result:** Confirms Crux enforces this specific two-permission split correctly, not conflating "can view the pipeline" with "can move cards on it" — a distinction the chat interface could plausibly get wrong since both map to the same visual action from a user's perspective. Revert the temporary grant after this TC.

**Result:** _execute and record here_

---

## Activities, Audit Log, Settings

---

### TC-CRX-262: Log an activity — type-specific fields, author-only delete restriction (regression of old-suite TC-CRX-018)

**User Role:** Admin and `luna.blossom` (both hold `manage_crm_activities`).
**Precondition:** A contact or deal.

**Steps:**
1. As admin: "Log a call with [contact] about contract renewal, dated today."
2. As `luna.blossom`: "Delete the call activity admin just logged." — per `[docs §Activities and email]`: "You can delete your own activities; administrators can delete any" — `luna.blossom` is neither.

**Expected Result:** Step 1 succeeds, real activity on the record's timeline. Step 2 is honestly refused (authorship check) — re-verifies the old suite's TC-CRX-018 finding on the new stack, and specifically watch for BUG-CRX-018's previously-tracked misleading-✓-on-refusal pattern recurring here.

**Result:** _execute and record here_

---

### TC-CRX-263: Send an email activity — required fields, delivery status surfaced honestly

**User Role:** Admin or `luna.blossom`.
**Precondition:** A contact with a real email address.

**Steps:**
1. "Send an email to [contact] with subject 'Following up' and body 'Just checking in.'"
2. Check the activity timeline afterward.

**Expected Result:** Per `[docs §Activities and email]`, Subject/From/To are all required — the agent should ask if any are missing, not guess a From address. The timeline should honestly show Sent/Pending/Failed — if Redmine's own mail isn't configured on this instance, Failed is an acceptable, honestly-reported outcome; a fabricated "Sent" would not be.

**Result:** _execute and record here_

---

### TC-CRX-264: Audit Log — permission-gated, accurate

**User Role:** Admin/`luna.blossom` (hold `view_audit_log`) and `daisy.skye` (doesn't).
**Precondition:** A few activities logged from earlier TCs.

**Steps:**
1. As admin/`luna.blossom`: "Show me the CRM audit log for [contact/deal]."
2. As `daisy.skye`: same question.

**Expected Result:** Admin/`luna.blossom` get accurate entries matching `/crm_audit_logs`. `daisy.skye` is honestly refused (missing `view_audit_log`) — distinct permission from `view_crm`, worth confirming Crux doesn't conflate "can see CRM at all" with "can see the audit log."

**Result:** _execute and record here_

---

### TC-CRX-265: Settings — admin-only regardless of role permissions, read-before-append (regression of old-suite TC-CRX-015)

**User Role:** Admin, and `luna.blossom` (holds all 10 CRM role-permissions, but Settings is documented as admin-only "regardless of role configuration").

**Steps:**
1. As `luna.blossom`: "Add a new deal stage called 'Contract Review'."
2. As admin: same request.
3. Verify the full existing stage list is preserved plus the new one (settings_update replaces the whole list — the specific failure mode TC-CRX-015 was designed to catch).

**Expected Result:**
- Step 1: honestly refused — Settings genuinely requires Redmine admin, not just full CRM role-permissions; this is the one place in the whole CRM where "full permission" ≠ "can do everything," worth confirming Crux gets this subtlety right rather than assuming manage-everything implies settings access.
- Step 2: succeeds, full list preserved (not just the new value) — re-verifies TC-CRX-015's finding on the new stack.

**Result:** _execute and record here_

---

## Known-pattern regression sweep (cross-entity)

---

### TC-CRX-266: False-capability-denial sweep — one write op per entity, healthy MCP catalog confirmed first

**User Role:** Admin.
**Precondition:** Confirm the MCP tool catalog is healthy (`docker logs crux-redmine6-mcp-1`, expect 13/14 plugins, `crm` listed) before starting, per the BUG-CRX-061 lesson that a degraded catalog can produce a confounded false-denial-looking result.

**Steps:** In fresh chats, one write op per entity type not already covered by a Create/Update/Delete TC above: update a deal's territory, update a company's industry, update a lead's source.

**Expected Result:** Each either succeeds with a genuine confirm card, or is honestly refused for a real, checkable reason (permission, validation) — never the generic "I couldn't find a tool for this here" / "couldn't confirm whether this action is actually available" text for an operation whose underlying tool actually exists (per the CRM plugin's own REST API table in `[docs §REST API]`: Contacts/Companies/Deals/Leads all get "Full CRUD").

**Result:** _execute and record here_

---

### TC-CRX-267: Misleading-checkmark sweep — force a few known failure conditions per entity

**User Role:** Admin.
**Precondition:** None specific — deliberately trigger failures (duplicate name, invalid email, protected-value edit) already exercised in TC-CRX-246/255/260.

**Steps:** Re-read each of those TCs' failure-path replies specifically for a leading ✓ (or any success-looking glyph/color) on text that is actually reporting a failure.

**Expected Result:** No instance of a checkmark (or equivalent) prefixing a failure message, anywhere in this suite's failure-path replies — the BUG-CRX-054 pattern, not yet seen on the CRM agent, should be actively hunted for rather than assumed absent.

**Result:** _execute and record here_

---

## Evidence Map (2026-10-12 cycle)

- Case IDs: TC-CRX-245 through TC-CRX-267 — drafted, not yet executed.
- Fixtures: `Crux CRM Agent Test Project` (new), Manager role (CRM-permission-complete), Reporter role (`Use Ask Crux` only), `luna.blossom` (full CRM), `daisy.skye` (zero CRM).
- Next step: execute in order, filing a `BUG-CRX-0NN` for each confirmed defect per `CLAUDE.md` §5, cross-referencing the Project Manager suite's bug numbers wherever the same systemic pattern recurs (false denial, fabricated confirm, misleading checkmark, token-budget stall, wrong/hallucinated ID resolution).
