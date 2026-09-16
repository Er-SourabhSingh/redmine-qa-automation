# Test Cases — Redmineflux Timesheet — Teams & Approval Schemas

> Source: vendor KB — "Managing Teams", "Managing Approval Schemas", "Selecting Approval Schema in Project",
> and the Roles and Permissions rule that every team member must have a role present in the selected schema.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Timesheet Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_timesheet_qa

## Navigation methodology

Timesheet module → **Team** and **Approval Schema** in the left sidebar (admin);
Project → Settings → Timesheet for the project-level schema selector (Project Mode only).

> **The rule that ties this suite together**, stated by the vendor: *"Each team member must have a role that exists
> in the selected approval schema."* A team whose members' roles are not represented in its schema produces
> timesheets that cannot be routed. TC-TMS-514 and TC-TMS-515 exist to find out whether the plugin prevents that
> configuration or lets an admin create it silently.

---

## Functional Cases — Teams

---

### TC-TMS-501: Create a team

**User Role:** Admin
**Steps:**
1. Timesheet → **Team** → **New Team** → enter a name → create.

**Expected Result:**
- The team is created and listed.

---

### TC-TMS-502: Assign an approval schema to a team

**User Role:** Admin
**Steps:**
1. Open the team's details and assign an approval schema.

**Expected Result:**
- The schema is saved and shown on the team, and subsequent submissions from its members follow that schema's
  levels.

---

### TC-TMS-503: Add members and assign roles

**User Role:** Admin
**Steps:**
1. Add several users to the team, each with a role.

**Expected Result:**
- All appear in the team with their assigned roles.
- The roles offered correspond to the roles the schema's levels reference — otherwise the admin is being invited
  to build an unroutable team.

---

### TC-TMS-504: Edit a team name

**User Role:** Admin
**Steps:**
1. Use **Edit** to rename the team.

**Expected Result:**
- The name updates everywhere it appears — the team list, member views, the View dropdown and reports.
- Members and the schema assignment are unaffected.

---

### TC-TMS-505: Update a member's role

**User Role:** Admin
**Steps:**
1. Change a member's role from the team detail edit action.

**Expected Result:**
- The change persists, and the member's routing follows the new role on their **next** submission.
- **Record what happens to their in-flight timesheets** — a role change mid-approval must not strand them
  (paired with TC-TMS-417).

---

### TC-TMS-506: Remove a member from a team

**User Role:** Admin
**Steps:**
1. Remove a member who has historical timesheets and one pending submission.

**Expected Result:**
- The member is removed.
- **Their historical timesheets and approval records survive** — removing someone from a team must never erase the
  record of hours they logged and that were approved. Any loss here is Critical.
- The pending submission has a documented outcome, not an orphaned queue entry.

---

### TC-TMS-507: Delete a team

**User Role:** Admin
**Steps:**
1. Delete a team that has members and historical timesheets; confirm.

**Expected Result:**
- The consequences are stated in the confirmation **before** it happens.
- Historical timesheet and approval data survives. If deletion is refused while data exists, that is also
  acceptable — but it must be explained rather than failing generically.

---

### TC-TMS-508: A user in multiple teams

**User Role:** Admin then Member
**Steps:**
1. Add one user to two teams with different schemas, then have them submit a timesheet.

**Expected Result:**
- The routing is deterministic and explainable. Record which schema applies.
- **Ambiguous routing here is a real defect**: the KB never addresses multi-team membership, and a timesheet that
  lands in two approval chains, or in neither, is an operational failure.

---

### TC-TMS-509: Teams are only meaningful in Team Mode

**User Role:** Admin
**Steps:**
1. In **Project Mode**, check whether team schema assignments have any effect on routing.

**Expected Result:**
- Routing follows the **project's** schema in Project Mode, per the KB.
- Team configuration that silently has no effect should at least be visibly inert rather than appearing active.

---

## Functional Cases — Approval schemas

---

### TC-TMS-510: Create a schema with multiple levels

**User Role:** Admin
**Steps:**
1. **Approval Schema** → **New Schema** → name, description, enabled status → add level 1 and level 2, each
   mapped to a role → Save.

**Expected Result:**
- The schema is created with its levels in order, and is available for assignment to teams and projects.

---

### TC-TMS-511: Single-level schema

**User Role:** Admin then Submitter
**Steps:**
1. Create a one-level schema, assign it, and run a submission through it.

**Expected Result:**
- One approval completes the workflow. The minimum-level rule for withdrawal (TC-TMS-310) applies to that single
  level.

---

### TC-TMS-512: Level order is respected

**User Role:** Admin
**Steps:**
1. Create a three-level schema and run a submission through it end to end.

**Expected Result:**
- Approvals occur strictly in level order 1 → 2 → 3, matching the schema's definition.

---

### TC-TMS-513: Edit a schema

**User Role:** Admin
**Steps:**
1. Change the schema's name, description, and a level's role; save.

**Expected Result:**
- Changes persist and apply to **new** submissions.
- Behaviour for in-flight submissions is covered by TC-TMS-417 and must be coherent.

---

### TC-TMS-514: Enabled / disabled status

**User Role:** Admin
**Steps:**
1. Create a schema with the enabled status off; attempt to assign it to a team and a project.

