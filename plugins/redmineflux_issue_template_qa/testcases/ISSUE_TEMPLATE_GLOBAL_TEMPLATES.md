# Test Cases — Redmineflux Issue Template — Global Templates (Administration)

> Source: vendor KB — "Configuration → For Global Issue template", "How to Create the Global Issue Template".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Issue Template Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_issue_template_qa

## Navigation methodology

Top menu **Administration** → **Issue Template** → **Add Issue Template**. Do not jump to a deep URL.

---

## Functional Cases

---

### TC-RIT-025: Administration → Issue Template page loads

**User Role:** Admin
**Priority:** High
**Steps:**
1. Open Administration → Issue Template.

**Expected Result:**
- The page lists existing global templates with their identifying columns and an **Add Issue Template** button.
- An empty instance shows a clean empty state, not an error.

---

### TC-RIT-026: Create a global template with all fields

**User Role:** Admin
**Priority:** High
**Steps:**
1. Click **Add Issue Template**.
2. Fill Tracker, Issue Template Name, Issue Subject, Issue description, and tick one project in the Project list.
3. Click **Submit**.

**Expected Result:**
- The template is created and appears in the list with the values entered.
- A success message is shown, and the values persist when the template is reopened for edit.

---

### TC-RIT-027: Tracker dropdown lists all trackers

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Compare the Tracker dropdown with Administration → Trackers.

**Expected Result:**
- Every configured tracker is offered, none missing and none duplicated.

---

### TC-RIT-028: Project list offers all projects to an admin

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Open the Project list on the creation form and compare it with Administration → Projects.

**Expected Result:**
- An admin sees every project, including private ones — admins are members of nothing but see everything.
- Record whether archived and closed projects are listed; offering an archived project as a template target is a
  defect worth recording, since the template could never be used there.

---

### TC-RIT-029: Create a template bound to several projects

**User Role:** Admin
**Priority:** High
**Steps:**
1. Tick three projects in the Project list and submit.

**Expected Result:**
- The template is available in all three projects' Issue Template pages and in none of the others.

---

### TC-RIT-030: Administration list shows only global templates

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Have a project manager create a project-specific template (see the project suite).
2. Reopen Administration → Issue Template.

**Expected Result:**
- The project-specific template does **not** appear here. The KB states this page shows only administrator-created
  templates.
- If project templates do appear, record it — the two scopes then are not really separate, which changes the
  meaning of several cases in the project suite.

---

### TC-RIT-031: Clear button resets the form

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Fill every field on the creation form, then click **Clear**.

**Expected Result:**
- Every field returns to its empty/default state, including the Project list checkboxes and the description editor.
- Nothing is saved. A Clear that leaves the description editor populated is a partial-reset defect.

---

### TC-RIT-032: Cancel button discards without saving

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Fill the form and click **Cancel**.
2. Return to the template list.

**Expected Result:**
- No template was created. The user is returned to the list, not left on a dead form.

---

### TC-RIT-033: Template name is shown and identifiable in the list

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Create two templates on the same tracker with different names.

**Expected Result:**
- Both rows are distinguishable in the list by name and tracker. Two rows that render identically are a usability
  defect, because neither can be safely edited or deleted.

---

## Negative Cases

---

### TC-RIT-034: Submit with no template name

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Leave Issue Template Name blank and submit.

**Expected Result:**
- Rejected with a validation message naming the field. No nameless template is created.
- The rest of the entered values are preserved on the re-rendered form — losing a long description to a validation
  error is a real usability defect.

---

### TC-RIT-035: Submit with no tracker

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Leave the Tracker unselected and submit.

**Expected Result:**
- Rejected, or explicitly saved as applying to all trackers if that is a supported option — record which.
- A template with no tracker that is then never pre-selected anywhere is a silent-failure defect.

---

### TC-RIT-036: Submit with no project selected

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Leave the Project list empty and submit.

**Expected Result:**
- Rejected with a clear message, or saved as available everywhere — record which.
- A template bound to no project, which therefore appears nowhere, is unusable and should not be silently created.

---

### TC-RIT-037: Submit with empty Subject and Description

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Provide only a name and tracker; leave Subject and Description blank; submit.

**Expected Result:**
- Either rejected, or created and then, when applied, it pre-fills nothing without erroring.
- Applying an empty template must not blank out a field the user had already typed into.

---

### TC-RIT-038: Duplicate template names on the same tracker

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Create two templates with the same name and the same tracker.

**Expected Result:**
- Either rejected with a uniqueness message, or allowed with both distinguishable.
- If both are allowed and both are eligible defaults for the tracker, TC-RIT-011's pre-selection rule must still be
  deterministic.

---

### TC-RIT-039: Very long field values

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enter a 500-character template name and a 100 KB description; submit.

**Expected Result:**
- Rejected with a stated maximum, or accepted without breaking the list layout or the New Issue form.
- Silent truncation with no message is a defect.

---

### TC-RIT-040: HTML and script in template fields

**User Role:** Admin
**Priority:** High
**Steps:**
1. Put a script tag in the template name, the subject and the description; submit.
2. View the template list, then create an issue from the template and view it as another user.

**Expected Result:**
- Escaped and rendered literally in the list, on the New Issue form, and on the created issue.
- **No script executes at any of those three points.** Execution is a Critical security defect, and the
  template→issue path is the dangerous one because content authored by an admin is rendered to every user.

---

### TC-RIT-041: Special characters in the subject

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Use quotes, ampersands, emoji and newline characters in the Issue Subject; apply the template.

**Expected Result:**
- The subject is copied onto the new issue faithfully. Newlines are either stripped or rejected — a subject that
  breaks into multiple lines corrupts every list view that renders it.

---

### TC-RIT-042: Creating a template while another admin deletes the tracker

**User Role:** Two admins
**Priority:** Low
**Steps:**
1. Admin A has the creation form open with tracker T selected. Admin B deletes tracker T. Admin A submits.

**Expected Result:**
- A clear error rather than a 500 or a template bound to a non-existent tracker.

---

### TC-RIT-043: Creating a template referencing a project deleted mid-form

**User Role:** Two admins
**Priority:** Low
**Steps:**
1. Admin A ticks project P. Admin B deletes project P. Admin A submits.

**Expected Result:**
- Handled cleanly — the template is created without P, or the submit is refused with an explanatory message.
  Not a 500 and not a dangling project reference.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
