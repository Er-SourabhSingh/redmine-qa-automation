# Test Cases — Redmineflux Invoice — Installation, Company Details & Global Settings

> Source: vendor KB — "Version Compatibility", "Installation", "Configuration" (Company Information, Invoice
> Settings, Payment Gateway), "How to Enable Invoice Module in a Project", "Troubleshooting", "Uninstallation".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Invoice Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_invoice_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Invoice** → **Configure**; Project → Settings → Modules for the module.

> **Use Stripe test-mode credentials only.** Never configure live keys on a QA instance and never use real card
> data. Record which mode is in use alongside every payment-related result.
>
> **Warning:** these settings appear on every invoice the instance produces. Record the originals and restore them.

---

## Functional Cases — Installation

---

### TC-INV-029: Plugin appears after installation

**User Role:** Admin
**Priority:** Medium
**Preconditions:** `redmineflux_invoice` copied into `plugins/`, `bundle install` and migrations run, restarted.
**Steps:**
1. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed with name, description, author and version, and has a **Configure** link.

---

### TC-INV-030: Migrations complete cleanly

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Run the migration, restart, open a project's Invoice tab.

**Expected Result:**
- No missing-table exception in `log/production.log`.

---

### TC-INV-031: Assets load

**User Role:** Any
**Priority:** Medium
**Steps:**
1. Open the invoice edit form and the Billing Report; inspect the console and Network tab.

**Expected Result:**
- No 404s. Line-item and adjustment rows can be added dynamically — confirm by behaviour.

---

### TC-INV-032: A PDF binary is installed

**User Role:** Admin
**Priority:** High
**Steps:**
1. Confirm at least one of `wkhtmltopdf`, PDFKit, Grover (Chromium) or Prawn is available on the server.
2. Generate one invoice PDF.

**Expected Result:**
- A PDF is produced.
- **Record which binary is present.** If none is, every PDF case is untestable — mark them *Not Executed —
  dependency missing* rather than failing them, and note that this repo has already seen a report silently arrive
  with no attachment because of a missing Grover/Node on another plugin. The same silent-failure risk applies here
  (TC-INV-103).

---

## Functional Cases — Company information

---

### TC-INV-033: Company details are saved and appear on invoices

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Enter company name, full address, billing email, phone, tax ID and GST number; save.
2. Generate an invoice and view it on screen and as a PDF.

**Expected Result:**
- All fields appear in the invoice header exactly as entered, in both renderings.
- **Tax and GST IDs are legal identifiers on a financial document** — a missing or truncated one may make the
  invoice invalid for the client's accounting, so check them character by character rather than at a glance.

---

### TC-INV-034: Company logo

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Upload a logo; view the invoice on screen and as a PDF.
2. Repeat with a very large image and a non-image file.

**Expected Result:**
- The logo renders in the header in both outputs, scaled sensibly rather than overflowing the page.
- A non-image upload is rejected with a clear message.
- **A logo that renders on screen but is missing from the PDF is a real defect** — the PDF is what reaches the
  client, and the two rendering paths are different code.

---

## Functional Cases — Invoice settings

---

### TC-INV-035: Invoice prefix and number format

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Confirm the default prefix is `INV`; create an invoice and read its number.
2. Change the prefix and create another.

**Expected Result:**
- Numbers follow the documented shape, e.g. `INV-2026-0001`, and the new prefix applies to new invoices.
- **Existing invoices keep their original numbers.** Renumbering issued documents retroactively would break the
  client's records and is a serious defect.

---

### TC-INV-036: Invoice numbers are unique and sequential

**User Role:** Admin
**Priority:** High
**Steps:**
1. Create several invoices in one project, then in another, then two simultaneously from two sessions.

**Expected Result:**
- Every number is unique. Record whether the sequence is global or per project.
- **Two invoices sharing a number is a genuine accounting defect** — it makes reconciliation ambiguous — and
  concurrent creation is the realistic way to produce one.

---

