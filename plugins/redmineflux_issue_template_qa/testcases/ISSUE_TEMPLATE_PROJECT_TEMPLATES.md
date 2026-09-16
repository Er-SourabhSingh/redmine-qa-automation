# Test Cases — Redmineflux Issue Template — Project-Specific Templates

> Source: vendor KB — "Configuration → For Particular Project Issue Template", "How to Create the Particular
> Project Issue Template" (including the membership-restricted Project list and the combined project view),
> FAQ Q8 (project filter auto-scroll).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Issue Template Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_issue_template_qa

## Navigation methodology

Header **Project** tab → choose a project → its **Issue Template** tab → **Add Issue Template**.
Do not jump to a deep URL.

---

## Functional Cases

---

### TC-RIT-301: Project Issue Template tab loads

**User Role:** Project member with template rights
**Steps:**
1. Open a project and click its **Issue Template** tab.

**Expected Result:**
- The page lists templates with an **Add Issue Template** button.
- An empty project shows a clean empty state.

---

### TC-RIT-302: Create a project-specific template

**User Role:** Project member with template rights
**Steps:**
1. Click **Add Issue Template**.
2. Fill Tracker, Issue Template Name, Issue Subject, Issue description, and tick the current project.
3. Submit.

**Expected Result:**
- The template is created and appears in this project's list.
- It does **not** appear in Administration → Issue Template (confirmed from the other side by TC-RIT-206).

---

### TC-RIT-303: Project page shows both project and global templates

**User Role:** Project member
**Preconditions:** One global template bound to this project, plus one project-specific template.
**Steps:**
1. Open the project's Issue Template tab.

**Expected Result:**
- Both appear, exactly as the KB states.
- The two are **visually distinguishable** — a user needs to know which templates they may edit and which are
  instance-wide. If global and project templates are indistinguishable in the list, record it as a usability
  finding; a user could otherwise delete an organisation-wide template believing it to be local.

---

### TC-RIT-304: Project list shows only the user's own projects

**User Role:** Non-admin member of projects A and B, not of C
**Steps:**
1. Open the Add Issue Template form from project A and inspect the Project list.

**Expected Result:**
- Projects A and B are offered. Project C is **not**.
- This is the KB's explicit claim. Note that this case only covers the rendered form — the endpoint check is
  TC-RIT-905 and is the one that actually proves the restriction.

---

### TC-RIT-305: Project list auto-scroll on keypress

**User Role:** Member with many projects
**Steps:**
1. Focus the Project list and press a letter key.

**Expected Result:**
- The list scrolls to and renders projects whose names begin with that letter, as the KB's FAQ Q8 describes.

---

### TC-RIT-306: Auto-scroll does not fight with typing

**User Role:** Member
**Steps:**
1. If the Project list has an associated search/filter input, type a multi-character string into it.
2. Separately, press several keys in quick succession with the list itself focused.

**Expected Result:**
- Typing into a search input filters rather than jump-scrolling on every keystroke.
- Repeated keypresses on the list behave predictably — either each jumps to its own letter, or successive keys
  build a prefix. A control that scrolls away from what the user is typing is a usability defect worth filing.

---

### TC-RIT-307: Bind a project template to several of the user's projects

**User Role:** Member of A and B
**Steps:**
1. From project A, create a template and tick both A and B.

**Expected Result:**
- The template appears on both projects' Issue Template pages and is usable on New Issue in both.

---

### TC-RIT-308: A project template is not visible in unrelated projects

**User Role:** Member of A, B and C
**Steps:**
1. Create a template bound only to A.
2. Open the Issue Template tabs of B and C.

**Expected Result:**
- It is absent from both. Scoping is by the Project list, not by where the template was created.

---

### TC-RIT-309: Sub-project behaviour

**User Role:** Member
**Preconditions:** A parent project with a sub-project.
**Steps:**
1. Bind a template to the parent only, then open the sub-project's Issue Template tab and its New Issue form.

**Expected Result:**
- Record whether templates inherit down the project hierarchy. The KB says nothing about inheritance, so either
  behaviour is acceptable — but it must be consistent between the template **list** and the New Issue
  **pre-selection**. A template that appears in the sub-project's list but never applies there is a defect.

---

## Negative Cases

---

### TC-RIT-310: Project list omits archived and closed projects

**User Role:** Member
**Steps:**
1. Close one of the user's projects and archive another; reopen the creation form.

**Expected Result:**
- Record whether either is still offered. Binding a template to an archived project produces a template that can
  never be used, and offering it is a defect worth recording.

---

### TC-RIT-311: Create a template with the current project unticked

**User Role:** Member
**Steps:**
1. From project A's tab, create a template but tick only project B.

**Expected Result:**
- Behaviour is explicit: either it is created and appears only in B, or the current project is enforced.
- It must not silently vanish — created in A's context but visible nowhere is a data-loss-shaped defect.

---

### TC-RIT-312: Non-member cannot open a project's Issue Template tab

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project defaults to
public; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project's Issue Template URL directly.

**Expected Result:**
- 403 or not-found. No template names, subjects or descriptions leak in the response body.

---

### TC-RIT-313: A member without template rights

**User Role:** Reporter or a low-privilege member of the project
**Steps:**
1. Confirm whether the Issue Template tab is visible.
2. Request the tab's URL directly.
3. Send a template-create request directly.

**Expected Result:**
- Whatever role gates this feature, the UI and the endpoint must agree. Record the gating role.
- A role that cannot see the tab but can create a template through the endpoint is a High-severity defect.

---

### TC-RIT-314: Editing a global template from inside a project

**User Role:** Non-admin project member
**Steps:**
1. On the project's Issue Template page, attempt to edit and then delete one of the **global** templates.
2. If no control is offered, send the edit and delete requests directly.

**Expected Result:**
- A non-admin must not be able to modify or delete an instance-wide template from a project context.
- This is the most consequential permission case in this suite: a project member deleting a global template would
  affect every other project bound to it. Refusal must hold at the endpoint, not only in the UI.

---

### TC-RIT-315: Validation on project templates matches global templates

**User Role:** Member
**Steps:**
1. Repeat the blank-name, blank-tracker and blank-project submissions from the global suite (TC-RIT-210 – 213) on
   the project form.

**Expected Result:**
- Identical validation on both forms. A validation rule enforced in Administration but not in the project form is a
  defect, and the project form is the one non-admins reach.

---

### TC-RIT-316: Script content in a project template

**User Role:** Non-admin member
**Steps:**
1. Create a project template whose name, subject and description contain a script tag.
2. Apply it and view the resulting issue as a different user.

**Expected Result:**
- Escaped and inert everywhere. **No script executes.**
- This matters more than the equivalent global case (TC-RIT-216) because the author here is an ordinary member, not
  a trusted admin — execution would be a Critical stored-XSS path open to any project member.

---

### TC-RIT-317: Project deletion with templates attached

**User Role:** Admin
**Steps:**
1. Delete a project that has project-specific templates and is also ticked on a global template.

**Expected Result:**
- The project-specific templates are removed with it.
- The global template survives, minus that project binding, and still works in its remaining projects.
- No orphaned rows surface in any other project's list.

---

### TC-RIT-318: Removing a user's membership

**User Role:** Admin + affected member
**Steps:**
1. Remove the member from project B, then have them open a template creation form.

**Expected Result:**
- Project B is no longer offered in the Project list.
- Templates they previously bound to B are unaffected for the remaining members — losing membership must not
  delete other people's templates.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
