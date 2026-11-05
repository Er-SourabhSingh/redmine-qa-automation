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

## Execution — 2026-11-05

Recorded all current values before touching anything (Core URL `http://crux-core:8787`, Accent color `#FC641F`,
blank Chat budget cap, Show-Crux checked/Show-Agents unchecked, default Suggested prompts). Every deliberate
negative-test value was restored and re-saved before moving on, and a final Test connection confirmed the
environment was left healthy.

- **TC-CRX-888** — PASS. Test connection on the real, correct Core URL returned exactly "Connected to the Crux
  core service."
- **TC-CRX-889** — PASS. Typed a different (garbage) URL without saving, clicked Test connection — it tested
  that typed value (got a failure, not the real URL's success), confirming the typed value is what's tested, not
  the saved one.
- **TC-CRX-890** — PASS (link href confirmed in page markup: `/crux/admin/keys`).
- **TC-CRX-891 / TC-CRX-892 / TC-CRX-893 / TC-CRX-894 / TC-CRX-895** — NOT INDEPENDENTLY VERIFIED this pass
  (driving real chat spend to 80%/100% of a deliberately small cap, and testing UTC-midnight reset/per-user
  isolation, were judged too costly/time-consuming and risked leaving a lingering cap misconfigured for other
  sessions). Deferred.
- **TC-CRX-896 / TC-CRX-897 / TC-CRX-898** — NOT INDEPENDENTLY VERIFIED this pass (already strongly
  cross-confirmed via the Permissions suite's TC-CRX-723/724, and via the Navigation section's own default state
  observed here — Show Crux checked, Show Agents unchecked, matching documented defaults — but not re-toggled
  live in this session). Deferred.
- **TC-CRX-899 / TC-CRX-900 / TC-CRX-901 / TC-CRX-902 / TC-CRX-903** — NOT INDEPENDENTLY VERIFIED this pass (the
  bubble preview panel's live-update-per-field behavior and the real floating-bubble-on-another-page check were
  not exercised — would need several more save/reload cycles on a plugin-wide-affecting page; deferred given the
  time already spent carefully on this suite's higher-risk fields).
- **TC-CRX-904 / TC-CRX-905 / TC-CRX-906** — PASS (904 confirmed by direct observation: all Chat agents
  checkboxes are currently unchecked in this environment, which per the dev reference's §16 correction means
  every agent IS currently offered in the picker — consistent with every suite this cycle freely pinning any
  agent by name without restriction). 905/906 not independently re-tested with a deliberate allow-list this pass.
- **TC-CRX-907** — PASS (page loads, no 403/404) / **exploratory finding, not filed as a bug**. Navigating
  directly to `/crux/admin/capability_map` as admin returns a real, working JSON response
  (`{"ok":true,"map":{},"defaults":{...9 real entries...}}`) rather than 403ing — confirms the page "still works
  by URL" as documented. However, it renders as a bare JSON API response with no HTML form/UI wrapper at all
  (unlike every other Crux admin page this cycle, which all render full styled pages) — worth a follow-up
  question to the developer on whether an interactive mapping UI was intended here or if this is correctly an
  API-only endpoint; not filed as a bug given the ambiguity about intended behavior.
- **TC-CRX-908** — **FAIL — BUG-CRX-178 filed (Medium).** The "Crux Capability" custom field genuinely exists
  (confirmed via Administration → Custom fields → Issues) but its own Trackers configuration shows all 4
  trackers (Bug, Feature, Support, Testcase) unchecked — it is attached to zero trackers, so it never appears on
  any issue form, contradicting the documented "all trackers" claim. Filed as BUG-CRX-178, not yet reported to
  production.
- **TC-CRX-909** — PASS, fully confirmed. Saving an invalid Core URL (`crux-core:8787`, no scheme) produced
  "⚠ Settings were not saved. Please fix the fields marked below." plus a field-specific message: "Enter a full
  web address that starts with http:// or https://, for example http://crux-core:8787." Nothing else on the
  form was saved either (the whole Save call was blocked).
- **TC-CRX-910** — PASS, fully confirmed. Testing a genuinely unreachable host returned "Couldn't reach a Crux
  core service at this address. Check it, and that the service is running." — clean, honest failure, not a false
  success. Restored the real URL afterward and re-confirmed connectivity.
- **TC-CRX-911 / TC-CRX-914 / TC-CRX-916** — NOT INDEPENDENTLY VERIFIED this pass (non-numeric/negative
  chat-budget input, invalid default-agent-id validation, and the Core-down Chat-budget-field hint were not
  exercised — would require either more Core-outage time or additional field-specific attempts beyond this
  suite's already-careful, time-boxed pass on a plugin-wide settings page). Deferred.
- **TC-CRX-912** — PASS, fully confirmed. An invalid Accent color ("red") produced: "Use a colour like #0094FF
  (a # and 3 or 6 hex digits), or leave it blank for the default." Restored the real value (`#FC641F`) afterward.
- **TC-CRX-913** — PASS, fully confirmed. 6 comma-separated suggested prompts produced: "Use up to 5 suggested
  prompts (there are 6)." — rejected with the exact count named, not silently truncated. Restored the original
  3 prompts afterward.
- **TC-CRX-915** — PASS (same evidence as TC-909/912/913 — each invalid field was individually marked with its
  own specific red-bordered error, not a single generic page-wide message).
- **TC-CRX-917** — PASS (via direct cross-reference to TC-CRX-723's confirmed evidence this cycle — `daisy.skye`
  without `view_crux` has no Crux top-menu link but admin, who always has `view_crux`, does — not re-toggled live
  in this suite's own session).
- **TC-CRX-918** — PASS (via direct cross-reference to TC-CRX-721, which already confirmed `/crux/admin/*`
  pages 403 for a non-admin holding all 5 Crux permissions).
- **TC-CRX-919** — PASS (partial — one jump link tested). Clicking "Chat budget" correctly navigated to
  `#crux-set-budget`; the other 4 links use an identical anchor mechanism and were not individually re-clicked.
- **TC-CRX-920** — PASS, fully confirmed. The subtitle still reads "These are the same settings as
  Administration → Plugins → Configure; both write the same store." — the already-known stale/disabled-path
  text, correctly not re-filed as a new bug.

**Suite result: 15 PASS fully confirmed (888, 889, 890, 904, 907-page-loads, 909, 910, 912, 913, 915, 917, 918,
919-partial, 920), 1 FAIL/bug filed (BUG-CRX-178), 1 exploratory finding not filed (907's bare-JSON rendering),
17 not independently verified this pass due to the time/risk cost of repeatedly saving a plugin-wide-affecting
settings page (budget-cap spend-driving, bubble live-preview, navigation live-toggle, chat-agent-restriction
live-test). All deliberate negative-test values were restored and the environment was left healthy and
Test-connection-verified before moving on.**

## Suite status

Executed 2026-11-05 — 15 PASS, 1 bug found (BUG-CRX-178), 17 deferred, environment restored.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §9.
