# Redmineflux Crux — Functional Testing Report — 2026-11-12

> One report per testing type per day. This covers the Graph interactive TCs (Project Tab suite) and Pipeline
> Validation TCs (Pipelines suite) executed on 2026-11-12. Work Packages deferred TCs (TC-760, 762, 763, 765,
> 766, 767) were executed earlier this session and committed separately (commit ae60fe3).

## Test Case Execution

| TC ID | Suite | Result | Notes |
|-------|-------|--------|-------|
| TC-CRX-760 | Work Packages | PASS | suggest-only autonomy confirmed in list label |
| TC-CRX-762 | Work Packages | PASS | Edit/delete WP refused with honest message |
| TC-CRX-763 | Work Packages | PASS | Custom pipeline choice not offered via chat |
| TC-CRX-765 | Work Packages | PASS | @-mention replied zero times on suggest-only WP ticket |
| TC-CRX-766 | Work Packages | FINDING | WP confirm card built for non-existent ticket #99999 without pre-check |
| TC-CRX-767 | Work Packages | PASS | Project-scoped WP list shows only that project's WPs |
| TC-CRX-768 | Work Packages | PARTIAL | No WP at gate, review-button scope not confirmable |
| TC-CRX-WP-14.3 | Work Packages | PASS | WP section on issue #62 confirmed correct |
| TC-CRX-799 | Project Tab (Graph) | PASS | Grouped/Focus/Table all render; Show-filter checkboxes each update graph |
| TC-CRX-800 | Project Tab (Graph) | PARTIAL | Search typed, no crash; autocomplete overlay not in accessibility tree |
| TC-CRX-805 | Project Tab (Graph) | PASS | Zoom absent in Table view, present in Grouped/Focus |
| TC-CRX-811 | Project Tab (Graph) | PASS | No-match search — no crash, stable state |
| TC-CRX-812 | Project Tab (Graph) | PASS | Fit button genuinely resets zoom |
| TC-CRX-813 | Project Tab (Graph) | PASS | All filters unchecked → graph empties without crash |
| TC-CRX-862 | Pipelines | PASS | 1-stage save → "Add at least two stages" error |
| TC-CRX-865 | Pipelines | PASS | Gate before-dropdown restricted to existing stages; invalid target impossible by design |
| TC-CRX-866 | Pipelines | PASS | Missing gate before last stage rejected with specific error |
| TC-CRX-867 | Pipelines | PARTIAL | Delete dialog pre-states "can't delete if WP created from it"; server rejection unconfirmed (no custom-pipeline WP fixture) |

**Summary:** 13 PASS / 2 PARTIAL / 1 FINDING / 2 DEFERRED / 0 FAIL / 0 formal bugs filed

Deferred this session: TC-808/809 (zero-activity graph banner — project creation failed twice), TC-855/869
(non-manager pipeline browsing — no clean view-only user fixture).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Notes |
|--------|-------|----------|--------|-------|
| TC-CRX-766 finding | PM agent creates WP confirm card for non-existent ticket #99999 without pre-confirmation ticket check | TBD | Finding — not formally filed (pending developer clarification on whether server-side validation rejects creation on Confirm) | Found 2026-11-12 via WP deferred TC pass |

No new formal bug files created this session. BUG-MCP-001 was reported to production (#128136) earlier this
session (separate commit, 7fc7bc8). BUG-TCM-139 retest resulted in NOT FIXED (commit b7f6194).

## Notes / Findings

- Redmine Version: 6.0-bookworm (local Docker instance, localhost:3015)
- Environment: Local
- Test Date: 2026-11-12
- Tested via: Claude + Playwright MCP (browser-driven, special-case mode per CLAUDE.md §13 — Graph SVG
  interactions and confirmation-time behaviors not testable via standard Playwright specs)
- TC-766 finding requires developer input before filing formally: if server-side validation on Confirm rejects
  the creation with a clear error, this is a UX gap only (late validation). If it silently creates a WP with a
  404-ticket reference, it is a data-integrity bug. The Confirm button was not clicked in this session to
  avoid creating broken fixture data.
- TC-800 / TC-801 / TC-802 / TC-803 / TC-804: Graph search autocomplete and SVG node click interactions
  cannot be fully confirmed via ARIA accessibility tree (SVG canvas elements have no accessible roles).
  These require Playwright spec runs with coordinate-based click tooling.
- Screenshots for this session's TCs saved to `screenshots/TC-CRX-799/`, `TC-CRX-800/`, `TC-CRX-808/`,
  `TC-CRX-811/`, `TC-CRX-812/`, `TC-CRX-813/`, `TC-CRX-862/`, `TC-CRX-866/`, `TC-CRX-867/`.
