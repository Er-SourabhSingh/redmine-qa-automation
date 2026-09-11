# BUG-HLP-050

- Bug ID: BUG-HLP-050
- Production Redmine Issue ID: 120474
- Title: An attachment added to a Knowledgebase article cannot be removed through any discoverable UI interaction
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-11

## Steps to reproduce

1. Open a Knowledgebase article, add a content block, use the block-type toolbox to insert an "Attachment" block, and upload a file — confirms as added (real file, real size, real download link).
2. Save/Publish the article.
3. Attempt to remove the attachment: check the Attachments panel (Menu → Attachments) for a delete/remove control on its row; check the article's own content editor for a way to delete the Attachment block (its block-tune "settings" button, keyboard Backspace/Delete after selecting the block in several ways).

## Expected result

Per `HELPDESK_USER_GUIDE.md` §17 ("Attachments | Add and remove files on an article") and the tester checklist ("Attachments can be added and removed"), a file added to an article should also be removable through the UI.

## Actual result

**Adding works correctly and is fully confirmed** (see TC-HLP-166's PASS half): uploading via the Attachment block genuinely persists a real file (real size, real download link, listed in the Attachments panel with uploader/timestamp).

**Removing does not work through any UI path found**, despite exhaustive attempts:
- The Attachments panel's table has an Action column containing **only a download link** (`<a class="transparent-btn m-0" href="/rf_kb/download?...">`) — confirmed via direct `innerHTML` inspection, no delete icon of any kind.
- The Attachment block's own "settings" button (`.ce-toolbar__settings-btn`) only opens the block-**type-conversion** popover (Text/Heading/List/.../Attachment/etc.) — the same list every time, with no "Delete"/"Move" tune section.
- Multiple keyboard-based attempts to select the block and remove it (clicking the block then Backspace; navigating from the preceding text block via End→ArrowDown→Backspace; clicking at different points within the block's empty area then Backspace) all left the attachment block fully intact — confirmed via `document.querySelectorAll('.cdx-attaches').length` staying at 1 after every attempt.

**Root cause, confirmed via source (`rf_knowledgebase-*.js`)**: the removal mechanism does genuinely exist end-to-end on the code side — a `changeHandler(block, event)` function listens for Editor.js's own `block-removed` custom event specifically for `image`/`attaches` block types, and correctly calls `DELETE rf_kb_delete_attachment/:id` when that event fires. So the intended UX is "delete the Attachment block the normal Editor.js way, and the file is cleaned up automatically" — but no interaction found in this build's actual configuration ever succeeds in removing (i.e., firing `block-removed` for) an Attachment-type block, so this cleanup path is never reached in practice.

## Evidence

### Screenshot

![Attachment block "tc-166-test-attachment.txt" still present in the article after multiple attempted removal interactions (click+Backspace, keyboard navigation+Backspace)](../../screenshots/BUG-HLP-050/bug-hlp-050-attachment-cannot-be-removed.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-050/retest-yyyy-mm-dd-pass.png)

### Console / log

- Attachments panel Action-cell `innerHTML`: `<a class="transparent-btn m-0" href="/rf_kb/download?id=9&filename=tc-166-test-attachment.txt" download="tc-166-test-attachment.txt" target="_blank"><span class="download-attach" id="arrow-9"></span></a>` — no delete control present.
- `.ce-toolbar__settings-btn` click opens only a block-type popover (`Text, Heading, List, Code, Quote, Delimiter, Table, Image, Attachment, Raw HTML, Warning, Checklist`) — confirmed via direct DOM query, no tunes section.
- Source-level confirmation (`rf_knowledgebase-70104511.js`): `changeHandler()` listens for `event.type == "block-removed"` on `image`/`attaches` blocks and calls `DELETE rf_kb_delete_attachment/${attachId}.json` — a real, wired removal path that is simply never triggered by anything reachable in the UI.
- `document.querySelectorAll('.cdx-attaches').length` remained `1` after every removal attempt (click-select+Backspace at multiple coordinates, keyboard block-navigation+Backspace).

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; same general class as BUG-HLP-048/049 — a documented KB sub-feature whose intended mechanism exists but isn't reachable through the actual UI)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-166 ("Adding and removing attachments on a Knowledgebase article"). The "add" half passed cleanly; this bug covers only the "remove" half.
- Uses the same fixture article as BUG-HLP-048/049 ("Resetting your password", id 3), which now has one permanent attachment (`tc-166-test-attachment.txt`, id 9) left in place since it cannot currently be removed through the UI.
- This is the third distinct KB sub-feature gap found in this session (alongside BUG-HLP-048 nesting and BUG-HLP-049 compare/restore) — all three share the shape of "the documented capability's server-side/event-wiring exists or was clearly intended, but the actual UI never reaches it."
