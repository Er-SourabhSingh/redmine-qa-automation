# ADR 0005 — Nothing ships without a caller

**Status:** accepted

## Context

At one point the platform contained five services and two concerns with no
consumer at all — roughly 590 lines, 14% of the plugin. Written against a guess
about what consumers would want, and never exercised.

`ContactService` and `OrganizationService` are the instructive case. They read
as thin façades — `OrganizationService.active` was literally
`Organization.active.ordered` — but each carried one genuine behaviour the
models lacked: an audit entry on create, and on destroy an entry that captured
the record's name **before** the row disappeared.

The real controllers could not adopt them. `ContactsController#create` handles
custom field values, an avatar upload, product sync and a locked company; the
API controller validates the company id. A service taking a plain attribute
hash cannot express any of that, which is why neither ever had a caller.

## Decision

Code in the platform must have a consumer. Where an unused piece carries a
genuine behaviour, move that behaviour to where every path reaches it, then
delete the unused piece.

`Auditable` gained an `after_commit on: :destroy` hook that captures a small
identity (`name`, `title`, `code`, `email`, `login`, `subject`) from the
in-memory object, and is now declared on the six shared configuration models.
That covers create, update and destroy from a screen, an API endpoint, a rake
task or a console — strictly more than the services did. Both services were
then removed, and the two helpers that called them repointed at the model
scopes.

## Consequences

- The audit trail for shared configuration is automatic rather than opt-in per
  call site.
- Adopting `Auditable` writes rows on every change to those six models. The
  field lists are deliberately small: an audit trail recording every column
  becomes noise nobody reads.
- The platform's UI-kit helpers (`rf_platform_team_select`,
  `rf_platform_holiday_calendar`, `rf_platform_select`,
  `rf_platform_unavailable_note`) are kept despite having no consumer yet.
  Offering views for consumers to adopt is what a platform is for, and unlike
  the services they duplicate nothing. `NORTH_STAR.md` lists them as available
  and unadopted so the gap stays visible rather than becoming invisible.
