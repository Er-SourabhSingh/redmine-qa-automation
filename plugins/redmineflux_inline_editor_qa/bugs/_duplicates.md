# Duplicate Bug Register — Redmineflux Inline Editor

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| Detail page: workflow Read-only core field (Subject) or custom field `cf_69` save → 200 + "Saved successfully.", value dropped (TC-INE-057/094/006) | `update_field.json` returns 200 when core filters a disallowed attribute; the client treats any 2xx as success | BUG-INE-006 |
| Forbidden status transition via inline Status → 200 + "Saved successfully.", status unchanged (TC-INE-095) | Same as above | BUG-INE-006 |
