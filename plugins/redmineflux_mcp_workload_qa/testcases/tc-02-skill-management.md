# Test Cases — Skill Management — Redmineflux MCP

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_mcp |
| **Module** | Skill Management |
| **TC Range** | TC-RFM-010 to TC-RFM-022 |
| **Total TCs** | 13 |
| **Execution Order** | Suite 2 — Run after Holiday Schema (tc-01) |
| **Feature Coverage** | RFM-F010 through RFM-F022 |

---

## Skill CRUD

---

## TC-RFM-010 — Create skill via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — CRUD |
| **Feature** | RFM-F010 Create skill |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- No skill named "Selenium" exists.

**Test Data:**
- Skill name: Selenium

**Steps:**
1. Call MCP `skill_create` with name = "Selenium".
2. Validate MCP response:
   - Response confirms creation.
   - Response includes skill name "Selenium" and a skill ID.
   - Note the skill ID for subsequent TCs.
3. Using Playwright, navigate to `/rf_skills`.
4. Verify "Selenium" appears in the skills list.

**Expected Result:**
- MCP confirms skill "Selenium" created with an ID.
- Playwright shows "Selenium" in the Skills list.

---

## TC-RFM-011 — Read skill via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — CRUD |
| **Feature** | RFM-F011 Read skill |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Skill "Selenium" exists (from TC-RFM-010).

**Test Data:**
- Skill ID from TC-RFM-010.

**Steps:**
1. Call MCP `skill_show` with the skill ID from TC-RFM-010.
2. Validate MCP response:
   - Response contains skill name "Selenium", skill ID, description (if any), assigned users list.
3. Using Playwright, navigate to `/rf_skills` and click "Selenium".
4. Compare skill detail (name, assigned users) with MCP response.

**Expected Result:**
- MCP returns skill "Selenium" with all fields.
- Playwright skill detail matches MCP response.

---

## TC-RFM-012 — Update skill via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — CRUD |
| **Feature** | RFM-F012 Update skill |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Skill "Selenium" exists (from TC-RFM-010).

**Test Data:**
- Skill ID from TC-RFM-010.
- New description: "Browser automation testing framework"

**Steps:**
1. Call MCP `skill_update` with skill ID and description = "Browser automation testing framework".
2. Validate MCP response:
   - Response confirms description updated.
3. Using Playwright, navigate to `/rf_skills` and click "Selenium".
4. Verify the description shows "Browser automation testing framework".

**Expected Result:**
- MCP confirms description updated for "Selenium".
- Playwright shows the updated description.

---

## TC-RFM-013 — Delete skill via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — CRUD |
| **Feature** | RFM-F013 Delete skill |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- A skill named "Selenium Delete Test" does not exist yet.

**Test Data:**
- Skill to create and delete: "Selenium Delete Test"

**Steps:**
1. Call MCP `skill_create` with name = "Selenium Delete Test". Note the ID.
2. Call MCP `skill_delete` with that skill ID.
3. Validate MCP response:
   - Response confirms deletion.
4. Using Playwright, navigate to `/rf_skills`.
5. Verify "Selenium Delete Test" no longer appears.
6. Call MCP `skill_show` with the deleted ID — expect not-found response.

**Expected Result:**
- MCP confirms deletion.
- Skill no longer appears in Playwright Skills list.
- Subsequent MCP read returns not-found.

---

## Skill User Assignment

---

## TC-RFM-014 — Assign skill to user with Expert level via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — User Assignment |
| **Feature** | RFM-F014 Assign skill to user |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Skill "Selenium" exists (from TC-RFM-010).
- User john.doe (user_id to be looked up) does not have "Selenium" assigned.
- Team "Automation Team" does NOT need to exist yet (assigned at user level, team created in tc-03).

**Test Data:**
- Skill: Selenium (skill ID from TC-RFM-010)
- User: john.doe
- Level: 4 (Expert)
- Team ID: use the Automation Team ID once created in tc-03; for now assign at global level.

