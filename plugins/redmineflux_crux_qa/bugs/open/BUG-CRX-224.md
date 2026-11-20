# Bug Report Template

- Bug ID: BUG-CRX-224
- Production Redmine Issue ID: #129167
- Title: Improver's "create subtasks" confirm resolves a stale, unrelated project (#9) instead of the parent issue's real project (#1), causing a genuine cross-project "Parent task is invalid" rejection on all steps
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_crux (Improver Agent)
- Plugin version: crux-core 1.17.0 (CRC-123)
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-20

## Steps to reproduce

1. Found while retesting BUG-CRX-222 (CRC-123 fix) on the rebuilt crux-core 1.17.0: pin Improver, ask "Break issue
   #159 down into subtasks." in a fresh chat (issue #159 lives in project #1, "Crux PM Agent Test Project").
2. Reply "Yes, create them." to the proposal, then confirm the resulting 3-step "create subtasks" card.
3. This was the 3rd fresh-chat repetition of the identical request/confirm sequence (2 prior fresh-chat attempts
   both resolved project #1 correctly and succeeded "Created 3 of 3").

## Expected result

- Every step's `project_id` should resolve to #1 — the real project of the parent issue (#159) the user named —
  regardless of which attempt number this is or what happened in unrelated earlier chats.

## Actual result

- All 3 steps failed: `Validation error: Parent task is invalid`. Server logs (Redmine `Started POST
  "/issues.json"`) show the actual payload sent was `{"issue"=>{"project_id"=>"9", "subject"=>"...",
  "parent_issue_id"=>159}}` — `project_id` was the **correct type** (a string, "9"), ruling out a recurrence of
  BUG-CRX-222's Pydantic type bug, but the **wrong value**: project #9 is a real, unrelated, pre-existing fixture
  project ("Crux Retest 111 Round4", id=9) from an earlier, different test round — not project #1, where issue
  #159 and its new subtasks actually belong. Redmine's own `Issue#validate_issue` rejected the cross-project
  parent assignment (`valid_parent_project?` fails because parent #159 is in project #1, not #9), which is why
  the failure is honest (no silent wrong-project write landed) rather than a silent misfire.
- Same general shape as the already-documented "wrong-project-resolution family" (BUG-CRX-080/093/101/133/140/187
  — a later-turn write re-deriving the project instead of using the one the named issue/record actually belongs
  to), but the **first instance on the Improver agent's subtask-creation path** specifically; `_duplicates.md`'s
  one-bug-per-domain rule means this is not folded into any of those.
- Two prior fresh-chat attempts of the exact same request, same session, same day (before and after this one)
  both correctly resolved `project_id="1"` and succeeded cleanly ("Created 3 of 3" both times) — non-deterministic,
  consistent with the rest of this family's history.

## Evidence

### Console / log

- Session `ses-585`. Redmine request ids `2dd6ed39…`, `4d01626a…`, `878315eb…` — all three `POST /issues.json`
  calls carried `project_id=>"9"` and all three returned `422 Unprocessable Content`. Confirmed via
  `redmineflux_core_get_project(project_id=9)` that project 9 is real ("Crux Retest 111 Round4") but has no
  relation to issue #159 or this test's "Crux PM Agent Test Project" (#1).
- Contrast: sessions `ses-583` and `ses-584` (same identical request, same day) both sent `project_id=>"1"` and
  both succeeded ("Created 3 of 3" each), confirming BUG-CRX-222's own fix (CRC-123) holds — this is a distinct,
  new defect on project resolution, not a recurrence of the type-coercion bug.

## Duplicate check

- Duplicate found: No — first instance of the wrong-project-resolution family (BUG-CRX-080/093/101/133/140/187)
  on the Improver agent's subtask-creation path.
- Existing bug reference (related class, not duplicate): BUG-CRX-080, BUG-CRX-093, BUG-CRX-101, BUG-CRX-133,
  BUG-CRX-140, BUG-CRX-187
