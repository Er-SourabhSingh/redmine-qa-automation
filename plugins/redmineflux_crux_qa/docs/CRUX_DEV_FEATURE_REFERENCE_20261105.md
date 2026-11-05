# Crux — Complete Feature List (Developer-Provided, 2026-11-05)

> **Authoritative source.** Written by the developer from the source code of the current build — not from
> memory or the UI alone. Pasted into this repo verbatim on 2026-11-05 in response to a QA request for a
> complete A-to-Z feature list. This supersedes `CRUX_FEATURES_LIST.md`'s own Part B draft wherever the two
> disagree — see that file's own notes for which rows were corrected and how.
>
> Build identity this list was written against:
>
> | Component | Branch | Commit |
> |---|---|---|
> | crux-core | master | `347ee6e` (VERSION 1.1.0) |
> | Crux plugin | master | `7751dc8` |
> | MCP | `crux_development` | `767f695` |

## How to use this list

- Sections 1–14 are what to test.
- Section 15 lists what not to test yet.
- Section 16 lists corrections to the 2026-11-05 QA draft (`CRUX_FEATURES_LIST.md`).
- Section 17 lists small issues found while compiling this list — already known, no need to file them.

## 0. Who can see what: permissions, menus and the rail

### 0.1 The five Crux permissions

Set them in Administration → Roles and permissions, project module Redmineflux Crux.

| Permission | What it unlocks |
|---|---|
| View Crux dashboard (`view_crux`) | All Crux pages: Dashboard, Work packages, Ready queue, Run ledger, Agents, Pipelines, and the project Crux tab with its sub-pages. Without it you get a 403. |
| Use Ask Crux (`use_ask_crux`) | The Ask Crux page, the chat bubble on every page, the Improve wand on issues, the @-mention poll, and the Work Package section on issues. |
| Approve Crux gates (`approve_crux_gates`) | The Review / Approve buttons on gates. You need it in every project the Work Package's tickets belong to. Admins always have it. |
| Manage Crux agents (`manage_crux_agents`, global) | + New Agent, Upload Agent, Edit, Pause/Resume, Create Redmineflux identity, Retire. |
| Manage Crux pipelines (`manage_crux_pipelines`, global) | + New Pipeline, Edit, Duplicate, Delete. |

Admin only: Providers & keys, Settings, Frozen rules, Logs. Any logged-in user: Help. The Help page also has a
live table showing each of these five permissions with You have this / Not yet for the current user.

### 0.2 Menus

- Top menu "Crux" → `/crux`. Caption set in Settings → Navigation; can be hidden there. Needs View Crux.
- Top menu "Agents" → `/crux/agents`. Off by default (Settings → Navigation).
- Project menu "Crux" → `/projects/<id>/crux`. Appears only when the project has the Redmineflux Crux module
  enabled.
- Administration menu has three shortcuts: Crux — providers & keys, Crux — logs, Crux — frozen rules.
- Administration → Plugins → Configure is deliberately disabled for Crux. All settings live on
  `/crux/admin/settings`.

### 0.3 The left icon rail (every global Crux page)

In order: Dashboard, Ask Crux (needs Use Ask Crux), Work packages, Ready queue, Run ledger, Agent fleet,
Pipelines, Providers & keys (admin), Settings (admin), Frozen rules (admin), Logs (admin), Help. Project pages
show a tab row instead of the rail.

### 0.4 Shared UI behaviour (applies to every page)

- Loading skeletons. If a load fails, the skeleton becomes "Couldn't load this right now." with a Try again
  button.
- "i" tooltips show on hover, keyboard focus or tap. Esc or scrolling hides them.
- Dialogs close with ×, Cancel, a click outside, or Esc. Destructive actions use a red confirm button. Crux
  never uses the browser's `confirm()`.
- On global Crux pages, the header title reads CRUX instead of "Redmine".
- Accent colour. The Settings accent colour applies to the whole plugin. Default `#0094FF`.
- Plain-language errors. Admins also get a link (Open Providers & keys or Open Crux Settings). Non-admins are
  told to ask their administrator.

## 1. Dashboard — `/crux`

