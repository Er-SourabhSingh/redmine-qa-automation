# Working in redmineflux_platform

Read `NORTH_STAR.md` first: it says what this plugin is for and which
decisions are deliberately still open.

## What lives here, and what does not

This plugin holds the tables, models and rules that **more than one** of the
six commercial plugins needs. It holds no domain logic that only one plugin
uses — `'schema_assign'` and `'mode_switch'` mean nothing outside
`redmineflux_timesheet`, so its action taxonomy stays in
`redmineflux_timesheet`, even though the audit rows it writes live in the
shared table.

The six consumers are `redmineflux_crm`, `redmineflux_helpdesk`,
`redmineflux_invoice`, `redmineflux_timesheet`, `redmineflux_workload` and
`redmineflux_shift_management`. `redmineflux_flux_tags` is out of scope: it is
a free plugin.

## Things about this codebase that will cost you an hour if you learn them the hard way

**Plugin registration is alphabetical.** `redmineflux_platform` loads 18th of
24; `redmineflux_crm` is 7th, `redmineflux_helpdesk` 13th,
`redmineflux_invoice` 14th. So `requires_redmine_plugin` — which resolves
immediately through `Plugin.find` — cannot be used by any consumer sorting
before the platform. Dependency checks are deferred to `after_initialize` and
raise `RedminefluxPlatform::DependencyError`.

**A `belongs_to` association name shadows a same-named column.** With
`belongs_to :role`, `where(role: 'lead')` compiles to `role_id = NULL`: zero
rows, no error, no warning. This has already bitten this codebase.

**`def` inside `class_eval` replaces the method — there is no `super`.** To
wrap an existing method you need a prepended module.

**Constant lookup inside a module starts at the module's own nesting.** A bare
`Paginator` resolves in a controller (via `include Redmine::Pagination`) but
raises `NameError` inside a concern. Write
`Redmine::Pagination::Paginator`. This shipped broken once and took nine
controller tests across three plugins to notice.

**`Setting.plugin_<id>` can hold the same key twice.** A default declared in a
plugin's `init.rb` lands as a **Symbol**; the same key saved through the
settings form lands as a **String**; the hash has no indifferent access. Never
index it directly — use `SettingsService.read` / `.stored?` / `.read_boolean` /
`.read_float`, which check both.

**Redmine skips session authentication for an "API request".**
`api_request?` is `%w[xml json].include?(params[:format])`, and only a URL
extension sets `params[:format]` — so `/x.json` bypasses the session while
`/x` with `Accept: application/json` does not. A screen whose JavaScript
fetches `.json` URLs will find its own admin arriving unauthenticated. Fetch
the extensionless path and let `dataType: 'json'` negotiate. Do **not** "fix"
it by disabling `require_login` or by embedding an API key in the page; both
were found here and both are now gone.

**`TimeEntry#hours` returns a `Rational`** despite the float column, and
`Rational#to_json` emits the string `"8/1"`.

**`after_commit` does not fire in transactional tests.** A test class asserting
`Auditable` behaviour must set `self.use_transactional_tests = false` and clean
up by hand, or it will pass while testing nothing.

**Ruby 3: declaring one keyword argument makes every trailing keyword a
keyword.** Mixing a positional options hash with keywords gives
`unknown keywords:`.

## How to extend a shared model from a consumer plugin

Patch it. Do not subclass it and do not define a second model over the table.

    # lib/redmineflux_workload/patches/platform_holiday_patch.rb
    alias_attribute :holiday_date, :date

Each consumer keeps its own column vocabulary, scopes and JSON shape. The row
is shared; the meaning is not. `start_date`, `holiday_date` and `date` are one
column with three names, deliberately.

## Before you consolidate anything

**Measure the copies first.** Extract every body, normalise it, and group by
content. In this codebase:

- `per_page_option` — 7 copies, identical but for one token → consolidated.
- `parse_date` — 11 copies, 8 bodies, all subsets of one union → consolidated.
- `render_not_found` — 10 copies, **10 different bodies**, each a different
  user-facing message → left alone.
- `render_forbidden` — 6 copies, **5 different JSON shapes**, each a published
  API contract → left alone.

Three of those four look identical from a `grep -c`. Two of them are not
duplication at all.

## Testing

There are no fixtures by design. `test/test_helper.rb` carries builders
(`build_scheme`, `build_holiday`, `build_contact`, `build_organization`,
`build_team`, `build_leave_type`, `with_non_working_week_days`) because each
test needs a specific shape rather than a shared one.

Run one plugin's suite, or several:

    docker compose exec redmine bash /tmp/run_tests.sh redmineflux_platform

That wrapper exists because `redmineflux_notification`'s Gemfile pins
`factory_girl ~> 4.0`, which calls `ActiveSupport::Deprecation.warn` as a class
method at load time — an instance method since Rails 7.1 — so bundler aborts
the entire run before a single test executes. The wrapper renames that one
Gemfile for the duration. It renames a **file**, not a directory: `plugins/` is
a Windows bind mount, `/tmp` is the container overlay, and a `mv` between them
is copy-then-unlink, which has already destroyed a plugin directory once.

`assigns()` was extracted out of Rails — read controller ivars with
`@controller.instance_variable_get(:@foo)`.

## What is deliberately absent

`Catalog`/`Money`/`Commerce` and a shared `Time` model. Named in the North
Star and postponed per its own §12 minimal-viable-core recommendation: ship
Accounts + Catalog first (done, via Organization/Contact), leave the rest
until a second consumer actually needs them. Do not start them without
asking.

The Outbox is no longer on this list -- `RedminefluxPlatform::OutboxEvent`
(storage) and `RedminefluxPlatform::OutboxDispatchJob` (dispatch, plain
ActiveJob so it needs no Sidekiq dependency) both exist. What is still
genuinely empty is its handler registry: no plugin has called
`OutboxEvent.register_handler` yet, so every event durably records and then
sits `pending` until one does.
