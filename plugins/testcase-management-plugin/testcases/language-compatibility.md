# Redmineflux Testcase Management Plugin — Language Compatibility Test Cases
# Version: 3.0
# Plugin Version: 6.2.0
# Created: 2026-05-18
# Updated: 2026-05-20
# Reference: https://www.redmineflux.com/knowledge-base/plugins/testcase-management/
# Usage: Execute every TC in order for each language. Do NOT skip any TC.

---

## Pre-Execution Checklist

- [ ] Load credentials from QA_CREDENTIALS_FORGE.md
- [ ] Verify Forge URL is reachable
- [ ] Login as admin user
- [ ] Change admin account language to target language (My Account → Language dropdown → Save)
- [ ] Confirm page reloads in target language
- [ ] Navigate to plugin configuration (/settings/plugin/redmineflux_testcase_management)

---

## TC-001: Plugin settings — Configuration tab

**Steps:**
1. Navigate to `/settings/plugin/redmineflux_testcase_management`
2. Observe all tab labels and form field labels on the Configuration tab

**Validate:**
- Tab: "Configuration" → translated
- Tab: "Run Email Templates" → translated
- Tab: "Testcase Email Templates" → translated
- Tab: "Testcase Run Types" → translated
- Label: "Select tracker as testcase" → translated
- Label: "Select tracker as defect" → translated
- Label: "Select tracker as feature" → translated
- Checkbox: "Show test case count in test suites" → translated
- Label: "Email reminder frequency for expiring test runs" → translated
- Dropdown options (Every day, Every week) → translated
- Save / Apply button → translated

**Pass Criteria:** All config tab labels and form labels translated.

---

## TC-002: Plugin settings — save action

**Steps:**
1. On `/settings/plugin/redmineflux_testcase_management`, click Save / Apply without changing values

**Validate:**
- Success flash message after save → translated

**Pass Criteria:** Success flash message in target language.

---

## TC-003: Plugin settings — footer version label

**Steps:**
1. Scroll to footer of `/settings/plugin/redmineflux_testcase_management`

**Validate:**
- Plugin version label (e.g. "Version: 6.2.0") → must use translated word for "Version"
  - Dutch: "Versie: 6.2.0", Japanese: "バージョン: 6.2.0", etc.

**Pass Criteria:** Version label uses translated word. English "Version" = FAIL.

---

## TC-004: Plugin settings — Run Email Templates tab (full CRUD + validation)

**Steps:**
1. Click "Run Email Templates" tab on plugin configuration page

**Validate empty state:**
- Tab heading → translated
- Table headers (Name, Enabled, Actions) → translated
- Empty state message → translated
- "New email template" link/button → translated

**Create — form validation:**
2. Click "New email template"
3. Verify create form: all field labels, dropdowns, checkboxes, buttons → translated
4. Leave required fields empty and click Create
5. Verify required field validation error messages → translated

**Create — success:**
6. Fill required fields with valid data (e.g. Name: "Run Template Test")
7. Click Create
8. Verify success flash message → translated

**Edit:**
9. Click Edit on the created template
10. Verify edit form: all labels, pre-filled values, buttons → translated
11. Click Update
12. Verify success flash message → translated

**Delete:**
13. Click Delete on the template
14. Verify delete confirmation popup: title, message, buttons (Delete / Cancel) → translated
15. Click Delete inside popup
16. Verify success flash message → translated
17. Verify empty state restored → translated

**Pass Criteria:** All CRUD flows and messages translated.

---

## TC-005: Plugin settings — Testcase Email Templates tab (full CRUD + validation)

**Steps:**
1. Navigate to Plugin Configuration → click "Testcase Email Templates" tab

**Validate empty state:**
- Tab heading → translated
- Table headers → translated
- Empty state message → translated
- "New email template" link/button → translated

**Create — form validation:**
2. Click "New email template"
3. Verify create form: all field labels, dropdowns, checkboxes, radio buttons, buttons → translated
4. Leave required fields empty and click Create
5. Verify required field validation error messages → translated

**Create — success:**
6. Fill required fields with valid data
7. Click Create
8. Verify success flash message → translated

**Edit:**
9. Click Edit
10. Verify edit form: all labels, pre-filled values, buttons → translated
11. Click Update
12. Verify success flash message → translated

**Delete:**
13. Click Delete
14. Verify delete confirmation popup: all text and buttons → translated
15. Click Delete inside popup
16. Verify success flash message → translated
17. Verify empty state restored → translated

