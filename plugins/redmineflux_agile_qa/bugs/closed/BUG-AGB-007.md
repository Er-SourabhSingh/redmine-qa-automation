# BUG-AGB-007

- Bug ID: BUG-AGB-007
- Production Redmine Issue ID: 120275
- Severity: Low
- Title: [FIXED — see below] On the project Settings → Sprints tab, the "Freigabe" (Sharing) column previously showed the raw untranslated enum value "not_shared" for pre-existing sprints — now confirmed showing "Nicht geteilt" correctly
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Agile Board (agile_board)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: Redmineflux lotus (also confirmed reproducing under Default theme)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- German language active.
- A project with multiple sprints, at least one created via the UI's "Sprint erstellen" form and at least one pre-existing/seeded sprint.

## Steps to reproduce

1. Navigate to the project's Settings ("Konfiguration") → "Sprints" tab (`/projects/:id/settings/sprints`) — this is also the sprint edit/delete entry point that could not be located during earlier testing (see note below).
2. Inspect the "Freigabe" column for each sprint row.
3. Click "Bearbeiten" on one of the affected rows and inspect the "Sharing" dropdown's selected option.

## Expected result

- Every sprint's "Freigabe" column should show the translated label ("Nicht geteilt", "Mit Unterprojekten", etc.), consistent across all rows — the same translation the Edit form itself correctly resolves to.

## Actual result

Confirmed via DOM text extraction (`document.body.innerText.match(/Nicht geteilt|not_shared/g)`), reproduced identically under both Lotus and Default theme:

- "QA German Sprint" (created via the UI's "Sprint erstellen" form during this test cycle): Freigabe correctly shows **"Nicht geteilt"**.
- "UI Polish" and "Bug Bash" (pre-existing/seeded fixture sprints): Freigabe shows the raw, untranslated internal value **"not_shared"**.

Opening "Bearbeiten" on "UI Polish" confirms its underlying value is genuinely the same as "QA German Sprint"'s — the Edit form's "Sharing" `<select>` shows **"Nicht geteilt"** correctly selected. This proves the Edit form's rendering path correctly resolves the value to its translated label, while the Sprints settings-tab **list** view's rendering path does not — a genuine, narrow display-only bug in the list template specifically (not a data-integrity issue, and not something that depends on how the sprint was originally created, since the identical value renders correctly in one place and incorrectly in another).

**Also correcting an earlier finding**: the Agile Board plugin's own Stage 1 testing (`AGILE_HANDOFF.md`) had noted "no UI entry point for sprint edit/delete could be located" as a functional-completeness gap. This Sprints settings tab (`/projects/:id/settings/sprints`, reached via the project's "Konfiguration" tab bar, not the Backlog view) is exactly that entry point — "Bearbeiten"/"Löschen" links exist per row, fully functional. That earlier note is now corrected; see the Agile Board plugin's own handoff/features-list for the update.

## Severity rationale

Low: cosmetic-only (the underlying data and functionality are unaffected — Edit/Delete both work correctly), and confined to a single column on an admin-only settings tab most users won't visit often — but it is a genuine, real user-facing mixed-language display, not a one-off, since it reproduces for the majority (2 of 3) of sprints on this project.

## Evidence

### Screenshot — Lotus theme

![Bug evidence — Lotus](../../screenshots/BUG-AGB-007/sprints-settings-freigabe-raw-value-lotus.png)

### Screenshot — Default theme (same defect, confirms theme-agnostic)

![Bug evidence — Default](../../screenshots/BUG-AGB-007/sprints-settings-freigabe-raw-value-default.png)

### Retest screenshot — fix verified (2026-09-09)

![Retest — both sprints now show "Nicht geteilt"](../../screenshots/BUG-AGB-007/retest-2026-09-09-freigabe-fixed.png)

### Console / log

- No related console errors; this is a hardcoded/unresolved-enum display gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Standard theme.
- Navigated to "Agile Board Project"'s Settings → Sprints tab (`/projects/agileboard/settings/sprints`). Both listed sprints — **"UI Polish" and "Bug Bash", the exact same two seeded sprints that previously showed the raw "not_shared" value** — now correctly show **"Nicht geteilt"** in the Freigabe column.
- **Fixed. Closing.**

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
