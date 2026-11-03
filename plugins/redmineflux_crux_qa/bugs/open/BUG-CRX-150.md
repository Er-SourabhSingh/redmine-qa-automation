# Bug Report Template

- Bug ID: BUG-CRX-150
- Production Redmine Issue ID:
- Title: Capacity Agent's `workload_capacity` reports a severely inflated, false-overloaded utilization figure
  when asked about a date sub-range narrower than the workload's full span — keeps the FULL-workload planned
  hours as the numerator while prorating only the capacity denominator to the sub-range, falsely flagging a
  team member as "significantly overcommitted" and recommending work be redistributed away from them when they
  are not actually overloaded at all
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Capacity Agent) / redmineflux_workload (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

Team: "Crux Capacity Agent Test Team" (#7), Workload: "Crux Capacity Sprint 1" (#1, span 2026-11-03 →
2026-11-17, 11 working days = 88h/person capacity). Ground truth confirmed two ways:

- **Native workload page** (`/rf_teams/7/rf_workloads/1`, full sprint span): Luna Blossom — **60h planned /
  88h capacity / 28h free, 68% utilized, "Available"**. Daisy Skye — 25h planned / 88h capacity / 63h free,
  28% utilized, "Available".
- **Native team page, "This Week" filter** (`/rf_teams/7?availability_start_date=2026-11-02&...-08`, the
  calendar week containing today): Luna Blossom — **40h capacity / 32h allocated / 8h available, "✓
  Available"**. Daisy Skye — 40h capacity / 25h allocated / 15h available, "✓ Available". **Nobody is
  overloaded in either native view, at either scope.**

Then, as admin, Capacity Agent pinned:

1. Fresh chat: "On the Crux Capacity Agent Test Team, which members are available right now, which ones have
   no planned workload at all, and is anyone overbudget or over capacity this week?" (no explicit dates given)
   → agent answered using the **full sprint range**: *"Luna Blossom — 60h planned / 88h available (68%
   utilized) — AVAILABLE... Nobody is overloaded."* — this matches the native sprint-wide ground truth exactly
   (acceptable, if arguably not literally scoped to "this week" as phrased).
2. Fresh chat: "Who is overbudget or over capacity on the Crux Capacity Agent Test Team this week (2026-11-02
   to 2026-11-08)?" — this time with the week's dates given explicitly, matching the native "This Week"
   filter exactly → agent answered: *"Luna Blossom — ⚠ 170% utilization — 60.0h planned vs. 35.2h available
   capacity. Over by ~25 hours. ... Team Summary: 120.7% utilized — 85 hours planned against 70.4 hours of
   available capacity this week. Luna Blossom is significantly overcommitted... Would you like me to ... 
   redistribute tasks between them?"*

## Expected result

For the identical team and the identical explicit date range that exactly matches the native plugin's own
"This Week" filter, the agent's answer should match the native UI: Luna at 32h/40h (80%, "Available", not
overloaded), Daisy at 25h/40h (63%, "Available"). At minimum, the agent's own two answers (sprint-wide vs.
week-scoped) for the same person should be internally consistent — the planned-hours figure should shrink when
the date range narrows, not stay fixed at the full-workload total while only the capacity denominator shrinks.

## Actual result

Three different, mutually-contradictory results exist for the exact same question logic (who is overloaded on
this team), depending only on how the date range was supplied:

| Source | Scope | Luna planned | Luna capacity | Luna result |
|---|---|---|---|---|
| Native `/rf_teams/7` "This Week" filter | 2026-11-02 → 2026-11-08 | 32h | 40h | 80%, Available |
| Native `/rf_workloads/1` full sprint | 2026-11-03 → 2026-11-17 | 60h | 88h | 68%, Available |
| Agent, no explicit dates ("this week," implied) | (defaulted to full sprint) | 60h | 88h | 68%, Available |
| **Agent, explicit matching week dates** | **2026-11-02 → 2026-11-08** | **60h (unchanged!)** | **35.2h** | **170%, "significantly overcommitted," told to redistribute her work** |

When the agent was given the exact date range that matches the native "This Week" view, it kept Luna's
planned-hours figure fixed at the full-sprint total (60h) instead of recalculating it for the narrower range,
while the capacity/available-hours denominator WAS recalculated down to a prorated 35.2h for the sub-range.
Dividing an un-shrunk numerator by a shrunk denominator produces a wildly inflated, false 170% utilization and
a false "overloaded, over by ~25 hours" claim — directly contradicting both of the plugin's own native views
for the identical person, team, and date range (neither of which shows any overload at all). A user asking
this question to decide whether to redistribute work would be given actively wrong advice, telling them to
pull work away from a team member (Luna) who has 8+ spare hours this week, not a deficit.

## Evidence

### Console / log

- Agent answer #1 (no explicit dates): *"Luna Blossom — 60h planned / 88h available (68% utilized) —
  AVAILABLE (still has 28h capacity) ... Nobody is overloaded."*
- Agent answer #2 (explicit dates 2026-11-02 to 2026-11-08, matching native "This Week" exactly): *"Luna
  Blossom — ⚠ 170% utilization — 60.0h planned vs. 35.2h available capacity. Over by ~25 hours. ... Team
  Summary: The team is collectively 120.7% utilized — 85 hours planned against 70.4 hours of available
  capacity this week."*
- Native `/rf_teams/7?availability_start_date=2026-11-02&availability_end_date=2026-11-08`: table row Luna
  Blossom — Capacity 40h, Allocated 32h, Available 8h, Status "✓ Available".
- Native `/rf_teams/7/rf_workloads/1` (full sprint): card Luna Blossom — 60h planned / 88h capacity / 28h
  free, 68%, "Available"; card Daisy Skye — 25h planned / 88h capacity / 63h free, 28%, "Available"; page
  header totals — 176h Available Hours, 85h Planned Hours, 48% Team Utilization.
- Source: `redmineflux-mcp/src/tools/workload.py`, `redmineflux_workload_capacity` (line ~1519) accepts
  `date_from`/`date_to` and passes them straight through to `GET /api/workload/capacity` — the mismatch is in
  how the backend computes `total_planned_hours` vs. `total_available_hours` when a sub-range narrower than
  the workload's own span is supplied (planned hours not re-scoped to the sub-range; available hours is).

## Duplicate check

- Duplicate found: No. Distinct from BUG-CRX-146 (overload-disabled setting ignored on `update_planned_hours`,
  a write-path defect) — this is a read-path defect on the `capacity` reporting tool producing an internally
  inconsistent, false-overloaded figure. Also distinct from the historical "this week"/date-resolution class
  (BUG-CRX-129, Timesheet domain) — that bug was about resolving relative phrasing to the wrong calendar dates;
  here the dates themselves were correct (matched the native filter exactly), but the two input figures
  (planned vs. capacity) were scoped to two different date ranges internally, producing a false result even
  with the right dates supplied.
