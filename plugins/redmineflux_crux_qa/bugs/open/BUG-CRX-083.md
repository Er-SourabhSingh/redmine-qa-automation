# Bug Report Template

- Bug ID: BUG-CRX-083
- Production Redmine Issue ID: #125491
- Title: QA Agent's "Create Environment" guesses an invalid empty `components` list on retry (despite the field being tool-required) instead of either defaulting consistently or asking the user, requiring 3 attempts in one chat to land on a valid value
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role — `manage_environment` permission genuinely granted)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom` (with `manage_environment` genuinely granted — see Note below), in Ask Crux chat (QA Agent): "in the Crux QA Agent Test Project, can you create a test environment called 'Staging'?" — the user never mentions "components" at all.
2. First reply: a transient tool-discovery failure ("I can't access the environment creation tool at this moment... disconnect with the group discovery system") — not the subject of this bug, noted separately in `CRUX_MEMORY.md` as a one-off flake (self-resolved on retry, not reproduced again).
3. Click "Ask again" — second attempt produces a confirm card with `Components: []` (an empty list).
4. Click Confirm.
5. Observe the failure, then reply "yes please create it" and observe the third attempt's confirm card.

## Expected result

Since `components` has no basis at all in the user's request, the agent should either (a) consistently default it to something valid (e.g. `[name]`, as it did on the very first pre-failure attempt) every time, or (b) ask the user what components the environment needs — not alternate between a valid guess, an invalid empty list, and then a different valid guess across three calls for an unchanged request.

## Actual result

1. **Attempt 2** (after the transient tool-discovery failure): confirm card showed `Components: []`. Confirming failed: **"✓ components must be a non-empty list."** (the leading `✓` on a genuine failure is the already-documented misleading-checkmark defect — folded into **BUG-CRX-082** as a new repro, not re-filed here.) Verified via DB: no row in `testcase_environments` — honest failure despite the misleading prefix.
2. **Attempt 3** (user said "yes please create it", no new information): confirm card now showed `Components: ['Staging']` — a different, valid value, self-corrected without ever asking the user or explaining the change. Confirming succeeded: verified via DB (`testcase_environments` id=1, name='Staging', components='Staging', project_id=3).
3. Three calls for the identical, never-changing request produced three different behaviors (tool-unavailable error, invalid-empty-list failure, valid success) — the required `components` field is being filled non-deterministically rather than through any consistent default or clarifying question.

## Evidence

### Console / log

- Attempt 2 confirm card (verbatim): `Project: Crux QA Agent Test Project`, `Name: Staging`, `Components: []`.
- Attempt 2 failure (verbatim): `✓ components must be a non-empty list.`
- Attempt 3 confirm card (verbatim): `Project: Crux QA Agent Test Project`, `Name: Staging`, `Components: ['Staging']`.
- Attempt 3 result: genuine success, verified via DB.

## Note for triage

This surfaced only after a same-session **fixture correction**: the `manage_environment` permission (introduced by a real code-level security fix per the controller's own comment — `rftc-012 H3 (TCM-009): no auth check at all`) was missing from both QA fixture roles, contradicting this suite's own precondition note (copied from the plugin's user guide) that "Environments are not guarded." That note is now known-stale and has been corrected in `CRUX_AGENT_QA_TESTCASES_MANAGEMENT.md`'s precondition section — this bug is about the agent's `components` field handling, observed only once the permission was fixed and a confirm card was actually reachable.

## Duplicate check

- Duplicate found: No. Related to the broader "doesn't reliably resolve/default a field" family (BUG-CRX-079 and its predecessors) but a distinct sub-shape: those bugs guess a wrong *ID* for a field the user did name (priority, project, suite); this bug invents a *whole field's value* (`components`) that the user never mentioned at all, and does so inconsistently across identical retries in the same chat.
