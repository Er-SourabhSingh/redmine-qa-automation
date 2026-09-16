# Plugin Requirements — Redmineflux Testcase Management

> Source: vendor knowledge base — https://www.redmineflux.com/knowledge-base/plugins/testcase-management/
> Captured 2026-09-14. Where this file and the live UI disagree, re-check the KB before filing a bug
> (see root `MEMORY.md` — "Verify Bug Claims Against Source Docs").

## Overview

Redmine has no native concept of test suites, test runs, or QA execution tracking. This plugin adds a full test
management layer natively inside Redmine, with traceability from requirement → test case → test run → defect →
release.

Test cases and defects are stored as **Redmine issues** on configurable trackers, so they inherit Redmine's own
permissions, workflow and custom fields.

## Version Compatibility

| Item | Supported |
|---|---|
| Redmine | 5.0.x and 6.0.x |
| Editor | CKEditor integration supported |

> Note: the QA instances in use are Redmine 6.1.3 (`localhost:3012`) and 7.0.0 (`localhost:3010`). Both are
> **outside** the documented support matrix — worth stating in any bug filed against them.

## Installation Prerequisites (critical for testing)

The plugin is **not** self-contained. Per the KB Installation section, a working deployment requires:

| Step | Requirement | Why it matters to QA |
|---|---|---|
| 3 | `bundle install` | Ruby gems |
| 4 | `rails redmine:plugins:migrate` | schema |
| 5 | **Redis** | backs background jobs |
| 6 | **Node.js + Puppeteer + Chromium** (`"puppeteer": "^22.8.2"`, `npm install`, `npx puppeteer browsers install chrome`) | **server-side PDF generation**; without it, emailed PDF reports silently arrive with no attachment (BUG-TCM-005) |
| 7 | **Sidekiq** (`bundle exec sidekiq`) | **all report/notification email**; without it no report email is sent at all, in any format |

**Before testing any email, report or scheduled behaviour, verify Redis + Sidekiq are running and Node/Puppeteer
are installed.** A large class of apparent "bugs" on these instances is really an incomplete step 5/6/7.

## Key Features

1. **Environments** — named execution environments, assigned to runs; results are recorded per environment.
2. **Test Suites** — hierarchical folders (suites and sub-suites) holding test cases.
3. **Test Cases** — issues on the Testcase tracker, with ordered Step / Expected Result pairs.
4. **CSV Import** — 4-step wizard importing test cases with numbered `Step N` / `Expected Result N` columns.
5. **Test Runs** — a named execution cycle over selected test cases, with state, dates, assignee, watchers, and one or more environments.
6. **Test Execution** — recording a result per test case per environment, with notes, attachments and linked defects.
7. **Reports** — six report types, viewable in-app and emailable as HTML or PDF attachment, one-off or scheduled.
8. **Requirements & Traceability (RTM)** — requirement documents linked to test cases, with a coverage matrix.
9. **To-Do** — per-user list of assigned test execution work.
10. **Activity Log** — timestamped audit of execution actions.

## Business Workflows

1. **Setup:** configure trackers → create environments → create test suites.
2. **Author:** create test cases (manually or via CSV import) → link to requirements.
3. **Plan:** create a test run → select environment(s) → select test cases → assign.
4. **Execute:** open the run → pick environment → set a result per case → report/link defects on failure.
5. **Report:** generate a report → view in-app, or email as HTML/PDF, one-off or scheduled.
6. **Close:** close the run; it moves to the Closed tab.

## Permissions Matrix

Permissions are granted per Redmine role under the plugin's own permission groups.

| Permission group | Permission | Admin | Manager | Developer | QA | Client | Non-member |
|---|---|---|---|---|---|---|---|
| Test Suite Management | Create Test Suite | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Edit Test Suite | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Delete Test Suite | ✔ | ✔ | ✘ | — | ✘ | ✘ |
| Test Run Management | Create Run | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Edit Run | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Delete Run | ✔ | ✔ | ✘ | — | ✘ | ✘ |
| | Close Run | ✔ | ✔ | ✘ | ✔ | ✘ | ✘ |
| Test Execution | Execute Testcase | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ |
| Reporting | Create Report | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Edit Report | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Delete Report | ✔ | ✔ | ✘ | — | ✘ | ✘ |
| | View Report | ✔ | ✔ | ✔ | ✔ | — | ✘ |
| To-Do Management | View All To-Do's | ✔ | ✔ | ✘ | — | ✘ | ✘ |
| Requirement Management | Add Requirement | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Edit Requirement | ✔ | ✔ | — | ✔ | ✘ | ✘ |
| | Delete Requirement | ✔ | ✔ | ✘ | — | ✘ | ✘ |

✔ = expected granted · ✘ = expected denied · — = **not yet confirmed on a live instance; verify before asserting
in a bug.** The KB lists the permission names but does not prescribe a role mapping — the columns above are this
project's intended baseline and must be established by executing `TESTCASE_MANAGEMENT_PERMISSIONS.md`.

## Configuration (Administration → Plugins → Testcase Management → Configure)

| Setting | Notes |
|---|---|
| Testcase Tracker | Tracker treated as test cases. **Mandatory** — testcase creation fails without it. |
| Defect Tracker | Tracker used when reporting a bug from a failed execution. |
| Feature Tracker | Tracker used for requirements/features. |
| Show testcase count in test suites | Display toggle. |
| Hide default status field on issue details page | Display toggle. |
| Email Reminder Frequency | Cadence for overdue notifications. |
| Run Email Template | Customisable template for run notifications. |
| Testcase Email Template | Customisable template for testcase result notifications. |

Email notification events: **Run Added**, **Run Updated**, **Test Case Result Added**.

## Known Constraints

- Test case **result statuses** are fixed: Untested, Passed, Failed, Retest, Blocked, Skipped.
- **Failed / Blocked** results are expected to carry a defect (report new, or link existing).
- Results are recorded **per environment** — the same case can hold different results in different environments.
- **Sidekiq is not officially supported on native Windows**; the KB recommends WSL2 or Docker Desktop.
- Report emailing depends on Sidekiq; PDF report attachments additionally depend on Node/Puppeteer/Chromium.
- Bulk update of results inside a run is broken on plugin v7.0.0 (BUG-TCM-003) — the endpoint rejects the browser session.
