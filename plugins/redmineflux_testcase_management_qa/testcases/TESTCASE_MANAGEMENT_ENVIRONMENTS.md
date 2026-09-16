# Test Cases — Redmineflux Testcase Management — Environments

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 1 and the vendor KB "Environment Management" section.
> **Status: authored 2026-09-14, not yet executed.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Reach environments via project → **TestCases** → **Environment** sidebar icon. Environments are the axis results
are recorded against, so every change here must be re-verified from a run's environment selector, not just the
environment list.

---

## Functional Cases

---

### TC-TCM-101: Create an environment

**User Role:** QA / Manager
**Steps:**
1. **Environment** tab → **Add Environment**.
2. Enter an **Environment Name** and select components.
3. Click **Create**.

**Expected Result:**
- The environment is created and listed with the name entered.

---

### TC-TCM-102: A created environment is selectable on a run

**User Role:** QA
**Steps:**
1. Create environment `ENV-A`.
2. **Runs & Results** → **Add Run** and open the Environment selector.

**Expected Result:**
- `ENV-A` is offered and can be assigned to the run.

---

### TC-TCM-103: Environment name is mandatory

**User Role:** QA
**Steps:**
1. **Add Environment**, leave the name empty, click **Create**.

**Expected Result:**
- Creation is refused with a visible validation message; nothing is created.

---

### TC-TCM-104: Duplicate environment name

**User Role:** QA
**Steps:**
1. Create an environment with a name that already exists in the project.

**Expected Result:**
- Either the duplicate is refused with a clear message, or it is permitted and both remain distinguishable.
- Record which. Silently creating an indistinguishable duplicate that then makes run results ambiguous is a defect.

---

### TC-TCM-105: Edit an environment name

**User Role:** QA / Manager
**Steps:**
1. Edit an existing environment's name; save.
2. Open a run already assigned to it and check the environment selector and any existing results.

**Expected Result:**
- The new name shows everywhere the environment appears.
- **Existing results remain attached** to the renamed environment — a rename must not orphan recorded results.

---

### TC-TCM-106: Delete an unused environment

**User Role:** Manager / Admin
**Steps:**
1. Create an environment, assign it to nothing, delete it; confirm.

**Expected Result:**
- It is removed from the list and no longer offered on the run form.

---

### TC-TCM-107: Delete an environment that has recorded results

**User Role:** Admin
**Steps:**
1. Create a run against environment `ENV-B`, record results on ≥2 cases.
2. Delete `ENV-B`.
3. Open the run, its grid and the execution history; open a Testcase Summary report.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and every dependent view still renders
  correctly without dangling references.
- A 500 error, a blank grid or results silently vanishing from history is a defect. Record the actual behaviour.

---

### TC-TCM-108: Environments are project-scoped

**User Role:** QA
**Steps:**
1. Create environment `ENV-P1` in Project A.
2. Open Project B's Environment list and its **Add Run** environment selector.

**Expected Result:**
- `ENV-P1` does **not** appear in Project B.
- If environments are intentionally global, that must be consistent in both the list and the run selector —
  a mismatch between the two is a defect.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-101 – 108 | Environment CRUD and run integration | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-105 and TC-TCM-107 are the highest-risk cases here — both probe whether recorded results survive changes
  to the environment they are attached to.
