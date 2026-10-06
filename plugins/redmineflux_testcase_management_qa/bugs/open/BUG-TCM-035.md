# BUG-TCM-035

- Bug ID: BUG-TCM-035
- Production Redmine Issue ID: #122077
- Title: Test Environment "Select Components" picker is hardcoded to 3 generic placeholder values (Hardware/Software/Configuration) with no way to enter real component values, even though the model fully supports arbitrary free text
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: QA Manager (`qa.manager`)
- Date: 2026-10-05

## Summary

The New/Edit Test Environment form's "Select Components" field is a select2 multi-select rendered from a
hardcoded, 3-option `<select>` (`options_for_select([["Hardware","Hardware"],["Software","Software"],
["Configuration","Configuration"]])` in `_form.html.erb`), initialized with plain `$('.environment_select2').select2()`
(`assets/javascripts/testrun.js:11-12`) — no `tags: true`. Typing any free-text value (e.g. "Chrome 129",
"Windows 11") into the search box returns "No results found" and cannot be added.

This makes the feature's actual purpose — letting a tester describe *which real environment* a run was executed
against (browser/OS/device combinations, e.g. "Chrome 129" + "Windows 11", "Safari on macOS") — impossible through
the UI. Only the 3 generic category labels can ever be stored, which is meaningless as an environment descriptor
and does not match this plugin's own seeded demo data style (environments named "Chrome on Windows 11", "Safari on
macOS" with presumably specific component values).

The backend has no such restriction: `TestcaseEnvironment#components=` (`app/models/testcase_environment.rb`)
accepts any array of strings, rejects blanks, and stores them comma-joined — it was clearly designed for free-text
tags, not a fixed enum. This is a UI-only regression/oversight relative to what the model supports.

## Steps to reproduce

1. As a user with `create_test_suite`-adjacent environment permissions (e.g. `qa.manager`), go to a project's
   TestCases → Environment → New Environment.
2. Enter a Name (e.g. "Chrome on Windows 11").
3. Click into "Select Components" and type a real value, e.g. "Chrome 129".

## Expected result

- Per the feature's evident purpose (and this plugin's own seed data naming convention), the components field
  should accept free-text entries describing the actual environment (browser/OS/device versions), matching what
  the model layer (`components=`) was built to store.

## Actual result

- The dropdown shows only 3 fixed options: Hardware, Software, Configuration. Typing anything else shows "No
  results found" with no way to confirm/add it as a new tag.
- Confirmed via source: `app/views/testcase_environment/_form.html.erb` hardcodes exactly these 3
  `options_for_select` entries; `assets/javascripts/testrun.js` initializes the widget with plain `select2()`,
  no tagging config.
- Confirmed the backend is not the limiting factor: `TestcaseEnvironment#components=` happily accepts and
  round-trips any array of free-text strings — verified directly via Rails console
  (`e.components = ["Chrome 129", "Windows 11"]; e.save!` succeeds, `e.reload.components` returns the same array).
- Practical effect: TC-RUN-03-01 (`docs/qa/V1-TEST-CYCLE-7.1.0.md`) could only be executed by substituting the
  test case's intended values ("Chrome 129", "Windows 11") with whichever of the 3 generic labels were available
  (e.g. "Hardware", "Software") — a workaround, not what was actually being tested.

## Evidence

### Console / log

```
$ grep -n "environment_select2" assets/javascripts/testrun.js
if ($('.environment_select2').length) {
  $('.environment_select2').select2();   // no tags: true
}

$ cat app/views/testcase_environment/_form.html.erb (excerpt)
<%= form.select :components, options_for_select([[l(:option_hardware), 'Hardware'],
  [l(:option_software), 'Software'], [l(:option_configuration), 'Configuration']],
  @environment.components), {}, { multiple: true, class: 'form-control environment_select2' } %>
```

Live repro: typed "Chrome 129" into the Select Components search box → widget showed `No results found`,
no way to commit the typed value.

## Test case coverage

Found while executing TC-RUN-03-01 (P2, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — case was completed with a
workaround (using "Hardware"/"Software" instead of the intended browser/OS values) so dependent cases
(TC-RUN-03-02 through 03-05) could still proceed; this bug records the actual gap.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers the environment components field.

## Production report

Reported to production 2026-10-05 as **#122077** (`ztflux`), tracker Bug, Priority Medium, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity Medium-severity, Defect
priority Medium. Per explicit user instruction, not linked to any production Test Case/Run.
