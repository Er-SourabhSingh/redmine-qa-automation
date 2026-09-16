# Test Cases — Redmineflux Knowledge Base — Draft/Publish Workflow, Visibility & Version History

> Source: vendor KB — "How to Use the Draft and Publish Workflow", "How to Use Version History",
> "Page Visibility Rules", FAQ Q3, Q4, Q5.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Test accounts required

This suite needs three distinct users, and results are meaningless without them:

- **Author** — holds `manage_knowledgebase_pages`.
- **Manager** — a *different* user who also holds `manage_knowledgebase_pages`.
- **Reader** — holds `view_knowledgebase` only, and is **not** the author.

The visibility rules distinguish "the author" from "anyone with manage rights", so testing with a single account
cannot verify them.

---

## Functional Cases — Publishing

---

### TC-RKB-401: A new page starts as a draft

**User Role:** Author
**Steps:**
1. Create a page and observe the sidebar and page header.

**Expected Result:**
- Status is **draft**, with a Draft badge in both places, per the KB.

---

### TC-RKB-402: Publish a page

**User Role:** Author
**Steps:**
1. Open the draft → **Publish** → confirm the prompt.

**Expected Result:**
- A confirmation prompt appears before publishing.
- After confirming: the Draft badge clears, the page becomes visible to `view_knowledgebase` holders, **a version
  snapshot is created**, and mentioned users are emailed.
- All three consequences must occur — verify the version entry, not just the badge.

---

### TC-RKB-403: Editing a published page keeps it published

**User Role:** Author
**Steps:**
1. Open a published page → **Edit** → change the content and let auto-save run.
2. **Before** clicking Update, check the page as the **Reader**.

**Expected Result:**
- The Reader still sees the **last published version**, not the in-progress draft.
- The page's public status remains published throughout.
- This is the workflow's core promise and its most valuable assertion: an unpublished edit must never be visible to
  ordinary readers.

---

### TC-RKB-404: Update publishes the new draft as a new version

**User Role:** Author
**Steps:**
1. Click **Update**.
2. Check the page as the Reader, and open Versions.

**Expected Result:**
- The Reader now sees the new content, and a new version entry exists.

---

### TC-RKB-405: Unpublish a page

**User Role:** Author
**Steps:**
1. Open a published page → **Unpublish** → confirm.

**Expected Result:**
- The status becomes draft with an **Unpublished** badge.
- The Reader can no longer see the page **at all** — not even the previously published version.
- Any public URL for it stops serving content.

---

### TC-RKB-406: Re-publishing restores visibility as a new version

**User Role:** Author
**Steps:**
1. Publish the unpublished page again.

**Expected Result:**
- Visibility is restored for the Reader and a new version entry is created, per the KB.

---

### TC-RKB-407: Publish confirmation can be cancelled

**User Role:** Author
**Steps:**
1. Trigger Publish, then cancel the confirmation. Repeat for Unpublish.

**Expected Result:**
- Neither action takes effect; the page's state and version history are unchanged.

---

## Functional Cases — Visibility rules

> Each case below verifies one row of the vendor's published visibility matrix. Check **both** the UI and a direct
> request to the page URL as the denied user — a hidden sidebar node is not evidence that the page is protected.

---

### TC-RKB-408: Published page — visible to all with view_knowledgebase

**User Role:** Reader
**Steps:**
1. Open a published page from the sidebar and by direct URL.

**Expected Result:**
- Visible and readable in both.

---

### TC-RKB-409: Draft with no published version — author and manage holders only

**User Role:** Author, Manager, Reader
**Steps:**
1. Author creates a draft and never publishes it.
2. Check visibility for all three users, in the sidebar and by direct URL.

**Expected Result:**
- Author: visible. Manager (`manage_knowledgebase_pages`): visible.
- **Reader: not visible in the sidebar and refused at the URL**, with no title or content in the response.

---

### TC-RKB-410: Draft that has published versions — readers see the last published version

**User Role:** Author, Reader
**Steps:**
1. Publish a page, then edit it so a newer draft exists alongside the published version.
2. Open the page as the Reader.

**Expected Result:**
- The Reader sees the **last published version**, per the matrix — not the draft, and not a "not found".
- The Author sees the draft they are working on.
- This row is the most intricate of the five and the most likely to be implemented as a simple "is draft → hide",
  which would wrongly hide published content from every reader.

---

### TC-RKB-411: Explicitly unpublished — author and manage holders only

**User Role:** Author, Manager, Reader
**Steps:**
1. Unpublish a previously published page.
2. Check all three users in the sidebar and by direct URL.

**Expected Result:**
- Author and Manager: visible. **Reader: refused**, and the previously published content is no longer served.
- Contrast with TC-RKB-410 deliberately: a page with a published version that is being *edited* stays readable,
  while one that is *unpublished* does not. Confusing the two is a real and consequential defect in either
  direction.

---

### TC-RKB-412: Folders are always visible to all members

**User Role:** Reader
**Steps:**
1. View a folder that contains only draft pages.

**Expected Result:**
- The folder is visible, per the matrix, but it exposes **no draft page titles** inside it.
- An "always visible" folder that lists its hidden children by name would undo the draft rule entirely.

