# BUG-TCM-054

> **CLOSED — 2026-10-07.** Production #122693 (https://flux.zehntech.com/issues/122693) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-054
- Production Redmine Issue ID: #122693 (https://flux.zehntech.com/issues/122693) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority High, Defect Severity High-severity
- Title: Dragging a test case without first checking its checkbox always moves/copies nothing, yet both Copy and Move report success
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: High
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

User-reported: dragging/copying a single test case into a suite without first checking its checkbox shows the green "Testcase was successfully copied."/"successfully moved." flash banner, but the destination suite's grid is completely empty -- no test case actually landed there. This is confirmed as the **primary** documented interaction for this feature, not an edge case: `testcase.js`'s own code comment (`rftc-TCM-025`) states single-row dragging exists specifically so a user does not have to check a row's checkbox first.

## Root cause (two independent layers, both confirmed live via Playwright against the real running app)

**Front end** -- a call-order defect in how `testcase.js`'s `makeRowDraggable` wires up jQuery UI's `draggable()`:

```
$row.draggable({
  start: function () {
    // only auto-checks the box for a single-row (previously-unchecked) drag -- but this runs
    // AFTER jQuery UI has already called `helper` below to build the drag payload
    if ($("input[type='checkbox']:checked").closest('.hascontextmenu').length === 0) {
      $row.find("input[type='checkbox']").prop('checked', true);
    }
  },
  helper: function () {
    // reads "which checkboxes are checked RIGHT NOW" to decide what to clone into #draggingContainer --
    // jQuery UI calls this BEFORE `start`, so for an unchecked single-row drag this always sees
    // zero checked boxes and builds an EMPTY #draggingContainer
    var selected = $("input[type='checkbox']:checked").closest('.hascontextmenu');
    container.empty();
    selected.each(function () { container.append($(this).clone()); });
  }
});
```

jQuery UI's documented widget lifecycle calls a draggable's `helper` option to build the visual drag payload **before** it fires the `start` event -- confirmed directly against the live page's actual jQuery UI instance by invoking its internal `_mouseStart` and logging call order: `helper` fired with `checkboxChecked: false`, then `start` fired (also still false at that instant). Carried through to completion: the checkbox ends up checked moments later, but `#draggingContainer` already has zero children by then. The later `drop:` handler builds `tempData.issueIds` from `$("#draggingContainer").children()` -- which is empty -- regardless of which suite was dropped on or which popup button (Move/Copy) is subsequently clicked.

**Back end** -- both sibling actions in `app/controllers/test_suites_controller.rb` report success without checking anything was actually in the request:

```
def copy_issues
  issue_ids = Array(params[:issue_id])
  duplicated_issues = []
  errors = []
  issue_ids.each do |issue_id| ... end   # never runs when issue_ids is empty
  if errors.empty?                        # vacuously true -- nothing was attempted
    render json: { message: l(:notice_testcase_copied, text: 'Testcase was'), duplicated_issues: [] }
  end
end

def add_issues
  issue_ids = Array(params[:issue_id])
  @issues = Issue.find(issue_ids)         # Issue.find([]) => [] -- does not raise
  # every subsequent guard trivially passes on an empty set
  @test_suite.issues << @issues           # appending [] does nothing
  render json: { message: l(:notice_testcase_moved, text: 'Testcase was') }   # reports success anyway
end
```

## Steps to reproduce

1. On a Test Cases list, find a test case row whose checkbox is not checked.
1. Without clicking its checkbox first, drag that row directly onto a different test suite in the tree.
1. Drop it -- the "Move here"/"Copy here" popup appears, offering a choice of Move or Copy.
1. Click either option.
1. Observe the destination suite immediately after.

## Expected result

Both endpoints should only report success when something was actually copied/moved, and should report a clear error when nothing happened -- never a generic "successfully copied"/"successfully moved" for a no-op.

## Actual result

Confirmed via direct HTTP request and, separately, via the live page's own `$.ajax(...)` call (identical to what the real drag handlers use) from an authenticated Playwright browser session:

```
POST /copy_issues_to_test_suite  (test_suite_id=13, no issue_id)
  -> 200 OK, {"message":"Testcase was successfully copied.","duplicated_issues":[]}

POST /add_issues_to_test_suite   (test_suite_id=13, no issue_id)
  -> 200 OK, {"message":"Testcase was successfully moved."}

Live jQuery UI call-order trace (via the row's own bound widget, _mouseStart invoked directly):
  [{fn: "helper", checkboxChecked: false}, {fn: "start", checkboxChecked: false}]
  -> checkboxCheckedAfterStart: true, draggingContainerChildCount: 0
```

Control check with a real `issue_id` confirmed the backend's actual copy/move logic is otherwise sound (a genuine new issue and a real suite-link row were both created correctly) -- the defect is specifically the missing "did anything actually happen" guard on the backend, triggered deterministically by the front-end call-order bug on every single unchecked-row drag.

## Suggested fix

**Front end**: stop having `helper` depend on checkbox state that `start` is responsible for establishing -- either move the "auto-check this row" logic into `helper` itself, or have `helper` fall back to the row being dragged whenever no checkbox is checked yet.

**Back end**: both `copy_issues` and `add_issues` should check that `issue_ids` is actually non-empty before entering their success branch, e.g.:
```
if issue_ids.empty?
  render json: { message: l(:error_no_testcase_selected) }, status: :unprocessable_entity
  return
end
```

## Environment

- Redmine version: 6.x (Docker)
- Plugin version: 7.1.0
- Environment: Docker localhost:3015 (project compat-fresh-project)
- User role: Administrator

---

## Production history (synced from #122693 on 2026-10-08)

### 2026-10-07 06:37 UTC — Vaishnavi Bhawsar

Fixed both halves, same as you suggested.

The drag-and-drop side: the row's checkbox was being auto-ticked a moment too late — after the system had already decided what to carry along, not before. So an un-ticked row always carried nothing, even though it looked ticked by the time you saw it. That ordering is fixed now.

The safety-net side, in case something like this ever happens again: Move/Copy no longer says "success" unless a test case was actually included. If nothing valid is being moved, it now tells you clearly instead of quietly doing nothing.

Screenshot attached: dragged test case #2 ("Login with invalid password") from the Authentication suite onto Shopping Cart & Checkout without ticking its checkbox first, chose Copy, and it's now genuinely sitting in the destination suite as a new test case — while the original stayed exactly where it was.

For QA:
1. On the Test Cases list, find a test case whose checkbox is NOT ticked.
2. Drag it directly onto a different suite without ticking the checkbox first.
3. Choose Copy or Move — confirm the destination suite actually receives it (not just a success message).
4. Confirm Copy leaves the original in place, and Move does not.

### 2026-10-07 07:25 UTC — Sourabh Singh

Retested on master `c43c588` (commit 852b127, which cites this bug by name). The checkbox auto-check logic moved from the `start` callback into `helper` -- the one jQuery UI actually calls first -- so the drag payload now correctly includes the dragged row even when its checkbox was never manually checked. Separately, both Copy and Move now have an explicit empty-selection guard, returning a clean error instead of silently falling through to a false success. Confirmed both fixes directly: an empty-id request to both endpoints now returns a proper error, and a real-input request still works correctly with no regression. Closing.
