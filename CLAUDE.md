# CLAUDE.md — Redmine QA Automation

This file defines how Claude must work in this repository. Read this before every session.

---

## 1. What This Repository Is

AI-driven, **automation-first** QA framework for Redmine plugins. Approved test cases and requirements are
turned directly into Playwright + TypeScript specs, run natively via `npx playwright test` — this is the sole
source of test execution and of every PASS/FAIL/blocked result that reaches a report (§7) — with an automated
fix-loop that triages every failure as a test bug or an application bug (see §13). Claude + Playwright MCP is
**not used for routine test execution**; it is reserved for special cases only — reproducing a reported bug or
debugging a failure the fix-loop couldn't resolve — never as a substitute for running the spec suite.
Each plugin gets its own isolated folder under `plugins/`. Global rules live at root level.

---

## 2. Folder Structure

```
redmine-qa-automation/
├── CLAUDE.md                        ← this file — read first, every session
├── MEMORY.md                        ← global rules that apply to ALL plugins
├── STATUS.md                        ← cross-plugin test status dashboard
├── README.md
├── SENIOR_QA_STANDARDS.md           ← testing methodology and bug standards
├── REDMINEFLUX-MCP-SETUP.md         ← production redmineflux MCP server setup + write-approval policy
├── QA_CREDENTIALS.md                ← common QA credentials (all environments/roles)
├── TIME_LOG.md                      ← global time log — every testing/retest/bug-report activity, per testcase (§14)
│
├── scripts/                         ← utility/seed scripts
├── templates/
│   ├── bug-template.md              ← standard bug report format
│   └── testcase-template.md         ← test case file format
│
├── prompts/
│   └── claude/
│       └── PLUGIN_TEST_PROMPT_TEMPLATE.md
│
└── plugins/
    └── <plugin-name>_qa/               ← one folder per plugin (kebab-case)
        ├── docs/                    ← filenames are UPPER_SNAKE_CASE, prefixed with the doc-prefix (see §2b)
        │   ├── <PREFIX>_REQUIREMENTS.md    ← what the plugin does (READ BEFORE TESTING)
        │   ├── <PREFIX>_FEATURES_LIST.md   ← full feature list for test coverage (READ BEFORE WRITING TEST CASES)
        │   ├── <PREFIX>_USER_GUIDE.md      ← end-user guide — real UI flows and behavior (READ BEFORE WRITING TEST CASES)
        │   ├── <PREFIX>_SCOPE.md           ← what is and is not being tested this cycle
        │   ├── <PREFIX>_TEST_PLAN.md       ← objective, approach, entry/exit criteria, deliverables (see §2c)
        │   ├── <PREFIX>_TRACEABILITY_MATRIX.md ← requirement/feature → TC coverage map, kept current (see §2c)
        │   ├── <PREFIX>_FLOW.md            ← key user flows for test design
        │   ├── <PREFIX>_HANDOFF.md         ← session handoff notes + Run History (test run/regression log, replaces changelog.md)
        │   └── <PREFIX>_MEMORY.md          ← plugin-specific observations (persist across sessions)
        ├── testcases/
        │   └── <PREFIX>_<SUITE-NAME>.md    ← one file per test suite (e.g. HELPDESK_SLA_WORKFLOW.md)
        ├── automation/               ← Playwright + TypeScript suite for THIS plugin — PRIMARY test execution (§13)
        │   ├── playwright.config.ts
        │   ├── package.json
        │   ├── tsconfig.json
        │   ├── tests/                 ← specs + setup files, self-contained to this plugin
        │   │   ├── <PREFIX>_<suite-name>.spec.ts  ← mirrors testcases/<PREFIX>_<suite-name>.md, one spec per suite
        │   │   ├── auth.setup.ts          ← logs in per role, saves session to .auth/<role>.json
        │   │   ├── provision.setup.ts     ← idempotently creates the roles/projects/users/customers automation depends on
        │   │   └── pages/                 ← page objects (POM), separate from specs
        │   │       └── <PluginName>Page.ts    ← page object — no .spec.ts suffix, not run as a test
        │   ├── utilities/             ← env/credentials loader, custom fixtures, shared helpers
        │   │   └── env.ts             ← reads QA_CREDENTIALS.md
        │   ├── testdata/              ← checked-in test data fixtures (JSON/CSV/etc.) AND the
        │   │   └── <PREFIX>_TESTDATA_<ENV>.xlsx  ← per-environment test data registry, see §13a
        │   ├── uploads/               ← checked-in sample files used by upload test cases
        │   ├── downloads/             ← files captured during a run (gitignored)
        │   └── screenshots/           ← automation-run screenshots (gitignored — separate from the
        │                                 plugin's own screenshots/<TC-ID>/ bug-evidence folder)
        ├── bugs/
        │   ├── _index.md            ← master bug tracker for this plugin
        │   ├── _duplicates.md       ← duplicate prevention register
        │   ├── open/                ← one .md file per open bug
        │   └── closed/              ← one .md file per closed bug
        ├── screenshots/
        │   ├── <TC-ID>/             ← one subfolder per TC (e.g. TC-RAF-001/) — PASS/FAIL evidence
        │   └── <BUG-ID>/            ← one subfolder per bug (e.g. BUG-RAF-001/) — failure + retest evidence
        ├── reports/
        │   ├── <PREFIX>-<TestingType>-<date>.md  ← one report per testing type per day tested (see §7) —
        │   │                                        e.g. HLP-Functional-2026-09-30.md, HLP-Security-2026-10-01.md
        │   └── <PREFIX>-<TestingType>-<date>.pdf ← ONLY generated on explicit user request
        └── logs/                    ← test execution logs
```

