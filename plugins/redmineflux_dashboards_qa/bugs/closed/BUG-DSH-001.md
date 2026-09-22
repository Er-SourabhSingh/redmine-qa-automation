# BUG-DSH-001

- Bug ID: BUG-DSH-001
- Production Redmine Issue ID: 120144
- Severity: Low (dropped from High 2026-09-09; **fully resolved 2026-09-09** — see second Fix verified section below)
- Title: [FIXED — see below] Every string documented in this bug, across the dashboard shell, Add Chart modal, chart card controls, Chart Settings panel (all 3 sections), toasts, validation errors, info tooltip, delete-confirmation dialog, and the public Share Link view, is now correctly German
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (redmineflux_dashboard)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-f6nlrqpvk49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- Redmine system default language AND admin account language both set to German (Deutsch) — confirmed via `document.documentElement.lang === "de"` and every core-Redmine nav item on the same page rendering correctly in German ("Übersicht", "Aktivität", "Roadmap", "Tickets", "Aufgewendete Zeit", "Kalender", "Dokumente", "Wiki", "Dateien", "Konfiguration", etc.).
- A project's "Dashboard" tab (no module enablement required).

## Steps to reproduce

1. Log in as admin with German language active (confirmed via core Redmine UI already being fully German).
2. Open any project's "Dashboard" tab (e.g. `/projects/fluxganttproject/analytics_dashboard`).
3. Inspect every visible string on the page.

## Expected result

- Every plugin-owned string should render in German, consistent with the surrounding core Redmine chrome on the exact same page.

## Actual result

Confirmed via `document.body.innerText` (not just visual impression) that the following plugin-owned strings render in **English**, despite the page's own `<html lang="de">` and fully-German core navigation:

- Page heading: **"Analytics Dashboard"**
- Header controls: **"Share"**, **"OFF"** (auto-refresh toggle state)
- Auto-refresh interval dropdown options: **"30 sec"**, **"1 min"**, **"2 min"**, **"5 min"**, **"10 min"** (all 5 options)
- Global filter bar labels: **"Tracker:"**, **"Date Range:"**
- Tracker dropdown default option: **"All Trackers"**
- Date Range dropdown's own last option: **"Custom Range"**
- Apply button: **"Apply"**
- Filter-bar action icons: **"Refresh"**, **"Fullscreen"**
- Add Chart button: **"Add Chart"**
- Tooltip text (accessible name via `aria-label`/title, confirmed via accessibility tree): **"Generate Public Share Link"** (on the Share button), **"Enable/Disable Auto Refresh"** (on the OFF toggle)
- Empty-state heading: **"No Charts Added"**
- Empty-state instruction: **"Click "Add Chart" button above to add your first chart"**

The **only** translated plugin-owned strings found on this page are the Date Range dropdown's other 7 preset options: "Heute", "die letzten 7 Tage", "die letzten 30 Tage", "die letzten 90 Tage", "aktueller Monat", "voriger Monat", "aktuelles Jahr" — all correctly German. This is itself further proof the defect is genuine and not a session/environment misconfiguration: within the exact same `<select>` element, 7 of 8 options are properly localized while the 8th ("Custom Range") and every other plugin-owned string on the page is not — the plugin's i18n coverage is real but overwhelmingly incomplete, covering only a small fraction of its own UI.

## Additional affected surface — "Add New Chart" modal (confirmed 2026-09-07)

Clicking "Add Chart" opens a modal where the same pattern continues — every plugin-owned string is untranslated:

- Modal heading: **"Add New Chart"**
- Subheading: **"Core Analytics Dashboard"**, **"22 chart queries + 5 saved queries available"**
- Tabs: **"Our Queries (22)"**, **"Saved Queries (5)"**
- Field label: **"Query Type:"**
- Search placeholder: **"Search query types..."**
- Chart type names in the list (spot-checked the first 5 of 22): **"Issues by Status"**, **"Issues by Tracker"**, **"Issues by Priority"**, **"Issues by Assignee"**, **"Issues by Assignee (Stacked by Status)"**
- Field label + hint: **"Chart Title (optional):"**, placeholder **"Leave empty to use query name"**
- Primary action button: **"Add"**

Notably, this modal's **"Abbrechen"** (Cancel) button IS correctly translated — while "Add" (its sibling primary button, in the same button row) is not. This is consistent with the rest of this bug's evidence: wherever this plugin happens to reuse a shared/core Redmine locale key (a generic "Cancel" button, or the Date Range preset values noted above), German renders correctly; every string the plugin defines itself is left as hardcoded English. This confirms the defect is a near-total absence of this plugin's own i18n coverage, not a session or environment misconfiguration.

