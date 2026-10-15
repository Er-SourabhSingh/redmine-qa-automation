# Testcase Management Plugin + CI Automation — Setup Guide

How the plugin and its optional CI companion tool get handed to a customer, what they
need to set up once, and what happens automatically on every build after that.

---

## 1. What you're actually delivering — two separate pieces

### Testcase Management plugin — **required**
A normal Redmine plugin. Installs into the customer's own Redmine instance and works
completely on its own — Test Suites, Test Cases, Runs, Defect linking, Reports. No CI
integration is required to use any of it.

### `redmineflux-tcm-ci` (CLI tool) — **optional add-on**
A separate, standalone command-line tool. Runs inside the customer's own CI pipeline
(Jenkins, GitHub Actions, etc.) and submits automated test results into the plugin over
its API — nothing more than any external API client could do.

---

## 2. Customer-side setup — done once

| Step | What to do |
|---|---|
| **01** | **Install the plugin.** Standard Redmine plugin install: drop it into `plugins/`, run `bundle install` and `rake db:migrate`, restart Redmine. |
| **02** | **Build out Test Suites and Test Cases.** Normal use of the plugin's own UI — this is what the automated results will eventually attach to. |
| **03** | **Create a dedicated CI service account.** A separate login (e.g. `qa.automation`) — not a person's own account. Generate its API key once from *My account*. |
| **04** | **Grant that account the minimum permission.** `execute_testcase` only — least privilege, not an admin or a real tester's own account. |

---

## 3. Automation setup — wiring up their CI pipeline

Ready-made recipes already exist for five platforms: **Jenkins · GitHub Actions · GitLab CI ·
CircleCI · Bitbucket**. Whichever one the customer uses, the same four steps apply:

| Step | What to do |
|---|---|
| **A** | **Store the API key in the platform's secret store.** GitHub Secrets, Jenkins Credentials, GitLab masked Variables, etc. — never hardcoded, never in a URL. |
| **B** | **Set four plain config values.** `TCM_BASE_URL`, `TCM_PROJECT_ID`, `TCM_ENV`, `TCM_RUN_ID` — not secret, just pipeline variables. |
| **C** | **Write a mapping file, once.** A small JSON file: "this automated test name = this TCM test case ID." Specific to their own test suite. |
| **D** | **Copy the ready-made pipeline template.** Point its test command at their own test suite. Everything else in the template stays as-is. |

---

## 4. How to use it — real commands, step by step

This is exactly what was run and verified live against a real local instance (not simulated).

### 4.1 Install the CLI

```bash
python -m venv .venv
.venv/bin/pip install -e .                     # installs the `redmineflux-tcm` command
```

### 4.2 Run the real test suite, producing a JUnit report

```bash
python -m pytest my-tests/ --junitxml=report.xml
```

Any test runner that can emit JUnit XML works — pytest, JUnit itself, Jest with a JUnit
reporter, etc. The CLI only ever reads the standard JUnit XML format, never the runner directly.

### 4.3 Write the mapping file (once per project)

A small JSON file connecting automated test names to TCM test cases:

```json
{
  "project_id": 1,
  "run_default": 5,
  "environment_default": "CI",
  "defect_tracker_id": 1,
  "cases": {
    "test_login_valid": {
      "subject": "Login with valid credentials",
      "testcase_id": 1,
      "testsuite_id": 1
    },
    "test_apply_discount_code": {
      "subject": "Apply valid discount code at checkout",
      "testcase_id": 19,
      "testsuite_id": 2
    }
  }
}
```

### 4.4 Submit the results

```bash
export TCM_API_KEY="<the service account's API key>"

redmineflux-tcm --base-url http://redmine.example.com submit \
  --junit report.xml \
  --mapping tcm-mapping.json \
  --run 5 \
  --env "CI" \
  --project 1 \
  --output json
```

### 4.5 Real output from an actual run (7 tests: 4 passed, 2 failed, 1 skipped)

```
Parsed 7 JUnit testcases: 7 mapped, 0 unmatched.
Connected as user id=1
created defect #320: [CI] Failed: TC-Reports_-_Export-3
bulk_create: run=5 suite=1 env=CI results=1
{"status": "success", "counts": {"passed": 4, "failed": 2, "skipped": 1, "unmatched": 0}}
```

Each failed test produced its own real Bug ticket automatically, with the actual
assertion error and failing code written straight into the ticket description — for
example:

