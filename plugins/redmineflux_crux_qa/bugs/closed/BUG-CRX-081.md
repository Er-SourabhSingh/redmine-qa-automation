# Bug Report Template

- Bug ID: BUG-CRX-081
- Production Redmine Issue ID: #125489
- Title: QA Agent silently drops the "create this test case inside suite X" request — creates the test case genuinely but never links it to the named suite, reports plain success with no disclosure, despite a genuine two-step tool path (create_testcase + add_testcases_to_suite) existing to do it correctly
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with a real test suite "Password Reset" already existing in "Crux QA Agent Test Project".
2. In Ask Crux chat (QA Agent): "can you create a test case titled 'Reset password with valid email' inside the 'Password Reset' test suite?"
3. Observe the resulting confirm card's fields.
4. Confirm.
5. Independently check via DB whether the new test case is genuinely linked to the named suite (`issue_test_suites` table) or left unassigned.

## Expected result

Since the request explicitly named a suite the test case should belong to, the agent should either (a) genuinely place it there via a second tool call once the test case is created — the `redmineflux_testcases_management_add_testcases_to_suite` tool exists and is exactly built for this — or (b) if it cannot do this for some reason, honestly disclose the limitation ("I can create the test case, but I don't have a way to also put it in a suite in the same step — would you like me to try linking it afterward?") rather than silently proceeding as if the whole request was fulfilled.

## Actual result

1. The confirm card for `Testcases Management Create Testcase` showed only `Project` and `Subject` — no suite field at all, and no mention anywhere in the proposal that the suite part of the request would not be honored.
2. Confirming produced: *"✓ Testcase created: \"Reset password with valid email\" (tracker #4, project #3)"* — a plain, unqualified success message, with zero mention of the suite either succeeding or failing.
3. Independently verified via DB: the test case (issue #5) was genuinely created, but `issue_test_suites` has **zero rows** for it — it is completely unassigned, not inside "Password Reset" or any other suite.
4. Confirmed via MCP source that `redmineflux_testcases_management_create_testcase` genuinely has **no suite/test_suite parameter at all** (`project_id, subject, description, priority_id, category_id, steps, requirement_ids` — nothing else) — so a single-call creation-into-a-suite is architecturally impossible. However, a separate, genuinely-implemented tool (`redmineflux_testcases_management_add_testcases_to_suite`) exists specifically to link an existing test case to a suite — the agent never called it as a natural follow-up to satisfy the rest of the user's request.

## Evidence

### Console / log

- Confirm card (verbatim table): `Project: Crux QA Agent Test Project`, `Subject: Reset password with valid email` — no `Suite`/`Test Suite` row.
- Success message (verbatim): `✓ Testcase created: "Reset password with valid email" (tracker #4, project #3)`.
- DB verification: `SELECT * FROM issue_test_suites WHERE issue_id=5` → 0 rows.
- MCP tool signature confirmed via source (`testcases_management.py:214`): `create_testcase(project_id, subject, description="", priority_id=2, category_id=0, steps=None, requirement_ids=None)` — no suite parameter.
- Sibling tool confirmed genuinely available: `redmineflux_testcases_management_add_testcases_to_suite` (`testcases_management.py:1704`).

## Note for triage

Also worth noting for BUG-CRX-079's triage: this tool's own docstring documents `priority_id` defaulting to `2` ("Normal") when omitted — but this instance's real priority enumeration is `[6=low, 7=medium, 8=high, 9=immediate]`, so even the tool's own **documented default** is invalid on a non-classically-seeded instance, not just the agent's guesses when a priority is named explicitly. This may be a shared root cause worth the dev checking alongside BUG-CRX-079.

This is a distinct defect class from the wrong-ID-hallucination family (BUG-CRX-079) and from the wrong-project-target family (BUG-CRX-080) — here, the part of the request the tool *can't* do is silently dropped rather than attempted-and-wrong, and a genuine two-step path to fully satisfy the request exists but is never used.

## Duplicate check

- Duplicate found: No — related to, but distinct from, the general "silent omission" pattern documented elsewhere in this suite (e.g. BUG-CRX-074, a *read*-time omission of requested information) — this is the first instance of a *write*-time silent omission, where part of a multi-part create request is dropped without disclosure despite the capability to fulfill it via an additional tool call existing and being readily available.

## Retest — 2026-10-28 (CONFIRMED FIXED — round 22/23)

Retested against round-21 build (MCP crux_development @49b50b1 — `create_testcase` now takes `test_suite_id`, checks the suite first, then adds the case to it after creation). As `luna.blossom`, "create a test case titled 'Reset password with expired link' inside the 'Password Reset' test suite" produced a confirm card showing `Test Suite: 2` (the real id). Confirming created testcase #12 and genuinely linked it to suite 2 — verified via DB join on `issue_test_suites`.

**Production synced 2026-10-28**: #125489 → Status Done, % done 100.
