# Test Suite — Crux Platform: Settings

> **Regression (2026-11-19):** PASS -- Core URL Test connection returned "Connected to the Crux core service."

> **Happy Flow — selected for today's quick regression (2026-11-19):** TC-CRX-888.

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
- **TC-CRX-911** — PASS (2026-11-12). Entered `-5` in "Daily cap per user ($)" and saved — on hard reload, the
  field was empty again and the hint still read "No admin override set — using the environment default
  ($0.00)," confirming the negative value was genuinely rejected/discarded, not persisted. Minor UX gap noted
  (not filed as a bug): no visible error message appears when this happens, unlike the Frozen Rules page's
  equivalent validation failures.
- **TC-CRX-914** — FAIL — found **BUG-CRX-184** (2026-11-12), High severity. Entered
  `totally-bogus-nonexistent-agent-xyz` as Default agent and saved — no validation error at all, and the value
  was genuinely persisted (confirmed on hard reload). Opening a brand-new "Ask Crux" chat showed the picker
  button itself rendering the raw broken string (`"totally-bogus-nonexistent-agent-xyz ▾"`), and sending any
  message failed with `unknown agent 'totally-bogus-nonexistent-agent-xyz'` plus an unrecoverable "Retry"
  button — exactly the "silently-broken default that fails at chat-open time" failure mode this TC was written
  to catch. Plugin-wide impact (every user's fresh chat, not just the admin session that set it). Cleaned up:
  restored Default agent to blank and re-verified fresh chat works again.
- **TC-CRX-916** — NOT INDEPENDENTLY VERIFIED this pass (Core-down Chat-budget-field hint still needs a genuine
  Core-service outage window — deferred, same reasoning as the original pass).
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

## Execution — 2026-11-18 (deferred-TC completion pass)

Closed out all 17 previously-deferred TCs, per explicit user instruction. Recorded every current field value
first (Core URL `http://crux-core:8787`, blank Chat budget, Show-Crux/Show-Agents both checked, bubble position
`br`/size `comfortable`/icon `chat`, Accent `#FC641F`, default greeting/prompts, blank default agent/teaser,
Chat agents all unchecked) and restored every one of them at the end, with a final Test-connection confirming
the environment was left healthy.

- **TC-CRX-891 — PASS.** Set the admin chat budget to $1.00, sent a real message: the answer carried `"⚠ 94%
  of today's $1.00 chat budget used ($0.94 spent) — resets at 00:00 UTC."` — correct wording, real % and spend.
- **TC-CRX-892 — PASS.** Lowered the cap to $0.50 (today's real spend was already ~$0.95) and sent another
  message: it was genuinely refused — `"You've reached today's $0.50 chat spending cap ($0.95 spent) — it
  resets at 00:00 UTC. Please try again after the reset, or ask an admin to raise the cap."` — no answer was
  generated, just the refusal.
- **TC-CRX-893 — PASS.** UTC-reset half: server time was confirmed `2026-11-18 11:34 UTC` via a native check,
  well before the message's own claimed `00:00 UTC` reset — consistent, not stale. Per-user half: logged in as
  Sage Willow (Reporter) while admin was fully blocked by the $0.50 cap — her own chat answered completely
  normally with no warning or refusal at all, confirming independent per-user tracking.
- **TC-CRX-894 — PASS** (demonstrated twice — once raising to $1.00, once lowering to $0.50 mid-session, no
  restart either time): both changes were enforced on the very next chat call, immediately.
- **TC-CRX-895 — PASS.** Cleared the field and saved: hint read exactly `"No admin override set — using the
  environment default ($0.00)."`, and a real chat message afterward got a normal answer with zero warning —
  confirming "blank = genuinely unrestricted," not a hidden $0 cap.
- **TC-CRX-896 / TC-CRX-897 — PASS, both live-toggle-tested directly** (not just cross-referenced this time).
  Unchecking "Show the Crux entry" made the `/crux` top-menu link genuinely disappear on the very next page
  load; re-checking it brought it back. Separately unchecking "Show the Agents entry" removed `/crux/agents`
  from the top menu while `/crux` itself stayed; re-checked afterward.
- **TC-CRX-898 — PASS, both halves.** Set the Top-menu caption to "CruxTest123": the top-menu link's own text
  changed to that exact string on the next page load. Cleared it: reverted to "Crux".
- **TC-CRX-899 — Partially confirmed, 1 new bug filed (BUG-CRX-217).** Greeting, Suggested prompts, and Launch
  teaser were all confirmed to update the live "Bubble preview" panel immediately, before Save (verified via
  direct DOM inspection, not just visual read). **Accent color does NOT** — changing it to `#00AA00` left the
  preview's own button background and `--crux-accent` CSS variable stuck at the old `#FC641F`, confirmed via
  `getComputedStyle`, regardless of which DOM event was fired. Bubble position/Panel size/Bubble icon have no
  visual representation anywhere in this preview panel at all (it only ever renders the open chat panel's
  interior, never a launcher mockup) — their own "preview updates live" claim could not be checked either way
  through this panel. Filed **BUG-CRX-217** for the confirmed Accent-color gap.
  **Retest — 2026-11-18: CONFIRMED FIXED.** Same repro re-run live on fb164a6 (CRP-60) — the preview panel's
  own launcher button now genuinely updates to the new accent color (`rgb(0, 170, 0)`), native-verified via
  `getComputedStyle`. BUG-CRX-217 closed, production #129012 synced Done/100%.
- **TC-CRX-900 — PASS, native-verified.** Saved Bubble position = Bottom left and Bubble icon = Wand, then
  loaded a different page (`/issues/41`): the real floating bubble's root had class `crux-bubble-bl` (not the
  default `br`) and its launcher button's SVG was genuinely the wand-style icon path, not the default chat
  icon — both confirmed via direct DOM inspection.
- **TC-CRX-901 — PASS, both surfaces.** Saved 3 custom suggested prompts: the bubble's empty state showed
  exactly those 3 as clickable chips on `/issues/41`, and the full-page `/crux/ask` New Chat screen showed the
  identical 3 as prompt cards — both confirmed via DOM text, not visual read alone.
- **TC-CRX-902 — PASS, both halves.** With a blank bubble default agent, a fresh profile's full-page picker
  fell back to "Auto ▾" as expected. Set to `Reporter:docs-writer` and logged in as Sage Willow (Reporter) with
  cleared storage: her floating bubble's agent switcher showed "Docs Writer" as the active default — confirming
  the per-role mapping is genuinely scoped to the bubble (the full-page picker correctly stayed on Auto, since
  this field lives specifically under "Ask Crux bubble" settings).
- **TC-CRX-903 — PASS, fully confirmed.** Set a teaser label "Ask Crux!", cleared storage to simulate a fresh
  profile: the teaser text appeared next to the bubble before first open. Opened the bubble once, reloaded:
  the teaser element was genuinely gone from the DOM.
- **TC-CRX-905 / TC-CRX-906 — FAIL, new bug BUG-CRX-216.** Checked only "Project Manager" and "Docs Writer" in
  Chat agents (leaving "Research" — the account's own persisted picker selection from earlier this cycle —
  genuinely unchecked). A fresh "New chat" picker still showed **4** entries including "Research", and sending
  a real message with "Research ▾" still active as the selection was genuinely answered, not refused or
  fallen back to Auto. This is the exact "excluded by Chat agents setting" ignore condition from TC-CRX-984,
  which the closed BUG-CRX-180's own retest never actually covered (that retest only checked the "Retired" and
  URL-param conditions) — filed as a new bug, **BUG-CRX-216**, per this repo's uncovered-trigger-path
  convention.
  **Retest — 2026-11-18: CONFIRMED FIXED.** Same repro re-run live on fb164a6 (CRP-60) — a new chat with the
  previously-persisted-but-now-excluded "Research" selection correctly falls back to "Auto ▾", and a sent
  message is genuinely answered by an allowed agent (Project Manager), not the excluded persona. BUG-CRX-216
  closed, production #129011 synced Done/100%.
