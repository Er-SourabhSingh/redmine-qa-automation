# Test Cases — Redmineflux Knowledge Base — REST API

> Source: vendor KB — "REST API" (Spaces API, Nodes API, response envelope, pagination).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Scope and method

Base path `/api/knowledgebase/`. All endpoints require authentication and return JSON. Requests are made with an
API key or session as appropriate, using an HTTP client rather than the browser UI.

> **Why this suite carries weight:** the API is a **second write path** onto the same data. Every rule the UI
> enforces — page visibility, the folder/page hierarchy constraints, publish permissions, project scoping — must be
> enforced here independently. The UI can hide a control; the API cannot. Anywhere the two disagree is the defect.
>
> Redmine's REST API must be enabled (Administration → Settings → API) for key-based authentication to work;
> record whether it is, since a blanket 401 otherwise will be misread as a permission result.

---

## Functional Cases — Spaces API

---

### TC-RKB-136: List spaces

**User Role:** Member with `view_knowledgebase`
**Priority:** Medium
**Steps:**
1. `GET /api/knowledgebase/spaces?project_id=X`.

**Expected Result:**
- 200 with the project's spaces in the documented envelope.
- The set matches what the sidebar shows for the same user.

---

### TC-RKB-137: Get a single space

**User Role:** Member
**Priority:** Medium
**Steps:**
1. `GET /api/knowledgebase/spaces/:id?project_id=X`.

**Expected Result:**
- 200 with that space's attributes.

---

### TC-RKB-138: Create a space

**User Role:** Member with `manage_knowledgebase_spaces`
**Priority:** Medium
**Steps:**
1. `POST /api/knowledgebase/spaces?project_id=X` with a name and description.

**Expected Result:**
- The space is created and appears in the UI sidebar — the two paths write the same data.

---

### TC-RKB-139: Update a space

**User Role:** Member with `manage_knowledgebase_spaces`
**Priority:** Medium
**Steps:**
1. `PATCH /api/knowledgebase/spaces/:id?project_id=X` changing the name.

**Expected Result:**
- Updated, and reflected in the UI.

---

### TC-RKB-140: Delete a space

**User Role:** Member with `manage_knowledgebase_spaces`
**Priority:** High
**Steps:**
1. `DELETE /api/knowledgebase/spaces/:id?project_id=X` on a space containing folders, pages and versions.

**Expected Result:**
- Deleted, with the same irreversible cascade the UI performs.
- **The API has no confirmation dialog to protect the caller**, which makes it the easiest way to destroy a space
  by accident. Confirm the cascade is complete and that no orphaned nodes survive.

---

## Functional Cases — Nodes API

---

### TC-RKB-141: List and get nodes

**User Role:** Member
**Priority:** Medium
**Steps:**
1. `GET /api/knowledgebase/nodes?project_id=X`, then `GET /api/knowledgebase/nodes/:id?project_id=X`.

**Expected Result:**
- 200 in both cases, with folder and page nodes distinguishable and their parent relationships represented.

---

### TC-RKB-142: Create, update and delete a node

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** Medium
**Steps:**
1. `POST` a page node, `PATCH` its title and content, then `DELETE` it.

**Expected Result:**
- All three succeed and are reflected in the UI.
- A node created through the API starts in **draft**, consistent with UI-created pages.

---

### TC-RKB-143: Publish a page via the API

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** High
**Steps:**
1. `POST /api/knowledgebase/nodes/:id/publish?project_id=X`.

**Expected Result:**
- The page becomes visible to `view_knowledgebase` holders, **a version is created**, and mention notifications
  are sent — the same three consequences as the UI publish.
- If the API publish skips version creation or notifications, the two paths have diverged, which undermines both
  the audit trail and the collaboration feature.

---

### TC-RKB-144: Unpublish a page via the API

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** Medium
**Steps:**
1. `POST /api/knowledgebase/nodes/:id/unpublish?project_id=X`.

**Expected Result:**
- The page reverts to draft with the Unpublished state, disappears for readers, and any public URL stops serving.

---

### TC-RKB-145: List version history via the API

**User Role:** Member
**Priority:** Medium
**Steps:**
1. `GET /api/knowledgebase/nodes/:id/versions?project_id=X`.

**Expected Result:**
- 200 with the same versions the UI shows, including numbers, authors, timestamps and comments.

---

### TC-RKB-146: Restore a version via the API

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** Medium
**Steps:**
1. `POST /api/knowledgebase/nodes/:id/restore_version?project_id=X` naming an older version.

**Expected Result:**
- Content is restored, the page is **published immediately**, and a new version entry with the
  "Restored from version N" comment is created — matching the UI behaviour exactly.

---

### TC-RKB-147: Response envelope matches the documented format

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Inspect the body of a list response.

**Expected Result:**
- `success`, `data`, and `meta` containing `total_count`, `page`, `per_page` and `total_pages`, exactly as
  documented.
- Error responses are also JSON and also structured — an HTML error page from a JSON API breaks every caller.

---

### TC-RKB-148: Pagination defaults and limits

**User Role:** Member
**Priority:** Low
**Steps:**
1. Request a collection with no pagination parameters; then `per_page=100`; then `per_page=500`; then `page=2`.

