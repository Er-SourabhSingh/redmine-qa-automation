# Bug Report Template

- Bug ID: BUG-CRX-107
- Production Redmine Issue ID: #126321
- Title: Budget Agent has no way to discover a project's issue categories by name — a real user cannot act on "approve hours for category X" at all without first leaving the chat to look up a numeric category id natively
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Budget Agent, Budget & Audit plugin domain)
- Plugin version: redmineflux_budget_and_audit 2.1.0 / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fixture ground truth: project 5 ("Crux Budget Agent Test Project") genuinely has a real issue category
   ("Development," id 67), visible and selectable natively via a simple, standard dropdown on the native
   "Approve hours" form (Approved hours / Category / Comment — all 3 required fields).
2. Fresh chat, Budget Agent (pinned), admin: "What categories are available for project ID 5, so I know
   which one to approve budget hours for?"

## Expected result

Per the persona's own advertised natural-language pattern ("Budget Agent, ... set the budget cap on
project Y to $50,000" style phrasing, and "approve X hours for this category" per the tool's own
docstring), a user should be able to refer to a category by its real name (e.g. "Development") the same
way they refer to a project by name. The native UI's own category field is a simple dropdown of names —
categories are not an obscure backend-only concept a user would be expected to already know the numeric id
for.

## Actual result

The agent honestly disclosed it has **no tool at all** to enumerate a project's categories: *"I don't have
a tool available to list the issue categories for a project directly. The Budget/Audit tools I can access
work with category IDs you provide — they don't enumerate the categories themselves."* It correctly
pointed the user to the native Administration → Categories page instead of fabricating a list or guessing
an id — so there is no dishonesty or hallucination here, only a structural capability gap: **every one of
the Budget Agent's 4 tools requires a numeric `category_id` as input, and none of them, nor any other tool
in its `allowed_tools` list, can resolve a category name to that id.** A real user who knows their
project's categories only by name (the only way they are ever shown natively) has no way to use the
"approve N hours for category X" natural-language pattern the plugin's own tool docstrings describe — they
must leave the chat entirely, find the native Categories page, and manually note down a numeric id before
the chat becomes usable at all.

This was initially logged as a documentation-only "honest gap, not a bug" finding (TC-CRX-412), but on
review this blocks a core, advertised interaction pattern of the agent rather than being a peripheral
missing feature — consistent with this QA cycle's precedent of reclassifying a missing capability as a
bug when it blocks the agent's own central use case (see BUG-CRX-105, Scrum Agent Story Points).

## Evidence

### Console / log

- Chat reply (verbatim): *"I don't have a tool available to list the issue categories for a project
  directly. The Budget/Audit tools I can access work with category IDs you provide — they don't enumerate
  the categories themselves. To find the available categories for project ID 5, you'll need to: 1. In
  Redmineflux, navigate to Administration → ... Categories section, or 3. Ask your Redmineflux
  administrator for the list of active category IDs assigned to that project."*
- Source confirmed (`agents/budget-audit.md` `allowed_tools`): only `get_budget_status`,
  `list_approved_hours`, `get_approved_hour`, `set_budget` — none resolve category names, and no core
  category-listing tool (e.g. `redmineflux_core_list_issue_categories`) is exposed to this agent at all.
- Native UI ground truth: the "Approve hours" form's own Category field is a plain dropdown of category
  names (per the screenshot reviewed with the user) — confirming categories are an everyday, name-visible
  concept to a real user, not a numeric-id-only backend detail.

## Duplicate check

- Duplicate found: No. First finding on the Budget Agent's category-handling. Related in shape to
  BUG-CRX-105 (Scrum Agent, Story Points) — both are "the agent's only path to a core input requires
  information a real user doesn't have and the agent has no way to resolve" — but a distinct root cause
  (missing lookup tool vs. missing writable field) and a distinct domain. Kept as its own bug file per the
  one-bug-per-domain rule.
