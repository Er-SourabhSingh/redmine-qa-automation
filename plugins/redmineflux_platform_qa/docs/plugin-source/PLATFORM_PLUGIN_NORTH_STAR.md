# redmineflux_platform — North Star

The reference this plugin is measured against. It was agreed in conversation
and existed nowhere in the repository, which meant nobody joining the work
could tell what "done" meant or why a given piece of code lives where it does.

## The problem it exists to solve

Six commercial plugins — `redmineflux_crm`, `redmineflux_helpdesk`,
`redmineflux_invoice`, `redmineflux_timesheet`, `redmineflux_workload`,
`redmineflux_shift_management` — grew independently and converged on the same
concepts. Each built its own version of teams, holidays, leave, contacts,
organizations, audit trails and per-user preferences. The result was not merely
repetitive; it was **contradictory**:

- The same holiday rows were protected by four different permission rules, so
  who could edit the company calendar depended on which URL you used.
- Two plugins stored the same audit record in two tables under different
  column names.
- `working_hours_per_day` and `default_work_hours_per_day` were two keys for
  one concept in two namespaces, free to disagree.
- Eleven copies of `parse_date` existed in eight spellings; seven of them
  crashed on a nil parameter because they rescued only `ArgumentError`.

`redmineflux_flux_tags` is deliberately **out of scope**: it is a free plugin
and is not part of this consolidation.

## Principles

1. **One table, one model, one rule.** A concept shared by two plugins gets a
   single table, a single model class, and a single place that decides who may
   change it. No consumer plugin defines a model over a shared table.

2. **A shared model is extended by patching, not by forking.** Each consumer
   adds what only it needs — its own column vocabulary via `alias_attribute`,
   its own scopes, its own JSON shape — in
   `lib/<plugin>/patches/platform_*_patch.rb`. The row is shared; the meaning
   stays with the plugin that owns it. `start_date`, `holiday_date` and `date`
   are one column with three names, on purpose, because renaming them across
   19 views would be a migration with no user-visible benefit.

3. **Repeating a NAME is not repeating a DECISION.** Ten copies of
   `render_not_found` carrying ten different messages are not duplication;
   they are domain wording. Five API error shapes are five published
   contracts. Only decisions get consolidated — measure the bodies before
   assuming, because the copies frequently disagree in ways that matter.

4. **Adopt the widest existing behaviour, then surface the choice.** When two
   live mechanisms each grant real access, the shared rule is their union, not
   the narrower one — silently revoking access somebody depends on is worse
   than an over-broad rule with a comment recording the decision that is owed.
   `HolidayService.can_manage?` and `Leave.visible` both work this way.

5. **A shared table's guarantees are the platform's own, not borrowed.**
   `Auditable` rescues for itself rather than relying on `AuditService`'s
   rescue; the platform's settings reader checks both key types rather than
   trusting callers to. A guarantee that depends on someone else not changing
   their mind is not a guarantee.

6. **Nothing ships without a caller.** Code in the platform with no consumer is
   not "ready for later"; it is an unverified guess that grows. Two services
   were removed under this rule when the thing they were reaching for turned
   out to belong on the model instead.

7. **A consumer must fail loudly at boot if its dependency is unmet**, never
   with a `NoMethodError` six screens deep. Plugin registration is
   alphabetical, so `requires_redmine_plugin` cannot be used by a plugin
   sorting before the platform — the check is deferred to `after_initialize`.

## What the platform owns today

Eleven tables, ten models:

| table | model | shared by |
| --- | --- | --- |
| `rf_teams`, `rf_team_memberships` | `Team`, `TeamMembership` | timesheet, workload, shift |
| `rf_holidays`, `rf_holiday_schemes` | `Holiday`, `HolidayScheme` | helpdesk, workload, shift |
| `rf_leaves`, `rf_leave_types` | `Leave`, `LeaveType` | workload, shift |
| `rf_crm_contacts` | `Contact` | crm, invoice |
| `rf_organizations` | `Organization` | crm, helpdesk, invoice |
| `rf_audit_events` | `AuditEvent` | timesheet, shift |
| `rf_user_preferences` | `UserPreference` | the platform's own screens |
| `rf_platform_schema_info` | — | the platform's own migration bookkeeping |

Services: `WorkingCalendar`, `TeamService`, `HolidayService`, `AuditService`,
`PreferenceService`, `SettingsService`.

Concerns: `Searchable`, `Paginatable`, `Auditable`, `Preferable`,
`Authorizable`. Plus `RedminefluxPlatform::Dates`.

## Offered but not yet adopted

These exist, work, and have no consumer. Listed so the gap stays visible
instead of becoming invisible:

- `rf_platform_team_select`, `rf_platform_organization_select`,
  `rf_platform_contact_select`, `rf_platform_select` — form selects over the
  shared models.
- `rf_platform_holiday_calendar` and
  `app/views/redmineflux_platform/shared/_holiday_calendar.html.erb` — a month
  grid reading the platform calendar, so it cannot disagree with the
  working-day maths a consumer's figures are based on.
- `rf_platform_unavailable_note` — the "this feature needs the platform"
  placeholder.
- `PreferenceService` — reached only through `Concerns::Preferable`, which only
  the platform's own teams screen uses.

Per ADR 0005 these are kept, unlike the two services that were deleted:
offering views for consumers to adopt is what a platform is for, and these
duplicate nothing. A consumer plugin adopting one is a small, safe change.

## Decisions still owed

These are product calls, not engineering gaps, and are deliberately left open:

1. **Core + extension table split.** Whether a shared table should be narrowed
   to the columns every consumer needs, with per-plugin extension tables for
   the rest.
2. **`Account` vs `Organization`.** One name for the concept `rf_organizations`
   holds. Renaming touches every consumer's forms and API payloads.
3. **Version floor.** The minimum platform version a consumer may declare, and
   therefore how long the legacy fallbacks have to stay.

Two narrower ones, recorded where they live in the code:

- Whether `HolidayService.can_manage?` should narrow to admin +
  `manage_holidays`, dropping `manage_helpdesk`. It is currently the union of
  what the screens already allowed.
- Whether the 19 holiday views across three plugins should become one screen.
  Blocked on the naming decision above.

## Explicitly postponed

Named in the North Star, agreed as not-now, and **not** started:

- **Catalog / Money / Commerce** — invoices, payments, currency, tax, rates,
  products, support levels.
- **Time** — one time-entry model shared by timesheet, workload and helpdesk
  SLA maths.
- **Outbox** — one notification and mail-delivery path.
