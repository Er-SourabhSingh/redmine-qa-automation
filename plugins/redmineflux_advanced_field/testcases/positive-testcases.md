# Positive Test Cases — Redmineflux Advanced Field

## Plugin
- Name: redmineflux_advanced_field
- Version: release/0.1.0
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_advanced_field

---

## Functional Cases

---

### TC-RAF-001: Admin creates Float custom field for Downtime

**User Role:** Admin
**Precondition:** Admin is logged in. Redmineflux Advanced Field plugin is installed and enabled.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Float"
4. Enter Name: `Downtime (minutes)`
5. Leave other fields as default
6. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- Field is visible in Advanced Field Settings

---

### TC-RAF-002: Admin creates Date & Time custom field for issues

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Date & Time"
4. Enter Name: `Incident Start Time`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- Field is visible in Advanced Field Settings

---

### TC-RAF-003: Admin creates second Date & Time custom field for formula source

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Date & Time"
4. Enter Name: `Incident Resolution Time`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- Field is visible in Advanced Field Settings

---

### TC-RAF-004: Admin creates List custom field for dependency parent

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "List"
4. Enter Name: `Department`
5. Add values: `IT`, `HR`, `Finance`, `Operations`
6. Click Save

**Expected Result:**
- Custom field saves successfully
- All list values are saved
- Field appears in Advanced Field Settings as eligible parent field

---

### TC-RAF-005: Admin creates List custom field for dependency child

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "List"
4. Enter Name: `Location`
5. Add values: `Server Room`, `Branch Office`, `Data Center`, `CRM`, `ERP`, `Billing`, `WAN`, `LAN`, `VPN`
6. Click Save

**Expected Result:**
- Custom field saves successfully
- All list values are saved
- Field appears in Advanced Field Settings as eligible child field

---

### TC-RAF-006: Admin creates Text custom field for sequence target

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Text"
4. Enter Name: `Incident ID`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in Advanced Field Settings as eligible sequence target field

---

### TC-RAF-007: Admin creates Float custom field — Estimate

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Float"
4. Enter Name: `Estimate`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- Field is visible in Advanced Field Settings as formula-eligible

---

### TC-RAF-007A: Admin creates Float custom field — Extra Hours

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Float"
4. Enter Name: `Extra Hours`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- Field is visible in Advanced Field Settings as formula-eligible

---

### TC-RAF-007B: Admin creates Float custom field — Total Hours

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Float"
4. Enter Name: `Total Hours`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- This field is the dedicated output for the Add (A + B) formula in TC-RAF-011

---

### TC-RAF-007C: Admin creates Float custom field — Duration (hours)

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Float"
4. Enter Name: `Duration (hours)`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field appears in the Issues custom fields list
- This field is the dedicated output for the Date Difference (hours) formula in TC-RAF-010

---

### TC-RAF-007D: Admin creates Float custom fields for formula type tests

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**

Create each of the following Float fields one at a time (repeat New Custom Field → Float → Save for each):

1. Name: `Subtract Result`
2. Name: `Multiply Result`
3. Name: `Divide Result`
4. Name: `Condition GT Result`
5. Name: `Condition LT Result`
6. Name: `Condition EQ Result`

**Expected Result:**
- All six Float custom fields save successfully
- Each field serves as the exclusive Calculated Field target for one formula type test (TC-RAF-012 through TC-RAF-017)
- One dedicated field per formula type ensures no two formulas share the same target, preventing calculation conflicts at issue creation

---

### TC-RAF-007E: Admin creates List custom field — Environment

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "List"
4. Enter Name: `Environment`
5. Add values: `Production`, `Development`, `Staging`
6. Click Save

**Expected Result:**
- Custom field saves successfully
- All list values are saved
- Field is eligible as a Visibility Rule trigger field

---

### TC-RAF-007F: Admin creates Text custom field — Components

**User Role:** Admin
**Precondition:** Admin is logged in.

**Steps:**
1. Navigate to Administration → Custom Fields → Issues
2. Click "New Custom Field"
3. Select format "Text"
4. Enter Name: `Components`
5. Click Save

**Expected Result:**
- Custom field saves successfully
- Field is eligible as a Visibility Rule target field

---

### TC-RAF-008: Created custom fields appear in Advanced Field Settings

**User Role:** Admin
**Precondition:** Custom fields from TC-RAF-001 through TC-RAF-007F are created.

**Steps:**
1. Navigate to Administration → Advanced Field Settings
2. Click on Formula tab
3. Click "New Formula" — verify dropdown for Calculated Field shows created fields
4. Click on Dependency tab
5. Click "New Dependency" — verify Parent Field and Child Field dropdowns show created fields
6. Click on Sequence tab
7. Click "New Sequence Rule" — verify Target Field dropdown shows Text field (`Incident ID`)
8. Click on Visibility tab
9. Click "Add Visibility Rule" — verify Trigger Field and Target Field dropdowns show created fields

**Expected Result:**
- All created custom fields appear in their respective dropdowns across all tabs
- No fields are missing from the lists

