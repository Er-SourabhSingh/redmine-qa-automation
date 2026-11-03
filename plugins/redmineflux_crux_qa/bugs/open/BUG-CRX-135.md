# Bug Report Template

- Bug ID: BUG-CRX-135
- Production Redmine Issue ID:
- Title: Invoicing Agent (and the native plugin's own `destroy` action) can delete a Sent/Paid invoice with zero status check or warning — directly inconsistent with the same invoice's `update` path, which correctly refuses to edit anything but Draft
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Invoicing Agent) / redmineflux_invoice (native plugin, root cause)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. As `admin`, create and send a real invoice (Draft → Sent) for the Crux Invoice Agent Test Project — e.g.
   invoice #1, INV-2026-0001, tax 15%... total $220, client test@example.com, status Sent.
2. Confirm this invoice's lifecycle protection is real: ask the Invoicing Agent to update it (e.g. "change
   the tax rate to 15%") — correctly refused: *"Validation error: Only draft invoices can be edited (this
   invoice is sent)."*
3. Immediately after, in the same chat: "Delete invoice #1 for the Crux Invoice Agent Test Project."

## Expected result

Since `update` explicitly enforces "only Draft invoices can be edited," a user would reasonably expect
`delete` to carry an equivalent protection (or at minimum a confirmation warning) for a Sent/Paid invoice —
these are real financial records with a client-facing email already sent, not disposable drafts.

## Actual result

The delete confirm card showed only `Project` and `Invoice: 1` — no mention anywhere that the invoice is
Sent, not Draft, and no warning of any kind. Confirming it returned: *"✓ Invoice #1 deleted successfully from
project #10."* Native verification on `/invoices?project_id=crux-invoice-agent-test-project` confirms the
invoice is genuinely gone — "No invoices found." The real, Sent invoice (with genuine line items, 15% tax,
and a client email it had already been sent to) was permanently deleted with zero warning, moments after the
same invoice's Update path correctly refused for the identical non-Draft status.

Root-caused via source review (`global_invoices_controller.rb`'s `destroy` action) — confirmed to have **no
status check at all**, unlike `update`'s explicit Draft-only guard. The MCP tool's own docstring reportedly
nudges callers to "consider cancelling instead," but this is advisory text only — nothing in the actual
tool or controller enforces it.

## Evidence

### Console / log

- Update attempt (moments earlier, same chat, same invoice): *"Validation error: Only draft invoices can be
  edited (this invoice is sent) Correct the value(s) above and try again."*
- Delete confirm card (verbatim structure): `Project: Crux Invoice Agent Test Project`, `Invoice: 1` — no
  status/warning field.
- Delete result (verbatim): *"✓ Invoice #1 deleted successfully from project #10."*
- Native verification: `/invoices?project_id=crux-invoice-agent-test-project` shows "No invoices found"
  immediately after.

## Duplicate check

- Duplicate found: No. First finding on the Invoicing Agent / `redmineflux_invoice` plugin's lifecycle
  enforcement. Shares the general "a write-path lifecycle rule isn't consistently enforced across sibling
  actions" shape seen elsewhere in this QA cycle (e.g. BUG-CRX-033's original Draft-only-editable gap before
  it was fixed), but this is the first instance for the Delete action specifically on this plugin.