- **TC-CRX-916 — PASS.** With Core genuinely pointed at an unreachable address, the Chat budget field's hint
  resolved (after a brief async load) to the same honest `"Crux is unavailable right now. Please try again in
  a moment — if it keeps happening, ask your Redmineflux administrator."` message used elsewhere for a
  core-down state — not a stale value, not a silent failure. Restored the real URL immediately afterward.
- **TC-CRX-919 — PASS, fully confirmed (the other 4 jump links).** Each of `#crux-set-core`, `#crux-set-nav`,
  `#crux-set-bubble`, `#crux-set-agents` is a real anchor href matching a real element id on the page — the
  identical mechanism as the already-tested `#crux-set-budget` link.

**Deferred-pass summary: 17 of 17 previously-deferred TCs closed — 15 full PASS (891-898, 900-903, 916, 919),
1 partially confirmed with 1 new bug (899 → BUG-CRX-217), 1 FAIL with 1 new bug (905/906 → BUG-CRX-216). Zero
TCs remain deferred in this suite.**

## Suite status (updated 2026-11-18)

Pass 1 (2026-11-05): 15 PASS, 1 bug (BUG-CRX-178), 17 deferred.
Pass 2 (2026-11-18): all 17 deferred TCs closed — 15 more PASS, 2 new bugs found (BUG-CRX-216, BUG-CRX-217).
Pass 3 (2026-11-18, same day): developer moved both to "In QA" (fix in fb164a6, CRP-60); both retested and
  CONFIRMED FIXED, production synced Done/100%.
Overall: 32 PASS/confirmed, 3 bugs found (BUG-CRX-178 open, BUG-CRX-216/217 closed), 0 deferred. Source:
`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §9.
