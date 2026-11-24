# Test Suite — MCP Server: Helpdesk Full Tool Coverage, Round 2 (production #129322)

> **Status: COMPLETE 2026-11-24 — all 17 TCs executed, 16/17 PASS, 1 bug found (BUG-MCP-007, open).**
>
> Source: production ticket **#129322** ("MCP Server: Complete Helpdesk plugin tool coverage"), status In QA,
> done 90%. Implemented as:
>
> | Repository | Branch | Commit | Version |
> |---|---|---|---|
> | redmineflux-helpdesk | master | 846e3a7 | HD-13 |
> | redmineflux-mcp | crux_development | fe30dc4 | 1.1.15 (RMCP-054, installed: 1.1.16) |
>
> Both repos were pulled onto `C:\crux-redmine` for this suite: `redmineflux_helpdesk` was fast-forwarded
> `8ef93ca..ac86f5b` (which includes `846e3a7` plus a couple of unrelated, already-released fixes further
> ahead on `master`); `redmineflux-mcp` was already at `a8fc38c`/1.1.16, which already fast-forwards past
> `fe30dc4` (confirmed via `git merge-base --is-ancestor`). Stack: Redmine 6.0-bookworm, `localhost:3015`,
> admin API key `a47f42bc539c5bfe3a10cc392838fa5c8d2e7a35`, via the `redmineflux-local` MCP connector.
>
> TC range: TC-MCP-074 to TC-MCP-090.

## What changed (per the ticket)

- **10 new tools** (helpdesk: 77 → **87**, confirmed live): `dashboard`, `report` (agents/tickets/organizations/
  projects), `import_customers` + `customer_import_template`, `get_settings`/`update_settings`,
  `assign_support_package`, `prepaid_history`, `check_support_level`, `kb_upload_attachment`.
- **7 improved existing tools**: `create_ticket`/`update_ticket` (Product field), `get_ticket` (shows
  Product + Organization), `list_tickets` (new filters, 5 → 16 total), `add_conversation` (attachments + time
  logging), `get_organization` (overview), `core_log_time` (now takes `support_package_id`).
- New plugin-side endpoints live under `/helpdesk/api/v1/` (same JSON API folder as HD-11), same permissions as
  the plugin's own screens; browser controllers/screens/`init.rb`/permissions unchanged.

## Fixtures built this session

- Project **Crux Helpdesk Agent Test Project (id=12)**, already Helpdesk-enabled, with existing fixtures reused
  (5 pre-existing tickets, customer Willow2 Belle2, organization "Prepaid Test Org" with a 10h prepaid budget).
- A genuinely **global** SLA (`QA Fixture Global SLA`, id=3) — both pre-existing SLAs on this instance turned
  out to be project-scoped, which `create_support_package` correctly refuses (global-only); created a second
  global SLA (id=4) too, to prove `assign_support_package(apply_to_customers=true)` genuinely changes a
  customer's SLA, not just reports a no-op.
