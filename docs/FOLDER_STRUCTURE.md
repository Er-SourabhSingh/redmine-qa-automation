# Recommended Folder Structure

Use this structure for AI-agent-driven Redmine plugin testing.

```
redmine-qa-automation/
  bugs/
    _index.md
    _duplicates.md
    <plugin_name>/
      open/
      closed/
    <theme_name>/
      open/
      closed/
    BUG_TEMPLATE.md
  docs/
    FOLDER_STRUCTURE.md
  logs/
  plugins/
    <plugin_name>/
      scope.md
      notes.md
      TEST_CASES.md
  prompts/
    claude/
      PLUGIN_TEST_PROMPT_TEMPLATE.md
  reports/
  screenshots/
  test-results/
  HANDOFF.md
  MEMORY.md
  QA_CREDENTIALS_FORGE.md
  QA_CREDENTIALS_LOCAL.md
  SENIOR_QA_STANDARDS.md
  TEST_CASES.md
```

## How to use these folders

- In `bugs/<plugin_name>/open/`, keep new/open bug files for that plugin.
- Move fixed bugs to `bugs/<plugin_name>/closed/`.
- Use the same pattern for themes: `bugs/<theme_name>/open/` and `bugs/<theme_name>/closed/`.
- Place plugin testing markdown files under `plugins/<plugin_name>/` (`scope.md`, `notes.md`, `TEST_CASES.md`).

## Placement with Redmine

Recommended workspace:

```
workspace/
  redmine/
    plugins/
      redmine_xyz/
  redmine-qa-automation/
```

Avoid:

```
redmine/plugins/redmine_xyz/redmine-qa-automation/
```

The QA project should be independent so you can test many plugins without mixing QA files into plugin code.
