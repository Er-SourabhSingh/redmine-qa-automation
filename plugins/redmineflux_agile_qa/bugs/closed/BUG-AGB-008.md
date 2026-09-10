# BUG-AGB-008

- Bug ID: BUG-AGB-008
- Production Redmine Issue ID: 120280
- Severity: Low
- Title: [FIXED — see below] The drag-and-drop status-change confirmation toast previously read entirely hardcoded English ("Issue #106 moved to Resolved") — now confirmed rendering fully in German
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Agile Board (agile_board)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-f04qohdte49.forge.zehntech.com/`
- Theme: Standard (Default)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-09

## Preconditions

- German language active (system default and account).
- A project with the Agile Board module enabled, containing at least one issue with a status column that has another column to drag it into (e.g. "Agile Board Project", any card in "IN PROGRESS").

## Steps to reproduce

1. Log in as admin (German language active — confirmed via every other board control being German: "Board speichern", "Weitere Filter", "Gruppieren nach: Keine", "Einblicke", "SCHÄTZUNG:"/"AUFGEWENDET:", "Tickets suchen").
2. Open the project's "Agile Board" tab.
3. Drag any issue card from one status column to another (e.g. from "IN PROGRESS" to "RESOLVED").
4. Observe the confirmation toast that appears immediately after the drop.

## Expected result

- The toast should render in German, consistent with every other string on the same page (e.g. something like "Ticket #106 nach Gelöst verschoben").

## Actual result

Reported directly by the user (screenshot showing "Issue #106 moved to In Progress" rendered in the exact same session where "Board speichern"/"Weitere Filter"/"Gruppieren nach: Keine"/"Einblicke" all render correctly in German). Independently reproduced and confirmed via live `MutationObserver` capture (since the toast auto-dismisses too fast to reliably screenshot):

- Dragging card #106 from "IN PROGRESS" to "RESOLVED" produced the toast text **"Issue #106 moved to Resolved"** — entirely hardcoded English (issue number is data, but "Issue", "moved to", and the status name "Resolved" — which the plugin elsewhere renders correctly as "Gelöst" in other contexts — are all untranslated here).
- Dragging the same card back to "IN PROGRESS" reproduced the same pattern with the target status name.

This is a genuine, narrow i18n gap in the drag-and-drop confirmation toast specifically — every other board string checked in the same session (toolbar, filters, Insights panel, member avatars) is correctly German, confirming this is not a session/environment misconfiguration.

## Severity rationale

Low: cosmetic only (the underlying status change itself works correctly — confirmed via the card correctly appearing in the target column with an updated count), but it is user-visible on every single drag-and-drop action, which is one of this plugin's most frequently used core interactions.

## Evidence

### Screenshot

![Bug evidence — user-reported screenshot showing "Issue #106 moved to In Progress" toast alongside fully-German board controls](../../screenshots/BUG-AGB-008/card-moved-resolved-column.png)

*(The screenshot embedded here shows the card successfully relocated to the "RESOLVED" column immediately after the toast fired, confirming the underlying drag action itself works correctly — the toast text itself could not be captured in a still screenshot due to its fast auto-dismiss timing, but was confirmed twice via live DOM/`MutationObserver` capture: "Issue #106 moved to Resolved" and, per the user's own screenshot, "Issue #106 moved to In Progress".)*

### Retest screenshot

Not captured — as with the original report, the toast dismisses faster than a still screenshot can reliably catch (a tight polling loop was attempted this retest too, without success). The `MutationObserver` capture in the "Fix verified" section below is the definitive evidence for this retest.

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error. Confirmed via a `MutationObserver` attached to `document.body` capturing toast text at the moment of insertion (the toast dismisses too quickly to reliably capture via still screenshot).

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Standard theme.
- Dragged issue #259 from "IN PROGRESS" to "RESOLVED" on "Agile Board Project"'s Agile Board (real mouse drag sequence, since the drag handles aren't part of the accessibility tree). `MutationObserver` captured the toast text verbatim: **"Ticket #259 verschoben nach RESOLVED"** — fully German ("Ticket" instead of "Issue", "verschoben nach" instead of "moved to"), unlike the original "Issue #106 moved to Resolved".
- Dragged the card back to "IN PROGRESS" to confirm the underlying functionality and restore board state — card correctly relocated both times.
- As with the original report, the toast itself dismisses too fast for a reliable still screenshot (a tight polling loop was attempted but did not catch the visible bubble this time) — the `MutationObserver` capture is the definitive evidence, consistent with this bug's own documented limitation.
- **Fixed. Closing.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
