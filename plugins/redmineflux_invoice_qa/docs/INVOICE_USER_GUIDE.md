# User Guide — Redmineflux Invoice Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/invoice/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

Enable the **Invoice** module on a project and an **Invoice** tab appears in its menu. A **Customer** tab and an
**Invoices** entry sit in the top navigation for cross-project work. All templates, company details and gateway
credentials live in the plugin configuration under Administration.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Plugin configuration | Administration → Plugins → Redmineflux Invoice → Configure | Company info, invoice settings, PDF and email templates, Stripe |
| Project Invoice tab | Project → Invoice | Invoices for one project |
| Project billing settings | Project → Invoice → Settings | Customer, project rate, billing activities |
| Team Rates | Project → Invoice → Team Rates | Per-user hourly rates, Bulk Update |
| Billing Report | Project → Invoice → Billing Report | Preview billable hours, generate an invoice |
| Invoice detail | An invoice | Line items, adjustments, send, payments |
| Customer tab | Top navigation → Customer | Global customer database |
| Global invoices | Top navigation → Invoices | Cross-project list and dashboard |

## Step-by-Step Workflows

### Workflow 1: Configure the plugin (admin)

1. Administration → **Plugins** → Redmineflux Invoice → **Configure**.
2. **Company Information** — name, street/city/state/zip/country, logo, billing email, phone, tax and GST IDs.
3. **Invoice Settings** — prefix (default `INV`, producing `INV-2026-0001`), currency symbol, default payment
   terms (default `Net 30`).
4. **PDF Templates** — use the default or create HTML/ERB templates with macros.
5. **Email Templates** — subject, body, footer, placeholders, optional PDF attachment.
6. **Payment Gateway** — enable Stripe and enter the Publishable Key, Secret Key and Webhook Secret.

### Workflow 2: Set a project up for billing

1. Project → **Settings** → **Modules** → enable **Invoice** → Save.
2. Project → **Invoice** tab → **Settings**:
   - **Customer** — the billing customer for this project.
   - **Project Hourly Rate** — used when a user has no specific rate.
   - **Billing Activities** — which time-entry activities are billable.
3. Project → Invoice → **Team Rates** — set per-user rates; **Bulk Update** changes them all at once.

Rate fallback: the user's team rate, else the project rate, else **zero** — which must then be edited by hand.

### Workflow 3: Create a customer

1. Top navigation → **Customer** → **New Customer**.
2. Enter name, company, email, phone, address and tax ID → Save.
3. To deactivate rather than delete: open the customer → **Edit** → set status **Inactive** → Save.

A customer linked to any project cannot be deleted — unlink it everywhere first.

### Workflow 4: Generate an invoice from time entries

1. Project → **Invoice** → **Billing Report**.
2. Select a date range and review the billable hours grouped by user.
3. Click **Generate Invoice**.

The plugin aggregates the time entries in that range, looks up each user's rate, and creates **one line item per
user**. The invoice opens in **Draft**.

### Workflow 5: Create an invoice manually

1. Project → Invoice → **New Invoice** → fill in the details → Save.

### Workflow 6: Adjust, send and get paid

1. While the invoice is in **Draft**, click **Edit** to change line items, rates and other details.
2. In **Adjustments**, add a row with a label (e.g. VAT, Discount), a percentage, and whether it is a tax or a
   discount. **Taxes are applied after discounts.**
3. Click **Send Email**. The invoice is emailed to the linked customer, its status becomes **Sent**, and it can no
   longer be edited.
4. In **Payments**, record the amount, date and method. When recorded payments equal the invoice total, the status
   becomes **Paid** automatically.
5. If Stripe is enabled, the invoice carries a payment link the customer can use; the webhook records the payment
   and updates the status.

### Workflow 7: Work across projects

1. Top navigation → **Invoices** — every invoice in projects where you hold `view_invoices`.
2. Filter by status, customer, date range or project; create and send from here too.
3. Click **Dashboard** for the KPI summary: total paid, total awaiting payment, total unpaid and draft.

## Invoice Status Reference

| Status | Meaning | Editable |
|---|---|---|
| Draft | Newly created, under review | **Yes** |
| Sent | Emailed to the client | No |
| Paid | Payment fully recorded | No |
| Cancelled | Voided | No |

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Generate Invoice** | Billing Report | Creates a Draft from the previewed data |
| **Bulk Update** | Team Rates | Updates every rate at once |
| **Adjustments** | Draft invoice edit | Tax and discount rows |
| **Send Email** | Invoice detail | Irreversible: sends and locks |
| **Payments** section | Invoice detail | Manual recording |
| Payment link | Invoice (Stripe enabled) | Customer-facing, no Redmine login |
| **Copy** / **Preview** | PDF and email templates | |

## Notes & Known Behaviour

- **Sending is a one-way door.** It dispatches the invoice to a real customer address and locks it permanently.
- **Taxes are calculated after discounts** — the order is fixed and affects the total.
- **A missing rate becomes zero, not an error.** An invoice can be generated, sent and paid while under-billing,
  with nothing in the UI to flag it.
- **Billing activities must match the activities actually used on time entries**, or the Billing Report shows no
  billable hours at all and looks broken when it is merely misconfigured.
- **One customer per project.** Billing several clients from one project is not supported.
- **PDF output needs an external binary** — wkhtmltopdf, PDFKit, Grover (Chromium) or Prawn.
- **Stripe keys are live credentials.** Use test-mode keys on any QA instance, and never real card data.
