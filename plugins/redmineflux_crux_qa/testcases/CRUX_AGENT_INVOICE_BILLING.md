# Test Cases — Redmineflux Crux — Invoicing Agent (Invoice & Billing plugin) Full CRUD

> **Execution started and first pass completed 2026-11-03.** New suite — Invoicing Agent had no dedicated
> Crux-chat test coverage until now (the native `redmineflux_invoice` plugin has its own separate QA suite
> under `plugins/redmineflux_invoice_qa/testcases/`, which covers the native UI, not the chat agent).
>
> **8 of 17 TCs executed this pass — 2 new bugs found, both filed:**
> - **BUG-CRX-132** (High) — `create_invoice` never sets/warns about `due_date`; viewing the resulting
>   invoice's native show page genuinely crashes with a 500 (`NoMethodError: undefined method 'strftime' for
>   nil`) — 100% reproducible, reachable via the agent and the native UI alike (Due Date isn't required on
>   either path).
> - **BUG-CRX-133** (Medium-High) — "Send Invoice" silently targeted a different, unrelated project when the
>   current message didn't re-name it — the same wrong-project-resolution defect class already found on 3
>   other domains this QA cycle (BUG-CRX-080/093/101), now a 4th domain.
>
> **Everything else tested cleanly**: the no-permission dashboard refusal correctly names `view_invoices`
> specifically; the no-permission payment-write path is genuinely enforced once a real invoice exists
> (confirmed `Forbidden`, no bad write) — the first attempt's "not found" was simply because the invoice
> didn't exist yet, not a missing permission gate; both Auto-mode routing phrasings tested (bare and
> ambiguous) correctly reached Invoicing Agent with accurate real data, no misroute; tax-rate validation
> (0–100) is correctly enforced server-side (though the first-step proposal was fabricated prose with no real
> Confirm button — a BUG-CRX-020-class recurrence, not severe enough to file alone on a single instance);
> `get_pdf_link` returns a relative path only, no raw bytes, works regardless of status.
>
> **Not yet executed this pass** (deferred to a follow-up session): TC-CRX-480/481/482 (CRM-redirect customer
> CRUD), TC-CRX-484 (update non-draft invoice), TC-CRX-485 (delete a Sent/Paid invoice — the documented
> no-status-check lifecycle gap), TC-CRX-486 (DEF-2 fallback-rate warning on `generate_invoice`),
> TC-CRX-488/489 (payment amount validation / revert-to-Draft on last-payment delete), TC-CRX-490 (bulk team
> rate update partial-success honesty).
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

**Result:**

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

**Result:**

---

### TC-CRX-482: Delete customer — always auto-retries through CRM regardless of fields

**User Role:** `admin`. **Precondition:** a real customer/contact id to target (from TC-CRX-480 or a native
lookup).

**Steps:** Fresh chat, Invoicing Agent pinned: "Delete customer id <id>."

**Expected Result:** Per code, `delete_customer` only ever needs `customer_id` and always auto-retries
through `redmineflux_crm_delete(entity_type:'contact', ...)` — should succeed silently in one confirm click,
genuinely deleting the CRM contact. Verify natively on the CRM contact list that it's actually gone.

**Result:**

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

**Result:**

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

**Result:**

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

**Result:**

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

**Result:**

---

### TC-CRX-489: Delete the only payment on a never-explicitly-sent invoice — reverts to Draft, not Sent

**User Role:** `admin`. **Precondition:** a Draft invoice that was never sent (no `sent_mail` history row),
paid in full directly from Draft (Draft → Paid via one payment, no Send step in between).

**Steps:** Fresh chat, Invoicing Agent pinned: "Delete the payment on invoice #<id>."

**Expected Result:** Per the dual status-revert mechanism (model callback always → `sent`, controller
corrects → `draft` when the invoice has no real send history), the invoice should genuinely revert to
**Draft**, not Sent. Verify natively on the invoice's own status field after the delete.

**Result:**

---

## Team Rates

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

**Result:**

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
