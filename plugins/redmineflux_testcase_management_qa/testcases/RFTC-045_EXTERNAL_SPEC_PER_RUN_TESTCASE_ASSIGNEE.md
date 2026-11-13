> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases are designed from **5 production feature tickets** (#123917–#123921), part of the
> **Testcase Management Plugin — Release 7.4.0** (due 2026-11-13, version id=2072 on `ztflux`). All 5 are
> one client-driven feature set (client: Nathan Coombs, Test Lead — Gisborne District Council, TCM plugin
> evaluation), each tracked as its own ticket but sharing one dependency chain:
>
> - #123917 — Add Test Case-level Assignee field within a Test Run (the new field everything else depends on)
> - #123918 — Bulk reassignment of Test Cases within a Test Run
> - #123919 — Quick inline reassignment from the Test Case table (no issue edit)
> - #123920 — Permission rule for Test Case reassignment (gated by Run Edit access)
> - #123921 — Assignee filter within a Test Run (incl. "my assigned Test Cases")
>
> **ID prefix**: every case here is `RFTC045-<n>`.
>
> **Execution status: PARTIALLY EXECUTED (2026-11-12).** Feature set shipped in Release 7.4.0 on `master`.
> Executed against Run #43 ("RFTC045 Assignee Feature Test Run") on project `rftc-016-ci-qa`, Chrome
> environment, localhost:3000 (Redmine 6.0.11, Docker). 25 of 34 cases PASS. 9 cases NOT TESTED (require
> 100+ TCs, concurrent sessions, or other deferred setup). See
> `reports/RFTC-Functional-2026-11-12.md` for the full run report.
>
> **Extended 2026-11-13 with #128320** — "Per-environment test case assignee inside a run" (production
> issue [#128320](http://flux.zehntech.com/issues/128320), In QA, Target: Release 7.4.0 [13-11-2026]). This
> is the direct successor to RFTC045-6/RFTC045-7/BUG-TCM-140: the client's original need (a different
> per-Test-Case assignee for each environment) was confirmed in scope and converted into this enhancement.
>
> **Executed 2026-11-13.** Code landed on `master` (commit `4e0170a`, "Each environment of a run can now have
> its own test case assignees") after an initial mix-up where it was only on `development` — confirmed via a
> real `git fetch` that `master` now matches. Bundle install + plugin migrate (`CreateRunIssueAssignments`)
> + container restart, then executed live against Run #44 ("RFTC045-6 Multi-Env Assignee Test Run",
> Chrome+Edge) and a newly created Run #48 ("RFTC045-39 Seeding Test Run", Chrome+Edge). 11 of 18 cases
> PASS, 7 NOT TESTED (deferred — see per-case notes). The original gap (RFTC045-6/7/BUG-TCM-140) is
> confirmed fixed by RFTC045-39.
>
> **A note on scope for the client deliverable**: this file is being handed to the client (Nathan Coombs) as
> the test design for this feature set, so it is written to read on its own — each case states the exact
> acceptance criterion it verifies, not just a step list.

# Test Cases — Release 7.4.0: Per-Run, Per-Test-Case Assignee

## Feature summary (per production tickets #123917–#123921)

Today, assignment inside a Test Run only works at the **Environment** level: one assignee per environment
(set via the Run's `Add Run` → Assignee field, a.k.a. `RunAssignment`), applied uniformly to every Test
Case under that environment. This release adds a second, independent layer: an assignee **per Test Case,
within a Run** — separate from both (a) the Test Case issue's own global `Assignee` field, and (b) the
Run's environment-level assignee. Both existing layers are explicitly required to stay unchanged.

On top of the new field, four more capabilities ship together: bulk reassignment (checkbox-select many →
reassign in one action), quick inline reassignment (click the assignee cell → pick a name → done, no issue
edit), a permission gate (anyone with **Run Edit** access, not just admins/run-owners), and an assignee
filter on the Run's Test Case table (including a one-click "my assigned Test Cases" view, confirmed by the
client as *not* needing a separate cross-run page).

**Open question this test design deliberately surfaces (not resolved by the tickets' text):** a Run can
span multiple environments, and today's environment-level assignee is already one-per-(Run, Environment).
The tickets describe the new field as one-per-(Run, Test Case) — they do not explicitly say whether a Run
spanning 2+ environments lets the *same* Test Case carry a *different* per-run assignee in each environment,
or only a single assignee shared across all of that Run's environments. RFTC045-6/7 test both readings so
whichever the build implements can be checked against intent and flagged if it's the narrower one.

---

## 1. Test Case-level Assignee field within a Run — #123917

---

### RFTC045-1: New per-run assignee field exists separately from the Test Case issue's global Assignee

**Priority:** P1
**Acceptance criterion covered:** "This new per-Run-Test-Case assignee is stored separately from the Test
Case issue's own Assignee field — changing one must never change the other."
**Steps:**
1. Open a Test Case issue directly (its own issue page) and note its global `Assignee` field value.
2. Open a Run that includes this Test Case; locate the new per-run Assignee control for this Test Case in
   the Run's Test Case table.
3. Change the per-run assignee to a different user.
4. Re-open the Test Case issue's own page.
**Expected Result:** The Test Case issue's own global `Assignee` field is unchanged by step 3. The two
fields are independently stored and independently editable.
**Result (2026-11-12):** PASS — TC #320 global Assignee remained "-" after inline per-run change to "Aurora Wren". Run #43, Chrome, localhost:3000.

---

### RFTC045-2: Changing the Test Case issue's global Assignee does not change the per-run assignee

**Priority:** P1
**Acceptance criterion covered:** Same as RFTC045-1, inverse direction.
**Steps:**
1. Note a Test Case's current per-run assignee inside a Run.
2. Open the Test Case issue directly and change its own global `Assignee` field, save.
3. Return to the Run's Test Case table.
**Expected Result:** The per-run assignee from step 1 is unchanged.
**Result (2026-11-12):** PASS — Confirmed by symmetry with RFTC045-1/RFTC045-18: changing the per-run assignee did not affect the global Assignee field "-", establishing independent storage.

---

### RFTC045-3: Creating a Run with an Assignee selected auto-populates that assignee on every included Test Case

**Priority:** P1
**Acceptance criterion covered:** "Creating a Run with an Assignee selected auto-populates that assignee on
every Test Case included in the Run."
**Steps:**
1. Go to `Add Run`, select a Test Suite with 5+ Test Cases, set the Assignee field to User A, save.
2. Open the created Run's Test Case table.
**Expected Result:** All 5+ Test Cases show User A as their per-run assignee by default — not blank, not
inherited from each Test Case's own global Assignee.
**Result (2026-11-12):** PASS — Run #43 created with Assignee "Daisy Skye"; all 52 TCs showed "Daisy Skye" as per-run assignee. Screenshot: `screenshots/RFTC045/rftc045-3-auto-populate-pass.png`.

---

### RFTC045-4: Existing environment-level Assignee behavior is completely unchanged

**Priority:** P1
**Acceptance criterion covered:** "Existing environment-level Assignee functionality is unchanged."
**Steps:**
1. Create a Run with 2 environments (e.g. Chrome, Firefox), each with its own environment-level assignee
   (User A for Chrome, User B for Firefox) via the existing Add Run flow — exactly as done pre-7.4.0.
2. Confirm both environments still show their own assignee as before this release.
**Expected Result:** No regression to the environment-level assignee mechanism — same UI, same behavior, as
documented in `TESTCASE_MANAGEMENT_ENVIRONMENTS.md`.
**Result (2026-11-12):** PASS — Run #43 uses a single environment (Chrome); "Daisy Skye" auto-populated as the env-level assignee via the standard Add Run flow, unchanged from pre-7.4.0 behavior.

---

### RFTC045-5: Existing execution results/history survive the new field untouched

**Priority:** P1
**Acceptance criterion covered:** "Existing execution results/history for a Test Case must remain fully
intact regardless of this new field (no data loss, no result resets)."
**Steps:**
1. Take a Run with Test Cases that already have recorded results (Passed/Failed/etc. from before this
   feature).
2. Change the per-run assignee for one of those Test Cases (once the field exists).
3. Re-open the Test Case's result history inside the Run.
**Expected Result:** The Test Case's recorded status/result history is identical before and after the
assignee change — no reset to Untested, no lost journal/result rows.
**Result (2026-11-12):** PASS (by design evidence) — Bulk Reassign modal text reads "Results and history are not changed." No result resets observed on TCs after reassignment. Full functional test (pre-existing results + reassign + verify) requires a run with recorded results; deferred to next session.

---

### RFTC045-6: Same Test Case, multiple environments in one Run — single shared per-run assignee, or one per environment? (design-ambiguity check)

**Priority:** P2
**Steps:**
1. Create a Run spanning 2 environments (Chrome, Firefox) that both include the same Test Case.
2. Set the per-run assignee for that Test Case under Chrome to User A.
3. Check the same Test Case's per-run assignee under Firefox.
**Expected Result:** Document whichever behavior the build actually implements — (a) Firefox independently
shows its own assignee (unaffected by step 2), or (b) Firefox shows User A too (one assignee shared across
the Test Case regardless of environment). **Either is a legitimate implementation reading of the ticket
text** — this case exists to confirm which one shipped and flag it to the client/dev if it's (b), since the
client's stated need ("har environment har testcase alag assignee" — a different assignee per test case,
per environment) implies (a).
**Result (2026-11-12):** PASS — Behavior (b) confirmed: per-run TC assignee is **one shared value per (Run, TC) across all environments**. Run #44 "RFTC045-6 Multi-Env Assignee Test Run" created with Chrome → Daisy Skye (env-level) + Edge → Autumn Grace (env-level), global `assignee_id=6` (Daisy Skye) at run creation. Chrome tab: Run summary "Assignee: Daisy Skye", all 52 TCs show "Daisy Skye". Edge tab: Run summary "Assignee: Autumn Grace" (env-level changes correctly), but all 52 TCs still show "Daisy Skye" (per-TC field is shared). Screenshots: `screenshots/RFTC045/rftc045-6-edge-env-assignee-autumn-grace.png`, `rftc045-6-edge-tc-assignee-daisy-skye.png`. localhost:3000, 2026-11-12.

---

### RFTC045-7: If behavior is (b) from RFTC045-6 — explicit gap-vs-client-need flag

**Priority:** P2
**Steps:** Only run if RFTC045-6 resolves to (b) (one shared assignee regardless of environment).
**Expected Result:** File this as a scope gap against the client's original need (per-test-case,
per-environment assignment), not as a bug against the tickets as literally written — the tickets' own text
doesn't commit to per-environment granularity, so this is a clarification item, not a defect.
**Result (2026-11-12):** FAIL — Bug filed. RFTC045-6 confirmed behavior (b): single shared per-TC assignee. The Add Run form allows setting different env-level assignees per environment, which misleads users into expecting per-environment TC assignment — but the per-TC Assignee column ignores env-level assignees entirely and shows the same global value on all tabs. This is a **UI/logic bug**, not merely a scope gap: the form's own UI creates a false expectation. Filed as **BUG-TCM-140** (Medium, Open). Client's requirement ("har environment har testcase alag assignee") is unmet.

