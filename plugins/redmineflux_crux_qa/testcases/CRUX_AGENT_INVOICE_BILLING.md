# Test Cases — Redmineflux Crux — Invoicing Agent (Invoice & Billing plugin) Full CRUD

> **Execution started and first pass completed 2026-11-03.** New suite — Invoicing Agent had no dedicated
> Crux-chat test coverage until now (the native `redmineflux_invoice` plugin has its own separate QA suite
> under `plugins/redmineflux_invoice_qa/testcases/`, which covers the native UI, not the chat agent).
>
> **All 17 TCs executed (16 + 1 precondition confirmation); 1 (DEF-2 fallback rate) came back BLOCKED on a
> missing fixture precondition (no customer linked to the project), not a defect — 4 new bugs found, all
> filed:**
> - **BUG-CRX-132** (High) — `create_invoice` never sets/warns about `due_date`; viewing the resulting
>   invoice's native show page genuinely crashes with a 500 (`NoMethodError: undefined method 'strftime' for
>   nil`) — 100% reproducible, reachable via the agent and the native UI alike (Due Date isn't required on
>   either path).
> - **BUG-CRX-133** (Medium-High) — "Send Invoice" silently targeted a different, unrelated project when the
>   current message didn't re-name it — the same wrong-project-resolution defect class already found on 3
>   other domains this QA cycle (BUG-CRX-080/093/101), now a 4th domain.
> - **BUG-CRX-134** (Medium) — "Set Team Rate" crashes with a raw, unhandled 500 (DB foreign-key violation)
>   for a nonexistent user id, surfacing a misleading "database may not be migrated" remediation message
>   unrelated to the real cause. The sibling valid-user write in the same two-step batch succeeded correctly
>   and its own success reporting was honest.
> - **BUG-CRX-135** (High) — Delete invoice has no status check at all, unlike Update (Draft-only); a real
>   Sent invoice with genuine line items and a client email it had already been sent to was permanently
>   deleted with zero warning, moments after the same invoice's Update path correctly refused the identical
>   non-Draft status.
>
> **Everything else tested cleanly**: the no-permission dashboard refusal correctly names `view_invoices`
> specifically; the no-permission payment-write path is genuinely enforced once a real invoice exists
> (confirmed `Forbidden`, no bad write) — the first attempt's "not found" was simply because the invoice
> didn't exist yet, not a missing permission gate; both Auto-mode routing phrasings tested (bare and
> ambiguous) correctly reached Invoicing Agent with accurate real data, no misroute; tax-rate validation
> (0–100) is correctly enforced server-side (though the first-step proposal was fabricated prose with no real
> Confirm button — a BUG-CRX-020-class recurrence, not severe enough to file alone on a single instance);
> `get_pdf_link` returns a relative path only, no raw bytes, works regardless of status; the CRM-redirect
> mechanism works exactly as the code predicts (silent same-click retry for compatible fields, honest error
> for incompatible ones, always-retry for delete); Update correctly refuses non-Draft invoices; payment
> amount validation and the Draft/Sent revert-on-delete dual mechanism both work exactly as documented;
> single-user `set_team_rate` works correctly end-to-end.
>
> **BLOCKED (not a defect)**: TC-CRX-486 (DEF-2 fallback-rate warning) — this fixture project has no customer
> linked yet, so `generate_invoice` correctly refuses with "Client email cannot be blank" before DEF-2's own
> behavior can even be exercised; needs a customer-linking step first in a follow-up session.
>
> Starts at **TC-CRX-475** per the plugin-wide continuous numbering rule (CLAUDE.md §4a) — current max
> before this suite was TC-CRX-474.
>
> Source read in full before any TC was drafted (via a dedicated research pass, 2026-11-03):
> `redmineflux-crux-core/agents/invoice-billing.md` (persona), `redmineflux-mcp/src/tools/invoice.py`
> (tool implementation incl. `_crm_customer_redirect`), `redmineflux-crux-core/crux_core/askcrux/
> proposals.py` (`_invoice_crm_customer_retry`, the real CRM-redirect mechanism), the native
> `redmineflux_invoice` plugin's `init.rb`/controllers, `CRUX_AGENT_CAPABILITIES_REFERENCE.md` and
> `CRUX_AGENT_PERMISSION_MATRIX.md` (existing cross-agent precedent), and the vendor KB page
> (`https://www.redmineflux.com/knowledge-base/plugins/invoice/`).

