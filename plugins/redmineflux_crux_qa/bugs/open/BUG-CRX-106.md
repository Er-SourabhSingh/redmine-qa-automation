# Bug Report Template

- Bug ID: BUG-CRX-106
- Production Redmine Issue ID: #126320
- Title: Budget Agent silently guesses a numeric project id when asked about a project by display name, returning a different, unrelated project's real budget data with zero error, ambiguity-check, or disclosure
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Budget Agent, Budget & Audit plugin domain)
- Plugin version: redmineflux_budget_and_audit 2.1.0 / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fixture ground truth (DB): `approved_hours` table has exactly 1 row — `project_id=1` ("Crux PM Agent
   Test Project"), `category_id=6`, `hour=40`, comment "Fixture approved hours for time-tracking tests".
   A separate, brand-new project — **Crux Budget Agent Test Project**, `project_id=5` — has ZERO
   `approved_hours` rows (created same session specifically as this suite's fixture, never touched by
   `set_budget`).
2. Fresh chat, Budget Agent (pinned), admin: "What's the budget status for the **Crux Budget Agent Test
   Project**?" — the project is named explicitly and unambiguously by its exact display name.

## Expected result

Per the source's own empty-state handling (`get_budget_status`'s "No approved budget hours found for
project #X" branch) and the persona's own rule ("never invent a budget figure... not present in a real
read"), the agent should either (a) correctly resolve "Crux Budget Agent Test Project" to project id 5 and
report the true, honest empty state, or (b) if it cannot resolve the name with confidence, ask the user for
the numeric id/identifier rather than guessing — matching the pattern already required of the Scrum Agent
for an equivalent situation (TC-CRX-373).

## Actual result

The agent made exactly **one tool call** ("Get budget status") and returned a complete, confident, fully
plausible budget breakdown — but explicitly labeled it as belonging to **"Crux PM Agent Test Project"**
(project id 1), a completely different project never mentioned anywhere in this chat. The figures
themselves are real (`Total approved: 40.0 hours`, `Total spent: 8.5 hours`, `Total remaining: 31.5 hours`,
category "Development - Web Application - Backend (ID: 6)") and match project 1's genuine DB row exactly —
this is not a hallucinated number, it is project 5's budget status silently replaced with project 1's real
data. No error, no clarifying question, no disclosure that the name couldn't be resolved — the agent simply
guessed project id 1 (very plausibly because it's the first/lowest project id on the instance) and reported
its real data under a different project's name in its own reply text.

This is strictly worse than every other wrong-project-resolution bug found so far in this QA cycle
(BUG-CRX-080/093/101): those either eventually surfaced an error (sometimes by luck) or required a
multi-turn chat history to trigger; this one fails on the very FIRST message of a brand-new chat, with a
single, unambiguous, fully-spelled-out project name, and produces a completely clean, error-free, wrong
answer.

## Evidence

### Console / log

- Chat reply (verbatim, relevant portion): *"Here's the budget status for the **Crux PM Agent Test
  Project**: ... Total approved: 40.0 hours, Total spent: 8.5 hours, Total remaining: 31.5 hours ... By
  category: Development - Web Application - Backend (ID: 6) — Approved: 40 hours, Spent: 8.5 hours,
  Remaining: 31.5 hours."*
- DB (`approved_hours` table): exactly 1 row, `project_id=1, category_id=6, hour=40` — matches the agent's
  reported figures exactly, confirming it genuinely queried project 1, not project 5.
- DB (`projects` table): project 5 is genuinely named "Crux Budget Agent Test Project" (the exact name
  given in the chat message), project 1 is genuinely named "Crux PM Agent Test Project" — two distinct,
  unambiguous, differently-named real projects.
- Only 1 tool call made ("Get budget status") — no project-lookup call of any kind preceded it, confirming
  the agent never attempted to resolve the name at all before guessing an id.

## Duplicate check

- Duplicate found: Related to, but a more severe fresh instance of, the wrong-project-resolution class
  already seen on this stack (BUG-CRX-080/093, Testcase-Management domain; BUG-CRX-101, Scrum Agent domain
  on a discovery-gated tool). All three prior instances either required an established multi-turn chat
  history to trigger, or were ultimately blocked by an unrelated permission check. This is the first
  instance that fails on a project's exact display name given in the very first message of a fresh chat,
  with no error of any kind and no lucky permission check to catch it — the Budget Agent has no
  project-name-resolution safeguard at all, unlike the Scrum Agent (TC-CRX-373) or QA Agent (their own
  "Getting the ids right" rules). Kept as its own bug file per this repo's one-bug-per-domain rule.
