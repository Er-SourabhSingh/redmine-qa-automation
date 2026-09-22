# Test Cases — Redmineflux Agile Board Plugin — German Language Compatibility

> Scope: Stage 1 — verify the Agile Board plugin's own UI renders fully in German. Default Redmine theme, German language.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch).
- Active theme: Default (core Redmine).
- Redmine 7.0.1.stable, Redmineflux Agile Board (agile_board) 7.0.0.
- Project "Agile Board Project" already has the module enabled (confirmed live — no module-enable step needed).

---

### TC-AGB-104 — Project Agile Board: header, filter bar, and columns fully translated

**Steps**

1. Open the project's "Agile Board" tab.
2. Inspect the header ("Board speichern"), search/filter row (search box, member avatars, Tracker filter, "Weitere Filter", "Gruppieren nach", "Einblicke", "Board markieren", "Board-Einstellungen"), the estimate/spent summary row, and the status columns.

**Actual Result — PASS**

- "Board speichern" (Save board), "Tickets suchen" (search placeholder), "Tracker" filter button, "Weitere Filter" (More filters), "Gruppieren nach: Keine" (Group by: None), "Einblicke" (Insights), "Board markieren" (Bookmark board), "Board-Einstellungen" (Board settings) — all correctly translated.
- "Schätzung:"/"Aufgewendet:" (Estimate/Spent) summary row — translated.
- "+ Ticket erstellen" (quick-add placeholder) — translated. "Dieses Ticket markieren" (bookmark-this-ticket tooltip) — translated. "Tickets hier ablegen" / placeholder "Tickets in diese Spalte ziehen" (empty-column drop message) — translated.
- Status column headers (NEW/IN PROGRESS/RESOLVED/FEEDBACK/CLOSED/REJECTED) are actual Redmine status data (admin-named records), not plugin UI strings — correctly not a translation concern.

**Verdict:** PASS. No bugs found.

---

### TC-AGB-105 — Board Settings panel fully translated

**Steps**

1. Click "Board-Einstellungen".
2. Inspect "Board-Typ", "Sichtbare Statusspalten" (+ WIP fields), "Sichtbare Kartenfelder" (19 checkboxes), "Summen anzeigen", "Spaltenreihenfolge", and the footer buttons.

**Actual Result — FAIL**

- "Board-Typ" (+ "Kanban-Board"/"Scrum-Board" options), "Sichtbare Statusspalten" (+ "WIP:" labels), "Summen anzeigen" (+ "Geschätzte Zeit"/"Aufgewendete Zeit"), "Spaltenreihenfolge" (+ "Sortierung aktivieren"), "Einstellungen anwenden"/"Zurücksetzen" buttons — all correctly translated.
- Of the 19 "Sichtbare Kartenfelder" checkboxes, 13 are correctly translated ("Id", "Thema", "Tracker", "Priorität", "Zugewiesen an", "Autor", "Startdatum", "Abgabedatum", "Geschätzter Aufwand", "% erledigt", "Beschreibung", "Tags", "Kategorie", "Zielversion") but **6 remain untranslated English**: "Spent hours", "Parent", "Children count", "Last comment", "Journals count", "Attachments count".

**Verdict:** FAIL — filed as `BUG-AGB-001` (Low).

**Evidence:** `screenshots/BUG-AGB-001/card-fields-partial-translation.png`

---

### TC-AGB-106 — "Weitere Filter" (More filters) panel fully translated

**Steps**

1. Click "Weitere Filter".
2. Inspect the filter panel: heading, "Status" checkbox + value dropdown, "Filter hinzufügen" dropdown, footer buttons.

**Actual Result — PASS**

- "Filter" heading, "Status" checkbox, "offen" (open) value, "FILTER HINZUFÜGEN" (Add filter), "Anwenden"/"Zurücksetzen" buttons — all correctly translated.

**Verdict:** PASS. No bugs found.

---

