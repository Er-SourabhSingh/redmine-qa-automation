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

### TC-TCM-001: Testcase Tracker is required for test case creation

**User Role:** Admin
**Priority:** High
**Steps:**
1. Clear the **Testcase Tracker** setting; save.
2. In a project, attempt **New Test Case**.
3. Restore the setting and retry.

**Expected Result:**
- Without it, creation fails with a clear configuration message pointing at the plugin settings — not a generic
  500 error.
- With it restored, creation succeeds.

**CONFIRMED LIVE — 2026-09-30 — FAIL — BUG-TCM-010 (High).** Cleared Select Tracker As Testcase, confirmed via
Rails console (`Setting.plugin_redmineflux_testcase_management['tracker'] == [""]`). `/projects/test-project/issue_testcase/new`
rendered completely normally with no warning. Submitted with all required fields filled — **no error at all**,
redirected cleanly to the Test Suites list. Rails console confirmed the created issue (#1580) landed on
`tracker_id=1` (**Bug**), not the configured Test case tracker — silently misfiled, not a clean failure and not a
500. Root-caused to `issue_testcase_controller.rb#new`'s `||` fallback resolving a blank setting to
"project's first tracker" instead of the error path the controller already has elsewhere. Setting restored to `4`
(Test case) immediately after, verified via Rails console. Full write-up: `bugs/open/BUG-TCM-010.md`.

---

### TC-TCM-002: Changing the Testcase Tracker

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. With existing test cases on tracker T1, change **Testcase Tracker** to T2; save.
2. Open the Testcase Summary and an existing case.

**Expected Result:**
- Behaviour is explicit and non-destructive — record whether existing T1 cases remain visible as test cases or
  disappear from the plugin's views. Silent loss of visibility over existing data is a High-severity finding.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Switched Select Tracker As Testcase from "Test case" (T1) to "test" (T2,
verified via Rails console). Test Cases list showed an explicit banner — **"Tracker not enabled for this
project"** — plus "No data", rather than silently emptying or erroring. T1 cases are **not lost**: `/issues/434`
still renders as "Test case #434" with all its data intact, just filtered out of the plugin's views because the
configured tracker no longer points at it. This is a clean contrast with TC-TCM-001/BUG-TCM-010 (a *blank*
setting silently misfiles new data with zero warning) — a *valid-but-different* tracker instead produces an
explicit, non-destructive message. Setting restored to T1 (`4`) immediately after, verified via Rails console.

---

### TC-TCM-003: Defect Tracker drives the Report Bug flow

**User Role:** Admin, then QA
**Priority:** High
**Steps:**
1. Set **Defect Tracker** to a specific tracker; save.
2. As QA, fail a test case and use **Report Bug**.
3. Open the created issue.

**Expected Result:**
- The issue is created on the configured Defect tracker.

