# Duplicate Bug Register — Redmineflux Crux

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| Top-menu "Crux"/"Agents" visible to a user with no `view_crux` permission, who then gets a 403 on click | NOT a duplicate of BUG-CRX-005 (that's the admin toggle's own mislabeling, fixed) or BUG-CRX-012/022 (those fixed the controllers' own missing permission checks). This is the leftover gap: the menu's `:if` proc was never updated to also require `view_crux` once the controllers started enforcing it. | BUG-CRX-047 |
| "Register an agent" (create or edit) always fails with a false ID-format error, even on an already-valid, unmodified id | Not a duplicate of any prior bug — root cause is a single broken regex (`/A[a-z0-9][a-z0-9-]*z/` missing `\A`/`\z`) in `agent_form_errors`, confirmed via source, first found on the new Redmine 6 instance | BUG-CRX-048 |
| Crux Settings page flash message's bottom border cut off | Not a duplicate of BUG-CRX-035 (that was unstyled plain-text messages — this one IS properly styled/colored, just has an edge-rendering glitch) | BUG-CRX-049 |
