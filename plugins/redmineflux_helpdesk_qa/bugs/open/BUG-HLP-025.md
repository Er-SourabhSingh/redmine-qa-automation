# BUG-HLP-025

- Bug ID: BUG-HLP-025
- Production Redmine Issue ID: 119772
- Title: Support Level create/edit form requires manually configuring "Escalation To" even though Level Order already defines the escalation sequence
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin (`manage_helpdesk`)
- Date: 2026-09-01

## Steps to reproduce

1. On Helpdesk QA Alpha, a Support Level chain exists: L1 (Level Order 1) → L2 (Level Order 2) → L3 (Level Order 3).
2. Open L1's Edit form (`/projects/1/rf_support_levels/1/edit`).
3. Inspect the **Level Order** field and the **Escalation To** field together on the same form.

## Expected result

Per the user's stated requirement: since Support Levels already carry an explicit **Level Order** (L1=1, L2=2, L3=3 …), the escalation sequence should be automatically derived from that order — L1 escalates to the next-higher-order level (L2), L2 to L3, and so on, with the last (highest-order) level having no further escalation target. The **"Escalation To"** field should not need to be present or required in the Support Level create/edit form at all when escalation is driven by Level Order — a user should not have to manually configure a value that Level Order can already determine on its own.

## Actual result

The Support Level create/edit form has a separate, **required** "Escalation To" `<select>` field, independent of Level Order:

- `Level Order *` is a plain required number input.
- `Escalation To` is a separate required dropdown (`"None (Last Level)"`, `"L2 (Order: 2)"`, `"L3 (Order: 3)"` when editing L1) that the admin must explicitly pick every time a level is created or edited — nothing about it is auto-derived from Level Order.
- The form's own inline help text even confirms Escalation To is manually driven: *"Escalation can only be to higher level support (based on Level Order). For example, Level Order 1 can escalate to Level Order 2 or 3."* — Order is only used to validate/restrict which options Escalation To may pick from, never to compute the value automatically.
- This means every new level in a project's chain requires an extra manual step (explicitly wiring up Escalation To) that is fully redundant with information the form already has (Level Order), and creates room for user error — e.g. an admin could pick a valid-but-unintended jump-target level, or forget to set Escalation To at all, leaving a level that silently never escalates.

## Evidence

### Screenshot

![L1's Edit form: Level Order (required number field) and Escalation To (separate required dropdown) both present and independently configured](../../screenshots/BUG-HLP-025/bug-hlp-025-level-order-and-escalation-to-both-present.png)

### Console / log

- N/A — this is a form-design/UX defect, not a runtime error. Both fields save and function correctly; the issue is that two fields are required where the product's own stated design intent (Level Order defines the sequence) only calls for one.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-341. The TC's first pass concluded this was intentional, non-redundant design (Escalation To enabling genuine skip-level chains, e.g. L1 → L3 directly). **Per explicit user correction, that is not the issue being raised**: the user is not objecting to skip-level escalation as a capability — the objection is that *when escalation is meant to simply follow Level Order in sequence* (the overwhelmingly common case: L1→L2→L3, one step at a time), the admin still has to manually wire up "Escalation To" for every level, instead of the system deriving "next level by Order" automatically and only asking for manual input in the (presumably rarer) case where a non-sequential/skip-level chain is actually wanted.
- Suggested fix direction (not prescriptive — a product/dev decision): default a new/edited level's Escalation To to "the next level by Order" automatically, and make manually overriding it (for a deliberate skip-level chain) optional rather than mandatory — rather than requiring an explicit choice on every level regardless of whether the sequential default was intended.
- `HELPDESK_SLA_ESCALATION.md` TC-HLP-341 rewritten in the same session to test this corrected requirement directly and re-scored FAIL against it.
