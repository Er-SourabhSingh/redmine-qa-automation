# Bug Report Template

- Bug ID: BUG-CRX-091
- Production Redmine Issue ID:
- Title: QA Agent's "link testcase result to an existing defect by name" request never converges — re-discovers the same tools from scratch on every turn and hits the per-turn token budget repeatedly, burning $0.13-0.25+ across 3-5 forced "please continue" turns without ever reaching a confirm card (reproduced twice: once in a long chat, once in a brand-new chat with the project named explicitly)
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin-equivalent (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with a real run ("Bulk Status Fixture Run"), real testcase ("Reset password with valid email"), and a real, already-existing defect issue ("Password reset email not being sent on valid request," issue #10) all in place.
2. In Ask Crux chat (QA Agent): "for the '[run]' run, can you mark test case '[testcase]' as Blocked and link it to the existing defect '[defect subject]'?"
3. Observe the turn end with `(Stopped: this turn's token budget was reached; the answer above may be partial.)` after only a fragment of progress (e.g. "Let me check what groups are available," "Now let me check the case statuses," "Good! Now let me search for the defect issue by subject").
4. Reply "please continue" and observe the next turn **restart tool discovery from scratch** rather than resuming from where the previous turn left off (e.g. a turn that had JUST found defect #10 is followed by a next turn re-announcing "I found the defect issue (#10)" as if newly discovered).
5. Repeat step 4 up to 3-5 times; a confirm card is reached only inconsistently, and even then (see BUG-CRX-080's repro in the same session) may show wrong project/run/environment data.

## Expected result

A request this simple — mark one testcase's status and link one already-known defect issue — should resolve in 1-2 tool calls (`list_case_statuses` to resolve "Blocked," then `report_defect` with `defect_issue_id` set) within a single turn, the same way the equivalent "create a NEW defect" variant of this request succeeded cleanly in ~2 turns earlier this session (see TC-CRX-343). Each "please continue" turn should build on the previous turn's own tool results (already in the conversation's tool-call history) rather than re-invoking the same discovery tools again.

## Actual result

Two independent reproductions, both never converging efficiently:
- **Repro 1 (long chat, several prior turns):** 4 total turns (1 initial + 3 "please continue"), $0.16 cumulative, before finally reaching a confirm card — which then also had the wrong project (folded into BUG-CRX-080).
- **Repro 2 (brand-new chat, project named explicitly in the first message):** 4 total turns, $0.13 cumulative tracked before this investigation was stopped (the turn sequence: "Let me check what groups are available" → budget stop → "Now let me check the case statuses" → budget stop → "Good! Now let me search for the defect issue by subject" → budget stop) — each turn re-doing discovery work a prior turn in the *same* chat had already done, rather than resuming.

Each individual turn was honest about hitting its budget (no fabrication), but the **pattern across turns** — re-announcing "discovery" of facts already established earlier in the same conversation — indicates the agent isn't using its own prior tool-call history efficiently for this specific request shape, unlike the otherwise-similar "create a new defect" flow which resolved cleanly.

## Evidence

### Console / log

- Repro 1 turn sequence (verbatim fragments): `"Excellent! I found the defect issue (#10). Now I need to discover the tools for marking test cases as blocked and reporting defects. Let me check what tools are available:"` → `"I'll do this (Testcases Management Report Defect) — confirm?"` (wrong project, see BUG-CRX-080).
- Repro 2 turn sequence (verbatim fragments): `"Let me check what groups are available:"` → `"Now let me check the case statuses:"` → `"Good! Now let me search for the defect issue by subject:"` — three consecutive turns, each one step further than a genuinely fresh start would be, but clearly not reusing full context efficiently (compare: the equivalent new-defect flow, TC-CRX-343, needed only 2 turns total for the entire request).
- Token/cost figures from chat UI: Repro 1 ended at `476,192 in / 3,087 out · $0.09` cumulative before the final (wrong-project) confirm card; Repro 2 reached `498,580 in / 3,140 out · $0.13` cumulative after 3 continues with still no confirm card.

## Note for triage

Distinct from BUG-CRX-078 (that bug is a single-turn full-cache-miss cost spike, $0.1187 for one turn). This is a **multi-turn, cross-turn inefficiency** specific to the "link an existing defect by subject name" request shape — the agent appears to re-run its tool-group/case-status/defect-lookup discovery sequence on every continuation rather than treating it as already-known context, unlike the structurally similar "create a new defect" flow (TC-CRX-343), which completed in 2 clean turns. Worth flagging to the dev as a possible session/context-window handling issue specific to this tool combination (`list_case_statuses` + an issue-search step + `report_defect` with `defect_issue_id`), since the new-defect variant (`report_defect` with `defect_subject` instead) does not show the same pattern.

## Duplicate check

- Duplicate found: No — same broad "excessive tool calls / inefficient" theme as BUG-CRX-065 and BUG-CRX-078, but the first instance of a request failing to converge across *multiple user-forced continuation turns* rather than within a single turn. Not a duplicate of BUG-CRX-080 (wrong project) — that's a separate, compounding defect on the same repro.