### TC-AGB-107 — "Einblicke" (Board Insights) panel fully translated

**Steps**

1. Click "Einblicke".
2. Inspect all sections: Kennzahlen, "Alles klar" empty-state, Workflow-Verteilung, Teamauslastung, Tickettypen.

**Actual Result — mostly PASS, 1 bug found**

- "Board-Einblicke" heading + subheading, "Kennzahlen" (Tickets gesamt/Abgeschlossen/In Bearbeitung/Benötigt Aufmerksamkeit), "Alles klar" + message, "Workflow-Verteilung", "Teamauslastung" (+ "Ticketverteilung im Team (aus N geladenen Issues)"), "Tickettypen" — all correctly translated.
- **Pluralization gap**: every count-with-unit string uses English "Issues" when the count is >1, but correctly uses German "Ticket" when the count is exactly 1 (e.g. "3 Issues (42.9%)" vs. "1 Ticket (14.3%)"). Confirmed via `document.createTreeWalker` text search across the whole panel.

**Verdict:** Mostly PASS — filed the pluralization gap as `BUG-AGB-002` (Low).

**Evidence:** `screenshots/BUG-AGB-002/plural-issues-untranslated.png`

---

### TC-AGB-108 — Double-click inline "Vorgang bearbeiten" (Edit Issue) modal fully translated

**Steps**

1. Double-click a card's subject text.
2. Inspect the modal.

**Actual Result — PASS**

- "Vorgang bearbeiten #<id>" heading, "Thema *", "Beschreibung", "Abbrechen"/"Speichern" buttons — all correctly translated.

**Verdict:** PASS. No bugs found.

---

### TC-AGB-109 — Quick-add issue via column input

**Steps**

1. Click the "+ Ticket erstellen" input in the NEW column.
2. Type a subject and press Enter.

**Actual Result — PASS**

