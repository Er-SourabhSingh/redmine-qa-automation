# ADR 0002 — A consolidated permission rule is the union, not the narrowest

**Status:** accepted

## Context

The same `rf_holidays` rows were written by five controllers across three
plugins, each with its own guard. Measured against the running application:

| a non-admin holding | shift `/holidays` | helpdesk `/rf_helpdesk_holidays` | workload `/rf_holidays` |
| --- | --- | --- | --- |
| `manage_holidays` | yes | no | no |
| `manage_helpdesk` | no | yes | no |

`HolidayService.can_manage?` already existed and said **admin only** — narrower
than two of the three screens. Adopting it verbatim would have revoked holiday
editing from every non-admin holding either permission.

These rows feed `WorkingCalendar`, so they set timesheet periods, workload
capacity figures and helpdesk SLA deadlines for everybody.

A fourth guard was missed on the first pass and found later: workload's
`apis/workload_holidays_controller` had its own `require_admin`, and that is
the path the MCP holiday tools actually use to write.

## Decision

When two live mechanisms each grant real access, the consolidated rule is their
**union**, and the narrowing that may be correct is recorded as a decision that
is owed rather than performed silently.

`HolidayService::MANAGE_PERMISSIONS` is `%i[manage_holidays manage_helpdesk]`.
`Leave.visible` follows the same principle for shift's global `:approve_leave`
alongside team-level approval.

## Consequences

- A `manage_helpdesk` holder can edit the global working calendar. That is
  probably wrong as a product rule — `manage_helpdesk` is about configuring
  helpdesk — but it is what the helpdesk screen already allowed.
- The recommended end state (admin + `manage_holidays`) is written in the
  service and listed in `NORTH_STAR.md` as an open decision.
- Each arm is pinned by a separate test, so dropping one cannot pass silently.
- Before consolidating a rule, enumerate every controller that writes the
  table, including API controllers. Counting screens is not the same as
  counting write paths.
