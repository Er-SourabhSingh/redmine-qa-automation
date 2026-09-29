# Bug Report Template

- Bug ID: BUG-PLT-004
- Production Redmine Issue ID: #121480
- Title: App cannot boot at all in `RAILS_ENV=production` — `pagination_renderer.rb`'s init.rb guard is bypassed by Zeitwerk eager loading, crashing with `NameError: uninitialized constant RedminefluxPlatform::WillPaginate`
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, commit `8d739ea` ("Add a tester's guide", 2026-09-28)
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, Redmine's official Docker image — defaults to `RAILS_ENV=production`, no override in this project's `docker-compose.yml`/entrypoint)
- Browser: N/A — the app never finishes booting, no page ever renders (every request to `localhost:3013` gets connection-refused / empty reply)
- User role: N/A — happens before any authentication, on every single container boot
- Date: 2026-09-29

## Steps to reproduce

1. Install the `redmineflux_platform` plugin (any of the 6 consumer plugins present or not — this reproduces with the platform plugin alone) on a Redmine instance where the `will_paginate` gem is not part of the bundle (confirmed via `bundle list | grep will_paginate` → no output; it is not a Redmine core dependency and none of the 3 other Redmineflux plugins that do depend on it — `flux_tags`, `redmineflux_testcase_management`, `flux_issue_template` — are installed in this environment).
2. Boot the container normally (`docker compose restart redmine`, or any fresh `docker compose up`) with `RAILS_ENV=production` (the default for Redmine's own Docker image, not something this project overrides).
3. Watch `docker logs <container>` — Puma never reaches "Listening on...".

## Expected result

- The plugin's own `init.rb` comment states the intent explicitly: "Guarded so a change in how Redmine bundles it degrades to 'no shared renderer' instead of taking down the plugin." The app should boot normally, log the documented warning (`[redmineflux_platform] will_paginate not available; PaginationRenderer not loaded`), and continue — with no shared pagination renderer available, but otherwise fully functional.

## Actual result

- The app never finishes booting. Every attempt to reach `http://localhost:3013/` returns connection-refused (curl exit 52 / empty reply); `docker ps` shows the container continuously up but Puma itself never logs a listening port. `docker logs` shows the crash repeating on every boot attempt:
  ```
  /usr/src/redmine/plugins/redmineflux_platform/lib/redmineflux_platform/pagination_renderer.rb:29:in '<module:RedminefluxPlatform>': uninitialized constant RedminefluxPlatform::WillPaginate (NameError)
  ```
  (Confirmed recurring identically across at least 6 separate boot attempts while investigating.)

### Root cause (confirmed from source)

`init.rb` (lines 22–29) does guard its own explicit `require` correctly:
```ruby
# Subclasses WillPaginate::ActionView::LinkRenderer, so it can only load once
# will_paginate is available. Guarded so a change in how Redmine bundles it
# degrades to "no shared renderer" instead of taking down the plugin.
if defined?(WillPaginate::ActionView::LinkRenderer)
  require File.expand_path('../lib/redmineflux_platform/pagination_renderer', __FILE__)
else
  Rails.logger.warn('[redmineflux_platform] will_paginate not available; PaginationRenderer not loaded')
end
```
This guard genuinely works when the rake task loads the environment — the migrate run's own log shows the expected warning firing (`WARN -- : [redmineflux_platform] will_paginate not available; PaginationRenderer not loaded`), confirming `require` was correctly skipped in that context.

**The gap:** this guard only stops `init.rb`'s own `require` call. It does nothing to stop Rails/Zeitwerk's independent **eager loading** of every file under a plugin's `lib/` autoload path, which `RAILS_ENV=production` triggers unconditionally at boot (`config.eager_load = true` is Rails' production default, and this project doesn't override it). Zeitwerk's `eager_load_all` walks the autoload paths and loads `pagination_renderer.rb` on its own, completely bypassing the `if defined?(...)` check in `init.rb` — and the file itself has no internal guard:
```ruby
module RedminefluxPlatform
  class PaginationRenderer < WillPaginate::ActionView::LinkRenderer
    ...
```
`class PaginationRenderer < WillPaginate::ActionView::LinkRenderer` is evaluated the instant Ruby loads this file, regardless of whether anything ever calls it — the class definition itself requires resolving `WillPaginate::ActionView::LinkRenderer` as its superclass. Since `will_paginate` isn't in the bundle, that constant doesn't exist, and Ruby raises immediately, taking the whole eager-load pass (and therefore the whole app boot) down with it.

The file's own header comment even documents that this class is "NOT YET A DROP-IN, and this is the reason it still has no callers" — i.e., the developer's own note confirms nothing in the codebase actually uses this class today, making the crash entirely gratuitous: the file doesn't need to exist yet, or at minimum needs its own load-time guard (e.g. wrapping the class body in the same `if defined?(WillPaginate::ActionView::LinkRenderer)` check, so an eager-load pass skips it exactly as `init.rb`'s explicit require already does).

## Evidence

### Screenshot

N/A — this is a server-boot crash with no UI ever rendered to capture. See the terminal log transcript and source excerpts above/below, which are the actual reproduction evidence.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-004/retest-yyyy-mm-dd-pass.png)

### Console / log

