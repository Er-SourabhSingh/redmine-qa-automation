# BUG-TCM-004

- Bug ID: BUG-TCM-004
- Production Redmine Issue ID: #120546 (https://flux.zehntech.com/issues/120546) — created 2026-09-11, assigned to Sheetal Sharma, Priority Low
- Title: Bulk Update Result modal shows raw HTML markup in its "Apply to N testcase(s)" line
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`, run #4 `reyer`)
- Browser: Chromium 152 (Playwright MCP)
- User role: Administrator (`admin`)
- Date: 2026-09-11

## Steps to reproduce

1. Log in to `http://localhost:3010` as `admin`.
2. Open project **test project** → **TestCases** → **Runs & Results** → run **#4 `reyer`**.
3. Tick two or more test cases in the grid.
4. Click **Bulk Update Result**.
5. Read the line directly under the modal heading.

## Expected result

- The count line reads **"Apply to 2 testcase(s)."** with the number rendered in bold.

## Actual result

- The line renders literally as **`Apply to <strong>2</strong> testcase(s).`** — the `<strong>` tags are shown to
  the user as text instead of being applied as formatting.

## Analysis — root cause

The locale string contains markup:

```yaml
# config/locales/en.yml:927
text_apply_to_testcases: "Apply to <strong>%{count}</strong> testcase(s)."
```

but the view renders it through plain `<%= %>`, which HTML-escapes it:

```erb
<%# app/views/issue_status_results/_new_result_form.html.erb:16 %>
<%= l(:text_apply_to_testcases, count: @bulk_issue_ids.size) %>
```

Fix: either mark it safe at the call site (`<%= l(...).html_safe %>` — only safe because `count` is an integer),
or drop the markup from the locale string and wrap the count in `<strong>` in the template.

Cosmetic only; it does not block the bulk update. The functional blocker on the same modal is tracked separately
as **BUG-TCM-003**.

## Evidence

### Screenshot

![Raw HTML tags shown in the Bulk Update Result modal](../../screenshots/BUG-TCM-004/bulk-modal-raw-html-in-label.png)

### Retest screenshot (fill after fix is verified)

<!-- ![Retest result](../../screenshots/BUG-TCM-004/retest-yyyy-mm-dd-pass.png) -->

### Console / log

- No console or server error; purely a view-layer escaping issue.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md`. Distinct from BUG-TCM-003 (auth/routing) — different root
  cause, same modal.
