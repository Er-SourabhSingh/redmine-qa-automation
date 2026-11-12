# Bug Report

- Bug ID: BUG-CRX-189
- Production Redmine Issue ID: #128315 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127937 (CRUX_PLATFORM_AGENT_FLEET_ADMIN), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: Upload Agent silently overwrites a built-in (bundled) agent's Name/Capabilities/allowed_tools when uploaded with that agent's exact id — recurrence of the closed/fixed BUG-CRX-177 overwrite vulnerability via a different entry point (Upload, not "+ New Agent") that its fix never covered
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Agent Fleet Admin)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-12)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: admin (holds Manage Crux agents)
- Date: 2026-11-12

## Steps to reproduce

1. Go to `/crux/agents`, click "Upload Agent".
2. In the "Raw content" field, paste:
   ```
   ---
   id: reviewer
   name: Fake Reviewer Clone
   capabilities: [testing]
   ---

   # System prompt
   Testing built-in id refusal.
   ```
   (`reviewer` is the exact id of the real, bundled "Reviewer" agent.)
3. Click "Upload".

## Expected result

Per this suite's own TC-CRX-837 ("A built-in agent's id is refused on upload/create... confirm it's refused, not silently overwritten") and the already-fixed BUG-CRX-177 (which covers the identical scenario via the "+ New Agent" form), this submission should be refused with the same error the "+ New Agent" path now correctly shows: "'<id>' is the id of a built-in agent. Built-in agents can't be replaced; choose a different id."

## Actual result

The upload succeeded with a green "✓ \"Fake Reviewer Clone\" uploaded." toast — no refusal. The real, bundled Reviewer agent's card was corrupted in place: Name changed from "Reviewer" to "Fake Reviewer Clone" (description tagline "Checks work against acceptance criteria" survived since it wasn't part of the uploaded frontmatter), Skills/Capabilities changed from "review" to "testing", and its Type flipped from "Bundled" to "Custom". The Chat link still correctly pointed to `/crux/ask?agent=reviewer`, and agent count stayed at 27 (not 28) — confirming this is a genuine in-place overwrite of the same bundled agent record, identical mechanism to BUG-CRX-177, just reached via the "Upload Agent" dialog instead of "+ New Agent".

This confirms BUG-CRX-177's fix (verified only via the "+ New Agent" form, retested against a different bundled id `test-author`) did not cover the Upload Agent entry point, which shares the same underlying update-in-place write path but was never independently retested against a built-in id after that fix shipped.

**Immediate cleanup performed in-session**: re-uploaded corrected frontmatter (`name: Reviewer`, `capabilities: [review]`, and the real 5-tool `allowed_tools` list reconstructed from the agent's documented manifest) to restore Name, Capabilities, and tool access (confirmed via the Agent profile: "Reads: 4 tools / Changes: 1 change (update issue)", matching the original). Environment left clean.

## Evidence

### Screenshot

(Not captured separately — accessibility-tree confirmation captured in the session transcript immediately after upload: `button "Fake Reviewer Clone Checks work against acceptance criteria"` with `cell "testing"` and `cell "Custom"`, same row's Chat link `/url: /crux/ask?agent=reviewer`, same pattern BUG-CRX-177's own report used.)

### Console / log

- Toast text (verbatim): `✓ "Fake Reviewer Clone" uploaded.`
- Agent count before and after: 27 agents both times (not 28) — confirms in-place update of the same record, not a new agent created alongside it.
- Post-cleanup Agent profile check: "Reads: 4 tools / Changes: 1 change (update issue)" — restored to the documented 5-tool manifest.

## Duplicate check

- Duplicate found: No — not a duplicate of the closed BUG-CRX-177 (same root cause and mechanism, but that fix's retest only exercised the "+ New Agent" form; this reproduces the identical overwrite via the separate "Upload Agent" entry point, which evidently writes through the same unguarded update-in-place path without the bundled-id check added to the other form). Filed as a new bug per the repo's established precedent for recurrences of a known root cause on an uncovered trigger path (e.g. BUG-CRX-093/101 → BUG-CRX-080; BUG-CRX-188 → BUG-CRX-140 earlier this same session).
