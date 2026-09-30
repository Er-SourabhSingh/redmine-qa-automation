# Redmineflux Platform

Shared platform layer for the Redmineflux plugin suite. It owns the entities
more than one plugin needs, so each plugin consumes them instead of shipping
its own copy.

**Status: Steps 1-4 complete.** The shared entities are adopted, the services
are in place, and the canonical Teams screen and reusable UI components ship.
No consumer plugin has been modified yet — that is Step 5. See *Roadmap*.

---

## Why this plugin exists

Five plugins had already begun sharing database tables informally, with no
owner, guarded by hand-written `table_exists?` checks. That produced real
defects, not just duplication:

| Table | Created by | Guard |
|---|---|---|
| `rf_teams` | `redmineflux_timesheet` **and** `redmineflux_workload` | `unless table_exists?` |
| `rf_team_memberships` | `redmineflux_timesheet` **and** `redmineflux_workload` | `unless table_exists?` |
| `rf_crm_contacts` | `redmineflux_crm` **and** `redmineflux_invoice` | `return if table_exists?` |

`redmineflux_workload` even ships a migration whose comment reads
*"BUG-RFM-002/009: rf_teams may have been created by redmineflux_timesheet
without the created_by_id column"*, and `redmineflux_helpdesk` ships
`20260522000001_rename_rf_holidays_to_rf_helpdesk_holidays.rb` purely to
vacate a table name `redmineflux_workload` also wanted.

---

## What a consumer plugin needs to know

### Declaring the dependency

For a plugin that genuinely cannot function without the platform — currently
timesheet, workload, CRM and invoice, because their core tables live here:

```ruby
# in the consumer's init.rb, inside Redmine::Plugin.register
requires_redmine_plugin :redmineflux_platform, version_or_higher: '1.0.0'
```

For a version floor that Redmine's declaration cannot express, or for a
clearer error message, add:

```ruby
unless defined?(RedminefluxPlatform)
  raise 'Redmineflux Workload requires the Redmineflux Platform plugin.'
end
RedminefluxPlatform.require_version!('>= 1.0', for_plugin: 'Redmineflux Workload')
```

The `defined?` guard is not optional. If the platform is absent the constant
does not exist, so calling the method first would raise `NameError` before it
could produce a useful message.

For an optional integration — helpdesk, gantt, testcase, agile, knowledgebase —
branch instead of raising:

```ruby
if defined?(RedminefluxPlatform) && RedminefluxPlatform.feature?(:audit)
  # show the audit tab
end
```

### `available?` vs `installed?`

```ruby
RedminefluxPlatform.installed?   # plugin directory registered with Redmine
RedminefluxPlatform.migrated?    # its migrations have actually run
RedminefluxPlatform.available?   # both — this is the one to branch on
```

Always branch on `available?`. *Installed but unmigrated* is a real state
users hit: `redmineflux_crm` currently guards roughly twenty call sites with
`CrmActivity.table_exists?` for exactly this reason.

### Capability probes

```ruby
RedminefluxPlatform.feature?(:audit)   # => true / false
RedminefluxPlatform.feature?(:teams)
```

Current capabilities: `:audit`, `:preferences`, `:teams`, `:holidays`,
`:organizations`, `:contacts`.

A capability is listed only once the platform genuinely implements it — a table
merely existing is not the same as the platform owning it. `feature?` returns
false for an unknown name rather than raising, so a consumer written against a
newer platform degrades on an older one instead of crashing.

Prefer this over probing the schema yourself. Today
`Timesheet::RfTeamsController#skills_feature_available?` calls
`connection.data_source_exists?`, then `User.reflect_on_association`, then
reflects again on the resulting class, inside a triple rescue — a plugin
reverse-engineering another plugin's schema on a live request because no
contract existed to ask instead.

---

## What is here now

### Services

```ruby
# Append-only audit trail. Never raises; returns nil on failure, because an
# audit trail is a record of work, not a precondition for it.
RedminefluxPlatform::AuditService.log(
  auditable: team, action: 'member_added',
  performed_by: User.current, metadata: { user_id: 42 }
)
RedminefluxPlatform::AuditService.for_record(team, limit: 20)

# Per-user view state. Reads fall back from project-scoped to global.
RedminefluxPlatform::PreferenceService.set(user, 'gantt.zoom', 'week', project: project)
RedminefluxPlatform::PreferenceService.get(user, 'gantt.zoom', default: 'day')
RedminefluxPlatform::PreferenceService.unset(user, 'gantt.zoom', project: project)

# Layered settings: caller override -> platform -> originating plugin -> default.
RedminefluxPlatform::SettingsService.working_hours_per_day
RedminefluxPlatform::SettingsService.get('company_name')
RedminefluxPlatform::SettingsService.source_of('working_hours_per_day')  # => :platform | :redmineflux_workload | :default
```

