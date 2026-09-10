# Bug Report

- Bug ID: BUG-RFM-006
- Title: MCP `holiday_scheme_create` and `holiday_scheme_update` missing `description` parameter
- Redmine version: Flux (dev-flux.zehntech.com)
- Plugin name: redmineflux_mcp (holiday management module)
- Plugin version: current
- Environment: dev-flux.zehntech.com
- Browser: Chromium (Playwright for UI verification)
- User role: Admin
- Date: 2026-06-12
- **Status: CLOSED — FIXED (retest 2026-06-16)**

## Steps to reproduce

1. Inspect `holiday_scheme_create` MCP tool schema — parameters: `name`, `is_active` only.
2. Inspect `holiday_scheme_update` MCP tool schema — parameters: `scheme_id`, `name` only.
3. Navigate to `/rf_settings` → click "Add Holiday Scheme" → observe the Create modal form.
4. Navigate to `/rf_settings` → click "Edit" on any scheme → observe the Edit modal form.

## Expected result

- MCP `holiday_scheme_create` should accept a `description` parameter, matching the UI field `rf_holiday_scheme[description]`.
- MCP `holiday_scheme_update` should accept a `description` parameter so descriptions can be set or changed.
- Schemes created with a description via the UI should have that description readable via MCP.

## Actual result (original)

- `holiday_scheme_create` had no `description` parameter — descriptions could not be set at creation time via MCP.
- `holiday_scheme_update` had no `description` parameter — descriptions could not be updated via MCP.

## Evidence

UI form fields found via Playwright (`document.querySelectorAll('input, textarea')`):
- Create form: `TEXTAREA / name="rf_holiday_scheme[description]" / placeholder="Optional description"` ✓ exists in UI
- Edit form: `TEXTAREA / name="rf_holiday_scheme[description]" / id="edit_scheme_description"` ✓ exists in UI

MCP tool schema at time of bug (holiday_scheme_create): `{ name: string, is_active: bool }` — no description
MCP tool schema at time of bug (holiday_scheme_update): `{ scheme_id: int, name: string }` — no description

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

---

## Retest — 2026-06-16

**Result: FIXED**

- `holiday_scheme_create` schema now includes `description: string` ✓
- `holiday_scheme_update` schema now includes `description: string` ✓
- Functional test: `holiday_scheme_create(name="Retest-BUG-006-Scheme", description="This is a test description for BUG-006 retest")` → scheme #14 created ✓
- `holiday_scheme_update(scheme_id=14, description="Updated description via retest BUG-006")` → updated ✓
- UI verification: `/rf_settings` Description column for scheme #14 shows "Updated description via retest BUG-006" ✓
- Test data cleaned up (scheme #14 deleted)
