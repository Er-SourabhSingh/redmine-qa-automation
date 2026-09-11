# Test Cases — Redmineflux Crux — Invoicing Agent (Invoice) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/invoice-billing.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key. Write now, execute once a key is added. **Financial effects — use clearly-marked test customers/invoices only, and confirm `send_invoice` never actually reaches a real customer inbox during testing (verify the "customer" used is a QA-controlled test address).**

## Plugin
- Name: redmineflux_crux (Invoicing Agent, Invoice plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-127: Read surface — dashboard, customers, invoices, team rates, time report

**User Role:** Logged-in user with `use_ask_crux` and Invoice plugin access.
**Precondition:** Invoice plugin installed with real customers/invoices.

**Steps:**
1. "What invoices are outstanding for customer [X]?"
2. "Show me project [Y]'s invoice history."
3. "What are our current team rates?"
4. "What's the time report tied to invoice [N]?"

**Expected Result:**
- Each grounded in a real tool call, citing real customer/invoice/rate figures.

---

### TC-CRX-128: Create a customer, generate an invoice from logged effort, record a payment

**User Role:** Same as TC-CRX-127.
**Precondition:** A test project with logged time.

**Steps:**
1. "Create a customer called [Test Customer QA]."
2. "Generate an invoice for [Test Customer QA] from project [Y]'s logged time."
3. "Record a payment of $[amount] against invoice #[N]."
4. Confirm each; verify amounts/records match exactly.

**Expected Result:**
- Every amount/customer/invoice named precisely — no rounded/guessed figures at any step (explicit spec rule). The generated invoice reflects real logged effort, not an invented total.

---

### TC-CRX-129: Send an invoice — real communication effect, explicit intent required

**User Role:** Same as TC-CRX-127.
**Precondition:** A draft test invoice; a QA-controlled test customer email.

**Steps:**
1. "Send invoice #[N] to the customer."
2. Review the confirm card for the exact invoice and recipient.
3. Confirm.
4. Verify the email actually sends (to the QA-controlled test address) — never before Confirm.

**Expected Result:**
- No email sends before Confirm. After Confirm, exactly one email sends to the correct customer address — verify no accidental send to a real customer.

---

### TC-CRX-130: Team rates — set, update, bulk-update, delete

**User Role:** Same as TC-CRX-127.
**Precondition:** None.

**Steps:**
1. "Set the rate for team [X] to $[rate]/hr."
2. "Update it to $[new rate]/hr."
3. "Bulk-update rates for teams [X] and [Y] to $[rate]."
4. "Delete the rate for team [X]."

**Expected Result:**
- Each write targets exactly the named team/role and rate — no unintended teams affected by the bulk update.

---

### TC-CRX-131: PDF link — path only, never raw bytes

**User Role:** Same as TC-CRX-127.
**Precondition:** An existing invoice.

**Steps:**
1. "Get me the PDF for invoice #[N]."

**Expected Result:**
- The agent returns a download path/link and tells the user to open it in a browser logged into Redmine — it does NOT claim to paste the PDF content inline (a text-only tool channel can't carry binary, per its own spec).

---

## Negative Cases

---

### TC-CRX-132: Delete (customer/invoice/payment/rate) and send both require the specific record/explicit intent named

**User Role:** Same as TC-CRX-127.
**Precondition:** None.

**Steps:**
1. Ask vaguely, e.g. "clean up old invoices" or "let the customer know about their balance."

**Expected Result:**
- Neither a delete proposal nor a `send_invoice` proposal is generated from a vague ask — both require the user to have named the specific record / explicitly intended to send now, per the agent's own rules.

---

## Evidence Map

- Case IDs: TC-CRX-127 through TC-CRX-132
- Screenshots: bugs only.
- Log: —
- Bug reference: —
