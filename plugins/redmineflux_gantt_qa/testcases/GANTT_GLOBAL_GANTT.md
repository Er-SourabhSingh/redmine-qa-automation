# Test Cases — Redmineflux Gantt Chart — Global Flux Gantt (Cross-Project)

> Source: vendor KB — "How to Use Global Flux Gantt", "How to Search and Filter the Chart" (IssueQuery-based
> filters in Global Gantt), "How to Manage Dependencies" (cross-project links),
> Troubleshooting ("If Global Gantt shows no projects"), FAQ Q2.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Click **Flux Gantt** in the **top** navigation menu (the global view lives at `/global_gantt`). Reach it by
clicking the menu entry, not by typing the URL — except in the negative cases, where the direct URL is the point.

---

## Functional Cases

---

### TC-GNT-701: Global Flux Gantt opens from the top menu

**User Role:** Member with View Global Gantt
**Steps:**
1. Click **Flux Gantt** in the top menu.

**Expected Result:**
- A cross-project timeline loads showing project rows the user can access.

---

### TC-GNT-702: Only accessible projects are shown

**User Role:** Member of projects A and B, not of private project C
**Preconditions:** **Confirm project C is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Enumerate the project rows in Global Flux Gantt.

**Expected Result:**
- A and B appear; C does not. No name, issue subject or issue count from C appears anywhere in the view or in the
  underlying response body.
- A leak here is a High-severity cross-project data exposure.

---

### TC-GNT-703: Only projects with the module enabled are shown

**User Role:** Member
**Steps:**
1. Disable the Flux Gantt Chart module on one of the user's projects and reload the global view.

**Expected Result:**
- That project disappears from Global Gantt. The KB names a disabled module as a cause of "Global Gantt shows no
  projects", so the relationship must hold.

---

### TC-GNT-704: Project rows are paginated

**User Role:** Member of many projects
**Steps:**
1. Open Global Gantt with more projects than fit one page and page through them.

**Expected Result:**
- Pagination works and no project is skipped or duplicated across pages.
- The count of distinct projects across all pages equals the number the user can access with the module enabled.

---

### TC-GNT-705: Issues lazy-load per project

**User Role:** Member
**Steps:**
1. Watch the Network tab while expanding one project row.

**Expected Result:**
- Issues for that project are fetched on expand, not on the initial page load, as the KB describes.

---

### TC-GNT-706: Expand and collapse state persists per user

**User Role:** Two members
**Steps:**
1. User A expands two project rows, leaves and returns.
2. User B opens the global view.

**Expected Result:**
- A's state is restored for A; B is unaffected. Global settings are per user, per the KB.

---

### TC-GNT-707: Cross-project issue updates where permissions allow

**User Role:** Member with View Flux Gantt on both A and B
**Steps:**
1. From Global Gantt, drag an issue in A and another in B.
2. Confirm both on their own issue pages.

**Expected Result:**
- Both updates persist. The global view is a working editor, not a read-only roll-up.

---

### TC-GNT-708: Cross-project dependency linking

**User Role:** Member with View Flux Gantt on both projects
**Steps:**
1. Link an issue in A to an issue in B and confirm the relation on both issue pages.

**Expected Result:**
- The relation is created and drawn across the project rows.
- The KB states cross-project dependency creation requires View Flux Gantt on **both** projects — this is the
  positive half of that rule.

---

### TC-GNT-709: IssueQuery-based filters narrow issues globally

**User Role:** Member
**Steps:**
1. Apply an IssueQuery-based filter (e.g. assignee = me, status = open) in Global Gantt.

**Expected Result:**
- Issues across all visible projects are narrowed consistently with the filter.
- Cross-check the result against the same filter on the global issue list — a mismatch means the chart and the
  issue list disagree about the same query, which is a reporting defect.

---

### TC-GNT-710: Global settings are stored per user

**User Role:** Two members
**Steps:**
1. A changes zoom, display fields and colours in the global view; B opens it.

