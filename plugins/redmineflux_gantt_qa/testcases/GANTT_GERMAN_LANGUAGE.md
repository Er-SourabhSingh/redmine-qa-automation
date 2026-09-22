# Test Cases — Redmineflux Gantt Plugin — German Language Compatibility

> Scope: Stage 1 — verify the Gantt plugin's own "Flux Gantt" view renders fully in German. Default Redmine theme, German language.

## Precondition (all TCs)

- Redmine system default language AND admin account language set to German (Deutsch).
- Active theme: Default (core Redmine).
- Redmine 7.0.1.stable, redmineflux_gantt_plugin 7.0.0.
- The "Flux Gantt-Diagramm" module must be explicitly enabled per-project (Project Settings > Modules) — it is NOT on by default even on a project seemingly built for this ("Flux Gantt Project").

---

### TC-GNT-039 — Flux Gantt toolbar and column headers fully translated

**Steps**

1. Enable "Flux Gantt-Diagramm" module on a project; open its "Flux Gantt" tab.
2. Inspect the toolbar (date range, search, details dropdown, action buttons) and the left-panel column headers.

**Actual Result — mostly PASS, 2 bugs found**

- Toolbar: "DATUM VON/BIS", "SUCHE", "DETAILS" ("Alle einklappen"/"Alle ausklappen"), "+ Version hinzufügen", "Einstellungen", "Vorgänge ohne Version", "Vollbild", "Exportieren" — all correctly translated.
- Column headers: "NAME", "Zugewiesen an" — translated. "Erledigt %" — translation itself is correct and complete (confirmed via `innerText`), **but renders visually clipped as ":RLEDIGT %"** — filed as `BUG-GNT-002` (Medium).
- The vertical "Today" marker line in the timeline reads **"Today"** — untranslated, and confirmed to be hardcoded CSS-generated content (`content: "Today"` in a `::before` pseudo-element), not a template/JS string — structurally can't respond to locale under the current implementation. Filed as `BUG-GNT-001` (Low).

**Evidence:** `screenshots/BUG-GNT-001/today-marker-untranslated.png`, `screenshots/BUG-GNT-002/erledigt-column-header-clipped.png`

---

### TC-GNT-040 — Settings panel fully translated

**Steps**

1. Click "Einstellungen" (gear icon) to open the display settings panel.
2. Inspect every section: Zoom-Stufe, Anzeigemodus, "Heutigen Tag anzeigen", "ANZEIGEFELDER" checkbox list, "Benutzerdefinierte Feldspalten", "MEILENSTEIN-MARKIERUNGEN".

**Actual Result — FAIL**

- "ANZEIGEOPTIONEN", "Zoom-Stufe" ("Stunden"/"Tag"/"Woche"/"Monat"), "Anzeigemodus" ("Vollständige Woche"/"Arbeitstage"), "Heutigen Tag anzeigen", "ANZEIGEFELDER", "Benutzerdefinierte Feldspalten" (+ its empty-state message), "MEILENSTEIN-MARKIERUNGEN" (+ its empty-state message) — all correctly translated.
- Of the 5 checkboxes under "ANZEIGEFELDER" ("Zugewiesene Person anzeigen", "Fortschritt % anzeigen", "Geschätzte Stunden anzeigen", "Basislinien-Steuerung anzeigen" — all German), the fifth, **"Show Critical Path", is untranslated** — a clear partial-i18n gap proven by the 4 correctly-translated siblings in the identical list.

**Verdict:** FAIL — filed as `BUG-GNT-003` (Low).

**Evidence:** `screenshots/BUG-GNT-003/settings-panel-show-critical-path-untranslated.png`

---

### TC-GNT-041 — "Add Issue" (Vorgang hinzufügen) dialog fully translated

**Steps**

1. Click "+ Vorgang hinzufügen" and inspect every field.

**Actual Result — PASS**

