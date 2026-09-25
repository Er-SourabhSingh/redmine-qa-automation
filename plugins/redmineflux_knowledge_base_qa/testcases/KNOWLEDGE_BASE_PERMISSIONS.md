# Test Cases — Redmineflux Knowledge Base — Permissions & Access Control

> Source: vendor KB — "Permissions and Access Control" (three named role permissions, a five-state page visibility
> matrix, and admin-only areas). This is a published specification, so every case below asserts against stated
> behaviour rather than discovering it.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## The documented model under test

| Permission | Covers | Vendor default |
|---|---|---|
| `view_knowledgebase` | View spaces, folders and published pages | Public — all project members |
| `manage_knowledgebase_spaces` | Create, edit, delete spaces | Managers |
| `manage_knowledgebase_pages` | Create, edit, publish, delete pages **and folders** | Members with write access |

Admin-only, outside the role system: **template management** and **plugin settings**.

Two details in that table are easy to get wrong and are tested deliberately:

- **Folders are governed by `manage_knowledgebase_pages`, not by the spaces permission.** A build that gates folder
  creation on `manage_knowledgebase_spaces` contradicts the documentation.
- **`view_knowledgebase` defaults to public**, meaning non-member and anonymous access depends entirely on the
  project's own visibility settings — which makes TC-RKB-102 and 909 essential rather than routine.

## Methodology — mandatory for every case

1. **Positive UI** — the permitted role performs the action through real navigation and it works.
2. **Negative UI** — the denied role sees no control.
3. **Negative endpoint** — the denied role is refused when the request is sent **directly**, including through the
   REST API, which exposes publish, unpublish, delete and restore_version.

Leg 3 is where real defects live. This plugin has two full write paths (UI and API) over the same data.

---

## Test accounts required

- **Admin**
- **Spaces manager** — `view_knowledgebase` + `manage_knowledgebase_spaces`, **without** pages
- **Pages manager** — `view_knowledgebase` + `manage_knowledgebase_pages`, **without** spaces
- **Reader** — `view_knowledgebase` only
- **No-KB member** — a project member with none of the three permissions
- **Non-member** and **Anonymous**

Testing with fewer accounts cannot distinguish the two manage permissions, which is the point of several cases.

---

## Permissions matrix to confirm

| Action | Admin | Spaces mgr | Pages mgr | Reader | No-KB member | Non-member | Anonymous |
|--------|-------|-----------|-----------|--------|--------------|------------|-----------|
| Open the Knowledge Base view | | | | | | | |
| View a published page | | | | | | | |
| View a draft page (not author) | | | | | | | |
| Create / edit / delete a space | | | | | | | |
| Create / edit / delete a folder | | | | | | | |
| Create / edit / delete a page | | | | | | | |
| Publish / unpublish a page | | | | | | | |
| Restore a version | | | | | | | |
| Enable a public URL | | | | | | | |
| Manage templates | | | | | | | |
| Change plugin settings | | | | | | | |

---

## Functional Cases

---

### TC-RKB-095: Admin has full access

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Exercise every row of the matrix.

**Expected Result:**
- All actions succeed, including templates and plugin settings.

---

### TC-RKB-096: `view_knowledgebase` grants read access only

**User Role:** Reader
**Priority:** High
**Steps:**
1. Confirm spaces, folders and published pages are viewable.
2. Confirm no create/edit/delete/publish controls appear anywhere.
3. Send, directly: space create, node create, node update, node delete, publish, unpublish, restore_version.

**Expected Result:**
- Reading works; all seven direct requests are refused with 403.

---

### TC-RKB-097: `manage_knowledgebase_spaces` covers spaces only

**User Role:** Spaces manager
**Priority:** High
**Steps:**
1. Create, edit and delete a space — expect success.
2. Attempt to create a page and a folder, through the UI and directly.

**Expected Result:**
- Space operations succeed; page and folder operations are refused.
- The two permissions are genuinely separate. Collapsing them would let a spaces manager author and publish
  content they were never granted.

---

### TC-RKB-098: `manage_knowledgebase_pages` covers pages **and folders**

**User Role:** Pages manager
**Priority:** High
**Steps:**
1. Create, edit, delete and publish a page — expect success.
2. Create, edit and delete a **folder** — expect success.
3. Attempt to create and delete a **space**, through the UI and directly — expect refusal.

**Expected Result:**
- Exactly as the KB's table defines: folders travel with pages, not with spaces.
- Step 2 is the assertion that catches the likely implementation slip; step 3 confirms the boundary holds.

---

### TC-RKB-099: A member with no KB permissions has no access

**User Role:** No-KB member
**Priority:** High
**Steps:**
1. Confirm whether the Knowledge Base menu entry appears.
2. Request the knowledge base URL and a published page URL directly.
3. Request the API list endpoints directly.

