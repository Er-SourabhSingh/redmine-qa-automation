# Test Cases — Redmineflux Tag Plugin — Filters, Columns & Tag-Based Navigation

> Source: vendor KB — "How to Filter the Tag", "How to Easy access and tracking",
> "How to Viewing a tag plugin" (tag column via the Options panel).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Tag Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_tags_qa

## Navigation methodology

Top menu **Issues** → **Options** panel to add the Tag column; **Add filter** dropdown to filter by tag.
Reach the tag listing page by clicking a tag label, not by typing its URL.

---

## Functional Cases — Tag column

---

### TC-TAG-001: Add the Tag column to the issue list

**User Role:** Member
**Steps:**
1. On the Issues page open **Options**, move **Tags** into the selected columns, click **Apply**.

**Expected Result:**
- A Tags column is added to the issue table.
- Each row shows that issue's tags as coloured labels; untagged rows show an empty cell, not a placeholder error.

---

### TC-TAG-002: Tag column survives saving a custom query

**User Role:** Member
**Steps:**
1. With the Tag column and a tag filter applied, save the query.
2. Reopen the saved query later.

**Expected Result:**
- Both the column and the filter are restored exactly.

---

### TC-TAG-003: Sort the issue list by the Tag column

**User Role:** Member
**Steps:**
1. Click the Tags column header, if sortable.

**Expected Result:**
- Either it sorts deterministically, or it is explicitly non-sortable. A header that appears clickable but silently
  does nothing, or throws a 500, is a defect.

---

### TC-TAG-004: Tag column in CSV/PDF export

**User Role:** Member
**Steps:**
1. With the Tag column applied, export the issue list to CSV and to PDF.

**Expected Result:**
- The export includes the Tags column with the same values shown on screen.
- Multiple tags on one issue are separated legibly and consistently.

---

## Functional Cases — Filtering

---

### TC-TAG-005: Filter issues by a single tag

**User Role:** Member
**Steps:**
1. Add filter → **Tags** → select one tag → Apply.

**Expected Result:**
- Only issues carrying that tag are listed, and every such issue visible to the user is present.
- Cross-check the count against the tag's own listing page (TC-TAG-009).

---

### TC-TAG-006: Filter by multiple tags

**User Role:** Member
**Steps:**
1. Select two tags in the filter and apply.

**Expected Result:**
- The combining rule (any-of vs all-of) is explicit in the UI and the results match it.
- Record which semantics this build uses — an ambiguous filter that silently means "any" while reading like "all"
  is a usability defect.

---

### TC-TAG-007: "None" / "Any" tag filter operators

**User Role:** Member
**Steps:**
1. Apply the filter with operator "none" and then "any", if offered.

**Expected Result:**
- "none" returns exactly the untagged issues; "any" returns exactly the tagged ones. The two sets are disjoint and
  together equal the unfiltered total.

---

### TC-TAG-008: Tag filter combines with other filters

**User Role:** Member
**Steps:**
1. Combine a tag filter with Status = open and an assignee filter.

**Expected Result:**
- Filters intersect correctly. The result is a subset of each filter applied alone.

---

## Functional Cases — Tag-based navigation

---

### TC-TAG-009: Clicking a tag opens its entity listing

**User Role:** Member
**Steps:**
1. Click a tag label on an issue detail page.

**Expected Result:**
- A listing of all entities carrying that tag opens, showing the tag name as its heading.
- The originating issue is in the list.

---

### TC-TAG-010: Tag listing respects project visibility

**User Role:** Member of project A only
**Preconditions:** The same tag is used on an issue in project A and on an issue in a **private** project B that
this user is not a member of. Confirm project B is genuinely private — a new Redmine project defaults to public.
**Steps:**
1. Open the tag's listing page as this user.

**Expected Result:**
- Only the project A issue is listed. The project B issue, its subject and its ID do not appear.
- A leak here is a High-severity data-exposure defect.

---

### TC-TAG-011: Tag listing from the issue list column

**User Role:** Member
**Steps:**
1. Click a tag label rendered inside the issue list's Tags column.

**Expected Result:**
- Same destination and same result set as clicking it on the issue detail page.

---

## Negative Cases

---

### TC-TAG-012: Filter by a tag that has no issues

**User Role:** Member
**Steps:**
1. Create an unused tag and filter by it.

**Expected Result:**
- A clean empty result with the usual "no data to display" message — not an error and not the full unfiltered list.

---

### TC-TAG-013: Filter by a tag deleted mid-session

**User Role:** Member + Admin
**Steps:**
1. Apply a tag filter, then have the Admin delete that tag, then re-run the query.

**Expected Result:**
- A clear message that the filter value no longer exists, or an empty result. Not a 500.

---

### TC-TAG-014: Saved query referencing a deleted tag

**User Role:** Member + Admin
**Steps:**
1. Save a query filtered on a tag, delete the tag, reopen the saved query.

**Expected Result:**
- Opens with a clear message about the missing filter value. A saved query must not become permanently unopenable.

---

### TC-TAG-015: Tag filter on the global (cross-project) issue list

**User Role:** Member of several projects
**Steps:**
1. From the global Issues page (no project context), filter by a tag used in multiple projects.

**Expected Result:**
- Issues from every project the user can see are returned, and none from projects they cannot.

---

### TC-TAG-016: Very many tags on one issue

**User Role:** Member
**Steps:**
1. Assign 50 tags to one issue and view it in the list with the Tags column applied.

**Expected Result:**
- The row renders without breaking the table layout — wrapping or truncating with an affordance, not overflowing
  horizontally across the page.

---

### TC-TAG-017: Large tag vocabulary in the filter dropdown

**User Role:** Member
**Steps:**
1. With several hundred tags on the instance, open the tag filter dropdown.

**Expected Result:**
- The dropdown is usable — searchable or paginated — and opens within a reasonable time.
- Record load time; an unsearchable list of hundreds of entries is a usability finding.

---

### TC-TAG-018: Tag search via the global search box

**User Role:** Member
**Steps:**
1. Search for a tag name in Redmine's global search.

**Expected Result:**
- Record whether tagged issues are returned. If tags are not searchable, that is a documented limitation to note in
  the features list rather than a defect — the KB claims tags "improve searchability", so any gap belongs in the
  handoff notes.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
