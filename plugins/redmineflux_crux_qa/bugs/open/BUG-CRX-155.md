# Bug Report Template

- Bug ID: BUG-CRX-155
- Production Redmine Issue ID:
- Title: Support Agent's `create_support_level` crashes with a Pydantic validation error when creating a
  "final tier" support level (no escalation target) — sends `escalation_to_id: ""` (empty string) instead of
  omitting the parameter or passing `null`
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned: "Create a new support level tier for project 12 called 'L2 Support', one
   level above Level 1 Support (so Level 1 breaches escalate up to this new L2 tier), assignee admin, and this
   new L2 tier is the final tier (no further escalation)."
2. Agent correctly produced a 2-step plan: (1) `Helpdesk Create Support Level` — `Project: Crux Helpdesk Agent
   Test Project`, `Name: L2 Support`, `Level Order: 2`, `Support Assignee Ids: [1]`, `Escalation To:` (blank
   cell, correctly representing "no escalation target" as the user intent); (2) `Helpdesk Update Support Level`
   — `Support Level: 1`, `Escalation To: 2` (point Level 1 at the new tier). Confirmed.
3. Step 1 failed: *"Step 1 failed: write failed: tool 'redmineflux_helpdesk_create_support_level' failed: Error
   executing tool redmineflux_helpdesk_create_support_level: 1 validation error for
   redmineflux_helpdesk_create_support_levelArguments escalation_to_id Input should be a valid integer, unable
   to parse string as an integer [type=int_parsing, input_value='', input_type=str]"*
4. Native-verified: no new support level was created (`/projects/crux-helpdesk-agent-test-project/
   rf_support_levels/new`'s own Escalation To dropdown still shows only "None (Last Level)" as an option,
   confirming no second tier exists) — the failure was clean, no partial/corrupted record.

## Expected result

Proposing a support level with no escalation target (a final/top tier) should either omit the
`escalation_to_id` parameter entirely from the tool call, or pass `null` — not an empty string, which the
tool's own Pydantic schema correctly rejects as an invalid integer.

## Actual result

The confirm card correctly displayed "no escalation target" as a blank cell, but the underlying tool call that
fired on Confirm encoded that same blank value as the literal string `""` instead of omitting the key or using
`null`. This makes it impossible to create a final-tier support level through the Support Agent at all — every
attempt crashes with the identical Pydantic `int_parsing` error, even though the confirm card itself looked
entirely correct and the user's intent was unambiguous.

## Evidence

### Console / log

```
Step 1 failed: write failed: tool 'redmineflux_helpdesk_create_support_level' failed: Error executing tool
redmineflux_helpdesk_create_support_level: 1 validation error for
redmineflux_helpdesk_create_support_levelArguments
escalation_to_id
  Input should be a valid integer, unable to parse string as an integer [type=int_parsing, input_value='',
  input_type=str]
```

- Confirm card's own "Escalation To" cell for step 1 was blank (correct intent), yet the actual tool argument
  sent was `""`.
- Native-verified no support level #2 (or any) beyond the original Level 1 was created — clean failure, no data
  corruption.

## Duplicate check

- Duplicate found: No. First finding on the Support Agent / Helpdesk plugin domain's Support Level tools.
  Related in general shape to BUG-CRX-083 (Time Agent, `schema_create` guessing a required field as `[]`
  instead of leaving it unset) — both are "an unset/optional value gets encoded as an empty placeholder instead
  of omitted/null" — but a different tool, different agent, and a different placeholder type (empty string vs.
  empty list). Kept as its own bug per the one-bug-per-domain convention. Not a duplicate of BUG-CRX-156 (the
  misleading-✓ failure message on this same multi-step plan's second step) — distinct mechanism.
