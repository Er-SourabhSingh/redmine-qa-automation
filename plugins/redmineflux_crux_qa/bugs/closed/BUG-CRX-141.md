# Bug Report Template

- Bug ID: BUG-CRX-141
- Production Redmine Issue ID: #127508
- Title: KB Agent's `update_node` silently edits a PUBLISHED page's live title/content with no new version
  snapshot created and no draft intermediate state — directly contradicting the plugin's own documented
  versioning rule ("Versions are created only on publish or update") and leaving the page's "Current Version"
  record permanently out of sync with what readers actually see
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, KB Agent) / redmineflux_knowledgebase (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. Confirm a page is genuinely **Published**, with exactly one real version (v1) in its version history, whose
   title/content matches the live page exactly (fixture: Node #1 "Onboarding Guide", v1, "Welcome to the
   engineering team...").
2. As `admin`, KB Agent pinned, fresh chat: "Update the Onboarding Guide page in the Engineering Docs space
   for the Crux Knowledge Base Agent Test Project: change the title to 'New Hire Onboarding Guide'." Confirm
   the resulting `Kb Update Node` card.
3. Natively inspect both the page's live view (`/projects/<project>/knowledgebase/nodes/1`) and its version
   history (`/projects/<project>/knowledgebase/nodes/1/versions`).

## Expected result

Per the vendor documentation's explicit rule — "Editing a published page creates a draft, but the page stays
live until Update is clicked" and "Versions are created only on publish or update, never on auto-save" — an
edit to a published page's real content/title should either (a) go into a draft state that doesn't change what
readers currently see until a separate publish step, or (b) if it does take effect immediately, create a new
version snapshot recording the change, so the version history stays an accurate, complete record of what the
page has actually shown over time.

## Actual result

Neither happened. After confirming the `update_node` call:
- The page's live heading and breadcrumb **immediately** show the new title ("New Hire Onboarding Guide") —
  no draft intermediate state, still showing status **"Published"** (not reverted to draft, not shown with any
  "pending edit" indicator).
- The version history page still shows **only 1 version total** ("1 Releases") — version 1, still titled
  **"Onboarding Guide"** (the OLD, pre-edit title), still marked **"Current Version"**, with its expandable
  content still reading the original "Welcome to the engineering team..." text.

So the live page and its own "Current Version" version-history record have silently diverged: a reader
looking at the live page sees "New Hire Onboarding Guide," but the version history — the documented,
immutable audit trail — still shows "Onboarding Guide" as the "Current Version," with no record anywhere that
a title change ever happened, when it happened, or who made it. This is a genuine audit-trail integrity defect
on a plugin whose version history is specifically documented as the mechanism for tracking exactly this kind
of change.

## Evidence

### Screenshot

(not captured as a static image this session — reproduced via direct native navigation; see Console/log for
exact page states observed)

### Console / log

- Pre-edit native state: Node #1 "Onboarding Guide," status Published, version history "1 Releases" (v1,
  "Onboarding Guide," Current Version, content "Welcome to the engineering team...").
- Agent confirm card (verbatim): `Project: Crux Knowledge Base Agent Test Project`, `Node: 1`, `Title: New
  Hire Onboarding Guide`. Result: *"✓ Node #1 'New Hire Onboarding Guide' updated."*
- Post-edit native state, `/projects/crux-kb-agent-test-project/knowledgebase/nodes/1`: heading and breadcrumb
  both genuinely read "New Hire Onboarding Guide," status badge still genuinely reads **"Published"**.
- Post-edit native state, `/projects/crux-kb-agent-test-project/knowledgebase/nodes/1/versions`: still
  genuinely shows **"1 Releases"** total — version 1 still titled "Onboarding Guide," still marked "Current
  Version," its own expanded content still genuinely reading "Welcome to the engineering team... setup steps
  for new hires" (the original, pre-edit text) — no v2 was ever created.

## Duplicate check

- Duplicate found: No. First finding on the KB Agent's content/version lifecycle specifically. Distinct from
  BUG-CRX-140 (project-identifier/wrong-record-id confirm-card defect on write tools generally) — this bug is
  about what `update_node` does to the plugin's own documented versioning guarantee once a write does
  genuinely succeed, not about which project/record it targets.

## Retest — 2026-11-04 (FIXED)

Developer pulled `redmineflux_knowledgebase`, `redmineflux-crux-core`, `redmineflux-mcp` (`crux_development`),
and `redmineflux_crux` to the commits named in this round's retest guide (same pull/migrate/restart cycle as
the Workload-domain retest). Retested in a fresh chat (`ses-375`, KB Agent pinned, so BUG-CRX-140's separate
project-identifier defect didn't confound this check):

1. Pre-edit native baseline: Node #1 "New Hire Onboarding Guide" (title from this suite's earlier fixture
   edits), status Published, version history "1 Releases" — v1 still titled "Onboarding Guide" (old,
   pre-earlier-edit title), marked Current Version.
2. Sent: "Update the New Hire Onboarding Guide page ... change the title to 'New Hire Onboarding Guide -
   Retest Edit'." Confirm card correctly showed `Project: Crux Knowledge Base Agent Test Project`, `Node: 1`,
   `Title: New Hire Onboarding Guide - Retest Edit`. Confirmed.
3. Native-verified `/projects/crux-kb-agent-test-project/knowledgebase/nodes/1`: heading now reads "New Hire
   Onboarding Guide - Retest Edit", status still genuinely "Published".
4. Native-verified `/projects/crux-kb-agent-test-project/knowledgebase/nodes/1/versions`: now genuinely shows
   **"2 Releases"** — the Current Version entry correctly titled "New Hire Onboarding Guide - Retest Edit",
   with the prior version ("Onboarding Guide") preserved as history below it.

A new version snapshot is now created on `update_node`, exactly matching the plugin's documented versioning
rule and closing the audit-trail gap this bug reported. **Status: FIXED.** Moved to `bugs/closed/`.
