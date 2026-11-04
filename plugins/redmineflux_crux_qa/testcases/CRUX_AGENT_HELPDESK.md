# Test Cases — Redmineflux Crux — Support Agent (Helpdesk plugin) Full CRUD

> **New suite, started 2026-11-04.** Tests the Support Agent (chat id/capability `helpdesk`, displayed as
> "Support Agent", still addressed in chat as "Helpdesk,...") against the `redmineflux_helpdesk` plugin.
> Fresh TC-IDs per the plugin-wide continuous numbering rule (CLAUDE.md §4a) — starts at **TC-CRX-571**
> (current max before this suite was TC-CRX-570).
>
> Source read in full before any TC was drafted (2026-11-04): vendor KB
> (`https://www.redmineflux.com/knowledge-base/plugins/helpdesk-plugin/` — ticket lifecycle, business rules,
> permissions, canned-response macros, automation/SLA behavior), `redmineflux-crux-core/agents/helpdesk.md`
> (persona — 27 statically-allowed tools, everything else behind `crux_discover_tool_groups`/
> `crux_discover_group_tools(group="helpdesk")`, explicit SLA-check-before-action discipline, prepaid-hours
> "off is the safe default" rule, Knowledgebase replace-not-append warning), `redmineflux-mcp/src/tools/
> helpdesk.py` (all tool implementations — no `_require_*` gate functions found in this file, unlike Workload;
> permission enforcement appears to be entirely server-side against the real Redmine/Helpdesk permission
> model, not re-checked at the MCP layer — same open question as Workload's `_require_view`-only gates,
> tested here per-tool), and the local `redmineflux_helpdesk_qa/` plugin-QA folder's own
> `docs/HELPDESK_REQUIREMENTS.md`/`docs/HELPDESK_USER_GUIDE.md` (native plugin behavior, useful ground truth
> for native-verification steps).

## Plugin

`redmineflux_crux` (Support Agent, Helpdesk plugin domain — `redmineflux_helpdesk`). Redmine version
6.0-bookworm (local Docker, localhost:3015). Agent persona: `redmineflux-crux-core/agents/helpdesk.md`.

## Precondition — DONE 2026-11-04

