# Bug Report Template

- Bug ID: BUG-CRX-011
- Production Redmine Issue ID: #120660
- Title: A shared, read-only Ask Crux session lets the viewer click Confirm on the owner's pending write proposal and actually execute the write — the single invariant #117162 calls out as Critical ("ownership-only confirm") is broken
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: Owner `luna.blossom` (Manager, `use_ask_crux`); Viewer `daisy.skye` (Reporter, temporarily granted `use_ask_crux` solely to reach the `/crux/ask` route at all — see Note)
- Date: 2026-09-15

## Steps to reproduce

1. As `luna.blossom`, start a new Ask Crux chat and ask `@crux create an issue titled "TC-CRX-059 Share Viewer Confirm Test" in the Crux QA project`. A confirm card renders with Confirm/Cancel buttons. **Do not click Confirm.**
2. Click **Share** on the chat thread, add `daisy.skye`'s Redmine username, click Share. Dialog confirms "Shared with daisy.skye."
3. Sign out. Sign in as `daisy.skye`.
4. Navigate to the same session (`/crux/ask?session=ses-138`, or click it from the sidebar under "shared with you, read-only"). The page correctly labels the thread "Shared by luna.blossom — read-only, you can't send or change anything here," and the message-composer textbox and Send button are correctly disabled.
5. **However**, the still-pending proposal card from step 1 renders with live, non-disabled **Confirm** and **Cancel** buttons.
6. As `daisy.skye`, click **Confirm**.
7. Independently verify: navigate directly to the resulting issue URL.

## Expected result

- Per #117162's own explicit acceptance criteria, quoted directly in TC-CRX-059 (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`): "A shared (read-only) session must never be able to trigger a write — ownership-only confirm stays intact." The viewer must have no functional Confirm/Cancel control, at both the UI level (button absent or disabled) and the server level (a direct API attempt refused as not the session owner).

## Actual result

- The Confirm button was **not disabled** in the read-only view, and clicking it **as the viewer** genuinely executed the write. The turn updated in place to `✓ Created` with a real link to the new issue.
- Independently verified via a fresh direct navigation to the issue URL: the issue **genuinely exists** — `Bug #8: TC-CRX-059 Share Viewer Confirm Test`, and critically, **"Added by Crux Reporter"** (`daisy.skye`, user id 6) — the write was attributed to the *viewer's own identity*, not the session owner `luna.blossom`, despite the proposal having been generated entirely inside the owner's session and never confirmed by the owner herself.
- This is not a cosmetic/UI-only gap — the server-side confirm endpoint accepted and executed the write on behalf of a user who was never the session's owner, merely a read-only share recipient. The "ownership-only confirm" invariant does not exist on this path at all.
- This is the single most severe finding possible for this test case, exactly matching the scenario #117162 calls out by name as the thing this suite should try hardest to break.

## Note on precondition

- `daisy.skye` (Reporter role) does not have `Use Ask Crux` by default — attempting to open `/crux/ask?session=...` without it returns a clean `403 Forbidden`, correctly blocking the route entirely. To reach the Share/viewer UI at all, `Use Ask Crux` was temporarily granted to the Reporter role (Administration → Roles → Reporter → Permissions → Redmineflux Crux), tested, and then reverted immediately afterward. This means the underlying gap is **not** gated behind the 403 — any two real Redmine users who both hold `Use Ask Crux` (a very common combination, since it is the standard permission for using the feature at all) are affected the moment one shares a session with a pending proposal.

## Evidence

### Screenshot

Not captured — behavioral finding confirmed via the real Redmine issue record (author, existence) and the live-rendered read-only session UI text, not a rendering defect.

### Console / log

- Share dialog (as `luna.blossom`): "Shared read-only — they can view this conversation, but can never send, rename, or share it further." ... "Shared with daisy.skye."
- Session JSON (`GET /crux/ask/session/ses-138`, captured before confirm): proposal `{"id":"prop-129","kind":"create_issue",...,"tool":"redmineflux_core_create_issue"}` — confirms the proposal existed, unconfirmed, owned by `luna.blossom`'s session.
- As `daisy.skye`, viewing the shared session: page banner "Shared by luna.blossom — read-only, you can't send or change anything here." Composer textbox placeholder "Read-only — shared session", both textbox and Send button `disabled`. The pending proposal's Confirm/Cancel buttons: **not** disabled.
- Clicked Confirm as `daisy.skye` → turn updated to `✓ Created` `#8` (linking to `/issues/8`).
- Fresh direct navigation to `/issues/8`: `Bug #8: TC-CRX-059 Share Viewer Confirm Test`, "Added by Crux Reporter" (`/users/6` = `daisy.skye`).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

Reported to production as issue **#120660** (`ztflux`, Tracker Bug, Priority **Blocker** — mapped from local Critical severity, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Linked to Run #569 "Crux QA Run 1", testcase **#120487** (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`, where it was found via TC-CRX-059), Environment "Window 11 + Chrome" — testcase marked **Failed**. Attachments: `BUG-CRX-011.pdf` (5.7 KB) and this MD file (5.3 KB), both confirmed size-exact against production.
