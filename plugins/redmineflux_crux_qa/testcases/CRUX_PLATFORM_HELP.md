# Test Suite — Crux Platform: Help & Setup Guide

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §12. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/help` (any logged-in user).
> TC range: TC-CRX-954 to TC-CRX-965.

## Fixtures needed

- Two test users: one with all 5 Crux permissions, one with zero, to compare the live permissions table.
- An admin user and a non-admin user, to compare the First-time-setup section's visibility.

## Positive Cases

- **TC-CRX-954** — Admin sees "First-time setup": confirm the 6-step section appears for an admin, with working
  links to Crux Settings/Test connection, Providers & keys, Project modules, Roles and permissions, Agents (+
  New/Upload/identity), and Frozen rules.
- **TC-CRX-955** — Non-admin sees "ask your administrator" instead of the setup steps.
- **TC-CRX-956** — "What is Crux?" 5-step flow renders with working Open Ask Crux / Open Dashboard / View Agents
  links/buttons.
- **TC-CRX-957** — "Using Crux day to day" tiles cover: Ask Crux, the bubble, Dashboard, Agents, Pipelines,
  Improve with Crux, @-mention, and the daily spend reminder — confirm all 8 are present.
- **TC-CRX-958** — "The agents" table lists all 24 real chat agents (not 26 — exclude the 2 workers), each with
  "What to ask it" and a "Needs `<plugin>`" column accurate to that agent's actual plugin dependency.
- **TC-CRX-959** — FAQ section renders with real content (not a placeholder).
- **TC-CRX-960** — "If something goes wrong" error-message table matches the real error messages this cycle has
  actually observed (cross-reference a known one, e.g. the 401/403 messages from §13.12).
- **TC-CRX-961** — "Check your permissions" live table — all-granted user: as the user with all 5 Crux
  permissions, confirm all 5 rows show "You have this".
- **TC-CRX-962** — "Check your permissions" live table — zero-permission user: as the user with none, confirm all
  5 rows show "Not yet".
- **TC-CRX-963** — Permissions table updates live after a role change: grant one additional permission to the
  zero-permission test user (without them needing to log out/in), reload Help, confirm that one row now shows
  "You have this" while the other 4 still show "Not yet".

## Negative / Boundary Cases

- **TC-CRX-964** — Any logged-in user can open Help regardless of Crux permissions: confirm the zero-permission
  user can still open `/crux/help` itself without a 403 (only the page's own CONTENT varies by role/permission,
  the page access itself doesn't require any Crux permission).
- **TC-CRX-965** — Improve wand location text is stale (known issue, dev reference §17 — verify Help still
  describes it as "under the issue's details" when it's actually in the top-right toolbar; this is a documented,
  already-known text issue, not a new bug to file).

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §12.
