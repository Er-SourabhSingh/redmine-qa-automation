# Traceability Matrix — Redmineflux Platform

> Maps every requirement/feature in `PLATFORM_FEATURES_LIST.md` to the TC(s) covering it. Update whenever that file
> gains a row or a new TC is written — this file, not that file's own "Covered by TC" column, is the source of
> truth for coverage gaps. Backfilled 2026-10-01 from the plugin's actual, already-advanced test cycle, cross-checked
> against the real per-TC `**Status:**` lines in every suite file (not assumed from the Features List's own notes).

| # | Requirement / Feature | Source | Covered by TC(s) | Latest Result | Coverage Status |
|---|------------------------|--------|-------------------|----------------|------------------|
| 1 | Old-architecture baseline (pre-consolidation) | Features List #1 | `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-002–009 | 8/8 PASS (2026-09-28/29) | Covered |
| 2 | Platform plugin fresh install | Features List #2 | `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-013, 014 | PASS (clean install + fresh-install schema match) | Covered |
| 3 | Hard dependency enforcement | Features List #3 | `PLATFORM_INSTALLATION_AND_UPGRADE.md` | Covered as part of install/upgrade suite — no dedicated boot-refusal TC id captured above; re-verify a standalone case exists before calling this feature fully closed | Partial |
| 4 | Branch upgrade path (master → redmineflux_platform) | Features List #4 | `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-020, 021 | PASS after 3 retest rounds — `BUG-PLT-003`, `BUG-PLT-004`, `BUG-PLT-005` (all Closed, High/Critical) found and fixed along the way | Covered (history of 3 Critical/High migration bugs) |
| 5 | Organization / Company merge | Features List #5 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` | Resolved — `BUG-PLT-006` (duplicate-row defect, High) Closed | Covered |
| 6 | Contact / Customer merge | Features List #6 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` | PASS | Covered |
| 7 | Helpdesk Customer stays separate | Features List #7 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` | PASS | Covered |
| 8 | Leave consolidation | Features List #8 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | Resolved — `BUG-PLT-009` (Shift Mgmt Apply Leave 400, Critical) and `BUG-PLT-011` (Workload Request Leave 400, Critical) both Closed | Covered (post 2 Critical fixes) |
| 9 | Leave Type consolidation | Features List #9 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` | Resolved — `BUG-PLT-012` (Shift Mgmt Leave Type Create/Update 400, Critical) Closed | Covered (post 1 Critical fix) |
| 10 | Audit consolidation | Features List #10 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` | Resolved — `BUG-PLT-010` (monkey-patch signature collision breaking ~30 call sites, Critical) Closed | Covered |
| 11 | Team / Team Membership consolidation | Features List #11 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md`, `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` | CRUD matrix PASS all legs; but `BUG-PLT-013/014/015` (Audit Event not logged, Role split, no per-member Edit — Medium/Medium/Low) all Closed, and `BUG-PLT-016` (architectural: every shared entity independently re-implemented per consumer plugin — Medium) remains **Open** | Covered (with 1 open architectural bug) |
| 12 | Holiday / Holiday Scheme consolidation | Features List #12 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | PASS, including shared `WorkingCalendar` | Covered |
| 13 | Recurring-holiday calendar correctness | Features List #13 | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` | PASS | Covered |
| 14 | Shift Management pre-platform data carry-over (KNOWN GAP) | Features List #14 | `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` TC-PLT-093 | **Confirmed fixed** 2026-10-01 (previously a known gap) | Covered |
| 15 | Duplicate-table-drop guard | Features List #15 | `PLATFORM_INSTALLATION_AND_UPGRADE.md` | PASS (covered as part of upgrade-path migration testing) | Covered |
| 16 | Single-source-of-truth cross-plugin visibility | Features List #16 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | Mostly PASS — 1 of 28 TCs in this suite recorded a plain FAIL (name-regression on delete-audit path, overlaps `BUG-PLT-021`) and 1 more was re-executed and still FAIL | Partial |
| 17 | Single-source-of-truth cross-plugin writes | Features List #17 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | PASS (edits from one plugin's UI reflect immediately elsewhere) | Covered |
| 18 | Real form submission post-model-swap | Features List #18 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | Resolved — `BUG-PLT-009`, `BUG-PLT-011`, `BUG-PLT-012` (all Critical, stale pre-consolidation param keys) all Closed | Covered (post 3 Critical fixes, same defect class 3×) |
| 19 | Deliberately-not-merged entities stay separate | Features List #19 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | PASS | Covered |
| 20 | Vocabulary consolidation | Features List #20 | `PLATFORM_VOCABULARY_AND_LABELS.md` | 1 FAIL + 1 PARTIAL FAIL out of 13 TCs — `BUG-PLT-024` (leftover "Company" wording in CRM, Open, Low) and `BUG-PLT-025` (wrong Private/Visible-to-all vocabulary, Open, Low) | Partial |
| 21 | UX pass — dedicated pages | Features List #21 | `PLATFORM_VOCABULARY_AND_LABELS.md` | PASS | Covered |
| 22 | UX pass — button order/alignment | Features List #22 | `PLATFORM_VOCABULARY_AND_LABELS.md` TC-PLT-088 | PASS — `BUG-PLT-023` originally filed against this then **retracted** 2026-10-01 (wrong reference standard; Primary-first/left-aligned confirmed as the actual intended convention) | Covered |
| 23 | Organization–Contact linking | Features List #23 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` | **No coverage possible** — `BUG-PLT-026` (Open, Medium): the `rf_organization_contact_links` feature has a data model but zero UI/controller/API to exercise | **Not Covered** — feature is unimplemented, not merely untested |
| 24 | Outbox dispatcher | Features List #24 | `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-024 | PASS (42 pages, 0 server errors spot-check; dispatcher processes without manual intervention) | Covered |
| 25 | External identity mapping (groundwork, no consumer yet) | Features List #25 | `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` | Smoke/no-error check only, by design (no consumer feature exists yet per the ticket) | Covered (scope-limited, by design) |
| 26 | `contact_type` internal value (KNOWN GAP) | Features List #26 | `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` | **Confirmed fixed** 2026-10-01 (previously a known gap) | Covered |
| 27 | Demo data rake task | Features List #27 | — | Explicitly out of scope this cycle per `PLATFORM_SCOPE.md`/Features List Notes (dev/ops tooling, not UI-testable) | Out of Scope (documented) |
| 28 | Layered Settings sync (`SettingsService`) | Features List #28 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-094–097 | Resolved — `BUG-PLT-008` (neither-direction sync failure, High) Closed | Covered |
| 29 | Real Leave form submission across all 3 entry points | Features List #29 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-098–101 | Resolved — same `BUG-PLT-009`/`BUG-PLT-011` Critical fixes as #8/#18 | Covered |
| 30 | Team → consumer-plugin deep workflows | Features List #30 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-102–106 | PASS on the deep-workflow legs themselves, but 2 related bugs remain **Open**: `BUG-PLT-029` (Workload capacity list is a stale snapshot after Team removal, Medium) and `BUG-PLT-030` (deleting a Team with active Workloads silently cascade-deletes them, unguarded, Medium) | Partial |
| 31 | Delete-dependency handling for shared entities | Features List #31 | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-110–112 | Mixed — some deletes correctly refused with a clear reason (PASS), but `BUG-PLT-030` and `BUG-PLT-032` (Holiday Scheme → Holidays cascade, same unguarded pattern, Medium) remain **Open** | Partial |
| 32 | Header/breadcrumb/modal-button UI consistency | Features List #32 | `PLATFORM_VOCABULARY_AND_LABELS.md` TC-PLT-107–109 | Resolved — `BUG-PLT-007` (wrong/missing header text, stray breadcrumb, undersized modal buttons, Low) Closed | Covered |
| 33 | Entity CRUD & field validation | Features List #33 | `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md` TC-PLT-113–135 (23 TCs) | Mostly PASS, with several MIXED results — `BUG-PLT-017` (name-concat search), `BUG-PLT-018` (no Leaves search), `BUG-PLT-019` (no sortable headers except Teams), `BUG-PLT-020` (user-picker search doesn't filter), `BUG-PLT-021` (deleted-record audit name regression), `BUG-PLT-022` (tag-chip × race condition) — all **Open**, Medium/Low | Partial |
| 34 | Platform's own permission model | Features List #34 | `PLATFORM_PERMISSIONS_AND_ACCESS.md` TC-PLT-136–141 (12 TCs) | 12/12 PASS, all legs (hidden-UI + blocked-URL both verified per role) | Covered |
| 35 | Complete cross-plugin CRUD propagation matrix | Features List #35 | `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` TC-PLT-142–202 (62 TCs) | Large majority PASS all legs; 1 CONFIRMED FAIL (`BUG-PLT-012`, Closed); **12 TCs recorded as NOT EXECUTED** (6 + 3 + 1 + 1 + 1 across distinct notes) | Partial — real gap, see below |
| — | Security testing (mandatory, `SENIOR_QA_STANDARDS.md` §28) | — | `PLATFORM_SECURITY.md` TC-PLT-210–222 (13 TCs) | 11 PASS, 1 **FAIL** (TC-PLT-218 — confirmed stored XSS, `BUG-PLT-027`, **Critical, Open**), 1 BLOCKED (TC-PLT-221) | Partial — Critical open bug blocks Exit Criteria |
| — | Performance testing (mandatory, §29) | — | `PLATFORM_PERFORMANCE.md` TC-PLT-223–232 (10 TCs) | 9 PASS, 1 MIXED (TC-PLT-227, Audit Events) | Covered (no bug filed from this suite) |
| — | Code Quality review (mandatory, §30) | — | — | Not yet run as a dedicated pass | **Not Covered** |

## Gaps requiring action before this plugin can be marked `Complete`

1. **`BUG-PLT-027` (row "Security", Critical, Open)** — confirmed stored XSS on the Overview's Holiday Calendar
   widget. This alone blocks `STATUS.md` from ever reading `Complete` for this plugin until fixed, retested, and
   regressed (`SENIOR_QA_STANDARDS.md` §26's Critical-severity regression scope applies).
2. **Row 35 — 12 TCs in the CRUD propagation matrix were never executed.** This is the plugin's single largest
   suite (62 TCs) and the one place the architectural risk flagged in `BUG-PLT-016` is most likely to surface again;
   an unexecuted 12/62 slice is a real, non-trivial coverage hole, not a rounding error. Identify exactly which
   entity/origin-plugin/action combinations those 12 are and either execute them or record a specific, named
   exemption in `PLATFORM_SCOPE.md`.
3. **Row 23 — Organization–Contact linking is unimplemented, not just untested** (`BUG-PLT-026`). No TC can cover
   a feature with no UI/controller/API; this needs a product decision (build it, or formally descope Feature #23)
   before the matrix can show it as anything but `Not Covered`.
4. **Code Quality** (`SENIOR_QA_STANDARDS.md` §30) has no row-level coverage at all yet on this plugin — same gap
   already flagged in `PLATFORM_TEST_PLAN.md`'s Risks section.
5. **9 open bugs beyond the Critical XSS** (`BUG-PLT-016/017/018/019/020/021/022/024/025/026/028/029/030/031/032/033`
   — 16 total open as of 2026-10-01) span rows 11, 16, 20, 30, 31, 33 above. None individually blocks marking a
   *feature* Covered (the underlying flow works), but `bugs/open/` must still reach empty before `STATUS.md` can
   read `Complete`, per `CLAUDE.md` §10.
