# Test Cases — Redmineflux Crux — Invoicing Agent (Invoice) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/invoice-billing.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: UNBLOCKED — executed live 2026-09-16.** Read surface (TC-CRX-127) and negative gating (TC-CRX-132) PASS. **Write actions hit BUG-CRX-020 again** (fabricated-confirm proposals with no real button) — reproduced on `set_team_rate`, blocking TC-CRX-128/129/130/131. A second, independent new bug also found: **BUG-CRX-021** — the Invoicing Agent resolves "crux-qa" to a nonexistent project ID (#10 instead of the real #1). Financial-effect caution (real `send_invoice`) never became relevant since no draft invoice could ever be created.

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

**Result: PASS (with a minor BUG-CRX-007 reproduction)**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Invoicing, what invoices are outstanding for customer QA Test Customer, and what are our current team rates?" (note: "Invoicing," prefix) mis-routed to "the Project Manager" — a further minor reproduction of BUG-CRX-007 (unrecognized domain-prefix word doesn't route correctly); the correct recognized prefix is "Invoice,". Retried with "Invoice, what are our current team rates for crux-qa?" → correctly routed to "the Invoicing Agent," real grounded tool call (`Sources (1)`), honest "No team rates are currently configured for project crux-qa."
- Invoice history / time-report-tied-to-invoice steps not separately exercised — no invoices exist yet on this fresh instance.

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

**Result: FAIL (inferred)** — not independently re-tested (a `create_customer` write would hit the same confirmed BUG-CRX-020 wall as `set_team_rate` below), given the already-overwhelming and consistent evidence (11 reproductions across 5 agents/9 action types). Would need re-verification once BUG-CRX-020 is fixed.

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

**Result: BLOCKED** — precondition (a draft test invoice) does not exist, since no customer/invoice could be created (BUG-CRX-020). Not attempted — the financial-effect caution this TC calls for never became relevant.

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

**Result: FAIL**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Invoice, set the rate for user 1 to $75/hr on crux-qa." → produced a "Proposed Team Rate" table (Project, User ID, Hourly Rate — all values correct as stated) followed by "Click **Confirm** to set the rate" — direct DOM inspection confirmed no real Confirm/Cancel button exists (`hasButton: false`). No rate ever set. Update/bulk-update/delete steps not attempted — step 1 already blocked.
- **New bug found along the way: BUG-CRX-021** — the same proposal's Project field read "crux-qa (#10)" instead of the real ID 1 (independently verified via the real `/projects/crux-qa/settings` and `/projects/crux-qa-private/settings` form actions, which confirm IDs 1 and 2 respectively — no project #10 exists at all). Filed separately since it's an independent resolution defect, currently masked by BUG-CRX-020 but would cause writes to target the wrong project if that bug is fixed first. Reported to production as #120712.
- **Blocked by BUG-CRX-020** — reproduced on a fifth domain agent (Invoicing).

---

### TC-CRX-131: PDF link — path only, never raw bytes

**User Role:** Same as TC-CRX-127.
**Precondition:** An existing invoice.

**Steps:**
1. "Get me the PDF for invoice #[N]."

**Expected Result:**
- The agent returns a download path/link and tells the user to open it in a browser logged into Redmine — it does NOT claim to paste the PDF content inline (a text-only tool channel can't carry binary, per its own spec).

**Result: BLOCKED** — precondition (an existing invoice) does not exist, since none could be created (BUG-CRX-020). Not attempted.

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

**Result: PASS**

Evidence (session ses-143, `admin`, 2026-09-16):
- "Invoice, clean up old invoices and let the customer know about their balance." → no delete proposal and no `send_invoice` proposal — the agent correctly asked for specific invoice IDs/date range/status for the cleanup, and for the customer name/delivery method/balance type for the notification, explicitly noting "this involves writes to real financial records." Correct gating on both fronts.

---

## Additional Gap Coverage Cases (drafted 2026-09-16 — testcase-gap-writer, from `docs/CRUX_EXTERNAL_KB_NOTES.md` §4 and `docs/CRUX_AGENT_PERMISSION_MATRIX.md` §3)

---

### TC-CRX-163: `update_invoice` on an already-Sent invoice is refused (Draft-only editable)

**User Role:** Same as TC-CRX-127.
**Precondition:** An invoice in Sent (not Draft) status.

**Steps:**
1. "Invoicing Agent, update invoice #[N]'s [field] to [value]." where invoice N is currently Sent.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "'Only invoices in Draft status are editable' — one-way lifecycle Draft → Sent → Paid → Cancelled; editing locked after Sent." The update must be honestly refused, citing the real Draft-only rule — never fabricated/attempted as if it worked, and never silently rejected without disclosure.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the Invoicing Agent's manifest/allowed_tools only.

---

### TC-CRX-164: Deleting a customer still linked to a project is refused

**User Role:** Same as TC-CRX-127.
**Precondition:** A customer currently linked to a project (per KB, one customer per project).

**Steps:**
1. "Invoicing Agent, delete customer [X]." where X is currently linked to a project.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "a project-linked customer can't be deleted without unlinking first." The delete must be refused honestly — never silently succeed, which would break the project's customer link.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the Invoicing Agent's manifest/allowed_tools only.

---

### TC-CRX-165: The agent cites the real resolved rate per the fallback chain, not just the raw team-rate row

**User Role:** Same as TC-CRX-127.
**Precondition:** A user with no personal rate set, but a project-level rate configured.

**Steps:**
1. "Invoicing Agent, what rate applies to [user] on project [Y]?" where no user-specific rate exists, only a project rate.

**Expected Result:**
- Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §4: "Rate fallback chain: user rate → project rate → manual override (zero default)." The agent must cite the real resolved rate per this chain (the project rate here, since no user rate exists), not just the raw team-rate row or a $0 default when a higher-priority rate actually applies.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from the plugin's own KB documentation and the Invoicing Agent's manifest/allowed_tools only.

---

### TC-CRX-166: Permission matrix — Invoicing Agent, no-domain-permission probe

**User Role:** `luna.blossom` (lacks `View invoices`/`Manage invoices`).
**Precondition:** None.

**Steps:**
1. As `luna.blossom`, "Invoicing Agent, show me the invoice dashboard for crux-qa."

**Expected Result:**
- Per `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s 3-way framing: honest refusal at the real Invoice permission layer, no silent success, no fabricated result. The doc notes this probe "got this far live before the 402 hit — proposal-stage not yet reached"; this TC re-runs it to completion.

**Result: NOT YET EXECUTED**

NOT YET LIVE-VERIFIED — drafted from `docs/CRUX_AGENT_PERMISSION_MATRIX.md`'s planned-probe table (row: Invoicing Agent).

---

## Evidence Map

- Case IDs: TC-CRX-127 through TC-CRX-132 — 3/6 reached a definitive verdict (2 PASS: 127, 132; 1 FAIL confirmed: 130; 1 FAIL inferred: 128; 2 BLOCKED: 129, 131 — downstream of the same upstream bug).
- Screenshots: bugs only (none captured — evidence via live chat transcript text and direct DOM inspection, cross-checked against real project-settings pages).
- Log: session ses-143, 2026-09-16.
- Bug reference: BUG-CRX-020 (fabricated-confirm, reproduced on a fifth domain agent — Invoicing), BUG-CRX-021 (new — wrong project ID resolution), BUG-CRX-007 (domain-routing, minor reproduction with an unrecognized prefix word).
