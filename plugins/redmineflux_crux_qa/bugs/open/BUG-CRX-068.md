# Bug Report Template

- Bug ID: BUG-CRX-068
- Production Redmine Issue ID: <!-- fill after report_defect/create_issue is approved and executed -->
- Title: A multi-field lead update silently drops one of the requested fields (Assigned To) with zero disclosure anywhere — confirm card never mentions it, final "updated successfully" message doesn't flag it as skipped
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Sales Agent)
- Plugin version: 0.62.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-12

## Steps to reproduce

1. As admin, on an existing lead (e.g. "Celeste Dawn", lead #2), in Ask Crux (Sales Agent): "For lead Celeste Dawn, update her phone to +1-555-0142, her company name to NovaTech Solutions, and assign her to admin." — three distinct field changes requested in one message.
2. Observe the resulting `Crm Update Lead` confirm card's detail table.
3. Click Confirm.
4. Observe the final success message.
5. Independently verify via native UI (`/leads/2`): check all 3 fields — Phone, Company Name, and Assigned To.

## Expected result

- Either all 3 requested field changes appear in the confirm card and are genuinely applied, or — if one of them can't be fulfilled for some real reason (ambiguous "admin" resolution, a permission gap, etc.) — the agent should say so explicitly, either before building the confirm card (asking for clarification) or in its reply alongside the proposal, so the user knows exactly which of their 3 requests will and won't take effect. Silently dropping a requested field with no mention anywhere is the one outcome that must never happen.

## Actual result

- The confirm card's detail table showed only 2 rows: `Phone: +1-555-0142` and `Company Name: NovaTech Solutions`. **No "Assigned To" row at all**, and no text anywhere in the reply — before or after the table — acknowledging that the assignment request was being skipped, deferred, or needed clarification.
- After Confirm, the final message read: **"✓ Lead #2 updated successfully."** — an unqualified success claim with no caveat, despite only 2 of the 3 requested changes actually being included in the write.
- Independently verified via `/leads/2`: Phone and Company Name are genuinely updated (confirmed via the lead's own activity trail: `Lead updated by Redmine Admin Phone: "—" → "+1-555-0142" Company Name: "Nova Tech" → "NovaTech Solutions"`) — but **Assigned To is still blank ("—")**, exactly as it was before the request. The activity trail itself only logs the 2 fields that were actually changed, with no record anywhere (chat or audit trail) that an assignment was ever requested.
- A user reading "✓ Lead #2 updated successfully." after asking for 3 specific changes has no way to know — without manually re-checking the record themselves — that 1 of the 3 never happened. This is a trust/completeness defect: the chat's own success claim is accurate only for a strict subset of what was actually asked, and nothing in the reply discloses the gap.

## Evidence

### Screenshot

![Confirm card shows only Phone and Company Name — no Assigned To row, no mention of skipping it](../../screenshots/BUG-CRX-068/confirm-card-missing-assigned-to.png)
![Native UI confirms Assigned To is still blank after the "updated successfully" message](../../screenshots/BUG-CRX-068/native-assigned-to-still-blank.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-068/retest-yyyy-mm-dd-pass.png)

### Console / log

- Confirm card table (captured via accessibility snapshot): `Lead: 2`, `Phone: +1-555-0142`, `Company Name: NovaTech Solutions` — no `Assigned To` row.
- Final reply: `✓ Lead #2 updated successfully.`
- Native UI (`/leads/2`) activity trail: `Lead updated by Redmine Admin Phone: "—" → "+1-555-0142" Company Name: "Nova Tech" → "NovaTech Solutions"` — Assigned To not mentioned because it was never part of the actual write.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Distinct from the false-capability-denial family (BUG-CRX-029/032/034/050/061/062/066/067) — those are about the agent wrongly claiming a capability doesn't exist; this is about a capability that genuinely works (Assigned To is a real, editable field on this same form) being silently omitted from a multi-field proposal with the overall write still reported as fully, unqualifiedly successful. Also distinct from BUG-CRX-052 (wrong/hallucinated field *values* on `create_issue`) — this is a field being dropped entirely, not mis-resolved.
