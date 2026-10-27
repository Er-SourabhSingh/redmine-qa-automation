# Redmineflux Testcase Management — Regression Testing Report — 2026-10-27

> Post-bug-fix regression triggered by the 39 bugs retested/closed over 2026-10-26/2026-10-27
> (BUG-TCM-009 through BUG-TCM-122). Scope and priority order determined per `SENIOR_QA_STANDARDS.md` §26
> (severity-driven regression scope) — Critical/High severity areas first. This is a **targeted, in-progress**
> pass, not the full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27, all 22 features) that `bugs/open/`
> being empty also requires before `STATUS.md` can show `Complete`.

## Areas fully covered this pass (Critical tier — COMPLETE)

| Area | Suite file | TCs touched | Result |
|---|---|---|---|
| Requirements management (full CRUD, editor/escaping, linking) | `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` | TC-TCM-112–121, 269, 273, 303–310, 312 | All PASS |
| Traceability Matrix | same file | TC-TCM-122, 124, 315 (live); 123/125/126/127/313/314 (structural, lighter-touch) | PASS |
| Report emailing & scheduling | `TESTCASE_MANAGEMENT_REPORTS.md` | TC-TCM-098, 110, 111 | All PASS, **fully live-reproduced** (no code-read substitutes) |
| Installation prerequisites | `TESTCASE_MANAGEMENT_CONFIGURATION.md` | Sidekiq-boot-health re-check (BUG-TCM-111) | PASS |

**Summary: ~27 TCs executed live across the Critical tier, all PASS, 1 new bug found (BUG-TCM-123, High).**

**Deferred within Requirements/RTM (low priority, not touched by this cycle's fixes):** TC-TCM-270 (rapid
multi-block race), TC-TCM-271/272 (mention link/unlink via `#`-trigger, needs careful real-keystroke simulation).

## Bugs re-verified fixed this pass (all live, no code-read substitutes remaining)

| Bug ID | Severity | What was re-verified |
|---|---|---|
| BUG-TCM-093 | Critical | Editor/escaping group shows no regression (full CRUD + linking lifecycle exercised) |
| BUG-TCM-072 / BUG-TCM-121 | High / Low | Mention links and highlight spans still render correctly |
| BUG-TCM-099 | Low | Escape key — no console error |
| BUG-TCM-027 | — (closed 2026-10-06) | **Notable: now genuinely fixed on both sides (Issue Edit form unlink), contradicting TC-TCM-311's 2026-10-23 "still broken" finding** — left both findings on record, not filed as a new bug (it's an improvement) |
| BUG-TCM-108 | High | Tester Scorecard + "Include all test run": no 500 on view **and** the notification email now genuinely arrives (confirmed via Mailpit) |
| BUG-TCM-110 | High | Found the real Scheduled Reports UI section's own Cancel action; live-clicked it — no 404, schedule genuinely removed |
| BUG-TCM-111 | Critical | Sidekiq boots cleanly (`connection_pool 2.5.5`); **ReminderWorker backlog fired live** (Mailpit jumped 7→100 messages), confirming the scheduled-job poller genuinely dequeues jobs now, not just boots without crashing |

## High-tier areas — targeted fast pass (per direct user request: "fast way me test karo jo bhi impacted area
lagte hai" — only TCs tied to this cycle's specific bug fixes, not exhaustive suite re-runs)

