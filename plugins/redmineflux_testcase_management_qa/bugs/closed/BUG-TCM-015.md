# BUG-TCM-015

> **CLOSED — 2026-10-06.** Production #121838 (https://flux.zehntech.com/issues/121838) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-015
- Production Redmine Issue ID: #121838
- Title: "Attach files" to an execution result — documented in the User Guide's own Add Result steps — has no corresponding control anywhere on the Add Result form, for any status
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

`docs/TESTCASE_MANAGEMENT_USER_GUIDE.md`'s own "Record a Result" workflow lists, as step 7 of 8: *"Optionally
attach files and add notes."* — immediately before the documented step 8, "Click Save." Live-checked the actual
Add Result panel (the same form reached from a run grid's "Untested"/status link) for every available **Status**
value (Passed, Failed, Retest, Blocked, Skipped) and found **no file-upload control of any kind** — no `<input
type="file">` anywhere in the panel's DOM, no "Choose File" button, no drag-and-drop zone, and the Notes rich-text
editor's own toolbar has no image/attachment button either (confirmed by reading every button in the toolbar).
The form consists of only: Status, (Report Defect + Defects, for Failed/Blocked), Environment, Notes, Cancel,
Submit.

This contradicts the User Guide's own documented workflow — either the feature was removed/never shipped while
the guide's wording was left unchanged, or it exists somewhere else in the UI this session didn't find (checked
the Add Result panel exhaustively, including scrolling and a full element-text dump of the panel's children).

## Steps to reproduce

1. In a run, click the "Untested" (or any status) link for any test case to open **Add Result**.
2. Look for a file-attachment control anywhere on the panel, for each of the five Status options (Passed, Failed,
   Retest, Blocked, Skipped).

## Expected result

- Per `TESTCASE_MANAGEMENT_USER_GUIDE.md` step 7, a way exists to optionally attach one or more files to the
  result being recorded, independent of which Status is chosen.

## Actual result

- No file-upload control exists on the Add Result panel for any Status value. `page.locator('input[type="file"]')`
  returns 0 matches while the panel is open; a full text/HTML dump of the panel's contents (Status, Report
  Defect/Defects for Failed/Blocked, Environment, Notes with its full toolbar button list, Cancel/Submit) shows
  no attachment-related element or button anywhere.

## Evidence

### Screenshot

![Add Result panel (Passed status) has no file-attachment control anywhere, despite the User Guide's documented step 7](../../screenshots/BUG-TCM-015/add-result-no-file-attachment-control.png)

### Console / log

```
page.locator('input[type="file"]').count()  => 0   (checked with Status = Passed and Status = Failed)
Add Result panel full text content: Status*, [Report Defect, Defects* — Failed/Blocked only], Environment*,
Notes (rich-text editor, toolbar: Normal/Heading dropdown, Bold, Italic, Underline, numbered list, bullet list,
blockquote, code block, link — no image/attachment button), Cancel, Submit.

docs/TESTCASE_MANAGEMENT_USER_GUIDE.md:99  "7. Optionally attach files and add notes."
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md`:
- TC-TCM-176 (Attach a file to an execution result) — **FAIL**, this is the blocking defect.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers result-level file attachments.
  Distinct from BUG-TCM-014 (Defects search) and from the plugin's separate "QA Attachment Field" custom field
  (that's a per-issue custom field on the test case itself, unrelated to attaching a file to one specific
  execution result).

## Production report

Reported to production `ztflux` as **#121838** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom
fields: Type=Functional, Severity=Medium-severity, Priority=Medium.

---

## Production history (synced from #121838 on 2026-10-08)

### 2026-10-06 07:47 UTC — Vaishnavi Bhawsar

Fixed. Add Result didn't have a way to attach a file at all — the backend was already fully ready for it (it already knew how to save an attached file to a result), the form just never had a file picker on it. Added one.

Fix is committed and pushed (commit 3cce667).

I verified it by opening Add Result, choosing a real file, submitting, and confirming the file is actually attached to the saved result afterward (checked directly in the database, not just the screen). Screenshot attached shows the new "Files" option on the form.

For QA:
1. Open Add Result for any test case.
2. Confirm a "Files" section with a "Choose File" option is now present.
3. Attach a file and submit.
4. Confirm the result saves normally and the attached file shows up with that result afterward (e.g. on the issue's own page, under its attachments/history).

### 2026-10-06 13:31 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. The Add Result form now has a "Files" field with a Choose File control, for both Passed and Failed/Blocked statuses.
