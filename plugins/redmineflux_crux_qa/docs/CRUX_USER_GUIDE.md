# User Guide — Redmineflux Crux

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.
> Drafted 2026-09-10 from `redmineflux_crux/init.rb` (menu/permission registration), `redmineflux_crux/README.md`, and `redmineflux-crux-core/docs/API.md` in the dev-provided QA stack (`C:\Crux-Redmine-Docker`). Not yet walked through live in the browser — confirm every step during test case execution and correct anything that doesn't match.

## Getting Started

Crux has **no dedicated "Ask Crux" menu entry** — the floating chat bubble IS the entry point (deliberate design, CRX-21). Once the plugin + core service are running and you're logged in:

1. A floating chat **bubble** appears (default position: bottom-right — admin-configurable). It greets with "Hello! I'm Crux. Ask me about your projects, or what the agents are up to." and offers starter prompts ("What are the agents working on?", "Any gates waiting for my approval?", "Summarize this page for me").
2. Click the bubble to open a compact chat panel. From there, "Open full view" reaches the full chat client at `/crux/ask`.
3. A top-menu **"Crux"** entry (caption admin-configurable) opens the main Crux dashboard.
4. An optional top-menu **"Agents"** entry (off by default — admin must enable `nav_top_agents`) opens the agent roster.

## Key Screens

| Screen | How to reach it | What it shows |
|---|---|---|
| Ask Crux bubble/drawer | Floating bubble (bottom-right by default), any logged-in page | Chat input, streaming replies, confirm cards for proposed writes, session list |
| Crux dashboard | Top menu → "Crux" | Merged snapshot: issues, agents, runs, dispatch, blockers, outcomes, Work Packages — filterable by project |
| Project Crux tab | Inside a project (if the Crux module is enabled for that project) → "Crux" tab | Per-project work graph, per-project runs |
| Agent roster | Top menu → "Agents" (if enabled) | Bundled + customer agent manifests, pause/resume, provision identity |
| Pipeline board | Reached from the dashboard/nav rail | List/author/edit pipeline templates |
| Issue wand | Issue view page | "Improve with Crux" action — description rewrite or subtask breakdown suggestion |
| Administration → Crux — providers & keys | Admin menu (admin-only) | LLM provider CRUD, live credential test, managed model keys |
| Administration → Crux — logs | Admin menu (admin-only) | Structured log viewer |
| Administration → Crux — frozen rules | Admin menu (admin-only) | Object-level agent-write blocks (CRX-39) |
| Crux settings page | Crux nav rail (not under Administration — CRX-50) | Set the core service URL, other plugin settings (merge-not-replace) |

## Step-by-Step Workflows

### Workflow 1: Ask Crux a question and confirm a write

1. Click the chat bubble (or open the full drawer via "Open full view").
2. Type a plain-language question, optionally `@mention` a specific agent (e.g. "@Sales Agent what deals need attention?").
3. Crux routes to the matching agent (or the Project Manager agent for cross-domain asks) and streams a reply, citing data from a real tool call.
4. If the question implies a write (e.g. "create a contact for Jane Doe at Acme"), the agent does **not** perform it — it renders a **confirm card** describing the exact proposed change.
5. Review the card. Click **Confirm** to execute (once, attributed to you) or **Cancel** to discard.
6. On Confirm, the result (success with the new record, or an honest failure reason) is reported back in the chat — never fabricated.

### Workflow 2: Improve an issue's description

1. Open an issue.
2. Click the wand icon/action.
3. Choose "Improve the description" (or the breakdown/checklist action for subtasks).
4. Crux suggests new content — shown as a before/after preview. This step is free (no write yet).
5. Click **Apply** to write the suggested content (one gated write through the same confirm mechanism) or **Cancel**.

### Workflow 3: Create a project from chat

1. In the chat, ask something like "@crux create a project for [name]."
2. A confirm card renders the proposed project (name, identifier, etc.).
3. Confirm to create the real project on Redmine, through the same confirm-gate mechanism as any other write.

### Workflow 4: Share a chat session (read-only)

1. From an active chat session, use the Share action to invite a teammate.
2. The invited teammate can watch the session live, including confirm cards and outcomes as they happen — but has no Confirm/Cancel control themselves; only the session owner can trigger a write.

### Workflow 5: Keep a reply / Session Artifacts

1. On any chat reply, use the **Keep** action to pin it to the session for later reference.
2. When an agent turn produces a durable output (e.g. a generated report), it can be saved as a **Session Artifact** and attached to the relevant project/ticket.

## UI Elements Reference

- **Chat bubble**: position/size/icon/greeting/starter-prompts/default-agent are all plugin-setting driven (Administration → Plugins → Redmineflux Crux, or the in-app Crux settings page).
- **Confirm card**: the only UI element that can trigger a real write — appears inline in the chat stream, requires an explicit click.
- **Gate approval**: on the dashboard, an "approve" action against a specific `{wp_id, gate_id}` — requires `approve_crux_gates` (project membership required).
- **Agent `@mention`**: addresses a specific named agent directly rather than letting Crux route the question.

## Notes & Known Behavior

- No Ask Crux menu entry exists by design — do not file "missing menu item" as a bug; the bubble is the intended single entry point.
- `use_ask_crux` does not require project membership (see [CRUX_REQUIREMENTS.md](CRUX_REQUIREMENTS.md) Permissions Matrix) — a logged-in non-member may still be able to open chat; what data they can actually retrieve/write should still be scoped by their own Redmine permissions.
- Chat only returns a canned echo-provider reply until at least one LLM provider key (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`) is configured — see [CRUX_MEMORY.md](CRUX_MEMORY.md).
- This guide is drafted from source code, not a live walkthrough — expect some drift from actual rendered UI (exact button labels, wand icon location, bubble copy) and correct this file the first time each workflow is actually executed.
