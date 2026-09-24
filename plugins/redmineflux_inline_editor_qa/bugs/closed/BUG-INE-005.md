# Bug Report

- Bug ID: BUG-INE-005
- Production Redmine Issue ID: #121112 (ztflux, https://flux.zehntech.com/issues/121112) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: Inline editor's issue-list Subject field bypasses the 255-character length validation the standard Edit form enforces
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-23

## Steps to reproduce

1. On the Issues list view (`/projects/test-project/issues`), click the Subject cell's inline pencil on any issue.
2. Type a 5,000-character value into the inline text input and press Enter.
3. Reload the page and confirm the value persisted.
4. For contrast, open the same issue's **standard** Edit form (`/issues/:id/edit`), clear the client-side
   `maxlength="255"` restriction via the console, type an oversized value (e.g. 3,000 characters) into the same
   Subject field, and submit the standard form.

## Expected result

- Both paths should enforce the same server-side rule. Since the standard Edit form's model validation rejects an
  over-255-character Subject with "Subject is too long (maximum is 255 characters)", the inline path should be
  refused identically, at the endpoint, not merely at the browser's `maxlength` attribute.

## Actual result

- The inline editor's `PUT /issues/:id/update_field.json` endpoint accepted the 5,000-character value with a clean
  `200 OK` and it persisted (confirmed via reload) — no truncation, no error, no length limit at all.
- The standard Edit form's controller **does** enforce the limit: submitting the same oversized value through the
  standard form was correctly rejected with `Subject is too long (maximum is 255 characters)`.
- This is a genuine divergence between the two write paths: the inline endpoint skips a model-level validation
  that the standard path runs, allowing an issue to end up with a subject far beyond what the rest of the
  application (list views, exports, page titles, browser tabs) is designed to display. On the issue list, the
  oversized subject visibly breaks the table's column layout (see screenshot).

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-INE-005/oversized-subject-list-layout.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-INE-005/retest-yyyy-mm-dd-pass.png)

### Console / log

- Inline path: `PUT /issues/1553/update_field.json` → `200 OK`, body echoes
  `"subject":"XXXX...` (5,000 chars), issue #1553's subject persisted at 5,000 characters after reload.
- Standard path (same issue, oversized value submitted via the full Edit form after removing the client-side
  `maxlength` attribute): `#errorExplanation` text = `Subject is too long (maximum is 255 characters)` — save
  correctly refused.

## Retest

**Result: FIXED, confirmed 2026-09-24** — after pulling commit `1cfa06c` and precompiling assets. As
`willow.belle` on the issue list, `PUT /issues/1560/update_field.json` (subject) with a 5,000-character value now
returns `422` with `"Subject is too long (maximum is 255 characters)"`, no truncation attempted, value not
persisted. A blank subject on the same field returns `"Subject cannot be blank."`, editor closes, previous value
unchanged after reload. Both refusals match the standard Edit form's own validation exactly.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121112**, 2026-09-23.
- Linked as a defect to Test Case **#121042**, Run **#577**, Test Suite **#146**, Environment "Window 11 + Chrome"
  (note: the run's actual environment label omits the "s" — an initial attempt with "Windows 11 + Chrome" created
  the issue relation but never attached the Failed status to the visible run row; corrected same session) —
  testcase now correctly shows **Failed** with defects `[121112, 121113, 121114]` in the run.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional | Assignee: Vaishnavi Bhawsar.
