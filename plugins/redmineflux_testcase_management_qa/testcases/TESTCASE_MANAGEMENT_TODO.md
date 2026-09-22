# Test Cases — Redmineflux Testcase Management — To-Do & Activity Log

> Source: vendor KB "To-Do Management" and "View activity logs and to-do tracking".
> **Status: authored 2026-09-14, not yet executed.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Project → **TestCases** → **To-Do** sidebar icon; activity is on the dashboard's Activity panel and the
`/testcase_activities` view. To-Do visibility is permission-driven — see `TESTCASE_MANAGEMENT_PERMISSIONS.md`
TC-TCM-204 – 824 for the permission legs; the cases here cover the functional behaviour.

**Precondition:** ≥2 users with execution work assigned across ≥1 run.

---

## Functional Cases — To-Do

---

### TC-TCM-205: To-Do lists work assigned to the current user

**User Role:** QA (assignee)
**Steps:**
1. As Admin, create a run assigning cases to user X.
2. Log in as X; open **To-Do**.

**Expected Result:**
- The assigned cases are listed, identifying the run and the case.

---

### TC-TCM-206: Executing a case updates its To-Do state

**User Role:** QA
**Steps:**
1. From To-Do, note an outstanding item.
2. Execute that case as **Passed**; return to To-Do.

**Expected Result:**
- The item is cleared, or clearly marked as done — an executed case must not still read as outstanding.
- Record the exact behaviour.

---

### TC-TCM-207: Reassigning work moves the To-Do item

**User Role:** QA / Manager
**Steps:**
1. Reassign a run (or a case) from user X to user Y.
2. Check X's and Y's To-Do lists.

**Expected Result:**
- The item leaves X's list and appears in Y's.

---

### TC-TCM-208: To-Do reflects run closure

**User Role:** QA
**Steps:**
1. With outstanding To-Do items on a run, close that run.
2. Reopen the assignee's To-Do.

**Expected Result:**
- Items from the closed run are removed or clearly marked closed — a closed run must not leave actionable items
  that cannot be executed (see `TESTCASE_MANAGEMENT_TEST_RUNS.md` TC-TCM-159).

---

### TC-TCM-209: To-Do is project-scoped

**User Role:** QA assigned work in two projects
**Steps:**
1. Open Project A's To-Do.

**Expected Result:**
- Only Project A's items are listed; Project B's assigned work does not leak in.

---

### TC-TCM-210: To-Do with no assigned work renders cleanly

**User Role:** a user with no assignments
**Steps:**
1. Open **To-Do** as that user.

**Expected Result:**
- An explicit empty state. No blank page and no error.

---

## Functional Cases — Activity Log

---

### TC-TCM-211: Executing a case writes an activity entry

**User Role:** QA
**Steps:**
1. Note the current activity feed.
2. Execute a case as **Failed** with a note and a defect.
3. Reload the activity feed.

**Expected Result:**
- A new entry appears identifying the actor, the test case, the result and the timestamp.

---

### TC-TCM-212: Activity entries attribute the correct user

**User Role:** two QA users
**Steps:**
1. Have users X and Y each execute a different case.
2. Inspect the activity feed.

**Expected Result:**
- Each entry names the user who actually performed it. Misattribution is a defect.

---

### TC-TCM-213: Activity log covers run lifecycle events

**User Role:** QA
**Steps:**
1. Create, edit and close a run; inspect the activity feed after each.

**Expected Result:**
- Behaviour is explicit — either lifecycle events are logged alongside executions, or the log is execution-only.
  Record which, so an absent entry is not later misfiled as a bug.

---

### TC-TCM-214: Activity log respects project scope and permissions

**User Role:** QA member of Project A only
**Steps:**
1. Open Project A's activity view and inspect entries.
2. Request the activity URL for Project B directly (`/testcase_activities?project_id=<B>`).

**Expected Result:**
- Only Project A activity is shown, and the Project B request is refused — not rendered.
- Any Project B entry visible to a non-member is a data-exposure defect (High).

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-205 – 706 | To-Do behaviour | — |
| TC-TCM-211 – 710 | Activity log | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-214 carries the only security-relevant assertion in this suite and must include the direct-URL leg.
