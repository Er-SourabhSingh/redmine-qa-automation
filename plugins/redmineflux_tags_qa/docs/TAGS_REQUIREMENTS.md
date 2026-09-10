# Plugin Requirements — Redmineflux Tags plugin

## Overview

Redmineflux Tags is a tagging plugin for Redmine (confirmed installed at Administration > Plugins, `flux_tags` v7.0.0). Per its own plugin description: "Streamline project management tasks using Redmineflux Tag Plugin for categorize and retrieve information efficiently with tags." Adds a "Tags" field to the issue detail view and a "Tags" filter option to Projects/Issues list filters.

## Key Features

- "Tags:" field on the issue detail sidebar, with an inline "Add"/edit widget (tag-it-based autocomplete input + Save/Cancel).
- "Tags" available as a filter field on Projects list and Issues list ("Filter hinzufügen" / Add filter dropdown).

## Business Workflows

- Add/remove tags on an issue via the inline Tags widget on the issue detail page.
- Filter issues/projects by tag via the list filter panel.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View tags | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Add/edit tags | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

## Known Constraints

- Testing environment: `https://flux-fczk00paf49.forge.zehntech.com/` (Forge)
