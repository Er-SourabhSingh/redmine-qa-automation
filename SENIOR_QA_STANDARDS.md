# Senior QA Testing Approach & Bug Management Standards

## Overview

This document defines the senior QA testing approach, execution standards, validation strategy, bug reporting rules, and failure management process for plugin testing using:

- Microsoft Playwright
- MCP automation
- Claude AI-assisted testing
- Redmine plugin ecosystem

This document focuses only on:

- Testing approach
- Validation strategy
- Bug creation standards
- Duplicate bug prevention
- Screenshot evidence handling

---

## Configuration References

> All credential, server, and session configuration must be read from the common credentials file before any test execution begins.

| Config Type | File |
|---|---|
| Known environments (Forge/Local), role-based users, session rules | [`QA_CREDENTIALS.md`](QA_CREDENTIALS.md) |

**Rule:** Never hardcode credentials or base URLs in test files. Always load them from `QA_CREDENTIALS.md`.

---

## 1. Senior QA Testing Philosophy

Testing must simulate real business behavior instead of only validating technical functionality.

The framework must validate:

- Real user workflows
- Real permission behavior
- Real project operations
- Real approval flows
- Real cross-user interactions
- Real business restrictions

Testing should behave like a senior manual QA engineer with automation capabilities.

---

## 2. Testing Approach Standards

### Core Testing Areas

The framework must cover:

- Functional testing
- Regression testing
- Permission testing
- Workflow testing
- UI testing
- Multi-language testing
- Integration testing
- Negative testing
- Upgrade compatibility testing

---

## 3. Real Business Scenario Testing

Automation must validate real-world workflows.

### Required Coverage

Validate:

- Multi-user operations
- Cross-role workflows
- Approval chains
- Rejection flows
- Resubmission flows
- Cross-project behavior
- Large datasets
- Bulk operations

Avoid unrealistic dummy-only testing.

---

## 4. Permission Testing Approach

Every feature must be validated using multiple user roles.

### Required Roles

- Admin
- Manager
- Developer
- QA Engineer
- Client
- Non-member
- Read-only user

### Required Validations

Validate:

- View permissions
- Create permissions
- Edit permissions
- Delete permissions
- Approval permissions
- Workflow restrictions
- Self-action restrictions
- Cross-user restrictions

---

## 5. Workflow Testing Approach

Workflow validation must include:

- Status transitions
- Approval sequence
- Rejection handling
- Reopen behavior
- Final approver logic
- Admin override behavior
- Invalid transition prevention

---

## 6. Multi-language Testing Approach

Validate:

- Translation consistency
- UI alignment
- Text truncation
- Broken layouts
- Incorrect meanings
- Tooltip translations
- Placeholder translations
- Button labels

### Translation Validation Rule

**DO NOT create bugs when:**

- Wording differs
- Meaning remains correct

**Create bugs ONLY when:**

- Meaning changes
- Action becomes misleading
- Translation breaks workflow understanding

---

## 7. Negative Testing Approach

Always validate:

- Invalid permissions
- Unauthorized actions
- Invalid workflows
- Empty field submissions
- Duplicate data handling
- Cross-user conflicts
- Invalid transitions
- Backend validation failures

---

## 8. UI Validation Standards

Validate:

- Button visibility
- Field visibility
- Form validation
- Popup behavior
- Table rendering
- Pagination
- Filters
- Search functionality
- Responsive layout stability

---

## 9. Browser & Network Validation

Every execution must validate:

### Browser Console

- JavaScript errors
- Vue/React rendering issues
- Missing assets
- Console exceptions

### Network

- Failed API calls
- 404 requests
- 500 responses
- Unauthorized requests
- Permission-denied responses

---

## 10. Test Execution Standards

Before execution, load server and credential details from [`QA_CREDENTIALS.md`](QA_CREDENTIALS.md), then verify:

- Verify target server is running at the configured base URL
- Verify login page accessibility
- Verify authentication works using configured credentials
- Verify required plugin is installed
- Verify setup configuration is loaded

If startup validation fails:

