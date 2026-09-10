# BUG-GNT-001

- Bug ID: BUG-GNT-001
- Production Redmine Issue ID: 120120
- Severity: Low
- Title: The Gantt chart's "Today" vertical-line marker label is hardcoded English CSS-generated content, structurally untranslatable via Redmine's normal i18n
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
- A project with the "Flux Gantt-Diagramm" module enabled (e.g. "Flux Gantt Project").

## Steps to reproduce

1. Log in as admin (German language active).
2. Enable the "Flux Gantt-Diagramm" module on a project (Project Settings > Modules), if not already enabled.
3. Open the project's "Flux Gantt" tab.
4. Locate the vertical line marking the current date in the timeline area.

## Expected result

- The marker's label should read in German (e.g. "Heute"), consistent with every other label on this toolbar ("DATUM VON/BIS", "SUCHE", "DETAILS", "ZUGEWIESEN AN", etc., all correctly translated).

## Actual result

The label reads **"Today"** — untranslated. Confirmed via computed style inspection, not just visual impression:

```css
.rf-gantt-today-line::before { content: "Today"; }
```

The string is a literal, hardcoded value in a CSS `::before` pseudo-element's `content` property — not rendered through any Ruby/ERB template or JS locale lookup. This means the string is **structurally incapable of responding to the active Redmine locale** under the plugin's current implementation; simply adding a German translation key elsewhere in the plugin would not fix this without also changing how this specific label is rendered (e.g. moving it from CSS to a JS/template-driven label that can call the locale-aware string).

## Severity rationale

Low: cosmetic-only, a single short label, functionality (today's position in the timeline) is unaffected. Rated slightly notable due to its structurally-untranslatable implementation, which is worth flagging distinctly from a typical missed-locale-key bug.

## Additional affected surface (confirmed 2026-09-07)

Also reproduced on the **Global Flux Gantt view** (`/global_gantt`, reached via the top-menu "Flux Gantt" link) — the same "Today" label with the same hardcoded CSS `::before` content appears in the cross-project timeline. Same root cause, not a separate bug.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-GNT-001/today-marker-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-GNT-001/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a CSS content-property i18n gap, not a JS error.

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, branch updated) under both Standard and Lotus themes. The marker now reads **"Heute"** (German) in both themes, confirmed via screenshot on the project's Flux Gantt view. **FIXED.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
