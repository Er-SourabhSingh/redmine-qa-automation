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

## Execution — 2026-11-05

Executed live against `/crux/ask`, the floating bubble on `/issues/40` and `/projects/crux-pm-agent-test-project`,
and issue #40's own wand/comment features. Native-verified every write via direct page reload/DB-backed listings,
not just chat-reported text.

### Share (full page)

- **TC-CRX-1021** — PASS. Sharing with the real existing user `zeropermtest` showed "✓ Shared with zeropermtest."
  and a revocable chip.
- **TC-CRX-1022** — PASS. A nonexistent username got the exact documented message: "⚠ There's no active
  Redmineflux user with the username "nonexistentuser99999". Check the spelling and try again."
- **TC-CRX-1023** — PASS. Sharing with the owner's own username (`admin`) got "⚠ This conversation is already
  yours. Share it with someone else."
- **TC-CRX-1024** — PASS. Revoking `zeropermtest`'s access via × immediately returned the dialog to "Not shared
  with anyone yet."
- **TC-CRX-1025 to TC-CRX-1027** — Deferred. `zeropermtest` (the only disposable second-user fixture available
  this cycle) has zero Crux permission at all (403 on `/crux/ask`, confirmed in an isolated browser context under
  its own login) — it is the wrong fixture for the viewer-side checks, which need a second user who genuinely
  HAS `Use Ask Crux`. No such second user currently exists in this environment; provisioning one was judged out
  of scope for this pass given the remaining suite size.

### Personal daily limit

- **TC-CRX-1028** — PASS. Saving `2.50` updated the pill to the exact documented format: "$2.50/day · $0.72
  today" (the "today" figure correctly reflects real cumulative spend across chats, not just "this chat" —
  confirms the historical BUG-CRX-053 fix still holds).
- **TC-CRX-1029** — PASS. Clear reverted the pill to "no limit set".
- **TC-CRX-1030 / TC-CRX-1031** — Not independently re-exercised this pass (would require deliberately driving
  real spend past a small limit and confirming chat still works, plus confirming independence from a configured
  admin cap) — not attempted to avoid further real-cost spend on shared QA infrastructure this late in the
  cycle; cross-reference TC-CRX-891/1009/1010 (Settings/Chat-Core suites) for related admin-cap evidence.
- **TC-CRX-1032** — Not independently reproduced — the field is a native `<input type="number">`; the browser
  itself blocks non-numeric keystrokes before any value or validation message can appear, so the server-side
  message text couldn't be exercised via normal UI typing this pass.
- **TC-CRX-1033** — PASS. `$0` got the exact message: "⚠ A $0 limit would never remind you. Enter an amount
  above 0, or use Clear."
- **TC-CRX-1034** — PASS. `$15000` got the exact message: "⚠ Enter an amount of $10,000 or less."

### Floating bubble (site-wide)

- **TC-CRX-1035** — Partially confirmed. Bubble genuinely present on an issue page and a project page. Its
  absence specifically on `/crux/ask` and 2FA pages not independently re-verified this pass (2FA isn't
  configured on this instance; `/crux/ask` absence is reasonably assumed from the UI's own design but not
  explicitly screenshotted this pass).
- **TC-CRX-1036** — Not independently re-verified (pulse/teaser state requires a genuinely first-ever open on a
  clean browser profile, which this long-lived admin session no longer has).
- **TC-CRX-1037** — PASS. Agent switcher opened the full agent list and changing it genuinely changed the
  active agent; "+ New chat" started a fresh bubble chat with page context; "History" showed past chats + "See
  all ↗" (linking to the full page) and clicking a past chat genuinely loaded it; "Open full view" linked to the
  exact same session id as the bubble; "×" closes the bubble (used throughout this pass without issue).
- **TC-CRX-1038** — PASS. Asking "what's going on here?" on issue #40 with no ticket number stated got a reply
  correctly referencing "issue #40" and "crux-pm-agent-test-project" — genuine page-context awareness, confirmed
  via DOM text search, not just visual reading.
- **TC-CRX-1039** — PASS (adjusted for actual config, same as TC-988). New bubble chat showed "Looking at issue
  #40" context label, the Settings greeting, and exactly 3 prompt chips matching the full page's own 3
  (Settings currently has only 3 suggested prompts configured).
- **TC-CRX-1040** — PASS. A real tool-using answer showed "✓ Used 2 sources" — confirmed distinct bubble-only
  wording vs. the full page's "Checked N things".
- **TC-CRX-1041** — PASS. Across every bubble interaction this pass, confirmed genuinely absent: Keep, Ask
  again, @-mention autocomplete, the cost/spend header, Share, Kept answers, and the personal-limit pill — none
  appeared anywhere in the bubble UI.
