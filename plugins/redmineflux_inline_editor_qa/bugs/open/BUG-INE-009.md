# Bug Report

- Bug ID: BUG-INE-009
- Production Redmine Issue ID: #121123 (ztflux, https://flux.zehntech.com/issues/121123) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: An open inline editor keeps saving after the user's session has ended, because the plugin authenticates with the user's API key embedded in the page
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Developer (`willow.belle`)
- Date: 2026-09-23

## Steps to reproduce

1. Log in as `willow.belle` (Developer) and open issue #1560. Priority = High.
2. Click the Priority inline pencil, so the editor is open.
3. End the session. In this repro the `_redmine_session` cookie was deleted from the browser (Playwright
   `context.clearCookies({name: '_redmine_session'})`), leaving the browser with **no cookies at all**. This is
   the same state a browser is in after the session expires or the user signs out in another tab.
4. In the still-open editor, choose "Low".
5. Reload the page, which redirects to `/login`, then log back in and look at the issue.

## Expected result

- Per TC-INE-084: "A clear message or a redirect to login. **Not** a silent failure that looks like a successful
  save. After logging back in, the value is confirmed unchanged."
- Once the session is gone, the open page should no longer be able to write on the user's behalf.

## Actual result

- `PUT /issues/1560/update_field.json` → **`200`**, `application/json`, and the toast reads "Saved successfully.".
- The request carries an **`X-Redmine-API-Key`** header. The plugin puts the user's personal API key into every
  page (`window.RfIE.config.apiKey`, present in the page's HTML source) and sends it with each save, so the server
  authenticates the request by API key even though no session exists.
- Reloading the page redirects to `/login?back_url=…`, confirming the session really is gone. After logging back
  in, Priority is **Low**, and History shows a new journal entry "Priority changed from High to Low" by Willow
  Belle. The write was fully applied.
- Reproduced **2 times** (journals #10 and #12). Priority was restored to High after each run.

## Evidence

### Screenshot

![Save succeeds after the session cookie was deleted](../../screenshots/BUG-INE-009/save-succeeds-after-session-cookie-deleted.png)

![Journal after re-login shows the change was applied](../../screenshots/BUG-INE-009/journal-after-relogin-shows-change-persisted.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-INE-009/retest-yyyy-mm-dd-pass.png)

### Console / log

- Cookies for `localhost:3010` before the save: `[]` (none).
- Request headers include `x-redmine-api-key` and `x-csrf-token`. Body: `{"issue":{"priority_id":"1","lock_version":"10"}}`.
- Response: `200`, body echoes `"priority":{"id":1,"name":"Low"}`.
- Reload → `http://localhost:3010/login?back_url=http%3A%2F%2Flocalhost%3A3010%2Fissues%2F1560`.
- After re-login: journal #12 "Priority changed from High to Low", author Willow Belle.
- `document.documentElement.outerHTML.includes(RfIE.config.apiKey)` → `true`.

## Notes

- **Why it matters:** ending a session (timeout, or signing out in another tab) does not stop an already-open
  page from making changes as that user. A user who signs out on a shared computer and leaves a tab open still
  leaves a page that can edit issues. Separately, the long-lived API key is written into every page's HTML, where
  any script running on the page can read it. Unlike a session, that key keeps working until the user manually
  resets it.
- The edit was made by the legitimate user in their own browser, so this is not privilege escalation. Severity is
  set to Medium for that reason. Consider raising it to High if exposing the API key in the page is treated as a
  credential-exposure issue.
- This supersedes the earlier INCONCLUSIVE note on TC-INE-084, which could only simulate an expiry by mocking
  the response. The real behavior is not a false success: the save genuinely succeeds when it should not.

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121123**, 2026-09-23.
- Linked as a defect to Test Case **#121042**, Run **#577**, Test Suite **#146**, Environment "Window 11 + Chrome"
  — verified via `get_run_testcases`.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Security | Assignee: Vaishnavi Bhawsar.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