---

## 2b. Doc Filename Prefix

Every file in `docs/` and `testcases/` is named `<PREFIX>_<NAME>.md` — UPPER_SNAKE_CASE, prefixed with a short plugin identifier. This is separate from the Bug ID Code (Section 4), which stays a 3-letter code for `BUG-<CODE>-NNN`.

**Derivation:** take the plugin's descriptive name, drop a leading `redmineflux_`/`redmine_` and a trailing `_qa`/`_plugin`, uppercase the rest, hyphens become underscores.

| Plugin folder | Doc prefix | Example file |
|---|---|---|
| `redmineflux_helpdesk_qa` | `HELPDESK` | `HELPDESK_USER_GUIDE.md` |
| `redmineflux_advanced_field_qa` | `ADVANCED_FIELD` | `ADVANCED_FIELD_REQUIREMENTS.md` |
| `testcase-management-plugin` | `TESTCASE_MANAGEMENT` | `TESTCASE_MANAGEMENT_SCOPE.md` |

Testcase suite files follow the same rule: `testcases/<PREFIX>_<SUITE-NAME>.md`, e.g. `testcases/HELPDESK_SLA_WORKFLOW.md`.

This is the standard for every plugin scaffolded **from now on**. Existing plugins created before this rule keep their current lowercase filenames (`requirements.md`, `user-guide.md`, etc.) unless someone explicitly asks to rename them too.

**No standalone changelog file.** Test run history and regression-run rows go in a `## Run History` table at the bottom of `<PREFIX>_HANDOFF.md` instead of a separate `<PREFIX>_CHANGELOG.md`. Existing plugins that still have `docs/changelog.md` keep it as-is.

---

## 2c. Test Plan and Traceability Matrix

Every plugin gets two more docs, written **after** `<PREFIX>_REQUIREMENTS.md`, `<PREFIX>_FEATURES_LIST.md` and
`<PREFIX>_USER_GUIDE.md` have actually been read — not guessed from the plugin name or skipped.

| File | When written | What it's for |
|---|---|---|
| `<PREFIX>_TEST_PLAN.md` | Once, right after scoping (`<PREFIX>_SCOPE.md`), before any test case is written | The fuller approach document — objective, test types, entry/exit criteria, deliverables, roles, risks. `SCOPE.md` stays the quick in/out-of-scope checklist; this is the narrative plan built from it. |
| `<PREFIX>_TRACEABILITY_MATRIX.md` | Started once the first test suite exists; **kept current** as test cases are added or `FEATURES_LIST.md` grows | Maps every requirement/feature to the TC ID(s) that cover it, with each TC's current result. This is the one place to check "is anything still uncovered" — `FEATURES_LIST.md`'s own "Covered by TC" column is a quick pointer, not a substitute; it has drifted stale on more than one plugin already. |

**Rule:** a plugin cannot be marked `Complete` in `STATUS.md` (§10) while its Traceability Matrix shows any
requirement/feature with zero TC coverage, unless that gap is explicitly recorded in `<PREFIX>_SCOPE.md`'s Out of
Scope section.

### <PREFIX>_TEST_PLAN.md template

```markdown
# Test Plan — [Plugin Name]

> Written after REQUIREMENTS.md, FEATURES_LIST.md and USER_GUIDE.md have been read, and after SCOPE.md is filled in.

## Objective

## Test Approach

- Testing types to be performed this cycle (mirror `<PREFIX>_SCOPE.md`'s checklist — Functional, Permission,
  Workflow, Negative, UI, Multi-Language, Security, Performance, Code Quality, Regression)
- Environments to be used (see `QA_CREDENTIALS.md`)

## Entry Criteria

## Exit Criteria

## Test Deliverables

- Test cases — `testcases/<PREFIX>_<SUITE-NAME>.md`
- Bug reports — `bugs/open/`, `bugs/closed/`
- Reports — `reports/<PREFIX>-<TestingType>-<date>.md` (see §7)
- Traceability Matrix — `<PREFIX>_TRACEABILITY_MATRIX.md`

## Roles & Responsibilities

## Risks & Assumptions

## Test Cycle / Schedule
```

### <PREFIX>_TRACEABILITY_MATRIX.md template

```markdown
# Traceability Matrix — [Plugin Name]

> Maps every requirement/feature to the TC(s) covering it. Update whenever `FEATURES_LIST.md` gains a row or a new
> TC is written — this file, not `FEATURES_LIST.md`'s own "Covered by TC" column, is the source of truth for
> coverage gaps.

| # | Requirement / Feature | Source | Covered by TC(s) | Latest Result | Coverage Status |
|---|------------------------|--------|-------------------|----------------|------------------|

> Coverage Status: `Covered` / `Partial` / `Not Covered`. Anything `Not Covered` must either get a TC or be moved
> to `<PREFIX>_SCOPE.md`'s Out of Scope section — it cannot just sit here unaddressed.
```

---

## 3. Adding a New Plugin

When the user asks to add or test a new plugin, create this structure:

