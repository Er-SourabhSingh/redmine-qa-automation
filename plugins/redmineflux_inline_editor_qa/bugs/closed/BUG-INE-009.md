# Bug Report

- Bug ID: BUG-INE-009
- Production Redmine Issue ID: #121123 (ztflux, https://flux.zehntech.com/issues/121123) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: Inline editor session authentication is broken in both directions — an expired session could still save via a leftover API key (original finding), and the fix for that now makes a *valid* session fail with a native browser Basic-Auth popup (regression, found on retest)
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0 (original finding on the pre-fix code; regression found on commit `43dff8b` "Stop putting the user's API key into every page (#121123)")
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP for the original finding; a real, non-headless Chromium for the regression, which is how the user directly observed it)
- User role: Developer (`willow.belle`)
- Date: 2026-09-23 (original finding), reopened 2026-09-24 (regression found on retest)

## Expected result — two paths, both must hold

- **Valid, active session →** the save must succeed normally, authenticated by the session, exactly as it always
  has. No popup, no error, `200`/`204`, value persisted. This is the ordinary case and must never break.
- **Expired/ended session (timeout, sign-out elsewhere, or the session cookie otherwise gone while an editor is
  still open) →** the save must be refused with a clear message, or redirect to login. The user must never see a
  "saved" confirmation for a change that didn't take effect, and the write must not go through by any fallback —
  in particular, **the API key must not be restored as a fallback authenticator**, since that is exactly the
  mechanism that let this bug's original finding happen.

## Steps to reproduce — original finding (expired session still saved)

1. Log in as `willow.belle` (Developer) and open issue #1560. Priority = High.
2. Click the Priority inline pencil, so the editor is open.
3. End the session. In this repro the `_redmine_session` cookie was deleted from the browser (Playwright
   `context.clearCookies({name: '_redmine_session'})`), leaving the browser with **no cookies at all**. This is
   the same state a browser is in after the session expires or the user signs out in another tab.
4. In the still-open editor, choose "Low".
5. Reload the page, which redirects to `/login`, then log back in and look at the issue.

### Actual result (original finding)

