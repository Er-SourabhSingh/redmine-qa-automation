# Bug Report Template

- Bug ID: BUG-CRX-070
- Production Redmine Issue ID: <!-- fill after report_defect/create_issue is approved and executed -->
- Title: Recurrence of the historical, already-fixed self-contradiction pattern (BUG-CRX-013, closed 2026-09-25 on the Redmine 7.0.0 stack) on the Sales Agent's Delete Contact path — deleting a contact by name produces "I described a change without actually proposing it," 2/2, while the identical request by numeric ID works correctly
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Sales Agent)
- Plugin version: 0.62.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-12

## Steps to reproduce

1. As admin, with an existing contact named "Disposable Contact Test" (ID 4), in Ask Crux (Sales Agent): "Delete contact Disposable Contact Test."
2. Observe the reply.
3. Retry with slightly different phrasing: "Please delete the contact named Disposable Contact Test."
4. Observe the reply.
5. Retry again, this time with the contact's numeric ID instead of its name: "Delete contact ID 4."
6. Observe the reply and confirm if a genuine confirm card appears.

## Expected result

- A delete-by-name request should resolve to the same real contact and produce a genuine `Crm Delete` confirm card — the same outcome the identical request produces when phrased with the numeric ID instead. Name resolution should not change whether the agent believes it has "actually proposed" an action.

## Actual result

- **Attempts 1 and 2** (by name, two different phrasings): both produced the **exact same, word-for-word** self-contradictory non-answer: *"I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."* No confirm card, no Confirm/Cancel buttons — the agent describes itself as having failed to propose anything, without explaining why, and without ever actually attempting to resolve "Disposable Contact Test" to a contact id.
- **Attempt 3** (by numeric ID): immediately produced a genuine `Crm Delete` confirm card (Entity Type: contact, Entity: 4) → confirmed → **"✓ Contact 'Disposable Contact Test' (#4) deleted. ⚠️ Linked records orphaned: 1 deal(s)."** — a fully genuine, correctly-executed delete, with a notably good proactive disclosure of the orphaned deal.
- This is a **recurrence of the historical BUG-CRX-013 pattern** (first found and fixed 2026-09-25 on the old Redmine 7.0.0 stack, originally on `update_deal_stage`/lead-status-update/delete-by-name paths across the CRM domain) — the exact same literal self-contradiction sentence, the exact same shape (name-based request silently fails to resolve into a proposal; ID-based request works immediately), now observed on the new Redmine 6 stack's Contact-delete path specifically. Since BUG-CRX-013 was fixed and closed against the *old* codebase/environment, and this is the *first* time Contact deletion has been exercised via chat on the new stack, this suggests either (a) the original fix didn't fully generalize to this trigger path, or (b) something in the new build/environment reintroduced the underlying defect.

## Evidence

### Screenshot

![ID-based retry succeeds immediately, with a proactive orphaned-deal disclosure](../../screenshots/BUG-CRX-070/id-based-retry-succeeds-with-orphan-disclosure.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-070/retest-yyyy-mm-dd-pass.png)

### Console / log

- Attempt 1 exact reply (captured via accessibility snapshot): "I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."
- Attempt 2 (different phrasing, "Please delete the contact named..."): identical reply, word-for-word.
- Attempt 3 (by ID): "I'll do this (Crm Delete) — confirm?" with a real detail table (Entity Type: contact, Entity: 4) and real Confirm/Cancel buttons. Confirmed → "✓ Contact 'Disposable Contact Test' (#4) deleted. ⚠️ Linked records orphaned: 1 deal(s)." — genuine, independently verified via `/deals/2` (the linked deal survives, Contact field cleared to "—", not cascade-deleted).

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Same defect **shape** as the already-closed **BUG-CRX-013** (self-contradiction pattern, first found on `update_deal_stage`/lead-status-update/delete-by-name across multiple CRM actions on the old 7.0.0 stack) — filed as a new bug since it's recurring on the new Redmine 6 stack and a trigger path (Contact delete specifically) not previously covered by that fix's own verification scope, per the repo's own precedent for recurrences on new environments/trigger paths (BUG-CRX-027/028 handled the same way for BUG-CRX-020's pattern). Not a duplicate of the false-capability-denial family (BUG-CRX-029/032/034/050/061/062/066/067/068/069) — those are confident false claims about missing capabilities; this is the agent claiming its own turn failed to produce a proposal when a proposal should have been producible from the same data, with no false claim about the CRM's capabilities themselves.