## Additional affected surface — chart card icon row and Chart Settings panel (confirmed 2026-09-07)

After adding a chart ("Issues by Status"), the same total-absence-of-translation pattern continues:

- Chart card icon row (all 5 icons, confirmed via accessible name): **"Copy Chart"**, **"Fullscreen"**, **"Chart Information"**, **"Settings"**, **"Remove"**.
- Resize-handle accessible names: **"Drag to resize width"**, **"Drag to resize height"**, **"Drag to resize both"**.
- The entire "Chart Settings" panel (opened via the Settings icon): modal heading **"Chart Settings"**; section headers **"GENERAL"** and **"DATA FILTERS"**; field labels **"Chart Title"**, **"Legend Position"** (value **"Bottom"**), **"Show Data Labels"** (value **"Hide"**), **"Custom Date Range"** (+ hint **"Leave empty to use global date filter"**, shown twice), **"Start Date"**, **"End Date"**, **"Clear Custom Dates"**, **"Issue Status"** (+ hint **"Select up to 15 statuses"**), **"AVAILABLE STATUSES"**, **"SELECTED STATUSES"**; footer buttons **"Cancel"**, **"Save Settings"**.

The panel's **"Appearance"** section (below "Data Filters") continues the same pattern: **"Top Accent Color"**, **"Pick Color"**, **"Hex Code"**, hint text **"This color appears as a bar at the top of the chart card"**, **"Chart Color Palette"**, **"Select a Pre-built Palette"**, hint **"Select a palette above or create custom"**, buttons **"Create Custom Palette"** / **"Clear Colors"**, hint **"Selected colors will be used for chart data series in order"**. (The palette names themselves — "Modern", "Pastel", "Vibrant", "Professional", "Earth Tones", "Ocean" — are arguably proper-noun-style labels and may not need translation; noted for completeness but not counted as defects in their own right.)

This confirms the defect spans the entire plugin surface tested so far — the dashboard shell, the Add Chart modal, the chart card controls, and all three sections of the chart configuration panel (General, Data Filters, Appearance) are affected with no meaningful exception beyond the couple of shared-core-component strings already noted.

## Additional affected surface — success toasts, validation error, and info tooltip content (confirmed 2026-09-07)

Per explicit request, also checked success/error feedback messages and tooltip popover content — the same pattern continues with no exception:

- **Success toasts** (captured live via `MutationObserver`, since they auto-dismiss): clicking "Copy Chart" produces a toast reading **"Chart copied to clipboard"**; clicking "Save Settings" (with a valid form) produces a toast reading **"Settings saved successfully"**. Both untranslated.
- **Inline validation error**: in the Chart Settings panel's Custom Date Range fields, setting an End Date earlier than the Start Date displays an inline error reading **"End date cannot be earlier than start date"** — untranslated. (Separately, this same click also fired the "Settings saved successfully" toast despite the validation error blocking the save — a possible success/error logic inconsistency worth a follow-up functional check, not counted as an i18n defect in its own right.)
- **"Chart Information" tooltip popover** (opened via the ℹ icon on a chart card): heading **"Calculation Method"**; body text **"Shows total count of issues grouped by their current status:"** plus 5 bullet points (e.g. **"Date Filter: Uses created_on date (when issue was created)"**, **"Data Source: Issues created within selected date range"**, **"Groups by current status (New, In Progress, Resolved, etc.)"**, **"Shows top 15 statuses or all selected statuses (if status filter applied)"**, **"Respects global tracker filter and per-chart status, priority, assignee, version filters"**); section heading **"Active Filters"**; labels **"Tracker:"**, **"Period:"**, **"Issue Status:"**; value **"All Issues"**. Untranslated (only the "Period:" value itself, "die letzten 30 Tage", is translated, inherited from the global filter — consistent with the rest of this bug).
- **"Delete Chart Container?" confirmation dialog** (opened via the Remove icon): heading **"Delete Chart Container?"**; body **"Once you delete this chart container, it cannot be restored. All related chart data and configurations will be permanently removed."**; buttons **"Cancel"**, **"Delete"**. Untranslated. Cancelled without confirming, to preserve the fixture chart for future sessions.

## Severity rationale

High: this is not an isolated missed label — it is nearly the entire UI surface of a major, frequently-used plugin tab (the page heading, every header control, both filter-bar labels, the primary call-to-action button, and the empty-state message a brand-new user sees first). A German-language user opening this tab for the first time encounters almost no localized plugin content at all, which is a materially worse experience than the isolated single-label gaps found in other plugins this cycle.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-DSH-001/dashboard-shell-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-DSH-001/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a missing-i18n-coverage defect, not a JS error. Confirmed via `document.body.innerText` full-page text extraction, cross-checked against `document.documentElement.lang`.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme, on "Agile Board Project"'s Dashboard tab. Systematically re-checked every surface documented in this bug via `document.body.innerText`, DOM attribute dumps (`title`/`aria-label`/`placeholder`), and a live `MutationObserver` for toasts:

