# Test Cases — Redmineflux Invoice — Payments & Stripe Integration

> Source: vendor KB — "How to Record a Payment", "How to Use Online Payments (Stripe)", "Payment Gateway"
> configuration, FAQ Q3, Q9.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Invoice Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_invoice_qa

## Safety preconditions — not optional

1. **Stripe test-mode keys only.** Never configure live keys on a QA instance.
2. **Never use real card details.** Use Stripe's published test card numbers.
3. Record the mode (test/live) alongside every result in this suite; a payment result from an unknown mode is
   worthless and potentially dangerous.

## Why this suite is the highest-risk in the plugin set

Two properties combine:

- **The payment link is customer-facing and deliberately unauthenticated.** It is the only surface in the entire
  Redmineflux plugin set that a stranger is *meant* to reach without a Redmine account.
- **The webhook writes financial state from outside Redmine.** An unverified webhook means anyone who can reach
  the endpoint can mark any invoice paid.

Everything below follows from those two facts.

---

## Functional Cases — Manual payments

---

### TC-INV-076: Record a manual payment

**User Role:** User with `manage_invoices`
**Steps:**
1. Open a Sent invoice → **Payments** → enter amount, date and method → Save.

**Expected Result:**
- The payment is recorded with all three values and appears in the payments list.
- The outstanding balance reduces by exactly that amount.

---

### TC-INV-077: Partial payments accumulate

**User Role:** User with `manage_invoices`
**Steps:**
1. On a 1000 invoice, record 400, then 350.

**Expected Result:**
- The recorded total is 750 and the balance is 250. The status remains **Sent**, not Paid.

---

### TC-INV-078: Multiple payment methods

**User Role:** User with `manage_invoices`
**Steps:**
1. Record payments using each available method.

**Expected Result:**
- Each is stored with its method and all appear in the history.

---

### TC-INV-079: Full payment sets the status to Paid

**User Role:** User with `manage_invoices`
**Steps:**
1. Record a final payment bringing the total to exactly the invoice amount.

**Expected Result:**
- The status changes to **Paid automatically**, per the KB.
- The invoice becomes non-editable and moves out of the dashboard's outstanding totals.

---

### TC-INV-080: Payment exactly at the boundary

**User Role:** User with `manage_invoices`
**Steps:**
1. On an invoice whose total has decimals (e.g. 1080.55), pay the exact amount in two parts.

**Expected Result:**
- The status flips to Paid at exactly the full amount, with no rounding gap leaving a balance of 0.01 that keeps
  the invoice permanently unpaid.
- **A cent of rounding drift here means an invoice can never reach Paid** — a real and very plausible defect.

---

### TC-INV-081: Overpayment

**User Role:** User with `manage_invoices`
**Steps:**
1. Record a payment exceeding the invoice total.

**Expected Result:**
- Either refused with a clear message, or accepted and shown as a credit — not silently truncated.
- Record which. A payment that is accepted but partly discarded loses a record of money actually received.

---

## Functional Cases — Stripe payment link

---

### TC-INV-082: The payment link appears when Stripe is enabled

**User Role:** User with `manage_invoices`
**Steps:**
1. With Stripe enabled, open a Sent invoice; then disable Stripe and re-check.

**Expected Result:**
- The link is present only when the gateway is enabled.

---

### TC-INV-083: The payment page opens without a Redmine account

**User Role:** An unauthenticated visitor (private window, no Redmine session)
**Steps:**
1. Open the payment link.

**Expected Result:**
- The payment page opens with no login prompt — this is the documented, intended behaviour.
- **Testing this while logged in proves nothing**; use a genuinely session-free browser.

---

### TC-INV-084: The payment page discloses only what a payer needs

**User Role:** Unauthenticated visitor
**Steps:**
1. Inspect the page's **full HTML source and network responses**, not only what is rendered.

**Expected Result:**
- The invoice number, amount and company details are present — a payer needs them.
- **Nothing else is.** There must be no project name that reveals internal structure, no issue subjects, no time
  entries, no user names, no other invoices, and no customer list.
- This is the highest-value case in the suite: it is a page served to anyone holding a link, and a payload
  carrying the underlying time entries would disclose internal work detail to a client or to anyone the link
  reaches. Check the payload, since none of this would appear on screen.

---

### TC-INV-085: Complete a test payment

**User Role:** Unauthenticated visitor
**Steps:**
1. Using a Stripe **test** card, complete checkout.
2. Return to Redmine and open the invoice.

**Expected Result:**
- The payment is recorded and the status updates, per the KB's webhook flow.
- The recorded amount matches exactly what was charged.

---

## Negative Cases — the ones that matter

---

### TC-INV-086: The webhook must verify its signing secret

**User Role:** An unauthenticated caller
**Steps:**
1. Send a well-formed payment-succeeded webhook payload to the endpoint **with no signature**.
2. Repeat with an **invalid** signature.
3. Repeat naming a different invoice ID than any real Stripe event.

