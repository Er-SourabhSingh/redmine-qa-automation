# Bug Report Template

- Bug ID: BUG-CRX-078
- Production Redmine Issue ID:
- Title: A single chat turn repeatedly rebuilds its full context cache 3 times within the same turn (3 real cache-misses, each strictly larger than the last) instead of reusing the session's warm cache, driving one reply to $0.1187 — roughly 10-40x this session's typical per-turn cost — while still landing on a wrong answer
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Manager agent)
- Plugin version: 0.62.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, Manager role, WITH `manage_members` permission genuinely granted and DB-verified)
- Date: 2026-10-26

## Steps to reproduce

1. As `luna.blossom` (Manager role, `manage_members` genuinely granted), open a **fresh** Ask Crux chat (session `ses-042`) on "Crux PM Agent Test Project".
2. Send one message with every fact the agent needs already included, specifically to avoid forcing extra round-trips: "hey can you bump aurora wren (user id 15) up to developer on the crux pm agent test project? she's doing more than reporting now" (project name given, target user's numeric ID given up front, intent given up front).
3. Inspect `docker compose logs crux-core` for session `ses-042`, filtering on `cost_usd` and the final `chat turn` summary line.

## Expected result

A single chat turn, especially one where the user supplied every needed fact (project name, numeric user ID, target role intent) in the opening message, should need at most 1-2 LLM calls after the first tool-discovery pass, reusing the session's already-warm prompt cache (`cache_read` on every call after the first) — consistent with the cost of every other turn observed in this same session ($0.003-$00.01 range, single-digit-cent).

## Actual result

The turn's own summary line: `chat turn agent=project-manager provider=openrouter model=anthropic/claude-haiku-4.5 latency_ms=17033.0 tokens_in=156713 tokens_out=824 tool_calls=4 outcome=success` — **156,713 input tokens and $0.1187 total** for one reply, 4 real tool calls across **6 separate LLM calls**:

| # | tokens_in | tokens_out | cost_usd | cache_read | cache_write |
|---|-----------|------------|----------|------------|-------------|
| 1 | 19,780 | 80 | 0.02503625 | 0 | 19,425 |
| 2 | 20,189 | 75 | 0.00308150 | 19,425 | 0 |
| 3 | 26,331 | 140 | 0.03337525 | 0 | 25,377 |
| 4 | 26,306 | 133 | 0.00413170 | 25,377 | 0 |
| 5 | 26,498 | 188 | 0.00459870 | 25,377 | 0 |
| 6 | 37,609 | 208 | 0.04751375 | 0 | 35,459 |

**Total: $0.11873715** (rounds to the $0.12 shown in the chat UI).

- Calls #1, #3, and #6 are each a **full cache-miss** (`cache_read=0`, paired with a `cache_write` strictly larger than the previous one: 19,425 → 25,377 → 35,459) — i.e. the context was rebuilt from scratch **3 separate times within one single turn**, each time paying the expensive non-cached write rate instead of the cheap cache-read rate, and each rebuild growing larger than the last (suggesting accumulating context rather than a clean restart).
- Only calls #2, #4, #5 got the cheap `cache_read` path, and even those still re-sent 20k-26k input tokens each.
- Despite spending 6 LLM calls and $0.12, the turn still ended on the **wrong answer** — a false denial ("I couldn't find a tool for this here...") for a request whose real tool (`redmineflux_core_update_project_membership`) genuinely exists (see **BUG-CRX-061**, this is folded in there as a new repro for the answer-correctness angle). This bug is scoped only to the **cost/performance** defect — the fact that getting to (the wrong) answer cost 10-40x what every other comparable turn in this session cost, via repeated avoidable cache invalidation rather than genuine new work.
- For comparison, 3 other turns from the same investigation (same chat UI, same project, same agent, earlier in this same session) cost $0.01, $0.0057, and $0.0029 respectively — all well under 1/10th of this turn's cost.

## Evidence

### Console / log

```
2026-10-26T10:49:05.243+00:00 INFO mcp call tool=tools/list duration_ms=46.1 ok=true tools=485
2026-10-26T10:49:07.293+00:00 INFO openrouter generation id=gen-1793011745-... tokens_in=19780 tokens_out=80  cost_usd=0.02503625 cache_read=0     cache_write=19425
2026-10-26T10:49:09.070+00:00 INFO openrouter generation id=gen-1793011747-... tokens_in=20189 tokens_out=75  cost_usd=0.0030815  cache_read=19425 cache_write=0
2026-10-26T10:49:11.459+00:00 INFO openrouter generation id=gen-1793011749-... tokens_in=26331 tokens_out=140 cost_usd=0.03337525 cache_read=0     cache_write=25377
2026-10-26T10:49:11.546+00:00 INFO mcp call tool=redmineflux_core_list_project_memberships duration_ms=86.9 ok=true
2026-10-26T10:49:11.571+00:00 INFO mcp call tool=redmineflux_core_list_roles duration_ms=24.2 ok=true
2026-10-26T10:49:14.289+00:00 INFO openrouter generation id=gen-1793011752-... tokens_in=26306 tokens_out=133 cost_usd=0.0041317  cache_read=25377 cache_write=0
2026-10-26T10:49:17.791+00:00 INFO openrouter generation id=gen-1793011754-... tokens_in=26498 tokens_out=188 cost_usd=0.0045987  cache_read=25377 cache_write=0
2026-10-26T10:49:22.227+00:00 INFO openrouter generation id=gen-1793011758-... tokens_in=37609 tokens_out=208 cost_usd=0.04751375 cache_read=0     cache_write=35459
2026-10-26T10:49:22.264+00:00 INFO chat turn agent=project-manager provider=openrouter model=anthropic/claude-haiku-4.5 latency_ms=17033.0 tokens_in=156713 tokens_out=824 tool_calls=4 outcome=success
```

## Note for triage

This is this session's first *directly measured, log-grounded* instance of the cost-inefficiency pattern the user explicitly asked to be watched for and bug-filed going forward (see `CRUX_MEMORY.md`'s "Standing instruction — cost efficiency" note, 2026-10-26). Only 4 real tool calls were made (`list_project_memberships`, `list_roles`, plus 2 more implied by the call count), yet the LLM layer itself was invoked 6 times, with 3 of those being full, non-cached context rebuilds rather than the normal cached continuation — each one larger than the last, suggesting something in the per-request context assembly (e.g. tool list, conversation history serialization, or the discovered-tools disclosure block) is not stable/deterministic across calls within the same turn, defeating the prompt cache repeatedly instead of once at the top of the turn as expected. Worth checking whether this correlates with BUG-CRX-060's separately-documented "per-turn token-budget stall during tool discovery" pattern — both could share a root cause in how this agent's tool-discovery/context-assembly step behaves once Members-domain requests are involved, though BUG-060 stalls outright (never reaches a final answer) while this turn did terminate, just at a very high cost.

## Duplicate check

- Duplicate found: No. Distinct from the already-CLOSED **BUG-CRX-065** ("wasted tool calls" — that bug was about burning 10 *tool* calls checking individual issues one-by-one instead of using the one purpose-built tool; this bug is about repeated *LLM-layer* cache-invalidation within a single turn, a different mechanism, and is based on real `cost_usd`/`cache_read`/`cache_write` log figures rather than tool-call count alone). Related to, but filed separately from, **BUG-CRX-061** (the wrong-answer false-denial this same turn produced) and **BUG-CRX-060** (the token-budget-stall shape for Members Create) — this bug is scoped only to the turn's cost/performance, not its correctness.
