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

## Section B — Slack, live workspace (BLOCKED — needs the privately-shared Slack login)

> **Do not paste the Slack bot token, signing secret, or workspace login into this file, any bug file, any
> chat message, or any screenshot — per the ticket's own explicit instruction.** These TCs need an https
> tunnel (e.g. the `ssh -p 443 ... free.pinggy.io` command from the ticket's journal) and the real Bot
> token/Signing secret for the `CRUX` workspace's `Crux Test` app.

### TC-CRX-1103: Connect Slack from Settings alone — Test connection succeeds (AC1, AC4 positive path)

**Steps:** Paste the real Bot token and Signing secret, tick Turn on Slack, Save Slack, Test connection.

**Expected Result:** `"Connected to the Slack workspace "CRUX" as @crux_test."` (per the ticket's own "Expected"
line) — no restart needed anywhere in this flow.

**Result: BLOCKED — awaiting the privately-shared Slack test account.**

### TC-CRX-1104: Events address verification + @Crux answers a channel mention (AC1)

**Steps:** Paste the Events address into Slack's Event Subscriptions, wait for "Verified"; paste the
Interactivity address; mention `@Crux Test hello` in `#all-crux`.

**Expected Result:** Slack shows "Verified"; Crux replies in the channel.

**Result: BLOCKED — awaiting the privately-shared Slack test account.**

### TC-CRX-1105: A matched sender gets data scoped to their own Redmineflux permissions, not an admin's

**Steps:** As the matched non-admin test user, ask `@Crux Test what projects can I see?` in Slack.

**Expected Result:** Exactly the projects that user's own Redmineflux account can see, not every project.

**Result: BLOCKED — awaiting the privately-shared Slack test account.**

### TC-CRX-1106: Unmatched sender gets a clear refusal and appears in "People Crux couldn't match" (AC7)

**Steps:** Message `@Crux Test` from a Slack account whose email is not any Redmineflux user's main email.

**Expected Result:** Reply `"I don't recognize <email> — ask a Redmineflux admin to make this the main email
address …"`; the email appears under "People Crux couldn't match"; **Remove** and **Clear all** both work.

**Result: BLOCKED — awaiting the privately-shared Slack test account.**

### TC-CRX-1107: Turning Slack off stops replies

**Steps:** Untick Turn on Slack, Save, mention `@Crux Test` again in Slack.

**Expected Result:** No reply.

**Result: BLOCKED — awaiting the privately-shared Slack test account.**

---

## Section C — Microsoft Teams, live tenant (BLOCKED — needs the privately-shared Microsoft 365 login)

> Same secrecy rule as Section B — never paste the App ID, Tenant ID, client secret, or Microsoft 365 login
> anywhere in this repo, chat, or a screenshot.

### TC-CRX-1108: Connect Microsoft Teams from Settings alone — Test connection succeeds (AC2, AC4 positive path)

**Steps:** Paste the real App ID, Tenant ID, client secret for the `Crux Test` bot, tick Turn on Microsoft
Teams, Save Teams, Test connection.

**Expected Result:** `"Microsoft accepted the App ID and App password."`

**Result: BLOCKED — awaiting the privately-shared Microsoft 365 test account.**

### TC-CRX-1109: Messaging endpoint connected + @Crux answers a channel mention (AC2)

**Steps:** Set the bot's messaging endpoint (Developer Portal → Configure → HTTPS endpoint) to the Messaging
endpoint shown on the Teams card; in team `Vaishnavi` / channel `General`, mention `@Crux hello`.

**Expected Result:** Crux replies in the channel/thread.

**Result: BLOCKED — awaiting the privately-shared Microsoft 365 test account.**

### TC-CRX-1110: A matched sender gets data scoped to their own Redmineflux permissions (10-project case from the ticket)

**Steps:** As a known non-admin Teams user, ask `@Crux what projects can I see?`

**Expected Result:** Exactly the projects that user's own Redmineflux account sees in Redmine — per the
ticket's own verified note, this should match "exactly 10 projects" for the account the developer tested with
(our own test account's real project count will differ — compare against that account's own Redmine view, not
the literal number 10).

**Result: BLOCKED — awaiting the privately-shared Microsoft 365 test account.**

### TC-CRX-1111: Unmatched sender gets "I don't recognize …" and appears in the list (AC7)

**Steps:** Message `@Crux` from a Teams account whose email is not any Redmineflux user's main email.

**Expected Result:** Same refusal/list behavior as TC-1106, on the Teams surface.

**Result: BLOCKED — awaiting the privately-shared Microsoft 365 test account.**

### TC-CRX-1112: Downloaded Teams app package genuinely passes Developer Portal validation (AC2, full closure of TC-1101)

**Steps:** Upload the `crux-teams-app.zip` from TC-1101 to the Teams Developer Portal / org app catalog.

**Expected Result:** Passes validation (manifest v1.25), app can be added to a team.

**Result: BLOCKED — awaiting the privately-shared Microsoft 365 test account.**

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
- **Section B (Slack live): 0/5 executed — BLOCKED**, awaiting the Slack test account Prashant will share
  privately.
- **Section C (Microsoft Teams live): 0/5 executed — BLOCKED**, awaiting the Microsoft 365 test account.
- **Section D (security/negative, no account needed): 2/2 PASS.**
- **Section E (backward compatibility): 1 TC, not independently verified this round (no env-var install
  available to compare).**
- **0 bugs found this round.** Every Settings-page and security-negative-path behavior matched the ticket's
  acceptance criteria exactly.
- **Next session start point:** once Prashant shares the Slack/Microsoft 365 test logins (privately, never in
  this ticket/repo/chat), execute TC-CRX-1103–1112 (Sections B and C) to close AC1, AC2, AC4's positive path,
  and AC7.
