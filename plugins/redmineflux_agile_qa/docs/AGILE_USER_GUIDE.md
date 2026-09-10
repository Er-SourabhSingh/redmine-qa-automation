# User Guide — Redmineflux Agile Board

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.
> Initial version derived from https://www.redmineflux.com/knowledge-base/plugins/agile-board/ — to be refined with live-confirmed UI strings/behavior during testing.

## Getting Started

1. Enable the Agile Board module on a project (Project Settings > Modules) if not already enabled.
2. Open the project's Agile Board tab, or the top-nav "Agile Board" link for the Global view, or check My Page for the personal block.

## Key Screens

- **Project Agile Board** — Kanban columns per enabled status, cards per issue.
- **Global Agile Board** — same Kanban UI, spanning all visible projects.
- **My Page Agile Board block** — personal Kanban of issues assigned to the current user.
- **Backlog** — sprint/version columns for planning, with an "unassigned issues" panel.
- **Board Settings** — Board Columns, Card Fields, WIP Limits, Board Type sections.
- **Sprint management screen** — create/edit/delete sprints.
- **Saved/custom boards list** — manage named board configurations.

## Step-by-Step Workflows

### Workflow 1: Move a card

1. Open a Kanban board.
2. Drag a card from one status column to another.
3. If the move is a valid workflow transition for the current role, the card updates; otherwise it should be rejected (exact message TBD — verify live).

### Workflow 2: Quick-edit a card

1. Double-click a card.
2. Edit subject/description inline.
3. Save.

### Workflow 3: Configure the board

1. Open board settings.
2. Adjust Board Columns / Card Fields / WIP Limits / Board Type.
3. Save.

### Workflow 4: Plan a sprint

1. Open the Backlog view.
2. Create a sprint (name, description, start/end date, duration, status, sharing).
3. Drag issues from the unassigned/backlog list into the sprint.

### Workflow 5: Save a custom board

1. Configure filters, columns, and card fields.
2. Save as a named board.
3. Reopen/edit/delete it later from the saved-boards list.

## UI Elements Reference

See `AGILE_FEATURES_LIST.md` for the full enumerated list.

## Notes & Known Behavior

- To be filled in as live testing confirms exact German strings, control placement, and any deviations from the official KB description.
