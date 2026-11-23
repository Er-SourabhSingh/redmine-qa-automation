# BUG-TCM-156

- Bug ID: BUG-TCM-156
- Production Redmine Issue ID: #129166
- Severity: High — the per-testcase assignee feature (RFTC-045 / rtc-046, production #128320/#128416) shipped
  alongside a deliberate change that made the run-level Assignee field read-only in Edit Run, but the My ToDo
  list was never updated to read the new per-testcase assignee column — the net effect is that **reassigning
  work is now completely silent to the ToDo list**: there is no UI action left that removes a run from an
  assignee's own-scoped My ToDo, and the newly-assigned user never sees it there either.
- Title: Reassigning a test case's assignee (the only reassignment control left after rtc-046) does not move the
  run on either user's My ToDo — `testcase_todos#index` still only reads `run_assignments.assignee_id`, never
  the per-testcase `run_issues.assignee_id`
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: dev build (`Version: 0.0.0-dev`)
- Environment: Docker `redmine6-happyflow-sqlite` (`localhost:3021`), project `rftc-016-ci-qa` (id=1) — **not
  DB-engine-specific**: the root cause is a pure Ruby/ActiveRecord controller query with no raw SQL or
  DB-dialect dependency, so this is expected to reproduce identically on the PostgreSQL and MySQL legs too (see
  Duplicate check below — both of those legs' own TC-TCM-207 "PASS" verdicts only checked that the case's own
  Assignee column changed, never that either user's My ToDo list actually updated, so they did not actually
  exercise the step that would have caught this)
- Browser: Playwright-driven Chromium (real UI actions, not API-only)
- User role: Developer (own-scoped role, no `view_all_todos`) for the "before" and "after" check; Reporter for
  a second confirmation
- Date: 2026-11-20

## Steps to reproduce

1. As admin, create a run with one environment and one test case, assigning that environment to user A (a
   Developer-role user with no `view_all_todos`) via the normal New Run form.
2. Log in as user A, open My ToDo (`/testcase_todos`): the run is listed, as expected.
3. Log out, log back in as admin. Open the run, select the one test case's checkbox, click **Reassign**, and
   reassign it to user B (a different project member). Confirm.
4. Open the run's own execution grid again: the case's own Assignee column now correctly shows user B, not
   user A — the reassignment itself genuinely took effect at the data level.
5. Log in as user A again, open My ToDo: the run is **still listed**, completely unchanged.
6. Log in as user B, open My ToDo: the run is **never listed** there at all, even though user B now owns the
   only test case in it.

## Expected result

- Per `TESTCASE_MANAGEMENT_TODO.md` TC-TCM-207 ("Reassigning work moves the To-Do item"): the item should leave
  user A's My ToDo and appear in user B's. This was confirmed working on the 2026-10-01 and 2026-10-28 regression
  passes, before the rtc-046 change shipped — at that time, Edit Run's own Assignee field was directly editable,
  and editing it there moved the run between My ToDo lists correctly.

## Actual result

- `app/controllers/testcase_todos_controller.rb#index` builds `@run_assignments` from
  `RunAssignment.where(assignee_id: User.current.id)` only (see the non-admin branch, lines ~27-30) — it has
  never been updated to also consider `run_issues.assignee_id`, the newer per-testcase assignee column that
  RFTC-045/rtc-046 introduced.
- `app/views/runs/_edit_run_assignment.html.erb` now has its own comment confirming this is by design on the
  *input* side: `# rtc-046: Edit Run manages environments only. An existing environment's assignee is shown
  here but cannot be edited (the server ignores any assignee sent from this form); a new environment starts
  Unassigned. Test case assignees are changed inside the run (inline or bulk Reassign).` — i.e. the team
  deliberately moved assignee *editing* to the per-testcase "Reassign" control, but never updated the ToDo
  *read* side to match.
- Net result: on the current build, there is **no UI action at all** that moves a run between two users' My
  ToDo lists. The run-level `run_assignments.assignee_id` that ToDo actually reads is fixed at creation time and
  can never be changed again (Edit Run ignores any value posted for it); the only assignee field a user can
  still change (`run_issues.assignee_id` via Reassign) is one ToDo never looks at. Confirmed on real fixture
  data: Daisy Skye (Developer, own-scoped) still saw "TC-TCM-205-206 happy-flow ToDo run" in her My ToDo after
  the run's one case was reassigned away from her to Autumn Grace; Autumn Grace's own My ToDo never showed that
  run at all, even though she now owns its only test case.

## Evidence

### Screenshot

N/A — this is best demonstrated by the My ToDo table's own "Assignee" column, which is plain text; the
decisive evidence is the `run_issues`/`run_assignments` DB state plus the two users' My ToDo listings, captured
in the session transcript (not a single screenshot that shows the defect on its own).

### Console / log

```
GET /testcase_todos?project_id=rftc-016-ci-qa as daisy.skye (Developer, no view_all_todos), AFTER reassigning
run 47's only test case (#339) from Daisy Skye to Autumn Grace via the run's checkbox "Reassign" action:
  → Run 47 "TC-TCM-205-206 happy-flow ToDo run (SQLite) (Chrome - Windows 11)" still listed, Assignee column
    still reads "Daisy Skye" (the run_assignments-level field, unchanged since Reassign only touches
    run_issues.assignee_id).

GET /testcase_todos?project_id=rftc-016-ci-qa as autumn.grace (now owns test case #339 inside run 47):
  → Run 47 is absent entirely from her My ToDo.

Source read, app/controllers/testcase_todos_controller.rb lines 22-31:
  if User.current.admin? || User.current.allowed_to?(:view_all_todos, @project)
    @run_assignments = RunAssignment.joins(:run).where(runs: { id: base_runs.pluck(:id) })...
  else
    @run_assignments = RunAssignment.joins(:run)
      .where(runs: { id: base_runs.pluck(:id) }, assignee_id: User.current.id)...
  end
-- no run_issues/assignee_id reference anywhere in this action.
```

## Duplicate check

- Duplicate found: No — searched `bugs/_index.md`/`bugs/_duplicates.md` for `testcase_todo`, `rtc-046`, and
  per-testcase-assignee-related entries; the only prior `testcase_todos` findings (BUG-TCM-009/the TC-214/
  TC-077 cluster) are unrelated project-membership/module-enabled guard gaps, already closed. This is a new,
  distinct root cause introduced by the rtc-046 assignee-ownership split (production #128320/#128416), not a
  recurrence of either of those.
- Existing bug reference (if duplicate): —

## Retest (2026-11-23) — CONFIRMED FIXED, closing

Dev fix (commit `7f7a7d0`/`061d798`, production #129166 journal): `testcase_todos_controller.rb#index`'s
non-admin branch rewritten to own a run via `run_issues`/`run_issue_assignments` (the per-testcase assignee),
not `run_assignments.assignee_id` directly — matching rtc-046's own assignee-ownership model.

Retested on the SQLite leg (`redmine6-happyflow-sqlite`, `localhost:3021`, project `rftc-016-ci-qa`) after
pulling the fix (`git merge --ff-only origin/master` to `f10faff`+) and restarting the container:

- Built a disposable run (#68) with one environment ("Chrome Latest"), assignee = Daisy Skye (Developer role,
  no `view_all_todos`).
- Confirmed via real browser login as Daisy Skye: the run appeared in her My ToDo.
- As admin, reassigned every test case on that environment from Daisy Skye to Autumn Grace via the real
  Reassign dialog (bulk select + Reassign + Apply) — confirmed via DB (`run_issues.assignee_id`) that all were
  genuinely moved.
- Logged back in as Daisy Skye: **the run was gone from her My ToDo** — confirmed via the page, not just data.
- Logged in as Autumn Grace: **the run now appeared in her My ToDo** — confirmed live.

Both directions of the original bug's repro (run doesn't leave A's list, run never appears in B's list) are now
fixed. **Minor cosmetic observation, not re-opening the bug**: the My ToDo table's own "Assignee" column still
showed "Daisy Skye" after the reassignment (likely still reading `run_assignments.assignee_id` for display,
a separate field from the one that now correctly drives list membership) — worth a follow-up polish item, not
a functional defect.

Production issue #129166 updated to Done/100%. Moving to `bugs/closed/`.
