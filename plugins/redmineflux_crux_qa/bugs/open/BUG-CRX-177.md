# Bug Report

- Bug ID: BUG-CRX-177
- Production Redmine Issue ID: #127948
- Title: + New Agent silently overwrites a built-in (bundled) agent's Name and Capabilities when submitted with that agent's exact id, instead of refusing
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (crux-core 1.1.0, commit 347ee6e)
- Plugin version: 1.1.0
- Environment: localhost:3015 (local Docker QA instance)
- Browser: Chromium (Playwright MCP)
- User role: Admin (holds Manage Crux agents)
- Date: 2026-11-05

## Steps to reproduce

1. Go to `/crux/agents`, click "+ New Agent".
2. Fill: Id = `reviewer` (the exact id of the real, bundled "Reviewer" agent), Name = `Fake Reviewer`,
   Capabilities = `fake`. Leave Provider as "inherit", leave Model/Max concurrent/Monthly cap blank/default.
3. Click "Save agent".

## Expected result

- Per the dev reference and this suite's own TC-CRX-837 ("A built-in agent's id is refused on upload/create:
  attempt to create or upload an agent using an existing bundled agent's exact id (e.g. `reviewer`) — confirm
  it's refused, not silently overwritten"), this submission should be refused with a clear error (e.g. "this id
  belongs to a built-in agent and cannot be changed"), since the Agents page's own subtitle states "Bundled
  agents ship read-only."

## Actual result

- The submission succeeds with a green "✓ Agent "Fake Reviewer" saved." toast — no refusal, no warning that
  `reviewer` is a bundled id. The real, bundled Reviewer agent's card is immediately corrupted in place:
  - Name changed from "Reviewer" to "Fake Reviewer" (avatar initials changed FR).
  - Skills/Capabilities changed from "review" to "fake".
  - Its description tagline ("Checks work against acceptance criteria") and example question ("Is this stage
    ready to approve?") were NOT part of the + New Agent form, so those happened to survive unchanged — but
    everything the form *does* control was overwritten.
  - The Chat link still correctly points to `/crux/ask?agent=reviewer` and its 16 historical runs are preserved,
    confirming this is a genuine in-place overwrite of the same bundled agent record, not a separate new agent
    created alongside it (agent count stayed at 27, it did not become 28).
- This is the same submission mechanism TC-CRX-831 exercises as a *positive* feature (re-submitting an existing
  id updates it in place) — but that update-in-place behavior was clearly never gated against bundled ids, so
  the same mechanism that's a convenience for custom agents is a data-integrity hole for bundled ones. The
  damage was reproduced once, then manually reverted immediately within this same session (Name restored to
  "Reviewer", Capabilities restored to "review") to leave the environment clean for further testing — but any
  user with "Manage Crux agents" could do this by accident (a mistyped id) or on purpose, with no warning.

## Evidence

### Screenshot

![Save succeeds with no refusal for a bundled id](../../screenshots/BUG-CRX-177/save-success-toast-no-refusal.png)

Accessibility-tree confirmation of the corrupted card immediately after save (captured in the session transcript,
not a separate screenshot): `button "Fake Reviewer Checks work against acceptance criteria"` with
`generic "Skills: fake"` and `link "Chat" /url: /crux/ask?agent=reviewer` — same agent id, overwritten fields.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-177/retest-yyyy-mm-dd-pass.png)

### Console / log

- No browser console errors; this is a missing server-side validation (no check that the submitted id matches
  an existing bundled/read-only agent before applying the update).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (checked `bugs/_duplicates.md`; no prior bundled-agent-integrity
  finding exists in this suite)
