# Test Cases — Redmineflux Gantt Chart — Permissions & Access Control

> Source: vendor KB — "Permissions and Access Control" (the only section in this KB set that documents a real
> permission model), plus the Troubleshooting notes that reference permissions.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## What the KB actually says — the model under test

This plugin's permission model is unusual and easy to get wrong, so state it precisely before testing:

| Capability | Gate |
|---|---|
| Open and **interact with** the project chart — including create, update, delete, drag, resize, assign versions and manage relations | **View Flux Gantt** (plugin permission). The KB is explicit that this is *not* read-only despite its name, and that it is the **only** Gantt-specific permission for the project view. |
| Open the Global Flux Gantt view | **View Global Gantt** (plugin permission) |
| Open the **settings panel** and manage **baselines** (create, update, clear selection, delete) | Redmine core **Manage versions** — *not* a Gantt permission, and found outside the Redmineflux Gantt section of the roles list |
| See the chart at all in a project | The **Flux Gantt Chart** project module must be enabled |
| Create a **cross-project** dependency | View Flux Gantt on **both** projects |

The consequence worth testing deliberately: **a role granted View Flux Gantt can mutate issues from the chart.**
If an administrator grants it expecting read-only access — which the name invites — they have granted write access.
Confirm this is what actually happens (TC-GNT-902); it is the plugin's most consequential documented behaviour.

## Methodology — mandatory for every case in this suite

A hidden handle or button is **not** evidence that a write is blocked. The KB itself claims "drag handles and
mutation buttons are hidden for users without the required permission" **and** that "direct API requests enforce
permission checks" — two separate claims. Each case therefore checks three legs:

1. **Positive UI** — the permitted role performs the action through real navigation and it works.
2. **Negative UI** — the denied role sees no control.
3. **Negative endpoint** — the denied role is refused when the request is sent **directly**.

Leg 3 verifies the KB's second claim. Anywhere legs 2 and 3 disagree is the defect.

---

## Permissions matrix to confirm

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Open project Flux Gantt | | | | | | | |
| Create release / issue from the chart | | | | | | | |
| Drag / resize a bar | | | | | | | |
| Inline-edit via the modal | | | | | | | |
| Delete an issue from the modal | | | | | | | |
| Create / remove a dependency | | | | | | | |
| Open the settings panel | | | | | | | |
| Create / delete a baseline | | | | | | | |
| Open Global Flux Gantt | | | | | | | |
| Create a cross-project dependency | | | | | | | |

Fill in from observed behaviour, not from assumption. Record the role's exact permission set alongside each row.

---

## Functional Cases

---

### TC-GNT-901: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin, in both the project and global views.

**Expected Result:**
- All actions succeed.

---

### TC-GNT-902: View Flux Gantt grants write access, not read-only access

**User Role:** A role granted **only** View Flux Gantt (plus basic project access), with no other Gantt permission
**Steps:**
1. Open the project chart.
2. Attempt, in turn: add a release, add an issue, drag a bar, resize a bar, inline-edit and save, delete an issue,
   create a relation, remove a relation.

**Expected Result:**
- All of these succeed, because the KB states this single permission covers creating, updating, deleting, dragging,
  resizing, assigning versions and managing relations.
- **Record this explicitly with evidence.** If an administrator would reasonably read the permission's name as
  read-only, the gap between the name and the behaviour is worth raising as a documentation/UX finding even though
  the plugin is behaving as documented.

---

### TC-GNT-903: Without View Flux Gantt, the chart is inaccessible

**User Role:** Member of the project on a role lacking the permission
**Steps:**
1. Confirm no Flux Gantt entry in the project menu.
2. Request the project chart URL directly.
3. Request the chart's data endpoint directly.
4. Send a date-update request for one of the project's issues to the chart's endpoint.

**Expected Result:**
- All four refused. The KB states such users "cannot view or mutate chart data" — legs 3 and 4 are what actually
  prove it.

---

### TC-GNT-904: Settings panel requires core Manage versions