- **Dashboard shell**: "Analyse-Dashboard" (heading), "Teilen" (Share), "AUS" (auto-refresh toggle), all 5 interval options ("30 Sek."–"10 Min."), "Tracker:"/"Zeitraum:" filter labels, "Alle Tracker", **"Benutzerdefinierter Zeitraum"** (previously the one untranslated Date Range option — now fixed), "Anwenden", "Diagramm hinzufügen", "Aktualisieren"/"Vollbild" icons, empty-state heading + instruction — **all correctly German**.
- **Tooltips/accessible names**: "Öffentlichen Freigabelink erzeugen", "Automatische Aktualisierung ein-/ausschalten" — both fixed. Even the color-picker swatch names/hex-color names (e.g. "Modern", "Kräftig", "#4CAF50 - Grün") are translated.
- **Add New Chart modal**: heading "Neues Diagramm hinzufügen", subheading "Kern-Analysen Dashboard" + query count text, tabs "Unsere Abfragen (22)"/"Gespeicherte Abfragen (5)", "Abfragetyp:" label, all 22 chart type names (spot-checked), "Diagrammtitel (optional):" + placeholder, search placeholder "🔍 Abfragetypen suchen …" — **all fixed**. Only the primary **"Add"** button remains English (its sibling "Abbrechen" is correctly German).
- **Chart card controls**: all 5 icon tooltips ("Diagramm kopieren", "Vollbild", "Diagramminformationen", "Einstellungen", "Entfernen") and all 3 resize-handle names — **all fixed**.
- **Chart Settings panel** (all 3 sections): "Diagrammeinstellungen" heading; General section — "Diagrammtitel", "Position der Legende" (+ all 4 values), "Datenbeschriftungen anzeigen" (+ both values), "Benutzerdefinierter Zeitraum", "Startdatum"/"Enddatum", "Benutzerdefinierte Daten löschen", the "Leave empty..." hint (shown twice); Data Filters section — "Ticket-Status", "Bis zu 15 Status auswählen", "Verfügbare Status"/"Ausgewählte Status"; Appearance section — "Akzentfarbe oben", "Farbe wählen", "Hex-Code", "Farbpalette des Diagramms", "Vorgefertigte Palette auswählen", "Eigene Palette erstellen", "Farben zurücksetzen" — **all fixed**. Footer "Abbrechen"/"Einstellungen speichern" fixed. Only 2 hint texts remain English: **"This color appears as a bar at the top of the chart card"** and **"Selected colors will be used for chart data series in order"**.
- **Toasts** (captured live via `MutationObserver`): "Diagramm in die Zwischenablage kopiert" (was "Chart copied to clipboard") and "Einstellungen erfolgreich gespeichert" (was "Settings saved successfully") — **both fixed**.
- **Inline validation error**: "Das Enddatum darf nicht vor dem Startdatum liegen" (was "End date cannot be earlier than start date") — **fixed**.
- **Chart Information tooltip popover**: heading "Berechnungsmethode", full body text, all 5 bullet points, "Aktive Filter" section with "Tracker:"/"Zeitraum:"/"Ticket-Status:" labels and "Alle Tickets" value — **all fixed**.
- **Delete Chart Container confirmation dialog**: heading "Diagramm-Container löschen?", full body text, "Abbrechen"/"Löschen" buttons — **all fixed**.

**Verdict: this bug is almost entirely fixed.** Of the ~60+ individual strings originally documented as untranslated, only 3 remain: the "Add" button in the Add New Chart modal, and 2 hint/helper texts in the Chart Settings panel's Appearance section. Severity dropped from High to Low accordingly — narrowing the bug's scope rather than closing it, since a genuine (if now very small) gap remains. Test chart created and deleted during this retest; theme/language left as Standard/German per session convention.

### Retest screenshot — remaining findings only (2026-09-09)

![Add New Chart modal — everything German except the "Add" button](../../screenshots/BUG-DSH-001/retest-2026-09-09-add-button-still-english.png)

![Chart Settings panel, Appearance section — everything German except the "This color appears..." hint](../../screenshots/BUG-DSH-001/retest-2026-09-09-appearance-hints-still-english.png)

## Additional affected surface — public Share Link view (found 2026-09-09, not part of the original TC-DSH-049–005 sweep)

