# Bug Report Template

- Bug ID: BUG-CRX-222
- Production Redmine Issue ID: #129142
- Title: A multi-step "create subtasks" confirm sometimes passes `project_id` as an integer instead of a string to `redmineflux_core_create_issue`, failing all steps with a Pydantic validation error; the identical request succeeds cleanly on a fresh retry
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_crux (Improver agent, shared `core_create_issue` write path)
- Plugin version: crux-core 1.16.0, mcp 1.0.13
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-19

## Steps to reproduce

1. Pin Improver, ask (fresh chat): "Break issue #159 down into subtasks." → review the proposed 3-subtask
   breakdown → ask "Yes, create those."
2. Repeat the identical request/confirm sequence in a second, separate fresh chat if the first attempt
   succeeds (non-deterministic — may need a few tries either direction).

## Expected result

- Every attempt should create the 3 proposed subtasks cleanly under issue #159, per the agent's documented
  "confirm card per subtask, nothing created until Confirm" behavior (same class as the already-passing
  TC-CRX-670 on Auto-Fixer, which uses the identical underlying `redmineflux_core_create_issue` +
  `parent_issue_id` write path).

## Actual result

- **Attempt 1:** `I'll do 3 things — confirm?` → on Confirm: `Created 0 of 3` — all 3 steps failed with the
  identical error: *"write failed: tool 'redmineflux_core_create_issue' failed: ... 1 validation error for
  redmineflux_core_create_issueArguments / project_id / Input should be a valid string [type=string_type,
  input_value=1, input_type=int]"* — the plan's own payload passed `project_id=1` (an integer) instead of a
  string, which the tool's own Pydantic schema requires. No subtasks created.
- **Attempt 2** (fresh chat, identical request): `I'll do 3 things — confirm?` → on Confirm: `✓ Created 3 of
  3` — `✓ Created #179`, `✓ Created #180`, `✓ Created #181`, all genuinely persisted under parent #159
  (native-verified via `list_issues(parent_id=159)`).
- The failure is honest (no silent false success — "Created 0 of 3" accurately reported total failure) but
  non-deterministic: the identical request/data produces a passing or failing payload depending on the run.
  Likely the same underlying "which code path builds a confirmed-plan payload" area touched by `CRC-122`
  (same release where BUG-CRX-220's non-determinism was also first observed this session) — worth checking
  whether `project_id` is sometimes taken from a raw DB integer field and sometimes from an already-stringified
  cached value, depending on which code path resolves it first.

## Evidence

### Console / log

- Attempt 1 chat: `ses-561`. Attempt 2 (clean): `ses-562`.
- Native-verify of attempt 2: `redmineflux_core_list_issues(project_id=1, parent_id=159)` → 3 real issues
  (#179, #180, #181), matching the proposed subtask titles exactly.

## Status: CLOSED 2026-11-20 — CONFIRMED FIXED

- Fixed by CRC-123 (crux-core 1.17.0): `field_check.same_form()` keeps a corrected `project_id` in the form it
  was sent (int stays int, numeric string stays string); a safety-net in `mcp_client.call_tool` additionally
  resends a call refused purely for value type (pydantic `string_type`/`int_parsing`) once more in the right
  type.
- Retested on the rebuilt stack (crux-core 1.17.0): Improver, "Break issue #159 down into subtasks." → "Yes,
  create them." — ran 3 fresh-chat attempts. Attempts 1 and 2 both succeeded cleanly ("Created 3 of 3" each,
  real subtasks #184-186 and #187-189, native-verified `Parent: #159`) — zero occurrences of the original
  Pydantic `project_id` type error across all 3 attempts.
- Attempt 3 also failed ("Created 0 of 3"), but with a **different, unrelated** error — "Parent task is
  invalid" — traced via Redmine server logs to the agent resolving the wrong but correctly-typed `project_id`
  ("9" instead of "1"). This is NOT a recurrence of this bug (the type was already correct, only the value was
  wrong) — filed separately as BUG-CRX-224 (wrong-project-resolution family, first instance on Improver).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related in *class* to BUG-CRX-220 — both are non-deterministic
  defects first observed on the post-CRC-122 build during today's happy-flow regression pass — but a
  distinct mechanism: a Pydantic type-validation failure on `project_id`, not a false permission denial)
