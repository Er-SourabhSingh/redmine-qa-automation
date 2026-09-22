# Handoff — Redmineflux Tags plugin

## Last Session

- Date: 2026-09-09
- Redmine Version: 7.0.1.stable
- Environment: Forge — `https://flux-fdrk6suoj49.forge.zehntech.com/` (the prior session's server, `flux-frtsiofsm49`, has since expired)

## Completed This Session (2026-09-09)

Retested `BUG-TAG-007` (the only open bug) on a newly-provisioned Forge server, German language, Standard theme:

- Created test issue #266 (Agile Board Project) with a tag. DOM inspection confirms the field now uses the standard paired markup — `<div class="tags attribute"><div class="label tag_label">...</div>...</div>` — with a genuine `.attribute` wrapper (previously absent). Bounding boxes confirm the label, tag chip, and "Hinzufügen" trigger all sit on the same row now, matching every sibling field, in both view mode and edit mode (clicking "Hinzufügen" keeps the widget inline instead of dropping to a new line). **Fixed — closed.**
- **`bugs/open/` is now empty for this plugin — all 7 bugs closed.** Per `SENIOR_QA_STANDARDS.md` §27, ran the full final-cycle regression across every TC in `TAGS_GERMAN_LANGUAGE.md` (9 TCs) on this same server before considering `Complete`:
  - TC-TAG-019 (tag input placeholder) — PASS, "Markierungen hinzufügen" now German.
  - TC-TAG-020 (Tag list field, 6 forms: New/Edit Project, New/Edit Issue, New/Edit Spent Time) — PASS on all 6, "Markierungsliste" label + German placeholder everywhere.
  - TC-TAG-021 (admin page title) — PASS, clean title `Redmineflux Tags plugin - Plugins - Konfiguration - Markierungen - Redmine`, no raw hash literal, checked on all 4 tabs.
  - TC-TAG-022 (admin Manage Tags list/tabs/Edit form/delete modal/success message) — PASS across the board: tab labels ("Ticket-/Zeitbuchungs-/Projekt-Markierungen"), "Farbige Markierung verwenden" checkbox, pagination ("Seiten:"), Edit Tag form ("Markierung bearbeiten: ...", "Name der Markierung"), delete confirmation modal ("Markierung löschen" / "Möchten Sie diese Markierung wirklich löschen?"), and delete success flash ("Markierung erfolgreich gelöscht") — all fully German now.
  - TC-TAG-023 (Issues list Tags filter/column) — PASS (still passing; filter option now shows "Markierungen" instead of the "Tags" loanword, an improvement not a regression).
  - TC-TAG-024 (critical: individual Delete link scoped to only its own tag) — **PASS, confirmed at the network-request level**: created `testkeepme2`/`testdeleteme2`, checked both rows' checkboxes, clicked only `testdeleteme2`'s own Delete link — the actual DELETE request body was `tag_ids[]=3` (only that tag's id), and only that tag was removed; `testkeepme2` and the other existing tag survived. The Critical data-loss bug is genuinely fixed, not just cosmetically.
  - TC-TAG-025/008 (resolution 1280×720 / 1920×1080) — PASS at both, re-checked on issue detail (Markierungen field, now inline) and the admin Manage Tags table — no overflow/clipping/overlap at either width.
  - TC-TAG-027 (Tags widget vs. Agile Board Sprint/Story Points overlap) — Story Points custom field not enabled on this fresh server so the original exact overlap scenario couldn't be replicated field-for-field, but bounding boxes confirm the Tags field's own `.attribute` row (y 424–454) sits cleanly below the Sprint row (y 399–424) with zero overlap — structurally consistent with the fix, since Tags no longer floats outside normal document flow.
  - **Zero new failures.** Final cycle regression — 1 suite / 9 TCs re-run, all PASS.
- Test fixtures (`testkeepme2`, `retesttagalignment` tags, the extra time entry) cleaned up after verification; issue #266 itself left in place as evidence (matches prior sessions' convention).

## Previously Completed (2026-09-07)

Full Stage 1 (German language, Default theme) sweep of the Tag Plugin across every surface identified (official KB + user-provided list):

- Issue detail Tags widget (TC-TAG-019) — FAIL, BUG-TAG-001
- New/Edit Project, New/Edit Issue, New/Edit Spent Time "Tag list" field (TC-TAG-020) — FAIL, BUG-TAG-002
- Admin Tag configuration page title (TC-TAG-021) — FAIL, BUG-TAG-003 (code-level bug, raw hash in `<title>`)
- Admin Manage Tags list/tabs/Edit Tag form (TC-TAG-022) — FAIL, BUG-TAG-004
- Issues list + Spent Time list Tags column/filter, click-tag-to-filter (TC-TAG-023) — PASS

4 bugs filed total (BUG-TAG-001 through BUG-TAG-004). Follow-up deep dive on the admin Manage Tags page per user direction: confirmed the Delete confirmation modal (custom HTML, not native `confirm()`) is 100% untranslated ("Delete Tag" / "Are you sure..." / Cancel / Delete), the delete success flash "Tag deleted successfully" is untranslated, and — more seriously — deleting a deliberately nonexistent tag ID still returns a false "success" message rather than the "Tag not found" error (folded into BUG-TAG-003 as a data-integrity concern). Also confirmed all 3 tag-type tabs (Issue/Time Entry/Project Tags) share the identical untranslated pattern using real tags created on each. Separately, tested the row's `hascontextmenu` markup for a right-click bulk-delete menu (per user question) — no context menu ever appears (tested via both synthetic and native `contextmenu` DOM events); flagged as a functional observation, not filed as a formal bug since it's outside this cycle's language-testing scope pending user direction.

**Critical follow-up (same session, prompted by user reviewing screenshots):** while re-verifying the delete flow, discovered `BUG-TAG-005` — clicking a single tag row's own "Delete" link, when other rows are checkbox-selected, deletes ALL checkbox-selected tags, not just the one whose Delete link was clicked, despite each link's `onclick` handler correctly referencing its own distinct tag id. Reproduced twice with controlled tag pairs (`testdeleteme`+`testkeepme`, and earlier `qagermantwo`+`qagermanthree`). This is a genuine, silent, irreversible data-loss bug (Critical severity) — not a translation defect — and retroactively explains the "false success for nonexistent ID" observation in BUG-TAG-003 (real checked tags were likely being deleted in the background even then).

## In Progress

- Not yet tested: the tag default-color picker control itself (setting exists, "Use colored tag" checkbox seen, but the color picker UI itself not opened); a complete multi-row bulk-delete confirmation flow (button's untranslated text confirmed in DOM, full flow not exercised).
- The "false success for nonexistent tag ID" edge case (originally folded into `BUG-TAG-003`) was not specifically re-verified this session — low priority, not itself a distinctly filed bug.
- TC-TAG-027's overlap scenario couldn't be replicated field-for-field (Story Points custom field not enabled on this server) — confirmed structurally sound instead (see this session's regression notes above).

## Blockers

- None.

## Next Session Start Point

- All bugs closed and final-cycle regression passed with zero new failures (2026-09-09) — `STATUS.md` for this plugin can now be set to `Complete`.
- If a future session re-opens testing (new server, new feature scope), start by reconfirming all 7 closed bugs are still fixed before extending coverage, per this plugin's established pattern of servers expiring between sessions.

## Open Bugs Found

- None. `bugs/open/` is empty.

## Closed Bugs

- BUG-TAG-001 (Low) — issue-detail widget placeholder. **Fixed**, verified 2026-09-08 on a new Forge server under both Standard and Lotus themes.
- BUG-TAG-002 (Medium) — "Tag list" field label/placeholder, 6 forms. **Fixed**, verified 2026-09-08 under both Standard and Lotus themes.
- BUG-TAG-003 (High) — broken admin page title (raw hash literal). **Fixed**, verified 2026-09-08 under both Standard and Lotus themes.
- BUG-TAG-004 (Medium) — admin Manage Tags UI mostly untranslated. **Fixed**, verified 2026-09-08 under both Standard and Lotus themes.
- BUG-TAG-005 (Critical) — individual tag Delete link deleted the wrong tag (data-loss bug). **Fixed**, verified 2026-09-08 under both Standard and Lotus themes — the delete action now correctly targets only the clicked tag's id regardless of other rows' checkbox state.
- BUG-TAG-006 (High) — "Add Tags" widget overlapping Agile Board's Sprint/Story Points row. **Fixed under Standard theme**, verified 2026-09-08 once the user enabled the missing Story Points custom field on the retest server. Still reproduces under Lotus theme, but that reproduction has been root-caused to the Lotus theme's own known grid-integration gap (`BUG-LTS-003`, filed against `redmineflux_lotus`) and folded into that bug instead — closed here as this plugin's own bug is genuinely fixed.
- BUG-TAG-007 (Medium) — "Markierungen:" field's "Hinzufügen" trigger/edit widget not aligned inline with the label under Standard theme (missing `.attribute` wrapper markup). **Fixed**, verified 2026-09-09 on a new Forge server — the field now uses the standard paired markup and renders inline in both view and edit mode.

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-07 | 7.0.1.stable | Forge (flux-fczk00paf49) | Claude (Playwright MCP) | Stage 1 (German, Default theme) full sweep, 6 TCs (TC-TAG-019–006), 5 FAIL / 1 PASS, 5 bugs filed (incl. Critical data-loss bug BUG-TAG-005). |
| 2026-09-08 | 7.0.1.stable | Forge (flux-fyqnqkoqg49 — fresh, no prior projects) | Claude (Playwright MCP) | Reconfirmation pass, Default theme only (Story Points custom field absent so BUG-TAG-006 inconclusive) — BUG-TAG-001 through 005 all still reproduced identically (BUG-TAG-005's exact manifestation differed slightly: this time the checkbox-selected tag was deleted instead of both). Test project/issue created and cleaned up. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frtsiofsm49 — branch updated per user) | Claude (Playwright MCP) | **Fix verification pass, Standard and Lotus themes only** (per explicit user instruction). All 5 reproducible bugs (BUG-TAG-001–005) now **PASS/FIXED** under both themes: tag-widget placeholder, New Issue "Tag list" field, admin page title, tab labels + delete modal, and the critical delete-wrong-tag data-loss bug are all resolved. BUG-TAG-006 still not validly retestable (Story Points custom field doesn't exist on this fresh server either). 5 bugs moved from `bugs/open/` to `bugs/closed/`. Test project/issues created and cleaned up each pass; theme reverted to Standard at session end. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frtsiofsm49) | Claude (Playwright MCP) | **BUG-TAG-006 finally retestable** — user enabled the missing "Story Points" custom field on "Agile Board Project". Retested issue #260 under both themes: **Standard theme FIXED** (tag editor renders cleanly below Sprint/Story Points, confirmed via bounding boxes + screenshot); **Lotus theme still overlaps** "Story Points:" completely, but root-caused to the same layout gap as the Lotus theme's own `BUG-LTS-003` (Sprint/Story Points render outside Lotus's attributes grid) — folded into that bug instead of kept open here. BUG-TAG-006 closed. **`bugs/open/` is now empty — all 6 Tag plugin bugs closed.** Full final-cycle regression (§27) still required before `STATUS.md` can be set to `Complete`. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frtsiofsm49) | Claude (Playwright MCP) | **New bug found via direct user observation/screenshots** (user pointed out the Markierungen field's "add" button and edit widget looked misaligned) — filed `BUG-TAG-007` (Medium). Confirmed live: under Standard theme, the "Hinzufügen" trigger sits detached far to the page's right edge instead of next to the tag chips, and the edit widget drops to a new line below the label instead of sitting inline like every sibling field (`Sprint:`, `Priorität:`, etc.). Root-caused via DOM: the field is missing the standard `.attribute` label+value wrapper markup every other field uses. Confirmed this does NOT reproduce under Lotus theme (its own stylesheet independently keeps the field inline). `bugs/open/` no longer empty — final-cycle regression still pending until this is also fixed and closed. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | **BUG-TAG-007 retested and confirmed FIXED** — field now uses the standard `.attribute` wrapper, renders inline in view and edit mode. Closed. `bugs/open/` now empty (all 7 bugs closed) — ran the required full final-cycle regression (§27): all 9 TCs in `TAGS_GERMAN_LANGUAGE.md` re-executed on this server, **zero new failures**, including a network-level confirmation that the Critical delete-scoping fix (BUG-TAG-005) holds (DELETE request body correctly scoped to only the clicked tag's id). Test fixtures cleaned up. Plugin is now eligible for `STATUS.md` = `Complete`. |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/tag-plugin/ and 88 functional, negative and permission test cases written across 5 new suites (TC-TAG-028 onward): TAGS_INSTALLATION_CONFIGURATION, TAG_ASSIGNMENT, TAG_ADMINISTRATION, FILTERS_COLUMNS_SEARCH, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-TAG-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
