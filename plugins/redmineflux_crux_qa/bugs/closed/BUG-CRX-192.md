# Bug Report

- Bug ID: BUG-CRX-192
- Production Redmine Issue ID: #128743 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127600 (CRUX_AGENT_HELPDESK), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: Helpdesk Agent falsely denies the real `kb_reorder_page` tool exists, and suggests a non-existent "drag to reorder" native UI alternative
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Ask Crux chat UI, Helpdesk Agent — Knowledgebase tool group)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-16)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-16

## Steps to reproduce

1. In project #12 ("Crux Helpdesk Agent Test Project"), with 2 knowledgebase pages present ("VPN Setup Guide
   Retest" id 1, "Password Reset Guide" id 2), pin the Helpdesk Agent in a fresh Ask Crux chat.
2. Ask: *"Move the 'Password Reset Guide' page to position 1, before VPN Setup Guide Retest, in project 12's
   knowledgebase."*
3. Read the reply in full.
4. Independently confirm whether a `kb_reorder_page`-equivalent tool actually exists and whether it works, by
   calling `redmineflux_helpdesk_kb_reorder_page(page_id=2, position=0)` directly via MCP, then checking the
   native `/helpdesk/knowledgebase` page list order.

## Expected result

If a real tool exists for the capability being asked about, the agent should discover and use it (per this
plugin's own established pattern: every other Helpdesk write tool this cycle — tickets, SLA, support levels,
organizations, entitlement, products, holidays, support packages, prepaid hours, canned responses, customers,
KB create/update/publish/delete — was successfully discovered and called). If it genuinely can't find or use a
tool, it must not claim a false alternative path exists.

## Actual result

Crux replied: *"The knowledgebase tools available don't include a reordering or position-setting function...
not for moving pages to specific positions in the hierarchy. **You can reorder knowledgebase pages through the
Redmineflux UI itself, but there's no API tool exposed for that operation.** I'd recommend using the
knowledgebase editor in the web interface to drag the 'Password Reset Guide' page to position 1."*

Both halves of this claim are **false**:
- **The tool genuinely exists and is registered**: `redmineflux_helpdesk_kb_reorder_page(page_id, position)` —
  confirmed via direct schema lookup (`ToolSearch`) and by actually calling it:
  `redmineflux_helpdesk_kb_reorder_page(page_id=2, position=0)` → `"Page #2 reorder to position 0 requested."`
- **The reorder genuinely, natively worked**: before the call, `/helpdesk/knowledgebase`'s page sidebar listed
  "VPN Setup Guide Retest" then "Password Reset Guide"; after the call, the same native page (no cache, fresh
  navigation) listed **"Password Reset Guide" first, then "VPN Setup Guide Retest"** — the exact reorder the
  user asked for, genuinely persisted server-side.

So the capability is fully real and fully functional via the agent's own tool layer — the agent simply failed
to discover/reach `kb_reorder_page` (likely a discovery-group gap, since this tool group's other 2026-11-05
session already proved KB tools are reachable once discovered) and then, rather than saying "I couldn't find a
tool for this," fabricated a specific, confident, and **wrong** claim that no such tool is exposed anywhere,
plus a fake native UI workaround ("drag... in the web interface") that was never verified to exist and sends
the user looking for a feature that may not be there either.

This is the same root-cause family as the already-fixed BUG-CRX-061 (false denial of a real, existing tool) —
but a **new occurrence on a different agent** (Helpdesk, not Project Manager/Reviewer/etc.) and a **new specific
tool** (`kb_reorder_page`), proving the false-denial defect family was not eliminated platform-wide by the
BUG-061 fix, only for the cases BUG-061's own repros happened to cover.

## Evidence

### Console / log

- Chat reply (verbatim): *"The knowledgebase tools available don't include a reordering or position-setting
  function. The tools I have access to are for listing, reading, and managing content and versions — but not
  for moving pages to specific positions in the hierarchy. You can reorder knowledgebase pages through the
  Redmineflux UI itself, but there's no API tool exposed for that operation. I'd recommend using the
  knowledgebase editor in the web interface to drag the 'Password Reset Guide' page to position 1."*
  (anthropic/claude-haiku-4.5 · 47,009 in / 264 out · $0.0089)
- Direct tool call proving the tool exists and works: `redmineflux_helpdesk_kb_reorder_page(page_id=2,
  position=0)` → `"Page #2 reorder to position 0 requested."`
- Native page list before: `[1] VPN Setup Guide Retest — None`, `[2] Password Reset Guide — None` (MCP
  `kb_list_pages`, matches sidebar order)
- Native page list after (fresh `/helpdesk/knowledgebase` navigation): sidebar shows "Password Reset Guide"
  listed before "VPN Setup Guide Retest" — reorder genuinely persisted.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md`/`bugs/_index.md` — BUG-CRX-061 (closed, fixed 2026-10-27)
  covers the same false-denial *pattern* but its own 17 repros were all on different agents/tools (Membership,
  Version, Issue Category, Time Entry, News, Documents, Wiki writes — none Helpdesk/KB). BUG-CRX-191 (closed,
  fixed 2026-11-16 today) is the *other* half of this same family (a correct denial with a false "do it in
  Redmineflux" fallback) — this bug is the *first* half again (the denial itself is false), recurring on a
  brand-new tool/agent combination the BUG-061 fix evidently didn't generalize to.

## Retest — 2026-11-17 (CONFIRMED FIXED)

Developer moved this to "In QA" on production. Pulled latest code on all 3 repos (`redmineflux-crux-core`
picked up CRC-108 "helpdesk-kb-reorder-false-denial"), rebuilt `mcp`/`crux-core` images, restarted `redmine`
in dependency order, verified all 3 services healthy.

Re-ran the exact original repro: created a fresh 2nd KB page ("Retest Second Page") in project #12, asked the
Helpdesk Agent via chat to move it to position 1 before "VPN Setup Guide Retest." This time the agent
genuinely proposed a real confirm card — **"Helpdesk Kb Reorder Page"**, `Position: 0` — no false denial, no
fake drag-to-reorder suggestion. Confirmed → native-verified via a fresh `/helpdesk/knowledgebase` navigation:
"Retest Second Page" now genuinely listed before "VPN Setup Guide Retest." **Confirmed FIXED.**
