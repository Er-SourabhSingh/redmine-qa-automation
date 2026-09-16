# Test Cases — Redmineflux Knowledge Base — Rich Text Editor, Auto-Save & Mentions

> Source: vendor KB — "How to Write Content in the Rich Text Editor", "User Mentions", "Issue Mentions",
> "How to View Linked Knowledge Base Pages on Issues", FAQ Q4, Q8.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_knowledge_base_qa

## Navigation methodology

Knowledge Base → a page → **Edit**. For the mention-notification cases, check
Administration → Settings → General → **Host name and path** first, on this environment, this session — otherwise
the links inside the notification emails will be wrong and the results unusable.

---

## Functional Cases — Editor formatting

---

### TC-RKB-301: All documented formatting options work

**User Role:** Member with `manage_knowledgebase_pages`
**Steps:**
1. In one page, apply each documented option in turn: **H2, H3, H4**; bold, italic, underline; ordered and
   unordered lists; a table; an inline code span; a multi-line code block; a blockquote; a link; an image; an emoji
   from the picker.
2. Publish and view the rendered page.

**Expected Result:**
- Every option is offered and renders correctly both in the editor and on the published page.
- Record a result per option — a blanket "editor works" would hide a single broken control, and the KB names these
  explicitly.

---

### TC-RKB-302: Formatting survives an edit round trip

**User Role:** Member
**Steps:**
1. Publish a page with rich formatting, then re-open it in the editor and Update without changing anything.

**Expected Result:**
- The content is byte-for-byte equivalent — tables intact, code blocks intact, links intact.
- A round trip that flattens tables or strips code-block languages is silent data loss and is the classic WYSIWYG
  defect.

---

### TC-RKB-303: Images and links

**User Role:** Member
**Steps:**
1. Insert an image and a hyperlink; publish; view the page, then view it through a public URL.

**Expected Result:**
- Both render. Any image the plugin stores is served to the public view too — if an embedded image 404s publicly
  while working internally, the public page is silently broken for external readers.

---

### TC-RKB-304: Code blocks preserve content exactly

**User Role:** Member
**Steps:**
1. Paste code containing angle brackets, ampersands and quotes into a multi-line code block; publish.

**Expected Result:**
- Rendered literally with no HTML interpretation and no character mangling.

---

### TC-RKB-305: Large page content

**User Role:** Member
**Steps:**
1. Build a page of roughly 100 KB of rich content with many tables and images; publish.

**Expected Result:**
- Saves, publishes and renders without timeout. Record the auto-save and publish times.

---

## Functional Cases — Auto-save

---

### TC-RKB-306: Auto-save indicator behaves as documented

**User Role:** Member
**Steps:**
1. Type into the editor and watch the toolbar indicator.

**Expected Result:**
- It shows **Saving** then **Saved**, per the KB. The states are accurate — "Saved" must not appear while a
  request is still in flight or has failed.

---

### TC-RKB-307: Auto-saved content survives leaving the page

**User Role:** Member
**Steps:**
1. Type content, wait for **Saved**, navigate away without publishing, then re-open the page.

**Expected Result:**
- The draft content is present. This is the whole point of auto-save, and losing it is High severity.

---

### TC-RKB-308: Auto-save does not create a version

**User Role:** Member
**Steps:**
1. Edit a published page repeatedly over several minutes, letting auto-save fire many times.
2. Open **Versions**.

**Expected Result:**
- **No new version entries.** The KB and FAQ Q4 state that versions are created only on Publish, Update or Restore.
- A build that snapshots on auto-save would flood the history and make restore useless — this is a documented
  contract, so a violation is a clear defect.

---

### TC-RKB-309: Auto-save failure is visible

**User Role:** Member
**Steps:**
1. Take the network offline while typing; then let the session expire and continue typing.

**Expected Result:**
- The indicator shows a failure state rather than a false **Saved**.
- **A silent auto-save failure is the worst defect this feature can have**: the author keeps writing, believing
  their work is stored, and loses all of it. High severity if the indicator lies.

---

## Functional Cases — User mentions

---

### TC-RKB-310: @mention dropdown lists active project members

**User Role:** Member
**Steps:**
1. Type `@` followed by a few characters in the editor.

**Expected Result:**
- A dropdown shows matching **active members of this project**, per the KB.
- Locked users and non-members are not offered.

---

### TC-RKB-311: Selecting a user inserts the mention

**User Role:** Member
**Steps:**
1. Select a user from the dropdown.

**Expected Result:**
- The mention is inserted into the content and renders as a reference on the published page.

---

### TC-RKB-312: Mention email is sent on publish

**User Role:** Member
**Steps:**
1. Mention a user, publish the page, and check that user's mailbox.

**Expected Result:**
- An email arrives containing **a direct link to the page** and **the name of the publishing author**, exactly as
  the KB specifies.
- The link works when followed by the mentioned user.

---

### TC-RKB-313: No email is sent while the page is only a draft

**User Role:** Member
**Steps:**
1. Add a mention and let auto-save run repeatedly, without publishing.

**Expected Result:**
- No email is sent until Publish. The KB ties notification to publish, and an auto-save that emailed on every
  keystroke pause would be an obvious spam defect.

