# Test Cases — Redmineflux Testcase Management — Configuration, Notifications & Prerequisites

> Source: vendor KB "Configuration", "Roles & Permissions", "Installation" and "Enable email notifications".
> **Status: authored 2026-09-14.** TC-TCM-923 – 926 already carry partial live evidence from the 2026-09-14
> session; the rest are not yet executed.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Administration → Plugins → **Testcase Management** → **Configure**. Every setting change must be verified by its
*effect* in the project UI, not by the settings page reporting a successful save.

> **Warning:** these cases change instance-wide settings. Record the original values first and restore them
> afterwards, or later suites will run against an altered configuration.

---

## Functional Cases — Tracker configuration

---

### TC-TCM-901: Testcase Tracker is required for test case creation

**User Role:** Admin
**Steps:**
1. Clear the **Testcase Tracker** setting; save.
2. In a project, attempt **New Test Case**.
3. Restore the setting and retry.

**Expected Result:**
- Without it, creation fails with a clear configuration message pointing at the plugin settings — not a generic
  500 error.
- With it restored, creation succeeds.

---

### TC-TCM-902: Changing the Testcase Tracker

**User Role:** Admin
**Steps:**
1. With existing test cases on tracker T1, change **Testcase Tracker** to T2; save.
2. Open the Testcase Summary and an existing case.

**Expected Result:**
- Behaviour is explicit and non-destructive — record whether existing T1 cases remain visible as test cases or
  disappear from the plugin's views. Silent loss of visibility over existing data is a High-severity finding.

---

### TC-TCM-903: Defect Tracker drives the Report Bug flow

**User Role:** Admin, then QA
**Steps:**
1. Set **Defect Tracker** to a specific tracker; save.
2. As QA, fail a test case and use **Report Bug**.
3. Open the created issue.

**Expected Result:**
- The issue is created on the configured Defect tracker.

---

### TC-TCM-904: Feature Tracker drives requirements

**User Role:** Admin, then QA
**Steps:**
1. Set **Feature Tracker**; save.
2. Create a requirement and inspect the underlying issue.

**Expected Result:**
- The requirement is created on the configured Feature tracker.

---

### TC-TCM-905: Same tracker selected for two roles

**User Role:** Admin
**Steps:**
1. Set Testcase Tracker and Defect Tracker to the **same** tracker; save.
2. Create a test case, fail it and report a bug.

**Expected Result:**
- Either the configuration is refused with a clear message, or it works without the plugin confusing test cases
  and defects in grids and reports. Record which.

---

## Functional Cases — Display settings

---

### TC-TCM-906: Show testcase count in test suites

**User Role:** Admin
**Steps:**
1. Enable the setting; reload the suite tree and compare counts against the real number of cases per suite.
2. Disable; reload.

**Expected Result:**
- Enabled: counts shown and accurate. Disabled: counts absent. Covered functionally in
  `TESTCASE_MANAGEMENT_TEST_SUITES.md` TC-TCM-210.

---

### TC-TCM-907: Hide default status field on issue details page

**User Role:** Admin
**Steps:**
1. Enable; open a test case issue. Disable; reopen.

**Expected Result:**
- Enabled: the default status field is hidden on test case detail. Disabled: shown. No other field is affected,
  and non-testcase issues are unaffected.

---

## Functional Cases — Email templates and notifications

---

### TC-TCM-908: Customise the Run Email Template

**User Role:** Admin, plus a recipient mailbox
**Precondition:** Sidekiq running.

**Steps:**
1. Edit the **Run Email Template**, adding a recognisable marker string; save.
2. Create a run with a watcher; check the mailbox.

**Expected Result:**
- The delivered "Run Added" email contains the marker, confirming the template is actually used.

---

### TC-TCM-909: Customise the Testcase Email Template

**User Role:** Admin, plus a recipient mailbox
**Steps:**
1. Add a marker to the **Testcase Email Template**; save.
2. Record a result on a watched run; check the mailbox.

**Expected Result:**
- The "Test Case Result Added" email contains the marker.

---

### TC-TCM-910: Invalid template content is handled safely

**User Role:** Admin
**Steps:**
1. Enter malformed content in a template (e.g. an unclosed placeholder or tag); save; trigger the notification.

**Expected Result:**
- Either the save is refused with a clear message, or the email still sends without raising a server error.
- A template that silently prevents all notifications is a defect — and would be easy to misdiagnose as a mail
  problem.

---

### TC-TCM-911: Run Added notification

