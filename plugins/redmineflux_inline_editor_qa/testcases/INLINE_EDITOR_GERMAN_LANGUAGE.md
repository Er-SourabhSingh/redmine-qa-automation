# Test Cases — Redmineflux Inline Issue Editor plugin — German Language Compatibility

> Scope: verify the Inline Editor's own custom searchable-dropdown widget (`rf-ss`) renders fully in German. Stage 1 of the multi-stage German/Lotus compatibility QA pass — Default Redmine theme, German language.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch).
- Active theme: Default (core Redmine).
- Redmine 7.0.1.stable, inplace_issue_editor 7.0.0.

---

### TC-INE-015 — Issue detail "Zugewiesen an" (Assigned to) inline searchable dropdown fully translated in German

**Steps**

1. Log in as admin, confirm German language + Default theme active.
2. Open any issue detail page (e.g. `/issues/230`).
3. Click the Edit (pencil) icon next to the "Zugewiesen an:" (Assigned to) field.
4. Inspect the resulting searchable dropdown: its search input placeholder and its option list (including the special "<<me>>" shortcut option and the clear/"None" option).

**Expected Result**

- Every string the widget itself renders is in German, consistent with the field label "Zugewiesen an:" (correctly translated, core Redmine) and the widget's own "<<ich>>" shortcut option (correctly translated).

**Actual Result — FAIL**

Two hardcoded English strings found in the same widget, both confirmed via DOM/accessibility tree, alongside a sibling string in the identical widget that IS correctly translated (proving genuine defect, not a doc/expectation mismatch):

- Search input placeholder reads **"Search…"** (`input.rf-ss__input[placeholder="Search…"]`) — untranslated.
- The clear/no-assignee dropdown option reads **"— None —"** — untranslated, while the option directly above it in the identical list, **"<< ich >>"** (the "assign to me" shortcut), IS correctly translated.

Root cause is very likely the same: both strings are hardcoded literals in the shared `rf-ss` widget's JS/template, not routed through Redmine's `l()` i18n lookup, while the "<<me>>"/"<<ich>>" string apparently is.

**Verdict:** FAIL — filed as `BUG-INE-001`.

**Evidence:** `screenshots/BUG-INE-001/assigned-to-search-untranslated.png`

---

### TC-INE-016 — Inline-edit error toast is fully translated when a save is rejected by another plugin's validation (cross-plugin: Redmineflux Checklist)

**Steps**

1. Enable "Ticket-Schließung blockieren" in the Redmineflux Checklist Plugin settings.
2. Open an issue with an incomplete checklist item.
3. Click the inline Edit (pencil) icon next to "Status:" and select "Closed".
4. Because the resulting error toast auto-dismisses faster than a manual screenshot round-trip, capture it via a `MutationObserver` watching `document.body` for added nodes at the moment the `change` event fires.

**Expected Result**

- The toast should render entirely in German, since the validation message it displays (from the Checklist plugin) is itself correctly translated.

**Actual Result — FAIL**

Toast captured (`<div class="rf-toast rf-toast--error">`):

```
Could not save: Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.
```

The **"Could not save:"** prefix is hardcoded English; everything after it is correctly, fully German (confirmed separately: submitting the identical change via the full Edit form shows only the clean German message, no English prefix — the Checklist plugin's own message and translation are correct, the defect is specific to the Inline Editor's toast-wrapping code).

Also confirmed the field otherwise gives **zero visible feedback** through normal inspection (accessibility tree / DOM text search immediately after the fact) — the toast is real but so short-lived that a user could easily miss why their change didn't take effect if they look away for even a moment.

**Verdict:** FAIL — filed as `BUG-INE-002`.

**Evidence:** DOM captured via `MutationObserver` (reproduced verbatim above); no static screenshot possible due to the toast's dismiss speed.

---

### TC-INE-017 — Priority field inline edit (native `<select>`, not the `rf-ss` widget) — re-verification of BUG-INE-001's scope

**Steps**

1. On issue #259, click the Edit icon next to "Priorität:".
2. Inspect the resulting control's type and its option list.

**Actual Result — PASS, corrects an assumption in `INLINE_EDITOR_FEATURES_LIST.md`**

