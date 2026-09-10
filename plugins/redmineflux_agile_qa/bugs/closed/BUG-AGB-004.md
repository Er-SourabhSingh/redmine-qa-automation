# BUG-AGB-004

- Bug ID: BUG-AGB-004
- Production Redmine Issue ID: 120172
- Severity: Low
- Title: On the "Neuer Sprint" (Create Sprint) form, 3 of 6 field labels are untranslated English ("Description", "End date", "Sharing"), while their siblings ("Name", "Startdatum", "Dauer", "Status") are correctly German
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

- German language active.
- A project with the Agile Board module enabled ("Agile Board Project").

## Steps to reproduce

1. Open the project's "Backlog" tab.
2. Click "Sprint erstellen" (Create Sprint).
3. Inspect every field label on the form.

## Expected result

- Every field label should render in German, consistent with the sibling labels on the exact same form that are already correctly translated ("Name", "Startdatum", "Dauer", "Status", and the "Sharing" dropdown's own option values "Nicht geteilt"/"Mit Unterprojekten"/etc., which are correctly translated core-Redmine version-sharing strings).

## Actual result

Confirmed via direct DOM query (`document.querySelectorAll('label')`) that the form shows 6 field labels, of which 3 are hardcoded English:

- **"Description"** (should mirror "Beschreibung", correctly translated elsewhere in this same plugin, e.g. the inline card-edit modal in TC-AGB-005)
- **"End date"** (should mirror "Abgabedatum", correctly translated on the Board Settings and Board-Konfiguration forms)
- **"Sharing"** (should mirror something like "Weitergabe"/"Freigabe" — notably, this field's own dropdown *options* — "Nicht geteilt", "Mit Unterprojekten", "Mit Projekthierarchie", "Mit Projektbaum", "Mit allen Projekten" — are all correctly German, since those reuse core Redmine's version-sharing i18n keys; only the field's own label was left untranslated)

Meanwhile "Name *", "Startdatum *", "Dauer" (+ "1 Woche"/"2 Wochen"/"3 Wochen"/"4 Wochen"), and "Status" (+ "Offen"/"Aktiv"/"Geschlossen") are all correctly German on the same form. The "Erstellen" submit button and the post-submit flash message "Sprint erfolgreich erstellt" are both also correctly translated.

This is a genuine partial-i18n-coverage gap, not a documentation mismatch or session misconfiguration — proven by the sibling correctly-translated labels and dropdown values on the identical form, at the same moment, under the same confirmed-German session.

## Severity rationale

Low: a form most users open only when planning a new sprint; the fields remain fully functional regardless of label language — cosmetic-only, affecting 3 labels on an otherwise well-localized form.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-AGB-004/sprint-create-form-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-AGB-004/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme. Opened "Sprint erstellen" from the Backlog — all field labels now render in German: "Name *", "Beschreibung", "Startdatum *", "Dauer", "Enddatum", "Status", "Freigabe". **FIXED.** Form cancelled without submitting (no test data created).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
