# Plugin Memory — Redmineflux Crux

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

## Confirmed Working

## Recurring Issues

## Environment Notes

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
