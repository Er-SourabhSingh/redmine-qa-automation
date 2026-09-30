# ADR 0004 — A guarantee the platform advertises must be its own

**Status:** accepted

## Context

`Concerns::Auditable` advertised that "a logging failure never affects the
record being saved". It had no rescue of its own; the guarantee came entirely
from `AuditService.log`'s internal `rescue StandardError`.

A test that stubbed `AuditService.log` to raise made `Team.create!` raise
`RuntimeError`. `Auditable` hangs off `after_commit`, and an `after_commit`
that raises propagates to whoever called `save` — so the audit trail could take
down the operation it exists to record. Everything on the concern's own side of
that call can fail too: reading attributes for the destroy identity, a patched
model overriding `project_id`, `previous_changes` inside `after_commit`.

The same shape appeared elsewhere. `RedminefluxPlatform.setting` read
`settings[key.to_s]` only, trusting that no plugin would declare a default as a
Symbol — while `Setting.plugin_<id>` routinely holds both types, which is the
exact blind spot the platform exists to remove.

## Decision

Where the platform advertises a guarantee, it implements that guarantee itself,
even when a collaborator already provides it.

- `Auditable` wraps every callback in `rf_audit_safely`.
- `SettingsService.read` and `RedminefluxPlatform.setting` check both key
  types.
- `HolidayService.can_manage?` rescues and returns false rather than raising
  from inside a `before_action` on five screens.

## Consequences

- Two layers of rescue around an audit write. Deliberate: the service protects
  its own callers, the concern protects the save.
- Slightly more code than strictly necessary while both layers hold. Accepted:
  a guarantee that depends on someone else not changing their mind is not a
  guarantee.