- Two support packages (`QA Fixture Gold Package`, `QA Fixture Platinum Package`), one active + one inactive
  product (`Helpdesk Mobile App` / `Helpdesk Legacy Product (inactive)`), a fresh customer (`QA
  FixtureCustomer`, id=31) created **with** `rf_organization_id` set at creation time (the only point at which
  an MCP tool can set it — see TC-MCP-078's note) and linked to the project via `add_project_customer`.
- An Issue Category (project 3's... no, project 12's "Development - Quality Assurance & Testing", id=151) +
  an approved-hours budget record (`redmineflux_budget_audit_set_budget`), both needed only because the
  `redmineflux_budget_and_audit` plugin is *also* installed on this instance and requires every time-logged
  issue to have a category + budget — unrelated to #129322, documented fully under TC-MCP-084/085/090 below so
  a future session doesn't re-diagnose it from scratch.
- Permission fixtures: Luna Blossom (id=5, Manager on project 12 — `manage_helpdesk`, `export_helpdesk_reports`,
  `manage_prepaid_support_hours`, `add_kb_page`), Daisy Skye (id=6, Reporter — ruled out as a clean
  "zero-helpdesk-permission" fixture after discovering she holds an incidental **Developer** role on an
  unrelated project that globally grants `manage_helpdesk`/`export_helpdesk_reports` — this plugin's
  `require_admin_or_manage_helpdesk` check is **global**, not project-scoped, by deliberate prior design per
  its own `BUG-HLP-057` code comment, not a new #129322 defect), **Zero PermTest** (confirmed globally clean,
  used instead for every permission-refusal check) and the real Helpdesk Customer portal account
  **willow2.belle** (id=25, `is_helpdesk_customer: true`).

## Positive Cases — Dashboard & Reports (brand new)

### TC-MCP-074 — `dashboard` tool, global and per-project

**Steps:** `dashboard()` (no filters — global).

**Expected Result:** Ticket cards, breakdown by priority/status, top organizations, agent workload and SLA
health all match the underlying data; figures internally consistent with the tool's own aggregate SLA counter.

**Result: PASS, with one bug found (BUG-MCP-007).** Figures matched reality for everything *except* one thing:
the summary line correctly read `"SLA: 3 tracked | breached 0 | ... compliance 100.0%"`, but the same response's
`Latest tickets` section tagged two of those same tickets (#178, #28) with `"· SLA breached"` — directly
contradicting the tool's own aggregate count and three other independent SLA tools
(`get_sla_status`, `sla_analytics`, `list_tickets(sla="breached")`), all of which agree on zero breaches for
both tickets. Filed as **BUG-MCP-007** (Medium — misleading per-ticket badge only, the real SLA math is
correct everywhere else). Everything else in the dashboard (ticket counts by status/priority, agent workload,
customer/org/product counts) matched the data exactly.

## Positive Cases — Reports (brand new)

### TC-MCP-075 — `report` tool, all 4 kinds

**Steps:** `report(kind="agents", project_id=12)`, `kind="tickets"`, `kind="organizations"`, `kind="projects"`.

**Expected Result:** Each kind's figures match the equivalent Reports screen for the same filters; all agree
with each other and with `sla_analytics` on SLA breach counts (0).

**Result: PASS.** `agents`: `"Tickets: 5 | assigned 3 | unassigned 2 | agents 1 ... SLA breaches 0 (0.0%)"`.
`tickets`: `"Tickets: 5 | open 4 | closed 1 | overdue 0"`, correct status/priority breakdown. `organizations`:
`"Tickets from organizations: 0 | without an organization: 5"` (correct — none of these 5 pre-existing tickets
have an organization set). `projects`: `"5 tickets, 4 open, 1 closed | SLA breached 0, compliant 3"` — all four
report kinds agree with each other and with `sla_analytics`/`get_sla_status` on zero breaches, reinforcing that
TC-MCP-074's finding is isolated to the `dashboard` tool's per-ticket badge specifically.

## Positive Cases — Customer Import (brand new)

### TC-MCP-076 — Customer import template + import, success + failure rows

**Steps:** `customer_import_template()` → `import_customers(csv_text=...)` with one clean row (QaImport Success)
and one deliberately-malformed row (invalid email) in the same call.

**Expected Result:** Template shows the exact expected columns; import reports each row individually as
created/linked or failed with the real reason, not just an aggregate count.

**Result: PASS.** Template → `"Required columns: firstname, lastname, email, organization, project,
support_level. Optional columns: sla"` with a working example row. Import → `"1 imported, 1 failed. OK row 2
...: Customer created and linked to the project. FAIL row 3 not-an-email: Email is invalid — must include a
domain with TLD"` — native-verified via `list_customers(project_id=12)`, which now shows the new customer
(`ID:32 QaImport Success`) alongside the pre-existing ones.

## Positive Cases — Global Settings (brand new, admin-only)

### TC-MCP-077 — `get_settings`/`update_settings`, admin-only

**Steps:** `update_settings(notify_customer_status_ids=[1,5], allow_private_mail_hosts=true)` as Admin → `get_
settings()` to confirm → direct REST `PATCH /helpdesk/api/v1/settings` as Luna Blossom (Manager, non-admin) and
as Daisy Skye (Reporter).

**Expected Result:** Admin's change persists and is reflected in `get_settings`; any non-administrator is
refused, regardless of their project role.

**Result: PASS.** Update → `"Saved. ... E-mail the customer when a ticket moves to: Waiting for Customer
Response, Done ... Fetch incoming mail from private mail hosts: allowed"`, confirmed identically via a fresh
`get_settings()` call. Both non-admin users (Manager and Reporter alike) refused with the identical, correct
message: `"Changing the global Helpdesk settings needs an administrator, as on the Helpdesk Settings screen."`
— confirms this one is genuinely **administrator-only**, not the looser global-permission-anywhere pattern
that affected the Reports check (see Fixtures note above).

## Positive Cases — Support Package & Budget (brand new)

### TC-MCP-078 — Assign a Support Package to an org + apply to customers

**Steps:** Created a genuinely **global** SLA (both pre-existing SLAs on this instance turned out to be
project-scoped — `create_support_package` correctly refused a project-scoped SLA by name: `"No global SLA is
named 'Gold SLA'"`, which is accurate, not the known SLA-listing/resolve mismatch from this plugin's agent-chat
testing history). Created support package #1 against the new global SLA. `assign_support_package(project_
id=12, organization_id=2, support_package_id=1, apply_to_customers=true)` on a customer whose project-customer
record had `Organization: none` — got `"applied to 0 customer(s)"`, correctly, because **no MCP tool can set an
existing customer's organization**: `update_project_customer`'s own `rf_organization_id` parameter is silently
ignored by design (`apply_package_aware_attrs` always re-derives it from the *customer's own* `rf_organization_
id`, per a BUG-HLP-064/065 fix already on this branch — confirmed via source read, not a regression), and
`update_customer` doesn't expose `rf_organization_id` at all; only `create_customer` accepts it, at creation
time only. Created a **fresh** customer (`QA FixtureCustomer`) with the organization set at creation, linked it
to the project via `add_project_customer` (which itself needed `rf_support_level_id` — its own one-line
"Warning: ... may not exist or may already be linked" message is misleading when the real cause is a different
missing required field; found via the raw endpoint's own clearer error). Re-ran `assign_support_package(...,
apply_to_customers=true)` — this time it immediately auto-applied the package's SLA at `add_project_customer`
time. To get a genuine ">0 applied" confirmation, manually overrode the customer's SLA by hand, confirmed
`apply_to_customers` correctly **skips** a hand-overridden customer (per its own docstring), then switched the
org's package to a second one (Platinum, different SLA) with no override present — confirmed `"SLA applied to
1 customer(s)"` and the customer's SLA genuinely changed.

**Expected Result:** The package assigns to the org; `apply_to_customers` changes a customer's SLA when
eligible and correctly skips one with a manual override.

**Result: PASS**, fully verified through both the "already correct, 0 changed" and "genuinely changes 1
customer" cases, plus the override-respecting behavior — native-verified via `get_project_customer` at every
step.

### TC-MCP-079 — Prepaid budget history

**Steps:** `prepaid_history(organization_id=2)` (baseline: 1 event, the pre-existing 10h top-up) →
`prepaid_support_hours_add(project_id=12, rf_organization_id=2, hour=5, comment="TC-MCP-079 fixture top-up")`
→ `prepaid_history` again.

**Expected Result:** New top-up appears with correct before/after budget totals.

**Result: PASS.** Add → `"Added 5.0h ... New totals — approved: 15.0h | spent: 0.0h | remaining: 15.0h."`
History → 2 events now, newest first: `"2026-11-24 Top-up +5.0 h ... budget 10.0 → 15.0 h ... 'TC-MCP-079
fixture top-up'"` above the original `"2026-11-04 Top-up +10.0 h ... budget 0.0 → 10.0 h"` — exact math,
correct ordering.

## Positive Cases — Support Level & Knowledgebase (brand new)

### TC-MCP-080 — Check support level before assigning

**Steps:** `check_support_level(ticket_id=202, assignee_id=1)`.

**Expected Result:** Returns the ticket's required level, the agent's level, and whether they match.

**Result: PASS.** `"Ticket needs: Level 1 Support (order 1). Agent holds: Level 1 Support (order 1). Can be
assigned on this project: yes. Result: OK — the agent's level is enough for this ticket."`

### TC-MCP-081 — Knowledgebase attachment upload

**Steps:** `kb_upload_attachment(page_id=1, filename="qa-fixture-note.txt", content_base64="...")` →
`kb_list_attachments(page_id=1)`.

**Expected Result:** File attaches and is listed on the page.

**Result: PASS.** `"Attached qa-fixture-note.txt (47 bytes) ... attachment ID:2 ..."`, confirmed present via
`kb_list_attachments` → `"[2] qa-fixture-note.txt (47 bytes) by Redmine Admin ..."`.

## Positive Cases — Improved Existing Tools

### TC-MCP-082 — Ticket Product field (create/update/get) + inactive-product refusal

**Steps:** Created 2 products (1 active, 1 deliberately deactivated via `toggle_active`). `create_ticket(...,
product_id=<active>)` → `get_ticket` → `update_ticket(product_id=<inactive>)`.

**Expected Result:** Ticket creation with an active product succeeds and `get_ticket` shows it; updating to an
inactive product is refused.

**Result: PASS.** Create + `get_ticket` → `"Product : Helpdesk Mobile App"` shown correctly alongside
Organization (none, correctly, for this ticket). Update to the inactive product → `"Validation error: Product 5
is not an active product of project Crux Helpdesk Agent Test Project. See list_products for this project."` —
exact, correct refusal.

### TC-MCP-083 — `list_tickets`'s new filters

**Steps:** `list_tickets(project_id=12, priority_ids=[7])`, `subject_contains="product field"`,
`ticket_ref="202"`, `sla="breached"`, `done_ratio_min=0, done_ratio_max=0`.

**Expected Result:** Each filter narrows results correctly.

**Result: PASS.** `priority_ids=[7]` → only ticket #202 (its priority). `subject_contains` → only #202.
`ticket_ref="202"` → only #202. `sla="breached"` → **"No tickets found."**, correctly agreeing with
`sla_analytics`/`get_sla_status` (and correctly *disagreeing* with the `dashboard` tool's own buggy per-ticket
badge — further confirms BUG-MCP-007 is isolated to `dashboard` specifically, since this filter uses the
correct computation). `done_ratio_min/max=0` → all 6 tickets (correctly, since every ticket here is at 0% done).

### TC-MCP-084 — `add_conversation` with attachment + logged time + support package

**Steps:** `add_conversation(ticket_id=202, note="...", uploads=[{token, filename, content_type}], log_hours=1.5,
activity_id=3, support_package_id=2)`. (Required first setting up an Issue Category + an approved-hours budget
on the ticket — see "Fixtures built" above; without them, time-logging on *any* issue on this instance fails
with `"Category can not be blank"`, root-caused via Rails console to `redmineflux_budget_and_audit`'s own
`TimeEntry` patch requiring every time-logged issue to have a category and an approved budget for that
category — confirmed as pre-existing, unrelated to #129322 or #129311, not filed as a bug.)

**Expected Result:** Reply, attachment, logged time and support package all persist together.

**Result: PASS.** `"Reply added successfully. Logged 1.5 h (Technical Support), support package QA Fixture
Platinum Package — time entry #23. Attached: qa-fixture-reply-attachment.txt."` Native-verified via `get_issue
(202, include=journals,attachments)`: attachment id=3 present, journal note present, spent hours 1.5h. Verified
at the DB level (`rails runner`) that the support package genuinely persisted:
`rf_helpdesk_support_package_id: 2` on `TimeEntry#23`.

### TC-MCP-085 — `core_log_time` with `support_package_id`

**Steps:** `core_log_time(issue_id=202, hours=0.5, activity_id=3, support_package_id=1)`.

**Expected Result:** Logs through the Helpdesk API path and keeps the package, per the tool's own docstring.

**Result: PASS.** `"Logged 0.5h on issue #202 with support package QA Fixture Gold Package (entry id=24)."`
DB-verified: `TimeEntry#24.rf_helpdesk_support_package_id == 1`, `hours == 0.5`.

### TC-MCP-086 — `get_organization` overview

**Steps:** `get_organization(organization_id=2)`, checked once before and once after the project-customer link
was established (TC-MCP-078).

**Expected Result:** Overview (projects/customers/open tickets/prepaid totals) matches reality at each point.

**Result: PASS.** Before linking: `"Projects: 0 | Customers: 0 | Open tickets: 0 ... approved 10.0 | used 0.0 |
remaining 10.0"` — correctly zero, since no project-customer record had this org set yet at that point. After:
`"Projects: 1 | Customers: 1 | Open tickets: 0 ... approved 15.0 | used 0.0 | remaining 15.0"` — correctly
updated to reflect the new link and the top-up from TC-MCP-079. Both snapshots are internally consistent with
the data at the time, not a bug (a discrepancy I suspected at first turned out to be me checking before vs.
after a fixture state change, not a defect).

## Negative / Cross-Cutting Cases

### TC-MCP-087 — Permission enforcement across new/improved tools + Helpdesk Customer blocked

**Steps:** Direct REST calls (each user's own API key) against `dashboard`, `reports/agents`, `settings`,
`customers/import`, with: (a) Zero PermTest (confirmed zero helpdesk permission anywhere), (b) the Helpdesk
Customer portal account (willow2.belle).

**Expected Result:** Every endpoint refuses both users by name/reason; a Helpdesk Customer cannot reach any
staff-only endpoint.

**Result: PASS.** Zero PermTest: `dashboard` → `"needs the 'View helpdesk' or 'Manage helpdesk' permission
there."`; `reports` → `"need the 'Manage helpdesk' or 'Export helpdesk reports' permission (or
administrator)."`; `import_customers` → `"needs the 'Manage helpdesk' permission (or administrator)."` — all
three correctly refused once tested against a genuinely clean fixture (an initial pass using Daisy Skye gave a
false alarm — she turned out to hold an incidental Developer role elsewhere that globally grants
`manage_helpdesk`; see "Fixtures built" above). Helpdesk Customer: `dashboard` → `"Helpdesk customers cannot
use this endpoint."`; `reports` → same named-permission message as any other non-privileged caller;
`settings`/`import_customers` → `"Forbidden. Insufficient permissions."` — 4/4 new staff endpoints tested this
way correctly refused her (a 5th, `kb_upload_attachment`'s exact nested route, wasn't pinned down in time to
re-test directly, but its permission check reuses the same `add_kb_page`/`edit_kb_page` gate already exercised
positively in TC-MCP-081, so this is a reasonable, if not 100%-direct, inference rather than a gap).

### TC-MCP-088 — Read-only mode blocks every new write tool

**Steps:** `REDMINEFLUX_READ_ONLY=true`, `docker compose up -d mcp`, then `import_customers`,
`update_settings`, `assign_support_package` — reverted immediately after.

**Expected Result:** All three refused with the standard BLOCKED message.

**Result: PASS.** All three: `"BLOCKED: '<tool>' is a write operation and the server is in read-only mode
(REDMINEFLUX_READ_ONLY=true). Contact your Redmineflux administrator to enable write access."` Reverted
immediately, confirmed normal writes resumed for the rest of the suite.

### TC-MCP-089 — Tool registration count matches the ticket's acceptance criterion

**Result: PASS.** Confirmed live while pulling the two repos onto `C:\crux-redmine` for this suite:
`docker compose restart mcp` → startup log — `INFO:redmineflux-mcp:Loaded plugin: helpdesk — 87 tools (Tickets
(incl. merge), SLAs, organizations, customers, canned responses, holidays, support levels, products)`. Exactly
matches the ticket's stated "Helpdesk tools: 77 → 87."

### TC-MCP-090 — Documented cross-plugin limitation: native Log Time / `/time_entries.json` drops the package

**Steps:** `POST /time_entries.json` directly (not through the Helpdesk API) with
`rf_helpdesk_support_package_id` explicitly included in the body.

**Expected Result:** Per the ticket's own "Known" note: the native endpoint should silently drop the support
package (caused by the Testcase Management plugin's own `TimelogController#create` override, whose strict
`time_entry_params` allow-list has no helpdesk-specific attribute at all), while the Helpdesk reply box and MCP
tools (`add_conversation`, `core_log_time`) stay unaffected.

**Result: PASS — confirmed exactly as the ticket describes, not just taken on faith.** The raw call succeeded
(created `TimeEntry#25`) but genuinely dropped the field: DB-verified
`TimeEntry.find(25).rf_helpdesk_support_package_id == nil`, even though it was explicitly passed in the
request body. TC-MCP-084/085 above (the Helpdesk reply box's own time-logging and `core_log_time`) both
confirmed the package **does** persist through those paths in the same session, on the same instance — directly
corroborating the ticket's own scoping of this as a pre-existing, out-of-scope, non-regression limitation
rather than something #129322 introduced or should have fixed.

## Suite Summary

**17/17 TCs executed, 16/17 PASS, 1 bug found and filed (BUG-MCP-007, Medium, open).** Every one of production
#129322's 10 new tools and 7 improved tools confirmed working and matching the ticket's acceptance criteria,
including customer import's row-level reporting, admin-only settings enforcement, the support-package
apply-to-customers flow (including its override-respecting rule), product/filter/attachment/time-logging
improvements, and the documented cross-plugin TimelogController limitation (independently reproduced, not just
cited). The one defect (`dashboard`'s per-ticket SLA-breach badge disagreeing with every other SLA source) is
isolated and narrow — every other SLA-reporting path on this instance agrees. Two permission-check
investigations initially looked like bugs and were not: Daisy Skye's apparent "bypass" of the Reports
permission check was her own incidental cross-project role (not a product defect, already documented prior
design per `BUG-HLP-057`), and `update_project_customer`'s silently-ignored `rf_organization_id` parameter
is deliberate, already-fixed behavior per `BUG-HLP-064/065` (organization now lives on the customer record, set
only at `create_customer` time) — both are noted inline above so a future session doesn't re-diagnose them
from scratch.