**Expected Result:**
- Refused at every leg. `view_knowledgebase` may default to public, but a role that has had it removed must be
  fully excluded — including from the API, which is the easier path to forget.

---

### TC-RKB-100: Draft visibility — author vs. manage holders vs. readers

**User Role:** Author (a Pages manager), a second Pages manager, and the Reader
**Priority:** High
**Steps:**
1. The author creates a never-published draft.
2. Check all three users in the sidebar, by direct page URL, and via `GET /api/knowledgebase/nodes`.

**Expected Result:**
- Author: visible. Second Pages manager: visible (the permission, not authorship, grants it).
- **Reader: absent from the sidebar, refused at the URL, and absent from the API listing** — no title, no content,
  no node entry.
- The API leg is the one most likely to fail, because a list endpoint naturally returns everything.

---

### TC-RKB-101: Unpublished pages are hidden from readers everywhere

**User Role:** Reader
**Priority:** High
**Steps:**
1. On an explicitly unpublished page, check: the sidebar, the direct URL, the API node listing, the sidebar search
   data, the issue's Related Knowledge Base Pages section, and any public URL previously issued for it.

**Expected Result:**
- Hidden in all six places.
- Withdrawn content leaking through any one secondary surface defeats the act of unpublishing. Enumerating the
  surfaces explicitly is what makes this case useful — checking only the sidebar would pass while the content
  remained reachable.

---

### TC-RKB-102: Non-member cannot access a private project's knowledge base

**User Role:** Non-member
**Priority:** High
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the knowledge base URL, a published page URL, and the API endpoints directly.

**Expected Result:**
- Refused at all. No space names, page titles or content in any response body, including error bodies.

---

### TC-RKB-103: Anonymous access follows the project's own visibility

**User Role:** Anonymous (logged out)
**Priority:** High
**Steps:**
1. On a private project: request the knowledge base and a page URL.
2. On a deliberately **public** project where anonymous users hold `view_knowledgebase`: request the same.

**Expected Result:**
- Private: refused.
- Public: read-only access consistent with the anonymous role's permissions, and **never** any create, edit,
  publish or share capability.
- Because `view_knowledgebase` is public by default, a public project effectively exposes its knowledge base to
  anonymous visitors. That may be intended, but it should be recorded plainly in the plugin memory file — an
  administrator enabling the module on a public project may not expect it.

---

### TC-RKB-104: Public URL creation is limited to `manage_knowledgebase_pages`

**User Role:** Reader and Spaces manager
**Priority:** High
**Steps:**
1. Confirm neither is offered the Public URL action.
2. Send the enable-public-access request directly as each.

**Expected Result:**
- Both refused. Anyone who can mint a token can publish internal documentation externally
  (paired with TC-RKB-133).

---

### TC-RKB-105: Templates and plugin settings are admin-only

**User Role:** Spaces manager, Pages manager, Reader (each in turn)
**Priority:** High
**Steps:**
1. Request the plugin configuration URL directly.
2. Send template create/edit/delete requests directly.
3. Send a plugin-settings update directly, including the public-access master toggle and the IP blocklist.

**Expected Result:**
- All refused with 403.
- These are outside the role system by design. A Pages manager reaching template management is the most plausible
  slip, since that permission already covers page content (paired with TC-RKB-202).

---

### TC-RKB-106: Inherited content requires permission on the parent

**User Role:** A member of the sub-project only
**Priority:** High
**Steps:**
1. Check the inherited section, a direct inherited-page URL, and the sidebar payload.

**Expected Result:**
- Nothing from the parent is visible or retrievable (paired with TC-RKB-062). Sub-project membership must not
  confer parent access.

---

### TC-RKB-107: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Priority:** High
**Steps:**
1. Remove `manage_knowledgebase_pages` while the member has a page open in the editor with auto-save running.
2. Have them continue typing and then attempt Publish, without logging out.

**Expected Result:**
- Auto-save and publish are both refused, with a visible failure rather than a false **Saved** indicator.
- Permissions are evaluated per request. This case combines the permission boundary with the auto-save honesty
  requirement from TC-RKB-036, and it is a realistic scenario when someone changes role mid-session.

---

### TC-RKB-108: Closed and archived projects

**User Role:** Pages manager
**Priority:** High
**Steps:**
1. Close the project: attempt to view, edit and publish, at the UI and the API.
2. Archive it and repeat, including the API and any public URL.

**Expected Result:**
- Closed projects are read-only; archived projects are inaccessible entirely, API included.
- **An archived project's pages still served through a public URL is a defect** — archiving is expected to remove
  access completely, and the public path is the one most likely to bypass the project-state check.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
