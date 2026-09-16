# Test Cases — Redmineflux Invoice — PDF & Email Templates, Global View, Dashboard, Permissions

> Source: vendor KB — "How to Manage PDF Templates", "How to Manage Email Templates",
> "How to Use the Global Invoice View", "How to Use the Invoice Dashboard", "Permissions", FAQ Q5.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Invoice Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_invoice_qa

## Navigation methodology

Templates: Administration → Plugins → Redmineflux Invoice → Configure → **PDF Templates** / **Email Templates**.
Global view and dashboard: top navigation → **Invoices**.

> **Templates are ERB executed on the server.** Unlike the other plugins' HTML templates, these are code. That
> makes TC-INV-605 a genuine server-side execution question, not just an escaping one.

---

## Functional Cases — PDF templates

---

### TC-INV-601: The default template produces a valid PDF

**User Role:** Admin
**Steps:**
1. Generate a PDF from an invoice using the shipped default template.

**Expected Result:**
- A well-formed PDF opens, showing the company details, customer, line items, adjustments and total.
- **Every figure matches the on-screen invoice**, including the currency symbol and the rounded totals — the PDF is
  the copy the client keeps.

---

### TC-INV-602: Create a custom template

**User Role:** Admin
**Steps:**
1. PDF Templates → **New Template** → name + HTML/ERB content → Preview → Save.
2. Generate an invoice PDF using it.

**Expected Result:**
- The custom layout is used and renders correctly.

---

### TC-INV-603: Preview reflects the real output

**User Role:** Admin
**Steps:**
1. Preview a template, then generate a real PDF from the same template.

**Expected Result:**
- They match. A preview that misrepresents the output makes the feature useless for its purpose.

---

### TC-INV-604: Copy a template

**User Role:** Admin
**Steps:**
1. Click **Copy** on a template; edit the copy; save.

**Expected Result:**
- A duplicate is created and is independently editable — changing the copy must not affect the original.

---

### TC-INV-605: ERB templates cannot be used to execute arbitrary code

**User Role:** Admin
**Steps:**
1. Create a template containing an ERB expression that attempts to read a system path, an environment variable, or
   run a shell command.
2. Also create one with deliberately malformed ERB.

**Expected Result:**
- Record precisely what is permitted.
- **This is the sharpest case in the suite.** ERB rendered server-side is code execution by design; the question is
  whether it runs in a restricted context. If a template can read arbitrary files or the environment, then anyone
  who can edit templates can read the instance's secrets — including the Stripe secret key stored by this same
  plugin. That is Critical, and it raises the stakes on TC-INV-909 (who can reach the configuration page).
- Malformed ERB must produce a clear error rather than a 500 that leaves invoices ungeneratable.

---

### TC-INV-606: PDF generation failure is loud, not silent

**User Role:** Admin
**Steps:**
1. Make the PDF binary unavailable and attempt to generate a PDF, and to send an email with the PDF attached.

**Expected Result:**
- A clear, visible error naming the cause, and an entry in the log.
- **The email must not be sent with the attachment silently missing.** This repo has already seen exactly that
  pattern cost a whole feature on another plugin — a report emailed as PDF arrived with no attachment because the
  renderer was absent and the failure was swallowed. Treat a silent send as High severity.

---

### TC-INV-607: All documented macros resolve

**User Role:** Admin
**Steps:**
1. Use `{{id}}`, `{{year}}`, `{{month}}`, `{{project_identifier}}` and `{{random_digit}}` in a template; generate
   PDFs for invoices in two different projects and two different months.

**Expected Result:**
- Each macro resolves to the correct value, per invoice.
- **`{{random_digit}}` must actually vary** between generations; a "random" component that is constant would
  defeat whatever uniqueness it exists to provide.
- An unrecognised macro renders literally or errors clearly — it must not blank the surrounding content.

---

## Functional Cases — Email templates

---

### TC-INV-608: Create and use an email template

**User Role:** Admin
**Steps:**
1. Email Templates → **New Template** → name, subject, body, footer → Preview → Save.
2. Send an invoice and inspect the received email.

**Expected Result:**
- The subject, body and footer match the template.

---

### TC-INV-609: Placeholders resolve