---

### TC-RAF-009: Admin creates Date Difference (minutes) formula

**User Role:** Admin
**Precondition:** `Incident Start Time`, `Incident Resolution Time` (Date & Time), and `Downtime (minutes)` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Downtime (minutes)`
4. Set Formula Type: `Date Difference (minutes)`
5. Set Source Field A: `Incident Resolution Time`
6. Set Source Field B: `Incident Start Time`
7. Leave Project empty (global scope)
8. Leave Log to history unchecked
9. Click Save

**Expected Result:**
- New Formula popup opens successfully
- All dropdowns populate correctly
- Formula saves without error
- Formula appears in the Formula tab list
- Calculated Field, Formula Type, Source A, and Source B are displayed correctly in the list

---

### TC-RAF-010: Admin creates Date Difference (hours) formula for Duration

**User Role:** Admin
**Precondition:** `Incident Start Time`, `Incident Resolution Time` (Date & Time), and `Duration (hours)` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Duration (hours)`
4. Set Formula Type: `Date Difference (hours)`
5. Set Source Field A: `Incident Resolution Time`
6. Set Source Field B: `Incident Start Time`
7. Click Save

**Expected Result:**
- Formula saves successfully
- Formula appears in the Formula tab list with correct configuration
- Calculated Field shows `Duration (hours)` (not `Total Hours`)

---

### TC-RAF-011: Admin creates Add (A + B) formula

**User Role:** Admin
**Precondition:** `Estimate`, `Extra Hours`, and `Total Hours` Float custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Total Hours`
4. Set Formula Type: `Add (A + B)`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Click Save

**Expected Result:**
- Formula saves successfully
- Formula appears in the Formula tab list
- Formula type shows as Add (A + B)

---

### TC-RAF-012: Admin creates Subtract (A - B) formula

**User Role:** Admin
**Precondition:** `Estimate` (Float), `Extra Hours` (Float), and `Subtract Result` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Subtract Result`
4. Set Formula Type: `Subtract (A - B)`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Click Save

**Expected Result:**
- Formula saves successfully
- Appears in list with Calculated Field = `Subtract Result`, formula type = Subtract (A - B)

---

### TC-RAF-013: Admin creates Multiply (A × B) formula

**User Role:** Admin
**Precondition:** `Estimate` (Float), `Extra Hours` (Float), and `Multiply Result` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Multiply Result`
4. Set Formula Type: `Multiply (A × B)`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Click Save

**Expected Result:**
- Formula saves successfully
- Appears in list with Calculated Field = `Multiply Result`, formula type = Multiply (A × B)

---

### TC-RAF-014: Admin creates Divide (A ÷ B) formula

**User Role:** Admin
**Precondition:** `Estimate` (Float), `Extra Hours` (Float), and `Divide Result` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Divide Result`
4. Set Formula Type: `Divide (A ÷ B)`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Click Save

**Expected Result:**
- Formula saves successfully
- Appears in list with Calculated Field = `Divide Result`, formula type = Divide (A ÷ B)

---

### TC-RAF-015: Admin creates If (A - B) > threshold formula

**User Role:** Admin
**Precondition:** `Estimate` (Float), `Extra Hours` (Float), and `Condition GT Result` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Condition GT Result`
4. Set Formula Type: `If (A - B) > threshold`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Set Threshold: `10`
8. Click Save

**Expected Result:**
- Formula saves successfully
- Appears in list with Calculated Field = `Condition GT Result`, formula type = If (A - B) > threshold

---

### TC-RAF-016: Admin creates If (A - B) < threshold formula

**User Role:** Admin
**Precondition:** `Estimate` (Float), `Extra Hours` (Float), and `Condition LT Result` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Condition LT Result`
4. Set Formula Type: `If (A - B) < threshold`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Set Threshold: `10`
8. Click Save

**Expected Result:**
- Formula saves successfully
- Appears in list with Calculated Field = `Condition LT Result`, formula type = If (A - B) < threshold

---

### TC-RAF-017: Admin creates If (A - B) = threshold formula

**User Role:** Admin
**Precondition:** `Estimate` (Float), `Extra Hours` (Float), and `Condition EQ Result` (Float) custom fields exist.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Condition EQ Result`
4. Set Formula Type: `If (A - B) = threshold`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Set Threshold: `10`
8. Click Save

**Expected Result:**
- Formula saves successfully
- Appears in list with Calculated Field = `Condition EQ Result`, formula type = If (A - B) = threshold

---

### TC-RAF-018: Admin enables Log to history on an existing formula

**User Role:** Admin
**Precondition:** Date Difference (minutes) formula from TC-RAF-009 exists (Downtime (minutes)).

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Locate the formula from TC-RAF-009: Calculated Field = `Downtime (minutes)`, Formula Type = `Date Difference (minutes)`
3. Click Edit on that formula
4. Check "Log to history"
5. Click Save

**Expected Result:**
- Formula updates with Log to history enabled
- Setting is retained and visible in the formula list/detail
- No duplicate formula is created

---

### TC-RAF-019: Admin scopes formula to a specific project

**User Role:** Admin
**Precondition:** `Estimate`, `Extra Hours`, and `Total Hours` Float fields exist and are enabled on at least one project (e.g., `Advanced Fields Demo`). Note: the Project dropdown is filtered — only projects where the selected custom fields are enabled will appear.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Total Hours`
4. Set Formula Type: `Add (A + B)`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Open the Project dropdown — observe that it only lists projects where `Estimate`, `Extra Hours`, and `Total Hours` are enabled
8. Select a specific project (e.g., `Advanced Fields Demo`)
9. Leave "All Eligible Projects" unchecked
10. Click Save