- Priority's inline edit opens a plain native `<select>` (`combobox`), **not** the `rf-ss` searchable-dropdown widget that Assignee uses — contrary to the features list's prior assumption ("Uses the rf-ss dropdown widget"). Its options ("Low", "Normal", "High", "Urgent", "Immediate") are admin-configured priority names — data, not UI strings, consistent with the established convention for status/tracker names elsewhere in this cycle. Since this is a native select with no custom placeholder/empty-option text, `BUG-INE-001`'s "Search…"/"— None —" pattern does not and cannot apply here.

**Verdict:** PASS — no bug. Corrects the features list's prior open question about whether Priority shares Assignee's translation gap; it doesn't, because it doesn't share the same widget at all.

---

### TC-INE-018 — Issues LIST view inline editing (Subject, Zugewiesen an) and surrounding list-page chrome

**Steps**

1. Open the project's Tickets (Issues) list.
2. Inspect the list header row, Filter panel, "Neues Ticket" button, and export links ("Auch abrufbar als: CSV | PDF | Atom").
3. Click a row's Subject-cell Edit icon and inspect the resulting inline input.
4. Click a row's Zugewiesen an-cell Edit icon and inspect the resulting `rf-ss` widget.
5. Inspect the sidebar's "Abfragen" (Queries) block links.

**Actual Result — mostly PASS, `BUG-INE-001` reproduces on this surface too**