**Expected Result:**
- Defaults are `page=1` and `per_page=25`.
- `per_page=100` is honoured; `per_page=500` is **capped at 100**, per the documented maximum, rather than being
  accepted or erroring.
- `page=2` returns the next distinct set with no overlap and no gap against page 1.

---

## Negative Cases

---

### TC-RKB-149: Unauthenticated requests are rejected

**User Role:** No credentials
**Priority:** High
**Steps:**
1. Call each endpoint with no API key and no session.

**Expected Result:**
- 401 for every one. The KB states all endpoints require authentication.
- **No endpoint may be reachable using a public sharing token** — the public token is for `/kb/public/*` only, and
  a token that also opened the API would be Critical (paired with TC-RKB-130).

---

### TC-RKB-150: Permissions are enforced per endpoint

**User Role:** Member with `view_knowledgebase` only
**Priority:** High
**Steps:**
1. Call, in turn: create space, update space, delete space, create node, update node, delete node, publish,
   unpublish, restore_version.

**Expected Result:**
- All nine refused with 403.
- **This is the suite's most valuable case.** The UI hides these actions from a reader; the API is where the check
  must actually exist. An unenforced `publish` would let any reader expose a colleague's draft; an unenforced
  `delete` or `restore_version` would let them destroy or overwrite content irreversibly.

---

### TC-RKB-151: Space-management and page-management permissions are distinct

**User Role:** Member with `manage_knowledgebase_pages` but **not** `manage_knowledgebase_spaces`
**Priority:** High
**Steps:**
1. Create and delete a page node — expect success.
2. Create and delete a **space** — expect refusal.

**Expected Result:**
- The two permissions are enforced separately at the API, as the KB's permission table defines them.
- Collapsing them into one check is a plausible implementation shortcut and would silently widen who can destroy
  entire spaces.

---

### TC-RKB-152: Draft pages are not returned to unauthorised readers

**User Role:** Reader with `view_knowledgebase` only
**Priority:** High
**Steps:**
1. `GET /api/knowledgebase/nodes?project_id=X` on a project containing never-published drafts and an explicitly
   unpublished page.
2. `GET` one of those draft node IDs directly.

**Expected Result:**
- Drafts are **absent from the list** and the direct GET is refused — no title and no content in either response.
- The page-visibility matrix must hold on the API exactly as in the UI. A list endpoint that returns every node
  and relies on the client to filter would leak every unpublished page title to every reader. High severity.

---

### TC-RKB-153: project_id is authorised, not just accepted

**User Role:** Member of project A only
**Priority:** High
**Preconditions:** **Confirm project B is genuinely private** with no membership path for this user.
**Steps:**
1. Call each endpoint with `project_id=B`, including a create and a delete.

**Expected Result:**
- All refused. The endpoint must authorise the named project rather than trusting the parameter because the caller
  holds a valid key.
- A successful read here is a cross-project data leak; a successful write or delete is Critical.

---

### TC-RKB-154: Node ID and project_id mismatch

**User Role:** Member of project A
**Priority:** High
**Steps:**
1. Call `GET /api/knowledgebase/nodes/:id?project_id=A` where `:id` actually belongs to private project B.

**Expected Result:**
- Refused. The node must be validated as belonging to the named project — checking only the `project_id`
  parameter while looking the node up globally is a classic and easily missed authorisation gap.

---

### TC-RKB-155: Hierarchy constraints are enforced by the API

**User Role:** Member with `manage_knowledgebase_pages`
**Priority:** High
**Steps:**
1. `POST` a folder node whose parent is a **page**.
2. `POST` a page node whose parent is a **page**.

**Expected Result:**
- Both refused. The KB's structural rules must be enforced server-side — the UI simply omits the menu option, so
  the API is the only place this is really tested (paired with TC-RKB-176 and 218).

---

### TC-RKB-156: Malformed and hostile payloads

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Send: malformed JSON; a missing required field; a wrong data type for a field; an unknown extra field; and a
   node body containing a script tag.

**Expected Result:**
- Structured JSON errors with useful messages, not 500s or HTML error pages.
- The script content is stored sanitised or escaped, so that a page created through the API is exactly as safe as
  one created through the editor. **The API must not be a route around the editor's sanitisation** — this is a
  realistic bypass, since sanitising is often done in the front end.

---

### TC-RKB-157: Non-existent and malformed identifiers

**User Role:** Member
**Priority:** Low
**Steps:**
1. Request a non-existent node ID, a non-numeric ID, and a negative ID.

**Expected Result:**
- Clean 404 or 400 responses in the documented JSON envelope. No 500 and no stack trace in the body.

---

### TC-RKB-158: Deleted-record operations

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Delete a node, then attempt to update it, publish it and restore one of its versions.

**Expected Result:**
- Each returns a clean not-found. No partial writes and no resurrection of deleted content.

---

### TC-RKB-159: Large collection performance

**User Role:** Member
**Priority:** Low
**Steps:**
1. List nodes on a project with several thousand nodes at `per_page=100`.

**Expected Result:**
- Responds in reasonable time with correct `meta` counts. Record the response time and confirm `total_count`
  matches the real total rather than the page size.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
