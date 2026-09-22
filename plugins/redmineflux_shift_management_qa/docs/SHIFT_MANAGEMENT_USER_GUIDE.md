# User Guide — Redmineflux Shift Management

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.
> Scaffolded incidentally 2026-09-22 — not a full onboarding pass. See `SHIFT_MANAGEMENT_HANDOFF.md`.

## Getting Started

## Key Screens

## Step-by-Step Workflows

### Workflow 1: [Name]

1.
2.
3.

## UI Elements Reference

## Notes & Known Behavior

- The plugin loads its own JS asset (`shift_management-*.js`) globally, on every page of the Redmine instance
  (confirmed via `document.scripts` on an unrelated core admin page), not only on the plugin's own screens —
  see `BUG-SFM-001`.
