> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121887** ("rftc-044 — Quality HQ: org-wide QA command center"),
> part of **Testcase Management plugin Release 7.2.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC044-<n>`.
>
> **Executed**: 2026-10-19, same environment as `RFTC-020`/`RFTC-021`.

# Test Cases — Redmineflux Testcase Management — rftc-044: Quality HQ

## Plugin
- Name: Redmineflux Testcase Management
- Version: master (post-7.1.0, pre-7.2.0)
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Production ticket: #121887 (ztflux), done ratio 90%, status "In QA"

## Feature summary

A new top-level global nav item "Quality HQ" (mirroring the Helpdesk Command Center pattern) gives a
cross-project QA overview: active runs, pass/fail/blocked rollups, per-project health, and placeholders for
Most-Failed/Slowest/Flaky/Requirement-Coverage (explicitly not wired up yet — the dev's own note says these stay
honest "Not yet available" rather than showing unreliable data). Permission-gated: hidden from the menu and
blocked by a proper 403 for anyone not authorized, never silently letting a non-admin in.

---

### RFTC044-1 (Positive): Admin sees the dashboard with correct aggregated, real cross-project data

**Priority:** P1
**Steps:** As admin, click "Quality HQ" in the top nav.
**Expected Result:** A page rendering: total projects tracked, active runs, overall pass rate, total failing,
overdue runs; a per-project table with Active Runs/Passed/Failed/Blocked/Pass Rate/Health.
**Actual Result:** PASS. Exact real numbers: `2 Projects Tracked`, `4 Active Runs`, `50% Overall Pass Rate`, `4
Total Failing`. Per-project row for `RFTC-016 CI Ingest QA`: `4 active runs, 5 passed, 4 failed, 1 blocked, 50%
pass rate, Health = Failing` — hand-verified against the real execution data accumulated across this and prior
sessions (5 passed / 10 total = 50%, matches). The other project (`BUG-121896 Retest`, no executions) correctly
shows `No data` rather than a crash or a fabricated 0%.

---

### RFTC044-2: Unfinished sub-reports render an honest "Not yet available" placeholder, not fake or broken data

**Priority:** P2
**Steps:** Observe the "Most Failed Tests", "Slowest Tests", "Flaky Tests", "Requirement Coverage" sections on
the same dashboard.
**Expected Result:** Per the dev's own disclosed scope-limitation, these should say "Not yet available" rather
than attempt real numbers (the underlying data layer wasn't touched for this round).
**Actual Result:** PASS — all four sections correctly show "Not yet available." Honest, not a silent blank or a
crash. **Noted, not filed as a bug**: this is explicitly a disclosed scope limitation of this release, not a
defect — `RFTC-021`'s own Most Failed Tests report (the standalone one, not this dashboard widget) IS fully
functional, so the underlying metric exists; it's only this specific dashboard's own integration of it that's
deferred.

---

### RFTC044-3 (SACRED/negative): Non-admin user — menu item hidden

**Priority:** P1
**Steps:** Create a fresh non-admin user (`qanonadmin`); log in as them; inspect the top nav.
**Expected Result:** "Quality HQ" does not appear in the menu at all.
**Actual Result:** PASS. Confirmed via DOM text scrape of the top nav — `Quality HQ` absent for this user, while
present for admin on the same instance.

---

### RFTC044-4 (SACRED/negative): Non-admin user — direct URL access is blocked with a proper 403, not a crash or silent admission

**Priority:** P1 — the dev's own claim: *"even if someone tries to open the page directly by typing the address,
they're blocked with a proper 'not allowed' message rather than being let in by accident"*
**Steps:** As the same non-admin user, navigate directly to `/quality_hq`.
**Expected Result:** HTTP 403, a clean "not authorized" page — never a 500, never the real dashboard content.
**Actual Result:** PASS. `HTTP 403`, body: `"403 / You are not authorized to access this page."` — clean,
correct denial.

---

## Not Executed

- **Flaky-trend detection, requirement coverage rollup** — not independently testable; these sections are
  explicitly unimplemented placeholders this release (see RFTC044-2).
- **A role with SOME but not full admin rights** (e.g. a project-level Manager who isn't a Redmine admin) — only
  a plain non-admin user and the full admin were tested; the permission boundary's exact cutoff (is it
  `admin?` only, or could a suitably-permissioned non-admin also see it?) was not probed with an intermediate
  role. Given the dev's description says "Admins now see," this is likely admin-only by design, but a
  intermediate-role negative case would strengthen this further.
- **Multi-project scale** (dashboard behavior with 10+ projects, pagination if any) — only 2 projects existed in
  this environment.

## Coverage Summary

**4/4 executed scenarios PASS, zero bugs found.** Both the positive (admin, real aggregated data) and negative
(non-admin, menu-hidden + direct-URL-blocked) permission paths hold cleanly.
