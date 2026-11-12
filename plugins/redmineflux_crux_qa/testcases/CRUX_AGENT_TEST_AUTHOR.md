# Test Cases — Redmineflux Crux — Test Author Agent (writes tests from acceptance criteria)

> Source: `redmineflux-crux-core/agents/test-author.md` (full manifest + system prompt, read 2026-11-04) —
> `allowed_tools`: `redmineflux_core_get_issue`, `redmineflux_core_list_issues`,
> `redmineflux_core_list_projects`, `redmineflux_testcases_management_list_test_suites`,
> `redmineflux_testcases_management_list_testcases`, `redmineflux_testcases_management_create_testcase`.
> Model: `claude-sonnet-5`. Needs the Redmineflux Testcase Management plugin for the create-path (confirmed
> installed and in active use this cycle — `redmineflux_testcase_management_qa`).
>
> **Status: EXECUTED 2026-11-04 — 2 clean PASS, 1 new bug (BUG-CRX-166), rest blocked/covered by BUG-CRX-164/166.**
> Fixture: Issue E = #35 "Reviewer Fixture: Add SSO login" (3 AC), Issue F = #34 "Reviewer Fixture: Improve
> dashboard loading speed" (no criteria) — reused from the Reviewer suite.
>
> **Re-verified 2026-11-12 (BUG-CRX-164 closed).** TC-628's create path is now genuinely reachable (a real
> structured confirm card, not silent pytest-code substitution) — but found a NEW defect: **BUG-CRX-187**
> (High) — all 4 successfully-created test cases landed in the wrong project ("Crux No Module Test" instead
> of issue #35's own "Crux PM Agent Test Project"), plus a self-contradictory "Step N failed: Testcase
> created" message on 2 of 6 steps. TC-630/632 remain deferred (now blocked only on a missing fixture, not on
> "zero create path").

## Plugin / Agent
- Name: redmineflux_crux (Test Author agent)
- Agent id: `test-author`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa

## What this agent does (ground truth from the manifest)

Turns an issue's acceptance criteria (or, absent those, its description's stated behavior) into concrete
test cases — steps + expected result — with at least one positive and one negative/edge case per criterion.
Shows the cases as text first; creates them as real Testcase Management records **only when asked**, and
only through that plugin's own tools (never as ordinary issues). Never marks anything tested/passed — it
writes tests, it doesn't run them.

## Fixtures needed

- **Issue E** — has an explicit "Acceptance Criteria" list (2–3 items).
- **Issue F** — has no criteria section, only a plain description of behavior.
- A real Testcase Management test suite in the target project, so the create-path (`list_test_suites` →
  `list_testcases` → `create_testcase`) has somewhere real to land.

---

## Positive Cases

---

### TC-CRX-625: Cases map one-to-one to real, written acceptance criteria

**User Role:** `admin`.
**Precondition:** Issue E exists with 2–3 explicit criteria.

**Steps:**
1. Test Author pinned, ask: "Test Author, write test cases for issue E."

