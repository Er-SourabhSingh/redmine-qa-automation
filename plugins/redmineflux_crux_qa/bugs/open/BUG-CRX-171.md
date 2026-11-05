# Bug Report Template

- Bug ID: BUG-CRX-171
- Production Redmine Issue ID: #127882
- Title: Auto-mode routing sends a "probable cause" question to Project Manager instead of Root-Cause Analyst —
  reproduced 2/2
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto routing)
- Plugin version: crux-core 1.1.0 (source commit `347ee6e`)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-05

## Steps to reproduce

1. As admin, in a genuinely fresh chat (New chat clicked), leave the agent picker on **Auto**.
2. Ask: "What is the probable cause of issue #33?"
3. Observe which agent's name appears on the response (the response header shows the agent's initials + name —
   the UI's visible equivalent of the documented "→ asking the …" delegation byline).
4. Repeat in a second fresh chat with the identical question.

## Expected result

Per the developer's own feature reference (`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.2), Auto routing should
read the question and hand it to the right agent — a "probable cause" question is Root-Cause Analyst's own
documented read test (AGENT-TEST-GUIDE.md §2: "What is the probable cause of #?"). The response should come
from Root-Cause Analyst, not Project Manager.

## Actual result

Both attempts routed to **Project Manager** instead of Root-Cause Analyst. Reproduced 2 of 2 times, in two
separate fresh chats.

Note: in this specific instance, issue #33 is a mislabeled Bug that's actually a feature request (no real root
cause to investigate), and Project Manager's actual answer was reasonable given that — it correctly noted #33
isn't a real bug and there's "no probable cause described because there is no root issue to investigate here."
This makes the *content* of PM's specific answer defensible, but the *routing decision itself* is still wrong:
a "what is the probable cause" question should reach Root-Cause Analyst regardless of whether that issue turns
out to have one, the same way a human triager would hand the question to the right specialist and let them
determine there's nothing to investigate — not have a generalist intercept and answer it directly.

## Evidence

### Console / log

- Attempt 1 (verbatim question): "What is the probable cause of issue #33?" → response header: "Project
  Manager" (not Root-Cause Analyst). Response text (verbatim): "Issue #33 is labeled as a **Bug**, but looking
  at the description and journal, this isn't actually a bug report — it's a feature request or task... There
  is **no probable cause described** because there is no root issue to investigate here..."
- Attempt 2 (identical question, fresh chat): identical routing — response header again "Project Manager".

## Duplicate check

- Duplicate found: No. Distinct from the already-closed BUG-CRX-007 (an older, different-shaped routing defect:
  "domain-inference chat routing never fires on a bare domain question at all, only `@crux`/`@AgentName` work")
  — that bug was about Auto never engaging a specialist agent under any phrasing; this is about Auto correctly
  engaging *an* agent, but the wrong one, for a specific, well-formed, topic-matching question. Filed per the
  developer's own explicit instruction (`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §16: "Please file these as
  bugs, with the exact question you asked").
