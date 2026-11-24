# Bug Report Template

- Bug ID: BUG-MCP-007
- Production Redmine Issue ID: #129351 (reported 2026-11-24 via report_defect, linked to testcase #129350, run #689, suite #308)
- Title: Helpdesk `dashboard` tool tags tickets "SLA breached" in its per-ticket list even though its own aggregate counter and every other SLA tool agree there are zero breaches
- Redmine version: 6.0-bookworm (local Docker instance, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux-mcp (new `dashboard` tool, RMCP-054, production #129322) + redmineflux_helpdesk (HD-13)
- Plugin version: redmineflux-mcp 1.1.16, redmineflux_helpdesk master @ ac86f5b
- Environment: Local Docker, Postgres
- Browser: N/A (MCP tool-layer finding, not a UI finding)
- User role: `admin`
- Date: 2026-11-24

## Steps to reproduce

1. On a Helpdesk project with at least one ticket whose **response deadline has already passed** but which has NOT actually breached (e.g. because a first response already happened, or because the breach computation correctly accounts for pauses/responses), call the new `redmineflux_helpdesk_dashboard` tool (global or per-project).
2. In the same call's response, compare the summary line (`SLA: N tracked | breached 0 | ...`) against the `Latest tickets` section for the same tickets.
3. Cross-check the same tickets with `redmineflux_helpdesk_get_sla_status(ticket_id)` and `redmineflux_helpdesk_sla_analytics(project_id)`.

Concretely reproduced on `C:\crux-redmine`'s `Crux Helpdesk Agent Test Project` (id=12):
```
dashboard() → "SLA: 3 tracked | breached 0 | ... compliance 100.0%"
  Latest tickets:
    #178 [new] (low) → Redmine Admin | Regression test ticket · SLA breached
    #28  [Waiting for Customer Response] (low) → Redmine Admin | Printer not connecting to network · SLA breached
```

## Expected result

- The per-ticket "SLA breached" badge in the `dashboard` tool's `Latest tickets` list should agree with the tool's own aggregate "breached" count, and with the authoritative SLA computation used by `get_sla_status`/`sla_analytics`/`list_tickets(sla="breached")`.

## Actual result

- `dashboard`'s own summary line says `breached 0` for the exact same date range/project, and:
  - `get_sla_status(178)` → `Response breached: False`, `Resolution breached: False`
  - `get_sla_status(28)` → `Response breached: False`, `Resolution breached: False`
  - `sla_analytics(project_id=12)` → `Response — met: 1 | breached: 0`, `Resolution — met: 0 | breached: 0`, `Total breaches: 0`
  - `list_tickets(project_id=12, sla="breached")` → `No tickets found.`
  - Yet `dashboard`'s own `Latest tickets` list tags both #178 and #28 with `· SLA breached`.
- All four other, independent SLA-reporting code paths agree (0 breaches); only the brand-new `dashboard` tool's per-ticket badge disagrees. The most likely root cause: the per-ticket badge is computed naively as "response/resolution deadline is in the past" without checking whether a first response already happened or the ticket was later resolved/paused — both #178 and #28 have deadlines in the past (2026-11-19 and 2026-11-04 respectively, "today" being 2026-11-24) but are not actually breached per the authoritative computation.

## Evidence

### Screenshot

N/A — this is an MCP tool-layer finding (raw tool call outputs), not a UI finding; see the exact tool outputs quoted above and in `testcases/MCP_HELPDESK_TOOL_COVERAGE_V2.md` TC-MCP-074.

### Console / log

- Tool outputs quoted verbatim above (`dashboard`, `get_sla_status` x2, `sla_analytics`, `list_tickets`), all captured live via the `redmineflux-local` MCP connector against `C:\crux-redmine`, `localhost:3015`, 2026-11-24.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — checked `bugs/_duplicates.md`, no existing entry for the `dashboard` tool or SLA-breach-badge class of defect.
