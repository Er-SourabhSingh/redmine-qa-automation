# Test Cases — Redmineflux Agile Board — Backlog, Sprints & Version Planning

> Source: vendor KB — "How to Use the Backlog", "How to Create and Manage Sprints",
> "How to Assign Issues to a Sprint", "How to Use Version Planning in Backlog", FAQ Q5.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Project → **Backlog** tab for planning; Project → **Settings** → **Sprint management** for sprint CRUD.
Do not type URLs. Confirm every sprint assignment on the **issue page's sprint field**, not only by where the card
sits in the Backlog.

---

## Functional Cases — Sprint management

---

### TC-AGB-501: Create a sprint

**User Role:** Member with manage-sprints rights
**Steps:**
1. Project → Settings → **Sprint management** → **New Sprint**.
2. Enter name, description, start date, end date, duration (if used), status and sharing option. Save.

**Expected Result:**
- The sprint is created and listed with all entered values.
- It becomes selectable on the Scrum board and as a Backlog column.

---

### TC-AGB-502: Edit a sprint

**User Role:** Member with manage-sprints rights
**Steps:**
1. Select a sprint, change its name and dates, save.

**Expected Result:**
- Changes persist and are reflected on the Backlog columns and the Scrum board's sprint selector.
- Issues already assigned to it stay assigned — renaming must not detach work.

---

### TC-AGB-503: Delete a sprint

**User Role:** Member with manage-sprints rights
**Steps:**
1. Delete a sprint that has issues assigned; confirm.
2. Open one of those issues.

**Expected Result:**
- The sprint is removed and its issues are left **unassigned but intact**, with the outcome stated in the
  confirmation before it happens.
- Silent loss of issues, or issues left pointing at a deleted sprint so that their page errors, would be Critical.

---

### TC-AGB-504: Cancel a sprint deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The sprint still exists after a reload, with its issues still assigned.

---

### TC-AGB-505: Sprint sharing option behaves as configured

**User Role:** Member
**Steps:**
1. Create a sprint with sharing enabled and check whether it is available in sub-projects or other projects,
   according to the sharing value chosen.

**Expected Result:**
- The sprint appears exactly where its sharing setting says it should, mirroring how Redmine shares versions.
- A shared sprint appearing in a project the user cannot see would be a visibility defect.

---

### TC-AGB-506: Sprint status controls its lifecycle

**User Role:** Member
**Steps:**
1. Set a sprint's status (e.g. open vs closed/completed) and observe the Backlog and Scrum board.

**Expected Result:**
- The status is respected — a closed sprint is not offered as an assignment target, or is clearly marked.
- Record the exact behaviour; the KB lists Status as a field but does not say what it does.

---

## Functional Cases — Backlog view

---

### TC-AGB-507: Backlog opens and shows its columns

**User Role:** Member
**Steps:**
1. Open a project and click **Backlog**.

**Expected Result:**
- Sprint columns, version columns, and a column of issues assigned to neither, per the KB.

---

### TC-AGB-508: Drag an issue into a sprint column

**User Role:** Member with edit rights
**Steps:**
1. Drag an unassigned issue into a sprint column.
2. Reload, then open the issue.

**Expected Result:**
- The issue's sprint field is set and the change is journaled.
- The issue leaves the unassigned column.

---

### TC-AGB-509: Drag an issue into a version column

**User Role:** Member
**Steps:**
1. Drag an issue into a version column; confirm on the issue page.

**Expected Result:**
- The issue's target version is set. Version planning and sprint planning are independent — setting one must not
  clear the other unless that is deliberate and journaled.

---

### TC-AGB-510: Move an issue between sprints

**User Role:** Member
**Steps:**
1. Drag an issue from sprint A's column to sprint B's.

**Expected Result:**
- The sprint changes, with one journal entry recording old and new values.

---

### TC-AGB-511: Remove an issue from a sprint

**User Role:** Member
**Steps:**
1. Drag an issue from a sprint column back to the unassigned column.

**Expected Result:**
- The sprint field is cleared and the change is journaled.

---

### TC-AGB-512: Backlog lazy-loads large datasets

