# Test Plan — Redmineflux Platform

> Written after `PLATFORM_REQUIREMENTS.md` and `PLATFORM_FEATURES_LIST.md` were read (no vendor KB/user guide exists
> yet — this is a brand-new plugin, sourced from production ticket #120043). Backfilled 2026-10-01 against the
> plugin's actual, already-advanced test cycle.

## Objective

Verify that consolidating ten previously-duplicated shared entities (Organization, Contact, Team, Team Membership,
Holiday, Holiday Scheme, Leave, Leave Type, Audit Event, User Preference) out of CRM/Helpdesk/Invoice/Timesheet/
Workload/Shift Management into one platform plugin produces **zero data loss**, an **identical schema** between a
fresh install and a branch upgrade, and **real cross-plugin consistency** — not just a passing migration.

## Test Approach

Testing types performed this cycle (mirrors `PLATFORM_SCOPE.md`):

- **Functional** — the bulk of this cycle: old-architecture baseline, install/upgrade, data migration integrity,
  cross-plugin consistency, the full CRUD propagation matrix, entity CRUD & field validation, vocabulary/labels.
- **Permission** — Platform's own two-level permission model (`PLATFORM_PERMISSIONS_AND_ACCESS.md`).
- **Regression** — every bug fix on this plugin has been retested against a fresh `git pull` + container restart,
  not just assumed fixed from the dev's journal note (this cycle caught more than one case of stale-code producing
  a false "still broken" finding — see `PLATFORM_MEMORY.md`).
- **Security** — `PLATFORM_SECURITY.md`, 13 TCs: 11 PASS, 1 FAIL (TC-PLT-218 — confirmed stored XSS, `BUG-PLT-027`, Critical, open), 1 BLOCKED (TC-PLT-221). Covers auth, authorization-at-endpoint, private-record isolation, XSS, SQL-meta-character handling, session invalidation.
- **Performance** — `PLATFORM_PERFORMANCE.md`, 10/10 TCs PASS (large-dataset responsiveness across every entity list, bulk delete, no N+1 degradation observed).
- **Code Quality** — not yet run as a dedicated pass; see Risks below.

Environment: single upgrade-path instance carrying real pre-consolidation fixture data from the six consumer
plugins, per `PLATFORM_REQUIREMENTS.md`'s "Upgrade" workflow — this is the scenario the whole cycle targets, not a
fresh install.

## Entry Criteria

- The six consumer plugins installed standalone at `master` with real fixture data in each (Feature #1, the
  "old-architecture baseline") before any upgrade is attempted.
- `redmineflux_platform` branch available for the platform plugin and all six consumer plugins.

## Exit Criteria

- Branch upgrade (Feature #4) completes with zero migration errors and the app boots.
- No data-loss or duplicate-record findings remain open for any of the ten consolidated entities.
- Every shared entity's cross-plugin CRUD matrix (Feature #35) passes from every origin plugin, not just Platform's
  own UI.
- `PLATFORM_TRACEABILITY_MATRIX.md` shows no feature with zero TC coverage, or the gap is recorded in
  `PLATFORM_SCOPE.md`'s Out of Scope.

## Test Deliverables

- Test cases — `testcases/PLATFORM_*.md` (11 suite files)
- Bug reports — `bugs/open/`, `bugs/closed/` (22 bugs filed as of 2026-10-01, several Critical/Blocker)
- Reports — `reports/PLT-<TestingType>-<date>.md` (see `CLAUDE.md` §7)
- Traceability Matrix — `PLATFORM_TRACEABILITY_MATRIX.md`

## Roles & Responsibilities

QA execution and bug filing: as logged per session in `TIME_LOG.md`. Dev fixes assigned to Prashant Chaurasia on
production (`ztflux`).

## Risks & Assumptions

- **This is a brand-new plugin with no vendor KB or user guide** — `PLATFORM_REQUIREMENTS.md`/`FEATURES_LIST.md`
  are sourced entirely from one production ticket's description and a single journal update; exact screen names
  and click paths were discovered live, not pre-documented. Treat any requirement gap as "go verify live," not "not
  a bug."
- **Stale-code false negatives are a real, already-observed risk.** `docker restart` does not pull new commits —
  more than one "still broken after the fix" finding this cycle turned out to be testing against pre-fix code,
  caught only by explicitly verifying the git commit inside the running container before retesting. Every retest
  in this plugin's cycle must confirm the fix commit is actually loaded, not just that the container restarted.
- **The architectural finding (BUG-PLT-016)** — every shared entity is still independently re-implemented in 2–4
  consumer plugins instead of going through one shared code path — means new cross-plugin bugs of the same shape
  are likely to keep surfacing as more of the CRUD matrix (Feature #35) is executed. Don't treat each one as
  isolated; check whether it's the same root pattern before filing as a brand-new class of defect.
- Code Quality (`SENIOR_QA_STANDARDS.md` §30) has not been scheduled as a dedicated pass yet — fold it into the
  next root-cause investigation per that section's own rule.
- **`BUG-PLT-027` (Critical, open) is a confirmed stored XSS** on the Overview's Holiday Calendar widget — a
  Holiday name breaks out of an unquoted `title=` attribute and executes as real script on every page load. This
  blocks the plugin's Exit Criteria until fixed and retested; treat it as the top-priority open item, not routine
  backlog.

## Test Cycle / Schedule

- 2026-09-28/29: old-architecture baseline, installation/upgrade path (initially failed, 2 bugs), data migration
  integrity (1 bug — organization merge).
- 2026-09-29 (later): upgrade path fully fixed after 3 retest rounds; cross-plugin consistency testing began (1
  more bug — org/company merge’s duplicate-record problem, BUG-PLT-006).
- 2026-09-30: cross-plugin consistency + CRUD matrix testing — 7 more bugs (3 Critical/Blocker: shared audit-log
  collision, Workload leave broken, Shift Management leave-type broken). Entity CRUD & field validation testing —
  6 more bugs (search, sorting, filtering, audit-name regression, tags). BUG-PLT-008 closed (Settings sync).
- 2026-10-01: Known Gaps & Edge Cases suite executed — both previously-known gaps (contact_type value,
  Shift Management pre-platform data carry-over) confirmed **fixed**; Security suite executed (11/13 PASS, 1 FAIL
  — `BUG-PLT-027` stored XSS, Critical, open — 1 BLOCKED) and Performance suite executed (9/10 PASS, 1 MIXED —
  TC-PLT-227 Audit Events).
