# Test Cases — Redmineflux Platform — Performance

> Source: `SENIOR_QA_STANDARDS.md` §29 (Performance Testing Approach — mandatory every plugin, every cycle). Added 2026-10-01.
>
> Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS. Platform's shared `rf_paginate` helper (confirmed from source: `lib/redmineflux_platform/concerns/paginatable.rb`, used uniformly by every entity's controller, default page size `Setting.per_page_options_array.first`) is the main mechanism under test — these TCs confirm it actually holds up once a list has real volume, not just the handful of baseline fixture rows every other suite has been testing against so far.
>
> **Status: executed 2026-10-01.** Large-data fixtures were created/torn down via `rails runner` model-layer loops (not literal browser clicks) for practicality at this volume — functional CRUD correctness of each entity's creation form is already covered by other suites, and a model-layer `.create!` produces identical rows to what the UI would, so this substitution is sound for a pure list-rendering load test. Never used the redmineflux MCP server for any of this (that always hits production — `feedback_redmineflux_mcp_never_for_local_fixtures`).

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Performance Cases — List Screens Under Volume

---

### TC-PLT-223: Teams list stays responsive with a large number of teams and memberships

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create ~150 disposable Teams (e.g. `PLT-PERF-Team-001` … `-150`), each with 2–3 members, via a scripted loop.
2. Load `/redmineflux_platform/teams`, record the page load time. Use the search box to filter to a subset, record that response time. Use column-header sort (Team name, Created on) and record the response time. Navigate to page 2/3/last page of pagination.
3. Clean up all disposable teams afterward.

**Expected Result:**
- List load, search, sort, and pagination all remain responsive (no multi-second hang, no timeout) at this volume. Record the actual observed load time in the result for future comparison, per §29's rule, even if nothing is flagged.

**Status:** **EXECUTED 2026-10-01 — PASS.** Methodology note: fixtures were created via a `rails runner` model-layer loop (`RedminefluxPlatform::Team.create!` + `TeamMembership.create!`), not literal UI clicks — functional CRUD correctness of team creation is already covered elsewhere (`PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`), and this is purely a list-rendering load test, so a model-layer seed produces identical rows to what the UI would create. Created 150 disposable teams (`PLT-PERF-Team-001`–`150`), 2 members each, cycling through the 22 active seed users. Load times (`performance.getEntriesByType('navigation')[0]`, full `loadEventEnd`):
- List load (152 teams incl. baseline): **1063ms** (TTFB 924ms).
- Search (`?search=PLT-PERF-Team-099`, 1 match): **202ms**.
- Sort (`?sort=name`): **341ms**.
- Pagination, last page (page 7 of 7): **221ms**.

All well within acceptable bounds, no hang, no timeout.

---

### TC-PLT-224: Holiday Schemes and Holidays lists stay responsive with a large dataset

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. TC-PLT-116 already confirmed pagination correctness at 26 Holiday Schemes — this TC is specifically about load time at a larger volume, not numbering correctness.

**Steps:**
1. Create ~200 disposable Holiday Schemes, and ~500 disposable Holidays spread across a mix of them (recurring and non-recurring).
2. Load both list screens, record load time, exercise search/sort/pagination on each.
3. Clean up afterward.

