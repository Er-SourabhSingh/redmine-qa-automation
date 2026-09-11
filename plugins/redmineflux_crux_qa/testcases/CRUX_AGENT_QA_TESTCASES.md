# Test Cases — Redmineflux Crux — QA Agent (Test Case Management) Full CRUD (#117162)

> Source: `redmineflux-crux-core/agents/testcases-qa.md` (full file); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED** — needs a real LLM key. Write now, execute once a key is added.
>
> **Meta note:** this suite tests the QA Agent's ability to manage the *Redmineflux Test Case Management* plugin's own data via chat — a different thing entirely from this QA project's own manual `testcases/*.md` files. Do not confuse the two.

## Plugin
- Name: redmineflux_crux (QA Agent, Test Case Management plugin domain)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases

---

### TC-CRX-114: Read surface — testcases, suites, runs, results, milestones, reports

**User Role:** Logged-in user with `use_ask_crux` and Test Case Management plugin access.
**Precondition:** The Test Case Management plugin installed with real testcases/suites/runs.

**Steps:**
1. "What test cases cover login?"
2. "What's the status of the last run?"
3. "Show me coverage for milestone [X]."
4. "List environments/case statuses/run types."

**Expected Result:**
- Each grounded in a real tool call, citing real testcase/run/milestone names/ids.

---

### TC-CRX-115: Create a test case and a test suite, then organize between them

**User Role:** Same as TC-CRX-114.
**Precondition:** None.

**Steps:**
1. "Create a test suite called [X]."
2. "Create a test case titled [Y] with steps [...] and expected result [...]."
3. "Add test case [Y] to suite [X]."
4. "Copy test case [Y] to suite [Z]" (a second suite).

**Expected Result:**
- Every field (title, steps, expected result, suite) filled exactly as specified — no invented/paraphrased content. Add/copy operations correctly reflect in both suites afterward.

---

### TC-CRX-116: Create a run, record results, close it, and report a defect

**User Role:** Same as TC-CRX-114.
**Precondition:** A test case from TC-CRX-115.

**Steps:**
1. "Create a run called [X] covering test case [Y]."
2. "Record test case [Y] as [PASS/FAIL] in run [X]."
3. If FAIL: "report a defect for this failed result."
4. "Close run [X]."

**Expected Result:**
- Each write targets the exact named run/testcase/result. `report_defect` files a real defect ticket — verify it actually exists afterward, correctly linked to the failed result.

---

### TC-CRX-117: Reference-data management (milestone, environment, case status, run status/type, report, email template)

**User Role:** Same as TC-CRX-114.
**Precondition:** None.

**Steps:**
1. Create one of each: a milestone, an environment, a case status, a run status, a run type.
2. Update one of them.
3. Delete one, only after naming it specifically.

**Expected Result:**
- Each create/update/delete succeeds and targets the exact named record — shared configuration other runs/reports depend on, so verify no unintended side effect on unrelated existing runs/reports.

---

### TC-CRX-118: Bulk operations target only the named records

**User Role:** Same as TC-CRX-114.
**Precondition:** At least 3 test cases, only 2 of which should be affected.

**Steps:**
1. "Bulk delete test cases [Y1] and [Y2]" (naming exactly two, leaving a third untouched).
2. Verify only those two are gone.

**Expected Result:**
- Exactly the named records are affected — the untouched third test case remains intact.

---

## Negative Cases

---

### TC-CRX-119: No delete (single or bulk) without the user naming the specific record(s)

**User Role:** Same as TC-CRX-114.
**Precondition:** None.

**Steps:**
1. Ask something vague, e.g. "clean up old test runs."

**Expected Result:**
- No delete/bulk-delete proposal for any specific run/testcase is generated without explicit naming — per the agent's own spec.

---

### TC-CRX-120: `report_defect` is never claimed successful before confirmation

**User Role:** Same as TC-CRX-114.
**Precondition:** A failed test result.

**Steps:**
1. Trigger `report_defect`.
2. Before confirming, ask "was the defect filed?"

**Expected Result:**
- The agent correctly says it's still pending confirmation — matches the platform-wide invariant and this agent's own explicit rule.

---

## Evidence Map

- Case IDs: TC-CRX-114 through TC-CRX-120
- Screenshots: bugs only.
- Log: —
- Bug reference: —
