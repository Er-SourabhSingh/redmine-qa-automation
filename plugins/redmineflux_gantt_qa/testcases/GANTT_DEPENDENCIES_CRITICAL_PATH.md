# Test Cases — Redmineflux Gantt Chart — Dependencies & Critical Path

> Source: vendor KB — "How to Manage Dependencies", "How to View the Critical Path",
> Troubleshooting ("If dependency creation fails", "If the critical path does not highlight anything"),
> FAQ Q5 and Q13.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Project → **Flux Gantt**. Dependency creation is a real drag between bar connector handles. The critical path is
toggled in the settings panel via the gear icon on the right of the toolbar.

> Every created relation must be confirmed on the **core Redmine issue page's Related issues section**, not only as
> a drawn line. A line the database does not back, or a relation the chart fails to draw, are both defects.

---

## Functional Cases — Dependencies

---

### TC-GNT-020: Create a dependency between two issues

**User Role:** Member with View Flux Gantt
**Priority:** High
**Steps:**
1. Drag from one issue bar's connector handle to another's.
2. Confirm the relation type if prompted.
3. Reload, then open both issues.

**Expected Result:**
- A dependency line connects the two bars.
- The relation exists on both issues' Related issues sections with the expected type and direction.

---

### TC-GNT-021: Relation direction is correct

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a precedes relation from A to B and inspect both issue pages.

**Expected Result:**
- A precedes B and B follows A — not reversed. A reversed relation silently inverts every schedule dependency and
  would corrupt the critical path calculation, so this is worth checking explicitly rather than assuming.

---

### TC-GNT-022: Remove a dependency

**User Role:** Member
**Priority:** High
**Steps:**
1. Select the dependency line, use the delete/remove action, confirm.
2. Reload and check both issues.

**Expected Result:**
- The line is gone and the relation is removed from both issues.
- Cancelling the confirmation leaves the relation intact.

---

### TC-GNT-023: Dependency line re-renders after a reschedule

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Drag one of the two linked issues to a new date.

**Expected Result:**
- The connecting line follows the bar and remains visually correct. A stale line pointing at the old position is a
  rendering defect.

---

### TC-GNT-024: Cross-project dependency in Global Gantt

**User Role:** Member with View Flux Gantt on **both** projects
**Priority:** Medium
**Steps:**
1. In Global Flux Gantt, link an issue in project A to one in project B.

**Expected Result:**
- The relation is created and appears on both issues.
- The KB states cross-project linking requires edit permission on both projects — this case is the positive half;
  TC-GNT-025 is the negative half.

---

## Negative Cases — Dependency rules

---

### TC-GNT-026: An issue cannot depend on itself

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Attempt to link an issue's bar to itself.

**Expected Result:**
- Refused with a clear message. The KB states this rule explicitly. No self-relation is written.

---

### TC-GNT-027: Parent and child cannot be directly linked

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Attempt to link a parent issue to one of its own subtasks.

**Expected Result:**
- Refused with a clear message, per the KB's stated rule.
- Verify at the endpoint too: send the relation-create request directly. A rule enforced only in the drag
  interaction is trivially bypassed.

---

### TC-GNT-028: Circular dependency

**User Role:** Member
**Priority:** High
**Steps:**
1. Create A precedes B, B precedes C, then attempt C precedes A.

**Expected Result:**
- Refused, matching Redmine's own circular-relation protection.
- If it **is** accepted, the critical path must still degrade gracefully (TC-GNT-033) rather than erroring — but
  acceptance itself would be a defect.

---

### TC-GNT-029: Duplicate relation

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create the same relation between the same two issues twice.

**Expected Result:**
- The second attempt is a no-op or is refused. Not two identical lines and two identical relation records.

---

### TC-GNT-030: Dependency creation without permission

**User Role:** Member whose role lacks View Flux Gantt
**Priority:** High
**Steps:**
1. Confirm no connector handles appear.
2. Send the relation-create request directly.

**Expected Result:**
- No handles, **and** the direct request refused with 403.

---

## Functional Cases — Critical path

---

### TC-GNT-031: Enable Show Critical Path

**User Role:** Member with Manage versions (needed to open the settings panel)
**Priority:** High
**Preconditions:** Several issues each with a start date, a due date and an assigned version, linked with
precedes/follows relations.
**Steps:**
1. Open the settings panel via the gear icon.
2. Enable **Show Critical Path**.

**Expected Result:**
- The zero-slack chain of issues is highlighted on the timeline.
- Parent/summary issues with at least one critical child are also highlighted, as the KB states.
- Dependency lines between two critical issues with no float are highlighted as critical links.

