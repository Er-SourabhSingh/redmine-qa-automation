# Plugin Requirements — Redmineflux Invoice Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/invoice/ (official vendor knowledge base, ingested
> 2026-09-15).

## Overview

A billing and invoicing plugin that turns Redmine **time entries** into invoices. It manages a global customer
database, per-project billing settings, per-user hourly rates, the invoice lifecycle from Draft to Paid, PDF and
email templates, and optional online payment collection through Stripe.

Two properties set the stakes higher than for any other plugin in this set:

- **Its outputs are financial documents.** A wrong rate, a mis-summed line item or a tax applied in the wrong order
  produces an invoice that is sent to a paying client. Arithmetic defects here are not cosmetic.
- **It stores payment-gateway credentials** (Stripe secret key and webhook secret) and exposes a customer-facing
  payment link, which puts part of its surface outside Redmine's authentication entirely.

## Key Features

1. **Invoice lifecycle** — Draft → Sent → Paid → Cancelled. **Only Draft is editable.**
2. **Auto-generation from time entries** — aggregate a date range, look up each user's rate, create one line item
   per user.
3. **Billing Report** — preview billable hours and amounts per user before generating.
4. **Team rates** — per-user, per-project hourly rates, with a **Bulk Update**.
5. **Rate fallback order** — user team rate → project billing rate → **zero**, which must then be edited manually.
6. **Customers** — global database (name, company, email, phone, address, tax ID), linked one-to-one to a project;
   editable, deactivatable, and **not deletable while linked to a project**.
7. **Project billing settings** — customer, project hourly rate, and the **billing activities** whose time entries
   are billable.
8. **Adjustments** — tax and discount rows by label and percentage. **Taxes are applied after discounts.**
9. **Send by email** — uses the configured template, sets status to **Sent**, and locks the invoice.
10. **Payments** — manual recording (amount, date, method); status becomes **Paid** automatically when payments
    equal the invoice total; Stripe webhooks can record them automatically.
11. **Stripe** — publishable key, secret key, webhook secret; a payment link on each invoice.
12. **PDF templates** — a default plus custom HTML/ERB templates with macros `{{id}}`, `{{year}}`, `{{month}}`,
    `{{project_identifier}}`, `{{random_digit}}`; copy and preview.
13. **Email templates** — subject, body, footer, dynamic placeholders (client name, invoice number, due date),
    optional PDF attachment, preview.
14. **Company information** — name, address, logo, billing email, phone, tax and GST IDs, shown on every invoice.
15. **Invoice settings** — prefix (default `INV`, producing e.g. `INV-2026-0001`), currency symbol, default
    payment terms (default `Net 30`).
16. **Global invoice view** — cross-project list with filters by status, customer, date range and project.
17. **Dashboard** — total paid, total awaiting payment (Sent), and total unpaid/draft, per project and globally.

## Permissions Matrix

Published by the vendor:

| Permission | Scope | Covers |
|---|---|---|
| `view_invoices` | Project | View invoices, billing report, team rates |
| `manage_invoices` | Project | Full invoice CRUD, generate, send, manage team rates |
| `manage_customers` | Global | Customer full CRUD |

Note `manage_customers` is **global**, not per project — a single grant reaches the whole customer database
including every client's contact details and tax IDs.

| Action | Admin | manage_invoices | view_invoices | manage_customers | Plain member | Non-member | Anonymous |
|--------|-------|-----------------|---------------|------------------|--------------|------------|-----------|
| View project invoices | | | | | | | |
| Create / edit a draft invoice | | | | | | | |
| Generate from the billing report | | | | | | | |
| Send an invoice | | | | | | | |
| Record a payment | | | | | | | |
| View / edit team rates | | | | | | | |
| Create / edit / delete customers | | | | | | | |
| Global invoice view and dashboard | | | | | | | |
| Change plugin configuration (incl. Stripe keys) | | | | | | | |

## Known Constraints

- **Only Draft invoices are editable.** Sending locks the invoice permanently (FAQ Q2).
- **One customer per project** (FAQ Q6) — multiple clients require separate projects or manual invoices.
- **A customer linked to any project cannot be deleted** (FAQ Q7); unlink everywhere first.
- **Taxes are applied after discounts** — the ordering is stated and is directly checkable arithmetic.
- **If neither a user rate nor a project rate exists, the line rate is zero** and must be corrected by hand. A
  zero-rate line is a silent under-billing hazard rather than an error.
- **Payments are manual unless Stripe webhooks are configured** (FAQ Q3).
- **PDF generation needs at least one of** `wkhtmltopdf`, PDFKit, Grover (Chromium) or Prawn installed. Without
  one, PDF output cannot work — and this repo has already seen a report silently arrive with no attachment
  because Grover/Node was missing on another plugin.
- **Billing activities must match the activities actually used on time entries**, or billable hours appear as zero.
- Declared compatibility: Redmine 5.0.x, 5.1.x, 6.0.x.

## Installation Prerequisites

1. Working Redmine 5.0+ with `redmineflux_invoice` in `plugins/`.
2. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. **A PDF binary installed** — otherwise every PDF case is untestable and will look like a plugin defect.
4. A working outbound mail path, with Administration → Settings → General → **Host name and path** verified, or
   the links in invoice emails will be wrong.
5. **Stripe test-mode credentials only.** Never configure live keys on a QA instance, and never use real card
   data. Record which mode is in use alongside every payment result.
6. Time entries spanning several users, activities and dates, with known hours — the arithmetic cases are
   meaningless without a hand-calculable expected total.