> **Bug #320: "[CI] Failed: TC-Reports_-_Export-3"**
> *CI: failed — AssertionError: SAVE10 discount was not applied at checkout, assert
> 100.0 == 90.0* — plus the exact failing test source and a link back to its test case.

No one opened Redmine to create that ticket.

---

## 5. How it works internally

### The two real API calls behind it

| Call | What it does |
|---|---|
| `POST /issues.json` | Standard Redmine issue-creation API — used to auto-create a Bug for each failed test, *before* results are submitted. |
| `POST /testcase_status_results/bulk_create.json` | The plugin's own endpoint. Takes one test suite's worth of results in one call and records them against the Run, exactly like the "Add Result" form. |

### What the CLI actually does, in order

1. Parses the JUnit XML report into individual pass/fail/skip rows.
2. Matches each row to a test case using the mapping file (by test name).
3. For every **failed** row: calls `POST /issues.json` to create a real Bug, titled
   `[CI] Failed: <test case subject>`, with the assertion error and source snippet as
   the description.
4. Groups the remaining results by test *suite* (the bulk endpoint takes one suite per
   call) and calls `bulk_create.json` once per suite.
5. Prints a JSON summary and exits with a specific code so the CI job itself knows
   whether to go green or red.

### The exit-code contract (what the CI pipeline checks)

| Code | Meaning |
|---|---|
| `0` | OK — everything submitted (unmatched tests are a warning, not a failure, unless `--strict` is passed) |
| `1` | Submit failed — the plugin rejected something (bad environment, run/issue mismatch, etc.) |
| `2` | Usage error — bad command-line arguments |
| `3` | Connection error — couldn't reach the Redmine instance at all |
| `4` | Unmatched tests, in `--strict` mode |
| `10` | Feature unavailable — a Phase 2 call made against a server that doesn't have it yet |

### Validation that's already built in (not something to work around)

- A result submitted with an environment name that isn't actually configured on that
  Run is rejected outright (`"Invalid environment for Issue ID …"`).
- A result for a test case that isn't actually part of that Run is rejected outright
  (`"Issue ID … is not associated with run …"`).

Both are the plugin correctly protecting real data — not bugs in the CI tool. A clean
setup (steps 2–3 above done properly) never hits either.

### Phase 1 vs Phase 2, at a mechanical level

- **Phase 1** (what's described above): the Run already exists; the CLI only calls
  `bulk_create.json`.
- **Phase 2** (not released yet): the CLI would additionally call
  `POST /testcase_ci/bootstrap_run.json` *first*, to create the Run (and any missing
  Test Suites) in one shot — then `POST /testcase_ci/ingest_results.json` instead of
  `bulk_create.json`, which also auto-creates defects server-side instead of the CLI
  doing it client-side. The server code for both already exists but is still in peer
  review, not an official release.

---

## 6. What happens automatically, on every build

```
Developer pushes code
        │
        ▼
CI runs the real test suite
        │
        ▼
CLI reads the report + mapping file
        │
        ▼
Submits into the plugin
        │
   ┌────┴────┐
   ▼         ▼
Passed /   Failed
Skipped    tests
```

- **Passed / Skipped tests** — result recorded against the Run, shows up in the Run page
  exactly as if a person clicked "Add Result" themselves.
- **Failed tests** — same, *plus* a Bug ticket is created and linked automatically, with
  the real error message and failing code included — no one opened Redmine.

---

## 7. One thing to get right: which phase to ship

| | Phase 1 — **ship this today** | Phase 2 — **not released yet** |
|---|---|---|
| **How it works** | A Run is created once, by hand, in the plugin's own UI. CI only fills in results on every build after that. | CI creates its own Run automatically — zero manual steps. |
| **Status** | Fully working against the shipped plugin right now. | Server code already exists, but it's still in peer review, not an official release. Hold off until it ships. |

---

## Reference

Two ready-made, customer-facing documents already exist and don't need to be rewritten:

- **`docs/AUTOMATION-FOR-QA.html`** — non-technical, click-by-click guide for QA
- **`docs/AUTOMATION-CICD-SETUP.html`** — deeper technical setup guide for whoever owns the CI pipeline

Both live in the `redmineflux-tcm-ci` repo, alongside `CI-RECIPES.md` (all five platforms
side-by-side).
