# BUG-TCM-029

> **CLOSED — 2026-10-06.** Production #122071 (https://flux.zehntech.com/issues/122071) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-029
- Production Redmine Issue ID: #122071
- Title: A rejected duplicate-name suite create leaves a stale "ghost" node in the suite tree until the page is reloaded
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: Chromium (Playwright MCP)
- User role: Tester (`qa.engineer`)
- Date: 2026-10-05

## Summary

Creating a test suite with a name that already exists (case-insensitive duplicate) is correctly rejected
server-side with a validation error. However, the suite tree sidebar still renders an extra node for the
rejected suite — a visual duplicate that was never actually created — until the page is reloaded.

## Steps to reproduce

1. On the Test Suites tab, create a root-level suite named `Regression - Checkout`. It appears once in the tree.
2. Click "Add Test Suite" again and enter `regression - checkout` (same name, different case).
3. Click Create.

## Expected result

- The create is rejected with a validation error ("Name has already been taken").
- The suite tree continues to show exactly one `Regression - Checkout` node.

## Actual result

- The validation error does show correctly, and the database genuinely contains only one suite (confirmed via
  `Testsuite.where(project_id: 'qa-demo')` — a single row, id unchanged).
- Despite that, the tree sidebar shows **two** `Regression - Checkout` entries — one in the normal style, one
  rendered in red/pending style with its own options (hamburger) icon — until the page is reloaded, at which
  point the stale second node disappears and only the real suite remains.
- Root cause (not confirmed, inferred from behavior): the suite-tree JS appears to optimistically insert a new
  tree node before the server responds, and does not roll that insertion back when the server returns a
  validation error instead of a success.

## Evidence

### Screenshot

![Two "Regression - Checkout" nodes shown in the tree after a rejected duplicate-name create; only one is real](../../screenshots/BUG-TCM-029/ghost-duplicate-node.png)

### Console / log

- No console errors associated with this specific defect (the ghost node is a rendering/state issue, not a thrown
  exception).
- DB check immediately after: `Testsuite.where(project_id: 'qa-demo')` → 1 row (`id=4`, `name="Regression -
  Checkout"`) — confirms no duplicate was actually persisted.

## Test case coverage

Found while executing `docs/qa/V1-TEST-CYCLE-7.1.0.md`:
- TC-SUITE-01-02 (Negative — duplicate suite name in the same project is rejected) — the actual assertion (duplicate
  rejected, not persisted) still **PASSES**; this ghost-node rendering issue is a secondary, UI-only finding
  observed while executing that case.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers suite-tree rendering after a
  rejected create.

## Production report

Reported to production 2026-10-05 as **#122071** (`ztflux`), tracker Bug, Priority Low, Category Testcase
Management Plugin, Target Version "Testcase Management plugin Release 7.1.0 [07-10-2026]" (id 2066), assigned to
**Vaishnavi Bhawsar** (id 192). Custom fields: Defect Type Functional, Defect Severity Low-severity, Defect
priority Low. Per explicit user instruction, not linked to any production Test Case/Run.

---

## Production history (synced from #122071 on 2026-10-08)

### 2026-10-06 11:12 UTC — Vaishnavi Bhawsar

Investigated but could not reproduce on the current build. Followed the exact repro steps (created a root-level suite, then tried to create a second one with the same name in different case) — the validation correctly rejects it with "Name has already been taken" (matches expected result), and the suite tree shows no ghost/duplicate node at all, immediately, with no reload needed. Also tried an aggressive variant (rapid triple-click on Create to force overlapping in-flight requests, in case it's a double-submission race) — still no ghost node; the tree stayed at exactly the same node count before and after.

Traced the client-side code path for this form (test_suites#create, remote: true): on success it does a full page navigation (window.location = ...), and on validation failure it only updates the flash error text — there is no optimistic tree-insertion code anywhere in this path that I could find, which is consistent with not being able to reproduce a leftover "ghost" node.

This may be specific to a Redmine/browser version or a timing condition I haven't hit. If you can still reproduce it, a short screen recording or the exact browser/Redmine version would help pin down what's different from this environment.

### 2026-10-06 11:23 UTC — Vaishnavi Bhawsar

(Correcting ticket status — this one has no fix to QA, see my earlier note: investigated but could not reproduce. Leaving as New, not In QA.)

### 2026-10-06 12:10 UTC — Vaishnavi Bhawsar

Tried to recreate this using the exact same steps, and even tried a tougher version of the test (clicking Create several times very fast, in case it only shows up when things happen quickly). Both times, the page behaved correctly — it showed the proper "name already taken" message and did not leave behind any extra entry in the list.

For QA: if this is still happening, a short screen recording or the exact browser/steps used would help pin down what's different, since it couldn't be reproduced here.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Submitted a duplicate suite name ("Authentication"); only 1 node of that name exists in the tree (no ghost duplicate), with a clean "Name has already been taken" validation message shown.