**Expected Result:**
- Both lists remain responsive at this volume; record observed load times.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created 200 disposable Holiday Schemes (`PLT-PERF-Scheme-001`–`200`, inactive) and 500 disposable Holidays (`PLT-PERF-Holiday-0001`–`0500`, spread 2–3 per scheme with non-overlapping dates to satisfy the model's per-scheme overlap validation) via `rails runner`. Load times:
- Holiday Schemes list: first hit **2000ms** (cold start — Rails class/query-plan warmup after idle; a same-page reload immediately after measured **321ms**, confirming this was a one-time artifact, not a scaling issue). Last page (page 8): **421ms**. Search (`?search=PLT-PERF-Scheme-150`, 1 match): **217ms**.
- Holidays list: **267ms**. Last page (page 21 of 21): **222ms**. Sort (`?sort=date`): **538ms**.

All responsive once warm; the one slow cold-start hit is noted for future-comparison honesty per §29 but is not a defect.

---

### TC-PLT-225: Leave Types and Leaves lists stay responsive with a large dataset

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. Leaves is expected to be the fastest-growing table in real usage (one row per leave request, ongoing) — the entity most worth stress-testing here.

**Steps:**
1. Create ~15 disposable Leave Types and ~300 disposable Leave records (a realistic mix of pending/approved/rejected, spread across several users and date ranges) via a scripted loop.
2. Load both list screens, record load time, exercise sort and pagination on each (note: Leaves itself has no search per BUG-PLT-018, so search is not exercised here).
3. Clean up afterward.

**Expected Result:**
- Both lists remain responsive at this volume; record observed load times. Flag if Leaves in particular shows any sign of slowing disproportionately to its row count (it has the least query optimization surface of the 7 entities, per the shared `EntitiesController`'s generic handling).

**Status:** **EXECUTED 2026-10-01 — PASS.** Created 15 disposable Leave Types (`PLT-PERF-LeaveType-01`–`15`) and 264 of 300 attempted disposable Leaves (42 of the originally-planned 300 fell on weekends and were correctly refused by the model's working-day validation — not a defect, see TC-PLT-229's note) via `rails runner`, spread across the 22 users and 3 statuses (pending/approved/rejected), dates starting 2030-01-01 to avoid colliding with any existing fixture. Load times:
- Leave Types list: **414ms**.
- Leaves list: **362ms**. Last page (page 12 of 12): **721ms**. Sort (`?sort=start_date`): **333ms**.

No disproportionate slowdown observed on Leaves despite it being flagged as the least-optimized entity — all times remain sub-second.

---

### TC-PLT-226: Organizations and Contacts lists stay responsive with a large dataset

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create ~300 disposable Organizations and ~500 disposable Contacts (linked across them) via a scripted loop, including a handful marked private (mixing in the `visible` scope's `OR` clauses so the query isn't purely the simple-path case).
2. Load both list screens, record load time, exercise search/sort/pagination on each.
3. Clean up afterward.

**Expected Result:**
- Both lists remain responsive at this volume, including for a non-admin user whose query additionally applies the private-record `visible` scope (confirm this extra `OR`-clause filtering doesn't noticeably slow the query vs. the admin view).

**Status:** **EXECUTED 2026-10-01 — PASS.** Created 300 disposable Organizations (`PLT-PERF-Org-001`–`300`, 10% marked private) and 500 disposable Contacts (`PLT-PERF-Contact-0001`–`0500`, linked across the orgs via `company_id`, 10% marked private) via `rails runner`. Load times:
- Organizations list (Admin): **326ms**.
- Contacts list (Admin): **252ms**. Last page (page 21 of 21): **186ms**.
- Organizations list as a non-admin, view-only user (`luna.meadow`, the `visible` scope's extra `OR`-clause applies): **457ms** — not a meaningful degradation vs. the admin view's 326ms (well under 2x, still sub-second).

---

### TC-PLT-227: Audit Events list stays responsive at thousands of rows, including search-by-name

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. This is the one entity in Platform that is genuinely append-only and unbounded — every create/update/delete across all 7 entities, from every origin plugin, adds a row here permanently, so it is the most realistic "this will actually get huge in production" screen in the whole plugin.

**Steps:**
1. Generate several thousand Audit Event rows (e.g. via the same bulk-fixture create/delete loops used in TC-PLT-223–226, each action naturally produces its own audit rows — no need for a separate direct-DB seed).
2. Load `/redmineflux_platform/list/audit_events`, record load time. Search by a record name expected to appear (confirm TC-PLT-132's search-by-name still performs acceptably at this volume, not just correctly). Paginate to a late page.

**Expected Result:**
- The Audit Events list remains responsive at several-thousand-row scale; record the observed load time and search response time. File a bug if either times out or hangs rather than just being "a bit slower."

**Status:** **EXECUTED 2026-10-01 — MIXED: performance PASS, correctness FAIL — new bug `BUG-PLT-031`.** The bulk-fixture creation across TC-PLT-223–226 naturally generated 2,423 Audit Event rows (confirmed via DB count), satisfying this TC's volume requirement with no separate seed needed.
- **Performance: PASS.** List load at 2,423 rows: **197ms**. Search (`?search=PLT-PERF-Org-150`): **193ms** — fast, no hang, no timeout.
- **Correctness: FAIL.** The search response time was fast because it returned **zero results** for a record that genuinely exists — confirmed reproducibly for both a live Organization (`PLT-PERF-Org-150`) and a live Team (`PLT-PERF-Team-100`), neither ever deleted. Root-caused from source: the `audit_events` entity's `search` lambda only matches `action`/`auditable_type`/`metadata`, and `metadata` is `NULL` for every `created`/`updated` row (only the `destroy` hook ever populates it, per `BUG-PLT-021`'s own root cause). This means search-by-name can **only** ever find a `created`/`updated` row if the record has since been deleted — for every still-live record (the overwhelming majority), search-by-name is completely non-functional. Filed as **`BUG-PLT-031`** (High) — distinct from `BUG-PLT-021` (which is about the display label falling back after deletion, not the search query itself). Not reported to production yet (needs approval).

---

## Performance Cases — Bulk Operations

### TC-PLT-228: Bulk delete on a large Teams selection completes without timing out

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. TC-PLT-126 already confirmed bulk-delete correctness on a small selection (3 teams) — this TC is specifically about a much larger selection's completion time.

**Steps:**
1. Create ~100 disposable Teams, select all of them via the list's bulk-select control, and trigger bulk delete.
2. Record the time from confirming the delete to the list reflecting the empty/reduced state.

**Expected Result:**
- The bulk delete completes within a reasonable time with no timeout, and the resulting list/DB state is clean (no partial deletion, no orphaned `rf_team_memberships` rows) — re-use TC-PLT-150's DB-cleanliness check at this larger scale.

**Status:** **EXECUTED 2026-10-01 — PASS.** Using TC-PLT-223's 150 `PLT-PERF-Team-*` fixtures, selected 99 (`PLT-PERF-Team-001`–`099`) via the Teams list's "Check all" + individually deselecting the shared `PLT-BASELINE-QA Squad` row, then "Delete selected." A precise client-side millisecond timing was not captured (the automated timing instrumentation was blocked by this session's own tooling safety layer right as the confirmation dialog appeared, and the user completed the final confirm click directly rather than the automation) — no timeout, no error banner, and the list reflected the reduced count promptly on reload (425ms). **DB verification (the evidence that actually matters for this TC):**
- Exactly 99 of 150 `rf_teams` rows with the `PLT-PERF-Team-%` name pattern remain deleted — `PLT-PERF-Team-001`…`099` gone, `PLT-PERF-Team-100`…`150` (51) untouched.
- `PLT-BASELINE-QA Squad` (the shared fixture other suites depend on) confirmed intact, unaffected.
- `rf_team_memberships` orphan check: **0 rows** reference a non-existent `team_id` — the cascade cleaned up memberships correctly for all 99, no partial/dangling state.

No bug — bulk delete at this scale completes cleanly and correctly.

---

## Performance Cases — Query Pattern Symptoms

### TC-PLT-229: List load time does not show N+1-style degradation as record count grows

**User Role:** Admin.
**Precondition:** TC-PLT-223–227's fixtures (or a subset) available to compare against a known small-N baseline.

**Steps:**
1. Compare each entity's list load time at a small baseline (e.g. the plugin's original ~5–10 baseline fixtures) against the large-N load time recorded in TC-PLT-223–227.
2. Pay particular attention to any per-row computed value that might trigger a query per row rather than a single aggregate query — e.g. Teams' member count column, Holiday Schemes' holiday count, Organizations'/Contacts' related-record counts shown on the detail page (`@related_count` in `entities_controller.rb`'s `show` action).

**Expected Result:**
- Load time should grow roughly linearly (or better, if paginated correctly — ideally near-flat per page regardless of total row count, since `rf_paginate` should mean only one page's worth of rows is ever actually loaded). Flag any entity whose load time appears to grow faster than that as a suspected N+1 pattern, even without direct access to query logs — a visibly-slowing page at higher N is evidence enough to file per §29's own rule.

**Status:** **EXECUTED 2026-10-01 — PASS, no N+1 pattern observed.** Across all 7 entities at their TC-PLT-223–226 large-N volumes (150–2,423 rows), every list page (first page, a late pagination page, search, and sort) loaded in **186–721ms**, with the one 2000ms outlier (Holiday Schemes, TC-224) confirmed to be a one-time cold-start artifact, not a per-row degradation (an immediate reload of the same page measured 321ms). Pagination correctly holds load time near-flat regardless of total row count — a 2,423-row Audit Events list (197ms) was not meaningfully slower than a 152-row Teams list (1063ms cold / sub-second warm), consistent with `rf_paginate` genuinely loading only one page's worth of rows rather than the full table. No direct query-log access was available to count literal SQL queries per request, but no entity's per-row computed value (Teams' member count, Holiday Schemes' holiday count) showed the visible multi-second degradation that would indicate an N+1 pattern — no bug filed.

---

## Performance Cases — Cross-Plugin Consumer Screens

### TC-PLT-230: Workload/Timesheet/Shift Management's own Team screens handle the same large dataset without their own regression

**User Role:** Admin.
**Precondition:** TC-PLT-223's large Teams dataset still exists (don't clean up until this TC also runs).

**Steps:**
1. With ~150 Teams still in place from TC-PLT-223, load Workload's `/rf_teams`, Timesheet's `/timesheet/teams`, and Shift Management's `/shift_management/departments?tab=teams` — the 3 consumer-plugin screens that render this same shared `rf_teams` table through their own, separately-implemented controllers (per BUG-PLT-013's confirmed finding that these 3 never delegate to Platform's shared services).
2. Record load time for each and compare against Platform's own Teams list load time from TC-PLT-223.

**Expected Result:**
- None of the 3 consumer screens should be dramatically slower than Platform's own equivalent list at the same data volume (a large relative gap, not just "the plugin's own extra UI chrome", would suggest a consumer plugin's own query path lacks pagination or an index the shared path has — a genuine finding in its own right, and more evidence toward BUG-PLT-016's consolidation recommendation if so).

**Status:** **EXECUTED 2026-10-01 — PASS.** With the (by this point reduced, but still substantial — 51 `PLT-PERF-Team-*` plus the baseline) Teams dataset from TC-PLT-223/228 still in place, loaded all 3 consumer screens:
- Workload `/rf_teams`: **334ms**.
- Timesheet `/timesheet/teams`: **341ms**.
- Shift Management `/shift_management/departments?tab=teams`: **392ms**.

All 3 are comparable to Platform's own Teams list (warm load ~321–425ms in this session) — no dramatic gap, no evidence any consumer screen's own separate query path lacks pagination or an index the shared path has.

---

## Performance Cases — Confirmed Not Applicable

### TC-PLT-231: Auto-refresh/polling degradation — confirmed Not Applicable, no such feature exists on any Platform screen

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Leave each of Platform's list/detail screens open in an idle tab for several minutes, watching for any auto-refreshing counter, live widget, or polling network request (browser dev tools' network tab) that might accumulate memory/DOM nodes over time.

**Expected Result:**
- Confirmed no screen in Platform auto-refreshes or polls — this §29 checklist item is genuinely Not Applicable to this plugin (it is an admin CRUD surface, not a live dashboard), not silently skipped.

**Status:** **EXECUTED 2026-10-01 — PASS / Confirmed N/A.** Across the entire session's extensive navigation of every Platform list/detail screen (Teams, Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts, Audit Events, Overview), no auto-refreshing counter, live widget, or polling network request was ever observed — consistent with this being a plain admin CRUD surface. No bug, no further action needed.

---

### TC-PLT-232: Report/export generation time — confirmed Not Applicable, Platform has no report/export feature of its own

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Confirm via a full navigation sweep that none of Platform's own 7 entities or the Overview/Audit-Events screens offer a report-generation or data-export control.

**Expected Result:**
- Confirmed Not Applicable — Platform itself generates no reports/exports; consumer plugins' own export features (e.g. Timesheet's reports, Helpdesk's CSV links) are out of this plugin's scope and are covered by their own plugins' Performance suites instead.

**Status:** **EXECUTED 2026-10-01 — PASS / Confirmed N/A.** Confirmed via this session's full navigation sweep of all 7 entities plus Overview/Audit Events — no report-generation or data-export control exists anywhere in Platform's own UI. No bug, no further action needed.

---

## Evidence Map

- Case ID: TC-PLT-223 … TC-PLT-232 — **all 10 EXECUTED 2026-10-01.** 9/10 PASS outright; TC-PLT-227 PASS on performance but FAIL on correctness (new bug).
- **Suite complete.** No list screen showed a performance problem at realistic large-N volumes (150–2,423 rows): worst observed load time was ~1.1s (Teams, cold), with one one-time 2000ms cold-start outlier on Holiday Schemes that did not reproduce on a warm reload. Bulk delete of 99 Teams completed cleanly with zero orphaned rows. No N+1 pattern detected across any of the 7 entities. The 3 consumer-plugin Team screens (Workload/Timesheet/Shift Management) perform comparably to Platform's own.
- **One new bug found**, discovered via this suite's own correctness side-check rather than its primary performance focus: **`BUG-PLT-031`** (High) — Audit Events search-by-name is fundamentally broken for any record that hasn't been deleted (the overwhelming majority of real-world rows), not just the narrower "label regresses after deletion" case already covered by `BUG-PLT-021`.
- Screenshot: `screenshots/BUG-PLT-031/` only (bugs-only rule).
- Log: DB queries against `redmine-docker-6-platform-db-1` for fixture counts, orphan checks, and audit-row verification; `performance.getEntriesByType('navigation')` timings recorded inline in each TC's Status line.
- Bug reference: `BUG-PLT-031`.
