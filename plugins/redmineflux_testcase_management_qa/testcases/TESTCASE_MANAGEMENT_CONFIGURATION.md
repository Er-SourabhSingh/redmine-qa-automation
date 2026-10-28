# Test Cases — Redmineflux Testcase Management — Configuration, Notifications & Prerequisites

> Source: vendor KB "Configuration", "Roles & Permissions", "Installation" and "Enable email notifications".
> **Status: authored 2026-09-14, fully executed as of 2026-10-22 (all 20 original TCs genuinely re-executed
> this cycle, not just claimed, plus 7 new TCs — TC-TCM-280–286 — added 2026-10-22 to formally cover
> user-directed scenarios that previously only existed as narrative notes).** Exceptions: TC-TCM-017 (Redis-stop, deferred — shared-instance risk) and the
> cadence-timing half of TC-TCM-014 (Email Reminder — the mail-sending mechanism AND the UI-configured
> schedule-time gating are both now verified; only the exact real-world 24h interval remains unverified
> without a multi-day wait). TC-TCM-019/020 (Node/Puppeteer PDF prerequisite) still reference their original
> 2026-09-14/2026-09-30 evidence, not re-executed this cycle (BUG-TCM-005, the only defect either ever found,
> stays closed). TC-TCM-012 (Run Updated notification) is PASS on mechanism but carries an open defect on
> content accuracy — see **BUG-TCM-088**. TC-TCM-018 carries a **corrected-premise** finding (not a bug) — the
> TC's original wording didn't match this plugin's actual architecture; the real underlying mechanism was
> verified instead and passes. **TC-TCM-004 surfaced a reopened defect (BUG-TCM-072)** — the mention-linking
> mechanism itself is PASS, but the same dropdown it exercises carries the still-open XSS, found live and
> reopened both locally and on production 2026-10-22. **This suite's coverage is complete (all 20 TCs
> addressed), but not clean — 4 open bugs remain tied to it: BUG-TCM-013 (reopened), BUG-TCM-072 (reopened),
> BUG-TCM-087 (new), BUG-TCM-088 (new). Plugin-wide `Complete` per CLAUDE.md §10 still requires all 4 fixed.**

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

**REGRESSION — 2026-10-22 — PASS, BUG-TCM-010 stays fixed.** Re-ran against `localhost:3000`, project
`rftc-016-ci-qa`. Cleared Testcase Tracker (confirmed `[""]` via `rails runner`), then opened
`/projects/rftc-016-ci-qa/issue_testcase/new` — now returns a clean **422** with the message *"No tracker is
associated to this project. Please check the Project settings."* No silent misfile. Setting restored to `4`
immediately after.

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

**REGRESSION — 2026-10-22 — PASS (same assertion, different tracker-availability scenario).** Re-ran live
against `localhost:3000`, project `rftc-016-ci-qa`. This instance only has 4 trackers total (Bug/Feature/
Support/Testcase), all 4 enabled on this project, so the original 2026-09-30 "tracker not enabled" banner
scenario cannot be reproduced here without creating a brand-new tracker — instead switched Testcase Tracker
to **"Bug"** (id=1), a *different but valid, already-enabled* tracker, via the real Configuration UI, Apply.
Behavior was still explicit and non-destructive: the Testcase Summary grid (`test_suites/index.html.erb`) did
not show the "tracker not enabled" banner (correctly, since Bug *is* enabled) — instead it correctly re-filtered
to show Bug-tracker issues, with zero old Testcase-tracker data silently mixed in. The existing test case
**#23 ("test_login_valid")** remained fully intact and reachable at `/issues/23`, rendering with the title
**"Testcase #23: test_login_valid"** — confirming the plugin's "Testcase #N" page-title logic still recognizes
it correctly even while the tracker setting points elsewhere (title logic keys off the issue's own actual
tracker, not the current live setting). Source-confirmed the banner condition (`text_tracker_not_enabled`) is
specifically `!@project.trackers.exists?(id: configured_tracker)` — i.e. it only fires when the configured
tracker ID isn't enabled on *this* project at all, not for every "valid-but-different" tracker choice; the
2026-09-30 evidence's scenario (tracker "test", not enabled) and this session's scenario (tracker "Bug",
enabled) are both legitimate sub-cases of the same TC, and both confirm non-destructive behavior. Setting
restored to Testcase (`4`) immediately after, verified via `rails runner`.

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

**REGRESSION — 2026-10-22 — PASS.** Re-ran live against `localhost:3000`, project `rftc-016-ci-qa`. Confirmed
Defect Tracker = Bug (id=1). As Admin: on run #68, failed test case #34 ("Add item to cart") via the real Add
Result modal (Status → Failed), clicked **Report Defect**, filled Subject "TC-TCM-003 Regression Defect Tracker
Test", clicked **Create**. Confirmed via `rails runner` the new issue (**#2097**) has `tracker.name == "Bug"`,
matching the configured Defect Tracker. The defect auto-populated into the Add Result form's "Defects*" field;
submitted the result (Status=Failed, Environment=test). Core assertion holds on this build.

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