**Expected Result:**
- Project dropdown is filtered: only projects with all three fields enabled are listed
- Formula saves with project scope
- Formula is applied only to the selected project
- Formula does not appear in other projects' issue forms

---

### TC-RAF-020: Admin applies formula to all eligible projects

**User Role:** Admin
**Precondition:** At least two projects exist with `Estimate`, `Extra Hours`, and `Total Hours` Float fields enabled on both.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Formula tab
2. Click "New Formula"
3. Set Calculated Field: `Total Hours`
4. Set Formula Type: `Add (A + B)`
5. Set Source Field A: `Estimate`
6. Set Source Field B: `Extra Hours`
7. Check "All Eligible Projects"
8. Click Save
9. Navigate to Project A → New Issue → set `Estimate`: `4`, `Extra Hours`: `2` → observe `Total Hours`
10. Navigate to Project B → New Issue → set `Estimate`: `6`, `Extra Hours`: `1` → observe `Total Hours`

**Expected Result:**
- Formula saves with global scope
- In Project A: `Total Hours` = `6` (4 + 2) — formula is active
- In Project B: `Total Hours` = `7` (6 + 1) — formula is active
- Confirms the rule applies across all eligible projects, not just one

---

## Formula Administration Teardown

**Required before proceeding to TC-RAF-021.**

After completing TC-RAF-009 through TC-RAF-020, delete only the duplicate/scoped formulas — keep all formula type formulas for issue-level verification in TC-RAF-031 and TC-RAF-032:

**Delete these formulas:**
- The project-scoped `Add` formula from TC-RAF-019
- The global `Add` formula from TC-RAF-020 (if it duplicates the one from TC-RAF-011)

**Retain all nine formulas for issue-level testing:**
1. `Date Difference (minutes)` → `Downtime (minutes)` (Log to history: enabled, from TC-RAF-018)
2. `Date Difference (hours)` → `Duration (hours)` (from TC-RAF-010)
3. `Add (A + B)` → `Total Hours` = `Estimate + Extra Hours` (from TC-RAF-011)
4. `Subtract (A - B)` → `Subtract Result` (from TC-RAF-012) — verified in TC-RAF-031/032
5. `Multiply (A × B)` → `Multiply Result` (from TC-RAF-013) — verified in TC-RAF-031/032
6. `Divide (A ÷ B)` → `Divide Result` (from TC-RAF-014) — verified in TC-RAF-031/032
7. `If (A - B) > threshold` → `Condition GT Result` (from TC-RAF-015) — verified in TC-RAF-031/032
8. `If (A - B) < threshold` → `Condition LT Result` (from TC-RAF-016) — verified in TC-RAF-031/032
9. `If (A - B) = threshold` → `Condition EQ Result` (from TC-RAF-017) — verified in TC-RAF-031/032

All source fields (`Estimate`, `Extra Hours`, `Incident Start Time`, `Incident Resolution Time`) remain editable because none of them are Calculated Field targets.

---

### TC-RAF-021: Admin creates dependency rule for IT department (3 allowed locations)

**User Role:** Admin
**Precondition:** `Department` (List) and `Location` (List) custom fields exist with values.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Dependency tab
2. Click "New Dependency"
3. Set Parent Field: `Department`
4. Set Parent Value: `IT`
5. Set Child Field: `Location`
6. Set Allowed Values: `Server Room`, `Data Center`, `CRM`
7. Click Save

**Expected Result:**
- New Dependency popup opens successfully
- All fields populate correctly
- Dependency saves without error
- Dependency appears in the Dependency tab list
- Parent field, parent value, child field, and allowed values (`Server Room`, `Data Center`, `CRM`) are displayed correctly
- Note: Only 3 of the 9 available Location values are allowed for IT, making filtering detectable in TC-RAF-035

---

### TC-RAF-022: Admin creates second dependency rule for different parent value

**User Role:** Admin
**Precondition:** `Department` and `Location` custom fields exist. Dependency for IT already created in TC-RAF-021.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Dependency tab
2. Click "New Dependency"
3. Set Parent Field: `Department`
4. Set Parent Value: `HR`
5. Set Child Field: `Location`
6. Set Allowed Values: `Branch Office`
7. Click Save

