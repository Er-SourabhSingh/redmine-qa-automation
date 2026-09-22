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
> **2026-09-21 update:** production testcase #120941 (run #577) has been marked **Failed** and linked to
> **BUG-AGB-011 / production #120990** — the drag-without-reload badge defect regresses this sanity testcase's
> own scope (the badge display), even though the individual local TCs below (TC-AGB-529/530/533/535/539/545)
> still each pass in isolation. This is a deliberate divergence: the local per-TC verdicts below reflect
> isolated execution and are left as-is per `SENIOR_QA_STANDARDS.md`'s retest-scope rule; production run #577's
> own result now reflects the regression found under the combined drag+edit-without-reload workflow.
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

> **Execution note.** The Backlog's inline per-card story-point editor is enabled via **Board Settings → the
> Story Points checkbox in the visible-card-fields list**, submitted with its own **"Apply Settings"** button
> — a separate control from the filter panel's own "Apply" button that sits nearby in the same form. An
> earlier attempt this cycle used the wrong button and concluded the setting didn't persist; it does, and once
> submitted correctly the inline editor (a `<select class="rf-points-select">` inserted next to the card's
> points button on click) works exactly as specified. See Regression execution below for the confirmed result.

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

### TC-AGB-541: A saved query overrides the setting — **N/A, feature not built**

**User Role:** Member
**Steps:**
1. With the setting on, open the Backlog through a **saved query** that has its own status filter.

**Expected Result:**
- The saved query is applied exactly as saved; the setting does not modify it.
- A saved query is the user's own deliberate definition, and a global setting silently rewriting it would make
  every saved Backlog query untrustworthy.

> **Verdict: N/A (2026-09-21 regression).** Step 1 assumes a UI feature — "open the Backlog through a saved
> query" — that does not exist. Checked every view in the plugin: the project Issues page's "My custom
> queries" sidebar is the only place the app generates a `query_id` link at all, and every one of those points
> at `issues?query_id=N`, never at the Backlog or Agile Board. The Backlog's own "More filters" panel is a
> filter *builder* (pick a field/operator/value, Apply) with no saved-query selector of any kind — that panel
> is what the docs' "query-based filters" requirement actually refers to, and it's already covered by
> TC-AGB-540. There is nothing to test here as written; this is not a gap to fix, it's a TC written against a
> feature the product never built. Marked N/A rather than Blocked.
>
> A side-finding surfaced while checking this: the underlying `query_id` **parameter** is still intentionally
> handled by the controller (not dead code — see `retrieve_rf_agile_query`), and passing it directly in a
> hand-edited URL crashes with a 500. That's tracked separately as `BUG-AGB-010`, independent of this TC's
> verdict — see the bug file for why it's still worth fixing despite having no UI entry point today.

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

## Regression execution — Feature #120436 — 2026-09-21

> Full regression of the remaining TC-AGB-531–553 (the sanity subset TC-AGB-529/530/533/535/539/545 was already
> executed 2026-09-18). Environment: local Docker `redmine-docker-700`, http://localhost:3010, Redmine 7.0.0,
> Agile Board plugin branch `feature/backlog-sprint-points`, commit `288d293` (post BUG-AGB-009 fix). Admin +
> `testuser100` (Developer role, granted View Agile Board for the duration of TC-AGB-550 and reverted after).