**Pass Criteria:** All CRUD flows, validations, and messages translated.

---

## TC-006: Plugin settings — Testcase Run Types tab (full CRUD + validation)

**Steps:**
1. Click "Testcase Run Types" tab on plugin configuration page

**Validate:**
- Tab heading → translated
- Table headers → translated
- Edit and Delete action labels for existing run types → translated
- "New Run Type" button → translated

**Create — form validation:**
2. Click "New Run Type"
3. Verify form fields and buttons → translated
4. Submit without filling required fields
5. Verify error message → translated

**Create — success:**
6. Fill Name with a unique value (e.g. "Lang Test Type")
7. Click Create
8. Verify success flash message → translated

**Delete created run type:**
9. Click Delete on the run type just created
10. Verify delete popup: all text and buttons → translated
11. Click Delete inside popup
12. Verify success flash message → translated

**Pass Criteria:** All run type CRUD operations and messages translated.

---

## TC-007: Project settings — modules section

**Steps:**
1. Navigate to `/projects/testcase-management/settings/modules`

**Validate:**
- Page heading "Settings" → translated
- "Modules" section heading → translated
- Plugin module name label (acceptable in English — plugin name)
- Save button → translated
- If plugin module is not enabled: enable it and save

**Verify:**
- Success flash message after save → translated

**Pass Criteria:** Save button and success message translated. Plugin module enabled.

---

## TC-008: Full plugin navigation and CRUD (in-project)

### 8.1 — Overview page
1. Navigate to the Testcase Management plugin tab inside project `testcase-management`
2. Navigate to Overview page
3. Verify all section headings, labels, table headers, status values → translated
   - "Execution Details", "Test Runs", "To Do", "Activity" headings → translated
   - Table headers: ID, Run Name, State, Status, Execution Status, Total defects → translated
   - Status values: New, Untested, In progress, Done → translated
   - Chart label "Test Cases Executed per Day" → translated

### 8.2 — To Do page
1. Click "To Do" from the sidebar
2. Verify all headings, table columns, status values, filter options → translated

### 8.3 — Environment list
1. Click "Environment" from the sidebar
2. Verify page heading, table headers, action labels → translated
   - Columns: Name, Component, Owner, Action → translated

### 8.4 — Environment create + edit + validation
1. Click "Add Environment" button
2. Verify form: all field labels, component dropdown, Owner field, Create button → translated
3. Submit empty form — verify required field validation messages → translated
4. Fill form: enter Name (e.g. "[LANG] Environment"), select component
5. Click Create — verify success flash message → translated
6. Click the **pencil (edit) icon** next to the created environment
7. Verify edit form: all field labels, pre-filled values, Update button → translated
8. Click Update — verify success flash message → translated

### 8.5 — Test Suite CRUD
1. Click "Test Cases" from the sidebar
2. Verify test case list page: all headings, table headers, buttons → translated
3. Open the Test Suite sidebar — click the Add Test Suite icon
4. Verify new test suite popup: all labels, buttons → translated
5. Submit empty — verify validation messages → translated
6. Fill Suite Name (e.g. "[LANG] Test Suite") and click Create
7. Verify success flash message → translated
8. Click the action icon (hamburger icon) next to the created test suite
9. Select "Edit Test Suite" from the menu
10. Verify edit popup: all labels, buttons → translated
11. Close edit popup (Cancel)
12. Click the action icon again → select "Add Sub-folder"
13. Verify sub test suite popup: all labels, buttons → translated
14. Close the popup (Cancel)
15. Click the action icon again → select "Delete Test Suite"
16. Verify delete popup: all labels and buttons → translated
17. Close delete popup (Cancel — do NOT delete yet, needed for test case creation)

