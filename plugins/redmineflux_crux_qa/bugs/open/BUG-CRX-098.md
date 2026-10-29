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