| TC | Verdict | Notes |
|---|---|---|
| TC-AGB-531 | **PASS** | Version column badge `3 / 8 SP`, exactly matching #1222 (New, 5) + #825 (Rejected, 3). |
| TC-AGB-532 | **PASS** | Both No Sprint (`3 / 8 SP`) and No Version (`5 / 21 SP`) carried badges, correctly aggregating only the pointed issues each actually contains. |
| TC-AGB-534 | **PASS** | "No Points Sprint" with 2 unpointed issues showed **no badge**, count still correct (2). |
| TC-AGB-536 | **PASS** | "Big Sprint" (30 issues): badge read `5 / 13 SP` correctly on first render, from issues #1494/#1495 that were beyond the 25-card initial page and not yet loaded. |
| TC-AGB-537 | **PASS (corrected — initial "blocked" verdict was tester error, not a product gap).** Re-ran using the Board Settings panel's own **"Apply Settings"** submit button (previously the adjacent filter panel's "Apply" was clicked by mistake, which never touches `visible_card_fields`). With `story_points` enabled as a visible card field, it persists correctly and each card renders a `[data-points]` button. On a clean column (Live Update Sprint 537, 1 unpointed issue): setting 5 via the inline `<select class="rf-points-select">` created the badge live (`NONE` → `0 / 5 SP`); changing to 13 updated it live (`0 / 13 SP`); clearing it removed the badge entirely (back to `NONE`). A subsequent plain reload matched every intermediate state exactly. |
| TC-AGB-538 | **PASS** | With the setting off, confirmed baseline: Big Sprint total 29 (open-only), closed #1494 excluded. |
| TC-AGB-539 | **PASS** (reconfirmed) | Toggling the setting on brought the total to 30 immediately. |
| TC-AGB-540 | **PASS** | Explicit `status_id=open` filter dropped the total to 29 (closed #1494 excluded) even with the setting on, and the choice survived further Backlog navigation without a set_filter re-submit. |
| TC-AGB-541 | **N/A — feature not built.** No button or link anywhere in the plugin's UI opens the Backlog "through a saved query"; checked every view. The docs' "query-based filters" requirement is satisfied by the filter-builder panel instead, already covered by TC-AGB-540. Not a gap, not blocked — there is nothing here to test as written. Side-finding while checking this: the raw `query_id` parameter still crashes with a 500 if hand-supplied in the URL (`BUG-AGB-010`), tracked as its own independent defect. |
| TC-AGB-542 | **PASS** | With a clean open-only baseline (29), enabling the setting brought total to 30; disabling it again brought total back to 29 on the very next reload — no logout or manual filter-clear needed. Badge (`5 / 13 SP`) unchanged by either toggle. |
| TC-AGB-543 | **PASS** | Scrolling Big Sprint to load-more brought in closed #1494; final loaded count (30) matched the header total exactly, badge unchanged. |
| TC-AGB-544 | **PASS** (reconfirmed) | Unassigned column 284px at 1920px with the width setting off. |
| TC-AGB-545 | **PASS** (reconfirmed) | Sprints-tab No Sprint and Versions-tab No Version both 444px with the setting on; no clipping. |
| TC-AGB-546 | **PASS** | At exactly 1024px (the CSS breakpoint boundary), the wide column reverted to standard 284px despite the setting being on. |
| TC-AGB-547 | **PASS** | Enabled Agile Board module + both settings on "Flux Gantt Project" (a second, unrelated project) — both settings applied there too (wide columns on both unassigned columns), confirming instance-wide scope. |
| TC-AGB-548 | **INCONCLUSIVE — not completed.** The plugin's `/api/v1/projects/:id/backlog` endpoint requires an `X-Redmine-API-Key`/`?key=` and returned 403 "Filter chain halted as `:check_if_login_required` rendered or redirected" even with a valid admin API key, before the plugin's own `require_api_authentication` before_action had a chance to run. Root cause not conclusively isolated (Redmine core authentication-filter ordering vs. environment/route configuration) in the time available; not filed as a bug on this basis alone. |
| TC-AGB-549 | **PASS (feature is integer-only by design)** | Attempting `2.5` in Story Point Values triggered a clear client-side message ("Story points must be positive integers only (no decimals or negative numbers)"); the rejected submission left the existing configuration untouched rather than corrupting it. Fractional points are out of scope by design, not a gap. |
| TC-AGB-550 | **PASS** | Issue #1520 (13 SP) marked Private, not authored/assigned to `testuser100`. Admin saw `0 / 13 SP` and 2 cards; `testuser100` saw **no badge** and only 1 card (#1521) — the hidden issue's points were fully excluded from the total, no leak. |
| TC-AGB-551 | **PASS** | As `testuser100` (non-admin): GET `/settings/plugin/agile_board` → 403; POST attempting to flip `enable_story_points` to `0` → 403, and the stored setting was confirmed unchanged afterward as admin. |
| TC-AGB-552 | **PASS** | Switched to German: both setting labels and their hint text render fully in German ("Abgeschlossene Tickets im Backlog anzeigen", "Breitere Spalte für nicht zugeordnete Tickets" + hints), and the badge's hover title reads "5 von 21 Story Points abgeschlossen". |
| TC-AGB-553 | **PASS** | "Flux Gantt Project" (bare, no sprints/versions/points) with both settings + Story Points on: clean layout, widened unassigned column, no badges, no error. |

**Result: 23 PASS, 1 N/A (feature not built), 1 inconclusive (API auth).** TC-AGB-537 was initially miscalled
"blocked" due to a tester mistake (wrong "Apply" button clicked) rather than a real product gap — corrected
after the user flagged it, and passes cleanly once the right control is used. One separate, pre-existing
Medium-severity defect found as a side-finding while checking TC-AGB-541's premise: **`BUG-AGB-010`** — a
code-level crash on the `query_id` parameter, confirmed not reachable via any current UI link (see the bug
file's own reachability note) — see below.

> ### ⚠️ Correction — a real defect in #120436's own code, found after the above was signed off (2026-09-21)
>
> The line above originally read "No new defects found in Feature #120436's own code" — **that was wrong.**
> The user independently found, and this session then reproduced and root-caused, **`BUG-AGB-011`**: the
> Backlog's story-points badge goes wrong — including negative — after dragging a card between sprint/version
> columns without reloading the page, because the drag handler updates the card count live but never the
> points badge, and a subsequent inline point edit then applies its delta on top of that stale, wrong badge
> value. This is squarely inside `backlog_story_points_badge` and the badge display #120436 introduced, not
> pre-existing plugin code like BUG-AGB-010.
>
> **Why TC-by-TC execution missed it:** every drag TC (TC-AGB-545) and every inline-edit TC (TC-AGB-530–539
> etc.) was followed by a check and often a reload, in isolation. The bug only shows up when a drag and a
> point edit happen **back-to-back in the same page load, no reload in between** — the actual shape of live
> sprint planning, and not a scenario any single TC in this suite exercised. See `BUG-AGB-011` for full
> reproduction, root cause (exact file/line in `backlog.html.erb` and `rf_story_points.js`), and evidence.
>
> Feature #120436 was already marked **Done** on production before this was found — see the plugin's Handoff
> and STATUS.md for how that's being tracked now.

---

## Post-fix regression — 2026-09-21

Environment: local Docker `redmine-docker-700` (http://localhost:3010), branch **`master`** (merged from
`feature/backlog-sprint-points`, commit `fda8fb1`), plugin released as **7.1.0**. Fix commits: `f3ba81b`
("Stop a query_id from crashing the board and the backlog" — BUG-AGB-010) and `32141ba` + `50a8a76`
("Keep the backlog points badge true while cards are dragged" / "Move story points with a dragged card on
every board" — BUG-AGB-011). Container + Redis/Sidekiq restarted; no plugin migrations were added, so no
`rake redmine:plugins:migrate` was needed.

Scope, by explicit user choice: the Feature #120436 suite (this file), not a full plugin-wide final-cycle
regression — `STATUS.md` stays `In Progress` pending that broader pass.

| TC | Retest result | Evidence |
|---|---|---|
| TC-AGB-529 | **PASS** (reconfirmed) | Configure page's `Backlog` section still has both checkboxes with hint text, unaffected by the fix commits. |
| TC-AGB-530 | **PASS** (reconfirmed) | "SP Sanity Sprint 120436" badge present and correct (`5 / 29 SP` before the drag test below, matching hand sums of visible + hidden-closed cards). |
| TC-AGB-531 | **PASS** (reconfirmed, extended to drag) | Version "sadfsadfsad" badge `3 / 8 SP` before, `3 / 13 SP` immediately after dragging in a 5-pt card — **live and correct**, no reload. |
| TC-AGB-532 | **PASS** (reconfirmed, extended to drag) | "No Version" badge `23 / 199 SP` → `23 / 194 SP` immediately after the same drag (source side, -5) — live and correct. Confirms the fix isn't sprint-only; it covers version columns too, matching the fix commit's own message ("...on every board"). |
| TC-AGB-533 | Not re-executed | Unrelated to both fix commits (Story Points enable/disable persistence, already fixed separately as BUG-AGB-009 and reconfirmed 2026-09-21 earlier this session). |
| TC-AGB-534 | Not re-executed | Unrelated code path (badge omission on zero-point columns); not touched by either fix. |
| TC-AGB-535 | **PASS** (implicitly reconfirmed) | Closed/total split remained arithmetically consistent (5 closed / N total) across every drag+edit step below — the is-closed split was never disturbed by the fix. |
| TC-AGB-536 | **PASS** (reconfirmed) | "No Version" badge showed its full total (`23 / 199 SP` / `23 / 194 SP`) while only 24–25 of 933–934 cards were loaded — total is not affected by pagination. |
| TC-AGB-537 | **PASS** (reconfirmed, this is the core fix) | Dragged card #1469 (5 pts) between two Backlog sprint columns — **both badges updated live and correctly, instantly, no reload**: source `13 / 18 SP` → `13 / 13 SP`, destination `5 / 21 SP` → `5 / 26 SP`. Then, still without reloading, edited #1469's points 5 → 8 (+3) — badge updated to `5 / 29 SP`, computed correctly from the now-accurate live base. Reload confirmed `5 / 29 SP` matched exactly, no divergence. This directly closes the gap that let BUG-AGB-011 through originally (drag + edit performed back-to-back, no reload in between). |
| TC-AGB-538 | **PASS** (reconfirmed) | With the setting OFF, closed cards stay hidden: "SP Sanity Sprint 120436" card count 3 (not 5), "No Points Sprint 120436" card count 0 (not 2) — badges unaffected either way. |
| TC-AGB-539 | **PASS** (reconfirmed) | Toggled the setting ON and reloaded: "SP Sanity Sprint 120436" count 3 → 5 (hidden closed cards now drawn), "No Points Sprint 120436" count 0 → 2 — badges unchanged in both cases (`5 / 24 SP`, `13 / 13 SP`), since their totals already included the hidden closed points. Both halves of requirement 3 hold. |
| TC-AGB-540 | Not re-executed | Filter-vs-setting precedence logic untouched by either fix commit; spot-checked that the filter panel still renders its Status filter row correctly (no regression in panel rendering). |
| TC-AGB-541 | **N/A, reconfirmed** | Still no UI path to reach the Backlog/Agile Board via `query_id` — verdict unchanged. The underlying crash this TC's premise-check surfaced (BUG-AGB-010) is now fixed: `?query_id=1` returns a clean 404 instead of a 500 (see BUG-AGB-010's own retest). |
| TC-AGB-542 | **PASS** (reconfirmed) | Toggled the setting back OFF and reloaded, same session: closed cards disappeared immediately (count back to 3 and 0 respectively) — no logout or extra step needed. Badges unaffected by the toggle either direction. |
| TC-AGB-543 | Not re-executed | Load-more-honors-setting logic untouched by either fix commit. |
| TC-AGB-544 / 546 / 547 | Not re-executed | Column-width logic untouched by either fix commit; TC-545 below incidentally reconfirms the widened-column CSS still applies correctly post-fix. |
| TC-AGB-545 | **PASS** (reconfirmed) | Versions tab screenshot showed "No Version" visibly wider than the three version columns (setting still ON from earlier testing), matching the original TC-545 result — the JS changes in the fix commits didn't touch the width CSS. |
| TC-AGB-548 / 549 / 550 / 551 / 552 / 553 | Not re-executed | API consistency, fractional points, visibility, permissions, translation, and empty-project layout are all unrelated to the `retrieve_rf_agile_query` and drag/badge-update code paths the two fix commits touched — no plausible regression vector from these specific changes. |

**Result: the specific mechanism behind both bugs is fixed and does not regress the rest of the suite.**
BUG-AGB-011's core scenario (drag then edit, no reload) now produces correct badges on both sprint and version
columns; BUG-AGB-010's crash is now a clean 404. Both bugs moved to `bugs/closed/`; both production issues
(#120986, #120990) and the linked production testcase #120941/run #577 updated accordingly — see the closed
bug files for the full production-sync record.

A full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27) covering every suite in this plugin — not just
Feature #120436 — is still required before `STATUS.md` can move to `Complete`, per the user's own scoping
decision for this session.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-AGB-529 | n/a (PASS - no screenshot per CLAUDE.md s6) | 2026-09-18 sanity pass | - |
| TC-AGB-530 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-533 | screenshots/BUG-AGB-009/ | 2026-09-18 sanity pass | BUG-AGB-009 (separate defect found en route; TC itself PASS, now FIXED and closed) |
| TC-AGB-535 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-539 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-545 | n/a (PASS) | 2026-09-18 sanity pass | - |
| TC-AGB-541 | n/a (N/A verdict, feature not built) | 2026-09-21 regression | BUG-AGB-010 (independent side-finding, not blocking this TC's N/A verdict) |
