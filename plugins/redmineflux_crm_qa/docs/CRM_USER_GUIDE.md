# User Guide — Redmineflux CRM Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/crm/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

Click **CRM** in the Redmine top menu to open the global CRM workspace. The left navigation holds Dashboard,
Leads, Contacts, Companies, Deals, Analytics, Audit Log (when permitted) and Plugin Settings (admins).

Users see only the records that permissions and privacy rules allow.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Dashboard | CRM → Dashboard | Summary cards, recent panels, Quick Create, export |
| Leads / Contacts / Companies / Deals | CRM → each section | List, create, edit, import, export |
| Pipeline | Deals → pipeline view | Stage board with drag-and-drop and totals |
| Analytics | CRM → Analytics | KPIs, charts, period filters, CSV/PDF export |
| Audit Log | CRM → Audit Log | Read-only cross-record history |
| Plugin settings | Administration → Plugins → Redmineflux CRM → Configure | Currency, stages, territories, lead statuses and sources |
| Issue CRM panel | Any Redmine issue | Link a contact and a deal |

## Step-by-Step Workflows

### Workflow 1: Configure (admin)

1. Administration → Plugins → Redmineflux CRM → **Configure**.
2. Set the **default currency** (default `USD`), **deal stages** (default New, Qualified, Proposal, Negotiation,
   Won, Lost), **territories**, **lead statuses** (New, Contacted, Qualified, Unqualified) and **lead sources**
   (Website, Referral, Cold Call, Email Campaign, Social Media, Other).
3. Grant the CRM permissions to roles under Administration → Roles and Permissions.

Three rules matter:
- **Keep Won and Lost** — they carry closed-deal behaviour.
- **Keep Qualified** — lead conversion depends on it.
- **Never add Converted manually** — the system applies it during conversion.
Changes are **not retroactive**; existing records keep their values.

### Workflow 2: Contacts

1. CRM → **Contacts** → **New Contact** → fill the form → Save.
   First name and email are required; the email must be unique; phone and mobile must be 7–15 digits; tags are
   comma-separated and case-insensitive; the avatar is limited to 2 MB.
2. Edit from the contact page; delete with **Delete CRM Data** permission.
3. Link a company on the contact form — or create the contact from a company page, where the company is
   preselected and locked.

**Deleting a contact** destroys its activities and issue links, clears the contact reference on its deals (the
deals survive), and leaves the company untouched.

### Workflow 3: Companies

1. CRM → **Companies** → **New Company** → Save. Name is required and must be unique.
2. A bare domain in **Website** (`acmecorp.com`) is saved as `https://acmecorp.com`.

**Deleting a company** destroys its activities and clears the company reference on its contacts and deals, which
themselves survive.

### Workflow 4: Deals and the pipeline

1. CRM → **Deals** → **New Deal** → Save. Name and stage are required; probability is 0–100; a **lost reason is
   required when the stage is Lost**. The **currency comes from the default and cannot be changed afterwards**.
2. Forecast value = amount × probability ÷ 100 (10,000 at 60% = 6,000).
3. Open the **pipeline** to see deals by stage with open pipeline value, weighted forecast and won revenue, plus a
   territory filter.
4. Drag a card to another stage — the stage updates and a CRM activity note is created.

**Won and Lost deals cannot be moved by drag-and-drop**; the endpoint rejects it. To reopen one, edit the deal
form directly. Both are excluded from open-deal counts and both feed the win rate.

**Deleting a deal** destroys its activities and issue links; the contact and company are untouched.

### Workflow 5: Leads and conversion

1. CRM → **Leads** → **New Lead** → Save. First name and email required, email unique, status defaults to New.
2. To convert: open a lead whose status is **Qualified** → **Convert** → optionally create a deal (name required,
   amount optional, stage defaults to New, deal custom fields available) → Save.

Conversion reuses an existing contact with the same email, **merging lead data only into blank contact fields**;
reuses a company by name or creates one if a name is present; sets the lead status to **Converted**; logs an
automatic activity; and redirects to the contact.

Converted leads cannot be converted again or deleted.

### Workflow 6: Activities

1. Open a contact, company, deal or lead → **Recent Activities** → **Add Activity**.
2. Choose the type — Note, Call, Meeting, Email or Task — enter the content, Save.
3. For an **email activity**: subject, from (pre-filled with your Redmine email), to and content are all required.
   The timeline shows Sent with a timestamp, or Failed with details.
4. On a contact page, the **Email Templates** section offers Introduction, Follow-up, Meeting Request, Thank You
   and Proposal, each supporting `%{first_name}`.

**Activities cannot be edited — ever.** Only the author or an admin can delete one, and auto-generated activities
cannot be deleted by regular users.

### Workflow 7: Import and export

1. In any of the four sections click **Import**, upload a UTF-8 CSV **with a header row**, and submit.
   The result reports imported, duplicate and invalid row counts.
   Duplicates are skipped by email (contacts, leads), by name or email (companies), and by name + contact +
   company (deals).
2. **Export** offers CSV and XLS for records and the dashboard, and CSV and PDF for analytics. Exports include
   **all records visible to you**, not just the current page.

### Workflow 8: Analytics and audit

1. CRM → **Analytics** → choose This Week / This Month / This Quarter / This Year → review the KPI cards and
   charts → **Export** to CSV or PDF.
2. CRM → **Audit Log** → filter by activity type or search by content. It is **read-only for everyone**.

### Workflow 9: Issue linking

1. Open a Redmine issue → the CRM panel → add or change the linked **contact** and **deal** (one of each), or use
   **New Contact** / **New Deal** to create and link in one step.
2. **Unlink** beside a linked record removes the link.

Requires edit-issues permission in that project. Links are visible from the CRM record's *Linked Redmine Issues*
section.

### Workflow 10: Privacy

Tick **private** on a contact, company, deal or lead. Admins see everything; non-admins see public records plus
private ones they created or are assigned to. **Counts reflect only what you can see**, so two users can
legitimately see different totals.

## Notes & Known Behaviour

- **Manage ≠ delete.** Manage Contacts/Companies/Deals/Leads do not permit deletion — that needs **Delete CRM
  Data**.
- **Activities are immutable**, and the **audit log cannot be edited or deleted by anyone, including admins**.
- **A deal's currency is fixed at creation.**
- **Won/Lost deals are locked against drag-and-drop.**
- **Converted leads are locked** — no re-conversion, no deletion.
- **Configuration changes are not retroactive.**
- CSV files must be **UTF-8** with the exact documented header names, or rows fail as invalid.
- Avatar uploads need write access to `public/uploads/contacts/avatars`.
- Email activities depend on Redmine's outgoing mail configuration.