Header: title "Dashboard", plus an Ask Crux button (only with Use Ask Crux).

Warning banner: "Some Redmineflux data couldn't be loaded…" when core can't reach Redmine.

Four stat cards (each has a tooltip):

| Card | What it shows |
|---|---|
| Outcomes delivered | Work Packages whose final approval gate a person approved and that have a successful run. Shows "$X per outcome", or "Counted when a gate is approved". May carry a "provisional" tag. |
| Agent runs | Number of runs, with tokens. |
| Spent | "Recorded by Crux · all time". |
| Agents online | "of N agents". Retired agents are not counted. |

**Card: Needs your attention**
- Lists Work Packages waiting at a gate: with Approve Crux gates → "Approve the plan" + Review button; without
  it → "Waiting for an approver" + View link.
- Lists up to 3 recent runs that didn't succeed, each with an Open link to the Run ledger.
- Shows at most 5 items, then "+N more". Empty state: "✓ All clear".

**Card: Agents**
- Online/paused/retired/"used so far" counts; a bar chart of agents ranked by runs.
- Click a bar → Agent detail modal: status, engine, skills; runs, "$X spent so far · monthly cap $Y"; a Recent
  runs table (Time, Run, Issue, Agent, Model, Duration, Tokens in/out, Cost, Tool calls, Outcome); Close button.
- All agents → link.

**Card: Work in progress**
- One row per active Work Package: goal, ticket count, pipeline type; segmented progress bar with a lock where
  a gate blocks; "stage i of n"; a pill (Done / Waiting for you / In progress); Review button (approvers only).
- Shows at most 8 rows, then "+N more". Finished packages fold into "Done N delivered" with Show/Hide.
- All work packages → link.

**Card: Live activity**
- Latest 25 runs. Consecutive runs by the same agent on the same package are merged.
- Each line: "Agent worked on …" / "answered in Ask Crux" / "proposed a change", with duration, cost, time. A
  pill appears if the run didn't succeed. Hover → run id, model, tokens.
- Run ledger → link.

**Card: Ready for agents**
- Up to 8 queued tickets: #id (new tab), skills, pill ("ready" or "claimed by …"). Queue → link.

**Gate approval modal** (opened by Review)
- "Approve for <ticket>?" Shows evidence: the runs (agent, model, tokens, cost, outcome), cost total, artifacts,
  acceptance line, approval chain so far.
- Cancel / Approve (locked against double click). Success: "Gate "x" approved." and the board reloads. Failure:
  modal stays open with the reason.
- **Rules to test:** a gate more than one step ahead can't be approved yet; a gate can be approved only once;
  the approver is recorded as the real logged-in user.

## 2. Work packages — `/crux/work_packages`

Filter tabs with counts: All, Waiting for you (or "Waiting for approval"), In progress, Done.

| Column | Content |
|---|---|
| Work package | goal + type + autonomy |
| Project | links to that project's Crux tab if you can see it, else to the project |
| Status | pill |
| Progress | bar + "step i of n", or "Delivered" |
| Next step | "Waiting for approval: <stage>" + Review / "Agent is working on: <stage>" / "Nothing left to do · approved by X" |
| Tickets | #id links, new tab |

Click a row (or Enter/Space) to expand: full stage chain with gate chips (✓ approved, hover for approver; lock
for pending). Review appears only on the gate it is waiting at. Legend: Done / Now / Later / lock.

Pager: 25 per page. Empty states: "No work packages yet." / "No work packages match this filter."

**How a Work Package is created: only through Ask Crux.** E.g. ask Project Manager "Set up a work package for
#A and #B to build …" — a `Create work package` confirm card appears.

- Agents that can create one: Project Manager, Project Setup Agent, Auto-Fixer, CRM Agent, Helpdesk Agent,
  Invoice Agent.
- Every ticket must be visible to the person confirming.
- Autonomy levels: `suggest-only` (agents never write anything, not even @-mention replies), `execute-with-approval`
  (default), `autonomous`.
- **Not possible from chat, by design:** editing or deleting a Work Package, or choosing a custom pipeline.

## 3. Ready queue — `/crux/queue`

