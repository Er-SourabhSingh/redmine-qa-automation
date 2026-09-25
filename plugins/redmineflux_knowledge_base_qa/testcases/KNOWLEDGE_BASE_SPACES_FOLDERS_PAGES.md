# Test Cases — Redmineflux Knowledge Base — Spaces, Folders & Pages

> Source: vendor KB — "How to Use the Knowledge Base" (Spaces / Folders / Pages), FAQ Q1, Q2, Q9.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Navigation methodology

Project menu → **Knowledge Base** → the sidebar tree and its per-node dropdown menus. Do not type URLs.

---

## Functional Cases — Spaces

---

### TC-RKB-160: Create a space

**User Role:** Member with `manage_knowledgebase_spaces`
**Priority:** High
**Steps:**
1. Click **New Space** in the sidebar, enter a name and an optional description, Save.

**Expected Result:**
- The space appears in the sidebar as a top-level container and persists across a reload.

---

### TC-RKB-161: Create a space without a description

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create a space with a name only.

**Expected Result:**
- Created — the description is documented as optional.

---

### TC-RKB-162: Multiple spaces in one project

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create three spaces with distinct names.

**Expected Result:**
- All three coexist in the sidebar with a stable order.
- This is the documented way to sub-divide a project's single knowledge base (FAQ Q2).

---

### TC-RKB-163: Edit a space

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Space dropdown → **Edit** → change name and description → Save.

**Expected Result:**
- Changes persist; contained folders and pages are untouched.

---

### TC-RKB-164: Spaces are project-scoped

**User Role:** Member of two projects
**Priority:** High
**Steps:**
1. Create a space in project A, then open project B's Knowledge Base.

**Expected Result:**
- A's space does not appear in B (aside from documented parent inheritance, covered in its own suite).

---

### TC-RKB-165: Delete a space — cascade is warned about before it happens

**User Role:** Member with `manage_knowledgebase_spaces`
**Priority:** High
**Preconditions:** The space contains folders, pages, and pages with version history.
**Steps:**
1. Space dropdown → **Delete**. **Read the confirmation text before confirming.**
2. Confirm.

**Expected Result:**
- The confirmation states, before the action, that all folders, pages and version history will be permanently
  deleted and that it cannot be undone — the KB describes exactly this consequence.
- After confirming, the space and all its contents are gone.
- **A confirmation that does not warn about the cascade is a genuine usability defect worth filing**: this is the
  single most destructive action in the plugin, and there is no undo.

---

## Functional Cases — Folders

---

### TC-RKB-166: Create a folder inside a space

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** High
**Steps:**
1. Select a space → its dropdown → **New Folder** → name → Save.

**Expected Result:**
- The folder appears nested under the space.

---

### TC-RKB-167: Create a nested folder inside a folder

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Folder dropdown → **New Folder** → name → Save.

**Expected Result:**
- The folder nests under its parent folder, per the KB's hierarchy support.

---

### TC-RKB-168: Deep nesting

**User Role:** Member
**Priority:** Low
**Steps:**
1. Nest folders five levels deep and add a page at the deepest level.

**Expected Result:**
- The tree renders legibly with indentation and remains navigable.
- The page is reachable and openable. Record any depth at which the sidebar becomes unusable — the KB states there
  are no plugin-imposed limits (FAQ Q9), so a rendering breakdown is on the plugin.

---

### TC-RKB-169: Edit a folder

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Folder dropdown → **Edit** → rename → Save.

**Expected Result:**
- The name updates; contents are unaffected.

---

### TC-RKB-170: Delete a folder containing pages

**User Role:** Member
**Priority:** High
**Steps:**
1. Delete a folder that contains pages and sub-folders; confirm.

**Expected Result:**
- The cascade is stated in the confirmation, as with spaces, and then applied.
- If contents are instead orphaned or moved up a level, that must be explicit and consistent — silently losing
  pages is Critical.

---

## Functional Cases — Pages

---

### TC-RKB-171: Create a page inside a space

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** High
**Steps:**
1. Space dropdown → **New Page** → enter a title → Save.

**Expected Result:**
- The page opens in the editor in **draft** status with a Draft badge in the sidebar and on the page header.

---

### TC-RKB-172: Create a page inside a folder

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Folder dropdown → **New Page** → title → Save.

**Expected Result:**
- The page is created under that folder.

---

### TC-RKB-173: Create a page from a content template

**User Role:** Member
**Priority:** Medium
**Steps:**
1. On the New Page form, select a template from the dropdown; Save.

