# BUG-RDV-070 — Blank affected_service accepted on incident creation, defaults to "Unknown Service"

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-070 |
| **Severity** | Medium |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-449 |
| **Status** | Open |

## Description

The incident creation form accepts an empty/blank `affected_service` value without validation error. When submitted with a blank `affected_service`, the incident is created successfully and the field is defaulted to "Unknown Service". The `affected_service` field should be required (as it is the primary incident identifier, per BUG-RDV-060), and the form should reject submission with a validation error when this field is empty.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents/new`.
2. Leave the "Affected service" field blank.
3. Fill in Severity and Status fields with valid values.
4. Click "Create Incident".

## Expected Result

- Form submission is rejected with a validation error: "Affected service can't be blank".
- The incident is not created.
- The user is shown the form again with the error highlighted.

## Actual Result

- Form is submitted successfully.
- Incident is created with `affected_service = "Unknown Service"` (or similar default).
- No validation error is shown.
- The incident appears in the list with "Unknown Service" as its name.

## Screenshot

![BUG-RDV-070 — Blank affected_service accepted, incident created with Unknown Service](../../screenshots/TC-RDV-449/tc-rdv-449-fail.png)