- "Vorgang hinzufügen" heading, "BETREFF\*", "TRACKER", "ZUGEWIESEN AN" ("— Nicht zugewiesen —"), "VERSION / LIEFERUNG" ("— Keine —"), "ÜBERGEORDNETER VORGANG" ("Zum Suchen tippen..."), "STARTDATUM\*", "FÄLLIGKEITSDATUM\*", "GESCHÄTZTE STUNDEN\*", "Abbrechen"/"Erstellen" — all correctly translated.

**Verdict:** PASS. No bugs found.

---

### TC-GNT-042 — "Add Release/Version" (Version hinzufügen) dialog fully translated

**Steps**

1. Click "+ Version hinzufügen" and inspect every field.

**Actual Result — PASS**

- "Version hinzufügen" heading, "VERSIONSNAME\*", "BESCHREIBUNG", "STARTDATUM\*", "FÄLLIGKEITSDATUM\*", "Abbrechen"/"Erstellen" — all correctly translated.

**Verdict:** PASS. No bugs found.

---

### Observation (not a bug) — NAME column truncation

The left-panel "NAME" column truncates even short version names (e.g. "Version 1" → "Ver...") via `text-overflow: ellipsis`. Confirmed this is a resizable column (2 resize-handle elements present in the DOM) with a narrow default width — a deliberate space-saving UI choice, not a language-length-driven defect (it truncates equally regardless of language). Not filed as a bug.

---

### TC-GNT-043 — Inline "Vorgang bearbeiten" (Edit Issue) modal, opened via double-click on a timeline bar

**Steps**

1. Create a test issue (via "+ Vorgang hinzufügen") and drag it from "Vorgänge ohne Version" onto a version's timeline bar (drag-and-drop rescheduling).
2. Double-click the issue's nested timeline bar to open the inline edit modal.
3. Inspect every field and button.

**Actual Result — PASS**

- Heading "Vorgang bearbeiten", close button "Schließen", "Betreff *", "Tracker", "Zugewiesen an" (with "— Nicht zugewiesen —" + full translated assignee list), "Version / Lieferung" (with "— Keine —"), "Startdatum *", "Fälligkeitsdatum *", "Geschätzte Stunden *", "Vorgang löschen"/"Abbrechen"/"Aktualisieren" — all correctly translated.
- Drag-and-drop itself worked correctly: dragging issue #266 from "Vorgänge ohne Version" onto "Version 1" updated the version's count from "0 Vorgänge" to "1 Vorgänge" and the unassigned panel count from 8 to 7.
- Incidental finding: hovering the nested bar reveals two dependency-creation buttons, both translated — "Eingehende Abhängigkeit erstellen" (create incoming dependency) and "Ausgehende Abhängigkeit erstellen" (create outgoing dependency). Actual dependency-link creation flow itself not exercised.

**Verdict:** PASS. No bugs found.

---

### TC-GNT-044 — Delete issue via the Edit Issue modal

**Steps**

1. From the "Vorgang bearbeiten" modal (TC-GNT-043), click "Vorgang löschen".
2. Inspect the confirmation dialog, then confirm deletion.

**Actual Result — PASS**

- Confirmation dialog: heading "Vorgang löschen?", body "Dieser Vorgang wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.", buttons "Abbrechen"/"Löschen" — all correctly translated.
- Confirming deletion removed the issue; the parent version's row updated from "1 Vorgänge" to "0 Vorgänge" and displayed a translated empty-state row: "Keine Vorgänge in dieser Version".

