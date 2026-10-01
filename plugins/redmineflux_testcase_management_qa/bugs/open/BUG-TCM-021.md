# BUG-TCM-021

- Bug ID: BUG-TCM-021
- Production Redmine Issue ID: #121842
- Title: Any re-render of the New Test Case form (a Category change, or simply a failed validation submit) silently destroys already-entered Steps and removes the Steps/Requirements sections entirely
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

On the **New Test Case** form, the Steps/Expected-Results and Requirements section is fragile against **any**
server round-trip that re-renders the form. Two independent triggers reproduce the same symptom:

1. **Category change**: selecting any value in the **Category** dropdown fires an AJAX refresh (standard Redmine
   behavior for category-driven default-assignee lookup). On this plugin's Testcase form, that refresh **removes
   the Steps/Requirements markup entirely** from the page — the "New Step" button, every already-added
   Step/Expected Result row, and the Requirements multi-select all disappear. This is permanent for the rest of
   that form instance; selecting a different Category afterward does not restore it.
2. **Any failed-validation submit**: simply clicking **Create** and having the server reject the submission for
   *any* reason (most commonly the already-known BUG-TCM-011 Bug-only-custom-field validation, which fires on
   essentially every Testcase submission) causes the **re-rendered form to come back with the Steps/Requirements
   section already gone, and the step data itself not round-tripped** — the server error explicitly lists
   **"Steps and expected result cannot be blank,"** proving the step content was dropped server-side during the
   failed-request round-trip, not merely hidden client-side.

The practical impact is severe: because BUG-TCM-011 means a Testcase submission with any custom-field
combination routinely fails validation on the **first** attempt, a tester who fills in Steps before clicking
Create will very often find those steps silently gone on the very next (corrective) attempt — through no action
of their own beyond submitting the form once.

## Steps to reproduce

**Trigger 1 (Category):**
1. **New Test Case**. Enter a Subject, click **New Step**, enter real Step/Expected Result text.
2. Select any value in the **Category** dropdown.
3. Observe the Steps section and the Requirements field — both gone.

**Trigger 2 (failed validation, no Category involved at all):**
1. **New Test Case**. Enter a Subject, click **New Step**, enter real Step/Expected Result text.
2. Click **Create** without touching Category (the submission will fail on other required custom fields per
   BUG-TCM-011).
3. On the re-rendered form, the error list includes **"Steps and expected result cannot be blank"** and the Steps
   section (plus Requirements) is gone — not merely empty, structurally absent.

## Expected result

- Per `TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 1 (Create a Test Case), the Steps and Requirements UI — and
  any content already entered into it — should survive both a Category change and a failed-validation
  resubmission, exactly like Subject does.

## Actual result

- **Trigger 1 (Category):** immediately after selecting a Category, live DOM checks show
  `document.body.innerText` no longer contains "New Step" or "Requirement" anywhere, and the step input that held
  `"Step before category change"` is gone (`input[name="issue[steps_and_results][][step]"]` count drops to 0).
  Reproduced twice independently; a different Category value afterward does not restore it.
- **Trigger 2 (failed validation):** submitted a fresh form with a real step and no Category touched at all.
  The response's own error list says **"Steps and expected result cannot be blank"** — the step was not
  preserved through the failed round-trip — and the re-rendered form has 0 step inputs and no "New Step" text,
  confirming the section itself, not just its values, is gone.
- Isolated Priority-only changes as **not** triggering this (section stays intact) — the common factor across
  both real triggers is a server round-trip that re-renders the form, not a Category-specific code path per se.

## Root cause (inferred, no source access this session)

The Steps/Requirements section appears to be rendered only as part of the **initial** GET response for `New Test
Case`, and is not included in whatever partial/template the controller re-renders after an AJAX field-dependency
refresh (Category) or a failed `create` validation re-render. Both code paths re-render the form from a context
that omits this plugin-specific section entirely, rather than preserving/reconstructing it with submitted values.

## Suggested fix

Ensure the Steps/Requirements section is included — with already-submitted values repopulated — in every form
re-render path: the Category-change AJAX partial, and the failed-validation re-render after `create`. At minimum,
the failed-validation path should never silently drop step content the user already typed, given how often
BUG-TCM-011 alone causes a first-attempt failure on this exact form.

## Evidence

### Screenshot

![New Test Case form after selecting a Category — the Steps section and Requirements field are completely gone from the page](../../screenshots/BUG-TCM-021/steps-and-requirements-vanish-after-category-select.png)

### Console / log

```
Fresh form load: bodyText.includes('New Step') === true, bodyText.includes('Requirement') === true
After #issue_priority_id change to "High": both still true (Priority is NOT the trigger)
After #issue_category_id change to "f dsfsdaf": both become false

Trigger 1 data-loss reproduction:
1. Added a step: input[name="issue[steps_and_results][][step]"] value = "Step before category change"
2. Changed Category to "f dsfsdaf"
3. input[name="issue[steps_and_results][][step]"] count === 0  (the step input itself is gone, not just empty)
4. bodyText.includes('New Step') === false, bodyText.includes('Requirement') === false
5. Selecting a second, different Category value afterward: still false — not recoverable without a full reload.

Trigger 2 (failed validation, Category never touched):
1. Fresh form, added subject + a real step ("Isolated step check" / "Isolated expected check").
2. Clicked Create (no Category set) — server rejected on other required custom fields (BUG-TCM-011).
3. Error list returned: "Qa required text field cannot be blank / Qa second required field cannot be blank /
   Qa bug-only tracker field cannot be blank / Qa required readonly field cannot be blank /
   Steps and expected result cannot be blank"
4. Re-rendered form: input[name="issue[steps_and_results][][step]"] count === 0, no "New Step" text anywhere.
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_CASES.md`:
- TC-TCM-128 (Create a test case with all fields and one step) — **FAIL**, this is the blocking defect. The TC's
  own literal step order (Category in step 2, Steps/Requirement in steps 3–4) hits Trigger 1 directly; even a
  corrected field order still hits Trigger 2 on the near-guaranteed first-attempt validation failure from
  BUG-TCM-011.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers Category's AJAX side-effects on the
  Steps/Requirements UI. Distinct from BUG-TCM-011 (Bug-only custom field validation asymmetry — a different
  mechanism and different symptom entirely).

## Production report

Reported to production `ztflux` as **#121842** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: High (priority_id 3); Defect custom
fields: Type=Functional, Severity=High-severity, Priority=High.
