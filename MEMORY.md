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

## Structure Rules

- Keep this QA repository separate from plugin source code.
- All plugin test assets live under `plugins/<plugin-name>/`.
- Global prompt templates live under `prompts/claude/`.
- Follow `CLAUDE.md` for folder structure and file formats.
