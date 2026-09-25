# Test Cases — Redmineflux Knowledge Base — Content Templates

> Source: vendor KB — "How to Use Content Templates", "Managing Templates (Admin Only)", "Admin-Only Areas".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Navigation methodology

Administration → Plugins → Redmineflux Knowledgebase Plugin → **Configure** → **Templates** tab for management;
Knowledge Base sidebar → **New Page** → the template dropdown for consumption.

> **Note on trust boundary:** template content is **raw HTML authored by an administrator** and injected into pages
> that are then published — and potentially served to unauthenticated visitors through public URLs. That makes the
> sanitisation cases below (TC-RKB-198, 514) the most important in this suite.

---

## Functional Cases — Using templates

---

### TC-RKB-186: All six pre-built templates ship and are usable

**User Role:** Admin then Member
**Priority:** Medium
**Steps:**
1. Open the Templates tab and confirm the six documented templates are present:
   **Meeting Notes**, **Architecture Review**, **Product Requirements Document (PRD)**, **Annual Plan**,
   **API Documentation**, **Budget Proposal**.
2. Create one page from each and inspect the pre-filled content.

**Expected Result:**
- All six exist and each pre-fills structured, sensible content — not an empty body or raw unrendered HTML.
- Record a result per template; a single broken one would be hidden by a blanket pass.

---

### TC-RKB-187: Create a page from a template

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** High
**Steps:**
1. Sidebar → **New Page** → enter a title → select a template → Save.

**Expected Result:**
- The editor opens pre-filled with the template content, in **draft** status, ready to edit.

---

### TC-RKB-188: Template content is editable and independent

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a page from a template, heavily edit the content, and publish.
2. Have an Admin then edit that template.
3. Re-open the published page.

**Expected Result:**
- The page keeps its own content. **Editing a template must not retroactively change pages already created from
  it** — a template is a starting point, not a live link.
- Retroactive mutation of published documentation would be a High-severity defect.

---

### TC-RKB-189: Creating a page without a template

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create a page leaving the template dropdown unselected.

**Expected Result:**
- An empty page is created with no error. The template is optional, per the KB.

---

### TC-RKB-190: Template formatting survives into the page

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Use a template containing headings, tables and lists; publish the resulting page.

**Expected Result:**
- All structure renders correctly on the published page, not as escaped markup or flattened text.

---

## Functional Cases — Managing templates (admin)

---

### TC-RKB-191: Create a template

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Templates tab → **New Template** → enter a name and HTML content → Save.

**Expected Result:**
- The template appears in the list and is immediately offered in the New Page dropdown.

---

### TC-RKB-192: Edit a template

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Templates list → **Edit** → change name and content → Save.

**Expected Result:**
- Changes persist and the next page created from it uses the new content.

---

### TC-RKB-193: Copy a template

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Open a template's detail → **Copy**.

**Expected Result:**
- A new template opens with **"Copy of "** prefixed to the name, per the KB.
- Saving it creates an independent template; editing the copy does not affect the original.

---

### TC-RKB-194: Delete a template

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Templates list → **Delete** → confirm.

**Expected Result:**
- The template is removed from the list and from the New Page dropdown.
- **Pages already created from it are unaffected** — verify one explicitly.

---

### TC-RKB-195: Cancel a template deletion

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Trigger Delete and cancel the confirmation.

**Expected Result:**
- The template still exists after a reload.

---

### TC-RKB-196: Deleting a pre-built template

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Delete one of the six shipped templates.

**Expected Result:**
- Either it is protected with an explanation, or it is deleted like any other.
- If deletable, record whether it can be recovered — a shipped template that an admin can permanently destroy with
  no way back is worth noting in the plugin memory file, even if it is intended behaviour.

---

## Negative Cases

---

### TC-RKB-197: Template with a blank name or blank content

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Save a template with an empty name; then with a name but no content.

**Expected Result:**
- The blank name is rejected — a nameless entry in the dropdown is unselectable.
- Empty content is either rejected or produces an empty page cleanly, without erroring on use.

---

### TC-RKB-198: Script content in template HTML

**User Role:** Admin, then Member, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Create a template whose HTML contains a script tag, an `onerror` image payload and a `javascript:` link.
2. Create a page from it, publish it, and view it as a **different** user.
3. Enable a public URL and view it **unauthenticated**.

**Expected Result:**
- The payload is sanitised and inert at every stage: in the template preview, in the editor, on the published page
  for other users, and in the public view.
- **No script executes anywhere.** This is the plugin's highest-impact injection path: admin-authored HTML flowing
  automatically into pages that are published and can be shared publicly. Execution is Critical.
- Note the nuance: the KB expects admins to "write the HTML content", so some HTML must be permitted. The question
  is whether **executable** content is stripped, not whether markup is.

---

### TC-RKB-199: Malformed HTML in a template

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Save a template with unclosed tags and invalid nesting; create a page from it.

**Expected Result:**
- The editor and the published page render without breaking the surrounding page layout.
- Unclosed tags must not escape the content area and corrupt the sidebar or toolbar — a template is applied to
  many pages, so a layout-breaking one has wide blast radius.

---

### TC-RKB-200: Very large template

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Create a template of roughly 100 KB and create a page from it.

**Expected Result:**
- Both the save and the page creation complete without timeout, and the page publishes normally.

---

### TC-RKB-201: Duplicate template names

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Create two templates with the same name.

**Expected Result:**
- Either rejected, or both distinguishable in the list and the dropdown.
- Two identical entries in the New Page dropdown leave the author guessing which structure they will get.

---

### TC-RKB-202: Templates are admin-only — non-admins cannot manage them

**User Role:** Manager, Developer, QA, Reporter (each in turn), including users holding
**Priority:** High
`manage_knowledgebase_pages` and `manage_knowledgebase_spaces`
**Steps:**
1. Confirm no template-management entry point exists anywhere in the project UI.
2. Request the plugin configuration URL directly for each role.
3. Send template create, edit, copy and delete requests **directly**.

**Expected Result:**
- All refused with 403.
- The KB states plainly that template management requires **Redmine administrator access** — it is deliberately
  outside the three role permissions. A `manage_knowledgebase_pages` holder able to edit templates through the
  endpoint would be a High-severity defect, and it is the most plausible mistake here because that permission
  already covers page content.

---

### TC-RKB-203: Template list is not readable by non-admins

**User Role:** Non-admin member
**Priority:** Medium
**Steps:**
1. Request the templates listing endpoint directly.

**Expected Result:**
- Refused, or limited to the names needed to populate the New Page dropdown.
- Template **content** must not be readable by a role that cannot manage it, since it may embed internal process
  detail.

---

### TC-RKB-204: Template deleted while a New Page form is open

**User Role:** Admin + Member
**Priority:** Medium
**Steps:**
1. Member opens New Page with a template selected. Admin deletes that template. Member submits.

**Expected Result:**
- The page is created — either empty or with the content already loaded into the form — with a clear message if
  the template is gone. Not a 500, and never a blocked page creation.

---

### TC-RKB-205: Template availability is instance-wide

**User Role:** Admin then members of two projects
**Priority:** Medium
**Steps:**
1. Create a template and check the New Page dropdown in two different projects.

**Expected Result:**
- Templates are managed centrally in Administration, so they are expected to be available across projects.
- Confirm and record the actual scope — if templates turn out to be project-scoped, the Administration-only
  management location becomes a usability problem worth reporting.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
