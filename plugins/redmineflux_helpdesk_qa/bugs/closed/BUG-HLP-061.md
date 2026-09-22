# BUG-HLP-061

- Bug ID: BUG-HLP-061
- Production Redmine Issue ID: #121011 (ztflux)
- Title: A sub-page's only hover icon in the Knowledgebase sidebar tree is Delete — at its actual 10×10px render size it is visually indistinguishable from a "+" (add), and no distinct "add child from this row" icon exists at all despite CSS already scaffolded for one
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-21)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-21

## Steps to reproduce

1. Open a Knowledgebase article that has at least one child article (e.g. "Resetting your password", page 3, with children created while retesting BUG-HLP-048).
2. Hover over one of the child rows in the sidebar tree.
3. Observe the small icon that appears on the right side of the row.
4. Click it.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §17, both nesting a child and removing a page are documented sidebar-tree actions. Whatever icon appears on hover should be visually unambiguous about which action it performs — a user should not be able to mistake a destructive "Delete" action for a constructive "Add child" one just from the icon's shape at the size it's actually rendered.

## Actual result

**The icon that appears on hover for every child/grandchild row is genuinely the Delete icon — there is no separate "add child from this row" icon anywhere — and at its real rendered size it looks like a "+" (plus/add), not an "×" (delete).**

- Confirmed via source (`app/assets/.../rf_knowledgebase.js`, `loopChild()`): a child row's `<span class="action">` renders exactly one icon, `id="delete-<id>"`, class `kb-close-icon`. There is no corresponding "add" icon ever generated for a row — `createAllNodes()` (root rows) renders no action icons at all, and `loopChild()` (child rows) renders only this one Delete icon.
- The stylesheet (`assets/stylesheets/kb_style.css`) has a real, already-written rule for `.spaces .action .add-child-icon` (with its own margin/sizing) — dead CSS with zero matching class ever emitted by the JS. This is scaffolding for a distinct add-child-per-row icon that appears to have been planned but never wired up.
- The Delete icon's underlying SVG (`kb-close-icon` in `rf_helpdesk.css`) is a real, correctly-drawn "×" (close) glyph — confirmed unambiguous when rendered at 200×200px. But in the actual sidebar tree it is displayed at only **10×10px** (`.spaces .action .close-icon.kb-icon { width: 10px; height: 10px; }`). At that size, the diagonal "×" strokes anti-alias down into a blob that reads as a "+" to a real user — confirmed both by direct observation in this session and independently by the user, who described the icon as "a + icon" that, on click, "delete popup open[s]".
- Clicking it does correctly open a real "Delete Page?" confirmation modal ("Are you sure you want to delete this page? This action cannot be undone.") rather than deleting outright — so this is not a silent-data-loss bug — but the disorienting moment of clicking what looks like "add" and instead being asked to confirm a delete is itself the defect, and a user who clicks through confirmations quickly (as many do) is at real risk of losing a page they meant to keep.
- The only way to genuinely add a child article from a specific open page is the global `#add-space` "+" icon next to the "Knowledgebase" heading (or the `r` keyboard shortcut, undocumented in the UI) — both use whichever page happens to be currently open as the parent, not the row that was clicked. There is no way to add a child directly from hovering a specific row in the tree, even though the CSS for exactly that already exists.

## Evidence

### Screenshot

![Hovering a child row at actual 10x10px size — the icon reads as a plus sign](../../screenshots/BUG-HLP-061/actual-size-looks-like-plus.png)

