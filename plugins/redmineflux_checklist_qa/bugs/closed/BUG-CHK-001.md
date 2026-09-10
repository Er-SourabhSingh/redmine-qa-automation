# BUG-CHK-001

- Bug ID: BUG-CHK-001
- Severity: Low
- Title: Journal message for "Apply checklist template from template" ("Aus Vorlage hinzufügen") is not translated, unlike every other checklist journal message
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Checklist Plugin (redmineflux_checklist)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- German language active.
- At least one checklist template exists.

## Steps to reproduce

1. Open an issue detail page.
2. Click the Checkliste "..." actions menu → "Aus Vorlage hinzufügen" → select a template.
3. Inspect the resulting journal/activity entry on the issue.

## Expected result

- The journal message should be in German, consistent with every other checklist-related journal message on the same issue (e.g. "Checkliste 'X' wurde von Redmine Admin hinzugefügt." and "Checklisten-Element 'Y' in Checkliste 'X' von Redmine Admin erstellt", both confirmed fully German — see `CHECKLIST_GERMAN_LANGUAGE.md` TC-CHK-001/003).

## Actual result

The journal message reads entirely in English:

```
Applied checklist template 'QA Template Two' — 1 checklist(s) created by Redmine Admin.
```

This is the only checklist-related journal/activity message found untranslated in this plugin — every other one (item added, sub-item created) is fully German. This strongly suggests the "apply template" action's message is generated via a separate code path that was never routed through the plugin's locale files.

## Severity rationale

Low: cosmetic-only, confined to a single activity-log message; the underlying "apply template" functionality itself works correctly (confirmed: the checklist item was correctly created from the template).

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CHK-001/apply-template-journal-untranslated.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CHK-001/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Resolution — Closed 2026-09-07

Closed per explicit user direction: the user had already independently reported this same finding themselves prior to this session's discovery. Not a duplicate of anything else in this repo's tracker — closed to avoid double-tracking the same already-reported issue, not because the finding itself was invalid. The underlying observation (this journal message is untranslated, unlike every other checklist journal message) was independently reproduced and confirmed live on a second issue (#230) before closing.

## Follow-up verification — Checklisten-Verlauf tab checked separately (2026-09-07)

Per the user's own guidance ("checklist will always appear in checklist history"), specifically re-checked the dedicated **"Checklisten-Verlauf"** (Checklist History) tab for the same "apply from template" event, rather than only the generic Notizen/journal tab where the original finding was made.

**Result: the Checklisten-Verlauf tab's own record of this event is fully translated:**

```
Checkliste hinzugefügt: From Template Item
Checkliste 'From Template Item' wurde aus Vorlage erstellt.
```

This confirms the untranslated English string ("Applied checklist template 'X' — N checklist(s) created by Y.") is confined to the **redundant Notizen/journal entry** only — the canonical, purpose-built Checklisten-Verlauf record of the same action is correct German. This is a useful clarification of scope for whoever picks up the original report: the defect is narrower than "checklist template application is untranslated" — it's specifically "the generic journal-note duplicate of this event is untranslated," while the actual Checklist History feature is unaffected.