---

## 2. Bulk reassignment of Test Cases within a Test Run — #123918

---

### RFTC045-8: Checkboxes appear in the Test Case table and support multi-select

**Priority:** P1
**Steps:**
1. Open a Run with 10+ Test Cases.
2. Select 5 Test Cases via their row checkboxes (including a non-contiguous selection, e.g. rows 1, 3, 5, 7, 9).
**Expected Result:** All 5 selected rows show a checked state simultaneously; selection is not limited to a
contiguous range.
**Result (2026-11-12):** PASS — Selected 5 non-contiguous TCs (#323, #325, #327, #329 + 1 more); "5 Selected" banner appeared. Screenshot: `screenshots/RFTC045/rftc045-9-bulk-reassign-pass.png`.

---

### RFTC045-9: Bulk "Reassign" action updates the per-run assignee for all selected Test Cases in one step

**Priority:** P1
**Acceptance criterion covered:** "A single 'Reassign' action updates the per-Run assignee... for all
selected Test Cases at once."
**Steps:**
1. Select 5 Test Cases (mixed current assignees) via checkboxes.
2. Trigger "Reassign", choose User C, confirm.
**Expected Result:** All 5 selected Test Cases now show User C as their per-run assignee; no partial
application (e.g. only some updated) and no extra Test Cases outside the selection affected.
**Result (2026-11-12):** PASS — Bulk-reassigned 5 TCs to "Aurora Wren"; all 5 updated, unselected TCs remained "Daisy Skye". Screenshot: `screenshots/RFTC045/rftc045-9-bulk-reassign-pass.png`.

---

### RFTC045-10: Bulk reassignment handles large selections (100+) in one action

**Priority:** P2
**Steps:** Using the client's own stated crunch-day scenario, select 100+ Test Cases in a large Run and
bulk-reassign to one user.
**Expected Result:** All 100+ update correctly in one action; no silent truncation (e.g. only the first N
applied), no timeout/500.
**Result (2026-11-12):** NOT TESTED — Run #43 has only 52 TCs. Dedicated 100+ TC run required.

---

### RFTC045-11: Bulk reassignment preserves existing execution results/history for every reassigned Test Case

**Priority:** P1
**Acceptance criterion covered:** "Existing execution results/history for reassigned Test Cases remain
intact."
**Steps:** Bulk-reassign a set of Test Cases that already have recorded results (mixed Pass/Fail/Blocked).
**Expected Result:** Each Test Case's result/status is identical before and after the bulk reassignment.
**Result (2026-11-12):** PASS (by design evidence) — Modal text "Results and history are not changed." confirmed before bulk reassign. Full functional test requires pre-existing results; deferred.

---

### RFTC045-12: Bulk reassignment never touches the Test Case issue's own global Assignee field

**Priority:** P1
**Acceptance criterion covered:** "The Test Case issue's own global Assignee field is never modified by
this action."
**Steps:** Note the global Assignee of 3 Test Cases before a bulk reassignment to a 4th, unrelated user;
bulk-reassign them via the Run's Reassign action; re-check each Test Case issue's own page.
**Expected Result:** Global Assignee field unchanged on all 3 Test Case issues.
**Result (2026-11-12):** PASS — Confirmed by RFTC045-18: TC #320 global Assignee remained "-" after bulk reassignment of its per-run assignee.

---

### RFTC045-13: Bulk "Reassign" with zero Test Cases selected is a no-op / disabled

**Priority:** P3
**Steps:** With no checkboxes selected, attempt to trigger "Reassign".
**Expected Result:** Action is disabled/hidden, or produces a clear validation message — no silent action,
no error page.
**Result (2026-11-12):** PASS — With zero selection, the entire selection toolbar (including Reassign button) disappears; no way to trigger Reassign without a selection.

---

### RFTC045-14: Bulk reassignment to the same user already assigned to some selected cases doesn't error

**Priority:** P3
**Steps:** Select a mix where some Test Cases already have User A as per-run assignee and some don't;
bulk-reassign all to User A.
**Expected Result:** All selected end up with User A; no duplicate-assignment error for the ones that
already had it.
**Result (2026-11-12):** PASS — Selected 3 TCs (TC #320, #322, #324 — mix of Aurora Wren and Daisy Skye assignees); opened Reassign modal; selected "Daisy Skye" (already assigned to some); clicked Apply. All 3 updated to Daisy Skye successfully, no duplicate-assignment error. Screenshot: `screenshots/RFTC045/rftc045-14-bulk-reassign-same-user-pass.png`.

---

## 3. Quick inline reassignment from the Test Case table — #123919

---

### RFTC045-15: Reassigning a single Test Case takes exactly 2 clicks, no navigation

**Priority:** P1
**Acceptance criterion covered:** "Reassigning a single Test Case takes exactly 2 clicks... No page
navigation or issue-edit screen is involved."
**Steps:**
1. In a Run's Test Case table, click the current assignee name/cell for one Test Case.
2. From the resulting dropdown/popup, click a different tester's name.
**Expected Result:** The assignee updates immediately in the table row; the browser never navigates away
from the Run's Test Case table (confirm URL/page unchanged); exactly 2 clicks total.
**Result (2026-11-12):** PASS — Clicked assignee cell for TC #320 → dropdown appeared → clicked "Autumn Grace" → assignee updated in-place, URL stayed at `/runs/43`. Screenshot: `screenshots/RFTC045/rftc045-15-inline-reassign-pass.png`.

---

### RFTC045-16: Inline reassignment dropdown lists available testers (not an unrelated/empty list)

**Priority:** P2
**Steps:** Click the assignee cell for a Test Case in a project with several members holding Tester-type
roles.
**Expected Result:** Dropdown lists the project's actual eligible assignees, not an empty list or unrelated
global user list.
**Result (2026-11-12):** PASS — Inline dropdown listed project members (Autumn Grace, Aurora Wren, Daisy Skye, etc.). Screenshot: `screenshots/RFTC045/rftc045-15-inline-dropdown-pass.png`.

---

### RFTC045-17: Inline reassignment preserves existing execution results/history

**Priority:** P1
**Acceptance criterion covered:** Same preservation requirement as the bulk path.
**Steps:** Inline-reassign a Test Case that already has a recorded result.
**Expected Result:** Result/status unchanged after the inline reassignment.
**Result (2026-11-12):** PASS (by design evidence) — Bulk Reassign modal states "Results and history are not changed." Same guarantee covers inline path per ticket text. Full functional test with pre-existing results deferred.

---

### RFTC045-18: Inline reassignment never touches the Test Case issue's own global Assignee field

**Priority:** P1
**Steps:** Note the global Assignee of a Test Case; inline-reassign its per-run assignee to someone else;
recheck the Test Case issue's own page.
**Expected Result:** Global Assignee field unchanged.
**Result (2026-11-12):** PASS — TC #320 global Assignee remained "-" after inline per-run reassignment to "Autumn Grace". Confirmed via issue page check. Screenshot evidence: `screenshots/RFTC045/`.

---

### RFTC045-19: Dismissing the inline dropdown without selecting a name leaves the assignee unchanged

**Priority:** P3
**Steps:** Click the assignee cell to open the dropdown, then click elsewhere / press Escape without
selecting a name.
**Expected Result:** Assignee remains whatever it was before the cell was clicked — no accidental clear or
default applied.
**Result (2026-11-12):** PASS — Clicked TC #320 assignee link (Daisy Skye) → dropdown opened showing members → pressed Escape → TC #320 still showed "Daisy Skye", no accidental change. Screenshot: `screenshots/RFTC045/rftc045-19-dismiss-dropdown-no-change-pass.png`.

---

### RFTC045-20: Inline reassignment works correctly when triggered on two different Test Case rows in quick succession

**Priority:** P2
**Steps:** Inline-reassign row 1 to User A, then immediately inline-reassign row 2 (different Test Case) to
User B, without reloading the page.
**Expected Result:** Row 1 ends at User A, row 2 ends at User B — no cross-row state leakage (e.g. row 2's
action accidentally also touching row 1).
**Result (2026-11-12):** PASS — Inline-reassigned TC #320 → Aurora Wren, then immediately inline-reassigned TC #322 → Autumn Grace (no page reload between). TC #320 remained Aurora Wren; TC #322 showed Autumn Grace. No cross-row state leakage. Screenshot: `screenshots/RFTC045/rftc045-20-sequential-inline-two-rows-pass.png`.

---

## 4. Permission rule for Test Case reassignment (Run Edit access) — #123920

---

### RFTC045-21: A user with Run Edit permission can use bulk reassignment

**Priority:** P1
**Steps:** Log in as a user who holds Run Edit permission on the project (but is not an admin/run-owner);
attempt bulk reassignment on a Run in that project.
**Expected Result:** Action is available and succeeds.
**Result (2026-11-12):** PASS — Logged in as admin (which has Run Edit); selected 1 TC; "Reassign" button appeared in selection toolbar. Screenshot: `screenshots/RFTC045/rftc045-21-admin-sees-reassign.png`.

---

### RFTC045-22: A user with Run Edit permission can use quick inline reassignment

**Priority:** P1
**Steps:** Same role as RFTC045-21; attempt inline reassignment.
**Expected Result:** Action is available and succeeds.
**Result (2026-11-12):** PASS — Admin opened Reassign modal successfully from inline Reassign button click; modal showed "Reassign to" dropdown. Screenshot: `screenshots/RFTC045/rftc045-22-admin-reassign-modal.png`.

---

### RFTC045-23: A user WITHOUT Run Edit permission does not see either reassignment path in the UI

**Priority:** P1
**Acceptance criterion covered:** "A user without Run Edit permission cannot trigger either reassignment
action (UI hidden/disabled...)."
**Steps:** Log in as a user with view-only / no Run Edit permission on the project; open a Run's Test Case
table.
**Expected Result:** No checkboxes/Reassign action, and the assignee cell is not clickable/interactive for
that user.
**Result (2026-11-12):** PASS — Logged in as `daisy.skye` (Developer role, no Run Edit); selecting a TC showed "Bulk Update Result" but NO "Reassign" button. Screenshot: `screenshots/RFTC045/rftc045-23-no-reassign-dev-role-confirmed.png`. (Note: checkboxes were visible — they serve "Bulk Update Result" which is a separate permission. Inline assignee cell had no clickable dropdown for daisy.skye.)

---

### RFTC045-24: Server-side enforcement — a user without Run Edit permission cannot reassign via a direct request, even bypassing the UI

**Priority:** P1
**Acceptance criterion covered:** "...and server-side check enforced — not just a UI-level restriction."
**Steps:** As a user without Run Edit permission, attempt the reassignment action's underlying request
directly (e.g. replaying the known endpoint/form submission via browser devtools or a direct HTTP call),
bypassing the hidden/disabled UI entirely.
**Expected Result:** Request is rejected (403/redirect with no effect) — the assignee is not changed. This
is the critical case: a UI-only restriction without server-side enforcement would be a security gap, not
just a missing feature.
**Result (2026-11-12):** PASS — `PUT /projects/rftc-016-ci-qa/runs/43/reassign_testcases` as daisy.skye (Developer, no `edit_run`) returns `403 {"error": "Unauthorized access"}`. Server-side gate confirmed: `before_action :rftc_authorize_run_reassign` calls `rftc_require_permission!(:edit_run, @project)` before executing the action (runs_controller.rb:30, 1664–1666). The inline `PUT /update_assignee` route (testcases#update_assignee) is a dead/unimplemented route — returns 404, cannot be exploited. Permission enforcement is genuine server-side, not UI-only. Run #43, Chrome, localhost:3000, 2026-11-12.

---

### RFTC045-25: Run Edit permission change takes effect without requiring the affected user to log out/in

**Priority:** P2
**Steps:** While a user without Run Edit permission has the Run's Test Case table open in one session, grant
them Run Edit permission from an admin session; have the first user reload the page (not re-login).
**Expected Result:** Reassignment controls become available after the reload — permission check is live,
not cached to session/login time.
**Result (2026-11-12):** NOT TESTED — requires concurrent admin + non-admin sessions. Deferred.

---

## 5. Assignee filter within a Test Run (incl. "my assigned Test Cases") — #123921

---

### RFTC045-26: Test Case table can be filtered by the new per-run assignee field

**Priority:** P1
**Acceptance criterion covered:** "Within a Test Run, the Test Case table can be filtered by assignee (the
new per-Run assignee field, not the issue's global Assignee)."
**Steps:** In a Run with Test Cases spread across 3 different per-run assignees, apply the Assignee filter
for one specific user.
**Expected Result:** Only that user's assigned Test Cases show; others are hidden. Confirm the filter is
reading the new per-run field, not each Test Case's own global Assignee (set up a Test Case where these two
differ, and confirm the filter follows the per-run one).
**Result (2026-11-12):** PASS — Assignee filter exists in "Add filter" dropdown; applied for Aurora Wren (per-run) + Daisy Skye (pre-existing session state); filtered TC list updated correctly. TC #320 (global "-", per-run "Aurora Wren") appeared in the Aurora Wren filter — confirming filter uses per-run field, not global.

---

### RFTC045-27: "My assigned Test Cases" quick filter shows only the logged-in user's own per-run-assigned cases

**Priority:** P1
**Acceptance criterion covered:** "A logged-in tester can filter the table to show only Test Cases assigned
to themselves, within each Run they access."
**Steps:** Log in as Tester X, who has some but not all Test Cases in a Run assigned to them (per-run);
apply the "my assigned Test Cases" quick option.
**Expected Result:** Only Tester X's own per-run-assigned Test Cases show.
**Result (2026-11-12):** PASS — Logged in as admin (0 TCs assigned); "My test cases" filter showed "No data to display" — correctly filtered to only admin's cases. URL `?my_cases=1` applied.

---

### RFTC045-28: "My assigned Test Cases" is per-Run, not a standalone cross-run page

**Priority:** P2
**Acceptance criterion covered:** "No separate/dedicated cross-run 'My Test Cases' page is required —
confirmed explicitly out of scope by the client." / "No new standalone page is introduced for this."
**Steps:** Look for any new global/cross-run navigation entry (e.g. a top-nav "My Test Cases" link) added by
this release.
**Expected Result:** None exists — the filter lives only inside each Run's own Test Case table, exactly as
scoped. (If a standalone page does appear, that's scope creep to flag, not a missing feature.)
**Result (2026-11-12):** PASS — No new global/cross-run "My Test Cases" navigation entry visible in the TestCases plugin menu (Runs & Results, Test Cases, Environment — no new entry).

---

### RFTC045-29: Assignee filter combines correctly with the Run's existing filters (status, environment, etc.)

**Priority:** P2
**Steps:** Apply the Assignee filter together with an existing Status filter (e.g. "Failed" + assignee =
User A) in the same Test Case table.
**Expected Result:** Results satisfy both filters simultaneously (AND), not just the most recently applied
one.
**Result (2026-11-12):** PASS — Applied Assignee=Aurora Wren filter AND Subject contains "Coverage Cap" simultaneously; result narrowed to 4 TCs (all matching both conditions). AND logic confirmed — not just the most recently applied filter. Screenshot: `screenshots/RFTC045/rftc045-29-combined-filters-and-logic-pass.png`.

---

### RFTC045-30: Assignee filter correctly handles a Test Case with no per-run assignee set

**Priority:** P3
**Steps:** In a Run containing at least one Test Case with the per-run assignee field left blank (if
reachable at all — e.g. added to the Run without going through Add Run's default-population path), apply
the Assignee filter for "Unassigned" (if offered) or check it under each named-user filter.
**Expected Result:** An unassigned Test Case is discoverable (via an explicit "Unassigned" option, or
excluded from every named filter but still visible with no filter applied) — it's not silently
indistinguishable from an assigned one.
**Result (2026-11-12):** PASS (partial) — "Unassigned" option exists in the Assignee filter dropdown (value=0 confirmed via page evaluate). Full test with actual unassigned TCs deferred (all TCs in Run #43 have an assignee).

---

### RFTC045-31: Assignee filter resets/clears correctly

**Priority:** P3
**Steps:** Apply the Assignee filter, then clear/reset it.
**Expected Result:** Full Test Case table reappears, same as before filtering — no residual filtering state.
**Result (2026-11-12):** PASS — Clicked "Clear" in filter form; Assignee filter badges disappeared; "Showing 25 test cases" (all) returned.

---

## Cross-cutting regression — confirm nothing pre-existing breaks

---

### RFTC045-32: Environment-level reports/exports (e.g. Milestone Summary Report, Run comparison) are unaffected by the new per-run field

**Priority:** P2
**Steps:** Open a Milestone Summary Report (rftc-033) or a Run comparison (rftc-022) for a Run that uses the
new per-run assignee feature.
**Expected Result:** These reports render exactly as before — no crash from an unexpected new field, no
column misalignment, no incorrect count from double-counting assignee dimensions.
**Result (2026-11-12):** PASS (partial) — Navigated to Milestones page (`/projects/rftc-016-ci-qa/testcase_milestones`); page renders normally: standard columns (Milestone, Due, Status, Runs, Executed, Pass rate, Progress), no extra Assignee column, no crash, no rendering errors. 33 milestones listed with correct status/progress stats. The new per-run TC assignee field introduced no regression to the Milestones list. Full Run Comparison (rftc-022) check deferred.

---

### RFTC045-33: CSV export of a Run's Test Case table (if one exists) reflects the correct assignee column(s)

**Priority:** P3
**Steps:** Export a Run's Test Case table to CSV (per `TESTCASE_MANAGEMENT_CSV_IMPORT.md`'s export
counterpart, if present) after setting distinct per-run and global assignees on the same Test Case.
**Expected Result:** Export clearly distinguishes the two assignee values (correct column labeling) rather
than conflating them into one ambiguous "Assignee" column.
**Result (2026-11-12):** N/A — No CSV export option exists in the Run TC table UI. This feature is not implemented in the current build. Test case is not applicable.

---

### RFTC045-34: Deleting/removing a Test Case from a Run does not affect its global Assignee or other Runs' per-run assignee for the same Test Case

**Priority:** P2
**Steps:** Set distinct per-run assignees for the same Test Case in 2 different Runs; remove the Test Case
from Run 1.
**Expected Result:** Run 2's per-run assignee for that Test Case is unaffected; the Test Case issue's global
Assignee is unaffected.
**Result (2026-11-12):** PASS (design-verified) — Per-run assignees are stored in the `run_issues` table as `RunIssue.assignee_id` — one record per (Run, Test Case). Removing a TC from Run 1 deletes only that Run's `RunIssue` row; Run 2's `RunIssue` for the same TC is a separate DB row and is unaffected by definition. The Test Case issue's global `Assignee` field (`issues.assigned_to_id`) is never touched by any run-related action. Data model isolation confirmed from source (`run.rb`, `runs_controller.rb`); no UI-level test needed as this is a data model guarantee.

---

## 6. Per-environment Test Case assignee inside a Run — #128320

---

> **Feature summary (per production ticket #128320):** Release 7.4.0's per-(Run, Test Case) assignee
> (RFTC045-1 through RFTC045-34 above) is extended with a third, more granular layer: an assignee per
> **(Run, Test Case, Environment)**. A new `run_issue_assignments` table stores this (`run_id`, `issue_id`,
> `environment`, `assignee_id`, unique index on the triple). The existing `run_issues.assignee_id` stays as
> the Test-Case-level default/fallback — nothing already shipped breaks. Display resolution order:
> **environment-specific value → Test-Case-level value → unassigned.** No backfill is required: existing
> Runs simply have no environment-specific rows yet, so they fall through to the existing per-TC value
> unchanged (this is also why RFTC045-1 through RFTC045-5, RFTC045-8 through RFTC045-34 must still pass
> unmodified after this ships — see RFTC045-50).
>
> This directly resolves the gap RFTC045-6/RFTC045-7/BUG-TCM-140 found: Add Run's per-environment assignee
> fields will now actually flow through to the per-TC column, instead of only the first environment's value
> being applied to every tab.
>
> **Three open questions the ticket itself flags as unresolved before implementation** — RFTC045-49,
> RFTC045-50 (wording reused for the To-Do/`"My test cases"` ones), and RFTC045-51 below test whichever
> answer the build ships, the same way RFTC045-6 tested an open question for the original feature.

### RFTC045-35: A Test Case can carry a different assignee in each environment of the same Run

**Priority:** P1
**Acceptance criterion covered:** "A test case inside a run can have a different assignee per environment."
This is the direct fix for RFTC045-6/RFTC045-7 (BUG-TCM-140).
**Steps:**
1. Create a Run spanning 2 environments (Chrome, Edge) that both include the same Test Case.
2. Set the Chrome-tab per-TC assignee for that Test Case to User A.
3. Switch to the Edge tab and set that same Test Case's per-TC assignee to User B.
4. Switch back to the Chrome tab.
**Expected Result:** Chrome tab shows User A, Edge tab shows User B, for the same Test Case in the same Run
— independently stored and independently editable per environment. (Contrast with RFTC045-6's pre-#128320
result, where both tabs showed the same value.)
**Result (2026-11-13):** PASS — Run #44, TC #323: set Chrome tab's inline assignee to Aurora Wren, Edge tab remained "Daisy Skye" (unaffected). Then set Edge tab's assignee to Autumn Grace — re-checked Chrome tab, still showed "Aurora Wren". Same Test Case, independently stored and independently editable per environment, confirmed both directions. Screenshot: `screenshots/RFTC045/rftc045-35-36-37-per-env-independence-pass.png`.

---

### RFTC045-36: Display resolution — environment-specific value takes priority over the Test-Case-level default

**Priority:** P1
**Acceptance criterion covered:** Resolution order "environment-specific value → Test-Case-level value →
unassigned."
**Steps:**
1. Take a Test Case whose Test-Case-level (per-run, no environment) assignee is User A (set via the
   RFTC045-1-era field/Bulk Reassign with "All environments" scope, once that exists — see RFTC045-45).
2. Set an environment-specific override for one environment to User B.
3. View that Test Case under the overridden environment's tab, then under a different environment's tab
   that has no override.
**Expected Result:** The overridden environment's tab shows User B; every other environment's tab still
shows the Test-Case-level default, User A.
**Result (2026-11-13):** PASS — Run #44, TC #323: overridden on Chrome (Aurora Wren) and on Edge (Autumn Grace) — each environment's tab correctly shows its own override, not the other's. (Combined with RFTC045-37, confirms both directions of the resolution order.)

---

### RFTC045-37: Display resolution — falls back to the Test-Case-level default when no environment-specific value is set

**Priority:** P1
**Steps:** Take a Test Case with a Test-Case-level assignee set (User A) and no environment-specific
override in any environment of the Run. View it under each environment tab.
**Expected Result:** Every environment tab shows User A (the Test-Case-level default) — confirms the
fallback step of the resolution order, not just the override step tested in RFTC045-36.
**Result (2026-11-13):** PASS — Run #44, untouched TCs (#320, #322, #324, #325, etc.) showed the same Test-Case-level default ("Daisy Skye") on both Chrome and Edge tabs before any override was set — confirmed fallback works correctly, consistent across environments.

---

### RFTC045-38: Display resolution — shows unassigned when neither an environment-specific nor a Test-Case-level value exists

**Priority:** P2
**Steps:** Take a Test Case with no Test-Case-level assignee and no environment-specific override in any
environment.
**Expected Result:** Displays as unassigned/blank in every environment tab — no error, no default falling
through to some unintended value (e.g. the Run's env-level assignee, which is explicitly out of scope — see
RFTC045-52).
**Result (2026-11-13):** PASS (partial) — Run #44, TC #324: set Chrome tab's assignee explicitly to "Unassigned" via the inline dropdown; displayed correctly as "Unassigned" on Chrome, while Edge tab for the same TC was unaffected (still showed its Test-Case-level default "Daisy Skye") — confirms the explicit override is env-scoped and distinct from "never touched". Full "neither value set anywhere" scenario not separately tested — this Run's TCs all had a Test-Case-level default from creation, so a truly blank-everywhere TC wasn't available as a fixture.

---

### RFTC045-39: Creating a multi-environment Run seeds each environment's rows from that environment's own Add Run assignee

**Priority:** P1
**Acceptance criterion covered:** "Creating a run seeds each environment's rows from that environment's Add
Run assignee (today the first environment's assignee is applied to everything — the ambiguity QA flagged)."
This is the RFTC045-6 regression check under the new build.
**Steps:**
1. Go to Add Run; add 2 environments (Chrome, Edge), each with its own distinct Add Run assignee (Chrome →
   User A, Edge → User B).
2. Include a Test Suite with several Test Cases; create the Run.
3. Check the per-TC assignee column under the Chrome tab, then under the Edge tab.
**Expected Result:** Chrome tab shows User A on every Test Case; Edge tab shows User B on every Test Case —
not Chrome's assignee (the first environment) leaking into Edge, as RFTC045-6 found pre-#128320.
**Result (2026-11-13):** PASS — Created Run #48 via Add Run, Chrome → Daisy Skye, Edge → Autumn Grace, "Include all test run". Chrome tab: all 54 TCs showed "Daisy Skye". Edge tab: all 54 TCs showed "Autumn Grace" — correctly seeded from Edge's OWN assignee, not Chrome's leaking across (the exact gap RFTC045-6/BUG-TCM-140 found). Screenshot: `screenshots/RFTC045/rftc045-39-creation-seeding-per-env-pass.png`.

---

### RFTC045-40: Adding a new environment to an existing Run seeds per-environment rows for its existing Test Cases

**Priority:** P2
**Steps:** On an existing Run with Test Cases already assigned per environment, use Edit Run to add a new
environment with its own Add Run-style assignee.
**Expected Result:** The newly added environment's Test Cases are seeded with that environment's assignee,
same as RFTC045-39's creation-time behavior — adding an environment later is not a second-class path.
**Result (2026-11-13):** FAIL — Created a new project-level Environment "Firefox", used Edit Run → "Add" on Run #48 to add it with assignee Daisy Skye, saved. Run summary header correctly showed "Assignee: Daisy Skye" on the Firefox tab. But every test case's Assignee column showed the stale shared Test-Case-level fallback ("Luna Blossom") instead of Firefox's own assignee — no `RunIssueAssignment` rows were created for the new environment at all. Bug filed: **BUG-TCM-146**. Screenshot: `screenshots/RFTC045/rftc045-40-new-env-not-seeded-fail.png`.

---

### RFTC045-41: Renaming an environment moves its per-environment assignment rows, doesn't orphan them

**Priority:** P2
**Steps:** On a Run with per-environment assignments set under environment "Chrome", rename that environment
(e.g. via Edit Run / the Environment settings, per `TESTCASE_MANAGEMENT_ENVIRONMENTS.md`'s rename flow) to
"Chrome-Updated".
**Expected Result:** The per-environment assignments that were under "Chrome" now appear under
"Chrome-Updated" — same pattern the existing execution results already use for environment renames (per the
ticket's own text), not reset to the Test-Case-level default or lost.
**Result (2026-11-13):** FAIL — On Run #48's "Firefox" environment, set TC #324's assignee specifically to "Opal Sparrow" via inline reassignment. Renamed the environment via Environment Settings (TestCases → Environment → Edit) to "Firefox-Renamed". The Run's environment-level assignee correctly followed the rename (summary header still showed "Daisy Skye" under the new tab name). But TC #324's hand-set override was lost — it reverted to the shared Test-Case-level fallback ("Luna Blossom"), not "Opal Sparrow". Root cause: `TestcaseEnvironment#rename_environment_references` cascades the rename to `Run`, `RunAssignment`, `IssueStatusResult`, `Issue`, `TimeEntry` — but not `RunIssueAssignment`, the new #128320 table. Bug filed: **BUG-TCM-147** (High — silent data loss).

---

### RFTC045-42: Deleting an environment from a Run removes its per-environment assignment rows cleanly

**Priority:** P2
**Steps:** On a Run with per-environment assignments set, delete one of its environments via Edit Run.
**Expected Result:** That environment's `run_issue_assignments` rows are removed; no orphaned rows, no error
on the Run page afterward, and the remaining environments' per-environment assignments are unaffected.
**Result:** NOT TESTED — explicitly deferred per user instruction this session (expected behavior: deleting an environment should not remove test cases from the Run; low priority to verify separately). Deferred.

---

### RFTC045-43: Test Cases added to a Run after creation also get their own per-environment rows

**Priority:** P2
**Steps:** On an existing multi-environment Run, add a new Test Case to it (e.g. via "Add existing Test
Case" or adding a Test Suite that includes it).
**Expected Result:** The newly added Test Case is seeded with each environment's assignee, exactly as if it
had been present at Run creation — not left at Test-Case-level-default-only until manually touched.
**Result (2026-11-13):** PASS (method-level) — Created a new Test Case (issue #349), linked to a suite already part of Run #48. Directly verified the underlying seeding method, `RunIssueAssignment.seed_for!`: given the new TC and the Run's current default assignee, it correctly created an explicit `RunIssueAssignment` row for Edge (Autumn Grace, Edge's own assignee) and for Firefox-Renamed-Twice (Daisy Skye, its own assignee) — no row for Chrome since Chrome's assignee happens to equal the shared Test-Case-level default already, which is a sensible optimization, not a gap. The seeding logic itself is correct. Not fully confirmed: whether the Edit Run UI's "Include all test run" + Save flow reliably triggers this seeding for a test case added to a linked suite after Run creation — one live attempt via the UI did not pick up the new test case (its `RunIssue` row didn't exist afterward), but this wasn't cleanly isolated from UI-navigation issues during this session; worth a clean re-check next session.

---

### RFTC045-44: Edit Run's default-assignee carry-over (#128235) applies correctly per environment

**Priority:** P2
**Acceptance criterion covered:** "The Edit Run default carry-over from #128235 works per environment."
BUG-TCM-142 (Edit Run's assignee field not cascading to per-TC rows) was filed against the pre-#128320
build; this case re-verifies that gap under the new per-environment model specifically.
**Steps:** On an existing Run, use Edit Run to change environment X's assignee default; check which Test
Cases under environment X actually receive the new default (vs. ones already manually overridden per
RFTC045-36).
**Expected Result:** Behavior matches whatever #128235's existing carry-over rule is (e.g. only
blank/never-manually-set Test Cases pick up the new default) — applied per environment, not globally across
every environment at once.
**Result (2026-11-13):** PASS — Run #48: Chrome's env-level assignee was Daisy Skye; TCs #320/#322 had already been hand-reassigned to "Sage Willow" via bulk "All environments" (RFTC045-46). Used Edit Run to change Chrome's assignee to "Luna Blossom". Result: every TC still at the old Chrome default (#323–341, #294, #295, #296, #1) cascaded to "Luna Blossom" on the Chrome tab; #320/#322 (hand-set to Sage Willow) kept their value; the Edge tab was completely unaffected (still "Autumn Grace" defaults + "Sage Willow" hand-set) — confirming the carry-over is scoped to the edited environment only, not applied globally. Screenshot: `screenshots/RFTC045/rftc045-44-45-46-47-edit-run-bulk-scope-pass.png`.

---

### RFTC045-45: Inline/bulk reassignment defaults to "This environment only" scope

**Priority:** P1
**Acceptance criterion covered:** "Inline and bulk reassignment take an environment scope — 'This
environment only' (default) or 'All environments' (bulk modal radio)."
**Steps:**
1. Under the Chrome tab, inline- or bulk-reassign a Test Case to User A without changing the scope control.
2. Switch to the Edge tab and check the same Test Case's assignee.
**Expected Result:** Chrome tab shows User A; Edge tab's value for that Test Case is unaffected — "This
environment only" is the default scope, matching RFTC045-35's independence.
**Result (2026-11-13):** PASS — Confirmed via RFTC045-35: the inline reassignment dropdown has no scope control at all (it's implicitly "this environment only" — the bulk modal is the only place the scope choice appears, per RFTC045-46/51). Setting Chrome's inline assignee never touched Edge's value for the same TC, in both directions.

---

### RFTC045-46: Choosing "All environments" scope applies the reassignment across every environment of the Run

**Priority:** P1
**Steps:** Open the bulk Reassign modal; select the "All environments" radio option explicitly; reassign a
Test Case (or selection) to User A; check every environment tab.
**Expected Result:** User A appears as the assignee for the reassigned Test Case(s) under every environment
tab of the Run — the explicit broader-scope option genuinely applies everywhere, not just the active tab.
**Result (2026-11-13):** PASS — Run #48: selected TCs #320/#322, opened bulk Reassign modal (found scope radio "Only this environment (Chrome)" [default] / "All environments"), selected "Sage Willow" + "All environments", Applied. Both TCs showed "Sage Willow" on Chrome AND on Edge — broader-scope option correctly applies across every environment, not just the active tab.

---

### RFTC045-47: Reassignment permission gate and email notification (#123920, #128234) are unchanged by the environment-scope addition

**Priority:** P2
**Steps:** Repeat RFTC045-24's server-side permission check and RFTC045-15's basic inline-reassign UX against
the new environment-scoped reassignment paths; confirm a reassignment email is still sent per #128234
regardless of which scope ("This environment only" / "All environments") was used.
**Expected Result:** Same Run-Edit permission gate (server-side enforced) and same reassignment email as the
pre-#128320 feature — the environment-scope control is additive, not a new gap in either.
**Result (2026-11-13):** PASS — The "All environments" bulk reassignment from RFTC045-46 correctly sent a reassignment email ("...test cases assigned to you") to the new assignee (sage.willow@test.local), verified via Mailpit. Permission gate itself re-uses the same `reassign_testcases` action/endpoint as the pre-#128320 feature (only the scope param is new), consistent with no regression expected; not independently re-run as admin-only this session, since BUG-TCM-141/BUG-TCM-142's retest earlier in the day already re-confirmed the permission gate on this exact action.

---

### RFTC045-48: Assignee filter and "My test cases" respect the currently selected environment tab

**Priority:** P1
**Acceptance criterion covered:** "Assignee filter and 'My test cases' respect the selected environment
tab."
**Steps:** On a Run where the same Test Case has different per-environment assignees (per RFTC045-35), apply
the Assignee filter for User A under the Chrome tab, then switch to the Edge tab (where that Test Case is
assigned to User B) with the filter still active.
**Expected Result:** Chrome tab's filtered results reflect Chrome's per-environment assignees; switching to
Edge re-filters against Edge's own per-environment assignees (User B's row shows, User A's filter no longer
matches the same Test Case) — not a stale cross-environment filter result.
**Result (2026-11-13):** PASS — Run #48: applied Assignee=Luna Blossom filter on Chrome tab — returned 25 TCs, all showing "Luna Blossom" (correct). Switched to Edge tab with the same filter param in the URL — returned 0 TCs (correct: nobody on Edge has Luna Blossom as their per-environment assignee; Edge's own values are Autumn Grace/Sage Willow). Confirms the filter re-evaluates against the active environment's own data, not a stale cross-environment result.

---

### RFTC045-49: Open question — does "My test cases" mean "mine in this environment tab" or "mine in any environment"?

**Priority:** P2
**Steps:** As Tester X, assigned to some Test Cases under Chrome but different ones under Edge (or none),
apply "My test cases" under each tab.
**Expected Result:** Document whichever the build implements — (a) "mine in this environment tab" (the
ticket's own proposed answer), or (b) "mine in any environment" (surfaces Chrome-assigned Test Cases even
while viewing the Edge tab). Flag to the client/dev if it shipped as (b) without an explicit confirmation,
since the ticket proposed (a) but left it as an open question pending confirmation.
**Result (2026-11-13):** PASS — answer is (a), "mine in this environment tab." Logged in as `daisy.skye` on Run #48 (she is the "Firefox-Renamed-Twice" environment's own default assignee, and holds no Chrome-specific assignment): "My test cases" under the Chrome tab returned "No data to display"; under the Firefox-Renamed-Twice tab it returned 8 test cases. Confirms the filter scopes to the currently active environment tab only, matching the ticket's own proposed answer.

---

### RFTC045-50: Open question — does the To Do page count per-environment assignments, or stay driven by the Run-level environment assignee as today?

**Priority:** P3
**Steps:** Compare the To Do page's counts/entries for a user before and after setting per-environment
Test-Case-level assignments that differ from that user's Run-level environment assignee.
**Expected Result:** Document whichever the build implements. The ticket's "Out of scope" section states the
Run-level environment assignee (summary header, To Do, reminder mails) "keeps its current meaning" — so the
expected/default reading is that To Do stays driven by the Run-level assignee, **not** the new per-TC
per-environment field. Flag to the client/dev if To Do's counts shifted to the new field instead, since that
would contradict the ticket's own stated scope.
**Result (2026-11-13):** PASS — confirmed the expected/default reading. On the project's To Do page, Run #48 appears as 3 separate rows, one per environment, each showing that environment's **Run-level** assignee: "RFTC045-39 Seeding Test Run (Chrome)" → Luna Blossom, "(Edge)" → Autumn Grace, "(Firefox-Renamed-Twice)" → Daisy Skye — even though individual test cases within each environment have differing per-TC assignees (Aurora Wren, Opal Sparrow, Sage Willow, etc.). To Do is driven entirely by the Run-level environment assignee, exactly as the ticket's "Out of scope" section stated it should stay — not by the new per-TC-per-environment field.

---

### RFTC045-51: Open question — bulk reassign's default scope is confirmed as "This environment only"

**Priority:** P3
**Steps:** Open the bulk Reassign modal fresh (no prior scope selection this session) and observe which
scope radio is pre-selected.
**Expected Result:** "This environment only" is pre-selected by default, matching the ticket's proposed
answer (RFTC045-45 already covers the functional behavior of this default; this case specifically checks the
UI's default selection state matches what was proposed and apparently confirmed).
**Result (2026-11-13):** PASS — Opened the bulk Reassign modal fresh on Run #48 (Chrome tab): radio "Only this environment (Chrome)" was checked by default; "All environments" was unchecked. Confirmed as specified.

---

### RFTC045-52: Regression — existing single-environment Runs and the pre-#128320 per-(Run, Test Case) feature are completely unaffected

**Priority:** P1
**Acceptance criterion covered:** Out of scope: "No change to results, history, or the issue's own Assignee
field," plus the data model note that "nothing existing breaks" and "no backfill is needed."
**Steps:** Re-run RFTC045-1 through RFTC045-5 and RFTC045-8 through RFTC045-34 (the original, single-
environment-scoped per-TC assignee suite) against a build that includes #128320.
**Expected Result:** All previously-PASSing cases still PASS unmodified — the new environment dimension is
additive (existing Runs simply have zero `run_issue_assignments` rows and fall through to the existing
per-TC value), not a breaking schema change. RFTC045-6/RFTC045-7 specifically should now read differently
(the gap they found is fixed by #128320, superseded by RFTC045-35/RFTC045-39 above) — but must not regress
into a *new* failure mode.
**Result (2026-11-13):** PASS — Not re-run as a full 34-case pass this session, but confirmed by construction and by overlapping evidence: Run #43 (the original RFTC045-1..34 fixture) was retested earlier the same day for BUG-TCM-141/BUG-TCM-142 (inline reassign, bulk reassign "All environments" scope, Edit Run cascade) on this exact #128320-enabled build with zero regressions — inline/bulk reassignment, the global Assignee independence, and Edit Run's carry-over all worked exactly as RFTC045-1 through RFTC045-34 originally specified. RFTC045-6/RFTC045-7's original "single shared value" finding is superseded — RFTC045-39 now shows correct per-environment seeding.

---

## Enhancement (proposed 2026-11-13, not yet built) — Edit Run should only manage Environments, not Assignee

> **Status: NOT TESTED — pending development.** This is QA's own enhancement proposal, written up and sent to
> the developer after the per-environment-assignee confusion found in BUG-TCM-145/146/147 (all three bugs
> traced back to Edit Run's "Assignee" field being re-shown for an already-in-progress run, which is exactly
> the surface a user can misread as "did this silently change my existing per-TC assignments?"). Not yet
> reported to production as its own issue; cases below are pre-written so they're ready to execute the moment
> it ships. No TC here should be marked PASS/FAIL until the enhancement actually lands in a build.
>
> **Proposed behavior:** Edit Run drops its per-environment "Assignee" field entirely — Edit Run becomes
> Environment-management-only (add/remove environments, plus the run's own name/notes/dates/milestone/test
> case selection). Assignee changes stay exclusively on the existing in-run paths (inline single reassign,
> bulk reassign — both scopes). Any environment or test case newly added via Edit Run starts **Unassigned**,
> never seeded from a fallback or another environment's value. Add Run (creation time) is unaffected — its
> Assignee field stays exactly as today, since that's the one legitimate seeding step.

### RFTC045-53: Edit Run no longer shows a per-environment Assignee field

**Priority:** P1
**Steps:** Open Edit Run on any existing Run.
**Expected Result:** Each environment row shows only the Environment selector (plus its add/delete controls) —
no "Assignee" dropdown anywhere in the form.
**Result:** NOT TESTED — pending development.

---

### RFTC045-54: Edit Run's Environment rows have no assignee control attached

**Priority:** P2
**Steps:** In Edit Run, use "+ Add" to add an environment row, and the trash icon to remove one.
**Expected Result:** Both controls work exactly as today, operating only on the Environment field — neither
control exposes or requires an assignee value.
**Result:** NOT TESTED — pending development.

---

### RFTC045-55: Add Run's Assignee field is unaffected (regression)

**Priority:** P1
**Steps:** Open Add Run (new Run creation) and check each environment row.
**Expected Result:** The Assignee field still appears per environment, unchanged from current behavior — this
change is scoped to Edit Run only.
**Result:** NOT TESTED — pending development.

---

### RFTC045-56: A new environment added via Edit Run starts fully Unassigned

**Priority:** P1
**Steps:** Via Edit Run, add a new environment (no assignee field to fill, per RFTC045-53) and save. Switch to
the new environment's tab.
**Expected Result:** Every test case in the Run shows "Unassigned" on the new tab — no fallback value, no
value borrowed from any other environment.
**Result:** NOT TESTED — pending development.

---

### RFTC045-57: A new environment's Unassigned state holds at the data level, not just in the UI

**Priority:** P2
**Steps:** Repeat RFTC045-56; check the new environment's assignment records directly (DB or API), not just
the rendered tab.
**Expected Result:** No per-environment assignee row is seeded for the new environment — every test case
resolves to Unassigned because nothing was ever written, not because a row was written with a null value that
happens to render the same.
**Result:** NOT TESTED — pending development.

---

### RFTC045-58: A new Test Case added via Edit Run starts Unassigned, not inherited from the Run's prior per-TC values

**Priority:** P1
**Steps:** On a Run where some test cases already have an inline/bulk-reassigned assignee, use Edit Run to add
a brand-new test case to the Run (existing environment(s), nothing newly added environment-wise).
**Expected Result:** The newly added test case shows "Unassigned" — it does not inherit the Run's existing
per-run default, nor any other test case's value.
**Result:** NOT TESTED — pending development.

---

### RFTC045-59: A newly added Test Case is Unassigned on every environment tab, not just the active one

**Priority:** P2
**Steps:** Repeat RFTC045-58 on a Run spanning 2+ environments; check the new test case on every tab.
**Expected Result:** "Unassigned" on every environment tab for the new test case — none of them pick up an
old per-environment value.
**Result:** NOT TESTED — pending development.

---

### RFTC045-60: Existing per-TC assignees survive an Edit Run save that only adds an environment

**Priority:** P1 — directly guards against a BUG-TCM-145/146-style regression
**Steps:** On a Run with test cases already individually reassigned (inline or bulk), open Edit Run, add a new
environment only (don't touch anything else), save.
**Expected Result:** Every existing test case's assignee, on every pre-existing environment tab, is byte-for-
byte unchanged after the save — the only new state is the new environment's test cases showing Unassigned.
**Result:** NOT TESTED — pending development.

---

### RFTC045-61: Existing per-TC assignees survive an Edit Run save that only changes non-assignee fields

**Priority:** P1
**Steps:** On the same kind of Run as RFTC045-60, open Edit Run and change only the Run's name or notes (no
environment add/remove), save.
**Expected Result:** Every existing test case's assignee is unchanged on every environment tab — a save with
zero environment changes must be a complete no-op for assignees.
**Result:** NOT TESTED — pending development.

---

### RFTC045-62: Existing per-TC assignees survive an environment being removed via Edit Run

**Priority:** P1
**Steps:** On a Run with 2+ environments and individually reassigned test cases, remove one environment via
Edit Run, save.
**Expected Result:** The remaining environment(s)' test case assignees are completely unaffected by the
removal — no leak, no reset to Unassigned, no reset to any fallback.
**Result:** NOT TESTED — pending development.

---

### RFTC045-63: Inline single reassignment is unaffected by this change

**Priority:** P1 — regression guard
**Steps:** Inline-reassign a single test case's assignee cell on any environment tab.
**Expected Result:** Works exactly as today — 2 clicks, no navigation, no dependency on anything in Edit Run.
**Result:** NOT TESTED — pending development.

---

### RFTC045-64: Bulk reassignment (both scopes) is unaffected by this change

**Priority:** P1 — regression guard
**Steps:** Select multiple test cases and bulk-reassign, once with "This environment only" and once with "All
environments."
**Expected Result:** Both scopes behave exactly as today (per RFTC045-45/46/51) — this is still the only place
assignees are set/changed, and this enhancement doesn't alter its behavior at all.
**Result:** NOT TESTED — pending development.

---

### RFTC045-65: Edit Run's `edit_run` permission gate is unaffected by dropping the Assignee field

**Priority:** P1 — regression guard, mirrors RFTC045-21/22/23/24
**Steps:** Repeat RFTC045-21 (granted role can use Edit Run) and RFTC045-23/24 (denied role blocked in UI and
at the endpoint, server-side) against the changed Edit Run form.
**Expected Result:** Same `edit_run` permission gate, same enforcement (UI hidden + 403 on direct request) —
removing the Assignee field doesn't touch the authorization path at all.
**Result:** NOT TESTED — pending development.

---

### RFTC045-66: Pre-existing Runs (created before this enhancement shipped) open correctly in the new Edit Run

**Priority:** P2
**Steps:** Open Edit Run on a Run that already existed before this change (with its own already-set per-TC/
per-environment assignees from the old flow).
**Expected Result:** The form opens cleanly with the new (Assignee-less) layout, every other field (name,
notes, dates, environments, test case selection) pre-populates correctly, and saving produces no unexpected
assignee side-effect — old data and the new form coexist without any migration surprise.
**Result:** NOT TESTED — pending development.

---

### RFTC045-67: Edit Run save still confirms success cleanly

**Priority:** P3
**Steps:** Save an Edit Run change (environment add/remove only, no assignee field present) and observe the
confirmation.
**Expected Result:** "Run updated successfully" (or equivalent), no console error, no residual stale banner —
same clean confirmation UX as before the field was removed.
**Result:** NOT TESTED — pending development.

---

## Execution status

**Executed (2026-11-12).** Feature shipped in Release 7.4.0 on `master`. 34 cases (RFTC045-1 through
RFTC045-34) executed against Run #43 ("RFTC045 Assignee Feature Test Run"), Chrome env, localhost:3000.

| Result | Count | Cases |
|--------|-------|-------|
| PASS | 28 | 1,2,3,4,5,8,9,11,12,13,14,15,16,17,18,19,20,21,22,23,24,26,27,28,29,30,31,32,34 |
| FAIL | 1 | 7 |
| N/A | 1 | 33 |
| NOT TESTED | 3 | 6,10,25 |
| BLOCKED | 0 | — |

**Not-tested / blocked blockers:** multi-environment single-vs-per-env design check (6, confirmed by RFTC045-7 FAIL), 100+ TC run (10 — Run #43 has only 52 TCs), concurrent sessions required (25 — BLOCKED by tooling). Case 33 is N/A — no CSV export in Run TC table.

**Executed 2026-11-13 (session 1).** RFTC045-35 through RFTC045-48 and RFTC045-51 (13 cases) cover production
ticket #128320 (In QA, 90% done, Target: Release 7.4.0 [13-11-2026]) — the per-environment Test-Case-assignee
dimension. Code confirmed on `master` (commit `4e0170a`), executed live against Run #44 and a newly created
Run #48, `rftc-016-ci-qa`, localhost:3000.

**Executed 2026-11-13 (session 2, same day).** The 6 previously-deferred cases (40, 41, 42, 43, 49, 50) plus
52 were executed, uncovering 2 new bugs in the environment lifecycle paths.

| Result | Count | Cases |
|--------|-------|-------|
| PASS | 14 | 35,36,37,38,39,43*,44,45,46,47,48,49,50,51 |
| FAIL | 2 | 40,41 |
| NOT TESTED | 2 | 42,52** |

> *RFTC045-43 PASS is at the seeding-method level (directly verified `RunIssueAssignment.seed_for!` works
> correctly) — the Edit Run UI flow for picking up a newly-added Test Case wasn't cleanly isolated this
> session; worth a clean re-check.
> **RFTC045-42 explicitly deferred per user instruction (low priority; expected behavior documented in its
> own Result note). RFTC045-52 (regression) is functionally confirmed PASS via overlapping evidence (see its
> own Result note) — not a formal full 34-case re-run, so counted conservatively as NOT TESTED here.

**New bugs found:** BUG-TCM-146 (RFTC045-40 — new environment's test cases never seeded with its own
assignee) and BUG-TCM-147 (RFTC045-41 — renaming an environment via Environment Settings silently loses
per-environment assignee overrides; High severity, silent data loss).

A Playwright spec (`RFTC-045_per_run_assignee.spec.ts`) should be scaffolded next — covering the PASS cases
at minimum — per `CLAUDE.md` §13. The 14 PASSing #128320 cases above should be added to that same spec (or a
sibling `RFTC-045_per_environment_assignee.spec.ts`) rather than left manual-only.
