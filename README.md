# Redmine QA Automation

AI-driven QA testing framework for Redmine plugins using Claude + MCP (Playwright).

## Folder Structure

```
redmine-qa-automation/
├── MEMORY.md                          ← global testing rules (all plugins)
├── STATUS.md                          ← cross-plugin test status dashboard
├── SENIOR_QA_STANDARDS.md             ← testing methodology and bug standards
├── QA_CREDENTIALS_FORGE.md            ← Forge environment credentials
├── QA_CREDENTIALS_LOCAL.md            ← local environment credentials
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
    │   ├── docs/
    │   │   ├── requirements.md        ← what the plugin does
    │   │   ├── scope.md               ← what is/isn't being tested
    │   │   ├── flow.md                ← key user flows
    │   │   ├── handoff.md             ← session handoff notes
    │   │   ├── memory.md              ← plugin-specific observations
    │   │   └── changelog.md           ← test run history
    │   ├── testcases/                 ← one .md file per test suite
    │   ├── bugs/
    │   │   ├── _index.md
    │   │   ├── _duplicates.md
    │   │   ├── open/
    │   │   └── closed/
    │   ├── screenshots/               ← bug evidence only, per Bug ID subfolder
    │   ├── reports/
    │   │   ├── tc-report.html         ← auto-generated each test run
    │   │   ├── defects-summary.html   ← auto-generated each test run
    │   │   ├── final-bug-report.md    ← auto-generated from bugs/open/
    │   │   └── final-bug-report.pdf   ← ONLY on explicit user request
    │   └── logs/
    │
    └── testcase-management-plugin/    ← active plugin (same structure as _template)
```

## Adding a New Plugin

1. Copy `plugins/_template/` and rename it to the plugin name (kebab-case)
2. Fill in `docs/requirements.md` and `docs/scope.md` before testing
3. Add test cases in `testcases/` (one `.md` file per test suite)
4. Add a row to `STATUS.md`

## Required Files Before Testing

| File | Purpose |
|------|---------|
| `SENIOR_QA_STANDARDS.md` | Testing methodology — always loaded |
| `QA_CREDENTIALS_FORGE.md` or `QA_CREDENTIALS_LOCAL.md` | Credentials for target environment |
| `plugins/<name>/docs/requirements.md` | What the plugin does |
| `plugins/<name>/docs/scope.md` | What is in/out of scope |
| `plugins/<name>/testcases/<suite>.md` | Specific test cases to execute |
| `MEMORY.md` | Global rules |
| `plugins/<name>/docs/memory.md` | Plugin-specific rules |
| `plugins/<name>/docs/handoff.md` | Session continuity |

## Memory Levels

| Level | File | Scope |
|-------|------|-------|
| Global | `MEMORY.md` | Rules for all plugins |
| Plugin | `plugins/<name>/docs/memory.md` | Plugin-specific quirks and observations |
