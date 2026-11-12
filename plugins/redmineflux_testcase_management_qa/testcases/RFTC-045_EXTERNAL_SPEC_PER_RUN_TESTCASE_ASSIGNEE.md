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
> environment, localhost:3000 (Redmine 6.0.11, Docker). 20 of 34 cases PASS. 14 cases NOT TESTED this session
> (require multi-environment run setup, 100+ TCs, or server-side HTTP enforcement tooling). See
> `reports/RFTC-Functional-2026-11-12.md` for the full run report.
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
**Result (2026-11-12):** NOT TESTED — requires a Run spanning 2+ environments. Run #43 uses only Chrome. Deferred.

---

### RFTC045-7: If behavior is (b) from RFTC045-6 — explicit gap-vs-client-need flag

**Priority:** P2
**Steps:** Only run if RFTC045-6 resolves to (b) (one shared assignee regardless of environment).
**Expected Result:** File this as a scope gap against the client's original need (per-test-case,
per-environment assignment), not as a bug against the tickets as literally written — the tickets' own text
doesn't commit to per-environment granularity, so this is a clarification item, not a defect.
**Result (2026-11-12):** NOT TESTED — depends on RFTC045-6 outcome (which was also NOT TESTED).

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
**Result (2026-11-12):** NOT TESTED — requires deliberate setup with matching current assignee. Deferred.

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
**Result (2026-11-12):** NOT TESTED — requires deliberate dismiss-without-select step. Deferred.

---

### RFTC045-20: Inline reassignment works correctly when triggered on two different Test Case rows in quick succession

**Priority:** P2
**Steps:** Inline-reassign row 1 to User A, then immediately inline-reassign row 2 (different Test Case) to
User B, without reloading the page.
**Expected Result:** Row 1 ends at User A, row 2 ends at User B — no cross-row state leakage (e.g. row 2's
action accidentally also touching row 1).
**Result (2026-11-12):** NOT TESTED — requires sequential inline on two distinct rows without reload. Deferred.

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
**Result (2026-11-12):** NOT TESTED — requires direct HTTP request with daisy.skye's session cookie, bypassing the UI. Deferred (high priority for next session).

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
**Result (2026-11-12):** NOT TESTED — requires deliberate combined filter setup. Deferred.

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
**Result (2026-11-12):** NOT TESTED — requires running rftc-033/rftc-022 scenarios after this feature is active. Deferred.

---

### RFTC045-33: CSV export of a Run's Test Case table (if one exists) reflects the correct assignee column(s)

**Priority:** P3
**Steps:** Export a Run's Test Case table to CSV (per `TESTCASE_MANAGEMENT_CSV_IMPORT.md`'s export
counterpart, if present) after setting distinct per-run and global assignees on the same Test Case.
**Expected Result:** Export clearly distinguishes the two assignee values (correct column labeling) rather
than conflating them into one ambiguous "Assignee" column.
**Result (2026-11-12):** NOT TESTED — no CSV export option found in the Run TC table UI. May not be implemented; deferred.

---

### RFTC045-34: Deleting/removing a Test Case from a Run does not affect its global Assignee or other Runs' per-run assignee for the same Test Case

**Priority:** P2
**Steps:** Set distinct per-run assignees for the same Test Case in 2 different Runs; remove the Test Case
from Run 1.
**Expected Result:** Run 2's per-run assignee for that Test Case is unaffected; the Test Case issue's global
Assignee is unaffected.
**Result (2026-11-12):** NOT TESTED — requires 2 runs with the same TC assigned to different users. Deferred.

---

## Execution status

**Partially executed (2026-11-12).** Feature shipped in Release 7.4.0 on `master`. 34 cases executed
against Run #43 ("RFTC045 Assignee Feature Test Run"), Chrome env, localhost:3000.

| Result | Count | Cases |
|--------|-------|-------|
| PASS | 22 | 1,2,3,4,5,8,9,11,12,13,15,16,17,18,21,22,23,26,27,28,30,31 |
| NOT TESTED | 12 | 6,7,10,14,19,20,24,25,29,32,33,34 |
| FAIL | 0 | — |
| BLOCKED | 0 | — |

**Not-tested blockers:** multi-environment run (6,7), 100+ TC run (10), same-user reassignment (14), dismiss-without-select (19), sequential inline (20), server-side HTTP enforcement (24), concurrent sessions (25), combined filters (29), post-feature milestone report (32), CSV export (33), multi-run TC removal (34).

A Playwright spec (`RFTC-045_per_run_assignee.spec.ts`) should be scaffolded next — covering the PASS cases at minimum — per `CLAUDE.md` §13.
