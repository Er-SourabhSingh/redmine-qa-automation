# Bug Report Template

- Bug ID: BUG-CRX-080
- Production Redmine Issue ID: #125488
- Title: QA Agent's "Create Test Suite" confirm card once resolved the wrong project (a different, unrelated project from an earlier conversation) despite the user's message explicitly naming the correct project by name, inside a chat session where every prior Create/Update Testcase request had correctly resolved the same named project
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-26

## Steps to reproduce

1. As `luna.blossom`, in a chat session (QA Agent) that had already run 3 prior turns in the same session, each correctly resolving "Crux QA Agent Test Project": "create a test case..." (TC-CRX-294/295), "what's test case #4 about?" (TC-CRX-296), "update test case #4..." (TC-CRX-297) — all 3 confirm/response cards correctly showed `Project: Crux QA Agent Test Project`.
2. In the **same** chat session, send: "in the crux qa agent test project, can you create a test suite called 'Authentication'?" — identical project-naming phrasing used successfully in every prior turn.
3. Observe the resulting confirm card's `Project` field.
4. In a **fresh** chat session (new conversation, no prior turns), resend the exact identical message and compare.

## Expected result

The same explicit project name, phrased identically to 3 already-successful prior turns in the same conversation, should resolve to the same correct project every time — "Crux QA Agent Test Project" — regardless of which specific write tool (Create Testcase vs. Create Test Suite) is being invoked.

## Actual result

1. **Within the long-running session**: the confirm card for `Testcases Management Create Test Suite` showed `Project: Crux PM Agent Test Project` — a **different, unrelated project** (one this user/session had been used to test extensively earlier the same day, in an unrelated part of this QA engagement) — not the QA Agent Test Project named in the message. Clicked **Cancel** rather than Confirm, out of caution.
2. Independently verified via DB (`SELECT * FROM testsuites`) that no suite was created in either project — the Cancel click was honored correctly, no silent write occurred.
3. **In a brand-new chat session, the identical message resolved correctly** — `Project: Crux QA Agent Test Project` — confirmed and genuinely created (verified via DB: `testsuites` row with the correct `project_id`).
4. This strongly suggests some form of **context leakage/contamination specific to the Create Test Suite tool's project-resolution step**, possibly drawing on stale conversation history, a cached/previous tool-call result, or a different project reference from much earlier in a long session — while the Create/Update Testcase tools in the very same session never showed this symptom.

## Evidence

### Console / log

- Wrong-project confirm card (verbatim table): `Project: Crux PM Agent Test Project`, `Name: Authentication`.
- Correct confirm card (fresh chat, verbatim table): `Project: Crux QA Agent Test Project`, `Name: Authentication`.
- DB verification after Cancel: `testsuites` table empty (0 rows) immediately after.
- DB verification after the fresh-chat Confirm: `testsuites` row `id=1, name=Authentication, project_id=crux-qa-agent-test-project` — correct.

## New repro — 2026-10-27, Update Environment (2nd tool hit, same wrong-project value)

Same session-length pattern, a different tool: asking the QA Agent (long-running chat, several prior turns) "can you rename the 'Staging' environment to 'Staging-EU'?" produced a confirm card showing `Project: Crux PM Agent Test Project` — the same wrong, unrelated project seen in the original Create Test Suite repro — despite "Staging" only existing in "Crux QA Agent Test Project" and 2 prior turns in the identical chat having already correctly resolved that same project for environment list/create requests. Clicked Cancel; verified via DB that no environment changed (`testcase_environments` row still named "Staging", `project_id=3`). Retried the identical message in a brand-new chat: confirm card correctly showed `Project: Crux QA Agent Test Project`, and confirming genuinely succeeded (verified via DB: name updated to "Staging-EU"). This is now the **2nd distinct tool** (after Create Test Suite) hit by the identical session-length-dependent wrong-project pattern, strengthening the hypothesis that this is a shared project-resolution code path issue rather than a one-off.

## New repro — 2026-10-27, Update Report (3rd tool hit, same wrong-project value)

