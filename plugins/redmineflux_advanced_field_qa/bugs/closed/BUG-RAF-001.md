# Bug Report

- Bug ID: BUG-RAF-001
- Title: Plugin blocks multiple dependency rules for same parent and child field combination even with different parent values
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

1. Navigate to Administration → Advanced Field Settings → Dependency tab
2. Click "New Dependency Rule"
3. Set Parent Field: `Department`, Parent Value: `IT`, Child Field: `Location`
4. Select allowed values, click Add → rule saves successfully
5. Click "New Dependency Rule" again
6. Set Parent Field: `Department`, Parent Value: `HR`, Child Field: `Location`
7. Select Allowed Values: `Branch Office`
8. Click Add

## Expected result

- Second dependency rule saves successfully with Parent Value = `HR`
- Multiple rules coexist for the same Parent Field + Child Field pair when Parent Value differs

## Actual result (before fix)

- Alert fired: "Only one dependency rule is allowed for this Parent Field and Child Field combination."
- The Add button was preemptively disabled on the second attempt

## Root cause

The JavaScript duplicate check in `dependencies.html.erb` compared only `parent_field_id + child_field_id`, ignoring `parent_value`. The `existingDependencyPairs` array also omitted `parent_value`, so the guard fired for any second rule on the same field pair regardless of the parent value selected.

## Fix applied

**File:** `app/views/advanced_fields_settings/dependencies.html.erb`

1. Added `parent_value` to the `existing_dependency_pairs` Ruby array so it is passed to JavaScript.
2. Added `parent_value` comparison in the `hasDuplicate` JS check — a rule is only a duplicate if all three match: `parent_field_id`, `child_field_id`, AND `parent_value`.
3. Updated the alert message to match the model's error wording: "…and Parent Value combination."

**File:** `test/unit/field_dependency_test.rb`

- Replaced the incorrect test (which expected different `parent_value` to be rejected) with two tests:
  - Confirms same `parent_field + child_field + parent_value` triple IS rejected.
  - Confirms same `parent_field + child_field` with **different** `parent_value` IS valid.

## Retest evidence (2026-05-21)

- TC-RAF-022: Department=IT rule already present → added HR→Location(Branch Office) → **saved successfully, both rules listed**
- TC-RAF-023: Added Finance→Location(Branch Office, CRM) scoped to Advanced Fields Demo → **saved successfully**
- TC-RAF-024: Added Operations→Location(WAN, LAN, VPN) globally → **saved successfully, 4 rules coexist**
- TC-RAF-036: On New Issue form, Department=IT shows 3 Location options; switching to HR shows only Branch Office — no page reload → **PASS**

- Screenshot: `screenshots/BUG-RAF-001/retest-2026-05-21-finance-location-blocked.png`
