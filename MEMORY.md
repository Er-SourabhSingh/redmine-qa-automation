# Memory — Global QA Rules

Persistent rules that apply to ALL plugin test runs. Plugin-specific observations go in the plugin's memory file — `plugins/<name>/docs/<PREFIX>_MEMORY.md` for plugins scaffolded per `CLAUDE.md` §2b, or `docs/memory.md` for older plugins.

---

## Execution Rules

- Always load credentials and base URL from `QA_CREDENTIALS_FORGE.md` or `QA_CREDENTIALS_LOCAL.md`.
- Never hardcode users, passwords, or environment values.
- Stop execution immediately if authentication fails.
- Capture screenshot, logs, and network evidence on every bug found.

## Email Testing Preconditions

- Before testing ANY email flow (outgoing notifications, Helpdesk welcome emails, reply notifications, test emails) on ANY environment (Forge or local), first check and correct **Administration → Settings → General → "Host name and path"** (and Protocol). Redmine embeds this value verbatim into links inside outgoing emails.
- The default is `localhost:3000`, which is wrong for almost every real target (a Forge subdomain, or a local instance on a non-3000 port like `localhost:3012`). Left unset/wrong, email links inside notifications point at the wrong host and are broken/unusable even when the email itself delivers successfully.
- This is a precondition, not a one-time fix — verify it matches the actual current domain/port at the start of every email-testing session on a given instance, since a fresh container or a new Forge sandbox always resets to the `localhost:3000` default.
- Quick check via `rails runner`: `Setting.host_name` / `Setting.protocol`. Fix via the Settings UI (`/settings?tab=general`) if it doesn't match.
- **IMAPS on the local mail server is not enabled by default** — the local Docker mail server (see `reference_docker_mail_server` memory) originally ships with `SSL_TYPE=` (blank), so only plain IMAP (port 143) listens, not IMAPS (993). Any plugin's real inbound-email poller that connects with `ssl: true` (Ruby's `Net::IMAP` and most other mail libraries default to strict cert verification) will fail with "Connection refused" on 993 until this is fixed. Fix: generate a self-signed cert (`openssl req -x509 ... -subj "//CN=mail.test.local"` — note the double leading slash to survive Git Bash/MSYS path-mangling) at the exact paths `SSL_TYPE=self-signed` expects in `local-mail-server`'s `config/dms/ssl/`, set `SSL_TYPE=self-signed` in `docker-compose.yml`, recreate the mail container, then **also** install that same cert into the consuming Redmine container's OS trust store (`docker cp` + `update-ca-certificates`) so the plugin's own strict cert verification passes. If testing via Roundcube webmail too, its `ROUNDCUBEMAIL_DEFAULT_HOST`/`_PORT` need to point at `ssl://mail`/`993` (not plaintext 143, which Dovecot will refuse once `ssl = required` is set), and its `config.inc.php` needs `$config['imap_conn_options']` / `$config['smtp_conn_options']` with `verify_peer`/`verify_peer_name: false` appended, since Roundcube doesn't trust an arbitrary self-signed cert by default either. All of this lives in the mail server's own container state (`C:\local-mail-server\`), not in any plugin's QA repo, and does not survive that container being recreated from a clean volume.

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

- **Never write test cases without first reading the plugin's requirements, features-list, and user-guide files** (`docs/<PREFIX>_REQUIREMENTS.md` / `_FEATURES_LIST.md` / `_USER_GUIDE.md`, or the lowercase equivalents for older plugins).
- If the requirements file is missing → stop and ask the user to provide it before continuing.
- If the features-list file is missing → stop and ask the user to provide it before continuing.
- If the user-guide file is missing → stop and ask the user to provide it before continuing.
- If multiple files are missing → ask for all of them in one message. Do not proceed until all are supplied.
- Never infer or guess plugin behavior from the plugin name alone.

## Structure Rules

- Keep this QA repository separate from plugin source code.
- All plugin test assets live under `plugins/<plugin-name>/`.
- Global prompt templates live under `prompts/claude/`.
- Follow `CLAUDE.md` for folder structure and file formats.

## Regression Rules

- When a bug is retested and confirmed FIXED, run regression on its affected feature/suite (not just the one TC) before moving it to `bugs/closed/`. Scope depends on bug severity — see `SENIOR_QA_STANDARDS.md` §26.
- When `bugs/open/` becomes empty (all bugs for the cycle fixed), run a full final regression across **every** test suite for the plugin — not just the ones touched by fixes — before marking the plugin `Complete` in `STATUS.md`. See `SENIOR_QA_STANDARDS.md` §27.
- For both, run the plugin's `automation/tests/` specs first where coverage exists, then manually re-run any TC not yet automated.
- A `NEW FAIL` found during either regression gets its own new bug — never reuse a closed bug ID, and the gate it was feeding (bug closure / `Complete` status) is not satisfied until it's resolved.

## Automation Rules (Playwright + TypeScript)

- Automation lives per plugin under `plugins/<plugin-name>/automation/` — self-contained, not shared across plugins.
- Only automate a test case after it has a confirmed manual PASS. The automation suite re-verifies known-good behavior; it is not a discovery tool.
- One spec file per test suite, same base name as `testcases/<suite-name>.md`.
- Every automated test title must include the TC ID(s) it covers, for traceability back to the testcase file.
- Follow Page Object Model: no raw selectors inside spec files — only inside page object classes (`<Name>Page.ts`) living in `automation/tests/` alongside the specs. Reuse an existing page object in that plugin's `automation/tests/` before writing a new one.
- File naming in `automation/tests/`: `<suite-name>.spec.ts` for specs, `<Name>Page.ts` for page objects, `<name>.setup.ts` for one-time infra (e.g. `auth.setup.ts`).
- Load credentials and base URL only through `automation/utilities/env.ts`, sourced from `QA_CREDENTIALS_FORGE.md` / `QA_CREDENTIALS_LOCAL.md`. Never hardcode them in a spec or page object.
- Use fixtures (`automation/utilities/`) for login/session setup instead of repeating login steps in every test.
- `automation/testdata/` and `automation/uploads/` hold checked-in fixtures; `automation/downloads/` and `automation/screenshots/` hold run-generated artifacts (gitignored).
- **Test data registry:** maintain one real `.xlsx` per environment in `automation/testdata/<PREFIX>_TESTDATA_<ENV>.xlsx` (e.g. `HELPDESK_TESTDATA_LOCAL.xlsx`) tracking what test entities currently exist/are deleted on that specific server — see `CLAUDE.md` §13a. Check it before creating a fixture; update it immediately after creating/changing/deleting one. Never hardcode a ticket number in an expected result — track fixture tickets by description instead, and re-verify the current # each session.
- A regression bug found by the automation suite follows the same bug-filing rules as a manually found one (duplicate check, template, screenshot, index update) — just note it was found via automation.
