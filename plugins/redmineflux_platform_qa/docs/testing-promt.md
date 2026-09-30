# Platform Plugin — Complete End-to-End QA Testing

We need to start comprehensive testing of the **Platform plugin**. This must be a complete exploratory, functional, integration, and regression testing exercise. Do not limit testing to the Platform plugin's individual screens.

## 1. First, Explore the Entire Platform Plugin

Before writing or executing test cases, thoroughly explore the Platform plugin and understand its complete functionality.

* Identify every section, submenu, tab, configuration page, form, field, action, button, and available operation.
* Explore sections such as Team, Leave, and all other available Platform modules.
* Understand the purpose of every field and how it behaves.
* Identify relationships and dependencies between different Platform sections.
* Determine which sections share data or depend on records created in other sections.
* Identify how Platform data is consumed by other installed plugins.
* Read all available documentation, including REQUIREMENTS, FEATURES_LIST, USER_GUIDE, SCOPE, MEMORY, HANDOFF, and relevant testcase documentation.
* Inspect the actual implementation where necessary to understand expected behavior, dependencies, validations, and integration points.

**Do not assume that Team, Leave, or any other section works independently.** Build a complete map of the relationships between modules before starting full execution.

## 2. Identify All Related Plugins and Integrations

The Platform plugin may share data with multiple other plugins.

For example, the Team module may be used by:

* Shift Management
* Timesheet
* Workload

Similarly, the Organization/Contact modules may be used by:

* CRM
* Helpdesk
* Invoice

Team-related and Organization/Contact-related data may also be used by other installed plugins. Discover the actual integrations rather than limiting testing to these examples.

Perform the same integration discovery for every other Platform section.

For each Platform module, identify:

1. Which other plugins use its data.
2. Which fields are shared or inherited.
3. Which records depend on it.
4. Which operations in one plugin affect another plugin.
5. Whether changes are reflected immediately or after refresh/reload.
6. Whether deleting, disabling, or modifying a record affects dependent records.
7. Whether permissions, validations, and configuration are consistent across plugins.

Create a **Platform-to-Plugin Integration Matrix** listing every discovered relationship and the test scenarios required to validate it.

## 3. Perform Complete CRUD Testing Everywhere

Test Create, Read, Update, and Delete operations for every applicable entity, section, and relevant field.

### Create

* Create records with valid data.
* Test every applicable field.
* Check required and optional fields.
* Test blank values, invalid values, boundary values, duplicate values, and incorrect formats.
* Verify dropdowns, autocomplete, multi-selects, date fields, numeric fields, checkboxes, and inherited fields.
* Check whether newly created records appear correctly in dependent sections and other plugins.

### Read

* Verify records in list views, detail pages, dropdowns, reports, and related plugin screens.
* Check search, filtering, sorting, pagination, and displayed field values wherever available.
* Verify that the data shown matches the saved data.
* Check whether users can see only the records they are authorized to access.

### Update

* Update every editable field individually and in relevant combinations.
* Verify that changes persist after saving and reloading.
* Check whether dependent modules and plugins reflect the updated values.
* Test changes to records that are already referenced by other records.
* Verify inherited/default values and ensure that changes do not silently disappear or revert.

### Delete

* Test deletion of unused records.
* Test deletion of records referenced by other modules or plugins.
* Check dependency restrictions, confirmation messages, and error handling.
* Verify what happens to historical records, reports, assignments, and existing transactions.
* Check for orphaned records, broken references, stale data, or unintended deletion of dependent information.

If a record cannot or should not be deleted because of dependencies, verify that the application handles this correctly and communicates the reason.

Do not force-delete production data or perform destructive production actions. Use the approved local/test environment and obtain explicit approval before any production create, update, or delete action.

## 4. Validate Every Field's Actual Functionality

Do not consider a field tested merely because it is visible or accepts input.

For every field, determine:

* Its intended purpose.
* Whether its value is saved correctly.
* Whether required-field validation works.
* Whether its default or inherited value is correct.
* Whether it is editable or read-only as expected.
* Whether its value affects calculations, permissions, assignments, or other business logic.
* Whether other modules and plugins use that value correctly.
* Whether blank, invalid, stale, or unavailable source values are handled correctly.
* Whether changing the source value updates dependent values as expected.
* Whether the field behaves consistently across create, edit, detail, list, and related plugin screens.

Pay particular attention to inherited fields, configuration values, dropdown options, user/team assignments, date ranges, status fields, and fields shared across plugins.

**A field is not considered fully tested until its behavior and relevant dependencies have been verified.**

## 5. Test Complete Business Workflows Across Plugins

After individual CRUD testing, validate complete end-to-end business workflows.

Do not test only isolated screens. Follow the actual sequence in which users create, assign, update, consume, and modify data.

For example, investigate and test workflows such as:

### Team → Shift Management

* Create or configure a team.
* Assign relevant users.
* Use that team in Shift Management.
* Verify team/user availability and assignments.
* Modify team membership and verify the impact on existing and new shifts.
* Test relevant edit, reassignment, and deletion scenarios.

### Team → Timesheet

* Create or modify team membership.
* Verify the relevant users and team information in Timesheet.
* Test applicable timesheet creation, submission, approval, and reporting workflows.
* Verify the effect of team membership changes on existing and new timesheets.

### Team → Workload

* Configure teams and user assignments.
* Verify the relevant team and user information in Workload.
* Test workload calculations, allocations, and reports wherever applicable.
* Modify assignments and verify that dependent workload information remains correct.

These are examples, not the complete scope. Discover and test equivalent workflows for **every Platform section and every plugin that consumes its data**.

For each workflow, verify:

