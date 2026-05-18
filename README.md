# Redmine QA Automation

This repository is for testing Redmine plugins with AI agents (Claude + MCP), reporting bugs, and storing evidence.

## Correct placement of this folder

Recommended:

```
C:\workspace\
  redmine\
    plugins\
      redmine_xyz\
  redmine-qa-automation\
```

Do not put the full `redmine-qa-automation` folder inside a single plugin folder like `redmine/plugins/redmine_xyz/`.

If you keep this folder near Redmine, place it as a sibling of `plugins`:

```
redmine\
  plugins\
    redmine_xyz\
  redmine-qa-automation\
```

## Required docs for agent-driven testing

- `SENIOR_QA_STANDARDS.md`
- `QA_CREDENTIALS_FORGE.md`
- `QA_CREDENTIALS_LOCAL.md`
- `HANDOFF.md`
- `MEMORY.md`
- `TEST_CASES.md`
- `bugs/BUG_TEMPLATE.md`
- `bugs/_index.md`
- `bugs/_duplicates.md`
- `prompts/claude/PLUGIN_TEST_PROMPT_TEMPLATE.md`

## Current structure

See `docs/FOLDER_STRUCTURE.md` for the full structure and naming conventions.
