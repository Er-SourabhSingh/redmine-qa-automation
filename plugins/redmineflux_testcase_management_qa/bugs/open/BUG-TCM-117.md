# BUG-TCM-117

- Bug ID: BUG-TCM-117
- Production Redmine Issue ID: 125095
- Title: Plugin cannot install on Redmine 5.1 at all — the Gemfile's dev/test-only `mutant` gem requires Ruby >= 3.3, which breaks `bundle install` dependency resolution for every group, not just dev/test
- Severity: High
- Redmine version: 5.1 (official `redmine:5.1-bookworm` Docker image, Ruby 3.2.11)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker, fresh `redmine:5.1-bookworm`-based image + the plugin directory bind-mounted unmodified (same image/compose pattern as the working `localhost:3000` Redmine 6.0.11 instance, only the `REDMINE_TAG` build arg changed)
- Browser: N/A (install/boot-time failure, never reaches a UI)
- User role: N/A
- Date: 2026-10-24

## Steps to reproduce

1. Build a standard Redmine 5.1 Docker image (`redmine:5.1-bookworm`, Ruby 3.2.11) with no modifications.
2. Bind-mount the plugin's directory unchanged into `plugins/redmineflux_testcase_management`, exactly as documented
   (README's own compatibility table lists Redmine 5.1 / Rails 6.1 as supported).
3. Start the container and let the official entrypoint run its normal `bundle check || bundle install`.

## Expected result

- Per the plugin's own README/CLAUDE.md compatibility table ("5.x | 6.1 | 7.0.0"), the plugin installs and
  migrates cleanly on Redmine 5.1 with no manual edits, same as it does on 6.x.

## Actual result

- `bundle install` fails outright with a dependency-resolution error, and the Redmine container never finishes
  booting (crash-loops indefinitely on the bundle step):

```
Resolving dependencies...
Could not find compatible versions

Because mutant >= 0.16.0 depends on Ruby >= 3.3
  and Gemfile depends on mutant ~> 0.17,
  Ruby >= 3.3 is required.
So, because current Ruby version is = 3.2.11,
  version solving has failed.
```

- This is **not** limited to a dev/test environment — it happens on the exact same official entrypoint flow every
  production container uses. Confirmed this is not bypassable without editing the plugin's `Gemfile`:
  - `bundle config set without 'development test'` (persisted in `/usr/local/bundle/config`, confirmed present and
    correct both globally and per-app) has **no effect** — Bundler still resolves the full dependency graph
    across every group before group-exclusion is applied at install time, and the mutant constraint alone makes
    that graph unsolvable on Ruby 3.2.
  - The `bundle install --without development test` CLI flag — same result, same failure.
  - `bundle config set --local without ...` followed by `bundle lock` then `bundle install` — same result.
  - Only actually editing the Gemfile (removing/relaxing the `mutant ~> 0.17` line, or scoping it with a
    `ruby_version` / `platforms` guard) allows installation to proceed — which the product's own documentation
    says should never be necessary ("no manual per-version edits").

## Root cause (confirmed via code read + direct `bundle`/`docker run` reproduction)

The plugin's `Gemfile`:

```ruby
group :development, :test do
  gem 'brakeman', '~> 8.1', require: false
  gem 'bundler-audit', '~> 0.9', require: false
  # (0.17 is what `gem install mutant` actually resolved to in this environment on
  # 2026-10-15; pinned to match what was tested.)
  gem 'mutant', '~> 0.17', require: false
end
```

`mutant` is scoped to `:development, :test`, which *should* mean it's never installed in a `RAILS_ENV=production`
container — but Bundler's dependency resolver computes one consistent version graph for **every** declared gem
across **all** groups before any group filtering happens (group exclusion is an install-time/require-time
concern, not a resolve-time one, in this Bundler version). Since `mutant ~> 0.17` transitively requires
`Ruby >= 3.3` and the official Redmine 5.1 image ships Ruby 3.2.11, the resolver reports the whole Gemfile
unsolvable — for every gem, not just `mutant` — and `bundle install` never produces a usable `Gemfile.lock`, so
the container can never finish booting.

The official Redmine Docker entrypoint runs a plain `bundle check || bundle install` with no `--without`
handling of its own (confirmed from `/docker-entrypoint.sh`), so this failure mode triggers on every fresh
container boot against this plugin on any Ruby < 3.3 host — Redmine 5.1's officially supported Ruby, per
Redmine's own compatibility matrix, is 3.1–3.3, so this isn't an edge case: a correctly-configured Redmine 5.1
host on Ruby 3.1 or 3.2 can never run this plugin at all via the documented install path.

**Suggested fix:** pin `mutant` to a version compatible with the Gemfile's actual minimum supported Ruby (per
`gemspec`/`required_ruby_version`, or just drop the floor further, e.g. `gem 'mutant', '~> 0.16'` which only
needs Ruby >= 3.0), or move dev/test-only tooling into a separate `Gemfile.devtools` invoked explicitly in CI
instead of the main `Gemfile`'s `:development`/`:test` group, so it can never affect a production resolve.

## Evidence

### Direct reproduction (fresh image, no cache, no edits)

```
$ docker run --rm -v <plugin>:/usr/src/redmine/plugins/redmineflux_testcase_management redmine:5.1-bookworm ...
Resolving dependencies...
Could not find compatible versions
Because mutant >= 0.16.0 depends on Ruby >= 3.3
  and Gemfile depends on mutant ~> 0.17,
  Ruby >= 3.3 is required.
So, because current Ruby version is = 3.2.11, version solving has failed.
```

### Confirmed `--without` is already correctly configured and still doesn't help

```
$ bundle config list
without
  Set for your local app (/usr/local/bundle/config): [:development, :test]
```
(this is the image's own default — unmodified) — yet `bundle install`/`bundle lock` both still fail identically.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers a Redmine 5.x install failure.
  This is a COMPAT-area finding (TC-COMPAT-01-02), distinct from every other bug in this index, which all assume
  the plugin is already running.
