# Plugin Requirements — Redmineflux Gantt Chart

## Overview

Redmineflux Gantt Plugin (confirmed installed at Administration > Plugins, `redmineflux_gantt_plugin` v7.0.0). Displays project schedules, tasks, and dependencies visually. Ships its own custom "Flux Gantt" view, distinct from core Redmine's built-in Gantt chart ("Gantt-Diagramm").

## Key Features

- Project-level "Flux Gantt" tab (requires the "Flux Gantt-Diagramm" module enabled in Project Settings > Modules — separate from the core "Gantt" module) at `/projects/:id/flux_gantt`.
- Global "Flux Gantt" view from the top nav at `/global_gantt`.
- Toolbar: date range picker ("DATUM VON/BIS"), search field ("SUCHE"), details/expand-collapse selector ("DETAILS" — "Alle einklappen"), "+ Version hinzufügen" (Add Release/Version), settings gear icon, list/fullscreen/external-link icons.
- Left panel: "NAME" column, "+ Vorgang hinzufügen" (Add Issue) button, "ZUGEWIESEN AN" (Assignee) column, "% erledigt"/"ERLEDIGT %" (Progress) column.
- Right timeline area: date grid, a "Today" vertical marker line, release/version rows (expandable via ▶ arrow), per-row action buttons.

## Business Workflows

Same as documented in the official knowledge base (https://www.redmineflux.com/knowledge-base/plugins/gantt-chart/, fetched 2026-09-07) — see `GANTT_FEATURES_LIST.md` for the full 115+-item feature inventory.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View Flux Gantt | ✓ | ✓ (role permission) | ✓ (role permission) | ✓ (role permission) | ✗ | ✗ |
| View Global Gantt | ✓ | ✓ (role permission) | ✓ (role permission) | ✗ | ✗ | ✗ |

## Known Constraints

- The "Flux Gantt-Diagramm" module must be explicitly enabled per-project (Project Settings > Modules) before the project-level "Flux Gantt" tab appears — it is NOT enabled by default even on projects seemingly built for Gantt testing (confirmed: had to enable it manually on "Flux Gantt Project").
- The widget appears to use a virtualized/dynamically-reflowed DOM (column headers and row content shift between queries), making exact DOM/CSS inspection of some elements unreliable — `innerText`/screenshot comparison is a more reliable evidence method than `querySelectorAll` for some elements in this plugin.
- Testing environment: `https://flux-fczk00paf49.forge.zehntech.com/` (Forge)
