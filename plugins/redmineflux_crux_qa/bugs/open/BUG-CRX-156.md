# Bug Report Template

- Bug ID: BUG-CRX-156
- Production Redmine Issue ID:
- Title: A genuine failure on step 2 of a 2-step plan ("Support level #2 not found for escalation target") is
  rendered with a misleading "✓" checkmark prefix, even though step 1 (creating support level #2) had already
  failed — same recurring class as BUG-CRX-018/054/067/082/151
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Same session as BUG-CRX-155: a 2-step plan — (1) create support level "L2 Support" (id would be 2), (2)
   update support level #1's `escalation_to_id` to 2 (the new tier from step 1).
2. Confirmed. Step 1 genuinely failed (BUG-CRX-155 — Pydantic validation error on `escalation_to_id: ""`), so
   support level #2 was never created.
3. Step 2 then also genuinely failed, since it tried to point at a support level id that doesn't exist. Result
   text shown to the user (verbatim): *"Created 1 of 2"* followed by *"✓ Support level #2 not found for
   escalation target (If you expected this support level #1 to exist, verify the ID with the corresponding
   list_* tool.)"* — a real, correctly-worded failure message, prefixed with a ✓ checkmark that falsely implies
   success.
4. Native-verified: support level #1's own Escalation To field remains "None (Last Level)", confirmed unchanged
   — the write genuinely did not happen, only the message's ✓ prefix is wrong.

## Expected result

A failure message (here, a tool correctly reporting "support level #2 not found") should never be prefixed
with a success checkmark. The "Created 1 of 2" header already correctly signals a partial failure — the
per-step message beneath it should match, with no ✓.

## Actual result

The step-2 failure text is prefixed with "✓", directly contradicting both the "Created 1 of 2" header one line
above it and the message's own content ("not found for escalation target"). A user skimming the result could
easily read the ✓ and believe the escalation chain was wired up correctly when nothing was actually saved.

## Evidence

### Console / log

```
Created 1 of 2
✓ Support level #2 not found for escalation target (If you expected this support level #1 to exist, verify the
ID with the corresponding list_* tool.)
```

- Native-verified support level #1's Escalation To field: still "None (Last Level)", confirming the step
  genuinely failed despite the ✓.

## Duplicate check

- Duplicate found: No new *class* — this is a recurrence of the already-documented misleading-✓-on-failure
  family (BUG-CRX-018, BUG-CRX-054, BUG-CRX-067, BUG-CRX-082, BUG-CRX-151's own status-vs-SLA framing had a
  related honesty theme) on a new trigger path: the per-step result line of a **multi-step plan**, not a
  single-tool confirm result. First instance of this specific family appearing inside a plan's step-by-step
  summary rather than a standalone tool result. Filed as a new bug per the repo's established precedent for
  recurrences on a new trigger path (BUG-CRX-027/028 → BUG-CRX-020; BUG-CRX-070 → BUG-CRX-013). Not a duplicate
  of BUG-CRX-155 (the actual validation crash that caused this cascading step-2 failure) — distinct mechanism,
  found in the same session.
