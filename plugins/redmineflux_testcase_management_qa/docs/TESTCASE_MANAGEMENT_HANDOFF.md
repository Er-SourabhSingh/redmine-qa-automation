# Handoff — Redmineflux Testcase Management

## Last Session

- Date: 2026-09-11
- Redmine Version: 7.0.0
- Environment: Docker `localhost:3010` (container `redmine-docker-700-redmine-1`, project `test-project`), plugin v7.0.0

## Completed This Session

- Investigated a customer-reported failure: "bulk update on multiple Test Cases belonging to the same Test Run consistently fails with the same error, regardless of environment or execution notes."
- **Reproduced and root-caused.** Filed `BUG-TCM-003` (High) — the bulk endpoint is routed as `.json` with `defaults: { format: 'json' }`, so Redmine core treats the browser XHR as an API request, skips session-cookie auth, and rejects it as anonymous with 401 before the plugin's own `restore_session_user_for_api` filter can run. Verified the failure is independent of environment (`fdsgsdf`, `chrome`), status (`Passed`, `Skipped`), notes (present/absent), and selection size.
- Proved the endpoint's own logic is sound: the identical payload sent with HTTP Basic (API) auth returns `201 Created`. Only the browser-session path is broken.
- Proved the contrast with single-test-case **Add Result** (posts to a non-`.json` route) — saves correctly as `admin` in the same session, seconds apart.
- Filed `BUG-TCM-004` (Low) — the same modal renders `Apply to <strong>2</strong> testcase(s).` with raw HTML tags visible, because a markup-bearing locale string is rendered through escaping `<%= %>`.
- Updated `bugs/_index.md` (added the missing `Production Redmine Issue ID` column per `CLAUDE.md` §3) and the plugin memory file.

## In Progress

- Nothing mid-flight.

## Blockers

- **`TESTCASE_MANAGEMENT_REQUIREMENTS.md` and `TESTCASE_MANAGEMENT_USER_GUIDE.md` are still empty stubs.** Per `CLAUDE.md` §11 / root `MEMORY.md`, a test case suite file cannot be written until both exist, so no `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` suite was created for the Runs & Results / bulk-update feature this session — only the bug reports. Ask the user to supply both documents before writing that suite.
- ~~CSV fixtures still need to be pasted in~~ — resolved: the 17 fixtures were already present in `automation/testdata/csv-test-data/` and were used for the 2026-09-11 regression. The TC file's Evidence Map now points at their real paths.

## Next Session Start Point

- BUG-TCM-003 is the priority — it makes the bulk-update feature unusable from the UI for every role, and its `.json`-route root cause probably affects four sibling routes.
- Gather `TESTCASE_MANAGEMENT_REQUIREMENTS.md` / `TESTCASE_MANAGEMENT_USER_GUIDE.md`, then write `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` covering Runs & Results: single result add, bulk result update, environment assignment, defect-required statuses, and run state transitions. The bulk-update TC already has its live evidence captured in BUG-TCM-003.
- Check whether `routes.rb:163, 167, 168, 175` (`create.json`, both `bulk_delete.json` routes, `bulk_testcase_create.json`) carry the same `.json`-format auth defect as BUG-TCM-003 — these are bulk delete of test cases, bulk delete of test runs, and bulk test case create, all reachable from the UI.
- **Both bugs are now on production `ztflux`**: BUG-TCM-003 = **#120544** (Priority High), BUG-TCM-004 = **#120546** (Priority Low), both assigned to **Sheetal Sharma (id 397)**, created 2026-09-11 with explicit user approval. Reported without Test Run / Environment / Test Case ID at the user's instruction.
- **Follow-ups still outstanding on those two production issues:**
  1. The four `Defect *` custom fields were auto-filled with project defaults on both issues (Defect Type: Functional, **Defect Severity: Medium-severity**, Defect priority: Medium, System Component: Development - Web Application - Frontend). The mapped values should be **High-severity / High** for #120544 and **Low-severity / Low** for #120546. This API key cannot read custom-field definitions (`list_custom_fields` → permission denied), so the IDs were unavailable at creation time — set them in the UI, or supply the field IDs and they can be patched.
  2. **#120544 has a corrupt attachment** (`BUG-TCM-003-evidence.jpg`, attachment id 93550) — the MCP `upload_file` base64 channel mangled it in transit (uploaded 4046 bytes vs 4019 on disk; downloading it back gives "broken data stream"). It should be deleted and the screenshot attached manually from `screenshots/BUG-TCM-003/bulk-update-stuck-saving-401.png`. The PDF on that issue (`BUG-TCM-003.pdf`, 8440 bytes) is byte-exact and fine. All three attachments on #120546 are byte-exact and valid.

## Open Bugs Found

- BUG-TCM-003 (High) — Bulk update result always fails with 401; bulk endpoint rejects the logged-in browser session.
- BUG-TCM-004 (Low) — Bulk Update Result modal shows raw `<strong>` tags in its "Apply to N testcase(s)" line.

## Closed This Session

- BUG-TCM-001 (Medium) — CSV import padded-header value drop. Retest PASS 2026-09-11 (case #1014 before → #1023 after).
- BUG-TCM-002 (Medium) — CSV import duplicate-header silent discard. Retest PASS 2026-09-11 (explicit warning now shown on the mapping step).
- Neither had a Production Redmine Issue ID, so no production status sync was required on close (`CLAUDE.md` §5).

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-02 | (fill from environment) | Docker `localhost:3010` (project `test-project`) | External session, folded in by Claude | CSV Import feature: 16 TCs (14 PASS, 2 FAIL). 2 bugs filed (BUG-TCM-001, BUG-TCM-002). Not yet reproduced in-session. |
| 2026-09-11 | 7.0.0 | Docker `localhost:3010` (project `test-project`, run #4 `reyer`) | Claude (Playwright MCP, admin) | Targeted investigation of customer-reported bulk-update failure in a test run. Reproduced across 2 environments, 2 statuses, with and without notes. 2 bugs filed: BUG-TCM-003 (High, root-caused to `.json` route bypassing session auth) and BUG-TCM-004 (Low, escaped HTML in modal label). Single Add Result confirmed working. |
| 2026-09-11 | 7.0.0 | production `ztflux` (flux.zehntech.com) | Claude (redmineflux MCP, approved write) | Reported BUG-TCM-003 as **#120544** (High) and BUG-TCM-004 as **#120546** (Low), both assigned to Sheetal Sharma, no Test Run / Environment / Test Case ID per user instruction. #120546 carries PDF + MD + screenshot, all byte-exact. #120544's screenshot attachment uploaded corrupt and needs replacing; its PDF is fine. Defect * custom fields left at project defaults on both. |
| 2026-09-11 | 7.0.0 | Docker `localhost:3010` (project `test-project`) | Claude (Playwright MCP, admin) | Retest + regression after BUG-TCM-001 / BUG-TCM-002 fix. Both retests PASS on their original fixtures (#1023 padded-header now correct; duplicate-header warning now shown before confirm). Full CSV Import suite regression per §26: 17 fixtures / 16 TCs (TC-TCM-001 … TC-TCM-016) re-run, **all PASS, zero new failures**. Both bugs moved to `bugs/closed/`. |
