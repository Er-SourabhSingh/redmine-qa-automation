# BUG-GNT-003

- Bug ID: BUG-GNT-003
- Production Redmine Issue ID: 120122
- Severity: Low
- Title: "Show Critical Path" checkbox in the Gantt Settings panel is untranslated, while its 4 sibling checkboxes in the same list are all correctly translated
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Gantt Plugin (redmineflux_gantt_plugin)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- German language active.
- A project with the "Flux Gantt-Diagramm" module enabled.

## Steps to reproduce

1. Open the project's "Flux Gantt" tab.
2. Click "Einstellungen" (Settings, gear icon) to open the settings panel.
3. Inspect the "ANZEIGEFELDER" (Display fields) checkbox list.

## Expected result

- Every checkbox label in this list should render in German, consistent with its four siblings in the exact same list: "Zugewiesene Person anzeigen", "Fortschritt % anzeigen", "Geschätzte Stunden anzeigen", "Basislinien-Steuerung anzeigen" — all confirmed correctly translated.

## Actual result

The fifth checkbox in this same list reads **"Show Critical Path"** — untranslated English — while every other checkbox in the identical list, rendered in the same panel at the same time, is correctly German. This is a genuine partial-i18n-coverage gap (proven by the sibling inconsistency), not a documentation or expectation mismatch.

## Severity rationale

Low: a single checkbox label in an options panel that is not open by default; cosmetic only, does not affect the underlying Critical Path feature's function.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-GNT-003/settings-panel-show-critical-path-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-GNT-003/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, branch updated). The Settings panel's checkbox now reads **"Kritischen Pfad anzeigen"** (German), confirmed via screenshot, consistent with its 4 correctly-translated siblings. **FIXED.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