**User Role:** Admin
**Steps:**
1. Use the client name, invoice number and due date placeholders; send an invoice.

**Expected Result:**
- All three resolve to the correct values for that invoice.
- **An unresolved placeholder visible in an email to a client is embarrassing and immediately visible** — check
  the literal received text, not the preview.

---

### TC-INV-610: Attach the PDF option

**User Role:** Admin
**Steps:**
1. Enable the attach-PDF option and send; then disable it and send again.

**Expected Result:**
- The PDF is attached only when enabled, and the attachment opens and matches the invoice.
- Paired with TC-INV-606: if PDF generation fails while this option is on, the send must not proceed silently
  without the attachment.

---

### TC-INV-611: Preview an email template

**User Role:** Admin
**Steps:**
1. Use **Preview** and compare against a real send.

**Expected Result:**
- They match, including placeholder resolution.

---

### TC-INV-612: Template validation

**User Role:** Admin
**Steps:**
1. Save templates with a blank name, a blank subject, and a duplicate name.

**Expected Result:**
- Blank name and subject are rejected — an email with no subject reaches a client looking like spam.
- Duplicates are rejected or made distinguishable.

---

### TC-INV-613: Deleting a template in use

**User Role:** Admin
**Steps:**
1. Delete a template currently selected as the default, then send an invoice.

**Expected Result:**
- Either the deletion is refused, or a default is applied cleanly.
- **Sending must not break** because a template was removed — that would block billing entirely.

---

## Functional Cases — Global view and dashboard

---

### TC-INV-701: The global view lists invoices across projects

**User Role:** User with `view_invoices` on several projects
**Steps:**
1. Top navigation → **Invoices**.

**Expected Result:**
- Invoices from every project where the user holds `view_invoices` — and none from projects where they do not.

---

### TC-INV-702: Global filters

**User Role:** Same
**Steps:**
1. Filter by status, customer, date range and project, individually and combined.

**Expected Result:**
- Each narrows correctly and combinations intersect.

---

### TC-INV-703: Create and send from the global view

**User Role:** User with `manage_invoices`
**Steps:**
1. Create a new invoice and send an existing one from the global view.

**Expected Result:**
- Both work identically to the project view, and the project-scoped permission is still enforced per invoice.

---

### TC-INV-704: Dashboard KPIs are accurate

**User Role:** User with `view_invoices`
**Steps:**
1. Open the dashboard and compare its three figures against the invoice list:
   total **Paid**, total **awaiting payment (Sent)**, total **unpaid and draft**.

**Expected Result:**
- Each equals the sum of the matching invoices.
- **Cancelled invoices must not be counted** in any of the three — including a cancelled invoice in "unpaid" would
  overstate outstanding revenue.

---

### TC-INV-705: Project and global dashboards agree

**User Role:** User with `view_invoices`
**Steps:**
1. Compare a single project's dashboard figures against the global dashboard filtered to that project.

**Expected Result:**
- They match. Two different code paths computing the same figure is exactly where a discrepancy hides.

---

### TC-INV-706: Partial payments in the KPIs

**User Role:** User with `view_invoices`
**Steps:**
1. With a part-paid invoice, check how it is represented.

**Expected Result:**
- Record whether the full value sits in "awaiting payment" or only the outstanding balance.
- Either is defensible, but it must be consistent and stated — these are the figures a business reads its cash
  position from.

---

## Negative Cases — permissions

---

### TC-INV-901: `view_invoices` is read-only

**User Role:** User with `view_invoices` only
**Steps:**
1. Confirm invoices, the billing report and team rates are viewable.
2. Confirm no create, edit, generate, send, payment or rate-edit controls appear.
3. Send each of those six requests **directly**.

**Expected Result:**
- Viewing works; all six direct requests refused with 403.
- The KB scopes this permission to viewing invoices, the billing report and team rates — note that it **does**
  include seeing colleagues' hourly rates, which is worth recording as an intended disclosure.

---

### TC-INV-902: `manage_invoices` does not reach plugin configuration

**User Role:** User with `manage_invoices`
**Steps:**
1. Request the plugin configuration URL directly and attempt to read the Stripe keys and edit a PDF template.

