# Bug Report Template

- Bug ID: BUG-CRX-112
- Production Redmine Issue ID: #126602
- Title: For a user without "Create projects" permission, the create_project proposal renders as plain fabricated text with no real Confirm/Cancel button at all — recurrence of the historic BUG-CRX-020 class, 2/2 reproduced
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Setup Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `daisy.skye` (Reporter — DB-confirmed to lack the global `add_project` / "Create projects" permission)
- Date: 2026-10-30

## Steps to reproduce

1. Log in as `daisy.skye` (confirmed via DB: `add_project` is `false` on her only role, Reporter; the
   `new_project_user_role_id` global setting is also unset, so no non-member grant applies either).
2. Fresh chat, Project Setup Agent: "Create a project called 'Daisy Unauthorized Test'."
3. Repeat in a second fresh chat with a different name: "Create a project called 'Daisy Unauthorized Test
   2'."

## Expected result**

Per the tool's own docstring ("non-admin users without the permission receive a 403 Permission denied
error") and this repo's established CRX-35 convention (confirmed working correctly for every other agent
this QA cycle, including this same agent as `admin`/`luna.blossom`): the agent should produce a genuine,
structured confirm card with a real, DOM-clickable Confirm/Cancel button — and the actual 403 permission
denial should surface honestly once the user clicks Confirm, not before.

## Actual result

**Both attempts produced plain prose text with no structured proposal card and no real Confirm/Cancel
button at all** — only the standard per-message `Copy`/`Keep`/`Ask again` actions that appear on every chat
message regardless of whether it's a write proposal:

> *"Good — no collision with 'Daisy Unauthorized Test'. Here's what I'm proposing: **New Project** — Name:
> Daisy Unauthorized Test, Identifier: daisy-unauthorized-test (derived from your name; lowercase with
> hyphens), Description: (none — you didn't describe one), Public: (Redmineflux default), Modules:
> (Redmineflux defaults). This proposal is ready for you to confirm. Once you do, I'll create it."*

There is no button anywhere to actually confirm it. The chat message claims readiness to proceed on
confirmation, but offers no mechanism to provide that confirmation — a dead end. **Reproduced identically
2/2** with a second, differently-worded attempt in a fresh chat.

This is the same defect class as the historic, previously-fixed **BUG-CRX-020** (fabricated-confirm
proposals with no real button, originally found platform-wide across 5 domain agents) — but recurring here
specifically for `create_project` under a no-permission user, a trigger path not previously covered by that
fix. By contrast, the identical action (`create_project`) for `admin`/`luna.blossom` (both holding
`add_project`) genuinely renders a real structured confirm card with clickable buttons every time (see
TC-CRX-423/427/428/430) — so this appears correlated specifically with the caller's permission state: the
proposal-rendering pipeline may be silently degrading to plain descriptive text instead of a real
confirm-gate object when the underlying write would be permission-denied anyway, rather than still
rendering a genuine confirm card and letting the actual 403 surface honestly at confirm time (the correct
pattern this repo has already confirmed works for every other write/permission combination tested this
cycle).

## Evidence

### Console / log

- Attempt 1 (verbatim): *"Good — no collision with 'Daisy Unauthorized Test'. Here's what I'm proposing:
  New Project — Name: Daisy Unauthorized Test, Identifier: daisy-unauthorized-test (derived from your name;
  lowercase with hyphens), Description: (none — you didn't describe one), Public: (Redmineflux default),
  Modules: (Redmineflux defaults). This proposal is ready for you to confirm. Once you do, I'll create
  it."* — message actions present: Copy, Keep, Ask again. No Confirm/Cancel.
- Attempt 2 (verbatim, fresh chat, different name): *"Good — no collision with that name. Now I'll propose
  the new project: Project Proposal: Name: Daisy Unauthorized Test 2, Identifier:
  daisy-unauthorized-test-2, Description: (none — you didn't describe one), Public: (will use Redmineflux
  default). The identifier is derived from your project name, using lowercase letters and hyphens as
  required. Ready to create it when you confirm."* — same message-action set, no Confirm/Cancel.
- Contrast: the identical action for `admin` (TC-CRX-423, TC-CRX-427/428, TC-CRX-430) always rendered a
  genuine structured card (`Write`/`Create project` header, a Name/Identifier table, real `Confirm`/
  `Cancel` buttons, DOM-verified clickable).

## Duplicate check

- Duplicate found: No new root cause filed as a fresh bug since the original BUG-CRX-020 was already
  CONFIRMED FIXED and closed for its originally-tested trigger paths (9 action types across 5 agents,
  2026-09-16). This is a **recurrence on a new trigger path** (`create_project` specifically under a
  no-permission caller) not covered by that fix — consistent with this repo's convention of filing
  recurrences of an already-fixed defect class as new bugs when the specific trigger differs (see
  BUG-CRX-027, BUG-CRX-056/077, BUG-CRX-082 for the same pattern on other defect classes).
