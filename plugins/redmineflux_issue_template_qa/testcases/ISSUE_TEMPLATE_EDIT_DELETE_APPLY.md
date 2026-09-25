# Test Cases — Redmineflux Issue Template — Editing, Deleting & Applying Templates

> Source: vendor KB — "How to Edit the Issue Template", "How to Delete the Issue Template",
> "How to Use the Issue Template", FAQ Q4 (validation options), Q5 (updating templates), Q6 (assigning to
> projects), Q7 (default template pre-selection by tracker).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Issue Template Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_issue_template_qa

## Navigation methodology

Editing and deleting: **Issue Template** list (global or project) → pencil / trash icon on a row.
Applying: header **Issues** → **New Issue**. Do not jump to a deep URL.

---

## Functional Cases — Editing

---

### TC-RIT-001: Edit a template via the pencil icon

**User Role:** Admin (global) / permitted member (project)
**Priority:** High
**Steps:**
1. Click the pencil icon on a template row.
2. On the Edit/Update page, change the Name, Subject and Description.
3. Submit.

**Expected Result:**
- All changes persist and are shown in the list and on the next application of the template.

---

### TC-RIT-002: Edit form is pre-populated with current values

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Open a template for edit without changing anything, and compare every field with what was saved.

**Expected Result:**
- Every field, including the Project list checkboxes and the description body, reflects the stored values.
- An edit form that arrives with the Project list blank would silently unbind the template on the next save — a
  High-severity data-loss defect to watch for.

---

### TC-RIT-003: Submitting an unchanged edit is a no-op

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Open a template for edit and submit immediately without changes.

**Expected Result:**
- The template is unchanged, especially its project bindings and its tracker.

---

### TC-RIT-004: Rebind a template to different projects

**User Role:** Admin
**Priority:** High
**Steps:**
1. Edit a template bound to projects A and B: untick B, tick C. Submit.
2. Check the Issue Template page and New Issue form of A, B and C.

**Expected Result:**
- Available in A and C, absent in B — matching the KB's FAQ Q6 description of reassignment.

---

### TC-RIT-005: Editing a template does not change issues already created from it

**User Role:** Admin + Member
**Priority:** High
**Steps:**
1. Create an issue from a template.
2. Edit the template's subject and description substantially.
3. Reopen the previously created issue.

**Expected Result:**
- The existing issue is **unchanged**. Applying a template copies its content; it is not a live link.
- Retroactive mutation of created issues would be a High-severity defect, and this is the case that proves it
  either way.

---

## Functional Cases — Deleting

---

### TC-RIT-006: Delete a template with confirmation

**User Role:** Admin
**Priority:** High
**Steps:**
1. Click the trash icon on a template row.
2. Confirm in the dialog.

**Expected Result:**
- A confirmation dialog appears (the KB describes one), and on confirmation the template is removed from the list.
- It no longer appears on any project's Issue Template page or in the New Issue pre-selection.

---

### TC-RIT-007: Cancel a deletion

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The template still exists after a page reload and is still applicable.

---

### TC-RIT-008: Deleting a template does not affect issues created from it

**User Role:** Admin
**Priority:** High
**Steps:**
1. Create an issue from a template, then delete the template.
2. Reopen the issue.

**Expected Result:**
- The issue is intact with its subject and description. Any loss here is Critical.

---

### TC-RIT-009: Deleting the tracker's only template

**User Role:** Admin + Member
**Priority:** Medium
**Steps:**
1. Delete the only template bound to a tracker, then open New Issue and select that tracker.

**Expected Result:**
- The New Issue form works normally with no pre-selection and no error or empty dropdown placeholder that cannot
  be dismissed.

---

## Functional Cases — Applying a template

---

### TC-RIT-010: Default template is pre-selected by tracker

**User Role:** Member
**Priority:** High
**Steps:**
1. Open **New Issue** in a project bound to a template for tracker T.
2. Select tracker T.

**Expected Result:**
- The template for T is automatically pre-selected and its Subject and Description are pre-filled, exactly as
  KB FAQ Q7 describes.

---

### TC-RIT-011: Pre-selection with two templates on the same tracker

**User Role:** Member
**Priority:** Medium
**Preconditions:** Two templates exist for the same tracker and the same project.
**Steps:**
1. Open New Issue and select that tracker.

**Expected Result:**
- One is pre-selected deterministically and the other is selectable.
- Record the tie-break rule (most recent, alphabetical, lowest ID). **Non-deterministic pre-selection that differs
  between page loads is a defect**, because the user cannot know what they are about to create.

---

### TC-RIT-012: Pre-selection when a global and a project template both match