---

### TC-RKB-413: Draft badges are accurate

**User Role:** Author
**Steps:**
1. Compare badges across a never-published draft, an edited-but-published page, and an unpublished page.

**Expected Result:**
- Draft and Unpublished badges are distinct and correct for each state — the author needs to tell at a glance
  whether readers can currently see the page.

---

## Functional Cases — Version history

---

### TC-RKB-414: Version history records everything documented

**User Role:** Author
**Steps:**
1. Publish a page three times with different content, adding a publish comment where offered.
2. Open **Versions**.

**Expected Result:**
- Each entry shows a **sequential version number**, the **title and content snapshot at publish time**, the
  **publishing author**, a **timestamp**, and the **optional comment** — all five, per the KB.
- The current version carries a **Current Version** badge.

---

### TC-RKB-415: Snapshots are point-in-time

**User Role:** Author
**Steps:**
1. Open version 1 after publishing version 3.

**Expected Result:**
- Version 1 shows the content **as it was then**, not the current content. A history that renders the live content
  for every entry is useless and makes restore untestable.

---

### TC-RKB-416: Version author attribution is correct

**User Role:** Author then Manager
**Steps:**
1. Author publishes version 1; Manager edits and Updates to create version 2.

**Expected Result:**
- Each version names the user who actually published it, not the page's original creator.

---

### TC-RKB-417: Only publish actions create versions

**User Role:** Author
**Steps:**
1. Count versions; then auto-save many times without publishing; count again.

**Expected Result:**
- The count is unchanged (paired with TC-RKB-308).

---

### TC-RKB-418: Restore a previous version

**User Role:** Author
**Steps:**
1. Versions → an older entry → **Restore this version** → confirm.

**Expected Result:**
- The page content is immediately updated to the restored version.
- **The page is published immediately** — no separate publish step, per the KB.
- A new version entry is created with the comment **"Restored from version N"**.
- The Reader sees the restored content.

---

### TC-RKB-419: Restore is auditable

**User Role:** Author
**Steps:**
1. After restoring, review the version history.

**Expected Result:**
- The restore is recorded as its own entry with its author and timestamp — the KB states the restore is recorded
  "for audit purposes", so it must be attributable, not anonymous.

---

### TC-RKB-420: Restore on an unpublished page

**User Role:** Author
**Steps:**
1. Unpublish a page with several versions, then restore an older one.

**Expected Result:**
- Behaviour is explicit and consistent. Since restore publishes immediately, record whether restoring
  **re-publishes** a deliberately unpublished page.
- If it does, that is a meaningful surprise: an author who unpublished a page for a reason could silently make it
  public again by restoring. Record it either way; it belongs in the plugin memory file.

---

## Negative Cases

---

### TC-RKB-421: Publishing without permission

**User Role:** Reader
**Steps:**
1. Confirm no Publish/Update/Unpublish controls are offered.
2. Send the publish and unpublish requests **directly** (the REST API exposes both).

**Expected Result:**
- Refused with 403 at the endpoint.
- Publishing is the act that makes content visible to everyone and emails mentioned users — an unenforced publish
  endpoint would let any reader expose a colleague's unfinished draft to the whole project. High severity.

---

### TC-RKB-422: Restore without permission

**User Role:** Reader
**Steps:**
1. Send the `restore_version` request directly.

**Expected Result:**
- Refused. Restore both **overwrites current content and publishes**, so it is the most destructive endpoint in
  the plugin after deletion.

---

### TC-RKB-423: Restore a version of a deleted page

**User Role:** Author
**Steps:**
1. Delete a page, then send a restore request for one of its former versions.

**Expected Result:**
- Refused cleanly with a not-found response. No resurrection of a deleted page and no 500.

---

### TC-RKB-424: Publish an empty page

**User Role:** Author
**Steps:**
1. Publish a page with no content.

**Expected Result:**
- Either refused with a message, or published as an empty page that renders cleanly.
- The version snapshot must still be coherent — an empty version that breaks the history table is a defect.

---

### TC-RKB-425: Very long version history

**User Role:** Author
**Steps:**
1. Publish a page 50 times and open Versions.

**Expected Result:**
- The table remains usable — paginated or scrollable — and restore still works from an old entry.
- Record the load time.

---

### TC-RKB-426: Concurrent publish

**User Role:** Author and Manager
**Steps:**
1. Both open the same page. A clicks Update; B, without reloading, clicks Update with different content.

**Expected Result:**
- Both publishes are recorded as separate sequential versions, or the second is refused with a stale-state
  message. No version number is reused and no content is lost without a recoverable version entry.

---

### TC-RKB-427: Unpublishing a page with a public URL

**User Role:** Author, then unauthenticated visitor
**Steps:**
1. Enable a public URL on a published page, confirm it works, then unpublish the page.
2. Retry the public link from a fresh unauthenticated session (bypassing the 10-minute browser cache).

**Expected Result:**
- The public URL stops serving content — the KB states unpublished pages are not visible via public URLs.
- This is the intersection of two features and an easy one to miss; continued public access to withdrawn content
  would be High severity.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
