# Bug Report Template

- Bug ID: BUG-CRX-115
- Production Redmine Issue ID: #126685
- Title: Time Agent burns 8 LLM round-trips and a full 497-tool `tools/list` dump for a single simple settings question — recurrence of the BUG-CRX-078 cost-inefficiency class on the discovery-gated `timesheet` tool group
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright) / direct crux-core log review
- User role: `luna.blossom` (Manager — non-admin)
- Date: 2026-10-30

## Steps to reproduce

1. Fresh chat, Time Agent (pinned), as `luna.blossom` (non-admin).
2. "Please change the auto-approve threshold to 5 hours."
3. Observe the real crux-core log for this session (`docker logs crux-redmine6-crux-core-1`), not just the
   chat UI's own summary.

## Expected result

A single settings-permission question like this should resolve in a small, bounded number of LLM
round-trips (1-3, matching this plugin's own typical pattern observed elsewhere this session — e.g. the
Project Setup Agent suite averaged 1-2 LLM calls per turn, `cache_read` consistently reused). The agent
should discover the `timesheet` tool group once, call `settings_get` (or attempt `settings_update`,
correctly refused), and reply — not repeatedly re-reason without making any new tool call.

## Actual result

The real crux-core log for this single turn shows:

```
mcp call tool=tools/list duration_ms=451.0 ok=true tools=497
openrouter generation tokens_in=9946  tokens_out=104 cache_read=0     cache_write=9417   (LLM call 1)
openrouter generation tokens_in=10087 tokens_out=50  cache_read=9417  cache_write=0      (LLM call 2 — no new tool call)
openrouter generation tokens_in=10523 tokens_out=99  cache_read=9417  cache_write=0      (LLM call 3 — no new tool call)
openrouter generation tokens_in=10328 tokens_out=55  cache_read=9417  cache_write=0      (LLM call 4 — no new tool call)
openrouter generation tokens_in=10769 tokens_out=99  cache_read=9417  cache_write=0      (LLM call 5 — no new tool call)
openrouter generation tokens_in=10574 tokens_out=190 cache_read=9417  cache_write=0      (LLM call 6 — no new tool call)
openrouter generation tokens_in=23122 tokens_out=96  cache_read=6430  cache_write=14011  (LLM call 7 — a SECOND full cache-miss/rebuild, only partial reuse)
mcp call tool=redmineflux_timesheet_settings_get duration_ms=118.4 ok=true               (the ONLY real tool call this entire turn)
openrouter generation tokens_in=23278 tokens_out=69  cache_read=20441 cache_write=0      (LLM call 8 — final reply)
chat turn: tokens_in=108627 tokens_out=762 tool_calls=6 outcome=success
```

**8 separate LLM round-trips, a full 497-tool `tools/list` dump, and a second partial cache-miss
(`cache_write=14011` on call 7, after call 1 had already written a 9417-token cache) — for a single turn
whose entire real work was one `settings_get` read followed by an honest "admin-only" refusal.** Total cost
for this one turn: **108,627 input tokens, $0.05** — roughly 10-40x the typical per-turn cost observed
elsewhere in this same QA session for comparable single-tool-call turns (most ranged $0.0014-$0.03 across
the Project Setup Agent and Budget Agent suites).

This is the same defect class as the already-closed **BUG-CRX-078** ("a single chat turn rebuilds its full
context cache 3 separate times... instead of reusing the warm session cache, driving one reply to
$0.1187") — that fix was confirmed closed for its originally-tested trigger paths, but this is a
**recurrence on a new trigger path**: the Time Agent's discovery-gated `timesheet` tool group access
(`settings_get`/`settings_update` are NOT in the agent's static `allowed_tools` — they require
`crux_discover_tool_groups`/`crux_discover_group_tools` first, per the persona's own Identity section),
which appears to be driving multiple unproductive reasoning rounds before the real tool call ever fires.

## Evidence

### Console / log

- Full log excerpt quoted above, captured via `docker logs crux-redmine6-crux-core-1 --since
  2026-10-30T10:13:00` for session `ses-195`, run `run-421`.
- Chat UI's own displayed total for this single turn: `tokens_in: 108,627 / tokens_out: 762 · $0.05`.
- Contrast: the chat's own final reply content was a short, honest, single-paragraph admin-only refusal —
  entirely disproportionate to the token/cost spent reaching it.

## Duplicate check

- Duplicate found: No new root cause filed as a separate class — this is a **recurrence of the
  already-fixed BUG-CRX-078** on a different trigger path (Time Agent's discovery-gated `timesheet` group,
  not previously covered by that fix's scope). Consistent with this repo's standing convention of filing
  recurrences of an already-fixed defect class as new bugs when the specific trigger differs (see
  BUG-CRX-027, BUG-CRX-056/077, BUG-CRX-082, BUG-CRX-112 for the same pattern on other defect classes).