`SettingsService` is what makes settings migration safe. `working_hours_per_day`
currently exists twice — as `working_hours_per_day` in workload and
`default_work_hours_per_day` in timesheet, in two separate namespaces, which is
precisely how they can disagree. Both resolve through this service to one
platform value once an administrator sets it, and fall back to the original
plugin key until then. **Introducing the settings screen changes no behaviour
on its own.**

### Concerns

```ruby
class Organization < ActiveRecord::Base
  include RedminefluxPlatform::Concerns::Searchable
  rf_searchable_on :name, :website, :phone_number
end

Organization.rf_search(params[:search])   # blank term returns all, not none
```

Promoted essentially unchanged from `RedminefluxHelpdesk::Searchable`, which
was already generic and already serving six models. Uses `LOWER(..) LIKE`
rather than `ILIKE` because these plugins ship against MySQL as well as
PostgreSQL.

### API base controller

```ruby
class MyPluginController < RedminefluxPlatform::ApiController
  def index
    render_success(items, meta: pagination_meta(total))
  end
end
```

Provides one API-key path (`X-Redmine-API-Key` header, then `?key=`, then
`?api_key=`), one response envelope, one error handler and one pagination
contract — replacing three separate implementations of the same fallback and
three different envelopes invented independently.

**Existing endpoints keep the shape they return today.** This class governs
new endpoints only; changing a live response shape is a breaking change for
MCP clients, not a cleanup.

### Pagination renderer

```ruby
will_paginate @records, renderer: RedminefluxPlatform::PaginationRenderer
```

`flux_tags` and `redmineflux_testcase_management` each define a **top-level**
class named `CustomWillPaginateRenderer`, differing only in indentation;
whichever loads last silently wins. Namespacing is the whole fix.

### Tables

| Table | Purpose |
|---|---|
| `rf_platform_schema_info` | Sentinel proving migrations ran, backing `available?` |
| `rf_audit_events` | One polymorphic append-only audit trail |
| `rf_user_preferences` | One keyed store for per-user view state |

`rf_audit_events` is **not** named `rf_audit_logs`: that name is already taken
on existing databases by the since-removed `redmineflux_budget_and_audit`
plugin, whose tables remain.

Adopted from the consumer plugins, unchanged and with no data moved:

| Table | Adopted from | Model |
|---|---|---|
| `rf_teams` | timesheet + workload | `Team` |
| `rf_team_memberships` | timesheet + workload | `TeamMembership` |
| `rf_holidays` | workload | `Holiday` |
| `rf_holiday_schemes` | workload | `HolidayScheme` |
| `rf_organizations` | helpdesk | `Organization` |
| `rf_crm_contacts` | crm + invoice | `Contact` |

Each platform model carries the shared validations verbatim, so adopting it
changes no behaviour, and deliberately omits the owning plugin's own concerns:
`Holiday` and `HolidayScheme` do **not** carry workload's capacity-recalculation
callbacks, and `Contact` does **not** carry CRM's deals, activities or tag
handling. Those stay with their plugin, which keeps them by subclassing.

`Organization` replaces helpdesk's hardcoded delete protection with a registry,
so a consumer keeps its own rule without the platform naming a consumer table:

```ruby
RedminefluxPlatform::Organization.register_destroy_guard(:helpdesk) do |org|
  'in use by project customers' if RfProjectCustomer.exists?(rf_organization_id: org.id)
end
```

Return a reason string to block the delete, or nil to allow it. A guard that
raises blocks rather than silently permitting.

### Shared UI

The canonical Teams screen lives at `/redmineflux_platform/teams`. It is
**additive**: workload's `/rf_teams` and timesheet's `/timesheet/teams` both
keep working on the same rows, so this ships without retiring either.

Those two implementations total roughly 10,800 lines across views, JavaScript
and stylesheets, of which only ~1,227 actually differ — the two
`rf_teams_index.css` files are 992 lines each and differ by 42. The platform
screen is 162 lines of CSS and 48 of JavaScript, because it builds on
Redmine's own `list`/`box` classes instead of reimplementing a design system.

