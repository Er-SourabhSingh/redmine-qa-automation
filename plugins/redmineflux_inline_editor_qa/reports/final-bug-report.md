# Final Bug Report — Redmineflux Inline Editor

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 6     | 0        | 0    | 5      | 1   |

## Open Bugs

### BUG-INE-005 (Medium) — Inline editor's issue-list Subject field bypasses the 255-character length validation the standard Edit form enforces

The issue list's Subject inline-edit endpoint (`PUT /issues/:id/update_field.json`) accepts and persists a
5,000-character value with a clean `200 OK` and no truncation. The standard Edit form's own model validation
correctly rejects the same value with "Subject is too long (maximum is 255 characters)." The inline path bypasses
a validation the standard path enforces, and the oversized subject visibly breaks the issue list's table layout.

See `bugs/open/BUG-INE-005.md` for full repro steps and evidence.

### BUG-INE-006 (Medium) — Issue-list view shows an edit pencil for a workflow-Read-only custom field and reports "Changes saved successfully." even though the write is silently dropped

A custom field made Read-only by a Workflow → Fields permissions rule (role Developer, tracker Bug, status New)
correctly shows no inline-edit pencil on the issue detail page, but the issue list renders one for the same
field/issue/role. Submitting a value returns `200 OK`, and the response's own echoed `custom_fields` array
confirms the value was never actually applied (stays blank) — so the underlying data is protected — but the
client displays a false "Changes saved successfully." toast for this no-op write, misleading the user.

See `bugs/open/BUG-INE-006.md` for full repro steps and evidence.

### BUG-INE-007 (Medium) — After an inline Status change, a field's edit pencil can stay stuck hidden even though the new status makes it editable — only a full page reload fixes it

With Subject marked Read-only at "In Progress" via Workflow → Fields permissions, moving an issue to that status
correctly hides Subject's inline pencil. But after reloading the page while at that read-only status, then
inline-changing Status back to one where Subject has no restriction (e.g. "New"), the pencil stays stuck hidden —
the field appears permanently un-editable even though it genuinely isn't. Only a full page reload makes it
reappear. Reproduced consistently 3 times as Admin.

See `bugs/open/BUG-INE-007.md` for full repro steps and evidence.

### BUG-INE-008 (Medium) — Inline Description save reports "Saved successfully." after the user's edit permission was revoked, although the change is silently discarded

A Developer has the inline Description editor open. Admin then revokes the Developer role's "Edit issues"
permission, and the Developer clicks Save. The description save goes through Redmine's standard update action and
returns `302`. The description is silently left unchanged and no journal is added, so the data is protected. The
plugin nevertheless shows a green "Saved successfully." toast. Field edits under the same revocation correctly
get `403` and an error toast; only the description path loses the refusal. Reproduced 3 times.

See `bugs/open/BUG-INE-008.md` for full repro steps and evidence.

### BUG-INE-009 (Medium) — An open inline editor keeps saving after the user's session has ended, because the plugin authenticates with the user's API key embedded in the page

With an inline editor still open, the user's session is ended (cookie removed, matching a real timeout or a
sign-out elsewhere). Submitting the still-open editor still succeeds (`200`, "Saved successfully.") and the
change persists, because the plugin sends every save with `X-Redmine-API-Key`, a personal key embedded in every
page's HTML, independent of the session cookie. Reloading confirms the session really is gone (redirect to
login), yet the write went through. Reproduced twice.

See `bugs/open/BUG-INE-009.md` for full repro steps and evidence.

### BUG-INE-010 (Low) — Issue detail page loads Redmine's jstoolbar scripts twice, throwing a console SyntaxError on every load

The plugin unconditionally injects Redmine's own `jstoolbar` scripts into every page's `<head>` regardless of
whether core already loads them. On the issue detail page, core already includes them for its own Edit form, so
they load twice, throwing `SyntaxError: Identifier 'lastJstPreviewed' has already been declared` on every load.
No observed functional break — confirmed in Chrome, Edge and Firefox alike.

See `bugs/open/BUG-INE-010.md` for full repro steps and evidence.

## Environment

- Redmine Version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Test Date: 2026-09-23