**Steps:**
1. Look up john.doe's user ID via MCP `search_users` or known ID.
2. Call MCP `user_skills_update` with team_id for Automation Team (use team_id=25 if Automation Team already exists, otherwise use known user ID) and skills_json = [{"skill_id": <selenium_id>, "level": 4}].
3. Validate MCP response:
   - Response confirms Selenium assigned to john.doe at Expert (level 4).
4. Call MCP `user_skills` to read back john.doe's skills and confirm Expert level.
5. Using Playwright, navigate to `/rf_skills` → Matrix view.
6. Locate john.doe / Selenium cell — verify it shows "Expert".

**Expected Result:**
- MCP confirms john.doe assigned Selenium at Expert level.
- Playwright Skill Matrix shows john.doe with Expert for Selenium.

---

## TC-RFM-015 — Update user skill level via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — User Assignment |
| **Feature** | RFM-F015 Update skill level |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe has Selenium skill at Expert level (from TC-RFM-014).

**Test Data:**
- User: john.doe
- Skill: Selenium
- New level: 2 (Intermediate)

**Steps:**
1. Call MCP `user_skills_update` with john.doe's team/user ID and skills_json = [{"skill_id": <selenium_id>, "level": 2}].
2. Validate MCP response:
   - Response confirms level updated to Intermediate (level 2).
3. Call MCP `user_skills` to confirm level = 2.
4. Using Playwright, navigate to Skill Matrix.
5. Locate john.doe / Selenium — verify cell shows "Intermediate".

**Expected Result:**
- MCP confirms level updated to Intermediate for john.doe / Selenium.
- Playwright Skill Matrix shows Intermediate for john.doe / Selenium.

---

## TC-RFM-016 — Remove skill from user via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — User Assignment |
| **Feature** | RFM-F016 Remove user skill |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- john.doe has Selenium skill assigned (from TC-RFM-015, at Intermediate level).

**Test Data:**
- User: john.doe
- Skill: Selenium (remove it)

**Steps:**
1. Call MCP `user_skills_update` with john.doe and skills_json = [] (empty array removes all skills).
2. Validate MCP response:
   - Response confirms Selenium removed from john.doe.
3. Call MCP `user_skills` to verify john.doe has no skills.
4. Using Playwright, navigate to Skill Matrix.
5. Verify the cell for john.doe / Selenium is empty.

**Expected Result:**
- MCP confirms Selenium removed from john.doe.
- Playwright Skill Matrix shows an empty cell for john.doe / Selenium.

---

## TC-RFM-017 — Assign skill at Beginner level via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — User Assignment |
| **Feature** | RFM-F017 Beginner level assignment |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Skill "Selenium" exists (from TC-RFM-010).
- User mike.smith does not have Selenium assigned.

**Test Data:**
- User: mike.smith
- Skill: Selenium
- Level: 1 (Beginner)

**Steps:**
1. Call MCP `user_skills_update` with mike.smith and skills_json = [{"skill_id": <selenium_id>, "level": 1}].
2. Validate MCP response — confirms Beginner level assigned.
3. Call MCP `user_skills` to confirm level = 1.
4. Using Playwright, navigate to Skill Matrix.
5. Verify cell for mike.smith / Selenium shows "Beginner".

**Expected Result:**
- MCP confirms mike.smith assigned Selenium at Beginner level.
- Playwright Skill Matrix shows "Beginner" for mike.smith / Selenium.

---

## TC-RFM-018 — Assign skill at Expert level via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — User Assignment |
| **Feature** | RFM-F018 Expert level assignment |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Skill "Selenium" exists (from TC-RFM-010).
- User jane.doe does not have Selenium assigned.

**Test Data:**
- User: jane.doe
- Skill: Selenium
- Level: 4 (Expert)

**Steps:**
1. Call MCP `user_skills_update` with jane.doe and skills_json = [{"skill_id": <selenium_id>, "level": 4}].
2. Validate MCP response — confirms Expert level assigned.
3. Call MCP `user_skills` to confirm level = 4.
4. Using Playwright, navigate to Skill Matrix.
5. Verify cell for jane.doe / Selenium shows "Expert".

