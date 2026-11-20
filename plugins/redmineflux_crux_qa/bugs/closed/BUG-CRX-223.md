# Bug Report Template

- Bug ID: BUG-CRX-223
- Production Redmine Issue ID: #129143
- Title: "Close Run" renders a genuine server-side rejection ("Cannot close run... no execution results have been recorded") with a misleading ✓ checkmark prefix — same already-documented class as BUG-CRX-018/040/054/067/082, new trigger path
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_crux (QA/Testcase Agent)
- Plugin version: crux-core 1.16.0, mcp 1.0.13
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-19

## Steps to reproduce

1. In the Crux QA Agent Test Project, find or create a Run that has zero suites/testcase groups attached
   (e.g. Run #3 "Sprint 2 Targeted Test" on this instance — 0 suites, 0 testcase groups).
2. Ask the Testcase Agent: "can you close the '<that run's name>' run?"
3. Confirm the `Testcases Management Close Run` card.

## Expected result

- Per the already-closed BUG-CRX-018/040/054/067/082 defect class, any genuine failure message must render
  honestly — no ✓ checkmark prefix, since that symbol is reserved for real success in this UI's own
  convention.

## Actual result

- `✓ Cannot close run #3: the server rejected the close request. This usually means no execution results
  have been recorded. Record at least one result before closing.` — the refusal itself is correct and
  honest content (the run genuinely has 0 suites/groups, confirmed via `get_run`), but it is prefixed with a
  success checkmark, identical in shape to the already-fixed defect class.
- Contrast: the identical action on a run that DOES have recorded results (Run #7 "Bulk Status Fixture Run",
  2 passed testcases) succeeded cleanly and closed genuinely (native-verified `Closed: True` after), so this
  is purely a rendering/labeling issue on the refusal path, not a functional regression in the close action
  itself.

## Evidence

### Console / log

- Chat session `ses-568`. Native-verify: `get_run(run_id=3)` still showed `Closed: False` after the
  misleading-✓ refusal (confirming nothing silently happened); `get_run(run_id=7)` showed `Closed: True`
  after the clean success case.

## Status: CLOSED 2026-11-20 — CONFIRMED FIXED

- Fixed by CRC-123 (crux-core 1.17.0): "cannot close run", "cannot create testcase", "cannot apply template",
  and "the server rejected the" added to the failure-marker list (a bare "rejected" stayed out since it's a
  timesheet's own success text).
- Retested on the rebuilt stack (crux-core 1.17.0): Testcase Agent, "Can you close the 'Sprint 2 Targeted
  Test' run?" (Run #3, still 0 suites/groups). Confirm card correctly resolved Run 3; on Confirm the response
  was `Cannot close run #3: the server rejected the close request...` — **no ✓ checkmark prefix**, unlike the
  original report.
- Native-verified: `get_run(run_id=3, project_identifier=crux-qa-agent-test-project)` → `Closed: False` —
  run genuinely stayed open, refusal was honest both in content and rendering.

## Duplicate check

- Duplicate found: No (new trigger path — Close Run specifically was never checked for this defect class
  before)
- Existing bug reference: same defect class as the closed BUG-CRX-018, BUG-CRX-040, BUG-CRX-054, BUG-CRX-067,
  BUG-CRX-082
