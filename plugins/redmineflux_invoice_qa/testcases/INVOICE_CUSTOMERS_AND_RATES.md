# Test Cases — Redmineflux Invoice — Customers, Project Billing Settings & Team Rates

> Source: vendor KB — "How to Create a Customer", "How to Edit or Deactivate a Customer",
> "How to Configure Project Billing Settings", "How to Set Team Rates (Per-User Rates)", FAQ Q4, Q6, Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Invoice Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_invoice_qa

## Navigation methodology

Top navigation → **Customer** for the global database; Project → **Invoice** tab → **Settings** / **Team Rates**
for project billing. Do not type URLs.

> **Rates are the multiplier on every invoice.** A wrong rate produces a wrong bill to a paying client, and the
> invoice looks entirely normal. Every rate case below ends by checking the figure that actually reaches a line
> item, not just that the field saved.

---

## Functional Cases — Customers

---

### TC-INV-001: Create a customer

**User Role:** User with `manage_customers`
**Priority:** High
**Steps:**
1. Customer tab → **New Customer** → name, company, email, phone, address, tax ID → Save.

**Expected Result:**
- The customer is created and listed with all entered values intact.

---

### TC-INV-002: Customer details appear on the invoice

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Link the customer to a project and generate an invoice; view it on screen, in the PDF and in the email.

**Expected Result:**
- The customer's name, company, address and tax ID appear correctly in all three renderings.
- **The tax ID is a legal identifier on a financial document** — verify it exactly rather than at a glance.

---

### TC-INV-003: Edit a customer

**User Role:** User with `manage_customers`
**Priority:** Medium
**Steps:**
1. Change the customer's address and email; Save.
2. Open an **already-sent** invoice for that customer.

**Expected Result:**
- The customer record updates.
- **Record whether the already-sent invoice changes.** A sent invoice is a locked, issued document; if editing a
  customer retroactively alters it, the copy the client holds and the copy in Redmine no longer agree — a genuine
  accounting defect. The vendor documents invoices as immutable once sent, so this is a real risk worth pinning
  down.

---

### TC-INV-004: Customer email drives invoice delivery

**User Role:** Manager
**Priority:** High
**Steps:**
1. Change the customer's email, then send an invoice.

**Expected Result:**
- The email goes to the current address. **Confirm the recipient explicitly** — sending a client's invoice to the
  wrong address is both a billing failure and a data disclosure, and it cannot be undone.

---

### TC-INV-005: Customer list and search

**User Role:** User with `manage_customers`
**Priority:** Low
**Steps:**
1. With several customers, use the list and any search or filter.

**Expected Result:**
- All customers are listed and searching narrows correctly.

---

### TC-INV-006: Delete an unlinked customer

**User Role:** User with `manage_customers`
**Priority:** Medium
**Steps:**
1. Create a customer linked to no project and delete it.

**Expected Result:**
- Deleted cleanly.

---

### TC-INV-007: Deactivate a customer

**User Role:** User with `manage_customers`
**Priority:** Medium
**Steps:**
1. Open the customer → Edit → set status **Inactive** → Save.
2. Attempt to select it as a project's billing customer.
3. Check an existing invoice for that customer.

**Expected Result:**
- The customer is marked inactive and is not offered for new links.
- **Existing invoices are unaffected** — deactivation is the documented alternative to deletion precisely so that
  history survives.

---

### TC-INV-008: Reactivate a customer

**User Role:** User with `manage_customers`
**Priority:** Low
**Steps:**
1. Set the status back to active.

**Expected Result:**
- The customer is selectable again with all details intact.

---

### TC-INV-009: A linked customer cannot be deleted

**User Role:** User with `manage_customers`
**Priority:** High
**Steps:**
1. Attempt to delete a customer linked to a project, through the UI.
2. Send the delete request **directly** to the endpoint.

**Expected Result:**
- Refused at **both** legs with a message naming the linked project, per FAQ Q7.
- **Leg 2 is the one that matters.** If the endpoint accepts the delete, every invoice for that customer loses its
  billing party — orphaning issued financial documents. High severity.
- Unlink the customer from all projects and confirm deletion then succeeds.

---

### TC-INV-010: One customer per project

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Attempt to link a second customer to a project that already has one.

**Expected Result:**
- Only one customer can be linked, per FAQ Q6 — either the field is single-valued or the change replaces the
  existing link explicitly.
- **If replacing, confirm what happens to existing invoices for the previous customer.** They must keep their
  original billing party; re-pointing issued invoices at a new customer would misattribute real money.

---

## Functional Cases — Project billing settings

---

### TC-INV-011: Set the project's billing customer

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Project → Invoice → **Settings** → select the customer → Save.

**Expected Result:**
- Persists, and newly generated invoices carry that customer.

---

### TC-INV-012: Set the project hourly rate

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Set a project hourly rate; Save; generate an invoice for a user with no personal rate.

**Expected Result:**
- The line item uses the project rate, and the line total equals hours × that rate.

---

### TC-INV-013: Select billing activities

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Select only some activities as billable; Save.
2. Log time under both a billable and a non-billable activity; open the Billing Report.

