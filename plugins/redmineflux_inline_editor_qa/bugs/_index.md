# Bug Index — Redmineflux Inline Editor

| Bug ID | Title | Status | Severity | Redmine Version | Production Redmine Issue ID | File Path |
|--------|-------|--------|----------|-----------------|------------------------------|-----------|
| BUG-INE-005 | Inline editor's issue-list Subject field bypasses the 255-character length validation the standard Edit form enforces | Open | Medium | 7.0.0 | #121112 | bugs/open/BUG-INE-005.md |
| BUG-INE-006 | Issue-list view shows an edit pencil for a workflow-Read-only custom field and reports "Changes saved successfully." even though the write is silently dropped | Open | Medium | 7.0.0 | #121113 | bugs/open/BUG-INE-006.md |
| BUG-INE-007 | After an inline Status change, a field's edit pencil can stay stuck hidden even though the new status makes it editable — only a full page reload fixes it | Open | Medium | 7.0.0 | #121114 | bugs/open/BUG-INE-007.md |
| BUG-INE-008 | Inline Description save reports "Saved successfully." after the user's edit permission was revoked, although the change is silently discarded | Open | Medium | 7.0.0 | #121122 | bugs/open/BUG-INE-008.md |
| BUG-INE-009 | An open inline editor keeps saving after the user's session has ended, because the plugin authenticates with the user's API key embedded in the page | Open | Medium | 7.0.0 | #121123 | bugs/open/BUG-INE-009.md |
| BUG-INE-010 | Issue detail page loads Redmine's jstoolbar scripts twice, throwing a console SyntaxError on every load | Open | Low | 7.0.0 | #121124 | bugs/open/BUG-INE-010.md |
| BUG-INE-001 | [FIXED] Inline searchable-dropdown widget's "Search…" placeholder and "— None —" option were hardcoded English — confirmed now "Suche"/"Keine" | Closed | Medium | 7.0.1.stable | | bugs/closed/BUG-INE-001.md |
| BUG-INE-002 | [FIXED] Inline-edit error toast's "Could not save:" prefix was hardcoded English — confirmed now "Konnte nicht gespeichert werden:" | Closed | Medium | 7.0.1.stable | | bugs/closed/BUG-INE-002.md |
| BUG-INE-003 | [FIXED] Shared post-save "Saved successfully." toast and Description's CKEditor "Cancel"/"Save" buttons were hardcoded English — confirmed now "Erfolgreich gespeichert."/"Abbrechen"/"Speichern" | Closed | Medium | 7.0.1.stable | | bugs/closed/BUG-INE-003.md |
| BUG-INE-004 | [FIXED] Interim "Saving…" loading indicator was hardcoded English — confirmed now "Wird gespeichert…" | Closed | Low | 7.0.1.stable | | bugs/closed/BUG-INE-004.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
