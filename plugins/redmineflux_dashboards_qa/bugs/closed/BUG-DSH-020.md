# Bug Report Template

- Bug ID: BUG-DSH-020
- Production Redmine Issue ID: #121286
- Title: A member who creates a public share link cannot revoke it themselves — only an Administrator can, with no self-service revoke and no audit trail of who created it
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: **Daisy Skye**, project role **"Reporter"** on "test project"
- Date: 2026-09-24 (narrowed 2026-09-25 — see Revision note)

## Revision note (2026-09-25)

Originally filed covering two claims: (1) any project role can generate a share link at all, and (2) the creator
cannot revoke it themselves. On review against the vendor KB (fetched directly 2026-09-25),
**claim (1) is not a defect** — the KB states "any user with access to the project can open the dashboard" and
documents no granular permission for any dashboard action, meaning equal capabilities across roles is the
documented design, not a gap (same basis `BUG-DSH-015` was retracted on). **This bug is narrowed to claim (2)
only**, which the app's own Share-modal text explicitly surfaces as a real, if transparently-stated, limitation —
severity lowered from High to Medium to match the narrower scope.

## Steps to reproduce

1. Log in as `daisy.skye` / `12345678` (Reporter role).
2. Open the project's Dashboard tab and click **Share** — note the generated link works (this part is expected,
   documented behavior, not the defect).
3. Look for any way to revoke or disable that specific link as the same user (Daisy Skye), without contacting an
   administrator.

## Expected result

- A member able to create an externally-facing public link should have some self-service way to revoke their own
  link, or at minimum the system should record who created each active link so an administrator revoking it knows
  what they're revoking and why.

## Actual result

- The Share modal's own text states: **"To revoke access, please contact your administrator."** There is no
  Regenerate/Revoke control offered to the creating member — the only way to invalidate a link at all (as
  established in `TC-DSH-114`) is for *any* member (not necessarily the original creator) to reopen Share, which
  implicitly issues a fresh token and silently invalidates whichever one was previously active.
- Combined with `TC-DSH-124`'s finding (any member who opens Share can read the *currently* active token, not just
  its original creator) and `TC-DSH-107`'s finding (no attribution anywhere for who created or changed anything on
  the shared dashboard), there is no record of who minted a given link, and no way for that person to revoke it
  without going through an administrator — a real, if transparently-documented, governance gap.

## Evidence

### Console / log

- As `daisy.skye`: Share button click → modal text: "Anyone with this link can view this dashboard (read-only)...
  without any login." / "Note: This link provides public access without login. To revoke access, please contact
  your administrator." — no Revoke/Regenerate control offered to the member who created the link.
- `TC-DSH-114` (regeneration mechanics), `TC-DSH-124` (token visible to any member), `TC-DSH-107` (no
  attribution) all corroborate the same underlying gap from different angles.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`.

## Retest — 2026-09-25

**FIXED.** Logged in as Daisy Skye (Reporter) and opened Share on `redmine-docker-700` (test project) — the
modal's text has changed: it now reads **"Revoke it here when it is no longer needed."** with a new **"Revoke
link"** button, in place of the old "please contact your administrator" text with no self-service control.
Functionally verified, not just textually: captured the generated link (`200`, confirmed working from a fresh
cookie-free context), clicked **Revoke link** as Daisy Skye herself (confirmed via a native confirm dialog "Revoke
this link? Anyone holding it will lose access.", accepted), then re-requested the exact same URL from a fresh
context — **404**, link genuinely dead. The creator of a share link can now revoke it themselves with no
administrator involvement. Confirmed FIXED, ready to close.