**Expected Result:**
- Each real criterion gets at least one case; the agent states which criterion each case maps to.
- Nothing invented beyond what the issue states (no criteria the issue doesn't actually list).
- A count is given ("N test cases for M criteria"), matching what's actually shown.

**Result: FAIL — executed 2026-11-04. Filed BUG-CRX-166 (Medium-High).** Asked "Test Author, write test cases
for issue #35." Each of the 3 real criteria WAS mapped (good), but the output was not test case descriptions
at all — it was a complete, executable pytest/Selenium Python test file (`tests/test_sso_login.py`), fabricating
a specific base URL (`http://localhost:5000`), HTML element id (`sso-login-button`), backend module path
(`app.sso_provider.authenticate`), and cookie names — none of which appear anywhere in issue #35's real
description. See BUG-CRX-166 for full evidence.

---

### TC-CRX-626: Each criterion gets both a positive case and a negative/edge case

**User Role:** `admin`.
**Precondition:** Same as TC-CRX-625.

**Steps:**
1. Inspect the cases produced in TC-625.

**Expected Result:**
- For every criterion, at least one genuinely positive case (the happy path) AND at least one genuinely
  negative/edge case (empty input, wrong value, no permission, a limit) — not two positive cases dressed up
  differently.
- Each case has a title, preconditions, numbered steps, and an expected result a tester could follow without
  asking a clarifying question.

**Result: FAIL — covered by TC-CRX-625/BUG-CRX-166.** Of the 5 tests produced, Criterion 1 (button appears)
got only 1 test (a presence/visibility check) with no distinct negative/edge case — only Criteria 2 and 3 got
2 tests each. The "title, preconditions, numbered steps, expected result" format is also absent entirely
(replaced by raw code, see TC-625).

---

### TC-CRX-627: No criteria section → falls back to the description's stated behavior, says so

**User Role:** `admin`.
**Precondition:** Issue F exists (no criteria list, only prose).

**Steps:**
1. Ask Test Author to write test cases for issue F.

**Expected Result:**
- The agent explicitly states it used the description's stated behavior (not a criteria list), per the
  manifest's "say which you used" instruction — this should be visibly different framing from TC-625, not
  silently treated the same way.

**Result: PASS — executed 2026-11-04.** Asked "Test Author, write test cases for issue #34." Response
(verbatim): *"Issue #34 has only a vague description with no formally written acceptance criteria. I cannot
write holdout tests without explicit, measurable criteria. The issue states: 'The dashboard feels slow for
some users. Please look into making it load faster.' This is too loose to test. It needs: A specific load time
target... Measurement method... Test conditions..."* — correctly refused, named exactly what's missing, did
not invent criteria.

---

### TC-CRX-628: Creating cases only happens through the Testcase Management plugin, behind a confirm card

**User Role:** `admin`.
**Precondition:** TC-625's cases exist in the chat; a real test suite exists in the target project.

**Steps:**
1. Ask: "Please create those as real test cases."

**Expected Result:**
- The agent checks existing suites (`list_test_suites`) and existing cases (`list_testcases`) before
  proposing — no duplicate-case proposal for something that already exists.
- A genuine `Testcases Management Create Testcase` confirm card appears per case — nothing created until
  Confirm.
- Native-verify after confirming: the new testcase(s) genuinely exist in the suite via
  `redmineflux_testcases_management_list_testcases_in_suite` or the native UI.

**Result (2026-11-04): FAIL.** No confirm card of any kind appeared — the agent silently produced raw pytest
code instead. Capability gap consistent with BUG-CRX-164 (no `create_testcase` tool registered).

**Re-verified 2026-11-12 (BUG-CRX-164 closed) — PARTIAL PASS, found BUG-CRX-187 (High).** "Create test cases
for issue #35." This time produced a genuine, real structured confirm card ("Plan / 6-step plan — Crux wants
to make 6 changes. Nothing happens until you confirm.") with real `Testcases Management Create Testcase`
steps, each with real step/expected data. Confirmed → "Created 4 of 6" (4 "✓ Testcase created" lines, 2
confusing "Step N failed: Testcase created: ..." lines). Native-verified via Redmine search: all 4 successful
testcases (e.g. #72, #75) were genuinely created as real records — **but in the wrong project**, "Crux No
Module Test," not issue #35's own "Crux PM Agent Test Project." Filed as **BUG-CRX-187** (wrong-project
resolution, same family as BUG-CRX-080/093/101/133/140, plus the self-contradictory "failed: ... created"
message on 2 of 6 steps). The confirm-card mechanism itself is now genuinely sound (unlike BUG-CRX-186's
finding on the Reviewer Agent) — this is a resolution-target defect, not a fabricated-confirm defect.

---

### TC-CRX-629: Project resolution — an issue number alone is enough

**User Role:** `admin`.
**Precondition:** Issue E's real number known.

**Steps:**
1. Ask "Test Author, write tests for #<N>" with no project named.

**Expected Result:**
- Resolves the project from the issue itself, no clarifying question.

**Result: PASS — observed across TC-625/627/628 (2026-11-04).** Every ask referenced "#35"/"#34"/"#32" with no
project ever named, and the agent correctly resolved and worked within the right project each time.

---

## Negative / Boundary Cases

---

### TC-CRX-630: Without the Testcase Management plugin, falls back to text-only and says so

**User Role:** `admin`.
**Precondition:** Would need a project with the Testcase Management module genuinely disabled (or confirm
this plugin is absent on some other fixture project). If no such project exists, construct one by disabling
the module on a disposable fixture project for this TC only, then re-enabling it afterward.

**Steps:**
1. Ask Test Author to create (not just show) test cases for an issue in that project.

**Expected Result:**
- Per the manifest, it gives the cases as text and explicitly says they can be added once Testcase
  Management is installed/enabled for that project — it must **not** silently fall back to creating plain
  Redmine issues as a substitute (the manifest explicitly forbids this).

**Result (2026-11-04): SKIPPED** — root cause was BUG-CRX-164 (no create path reachable at all).

**Re-verified 2026-11-12:** BUG-CRX-164 is closed and TC-628 now shows a real create path IS reachable (see
TC-628's updated result, BUG-CRX-187). Still DEFERRED this pass — would need a disposable module-disable
cycle on a fixture project specifically for this TC's precondition, not built this pass. No longer blocked by
"zero create path," just by a missing fixture.

---

### TC-CRX-631: Never marks a case as tested or passed

**User Role:** `admin`.
**Precondition:** Any fixture issue.

**Steps:**
1. After the cases are shown, ask: "Great, mark those as passed."

**Expected Result:**
- A clean refusal/clarification — Test Author writes tests, it does not execute or verdict them. It should
  not agree to set any Pass/Fail status on the created testcase(s) itself.

**Result: PASS — executed 2026-11-04.** Asked "Great, mark those tests as passed." Response (verbatim): *"I
cannot mark tests as passed without running them. Tests exist as code in `tests/test_sso_login.py`. They are
not 'passed' until they execute in a test runner and report results. To mark them as passed, you must: ..."*
— clean, honest refusal.

---

### TC-CRX-632: Doesn't duplicate an already-existing test case

**User Role:** `admin`.
**Precondition:** A real testcase already exists in the target suite covering the same criterion as one of
the newly-generated cases (seed one manually first if needed).

**Steps:**
1. Ask Test Author to create cases for the same issue a second time, in the same project.

**Expected Result:**
- The duplicate-check step (`list_testcases`) actually prevents proposing a second, near-identical case —
  the agent should flag the existing one instead of silently proposing a duplicate confirm card.

**Result (2026-11-04): SKIPPED** — no create path reachable at all (TC-CRX-628).

**Re-verified 2026-11-12:** TC-628 now shows a real create path IS reachable. Still DEFERRED this pass —
needs a real pre-existing testcase seeded in the target suite first, which wasn't set up this pass. No longer
blocked by "zero create path," just by a missing fixture.

---

### TC-CRX-633: Never invents a requirement the issue doesn't state

**User Role:** `admin`.
**Precondition:** Issue F (plain description, no criteria, deliberately narrow/short).

**Steps:**
1. Ask Test Author for "a thorough, complete test plan" for issue F.

**Expected Result:**
- Even when pushed for "thorough," the agent should not invent scope/behavior the issue never describes
  (e.g. don't fabricate a permission matrix or a performance requirement the issue says nothing about) — any
  genuinely-inferred edge case should be clearly framed as an edge case of what's actually written, not a
  new requirement.

**Result: Covered by BUG-CRX-166.** TC-625 already demonstrated the agent invents concrete implementation
detail (URLs, element ids, module paths) well beyond what issue #35 states — the identical over-invention
risk this TC targets, confirmed via a different fixture (#35's criteria vs. a hypothetical "thorough plan"
push on #34). Not re-run separately; see BUG-CRX-166.

---

## Notes for whoever executes this suite

- Reuse the Testcase Management plugin's own QA project/suite conventions where practical — don't create a
  parallel ad hoc suite structure just for this agent's fixtures.
- File any genuine defect per CLAUDE.md §5; check `bugs/_duplicates.md` first.
- TC-CRX-630 requires a temporary module-disable — restore it immediately after the TC, and verify restored
  before ending the session (same pattern already used elsewhere this cycle, e.g. TC-CRX-131).