- Stop execution immediately
- Generate setup failure log
- Do not continue test case execution

---

## 11. Authentication Testing Rules

When login is required, always use users from setup configuration.

Do not create random users if setup users already exist.

### Credential & Server Source

All credentials and server details must be sourced exclusively from:

- **[`QA_CREDENTIALS.md`](QA_CREDENTIALS.md)** for every run, Forge or local

This file contains:

- Base URL
- Admin credentials
- Environment-specific users
- Session storage paths (`playwright/.auth/`)
- Login validation and failure handling rules

**Never define credentials inline in test code.** Always load from the active environment file.

---

## 12. Bug Creation Standards

Whenever a bug is found, the following are mandatory:

- Create bug report
- Include Redmine version
- Attach failure screenshot
- Include reproduction steps
- Include expected result
- Include actual result
- Include environment details
- Include browser information
- Include user role information

---

## 13. Screenshot Evidence Rules

Every bug report must contain:

- Failure screenshot
- Visible failure area
- Relevant page state
- Browser timestamp if available

Screenshots must clearly demonstrate the issue.

---

## 14. Duplicate Bug Prevention Rules

Before creating a bug, validate:

- Existing open bugs
- Existing reported failures
- Existing screenshots
- Existing test case failure logs
- Existing error messages

**DO NOT create duplicate bugs for:**

- Same root cause
- Same validation issue
- Same UI issue
- Same permission issue
- Same workflow failure

Instead:

- Reuse existing bug reference
- Append additional evidence if needed

---

## 15. Bug Deduplication Logic

A bug must be treated as duplicate when:

- Same functionality fails
- Same root cause exists
- Same API failure exists
- Same UI rendering issue exists
- Same permission validation fails
- Same workflow transition fails

Even if:

- Different users reproduce it
- Different browsers reproduce it
- Different test cases trigger it

---

## 16. Bug Closure & Retest Rules

### Rule: Move bug file when fix is confirmed

When a bug is retested and confirmed **FIXED**, the bug file **must** be moved from `bugs/open/` to `bugs/closed/` before the session ends.

**A bug file must never remain in `bugs/open/` after its retest result is PASS.**

### Steps on every fix + retest

1. Complete retest — confirm the fix across every TC that was BLOCKED by this bug
2. Update the bug file: set `Status → FIXED`, add `Fix Date`, `Retest Date`, `Retest Result`
3. **If the bug's `Production Redmine Issue ID` field is filled in**, sync the production issue before (or together with) closing locally: status **In QA → Done**, **% done → 100**, via redmineflux MCP, following the write-approval workflow in `REDMINEFLUX-MCP-SETUP.md` §4.3 — prepare the exact change, wait for explicit approval, execute, then report the result. Skip this step if the field is blank (bug was never reported to production).
4. **Copy the updated file to `bugs/closed/BUG-<CODE>-XXX.md`**
5. **Delete the original file from `bugs/open/BUG-<CODE>-XXX.md`** — the open folder must never retain a fixed bug
6. Update `bugs/_index.md` — change Status to `Closed`, update File Path to `bugs/closed/BUG-<CODE>-XXX.md`
7. Update the plugin's consolidated `reports/<PREFIX>-tc-report-<date>.md` (see `CLAUDE.md` §7) — move the bug's entry to Closed/FIXED in the Bugs/Defects table, and change BLOCKED → PASS for every TC blocked by this bug in the TC Execution Summary, with a fix-ref note (bug ID + retest date)
8. Update the plugin's changelog (`docs/changelog.md`, or the Run History table in `<PREFIX>_HANDOFF.md` — see `CLAUDE.md` §2b) — add a row for the fix retest session
9. Update the plugin's handoff file — remove the bug from the Blockers section
10. Update `STATUS.md` — decrement Open Bugs count, update Status description

### Bug folder states

| State | Folder | Example |
|-------|--------|---------|
| Open — confirmed, not yet fixed | `bugs/open/` | `bugs/open/BUG-RAF-001.md` |
| Closed — fix confirmed by retest PASS | `bugs/closed/` | `bugs/closed/BUG-RAF-001.md` |
| Duplicate / not reproducible | `bugs/_duplicates.md` | entry in the log |