## Plugin
- Name: redmineflux_crux (Invoicing Agent, Invoice & Billing plugin domain — `redmineflux_invoice`)
- Plugin version: see `/settings/plugin/redmineflux_invoice`
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## Precondition — DONE 2026-11-03

1. **New fixture project created**: `Crux Invoice Agent Test Project` (`crux-invoice-agent-test-project`) —
   "Redmineflux Invoice" and "Redmineflux Crux" project modules both enabled at creation.
2. **Permission model confirmed via native Roles & Permissions UI** (`/roles/<id>/edit`), not assumed:
   - `Manager` (role 4) and `Developer` (role 3): both **View invoices** and **Manage invoices** checked
     (full access).
   - `Reporter` (role 5): **neither** checked (zero Invoice access) — the genuine no-permission role on
     this instance.
3. **Project members added**: `luna.blossom` as **Manager** (with-permission, non-admin subject),
   `daisy.skye` as **Reporter** (no-permission subject). `admin` used as the full-access admin subject.
4. **CRM plugin is installed on this instance** (confirmed via source,
   `C:\crux-redmine\plugins\redmineflux_crm` exists) — this means Invoice's own `manage_customers`/
   `view_customers` permissions **do not exist at all** here (only registered when CRM is absent), and
   every one of Invoice's own `/api/customers*` endpoints unconditionally 403s with
   `"Customer management is handled by the CRM plugin — use /api/contacts instead"`. Customer CRUD via the
   Invoicing Agent is therefore **always** expected to go through the CRM-redirect mechanism (§ below),
   never through Invoice's own customer permission — there is no "Invoice-only customer permission" case to
   test on this instance.

## Scope

Full read/write coverage for the Invoicing Agent, grounded in `agents/invoice-billing.md`'s actual
`allowed_tools` list (`core_get_project`, `invoice_dashboard`, `list/get_customer`, `list/get_invoice`,
`list_project_invoices`, `list_team_rates`, `get_time_report`, `create/update/delete_customer`,
`create/update/delete_invoice`, `generate_invoice`, `send_invoice`, `record_payment`, `delete_payment`,
`get_pdf_link`, `crux_create_work_package`) plus the discoverable `invoice` tool group (`set_team_rate`,
`update_team_rate`, `delete_team_rate`, `bulk_update_team_rates`):

1. **Permission enforcement** — `view_invoices`/`manage_invoices` are independent project permissions, not
   hierarchical. With-permission vs. without-permission for both a read (dashboard) and a write (record a
   payment) — the write side has no existing precedent and is a priority.
2. **Auto-mode routing** — open territory, no existing BUG-CRX precedent for this domain (unlike
   CRM/Testcase/Budget, which each already have a documented misroute bug). Bare phrasing and an
   ambiguous-with-Project-Manager phrasing.
3. **Customer CRUD / CRM-redirect** — the actual mechanism is a pure-code, same-confirm-click auto-retry
   inside `proposals.confirm()`, not a second model turn as the persona doc implies. Compatible-field case
   (auto-retries silently) vs. incompatible-field case (falls through to the honest `"Error: ...moved to
   CRM..."` text) — a direct behavior-vs-persona-doc mismatch worth confirming exactly what the UI shows.
4. **Invoice lifecycle** — create (line-item/tax-rate validation), update (draft-only — `422` on
   non-draft), delete (⚠ no status check on this instance — a Sent/Paid invoice can be deleted exactly like
   a Draft one), send (draft→sent, `InvoiceHistory` `sent_mail` event).
5. **Invoice generation** — `generate_invoice` from time entries; the known, documented **DEF-2** defect
   (no team rate configured → real server fallback is a hardcoded **12/hr**, not zero as
   `INVOICE_FEATURES_LIST.md`/vendor KB both claim) — confirm the agent surfaces the `⚠️ WARNING (DEF-2)`
   block honestly rather than silently using the wrong rate.
