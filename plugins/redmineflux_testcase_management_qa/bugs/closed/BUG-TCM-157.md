# BUG-TCM-157

- Bug ID: BUG-TCM-157
- Production Redmine Issue ID: #129192 (assigned: Vaishnavi Bhawsar)
- Severity: Low — the onboarding "product tour" walkthrough silently never fires; no core Testcase Management functionality depends on these two files, and no error is shown to the user beyond a browser console 404
- Title: `testcase-tour.css`/`testcase-tour.js` always 404 on every Redmine version (5.x/6.x/7.x) — `stylesheet_path`/`javascript_path` misuse in the Test Suites sidebar passes a full relative path to a helper that already prepends its own fixed prefix
- Redmine version: 5.1, 6.x, 7.0 (confirmed reproducing on all three)
- Plugin name: Redmineflux Testcase Management
- Plugin version: dev build (`Version: 0.0.0-dev`)
- Environment: Confirmed via direct HTTP checks against `redmine6-happyflow-sqlite` (`localhost:3021`, project `rftc-016-ci-qa`) and source-code review against the same bind-mounted checkout used by the Redmine 5.1 (`redmine5`, `localhost:3001`) and Redmine 7.0 (`redmine7compat`, `localhost:3012`) COMPAT legs
- Browser: N/A for root-cause (confirmed via direct HTTP `curl` requests + source read); originally surfaced via Chrome DevTools console 404s during the Redmine 5.1/7.0 COMPAT pass
- User role: N/A — reproduces for any user who loads the Test Suites page, regardless of role
- Date: 2026-11-20

## Steps to reproduce

1. Log in to any Redmine instance (5.x/6.x/7.x) with this plugin installed and the Testcase Management module
   enabled on a project.
2. Open that project's Test Suites page (`/test_suites/releases?project_id=<id>` or `/test_suites?project_id=<id>`).
3. Open the browser's DevTools console/network tab, or directly request the two asset URLs the sidebar partial
   generates.

## Expected result

- `testcase-tour.css` and `testcase-tour.js` (the onboarding product-tour assets) load successfully (HTTP 200),
  and the product tour feature is available.

## Actual result

- Both assets return **HTTP 404** on every Redmine version tested. Root cause confirmed by reading
  `app/views/test_suites/_sidebar.html.erb:170-171`, which builds the two asset URLs as:
  ```erb
  stylesheet_path('plugin_assets/redmineflux_testcase_management/testcase-tour.css')
  javascript_path('plugin_assets/redmineflux_testcase_management/testcase-tour.js')
  ```
  `stylesheet_path`/`javascript_path` are Rails helpers that **always prepend their own fixed prefix**
  (`/stylesheets/` and `/javascripts/` respectively) to whatever argument they're given. Passing a full
  relative path (which already starts with `plugin_assets/...`) produces a doubled, wrong URL:
  - Generated (wrong): `/stylesheets/plugin_assets/redmineflux_testcase_management/testcase-tour.css`
  - Confirmed via direct `curl` against the SQLite leg (`localhost:3021`): **HTTP 404**
  - Confirmed via direct `curl` against the correct-looking path
    `/plugin_assets/redmineflux_testcase_management/stylesheets/testcase-tour.css`: **also HTTP 404**, because
    plugin asset mirroring itself has its own problem on this plugin specifically — `public/plugin_assets/`
    on the SQLite leg contains a mirrored directory for another plugin (`redmineflux_scarlet`) but no entry at
    all for `redmineflux_testcase_management`, even though the plugin's own source files genuinely exist at
    `plugins/redmineflux_testcase_management/assets/stylesheets/testcase-tour.css` and
    `assets/javascripts/testcase-tour.js`.
  - This plain Ruby helper-misuse bug is **not Redmine-version-specific** — it's been silently 404ing on every
    DB-engine leg of this cross-DB happy-flow pass to date (SQLite/PostgreSQL/MySQL/MariaDB), just never
    individually flagged before, since no prior pass watched browser console output on every page load.

## Evidence

### Screenshot

_(Pending — the shared Playwright MCP browser session was in active concurrent use by another parallel QA task
at the time this bug was filed; a screenshot will be added in a follow-up session once the browser is free,
per CLAUDE.md §6. Root cause and reproduction are independently confirmed via direct HTTP `curl` checks and
source-code citation above, not dependent on the screenshot.)_

### Console / log

```
GET http://localhost:3021/stylesheets/plugin_assets/redmineflux_testcase_management/testcase-tour.css → 404
GET http://localhost:3021/javascripts/plugin_assets/redmineflux_testcase_management/testcase-tour.js → 404
GET http://localhost:3021/plugin_assets/redmineflux_testcase_management/stylesheets/testcase-tour.css → 404
```

`public/plugin_assets/` directory listing on the SQLite leg (`docker exec redmine6-happyflow-sqlite-redmine-1`):
```
drwxr-xr-x redmineflux_scarlet
-rw-r--r-- empty
```
(no `redmineflux_testcase_management` entry, despite the plugin's own `assets/` source files existing on disk)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — checked `bugs/_duplicates.md` and `bugs/_index.md`, no prior
  entry for this asset path/404 issue.

## Notes

- See also **BUG-TCM-158** — a related but separate, higher-priority finding on Redmine 7.0 specifically,
  where even a *correctly-constructed* asset URL would still 404 due to a deeper asset-pipeline incompatibility
  (Propshaft vs. the legacy `public/plugin_assets/` convention).
- Found during the Redmine 5.1/7.0 COMPAT pass (2026-11-20), commit `52042cdd`.

## Retest (2026-11-23) — CONFIRMED FIXED, closing

Dev fix (production #129192 journal): the hand-built asset path was replaced with a lookup that asks Redmine's
own asset pipeline for the correct URL, resolving correctly regardless of which asset-pipeline convention the
running Redmine version uses.

Retested across all 3 Redmine versions this bug originally reproduced on, after pulling the fix (`git merge
--ff-only origin/master` to `f10faff`+ in each of the `v5`/`v6`/`v7` plugin checkouts) and restarting each
container. Verified via real browser network requests (`browser_network_requests`), not just a guessed URL:

- **Redmine 5.1** (`localhost:3001`, project `compat-redmine5`): `/plugin_assets/redmineflux_testcase_management
  /stylesheets/testcase-tour.css` and `.../javascripts/testcase-tour.js` — both **200 OK**.
- **Redmine 6.x/SQLite leg** (`localhost:3021`, project `rftc-016-ci-qa`): `/assets/plugin_assets/
  redmineflux_testcase_management/testcase-tour-<hash>.css`/`.js` — both load successfully (304 Not Modified,
  i.e. genuinely cached after a real 200).
- **Redmine 7.0** (`localhost:3012`, project `compat-redmine7`): same fingerprinted-asset path — both **200 OK**.

Zero console errors on any of the three. Fix confirmed working on every Redmine version this bug reproduced on.

Production issue #129192 updated to Done/100%. Moving to `bugs/closed/`.
