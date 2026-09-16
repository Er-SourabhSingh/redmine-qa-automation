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

### Retest screenshot — PASS (2026-09-15, pass 2)

![Retest 2026-09-15 PASS — count line renders with a real bold number](../../screenshots/BUG-TCM-004/retest-2026-09-15-pass.png)

Earlier the same day on the previous branch — raw tags still shown:

![Retest 2026-09-15 FAIL — raw `<strong>` tags in the count line](../../screenshots/BUG-TCM-004/retest-2026-09-15-fail.png)

### Console / log

- No console or server error; purely a view-layer escaping issue.

## Retest 2026-09-15 — PASS (second pass, after branch switch)

Retested twice on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0), project `test-project`, run **#4 `reyer`**, as
`admin` via Playwright MCP headed. Two test cases selected, **Bulk Update Result** opened, count line read out of
the live DOM rather than judged by eye.

| Pass | Branch state | `innerHTML` | `<strong>` element | Result |
|---|---|---|---|---|
| 1 | Branch as checked out at 11:20 | `Apply to &lt;strong&gt;2&lt;/strong&gt; testcase(s).` | `false` | **FAIL** |
| 2 | **After branch switch + container restart** | `Apply to <strong>2</strong> testcase(s).` | **`true`**, text `"2"` | **PASS** |

Pass 2 in full:

```js
{
  textContent: "Apply to 2 testcase(s).",     // no raw tags visible to the user
  innerHTML:   "Apply to <strong>2</strong> testcase(s).",
  hasStrongEl: true,
  strongText:  "2"
}
```

This satisfies the Expected result exactly — the line reads *"Apply to 2 testcase(s)."* **with the number rendered
in bold**, rather than showing the markup as text.

### The applied fix

The second of the two suggested options was taken — mark it safe at the call site, leaving the locale string as-is:

- `app/views/issue_status_results/_new_result_form.html.erb:16` — now
  `<%= l(:text_apply_to_testcases, count: @bulk_issue_ids.size).html_safe %>`
- `config/locales/en.yml:931` — still `"Apply to <strong>%{count}</strong> testcase(s)."` (unchanged, line moved
  from 927 as the file grew)

This is safe here because `count` is an integer produced by `@bulk_issue_ids.size`, never user input — the caveat
noted in the original analysis. Worth keeping in mind if that argument ever becomes a string from elsewhere.

### Verdict

**PASS. Ready to close pending regression.** Severity **Low**, so `SENIOR_QA_STANDARDS.md` §26 requires only the
directly affected TCs — a much lighter gate than BUG-TCM-003's. It shares a modal with that bug, so closing them
together after the Test Runs suite regression is the tidier path. Production **#120546** unchanged so far.

> Checked in the same session as BUG-TCM-003's retest — both defects live on this one modal, so one pass covers
> both. The functional blocker (BUG-TCM-003) now also passes.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md`. Distinct from BUG-TCM-003 (auth/routing) — different root
  cause, same modal.
