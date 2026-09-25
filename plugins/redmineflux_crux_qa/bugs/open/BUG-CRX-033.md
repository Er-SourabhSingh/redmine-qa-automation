# Bug Report Template

- Bug ID: BUG-CRX-033
- Production Redmine Issue ID: #121331
- Title: Invoicing Agent's writes to an already-Sent invoice genuinely persist — the documented Draft-only-editable business rule is not enforced server-side at all; also no Invoice History "Updated" entry is created
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Invoicing Agent, Invoice plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-25

## Steps to reproduce

1. Use the same real invoice fixture as BUG-CRX-028 (invoice #1, INV-2026-0001, genuinely in **Sent** status, confirmed via the UI: "Edit"/"Send Invoice" links absent, "Add Payment" present instead; Invoice History shows a real "✉ Email Sent" entry).
2. In an Ask Crux session, ask the Invoicing Agent: "Invoicing Agent, update invoice #1's due date to 2026-11-01."
3. Answer the clarifying project question ("Project crux-qa.").
4. A real "Proposal: Update Invoice #1" card renders (2 real Confirm/Cancel buttons — this part is fixed since the original BUG-CRX-028 finding), explicitly showing Current status: SENT.
5. Click Confirm.
6. Reload `/invoices/1` and check the real Due Date field and Invoice History panel.

## Expected result

Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "Only invoices in Draft status are editable" (Draft → Sent → Paid → Cancelled, editing locked after Sent). Since the proposal card itself explicitly discloses "Current status: SENT," the write must be honestly **refused**, citing the Draft-only rule — the confirm action should never actually change a Sent invoice's fields.

## Actual result

Clicking Confirm returned: `"✓ Invoice #1 updated — INV-2026-0001 for Sent Lockout Test Customer status:sent total:250.0"`.

**Verified against the real record**: reloaded `/invoices/1` — the Due Date field **genuinely changed to 11/01/2026** (not a fabricated claim; a real, persisted write happened on a Sent invoice). The invoice's status is still clearly "Sent," so the Draft-only-editable rule was silently bypassed entirely rather than enforced or even disclosed as bypassed.

Additionally, the Invoice History panel still shows only "Created" and "Email Sent" entries — **no "Updated" entry was added** despite the real field change, a separate audit-trail gap alongside the missing business-rule enforcement.

This was discovered while retesting BUG-CRX-028 on 2026-09-25: that bug's own original defect (a *fabricated* success claim on a write that never actually persisted) is now fixed — but fixing the fabrication exposed that the underlying write was never actually guarded by the Draft-only-editable rule in the first place.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and the real `/invoices/1` page (Due Date field showing 11/01/2026, Invoice History panel showing only Created + Email Sent).

### Console / log

```
C (admin): Invoicing Agent, update invoice #1's due date to 2026-11-01.
-> asking the Invoicing Agent...
I need to know which project this invoice belongs to so I can update it. Could you provide
the project identifier or name (e.g., "crux-qa")?

C: Project crux-qa.
-> asking the Invoicing Agent...
Proposal: Update Invoice #1 (INV-2026-0001)
- Current status: SENT
- Current due date: 2026-10-17
- New due date: 2026-11-01
[2 real Confirm/Cancel buttons -- DOM-verified]

[Confirm clicked]
-> "✓ Invoice #1 updated -- INV-2026-0001 for Sent Lockout Test Customer status:sent total:250.0"

[Verification: reloaded /invoices/1 -- real Due Date field now genuinely reads "11/01/2026";
 real Invoice History still shows only "Created" + "Email Sent", no "Updated" entry despite
 the real change]
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — Directly descends from BUG-CRX-028 (fabricated "✓ updated successfully" claim on a Sent invoice, zero real button, write never actually persisted — that specific defect is FIXED as of 2026-09-25). This is a different, newly-exposed defect: now that the fabrication is fixed and the write is real, the write itself was never actually gated by the Draft-only-editable business rule at all. Per standard retest-scope discipline, this gets its own bug rather than reopening BUG-CRX-028.

## Production report

Reported to production as issue **#121331** (`ztflux`, Tracker Bug, Priority High, Defect Severity High-severity, Defect priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-25. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase #120496 (`CRUX_AGENT_INVOICE_BILLING.md`), Environment "Window 11 + Chrome" — testcase marked Failed.