Unlike either existing screen, it emits view hooks, so a consumer contributes
a panel rather than forking the page:

```ruby
# in a consumer's lib/<plugin>/hooks/view_hooks.rb
def view_rf_platform_teams_show_bottom(context)
  # timesheet renders its approval-schema panel here,
  # workload its skills panel
end
```

Available hooks: `view_rf_platform_teams_index_top`,
`..._index_headers`, `..._index_row`, `..._index_bottom`,
`..._show_top`, `..._show_member_headers`, `..._show_member_row`,
`..._show_bottom`, `..._form`.

### Reusable view helpers

Every consumer currently hand-rolls its own team and organization pickers.
These replace them:

```erb
<%= rf_platform_team_select('issue[team_id]', @issue.team_id) %>
<%= rf_platform_organization_select('f[org_id]', selected, active_only: true) %>
<%= rf_platform_contact_select('invoice[customer_id]', selected) %>
<%= rf_platform_user_select('member[user_id]', nil, team: @team, multiple: true) %>
<%= rf_platform_holiday_calendar(month: 9, year: 2026) %>
<%= rf_platform_search_field(my_index_path) %>
<%= rf_platform_boolean(membership.approver?) %>
```

**A consumer controller must include the helper explicitly:**

```ruby
helper RedminefluxPlatformHelper
```

Rails' automatic helper inclusion does not reach a plugin's `app/helpers`, so
without that line the views raise `NoMethodError` on
`rf_platform_search_field` at render time rather than at boot.

Each selector degrades to an inline explanation when its feature is
unavailable, so a consumer rendering one before the platform has migrated
shows a message instead of a 500.

### HTTP API

```
GET /redmineflux_platform/api/v1/info
GET /redmineflux_platform/api/v1/teams[/:id]
GET /redmineflux_platform/api/v1/working_days?from=&to=
GET /redmineflux_platform/api/v1/working_days/check?date=
```

Teams are read-only for now. Writes stay with workload and timesheet until
their two UIs are consolidated — a third mutation path would make the
duplication worse, not better.

---

## Pre-flight check

Read-only. Writes nothing. Run it before any migration work:

```bash
bundle exec rake redmineflux_platform:preflight RAILS_ENV=production
```

It reports row counts, and the three findings that decide how the migration
must be written: overlapping helpdesk holiday date ranges, team names
differing only by case, and dangling ids inside `rf_slas.holiday_ids`.

---

## Migration ownership rules

**Redmine migrates plugins in alphabetical order by plugin id**
(`Plugin.all` is `registered_plugins.values.sort`, and `<=>` compares
`id.to_s`). That single fact governs where a `create_table` may live:

```
crm -> helpdesk -> invoice -> PLATFORM -> timesheet -> workload
 |        |           |                       |           |
 +--------+-----------+                       +-----------+
    run BEFORE platform                  run AFTER platform
```

- **Teams and holidays** — the platform creates these, because it sorts before
  `timesheet` and `workload`. Their own create-migrations can therefore be
  removed.
- **Contacts and organizations** — the create-migration must stay in CRM,
  helpdesk and invoice, because they sort *before* the platform. Deleting
  CRM's `001` would leave CRM's `009` calling
  `column_exists?(:rf_crm_contacts, :project_id)` against a table that does
  not exist yet, which raises `PG::UndefinedTable` on a fresh install. The
  platform owns the model and every future change; it does not own that first
  `create_table`.

Every platform migration for a shared table is therefore **adopt-or-create**,
guarded both ways, and must not assume it won the race.

Never delete a migration that has already run on a customer installation.
Redmine records applied plugin migrations in `schema_migrations` as
`"<version>-<plugin_id>"`, and a recorded version whose file is gone can no
longer be reversed — which is why this database still carries orphan tables
from `redmineflux_devops`, `redmineflux_shift_management` and
`redmineflux_budget_and_audit`.

---

## Roadmap

| Step | Scope | State |
|---|---|---|
| 1 | Foundation: contract, audit, preferences, settings, API base, Searchable, pagination | **done** |
| 2 | Adopt `rf_teams`, `rf_team_memberships`, `rf_holidays`, `rf_holiday_schemes`, `rf_organizations`, `rf_crm_contacts` | **done** |
| 3 | `WorkingCalendar`, `TeamService`, `HolidayService`, `OrganizationService`, `ContactService`, `Auditable`, `Preferable` | **done** |
| 4 | Shared UI: canonical Teams screen, selectors, holiday calendar, shared CSS/JS | **done** |
| 5 | Consumer migration: invoice, workload, timesheet, CRM, helpdesk | not started |