### TC-INV-037: Currency symbol

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Set the currency symbol; view an invoice on screen, in the PDF, in the email, in the dashboard and in the
   global list.

**Expected Result:**
- The same symbol in all five places. A total displayed with the wrong currency is a materially wrong document.

---

### TC-INV-038: Default payment terms

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Confirm the default is `Net 30`; change it and create an invoice.

**Expected Result:**
- The new terms appear on the invoice and drive the due date consistently.

---

### TC-INV-039: Stripe credentials are stored safely

**User Role:** Admin
**Priority:** High
**Steps:**
1. Enable Stripe and enter the Publishable Key, Secret Key and Webhook Secret; save and reload.
2. **Inspect the page source** for each of the three values.

**Expected Result:**
- The settings persist.
- **The Secret Key and Webhook Secret must not be rendered back into the page in plain text.** They should be
  masked or write-only.
- These are the most sensitive values in the entire Redmineflux plugin set: a leaked secret key permits charges
  against the organisation's Stripe account, and a leaked webhook secret permits forged payment confirmations
  (TC-INV-086). Any plain-text exposure is a High-severity finding even on an admin-only page.

---

## Functional Cases — Project module

---

### TC-INV-040: Enabling the module adds the Invoice tab

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Project → Settings → **Modules** → enable **Invoice** → Save.

**Expected Result:**
- An **Invoice** tab appears in the project menu; before enabling it is absent.

---

### TC-INV-041: Disabling the module removes access

**User Role:** Manager
**Priority:** High
**Steps:**
1. Disable the module; confirm the tab is gone.
2. Request the project invoice list URL and an individual invoice URL **directly**.
3. Re-enable and confirm the data returns.

**Expected Result:**
- Tab gone **and** both direct URLs refused — invoices contain customer details and financial amounts, so a
  hidden-but-reachable page is a real disclosure.
- No invoice data is lost while the module is off.

---

## Negative Cases

---

### TC-INV-042: Configure page is not reachable by a non-admin

**User Role:** Manager, and a user holding `manage_invoices`, and a user holding `manage_customers`
**Priority:** High
**Steps:**
1. Request the plugin configuration URL directly for each, and attempt to post a change.

**Expected Result:**
- 403 for all three.
- **`manage_invoices` is the key account here**: it is the broadest invoice permission, and a developer might
  plausibly have let it reach the configuration page — which would expose the Stripe secret key to anyone who can
  raise an invoice.

---

### TC-INV-043: Invalid configuration values

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Enter an empty company name; a prefix containing spaces or slashes; a non-numeric payment term; and a malformed
   Stripe key. Save each.

**Expected Result:**
- Each rejected with a clear message, or safely normalised.
- **A prefix containing a slash could break the invoice's URL or its PDF filename** — worth checking specifically
  rather than assuming the field is free text.

---

### TC-INV-044: Settings persist and apply immediately

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Change every setting, save, reload, then create a new invoice.

**Expected Result:**
- All values persist and the new invoice reflects them without a restart.

---

### TC-INV-045: Migrations not run

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Install the files, skip the migration, restart, open a project.

**Expected Result:**
- A clear error or the tab absent. **The project's other pages and core time logging must still work.**

---

## Uninstallation

---

### TC-INV-046: Clean uninstall

**User Role:** Admin
**Priority:** Medium
**Preconditions:** **Database backup taken** — the KB requires it.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=redmineflux_invoice VERSION=0 RAILS_ENV=production`.
2. Remove `plugins/redmineflux_invoice` and restart.

**Expected Result:**
- Redmine starts cleanly; the Invoice tab, Customer tab and global Invoices entry are gone.
- **Core Redmine time entries survive untouched** — the plugin bills from them but does not own them, so any loss
  would be Critical.
- **Confirm any Stripe payment links stop working.** A customer-facing payment page still live after the plugin is
  removed would be a serious finding.
- Note in the handoff that invoice records themselves are destroyed by the rollback; for a system holding issued
  financial documents, that is worth stating explicitly to whoever runs it.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
