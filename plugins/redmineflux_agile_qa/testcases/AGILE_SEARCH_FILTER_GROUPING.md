# Test Cases — Redmineflux Agile Board — Search, Filters, Grouping & Swimlanes

> Source: vendor KB — "How to Search and Filter Issues", "How to Use Grouping and Swimlanes".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Open a board → the search field at the top, or the filter section → **Apply**.
Cross-check every filtered result against the **issue list with the equivalent filter** — if the board and the
issue list disagree about the same query, the board is misreporting, and that is the defect this suite targets.

---

## Functional Cases — Search

---

### TC-AGB-401: Search by issue subject

**User Role:** Member
**Steps:**
1. Enter a keyword matching some issue subjects in the board search field.

**Expected Result:**
- Only matching cards remain, distributed across their correct status columns.
- Column counts update to reflect the filtered set rather than staying at the unfiltered totals — a stale count
  beside a filtered column is a reporting defect.

---

### TC-AGB-402: Clearing the search restores the board

**User Role:** Member
**Steps:**
1. Clear the search field.

**Expected Result:**
- All cards return and counts return to their unfiltered values.

---

### TC-AGB-403: Search with no matches

**User Role:** Member
**Steps:**
1. Search for a string that matches nothing.

**Expected Result:**
- Empty columns with a clean empty state — not an error and not the unfiltered board.

---

### TC-AGB-404: Search is case-insensitive and matches partial words

**User Role:** Member
**Steps:**
1. Search for a lowercase fragment of a mixed-case subject.

**Expected Result:**
- The issue matches. Record the exact matching semantics (prefix, substring, whole word) so later cases can rely
  on them.

---

## Functional Cases — Filters

---

### TC-AGB-405: Filter by assigned member

**User Role:** Member
**Steps:**
1. Filter the board by one assignee.

**Expected Result:**
- Only that user's issues remain. Cross-check the count against the issue list filtered by the same assignee.

---

### TC-AGB-406: Apply a query-based filter

**User Role:** Member
**Steps:**
1. Open the filter section, set conditions (e.g. tracker = Bug, priority = High), Apply.

**Expected Result:**
- The board shows exactly the matching issues, and the same conditions on the issue list return the same set.

---

### TC-AGB-407: Combine search and filters

**User Role:** Member
**Steps:**
1. Apply an assignee filter and a subject search together.

**Expected Result:**
- The result is the intersection — a subset of each applied alone.

---

### TC-AGB-408: Filters persist appropriately

**User Role:** Member
**Steps:**
1. Apply filters, navigate away, return to the board.

**Expected Result:**
- Record whether filters persist or reset. Either is defensible, but a filter that persists **invisibly** — with
  no indication it is active — is a usability defect, because the board then appears to be missing issues.

---

### TC-AGB-409: Sprint filter on a Scrum board

**User Role:** Member
**Steps:**
1. In Scrum mode, filter by sprint (paired with TC-AGB-315).

**Expected Result:**
- Only that sprint's issues are shown, and the filter is combinable with search and member filters.

---

### TC-AGB-410: Filtered drag still works

**User Role:** Member
**Steps:**
1. With a filter applied, drag a card to another column.

**Expected Result:**
- The status change succeeds.
- If the change makes the card fall outside the active filter, it leaves the view with a visible cue rather than
  simply vanishing in a way that reads as data loss.

---

## Functional Cases — Grouping and swimlanes

---

### TC-AGB-411: Group by each supported option

**User Role:** Member
**Steps:**
1. Apply **Group By** in turn for: None, Project, Tracker, Priority, Author, Assignee, Category, Target version,
   Parent task.

**Expected Result:**
- The board refreshes into swimlanes for each grouping, with one lane per distinct value.
- Every card appears in exactly one lane. A card appearing in two lanes, or in none, is a defect.
- **None** returns the board to a flat layout.

---

### TC-AGB-412: Issues with no value for the grouping field

**User Role:** Member
**Steps:**
1. Group by Target version with some issues unversioned; repeat grouping by Category and Parent task.

**Expected Result:**
- A clearly labelled "none"/"unassigned" lane collects them.
- They must not be silently dropped from the board — a grouping that hides issues would make the board
  under-report without any visible cue.

---

### TC-AGB-413: Swimlane counts and totals are accurate

**User Role:** Member
**Steps:**
1. With grouping applied, compare each lane's per-column counts against the equivalent issue-list filter.

**Expected Result:**
- Counts match, and the sum across lanes equals the ungrouped total.

---

### TC-AGB-414: Drag between columns within a swimlane

**User Role:** Member
**Steps:**
1. With grouping applied, drag a card to another status column inside the same lane.

**Expected Result:**
- The status changes; the card stays in its lane because its grouping value did not change.

---

### TC-AGB-415: Drag between swimlanes

**User Role:** Member
**Steps:**
1. Attempt to drag a card from one swimlane into another (e.g. from one assignee's lane to another's).

**Expected Result:**
- Record the behaviour precisely. If dropping into another lane **reassigns the grouping field**, that is a
  powerful feature that must be journaled on the issue like any other change.
- If it is not supported, the drag is refused cleanly rather than appearing to succeed and then snapping back with
  no explanation.

---

### TC-AGB-416: Grouping persists with board configuration

**User Role:** Member
**Steps:**
1. Set grouping, leave the board, return.

**Expected Result:**
- The grouping is restored, and a saved custom board keeps its own grouping independently.

---

## Negative Cases

---

### TC-AGB-417: Grouping with a very large number of distinct values

**User Role:** Member
**Steps:**
1. Group by Assignee on a project with 100+ distinct assignees.

**Expected Result:**
- The board remains usable — lanes are paginated, collapsible or lazily rendered.
- Record the render time. A board that produces 100 expanded lanes at once is a performance defect.

---

### TC-AGB-418: Filter results respect issue visibility

**User Role:** Member on a role whose issue visibility is limited (e.g. to their own issues)
**Steps:**
1. Apply a broad filter intended to match everything.

**Expected Result:**
- Only issues the user may see are returned. A filter must never widen visibility — this is the classic way a
  board leaks, and it would be High severity.
- Check the response body, not only the rendered cards.

---

### TC-AGB-419: Search does not match content the user cannot see

**User Role:** Member with limited visibility
**Steps:**
1. Search for a keyword that appears only in the subject of an issue the user cannot view.

**Expected Result:**
- No match, and no subject fragment appears in the response.

---

### TC-AGB-420: Special characters in the search field

**User Role:** Member
**Steps:**
1. Search for a percent sign, an underscore, a single quote and a script tag.

**Expected Result:**
- Treated as literal search text. No SQL wildcard behaviour leaking through, no error, and **no script execution**
  when the term is echoed back into the page. Execution here is Critical.

---

### TC-AGB-421: Very long search string

**User Role:** Member
**Steps:**
1. Search with a 5000-character string.

**Expected Result:**
- Handled gracefully — truncated with a note, or an empty result. No timeout and no 500.

---

### TC-AGB-422: Filter referencing a deleted value

**User Role:** Member + Admin
**Steps:**
1. Filter by a target version, have the Admin delete it, then reapply the board.

**Expected Result:**
- A clear message about the missing filter value, or an empty result. The board must not become permanently
  unopenable because a saved filter references something that no longer exists.

---

### TC-AGB-423: Grouping by a field the user cannot see

**User Role:** Member with restricted custom-field visibility
**Steps:**
1. Check whether a restricted field is offered as a grouping option.

**Expected Result:**
- It is not offered; and if it is, the lane labels must not disclose values the user is not permitted to see.
  Lane labels are an easy, overlooked disclosure path.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
