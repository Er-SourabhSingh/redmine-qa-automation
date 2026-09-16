# Features List — Redmineflux Invoice Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/invoice/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Folder `redmineflux_invoice`, `bundle install`, migrate, restart | TC-INV-101 – 103 |
| 2 | PDF binary dependency | wkhtmltopdf / PDFKit / Grover / Prawn | TC-INV-104, 606 |
| 3 | Company information | Name, address, logo, email, phone, tax and GST IDs | TC-INV-105, 106 |
| 4 | Invoice settings | Prefix (`INV`), currency symbol, payment terms (`Net 30`) | TC-INV-107 – 110 |
| 5 | Stripe credentials | Publishable, secret and webhook keys | TC-INV-111, 501 – 507 |
| 6 | Invoice project module | Settings → Modules → Invoice | TC-INV-112, 113 |
| 7 | Project billing settings | Customer, project hourly rate, billing activities | TC-INV-301 – 305 |
| 8 | Team rates | Per-user rates; Bulk Update | TC-INV-306 – 310 |
| 9 | Rate fallback | User rate → project rate → zero | TC-INV-311 – 313 |
| 10 | Customer CRUD | Name, company, email, phone, address, tax ID | TC-INV-201 – 206 |
| 11 | Customer deactivation | Status Inactive instead of deletion | TC-INV-207, 208 |
| 12 | Deletion protection | Linked customers cannot be deleted | TC-INV-209 |
| 13 | One customer per project | Documented limitation | TC-INV-210 |
| 14 | Manual invoice creation | New Invoice form | TC-INV-401, 402 |
| 15 | Billing Report | Preview billable hours by user for a date range | TC-INV-403 – 406 |
| 16 | Auto-generate from time entries | One line item per user, rate × hours | TC-INV-407 – 410 |
| 17 | Edit in Draft only | Line items, rates, adjustments | TC-INV-411, 412 |
| 18 | Tax and discount adjustments | Label, percentage, type; **tax applied after discount** | TC-INV-413 – 416 |
| 19 | Send by email | Sets status Sent and locks the invoice | TC-INV-417 – 420 |
| 20 | Status lifecycle | Draft → Sent → Paid → Cancelled | TC-INV-421 – 424 |
| 21 | Manual payment recording | Amount, date, method | TC-INV-501 – 503 |
| 22 | Auto-Paid on full payment | Status changes when payments equal the total | TC-INV-504, 505 |
| 23 | Stripe payment link | Customer-facing checkout | TC-INV-506 – 509 |
| 24 | Stripe webhook | Records payment and updates status automatically | TC-INV-510 – 512 |
| 25 | PDF templates | Default plus custom HTML/ERB; copy; preview | TC-INV-601 – 607 |
| 26 | PDF macros | `{{id}}`, `{{year}}`, `{{month}}`, `{{project_identifier}}`, `{{random_digit}}` | TC-INV-608 |
| 27 | Email templates | Subject, body, footer, placeholders, attach PDF, preview | TC-INV-609 – 614 |
| 28 | Global invoice view | Cross-project list with filters | TC-INV-701 – 705 |
| 29 | Dashboard KPIs | Paid, awaiting payment, unpaid/draft totals | TC-INV-706 – 710 |
| 30 | Permissions | `view_invoices`, `manage_invoices`, `manage_customers` | TC-INV-901 – 912 |
| 31 | Uninstallation | Migrate `VERSION=0`, remove folder, restart | TC-INV-114 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **This plugin produces documents that are sent to paying clients.** Arithmetic is the deliverable, not a detail.
  The cases that matter most are the ones where a number can be wrong while the page still looks correct:
  - **TC-INV-414 — tax after discount.** The KB states the order explicitly, so the expected total is
    hand-calculable. Applying tax before the discount changes what a client is billed, and both orderings produce a
    plausible-looking invoice.
  - **TC-INV-408 — generated line items.** Hours × rate per user must reconcile with the Billing Report *and* with
    core Redmine's spent-time report. Three independent sources agreeing is the only real proof.
  - **TC-INV-311 – 313 — the rate fallback chain.** A missing rate silently yields **zero**, so an invoice can be
    generated, sent and paid while under-billing entirely. Nothing in the UI flags it as an error.
- **Sending is irreversible** (TC-INV-419). A send both locks the invoice and dispatches it to a real customer
  address — so the send-permission case (TC-INV-905) protects against more than data loss.
- **Stripe credentials are the most sensitive data in the whole plugin set.** TC-INV-111 checks whether the secret
  key and webhook secret are echoed back into the configuration page, and TC-INV-902 checks who can read them.
  A leaked secret key permits charges against the organisation's Stripe account.
- **The Stripe payment link is customer-facing and unauthenticated by design** (TC-INV-507, 508). It is the only
  route into this plugin that does not pass through Redmine login, which makes "what does that page disclose" and
  "can the token reach another invoice" the two questions that matter.
- **Webhooks write financial state from outside** (TC-INV-511). A webhook endpoint that does not verify the
  signing secret would let anyone mark any invoice paid — Critical.
- **PDF generation depends on an external binary.** If none is installed, PDFs fail; this repo has already seen a
  report silently arrive with no attachment for exactly that reason on another plugin, so TC-INV-606 checks that
  the failure is loud rather than silent.
- **A zero-rate line item and a zero-hours billing report look identical to a misconfigured billing-activity
  list** (TC-INV-304). Check the activity configuration before concluding that billing is broken.