**The `bugs/open/` folder must be empty when all bugs for the current cycle are fixed.**

---

## 17. Bug Title Standards

All bug titles must use **sentence case**.

**Correct example:**

> User able to move workload task to another user causing duplicate validation error

**Do NOT use title case.**

---

## 18. Failure Artifact Collection

On failure automatically capture:

- Screenshot
- Video
- Trace
- Console logs
- Network logs

Preserve artifacts for debugging and reporting.

---

## 19. Reporting Standards

Execution reports must include:

- Passed test cases
- Failed test cases
- Skipped test cases
- Bug references
- Screenshot references
- Failure summaries
- Environment details

---

## 20. AI-Assisted Testing Standards

When using AI-generated automation, the framework must:

- Follow existing business workflows
- Reuse setup configuration
- Avoid duplicate logic
- Avoid duplicate bug creation
- Capture proper evidence
- Generate readable logs
- Follow stable testing practices

---

## 21. Final Senior QA Rules

These rules are mandatory for all future plugin testing:

- Always validate real business workflows
- Always validate permissions
- Always validate workflows
- Always validate browser console errors
- Always validate network failures
- Always attach screenshots to bugs
- Always prevent duplicate bug creation
- Always use stable automation practices
- Always validate authentication stability
- Always use setup-configured users and data
- Always preserve debugging artifacts
- Always follow senior QA reporting standards

---

## Final Goal

The final QA automation system should behave like a senior QA engineer:

- Business-aware
- Workflow-aware
- Permission-aware
- Failure-aware
- Reporting-aware
- Stable
- Maintainable
- Scalable

The framework must prioritize:

- Accurate validation
- Reliable automation
- Clear reporting
- Strong evidence collection
- Duplicate bug prevention
- Real-world workflow testing

---

## 22. Screenshots Rules

### Folder structure

```
screenshots/
├── TC-RAF-001/          ← one subfolder per test case executed
│   └── tc-raf-001-pass.png
├── TC-RAF-002/
│   └── tc-raf-002-pass.png
├── BUG-RAF-001/         ← one subfolder per bug found
│   ├── bug-raf-001-alert-fired.png
│   └── retest-2026-05-21-fixed.png
└── BUG-RAF-002/
    ├── bug-raf-002-validation-error.png
    └── retest-2026-05-21-pass.png
```

### TC screenshots

- **Take one screenshot per test case** — capture the final state that confirms PASS or FAIL.
- Save under `screenshots/<TC-ID>/` using the naming pattern `<tc-id>-<result>.png`
  - PASS example: `screenshots/TC-RAF-001/tc-raf-001-pass.png`
  - FAIL example: `screenshots/TC-RAF-001/tc-raf-001-fail.png`
- Screenshot must show the relevant page state that proves the TC result.

### Bug screenshots

- Take a screenshot **at the exact moment the bug is observed** — show the failure area clearly.
- Save under `screenshots/<BUG-ID>/` using a descriptive name (e.g. `bug-raf-001-alert-fired.png`).
- For retest evidence, save under the same `screenshots/<BUG-ID>/` folder with a retest prefix (e.g. `retest-2026-05-21-fixed.png`).

### Summary

| Screenshot type | Folder | Naming |
|-----------------|--------|--------|
| TC execution (PASS/FAIL) | `screenshots/<TC-ID>/` | `<tc-id>-pass.png` / `<tc-id>-fail.png` |
| Bug evidence | `screenshots/<BUG-ID>/` | descriptive name of the failure |
| Bug retest | `screenshots/<BUG-ID>/` | `retest-<date>-<result>.png` |

---

## 23. Reporting Rules

Generate **one consolidated report per testing cycle** — do not create separate defect, regression, or pass/fail reports:

