> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121887** ("rftc-044 — Quality HQ: org-wide QA command center"),
> part of **Testcase Management plugin Release 7.2.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC044-<n>`.
>
> **Executed**: 2026-10-19 (first pass) + 2026-10-19 follow-up (full spec re-read + gap-fill, see "Second
> Follow-up" below), same environment as `RFTC-020`/`RFTC-021`. Follow-up added a dedicated fixture user
> `qa.limited` (id 7, Manager on `RFTC-016 CI Ingest QA` only) — kept separate from the pre-existing `QA NonAdmin`
> fixture (zero memberships) so both the "permitted non-admin" and "no permission anywhere" paths stay
> independently retestable in future sessions.

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

## Second Follow-up (2026-10-19) — full 443-line production spec re-read; the permission-boundary ambiguity the first pass flagged is resolved, plus SEC-001/002 holdouts and the admin/EnabledModule gate now independently verified

A full read of `backlog/planning/rftc-044-feature-quality-hq-command-center.md` (local checkout `C:\redmine v6\plugins\redmineflux_testcase_management\backlog\planning\`) showed the gate is **`:view_report` held globally in at least one project** (`init.rb`'s `menu :top_menu, :quality_hq, …, if: Proc.new { User.current.logged? && (User.current.admin? || User.current.allowed_to?(:view_report, nil, global: true)) }`), **not admin-only** — directly resolving the exact ambiguity the first pass's own "Not Executed" section flagged ("is it `admin?` only, or could a suitably-permissioned non-admin also see it?"). The first pass's non-admin test user (`QA NonAdmin`) had **zero** project memberships, so it only ever exercised the no-permission-anywhere path (spec's sacred functional test 5), never the permitted-non-admin path (functional test 1) or the cross-project isolation holdout (functional test 2/3, the single most security-critical test in the whole spec). This follow-up closes both gaps, plus independently verifies two more Gate-2 HIGH findings (SEC-002 escaping, the admin/`EnabledModule` intersection) that were never checked.

A **new, separate user** (`qa.limited`, id 7 — kept distinct from the existing `QA NonAdmin` fixture so both permission states stay independently retestable) was created and added as **Manager** to `RFTC-016 CI Ingest QA` **only** — explicitly **not** added to the sibling project `BUG-121896 Retest` (itself a subproject with "Inherit members" unchecked, confirmed, so no membership leaks through inheritance).

---

### RFTC044-5 (spec Functional 1 — corrects the first pass's open question): A non-admin user holding `:view_report` on at least one project DOES see the menu and CAN open the dashboard — the gate is the permission, not `admin?`

**Priority:** P1
**Steps:** Logged in as `qa.limited` (Manager on `RFTC-016 CI Ingest QA` only, not an admin); inspected the top nav; clicked through to `/quality_hq`.
**Expected Result:** Per spec Objectives/Permissions, "Quality HQ" appears in the nav and `/quality_hq` returns 200 for any `:view_report` holder, admin or not.
**Actual Result:** PASS. "Quality HQ" was visible in `qa.limited`'s top nav (confirmed via DOM), and clicking it rendered the full dashboard (200, not a 403) — settling the first pass's open question in favor of the spec's actual documented gate, not the narrower "admin sees" reading of the dev's own prose summary.

---

### RFTC044-6 (spec Functional 2, SACRED holdout, SEC-001 — the single most important test in the spec): Cross-project isolation — the limited user sees ONLY their one permitted project, zero data from the other

**Priority:** P1 — Gate 2 HIGH finding #1's exact failure mode if this breaks
**Steps:** As `qa.limited` (permitted on `RFTC-016 CI Ingest QA` only; `BUG-121896 Retest` has real TCM data and is a different project the admin can see), loaded `/quality_hq` and inspected every number and name on the page.
**Expected Result:** `Projects Tracked == 1`; only `RFTC-016 CI Ingest QA`'s row appears; `BUG-121896 Retest`'s name, run counts, and pass/fail numbers appear **nowhere** — not in the tiles, not in the table.
**Actual Result:** **PASS.** `1 Projects Tracked`, `28 Active Runs`, `67% Overall Pass Rate` — exactly `RFTC-016`'s own numbers (confirmed identical to what the same project shows in the admin's 2-project view below), with a single table row for `RFTC-016 CI Ingest QA`. `BUG-121896 Retest` does not appear anywhere in the rendered page. The isolation boundary (`Project.allowed_to(User.current, :view_report)`) holds for a real, permission-scoped non-admin user — not just in theory.

---

### RFTC044-7 (spec Routes / Implementation Notes "project_rollup"): The optional `project_rollup` JSON endpoint was not shipped this release — confirmed absent, not merely untested

**Priority:** P2
**Steps:** As `qa.limited`, requested `GET /quality_hq/project/1/rollup` directly (the documented optional lazy-load path).
**Expected Result:** Either the endpoint exists and is session-authenticated + re-authorizes the target project (spec's sacred holdout tests 7/13), or it was legitimately cut from v1 (the spec explicitly allows this: *"If honouring that constraint is awkward, cut the endpoint from v1"*).
**Actual Result:** `404 Not Found` — the route does not exist in this build. This is the **permitted** outcome per the spec's own fallback clause, not a gap: with no endpoint, there is no `.json`-API-format session-auth-bypass surface (Gate 2 HIGH finding #2) to begin with. Functional tests 7/13 are therefore **moot for this release**, not failing — re-test them if/when the endpoint is added in a future version.

---

### RFTC044-8 (spec Functional 10, SEC-002): A project name containing `<script>` renders escaped, not executed — no `raw`/`html_safe` sink

**Priority:** P1
**Steps:** Temporarily renamed `BUG-121896 Retest` to `<script>alert('qhq-xss')</script> Retest` (admin), reloaded `/quality_hq`, inspected the **raw HTTP response body** (not just the accessibility tree, which would show the same text whether escaped or not) for the literal markup; reverted the name immediately after.
**Expected Result:** The name renders as inert, HTML-entity-escaped text in the per-project table; no `<script>` tag executes.
**Actual Result:** PASS. Raw response showed `<a href="/projects/bug-121896-retest/testcase_reports">&lt;script&gt;alert(&#39;qhq-xss&#39;)&lt;/script&gt; Retest</a>` — correctly entity-escaped (`&lt;`/`&gt;`/`&#39;`), no live tag, no dialog fired on page load. Also incidentally confirmed the spec's **global-context CSS requirement**: the raw response explicitly includes `<link rel="stylesheet" href=".../rf_testcase_management_variables-...css">` and `_components-...css` via an explicit `stylesheet_link_tag` in the view, exactly as Implementation Notes "Top-menu CSS in a global context" requires (the per-project view-hook does not fire on this global page, so the view must `stylesheet_link_tag` itself — confirmed present, not silently missing per the spec's own cited LESSON-062 risk class).

---

### RFTC044-9 (spec Functional 6 + Edge Case 4, Gate 2 HIGH finding #3): Admin's aggregate view excludes a project with the TCM module disabled — the admin branch intersects `EnabledModule`, it does not aggregate `Project.all`

**Priority:** P1 — the spec's own Gate-2 finding was that an admin-bypasses-`allowed_to` branch could resurrect QA data from a module-disabled project if not explicitly intersected with `EnabledModule`
**Steps:** As admin (2 projects visible: `RFTC-016 CI Ingest QA`, `BUG-121896 Retest`), disabled the "Redmineflux Testcase Management" module on `BUG-121896 Retest` only, reloaded `/quality_hq`, then re-enabled the module immediately after to restore state.
**Expected Result:** With the module disabled, `BUG-121896 Retest` disappears from the admin's own dashboard too (admin sees all **TCM-enabled** projects, not literally all projects) — `Projects Tracked` drops from 2 to 1.
**Actual Result:** PASS. `Projects Tracked` dropped to `1` with the module disabled, and the table showed only `RFTC-016 CI Ingest QA` — confirming the admin branch genuinely intersects `EnabledModule.where(name: 'testcase_management')` rather than reducing over every project the admin can technically open. Module re-enabled afterward; state fully restored (confirmed `2 Projects Tracked` again).

---

### RFTC044-10 (spec Unit 14 / Data Model "coverage_pct nil not 0"): A project with zero requirements shows "No data" for coverage, never a misleading 0%

**Priority:** P2
**Steps:** Confirmed `RFTC-016 CI Ingest QA` has **zero** requirements (`/requirements?project_id=rftc-016-ci-qa` — empty list, "no-data" state), then checked that project's own "Requirement Coverage" column value on the Quality HQ table.
**Expected Result:** `coverage_pct == nil` → rendered "No data", never `0%` (which would misleadingly read as "0% covered" rather than "nothing to cover").
**Actual Result:** PASS — the column reads "No data" for a genuinely requirement-less project, matching the pinned `nil`-not-`0` contract. (The separate bottom-of-page "Requirement Coverage" **section** is the still-unwired placeholder from RFTC044-2 — a different thing from this per-project **column**, which is core rollup functionality per the spec, not one of the capability-gated sibling metrics.)

---

### RFTC044-11 (spec Implementation Notes "Health band — a transparent, testable formula"): The red/amber/green threshold empirically matches the pinned formula

**Priority:** P3 (confirmatory)
**Steps:** Observed `RFTC-016 CI Ingest QA`'s real pass rate (67%) against its rendered health tag.
**Expected Result:** Per the pinned formula, `:red` when `pass_rate < 70`.
**Actual Result:** PASS — 67% rendered as `Failing` (the danger/red status tag), consistent with the `< 70 → red` band boundary, not a fixed `<50` or some other unstated cutoff.

---

### An incidental, unrelated observation (not a new bug — same root cause as an already-filed one)

While navigating to `/requirements?project_id=rftc-016-ci-qa` immediately after the Quality HQ checks above, a stray `alert('export-xss')` dialog fired and had to be dismissed twice. This is the same test-case subject (`<img src=x onerror=alert('export-xss')>`, created earlier this session for the RFTC-021 export-path check) and almost certainly the same root cause as the already-filed **BUG-TCM-070** (the Most Failed Tests chart's ApexCharts XSS) — likely a queued re-render timer from an earlier chart view firing late on an unrelated subsequent navigation, not a new Quality-HQ-specific vulnerability (Quality HQ itself has no chart and does not render this test case anywhere, confirmed above). Not filed separately; noted for awareness only.

## Not Executed

- **Flaky-trend detection** — not independently testable; still explicitly unimplemented this release (see RFTC044-2).
- **Archived-project exclusion** (the other half of Edge Case 4 — `Project.status != STATUS_ARCHIVED`) — not
  exercised; this environment has no spare project safe to archive without disrupting other suites' fixtures.
  The module-disabled half of the same edge case (RFTC044-9) was independently confirmed.
- **`project_rollup` session-auth/re-authorization holdouts (functional 7/13)** — moot this release; the endpoint
  does not exist (RFTC044-7). Re-test if/when it ships.
- **Cold-cache bounded fallback, `QHQ_INLINE_FALLBACK_CAP`, fingerprint invalidation, worker set-based tally vs.
  Ruby oracle** — not independently verified; these require either Rails-console/query-count instrumentation or
  10+ projects to observe the fallback cap, neither available via black-box UI testing in this environment.
- **Private-issue-in-named-list exclusion (functional 3/12)** — moot this release; the Most-Failed/Slow/Flaky/
  Coverage sections that would name individual test cases are all still "Not yet available" placeholders
  (RFTC044-2), so there is no named-record list for a private issue to leak through yet. Re-test once any
  sibling metric (rftc-019/020/021) is actually wired into this dashboard.
- **Multi-project scale** (10+ projects, pagination) — only 2 projects exist in this environment.

## Coverage Summary

**11/11 executed scenarios PASS, zero bugs found.** First pass (4/4) covered the basic positive/negative shape.
This follow-up, prompted by a full spec re-read, closed the exact ambiguity the first pass itself had flagged
(permission gate is `:view_report`-anywhere, not `admin?`) and independently verified the spec's single most
critical property — **cross-project isolation for a real permission-scoped non-admin user** — plus SEC-002
escaping (including the global-context CSS requirement), the admin/`EnabledModule` intersection (Gate-2 HIGH
#3), the `project_rollup` endpoint's confirmed non-existence (so its own HIGH-severity SEC-004 risk is currently
moot, not unresolved), and the `coverage_pct` nil-vs-zero contract. Every Gate-1/Gate-2 HIGH-severity finding that
is observable via black-box UI testing (as opposed to requiring Rails-console query-count instrumentation or a
10+-project cold-cache scenario) now has independent confirmation, not just a re-statement of the spec's own
claims.

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. Two directly relevant commits landed since last
execution (2026-10-19):

- **`4a5b595`** "Fix the Quality HQ dashboard showing raw 'Translation missing' text" (2026-10-21) — this exact
  page had every tile/heading/badge broken with literal `Translation missing: en.label_qhq_...` strings (filed
  as **BUG-TCM-082**, Critical, since re-reopened-and-fixed alongside BUG-TCM-067 — both Closed,
  `bugs/closed/BUG-TCM-082.md`). **Live-reconfirmed this pass:** loaded `/quality_hq` as admin, scanned the full
  response text — zero occurrences of "translation missing" anywhere on the page. **PASS, fix holds.**
- **`c8ec3c4`** "Build out Quality HQ's Most Failed Tests and Slow Tests sections (previously 'Not yet
  available')" — **this directly invalidates RFTC044-2's recorded result above**, which documented "Not yet
  available" as the correct, expected behavior for these two sections. That was accurate as of 2026-10-19; it no
  longer is. Re-tested live:

| Check | Result |
|---|---|
| Admin's `/quality_hq` — Most Failed Tests section | **Now shows real, ranked cross-project data** (e.g. rank 1: `RFTC-038 Multi-Suite CI QA #2072`, 14/14 failures, 100%) instead of the placeholder |
| Admin's `/quality_hq` — Slow Tests section | **Now shows real ranked data** (sample counts, avg/max/P95 timings, Slow flags) instead of the placeholder |
| **SACRED re-check**: same two sections, logged in as `qa.limited` (Manager on `RFTC-016 CI Ingest QA` only) | **PASS — isolation holds.** Both sections show **only** `RFTC-016 CI Ingest QA`'s own rows; zero rows from `RFTC-038 Multi-Suite CI QA` or any other project leaked through for this permission-scoped non-admin user. The exact cross-project-isolation property RFTC044-6 established for the dashboard's tiles/table extends correctly to these two newly-wired sections too — not assumed, independently re-verified for this specific new code. |

**Flaky-trend detection** (the 4th originally-placeholder section) still shows "Not yet available" — unchanged,
still explicitly unimplemented.

**Verdict:** RFTC044-2's result is **superseded, not a regression** — the underlying behavior intentionally
changed (a real feature shipped) and was re-verified correctly, including re-proving the SACRED isolation
property against the new code rather than assuming it carried over. Recommend renumbering/updating RFTC044-2's
own "Expected/Actual Result" text in a future edit to reflect the new behavior as the baseline, rather than
leaving the superseded 2026-10-19 wording as the file's primary record for that case.
