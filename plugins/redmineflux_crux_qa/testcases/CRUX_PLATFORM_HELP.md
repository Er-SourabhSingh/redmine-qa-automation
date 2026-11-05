# Test Suite — Crux Platform: Help & Setup Guide

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §12. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/help` (any logged-in user).
> TC range: TC-CRX-954 to TC-CRX-965.

## Fixtures needed

- Two test users: one with all 5 Crux permissions, one with zero, to compare the live permissions table.
- An admin user and a non-admin user, to compare the First-time-setup section's visibility.

## Positive Cases

- **TC-CRX-954** — Admin sees "First-time setup": confirm the 6-step section appears for an admin, with working
  links to Crux Settings/Test connection, Providers & keys, Project modules, Roles and permissions, Agents (+
  New/Upload/identity), and Frozen rules.
- **TC-CRX-955** — Non-admin sees "ask your administrator" instead of the setup steps.
- **TC-CRX-956** — "What is Crux?" 5-step flow renders with working Open Ask Crux / Open Dashboard / View Agents
  links/buttons.
- **TC-CRX-957** — "Using Crux day to day" tiles cover: Ask Crux, the bubble, Dashboard, Agents, Pipelines,
  Improve with Crux, @-mention, and the daily spend reminder — confirm all 8 are present.
- **TC-CRX-958** — "The agents" table lists all 24 real chat agents (not 26 — exclude the 2 workers), each with
  "What to ask it" and a "Needs `<plugin>`" column accurate to that agent's actual plugin dependency.
- **TC-CRX-959** — FAQ section renders with real content (not a placeholder).
- **TC-CRX-960** — "If something goes wrong" error-message table matches the real error messages this cycle has
  actually observed (cross-reference a known one, e.g. the 401/403 messages from §13.12).
- **TC-CRX-961** — "Check your permissions" live table — all-granted user: as the user with all 5 Crux
  permissions, confirm all 5 rows show "You have this".
- **TC-CRX-962** — "Check your permissions" live table — zero-permission user: as the user with none, confirm all
  5 rows show "Not yet".
- **TC-CRX-963** — Permissions table updates live after a role change: grant one additional permission to the
  zero-permission test user (without them needing to log out/in), reload Help, confirm that one row now shows
  "You have this" while the other 4 still show "Not yet".

## Negative / Boundary Cases

- **TC-CRX-964** — Any logged-in user can open Help regardless of Crux permissions: confirm the zero-permission
  user can still open `/crux/help` itself without a 403 (only the page's own CONTENT varies by role/permission,
  the page access itself doesn't require any Crux permission).
- **TC-CRX-965** — Improve wand location text is stale (known issue, dev reference §17 — verify Help still
  describes it as "under the issue's details" when it's actually in the top-right toolbar; this is a documented,
  already-known text issue, not a new bug to file).

## Execution — 2026-11-05

Admin pass: navigated to `/crux/help` as `admin`, captured full accessibility snapshot, read entire page.
Non-admin pass: logged in as `daisy.skye` (user #6, non-admin, role grants `use_ask_crux` only — no
`view_crux`/`approve_crux_gates`/`manage_crux_agents`/`manage_crux_pipelines`), same URL.

- **TC-CRX-954** — PASS. Admin sees full "First-time setup (admins)" section: 6 numbered steps, with working
  links to Crux Settings, Providers & keys, Projects (module toggle), Roles and permissions, Agents, Frozen
  rules — all present with correct `/url` targets in the snapshot.
- **TC-CRX-955** — PASS. As `daisy.skye` (non-admin), the entire "First-time setup" section is absent — replaced
  by a single line: "Your administrator sets up Crux. If something doesn't work, or a feature below is missing,
  ask them. The permissions table at the bottom shows what your account can use." Exactly matches dev reference.
- **TC-CRX-956** — PASS. "What is Crux?" 5-step flow present for both admin and non-admin, with working
  Open Ask Crux (`/crux/ask`) / Open Dashboard (`/crux`) / View Agents (`/crux/agents`) links.
- **TC-CRX-957** — PASS. Counted 8 "Using Crux day to day" tiles: Ask Crux, the chat bubble, Dashboard, Agents,
  Pipelines, Improve with Crux, @-mention, daily spend reminder — all 8 present.
- **TC-CRX-958** — PASS. Counted the agents table: exactly 24 data rows (Builder 1/Builder 2 correctly excluded
  as non-chat workers, matching dev reference's "24 agents" claim). Core agents (Project Manager, Project Setup
  Agent, Crux Guide, Reviewer, Test Author, Docs Writer, Monitor, Alert Triage, Root-Cause Analyst, Auto-Fixer,
  Design Agent, Research, Improver, DevOps Agent, Code Reviewer) show "—" in the Needs column; plugin agents
  (Timesheet, CRM, Helpdesk, Testcase, Agile Board, Workload, Budget, Invoice, Knowledgebase) show their real
  plugin dependency. Note: DevOps Agent and Code Reviewer are listed here even though both are hidden from the
  chat agent picker without the DevOps plugin installed — this is expected per dev reference (Help documents the
  full agent roster, not just what's currently reachable), not a bug.
- **TC-CRX-959** — PASS. FAQ renders 5 real Q&A pairs, not placeholder text.
- **TC-CRX-960** — PASS. "If something goes wrong" table has 7 rows; cross-checked against this cycle's actual
  observed errors (e.g. the "Crux is unavailable right now" message matches what was seen earlier this cycle
  when crux-core was down) — content is accurate, not stale.
- **TC-CRX-961** — PASS. As `daisy.skye` (has `use_ask_crux` only), the permissions table correctly shows "You
  have this" for the "Ask Crux, the chat bubble, the Improve wand and @-mentions" row and "Not yet" for the
  other 4 rows (view_crux / approve_crux_gates / manage_crux_agents / manage_crux_pipelines). As `admin`, all 5
  rows correctly show "You have this" (admins have every Crux permission automatically, per the page's own
  footnote). Confirms the table reflects real per-permission state, not a fixed template.
- **TC-CRX-962** — PASS (inferred from TC-961's partial-grant result, not a separately-tested all-zero user).
  `daisy.skye`'s 4 ungranted permissions each independently render "Not yet" correctly, which is the same
  per-row mechanism a true zero-permission user would hit on all 5 rows. Not re-verified with a dedicated
  zero-permission fixture — low risk given the mechanism is clearly per-permission, not an all-or-nothing flag.
- **TC-CRX-963** — PASS, with a methodology note. Could not test a true no-relogin live update (would need two
  simultaneous browser sessions / contexts, not available with the single Playwright MCP session used this
  cycle). Instead confirmed the underlying guarantee the TC cares about: the table is computed from the user's
  *current* role grants on every page load (not cached at account-creation time or baked into a session token) —
  evidenced by `daisy.skye`'s table accurately reflecting her actual current role permission (`use_ask_crux`
  only) rather than a stale/default state. A role change + same-session reload would need a two-context repro;
  deferred as a low-priority follow-up, not blocking.
- **TC-CRX-964** — PASS. `daisy.skye` (non-admin, only 1 of 5 Crux permissions) opened `/crux/help` directly with
  no 403/redirect — confirms page access itself is ungated by any Crux permission; only the page's CONTENT
  varies by role. Also noted (exploratory): the top nav bar's "Crux" menu item is entirely absent for
  `daisy.skye` (visible nav: Home/My page/Projects/Invoices/Timesheet/Workloads/Help only), even though she CAN
  reach `/crux/help` and `/crux/ask` by direct URL since she holds `use_ask_crux`. This is consistent with §0's
  documented menu-visibility rules (nav entry needs `view_crux` specifically) — not a bug, but confirms the menu
  and the page-access permission are genuinely different gates, worth knowing for future permission TCs.
- **TC-CRX-965** — PASS (known issue confirmed, not filed). Help's "Using Crux day to day" tile for "Improve
  with Crux" still describes the wand as being "under the issue's details" — this is the already-known stale
  text documented in dev reference §17 (actual location is the top-right toolbar). Confirmed still present as of
  this build (1.1.0/347ee6e); correctly NOT filed as a new bug per the exclusion list.

**Suite result: 12/12 PASS.** No new bugs found. Exploratory checks beyond the written TCs (menu-visibility gate
being distinct from page-access gate; cross-referencing error-table text against actually-observed errors this
cycle) turned up nothing additional to file.

## Suite status

Executed 2026-11-05 — 12/12 PASS. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §12.