Columns: Ticket, Project, Who picks it up (assigned agent / "An agent that can do X" / "Any available agent",
plus the autonomy line), Status ("Waiting for an agent" / "Picked up by <agent>"). Pager: 25/page.

A ticket appears here when all 3 are true: open; tagged `readyforagent` (Flux tags plugin); no open blockers.

Assigning it in Redmine to an agent's own user reserves it for that agent, but the tag is still needed. Workers
(Builder 1/2) claim from this queue through the agent API (see §15).

## 4. Run ledger — `/crux/runs`

4 tiles (current filter): Runs (+ avg duration), Succeeded "x / y" (%), Tokens (in·out), Cost.

Filters: Agent (All or one), Outcome (All/Success/Failed/Degraded). Changing a filter resets to page 1.

Columns: When, Agent, What it did, Time, Tokens, Cost ("(est)" when estimated), Status. Click a row → Run id,
Model, Tokens in/out, Tool calls, Note, issue link. Pager: "← Prev / Page x of y (N runs) / Next →".

**Every Ask Crux answer is a run** — mention replies and Improve suggestions are runs too. Cost rules: known
model → estimated from tokens, marked "(est)"; unknown model → "cost unpriced". URL-only model filter:
`/crux/runs.json?model=<name>` (no UI control).

## 5. Project Crux tab — `/projects/<id>/crux`

Needs project membership, module enabled, View Crux in that project. Tab row: Overview · Graph · Work packages
· Run ledger · Queue, plus All of Crux →.

- **5.1 Overview** — same cards as Dashboard, scoped to the project; no Ask Crux button; Review uses the
  project-level Approve permission.
- **5.2 Graph** — the *only* graph page (no global one). 4 tiles: Tickets, People & agents, Groups (work
  packages + versions), Connections. Toolbar: view switch Grouped/Focus/Table; search with autocomplete; zoom
  +/−/Fit (not in Table); Show filters (Tickets/People/Agents/Work packages/Versions checkboxes).
  - Grouped: one bubble per Work Package/version + "Other tickets"; people left, agents right; click → breadcrumb
    "All groups ›".
  - Focus: one item centered with neighbours in a ring; click a neighbour to re-focus; breadcrumb up to 6 steps.
  - Table: heat-map of people/agents × groups; click a cell → ticket list.
  - Side panel (on node click): name/kind, "Spans projects…" when relevant, Open in Redmine →, connections (up
    to 40), Focus on this, Open this group.
  - Banners for no-activity/large-project-partial/no-graph-yet. Covers the last 90 days by default.
- **5.3 Work packages / Run ledger / Queue** — same as §2–4, scoped to this project.

## 6. Agent fleet — `/crux/agents`

- **6.1 Toolbar**: search (name/id/role/team/skills); view switch Cards/Teams/List (remembered); count line
  "N agents · M online · K need a plugin · R retired".
- **6.2 Header buttons** (Manage Crux agents only): Upload Agent, + New Agent.
- **6.3 Cards view**: avatar, name, role, status dot; example question; 2 skills + "+N" (hover for all); "N
  runs · X% ok". Footer flag (one of): Paused / Retired / Needs `<plugin>` (Learn more) / Worker · runs ready
  tickets. Chat opens `/crux/ask?agent=<id>` — hidden for retired agents, missing-plugin agents, and workers.
- **6.4 Teams view**: Project delivery · Sales and finance · Support and knowledge · Engineering and quality ·
  Crux helpers · Custom agents.
- **6.5 List view**: Agent (+ "Redmineflux: <user>" chip if paired), Skills, Type (Bundled/Custom), Model
  (Default or provider·model), Spend this month ("$x of $cap" + bar + "cap reached"/"N% used"), Runs, Status,
  Actions (Chat + ⋯).
- **6.6 ⋯ menu**: Details (always); Managers only on non-retired agents: Pause/Resume (paused = no new queue
  work, running runs finish), Edit (custom only — bundled read-only), Create Redmineflux identity (only while
  unpaired), Retire (red).
- **6.7 Agent profile (Details)**: status/role/team/id; Try asking (example + skills); What it can do (read/
  change tool counts + first change tools); This month (budget meter + health "X% · N runs", last run); engine,
  Redmineflux identity, max parallel runs; Chat with <agent>.
