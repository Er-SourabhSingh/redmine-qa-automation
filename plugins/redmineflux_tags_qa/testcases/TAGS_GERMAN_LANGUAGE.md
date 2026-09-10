# Test Cases — Redmineflux Tags plugin — German Language Compatibility

> Scope: verify the Tags plugin's own UI (issue detail "Tags" widget, list filter) renders fully in German. Stage 1 of the multi-stage German/Lotus compatibility QA pass — Default Redmine theme, German language.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch).
- Active theme: Default (core Redmine).
- Redmine 7.0.1.stable, flux_tags 7.0.0.

---

### TC-TAG-001 — Issue detail "Tags" inline add widget fully translated in German

**Steps**

1. Log in as admin, confirm German language + Default theme active.
2. Open any issue detail page (e.g. `/issues/230`).
3. Click "Hinzufügen" (Add) next to the "Tags:" field to open the inline tag-input widget.
4. Inspect the tag input's placeholder text and the widget's Save/Cancel buttons.

**Expected Result**

- The tag input placeholder and every control in the widget render in German, consistent with the widget's own Save/Cancel buttons ("Speichern"/"Abbrechen") which are correctly translated.

**Actual Result — FAIL**

- The visible tag-input placeholder reads **"Add Tags"** (English), confirmed both in the accessibility tree (`textbox "Add Tags"`) and the DOM (`input.ui-autocomplete-input[placeholder="Add Tags"]`), while the two buttons immediately next to it in the same widget are correctly translated ("Speichern", "Abbrechen").
- A second, hidden backing field for the same widget (`input.tagit-hidden-field`) also carries an untranslated placeholder, **"+ add tag"** (lower priority — not visible to the user, but confirms the string is hardcoded at the same source rather than being an isolated render glitch).

**Verdict:** FAIL — filed as `BUG-TAG-001`.

**Evidence:** `screenshots/BUG-TAG-001/tag-input-untranslated-placeholder.png`

---

### TC-TAG-002 — "Tag list" field fully translated on New/Edit Project, New/Edit Issue, New/Edit Spent Time forms

**Steps**

1. Log in as admin, confirm German language + Default theme active.
2. Visit `/projects/new`, `/projects/defaultsd/settings`, `/projects/defaultsd/issues/new`, `/issues/230/edit`, `/issues/230/time_entries/new`, and an existing `/time_entries/:id/edit`.
3. On each, locate the "Tag list" field near the bottom of the form and inspect its label and placeholder.

**Expected Result**

- Label and placeholder render in German on every form, consistent with every other field label on the same form (all correctly translated).

**Actual Result — FAIL**

- All 6 forms show the identical untranslated label **"Tag list"** and an untranslated placeholder (**"Select or add tags"** on the two Project forms, **"Add Tags"** on the four Issue/Spent-Time forms).

**Verdict:** FAIL — filed as `BUG-TAG-002`.

**Evidence:** `screenshots/BUG-TAG-002/new-project-tag-list-untranslated.png`

---

### TC-TAG-003 — Admin Tag configuration page title renders correctly

**Steps**

1. Log in as admin, confirm German language active.
2. Navigate to Administration > Plugins > Redmineflux Tags plugin (`/settings/plugin/flux_tags`), re-confirm password when prompted.
3. Check `document.title` on the `general`, `issue`, `time_entry`, and `project` tabs.

**Expected Result**

- A clean, readable page title in every case.

**Actual Result — FAIL**

- Every tab's title reads: `Redmineflux Tags plugin - Plugins - Konfiguration - {delete_success: "Tag deleted successfully", delete_failure: "Tag not found"} - Redmine` — a raw, unresolved hash literal leaking into the title.

**Verdict:** FAIL — filed as `BUG-TAG-003` (code-level defect, not a translation gap).

**Evidence:** DOM-verified via `document.title`; see `screenshots/BUG-TAG-004/admin-tag-list-untranslated.png` for page context.

---

### TC-TAG-004 — Admin "Manage Tags" list, tabs, and Edit Tag form fully translated

**Steps**