**User Role:** Member
**Steps:**
1. Open the Backlog on a project with several thousand issues and scroll a large column.

**Expected Result:**
- Cards load progressively, as the KB states, without duplicating or skipping issues.
- Record the initial load time; loading every issue at once contradicts the stated design and is a performance
  defect.

---

### TC-AGB-513: Backlog search and filters

**User Role:** Member
**Steps:**
1. Apply the Backlog's search and filters.

**Expected Result:**
- Columns narrow consistently and counts update to match the filtered set.

---

### TC-AGB-514: Backlog card field settings

**User Role:** Member
**Steps:**
1. Change the Backlog's card field settings.

**Expected Result:**
- Cards update accordingly, independently of the Agile Board's own card field selection.

---

## Functional Cases — Assigning issues to sprints by other routes

---

### TC-AGB-515: Assign from the issue edit form

**User Role:** Member
**Steps:**
1. Open an issue → Edit → choose a Sprint → Save.

**Expected Result:**
- The sprint is set and the issue immediately appears in that sprint's Backlog column and on the Scrum board.
- The sprint field offers only sprints valid for this project.

---

### TC-AGB-516: Bulk-assign issues to a sprint

**User Role:** Manager
**Steps:**
1. Select several issues in the issue list and apply a sprint update.

**Expected Result:**
- All selected issues are assigned, each journaled.
- Issues for which the assignment is invalid are reported clearly rather than silently skipped.

---

### TC-AGB-517: Sprint field appears on the issue form only when relevant

**User Role:** Member
**Steps:**
1. Open the issue form in a project **without** the Agile Board module enabled.

**Expected Result:**
- No sprint field, or an inert one. The plugin must not add a mandatory-looking field to projects that do not use
  it.

---

## Negative Cases

---

### TC-AGB-518: Sprint with a blank name

**User Role:** Member
**Steps:**
1. Create a sprint leaving the name empty.

**Expected Result:**
- Rejected with a validation message. An unnamed sprint column is unusable in the Backlog.

---

### TC-AGB-519: Sprint end date before start date

**User Role:** Member
**Steps:**
1. Enter an end date earlier than the start date and save.

**Expected Result:**
- Rejected with a clear message.

---

### TC-AGB-520: Overlapping sprints

**User Role:** Member
**Steps:**
1. Create two sprints with overlapping date ranges.

**Expected Result:**
- Record whether this is allowed. Overlap is legitimate in many teams, so either behaviour is acceptable — but if
  it is refused, the message must say so clearly rather than failing generically.

---

### TC-AGB-521: Duplicate sprint names

**User Role:** Member
**Steps:**
1. Create two sprints with the same name in one project.

**Expected Result:**
- Either rejected, or both distinguishable in the Backlog columns and the sprint selector.
- Two identical, indistinguishable columns is a usability defect — issues get dragged into the wrong one.

---

### TC-AGB-522: Script content in a sprint name or description

**User Role:** Member
**Steps:**
1. Create a sprint whose name and description contain a script tag; view the Backlog and the sprint selector.

**Expected Result:**
- Escaped and rendered literally. **No script executes** — Critical if it does.

---

### TC-AGB-523: Very long sprint name

**User Role:** Member
**Steps:**
1. Create a sprint with a 500-character name.

**Expected Result:**
- Rejected with a stated maximum, or truncated in the column header without breaking the Backlog layout.

---

### TC-AGB-524: Sprint management without permission

**User Role:** Member without manage-sprints rights
**Steps:**
1. Confirm the Sprint management section is absent from Project Settings.
2. Request its URL directly.
3. Send sprint create, update and **delete** requests directly.

**Expected Result:**
- All refused with 403.
- Sprint deletion detaches every assigned issue, so an unenforced delete endpoint would let any member disrupt a
  whole team's planning — High severity.

---

### TC-AGB-525: Backlog drag without edit permission

**User Role:** Member with view-only issue access
**Steps:**
1. Confirm cards are not draggable in the Backlog.
2. Send the sprint-assignment request directly.

**Expected Result:**
- Not draggable **and** the direct request refused.

---

