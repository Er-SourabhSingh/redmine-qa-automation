# Test Cases — Redmineflux Workload — Teams, Members & Skills

> Source: vendor KB — "How to Create a Team", "How to Edit and Delete a Team", "How to Add Members to a Team",
> "How to Manage Member Workload Permissions", "How to Create a Skill", "How to Assign Skills to Users",
> "How to Find Team Members by Skill", FAQ Q1, Q2.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Workload Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_workload_qa

## Navigation methodology

Workloads → **Teams** / **Skills** icons in the plugin sidebar. Do not type URLs.

> **Two teams are required throughout this suite.** The per-team permission flags are the point, and they cannot
> be verified with a single team — a global check and a per-team check look identical until a second team exists.

---

## Functional Cases — Teams

---

### TC-WKL-201: Create a team

**User Role:** User with **Manage teams and skills**
**Steps:**
1. Teams → **New Team** → name + optional description → **Create**.

**Expected Result:**
- The team appears in the Teams list and is selectable when creating a workload.

---

### TC-WKL-202: Create a team without a description

**User Role:** Same
**Steps:**
1. Create a team with a name only.

**Expected Result:**
- Created — the description is documented as optional.

---

### TC-WKL-203: Edit a team

**User Role:** Same
**Steps:**
1. Edit the team's name and description; Save.

**Expected Result:**
- Changes persist and the new name appears everywhere the team is referenced — the Teams list, workload creation,
  workload detail and the dashboard filters.

---

### TC-WKL-204: Delete a team with no workloads

**User Role:** Same
**Steps:**
1. Delete a team that has members but no workloads; confirm.

**Expected Result:**
- The team and its membership records are removed. The **users themselves are untouched** in Redmine.

---

### TC-WKL-205: Delete a team that has workloads

**User Role:** Same
**Steps:**
1. Delete a team with active workloads and allocations; read the confirmation carefully before confirming.

**Expected Result:**
- The consequences are stated **before** the action — the KB warns to review associated workloads first, so the UI
  should say what will happen to them rather than leaving the user to find out.
- Afterwards, the outcome is coherent: either the workloads are removed with the team, or they are blocked/
  retained explicitly. **Workloads left pointing at a deleted team, which then fail to open, would be a real
  defect.**

---

### TC-WKL-206: Bulk delete teams

**User Role:** Same
**Steps:**
1. Select several teams and bulk delete; confirm.

**Expected Result:**
- All selected are deleted; none outside the selection is affected.
- The confirmation names how many will be deleted — bulk deletion with a generic prompt is how the wrong teams get
  destroyed.

---

## Functional Cases — Members

---

### TC-WKL-207: Add members with a Redmine role

**User Role:** User with Manage teams and skills
**Steps:**
1. Open a team → Members → select users → choose a Redmine role → **Add Member**.

**Expected Result:**
- All selected users are added with that role and appear in the Members list.

---

### TC-WKL-208: A user cannot be added twice to the same team

**User Role:** Same
**Steps:**
1. Add a user who is already a member.

**Expected Result:**
- Refused, or a no-op — per FAQ Q1, one membership per user per team.
- Duplicate memberships would double that person's capacity in the team's availability figures, which is a
  quiet arithmetic corruption rather than an obvious error.

---

### TC-WKL-209: A user may belong to multiple teams

**User Role:** Same
**Steps:**
1. Add the same user to teams A and B.

**Expected Result:**
- Both memberships exist independently, per FAQ Q1.

---

### TC-WKL-210: Remove a member

**User Role:** Same
**Steps:**
1. Remove a member who is allocated on an active workload.

**Expected Result:**
- The membership is removed and the consequence for their existing allocations is explicit — reassigned, removed,
  or the removal refused with an explanation.
- **Silently orphaning allocated hours would understate the team's committed work**, which is precisely the number
  the plugin exists to report.

---

### TC-WKL-211: Change a member's Redmine role

**User Role:** Same
**Steps:**
1. Update a member's role and save.

**Expected Result:**
- Persists, and does not disturb their workload allocations or the two permission flags.

---

### TC-WKL-212: The Manage workload flag is per team

**User Role:** Admin to configure, then the affected member
**Steps:**
1. Grant **Manage workload** to a user on **team A only**.
2. As that user, create and edit a workload for team A — expect success.
3. Attempt to create and edit a workload for **team B**, through the UI and by sending the request directly.

**Expected Result:**
- Team A succeeds; team B is refused at **both** legs.
- The KB states plainly that these flags are team-specific (FAQ Q2). **A flag implemented globally would let any
  workload manager re-plan every team's work on the instance** — the single most consequential access defect
  available here, and invisible unless a second team is tested.

---

### TC-WKL-213: The Can approve leave flag is per team

**User Role:** Admin to configure, then the affected member
**Steps:**
1. Grant **Can approve leave** on team A only.
2. Confirm the user can approve a team A member's leave.
3. Confirm no approval controls appear for a team B member's leave, then send the approve and reject requests
   directly.