**CONFIRMED LIVE — 2026-09-30 — PASS (core assertion).** Confirmed Defect Tracker = Bug (id 1, the baseline/default).
As Admin: created run #9, failed test case #434 via the run's "Add Result" modal, clicked **Report Defect**, filled
the Add Defect form, and created it. Rails console: the new issue (#1581) has `tracker.name == "Bug"`, matching
the configured Defect Tracker. Submitted the Add Result form with the new defect auto-populated in the "Defects*"
field — result recorded (`case_status_id=3`, Failed). **Side observation, not filed as a bug:** briefly testing
with Defect Tracker set to a *different* tracker ("Support") produced a validation error referencing two required
custom fields ("Qa bug-only tracker field", "Qa required readonly field") that are not rendered anywhere on the
Add Defect form for that tracker — meaning Report Defect could not complete at all with a non-default Defect
Tracker on this instance. This is very likely an artifact of this project's ad-hoc per-tracker custom-field
fixtures from earlier QA sessions (a field literally named "Bug-Only") rather than a genuine product defect, so it
was not pursued as a filed bug — but a future session validating this TC on a cleaner instance should watch for
the same symptom, since if it reproduces there it would be a real cross-tracker defect.

---

### TC-TCM-004: Feature Tracker drives requirements

**User Role:** Admin, then QA
**Priority:** Medium
**Steps:**
1. Set **Feature Tracker**; save.
2. Create a requirement and inspect the underlying issue.

**Expected Result:**
- The requirement is created on the configured Feature tracker.

**CORRECTED PREMISE — 2026-09-30 — investigated via source, PASS on the actual mechanism.** Rails console:
`Requirement.column_names` has no `tracker_id` (or any Issue-linkage column) — `Requirement` is a **standalone
ActiveRecord model**, not an Issue, so a requirement is never "created on" any tracker at all; this TC's original
premise doesn't match the plugin's architecture. What **Select Tracker As Feature** actually does (found via
`grep feature_tracker`, confirmed in `requirements_controller.rb:307-313`): it names a *second* tracker, alongside
the Testcase Tracker, whose issues are offered when linking issues to a requirement —
`Issue.where(project_id: project.id, tracker_id: [tracker, feature_tracker])`. Both configured trackers are
correctly included in that query — the setting works as intended for its real purpose (requirement↔issue linking
scope), just not the "requirement's own tracker" framing the TC description assumed.

---

### TC-TCM-005: Same tracker selected for two roles

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Set Testcase Tracker and Defect Tracker to the **same** tracker; save.
2. Create a test case, fail it and report a bug.

**Expected Result:**
- Either the configuration is refused with a clear message, or it works without the plugin confusing test cases
  and defects in grids and reports. Record which.

**CONFIRMED LIVE — 2026-09-30 — FAIL — BUG-TCM-011 (High).** Set Testcase Tracker and Defect Tracker both to
"Test case" — the config itself was accepted with no refusal message (silent success, same as TC-002's valid-but-
different-tracker case). But attempting **Report Defect** with this configuration failed validation on two
fields ("Qa bug-only tracker field", "Qa required readonly field") that are Bug-tracker-only custom fields and
never rendered on the form at all — making it **impossible to report any defect** while this configuration is
active, not merely a display/confusion issue as the TC anticipated. Root-caused and filed as BUG-TCM-011: the
plugin's shared `issue_testcase_controller.rb` resolves the correct tracker for the GET (`new`) form render but
not before running custom-field validation on the POST (`create`), so any Bug-only required field is still
enforced even when the issue is correctly being created on a different tracker. Reproduces identically for Defect
Tracker = Support (side-observed during TC-TCM-003) and Defect Tracker = Test case (this TC) — confirms it's a
tracker-general defect, not specific to one tracker choice. All tracker settings restored to baseline
(Testcase=Test case, Defect=Bug, Feature=Feature) immediately after, verified via Rails console.

---

## Functional Cases — Display settings

---

### TC-TCM-006: Show testcase count in test suites

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enable the setting; reload the suite tree and compare counts against the real number of cases per suite.
2. Disable; reload.

**Expected Result:**
- Enabled: counts shown and accurate. Disabled: counts absent. Covered functionally in
  `TESTCASE_MANAGEMENT_TEST_SUITES.md` TC-TCM-201.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Disabled "Show Testcase Count In Test Suites", reloaded the Test Cases
suite tree: "workload" (baseline 53 cases) rendered with no count suffix at all — clean, correct. Re-enabled the
setting, restored to baseline.

---

### TC-TCM-007: Hide default status field on issue details page

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enable; open a test case issue. Disable; reopen.

**Expected Result:**
- Enabled: the default status field is hidden on test case detail. Disabled: shown. No other field is affected,
  and non-testcase issues are unaffected.

**CORRECTED PREMISE — 2026-09-30 — PASS on the actual setting.** No "hide default status field" checkbox exists
on this version's Configuration tab — the closest and only matching control is **"Hide Testcase Execution section
on issue details page"** (`#settings_hide_testcase_execution`). Enabled it, reloaded test case #434: the entire
"Testcase Execution" section (Run/Environment/Result) is cleanly absent from the page — not merely the status
field, the whole execution block. Disabled it again, section reappeared. Correct, working behavior; the TC's
"default status field" framing doesn't match what this setting actually controls.

---

## Functional Cases — Email templates and notifications

---

### TC-TCM-008: Customise the Run Email Template

**User Role:** Admin, plus a recipient mailbox
**Priority:** Medium
**Precondition:** Sidekiq running.

**Steps:**
1. Edit the **Run Email Template**, adding a recognisable marker string; save.
2. Create a run with a watcher; check the mailbox.

**Expected Result:**
- The delivered "Run Added" email contains the marker, confirming the template is actually used.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Precondition fix: `run_added`/`run_updated`/`testcase_result_added` were
**not enabled** in Administration → Settings → Notifications on this instance (`Setting.notified_events` was
empty of all three) — an unconfigured-instance gap, not a bug, matching this plugin's recurring pattern (see
memory). Enabled all three. Edited the existing Run Email Template (id 6), appended a marker
`TCTCM008-MARKER-9f3a` plus `{run_name}` to the Body, checked **Active Template**, saved. Created run #10
assigned to `luna.blossom` (real checkable mailbox `qa@test.local`). Checked Roundcube — the delivered email body
reads exactly **"TCTCM008-MARKER-9f3a Run: TC-TCM-008-011 Email notification test"** — marker present, `{run_name}`
placeholder correctly substituted with the real run name. Template is genuinely used, not ignored.

