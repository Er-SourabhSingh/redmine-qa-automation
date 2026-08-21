# Memory — Global QA Rules

Persistent rules that apply to ALL plugin test runs. Plugin-specific observations go in `plugins/<name>/docs/memory.md`.

---

## Execution Rules

- Always load credentials and base URL from `QA_CREDENTIALS_FORGE.md` or `QA_CREDENTIALS_LOCAL.md`.
- Never hardcode users, passwords, or environment values.
- Stop execution immediately if authentication fails.
- Capture screenshot, logs, and network evidence on every bug found.

## Bug Quality Rules

- Check `bugs/_duplicates.md` and `bugs/_index.md` before creating any new bug.
- One bug per unique root cause.
- Bug titles must be in sentence case.
- Always include expected vs actual result.
- Always include the user role that triggered the bug.

## Screenshot Rules

- Take screenshots only when a bug is found. Never for passing tests.
- Save under `plugins/<plugin-name>/screenshots/<BUG-ID>/`.

## Report Rules

- `tc-report.html` and `defects-summary.html` are auto-generated at end of each run.
- `final-bug-report.md` is auto-generated from `bugs/open/`.
- `final-bug-report.pdf` is generated ONLY when user explicitly asks.

## Test Case Design Rules

- **Never write test cases without first reading `docs/requirements.md`, `docs/features-list.md`, and `docs/user-guide.md`.**
- If `docs/requirements.md` is missing → stop and ask the user to provide it before continuing.
- If `docs/features-list.md` is missing → stop and ask the user to provide it before continuing.
- If `docs/user-guide.md` is missing → stop and ask the user to provide it before continuing.
- If multiple files are missing → ask for all of them in one message. Do not proceed until all are supplied.
- Never infer or guess plugin behavior from the plugin name alone.

## Structure Rules

- Keep this QA repository separate from plugin source code.
- All plugin test assets live under `plugins/<plugin-name>/`.
- Global prompt templates live under `prompts/claude/`.
- Follow `CLAUDE.md` for folder structure and file formats.

## Automation Rules (Playwright + TypeScript)

- Automation lives per plugin under `plugins/<plugin-name>/automation/` — self-contained, not shared across plugins.
- Only automate a test case after it has a confirmed manual PASS. The automation suite re-verifies known-good behavior; it is not a discovery tool.
- One spec file per test suite, same base name as `testcases/<suite-name>.md`.
- Every automated test title must include the TC ID(s) it covers, for traceability back to the testcase file.
- Follow Page Object Model: no raw selectors inside spec files — only inside `automation/pages/*.ts`. Reuse an existing page object in that plugin's `automation/pages/` before writing a new one.
- Load credentials and base URL only through `automation/utils/env.ts`, sourced from `QA_CREDENTIALS_FORGE.md` / `QA_CREDENTIALS_LOCAL.md`. Never hardcode them in a spec or page object.
- Use fixtures (`automation/fixtures/`) for login/session setup instead of repeating login steps in every test.
- A regression bug found by the automation suite follows the same bug-filing rules as a manually found one (duplicate check, template, screenshot, index update) — just note it was found via automation.
