# Bug Report

- Bug ID: BUG-RFM-007
- Title: MCP `holiday_update` missing `is_recurring` parameter — cannot toggle recurring flag after creation
- Redmine version: Flux (dev-flux.zehntech.com)
- Plugin name: redmineflux_mcp (holiday management module)
- Plugin version: current
- Environment: dev-flux.zehntech.com
- Browser: Chromium (Playwright for UI verification)
- User role: Admin
- Date: 2026-06-12
- **Status: CLOSED — FIXED (retest 2026-06-16)**

## Steps to reproduce

1. Create a recurring holiday via MCP: `holiday_create(scheme_id=13, name="Test Recurring", date="2026-08-15", is_recurring=true, month=8, day_of_month=15)`.
2. Inspect `holiday_update` MCP tool schema.
3. Attempt to disable recurring: no `is_recurring` parameter exists in `holiday_update`.
4. Navigate to `/rf_settings` → click "Edit Holiday" on a recurring holiday → observe the Edit modal form.

## Expected result

- MCP `holiday_update` should accept `is_recurring`, `month`, and `day_of_month` parameters.
- A recurring holiday should be toggleable to non-recurring via `holiday_update(is_recurring=false)`.

## Actual result (original)

- `holiday_update` schema only accepted: `holiday_id`, `name`, `date`, `holiday_type`, `end_date`, `description`.
- No `is_recurring`, `month`, or `day_of_month` parameters existed.
- Once a holiday was set as recurring via `holiday_create`, it could not be changed to non-recurring via MCP.

## Evidence

UI Edit Holiday form fields found via Playwright:
- `INPUT/checkbox / name="rf_holiday[is_recurring]" / id="edit_holiday_is_recurring"` ✓ exists in UI

MCP `holiday_update` schema at time of bug: `{ holiday_id, name, date, holiday_type, end_date, description }` — no `is_recurring`, `month`, `day_of_month`

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

---

## Retest — 2026-06-16

**Result: FIXED**

- `holiday_update` schema now includes `is_recurring: bool | null`, `month: int | null`, `day_of_month: int | null` ✓
- Functional test:
  1. `holiday_create(scheme_id=14, name="Retest-BUG-007-Recurring", date="2026-09-01", is_recurring=true, month=9, day_of_month=1)` → holiday #30 created ✓
  2. `holiday_scheme_show(scheme_id=14)` → shows `#30 2026-09-01 | Retest-BUG-007-Recurring | national [recurring]` ✓
  3. `holiday_update(holiday_id=30, is_recurring=false)` → "Holiday updated: #30 Retest-BUG-007-Recurring on 2026-09-01" ✓
  4. `holiday_scheme_show(scheme_id=14)` → shows `#30 2026-09-01 | Retest-BUG-007-Recurring | national` (no `[recurring]` tag) ✓
- Recurring flag successfully toggled from true → false via MCP. Bug is fixed.
- Test data cleaned up (scheme #14 deleted along with holiday #30)