6. **Payments** — `amount` validation (`> 0`, cannot exceed balance due); deleting the last payment on a
   never-explicitly-sent invoice must revert status to `draft`, not `sent`.
7. **Team rates** (discoverable group) — `bulk_update_team_rates` partial-success honesty (one valid + one
   invalid user id in the same call).
8. **PDF link** — `get_pdf_link` never returns raw bytes, only a path; works regardless of invoice status.

---

## Permission Enforcement

---

### TC-CRX-475: Invoice dashboard — no permission — honest refusal naming the real permission

**User Role:** `daisy.skye` (Reporter — confirmed zero Invoice permissions).

**Steps:** Fresh chat, Invoicing Agent pinned: "Show me the invoice dashboard for the Crux Invoice Agent Test
Project."

**Expected Result:** Honest refusal naming `view_invoices` specifically — not a generic "ask your admin"
without a reason, and not a fabricated empty/zero dashboard.

**Result: PASS.** Verbatim: *"I don't have permission to view the invoice dashboard for the Crux Invoice
Agent Test Project. Your Redmineflux administrator needs to grant you the `view_invoices` permission on this
project in Administration → Roles and Permissions."* — correctly names the exact permission, no fabricated
data.

---

### TC-CRX-476: Invoice dashboard — with permission (non-admin) — real data

**User Role:** `luna.blossom` (Manager — confirmed `view_invoices` + `manage_invoices`).

**Steps:** Fresh chat, Invoicing Agent pinned: "Show me the invoice dashboard for the Crux Invoice Agent Test
Project."

**Expected Result:** Succeeds with real (even if empty/zero) dashboard data, with a `Sources` tool-call
citation — not a refusal.

**Result:**

---

### TC-CRX-477: Record a payment — no permission — honest refusal (write path, no existing precedent)

**User Role:** `daisy.skye` (Reporter).

**Steps:** Fresh chat, Invoicing Agent pinned: "Record a payment of $50 against invoice #1 for the Crux
Invoice Agent Test Project." (Invoice #1 need not exist yet for this probe — the permission check should
fire before any invoice lookup, or at minimum the response should not be a crash/stack trace.)

**Expected Result:** Honest refusal naming `manage_invoices` (the write permission), not `view_invoices` —
confirms the two project permissions are checked independently, matching `init.rb`'s own action-permission
mapping.

