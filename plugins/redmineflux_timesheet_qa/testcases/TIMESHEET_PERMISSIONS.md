# Test Cases — Redmineflux Timesheet — Permissions & Access Control

> Source: vendor KB — "Roles and Permissions" (View Timesheet, Manage Timesheet, and the rule that each team member
> must have a role present in the selected approval schema), plus the admin-only areas named throughout the KB.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Timesheet Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_timesheet_qa

## The access model under test

The KB defines only two plugin permissions, but authority in this plugin comes from **three** sources that combine:

| Source | What it governs |
|---|---|
| **View Timesheet** | Viewing your **own** timesheets |
| **Manage Timesheet** | Viewing other users' timesheets in the same project/team context, and reviewing/managing them **where the approval schema rules allow** |
| **The approval schema's level-to-role mapping** | Which specific approval level, if any, this user may act at |
| Redmine administrator | Settings, Teams, Approval Schemas, Reports, Admin Dashboard, Audit Log |

The consequence worth testing deliberately: **holding Manage Timesheet is necessary but not sufficient to approve
anything.** A user with the permission but no matching schema role must be able to *see* timesheets in their
context yet approve *none* of them. Conflating the two — treating Manage Timesheet as "can approve" — is the most
likely defect in this plugin's access model, and it would let any manager approve any team's hours.

## Methodology — mandatory for every case

1. **Positive UI** — the permitted user performs the action through real navigation and it works.
2. **Negative UI** — the denied user sees no control.
3. **Negative endpoint** — the denied user is refused when the request is sent **directly**.

Leg 3 is decisive throughout. Every approval rule in this plugin is enforceable only at the endpoint; a hidden
Approve button proves nothing.

## Test accounts required

- **Admin**
- **Approver L1**, **Approver L2** — Manage Timesheet, roles mapped to levels 1 and 2
- **Manager-no-schema** — holds Manage Timesheet, role **not** present in the schema
- **Submitter** — View Timesheet only
- **No-permission member** — neither plugin permission
- **Non-member** and **Anonymous**

---

## Permissions matrix to establish

| Action | Admin | Approver L1 | Approver L2 | Manager-no-schema | Submitter | No-perm member | Non-member | Anonymous |
|--------|-------|-------------|-------------|-------------------|-----------|----------------|------------|-----------|
| Open the Timesheet module | | | | | | | | |
| View own timesheet | | | | | | | | |
| Log / edit / delete own time | | | | | | | | |
| Submit own timesheet | | | | | | | | |
| Withdraw own submission | | | | | | | | |
| View another user's timesheet | | | | | | | | |
| Edit another user's time entries | | | | | | | | |
| See the Approval Dashboard | | | | | | | | |
| Approve / reject at level 1 | | | | | | | | |
| Approve / reject at level 2 | | | | | | | | |
| Manage teams | | | | | | | | |
| Manage approval schemas | | | | | | | | |
| Change plugin settings | | | | | | | | |
| Run reports / export CSV | | | | | | | | |
| View Admin Dashboard | | | | | | | | |
| View Audit Log | | | | | | | | |

---

## Functional Cases

---

### TC-TMS-052: Admin has full access

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Exercise every row of the matrix.

**Expected Result:**
- All actions succeed, including the admin-only areas.

---

### TC-TMS-053: View Timesheet grants own-timesheet access only

**User Role:** Submitter
**Priority:** High
**Steps:**
1. Confirm their own timesheet is viewable and they can log, edit, submit and withdraw their own time.
2. Confirm the View dropdown offers no other user, team or project.
3. Request another user's timesheet **directly**.

**Expected Result:**
- Own access works; leg 3 refused, with no hours, comments or project names in the response.
- Timesheet data is personal data that people are paid from — a leak here is High severity, not cosmetic.

---

### TC-TMS-054: Manage Timesheet grants visibility, not approval authority

**User Role:** Manager-no-schema
**Priority:** High
**Steps:**
1. Confirm they can view other users' timesheets in their context.
2. Confirm no Approve/Reject control is offered on any pending submission.
3. Send **approve** and **reject** requests directly for a pending timesheet at each level.

**Expected Result:**
- Viewing works; both direct requests are refused at every level.
- **This is the suite's most important case.** The KB ties approval authority to the schema's role mapping, not to
  the permission. If Manage Timesheet alone is accepted at the approval endpoint, then any user holding it can
  approve any timesheet they can see — which defeats the multi-level schema entirely and makes the whole approval
  product ineffective. High severity.

---

### TC-TMS-055: Approval authority is level-specific

