# Bug Report Template

- Bug ID: BUG-CRX-143
- Production Redmine Issue ID:
- Title: KB Agent falsely tells a Reporter-role user they lack `view_knowledgebase` permission and need an
  admin to grant it — the user genuinely already has full native view access to the space and its published
  page content; the refusal is entirely fabricated
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, KB Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: daisy.skye (Reporter — neither `manage_knowledgebase_spaces` nor `manage_knowledgebase_pages`,
  but genuinely has view access, confirmed natively)
- Date: 2026-11-03

## Steps to reproduce

1. Confirm natively, logged in as `daisy.skye` (Reporter), that she can genuinely view the Engineering Docs
   space (`/projects/crux-kb-agent-test-project/knowledgebase`) and a real published page's content
   (`/projects/crux-kb-agent-test-project/knowledgebase/nodes/1`, showing the real text "Welcome to the
   engineering team. This page covers setup steps for new hires.").
2. As `daisy.skye`, KB Agent pinned: "Create a new page called 'Reporter Test Page' in the Engineering Docs
   space." (a legitimate negative-permission test — she should be refused for lacking `manage_knowledgebase_
   pages`, which she genuinely lacks).
3. The agent first asks which project; reply "The Crux Knowledge Base Agent Test Project."

## Expected result

Since this was specifically testing a *write* permission gap (creating a page requires
`manage_knowledgebase_pages`, which Daisy genuinely lacks), the refusal should cite the correct missing
permission — `manage_knowledgebase_pages` — not claim she lacks basic view access she genuinely has.

## Actual result

The agent responded: *"I don't have permission to view the knowledge base for the Crux Knowledge Base Agent
Test Project. Your Redmineflux administrator needs to grant you the required permission (`view_knowledgebase`)
in Administration → Roles and Permissions for your role. Once that's done, I'll be able to find the Engineering
Docs space and create the page."*

This is **factually false** — Daisy Skye genuinely already has `view_knowledgebase` access, confirmed natively
on both counts: she can see the Engineering Docs space in the real KB sidebar, and she can read the real,
published "Onboarding Guide" page's actual content. The agent incorrectly reported a missing *view* permission
that doesn't exist, instead of the correct, genuinely-missing *write* permission (`manage_knowledgebase_pages`)
that this request should have been refused for. Beyond being wrong, this misdirects the user into asking an
administrator to grant a permission she already has — wasted effort and a confusing, inaccurate diagnosis from
a tool whose own manifest says it should ground every answer in a real read, never a guess.

Note separately: `view_knowledgebase` isn't even a role-configurable permission on this instance at all (§
confirmed in this suite's Precondition section) — it's implicit for any project member once the module is
enabled — making the agent's specific remediation advice ("grant `view_knowledgebase`... in Roles and
Permissions") doubly wrong, since there's no such checkbox to grant in the first place.

## Evidence

### Console / log

- Native verification, logged in as `daisy.skye`: `/projects/crux-kb-agent-test-project/knowledgebase` shows
  "Engineering Docs Native fixture space for KB Agent QA 2 Pages · 1 Folders" — genuinely visible.
- Native verification, same session: `/projects/crux-kb-agent-test-project/knowledgebase/nodes/1` shows the
  real published content — "Welcome to the engineering team. This page covers setup steps for new hires." —
  genuinely visible.
- Agent response (verbatim): *"I don't have permission to view the knowledge base for the Crux Knowledge Base
  Agent Test Project. Your Redmineflux administrator needs to grant you the required permission
  (view_knowledgebase) in Administration → Roles and Permissions for your role. Once that's done, I'll be able
  to find the Engineering Docs space and create the page."*
- Contrast: an earlier request in the same session, `create_space`, correctly cited the real, actually-missing
  permission — *"You do not have permission to manage knowledgebase spaces."* — showing the agent CAN report
  the correct permission name when the underlying API genuinely returns one; this `create_node` attempt instead
  fabricated a different, incorrect permission name.

**Second reproduction, 2026-11-03 (same session, different scenario)**: as `daisy.skye`, fresh chat, "What does
the Draft Secrets page say...?" (Node #2, genuinely in first-draft status, never published, confirmed natively
unreachable to Daisy — real 403 on direct URL access). The agent correctly refused and did **not** leak the
real confidential content — the most severe possible failure for this scenario did not occur — but used the
identical false reason: *"I don't have permission to view the knowledge base... your Redmineflux administrator
needs to grant you the view_knowledgebase permission..."* The real, documented reason is the page-specific
draft-visibility rule (first-draft pages are visible only to their author + `manage_knowledgebase_pages`
users), not a blanket view_knowledgebase gate — and Daisy demonstrably already has `view_knowledgebase` (she
can read the real published "Onboarding Guide" page in the same space). This confirms the false-reason pattern
recurs specifically whenever the underlying API returns a generic view-permission-denied response for what is
actually a more specific, page-level restriction.

## Duplicate check

- Duplicate found: No. First finding of a KB Agent response citing a specific, named permission as missing
  when the user genuinely already has it. Distinct from BUG-CRX-142 (fabricated confirm prose) and BUG-CRX-140
  (wrong project/record id on write confirm cards) — this is a false *diagnosis* of a permission state, on a
  successfully-reached refusal path, not a confirm-card or targeting defect.