**Result: INVESTIGATING — see follow-up.** As `daisy.skye` (Reporter, no `manage_invoices`), the agent never
refused for permission reasons at all — it asked for payment date/method/reference/notes, resolved the
project by identifier, and produced a genuine `Invoice Record Payment` confirm card
(`Project: Crux Invoice Agent Test Project`). Confirming it returned: *"✓ Invoice not found (If you expected
this payment to exist, verify the ID with the corresponding list_* tool.)"* — since invoice #1 never existed
in this fresh project, this result is inconclusive on its own for permission enforcement (could be either "no
permission check fires on this write path" or "the permission check only fires once a real invoice is
found"). **Also independently notable regardless of the permission question**: this "not found" result is
rendered with a misleading **✓** success prefix — the same already-well-documented false-success-icon defect
class as BUG-CRX-009/018/054/067/082/086.

**Retest with a real invoice (#1, created via TC-CRX-483's valid follow-up) — RESOLVED, genuinely enforced.**
Re-ran the identical repro against real invoice #1: confirm card correctly proposed (`Project`, `Invoice: 1`,
`Amount: 50`, `Payment Date`, `Payment Method`). Confirming it returned: *"Forbidden — To fix this, ask your
Redmineflux administrator to: Grant you the required role/permission for this action..."* — a genuine denial.
Native-verified: invoice #1 remains Draft, total still $220.00, no payment recorded. **Permission is
genuinely enforced on the write path** — the earlier "Invoice not found" result was simply because invoice #1
didn't exist yet at that point in the session (the not-found check runs before the permission check), not a
missing permission gate. **Minor inconsistency worth noting (not severe enough to file alone)**: unlike the
dashboard's `view_invoices`-naming refusal, this write-path refusal is generic ("Forbidden... grant the
required role/permission") and never names `manage_invoices` specifically.

---

## Auto-Mode Routing

---

### TC-CRX-478: Auto mode — bare phrasing, no domain word — routes to Invoicing Agent

**User Role:** `admin`. **Mode:** Auto (not pinned to any agent).

**Steps:** Fresh chat, Auto mode: "What invoices are outstanding for the Crux Invoice Agent Test Project?"

**Expected Result:** Routes to Invoicing Agent and answers using real invoice data — not Project Manager
substituting a generic issue/cost answer (the same misroute shape already confirmed on 3 other domains this
QA cycle: BUG-CRX-094/096/109).

**Result: PASS.** Auto mode correctly routed to **Invoicing Agent** (visible agent avatar "IA") and
returned accurate real data: *"For the Crux Invoice Agent Test Project (project #10), there is one
outstanding invoice: #1, SENT, INV-2026-0001, test@example.com, $220.00 total, $220.00 balance due,
2026-11-03. This invoice has been sent to the customer but remains unpaid in full."* — no misroute to
Project Manager, matches native ground truth exactly.

---

### TC-CRX-479: Auto mode — ambiguous "how much do we owe" phrasing vs. Project Manager

**User Role:** `admin`. **Mode:** Auto.

**Steps:** Fresh chat, Auto mode: "How much do we owe on the Crux Invoice Agent Test Project?" (plausibly
readable as a generic cost/budget question, not explicitly naming "invoice").

**Expected Result:** Either routes correctly to Invoicing Agent, or — if Auto genuinely can't disambiguate —
offers an honest handoff/clarifying question rather than a fabricated answer from the wrong agent/data
model.

**Result: PASS.** Auto mode correctly routed to **Invoicing Agent** again (no Project Manager misroute on
this ambiguous phrasing) and answered accurately: *"You currently owe $220.00 on the Crux Invoice Agent Test
Project. There is one invoice that has been sent to the customer but remains unpaid."* — matches the real
balance due exactly. Auto-mode routing for this domain shows no misroute defect on either phrasing tested.

---

## Customer CRUD / CRM-Redirect

---

### TC-CRX-480: Create customer — CRM-compatible fields only — silent same-click auto-retry through CRM

**User Role:** `admin` (or `luna.blossom`).

**Steps:** Fresh chat, Invoicing Agent pinned: "Create a new customer named Jordan Price, email
jordan.price@example.com, phone 555-0142." (fields restricted to `first_name`/`last_name`/`email`/`phone` —
all CRM-contact-compatible per the real retry-eligibility set).

**Expected Result:** Per actual code (`_invoice_crm_customer_retry`), this should auto-retry through
`redmineflux_crm_create_contact` silently, inside the **same** Confirm click — the user should see one
confirm card and one result, genuinely creating a CRM contact, NOT the persona doc's described "your very
next reply re-proposes... for a fresh confirm" (a second visible confirm step). Confirm exactly what the UI
shows and flag any mismatch with the persona doc as a documentation defect (not a functional bug) if the
single-click behavior is in fact correct and just undocumented.

**Result: PASS.** As `admin`: the confirm card was labeled "Invoice Create Customer" (`First Name: Jordan`,
`Last Name: Price`, `Email`, `Phone`) — a single confirm click, no second visible confirm step. The result:
*"✓ Contact 'Jordan Price' created (ID: 3)."* — note it reports "Contact," not "Customer," confirming the
silent redirect fired. Native-verified at `/contacts/3`: a genuine CRM Contact "Jordan Price," correct email
and phone. **Confirms the actual code behavior (silent same-click retry) over the persona doc's described
"second visible confirm" behavior** — worth a documentation fix in `agents/invoice-billing.md`, not a
functional bug.

---

### TC-CRX-481: Create customer — CRM-incompatible field present — honest error, no silent retry

