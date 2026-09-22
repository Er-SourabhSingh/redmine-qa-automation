# Test Cases — Redmineflux Workload — Permissions & Access Control

> Source: vendor KB — "Roles and Permissions" (the **Manage teams and skills** role permission, the two per-team
> membership flags, and the admin-only areas), plus the Troubleshooting entries that name each of them.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Workload Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_workload_qa

## The access model under test

This plugin uses a **hybrid** model that no other plugin in the Redmineflux set does, and that hybrid is where the
risk concentrates:

| Layer | Grants |
|---|---|
| **Manage teams and skills** (Redmine role permission) | Teams and skills CRUD, membership management, assigning Redmine roles, granting the two flags, and managing workloads **for teams where the user has workload access** |
| **Manage workload** (per-team membership flag) | Create and manage workloads **for that one team** |
| **Can approve leave** (per-team membership flag) | Approve/reject leave **for that one team's members** |
| **Administrator** | Dashboard, plugin settings, holiday schemes and holidays, and all teams and workloads |
| Any logged-in user | Workloads for their own teams; their own leave requests |

Two consequences are worth stating plainly, because they drive most of the cases below:

1. **The two flags are per membership, not per user.** The same person legitimately has different rights in
   different teams. A global implementation looks identical to a per-team one until a second team exists — which
   is why every flag case here requires teams A **and** B.
2. **Manage teams and skills is broad but deliberately excludes plugin settings and holiday schemes.** Those stay
   admin-only, because they change capacity arithmetic for the entire instance.

## Methodology — mandatory for every case

1. **Positive UI** — the permitted user performs the action through real navigation and it works.
2. **Negative UI** — the denied user sees no control.
3. **Negative endpoint** — the denied user is refused when the request is sent **directly**.

Leg 3 is decisive. A missing button proves nothing about whether the write is actually blocked.

## Test accounts required

- **Admin**
- **TeamAdmin** — holds *Manage teams and skills*, no per-team flags
- **MgrA** — *Manage workload* on **team A only**
- **ApproverA** — *Can approve leave* on **team A only**
- **PlainA** — a member of team A with neither flag
- **Outsider** — a logged-in user in no team
- **Anonymous**

Without MgrA/ApproverA plus a second team B, TC-WKL-079 and TC-WKL-080 cannot detect the defect they exist for.

---

## Permissions matrix to confirm

| Action | Admin | TeamAdmin | MgrA | ApproverA | PlainA | Outsider | Anonymous |
|--------|-------|-----------|------|-----------|--------|----------|-----------|
| See the Workloads menu | | | | | | | |
| View team A workloads | | | | | | | |
| View team B workloads | | | | | | | |
| Create/edit a team A workload | | | | | | | |
| Create/edit a team B workload | | | | | | | |
| Allocate hours / use the Gantt (team A) | | | | | | | |
| Create/edit/delete teams | | | | | | | |
| Add members / change the two flags | | | | | | | |
| Create/edit/delete skills | | | | | | | |
| Request own leave | | | | | | | |
| Approve leave — team A | | | | | | | |
| Approve leave — team B | | | | | | | |
| Workload Dashboard | | | | | | | |
| Plugin settings / holiday schemes | | | | | | | |

---

## Functional Cases

---

### TC-WKL-077: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix, across both teams.

**Expected Result:**
- All actions succeed, including the Dashboard, settings and holiday schemes.

---

### TC-WKL-078: Manage teams and skills covers teams and skills

**User Role:** TeamAdmin
**Steps:**
1. Create, edit, delete and bulk-delete teams and skills; add and remove members; assign Redmine roles; assign
   skills and proficiency levels.

**Expected Result:**
- All succeed — these are exactly the capabilities the KB lists for this permission.

---

### TC-WKL-079: Manage workload is scoped to one team

**User Role:** MgrA
**Steps:**
1. Create and edit a **team A** workload, and allocate hours — expect success.
2. Confirm no create/edit controls appear for **team B** workloads.
3. Send workload-create, workload-edit, workload-**delete** and allocation requests **directly**, naming team B.

**Expected Result:**
- Team A succeeds; every team B request is refused with 403.
- **This is the suite's most important case.** If the flag is evaluated globally, any single workload manager can
  re-plan and delete every team's workloads on the instance — destroying allocation data that the KB confirms is
  removed with a workload. High severity.

---

### TC-WKL-080: Can approve leave is scoped to one team

**User Role:** ApproverA
**Steps:**
1. Approve a team A member's leave — expect success.
2. Confirm team B requests are absent from the approval queue.
3. Send approve and reject requests **directly** for a team B member's pending leave.

**Expected Result:**
- Team A succeeds; team B refused at both legs.
- Approving leave changes capacity, so a global flag would let one team's approver silently alter another team's
  availability and plan.

---

### TC-WKL-081: A plain team member has read access only

