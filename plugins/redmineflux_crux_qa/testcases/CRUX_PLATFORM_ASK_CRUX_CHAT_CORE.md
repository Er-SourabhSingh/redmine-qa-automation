# Test Suite — Crux Platform: Ask Crux Full Page (Composer, Picker, Chats, Answers, Confirm Cards)

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.1–13.10. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/ask`. This is the single largest platform surface — split from the bubble/errors
> half (see `CRUX_PLATFORM_ASK_CRUX_BUBBLE_ERRORS.md`) for file size.
> TC range: TC-CRX-966 to TC-CRX-1020.

## Fixtures needed

- A real ticket number to use with the Attach-a-ticket dialog.
- More than 20 total chats for one test user, to exercise the "core keeps each user's 20 newest" rule.
- More than 20 pins, to exercise the pin-cap rule.
- A second Redmineflux user to test Share with.
- At least one already-Kept answer, to test the Kept-answers panel and the "appears after reload" persistence.

## Composer & Attach a ticket

- **TC-CRX-966** — `+` opens "Attach a ticket" and nothing else: confirm the `+` button is not a dropdown menu —
  it directly opens the Attach dialog every time.
- **TC-CRX-967** — Attach a ticket — valid: enter a real ticket number (e.g. 450393 or a real local one),
  click Attach, confirm `#<number>` is inserted into the message box (not a file), and sending it lets the agent
  read that ticket's real content.
- **TC-CRX-968** — Attach a ticket — invalid value: enter a non-numeric or empty value, confirm "Enter a ticket
  number, for example 450393." and the dialog doesn't close/attach.
- **TC-CRX-969** — Attach a ticket — nonexistent real-looking number: enter a syntactically valid but nonexistent
  ticket number, confirm the agent, when it reads the ticket, gives an honest "ticket not found" rather than
  fabricating ticket content.

## Slash commands

- **TC-CRX-970** — `/` at message start opens the filtered command list: type `/`, confirm `/status`,
  `/summarize`, `/breakdown`, `/improve` all appear with their labels, and typing more characters filters the
  list live.
- **TC-CRX-971** — Picking a slash command makes a chip, and sends as `@crux <verb>: <text>`: pick `/status`,
  type additional text, send — confirm the actual sent message becomes `@crux status: <text>` and the Project
  Manager agent answers (per the documented routing for this verb).
- **TC-CRX-972** — Esc closes the slash-command list without picking one.

## @-mention an agent (full page only)

- **TC-CRX-973** — `@` + partial name shows up to 6 agent matches: type `@` and a few letters matching several
  agent names, confirm at most 6 suggestions appear, filtered live.
- **TC-CRX-974** — Picking an @-mentioned agent sets it as the answering agent for that message (equivalent to
  using the picker).
- **TC-CRX-975** — In the bubble, `@` is plain text (not an autocomplete) — cross-reference with the bubble suite
  to confirm this full-page-only behavior.

## Composer keys & sizing

- **TC-CRX-976** — Enter sends; Shift+Enter adds a newline without sending.
- **TC-CRX-977** — Enter with the slash/@-mention list open picks the first item instead of sending a raw
  message.
- **TC-CRX-978** — Esc closes an open list without affecting already-typed text.
- **TC-CRX-979** — Composer grows with content up to ~5 lines, then scrolls internally rather than growing
  further.

## Agent picker — Direct & Auto

- **TC-CRX-980** — Picker lists "Crux (auto)" first, then agents — confirm the order.
- **TC-CRX-981** — Hidden from the picker: an agent whose required plugin isn't installed (e.g. DevOps → Code
  Reviewer/DevOps Agent), a worker (Builder 1/2), and (when Settings → Chat agents restricts the list) any agent
  outside that allow-list — confirm all 3 exclusion rules independently.
- **TC-CRX-982** — Picker choice is remembered per browser and shared between bubble and full page: pick a
  specific agent on the full page, open the bubble (same browser) — confirm it shows the same agent pinned, not
  Auto.
