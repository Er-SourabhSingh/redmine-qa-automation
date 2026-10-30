# Bug Report Template

- Bug ID: BUG-CRX-110
- Production Redmine Issue ID: #126600
- Title: Project Setup Agent silently drops a "team member" request made in the same message as project creation, despite the exact same action genuinely working when asked as a separate follow-up
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Setup Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-30

## Steps to reproduce

1. Fresh chat, Project Setup Agent (pinned): "Create a project called 'Crux Project Setup Test C' for
   mobile app development, with Luna Blossom as PM and Daisy Skye on the team."
2. Observe the confirm card's fields.
3. In a separate project (already created), as a standalone follow-up turn: "Now add Daisy Skye to that
   project as a Reporter."

## Expected result

Either the team-member request should be included in the SAME proposal (the agent has
`redmineflux_core_create_project_membership` genuinely available and working — proven in step 3), or, if a
true technical limitation prevents combining it into the same turn, the agent should at minimum disclose
that the team-member part is not included in this proposal and will need a separate step.

## Actual result

**Step 1's confirm card contained ONLY**: Name, Identifier, Description, Default Assigned To (raw id `5`
for Luna Blossom — see also the related CRC-11 finding below). There was **zero mention of Daisy Skye or
the team request anywhere** — not in the confirm card, not in the preceding chat text, not as a follow-up
question. The request was silently dropped in its entirety.

**Step 3 proves this was not a genuine capability gap**: asked as a standalone follow-up on an
already-created project, "Now add Daisy Skye to that project as a Reporter" produced a genuine
`redmineflux_core_create_project_membership` confirm card (`Project`, `User: 6`, `Role: Reporter`) which,
once confirmed, **genuinely succeeded** — DB-verified: `members`/`member_roles` tables show `daisy.skye`
added to the project as Reporter.

So the agent demonstrably has the tool and the resolution logic to do exactly what was asked in step 1 — it
simply never attempted or acknowledged it when the request arrived bundled with project creation in a
single message. This is the same silent-field-drop pattern already confirmed elsewhere in this QA cycle
(BUG-CRX-068, Sales Agent dropping "Assigned To"; BUG-CRX-073, Budget Agent's Territory custom field write
silently failing) — part of a multi-field request is dropped with zero disclosure to the user.

## Evidence

### Console / log

- Step 1 confirm card (full): `Name: Crux Project Setup Test C`, `Identifier:
  crux-project-setup-test-c`, `Description: Mobile app development project`, `Default Assigned To: 5` — no
  Daisy Skye field, no team field, no mention anywhere in the preceding text either.
- Step 3 confirm card (separate project, same agent, same session type): `Project: Crux Project Setup Test
  B`, `User: 6`, `Role: Reporter` — confirmed, DB-verified membership created (`members` table, project
  "Crux Project Setup Test B", `daisy.skye`, role "Reporter").

## Duplicate check

- Duplicate found: No. First finding on the Project Setup Agent. Same general "silent multi-field drop"
  shape as BUG-CRX-068/073, but a distinct domain (project creation + team assignment) and a distinct,
  stronger proof that the capability genuinely exists (the exact same tool call succeeds moments later as
  a standalone request).