---

### TC-GNT-032: Only qualifying issues are included

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Add to the chain an issue missing a due date, one with no assigned version, and one linked only by a `blocks`
   relation.

**Expected Result:**
- None of the three is treated as part of the critical path. The KB is explicit: only issues with a start date, a
  due date and a version participate, and only **precedes/follows** relations count as scheduling dependencies.
- An issue included on the strength of a `blocks` relation is a calculation defect.

---

### TC-GNT-033: Dependency cycle degrades gracefully

**User Role:** Member
**Priority:** Medium
**Preconditions:** Relation data containing a cycle (create it directly if the UI refuses).
**Steps:**
1. Enable Show Critical Path.

**Expected Result:**
- **No critical path is shown, and no error is raised** — the KB states the chart shows no critical path rather
  than failing. A stack trace, a hung render or an infinite loop here is a High-severity defect.

---

### TC-GNT-025: Critical path is recalculated, not cached

**User Role:** Member
**Priority:** Medium
**Steps:**
1. With the critical path shown, change a date on a critical issue so the chain shifts.
2. Disable and re-enable Show Critical Path.

**Expected Result:**
- The highlighted chain reflects the new dates. The KB states results are not cached and are recalculated each
  time it is enabled, so a stale highlight is a defect against a documented behaviour.

---

### TC-GNT-034: Parent issues are not calculated directly

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Build a chain that includes a parent with subtasks.

**Expected Result:**
- The parent is highlighted because a child is critical, not because it was independently calculated — its dates
  derive from its children, per the KB.

---

### TC-GNT-035: Show Critical Path is absent from Global Gantt

**User Role:** Member
**Priority:** Low
**Steps:**
1. Open Global Flux Gantt and open its settings panel.

**Expected Result:**
- No **Show Critical Path** option is offered. The KB states it is available in the **project** Flux Gantt settings
  panel only.
- If it is present in Global Gantt, record it: either the documentation is wrong or an unsupported feature is
  exposed, and both are worth reporting.

---

### TC-GNT-036: Critical path with no qualifying data

**User Role:** Member
**Priority:** Low
**Steps:**
1. Enable Show Critical Path on a project whose issues have no precedes/follows relations at all.

**Expected Result:**
- Nothing is highlighted and no error is shown. This is the KB's documented "does not highlight anything"
  scenario, and its checklist should be enough to explain the result.

---

### TC-GNT-037: Critical path on a large dependency graph

**User Role:** Member
**Priority:** Low
**Steps:**
1. Enable it on a project with several hundred linked, dated, versioned issues.

**Expected Result:**
- The calculation completes in a reasonable time without freezing the browser.
- Record the wall-clock time. Since the KB states it recalculates on every enable and never caches, a slow CPM
  implementation shows up here and is a legitimate performance finding.

---

### TC-GNT-038: Critical path highlight survives zoom and display-mode changes

**User Role:** Member
**Priority:** Medium
**Steps:**
1. With the critical path shown, switch zoom levels and toggle Work Days / Full Week.

**Expected Result:**
- The same issues remain highlighted and the critical links still connect the right bars at every scale.

---

## Functional Cases — Critical path per release (new, issue #120913)

> Addendum 2026-09-22: TC-GNT-217 through TC-GNT-224 were added for the new-functionality batch shipped per
> production issue #120913 (ztflux, client JUWI GmbH, tracker Feature, status "In QA"). These are the only source
> for this new scope — REQUIREMENTS.md/USER_GUIDE.md do not yet document it.
> **Status: authored 2026-09-22. Not yet executed.**

---

### TC-GNT-217: Critical-path settings offer a new "Per Release" scope alongside "Whole Project"

**User Role:** Member with Manage versions
**Priority:** High
**Steps:**
1. Open the settings panel (gear icon) and locate the critical-path scope option.

**Expected Result:**
- A new scope choice is offered: **Whole Project** (existing behavior) and **Per Release** (new), with **Whole
  Project** remaining the default, per issue #120913 item 7.

---

### TC-GNT-218: "Whole Project" mode behaves exactly as before (regression check)

**User Role:** Member
**Priority:** High
**Preconditions:** Same chained/dated/versioned issue setup as TC-GNT-031.
**Steps:**
1. Confirm the scope is set to **Whole Project**.
2. Enable **Show Critical Path** and compare the highlighted chain against TC-GNT-031's expected result.

**Expected Result:**
- The zero-slack chain, parent-highlighting, and dependency-link highlighting behave identically to the
  pre-#120913 behavior documented in TC-GNT-031 — no regression from adding the new Per Release option.