```
=> Booting Puma
=> Rails 7.2.3.1 application starting in production
=> Run `bin/rails server --help` for more startup options
...
/usr/src/redmine/plugins/redmineflux_platform/lib/redmineflux_platform/pagination_renderer.rb:29:in '<module:RedminefluxPlatform>': uninitialized constant RedminefluxPlatform::WillPaginate (NameError)
	from /usr/local/bundle/gems/zeitwerk-2.8.3/lib/zeitwerk/loader.rb:454:in 'Zeitwerk::Loader.eager_load_all'
	from /usr/local/bundle/gems/railties-7.2.3.1/lib/rails/application/finisher.rb:80:in 'block in <module:Finisher>'
	from /usr/local/bundle/gems/railties-7.2.3.1/lib/rails/initializable.rb:32:in 'BasicObject#instance_exec'
	from /usr/local/bundle/gems/railties-7.2.3.1/lib/rails/initializable.rb:32:in 'Rails::Initializable::Initializer#run'
	...
	from /usr/local/bundle/gems/railties-7.2.3.1/lib/rails/commands/server/server_command.rb:38:in 'Rails::Server#start'
	from bin/rails:4:in '<main>'
```
Repeated identically across 6+ separate container restarts observed during this session.

`bundle list | grep -i "will_paginate\|paginat"` → no output (gem genuinely not in the bundle).

Contrast: the earlier `rake redmine:plugins:migrate` run (a non-eager-load context) logged the intended graceful-degradation warning instead of crashing:
```
W, [...] WARN -- : [redmineflux_platform] will_paginate not available; PaginationRenderer not loaded
```
confirming the guard *is* reachable and correct for that code path — it's specifically the `RAILS_ENV=production` full-app-boot path that bypasses it.

## Retest — 2026-09-29 — NOT FIXED, reopened (production #121480 → Reopen)

Dev journal (Prashant Chaurasia, commit `133ebf5` on `redmineflux_platform`) said: `pagination_renderer.rb`'s class body is now wrapped in the same `if defined?(WillPaginate::ActionView::LinkRenderer)` guard `init.rb` already had. Asked to "confirm the container now reaches 'Listening on...' in your dedicated environment (`redmine-docker-6-platform`, `localhost:3013`)" — explicitly noting they couldn't validate this themselves since `will_paginate` is bundled in their dev container via other plugins.

**Followed exactly**: no branch change needed (already on `redmineflux_platform`) — `git pull` in `plugins/redmineflux_platform` to bring in `133ebf5`, confirmed via `git log` and by reading `pagination_renderer.rb` directly that the fix matches the journal's description. Restarted the container and checked whether it reaches "Listening on..." — the exact request.

**Result: it does not.** The app still fails to boot under `RAILS_ENV=production`, now with a different exception:
```
Zeitwerk::Loader::Callbacks#on_file_autoloaded: expected file
.../pagination_renderer.rb to define constant RedminefluxPlatform::PaginationRenderer,
but didn't (Zeitwerk::NameError)
```
Root cause: wrapping the class body in `if defined?(...)` is a correct instinct for `init.rb`'s own conditional `require`, but Zeitwerk's autoloading convention requires every file under an autoload path to define its matching constant *unconditionally*. Since the condition is false here (`will_paginate` genuinely absent, reconfirmed via `bundle list`), `pagination_renderer.rb` now loads without ever defining `RedminefluxPlatform::PaginationRenderer`, and Zeitwerk itself raises on that mismatch — a different exception at the same location, same underlying problem (app still can't boot without `will_paginate`).

**Same underlying defect as originally reported.** As already flagged before the fix, this exact scenario wasn't re-validated in the dev's own container — confirmed live here it's still broken.

**Reopened on production** (`#121480` → status `Reopen`) with this evidence and a note suggesting the file needs to be excluded from eager loading entirely (e.g. `Rails.autoloaders.main.ignore(...)` in `init.rb`) or always define the constant (a stub/no-op class), rather than conditionally skipping the definition inside an autoloaded file.

## Retest — 2026-09-29 — CONFIRMED FIXED, closed (production #121480 → Done, 100%)

Dev journal (Prashant Chaurasia, commit `4fb3f22` on top of `133ebf5`, `redmineflux_platform` branch) said: `init.rb` now calls `Rails.autoloaders.main.ignore` on `pagination_renderer.rb`'s exact path before its guarded `require`, removing the file from Zeitwerk's tracking entirely so it's reachable only through the explicit require — never through autoloading. The class body was reverted to a plain, unconditional definition since Zeitwerk no longer has any claim on it. Asked again to confirm the container reaches "Listening on..." in this dedicated environment.

**Followed exactly**: `git pull` (no branch change, no code edits) to bring in `4fb3f22`. Read `init.rb` and `pagination_renderer.rb` directly and confirmed the fix matches the journal's description exactly. Restarted the container.

**Result: genuinely fixed.**
```
Puma starting in single mode...
* Listening on http://0.0.0.0:3000
Use Ctrl-C to stop
```
`GET /` → `200 OK`. The expected warning logs cleanly, no crash:
```
W, [...] WARN -- : [redmineflux_platform] will_paginate not available; PaginationRenderer not loaded
```
No `NameError`, no `Zeitwerk::NameError`. This is the exact scenario (`will_paginate` genuinely absent from the bundle, `RAILS_ENV=production`) that the dev couldn't validate in their own container — confirmed working here.

**Closed on production** — status `In QA` → `Done`, done ratio 100%. Moving this file to `bugs/closed/`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
