# BUG-TCM-029

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
