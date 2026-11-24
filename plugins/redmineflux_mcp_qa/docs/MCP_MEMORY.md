# Plugin Memory — Redmineflux MCP Server

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- **Helpdesk SLA "breached" status has two independent code paths that can disagree if Sidekiq isn't running.**
  `redmineflux_helpdesk_dashboard`'s per-ticket badge reads `RfIssueSlaStatus#sla_health_status`, which checks
  the live deadline (`seconds_remaining <= 0`) in addition to the `response_breached`/`resolution_breached` DB
  columns. `get_sla_status`, `sla_analytics`, and `list_tickets(sla=...)` read *only* those DB columns. The
  columns are set *exclusively* by `Helpdesk::SlaMonitorWorker`, a Sidekiq job scheduled every 2 minutes
  (`config/sidekiq.yml`) — never by any request-time code. **`C:\crux-redmine`'s `docker-compose.yml` has no
  Sidekiq service at all**, so on this stack those columns never get set, and a ticket whose deadline has
  passed will show "breached" on `dashboard` but "not breached" on every other SLA tool — looks exactly like a
  bug (filed once as BUG-MCP-006 — no, BUG-MCP-007 — then closed as not-a-bug after independently starting
  Sidekiq and confirming it resolves within one 2-minute cycle). **Before concluding dashboard-vs-other-tool SLA
  figures disagree, start Sidekiq manually first** (`bundle exec sidekiq -r ./config/environment.rb -q helpdesk
  -q helpdesk_emails -q mailers -q default`, run from `/usr/src/redmine` inside the `redmine` container — note
  `config/sidekiq.yml` lives under the *plugin's* own `config/`, not the app root's, but Sidekiq still finds and
  loads it automatically once the Rails app boots) and wait ~2 minutes before treating a mismatch as real.
- **A helpdesk customer's organization can only be set at `create_customer` time; no MCP tool can change it
  afterward.** `update_customer` doesn't expose `rf_organization_id` at all, and `update_project_customer`'s own
  `rf_organization_id` parameter is silently ignored by design — `apply_package_aware_attrs` always re-derives
  the organization from the *customer's own* `rf_organization_id` field (per a `BUG-HLP-064/065` fix already on
  this branch, confirmed via source read, not a regression). If an existing customer's org needs changing for a
  fixture, there is currently no MCP path — only the native UI, or re-creating the customer.
- **Testcase milestones can only be linked to a run via `ci_bootstrap_run`'s own `milestone` parameter** — plain
  `create_run`/`update_run` have no `milestone_id` field at all (checked both schemas). Milestone report/
  burndown numbers are otherwise correct once a CI-bootstrapped run exists.
- **Any time-logging call on an instance that also has `redmineflux_budget_and_audit` installed requires the
  target issue to have a native Redmine Issue Category AND an approved-hours budget for that (project,
  category) pair** — otherwise every time-logging tool (`core_log_time`, `add_conversation` with `log_hours`,
  the native Log Time form, raw `/time_entries.json`) fails with `"Category can not be blank"`. Root-caused via
  Rails console to `budget_and_audit`'s own `TimeEntry` patch (`check_approved_hour`); completely unrelated to
  Helpdesk or Testcase Management. Fix: `redmineflux_core_update_issue(issue_id, category_id=...)` then
  `redmineflux_budget_audit_set_budget(project_id, category_id, hours, comment)` before logging any time.
  `core_log_time`'s own docstring already documents this exact error and recovery steps — read it before
  re-diagnosing from scratch.
- **Helpdesk's `require_admin_or_manage_helpdesk`-style permission gates (Reports, and likely others sharing the
  pattern) check `allowed_to?(..., nil, global: true)`** — true if the user holds that permission on ANY
  project, not just the one the request concerns. This is intentional, pre-existing design (own code comment
  cites `BUG-HLP-057`: an earlier version of this check didn't recognize `export_helpdesk_reports` as its own
  permission at all), not a new defect — but it means a "zero helpdesk permission" test fixture is only valid
  if that user ALSO has zero elevated role on every OTHER project on the instance. Before trusting such a
  fixture, dump the user's full cross-project membership list (not just their role on the project under test).
  The Helpdesk Settings admin-only gate, by contrast, genuinely checks `User.current.admin?` with no global-role
  shortcut — confirmed both Manager and Reporter roles refused identically there.
- **`add_project_customer`'s own error message can be misleading.** "Warning: No project-customer records were
  created. One or more customer IDs may not exist or may already be linked to this project." is shown even when
  the *real* reason is a different missing required field (e.g. `rf_support_level_id`) — the raw REST endpoint's
  own JSON response (`{"errors":[{"customer_id":N,"errors":["Rf support level Support Level is required"]}]}`)
  has the actual reason; the MCP tool's generic summary doesn't surface it.
- **`get_run_testcases`'s formatted text output doesn't surface the per-result assignee field**, even though
  `reassign_run_testcases` correctly sets it and the raw REST response (`GET /testcase_mcp/projects/:id/runs/
  :id/testcases.json`) shows it plainly under each result's `assignee` key. A presentation gap in one tool's
  text formatting, not a data-correctness issue — check the raw REST response before concluding a reassignment
  "didn't take."

## Confirmed Working

- **#129311 (Testcase Management tool coverage, 66→100 tools) and #129322 (Helpdesk tool coverage, 77→87
  tools) — both fully confirmed, 2026-11-24.** See `testcases/MCP_TESTCASE_MANAGEMENT_TOOL_COVERAGE.md`
  (18/18 PASS) and `testcases/MCP_HELPDESK_TOOL_COVERAGE_V2.md` (17/17 PASS — the initial BUG-MCP-007 finding
  was root-caused to a missing Sidekiq worker and closed as not-a-bug, see below). Tool counts
  live-verified exact against each ticket's own acceptance criterion.
- Milestone full lifecycle (create/rename/close/reopen/delete), exploratory sessions (full lifecycle +
  closed-session lock), Run Comparison, Automation Dashboard, Most Failed/Slow/Flaky, Quality HQ, Testcase
  Activity, requirements (full CRUD + publish + the cross-project link-skip rule), requirement templates
  (admin-only), run reassignment, defect linking, CI bootstrap/ingest, read-only mode blocking every new write
  tool in both plugins.
- Support package assignment + `apply_to_customers` (including correctly skipping a hand-overridden customer's
  SLA), prepaid budget history, support-level pre-assignment check, KB attachment upload, ticket Product field
  (incl. inactive-product refusal), `list_tickets`'s 16 filters, `add_conversation`/`core_log_time`'s support
  package field (DB-verified), customer CSV import with per-row success/fail reporting, Helpdesk Settings
  admin-only enforcement.

## Recurring Issues

- (none open currently — BUG-MCP-007, the Helpdesk `dashboard` SLA-badge "mismatch," was closed 2026-11-24 as
  not-a-bug; see the Sidekiq-dependency Known Quirk above.)

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/redmineflux-mcp/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
- `C:\crux-redmine` has `redmineflux_testcase_management`, `redmineflux_helpdesk`, and
  `redmineflux_budget_and_audit` ALL installed together — any single-plugin test can trip over another
  plugin's precondition (category/budget for time-logging, TimelogController's strict param allow-list for
  support packages) even when the finding has nothing to do with the plugin actually under test. Check which
  plugin a validation error actually originates from (grep the message text across `plugins/*/app`,
  `plugins/*/lib`) before assuming it belongs to the plugin you're testing.
