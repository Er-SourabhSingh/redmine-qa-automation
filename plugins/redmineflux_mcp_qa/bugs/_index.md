# Bug Index — Redmineflux MCP Server

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-RFM-001 | `get_testcase`/`update_testcase` MCP tools still don't expose a testcase's Step/Expected Result rows, even though the Testcase Management plugin's own REST API now supports them (BUG-TCM-138 follow-up) | Open — found 2026-11-12, retested via Crux's Testcase Agent chat per user request, root-caused live against `services/redmineflux-mcp/src/tools/testcases_management.py` source | Medium (the plugin-side fix is real, but the documented, intended way to use this feature — chatting with Crux — still can't read or write Step/Expected Result; users are still pushed to the same Description-field workaround BUG-TCM-138 originally reported) | 6.0-bookworm (local Docker instance, localhost:3015) | | bugs/open/BUG-RFM-001.md |

## Notes
- Bug ID format: `BUG-RFM-NNN`
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
