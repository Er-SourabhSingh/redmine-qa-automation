# Bug Report

- Bug ID: BUG-CRX-195
- Production Redmine Issue ID: #128746 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127779 (CRUX_AGENT_AUTO_FIXER), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: Auto-Fixer always proposes exactly 3 subtasks (implement / regression test / verify staging) regardless of how trivial the bug is — a one-line copyright-year typo fix gets the same template as a real pagination bug
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto-Fixer agent)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-16)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-16

## Steps to reproduce

1. Create a genuinely trivial bug (issue #98): "Footer copyright year shows 2025 instead of 2026" — a
   one-line hardcoded-string fix, no logic, no algorithm, nothing meaningfully testable beyond eyeballing the
   footer.
2. Auto-Fixer pinned, ask: *"Plan the fix for issue #98 and set up subtasks for it."*
3. Inspect the proposed subtask plan's content and count.

## Expected result

Per the manifest and this suite's own TC-CRX-676: subtask count/scope should be **proportionate** — a trivial,
one-line fix should get fewer subtasks (or a plain note that a full regression-test subtask is overkill for
this scope), not the same fixed 3-step template used for substantive bugs.

## Actual result

Auto-Fixer proposed the identical 3-subtask template used for every other bug this session, including the
genuinely complex export-pagination bug (#93):

1. **"Implement: Update footer copyright year to 2026"**
2. **"Add regression test: Footer copyright year"** — description: *"Add or update an automated test that
   verifies the footer copyright year is correct... This prevents the same bug from reoccurring."*
3. **"Verify on staging: Footer copyright displays correctly"** — description includes checking "No orphaned
   year references remain" and "Footer layout is unbroken," language scaled for a much larger change than a
   single hardcoded string literal.

Writing and maintaining an automated regression test specifically for a hardcoded copyright-year string is
disproportionate — the fix itself (change `"2025"` to `"2026"`, or make it dynamic) is a one-line diff that
doesn't warrant its own dedicated test subtask, and the "no orphaned year references" staging-verification
language implies a scope the actual bug never had. This is mechanical padding to a fixed count (3), not
genuine scoping to the bug's real complexity.

Cancelled the confirm card rather than creating this disproportionate 3-subtask set, to avoid polluting the
fixture project with an unnecessary "add regression test" ticket for a one-line typo.

## Evidence

### Console / log

- Fixture issue #98 description (verbatim): *"The footer's copyright year is hardcoded as '2025' and never
  updated. One-line fix: change the literal string/constant to 2026 (or compute it dynamically)."*
- Confirm card (verbatim, 3 subtasks proposed): "1. New issue: Implement: Update footer copyright year to
  2026" / "2. New issue: Add regression test: Footer copyright year" / "3. New issue: Verify on staging:
  Footer copyright displays correctly" — each with `Parent Issue: 98`.
- Contrast: the same agent, same session, correctly produced a genuinely risk-scaled recommendation for a
  *different* axis (Work Package vs. subtasks, see TC-CRX-671/#96) — proving the agent is capable of scaling
  its output to real complexity signals when it does check them, but subtask **count** itself is not one of
  those signals; it stays fixed at 3 regardless of input.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md`/`bugs/_index.md` — no prior bug about Auto-Fixer's
  subtask count/proportionality. Distinct from BUG-CRX-194 (filed same session) — that bug is about the agent
  losing track of already-completed work mid-chat; this one is about the content/scope of a plan it proposes
  fresh, before any confirmation, never varying with the bug's actual size.

## Retest — 2026-11-17 (CONFIRMED FIXED)

Developer moved this to "In QA" on production. Pulled latest code — `redmineflux-crux-core` picked up CRC-109
"auto-fixer-sized-subtasks," confirming the exact root cause. Rebuilt/restarted the stack, verified healthy.

Re-ran the exact original repro with a fresh trivial fixture (#110, "Footer copyright year shows 2025 instead
of 2026," one-line fix). Asked Auto-Fixer to plan the fix and set up subtasks. This time the proposal was a
**single** issue — "I'll create this issue — confirm?" — not the old fixed 3-subtask template. Confirmed →
native-verified via `list_issues(parent_id=110)`: exactly 1 real subtask created (#111, "Update footer
copyright year to 2026"), no separate "add regression test" or "verify on staging" subtasks invented for a
one-line fix. **Confirmed FIXED.**
