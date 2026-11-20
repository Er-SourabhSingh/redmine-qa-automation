# BUG-TCM-158

- Bug ID: BUG-TCM-158
- Production Redmine Issue ID: (blank — not yet reported to production)
- Severity: High — not limited to the one onboarding-tour file; this is a general Redmine-7 compatibility gap
  that will silently break ANY plugin asset (CSS/JS/images) that relies on the legacy `public/plugin_assets/`
  mirroring convention, once a project actually tries to use such an asset on Redmine 7
- Title: Redmine 7's migration from Sprockets to Propshaft means plugin assets are no longer physically mirrored
  into `public/plugin_assets/<plugin>/` at all — any plugin code referencing that legacy path silently 404s
- Redmine version: 7.0 (Redmine 7.0.2.stable, Ruby 4.0.9, Rails 8.1.4)
- Plugin name: Redmineflux Testcase Management
- Plugin version: dev build (`Version: 0.0.0-dev`)
- Environment: Docker `redmine7compat` (`localhost:3012`), project `compat-redmine7`, built fresh for the
  Redmine 7.0 COMPAT leg of this cross-DB/cross-version pass
- Browser: N/A — confirmed via direct `curl` HTTP checks and `docker exec` filesystem inspection, not dependent
  on a specific browser
- User role: N/A — a server-/asset-pipeline-level issue, not role-gated
- Date: 2026-11-20

## Steps to reproduce

1. Install this plugin on a fresh Redmine 7.0 instance (confirmed via `redmine:7.0-bookworm`, Ruby 4.0.9).
2. Let the instance fully boot (`bundle install`, migrations, default data load) with zero errors.
3. Request any of the plugin's asset files via the legacy `public/plugin_assets/<plugin>/...` URL convention,
   e.g. `/plugin_assets/redmineflux_testcase_management/stylesheets/testcase-tour.css`.
4. Inspect the running container's `public/plugin_assets/` directory directly.

## Expected result

- On Redmine 5.x/6.x, plugin asset files placed under a plugin's own `assets/` directory are made reachable at
  `/plugin_assets/<plugin>/...` (whether via physical mirroring or Sprockets engine-mounted serving). The same
  plugin code should keep working unmodified across supported Redmine major versions, per this plugin's own
  documented 5.x/6.x/7.x compatibility target (`TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md` §6 COMPAT area).

## Actual result

- On Redmine 7.0, the asset is **not reachable by any URL** — confirmed HTTP 404 both for the legacy
  `/plugin_assets/redmineflux_testcase_management/stylesheets/testcase-tour.css` path and for the already-wrong
  path BUG-TCM-157 describes.
- Root cause: Redmine 7 replaced its Sprockets-based asset pipeline with **Propshaft** (confirmed via
  `lib/redmine/plugin_loader.rb`/`plugin.rb`'s new `Redmine::AssetPath`/`PluginLoader.public_directory`
  machinery in the Redmine 7 codebase). Propshaft does not use Sprockets' old `public/plugin_assets/<plugin>/`
  mirroring/mounting convention. Confirmed via direct filesystem check inside the running Redmine 7 container:
  `public/plugin_assets/` remained **empty even after a full container restart** — no plugin's assets get
  mirrored there anymore on Redmine 7, not just this plugin's.
- **Scope beyond this one file**: any plugin code anywhere (views, helpers, JS) that still constructs URLs
  against the legacy `public/plugin_assets/...` convention — not limited to the `testcase-tour` files BUG-TCM-157
  covers — will silently fail to load its own static assets on Redmine 7, until the plugin adopts
  Propshaft-aware asset helpers/registration for Redmine 7 specifically.

## Evidence

### Screenshot

_(Pending — the shared Playwright MCP browser session was in active concurrent use by another parallel QA task
at the time this bug was filed; a screenshot will be added in a follow-up session once the browser is free,
per CLAUDE.md §6. Root cause and reproduction are independently confirmed via direct HTTP `curl` checks and
container filesystem inspection above, not dependent on the screenshot.)_

### Console / log

```
GET http://localhost:3012/plugin_assets/redmineflux_testcase_management/stylesheets/testcase-tour.css → 404
```

`public/plugin_assets/` directory listing on the Redmine 7.0 leg (`docker exec redmine7compat-redmine-1`):
```
(empty — confirmed even after a full container restart)
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — checked `bugs/_duplicates.md` and `bugs/_index.md`, no prior
  entry for a Redmine-7 asset-pipeline compatibility issue.

## Notes

- See also **BUG-TCM-157** — the related, lower-severity `stylesheet_path`/`javascript_path` helper-misuse bug
  that reproduces on every Redmine version (5.x/6.x/7.x). Even if BUG-TCM-157's helper-call bug is fixed, THIS
  bug would still block the same two files (and any future plugin asset) from loading on Redmine 7 specifically,
  since the deeper asset-pipeline mismatch is independent of how the URL is constructed.
- Found during the Redmine 5.1/7.0 COMPAT pass (2026-11-20), commit `52042cdd`. This is flagged as a
  forward-looking compatibility risk for whenever the plugin's official Redmine-7 support is actually targeted —
  not an active production incident today, since production Redmine instances are not yet on Redmine 7.