### 8.6 — Test Case CRUD
1. Navigate to Test Cases section
2. Click "New Test Case" button
3. Verify test case form: all field labels (Subject, Description, Assignee, Priority, etc.), dropdowns, buttons → translated
4. Click "New Step" button
5. Verify new step fields are translated (Step Description, Expected Result)
6. Click Delete icon on the step
7. Verify step delete popup: labels and buttons → translated
8. Click Delete inside popup to remove the step
9. Add a new step — fill Step Description and Expected Result
10. Fill Subject (e.g. "[LANG] Test Case 1")
11. Click Create — verify success flash message → translated
12. Open the created test case (click its subject link)
13. Verify the Test Case Execution section on the detail page — headings and labels → translated
14. Select a Run and Environment in the execution section
15. Click the Status button next to the result field
16. Verify execution popup: all labels, status options (Untested, Passed, Failed, Retest, Blocked, Skipped), buttons → translated
17. Select a status and click Save — verify success feedback → translated
18. From the Action Menu on the test case detail page → select "Edit Test Case"
19. Verify edit form: all field labels, pre-filled values, step fields, buttons → translated
20. Click Save — verify success flash message → translated
21. Navigate back to Test Cases list
22. Select the created test case checkbox
23. Select another test case checkbox (if any exist) — right-click on a selected checkbox
24. Verify context menu items → translated (including "Remove Test Cases" if suite-linked)
25. Close the context menu without performing an action
26. With test cases selected, click "Bulk Edit" option (if visible)
27. Verify bulk edit form: field labels, Requirement dropdown, buttons → translated
28. Close without saving
29. Select the created test case and drag it to the created test suite in the sidebar
30. A popup appears with options → verify all options translated: "Copy Here", "Move Here", "Cancel"
31. Click "Move Here" to move the test case into the suite
    - If drag-drop is not possible: navigate inside the test suite and create a new test case directly there
32. Navigate inside the test suite — select the test case checkbox
33. Right-click on the selected checkbox → context menu appears
34. Verify "Remove Test Cases" option → translated
35. Verify any associated message text → translated
36. Close the context menu (do NOT remove — test case needed for run)

### 8.6b — Import Test Cases
1. Navigate to Test Cases section
2. Click the **Action Menu Icon** (top of test case list) → select "Import Test Cases"
3. Verify import form — Step 1: all field labels and options → translated:
   - File upload label → translated
   - Field separator options (comma, semicolon, etc.) → translated
   - File encoding options (UTF-8, ISO-8859-1, etc.) → translated
   - Date format options → translated
   - Test Suite selection dropdown → translated
   - Next / Cancel buttons → translated
4. Click Cancel to exit without importing
   - Note: Full import wizard (column mapping → value mapping → import summary steps) should also be verified if a sample CSV is available

### 8.7 — Test Runs & Results CRUD
1. Click "Runs & Results" from the sidebar
2. Verify run list page: all headings, table headers, status badges → translated
3. Click "Add Run" button
4. Verify add run popup: all labels, fields, dropdowns (State, Run Type, Environment, Assignee), buttons → translated
   - State options: New, In progress, Done, Rejected, Under review → translated
   - Run Type options → translated
5. Submit empty — verify validation error messages → translated
6. Fill with valid data: Name (e.g. "[LANG] Test Run"), select Environment, select Assignee, set Start Date and Due Date
7. Click Create — verify success flash message → translated
8. Locate the created run row — click the **Action Button** on that row
9. A dropdown opens — verify all options (Edit Run, Delete Run, Close Run) → translated
10. Select **Edit Run** from the dropdown
11. Verify edit popup: all labels, pre-filled values, buttons → translated
12. Click Update — verify success flash message → translated
13. Locate the run row again — click the **Action Button**
14. Select **Delete Run** from the dropdown
15. Verify delete confirmation popup: all labels and buttons → translated
16. Click Cancel — do NOT delete yet
17. Locate the run row — click the **Action Button** again
18. Select **Close Run** from the dropdown
19. Verify close confirmation prompt: all text and buttons → translated
20. Click Cancel — do NOT close yet
21. Click the created run name to open the run detail page
22. Verify run detail page: all headings, table headers → translated
23. Verify test case status dropdown values: Untested, Passed, Failed, Retest, Blocked, Skipped → translated
24. Click the Result field for a test case row
25. Verify test result popup: all labels, status options, buttons → translated
26. Select a status (e.g. "Passed") and click Save
27. Verify the result is saved and any success feedback → translated
28. Click the **Filter Button** on the run detail page
29. Verify filter dropdown: all filter labels and options → translated
    - Defect Status options: "With Defect", "Without Defect" → translated
    - Other filter options (Priority, Run Result, Created At, etc.) → translated
    - Apply Filters and Clear buttons → translated
30. Close the filter without applying

### 8.8 — Reports section CRUD
1. Click "Reports" from the sidebar
2. Verify reports list: headings, table headers, empty state → translated
3. Click "New Report" button
4. Verify report form: all field labels, report type dropdown options, schedule options, buttons → translated
   - Report types: Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Requirement Coverage, Overdue Run Summary → translated
   - Schedule options: Every day, Every week, Every month, Right Now → translated
