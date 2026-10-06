# Traceability Matrix — Redmineflux Testcase Management

> Maps every requirement/feature to the TC(s) covering it. Update whenever `TESTCASE_MANAGEMENT_FEATURES_LIST.md`
> gains a row or a new TC is written — this file, not that file's own "Covered by TC" column, is the source of
> truth for coverage gaps. Backfilled 2026-10-01 from the plugin's actual, already-advanced test cycle; the
> Features List's own "Notes" section was found stale at backfill time (claimed "everything but CSV Import is
> authored but not executed" — untrue as of the 2026-09-30/10-01 regression) and is superseded by this file.

| # | Requirement / Feature | Source | Covered by TC(s) | Latest Result | Coverage Status |
|---|------------------------|--------|-------------------|----------------|------------------|
| 1 | CSV Import — Steps & Expected Results | Features List #1 | TC-TCM-021–036 | 16/16 PASS (regression 2026-09-11) | Covered |
| 2 | Environment management | Features List #2 | TC-TCM-038–045 | All resolved (checkpoint 2026-09-30/10-01) | Covered |
| 3 | Test suite management | Features List #3 | TC-TCM-192–203 | 12/12 resolved (checkpoint) | Covered |
| 4 | Test case authoring | Features List #4 | TC-TCM-128–143 | Resolved PASS/FAIL/BLOCKED (checkpoint) | Covered |
| 5 | Test case ↔ suite organisation | Features List #5 | TC-TCM-144–151 | Resolved (same checkpoint as #4) | Covered |
| 6 | Test run lifecycle | Features List #6 | TC-TCM-152–169 | 39/40 resolved; TC-TCM-187 blocked (needs 2 independent browser contexts, tooling limitation, not a defect) | Partial |
| 7 | Test execution | Features List #7 | TC-TCM-170–187 | Same checkpoint as #6 | Covered |
| 8 | Bulk update of results | Features List #8 | TC-TCM-188–191 | Resolved this cycle — BUG-TCM-003 (the original blocker) closed 2026-09-30 | Covered |
| 9 | Reporting (6 report types) | Features List #9 | TC-TCM-078–097 | All 20 TCs executed via the automation-first Playwright suite 2026-10-05 (`automation/tests/TESTCASE_MANAGEMENT_REPORTS.spec.ts`) — 1 FAIL (TC-TCM-095, real app defect BUG-TCM-028), rest PASS | Covered (with 1 open bug) |
| 10 | Report emailing & scheduling | Features List #10 | TC-TCM-098–111 | All 14 TCs executed via the automation-first Playwright suite 2026-10-05, all PASS (TC-TCM-100/101/106 remain `test.fixme` — need shell access to the Redmine Docker container to force a Sidekiq/PDF failure, not achievable from the browser-only suite) | Covered (3 fixme, tooling-gated) |
| 11 | Requirements management | Features List #11 | TC-TCM-112–121 | All 16 resolved — suite marked complete 2026-10-01 | Covered |
| 12 | Traceability matrix (RTM) — the plugin's own feature | Features List #12 | TC-TCM-122–127 | Same checkpoint as #11 | Covered |
| 13 | To-Do management | Features List #13 | TC-TCM-205–210 | All resolved — suite marked complete 2026-10-01 (TC-209 blocked, extends BUG-TCM-022) | Covered |
| 14 | Activity log | Features List #14 | TC-TCM-211–214 | All resolved — suite marked complete 2026-10-01 (TC-214 FAIL, extends BUG-TCM-009) | Covered |
| 15 | Roles & permissions (16 perms / 6 groups) | Features List #15 | TC-TCM-046–077 | Checkpoint 2026-09-30; 5 deferred (TC-TCM-051/067/068/069/073); BUG-TCM-007 (High), BUG-TCM-009 (High) found | Partial |
| 16 | Plugin configuration (trackers, toggles, run types) | Features List #16 | TC-TCM-001–007, 015–016 | Checkpoint 2026-09-30; BUG-TCM-010 (High), BUG-TCM-011 (High) found | Covered (with 2 open bugs) |
| 17 | Email notifications (Run Added/Updated/Result Added) | Features List #17 | TC-TCM-008–014 | TC-TCM-011 and TC-TCM-012 (Run Added / Run Updated) have **no recorded evidence at all** — only TC-TCM-013 (Result Added, BUG-TCM-012/013) and TC-TCM-008–010 were actually executed 2026-09-30; TC-TCM-014 deferred | **Partial — real gap**: Run Added/Run Updated notifications untested despite the feature reading as "checkpoint-complete" |
| 18 | Installation prerequisites (Redis/Node/Puppeteer/Sidekiq) | Features List #18 | TC-TCM-017–020 | TC-018/019 executed 2026-09-14 (019 → BUG-TCM-005/006, now closed); TC-020 likely covered same date; TC-017 (Redis stopped) deferred 2026-09-30 (shared-instance risk) | Partial |
| 19 | Security testing (cross-cutting, `SENIOR_QA_STANDARDS.md` §28) | `TESTCASE_MANAGEMENT_SCOPE.md` | TC-TCM-215–248 | Authored 2026-10-06, not yet executed. Several cases re-confirm already-filed bugs (BUG-TCM-003, 007, 009, #121896) — expect those to reproduce until the underlying fix lands. | Covered (authored, execution pending) |
| 20 | Performance testing (cross-cutting, `SENIOR_QA_STANDARDS.md` §29) | `TESTCASE_MANAGEMENT_SCOPE.md` | TC-TCM-249–268 | Authored 2026-10-06, not yet executed — needs large-data fixtures seeded first (see suite's own Fixtures section) | Covered (authored, execution pending) |

## Gaps requiring action before this plugin can be marked `Complete`

1. ~~**Reporting (row 9)** and **To-Do / Activity log (rows 13–14)**~~ — **closed 2026-10-05 / 2026-10-01.** All
   three suites (`REPORTS.md`, `TODO.md`) are now executed; `REPORTS.md` was the plugin's last fully-unexecuted
   suite, run via the new automation-first Playwright spec (CLAUDE.md §13). **BUG-TCM-028 (open) is the one
   remaining blocker to `Complete` per `bugs/open/` being non-empty — see row 9.**
2. **TC-TCM-011 / TC-TCM-012 (row 17)** — the Run Added / Run Updated notification tests were never actually
   executed; this was found only by building this matrix, not by the Features List's own tracking. Execute both
   before trusting Feature #17 as checkpoint-complete.
3. **TC-TCM-187 (row 6)** — genuinely blocked by tooling (needs two independent browser contexts), not deferred by
   choice. Needs either a manual two-session execution or an accepted permanent exemption.
4. ~~**Security / Performance / Code Quality** (`SENIOR_QA_STANDARDS.md` §28–§30) have no row here yet~~ —
   **addressed 2026-10-06**: Security (row 19, TC-TCM-215–248) and Performance (row 20, TC-TCM-249–268) suites are
   now authored; **execution is still pending** for both, and is the real remaining gap — don't treat "authored"
   as "Covered" in the sense `CLAUDE.md` §2c/§10 require (a TC with zero run evidence isn't proven coverage).
   Code Quality (§30) remains deliberately suite-less per its own rule — folded into root-cause investigations,
   recorded in `TESTCASE_MANAGEMENT_MEMORY.md`'s "Recurring Issues" as they're found (several already are:
   BUG-TCM-007/009's missing-authorization-check pattern, the `.json`-route auth bypass pattern).
