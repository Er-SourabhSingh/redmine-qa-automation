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
| 9 | Reporting (6 report types) | Features List #9 | TC-TCM-078–097 | Only 2 of ~20 TCs have any recorded evidence (2026-09-14) | **Not Covered** — not yet part of the 2026-09-30/10-01 regression |
| 10 | Report emailing & scheduling | Features List #10 | TC-TCM-098–111 | Partial: install-prereq + PDF-fallback path retested 2026-09-30 (TC-TCM-101, BUG-TCM-006 closed); scheduling (TC-TCM-107–111) unexecuted | Partial |
| 11 | Requirements management | Features List #11 | TC-TCM-112–121 | All 16 resolved — suite marked complete 2026-10-01 | Covered |
| 12 | Traceability matrix (RTM) — the plugin's own feature | Features List #12 | TC-TCM-122–127 | Same checkpoint as #11 | Covered |
| 13 | To-Do management | Features List #13 | TC-TCM-205–210 | No recorded evidence found in the suite file | **Not Covered** |
| 14 | Activity log | Features List #14 | TC-TCM-211–214 | No recorded evidence found in the suite file | **Not Covered** |
| 15 | Roles & permissions (16 perms / 6 groups) | Features List #15 | TC-TCM-046–077 | Checkpoint 2026-09-30; 5 deferred (TC-TCM-051/067/068/069/073); BUG-TCM-007 (High), BUG-TCM-009 (High) found | Partial |
| 16 | Plugin configuration (trackers, toggles, run types) | Features List #16 | TC-TCM-001–007, 015–016 | Checkpoint 2026-09-30; BUG-TCM-010 (High), BUG-TCM-011 (High) found | Covered (with 2 open bugs) |
| 17 | Email notifications (Run Added/Updated/Result Added) | Features List #17 | TC-TCM-008–014 | TC-TCM-011 and TC-TCM-012 (Run Added / Run Updated) have **no recorded evidence at all** — only TC-TCM-013 (Result Added, BUG-TCM-012/013) and TC-TCM-008–010 were actually executed 2026-09-30; TC-TCM-014 deferred | **Partial — real gap**: Run Added/Run Updated notifications untested despite the feature reading as "checkpoint-complete" |
| 18 | Installation prerequisites (Redis/Node/Puppeteer/Sidekiq) | Features List #18 | TC-TCM-017–020 | TC-018/019 executed 2026-09-14 (019 → BUG-TCM-005/006, now closed); TC-020 likely covered same date; TC-017 (Redis stopped) deferred 2026-09-30 (shared-instance risk) | Partial |

## Gaps requiring action before this plugin can be marked `Complete`

1. **Reporting (row 9)** and **To-Do / Activity log (rows 13–14)** — genuinely not covered by this cycle's
   regression. Either execute `TESTCASE_MANAGEMENT_REPORTS.md` and `TESTCASE_MANAGEMENT_TODO.md` in full, or
   record them in `TESTCASE_MANAGEMENT_SCOPE.md`'s Out of Scope with a reason.
2. **TC-TCM-011 / TC-TCM-012 (row 17)** — the Run Added / Run Updated notification tests were never actually
   executed; this was found only by building this matrix, not by the Features List's own tracking. Execute both
   before trusting Feature #17 as checkpoint-complete.
3. **TC-TCM-187 (row 6)** — genuinely blocked by tooling (needs two independent browser contexts), not deferred by
   choice. Needs either a manual two-session execution or an accepted permanent exemption.
4. **Security / Performance / Code Quality** (`SENIOR_QA_STANDARDS.md` §28–§30) have no row here yet because no TC
   suite targets them specifically on this plugin — add TCs or record the gap in Scope before calling this cycle
   done.
