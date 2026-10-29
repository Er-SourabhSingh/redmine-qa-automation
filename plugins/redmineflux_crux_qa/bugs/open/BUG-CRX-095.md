# Bug Report Template

- Bug ID: BUG-CRX-095
- Production Redmine Issue ID: #125961
- Title: QA Agent's own advertised persona description ("reports coverage and run status, never creates a case") contradicts its actual, routine behavior of creating test cases
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, agent picker / "Who answers" dropdown)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Open Ask Crux, click the agent-picker dropdown ("Who answers").
2. Read the one-line description shown next to **QA Agent**.
3. Set mode to **Auto** (or pin to QA Agent directly), fresh chat: "in the Crux QA Agent Test Project, can you create a test case titled 'Auto-route check 1'?"
4. Confirm the resulting card and verify via DB.

## Expected result

Either (a) the QA Agent's advertised description is accurate and it should refuse/hand off any test-case-creation request, or (b) if it genuinely can and should create test cases (as this entire test suite's TC-CRX-294 through TC-CRX-352 already establish it routinely does), the description shown to the user should say so, not claim the opposite.

## Actual result

The agent-picker's own description text for QA Agent reads: *"reports coverage and run status, **never creates a case**."* Despite this, the exact same QA Agent (both pinned and via Auto) produced a valid confirm card (`Testcases Management Create Testcase`, `Project: Crux QA Agent Test Project`, `Subject: Auto-route check 1`) and, on Confirm, genuinely created the test case — verified via DB: `issues` id=14, subject "Auto-route check 1", tracker_id=4 (Testcase), project_id=3. This is not a one-off: the entire TC-CRX-294–352 suite shows QA Agent creating/updating/deleting test cases, suites, environments, reports, and runs dozens of times.

## Evidence

### Console / log

- Agent-picker tooltip/label text (verbatim): *"QA Agent — reports coverage and run status, never creates a case"*.
- Chat reply (verbatim): *"I'll do this (Testcases Management Create Testcase) — confirm?"* with confirm card `Project: Crux QA Agent Test Project`, `Subject: Auto-route check 1`.
- DB verification: `SELECT id, subject, tracker_id, project_id FROM issues WHERE subject ILIKE '%Auto-route check%';` → `14 | Auto-route check 1 | 4 | 3`.

## Duplicate check

- Duplicate found: No. This is a UI/documentation-vs-behavior mismatch, not previously filed — distinct from every routing/data-correctness bug in this suite (BUG-CRX-079 through 094), none of which concern the agent picker's own self-description text.
