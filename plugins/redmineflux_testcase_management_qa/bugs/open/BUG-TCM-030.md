# BUG-TCM-030

- Bug ID: BUG-TCM-030
- Production Redmine Issue ID: #122072
- Title: Opening the "Add Test Suite" modal throws a JS TypeError (`Cannot read properties of null (reading 'addEventListener')`) every time
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: Tester (`qa.engineer`)
- Date: 2026-10-05

## Summary

Every time the "Add Test Suite" modal is opened (the `+` icon above the suite tree), the browser console logs an
uncaught JS exception. The modal itself still renders and functions correctly (Name field, Create/Cancel buttons
all work, and suite creation succeeds), so this does not block the feature — but it indicates a piece of the
page's JS is reliably failing to run.

## Steps to reproduce

1. On the Test Suites tab for any project, click the "Add Test Suite" icon/link to open the create-suite modal.
2. Check the browser console.

## Expected result

- The modal opens with no JS errors logged.

## Actual result

- The modal opens and is fully usable, but the console logs:
  ```
  TypeError: Cannot read properties of null (reading 'addEventListener')
      at http://localhost:3015/test_suites?project_id=qa-demo:1090:43
  ```
- Reproduced on every single open of the modal, across multiple projects/suites/sessions.

## Evidence

### Screenshot

![The "New Test Suite" modal rendering correctly (Name field, Create/Cancel) despite the console error firing on open](../../screenshots/BUG-TCM-030/modal-opens-with-js-error.png)

### Console / log

```
TypeError: Cannot read properties of null (reading 'addEventListener')
    at http://localhost:3015/test_suites?project_id=qa-demo:1090:43
```

## Test case coverage

Found incidentally while executing TC-SUITE-01-01 / TC-SUITE-01-02 / TC-SUITE-02-02
(`docs/qa/V1-TEST-CYCLE-7.1.0.md`) — does not affect those cases' pass/fail verdicts, since the modal itself works.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this console error. (Note:
  `BUG-TCM-017`, closed/open on a different environment, covers a *different* leftover-JS console error on the
  Test Suite Create/Edit modals re: a missing Description field — related area, not the same root cause or
  symptom, so not treated as a duplicate.)

## Production report

Reported to production 2026-10-05 as **#122072** (`ztflux`), tracker Bug, Priority Low, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity Low-severity, Defect
priority Low. Per explicit user instruction, not linked to any production Test Case/Run.
