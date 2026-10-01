# BUG-TCM-023

- Bug ID: BUG-TCM-023
- Production Redmine Issue ID: <!-- not yet reported -->
- Title: The inline pencil-icon Subject editor on a test case's detail page has no way to save a change — Enter and blur both silently discard it
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

A Test case issue's title shows an inline pencil-icon editor (an `.rf-edit-icon` span next to the Subject heading,
present when the issue's Status is "New" — it is absent for other statuses like "In Progress," e.g. confirmed
missing on issues #1522/#1523/#1524; this status-gating may be an intentional workflow restriction and is not
itself asserted as a bug here). Clicking the icon reveals a plain `<input class="rf-input" name="issue[subject]">`
with **no save button, no enclosing form, and no working commit mechanism**: pressing Enter reloads the page
without persisting the change, and clicking away (blur) silently discards it.

This is not the only way to edit Subject — the full `/issues/:id/edit` form **does** include a working Subject
field (confirmed: editing Subject there and clicking Submit genuinely persists, verified via page reload) — but
the inline pencil icon's own editor is a dead end regardless, and a user who reaches for the obviously-presented
"click the pencil on the title" affordance will see a change silently vanish with no error, no indication it
failed, and no way to tell the input even got a confirm control.

## Steps to reproduce

1. Open a Test case issue whose Status is "New" (the pencil icon only appears for this status).
2. Click the pencil icon next to the title.
3. Type a new value into the textbox that appears.
4. Press Enter, or click elsewhere to blur the field.
5. Reload the issue and check the Subject.

## Expected result

- The inline pencil-icon editor should either have a visible, working save mechanism, or not present an editable
  textbox at all if it cannot actually save.

## Actual result

- Typed a new value (`QA-TC-136-EDITED-SUBJECT`, then separately `QA-TC-136-BLUR-TEST`) into the inline editor on
  issue #456; neither Enter nor blur-by-clicking-elsewhere persisted the change — reloading the issue shows the
  original, unchanged Subject both times. The inline editor's DOM has no visible save/confirm control of any kind
  (`<div class="rf-show-editor rf-show-editor--open"><input class="rf-input" name="issue[subject]"></div>` — no
  sibling button, no enclosing `<form>`).
- By contrast, the full `/issues/:id/edit` form's own Subject field works correctly: filling it and clicking the
  page's real Submit button does persist the change (confirmed via reload) — so this is specific to the inline
  pencil affordance, not Subject editing in general.

## Evidence

### Screenshot

![Inline Subject editor open on issue #456 — a bare textbox with no visible save control](../../screenshots/BUG-TCM-023/subject-inline-edit-no-save-control.png)

### Console / log

```
Inline editor DOM (after clicking the pencil icon):
<div class="rf-show-editor rf-show-editor--open" style="width: 100%;">
  <input type="text" class="rf-input" name="issue[subject]" style="width: 100%; box-sizing: border-box;">
</div>
-- no form, no button, no onkeydown/onblur handler producing a save.

Reproduction 1: filled "QA-TC-136-EDITED-SUBJECT", pressed Enter -> page reloaded, title still shows the
original subject "Kiểm tra tìm kiếm công việc theo từ khóa".
Reproduction 2: filled "QA-TC-136-BLUR-TEST", clicked elsewhere on the page -> reloaded, subject still original.

Status-gating: .rf-edit-icon present when Status=New (issue #456, #450); absent when Status=In Progress
(issues #1522, #1523, #1524).
```

## Test case coverage

Found while investigating TC-TCM-136 (Edit an existing test case) in
`testcases/TESTCASE_MANAGEMENT_TEST_CASES.md`. TC-136 itself still **PASSes** overall — Subject, Priority and a
step's Expected Result were all successfully edited and persisted via the full `/edit` form — but this inline
affordance found along the way is a real, separate, low-severity defect in its own right (a visible, inviting
control that silently does nothing).

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Subject editability. Distinct from
  BUG-TCM-017 (Test Suite's own missing Description field — a different object entirely).