**Expected Result:**
- Only the billable activity's hours are included.
- The excluded hours are genuinely absent from the total, not merely hidden from the list.

---

### TC-INV-014: No billing activities selected

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Clear the billing activities; open the Billing Report over a range that definitely contains logged time.

**Expected Result:**
- Either an explicit warning that no activities are configured, or a clear zero with an explanation.
- **This is the KB's own troubleshooting item** — "verify billing activity configuration matches logged time entry
  activities". An empty report that looks identical to "nobody logged any time" will send a tester hunting a
  non-existent bug, so the distinction should be visible.

---

### TC-INV-015: Settings are per project

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Configure different customers, rates and activities on two projects.

**Expected Result:**
- Each project's invoices use its own settings; no bleed between them.

---

## Functional Cases — Team rates

---

### TC-INV-016: Set a per-user rate

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Project → Invoice → **Team Rates** → set a rate for one member → Save.
2. Generate an invoice covering that user's time.

**Expected Result:**
- The line item uses the **user's** rate, not the project rate, and the total equals hours × user rate.

---

### TC-INV-017: Different rates for different users

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Set distinct rates for three members; generate an invoice covering all three.

**Expected Result:**
- Three line items, each priced at its own user's rate.
- **Verify each line's arithmetic independently** — a single wrong pairing of user to rate is invisible in the
  invoice total but overcharges or undercharges the client per person.

---

### TC-INV-018: Bulk Update

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Team Rates → **Bulk Update** → enter new rates → Save.

**Expected Result:**
- Every rate updates as entered, and none is left at its old value.

---

### TC-INV-019: Rate changes do not alter existing invoices

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Generate an invoice, then change the user's rate, then reopen that invoice.

**Expected Result:**
- The existing invoice is **unchanged**. A generated line item captures the rate at generation time.
- Retroactively repricing an issued invoice would change what a client owes after the fact — a serious defect,
  and the reason this case exists rather than being assumed.

---

### TC-INV-020: Rates are per project

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Set different rates for the same user on two projects; generate an invoice in each.

**Expected Result:**
- Each uses its own project's rate for that user.

---

## Functional Cases — Rate fallback

---

### TC-INV-021: User rate wins over the project rate

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. With both a project rate and a user rate set, generate an invoice.

**Expected Result:**
- The user rate is used — first step of the documented fallback order.

---

### TC-INV-022: Project rate is used when no user rate exists

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Remove the user rate, keep the project rate, generate an invoice.

**Expected Result:**
- The project rate is used.

---

### TC-INV-023: No rate at all yields zero

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Remove both rates; generate an invoice for that user's time.

**Expected Result:**
- The line item's rate is **zero**, per the documented fallback, and the line total is zero.
- **The zero must be visible as a problem.** This is the plugin's most dangerous silent failure: a zero-rate
  invoice can be generated, sent and marked paid while the client is billed nothing for that person's work, and
  nothing in the flow raises an error. If the UI does not flag or warn on a zero-rate line, that absence is itself
  a finding worth reporting — the KB says the value "must be edited manually", which only helps if someone notices.

---

## Negative Cases

---

### TC-INV-024: Invalid rate values

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Enter a negative rate, a non-numeric value, and a value with many decimal places, individually and via
   Bulk Update.

**Expected Result:**
- Each rejected with a clear message.
- **A negative rate would produce a negative line item and reduce the invoice total** — effectively crediting the
  client for work performed.
- Decimal handling is consistent with the currency; verify no rounding drift between the rate, the line total and
  the invoice total.

---

### TC-INV-025: Customer validation

**User Role:** User with `manage_customers`
**Priority:** High
**Steps:**
1. Create customers with: a blank name; a malformed email; a 500-character name; a duplicate name; and a name and
   address containing a script tag.

**Expected Result:**
- Blank name and malformed email are rejected — the email is the delivery address for real invoices.
- Long values do not break the invoice layout or the PDF.
- **Script content is escaped everywhere it renders**, including the PDF and the outgoing email. No script
  executes; and in the PDF template context, unescaped content could also break generation entirely (TC-INV-102).

---

### TC-INV-026: Rate for a user who is not a project member

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Attempt to set a team rate for a user who is not a member of the project.

**Expected Result:**
- Refused, or handled consistently. The team rates list should reflect actual project membership.

---

### TC-INV-027: Member removed after invoices were generated

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Generate an invoice including a user's time, then remove that user from the project.
2. Reopen the invoice and the Billing Report.

**Expected Result:**
- The existing invoice retains its line item intact — the work was done and billed.
- Neither page errors. Removing someone from a project must not rewrite billing history.

---

### TC-INV-028: Concurrent rate edits

**User Role:** Two users with `manage_invoices`
**Priority:** Low
**Steps:**
1. Both open Team Rates; one edits a single rate while the other runs a Bulk Update; both save.

**Expected Result:**
- No lost update, or a clear stale-state message.
- **Bulk Update is a whole-form save**, so it is the likely path for one user's change to be silently overwritten —
  and the overwritten value is a price, which nobody re-checks before invoicing.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