1. Log in as admin, confirm German language active. Ensure at least one tag exists (created `qagermantest` on issue #230 for this test).
2. Navigate to `/settings/plugin/flux_tags?tab=issue`.
3. Inspect the tab bar, the "Use colored tag" checkbox (General tab), the tag row's action links, the pagination area, and the bulk-delete button (select a row checkbox).
4. Click "Bearbeiten" on a tag row → inspect `/tags/:id/edit`.

**Expected Result**

- Every string in German, consistent with the correctly-translated sibling controls on the same pages ("Allgemein", "Bearbeiten", "Anwenden", "Alles auswählen/Alles abwählen", "Speichern").

**Actual Result — FAIL**

- Tab labels "Issue Tags"/"Time Entry Tags"/"Project Tags" — untranslated.
- "Use colored tag" checkbox — untranslated.
- Per-row "Delete" link and the bulk-delete "Delete" button — untranslated.
- Pagination "Pages:" label — untranslated (confirmed NOT a core Redmine string; core's own paginator on the Issues list shows no such label).
- Edit Tag form: heading "Edit Tag: qagermantest", label "Tag Name", and "Cancel" link — all untranslated; only "Speichern" is translated.

- Delete confirmation modal (custom HTML, not native `confirm()`): heading "Delete Tag", body "Are you sure you want to delete this tag?", "Cancel"/"Delete" buttons — 100% untranslated.
- Delete success flash message "Tag deleted successfully" — untranslated.
- Confirmed identical on all 3 tabs with real data: Issue Tags (`qagermanone`/`two`/`three`), Time Entry Tags (`qatimetag`), Project Tags (`qaprojecttag`).
- Separate functional observation (not language-related): triggering a real `contextmenu` DOM event on a multi-selected row produces no context menu at all, despite rows carrying a `hascontextmenu` CSS class — likely dead/copied markup, flagged for visibility only.
- Separate functional observation: confirming delete on a deliberately nonexistent tag ID (999999) still shows the "Tag deleted successfully" success message instead of "Tag not found" — folded into `BUG-TAG-003` since it shares that bug's root cause (the same delete-response hash).

**Verdict:** FAIL — filed as `BUG-TAG-004`.

**Evidence:** `screenshots/BUG-TAG-004/admin-tag-list-untranslated.png`, `screenshots/BUG-TAG-004/delete-confirm-modal-untranslated.png`, `screenshots/BUG-TAG-004/delete-success-message-untranslated.png`, `screenshots/BUG-TAG-004/edit-tag-form-untranslated.png`

---

### TC-TAG-005 — Issues list Tags column and filter correctly localized

**Steps**

1. On `/projects/defaultsd/issues`, open "Filter hinzufügen" and the column-options selector; check the "Tags" entries in both.
2. On `/projects/defaultsd/time_entries`, repeat for the Spent Time list.
3. Click a tag hyperlink from an issue's Tags field to confirm the resulting filtered list renders correctly.

**Expected Result / Actual Result — PASS**

- "Tags" filter option and "Tags" column option both render as "Tags" in both lists (a shared loanword in German — not a translation gap). Filter operators "ist"/"ist nicht" render correctly. Clicking a tag correctly navigates to a filtered issue list with no untranslated strings in the filter panel.

**Verdict:** PASS. No bugs found for this part of the surface.

---

### TC-TAG-006 — Individual tag Delete link is correctly scoped to only its own tag (functional, not language — filed per user direction after reviewing screenshots)

**Steps**

1. Create two distinct tags on an issue: `testkeepme` and `testdeleteme`.
2. On the admin Issue Tags tab, check **both** row checkboxes.
3. Confirm via DOM that each Delete link's `onclick` still references its own distinct tag id (`showCustomConfirm(10, 'issue')` for testdeleteme, `showCustomConfirm(9, 'issue')` for testkeepme).
4. Click only `testdeleteme`'s own "Delete" link (never touch `testkeepme`'s link or any bulk button).
5. Confirm the modal (singular wording: "Are you sure you want to delete this tag?").
6. Check whether `testkeepme` survives.

**Expected Result**

- Only `testdeleteme` is deleted; `testkeepme` remains, since only its checkbox was ticked (not clicked for deletion) and the confirmation dialog itself uses singular "this tag" wording.

**Actual Result — FAIL (Critical)**

- Both tags were deleted. The list is left completely empty ("Nichts anzuzeigen") after what was presented as a single-tag delete confirmation.

**Verdict:** FAIL — filed as `BUG-TAG-005` (Critical, functional data-loss bug, not a translation defect — flagged for visibility since it was found while investigating the German-language delete flow).

**Evidence:** `screenshots/BUG-TAG-005/both-tags-deleted-empty-state.png`

---

## Stage 2 — Resolution testing (1280×720 and 1920×1080), German + Default theme

> Note: the user's original instructions said "1980×1080"; there is no such standard resolution, so this was tested as 1920×1080 (Full HD) instead.

### TC-TAG-007 — Layout integrity at 1280×720

**Pages checked:** Issue detail (Tags widget open), New Project form, admin Manage Tags table (Project Tags tab), Delete confirmation modal.

**Result — PASS.** No horizontal overflow, no clipped text, no overlapping elements, modal renders centered and fully visible, table columns fit without wrapping. All previously-filed translation bugs (BUG-TAG-001/002/004) reproduce identically at this width — no new *layout* defects found.

### TC-TAG-008 — Layout integrity at 1920×1080

**Pages checked:** Same as above.

**Result — PASS.** Layout scales cleanly with the wider viewport, no new overflow/clipping/overlap issues. No new layout defects found at this resolution either.

**Conclusion:** the Tag Plugin's defects found in this cycle (BUG-TAG-001 through 005) are all translation/logic issues, not resolution-dependent layout issues — they reproduce identically regardless of viewport size.

---

### TC-TAG-009 — "Add Tags" widget does not overlap Agile Board's Sprint/Story Points fields (found via user-reported screenshot, initially missed)

**Steps**

1. Open an issue in a project with the Agile Board module enabled (e.g. `/issues/260`, "Agile Board Project" — has Sprint/Story Points fields, unlike "Software development5" used for earlier TCs).
2. Click "Hinzufügen" next to "Tags:".
3. Inspect whether the resulting tag-input widget collides with the "Sprint:"/"Story Points:" row directly below it.

**Expected Result**

- The tag widget should not obscure any other field's label, value, or controls.

**Actual Result — FAIL**

- The tag widget visually overlaps the "Story Points:" row. Confirmed via exact bounding boxes: tag widget `x:739–1320, y:435–493` vs. "Story Points:" row `x:665–1044, y:457–482` — genuine overlapping rectangles, not just adjacent. Both elements are in normal document flow; the Sprint/Story Points row simply never gets pushed down to make room.

**Verdict:** FAIL — filed as `BUG-TAG-006` (High, cross-plugin layout conflict with Agile Board). **Note:** this was initially missed because TC-TAG-001 tested on a project without Agile Board enabled — the user caught it from screenshots and it was reproduced and confirmed live afterward.

**Evidence:** `screenshots/BUG-TAG-006/tag-widget-overlaps-sprint-storypoints.png`
