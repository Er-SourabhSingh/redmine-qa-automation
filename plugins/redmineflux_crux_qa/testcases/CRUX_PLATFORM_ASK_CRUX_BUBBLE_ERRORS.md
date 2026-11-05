# Test Suite — Crux Platform: Share, Personal Limit, Floating Bubble, Errors & Issue-Page Integration

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.9–13.12 and §14. Plugin: redmineflux_crux.
> Redmine 6.0-bookworm, localhost:3015.
> TC range: TC-CRX-1021 to TC-CRX-1075.

## Fixtures needed

- A second real Redmineflux user to share a chat with.
- An issue with an empty description (for the Improve-description ⚠ DRAFT case) and one with a non-empty
  description.
- A ticket genuinely belonging to an active Work Package (for the WP section and its @-mention/frozen-ticket
  interactions).
- A frozen-ticket fixture and a suggest-only-Work-Package ticket fixture (reuse from the Frozen Rules / Work
  Packages suites) specifically for the @-mention no-reply checks.
- A way to simulate at least one error condition per §13.12 category if feasible (e.g. a deliberately wrong
  Core URL for "Crux is unavailable", an expired session for 401) — accept some as documented-only if not
  independently reproducible this round.

## Share (full page)

- **TC-CRX-1021** — Share a chat with a real username: open Share, add a valid existing Redmineflux username,
  confirm a chip appears for them and they gain access.
- **TC-CRX-1022** — Share with a nonexistent username: confirm "There's no active Redmineflux user with the
  username …".
- **TC-CRX-1023** — Share with yourself: confirm "This conversation is already yours".
- **TC-CRX-1024** — Revoke access via ×: remove a viewer's chip, confirm their access stops immediately (verify
  from their own session — reload should kick them out / show it's no longer shared).
- **TC-CRX-1025** — Viewer side — read-only banner and missing controls: as the invited viewer, confirm the chat
  appears under "Shared with you", shows "Shared by <owner> — read-only…", and has NO composer, Share, ⋯, or
  Kept-answers controls.
- **TC-CRX-1026** — Viewer auto-refreshes: while the viewer has the shared chat open, have the owner send a new
  message — confirm it appears on the viewer's side within ~4 seconds without a manual reload.
- **TC-CRX-1027** — Only the owner can share/unshare: confirm a viewer has no Share button of their own, even to
  re-share with a third person.

## Personal daily limit

- **TC-CRX-1028** — Set a valid personal limit via the header pill, confirm Save persists it and the pill updates
  to show "$X/day · $Y today" format.
- **TC-CRX-1029** — Clear removes the limit, pill reverts to "no limit set".
- **TC-CRX-1030** — It's a reminder only, never blocks: exceed the personal limit via real chat usage — confirm
  chat continues to work normally (just shows the warning note under answers, per TC-CRX-1010), distinct from the
  admin cap which genuinely blocks at 100%.
- **TC-CRX-1031** — Works independently of the admin cap: with NO admin cap configured at all, confirm the
  personal limit still functions (warns once exceeded) — it doesn't require an admin cap to exist first.
- **TC-CRX-1032** — Validation — non-numeric input rejected: "Enter an amount in US dollars, for example 2.50."
- **TC-CRX-1033** — Validation — $0 or less rejected: "A $0 limit would never remind you…" (or equivalent).
- **TC-CRX-1034** — Validation — over $10,000 rejected: "Enter an amount of $10,000 or less."

## Floating bubble (site-wide)

- **TC-CRX-1035** — Bubble appears on every Redmine page except `/crux/ask` and the 2FA pages — spot-check a
  normal issue page, a project page, and confirm it's genuinely absent on `/crux/ask` itself and a 2FA page (if
  2FA is configured; otherwise document as not independently verified).
- **TC-CRX-1036** — Pulses until first opened, and the optional Launch teaser label shows until then — open it
  once, confirm both the pulse and the teaser stop appearing on subsequent page loads in the same browser.
