# Plugin Memory — Redmineflux Testcase Management

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- CSV import: when a step is skipped (missing pair / malformed), the final saved test case renumbers surviving steps contiguously (1, 2, 3...), but the import **preview** still shows original CSV column numbers with a gap. Not a bug, just a preview/final mismatch worth knowing about when reviewing a preview before confirming. See `docs/TESTCASE_MANAGEMENT_CSV_IMPORT_REPORT.md`.
- ~~CSV import header matching is not whitespace-safe / duplicate headers discard silently~~ — **both fixed, verified 2026-09-11** (BUG-TCM-001, BUG-TCM-002 closed). Current behaviour: headers are trimmed consistently at both mapping and value-read time (the step-2 mapping screen shows a padded `" step 1 "` column under the normalised key `step 1`), and a duplicated header now raises an explicit banner on step 2 — "Duplicate column names found: <names> — only the first occurrence of each will be used, the rest will be ignored." — before the user can confirm.
- **`.json`-suffixed plugin routes break browser-session auth.** Several plugin routes are declared with a literal `.json` path and `defaults: { format: 'json' }` (`config/routes.rb:162, 163, 167, 168, 175`). Redmine core's `find_current_user` reads the session cookie *only* when `api_request?` is false, and `api_request?` is true for any request whose `params[:format]` is `json`/`xml`. So any browser XHR to one of those routes arrives as **anonymous** and is rejected by core's `check_if_login_required` — which runs before any `before_action` the plugin declares in its own controller, making the plugin's `restore_session_user_for_api` compensating filter dead code. This is the root cause of BUG-TCM-003; the other four routes above should be checked for the same defect.
- The bulk result modal offers a narrower status list (Passed / Retest / Skipped) than the single Add Result modal (Passed / Failed / Retest / Blocked / Skipped) — failure statuses require defect IDs, which bulk mode does not collect. Appears intentional, not a bug.

## Confirmed Working

- CSV import — **full suite re-verified 2026-09-11, 16/16 TCs PASS** (see the Regression Run table at the bottom of `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`): legacy single `Steps`/`Expected` columns, 0–50 step range, varying step counts per row (1/3/7/15/30 with no cross-contamination), non-sequential step numbering (preview shows 1/3/5, saved case renumbers 1/2/3), unicode/emoji/embedded-newline content round-tripping exactly, the 2000 vs 2001-char boundary, oversized-text rejection with a precise error, 100×3-step bulk import in ~0.5 s, header-only and empty-file handling, and whole-column-family-absent handling in both directions.
- CSV import fixtures live in `automation/testdata/csv-test-data/` (17 files, numbered, with a `README.md` mapping each to its purpose and expected outcome) — **not** in `automation/uploads/` as the older TC file's Evidence Map used to claim. Use these for any CSV import regression; they cover every TC in the suite.
- Single-test-case **Add Result** inside a run (`POST /issue_status_results`, format JS) — saves correctly as the logged-in user. Verified 2026-09-11 on `localhost:3010`, run #4.
- `bulk_create`'s own business logic — verified 2026-09-11 by calling `POST /testcase_status_results/bulk_create.json` with HTTP Basic (API) auth: returns `201 Created` and writes the result rows. Only the browser-session path into it is broken.

## Recurring Issues

- **Plugin routes declared with a literal `.json` path + `defaults: { format: 'json' }` cannot be called from the browser session.** This has now bitten once for real (BUG-TCM-003). Whenever a UI action posts to such a route, it will 401 as anonymous regardless of who is logged in. When testing any new bulk/AJAX action in this plugin, check `config/routes.rb` for a `.json` suffix first — it predicts the failure.

## Environment Notes

- CSV import testing was done against Docker `localhost:3010` (project `test-project`), plugin v7.0.0.
- `localhost:3010` = container `redmine-docker-700-redmine-1`, Redmine 7.0.0, plugin v7.0.0, Postgres. Note this is **not** the base URL in `QA_CREDENTIALS_LOCAL.md` (which points at `localhost:3006`) — this plugin's testing uses 3010.
- Instance settings relevant to auth-path bugs: `login_required = true`, `rest_api_enabled = true`. With this combination a 401 on an `accept_api_auth` action is returned as a bare `head :unauthorized` carrying `WWW-Authenticate: Basic realm="Redmine API"`, which a browser holds open for a native credential prompt — so a failing XHR appears to hang rather than showing an error. On an instance with `rest_api_enabled = false` the same failure returns 403, and with `login_required = false` it reaches the action and returns a 401 JSON body. Worth knowing when a customer's error text does not match what is seen locally.
- Fixture data in `test-project` run #4 `reyer` (suite `workload`, 15 TCs) was written to during 2026-09-11 testing: TC #434 set to Passed (single Add Result), TC #435 set to Passed (API-auth control probe, note "control probe - API auth").
- The 2026-09-11 CSV Import regression created test cases in `test-project` from the fixtures, including #1023 (padded-header retest) and #1024 (duplicate-header retest). Earlier imports from the same fixtures are still present (#1009, #1012, #1014, #1018) and are useful as before-the-fix comparisons — do not delete them.
