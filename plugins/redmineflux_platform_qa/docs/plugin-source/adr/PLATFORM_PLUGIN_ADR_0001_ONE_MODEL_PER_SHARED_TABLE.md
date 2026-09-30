# ADR 0001 — One model per shared table, extended by patching

**Status:** accepted

## Context

Each of the six plugins had built its own model over its own table for the same
concept. `redmineflux_timesheet` had `Timesheet::AuditLog` over
`timesheet_audit_logs`; `redmineflux_shift_management` had `RfAuditLog` over
`rf_audit_logs`. The two tables were the same record under different column
names. The same was true of teams, holidays, leave and organizations.

Consolidating to one table raised the question of whose column names win.
Renaming `holiday_date` to `date` across `redmineflux_shift_management`'s
controllers and twelve views is a large change with no user-visible benefit,
and the same is true of helpdesk's `start_date`.

## Decision

One table, one model class, owned by the platform. No consumer defines a model
over a shared table.

Consumers extend the shared model by **patching** it from
`lib/<plugin>/patches/platform_*_patch.rb`, adding:

- `alias_attribute` for their own column vocabulary
- their own scopes
- their own JSON shape and display helpers
- their own action taxonomy, where the shared table stores events

## Consequences

- `start_date`, `holiday_date` and `date` are one column with three names. A
  reader has to know to look for the patch. `CLAUDE.md` says so.
- A consumer's patch can reach into the shared model, which is a real coupling:
  `redmineflux_timesheet`'s audit patch adds class methods that exist only when
  that plugin is installed. Accepted, because the alternative — pushing one
  consumer's domain vocabulary into the platform — is worse.
- Nineteen holiday views across three plugins still exist. Consolidating them
  is blocked on the `Account` vs `Organization` naming decision.
