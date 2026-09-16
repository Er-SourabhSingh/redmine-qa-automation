# Bug Index — Redmineflux Crux

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | Assigned To | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-------------|-----------|
| BUG-CRX-001 | LLM provider "Test Connection" reports false-positive success regardless of key validity | Open | High | 7.0.0 (local Docker) | #120514 | — | bugs/open/BUG-CRX-001.md |
| BUG-CRX-002 | 6 of 9 bundled agents' chat-picker persona text falsely claims read-only behavior (#117162) | Open | Medium | 7.0.0 (local Docker) | #120515 | — | bugs/open/BUG-CRX-002.md |
| BUG-CRX-003 | Global-dashboard gate approval has zero project-scoping logic — dev closed as intentional (production WPs have no project field); disputed locally via `_frozen_target()` counter-evidence, unresolved | Open | High (upgraded from Medium; dev disputes) | 7.0.0 (local Docker) | #120574 | Prashant Chaurasia | bugs/open/BUG-CRX-003.md |
| BUG-CRX-004 | MCP client never recovers from a stale/expired session — one expired session breaks Ask Crux for ALL users until crux-core is manually restarted | Open | High | 7.0.0 (local Docker) | #120575 | Prashant Chaurasia | bugs/open/BUG-CRX-004.md |
| BUG-CRX-005 | "Show the Crux/Agents entry" admin toggles are purely cosmetic — disabling them doesn't restrict access, only hides the menu link | Open | Low-Medium (UX/trust gap, not a security bypass) | 7.0.0 (local Docker) | #120576 | Prashant Chaurasia | bugs/open/BUG-CRX-005.md |
| BUG-CRX-006 | Shared proxy module discards crux-core's real HTTP status on every proxied call — all 12 Crux controllers always answer 200, even when core documents 400/404/etc. | Open | Medium | 7.0.0 (local Docker) | #120606 | Prashant Chaurasia | bugs/open/BUG-CRX-006.md |
| BUG-CRX-007 | Domain-inference chat routing never fires on a bare domain question — only `@crux`, `@AgentName`, or a literal `"Domain,"` prefix actually reaches a tool-equipped agent | Open | Medium | 7.0.0 (local Docker) | #120609 | Prashant Chaurasia | bugs/open/BUG-CRX-007.md |
| BUG-CRX-008 | Chat write-confirm gate never checks Work Package autonomy — a `suggest-only` WP's member tickets CAN be written to via chat, gate approved or not, violating the documented "sacred rule" | Open | Critical | 7.0.0 (local Docker) | #120613 | Prashant Chaurasia | bugs/open/BUG-CRX-008.md |
| BUG-CRX-009 | Improve/Apply confirm endpoint reports `"ok":true` when the write was silently refused by a real permission check — no error surfaced to the user anywhere | Open | High | 7.0.0 (local Docker) | #120616 | Prashant Chaurasia | bugs/open/BUG-CRX-009.md |
| BUG-CRX-010 | A write-confirmed turn's Session Artifact/Keep snapshot captures only the pre-execution proposal text, omitting the real outcome | Open | Medium | 7.0.0 (local Docker) | #120659 | Prashant Chaurasia | bugs/open/BUG-CRX-010.md |
| BUG-CRX-011 | A shared read-only session's viewer can click Confirm on the owner's pending write proposal and genuinely execute it, attributed to the viewer's own identity | Open | Critical | 7.0.0 (local Docker) | #120660 | Prashant Chaurasia | bugs/open/BUG-CRX-011.md |
| BUG-CRX-012 | The `/crux` dashboard controller enforces no permission check at all — any authenticated user can view full fleet cost/spend data, WP pipeline, and Run Ledger | Open | Critical | 7.0.0 (local Docker) | #120661 | Prashant Chaurasia | bugs/open/BUG-CRX-012.md |
| BUG-CRX-013 | Sales Agent can never produce a confirm proposal for moving a deal's stage — `update_deal_stage` intent always self-contradicts ("described a change without actually proposing it") | Open | High | 7.0.0 (local Docker) | #120664 | Prashant Chaurasia | bugs/open/BUG-CRX-013.md |
| BUG-CRX-014 | A follow-up chat turn without a repeated "CRM," prefix silently mis-routes to the Project Manager agent, which falsely claims no CRM write tools exist | Open | High | 7.0.0 (local Docker) | #120665 | Prashant Chaurasia | bugs/open/BUG-CRX-014.md |
| BUG-CRX-015 | "Link contact to deal" demands an unrelated numeric project_id the CRM plugin never exposes anywhere; also a false "contact doesn't exist" negative on a real contact | Open | High | 7.0.0 (local Docker) | #120669 | Prashant Chaurasia | bugs/open/BUG-CRX-015.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