**Expected Result (correct behavior):**
- Second dependency rule saves successfully
- Both dependency rules appear in the list
- Rules are independent of each other (IT and HR rules coexist)

**Known Issue:** BUG-RAF-001 — Plugin currently blocks this operation and returns a validation error when a second rule shares the same Parent Field + Child Field combination, even with a different Parent Value. This test is expected to FAIL until BUG-RAF-001 is resolved. Record the actual error as confirming BUG-RAF-001.

---

### TC-RAF-023: Admin scopes dependency to a specific project

**User Role:** Admin
**Precondition:** `Department` and `Location` custom fields exist and are enabled on at least one project (e.g., `Advanced Fields Demo`). Note: the Project dropdown is filtered — only projects where both fields are enabled will appear.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Dependency tab
2. Click "New Dependency"
3. Set Parent Field: `Department`
4. Set Parent Value: `Finance`
5. Set Child Field: `Location`
6. Set Allowed Values: `Branch Office`, `CRM`
7. Open the Project dropdown — observe that it only lists projects where both `Department` and `Location` are enabled
8. Select a specific project (e.g., `Advanced Fields Demo`)
9. Leave "All Eligible Projects" unchecked
10. Click Save

**Expected Result:**
- Project dropdown is filtered: only projects with both `Department` and `Location` enabled are listed
- Dependency saves with project scope
- Parent Field = `Department`, Parent Value = `Finance`, Child Field = `Location`, Allowed Values = `Branch Office, CRM`
- Dependency applies only within the selected project

---

### TC-RAF-024: Admin applies dependency to all eligible projects

**User Role:** Admin
**Precondition:** `Department` and `Location` custom fields exist and are enabled on at least two projects.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Dependency tab
2. Click "New Dependency"
3. Set Parent Field: `Department`
4. Set Parent Value: `Operations`
5. Set Child Field: `Location`
6. Set Allowed Values: `WAN`, `LAN`, `VPN`
7. Check "All Eligible Projects"
8. Click Save
9. Navigate to Project A → New Issue → set `Department`: `Operations` → observe `Location` dropdown
10. Navigate to Project B → New Issue → set `Department`: `Operations` → observe `Location` dropdown

**Expected Result:**
- Dependency saves with global scope
- Parent Field = `Department`, Parent Value = `Operations`, Child Field = `Location`, Allowed Values = `WAN, LAN, VPN`
- In Project A: `Location` shows only `WAN`, `LAN`, `VPN` when `Operations` is selected
- In Project B: same filtering applies
- Confirms the rule is active across all eligible projects, not just one

---

### TC-RAF-025: Admin creates sequence rule with 3-digit padding

**User Role:** Admin
**Precondition:** `Incident ID` (Text) custom field exists.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Sequence tab
2. Click "New Sequence Rule"
3. Set Target Field: `Incident ID`
4. Leave Tracker empty (all trackers)
5. Set Pad Digits: `3`
6. Leave Project empty
7. Click Save

**Expected Result:**
- New Sequence Rule popup opens successfully
- Rule saves without error
- Rule appears in the Sequence tab list
- Target field = `Incident ID`, pad digits = 3 are displayed correctly

---

### TC-RAF-026: Admin creates sequence rule scoped to specific tracker

**User Role:** Admin
**Precondition:** `Incident ID` (Text) custom field exists. At least one tracker exists (e.g., Bug). The global sequence rule from TC-RAF-025 must be deleted before creating a tracker-scoped rule to avoid conflicts.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Sequence tab
2. Delete the global sequence rule from TC-RAF-025 (no tracker, no project scope)
3. Click "New Sequence Rule"
4. Set Target Field: `Incident ID`
5. Set Tracker: `Bug`
6. Set Pad Digits: `3`
7. Click Save

**Expected Result:**
- Rule saves with tracker scope
- Rule applies only when creating issues with the Bug tracker

**Teardown:** Delete this Bug tracker-scoped rule after verifying. Re-create the global scope rule from TC-RAF-025 for use in subsequent tests (TC-RAF-027 onwards).

---

### TC-RAF-027: Admin creates sequence rule scoped to specific project

**User Role:** Admin
**Precondition:** `Incident ID` (Text) custom field exists and is enabled on at least one project. The global sequence rule from TC-RAF-025 must be the only active rule. Note: the Project dropdown is filtered — only projects where `Incident ID` is enabled will appear.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Sequence tab
2. Click "New Sequence Rule"
3. Set Target Field: `Incident ID`
4. Open the Project dropdown — observe that it only lists projects where `Incident ID` is enabled
5. Select a specific project (e.g., `Advanced Fields Demo`)
6. Set Pad Digits: `3`
7. Click Save

**Expected Result:**
- Project dropdown is filtered: only projects with `Incident ID` enabled are listed
- Rule saves with project scope
- Rule applies only within the selected project

---

### TC-RAF-028: Admin creates Show visibility rule

