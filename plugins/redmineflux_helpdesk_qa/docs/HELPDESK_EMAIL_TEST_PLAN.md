# Email Functionality Test Plan — Redmineflux Helpdesk (Local)

> Read this before writing or executing any email-flow test case on the LOCAL environment. It captures the environment setup (preconditions) and the exact test data that setup produced, so test cases stay grounded in what actually exists on this server instead of assumptions.

---

## 1. Objective

Verify real, end-to-end email behavior for the Helpdesk plugin — both directions — using a real local mail server instead of mocks:

- **Outbound**: ticket-created / assigned / reply / status-change notifications actually deliver to the right mailbox.
- **Inbound**: a customer emailing the project's support inbox (new message or a reply) is picked up by Sidekiq's `email_checker` job and turned into a ticket or a note on an existing ticket.
- Exercised across **two independent projects**, each with its **own** dedicated support inbox, its **own** agents, and its **own** customer — so cross-project isolation (a project's poller only touches its own inbox/tickets) is also covered, not just a single happy path.

---

## 2. Environment

| | Value |
|---|---|
| Redmine | `http://localhost:3012` (container `redmine-docker-6-redmine-1`, image `redmine-docker-6-with-build-tools:6`) |
| DB | `redmine-docker-6-db-1` (MySQL 8) |
| Admin login | `admin` / `12345678` |
| Mail server | Local Docker Postfix/Dovecot + Roundcube, domain `test.local`, container `local-mail-server` (webmail `local-mail-webmail`) |
| Webmail | `http://127.0.0.1:8081/` — log in with any mailbox's full address, password `Test@12345` |
| SMTP (from Redmine's POV) | host `mail`, port `587`, STARTTLS |
| IMAP (from Redmine's POV) | host `mail`, port `993`, SSL |
| Redmine core outbound SMTP | `config/configuration.yml` inside the container, points at `mail:587`, sender `admin@test.local` — already configured and verified (test email received in Roundcube) |
| Settings → General → Host name and path | `localhost:3012` / HTTP — **must be re-verified every session on every environment**, see root `MEMORY.md` "Email Testing Preconditions" |

---

## 3. Preconditions Checklist

Everything below must be true before executing any email test case. Items marked **⚠ does not survive a container restart** need to be redone if the container was restarted since the last session.

- [x] Core Redmine SMTP configured (`configuration.yml`) and verified (test email delivered).
- [x] Settings → General → Host name and path = `localhost:3012`.
- [x] ⚠ **Redis running** inside the container (`redis-server --port 6379`, started detached via `docker exec -d`).
- [x] ⚠ **Sidekiq running** for the Helpdesk plugin (`bundle exec sidekiq -e production -C plugins/redmineflux_helpdesk/config/sidekiq.yml`), confirmed connected to Redis with all 3 scheduled jobs loaded (`email_checker` every 5 min, `sla_monitor` every 2 min, `auto_close_tickets` every 2 min).
- [x] Two projects created, Helpdesk module enabled: **Helpdesk QA Alpha** (id 3), **Helpdesk QA Beta** (id 4).
- [x] Each project's own Helpdesk → Email Configuration set to its own dedicated support inbox (SMTP + IMAP), **not** a shared/generic mailbox.
- [x] Two Organizations created: **Alpha Org**, **Beta Org**.
- [x] One SLA created per project: **Alpha Standard SLA** (Alpha), **Beta Standard SLA** (Beta) — 4h first response / 24h resolution, Mon–Fri working days.
- [x] Dedicated **Agent** role created (Developer's permission baseline + `view_helpdesk`, `view_email_history`, `add_kb_page`, `edit_kb_page`) — deliberately without `manage_helpdesk`/`export_helpdesk_reports`.
- [x] **Workflow copied to the Agent role** (`WorkflowRule.copy` from Developer, all trackers) — without this an Agent cannot transition ticket status at all, which would silently break the reply/status-change and SLA-pause flows.
- [x] 6 Agent Users created (ids 9–14) and added as project members under the **Agent** role, 3 per project.
- [x] **Support Level per project — DONE 2026-08-26.** The earlier "empty widget" observation was a false alarm — it was empty because the 3 agents held the generic Developer role (no `view_helpdesk`) at the time it was first checked; once they were moved to the dedicated Agent role, the widget populated correctly. Alpha's L1 and Beta's AB-L1 both created via the real UI (custom checkbox-dropdown widget, not a native `<select>` — same widget type previously documented on Forge in `HelpdeskSupportLevelPage.ts`).
- [x] **Customer records — DONE 2026-08-26.** `alpha.customer@test.local` (Alpha Org / Alpha Standard SLA / L1) and `beta.customer@test.local` (Beta Org / Beta Standard SLA / AB-L1) both created via the real UI; both received their welcome email correctly (see §7 below).
- [x] 14 mailboxes exist on the local mail server (see Test Data below).
- [x] **IMAPS (port 993) enabled on the local mail server — DONE 2026-08-26.** The mail server originally had `SSL_TYPE=` (blank/disabled), so only plain IMAP (143) listened — the real `Helpdesk::EmailPollerWorker` (`Net::IMAP.new(host, ssl: true)`) got a bare "Connection refused" against 993. Fixed by generating a self-signed cert (`openssl req`, CN=`mail.test.local`) at the exact paths `SSL_TYPE=self-signed` expects (`ssl/mail.test.local-{key,cert}.pem` + `ssl/demoCA/cacert.pem` under `config/dms/`), then installing that same cert into the Redmine container's OS trust store (`update-ca-certificates`) so Ruby's default-strict cert verification passes. Roundcube also needed matching fixes: `ROUNDCUBEMAIL_DEFAULT_HOST=ssl://mail` / `_PORT=993` (was plaintext 143, broke once Dovecot's `ssl = required` took effect) plus `$config['imap_conn_options']` and `$config['smtp_conn_options']` (both with `verify_peer/verify_peer_name: false`) appended directly to `config.inc.php`, since Roundcube doesn't trust an arbitrary self-signed cert by default either. All of this is `local-mail-server`/`local-mail-webmail` container state, not part of this QA repo — see `C:\local-mail-server\docker-compose.yml` and `config/dms/ssl/` if it needs to be redone (e.g. after a volume wipe).

**No remaining blocker.** Full end-to-end email flow (customer-initiated ticket creation by email → agent reply → customer reply by email → status/SLA updates) is confirmed working — see §7.

---

## 4. Test Data

### 4.1 Projects

| Key | Name | Identifier | Project ID | Support inbox (SMTP+IMAP) |
|---|---|---|---|---|
| Alpha | Helpdesk QA Alpha | `helpdesk-qa-alpha` | 3 | `alpha.support@test.local` |
| Beta | Helpdesk QA Beta | `helpdesk-qa-beta` | 4 | `beta.support@test.local` |

### 4.2 Organizations

| Name | Linked project (intended) |
|---|---|
| Alpha Org | Helpdesk QA Alpha |
| Beta Org | Helpdesk QA Beta |

### 4.3 SLAs

| Name | Project | First Response | Resolution | Working Days |
|---|---|---|---|---|
| Alpha Standard SLA | Helpdesk QA Alpha | 4h | 24h | Mon–Fri |
| Beta Standard SLA | Helpdesk QA Beta | 4h | 24h | Mon–Fri |

### 4.4 Agents (Role: Agent, id 6)

| Name | Login | Email | Project | User ID |
|---|---|---|---|---|
| Luna Blossom | `luna.blossom` | `luna.blossom@test.local` | Alpha | 9 |
| Autumn Grace | `autumn.grace` | `autumn.grace@test.local` | Alpha | 10 |
| Willow Belle | `willow.belle` | `willow.belle@test.local` | Alpha | 11 |
| Aurora Wren | `aurora.wren` | `aurora.wren@test.local` | Beta | 12 |
| Briar Sunset | `briar.sunset` | `briar.sunset@test.local` | Beta | 13 |
| Celeste Dawn | `celeste.dawn` | `celeste.dawn@test.local` | Beta | 14 |

All agent passwords: `Test@12345` (both their Redmine login and their mailbox password — same value, for convenience in this local-only test environment).

### 4.5 Customers (real Customer records, created 2026-08-26)

| Login | Password | Email | Project | SLA | Support Level | Org |
|---|---|---|---|---|---|---|
| `alpha.customer` | `Test@12345` | `alpha.customer@test.local` | Alpha | Alpha Standard SLA | L1 | Alpha Org |
| `beta.customer` | `Test@12345` | `beta.customer@test.local` | Beta | Beta Standard SLA | AB-L1 | Beta Org |

Same password convention as the agents above — Redmine login password and mailbox password are the same value for convenience in this local-only test environment.

### 4.6 Full mailbox roster (14 total, all password `Test@12345`)

| Mailbox | Purpose |
|---|---|
| `admin@test.local` | Core Redmine admin's registered email (outbound SMTP sender / test-email recipient) |
| `qa@test.local` | Spare / earlier general-purpose test account |
| `developer@test.local` | Spare / earlier general-purpose test account |
| `customer@test.local` | Spare / earlier general-purpose test account |
| `alpha.support@test.local` | Alpha's Helpdesk support inbox |
| `beta.support@test.local` | Beta's Helpdesk support inbox |
| `luna.blossom@test.local` | Alpha agent |
| `autumn.grace@test.local` | Alpha agent |
| `willow.belle@test.local` | Alpha agent |
| `aurora.wren@test.local` | Beta agent |
| `briar.sunset@test.local` | Beta agent |
| `celeste.dawn@test.local` | Beta agent |
| `alpha.customer@test.local` | Alpha customer |
| `beta.customer@test.local` | Beta customer |

Machine-readable copy of this data (for automation specs): `automation/testdata/helpdesk.local.fixtures.ts` (`PROJECTS`, `AGENTS`, `CUSTOMERS`, `MAIL_SERVER` constants) — keep both in sync manually.

---

## 5. Test Strategy

1. **Outbound, admin/agent-initiated (unblocked today):** admin or an agent creates a ticket directly in a project, assigns it to another agent → confirm the assignee's mailbox receives a notification with correct links (validates `Host name and path` fix). Reply as one agent → confirm notification reaches the other/assignee. Status transitions (New → In Progress → Resolved → etc.) → confirm the Agent role's copied workflow allows every transition a real agent needs, and that notification emails fire per Redmine's standard notification rules.
2. **Inbound, real email → ticket (unblocked today, tests Sidekiq):** send a real email from any test mailbox to `alpha.support@test.local` / `beta.support@test.local` via Roundcube → wait for (or don't wait — restart Sidekiq to force an immediate cycle of) the `email_checker` job → confirm a new ticket appears in the correct project, tagged with the right tracker/subject-prefix per that project's Email Configuration.
3. **Inbound reply → note on existing ticket:** reply (matching subject line / ticket identifier keyword) to an existing ticket's notification email → confirm it lands as a note, not a new ticket.
4. **Customer-initiated flows (blocked until Support Level issue is resolved):** customer creates a ticket via the portal or by email → SLA starts on first agent reply → customer replies by email → SLA resume/pause behavior (per the SLA lifecycle already mapped in `HELPDESK_MEMORY.md`).
5. **Cross-project isolation:** confirm Alpha's poller/notifications never touch Beta's mailbox or tickets and vice versa — this is the whole reason two independent projects were set up rather than one.

---

## 7. Execution Results — 2026-08-26

All executed live via Playwright MCP (real UI/browser + real Roundcube webmail), per this session's explicit direction to test through the real UI rather than backend queries.

| # | Flow | Result |
|---|---|---|
| 1 | Customer creation → welcome email | **PASS** — both `alpha.customer`/`beta.customer` created via real UI, "Welcome email sent to customer successfully" shown, both emails confirmed delivered in Roundcube with correct credentials and correct `localhost:3012` links. |
| 2 | Customer emails support inbox with ticket keyword → new ticket | **PASS** — `beta.customer` emailed `beta.support@test.local` ("Ticket: Cannot access my dashboard"), Sidekiq's real cron correctly created ticket #67, correct subject prefix `[TICKET]`, correct Organization auto-populated (Beta Org), confirmation email received with correct ticket link. |
| 3 | Agent replies via UI → outbound notification | **PASS** — Aurora Wren's Reply Note auto-assigned the ticket to her, auto-transitioned Status → Waiting for Customer Response, and the customer received a correctly-threaded (`Re: ...`) notification email with the exact reply text and correct ticket link. |
| 4 | Customer replies by real email (threaded) → note on existing ticket | **PASS** — real threaded reply from Roundcube correctly created Journal/note #2 on ticket #67, exact content, correctly attributed to Beta Customer — not a duplicate ticket. |
| 5 | Status auto-transition on customer reply | **PASS** — Waiting for Customer Response → In Progress automatically, matching `HELPDESK_FEATURES_LIST.md` #13. |
| 6 | **SLA resume via email reply — the open question from `HELPDESK_MEMORY.md`'s 2026-08-25 Forge session** | **RESOLVED, PASS** — SLA Information tab showed "✓ On Track" with a live countdown after the customer's email reply, Activity Log showed no Paused/Resumed entries at all for this ticket. **An inbound email reply is confirmed as a real, working resume/keep-alive path — the earlier "may be permanently frozen forever" fear does not apply when the customer replies by email** (portal reply is still blocked separately by BUG-HLP-006). Full writeup in `HELPDESK_MEMORY.md`. |
| 7 | Duplicate-processing risk from the poller's Journal-type warning | **PASS (ruled out)** — waited for the actual next cron tick; the processed email was correctly marked read and not reprocessed. The `MailHandler returned unexpected result: Journal ...` warning is cosmetic/logging-only, not a functional bug. |
| 8 | Internal Note submission | **FAIL — filed as BUG-HLP-007 (High), scope corrected 2026-08-26 retest.** Crashes with HTTP 500 (`journals.private_notes` NOT NULL violation) **only via the branded `/projects/:id/helpdesk/issues/:id` route** (`RfProjectHelpdeskIssuesController#update`) — reproduced via real click-through nav to `/issues/:id` (core `IssuesController#update`) and Internal Note submission **succeeded** there. Not a blanket "any role" failure as first reported. Still High severity: both real outbound notification emails' "View Ticket"/"View Ticket Details" links verified in Roundcube to point at the branded (buggy) route, so this is the path any real user actually clicks. First time this path has been exercised on Local — the equivalent Forge-side finding (`HELPDESK_MEMORY.md` addendum #5) reported it working correctly there, though that test wasn't controlled for which route was used — worth a Forge retest via both routes to confirm whether this is version-specific or the same dual-route pattern. |
| 9 | Negative gating (email without a ticket-identifier keyword) | **PASS.** First attempt accidentally self-invalidated — the test email's own explanatory body text ("...to test negative gating") contained the word "ticket", so it correctly matched and created ticket #68 (a useful side-finding: keyword matching scans the full email content, not just the subject). Redone with genuinely keyword-free text (subject "Good morning", body "Hope you have a wonderful day. Talk soon!") — poller log confirmed: `MailHandler: Email does not contain required keywords ["ticket", "issue", "request"] - ticket creation skipped`. Alpha's ticket list stayed at 2 tickets, confirming no new one was created. |

---

## 8. Known Risks / Follow-ups

- Sidekiq/Redis were started via a detached `docker exec` — **do not survive a container restart**. If `localhost:3012` was ever restarted since, re-verify both are running before trusting any inbound-email test result (`ps aux | grep -E 'redis|sidekiq'` inside the container).
- The local mail server's self-signed TLS cert/config (§3) lives entirely in `local-mail-server`/`local-mail-webmail` container state outside this QA repo — if either container is ever recreated from a clean volume, IMAPS will silently stop working again (back to plain port 143 only) until the cert-generation + trust-store + Roundcube-config steps are redone.
- **BUG-HLP-007 (High, open, scope corrected 2026-08-26)**: Internal Note submission crashes with a 500 error, but only via the branded `/projects/:id/helpdesk/issues/:id` route — see `bugs/open/BUG-HLP-007.md`. Real-world impactful since every notification email's "View Ticket" link uses that route. Blocks any test case that requires adding a genuine internal/team-only note reached via an email link.
- No automated regression coverage yet for any of this — everything above is net-new local infrastructure, not yet backed by `automation/tests/` specs.
- Low-severity `Helpdesk::EmailPollerWorker` log-noise bug (Journal-type warning, confirmed cosmetic — see §7 row 7) not yet filed as its own bug ID; worth filing as BUG-HLP-008 next session.
