# BUG-HLP-048

- Bug ID: BUG-HLP-048
- Production Redmine Issue ID: 120465
- Title: Creating a Knowledgebase article while a parent is open never actually nests it — the "Add Article" flow silently never sends a parent reference to the server
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-11

## Steps to reproduce

1. Create a Knowledgebase article ("Resetting your password") on Helpdesk QA Alpha via the "Add Article" ("+") control — becomes page 3.
2. With that article open/active, look for any control to create a **child** article nested under it — check: the same "Add Article" ("+") control used to create the parent; the article's own toolbar (Search Pages / Share Page / Export Page / Save Page / Delete / Publish / Menu); the "Menu" button's dropdown (Attachments, Page History); a right-click/context menu on the article's sidebar tree entry.
3. Use whichever control appears closest to a "child" affordance to create a second article ("TC-HLP-163 Child Article - Common reset issues") while the first is open.
4. Inspect the resulting DOM tree structure: is the new article's `<li>` appended inside the parent's own child-container (`<ul id="ul{parent_id}">`), or inside the top-level `<ul id="spaces">`?
5. Attempt to nest the second article under the first via drag-and-drop within the sidebar tree.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §17 ("Nest | Create the child from the parent article, giving a tree") and `HELPDESK_FEATURES_LIST.md` feature #47 ("Knowledgebase | Per-project articles: nesting, versioning, attachments, search, share link, PDF export"), opening a parent article should offer a clear way to create a child article nested under it, and the sidebar tree should render the resulting parent→child structure.

## Actual result

**No discoverable, working path to create a nested child article exists anywhere in this build.**

- The "Add Article" ("+") control is the only article-creation entry point found. It behaves identically regardless of which article is currently open: the new article is always appended to `<ul id="spaces">` (the top-level list), never to the currently-open article's own child container (`<ul id="ul{N}">`, confirmed empty both before and after). Created two articles this way with the first ("Resetting your password", page 3) open when creating the second ("TC-HLP-163 Child Article...", page 4) — the second was created as a root-level sibling, not a child.
- The open article's own toolbar offers exactly six actions (confirmed via a full DOM sweep of every visible `<button>`): Search Pages, Share Page, Export Page, Save Page, Delete, Publish, plus a "Menu" dropdown. None create a child article.
- The "Menu" dropdown's full contents are exactly two items: Attachments, Page History. No child-creation option.
- No custom right-click/context menu exists on a sidebar tree entry (dispatched a synthetic `contextmenu` event directly at the article's tree-title element; no menu appeared in the DOM).
- Drag-and-drop **only reorders siblings within the same parent list** — confirmed via the plugin's own JS source (`rf_knowledgebase-*.js`, `dragDropPage()`): every reorder branch is gated behind `current.parentNode == i.parentNode`, and the corresponding `updatePageOrder()` AJAX call (`PUT rf_kb_reorder_page/:id.json?position=:serial`) only ever fires when that guard passes. There is no code path anywhere in this function that moves an item between different parent lists (i.e., no re-parenting/nesting logic exists at all) — dropping one article onto another when they are not already siblings silently does nothing.
- The sidebar tree structure itself clearly supports nesting in principle (each article's `<li>` has its own dedicated, empty child `<ul id="ul{N}">` container, and a collapse/expand arrow that's simply `hidden` when that container is empty) — the rendering side is ready for a parent/child tree, but nothing in the UI or its underlying JS ever populates a child container with a different article.

This is the same defect shape as the already-closed BUG-HLP-017 (a documented feature with no discoverable UI entry point) — except here, unlike BUG-HLP-017, the investigation went far enough to find the exact root cause, not just rule out the feature by clicking around.

**Root cause, confirmed via source (`rf_knowledgebase-*.js`):** the code's *intent* is actually correct — `createNode()` reads the currently-open page's ID (`pageId`) and passes it into `createNewPage(spaceName, isChild, pageId)` specifically so the new page can be created as a child. But `createNewPage()` never sends that parent reference to the server at all:
```js
data: {
    rf_knowledgebase_page: {
        title: name,
        path: `/${pagePath}`,   // a cosmetic, slash-joined STRING like "Resetting your password/New title"
        created_by: userId,
        updated_by: userId,
        project_id: projectId,
        // no parent_id (or any real foreign-key reference) anywhere in this payload
    }
}
```
`pagePath` looks like a nested path, but it's just a display-string built client-side from `findPath()` — it is never parsed back out server-side to establish a real parent/child relationship. The tree is rendered from the server's own parent/child data (via `getAllPages()`), which has no relationship to record, so the new page renders as root every time, regardless of which article was open when it was created. This is a genuine, reproducible implementation gap — not a missing UI affordance, but a real one (the "Add Article" flow) that silently drops the one piece of data (`parent_id`) needed to fulfill its own documented purpose.

## Evidence

### Screenshot

![Knowledgebase sidebar tree showing both "Resetting your password" and "TC-HLP-163 Child Article..." as flat, unindented siblings — no nesting occurred despite the parent being open when the second was created](../../screenshots/BUG-HLP-048/bug-hlp-048-no-nesting-both-siblings.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-048/retest-yyyy-mm-dd-pass.png)

### Console / log

- DOM check after creating the second article with the first open: `document.getElementById('page-4').parentElement` → `<ul id="spaces" class="p-0 pageList">` (the root list), not `<ul id="ul3">` (page 3's own, empty child container).
- Source-level confirmation (`rf_knowledgebase-70104511.js`, `dragDropPage()`): every DOM-move (`insertBefore`) and every `updatePageOrder()` call is wrapped in `if (current.parentNode == i.parentNode)` — genuinely no code path exists for cross-parent moves.
- Full DOM sweep of all visible toolbar `<button>` elements while the article was open: `Search Pages`, `Share Page`, `Export Page`, `Save Page`, `Delete`, `Publish`, `Menu` (Menu's own dropdown: `Attachments`, `Page History`) — seven controls total, none for child creation.
- Synthetic `contextmenu` dispatch on the article's tree-title element (`#title-3`) produced no visible custom context menu in the DOM.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; related in spirit to the already-closed BUG-HLP-017, a different entity, same "documented-but-undiscoverable" shape)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-163 ("Creating a child article nests correctly under its parent"), which explicitly requires "From the parent article, create a child article" — this precondition itself could not be satisfied through the UI.
- **Reproduced twice, independently**: once via a synthetic DOM-dispatched click on the "Add Article" control (page 4, "TC-HLP-163 Child Article - Common reset issues"), and again via a fully genuine Playwright user click on the real element (page 5, "TC-HLP-163 Real Child Test") — both landed as root-level siblings of page 3, not children, ruling out the first attempt being a fluke of the synthetic-event method.
- All three articles ("Resetting your password" id 3, "TC-HLP-163 Child Article - Common reset issues" id 4, "TC-HLP-163 Real Child Test" id 5) left in place on Helpdesk QA Alpha as ready-made fixtures for retesting once the missing `parent_id` is added to the create-page request.
- TC-HLP-164 (version history) and TC-HLP-165 (compare/restore versions) do not depend on nesting and can proceed independently using these same fixture articles.