- `PUT /issues/1560/update_field.json` → **`200`**, `application/json`, and the toast reads "Saved successfully.".
- The request carries an **`X-Redmine-API-Key`** header. The plugin puts the user's personal API key into every
  page (`window.RfIE.config.apiKey`, present in the page's HTML source) and sends it with each save, so the server
  authenticates the request by API key even though no session exists.
- Reloading the page redirects to `/login?back_url=…`, confirming the session really is gone. After logging back
  in, Priority is **Low**, and History shows a new journal entry "Priority changed from High to Low" by Willow
  Belle. The write was fully applied.
- Reproduced **2 times** (journals #10 and #12). Priority was restored to High after each run.

## Steps to reproduce — regression (valid session now fails)

1. Pull the fix for this bug and BUG-INE-005/006/007/008/010 (plugin now at commit `43dff8b`), restart the
   container and run `rake assets:precompile` so the updated JS/controller code is live.
2. Log in normally as `willow.belle` (Developer) — confirmed via the page's own account menu, session fully valid.
3. Open the Issues list (`/projects/test-project/issues`).
4. Click the Subject inline pencil on any issue and type a new value.
5. Press Enter to save.

### Actual result (regression)

- The save hangs on "Saving…" indefinitely. The browser (a real, non-headless Chromium instance) shows its own
  **native OS-level HTTP Basic-Auth "Sign in" dialog** for `http://localhost:3010`, completely outside the page —
  it is not a Redmine login screen and not a JS dialog. It blocks all interaction with the browser window until
  dismissed. This was independently spotted and reported by the user on their own screen before any automated
  diagnosis found it, and the user correctly pushed back when an initial look treated it as a testing artifact
  rather than a real product regression.
- **Confirmed via the Rails server's own log**, not just symptom observation. The exact request:
  ```
  Started PUT "/issues/1560/update_field.json" for 172.19.0.1 at 2026-09-24 05:34:05 +0000
  Processing by IssueTablesController#update_issue_field as JSON
    Parameters: {"issue" => {"subject" => "..."}, "id" => "1560"}
    Current user: anonymous
  Filter chain halted as :check_if_login_required rendered or redirected
  Completed 401 Unauthorized in 8ms
  ```
  **The same browser tab, same session, 5 seconds earlier**, was correctly recognized:
  ```
  Current user: willow.belle (id=114)
  Completed 200 OK in 5ms
  ```
  So the session cookie is present in the browser (`_redmine_session`, confirmed still in the cookie jar) and was
  honored moments before — but this specific `update_field.json` PUT is evaluated as `anonymous`, and Redmine's
  own `check_if_login_required` filter then halts the request with a `401`. Since this instance has the REST API
  enabled, a `401` on a JSON-format request carries a `WWW-Authenticate: Basic` challenge, which is exactly what
  makes a real browser present its own native credential dialog instead of Redmine's own error handling.
- **Reproduced consistently on the issue list, and the user reports it recurring wherever the inline editor
  appears** (issue list, issue detail, project pages) — confirmed with direct server-log evidence on the issue
  list; the same mechanism (a JSON-format inline-editor request evaluated as anonymous despite a valid session)
  is expected to affect every surface this plugin edits, since they all go through the same session-based auth
  path this fix changed. Full per-surface confirmation is still an open follow-up.
- **Root cause is not yet isolated to a specific line of the fix.** What's confirmed: the request's own CSRF
  token (`RfIE.csrf.get()`) matches the page's `<meta name="csrf-token">` tag exactly, checked on both the issue
  list and issue detail pages; the session cookie is present in the browser; the identical browser session
  authenticated correctly moments earlier on another request. What's not yet confirmed: whether the `Cookie`
  header is actually present on the failing request as sent by the browser (a check was in progress, interrupted
  before completion), and whether `IssueTablesController`'s specific authentication configuration (e.g.
  `accept_api_auth`, CSRF handling for JSON format) behaves differently now that no request to it ever carries an
  API key. This needs the developer's own investigation with access to the controller's authentication filter
  chain.

## Evidence

### Screenshot

![Save succeeds after the session cookie was deleted (original finding)](../../screenshots/BUG-INE-009/save-succeeds-after-session-cookie-deleted.png)

![Journal after re-login shows the change was applied (original finding)](../../screenshots/BUG-INE-009/journal-after-relogin-shows-change-persisted.png)

![Native Basic-Auth popup on a valid session (regression)](../../screenshots/BUG-INE-009/regression-valid-session-basic-auth-popup.png)

![The same popup recurring (regression)](../../screenshots/BUG-INE-009/regression-valid-session-basic-auth-popup-recurring.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-INE-009/retest-yyyy-mm-dd-pass.png)

### Console / log

**Original finding:**
- Cookies for `localhost:3010` before the save: `[]` (none).
- Request headers include `x-redmine-api-key` and `x-csrf-token`. Body: `{"issue":{"priority_id":"1","lock_version":"10"}}`.
- Response: `200`, body echoes `"priority":{"id":1,"name":"Low"}`.
- Reload → `http://localhost:3010/login?back_url=http%3A%2F%2Flocalhost%3A3010%2Fissues%2F1560`.
- After re-login: journal #12 "Priority changed from High to Low", author Willow Belle.
- `document.documentElement.outerHTML.includes(RfIE.config.apiKey)` → `true`.

**Regression:**
- Rails server log (`docker logs redmine-docker-700-redmine-1`), the exact failing request:
  `[be1a211e-e386-444e-ab4f-02405dd2f2c4] Started PUT "/issues/1560/update_field.json" ... Current user: anonymous
  ... Filter chain halted as :check_if_login_required rendered or redirected ... Completed 401 Unauthorized in 8ms`.
- The immediately preceding request on the same session: `[e7109d8f-...] Current user: willow.belle (id=114) ...
  Completed 200 OK in 5ms`, 5 seconds earlier.
- Multiple further `Completed 401 Unauthorized` lines logged for other inline-editor requests in the same short
  window, all with the same pattern.
- `_redmine_session` cookie confirmed present in the browser's cookie jar throughout, with a non-empty value.

## Notes

- **This is one bug with two failure modes of the same mechanism (session-vs-API-key authentication), not two
  separate bugs.** The original finding and the regression are opposite failures of the same fix: before, an
  expired session could still save (API key covering for a dead session); after, a valid session can no longer
  reliably save (nothing is covering for whatever gap the API key was masking). A correct fix needs both
  Expected Result paths above to hold at the same time.
- **Why the original finding matters:** ending a session (timeout, or signing out in another tab) should not
  leave an already-open page able to make changes as that user. Separately, the long-lived API key sitting in
  every page's HTML is itself readable by any script running on the page. The edit in the original repro was made
  by the legitimate user in their own browser, so it is not privilege escalation by a different party.
- **Severity raised to High** given the regression: this is not data corruption (the save is refused, not
  silently mis-applied), but it appears to block the plugin's core save functionality for ordinary,
  correctly-authenticated use on at least the issue list — a native browser credential dialog appearing during
  normal use is confusing and disruptive enough on its own to warrant urgent attention regardless of exact scope.
- This supersedes the earlier INCONCLUSIVE note on TC-INE-084, which could only simulate an expiry by mocking
  the response. The real behavior for the original finding is not a false success: the save genuinely succeeds
  when it should not.
- Regression found live while retesting this bug (and BUG-INE-005/006/007/008/010) after the fix was pulled, per
  explicit user request to retest — not from a written test case. Should be codified as a regression test case
  covering both paths once the fix is confirmed correct.

## Retest

**Result: FIXED, confirmed 2026-09-24** — after pulling commit `f2fe7ef` ("Authenticate the editor by session
instead of the user's API key") and precompiling assets. This fix takes a different approach from the reverted
`43dff8b`: rather than just removing the API key, it moves every request the editor makes off Redmine's
`.json`-format routes entirely (which Redmine's own `find_current_user` never authenticates by session, only by
API key/Basic — this is the exact mechanism the regression exposed) onto new plugin routes with no format
extension, authenticated by the browser session like any ordinary page. Both required paths now confirmed:

- **Valid session →** `PUT /issues/1560/update_field` (no longer `.json`) → `200`, value persisted, no popup.
  Confirmed server-side: `Current user: willow.belle (id=114)`, `Processing … as */*` (previously `as JSON`,
  which is exactly what let it be evaluated as anonymous).
- **Session ended (cookie deleted) →** the same save now returns a clean `422`, toast "Could not save. Please
  try again." — no popup. Confirmed server-side: `Can't verify CSRF token authenticity` →
  `ActionController::InvalidAuthenticityToken`, since these requests are no longer JSON-format and are therefore
  now actually covered by Rails' CSRF protection (which JSON requests skip). Value not persisted.
- **Sign out in a second tab, then complete the edit in the first (the literal original repro, using two real
  tabs sharing the same cookie jar rather than deleting a cookie programmatically) →** same result: `422`,
  "Could not save. Please try again.", no popup, value not persisted.

No regressions found in the other 5 bugs from this batch while retesting (BUG-INE-005/006/007/008/010, see their
own Retest sections) — all still confirmed fixed with this build.

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121123**, 2026-09-23.
- Linked as a defect to Test Case **#121042**, Run **#577**, Test Suite **#146**, Environment "Window 11 + Chrome"
  — verified via `get_run_testcases`.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Security | Assignee: Vaishnavi Bhawsar.
- **Production issue currently shows Status "In QA" (90% done) — this no longer reflects reality now that the
  regression has been found on retest.** The production issue needs its own update once approved: reopen (e.g.
  status → Reopen), % done reset, and the description updated to include both Expected Result paths above and
  the regression evidence, so the developer knows the original fix direction was right but the deployed change
  broke the valid-session case. Not yet done — needs its own explicit approval as a production write.

## Duplicate check

- Duplicate found: No — regression consolidated into this bug rather than filed separately, per explicit user
  instruction (2026-09-24): "reopen BUG-INE-009 instead of creating a separate BUG-INE-011."
- Existing bug reference (if duplicate): —