- Issue created successfully (confirmed issue #266 "QA Quick Add Test" appeared in the column, and later on the Backlog's "Kein Sprint" list). No error shown for an empty submit (silently no-ops rather than showing a translated-or-untranslated message either way — not a defect, just no message to check).

**Verdict:** PASS. No bugs found.

---

### TC-AGB-110 — Backlog view (Sprints tab) fully translated

**Steps**

1. Open the project's "Backlog" tab.
2. Inspect the header, filter row, "Sprints"/"Versionen" tab switcher, sprint columns, and the "Kein Sprint" column.

**Actual Result — mostly PASS, 1 bug found**

- "📋 Backlog" heading, "Tickets suchen", "Weitere Filter", "Sprint erstellen" link, "Board markieren"/"Board-Einstellungen", "Sprints"/"Versionen" tab buttons, sprint status pill "📅 Offen", "Kein Sprint" / "Tickets ohne Sprint" column, "Keine Tickets in diesem Sprint" empty state — all correctly translated. Sprint names ("Bug Bash", "UI Polish") are user-created data, not UI strings.
- **Found**: the unassigned-ticket avatar's "?" placeholder carries `title="Unassigned"` — English — confirmed via DOM (`[title="Unassigned"]`, class `jira-assignee-avatar jira-unassigned`), breaking the "Nicht zugewiesen" convention used elsewhere on this same instance.

**Verdict:** Mostly PASS — filed as `BUG-AGB-003` (Low).

**Evidence:** `screenshots/BUG-AGB-003/unassigned-tooltip-untranslated.png`

---

### TC-AGB-111 — Backlog view (Versionen tab) fully translated

**Steps**

1. Click the "Versionen" tab on the Backlog view.
2. Inspect the header, version columns, and "Keine Version" column.

**Actual Result — PASS**

- "+ Version erstellen" button, "KEINE VERSION" / "Tickets ohne Version" column, "Fällig: <date>" (Due:), "Keine Vorgänge in dieser Version" empty state — all correctly translated.

**Verdict:** PASS. No bugs found.

### TC-AGB-112 — Global Agile Board (`/agile_board/global`) fully translated

**Steps**

1. Click the top-nav "Agile Board" link (distinct from the project-level "Agile Board" tab).
2. Inspect the header, filter bar, "Globale Board-Einstellungen" panel, and card project-name badges (unique to this multi-project view).

**Actual Result — mostly PASS, both known bugs reproduce here**

- "Agile Board" heading, "Tickets suchen", member-filter avatars, "Tracker" button, "Weitere Filter", "Gruppieren nach: Keine", "Board markieren", "Globale Board-Einstellungen" (translated equivalent of the project-level "Board-Einstellungen"), "Schätzung:"/"Aufgewendet:" summary, "Dieses Ticket markieren" tooltip — all correctly translated. Card project-name badges (e.g. "Agile Board Project", "Flux Gantt Project") are project display-name data, not plugin UI strings — correctly not a translation concern, consistent with the sprint/version-name convention established in TC-AGB-110/008.
- "Globale Board-Einstellungen" panel: identical structure and identical gap to TC-AGB-105 — 6 of 19 "Sichtbare Kartenfelder" checkboxes untranslated. Same root cause as `BUG-AGB-001` (folded in as an additional affected surface).
- Unassigned-avatar "?" tooltip: same `title="Unassigned"` (English) as TC-AGB-110. Same root cause as `BUG-AGB-003` (folded in as an additional affected surface).

**Verdict:** Mostly PASS — no new bug filed; both gaps are the identical underlying defects already tracked as `BUG-AGB-001` and `BUG-AGB-003`, confirmed to also affect the Global Board.

**Evidence:** `screenshots/BUG-AGB-001/global-board-settings-card-fields.png`

---

### TC-AGB-113 — My Page Agile Board block (`/my/page`) fully translated

**Steps**

1. Navigate to "Meine Seite" (My Page) — the Agile Board block is present by default (no manual block-add step needed).
2. Inspect the block heading, ticket count, status columns, empty-state message, and its own "Board-Einstellungen" panel.

**Actual Result — mostly PASS, 1 broader variant of an existing bug found**

- "Agile Board" block heading, "Tickets" count label, "Board-Einstellungen" button, "Tickets hier ablegen" empty-state (Closed/Rejected columns), section headings inside the settings panel ("Sichtbare Statusspalten", "Sichtbare Kartenfelder", "Summen anzeigen", "Spaltenreihenfolge", "Einstellungen anwenden"/"Abbrechen") — all correctly translated.
- **Found a broader variant of `BUG-AGB-001`**: inside this block's own "Board-Einstellungen" panel, **all 19** of the "Sichtbare Kartenfelder" checkbox labels are untranslated English — not just the same 6 as the project/global board. None of the 13 labels that are correctly German elsewhere (e.g. "Thema", "Priorität", "Zugewiesen an") carry their translation here. Confirmed via `document.querySelectorAll('label')` against the open panel.
- Unassigned-avatar tooltip (`BUG-AGB-003`) could not be exercised here — every ticket in this block belongs to the logged-in user, so no unassigned card was present.

**Verdict:** Mostly PASS — folded into `BUG-AGB-001` as an additional, more-severe affected surface (all 19 fields vs. 6 of 19 elsewhere) rather than filing a new bug, since the root defect (untranslated card-field checkbox labels in this shared settings component) is the same.

**Evidence:** `screenshots/BUG-AGB-001/my-page-board-settings-card-fields-all-english.png`

---

### TC-AGB-114 — Custom/saved board config: create, edit, delete flow fully translated

**Steps**

1. On the project Agile Board, click "Board speichern" to open the save-board-config form.
2. Enter a name, submit, and inspect the success message.
3. Expand the sidebar ("Seitenleiste erweitern") to find the saved board's "Board bearbeiten"/"Board löschen" links.
4. Edit the board (resubmit unchanged) and inspect the update success message.
5. Delete the board and inspect the delete-confirmation modal and the delete success message.

**Actual Result — mostly PASS, 1 narrow variant of an existing bug found**

- "Board-Konfiguration speichern" / "Board-Konfiguration bearbeiten" form heading, "Sichtbarkeit" (nur für mich / nur für diese Rollen / für jeden Benutzer + all role names), "Für alle Projekte", "Optionen", "Board-Typ" (Kanban-Board/Scrum-Board), "Gruppieren nach (Swimlanes)" + all 8 options, "Summen anzeigen", the full "Filter hinzufügen" dropdown (all ~44 filter-field options), "Sichtbare Statusspalten", "Speichern" button — all correctly translated.
- Flash messages: "Erfolgreich angelegt." (create), "Erfolgreich aktualisiert." (edit), "Erfolgreich gelöscht." (delete) — all correctly translated.
- Sidebar saved-boards list: "Seitenleiste erweitern"/"Seitenleiste einklappen", "Board bearbeiten", "Board löschen" — all correctly translated.
- Delete confirmation modal: heading "Board löschen?", body message "Wenn Sie das Board "<name>" löschen, kann es nicht wiederhergestellt werden. Alle gespeicherten Filter, Einstellungen und Konfigurationen werden dauerhaft entfernt.", "Abbrechen"/"Löschen" buttons — all correctly translated, including the dynamically-interpolated board name.
- **Found**: on this form's own "Sichtbare Kartenfelder" checkbox list — a third, separate implementation of the same field list already covered by `BUG-AGB-001` — only 2 of ~19 remain untranslated: "Last comment" and "Comments" (a field unique to this form). Notably this variant is otherwise the *most* complete of the three implementations (translates "Spent hours", "Parent", "Children count", "Attachments count" that the quick-panel variant leaves in English).

**Verdict:** Mostly PASS — the create/edit/delete workflow itself, including all messaging and the delete-confirmation dialog, is fully and correctly localized. The narrow "Last comment"/"Comments" gap folded into `BUG-AGB-001` as a third affected surface rather than filed separately (same root defect: the shared card-field-checkbox list, inconsistently translated across its multiple implementations).

**Evidence:** `screenshots/BUG-AGB-001/board-config-form-card-fields.png`

---

### TC-AGB-115 — Sprint create form ("Neuer Sprint") fully translated

**Steps**

1. On the project's "Backlog" tab, click "Sprint erstellen".
2. Inspect every field label, fill in Name + Startdatum, submit.
3. Inspect the success message and the resulting sprint column's date range on the Backlog board.

**Actual Result — mostly PASS, 2 bugs found**

- "Neuer Sprint" form heading, "Name *", "Startdatum *", "Dauer" (+ "1 Woche"/"2 Wochen"/"3 Wochen"/"4 Wochen"), "Status" (+ "Offen"/"Aktiv"/"Geschlossen"), the "Sharing" dropdown's own option values ("Nicht geteilt"/"Mit Unterprojekten"/"Mit Projekthierarchie"/"Mit Projektbaum"/"Mit allen Projekten"), "Erstellen" submit button — all correctly translated. Post-submit flash message "Sprint erfolgreich erstellt" — correctly translated.
- **Found**: 3 of 6 field labels untranslated English — "Description", "End date", "Sharing" (only the label, not that field's own dropdown options). Filed as `BUG-AGB-004` (Low).
- **Found**: the newly-created sprint's date range on the Backlog board renders as "Sep 08 - Sep 21, 2026" (hardcoded English month format) instead of the German-localized format core Redmine itself uses for the identical date (confirmed via the project's own Roadmap page rendering the same date as "30.09.2026"). Reproduces identically for the pre-existing sprints and for version due-dates on the "Versionen" sub-tab. Filed as `BUG-AGB-005` (Low).

**Verdict:** Mostly PASS — 2 new bugs filed (`BUG-AGB-004`, `BUG-AGB-005`), distinct root causes from each other and from `BUG-AGB-001`'s card-field-checkbox gap, so not folded in.

**Note (superseded — see TC-AGB-121):** no UI entry point for editing or deleting an existing sprint could be located from the Backlog view (no hover/click-revealed controls, no separate sprint-management screen linked from anywhere in the project nav), despite the User Guide's KB research describing a "Sprint management screen — create/edit/delete sprints". ~~This is a functional-completeness question, out of scope for this German-language test cycle~~ — **found later (TC-AGB-121): the entry point exists at the project's Settings/Konfiguration tab bar → "Sprints" sub-tab, not the Backlog view.** The test sprint ("QA German Sprint", id 3) was left in place on the Forge instance as a result (disposable Forge test data).

**Evidence:** `screenshots/BUG-AGB-004/sprint-create-form-untranslated.png`, `screenshots/BUG-AGB-005/backlog-sprint-dates-english-format.png`, `screenshots/BUG-AGB-005/backlog-version-due-date-english-format.png`

---

### TC-AGB-116 — Admin plugin Configure page (Administration → Plugins → Redmineflux Agile Board) fully translated

**Steps**

1. Administration → Plugins → "Konfigurieren" for Redmineflux Agile Board (re-enter account password at Redmine's security re-auth prompt).
2. Inspect the page heading, both settings fields (Story Points toggle, Max WIP limit), both icon-customization sections (Priority icons, Tracker icons), and the submit button.

**Actual Result — mostly PASS, 1 bug found**

- "Agile-Board-Einstellungen" heading, "Story Points aktivieren" + description, "Maximales WIP-Limit" + description, "Prioritätssymbole" + description, "Tracker-Icons konfigurieren" + description, the conditionally-hidden "Story-Point-Werte" field's own label + help text + client-side validation error ("Story Points müssen positive ganze Zahlen sein."), "Anwenden" submit button — all correctly translated. Priority/tracker names shown ("Low", "Bug", etc.) are admin-configured data, not a translation concern (same convention as status-column names).
- **Found**: the "(Default: ...)" parenthetical next to every priority/tracker icon selector is untranslated English, in all 8 rows (5 priority + 3 tracker). Filed as `BUG-AGB-006` (Low).

**Verdict:** Mostly PASS — filed as `BUG-AGB-006` (Low), a narrow single-word gap on an otherwise thoroughly-translated admin page (including a hidden field's own validation message, which is a strong sign of overall care in this area).

**Evidence:** `screenshots/BUG-AGB-006/agile-configure-page-default-untranslated.png`

---

### TC-AGB-117 — Stage 2: Resolution testing (1280×720 and 1920×1080, Default theme)

**Steps**

1. Resize viewport to 1280×720. Inspect the project Agile Board (toolbar, columns, card layout), the Board-Einstellungen panel (including scrolling to its footer), the Weitere Filter panel, and the Backlog view (Sprints tab).
2. Resize viewport to 1920×1080 and re-inspect the Agile Board as a baseline sanity check (all prior TCs in this suite were executed at 1920×1080).

**Actual Result — PASS at both resolutions**

- **1280×720**: Toolbar buttons ("Board speichern", search, member-filter avatars, "Tracker", "Weitere Filter", "Gruppieren nach", "Einblicke", bookmark, "Board-Einstellungen") all render without overlap or wrapping into each other. Kanban columns beyond the 4th ("CLOSED") scroll horizontally via the board's own scroll container (arrow indicator "›" visible) — expected Kanban behavior at a narrower viewport, not a defect. Card subject text truncates with an ellipsis at this narrower card width — intentional truncation, not clipping. The Board-Einstellungen panel is an inline expanding panel (not a fixed/floating modal) that scrolls naturally with the page — all sections ("Sichtbare Statusspalten", "Sichtbare Kartenfelder", "Summen anzeigen", "Spaltenreihenfolge") and both footer buttons ("Einstellungen anwenden"/"Zurücksetzen") remain fully visible and reachable via normal scroll, no clipping. The "Weitere Filter" panel and the Backlog view (3 sprint columns + "Kein Sprint" panel) also render cleanly with no overlap.
- **1920×1080**: All 6 status columns (NEW/IN PROGRESS/RESOLVED/FEEDBACK/CLOSED/REJECTED) fit without horizontal scroll; layout matches every other TC executed in this suite at this resolution.

**Verdict:** PASS. No resolution-specific layout defects found at either 1280×720 or 1920×1080 — no bugs filed.

---

### TC-AGB-118 — Stage 3/6: Lotus theme retest (default + 1280×720)

**Steps**

1. Switch active theme to "Redmineflux lotus" (Administration → Settings → Anzeige → Design-Stil).
2. At 1920×1080, re-inspect the project Agile Board (toolbar, columns, card layout), Board-Einstellungen panel, Weitere Filter panel, and the Backlog view.
3. Resize to 1280×720 and repeat the Board-Einstellungen panel check (card-fields grid reflow).

**Actual Result — mostly PASS, no new Agile-Board-owned bugs; 2 known bugs confirmed/expanded**

- All previously-tested strings remain correctly translated under Lotus: toolbar buttons, "Board-Einstellungen"/"Weitere Filter" panel contents, Backlog view (Sprints/Versionen tabs), empty-state messages. No new translation gaps introduced by the theme switch itself.
- Layout is clean at both 1920×1080 and 1280×720 under Lotus — the Board-Einstellungen panel's "Sichtbare Kartenfelder" checkbox grid reflows from 6 columns down to 3 at the narrower width with no clipping or overlap; the Weitere Filter panel and Backlog board also render without overlap.
- **Confirmed**: the project sidebar nav's "Aufgewendete Zeit" entry renders clipped as "Aufgewendete ..." under Lotus (scrollWidth 118px > clientWidth 111px, identical numbers to the original finding) — this is `BUG-LTS-001` (the Lotus theme's own bug), reproducing on this Agile Board Project on a third independent Forge server. Documented there as an additional cross-server confirmation, not a new Agile Board bug.
- **Found**: the project's Story Points feature is now enabled (was off during the original Stage 1 pass) — its "Story Points" checkbox is untranslated English in both the "Sichtbare Kartenfelder" list and the separate "Summen anzeigen" toggle group. Same root defect as `BUG-AGB-001` (reproduces under both Default and Lotus themes, so not theme-specific) — folded in as a 7th affected field rather than filed separately.
- A new "SPRINT: Alle Sprints" filter row is now visible above the board columns — this appeared because a sprint now exists in the project (created during TC-AGB-115), not because of the theme switch; the label and its "Alle Sprints" (All Sprints) value are both correctly translated.

**Verdict:** Mostly PASS — no new Agile-Board-specific bugs from the Lotus theme or the Lotus+1280×720 combination. `BUG-LTS-001` gained a third-server confirmation; `BUG-AGB-001` gained a 7th untranslated field ("Story Points", discovered incidentally due to a project-state change, not the theme).

**Evidence:** `screenshots/BUG-LTS-001/agile-board-project-sidebar-clipped-server3.png`, `screenshots/BUG-AGB-001/board-settings-lotus-story-points-untranslated.png`

---

### TC-AGB-119 — Story Points field on the core-Redmine issue detail page and issue edit form (Lotus + Default theme)

**Steps**

1. On issue #259, inspect the issue detail page's field list (`div.label` entries), specifically "Story Points:" and its neighbors, under the Lotus theme.
2. Open the issue's edit form and inspect the "Story Points" field label and its neighbors, under the Lotus theme.
3. Switch the active theme back to Default (Standard) and repeat both checks on the same issue.

**Actual Result — FAIL under both themes, theme-agnostic gap**

- Issue detail page: sibling field labels "Status:", "Priorität:", "Zugewiesen an:", "Zielversion:", "Startdatum:", "Abgabedatum:", "% erledigt:", "Geschätzter Aufwand:" are all correctly German under both themes. "Story Points:" remains hardcoded English under both. ("Sprint:" also renders in English, but that mirrors the plugin's established convention of keeping "Sprint" as an untranslated loanword elsewhere — e.g. "Kein Sprint" — so not counted as a gap.)
- Issue edit form: same pattern — every sibling `<label>` ("Projekt", "Tracker", "Thema", "Status", "Priorität", "Zugewiesen an", "Zielversion", "Übergeordnetes Ticket", "Startdatum", "Abgabedatum", "Geschätzter Aufwand", "% erledigt") is correctly German under both themes; only "Story Points" (and "Sprint", same reasoning as above) stays English.
- Identical under Lotus and Default — proving this is a genuine, theme-independent missing translation key for the field's own name, not a settings-panel-specific or theme-specific issue.

**Verdict:** FAIL — same root defect as `BUG-AGB-001`, folded in as an additional affected surface (core issue detail page + issue edit form) rather than filed as a new bug. This surface's higher everyday visibility (every user viewing/editing any issue, vs. an admin-only settings panel) is why `BUG-AGB-001`'s severity was raised from Low to Medium.

**Evidence:** `screenshots/BUG-AGB-001/issue-detail-story-points-lotus.png`, `screenshots/BUG-AGB-001/issue-edit-story-points-lotus.png`, `screenshots/BUG-AGB-001/issue-detail-story-points-default.png`, `screenshots/BUG-AGB-001/issue-edit-story-points-default.png`

---

### TC-AGB-120 — Sprint/Story Points visual consistency (font, alignment, layout width) on issue detail page and edit form under Lotus theme

**Steps**

1. On issue #266 (Sprint "Bug Bash", Story Points 3), under the Lotus theme, inspect the issue detail page's "Sprint:"/"Story Points:" labels against sibling field labels (Status, Priorität, Zugewiesen an, etc.) — computed font-weight, font-size, color.
2. On the same issue's edit form under Lotus, inspect the "Sprint"/"Story Points" row width against sibling fields ("Zugewiesen an", "Zielversion").
3. Switch to Default theme and repeat both checks for comparison.

**Actual Result — FAIL under Lotus, PASS under Default (explicitly asked: "did you noticed this in edit form size is different size of sprint and story point in lotus theme, also did you noticed the font style")**

- Issue detail page (Lotus): every core field label uses Lotus's own restyled `span.rf_attr_lbl` markup (font-weight 500, 13px, gray `rgb(107,114,128)`). "Sprint:"/"Story Points:" instead render via old default `div.label` markup — font-weight 700, 14px, darker `rgb(55,65,81)` — visibly bolder/larger/darker than every sibling. ("Tags:" also uses `div.label` but Lotus specifically restyles it via an extra `.tag_label` class to match — proving the gap is that Sprint/Story Points were simply never added to Lotus's stylesheet, not that `div.label` elements are unreachable.)
- **Also found (alignment)**: every core field ("Status", "Priorität", "Tags:") renders as a bulleted list item with its label indented ~12-16px past the row's left edge (the bullet's own space) — confirmed `Status`/`Priorität` labels at `x≈293.3` vs. row edge `x≈281`. "Sprint:" has no bullet at all and sits flush with the row's left edge (`x=281`, no indent). "Story Points:" doesn't even share the same left column — it starts at `x≈570.8`, crammed onto the same line as "Sprint:"'s value ("Bug Bash") rather than getting its own bulleted row.
- Issue edit form (Lotus): sibling half-width fields ("Zugewiesen an", "Zielversion") occupy ~763px (one column of the 2-column grid at 1920×1080). "Sprint"/"Story Points" instead span ~1557px — the full grid width — breaking out of the two-column layout into an oversized standalone row.
- Same issue, same fields, under Default theme: both labels and layout are fully consistent with every sibling field — confirms this is Lotus-specific, not an Agile Board plugin defect.

**Verdict:** FAIL under Lotus — filed as `BUG-LTS-003` (Medium) against the Lotus theme (root cause is the theme's incomplete attributes-grid restyling, not the plugin), cross-referenced here since it's specific to this plugin's injected fields.

**Evidence:** `screenshots/BUG-LTS-003/issue-view-lotus-sprint-storypoints-font-mismatch.png`, `screenshots/BUG-LTS-003/issue-view-lotus-alignment-and-font-mismatch.png`, `screenshots/BUG-LTS-003/issue-edit-lotus-sprint-storypoints-fullwidth.png`, `screenshots/BUG-LTS-003/issue-edit-default-sprint-storypoints-clean.png`

---

### TC-AGB-121 — Project Settings → Sprints tab (sprint edit/delete entry point found; new "Freigabe" bug)

**Steps**

1. Navigate to the project's "Konfiguration" (Settings) tab bar → "Sprints" sub-tab (`/projects/:id/settings/sprints`).
2. Inspect the page heading, filter dropdown, table headers, and each sprint row's "Freigabe" (Sharing) column value.
3. Click "Bearbeiten" on a sprint whose Freigabe column shows an untranslated value and inspect its "Sharing" dropdown.
4. For comparison, repeat under Default theme.

**Actual Result — mostly PASS, correction to an earlier finding, 1 new bug**

- "Sprints" tab label, "Neuer Sprint" button, "Nach Status filtern:" + "Alle"/"Offen"/"Aktiv"/"Geschlossen" options, and table headers ("Name", "Startdatum", "Enddatum", "Status", "Freigabe") — all correctly translated. "Bearbeiten"/"Löschen" row-action links — correctly translated.
- **Correction**: this tab IS the sprint edit/delete entry point that TC-AGB-115 reported could not be found anywhere in the Backlog view or project nav. It's reached via the project's Settings/Konfiguration tab bar specifically, not the Backlog view — the earlier "functional gap" note is retracted; sprint edit/delete has always worked, just via this less-obvious path.
- **Found**: the "Freigabe" column shows the raw untranslated enum value "not_shared" for 2 of 3 sprints ("UI Polish", "Bug Bash" — pre-existing fixtures), while the third ("QA German Sprint", created via the UI form this session) correctly shows "Nicht geteilt". Opening "Bearbeiten" on an affected sprint shows its "Sharing" dropdown correctly pre-selected to "Nicht geteilt" — proving the underlying value is identical to the correctly-displayed sprint's, and the defect is specific to this list view's rendering, not the data or the Edit form. Confirmed identical under both Lotus and Default theme.

**Verdict:** Mostly PASS — filed as `BUG-AGB-007` (Low).

**Evidence:** `screenshots/BUG-AGB-007/sprints-settings-freigabe-raw-value-lotus.png`, `screenshots/BUG-AGB-007/sprints-settings-freigabe-raw-value-default.png`

---

## Not yet covered this session

- Drag-and-drop card movement between columns (including invalid-transition rejection behavior/message).
- Column reordering.
- Sprint edit/delete flow — no UI entry point could be located (see TC-AGB-115 note); create flow tested (TC-AGB-115).
- Scrum board mode and sprint filtering.
- Story Points feature UI itself (disabled by default — the plugin Configure page's Story Points toggle/values field and its validation are translated per TC-AGB-116, but the feature has not been enabled and exercised on an actual board).
- Grouping options other than "Keine" (None).
- Permissions/role-gating (tested only as Admin).
- Stage 2 (resolutions, Default theme) — complete, see TC-AGB-117. Stages 3/6 (Lotus theme, default + 1280×720) — complete, see TC-AGB-118. All resolution/theme combinations for this plugin are now covered.