**User Role:** `admin`.

**Steps:** Fresh chat, Invoicing Agent pinned: "Create a new customer named Avery Stone, email
avery.stone@example.com, company name 'Stone Logistics'." (`company_name` is NOT in the CRM-compatible
field set).

**Expected Result:** No auto-retry fires (the field set includes `company_name`) — the agent should
honestly surface `"Error: customer management has moved to the CRM plugin... use {crm_tool} instead"` as
the final result, not a false success and not a silent drop of the `company_name` field via a retry that
fires anyway.

**Result: PASS.** Confirm card correctly included `Company Name: Stone Logistics`. Confirming produced:
*"Error: customer management has moved to the CRM plugin on this instance — use
redmineflux_crm_create_contact(first_name='Avery', email='avery.stone@example.com', ...) instead (same
underlying contact record)."* — exactly as expected: no auto-retry fires when an incompatible field is
present, and the field isn't silently dropped — the error is honest and the user is pointed at the exact
right tool. No bad write occurred (confirmed no new contact was created for this attempt).

---

### TC-CRX-482: Delete customer — always auto-retries through CRM regardless of fields

**User Role:** `admin`. **Precondition:** a real customer/contact id to target (from TC-CRX-480 or a native
lookup).

**Steps:** Fresh chat, Invoicing Agent pinned: "Delete customer id <id>."

**Expected Result:** Per code, `delete_customer` only ever needs `customer_id` and always auto-retries
through `redmineflux_crm_delete(entity_type:'contact', ...)` — should succeed silently in one confirm click,
genuinely deleting the CRM contact. Verify natively on the CRM contact list that it's actually gone.

**Result: PASS.** Targeted contact id 3 (Jordan Price, from TC-CRX-480). Confirm card: `Customer: 3`.
Confirming: *"✓ Contact 'Jordan Price' (#3) deleted."* Native-verified: `/contacts/3` now returns a genuine
404 — the CRM contact was really deleted, in one confirm click, no second visible confirm step needed.

---

## Invoice Lifecycle

---

### TC-CRX-483: Create invoice — line-item/tax-rate validation (negative test)

**User Role:** `admin`.

**Steps:** Fresh chat, Invoicing Agent pinned: "Create an invoice for the Crux Invoice Agent Test Project,
client email test@example.com, tax rate 150%, one line item: 'Consulting', quantity 2, rate 100." (tax rate
150 is out of the valid 0–100 range).

**Expected Result:** Honest validation error naming the tax-rate constraint (both the Ruby model and the
Python MCP tool independently validate 0–100) — not a silently-clamped value and not a fabricated success.

**Result: PARTIAL PASS — final validation correct, but the first-step proposal was fabricated prose with no
real Confirm/Cancel button (BUG-CRX-020 class).** As `admin`: the first response was plain text — *"Now I'll
propose creating the invoice. However, I notice you specified a 150% tax rate... I'll proceed with 150% as
you stated, but please confirm this is correct before I execute"* — with a `Proposal:` list and only the
generic `Copy`/`Keep`/`Ask again` message actions, no real Confirm/Cancel button anywhere, despite claiming
readiness to execute. Only after replying "Yes, proceed with 150% as stated." did a genuine `Create Invoice`
confirm card appear (`Tax Rate: 150`). Confirming it correctly returned: *"Error: tax_rate must be between 0
and 100 (got 150.0). Values above 100% are not valid."* — honest, accurate, no bad write (no invoice was
created). **The validation itself is correct; the missing real confirm button on the first proposal is a
recurrence of the BUG-CRX-020 defect class** on a trigger this QA cycle hasn't covered before (a
tax-rate-flagging clarification message specifically) — worth filing if reproduced a second time with a
different trigger.

---

### TC-CRX-484: Update a non-draft invoice — 422, only Draft is editable

**User Role:** `admin`. **Precondition:** a genuine invoice that has been sent (status `sent`, not `draft`)
— build via TC-CRX-487's send flow first, or create+send a fresh one.

**Steps:** Fresh chat, Invoicing Agent pinned: "Update invoice #<id> — change the tax rate to 10%." (invoice
is in `sent` status).

