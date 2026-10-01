# BUG-TCM-020

- Bug ID: BUG-TCM-020
- Production Redmine Issue ID: #121841
- Title: Renaming an Environment updates the Environment list and all future run forms correctly, but every existing run still displays the environment's old name everywhere on its own page
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

Created an environment `ENV-A`, created a run (`TC-TCM-042 Env Rename Run`, #25) assigned to it, and recorded one
result (Passed) against it. Renamed the environment from `ENV-A` to `ENV-A-RENAMED` via the Environment tab's Edit
action — confirmed the rename genuinely persisted (the Environment list, and the Environment dropdown on a brand
new Add Run form, both correctly show `ENV-A-RENAMED`).

Reloading the **existing** run (#25) that was already assigned to this environment shows the **old name
everywhere**: the environment filter tab, the "Environment : ENV-A" summary line, and even every link's own query
string (`?environment=ENV-A&...`) still say `ENV-A`, not `ENV-A-RENAMED`. The recorded result itself is not lost
(still shows "Passed (1)"), so this is specifically a stale-name display defect, not a data-loss one — but it
means a renamed environment has two different names depending on which screen you're looking at it from.

## Steps to reproduce

1. Create an Environment (e.g. `ENV-A`).
2. Create a Run assigned to that environment; record at least one result on it.
3. Edit the Environment and rename it (e.g. to `ENV-A-RENAMED`); save.
4. Reopen the run from step 2.
5. Separately, open **Add Run** again and check the Environment dropdown.

## Expected result

- Per `TESTCASE_MANAGEMENT_ENVIRONMENTS.md` TC-TCM-042: "The new name shows everywhere the environment appears" —
  the new name should be reflected on the existing run's page too, not just in the Environment list and new-run
  forms.

## Actual result

- The Environment list (`/projects/test-project/testcase_environment`) correctly shows **ENV-A-RENAMED**.
- A brand-new Add Run form's Environment dropdown correctly offers **ENV-A-RENAMED** (the stale old name is gone
  from the list of choices).
- The **existing** run #25, created before the rename, still shows **ENV-A** (the old name) in every place it
  appears on that run's own page: the environment tab/filter (`Untested`/`Passed` counts grouped under "ENV-A"),
  the "Environment : ENV-A" summary line, and the `environment=ENV-A` query parameter on every link within that
  run (test case detail links, filter links, etc.).
- The recorded result (Passed, 1) is still present and correctly attached — this is a display/reference defect,
  not data loss.

## Root cause (not confirmed from source, inferred from behavior)

The behavior pattern — new forms and the master list reflect the rename instantly, but an already-created run does
not — strongly suggests the run stores the environment as a **copied name string** at the time it is created or at
the time each result is recorded, rather than a live foreign-key reference to the Environment record that would
automatically reflect a later rename. This would explain why the dropdown (built from the live Environment table)
shows the new name while the run's own already-persisted data does not.

## Evidence

### Screenshot

![Run #25's page still shows "ENV-A" (environment tab, summary line, and every link's query string) after the Environment itself was renamed to "ENV-A-RENAMED"](../../screenshots/BUG-TCM-020/run-still-shows-old-environment-name.png)

### Console / log

```
Environment list after rename: cell "ENV-A-RENAMED" (confirmed via /projects/test-project/testcase_environment)
New Add Run form's Environment dropdown: option "ENV-A-RENAMED" (confirmed via a fresh /runs/new)
Existing run #25 page: /runs/25?environment=ENV-A&project_id=test-project&testsuite_id=1
  - option "ENV-A" [selected] (environment tab)
  - listitem: "Environment : ENV-A" (summary line)
  - button "Passed (1)" — result itself intact, only the displayed name is stale
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_ENVIRONMENTS.md`:
- TC-TCM-042 (Edit an environment name) — **FAIL**, this is the blocking defect. The TC's own expected result
  explicitly requires "The new name shows everywhere the environment appears" — confirmed it does not for any
  run created before the rename.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers environment-rename propagation.
  Distinct from BUG-TCM-008 (run detail 500s when the environment-assignee *user* is deleted — a different field
  and a crash, not a stale-name display issue).

## Production report

Reported to production `ztflux` as **#121841** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom
fields: Type=Functional, Severity=Medium-severity, Priority=Medium.
