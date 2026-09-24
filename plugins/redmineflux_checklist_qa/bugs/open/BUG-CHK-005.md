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
  permission-blocked users, see `TC-CHK-092`), not a silent console-only 403 with no visible change on the page.

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
  numerous successful writes from prior sessions after this project was closed — e.g. "Checklist 'TC-CHK-078
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

## Retest — 2026-09-24

- **Result: PARTIAL FIX — core authorization gap resolved; user-feedback gap from the original Expected
  Result is still unresolved.**
- Source: none of `checklists_controller.rb` / `checklist_items_controller.rb` / their `api/` counterparts
  check `@project.closed?` (or `issue.project.status`) — every guard added checks `issue.status.is_closed?`
  (the issue's own workflow status) instead. On this retest's fixture, issue #1533's own status is `New` while
  its **project** (`checklist-perm-private`) is closed — exactly the scenario this bug reports.
- Despite the source not showing a project-level guard, the **live behavior has changed** — all three
  previously-succeeding write paths now return 403 and do not persist:
  - Create: `POST /checklists` → **403 Forbidden** (was 201). Confirmed the typed checklist was never added
    (not present in the list afterward).
  - Toggle: `PATCH /checklists/56/toggle_completed` → **403 Forbidden** (was 200). Also blocked the bulk
    variant: `PATCH /checklist_items/toggle_completed_bulk` → 403.
  - Delete: `DELETE /checklists_delete/187.json` → **403 Forbidden** (was 200). Confirmed the "dfsdfsaf"
    checklist was still present afterward — delete did not go through.
  - Add from template: already blocked pre-fix, still blocked.
  (The 403 is likely coming from a broader `edit_issues`/read-only check elsewhere in the request pipeline —
  possibly core's own `Issue#editable?`/`deny_access` now correctly seeing the project-closed state via the
  `allowed_to?(:edit_issues, @project)` calls already in these controllers — since no plugin code explicitly
  checks project status. Not fully root-caused; the point verified live is that the write no longer persists.)
- **Still broken, matching the original Expected Result's second requirement:** all four actions still fail
  **completely silently** — no flash message, no on-page error text (`document.querySelectorAll('.flash, .error,
  .errorExplanation, [class*="error"], [class*="flash"]')` returned zero elements after each blocked attempt).
  Only trace is a console-only 403, exactly as originally reported, just now happening on all four actions
  instead of only "Add from template".
- Retest screenshot: `screenshots/BUG-CHK-005/retest-2026-09-24-partial.png`.
- **Verdict:** the Critical/High-impact half of this bug (unauthorized writes succeeding on a closed project)
  is fixed. The remaining half (no user-facing feedback on a blocked action) is a UX/polish gap, not a
  security or data-integrity issue — effective severity for what remains is **Low**. Keeping this bug **open**
  rather than closing it, since the original Expected Result explicitly required visible feedback and that
  part is unmet; not filing a separate bug per `feedback_retest_verdict_against_original_scope` guidance,
  since this is the same documented expectation from the original filing, not a newly discovered defect.

## Production update — 2026-09-24

Added a note to production issue #121061 summarizing the partial-fix retest (write-authorization half fixed,
no-feedback half still open) and recommending the Priority/Defect Severity/Defect priority fields be downgraded
to reflect the reduced remaining scope. Status, priority, and done_ratio were initially left untouched.

**Then reopened** — status changed In QA → Reopen, with a note asking for the remaining no-feedback gap to be
addressed before moving it back to In QA.

## Reported by

Raised by the user, who suspected the inconsistency directly from observing the console 403 on "Add from
template" and reasoned the whole checklist section should be disabled on a closed project "in any state,"
consistent with how core Redmine treats closed projects. Investigated and confirmed with live network evidence
in this session.
