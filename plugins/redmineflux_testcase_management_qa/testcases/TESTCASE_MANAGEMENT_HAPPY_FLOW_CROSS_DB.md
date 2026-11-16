# Happy-Flow Cross-Database Regression Suite — Testcase Management Plugin

> **Purpose:** A curated master list of existing test case IDs that together exercise **every distinct
> feature/capability** of this plugin via its normal, successful, positive-path usage — no edge cases, no
> negative/security/permission-denial tests, no performance/boundary tests. This list is meant to be executed
> as one pass against **SQLite, PostgreSQL, and MySQL** each, to confirm the plugin behaves identically across
> all three supported database engines.
>
> Built 2026-11-16 by reading all 32 local TCM suite files in full (via 5 parallel review passes) and pulling
> the single (or minimal set of) test case(s) per distinct feature whose own Steps/Expected Result most
> directly represents that feature's straightforward successful path. Source suite files are named per group
> below — read the cited TC there for full steps/expected result before executing.
>
> **Do not add edge/negative/security/performance cases to this list** — those stay in their own suites and
> are out of scope for this specific cross-DB happy-flow pass (a separate security/performance regression tier
> already exists and is unaffected by DB engine choice).

---

## 1. Core CRUD — Test Cases, Suites, Runs, Environments, Overview, To-Do, Configuration, Permissions

Source: `TESTCASE_MANAGEMENT_TEST_CASES.md`, `TESTCASE_MANAGEMENT_TEST_SUITES.md`,
`TESTCASE_MANAGEMENT_TEST_RUNS.md`, `TESTCASE_MANAGEMENT_ENVIRONMENTS.md`, `TESTCASE_MANAGEMENT_OVERVIEW.md`,
`TESTCASE_MANAGEMENT_TODO.md`, `TESTCASE_MANAGEMENT_CONFIGURATION.md`, `TESTCASE_MANAGEMENT_PERMISSIONS.md`

**Test Cases:** TC-TCM-128, 129, 131, 132, 133, 136, 137, 142, 143, 144, 146, 148, 149, 150, 297, 298, 299

**Test Suites:** TC-TCM-192, 193, 194, 197, 198, 199, 200, 201, 202

**Test Runs & Execution:** TC-TCM-152, 153, 154, 157, 158, 160, 162, 165, 166, 170, 171, 173, 174, 176, 177,
178, 179, 183, 185, 188, 189

**Environments:** TC-TCM-038, 039, 042, 043

**Overview page:** TC-TCM-321, 322, 323, 326, 327

**To-Do / Activity:** TC-TCM-205, 206, 207, 208, 211, 212

**Configuration:** TC-TCM-001, 002, 003, 004, 006, 008, 009, 011, 012, 013, 015

**Permissions (granted-role / positive half only):** TC-TCM-046, 052, 055, 059, 062

---

## 2. Reports, CSV Import, Requirements/RTM

Source: `TESTCASE_MANAGEMENT_REPORTS.md`, `TESTCASE_MANAGEMENT_CSV_IMPORT.md`,
`TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md`, `TESTCASE_MANAGEMENT_SECURITY.md`,
`TESTCASE_MANAGEMENT_SECURITY_REVIEW_121640.md`

**Reports (every type/format/CRUD/schedule-interval):** TC-TCM-078, 079, 080, 082, 083, 085, 087, 088, 089,
091, 092, 093, 094, 096, 098, 100, 103, 107, 108, 109, 110, 316, 317

**CSV Import:** TC-TCM-021, 024, 034, 333, 336

**Requirements / RTM / Content editor / Templates:** TC-TCM-112, 115, 116, 118, 119, 122, 124, 269, 271, 272,
305, 306, 307, 308, 310, 329, 330, 331, 332

**One positive-path pulled from otherwise-security-only files:**
- TC-TCM-278 (legitimate API-key REST client not CSRF-rejected — confirms real programmatic creation works)
- TC-TCM-366 (explicit end-to-end "normal workflows unaffected" meta regression guard — anchor case)

**`TESTCASE_MANAGEMENT_PERFORMANCE.md`**: intentionally **zero** cases pulled — every TC there is a volume/
scale/timing check of a feature already covered above at normal scale, not a distinct happy path.

---

## 3. Automation / CI ingest / Reporting features (RFTC-008, 009, 016–022)

- **RFTC-008 (Defect↔Execution linking):** RFTC008-F1, F2/U3, F7/U8/U9/U10, F10, F11/U6, UI2/UI3
- **RFTC-009 (CI Bootstrap Run):** RFTC009-U1/U3/U9, U5/U6/U7, Struct1, Struct2, E1
- **RFTC-011 (UI Modernization Wave 0):** out of scope — CSS/accessibility/security-holdout only, no functional
  happy path to add
