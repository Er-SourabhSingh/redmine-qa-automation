# BUG-TCM-012

- Bug ID: BUG-TCM-012
- Production Redmine Issue ID: #121702
- Title: Default "Test Case Result Added" notification email shows the run's name instead of the test case's own subject in its heading
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-09-30

## Summary

When no custom "Testcase Email Template" is active, `RunMailer#testcase_result_added` falls back to a built-in
view template. Its heading is meant to identify the test case the result was recorded against (`#<issue id>:
<subject>`, matching Redmine's own `#N: Subject` issue-link convention), but it actually interpolates the **run's
name** instead of the **issue's subject**. The email subject line itself is correct (uses the real test case
subject); only the in-body heading is wrong.

## Steps to reproduce

1. Ensure no custom Testcase Email Template is active (or use the default fallback path).
2. Enable the "Testcase result added" notification event (Administration → Settings → Notifications).
3. Add a result to a test case within a run, as a user other than the recipient (so a notification is sent).
4. Open the delivered email.

## Expected result

- The heading identifies the test case, e.g. `#434: Verify user can add item to wishlist`.

## Actual result

- Live-confirmed: test case #434 ("Verify user can add item to wishlist") in run "TC-TCM-008-011 Email
  notification test" — the delivered email's subject line correctly reads "Test Case Result Added: Verify user
  can add item to wishlist", but the body heading reads **"#434: TC-TCM-008-011 Email notification test"** — the
  run's name, not the test case's own subject.

## Root cause

`app/views/run_mailer/testcase_result_added.html.erb` (and the identical `.text.erb`):
```erb
<h1>
  <%= link_to("##{@issue.id}: #{@run.name}", @issue_url) %>
</h1>
```
`@run.name` is used where `@issue.subject` belongs.

## Suggested fix

```erb
<%= link_to("##{@issue.id}: #{@issue.subject}", @issue_url) %>
```

## Evidence

### Console / log

```
Email subject: "Test Case Result Added: Verify user can add item to wishlist"   (correct)
Email body heading: "#434: TC-TCM-008-011 Email notification test"              (wrong — run name, not issue subject)
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_CONFIGURATION.md`:
- TC-TCM-013 (Test Case Result Added notification) — content defect found; notification itself does arrive and
  otherwise renders correctly (status/environment/assignee all correct).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this template's content.

## Production report

Reported to production `ztflux` as **#121702** on 2026-09-30, assigned to Sheetal Sharma. Linked via `report_defect`
against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30") and run
#592, environment "Window 11 + Chrome". Priority: Low (priority_id 1); Defect custom fields: Type=Functional,
Severity=Low-severity, Priority=Low.
