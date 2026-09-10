# BUG-INE-002

- Bug ID: BUG-INE-002
- Production Redmine Issue ID: 120178
- Severity: Medium (fixed 2026-09-09, see below)
- Title: [FIXED — see below] Inline-edit error toast previously prefixed a correctly-translated German validation message with hardcoded English "Could not save:" — now confirmed correctly reading "Konnte nicht gespeichert werden:"
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Inline Issue Editor plugin (inplace_issue_editor) — surfacing a validation error raised by Redmineflux Checklist Plugin
- Plugin version: inplace_issue_editor 7.0.0, redmineflux_checklist 7.0.0
- Environment: Forge — `https://flux-fczk00paf49.forge.zehntech.com/`
- Theme: Default (core Redmine)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-07

## Preconditions

- "Ticket-Schließung blockieren" (Block issue closing) enabled in Redmineflux Checklist Plugin settings.
- An issue with at least one incomplete checklist item.

## Steps to reproduce

1. Enable "Ticket-Schließung blockieren" in Administration > Plugins > Redmineflux Checklist Plugin > Allgemein.
2. Open an issue with an incomplete checklist item (e.g. `/issues/260`).
3. Click the inline Edit (pencil) icon next to "Status:" and select a closed status (e.g. "Closed").

## Expected result

- The resulting error toast should be entirely in German, consistent with the validation message it wraps.

## Actual result

A toast (`<div class="rf-toast rf-toast--error">`) appears reading:

```
Could not save: Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.
```

The prefix **"Could not save:"** is hardcoded English, while the actual validation message from the Checklist plugin (`Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.`) is correctly and fully translated. Confirmed via a MutationObserver capturing the toast's insertion into the DOM (the toast auto-dismisses quickly, faster than a manual screenshot round-trip) — exact text captured above.

This is a genuine mixed-language string: the Inline Editor plugin's own generic error-wrapper text is not localized, even though it's directly concatenating a message that itself IS properly localized by another plugin — the two halves of the same sentence are in two different languages.

Note: submitting the identical change via the full Edit form (`/issues/260/edit`) shows only the clean, fully-German message with no English prefix — confirming the underlying validation message and its translation are correct, and the defect is specific to the Inline Editor's own toast-wrapping code path.

## Severity rationale

Medium: this is the ONLY user-visible feedback in the inline-edit flow (the field silently reverts otherwise) — the mixed-language toast is confusing and visibly unprofessional for a German-language user, though the underlying block itself functions correctly.

## Retest — STILL REPRODUCES — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-f04qohdte49.forge.zehntech.com/`, German (Deutsch), Default theme.
- Enabled "Ticket-Schließung blockieren" in Administration > Plugins > Redmineflux Checklist Plugin > Allgemein (was disabled by default on this fresh server).
- Created test issue #269 (Software development5) with one incomplete checklist item, then attempted to set Status to "Closed" via the inline Edit widget.
- `MutationObserver` captured the toast text verbatim: `Could not save: Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.` — identical mixed-language pattern as the original report, byte-for-byte.
- Unlike the original session, this time a static screenshot of the toast itself was successfully captured (via a tight polling loop checking `document.body.innerText` every 50ms and firing the screenshot the instant the text appeared) — see below.
- Status correctly reverted to "New" after the rejected save, confirming the underlying block still functions correctly — only the "Could not save:" prefix remains untranslated.
- No change in behavior since the original report — bug remains open as-is, title/severity unchanged.

## Evidence

### Screenshot

Not captured as a static image in the original report — the toast auto-dismissed faster than a manual screenshot round-trip permitted at the time. Evidence was the exact DOM capture via `MutationObserver`, reproduced verbatim above (`<div class="rf-toast rf-toast--error">Could not save: Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.</div>`), confirmed twice independently.

### Retest screenshot — toast captured live (2026-09-09)

![Retest — toast still shows English "Could not save:" prefix](../../screenshots/BUG-INE-002/retest-2026-09-09-could-not-save-toast.png)

### Retest screenshot — fix verified (2026-09-09)

![Retest — toast now reads "Konnte nicht gespeichert werden:", fully German](../../screenshots/BUG-INE-002/retest-2026-09-09-fixed-toast.png)

### Console / log

- A `422` response from `issues/260/update_field.json` accompanies this toast — expected (the save is genuinely rejected), not itself an error.

## Fix verified — 2026-09-09, new Forge server (branch updated)

- Server: `https://flux-fdrk6suoj49.forge.zehntech.com/`, German (Deutsch), Standard theme.
- Enabled "Ticket-Schließung blockieren" in Administration > Plugins > Redmineflux Checklist Plugin > Allgemein (disabled by default on this fresh server), created test issue #268 with one incomplete checklist item, attempted to set Status to "Closed" via the inline Edit widget.
- `MutationObserver` captured the toast text verbatim: **"Konnte nicht gespeichert werden: Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind."** — fully German now (was "Could not save: ...").
- Status correctly reverted to "New" after the rejected save, confirming the underlying block still functions correctly.
- Setting reverted to disabled afterward to restore the server's prior state; test issue #268 left in place as evidence (matches session convention).
- **Fixed. Closing.**
- Incidental finding while retesting this bug: a separate, previously-undocumented interim "Saving…" loading indicator (shown briefly before the final toast) is still hardcoded English — filed as new `BUG-INE-004` (Low), not part of this bug's own scope.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
