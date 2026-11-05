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

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.1–13.10.
