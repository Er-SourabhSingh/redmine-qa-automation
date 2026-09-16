# Redmine QA Automation

AI-driven QA testing framework for Redmine plugins using Claude + MCP (Playwright).

## Folder Structure

```
redmine-qa-automation/
├── MEMORY.md                          ← global testing rules (all plugins)
├── STATUS.md                          ← cross-plugin test status dashboard
├── SENIOR_QA_STANDARDS.md             ← testing methodology and bug standards
├── QA_CREDENTIALS.md                  ← common QA credentials (all environments/roles)
│
├── scripts/                           ← utility scripts
├── templates/
│   ├── bug-template.md                ← standard bug report format
│   └── testcase-template.md           ← test case file template
│
├── prompts/
│   └── claude/
│       └── PLUGIN_TEST_PROMPT_TEMPLATE.md
│
└── plugins/
    ├── _template/                     ← copy this when adding a new plugin
    │   ├── docs/                      ← filenames are <PREFIX>_<NAME>.md, see CLAUDE.md §2b (e.g. HELPDESK_REQUIREMENTS.md)
    │   │   ├── <PREFIX>_REQUIREMENTS.md     ← what the plugin does (required before writing test cases)
    │   │   ├── <PREFIX>_FEATURES_LIST.md    ← full feature list for test coverage (required before writing test cases)
    │   │   ├── <PREFIX>_USER_GUIDE.md       ← end-user guide — real UI flows (required before writing test cases)
    │   │   ├── <PREFIX>_SCOPE.md            ← what is/isn't being tested
    │   │   ├── <PREFIX>_FLOW.md             ← key user flows
    │   │   ├── <PREFIX>_HANDOFF.md          ← session handoff notes + Run History (test run log, no separate changelog.md)
    │   │   └── <PREFIX>_MEMORY.md           ← plugin-specific observations
    │   ├── testcases/                 ← one <PREFIX>_<suite-name>.md file per test suite
    │   ├── bugs/
    │   │   ├── _index.md
    │   │   ├── _duplicates.md
    │   │   ├── open/
    │   │   └── closed/
    │   ├── screenshots/
    │   │   ├── <TC-ID>/               ← one subfolder per TC — PASS/FAIL evidence
    │   │   └── <BUG-ID>/              ← one subfolder per bug — failure + retest evidence
    │   ├── reports/
    │   │   ├── tc-report.html         ← auto-generated each test run
    │   │   ├── defects-summary.html   ← auto-generated each test run
    │   │   ├── final-bug-report.md    ← auto-generated from bugs/open/ and bugs/closed/
    │   │   └── final-bug-report.pdf   ← ONLY on explicit user request
    │   └── logs/
    │
    ├── redmineflux_advanced_field/    ← 51 PASS, 0 bugs open (same structure as _template)
    └── testcase-management-plugin/    ← active plugin (same structure as _template)
```

## Adding a New Plugin

1. Copy `plugins/_template/` and rename it to the plugin name (kebab-case)
2. Fill in `docs/<PREFIX>_REQUIREMENTS.md`, `docs/<PREFIX>_FEATURES_LIST.md`, and `docs/<PREFIX>_USER_GUIDE.md` — **all three are required before writing any test cases**
3. Fill in `docs/scope.md` before testing
4. Add test cases in `testcases/` (one `.md` file per test suite)
5. Add a row to `STATUS.md`

## Required Files Before Testing

| File | Purpose |
|------|---------|
| `SENIOR_QA_STANDARDS.md` | Testing methodology — always loaded |
| `QA_CREDENTIALS.md` | Credentials for the target environment |
| `plugins/<name>/docs/<PREFIX>_REQUIREMENTS.md` | What the plugin does |
| `plugins/<name>/docs/<PREFIX>_SCOPE.md` | What is in/out of scope |
| `plugins/<name>/testcases/<PREFIX>_<suite>.md` | Specific test cases to execute |
| `MEMORY.md` | Global rules |
| `plugins/<name>/docs/<PREFIX>_MEMORY.md` | Plugin-specific rules |
| `plugins/<name>/docs/<PREFIX>_HANDOFF.md` | Session continuity |

`<PREFIX>` is the plugin's doc prefix (see `CLAUDE.md` §2b, e.g. `HELPDESK`). Plugins scaffolded before this rule keep their lowercase filenames instead (`requirements.md`, `memory.md`, etc.).

## Required Files Before Writing Test Cases

These three files **must exist** before any test case file is written. If any are missing, provide them first.

| File | Purpose |
|------|---------|
| `plugins/<name>/docs/<PREFIX>_REQUIREMENTS.md` | Plugin features, workflows, and permissions matrix |
| `plugins/<name>/docs/<PREFIX>_FEATURES_LIST.md` | Full feature list to ensure no feature is missed in test coverage |
| `plugins/<name>/docs/<PREFIX>_USER_GUIDE.md` | Real end-user behavior, UI flows, and edge cases |

## Memory Levels

| Level | File | Scope |
|-------|------|-------|
| Global | `MEMORY.md` | Rules for all plugins |
| Plugin | `plugins/<name>/docs/<PREFIX>_MEMORY.md` | Plugin-specific quirks and observations |
