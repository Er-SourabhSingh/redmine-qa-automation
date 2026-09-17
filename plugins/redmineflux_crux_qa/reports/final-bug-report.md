# Final Bug Report — Redmineflux Crux

> Generated from bugs/open/. PDF only on explicit user request.
> Regenerated: 2026-09-17

## Summary

| Total | Critical | High | Medium-High | Medium |
|-------|----------|------|--------------|--------|
| 17 | 1 | 9 | 2 | 5 |

## Open Bugs

| Bug ID | Title | Severity | Production Issue | File |
|--------|-------|----------|-------------------|------|
| BUG-CRX-008 | Chat write-confirm gate never checks Work Package autonomy — a `suggest-only` WP's member tickets CAN be written to via chat, gate approved or not, violating the documented "sacred rule" | Critical | #120613 | bugs/open/BUG-CRX-008.md |
| BUG-CRX-009 | Improve/Apply confirm endpoint reports `"ok":true` when the write was silently refused by a real permission check — no error surfaced to the user anywhere | High | #120616 | bugs/open/BUG-CRX-009.md |
| BUG-CRX-013 | Sales Agent (and, platform-wide, several other domain agents) can never produce a confirm proposal for many named-record write intents — self-contradicts ("described a change without actually proposing it") | High | #120664 | bugs/open/BUG-CRX-013.md |
| BUG-CRX-016 | redmineflux-mcp's one-shot startup plugin-detection has no retry — if Redmine isn't reachable within 60s of MCP boot, ALL plugin tools are silently and permanently disabled until MCP is manually restarted | High | #120696 | bugs/open/BUG-CRX-016.md |
| BUG-CRX-017 | Capacity Agent's bulk-member-removal falsely reports two real members as "not currently members" using their own usernames right after listing those same usernames as current members | Medium | #120704 | bugs/open/BUG-CRX-017.md |
| BUG-CRX-018 | Allocation resize/date-update tools reject the exact ID the Workload Add Issue tool just returned; misleading "✓"-prefixed failure now confirmed on 4 domain agents/4 failure types | High | #120705 | bugs/open/BUG-CRX-018.md |
| BUG-CRX-019 | Leave Create silently resolves an unrecognized username to User ID 0 instead of erroring or asking | High | #120706 | bugs/open/BUG-CRX-019.md |
| BUG-CRX-022 | The `/crux/agents` controller enforces no permission check at all — any authenticated user can view full agent fleet spend/cap and provider/model data | High | #120720 | bugs/open/BUG-CRX-022.md |
| BUG-CRX-023 | KB Agent's `list_spaces` enforces no Knowledge Base permission check — a user with zero KB permissions can read real space/page data via chat | Medium-High | #120756 | bugs/open/BUG-CRX-023.md |
| BUG-CRX-024 | QA Agent's `list_test_suites` enforces no Testcase Management permission check | Medium | #120757 | bugs/open/BUG-CRX-024.md |
| BUG-CRX-025 | Budget Agent's `get_budget_status` enforces no permission check at all — real approved-hours/spend figures exposed to a user with zero Budget permissions | Medium-High | #120758 | bugs/open/BUG-CRX-025.md |
| BUG-CRX-026 | Scrum Agent fabricates a plausible "0 items, backlog empty" answer instead of honestly reporting the Agile plugin is entirely unreachable | High | #120759 | bugs/open/BUG-CRX-026.md |
| BUG-CRX-027 | Correcting a validation error via a follow-up message produces a fabricated "Still PENDING" proposal with zero real Confirm/Cancel buttons | High | #120763 | bugs/open/BUG-CRX-027.md |
| BUG-CRX-028 | `update_invoice` on an already-Sent invoice fabricates a "✓ updated successfully" confirmation with zero real Confirm button — write never persists; also confirmed on 2 more Capacity Agent action types | High | #120768 | bugs/open/BUG-CRX-028.md |
| BUG-CRX-029 | QA Agent falsely claims "no write tools are available in this deployment," contradicting multiple real write tool successes earlier in the same session | Medium | #120782 | bugs/open/BUG-CRX-029.md |
| BUG-CRX-030 | QA Agent's `remove_testcases_from_suite` genuinely un-scopes a testcase entirely, contradicting the plugin's own documented "immutable scope" rule | Medium | #120784 | bugs/open/BUG-CRX-030.md |
| BUG-CRX-031 | Scrum Agent's `move_issue` resolves the real "Rejected" board column to two different wrong statuses on consecutive attempts | Medium | #120785 | bugs/open/BUG-CRX-031.md |

## Notes

- All 17 open bugs are assigned to Prashant Chaurasia (`ztflux`, user id 410) except where noted, and all have been reported to production with the Production Issue ID recorded above.
- BUG-CRX-013 is explicitly held back from retest per the dev's own instruction pending his in-progress fix.
- BUG-CRX-018 and BUG-CRX-028 are both confirmed as systemic, cross-agent defects (not scoped to a single domain agent) — see `docs/CRUX_MEMORY.md` Recurring Issues for the consolidated cross-agent evidence.
- 14 bugs have been fixed and closed this engagement (`bugs/closed/`): BUG-CRX-001, 002, 003, 004, 005, 006, 007, 010, 011, 012, 014, 015, 020, 021.

## Environment

- Redmine Version: 7.0.0 (local Docker)
- Environment: Local (`crux-redmine`, `http://localhost:3014`)
- Test Date: 2026-09-10 through 2026-09-17 (ongoing engagement)