**User Role:** Admin
**Precondition:** `Environment` (List, values: Production/Development/Staging) and `Components` (Text) custom fields exist (created in TC-RAF-007E and TC-RAF-007F).

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Visibility tab
2. Click "Add Visibility Rule"
3. Set Trigger Field: `Environment`
4. Set Trigger Value: `Production`
5. Set Action: `Show field when matched`
6. Set Target Field: `Components`
7. Leave Project empty (global)
8. Click Save

**Expected Result:**
- Add Visibility Rule popup opens successfully
- All fields populate correctly
- Rule saves without error
- Rule appears in the Visibility tab list
- Trigger field, trigger value, action, and target field display correctly

---

### TC-RAF-029: Admin creates Hide visibility rule

**User Role:** Admin
**Precondition:** `Environment` (List) and `Components` (Text) custom fields exist. Show rule from TC-RAF-028 already configured.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Visibility tab
2. Click "Add Visibility Rule"
3. Set Trigger Field: `Environment`
4. Set Trigger Value: `Development`
5. Set Action: `Hide field when matched`
6. Set Target Field: `Components`
7. Click Save

**Expected Result:**
- Rule saves with hide action
- Rule appears in the Visibility tab list
- Action shows as "Hide field when matched"

---

### TC-RAF-030: Admin scopes visibility rule to specific project

**User Role:** Admin
**Precondition:** `Environment` (List) and `Components` (Text) custom fields exist and are enabled on at least one project. Note: the Project dropdown is filtered — only projects where both fields are enabled will appear.

**Steps:**
1. Navigate to Administration → Advanced Field Settings → Visibility tab
2. Click "Add Visibility Rule"
3. Set Trigger Field: `Environment`
4. Set Trigger Value: `Staging`
5. Set Action: `Show field when matched`
6. Set Target Field: `Components`
7. Open the Project dropdown — observe that it only lists projects where both `Environment` and `Components` are enabled
8. Select a specific project (e.g., `Advanced Fields Demo`)
9. Click Save

**Expected Result:**
- Project dropdown is filtered: only projects with both `Environment` and `Components` enabled are listed
- Visibility rule saves with project scope
- Rule applies only within the selected project

---

### TC-RAF-031: All formula types calculate correctly on issue creation

**User Role:** Admin
**Precondition:** All nine formulas from TC-RAF-009 through TC-RAF-017 are active (duplicates deleted per Formula Administration Teardown). Custom fields enabled on a project and tracker.

**Steps:**
1. Navigate to a project → New Issue
2. Set Tracker to the configured tracker
3. Fill in all source fields:
   - `Estimate`: `10`
   - `Extra Hours`: `3`
   - `Incident Start Time`: `2024-01-15 10:00`
   - `Incident Resolution Time`: `2024-01-15 10:45`
4. Verify all calculated fields are read-only (disabled inputs)
5. Verify all source fields (`Estimate`, `Extra Hours`, `Incident Start Time`, `Incident Resolution Time`) are editable
6. (Optional) If the plugin shows a real-time preview before save, note the values displayed in each calculated field
7. Submit the issue
8. Reload the saved issue detail page
9. Verify all calculated values on the detail page match the expected results below

**Expected Result:**

Per the plugin guide, formulas are calculated **on issue save/update**. The authoritative validation is after save and reload (step 9). Any real-time preview on the form before submit is a bonus observation.

**Required — after save and reload:**

| Field | Formula | Expected Value |
|-------|---------|----------------|
| `Total Hours` | 10 + 3 | `13` |
| `Subtract Result` | 10 − 3 | `7` |
| `Multiply Result` | 10 × 3 | `30` |
| `Divide Result` | 10 ÷ 3 | `3.33` (approx.) |
| `Downtime (minutes)` | 10:45 − 10:00 | `45` |
| `Duration (hours)` | 45 min ÷ 60 | `0.75` |
| `Condition GT Result` | 7 > 10? No | `0` (false) |
| `Condition LT Result` | 7 < 10? Yes | `1` (true) |
| `Condition EQ Result` | 7 = 10? No | `0` (false) |

- All calculated fields are read-only
- Issue submits without errors
- All values above confirmed on the issue detail page after reload

---

### TC-RAF-032: All formula types recalculate correctly on issue edit

**User Role:** Admin
**Precondition:** All nine formulas are active. Issue from TC-RAF-031 exists with the values saved in that test.

**Steps:**
1. Navigate to the issue created in TC-RAF-031
2. Click Edit
3. Change all source fields to new values:
   - `Estimate`: `15`
   - `Extra Hours`: `2`
   - `Incident Start Time`: `2024-01-15 09:00`
   - `Incident Resolution Time`: `2024-01-15 10:00`
4. (Optional) If the plugin shows a real-time preview, note the updated values in each calculated field
5. Save the issue
6. Reload the saved issue detail page
7. Verify all updated values on the detail page match the expected results below

**Expected Result:**

Per the plugin guide, formulas are calculated **on issue save/update**. The authoritative validation is after save and reload (step 7). Any real-time preview on the form before save is a bonus observation.

**Required — after save and reload:**