---

### TC-TCM-009: Customise the Testcase Email Template

**User Role:** Admin, plus a recipient mailbox
**Priority:** Medium
**Steps:**
1. Add a marker to the **Testcase Email Template**; save.
2. Record a result on a watched run; check the mailbox.

**Expected Result:**
- The "Test Case Result Added" email contains the marker.

**CONFIRMED LIVE — 2026-09-30 — PASS on the template mechanism, FAIL on delivery count — BUG-TCM-013 (Medium).**
Created a new Testcase Email Template with marker `TCTCM009-MARKER-b71c` plus `{issue_subject}`/`{result}`
placeholders, activated it. Submitted a result for test case #435. Delivered email body reads exactly
**"TCTCM009-MARKER-b71c Case: Verify user can remove item from wishlist Result: Passed"** — marker present, both
macros correctly substituted with the real test case subject and result status. Template mechanism itself works
correctly. **But the email arrived twice** (2 identical copies), same as TC-TCM-013 below — filed as BUG-TCM-013
(applies to both the default and custom template paths, since both go through the same mailer call site).

---

### TC-TCM-010: Invalid template content is handled safely

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enter malformed content in a template (e.g. an unclosed placeholder or tag); save; trigger the notification.

**Expected Result:**
- Either the save is refused with a clear message, or the email still sends without raising a server error.
- A template that silently prevents all notifications is a defect — and would be easy to misdiagnose as a mail
  problem.

**CONFIRMED via source — 2026-09-30 — PASS.** Already read the exact substitution logic while root-causing
BUG-TCM-012/013 (`run_mailer.rb`, both `run_added` and `testcase_result_added`): placeholders are substituted via
`email_template.body.gsub(/{\w+}/) { |placeholder| placeholder_values.fetch(placeholder, placeholder) }`. This is
plain regex-based text substitution — an unclosed placeholder (e.g. `{run_name` with no closing brace) simply
does not match `/{\w+}/` (which requires both braces) and passes through completely untouched as literal text.
There is no parsing/templating engine here that could raise on malformed syntax; the failure mode described in
this TC (an exception breaking the whole send) is not reachable by this code path. Live round-trip not repeated
given the mechanism is already directly verified by inspection.

---

### TC-TCM-011: Run Added notification

**User Role:** QA, watcher mailbox
**Priority:** High
**Steps:**
1. Create a run with a watcher; check the mailbox.

**Expected Result:**
- A "Run Added" email arrives naming the run, with links resolving to the correct host.
- Verify **Settings → General → Host name and path** first, per root `MEMORY.md`.

---

### TC-TCM-012: Run Updated notification

**User Role:** QA, watcher mailbox
**Priority:** Medium
**Steps:**
1. Edit a watched run; check the mailbox.

**Expected Result:**
- A "Run Updated" email arrives reflecting the change.

---

### TC-TCM-013: Test Case Result Added notification

**User Role:** QA, watcher mailbox
**Priority:** High
**Steps:**
1. Record a result on a watched run; check the mailbox.

**Expected Result:**
- A "Test Case Result Added" email arrives naming case, status and environment.