- List header row ("#", "Tracker", "Status", "Priorität", "Thema", "Zugewiesen an", "Aktualisiert"), Filter panel ("Filter", "Status", "Optionen", "Anwenden", "Zurücksetzen", "Abfrage speichern", "Filter hinzufügen"), "Neues Ticket" button, and "Auch abrufbar als: CSV | PDF | Atom" — all correctly translated.
- Subject-cell inline edit opens a plain text input directly in the cell (no separate Save/Cancel buttons — same save-on-Enter/cancel-on-Escape behavior as the issue detail page's Subject field) — no translatable strings to check, functions correctly.
- Zugewiesen an-cell inline edit opens the same `rf-ss` widget as the issue detail sidebar — **reproduces the identical `BUG-INE-001` gap**: "Search…" placeholder and "— None —" option both untranslated. Folded into the existing bug as an additional affected surface (list view, not just the detail sidebar).
- Sidebar "Abfragen" block links ("Issues assigned to me", "Reported issues", "Updated issues", "Watched issues") are English — but confirmed via their `href` (`?query_id=1/2/3/4`) that these are actual **saved `Query` records** with literal English names, not core Redmine's built-in unsaved default-query shortcuts — i.e. admin-entered data, not a UI translation string. Not a bug.

**Verdict:** Mostly PASS — no new bug; `BUG-INE-001` confirmed to also affect the Issues list view.

---

### TC-INE-019 — Description field's inline CKEditor (Save/Cancel buttons, success toast)

**Steps**

1. On an issue with a non-empty Description (added test content to issue #259 for this check, removed afterward), click the Edit icon next to "Beschreibung".
2. Inspect the editor's tab labels ("Bearbeiten"/"Vorschau"), toolbar tooltips, and its own action buttons.
3. Click Save and capture the resulting toast via a `MutationObserver`.

**Actual Result — FAIL**

- "Bearbeiten"/"Vorschau" tab labels, every toolbar icon's tooltip ("Fett (Ctrl+B)", "Kursiv (Ctrl+I)", "Unterstrichen (Ctrl+U)", "Durchgestrichen", etc.), and the "Zitieren" (Quote) link above the widget are all correctly German.
- The editor's own **"Cancel"**/**"Save"** buttons (`rf-btn rf-btn--ghost`/`rf-btn rf-btn--primary`) are hardcoded English.
- The post-save success toast (`div.rf-toast.rf-toast--success`) reads **"Saved successfully."** — also hardcoded English.

**Verdict:** FAIL — filed as `BUG-INE-003` (Medium): the widget's surrounding chrome (tabs, toolbar) is fully localized, but its own primary action buttons and success feedback are not — a narrow but highly-visible gap on one of the plugin's most common actions.

**Evidence:** `screenshots/BUG-INE-003/description-editor-cancel-save-untranslated.png`

---

### TC-INE-020 — "Saved successfully." toast reproduces on every inline-edit field, not just Description

**Steps** (explicitly asked: "save successfully toaster message not translated when we change each field")

1. On issue #259, inject a `MutationObserver` before each change to capture the toast (it dismisses too fast for a manual screenshot).
2. Change "Status:" via its real dropdown (In Progress → Feedback), observe the toast, then revert back to In Progress the same way.
3. Change "Priorität:" via its real dropdown (Urgent → Normal), observe the toast, then revert back to Urgent the same way.

**Actual Result — FAIL, confirms the toast is shared/global, not Description-specific**

- Both the Status change and the Priority change produce the identical **"Saved successfully."** toast — hardcoded English, same as already found on the Description editor in TC-INE-019.
- Both fields were successfully reverted to their original values afterward (In Progress / Urgent) — no lasting data change from this verification.

**Note:** an earlier attempt to change Priority by directly setting a native `<select>`'s `.value` and dispatching a synthetic `change` event (rather than using the real dropdown interaction) caused an actual save attempt with an invalid/empty value, surfacing a raw PostgreSQL `NotNullViolation` error in the toast. This was a **self-inflicted test artifact** from bypassing the widget's own option-selection mechanism, not a defect reachable by a real user through the actual UI (a real user can only ever pick one of the dropdown's real option values) — not filed as a bug. The save was correctly rejected server-side and the field's value was left unchanged.

**Verdict:** FAIL — confirms `BUG-INE-003`'s toast finding is plugin-wide (reproduces on every field using the shared inline-save flow), broadened the bug's title/scope accordingly rather than filing separately.

---

### TC-INE-021 — Project card/list view and single-project Overview page (explicitly asked: "did you tested on issue list page and project board and project list page")

**Steps**

1. Open the main Projects page (`/projects` — renders as a tiled/card layout; no separate "table view" toggle was found on this instance).
2. Click a project card's Edit icon on its Name and inspect the resulting inline input.
3. Inspect the Filter panel, "Neues Projekt"/"Administration" links, and the sidebar "Abfragen" (Queries) block links ("My bookmarks", "My projects").
4. Open a single project's own Overview page (e.g. `/projects/agileboard`) and check for any inline-edit icons there.
5. Open Administration → Projects (the admin project table) and check for inline-edit icons there.

**Actual Result — PASS, no bugs found**

- Project card view: clicking a card's Name Edit icon turns it into a plain text input, pre-selected — same save-on-Enter/cancel-on-Escape pattern as Issue Subject, no translatable strings in this control.
- Filter panel ("Filter", "Status", "ist", "aktiv", "Optionen", "Anwenden", "Zurücksetzen", "Abfrage speichern", "Filter hinzufügen"), "Neues Projekt", "Administration", and "Auch abrufbar als: Atom" — all correctly translated.
- Sidebar "Abfragen" links "My bookmarks"/"My projects" are English, but confirmed via `href` (`?query_id=5/6`) to be actual saved `Query` records (data), not a UI string — same pattern as the Issues list sidebar in TC-INE-018. Not a bug.
- A single project's own Overview page (`/projects/agileboard`) has **zero** inline-edit icons anywhere — this plugin's project-level editing is scoped entirely to the Projects list/card view, not a single project's Overview.
- Administration → Projects (the admin project table, `Name`/`Kennung`/`Beschreibung` columns, all correctly translated) also has **zero** inline-edit icons — this is a core-Redmine admin page the plugin doesn't touch.

**Verdict:** PASS — no bugs found on the project card/list view; clarified that "project table" (per the plugin's own KB description) and "project board" both resolve to the same single `/projects` card-tile page on this instance, not the admin table or a single project's Overview page, neither of which this plugin extends.

---

### TC-INE-022 — Stage 3/6: Lotus theme retest (default + 1280×720)

**Steps**

1. Switch active theme to "Redmineflux lotus".
2. At 1920×1080, re-check: the issue detail sidebar's Assignee (`rf-ss`) widget, the Description CKEditor (tabs/toolbar/Save/Cancel/toast), the Issues list view's Assignee inline edit, and the Projects page.
3. On the Projects page specifically: discovered a Lotus-only feature not visible under Default — a "Kartenansicht"/"Listenansicht" (Card view/List view) toggle, confirmed absent under Default theme by switching back and checking (`?display_type=list` URL param). The List view is the plugin's own "project table" view referenced in its KB description. Tested both.
4. Resize to 1280×720 and repeat the Assignee widget, Issues list, and Projects card view checks.

**Actual Result — mostly PASS, all existing bugs confirmed theme-agnostic; no new Agile-Board-style layout defects**

- Assignee `rf-ss` widget: renders inside Lotus's own `rf_issue_attrs_grid` column with no layout break (unlike the Agile Board plugin's Sprint/Story Points fields in `BUG-LTS-003`, since Assignee is a core Redmine field Lotus already styles) — identical "Search…"/"— None —" untranslated strings reproduce (`BUG-INE-001`), both at 1920×1080 and 1280×720.
- Description CKEditor: renders cleanly under Lotus, tabs/toolbar correctly translated, "Cancel"/"Save" buttons and the "Saved successfully." toast remain hardcoded English (`BUG-INE-003`) — confirmed theme-agnostic.
- Issues list view: clean layout at both resolutions under Lotus (horizontal scroll at 1280×720, as expected); Assignee cell's inline edit reproduces the identical `BUG-INE-001` gap.
- **New discovery**: the Projects page under Lotus shows a much richer card design (Startdatum/Abgabedatum/Kunde/Projektleiter/% Fertig progress bar/geschlossen-offen-Gesamtzahl counts/member avatars — all correctly translated) plus a "Kartenansicht"/"Listenansicht" view toggle (both button labels correctly translated) that **does not exist under Default theme at all** (confirmed by switching themes back and forth) — this rich project-browsing UI is a Lotus-theme-specific enhancement, not something missed in the earlier Default-theme pass (TC-INE-021). The "Listenansicht" (`?display_type=list`) view is the plugin's own "project table" view referenced in its KB description — its "Name"/"Kennung"/"Beschreibung" headers and Filter panel are correctly translated, and its Name field's inline edit works cleanly (plain input, no strings to check). Both card and list views render without overlap at 1280×720 too.

**Verdict:** Mostly PASS — no new Lotus-specific bugs for this plugin's own widgets (unlike Agile Board's `BUG-LTS-003`, since this plugin mostly attaches to core fields Lotus already styles). All three existing bugs (`BUG-INE-001`, `BUG-INE-002` not re-tested this pass, `BUG-INE-003`) confirmed theme-agnostic where re-checked. Corrected/expanded TC-INE-021's finding: the Lotus-only card/list toggle and its "project table" view are now covered.

**Evidence:** No new screenshots needed (no bugs found) — all checks were PASS/reconfirmations of existing bugs.

---

### TC-INE-023 — Description CKEditor's "Save" button renders oversized under Lotus theme (explicitly asked: "did you reported this bug save button size")

**Steps**

1. Under Lotus theme, open the Description CKEditor (as in TC-INE-019/008) and compare the computed `height` of its "Cancel" and "Save" buttons.
2. Switch to Default theme and repeat the same comparison on the identical editor.

**Actual Result — FAIL under Lotus, PASS under Default**

- Under Lotus: "Cancel" computes to `height: 34px`, "Save" computes to `height: 50px` — a 16px mismatch — despite both sharing identical `padding` (`15px 12px`), `border-width` (1px), `box-sizing`, and `line-height` (`18px`). The only difference found was an explicit `height` value on `.rf-btn--primary` (Save) not present on `.rf-btn--ghost` (Cancel).
- Under Default theme, on the identical editor: both buttons compute to `height: 28px` — perfectly matched.

**Verdict:** FAIL under Lotus — filed as `BUG-LTS-004` (Low) against the Lotus theme plugin (root cause is the theme's own CSS override on the primary-button variant, not a base plugin defect), cross-referenced here.

**Evidence:** `screenshots/BUG-LTS-004/description-editor-save-button-oversized.png`
