# Handoff — Redmineflux Advanced Field

## Last Session

- Date: 2026-05-21
- Redmine Version: 6.0.9.stable
- Plugin Version: redmineflux_advanced_fields 0.1.0
- Environment: Forge (flux-f3txguimh49.forge.zehntech.com)

## Completed This Session

Bug fix retest session — all previously blocked TCs retested and confirmed passing:

- TC-RAF-022: Add HR → Location (Branch Office) dependency rule — **PASS** (BUG-RAF-001 fixed)
- TC-RAF-023: Add Finance → Location (Branch Office, CRM) scoped to project — **PASS** (BUG-RAF-001 fixed)
- TC-RAF-024: Add Operations → Location (WAN, LAN, VPN) globally — **PASS** (BUG-RAF-001 fixed)
- TC-RAF-036: Live dropdown filtering IT→HR on issue form — **PASS** (BUG-RAF-001 fixed)
- BUG-RAF-002 retest: Issue #274, Integer divide field = 3 (rounded), edit + submit succeeds — **PASS**

Full suite result: **51 PASS, 0 FAIL, 0 BLOCKED**

## In Progress

None. All positive test cases complete, all bugs fixed and closed.

## Blockers

None. All blockers cleared:

- ~~**BUG-RAF-001:**~~ Fixed 2026-05-21. Multiple dependency rules for same parent+child with different parent values now allowed. See `bugs/closed/BUG-RAF-001.md`.
- ~~**BUG-RAF-002:**~~ Fixed 2026-05-21. Integer formula target now receives rounded integer value. No more validation error on issue edit. See `bugs/closed/BUG-RAF-002.md`.

## Next Session Start Point

**Workflow test cases (TC-RAF-051 through TC-RAF-054)** — read positive-testcases.md for these TCs before starting.

Current environment state for next session:
- Active formulas: Downtime (ID 4, minutes, log=yes), Duration (ID 5, hours), Total Hours (ID 6, add)
- Active sequence rule: Incident ID, All Trackers, {YYYY-MM}-{NNN}, Pad 3, All Projects
- Sequence counter last value: 2026-05-008 (issue #283)
- Active dependency rules: Department=IT → Location (Server Room, Data Center, CRM); Department=HR → Location (Branch Office); Department=Finance → Location (Branch Office, CRM); Department=Operations → Location (WAN, LAN, VPN)
- Active visibility rules: Production→Show Components, Development→Hide Components
- Test issues: #274 (BUG-RAF-002 retest), #275 (formula base), #276-280 (sequence 002-006), #281 (Bug seq 007), #282 (Feature no seq), #283 (combined features)

## Closed Bugs

| Bug ID | Title | Severity | Status |
|--------|-------|----------|--------|
| BUG-RAF-001 | Plugin blocks multiple dependency rules for same parent and child field combination even with different parent values | High | Closed — Fixed 2026-05-21 |
| BUG-RAF-002 | Issue edit blocked by validation error on integer formula field receiving float value from server-side calculation | High | Closed — Fixed 2026-05-21 |