**User Role:** Approver L1 and Approver L2
**Priority:** High
**Steps:**
1. Confirm L1 can act at level 1 and L2 at level 2.
2. Send an approve request as **L1 for level 2**, and as **L2 for level 1**.

**Expected Result:**
- Each is refused outside their own level. A single "can approve" check that ignores the level would collapse the
  chain into one step (paired with TC-TMS-088).

---

### TC-TMS-056: A member with no plugin permissions has no access

**User Role:** No-permission member
**Priority:** High
**Steps:**
1. Confirm whether the Timesheet navigation entry appears.
2. Request the timesheet grid, the Approval Dashboard and the report endpoints directly.

**Expected Result:**
- Refused at every leg.

---

### TC-TMS-057: Editing another user's time entries is gated

**User Role:** Approver L1
**Priority:** High
**Steps:**
1. While reviewing a submitted timesheet, attempt to modify the submitter's entries through the UI and directly.

**Expected Result:**
- Record the model precisely. If approvers **can** edit submitted entries, that change must be journaled and
  visible to the submitter.
- **An approver silently altering hours before approving them, with no record, would be a serious integrity
  defect** — the submitter would be attested to figures they never entered.

---

### TC-TMS-058: Cross-context isolation

**User Role:** Approver L1 of team A
**Priority:** High
**Preconditions:** Team B exists with its own schema and pending timesheets.
**Steps:**
1. Confirm team B's submissions are absent from A's approval queue.
2. Send an approve request for a team B timesheet directly.

**Expected Result:**
- Refused. Approval authority is scoped to the approver's own team/project context, not global.

---

### TC-TMS-059: Non-member cannot access a project's timesheets

**User Role:** Non-member
**Priority:** High
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project-scoped timesheet view, the report endpoint and the CSV export directly.

**Expected Result:**
- All refused, with no hours or user names in any response body, including error bodies.

---

### TC-TMS-060: Anonymous has no access

**User Role:** Anonymous (logged out)
**Priority:** High
**Steps:**
1. Request the Timesheet module, the approval endpoint and the report export with no session.

**Expected Result:**
- Redirect to login or 403 for all. An unauthenticated approval endpoint would be Critical.

---

### TC-TMS-061: Admin-only areas are closed to every role

**User Role:** Approver L1, Manager-no-schema, Submitter (each in turn)
**Priority:** High
**Steps:**
1. Confirm Settings, Team, Approval Schema, Admin Dashboard and Audit Log are not offered.
2. Request each URL directly.
3. Send a settings-change, a schema-edit and a **schema-delete** request directly.

**Expected Result:**
- All refused with 403.
- **Schema editing is the crown-jewel target here**: a user who can edit a schema could map level 1 to their own
  role and then approve their own team's timesheets, bypassing every other control in the plugin
  (paired with TC-TMS-122).

---

### TC-TMS-062: Report and export permissions match the view permissions

**User Role:** Non-admin roles
**Priority:** High
**Steps:**
1. For each role, request the report endpoint and then the **CSV export** endpoint for data outside their scope.

**Expected Result:**
- Both refused.
- Check the export separately from the view: permission checks are frequently written against the HTML action and
  omitted on the export, which would hand a team lead a CSV of the entire instance's hours.

---

### TC-TMS-063: Permission revocation takes effect without re-login

**User Role:** Admin + affected approver
**Priority:** High
**Steps:**
1. Remove Manage Timesheet (or the approver's schema role) while they have the Approval Dashboard open with a
   review in progress.
2. Have them submit the approval without logging out.

**Expected Result:**
- Refused. Permissions and schema roles are evaluated per request, not cached in the session.

---

### TC-TMS-064: Closed and archived projects

**User Role:** Submitter and Approver
**Priority:** High
**Steps:**
1. Close a project: attempt to log time, submit and approve, at the UI and the endpoint.
2. Archive it and repeat, and check whether its timesheets still appear in queues and reports.

**Expected Result:**
- Closed projects behave read-only; archived projects are inaccessible, endpoints included.
- **Record what happens to in-flight approvals when a project is archived.** A pending timesheet that becomes
  invisible but still blocks the submitter is an operational dead end.

---

### TC-TMS-065: Users cannot approve their own timesheets under any path

**User Role:** Approver L1 and the final-approver account
**Priority:** High
**Steps:**
1. Each submits their own timesheet and then attempts to approve it via the UI, via a crafted direct request, and
   by any bulk or dashboard action available.

**Expected Result:**
- Refused on every path. Routing follows the documented rules (TC-TMS-091, TC-TMS-092).
- Self-approval is the single most attractive bypass in a timesheet system, so it is worth attacking from every
  available direction rather than testing the obvious button once.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