![The same icon's SVG enlarged to 200x200px — genuinely an X (close/delete), not a plus](../../screenshots/BUG-HLP-061/enlarged-confirms-x-shape.png)

![Clicking the icon opens a real "Delete Page?" confirmation, not an add-child flow](../../screenshots/BUG-HLP-061/clicking-ambiguous-icon-opens-delete-confirm.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-061/retest-yyyy-mm-dd-pass.png)

### Console / log

- `getComputedStyle(document.getElementById('delete-13'))` → `backgroundImage` matches the `kb-close-icon` SVG (a genuine "×" path, `M443.6,387.1L312.4,255.4...`), `width: 10px`, `height: 10px`, `backgroundSize: contain`.
- `grep -n 'add-child-icon' assets/javascripts/rf_knowledgebase.js` → 0 matches (class only exists in CSS, never emitted).
- Clicking `#delete-13` opens the real `#delete-modal`-style confirm ("Delete Page?" / "Are you sure you want to delete this page? This action cannot be undone.") — confirmed via a live click, then Cancelled (no data lost by this investigation).

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md` — distinct from BUG-HLP-048, which was about the create-request never sending `parent_id` at all and is now fixed; this is about the *tree UI's own icon clarity* for the actions that now work correctly underneath)
- Existing bug reference (if duplicate): —

## Notes

- Found while retesting BUG-HLP-048 (KB nesting) this session — the user directly flagged, from a screenshot, that hovering a sub-page shows what looks like a "+" icon and that clicking it opens a delete popup, asking whether this had been noticed. It hadn't yet been investigated to a root cause at that point; this bug documents that root cause.
- Severity judged **Low**: a real confirm dialog stands between the click and any actual deletion, so this is not a silent-data-loss risk — but it is a genuine, reproducible icon-clarity defect on a destructive action, worth fixing (either scale the Delete icon up to a size where the "×" is legible, or finish wiring up the already-scaffolded `add-child-icon` so a distinct, correctly-shaped icon exists for each action).
- Recommend: either (a) increase the Delete icon's rendered size (or increase its SVG's stroke contrast at small sizes) so it reads clearly as "×" and not "+", and/or (b) finish implementing the dead `add-child-icon` CSS so each row also gets its own genuine, visually distinct "add child" affordance instead of relying solely on the global heading icon / undocumented `r` shortcut.

## Retest — 2026-09-22 (Local, `redmine-docker-6`, production issue #121011 checked in)

**FIXED — recommendation (b) was implemented in full. Moved to closed/.**

- **Source-level fix**: `loopChild()` and `createAllNodes()` (`rf_knowledgebase.js`) now emit a real, distinct `<span class="kb-icon kb-plus-icon add-child-icon add-child-node ..." id="addchild-<id>">` per row, with tooltip "Add sub-article" — the previously-dead `.add-child-icon` CSS class is now genuinely used. Its SVG is the same "+" glyph already used elsewhere in the KB UI (confirmed a real, correctly-drawn plus sign, not the "×" close glyph), rendered at 12×12px. A new `treeAddParentId` variable is set to the specific row's ID when its own "+" is clicked, and `createNewPage()`'s parent resolution now reads `treeAddParentId !== null ? treeAddParentId : pageId` — meaning the row-specific icon creates a child under *that exact row*, while the global heading "+"/`r` shortcut still falls back to whichever page is currently open, exactly as recommended.
- **Live confirmation — visual clarity**: screenshotted a sub-page row at its actual rendered size — a clear "+" and a clear "×" now appear side by side, fully distinguishable (see retest screenshot).
- **Live confirmation — correct row targeting**: with "Resetting your password" (the root article) open, clicked a *child* row's own "+" icon (not the global one) — the resulting new article nested correctly under that specific child (3-level breadcrumb: root → child → new grandchild), not under whichever page happened to be open at the time. This is a stronger, more complete fix than the original bug's minimum ask.
- Cleanup: the test article created during this retest was deleted via its own delete icon afterward (confirming that icon still works correctly too).

### Retest screenshot

![Sub-page row at actual size — a clear "+" and a clear "×" now render side by side, fully distinguishable](../../screenshots/BUG-HLP-061/retest-2026-09-22-pass.png)

- Production issue #121011 synced 2026-09-22: Status In QA → **Done**, % Done → **100**.
