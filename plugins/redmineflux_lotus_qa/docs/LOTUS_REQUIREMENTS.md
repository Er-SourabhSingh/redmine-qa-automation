# Plugin Requirements — Redmineflux Lotus Theme

## Overview

Redmineflux Lotus is a custom UI theme plugin for Redmine (confirmed installed at Administration > Plugins, `redmineflux_lotus` v7.0.0). Per its own plugin description: "Redmineflux Lotus theme delivers a modern, clean, and personalized Redmine user experience through plugin-based UI enhancements with complete theme styling." Selected via Administration > Settings > Display > Theme ("Redmineflux lotus").

Ships its own custom dashboard/home page markup and a collapsible left sidebar with fixed-width navigation items, layered on top of core Redmine, rather than only re-skinning existing core views.

## Key Features

- Custom color scheme/branding applied globally when active (teal/green accent).
- Collapsible left sidebar with logo, "Hauptmenü" navigation block, and (on admin pages) the Administration nav rendered as a fixed-width sidebar list rather than core Redmine's plain list.
- Custom home-page hero widget: date, "Willkommen, <user>" heading, tagline, "Meine Seite"/"Projekte" quick-action buttons, a decorative dashboard-preview graphic.
- Custom stat tiles row on the home page (e.g. "Meine Projekte" / "Mir zugewiesene Tickets" / "Überfällige Tickets" counts).
- Redesigned issue-detail layout: fields shown as a bulleted key-value list, a custom top action toolbar (Bearbeiten/Aufwand buchen/Nicht beobachten/Kopieren), tabs (Historie/Notizen/Checklisten-Verlauf).

## Business Workflows

Same core Redmine workflows as any theme — Lotus additionally must correctly localize its own custom-markup widgets and must not let longer German translations overflow its fixed-width sidebar/nav elements.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View all pages | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Admin panel | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Known Constraints

- The Administration sidebar nav uses a fixed-width container with `white-space: nowrap; text-overflow: ellipsis` — confirmed this clips longer German labels that fit fine in the Default theme's plain-list nav (see `BUG-LTS-001`).
- Testing environment: `https://flux-fczk00paf49.forge.zehntech.com/` (Forge)
- **Cross-environment note:** on a *different* Forge instance tested earlier in this project (`flux-fap1bpsgu49`), the home-page dashboard widgets ("Welcome, ...", "My Page", "Overdue Issues") were found completely untranslated when only the admin *account's* language was set to German. On *this* server, with **both** the system-wide default language and the account language set to German, those exact same widgets render correctly in German. This suggests the Lotus theme's dashboard widgets may read `Setting.default_language` for some strings rather than `User.current.language` — worth re-testing on the other server with the system default also set, before concluding whether that finding still holds.
