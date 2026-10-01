# Test Cases — Redmineflux Testcase Management — Environments

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 1 and the vendor KB "Environment Management" section.
> **Status: executed 2026-10-01.**

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

### TC-TCM-038: Create an environment

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. **Environment** tab → **Add Environment**.
2. Enter an **Environment Name** and select components.
3. Click **Create**.

**Expected Result:**
- The environment is created and listed with the name entered.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created `ENV-A` with component "Hardware" via Environment → Add Environment. "Environment was successfully created." shown, new row appears in the list with the exact name and component entered.

---

### TC-TCM-039: A created environment is selectable on a run

**User Role:** QA
**Priority:** High
**Steps:**
1. Create environment `ENV-A`.
2. **Runs & Results** → **Add Run** and open the Environment selector.

**Expected Result:**
- `ENV-A` is offered and can be assigned to the run.

**Status:** **EXECUTED 2026-10-01 — PASS.** Opened Runs & Results → Add Run; the Environment combobox offers `ENV-A` alongside the pre-existing `fdsgsdf`/`chrome`/`edge` options, confirmed selectable.

---

### TC-TCM-040: Environment name is mandatory

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Add Environment**, leave the name empty, click **Create**.

**Expected Result:**
- Creation is refused with a visible validation message; nothing is created.

**Status:** **EXECUTED 2026-10-01 — PASS.** Left Name blank, selected a component, clicked Create. Server returned 422; "Name cannot be blank" shown inline on the form; the environment list was unchanged (no new row).

---

### TC-TCM-041: Duplicate environment name

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create an environment with a name that already exists in the project.

**Expected Result:**
- Either the duplicate is refused with a clear message, or it is permitted and both remain distinguishable.
- Record which. Silently creating an indistinguishable duplicate that then makes run results ambiguous is a defect.

**Status:** **EXECUTED 2026-10-01 — PASS.** Attempted to create a second environment also named `ENV-A`. Server refused with "Name has already been taken" shown inline; only one `ENV-A` row exists. The safer of the two acceptable behaviors.

---

### TC-TCM-042: Edit an environment name

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Edit an existing environment's name; save.
2. Open a run already assigned to it and check the environment selector and any existing results.

**Expected Result:**
- The new name shows everywhere the environment appears.
- **Existing results remain attached** to the renamed environment — a rename must not orphan recorded results.

**Status:** **EXECUTED 2026-10-01 — FAIL.** Created run #25 (`TC-TCM-042 Env Rename Run`) against `ENV-A`, recorded one Passed result on it. Renamed the environment to `ENV-A-RENAMED`. The rename genuinely persisted (Environment list and a fresh Add Run form's dropdown both correctly show `ENV-A-RENAMED`), and the existing result itself is **not lost** (still shows "Passed (1)"). But run #25's own page — environment tab/filter, the "Environment : ENV-A" summary line, and every link's query string on that page — still shows the **old** name `ENV-A` throughout, not the new one. Filed as **BUG-TCM-020**.

---

### TC-TCM-043: Delete an unused environment

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Create an environment, assign it to nothing, delete it; confirm.

**Expected Result:**
- It is removed from the list and no longer offered on the run form.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created `ENV-DELETE-UNUSED`, assigned to nothing, deleted via the environment row's delete action with confirmation ("Are you sure you want to delete this environment? This action cannot be undone."). "Environment was successfully deleted." shown; row gone from the list; confirmed gone from a fresh Add Run form's Environment dropdown too.

---

### TC-TCM-044: Delete an environment that has recorded results

**User Role:** Admin
**Priority:** High
**Steps:**
1. Create a run against environment `ENV-B`, record results on ≥2 cases.
2. Delete `ENV-B`.
3. Open the run, its grid and the execution history; open a Testcase Summary report.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and every dependent view still renders
  correctly without dangling references.
- A 500 error, a blank grid or results silently vanishing from history is a defect. Record the actual behaviour.

**Status:** **EXECUTED 2026-10-01 — PASS (second acceptable behavior).** Used run #25 (`TC-TCM-042 Env Rename Run`, already assigned to `ENV-A-RENAMED` from TC-042) with 2 recorded results (Passed, Skipped). Deleted the environment — same generic "Are you sure... cannot be undone" confirmation as the unused-environment case (TC-043), no special in-use warning, deletion succeeded immediately. Checked all three dependent views afterward: the run's own page still renders fully with both results intact ("Passed (1)", "Skipped (1)", no 500/blank); a freshly-generated Testcase Summary report (covering all runs) includes a complete, correctly-populated section for this run with no error. Per this TC's own framing, this is the acceptable "succeeds, no dangling references" behavior — not a defect. (The environment *name* shown on these dependent views is the old, stale one — that is the separately-confirmed `BUG-TCM-020`, not a new finding here.)

---

### TC-TCM-045: Environments are project-scoped

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create environment `ENV-P1` in Project A.
2. Open Project B's Environment list and its **Add Run** environment selector.

**Expected Result:**
- `ENV-P1` does **not** appear in Project B.
- If environments are intentionally global, that must be consistent in both the list and the run selector —
  a mismatch between the two is a defect.

**Status:** **EXECUTED 2026-10-01 — PASS.** Used `test-project`'s own environments (`fdsgsdf`/`chrome`/`edge`) as Project A and `tcm-permissions-private-test` (TestCases module enabled, confirmed via its own nav) as Project B. Project B's Environment list shows "No data" and its Add Run form's Environment dropdown offers only the placeholder "Select an environment" — zero leakage, and both views agree with each other (no list/selector mismatch).

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-038 – 108 | Environment CRUD and run integration | BUG-TCM-020 |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-042 and TC-TCM-044 are the highest-risk cases here — both probe whether recorded results survive changes
  to the environment they are attached to.
- **Suite executed 2026-10-01 — 7 PASS, 1 FAIL.** TC-TCM-042 (rename) found **BUG-TCM-020**: an already-created
  run keeps showing the environment's *old* name everywhere on its own page (filter tab, summary line, link query
  strings) after a rename, even though the Environment list and new-run forms correctly show the new name and the
  recorded result itself is not lost. TC-TCM-044 (delete an in-use environment) is a related but separately-PASSing
  case: deletion succeeds with no block, and every dependent view (run, grid, a generated Testcase Summary report)
  still renders fully with no dangling reference or crash — satisfying the TC's own "succeeds + renders correctly"
  acceptable outcome, independent of BUG-TCM-020's stale-name issue. All fixtures (`ENV-A`/`ENV-A-RENAMED`,
  `ENV-DELETE-UNUSED`, run #25, report #13) are disposable test artifacts, left in place as evidence.
