# Bug Index — Redmineflux Agile Board

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-AGB-001 | [FIXED] Card-field checkbox labels and the "Story Points"/"Story-Points" field name were partially untranslated across several surfaces — confirmed now fully German everywhere, including the last-remaining "Tags" checkbox on the board-config form | Closed | N/A | 7.0.1.stable |  | bugs/closed/BUG-AGB-001.md |
| BUG-AGB-002 | Board Insights panel: plural issue counts show English "Issues" while singular correctly shows German "Ticket" | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-002.md |
| BUG-AGB-003 | Unassigned-avatar tooltip reads "Unassigned" (English) instead of "Nicht zugewiesen" (project board + Global board) | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-003.md |
| BUG-AGB-004 | Sprint create form ("Neuer Sprint"): 3 of 6 field labels untranslated ("Description", "End date", "Sharing") | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-004.md |
| BUG-AGB-005 | Backlog sprint date ranges and version due-dates render in hardcoded English month format instead of German format | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-005.md |
| BUG-AGB-006 | Admin Configure page: "(Default: ...)" parenthetical untranslated in all 8 priority/tracker icon rows | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-006.md |
| BUG-AGB-007 | [FIXED] Project Settings → Sprints tab: "Freigabe" column showed raw untranslated "not_shared" for pre-existing sprints — confirmed now showing "Nicht geteilt" correctly | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-007.md |
| BUG-AGB-008 | [FIXED] Drag-and-drop status-change confirmation toast was entirely hardcoded English — confirmed now rendering "Ticket #259 verschoben nach RESOLVED" fully in German | Closed | Low | 7.0.1.stable |  | bugs/closed/BUG-AGB-008.md |
| BUG-AGB-009 | [FIXED] Turning Story Points off and on again silently wiped the configured Story Point Values — confirmed now surviving the full off/on cycle | Closed | Medium | 7.0.0 (local Docker) | #120947 | bugs/closed/BUG-AGB-009.md |
| BUG-AGB-010 | [FIXED] A query_id parameter on the Agile Board / Backlog controller crashed with a 500 (FrozenError in retrieve_rf_agile_query) - confirmed now returning a clean 404 | Closed | Medium | 7.0.0 (local Docker) | #120986 | bugs/closed/BUG-AGB-010.md |
| BUG-AGB-011 | [FIXED] Backlog story-points badge went wrong (including negative) after dragging a card between sprint/version columns without a page reload - confirmed now updating live and correctly | Closed | High | 7.0.0 (local Docker) | #120990 | bugs/closed/BUG-AGB-011.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