- **TC-CRX-1037** — Header controls: agent switcher, + New chat, History (last 5 chats + "See all ↗"), Open full
  view, × — confirm each works (switcher changes agent, New chat starts fresh, History opens a past chat,
  Open full view opens the SAME chat on the full `/crux/ask` page, × closes the bubble).
- **TC-CRX-1038** — Bubble knows the current page as context: open it on a specific issue page, ask a vague
  question like "what's going on here?" — confirm the response correctly references "issue #N" without the user
  having stated the number; repeat on a project page for "project X" context.
- **TC-CRX-1039** — Empty state: greeting + up to 5 prompt chips (Settings-configured), matching the full page's
  own New Chat screen content.
- **TC-CRX-1040** — Bubble has Copy, "Used N sources" (NOT the full page's "Checked N things" wording — confirm
  the bubble's own distinct wording), and Confirm/Cancel cards that function identically to the full page's.
- **TC-CRX-1041** — Bubble is missing, by design, vs. the full page: Keep, Ask again, @-mention, the cost header,
  Share, Kept answers, and the personal limit pill — confirm all 7 are genuinely absent from the bubble UI.
- **TC-CRX-1042** — State remembered between page navigations: open/closed state, the active chat, and the picked
  agent all persist as you navigate from one Redmine page to another with the bubble open.
- **TC-CRX-1043** — ≤520px width collapses to a full-screen sheet: resize the browser (or use a mobile viewport)
  to ≤520px, confirm the bubble panel becomes a full-screen takeover rather than a small floating panel.
- **TC-CRX-1044** — No Stop button, no file upload, no keyboard shortcut to open — confirm all 3 "not there, by
  design" items are genuinely absent (don't file any of these as bugs if confirmed absent, per §15).

## Errors & recovery

- **TC-CRX-1045** — 401 → "Your Redmineflux session has expired…": reproduce by expiring/invalidating the
  session (e.g. logging out in another tab then sending a message) — confirm this specific message.
- **TC-CRX-1046** — 403 → "You don't have permission…": reproduce by having a permission revoked mid-session
  (e.g. remove Use Ask Crux from the current user's role while they have the page open), then send a message.
- **TC-CRX-1047** — Core-down → "Crux is unavailable right now…": temporarily point the Core service URL at an
  unreachable address, confirm this exact message appears for an ordinary chat attempt (restore the URL
  afterward).
- **TC-CRX-1048** — AI-provider problems each get a distinct message: if reproducible this session (e.g.
  temporarily disable the active provider/key), confirm a specific, non-generic message for at least one of: no
  key, key rejected, out of credit, model unavailable — and that an admin additionally sees a fix link.
- **TC-CRX-1049** — Error bubble has Retry, and unsent text is restored: trigger any error mid-send, confirm the
  message box still has your original text (not lost), and Retry re-attempts it.
- **TC-CRX-1050** — Auto-recheck after an error: after an error, wait and confirm Crux re-checks roughly every 10
  seconds, eventually showing "Crux is back. You can try again now." once the underlying issue is resolved.
- **TC-CRX-1051** — "Crux didn't send an answer. Please try again." and "The answer was cut off. Please try
  again." — reproduce if feasible (e.g. a deliberately interrupted/truncated response), else document as not
  independently reproduced this round.
- **TC-CRX-1052** — Status line rotates and shows "(still working…)" after 20s: ask a question likely to take a
  while, observe the rotating status messages, and confirm the "(still working…)" suffix appears once 20 seconds
  have passed.

## Issue page — Improve with Crux (wand)

- **TC-CRX-1053** — Wand icon location: confirm it's in the issue's top-right toolbar next to Copy (NOT "under
  the issue's details" as Help currently, incorrectly, describes — dev reference §17).
- **TC-CRX-1054** — Break down the work — positive: propose subtasks (2–7, all pre-ticked), untick a couple,
  click "Create selected" — confirm only the still-ticked subtasks are created, and the result reads "✓ Created N
  subtasks" with a reload after ~1.5s.
- **TC-CRX-1055** — Break down the work — partial failure: if reproducible, cause one proposed subtask's creation
  to fail (e.g. a permission issue on a sub-project) — confirm "⚠ Created x of y…" with reasons and a "Reload
  page to see them" prompt, not a blanket success or blanket failure.
- **TC-CRX-1056** — Break down the work — untick everything: confirm "Select at least one subtask to create." and
  no write happens.
- **TC-CRX-1057** — Re-confirming never duplicates: after a successful "Create selected", re-open the panel and
  attempt the same action again — confirm no duplicate subtasks are created for the already-created ones.
- **TC-CRX-1058** — Improve the description — positive, non-empty description: confirm a Before/After card with
  an added Acceptance Criteria section; Apply → "✓ Description updated." + reload.
- **TC-CRX-1059** — Improve the description — empty description: confirm a ⚠ DRAFT is generated from the subject
  line when the issue's description is empty.
- **TC-CRX-1060** — Improve the description — no edit rights: as a user without edit permission on the issue,
  attempt Apply — confirm "the write did not take effect — you may not have permission" (an honest failure, not
  a false success).
- **TC-CRX-1061** — Cancel on either panel shows "Cancelled." and genuinely makes no write.
- **TC-CRX-1062** — 👍/👎 feedback — one-time only: rate a suggestion, confirm "Thanks for the feedback.", and
  that re-rating the SAME suggestion is disabled/doesn't double-count.
- **TC-CRX-1063** — "Ask about this issue" opens the bubble with `#<id>` pre-typed in the message box.
- **TC-CRX-1064** — Each Improve suggestion is recorded as a run: confirm a new row appears in the Run ledger for
  each Improve action taken (cross-reference the Run Ledger suite's TC-787).

## Issue page — @-mention an agent in a comment

- **TC-CRX-1065** — `@crux <verb>` routes correctly for all 5 documented verbs: `status`→Project Manager,
  `summarize`→Digest, `research`→Research, `enhance`/`categorize`→Intake Clarifier, `breakdown`/`themes`→Work
  Package Planner — test at least one comment per verb and confirm the correct agent's name appears in the reply
  footer.
- **TC-CRX-1066** — `@crux` with no verb defaults to Project Manager.
- **TC-CRX-1067** — Unknown agent name gets a note listing the valid verbs, not a crash or silence.
- **TC-CRX-1068** — Reply appears only on next page load, not live: post a mention, immediately check without
  reloading (confirm no reply yet), then reload the issue page and confirm the reply has now appeared.
- **TC-CRX-1069** — Reply is only a comment, never a field change: confirm no issue field (status, assignee,
  etc.) changes as a side effect of an @-mention reply, even for a `status`-verb question.
- **TC-CRX-1070** — Reply posts as the agent's real paired user if one exists, else the service account with a
  disclosure line: test both cases if a paired agent identity is available from the Agent Fleet suite's TC-828.
- **TC-CRX-1071** — Footer format: "— <Name> · run-id" — confirm this exact format on a real reply.
- **TC-CRX-1072** — No reply loops: have an agent's own posted reply comment accidentally match a mention pattern
  (if constructible) — confirm it never triggers a second reply to itself.
- **TC-CRX-1073** — Suggest-only WP and frozen-ticket tickets get NO reply (cross-reference TC-CRX-765 and
  TC-CRX-928 — re-verify specifically via the @-mention path here, not just the generic write path).
- **TC-CRX-1074** — At most 20 mentions answered per page load: if constructible (20+ pending mentions on one
  issue, unlikely but worth noting as a boundary), confirm the 21st+ are deferred to the next page load rather
  than silently dropped or all answered at once.

## Issue page — Work Package section

- **TC-CRX-1075** — Read-only summary appears only for a WP-linked ticket, after the Description: goal, "this
  ticket is 1 of N", status pill, step list with ✓/locks, Now/Latest update/Approvals, and a working "Open in
  Crux" link (to the project-scoped or global WP page, whichever the viewer can see) — confirm it's genuinely
  read-only (no Approve button appears here even for an approver — that action lives only on the Dashboard/WP
  list pages).

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.9–13.12, §14.
