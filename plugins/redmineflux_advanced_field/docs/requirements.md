# Redmineflux Advanced Field — Requirement Document

## Overview

The Redmineflux Advanced Field plugin extends Redmine issue custom fields and allows admin users to configure advanced field behaviors including:

1. Formula Fields
2. Dependency Fields
3. Sequence Rules
4. Visibility Rules

These configurations are applied to issue custom fields and verified during issue creation and editing.

---

# 1. Custom Field Creation (Precondition)

## Description

Admin user creates issue custom fields from Redmine administration.

## Navigation

Administration → Custom Fields → Issues → New Custom Field

## Supported Custom Field Types

- Boolean
- Date
- Date & Time
- File
- Float
- Integer
- Key/value list
- Link
- List
- Long text
- Text
- User
- Version

## Functional Requirement

Admin can create custom fields using supported field types.

## Expected Behavior

- Custom field creation page opens successfully
- Admin can create issue custom fields
- Field saves successfully
- Created field appears in Advanced Field Settings
- Validation messages appear when required fields are missing

---

# 2. Formula Section

## Navigation

Administration → Advanced Field Settings → Formula Tab

## Flow

1. Click New Formula button
2. Configure formula using created custom fields
3. Save formula

## New Formula Form Fields

| Field | Description |
|---|---|
| Calculated Field * | Custom field created earlier |
| Formula Type * | Formula operation type |
| Source Field A * | First source field |
| Source Field B * | Second source field |
| Project | Project scope |
| All Eligible Projects | Apply to all eligible projects |
| Log to history | Record calculated value changes in issue journal |

## Available Formula Types
Date Difference (minutes)
Date Difference (hours)
Subtract (A - B)
Add (A + B)
Multiply (A × B)
Divide (A ÷ B)
If (A - B) > threshold
If (A - B) < threshold
If (A - B) = threshold

## Functional Requirement

Admin creates formula using existing custom fields.

### Example

| Source Field A | Formula | Source Field B | Calculated Field |
|---|---|---|---|
| Estimate | + | Extra Hours | Total Hours |

## Expected Behavior

- New Formula popup opens successfully
- Required field validation works
- Formula saves successfully
- Calculated field auto-calculates value
- Value updates when source fields change
- Formula works in selected projects
- Journal records changes when Log to history is enabled

---

# 3. Dependency Section

## Navigation

Administration → Advanced Field Settings → Dependency Tab

## Flow

1. Click New Dependency button
2. Configure dependency rule
3. Save dependency

## Dependency Form Fields

| Field | Description |
|---|---|
| Parent Field * | Controlling field |
| Parent Value * | Selected parent value |
| Child Field * | Dependent field |
| Allowed Values * | Values allowed for child field |
| Project | Project scope |
| All Eligible Projects | Apply globally |

## Example

### Parent Field
Department

### Parent Value
IT

### Child Field
Location

### Allowed Values

- Server Room
- Branch Office
- Data Center
- CRM
- ERP
- Billing
- WAN
- LAN
- VPN

## Functional Requirement

Child field values depend on selected parent field value.

## Expected Behavior

- New Dependency popup opens successfully
- Required validation works
- Dependency saves successfully
- Child field values filter correctly
- Only allowed values appear
- Dependency works in issue form
- Invalid child values remain hidden

---

# 4. Sequence Section

## Navigation

Administration → Advanced Field Settings → Sequence Tab

## Flow

1. Click New Sequence Rule button
2. Configure sequence rule
3. Save rule

## Sequence Form Fields

| Field | Description |
|---|---|
| Target Field * | Text custom field receiving sequence |
| Tracker | Tracker scope |
| Pad Digits | Number padding width |
| Project | Project scope |

## Example

Pad Digits = 3

Generated Values:

- 001
- 002
- 003

## Functional Requirement

System auto-generates sequential values.

## Expected Behavior

- New Sequence Rule popup opens successfully
- Validation works
- Rule saves successfully
- Sequence auto-generates during issue creation
- Padding works correctly
- Duplicate sequence values are not generated
- Tracker and project restrictions work properly

---

# 5. Visibility Section

## Navigation

Administration → Advanced Field Settings → Visibility Tab

## Flow

1. Click Add Visibility Rule
2. Configure visibility behavior
3. Save rule

## Visibility Rule Form Fields

| Field | Description |
|---|---|
| Trigger Field * | Field controlling visibility |
| Trigger Value * | Trigger value |
| Action * | Show/Hide behavior |
| Target Field * | Controlled field |
| Project | Project scope |

## Example

| Trigger Field | Trigger Value | Action | Target Field |
|---|---|---|---|
| Environment | Production | Show field when matched | Components |

## Functional Requirement

Show or hide fields based on selected conditions.

## Expected Behavior

- Add Visibility Rule popup opens successfully
- Required validation works
- Rule saves successfully
- Target field visibility changes dynamically
- Matching condition works correctly
- Rule applies during issue creation and editing

---

# 6. Issue-Level Verification

## Navigation

Project → New Issue / Edit Issue

## Verification Scope

After configuring formulas, dependencies, sequences, and visibility rules, create or edit an issue and verify plugin behavior.

## Formula Verification

- Calculated fields auto-update
- Formula result is correct
- Source field changes update calculated value
- Journal logging works when enabled

## Dependency Verification

- Parent field selection filters child values
- Only allowed values appear
- Invalid values are hidden

## Sequence Verification

- Sequence auto-generates
- Generated value is unique
- Padding works correctly
- Rule applies according to project/tracker configuration

## Visibility Verification

- Fields show/hide dynamically
- Trigger conditions work correctly
- Rule applies during issue create/edit

## Expected Result

All configured advanced field settings work correctly in issue create and edit forms according to admin configuration.
