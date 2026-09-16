# Test Cases — Redmineflux Knowledge Base — Parent Project Inheritance & Sidebar Search

> Source: vendor KB — "How to Use Parent Project Space Inheritance", "How to Use Sidebar Search and Filter",
> FAQ Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Preconditions

A parent project **P** with a sub-project **S**, both with the Knowledge Base module enabled, and content in P's
spaces. Three users:

- **Both** — member of P and S.
- **Sub-only** — member of S but **not** of P.
- **Neither** — member of neither.

The Sub-only user is the important one: the KB states that inherited content requires `view_knowledgebase` **on the
parent project**, so this user must *not* see P's content. Without a Sub-only account, the inheritance cases below
cannot detect the leak they exist to find.

---

## Functional Cases — Inheritance

---

### TC-RKB-701: Parent spaces appear in the sub-project sidebar

**User Role:** Both
**Steps:**
1. Open S's Knowledge Base.

**Expected Result:**
- P's spaces appear under an **"Inherited from [Project Name]"** section, per the KB.
- S's own spaces appear separately, and the two groups are clearly distinguishable.

---

### TC-RKB-702: Inheritance is enabled by default

**User Role:** Admin
**Steps:**
1. On a fresh install, check the inheritance setting in Plugin Settings → General.

**Expected Result:**
- Enabled by default, as documented.

---

### TC-RKB-703: Inherited content is read-only

**User Role:** Both (with `manage_knowledgebase_pages` on S)
**Steps:**
1. In S's sidebar, attempt to use the dropdown menu on an inherited space, folder and page.
2. Open an inherited page and look for Edit, Publish, Delete and Public URL controls.
3. Send an update request for an inherited page **directly** from S's context.

**Expected Result:**
- Action menus are suppressed on inherited nodes, per the KB, and no edit controls appear on inherited pages.
- **The direct request is refused.** Manage rights on the sub-project must not become manage rights on the parent
  — that would be a privilege escalation through the inheritance feature, and it is the most consequential thing
  to check here.

---

### TC-RKB-704: Inherited pages are readable

**User Role:** Both
**Steps:**
1. Open an inherited published page from S's sidebar.

**Expected Result:**
- The content renders normally, read-only.

---

### TC-RKB-705: Inheritance respects the parent's page visibility rules

**User Role:** Both, holding only `view_knowledgebase` on P
**Preconditions:** P contains a published page, a never-published draft, and an explicitly unpublished page.
**Steps:**
1. Inspect what appears in S's inherited section.

**Expected Result:**
- Only the published page is visible. The draft and the unpublished page are absent, with their titles not
  disclosed.
- The inherited view is a second rendering path for the same content, so the draft-visibility rules must be
  re-applied there. This is exactly the kind of place where they get skipped.

---

### TC-RKB-706: Disabling inheritance removes the section

**User Role:** Admin then Both
**Steps:**
1. Disable inheritance in Plugin Settings → General; reload S's Knowledge Base.
2. Request an inherited page's URL from S's context **directly**.

**Expected Result:**
- The Inherited section disappears, and the direct request from S's context is refused (the user may still reach
  P's content through P itself if they are a member — that is correct and expected).

---

### TC-RKB-707: Multi-level hierarchies

**User Role:** Both
**Preconditions:** A grandparent → parent → child project chain.
**Steps:**
1. Open the child project's Knowledge Base.

**Expected Result:**
- Record whether inheritance is one level or transitive. The KB says only "parent project", so one level is the
  documented behaviour.
- If grandparent content appears, that is undocumented and must be checked against the same permission rule —
  a user with rights on the child but not the grandparent must not see it.

---

## Negative Cases — Inheritance

---

### TC-RKB-708: A user without parent access sees no inherited content

**User Role:** Sub-only
**Preconditions:** **Confirm project P is genuinely private and this user has no membership path to it** — a newly
created Redmine project has "Public" checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Open S's Knowledge Base and inspect the sidebar.
2. Request an inherited page's URL from S's context **directly**.
3. Inspect the sidebar's underlying response body, not just the rendered tree.

**Expected Result:**
- **No Inherited section, no space names, no folder or page titles**, and the direct request refused.
- The KB states users must have `view_knowledgebase` on the parent to see inherited content. This is the single
  most important case in the suite: a sub-project is often granted to a wider audience than its parent, so a leak
  here would expose the parent's documentation to exactly the people it was withheld from. High severity.