Same session-length pattern, a 3rd tool: asking the QA Agent (long-running chat) "...can you rename the 'Weekly QA Summary' report to 'Weekly QA Summary v2'?" — the agent's own natural-language pre-check correctly said *"This will update the report name in the Crux QA Agent Test Project"*, but the resulting confirm card showed `Project: Crux PM Agent Test Project` — the same wrong, unrelated project as the other 2 reproductions. Clicked Cancel; verified via DB no change (`testcase_reports` name still "Weekly QA Summary", project_id=3). Retried the identical message in a brand-new chat: confirm card correctly showed `Project: Crux QA Agent Test Project`, and confirming succeeded (verified via DB: name updated to "Weekly QA Summary v2"). Notably, the agent's own preceding prose got the project right while the structured confirm-card payload got it wrong — suggesting the project-resolution defect is isolated to the final tool-call-argument assembly step, not the agent's overall reasoning about the request.

## New repro — 2026-10-27, Create Status Result (4th tool hit, same wrong-project value)

Same session-length pattern, a 4th tool: asking the QA Agent (long-running chat) "can you mark test case #6 in the 'Sprint 1 Regression' run as Passed?" produced a confirm card with every field correct (`Run: 1`, `Issue: 6`, `Testsuite: 1`, `Case Status: 2`, `Environment: Staging`) except `Project: Crux PM Agent Test Project` — the same wrong, unrelated project as the other 3 reproductions. Cancelled; verified via DB no change (`issue_status_results` for run 1 unchanged, still the default Untested row). Retried the identical request in a brand-new chat (this time explicitly naming the project in the message): confirm card correctly showed `Project: Crux QA Agent Test Project`, and confirming succeeded (verified via DB: a new Passed result recorded for issue 6 in run 1).

## Note for triage

**Reproduction count: 4 of 4 attempts in a long-running session (across 4 different tools — Create Test Suite, Update Environment, Update Report, Create Status Result), 0 of 4 in a fresh session** — this needs more repros to pin down a reliable trigger, but is flagged now because of its severity class: a silently-wrong **write target** (not just a wrong read or a cosmetic error) is a more dangerous shape than most false-denial/fabrication bugs in this suite, since confirming it would have written real data into the wrong project with no warning beyond the easily-overlooked project name in a results table. Recommend the dev check whether `create_test_suite`'s project-resolution step reuses a stale cached project reference (e.g. "last project touched by the Crux dashboard elsewhere," "last project referenced by any agent," or a leftover value from a different domain's session state) instead of re-resolving the project named in the current message, the way the Testcase create/update/read tools evidently do correctly every time. Given the one-off nature so far, treat this as a priority investigation item rather than a confirmed deterministic defect — but always re-verify the `Project` field on any Create Test Suite confirm card before confirming, especially in a long-running session that has touched multiple projects.

## New repro — 2026-10-27, Report Defect (link-existing-defect path), wrong project in a long chat

As `luna.blossom`, asking to mark a testcase Blocked and link it to an already-existing defect by name, in a chat with several prior turns, eventually (after 3 "please continue" turns forced by repeated token-budget cutoffs) produced a confirm card showing the **wrong project** (`Crux PM Agent Test Project`, not the actual Crux QA Agent Test Project), plus `Run: 2` and `Environment: Test` — none of which exist in the correct project's data (our actual data: run #7, environment "Staging"). Canceled rather than confirmed; no write occurred. Extends this bug to a 5th tool (`report_defect`'s existing-defect-link path). See **BUG-CRX-091** for the severe, separate cost/non-convergence problem this same request shape triggers regardless of project correctness — even a fresh chat with the project named explicitly in the very first message still never reached a confirm card after 3 "please continue" turns and $0.13.

## Duplicate check

- Duplicate found: No — this is a project-resolution failure on a **write-target field**, distinct from every other wrong/hallucinated-ID bug in this suite's history (BUG-CRX-015/019/038/043/050/052/079), which are about a field *value* being wrong, not the *project the write lands in*. Also distinct from the fabricated-confirm-card family (BUG-CRX-020/027/028/056/077) — this card was genuine and fully functional, just targeting the wrong project.
