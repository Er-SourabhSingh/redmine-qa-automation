# Bug Report Template

- Bug ID: BUG-CRX-102
- Production Redmine Issue ID: #126195
- Title: Scrum Agent's "Agile Create Issue" confirm card resolves a named priority to the wrong numeric id — "Low" (real id 1) proposed as id 4 ("Blocker", the most severe priority, the opposite end of the scale)
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed version not queried) / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fixture ground truth (`redmineflux_core_list_priorities`): `id=1: Low`, `id=2: Medium (default)`,
   `id=3: High`, `id=4: Blocker`.
2. Fresh turn, Scrum Agent (pinned), admin, in the Crux Scrum Agent Test Project: "can you create an
   issue titled 'Scrum Fixture Card C - Payment retries' from the backlog, priority Low?"
3. Agent asked a reasonable clarifying question (Tracker? Sprint assignment?) — answered "Tracker Bug,
   leave it unassigned in the backlog."
4. Observe the resulting `create_issue` confirm card's `Priority` field.

## Expected result

The confirm card's `Priority` field should resolve to `1` (the real id for "Low," looked up via
`redmineflux_core_list_priorities` or equivalent), per the repo-wide "never guess an id" rule already
enforced on other domain agents' `create_issue`/`create_testcase` paths (CRC-69, BUG-CRX-079's fix).

## Actual result

The confirm card showed `Project: crux-scrum-agent-test[-project]`, `Tracker: Bug`, `Subject: Scrum
Fixture Card C - Payment retries`, `Priority: 4` — id **4 is "Blocker"**, the single most severe priority
on this instance, the exact opposite end of the scale from the "Low" the user asked for. Cancelled before
confirming; verified via DB no issue was created (`SELECT id, subject, priority_id FROM issues WHERE
subject ILIKE '%Payment retries%'` → 0 rows), so this is a caught near-miss, not a live data defect — but
had it been confirmed, a ticket explicitly requested as low-priority would have been filed as the
instance's highest-severity "Blocker" instead.

## Evidence

### Console / log

- Confirm card (verbatim): `Project: crux-scrum-agent-test`, `Tracker: Bug`, `Subject: Scrum Fixture Card
  C - Payment retries`, `Priority: 4`.
- Ground truth (`redmineflux_core_list_priorities`): `id=1: Low`, `id=2: Medium (default)`, `id=3: High`,
  `id=4: Blocker`.
- DB: no issue titled "Payment retries" exists on this instance — cancelled, no write occurred.

## Duplicate check

- Duplicate found: Related to, but not a duplicate of, **BUG-CRX-079** (the original wrong-priority-id
  hallucination, Testcase-Management domain, `create_testcase`/`update_testcase`, fixed via `field_check`
  in CRC-69). CRC-69's `field_check` coverage is explicitly scoped to `redmineflux_testcases_management_*`
  tools only (per its own spec: *"field_check covers every testcase write"*) — it was never extended to
  `redmineflux_agile_*` tools. This is the identical wrong-priority-id defect class recurring, unfixed, on
  the Scrum Agent's own `create_issue` tool — a second domain the original fix never reached. Kept as its
  own bug file per this repo's one-bug-per-domain rule (same precedent as BUG-CRX-094/096 and
  BUG-CRX-101).