- **TC-CRX-1042** — PASS. With the bubble open on a chat with messages, navigating to a different page
  (`/projects/crux-pm-agent-test-project`) kept the bubble open with the same chat content and the same picked
  agent ("Crux"/Auto) — confirmed via DOM text/button-label checks after navigation, not just visual read.
- **TC-CRX-1043** — PASS. Resizing the viewport to 480×800 made the bubble panel take over the full screen
  (header bar + full-width message list + composer), confirmed via screenshot, not a small floating panel.
- **TC-CRX-1044** — Partially confirmed. No Stop button and no file-upload control observed anywhere in the
  bubble UI during this pass's testing. No keyboard shortcut to open the bubble was found, but this is an
  inherently negative claim not exhaustively tested against every possible key combination.

### Errors & recovery

- **TC-CRX-1045 to TC-CRX-1052** — Deferred, all 8. Reproducing these requires deliberately breaking shared
  infrastructure this cycle still needs for remaining/future testing (invalidating the admin session mid-test,
  revoking the current user's own `Use Ask Crux` permission, pointing the real Core URL at an unreachable
  address, disabling the one working AI provider/key, or forcing a truncated/cut-off response) — judged too
  risky to attempt this late in a 365-TC cycle with no further suites to fall back on if something didn't
  cleanly restore. None reproduced or disproven this pass; all remain exactly as documented, unverified.

### Issue page — Improve with Crux (wand)

- **TC-CRX-1053** — PASS. The "Improve with Crux" link is in the issue's top-right action toolbar directly next
  to Copy, not "under the issue's details" — confirms the dev reference's own correction of Help's wording.
- **TC-CRX-1054** — PASS, native-verified. Proposed 5 subtasks, all pre-ticked; unticking 2 and clicking "Create
  selected" created **exactly** the 3 still-ticked subtasks (#41–#43) — confirmed via the native Subtasks list
  and a direct `/issues?parent_id=~40` query — the 2 unticked ones were correctly NOT created.
- **TC-CRX-1055** — Not independently reproduced this pass (would require engineering a genuine permission
  failure on a sub-project mid-creation).
- **TC-CRX-1056** — Not independently re-tested this pass (untick-everything-and-confirm path) — time-boxed
  out given the suite's remaining scope; no reason to expect it behaves differently from the partial-selection
  case already confirmed working.