**User Role:** PlainA
**Steps:**
1. Confirm team A's workloads are visible but not editable, and that their own leave can be requested and
   cancelled.
2. Send workload-edit, allocation, Gantt-drag and leave-approve requests **directly**.

**Expected Result:**
- Viewing and own-leave actions work; all four write requests are refused with 403.
- Confirm specifically that they **cannot approve their own leave** — that is the obvious self-serving bypass, and
  it would let anyone remove themselves from capacity planning unilaterally.

---

### TC-WKL-082: The Workloads menu and pages are closed to anonymous users

**User Role:** Anonymous (logged out)
**Steps:**
1. Confirm the Workloads menu is absent.
2. Request the Workloads page, a workload detail URL, the Dashboard and the leave endpoints with no session.

**Expected Result:**
- All refused or redirected to login.
- The KB only says the **menu** is visible to logged-in users. A hidden menu whose URLs still serve data would
  expose team composition, allocations and leave records to the open internet — so leg 2 is what actually matters
  here.

---

### TC-WKL-083: An outsider sees no team data

**User Role:** Outsider
**Steps:**
1. Open the Workloads page.
2. Request a specific workload's detail URL and its data endpoints directly.

**Expected Result:**
- An empty list, and the direct requests refused.
- No team names, member names, issue subjects, capacity figures or leave records in any response body, including
  error bodies.

---

### TC-WKL-084: Admin-only areas are closed to every non-admin

**User Role:** TeamAdmin, MgrA, ApproverA, PlainA (each in turn)
**Steps:**
1. Confirm the Dashboard and Settings icons are not offered.
2. Request the dashboard URL, the settings URL and their data endpoints directly.
3. Send settings-change, holiday-create and **holiday-scheme-activate** requests directly.

**Expected Result:**
- All refused with 403.
- **Scheme activation is the sharpest of these**: it is instance-wide, so a non-admin able to activate a different
  holiday scheme would change available capacity for every team at once — and the change would look like a
  mysterious data error rather than an access breach.
- **TeamAdmin is the key account here**, since *Manage teams and skills* is broad enough that a developer might
  reasonably have let it reach settings.

---

### TC-WKL-085: Granting the flags is itself gated

**User Role:** MgrA and PlainA
**Steps:**
1. Attempt to grant themselves **Manage workload** or **Can approve leave** on team B, through the UI and by
   sending the membership-update request directly.

**Expected Result:**
- Refused at both legs.
- **This is a privilege-escalation check**: if a user can set their own flags, every other permission case in this
  suite becomes moot, because they can simply grant themselves whatever they were denied.

---

### TC-WKL-086: Workload data respects Redmine project visibility

**User Role:** A team member who is **not** a member of the Redmine projects the workload's issues belong to
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Open the workload detail page and the Gantt; note what issue information is shown.
2. Attempt to open one of those issues directly.

**Expected Result:**
- Redmine's own project permissions still apply to the issue itself.
- **Record exactly what the workload view discloses.** If issue subjects from a private project are rendered to a
  user who cannot open them, the workload view is a cross-project disclosure path — plausible here, because the
  plugin's own team membership is a separate concept from project membership.

---

### TC-WKL-087: Leave records are not exposed to other members

**User Role:** PlainA
**Steps:**
1. Inspect what leave information is visible for other team members, in the UI and in the underlying payloads.

**Expected Result:**
- Record precisely what is disclosed. A colleague's **dates of unavailability** are reasonable planning
  information; their **leave type and stated reason** are not, and may be sensitive personal information.
- Reasons or types leaking to ordinary team members is a privacy finding worth filing even though the plugin needs
  the dates to compute capacity.

---

### TC-WKL-088: Permission revocation takes effect without re-login

**User Role:** Admin + MgrA
**Steps:**
1. Remove MgrA's **Manage workload** flag while they have a workload's Gantt open mid-drag.
2. Have them complete the drag and then submit an allocation change, without logging out.

**Expected Result:**
- Both refused and the bar reverts. Permissions and per-team flags are evaluated per request, not cached in the
  page state.

---

### TC-WKL-089: Removal from a team removes access immediately

**User Role:** Admin + MgrA
**Steps:**
1. Remove MgrA from team A entirely while they have the team's workload open.
2. Have them attempt to view and then edit it.

**Expected Result:**
- Access is withdrawn at once, at the endpoint as well as the UI.
- Their historical allocations and approvals remain intact — losing access must not erase the record of work they
  planned (paired with TC-WKL-127).

---

### TC-WKL-090: Closed and archived projects

**User Role:** Workload manager
**Steps:**
1. Archive a project whose issues are allocated in an active workload.
2. Open the workload and the Gantt; attempt to allocate against one of those issues.

**Expected Result:**
- The workload page still renders and the inaccessible issues are handled cleanly rather than causing a 500.
- No new allocation can be made against an archived project's issues, and their subjects are no longer disclosed.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
