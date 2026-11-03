# Bug Report Template

- Bug ID: BUG-CRX-137
- Production Redmine Issue ID:
- Title: Invoicing Agent's `create_invoice` can never genuinely link a line item to a real Redmine issue — the native "Invoice Issues" checkbox mechanism is unreachable via chat; "for issue #X" only ever produces a plain-text description mentioning the number
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Invoicing Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. Confirm the native "New Invoice" form has a genuine "Invoice Issues" section — a list of real, checkbox-
   selectable open issues in the project ("Please add invoice list of items:"), intended to let a user pull
   a real issue into the invoice as a genuinely-linked item.
2. As `admin`, Invoicing Agent pinned, fresh chat: "Create an invoice for the Crux Invoice Agent Test
   Project, client name 'Autumn Grace Co', client address '12 Market Street', client email
   buyer2@example.com, for issue #25, quantity 3, rate 150, user id 1."
3. Confirm the resulting invoice, then inspect it natively.

## Expected result

A line item explicitly tied to a real issue ("for issue #25") should result in the native "Invoice Issues"
checkbox for issue #25 being genuinely checked/linked on the created invoice — the same real association a
user gets by checking that box natively — not merely a text description that happens to mention the issue
number.

## Actual result

The confirm card correctly resolved `Client Name: Autumn Grace Co`, `Client Address: 12 Market Street`,
`Client Email: buyer2@example.com` (all three fields genuinely supported — positive finding), but the line
item itself was: `[{'description': 'Issue #25', 'quantity': 3, 'rate': 150, 'user_id': 1}]` — a plain-text
description string, not a real reference. Confirming created Invoice #4 (total $450, math correct for this
part). Native verification on `/invoices/4/edit`: the "Invoice Issues" checkbox for *"#25: DEF-2 fixture
issue - fallback rate test (Bug)"* is genuinely **unchecked** — no real link between this invoice and issue
#25 exists anywhere; the only trace is the word "Issue #25" inside a free-text Description field, which is
cosmetically similar but structurally meaningless (e.g. it won't show up in any report or query that looks
for invoices linked to a specific issue).

This is a real capability gap: the Invoicing Agent's `create_invoice` tool has no parameter for genuinely
attaching a real issue to a line item, only a free-text `description` field — the agent fakes the
appearance of an issue reference without the underlying structural link the native UI actually creates.

## Evidence

### Screenshot

![Invoice #4's Invoice Issues checkbox for #25 genuinely unchecked](../../screenshots/BUG-CRX-137/issue-not-genuinely-linked.png)

### Console / log

- Confirm card (verbatim): `Client Name: Autumn Grace Co`, `Client Address: 12 Market Street`, `Client
  Email: buyer2@example.com`, `Line Items: [{'description': 'Issue #25', 'quantity': 3, 'rate': 150,
  'user_id': 1}]`.
- Result (verbatim): *"✓ Invoice created: #4 — INV-2026-0004 for Autumn Grace Co (status: draft, total:
  450.0)"*.
- Native verification, `/invoices/4/edit`: Line item's own Description field genuinely reads just `"Issue
  #25"` (plain text). The "Invoice Issues" section's checkbox for `#25: DEF-2 fixture issue - fallback rate
  test (Bug)` is unchecked.

## Duplicate check

- Duplicate found: No. First finding on the Invoicing Agent's issue-linking capability. Distinct from
  BUG-CRX-136 (Discounts/Taxes gap, same session, same investigation) — a different native feature
  (issue-linked line items vs. discount/tax line items) with the same general root cause shape (a real
  native feature with no corresponding tool parameter, so the agent fakes a text-only approximation).
  **Positive finding in the same test, not a defect**: Client Name and Client Address are both genuinely
  supported fields, correctly resolved and persisted.
