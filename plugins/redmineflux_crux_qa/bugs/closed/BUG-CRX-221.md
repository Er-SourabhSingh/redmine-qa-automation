# Bug Report Template

- Bug ID: BUG-CRX-221
- Production Redmine Issue ID: #129141
- Title: A multi-step "create contact at a not-yet-existing company" plan guesses the new company's future ID (predicted #3) one higher than what it actually becomes (#2), causing step 2 to fail with "Company #3 not found"
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_crux (Sales/CRM Agent)
- Plugin version: crux-core 1.16.0, mcp 1.0.13
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-19

## Steps to reproduce

1. In a project whose CRM company list currently has exactly 1 real company (id=1), ask the Sales/CRM Agent in
   one message: "Create a contact named X at [a company name that doesn't exist yet]."
2. The agent correctly proposes a 2-step plan: step 1 `CRM Create Company`, step 2 `CRM Create Contact` with
   `Company: <predicted id>`.
3. Confirm the combined card.

## Expected result

- Step 1 creates the company and gets a real id (in this repro, the actual next id was 2, since only id=1
  existed before). Step 2 should use THAT real id to link the contact, succeeding cleanly in the same
  confirmed action, per the agent's own "I'll do 2 things" one-shot batching promise.

## Actual result

- Step 1 succeeded: `✓ Company 'Regression Test Co.' created (ID: 2)`.
- Step 2 failed: `Step 2 failed: Validation error: Company #3 not found. Use list_companies to find valid
  IDs.` — the plan had pre-computed the contact's `Company` field as `3` (one higher than the real new id, 2)
  *before* step 1 actually ran, instead of using step 1's real returned id for step 2's payload.
- The company itself was genuinely created and is usable (confirmed via `list_companies`); only the
  same-turn contact linkage failed. No silent false success — the step-2 failure message was honest and
  specific.
- Recovering required a separate follow-up message re-resolving the company by name (which correctly found
  id=2 this time) and a fresh single-step contact creation — the one-shot "I'll do 2 things" promise did not
  hold for this trigger path.

## Evidence

### Console / log

- Full chat transcript excerpt (session `ses-554`): *"I'll do 2 things — confirm? ... Created 1 of 2 / ✓
  Company 'Regression Test Co.' created (ID: 2). / Step 2 failed: Validation error: Company #3 not found. Use
  list_companies to find valid IDs."*
- Native-verify: `redmineflux_crm_list_companies` showed exactly one company, id=2, "Regression Test Co." —
  confirming the real id was 2, not the 3 the plan had assumed.

## Status: CLOSED 2026-11-20 — CONFIRMED FIXED

- Fixed by CRC-123 (crux-core 1.17.0): `_confirm_batch` now remembers the real id each created step made, by
  entity, and replaces a later step's guessed id (when it's above the real one) with the real one.
- Retested on the rebuilt stack (crux-core 1.17.0): CRM Agent, "Create a contact named Rohan Das at
  Retest-221C Logistics." — batch card correctly showed "I'll do 2 things." Step 1 created company
  "Retest-221C Logistics" (real id 6). Step 2's confirm card for Create Contact correctly showed `Company: 6`
  (the real id, not a guess) — retried with an email field (step 2 had separately failed only on a missing
  email, unrelated to the id-guessing bug) and the contact was created linked to company 6.
- Native-verified: `redmineflux_crm_list_contacts(company_id=6)` → "Rohan Das - rohan.das@retest221c.example -
  @ Retest-221C Logistics" — real id used correctly end to end, no guessed-id mismatch.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (same general class as BUG-CRX-018's "broken ID contract" family,
  but a new trigger path: a same-turn multi-step plan referencing its OWN step's not-yet-created entity by a
  guessed id instead of a placeholder/real id)
