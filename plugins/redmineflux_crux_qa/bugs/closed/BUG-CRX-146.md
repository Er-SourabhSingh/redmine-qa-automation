# Bug Report Template

- Bug ID: BUG-CRX-146
- Production Redmine Issue ID: #127552
- Title: Capacity Agent's `update_planned_hours` silently accepts a genuinely over-capacity allocation even
  with "Allow Workload Overload" explicitly disabled — the refusal path documented by the vendor ("When
  disabled, planned hours must stay within capacity") is never actually enforced; first genuine exercise of
  this scenario (the legacy suite's equivalent TC never got past a separate, since-fixed fabricated-success
  bug to test it)
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Capacity Agent) / redmineflux_workload (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. As admin, Capacity Agent pinned: "Update the workload settings to disable overload." Confirm — result:
   *"✓ Settings updated. Allow Overload: No ... Working Hours/Day: 8.0h"* (with the tool's own built-in
   BUG-RFM-010 warning about stale totals, unrelated to this bug).
2. Confirm natively (or via the agent) that the target user (Luna Blossom, on the "Crux Capacity Sprint 1"
   workload, a single ~2-week sprint) genuinely has far less than 60 hours of real available capacity (per
   the workload page: `60.00h planned / 28.00h available` for Luna before this request — i.e. 60h would push
   her roughly 32h over her real remaining capacity).
3. "Set planned hours to 60 for issue #26 on the Crux Capacity Sprint 1 workload, for Luna Blossom." Confirm
   the resulting `Workload Update Planned Hours` card.

## Expected result

Per the vendor documentation's explicit rule ("Allow Workload Overload controls whether planned hours can
exceed capacity. When disabled, planned hours must stay within capacity"), with overload now genuinely
disabled, this clearly over-capacity request should be refused — not silently accepted.

## Actual result

The write succeeded cleanly: *"✓ Planned hours updated (allocation_id: 4)."* Native verification on
`/rf_teams/7/rf_workloads/1` confirms the allocation genuinely exists: Luna Blossom now shows **60.00h
planned / 28.00h available** — a real, substantial over-capacity allocation (roughly 32 hours beyond what she
has available) — with the workload-level summary also showing `Available Hours: 60h` vs. `Planned Hours:
116h` for the whole team. No validation error, no warning, no partial clip — the over-capacity write was
accepted exactly as if overload were still enabled.

This confirms the vendor-documented "Allow Workload Overload" setting has no real effect on
`update_planned_hours` — the enforcement described in the public documentation does not exist in this tool
(or doesn't reach it), contradicting the explicit stated behavior of a feature the product documents as a
real safety control. This is the specific gap the legacy suite's TC-CRX-099 flagged as "never genuinely
exercised" because an earlier, unrelated fabricated-success bug (BUG-CRX-028) blocked it from ever being
properly tested — this session constructed a genuinely over-capacity scenario and confirmed the underlying
enforcement itself is missing, not just untested.

## Evidence

### Console / log

- Settings update (verbatim): *"✓ Settings updated. Allow Overload: No Working Hours/Day: 8.0h ⚠️ WARNING
  (BUG-RFM-010): Disabling 'Allow workload overload' will silently clip any existing over-capacity allocations
  in the Gantt..."*
- Confirm card for the over-capacity request (verbatim): `Workload: 1`, `Issue: 26`, `Workload User: 1`,
  `Planned Hours: 60`.
- Result (verbatim): *"✓ Planned hours updated (allocation_id: 4)."*
- Native verification, `/rf_teams/7/rf_workloads/1`: Luna Blossom's own row genuinely shows **60.00h planned
  / 28.00h available**; workload-level summary shows **Available Hours: 60h**, **Planned Hours: 116h**.

## Duplicate check

- Duplicate found: No new bug filed on top of an existing one — this is the first genuine exercise of the
  overload-disabled refusal path on the current Redmine 6 / plugin v0.62.0+ cycle. Related to, but distinct
  from, the already-closed BUG-CRX-028 (a fabricated-success/no-real-confirm-button defect that previously
  blocked this exact scenario from ever being properly tested, on a different tool — `holiday_scheme_activate`
  — not `update_planned_hours`). This bug is about the real capacity-enforcement logic itself being missing,
  not about a confirm-card fabrication.

## Retest — 2026-11-04 (FIXED)

Developer pulled `redmineflux-crux-core`→`b6867e8`, `redmineflux-mcp`(`crux_development`)→`93d479c`,
`redmineflux_crux` plugin→`7751dc8`, `redmineflux_workload`→`0b304a3` (retest guide round 31). Migrations run,
all services restarted.

Retested per the developer's guide: turned off "Allow workload overload," then attempted to set Luna Blossom's
planned hours on a real allocation (issue #26, Crux Capacity Sprint 1) to 500h — far beyond her real available
capacity (32h/week in the sprint window). The write was genuinely refused: `"Validation error: Planned hours
must be less than or equal to 360. Correct the value(s) above and try again."` Confirmed server-side via Rails
logs: `PATCH /api/workload/workloads/1/issues/26/planned_hours` → `422 Unprocessable Content`. Native-verified
(via a fresh read) her planned hours on issue #26 remained **60.0 hours — unchanged**. The wording differs
slightly from the vendor doc's example ("This change would exceed daily capacity"), but the real enforcement
now genuinely blocks an over-capacity write when overload is disabled, which is the core defect this bug
tracked. **Status: FIXED.** Moved to `bugs/closed/`.