**User Role:** Member
**Priority:** Medium
**Steps:**
1. With a global template and a project template both bound to the same tracker and project, open New Issue.

**Expected Result:**
- One wins, consistently, and the precedence is observable. Record which. The KB never states this rule, so
  documenting the observed precedence is part of the deliverable of this case.

---

### TC-RIT-013: Changing the tracker on the New Issue form switches the template

**User Role:** Member
**Priority:** High
**Steps:**
1. On New Issue, select tracker T1 (template pre-fills), then switch to T2, which has a different template.

**Expected Result:**
- The pre-filled content updates to T2's template.
- **If the user had already typed their own text, it must not be silently destroyed** — either they are warned, or
  their text is preserved. Silent overwrite of user-typed content is a real data-loss defect and the most likely
  one in this whole plugin.

---

### TC-RIT-014: Template content is fully copied onto the created issue

**User Role:** Member
**Priority:** High
**Steps:**
1. Create an issue from a template without editing the pre-filled values.
2. Open the created issue.

**Expected Result:**
- Subject and description match the template exactly, including line breaks and formatting.

---

### TC-RIT-015: Pre-filled content can be edited before creating

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Modify the pre-filled subject and description, then create.

**Expected Result:**
- The issue is created with the user's edited values, not the template's originals. The template is a starting
  point, not a constraint.

---

### TC-RIT-016: Formatting survives from template to issue

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Use a template whose description contains headings, lists, bold text and a quote block.
2. Create the issue and view it.

**Expected Result:**
- All formatting renders correctly on the created issue, in whichever formatting mode the instance uses.
- Markup arriving as visible raw syntax on the issue is a defect.

---

### TC-RIT-017: Determine what template validation actually exists

**User Role:** Admin + Member
**Priority:** Medium
**Steps:**
1. Inspect the template creation form for any mandatory-field or validation-rule options.
2. If any exist, configure one and attempt to create an issue that violates it.

**Expected Result:**
- Record precisely what exists. The KB's FAQ Q4 hedges ("the plugin **may** offer template validation options"),
  so this case establishes the truth rather than asserting it.
- If no such feature exists, that is a **documentation defect on the vendor's page**, recorded in the features
  list and the handoff — not a plugin bug.
- If it does exist, the rule must be enforced on submit and not merely displayed.

---

## Negative Cases

---

### TC-RIT-018: New Issue in a project with no templates

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open New Issue in a project bound to no templates.

**Expected Result:**
- The form works exactly as stock Redmine, with no empty template selector and no error.

---

### TC-RIT-019: Template deleted while a New Issue form is open

**User Role:** Member + Admin
**Priority:** Medium
**Steps:**
1. Member opens New Issue with a template pre-filled. Admin deletes that template. Member submits.

**Expected Result:**
- The issue is created with the content already on the form. Deleting a template must never block the creation of
  an issue that is already half-written, and must not 500.

---

### TC-RIT-020: Template bound to a project the user cannot see

**User Role:** Member of A only
**Priority:** High
**Steps:**
1. Open New Issue in project A and inspect the available templates.

**Expected Result:**
- Only templates bound to A are offered. Names or descriptions of templates scoped to invisible projects must not
  leak into the selector.

---

### TC-RIT-021: Applying a template with a subject longer than the field allows

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Use a template whose subject exceeds Redmine's subject length limit and attempt to create.

**Expected Result:**
- A clear validation error on the New Issue form. The user must be able to shorten it and proceed.
- A template that can never produce a valid issue, with no explanation, is a defect — ideally the length would have
  been rejected at template creation (TC-RIT-039).

---

### TC-RIT-022: Required custom fields not covered by the template

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Apply a template on a tracker that has required custom fields the template does not fill.

**Expected Result:**
- Normal Redmine validation applies and names the missing fields. The template pre-fill must not suppress or bypass
  required-field validation.

---

### TC-RIT-023: Rapid tracker switching on the New Issue form

**User Role:** Member
**Priority:** Low
**Steps:**
1. Switch the tracker five times in quick succession between trackers with different templates, then create.

**Expected Result:**
- The final content matches the last selected tracker's template. No accumulation of concatenated descriptions from
  each switch — appending rather than replacing is a classic bug in this feature and would be clearly visible here.

---

### TC-RIT-024: Template applied via the REST API

**User Role:** Member with API key
**Priority:** Low
**Steps:**
1. Create an issue through `POST /issues.json` on a tracker with a default template.

**Expected Result:**
- Record the behaviour. If templates apply only in the UI, that is an acceptable documented limitation — but the
  API must not fail, and must not half-apply a template over explicitly supplied values.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