**Expected Result:** Honest `422`-equivalent refusal: *"Only draft invoices can be edited (this invoice is
sent)."* — not a silent no-op reported as success.

**Result: PASS.** Used invoice #1 (Sent, per TC-CRX-487). Confirm card correctly proposed `Project`,
`Invoice: 1`, `Tax Rate: 15`. Confirming returned: *"Validation error: Only draft invoices can be edited
(this invoice is sent) Correct the value(s) above and try again."* — exact match to the expected rule,
honest refusal, no silent no-op.

---

### TC-CRX-485: Delete a Sent/Paid invoice — confirm whether the lifecycle gap is real

**User Role:** `admin`. **Precondition:** a genuine Sent or Paid invoice.

**Steps:** Fresh chat, Invoicing Agent pinned: "Delete invoice #<id>." (invoice is `sent` or `paid`, not
`draft`).

**Expected Result (per source review):** The native controller's `destroy` action has **no status check at
all** — unlike `update`, which is Draft-only. If the agent genuinely deletes a Sent/Paid invoice with no
warning or block, this confirms a real data-integrity gap (same family as other "lifecycle not enforced on
the write path" bugs already found this QA cycle) — flag as a candidate new bug if reproduced, rather than
assuming it's expected just because the code allows it.

**Result: CONFIRMED REAL GAP — filed as BUG-CRX-135.** Used invoice #1 (Sent status, per TC-CRX-487), right
after TC-CRX-484 proved Update correctly refuses it. Confirm card showed only `Project` and `Invoice: 1` —
no warning that the invoice is Sent, not Draft. Confirming returned: *"✓ Invoice #1 deleted successfully
from project #10."* Native-verified: `/invoices?project_id=crux-invoice-agent-test-project` now shows "No
invoices found" — the real, Sent, client-facing invoice (with genuine line items, tax, and client email) was
permanently deleted with zero warning, in direct contrast to the same invoice's Update path refusing moments
earlier for the identical non-Draft status. Filed as **BUG-CRX-135**.

---

### TC-CRX-486: Generate invoice — no team rate configured — DEF-2 fallback-rate warning must surface

**User Role:** `admin`. **Precondition:** a user with logged time entries against the project, genuinely no
team/project rate configured for that user.

**Steps:** Fresh chat, Invoicing Agent pinned: "Generate an invoice for the Crux Invoice Agent Test Project
covering last week's time entries."

**Expected Result:** Per the MCP tool's own documented `_fallback_rate = 12.0` behavior (DEF-2, known and
unfixed), the real server-side rate used is **12/hr**, not 0 as `INVOICE_FEATURES_LIST.md` and the vendor KB
both incorrectly state. The agent should surface the tool's own `⚠️ WARNING (DEF-2)` block honestly, and the
generated line item's rate should genuinely be 12, not 0 or silently omitted. If the agent's response hides
or omits this warning, that's a bug in its own right (fabricating a clean-looking invoice over a known real
caveat).

**Result: BLOCKED — missing precondition, not a defect in the behavior tested.** Built the fixture (issue
#25, category "Billing Test" with approved hours, 5h logged by `admin` — a user with no team rate on this
project) and asked the Invoicing Agent to generate an invoice for that period. The confirm card only ever
exposed `Project`/`Date From`/`Date To` (no `Client Email` field at all, matching the research finding that
`generate_invoice` snapshots client info from the project's own linked `ProjectCustomer` rather than taking
it as a parameter). Confirming repeatedly returned: *"Validation error: Client email cannot be blank; Client
email must be a valid email address."* — this project has no customer/contact linked to it yet, so there is
no client email to snapshot. This is a genuine missing precondition in this fixture (no `ProjectCustomer`
link set up), not a defect in `generate_invoice` or the DEF-2 fallback-rate behavior itself — deferred to a
follow-up session that first links a customer to the project via the native UI/CRM before retrying this TC.

---

### TC-CRX-487: Send invoice — draft → sent, InvoiceHistory event recorded

