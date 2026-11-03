# Bug Report Template

- Bug ID: BUG-CRX-147
- Production Redmine Issue ID:
- Title: Capacity Agent's `update_planned_hours` lets a plain team member WITHOUT the per-team `manage_workload`
  flag successfully write her own planned-hours allocation — the vendor doc explicitly states non-management
  users may only "manage their own leave," not allocations/workload hours
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Capacity Agent) / redmineflux_workload (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: daisy.skye (Reporter — Team #7 membership has `manage_workload: Disabled`, `can_approve_leave:
  Disabled`, confirmed natively)
- Date: 2026-11-03

## Steps to reproduce

1. Confirm natively that Daisy Skye's own membership on Team #7 genuinely has `Manage workload: Disabled`
   (`/rf_teams/7`).
2. As `daisy.skye`, Capacity Agent pinned, fresh chat: "Set my planned hours to 10 for issue #26 on the Crux
   Capacity Sprint 1 workload." — note this targets **her own** allocation (`Workload User: 2`, her own
   workload-membership row), not another member's.
3. Confirm the resulting `Workload Update Planned Hours` card.

## Expected result

Per the vendor documentation ("Non-management users can see workload information for their teams and manage
their own leave"), a plain team member without `manage_workload` should NOT be able to write allocation/
planned-hours data — even for her own allocation. The doc's own phrasing specifically and narrowly carves out
only *leave* as self-manageable by non-management users, implying workload/planned-hours editing is a
genuinely management-only action regardless of whose allocation it is.

## Actual result

The write succeeded cleanly with no refusal at any point — the agent didn't even proactively self-refuse
(unlike the team/member-management requests tested elsewhere this session, which did produce an upfront "you
lack Manage Workload permission" self-check). Confirm card showed `Workload: 1`, `Issue: 26`, `Workload User:
2` (Daisy's own workload-membership row), `Planned Hours: 10`. Confirming returned *"✓ Planned hours updated
(allocation_id: 5)."* Native verification on `/rf_teams/7/rf_workloads/1` confirms Daisy Skye genuinely now
shows **10.00h planned** — a real, successful write to her own allocation despite genuinely lacking
`manage_workload` on this team.

This confirms the permission-gating inconsistency flagged in this suite's own source research
(`update_planned_hours` and all `allocation_*` tools are gated only at `_require_view` in `workload.py`, never
re-checking the per-team `manage_workload` flag) is a real, exploitable gap in practice — not merely a
theoretical code-review observation. Unlike `member_add`'s practical protection via the `search_users` gate
(see TC-CRX-532/BUG-CRX-145's investigation notes), there is no equivalent indirect choke-point protecting
`update_planned_hours` — a plain team member can freely allocate hours to herself (and, by the same gating
logic, almost certainly to any other team member too, not just herself — not separately re-tested here but
implied by the identical tool gate).

## Evidence

### Console / log

- Native pre-check, `/rf_teams/7`: Daisy Skye's row shows `Can approve leave: Disabled`, `Manage workload:
  Disabled`.
- Confirm card (verbatim): `Workload: 1`, `Issue: 26`, `Workload User: 2`, `Planned Hours: 10`.
- Result (verbatim): *"✓ Planned hours updated (allocation_id: 5)."*
- Native verification, `/rf_teams/7/rf_workloads/1`: Daisy Skye's row genuinely shows **10.00h** planned.

## Duplicate check

- Duplicate found: No. Related to the general permission-gating-inconsistency pattern already documented in
  this suite's Precondition/source-research section (several write tools gated only at `_require_view`, not
  re-checking the per-team `manage_workload` flag), but this is the first **concretely confirmed, successful**
  exploitation of that gap — earlier related tests (TC-CRX-532 `member_add`, TC-CRX-538/539/540 workload
  create/update/delete) either hit an indirect real protection (`search_users`'s own gate) or are still
  pending execution. This is the first clean, unambiguous proof that the gap is real and exploitable, not just
  theoretical.
