# BUG-RDV-062 — No "Add Entry" button for manual timeline entries on incident detail page

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-062 |
| **Severity** | High |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-002 (rfd-031) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-429 |
| **Status** | Open |

## Description

The incident detail page provides no mechanism for users to manually add entries to the incident timeline. There is no "Add Entry", "Add Note", or equivalent button visible on the incident detail page. The timeline is append-only via system events (auto-created entries on status change, acknowledgement, etc.) with no user-facing control to add a custom entry.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents/1`.
2. Review the incident detail page and the timeline section.
3. Search for any button or control to add a manual timeline entry.

## Expected Result

- An **"Add Entry"** (or equivalent) button is visible in the Timeline section.
- Clicking it opens a form to enter a custom timeline note/entry.
- After submission, the new entry appears in the timeline with the current timestamp and the submitting user's name.

## Actual Result

- No "Add Entry" button or control exists anywhere on the incident detail page.
- The timeline section only shows system-generated entries.
- DOM search confirms: no button/input with text matching "Add Entry", "Add Note", or "Add Timeline".

## Screenshot

![BUG-RDV-062 — Incident detail page timeline section with no Add Entry button](../../screenshots/BUG-RDV-062/bug-rdv-062-no-add-entry-button.png)
