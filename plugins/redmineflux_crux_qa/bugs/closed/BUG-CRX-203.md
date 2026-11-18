# Bug Report Template

- Bug ID: BUG-CRX-203
- Production Redmine Issue ID: #128886 (reported 2026-11-17, linked to Test Case #120493 / Run #607 / Environment "Window 11 + Chrome", marked Failed, assigned to Prashant Chaurasia)
- Title: Agile Board Agent's global-board card move resolves the wrong target status ("new" instead of "In progress")
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux
- Plugin version: 0.98.0
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-17

## Steps to reproduce

1. Log in as `admin`, open Ask Crux pinned to the **Agile Board Agent** (Scrum Agent), with project context
   already established this chat (Crux Scrum Agent Test Project, id=4).
2. Send: "On the global board, move card #15 to the 'In progress' column."

## Expected result

- The correct `redmineflux_agile_global_move_issue` tool call resolves "In progress" to its real status id
  — confirmed via `redmineflux_core_list_statuses`: `id=3: In progress` (distinct from `id=2: new`). The
  confirm card should show `Status: In progress`.

## Actual result

- The agent correctly identified and called the right tool (`Agile Global Move Issue` — matching
  `global_move_issue`, the global-board-specific variant, not the plain project `move_issue`), and the
  confirm card rendered genuinely (clickable Confirm/Cancel). But the resolved field is wrong:
  `Issue: 15`, `Status: new` — "new" is status id 2, a completely different, unrelated status from the
  "In progress" (id 3) explicitly named in the request. Cancelled before confirming (never executed) —
  native-verified via chat's own "Cancelled." acknowledgment, and issue #15's real status was left
  untouched.
- This is the same wrong-column/wrong-status-resolution failure class as the historical BUG-CRX-031 (closed/
  fixed on the plain project-board `move_issue` path) — but on the global-board variant specifically, a
  different tool/trigger path that BUG-CRX-031's own fix verification never covered.

## Evidence

### Screenshot

<!-- Not captured — found near end of session; text evidence below is from the live DOM, verbatim. -->

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-203/retest-yyyy-mm-dd-pass.png)

### Console / log

- Chat trace (verbatim): *"I'll do this (Agile Global Move Issue) — confirm?"* followed by a confirm card
  table: `Issue | 15` / `Status | new`.
- Real status list (`redmineflux_core_list_statuses`): `id=2: new`, `id=3: In progress`, `id=4: QA`,
  `id=1: Waiting for Customer Response`, `id=5: Done (closed)` — confirms "In progress" and "new" are two
  genuinely distinct, non-adjacent statuses, ruling out an off-by-one/adjacent-value coincidence.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — same general failure shape as the closed BUG-CRX-031
  (wrong-column resolution on the plain project-board `move_issue`), but that fix's own verification
  (TC-CRX-375, this suite) was scoped to the plain project board only. This reproduces the identical shape
  on the global-board move variant (`global_move_issue`), a path BUG-CRX-031's fix never covered — filed
  as a new bug per this repo's standing convention for recurrences on an uncovered trigger path.

## Retest — 2026-11-18, CONFIRMED FIXED

- Build: `redmineflux-crux-core` pulled to `747af39` (CRC-117 1.12.0), MCP server pulled to `01dac41`
  (RMCP-044 1.0.7), Agile Board plugin pulled to `e84c651` (includes `ef8f72c` "find a card by its number
  on PostgreSQL (Crux BUG-CRX-203)"), containers rebuilt/force-recreated, redmine restarted with plugin
  migration.
- Repeated the exact original repro: "On the global board, move card #15 to the 'In progress' column." →
  confirm card now correctly shows `Status: In progress` (the named status, not a wrong guess). Confirmed;
  native-verified via `get_issue(15)` — genuinely moved to "In progress".
- Also regression-checked the my-page-move variant (this bug's 2nd confirmed repro): "On my page board,
  move card #3 to the 'In progress' column." → also correctly resolved `Status: In progress`, confirmed,
  native-verified, then reverted back to its original status.
- Per the dev's commit message (CRC-117): `field_check.py` now makes the status the user names win,
  matching a `status_name` exactly, and never proposes an unknown name or id; `agile-scrum.md` updated to
  pass `status_name`.
- Production issue #128886 synced: status In QA → Done, % done → 100, retest-summary comment added.
- **Status: Closed — CONFIRMED FIXED on all 3 move-tool variants (project, global, my-page).**
