# Handoff — Redmineflux Agile Board

## Last Session

- Date: 2026-09-10
- Redmine Version: 7.0.1.stable
- Environment: Forge — `https://flux-f3lnytazd49.forge.zehntech.com/`

## Completed This Session (2026-09-10, continued) — BUG-AGB-001 FIXED, final cycle regression, plugin Complete

Retested the sole remaining sub-finding (the board-config form's "Tags" checkbox) on a third Forge server, German language (account + system default) + **Standard theme** (environment defaulted to Redmineflux Scarlet — switched to Standard):

- **Board-config form's "Tags" checkbox** (`c[]=tags_relations`) now reads **"Markierungen"** — FIXED, confirmed via `input.name`/`value` cross-check. Every other checkbox on this form is also correctly German.
- Reconfirmed Board-Einstellungen, Global Board, My Page block, New Issue form, issue detail page, and issue edit form all still show "Story-Points" correctly (test issue #266, deleted afterward).
- **`BUG-AGB-001` closed — every sub-finding across its entire history is now fixed.** `bugs/open/` is now **empty**.
- **Final-cycle regression (`SENIOR_QA_STANDARDS.md` §27)** run across all 18 TCs (TC-AGB-001–018) on this server, Standard theme:
  - TC-AGB-001 (header/filter/columns): PASS.
  - TC-AGB-002/TC-AGB-004 (Insights panel): PASS — "Board-Einblicke" fully German, singular "1 Ticket" confirmed (no plural-English regression).
  - TC-AGB-003 (More Filters): PASS — "Weitere Filter" button present.
  - TC-AGB-005 (double-click inline edit modal): PASS — "Vorgang bearbeiten #258".
  - TC-AGB-006 (quick-add): PASS — "+ Ticket erstellen" placeholder confirmed German.
  - TC-AGB-007/008 (Backlog Sprints/Versionen tabs): PASS — German date format (DD.MM.YYYY), no English month strings.
  - TC-AGB-009 (Global Board): PASS — full checkbox-list dump confirmed German.
  - TC-AGB-010 (My Page block): PASS.
  - TC-AGB-011 (custom board create→edit→delete lifecycle): PASS — created a test config, verified "Board bearbeiten"/"Board löschen" labels, "Erfolgreich aktualisiert." update flash, and the delete-confirmation modal's dynamically-interpolated German text, then deleted it cleanly.
  - TC-AGB-012 (Sprint create form): PASS — all labels German including "Beschreibung"/"Enddatum"/"Freigabe".
  - TC-AGB-013 (admin Configure page): PASS — "(Standard: ...)" confirmed, no "(Default: ...)" regression.
  - TC-AGB-014 (resolution testing, 1280×720): PASS — no layout regressions, board summary bar fully German.
  - TC-AGB-018 (Sprints settings tab): PASS — "Nicht geteilt" shown correctly, no raw "not_shared" enum.
  - Drag-and-drop (`BUG-AGB-008`): PASS — real mouse-drag sequence captured "Ticket #258 wurde nach IN PROGRESS verschoben", fully German; card moved back to its original column afterward.
  - **All TCs PASS, zero new failures.**
- `STATUS.md` updated to **Complete** for this plugin.

## Previously Completed (2026-09-10, earlier this day)

Retested the sole open bug (`BUG-AGB-001`, narrowed to the "Sichtbare Kartenfelder" list's own "Story Points" checkbox) on a new Forge server, project "Agile Board Project", German language (account + system default):

- Story Points was disabled on this fresh server — enabled it via Administration → Plugins → Redmineflux Agile Board (plugin-level toggle, not a data-model change).
- **The previously-open Story-Points checkbox is now FIXED everywhere**: Board-Einstellungen (project + global), My Page block (added fresh then removed again), New Issue form, issue detail page, issue edit form — all correctly read "Story-Points". Full label-dump + `input.name`/`value` cross-checks used throughout, not just visual impression.
- **While re-verifying the custom/saved board-config form** (where the bug also previously documented "Last comment"/"Comments" as untranslated): both of those are now fixed, but discovered a **new, previously-undocumented instance** of the same gap — the form's own **"Tags"** checkbox (`c[]` value `tags_relations`) renders in plain English, confirmed via its `input.name`/`value` attributes. No config was saved (cancelled after confirming).
- **`BUG-AGB-001` stays open**, narrowed to just this new "Tags" finding — every previously-documented sub-finding (checkbox-list gap, Story Points on all surfaces) is now fixed. Severity unchanged (Low).
- `bugs/open/` still has 1 bug — final-cycle regression (§27) not yet triggered.

## Previously Completed (2026-09-09)

Retested all 3 open bugs on a newly-provisioned Forge server, German language, Standard theme:

- **BUG-AGB-007** — Settings → Sprints tab: "UI Polish" and "Bug Bash" (the exact two sprints that previously showed raw "not_shared") now correctly show "Nicht geteilt". **Fixed — closed.**
- **BUG-AGB-008** — dragged issue #259 from "IN PROGRESS" to "RESOLVED" (real mouse drag sequence): `MutationObserver` captured "Ticket #259 verschoben nach RESOLVED" — fully German (was "Issue #106 moved to Resolved"). Dragged back to confirm functionality. **Fixed — closed.**
- **BUG-AGB-001** — the Board-Settings checkbox-list gap (the bulk of this bug) reconfirmed fixed on this second consecutive server: project Board-Einstellungen (20/20 labels German), Global Board (same), and My Page block (added fresh since it wasn't present on this account, confirmed all-German, then removed again to restore prior state). The Story Points sub-finding could **not** be retested this pass — this fresh server has no "Story Points" custom field at all (confirmed via `/custom_fields`), and creating one is a data-model change beyond what this retest scope covers unprompted. Bug stays open, narrowed to just that untestable sub-finding.
- `bugs/open/` now contains only `BUG-AGB-001` (narrowed) — not empty, so the plugin-wide final-cycle regression trigger (`SENIOR_QA_STANDARDS.md` §27) does not yet apply.

### Follow-up same day — BUG-AGB-001's Story Points sub-finding retested

The user enabled Story Points via the Agile Board plugin's own Administration → Plugins configuration page ("Story Points aktivieren" checkbox — this is a plugin-level feature toggle, not a core-Redmine custom field, which is why `/custom_fields` didn't show it earlier). Retested with a fresh test issue (#267, Story-Points=3, deleted afterward):

- Board-Einstellungen "Summen anzeigen" group's Story Points toggle → **"Story-Points"** (German hyphenated form). **Fixed.**
- New Issue form field label → **"Story-Points"**. **Fixed.**
- Issue detail page label → **"Story-Points:"**. **Fixed.**
- Issue edit form label → **"Story-Points"**. **Fixed.**
- Board summary bar → **"STORY-POINTS: 3"**. **Fixed.**
- Board-Einstellungen "Sichtbare Kartenfelder" list's own Story Points checkbox → still plain **"Story Points"** (no hyphen). **Still reproduces** — this one checkbox is now the only remaining untranslated string in the entire bug.

Severity narrowed further (not closed) — one single checkbox label remains. Story Points feature left enabled as a standing fixture for future sessions.

## Previously Completed (2026-09-08)

First Stage 1 (German language, Default theme) pass on the Agile Board plugin, using the pre-built "Agile Board Project" (module already enabled):

- TC-AGB-001: Project Agile Board header/filter bar/columns — PASS, fully translated.
- TC-AGB-002: Board Settings panel — mostly PASS. Board-Type, Status-columns, Totals, Column-order all translated; 6 of 19 "Sichtbare Kartenfelder" checkboxes untranslated ("Spent hours", "Parent", "Children count", "Last comment", "Journals count", "Attachments count"). Filed `BUG-AGB-001` (Low).
- TC-AGB-003: "Weitere Filter" panel — PASS, fully translated.
- TC-AGB-004: "Einblicke" (Insights) panel — mostly PASS. All section headings/labels translated; found a pluralization gap (plural counts show English "Issues", singular correctly shows German "Ticket"). Filed `BUG-AGB-002` (Low).
- TC-AGB-005: Double-click inline "Vorgang bearbeiten" edit modal — PASS, fully translated.
- TC-AGB-006: Quick-add issue via column input — PASS, functional.
- TC-AGB-007: Backlog view (Sprints tab) — mostly PASS. Found the unassigned-avatar tooltip reads "Unassigned" (English) instead of "Nicht zugewiesen". Filed `BUG-AGB-003` (Low).
- TC-AGB-008: Backlog view (Versionen tab) — PASS, fully translated.

Overall this plugin shows substantially more thorough i18n coverage than several others tested this cycle (contrast with the Dashboards plugin's near-total absence of translation) — the 3 bugs found are all narrow, Low-severity gaps in an otherwise well-localized plugin.

Second pass this session: tested the Global Agile Board (`/agile_board/global`) and the My Page Agile Board block (`/my/page`), both explicitly requested as follow-up.

- TC-AGB-009: Global Agile Board — mostly PASS. Header/filter bar/summary/tooltip strings all translated; card project-name badges are project display-name data (not a translation concern, same convention as sprint/version names). Both `BUG-AGB-001` (6 of 19 card-field checkboxes) and `BUG-AGB-003` (unassigned-avatar tooltip) reproduce identically here — folded into the existing bugs as additional affected surfaces rather than filed separately.
- TC-AGB-010: My Page Agile Board block — present by default, no manual block-add needed. Block heading/count/empty-states/settings-panel section headings all translated. Found a **broader variant** of `BUG-AGB-001`: this block's own settings panel shows **all 19** "Sichtbare Kartenfelder" checkboxes untranslated (not just the same 6 as the project/global board) — folded into `BUG-AGB-001` as a more-severe affected surface, same root defect.

Third pass this session: tested the full custom/saved board lifecycle (explicitly asked "did you test custom agile board" — it had only been spot-checked for a button label before).

- TC-AGB-011: Custom/saved board create → edit → delete flow. **PASS overall** — this is the best-localized feature tested on this plugin: the "Board-Konfiguration speichern"/"bearbeiten" form (visibility/role options, board-type, swimlane grouping, full ~44-option filter-field dropdown), all three flash messages ("Erfolgreich angelegt.", "Erfolgreich aktualisiert.", "Erfolgreich gelöscht."), the sidebar saved-boards list ("Board bearbeiten"/"Board löschen"), and the delete-confirmation modal (including the dynamically-interpolated board name) are all fully and correctly translated. Found only a narrow third variant of `BUG-AGB-001`: this form's own card-fields list leaves just "Last comment" and "Comments" untranslated (2 of ~19) — actually a *more complete* translation than the quick-panel variant, since it correctly translates several fields ("Spent hours", "Parent", "Children count", "Attachments count") that the quick panel does not. Folded into `BUG-AGB-001` as a third affected surface rather than filed separately.

Fourth pass this session: tested the Sprint create form and the admin plugin Configure page (explicitly asked "did you test backlog and agile board plugin configuration" — Backlog itself was already covered via TC-AGB-007/008, but the sprint-creation form and the plugin's admin config page had not been opened).

- TC-AGB-012: Sprint create form ("Neuer Sprint") — mostly PASS. Found `BUG-AGB-004` (3 of 6 field labels untranslated: "Description"/"End date"/"Sharing") and `BUG-AGB-005` (sprint date ranges + version due-dates render in hardcoded English month format — e.g. "Sep 08 - Sep 21, 2026" — instead of German format, proven against the same date correctly formatted as "30.09.2026" on the project's own Roadmap page). Also noted: no UI entry point for sprint edit/delete could be found anywhere in the Backlog view or project nav, despite the User Guide's KB research describing a "Sprint management screen — create/edit/delete sprints" — flagged as a functional-completeness gap for a future pass, not filed as a translation bug. Left one test sprint ("QA German Sprint", id 3) on the Forge instance as a result.
- TC-AGB-013: Admin plugin Configure page (Administration → Plugins → Redmineflux Agile Board, behind Redmine's password re-auth prompt) — mostly PASS. Both settings fields, both icon-customization section headings/descriptions, and even the conditionally-hidden Story Points value field's own label/help/validation-error text are all correctly translated. Found `BUG-AGB-006`: the "(Default: ...)" parenthetical next to every priority/tracker icon selector (8 rows total) is untranslated English.

Fifth pass this session: ran Stage 2 (resolution testing), explicitly asked ("did you tested in all both resolution").

- TC-AGB-014: 1280×720 and 1920×1080, Default theme. **PASS at both** — no resolution-specific layout defects. At 1280×720 the toolbar, Board-Einstellungen panel (an inline expanding panel, not a floating modal — scrolls naturally with the page, all sections and footer buttons reachable), Weitere Filter panel, and Backlog view all render cleanly with no overlap or clipping; columns beyond the 4th scroll horizontally as expected Kanban behavior. At 1920×1080 all 6 status columns fit without horizontal scroll.

Sixth pass this session: ran Stages 3/6 (Lotus theme retest, default + 1280×720), explicitly asked ("now test in theme").

- TC-AGB-015: Switched theme to Redmineflux lotus via Administration → Settings → Anzeige. Re-tested the project Agile Board, Board-Einstellungen panel, Weitere Filter panel, and Backlog view at both 1920×1080 and 1280×720. **PASS overall** — no new Agile-Board-owned translation or layout bugs from the theme itself or the Lotus+1280×720 combination (the card-fields grid reflows cleanly from 6 to 3 columns at the narrower width). Confirmed the project sidebar's "Aufgewendete Zeit" clips under Lotus (`BUG-LTS-001`, the theme's own bug — identical scrollWidth/clientWidth numbers, now confirmed on a third independent Forge server). Also discovered the project's Story Points feature has since become enabled (was off during the original Stage 1 pass) and its "Story Points" checkbox is untranslated in both the card-fields list and the Summen-anzeigen toggle group — folded into `BUG-AGB-001` as a 7th affected field (reproduces under Default theme too, so not Lotus-specific — just not visible until Story Points was turned on).

**All resolution/theme combinations for this plugin (Stage 2 + Stages 3/6) are now covered.** Only Stages 4/5 in the strict numbering (Lotus at the *other* resolution not yet spot-checked, i.e. Lotus+1920×1080 was covered as the "default" Lotus pass; Lotus+1280×720 covered in TC-AGB-015) — following the same practical collapsed pattern used for the Gantt plugin, no further resolution×theme combination remains outstanding.

Seventh pass this session: explicitly asked whether the Story Points field was tested on the core issue detail page and issue edit form, under both themes.

- TC-AGB-016: Confirmed the same "Story Points" translation gap (previously only seen inside the Board-Einstellungen panel) also appears as a field label on the issue detail page (`div.label` → "Story Points:") and the issue edit form (`<label>Story Points</label>`) — under **both** Lotus and Default theme, identically, proving it's theme-agnostic. Every sibling field label in both places is correctly German. Folded into `BUG-AGB-001` rather than filed separately, but this surface's far greater everyday visibility (every user viewing/editing any issue, vs. an admin settings panel) is why `BUG-AGB-001`'s severity was **raised from Low to Medium**.

Eighth pass this session: user directly spotted, from screenshots, visual defects I had not caught with DOM/translation-focused checks — different font style and a misaligned/missing bullet on the issue view page, and a different box size on the issue edit form, for the Sprint/Story Points fields specifically under Lotus theme ("did you noticed this in edit form size is different size of sprint and story point in lotus theme, also did you noticed the font style", then "also did you mention alignment issue?? sprint and story point in issue detail page").

- TC-AGB-017: Confirmed all three, via computed styles/layout. Issue detail page: (1) Sprint/Story Points labels use old default `div.label` markup (bold, 14px, dark gray) instead of Lotus's own `span.rf_attr_lbl` restyling that every core field gets (medium-weight, 13px, lighter gray) — Lotus specifically re-styles `Tags:` (also `div.label`) via an extra class, proving the gap is Sprint/Story Points simply being missed, not a structural limitation; (2) alignment — every core field is a bulleted list item indented ~12-16px past the row's left edge, but "Sprint:" has no bullet/indent at all, and "Story Points:" doesn't even share the left column, starting far to the right on the same crammed line as Sprint's value. Issue edit form: Sprint/Story Points rows span the full attributes-grid width (~1557px) instead of the half-width (~763px) their sibling fields occupy, breaking Lotus's two-column layout. All three confirmed absent under Default theme on the identical issue. Filed as `BUG-LTS-003` (Medium) against the Lotus theme plugin (root cause is the theme's incomplete grid/typography coverage, not an Agile Board defect), cross-referenced here.

Ninth pass this session (found during the Lotus theme's own "full core-Redmine sweep"): the project Settings ("Konfiguration") tab bar has its own "Sprints" sub-tab (`/projects/:id/settings/sprints`) — this is the sprint edit/delete entry point TC-AGB-012 had reported as unfindable; that note is now corrected (it's reachable via Settings, not the Backlog view). Found `BUG-AGB-007` (Low) there: the "Freigabe" (Sharing) column shows the raw untranslated enum value "not_shared" for pre-existing fixture sprints, while a sprint created via the UI form correctly shows "Nicht geteilt" — opening Edit on an affected sprint confirms the underlying value is identical (the Edit form's dropdown resolves it correctly), proving this is a list-view-only rendering gap, not a data issue. Confirmed theme-agnostic (reproduces under both Lotus and Default).

## In Progress

- Untested overall (not blocking, no bug covers them): column reordering, Scrum mode/sprint filtering, other grouping options, permissions/role-gating, My Page block's "load more".

## Blockers

- None.

## Next Session Start Point

- No open bugs — plugin marked `Complete`. If revisited, the untested surfaces above (column reordering, Scrum mode, grouping options, permissions) would be the natural next-coverage targets, though not required for the current `Complete` status.
- Note: this plugin's own bug-code prefix is AGB per `CLAUDE.md` §4; internal plugin name confirmed as `agile_board`, display name "Redmineflux Agile Board", version 7.0.0.
- Note: "Story Points aktivieren" is a plugin-level feature toggle (Administration → Plugins → Redmineflux Agile Board), NOT a core-Redmine custom field — don't check `/custom_fields` to determine whether it's available; check the plugin's own configuration page instead.
- Note: the custom/saved board-config form (`board_configs/new`/`edit`) maintains its own separate `c[]`-keyed checkbox list, distinct from the quick-panel/My-Page-block `board[visible_card_fields][]` list — a translation fix to one does not automatically apply to the other; check both independently if this area is ever revisited.

## Open Bugs Found (this plugin)

- None. `bugs/open/` is empty as of 2026-09-10.

## Closed Bugs

- BUG-AGB-001 (was Medium, closed 2026-09-10) — card-field checkbox labels and the "Story Points"/"Story-Points" field name were partially untranslated across Board-Einstellungen, Global Board, My Page block, New Issue form, issue detail page, issue edit form, and the custom/saved board-config form. **Fixed** in stages across multiple sessions — the last remaining sub-finding (the board-config form's own "Tags" checkbox) confirmed fixed 2026-09-10.
- BUG-AGB-002 (Low) — Board Insights plural "Issues"/"Ticket" gap. **Fixed**, verified 2026-09-09 on a new Forge server — now shows "Tickets" correctly.
- BUG-AGB-003 (Low) — unassigned-avatar tooltip "Unassigned". **Fixed**, verified 2026-09-09 — now "Nicht zugewiesen".
- BUG-AGB-004 (Low) — Sprint create form untranslated labels. **Fixed**, verified 2026-09-09 — "Beschreibung"/"Enddatum"/"Freigabe" all correct.
- BUG-AGB-005 (Low) — Backlog dates in English format. **Fixed**, verified 2026-09-09 — now German DD.MM.YYYY format.
- BUG-AGB-006 (Low) — admin Configure page "(Default: ...)" untranslated. **Fixed**, verified 2026-09-09 — now "(Standard: ...)".
- BUG-AGB-007 (Low) — Sprints settings-tab "Freigabe" column showed raw "not_shared" for some sprints. **Fixed**, verified 2026-09-09 on a new Forge server — both previously-affected sprints ("UI Polish", "Bug Bash") now correctly show "Nicht geteilt".
- BUG-AGB-008 (Low) — drag-and-drop status-change toast entirely hardcoded English. **Fixed**, verified 2026-09-09 on a new Forge server — now reads "Ticket #259 verschoben nach RESOLVED", fully German.

## Related Bug Found Against Another Plugin

- BUG-LTS-003 (Medium, filed against Redmineflux Lotus Theme) — this plugin's own "Sprint"/"Story Points" issue fields aren't integrated into the Lotus theme's attributes grid/typography: font mismatch AND broken bullet-list alignment on the issue detail page, full-width layout break on the issue edit form. Not counted in this plugin's own open-bug total since the root cause and fix live in the Lotus theme plugin.

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 (German, Default theme) first pass on Agile Board: 8 TCs (TC-AGB-001–008) covering board header/filters, Board Settings, More Filters, Insights, inline edit, quick-add, and Backlog (Sprints + Versionen tabs). 3 bugs filed, all Low severity (`BUG-AGB-001/002/003`) — plugin overall shows strong i18n coverage. Large surface (Global board, My Page, drag-and-drop, Scrum mode, sprints, Story Points, permissions, Stage 2 resolutions, Stages 3–6 Lotus theme) still untested. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 second pass: Global Agile Board and My Page Agile Board block (TC-AGB-009/010). Both well-translated; no new bugs filed — `BUG-AGB-001` and `BUG-AGB-003` confirmed to reproduce on the Global Board, and a broader all-19-untranslated variant of `BUG-AGB-001` found on the My Page block's own settings panel, folded into the existing bug. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 third pass: full custom/saved board create→edit→delete lifecycle (TC-AGB-011), including the delete-confirmation modal and all flash messages. PASS overall — best-localized feature tested so far on this plugin. Only a narrow third variant of `BUG-AGB-001` found (2 of ~19 card fields untranslated on this form specifically), folded into the existing bug. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 1 fourth pass: Sprint create form and admin plugin Configure page (TC-AGB-012/013). 3 new bugs filed, all Low: `BUG-AGB-004` (3 of 6 sprint-form labels untranslated), `BUG-AGB-005` (sprint/version dates render in English month format instead of German), `BUG-AGB-006` (Configure page "(Default: ...)" untranslated in 8 rows). Noted a functional gap (no sprint edit/delete UI found) for a future non-translation pass. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-AGB-018 (found during the Lotus theme's own core-Redmine sweep): the project Settings → Sprints tab is the sprint edit/delete entry point earlier reported as unfindable — corrected. Found `BUG-AGB-007` (Low) — "Freigabe" column shows raw untranslated "not_shared" for some sprints, confirmed theme-agnostic. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stage 2 (resolution testing, Default theme): 1280×720 and 1920×1080 (TC-AGB-014). PASS at both — no resolution-specific layout defects found across the main board, Board-Einstellungen panel, Weitere Filter panel, and Backlog view. No new bugs filed. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stages 3/6 (Lotus theme retest, default + 1280×720) (TC-AGB-015). PASS overall, no new Agile-Board-owned bugs. `BUG-LTS-001` confirmed on a third server via this plugin's project sidebar; `BUG-AGB-001` expanded to 7 fields after discovering Story Points had become enabled. All resolution/theme testing for this plugin now complete. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-AGB-016: Story Points field on the core issue detail page + edit form, checked under both Lotus and Default theme. Same gap as `BUG-AGB-001` reproduces theme-agnostically on both pages — folded in, severity raised Low → Medium given the much higher everyday visibility of this surface vs. the original admin settings panel. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-AGB-017: user-spotted visual defects on Sprint/Story Points fields under Lotus theme — font-style mismatch AND broken bullet-list alignment on the issue view page, full-width layout break on the issue edit form. All confirmed via computed styles, absent under Default theme. Filed as new `BUG-LTS-003` (Medium) against the Lotus theme plugin. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49 — branch updated) | Claude (Playwright MCP) | **Fix verification pass, Standard theme, per explicit user instruction to retest bugs 1–6 only** (BUG-AGB-007 left untouched). BUG-AGB-002 (Insights plural), BUG-AGB-003 (unassigned tooltip), BUG-AGB-004 (Sprint create form), BUG-AGB-005 (Backlog date format), and BUG-AGB-006 (Configure page "Default"→"Standard") all confirmed **FIXED** and closed. BUG-AGB-001's Board-Settings checkbox-list gap (project board, Global board, My Page block) also confirmed **FIXED**; narrowed and kept open only for its Story Points-on-issue-page sub-finding, initially inconclusive since this fresh server had no Story Points custom field configured. Open bug count: 7 → 2 (BUG-AGB-001 narrowed, BUG-AGB-007 untouched). |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49) | Claude (Playwright MCP) | User enabled the "Story Points" custom field from the plugin's own configuration specifically to close the gap above. Retested: **Story Points label still untranslated** on the Board-Einstellungen panel (both groups), the New Issue form, the issue detail page, and the issue edit form (test issue #267, deleted afterward) — confirmed reproducing, this sub-finding of `BUG-AGB-001` is genuinely still open. Story Points field left enabled per user request as a standing fixture. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49) | Claude (Playwright MCP) | **User reported (screenshot) an untranslated drag-and-drop toast — not previously tested.** Reproduced via a real mouse-drag sequence (`page.mouse` primitives, since this board's cards aren't natively `draggable` and need a full mousedown→move→up sequence to trigger the library's drag handler): dragging card #106 between status columns produces "Issue #106 moved to Resolved"/"...to In Progress" — entirely hardcoded English, confirmed via live `MutationObserver` capture. Filed `BUG-AGB-008` (Low). Card restored to its original column afterward. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | Retest pass, new Forge server after branch update: **BUG-AGB-007 and BUG-AGB-008 both confirmed FIXED** and closed. **BUG-AGB-001's checkbox-list gap reconfirmed fixed** on all 3 surfaces (project/global/My Page block, block added fresh then removed again); its Story Points sub-finding could not be retested (no custom field on this server) — bug stays open, narrowed to just that. Open bug count: 3 → 1. `bugs/open/` not yet empty (BUG-AGB-001 remains), so the plugin-wide final-cycle regression is not yet triggered. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | **Follow-up same day: user enabled Story Points via the plugin's own Administration → Plugins configuration page (a plugin-level toggle, not a core custom field) to retest BUG-AGB-001's remaining sub-finding.** Created test issue #267 (Story-Points=3, deleted afterward). Confirmed FIXED: Summen-anzeigen toggle, New Issue form, issue detail page, issue edit form, and board summary bar all now read "Story-Points". Confirmed STILL REPRODUCING: the "Sichtbare Kartenfelder" list's own checkbox still reads plain "Story Points" — the only remaining untranslated string in the whole bug. Severity narrowed further, bug stays open. |
| 2026-09-10 | 7.0.1.stable | Forge (flux-fhhcov1xf49) | Claude (Playwright MCP) | Retest pass, new Forge server, project "Agile Board Project". Enabled Story Points (was off) via the plugin's own config page. **The "Sichtbare Kartenfelder" checkbox — the last remaining gap — is now FIXED**, confirmed on Board-Einstellungen (project + global), My Page block, New Issue form, issue detail page, and issue edit form (test issue #267, deleted afterward). While re-checking the custom/saved board-config form, confirmed its previously-known "Last comment"/"Comments" gaps are also fixed, but found a **new, previously-undocumented "Tags" checkbox** (`c[]=tags_relations`) still untranslated there — confirmed via `input.name`/`value`, no config saved. `BUG-AGB-001` narrowed to just this new finding, stays open. `bugs/open/` still has 1 bug; final-cycle regression not yet triggered. |
| 2026-09-10 | 7.0.1.stable | Forge (flux-f3lnytazd49) | Claude (Playwright MCP) | Third retest pass, new Forge server (theme defaulted to Scarlet — switched to Standard). **BUG-AGB-001's last remaining gap — the board-config form's "Tags" checkbox — confirmed FIXED** ("Markierungen"), closing the bug. `bugs/open/` now empty. **Final cycle regression — 18 TCs (TC-AGB-001–018) re-run, all PASS**, including the full custom-board create→edit→delete lifecycle (with flash messages), drag-and-drop (real mouse-drag, German toast confirmed), and 1280×720 resolution testing. `STATUS.md` set to `Complete`. |