### TC-AGB-526: Concurrent sprint assignment

**User Role:** Two members
**Steps:**
1. Both have the Backlog open. A drags an issue to sprint X; B, without reloading, drags it to sprint Y.

**Expected Result:**
- The second write wins cleanly or is refused with a stale-state message. Both see the same sprint after reload.

---

### TC-AGB-527: Issue moved to a project where the sprint does not apply

**User Role:** Member
**Steps:**
1. Assign an issue to a sprint, then move the issue to a different project where that sprint is not shared.

**Expected Result:**
- The sprint is cleared or the move is refused with an explanation. The issue must not keep a sprint that does not
  exist in its new project — that produces a card that appears in a Backlog the issue no longer belongs to.

---

### TC-AGB-528: Backlog on a project with no sprints and no versions

**User Role:** Member
**Steps:**
1. Open the Backlog on a bare project.

**Expected Result:**
- A clean layout showing only the unassigned column, with a route to create a sprint. Not an error and not a blank
  page.

---

## Feature #120436 - Story Points in the Backlog

> **Source:** production Feature #120436 "Agile Board: Story Points support (Backlog sprint totals,
> Closed/Total display, completed stories visibility, wider Unassigned column)" - target version
> *Agile Board Plugin - Release 7.1.0 [21-09-2026]*, client Innoval S.r.l. (Taiga parity request).
> Implemented on branch `feature/backlog-sprint-points`.
>
> The feature ticket states four requirements:
> 1. Sprint points shown in the Backlog view.
> 2. Points displayed as **Closed Points / Total Points** (Taiga style, e.g. 24/40).
> 3. Completed user stories stay visible in the sprint and their points count towards Closed Points.
> 4. A larger Unassigned Stories column, for backlogs of 30-50 stories.
>
> **New configuration.** Administration -> Plugins -> Redmineflux Agile Board -> **Configure** -> a **Backlog**
> section with two global checkboxes:
> - *Show completed issues in Backlog* - "Keep finished issues visible in their sprint on the Backlog page, so
>   completed work still counts towards the closed story points."
> - *Wider column for unassigned issues* - "Give the "No Sprint" and "No Version" columns extra width on the
>   Backlog page, for projects with a long unplanned backlog."
>
> Both are **global, instance-wide** settings and both default to **off**. The Closed/Total badge additionally
> requires the existing **Enable Story Points** setting to be on.
>
> **Sanity subset** (the smallest set that proves the feature is present and working - run these first, before
> the full regression): **TC-AGB-529, 530, 533, 535, 539, 545**.