**User Role:** QA, watcher mailbox
**Steps:**
1. Create a run with a watcher; check the mailbox.

**Expected Result:**
- A "Run Added" email arrives naming the run, with links resolving to the correct host.
- Verify **Settings → General → Host name and path** first, per root `MEMORY.md`.

---

### TC-TCM-912: Run Updated notification

**User Role:** QA, watcher mailbox
**Steps:**
1. Edit a watched run; check the mailbox.

**Expected Result:**
- A "Run Updated" email arrives reflecting the change.

---

### TC-TCM-913: Test Case Result Added notification

**User Role:** QA, watcher mailbox
**Steps:**
1. Record a result on a watched run; check the mailbox.

**Expected Result:**
- A "Test Case Result Added" email arrives naming case, status and environment.

---

### TC-TCM-914: Email Reminder Frequency for overdue notifications

**User Role:** Admin
**Precondition:** An overdue run; Sidekiq running.

**Steps:**
1. Set **Email Reminder Frequency** to its shortest value; save.
2. Wait for the interval and check the assignee's mailbox.

**Expected Result:**
- An overdue reminder arrives at the configured cadence, and not more often than configured.

---

## Functional Cases — Run types

---

### TC-TCM-915: Add a run type via administration

**User Role:** Admin
**Steps:**
1. Add a new run type in the administration panel; save.
2. Open **Add Run** in a project.

**Expected Result:**
- The new run type is offered and can be selected and saved on a run.

---

### TC-TCM-916: Delete a run type in use

**User Role:** Admin
**Steps:**
1. Delete a run type already assigned to an existing run.
2. Open that run and the run list.

**Expected Result:**
- Either the delete is blocked, or the existing run still renders without a dangling/blank type. Record which.

---

## Functional Cases — Installation prerequisites

> These verify that a documented prerequisite actually gates the feature it is supposed to. They exist so that an
> incomplete installation is diagnosed as such rather than misfiled as a product defect — the mistake that
> produced the first revision of BUG-TCM-005.

---

### TC-TCM-917: Redis stopped — background jobs

**User Role:** Admin
**Steps:**
1. Stop Redis. Trigger any notification-producing action.
2. Observe the application and the job log. Restart Redis afterwards.

**Expected Result:**
- Documented, non-catastrophic degradation: the UI action itself still completes, and the failure is visible in
  the logs rather than crashing the request.

---

### TC-TCM-918: Sidekiq stopped — all notification email

**User Role:** Admin
**Steps:**
1. Stop Sidekiq. Create a run with a watcher and email a report.
2. Check the mailbox. Restart Sidekiq.

**Expected Result:**
- **No email of any kind is sent** while Sidekiq is down, in any format.
- **CONFIRMED 2026-09-14:** Sidekiq was found stopped on `redmine-docker-6` at session start; only Puma restarts
  with that container. Always check before testing email.

---

### TC-TCM-919: Node/Puppeteer absent — PDF report attachment

**User Role:** Admin
**Steps:**
1. On an instance where Installation step 6 was not completed (`which node` returns nothing), email a report as
   **PDF**.
2. Inspect the delivered message and the Sidekiq log.

**Expected Result:**
- The product should not send a misleading email — see `TESTCASE_MANAGEMENT_REPORTS.md` TC-TCM-524.
- **CONFIRMED FAIL 2026-09-14 — BUG-TCM-005** (prod #120588): an email arrives claiming an attachment that is
  absent, with `Error generating PDF: No such file or directory - node` logged only in Sidekiq.

---

### TC-TCM-920: Node/Puppeteer present — PDF report attachment succeeds

**User Role:** Admin
**Precondition:** Installation step 6 completed — Node.js installed, `npm install` run, and
`npx puppeteer browsers install chrome` executed.

**Steps:**
1. Email a report as **PDF**; open the mailbox.

**Expected Result:**
- The email arrives as `multipart/mixed` with a valid, openable `.pdf` attachment.
- This is the environment-side retest for BUG-TCM-005; TC-TCM-524 is the product-side one, and **both** must pass
  before that bug is closed.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-901 – 905 | Tracker configuration | — |
| TC-TCM-906 – 907 | Display settings | — |
| TC-TCM-908 – 914 | Email templates and notifications | — |
| TC-TCM-915 – 916 | Run types | — |
| TC-TCM-917 – 920 | Installation prerequisites | **BUG-TCM-005** (prod #120588) |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- **Restore every setting changed by this suite** before running any other suite.