- This is explicit scenario 10 from issue #120913.

---

### TC-GNT-219: "Per Release" mode computes each release's critical chain against its own finish date

**User Role:** Member with Manage versions
**Priority:** High
**Preconditions:** Three releases (R1, R2, R3), each containing its own chain of dated, versioned,
precedes/follows-linked issues, with no cross-release dependencies for this case.
**Steps:**
1. Set the critical-path scope to **Per Release**.
2. Enable **Show Critical Path**.
3. Inspect the highlighted chain within each of the three releases independently.

**Expected Result:**
- Each release (R1, R2, R3) shows its **own** independent critical chain, computed against that release's own
  finish date rather than the whole project's — per issue #120913 item 7.
- This is explicit scenario 11 from issue #120913.

---

### TC-GNT-220: Cross-release dependencies still constrain scheduling dates in Per Release mode

**User Role:** Member
**Priority:** High
**Preconditions:** An issue in release R2 has a precedes/follows dependency on an issue in release R1 that pushes
R2's issue's earliest possible start date.
**Steps:**
1. With scope set to **Per Release**, change the R1 predecessor issue's dates so it would push the R2 successor's
   dates.
2. Confirm the R2 issue's dates update accordingly.

**Expected Result:**
- The cross-release dependency **still constrains scheduling** — the R1 predecessor still pushes the R2
  successor's dates, exactly as it would in Whole Project mode.
- Only the **slack/float calculation** for "is this issue on the critical path" is confined to each release — do
  **not** treat this as "dependencies are ignored across releases"; they are not, per issue #120913 item 7's
  explicit caution.

---

### TC-GNT-221: Cross-release critical dependency renders a dashed incoming line, a leading-edge marker, and a tooltip naming the predecessor and its release

**User Role:** Member
**Priority:** Medium
**Preconditions:** Scope set to **Per Release**; an issue in release R2 is critical specifically because of a
predecessor issue in a different release, R1 ("R1 - Foundation").
**Steps:**
1. Locate the R2 issue's bar and its incoming dependency line from the R1 predecessor.
2. Hover over the bar's leading-edge marker / the tooltip trigger.

**Expected Result:**
- The incoming dependency line from the R1 predecessor renders **dashed** (versus solid for a same-release
  critical dependency, e.g. as seen within TC-GNT-219's chains).
- The R2 issue's bar shows a marker on its **leading edge**.
- The tooltip names the predecessor issue and its release, in the format issue #120913 gives as an example:
  "Critical — driven by #1234 Identity provider rollout (R1 - Foundation)".
- This is explicit scenario 12 from issue #120913.

---

### TC-GNT-222: Cross-release tooltip still explains criticality when the driving release is collapsed or scrolled out of view

**User Role:** Member
**Priority:** Low
**Preconditions:** Same setup as TC-GNT-221.
**Steps:**
1. Collapse the R1 release row (so the predecessor issue's own bar is not directly visible).
2. Hover the leading-edge marker on the R2 successor issue's bar.
3. Repeat after instead scrolling the timeline's date range so R1's issues are outside the visible window (leave
   R1 expanded).

**Expected Result:**
- In both cases, the tooltip still correctly names the predecessor issue and its release — there is no visible
  line endpoint to follow in either case, so the tooltip must not depend on the predecessor bar being on-screen,
  per issue #120913 item 7 ("This tooltip must work even when the driving release is collapsed or scrolled outside
  the visible date range (no visible line endpoint to follow otherwise)").
- This is explicit scenario 13 from issue #120913.

---

### TC-GNT-223: Switching critical-path mode updates the chart live, without a manual reload

**User Role:** Member with Manage versions
**Priority:** Medium
**Steps:**
1. With **Show Critical Path** enabled and scope set to **Whole Project**, note the highlighted chain.
2. Switch the scope to **Per Release** without reloading the page.

**Expected Result:**
- The chart updates its highlighting immediately to reflect Per Release mode's chains — no manual page reload is
  required.
- This is explicit scenario 14 from issue #120913.

---

### TC-GNT-224: Critical-path scope selection is stored per user

**User Role:** Two members (User A, User B), both with Manage versions
**Priority:** Medium
**Steps:**
1. User A sets the critical-path scope to **Per Release** and reloads.
2. User B opens the same project's Gantt view.

**Expected Result:**
- User A's **Per Release** selection is restored after reload.
- User B's own critical-path scope setting is unaffected by A's choice — stored per user, like the other per-user
  view settings in issue #120913 item 4, per item 7 ("Selected mode stored per user (like item 4)").

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