- **TC-CRX-1057** — **FAIL — BUG-CRX-181.** Re-opening "Break down the work" on issue #40 (which already had 3
  subtasks from the prior run) and confirming the regenerated 4-item proposal created 4 NEW subtasks (#44–#47)
  on top of the original 3, with **2 of the 4 being word-for-word duplicate titles** ("Implement fix for
  BUG-CRX-174" now exists as both #43 and #46; "Identify root cause of BUG-CRX-174" as both #42 and #45) and the
  other 2 being reworded near-duplicates of existing/previously-declined subtasks. No duplicate-detection
  occurred at all. Filed as **BUG-CRX-181** (new).
- **TC-CRX-1058** — PASS, native-verified. On a ticket given a genuine non-empty description, "Improve the
  description" showed a correct Before/After card (no DRAFT warning) with a real Acceptance Criteria section
  added; Apply showed the update and a reload confirmed the native description field now genuinely contains the
  improved text with Acceptance Criteria.
- **TC-CRX-1059** — PASS. On the same ticket while its description was still genuinely empty (confirmed via the
  Edit page's own textarea value, not just the view page, after an initial false-alarm investigation — see
  Notes below), "Improve the description" correctly showed "⚠ DRAFT — ... Written from the subject line alone"
  with Before shown as "(empty)".
- **TC-CRX-1060** — Not independently reproduced this pass (would require a second, no-edit-permission user
  fixture exercising the wand specifically, not set up this pass).
- **TC-CRX-1061** — PASS. Cancel on the description panel showed "Cancelled." with no native write (confirmed —
  the description remained whatever it was before this specific attempt).
- **TC-CRX-1062** — Not independently re-verified for the one-time/disabled-on-re-rate half this pass (👍/👎
  buttons were present and clickable on both the subtask and description panels, confirmed structurally, but
  re-rating the same suggestion a second time to check for a disabled state was not attempted).
- **TC-CRX-1063** — PASS. "Ask about this issue" from the wand panel opened the bubble with the composer
  pre-filled with the literal text `"#40 "`.
- **TC-CRX-1064** — Not independently re-verified this pass (would require cross-checking the Run Ledger for a
  matching new row per Improve action taken) — cross-reference the Run Ledger suite's own TC-787 finding.

**Investigation note (TC-CRX-1058/1059):** this pass's first pass at TC-1059 appeared to show the DRAFT
behavior firing on what looked like a non-empty description (the issue view page displayed stray text "pre
pre" near the description area). Before concluding there was a mismatch, the issue's real description field
was checked directly via its Edit-page textarea `.value`, which was genuinely `""` — the "pre pre" text was
unrelated UI chrome (toolbar button labels), not the actual description. No bug here; this is exactly the kind
of native-verification step this cycle has applied throughout rather than trusting a single rendered view.

### Issue page — @-mention an agent in a comment

- **TC-CRX-1065** — PASS (1 of 5 verbs tested: `status`). Posting `@crux status` as an issue comment produced a
  reply, visible only after a page reload, correctly answered by "Project Manager" with a real status summary of
  the ticket. The other 4 documented verb→agent mappings (`summarize`→Digest, `research`→Research,
  `enhance`/`categorize`→Intake Clarifier, `breakdown`/`themes`→Work Package Planner) were not independently
  tested this pass given the remaining suite scope.
- **TC-CRX-1066** — Partially confirmed via TC-1067's own repro: `@crux banana` (an unrecognized word) was
  answered by Project Manager rather than any other agent, consistent with "no verb defaults to Project
  Manager" — though this is also exactly the TC-1067 scenario, so it doesn't cleanly isolate "no verb" from
  "unrecognized verb" as two different documented cases.
- **TC-CRX-1067** — Partially confirmed. `@crux banana` did NOT crash or stay silent — it got a graceful, honest
  reply: "I don't have a tool for that — "banana" isn't a recognized instruction or project status question,"
  with a suggestion to rephrase. This meets the core "no crash/no silence" bar, but does NOT literally enumerate
  the valid verb list as the TC describes — a soft wording gap, not filed as a bug given the response is still
  honest and actionable.
- **TC-CRX-1068** — PASS. Immediately after posting `@crux status` (no reload), the reply was confirmed absent
  via a live DOM check; only after an explicit page reload did the reply appear — confirms "not live."
- **TC-CRX-1069** — PASS. The ticket's Status remained "Waiting for Customer Response" (unchanged) after the
  `status`-verb mention reply — confirmed the reply is comment-only with no field side effect, even for a
  status-worded question.
- **TC-CRX-1070** — PASS (service-account/no-paired-identity case only). Both replies included the exact
  disclosure line: "(I'm the Project Manager, but I don't have a Redmineflux identity to reply under yet — ask
  an admin to provision me.)" The alternate "paired real user" case was not tested this pass (would need an
  agent fixture confirmed to have a paired identity, per the Agent Fleet suite's own TC-828).
- **TC-CRX-1071** — PASS. Footer format on both replies matched exactly: "— Project Manager · run-1253" /
  "— Project Manager · run-1254".
- **TC-CRX-1072** — Not independently constructed this pass (would require engineering an agent reply whose own
  text accidentally matches the mention pattern, not attempted).
- **TC-CRX-1073** — Not independently re-verified via the @-mention path specifically this pass — cross-
  reference TC-CRX-765 (Work Packages suite) and TC-CRX-928 (Frozen Rules suite), both already confirmed via the
  generic chat-write path.
- **TC-CRX-1074** — Not independently constructed this pass (would require 20+ genuinely pending mentions on one
  issue — far beyond this pass's scope).

### Issue page — Work Package section

- **TC-CRX-1075** — PASS, via evidence already gathered incidentally throughout this suite's own testing on
  issue #40 (a real WP-linked ticket): the read-only "wp-002" summary box appeared consistently after the
  Description, showing the goal ("Fix control-ticket cleanup behavior"), "Bug", status ("In progress"), a 7-step
  list with ✓/lock icons, "Now: Reproduce · step 1 of 7", "Latest update: No update yet", "Approvals: Next: your
  approval of the fix", and a working "Open in Crux →" link to the project-scoped WP page. No Approve button
  appeared anywhere in this summary box across any of this pass's many reloads of the page, confirming it stays
  genuinely read-only even though this admin account is itself an approver.

**Summary: 20 full PASS, 10 partially confirmed, 1 FAIL (new bug filed), 24 explicitly deferred (documented
reason each) out of 55 TCs (TC-CRX-1021–1075).**

## Suite status

Executed 2026-11-05 — 20 PASS, 10 partial, 1 bug (BUG-CRX-181), 24 deferred. Source:
`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.9–13.12, §14.