| # | Area | Bugs | Freshly live-reproduced this pass | Relies on existing (2026-10-26) source-diff/API evidence |
|---|---|---|---|---|
| 1 | Roles & permissions | 009, 089, 113 | **113** (milestone perms now real checkboxes on Roles page) | 009 (live curl, 1 day old), 089 (attachment-download spot-check) |
| 2 | Email notifications | 013, 087, 088 | **087** (real "Run Added" email delivered to a different user) | 013 (same-day Mailpit check, see Critical tier), 088 |
| 3 | Test case authoring | 090, 096 | **090** (Edit Folder `data-project_id` fix, no 404) | 096 (live API, 1 day old) |
| 4 | Test suite management | 090, 092 | **092** (no-`testsuite_id` page loads clean, no 500) | — |
| 5 | CSV Import | 091 | — | 091 (not live-reproduced; wizard too heavy for this pass) |
| 6 | Test execution | 094, 101, 103, 104 | **101** (Run/Environment switch, zero console errors) | 094, 103, 104 |
| 7 | Test case ↔ suite org | 095, 097, 098, 112 | **098** (run #83 "All Suites" shows real data, spot-check) | 095, 097, 112 |
| 8 | Test run lifecycle | 097 (shared), 116 | — | 097 (via area 7), 116 |
| 9 | Reporting | 102, 105, 106, 107, 114 | **106** (real .xlsx downloaded, not "Unknown Report Type") | 102, 105; 107/114 environment-blocked (no working PDF generation on this instance) |

**Summary: 8 of ~18 targeted bugs got fresh live reproduction this pass; the rest stand on genuine evidence from
1 day earlier (2026-10-26) with no relevant commits since, or are environment-blocked (PDF generation). Zero new
bugs found in the High-tier pass, zero regressions.**

## New bug filed this pass

- **BUG-TCM-123 (High, open)** — `RequirementsController#content` has zero cross-project scoping
  (`Requirement.where(id: params[:id])` with no `project_id` clause in either branch). A user with access to ANY
  project can read ANY other project's Requirement content — even a private one they are not a member of — by
  changing `page_id`. Confirmed live as `qa.limited` (real Manager on `rftc-016-ci-qa` only, genuine `403` on
  `alpha-web`) fully reading `alpha-web`'s private Requirement #115. Found while extending TC-TCM-121's
  project-scoping check to directly test cross-project `page_id` access, which the original TC never covered.

## Data-hygiene note (not a bug, recorded for awareness)

Deleting a `TestcaseReport` row via the main Reports list's Delete icon does **not** cascade-delete its
associated `ScheduledReport` row — found while cleaning up test fixtures; an orphaned schedule from an earlier
pass this session was still listed in the Scheduled Reports table after its parent report had already been
deleted. Not filed as a bug (no user-facing harm beyond a lingering schedule row), but worth a human's attention
if it causes confusion later.

## Not yet executed (resume points for next session)

- **Requirements/RTM**: TC-TCM-270–272 only — everything else in this file is done.
- **CSV Import (BUG-091)**: drive the real import wizard with a cross-project `selected_suite_id` tamper; not
  attempted this pass (multi-step file-upload flow too heavy for the "fast" directive).
- **Test execution (BUG-094/103/104)**: cross-project IDOR check, timestamp-collision filter leak, two-real-user
  misattribution check — each needs more elaborate setup than this pass allowed.
- **Test case↔suite org (BUG-095/097/112) and Test run lifecycle (BUG-116)**: denied-role submenu check,
  multi-suite/multi-environment contradictory-status fixture, drag-and-drop simulation, and a DB-level orphan-row
  check (blocked by the `secret_key_base`/`docker exec` gap noted below) respectively.
- **Reporting (BUG-102/105)**: defect multi-run aggregation check, multi-environment Defect Summary pairing
  check.
- **Reporting (BUG-107/114, PDF-dependent)**: genuinely blocked on this environment — Puppeteer/Node PDF
  generation doesn't work here (confirmed via a report-email silently falling back to HTML earlier this session).
  Needs an environment with working PDF generation to re-verify live.
- Full exhaustive TC-by-TC re-runs of all 9 High-tier suites (this pass deliberately only touched the TCs tied to
  specific bug fixes, per the user's own "fast" directive) — still needed for the eventual full §27 final-cycle
  regression.
- **Not touched by any of this cycle's bugs at all** (only needed for the full §27 final-cycle regression):
  Environment management, Bulk update of results, To-Do management, Activity log, Plugin configuration,
  Performance testing, Project Overview dashboard

## Notes / Findings

- Redmine version: 6.x (Docker `redmine6-redmine-1`), plugin version 7.2.0
- Environment: `localhost:3000`, project `rftc-016-ci-qa` (plus a brief, fully-cleaned-up cross-project check
  against `alpha-web` as `qa.limited` for BUG-TCM-123)
- Test Date: 2026-10-27
- One cosmetic, pre-existing, unrelated console 404 noted (`article-icon.svg` missing asset) — not filed, no
  functional impact, not a regression from any of this cycle's fixes
- An initial attempt to test TC-TCM-271 live overwrote a shared fixture's content via Playwright `.fill()`;
  caught before saving, confirmed fully reverted on reload — no data was actually lost. Lesson applied for the
  rest of this pass: use disposable fixtures for manual edit-testing, not shared ones.
- `rails runner` inside the web container fails with a `secret_key_base` error when invoked via `docker exec`
  (not available in that shell context) — avoided per this project's standing constraint on environment-variable
  access; used the Admin UI and `docker logs`/`bundle list` instead wherever a DB/gem check was needed.
