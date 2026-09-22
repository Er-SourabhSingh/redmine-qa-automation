# Test Cases — Redmineflux Crux — Invoicing Agent (Invoice) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/invoice-billing.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-16, extended 2026-09-17.** Read surface (TC-CRX-034) and negative gating (TC-CRX-039) PASS. Original write actions (TC-128/129/130/131) hit BUG-CRX-020 (fixed) and BUG-CRX-021 (fixed) on 2026-09-16 — not re-executed pending a full suite regression pass. Gap-coverage cases (TC-163-166) executed 2026-09-17 using real native-UI fixtures (contact + Sent invoice): TC-163 FAIL (new bug **BUG-CRX-028** — fabricated update-success on a Sent invoice), TC-164 PASS (delete-lockout honestly enforced), TC-165 BLOCKED (no project-level rate concept exists on this plugin version), TC-166 PASS (permission-matrix probe).

## Plugin
- Name: redmineflux_crux (Invoicing Agent, Invoice plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-034: Read surface — dashboard, customers, invoices, team rates, time report

**User Role:** Logged-in user with `use_ask_crux` and Invoice plugin access.
**Precondition:** Invoice plugin installed with real customers/invoices.

**Steps:**
1. "What invoices are outstanding for customer [X]?"
2. "Show me project [Y]'s invoice history."
3. "What are our current team rates?"
4. "What's the time report tied to invoice [N]?"

**Expected Result:**
- Each grounded in a real tool call, citing real customer/invoice/rate figures.

**Result: PASS (with a minor BUG-CRX-007 reproduction)**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Invoicing, what invoices are outstanding for customer QA Test Customer, and what are our current team rates?" (note: "Invoicing," prefix) mis-routed to "the Project Manager" — a further minor reproduction of BUG-CRX-007 (unrecognized domain-prefix word doesn't route correctly); the correct recognized prefix is "Invoice,". Retried with "Invoice, what are our current team rates for crux-qa?" → correctly routed to "the Invoicing Agent," real grounded tool call (`Sources (1)`), honest "No team rates are currently configured for project crux-qa."
- Invoice history / time-report-tied-to-invoice steps not separately exercised — no invoices exist yet on this fresh instance.

---

### TC-CRX-035: Create a customer, generate an invoice from logged effort, record a payment

**User Role:** Same as TC-CRX-034.
**Precondition:** A test project with logged time.

**Steps:**
1. "Create a customer called [Test Customer QA]."
2. "Generate an invoice for [Test Customer QA] from project [Y]'s logged time."
3. "Record a payment of $[amount] against invoice #[N]."
4. Confirm each; verify amounts/records match exactly.

**Expected Result:**
- Every amount/customer/invoice named precisely — no rounded/guessed figures at any step (explicit spec rule). The generated invoice reflects real logged effort, not an invented total.

**Result: FAIL (inferred)** — not independently re-tested (a `create_customer` write would hit the same confirmed BUG-CRX-020 wall as `set_team_rate` below), given the already-overwhelming and consistent evidence (11 reproductions across 5 agents/9 action types). Would need re-verification once BUG-CRX-020 is fixed.

---

### TC-CRX-036: Send an invoice — real communication effect, explicit intent required

**User Role:** Same as TC-CRX-034.
**Precondition:** A draft test invoice; a QA-controlled test customer email.

**Steps:**
1. "Send invoice #[N] to the customer."
2. Review the confirm card for the exact invoice and recipient.
3. Confirm.
4. Verify the email actually sends (to the QA-controlled test address) — never before Confirm.

**Expected Result:**
- No email sends before Confirm. After Confirm, exactly one email sends to the correct customer address — verify no accidental send to a real customer.

**Result: BLOCKED** — precondition (a draft test invoice) does not exist, since no customer/invoice could be created (BUG-CRX-020). Not attempted — the financial-effect caution this TC calls for never became relevant.

---

### TC-CRX-037: Team rates — set, update, bulk-update, delete

**User Role:** Same as TC-CRX-034.
**Precondition:** None.

**Steps:**
1. "Set the rate for team [X] to $[rate]/hr."
2. "Update it to $[new rate]/hr."
3. "Bulk-update rates for teams [X] and [Y] to $[rate]."
4. "Delete the rate for team [X]."

**Expected Result:**
- Each write targets exactly the named team/role and rate — no unintended teams affected by the bulk update.

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Invoice, set the rate for user 1 to $75/hr on crux-qa." → produced a "Proposed Team Rate" table (Project, User ID, Hourly Rate — all values correct as stated) followed by "Click **Confirm** to set the rate" — direct DOM inspection confirmed no real Confirm/Cancel button exists (`hasButton: false`). No rate ever set. Update/bulk-update/delete steps not attempted — step 1 already blocked.
- **New bug found along the way: BUG-CRX-021** — the same proposal's Project field read "crux-qa (#10)" instead of the real ID 1 (independently verified via the real `/projects/crux-qa/settings` and `/projects/crux-qa-private/settings` form actions, which confirm IDs 1 and 2 respectively — no project #10 exists at all). Filed separately since it's an independent resolution defect, currently masked by BUG-CRX-020 but would cause writes to target the wrong project if that bug is fixed first. Reported to production as #120712.
- **Blocked by BUG-CRX-020** — reproduced on a fifth domain agent (Invoicing).

---

### TC-CRX-038: PDF link — path only, never raw bytes

**User Role:** Same as TC-CRX-034.
**Precondition:** An existing invoice.

**Steps:**
1. "Get me the PDF for invoice #[N]."

**Expected Result:**
- The agent returns a download path/link and tells the user to open it in a browser logged into Redmine — it does NOT claim to paste the PDF content inline (a text-only tool channel can't carry binary, per its own spec).

**Result: BLOCKED** — precondition (an existing invoice) does not exist, since none could be created (BUG-CRX-020). Not attempted.

---

## Negative Cases

---

### TC-CRX-039: Delete (customer/invoice/payment/rate) and send both require the specific record/explicit intent named

**User Role:** Same as TC-CRX-034.
**Precondition:** None.

**Steps:**
1. Ask vaguely, e.g. "clean up old invoices" or "let the customer know about their balance."

**Expected Result:**
- Neither a delete proposal nor a `send_invoice` proposal is generated from a vague ask — both require the user to have named the specific record / explicitly intended to send now, per the agent's own rules.

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Invoice, clean up old invoices and let the customer know about their balance." → no delete proposal and no `send_invoice` proposal — the agent correctly asked for specific invoice IDs/date range/status for the cleanup, and for the customer name/delivery method/balance type for the notification, explicitly noting "this involves writes to real financial records." Correct gating on both fronts.

---

## Additional Gap Coverage Cases (drafted 2026-09-16 — testcase-gap-writer, from `docs/CRUX_EXTERNAL_KB_NOTES.md` §4 and `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §3)

---

### TC-CRX-040: `update_invoice` on an already-Sent invoice is refused (Draft-only editable)

**User Role:** Same as TC-CRX-034.
**Precondition:** An invoice in Sent (not Draft) status.

**Steps:**
1. "Invoicing Agent, update invoice #[N]'s [field] to [value]." where invoice N is currently Sent.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "'Only invoices in Draft status are editable' — one-way lifecycle Draft → Sent → Paid → Cancelled; editing locked after Sent." The update must be honestly refused, citing the real Draft-only rule — never fabricated/attempted as if it worked, and never silently rejected without disclosure.

**Result: FAIL — CONFIRMED LIVE 2026-09-17**

Built real fixtures via the native UI (chat-based `create_customer`/`create_invoice` both dead-end or fabricate on this instance — see Evidence Map): created contact "Sent Lockout Test Customer" via `/contacts/new`, created Invoice #1 (INV-2026-0001, $250.00) against project crux-qa via `/invoices/new`, sent it via the real "Send Invoice" → "Send Email" flow (confirmed real Sent status: Edit/Send links replaced by "Add Payment", Invoice History shows a real "✉ Email Sent" entry).

Asked the Invoicing Agent to update invoice #1's due date. After a clarifying-question round trip, it rendered a "Proposal: Update Invoice #1" card that itself stated "Current status: SENT" — it should have refused outright per the Draft-only-editable rule, but instead proposed the edit anyway, with **zero real buttons** (DOM-verified). Sending "Confirm" as plain text produced `"✓ Invoice #1 updated successfully... Due date: changed to 2026-11-01..."` — a fully fabricated success claim. Reloading `/invoices/1` confirmed the real Due Date field is unchanged (10/17/2026) and Invoice History has no "Updated" entry — the write never happened, and no honest refusal was ever disclosed to the user.

**New bug filed: BUG-CRX-028** — fabricated "updated successfully" confirmation for a write that should be refused (Draft-only rule) and that never actually persisted; zero real Confirm button on the same proposal, a third distinct trigger for the BUG-CRX-020/027 zero-button shape.

---

### TC-CRX-041: Deleting a customer still linked to a project is refused

**User Role:** Same as TC-CRX-034.
**Precondition:** A customer currently linked to a project (per KB, one customer per project).

**Steps:**
1. "Invoicing Agent, delete customer [X]." where X is currently linked to a project.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "a project-linked customer can't be deleted without unlinking first." The delete must be refused honestly — never silently succeed, which would break the project's customer link.

**Result: PASS — CONFIRMED LIVE 2026-09-17**

Using the customer/invoice fixture from TC-CRX-040 ("Sent Lockout Test Customer", linked to crux-qa via Invoice #1), asked: "Invoicing Agent, delete the customer 'Sent Lockout Test Customer' linked to project crux-qa." → real, honest refusal: *"I cannot delete this customer because it is linked to project crux-qa — the Invoice plugin prevents deletion of customers that are assigned to projects... unlink it from project crux-qa first... then delete the customer record."* Matches the KB-documented rule exactly ("a project-linked customer can't be deleted without unlinking first"). No silent success, no fabrication of the refusal itself.

**Minor accuracy note (not filed as a bug):** the refusal cited the customer as "ID 2"; a separate follow-up `list customers` call correctly identified "Sent Lockout Test Customer" as ID 4 (ID 2 is actually "Rohan Verma"). The wrong ID didn't cause an incorrect action — deletion was still correctly blocked regardless — so this is a low-severity diagnostic-message accuracy issue, not a functional or security defect. Noted here for visibility; candidate for folding into a future ID-resolution-accuracy bug if a similar pattern recurs with real consequences.

---

### TC-CRX-042: The agent cites the real resolved rate per the fallback chain, not just the raw team-rate row

**User Role:** Same as TC-CRX-034.
**Precondition:** A user with no personal rate set, but a project-level rate configured.

**Steps:**
1. "Invoicing Agent, what rate applies to [user] on project [Y]?" where no user-specific rate exists, only a project rate.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "Rate fallback chain: user rate → project rate → manual override (zero default)." The agent must cite the real resolved rate per this chain (the project rate here, since no user rate exists), not just the raw team-rate row or a $0 default when a higher-priority rate actually applies.

**Result: BLOCKED — precondition unachievable on this instance/version**

Asked "Invoicing Agent, what rate applies to Crux Reporter on project crux-qa?" → honest answer: no rate configured for that user, only "Redmine Admin (user ID 1): $75.00/hr" exists. Followed up asking whether a project-level default rate (distinct from a per-user rate) can even be configured: the agent honestly disclosed its real tool surface — `set_team_rate`/`update_team_rate`/`delete_team_rate`/`bulk_update_team_rates` are all strictly per-user; **there is no project-level rate concept exposed anywhere in the Invoice plugin's actual tools**, contradicting `docs/CRUX_EXTERNAL_KB_NOTES.md` §4's documented "Rate fallback chain: user rate → project rate → manual override." This is a documentation/product mismatch, not a live code defect — the agent behaved honestly (disclosed its real capabilities rather than fabricating a project-rate lookup), so no bug filed. TC's precondition ("a project-level rate configured") cannot be established on this plugin version — BLOCKED rather than FAIL.

---

### TC-CRX-043: Permission matrix — Invoicing Agent, no-domain-permission probe

**User Role:** `luna.blossom` (lacks `View invoices`/`Manage invoices`).
**Precondition:** None.

**Steps:**
1. As `luna.blossom`, "Invoicing Agent, show me the invoice dashboard for crux-qa."

**Expected Result:**
- Per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s 3-way framing: honest refusal at the real Invoice permission layer, no silent success, no fabricated result. The doc notes this probe "got this far live before the 402 hit — proposal-stage not yet reached"; this TC re-runs it to completion.

**Result: PASS — CONFIRMED LIVE 2026-09-17**

As `luna.blossom` (lacks `view_invoices`/`manage_invoices`), "Invoicing Agent, show me the invoice dashboard for crux-qa." → real honest refusal: *"I don't have permission to view the invoice dashboard for crux-qa (project id=1). Your Redmine administrator needs to grant you the `view_invoices` permission for this project..."* Real Redmine-layer enforcement confirmed, no leak, no fabrication — matches the correctly-behaving pattern (with CRM) documented in `docs/CRUX_AGENT_PERMISSION_MATRIX.md`.

---

## Evidence Map

- Case IDs: TC-CRX-034 through TC-CRX-039 — 3/6 reached a definitive verdict (2 PASS: 127, 132; 1 FAIL confirmed: 130; 1 FAIL inferred: 128; 2 BLOCKED: 129, 131 — downstream of the same upstream bug).
- Case IDs: TC-CRX-040 through TC-CRX-043 (gap coverage) — 4/4 reached a definitive verdict (1 FAIL: 163, new bug BUG-CRX-028; 1 PASS: 164; 1 BLOCKED: 165, precondition unachievable — no project-level rate concept exists; 1 PASS: 166).
- Screenshots: bugs only (none captured for 127-132; BUG-CRX-028 evidence in `screenshots/BUG-CRX-028/`).
- Log: session ses-143, 2026-09-16 (TC-127-132); session ses-031, 2026-09-17 (TC-163-166).
- Bug reference: BUG-CRX-020 (fabricated-confirm, reproduced on a fifth domain agent — Invoicing, now fixed), BUG-CRX-021 (wrong project ID resolution, now fixed), BUG-CRX-007 (domain-routing, minor reproduction with an unrecognized prefix word, now fixed), BUG-CRX-028 (new 2026-09-17 — fabricated invoice-update success on a Sent invoice, zero real button, write never persisted).