5. Fill: Name (e.g. "[LANG] Test Report"), select a report type, set date range
6. Click Create — verify success flash message → translated
7. Click the report name to view it — verify the report view page labels → translated
8. Click Edit on the created report
9. Verify edit form: all labels, buttons → translated
10. Click Update — verify success flash message → translated
11. Click Delete on the report
12. Verify delete popup: all text and buttons → translated
13. Click Delete inside popup — verify success flash message → translated

### 8.9 — Requirements section CRUD
1. Click "Requirements" from the sidebar
2. Verify page: heading, existing items, action labels → translated
3. Click the "+" (plus) icon to create a new requirement
4. Verify create form: Name field, template dropdown, Save/Cancel buttons → translated
5. Enter a name (e.g. "[LANG] Test Requirement") and click Save/Create
6. Verify the requirement is created and the blank requirement page loads → translated
7. Click the delete icon on the created requirement
8. Verify delete confirmation → translated
9. Confirm deletion — verify success → translated

### 8.10 — Traceability Matrix
1. Click "Traceability Matrix" from the sidebar
2. Verify page heading and all table headers: Requirements, Testcases, Defects → translated

### 8.11 — Overview (after data changes)
1. Navigate back to Overview from the sidebar
2. Verify all headings, status values, table headers remain in target language → translated
3. Verify run count, status badges reflect the data created above → translated

### 8.12 — Defects + Activities pages
1. Navigate to `/projects/testcase-management/defects`
2. Verify all headings, table headers, labels → translated
   - Columns: #, Priority, Subject, Defects → translated
3. Navigate to `/projects/testcase-management/testcase_activities`
4. Verify all headings, labels, activity entries → translated
   - Labels: Activity, Executed by, Testcase Result → translated

### 8.13 — Cleanup (in order)
1. Go to Runs & Results — locate the test run created in 8.7
   - Click the **Action Button** on the run row → select **Delete Run** → confirm Delete
2. Go to Test Cases section — open the test case created in 8.6
   - From the Action Menu on the test case detail page → select "Delete Test Case" → confirm
3. Go to Test Cases section — click the action icon on the test suite created in 8.5
   - Select "Delete Test Suite" → confirm Delete
4. Go to Environment section — click the **delete icon** next to the environment created in 8.4
   - Confirm Delete

**Pass Criteria for TC-008:** All navigation labels, CRUD forms, status values, validation messages, success messages, delete confirmations, and additional plugin pages are in target language. Any untranslated English string = FAIL, document as bug.

---

## TC-009: Browser console errors

**Steps:**
1. After completing all TCs above, check browser console messages
2. Verify no 404 errors for plugin assets (testcase-tour.js, testcase-tour.css)
3. Verify no JavaScript errors introduced by the language change

**Pass Criteria:** No new console errors beyond already-documented pre-existing issues (BUG-TCM-008: testcase-tour 404s).

---

## Result Summary Template

```
# [LANGUAGE CODE] Language Compatibility Test Log
# Plugin: Redmineflux Testcase Management Plugin v6.2.0
# Date: [DATE]
# Tester: Claude AI Agent (MCP Playwright)
# Environment: Forge — https://flux-flcdb9uqj49.forge.zehntech.com/
# User: admin
# Language: [Language name] ([code])

## Test Execution Summary

| TC | Section | Status | Notes |
|----|---------|--------|-------|
| TC-001 | Plugin Config — Configuration tab | PASS/FAIL | |
| TC-002 | Plugin Config — Save action | PASS/FAIL | |
| TC-003 | Plugin Config — Version footer | PASS/FAIL | |
| TC-004 | Plugin Config — Run Email Templates CRUD | PASS/FAIL | |
| TC-005 | Plugin Config — Testcase Email Templates CRUD | PASS/FAIL | |
| TC-006 | Plugin Config — Run Types CRUD | PASS/FAIL | |
| TC-007 | Project Settings — Modules | PASS/FAIL | |
| TC-008 | Full plugin navigation and CRUD | PASS/FAIL | See sub-sections 8.1–8.13 |
| TC-009 | Console validation | PASS/FAIL | |

## Bugs Found / Confirmed

| Bug ID | New/Confirmed | Description |
|--------|---------------|-------------|
| | | |

## Overall Result: PASS / FAIL
```