| Report | Location | Trigger |
|--------|----------|---------|
| `<PREFIX>-tc-report-<date>.md` | `plugins/<plugin>/reports/` | Auto — end of every testing cycle. Contains: testing types performed, TC execution results, bugs/defects found (IDs + status), fix verification/retest details, regression results, final overall status (see `CLAUDE.md` §7) |
| `<PREFIX>-tc-report-<date>.pdf` | `plugins/<plugin>/reports/` | **Manual only** — generated ONLY when user explicitly requests it |

**Never auto-generate the PDF.** Always ask the user: "Testing is complete. Do you want me to generate the final PDF report?"

---

## 24. Plugin Memory Rules

Two levels of memory are maintained:

| Level | File | Scope |
|-------|------|-------|
| Global | `MEMORY.md` (root) | Rules applying to ALL plugins |
| Plugin | `plugins/<plugin>/docs/<PREFIX>_MEMORY.md` (or `docs/memory.md` for older plugins) | Plugin-specific quirks, observations, recurring issues |

Always update the plugin-level `memory.md` after a test run with new observations.
Only update root `MEMORY.md` when a rule applies globally across all plugins.

---

## 25. Pre-Test Case Writing Requirements

**Before writing any test case file (`testcases/*.md`), the following files must be read:**

| File | Location | Purpose |
|------|----------|---------|
| Requirements | `docs/<PREFIX>_REQUIREMENTS.md` (or `docs/requirements.md` for plugins scaffolded before `CLAUDE.md` §2b) | Understand what the plugin does, its features, workflows, and permission matrix |
| Features list | `docs/<PREFIX>_FEATURES_LIST.md` (or `docs/features-list.md`) | Full list of plugin features to ensure complete test coverage |
| User guide | `docs/<PREFIX>_USER_GUIDE.md` (or `docs/user-guide.md`) | Understand real end-user behavior, UI flows, and edge cases |

### Rules

- **Do not write a single test case** until all three files have been read.
- If the requirements file is missing, stop and ask:
  > "The plugin requirements file is missing. Please provide it before I can write test cases."
- If the features-list file is missing, stop and ask:
  > "The plugin features list is missing. Please provide it before I can write test cases."
- If the user-guide file is missing, stop and ask:
  > "The user guide is missing. Please provide it before I can write test cases."
- If multiple files are missing, ask for all of them in a single message before proceeding.
- Do not assume or guess plugin behavior from the plugin name alone.

### Why

Test cases written without reading requirements and user guide will:

- Miss real business workflows
- Validate wrong behavior
- Produce incomplete permission coverage
- Generate test cases that do not reflect how real users operate the plugin

---

## 26. Post-Fix Regression Testing Rules

### When regression testing is required

Regression testing is **mandatory** after a bug fix is confirmed by retest PASS. A retest only proves the specific failure is resolved — regression testing proves the fix did not break anything else.

### Regression scope — what to re-run

After a bug is confirmed fixed, run regression on:

| Category | What to test |
|---|---|
| Directly affected feature | All test cases in the suite that covers the fixed feature |
| Related features | Any feature that shares the same UI section, workflow, or data model as the bug |
| Blocked test cases | Every TC that was previously BLOCKED by this bug — verify PASS |
| Skipped test cases | Every TC that was SKIPPED because of this bug — execute fully for the first time |
| Permission paths | Re-run the relevant permission test cases for all roles that interact with the fixed area |
| Negative paths | Re-run negative test cases for the fixed area to confirm error handling still works |

### BLOCKED and SKIPPED test case rule

A TC marked **BLOCKED** or **SKIPPED** due to a bug is not considered tested — it has never produced a valid result. When the blocking bug is fixed:

- **BLOCKED TCs** — re-execute from scratch; the previous BLOCKED result is discarded.
- **SKIPPED TCs** — execute fully for the first time; they were never run due to the bug dependency.

Both must be treated as first-time executions, not retests. Record the result (PASS / FAIL) in the plugin's consolidated `reports/<PREFIX>-tc-report-<date>.md` and replace the BLOCKED/SKIPPED status with the actual outcome.

If a previously BLOCKED or SKIPPED TC fails during regression, raise a new bug — do not attribute the failure to the original fixed bug.

