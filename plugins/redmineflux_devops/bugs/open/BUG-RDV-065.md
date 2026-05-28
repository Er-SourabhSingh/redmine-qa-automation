# BUG-RDV-065 — Developer role can access New Incident form — manage_incidents permission not enforced

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-065 |
| **Severity** | High |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-452 |
| **Status** | Open |

## Description

A user with the Developer role (which does not have the `manage_incidents` permission) can access the New Incident creation form at `/projects/phoenix-platform/devops_incidents/new` and receives HTTP 200. The `manage_incidents` permission is not enforced on the `new` and `create` controller actions. This is consistent with the RBAC enforcement failures observed in BUG-RDV-050 (DORA Metrics) and BUG-RDV-059 (Security Vulnerabilities).

## Steps to Reproduce

1. Using dev_user (Developer role, API key: `2309f6ea9f3335476ebc78cf241cc27c8da0e12e`).
2. Send GET request:
   ```
   GET http://localhost:3008/projects/phoenix-platform/devops_incidents/new
   X-Redmine-API-Key: 2309f6ea9f3335476ebc78cf241cc27c8da0e12e
   ```
3. Observe HTTP response code.

## Expected Result

- Developer role does not have `manage_incidents` permission.
- Request returns HTTP 403 Forbidden.
- User is redirected to an access denied page.

## Actual Result

- Response: **HTTP 200 OK**.
- The New Incident form is fully rendered and accessible to the Developer role.
- The `authorize` or `require_permission` check for `manage_incidents` is missing from the `new`/`create` actions.

## Screenshot

![BUG-RDV-065 — Developer role can access New Incident form (should return 403)](../../screenshots/BUG-RDV-065/bug-rdv-065-developer-accesses-new-incident-form.png)
