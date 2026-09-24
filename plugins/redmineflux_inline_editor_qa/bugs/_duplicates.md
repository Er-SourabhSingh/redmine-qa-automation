# Duplicate Bug Register — Redmineflux Inline Editor

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| Detail page: workflow Read-only core field (Subject) or custom field `cf_69` save → 200 + "Saved successfully.", value dropped (TC-INE-057/094/006) | `update_field.json` returns 200 when core filters a disallowed attribute; the client treats any 2xx as success | BUG-INE-006 |
| Forbidden status transition via inline Status → 200 + "Saved successfully.", status unchanged (TC-INE-095) | Same as above | BUG-INE-006 |
| Any inline save on the issue list (and reportedly issue detail/project pages) after the BUG-INE-009 fix landed → native browser Basic-Auth "Sign in" popup, save hangs on "Saving…" | Server log: `Current user: anonymous` + `Filter chain halted as :check_if_login_required` → `401` on `update_field.json`, despite a valid session cookie and a successful request 5s earlier on the same session | BUG-INE-009 (regression, consolidated 2026-09-24 rather than filed as a separate bug — same session-vs-API-key authentication mechanism) |
