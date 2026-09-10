# BUG-AGB-003

- Bug ID: BUG-AGB-003
- Production Redmine Issue ID: 120171
- Severity: Low
- Title: Unassigned-issue avatar tooltip ("?" placeholder) reads "Unassigned" in English on the Backlog view, breaking the Redmine-wide convention of "Nicht zugewiesen" used elsewhere (e.g. the Add/Edit Issue "Zugewiesen an" dropdown)
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
- The Backlog view (or Agile Board), with at least one unassigned ticket visible.

## Steps to reproduce

1. Open the project's "Backlog" tab (or the Agile Board itself).
2. Locate an unassigned ticket's card — its assignee avatar renders as a "?" placeholder.
3. Inspect the "?" avatar's `title` attribute (hover tooltip).

## Expected result

- The tooltip should read the German "Nicht zugewiesen", consistent with every other unassigned-related string across this same Redmine instance (e.g. the Gantt and Dashboard plugins' own "— Nicht zugewiesen —" dropdown default, and core Redmine's own issue-assignee field).

## Actual result

Confirmed via DOM query (`document.querySelectorAll('[title]')`) that the "?" avatar element carries `title="Unassigned"` — hardcoded English — with CSS classes `jira-assignee-avatar jira-unassigned` (both instances found on the Backlog's "Kein Sprint"/"Keine Version" ticket lists read the same).

## Severity rationale

Low: a single hover-tooltip string on an avatar placeholder icon; does not block any workflow and is easy to miss since it only appears on hover.

## Additional affected surfaces

- **Global Agile Board** (`/agile_board/global`): the same `title="Unassigned"` (class `jira-assignee-avatar jira-unassigned`) reproduces on an unassigned card there, confirmed via the same DOM query. Confirmed 2026-09-08.
- **My Page Agile Board block**: not applicable to check — every ticket shown in this block belongs to the logged-in user (assigned/created/watched), so no unassigned card was present to test against.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-AGB-003/unassigned-tooltip-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-AGB-003/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap in a `title` attribute, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-f04qohdte49.forge.zehntech.com/`) under Standard theme. Created a fresh unassigned test issue (#266) to reproduce the precondition (no unassigned issues existed by default) — confirmed via DOM that the avatar's `title` attribute now reads **"Nicht zugewiesen"** (was "Unassigned"). **FIXED.** Test issue deleted afterward.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