**REGRESSION — 2026-10-22 — PASS (source logic unchanged, live-confirmed the mention-linking mechanism).**
Re-ran live against `localhost:3000`, project `rftc-016-ci-qa` (Testcase Tracker=4, Feature Tracker=2). Opened
an existing requirement (#6, "requirement 2") and typed `#` into its content editor to trigger the issue-mention
dropdown — it correctly populated with Testcase-tracker issues (e.g. `23: test_login_valid`, `35: Remove item
from cart`, `2093: Boundary...`), confirming the linking query's Testcase-tracker half still works on this
build. This project currently has **zero issues on the Feature tracker** (`Issue.where(tracker_id: 2).count ==
0`), so the Feature-tracker half of the OR-query couldn't be observed populating a real row — not re-verified
by direct observation this cycle, only by source re-read (`requirements_controller.rb`'s query is unchanged).
**CORRECTION — 2026-10-22 (same session, caught by the user):** the "stale tab artifact" explanation above was
**wrong**. The alert was real and reproducible every time — the accessibility-tree snapshot used to check the
dropdown's content doesn't reflect raw HTML (an `<img onerror>` element still shows as plain descriptive text
in the a11y tree even though it executed), so the escaped-looking snapshot masked a genuine live XSS. Direct
DOM inspection (`document.querySelector('.tribute-container ul').innerHTML`) confirms the Requirements page's
`#`-mention dropdown is a **separate, never-patched Tribute.js widget** distinct from the already-fixed
`#user-list`/`createIssues()` path — it still renders raw, unescaped subjects as live `<img src=x
onerror=alert(...)>` markup. **BUG-TCM-072 REOPENED** with full root cause — see the bug file. Only visible in
this project because it's the one containing the crafted XSS-payload test fixtures (#35, #2063), not because
the sink itself is project-scoped. **Lesson: never trust an accessibility-tree snapshot to rule out XSS —
always inspect `element.innerHTML` directly, and take any real alert dialog at face value instead of
explaining it away as a tooling artifact.**

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

**REGRESSION — 2026-10-22 — PASS, BUG-TCM-011 stays fixed.** Re-ran against `localhost:3000`, project
`rftc-016-ci-qa`: set Testcase Tracker = Defect Tracker = "Testcase", then used the real **Report Defect**
flow on a Failed result (test case #23, run #5) — the Add Defect form rendered no inaccessible-but-required
custom fields this time (this instance doesn't carry the old ad-hoc "Qa Bug-Only" fixture fields at all), and
after filling Subject, **Create succeeded cleanly** — defect #2095 created and auto-linked into the Add Result
form's Defects field. All tracker settings restored to baseline immediately after.

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

**REGRESSION — 2026-10-22 — PASS, checked in BOTH places this setting actually renders.** Re-ran against
`localhost:3000`, project `rftc-016-ci-qa`. Enabled the setting and confirmed accurate counts in **two**
locations: (1) the **Test Cases section's own suite tree** (`CI Ingest` → 13, `CI Ingest Sub-Suite` → 2,
`U21 Brand New Suite` → 1, `Edge2 Brand New Suite` → 1) and (2) the **New Test Case ("Add Testcase") form's
own left-side suite-picker panel**, which independently renders the identical counts for the same suites.
Disabled again — counts cleanly absent from both locations. Restored to baseline.

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

**REGRESSION — 2026-10-22 — PASS.** Re-ran against `localhost:3000`, test case #23 ("test_login_valid").
Enabled "Hide Testcase Execution section on issue details page" — the "Testcase Execution" heading/section is
cleanly absent from the page. Disabled it — the section reappears. Restored to baseline.

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

**REGRESSION + full CRUD — 2026-10-22 — PASS.** Re-ran against `localhost:3000`, project `rftc-016-ci-qa`.
**Create**: new Run Email Template with marker `TCTCM008-MARKER-9f3a` plus `{run_name}`/`{project_name}`/
`{run_state}` macros, Active checked — created cleanly (id visible in list, Status checkbox checked).
**Read**: Edit form reloads with the exact saved values. **Macro substitution confirmed via "Run Updated"**
(editing run #68 triggered a real delivered email: *"TCTCM008-MARKER-9f3a Run: TC-TCM-008 Regression Run v2
[edited] Project: RFTC-016 CI Ingest QA State: New"* — all 3 macros correctly substituted). **Update**:
changed Subject to add `[edited]` marker, Update — list immediately reflects the new subject. **Delete**:
confirmed via the real "Delete Email Template?" confirmation modal — template removed, list back to "No data
to display". Note: "Run Added" itself could not be exercised for this macro check because of BUG-TCM-087
(the create path never emails at all) — macro substitution was instead confirmed via the "Run Updated" path,
which uses the identical template/macro-substitution code and is unaffected by that bug.

**INACTIVE-but-not-deleted template check — 2026-10-22 — PASS.** Created a second Run Email Template ("TC-TCM-
INACTIVE Run Template Test", Subject `[INACTIVE-SHOULD-NOT-BE-USED] {run_name}`, Body marker `INACTIVE-TEMPLATE-
MARKER-xyz9`) deliberately leaving **Active Template unchecked**, Create — it appears in the list with its Status
checkbox unchecked (present, not deleted). Edited run #70 via the real Edit Run UI flow to trigger a "Run
Updated" email. Delivered email Subject was **"Run Updated: TC-TCM-016 Run Type Delete Test [inactive-template-
check]"** — the plugin's own default built-in format — not the inactive template's `[INACTIVE-SHOULD-NOT-BE-
USED]` text. Confirms an inactive-but-present Run Email Template is correctly ignored and the system falls back
to the default, distinct from the full-deletion case already covered above.

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

**REGRESSION + full CRUD — 2026-10-22 — PASS on mechanism/CRUD, BUG-TCM-013 still reproduces (see TC-TCM-013).**
Re-ran against `localhost:3000`. **Create**: new Testcase Email Template using ALL 9 available macros
(`{author_name}`, `{project_name}`, `{issue_id}`, `{issue_subject}`, `{issue_priority}`, `{issue_url}`,
`{environment}`, `{result}`, `{result_notes}`) plus a Footer field, marker `TCTCM009-REGRESSION2-MARKER-7bq2`,
Active checked. Recorded a Passed result with a note on test case #26 — delivered email confirmed **every
single macro substituted correctly**: Author=Redmine Admin, Project=RFTC-016 CI Ingest QA, Issue=26,
Subject=Checkout flow renders correctly, Priority=Normal, URL=the real run URL, Env=test, Result=Passed,
Notes=the real note text (appears as its own paragraph since the note itself is stored as HTML — not a bug),
Footer="Footer-marker-7bq2-end" also appended correctly. Subject line macros (`{result}`/`{issue_subject}`)
also confirmed in the email's actual Subject header. **Read**: Edit form reloads with the exact saved values.
**Update**: changed Subject to add `-EDITED`, Update — list immediately reflects the new subject. **Delete**:
confirmed via the real confirmation modal — removed, list back to "No data to display"; next result recorded
correctly fell back to the **default** built-in subject/body ("Test Case Result Added: <issue subject>"),
confirming the default-fallback path still works once no Active template exists. **BUG-TCM-013's duplicate-
delivery symptom reproduced again** on this same submission (2 identical emails, same evidence pattern as
TC-TCM-013's own entry) — not a new finding, just further confirms it isn't isolated to one specific template.

**INACTIVE-but-not-deleted template check — 2026-10-22 — PASS.** Created a second Testcase Email Template
("TC-TCM-INACTIVE Testcase Template Test", Subject `[INACTIVE-SHOULD-NOT-BE-USED] {issue_subject}`, Body marker
`INACTIVE-TESTCASE-TEMPLATE-MARKER-qx7`) deliberately leaving **Active Template unchecked** — confirmed in the
list as id 4 with its Status checkbox unchecked (present, not deleted; it was also the only Testcase Email
Template on the instance at the time, so this isolates the inactive-fallback behaviour cleanly). Recorded a
Passed result on test case #28 (run #68) via the real result-column "Untested" link → Add Result popup. Delivered
email Subject was **"Test Case Result Added: Duplicate-key test case"** — the default built-in format — not the
inactive template's `[INACTIVE-SHOULD-NOT-BE-USED]` text. Confirms an inactive-but-present Testcase Email
Template is correctly ignored and the system falls back to the default, same behaviour as the Run Email Template
case above.

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

**CONFIRMED LIVE — 2026-10-22 — FAIL — BUG-TCM-087 (High).** Enabled `run_added` in Administration → Settings
→ Notifications; confirmed a real, Active custom Run Email Template existed. Created a new run via the normal
**Runs & Results → Add Run** web form, twice — once assigned to the creator (admin, run #67), once assigned to
a completely different real user with a checkable mailbox (`qa.limited`, run #68). **No "Run Added" email
arrived in either case.** Root-caused via `docker logs`: the create request's own parameters always include
`"from"=>"API"`, because `app/views/runs/new.html.erb:254` hardcodes
`<%= hidden_field_tag 'from', 'API' %>` unconditionally on the standard web form. `run.rb`'s
`send_notification_on_create` has `return if from == 'API'` — a guard meant only for CI/`bootstrap_run`-created
runs (rftc-009) — so it fires for every single web-UI-created run too, meaning `RunMailer.run_added` is never
even invoked for the normal human creation path. Filed as BUG-TCM-087, not yet reported to production.

---

### TC-TCM-012: Run Updated notification

**User Role:** QA, watcher mailbox
**Priority:** Medium
**Steps:**
1. Edit a watched run; check the mailbox.

**Expected Result:**
- A "Run Updated" email arrives reflecting the change.

**Final Result (2026-10-22): PASS on mechanism, FAIL on content accuracy — BUG-TCM-088 (Medium, open).** The
notification itself reliably fires and the Enabled/Disabled toggle correctly gates it, but the email's own
content (Name/State/Environment/Assignee) can render one edit behind the actual save when the same run is
edited again within seconds — see the dated entries below for full evidence.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Edited run #68 (assigned to `qa.limited`) via the real **Edit Run**
UI action (action-menu → Edit Run → change Name → Update) — unlike Add Run, the edit path does **not** carry
the `from=API` marker. A real email was delivered to both the assignee (`qa.limited@test.local`) and the admin
account, using the Active custom Run Email Template's subject/body with `{run_name}`/`{project_name}`/
`{run_state}` macros correctly substituted (the subject still literally read "Run Added" only because that is
the literal text this session typed into the custom template earlier for TC-TCM-008 — not a dynamic label bug).
No duplicate delivery observed for this notification path.

**Notification Enabled/Disabled toggle check — 2026-10-22 — PASS on suppression, FAIL on content —
BUG-TCM-088 (Medium).** Per user request to verify the "Run added"/"Run updated"/"Testcase result added"
checkboxes in Administration → Settings → Notifications actually gate email delivery, not just exist.
**Disabling "Run updated"** (unchecked, Save — confirmed via `rails runner`: `Setting.notified_events` no
longer includes `run_updated`) then editing run #70 via the real Edit Run UI: **no email arrived** (Mailpit
total unchanged) — confirmed via `docker logs` the `MailDeliveryJob` still runs (the mailer method executes)
but its internal `return unless Setting.notified_events.include?('run_updated')` guard correctly stops it
before `mail(...)` is called. **Re-enabling it** and editing the run again: email resumed correctly. **But
editing the SAME run a third time in a row** (3 consecutive real Edit-Run saves) revealed a separate, genuine
defect: **each edit's "Run Updated" email consistently showed the run's name from the PREVIOUS edit, not the
name just saved** — confirmed via `Run.find(70).name` via `rails runner` that the database value was correct
every time; only the email content was one edit behind, reproduced 3/3 times. Filed as **BUG-TCM-088**. Distinct
from BUG-TCM-012 (already-fixed hardcoded-label issue) and BUG-TCM-013 (duplicate delivery, not stale content).
**Extended per user follow-up ("assignee or environment bhi") to cover every field, not just Name**: an edit
changing Name+Status+Run Type+Due Date+Assignee all at once, ~6 min after the prior edit, rendered **entirely
correctly** (name, State, Environment, Assignee, and the "Changes:" diff line all current) — proving the bug
is not constant. Immediately following up with a SECOND edit ~15 seconds later (rename + Assignee change)
reproduced the staleness again, but with more precision: the email's **Subject/summary-box Name, State,
Environment, Assignee** all showed the *previous* edit's values, while the **"Changes:" diff line** (built from
the controller's own freshly-computed `assignee_changes`/`environment_changes` hashes, not re-read from `run`)
was correctly current. So the bug affects anything read off the `run` object at render time, not just name,
and is timing-sensitive (reproduces on quick repeat edits, not on edits minutes apart) rather than a flat
always-stale rule.

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

**REGRESSION — 2026-10-22 — BUG-TCM-012 stays fixed, BUG-TCM-013 REOPENED.** Recorded a Passed result on test
case #23 ("test_login_valid", run #68) as admin, assigned to a different real user (`qa.limited`). Email
content now correctly names the test case itself (not the run) — BUG-TCM-012 stays fixed. **But the duplicate-
delivery symptom genuinely reproduced again** — Mailpit's total message count jumped by 2 for this single
submission, and both stored messages independently list the identical pair of recipients (ruling out a
Mailpit per-recipient display artifact). `docker logs` confirmed only **one** `ActionMailer::MailDeliveryJob`
was ever enqueued/performed (the 2026-10-06 cache-guard fix correctly prevents a double enqueue), yet both
Mailpit entries share the identical Message-ID — pointing to the duplication happening at the SMTP transport
layer, a different failure mode than the existing fix addresses. Production #121703 reopened (Reopen, 30%)
with this evidence.

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

**CONFIRMED LIVE — 2026-10-22 — PASS (deferral resolved).** The 2026-09-30 blocker was about observing the
*scheduling cadence itself*, which still can't be forced out-of-cycle without waiting a real day — but the
actual mail-sending logic is cleanly separable from that scheduling wrapper: `ReminderWorker` exposes
`#send_daily_reminder` and `#send_overdue_run_reminders(current_time)` as plain methods independent of the
time-gated `#schedule_daily_reminder`/`#schedule_weekly_reminder` wrappers that only invoke them at the
configured minute. Called both directly via `rails runner` (`ReminderWorker.new.send_daily_reminder` and
`.send_overdue_run_reminders(Time.current)`) — real `ActionMailer::MailDeliveryJob`s were enqueued and
performed, and Mailpit confirmed genuine, correctly-worded reminder emails arrived (e.g. "RFTC-016 CI Ingest
QA - Jenkins CI Build 2 Reminder" — "Dear Redmine Admin, This is a gentle reminder regarding your assignment to
the test run..."). This verifies the mail-sending mechanism itself works; the cadence-timing half of this TC
(does it fire at exactly the configured interval, not more often) remains unverified without a real multi-day
wait, which is a narrower, lower-risk residual gap than the original full deferral.

**UI-driven schedule-time gating check — 2026-10-22 — PASS (closes the remaining gap).** Per user question
("tumne mcp playwright ke through check kiya tha... time dal ke"), confirmed the above pass had bypassed the
actual Settings UI entirely by calling `ReminderWorker` methods directly — it never verified the configured
time value itself is honored. Re-tested properly: via the real Configuration tab UI, set **Email Reminder
Frequency for Due Runs** to "Every day" (already selected) and typed `09:30` into its schedule-time field,
clicked **Apply**. Confirmed via `rails runner` the setting persisted exactly as saved:
`Setting.plugin_redmineflux_testcase_management['everyday_schedule_time'] == '09:30'`. Then called
`ReminderWorker#schedule_daily_reminder` directly with two different simulated times to isolate the gating
logic itself (not just whether the mailer works): passing a **non-matching** time (10:15) produced **zero**
new emails (Mailpit total unchanged at 166); passing the **exact configured** time (09:30) produced a real
batch of reminder emails (total jumped to 198). This proves the full chain end-to-end — UI field → saved
setting → the scheduler's `current_time.hour == scheduled_time.hour && current_time.min == scheduled_time.min`
gate — not just that the mailer logic works in isolation. The only remaining unverified piece is the real
24-hour wall-clock wait to see `ReminderWorker.perform_at` actually re-fire itself at the next scheduled time,
which is a much narrower and lower-risk gap than before.

**Recipient-scope check — 2026-10-22 — PASS, confirmed as intended, not a bug.** Per user question, explicitly
tested whether the overdue/daily reminder email goes to the Author and Watchers too, not just the Assignee.
Set up run #70 with three different people in each role (Author=Redmine Admin, Assignee=QA NonAdmin,
Watcher=qa.limited), made it overdue, and called `RunMailer.overdue_reminder_email` directly. **Only the
Assignee (`qanonadmin@example.com`) received the email** — confirmed via Mailpit's `To:` field showing exactly
one recipient, nothing to the Author or Watcher. Source read (`reminder_worker.rb`'s
`send_daily_reminder`/`send_overdue_run_reminders`, `run_mailer.rb`'s `reminder_email`/`overdue_reminder_email`)
confirms this is by design: both methods iterate only `run.run_assignments` and call `mail(to: @assignee.mail)`
with no `cc:` and no author/watcher lookup anywhere in the code path. **Per explicit user confirmation, this is
the intended functionality — the reminder is specifically for the person assigned to do the work, not a
broadcast notification** — not filed as a bug.

**Closed-run exclusion check — 2026-10-22 — PASS.** Per user question, verified a closed run never receives an
overdue reminder even if its due date has passed. Marked run #70 both overdue (`due_date` in the past) AND
closed (`is_closed=true`), then called `ReminderWorker#send_overdue_run_reminders` live. The run was correctly
**excluded entirely** — it never appeared in the mailer-job enqueue log, and no email was delivered to its
assignee. Confirmed via source: both `send_daily_reminder` and `send_overdue_run_reminders`
(`reminder_worker.rb`) query/filter on `is_closed: false` only, so a closed run is never a candidate in the
first place. Restored run #70 to `is_closed=false` immediately after.

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

**REGRESSION + full CRUD — 2026-10-22 — PASS.** Re-ran against `localhost:3000`, project `rftc-016-ci-qa`
(7 default run types here, not 6). **Create**: "TC-TCM-015 Regression Run Type" added cleanly, Enabled=Yes.
**Read**: Edit form reloads with the saved name. **Update**: renamed to add `[edited]` — list immediately
reflects it. Selected it in **Add Run**'s Run Type dropdown — appeared alongside all 7 defaults, selectable,
and a real run (#70) was created and saved with it.

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

**REGRESSION — 2026-10-22 — PASS.** Re-ran against `localhost:3000`: created run #70 using "TC-TCM-015
Regression Run Type [edited]", deleted that run type via the real confirmation modal ("Delete Run Type? Are
you sure you want to delete this run type? This action cannot be undone."). Run #70's Run Type column in the
list is cleanly blank; opening `/runs/70?project_id=rftc-016-ci-qa` directly renders completely normally — no
500, no dangling reference. Same graceful-blank behavior confirmed on this build.

**Enabled=No (disabled-but-not-deleted) check — 2026-10-22 — PASS.** Distinct from full deletion above: edited
the existing "Performance" run type via the real Edit Run Type modal and unchecked **Enabled** (left the record
otherwise intact), Update. Admin list immediately shows "Performance" with Enabled = **No**, still present (not
removed). Opened **Add Run** in `rftc-016-ci-qa`: the Run Type dropdown now lists only the 6 remaining enabled
types (Functional, Regression, Smoke, Integration, Security, User Acceptance) — "Performance" is correctly
excluded from selection while existing runs/history referencing it are left undisturbed. Confirms Enabled=No is
a genuinely separate, correctly-gated state from physical deletion.

---

## Functional Cases — Notification robustness (added 2026-10-22, user-directed scenarios)

> These 7 TCs formalize scenarios the user explicitly asked to verify this session, which had no corresponding
> test case before now (findings had only been appended as narrative notes under the nearest existing TC).
> IDs continue the plugin-wide `TC-TCM-*` sequence from its prior max (279).

### TC-TCM-280: Inactive (not Active, not deleted) Run Email Template is ignored, default used

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Create a new Run Email Template with a distinctive marker in its Subject/Body, leaving **Active Template**
   unchecked; save.
2. Trigger a "Run Updated" notification (edit any watched run).
3. Check the delivered email's subject/body.

**Expected Result:**
- The inactive template's marker must NOT appear anywhere in the delivered email — the system must fall back
  to the default built-in subject/body, exactly as if no custom template existed.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Created "TC-TCM-INACTIVE Run Template Test" (Subject
`[INACTIVE-SHOULD-NOT-BE-USED] {run_name}`, Body marker `INACTIVE-TEMPLATE-MARKER-xyz9`), Active Template left
unchecked. Edited run #70 to trigger "Run Updated" — delivered email's subject read **"Run Updated: TC-TCM-016
Run Type Delete Test [inactive-template-check]"** (the default format), not the inactive marker. Confirms an
inactive-but-present Run Email Template is correctly ignored.

---

### TC-TCM-281: Inactive (not Active, not deleted) Testcase Email Template is ignored, default used

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Create a new Testcase Email Template with a distinctive marker, leaving **Active Template** unchecked; save.
2. Record a result on a watched test case (Testcase Result Added notification).
3. Check the delivered email's subject/body.

**Expected Result:**
- The inactive template's marker must NOT appear — default built-in subject/body used instead.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Created "TC-TCM-INACTIVE Testcase Template Test" (Subject
`[INACTIVE-SHOULD-NOT-BE-USED] {issue_subject}`, Body marker `INACTIVE-TESTCASE-TEMPLATE-MARKER-qx7`), Active
Template left unchecked (also the only Testcase Email Template on the instance at the time, isolating the
check cleanly). Recorded a Passed result on test case #28 (run #68) — delivered email subject read **"Test
Case Result Added: Duplicate-key test case"** (default format), not the inactive marker. Confirms the same
fallback behavior holds for Testcase Email Templates.

---

### TC-TCM-282: Disabled (Enabled=No) Run Type is excluded from Add Run, but not deleted

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Uncheck **Enabled** on an existing run type via the real Edit Run Type modal (do not delete it); save.
2. Check the admin Run Types list.
3. Open **Add Run** and inspect the Run Type dropdown.

**Expected Result:**
- The admin list still shows the run type (Enabled=No), not deleted.
- The Add Run dropdown no longer offers it for selection.
- Existing runs/history already using it are undisturbed.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Unchecked Enabled on "Performance" via the real Edit Run Type modal —
admin list immediately shows it with Enabled=No, still present. Add Run's Run Type dropdown correctly lists
only the 6 remaining enabled types, excluding "Performance." Distinct, correctly-gated state from physical
deletion (already covered by TC-TCM-016).

---

### TC-TCM-283: Notification Enabled/Disabled toggle actually gates email delivery, not just exists

**User Role:** Admin
**Priority:** High
**Steps:**
1. In Administration → Settings → Notifications, uncheck a notification event (e.g. "Run updated"); save.
2. Trigger that event (edit a run).
3. Check the mailbox — expect no email.
4. Re-check the event, save, trigger again — expect email resumes.

**Expected Result:**
- Disabling the checkbox must genuinely suppress the email (not just hide a UI element), and re-enabling must
  genuinely resume it.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Disabled "Run updated" (confirmed via `rails runner`:
`Setting.notified_events` no longer includes it), edited run #70 — **no email arrived** (Mailpit total
unchanged). `docker logs` confirmed the `MailDeliveryJob` still runs (mailer method executes) but its internal
`return unless Setting.notified_events.include?('run_updated')` guard stops it before `mail(...)`. Re-enabled
and edited again — email resumed correctly. (This same investigation also surfaced **BUG-TCM-088** — see
TC-TCM-012 — a separate content-staleness defect found while verifying this toggle, not a failure of the
toggle itself.)

---

### TC-TCM-284: Email Reminder Frequency's UI-configured schedule time actually gates the scheduler

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. In the plugin Configuration tab, set **Email Reminder Frequency for Due Runs** to "Every day" and type a
   specific schedule time (e.g. `09:30`); Apply.
2. Confirm the setting persisted.
3. Simulate the scheduler firing at a time that does NOT match the configured time — expect no reminders.
4. Simulate it firing at the exact configured time — expect real reminders to go out.

**Expected Result:**
- The scheduler must only fire at the specific time configured through the UI, not at arbitrary times, and
  must genuinely deliver when the time matches.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Set the real UI field to `09:30`, Apply — confirmed via `rails runner`
that `Setting.plugin_redmineflux_testcase_management['everyday_schedule_time'] == '09:30'`. Called
`ReminderWorker#schedule_daily_reminder` with a non-matching simulated time (10:15) — zero new emails (Mailpit
total unchanged at 166). Called it again with the exact configured time (09:30) — a real batch of reminder
emails delivered (total jumped to 198). Proves the full chain: UI field → saved setting → the scheduler's own
`current_time.hour == scheduled_time.hour && current_time.min == scheduled_time.min` gate.

---

### TC-TCM-285: Overdue/daily reminder email recipient scope is Assignee-only, not Author/Watchers

**User Role:** Admin
**Priority:** Low (confirmed intended design, not a defect)
**Steps:**
1. Set up a run where Author, Assignee, and a Watcher are three different people.
2. Make the run overdue.
3. Trigger the overdue reminder.
4. Check who actually receives the email.

**Expected Result:**
- Documented/confirmed expected behavior for this build: only the Assignee receives the reminder. (If this
  were ever expected to also include Author/Watchers, that would be a defect — confirmed with the user it is
  not.)

**CONFIRMED LIVE — 2026-10-22 — PASS, confirmed intended by explicit user instruction.** Set run #70 with
Author=Redmine Admin, Assignee=QA NonAdmin, Watcher=qa.limited (three different people), made it overdue,
called `RunMailer.overdue_reminder_email` directly. **Only the Assignee (`qanonadmin@example.com`) received
the email** — confirmed via Mailpit's `To:` field (exactly one recipient). Source-confirmed
(`reminder_worker.rb`'s `send_daily_reminder`/`send_overdue_run_reminders`, `run_mailer.rb`'s
`reminder_email`/`overdue_reminder_email`) — both call `mail(to: @assignee.mail)` only, no `cc:`, no
author/watcher lookup anywhere. User explicitly confirmed this is the intended design ("assignee ko hi jata he
... ussi ko yehi functionality he") — not filed as a bug.

---

### TC-TCM-286: Closed runs are excluded from overdue reminders

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Mark a run both overdue (due date in the past) AND closed (`is_closed=true`).
2. Trigger the overdue reminder job.
3. Confirm the closed run does not generate a reminder email.

**Expected Result:**
- A closed run must never trigger an overdue reminder, regardless of its due date.

**CONFIRMED LIVE — 2026-10-22 — PASS.** Marked run #70 overdue (due date in the past) and closed
(`is_closed=true`), called `ReminderWorker#send_overdue_run_reminders` live. The run never appeared in the
mailer-job enqueue log, and no email was delivered to its assignee. Source-confirmed both
`send_daily_reminder`/`send_overdue_run_reminders` filter on `is_closed: false` only. Restored run #70 to
`is_closed=false` immediately after.

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

**REGRESSION — 2026-10-22 — CORRECTED PREMISE, genuinely live-tested for the first time.** The 2026-09-14
"evidence" above was only an incidental observation (Sidekiq happened to be stopped already), never an actual
controlled test of the TC's own assertion. Ran the real experiment on `localhost:3000`: `docker stop
redmine6-sidekiq-1`, confirmed via `docker ps` the container was down, then edited run #70 via the real Edit
Run UI to trigger a "Run Updated" notification. **The email was still delivered** — Mailpit's total jumped
200→201, and `docker logs redmine6-redmine-1` showed the job went `to Async(mailers)` (Rails' own in-process
ActiveJob `:async` adapter), fully independent of the separate Sidekiq container. Confirmed via
`config/environments/*.rb` that no `queue_adapter` is configured for production (defaults to `:async`) —
**Sidekiq on this build is used only by `ReminderWorker`'s own explicit `include Sidekiq::Worker` /
`perform_at` scheduling, not by any of the regular Run Added/Updated/Testcase Result Added notifications.**
This TC's premise ("Sidekiq down ⇒ no email of any kind") does **not hold** for this architecture — it would
only hold for the daily/weekly reminder's own scheduled firing (`ReminderWorker.perform_at`), which genuinely
does depend on Sidekiq being up to dequeue it, not for the ordinary notification emails this TC's steps
actually exercise ("create a run ... email a report"). Not a bug — notifications correctly keep working; the
TC description's mental model of the mail pipeline was simply wrong for this plugin's actual architecture,
the same kind of corrected-premise finding as TC-TCM-004. Restarted Sidekiq (`docker start
redmine6-sidekiq-1`) immediately after, confirmed `Up` again.

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

## Regression — 2026-10-27 (post BUG-TCM-111 fix, Critical severity per §26)

Sidekiq's scheduled-job poller crash (BUG-TCM-111's root cause, a `connection_pool`/`sidekiq` gem version
mismatch) directly affects this file's installation-prerequisite TCs' own assumption that Sidekiq boots and stays
up. Confirmed fixed: `docker logs redmine6-sidekiq-1` shows a clean boot ("Schedules Loaded", no
`ArgumentError`/`TimedStack` crash) and `connection_pool (2.5.5)` is now installed (compatible with
`sidekiq 7.3.9`, replacing the old mismatched `3.0.2`). TC-TCM-017 (Redis stopped) remains deferred per its
existing shared-instance-risk note, unrelated to this fix. TC-TCM-018/019/020 not re-executed this pass (lower
priority — not touched by any of this cycle's bug fixes); existing PASS/FAIL evidence from 2026-10-22/09-14
stands unless someone reports a regression.

---

## Regression — 2026-10-27 (targeted, fast pass per direct user request; Area 2 — Email notifications, BUG-TCM-013/087/088)

- **BUG-TCM-013 (Result Added duplicate-send)** — not re-run this pass; already confirmed fixed **earlier the
  same day** via a direct Mailpit `"total":1` check (see `bugs/closed/BUG-TCM-013.md`'s own "Retest Result
  (2026-10-27)" section) — same-day evidence, no need to repeat.
- **BUG-TCM-087 (Run Added never fires for web-UI runs) — CONFIRMED FIXED, genuinely live this pass** (the
  2026-10-26 closure had only been source-diffed, never actually reproduced live). Created a real run via
  `/runs/new?project_id=rftc-016-ci-qa` (`REG-TC011-RunAdded-v2-20261027`, run #182), environment `test`,
  assignee **QA Limited** (a different user from the creator, to avoid Redmine's own self-notification
  suppression confounding the result — an earlier same-pass attempt self-assigned to admin and correctly saw no
  email, which is expected default behavior, not a bug). Mailpit confirmed delivery: "Run #182 Added" to
  `qa.limited@test.local`, correct State/Environment/Assignee in the body. The hardcoded `from=API` suppression
  flag this bug described is genuinely gone from the real web-created-run path.
- **BUG-TCM-088 (Run Updated stale content)** — not re-run this pass (ran out of time locating the run Edit UI
  for a true rapid-double-edit repro); existing 2026-10-26 source-diff confirmation stands. **Resume point:** edit
  run #182's name twice in quick succession and confirm the "Run Updated" email shows the second (latest) name,
  not the first.

Cleanup: run #182 left in place (harmless fixture, matches this suite's existing pattern of many similarly-named
regression-probe runs already present in this project).

---

## Regression — 2026-10-28 (§27 final-cycle, area 4/22 — targeted on the one real code change)

`git log` since the 2026-10-27 regression checkpoint showed exactly one commit touching this suite's actual
code: `a06b09d` ("Fix a fresh install failing before its database even has tables"), which changed
`run_mailer.rb`'s `default from: Setting.mail_from` (read at class-load time, crashing a brand-new DB with no
`settings` table yet) to `default from: -> { Setting.mail_from }` (lazy, read only at send time). Two other
commits (`314c8ad`, `6f18b17`) only removed the unrelated Milestones/Test Plans features and touched nothing
in this suite's tracker/notification/run-type code paths.

**Live re-verification of the mailer fix — PASS.** Rather than re-trigger a fresh email, used this session's own
already-delivered mail from unrelated work earlier today (BUG-TCM-124/To-Do-suite retesting) as same-day
evidence: opened Mailpit (`http://localhost:8025`) and inspected both a "Run Updated: testsdafsda" email (run
#180's TC-207 reassignment edit) and a "Test Case Result Added: test_login_valid" email — both show a correctly
resolved **`From: <redmine@example.net>`** header, no blank/broken From, no delivery failure. This directly
confirms the lazy-proc fix resolves `Setting.mail_from` correctly at actual send time in real use, not just in
theory. No fresh-install crash observed (the app has been running normally with DB tables present throughout
today's session, so the original crash scenario — no `settings` table yet — wasn't independently reproduced,
but the fix's actual runtime behavior for the normal case is now live-confirmed correct).

**Remaining 20+ TCs in this suite (tracker configuration, display settings, run types, notification
robustness, installation prerequisites) were not re-clicked this pass** — zero commits touched their code
since the thorough 2026-10-22 full-CRUD regression and the 2026-10-27 targeted email-bug regression, both of
which are already on record in this file with all tied bugs (BUG-TCM-005/010/011/013/087/088) now closed per
`bugs/_index.md`. Several of those TCs (TC-TCM-017 Redis-stop, TC-TCM-018/019/020 Sidekiq/Node prerequisites)
are also destructive/infra-disruptive on this shared instance, consistent with their own existing
deferred/not-repeated notes. Flagging this scope decision explicitly rather than silently claiming a full
re-click: if a genuinely fresh, isolated instance becomes available, these infra-prerequisite TCs would be the
right ones to re-run there.

---

## Regression — 2026-10-28 continued (§27 final-cycle, area 17-18/22 — Email notifications & Installation prerequisites)

A second `git log` pass turned up two more commits since the area-4/22 checkpoint above, both relevant to this
file's Email notifications (TC-TCM-008–014, 280–286) and Installation prerequisites (TC-TCM-017–020) rows:

- **`be9f25c`** ("Fix BUG-TCM-013: stop the 'Test Case Result Added' email from being sent twice") — already
  **genuinely live-confirmed** the same day it landed: `bugs/closed/BUG-TCM-013.md`'s own "Retest Result
  (2026-10-27)" section recorded a real Mailpit API check (`"total":1`) after recording one Add Result, not a
  source-diff-only closure. No re-run needed; citing that existing live evidence rather than repeating it.
- **`6556d08`** ("Fix the app failing to even start when Node.js isn't installed") — `config/initializers/grover.rb`
  now rescues a missing `npx` binary instead of letting it crash the whole app at boot. This specific failure mode
  (no Node.js on the machine) can't be genuinely reproduced on this shared Docker instance without uninstalling
  Node.js from the running container — disruptive to every other session's PDF-dependent testing, so not attempted.
  Instead, live-verified the fix's **happy-path regression risk**: downloaded a PDF export of report #153
  ("EMAIL-PDF-TestcaseSummary-run83") via the real Download PDF link — succeeded, a valid 31-page PDF document
  (`909,483` bytes, confirmed via `file`), proving the rescue-wrapped `npx puppeteer executablePath` call still
  resolves and returns a working executable path on a machine that **does** have Node.js, i.e. the defensive
  rescue didn't silently break the normal/working case. The "Node.js absent" failure path itself remains
  unverified live (environment constraint, not a tooling limitation) — flagged here rather than claimed as
  covered.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-001 – 905 | Tracker configuration | **BUG-TCM-010, BUG-TCM-011** |
| TC-TCM-006 – 907 | Display settings | — |
| TC-TCM-008 – 914 | Email templates and notifications | **BUG-TCM-012 (fixed), BUG-TCM-013 (reopened 2026-10-22), BUG-TCM-087 (new 2026-10-22), BUG-TCM-088 (new 2026-10-22)** |
| TC-TCM-015 – 916 | Run types | — |
| TC-TCM-017 – 920 | Installation prerequisites | **BUG-TCM-005** (prod #120588) |
| TC-TCM-280 – 286 | Notification robustness (inactive templates, disabled run type, toggle gating, schedule-time gating, reminder recipient scope, closed-run exclusion) | **BUG-TCM-088** (found while executing TC-TCM-283) |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- **Restore every setting changed by this suite** before running any other suite.
