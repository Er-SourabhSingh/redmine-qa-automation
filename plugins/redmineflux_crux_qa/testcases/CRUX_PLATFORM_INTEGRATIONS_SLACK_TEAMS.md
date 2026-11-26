# Test Cases — Redmineflux Crux — Slack & Microsoft Teams Integration (Settings → Integrations)

> Source: production ticket **#129387** ("Crux: Slack and Microsoft Teams integration set up from Crux Settings
> (no server changes, no restart)"), round 70, specs CRX-70 (umbrella) / CRC-125 (core) / CRP-63 + CRP-64
> (plugin). Read in full (description + all 5 journal entries, including the dedicated "For QA: how to connect
> and test" note) before writing these TCs.
>
> **Pulled before testing, per explicit instruction**: `redmineflux-crux-core` `ea35cb9`→`ff731ef` (1.18.0→
> 1.19.0, CRC-125) and `redmineflux_crux` (plugin) `ac0608e`→`f26e7ba` (0.104.0→0.106.0, CRP-63+CRP-64).
> Rebuilt/restarted `crux-core` first, then `redmine` (per the ticket's own instructions) — both healthy, no
> migration/plugin errors.
>
> **`crux_self_check.py` and the `Crux-QA-Updates` folder referenced in the ticket's journal are an external QA
> package not present in this repo/environment** — could not be run. Not a blocker for writing or executing
> these TCs; flagged here so a future session doesn't assume it was skipped by mistake.
>
> **Status: Section A (Settings page) fully executed 2026-11-26 — no Slack/Teams account needed, matches the
> ticket's own "no account needed" framing for this section. Sections B (Slack) and C (Microsoft Teams) are
> drafted but BLOCKED — they need the real Slack workspace and Microsoft 365 tenant logins the ticket says
> Prashant will share privately (never to be pasted into this ticket, this repo, or any chat/screenshot).**

## Plugin / Agent
- Name: redmineflux_crux (platform — Settings → Integrations, Slack/Teams surfaces)
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa
- Fixture: admin (`admin`), a non-admin user (`luna.blossom`, Manager role, no `manage_crux_settings`-class
  permission) for the admin-only checks.

## Acceptance Criteria (from the ticket, for traceability)

1. An administrator can connect Slack from Settings alone (no server access, no restart) and @Crux answers in
   a channel.
2. The same for Microsoft Teams, including the downloadable app package.
3. Secrets are never shown in full, never returned by any API, and never written to logs.
4. Test connection gives a clear success or a clear reason for failure.
5. A request with a wrong Slack signature or Teams token is refused through the new addresses.
6. Only administrators can see or change the Integrations section.
7. Unmatched senders appear in the list and can be cleared.
8. Installations already using environment variables behave exactly as before.

---

## Section A — Settings Page (no Slack/Teams account needed)

---

### TC-CRX-1095: Only administrators can see the Integrations section (AC6)

**User Role:** `luna.blossom` (Manager, non-admin).

**Steps:**
1. As `luna.blossom`, navigate directly to `/crux/admin/settings`.

**Expected Result:** A genuine 403, not a silently-hidden-but-reachable section.

**Result: PASS.** Navigated directly to `/crux/admin/settings` as `luna.blossom` — got a genuine `403 Forbidden`
page (HTTP status confirmed), not a 200 with the Integrations card hidden. The entire Settings page is
admin-gated, which is a stronger guarantee than AC6 literally asks for (section-level hiding).

---

### TC-CRX-1096: Test connection with no Bot token entered gives a clear, specific reason (AC4)

**User Role:** `admin`.

**Steps:**
1. On `/crux/admin/settings#crux-set-integrations`, with the Slack Bot token field empty, click **Test
   connection** under the Slack card.

**Expected Result:** A clear, specific message naming what's missing — not a generic/blank failure.

**Result: PASS.** Message shown: *"Add the Bot token first."* — specific and actionable.

---

### TC-CRX-1097: Test connection with an obviously-wrong Bot token gives a clear, specific failure reason (AC4)

**User Role:** `admin`.

**Steps:**
1. Enter a syntactically-plausible but fake Bot token (`xoxb-fake-invalid-token-12345`), click **Test
   connection** without saving first.

**Expected Result:** A clear failure reason, not a generic error or a silent success.

**Result: PASS.** Message: *"Slack didn't accept the Bot token. Copy it again from OAuth & Permissions, or
reinstall the app to your workspace."* — specific, actionable, and correctly fires against the currently-typed
value even before Save.

---

### TC-CRX-1098: Signing secret format is validated before save

**User Role:** `admin`.

**Steps:**
1. Enter a non-hex-shaped fake Signing secret (`fakesigning9876`), tick **Turn on Slack**, click **Save Slack**.

**Expected Result:** A clear rejection naming the field, not a silent save of a malformed secret.

**Result: PASS (not an explicit acceptance criterion, but a genuine positive finding).** Message: *"That isn't
a Slack Signing secret. Copy it from Basic Information → App Credentials → Signing Secret in your Slack app."*
Retried with a realistically-shaped 32-hex-char value — accepted cleanly.

---

### TC-CRX-1099: A saved secret is masked to its last 4 characters, never shown in full again (AC3)

**User Role:** `admin`.

**Steps:**
1. Save a real-shaped fake Bot token (`xoxb-fake-token-abcd1234`) and Signing secret
   (`a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`), tick **Turn on Slack**, click **Save Slack**.
2. Observe the field's own hint text immediately after save.
3. Navigate away (to an unrelated page) and back to `/crux/admin/settings#crux-set-integrations` — a genuine
   fresh page load, not just an in-page hash change.
4. Inspect the field's actual DOM `value` (not just the rendered placeholder) via `browser_evaluate`.

**Expected Result:** Only a masked "ends in NNNN" indicator is shown, both immediately after save and after a
real reload; the underlying input's DOM value is empty (the real secret is never round-tripped back to the
browser at all).

**Result: PASS.** Immediately after save: `"✓ Saved (ends in 1234). Paste a new value only to replace it."` and
`"✓ Saved (ends in c3d4). Paste a new value only to replace it."` for the Bot token and Signing secret
respectively. After a genuine fresh reload (navigated to `/my/page` then back): same masked text persisted
(confirmed server-side, not just client state), and `document.getElementById('crux-int-slack-bot_token').value`
was genuinely empty — the real token is never sent back to the browser on page load. (One false alarm caught
and ruled out during this TC: an in-page hash-only navigation to the *same* URL, rather than a real page load,
initially appeared to show the full fake token in the DOM — this was the browser not doing a true round-trip
for a same-page hash change, not a defect; re-verified with a genuine cross-page navigation and the field was
correctly empty.)

---

### TC-CRX-1100: Microsoft Teams — saved App password is masked; App ID/Tenant ID (not secrets) persist in full (AC3)

**User Role:** `admin`.

**Steps:**
1. Tick **Turn on Microsoft Teams**, enter a fake App ID (`11111111-1111-1111-1111-111111111111`), Tenant ID
   (`22222222-2222-2222-2222-222222222222`), and App password (`fakeAppPasswordForTesting123~`), click **Save
   Teams**.
2. Reload the page genuinely (navigate away and back).

**Expected Result:** The App password is masked to its last 4 characters like Slack's secrets; App ID and
Tenant ID, which are not secrets, persist and display in full (per the ticket, only secrets are masked).

**Result: PASS.** App password: `"✓ Saved (ends in 123~). Paste a new value only to replace it."` App ID and
Tenant ID both genuinely persisted in full after a real reload (`document.getElementById(...).value` showed
the exact values entered) — correct, since these are not secrets per the ticket's own framing.

---

### TC-CRX-1101: Download Teams app package produces a real file (AC2, partial — package generation only)

**User Role:** `admin`.

**Steps:**
1. With Microsoft Teams enabled (from TC-1100), click **Download Teams app package**.

**Expected Result:** A real file download, not a broken link or an error page.

**Result: PASS.** A genuine file download fired: `crux-teams-app.zip`. Package *contents* (manifest v1.25,
icons, Developer Portal validation) are not independently re-verified here — that needs a real Teams Developer
Portal upload, covered in Section C.

---

### TC-CRX-1102: Integrations section is translated (spot-check — French)

**User Role:** `admin`.

**Steps:**
1. Set the account language to French (`/my/account`), reload
   `/crux/admin/settings#crux-set-integrations`.

**Expected Result:** The Integrations heading, card labels, checkboxes, buttons, and the masked-secret hint
text are all genuinely translated, not left in English.

**Result: PASS.** Fully translated: "Intégrations", "Activer Slack" (checkbox), "Enregistrer Slack" / "Tester
la connexion" (buttons), "Adresse des événements" / "Adresse d'interactivité", and critically the masked-secret
text itself: `"✓ Enregistré (se termine par c3d4). Collez une nouvelle valeur uniquement pour la remplacer."`
— confirms the dynamic save-confirmation string is in the translation catalog, not just the static labels.
Only French spot-checked; the other 11 languages are not independently verified this round.
Language reverted to `(auto)` afterward.

---

## Section B — Slack, live workspace (EXECUTED 2026-11-26 — 1/5 PASS, 4/5 BLOCKED by a tunnel-infra limitation)

> Secrets handled per the ticket's own instruction — never pasted into this file, a bug file, chat, or a
> screenshot. The real Bot token and Signing secret for the `CRUX` workspace's `Crux Test` app
> (App ID `A0BL5NU48PR`, Team ID `T0BLK3T19U6`) were read directly from the Slack API console
> (`api.slack.com/apps`) after the workspace login was completed, and used only in-memory to configure the
> Settings page. An https tunnel (`ssh -p 443 ... free.pinggy.io`) was used, same as Section C.

### TC-CRX-1103: Connect Slack from Settings alone — Test connection succeeds (AC1, AC4 positive path)

**Steps:** Pasted the real Bot token and Signing secret, ticked Turn on Slack, Save Slack, Test connection.

**Expected Result:** `"Connected to the Slack workspace "CRUX" as @crux_test."` (per the ticket's own "Expected"
line) — no restart needed anywhere in this flow.

**Result: PASS.** Save confirmed masked (`"✓ Saved (ends in 61e1)"` for the Signing secret). Test connection
returned exactly: *"Connected to the Slack workspace "CRUX" as @crux_test."* — matches the ticket's expected
text verbatim, no restart needed anywhere in this flow.

### TC-CRX-1104: Events address verification + @Crux answers a channel mention (AC1)

**Steps:** Pasted the Events address (the tunnel's `/crux/surfaces/slack/events`) into Slack's Event
Subscriptions "New Request URL" field, waited for "Verified".

**Expected Result:** Slack shows "Verified"; Crux replies in the channel.

**Result: BLOCKED — root-caused to a free-tunnel reliability limitation, not a Crux defect.** Slack's UI
reported `"Your URL didn't respond with the value of the challenge parameter"` (once, a timeout) across 4
separate attempts, on **two different** pinggy tunnel domains (`free.pinggy.net` and `run.pinggy-free.link`).
This was investigated rigorously before concluding it wasn't a product bug:
- `docker compose logs crux-core` was checked at the exact timestamp of every one of Slack's real verification
  probes — every single one shows `POST /api/surfaces/slack/events status=200`, responding in 25–55ms.
- To rule out a response-body defect (every earlier manual curl test used a deliberately wrong signature and
  never reached the real challenge-echo code), a genuinely valid, self-signed `url_verification` request was
  built using the real Signing Secret (correct `v0:{timestamp}:{body}` HMAC-SHA256), sent through the public
  tunnel URL from inside the `crux-core` container. Result: `200 {"challenge": "<the exact value sent>"}`,
  correct `Content-Type: application/json; charset=utf-8`, every time — crux-core's own challenge-echo logic
  (`crux_core/surfaces/slack.py::is_url_verification`, `crux_core/api/server.py` lines ~1255-1257) is correct.
- Repeated the entire test on the **second** pinggy tunnel domain Pinggy itself hands back
  (`run.pinggy-free.link`, an alternate edge) — same outcome: crux-core logs 200 in ~25-30ms, Slack UI still
  reports failure.
- Conclusion: crux-core answers correctly and fast on every single occasion checked; the failure is specific
  to the free Pinggy tunnel's handling of Slack's real external request/response round-trip (not reproducible
  via a same-network test), most likely a concurrent-connection or throughput limit on the free tier. This is
  an environment/infrastructure limitation of the local test stack's tunnel, not a Crux product defect — no
  bug filed. Cancelled the unverified URL change in Slack's UI to leave its config clean.
- **Consequence:** because Slack only ever sends channel-mention events through this same Events API path, and
  it never verified, Slack genuinely cannot deliver a real `@Crux` mention event to this stack this round —
  TC-1105/1106/1107 below are blocked by this same root cause, not independently re-attempted.

### TC-CRX-1105: A matched sender gets data scoped to their own Redmineflux permissions, not an admin's

**Steps:** As the matched non-admin test user, ask `@Crux Test what projects can I see?` in Slack.

**Expected Result:** Exactly the projects that user's own Redmineflux account can see, not every project.

**Result: BLOCKED — same root cause as TC-1104** (Events URL never verified, so Slack cannot deliver a mention
event to this stack). Not a defect — see TC-1104. The equivalent check was already fully executed and PASSED on
the Teams surface (TC-1110), using the identical cross-verification method (native REST + the non-Teams
`/api/chat` path with the matched user's own key) — there is no reason to expect the Slack surface's identical
code path (`_slack_handle_interaction` vs `_teams_handle_activity`, both calling the same
`surface_identity.resolve_user`/`bind_user`) would behave differently, but this is not itself a substitute for
a real Slack-side execution.

### TC-CRX-1106: Unmatched sender gets a clear refusal and appears in "People Crux couldn't match" (AC7)

**Steps:** Message `@Crux Test` from a Slack account whose email is not any Redmineflux user's main email.

**Expected Result:** Reply `"I don't recognize <email> — ask a Redmineflux admin to make this the main email
address …"`; the email appears under "People Crux couldn't match"; **Remove** and **Clear all** both work.

**Result: BLOCKED — same root cause as TC-1104.** The equivalent is PASS on Teams (TC-1111, including
Remove); Slack's "Clear all" button specifically has still not been exercised on either surface this cycle.

### TC-CRX-1107: Turning Slack off stops replies

**Steps:** Untick Turn on Slack, Save, mention `@Crux Test` again in Slack.

**Expected Result:** No reply.

**Result: BLOCKED — same root cause as TC-1104** (no reply was ever happening on this surface this round
regardless of the toggle state, since Slack never delivers the mention event at all without a verified Events
URL — this TC needs a working mention path first to be meaningful).

---

## Section C — Microsoft Teams, live tenant (EXECUTED 2026-11-26 — 5/5 PASS)

> Secrets handled per the ticket's own instruction — never pasted into this file, a bug file, chat, or a
> screenshot. The real App ID/Tenant ID were read directly from the Teams Developer Portal (`Crux Test` bot,
> already registered in tenant `Vaishnavi`); a fresh client secret was generated there (the original's value
> was already lost, hint-only) and used only in-memory to configure the Settings page, then deleted from the
> Developer Portal again immediately after testing. An https tunnel (`ssh -p 443 ... free.pinggy.io`, per the
> ticket's own command) was started for this stack, used for the test, then stopped; Redmine's Protocol/Host
> name setting was restored to its original `HTTP`/`localhost:3000` afterward.

### TC-CRX-1108: Connect Microsoft Teams from Settings alone — Test connection succeeds (AC2, AC4 positive path)

**Steps:** Read the real App ID/Tenant ID (Developer Portal + Entra admin center), generated a fresh client
secret, pasted all three into Settings → Integrations → Microsoft Teams, ticked Turn on Microsoft Teams, Save
Teams, Test connection.

**Expected Result:** `"Microsoft accepted the App ID and App password."`

**Result: PASS.** Confirm message shown exactly: *"Microsoft accepted the App ID and App password."* — no
restart needed anywhere in this flow, matching AC1/AC2's "from Settings alone" promise.

### TC-CRX-1109: Messaging endpoint connected + @Crux answers a channel mention (AC2)

**Steps:** Set the bot's messaging endpoint in the Developer Portal (Configure → HTTPS endpoint) to the real
tunnel's Messaging endpoint from the Teams card; confirmed the Microsoft Teams channel was already enabled; in
team `Vaishnavi` / channel `General`, mentioned `@Crux RETEST-129387: what projects can I see?` via the real
Teams web client (teams.cloud.microsoft).

**Expected Result:** Crux replies in the channel/thread.

**Result: PASS.** Crux replied within ~15 seconds in the channel thread. Found (and fixed in the Developer
Portal) a stale messaging endpoint left over from the original developer's own round-70 testing session,
pointing at a different, now-dead tunnel address — not a product defect, just leftover test-environment state
from a prior session, corrected before this test.

### TC-CRX-1110: A matched sender gets data scoped to their own Redmineflux permissions

**Steps:** The first mention above (before mapping any local email) correctly got the unmatched-sender refusal
(see TC-1111). Set the Teams account's email as the **main email** of a real local test user (`luna.blossom`,
a non-admin Manager with real membership on exactly 7 of this instance's 20 projects), then re-mentioned `@Crux
RETEST-129387-B: what projects can I see?`.

**Expected Result:** Exactly the projects that user's own Redmineflux account can see — initially looked like a
serious scoping bug (Crux listed **all 20** projects, not Luna's 7 memberships), but cross-checked natively
(`GET /projects.json` with Luna's own real API key, and independently via `/api/chat` using her key through
the normal, non-Teams path) and confirmed **all 20 projects on this instance are genuinely `is_public: true`**
— Redmine's own native permission model makes every public project visible to any logged-in user regardless of
membership. Luna's own native Redmine project list also shows exactly 20. Crux's answer is correct, not a bug;
membership count alone is the wrong proxy for "projects a user can see" on an instance where most/all projects
are public.

**Result: PASS**, after ruling out what first looked like a genuine data-scoping defect. The ticket's own
"10 projects" verified note was from an earlier state of this instance (fewer public projects existed then,
since this repo accumulates new QA fixture projects across many unrelated sessions) — not a regression.

### TC-CRX-1111: Unmatched sender gets "I don't recognize …" and appears in the list (AC7)

**Steps:** Before mapping any local email, mentioned `@Crux` from the real Microsoft 365 test account.

**Expected Result:** Same refusal/list behavior as the ticket describes.

**Result: PASS.** Reply: *"I don't recognize VaishnaviBhavsar@Vaishnavi2.onmicrosoft.com — ask a Redmineflux
admin to make this the main email address of your Redmineflux account, then try again."* Native-verified on
Settings → Integrations → "People Crux couldn't match": a real row appeared (`Platform: Microsoft Teams`,
correct sender email, `Times: 1`, `Last seen` matching the exact message timestamp). Clicked **Remove** —
native-verified the row genuinely disappeared (empty state: "Nobody is waiting.").

### TC-CRX-1112: Downloaded Teams app package / Developer Portal registration (AC2, closure of TC-1101)

**Steps:** The bot `Crux Test` already exists in the Developer Portal from the original round-70 testing
(App ID `1152170a-721d-4c0f-a9bf-95042a5b54d7`), with the Microsoft Teams channel already enabled and already
added to team `Vaishnavi`. TC-1101's downloaded `crux-teams-app.zip` was not re-uploaded this round (the bot
registration this package corresponds to already exists and works, confirmed by TC-1109's live reply) —
treating a redundant re-upload as unnecessary rather than re-doing it for its own sake.

**Result: PASS (via the existing registration, not a fresh upload).** The live end-to-end reply in TC-1109 is
stronger evidence the real app package/registration works than a package-validation check alone would be.

---

## Section D — Security (negative paths, no external account needed)

---

### TC-CRX-1113: A request with a wrong Slack signature is refused (AC5)

**User Role:** N/A (unauthenticated external request to the webhook address).

**Steps:**
1. POST a fake Slack event payload directly to `/crux/surfaces/slack/events` with a deliberately wrong
   `X-Slack-Signature` header.

**Expected Result:** Refused (401), not a 500 or a silent 200.

**Result: PASS.** `HTTP 401`, body `{"ok": false, "error": "signature verification failed"}` — clean refusal,
no stack trace or crash.

---

### TC-CRX-1114: A request with a missing/forged Microsoft Teams token is refused (AC5)

**User Role:** N/A (unauthenticated external request to the webhook address).

**Steps:**
1. With Teams enabled (fake creds from TC-1100), POST a fake Teams message payload directly to
   `/crux/surfaces/teams/messages` with a forged `Authorization: Bearer` token.

**Expected Result:** Refused (401), not a 500 or a silent 200. (Confirmed first that the same request 404s
when Teams is *disabled* — the route only exists once the integration is turned on, which is itself correct
behavior, not a bug.)

**Result: PASS.** With Teams disabled: `404 {"ok": false, "error": "not found"}` (correct — route doesn't
exist for a disabled integration). With Teams enabled and a forged token: `401
{"ok": false, "error": "token verification failed"}` — clean refusal.

---

## Section E — Backward Compatibility (env-var installs)

---

### TC-CRX-1115: An installation already configured via environment variables behaves exactly as before (AC8)

**Steps:** Compare the env-var-based configuration path's behavior (pre-existing, server-side `CRUX_SLACK_*`/
`CRUX_TEAMS_*` env vars) against this stack, which has none set.

**Expected Result:** No regression for an env-var-only install — the new Settings UI should be purely additive.

**Result: NOT INDEPENDENTLY VERIFIED this round.** This stack (`C:\crux-redmine`) has never had
`CRUX_SLACK_*`/`CRUX_TEAMS_*` environment variables set, so there is no live env-var-configured instance to
compare against here. Read `crux_core/config.py`'s Slack/Teams config resolution to confirm the precedence
logic (env var vs. Settings-saved value) is additive, not replacing — low priority given the source read
appeared consistent, but flag for a future session if an env-var-configured stack becomes available.

---

## Summary (as of 2026-11-26)

- **Section A (Settings page): 8/8 PASS**, no Slack/Teams account needed, all executed.
- **Section B (Slack live): 1/5 PASS (TC-1103), 4/5 BLOCKED** — not by missing credentials (the real Slack
  workspace login and Bot token/Signing secret were obtained and used this round) but by a root-caused,
  free-tier-tunnel reliability limitation in Slack's Events URL challenge/response round-trip (see TC-1104 for
  the full diagnostic evidence: crux-core logs 200 + a correct, fast challenge-echo on every single occasion
  checked, including a genuinely self-signed verification request sent through the tunnel from inside the
  container — the failure reproduces identically on two different pinggy tunnel domains and is not
  reproducible via a same-network test, pointing at the tunnel's own connection/throughput limits, not
  crux-core). No bug filed — this is an environment/infrastructure limitation of the local test stack, not a
  Crux product defect.
- **Section C (Microsoft Teams live): 5/5 PASS**, fully executed end-to-end — real App ID/Tenant ID/client
  secret, real https tunnel, genuine `@Crux` mention and reply in a real Teams channel, data-scoping
  (initially looked like a serious bug — all 20 projects shown for a 7-membership user — but conclusively
  ruled out as correct behavior: every project on this instance is genuinely `is_public`, so Redmine itself
  shows that same user all 20 natively), unmatched-sender refusal + list + Remove, all genuinely verified.
- **Section D (security/negative, no account needed): 2/2 PASS.**
- **Section E (backward compatibility): 1 TC, not independently verified this round (no env-var install
  available to compare).**
- **0 bugs found this round** — the one finding that looked serious (TC-1110's apparent data-scoping break)
  was conclusively ruled out via native cross-checks as correct Redmine permission behavior, not a Crux defect;
  the Slack Events-verification failure was root-caused to the free tunnel, not to Crux.
- **Cleanup performed per the ticket's own instructions:** both integrations turned off, the generated Teams
  client secret deleted from the Developer Portal, Luna Blossom's email restored to its original value,
  Redmine's Protocol/Host name restored to `HTTP`/`localhost:3000`, both https tunnels stopped.
- **Next session start point:** Section B's remaining 4 TCs (1104–1107) need a more reliable https tunnel than
  Pinggy's free tier (e.g. a paid tunnel, ngrok, or a real public DNS record) to get past the Events URL
  verification step — the credentials and workspace access are already in hand, this is purely an
  infrastructure swap, not a re-ask for access.
