# CLAUDE.md — Redmine QA Automation

This file defines how Claude must work in this repository. Read this before every session.

---

## 1. What This Repository Is

AI-driven QA testing framework for Redmine plugins using Claude + MCP (Playwright).
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
        │   ├── <PREFIX>_FLOW.md            ← key user flows for test design
        │   ├── <PREFIX>_HANDOFF.md         ← session handoff notes + Run History (test run/regression log, replaces changelog.md)
        │   └── <PREFIX>_MEMORY.md          ← plugin-specific observations (persist across sessions)
        ├── testcases/
        │   └── <PREFIX>_<SUITE-NAME>.md    ← one file per test suite (e.g. HELPDESK_SLA_WORKFLOW.md)
        ├── automation/               ← Playwright + TypeScript regression suite for THIS plugin
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
        │                                 plugin's own screenshots/<TC-ID>/ manual evidence folder)
        ├── bugs/
        │   ├── _index.md            ← master bug tracker for this plugin
        │   ├── _duplicates.md       ← duplicate prevention register
        │   ├── open/                ← one .md file per open bug
        │   └── closed/              ← one .md file per closed bug
        ├── screenshots/
        │   ├── <TC-ID>/             ← one subfolder per TC (e.g. TC-RAF-001/) — PASS/FAIL evidence
        │   └── <BUG-ID>/            ← one subfolder per bug (e.g. BUG-RAF-001/) — failure + retest evidence
        ├── reports/
        │   ├── <PREFIX>-tc-report-<date>.md  ← ONE consolidated report per testing cycle (see §7) —
        │   │                                    testing types, TC results, bugs/defects, fix verification,
        │   │                                    regression results, final status. No separate defect/regression reports.
        │   └── <PREFIX>-tc-report-<date>.pdf ← ONLY generated on explicit user request
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

## 3. Adding a New Plugin

When the user asks to add or test a new plugin, create this structure:

```
plugins/<plugin-name>/                  (<PREFIX> = doc prefix per §2b, e.g. HELPDESK)
  docs/<PREFIX>_REQUIREMENTS.md
  docs/<PREFIX>_FEATURES_LIST.md
  docs/<PREFIX>_USER_GUIDE.md
  docs/<PREFIX>_SCOPE.md
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
  reports/              ← <PREFIX>-tc-report-<date>.md written per cycle, see §7
  logs/
```

`automation/` is created empty at plugin setup — do not scaffold Playwright specs until at least one test case in that suite has a confirmed manual PASS (see Section 13).

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

## Out of Scope

## Redmine Version

## Environment

## Test Cycle
```

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

### reports/<PREFIX>-tc-report-<date>.md
```markdown
# Test Case Report — [Plugin Name] — [Date]

> One consolidated report per testing cycle. Do not split this into separate defect/regression/pass-fail reports — see CLAUDE.md §7.

## Testing Performed

- [ ] Functional testing
- [ ] Permission testing
- [ ] Workflow testing
- [ ] Negative testing
- [ ] UI validation
- [ ] Regression testing

## Test Case Execution Summary

| Total TCs | Pass | Fail | Blocked | Skipped |
|-----------|------|------|---------|---------|

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|

## Fix Verification / Retesting

## Regression Testing Results

## Final Overall Testing Status

- Redmine Version:
- Environment:
- Test Date:
- Status: `In Progress` / `Complete`
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

**Generate only one consolidated report per testing cycle** — `reports/<PREFIX>-tc-report-<date>.md`. Do not create a separate defects-summary, regression, or any other standalone testing report; everything goes in this one file.

The consolidated report must contain:
- Types of testing performed (functional, permission, workflow, negative, regression, etc.)
- Total test cases and execution results (pass/fail/blocked/skipped counts)
- Bugs/defects found, including their IDs and status
- Fix verification / retesting details
- Regression testing results
- Final overall testing status

| Report | When Generated | How |
|--------|---------------|-----|
| `<PREFIX>-tc-report-<date>.md` | End of every testing cycle | Auto — single consolidated file, contents above |
| `<PREFIX>-tc-report-<date>.pdf` | **Only on explicit user request** | Ask: "Testing is complete. Shall I generate the PDF report?" |

Never generate the PDF automatically.

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

**`Complete` requires two things, not just zero open bugs:**
1. `bugs/open/` is empty (all bugs fixed and moved to `bugs/closed/`).
2. A full final cycle regression has been run and passed (see `SENIOR_QA_STANDARDS.md` §27) with a matching row in the plugin's Run History (in `<PREFIX>_HANDOFF.md`, or `docs/changelog.md` for older plugins).

Until both are true, keep the status as `In Progress`.

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
10. `plugins/<name>/docs/<PREFIX>_MEMORY.md`
11. `plugins/<name>/docs/<PREFIX>_HANDOFF.md`
12. `plugins/<name>/testcases/<PREFIX>_<suite>.md`

