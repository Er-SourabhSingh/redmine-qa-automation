# BUG-HLP-050

- Bug ID: BUG-HLP-050
- Production Redmine Issue ID: #120474 (ztflux)
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

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120474 checked in)

**CONFIRMED FIXED.** Root-caused via source (`assets/javascripts/rf_knowledgebase.js`): a new delete icon is now rendered in the Attachments panel's Action column (`<span class="kb-icon kb-delete-icon delete-attachment ..." id="delete-attachment-${id}">`), wired to a click handler that calls `DELETE rf_kb_delete_attachment/${id}.json` after a real confirmation modal — a genuinely new, independent removal path from the original `block-removed` Editor.js event path (which is left untouched).

Live-verified end-to-end on the exact original fixture (article "Resetting your password", id 3, attachment id 9, `tc-166-test-attachment.txt`):
- Opened Menu → Attachments on the article; the panel's Action column now shows a real delete icon (`#delete-attachment-9`) alongside the existing download link.
- Clicked it — a genuine "Delete Attachment? Are you sure you want to delete this attachment? This action cannot be undone." confirmation modal appeared (Cancel/Delete).
- Clicked Delete — the row disappeared from the Attachments panel immediately.
- Confirmed via direct DB check (`rails runner`): `Attachment.where(id: 9).exists? == false` and `RfKnowledgebasePageAttachment.where(attachment_id: 9).count == 0` — the underlying attachment and its join record are genuinely destroyed, not just hidden client-side.

**One residual nuance worth recording, not a reason to keep this bug open**: after a full page reload, the article's own content still visually renders the old Attachment block with the file's name (the block's data is baked into the article's saved Editor.js JSON, which the panel-delete path doesn't rewrite) — its download link would now be dead since the underlying `Attachment` row is gone. This is a display artifact of the article's stored content, distinct from "no removal path exists at all" (the bug's actual scope) — the original in-editor Backspace/settings-button removal gap may still exist unchanged, but the documented capability ("remove files on an article") is now genuinely reachable and functionally correct via the Attachments panel.

## Notes

- Found while executing `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-166 ("Adding and removing attachments on a Knowledgebase article"). The "add" half passed cleanly; this bug covers only the "remove" half.
- Uses the same fixture article as BUG-HLP-048/049 ("Resetting your password", id 3), which now has one permanent attachment (`tc-166-test-attachment.txt`, id 9) left in place since it cannot currently be removed through the UI.
- This is the third distinct KB sub-feature gap found in this session (alongside BUG-HLP-048 nesting and BUG-HLP-049 compare/restore) — all three share the shape of "the documented capability's server-side/event-wiring exists or was clearly intended, but the actual UI never reaches it."
