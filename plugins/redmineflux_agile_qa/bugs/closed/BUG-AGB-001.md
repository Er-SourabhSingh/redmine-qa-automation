# BUG-AGB-001

- Bug ID: BUG-AGB-001
- Production Redmine Issue ID: 120169
- Severity: N/A — FIXED, closed 2026-09-10 (all sub-findings confirmed resolved: checkbox-list gap, Story-Points checkbox on all surfaces, and the board-config form's "Tags" checkbox)
- Title: [FIXED] Card-field checkbox labels across Board-Einstellungen/Global Board/My Page block/custom-board-config form, plus the "Story Points"/"Story-Points" field name on the New Issue form, issue detail page, and issue edit form, were partially untranslated — confirmed now fully German everywhere, including the last-remaining "Tags" checkbox on the board-config form
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Agile Board (agile_board)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- German language active (system default and account).
- A project with the Agile Board module enabled (confirmed "Agile Board Project" already had it enabled).

## Steps to reproduce

1. Open the project's "Agile Board" tab.
2. Click "Board-Einstellungen" (the vertical-ellipsis-adjacent gear button in the toolbar).
3. Inspect every checkbox label in the "Sichtbare Kartenfelder" (Visible card fields) group.

## Expected result

- Every card-field checkbox label should render in German, consistent with the 13 sibling labels in the exact same checkbox group that are already correctly translated ("Id", "Thema", "Tracker", "Priorität", "Zugewiesen an", "Autor", "Startdatum", "Abgabedatum", "Geschätzter Aufwand", "% erledigt", "Beschreibung", "Tags", "Kategorie", "Zielversion").

## Actual result

Confirmed via direct DOM query (`document.querySelectorAll('label')` filtered to checkbox labels, not just visual impression) that 6 of the 19 card-field checkboxes remain hardcoded English:

- **"Spent hours"** (should mirror "Aufgewendete Zeit", which is correctly translated elsewhere in this same settings panel's "Summen anzeigen" section)
- **"Parent"**
- **"Children count"**
- **"Last comment"**
- **"Journals count"**
- **"Attachments count"**

This is a genuine partial-i18n-coverage gap, not a documentation mismatch or session misconfiguration — proven by the 13 correctly-translated sibling checkboxes rendered in the identical list, at the same moment, under the same confirmed-German session.

## Severity rationale

Medium (raised from Low): originally scoped to a settings panel most users open infrequently — but the "Story Points" instance of this same gap (see below) also appears as a field label on the **core-Redmine issue detail page and issue edit form**, surfaces every German-speaking user visits constantly, not just an admin-configuration screen. All instances remain purely cosmetic (fields stay fully functional regardless of label language), so this stops short of High, but the everyday visibility of the issue-page instance is enough to move it up from the original Low.

## Additional affected surfaces

The "Sichtbare Kartenfelder" settings group is a shared component reused across all three board contexts, and the same underlying i18n gap reproduces in each — but the My Page block variant is noticeably worse:

- **Global Agile Board** (`/agile_board/global`, "Globale Board-Einstellungen" panel): identical to the project board — the same 6 of 19 checkboxes untranslated ("Spent hours", "Parent", "Children count", "Last comment", "Journals count", "Attachments count"), the other 13 correctly German. Confirmed 2026-09-08 via the same DOM-query method.
- **My Page Agile Board block** (`/my/page`, "Board-Einstellungen" panel on the block): **all 19** of the "Sichtbare Kartenfelder" checkbox labels are untranslated English ("Id", "Subject", "Tracker", "Priority", "Assigned to", "Author", "Start date", "Due date", "Estimated hours", "Spent hours", "Done ratio", "Parent", "Children count", "Description", "Last comment", "Tags", "Category", "Fixed version", "Journals count", "Attachments count") — none of the 13 labels that are correctly translated on the project/global board (e.g. "Id" → "Id", "Subject" → "Thema", "Tracker" → "Tracker", "Priority" → "Priorität") carry their German text here. The group heading itself ("SICHTBARE KARTENFELDER") and the other settings sections ("SICHTBARE STATUSSPALTEN", "SUMMEN ANZEIGEN", "SPALTENREIHENFOLGE", "Einstellungen anwenden"/"Abbrechen") remain correctly translated on this same panel — so this is scoped specifically to the card-field checkbox labels, confirmed via `document.querySelectorAll('label')` against the panel opened from the My Page block. Confirmed 2026-09-08.
- **Story Points field, discovered during Lotus-theme retest** (confirmed 2026-09-08): the project's Story Points feature was found enabled (not observed in the original Stage 1 pass, when it was presumably still off) — its "Story Points" checkbox is untranslated English in **both** places it appears: the "Sichtbare Kartenfelder" list (alongside the other 6 known-untranslated fields) and the separate "Summen anzeigen" toggle group (where it joins the correctly-translated "Geschätzte Zeit"/"Aufgewendete Zeit" toggles). Confirmed via `document.querySelectorAll('label')` on the project board's own Board-Einstellungen panel under the Lotus theme — reproduces identically regardless of theme, so this is a language gap, not a Lotus-specific issue. This brings the confirmed count on the project/global board variant to **7 of ~20** card-field-related checkboxes untranslated (adds "Story Points" to "Spent hours", "Parent", "Children count", "Last comment", "Journals count", "Attachments count").
- **Core-Redmine issue detail page and issue edit form** (confirmed 2026-09-08, explicitly requested: "did you tested story point and string on issue detail page and issue form with lotus theme and with standard theme"): the same "Story Points" field, now surfaced by core Redmine itself as a plugin-injected field on the issue view (`div.label` → "Story Points:") and on the issue edit form (its own `<label>Story Points</label>`), is untranslated English **under both the Lotus and the Default (Standard) theme** — confirmed via side-by-side DOM checks after switching the active theme back and forth on the same issue (#259). On the issue detail page, every sibling field label in the identical `div.label` list is correctly German ("Status:", "Priorität:", "Zugewiesen an:", "Zielversion:", "Startdatum:", "Abgabedatum:", "% erledigt:", "Geschätzter Aufwand:") — only "Story Points:" (and the loanword "Sprint:", which mirrors the plugin's established convention of keeping "Sprint" untranslated as an agile term of art, so not counted as a gap) remain English. Same result on the edit form: every sibling `<label>` is correctly German except "Story Points" (and "Sprint"). This confirms the missing translation key is the same one already responsible for the Board-Einstellungen gap above — it is simply missing everywhere the plugin renders this field's name, not specific to the board settings panel, and not theme-dependent.
- **Custom/saved board config form** (`/projects/<id>/board_configs/new` and `/board_configs/:id/edit`, reached via "Board speichern" / "Board bearbeiten") — a third, separate implementation of the same "Sichtbare Kartenfelder" field list. This one is the *most* complete of the three variants: it correctly translates several fields that the quick-panel variant leaves in English (e.g. "Spent hours" → "Aufgewendete Zeit", "Parent" → "Übergeordnetes Ticket", "Children count" → "Unteraufgaben", "Attachments count" → "Dateien"). Only **2 of ~19** remain untranslated here: **"Last comment"** and **"Comments"** (a field not present in the other two variants' checkbox lists at all). Confirmed via `document.querySelectorAll('label')` against the save/edit form. Confirmed 2026-09-08. This confirms the plugin maintains at least three independent copies of the same field-label list with inconsistent translation coverage between them — a shared-source-of-truth i18n gap, not one single missed key.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-AGB-001/card-fields-partial-translation.png)

![Global Agile Board — same 6/19 gap](../../screenshots/BUG-AGB-001/global-board-settings-card-fields.png)

![My Page block — all 19 untranslated](../../screenshots/BUG-AGB-001/my-page-board-settings-card-fields-all-english.png)

![Save/Edit board-config form — only "Last comment"/"Comments" untranslated](../../screenshots/BUG-AGB-001/board-config-form-card-fields.png)

![Board-Einstellungen under Lotus theme — "Story Points" untranslated in both the card-fields list and the Summen-anzeigen toggle group](../../screenshots/BUG-AGB-001/board-settings-lotus-story-points-untranslated.png)

![Issue detail page, Lotus theme — "Story Points:" untranslated](../../screenshots/BUG-AGB-001/issue-detail-story-points-lotus.png)

![Issue edit form, Lotus theme — "Story Points" label untranslated](../../screenshots/BUG-AGB-001/issue-edit-story-points-lotus.png)

![Issue detail page, Default theme — "Story Points:" untranslated](../../screenshots/BUG-AGB-001/issue-detail-story-points-default.png)

![Issue edit form, Default theme — "Story Points" label untranslated](../../screenshots/BUG-AGB-001/issue-edit-story-points-default.png)

### Retest screenshot — checkbox-list fix reconfirmed on a second server (2026-09-09)

![My Page block — checkbox list now fully German](../../screenshots/BUG-AGB-001/retest-2026-09-09-mypage-checkboxes-fixed.png)

### Retest screenshot — Story Points nearly entirely fixed (2026-09-09)

![Board-Einstellungen — "Story Points" (English) in Sichtbare Kartenfelder vs "Story-Points" (German) in Summen anzeigen, and "STORY-POINTS: 3" in the German summary bar](../../screenshots/BUG-AGB-001/retest-2026-09-09-story-points-partial-fix.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme. All previously-untranslated checkbox labels now render correctly in German across all three surfaces checked:

- **Board-Einstellungen (project board)**: "Spent hours" → "Aufgewendete Zeit", "Parent" → "Übergeordnetes Ticket", "Children count" → "Unteraufgaben", "Last comment" → "Letzter Kommentar", "Journals count" → "Kommentare", "Attachments count" → "Anhänge" — all correct, confirmed via full checkbox-list DOM dump (20 checkboxes, zero English strings).
- **Globale Board-Einstellungen** (`/agile_board/global`): identical full German coverage, confirmed via the same DOM-dump method.
- **My Page Agile Board block** (`/my/page`): previously the worst-affected surface (all 19 untranslated) — now also fully German, confirmed via DOM dump after adding the block fresh to this account's My Page.

**FIXED** for every field checked. Note: this fresh server initially had no "Story Points" custom field enabled, so the Story Points-specific sub-findings could not be retested in this first pass — would need that custom field recreated/enabled first. The custom/saved board-config form's "Last comment"/"Comments" fields were also not re-checked this pass (not requested — user scoped this retest to bugs 1–6 generally, and this sub-finding wasn't specifically revisited).

## Story Points sub-finding — STILL REPRODUCES — 2026-09-09, same server (user enabled the custom field)

The user enabled the "Story Points" custom field from the Agile Board plugin's own configuration, closing the gap that made the above retest inconclusive for this sub-finding. Retested under Standard theme:

- **Board-Einstellungen panel**: "Story Points" checkbox still reads in English in **both** groups — "Sichtbare Kartenfelder" and "Summen anzeigen" — while its neighbor "Geschätzte Zeit" in the same "Summen anzeigen" group is correctly German.
- **New Issue form**: field label reads "Story Points" (English); its own help/hint text below it — "Schätzung der Komplexität (z. B. 1, 2, 3, 5, 8, 13)" — is correctly German, proving the field's translation infrastructure works and only the label itself is missing a key.
- **Issue detail page** (created a fresh test issue, #267, with Story Points = 3): "Story Points:" label renders in English, same as originally reported.
- **Issue edit form** (same issue): "Story Points" label also renders in English.

**Confirmed NOT FIXED.** This is the one sub-finding of the original bug that remains open — every other part (the Board-Settings checkbox-list gap across all three surfaces) is fixed. Test issue #267 deleted afterward; the Story Points custom field was left enabled per user request (useful fixture for future retests on this server).

## Checkbox-list gap re-confirmed fixed; Story Points still untestable — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-fdrk6suoj49.forge.zehntech.com/`) under Standard theme:

- **Board-Einstellungen (project board)**: all 20 checkbox labels confirmed German via full DOM label dump — "Übergeordnetes Ticket", "Unteraufgaben", "Letzter Kommentar", "Kommentare", "Anhänge", "Aufgewendete Zeit" all correctly translated, zero English strings. **Still fixed.**
- **Globale Board-Einstellungen** (`/agile_board/global`): same full-German confirmation via DOM dump. **Still fixed.**
- **My Page Agile Board block**: block wasn't present on this fresh account, so it was added fresh via "Hinzufügen" → "Agile Board", its own Board-Einstellungen panel opened, and confirmed fully German (previously the worst-affected surface, all 19 untranslated). Block removed again afterward to restore the account's My Page to its prior state. **Still fixed.**
- **Story Points sub-finding — NOT RE-TESTABLE this pass.** This fresh server has no "Story Points" custom field at all (confirmed via `/custom_fields` — doesn't exist, unlike the prior server where the user had specifically enabled it). Since creating/configuring a new custom field is a data-model change beyond a simple settings toggle, it was not done unprompted this session — the sub-finding remains genuinely unverified (not confirmed fixed, not re-confirmed broken) until a future session either gets a server with this field already present or the user asks for it to be created.

This bug stays open, narrowed to just the untestable Story Points sub-finding — the checkbox-list gap (the bulk of the original finding) remains confirmed fixed across all three surfaces on two consecutive servers now.

## Story Points sub-finding — RETESTED, nearly entirely FIXED — 2026-09-09, same server (Story Points enabled via plugin configuration)

The Story Points feature was enabled via the Agile Board plugin's own Administration → Plugins configuration page ("Story Points aktivieren" checkbox, confirmed checked with an "Erfolgreich aktualisiert." flash message). Retested under Standard theme:

- **Board-Einstellungen panel, "Summen anzeigen" group**: the Story Points toggle (`input[name="board[show_story_points]"]`) now reads **"Story-Points"** — correctly localized as a hyphenated loanword, consistent with how "Sprint" stays untranslated as an agile term of art. **Fixed.**
- **Board-Einstellungen panel, "Sichtbare Kartenfelder" list**: the Story Points checkbox (`input[name="board[visible_card_fields][]"]`) still reads plain **"Story Points"** (no hyphen) — this exact one checkbox is the only remaining untranslated string found anywhere in this retest. **Still reproduces.**
- **New Issue form**: field label now reads **"Story-Points"**. **Fixed.**
- **Issue detail page** (created a fresh test issue, #267, with Story-Points = 3): label renders as **"Story-Points:"**. **Fixed.**
- **Issue edit form** (same issue): label renders as **"Story-Points"**. **Fixed.**
- **Board summary bar** (bottom of the Kanban view): now shows **"STORY-POINTS: 3"** alongside "SCHÄTZUNG:"/"AUFGEWENDET:" — fully German. **Fixed.**

**Verdict: nearly entirely fixed.** Of the 4 surfaces + 1 checkbox group originally documented as untranslated, only the "Sichtbare Kartenfelder" list's own checkbox remains English — every other instance of this field's name now correctly renders "Story-Points". Severity dropped accordingly (narrowing further, not closing, since a genuine single-checkbox gap remains). Test issue #267 deleted afterward; the Story Points feature was left enabled (useful fixture for future retests on this server).

## Retest — 2026-09-10, new Forge server (flux-fhhcov1xf49) — Story-Points checkbox FIXED, but a new instance found on the board-config form

Retested under Standard theme, German language (account + system default). "Story Points aktivieren" was disabled on this fresh server — enabled it via Administration → Plugins → Redmineflux Agile Board (a plugin-level display toggle, not a data-model change) to make the sub-finding testable.

- **Board-Einstellungen panel (project board), "Sichtbare Kartenfelder" list**: the Story-Points checkbox (`board[visible_card_fields][]`) now reads **"Story-Points"** (hyphenated) — the exact checkbox that was the last remaining gap is now FIXED. Confirmed via `input.name` cross-check, not just visual impression.
- **Board-Einstellungen panel, "Summen anzeigen" group**: also "Story-Points" — still correct, unchanged.
- **Globale Board-Einstellungen** (`/agile_board/global`): both Story-Points checkboxes read "Story-Points" — FIXED.
- **My Page Agile Board block**: added the block fresh (wasn't present on this account), opened its own Board-Einstellungen panel — full 33-checkbox label dump confirmed all-German including both "Story-Points" instances. Previously the worst-affected surface (all 19 untranslated originally). FIXED. Block removed again afterward via its own "Löschen" link to restore the account's My Page.
- **New Issue form**: label reads "Story-Points". FIXED.
- **Issue detail page** (test issue #267, Story-Points = 89): "•Story-Points:" renders correctly. FIXED.
- **Issue edit form** (same issue): label reads "Story-Points". FIXED.

**The Story-Points checkbox sub-finding — the only item this bug was narrowed to — is now FIXED everywhere.** Test issue #267 deleted afterward. Story Points feature left enabled on this server (useful fixture for future retests, per established convention).

**However, while re-verifying the custom/saved board-config form** (`/projects/<id>/board_configs/new`, reached via "Board speichern") — the surface where the original bug also documented "Last comment"/"Comments" as untranslated — found that **both of those are now fixed** ("Letzter Kommentar", "Kommentare"), but a **previously-undocumented instance of the same gap** was found on this exact form: the **"Tags"** checkbox (`c[]` value `tags_relations`) renders in plain English, while its sibling in every other surface checked this session ("Markierungen") is correctly German. Confirmed via `input.name`/`value` attribute, not just visual impression — this is a genuine, distinct checkbox from the ones already covered by this bug's prior findings (none of which mentioned "Tags" on this form). No saved config was actually created (cancelled via "Abbrechen" after confirming the gap) — this form itself is otherwise fully German (Filter panel, status columns, all other card-field checkboxes).

**Bug stays OPEN**, narrowed to this one new instance. Severity: Low (matches the prior narrowing rationale — a single checkbox label, cosmetic, on a settings form most users configure infrequently).

### Retest screenshot

![Board-Einstellungen, Sichtbare Kartenfelder — Story-Points checkbox now fixed](../../screenshots/BUG-AGB-001/retest-2026-09-10-board-settings-storypoints-fixed.png)

![Issue detail page — Story-Points label fixed](../../screenshots/BUG-AGB-001/retest-2026-09-10-issue-detail-storypoints-fixed.png)

![My Page block — full checkbox list fixed](../../screenshots/BUG-AGB-001/retest-2026-09-10-mypage-block-fixed.png)

![Board-config save form — new "Tags" untranslated instance found](../../screenshots/BUG-AGB-001/retest-2026-09-10-boardconfig-tags-untranslated.png)

## Fix verified — 2026-09-10, new Forge server (flux-f3lnytazd49) — "Tags" checkbox FIXED

Retested on `https://flux-f3lnytazd49.forge.zehntech.com/`, German language (account + system default), Standard theme (the environment initially defaulted to the Scarlet theme — switched to Standard per this session's instruction). Story Points was disabled on this fresh server — enabled it via Administration → Plugins → Redmineflux Agile Board.

- **Custom/saved board-config form** (`/projects/agileboard/board_configs/new`, reached via "Board speichern") — the surface with the previously-open "Tags" gap: scoped the checkbox list to the actual `board_configs` form (there are multiple forms on the page) and confirmed via `input.name`/`value` — the checkbox for `c[]` value `tags_relations` now reads **"Markierungen"**, correctly German. **FIXED.** Every other checkbox on this form (ID, Thema, Tracker, Priorität, Zugewiesen an, Autor, Startdatum, Abgabedatum, Geschätzter Aufwand, Aufgewendete Zeit, % erledigt, Übergeordnetes Ticket, Unteraufgaben, Story-Points, Beschreibung, Letzter Kommentar, Kategorie, Zielversion, Kommentare, Anhänge) is also correctly German. No config was saved (cancelled via "Abbrechen" after confirming).
- **Board-Einstellungen (project board), Global Board, My Page block**: full checkbox-label dumps confirm all-German including both "Story-Points" instances — reconfirmed still fixed on this third consecutive server.
- **New Issue form, issue detail page, issue edit form** (test issue #266, Story-Points value set, deleted afterward): all read "Story-Points" correctly.

**Every sub-finding of this bug — the original checkbox-list gap, the Story-Points checkbox, and the newly-found "Tags" checkbox — is now confirmed FIXED.** No open sub-findings remain. **Closing this bug.**

### Retest screenshot — 2026-09-10, server 3

![Board-config form — "Markierungen" (Tags) now correctly German](../../screenshots/BUG-AGB-001/retest-2026-09-10-server2-boardconfig-tags-fixed.png)

![Issue detail page — Story-Points label fixed](../../screenshots/BUG-AGB-001/retest-2026-09-10-server2-issuedetail-fixed.png)

![My Page block — full checkbox list fixed](../../screenshots/BUG-AGB-001/retest-2026-09-10-server2-mypage-fixed.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
