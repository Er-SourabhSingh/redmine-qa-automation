# BUG-TCM-017

- Bug ID: BUG-TCM-017
- Production Redmine Issue ID: #121839
- Title: Test Suite Create and Edit modals have no Description field at all, despite the User Guide documenting one; a leftover JS hook assuming it exists throws a console error on every modal open
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

`docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 2 ("Add a Test Suite") step 4 explicitly says: *"Enter **Test
Suite Name** and **Description**."* Live-checked both the **Add Test Suite** modal and the **Edit Folder** modal
for an existing suite — neither has a Description field, a rich-text editor, or any field beyond **Name**
(`testsuite[name]`). The Add modal's full field set is just `testsuite[name]` + Create/Cancel; the Edit modal's
is `testsuite[name]` + `testsuite[parent_id]` (hidden) + Update/Cancel. No `description` field exists in either
form's DOM, confirmed via a full input/textarea enumeration of both modals.

Separately, but likely related: opening either modal throws a real JS console error every time —
`TypeError: Cannot read properties of null (reading 'addEventListener')`, from inline script that unconditionally
runs `document.querySelector('.ql-editor').addEventListener('keydown', ...)` whenever a `show-testsuite-modal`
element becomes visible. Since neither Test Suite modal actually contains a `.ql-editor` (rich-text field)
anywhere on this page, the query always returns `null` and the call throws. This strongly suggests the
Description field (with a rich-text editor, matching the pattern used elsewhere in this plugin, e.g. the Add
Result Notes field) **existed at some point and was removed from the Test Suite modals**, while this leftover
accessibility/tab-trap script was never updated to match.

## Steps to reproduce

1. Test Cases → Test Suite sidebar → **Add Test Suite** icon. Observe the modal's fields; open DevTools console.
2. Fill Name only (no Description field exists) and Create.
3. On the new suite's row, click its action icon → **Edit Folder**. Observe the modal's fields again.

## Expected result

- Per `TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 2 step 4, both the Add and Edit forms offer a Description
  field alongside Name.
- No JavaScript errors in the console when opening either modal.

## Actual result

- Neither modal has a Description field. Full field enumeration:
  - Add Test Suite modal: `testsuite[name]` only (plus Create/Cancel buttons).
  - Edit Folder modal: `_method`, `authenticity_token`, `testsuite[name]`, `testsuite[parent_id]` (hidden), `id`,
    `commit=Update` — still no description field.
- Console shows `TypeError: Cannot read properties of null (reading 'addEventListener')` every time either modal
  opens, from a `document.querySelector('.ql-editor')` call that always resolves to `null` on this page.

## Root cause

A leftover inline script (served as part of the `test_suites` page) assumes every `show-testsuite-modal` instance
contains a Quill rich-text editor (`.ql-editor`) for a Description field, and wires up Tab-key handling for it
unconditionally in a `setTimeout`. The Description field itself appears to have been removed from both the Add
and Edit Test Suite forms without removing or guarding this script, and without updating the User Guide to match.

## Suggested fix

Either restore the Description field to both the Add Test Suite and Edit Folder forms (matching the documented
workflow), or — if Description was intentionally dropped from Test Suites — remove the leftover `.ql-editor`
tab-trap script and update `TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 2 step 4 to drop the Description mention.

## Evidence

### Screenshot

![Edit Folder modal showing only a Name field, no Description](../../screenshots/BUG-TCM-017/edit-suite-modal-no-description-field.png)

### Console / log

```
TypeError: Cannot read properties of null (reading 'addEventListener')
    at http://localhost:3010/test_suites?project_id=test-project:1429:43

Add Test Suite modal inputs: [{name: "testsuite[name]"}]  (Create button: #create-btn)
Edit Folder modal inputs: [_method=patch, authenticity_token, testsuite[name]=QA-AUTOSUITE-192,
  testsuite[parent_id]=0, id=9, commit=Update]

docs/TESTCASE_MANAGEMENT_USER_GUIDE.md:48  "4. Enter Test Suite Name and Description."
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_SUITES.md`:
- TC-TCM-192 (Create a test suite) — **PASS on name/persistence, FAIL on Description** — this is the blocking gap.
- TC-TCM-197 (Edit a suite name and description) — will also FAIL on the Description half when executed.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Test Suite fields. Distinct from
  BUG-TCM-015 (missing file-attachment control on the Add Result form — a different screen entirely).

## Production report

Reported to production `ztflux` as **#121839** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Low (priority_id 1); Defect custom
fields: Type=Functional, Severity=Low-severity, Priority=Low.
