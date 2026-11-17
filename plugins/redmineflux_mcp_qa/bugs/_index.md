# Bug Index — Redmineflux MCP Server

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-MCP-001 | `get_testcase`/`update_testcase` MCP tools still don't expose a testcase's Step/Expected Result rows, even though the Testcase Management plugin's own REST API now supports them (BUG-TCM-138 follow-up) | Closed 2026-11-17 — CONFIRMED FIXED, retested through Crux's Testcase Agent chat and native-verified via a direct get_testcase API call; production synced Done/100% | Medium (the plugin-side fix is real, but the documented, intended way to use this feature — chatting with Crux — still can't read or write Step/Expected Result; users are still pushed to the same Description-field workaround BUG-TCM-138 originally reported) | 6.0-bookworm (local Docker instance, localhost:3015) | #128136 | bugs/closed/BUG-MCP-001.md |

## Notes
- Bug ID format: `BUG-MCP-NNN` (changed from `BUG-RFM-NNN` on 2026-11-12 — see CLAUDE.md §4's "RFM → MCP
  rename" note; `workload/bugs/` is a separate legacy sub-area that keeps its own old `BUG-RFM-NNN` IDs)
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