**Expected Result:**
- Refused with 403.
- **Two separate escalations are blocked here**: reading the Stripe secret key, and editing an ERB template that
  runs server-side (TC-INV-605). Either would turn the broadest invoice permission into far more than billing
  access. High severity if reachable.

---

### TC-INV-903: `manage_customers` is global in scope

**User Role:** User with `manage_customers` but no project invoice permissions
**Steps:**
1. Confirm they can create, edit and delete customers.
2. Confirm they **cannot** view any project's invoices, billing report or team rates — check the endpoints
   directly.

**Expected Result:**
- Customer CRUD works; invoice access refused.
- Record clearly that this permission reaches **every customer on the instance**, including other departments'
  clients and their tax IDs — a single grant with an organisation-wide footprint.

---

### TC-INV-904: Project scoping of invoice permissions

**User Role:** User with `manage_invoices` on project A only
**Steps:**
1. Confirm project A's invoices are manageable.
2. Request a project B invoice URL, and send edit, send and payment requests for it **directly**.

**Expected Result:**
- All refused. Project-scoped permissions must be evaluated against the **target invoice's** project, not merely
  against holding the permission somewhere.

---

### TC-INV-905: Sending requires `manage_invoices`

**User Role:** User with `view_invoices` only
**Steps:**
1. Send the send-invoice request directly.

**Expected Result:**
- Refused.
- **Sending emails a real client and permanently locks the document** (TC-INV-419), so an unguarded send endpoint
  causes irreversible external consequences, not just a data change.

---

### TC-INV-906: Non-member cannot reach invoices

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project invoice list, an invoice detail URL, the billing report and the team rates directly.

**Expected Result:**
- All refused, with no amounts, customer details or hourly rates in any response body.
- **Team rates are colleagues' pay-relevant data** and invoices are commercial information — both are more
  sensitive than ordinary issue data.

---

### TC-INV-907: Anonymous users reach nothing but the payment link

**User Role:** Anonymous (logged out)
**Steps:**
1. Request the invoice list, an invoice detail page, the billing report, the dashboard and the customer list with
   no session.

**Expected Result:**
- All refused.
- **The Stripe payment link must be the only unauthenticated surface** (TC-INV-508). Any other page reachable
  without a session is a leak — and once a token-based bypass exists in the same controller, it is a realistic
  implementation mistake.

---

### TC-INV-908: The global view does not widen visibility

**User Role:** User with `view_invoices` on project A only
**Steps:**
1. Open the global view and apply the broadest possible filters.

**Expected Result:**
- Only project A invoices are returned, and the dashboard KPIs count only those.
- A filter must never become a route to other projects' financial data — the classic way an aggregate view leaks,
  and here the leaked data is revenue.

---

### TC-INV-909: Template and configuration access is admin-only

**User Role:** Every non-admin role in turn
**Steps:**
1. Send PDF-template and email-template create, edit and delete requests directly.

**Expected Result:**
- All refused.
- Template editing is effectively code execution (TC-INV-605) and controls the content of documents sent to
  clients under the company's name — both reasons to treat any access here as High severity.

---

### TC-INV-910: Permission revocation takes effect without re-login

**User Role:** Admin + affected user
**Steps:**
1. Remove `manage_invoices` while the user has a Draft open in the editor.
2. Have them save, and then attempt to send, without logging out.

**Expected Result:**
- Both refused. Permissions are evaluated per request.

---

### TC-INV-911: Closed and archived projects

**User Role:** User with `manage_invoices`
**Steps:**
1. Close a project: attempt to view, edit, generate and send, at the UI and the endpoint.
2. Archive it and check whether its invoices still appear in the global view and the dashboard totals, and whether
   any payment link still functions.

**Expected Result:**
- Closed projects are read-only; archived projects are inaccessible, endpoints included.
- **An archived project whose payment link still accepts money would be a serious finding** — the organisation
  would be collecting against work it has formally closed.

---

### TC-INV-912: Audit of who did what

**User Role:** Admin
**Steps:**
1. After a full cycle — generate, edit, send, record payment, cancel — look for any record of which user performed
   each action.

**Expected Result:**
- Record what exists.
- **Invoices are financial documents**; an absence of attribution for sending and for recording payments is a
  governance finding worth raising, since those two actions determine what a client is asked to pay and whether a
  debt is considered settled.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
