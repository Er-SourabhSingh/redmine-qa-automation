# Memory

Persistent rules for all Redmine plugin QA runs.

## Execution Rules

- Always load credentials and base URL from `QA_CREDENTIALS_FORGE.md` or `QA_CREDENTIALS_LOCAL.md`.
- Do not hardcode users, passwords, or environment values.
- Stop execution if authentication fails.
- Capture screenshot, logs, and network evidence on failure.

## Bug Quality Rules

- Check duplicates before creating a new bug.
- Create one bug per unique root cause.
- Keep bug titles in sentence case.
- Include clear expected vs actual behavior.

## Structure Rules

- Keep this QA repository separate from plugin source code.
- Keep plugin-specific test assets under `plugins/<plugin_name>/`.
- Keep shared prompt templates under `prompts/claude/`.

## Artifact Paths

- Screenshots: `screenshots/`
- Logs: `logs/`
- Reports: `reports/`
- Test outputs: `test-results/`
- Bug files: `bugs/`
