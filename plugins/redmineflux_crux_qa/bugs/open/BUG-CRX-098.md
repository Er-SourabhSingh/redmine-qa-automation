# Bug Report Template

- Bug ID: BUG-CRX-098
- Production Redmine Issue ID: #125964
- Title: "Update Run" defaults the assignee to the current chat user instead of preserving the run's existing assignee, when the user only asked to change the environment
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fixture ground truth (verified via native UI, `/runs/1?project_id=...`): run #1 "Sprint 1 Regression" — `Environment: Staging`, `Assignee: Luna Blossom`.
2. As `admin`, fresh chat, QA Agent: "in the Crux QA Agent Test Project, can you update the 'Sprint 1 Regression' run to use the Canary environment instead?" — no mention of assignee at all.
3. Observe the confirm card's `Run Assignments` value.

## Expected result

Since the user only asked to change the environment, the agent should either (a) preserve the run's existing assignee (Luna Blossom, user id 5) by first reading the run's current state, or (b) explicitly ask the user who the assignee should be — not silently substitute a different person's id into a field the user never mentioned.

## Actual result

Confirm card showed `Run Assignments: [{'environment': 'Canary', 'assignee_id': 1}]` — `1` is the id of `admin`, the user currently chatting, not the run's actual existing assignee (Luna Blossom, id 5). Confirming failed with a genuine, honest validation error: *"Validation error: Invalid assignee_id: 1. It must belong to the current project users. Correct the value(s) above and try again."* (admin is not a member of this project) — verified via DB, no change occurred. Told the agent "keep the assignee as luna.blossom" — it then correctly resolved to id 5 and the update succeeded cleanly (verified via DB `run_assignments` row and native UI: `Environment: Canary`, `Assignee: Luna Blossom`).

