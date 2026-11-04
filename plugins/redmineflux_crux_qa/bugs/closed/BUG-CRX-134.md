# Bug Report Template

- Bug ID: BUG-CRX-134
- Production Redmine Issue ID: #127461
- Title: Invoicing Agent's "Set Team Rate" crashes with a raw, unhandled 500 (DB foreign-key violation) for a nonexistent user id — surfaces a misleading "database may not be migrated" remediation message that has nothing to do with the real cause
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Invoicing Agent) / redmineflux_invoice (native plugin, root cause)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. As `admin`, Invoicing Agent pinned, fresh chat: "Set the hourly rate to $90 for user 6 and user 999999 on
   the Crux Invoice Agent Test Project." (user 6 is real/valid; 999999 does not exist).
2. Confirm both proposed `Invoice Set Team Rate` write cards (the agent splits this into two individual
   `set_team_rate` calls rather than one `bulk_update_team_rates` call).

## Expected result

An invalid/nonexistent user id should produce a clean, honest validation error (e.g. "User 999999 not
found") — not a raw unhandled server exception, and the remediation text shown to the user should actually
relate to the real cause.

## Actual result

Step 1 (user 6, a real project member) succeeded genuinely: *"✓ Team rate set: Daisy Skye → 90.0/hr on
project #10 (rate_id: #2)"* — native-verified on the project's Team Rates page, genuinely shows 90.0.

Step 2 (user 999999) failed with: *"Step 2 failed: Server error (500): Internal Server Error... If this is a
fresh Redmineflux instance, the invoice plugin database tables may not have been migrated yet. Ask your
administrator to run: bundle exec rake redmine:plugins:migrate RAILS_ENV=production then restart the
Redmineflux server."* This remediation advice is **completely wrong for this error** — the real cause,
confirmed via the Redmine container log, is:

```
ActiveRecord::InvalidForeignKey (PG::ForeignKeyViolation: ERROR:  insert or update on table "team_rates"
violates foreign key constraint "fk_rails_ab4e11506d"
DETAIL:  Key (user_id)=(999999) is not present in table "users".
)
```

The controller action behind `set_team_rate` never validates that `user_id` refers to a real user before
attempting the insert — it relies entirely on the database's own foreign-key constraint and does not rescue
the resulting `ActiveRecord::InvalidForeignKey` exception, so it bubbles up as a raw, unhandled 500 instead
of a clean, specific validation error. The generic 500-handler's boilerplate "database may not be migrated"
text is then shown to the user, actively misleading them toward the wrong fix (re-running migrations will
never resolve this — the real issue is simply that the user id doesn't exist).

**Positive finding, not part of this bug**: the two-step batch's partial-success reporting is itself honest
— step 1's genuine success is reported and persisted independently of step 2's failure, with no false
all-or-nothing rollback or false success.

## Evidence

### Console / log

- Chat response (verbatim): *"Step 2 failed: Server error (500): Internal Server Error This is a
  server-side problem. Try again in a moment, or contact your Redmineflux administrator if it persists. If
  this is a fresh Redmineflux instance, the invoice plugin database tables may not have been migrated yet.
  Ask your administrator to run: bundle exec rake redmine:plugins:migrate RAILS_ENV=production then restart
  the Redmineflux server."*
- Real Redmine container log (verbatim): `Parameters: {"team_rate"=>{"user_id"=>999999, "hourly_rate"=>90.0},
  "project_id"=>"10"}` → `Completed 500 Internal Server Error` → `ActiveRecord::InvalidForeignKey
  (PG::ForeignKeyViolation: ... Key (user_id)=(999999) is not present in table "users".)`
- Native verification on `/projects/crux-invoice-agent-test-project/team_rates`: Daisy Skye (user 6)
  genuinely shows Bill Rate 90.0 — step 1's success was real and unaffected by step 2's crash.

## Duplicate check

- Duplicate found: No. First finding on the Invoicing Agent's team-rate write path. Distinct from
  BUG-CRX-132 (a nil-field crash on the invoice show page) and BUG-CRX-133 (wrong-project resolution) —
  different tool, different root cause (missing input validation before a DB write, not a resolution or
  rendering defect).

## Retest — 2026-11-04 (FIXED)

Retested the exact original repro: "Set the hourly rate to $95 for user 999999 on the Crux Invoice Agent Test
Project." Confirm card correctly showed `Project: Crux Invoice Agent Test Project`, `User: 999999`, `Hourly
Rate: 95`. Confirming now returns a clean, honest validation error instead of a raw 500: *"Validation error:
User is invalid Correct the value(s) above and try again. The user must be a member of this project: invoice
line items and team rates can only name the project's members. Check them with
redmineflux_core_list_project_memberships, and don't substitute another person."*

Confirmed via the real Redmine container log: `POST /api/projects/10/team_rates.json` with
`user_id=999999` now returns a clean `422 Unprocessable Content` (84ms, no exception trace) — not the raw,
unhandled `ActiveRecord::InvalidForeignKey` 500 from the original report, and no misleading
"database may not be migrated" remediation text.

**Status: FIXED.** `set_team_rate` now validates the user is a real project member before attempting the
write. Moved to `bugs/closed/`.
