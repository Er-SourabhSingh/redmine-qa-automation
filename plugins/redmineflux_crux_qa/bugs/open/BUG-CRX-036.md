# Bug Report Template

- Bug ID: BUG-CRX-036
- Production Redmine Issue ID: #121484
- Title: QA Agent's `remove_testcases_from_suite` genuinely succeeds against a suite linked to an active (open) run, contradicting the documented "fails if linked to an active run" rule
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (QA Agent, Testcase Management plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-29

## Steps to reproduce

1. Create a test suite with at least one test case, and create a run covering that suite (state left open, e.g. "In Progress" — never closed).
2. In Ask Crux chat: "QA Agent, remove testcase [Y] from suite [X]." naming a testcase that's currently a member of a suite with the open run.
3. Confirm the resulting proposal.
4. Independently verify the suite's real testcase membership afterward.

## Expected result

Per `docs/CRUX_EXTERNAL_KB_NOTES.md` §6: "Removing cases from a suite fails if the suite is linked to an active run." The removal must fail honestly while the run is active — never silently succeed.

## Actual result

The removal genuinely succeeded. "QA Agent, please remove testcase #18 from suite #3 now." → real `Testcases Management Remove Testcases From Suite` proposal (Suite: 3, Testcase Ids: [18]) → confirmed → `"✓ 1 testcase(s) removed from suite #3 'CRX-Gap-Fixture Suite'."` No refusal, no error, no mention of the active run at any point.

Verified genuine against the real backend, not a fabricated success claim: `/test_suites?project_id=crux-qa&testsuite_id=3` now shows only the remaining testcase — the removed one is genuinely gone from the suite. At the time of the removal, run #1 ("CRX-Gap Fixture Run") was genuinely open (state "In Progress", never closed) and linked to this exact suite — confirmed via `/runs/1`, which lists the suite's testcases with real recorded results (one Failed with a linked defect, one Passed).

This is a distinct finding from BUG-CRX-030 (Closed 2026-09-28 as Won't Fix — the dev disputed that bug's "test case scope is immutable once assigned to a suite" claim as a KB documentation error, not a code defect). This bug is about a different, more specific documented rule — the *active-run linkage* guard specifically — not the general scope-immutability claim BUG-CRX-030 covered. The dev's Won't Fix resolution for BUG-CRX-030 does not address this rule.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and the real `/test_suites` and `/runs/1` pages (Redmine backend state), not a rendering defect.

### Console / log

```
C (admin): QA Agent, please remove testcase #18 from suite #3 now.
-> asking the QA Agent...
I'll do this (Testcases Management Remove Testcases From Suite) -- confirm?
[Write] Suite: 3, Testcase Ids: [18]
[Confirm clicked]
"✓ 1 testcase(s) removed from suite #3 'CRX-Gap-Fixture Suite'."

[Verification]
/test_suites?project_id=crux-qa&testsuite_id=3 -> only testcase #19 remains listed, #18 genuinely gone.
/runs/1 -> run #1 "CRX-Gap Fixture Run", state In Progress (never closed), suite #3 linked, real recorded
results present (testcase #18 Failed/defect #20, testcase #19 Passed) at the time of the removal above.
```

## 2026-09-29 — clean reverification (unconfounded fixture)

The user raised a valid concern: testcase #18 (used in the original repro above) was later bulk-deleted in TC-CRX-057's test, so there was a theoretical risk the original `/test_suites` "gone" evidence reflected deletion, not a genuine suite-unlink. Checked the actual session transcript timestamps: the removal from suite #3 happened at **07:57:37**, the bulk-delete of testcase #18 happened later at **08:03:38** — six minutes after, so testcase #18 was still a live issue at the time of removal. Not confounded, but reverified independently with a completely clean fixture to remove any doubt:

1. Created a brand-new testcase, **#22** ("CRX-Gap Fixture Case D"), added it to suite #3 (native UI, not chat) — confirmed present in the suite listing.
2. Confirmed run #1 ("CRX-Gap Fixture Run") was still genuinely **"In progress"** (open), linked to suite #3, via `/test_suites/releases?project_id=crux-qa`.
3. "QA Agent, please remove testcase #22 from suite #3 now." → hit BUG-CRX-013's plain-text-only "Confirm to proceed?" with no real button once, retried with "Confirmed, please remove testcase #22 from suite #3 now." → real `Testcases Management Remove Testcases From Suite` proposal (Suite: 3, Testcase Ids: [22]) with genuine Confirm/Cancel buttons → clicked Confirm → *"✓ 1 testcase(s) removed from suite #3 'CRX-Gap-Fixture Suite'."*
4. **Verified `/issues/22` directly returns 200 (full testcase page still loads)** — the issue itself was NOT deleted, only unlinked from the suite.
5. Verified `/test_suites?project_id=crux-qa&testsuite_id=3` now lists only 1 testcase (#19) — (1-1/1) — #22 genuinely removed from the suite.
6. Re-confirmed run #1 was still "In progress" throughout (never closed) via `/test_suites/releases?project_id=crux-qa`.

This is now confirmed with zero ambiguity: the removal succeeds against a suite genuinely linked to a still-open run, while the removed testcase's underlying issue remains fully intact — a clean contradiction of the documented rule, independent of any deletion timing question.

## 2026-09-29 — second occurrence, same session (testcase #19)

Repeated immediately after the #22 reverification above, this time against testcase **#19** ("CRX-Gap Fixture Case B") — the suite's last remaining member, with run #1 still open the whole time:

1. "QA Agent, please remove testcase #19 from suite #3 now." → first attempt hit BUG-CRX-013's plain-text-only "Confirm to proceed?" (no real button) → retried the identical message a moment later → this time got a real `Testcases Management Remove Testcases From Suite` proposal (Suite: 3, Testcase Ids: [19]) with genuine Confirm/Cancel buttons → confirmed → *"✓ 1 testcase(s) removed from suite #3 'CRX-Gap-Fixture Suite'."*
2. Verified `/issues/19` directly → 200, full testcase page still loads (`Testcase #19: CRX-Gap Fixture Case B`) — not deleted.
3. Verified `/test_suites?project_id=crux-qa&testsuite_id=3` → now shows **"No data"** — suite is completely empty (both #22 and #19 removed across the two reverification rounds).
4. Run #1 was never touched/closed during either round.

Two independent, unconfounded reproductions in one session — the defect is consistently reproducible, not a one-off.

## Duplicate check

- Duplicate found: No — related to but distinct from BUG-CRX-030 (immutable-scope rule, Won't Fix). This bug covers the separate documented "active run" guard.
- Existing bug reference (if duplicate): BUG-CRX-030 (related defect class, different specific rule)

## Production report

Reported to production 2026-09-29 as **#121484** (project `ztflux`, tracker Bug, Priority Medium, Defect Type Functional, Defect Severity Medium-severity, Defect priority Medium, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120494 (`CRUX_AGENT_QA_TESTCASES`) / Run #569 / environment "Window 11 + Chrome" — testcase result marked Failed with defect #121484 attached, confirmed via `get_issue`.
