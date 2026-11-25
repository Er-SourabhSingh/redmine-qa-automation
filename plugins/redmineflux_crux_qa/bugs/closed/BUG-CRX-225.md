# Bug Report Template

- Bug ID: BUG-CRX-225
- Production Redmine Issue ID: <!-- not yet reported to production -->
- Title: Workload Agent's "add issue to workload" confirm card resolves the wrong workload id (#3 instead of the real #1) for a correctly, unambiguously named workload
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_crux (Workload Agent)
- Plugin version: crux-core 1.18.0 (CRC-124)
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-20

## Steps to reproduce

1. Found during the 2026-11-20 happy-flow regression re-verification of TC-CRX-541 ("Add issue to workload").
2. Fresh chat, Workload Agent pinned. Earlier in the SAME chat, asked two prior reads naming "Crux Capacity
   Sprint 1" by name — both resolved correctly (a `conflicts` read citing "Workload #2" as a *different*,
   correctly-named workload it compared against, and an issues-list read that correctly listed "4 issues on
   Crux Capacity Sprint 1").
3. Then asked: "Add issue #190 to the Crux Capacity Sprint 1 workload."
4. Confirm card appeared showing `Workload: 3`, `Issue: 190`.
5. Cancelled (did not confirm) and asked directly: "What is the numeric workload id for 'Crux Capacity Sprint
   1'?" — answered correctly: `#1`.

## Expected result

- The confirm card for "add issue to [named workload]" should resolve to the same, correct workload id (#1)
  that the agent itself gives when asked directly in the same chat, especially given two prior correct
  resolutions of the same workload name earlier in this exact conversation.

## Actual result

- The `Workload Add Issue` confirm card showed `Workload: 3` — a real, different workload record, not #1.
  Cancelled before confirming (not forced through), so no incorrect write landed. Confirmed via a direct
  follow-up question in the same chat that the agent itself knows the real id is `#1` when asked plainly —
  the mismatch is specific to how the write-path batch/plan resolves the workload id, not a lack of knowledge.
- Same general shape as the repo's well-documented wrong-target-resolution family (BUG-CRX-080/093/101/133/
  140/187/224 — a write resolving a different record than the one named/implied earlier in the same
  conversation), but the first instance found on the Workload Agent's `add_issue` tool specifically.

## Evidence

### Console / log

- Session `ses-603`. Chat order: (1) "What teams exist?" (2) "Any scheduling conflicts on the Crux Capacity
  Sprint 1 workload? Also, who's on leave today?" — correctly cited "Workload #2" (test w1) as the
  *comparison* workload, implying Sprint 1 itself was already correctly scoped internally. (3) "What issues
  are currently on the Crux Capacity Sprint 1 workload?" — correctly listed 4 real issues. (4) "Add issue
  #190 to the Crux Capacity Sprint 1 workload." — confirm card showed `Workload: 3` (wrong). (5) Cancelled.
  (6) "What is the numeric workload id for 'Crux Capacity Sprint 1'?" — correctly answered `#1`.

## Duplicate check

- Duplicate found: No — first instance of the wrong-target-resolution family on the Workload Agent's
  `add_issue` write path.
- Existing bug reference (related class, not duplicate): BUG-CRX-080, BUG-CRX-093, BUG-CRX-101, BUG-CRX-133,
  BUG-CRX-140, BUG-CRX-187, BUG-CRX-224
