# BUG-RDV-068 — Post-mortem Root Cause section shows placeholder text, not pre-filled from incident root_cause field

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-068 |
| **Severity** | Medium |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-004 (rfd-095) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-435 |
| **Status** | Open |

## Description

When a post-mortem wiki page is auto-generated from an incident, the **Root Cause** section of the post-mortem is populated with a placeholder string (e.g. `[Root cause to be determined]` or similar) rather than being pre-filled with the `root_cause` value already entered on the incident. The other sections (Summary, Timeline, Action Items) are correctly pre-populated from incident data, but the Root Cause data is not carried over from the incident's `root_cause` field.

## Steps to Reproduce

1. Create an incident with a non-empty `root_cause` value (e.g. "Database connection pool exhausted due to missing index on queries table").
2. Navigate to the incident detail page.
3. Click the "Generate Post-Mortem" action button.
4. Open the generated wiki page and inspect the Root Cause section.

## Expected Result

- The Root Cause section of the generated post-mortem wiki page is pre-filled with the value from the incident's `root_cause` field.
- Example: if `root_cause = "Database connection pool exhausted"`, the wiki section reads: "## Root Cause\n\nDatabase connection pool exhausted".

## Actual Result

- The Root Cause section shows a generic placeholder text instead of the incident's stored root_cause value.
- The `root_cause` field on the incident record has a value, but the post-mortem generation template does not interpolate it.

## Screenshot

![BUG-RDV-068 — Post-mortem Root Cause shows placeholder not pre-filled from incident](../../screenshots/TC-RDV-435/tc-rdv-435-partial.png)
