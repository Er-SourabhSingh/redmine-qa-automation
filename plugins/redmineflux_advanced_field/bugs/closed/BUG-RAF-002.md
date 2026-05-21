# Bug Report

- Bug ID: BUG-RAF-002
- Title: Issue edit blocked by validation error on integer formula field receiving float value from server-side calculation
- Redmine version: 6.0.9.stable
- Plugin name: Redmineflux Advanced Field
- Plugin version: 0.1.0
- Environment: Forge
- Browser: Chromium (Playwright)
- User role: Admin
- Date found: 2026-05-20
- Severity: High
- Status: **FIXED**
- Fix date: 2026-05-21
- Retest date: 2026-05-21
- Retest result: **PASS — Confirmed fixed**

## Steps to reproduce (original)

1. Create an Integer-type custom field (e.g., `Bug002 Repro`)
2. Configure a Divide (A ÷ B) formula: target = Bug002 Repro, A = Estimate, B = Extra Hours
3. Create an issue with Estimate = 10, Extra Hours = 3 — issue saves successfully
4. Open the issue for edit (`/issues/:id/edit`)
5. Change any non-formula field (e.g., Priority) and click Submit

## Expected result

- Issue saves successfully; no validation error for the formula-calculated field

## Actual result (before fix)

- Rails validation error: **"Bug002 repro is not a number"**
- Issue edit permanently blocked

## Root cause

`field_calculator.rb`'s `divide` operation returns a Ruby Float (e.g., `3.33`). `set_cf_value` stores this as the string `"3.33"` in the `custom_values` table using `save(validate: false)`, bypassing Rails type validation. On the next issue edit, Redmine validates all custom field values including the stored `"3.33"` against the Integer field type, which fails.

## Fix applied

**File:** `lib/redmineflux_advanced_fields/field_calculator.rb`

In `calculate_and_store`, after computing the formula result, look up the target field's `field_format`. If it is `'int'`, round the result to the nearest integer before storing:

```ruby
if result.present?
  target_field = CustomField.find_by(id: formula.target_field_id)
  result = result.to_f.round if target_field&.field_format == 'int'
end
```

This ensures `10 / 3 = 3` (not `"3.33"`) is stored for Integer-type targets, keeping all subsequent Rails validations passing.

## Retest evidence (2026-05-21)

- Created Integer field `Bug002 Repro` (ID 11) + Divide formula (Estimate ÷ Extra Hours)
- Created issue #274 with Estimate=10, Extra Hours=3
- After save: Bug002 Repro displayed **3** (correctly rounded, not 3.33)
- Opened issue #274 for edit → Bug002 Repro showed **3** in the disabled input
- Changed Priority to High, clicked Submit → **"Successful update."** — no validation error
- Screenshot: `screenshots/BUG-RAF-002/bug-raf-002-retest-pass.png`
