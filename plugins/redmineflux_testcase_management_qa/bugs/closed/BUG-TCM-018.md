# BUG-TCM-018

> **CLOSED — 2026-10-06.** Production #121840 (https://flux.zehntech.com/issues/121840) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-018
- Production Redmine Issue ID: #121840
- Title: "Add Sub Test Suite" silently creates an orphaned top-level suite instead of a 3rd nesting level, because the hidden parent-id field is only populated one level deep
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `test-project`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-01

## Summary

Creating a sub-suite under a **top-level** suite works correctly — the resulting suite's `parent_id` is set to
the top-level suite's id, confirmed via `GET /test_suites/<id>/edit`. But using the identical **"Add Sub Test
Suite"** action from a suite that is **itself already a sub-suite** (level 2) does not nest correctly: the
"Add Sub Test Suite" form's hidden `<input id="parent-id-field" name="testsuite[parent_id]">` is populated with
the correct id when triggered from a top-level suite, but is left completely **empty** (`value=""`) when
triggered from a level-2 suite. Submitting that form creates a brand-new **top-level, orphaned** suite (its own
`parent_id` resolves to `null`) — not a 3rd nesting level, and not a blocked/rejected action with any message
either. The suite is simply silently misplaced.

This is the exact failure mode `TESTCASE_MANAGEMENT_TEST_SUITES.md` TC-TCM-194 explicitly warns about: *"If the
plugin imposes a depth limit, it is stated clearly rather than failing silently."* Here it fails silently.

## Steps to reproduce

1. Create a top-level test suite `A` (Test Suite sidebar → **Add Test Suite**).
2. From `A`'s action menu, **Add Sub Test Suite** → create `B`. Confirm via `GET /test_suites/<B's id>/edit`
   (or the Edit Folder modal) that `B.parent_id == A.id` — it does.
3. From `B`'s action menu, **Add Sub Test Suite** → create `C`.
4. Confirm `C`'s actual parent via `GET /test_suites/<C's id>/edit`.

## Expected result

- Either `C` is correctly nested three levels deep (`C.parent_id == B.id`), or the action is refused/blocked with
  a clear message stating a maximum nesting depth of 2 levels.

## Actual result

- `C` is created with `parent_id: null` — a new, orphaned **top-level** suite, not nested under `B` at all, and
  with no error or warning of any kind. Live reproduction (this session):
  - Suite 9 `QA-AUTOSUITE-192` (top-level): `parent_id: 0`
  - Suite 10 `QA-SUBSUITE-193` (added as a sub-suite of 9): `parent_id: 9` — correct.
  - Suite 11 `QA-SUBSUITE-194-L3` (added as a sub-suite of **10**, attempting a 3rd level): `parent_id: null` —
    wrong; silently became a second top-level suite instead.
  - Reproduced the root cause directly: opening "Add Sub Test Suite" from suite 10's own menu renders the form
    with `<input id="parent-id-field" type="hidden" value="" name="testsuite[parent_id]">` — empty — whereas the
    same form opened from a top-level suite correctly pre-fills this value.

## Root cause

The client-side script that populates `#parent-id-field` before showing the "Add Sub Test Suite" form apparently
reads the triggering suite's id from a source that is only correct for top-level nodes (e.g. a selector or data
attribute scoped to the first-level list), so it resolves to nothing when the trigger is a nested (level-2) suite
node instead.

## Suggested fix

Populate `#parent-id-field` from the specific suite node the "Add Sub Test Suite" action was invoked on,
regardless of its own nesting depth — or, if a 2-level maximum is an intentional design limit, disable/hide the
"Add Sub Test Suite" option on already-nested suites and state the limit explicitly, rather than submitting a
form with a blank parent id.

## Evidence

### Screenshot

![Add Sub Test Suite form opened from a level-2 suite, showing the hidden parent-id-field with an empty value](../../screenshots/BUG-TCM-018/parent-id-field-empty-level3.png)

### Console / log

```
GET /test_suites/9/edit  => {"id":9,"name":"QA-AUTOSUITE-192", ..., "parent_id":0}
GET /test_suites/10/edit => {"id":10,"name":"QA-SUBSUITE-193", ..., "parent_id":9}
GET /test_suites/11/edit => {"id":11,"name":"QA-SUBSUITE-194-L3", ..., "parent_id":null}

Reproduced form HTML (Add Sub Test Suite, opened from suite 10 / level-2):
<input autocomplete="off" id="parent-id-field" type="hidden" value="" name="testsuite[parent_id]">
  -- value empty, vs. a correctly pre-filled value when the same action is opened from a top-level suite.
```

## Test case coverage

Found while executing `testcases/TESTCASE_MANAGEMENT_TEST_SUITES.md`:
- TC-TCM-194 (Multi-level nesting) — **FAIL**, this is the blocking defect.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers suite nesting depth. Distinct from
  BUG-TCM-017 (Test Suite modals missing a Description field — a different gap on the same screen).

## Production report

Reported to production `ztflux` as **#121840** on 2026-10-01, assigned to Sheetal Sharma. Linked via
`report_defect` against testcase #121697 ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression
2026-09-30") and run #592, environment "Window 11 + Chrome". Priority: Medium (priority_id 2); Defect custom
fields: Type=Functional, Severity=Medium-severity, Priority=Medium.

---

## Production history (synced from #121840 on 2026-10-08)

### 2026-10-06 07:38 UTC — Vaishnavi Bhawsar

Checked this one and it's already working correctly in the current code — no fix needed here.

I recreated the exact scenario from the ticket: a top-level suite, a sub-suite under it, then tried adding a 3rd-level sub-suite from the sub-suite's own menu. The parent gets set correctly every time, and the new suite's actual parent in the database matches exactly what it should be — confirmed 3 levels deep (grandchild → child → top-level), no orphaned/top-level suite created anywhere in the chain.

Screenshot attached shows the 3-level nested tree (TCM017 Verification Suite → TCM018-Child → TCM018-Grandchild) in the sidebar.

For QA: Create a top-level suite, add a sub-suite under it, then add a sub-suite under THAT sub-suite (3 levels total). Confirm all three show correctly nested in the Test Suite sidebar tree, and that none of them ends up as an unexpected extra top-level suite.

### 2026-10-06 13:57 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Created a real 3-level chain (Authentication -> Nest Level 2 -> Nest Level 3) via the actual "Add Sub Test Suite" UI flow at each level: the hidden parent-id field correctly read "10" (not stuck at "1") when adding from the level-2 suite, and the saved record confirms genuine 3-level nesting (Testsuite#11.parent_id == 10, not nil/orphaned). Sidebar tree also visually renders the new suite nested under its parent, not as a top-level orphan.
