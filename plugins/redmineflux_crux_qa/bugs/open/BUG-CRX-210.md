# Bug Report Template

- Bug ID: BUG-CRX-210
- Production Redmine Issue ID: #128972 (reported 2026-11-18 as a standalone issue — no dedicated production test case exists for the Alert Triage agent's own suite, assigned to Prashant Chaurasia, category Crux Plugin)
- Title: Alert Triage's priority resolution degrades from the correct name to a wrong numeric id when the pending confirm card is re-rendered after an interjected question; the interjected question itself ("is it filed now?") also goes unanswered
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Alert Triage agent)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-657 (deferred, deprioritized per earlier user instruction), fresh chat:

1. "Alert Triage, in the Crux Zero Activity QA project: the search box on the reports page stopped
   returning any results for everyone since this morning, no workaround." → correctly identified as new
   (no duplicate), `Severity: Critical` with a correct reason, then asked one reasonable clarifying
   question ("is this within the Redmineflux application itself, or in a custom part of the project?").
2. "Within the Redmineflux application itself." → genuine confirm card: `CREATE ISSUE`, `Project: Crux Zero
   Activity QA`, `Tracker: Bug`, `Subject: Search box on reports page returns no results`,
   **`Priority: immediate`** (correctly resolved by name), full description. Left pending, not confirmed.
3. Before clicking Confirm, per this TC's own trigger: "Is the bug filed now?"
4. The agent's response gave **no textual answer at all** to that question (no "not yet, waiting on your
   confirmation," no "yes" or "no") — it silently re-rendered the identical proposal as a fresh confirm
   card instead. On this re-rendered card, **`Priority` had changed to `1`** — a numeric value that does
   not correspond to any real priority on this instance (`list_priorities`: only `6/7/8/9` exist).
5. Cancelled both cards; native-verified via `list_issues(project_id=14, status_id="*")` — no new issue was
   created with this subject. No false "created" claim occurred (the specific wording this TC checks for
   was not violated), but the question itself went unanswered and a nonexistent priority id would have been
   written had the second card been confirmed as-is.

## Expected result

Per this TC's own expectation: an honest "not yet, waiting on your confirmation" when asked whether a
pending proposal has already been applied. Separately, every re-render of the same pending proposal should
resolve the same fields to the same correct values — a question interjected mid-flow should not alter or
degrade field resolution on re-display.

## Actual result

- No direct answer was given to "Is the bug filed now?" — the agent neither confirmed nor denied, it just
  re-proposed the same action.
- The re-proposed card's `Priority` field degraded from the first card's correct `immediate` (resolved by
  name) to a bare `1` (resolved as a number, matching none of this instance's real priority ids 6/7/8/9) —
  the same wrong-priority-id-resolution class as BUG-CRX-209, but on the `create_issue` path this time
  (BUG-CRX-209 was on `update_issue`), and specifically triggered by re-rendering after an interjected
  question rather than by the initial proposal.

## Evidence

### Console / log

- First confirm card (verbatim, before the interjected question): `Priority\timmediate`.
- Second confirm card (verbatim, after "Is the bug filed now?" with no textual answer in between):
  `Priority\t1`.
- Native ground truth: `redmineflux_core_list_priorities()` → `id=6: low, id=7: medium, id=8: high,
  id=9: immediate` — no id 1 exists.
- Native verification after cancelling both cards: `list_issues(project_id=14, status_id="*")` → only the
  2 pre-existing fixture issues (#157, #158), confirming no false "created" claim and no actual write.

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Same wrong-priority-id-resolution class as BUG-CRX-209 (also on Alert Triage,
  found moments earlier in this same session) but a distinct trigger path — BUG-CRX-209 was on the
  `update_issue`/duplicate-attach path; this is on `create_issue`, specifically after a re-render caused by
  an interjected, unrelated question. Kept as its own bug per this repo's convention for a new trigger path
  of an already-documented defect class. The unanswered-question half (no honest "not yet" response) is a
  distinct, additional finding bundled into the same report since both surfaced in the same incident.