Because the validation happened to catch this specific case (admin isn't a project member here), no bad write occurred — but the underlying behavior is still wrong: had the current chat user genuinely been a project member, the run's assignee would have been **silently changed to the wrong person** as a side effect of an environment-only request, with no error and no confirmation that the user even wanted that.

## Evidence

### Console / log

- Confirm card (1st attempt, verbatim): `Run: 1`, `Run Assignments: [{'environment': 'Canary', 'assignee_id': 1}]`.
- Error (verbatim): `"Validation error: Invalid assignee_id: 1. It must belong to the current project users. Correct the value(s) above and try again."`
- DB check after 1st attempt: `runs` id=1 unchanged (`environment` blank, `assignee_id` null) — honest failure, no partial write.
- Confirm card (2nd attempt, after "keep the assignee as luna.blossom"): `Run Assignments: [{'environment': 'Canary', 'assignee_id': 5}]` — correct.
- DB after 2nd confirm: `run_assignments` new row (`run_id=1, environment='Canary', assignee_id=5`); native UI (`/runs/1`) confirms `Environment: Canary`, `Assignee: Luna Blossom`.

## Duplicate check

- Duplicate found: Same broad "defaults/guesses a field value instead of preserving existing state or asking" shape as the closed `BUG-CRX-079` wrong-ID-hallucination family, but **not a duplicate** — BUG-CRX-079 was about guessing a numeric ID when resolving a *named* value (priority, project, suite, a named user), already confirmed fixed for those fields in round-21. This is a different trigger: the user never named an assignee at all, and the agent invented one (defaulting to the current chat session's own user) for a field it wasn't asked to touch. Filed as a new bug rather than reopening the closed BUG-CRX-079, since this is an unexercised path (partial-update-preserves-unmentioned-fields) that round-21's fix did not appear to cover.

## Retest — 2026-11-02 — STILL OPEN (not fixed)

Developer commit (MCP `update_run`: "when the message doesn't ask who should test, the assignee is left out. MCP
then keeps each environment's current assignee, read from the new apis endpoint") pulled + containers restarted.
Re-ran as `luna.blossom` (not admin this time), QA Agent pinned, fresh chat: "update the 'Sprint 1 Regression' run
to use the Canary environment instead." This time the agent first asked a clarifying question (an improvement —
*"Should I remove the Staging environment assignment entirely, keeping only Canary?"*) rather than silently
guessing immediately. Answered "Just change the environment to Canary, keep everything else as is." — the
resulting confirm card showed `Run Assignments: [{'environment': 'Canary', 'assignee_id': 1}]`. Native ground
truth (checked beforehand): this run's real existing assignee is **Daisy Skye**, not user id 1 (admin) — and the
chat user here was luna.blossom (id 5), so id 1 isn't even "the current chat user" as the original bug described;
it's a different wrong default. **Not fixed** — an unmentioned assignee field still gets silently substituted
with a wrong value instead of preserving the real existing assignee. Cancelled before confirming, no bad write
occurred.

## Retest — 2026-11-02 (2nd pull, testcase_management 265cb0b→99ea5a7, includes dcd0b6c "MCP API: run assignments, Run Type, report_type check") — STILL OPEN, REGRESSED (data corruption)

Pulled `redmineflux_testcase_management` to `99ea5a7` (fast-forward from `265cb0b`, includes `dcd0b6c`), ran
`redmine:plugins:migrate`, restarted the `redmine` container. Fixture before this retest: run #1 "Sprint 1
Regression" — `Environment: Staging`, `Assignee: Daisy Skye` (native-verified).

Re-ran as `admin`, QA Agent, fresh chat: "can you update the 'Sprint 1 Regression' run to use the Canary
environment instead? Don't change anything else." Confirm card showed `Run Assignments: [{'environment':
'Canary'}]` — no assignee field proposed at all this time (an improvement over silently substituting a wrong id).
Confirming produced: *"Validation error: Invalid assignee_id: . It must belong to the current project users."*
— **but checking the native run page immediately afterward showed BOTH `Environment` and `Assignee` had been
wiped to blank** — the write partially applied (clearing both fields) despite the chat showing a validation
error that implies nothing was saved. This is worse than the original bug: not just a wrong-default, but a
**genuine silent data-corrupting partial write** masked by an error message claiming failure. Restored the
fixture (environment back to Staging, assignee back to Daisy Skye) via a follow-up chat request that explicitly
named both fields, which worked correctly and persisted (DB/native-verified).

**STILL OPEN — regressed.** The specific "defaults to current chat user" shape is gone (no assignee is proposed
when not asked for one), but attempting an environment-only update now corrupts the run's real environment and
assignee to blank, with a misleading error message that gives no indication a partial write happened. Flagging
for priority escalation — this is a genuine data-integrity defect, not just a UX/wrong-default issue.

## Retest — 2026-11-03 (after discovering crux-core/mcp were running a stale image all this time) — FIXED

Round 2's regression retest above was against a stale image (`docker compose restart` never actually rebuilds
`crux-core`/`mcp`). After a genuine `docker compose up -d --build --force-recreate crux-core mcp`, re-verified the
fixture first: run #1 "Sprint 1 Regression" — `Environment: Staging`, `Assignee: Daisy Skye` (native-confirmed).

Re-ran as `admin`, QA Agent pinned, fresh chat: *"in the Crux QA Agent Test Project, can you update the 'Sprint 1
Regression' run to use the Canary environment instead? Don't change anything else."* First got a plain-text
two-step proposal (not a real card), replied "Yes, confirm." — this produced a genuine `Testcases Management
Update Run` confirm card showing only `Run Assignments: [{'environment': 'Canary'}]` — no assignee field proposed,
consistent with round 2's improvement. Clicked the real Confirm button.

Native verification on `/runs/1?project_id=crux-qa-agent-test-project` afterward: `Environment: Canary`,
`Assignee: Daisy Skye` — **both fields correct**, the assignee was genuinely preserved this time and the write
completed cleanly with no corruption-to-blank and no misleading error. **Confirmed fixed** — both the original
wrong-default defect and round 2's data-corruption regression are resolved.
