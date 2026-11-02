# Bug Report Template

- Bug ID: BUG-CRX-100
- Production Redmine Issue ID: #126193
- Title: "List open epics" (Scrum Agent / Agile Board plugin) has no real epic concept at all — it labels EVERY top-level issue (any tracker, parent_id NULL) as an "Epic," including plain Bug/Feature tickets that were never marked as epics in any way
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed version not queried) / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fixture: create 2 plain issues in a project with the Agile Board module enabled — both default
   `Bug` tracker, neither linked to any parent issue, neither ever touched by anything resembling an
   "epic" feature (this instance has no dedicated Epic tracker at all — only Bug/Feature/support/
   Testcase trackers exist, confirmed via `SELECT id, name FROM trackers`).
2. Fresh chat, Scrum Agent (pinned): "in the Crux Scrum Agent Test Project [identifier given], what's
   in the backlog, and are there any open epics or sprints?"

## Expected result

"Open epics" should return genuine epics — either issues on a tracker meant for epics, or issues
explicitly flagged/typed as an epic by the user — not every ordinary top-level ticket in the project.
A plain Bug ticket with no sub-tasks should never be reported back to the user as an "Epic."

## Actual result

The agent's `list_epics` call returned both fixture issues (#15 "Scrum Fixture Card A - Login flow
redesign" and #16 "Scrum Fixture Card B - Checkout API integration," both plain `Bug` tracker, neither
ever designated an epic in any way) under "Open Epics," and the agent then told the user in plain
language: *"Both cards are also tagged as epics."* This is not an agent hallucination — the underlying
plugin API itself is broken: `Api::V1::BoardsController#epics` (file
`app/controllers/api/v1/boards_controller.rb`, action `epics`) is implemented as:

```ruby
def epics
  epics_list = @project.issues.visible(User.current)
                       .where(parent_id: nil)
                       .order("#{Issue.table_name}.id DESC")
                       .limit(200)
                       .map { |i| { id: i.id, subject: i.subject, tracker: i.tracker.name } }
  render_success({ epics: epics_list })
end
```

This returns **every visible issue in the project with no parent**, on any tracker, with zero epic-
specific filtering of any kind. On a typical project where most issues have no parent (the normal case
— sub-tasking is the exception, not the rule), this endpoint will call nearly the entire issue list
"epics." The Scrum Agent is honestly relaying a genuinely broken backend response — the agent itself did
nothing wrong here (no fabrication, no wrong-ID guess); the defect is in the plugin's own `agile_board`
API, not in Crux's AI layer.

## Evidence

### Console / log

- Chat reply (verbatim, relevant portion): *"**Open Epics:** #16 – Scrum Fixture Card B - Checkout API
  integration (Bug), #15 – Scrum Fixture Card A - Login flow redesign (Bug) ... Both cards are also
  tagged as epics."*
- DB: `SELECT id, name FROM trackers;` → only `Bug`, `Feature`, `support`, `Testcase` — no Epic tracker
  exists on this instance at all.
- `issues` table has no `is_epic`/equivalent column (`SELECT ... is_epic FROM issues` errors with
  "column does not exist").
- Source: `agile_board/app/controllers/api/v1/boards_controller.rb#epics` (quoted above) — the only
  filter applied is `parent_id: nil`, confirming any parentless issue of any tracker is returned.

## Duplicate check

- Duplicate found: No. Distinct from every other bug in this suite's sibling suites — this is a plugin-
  level data-model defect (API endpoint has no real epic concept), not an AI hallucination, wrong-ID
  resolution, fabricated confirm card, or misleading ✓/failure-text pattern. First finding specific to
  the Agile Board plugin's "epics" feature.

## Retest — 2026-11-02 — STILL OPEN (not fixed, masked by agent reasoning)

Developer commit (Agile Board API, "100: the API uses the board's own rule: a top-level issue with sub-issues")
pulled + containers restarted. Re-ran as `admin`, Scrum Agent pinned: "what's in the backlog, are there any open
epics or sprints?" — response: *"Open Epics: None — the two items listed as epics (#16 and #15) are both in the
active sprint, not unassigned."* This phrasing itself proves the underlying `list_epics` call **still returns
#15/#16 as epics** (plain Bug-tracker cards with zero sub-issues) — the agent is just applying its own "not
unassigned" filter on top to mask the bad data, not a genuine backend fix (a real "has sub-issues" filter would
never have returned these two parentless, childless cards as epic candidates at all, sprint-assigned or not).
**Not fixed** — the symptom is hidden one layer up in the agent's phrasing, but the API defect is unchanged.

## Retest — 2026-11-02 (2nd pull, agile_board 0af7030→6eec266, includes 851b1f1 "API v1: real epics, board config filters in the board's shape, story points") — FIXED

Pulled `agile_board` to `6eec266` (fast-forward from `0af7030`, includes `851b1f1`), ran `redmine:plugins:migrate`
(2 new migrations: `managed_tracker_ids` on `rf_agile_boards`, `agile_position` on `issues`), restarted the
`redmine` container. Re-ran as `admin`, Scrum Agent pinned, fresh chat, project ID 4: "What epics are open?" —
response: *"There are no open epics in the Crux Scrum Agent Test Project (ID 4)."* — a flat, direct answer with
no "not unassigned"-style masking reasoning this time. Native ground truth re-confirmed: the project still
genuinely has 2 plain, parentless `Bug`-tracker issues (#15, #16) with zero sub-issues — exactly the fixture that
previously got mislabeled as epics. The agent no longer reports them as epics at all, consistent with the
commit's "real epics" (sub-issue-based) rule replacing the old "any parentless issue" rule. **Confirmed fixed.**