**Expected Result:**
- A disabled schema is not offered for assignment, or is clearly marked as unavailable. It must not be silently
  assignable and then fail to route submissions.

---

### TC-TMS-515: Lock (deactivate) a schema in use

**User Role:** Admin
**Steps:**
1. Lock a schema that is assigned to a team with pending approvals.

**Expected Result:**
- Existing in-flight approvals can still be completed, and no new submissions are routed through it.
- Locking is the documented alternative to deletion, so it must be the safe operation — stranding pending
  timesheets would defeat its purpose.

---

### TC-TMS-516: Delete an unused schema

**User Role:** Admin
**Steps:**
1. Create a schema, assign it to nothing, and delete it.

**Expected Result:**
- Deleted cleanly.

---

### TC-TMS-517: A schema in use cannot be deleted

**User Role:** Admin
**Steps:**
1. Attempt to delete a schema assigned to a team, then one assigned to a project — through the UI **and** by
   sending the delete request directly.

**Expected Result:**
- Refused at both legs with a message naming what is using it.
- The KB states this protection explicitly. **If the endpoint accepts the delete, every timesheet routed through
  that schema loses its approval chain** — including ones mid-approval. High severity.

---

### TC-TMS-518: A schema with no levels

**User Role:** Admin
**Steps:**
1. Save a schema with no approval levels, then assign it and submit a timesheet against it.

**Expected Result:**
- Either the save is refused, or the routing behaviour is explicit and documented.
- A submission into a level-less schema must not vanish into a state where nobody can approve it and the submitter
  cannot withdraw it.

---

### TC-TMS-519: Team members whose role is absent from the schema

**User Role:** Admin then Member
**Steps:**
1. Deliberately add a member whose role appears in **no** level of the team's schema.
2. Have them submit a timesheet.

**Expected Result:**
- Ideally the configuration is prevented or warned about at assignment time, per the vendor's stated rule.
- If it is allowed, the submission must still route somewhere or be refused with an explanation. **A timesheet
  that enters a queue nobody can see is the exact failure this rule exists to prevent**, and it is worth filing
  if it occurs.

---

## Functional Cases — Project schema selection

---

### TC-TMS-520: The project selector appears only in Project Mode

**User Role:** Admin
**Steps:**
1. In **Project Mode**, open Project → Settings → Timesheet.
2. Switch to **Team Mode** and re-check.

**Expected Result:**
- The Approval Schema selector is present in Project Mode and absent in Team Mode, exactly as the KB states.

---

### TC-TMS-521: Assign a schema to a project

**User Role:** Admin then Submitter
**Steps:**
1. Select a schema in project settings and save; have a project member submit a timesheet.

**Expected Result:**
- The submission follows that project's schema levels and reaches the correct approvers.

---

### TC-TMS-522: Schema selection on project creation

**User Role:** Admin
**Steps:**
1. Create a new project and set the Timesheet approval schema during creation.

**Expected Result:**
- The schema is applied from the start, per the KB's note that it can be set when creating a project.

---

### TC-TMS-523: A project with no schema selected

**User Role:** Submitter
**Steps:**
1. In Project Mode, submit a timesheet in a project with no schema assigned.

**Expected Result:**
- Either submission is refused with a clear explanation, or a documented default applies.
- It must not be accepted into a workflow that does not exist — the submitter would be left with a permanently
  pending timesheet.

---

## Negative Cases

---

### TC-TMS-524: Validation on names

**User Role:** Admin
**Steps:**
1. Create teams and schemas with: blank names; whitespace-only names; duplicate names; 500-character names; and
   names containing a script tag.

**Expected Result:**
- Blank and whitespace-only are rejected. Duplicates are rejected or made distinguishable.
- Long names are capped or truncated without breaking the list layout.
- **Script content is escaped everywhere it renders** — the team and schema names appear in approval dashboards
  and reports seen by managers, so execution there would be a stored-XSS path against privileged users. Critical.

---

### TC-TMS-525: Team and schema management is admin-only

**User Role:** Every non-admin role in turn, including one holding Manage Timesheet
**Steps:**
1. Confirm the Team and Approval Schema sections are not offered.
2. Request their URLs directly.
3. Send team-create, team-delete, schema-create, schema-edit and **schema-delete** requests directly.

**Expected Result:**
- All refused with 403.
- **Manage Timesheet must not confer schema administration.** A user able to edit a schema could insert their own
  role as the sole approval level and then approve their own team's timesheets — a complete bypass of the
  governance model, and the highest-impact permission defect available in this plugin.

---

### TC-TMS-526: Concurrent schema edits

**User Role:** Two admins
**Steps:**
1. Both edit the same schema's levels simultaneously and save.

**Expected Result:**
- No lost update, or a clear stale-state message. The resulting level sequence is coherent — not a schema with
  duplicate or missing level numbers, which would break routing for every team using it.

---

### TC-TMS-527: Deleting a role used by a schema level

**User Role:** Admin
**Steps:**
1. Delete a Redmine role that a schema level maps to, then open the schema and submit a timesheet against it.

**Expected Result:**
- The schema page opens without a 500 and the orphaned level is visible as such.
- Submissions either route past it with an explanation or are refused — not silently stuck at a level mapped to a
  role that no longer exists.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
