# Bug Report Template

- Bug ID: BUG-CRX-094
- Production Redmine Issue ID: #125960
- Title: Auto-mode router sends an ambiguously-phrased Testcase-Management "To Do" question to Project Manager instead of QA Agent, which then answers using the wrong data model instead of the plugin's real To-Do concept (pending Runs by assignee)
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto-routing / "Crux (auto)" mode, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Set the Ask Crux agent picker to **Auto** (not pinned to a specific agent).
2. Fresh chat: "What's on my To Do list?" (no project/domain named).
3. Observe the reply and routing.

## Expected result

Auto mode should route a Testcase-Management "To Do" question to **QA Agent** — the only agent with any path to the real To-Do concept (pending/open Runs by assignee, confirmed via the native `/testcase_todos` page) — regardless of whether the user happens to type a domain word like "testcase." A real user asking "what's on my to-do list" has no reason to know or type the internal domain/agent name.

## Actual result

Auto first answered as a tool-less "plain chat" ("I don't have tools available in this plain chat to look up your To Do list or assignments... Ask me again starting your message with @crux..."), then proposed a hand-off card: *"Ask → Project Manager, About → What's on my To Do list?"*. Confirming it, Project Manager answered using generic Redmine `assigned_to` issue data ("Your open To Do list: #3 [Bug] Write release notes for v1.1 — assigned to you... That's it — one open issue on your plate.") — a different data model than the plugin's real To-Do (pending Runs by assignee). Ground truth checked via `/testcase_todos?project_id=crux-qa-agent-test-project`: 4 real open runs exist, all assigned to Luna Blossom, 0 assigned to the logged-in `admin` user — so the final headline numbers happened not to visibly conflict in this specific case, but the agent/data-model choice is still wrong and would give a materially wrong answer for any user who does have pending runs (e.g. `luna.blossom`, who has 4).

## Evidence

### Console / log

- Verbatim: *"I don't have tools available in this plain chat to look up your To Do list or assignments... Ask me again starting your message with @crux — that will load the full toolset and let me retrieve your assignments for you."*
- Hand-off card: `Ask → Project Manager`, `About → What's on my To Do list?"`.
- Project Manager's answer (verbatim): *"Your open To Do list: #3 [Bug] Write release notes for v1.1 — assigned to you, low priority, awaiting customer response. Due 2026-11-05 (7 days away). That's it — one open issue on your plate."*
- Ground truth, `/testcase_todos?project_id=crux-qa-agent-test-project`: "Total Runs" bar chart + table listing 4 open runs (Overdue Run Fixture, Bulk Status Fixture Run, Sprint 2 Targeted Test, Sprint 1 Regression), all with Assignee = Luna Blossom, none assigned to `admin`.

## Duplicate check

- Duplicate found: Related but not identical to the already-**closed** `BUG-CRX-014` ("domain-agent mis-routing to the Project Manager, false 'no write tools' claim") from the old Redmine 7.0.0 / crux-core 0.92.0 stack — that bug was fixed/closed on the old environment; this is a new recurrence of the same defect class on the current Redmine 6 / crux-core 0.130.0 stack, Testcase-Management domain specifically. The CRM-domain recurrence of the identical Auto-routing defect class is filed separately as **BUG-CRX-096** (different plugin domain, different fixture, kept in its own file per explicit user instruction rather than one combined bug). Also related to, but distinct from, `BUG-CRX-089` (QA Agent's own wrong-data-model substitution once it IS the one answering) — this bug is about Auto's **agent selection** being wrong in the first place, a step before BUG-CRX-089's defect even has a chance to fire.

## Retest — 2026-11-02 — STILL OPEN (partially fixed)

Developer commit (crux-core CRC-71, "gated route to the QA Agent" for To Do phrases) pulled + containers
restarted. Two variants retested as `luna.blossom`, Auto mode, fresh chats:
- **With project named** ("in the Crux QA Agent Test Project, what's on my To Do list?"): now correctly routes to
  QA Agent (confirmed working, see BUG-CRX-089's retest — same message).
- **Bare, no project named** ("What's on my To Do list?"): **still fails** — falls to the generic tool-less
  "Crux" persona: *"I don't have tools available in this chat to look up your To Do list or assignments... Ask
  @crux with a message starting with @crux..."* — the CRC-71 fix's gated route evidently requires a plugin-catalog
  check that isn't firing for this exact bare phrasing (or fires only once a project is already in scope). **Not
  fully fixed** — the project-named case works, the original bare-phrasing repro from this bug's own steps still
  reproduces.

## Retest — 2026-11-02 (3rd round) — STILL OPEN (bare phrasing unfixed)

Pulled crux-core `3812e0f→65053f8` (CRC-74, "agent audit — Auto routing gaps..."). Re-ran the exact bare-phrasing
repro, Auto mode, admin, fresh chat: "What's on my To Do list?" — still falls to the generic tool-less "Crux"
persona: *"I don't have tools available in this chat to look up your To Do list... Ask me again by starting your
message with @crux — that will load the Project Manager agent..."* No automatic handoff card was offered this
time either (contrast with BUG-CRX-113's retest the same round, which did get a genuine handoff proposal for a
similarly-shaped bare request — routing behavior appears inconsistent between runs/phrasings rather than reliably
fixed). CRC-74's own changelog doesn't list "what's on my to do list" among its 46 re-tested routing phrases.
**Not fixed** — the bare, no-project phrasing still requires the user to manually retype with an "@crux" prefix
instead of being routed automatically.

## Retest — 2026-11-03 (4th round, after discovering crux-core/mcp were running a stale image all of round 3) — FIXED

Discovered that `docker compose restart crux-core mcp` never actually rebuilds the image — round 3's retest above
was run against a stale pre-CRC-74 image despite the repo being pulled to `65053f8`. Ran a genuine
`docker compose up -d --build --force-recreate crux-core mcp`, confirmed via `docker images`/container uptime that
the new image is actually running, then re-ran the exact bare-phrasing repro, Auto mode, admin, fresh chat:
"What's on my To Do list?" — now correctly routes to **QA Agent** (avatar "QA," no manual "@crux" needed) and
returns the real plugin To-Do concept: *"You have 4 pending run assignments across the Crux QA Agent Test
Project: Run #1 Sprint 1 Regression..., Run #8 Overdue Run Fixture... (overdue), Run #7 Bulk Status Fixture
Run... (complete), Run #3 Sprint 2 Targeted Test..."* — real run data, not generic issue assignment. **Confirmed
fixed** now that the fix is genuinely running.