**Expected Result:**
- MCP confirms jane.doe assigned Selenium at Expert level.
- Playwright Skill Matrix shows "Expert" for jane.doe / Selenium.

---

## Skill Matrix

---

## TC-RFM-019 — View skill matrix via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — Skill Matrix |
| **Feature** | RFM-F019 View skill matrix |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- Selenium skill has assignments: mike.smith = Beginner (TC-RFM-017), jane.doe = Expert (TC-RFM-018).

**Test Data:**
- Use Automation Team (team_id=25 or discovered during TC-RFM-023 in tc-03; if team not yet created, call `team_skills` globally).

**Steps:**
1. Call MCP `team_skills` with Automation Team ID (or global if team not yet created).
2. Validate MCP response:
   - Response contains skill matrix data with user/skill/level rows.
   - mike.smith → Selenium → Beginner, jane.doe → Selenium → Expert.
3. Using Playwright, navigate to `/rf_skills` → Matrix view.
4. Compare matrix data between MCP response and UI.

**Expected Result:**
- MCP returns the full skill matrix data.
- Playwright Skill Matrix shows matching user/skill/level data.

---

## TC-RFM-020 — Filter skill matrix by team via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — Skill Matrix |
| **Feature** | RFM-F020 Filter matrix by team |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- "Automation Team" exists with at least 2 members who have skill assignments.
- Note: "Automation Team" is created in tc-03-team-management.md. If running in isolation, create the team first.

**Test Data:**
- Team: Automation Team

**Steps:**
1. Call MCP `team_skills` with Automation Team ID.
2. Validate MCP response:
   - Returns skill data for only Automation Team members.
   - Users from other teams are not included.
3. Using Playwright, navigate to `/rf_skills` → Matrix view → apply Team filter for "Automation Team".
4. Verify Playwright shows only Automation Team members.
5. Verify user/skill/level data matches the MCP response.

**Expected Result:**
- MCP returns skill matrix filtered to Automation Team members only.
- Playwright filtered matrix matches the MCP response.

---

## TC-RFM-021 — Filter skill matrix by skill level via MCP (Find Team Members)

| Field | Value |
|-------|-------|
| **Module** | Skill Management — Skill Matrix |
| **Feature** | RFM-F021 Find team members by skill level |
| **Priority** | High |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- jane.doe has Selenium at Expert level (TC-RFM-018).
- mike.smith has Selenium at Beginner level (TC-RFM-017).

**Test Data:**
- Skill: Selenium
- Level filter: Expert or Higher

**Steps:**
1. Call MCP `user_skills` for each Automation Team member to confirm Expert level for jane.doe.
2. Using Playwright, navigate to `/rf_skills` → Find Team Members by Skill section.
3. Select Skill = "Selenium", Level = "Expert or Higher". Click Find.
4. Validate UI result:
   - jane.doe appears in the results.
5. Change Level to "Beginner or Higher". Click Find.
6. Validate UI result:
   - Both jane.doe and mike.smith appear.

**Expected Result:**
- Expert or Higher: jane.doe appears.
- Beginner or Higher: both users appear.

---

## TC-RFM-022 — Filter skill matrix by user and skill via MCP

| Field | Value |
|-------|-------|
| **Module** | Skill Management — Skill Matrix |
| **Feature** | RFM-F022 Filter matrix by user and skill |
| **Priority** | Medium |
| **Scenario Type** | Positive |
| **User Role** | Admin |

**Preconditions:**
- jane.doe has Selenium skill assigned at Expert level (from TC-RFM-018).

**Test Data:**
- User: jane.doe
- Skill: Selenium

**Steps:**
1. Call MCP `user_skills` with jane.doe's team + user ID.
2. Validate MCP response:
   - Shows Selenium at Expert level for jane.doe.
3. Using Playwright, navigate to `/rf_skills` → Matrix view.
4. The matrix UI does not have a user filter — verify jane.doe's row shows Expert for Selenium.

**Expected Result:**
- MCP returns jane.doe / Selenium at Expert level.
- Playwright matrix row for jane.doe shows Expert for Selenium.
