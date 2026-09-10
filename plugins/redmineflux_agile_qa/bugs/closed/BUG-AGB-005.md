# BUG-AGB-005

- Bug ID: BUG-AGB-005
- Production Redmine Issue ID: 120173
- Severity: Low
- Title: Backlog view's sprint date ranges and version due-dates render in hardcoded English month format ("Sep 08 - Sep 21, 2026", "Fällig: Sep 30, 2026") instead of the German-localized date format core Redmine uses for the identical date elsewhere
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
- The project's "Backlog" tab (Sprints and Versionen sub-tabs), with at least one sprint and one version having dates set.

## Steps to reproduce

1. Open the project's "Backlog" tab.
2. On the "Sprints" sub-tab, inspect each sprint column header's date range.
3. Switch to the "Versionen" sub-tab and inspect each version's "Fällig:" (due) date.
4. For comparison, open the project's core-Redmine "Roadmap" page and inspect the same version's due date there.

## Expected result

- Dates should render in the German-localized format that core Redmine itself uses for the identical date under the same session — confirmed on the Roadmap page as `Fällig in 22 Tagen (30.09.2026)` (DD.MM.YYYY), not an English month abbreviation.

## Actual result

Confirmed via DOM query (`document.querySelectorAll('.sprint-dates')`) that every date shown in the Backlog view uses a hardcoded English format:

- Sprint date ranges: `"Sep 01 - Sep 11, 2026"`, `"Sep 12 - Sep 21, 2026"`, `"Sep 08 - Sep 21, 2026"`
- Version due dates: `"Fällig: Sep 30, 2026"` (×2, one per version column)

The same version's due date, viewed on the project's own core-Redmine Roadmap page in the same session, correctly renders as `"Fällig in 22 Tagen (30.09.2026)"` — proving this is a genuine plugin-specific date-formatting gap (the plugin hardcodes a JS date formatter rather than using Redmine's user/locale date-format setting), not a session misconfiguration.

## Severity rationale

Low: dates remain unambiguous and readable (day/year still present, month abbreviation is close enough to guess), and no workflow is blocked — cosmetic/localization-consistency issue, but it affects every sprint and version shown in this view, so noted here rather than folded into the narrower `BUG-AGB-004`.

## Evidence

### Screenshot

![Bug evidence — sprint dates](../../screenshots/BUG-AGB-005/backlog-sprint-dates-english-format.png)

![Bug evidence — version due date](../../screenshots/BUG-AGB-005/backlog-version-due-date-english-format.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-AGB-005/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded date-formatting gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme. Confirmed via `document.querySelectorAll('.sprint-dates')` on the Backlog view: sprint date ranges now read "01.09.2026 - 11.09.2026" / "12.09.2026 - 21.09.2026", and version due-dates read "Fällig: 30.09.2026" — all German DD.MM.YYYY format, no English month abbreviations. **FIXED.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
