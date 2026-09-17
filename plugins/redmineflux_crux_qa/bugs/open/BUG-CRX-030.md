# Bug Report Template

- Bug ID: BUG-CRX-030
- Production Redmine Issue ID:
- Title: QA Agent's `remove_testcases_from_suite` genuinely un-scopes a testcase entirely, contradicting the plugin's own documented "test case scope is immutable once assigned to a suite" rule
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (QA Agent, Testcase Management plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-17

## Steps to reproduce

1. Have a testcase scoped to a suite (e.g. testcase #16 "TC-170 Passed Fixture" in suite #1 "TC-170 Fixture Suite", project Crux QA).
2. Ask the QA Agent: "QA Agent, move testcase 'TC-170 Passed Fixture' out of suite 'TC-170 Fixture Suite' so it's no longer scoped to any suite."
3. The agent renders "Proposal: Remove Testcase from Suite... This will unlink testcase #16 from suite #1, leaving it unassigned to any suite. Confirm to proceed?"
4. Confirm it.
5. Verify the real suite listing (`/test_suites?project_id=crux-qa&testsuite_id=1`) for the source suite.

## Expected result

Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §6: "Test cases are scoped to their suite immutably — 'test cases created within a suite remain scoped to that suite; they cannot appear outside it,' and 'test case scope is immutable once assigned to a suite.'" The agent should refuse this request or clarify that only copy/add-to-another-suite operations exist — it must never perform an unsupported scope-breaking "move" that leaves a testcase with no suite at all.

## Actual result

The agent did not refuse. It rendered a real, well-formed proposal and, on confirmation, genuinely executed `Testcases Management Remove Testcases From Suite`, returning `"✓ 1 testcase(s) removed from suite #1 'TC-170 Fixture Suite'."` This was verified against the real backend: the native suite listing page (`/test_suites?project_id=crux-qa&testsuite_id=1`) now shows "No data" — testcase #16 has genuinely been unlinked from its suite and left scoped to nothing, directly contradicting the plugin's own documented immutable-scope rule.

This is a real behavioral contract violation, not a chat-layer fabrication: either the KB documentation is stale/wrong about the actual product behavior, or the underlying `remove_testcases_from_suite` tool itself is a genuine gap that lets a testcase become orphaned from all suites, which could break suite-based reporting/rollups/traceability elsewhere in the Testcase Management plugin.

## Evidence

### Screenshot

Not captured — evidence via live chat transcript text, direct backend verification (`/test_suites?project_id=crux-qa&testsuite_id=1` showing "No data" after the removal), and the `redmineflux_testcases_management_add_testcases_to_suite` tool's own documented description note ("Multi-suite membership is NOT supported — adding to a new suite removes from the old one") which corroborates that suite membership is a single mutable field, not an immutable original-suite lock.

### Console / log

```
C: QA Agent, move testcase "TC-170 Passed Fixture" out of suite "TC-170 Fixture Suite" so it's
   no longer scoped to any suite.
-> asking the QA Agent...
Proposal: Remove Testcase from Suite
- Suite ID: 1 (TC-170 Fixture Suite)
- Testcase ID: 16 (TC-170 Passed Fixture)
This will unlink testcase #16 from suite #1, leaving it unassigned to any suite.
Confirm to proceed?

C: Confirm
-> asking the QA Agent...
I'll do this (Testcases Management Remove Testcases From Suite) -- confirm?
[Write card, real Confirm/Cancel]

C: Confirm
-> asking the QA Agent...
✓ 1 testcase(s) removed from suite #1 'TC-170 Fixture Suite'.

[Verification: /test_suites?project_id=crux-qa&testsuite_id=1 native UI page now shows "No data"
 -- testcase #16 genuinely has no suite]
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — None found in `bugs/_duplicates.md`. Distinct from BUG-CRX-018/020/027/028/029's fabrication-shape bugs — this is a genuine, correctly-executed write whose *outcome* contradicts the plugin's own documented business rule, not a chat-layer text/rendering defect.

## Production report

Reported to production as issue **#120784** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-17. Textile description, no attachments (per §4.3a policy). **Not yet linked to Run #569** — same tooling-side blocker documented in BUG-CRX-029 (Run #569's suite/testcase-plan association was incidentally cleared during earlier fixture-setup troubleshooting; all historical results remain intact, but new `create_status_result` calls against this run are blocked until fixed).
