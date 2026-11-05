# Test Suite — Crux Platform: Settings

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §9. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/admin/settings` (admin only).
> TC range: TC-CRX-888 to TC-CRX-920.

## Fixtures needed

- A second browser/user session for cross-checking end-user-visible effects of each setting change (top menu,
  bubble, picker).
- The real Core service URL value, so it can be restored after TC-CRX-888/889's deliberate-break tests.
- Current Settings values recorded before this suite runs, so every changed field can be restored afterward
  (this page affects every user plugin-wide).

## Positive Cases — Core

- **TC-CRX-888** — Test connection — success: with the real, correct Core service URL, click Test connection —
  confirm "Connected to the Crux core service."
- **TC-CRX-889** — Test connection tests the typed value before saving: type a DIFFERENT (but still reachable)
  URL into the field without saving, click Test connection — confirm it tests that typed value, not the
  already-saved one.
- **TC-CRX-890** — "Manage providers & keys →" link goes to `/crux/admin/keys`.

## Positive Cases — Chat budget

- **TC-CRX-891** — Set a daily cap, confirm 80% warning: set a small cap (e.g. $1.00), use chat until spend
  crosses 80%, confirm the next answer carries the warning text (approximate values may differ from the doc's
  example, verify the real wording and %).
- **TC-CRX-892** — 100% cap genuinely blocks: continue past 100% of the same cap, confirm the next chat message is
  refused with a message naming the cap and the reset time (00:00 UTC).
- **TC-CRX-893** — Cap resets at UTC midnight (if testable within the session window; otherwise verify the stated
  reset time is UTC-based by checking server time vs. the message's claimed reset time) and is counted per user,
  per day — confirm a SECOND user's own spend is tracked independently and not affected by the first user hitting
  their cap.
- **TC-CRX-894** — Takes effect immediately, no restart: lower the cap mid-session (no plugin restart) and confirm
  the new, lower cap is enforced on the very next chat call.
- **TC-CRX-895** — Blank = no cap: clear the field and save — confirm the hint shows "No admin override set —
  using the environment default ($Y)" and chat is unrestricted by an admin-set cap.

## Positive Cases — Navigation

- **TC-CRX-896** — Toggling "Show the Crux entry" live-updates the top menu for users with View Crux (cross-
  reference TC-CRX-723).
- **TC-CRX-897** — Toggling "Show the Agents entry" live-updates the top menu (default off, confirm turning it on
  makes it appear).
- **TC-CRX-898** — Custom top-menu caption: set it to a custom string, confirm the top-menu link text changes
  to that string; clear it and confirm it reverts to "Crux".

## Positive Cases — Ask Crux bubble

- **TC-CRX-899** — Live preview reflects every field as you type/select: change each of Bubble position, Panel
  size, Bubble icon, Accent color, Greeting, Suggested prompts, Default agent, Launch teaser — confirm the
  preview panel updates immediately for each, before Save.
- **TC-CRX-900** — Saved bubble settings apply on a real page: after saving a non-default Bubble position (Bottom
  left) and icon (Wand), reload any Redmine page and confirm the real floating bubble matches (position + icon).
- **TC-CRX-901** — Suggested prompts populate the bubble's empty state and the full-page New Chat screen: set 3
  custom prompts, confirm both surfaces show them as clickable prompt chips/cards.
- **TC-CRX-902** — Default agent, blank vs. per-role: set a blank default (falls back to Auto) and test as a
  fresh browser with nothing stored yet; then set a per-role default (`Role Name:agent-id` pairs) and confirm a
  user with that specific role gets that specific default agent instead of Auto.
- **TC-CRX-903** — Launch teaser: set a teaser label, confirm it's shown next to the bubble until first opened,
  and disappears after the first open (and doesn't reappear on subsequent page loads in the same session).

## Positive Cases — Chat agents

- **TC-CRX-904** — None checked = every agent offered (CORRECTED from this repo's own earlier, backwards draft —
  dev reference §16): with nothing checked, confirm the full agent roster is offered in the `/crux/ask` picker.
- **TC-CRX-905** — Checking some agents restricts the picker to an allow-list: check 3 specific agents, confirm
  only those 3 (plus "Crux (auto)") appear in the picker, and the @-mention list is similarly restricted.
- **TC-CRX-906** — Restriction doesn't affect @-mention-verb routing: even if Research is unchecked from the
  picker, confirm `@crux research …` in a ticket comment still reaches the Research agent (the verb-routing in
  §14.2 is a separate mechanism from the chat picker restriction).

## Positive Cases — hidden admin page & custom field

- **TC-CRX-907** — `/crux/admin/capability_map` works by direct URL even though its card was removed from the
  visible Settings UI: navigate there directly as admin, confirm the page loads and lets you map a Component
  value to a Ready-queue skill.
- **TC-CRX-908** — "Crux Capability" custom field exists on issue forms: confirm a list-type custom field named
  "Crux Capability" is visible on an issue's edit form, for all trackers.

## Negative / Boundary Cases

- **TC-CRX-909** — Invalid Core URL is rejected: attempt to save a URL that doesn't start with `http://` or
  `https://` — confirm the whole Save is blocked, with this field specifically marked, and NO other section's
  valid changes are saved either (per "if any field is invalid, nothing is saved").
- **TC-CRX-910** — Core service genuinely unreachable: temporarily point the URL at a dead address and Test
  connection — confirm "didn't answer in time" or "Couldn't reach…" (the specific message depends on the failure
  mode) rather than a false success; restore the real URL afterward.
- **TC-CRX-911** — Chat budget field rejects non-numeric input and negative numbers.
- **TC-CRX-912** — Accent color validation: attempt a value that isn't `#` + 3 or 6 hex digits (e.g. a color
  name, or `#12`) — confirm it's rejected with a clear message.
- **TC-CRX-913** — Suggested prompts: attempt more than 5 comma-separated entries — confirm it's rejected or
  silently truncated to 5 (verify which, and document the actual behavior).
- **TC-CRX-914** — Default agent with an invalid/nonexistent agent-id — confirm a clear validation error, not a
  silently-broken default that fails at chat-open time instead.
- **TC-CRX-915** — Field-level error marking: trigger one invalid field among several otherwise-valid changes —
  confirm the specific invalid field is marked, not a generic page-wide error with no indication of which field.
- **TC-CRX-916** — Core-down hint for Chat budget: with the Core service genuinely unreachable, confirm the Chat
  budget field's hint says the field won't be changed (rather than silently failing or showing a stale value as
  if saved).
- **TC-CRX-917** — Navigation toggle is cosmetic only, not access control: confirm that even with "Show the Crux
  entry" OFF, a user with View Crux dashboard can still open `/crux` directly via a bookmark/typed URL — the
  setting only hides the menu shortcut (cross-reference TC-CRX-723).
- **TC-CRX-918** — Non-admin cannot reach `/crux/admin/settings` at all, regardless of Crux permissions held
  (cross-reference TC-CRX-721).
- **TC-CRX-919** — Jump links scroll correctly: click each of the 5 left-side jump links (Core/Chat budget/
  Navigation/Ask Crux bubble/Chat agents) and confirm the page scrolls to the matching section.
- **TC-CRX-920** — Settings subtitle text is stale (known issue, dev reference §17 — verify it still says
  "Administration → Plugins → Configure" even though that path is disabled; this is a documented, already-known
  text issue, not a new bug to file).

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §9.
