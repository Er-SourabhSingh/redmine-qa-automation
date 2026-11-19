# Bug Report Template

- Bug ID: BUG-CRX-220
- Production Redmine Issue ID: <!-- not yet reported to production -->
- Title: Code Reviewer intermittently (1/3) falsely tells admin "DevOps plugin tools... are not available to your account" for a review that succeeds cleanly on the very next identical attempt
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_crux
- Plugin version: crux-core 1.16.0 (CRC-122), mcp 1.0.13
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-19

## Steps to reproduce

1. With the DevOps plugin installed and a real PR/commit/build linked to issue #167 (same fixture used by
   `CRUX_AGENT_CODE_REVIEWER.md` TC-CRX-625), pin Code Reviewer and ask (fresh chat each time): "Review the
   changes for issue #167" / "Code Reviewer, review the changes for issue #167 in the Crux DevOps Agent Test
   Project."
2. Repeat the identical question in 3 separate fresh chats, same session (admin), no changes to the
   underlying data between attempts.

## Expected result

- Every attempt should reach a genuine, evidence-grounded verdict — `ready` / `needs changes` / `can't tell`
  — per the agent's own manifest and TC-CRX-625's documented happy path. Admin should never be told a
  DevOps-plugin tool is unavailable to them; the MCP layer itself (`redmineflux_devops_project_summary`, same
  project) answers correctly every time when called directly.

## Actual result

- **Attempt 1:** *"Can't review #167. The DevOps plugin tools — pull requests, commits, and builds — are not
  available to your account. Your Redmineflux administrator needs to grant you permission to view those
  records."* — a false permission denial for the admin account itself.
- **Attempt 2** (fresh chat, identical question): *"Needs changes."* — correct, evidence-grounded verdict
  citing the real open PR #1, pending build #6, and commit `5fcd2015`. Matches TC-CRX-625's expected happy
  path exactly.
- **Attempt 3** (fresh chat, identical question again): *"Can't tell."* — also a valid, evidence-grounded
  verdict per the manifest's own accepted verdict set, citing the same real data.
- Only attempt 1's response is a defect — a false admin-permission denial, not a verdict at all. Confirmed via
  direct `redmineflux_devops_project_summary(project_id=20)` call (same admin-tied API key) that the DevOps
  data is genuinely reachable at the MCP/backend layer throughout — the denial is specific to this one chat
  turn, not a real permission gap.
- Non-deterministic: 1 false-denial out of 3 identical attempts. Possibly related to `CRC-122`'s permission-
  check changes to `crux_core/agents_registry/registry.py` / `crux_core/askcrux/chat.py` (same release that
  fixed BUG-CRX-218/219) — worth checking whether a race condition or a permission-cache warm-up window was
  introduced there, especially since this was observed shortly after the `crux-core` container was rebuilt
  with that release.

## Evidence

### Screenshot

![Code Reviewer falsely denies DevOps access to admin](../../screenshots/BUG-CRX-220/false-devops-permission-denial.png)

### Console / log

- Attempt 1 chat session: `ses-550`. Attempt 2: `ses-552` (needs changes, PASS). Attempt 3: `ses-553` (can't
  tell, also an acceptable verdict).
- Direct MCP verification (same admin key): `redmineflux_devops_project_summary(project_id=20)` → real data
  (1 build, 2 commits, 1 open PR, 1 connected repo) — confirms the backend/API layer never denied access.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
