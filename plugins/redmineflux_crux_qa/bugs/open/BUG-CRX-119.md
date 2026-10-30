# Bug Report Template

- Bug ID: BUG-CRX-119
- Production Redmine Issue ID: #126689
- Title: Time Agent produces a dead-end, non-actionable response ("described a change without actually proposing it") instead of a real write proposal when a request's phrasing names a specific field value (e.g. "active=true") — burns tens of thousands of tokens for zero progress, recurring across unrelated tool calls
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright) / direct chat token-usage review
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, in a chat pinned to the Time Agent, ask: "Create a new approval schema named 'Crux Active Test Schema' with one level, approver role Manager, and make sure it is set Active (active=true) so it is usable immediately."
2. Observe the response.
3. Separately, later in the same session, ask: "Please delete schema ID 3." (a plain, simple request with no explicit field-value phrasing).
4. Observe the response.

## Expected result

- Every request that maps to a real tool call should either produce a genuine, confirmable `Write` proposal (as happened for every other schema create/update/activate request in this same session), or a clear, immediate statement that the requested action/field is unsupported — not a response that describes the action in prose and then admits it never actually built a proposal.

## Actual result

- **Step 1/2** (create with explicit "active=true"): the agent responded: *"I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."* Cost: 85,010 input tokens / 462 output tokens / $0.02, zero schema created, zero progress. Retrying with simpler phrasing (dropping "active=true" entirely) on the very next message succeeded cleanly and produced a normal confirm proposal.
- **Step 3/4** (unrelated schema-delete retry, same session): the identical dead-end response text appeared again: *"I described a change without actually proposing it..."* Cost: 53,563 input tokens / 326 output tokens / $0.01, again zero progress.
- This exact failure text occurred twice in one session on two unrelated requests (schema creation with a stated field value, and schema deletion), suggesting a recurring, non-isolated failure mode in the agent's propose/confirm pipeline — not a one-off fluke tied to a single phrasing. Combined token cost across both occurrences: ~138,500 input tokens / ~788 output tokens for two turns that accomplished nothing, consistent with this session's standing cost-efficiency watch (recurrence class of BUG-CRX-078/BUG-CRX-115: disproportionate token spend for no real tool call completed).

## Evidence

### Console / log

- Turn 1 full response text quoted above, 85,010 in / 462 out / $0.02.
- Turn 2 (schema-delete retry) full response text identical in structure, 53,563 in / 326 out / $0.01.
- Immediate next-turn success for the same underlying create action once "active=true" phrasing was dropped, confirming the field-value phrasing (not the action itself) is what triggers this dead-end path in at least one of the two occurrences.

## Duplicate check

- Duplicate found: No new root cause filed as a separate class — this is a **recurrence of the BUG-CRX-078 cost-inefficiency/dead-end-turn class** (see also BUG-CRX-115, the Time Agent's settings-question cache-rebuild recurrence), on a new trigger path (the propose/confirm pipeline itself failing to materialize a proposal, rather than excess reasoning rounds before a successful tool call). Filed as a separate bug per this repo's standing convention of filing recurrences of an already-identified defect class on a new trigger path.
