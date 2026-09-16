# User Guide — Redmineflux Testcase Management

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.
> Source: vendor knowledge base — https://www.redmineflux.com/knowledge-base/plugins/testcase-management/
> Captured 2026-09-14. UI labels below are quoted from the KB; where the live UI differs, record the difference
> in `TESTCASE_MANAGEMENT_MEMORY.md` rather than silently adapting the test case.

## Getting Started

The plugin appears as a **TestCases** tab in the project menu (project module must be enabled). Inside it, a
left-hand icon sidebar gives access to each area.

Observed sidebar order on the live instances (`localhost:3010`, `localhost:3012`):

| # | Area | Path |
|---|---|---|
| 1 | Dashboard / Releases | `/test_suites/releases?project_id=<id>` |
| 2 | To-Do | `/testcase_todos?project_id=<id>` |
| 3 | Environment | `/projects/<id>/testcase_environment` |
| 4 | Test Suites / Test Cases | `/test_suites?project_id=<id>` |
| 5 | Runs & Results | `/runs/new?project_id=<id>` |
| 6 | Reports | `/projects/<id>/testcase_reports` |
| 7 | Requirements | `/requirements?project_id=<id>` |
| 8 | Traceability (RTM) | `/traceability_rtms?project_id=<id>` |

## Key Screens

- **Test Case Management dashboard** — execution-per-day chart, pass percentage, status pie, activity feed.
- **Testcase Summary** — suite tree on the left, test case grid on the right, with filters and an actions menu.
- **Runs & Results** — Active / Closed tabs, run list, per-run test case grid with a Result column.
- **Reports** — report list plus a Scheduled Reports section.
- **Requirements / RTM** — requirement documents and the coverage matrix.

## Step-by-Step Workflows

### Workflow 1: Create an Environment

1. Navigate to the **Environment** tab from the sidebar.
2. Click **Add Environment**.
3. Enter **Environment Name** and select components.
4. Click **Create**.

### Workflow 2: Add a Test Suite

1. Go to the **Test Cases** tab.
2. Click the **Test Suite** sidebar icon.
3. Select the **Add Test Suite** icon.
4. Enter **Test Suite Name** and **Description**.
5. Click **Create**.

### Workflow 3: Add a Sub-Test Suite

1. Access the **Test Cases** tab.
2. Open the **Test Suite** sidebar.
3. Click the **action icon** next to the parent suite.
4. Select **Add Sub-folder**.
5. Enter the sub-suite name and description.
6. Click **Create**.

### Workflow 4: Create a Test Case

1. Navigate to the **Test Cases** tab.
2. Click **New Test Case**.
3. Complete the required fields: **Subject**, **Description**, **Assignee**, **Category**, **Priority**.
4. Click **New Step** to add an execution step.
5. Enter **Step Description** and **Expected Result** for each step.
6. Select a **Requirement** from the dropdown.
7. Click **Create Test Case**.

### Workflow 5: Import Test Cases via CSV

1. From the Testcase Summary actions menu (**…**), choose **Import Testcases**.
2. Step 1/4 — upload the CSV; set Field Separator, Encoding, Date Format; choose the target suite.
3. Step 2/4 — column mapping. Headers are matched to fields; duplicated headers raise a warning banner.
4. Step 3/4 — value mapping.
5. Step 4/4 — preview showing counts of cases that will be created correctly / with warnings / with errors.
6. Click **Import**.

Detail and edge cases: `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`.

### Workflow 6: Create a Test Run

1. Open **Runs & Results**.
2. Click **Add Run**.
3. Complete: **Run Name**, **Note**, **Run State**, **Start Date** / **End Date**.
4. Select **Environment** and **Assignee** — multiple environments are supported.
5. Select test cases — all cases, or specific selections.
6. Add **Watchers** as needed.
7. Click **Create**.

### Workflow 7: Execute a Test Case Within a Run

1. Go to **Runs & Results**.
2. Click the **Run Name** to view its test cases.
3. Select the **Environment** to execute against.
4. Click the **Result** field next to the test case.
5. Choose a status: **Untested**, **Passed**, **Failed**, **Retest**, **Blocked**, **Skipped**.
6. For **Failed** / **Blocked**: click **Report Bug**, or link an existing defect.
7. Optionally attach files and add notes.
8. Click **Save**.

### Workflow 8: Close a Test Run

1. Open **Runs & Results**.
2. Locate the run and click its **Action Button**.
3. Select **Close Run**.
4. Confirm in the prompt.
5. The closed run moves to the **Closed** tab.

### Workflow 9: Create and Email a Report

1. Open **Reports** → **+ New report**.
2. Choose **Select Type** — one of: Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard,
   Requirement Coverage, Overdue Run Summary.
3. Supply any type-specific field (Requirement Coverage needs a **Requirement**; Activity Summary needs an
   **Activity Date Range**).
4. Enter a **Name** and optional **Description**.
5. Under **Advanced Options**, include all test runs or specific ones.
6. To email it: tick **Notify me by email**, enter one address per line, and choose
   **Email the report as PDF attachment** or **Email the report as HTML attachment**.
7. Choose **Right now** or **Schedule this report** (interval + time, UTC).
8. Click **Create**.

## UI Elements Reference

| Element | Where | Notes |
|---|---|---|
| **+ New report** | Reports | Opens the new-report form. |
| **Add Run** | Runs & Results | Opens the run form. |
| **New Test Case** | Testcase Summary | Opens the test case form. |
| **New Step** | Test case form | Adds a Step / Expected Result pair. |
| **Result** column | Run detail grid | Opens the Add Result modal for that case. |
| **Bulk Update Result** | Run detail grid | Appears once ≥1 case is ticked. Broken on v7.0.0 — BUG-TCM-003. |
| **Download HTML / PDF / Excel** | Report detail | HTML and PDF render client-side; Excel is a server route. |
| Result statuses | Add Result modal | Untested, Passed, Failed, Retest, Blocked, Skipped. |

## Notes & Known Behavior

- **Results are per environment.** Switching the environment selector on a run changes which results are shown.
- **Bulk Update Result offers a narrower status list** (Passed / Retest / Skipped) than the single Add Result
  modal (all six), because failure statuses require defect IDs that bulk mode does not collect. Appears intentional.
- **Activity Summary requires an Activity Date Range.** Without it, creation fails validation with
  "Start date cannot be blank / End date cannot be blank" and no report is created — working as intended. Note
  that the date fields only render after the report-type change event fires.
- **Report emails require Sidekiq**; **PDF attachments additionally require Node/Puppeteer/Chromium**
  (Installation step 6). Missing either produces a silent failure — see BUG-TCM-005.
- **Test cases must be created through the plugin**, not via plain issue creation, so the plugin's tracker
  validation applies.