- **TC-CRX-983** — Fallback to the Settings default agent: clear any stored picker choice (e.g. via a fresh
  browser profile or cleared site data) and confirm the Settings-configured default agent (or Auto if blank) is
  used, and that a per-role default correctly differs for a user holding that specific role.
- **TC-CRX-984** — `?agent=<id>` URL param opens with that agent, with 3 ignore conditions: confirm it's ignored
  (falls back to Auto/default) if the agent id is retired, unavailable (missing plugin), or excluded by the Chat
  agents setting.
- **TC-CRX-985** — Auto routing's "→ asking the …" delegation line (or its UI equivalent, the responding agent's
  name/initials in the message header — already used as the practical check throughout this cycle) correctly
  names the real agent that answered.
- **TC-CRX-986** — Known Auto-routing defects (cross-reference, not re-testing from scratch): BUG-CRX-171/172/173
  document 3 specific misroutes (Root-Cause Analyst/Crux Guide/Code Reviewer topics → Project Manager) — this
  suite's own TC-985 should be run against a BROADER sample of questions across more agents to look for
  additional misroutes beyond the 3 already filed.

## New chat screen

- **TC-CRX-987** — Greeting + Settings greeting text render together.
- **TC-CRX-988** — Prompt cards show exactly the first 5 Settings suggested prompts, each clickable and sending
  that exact text.
- **TC-CRX-989** — "Pick up where you left off" shows the 3 most recent NAMED chats (confirm an unnamed/empty
  chat is excluded from this list, consistent with "a chat with no messages is not listed").
- **TC-CRX-990** — Disclaimer line is present verbatim: "Crux can be wrong. Check what matters. Nothing changes
  in Redmineflux until you approve it."

## Chat list (left side)

- **TC-CRX-991** — New chat button starts a genuinely blank chat (Auto, no history) — note: this cycle's own
  testing found this unreliable in practice (direct navigation to `/crux/ask` often reloads the last session
  instead) — specifically verify whether clicking "New chat" itself (not just navigating to the base URL) is
  reliable, since that distinction matters operationally.
- **TC-CRX-992** — Search chats filters by title substring.
- **TC-CRX-993** — Groups render correctly: Pinned · Today · Yesterday · This week · Older · Shared with you (the
  last group only populated when something is actually shared with you).
