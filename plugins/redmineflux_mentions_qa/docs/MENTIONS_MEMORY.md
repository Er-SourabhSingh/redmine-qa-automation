# Plugin Memory — Redmineflux Mentions Plugin

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The wiki mention-user list (`app/views/wiki/_form.html.erb`) is embedded inline in the page HTML as a
  JS `usersData` array (`id` + `login` only, no emails), not loaded via a separate autocomplete AJAX call. So a
  page-load network trace shows zero extra XHR/fetch requests for this feature — the cost (before the 2026-09-29
  fix below) was entirely server-side DB query count, invisible to a browser network tab.

## Confirmed Working

- **2026-09-29 — dev-reported performance fix, verified functionally.** Customer (Simon Goličnik) reported an N+1
  `email_addresses` query in `app/views/wiki/_form.html.erb` (lines 4 and 6 filtered users in Ruby via
  `User#mail`, one query per user — ~1,100 extra queries / 4.4s of a 5.8s page load on their ~1,100-user instance).
  Developer fixed it (SQL-side `joins(:email_address).where.not(...)`, selecting only `id`/`login`) and asked for
  verification on a fresh Forge instance (`flux-fxly6nkbd49`). Tested via Playwright on project `defaultsd`
  (Software development5): both the wiki New-page and Edit-page forms render `usersData` with exactly 21 entries
  matching the project's 21 real members, no emails leaked; `@luna.blossom` autocomplete resolved correctly to
  "Luna Blossom"; save rendered the mention as a working `/users/5` link; `responseEnd` ~170-230ms on both forms,
  no console errors. **This environment only has ~21-24 total users** — far short of the reporter's ~1,100 — so
  this confirms the fixed code path is functionally correct (no regression in who gets listed/notified), but does
  **not** by itself prove the N+1 query count was actually eliminated at scale; that would need Rails/SQL log
  access on a large-user instance, which wasn't attempted here (browser-only QA, per root MEMORY.md's
  Use-Playwright-Not-Backend-Debugging rule). No defect found. Not tied to any TC-MEN case — this was an ad hoc
  dev-reported fix verification outside the authored suite (Performance/load testing is unchecked in
  `MENTIONS_SCOPE.md`).

## Recurring Issues

- (none recorded yet)

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/mentions-plugin/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
- Forge instance used 2026-09-29 (`flux-fxly6nkbd49.forge.zehntech.com`) had admin password force-reset on first
  login (old `admin` → new one supplied by the requester); Mentions plugin v6.0.0 installed, symbol set to default
  `@`.
