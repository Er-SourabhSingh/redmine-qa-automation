# BUG-TCM-127

- Bug ID: BUG-TCM-127
- Production Redmine Issue ID: <!-- not yet reported — found this session, confirm scope before reporting -->
- Title: Anonymous (logged-out) access to any `rftc_require_login!`-gated TCM page returns a bare 403 Forbidden instead of redirecting to the login page
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: branch `release/7.3.0`, commit `329311d` — but this is a **pre-existing** gap in the shared `RftcAccessControl` concern, not something rftc-022 introduced; it affects every controller that uses `rftc_require_login!`/`rftc_require_permission!`/`rftc_authorize_project_read!` plugin-wide (confirmed on both Run Comparisons and the Automation Dashboard), not just Run Comparisons
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: Chromium (Playwright MCP)
- User role: Anonymous (logged out)
- Date: 2026-11-02

## Steps to reproduce

1. Without logging in (or after explicitly signing out via the real "Sign out" button, not just a direct GET to `/logout`), navigate directly to `/projects/rftc-016-ci-qa/run_comparisons`.
2. Observe the HTTP response.
3. Repeat against `/projects/rftc-016-ci-qa/automation_dashboard` (a different rftc-0NN feature using the same shared access-control concern) to confirm this is not isolated to one controller.

## Expected result

- Per the developer's own written functional test for this exact feature (`test/functional/run_comparisons_controller_test.rb`, `test "anonymous user is redirected to login"` → `assert_response :redirect`) and standard Redmine UX elsewhere in the product, an anonymous user hitting a login-required page should be **redirected to `/login` (302)**, landing on a usable login form, not stopped with a dead-end error page.

## Actual result

- The page returns a bare **403 Forbidden** (not a redirect) and renders Redmine's generic 403 error page with no link or affordance to sign in. Confirmed via raw HTTP status (`HTTP status: 403 Forbidden`), not just the rendered title.
- Root cause (confirmed by reading the code): `app/controllers/concerns/rftc_access_control.rb`'s `rftc_require_login!` is:
  ```ruby
  def rftc_require_login!
    return true unless rftc_anonymous?

    rftc_render_error(:forbidden, l(:error_unauthorized_action))
  end
  ```
  It renders a **403** directly for any anonymous user, rather than calling Redmine's own `require_login`/redirecting to `/login` with a `back_url`. Every other gate in this concern (`rftc_require_permission!`, `rftc_require_any_permission!`, `rftc_authorize_project_read!`) calls `rftc_require_login!` first, so this 403-not-redirect behavior is inherited plugin-wide, confirmed independently on both `RunComparisonsController` (rftc-022) and `AutomationDashboardController` (rftc-035).
- This directly contradicts the developer's own functional test's explicit assertion (`assert_response :redirect`) for this exact scenario — meaning that test, if it had actually been run (per this plugin's own "Minitest suite was written and syntax-checked but never run by the actual test runner" note, recorded earlier this QA cycle), would have failed. This is the same "developer's own Quality Gates is not independent QA" pattern already noted in plugin memory.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TCM-127/anon-403-forbidden.png)

### Console / log

- Playwright MCP `browser_navigate` result for the anonymous request: `Page Title: 403 - Redmine`, `HTTP status: 403 Forbidden`.
- Confirmed logged-out state first (not a stale session) by clicking the real "Sign out" button and verifying the top nav no longer shows "Logged in as," then navigating directly to the URL in the same tab.
- Same 403 (not a redirect) independently reproduced on `/projects/rftc-016-ci-qa/automation_dashboard`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
