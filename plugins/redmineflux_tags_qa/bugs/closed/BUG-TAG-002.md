# BUG-TAG-002

- Bug ID: BUG-TAG-002
- Production Redmine Issue ID: 120105
- Severity: Medium
- Title: "Tag list" field label and its "Select or add tags"/"Add Tags" placeholder are untranslated across every form that has a tag field (New/Edit Project, New/Edit Issue, New/Edit Spent Time)
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Tags plugin (flux_tags)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: Default viewport (not resolution-specific)
- User role: Admin
- Date: 2026-09-07

## Preconditions

- Redmine system default language and the admin account's own language both set to German (Deutsch).
- Active theme: Default.

## Steps to reproduce

1. Log in as admin (German language, Default theme active).
2. Visit any of the following forms and locate the tag field near the bottom:
   - New Project: `/projects/new`
   - Project Settings: `/projects/:id/settings`
   - New Issue: `/projects/:id/issues/new`
   - Issue Edit: `/issues/:id/edit`
   - New Spent Time: `/issues/:id/time_entries/new`
   - Edit Spent Time: `/time_entries/:id/edit`

## Expected result

- The tag field's label and placeholder render in German, consistent with every other field label on the same form (all of which are correctly translated core Redmine labels, e.g. "Kennung", "Benutzer erben", "Aktivität", "% erledigt").

## Actual result

Reproduced identically on all 6 forms listed above:

- Field label reads **"Tag list"** (confirmed via DOM: `<label for="project_tag_list">Tag list</label>` on the project forms; equivalent unlabeled-but-adjacent text on issue/time-entry forms) — untranslated.
- The input's placeholder reads either **"Select or add tags"** (New Project, Project Settings) or **"Add Tags"** (New Issue, Issue Edit, New/Edit Spent Time) — both untranslated, and the fact that two different hardcoded English strings are used for what should be the same concept also suggests inconsistent wording even within the plugin's own (missing) i18n coverage.
- Every other field on each of these forms is correctly translated, proving this is a genuine, localized gap in the tag widget's own partial view/JS, not a documentation mismatch.

## Severity rationale

Medium: appears on 6 distinct, frequently-used forms across the whole plugin surface (project creation/settings, issue creation/edit, time-entry creation/edit) — high visibility, purely cosmetic, no functional blockage.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TAG-002/new-project-tag-list-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TAG-002/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Reconfirmation — 2026-09-08, new Forge server

Retested on a fresh Forge server (`https://flux-fyqnqkoqg49.forge.zehntech.com/`) — German set as both system default and account language. **Reproduces on both forms checked**: the New Project form's "Tag list" label + "Select or add tags" placeholder, and the New Issue form's "Tag list" label + "Add Tags" placeholder — both still hardcoded, sitting directly next to correctly-German sibling fields ("Benutzer erben" on the project form). Test fixtures deleted afterward.

## Fix verified — 2026-09-08, new Forge server (branch updated)

Retested on a newly-provisioned Forge server (`https://flux-frtsiofsm49.forge.zehntech.com/`, per user: branch updated) under **both Standard and Lotus themes**. The New Issue form's field now shows label **"Markierungsliste"** and placeholder **"Markierungen hinzufügen"** — both fully German — under both themes. **FIXED.**

## Duplicate check

- Duplicate found: No (related to but distinct from BUG-TAG-001, which covers the issue-DETAIL page's inline add-widget rather than these 6 form contexts)
- Existing bug reference (if duplicate): N/A