* Initial setup and prerequisites.
* Correct sequence of actions.
* Data consistency between modules.
* Expected calculations and status transitions.
* Positive and negative scenarios.
* Effects of updates and deletions.
* Permission and role restrictions.
* Error handling and recovery.
* Final state after refresh, logout/login, or reopening the relevant records where applicable.

## 6. Test Cross-Module Dependencies and Edge Cases

Actively investigate failures that may occur when related data changes.

Examples:

* A team is renamed after being assigned to shifts.
* A user is removed from a team but has existing shifts, timesheets, or workload allocations.
* A team or user is disabled while dependent records exist.
* A source configuration value changes after another plugin has already consumed it.
* A referenced record is deleted or becomes unavailable.
* A required source field is blank.
* A user lacks permission to access the source module but can access a dependent module.
* Two related records are updated in quick succession.
* Multiple users or modules modify related data.
* A record is created in one module but is missing or incorrect in another.

Verify whether the observed behavior matches the documented business rules. Do not automatically report intended restrictions as bugs; investigate the requirements and actual implementation first.

## 7. Test Permissions and Security

For each relevant module and workflow, test the available roles and permissions.

* Admin access.
* Manager or team-level access, where applicable.
* Regular-user access.
* Read-only access.
* Restricted access to other users' or teams' records.

Verify that unauthorized users cannot perform restricted actions through either the UI or supported application/API paths.

Check whether hidden buttons, disabled controls, and server-side permission checks behave consistently.

## 8. Use a Strict Exploration and Execution Process

Follow this sequence:

1. Read project instructions and all required documentation.
2. Explore the complete Platform plugin.
3. Inventory every section, entity, field, action, and configuration.
4. Map relationships between Platform modules.
5. Identify every installed plugin that consumes or modifies Platform data.
6. Build the Platform-to-Plugin Integration Matrix.
7. Prepare a comprehensive testcase inventory.
8. Execute individual-module CRUD and field-validation tests.
9. Execute cross-plugin integration tests.
10. Execute complete end-to-end business workflows.
11. Execute negative, boundary, permission, and dependency tests.
12. Retest defects and perform relevant regression testing.
13. Audit coverage and identify anything not yet tested.

Use the established QA workflow, project instructions, and approved browser/MCP tooling. Prefer real UI workflows for UI testing. Do not assume an operation succeeded merely because a button was clicked; verify the persisted result and its effects.

## 9. Bug Discovery and Reporting

Actively look for defects rather than merely confirming that existing functionality works.

Investigate:

* Incorrect or missing data.
* Broken CRUD operations.
* Incorrect field values or defaults.
* Missing inherited values.
* Incorrect calculations.
* Broken cross-plugin integrations.
* Stale or inconsistent data.
* Incorrect validation.
* Permission leaks.
* Broken dependency handling.
* Unexpected deletion or data loss.
* UI/API behavior inconsistencies.
* Failures after refreshing or reopening records.
* Incorrect status transitions and workflow behavior.

Before reporting a defect:

* Reproduce it.
* Confirm the expected behavior using documentation or implementation.
* Check whether an existing bug already covers the same issue.
* Record the exact steps, test data, expected result, actual result, and supporting screenshots/evidence.
* Distinguish confirmed defects from observations or unverified suspicions.

Follow the existing project-specific bug-reporting rules. Do not create production issues without my explicit approval.

## 10. Maintain a Coverage Matrix — Nothing Should Be Silently Skipped

Maintain a traceable inventory covering:

* Every Platform section and subsection.
* Every entity and relevant field.
* Every applicable CRUD operation.
* Every validation and boundary scenario.
* Every discovered cross-module dependency.
* Every integrated plugin.
* Every end-to-end workflow.
* Every applicable role and permission.
* Every identified defect and its retest.
* Regression coverage for affected functionality.

Use clear execution statuses:

* PASS
* FAIL
* BLOCKED
* NOT EXECUTED
* NOT APPLICABLE

If something cannot be tested, document the reason and what is needed to unblock it. Do not mark untested functionality as passed.

## 11. Final Deliverables

Provide the following:

1. **Platform Module Inventory** — every discovered section, entity, field, and action.
2. **Platform-to-Plugin Integration Matrix** — all discovered cross-plugin relationships.
3. **Complete Testcase Inventory** — traceable testcases covering CRUD, fields, validations, dependencies, permissions, and workflows.
4. **Execution Evidence** — actual results and screenshots for executed tests.
5. **Bug Reports** — confirmed defects with reproduction steps and evidence.
6. **Regression Results** — verification of fixes and affected functionality.
7. **Coverage Summary** — total identified, executed, passed, failed, blocked, and not-executed testcases, with coverage gaps clearly stated.
8. **Unverified Areas** — anything that remains unexplored, untested, or dependent on missing requirements or environment access.

Use the project's existing testcase and reporting conventions. Keep the required execution deliverable in a single testcase execution report named:

`platform-tc-report-<date>`

Include the testing types performed, bug count, and regression results in that report. Do not create a separate defect report if the project instructions require all findings to be included in the single execution report.

## Final Instruction

**Completeness is the primary requirement.**

Do not stop after checking the main screens or a few happy paths. Do not assume that testing one plugin verifies its integrations with the others.

Explore the complete Platform plugin first, discover all actual dependencies, and then systematically test every applicable field, CRUD operation, integration, and end-to-end workflow.

Maintain traceability between requirements, fields, testcases, executions, and bugs. Before declaring testing complete, perform a coverage audit and explicitly identify any remaining gaps.

Start with exploration and inventory. Do not begin by randomly executing a few testcases, and do not declare completion while any identified area remains untested without a documented reason.
