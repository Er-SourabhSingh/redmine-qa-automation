# Bug Report Template

- Bug ID: BUG-CRX-169
- Production Redmine Issue ID:
- Title: Improver Agent answers an ordinary Ask Crux chat message with a raw JSON array instead of readable
  text — exactly the failure mode its own manifest explicitly calls out and forbids
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Improver agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As `admin`, Improver agent pinned, fresh chat (ordinary Ask Crux chat window, **not** the "Improve with
   Crux" wand panel on an issue page — the message does not start with "Issue subject:").
2. Ask: "Improver, break issue #34 into subtasks."

## Expected result

Per the Improver's own manifest (`redmineflux-crux-core/agents/improver.md`, "Two ways you are used"):
*"**Ask Crux chat** is any other message... **Never answer a chat message with JSON**, a code fence or a bare
array: the person reads your answer directly. Answer as a normal chat: 1. read the issue... 2. show the
proposed subtasks... as readable text..."* The response should be plain, readable chat text listing the
proposed subtasks.

## Actual result

The entire response was a single, bare **JSON array inside a code block** — the exact "Panel output" format
the manifest reserves strictly for the wand panel's own machine-readable protocol:

```
[ {"subject": "Profile dashboard load times", "description": "Measure dashboard page load time and identify the slowest components using browser dev tools."}, {"subject": "Optimize slow database queries", "description": "Refactor or index the queries that load dashboard data to reduce query time."}, {"subject": "Cache dashboard results", "description": "Add caching layer (Redis or similar) for dashboard data that doesn't need real-time updates."}, {"subject": "Lazy-load dashboard widgets", "description": "Defer loading of non-critical dashboard sections until user scrolls into view."}, {"subject": "Verify dashboard performance improvement", "description": "Measure final page load time and confirm it meets an acceptable threshold."} ]
```

No prose, no readable list, no explanation — just the raw array, exactly as the manifest says must never be
shown to a human chat user. A person reading this in the Ask Crux chat window would see unparsed JSON syntax
instead of a usable list of proposed subtasks.

Separately (lower priority, same response): the 5 subtasks also invent a specific unstated tech stack (browser
dev tools, a Redis caching layer, lazy-loading, database query optimization) for issue #34, whose real
description is only "The dashboard feels slow for some users. Please look into making it load faster." — no
mention of caching, Redis, or any specific technical approach. This compounds the output-format violation with
the same fabricated-specifics pattern already seen in BUG-CRX-166 (Test Author) and BUG-CRX-167 (Docs Writer).

## Evidence

### Console / log

- User message (verbatim, genuinely an ordinary chat message, not the panel trigger): *"Improver, break issue
  #34 into subtasks."*
- Full response (verbatim): a single JSON array, exactly as quoted above — no surrounding prose at all.
- Issue #34's real description (confirmed via native UI): "The dashboard feels slow for some users. Please
  look into making it load faster." — no technical approach specified.

## Duplicate check

- Duplicate found: No. First finding on the Improver agent. Shares the general over-invention pattern with
  BUG-CRX-166/167, but the primary and most severe defect here is distinct and more fundamental: a direct,
  literal violation of the agent's own explicit, repo-documented mode-detection rule ("never answer a chat
  message with JSON") — not a content-fabrication issue alone.
