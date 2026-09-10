# Bug Report Template

- Bug ID: BUG-HLP-006
- Production Redmine Issue ID: 119570
- Title: A customer cannot open a ticket they created — the ticket link in their own restricted Helpdesk Tickets list points to the standard `/issues/:id` route, which the Customer role is not authorized to access
- Redmine version: (see QA_CREDENTIALS_FORGE.md — Forge, flux-forgyim9c49)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Forge (https://flux-forgyim9c49.forge.zehntech.com/)
- Browser: Chromium (Playwright MCP)
- User role: Client (Customer)
- Date: 2026-08-24

## Steps to reproduce

1. As admin, create a Helpdesk customer with Project Access to a Helpdesk-enabled project (here: "Login TestCustomer", login `logintest.customer`, Project Access → Agile Board Project).
2. Sign in as that customer.
3. From "My Helpdesk" (`/helpdesk`) → the assigned project → **New issue**, raise a ticket (here: ticket **#271**, "Customer login and ticket-raising test").
4. After creation, the customer lands on **Helpdesk Tickets** (`/projects/agileboard/helpdesk/tickets`) and correctly sees their own ticket listed ("Agile Board Project · 1 tickets").
5. Click the ticket's **Ticket #** link, or its **Subject** link (both point to `/issues/271`).

## Expected result

- The customer should be able to open and view the ticket they just created — this is explicitly promised by the "My Helpdesk" page's own description text: *"Your support projects. Open one to raise a ticket or **follow an existing one**."*

## Actual result

- Clicking either link (Ticket # or Subject) redirects to the site's Home page (`/`) with the banner: **"You are not authorized to access this page."**
- Reproduced 3 times identically: via the Ticket # link, via the Subject link, and by navigating directly to `/issues/271` while signed in as the customer.
- The ticket **is** correctly scoped and listed in the customer's own restricted ticket list (proving the list itself respects the customer's project access) — the failure is specifically that the link target (`/issues/:id`, Redmine's standard issue-detail route) requires a permission the Customer role does not have, rather than routing to whatever restricted detail view the plugin actually intends customers to use.
- This is a fundamental break in customer-facing functionality: a customer can raise a ticket and see that it exists, but cannot open it to read replies, check status changes, or follow up — the single most basic "self-service" action the whole Helpdesk portal exists for.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-006/customer-cannot-open-own-ticket.png)

### Console / log

- No console errors — this is a server-side authorization check on `/issues/271` rejecting the Customer role, not a JS exception.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — 2026-08-26 (Local, `redmine-docker-6`)

**Does NOT reproduce on Local.** Retested via real click-through UI navigation (per the "no direct URL navigation" QA rule, not by jumping straight to a URL): logged in as customer `beta.customer` on `http://localhost:3012` → **My Helpdesk** → **Helpdesk QA Beta** project card → **View** → **Helpdesk Tickets** sub-nav → clicked ticket **#67**'s row link. The ticket opened successfully — full description, Organization, and existing reply thread all visible; no authorization error.

**Root-cause difference identified, ties directly to `BUG-HLP-007`'s dual-route finding (see `HELPDESK_MEMORY.md`'s 2026-08-26 addendum):** on this local build, the customer's own "Helpdesk Tickets" list links the ticket # / subject to the **branded** route (`/projects/helpdesk-qa-beta/helpdesk/issues/67`, `RfProjectHelpdeskIssuesController`) — which the Customer role *is* authorized to access. The original Forge repro above shows the link instead pointing to the **core** `/issues/:id` route (`IssuesController`), which the Customer role is *not* authorized for. So the underlying defect (if it's the same one) appears to be about which controller/route the customer ticket-list template resolves its links to — not a blanket "customers can never open their ticket" problem.

**Portal-origin variable controlled for and ruled out:** the ticket above (#67) originated by email, not the customer's own "New issue" form, unlike ticket #271 in the original Forge repro — so as a same-session follow-up, created a fresh ticket (**#69**, "BUG-HLP-006 retest: customer portal ticket open check") via `beta.customer`'s own **New issue** portal form directly, matching the original repro's creation method exactly. Clicking ticket #69 from the same customer ticket list also opened successfully (`/projects/helpdesk-qa-beta/helpdesk/issues/69`, full content rendered, no authorization error). So the pass is not specific to email-originated tickets — it holds regardless of how the ticket was created.

**Not yet resolved / next step:** this does not by itself prove BUG-HLP-006 is fixed on Forge — it may be a genuine difference in plugin version/build between this local install and the Forge instance where the bug was originally filed (`flux-forgyim9c49`). **Recommend retesting directly on the current Forge instance before closing this bug** — do not close based on the local finding alone.

Screenshots: `screenshots/BUG-HLP-006/retest-2026-08-26-local-pass.png` (ticket #67, email-originated), `screenshots/BUG-HLP-006/retest-2026-08-26-local-portal-ticket-pass.png` (ticket #69, portal-originated).

## Retest — 2026-08-31 (Local, `redmine-docker-6`, fully rebuilt environment)

- **Second independent clean pass, zero shared history with either prior repro.** Retested on the environment rebuilt earlier this session (new project, new customer `alpha.customer`, new tickets #1/#2 — see `bugs/closed/BUG-HLP-014.md`'s rebuild notes). Logged in as `alpha.customer` via genuine click-through (My Helpdesk → Helpdesk QA Alpha → View → Helpdesk Tickets), clicked ticket #2's Subject link.
- **Result**: link correctly points to the branded route (`/projects/helpdesk-qa-alpha/helpdesk/issues/2`), which the Customer role is authorized to access — ticket opened successfully, full Description rendered, no "You are not authorized" banner. Screenshot: `retest-2026-08-31-local-pass-rebuilt-env.png`.
- **Verdict: Does NOT reproduce on Local, second confirmation.** Combined with the 2026-08-26 retest (also PASS, on different fixtures), this is now two independent clean passes on Local across two different environment builds.

## Closed — 2026-08-31

- Closed per explicit user confirmation, despite the bug's own earlier recommendation to retest on Forge first before closing — the current Forge URL on file (`flux-fwdq7ydhw49`) was already flagged stale, and the user chose to close based on the two independent clean Local passes rather than wait on a Forge re-verify.
- **Process note**: unlike BUG-HLP-014/003/004/005/002 (where the root cause was fully understood or a plugin-clone explanation was given), this closure rests on repeated non-reproduction across two separate Local rebuilds, without ever confirming the fix on the environment (Forge) where the bug was originally filed. If this exact symptom (customer's own ticket list linking to a `/issues/:id` route the Customer role can't access) reappears on Forge or anywhere else, file a new bug rather than reopening this one — treat it as a fresh finding, not a regression of this closed bug.