---

### TC-RKB-314: Re-publishing does not re-notify unchanged mentions

**User Role:** Member
**Steps:**
1. Publish a page mentioning user A. Edit it, add a mention of user B, and click Update.

**Expected Result:**
- B is notified. A is **not** re-notified for a mention that was already published.
- Re-notifying every previously mentioned user on every Update would make the feature unusable on a frequently
  revised page.

---

### TC-RKB-315: Mention notifications respect the General setting

**User Role:** Admin then Member
**Steps:**
1. Disable **Mention users**; publish a page containing a mention.

**Expected Result:**
- No dropdown is offered and no email is sent, while the page content itself still publishes normally.

---

## Functional Cases — Issue mentions and linking

---

### TC-RKB-316: #issue dropdown lists open project issues

**User Role:** Member
**Steps:**
1. Type `#` followed by digits in the editor.

**Expected Result:**
- A dropdown shows matching **open issues in this project**, per the KB.

---

### TC-RKB-317: The mention renders as a working issue link

**User Role:** Member
**Steps:**
1. Insert an issue mention, publish, and click the rendered link.

**Expected Result:**
- It navigates to that issue.

---

### TC-RKB-318: Linked page appears on the issue

**User Role:** Member
**Steps:**
1. Publish a page mentioning issue #N.
2. Open issue #N and scroll to the bottom of the details section.

**Expected Result:**
- A **Related Knowledge Base Pages** section lists the page, and its title links back to it, per the KB.

---

### TC-RKB-319: The link is removed automatically when the mention is removed

**User Role:** Member
**Steps:**
1. Edit the page to remove the issue mention and Update.
2. Re-check the issue.

**Expected Result:**
- The page no longer appears in Related Knowledge Base Pages. The KB states the link is created and removed
  automatically with no manual action.

---

### TC-RKB-320: Multiple pages linked to one issue

**User Role:** Member
**Steps:**
1. Mention the same issue from three pages and publish all three.

**Expected Result:**
- All three are listed on the issue, each linking correctly.

---

## Negative Cases

---

### TC-RKB-321: Related pages section respects page visibility

**User Role:** Member with `view_knowledgebase` only
**Preconditions:** A **draft** (never published) page mentions an issue this user can see.
**Steps:**
1. Open the issue as that user and inspect the Related Knowledge Base Pages section.

**Expected Result:**
- The draft page is **not** listed — its title must not leak.
- **This is the sharpest leak path in the plugin**: the issue page is a completely different controller from the
  knowledge base, so the draft-visibility rule has to be re-applied there. A draft page's title appearing on an
  issue would expose unpublished work to every project member.

---

### TC-RKB-322: Related pages section respects project boundaries

**User Role:** Member of project A only
**Preconditions:** A page in **private** project B mentions an issue that is visible in A (or a shared issue).
**Confirm project B is genuinely private — a newly created Redmine project defaults to public.**
**Steps:**
1. Open the issue as the project A user.

**Expected Result:**
- No page from B is listed. A cross-project title leak here would be High severity.

---

### TC-RKB-323: Mentioning a user who cannot see the page

**User Role:** Member
**Steps:**
1. On a page in a private project, mention a user who is not a member of that project (if the dropdown allows it,
   or by typing the mention manually). Publish.
2. Inspect what that user receives and what they can open.

**Expected Result:**
- Either no notification, or a notification containing **no page content**, and following the link gives them 403.
- The mention must not grant access. The KB scopes the dropdown to project members, so the interesting case is a
  manually typed mention that bypasses the picker.

---

### TC-RKB-324: Mentioning a non-existent user or issue

**User Role:** Member
**Steps:**
1. Type `@nosuchuser` and `#999999` manually and publish.

**Expected Result:**
- The page publishes, the text stays literal, no email is sent and no phantom link is created. No error.

---

### TC-RKB-325: Issue mention referencing an issue the reader cannot see

**User Role:** Member A (can see issue #N) mentions it; Member B cannot see #N
**Steps:**
1. Publish the page and view it as B.

**Expected Result:**
- The reference does not disclose the issue's subject or status to B.
- Rendering a link is acceptable; rendering the issue's **title** pulled from a record B cannot read is a leak.

---

### TC-RKB-326: Script injection through editor content

**User Role:** Member
**Steps:**
1. Insert a script tag, an `onerror` image payload and a `javascript:` link through the editor and through any
   HTML source mode available; publish.
2. View the page as another user **and** through a public URL.

**Expected Result:**
- Sanitised and inert in both views. **No script executes for any viewer, authenticated or not.**
- This is the plugin's most serious security case: page content is rich HTML authored by one user and rendered to
  other users **and to unauthenticated visitors**. Execution would be Critical.

---

### TC-RKB-327: Concurrent editing of one page

**User Role:** Two members
**Steps:**
1. Both open the same page in the editor and type different content; let both auto-save.

**Expected Result:**
- Record the behaviour precisely. With auto-save on both sides, a last-writer-wins model silently destroys one
  author's work with no conflict warning and no version entry to recover from — because auto-save creates no
  versions.
- Any loss here is High severity, and this combination (auto-save + versions only on publish) makes it likely.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