| Field | Formula | Expected Value | Change from TC-RAF-031 |
|-------|---------|----------------|------------------------|
| `Total Hours` | 15 + 2 | `17` | was 13 |
| `Subtract Result` | 15 − 2 | `13` | was 7 |
| `Multiply Result` | 15 × 2 | `30` | was 30 (same) |
| `Divide Result` | 15 ÷ 2 | `7.5` | was 3.33 |
| `Downtime (minutes)` | 10:00 − 09:00 | `60` | was 45 |
| `Duration (hours)` | 60 min ÷ 60 | `1.0` | was 0.75 |
| `Condition GT Result` | 13 > 10? Yes | `1` (true) | was 0 — **flipped** |
| `Condition LT Result` | 13 < 10? No | `0` (false) | was 1 — **flipped** |
| `Condition EQ Result` | 13 = 10? No | `0` (false) | unchanged |

- All calculated fields remain read-only
- Issue saves successfully without errors
- All updated values above confirmed on the issue detail page after reload

---

## Formula Type Tests Teardown

**Required before proceeding to TC-RAF-034.**

Issue-level verification of all formula types is complete (TC-RAF-031 and TC-RAF-032). Delete the following formulas to keep the issue form clean for subsequent tests:

- Subtract formula → `Subtract Result`
- Multiply formula → `Multiply Result`
- Divide formula → `Divide Result`
- Condition GT formula → `Condition GT Result`
- Condition LT formula → `Condition LT Result`
- Condition EQ formula → `Condition EQ Result`

**Retain only these three core formulas for TC-RAF-034 onwards:**
1. `Date Difference (minutes)` → `Downtime (minutes)` (Log to history: enabled)
2. `Date Difference (hours)` → `Duration (hours)`
3. `Add (A + B)` → `Total Hours` = `Estimate + Extra Hours`

---

### TC-RAF-034: Journal records formula changes when Log to history is enabled

**User Role:** Admin
**Precondition:** Date Difference (minutes) formula with "Log to history" enabled (updated in TC-RAF-018). Issue exists with `Incident Start Time` and `Incident Resolution Time` values set.

**Steps:**
1. Navigate to an existing issue with Log to history formula
2. Click Edit
3. Change `Incident Start Time` or `Incident Resolution Time` to different values
4. Save the issue
5. Scroll to the journal/history section

**Expected Result:**
- Issue journal shows an entry for the `Downtime (minutes)` calculated field value change
- Old value and new value are recorded
- Entry timestamp is visible

---

### TC-RAF-035: Child field values filter when parent field is selected

**User Role:** Admin
**Precondition:** Dependency rule configured (TC-RAF-021) — `Department = IT` → `Location` allowed values: `Server Room`, `Data Center`, `CRM` only (3 of 9 values). Custom fields enabled on project.

**Steps:**
1. Navigate to a project → New Issue
2. Observe the `Location` dropdown before selecting Department (should show all 9 values or be unfiltered)
3. Set `Department`: `IT`
4. Observe the `Location` dropdown options

**Expected Result:**
- When `Department = IT` is selected, `Location` dropdown shows only: `Server Room`, `Data Center`, `CRM`
- The remaining 6 Location values (`Branch Office`, `ERP`, `Billing`, `WAN`, `LAN`, `VPN`) are NOT shown
- The update happens without page reload
- Filtering is clearly observable because only 3 of 9 values are allowed

---

### TC-RAF-036: Child field options update when parent field selection changes

**User Role:** Admin
**Precondition:** Two dependency rules configured — `IT → Server Room, Data Center, CRM` and `HR → Branch Office only`.

**⚠ BLOCKED: BUG-RAF-001.** The precondition for this test (HR → Branch Office dependency rule) cannot be created due to BUG-RAF-001 blocking a second dependency rule for the same Parent Field + Child Field combination. Skip this test until BUG-RAF-001 is resolved.

**Steps (for execution after BUG-RAF-001 is resolved):**
1. Navigate to a project → New Issue
2. Set `Department`: `IT`
3. Observe `Location` shows `Server Room`, `Data Center`, `CRM`
4. Change `Department` to `HR`
5. Observe `Location` dropdown

**Expected Result:**
- `Location` dropdown updates immediately when Department changes
- Only `Branch Office` appears when HR is selected
- No page reload occurs
- Previously selected child value is cleared if not in new allowed list

---

### TC-RAF-037: Sequence value auto-generates on issue creation

**User Role:** Admin
**Precondition:** Global sequence rule configured for `Incident ID` with Pad Digits = 3, no tracker/project scope. Custom field enabled on project.

**Steps:**
1. Navigate to a project → New Issue
2. Select the configured tracker
3. Fill in required fields
4. Submit the issue

**Expected Result:**
- `Incident ID` field is auto-populated in the format `YYYY-MM-NNN` (e.g., `2026-05-001` for the first issue in that month)
- Field is not manually editable (read-only or system-filled)
- Issue saves successfully

---

### TC-RAF-038: Sequence increments correctly for subsequent issues