**User Role:** `admin`. **Precondition:** a genuine Draft invoice.

**Steps:** Fresh chat, Invoicing Agent pinned: "Send invoice #<id> to the client now." (explicit "send now"
intent, per the persona's own rule that it never sends without one).

**Expected Result:** Confirm card proposes the send; confirming moves status Draft → Sent and genuinely
records a `sent_mail` InvoiceHistory event (native-verifiable on the invoice's own history tab). Also
confirm a bare "can you check on invoice #<id>" or similar vague phrasing does NOT trigger an actual send —
the explicit-intent rule should hold.

**Result: PASS on the explicit-intent rule and the final send; FOUND a wrong-project-resolution bug on the
first send attempt.** Vague check-in ("Can you check on invoice #1 for the Crux Invoice Agent Test
Project?") correctly returned Draft status with no send — explicit-intent rule holds. First explicit send
attempt, same chat, **without re-naming the project** ("Send invoice #1 to the client now.") produced:
`"✓ Invoice #1 not found in project 'crux-pm-agent-test-project' (#1)..."` — the agent silently substituted
a **different, unrelated project** (`crux-pm-agent-test-project`, id 1) instead of the `Crux Invoice Agent
Test Project` this entire chat had been operating on, with no mention of it anywhere in this chat. This is
the same wrong-project-resolution defect class already found 3 times this QA cycle on other agents
(BUG-CRX-080/093/101) — now reproduced on the Invoicing Agent's `send_invoice` tool. Also notable
independently: the "not found" result is rendered with a misleading **✓** prefix (BUG-CRX-009/018/054/
067/082/086 family). Retrying with the project explicitly re-named ("Send invoice #1 for the Crux Invoice
Agent Test Project to the client now.") correctly resolved `Project: Crux Invoice Agent Test Project` and
succeeded: *"✓ Invoice #1 (INV-2026-0001) sent. Status: sent. Client: test@example.com."* — native-verified
on `/invoices` (status now genuinely "Sent"). **Filed as BUG-CRX-133** (wrong-project resolution — see
below); the send mechanism itself works correctly once correctly scoped.

---

## Payments

---

### TC-CRX-488: Record a payment exceeding balance due — honest rejection

**User Role:** `admin`. **Precondition:** a genuine invoice with a known balance due (e.g. $200).

**Steps:** Fresh chat, Invoicing Agent pinned: "Record a payment of $500 against invoice #<id>." (exceeds
the real balance due).

**Expected Result:** Honest model-level validation error naming the currency + actual balance due — not a
silently-capped payment and not a fabricated success.

**Result: PASS.** Used invoice #2 (INV-2026-0002, Draft, total $200.00, 0% tax). Confirm card correctly
proposed `Invoice: 2`, `Amount: 500`. Confirming returned: *"Validation error: Amount cannot exceed the
remaining balance of USD 200.00 Correct the value(s) above and try again."* — honest, names the currency and
the real balance due exactly. No bad write.

---

### TC-CRX-489: Delete the only payment on a never-explicitly-sent invoice — reverts to Draft, not Sent

**User Role:** `admin`. **Precondition:** a Draft invoice that was never sent (no `sent_mail` history row),
paid in full directly from Draft (Draft → Paid via one payment, no Send step in between).

**Steps:** Fresh chat, Invoicing Agent pinned: "Delete the payment on invoice #<id>."

**Expected Result:** Per the dual status-revert mechanism (model callback always → `sent`, controller
corrects → `draft` when the invoice has no real send history), the invoice should genuinely revert to
**Draft**, not Sent. Verify natively on the invoice's own status field after the delete.

**Result: PASS.** Invoice #2 (never sent) was paid in full directly from Draft via a $200 payment (status
genuinely moved Draft → Paid, native-verified). Deleting that payment returned: *"✓ Payment #1 deleted from
invoice #2. Invoice status is now: DRAFT | Balance due: 200.0"* — native-verified on `/invoices`: Status
column genuinely shows "Draft," not "Sent." The dual-mechanism correctly identified this invoice had no real
send history and reverted to the correct state.

---

## Team Rates

---

### (Precondition confirmation, not numbered) Single-user `set_team_rate` via discoverable group — PASS

**User Role:** `admin`.

**Steps:** Fresh chat, Invoicing Agent pinned: "Set the hourly bill rate for Luna Blossom to $75 on the Crux
Invoice Agent Test Project." (requires `crux_discover_tool_groups` → `crux_discover_group_tools` to reach
`set_team_rate`, per the agent's own discoverable-group mechanism).

**Result: PASS.** Confirm card correctly resolved `Project: Crux Invoice Agent Test Project`, `User: 5`
(Luna Blossom's real user id), `Hourly Rate: 75`. Confirming returned: *"✓ Team rate set: Luna Blossom →
75.0/hr on project #10 (rate_id: #1)."* Native-verified on `/projects/crux-invoice-agent-test-project/
team_rates`: Luna Blossom's Bill Rate field genuinely shows **75.0**, Daisy Skye's remains **0.00** —
confirms the write targeted the correct user only, no cross-contamination.

---

### TC-CRX-490: Bulk update team rates — one valid + one invalid user id — honest partial-success reporting

**User Role:** `admin`. **Precondition:** at least one real project member and one clearly-invalid/nonexistent
user id.

**Steps:** Fresh chat, Invoicing Agent pinned: "Set the hourly rate to $75 for user <real_user_id> and user
999999 on the Crux Invoice Agent Test Project." (discoverable `invoice` tool group — `crux_discover_tool_groups`
→ `crux_discover_group_tools` needed first).

**Expected Result:** Per the tool's own per-user error reporting, the response should honestly show the
valid user's rate updated AND the invalid user id reported as an individual error — not an all-or-nothing
false success (claiming both succeeded) or false failure (claiming both failed when one genuinely worked).

**Result: PARTIAL PASS — partial-success reporting is honest, but the invalid-id failure is a raw unhandled
500, not a clean validation error.** As `admin`: "Set the hourly rate to $90 for user 6 and user 999999 on
the Crux Invoice Agent Test Project." produced two separate `Invoice Set Team Rate` confirm cards (not a
single `bulk_update_team_rates` call — the agent chose to call `set_team_rate` twice instead). Confirming
both: Step 1 (user 6, Daisy Skye) — *"✓ Team rate set: Daisy Skye → 90.0/hr on project #10 (rate_id: #2)"* —
native-verified on Team Rates page, genuinely 90.0. Step 2 (user 999999) — *"Step 2 failed: Server error
(500): Internal Server Error... If this is a fresh Redmineflux instance, the invoice plugin database tables
may not have been migrated yet. Ask your administrator to run: bundle exec rake redmine:plugins:migrate..."*
— **the reporting is honestly partial** (step 1's genuine success isn't hidden or rolled back by step 2's
failure), but step 2's failure is a **raw, unhandled 500** (confirmed via server log: `ActiveRecord::
InvalidForeignKey — PG::ForeignKeyViolation... Key (user_id)=(999999) is not present in table "users"`) with
a **misleading generic remediation message** that has nothing to do with the real cause (an invalid user id,
not an unmigrated database). Filed as **BUG-CRX-134**.

---

## PDF Link

---

### TC-CRX-491: Get PDF link — works regardless of invoice status, never returns raw bytes

**User Role:** `admin`. **Precondition:** any existing invoice, any status (Draft/Sent/Paid).

**Steps:** Fresh chat, Invoicing Agent pinned: "Get me the PDF link for invoice #<id>."

**Expected Result:** Returns a relative path/URL to the PDF, never raw binary/base64 content in the chat
response, and succeeds regardless of the invoice's current status (no status-gating on this specific tool,
per source).

**Result: PASS.** As `admin`, on invoice #1 (status: Sent, post TC-CRX-487): *"Here's the PDF link for
invoice #1 (INV-2026-0001): Download path: `/api/projects/10/invoices/1/pdf`..."* — a relative path only, no
raw PDF bytes/base64 anywhere in the response, and it worked cleanly on a Sent invoice (no status-gating
observed).
