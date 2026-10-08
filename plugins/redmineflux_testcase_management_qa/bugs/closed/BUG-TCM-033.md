# BUG-TCM-033

> **CLOSED — 2026-10-06.** Production #122075 (https://flux.zehntech.com/issues/122075) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-033
- Production Redmine Issue ID: #122075
- Title: The single-row drag "Copy Testcase"/"Move Testcase" popup is completely non-functional — it calls a `TestcasesController` that has never existed in the codebase
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: Tester (`qa.engineer`)
- Date: 2026-10-05

## Summary

**Correction (see note at bottom): this bug is narrower than first filed.** There are two separate, independent
code paths for moving/copying a test case between suites:

1. **Checkbox multi-select → drag → "Move here"/"Copy here" popup** — calls `TestSuitesController#add_issues` /
   `#copy_issues` (route names `add_issues_to_test_suite` / `copy_issues_to_test_suite`). This controller is real
   and implemented. **This is the path TC-SUITE-05-01/05-02 actually describe, and it works correctly** — verified
   separately after this bug was first mis-scoped (see correction note).
2. **Single-row drag (no checkbox selected) → `#testcase_copy_modal` popup → "Copy Testcase"/"Move Testcase"
   buttons** — calls `copyTestcase()` / `moveTestcase()` (`assets/javascripts/testcase.js`), which POST/PUT to
   `/copy_test_case` and `/update_testcases` — routed in `config/routes.rb` to `testcases#copy_test_case` /
   `testcases#update_test_cases`. **No `TestcasesController` class exists anywhere in this codebase, and never
   has** — this specific path 404s every time. This is what `docs/qa/areas/SUITE-CASE.md`'s own TC-CASE-03-03
   already documents as "Finding 1" (this is a **known, team-documented** gap, not a fresh discovery — filed here
   as a local bug record for traceability, scoped correctly this time).

This bug covers **only path 2** (the single-row drag popup). Path 1 (the actual TC-SUITE-05-01/05-02 mechanism) is
unaffected and works.

## Steps to reproduce

1. On the suite tree, drag a single test case row **without first checking its checkbox** directly onto a
   different suite's tree node.
2. When the `#testcase_copy_modal` popup appears, click **Copy Testcase** (or **Move Testcase**).

## Expected result

- The case is copied/moved into the target suite, same outcome as the working checkbox-multi-select path.

## Actual result

- The request 404s. Confirmed via a direct authenticated same-origin call to the exact endpoint
  `moveTestcase()` uses:
  ```
  fetch('/update_testcases', { method: 'PUT', ..., body: 'dragged_testcase_id=21&target_testsuite_id=4' })
  -> 404 {"status":404,"error":"Not Found"}
  ```
- The route **is** loaded (`Rails.application.routes.routes` lists `PUT /update_testcases(.:format) ->
  testcases#update_test_cases`), but no file defines `class TestcasesController` anywhere (confirmed via
  exhaustive `grep` across the plugin — only the *test* file `test/functional/testcases_controller_test.rb`
  references the class name, never a real controller) and via git history (`git log --all -- 
  app/controllers/testcases_controller.rb` returns nothing — never committed in this repo's history).
- 3 further dead routes share this same missing controller: `edit_testcase_path` (PATCH `testcases#update`),
  `update_assignee` (PUT `testcases#update_assignee`), and `delete_testcase` (DELETE `testcases#destroy`). Per
  `docs/qa/areas/SUITE-CASE.md`'s own findings, case delete/edit/assign are actually done through core Redmine
  Issue actions in the real UI (not through these dead routes), so those 3 are very likely inert/unused rather
  than user-facing breakage — not separately confirmed here.

## Evidence

### Console / log

```
PUT /update_testcases(.:format) -> testcases#update_test_cases   # route IS loaded (Rails.application.routes.routes)

$ fetch('/update_testcases', {method:'PUT', ...})
  status: 404
  body: {"status":404,"error":"Not Found"}

$ grep -rn "class TestcasesController" .          -> (no results)
$ git log --all -- app/controllers/testcases_controller.rb   -> (no results, file never committed)
```

## Test case coverage

Found while executing TC-SUITE-05-01 (P1, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — **initially mis-scoped against that
TC (corrected, see below)**. Properly corresponds to TC-CASE-03-03 (P2, exploratory, in `docs/qa/areas/SUITE-CASE.md`),
which already predicted this exact finding and asked to confirm it live.

## Duplicate check

- Duplicate found: **Yes, pre-documented internally** (not a prior `BUG-TCM-*` file, but the team's own
  `docs/qa/areas/SUITE-CASE.md` "Findings surfaced during authoring," Finding 1, already describes this exact
  issue and predicted it would reproduce). Filed here anyway for this plugin's own bug-tracking continuity, scoped
  down to only the confirmed-broken path.
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing `BUG-TCM-*` entry covers this.

## Production report

Reported to production 2026-10-05 as **#122075** (`ztflux`), tracker Bug, Priority Medium, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity Medium-severity, Defect
priority Medium. Description scoped to only the confirmed-broken single-row-drag path, per the correction note
above. Per explicit user instruction, not linked to any production Test Case/Run.

## Correction note (2026-10-05)

This bug was originally filed as "Moving or copying a test case to another suite is completely non-functional,"
claiming it blocked TC-SUITE-05-01/05-02. That was wrong: TC-SUITE-05-01's actual mechanism is the **checkbox
multi-select** drag (hits `TestSuitesController#add_issues`/`#copy_issues`, a real controller), not the
single-row drag this bug describes. The error was mine — while diagnosing why a manual drag gesture produced no
visible result, I tested the single-row drag's dead endpoint (`/update_testcases`) as a substitute for what the
*checkbox-selected* drag would call, without confirming it was actually the same code path. It is not. Caught
after the user reported successfully moving a test case manually. Re-scoped to only the path that is genuinely
broken; TC-SUITE-05-01 is being re-executed properly against the real `add_issues_to_test_suite` mechanism.

---

## Production history (synced from #122075 on 2026-10-08)

### 2026-10-06 11:17 UTC — Vaishnavi Bhawsar

Fixed. Rather than building out the missing TestcasesController from scratch, the single-row drag "Copy Testcase"/"Move Testcase" popup now calls the exact same real, already-working endpoints the checkbox multi-select drag path uses (add_issues_to_test_suite / copy_issues_to_test_suite) -- same business rules (blocks moving a testcase that's already attached to a run, rejects moving into a suite it's already in), same code, just reached from a second entry point.

Verified directly against the real endpoints with the same payload shape the updated JS now sends: a copy created a genuine duplicate issue in the target suite (steps/requirements included, original untouched), and a move correctly removed the testcase from its original suite and attached it to the target suite only (confirmed in the database both times). Zero console errors.

For QA:
1. On the suite tree, drag a single test case row (without checking its checkbox first) onto a different suite's tree node.
2. Click "Copy Testcase" -- confirm a new copy appears in the target suite and the original is untouched.
3. Repeat with "Move Testcase" on a different case -- confirm it now appears ONLY in the target suite (removed from its original suite).

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — confirmed fixed via code read (commit ff2c1f3). The single-row drag Copy/Move popup now calls the same real, working move/copy actions the checkbox multi-select path already used, instead of a TestcasesController endpoint that never existed.
