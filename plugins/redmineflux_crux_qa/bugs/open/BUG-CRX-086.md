# Bug Report Template

- Bug ID: BUG-CRX-086
- Production Redmine Issue ID: #125494
- Title: QA Agent's "Update Run" to change which testcase is included picks the wrong tool parameter (`include_testcase="true"`, meant for "re-sync all testcases") instead of `run_assignments` (the actual per-suite/testcase selector it correctly used on Create) — the resulting server-side validation error is honest about the write failing, but the run's EXISTING testcase/suite association is silently deleted anyway, a genuine silent partial write behind a "failed" message
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, with a real run ("Sprint 2 Targeted Test", run #3) that already has exactly one testcase included: issue #7 under suite #1 ("Login and Auth") — confirmed via DB (`run_issues` row: run_id=3, issue_id=7, testsuite_id=1) before this repro.
2. In Ask Crux chat (QA Agent): "in the Crux QA Agent Test Project, can you update the 'Sprint 2 Targeted Test' run to include only test case #6 'Reset password with valid email' from the 'Login and Auth' suite instead of test case #7?"
3. Observe the confirm card.
4. Click Confirm.
5. Observe the resulting message.
6. Independently check the real state via DB (`SELECT * FROM run_issues WHERE run_id=3`).

## Expected result

The agent should use `redmineflux_testcases_management_update_run`'s `run_assignments` parameter (the same mechanism `create_run` uses for its `Suite Testcase Map`, which this exact agent correctly built as `{'1': [7]}` on this run's own creation two turns earlier in this session) to replace testcase #7 with testcase #6 under suite #1. If the write then genuinely fails for any reason, the run's existing testcase/suite data must be left completely untouched — a failed save must never leave the object in a different, undocumented state than either the old or the new requested one.

## Actual result

1. The confirm card showed only `Run: 3`, `Include Testcase: true` — the agent chose `include_testcase="true"` (documented in the tool's own docstring as "re-sync all testcases", a blunt instrument unrelated to swapping one specific testcase for another) instead of building a `run_assignments` payload the way it successfully did for Create.
2. Confirming produced: **"Validation error: Save failed: Testsuite is not selected. Correct the value(s) above and try again."** — genuinely from the server (`include_testcase=true` with no suite context to re-sync against), appearing to be an honest, clean failure with nothing saved.
3. **Independently verified via DB that this is false**: `run_issues` for run #3, which held exactly one row (`issue_id=7, testsuite_id=1`) immediately before this request, now has **zero rows**. The run itself is otherwise unchanged (name "Sprint 2 Targeted Test", state 1, still exists) — only its testcase/suite association was wiped. The "Validation error... Save failed" message is misleading: part of the save (clearing the existing `run_issues` row) evidently happened before the validation that rejected the rest of it, and nothing rolled it back.

## Evidence

### Console / log

- Confirm card (verbatim table): `Run: 3`, `Include Testcase: true`.
- Error message (verbatim): `Validation error: Save failed: Testsuite is not selected. Correct the value(s) above and try again.`
- DB before: `SELECT * FROM run_issues WHERE run_id=3` → 1 row (`id=3, run_id=3, issue_id=7, testsuite_id=1`).
- DB after confirming: `SELECT * FROM run_issues WHERE run_id=3` → 0 rows. Run #3's own row in `runs` (`name`, `state`) unchanged.

## Note for triage

This is a new, more severe sub-shape within this suite's wrong-tool-call-argument findings (BUG-CRX-079/083/085): those are about wrong field *values*; this is about choosing the wrong *parameter entirely* for a request Update Run genuinely supports via `run_assignments` (proven by Create Run succeeding with the equivalent `run_assignments`-style payload on the very same run, same session). The consequence here is worse than a clean no-op failure — a real run's test coverage was silently reduced to zero while the user was told the save failed. Recommend the dev check the Ruby endpoint behind `PUT /runs/:id` (or equivalent): `include_testcase=true` combined with no suite selection appears to clear existing `run_issues` rows as a side effect of attempting the re-sync, before the "testsuite is not selected" validation actually rejects the request — the clear and the validation should be in the same transaction, or the clear should not happen before validation passes.

## Duplicate check

- Duplicate found: No — distinct from every other finding in this suite. Not the wrong-ID family (no ID was guessed, a wrong tool mechanism was chosen). Not the misleading-✓ family (BUG-CRX-082 — this message correctly shows no ✓, it is just substantively wrong about what happened). First instance in this suite of a genuinely destructive silent partial write hiding behind an honest-looking validation error.
