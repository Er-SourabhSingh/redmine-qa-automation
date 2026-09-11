# BUG-HLP-049

- Bug ID: BUG-HLP-049
- Production Redmine Issue ID: 120471
- Title: Knowledgebase Page History can only view an older version's content — no compare or restore action exists anywhere
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-11

## Steps to reproduce

1. Create a Knowledgebase article, save it at least twice with different body content (two real versions).
2. Open Menu → Page History — confirms both versions are listed.
3. Click the older version ("v. 1") row.
4. Look for any control to compare it against the current version, or to restore it as the current content.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §17 ("Version history | Compare versions and restore an older one") and the tester checklist ("An older version can be compared and restored"), opening an older version should offer both a comparison (diff against another version) and a restore action that makes that older content current again.

## Actual result

Clicking an older version only **displays its content read-only** — no compare and no restore action exists anywhere in the UI.

- The Page History table itself (`createVersionTable()` in the plugin's own JS) renders exactly 3 columns per row — Version, Updated at, Updated By — with no Action column, no checkbox for multi-select comparison, and no per-row button.
- Clicking a version number calls `getVersion(id)`, which fetches that version's stored content and renders it into the (now read-only) editor via `editor.blocks.render(versionData)`. In the same function, both `#save-draft` and `#publish` are explicitly hidden (`style.display = "none"`) — so there isn't even an indirect "restore via manual copy-paste-then-save" path, since Save/Publish aren't reachable from this view at all.
- A full-source search of the entire KB JS bundle for `restore` and `compare` (case-insensitive) returns zero matches anywhere in the file. The only related variable, `isOldVersion`, exists purely to prevent old-version viewing from triggering an unintended auto-save of the current draft — it has no restore/compare behavior attached.
- The only way back to the live, editable article is navigating away and re-opening it fresh (which was confirmed to correctly still show the real current version, v. 2 — no data was corrupted by this investigation).

This is a partial-feature gap: version history genuinely exists and correctly retains every save (TC-HLP-164 passes), but the two actions the documentation specifically promises on top of that list — compare and restore — are both completely absent, not just hard to find.

## Evidence

### Screenshot

![Page History table for "Resetting your password" — v.2 (current) and v.1 listed, only 3 plain columns, no compare/restore controls anywhere on screen](../../screenshots/BUG-HLP-049/bug-hlp-049-page-history-no-restore-compare.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-049/retest-yyyy-mm-dd-pass.png)

### Console / log

- Source-level confirmation (`rf_knowledgebase-70104511.js`): `createVersionTable()`'s generated row HTML contains only `<td>` cells for version label, date, and author — no action cell.
- `getVersion(id)` explicitly sets `document.getElementById("save-draft").style.display = "none"` and `document.getElementById("publish").style.display = "none"` when displaying an old version.
- Full-bundle text search for `restore` / `compare` (case-insensitive): 0 matches.
- Live DOM sweep of every visible `<button>` while viewing "v. 1": no button with restore/compare-related text or tooltip found.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-165 ("Comparing and restoring an older Knowledgebase version works"), immediately after TC-HLP-164 (version history listing) passed cleanly on the same article.
- Uses the same fixture article as BUG-HLP-048 ("Resetting your password", id 3) — left in place with its 2 real versions intact for future retesting.
