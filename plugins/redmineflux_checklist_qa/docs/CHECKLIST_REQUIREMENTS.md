# Plugin Requirements — Redmineflux Checklist Plugin

## Overview

Redmineflux Checklist Plugin (confirmed installed at Administration > Plugins, `redmineflux_checklist` v7.0.0). Per its own plugin description: "Enhance Redmine effortlessly manage task lists within issues, track progress, ensure completion, and boost productivity."

## Key Features

- "Checkliste" section on the issue detail sidebar, with a "..." actions menu offering "Neue Checkliste" (add checklist item) and "Aus Vorlage hinzufügen" (add from template).
- Each checklist item shows a checkbox, its own progress bar, and supports adding sub-items via an inline "Neues Checklisten-Element:" form.
- Admin-level "Checklisten-Vorlagen" (Checklist Templates) under Administration > Plugins > Redmineflux Checklist Plugin, with per-tracker templates (Tracker type, Template name, one or more named sub-checklists with items).
- Admin settings tab ("Allgemein"): "Ticket-Schließung blockieren" (block issue closing until checklist complete), "Ticket-Fortschritt automatisch aus Checklisten berechnen" (auto-calculate issue progress from checklists).
- Checklist add/create actions generate a journal/activity entry on the issue.

## Business Workflows

- Add a checklist item (optionally from a template) to an issue, add sub-items, check them off, track progress via the per-item progress bar and (if enabled) the issue's own % done.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View checklist | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Add/edit checklist items | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage templates (admin) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Known Constraints

- Testing environment: `https://flux-fczk00paf49.forge.zehntech.com/` (Forge)