(For plugins scaffolded before §2b, these are the lowercase `requirements.md` / `features-list.md` / etc. instead.)

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
- [ ] `reports/<PREFIX>-tc-report-<date>.md` generated/updated — single consolidated report (testing types, TC results, bugs/defects, fix verification, regression results, final status); no separate defect/regression reports
- [ ] plugin's memory file updated with new observations
- [ ] plugin's handoff file updated with next session start point and a new Run History row for this run (or `docs/changelog.md` for older plugins)
- [ ] `STATUS.md` updated — Open Bugs count and Status description
- [ ] If any TC moved to a confirmed PASS this session and is in scope for regression, its `automation/tests/<suite>.spec.ts` is added or updated
- [ ] If a bug was retested and confirmed FIXED this session, regression has been run for its affected feature/suite (`SENIOR_QA_STANDARDS.md` §26) — not just the single TC
- [ ] If this session closed the **last** bug in `bugs/open/`, the full final cycle regression has been run (`SENIOR_QA_STANDARDS.md` §27) before `STATUS.md` is set to `Complete`

---

## 13. Playwright Automation Framework (Regression)

Each plugin owns its own self-contained Playwright + TypeScript suite under `plugins/<name>/automation/`. This is separate from the manual/exploratory testing done with Claude + Playwright MCP:

| | Manual / MCP testing | `automation/` regression suite |
|---|---|---|
| Purpose | Discover bugs, explore new/changed behavior | Re-verify behavior that already passed, catch regressions |
| Driven by | Claude + Playwright MCP, session by session | Standard Playwright TS test runner, repeatable |
| Source of truth | `testcases/<suite>.md` | Same file — automation follows it, never leads it |
| Output | Bug files, the consolidated `<PREFIX>-tc-report-<date>.md`, screenshots | Playwright HTML report / trace, pass-fail exit code |

### Rules

- **Automate only test cases with a confirmed manual PASS.** Do not write a Playwright spec for a TC that hasn't been executed and passed manually first — automation locks in verified behavior, it does not discover new behavior.
- **One spec file per test suite**, same base name as the source: `testcases/<PREFIX>_<suite-name>.md` → `automation/tests/<PREFIX>_<suite-name>.spec.ts`.
- **Every `test()` title must carry the TC ID(s)** it covers, e.g. `test('TC-HLP-178 - agent can close ticket', async ({ page }) => { ... })`, so results stay traceable back to the testcase file.
- **Page Object Model, self-contained per plugin.** Page objects live in `automation/tests/pages/`, separate from the specs — as plain classes named `<Name>Page.ts` (PascalCase, no `.spec.ts` suffix, so the runner doesn't treat them as tests). A spec file must not contain raw selectors — it calls page object methods. Before adding a new page object, check this plugin's own `automation/tests/pages/` first; don't create a second page object for a screen this plugin's suite already models.
- **File naming inside `automation/tests/`:** `<suite-name>.spec.ts` for specs and `<name>.setup.ts` for one-time infrastructure (e.g. `auth.setup.ts`, `provision.setup.ts`) live directly in `automation/tests/`; every `<Name>Page.ts` page object lives in `automation/tests/pages/`. Only `.spec.ts` and `.setup.ts` files are runnable tests.
- **Credentials/base URL only via `automation/utilities/env.ts`**, which reads `QA_CREDENTIALS.md`. Never hardcode a URL, username, or password inside a spec or page object.
- **Use fixtures for login/session state** (`automation/utilities/`, e.g. `base.fixtures.ts`) instead of repeating login steps inside every test. The standard pattern is a `tests/auth.setup.ts` that logs in once per role and saves `.auth/<role>.json`, referenced by `storageState` in `playwright.config.ts`.
- **`tests/provision.setup.ts` bootstraps the environment itself, idempotently.** Runs before `auth.setup.ts` (both matched by the `.setup.ts` runner pattern, chained via `dependencies` in `playwright.config.ts` so order is guaranteed regardless of `fullyParallel`). Logs in as the one credential every fresh instance is guaranteed to have — Admin — then checks-before-creating every other role/project/user/customer the suite's fixtures reference, via real UI clicks (no direct DB/backend access). This is what lets the suite run against a brand-new server or container, not just the one environment it happened to be built against.
- **`testdata/` and `uploads/`** hold checked-in fixtures (sample data files, files used by upload test cases) — commit these. **`downloads/` and `screenshots/`** hold run-generated artifacts — gitignored, and distinct from the plugin's own `screenshots/<TC-ID>/` manual evidence folder.
- Playwright's own HTML report and trace files are a separate artifact from `reports/<PREFIX>-tc-report-<date>.md` — they report the automated regression run, not the manual session.
- When a bug is found *by the automation suite* (a regression), file it exactly like a manually found bug: check `bugs/_duplicates.md` / `bugs/_index.md`, use `templates/bug-template.md`, save to `bugs/open/`, and note in the bug file that it was found via the automated regression suite.

### Two regression triggers (see `SENIOR_QA_STANDARDS.md` §26 and §27)

| Trigger | Scope | Gate it feeds |
|---|---|---|
| A bug is retested and confirmed FIXED | The affected feature/suite, plus adjacent features per the severity table in §26 | Bug can be moved to `bugs/closed/` only after this regression passes |
| `bugs/open/` becomes empty (all bugs fixed for the cycle) | The **entire plugin** — every suite, not just the fixed ones | `STATUS.md` can only be set to `Complete` after this passes |

Run the plugin's `automation/tests/` specs first for whichever TCs they cover; manually re-run anything not yet automated.

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