```
plugins/<plugin-name>/                  (<PREFIX> = doc prefix per §2b, e.g. HELPDESK)
  docs/<PREFIX>_REQUIREMENTS.md
  docs/<PREFIX>_FEATURES_LIST.md
  docs/<PREFIX>_USER_GUIDE.md
  docs/<PREFIX>_SCOPE.md
  docs/<PREFIX>_TEST_PLAN.md        ← written after Requirements/Features/User Guide are read, see §2c
  docs/<PREFIX>_TRACEABILITY_MATRIX.md ← started once the first suite exists, kept current, see §2c
  docs/<PREFIX>_FLOW.md
  docs/<PREFIX>_HANDOFF.md          ← includes a Run History table (replaces changelog.md)
  docs/<PREFIX>_MEMORY.md
  testcases/
  automation/
    playwright.config.ts
    package.json
    tsconfig.json
    tests/               ← specs + setup files; tests/auth.setup.ts for login, tests/pages/ for page objects
    utilities/env.ts
    testdata/
    uploads/
    downloads/
    screenshots/
  bugs/_index.md
  bugs/_duplicates.md
  bugs/open/
  bugs/closed/
  screenshots/          ← subfolders created per TC-ID and BUG-ID as testing progresses
  reports/              ← <PREFIX>-<TestingType>-<date>.md, one per testing type per day, see §7
  logs/
```

`automation/` is created empty at plugin setup. Specs are scaffolded as soon as a test suite's test cases exist
and are approved — there is no manual-pass gate before automating (see Section 13).

Then add a row to `STATUS.md`.

