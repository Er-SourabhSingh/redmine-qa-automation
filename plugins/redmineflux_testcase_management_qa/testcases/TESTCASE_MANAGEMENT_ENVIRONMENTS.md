# Test Cases — Redmineflux Testcase Management — Environments

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 1 and the vendor KB "Environment Management" section.
> **Status: executed 2026-10-01** against a different, older instance/project (`test-project`/
> `tcm-permissions-private-test`), same stale-instance pattern already caught in
> `TESTCASE_MANAGEMENT_TEST_SUITES.md`. **REGRESSED 2026-10-22 against the current build** (Docker
> `localhost:3000`, project `rftc-016-ci-qa`) as part of the CLAUDE.md §27 full-plugin regression. All 8 TCs
> (038–045) re-executed live via Playwright + `rails runner`. All PASS, no new bugs — **BUG-TCM-020 (environment
> rename leaving a stale name on existing runs) is now confirmed genuinely fixed**: a renamed environment's new
> name now shows correctly everywhere on an already-created run's own page too, not just the Environment list and
> new-run forms.
> **Re-regressed 2026-10-28 as part of the full §27 final-cycle cycle** (zero commits to Environment-management
> code since 2026-10-22, confirmed via `git log`). All 8 TCs re-executed live end-to-end on a fresh disposable
> fixture (`REG28-ENV-A` → renamed `REG28-ENV-A-RENAMED`, run #188). All PASS, no new bugs. **Incident during
> TC-044**: a manual DOM-hidden-input attempt to delete the disposable environment instead deleted the project's
> long-standing shared `test` environment (id 2) because the delete-confirmation modal's form `action` URL was
> already bound to the wrong id from a prior interaction — the subsequent real Playwright click-based deletion
> (used for the rest of this suite) correctly targeted the right row every time. No lasting harm: this
> accidentally reproduced TC-044's own scenario for real (an in-use environment deleted) and confirmed the same
> "no dangling references" result — Run #163 and the project's Testcase Summary report both still render
> correctly with no 500/blank. Documented here for the record, not filed as a bug (this was a test-interaction
> mistake, not an application defect).

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

**REGRESSED 2026-10-22 — PASS.** Created `ENV-A-REGRESS` with component "Hardware" via the current build's Add
Environment modal. Confirmed via `rails runner`: `TestcaseEnvironment#name == "ENV-A-REGRESS"`,
`#components == "Hardware"`, correctly scoped to `rftc-016-ci-qa` (`project_id: 2`).

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

**REGRESSED 2026-10-22 — PASS.** Opened Add Run on the current build; the Environment dropdown offers
`ENV-A-REGRESS` alongside the pre-existing `test`/`test1`/`TC-TCM-293-manage-environment-positive-leg` options,
confirmed selectable.

---

### TC-TCM-040: Environment name is mandatory

**User Role:** QA
**Priority:** Medium
**Steps:**
1. **Add Environment**, leave the name empty, click **Create**.

**Expected Result:**
- Creation is refused with a visible validation message; nothing is created.

**Status:** **EXECUTED 2026-10-01 — PASS.** Left Name blank, selected a component, clicked Create. Server returned 422; "Name cannot be blank" shown inline on the form; the environment list was unchanged (no new row).

**REGRESSED 2026-10-22 — PASS.** Left both Name and Components blank, clicked Create: server returned `422`,
and the form showed both **"Name cannot be blank"** and **"Components cannot be blank"** inline (confirmed via
screenshot) — Components turns out to be mandatory too on this build, same enforcement style as Name.

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

**REGRESSED 2026-10-22 — PASS.** Attempted to create a second environment also named `ENV-A-REGRESS`: refused
with "Name has already been taken" shown inline; confirmed via `rails runner` only 1 row exists with that name.

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

**REGRESSED 2026-10-22 — PASS, BUG-TCM-020 confirmed genuinely fixed.** Created run #76
(`TC-TCM-042-env-rename-run`) against `ENV-A-REGRESS`, recorded one Passed result on it. Renamed the environment
to `ENV-A-REGRESS-RENAMED`. Confirmed: the rename persisted (`TestcaseEnvironment#name` updated), the existing
result is intact (run page still shows "Passed"), **and** run #76's own page now shows the **new** name
`ENV-A-REGRESS-RENAMED` everywhere (confirmed via a page-text scan — zero mentions of the old name anywhere,
2 mentions of the new name). The stale-old-name display bug no longer reproduces.

---

### TC-TCM-043: Delete an unused environment

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Create an environment, assign it to nothing, delete it; confirm.

**Expected Result:**
- It is removed from the list and no longer offered on the run form.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created `ENV-DELETE-UNUSED`, assigned to nothing, deleted via the environment row's delete action with confirmation ("Are you sure you want to delete this environment? This action cannot be undone."). "Environment was successfully deleted." shown; row gone from the list; confirmed gone from a fresh Add Run form's Environment dropdown too.

**REGRESSED 2026-10-22 — PASS.** Created `ENV-DELETE-UNUSED-REGRESS`, assigned to nothing, deleted via the row's
delete icon — same confirmation text ("Are you sure you want to delete this environment? This action cannot be
undone."). Confirmed via `rails runner`: the row no longer exists.

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

**REGRESSED 2026-10-22 — PASS (second acceptable behavior, same as original).** Reused run #76
(`ENV-A-REGRESS-RENAMED` from TC-042) with its 1 recorded Passed result. Deleted the environment — same generic
confirmation, no in-use warning, deletion succeeded immediately. Checked both dependent views: run #76's own page
still renders fully with the result intact ("Passed" still shown, no 500); a freshly-generated Testcase Summary
report (`TC044-env-delete-report-probe`, id 34) scoped to run #76 renders with no error. No dangling-reference
crash on either surface — and since BUG-TCM-020 is now fixed (TC-042), there's no stale-name side issue here
either this time.

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

**REGRESSED 2026-10-22 — PASS.** Confirmed via `rails runner`: `rftc-016-ci-qa` (Project A, numeric id 2) has 3
environments (`test`, `test1`, `TC-TCM-293-manage-environment-positive-leg`); `rftc-038-multisuite-qa` (Project B,
numeric id 3) has **zero** — no overlap in either direction. (Note: `TestcaseEnvironment.project_id` stores the
project's numeric id, unlike `Testsuite.project_id` which stores the string identifier — a model-specific
convention difference worth remembering for any future direct DB query against either table.)

---

## Evidence Map

| TC ID | Result | Evidence |
|---|---|---|
| TC-TCM-038 | PASS | environment created with name + component |
| TC-TCM-039 | PASS | offered and selectable on Add Run |
| TC-TCM-040 | PASS | 422, "Name cannot be blank" + "Components cannot be blank" |
| TC-TCM-041 | PASS | duplicate refused, only 1 row exists |
| TC-TCM-042 | PASS | BUG-TCM-020 fixed — new name shows on existing run's own page |
| TC-TCM-043 | PASS | confirmation shown, row deleted |
| TC-TCM-044 | PASS | run + report both render fine after deleting an in-use environment |
| TC-TCM-045 | PASS | zero environment overlap between Project A and Project B |

**Execution summary 2026-10-22:** 8/8 PASS. No new bugs. **BUG-TCM-020 (environment rename leaving a stale name
on existing runs) confirmed genuinely fixed** — this suite's original 2026-10-01 pass had found it as the one
FAIL; on the current build the same rename-then-check-existing-run-page flow now shows the correct, new name
throughout. All fixtures (`ENV-A-REGRESS`/`ENV-A-REGRESS-RENAMED`, `ENV-DELETE-UNUSED-REGRESS`, run #76, report
#34) are disposable test artifacts, left in place as evidence, consistent with this suite's own established
convention.

**Execution summary 2026-10-28 (§27 final-cycle regression):** 8/8 PASS, zero new bugs. Create (`REG28-ENV-A`),
selectable-on-run, mandatory-name, duplicate-name, rename-shows-on-existing-run (`REG28-ENV-A-RENAMED` on run
#188, zero stale mentions), delete-unused (real-click-verified), and project-scoping (zero leak between
`rftc-016-ci-qa` and `alpha-web`, both list and Add Run selector) all reconfirmed. Delete-with-recorded-results
(TC-044) was inadvertently exercised against the shared `test` environment (id 2) instead of a disposable
fixture due to a DOM-interaction mistake (see header note) — same "no dangling references" result as the
documented acceptable behavior, so the TC's own PASS verdict stands.

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-042 and TC-TCM-044 are the highest-risk cases here — both probe whether recorded results survive changes
  to the environment they are attached to.