### Regression depth rule

| Bug severity | Minimum regression scope |
|---|---|
| Critical | Full suite re-run for the affected plugin area + all related suites |
| High | All TCs in the affected suite + adjacent feature TCs |
| Medium | All TCs in the affected suite |
| Low | The directly affected TCs only |

### Automation suite in regression

- If the affected suite has an `automation/tests/<suite>.spec.ts` (see `CLAUDE.md` §13), run it as the fast, repeatable part of the regression before or alongside manual re-execution.
- If the affected suite has **no** automation yet, this is exactly the trigger to create it: the TCs are about to be re-confirmed PASS, which is the precondition for automating them.
- Automation coverage does not replace the permission/negative-path re-runs required by severity in the table above unless those specific TCs are already automated — automate what's covered, manually re-run what isn't.

### Regression execution steps

1. Read the fixed bug file to identify the affected feature, TC IDs, and user roles.
2. Identify all test cases in scope using the table above.
3. Run the plugin's `automation/tests/` specs that cover any in-scope TC; re-execute the rest manually.
4. For each TC result:
   - **PASS** — update the TC status in the consolidated `reports/<PREFIX>-tc-report-<date>.md`; no further action needed.
   - **NEW FAIL** — raise a new bug immediately; do not reuse the closed bug ID.
5. After regression, update the plugin's changelog with a regression row (`docs/changelog.md`, or the Run History table in `<PREFIX>_HANDOFF.md`).
6. If all regression TCs pass, update the plugin's handoff file to note regression complete.

### What NOT to do

- Do not skip regression because the bug "looks isolated" — a fix can silently break shared logic.
- Do not reopen the original closed bug for a new regression failure — create a fresh bug with its own ID.
- Do not mark the fix session complete until regression has run.

### Regression result documentation

Add a row to the plugin's changelog (`docs/changelog.md`, or the Run History table in `<PREFIX>_HANDOFF.md`):

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-06-22 | X.X.X | Local / Forge | QA | Regression after BUG-XXX-001 fix — 5 TCs re-run, all PASS |

Update the consolidated `reports/<PREFIX>-tc-report-<date>.md` to reflect the regression pass results alongside the original run results.

---

## 27. Final Cycle Regression Rule

Per-bug regression (Section 26) only proves that one fix didn't break its own feature area. It does **not** prove the plugin as a whole is stable. A separate, full regression pass is required at the end of the cycle, before the plugin can be marked `Complete`.

### Trigger

- `bugs/open/` is empty — every bug found during the cycle has been fixed, retested PASS, and moved to `bugs/closed/`.
- This is the last gate before setting the plugin's `STATUS.md` row to `Complete`.

### Scope — full plugin, not just fixed areas

Unlike per-bug regression, the final cycle regression covers **every test suite** in `plugins/<name>/testcases/`, including suites that were never touched by a bug fix. A fix can have side effects outside its own feature area; only a full pass catches that.

### Execution steps

1. Confirm `bugs/open/` is empty. If not, stop — fix and close remaining bugs first.
2. Run every spec in `automation/tests/` for the plugin.
3. Manually re-execute every TC not yet covered by an automation spec.
4. For each result:
   - **PASS** — record in the consolidated `reports/<PREFIX>-tc-report-<date>.md`.
   - **NEW FAIL** — raise a new bug (`bugs/open/BUG-<CODE>-XXX.md`), do not reuse a closed bug ID. The plugin is **not** ready for `Complete` — fix, retest, then re-run the final cycle regression from step 1.
5. Add a row to the plugin's changelog (`docs/changelog.md`, or the Run History table in `<PREFIX>_HANDOFF.md`): `Final cycle regression — N suites / M TCs re-run, all PASS`.
6. Only after a full pass with zero new failures: update `STATUS.md` to `Complete`.

### Rule

**`STATUS.md` must never show a plugin as `Complete` without a passed final cycle regression on record in the plugin's changelog / Run History.** `In Progress` is correct any time bugs remain open or the final regression hasn't been run yet.
