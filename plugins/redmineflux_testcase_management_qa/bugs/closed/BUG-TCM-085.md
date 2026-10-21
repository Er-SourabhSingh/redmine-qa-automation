# BUG-TCM-085

- Bug ID: BUG-TCM-085
- Production Redmine Issue ID: *(not yet reported — pending user approval)*
- Title: rftc-042 TCM Testing Harness's own stated deliverable (`harness/run.py` end-to-end execution
  producing JUnit + exit code) has never been successfully run, despite the ticket showing 90% done /
  "In QA"
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management (companion repo: `redmineflux-tcm-ci`)
- Plugin version: master (post-7.1.0, pre-7.2.0)
- Environment: `C:\redmine v6\plugins\redmineflux-tcm-ci\harness\`
- User role: N/A (source-tree / CI-tooling finding, not a live-UI defect)
- Date: 2026-10-21

## Summary

Production ticket #121885 (rftc-042, "TCM Testing Harness") is at 90% done / status "In QA." A full
reconnaissance of the harness's actual deliverable found it genuinely exists and is substantially
well-built — `redmineflux-tcm-ci/harness/` contains a real, non-trivial implementation of every layer
the strategy doc describes (api, cli, browser, load, chaos, security, dogfood), a dated and honest
`feature-matrix.yml`, and a documented flake-quarantine mechanism (`flaky.yml`). Several of its
components have genuinely been unit-tested by the dev team (fuzz/property tests under
`harness/suites/security/`, re-confirmed live in this QA session: 17/18 passing, see test case
RFTC042-4) and secret/dependency scans have been run and triaged (gitleaks, pip-audit).

However, the harness's own headline deliverable — a complete, successful invocation of
`harness/run.py` (the orchestrator that ties all layers together and produces
`harness/reports/{junit.xml,report.json,dashboard.html}`, which the README documents as the **primary**
pass/fail verdict) — has **never been demonstrated to succeed, by anyone, on any machine**.
`harness/reports/` does not exist in this environment at all.

## Steps to reproduce

1. `ls C:\redmine v6\plugins\redmineflux-tcm-ci\harness\reports\` (or inside the container:
   `/usr/src/redmine/plugins/redmineflux-tcm-ci/harness/reports`).
2. Observe: the directory does not exist.
3. Attempt `python harness/run.py` per the README's own documented usage.

## Expected result

Either (a) `harness/reports/` already contains artifacts from at least one successful end-to-end run,
proving the harness's primary deliverable works as documented, matching the ticket's 90%/"In QA" status;
or (b) the ticket's status/percentage reflects that this has not yet been proven.

## Actual result

`harness/reports/` is absent. This session attempted to complete a first live run as part of verifying
this exact gap: installed the harness's lightweight dependencies (`httpx`, `pyyaml`) inside the
`redmine6-redmine-1` container, confirmed both entry points are functional
(`python3 -m client --help` and `python3 harness/run.py --help` both produce correct, well-formed usage
text — so the orchestrator itself is not broken or unimportable), then attempted
`python3 harness/run.py --layers api,cli,security --base-url http://localhost:3000`. This requires a
per-persona Redmine API key (`TCM_API_KEY` / `TCM_KEY_<LOGIN>`); minting or revealing one in this session
(via `rails runner` or the Redmine "My account" → API access key → Show link) was correctly blocked by
this sandbox's own credential-materialization safeguard, so the live run could not be completed here. This
is a session/environment boundary, not a defect in the harness code itself — but it means the gap (an
unproven end-to-end run) remains open and unverified by anyone to date.

## User role when bug was found

N/A — found via source-tree inspection + a live execution attempt, not a UI session as a specific Redmine
role.

## Suggested next step

Either:
- Have a developer (or a future QA session, supplied with a real admin/persona API key for the target
  Redmine instance) run `python harness/run.py` once, end-to-end, and commit/link the resulting
  `harness/reports/{junit.xml,report.json,dashboard.html}` as proof the deliverable works; or
- Correct the production ticket's 90%/"In QA" status to reflect that the orchestrator itself remains
  unproven, even though its individual components are real and partially unit-tested.

## Test case coverage

Found 2026-10-21 while executing `testcases/RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md` (RFTC042-7),
written to verify production ticket #121885 after a full read of its description and every referenced
document. Not an automation TC — this is an external-spec testcase file, not part of this plugin's own
`TC-TCM-xxx` suite.

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this. Distinct from
  BUG-TCM-083 (a live UI defect in the plugin itself) — this is a CI-tooling-deliverable gap in the
  separate `redmineflux-tcm-ci` companion repo, not a plugin defect.
- Note: an earlier, now-corrected draft of `RFTC-042_EXTERNAL_SPEC_TCM_TESTING_HARNESS.md` referenced an
  unfiled "BUG-TCM-084" for its own (incorrect) "harness doesn't exist at all" conclusion. That bug ID was
  never actually created as a file and is not reused — this is a distinct, corrected, narrower finding
  filed fresh as BUG-TCM-085.

## Production report

Not yet reported to production — pending explicit user approval per this repo's write-approval workflow
(`REDMINEFLUX-MCP-SETUP.md` §4).
