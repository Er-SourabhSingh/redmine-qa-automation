# Test Cases — Redmineflux Invoice — Creation, Billing Report, Adjustments & Lifecycle

> Source: vendor KB — "How to Create an Invoice", "How to Edit an Invoice",
> "How to Add Tax or Discount to an Invoice", "How to Send an Invoice", "How to Use the Billing Report",
> "Invoice Status Reference", FAQ Q1, Q2.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Invoice Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_invoice_qa

## Navigation methodology

Project → **Invoice** tab → **New Invoice** or **Billing Report**. Do not type URLs.

> **Every total in this suite must be hand-calculable before it is checked.** Set up time entries with known hours
> and known rates so the expected figure is known in advance. "The total looks about right" is not a result —
> these documents are sent to paying clients, and a wrong number looks exactly like a right one.
>
> **Sending is irreversible.** It dispatches a real email and locks the invoice permanently. Use a customer whose
> email address is a test mailbox.

---

## Functional Cases — Billing Report

---

### TC-INV-047: Billing Report shows billable hours by user

**User Role:** User with `view_invoices`
**Priority:** Medium
**Steps:**
1. Project → Invoice → **Billing Report** → select a date range covering known time entries.

**Expected Result:**
- Hours are grouped by user, with a calculated amount per user.
- **Cross-check the hours against core Redmine's spent-time report** for the same range and project. The two must
  agree; if they do not, one of them is misreading the data and the invoice built from it will be wrong.

---

### TC-INV-048: Only billable activities are counted

**User Role:** User with `view_invoices`
**Priority:** High
**Steps:**
1. With some activities marked non-billable, compare the report against the full spent-time total.

**Expected Result:**
- Non-billable hours are excluded from both the hours and the amounts (paired with TC-INV-013).

---

### TC-INV-049: Date range boundaries are inclusive

**User Role:** User with `view_invoices`
**Priority:** Medium
**Steps:**
1. Log time on the first and last day of a range; run the report for exactly that range.

**Expected Result:**
- Both days' entries are included.
- **A range that silently drops its final day under-bills every invoice generated from it** — a small, systematic
  and very hard-to-notice revenue loss. Check the boundary explicitly.

---

### TC-INV-050: Amounts use the correct rate per user

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. With distinct team rates set, check each user's amount in the report.

**Expected Result:**
- Each amount equals that user's hours × that user's rate, following the documented fallback order.

---

## Functional Cases — Invoice creation

---

### TC-INV-051: Generate an invoice from the Billing Report

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. From the Billing Report, click **Generate Invoice**.

**Expected Result:**
- An invoice is created in **Draft** with **one line item per user**, per FAQ Q1.
- Each line's hours and rate match the report exactly.

---

### TC-INV-052: Generated totals reconcile across three sources

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Compare the invoice subtotal against (a) the Billing Report total and (b) the sum of hours × rate computed by
   hand from core Redmine's spent-time report.

**Expected Result:**
- All three agree exactly.
- **This is the most valuable case in the suite.** Each figure is produced by different code over the same data,
  so a divergence pinpoints which stage is wrong — and every one of the three looks plausible in isolation.

---

### TC-INV-053: Overlapping date ranges

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Generate an invoice for a range, then generate another for an overlapping range.

**Expected Result:**
- Record the behaviour precisely. Either the already-billed entries are excluded, or they are billed again.
- **Double-billing a client for the same hours is a serious commercial defect.** If the plugin does not track
  which time entries have already been invoiced, that limitation must be recorded prominently in the plugin memory
  file, because nothing in the UI will warn the user.

---

### TC-INV-054: Generating with no billable time

**User Role:** User with `manage_invoices`
**Priority:** Low
**Steps:**
1. Generate for a range containing no billable entries.

**Expected Result:**
- Either refused with a clear message, or an empty Draft is created that can be deleted.
- A zero-value invoice must not be sendable without an explicit confirmation.

---

### TC-INV-055: Create an invoice manually

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Invoice tab → **New Invoice** → fill in details and line items → Save.

**Expected Result:**
- Created in Draft with the entered values and a correctly computed total.

---

### TC-INV-056: Manual line item arithmetic

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Add three line items with differing quantities and rates.

**Expected Result:**
- Each line total equals quantity × rate, and the subtotal equals their sum, with consistent rounding.

---

## Functional Cases — Editing and adjustments

---

### TC-INV-057: Draft invoices are editable

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Edit a Draft's line items, rates and details; Save.

**Expected Result:**
- All changes persist and the total recalculates.

---

### TC-INV-058: Non-Draft invoices are locked

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. For an invoice in **Sent**, then **Paid**, then **Cancelled**: confirm no Edit control is offered, and send the
   update request **directly** to the endpoint.

**Expected Result:**
- Refused at the endpoint in all three states, per FAQ Q2.
- **Leg 2 is the important one.** An issued invoice that can still be edited through its endpoint means the
  document held by the client and the record in Redmine can silently diverge — which defeats the entire point of
  the lock. High severity.

---

### TC-INV-059: Add a tax adjustment

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. On a Draft with a subtotal of 1000, add a tax row labelled VAT at 20%.

**Expected Result:**
- The tax is 200 and the total is 1200.

---

### TC-INV-060: Tax is applied after the discount

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. On a subtotal of 1000, add a **10% discount** and a **20% tax**.