The "Share" feature itself (the "Dashboard teilen" modal, its body text, "Kopieren"/"Schließen" buttons) is fully translated. However, the **public shared dashboard page the link opens** (`/public/analytics_dashboard/<token>`, no login required) has its own, separate set of untranslated strings not covered by the earlier retest of the authenticated view:

- **"LIVE"** badge (`span` inside `.live-indicator-badge`) — untranslated.
- **Header date-range summary** (`.header-date-info`): renders as **"Aug 11 - Sep 09, 2026"** — hardcoded English month abbreviations, instead of the German DD.MM.YYYY format used everywhere else in this plugin (e.g. the authenticated dashboard's own filters).
- **Per-chart date-range subtitle** (`.chart-date-range`, shown under each chart's title): renders as **"2026-08-11 to 2026-09-09"** — the connector word "to" is English, and the format doesn't match German conventions either.

By contrast, on this same public page, the auto-refresh controls are correctly translated ("EIN"/"AUS", "30 Sek."–"10 Min.", "Nächste: 9 Min. 21 Sek."), the chart title itself ("Tickets nach Status") is correctly German, and both chart-card icon tooltips ("Automatische Aktualisierung ein-/ausschalten", "Diagramminformationen") are correctly German — confirming this is a genuine, narrow i18n gap specific to the "LIVE" badge and the two date-range display strings, not a wholesale untranslated page.

This surface was never tested in the original bug (the "public Share Link flow" was explicitly noted as untested in `DASHBOARDS_HANDOFF.md`'s "In Progress" section) — found now while verifying the Share feature at the user's request.

### Screenshot — public share view, "LIVE" badge and date ranges untranslated

![Public share view — LIVE badge and both date-range displays still English](../../screenshots/BUG-DSH-001/retest-2026-09-09-public-share-view-english-dates.png)

### Unrelated observation (not a translation bug, flagged for a functional follow-up)

While testing this flow, the live dashboard briefly had 2 duplicate "Tickets nach Status" chart cards after a single "Add" click — likely a leftover test artifact from this session (both live dashboard and its public mirror showed the same duplicate, confirming the share view faithfully mirrors live state rather than being duplicated by the share mechanism itself). Not reproduced deliberately or confirmed as a genuine double-submit bug; both charts were removed and the dashboard restored to empty. Worth a deliberate repro attempt (rapid double-click on "Add") in a future functional-testing pass, not filed as a bug here since it wasn't confirmed as reproducible.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-fdrk6suoj49.forge.zehntech.com/`, German, Standard theme), on "Flux Gantt Project"'s Dashboard tab. Re-checked every remaining finding from the previous retest:

- **Add New Chart modal's primary button**: now reads **"Hinzufügen"** (was "Add"). Confirmed via a fresh chart creation ("Tickets nach Status") — modal fully German end-to-end.
- **Chart Settings panel, Appearance section, both hint texts**: "Diese Farbe erscheint als Balken am oberen Rand der Diagrammkarte" (was "This color appears as a bar at the top of the chart card") and "Die ausgewählten Farben werden in dieser Reihenfolge für die Datenreihen des Diagramms verwendet" (was "Selected colors will be used for chart data series in order") — **both now fully German**.
- **Public Share Link view** (`/public/analytics_dashboard/<token>`): the **"LIVE" badge now reads "ECHTZEIT"**; the **header date-range summary now renders "11.08.2026 - 09.09.2026"** (German DD.MM.YYYY format, was "Aug 11 - Sep 09, 2026"); the **per-chart date-range subtitle now renders "11.08.2026 bis 09.09.2026"** (German format + "bis" connector, was "2026-08-11 to 2026-09-09") — **all three now fully German**.
- Delete Chart Container confirmation dialog re-confirmed fully German ("Diagramm-Container löschen?", full body text, "Abbrechen"/"Löschen") while cleaning up the test chart fixture.

**Verdict: every string ever documented in this bug is now correctly translated.** Of the ~60+ originally-untranslated strings, zero remain. **Fully fixed. Closing.** Test chart created and deleted during this retest; theme/language left as Standard/German per session convention.

### Retest screenshot — fully fixed (2026-09-09)

![Add New Chart modal — Hinzufügen button now German](../../screenshots/BUG-DSH-001/retest-2026-09-09-add-button-fixed.png)

![Chart Settings panel, Appearance section — both hints now German](../../screenshots/BUG-DSH-001/retest-2026-09-09-appearance-hints-fixed.png)

![Public share view — ECHTZEIT badge and both date ranges now German](../../screenshots/BUG-DSH-001/retest-2026-09-09-public-share-view-fixed.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
