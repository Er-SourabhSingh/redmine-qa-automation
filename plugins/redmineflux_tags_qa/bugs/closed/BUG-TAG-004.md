# BUG-TAG-004

- Bug ID: BUG-TAG-004
- Production Redmine Issue ID: 120107
- Severity: Medium
- Title: Admin "Manage Tags" pages (list, tabs, Edit Tag form) are almost entirely untranslated, while sibling controls on the same pages are correctly localized
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Tags plugin (flux_tags)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: Default viewport (not resolution-specific)
- User role: Admin
- Date: 2026-09-07

## Preconditions

- Redmine system default language and the admin account's own language both set to German (Deutsch).
- At least one tag exists (created `qagermantest` on issue #230 via the issue-detail Tags widget for this test).

## Steps to reproduce

1. Log in as admin (German language active).
2. Navigate to Administration > Plugins > Redmineflux Tags plugin, e.g. `/settings/plugin/flux_tags?tab=issue`.
3. Inspect the tab labels, the tag list table, and its row actions.
4. Click "Bearbeiten" (Edit) on a tag row → inspect `/tags/:id/edit`.

## Expected result

- Every string on these admin pages renders in German, consistent with the sibling controls on the identical pages that ARE correctly translated ("Allgemein", "Bearbeiten", "Anwenden", "Alles auswählen/Alles abwählen", "Speichern").

## Actual result

On the tab/list page (`/settings/plugin/flux_tags`):
- Tab labels **"Issue Tags"**, **"Time Entry Tags"**, **"Project Tags"** — untranslated (only the "Allgemein" tab is translated).
- Checkbox label **"Use colored tag"** (on the "Allgemein" tab) — untranslated.
- Per-row action link **"Delete"** — untranslated, sitting directly next to the correctly-translated **"Bearbeiten"** (Edit) link in the same row.
- A bulk-delete **"Delete"** button (shown when one or more row checkboxes are selected, confirmed present in the DOM) carries the identical untranslated string — same root cause as the per-row link.
- Pagination label **"Pages:"** — untranslated. Confirmed this is NOT inherited from core Redmine: core Redmine's own paginator (checked on the Issues list, which does paginate) renders no "Pages:" label at all — this string is unique to this plugin's own custom-built pagination widget.

The Delete action's own confirmation modal is a **custom HTML dialog** (not a native browser `confirm()`), and it is **100% untranslated**:
- Heading **"Delete Tag"**
- Body text **"Are you sure you want to delete this tag?"**
- **"Cancel"** button
- **"Delete"** button (confirm action)

Confirming the delete then shows a flash message reading **"Tag deleted successfully"** — also untranslated, and matching the raw string already visible in BUG-TAG-003's broken title.

On the Edit Tag form (`/tags/1/edit?tab=issue`):
- Page heading **"Edit Tag: qagermantest"** — untranslated.
- Field label **"Tag Name"** — untranslated.
- **"Cancel"** link — untranslated.
- Only the **"Speichern"** (Save) button on this form is correctly translated.

The presence of correctly-translated sibling strings on the exact same pages (Allgemein, Bearbeiten, Anwenden, Alles auswählen/Alles abwählen, Speichern) proves this is a genuine, wide partial-i18n-coverage gap specific to this admin controller/views, not a documentation or expectation mismatch.

**Confirmed identical across all three tag types**: tags were created and independently verified on all three tabs — Issue Tags (`qagermanone`/`qagermantwo`/`qagermanthree`, via issue #230), Time Entry Tags (`qatimetag`, via time entry #23), and Project Tags (`qaprojecttag`, via project `defaultsd` settings). All three tabs share the exact same untranslated list/Delete/pagination/Edit-form pattern described above (same partial view, same root cause).

**Separate functional observation (not a language defect, flagged for visibility):** the table rows carry a `hascontextmenu` CSS class (reused from core Redmine's issue-list markup), suggesting a right-click bulk-action context menu was intended. Tested via both a real Playwright right-click and a manually dispatched native `contextmenu` DOM event on a row with 2 tags checkbox-selected — no context menu appears in either case, and no `#context-menu` element is ever added to the DOM. This looks like leftover/copied markup with no working menu wired up behind it, rather than a translation issue — flagging in case a separate functional bug should be filed for it.

## Severity rationale

Medium: admin-only surface (lower traffic than end-user forms), but the untranslated fraction is unusually large for a single page/flow — most of the Edit Tag form and the tab bar are untranslated, which would be immediately obvious to any German-speaking admin managing tags.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TAG-004/admin-tag-list-untranslated.png)
![Delete confirm modal evidence](../../screenshots/BUG-TAG-004/delete-confirm-modal-untranslated.png)
![Delete success message evidence](../../screenshots/BUG-TAG-004/delete-success-message-untranslated.png)
![Edit Tag form evidence](../../screenshots/BUG-TAG-004/edit-tag-form-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TAG-004/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Reconfirmation — 2026-09-08, new Forge server

Retested on a fresh Forge server (`https://flux-fyqnqkoqg49.forge.zehntech.com/`). "Issue Tags"/"Time Entry Tags"/"Project Tags" tab labels still untranslated (while "Allgemein" is correctly German); the "Delete" link and the custom Delete Tag confirm modal ("Delete Tag" / "Are you sure you want to delete this tag?" / "Cancel"/"Delete") remain entirely untranslated. **Reproduces identically.**

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, per user: branch updated) under **both Standard and Lotus themes**. All 3 tab labels now read "Ticket-Markierungen"/"Zeitbuchungs-Markierungen"/"Projekt-Markierungen" (German); the row's "Löschen" link and the confirm modal ("Markierung löschen" / "Möchten Sie diese Markierung wirklich löschen?" / "Abbrechen"/"Löschen") are fully translated; the success flash now reads "Markierung erfolgreich gelöscht". **FIXED** under both themes.

## Duplicate check

- Duplicate found: No (related to but distinct from BUG-TAG-003, which is a code-level title-corruption bug on the same page rather than a missing-translation issue)
- Existing bug reference (if duplicate): N/A