**Expected Result:**
- Team A succeeds; team B refused at both legs.
- Approving leave changes capacity, so a global flag here would let one team's lead alter another team's plan.

---

## Functional Cases — Skills

---

### TC-WKL-214: Create a skill

**User Role:** User with Manage teams and skills
**Steps:**
1. Skills → **New Skill** → name → **Create**.

**Expected Result:**
- The skill appears in the Skills list.

---

### TC-WKL-215: Edit a skill

**User Role:** Same
**Steps:**
1. Rename a skill that has users assigned.

**Expected Result:**
- The new name is shown and **all user assignments and proficiency levels are preserved**.

---

### TC-WKL-216: Delete a skill

**User Role:** Same
**Steps:**
1. Delete a skill that has users assigned; confirm.

**Expected Result:**
- The skill and its assignments are removed. **The users themselves are untouched.**

---

### TC-WKL-217: Bulk delete skills

**User Role:** Same
**Steps:**
1. Select several skills and bulk delete.

**Expected Result:**
- Exactly the selected skills are removed, with a confirmation that names the count.

---

### TC-WKL-218: Assign users to a skill with a proficiency level

**User Role:** Same
**Steps:**
1. Open a skill → **Add User to Skill** → select users → choose a proficiency level → **Add User**.

**Expected Result:**
- Each user appears on the skill with the chosen proficiency.

---

### TC-WKL-219: Update a user's proficiency

**User Role:** Same
**Steps:**
1. Change an existing assignment's proficiency level from the skill detail page.

**Expected Result:**
- Persists, and is reflected in the find-by-skill results.

---

### TC-WKL-220: Remove a user from a skill

**User Role:** Same
**Steps:**
1. Remove a user's skill assignment.

**Expected Result:**
- Removed from the skill; the user's other skills are unaffected.

---

### TC-WKL-221: Find team members by skill

**User Role:** Workload manager
**Steps:**
1. Skills → **Find Team Members by Skill** → select or search a skill → apply filters.

**Expected Result:**
- Matching users are listed with their proficiency levels, per the KB.
- Every user assigned to that skill appears, and nobody else does.

---

### TC-WKL-222: Find-by-skill with no matches

**User Role:** Workload manager
**Steps:**
1. Search a skill with no users assigned.

**Expected Result:**
- A clean empty state — not an error, and not the full user list.

---

## Negative Cases

---

### TC-WKL-223: Name validation for teams and skills

**User Role:** User with Manage teams and skills
**Steps:**
1. Create teams and skills with: a blank name; whitespace only; a duplicate name; a 500-character name; and a name
   containing a script tag.

**Expected Result:**
- Blank and whitespace-only are rejected. Duplicates are rejected or made distinguishable — two identically named
  teams in a workload-creation dropdown make correct selection impossible.
- Long names are capped or truncated without breaking the list layout.
- **Script content is escaped everywhere it renders** — team and skill names appear on the dashboard, in workload
  emails and in filters. No script executes.

---

### TC-WKL-224: Team and skill management requires the permission

**User Role:** A plain member with no plugin permission
**Steps:**
1. Confirm the Teams and Skills pages are refused (the KB names "access denied" here as expected behaviour).
2. Request their URLs directly.
3. Send team-create, team-**delete**, member-add, flag-change and skill-delete requests directly.

**Expected Result:**
- All refused with 403.
- **The flag-change request is the critical one**: a member able to grant themselves **Manage workload** or
  **Can approve leave** through the endpoint would escalate their own privileges within the plugin, bypassing the
  entire permission model. High severity.

---

### TC-WKL-225: Deleting a Redmine user who is a team member

**User Role:** Admin
**Steps:**
1. Delete (or lock) a Redmine user who is a team member with skills and allocations.
2. Open the team, the skill, and the workload.

**Expected Result:**
- All three pages open without a 500. The orphaned membership and assignment are cleaned up or shown as inactive.
- Capacity figures no longer count the removed user — an ex-employee still contributing hours to a team's
  availability would overstate capacity indefinitely.

---

### TC-WKL-226: Concurrent membership edits

**User Role:** Two users with Manage teams and skills
**Steps:**
1. Both open the same team; A adds a member while B changes another member's flags; both save.

**Expected Result:**
- No lost update. Both changes survive, or the second is refused with a clear stale-state message.
- A whole-form save that overwrites the other user's flag change would silently revoke permissions — hard to
  notice and hard to explain afterwards.

---

### TC-WKL-227: Team membership does not grant Redmine project access

**User Role:** A user added to a workload team but not a member of the related Redmine projects
**Steps:**
1. Confirm what they can see of the workload's issues, and attempt to open one directly.

**Expected Result:**
- Redmine's own project permissions still apply — team membership in this plugin must not become a route to issues
  the user cannot otherwise see.
- If issue subjects appear in the workload view for issues the user cannot open, that is a cross-project
  disclosure worth filing.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
