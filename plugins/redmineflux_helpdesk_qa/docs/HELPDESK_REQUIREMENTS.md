# Plugin Requirements — Redmineflux Helpdesk

> Derived from `HELPDESK_USER_GUIDE.md` (read from the plugin's actual documented behavior, not assumed from the plugin name).

## Overview

A support desk built on top of Redmine issues. A helpdesk ticket **is** a Redmine issue on a tracker named "Support" — all of Redmine's native issue behavior (history, attachments, watchers, time tracking, permissions) still applies. The plugin layers on top: customers, SLA policies with a working-hours clock, support-level escalation, organizations, prepaid support hours, canned responses, a knowledgebase, email in/out, and reporting.

## Key Features

See `HELPDESK_FEATURES_LIST.md` for the full enumerated list (54 features, categories A–K). Headline capabilities:

- Ticket lifecycle: creation (agent/customer/email), reply/internal-note, merge, automatic status flow
- SLA engine: policies, working-hours clock, pause/resume, breach tracking, history
- Support-level escalation ladder (L1 → L2 → L3) triggered automatically on breach
- Customers, organizations, and per-project customer entitlements (SLA + support level + org)
- Prepaid support-hours budgets with a consumption ledger and configurable run-out behavior
- Email-to-ticket, per-project SMTP, email history, auto-close
- Canned responses, products, knowledgebase (versioned, per project)
- 5 reports with CSV/Excel/PDF export, a REST API with Swagger docs, and 3 scheduled background jobs

## Business Workflows

1. **Setup order** (must follow this sequence — an SLA cannot attach until a customer's entitlement row references one, and a customer cannot be given an SLA/support level that doesn't exist yet): enable Helpdesk module → holidays → SLAs → support levels → organizations → customers → products → canned responses → email config → prepaid budgets.
2. **Ticket lifecycle**: New → (assigned, SLA clock starts) → In Progress ⇄ Waiting for Customer Response (agent reply pauses the clock; customer reply resumes it) → Resolved → Closed. Unassigning pauses the clock; reassigning resumes it (unless still waiting on the customer).
3. **SLA breach → escalation**: a missed deadline marks the ticket breached, notifies, and the background SLA monitor (every 2 min) escalates the ticket to the next support level, reassigning and notifying the new tier. A breach at the top level notifies admins but cannot escalate further — confirmed live (2026-09-01, `HELPDESK_SLA_ESCALATION.md` TC-HLP-301) that this reassigns the ticket to the Admin account on the very same monitor cycle, exactly once, with a distinct "Critical SLA Alert" email (not the regular escalation-email template).
   - **Support Level and SLA targets are decoupled**: a Support Level only determines escalation routing (which level a ticket sits at, who it's assigned to, and where it escalates to next). The **Response/Resolution time targets themselves come from the one SLA record** the ticket is attached to, and every Support Level built on top of that SLA shares that same single set of targets — there is no per-level override of Response/Resolution minutes. Confirmed live 2026-09-01 (`HELPDESK_SLA_ESCALATION.md` TC-HLP-300): a ticket entering directly at L2 (skipping L1 entirely, per a customer's own project-access row) used the exact same 1-minute targets as L1/L3, all three levels referencing one shared SLA record.
4. **Email-driven tickets**: the mail poller (every 5 min) turns a registered customer's inbound mail into a new ticket (or a note on an existing thread), subject to identifier-keyword gating.
5. **Prepaid hour consumption**: time logged against an organization's tickets on a project debits its prepaid budget automatically; run-out behavior (no limit / hard stop / soft) is configured per organization per project.
6. **Auto-close**: the background job (every 2 min) closes Resolved tickets that have been silent longer than the project's configured auto-close days.

## Permissions Matrix

The plugin does not hardcode QA-persona role names — access is governed by Redmine's own permission system (`view_helpdesk`, `manage_helpdesk`, etc.) plus a separate "helpdesk customer" flag for the Client persona. Mapped onto this repo's standard QA roles:

| Action | Admin | Manager / Developer / QA Engineer | Client (Customer) | Non-member |
|--------|-------|-----------------------------------|--------------------|------------|
| See Helpdesk tab / access helpdesk URLs | Always | Only if role is granted `view_helpdesk` or `manage_helpdesk` on the project | N/A — customers use their own project's helpdesk via the entitlement row, not this permission | Never — tab absent, URLs refused |
| View/create/edit tickets | Yes | Yes, if granted `view_helpdesk` | Only their own tickets, on entitled projects | No |
| Manage desk configuration (SLAs, support levels, organizations, products, holidays) | Yes | Yes, if granted `manage_helpdesk` | No | No |
| Manage Canned Responses | Yes | **No — admin only, regardless of `manage_helpdesk`** (confirmed via source and live 403; see BUG-HLP-039, the one configuration entity that doesn't follow the row above) | No | No |
| Export reports | Yes | **Yes, `manage_helpdesk` alone is sufficient** — confirmed live 2026-09-07 (`HELPDESK_PERMISSIONS.md` TC-HLP-213) via real, content-verified CSV downloads under two role configurations; `export_helpdesk_reports` is not independently required for the Export button despite existing as its own separate permission checkbox | No | No |
| Access the Organization page / view prepaid-hours info | Yes | Yes, if granted `manage_helpdesk` (confirmed live 2026-09-07, `HELPDESK_PERMISSIONS.md` TC-HLP-206/210) | No | No |
| Set/adjust prepaid budgets, change the run-out mode | Yes | Requires `manage_helpdesk` **AND** `manage_prepaid_support_hours` together — `manage_prepaid_support_hours` is an additive permission on top of `manage_helpdesk`'s access grant, not a standalone substitute for it. `manage_helpdesk` alone grants access/viewing but not modification (top-up/mode controls are absent); `manage_prepaid_support_hours` alone (without `manage_helpdesk`) has no UI path to reach the form at all — this is intentional, not a gap. Confirmed live 2026-09-07 both directions (`HELPDESK_PERMISSIONS.md` TC-HLP-206 positive, TC-HLP-210 negative); see `bugs/closed/BUG-HLP-040.md` for the resolved documentation ambiguity this clarifies. | No | No |
| Knowledgebase create / edit / delete | Yes | Gated by `add_kb_page` / `edit_kb_page` / `delete_kb_page` respectively | No (view only, if published and role can view KB pages) | No |
| Save a project's email configuration | Yes — **admin only, regardless of role** | No | No | No |
| View API/Swagger docs (`/helpdesk/swagger`) | Yes — **admin only, regardless of role** | No | No | No |
| Log time on a reply | Yes | Follows Redmine's own `log_time` permission | No | No |
| View internal notes | Yes | Yes (unless role also lacks `view_private_notes`, which is Redmine-level, not helpdesk-specific) | Never | No |

## Known Constraints

- **Supported Redmine versions:** 5.0.x, 5.1.x, 6.0.x, 6.1.x.
- Requires Redis + Sidekiq running for any background behavior (SLA monitoring, email polling, auto-close) — without it, nothing escalates and no mail is fetched.
- **CORRECTED 2026-08-27 (was wrong):** a customer can hold **multiple** project-access rows simultaneously — confirmed live on two separate environments (Forge and Local), see TC-HLP-122 in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md` and `HELPDESK_MEMORY.md`. (This line previously said "only one project-access row at a time," which was never actually true — that claim came from `HELPDESK_USER_GUIDE.md` §3.5's own now-corrected prose note; this file's Known Constraints was simply never updated to match when the guide was fixed.)
- **Customers and Organizations are both global, install-wide entities, not project-scoped ones** — there is one shared directory of each across the whole install, not one per project:
  - Customer Login and Email are enforced unique **install-wide** (TC-HLP-240/244), and a Manager scoped to a single project can see and edit any customer's core identity fields (Login/Name/Email/Password) regardless of that customer's project entitlements — only the customer's per-project **access rows** (SLA/support level/organization-per-row) are actually project-scoped and gated. See `bugs/closed/BUG-HLP-012.md`.
  - Organization has **no project-scoping mechanism at all**, even at creation time — its Organization Name dropdown offers the identical full list regardless of which project a customer's project-access row is being added for (TC-HLP-284, confirmed live). An organization's apparent "project" (as seen e.g. on a Prepaid Support Hours report, or a project's own Helpdesk → Organization tab) is a **derived view** based on which customers/budgets happen to reference it, not a stored project association — **including when the organization was itself created via that exact project's own "New Organization" button** (which carries a `project_id` in its URL, but this is not persisted or used to scope visibility). An org only shows up in a given project's Organization tab once an actual customer's project-access row on that project selects it — not at creation time, regardless of creation origin. Confirmed live: TC-HLP-298 in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md`.
- A customer with no SLA on their project-access row gets **no SLA at all** on tickets they raise there — there is no fallback to a project/global default for customers (agents' tickets do fall back).
- Holiday names are **unique across the whole install**, not per calendar — prefix names if maintaining more than one calendar.
- Fresh installs must load Redmine's default data **before** running the plugin migration — the plugin's migration creates the "Waiting for Customer Response" status, and Redmine's default-data loader refuses to run once any status exists.
- Two actions are admin-only regardless of role or permissions granted: saving a project's email configuration, and the API/Swagger documentation page.
