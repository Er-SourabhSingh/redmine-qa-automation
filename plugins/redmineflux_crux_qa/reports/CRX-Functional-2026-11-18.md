# Redmineflux Crux — Functional Testing Report — 2026-11-18

> One report per testing type per day. This covers the deferred-TC completion pass across 6 platform-surface
> suites (Ask Crux Chat Core, Ask Crux Bubble/Errors, Settings, Project Tab, Run Ledger re-check, Pipelines),
> plus a documentation correction to the Ready Queue suite, all executed in one continuous session on
> 2026-11-18.

## Test Case Execution

| TC ID | Suite | Result | Notes |
|-------|-------|--------|-------|
| TC-CRX-975 | Ask Crux Chat Core | PASS | Bubble `@` confirmed plain text, no autocomplete |
| TC-CRX-981 | Ask Crux Chat Core | PASS | All 3 picker-exclusion rules confirmed (plugin-missing, worker, allow-list) |
| TC-CRX-983 | Ask Crux Chat Core | PASS | Blank default falls back to Auto on cleared storage |
| TC-CRX-986 | Ask Crux Chat Core | FAIL | New bug — BUG-CRX-215 (4th Auto-routing misroute) |
| TC-CRX-997 | Ask Crux Chat Core | FAIL | New bug — BUG-CRX-214 (pin doesn't exempt from 20-chat cutoff) |
| TC-CRX-1000 | Ask Crux Chat Core | PASS | 20-newest retention independently confirmed |
| TC-CRX-1002 | Ask Crux Chat Core | PASS | Personal limit pill format confirmed |
| TC-CRX-1006 | Ask Crux Chat Core | PASS | Copy copies clean answer text only |
| TC-CRX-1007 | Ask Crux Chat Core | PASS | Ask again resends identical question |
| TC-CRX-1009 | Ask Crux Chat Core | PASS | Admin-cap 80%+ warning confirmed |
| TC-CRX-1010 | Ask Crux Chat Core | PASS | Personal-limit-exceeded note, distinct wording confirmed |
| TC-CRX-1025 | Ask Crux Bubble/Errors | PASS | Shared-chat viewer banner + read-only composer confirmed |
| TC-CRX-1027 | Ask Crux Bubble/Errors | PASS | Viewer has no Share button of their own |
| TC-CRX-1030 | Ask Crux Bubble/Errors | PASS | Personal limit is reminder-only, never blocks |
| TC-CRX-1031 | Ask Crux Bubble/Errors | PASS | Personal limit works with zero admin cap configured |
| TC-CRX-1032 | Ask Crux Bubble/Errors | PASS | Confirmed structurally unreachable (native type=number input) |
| TC-CRX-1036 | Ask Crux Bubble/Errors | PASS | Bubble pulse clears after first open on a fresh profile |
| TC-CRX-1047 | Ask Crux Bubble/Errors | PASS | Core-down error message confirmed |
| TC-CRX-1049 | Ask Crux Bubble/Errors | PASS | Unsent text preserved after an error |
| TC-CRX-1050 | Ask Crux Bubble/Errors | PASS | Auto-recovery "Crux is back" message confirmed |
| TC-CRX-1056 | Ask Crux Bubble/Errors | PASS | Untick-everything refused, native-verified no write |
| TC-CRX-1060 | Ask Crux Bubble/Errors | PASS | Honest permission failure for a no-edit-rights user, native-verified |
| TC-CRX-1062 | Ask Crux Bubble/Errors | PASS | One-time rating confirmed, both thumbs disabled after |
| TC-CRX-1064 | Ask Crux Bubble/Errors | PASS | Each Improve action gets its own Run Ledger row |
| TC-CRX-891 | Settings | PASS | 80% budget warning, exact wording |
| TC-CRX-892 | Settings | PASS | 100% cap genuinely blocks |
| TC-CRX-893 | Settings | PASS | UTC reset consistency + per-user isolation |
| TC-CRX-894 | Settings | PASS | Immediate effect, both directions |
| TC-CRX-895 | Settings | PASS | Blank = genuinely unrestricted |
| TC-CRX-896 | Settings | PASS | Show-Crux toggle live-updates top menu |
| TC-CRX-897 | Settings | PASS | Show-Agents toggle live-updates top menu |
| TC-CRX-898 | Settings | PASS | Custom top-menu caption + revert |
| TC-CRX-899 | Settings | FAIL | New bug — BUG-CRX-217 (Accent color doesn't live-preview) |
| TC-CRX-900 | Settings | PASS | Saved bubble position/icon match on a real page |
| TC-CRX-901 | Settings | PASS | Suggested prompts on both bubble and full-page surfaces |
| TC-CRX-902 | Settings | PASS | Per-role default agent scoped to the bubble |
| TC-CRX-903 | Settings | PASS | Launch teaser lifecycle confirmed |
| TC-CRX-905 | Settings | FAIL | New bug — BUG-CRX-216 (excluded agent stays selectable) |
| TC-CRX-906 | Settings | FAIL | Same bug as 905 |
| TC-CRX-916 | Settings | PASS | Honest core-down hint on Chat budget field |
| TC-CRX-919 | Settings | PASS | Remaining 4 jump links confirmed |
| TC-CRX-800 | Project Tab | PASS | Upgraded from partial — native datalist confirmed, real Focus-switch on select |
| TC-CRX-856 | Pipelines | PASS | All 3 non-built-in outcome types (customer-support/lead-to-deal/billing) now create real WPs |

**Summary:** 38 PASS / 4 FAIL (3 new bugs, 2 TCs share BUG-CRX-216) / 0 blocked / 0 deferred remaining in any of
these 6 suites.

Run Ledger suite was also re-checked this session (no TC execution needed — already had 0 deferred; TC-788/789
correctly remain "blocked," not "deferred," since this environment still has only one LLM provider configured).

Ready Queue suite had no TC work today — a stale "BUG-CRX-174, still open" line in its own Suite status summary
was corrected (the bug was actually fixed and closed back on 2026-11-11); see Notes below.

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-CRX-214 | Pinning a chat does not exempt it from the global "20 newest chats" retention | Medium | Open | #128994 |
| BUG-CRX-215 | Auto-mode routing sends a "team workload and capacity" question to Project Manager instead of Workload Agent, reproduced 2/2 | Medium | Open | #128995 |
| BUG-CRX-216 | An agent excluded via Settings → Chat agents remains the persisted picker selection and genuinely answers | Medium | Open | #129011 |
| BUG-CRX-217 | Settings → Ask Crux bubble live preview does not reflect Accent color changes | Medium | Open | #129012 |

All 4 reported to production today, each linked via `report_defect` to their own platform suite's matching
production test case (Ask Crux Chat Core → #127943, Settings → #127940), Run #607, Environment
"Window 11 + Chrome", category Crux Plugin, assigned Prashant Chaurasia, per explicit user approval.

## Notes / Findings

- Redmine Version: 6.0-bookworm (local Docker instance, localhost:3015)
- Environment: Local
- Test Date: 2026-11-18
- Tested via: Claude + Playwright MCP (browser-driven; several TCs required temporary, reverted environment
  changes — Settings fields, admin chat budget cap, Core service URL, a `CRUX_COMPONENT_CF_IDS`-style
  deliberate break/restore pattern reused from an earlier session's own established technique).
- **BUG-CRX-174 documentation correction**: the Ready Queue suite's own "Suite status" summary line said
  "BUG-CRX-174, still open," which was stale — the bug was genuinely fixed and closed on 2026-11-11 (developer
  marked "In QA", production #127945 synced to Done at that time). The suite file's prose simply never got
  updated after that fix landed, well before this session's later passes on the same suite. Corrected the text
  in place; no bug reported (there was nothing to report — it's already fixed).
- A recurring defect-class lesson surfaced this session: a fix for "a persisted/URL-param agent selection
  should fall back when invalid" (BUG-CRX-180, closed) had its own retest scope cover only 2 of the 3
  documented ignore conditions — the 3rd (excluded by the live Chat-agents allow-list) was still broken,
  found simply by checking each condition TC-CRX-984 itself enumerates. Filed as the new BUG-CRX-216 rather
  than reopening BUG-CRX-180, per this repo's uncovered-trigger-path convention.
- This session's browser-automation tooling can only hold one logged-in identity at a time (logging into a
  second user ends the first's session in the same cookie jar, even across tabs) — this genuinely blocks a
  small number of TCs needing two *simultaneous* live sessions (TC-CRX-1026, 1045, 1046), left deferred for
  that reason specifically, not a product gap.
- Full handoff narrative for today's session, including the Run History gap this file flags for 2026-11-11
  through 2026-11-17, is in `docs/CRUX_HANDOFF.md`'s 2026-11-18 entry. Memory lessons from today (native
  `<datalist>` vs. custom overlay; single-browser-context constraint; the persisted-selection-ignore-condition
  recurring class) are in `docs/CRUX_MEMORY.md`.
- Screenshots for this session's bugs saved to `screenshots/BUG-CRX-214/`, `BUG-CRX-215/`, `BUG-CRX-216/`,
  `BUG-CRX-217/`; TC-800's own evidence screenshot is in `screenshots/TC-CRX-800/`.
