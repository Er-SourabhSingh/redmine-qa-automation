# Bug Report Template

- Bug ID: BUG-CRX-209
- Production Redmine Issue ID: <!-- not yet reported -->
- Title: Alert Triage proposes raising an issue's priority to id 2, which does not correspond to any real priority on this instance (real ids are 6/7/8/9)
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Alert Triage agent)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-653 (deferred, deprioritized per earlier user instruction):

1. Native ground truth: `redmineflux_core_list_priorities()` → this instance's only 4 real priorities are
   `id=6: low`, `id=7: medium`, `id=8: high`, `id=9: immediate`. No priority with id 2 exists anywhere.
2. Alert Triage pinned, fresh chat: "Alert Triage, in the Crux Zero Activity QA project, users say password
   reset emails never arrive."
3. The agent genuinely searched and found a real semantic duplicate — issue #10, "Password reset email not
   being sent on valid request" (Crux QA Agent Test Project, priority currently `low`) — correctly
   recognizing this as the same real problem even though it lives in a different project than the one
   named. (The duplicate-finding itself is accurate; not the defect being reported here.)
4. Confirm card: `UPDATE ISSUE`, `Change #10`, `Issue: #10`, **`Priority: 2`**, `Notes: "Users report
   password reset emails still not arriving (reported Nov 18, 2026). Problem appears ongoing."`
5. Cancelled before confirming; native-verified via `get_issue(10)` — priority still `low`, `updated_on`
   untouched, no write occurred.

## Expected result

Per the persona file's own instruction (`agents/alert-triage.md`, step 3: "Map it to the project's real
priorities (`list_priorities`)"), any severity-to-priority mapping must resolve to one of this instance's
4 genuinely real priority ids (6/7/8/9) — never a value that doesn't exist in the real enumeration.

## Actual result

- The confirm card proposed `Priority: 2` — a value that matches none of the 4 real priority ids on this
  instance. It appears to be a classic-Redmine-default-scheme guess (where 2 would commonly mean "Normal"
  in an unmodified install) rather than a value genuinely read from this instance's own
  `list_priorities` output.
- No write occurred (cancelled before confirming) — this is a proposal-stage defect, not a data-integrity
  one, but confirming it as-is would have written a nonexistent/meaningless priority value to a real issue.

## Evidence

### Console / log

- Confirm card (verbatim): `Issue: #10`, `Priority: 2`, `Notes: "Users report password reset emails still
  not arriving (reported Nov 18, 2026). Problem appears ongoing."`
- Native ground truth: `redmineflux_core_list_priorities()` → `id=6: low, id=7: medium, id=8: high,
  id=9: immediate` — no id 2 exists.
- Native verification after cancel: `redmineflux_core_get_issue(10)` → `Priority: low`, `Updated:
  2026-10-27T10:05:13Z` (unchanged) — no write occurred.

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Same wrong-priority-id-resolution class already confirmed on other domain agents
  this QA cycle (closed BUG-CRX-102, open BUG-CRX-204 — both on the Agile Board Agent) — but this is the
  first instance found on the Alert Triage agent specifically, a trigger path neither of those findings'
  scope covered.