**Expected Result:**
- The editor is pre-filled with the template's content, ready to edit (covered further in the templates suite).

---

### TC-RKB-174: Edit a page

**User Role:** Member
**Priority:** High
**Steps:**
1. Open a page → **Edit** → change the content.

**Expected Result:**
- The editor opens with the current content and auto-saves as you type (covered in the editor suite).

---

### TC-RKB-175: Delete a page

**User Role:** Member
**Priority:** High
**Steps:**
1. Open a page → **Delete** → confirm.

**Expected Result:**
- The page and its version history are removed from the sidebar and stay removed after a reload.
- Cancelling the confirmation leaves the page intact.

---

## Negative Cases — structural rules

---

### TC-RKB-176: A folder cannot have a page as its parent

**User Role:** Member
**Priority:** High
**Steps:**
1. Confirm no **New Folder** action is offered on a page's dropdown.
2. Send a node-create request **directly** with a page node as the parent (via the REST API).

**Expected Result:**
- Refused at both. The KB states this rule plainly, so it must be enforced server-side and not only by omitting a
  menu item — the API makes it trivially reachable otherwise.

---

### TC-RKB-177: A page cannot contain children

**User Role:** Member
**Priority:** High
**Steps:**
1. Confirm no **New Page** or **New Folder** action is offered on a page.
2. Send a create request directly naming a page as the parent.

**Expected Result:**
- Refused at both legs. A child created under a page would produce a node the sidebar cannot render and which may
  never be reachable or deletable.

---

## Negative Cases — validation

---

### TC-RKB-178: Blank names

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Attempt to create a space, a folder and a page each with an empty name/title; then with whitespace only.

**Expected Result:**
- All six rejected with a validation message. A blank node in a sidebar tree is unidentifiable and effectively
  unmanageable.

---

### TC-RKB-179: Duplicate names at the same level

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create two spaces with the same name; two folders with the same name in one space; two pages with the same
   title in one folder.

**Expected Result:**
- Either rejected, or allowed with the entries distinguishable in the sidebar.
- Two identical sibling nodes with no way to tell them apart is a usability defect — deleting a space is
  irreversible, so picking the wrong one matters.

---

### TC-RKB-180: Very long names

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create a space, folder and page each with a 500-character name.

**Expected Result:**
- Rejected with a stated maximum, or truncated in the sidebar without breaking the tree layout or pushing the
  content area off screen.

---

### TC-RKB-181: Script content in a name or title

**User Role:** Member
**Priority:** High
**Steps:**
1. Name a space, a folder and a page with a script tag.
2. View the sidebar, the page header, the version history table, and the issue's Related Knowledge Base Pages
   section.
3. Publish the page and view it through a public URL.

**Expected Result:**
- Escaped and rendered literally in all of those places. **No script executes.**
- The public-URL rendering is the critical one: a page title is author-controlled text displayed to
  **unauthenticated** visitors, so execution there is Critical.

---

### TC-RKB-182: Special characters in names

**User Role:** Member
**Priority:** Low
**Steps:**
1. Use quotes, ampersands, slashes, emoji and non-Latin characters in names.

**Expected Result:**
- Stored and rendered faithfully. A slash must not break the node's URL or its public URL.

---

### TC-RKB-183: Concurrent structural edits

**User Role:** Two members
**Priority:** Medium
**Steps:**
1. Both open the Knowledge Base. A deletes a folder; B, without reloading, creates a page inside it.

**Expected Result:**
- B gets a clear failure and the tree reconciles on reload. No 500 and no orphaned node pointing at a deleted
  parent.

---

### TC-RKB-184: Deleting a space with a publicly shared page inside it

**User Role:** Member, then unauthenticated visitor
**Priority:** High
**Steps:**
1. Enable a public URL on a page, note the link, then delete the space containing it.
2. Retry the public link from an unauthenticated session.

**Expected Result:**
- The public link stops working — not a 500, and certainly not continued content.
- Cascading deletion must also revoke external access; this is an easy path to miss because the cascade and the
  token live in different parts of the data model.

---

### TC-RKB-185: Node creation without permission

**User Role:** Member with `view_knowledgebase` only
**Priority:** High
**Steps:**
1. Confirm no create/edit/delete actions appear in the sidebar dropdowns.
2. Send space-create, node-create and node-delete requests **directly**.

**Expected Result:**
- No actions offered **and** all direct requests refused with 403 (covered in full by the permissions suite).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