**User Role:** Admin
**Precondition:** Sequence rule active. At least one issue already created with a sequence-generated `Incident ID`.

**Steps:**
1. Note the `Incident ID` of the most recently created issue (e.g., `2026-05-003`)
2. Navigate to the same project → New Issue
3. Select the same tracker
4. Fill in required fields and submit

**Expected Result:**
- New issue `Incident ID` increments by 1 from the previous value (e.g., if last was `2026-05-003`, new is `2026-05-004`)
- Format remains `YYYY-MM-NNN`
- Each subsequent issue receives a unique, incrementing sequence value

---

### TC-RAF-039: Sequence padding works correctly

**User Role:** Admin
**Precondition:** Sequence rule with Pad Digits = 3 active. Note the current counter value from the most recently created issue.

**Steps:**
1. Note the current sequence counter from the last issue's `Incident ID` (e.g., `2026-05-003` → current counter is 3)
2. Create 3 more issues in the same project with the same tracker
3. Observe generated `Incident ID` values

**Expected Result:**
- Each new issue generates a value with format `YYYY-MM-NNN` where NNN is zero-padded to 3 digits
- Counter increments by 1 for each issue
- Example: if starting at 003, next three issues get `2026-05-004`, `2026-05-005`, `2026-05-006`
- No leading zeros are dropped (e.g., `007` not `7`)

---

### TC-RAF-040: Sequence rule applies only to configured tracker

**User Role:** Admin
**Precondition:** Sequence rule configured for tracker `Bug` only (re-create the Bug-scoped rule from TC-RAF-026 for this test).

**Steps:**
1. Navigate to a project → New Issue
2. Select tracker `Bug`
3. Submit issue — observe `Incident ID`
4. Navigate to project → New Issue
5. Select tracker `Feature`
6. Submit issue — observe `Incident ID`

**Expected Result:**
- Bug tracker issue gets auto-generated sequence value in `YYYY-MM-NNN` format
- Feature tracker issue does not receive auto-generated value (field is empty or manual)

---

### TC-RAF-041: Field shows dynamically when trigger condition matches

**User Role:** Admin
**Precondition:** Visibility rule configured (TC-RAF-028) — `Environment = Production` → Show `Components`. Both `Environment` and `Components` custom fields enabled on the test project.

**Steps:**
1. Navigate to a project → New Issue
2. Observe `Components` field visibility before selecting Environment (should be hidden per the rule default)
3. Set `Environment`: `Production`
4. Observe `Components` field

**Expected Result:**
- `Components` field is hidden initially
- When `Environment = Production` is selected, `Components` field becomes visible immediately
- No page reload required

---

### TC-RAF-042: Field hides dynamically when trigger condition matches

**User Role:** Admin
**Precondition:** Visibility rule configured (TC-RAF-029) — `Environment = Development` → Hide `Components`. Both fields enabled on project. Components is currently visible.

**Steps:**
1. Navigate to a project → New Issue
2. Confirm `Components` is visible initially (e.g., after setting Environment to Production)
3. Change `Environment` to `Development`
4. Observe `Components` field

**Expected Result:**
- `Components` field hides immediately when `Development` is selected
- No page reload required
- Field becomes visible again when Environment is changed to a different value (e.g., `Staging`)

---

### TC-RAF-043: Visibility rule applies during issue edit

**User Role:** Admin
**Precondition:** Visibility rule configured and working on issue create. An existing issue is available with `Environment` field set.

**Steps:**
1. Navigate to an existing issue
2. Click Edit
3. Change `Environment` to `Production`
4. Observe `Components` field

**Expected Result:**
- Visibility rule triggers correctly during edit
- `Components` field shows when `Environment = Production`
- Behavior is identical to issue create form

---

### TC-RAF-044: Multiple advanced field rules work together on same issue

**User Role:** Admin
**Precondition:** Formula, Dependency, Sequence, and Visibility rules all configured on the same project and tracker. Fields: `Department`, `Location`, `Environment`, `Components`, `Incident Start Time`, `Incident Resolution Time`, `Downtime (minutes)`, `Incident ID`.

**Steps:**
1. Navigate to the configured project → New Issue
2. Select the configured tracker
3. Set `Department`: `IT` → observe `Location` shows only `Server Room`, `Data Center`, `CRM`
4. Select `Location`: `Server Room`
5. Set `Environment`: `Production` → observe `Components` becomes visible
6. Enter a value for `Components`
7. Set `Incident Start Time` and `Incident Resolution Time`
8. Observe `Downtime (minutes)` auto-calculates
9. Submit the issue
10. Observe `Incident ID` was auto-generated

**Expected Result:**
- Dependency filtering works: Location shows 3 values for IT
- Visibility toggling works: Components visible when Production
- Formula calculates correctly: Downtime populated from datetime difference
- Sequence generates correctly: Incident ID in `YYYY-MM-NNN` format
- Issue saves successfully
- All four features function simultaneously without conflict

---

## Workflow Cases

---

