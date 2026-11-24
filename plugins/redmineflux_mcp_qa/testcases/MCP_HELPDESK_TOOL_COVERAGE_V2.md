# Test Suite — MCP Server: Helpdesk Full Tool Coverage, Round 2 (production #129322)

> **Status: DRAFTED 2026-11-24 — not yet executed**, except TC-MCP-089 (tool-registration count), which was
> confirmed live while preparing this suite and is marked PASS below.
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
> ahead on `master`); `redmineflux-mcp` was already at `a8fc38c`/1.1.16 from an unrelated earlier retest this
> session, which already fast-forwards past `fe30dc4` (confirmed via `git merge-base --is-ancestor`). Stack:
> Redmine 6.0-bookworm, `localhost:3015`, admin API key `a47f42bc539c5bfe3a10cc392838fa5c8d2e7a35`.
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
- **Explicitly documented, non-defect limitation** (ticket's own "Known" note): with the Testcase Management
  plugin installed, Redmine's native Log Time form and `/time_entries.json` drop the support package field,
  because that plugin overrides `TimelogController#create`. The Helpdesk reply box and these MCP tools are
  unaffected — this is out of scope for #129322, not something to file as a Helpdesk/MCP bug.

## Fixtures needed (not yet created — needed before execution)

- At least one Organization with a Support Package assignable on a project, with a couple of Customers under it,
  so `assign_support_package`/`prepaid_history`/`get_organization` overview have real data to check against the
  native screens.
- At least one active Product on the test project (for the `create_ticket`/`update_ticket`/`get_ticket` Product
  checks) and one inactive/other-project product (negative case — only an active product of the ticket's own
  project should be accepted).
- A small, valid customer-import CSV matching the template's exact column format, plus a deliberately-malformed
  row (to exercise the "created / linked / failed with reason" per-row reporting).
- Three fixture users: **Admin**, a **Manager with `manage_helpdesk`** but not an administrator (for the
  dashboard/report/support-package/prepaid checks that accept `manage_helpdesk` without full admin), and a
  **Helpdesk Customer** (to confirm the portal-only account is refused on every new staff endpoint).
- A Knowledgebase page the fixture user has `add_kb_page`/`edit_kb_page` on, plus a small test file to upload as
  an attachment.

## Positive Cases — Dashboard & Reports (brand new)

- **TC-MCP-074** — `dashboard` tool, both global and per-project: ticket cards, breakdown by priority/status,
  top organizations, agent workload, SLA health all match the native Helpdesk Dashboard screen for the same
  scope.
- **TC-MCP-075** — `report` tool, all 4 report types (Agent, Ticket Summary, Organization, Project) for the same
  date range: figures match each report's own native screen (only the SLA report previously had an API).

## Positive Cases — Customer Import (brand new)

- **TC-MCP-076** — `customer_import_template` returns the exact column format the Import Customers screen
  expects; `import_customers` with a CSV containing one clean row and one deliberately-bad row reports the
  clean row as created/linked and the bad row as failed with the real reason, exactly matching the native
  Import Customers screen's own per-row reporting (not just an aggregate success/fail count).

## Positive Cases — Global Settings (brand new, admin-only)

- **TC-MCP-077** — `get_settings`/`update_settings`: as Admin, change which ticket statuses email the customer
  (#129127) and the private mail host policy, confirm the Helpdesk Settings screen reflects the same choice;
  as the Manager fixture (not an administrator), the same `update_settings` call is refused.

## Positive Cases — Support Package & Budget (brand new)

- **TC-MCP-078** — `assign_support_package`: assign a Support Package to an organization on a project, and apply
  it to that organization's existing customers — confirm via the native Organization page that the package and
  its applied customers match.
- **TC-MCP-079** — `prepaid_history`: confirm top-ups, reductions, and deductions all appear with the same
  totals as the native Organization page's budget history section.

## Positive Cases — Support Level & Knowledgebase (brand new)

- **TC-MCP-080** — `check_support_level`: the same pre-assignment check the native "assign to agent" flow runs
  — confirm it returns the same pass/fail verdict the native UI would show before letting the assignment
  proceed.
- **TC-MCP-081** — `kb_upload_attachment`: upload a file to a Knowledgebase page via the tool, confirm it
  appears as a real attachment on the native KB page.

## Positive Cases — Improved Existing Tools

- **TC-MCP-082** — `create_ticket`/`update_ticket` accept a Product: confirm only an *active* product belonging
  to the ticket's own project is accepted (negative sub-case: an inactive product, or one from a different
  project, is refused); `get_ticket` now shows both Product and Organization on the same call.
- **TC-MCP-083** — `list_tickets`' new filters match the native Tickets screen for each: customer, organization,
  priority, updated-by, SLA state, ticket id, subject, description, done ratio, start/due/closed dates (16
  filters total, up from 5).
- **TC-MCP-084** — `add_conversation` with attachments + logged time (hours, activity, support package):
  confirm the reply's attachment and the logged time entry both appear exactly as a reply from the native
  ticket page would produce, and prepaid hours are counted the same way.
- **TC-MCP-085** — `core_log_time` accepts `support_package_id` directly (not only via `add_conversation`):
  confirm the resulting time entry carries the package and prepaid hours are counted correctly.
- **TC-MCP-086** — `get_organization` now returns an overview (projects, customers, open tickets, prepaid
  totals) matching the native Organization page's own summary section.

## Negative / Cross-Cutting Cases

- **TC-MCP-087** — Permission enforcement across a representative sample of the new/improved tools: a project
  member without the relevant helpdesk permission is refused naming the missing permission; the Helpdesk
  Customer fixture cannot reach any of the new staff endpoints at all (dashboard, reports, import, settings,
  support package, prepaid history, support-level check, KB upload) — confirm each is refused, not just a
  sample of one.
- **TC-MCP-088** — `REDMINEFLUX_READ_ONLY=true` blocks every new write tool from this ticket
  (`import_customers`, `update_settings`, `assign_support_package`, `kb_upload_attachment`, the Product-setting
  path of `create_ticket`/`update_ticket`, `add_conversation` with time logging, `core_log_time` with
  `support_package_id`) with the same BLOCKED message family already confirmed elsewhere in this plugin.
- **TC-MCP-089** — Tool registration count matches the ticket's own acceptance criterion: helpdesk reports
  **87 tools** (77 pre-existing + 10 new) once the MCP server restarts against the pulled plugin.

  **Result: PASS.** Confirmed live while pulling the two repos onto `C:\crux-redmine` for this suite (before
  any functional TC above was executed): `docker compose restart mcp` → startup log —
  `INFO:redmineflux-mcp:Loaded plugin: helpdesk — 87 tools (Tickets (incl. merge), SLAs, organizations,
  customers, canned responses, holidays, support levels, products)`. Exactly matches the ticket's stated
  "Helpdesk tools: 77 → 87."

- **TC-MCP-090** — Documented, non-defect limitation (regression-check only, per the ticket's own "Known" note):
  with the Testcase Management plugin installed on the same instance (it is, on `C:\crux-redmine`), confirm the
  native Redmine Log Time form and a direct `POST /time_entries.json` both genuinely drop the support package
  field (expected, caused by the Testcase Management plugin's own `TimelogController#create` override — out of
  scope for #129322), while the Helpdesk reply box's own time-logging UI and `core_log_time`/`add_conversation`
  (TC-MCP-084/085 above) are confirmed unaffected and still carry the package correctly.

## Execution Notes

- Same methodology as `MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md`: native tool calls, cross-verify every write
  against the plugin's own native screen, file any genuine defect per CLAUDE.md §5.
- This file is a **draft awaiting execution** — the fixtures listed above (organization + support package +
  customers, active/inactive products, import CSVs, the Manager and Helpdesk Customer fixture users, a KB page)
  need to be built first; none of that setup exists on `C:\crux-redmine` yet as of this write-up.