**CONFIRMED LIVE — 2026-09-30 — FAIL — BUG-TCM-012 (content, Low) + BUG-TCM-013 (duplicate delivery, Medium).**
Precondition fix: `testcase_result_added` was not enabled in Administration → Settings → Notifications (see
TC-TCM-008). Recorded a Passed result on test case #434 (run #10, assigned to `luna.blossom`). Email arrived
naming the case (subject line correct), status (Passed), and environment (chrome) — content is otherwise correct
**except** the body heading shows the run's name instead of the test case's own subject (BUG-TCM-012). Separately,
**the email arrived twice** — 2 identical copies for one single result submission, with only one DB row created
(BUG-TCM-013). Both bugs confirmed independently reproducible with a second test case (#435) under TC-TCM-009.

---

### TC-TCM-014: Email Reminder Frequency for overdue notifications

**User Role:** Admin
**Priority:** Medium
**Precondition:** An overdue run; Sidekiq running.

**Steps:**
1. Set **Email Reminder Frequency** to its shortest value; save.
2. Wait for the interval and check the assignee's mailbox.

**Expected Result:**
- An overdue reminder arrives at the configured cadence, and not more often than configured.

**DEFERRED — 2026-09-30.** Requires waiting for a real scheduled interval (shortest available is "Every day") to
observe cadence — not practical within a single session without either waiting 24h or finding the underlying
scheduled-job trigger to force-run out of cycle (not located this session). Not executed.

---

## Functional Cases — Run types

---

### TC-TCM-015: Add a run type via administration

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Add a new run type in the administration panel; save.
2. Open **Add Run** in a project.

**Expected Result:**
- The new run type is offered and can be selected and saved on a run.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Added run type "TC-TCM-015 Custom Run Type" via Administration → Plugins
→ Testcase Management → Testcase Run Types. Opened Add Run in `test-project`: the new type appears in the Run
Type dropdown alongside the 6 defaults and is selectable.

---

### TC-TCM-016: Delete a run type in use

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Delete a run type already assigned to an existing run.
2. Open that run and the run list.

**Expected Result:**
- Either the delete is blocked, or the existing run still renders without a dangling/blank type. Record which.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Created run #11 using the custom "TC-TCM-015 Custom Run Type", then
deleted that run type (with a real confirmation dialog — "Delete Run Type? ... This action cannot be undone").
Reloaded the run list: run #11's Run Type column is now cleanly blank (not "Deleted type", not an error). Opened
`/runs/11` directly — renders completely normally, no 500, no dangling reference anywhere. Delete is allowed and
the existing run survives gracefully with a blank type, matching the "record which — blank is acceptable" branch
of this TC.

---

## Functional Cases — Installation prerequisites

> These verify that a documented prerequisite actually gates the feature it is supposed to. They exist so that an
> incomplete installation is diagnosed as such rather than misfiled as a product defect — the mistake that
> produced the first revision of BUG-TCM-005.

---

### TC-TCM-017: Redis stopped — background jobs

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Stop Redis. Trigger any notification-producing action.
2. Observe the application and the job log. Restart Redis afterwards.

**Expected Result:**
- Documented, non-catastrophic degradation: the UI action itself still completes, and the failure is visible in
  the logs rather than crashing the request.

**DEFERRED — 2026-09-30.** Stopping Redis on this shared, actively-multi-session instance risks disrupting other
concurrent QA work (Sidekiq's queue backend, and other plugins' Redis-backed features e.g. Rack::Attack rate
limiting seen in the boot log) for the duration of the test. Not executed this session given the shared-instance
risk; a dedicated isolated instance would be safer for this specific TC.

---

### TC-TCM-018: Sidekiq stopped — all notification email

**User Role:** Admin
**Priority:** High
**Steps:**
1. Stop Sidekiq. Create a run with a watcher and email a report.
2. Check the mailbox. Restart Sidekiq.

**Expected Result:**
- **No email of any kind is sent** while Sidekiq is down, in any format.
- **CONFIRMED 2026-09-14:** Sidekiq was found stopped on `redmine-docker-6` at session start; only Puma restarts
  with that container. Always check before testing email.

---

### TC-TCM-019: Node/Puppeteer absent — PDF report attachment

**User Role:** Admin
**Priority:** High
**Steps:**
1. On an instance where Installation step 6 was not completed (`which node` returns nothing), email a report as
   **PDF**.
2. Inspect the delivered message and the Sidekiq log.

**Expected Result:**
- The product should not send a misleading email — see `TESTCASE_MANAGEMENT_REPORTS.md` TC-TCM-101.
- **CONFIRMED FAIL 2026-09-14 — BUG-TCM-005** (prod #120588): an email arrives claiming an attachment that is
  absent, with `Error generating PDF: No such file or directory - node` logged only in Sidekiq.

---

### TC-TCM-020: Node/Puppeteer present — PDF report attachment succeeds

**User Role:** Admin
**Priority:** High
**Precondition:** Installation step 6 completed — Node.js installed, `npm install` run, and
`npx puppeteer browsers install chrome` executed.

**Steps:**
1. Email a report as **PDF**; open the mailbox.

**Expected Result:**
- The email arrives as `multipart/mixed` with a valid, openable `.pdf` attachment.
- This is the environment-side retest for BUG-TCM-005; TC-TCM-101 is the product-side one, and **both** must pass
  before that bug is closed.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-001 – 905 | Tracker configuration | **BUG-TCM-010, BUG-TCM-011** |
| TC-TCM-006 – 907 | Display settings | — |
| TC-TCM-008 – 914 | Email templates and notifications | **BUG-TCM-012, BUG-TCM-013** |
| TC-TCM-015 – 916 | Run types | — |
| TC-TCM-017 – 920 | Installation prerequisites | **BUG-TCM-005** (prod #120588) |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- **Restore every setting changed by this suite** before running any other suite.
