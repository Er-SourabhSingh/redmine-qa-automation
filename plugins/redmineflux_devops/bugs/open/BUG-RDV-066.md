# BUG-RDV-066 — "Assigned To" column missing from incidents list page

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-066 |
| **Severity** | Medium |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-424 |
| **Status** | Open |

## Description

The incidents list page (`/projects/phoenix-platform/devops_incidents`) does not display an "Assigned To" column. The list shows Affected Service, Severity, Status, and Started At, but the assignee is not surfaced in the list view. This makes it impossible to identify incident ownership at a glance.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents`.
2. Review the table columns in the incidents list.
3. Search for an "Assigned To" column header.

## Expected Result

- The incidents list table includes an **"Assigned To"** column.
- Each row shows the name of the user currently assigned to handle the incident.
- Unassigned incidents show "—" or blank.

## Actual Result

- No "Assigned To" column in the incidents list table.
- Columns present: Affected Service, Severity, Status, Started At.
- Assignee information is only visible after navigating into each individual incident detail page.

## Screenshot

![BUG-RDV-066 — Incidents list missing Assigned To column](../../screenshots/TC-RDV-424/tc-rdv-424-fail.png)