Step 2 moved no data. `rf_teams` and `rf_holidays` are created by the platform
on a fresh install (it sorts before `timesheet`/`workload`) and adopted in
place on an existing one; `rf_organizations` and `rf_crm_contacts` are always
adopted, because `crm`, `helpdesk` and `invoice` sort before it.

### WorkingCalendar

*Is this a working day?* had three incompatible answers on one installation:
timesheet hardcoded Saturday/Sunday and ignored both holidays and Redmine's
own `non_working_week_days`; workload read that setting plus the active
holiday scheme plus user leave; helpdesk used a per-SLA working-days string
with its own holiday list. Measured on this database, timesheet and the
platform disagree by **four days in a single month**.

```ruby
WorkingCalendar.working_day?(Date.today)

# bulk work: ONE query per year touched, then pure Ruby
cal = WorkingCalendar.for
cal.count_working_days(from, to)      # 365 dates == 3 SQL queries
cal.next_working_day(date)
cal.add_working_days(date, 5)         # negative counts walk backwards
cal.holidays_covering(date)           # WHY a date is off

# helpdesk: a per-SLA window and a per-SLA holiday subset
WorkingCalendar.for(
  working_weekdays: sla.working_days_array,   # ["Monday", ...] or cwdays
  holiday_ids: sla.holiday_ids_array
)
```

Recurring holidays are evaluated as **rules**, not materialised rows: a
holiday with `is_recurring` and `month`/`day_of_month` is matched directly for
any year, multi-day spans included, with 29 February in a non-leap year
correctly skipped. This is what makes
`Holiday.generate_recurring_for_year` unnecessary — see the note on that
method for why materialising cannot work against the current name-uniqueness
constraint, and why redmineflux_workload's version reports successes it never
persisted.

Per-user leave is deliberately absent. Leave belongs to workload, so workload
composes the two: `calendar.working_day?(d) && !user_on_leave?(user, d)`.

### TeamService

`can_manage?` is the fix for a confirmed defect. The same `rf_teams` rows are
currently protected by two different rules — workload checks
`can_manage_rf_teams?`, timesheet checks `admin?` and nothing else — so a
non-admin holding the permission can edit a team at `/rf_teams` and is refused
for the same row at `/timesheet/teams`, having been shown buttons by views
that gate on the permission in twelve places.

```ruby
TeamService.can_manage?(user, team)            # admin, or a role granting manage_rf_teams
TeamService.can_manage_workload?(user, team)   # deliberately NOT implied by the above
TeamService.can_approve_leave_for?(user, target)
TeamService.for_user(user)
TeamService.teammate_ids(user)                 # what timesheet needs and cannot currently reach
```

`can_manage_workload?` stays separate on purpose: workload's own
`WorkloadBaseController` carries the comment *"manage_rf_teams is a TEAM admin
permission ... It must NOT automatically grant workload management rights."*

---

## Design rules

1. **The platform depends on Redmine core only.** It must never require
   another Redmineflux plugin, in either direction — and never a free-tier one
   such as `flux_tags`. A paid platform layer whose boot depends on a plugin
   the customer can remove is not a platform.
2. **Everything is namespaced under `RedminefluxPlatform::`,** models included.
   Adding an unnamespaced constant here would recreate the very collision this
   plugin exists to end.
3. **Table names keep the plain `rf_` prefix,** not `rf_platform_`. The
   platform adopts existing tables; an `rf_platform_*` scheme would force a
   rename of exactly the tables we are trying to stop renaming, turning a
   zero-data-migration job into a risky one.
4. **UI belongs here only when it *manages* a shared entity,** not when it
   *uses* one. Teams CRUD is the platform's; workload's capacity board is
   workload's. Shared screens emit `call_hook` points so consumers contribute
   panels rather than forking the screen.
5. **No DB-level foreign key from a consumer plugin into a platform table.**
   `redmineflux_invoice` migration `028` had to drop exactly such a constraint
   after its referent moved. Enforce those in the model.
6. **Portable SQL only** — no partial indexes, no PostgreSQL-only types.
