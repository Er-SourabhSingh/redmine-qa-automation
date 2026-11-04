# Bug Report Template

- Bug ID: BUG-CRX-154
- Production Redmine Issue ID:
- Title: Support Agent fabricates a false root-cause diagnosis ("the due date is in the past") for a genuine
  `update_ticket` validation failure that was actually about an invalid Priority — confidently reassures the
  user a date fix will work, then the identical real error recurs exactly as predicted once the date is fixed
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Precondition: see BUG-CRX-153 — "Update the printer ticket's (#28) priority to High and add a due date of
   2026-01-01" genuinely failed server-side with the exact text `"Validation error: Priority cannot be blank
   Correct the value(s) above and try again."` — a specific, unambiguous server message naming Priority, with
   no mention of the due date anywhere in it.
2. Told the agent: "That failed with a validation error. Please try again, correctly this time." (deliberately
   not naming the field myself, to see what it independently diagnosed from the actual error text it had just
   received).
3. Agent's response (verbatim): *"The due date you specified — `2026-01-01` — is in the past (today is
   Wednesday, November 04, 2026). **That's why the validation failed.** Please provide a due date that's on or
   after today... Once you confirm the correct date, I'll update ticket #28 with priority High and the new due
   date."* — a confident, specific, and entirely fabricated root cause. The real error text it had just
   received said nothing about dates at all.
4. Supplied a genuinely valid future date (2026-12-01) as instructed. Confirmed → **the identical** `"Validation
   error: Priority cannot be blank"` recurred, word-for-word — proving the agent's diagnosis in step 3 was
   false, and its confident promise ("I'll update ticket #28 with priority High and the new due date") was
   never going to come true regardless of what date was supplied.

## Expected result

When a tool call returns a specific, named validation error, the agent's explanation of "why it failed" should
reflect what the error actually says, not an unrelated, self-generated guess. At minimum, the agent should not
confidently assert a wrong cause as fact ("That's why the validation failed") when the real error text it has
direct access to names a completely different field.

## Actual result

The agent invented a plausible-sounding but false explanation (past due date) for a failure that was actually
about an invalid Priority value (see BUG-CRX-153), stated it with full confidence rather than hedging, and gave
the user a false assurance that correcting the date would fix the write. The user followed this advice exactly
and hit the identical real failure again. This is materially worse than simply relaying the raw error text
would have been — it actively misdirects the user's remediation effort toward a field that was never broken.

## Evidence

### Console / log

- Real server error (from BUG-CRX-153's attempt 1): `"Validation error: Priority cannot be blank Correct the
  value(s) above and try again."`
- Agent's fabricated diagnosis (verbatim): *"The due date you specified — `2026-01-01` — is in the past (today
  is Wednesday, November 04, 2026). That's why the validation failed."*
- Confirmation the diagnosis was false: supplying the "corrected" date (2026-12-01) and confirming reproduced
  the exact same `"Validation error: Priority cannot be blank"` text, with no due-date-related error at all.

## Duplicate check

- Duplicate found: No. First finding of a fabricated/false root-cause explanation for a genuine, specific,
  already-received server error on this agent. Related to, but distinct from, BUG-CRX-153 (same incident, same
  session) — 153 is about the wrong *value* the agent repeatedly proposed for Priority; this is about the wrong
  *explanation* the agent gave for why its own proposal failed, which is a materially different and arguably
  more severe failure mode (active misdirection vs. a wrong guess). Not the same shape as the misleading-✓
  family (BUG-CRX-018/054/067/082, which mask a real failure behind a false success checkmark) — here the
  failure itself was shown honestly, only its stated cause was invented.
