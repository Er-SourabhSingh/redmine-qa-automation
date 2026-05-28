# BUG-RDV-069 — No journal or timeline entry created after sending communication template

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-069 |
| **Severity** | Medium |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-006 (rfd-119) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-446 |
| **Status** | Open |

## Description

When a communication template update is sent via the incident comms modal (`/projects/phoenix-platform/devops_incidents/{id}/comms`), no journal or timeline entry is created on the incident to record that a stakeholder communication was sent. The communication is processed (the modal closes and the action appears to succeed), but there is no audit trail entry showing who sent the communication, which template was used, or when it was sent.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents/1`.
2. Open the communication template modal (via the "Send Update" or communications button).
3. Select a template (e.g. "SEV1 Stakeholder Update"), click Preview, then click "Send Update".
4. After the modal closes, check the incident timeline for a new entry.

## Expected Result

- A timeline/journal entry is created: "Communication sent — Template '[template name]' sent by [user] at [timestamp]".
- The entry is visible in the incident timeline immediately after sending.

## Actual Result

- The communication modal closes after sending.
- No new timeline entry appears on the incident.
- No journal record is created for the communication event.
- The communication action is invisible in the incident audit history.

## Screenshot

![BUG-RDV-069 — Incident detail page with no journal entry after communication template sent](../../screenshots/BUG-RDV-069/bug-rdv-069-no-journal-after-comms.png)