- Leg 3 matters: a sidebar that fetches the full tree and hides parent nodes in the browser still leaks in the
  response body.

---

### TC-RKB-709: Inherited content when the parent's module is disabled

**User Role:** Both
**Steps:**
1. Disable the Knowledge Base module on P and reload S's Knowledge Base.

**Expected Result:**
- The inherited section disappears cleanly. Not a 500 and not stale cached content.

---

### TC-RKB-710: Parent content deleted while displayed

**User Role:** Both
**Steps:**
1. Delete a space in P while S's Knowledge Base is open, then interact with the inherited section.

**Expected Result:**
- The tree reconciles on reload with no orphaned nodes and no 500.

---

### TC-RKB-711: Inherited pages cannot be shared publicly from the sub-project

**User Role:** Both with `manage_knowledgebase_pages` on S only
**Steps:**
1. Attempt to enable a public URL on an inherited page through S, then send the request directly.

**Expected Result:**
- Refused at both. Otherwise a sub-project manager could publish the parent project's documentation to the open
  internet without holding any rights on the parent — a serious escalation combining two features.

---

## Functional Cases — Sidebar search

---

### TC-RKB-712: Search filters the tree live

**User Role:** Member
**Steps:**
1. Type part of a space name, then a folder name, then a page title into the sidebar Search field.

**Expected Result:**
- Matching items appear immediately in each case, filtering across all three node types, per the KB.

---

### TC-RKB-713: Search is client-side with no page reload

**User Role:** Member
**Steps:**
1. Watch the Network tab while typing into the search field.

**Expected Result:**
- No page reload occurs. The KB describes the search as client-side.
- If requests **are** issued per keystroke, record it — that is a different implementation with different
  performance and leak characteristics, and it makes TC-RKB-717 relevant.

---

### TC-RKB-714: Clearing the search restores the full tree

**User Role:** Member
**Steps:**
1. Clear the field.

**Expected Result:**
- All items reappear with the previous expand/collapse state intact where possible.

---

### TC-RKB-715: Search matches partial strings and is case-insensitive

**User Role:** Member
**Steps:**
1. Search a lowercase fragment of a mixed-case title.

**Expected Result:**
- It matches. Record the exact semantics (substring vs prefix) for later reference.

---

### TC-RKB-716: No matches shows an empty state

**User Role:** Member
**Steps:**
1. Search for a string matching nothing.

**Expected Result:**
- A clean empty state, not a blank sidebar with no explanation and not the unfiltered tree.

---

## Negative Cases — Search

---

### TC-RKB-717: Search cannot reveal hidden pages

**User Role:** Reader with `view_knowledgebase` only
**Preconditions:** A draft page exists whose title contains a distinctive string.
**Steps:**
1. Search for that exact string.
2. If the search is client-side, also inspect the **page source and the tree payload** for the draft's title.

**Expected Result:**
- No match, and the title is absent from the underlying data.
- **A client-side search is only as safe as the data the server sent to the browser.** If the server ships the full
  tree including drafts and merely hides them in the DOM, every reader can read unpublished page titles by viewing
  source — a real leak that no amount of UI testing would reveal. This is the case that justifies inspecting the
  payload.

---

### TC-RKB-718: Search does not match inherited content the user cannot see

**User Role:** Sub-only
**Steps:**
1. Search for a distinctive string from the parent project's page titles.

**Expected Result:**
- No match, and no parent title present in the client-side data (paired with TC-RKB-708).

---

### TC-RKB-719: Special characters in the search field

**User Role:** Member
**Steps:**
1. Search for a script tag, a percent sign, a backslash and a regular-expression metacharacter such as `.*`.

**Expected Result:**
- Treated as literal search text. **No script executes** when the term is echoed into the page, and a regex
  metacharacter does not match everything or throw a client-side error.

---

### TC-RKB-720: Search on a very large tree

**User Role:** Member
**Steps:**
1. With several hundred nodes, type into the search field and observe responsiveness.

**Expected Result:**
- Filtering stays responsive with no perceptible lag per keystroke. Record the node count and the observed
  behaviour — the KB states there are no plugin-imposed limits on content volume, so degradation is on the plugin.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