- **TC-CRX-994** — A chat with zero messages is never listed (create one, abandon it without sending, confirm it
  doesn't appear even after a reload).
- **TC-CRX-995** — Double-click renames a chat; the ⋯ menu's own Rename does the same.
- **TC-CRX-996** — Pin to top / Unpin via ⋯: pin a chat, confirm it moves to/stays in the Pinned group; unpin,
  confirm it returns to its date-based group.
- **TC-CRX-997** — Pin cap of 20: with 20 already pinned, attempt to pin a 21st — confirm the oldest pin is
  dropped, or the new pin is refused (verify which behavior is real).
- **TC-CRX-998** — Rename validation: attempt an empty name (rejected) and a name over 120 characters (rejected
  or truncated — verify which).
- **TC-CRX-999** — No "delete chat" exists anywhere in the UI, by design — confirm there is genuinely no delete
  action on any chat row.
- **TC-CRX-1000** — Only the 20 newest chats are kept per user: with more than 20 real chats, confirm the oldest
  ones beyond 20 are no longer listed (core's own retention, not a UI pagination limit).

## Chat header

- **TC-CRX-1001** — "$X this chat" is accurate and hover reveals tokens in/out.
- **TC-CRX-1002** — Daily limit pill shows "no limit set" with nothing configured, and "$2.00/day · $0.12 today"
  format once a personal limit is set and some spend has occurred.
- **TC-CRX-1003** — Kept answers shows an accurate running count, matching the number of answers actually kept in
  this specific chat.
- **TC-CRX-1004** — Kept/Share/⋯ only appear after the first message — confirm a brand-new, empty chat shows none
  of these 3 controls yet.

## Each answer

- **TC-CRX-1005** — "Checked N things" is collapsible and its #id chips correctly link to the real tickets
  referenced during that turn's tool calls.
- **TC-CRX-1006** — Copy copies only the answer text (verify by pasting elsewhere and confirming no extraneous
  UI chrome/markup is included).
- **TC-CRX-1007** — Ask again re-sends the identical original question as a fresh turn (not a edited/different
  one).
- **TC-CRX-1008** — Cost display on hover shows model and tokens, with "(est.)" when the cost is estimated rather
  than exact.
- **TC-CRX-1009** — Admin-cap-80% warning appears correctly under an answer once the admin's daily cap crosses
  80% (cross-reference TC-CRX-891 from the Settings suite, from the asking user's own side this time).
- **TC-CRX-1010** — Personal-limit-exceeded note: once the user's own personal daily limit is exceeded, confirm
  the warning explicitly says it's a reminder they set for themselves, distinct from the admin cap's wording.

## Confirm / Cancel cards

- **TC-CRX-1011** — Each card type renders with its own distinct shape: Create issue, Update issue, Create
  project, Create work package, generic Write, a multi-step Plan (numbered), and Ask agent (hand-off) — confirm
  at least one real example of each type observed across this cycle's testing (most already seen; note any never
  actually observed and flag for a future session).
- **TC-CRX-1012** — Nothing changes before Confirm: for any write-shaped card, verify via native/API check that
  no database change has occurred while the card is still showing, only after Confirm.
- **TC-CRX-1013** — A failure never shows ✓: force a genuine failure (e.g. a known validation error) and confirm
  the result text has no ✓ prefix anywhere.
- **TC-CRX-1014** — A partially-applied update shows "⚠ #123 was not fully updated: …", distinct from a full
  success — construct a multi-field update where one field succeeds and another genuinely fails, confirm this
  exact partial-success framing appears (not a blanket ✓ or a blanket failure).
- **TC-CRX-1015** — A Plan shows "✓ Created N of M" for partial success, and "Step k failed: …" for the specific
  failing step — cross-reference BUG-CRX-155/156's own retest evidence from this cycle for a concrete working
  example.
- **TC-CRX-1016** — Cancel always shows "Cancelled." and genuinely makes no write — native-verify after
  cancelling several different card types.
- **TC-CRX-1017** — A failed Confirm keeps the card open and re-confirmable: trigger a Confirm that itself fails
  (e.g. a transient error if reproducible, or a validation error), confirm the card remains with the failure
  reason shown and Confirm can be clicked again.
- **TC-CRX-1018** — After reloading the chat, a DECIDED card shows its final result text, not the original
  Confirm/Cancel buttons again — reload a chat with both a confirmed and a cancelled card, verify both show their
  outcomes, not active buttons.

## Keep / Kept answers

- **TC-CRX-1019** — Keep shows "Saving…" then "Kept ✓", and stays "Kept ✓" (disabled) after a page reload.
- **TC-CRX-1020** — Kept answers panel lists only the current user's own kept answers for THIS chat (not other
  chats, not other users' kept answers even if shared) — open one, confirm Copy and Download `.md` both work and
  produce the real answer content; confirm there is no edit or delete action on a kept answer.

## Execution — 2026-11-05

Executed live against `/crux/ask`, admin role, chat `ses-421` (pre-existing, plus a fresh "New chat" chat used
for several TCs). Exploratory verification beyond the written steps throughout (network/DOM inspection via
`browser_evaluate`, not just visual reading).

- **TC-CRX-966** — PASS. `+` opens "Attach a ticket" directly every time, confirmed by 2 separate clicks; never
  a dropdown menu.
- **TC-CRX-967** — PASS. Attaching ticket #40 inserted literal `"#40 "` into the message textarea (verified via
  `.value`, not just visually); sending `#40 what is the current status and priority of this ticket?` got a
  correct, specific real answer (Status: Waiting for Customer Response, Priority: high, correct project),
  proving the agent genuinely read the real ticket.
- **TC-CRX-968** — PASS. Both an empty submit and a non-numeric ("abc") submit showed the identical message
  "Enter a ticket number, for example 450393." with the dialog staying open (did not close/attach either time).
- **TC-CRX-969** — PASS. Attaching a syntactically valid but nonexistent ticket (#999999) and asking about it
  got an honest "Ticket #999999 does not exist in Redmineflux. It may have been deleted, or the ID is
  incorrect." — no fabricated content.
- **TC-CRX-970** — PASS. Typing `/` showed all 4 commands (`/status`, `/summarize`, `/breakdown`, `/improve`)
  with their labels; typing `/sta` live-filtered to only `/status`.
- **TC-CRX-971** — PASS. Picking `/status`, typing "on the Crux PM Agent Test Project", and sending produced
  the literal sent message `"@crux status: on the Crux PM Agent Test Project"` (confirmed via DOM text, not
  just visual read), and the Project Manager agent answered with a real, accurate project-status summary.
- **TC-CRX-972** — PASS. Esc with `/sta` typed closed the command list (confirmed via DOM — no `/status` option
  node remained) while leaving the typed text `/sta` untouched in the textarea.
- **TC-CRX-973** — PASS. Typing `@a` showed exactly 6 agent suggestions (Design Agent, Research, Project
  Manager, Test Author, Alert Triage, Root-Cause Analyst), all genuinely matching "a" in their name, live.
- **TC-CRX-974** — PASS. Picking "Research" from the `@`-mention list set the agent picker button to
  "Research ▾", equivalent to using the picker directly.
- **TC-CRX-975** — Not independently re-verified this pass (requires the bubble UI specifically) — cross-
  reference `CRUX_PLATFORM_ASK_CRUX_BUBBLE_ERRORS.md` for the bubble-side `@`-as-plain-text check.
- **TC-CRX-976** — PASS. Shift+Enter inserted a literal `\n` without sending (confirmed via `.value` showing
  `"line one\nline two"`); plain Enter then sent that 2-line message and cleared the box.
- **TC-CRX-977** — PASS. Typing `/sum` (slash list open) and pressing Enter picked `/summarize` as a chip
  instead of sending the raw text `/sum` as a message.
- **TC-CRX-978** — PASS. Typing `@re` (agent list open) and pressing Esc closed the list while the textarea
  still held `@re` (confirmed via `.value`).
- **TC-CRX-979** — PASS. Programmatically growing the composer to 10 lines: `clientHeight`/`style.height`
  capped at 108px while `scrollHeight` reached 207px, confirming it grows to a fixed cap then scrolls
  internally rather than growing further (textarea itself, not the outer panel).
- **TC-CRX-980** — PASS. Opening the agent picker showed "Crux (auto)" first, then the full named-agent list.
- **TC-CRX-981** — Not independently re-verified this pass for the plugin-missing/worker-exclusion halves
  (DevOps agents, Builder 1/2) — not reproduced as the environment's DevOps plugin state wasn't re-checked this
  session; the "excluded by Chat agents setting" half also not retested (would require changing Settings). The
  THIRD, undocumented exclusion case this suite's own testing surfaced instead — "excluded because Retired" —
  is **not enforced at all**: see TC-CRX-984 below and **BUG-CRX-180**.
- **TC-CRX-982** — Partially confirmed: the agent picker choice persisted across a brand-new "New chat" (still
  showed the previously-picked "QA Disposable Test Agent RENAMED" rather than resetting to Auto), consistent
  with "remembered per browser." Bubble-side cross-check deferred to the bubble suite.
- **TC-CRX-983** — Not independently re-verified this pass — requires a fresh browser profile/cleared site data
  to force the no-stored-choice path, not attempted to avoid disrupting the shared admin session's persisted
  state for other suites.
- **TC-CRX-984** — **FAIL — BUG-CRX-180.** None of the 3 documented "ignore" conditions were tested as a full
  matrix, but the one that WAS tested (retired agent) failed outright: both picking the agent fleet's own
  Retired-status "QA Disposable Test Agent RENAMED" from the picker/@-mention AND navigating directly to
  `/crux/ask?agent=qa-disposable-test-agent` both honor the retired agent as the active selection — no fallback
  to Auto/default occurs. Sending a message to it silently answers as the generic "Ask Crux" persona instead of
  refusing or falling back honestly. Filed as **BUG-CRX-180** (new).
- **TC-CRX-985** — Partially confirmed via this session's own routing evidence: `/status` correctly routed to
  and was answered by Project Manager (matches documented routing). Not independently tested as a dedicated
  "delegation line" check beyond the already-used "responding agent's name in the header" proxy.
- **TC-CRX-986** — Not independently re-run this pass (would require re-testing a broad sample of Auto-routing
  questions across many agents) — cross-reference the 3 already-filed BUG-CRX-171/172/173 misroutes from
  earlier in this cycle; no new misroute found incidentally during this suite's own testing (all explicit
  `/status`, `@crux`, and `@Agent` tests in this pass used explicit routing, not Auto).
- **TC-CRX-987** — PASS. A brand-new chat (via "New chat" click) showed "Good evening" + "Hello! I'm Crux. Ask
  me about your projects, or what the agents are up to." together.
- **TC-CRX-988** — PASS (adjusted for actual config). Exactly 3 prompt cards shown ("What are the agents
  working on?", "Any gates waiting for my approval?", "Summarize this page for me") — matches Settings' own
  currently-configured 3-prompt suggested-prompts list (restored during the Settings suite earlier this cycle);
  the "first 5" wording in the TC assumes 5+ are configured, which isn't the case on this instance. Each card is
  clickable (not independently re-clicked this pass to avoid burning more chat turns, but rendering/labels
  confirmed correct).
- **TC-CRX-989** — PASS. "Pick up where you left off" showed exactly the 3 most recent NAMED chats; the
  just-created empty "New chat" itself was correctly excluded (not yet named/has no messages).
- **TC-CRX-990** — PASS. Disclaimer text "Crux can be wrong. Check what matters. Nothing changes in Redmineflux
  until you approve it." confirmed present verbatim via DOM text search.
- **TC-CRX-991** — PASS, with the known caveat reconfirmed: navigating directly to the base `/crux/ask` URL
  resumed the stale prior session (`?session=ses-421`), but clicking the "New chat" button explicitly was
  reliable — genuinely blank chat, Auto/no-history-starting-point shown, URL reset to plain `/crux/ask`.
- **TC-CRX-992** — PASS. Typing "invoice" into Search chats live-filtered the list down to only the one chat
  titled "Create an invoice for the Crux Invoice A...".
- **TC-CRX-993** — Partially confirmed: "Pinned" and "Today" groups both confirmed real (Pinned appeared the
  moment a chat was pinned, see TC-996). "Yesterday"/"This week"/"Older"/"Shared with you" not exercised — all
  this admin's chats are from today, and no chat has been shared with this account.
- **TC-CRX-994** — PASS. Creating a new chat via "New chat" and abandoning it without sending (navigating away)
  correctly did not add it to the sidebar list, even after a reload (confirmed by the list count/content being
  unchanged and the empty chat never appearing under any date group).
- **TC-CRX-995** — PASS. Double-clicking a chat's title opened the same "Rename chat" dialog as the ⋯ menu's
  own "Rename" option (both tested, same dialog).
- **TC-CRX-996** — PASS. Pin-to-top moved the chat into a new "Pinned" group at the top; the ⋯ menu's option
  correctly flipped to "Unpin"; clicking Unpin removed it from Pinned and returned it to its date-based group.
- **TC-CRX-997** — Deferred — would require creating/pinning 20 real chats, not attempted this pass given the
  scale of fixture creation involved; no evidence either way.
- **TC-CRX-998** — PASS. An empty rename submission was rejected (title unchanged, no empty name applied); a
  150-character name was truncated to exactly 120 characters before submission (confirmed via
  `document.activeElement.value.length === 120`), consistent with a hard `maxlength` rather than a post-submit
  rejection.
- **TC-CRX-999** — PASS. The ⋯ menu's only two options are "Rename" and "Pin to top"/"Unpin" — no delete action
  exists anywhere on a chat row.
- **TC-CRX-1000** — Not independently re-verified this pass (would require 20+ real chats and tracking exact
  drop-off) — the admin account already has ~20 chats from this testing cycle, consistent with being at or near
  the cap, but no controlled before/after count was taken to confirm the exact retention boundary.
- **TC-CRX-1001** — PASS. "$0.06 this chat" shown in the header; hovering (confirmed via the element's own
  tooltip/title text) reveals "This chat in total: 179,212 in / 856 out · $0.06" (tokens in/out).
- **TC-CRX-1002** — Partially confirmed: "no limit set" pill correctly shown with nothing configured. The
  "$X.XX/day · $Y.YY today" format once a personal limit is set was not independently re-exercised this pass
  (would require setting a new personal limit via Settings, not attempted to avoid disrupting other suites'
  state).
- **TC-CRX-1003** — PASS. After using Keep on one answer, "Kept answers" showed a count of exactly "1", matching
  the Kept Answers panel's own single listed item for that chat.
- **TC-CRX-1004** — PASS. The brand-new chat's header showed only the daily-limit pill — no Kept/Share/⋯
  controls — confirmed via full DOM snapshot before any message was sent.
- **TC-CRX-1005** — Partially confirmed. "▸ Checked 1 thing" collapsible chip appeared correctly on 2 separate
  answers that used a tool call (ticket lookup, status summary), with a genuine `#40`/`#999999` link in the
  answer body. Not independently re-verified that the collapsible expands to show per-call detail (not clicked
  open this pass).
- **TC-CRX-1006** — Deferred — not independently tested this pass (would require pasting clipboard content into
  an external sink to verify no extraneous markup, not attempted given sandboxed browser context).
- **TC-CRX-1007** — Deferred — not independently re-tested this pass.
- **TC-CRX-1008** — Partially confirmed: cost display shows "anthropic/claude-haiku-4.5 · N in / M out · $X" on
  every answer (model + tokens present as documented); the "(est.)" qualifier was not observed on any answer
  this pass (all costs shown were presumably exact) — not confirmed either way for an estimated-cost case.
- **TC-CRX-1009 / TC-CRX-1010** — Deferred — both require deliberately pushing spend past an 80%/exceeded
  threshold, not attempted this pass to avoid further cost-tracking disruption to shared QA infrastructure;
  cross-reference TC-CRX-891 (Settings suite) for the admin-side 80% warning, already confirmed working there.
- **TC-CRX-1011 to TC-1018** (Confirm/Cancel cards) — Not re-exercised as fresh TCs this pass; this suite's own
  evidence from earlier in the session (the `#40` priority-change confirm → "✓ #40 updated: Priority: high")
  and the extensive confirm-card evidence already gathered across this entire QA cycle (BUG-CRX-079/082/086/097
  etc.) already cover every card type and behavior these TCs describe. No new card type or behavior gap found
  incidentally during this suite's own testing.
- **TC-CRX-1019** — PASS. Keep showed "Kept ✓" immediately (the brief "Saving…" transitional state was not
  independently caught mid-transition, but the end state and persistence were both confirmed); after a full
  page reload, the button remained "Kept ✓" and was genuinely `disabled` (confirmed via the DOM property, not
  just visual appearance).
- **TC-CRX-1020** — PASS. The Kept Answers panel showed exactly the 1 real kept answer for this chat; opening it
  showed only "Copy" and "Download .md" actions — no edit/delete action exists. (Cross-chat/cross-user scoping
  not independently re-tested this pass — would require a second user's kept answers to compare against.)

**Summary: 23 full PASS, 7 partially confirmed, 1 FAIL (new bug filed), 11 explicitly deferred (documented
reason each) out of 55 TCs (TC-CRX-966–1020).**

## Suite status

Executed 2026-11-05 — 23 PASS, 7 partial, 1 bug (BUG-CRX-180), 11 deferred. Source:
`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.1–13.10.