**Expected Result:**
- Discount 100 → net 900 → tax 180 → **total 1080**.
- **Not 1000 − 100 + 200 = 1100**, which is what applying tax to the pre-discount subtotal would give.
- The KB states the order explicitly, so this is a documented contract with a single correct answer. An 80-unit
  error on a 1000-unit invoice is entirely plausible-looking and would go out to a client unnoticed.

---

### TC-INV-061: Multiple adjustments

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Add two discounts and two taxes and compute the expected total by hand first.

**Expected Result:**
- All discounts are applied before all taxes, and the arithmetic matches the hand calculation.
- Record whether the taxes compound on each other or both apply to the discounted subtotal — either can be
  defensible, but it must be consistent and documentable.

---

### TC-INV-062: Remove an adjustment

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Delete an adjustment row from a Draft.

**Expected Result:**
- The total recalculates correctly, with no residue of the removed row.

---

## Functional Cases — Sending and status

---

### TC-INV-063: Send an invoice

**User Role:** User with `manage_invoices`
**Priority:** High
**Preconditions:** Working mail path; **Host name and path** verified; the customer's email is a test mailbox.
**Steps:**
1. Open a Draft → **Send Email**.
2. Check the customer mailbox.

**Expected Result:**
- The email arrives at the **linked customer's** address, using the configured template, with working links.
- The invoice status becomes **Sent**.

---

### TC-INV-064: Sending locks the invoice

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. After sending, attempt to edit (UI and endpoint).

**Expected Result:**
- Locked, as in TC-INV-058.

---

### TC-INV-065: Sending is confirmed before it happens

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Trigger **Send Email** and observe whether a confirmation is required.

**Expected Result:**
- Record whether there is a confirmation step.
- **Sending is irreversible in two ways at once**: it emails a real client and it permanently locks the document.
  A single unconfirmed click that does both is a usability defect worth filing, because the mistake cannot be
  undone.

---

### TC-INV-066: Email send failure

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. With mail delivery unavailable, attempt to send.

**Expected Result:**
- The failure is **visible and logged**, and the status is not set to Sent if nothing was delivered.
- **An invoice marked Sent that was never delivered is the worst outcome here**: it is now locked and uneditable,
  the client never received it, and the record says otherwise. Record exactly what happens.

---

### TC-INV-067: Mark an invoice Cancelled

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Cancel a Draft, then attempt to cancel a Sent invoice and a Paid one.

**Expected Result:**
- The resulting state is consistent with the documented lifecycle, and a cancelled invoice is excluded from the
  dashboard's outstanding totals.

---

### TC-INV-068: Status transitions follow the documented lifecycle

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Walk an invoice through Draft → Sent → Paid, then attempt backwards transitions (Paid → Draft, Sent → Draft)
   through the UI and directly.

**Expected Result:**
- Backwards transitions are refused at the endpoint, or are explicitly supported and audited.
- **Reverting a Paid invoice to Draft would unlock it for editing after money has been received** — the most
  consequential state defect available in this plugin.

---

### TC-INV-069: Deleting an invoice

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Delete a Draft; then attempt to delete a Sent and a Paid invoice, at the UI and the endpoint.

**Expected Result:**
- Drafts may be deletable; issued invoices should not silently vanish.
- **Deleting a Sent or Paid invoice destroys a financial record**, breaks numbering continuity, and removes
  evidence of a payment. If it is permitted, record it as a governance finding.

---

### TC-INV-070: Concurrent send

**User Role:** Two users with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Both open the same Draft and click Send Email at nearly the same moment.

**Expected Result:**
- Exactly **one** email is sent and the status transitions once.
- Two emails would mean the client receives the same invoice twice, which causes real confusion in their
  accounts payable.

---

## Negative Cases

---

### TC-INV-071: Invalid adjustment values

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Enter a negative percentage, a non-numeric value, a 200% discount, and a blank label.

**Expected Result:**
- Each rejected with a clear message.
- **A discount above 100% would produce a negative total** — an invoice that owes the client money.

---

### TC-INV-072: Rounding consistency

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Use hours and rates that produce repeating decimals (e.g. 3.33 hours at 66.67), with a percentage tax.

**Expected Result:**
- Line totals, subtotal, adjustments and grand total are rounded consistently, and the displayed grand total
  equals the sum of the displayed components.
- **A total that does not equal its own visible parts is indefensible on a document a client will check.**

---

### TC-INV-073: Very large invoices

**User Role:** User with `manage_invoices`
**Priority:** Low
**Steps:**
1. Generate an invoice from a range covering several thousand time entries across 50 users.

**Expected Result:**
- Generation completes without timeout, the line items are correct, and the PDF renders. Record the duration.

---

### TC-INV-074: Script content in line items and labels

**User Role:** User with `manage_invoices`
**Priority:** High
**Steps:**
1. Enter a script tag in a line-item description and an adjustment label; view the invoice on screen, in the PDF
   and in the sent email.

**Expected Result:**
- Escaped and rendered literally in all three. **No script executes.**
- The PDF path matters as well as the HTML one: templates are ERB, so unescaped content there can break generation
  outright (TC-INV-102).

---

### TC-INV-075: Invoice for a project whose customer is unset

**User Role:** User with `manage_invoices`
**Priority:** Medium
**Steps:**
1. Generate an invoice on a project with no billing customer, then attempt to send it.

**Expected Result:**
- Either generation is refused, or the send is refused with a clear message naming the missing customer.
- It must not attempt to send to an empty address or silently succeed with no recipient.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