- **6.8 + New Agent / Edit** fields: Id (lowercase/digits/dashes), Name (required), Capabilities (comma-sep, ≥1),
  Provider ("inherit" or an enabled provider), Model (blank=inherit), Max concurrent (≥1), Monthly cap USD
  (blank=0=no cap). Re-submitting an existing id updates that agent. Each invalid field shows its own message.
- **6.9 Upload Agent**: pick a `.md` file → editable box → Upload. Format: `---` frontmatter (id, name,
  capabilities, optionally binding/allowed_tools) then `---` then instructions. Rules: each allowed tool must
  exist on the MCP; instructions ≤5,000 chars; a built-in agent's id is refused. All errors listed together.
- **6.10 Create Redmineflux identity**: creates a real Redmine user (login=agent id, mail `id@agents.<host>`,
  role "AI Agent" which must already exist, API key stored in core). Fields: projects to add (comma-sep
  identifiers), required checkbox "I understand this creates a real Redmineflux user". Result lists user, mail,
  "API key stored: yes", ✓/✗ per project. Agent replies (e.g. @-mentions) then post as that user.
- **6.11 Retire**: permanent, no un-retire. Needs checkbox "I understand this is permanent". Locks the paired
  Redmine user, keeps history.
- **6.12 Rules to test**: Pause stops new queue work only, not chat. Monthly cap stops queue work only ("needs a
  human top-up"), not chat (see §15). Max concurrent limits simultaneous queue tickets held.

## 7. Pipelines — `/crux/pipelines`

- **7.1 Built-in pipelines** (read-only):

| Pipeline | Stages | Approval gates |
|---|---|---|
| Software feature | clarify → plan → develop → test → holdout → review → deliver | before plan, before develop, before deliver |
| Document | clarify → outline → draft → review → finalize | before draft, before finalize |
| Bug fix | reproduce → root-cause → develop → test → holdout → review → deliver | before develop, before deliver |

A chat-created Work Package can also use outcome types customer-support, lead-to-deal, billing — templates with
their own stages, not pipeline cards. Every gate needs a human, always — "auto-approve" does not exist.

- **7.2 Card**: name, outcome type, built-in/custom pill; stage chips with a lock on each gate; "N stages · M
  approval gates · updated by X".
- **7.3 Actions** (Manage Crux pipelines only): built-in → View (read-only) + Duplicate to edit; custom → Edit,
  Duplicate, Delete (with confirm). No permission → cards with no buttons.
- **7.4 + New Pipeline / editor** fields: Id (blank=core-assigned; duplicate gets `-copy`), Name, Outcome type,
  Stages (reorder ↑↓, remove ×, + add stage), Gates (gate id + "before <stage>", + add gate). **Rules:** ≥2
  stages, no duplicates; names lowercase/`-`/`_`; each gate points at a real stage; a gate must exist before the
  last stage.
- **7.5 Delete**: a pipeline any Work Package was created from can't be deleted. Editing a pipeline never
  changes an existing Work Package (each copies its stages at creation).

## 8. Providers & keys — `/crux/admin/keys` (admin)

- **8.1 Providers** card: name + enabled/disabled pill; kind, location; built-in/custom; default model;
  endpoint ("insecure" tag for plain http to a public host). Actions: Test connection (inline "ok · 312ms · N
  models" or error; may cost a fraction of a cent), Edit, Delete (custom only, refused while a key/agent uses
  it). **+ Add Provider** fields: Id, Name, Kind (openai-compatible/anthropic-compatible/gemini; bedrock shown
  disabled), Location (remote/local/broker/cloud), Base URL, Default model, Enabled. Built-in providers: only
  Base URL ("reset to default"), Default model, Enabled are editable.
- **8.2 Keys** table: Label, Provider, Key (`****last4`), Default (badge/Set as default), Added by, Added,
  Balance, Delete. **+ Add Key**: Label, Provider, Key (password field, wiped right after submit — re-paste
  needed after a failure), "default for this provider". **Balance ($ icon)**: one live OpenRouter lookup —
  available-to-Crux-now, account/key limits, spent today/week/month/all-time, Crux's own runs this month,
  free-tier note, low-credit warning under $1. Non-OpenRouter providers show a plain message instead.

## 9. Settings — `/crux/admin/settings` (admin)

Jump links on the left; one Save bar at bottom. Any invalid field → nothing saved, "Settings were not saved…"
with each field marked.

- **9.1 Core**: Crux core service URL (default `http://localhost:8787`, must start `http://`/`https://`); Test
  connection tests the typed address even before save (Connected / "isn't the Crux core service" / timed out /
  couldn't reach); Manage providers & keys → link.
- **9.2 Chat budget**: Daily cap per user ($), blank = no cap; hint shows current value or "No admin override
  set — using the environment default ($Y)"; if core is down, hint says the field won't be changed. **Behaviour:**
  at 80% of cap, each answer carries a warning; at 100%, chat is refused until 00:00 UTC. Counted per user, per
  UTC day, effective immediately.
- **9.3 Navigation**: Show Crux top-menu entry (default on, cosmetic only — access is via the permission); Show
  Agents top-menu entry (default off); Top-menu caption (blank="Crux").
- **9.4 Ask Crux bubble** (live preview): Bubble position (Bottom right default/Bottom left), Panel size
  (Comfortable default/Compact), Bubble icon (Chat default/Wand/Spark), Accent color (`#0094FF` default, `#`+3or6
  hex), Greeting (default text given), Suggested prompts (comma-sep, ≤5, default 3 given), Default agent (blank=
  Auto; agent-id or `Role Name:agent-id` pairs), Launch teaser (optional label until first open).
- **9.5 Chat agents**: checkbox list of agents. **None checked (default) = every agent offered.** Checking some
  limits the picker + @-list to those.
- **9.6 Hidden admin page (URL only)**: `/crux/admin/capability_map` maps a Component value to a skill for the
  Ready queue — card removed from Settings UI, page still works by URL. Also: the plugin adds an issue custom
  field "Crux Capability" (list, all trackers), visible on issue forms.

## 10. Frozen rules — `/crux/admin/frozen_rules` (admin)

Table: Rule (sentence, e.g. "Agents can't change the status field on issues with tracker Bug in project x"),
Reason, Frozen by, Delete (confirm: "Agents can change these tickets again straight away").

**+ Freeze something** fields: Object type (`issue`), Tracker (optional), Project (optional, identifier/name),
One ticket id (optional, `#` allowed), Field (optional; list: status, notes, assigned_to, priority, subject,
description, done_ratio, tracker, category, fixed_version, parent_issue, start_date, due_date, estimated_hours,
is_private), Reason (required, max 300). All scope fields blank → red extra confirm "Freeze every ticket?". Bad
values get a clear message.

**What a rule blocks**: agent writes through Crux's write policy — queue claim notes, result notes, status
moves, @-mention replies, chat-confirmed writes. **Nothing overrides a rule** — no autonomy level, no gate
approval. A frozen ticket gets no @-mention reply at all. A rule frozen on `status` does not block a mention
reply (a reply only writes notes).

## 11. Activity log — `/crux/admin/logs` (admin)

Toolbar: Level (all/DEBUG/INFO/WARN/ERROR, minimum level), Component (all + whatever core reports — **not a
fixed list**), Activity id (exact match), Search (free text), Limit (50/200 default/500), auto-refresh (5s,
remembered, paused while tab hidden), Refresh, activity filter chip "act: … ✕".

Columns: #, Time (hover=full timestamp), Level, Component, Act (click→filter to that activity), Session/run,
Message. Pager: 25/page. Footer: "In-memory buffer (last N records) — restarts clear it." Durable logs are in
server files.

## 12. Help — `/crux/help` (any logged-in user)

Admins see First-time setup (6 steps + links: Crux Settings/Test connection, Providers & keys, Project modules,
Roles and permissions, Agents, Frozen rules). Everyone else: "ask your administrator".

- What is Crux? — 5-step flow + Open Ask Crux/Open Dashboard/View Agents.
- Using Crux day to day — tiles for Ask Crux, bubble, Dashboard, Agents, Pipelines, Improve with Crux,
  @-mention, daily spend reminder.
- The agents — table of all 24, "What to ask it" + "Needs `<plugin>`".
- FAQ, If something goes wrong (error-message table), Check your permissions (live table from §0.1).

## 13. Ask Crux — full page `/crux/ask` and the bubble

- **13.1 Composer**: placeholder differs (full page vs. bubble). **+ button → "Attach a ticket" — this is the
  only option, the + button is not a menu.** Dialog: Ticket number (e.g. 450393) + Attach; wrong value →
  "Enter a ticket number, for example 450393." Adds `#450393` to your message (sends the number only, not a
  file — agent reads the ticket itself). **Slash commands**: `/` at message start opens a list (`/status`,
  `/summarize`, `/breakdown`, `/improve`), filters as you type, picking one makes a chip; on send the message
  becomes `@crux status: <your text>` → Project Manager. **@-mention an agent** (full page only): `@` + partial
  name → up to 6 agents; picking sets the answering agent (bubble: `@` is plain text). Keys: Enter sends,
  Shift+Enter newline, Enter-with-list-open picks first item, Esc closes list. Composer grows to ~5 lines.
- **13.2 Agent picker (Auto or one agent)**: full page = composer button "Auto ▾"/"<Agent> ▾" + i tip; bubble =
  header agent name + composer button. Lists Crux (auto) first, then agents. **Hidden from it**: agents whose
  plugin isn't installed, workers, and (when Settings → Chat agents has a selection) every agent outside it.
  Choice remembered per browser, shared between bubble/page; falls back to the Settings default agent (can
  differ per role) if nothing stored. `/crux/ask?agent=<id>` opens with that agent (ignored if retired/
  unavailable/not allowed). **Auto routing**: reply starts "→ asking the …"; a ticket number or "what should I
  work on today?" → Project Manager.
- **13.3 New chat screen** (full page): greeting + Settings greeting text; prompt cards = first 5 Settings
  suggested prompts; "Pick up where you left off" = 3 most recent named chats; disclaimer line.
- **13.4 Chat list** (full page, left side): New chat, collapse button, Search chats (titles). Groups: Pinned ·
  Today · Yesterday · This week · Older · Shared with you. A chat with no messages isn't listed. Row actions:
  click=open, double-click=rename, ⋯→Rename/Pin to top/Unpin. Pins saved per-browser, up to 20. Rename ≤120
  chars, not empty. **No "delete chat" by design** — core keeps each user's 20 newest chats.
- **13.5 Chat header** (full page): Title; "$X this chat" (hover=tokens); Daily limit pill ("no limit set" or
  "$2.00/day · $0.12 today", click to set personal limit §13.10); Kept answers (with count); Share; ⋯
  (Rename/Pin). Kept/Share/⋯ appear only after the first message.
- **13.6 Each answer**: delegation byline (full page) "→ asking the X…"; "Checked N things" collapsible steps
  list + #id chips (bubble shows "✓ Used N sources" instead); Copy, Keep (full page), Ask again (full page,
  re-sends), cost (hover=model/tokens). Warnings under an answer: admin-cap-80% warning, personal-limit-exceeded
  note.
- **13.7 Confirm/Cancel cards** (every write): card types — Create issue, Update issue, Create project, Create
  work package, Write (other), Plan (numbered multi-step), Ask agent (hand-off). Results: Confirm → "✓
  Created #123" etc., or "⚠ #123 was not fully updated: …" for a partial update; a Plan shows "✓ Created N of M"
  or per-step "Step k failed: …"; Cancel → "Cancelled." If Confirm itself fails, the card stays with the reason,
  re-confirmable. **Rules:** nothing changes before Confirm; a failure never shows ✓; after reload, a decided
  card shows its result, not the buttons again.
- **13.8 Keep / Kept answers** (full page): Keep → "Saving…" then "Kept ✓" (disabled on reload). Kept answers
  panel: list (title/agent/time/version), open to read, Copy, Download `.md`. Only your own kept answers for
  this chat shown — no edit/delete. Confirming a card later appends its result to the kept answer.
- **13.9 Share** (full page): dialog — username to add, chips for current viewers with × to revoke. Errors: "no
  active Redmineflux user with username …", "already yours". Viewer side: chat under "Shared with you", banner
  "Shared by <owner> — read-only…", no composer/Share/⋯/Kept, auto-refreshes every 4s while open, access stops
  the instant it's revoked. Only the owner can share/unshare.
- **13.10 Personal daily limit** (full page, header pill): $ amount + Save/Clear. **Reminder only, never
  blocks** — separate from the admin cap, works even with no admin cap. Validation: non-number, ≤$0, >$10,000
  all rejected with specific messages.
- **13.11 Floating bubble** (every Redmine page except `/crux/ask` and 2FA pages): pulses until first opened;
  optional teaser label until then. Header: agent switcher, + New chat, History (last 5 + "See all ↗"), Open
  full view, ×. **Knows the page** — "Looking at issue #N" / "Looking at project X", sent as context with each
  question. Empty state: greeting + up to 5 prompt chips. Has: Copy, "Used N sources", Confirm/Cancel cards.
  **Doesn't have** (vs. full page): Keep, Ask again, @-mention, cost header, Share, Kept answers, personal
  limit. Remembered between pages: open/closed, active chat, agent. ≤520px width → full-screen sheet.
- **13.12 Errors and recovery**: specific messages per HTTP status (401/403/422/404/500/offline/core-down) and
  per AI-provider problem (no key, key rejected, out of credit, model unavailable, etc. — admins get a fix
  link). Error bubble: Retry when it can help, unsent text restored to the box, auto-recheck every 10s with "Crux
  is back. You can try again now." Other: "Crux didn't send an answer. Please try again."; "The answer was cut
  off. Please try again." Status line while working: rotating messages + "(still working…)" after 20s. **Not
  there, by design**: no Stop button, no file upload, no keyboard shortcut to open the bubble.

## 14. Crux inside normal Redmine issue pages

### 14.1 Improve with Crux (wand) — needs Use Ask Crux

A bulb icon "Improve with Crux" sits in the issue's **top-right toolbar, next to Copy** (not "under the issue's
details" as Help currently says — see §17). Click opens the panel; closes with ×/Esc/click-outside except while
working.

- **Break down the work**: proposes 2–7 subtasks, all ticked; untick unwanted ones; Create selected / Cancel.
  Results: "✓ Created N subtasks" (reload after 1.5s); "⚠ Created x of y…" with reasons + Reload page; "⚠ No
  subtasks were created." Re-confirming never creates duplicates. Unticking everything → "Select at least one
  subtask to create."
- **Improve the description**: Before/After card + an added Acceptance Criteria section. Empty description →
  ⚠ DRAFT written from the subject. Apply → "✓ Description updated." (reload); Cancel → "Cancelled." No edit
  rights → "the write did not take effect — you may not have permission".
- Was this suggestion helpful? 👍👎 — rate once ("Thanks for the feedback.").
- Ask about this issue → opens the bubble with `#<id>` pre-typed.
- Each suggestion is a run in the Run ledger.

### 14.2 @-mention an agent in a ticket comment — needs Use Ask Crux

Start a comment with `@crux` or `@<agent-id>` (e.g. `@crux what is blocking this?`, `@research related
tickets?`). **The reply arrives on the issue page's next load — no live push, reload to see it.**

| Verb | Answered by |
|---|---|
| `status` | Project Manager |
| `summarize` | Digest |
| `research` | Research |
| `enhance`, `categorize` | Intake Clarifier |
| `breakdown`, `themes` | Work Package Planner |

`@crux` with no verb → Project Manager. Unknown name → a note listing the verbs.

The reply is **only a comment** — never changes fields. Posted as the agent's own Redmine user if paired,
otherwise under the service account with a disclosure line. Footer: "— <Name> · run-id".

**Rules to test**: agent-written comments never trigger a reply (no loops); each comment gets exactly one
reply; a ticket in a suggest-only Work Package, or a frozen ticket, gets no reply; at most 20 mentions answered
per page load, the rest follow next load.

### 14.3 Work Package section on the issue

Shown only when the ticket belongs to a Work Package, after the Description. **Read-only (no approve button
here)**: goal, "this ticket is 1 of N", status pill, steps with ✓/locks, Now/Latest update/Approvals. Open in
Crux → the project or global Work Package page, whichever is visible.

## 15. Not ready, not built, or by design — don't file these

| Item | Status |
|---|---|
| DevOps Agent | Not ready. Don't test it. |
| Code Reviewer | Needs the DevOps plugin. Hidden without it. |
| `intake-clarifier`, `run-reporter`, `work-package-planner` | Not chat agents — used only by @-mention verbs (§14.2). |
| Digest | Not a chat agent — used only by `@crux summarize`. |
| Licensing / licence keys | Not in this build at all. Plugin agents hidden only when their plugin isn't installed. |
| Slack / Microsoft Teams | Built in core but off unless the server admin sets tokens; no UI. Skip unless set up for you. |
| "Session artifacts attached to a ticket/project" | Not built. Keep saves to Kept answers only. |
| Delete a chat; Stop while answering; file upload in chat | Not built (by design). |
| Edit/delete a Work Package from chat; pick a custom pipeline in chat | Not built — Work Packages are created only. |
| Auto-approved gates | Not built — every gate needs a person. |
| Agent monthly cap and Pause "in chat" | By design, limit queue work only; chat still answers (product decision open). |
| Personal daily limit | A reminder; never blocks. Only the admin cap blocks. |
| `/crux/me.json` in a browser | Answers 401 — needs an API key, by design. |
| Bedrock provider kind | Shown but disabled (later phase). |
| Graph milestones in gate evidence | Always empty for now. |

## 16. Corrections to the 2026-11-05 QA draft (`CRUX_FEATURES_LIST.md`)

| Draft row | Correction |
|---|---|
| Part A: "Code Reviewer … the agent itself is core" | Code Reviewer is hidden unless the DevOps plugin is installed, like the plugin agents. |
| Part A: "24 agents" | Production has 24 chat agents. The local stack's seed has 26 because it adds the two workers Builder 1/2 — not chat agents. |
| #4 "0 runs recorded" | Every Ask Crux answer, mention reply and Improve suggestion is recorded as a run. If the ledger is empty, check you're looking at the same crux-core your chat uses. |
| #9 "presumed Edit/Delete for custom ones" | Confirmed: custom pipelines have Edit, Duplicate, Delete; built-ins have View, Duplicate to edit. |
| #15 "keeps ops agents like Monitor/Auto-Fixer out by default" | **Wrong.** None checked (default) = every agent offered. Only agents you tick are offered once you tick any. |
| #18 "Component (5 options)" | The Component list is whatever core reports — not a fixed 5. |
| #19 Help | Content listed in §12 here. Static, but the permissions table is live. |
| #25 "Session Artifacts, attachable to a project/ticket" | Attaching is not built. Keep → Kept answers only (§13.8). |
| #27 `CRUX_REQUIRE_USER_KEY=0` means shared key | **Not quite.** The plugin always sends the logged-in user's own key; every agent tool call uses that key, so Redmine permissions apply even at flag=0. The flag only makes core refuse a request with *no* user key at all. |
| #29 "@-mention … no TC" | See §14.2 here — the reply appears on the next page load of that issue. |
| Part A: "Auto routing: Root-Cause, Crux Guide, Code Reviewer misrouted" | **Please file these as bugs, with the exact question asked.** Code Reviewer is expected to be unreachable without DevOps — the misroute-to-PM is still worth filing, but don't file "Code Reviewer not answering" itself. |

## 17. Small issues found while compiling this list (known, already slated to fix — no need to file)

- Agent picker: a retired agent may still appear in it, while @-mention and `?agent=` correctly hide it.
- Kept answers: a kept answer's title can read "Answer from the X" instead of "Answer from X".
- Settings page text: subtitle mentions "Administration → Plugins → Configure" (disabled); the Navigation hint
  says anyone can open `/crux`, but View Crux is actually required.
- Help describes the Improve wand as "under the issue's details" — it's actually in the top-right toolbar.
- New chat screen's default prompt "Summarize this page for me" has no page to summarize on `/crux/ask` — works
  fine in the bubble.