### TC-RAF-051: Formula recalculates after issue is reopened and edited

**User Role:** Admin
**Precondition:** Formula rule active. An issue in Resolved or Closed status exists with a calculated field value.

**Setup (if no closed issue exists):**
1. Navigate to an existing open issue
2. Change Status to Resolved (or Closed)
3. Save the issue
4. Proceed with the test steps below

**Steps:**
1. Navigate to an issue in Resolved/Closed status
2. Reopen the issue (change Status to New or In Progress)
3. Edit a source field value (e.g., change `Estimate` or `Extra Hours`)
4. Save the issue

**Expected Result:**
- Calculated field (`Total Hours`) recalculates correctly after reopen + edit
- New value is reflected in the issue
- Issue saves without errors

---

### TC-RAF-052: Dependency filtering persists after page save and reload

**User Role:** Admin
**Precondition:** Dependency rule active. Issue created with parent and child field values set.

**Steps:**
1. Create an issue — set `Department = IT`, `Location = Server Room`
2. Save the issue
3. Reload the issue detail page

**Expected Result:**
- Saved values `Department = IT` and `Location = Server Room` persist
- Values are correctly displayed after reload

---

### TC-RAF-053: Sequence does not regenerate on issue edit

**User Role:** Admin
**Precondition:** Sequence rule active. An issue exists with an auto-generated `Incident ID` (e.g., `2026-05-003`).

**Steps:**
1. Navigate to the issue with the auto-generated `Incident ID`
2. Note the exact current `Incident ID` value
3. Click Edit
4. Change any non-sequence field (e.g., Priority or Description)
5. Save the issue

**Expected Result:**
- `Incident ID` retains its original auto-generated value (e.g., `2026-05-003`) — it does NOT regenerate on edit
- Sequence value is preserved unchanged after save

---

### TC-RAF-054: Visibility state persists correctly when editing existing issue

**User Role:** Admin
**Precondition:** Visibility rule active (TC-RAF-028: `Environment = Production` → Show `Components`). An issue was saved with `Environment = Production` and a value entered in `Components`.

**Steps:**
1. Navigate to the saved issue (Environment = Production, Components has a value)
2. Click Edit
3. Observe `Environment` field shows `Production`
4. Observe `Components` field

**Expected Result:**
- `Components` field is visible on edit form load (trigger value `Production` matches)
- Existing value in `Components` is displayed
- Visibility rule applies correctly on edit form load without requiring a change

---

## Evidence Map

| Case ID | Screenshot | Log | Bug Reference |
|---------|-----------|-----|---------------|
| TC-RAF-001 | — | — | — |
| TC-RAF-002 | — | — | — |
| TC-RAF-003 | — | — | — |
| TC-RAF-004 | — | — | — |
| TC-RAF-005 | — | — | — |
| TC-RAF-006 | — | — | — |
| TC-RAF-007 | — | — | — |
| TC-RAF-007A | — | — | — |
| TC-RAF-007B | — | — | — |
| TC-RAF-007C | — | — | — |
| TC-RAF-007D | — | — | — |
| TC-RAF-007E | — | — | — |
| TC-RAF-007F | — | — | — |
| TC-RAF-008 | — | — | — |
| TC-RAF-009 | — | — | — |
| TC-RAF-010 | — | — | — |
| TC-RAF-011 | — | — | — |
| TC-RAF-012 | — | — | — |
| TC-RAF-013 | — | — | — |
| TC-RAF-014 | — | — | — |
| TC-RAF-015 | — | — | — |
| TC-RAF-016 | — | — | — |
| TC-RAF-017 | — | — | — |
| TC-RAF-018 | — | — | — |
| TC-RAF-019 | — | — | — |
| TC-RAF-020 | — | — | — |
| TC-RAF-021 | — | — | — |
| TC-RAF-022 | — | — | BUG-RAF-001 |
| TC-RAF-023 | — | — | — |
| TC-RAF-024 | — | — | — |
| TC-RAF-025 | — | — | — |
| TC-RAF-026 | — | — | — |
| TC-RAF-027 | — | — | — |
| TC-RAF-028 | — | — | — |
| TC-RAF-029 | — | — | — |
| TC-RAF-030 | — | — | — |
| TC-RAF-031 | — | — | — |
| TC-RAF-032 | — | — | — |
| TC-RAF-034 | — | — | — |
| TC-RAF-035 | — | — | — |
| TC-RAF-036 | — | — | BUG-RAF-001 |
| TC-RAF-037 | — | — | — |
| TC-RAF-038 | — | — | — |
| TC-RAF-039 | — | — | — |
| TC-RAF-040 | — | — | — |
| TC-RAF-041 | — | — | — |
| TC-RAF-042 | — | — | — |
| TC-RAF-043 | — | — | — |
| TC-RAF-044 | — | — | — |
| TC-RAF-051 | — | — | — |
| TC-RAF-052 | — | — | — |
| TC-RAF-053 | — | — | — |
| TC-RAF-054 | — | — | — |
