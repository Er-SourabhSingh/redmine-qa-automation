# Bug Report

- Bug ID: BUG-CRX-191
- Production Redmine Issue ID: #128704 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127938 (CRUX_PLATFORM_PIPELINES), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: "I couldn't find a tool for this here... It can be done directly in Redmineflux" fallback message claims a native alternative exists for creating a Work Package on a custom pipeline, when no such native path exists anywhere in the product
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Manager agent — governed write-refusal fallback text)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-16)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-16

## Steps to reproduce

1. Create a genuine custom pipeline via `/crux/pipelines` → "+ New Pipeline" (e.g. `qa-custom-test`: stages
   `draft → review → ship`, one gate `ship-approve` before `ship`). Confirm it saves correctly.
2. Create a fresh ticket, tag it `readyforagent`.
3. Via Ask Crux chat, ask the Project Manager: *"Create a work package for issue #<id> using the pipeline
   'qa-custom-test'. Goal: ..."* — tried twice with different phrasing, same result both times.
4. Read the reply's full text, specifically the second sentence.
5. Look for a native (non-chat) way to actually create a Work Package anywhere in the product: the global
   Work Packages list (`/crux/work_packages`), the project's Crux tab, and the ticket's own issue page
   (including its "Improve with Crux" wand icon).
6. Cross-check against the developer's own feature reference (`CRUX_DEV_FEATURE_REFERENCE_20261105.md`,
   lines 136-137, 144, 439).

## Expected result

Either: (a) the message's claimed alternative ("It can be done directly in Redmineflux") should only be shown
when a genuine native path actually exists for the specific capability being refused, or (b) for capabilities
documented as impossible everywhere (not just from chat), the message should say so plainly instead of pointing
the user toward a non-existent UI feature.

## Actual result

Crux replied (both attempts, verbatim): *"I couldn't find a tool for this here, so I can't do it from this
chat. **It can be done directly in Redmineflux**; if you expected Crux to do it, an administrator can check
this deployment's tool setup."*

The "It can be done directly in Redmineflux" clause is **false** for this specific capability:
- No "New Work Package" button or equivalent exists anywhere searched: not on the global Work Packages list,
  not on the project's Crux tab, not on the ticket's own issue page.
- The developer's own feature reference confirms this isn't a search gap but a documented limitation: *"How a
  Work Package is created: only through Ask Crux"* (line 136-137) and *"Not possible from chat, by design:...
  choosing a custom pipeline"* (line 144) and *"pick a custom pipeline in chat | Not built — Work Packages are
  created only"* (line 439).

Combined, these confirm: a Work Package can **only** ever be created through chat, and chat can **only** ever
use the 3 built-in pipelines. There is therefore no path — chat or native — by which a Work Package can ever be
attached to a custom pipeline. The refusal message's suggested escape hatch ("directly in Redmineflux") sends a
real user looking for a feature that was never built, which would misdirect any troubleshooting exactly the way
BUG-CRX-061's "an administrator can check this deployment's tool setup" clause was found to do for falsely-denied
*existing* tools.

**This is a different root cause from BUG-CRX-061 (closed/fixed 2026-10-27).** BUG-CRX-061 was about the denial
itself being false (a genuinely-registered tool being claimed unavailable). Here, the denial is correct — no
tool exists, by design — but the same boilerplate reply template appends "It can be done directly in
Redmineflux" unconditionally, without checking whether a native alternative genuinely exists for the specific
capability being refused. The fallback text appears to be static/templated rather than conditioned on the real
capability gap.

## Evidence

### Screenshot

(Not separately captured — the chat transcript itself is the evidence; the reply text is quoted verbatim above
and reproduced identically across 2 independent phrasings in this session's Ask Crux chat, session id visible
in the "Create a work package for issue #79 usin..." chat history entries.)

### Console / log

- Chat reply (attempt 1): *"I couldn't find a tool for this here, so I can't do it from this chat. It can be
  done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's
  tool setup."* (cost $0.06)
- Chat reply (attempt 2, reworded request): identical text (cost $0.01)
- Dev reference citations confirming no native path exists: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` lines
  136-137, 144, 439.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md` and `bugs/_index.md` — this exact fallback sentence is
  already the subject of **BUG-CRX-061** (closed, fixed 2026-10-27), but that bug's entire scope was false
  denials of *genuinely-registered, existing* tools (Membership/Version/Issue Category/Time Entry/News/
  Documents/Wiki writes) — 17 repros, all confirmed by source-grepping a real implemented tool the denial
  falsely claimed didn't exist. This bug is the opposite half of the same sentence: the denial itself is
  **correct** (no tool exists for custom-pipeline WP creation, confirmed by the dev's own documentation), but
  the sentence's own suggested fallback ("directly in Redmineflux") is what's false here, for a capability that
  is genuinely, permanently unavailable everywhere — not a case BUG-CRX-061's repros covered or could have
  covered, since all of them involved a real tool the agent should have called.
