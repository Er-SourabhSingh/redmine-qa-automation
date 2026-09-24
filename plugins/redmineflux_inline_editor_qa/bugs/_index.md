# Bug Index — Redmineflux Inline Editor

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-INE-001 | [FIXED] Inline searchable-dropdown widget's "Search…" placeholder and "— None —" option were hardcoded English — confirmed now "Suche"/"Keine" | Closed | Medium | 7.0.1.stable | | bugs/closed/BUG-INE-001.md |
| BUG-INE-002 | [FIXED] Inline-edit error toast's "Could not save:" prefix was hardcoded English — confirmed now "Konnte nicht gespeichert werden:" | Closed | Medium | 7.0.1.stable | | bugs/closed/BUG-INE-002.md |
| BUG-INE-003 | [FIXED] Shared post-save "Saved successfully." toast and Description's CKEditor "Cancel"/"Save" buttons were hardcoded English — confirmed now "Erfolgreich gespeichert."/"Abbrechen"/"Speichern" | Closed | Medium | 7.0.1.stable | | bugs/closed/BUG-INE-003.md |
| BUG-INE-004 | [FIXED] Interim "Saving…" loading indicator was hardcoded English — confirmed now "Wird gespeichert…" | Closed | Low | 7.0.1.stable | | bugs/closed/BUG-INE-004.md |
| BUG-INE-005 | [FIXED] Inline editor's issue-list Subject field bypasses the 255-character length validation the standard Edit form enforces | Closed | Medium | 7.0.0 | #121112 | bugs/closed/BUG-INE-005.md |
| BUG-INE-006 | [FIXED] Issue-list view shows an edit pencil for a workflow-Read-only custom field and reports "Changes saved successfully." even though the write is silently dropped | Closed | Medium | 7.0.0 | #121113 | bugs/closed/BUG-INE-006.md |
| BUG-INE-007 | [FIXED] After an inline Status change, a field's edit pencil can stay stuck hidden even though the new status makes it editable — only a full page reload fixes it | Closed | Medium | 7.0.0 | #121114 | bugs/closed/BUG-INE-007.md |
| BUG-INE-008 | [FIXED] Inline Description save reports "Saved successfully." after the user's edit permission was revoked, although the change is silently discarded | Closed | Medium | 7.0.0 | #121122 | bugs/closed/BUG-INE-008.md |
| BUG-INE-009 | [FIXED] Inline editor session authentication was broken in both directions — an expired session could still save via a leftover API key (original), and a first fix attempt made a *valid* session fail (regression) — now fixed correctly on both paths | Closed | High | 7.0.0 | #121123 | bugs/closed/BUG-INE-009.md |
| BUG-INE-010 | [FIXED] Issue detail page loads Redmine's jstoolbar scripts twice, throwing a console SyntaxError on every load | Closed | Low | 7.0.0 | #121124 | bugs/closed/BUG-INE-010.md |

## Notes
- Open bugs: bugs/open/ — currently empty (all 10 bugs found for this plugin are fixed and closed).
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