**User Role:** Member with View Flux Gantt but **without** Manage versions
**Steps:**
1. Confirm the gear icon is absent, or the panel refuses to open.
2. Send a settings-update request directly.

**Expected Result:**
- Refused at both legs. This is the KB's stated boundary and the least intuitive part of the model — a tester who
  assumes the settings panel follows View Flux Gantt will misread the result.

---

### TC-GNT-905: Baseline management requires core Manage versions

**User Role:** Member with View Flux Gantt but **without** Manage versions
**Steps:**
1. Confirm baseline create/update/clear/delete controls are absent.
2. Send each of those four requests directly.

**Expected Result:**
- All refused. Baseline deletion is irreversible, so an unenforced endpoint here would let any charting user
  destroy another team's planning snapshots — High severity.

---

### TC-GNT-906: Granting Manage versions enables settings and baselines without admin rights

**User Role:** Non-admin role granted View Flux Gantt **and** Manage versions
**Steps:**
1. Open the settings panel and create, display and delete a baseline.

**Expected Result:**
- All succeed without admin rights — the KB states this combination explicitly as the intended grant.

---

### TC-GNT-907: View Global Gantt is independent of View Flux Gantt

**User Role:** Test both asymmetric combinations
**Steps:**
1. Role with View Flux Gantt but not View Global Gantt: check the top menu and request `/global_gantt` directly.
2. Role with View Global Gantt but not View Flux Gantt on any project: open the global view.

**Expected Result:**
- Case 1: refused at the menu and at the URL.
- Case 2: record what the global view shows. It must not become a way to read or mutate chart data for projects
  where View Flux Gantt was withheld — that would be a permission-bypass defect.

---

### TC-GNT-908: Module disabled overrides the role permission

**User Role:** Member with View Flux Gantt
**Steps:**
1. Disable the Flux Gantt Chart module on the project.
2. Confirm the menu entry is gone and request the chart URL and its data endpoint directly.

**Expected Result:**
- Refused despite the role holding the permission. The module is a separate gate and must be enforced server-side.

---

### TC-GNT-909: Non-member cannot reach a private project's chart

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project chart URL, its data endpoint, and a mutation endpoint directly.

**Expected Result:**
- All refused. No issue subjects, release names, dates or counts leak in any response body, including error bodies.

---

### TC-GNT-910: Anonymous user has no access

**User Role:** Anonymous (logged out)
**Steps:**
1. Request the project chart, `/global_gantt`, and a mutation endpoint with no session.

**Expected Result:**
- Redirect to login or 403 for all three. An anonymous write path would be Critical.

---

### TC-GNT-911: Cross-project dependency requires the permission on both projects

**User Role:** Member with View Flux Gantt on A but not B
**Steps:**
1. Attempt the link through the Global Gantt UI.
2. Send the relation-create request directly, naming an issue in B.

**Expected Result:**
- Refused at both legs, per the KB's stated rule.

---

### TC-GNT-912: Issue-visibility-scoped roles

**User Role:** Role whose issue visibility is limited to issues created by the user
**Steps:**
1. Open the chart and confirm which issues are drawn.
2. Send a date-update request for an issue created by someone else in the same project.

**Expected Result:**
- Only visible issues are drawn, and the update for another user's issue is refused.
- Visibility-scoped roles are the subtlest tier and the most likely to be missed by a chart that checks only the
  project-level permission. A chart that draws bars for issues the user cannot open is a data leak.

---

### TC-GNT-913: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove View Flux Gantt while the member has the chart open mid-drag.
2. Member completes the drag without logging out.

**Expected Result:**
- The update is refused and the bar reverts. Permissions are evaluated per request, not cached in the page state.

---

### TC-GNT-914: Closed and archived projects

**User Role:** Member with full Gantt permissions
**Steps:**
1. Close a project: attempt to view the chart and to mutate, at the UI and the endpoint.
2. Archive it and repeat.

**Expected Result:**
- Closed projects are viewable but read-only; archived projects are inaccessible entirely — matching Redmine's own
  semantics, enforced at the endpoint as well as the UI.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