**Expected Result:**
- A's settings persist for A only.

---

### TC-GNT-711: Closed projects follow the plugin setting

**User Role:** Member
**Steps:**
1. With **Show closed projects** off, confirm a closed project is absent; enable it and confirm it appears.

**Expected Result:**
- The behaviour matches the plugin-level setting, and the setting's effect here is the one the KB's troubleshooting
  section points at.

---

### TC-GNT-712: Search works across projects

**User Role:** Member
**Steps:**
1. Search for a keyword matching issues in two different projects.

**Expected Result:**
- Matches from both projects remain visible, each under its own project row.

---

## Negative Cases

---

### TC-GNT-713: Access without View Global Gantt

**User Role:** Member with View Flux Gantt but **not** View Global Gantt
**Steps:**
1. Confirm the top-menu Flux Gantt entry is absent.
2. Request `/global_gantt` **directly**.

**Expected Result:**
- The menu is hidden **and** the direct URL is refused.
- These are two separate permissions in the KB; a user with project access but not global access must be stopped
  at the URL, not merely at the menu. A hidden menu whose URL still serves the global view is a High-severity
  defect, since it aggregates data from every project the user can touch.

---

### TC-GNT-714: Cross-project dependency without permission on both sides

**User Role:** Member with View Flux Gantt on A but not on B
**Steps:**
1. Attempt to link an issue in A to one in B through the UI.
2. Send the relation-create request **directly**, naming an issue in B.

**Expected Result:**
- Refused at both legs. The KB states the requirement plainly; the endpoint must enforce it, since the drag
  interaction alone is trivially bypassed.

---

### TC-GNT-715: Cross-project drag without edit permission on the target project

**User Role:** Member who can view B but not edit issues there
**Steps:**
1. Confirm drag handles are absent on B's issues in the global view.
2. Send the date-update request for a B issue directly.

**Expected Result:**
- No handles, **and** the direct request refused. Aggregating projects into one view must not aggregate permissions.

---

### TC-GNT-716: Global Gantt with no accessible projects

**User Role:** A user who belongs to no project with the module enabled
**Steps:**
1. Open Global Flux Gantt.

**Expected Result:**
- A clean empty state, ideally hinting at the KB's documented causes — not an error and not a blank page.

---

### TC-GNT-717: Show Critical Path is not offered here

**User Role:** Member
**Steps:**
1. Open the global view's settings panel.

**Expected Result:**
- No **Show Critical Path** option. The KB states it is project-Gantt only. (Same check as TC-GNT-416, retained
  here because this is where a tester would look for it.)

---

### TC-GNT-718: Very many projects and issues

**User Role:** Member with access to many projects
**Steps:**
1. Open Global Gantt on an instance with 100+ accessible projects and expand several.

**Expected Result:**
- Pagination and lazy loading keep the view usable. Record the initial load time and the per-expand time.
- A global view that loads every issue of every project at once contradicts the KB's stated design and is a
  performance defect.

---

### TC-GNT-719: Project archived while the global view is open

**User Role:** Member + Admin
**Steps:**
1. Member has Global Gantt open with project A expanded. Admin archives A. Member drags an issue in A.

**Expected Result:**
- The update is refused with a clear message and the bar reverts. No write against an archived project.

---

### TC-GNT-720: Permission revoked while the global view is open

**User Role:** Admin + affected member
**Steps:**
1. Remove View Flux Gantt on project B while the member has the global view open.
2. Member attempts to drag a B issue without reloading.

**Expected Result:**
- Refused. Permissions are evaluated per request, not cached in the page's state.

---

### TC-GNT-721: Global filters do not widen visibility

**User Role:** Member of A and B only
**Steps:**
1. Apply a broad IssueQuery filter (e.g. "all issues") in Global Gantt.

**Expected Result:**
- Results are still restricted to A and B. A filter must never become a path to issues in projects the user cannot
  see — this is the classic way an aggregate view leaks, and it would be High severity.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
