# BUG-RDV-079 — Export Release Notes blocked for Developer and QA roles

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-079 |
| **Severity** | Medium |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found In** | Suite 13 (TC-RDV-545) |
| **Date Found** | 2026-05-28 |
| **Role When Found** | Developer (dev_user), QA Engineer (qa_user) |

## Title

Export Release Notes (MD/HTML) returns HTTP 403 for roles without `manage_releases` — export should be accessible to all `view_devops` members

## Steps to Reproduce

1. Log in as `dev_user` (Developer role — has `view_devops`, does NOT have `manage_releases`).
2. Navigate to Project → DevOps → Releases → Release v3.0.0 (ID 5).
3. Observe the page loads successfully (view_devops grants read access to releases list).
4. Send a GET request to `/projects/phoenix-platform/devops_releases/5/export.md`.
5. Send a GET request to `/projects/phoenix-platform/devops_releases/5/export.html`.

Repeat steps 1–5 logged in as `qa_user` (QA Engineer role — has `view_devops` and `approve_releases`, does NOT have `manage_releases`).

## Expected Result

- Both export endpoints return HTTP 200 and serve the file download.
- Export Release Notes (Markdown and HTML) is a **read-only, view-level action** and should be accessible to any project member who has `view_devops`.
- Per the permissions matrix (TC-RDV-545): "Export is available to all roles with `view_devops`; Generate/Edit is restricted to `manage_releases`."

## Actual Result

- `GET /projects/phoenix-platform/devops_releases/5/export.md` → **HTTP 403 Forbidden**
- `GET /projects/phoenix-platform/devops_releases/5/export.html` → **HTTP 403 Forbidden**
- Both dev_user (Developer) and qa_user (QA Engineer) are blocked from exporting.
- Only users with `manage_releases` (e.g., Manager, Admin) can export.

## Impact

- Developers and QA engineers cannot share or distribute release notes even for releases they can view.
- Breaks the intended read/write separation: export is a read operation but is gated behind the write permission `manage_releases`.

## Screenshot

`screenshots/BUG-RDV-079/`

## Notes

- `Manager` (alice) with `manage_releases` can export: HTTP 200, `Content-Type: text/markdown` and `text/html` confirmed.
- The `generate_notes` endpoint (POST) correctly returns 403 for dev_user and qa_user (generate is a write action — this is correct).
- Only the export (read) action has an incorrect permission guard.
