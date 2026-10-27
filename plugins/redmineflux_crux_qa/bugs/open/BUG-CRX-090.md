# Bug Report Template

- Bug ID: BUG-CRX-090
- Production Redmine Issue ID: #125498
- Title: QA Agent's answer to "show me the traceability matrix" falsely claims "test cases do not currently have explicit requirement links attached" despite a genuine, pre-existing requirement↔testcase link — reached after burning 10 tool calls and hitting the turn's token budget
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin-equivalent (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with a genuine requirement↔testcase link already in place (requirement #1 "User must be able to reset password via email" ↔ testcase #7 "Verify password reset email is sent," created earlier this session via TC-CRX-316, confirmed via DB `requirement_issues` table and independently confirmed via the plugin's own native `/traceability_rtms?project_id=...` page, which correctly shows this exact link plus its downstream defect #10).
2. In Ask Crux chat (QA Agent): "in the Crux QA Agent Test Project, can you show me the traceability matrix — which requirements are covered by which test cases and defects?"
3. Observe the reply.

## Expected result

Since no dedicated traceability-matrix MCP tool exists (confirmed, see BUG-CRX-084's broader finding that Requirements have zero MCP tool support), the agent should either (a) honestly state it cannot answer this because the capability doesn't exist via chat, pointing to the native `/traceability_rtms` page, or (b) if it does attempt a partial answer from available data, it must not assert a specific false claim about data it never actually checked (there is no `list_requirement_issues`/similar tool for it to have checked in the first place).

## Actual result

The agent burned 10 tool calls building a testcase/defect table (itself reasonably accurate), then concluded: *"The test cases do not currently have explicit requirement links attached."* This is **false** — testcase #7 genuinely has a requirement link (`requirement_issues` row: requirement_id=1, issue_id=7), which is independently visible in the plugin's own native Traceability Matrix page. The agent never actually attempted to check for requirement links via any tool (none exists) yet still asserted a specific negative ("links are not currently attached") rather than disclosing it had no way to check. The turn then **hit its own token budget mid-answer** (*"(Stopped: this turn's token budget was reached; the answer above may be partial.)"*), having spent most of its budget building an unrelated testcase/defect table instead of answering the actual question asked.

## Evidence

### Console / log

- Exact false claim (verbatim): `"The test cases do not currently have explicit requirement links attached."`
- DB verification: `SELECT * FROM requirement_issues;` → 1 row (`requirement_id=1, issue_id=7`) — the link genuinely exists.
- Native UI verification: `/traceability_rtms?project_id=crux-qa-agent-test-project` → table shows `Requirement #1 : User must be able to reset password via email` → `Testcase #7 : Verify password reset email is sent` → `Defect #10 : Password reset email not being sent on valid request`, exactly matching the DB.
- Turn ended with: `"(Stopped: this turn's token budget was reached; the answer above may be partial.)"` after `173,200 in / 1,505 out` tokens and "Checked 10 things."

## Note for triage

Distinct from BUG-CRX-084 (that bug is about the *write* path — no tool to link a testcase to a requirement by name at creation time). This is a *read*-path false claim about data that does exist, reached via an inefficient 10-tool-call path that burned the turn's budget before it could even attempt the actual question. Same false-capability/wrong-answer family as BUG-CRX-065/089 (confident wrong statements about real capabilities/data), but the first instance where the false claim contradicts data visible on the plugin's own dedicated native page for this exact feature (Traceability Matrix).

## Duplicate check

- Duplicate found: No — distinct from BUG-CRX-084 (write-path capability gap) and BUG-CRX-089 (wrong data model substituted for a different feature, To-Do). First instance of a confident false claim specifically contradicting the plugin's own Traceability Matrix feature.
