# Features List — Redmineflux Testcase Management

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Derived from the vendor knowledge base (captured 2026-09-14):
> https://www.redmineflux.com/knowledge-base/plugins/testcase-management/

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | CSV Import — Steps & Expected Results | 4-step wizard (upload → column mapping → value mapping → preview/confirm), legacy single `Steps`/`Expected` pair and numbered `Step N`/`Expected Result N` columns, per-step validation. | TC-TCM-021 – TC-TCM-036 (`TESTCASE_MANAGEMENT_CSV_IMPORT.md`) |
| 2 | Environment management | Create, edit, delete named execution environments; assign to runs; results recorded per environment. | TC-TCM-038 – TC-TCM-045 (`TESTCASE_MANAGEMENT_ENVIRONMENTS.md`) |
| 3 | Test suite management | Create/edit/delete suites; add sub-suites (nesting); testcase count display toggle. | TC-TCM-192 – TC-TCM-203 (`TESTCASE_MANAGEMENT_TEST_SUITES.md`) |
| 4 | Test case authoring | Create/edit/delete test cases; ordered Step + Expected Result pairs; assignee, category, priority; requirement linking. | TC-TCM-128 – TC-TCM-143 (`TESTCASE_MANAGEMENT_TEST_CASES.md`) |
| 5 | Test case ↔ suite organisation | Drag-and-drop cases into suites; add/copy cases to a suite; remove cases from a suite; bulk-assign requirements. | TC-TCM-144 – TC-TCM-151 (`TESTCASE_MANAGEMENT_TEST_CASES.md`) |
| 6 | Test run lifecycle | Create/edit/close/delete runs; run state; start/end dates; multi-environment; assignee; watchers; case selection; Active/Closed tabs. | TC-TCM-152 – TC-TCM-169 (`TESTCASE_MANAGEMENT_TEST_RUNS.md`) |
| 7 | Test execution | Record a result per case per environment (Untested/Passed/Failed/Retest/Blocked/Skipped); notes; attachments; report or link a defect; execute from the case detail page; execution history; filter by defect status. | TC-TCM-170 – TC-TCM-187 (`TESTCASE_MANAGEMENT_TEST_RUNS.md`) |
| 8 | Bulk update of results | Set a result for multiple selected cases in one run at once. | TC-TCM-188 – TC-TCM-191 (`TESTCASE_MANAGEMENT_TEST_RUNS.md`) — **currently blocked by BUG-TCM-003** |
| 9 | Reporting | Six report types (Testcase Summary, Defect Summary, Activity Summary, Tester Scorecard, Requirement Coverage, Overdue Run Summary); view/edit/delete; in-app download as HTML/PDF/Excel. | TC-TCM-078 – TC-TCM-097 (`TESTCASE_MANAGEMENT_REPORTS.md`) |
| 10 | Report emailing & scheduling | Email a report as HTML or PDF attachment; recipient list; send now or on a schedule (daily/weekly/monthly at a UTC time); Scheduled Reports list; cancel scheduling. | TC-TCM-098 – TC-TCM-111 (`TESTCASE_MANAGEMENT_REPORTS.md`) — **PDF path affected by BUG-TCM-005** |
| 11 | Requirements management | Create requirement documents; link test cases to requirements; edit/delete requirements. | TC-TCM-112 – TC-TCM-121 (`TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md`) |
| 12 | Traceability matrix (RTM) | Coverage view of requirements against test cases and their results. | TC-TCM-122 – TC-TCM-127 (`TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md`) |
| 13 | To-Do management | Per-user list of assigned execution work; "View All To-Do's" permission widens visibility. | TC-TCM-205 – TC-TCM-210 (`TESTCASE_MANAGEMENT_TODO.md`) |
| 14 | Activity log | Timestamped audit of execution actions. | TC-TCM-211 – TC-TCM-214 (`TESTCASE_MANAGEMENT_TODO.md`) |
| 15 | Roles & permissions | 16 permissions across 6 groups; positive UI, negative UI-absence, and direct-URL enforcement per role. | TC-TCM-046 – TC-TCM-077 (`TESTCASE_MANAGEMENT_PERMISSIONS.md`) |
| 16 | Plugin configuration | Tracker selection (Testcase/Defect/Feature); display toggles; email reminder frequency; Run and Testcase email template customisation; run types. | TC-TCM-001 – TC-TCM-007, TC-TCM-015 – TC-TCM-016 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`) |
| 17 | Email notifications | Run Added, Run Updated, Test Case Result Added. | TC-TCM-008 – TC-TCM-014 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`) |
| 18 | Installation prerequisites | Redis, Node.js + Puppeteer + Chromium, Sidekiq — each gates a user-visible feature. | TC-TCM-017 – TC-TCM-020 (`TESTCASE_MANAGEMENT_CONFIGURATION.md`) |

## Notes

- Feature #1 is the only area with completed execution (16/16 PASS, regression 2026-09-11). Everything else is
  **authored but not yet executed**.
- Features #8 and #10 have **known open defects** (BUG-TCM-003, BUG-TCM-005). Their test cases are written to the
  documented expected behaviour, so they are expected to FAIL until those bugs are fixed — that is intentional and
  makes them the retest vehicle.
- Features #15 and #18 are the highest-value untested areas: permissions because a gap there is a data-exposure
  risk (see root `MEMORY.md` on testing the URL directly, not just UI absence), and prerequisites because an
  incomplete install silently disables whole features rather than erroring.
- The KB documents Redmine **5.0.x / 6.0.x** support. Both QA instances are outside that range (6.1.3 and 7.0.0) —
  state this in any bug filed from them.
