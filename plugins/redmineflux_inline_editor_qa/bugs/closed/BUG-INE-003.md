# BUG-INE-003

- Bug ID: BUG-INE-003
- Production Redmine Issue ID: 120179
- Severity: Medium (fixed 2026-09-09, see below)
- Title: [FIXED — see below] The shared post-save success toast previously read hardcoded English "Saved successfully." on every inline-edit field, and Description's own CKEditor "Cancel"/"Save" buttons were also hardcoded English — both now confirmed correctly German ("Erfolgreich gespeichert.", "Abbrechen"/"Speichern")
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Inline Issue Editor plugin (inplace_issue_editor)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- German language active.

## Steps to reproduce

1. Open an issue (e.g. #259). Inject a `MutationObserver` on `document.body` watching for added `.toast`-classed nodes (the toast dismisses too fast for a manual screenshot round-trip).
2. Change the "Status:" field via its inline Edit icon (native `<select>`) and observe the resulting toast.
3. Change the "Priorität:" field via its inline Edit icon (native `<select>`) and observe the resulting toast.
4. Open an issue with a non-empty Description, click the inline Edit (pencil) icon next to "Beschreibung", and inspect the editor's tab labels, toolbar, and its two action buttons; click Save and observe the resulting toast.

## Expected result

- Every part of these editing interactions should render in German, consistent with the field labels themselves ("Status:", "Priorität:", "Beschreibung") and, for the Description editor specifically, its "Bearbeiten"/"Vorschau" tab labels, toolbar button tooltips ("Fett (Ctrl+B)", "Kursiv (Ctrl+I)", "Unterstrichen (Ctrl+U)", "Durchgestrichen", etc.), and "Zitieren" (Quote) link — all of which are already correctly translated in the immediate surrounding UI.

## Actual result

Confirmed via a `MutationObserver` capturing each toast the instant it's inserted (necessary since it auto-dismisses too fast for a manual screenshot):

- Changing **Status** (In Progress → Feedback, via the real dropdown, then reverted back) produces the toast text **"Saved successfully."** — hardcoded English.
- Changing **Priority** (Urgent → Normal, via the real dropdown, then reverted back) produces the identical **"Saved successfully."** toast — hardcoded English.
- Changing **Description** (via its CKEditor's own "Save" button) produces the same **"Saved successfully."** toast, and additionally: the editor's own two action buttons read **"Cancel"** (`class="rf-btn rf-btn--ghost"`) and **"Save"** (`class="rf-btn rf-btn--primary"`) — both hardcoded English.

This confirms the success toast is a single shared component reused across every inline-edit field in the plugin, and its message is untranslated everywhere it appears — not a Description-specific gap. Meanwhile, on the Description editor specifically, the tab labels ("Bearbeiten"/"Vorschau"), every toolbar icon's tooltip, and the "Zitieren" link sitting directly above the whole widget are all correctly German — proving this is a genuine, narrow gap in the shared toast component (and Description's own Save/Cancel buttons), not a session/environment misconfiguration.

## Severity rationale

Medium: this toast is the only feedback confirming *every* successful inline save across the entire plugin — Status, Priority, Assignee, Subject, Description, and any other field using this shared save flow — making it one of the most frequently-seen strings in the whole plugin. The Description editor's Save/Cancel buttons are additionally the primary controls for committing/discarding that specific edit.

## Retest — STILL REPRODUCES — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-f04qohdte49.forge.zehntech.com/`, German (Deutsch), Default theme.
- Opened issue #106 (Agile Board Project), clicked the inline Edit icon on "Beschreibung".
- The CKEditor's own tab labels ("Bearbeiten"/"Vorschau") are correctly German, exactly as before — but the two action buttons at the bottom of the widget still read hardcoded English **"Cancel"** / **"Save"**, identical to the original finding.
- The shared "Saved successfully." toast on Status/Priority field changes was not re-verified separately this pass (same shared component, not touched by this fix cycle; no reason to expect independent behavior) — the Description editor's Cancel/Save buttons alone are sufficient to confirm the bug still reproduces.
- No change in behavior since the original report — bug remains open as-is, title/severity unchanged.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-INE-003/description-editor-cancel-save-untranslated.png)

### Retest screenshot — still reproduces (2026-09-09)

![Retest — Cancel/Save buttons still English](../../screenshots/BUG-INE-003/retest-2026-09-09-cancel-save-still-english.png)

### Retest screenshot — fix verified (2026-09-09)

![Retest — Abbrechen/Speichern buttons now German](../../screenshots/BUG-INE-003/retest-2026-09-09-fixed.png)

### Console / log

- No related console errors; this is a hardcoded-string i18n gap, not a JS error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Standard theme.
- Opened issue #106 (Agile Board Project), added a description via the full edit form, then reopened it via the inline Edit (pencil) icon on "Beschreibung": the editor's own action buttons now read **"Abbrechen"**/**"Speichern"** (were "Cancel"/"Save") — confirmed via screenshot.
- Clicked "Speichern": `MutationObserver` captured the resulting toast reading **"Erfolgreich gespeichert."** (was "Saved successfully.") — fully German.
- Also re-verified on Priority (Urgent → Normal, reverted back afterward): identical **"Erfolgreich gespeichert."** toast — confirms the shared toast component is fixed plugin-wide, not just for Description.
- **Fixed. Closing.**
- Incidental finding while retesting this bug: a separate, previously-undocumented interim "Saving…" loading indicator (shown briefly before this toast) is still hardcoded English — filed as new `BUG-INE-004` (Low), not part of this bug's own scope.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