**Verdict:** PASS. No bugs found. (A separate observation about this confirmation dialog's own "×" button accessible name was evaluated and intentionally not filed as a bug — out of scope for this visual-language cycle since the visible glyph is an untranslated-agnostic symbol, not visible text.)

---

### TC-GNT-045 — "Version bearbeiten" (Edit Version) modal

**Steps**

1. Double-click an existing version's timeline bar (used the empty "Version 4" fixture).
2. Inspect every field and button.

**Actual Result — PASS**

- Heading "Version bearbeiten", close button "Schließen", "Versionsname *", "Beschreibung", "Startdatum *", "Fälligkeitsdatum *", "Version löschen"/"Abbrechen"/"Aktualisieren" — all correctly translated.

**Verdict:** PASS. No bugs found.

---

### TC-GNT-046 — Delete a version via the Edit Version modal

**Steps**

1. From the "Version bearbeiten" modal, click "Version löschen".
2. Inspect the confirmation dialog (heading, body, buttons).
3. Cancel (fixture preserved for future sessions — deletion itself was not required to confirm the flow works, since the confirm dialog content and control wiring were already verified).

**Actual Result — PASS**

- Confirmation dialog: heading "Version löschen?", body "Diese Version wird dauerhaft gelöscht. Alle zugewiesenen Vorgänge werden versionlos.", buttons "Abbrechen"/"Löschen" — all correctly translated.

**Verdict:** PASS. No bugs found.

---

### TC-GNT-047 — Baseline creation and deletion

**Steps**

1. Open "Einstellungen" (Settings) and enable "Basislinien-Steuerung anzeigen" (Show baseline control).
2. Close Settings; a new "Basislinie" toolbar control appears with a dropdown ("Keine Basislinien"), "Basislinie erstellen", and "Basislinie löschen" buttons.
3. Click "Basislinie erstellen", fill the name field, submit.
4. Click "Basislinie löschen" on the newly created baseline, confirm.

**Actual Result — PASS**

- Toolbar: "Basislinie" label, "Keine Basislinien" dropdown option — translated.
- "Basislinie erstellen" (Create Baseline) modal: heading, close button "Schließen", "Name der Basislinie" label with placeholder "z.B. Sprint 1 Basislinie", "Abbrechen"/"Erstellen" — all translated. Creating "QA Test Baseline" succeeded and was selected in the dropdown.
- "Basislinie löschen?" confirmation dialog: close button "Schließen" (correctly translated here — see note below), heading, body "Diese Basislinie wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.", "Abbrechen"/"Löschen" — all translated. Confirming deletion succeeded, dropdown reverted to "Keine Basislinien", and a translated success toast appeared: "Basislinie gelöscht".

**Verdict:** PASS. No bugs found.

---

### TC-GNT-048 — Global Flux Gantt view (`/global_gantt`)

**Steps**

1. Navigate via the top-menu "Flux Gantt" link (not a direct URL) to the cross-project Global Gantt view.
2. Inspect toolbar, column headers, project rows, and per-project progress bars/tooltips.

**Actual Result — mostly PASS, same 2 known bugs reproduced (no new bugs)**

- Toolbar: "Gantt" heading (note: shorter than the project-level view's "Flux Gantt" heading — a labeling difference, not a translation defect, since "Gantt" is the same word in German), "Datum von/bis", "Suche", "Details" dropdown, "Einstellungen"/"Vollbild"/"Exportieren" buttons — all translated.
- Column headers: "Name", "Vorgang hinzufügen" button, "Zugewiesen an" — translated.
- Project rows show a lock icon with a translated tooltip: "Daten werden automatisch aus Unteraufgaben berechnet" (data auto-calculated from subtasks).
- Loading state message translated: "Gantt-Arbeitsbereich wird vorbereitet...".
- Dependency-creation buttons on hover ("Eingehende/Ausgehende Abhängigkeit erstellen") — translated, consistent with the project-level view.
- **BUG-GNT-001** ("Today" marker hardcoded English) and **BUG-GNT-002** ("ERLEDIGT %" header visually clipped) both reproduce identically on this view — same root cause, documented as additional affected surface in the existing bug files rather than filed as new bugs.

**Verdict:** Mostly PASS — no new defects; confirms the two existing Stage-1 bugs are plugin-wide (not page-specific).

**Evidence:** screenshot on file locally during session (not persisted — purely confirms existing bugs' scope, no new bug folder needed).

---

### TC-GNT-049 — Error/validation messages across Add/Edit dialogs (Release and Issue)

**Steps**

1. Open "+ Version hinzufügen", leave all fields empty, submit.
2. Fill only the version name, set Startdatum after Fälligkeitsdatum, submit.
3. Open "+ Vorgang hinzufügen", leave all fields empty, submit.
4. Fix Betreff only, set Startdatum after Fälligkeitsdatum with Version="— Keine —", leave Geschätzte Stunden empty, submit.
5. Open an existing issue's "Vorgang bearbeiten" modal, clear Betreff, clear Geschätzte Stunden, submit.
6. Open an existing version's "Version bearbeiten" modal, clear Versionsname, set an invalid date range, submit.

**Actual Result — PASS, all validation messages translated**

- Add Release, blank fields: "Der Versionsname darf nicht leer sein", "Startdatum ist erforderlich", "Fälligkeitsdatum ist erforderlich" — all translated.
- Add Release, invalid date range: "Das Startdatum muss vor oder gleich dem Fälligkeitsdatum liegen" — translated.
- Add Issue, blank fields: "Der Betreff darf nicht leer sein", "Startdatum ist erforderlich", "Fälligkeitsdatum ist erforderlich", "Geschätzte Stunden sind erforderlich" — all translated.
- Add Issue, invalid date range + missing hours (Version="— Keine —" to isolate from version-range constraint): "Geschätzte Stunden sind erforderlich", "Das Startdatum muss vor oder gleich dem Fälligkeitsdatum liegen" — translated.
- Edit Issue, blank Betreff + blank hours: "Der Betreff darf nicht leer sein", "Geschätzte Stunden sind erforderlich" — translated.
- Edit Version, blank name + invalid date range: "Der Versionsname darf nicht leer sein", "Das Startdatum muss vor oder gleich dem Fälligkeitsdatum liegen" — translated.
- Previously confirmed (Stage 1 first pass): the version-date-range validation error when adding an issue with dates outside the selected version's own range ("Daten müssen innerhalb des Datumsbereichs der Version liegen") — also translated.

**Verdict:** PASS. No bugs found — every validation message across both dialogs, both add and edit modes, is correctly translated.

---

### Functional finding (not a translation bug) — Version date-range edit hides assigned issues from Flux Gantt

While setting up test fixtures for TC-GNT-049 on a second Forge environment, discovered that narrowing an already-assigned version's date range so it no longer spans an issue's own dates causes the Flux Gantt view to report "0 Vorgänge" (and show the translated empty-state row) for that version, while core Redmine's own Version page simultaneously and correctly shows "2 Tickets" with both issues listed. Filed as `BUG-GNT-004` (Medium) — this is a functional/data-consistency defect found incidentally, not an i18n issue (all the strings involved are themselves correctly translated).

---

### TC-GNT-050 — Bar resizing (drag left/right edge to change start/due date)

**Environment note:** run on the second Forge server (`flux-f6nlrqpvk49`), German + Default theme, after re-establishing the same preconditions (module enabled, German language, test fixtures).

**Steps**

1. Create an issue assigned to a version with a multi-day date range.
2. Drag the bar's right-edge handle further right (attempt to extend beyond the version's own due date).
3. Drag the bar's left-edge handle left (staying within the version's date range).

**Actual Result — PASS**

- Right-edge drag past the version's boundary correctly failed server-side (`PATCH .../issues/266` → 422) with the same translated validation message confirmed earlier: "Daten müssen innerhalb des Datumsbereichs der Version liegen". The bar visually reverted since the request was rejected — correct behavior, not a bug.
- Left-edge drag within the version's range succeeded (`PATCH .../issues/266` → 200, `start_date` changed from `2026-09-30` to `2026-09-28`), and the bar visibly widened. Confirmed via a fresh network response, not just UI state.

**Verdict:** PASS. No bugs found — resizing works correctly in both the success and boundary-rejection cases, and the rejection message is translated.

---

### TC-GNT-051 — Dependency-link creation (drag from one bar's connector handle to another's)

**Steps**

1. Hover an issue bar to reveal its "Eingehende Abhängigkeit erstellen" (left handle) / "Ausgehende Abhängigkeit erstellen" (right handle) connector controls.
2. Drag from one issue's outgoing (right) handle to another issue's incoming (left) handle.
3. Inspect the popup that appears, select a relation type.
4. Confirm the relation persists and the connector line renders.

**Actual Result — mostly PASS, 1 bug found**

- The connector handles themselves are confirmed translated (`aria-label="Eingehende Abhängigkeit erstellen"` / `"Ausgehende Abhängigkeit erstellen"`).
- Dragging between handles correctly triggers a relation-type popup, and selecting a type successfully creates the relation (`POST .../relations` → 201, `{"type":"precedes"}`) with the connector line rendering correctly in the timeline.
- **The popup itself ("Link as:" label, "Relates"/"Precedes" option buttons) is completely untranslated** — filed as `BUG-GNT-005` (Medium).

**Verdict:** Mostly PASS — the underlying drag-to-link mechanic and persistence work correctly; only the popup's own strings are untranslated.

---

### TC-GNT-052 — Column header layout with "Gesch. Stunden" (Estimated Hours) column enabled

**Found via user review of a screenshot from TC-GNT-049.**

**Steps**

1. With "Geschätzte Stunden anzeigen" enabled in Settings (adds the "Gesch. Stunden" column), inspect the left-panel header row: "NAME", "ZUGEWIESEN AN", "SCH. STUN[DEN]", "ERLEDIGT %".

**Actual Result — FAIL**

- "Gesch. Stunden" visually collides with "Erledigt %", rendering as illegible merged text "SCH. STUNCERLEDIGT %".
- Confirmed via DOM: both headers' underlying text is complete/correct (translated), but the "Gesch. Stunden" column's container is fixed at 72px (`flex-shrink: 0`) while its own text needs 99px (`scrollWidth`), and despite `overflow: hidden`/`text-overflow: ellipsis` being set, the overflow visibly paints over the next column instead of being clipped.

**Verdict:** FAIL — same root cause as `BUG-GNT-002` (insufficient column width for German-length header text), folded into that bug as an additional affected variant rather than filed as a separate bug ID.

**Evidence:** `screenshots/BUG-GNT-002/estimated-hours-header-overlaps-progress-header.png`

---

### TC-GNT-048 (re-verification) — Global Flux Gantt view on the second Forge server

**Steps**

1. Navigate via the top-menu "Flux Gantt" link to `/global_gantt` on `flux-f6nlrqpvk49` (the replacement server).
2. Inspect toolbar, column headers, project rows.

**Actual Result — mostly PASS, same 2 known bugs reproduced (no new bugs)**

- Toolbar ("Datum von/bis", "Suche", "Details"/"Alle einklappen", "Vorgang hinzufügen", gear/expand/export icons), project rows (7 projects listed with translated "X Vorgänge" counts) — all translated, consistent with the first server.
- `BUG-GNT-001` ("Today" marker hardcoded English) and `BUG-GNT-002` ("ERLEDIGT %" header visually clipped) both reproduce identically here too — confirms these are genuine plugin-code defects independent of server/environment, not filed as new bugs.

**Verdict:** Mostly PASS — no new defects; re-confirms Global Gantt behavior is consistent across both Forge servers tested this session.

---

### TC-GNT-053 — Stage 2: Resolution testing (1280×720 and 1920×1080)

**Steps**

1. Resize viewport to 1920×1080 (baseline), inspect the project Flux Gantt view.
2. Resize viewport to 1280×720, re-inspect: main view, Add Issue dialog, Settings panel, and the Global Gantt view.

**Actual Result — PASS, no new resolution-specific defects**

- At 1280×720: the project top-menu (Übersicht/Dashboard/Flux Gantt/.../Konfiguration) correctly switches to a scrollable tab strip with ‹/› arrows — standard core-Redmine responsive behavior, not a plugin defect.
- The Add Issue dialog remains fully usable: it becomes an internally-scrollable modal with all labels intact ("BETREFF", "TRACKER", "ZUGEWIESEN AN", "VERSION / LIEFERUNG", "ÜBERGEORDNETER VORGANG", "STARTDATUM", "FÄLLIGKEITSDATUM", "GESCHÄTZTE STUNDEN") and the "Abbrechen"/"Erstellen" footer stays reachable.
- The Settings panel renders as a right-side sliding sheet that does not overlap the main content, all labels intact.
- The Global Gantt view degrades identically — horizontal scroll appears for the timeline rather than any breakage.
- `BUG-GNT-001`, `BUG-GNT-002`(/merged variant) reproduce identically at both resolutions — confirms these are resolution-independent, not filed as new bugs.

**Verdict:** PASS. No new resolution-specific bugs found; the plugin's responsive behavior holds up correctly at both required resolutions.

---

### TC-GNT-054 — Stage 3/6: Redmineflux Lotus theme retest

**Steps**

1. Switch active theme to "Redmineflux lotus" (Administration > Settings > Display), German language unchanged.
2. Re-inspect the project Flux Gantt view: toolbar, column headers, project sidebar nav.
3. Open Add Issue dialog, Settings panel, Edit Version modal, and its nested delete-confirmation dialog.

**Actual Result — mostly PASS, 1 new surface confirmed for an existing Lotus bug (no new Gantt bug)**

- Toolbar, column headers, Add Issue dialog, Settings panel, Edit Version modal, and delete-confirmation dialog all render correctly under Lotus — same translated labels as under Default theme, no new overlap/clipping introduced by the theme itself.
- `BUG-GNT-001` and `BUG-GNT-002` (today marker, clipped header) both still reproduce under Lotus — theme-agnostic, as already established.
- Found the project-level sidebar nav ("Hauptmenü": Übersicht/Dashboard/Flux Gantt/.../Konfiguration) clips **"Aufgewendete Zeit"** to "Aufgewendete ..." under Lotus. Confirmed via computed styles this is the same root cause as `BUG-LTS-001` (Lotus's fixed-width nav-label span too narrow for some longer German strings) but on the project nav rather than the admin nav BUG-LTS-001 originally covered — documented as an additional affected surface on that Lotus-theme bug (not a Gantt-plugin bug, and not filed as a new bug ID, since it would reproduce on any project under this theme).

**Verdict:** Mostly PASS for the Gantt plugin itself — no new plugin-specific bugs. The one finding is a Lotus theme defect, tracked under `BUG-LTS-001` in the Lotus plugin's own bug tracker.

**Evidence:** `plugins/redmineflux_lotus_qa/screenshots/BUG-LTS-001/project-sidebar-aufgewendete-zeit-clipped.png`

---

### TC-GNT-055 — Stage 6: Lotus theme + resolution testing combined (1280×720)

**Steps**

1. With Lotus theme active, resize to 1280×720 and re-inspect the main Flux Gantt view: week-range date headers, Add Issue dialog, Settings panel.
2. Compare against the same header cell's computed style under Default theme at the identical 1280×720 resolution.

**Actual Result — FAIL (1 new variant of an existing bug)**

- Add Issue dialog and Settings panel both remain fully usable and correctly translated at this combination — no new issues there.
- The timeline's own week-range header row ("31 Aug - 4 Sep, 2026", "7 Sep - 11 Sep, 2026", ...) overlaps into illegible run-together text specifically under **Lotus + 1280×720 together**:
  - Default theme @ 1280×720: header cell `clientWidth` 139px = `scrollWidth` 139px — no overflow, clean.
  - Lotus theme @ 1280×720: the identical cell (same date range) `clientWidth` 99px vs `scrollWidth` 116px — a 17px overflow, because Lotus's persistent sidebar leaves less available width per column at this viewport size.
  - Confirmed this does **not** reproduce under Lotus at 1920×1080 — it is specifically the combination of the two conditions, not either alone.
- Same root cause/failure mode as `BUG-GNT-002`'s other two variants (fixed-pixel-width header cell, declared `overflow: hidden`/`ellipsis` not actually clipping) — documented as a third variant on that bug rather than filed separately.

**Verdict:** FAIL — confirms the test plan's Stage 6 concern (Lotus + resolution combined can surface issues neither condition triggers alone). Added to `BUG-GNT-002`, not a new bug ID.

**Evidence:** `screenshots/BUG-GNT-002/week-header-overlap-lotus-1280x720.png`

## Not yet covered this session

- "Exportieren" export formats (PDF/PNG/etc. — button confirmed translated, formats not opened).
- Permission-gated behavior for "View Flux Gantt" / "View Global Gantt" roles (tested only as Admin this session).
- Dependency removal flow.