**Expected Result:**
- All three rejected, and no payment is recorded.
- **This is the single most important case in the entire Invoice plugin.** If the endpoint accepts unsigned or
  wrongly-signed events, anyone who can reach the URL can mark any invoice Paid without paying — writing false
  financial records and closing genuine debts. Critical.
- The KB requires a Webhook Secret to be configured, so verification is clearly intended; this case confirms it is
  actually enforced.

---

### TC-INV-087: A replayed webhook does not double-record

**User Role:** An unauthenticated caller
**Steps:**
1. Capture a legitimate webhook event and deliver it twice.

**Expected Result:**
- The payment is recorded **once**.
- Stripe retries events by design, so duplicate delivery is routine rather than adversarial. Double-recording
  would overpay the invoice and could push it into a false credit state.

---

### TC-INV-088: A payment token cannot reach another invoice

**User Role:** Unauthenticated visitor
**Steps:**
1. With a valid payment link for invoice A, alter the identifier to target invoice B while keeping the token.
2. Try a malformed token, a truncated one, and a well-formed but non-existent one.

**Expected Result:**
- All refused with a not-found style response.
- **The token authorises exactly one invoice**, not unauthenticated access generally.
- The error must not disclose whether the other invoice exists, its amount, or its customer — enumerable invoice
  links would expose the organisation's billing to anyone willing to guess.

---

### TC-INV-089: The payment page cannot write anything but a payment

**User Role:** Unauthenticated visitor
**Steps:**
1. Using the payment context and no session, send requests to edit the invoice, change its amount, alter the
   customer, cancel it, and regenerate its link.

**Expected Result:**
- Every one refused.
- **An unauthenticated caller able to change an invoice's amount before paying it would let a client set their own
  price.** Critical.

---

### TC-INV-090: A paid invoice cannot be paid again

**User Role:** Unauthenticated visitor
**Steps:**
1. Open the payment link for an already-Paid invoice and attempt checkout.

**Expected Result:**
- Blocked with a clear message, or clearly marked as already settled.
- Charging a customer twice for the same invoice is a serious commercial failure, and the link remains reachable
  after payment unless this is handled.

---

### TC-INV-091: Payment link after cancellation

**User Role:** User with `manage_invoices`, then an unauthenticated visitor
**Steps:**
1. Cancel an invoice, then open its payment link.

**Expected Result:**
- The link no longer accepts payment. Collecting money against a voided invoice is both wrong and difficult to
  refund cleanly.

---

### TC-INV-092: Invalid Stripe credentials

**User Role:** Admin
**Steps:**
1. Configure an invalid secret key and open a payment link.

**Expected Result:**
- A clear failure rather than a blank page or a raw gateway error exposed to the customer.
- **Nothing in the error reveals the configured key**, even partially — the payment page is seen by people outside
  the organisation.

---

### TC-INV-093: Gateway unreachable

**User Role:** Unauthenticated visitor
**Steps:**
1. Block outbound access to Stripe and open the payment link.

**Expected Result:**
- A clear "payment temporarily unavailable" message.
- **Redmine itself is unaffected** and no payment is recorded.

---

### TC-INV-094: Recording payments requires permission

**User Role:** User with `view_invoices` only, and a plain member
**Steps:**
1. Confirm no Payments controls are offered.
2. Send the payment-create request **directly**.

**Expected Result:**
- Refused with 403 for both.
- **Recording a payment marks a debt settled.** A user able to do it through the endpoint could write off real
  invoices — a financial-integrity defect, not a routine permission gap.

---

### TC-INV-095: Payment records are immutable or audited

**User Role:** User with `manage_invoices`
**Steps:**
1. Attempt to edit and then delete a recorded payment, through the UI and directly.

**Expected Result:**
- Record the behaviour precisely.
- If payments can be edited or deleted, there must be an audit trail of who did so and when. **Silently removable
  payment records mean the invoice's paid status can be rewritten with no evidence** — worth filing as a
  governance finding even if it is intended behaviour.

---

### TC-INV-096: Invalid payment values

**User Role:** User with `manage_invoices`
**Steps:**
1. Record payments of zero, a negative amount, a non-numeric value, and a far-future date.

**Expected Result:**
- Each rejected with a clear message.
- **A negative payment would increase the outstanding balance** and could be used to reopen a settled invoice.

---

### TC-INV-097: Currency consistency

**User Role:** User with `manage_invoices`
**Steps:**
1. Compare the currency shown on the invoice, on the payment page, and in the amount charged by Stripe.

**Expected Result:**
- All three agree.
- A mismatch between the displayed currency and the charged currency means the client is billed a different amount
  from the one on the document — a material defect, and an easy one to introduce when the symbol is a free-text
  setting (TC-INV-037).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
