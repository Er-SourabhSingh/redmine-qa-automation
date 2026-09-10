# BUG-GNT-005

- Bug ID: BUG-GNT-005
- Production Redmine Issue ID: 120124
- Severity: Medium
- Title: The dependency-link-type selection popup ("Link as:" with "Relates"/"Precedes" buttons), shown after dragging a connector between two issue bars, is entirely untranslated
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Gantt Plugin (redmineflux_gantt_plugin)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-f6nlrqpvk49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- German language active.
- A project with the "Flux Gantt-Diagramm" module enabled, containing at least two issues with visible timeline bars.

## Steps to reproduce

1. Open the project's "Flux Gantt" tab.
2. Hover an issue's timeline bar to reveal its "Eingehende Abhängigkeit erstellen"/"Ausgehende Abhängigkeit erstellen" connector controls (small circular handles at the bar's left/right edge).
3. Drag from one issue's outgoing connector (right handle) to another issue's incoming connector (left handle).
4. Observe the popup that appears once the connector is dropped on the target bar.

## Expected result

- The relation-type popup should be translated into German, consistent with every other interactive control in this plugin (buttons, labels, tooltips, validation messages all confirmed translated elsewhere in this session).

## Actual result

Confirmed via both screenshot and the accessibility tree (`button "Relates"`, `button "Precedes"`, label text "Link as:") that this popup renders entirely in English:

- Popup label: **"Link as:"**
- Option buttons: **"Relates"**, **"Precedes"**

Selecting "Precedes" did correctly create the relation server-side (`POST .../relations` → 201, `{"relation":{"source_id":266,"target_id":267,"type":"precedes"}}`), and the dependency connector line rendered correctly in the timeline — so the underlying feature works; only this specific popup's UI strings are untranslated.

## Severity rationale

Medium: this is a small, easy-to-miss popup, but it is part of a core, actively-used feature (dependency creation) and is completely unlocalized (0 of 3 strings translated), unlike the near-total translation coverage seen everywhere else in this plugin.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-GNT-005/link-as-popup-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-GNT-005/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error. The relation creation itself succeeded (`POST /projects/fluxganttproject/flux_gantt/relations` → 201).

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, branch updated) on "Flux Gantt Project", dragging a connector between issues #241 and #242. The popup now reads **"Verknüpfen als:"** (Link as:) with buttons **"Bezieht sich auf"** (Relates) and **"Geht voraus"** (Precedes) — all fully German, confirmed via screenshot. Selecting "Geht voraus" correctly created the relation (dependency line rendered between the two bars) — functionality still works, matching the original report. **FIXED.** The connector buttons' own hover tooltips/aria-labels ("Ausgehende Abhängigkeit erstellen"/"Eingehende Abhängigkeit erstellen") were also confirmed correctly translated. Test relation removed afterward via the issue's own "Remove relation" link.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
