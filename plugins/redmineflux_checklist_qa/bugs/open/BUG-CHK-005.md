# Bug Report

- Bug ID: BUG-CHK-005
- Production Redmine Issue ID: #121061
- Title: Checklist CRUD (create, toggle, delete) is NOT blocked on a closed/read-only project — only "Add from template" is; plugin doesn't consistently follow core Redmine's read-only enforcement
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Checklist Plugin
- Plugin version: 7.0.0
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-22

## Steps to reproduce

1. Close a project (Actions → Close, or the project's Close link).
2. Open any issue in that closed project. Confirm the "This project is closed and read-only." banner is showing.
3. In the Checklist section, try each of the following in turn:
   a. Click **New checklist**, type a title, press Enter.
   b. Tick/untick an existing top-level checklist's checkbox.
   c. Delete a checklist via its Actions → Delete.
   d. Click **Add from template**.
4. Observe the resulting network request and page behavior for each.

## Expected result

- Per Redmine core's own read-only enforcement for closed projects (issues, notes, attachments, custom fields
  cannot be edited once a project is closed): **every** checklist write action should be consistently blocked —
  or consistently allowed, if that's a deliberate design choice — not a mix of the two.
- Whichever the plugin's actual policy is, a blocked action should give the user clear feedback (a flash message
  or disabled control with an explanatory tooltip — the same pattern already used elsewhere in this plugin for
  permission-blocked users, see `TC-CHK-314`), not a silent console-only 403 with no visible change on the page.

## Actual result

Tested all four actions live on the same closed project/issue (project `checklist-perm-private`, issue #1533,
confirmed closed via its "This project is closed and read-only." banner) and captured the actual network
responses:

| Action | Endpoint | Result |
|---|---|---|
| Create a new top-level checklist | `POST /checklists` | **201 Created** — succeeded |
| Toggle an existing checklist's checkbox | `PATCH /checklists/:id/toggle_completed` | **200 OK** — succeeded |
| Delete a checklist | `DELETE /checklists_delete/:id.json` | **200 OK** — succeeded |
| Add from template | `GET /checklists/new_from_template?issue_id=:id` | **403 Forbidden** — blocked |

- Three of the four write paths **fully succeed** on a project explicitly marked closed and read-only — new
  checklists and items can be created, existing items can be toggled done/undone, and checklists can be deleted,
  all with real, persisted writes (each produced its own Checklist History journal entry). This directly
  contradicts the project's own read-only status and Redmine core's guarantee that a closed project cannot be
  edited.
- Only the "Add from template" action is blocked, and even that blocked case gives **no visible feedback to the
  user** — clicking it does nothing observable on the page; the only trace is a console entry: `Failed to load
  resource: the server responded with a status of 403 (Forbidden) @
  http://localhost:3010/checklists/new_from_template?issue_id=1533`. A user would have no idea why nothing
  happened.
- This project's own Checklist History (viewable at `/issues/1533?tab=checklist_history`) already contains
  numerous successful writes from prior sessions after this project was closed — e.g. "Checklist 'TC-CHK-912
  closed project write attempt' was added by Redmine Admin", multiple status-change entries — confirming this is
  not a one-off fluke of this test but a consistent, reproducible gap.
- Net effect: the plugin does not apply a uniform `@project.closed?` (or equivalent) guard across its
  controllers/actions. It should follow the same approach Redmine core uses for closed projects — block all
  content-mutating actions consistently — rather than gating only one specific action while leaving the rest of
  the checklist CRUD surface fully writable.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CHK-005/closed-project-checklist-still-editable.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CHK-005/retest-yyyy-mm-dd-pass.png)

### Console / log

- `Failed to load resource: the server responded with a status of 403 (Forbidden) @
  http://localhost:3010/checklists/new_from_template?issue_id=1533:0` — the only feedback for the one blocked
  action, and it's developer-console-only, not user-facing.
- Network tab, same session, same closed project (issue #1533): `POST /checklists` → 201, `PATCH
  /checklists/56/toggle_completed` → 200, `DELETE /checklists_delete/189.json` → 200.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked `bugs/_duplicates.md` and `bugs/_index.md` before filing.
  Not the same as `BUG-CHK-002` (XSS) or `BUG-CHK-004` (duplicate journal entries) — different mechanism
  entirely (a missing authorization/state check, not an escaping or event-handling bug).

## Reported by

Raised by the user, who suspected the inconsistency directly from observing the console 403 on "Add from
template" and reasoned the whole checklist section should be disabled on a closed project "in any state,"
consistent with how core Redmine treats closed projects. Investigated and confirmed with live network evidence
in this session.
