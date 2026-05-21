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
├── QA_CREDENTIALS_FORGE.md          ← Forge environment credentials
├── QA_CREDENTIALS_LOCAL.md          ← local environment credentials
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
    └── <plugin-name>/               ← one folder per plugin (kebab-case)
        ├── docs/
        │   ├── requirements.md      ← what the plugin does (READ BEFORE TESTING)
        │   ├── scope.md             ← what is and is not being tested this cycle
        │   ├── flow.md              ← key user flows for test design
        │   ├── handoff.md           ← session handoff notes
        │   ├── memory.md            ← plugin-specific observations (persist across sessions)
        │   └── changelog.md         ← test run history
        ├── testcases/
        │   └── <suite-name>.md      ← one file per test suite (e.g. language-compatibility.md)
        ├── bugs/
        │   ├── _index.md            ← master bug tracker for this plugin
        │   ├── _duplicates.md       ← duplicate prevention register
        │   ├── open/                ← one .md file per open bug
        │   └── closed/              ← one .md file per closed bug
        ├── screenshots/
        │   ├── <TC-ID>/             ← one subfolder per TC (e.g. TC-RAF-001/) — PASS/FAIL evidence
        │   └── <BUG-ID>/            ← one subfolder per bug (e.g. BUG-RAF-001/) — failure + retest evidence
        ├── reports/
        │   ├── tc-report.html       ← test case pass/fail report
        │   ├── defects-summary.html ← defect count and severity breakdown
        │   ├── final-bug-report.md  ← compiled from all files in bugs/open/
        │   └── final-bug-report.pdf ← ONLY generated on explicit user request
        └── logs/                    ← test execution logs
```

---

## 3. Adding a New Plugin

When the user asks to add or test a new plugin, create this structure:

```
plugins/<plugin-name>/
  docs/requirements.md
  docs/scope.md
  docs/flow.md
  docs/handoff.md
  docs/memory.md
  docs/changelog.md
  testcases/
  bugs/_index.md
  bugs/_duplicates.md
  bugs/open/
  bugs/closed/
  screenshots/          ← subfolders created per TC-ID and BUG-ID as testing progresses
  reports/final-bug-report.md
  logs/
```

Then add a row to `STATUS.md`.

Use this content for each new file:

### docs/requirements.md
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

### docs/scope.md
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

### docs/flow.md
```markdown
# Plugin Flow — [Plugin Name]

## Flow 1: [Flow Name]

1.
2.
3.
```

### docs/handoff.md
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
```

### docs/memory.md
```markdown
# Plugin Memory — [Plugin Name]

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

## Confirmed Working

## Recurring Issues

## Environment Notes
```

### docs/changelog.md
```markdown
# Test Run Changelog — [Plugin Name]

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
```

### bugs/_index.md
```markdown
# Bug Index — [Plugin Name]

| Bug ID | Title | Status | Severity | Redmine Version | File Path |
|--------|-------|--------|----------|-----------------|-----------|

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

### reports/final-bug-report.md
```markdown
# Final Bug Report — [Plugin Name]

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|

## Open Bugs

## Environment

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
| gantt-plugin | GNT |
| redmineflux_advanced_field | RAF |

Examples: `BUG-TCM-001`, `BUG-GNT-001`

Add a new code row when a new plugin is added.

---

## 5. Bug File Format

Use `templates/bug-template.md` as the format. Save to `bugs/open/<BUG-ID>.md`.

Always include:
- Bug ID, title (sentence case), severity, Redmine version
- Steps to reproduce
- Expected result
- Actual result
- User role when bug was found
- Screenshot path under `screenshots/<BUG-ID>/`

---

## 6. Screenshot Rules

Take screenshots for **every test case executed** and for every bug found.

| Screenshot type | Save location | Naming pattern |
|-----------------|---------------|----------------|
| TC execution (PASS/FAIL) | `screenshots/<TC-ID>/` | `<tc-id>-pass.png` or `<tc-id>-fail.png` |
| Bug evidence | `screenshots/<BUG-ID>/` | descriptive name of the failure |
| Bug retest | `screenshots/<BUG-ID>/` | `retest-<date>-<result>.png` |

- TC screenshot must show the final page state that confirms the PASS or FAIL result.
- Bug screenshot must clearly show the failure area with the relevant page state visible.
- Retest screenshots go in the same `<BUG-ID>` folder as the original bug evidence.

---

## 7. Report Generation Rules

| Report | When Generated | How |
|--------|---------------|-----|
| `tc-report.html` | End of every test run | Auto |
| `defects-summary.html` | End of every test run | Auto |
| `final-bug-report.md` | End of every test run | Auto — read all files in `bugs/open/` |
| `final-bug-report.pdf` | **Only on explicit user request** | Ask: "Testing is complete. Shall I generate the PDF bug report?" |

Never generate the PDF automatically.

---

## 8. Memory Management

Two levels:

| Level | File | Contains |
|-------|------|----------|
| Global | `MEMORY.md` (root) | Rules applying to all plugins |
| Plugin | `plugins/<name>/docs/memory.md` | Plugin-specific quirks and observations |

- Update plugin `memory.md` after every test run.
- Only update root `MEMORY.md` when something applies to all plugins.
- Read both memory files at the start of every session for that plugin.

---

## 9. Handoff Rules

- Update `plugins/<name>/docs/handoff.md` at the end of every session.
- The next session must start by reading `handoff.md` before doing anything else.
- Record exactly which test case to pick up from next session.

---

## 10. STATUS.md Update Rule

Update `STATUS.md` after every test run:

| Plugin | Last Tested | Redmine Version | Open Bugs | Status |
|--------|-------------|-----------------|-----------|--------|

Status values: `Not Started` / `In Progress` / `Complete`

---

## 11. Session Start Checklist

At the start of every test session, read in this order:

1. `CLAUDE.md` (this file)
2. `MEMORY.md` (global rules)
3. `SENIOR_QA_STANDARDS.md` (testing standards)
4. `QA_CREDENTIALS_FORGE.md` or `QA_CREDENTIALS_LOCAL.md` (target environment)
5. `plugins/<name>/docs/requirements.md`
6. `plugins/<name>/docs/scope.md`
7. `plugins/<name>/docs/memory.md`
8. `plugins/<name>/docs/handoff.md`
9. `plugins/<name>/testcases/<suite>.md`

Do not begin testing until all of the above are read.

---

## 12. Session End Checklist

At the end of every test session:

- [ ] All bugs saved to `bugs/open/` with correct format
- [ ] `bugs/_index.md` updated
- [ ] Screenshots saved under `screenshots/<BUG-ID>/`
- [ ] `tc-report.html` generated
- [ ] `defects-summary.html` generated
- [ ] `final-bug-report.md` generated from open bugs
- [ ] `docs/memory.md` updated with new observations
- [ ] `docs/handoff.md` updated with next session start point
- [ ] `docs/changelog.md` updated with this run summary
- [ ] `STATUS.md` updated
