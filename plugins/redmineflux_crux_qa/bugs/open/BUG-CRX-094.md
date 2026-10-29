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