> ### Execution status
>
> **Sanity pass executed 2026-09-18** - local Docker Redmine 7 (`redmine-docker-700`, `http://localhost:3010`),
> Redmine 7.0.0, Agile Board plugin 7.0.0 on branch `feature/backlog-sprint-points` (commit `66ae25f`), as Admin,
> Chrome via Playwright MCP, viewport 1920x1080. Production run #577, testcase #120941.
>
> | TC | Verdict | Evidence |
> |---|---|---|
> | TC-AGB-529 | **PASS** | Configure page has a `Backlog` section with exactly the two checkboxes (`settings[backlog_show_closed_issues]`, `settings[backlog_wide_unassigned_column]`), both unchecked on first view, each with its hint text. "Successful update" on save; both still false after reload. |
> | TC-AGB-530 | **PASS** | Sprint "SP Sanity Sprint 120436" = #1530 (New, 8) + #1529 (Resolved, 5) + #1527 (Rejected, 2) + #1526 (New, 3). Hand sums: total 18, closed 2. Badge rendered `2 / 18 SP`, `title="2 of 18 story points closed"`, shown next to the card count, not replacing it. |
> | TC-AGB-533 | **PASS** | With Story Points off: 0 badges on the whole page, card counts unchanged. Re-enabled: badge returns as `2 / 18 SP` - identical figures, no stored data destroyed. **Note:** the off/on cycle this case requires exposed a separate defect in the Story Points *configuration* - see `BUG-AGB-009`. TC-AGB-533's own assertions all hold, so the verdict stands. |
> | TC-AGB-535 | **PASS** | Closing #1526 (3 pts) moved the badge `2 / 18` -> `5 / 18` (+3 exactly, total unchanged); reopening it returned `5 / 18` -> `2 / 18`. The is-closed flag governs, not the name: **Resolved** (5 pts, not flagged closed) is excluded, **Rejected** (2 pts, flagged closed) is counted. Confirmed against Administration > Issue statuses, where only Closed and Rejected carry the flag. |
> | TC-AGB-539 | **PASS** | Enabling *Show completed issues in Backlog*: #1527 (Rejected) becomes visible in its sprint column, header count 3 -> 4 matching the 4 cards drawn, badge holds `2 / 18 SP` with those closed points being #1527's. Both halves of requirement 3 satisfied together. |
> | TC-AGB-545 | **PASS** | At 1920px, No Sprint 284px -> **444px** with `.backlog-column-wide`; sprint column unchanged at 280px. Versions tab: No Version 444px, the three version columns stay 280px each, `scrollWidth == clientWidth` (no overflow/clipping). Drag still works: #1528 dragged out of the widened column into the sprint, count 4 -> 5, persisted across reload. |
>
> **Also confirmed incidentally** (regression-scope cases, not part of the sanity subset):
> TC-AGB-532 (No Version column carries the badge), TC-AGB-534 (No Sprint column holds no pointed issues and
> correctly shows **no** badge rather than `0 / 0 SP`), TC-AGB-538 (setting off - closed #1527 not drawn),
> TC-AGB-544 (setting off - unassigned column same width as the others, 284 vs 280px).
>
> **Defects found in Feature #120436 itself: none.** All four requirements verified present and correct.
>
> **One separate defect found en route: `BUG-AGB-009` (Medium, open).** Toggling Enable Story Points off and on again silently wipes the configured **Story Point Values**, and the issue form then falls back to the built-in default list. It sits in the pre-existing Story Points configuration handling, not in the #120436 Backlog code, and was surfaced by the off/on cycle TC-AGB-533 requires.
>
> **Fixture strengthened later in the same session.** The Checklist plugin's "block issue closing" option had
> initially prevented #1528 from being closed; once it was switched off, #1528 was completed as
> **Closed, 3 SP**, giving a sprint of #1530 (New, 8) + #1529 (Resolved, 5) + #1528 (**Closed**, 3) +
> #1527 (**Rejected**, 2) + #1526 (In Progress, 3). Hand sums: total **21**, closed **5**. The badge rendered
> **`5 / 21 SP`** (title="5 of 21 story points closed") with all 5 cards drawn and the header count reading 5.
> This re-confirms TC-AGB-530, TC-AGB-535 and TC-AGB-539 against **two different closed statuses** (Closed *and*
> Rejected) while Resolved stays excluded - a stronger proof that the closed split follows the is-closed flag.
>
> One behaviour worth recording, not a defect: a sprint column's **card count and its points badge are scoped
> differently** while *Show completed issues in Backlog* is off - the count reflects only the cards drawn
> (open-only), while the badge's total and closed figures cover every issue in the sprint including hidden closed
> ones. That is the only way requirement 2 can work with the setting off, but it does mean count and points can
> look inconsistent on the same header. Flagged for the regression pass.

---

### TC-AGB-529: The two new Backlog settings exist and default to off

**Sanity:** yes
**User Role:** Admin
**Steps:**
1. Administration -> Plugins -> Redmineflux Agile Board -> **Configure**.
2. Locate the **Backlog** section.

**Expected Result:**
- The section exists and contains exactly two checkboxes, *Show completed issues in Backlog* and
  *Wider column for unassigned issues*, each with its explanatory hint text.
- On an instance where neither has been set before, **both are unchecked** - the feature ticket makes these
  opt-in behaviour changes, so an on-by-default checkbox would silently change every existing project's Backlog.
- Saving the page keeps the values; reopening Configure shows what was saved.

---

### TC-AGB-530: A sprint column header shows Closed / Total story points

**Sanity:** yes
**User Role:** Member
**Steps:**
1. Enable **Story Points** in the plugin configuration.
2. On a project with a sprint, put Story Points on several issues in that sprint - some in an open status, some
   in a closed status. Note the two sums by hand.
3. Open the project **Backlog** -> Sprints tab.

**Expected Result:**
- The sprint's column header carries a points badge next to the existing card count, reading
  **`<closed> / <total> SP`** (e.g. `24 / 40 SP`) - requirement 2 of the feature ticket.
- Both figures match the sums calculated by hand in step 2.
- The badge is additional to the card count, not a replacement for it: a sprint's card count and its points are
  different numbers and the header must keep showing both.

---

### TC-AGB-531: A version column header shows Closed / Total story points

**User Role:** Member
**Steps:**
1. With Story Points enabled, put points on issues assigned to a target version and no sprint.
2. Open the Backlog -> **Versions** tab.

**Expected Result:**
- Each version column header carries the same `<closed> / <total> SP` badge, with figures matching the issues
  in that column.
- An issue that has both a sprint and a version is counted in one column only, matching where its card is drawn.
  Counting it in both inflates the plan and is a real reporting defect.

---

### TC-AGB-532: The unassigned column shows Closed / Total story points

**User Role:** Member
**Steps:**
1. With Story Points enabled, put points on issues that have no sprint (Sprints tab) and on issues that have no
   version (Versions tab).
2. Open the Backlog and read the header of the **No Sprint** column and the **No Version** column.

**Expected Result:**
- Both unassigned columns carry the same badge as the sprint and version columns - the feature ticket asks for
  points in the Backlog view, and the unplanned column is the one teams pull from.

---

### TC-AGB-533: No badge when Story Points are disabled

**Sanity:** yes
**User Role:** Admin then Member
**Steps:**
1. With points already set on Backlog issues, **disable** Story Points in the plugin configuration and save.
2. Reload the Backlog.

**Expected Result:**
- No points badge on any column header - sprint, version or unassigned. The card counts are unchanged.
- Re-enabling Story Points brings the badges back with the same figures, i.e. the stored values were not
  destroyed (consistent with TC-AGB-858 / TC-AGB-859).

---

### TC-AGB-534: A column carrying no points shows no badge at all

**User Role:** Member
**Steps:**
1. With Story Points enabled, open a Backlog containing a sprint whose issues all have an empty Story Points
   field.

**Expected Result:**
- That column shows **no badge**, rather than `0 / 0 SP`.
- "No estimate yet" and "estimated at zero" are different planning states; a column of unestimated stories
  reading `0 / 0 SP` would misreport an unplanned sprint as a sized one.
- A column where points exist but none are closed still shows its badge, as `0 / <total> SP`.

---

### TC-AGB-535: Closed Points counts closed statuses only

**Sanity:** yes
**User Role:** Member
**Steps:**
1. In one sprint, record the badge.
2. Move an open issue carrying points into a **closed** status (per Administration -> Issue statuses, "Issue
   closed" ticked) and reload the Backlog.
3. Reopen it and reload again.

**Expected Result:**
- Closed Points rises by exactly that issue's points in step 2 and falls back by the same amount in step 3.
  Total Points does not change in either step.
- The split follows the status's **is-closed flag**, not the status name - a project using a custom closed
  status such as "Delivered" must count towards Closed Points, and a non-closed status named "Done" must not.

---

### TC-AGB-536: Badge totals cover the whole column, not just the loaded cards

**User Role:** Member
**Steps:**
1. Build a sprint with more issues than the Backlog loads initially (so the header shows `n / total` and a
   load-more control appears), with points on issues beyond the first page.
2. Read the badge before scrolling, then load the remaining cards and read it again.

**Expected Result:**
- The badge shows the **full column total from first render** and does not change as more cards load.
- A total that grows while scrolling is a genuine planning defect - sprint capacity decisions are made from
  this number, and the ticket asks for the sprint's total, not the visible portion's.

---

### TC-AGB-537: The badge appears, updates and disappears as points are edited

**User Role:** Member
**Steps:**
1. On a Backlog column with **no** points at all, set Story Points on one card without reloading the page.
2. Change that card's points to a different value.
3. Clear the points from every card in the column.

**Expected Result:**
- Step 1: the badge is created on the spot showing the new value; step 2: it updates; step 3: it is removed.
- In each case the page state matches what a reload produces - the recorded reason for this behaviour is that
  a column with no points carries no badge to update, so a stale-until-reload total is the defect to watch for.

---

### TC-AGB-538: With the setting off, completed stories drop out of the Backlog

**User Role:** Member
**Steps:**
1. Leave *Show completed issues in Backlog* **off**.
2. Close an issue that sits in a sprint and reload the Backlog.

**Expected Result:**
- The card is no longer drawn in the sprint column - the Backlog's existing open-only default is unchanged.
- This is the baseline TC-AGB-539 is measured against; both directions must be checked, because the ticket
  changes behaviour only when the setting is on.

---

### TC-AGB-539: With the setting on, completed stories stay visible and count as Closed Points

**Sanity:** yes
**User Role:** Admin then Member
**Steps:**
1. Enable *Show completed issues in Backlog* and save.
2. Reload the Backlog of a project with closed, pointed issues in a sprint.

**Expected Result:**
- The finished stories are **visible in their sprint column** - requirement 3 of the feature ticket says they
  must not disappear or collapse.
- Their points are included in the column's **Closed Points**, and the card count shown in the header matches
  the number of cards actually drawn.
- A build where the points are counted but the cards are still hidden (or the reverse) satisfies only half the
  requirement and is a defect.

---

### TC-AGB-540: An explicit status filter overrides the setting

**User Role:** Member
**Steps:**
1. With *Show completed issues in Backlog* on, use the Backlog filter panel to apply an explicit **Status**
   filter (e.g. Status = open, or Status = one specific status). Apply.

**Expected Result:**
- The user's own filter wins: the Backlog shows exactly what the filter asks for, and the setting does not
  re-add closed issues on top of it.
- The choice survives further Backlog navigation in the same session - a filter that silently reverts on the
  next page load is a defect.

---

### TC-AGB-541: A saved query overrides the setting

**User Role:** Member
**Steps:**
1. With the setting on, open the Backlog through a **saved query** that has its own status filter.

**Expected Result:**
- The saved query is applied exactly as saved; the setting does not modify it.
- A saved query is the user's own deliberate definition, and a global setting silently rewriting it would make
  every saved Backlog query untrustworthy.

---

### TC-AGB-542: Turning the setting back off restores the open-only Backlog immediately

**User Role:** Admin then Member
**Steps:**
1. With the setting on, load the Backlog (closed stories visible).
2. Turn the setting **off** and save, then reload the Backlog in the same browser session.

**Expected Result:**
- Closed cards disappear again on the very next load, with no logout, no session reset and no filter to clear
  by hand.
- The badge's Closed Points figure is unaffected by the toggle - the setting governs which cards are drawn,
  not how points are summed.

---

### TC-AGB-543: Load-more honours the setting, so counts and cards cannot disagree

**User Role:** Member
**Steps:**
1. With the setting on, open a sprint column large enough to need load-more and containing closed issues
   beyond the first page.
2. Load the remaining cards.

**Expected Result:**
- The later batches include closed issues too, and the number of cards finally drawn equals the header's total
  count.
- A first page that includes closed stories while load-more returns only open ones leaves a column that can
  never finish loading to its stated count - a visible, reproducible inconsistency.

---

### TC-AGB-544: With the width setting off, the unassigned column keeps its standard width

**User Role:** Member
**Steps:**
1. Leave *Wider column for unassigned issues* **off**, open the Backlog on a wide (>1024px) screen and measure
   the No Sprint / No Version column against a sprint column.

**Expected Result:**
- It is the same width as the other columns - the default layout is unchanged for instances that do not opt in.

---

### TC-AGB-545: With the width setting on, the unassigned column is widened

**Sanity:** yes
**User Role:** Admin then Member
**Steps:**
1. Enable *Wider column for unassigned issues*, save, and reload the Backlog on a screen wider than 1024px.
2. Check both the **Sprints** tab (No Sprint column) and the **Versions** tab (No Version column).

**Expected Result:**
- Both unassigned columns are visibly wider than the sprint/version columns - requirement 4, so a 30-50 story
  backlog is easier to work with.
- The remaining columns stay usable: they may narrow or the board may scroll, but no column is squeezed to
  unreadable and no content is clipped.
- Cards still drag correctly into and out of the widened column.

---

### TC-AGB-546: The widened column does not apply on narrow screens

**User Role:** Member
**Steps:**
1. With the setting on, reduce the browser width to 1024px or below and reload the Backlog.

**Expected Result:**
- The unassigned column returns to the standard width - a fixed wide column on a small screen would push every
  other column off-screen, which is worse than the problem the setting solves.

---

### TC-AGB-547: Both settings are instance-wide

**User Role:** Admin then Member
**Steps:**
1. Turn each setting on and open the Backlog of **two different projects**.

**Expected Result:**
- Both projects show the new behaviour - these are global plugin settings with no per-project override.
- Record this explicitly: it means one team enabling completed-story visibility changes every other team's
  Backlog, which is worth stating in the release note even though it is the implemented design.

---

### TC-AGB-548: Story point figures are consistent between the Backlog page and the API

**User Role:** Member
**Steps:**
1. With Story Points enabled, read a column's badge on the Backlog page.
2. Request the same project's backlog through the plugin's API v1 backlog endpoint.

**Expected Result:**
- The response carries a closed and a total story-point figure per column, and they match the badge exactly.
- The API applies the same completed-issues setting as the page, so a client reading the API and a user reading
  the page never see different sprint totals.

---

## Negative Cases - Feature #120436

---

### TC-AGB-549: Fractional story points in the badge

**User Role:** Member
**Steps:**
1. Set a fractional Story Points value (e.g. 2.5) on a Backlog issue, if the configured values allow it, and
   read the column badge.

**Expected Result:**
- Record exactly what the badge prints. A sum that is silently truncated or rounded so that the badge disagrees
  with the sum of the visible card values is a reporting defect - the two numbers are read side by side.

---

### TC-AGB-550: The badge respects issue visibility

**User Role:** A member who cannot see every issue in the project
**Steps:**
1. With points on issues this user may **not** see, open the Backlog as that user.

**Expected Result:**
- The badge counts only the issues this user is permitted to see, consistent with the cards drawn.
- A total that includes hidden issues leaks the existence and size of restricted work and would be a
  High-severity defect.

---

### TC-AGB-551: A non-admin cannot change the two new Backlog settings

**User Role:** Every non-admin role in turn
**Steps:**
1. Request the plugin configuration page directly and attempt to post a change to each new setting.

**Expected Result:**
- Refused with 403, and the stored setting is unchanged afterwards.
- Both settings are instance-wide, so a non-admin able to set them would alter every project's Backlog.

---

### TC-AGB-552: The new settings and the badge label are translated

**User Role:** Admin then Member
**Steps:**
1. Switch the interface to German and re-open the plugin configuration and the Backlog.

**Expected Result:**
- The two setting labels, their hint text, and the badge's hover summary ("<closed> of <total> story points
  closed") are rendered in the selected language, not English.
- The `SP` unit inside the badge may stay as-is; an untranslated **label or hint** is the defect to file.

---

### TC-AGB-553: Backlog with the settings on but no sprints, versions or points

**User Role:** Member
**Steps:**
1. Enable both new settings and Story Points, then open the Backlog of a bare project.

**Expected Result:**
- A clean layout - the unassigned column (widened), no badges, no error and no blank page.
- Extends TC-AGB-528 to cover the new settings; an opt-in setting must not be able to break an empty project.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-AGB-529 | n/a (PASS - no screenshot per CLAUDE.md s6) | 2026-09-18 sanity pass | - |
| TC-AGB-530 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-533 | screenshots/BUG-AGB-009/ | 2026-09-18 sanity pass | BUG-AGB-009 (separate defect found en route; TC itself PASS) |
| TC-AGB-535 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-539 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-545 | n/a (PASS) | 2026-09-18 sanity pass | - |
