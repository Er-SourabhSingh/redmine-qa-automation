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

### TC-GNT-401: Create a dependency between two issues

**User Role:** Member with View Flux Gantt
**Steps:**
1. Drag from one issue bar's connector handle to another's.
2. Confirm the relation type if prompted.
3. Reload, then open both issues.

**Expected Result:**
- A dependency line connects the two bars.
- The relation exists on both issues' Related issues sections with the expected type and direction.

---

### TC-GNT-402: Relation direction is correct

**User Role:** Member
**Steps:**
1. Create a precedes relation from A to B and inspect both issue pages.

**Expected Result:**
- A precedes B and B follows A — not reversed. A reversed relation silently inverts every schedule dependency and
  would corrupt the critical path calculation, so this is worth checking explicitly rather than assuming.

---

### TC-GNT-403: Remove a dependency

**User Role:** Member
**Steps:**
1. Select the dependency line, use the delete/remove action, confirm.
2. Reload and check both issues.

**Expected Result:**
- The line is gone and the relation is removed from both issues.
- Cancelling the confirmation leaves the relation intact.

---

### TC-GNT-404: Dependency line re-renders after a reschedule

**User Role:** Member
**Steps:**
1. Drag one of the two linked issues to a new date.

**Expected Result:**
- The connecting line follows the bar and remains visually correct. A stale line pointing at the old position is a
  rendering defect.

---

### TC-GNT-405: Cross-project dependency in Global Gantt

**User Role:** Member with View Flux Gantt on **both** projects
**Steps:**
1. In Global Flux Gantt, link an issue in project A to one in project B.

**Expected Result:**
- The relation is created and appears on both issues.
- The KB states cross-project linking requires edit permission on both projects — this case is the positive half;
  TC-GNT-414 is the negative half.

---

## Negative Cases — Dependency rules

---

### TC-GNT-406: An issue cannot depend on itself

**User Role:** Member
**Steps:**
1. Attempt to link an issue's bar to itself.

**Expected Result:**
- Refused with a clear message. The KB states this rule explicitly. No self-relation is written.

---

### TC-GNT-407: Parent and child cannot be directly linked

**User Role:** Member
**Steps:**
1. Attempt to link a parent issue to one of its own subtasks.

**Expected Result:**
- Refused with a clear message, per the KB's stated rule.
- Verify at the endpoint too: send the relation-create request directly. A rule enforced only in the drag
  interaction is trivially bypassed.

---

### TC-GNT-408: Circular dependency

**User Role:** Member
**Steps:**
1. Create A precedes B, B precedes C, then attempt C precedes A.

**Expected Result:**
- Refused, matching Redmine's own circular-relation protection.
- If it **is** accepted, the critical path must still degrade gracefully (TC-GNT-413) rather than erroring — but
  acceptance itself would be a defect.

---

### TC-GNT-409: Duplicate relation

**User Role:** Member
**Steps:**
1. Create the same relation between the same two issues twice.

**Expected Result:**
- The second attempt is a no-op or is refused. Not two identical lines and two identical relation records.

---

### TC-GNT-410: Dependency creation without permission

**User Role:** Member whose role lacks View Flux Gantt
**Steps:**
1. Confirm no connector handles appear.
2. Send the relation-create request directly.

**Expected Result:**
- No handles, **and** the direct request refused with 403.

---

## Functional Cases — Critical path

---

### TC-GNT-411: Enable Show Critical Path

**User Role:** Member with Manage versions (needed to open the settings panel)
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

### TC-GNT-412: Only qualifying issues are included

**User Role:** Member
**Steps:**
1. Add to the chain an issue missing a due date, one with no assigned version, and one linked only by a `blocks`
   relation.

**Expected Result:**
- None of the three is treated as part of the critical path. The KB is explicit: only issues with a start date, a
  due date and a version participate, and only **precedes/follows** relations count as scheduling dependencies.
- An issue included on the strength of a `blocks` relation is a calculation defect.

---

### TC-GNT-413: Dependency cycle degrades gracefully

**User Role:** Member
**Preconditions:** Relation data containing a cycle (create it directly if the UI refuses).
**Steps:**
1. Enable Show Critical Path.

**Expected Result:**
- **No critical path is shown, and no error is raised** — the KB states the chart shows no critical path rather
  than failing. A stack trace, a hung render or an infinite loop here is a High-severity defect.

---

### TC-GNT-414: Critical path is recalculated, not cached

**User Role:** Member
**Steps:**
1. With the critical path shown, change a date on a critical issue so the chain shifts.
2. Disable and re-enable Show Critical Path.

**Expected Result:**
- The highlighted chain reflects the new dates. The KB states results are not cached and are recalculated each
  time it is enabled, so a stale highlight is a defect against a documented behaviour.

---

### TC-GNT-415: Parent issues are not calculated directly

**User Role:** Member
**Steps:**
1. Build a chain that includes a parent with subtasks.

**Expected Result:**
- The parent is highlighted because a child is critical, not because it was independently calculated — its dates
  derive from its children, per the KB.

---

### TC-GNT-416: Show Critical Path is absent from Global Gantt

**User Role:** Member
**Steps:**
1. Open Global Flux Gantt and open its settings panel.

**Expected Result:**
- No **Show Critical Path** option is offered. The KB states it is available in the **project** Flux Gantt settings
  panel only.
- If it is present in Global Gantt, record it: either the documentation is wrong or an unsupported feature is
  exposed, and both are worth reporting.

---

### TC-GNT-417: Critical path with no qualifying data

**User Role:** Member
**Steps:**
1. Enable Show Critical Path on a project whose issues have no precedes/follows relations at all.

**Expected Result:**
- Nothing is highlighted and no error is shown. This is the KB's documented "does not highlight anything"
  scenario, and its checklist should be enough to explain the result.

---

### TC-GNT-418: Critical path on a large dependency graph

**User Role:** Member
**Steps:**
1. Enable it on a project with several hundred linked, dated, versioned issues.

**Expected Result:**
- The calculation completes in a reasonable time without freezing the browser.
- Record the wall-clock time. Since the KB states it recalculates on every enable and never caches, a slow CPM
  implementation shows up here and is a legitimate performance finding.

---

### TC-GNT-419: Critical path highlight survives zoom and display-mode changes

**User Role:** Member
**Steps:**
1. With the critical path shown, switch zoom levels and toggle Work Days / Full Week.

**Expected Result:**
- The same issues remain highlighted and the critical links still connect the right bars at every scale.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
