# BUG-AGB-002

- Bug ID: BUG-AGB-002
- Production Redmine Issue ID: 120170
- Severity: Low
- Title: In the "Board-Einblicke" (Board Insights) panel, plural issue counts fall back to the English word "Issues" while the singular count correctly uses the German "Ticket" — a pluralization-specific translation gap
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
- A project's Agile Board with at least one status column holding a single issue and at least one holding multiple issues (to compare singular vs. plural rendering side by side).

## Steps to reproduce

1. Open the project's "Agile Board" tab.
2. Click "Einblicke" (Insights).
3. Inspect the "Workflow-Verteilung" (Workflow distribution) and "Teamauslastung" (Team utilization) sections, comparing rows with a count of exactly 1 against rows with a count greater than 1.

## Expected result

- The item-count unit word should render in German regardless of count, e.g. "1 Ticket" / "3 Tickets", consistent pluralization in the active language.

## Actual result

Confirmed via `document.createTreeWalker` text search (not just visual impression) that every row with a plural count uses the English word **"Issues"**, while every row with a singular count (exactly 1) correctly uses the German **"Ticket"**:

- "Verteilung von 7 **Issues** über Workflow-Status" (heading text, count 7)
- "NEW — 3 **Issues** (42.9%)"
- "IN PROGRESS — 2 **Issues** (28.6%)"
- "RESOLVED — 1 **Ticket** (14.3%)"
- "FEEDBACK — 1 **Ticket** (14.3%)"
- "Redmine Admin — 5 **Issues** (71.4%)" (Teamauslastung section)
- "Summer Rain — 2 **Issues** (28.6%)"

This is a clean pluralization-key defect, not a general translation gap — the surrounding sentence structure and every other label in this same panel ("Board-Einblicke", "Kennzahlen", "Workflow-Verteilung", "Teamauslastung", "Tickettypen", etc.) is correctly and fully German. The pattern (singular form translated, plural form left as the English default) strongly suggests the locale file supplies a translated `:one` key but is missing (or falls through to English for) the `:other`/plural key for this specific count string.

## Severity rationale

Low: cosmetic-only, confined to one informational panel (Board Insights) that doesn't block any workflow; the underlying counts and percentages are accurate and fully usable — only the unit word for plural counts is wrong-language.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-AGB-002/plural-issues-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-AGB-002/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a locale-pluralization-key gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme. The Einblicke panel now shows correct German plurals throughout: "Verteilung von 7 Tickets über Workflow-Status", "3 Tickets (42.9%)", "5 Tickets (71.4%)", etc. — no "Issues" strings found anywhere. **FIXED.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
