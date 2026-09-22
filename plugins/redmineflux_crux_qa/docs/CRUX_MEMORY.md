# Plugin Memory — Redmineflux Crux

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- **Write-proposal button rendering is inconsistent even for the *same* action type on the *same* agent** (confirmed 2026-09-17): the zero-real-button fabricated-proposal defect (BUG-CRX-020's original shape, now recurring under BUG-CRX-027/028) does not reproduce 100% of the time for a given tool/action — some attempts render a genuine, clickable Confirm/Cancel card, others render text-only. Don't treat one clean repro (real button present) as proof a fabrication bug is fixed — retest the same action type multiple times, and always DOM-verify (`querySelectorAll('button')` scoped to the response bubble) rather than trusting the visual/text appearance of the message.

## Recurring Issues

- **Zero-button fabricated-success pattern (BUG-CRX-020/027/028 shape) is systemic, not agent-specific — now confirmed across 5+ domain agents and multiple action types.** Originally found on Scrum/Budget/QA/Timesheet/Invoicing (BUG-CRX-020, fixed 2026-09-16), it recurred post-fix under new triggers: validation-error-correction follow-ups (BUG-CRX-027, Sales Agent) and a clarifying-question-then-answer follow-up (BUG-CRX-028, Invoicing Agent — then reconfirmed a third and fourth time on the Capacity/Workload Agent for holiday-scheme activation and planned-hours update). Whatever shared backend component renders a write proposal has at least 3 distinct code paths that can produce a fabricated, unconfirmable message with no real button — this is a platform-wide rendering/session-state defect, not something scoped to one agent or one tool.
- **Misleading "✓"-prefix-on-genuine-failure pattern (BUG-CRX-018) is also systemic — now confirmed across 4 domain agents and 4 distinct failure types.** Originally found on the Capacity/Workload Agent (404 "allocation not found"), it has since reproduced identically on: a Workload team-create admin-permission denial, a Sales/CRM Forbidden (403) authorship-rule refusal, a KB Agent `manage_knowledgebase_pages` permission refusal, and a Scrum Agent core `Edit issues` permission refusal. Every one of these is a real, correctly-refused write — only the success-styled "✓" prefix is wrong. Confirms this is a single shared frontend/backend component unconditionally prefixing outcome text with "✓" regardless of whether the underlying `execute()` call actually succeeded, not an agent-by-agent bug.

## Environment Notes

- **Known stray artifact on production, do not touch or reference as real local data:** production issue **#120780** (`ztflux`, Test Case tracker, "TC-CRX-060 Passed Fixture") was accidentally created on `flux.zehntech.com` on 2026-09-17 when `redmineflux_testcases_management_create_testcase` was mistakenly called to build a local fixture for TC-CRX-060 — that MCP tool always writes to production, never to this plugin's local Docker instance (see root `MEMORY.md` → `feedback_redmineflux_mcp_never_for_local_fixtures`). The user chose to leave it in place rather than delete/close it. It has no real content and is unrelated to any actual TC-CRX-060 evidence — never link local test evidence to it, and never assume a "testcase #16" on the local instance still exists (it was un-scoped separately during BUG-CRX-030's reproduction). Any future local fixture for the Timesheet/QA-testcase-management suites must be built via the local instance's native UI only.
- **This Docker instance's Crux chat backend has only ONE configured LLM provider (OpenRouter), with no fallback key.** Confirmed 2026-09-17: when the OpenRouter key started returning 401 Unauthorized (verified via the native `/crux/admin/keys` "Test connection" diagnostic), it took down ALL Ask Crux chat testing platform-wide — every domain agent, both read and write paths — with no automatic or manual fallback available. This is distinct from the earlier 2026-09-16/17 402-low-balance incident (same provider, different failure mode). Before starting any Ask Crux session, a quick `/crux/admin/keys` Test Connection check is worth doing proactively, since a single provider outage is a full, silent testing-session stopper with no workaround short of a working key.

**QA stack location:** `C:\Crux-Redmine-Docker` (local, this machine).

**Components (4, not 3 — the setup includes its own dedicated Redmine):**
| Component | Role | Branch | How it runs |
|---|---|---|---|
| `crux-redmine` (+ `crux-redmine-db`) | Dedicated Docker Redmine 7.0.0 + Postgres 16, isolated from other redmine-docker-* stacks on this machine | — | `redmine:7.0.0` image, port **3014→3000** |
| `redmineflux_crux` | Redmine plugin (UI only — dashboard, Ask Crux chat bubble/drawer, pipeline board, agent roster, admin) | master | Volume-mounted into `crux-redmine` at `/usr/src/redmine/plugins/redmineflux_crux`; folder name must stay exactly `redmineflux_crux` (underscore) |
| `redmineflux-crux-core` | Python "brain" — Work Packages, gates/autonomy, dispatcher, Ask Crux chat runtime, write-confirm gate | master | `python:3.12-alpine`, stdlib-only + `pyjwt[crypto]` (installed at container start — `teams.py` needs it, a real gap vs. the stated "zero pip installs" constitution), port **8787** |
| `redmineflux-mcp` | MCP tool server crux-core talks to | `crux_development` (2 unpushed bug-fix commits — treat this local copy as source of truth) | Built from Dockerfile, internal port 8080 only (not published) |
| `nginx` | Required reverse proxy in front of `mcp` (strips `/mcp` path prefix — a direct connection to mcp 8080 404s every tool call) | — | port **8082** (8081 was already taken locally by the mail-webmail stack) |

**docker-compose.yml gotcha:** if `mcp` is ever rebuilt/restarted after `crux-core` already connected to it once, `crux-core` MUST also be restarted afterward — its MCP client session goes stale against the new mcp process and every tool call starts failing with 404 until it reconnects fresh.

**Verified working (2026-09-10):** all 5 containers up (`docker ps`), `GET http://localhost:8787/api/health` → `{"ok": true, "service": "crux-core", "project": "crux-qa"}`, plugin present at v0.39.0 in the Redmine container, custom field id 1 = "Crux Capability" (matches `CRUX_COMPONENT_CF=1` — not a placeholder mismatch in this setup).

**Config (`.env`, do not commit — holds a real API key):**
- `CRUX_PROJECT=crux-qa`, `REDMINE_PUBLIC_URL=http://localhost:3014`
- `CRUX_REQUIRE_USER_KEY=0` (default/shared-key mode) — must set to `1` specifically to test CRX-12's fail-closed per-user enforcement, per `.env` comment and `SETUP-INSTRUCTIONS.md`.
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` all **blank** — chat currently only returns the canned echo-provider fallback. **Blocks any real functional testing of Ask Crux / CRX-46 "Improve the description" until at least one LLM key is added.**

**Still needed before CRX-12 testing:** a second, restricted-privilege Redmine user on `crux-redmine` (localhost:3014) with their own API key (the `.env` key is the admin/shared one).
