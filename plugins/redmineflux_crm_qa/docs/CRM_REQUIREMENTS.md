# Plugin Requirements — Redmineflux CRM Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/crm/ (official vendor knowledge base, ingested
> 2026-09-15). This is the most precisely documented plugin in the set — it publishes validation rules, deletion
> cascades, conversion rules, a permission list, privacy rules and an API contract. Test cases can therefore
> assert against stated behaviour rather than inferring it.

## Overview

A CRM workspace reached from the Redmine **top menu** (global, not project-scoped). It manages Leads, Contacts,
Companies and Deals, with an activity timeline, a stage-based deal pipeline, analytics, an audit log, CSV import,
multi-format export, privacy controls, Redmine custom fields, issue linking and a JSON API.

## Key Features

1. **Global CRM workspace** — Dashboard, Leads, Contacts, Companies, Deals, Analytics, Audit Log, Plugin Settings.
2. **Contacts** — first name and email required, **email unique across all contacts**, phone/mobile validated to
   7–15 digits, tags case-insensitive and comma-separated, avatar upload (max 2 MB), privacy flag, custom fields.
3. **Companies** — name required and **unique**; a bare domain in Website is auto-prefixed with `https://`.
4. **Deals** — name and stage required, probability 0–100, **lost reason required when stage is Lost**,
   **currency fixed at creation and never changeable**, forecast = amount × probability ÷ 100.
5. **Pipeline** — stage columns, territory filter, open pipeline value, weighted forecast, won revenue,
   drag-and-drop stage changes that generate an activity note.
6. **Closed-deal lock** — deals in **Won** or **Lost** cannot be moved by drag-and-drop; the update endpoint
   rejects it. Reopening requires editing the deal form directly.
7. **Leads** — first name and email required, email unique across leads, status required (default New).
   **`Converted` cannot be set manually.**
8. **Lead conversion** — only from status **Qualified**; converted leads cannot be converted again or deleted;
   reuses an existing contact by email, merging only into blank fields; reuses a company by name or creates one;
   optionally creates a deal; logs an automatic activity; redirects to the contact.
9. **Activities** — Note, Call, Meeting, Email, Task. **No edit function exists** — once saved, content cannot be
   changed. Only the author or an admin may delete; auto-generated activities cannot be deleted by regular users.
10. **Email activities** — subject, from, to and content all required; timeline shows Sent/Failed with details.
11. **Email templates** — Introduction, Follow-up, Meeting Request, Thank You, Proposal, with a `%{first_name}`
    placeholder.
12. **Automatic activities** — record creation, deal stage change, lead status change, assignee change, lead
    conversion.
13. **CSV import** for contacts, companies, deals and leads, each with a documented column list, duplicate rule
    and UTF-8 requirement.
14. **Export** — CSV and XLS for records and the dashboard; **CSV and PDF** for analytics, the PDF using embedded
    Unicode fonts. Exports cover **all records visible to the user**, not just the current page.
15. **Analytics** — 16 documented metrics, with This Week / This Month / This Quarter / This Year periods.
16. **Audit log** — searchable, filterable, **read-only and undeletable by anyone including administrators**.
17. **Issue linking** — one contact and one deal per issue, replaceable, unlinkable, creatable from the issue;
    requires issue-edit permission in that project.
18. **Privacy** — admins see everything; non-admins see public records, plus private records they created or are
    assigned to. **Counts reflect only what the user can see.**
19. **JSON API** under `/api`, authenticated with `X-Redmine-API-Key`, enforcing the same permissions as the UI.

## Permissions Matrix

Nine **global** permissions:

| Permission | Covers |
|---|---|
| View CRM | Access the workspace |
| Manage Contacts / Companies / Deals / Leads | Create and update those records — **not delete** |
| View Pipeline | The pipeline board |
| Manage CRM Activities | Log activities, and delete ones you authored |
| View Audit Log | The audit log |
| **Delete CRM Data** | **All deletion**, separately from the four manage permissions |

Issue linking additionally requires **edit-issues** permission on the related Redmine project.

Vendor-recommended roles: **Sales Representative** (View CRM + the four manage permissions + View Pipeline +
Manage CRM Activities); **Sales Manager** (that plus View Audit Log and Delete CRM Data); **Read-Only Viewer**
(View CRM only).

## Known Constraints

- **Deletion is a separate permission.** Manage ≠ delete — stated explicitly and worth testing on all four
  entities.
- **Deletion cascades differ per entity** and are documented precisely:
  - *Contact:* its activities and issue links are destroyed; linked **deals keep existing** with the contact
    reference cleared; the company is untouched.
  - *Company:* its activities are destroyed; contacts and deals keep existing with the company reference cleared.
  - *Deal:* its activities and issue links are destroyed; contact and company are untouched.
- **Converted leads cannot be deleted or re-converted.**
- **A deal's currency is immutable after creation.**
- **Won/Lost deals are locked against drag-and-drop stage changes** (the endpoint rejects them) and are excluded
  from open-deal counts.
- **`Qualified` must remain in the lead statuses** or conversion breaks; **`Converted` must never be added
  manually**; **Won and Lost must remain in the deal stages** or closed-deal behaviour breaks.
- **Configuration changes are not retroactive** — existing records keep their values.
- **Activities are immutable.** There is no edit path at all.
- **The audit log cannot be edited or deleted by anyone.**
- Declared compatibility: Redmine 4.x, 5.x, 6.x; Ruby 2.5+; Rails 5.2+.

## Installation Prerequisites

1. Plugin folder at `plugins/redmineflux_crm`; `bundle install`; migrate; restart.
2. CRM permissions granted to the relevant roles — nothing works without at least **View CRM**.
3. Write access to `public/uploads/contacts/avatars` for avatar uploads.
4. Working outgoing mail for email activities, with **Host name and path** verified.
5. Test users covering the three recommended role shapes, **including one with manage but not Delete CRM Data** —
   without that account the plugin's most distinctive permission boundary is untestable.
6. Two non-admin users for the privacy cases: one who creates a private record and one who must not see it.
7. UTF-8 CSV fixtures with non-Latin characters for the import and PDF-export cases.