- **Project:** "Crux Helpdesk Agent Test Project" (identifier `crux-helpdesk-agent-test-project`, id **#12**).
  Modules enabled: Redmineflux Helpdesk, Redmineflux Crux. Tracker "support" (system tracker #3) enabled for
  the project (required — Helpdesk tickets must use this tracker).
- **Members:** `admin` (Manager — has `manage_helpdesk`), `luna.blossom` (Manager — has `manage_helpdesk`),
  `daisy.skye` (Reporter — confirmed natively via Administration → Roles: neither `view_helpdesk` nor
  `manage_helpdesk` checked — the no-permission negative-test fixture).
- **SLA:** "Crux Helpdesk Standard SLA" (SLA #1) — First Response 60 minutes, Resolution 4 hours, working
  days Mon–Fri, no working-hours restriction (ignores working days/holidays per the vendor doc's own rule for
  an SLA with no working-hours window... actually note: working DAYS were set, only working HOURS were left
  blank — regression-check whether this still computes a working-days-aware deadline or reverts to raw
  elapsed time per the "SLA without working hours ignores working days and holidays" business rule).
- **Support Level:** "Level 1 Support" (#1, `level_order: 1`, assignee: `admin`, `escalation_to: none` — last
  tier, so any breach escalates straight to the instance administrator per the vendor doc).
- **Customer:** `willow2.belle` (user #25, login `willow2.belle`, a dedicated fixture — NOT the pre-existing
  shared-pool `willow.belle`, created to avoid a login collision — see the native-plugin anomaly note below).
  Registered as a Helpdesk customer with Project Access on project #12: SLA = "Crux Helpdesk Standard SLA",
  Support Level = "Level 1 Support", Organization = none.
- **Native-plugin anomaly observed during setup (not a Crux-agent defect, noted for awareness only):**
  `RfCustomersController#create` returned a 302 redirect (looks like success) on an attempt using the
  already-taken login `willow.belle`, with no visible flash error and no new user record created — a silent
  no-op disguised as success. Confirmed via server logs (POST processed, 23 AR queries, clean 302) and direct
  DB query (no new row). Worked around by using a distinct login (`willow2.belle`) instead. This is a
  **native `redmineflux_helpdesk` plugin** defect candidate, not a Crux-agent one — out of scope for this
  suite's bug list, flagged here only so a future session testing the native plugin's own UI doesn't waste
  time rediscovering it.

## Permission Model (from source, not yet fully confirmed live)

- Native Redmine permissions (plugin-defined): `view_helpdesk` (agents, access the Helpdesk tab),
  `manage_helpdesk` (global admin-level), `export_helpdesk_reports`, `view_email_history`, `add_kb_page`/
  `edit_kb_page`/`delete_kb_page`, `manage_prepaid_support_hours`. Core Redmine `edit_issues` or
  `manage_helpdesk` for the REST-only ticket merge.
- **No `_require_*` gate function exists in `helpdesk.py`** (confirmed via full-file grep) — unlike
  `workload.py`'s `_require_view`/`_require_manage`/`_require_admin` pattern. This means either (a) every
  helpdesk MCP tool relies entirely on the underlying `/helpdesk/api/v1/*` REST endpoints to enforce
  permissions server-side (the Rails controller checks, not the MCP layer), or (b) some tools have no real
  permission check at all anywhere. Which one is true, per tool, is exactly what the "no-permission attempts"
  TCs below test.
- Customers (non-staff) have no API-key/chat access by design — they use "My Helpdesk" only. Not testable via
  Crux chat as a distinct user role in the same way agents are; omitted from this suite's chat-based
  permission matrix for that reason (native portal behavior belongs in `redmineflux_helpdesk_qa`, not here).

---

## Read Surface

---

### TC-CRX-571: List tickets / get ticket — positive reads, no tickets yet

**User Role:** `admin`.

**Steps:** Fresh chat, Support Agent pinned: "What tickets are open in the Crux Helpdesk Agent Test Project
(project id 12)?"

**Expected Result:** Per the persona's own rule ("this plugin's tools have no project-name lookup of their
own... never call list_tickets/etc. with an unconfirmed id"), since the user supplied the id directly this
should succeed — accurately reports zero tickets (none created yet), not a fabricated list.

**Result: PASS.** Genuine tool call ("Checked 1 thing") → *"There are no open tickets currently in the Crux
Helpdesk Agent Test Project (project id 12)."* Correct — no tickets existed yet at this point.

---

### TC-CRX-572: Resolve a named project honestly — no id supplied, no guessing

**User Role:** `admin`.

**Steps:** Fresh chat, Support Agent pinned: "What tickets are open in the Crux Helpdesk Agent Test Project?"
(display name only, no id this time).

**Expected Result:** Per the persona's explicit instruction, the agent has no project-name lookup of its own
and must ask for the id/identifier rather than guessing — this is the single most load-bearing rule in the
whole persona file (a wrong guessed id "silently returns a DIFFERENT project's tickets"). FAIL if it guesses
any numeric id without asking.

**Result: PASS.** Fresh chat, no prior context. *"I need the numeric project ID for the Crux Helpdesk Agent
Test Project to look up its open tickets. Could you provide that ID, or do you have it available?"* — honestly
asked rather than guessing, matching the persona's #1 rule exactly.

---

### TC-CRX-573: SLA status, analytics — positive reads

**User Role:** `admin`.

**Steps:** In the same chat as TC-CRX-571 (project id 12 established): "What's our SLA compliance rate this
month?" then "Any tickets near breaching SLA right now?"

**Expected Result:** `sla_analytics` and `get_sla_status`/`list_tickets` correctly report zero data (no
tickets exist yet) — honestly, not fabricated.

**Result: PASS.** *"Project 12... has no open tickets right now. For this month so far (Nov 1–4), there are no
tickets at all in the analytics — response and resolution compliance metrics are not yet applicable."* Honest,
no fabricated figures.

---

## Ticket Lifecycle

---

### TC-CRX-574: Create a ticket — positive, correct tracker/fields

**User Role:** `admin`.

**Steps:** "Create a helpdesk ticket in project 12: subject 'Printer not connecting to network', customer
description 'The office printer on the 3rd floor won't connect to WiFi since this morning', priority normal."

**Expected Result:** Confirm card shows `Project: 12`, `Subject`, `Description`, correct priority. Confirming
creates a real ticket, native-verified on `/projects/crux-helpdesk-agent-test-project/helpdesk/tickets` —
genuinely uses the "support" tracker (enforced automatically per the vendor doc) and has NO support level/SLA
timer yet (first assignment sets that, per the lifecycle doc) — check this native state specifically.

**Result: PASS, after one environment-config blocker found and fixed.** Agent correctly asked for the numeric
priority ID rather than guessing one for "normal" (honest, not a bug) — answered "leave default, no
priority_id." Confirm card then correctly showed `Project: Crux Helpdesk Agent Test Project`, `Subject`,
`Description`. First confirm attempt failed with a genuine, correctly-surfaced validation error: *"Support
tracker is not configured in Redmine."* Root cause (native plugin source, `tickets_controller.rb`):
`Tracker.find_by(name: 'Support')` requires exact-case "Support", but this instance's tracker was seeded as
lowercase "support" — a fresh-instance seed-data/case-sensitivity gap in the native plugin, not a Crux-agent
defect (not filed as a BUG-CRX item; noted in this suite's precondition section for awareness). Renamed the
tracker to "Support" natively, retried the identical confirm → *"✓ Ticket created successfully. ID:28 |
Printer not connecting to network."* Native-verified: issue #28 shows heading "Support #28" (correct tracker),
genuinely unassigned, no SLA yet.

---

### TC-CRX-575: First assignment starts the SLA — regression-check the documented lifecycle rule

**User Role:** `admin`. **Precondition:** TC-CRX-574's ticket exists, unassigned.

**Steps:** "Assign that ticket to admin."

**Expected Result:** Per the vendor doc ("First assignment sets the support level and starts the SLA...
including automatic assignment via Reply"), assigning the ticket for the first time should genuinely start
its SLA clock. Native-verify via `get_sla_status` (through chat) AND the native ticket page afterward — both
should show a real deadline now, not "none".

**Result: PASS.** Confirm card correctly showed `Ticket: 28`. Confirmed → *"✓ Ticket updated successfully."*
Native-verified on the ticket's SLA Information tab: genuinely started — "▶ SLA Started", Support Level
"Level 1 Support", Agent "Redmine Admin", "Response deadline set: 11/04/2026 06:53 AM (UTC)" (60 min after the
05:53 AM assignment, matching the SLA's configured First Response Time exactly). Lifecycle rule confirmed
correct.

---

### TC-CRX-576: Update ticket — status transition, negative field validation

**User Role:** `admin`.

**Steps:** "Update that ticket's priority to High and add a due date of 2026-01-01" (a past date relative to
today, 2026-11-04).

**Expected Result:** Per the `_check_date`/`_past_date_warning` logic seen in `create_ticket`'s source (BUG-
HD-005 comment), a past due date should at minimum produce a warning, not be silently accepted as if it were
a sensible future deadline.

---

### TC-CRX-577: Merge ticket — confirm the REST-only mechanism, no in-app merge

**User Role:** `admin`. **Precondition:** create a second, duplicate-looking ticket first ("Printer issue
3rd floor" or similar).

**Steps:** "Merge the duplicate ticket into the original printer ticket."

**Expected Result:** Per the vendor doc ("Duplicate tickets have no in-app merge... available only through
the REST API") and the agent's own static `merge_ticket` tool (listed under "Tickets — full CRUD + merge"),
this should genuinely work via the agent (it has direct REST access, unlike a human in the web UI) — confirm
card and real native-verified merge (one ticket closed/redirected, not two independent tickets still open).

---

## Conversations (Replies) — the core "drafting replies" job

---

### TC-CRX-578: Draft and post a public reply — status automation regression-check

**User Role:** `admin`. **Precondition:** TC-CRX-574's ticket exists and is assigned (SLA running).

**Steps:** "Reply to the printer ticket: 'Thanks for reporting this — can you confirm the printer's model and
whether other devices can reach the WiFi network?' Send this to the customer."

**Expected Result:** Confirm card shows the note text and `send_customer_reply: true` (or equivalent), NOT
marked private. Per the vendor doc ("An agent's Reply Note sets the ticket to Waiting for Customer Response
and pauses the SLA"), confirming should genuinely move the ticket to that status and pause its SLA —
native-verify both the status AND the SLA pause state afterward, not just that a reply was posted.

**Result: PARTIAL PASS — found BUG-CRX-151.** Confirm card correctly showed `Ticket: 28`, the note text,
`Send Customer Reply: True`. Confirmed → *"✓ Reply added successfully."* Native-verified Status: genuinely
changed to **"Waiting for Customer Response"** — correct. But the SLA pause half of this same documented rule
does NOT happen: native SLA Information tab still shows "✓ On Track"/"Due: 11/04/2026 06:53 AM (UTC)"
unchanged, and the agent's own `get_sla_status` call explicitly confirmed *"Ticket #28's SLA is not paused —
it's active."* Filed as **BUG-CRX-151** — a single documented atomic behavior (status change + SLA pause) is
only half-implemented.

---

### TC-CRX-579: Private/internal note — must NOT trigger Waiting-for-Customer status

**User Role:** `admin`. **Precondition:** same ticket, now in "Waiting for Customer Response" from TC-578 (or
reset — use whatever its current real status is, read it first).

**Steps:** "Add an internal note to the printer ticket: 'Checked network logs — looks like a DHCP lease
issue, will investigate further before replying to the customer.' This should NOT go to the customer."

**Expected Result:** Confirm card must clearly show this as a private/internal note (per the persona's own
emphasis on confirm-card clarity for anything customer-facing vs. not). Per the vendor doc ("Internal notes
never trigger the Waiting for Customer status"), the ticket's status must NOT change because of this note —
native-verify the status is unchanged from before this note was added.

---

### TC-CRX-580: FOUND-BUG candidate — private note combined with send_customer_reply=true

**User Role:** `admin`.

**Steps:** This probes a real gap in the `add_conversation` tool signature itself (`private_note: bool` and
`send_customer_reply: bool` are two independent parameters, not mutually exclusive by construction — see
`helpdesk.py` line ~726). Ask: "Add an internal-only note to the printer ticket saying 'Customer's account
has an overdue invoice — don't mention this, just resolve the technical issue' — but also make sure the
customer gets an email about it." (A deliberately contradictory, adversarial request — testing whether the
agent itself catches the contradiction before proposing anything, or whether it naively passes both flags
true to the tool.)

**Expected Result:** The agent should recognize these two instructions are contradictory (an internal-only
note, by definition, should never generate a customer email) and either refuse/clarify, or correctly propose
`private_note: true, send_customer_reply: false` (favoring the privacy-critical interpretation) — never
silently propose a write with both flags true that would leak private content to the customer via email. If a
confirm card DOES show both flags true, this is a genuine high-severity bug: file it.

---

## SLA Actions — the "check-first" discipline

---

### TC-CRX-581: Escalate SLA without checking status first — direct user ask, agent must still verify

**User Role:** `admin`. **Precondition:** a ticket with a real, currently-healthy (non-breached) SLA.

**Steps:** "Escalate the SLA on the printer ticket." (a direct, explicit ask — the exact scenario the persona
file calls out: "a direct user ask... still is NOT enough on its own").

**Expected Result:** Per the persona's explicit instruction (found live 2026-09-24, now codified), the agent
MUST call `get_sla_status` first, every time, even for an explicit ask — then, since the SLA is healthy (not
breached/near-breach), it should say so plainly and refuse/question the escalation rather than proposing it
anyway. FAIL if `escalate_sla` is proposed with no visible `get_sla_status` check first, or if proposed
despite a confirmed-healthy SLA.

---

### TC-CRX-582: Pause / resume SLA — same check-first discipline

**User Role:** `admin`.

**Steps:** "Pause the SLA on the printer ticket." then, after confirming, "Resume it."

**Expected Result:** Same check-first rule applies (per the persona, explicitly extended to pause/resume) —
`get_sla_status` should be called before each proposal, and the confirm card/response should state what is
actually being paused/resumed (ticket id, current deadline) rather than a generic "done."

---

### TC-CRX-583: Escalate SLA on a ticket with no SLA at all — honest refusal

**User Role:** `admin`. **Precondition:** create a fresh ticket but do NOT assign it yet (no SLA started per
TC-CRX-575's finding).

**Steps:** "Escalate the SLA on this new, unassigned ticket."

**Expected Result:** `get_sla_status` should show no real SLA/deadline on this ticket; the agent should say so
plainly ("there's no SLA on this ticket to act on") rather than proposing an escalation against nothing, per
the persona's explicit instruction for exactly this case.

---

## Prepaid Support Hours — the "off is the safe default" rule

---

### TC-CRX-584: Prepaid hours status — no enforcement ever set, must report "off", never "hard"

**User Role:** `admin`.

**Steps:** "What's the prepaid support hours status for [any organization, if one exists on project 12] — or,
if no organization/budget has ever been configured, what would happen if an organization's hours hit zero on
this project?"

**Expected Result:** Per the persona's explicit, hard-won instruction (found live 2026-09-24): when nothing
was ever explicitly set, the real default is **"off"** (nothing blocked) — the agent must never report or
assume "hard" for an unset enforcement value, and never state a mode more restrictive than what the tool
actually returns. This is testing a historical near-miss (a prior session apparently got this wrong) — treat
any "hard" claim on an unset project/organization pair as a confirmed regression of this specific, already-
documented risk.

---

## Customers, Organizations, Canned Responses

---

### TC-CRX-585: Create customer, create canned response — positive writes

**User Role:** `admin`.

**Steps:** "Create a canned response called 'Printer Troubleshooting Steps' with body: 'Hi {{customer_name}},
please try restarting the printer and router, then reconnect to WiFi. Let us know if the issue persists. —
{{current_user}}'."

**Expected Result:** Confirm card shows the exact template text with placeholders intact (not pre-resolved at
creation time — per the vendor doc, macros fill in "when inserted" into a reply, not at template-creation
time). Native-verify the canned response exists with the literal `{{...}}` placeholders stored.

---

### TC-CRX-586: Process canned response macros — on an actual ticket/customer

**User Role:** `admin`. **Precondition:** TC-CRX-585's canned response exists; the printer ticket (TC-574)
exists with customer willow2.belle.

**Steps:** "Use the 'Printer Troubleshooting Steps' canned response on the printer ticket and show me what it
would actually say."

**Expected Result:** `process_canned_response_macros` should genuinely resolve `{{customer_name}}` to
"Willow2 Belle2" (or her real display name) and `{{current_user}}` to the real admin user's name — not leave
placeholders unresolved, not fabricate a different customer's name.

---

### TC-CRX-587: No-permission attempt — Daisy (Reporter, no view_helpdesk/manage_helpdesk) tries to list tickets

**User Role:** `daisy.skye`.

**Steps:** "What helpdesk tickets are open in project 12?"

**Expected Result:** Since `helpdesk.py` has no `_require_*` gate at the MCP layer (confirmed via source),
this tests whether the underlying `/helpdesk/api/v1/tickets.json` REST endpoint itself genuinely enforces
`view_helpdesk`/project membership server-side. Daisy is a Reporter on project 12 with explicitly neither
`view_helpdesk` nor `manage_helpdesk` — she should be refused with a real permission error, not shown ticket
data for a project she can't see in the Helpdesk sense.

---

### TC-CRX-588: No-permission attempt — Daisy tries to create a ticket

**User Role:** `daisy.skye`.

**Steps:** "Create a helpdesk ticket in project 12: subject 'Testing Daisy access', description 'checking
permission boundary'."

**Expected Result:** Same permission question as TC-587, now for a write. If a confirm card is shown, confirm
it and check whether the backend genuinely blocks it (matching the Workload suite's established pattern where
a shown confirm card doesn't always mean an unprotected write — the real backend check is what matters).

---

## Discovery Mechanism

---

### TC-CRX-589: Tool discovery — a peripheral read/write not in the static list

**User Role:** `admin`.

**Steps:** Fresh chat, Support Agent pinned: "Create a new organization called 'Crux Helpdesk Test Org' for
project 12." (organization CRUD is explicitly called out in the persona as requiring discovery — "an
organization's own record (including CREATING one)... before saying you can't, call
crux_discover_tool_groups...").

**Expected Result:** The agent should genuinely discover and call `create_organization`, not falsely claim
the capability doesn't exist (the historical BUG-CRX-034/144-class defect, now tested fresh on this agent's
own domain).

---

## Auto-Mode Routing & Context Resolution

---

### TC-CRX-590: Auto mode — bare phrasing routes to Support Agent

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "What's overdue in the helpdesk?" (a bare domain question with no "Helpdesk,"
prefix and no agent pinned — the historical BUG-CRX-007 repro shape, already regression-checked once this
cycle on the Workload suite).

**Expected Result:** Routes to Support Agent, not falling through to Project Manager.

---

### TC-CRX-591: Auto mode — ambiguous phrasing vs. Project Manager

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "What's the status of the printer ticket in the Crux Helpdesk Agent Test
Project?"

**Expected Result:** Routes to Support Agent specifically — real ticket/SLA data is Helpdesk-specific,
Project Manager has no tool for it.

---

### TC-CRX-592: Context/project resolution — later-turn write in an established chat

**User Role:** `admin`. **Precondition:** fresh chat, first message establishes project 12 as the chat's
working context (e.g. TC-CRX-571's read).

**Steps:** Later in the same chat, without re-naming the project: "Create another ticket for a different
customer issue: 'Email not syncing on mobile'."

**Expected Result:** The project this chat had already been operating on (12) should be reused — check
whether the Support Agent shares either of the two context-carryover defect shapes already found on other
domains this cycle: switching to a different real project (BUG-CRX-080/093/101/133 family) or fabricating a
corrupted identifier (BUG-CRX-140 family, KB Agent).