Use this content for each new file (replace `<PREFIX>_` in the actual filename with the plugin's doc prefix from §2b):

### docs/<PREFIX>_REQUIREMENTS.md
```markdown
# Plugin Requirements — [Plugin Name]

## Overview

## Key Features

## Business Workflows

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|

## Known Constraints
```

### docs/<PREFIX>_FEATURES_LIST.md
```markdown
# Features List — [Plugin Name]

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|

## Notes
```

### docs/<PREFIX>_USER_GUIDE.md
```markdown
# User Guide — [Plugin Name]

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.

## Getting Started

## Key Screens

## Step-by-Step Workflows

### Workflow 1: [Name]

1.
2.
3.

## UI Elements Reference

## Notes & Known Behavior
```

### docs/<PREFIX>_SCOPE.md
```markdown
# Test Scope — [Plugin Name]

## In Scope

- [ ] Functional testing
- [ ] Permission testing
- [ ] Workflow testing
- [ ] Negative testing
- [ ] UI validation
- [ ] Multi-language testing
- [ ] Security testing (mandatory — see `SENIOR_QA_STANDARDS.md` §28)
- [ ] Performance testing (mandatory — see `SENIOR_QA_STANDARDS.md` §29)
- [ ] Code quality review (mandatory — see `SENIOR_QA_STANDARDS.md` §30)

## Out of Scope

## Redmine Version

## Environment

## Test Cycle
```

### docs/<PREFIX>_TEST_PLAN.md and docs/<PREFIX>_TRACEABILITY_MATRIX.md

Templates and rules for both are in §2c — use those verbatim. Fill in `<PREFIX>_TEST_PLAN.md` right after this
`SCOPE.md`; start `<PREFIX>_TRACEABILITY_MATRIX.md` once the first testcase suite file exists.

### docs/<PREFIX>_FLOW.md
```markdown
# Plugin Flow — [Plugin Name]

## Flow 1: [Flow Name]

1.
2.
3.
```

### docs/<PREFIX>_HANDOFF.md
```markdown
# Handoff — [Plugin Name]

## Last Session

- Date:
- Redmine Version:
- Environment:

## Completed This Session

## In Progress

## Blockers

## Next Session Start Point

## Open Bugs Found

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
```

### docs/<PREFIX>_MEMORY.md
```markdown
# Plugin Memory — [Plugin Name]

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

## Confirmed Working

## Recurring Issues

## Environment Notes
```

### bugs/_index.md
```markdown
# Bug Index — [Plugin Name]

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
```

### bugs/_duplicates.md
```markdown
# Duplicate Bug Register — [Plugin Name]

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
```

### reports/<PREFIX>-<TestingType>-<date>.md
```markdown
# [Plugin Name] — [Testing Type] Testing Report — [Date]

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.
> If [Testing Type] is Retest or Regression, use the Fix Verification / Regression sections below;
> otherwise leave them out.

## Test Case Execution

| TC ID | Result |
|-------|--------|

**Summary:** Total executed — Pass / Fail / Blocked / Skipped

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|

## Fix Verification / Retesting

> Only for a Retest-type report.

## Regression Results

> Only for a Regression-type report.

## Notes / Findings

- Redmine Version:
- Environment:
- Test Date:
```

---

## 4. Bug ID Convention

Format: `BUG-<PLUGIN-CODE>-<NUMBER>`

| Plugin | Code |
|--------|------|
| testcase-management-plugin | TCM |
| redmineflux_advanced_field | RAF |
| redmineflux_devops | RDV |
| redmineflux_scarlet | RSC |
| redmineflux_mcp | RFM |
| redmineflux_mcp_issuetemplate | RIT |
| redmineflux_mcp_checklist | RCL |
| redmineflux_mcp_knowledgebase | RKB |
| redmineflux_helpdesk | HLP |
| redmineflux_gantt | GNT |
| redmineflux_dashboards | DSH |
| redmineflux_checklist | CHK |
| redmineflux_agile | AGB |
| redmineflux_tags | TAG |
| redmineflux_inline_editor | INE |
| redmineflux_lotus | LTS |
| redmineflux_crux | CRX |
| redmineflux_timesheet | TMS |
| redmineflux_workload | WKL |
| redmineflux_notification | NTF |
| redmineflux_time_tracker | TMT |
| redmineflux_invoice | INV |
| redmineflux_crm | CRM |
| redmineflux_mentions | MEN |
| redmineflux_fluxshot | FSX |
| redmineflux_shift_management | SFM |
| redmineflux_platform | PLT |

Examples: `BUG-TCM-001`, `BUG-GNT-001`

Add a new code row when a new plugin is added.

**Note on the four `mcp_*` rows.** `RFM`, `RIT`, `RKB` and `RCL` were originally registered for MCP-related
work. They are now the codes for the standalone plugins of the same name, which is where their QA folders live:

| Code | QA folder |
|------|-----------|
| RFM | `plugins/redmineflux_mcp_qa` (Redmineflux MCP Server) |
| RIT | `plugins/redmineflux_issue_template_qa` |
| RKB | `plugins/redmineflux_knowledge_base_qa` |
| RCL | reserved — checklist bugs use `CHK` (`plugins/redmineflux_checklist_qa`) |

---

## 4a. Test Case ID Convention

Format: `TC-<PLUGIN-CODE>-<NNN>` — e.g. `TC-CHK-001`, `TC-HLP-284`, `TC-AGB-155`.

- **`<PLUGIN-CODE>`** — the same 3-letter code as Section 4 (`HLP`, `CHK`, `CRX`, …).
- **`<NNN>`** — zero-padded, **one continuous sequence per plugin code**, starting at `001` and running unbroken across *all* of that plugin's suite files, in alphabetical filename order.

So a plugin's suites carve up one sequence rather than each restarting:

```
CHECKLIST_BLOCK_ISSUE_CLOSING.md          TC-CHK-001 … 014
CHECKLIST_CHECKLIST_MANAGEMENT.md         TC-CHK-015 … 042
CHECKLIST_GERMAN_LANGUAGE.md              TC-CHK-043 … 053
CHECKLIST_INSTALLATION_CONFIGURATION.md   TC-CHK-054 … 066
CHECKLIST_PERMISSIONS.md                  TC-CHK-067 … 078
CHECKLIST_PROGRESS_TRACKING.md            TC-CHK-079 … 092
CHECKLIST_TEMPLATES.md                    TC-CHK-093 … 115
```

### Adding a new test case — read this first

Because the sequence is **plugin-wide, not per-file**, you must find the plugin's current maximum across *every* suite file before picking a number. Never take "last number in the file I'm editing + 1" — that is exactly how the pre-migration scheme drifted into **204 duplicate IDs** (e.g. `TC-HLP-338` ended up defined as two completely different test cases in two different files).

```bash
# the only safe way to pick the next number
grep -rhoE "TC-CHK-[0-9]{3}" plugins/redmineflux_checklist_qa | sort -u | tail -1
```

Append new cases at the **end of the plugin's range**, even when the case belongs to a suite in the middle of the list — an out-of-order number is fine, a duplicate is not. This matters especially when multiple sessions are running in parallel: two sessions adding cases to different suites of the same plugin will collide unless both check the plugin-wide max.

**One code can span two folders.** `RIT` and `RKB` are each used by a standalone plugin folder *and* by a sub-area of `redmineflux_mcp_qa` (`issuetemplate/`, `knowledgebase/`). The sequence is per **code**, so those share one continuous range across both locations — check both when finding the max.

**Migrated 2026-09-22** — all 3,952 test cases across 176 suite files and 24 plugin codes were renumbered to this format, along with every cross-reference in `bugs/`, `docs/`, `reports/` and `automation/` (445 files, ~9,600 references).

> **Production caveat:** Redmine issues created before this migration still cite the *old* IDs in their descriptions (e.g. `TC-CRX-108–113`). Those were deliberately left untouched — each edit would need its own production approval. To translate an old ID cited on a production issue, look it up in **`scripts/tc-id-migration-map.json`** (old → new).
>
> **Two retired numbers were reissued.** `TC-HLP-077` and `TC-LTS-008` referred to cases that had been deleted/deferred before the migration; those numbers now belong to different tests. Their historical mentions are tagged `[legacy pre-2026-09-22 ID, no longer in use]` so they can't be mistaken for live references.

---

## 5. Bug File Format

Use `templates/bug-template.md` as the format. Save to `bugs/open/<BUG-ID>.md`.

Always include:
- Bug ID, title (sentence case), severity, Redmine version
- Steps to reproduce
- Expected result
- Actual result
- User role when bug was found
- Screenshot **embedded** in the bug MD file using `![](../../screenshots/<BUG-ID>/filename.png)` — not a plain text path
- **Production Redmine Issue ID** — once a bug is reported on `flux.zehntech.com`, project `ztflux` (see `REDMINEFLUX-MCP-SETUP.md` §1.1), via the redmineflux MCP server (`redmineflux_testcases_management_report_defect`, after write approval per `REDMINEFLUX-MCP-SETUP.md` §4), record the returned production issue number in the local bug MD file. If the bug hasn't been reported to production yet, leave it blank rather than guessing.

### Closing a bug: sync production status

When moving a bug's file from `bugs/open/` to `bugs/closed/` (Section 12), check its **Production Redmine Issue ID** field first:

- **Blank** — just move the file locally, nothing to sync.
- **Filled in** — the production issue must also be updated: status **In QA → Done**, and **% done → 100**. This is a production write (`redmineflux_core_update_issue` or equivalent), so it follows the same write-approval workflow as any other production change (`REDMINEFLUX-MCP-SETUP.md` §4.3) — prepare the exact change (issue ID, old/new status, old/new % done) and wait for explicit approval before executing. Do this before, or together with, moving the local file, so the local `bugs/closed/` copy and the production issue never fall out of sync.

---

## 6. Screenshot Rules

Take screenshots **only for bugs** — do NOT take screenshots during normal test case execution.

| Screenshot type | Save location | Naming pattern |
|-----------------|---------------|----------------|
| Bug evidence | `screenshots/<BUG-ID>/` | descriptive name of the failure |
| Bug retest | `screenshots/<BUG-ID>/` | `retest-<date>-<result>.png` |

- Bug screenshot must clearly show the failure area with the relevant page state visible.
- Retest screenshots go in the same `<BUG-ID>` folder as the original bug evidence.

### Embedding screenshots in bug MD files

Screenshots **must be embedded** in the bug MD file using markdown image syntax so they render visually when the file is opened — do NOT write a plain text path.

```markdown
![Bug evidence](../../screenshots/BUG-XXX/descriptive-name.png)
```

The relative path goes up two levels from `bugs/open/` to reach `screenshots/`:

```
bugs/open/BUG-XXX.md  →  ../../screenshots/BUG-XXX/filename.png
bugs/closed/BUG-XXX.md  →  ../../screenshots/BUG-XXX/filename.png
```

---

## 7. Report Generation Rules

**Generate one report per plugin, per testing type, per day that type was performed** —
`reports/<PREFIX>-<TestingType>-<date>.md`, e.g. `reports/HLP-Functional-2026-09-30.md`,
`reports/HLP-Security-2026-10-01.md`, `reports/CRX-Regression-2026-10-01.md`. This lives in the plugin's own
`reports/` folder alongside its other reports — there is no separate global or per-cycle report file.

### Naming rule

- One file per **(plugin, testing type, date)** combination.
- `<TestingType>` is one of the categories from that plugin's `<PREFIX>_SCOPE.md` checklist — `Functional`,
  `Permission`, `Workflow`, `Negative`, `UI`, `Multi-Language`, `Security`, `Performance`, `Code-Quality` — plus
  `Regression` for a regression pass and `Retest` for a bug-retest session that isn't itself tied to one
  testing-type suite.
- If **more than one type** of testing is performed on the same plugin on the same day, generate **one file per
  type**, not one file covering all of them — e.g. testing Functional and Security on Helpdesk on the same day
  produces both `HLP-Functional-<date>.md` and `HLP-Security-<date>.md`.
- If the same plugin + type is worked on again later the same day, **update** that day's existing file — don't
  create a second file for the same (plugin, type, date) triple.

### Each report must contain

- Plugin name and the testing type this report covers
- Test cases executed that day for this type, with individual results (pass/fail/blocked/skipped) and a summary
  count — **sourced directly from that day's `npx playwright test` run(s)** (§13): the TC ID(s) each `test()`
  carries, its result, and for any failure the test name, expected vs. actual, and whether the fix-loop
  categorized it as a test bug (fixed in the spec) or an app bug (filed below). Not a manually-recalled tally.
- Bugs/defects found that day under this type — IDs, severity, status, and which spec/TC caught it
- Fix verification / retesting details (Retest-type reports only)
- Regression results (Regression-type reports only)

| Report | When Generated | How |
|--------|---------------|-----|
| `<PREFIX>-<TestingType>-<date>.md` | End of each day that type of testing was performed on this plugin | Auto — one file per plugin/type/day, contents above |
| `<PREFIX>-<TestingType>-<date>.pdf` | **Only on explicit user request** | Ask: "Testing is complete. Shall I generate the PDF report?" |

Never generate the PDF automatically.

### Timing and delivery

Target end-of-day generation time is **7:15 PM** — generate/update the day's report(s) for whatever plugin(s) and
type(s) were worked on before ending the session. Generating the file is this repo's job; **delivering** it
(email, chat, wherever it needs to land) is not something this repo can do on its own — after generating it, tell
the user it's ready and ask how they want it sent, unless they've already told you the standing channel.

---

## 8. Memory Management

Two levels:

| Level | File | Contains |
|-------|------|----------|
| Global | `MEMORY.md` (root) | Rules applying to all plugins |
| Plugin | `plugins/<name>/docs/<PREFIX>_MEMORY.md` (or `docs/memory.md` for plugins scaffolded before §2b) | Plugin-specific quirks and observations |

- Update the plugin's memory file after every test run.
- Only update root `MEMORY.md` when something applies to all plugins.
- Read both memory files at the start of every session for that plugin.

---

## 9. Handoff Rules

- Update the plugin's handoff file (`plugins/<name>/docs/<PREFIX>_HANDOFF.md`, or `docs/handoff.md` for plugins scaffolded before §2b) at the end of every session.
- The next session must start by reading it before doing anything else.
- Record exactly which test case to pick up from next session.

---

## 10. STATUS.md Update Rule

Update `STATUS.md` after every test run:

| Plugin | Last Tested | Redmine Version | Open Bugs | Status |
|--------|-------------|-----------------|-----------|--------|

Status values: `Not Started` / `In Progress` / `Complete`

**`Complete` requires three things, not just zero open bugs:**
1. `bugs/open/` is empty (all bugs fixed and moved to `bugs/closed/`).
2. A full final cycle regression has been run and passed (see `SENIOR_QA_STANDARDS.md` §27) with a matching row in the plugin's Run History (in `<PREFIX>_HANDOFF.md`, or `docs/changelog.md` for older plugins).
3. `<PREFIX>_TRACEABILITY_MATRIX.md` (§2c) shows no requirement/feature with zero TC coverage, except ones explicitly recorded in `<PREFIX>_SCOPE.md`'s Out of Scope section. (Plugins scaffolded before §2c and not yet backfilled are exempt until backfilled.)

Until all three are true, keep the status as `In Progress`.

---

## 11. Session Start Checklist

At the start of every test session, read in this order:

1. `CLAUDE.md` (this file)
2. `MEMORY.md` (global rules)
3. `SENIOR_QA_STANDARDS.md` (testing standards)
4. `REDMINEFLUX-MCP-SETUP.md` (production redmineflux MCP write-approval policy — required before any bug is ever reported to production)
5. `QA_CREDENTIALS.md` (credentials for the target environment)
6. `plugins/<name>/docs/<PREFIX>_REQUIREMENTS.md`
7. `plugins/<name>/docs/<PREFIX>_FEATURES_LIST.md`
8. `plugins/<name>/docs/<PREFIX>_USER_GUIDE.md`
9. `plugins/<name>/docs/<PREFIX>_SCOPE.md`
10. `plugins/<name>/docs/<PREFIX>_TEST_PLAN.md`
11. `plugins/<name>/docs/<PREFIX>_TRACEABILITY_MATRIX.md` (see §2c — this is where to check for coverage gaps before writing a new TC)
12. `plugins/<name>/docs/<PREFIX>_MEMORY.md`
13. `plugins/<name>/docs/<PREFIX>_HANDOFF.md`
14. `plugins/<name>/testcases/<PREFIX>_<suite>.md`

(For plugins scaffolded before §2b, these are the lowercase `requirements.md` / `features-list.md` / etc. instead. A plugin scaffolded before §2c may not have a Test Plan / Traceability Matrix yet — see §2c's rollout note on whether to backfill it.)

Do not begin testing until all of the above are read.

**Before writing any test case file**, the requirements, features-list, and user-guide files must all be present. If any are missing, ask the user to provide them — do not proceed.

**Scope of this checklist:** it applies when starting or resuming actual testing work on a plugin (executing test cases, writing new ones, investigating a defect). It does **not** apply to a narrow, standalone action on something already fully written — e.g. "report BUG-XXX-NNN to production," "close BUG-XXX-NNN," "link this bug to a run." For those, read only the one document that actually governs that specific action (`REDMINEFLUX-MCP-SETUP.md` for reporting/linking a bug, `SENIOR_QA_STANDARDS.md` §16/§26/§27 for closure/regression) plus the local bug file itself — reading all 12 documents for a single already-scoped action wastes a large amount of tokens for no benefit, since none of the plugin's requirements/features/user-guide/scope/handoff/testcases content is actually used by that action.

---

## 12. Session End Checklist

At the end of every test session:

- [ ] All bugs saved to `bugs/open/` with correct format
- [ ] Fixed bugs moved from `bugs/open/` to `bugs/closed/` and open copy deleted
- [ ] For each bug closed this session that has a Production Redmine Issue ID, the production issue's status is updated In QA → Done and % done → 100 (Section 5, write-approval required)
- [ ] `bugs/_index.md` updated (status + file path)
- [ ] TC screenshots saved under `screenshots/<TC-ID>/`
- [ ] Bug screenshots saved under `screenshots/<BUG-ID>/`
- [ ] `reports/<PREFIX>-<TestingType>-<date>.md` generated/updated for every testing type performed today on this plugin — one file per type (§7)
- [ ] plugin's memory file updated with new observations
- [ ] plugin's handoff file updated with next session start point and a new Run History row for this run (or `docs/changelog.md` for older plugins)
- [ ] `STATUS.md` updated — Open Bugs count and Status description
- [ ] Every TC executed this session has a corresponding `automation/tests/<PREFIX>_<suite>.spec.ts` test (added or updated) and its run result (pass/fail/blocked) is recorded against the TC — see §13
- [ ] If a bug was retested and confirmed FIXED this session, regression has been run for its affected feature/suite (`SENIOR_QA_STANDARDS.md` §26) — not just the single TC
- [ ] If this session closed the **last** bug in `bugs/open/`, the full final cycle regression has been run (`SENIOR_QA_STANDARDS.md` §27) before `STATUS.md` is set to `Complete`
- [ ] `TIME_LOG.md` has a row for every testing / retest / bug-reporting / regression activity of this session, its Daily summary row is filled, and the time summary (per testcase, with comments) has been given to the user (§14)

---

## 13. Playwright Automation Framework (Automation-First)

Each plugin owns its own self-contained Playwright + TypeScript suite under `plugins/<name>/automation/`. This is
**the actual test execution source** for this repo — every TC result that reaches a report or the Traceability
Matrix comes from an `npx playwright test` run, never from a manual or live-browser pass. Claude + Playwright MCP
is kept **only** for special cases: reproducing a bug report, or debugging a failure the fix-loop (below) couldn't
resolve in 3 attempts. MCP is never used to execute or re-execute a test case in place of its spec.

| | `automation/` suite (execution) | Claude + MCP (special cases only) |
|---|---|---|
| Purpose | Execute every approved test case, discover bugs, catch regressions | Reproduce a reported bug; debug a failure the fix-loop couldn't resolve |
| Driven by | Standard Playwright TS test runner, repeatable, zero AI tokens per run | Claude driving a live browser, one-off |
| Source of truth | `testcases/<PREFIX>_<suite-name>.md` | Same file — never a substitute for the spec run |
| Output | Playwright HTML report / trace, pass-fail exit code, bug files for app bugs found, screenshots | Investigation notes / bug repro details, folded back into the bug file or the spec fix, not into TC results |

### Rules

- **Automation-first — write specs directly from approved test cases/requirements.** A TC does **not** need a
  prior manual PASS before it is automated. Once a test case is written in `testcases/<PREFIX>_<suite-name>.md`
  and approved (not just drafted), write its Playwright spec and run it natively — the spec run itself is the
  verdict (pass/fail/blocked), recorded against the TC the same way a manual run would be.
- **One spec file per test suite**, same base name as the source: `testcases/<PREFIX>_<suite-name>.md` → `automation/tests/<PREFIX>_<suite-name>.spec.ts`.
- **Every `test()` title must carry the TC ID(s)** it covers, e.g. `test('TC-HLP-178 - agent can close ticket', async ({ page }) => { ... })`, so results stay traceable back to the testcase file.
- **Page Object Model, self-contained per plugin.** Page objects live in `automation/tests/pages/`, separate from the specs — as plain classes named `<Name>Page.ts` (PascalCase, no `.spec.ts` suffix, so the runner doesn't treat them as tests). A spec file must not contain raw selectors — it calls page object methods. Before adding a new page object, check this plugin's own `automation/tests/pages/` first; don't create a second page object for a screen this plugin's suite already models. Prefer resilient locators (`getByRole()`, `getByLabel()`, `getByText()`) over raw CSS/XPath selectors.
- **File naming inside `automation/tests/`:** `<suite-name>.spec.ts` for specs and `<name>.setup.ts` for one-time infrastructure (e.g. `auth.setup.ts`, `provision.setup.ts`) live directly in `automation/tests/`; every `<Name>Page.ts` page object lives in `automation/tests/pages/`. Only `.spec.ts` and `.setup.ts` files are runnable tests.
- **Credentials/base URL only via `automation/utilities/env.ts`**, which reads `QA_CREDENTIALS.md`. Never hardcode a URL, username, or password inside a spec or page object.
- **Use fixtures for login/session state** (`automation/utilities/`, e.g. `base.fixtures.ts`) instead of repeating login steps inside every test. The standard pattern is a `tests/auth.setup.ts` that logs in once per role and saves `.auth/<role>.json`, referenced by `storageState` in `playwright.config.ts`.
- **`tests/provision.setup.ts` bootstraps the environment itself, idempotently.** Runs before `auth.setup.ts` (both matched by the `.setup.ts` runner pattern, chained via `dependencies` in `playwright.config.ts` so order is guaranteed regardless of `fullyParallel`). Logs in as the one credential every fresh instance is guaranteed to have — Admin — then checks-before-creating every other role/project/user/customer the suite's fixtures reference, via real UI clicks (no direct DB/backend access). This is what lets the suite run against a brand-new server or container, not just the one environment it happened to be built against.
- **`testdata/` and `uploads/`** hold checked-in fixtures (sample data files, files used by upload test cases) — commit these. **`downloads/` and `screenshots/`** hold run-generated artifacts — gitignored, and distinct from the plugin's own `screenshots/<TC-ID>/` bug-evidence folder.
- Playwright's own HTML report and trace files are a separate artifact from `reports/<PREFIX>-<TestingType>-<date>.md` — they report the automated run itself, not the day's QA report.
- When a bug is found by a spec run, file it exactly like any other bug: check `bugs/_duplicates.md` / `bugs/_index.md`, use `templates/bug-template.md`, save to `bugs/open/`, and note in the bug file that it was found via the automated suite (which spec/TC caught it).
- Run the full suite with `npx playwright test --reporter=line`. Use `--project=chromium` for a fast dev pass, all configured browsers before a cycle is called complete, and `--trace on` to re-run a confusing failure with a full trace.

### Fix Loop (failure triage)

When a spec fails, diagnose before changing anything — max 3 fix attempts per failure in a given run:

1. **Read the failure output** — Playwright's error includes expected vs. actual, the failing selector/assertion, and a page-state snippet. Re-run with `--trace on` if it's still unclear.
2. **Categorize explicitly, every time:**
   - **Test bug** — wrong selector, timing issue, stale test data, incorrect expected value → fix the spec or page object.
   - **App bug** — the plugin is actually behaving incorrectly → **do not edit the spec to make it pass.** File it per §5 (check duplicates, use the bug template, save to `bugs/open/`) and leave the spec asserting the correct expected behavior, so it keeps failing (red) until the app is fixed.
3. **Re-run after every fix** and report the re-run command and result, even when it now passes.
4. **If a failure is still unresolved after 3 attempts**, stop — report what's failing, what's been tried, and whether it looks like a test issue or an app issue, and ask the user before continuing. Don't keep burning cycles patching a spec that may be testing the wrong thing.
5. Every run's result (pass/fail/blocked per TC ID) is what gets recorded in that day's `reports/<PREFIX>-<TestingType>-<date>.md` (§7) and in `<PREFIX>_TRACEABILITY_MATRIX.md` (§2c) — there is no separate "manual result" to reconcile it against.

### Two regression triggers (see `SENIOR_QA_STANDARDS.md` §26 and §27)

| Trigger | Scope | Gate it feeds |
|---|---|---|
| A bug is retested and confirmed FIXED | The affected feature/suite, plus adjacent features per the severity table in §26 | Bug can be moved to `bugs/closed/` only after this regression passes |
| `bugs/open/` becomes empty (all bugs fixed for the cycle) | The **entire plugin** — every suite, not just the fixed ones | `STATUS.md` can only be set to `Complete` after this passes |

Run the plugin's `automation/tests/` specs for whichever TCs they cover. If a failure can't be resolved within the fix-loop's 3 attempts, Claude + MCP may be used to debug that specific failure (§13's special-case use), but the recorded result still comes from the spec's next `npx playwright test` run, not from the MCP session.

---

## 13a. Test Data Registry (per environment)

Test cases reference data — customer names, organization names, SLA names, ticket numbers — that is **not stable across environments or across runs**: a local Docker instance and a Forge instance have different data, ticket numbers auto-increment, and fixtures get created/deleted/deactivated as testing proceeds. Several helpdesk-style entities also refuse duplicate names outright, so knowing what already exists on a given server matters before creating more.

To keep validation grounded in what is actually true on the server being tested (not what a test case assumed on a different run), maintain one **real `.xlsx` workbook per environment** in `automation/testdata/`:

```
automation/testdata/<PREFIX>_TESTDATA_<ENV>.xlsx      e.g. HELPDESK_TESTDATA_LOCAL.xlsx, HELPDESK_TESTDATA_FORGE.xlsx
```

### Structure

- A `README` sheet explaining the workbook's purpose and the Status legend.
- One sheet per entity type the plugin manages (for Helpdesk: Organizations, Customers, SLAs, Support Levels, Products, Canned Responses, Holidays, Tickets (fixtures), Prepaid Budgets — adapt the sheet list to whatever entities a different plugin actually has).
- Each row tracks: the entity's identifying name/ID, its current **Status** (`Active` / `Deactivated` / `Deleted` / `Unknown`, via a dropdown), which TC/session created it, created date, last-verified date, and free-text notes (e.g. current field values worth remembering).

### Rules

- **One workbook per server.** Data in the LOCAL file says nothing about the FORGE file or vice versa — never assume a fixture on one environment exists on another.
- **Check before creating.** Before creating a new fixture for a test case, check the relevant sheet first — reuse an existing one instead of hitting a duplicate-name refusal or silently creating clutter.
- **Update immediately, not later.** After a test run creates, modifies, or deletes an entity, update its row in the same session — a stale registry is worse than no registry.
- **This is the source of truth for "does X exist," not the test case file.** A test case may have been written against a different run or environment; the registry reflects the current server.
- **Never hardcode a ticket number in an expected result.** Ticket IDs auto-increment and are the most volatile data of all — track fixture tickets by a stable description (subject/purpose) in the `Tickets (fixtures)` sheet, and re-verify the current `#` before relying on it in a session.

### Generating / updating a workbook

Real `.xlsx` is a binary format, generated with a small script rather than hand-written:

```bash
pip install openpyxl   # one-time
python scripts/gen_testdata_xlsx.py <out_path.xlsx> "<env label>" "<Plugin Display Name>"
```

See `scripts/gen_testdata_xlsx.py` for the generator (adapt its `SHEETS` dict per plugin). Re-running it against the same path regenerates a blank template — it does not merge with existing data rows, so day-to-day updates to a workbook's data should be made by opening and editing the file directly, not by re-running the script (only re-run it to create a new environment's file, or to deliberately reset one).

---

## 14. Time Tracking (`TIME_LOG.md`)

Every activity spent on testing has to be logged as time against a testcase in Redmine. So the time is tracked
**while the work happens**, in one global file at the repo root: `TIME_LOG.md`.

### What is tracked

Testing (TC execution), regression re-runs, bug retesting, bug reporting (local bug MD, screenshots, production
report, linking to the run), test case writing, and setup/investigation done for a specific TC. This applies to
narrow standalone actions too — "report BUG-XXX to production" or "retest BUG-XXX" each get their own row, even
though §11's full reading checklist doesn't apply to them.

### How

1. **Start** — when the activity begins (first read of the TC / bug file), capture the time with
   `date '+%Y-%m-%d %H:%M'`.
2. **End** — when the verdict is recorded (PASS/FAIL/BLOCKED, FIXED/NOT FIXED), or the bug file is saved/reported,
   capture the time again.
3. **Append the row immediately** to `TIME_LOG.md` → Entries: date, start, end, duration (`h:mm` + decimal hours),
   activity, plugin, the testcase to log against, bug ID if any, and a comment saying what the time was for.
   Never reconstruct times afterwards from file timestamps or production data.
4. **Which testcase** — follow the table at the top of `TIME_LOG.md`. A bug retest and a bug report are logged
   against the TC the bug is linked to. If the work isn't tied to any TC, write `—` and ask the user which TC to put
   it on before it is ever logged to production.
5. **Parallel sessions** — several sessions can append to the same file. Re-read it right before appending and add
   rows at the end only; never rewrite or reorder other rows.

### Reporting to the user

At the end of every testing session — and whenever the user asks — fill the Daily summary row and give the user a
short time summary:
- per testcase: TC ID, total time, and the comment(s) of what it was for;
- totals per activity (testing / retesting / bug reporting / regression / other) and a grand total.

### Logging to production

Only when the user explicitly says to log the time, and for exactly the testcases they name. It is a production
write (`redmineflux_core_log_time` on the testcase's production issue) and follows the approval rule in
`REDMINEFLUX-MCP-SETUP.md` §4 — prepare the exact entries (issue #, hours, date, activity, comment), wait for
approval, execute. Then fill the row's **Prod TC issue #** and **Logged to prod** columns with the time entry ID so
nothing is logged twice.
