# Test Cases — Redmineflux Inline Editor — Editing on the Issue Detail Page

> Source: vendor KB — "How to Update the task" (status, priority, assignee, start date, end date, percentage and
> custom fields), "How to Edit issue Description" (edit icon, CKEditor toolbar, formatting options),
> FAQ "Which fields can be edited inline?".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Navigation methodology

Top menu **Issues** → click a ticket number → the issue detail ("Show issue") page. Do not jump to a deep URL.
Every save is confirmed by a **full page reload**, never by the on-screen update alone.

---

## Functional Cases — Field editing

---

### TC-INE-301: Inline-edit Status on the detail page

**User Role:** Member with issue-edit rights
**Steps:**
1. Click the Status value, select a new status, confirm.
2. Reload.

**Expected Result:**
- Persists, with no full page reload needed for the change itself.

---

### TC-INE-302: Inline-edit Priority

**User Role:** Member
**Steps:**
1. Change Priority inline; reload.

**Expected Result:**
- Persists; the options match the instance's configured priorities.

---

### TC-INE-303: Inline-edit Assignee

**User Role:** Member
**Steps:**
1. Change Assignee inline; reload.

**Expected Result:**
- Persists. Only users assignable on this project are offered.
- The assignee-change notification fires as it would from the standard form.

---

### TC-INE-304: Inline-edit Start date and Due date

**User Role:** Member
**Steps:**
1. Change each date inline; reload.

**Expected Result:**
- Both persist, with correct locale formatting and a working picker.

---

### TC-INE-305: Inline-edit % Done

**User Role:** Member
**Steps:**
1. Change the percentage inline; reload.

**Expected Result:**
- Persists and the progress bar re-renders to match.
- Only valid increments are offered/accepted, matching the instance's configuration.

---

### TC-INE-306: Inline-edit custom fields of every type

**User Role:** Member
**Preconditions:** Custom fields of list, text, long-text, integer, float, date, boolean and user types exist on
the tracker.
**Steps:**
1. Inline-edit each in turn; reload after each.

**Expected Result:**
- Each offers the correct input control and persists.
- The KB names custom field support explicitly, so any type that cannot be edited inline is a gap against a stated
  feature — record it per type rather than as one blanket finding.

---

### TC-INE-307: Edited fields are journaled

**User Role:** Member
**Steps:**
1. Change three different fields inline, then open History.

**Expected Result:**
- Each change produces a normal journal entry with old and new values.
- Whether three separate journal entries or one combined entry is produced, the record must be complete and
  attributable. Missing entries are a High-severity auditability defect.

---

## Functional Cases — Description editing

---

### TC-INE-308: Enter description edit mode via the edit icon

**User Role:** Member
**Steps:**
1. On the issue detail page, locate the edit icon to the right of the Description field and click it.

**Expected Result:**
- The description switches to an editing mode in place, with a formatting toolbar at the top of the editor, exactly
  as the KB describes.

---

### TC-INE-309: Formatting toolbar options work

**User Role:** Member
**Steps:**
1. In the description editor, apply a heading, a bulleted list, bold/italic, and a quote block.
2. Save and reload.

**Expected Result:**
- Each formatting option renders correctly in the saved description, and the underlying stored markup is valid for
  the instance's text formatting setting.
- The KB names headings, bullet points, font styles and quotes specifically, so each of those four is a required
  check.

---

### TC-INE-310: Save a description edit

**User Role:** Member
**Steps:**
1. Change the description text and save; reload.

**Expected Result:**
- The new content persists and a description-change entry appears in History.

---

### TC-INE-311: Cancel a description edit

**User Role:** Member
**Steps:**
1. Enter edit mode, change the text, cancel.

**Expected Result:**
- The original description is restored and nothing is written. Confirm via reload and History.

---

### TC-INE-312: Description with attachments and inline images

**User Role:** Member
**Steps:**
1. Inline-edit a description that contains an inline image reference and attachment links.

**Expected Result:**
- Image and attachment references survive the round trip intact.
- An inline editor that strips or mangles attachment syntax on save is a High-severity data-loss defect.

---

### TC-INE-313: Description containing existing wiki/Textile macros

**User Role:** Member
**Steps:**
1. Inline-edit a description containing macros or cross-references (e.g. an issue link, a wiki link).

**Expected Result:**
- The macros survive the round trip and still render after saving. Silent conversion to plain text is data loss.

---

## Negative Cases

---

### TC-INE-314: Empty description

**User Role:** Member
**Steps:**
1. Clear the description entirely and save.

**Expected Result:**
- Accepted if descriptions are optional on this instance, rejected if required — matching the standard form's rule
  exactly. Divergence between the two paths is the defect.

---

### TC-INE-315: Very large description

**User Role:** Member
**Steps:**
1. Paste 100 KB of text into the inline description editor and save.

**Expected Result:**
- Either saved correctly or rejected with a clear message. No timeout, no truncation without notice.
- Record the save time.

---

### TC-INE-316: Script content in the description

**User Role:** Member
**Steps:**
1. Enter a script tag and an `onerror` image payload via the inline description editor; save; view as another user.

**Expected Result:**
- Sanitised and rendered inert. **No script executes for any viewer** — execution here is Critical, and a rich-text
  editor is the most likely place in this plugin to find it.

---

### TC-INE-317: Concurrent description edits

**User Role:** Two members
**Steps:**
1. Both open the same issue. A inline-edits the description and saves. B, who opened the editor before A saved,
   saves a different description.

**Expected Result:**
- B is warned of the conflict, or both versions are preserved in History.
- Silently overwriting A's text with no record is a High-severity data-loss defect.

---

### TC-INE-318: Inline edit while another user closes the issue

**User Role:** Two members
**Steps:**
1. A opens an inline field editor. B closes the issue. A confirms the edit.

**Expected Result:**
- Resolved deterministically with a clear message. No 500, no partial write.

---

### TC-INE-319: Read-only user on the detail page

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Confirm no inline edit affordance appears on any field or on the description.
2. Send a field update and a description update directly to their endpoints.

**Expected Result:**
- No affordance, **and** both direct requests refused with 403.

---

### TC-INE-320: Field-level permission on the detail page

**User Role:** Role where specific fields are read-only by workflow
**Steps:**
1. Confirm no inline affordance on those fields.
2. Submit updates for them directly.

**Expected Result:**
- Refused at the endpoint. Field-level workflow permissions must be enforced server-side, not only by hiding the
  control.

---

### TC-INE-321: Inline edit of a private note or private field

**User Role:** Member without private-note rights
**Steps:**
1. Attempt to inline-edit any private-visibility content on the issue.

**Expected Result:**
- Not offered and refused at the endpoint. Private content must not become editable through this path.

---

### TC-INE-322: Rapid successive saves on the same field

**User Role:** Member
**Steps:**
1. Change Status inline three times in quick succession; reload.

**Expected Result:**
- The final stored value matches the last change and History contains one entry per actual transition —
  no lost update and no duplicate journal spam.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