- **RFTC-016 (CI Results Ingest):** RFTC016-1, 2, 12, 13, 14, 19, 22, 24, 27, 28(a), 29, 30, 31(part 2), 41, 42
- **RFTC-017 (CI Results CLI):** RFTC017-1, 2, 3 (the 3 subcommands' real-server happy paths only — the rest
  of this file tests a separate companion repo's CLI-internal logic, not plugin/DB behavior)
- **RFTC-018 (Automation Sources):** RFTC018-1, 3, 9
- **RFTC-019 (Flaky Test Detection):** RFTC019-1
- **RFTC-020 (Slow Tests Report):** RFTC020-1, 2
- **RFTC-021 (Most Failed Tests Report):** RFTC021-1
- **RFTC-022 (Run Comparisons):** RFTC022-2, 3, 4, 5, 6, 7 — **all six**, since they are the six core output
  categories the feature exists to produce (New Failure / Newly Fixed / Still Failing / Still Passing / New
  Tests / No Longer Run), not interchangeable edge cases

---

## 4. Milestones, Exploratory Sessions, Dashboards, Quality HQ, Assignee (RFTC-026–045)

- **RFTC-026 (Testcase Milestones):** RFTC026-1, 10, 12, 14, 19, 22, 25, 28, 29, 30, 32, 33, 34, 35
  — **Gap:** RFTC026-31 (Reports milestone filter) has no positive-path TC — feature not yet built (Phase 2
    per the spec's own table), not a missing-coverage defect. Add once it ships.
- **RFTC-029 (Exploratory Sessions):** RFTC029-1, 2, 6, 8, 15, 23, 24, 25
- **RFTC-033 (Milestone Summary Report):** RFTC033-1, 11, 12, 13
- **RFTC-034 (Milestone Burndown):** RFTC034-1, 9, 12
- **RFTC-035 (Automation Dashboard):** RFTC035-1, 2, 3, 4, 11, 13, 15
- **RFTC-038 (CI Platform Recipes):** out of scope — tests a separate companion repo (CI pipeline recipes),
  not the plugin/DB itself
- **RFTC-042 (TCM Testing Harness):** out of scope — dev tooling, not plugin runtime behavior
- **RFTC-043 (Security Discovery Testing):** out of scope — SAST/DAST/secret-scan tooling by nature
- **RFTC-044 (Quality HQ):** RFTC044-1, 5, 9, 10, 11 — **Gap:** flaky-trend detection section is still a
  documented "Not yet available" placeholder, no real feature to test yet
- **RFTC-045 (Per-Run/Per-TC/Per-Environment Assignee + Edit Run enhancement):** RFTC045-1, 2, 8, 9, 13, 14,
  15, 16, 35, 39, 53, 54, 56, 58, 63, 64 (67/67 cases in this suite already have a verdict — fully executed)

---

## 5. Core V1 plugin feature set — `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`

This is the single most important group for the new cross-DB directive — it's the baseline SUITE/CASE/RUN/
EXEC/DEFECT/REPORT/API feature set, and it already contains a dedicated **COMPAT** area built for exactly this
kind of matrix testing (see §6 below).

- **SUITE:** TC-SUITE-01-01, 02-01, 02-02, 03-01, 04-01, 05-01, 06-01
- **CASE:** TC-CASE-01-01, 02-01, 03-01, 04-01, 05-01, 06-01, 07-01
- **RUN:** TC-RUN-01-01, 01-02, 01-09, 02-01, 03-01, 03-05, 04-01, 04-02, 04-06, 05-01, 05-02, 06-01, 06-02
- **EXEC:** TC-EXEC-01-01, 01-02, 01-03, 01-08, 02-01, 03-01, 03-02, 05-01, 05-02, 06-01
- **DEFECT:** TC-DEFECT-01-01, 02-01, 03-01, 04-01, 05-01, 05-02
- **REPORT:** TC-REPORT-01-01, 02-01, 03-01, 04-01, 05-01, 06-01, 07-01
- **PERM (positive side only):** TC-PERM-02-1
- **API:** TC-API-01-01, 01-02, 02-01, 02-02, 02-04, 03-01, 04-01, 04-04, 05-01, 05-03, 05-04, 06-01, 06-02,
  07-01, 07-02, 07-03, 07-05, 08-01

**Explicitly out of scope from this file for happy-flow:** everything under **PERM** beyond TC-PERM-02-1
(cross-project IDOR/security-denial testing) and the entire **SAFE** area (XSS/SSRF/CSRF/open-redirect/CORS)
— both belong to the separate security regression tier, not this one.

---

## 6. COMPAT area — the natural slot for the SQLite / PostgreSQL / MySQL directive

`V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md` already has a **COMPAT** group built for exactly this kind of
install/boot/render matrix, currently scoped by **Redmine major version** (6.x / 5.x / 7.x) rather than DB
engine:

- **TC-COMPAT-01-01/02/03** — install + migrate cleanly (01 executed on 6.x/local; 02/03 currently blocked
  "needs a separate instance" for 5.x/7.x)
- **TC-COMPAT-02-01/02** — icon rendering
- **TC-COMPAT-03-01/02** — module registration / menu
- **TC-COMPAT-04-01/02/03** — boots with no exception from version-branched wiring
- **TC-COMPAT-05-01/02** — layout rendering, no overflow

**Recommendation:** re-run the full happy-flow list in §1–§5 above once per database engine (SQLite,
PostgreSQL, MySQL), using the COMPAT TCs themselves as the install/migrate/boot/render gate for each engine
before running the rest of the suite against it — i.e. COMPAT confirms the plugin boots cleanly on that DB,
then §1–§5 confirm every feature still behaves identically on it. This reuses the existing COMPAT test design
rather than inventing a parallel one, just widening its axis from "Redmine major version" to "Redmine major
version × DB engine."

---

## Summary counts

| Group | Suites covered | Happy-flow TCs pulled |
|---|---|---|
| 1. Core CRUD | 8 files | ~75 |
| 2. Reports/CSV/RTM | 5 files | ~55 |
| 3. Automation/CI (008,009,016–022) | 9 files | ~45 |
| 4. Milestones/Sessions/Dashboards/QHQ/Assignee (026–045) | 10 files | ~45 |
| 5. Core V1 release cycle | 1 file (192 cases total) | ~55 |
| 6. COMPAT (DB/version matrix) | (subset of #5) | 10 |
| **Total distinct happy-flow TCs** | **32 files read** | **~270** |

Two documented gaps (not defects — features not yet built): RFTC026-31 (Reports milestone filter, Phase 2),
and RFTC-044's flaky-trend section. Every other distinct capability across all 32 suite files has at least one
confirmed positive-path test case anchoring it in this list.
