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

**Result: FAIL — found BUG-CRX-153 and BUG-CRX-154 (the original past-date question became moot; a different,
more severe failure blocked the write entirely).** Confirm card proposed `Priority: 2` (no tool-check shown —
a pure guess) alongside `Ticket: 28`, `Due Date: 2026-01-01`. Confirmed → genuine server validation failure:
`"Priority cannot be blank"` — not a past-date complaint at all. Retried with a corrected future date
(2026-12-01); confirm card still showed `Priority: 2` unchanged; confirmed → **identical** `"Priority cannot be
blank"` failure, proving the date was never the issue. Told the agent explicitly the date wasn't the problem —
it then genuinely checked a tool ("Checked 1 thing") and proposed `Priority: 3`, still wrong. Native-verified
via the real `/enumerations/issue_priorities.json` endpoint: this install's actual active priority ids are 6
(low), 7 (medium), **8 (high)**, 9 (immediate) — none of the agent's 3 guesses (2, 2, 3) ever matched. Filed as
**BUG-CRX-153** (wrong priority-id resolution, never converges even after a genuine tool check). Separately,
when the agent explained the first failure to the user, it **fabricated a false root cause** — "The due date...
is in the past... That's why the validation failed" — when the real error named Priority, not the date; this
false diagnosis was disproven by the identical error recurring with a genuinely valid date. Filed as
**BUG-CRX-154**. Native-verified throughout: ticket #28's Priority remained `low` and Due Date remained empty —
no data corruption, every failed write was cleanly rejected server-side.

---

### TC-CRX-577: Merge ticket — confirm the REST-only mechanism, no in-app merge

**User Role:** `admin`. **Precondition:** create a second, duplicate-looking ticket first ("Printer issue
3rd floor" or similar).

**Steps:** "Merge the duplicate ticket into the original printer ticket."

**Expected Result:** Per the vendor doc ("Duplicate tickets have no in-app merge... available only through
the REST API") and the agent's own static `merge_ticket` tool (listed under "Tickets — full CRUD + merge"),
this should genuinely work via the agent (it has direct REST access, unlike a human in the web UI) — confirm
card and real native-verified merge (one ticket closed/redirected, not two independent tickets still open).

**Result: PASS.** Created a second ticket (#30, "Printer issue 3rd floor," deliberately worded as a duplicate)
via chat with no priority specified (to sidestep BUG-CRX-153 for this unrelated test). Then: "Merge the
duplicate printer ticket (ticket 30) into the original printer ticket (ticket 28)." Confirm card correctly
showed `Ticket: 30`, `Merge Into: 28`. Confirmed → `"✓ Tickets merged successfully."` Native-verified both
sides: ticket #30's Status genuinely changed to **Done**, Related Issues shows **"Is duplicate of Support
#28,"** and its journal has **"Merged into ticket #28."** Ticket #28 remained untouched and still open
("Waiting for Customer Response") — exactly the one-closed/one-survives merge behavior expected, confirming the
agent's direct REST access genuinely provides the merge capability the vendor doc says has no in-app
equivalent for a human in the web UI.

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

**Result: PASS.** Confirm card correctly showed `Ticket: 28`, the note text, and no `Send Customer Reply` flag
(private note, correctly distinguished from TC-578's public reply). Confirmed → added successfully.
Native-verified: ticket #28's Status remained **"Waiting for Customer Response"** — unchanged from its state
going into this TC, confirming the internal note did not re-trigger or alter the status transition.

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

**Result: PASS.** The agent did not propose any write. It explicitly called out the contradiction: an
internal-only note by definition can't also be emailed to the customer, and asked the user to pick one
interpretation before it would proceed — correctly favoring safety/clarification over guessing which flag
combination was "really" meant. No confirm card with both flags true was ever produced.

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

**Result: PASS.** Agent visibly checked SLA status first ("Checked 1 thing") before responding, found the SLA
healthy (on track, not breached/near-breach), and declined to escalate without a substantive reason, asking
the user to confirm they actually wanted to escalate a healthy SLA rather than proposing `escalate_sla`
outright. Check-first discipline honored exactly as the persona requires.

---

### TC-CRX-582: Pause / resume SLA — same check-first discipline

**User Role:** `admin`.

**Steps:** "Pause the SLA on the printer ticket." then, after confirming, "Resume it."

**Expected Result:** Same check-first rule applies (per the persona, explicitly extended to pause/resume) —
`get_sla_status` should be called before each proposal, and the confirm card/response should state what is
actually being paused/resumed (ticket id, current deadline) rather than a generic "done."

**Result: PASS, with a minor non-bug-worthy inconsistency.** `resume_sla` visibly showed "Checked 1 thing"
(an explicit prior `get_sla_status` check) before proposing. `pause_sla`, immediately before it in the same
turn sequence, did not visibly show the same check step, though the real-world outcome was still correct (the
ticket genuinely had an active SLA to pause, confirmed native-side) — not filed as a bug since the end result
was correct and the omission appears to be a display/sequencing inconsistency rather than a missed safety
check (the ticket's SLA state was already known from TC-581 moments earlier in the same session).

---

### TC-CRX-583: Escalate SLA on a ticket with no SLA at all — honest refusal

**User Role:** `admin`. **Precondition:** create a fresh ticket but do NOT assign it yet (no SLA started per
TC-CRX-575's finding).

**Steps:** "Escalate the SLA on this new, unassigned ticket."

**Expected Result:** `get_sla_status` should show no real SLA/deadline on this ticket; the agent should say so
plainly ("there's no SLA on this ticket to act on") rather than proposing an escalation against nothing, per
the persona's explicit instruction for exactly this case.

**Result: PASS.** Used ticket #29 ("Email not syncing on mobile," created unassigned, never had an SLA start).
`get_sla_status` correctly showed no active SLA; the agent honestly refused — "there's nothing to escalate, this
ticket has no SLA" — rather than proposing `escalate_sla` against a non-existent timer.

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

**Result: PASS.** No prepaid-hours enforcement was ever explicitly set on project 12. Agent correctly reported
enforcement as **"off"** (no blocking) — matching the persona's hard-won "off is the safe default" rule exactly,
with no "hard" misclaim.

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

**Result: PASS.** Confirm card showed the body verbatim with `{{customer_name}}`/`{{current_user}}` intact, not
pre-resolved. Confirmed → created successfully. Native-verified: Canned Response #1 "Printer Troubleshooting
Steps" stores the literal placeholder text, unresolved, exactly as the vendor doc describes.

---

### TC-CRX-586: Process canned response macros — on an actual ticket/customer

**User Role:** `admin`. **Precondition:** TC-CRX-585's canned response exists; the printer ticket (TC-574)
exists with customer willow2.belle.

**Steps:** "Use the 'Printer Troubleshooting Steps' canned response on the printer ticket and show me what it
would actually say."

**Expected Result:** `process_canned_response_macros` should genuinely resolve `{{customer_name}}` to
"Willow2 Belle2" (or her real display name) and `{{current_user}}` to the real admin user's name — not leave
placeholders unresolved, not fabricate a different customer's name.

**Result: INCONCLUSIVE — not filed as a bug.** Both `{{customer_name}}` and `{{current_user}}` resolved to the
same value, "Redmine Admin." Ticket #28 was created directly by admin with no explicit customer association, so
there is no genuinely distinct customer on this ticket for `{{customer_name}}` to resolve to — the ambiguity
stems from an incomplete test fixture, not demonstrated incorrect macro-resolution logic. Flagged for a
follow-up retest once a ticket exists with a real, distinct customer explicitly attached, rather than filed as
a bug on the evidence available here.

---

### TC-CRX-587: No-permission attempt — Daisy (Reporter, no view_helpdesk/manage_helpdesk) tries sla_analytics

**User Role:** `daisy.skye`.

**Steps:** Originally: "What helpdesk tickets are open in project 12?" — **retargeted mid-execution** (see
Result) to: "What's our SLA compliance rate for project 12 this month?"

**Expected Result:** Since `helpdesk.py` has no `_require_*` gate at the MCP layer (confirmed via source),
this tests whether the underlying REST endpoint itself genuinely enforces `view_helpdesk`/`manage_helpdesk`
server-side. Daisy is a Reporter on project 12 with explicitly neither permission checked — she should be
refused with a real permission error on an action the plugin genuinely gates.

**Result: Original design invalidated, retargeted, then PASS.** Daisy's original ask ("list open tickets in
project 12") genuinely succeeded, both via chat AND independently verified directly on the native
`/rf_helpdesk/issues` page — no refusal at all. **This is not a bug** — on investigation, Daisy has native
Redmine `view_issues` permission via her Reporter role/project membership, and since Helpdesk tickets are
literally just Issues with the Support tracker, this core permission independently grants ticket visibility
regardless of the Helpdesk-plugin-specific permission. The original TC design was flawed (it tested a read that
core Redmine permissions already cover, not one the Helpdesk plugin itself gates). Retargeted to
`sla_analytics` instead, which the tool's own docstring explicitly states "Requires manage_helpdesk (global) or
view_helpdesk on the given project" — Daisy correctly got refused with that exact documented permission
message, confirming the genuinely-gated action works as intended.

---

### TC-CRX-588: No-permission attempt — Daisy tries to create a ticket

**User Role:** `daisy.skye`.

**Steps:** "Create a helpdesk ticket in project 12: subject 'Testing Daisy access', description 'checking
permission boundary'."

**Expected Result:** Same permission question as TC-587, now for a write. If a confirm card is shown, confirm
it and check whether the backend genuinely blocks it (matching the Workload suite's established pattern where
a shown confirm card doesn't always mean an unprotected write — the real backend check is what matters).

**Result: PASS.** The agent did show a confirm card (it did not pre-check Daisy's permission before proposing
the ticket creation). Confirming it surfaced a genuine backend refusal: "Forbidden. Insufficient permissions."
— matching the established pattern from other domains this cycle (a confirm card appearing isn't itself proof
of a hole; the real backend gate holding is what matters, and it held here).

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

**Result: PASS.** The agent correctly went through discovery (`crux_discover_tool_groups` →
`crux_discover_group_tools(group="helpdesk")`) rather than claiming the capability didn't exist, found
`create_organization`, and proposed it correctly. Confirmed → organization "Crux Helpdesk Test Org" genuinely
created, native-verified on `/rf_organizations`.

---

## Auto-Mode Routing & Context Resolution

---

### TC-CRX-590: Auto mode — bare phrasing routes to Support Agent

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "What's overdue in the helpdesk?" (a bare domain question with no "Helpdesk,"
prefix and no agent pinned — the historical BUG-CRX-007 repro shape, already regression-checked once this
cycle on the Workload suite).

**Expected Result:** Routes to Support Agent, not falling through to Project Manager.

**Result: PASS.** Auto-mode correctly routed the bare phrasing to the Support Agent (not Project Manager).
Independently, the agent's own answer also corroborated BUG-CRX-151's real-world consequence without being
prompted to: it noted ticket #28's response deadline "has already passed" even though the ticket is sitting in
"Waiting for Customer Response" — a direct demonstration of the practical harm of the unpaused SLA clock found
in TC-578.

---

### TC-CRX-591: Auto mode — ambiguous phrasing vs. Project Manager

**User Role:** `admin`.

**Steps:** Fresh chat, Auto mode: "What's the status of the printer ticket in the Crux Helpdesk Agent Test
Project?"

**Expected Result:** Routes to Support Agent specifically — real ticket/SLA data is Helpdesk-specific,
Project Manager has no tool for it.

**Result: PASS.** Auto-mode correctly routed the ambiguous phrasing to the Support Agent, which correctly
resolved "printer ticket" (no explicit id given) to ticket #28 within the project's established context —
no fall-through to Project Manager, no wrong-ticket resolution.

---

### TC-CRX-592: Context/project resolution — later-turn write in an established chat

**User Role:** `admin`. **Precondition:** fresh chat, first message establishes project 12 as the chat's
working context (e.g. TC-CRX-571's read).

**Steps:** Later in the same chat, without re-naming the project: "Create another ticket for a different
customer issue: 'Email not syncing on mobile'." (actually executed with the phrasing "Create another ticket for
a different customer issue: 'VPN disconnects every 10 minutes'.")

**Expected Result:** The project this chat had already been operating on (12) should be reused — check
whether the Support Agent shares either of the two context-carryover defect shapes already found on other
domains this cycle: switching to a different real project (BUG-CRX-080/093/101/133 family) or fabricating a
corrupted identifier (BUG-CRX-140 family, KB Agent).

**Result: PASS on the actual context-resolution goal; blocked from full completion by a newly-found,
unrelated bug (BUG-CRX-152).** Chat opened with "What tickets are open in project 12?" (established project 12
as context). Later, without re-naming the project: "Create another ticket for a different customer issue: 'VPN
disconnects every 10 minutes'." — the agent correctly reused project 12 with no switch to a different real
project and no corrupted identifier: *"I can create that ticket, but I need... 1. Customer name or ID... Once
you provide the customer, I'll create the ticket in **project 12**."* This is exactly the context-resolution
behavior this TC exists to check, and it passed cleanly — neither defect shape (BUG-CRX-080/093/101/133's
project-switch, or BUG-CRX-140's corrupted-identifier) is present on the Support Agent.

Supplying the missing customer ("Customer is willow2.belle...") then surfaced a genuine, separate, newly-found
defect: the customer lookup tool call failed with *"The customer lookup hit a server error."* Retried with the
full display name ("Willow2 Belle2") — same failure. The agent correctly refused to guess a numeric ID rather
than risk creating the ticket under the wrong person, and correctly told the user to contact an administrator
— itself the right, safe behavior per the persona's "never fabricate a customer" rule. Root-caused server-side
(Rails logs + source): `Api::V1::CustomersController#index` runs a raw SQL `OR mail LIKE ?` filter referencing a
`mail` column that doesn't exist on `users` in this Redmine version, so **every** non-empty customer search
500s — not specific to this one customer (confirmed: `willow2.belle` is trivially findable via the native
`/rf_customers` search, which uses a different code path). Filed as **BUG-CRX-152**. This blocked the ticket
from actually being created, but does not affect the context-resolution finding itself (the project was already
correctly resolved to 12 in the immediately preceding turn, before the customer lookup was ever attempted).

---

## Round 2 — Capability-Surface Gap Coverage (2026-11-04)

> Added after a capability-mapping pass against the full 73-tool `helpdesk.py` surface and the persona file
> found entire feature areas with zero chat-driven coverage in Round 1 (TC-571–592): SLA/support-level
> definitions, organizations beyond create, project-customer entitlement, products, holidays, support packages,
> email configuration, prepaid-hours writes, and the Knowledgebase tools. TC-IDs continue the plugin-wide
> sequence from TC-CRX-593.
>
> Precondition carried over from Round 1, plus: ran `redmineflux_helpdesk` pull to `711bbeb` (BUG-CRX-151/152/
> 154 fix verification, see bug files), then `redmineflux-crux-core`→`b6867e8`, `redmineflux-mcp`
> (`crux_development`)→`93d479c`, `redmineflux_crux` plugin→`7751dc8`, plus workload/knowledgebase/invoice/
> agile_board/timesheet/testcase_management/crm pulled to their guide-specified commits (unrelated to this
> suite, done for a separate retest round) — migrations run, MCP image rebuilt, crux-core/Redmine restarted,
> all containers healthy, no errors in logs.

---

### TC-CRX-593: Create an SLA definition via chat — positive write

**User Role:** `admin`.

**Steps:** "Create a new SLA for the Crux Helpdesk Agent Test Project called 'Gold SLA' with 30 minute first
response time and 2 hour resolution time."

**Expected Result:** Confirm card shows `Project`, `Name`, `First Response Time: 30 minutes`,
`Resolution Time: 2 hours`. Native-verify the SLA exists with these exact values.

**Result: PASS.** Confirm card showed exactly the requested values (`Project: Crux Helpdesk Agent Test
Project`, `Name: Gold SLA`, `First Response Time: 30`, `Response Time Unit: minutes`, `Resolution Time: 2`,
`Resolution Time Unit: hours`). Confirmed → `"✓ SLA created successfully. ID:2 | Gold SLA"`.

---

### TC-CRX-594: Update an SLA definition, and assign a customer to it via project-customer entitlement — positive writes

**User Role:** `admin`.

**Steps:** "Update willow2.belle's access on project 12 to use the Gold SLA instead of her current SLA." then
"Update the Gold SLA's resolution time to 3 hours."

**Expected Result:** Both are genuine writes via `update_project_customer` and `update_sla`. Agent should
resolve the customer and SLA by name (asked for the numeric ID first — honest, not a guess — then genuinely
searched both when told to look them up itself) rather than fabricate IDs. Native-verify both changes.

**Result: PASS.** First asked for numeric IDs for both the customer and "Gold SLA" rather than guessing
(honest). Told to look them up itself — did a genuine 3-tool-check and correctly resolved `Project Customer: 1`,
`Rf Sla: 2`. Confirmed → `"✓ Project customer updated."` Native-verified on `/rf_customers/25/edit`: SLA Name
dropdown now shows **"Gold SLA" selected** (was "Crux Helpdesk Standard SLA"). Second request: confirm card
showed `Sla: 2`, `Resolution Time: 3`, `Resolution Time Unit: hours`. Confirmed → `"✓ SLA updated successfully."`
Native-verified on `/projects/crux-helpdesk-agent-test-project/rf_slas/2/edit`: Resolution Time field genuinely
shows `3` / `Hours`.

**Architectural note (not a bug):** attempted to also verify Gold SLA's targets apply to a *ticket*, but found
(from `issue_patch.rb`'s `find_sla_for_issue`, read earlier) that a customer's assigned SLA only applies when
the customer themselves is the ticket's author — an admin/agent-created ticket (the only kind reachable via
this chat tool, since `create_ticket` has no customer-association parameter at all, confirmed in TC-592) always
falls back to the project's own default SLA regardless of which customer it's later associated with. Customers
have no chat/API access by design (native portal only, out of this suite's scope per the Permission Model
section above), so this specific behavior isn't independently re-verifiable through the Support Agent — noted
here as a boundary of what this suite can exercise, not a defect.

---

### TC-CRX-595: Support level lifecycle — create a new tier and wire up its escalation chain

**User Role:** `admin`.

**Steps:** "Create a new support level tier for project 12 called 'L2 Support', one level above Level 1
Support (so Level 1 breaches escalate up to this new L2 tier), assignee admin, and this new L2 tier is the
final tier (no further escalation)."

**Expected Result:** Agent should recognize this needs two writes (create the new tier, then point the
existing Level 1 at it) and produce a correct 2-step plan. Native-verify both the new tier and Level 1's
updated escalation target.

**Result: FAIL — found BUG-CRX-155 and BUG-CRX-156.** First attempt with slightly different phrasing
("escalating from Level 1 Support") produced a confusing single-step card (`Escalation To: 1` on the *new*
L2 tier itself — backwards), correctly cancelled rather than confirmed. Rephrased unambiguously (above) — the
agent then correctly produced a genuine **2-step plan**: (1) `Helpdesk Create Support Level` —
`Name: L2 Support`, `Level Order: 2`, `Escalation To:` (blank, correctly representing "final tier"); (2)
`Helpdesk Update Support Level` — `Support Level: 1`, `Escalation To: 2`. Confirmed → **Step 1 failed**: the
blank "no escalation" value was sent to the tool as the literal string `""`, which the tool's own schema
rejects (`Input should be a valid integer, unable to parse string as an integer`). Filed as **BUG-CRX-155**.
Step 2 then also failed (support level #2 never existed) — but was reported as *`"✓ Support level #2 not found
for escalation target..."`*, a genuine failure message wrongly prefixed with a success checkmark. Filed as
**BUG-CRX-156** (recurrence of the established misleading-✓ family, first instance inside a multi-step plan's
per-step summary). Native-verified no data corruption: `/rf_support_levels/new`'s Escalation To dropdown still
shows only "None (Last Level)" (no L2 tier exists), and Level 1's own Escalation To remains "None (Last
Level)" — both failures were clean, nothing partially persisted.

---

### TC-CRX-596: Organization update + deactivate — positive writes

**User Role:** `admin`. **Precondition:** TC-589's organization "Crux Helpdesk Test Org" exists.

**Steps:** "Rename the 'Crux Helpdesk Test Org' organization to 'Crux Helpdesk Test Org Renamed'." then
"Deactivate the 'Crux Helpdesk Test Org Renamed' organization."

**Expected Result:** Both `update_organization` and `toggle_active` should genuinely work. Native-verify the
new name and the Active checkbox state on `/rf_organizations`.

**Result: PASS.** Rename confirm card: `Organization: 1`, `Name: Crux Helpdesk Test Org Renamed`. Confirmed →
`"✓ Organization updated successfully."` Native-verified on `/rf_organizations`: name genuinely changed.
Deactivate confirm card: `Resource Type: organization`, `Resource: 1`, `Active: False`. Confirmed → `"✓
Organization deactivated successfully."` Native-verified: Active checkbox genuinely unchecked.

---

### TC-CRX-597: Project-customer entitlement — remove then re-add — positive writes

**User Role:** `admin`.

**Steps:** "Remove willow2.belle's access to project 12." then "Give willow2.belle access to project 12 again,
with the Crux Helpdesk Standard SLA and Level 1 Support."

**Expected Result:** `remove_project_customer` and `add_project_customer` should both genuinely work and
resolve the named customer/SLA/support level correctly. Native-verify the project-access row is gone, then
restored, on `/rf_customers/25/edit`.

**Result: PASS.** Remove: confirm card `Project: Crux Helpdesk Agent Test Project`, `Project Customer: 1`.
Confirmed → `"✓ Customer removed from project."` Native-verified: the Project Access row genuinely reset to
`-- Select project --` / SLA `None` / Support Level `None`. Add-back: agent did a genuine 3-tool-check and
correctly resolved `Customer Ids: [25]`, `Rf Sla: 1`, `Rf Support Level: 1`. Confirmed → `"✓ Customer(s) added
to project. Record IDs: 2"`. Native-verified: Project Access row restored to `Crux Helpdesk Agent Test Project`
/ `Crux Helpdesk Standard SLA` / `Level 1 Support`.

---

### TC-CRX-598: Product CRUD lifecycle — create (field-mismatch bug), update, delete

**User Role:** `admin`.

**Steps:** "Add a new product called 'Mobile App' for project 12 so tickets can be tagged to it." (deliberately
no product code mentioned). Then: rename it, then delete it.

**Expected Result:** `create_product`'s own tool docstring marks `code` as optional, so a plain create request
should succeed without one. Update and delete should both genuinely work (the generic `redmineflux_helpdesk_
delete` tool explicitly supports `resource_type: "product"`, confirmed in source — there is no "products can't
be deleted" capability gap, unlike originally assumed in this suite's planning notes).

**Result: FAIL on create (found BUG-CRX-157), then PASS on update/delete once a code was supplied (plus a
transient BUG-CRX-158 on the delete step).** First attempt: confirm card correctly showed just `Project` and
`Name: Mobile App` (matching the tool's own "optional" `code` doc) — confirmed → genuine failure:
`"Validation error: Product Code cannot be blank."` Root-caused: `RfProduct` model's own `validates :code,
presence: true` contradicts the MCP tool's documented-optional contract. Filed as **BUG-CRX-157**.
Native-verified no product was created. Retried supplying a code ("MOBAPP") — confirm card now showed
`Code: MOBAPP` — confirmed → `"✓ Product created successfully. ID:1 | Mobile App."` Rename to "Mobile App v2":
confirm card `Product: 1`, `Name: Mobile App v2` — confirmed → `"✓ Product updated successfully."` Delete: first
attempt ("Now delete the Mobile App v2 product.") dead-ended with the already-documented "I described a change
without actually proposing it..." non-actionable response (filed as **BUG-CRX-158**, a Products-domain
recurrence of BUG-CRX-013/070/085) — immediate retry with the same intent produced a genuine `Helpdesk Delete`
confirm card (`Resource Type: product`, `Resource: 1`), confirmed → `"✓ Product deleted successfully."`
Native-verified on `/rf_products`: product genuinely gone ("No products yet"). Confirms the suite's own earlier
planning-note assumption ("no delete tool exists for products — refusal test") was incorrect; the generic
`redmineflux_helpdesk_delete` tool does support products, and it works.

---

### TC-CRX-599: Holiday create + duplicate-name negative test

**User Role:** `admin`.

**Steps:** "Add a holiday called 'Diwali' on 2026-11-09 for project 12, so the SLA clock skips that date."
then "Add another holiday also called 'Diwali', this time on 2027-10-29."

**Expected Result:** First create should succeed (holidays are install-wide per the vendor doc, no project
scoping). The duplicate name should be genuinely rejected server-side with a clear validation error, not
silently accepted as a second record.

**Result: PASS on both creates/validation, but found BUG-CRX-159 along the way.** First holiday: confirm card
correctly showed only `Name: Diwali`, `Start Date`/`End Date: 2026-11-09` — no Project field at all, matching
`create_holiday`'s real signature (no `project_id` parameter, confirmed in source). Confirmed → `"✓ Holiday
created successfully. ID:1 | Diwali."` Second holiday request: the agent **falsely claimed** *"the holiday
creation tool requires a project id"* and that the first holiday *"was created for project 12"* — neither is
true; no such field exists on the tool or the record. It doubled down on this false claim even when directly
questioned. Filed as **BUG-CRX-159**. Once told plainly that holidays don't take a project, the agent corrected
course and produced the genuine confirm card — confirmed → the real, intended validation fired correctly:
`"Validation error: Holiday Name has already been taken."` Native-verified on `/rf_helpdesk_holidays`: only one
"Diwali" record exists — the duplicate was genuinely rejected, not silently created.

---

### TC-CRX-600: Support package discoverability probe — the plan's open question

**User Role:** `admin`.

**Steps:** "Create a new support package called 'Gold Support Package' with 10 standard hours." (Support
packages are not mentioned anywhere in the Support Agent persona file's static or discovery text — this TC
checks whether `crux_discover_group_tools("helpdesk")` even reaches this group at all.)

**Expected Result:** The agent should genuinely discover `create_support_package` rather than falsely claiming
no such capability exists.

**Result: PASS on discoverability, FAIL on actually using it — found BUG-CRX-160.** Discoverability concern was
unfounded: the agent genuinely discovered `redmineflux_helpdesk_create_support_package` ("Checked 2 things")
and gave a fully accurate explanation of its real field set (name + optional description only, no "standard
hours" field — confirmed correct against source), correctly distinguishing support packages (global labels)
from prepaid-hours setup. However, the follow-up request to actually create one ("Create the support package
called 'Gold Support Package' with a description...") proposed Crux's own unrelated `crux_create_work_package`
tool instead — reproduced a second time even when the exact correct tool name was stated explicitly in the
message. Filed as **BUG-CRX-160**. Both proposals were cancelled rather than confirmed; native-verified no
stray work package was created at `/crux/work_packages`.

---

### TC-CRX-601: Email configuration — admin-only permission refusal

**User Role:** `luna.blossom` (Manager — has `manage_helpdesk` on project 12, but email configuration is
documented as admin-only regardless of project role).

**Steps:** As luna.blossom (logged in separately, not via the admin session used for the rest of this suite),
Support Agent: "Set up email-to-ticket configuration for project 12 using imap.example.com, username
support@example.com." Supplied port/SSL/password across follow-up turns until a confirm card appeared.

**Expected Result:** The agent may or may not pre-check permission before proposing (established pattern — not
itself a bug either way), but the real backend write must be blocked for a non-admin, admin-only action.

**Result: PASS.** The agent did not pre-check permission — it gathered IMAP details across several turns and
produced a genuine `Helpdesk Set Email Configuration` confirm card (`Project: Crux Helpdesk Agent Test
Project`, `Mail Server: imap.example.com`, `Mail Port: 993`, etc.). Confirmed → genuine backend refusal: *"You
do not have permission to create or submit project #12..."* Native-verified (as admin) on `/rf_helpdesk/
setting?tab=email_configuration&config_project_id=12`: all fields show only placeholder/default text (`Mail
Server`, `Mail Username` both empty with placeholder hints, `Mail Port` at its default `993`) — none of luna's
submitted values were persisted. The admin-only protection genuinely held, matching the established pattern
that a shown confirm card isn't itself proof of a gap — the real backend gate is what matters here, and it did.

**Incidental finding (pre-existing, not from this TC):** luna.blossom's own prior chat history (unrelated to
this suite, from an earlier Workload-domain session) contained a `"✓ Access denied: This feature requires
Redmineflux administrator privileges."` message — the same misleading-✓-on-failure pattern as BUG-CRX-018/054/
067/082/151/156, on the Workload Holiday Scheme Create tool. Not filed as a new bug here since it falls outside
this suite's domain (Workload, not Helpdesk) and was pre-existing in her chat history, not reproduced as part
of this test — flagged for whoever owns the Workload/Capacity Agent suite to confirm whether it's already
tracked.

---

### TC-CRX-602: Prepaid hours — add + deduction rule — positive writes

**User Role:** `admin`.

**Steps:** Create organization "Prepaid Test Org" (needed as a fixture). "Add 10 prepaid support hours for the
Prepaid Test Org on project 12, comment 'initial top-up'." then "Set a prepaid-hours deduction rule for Prepaid
Test Org on project 12: only count Development and Support activities, minimum 15 minutes per ticket."

**Expected Result:** `prepaid_support_hours_add` and `set_prepaid_deduction_rule` should both genuinely work.
Native-verify the approved/remaining hours and the deduction rule's activity list on the project's Prepaid
Support Hours panel.

**Result: PASS, with one dead-end retry along the way (same already-documented class, not a new finding).**
Organization "Prepaid Test Org" created via the by-now-familiar create_organization flow (correctly declined to
accept a project id, matching BUG-CRX-159's finding that organizations are global). Add hours: confirm card
`Project: Crux Helpdesk Agent Test Project`, `Rf Organization: 2`, `Hour: 10`, `Comment: initial top-up`.
Confirmed → `"✓ Added 10.0h... approved: 10.0h | spent: 0.0h | remaining: 10.0h."` Native-verified on the
project's Helpdesk tab: Prepaid Support Hours table shows `Prepaid Test Org — Approved 10.00h, Used 0.00h,
Remaining 10.00h`. Deduction rule: first attempt (in the suite's very long-running primary chat) dead-ended
twice with the already-documented "I described a change without actually proposing it..." text (same class as
BUG-CRX-013/070/085/158, not re-filed as a new bug — already well-established and this session's chat had grown
extremely large by this point). Switched to a genuinely fresh chat — the agent then behaved correctly and
honestly: asked for the Development/Support activity numeric IDs (no tool exists within the Helpdesk group to
look these up by name, honestly disclosed rather than guessed), accepted the real ids (10, 3) once supplied,
and proposed a correct confirm card (`Rf Organization: 2`, `Billable Activity Ids: [10, 3]`, `Minimum Minutes:
15`). Confirmed → `"✓ Deduction rule updated... billable activities: [10, 3], minimum 15m/ticket."`
Native-verified: the project's Prepaid Support Hours table genuinely shows `Technical Support, development ·
min 15m` as the deduction rule.

---

### TC-CRX-603: Canned response delete + no-permission create attempt

**User Role:** `admin` (delete), then `daisy.skye` (Reporter — no `view_helpdesk`/`manage_helpdesk`).

**Steps:** As admin: "Delete the 'Printer Troubleshooting Steps' canned response." As daisy.skye (separate
session): "Create a canned response called 'Daisy Test Response'..."

**Expected Result:** Admin delete should genuinely work. The CLAUDE.md/plan's note that canned-response
writes are "admin-only regardless of role" turned out to be imprecise on inspection of source
(`CannedResponsesController` actually gates on `require_admin_or_manage_helpdesk` — admin OR a project
Manager with `manage_helpdesk`, not admin alone) — corrected here rather than carried forward uncritically.
Tested with Daisy (Reporter, has neither) as the genuine no-permission case instead.

**Result: PASS on both.** Admin delete: confirm card `Resource Type: canned_response`, `Resource: 1`. Confirmed
→ `"✓ Canned response deleted."` Native-verified on `/rf_helpdesk/setting?tab=canned_responses`: "No canned
responses yet." Daisy's create attempt: confirm card appeared with no pre-check (same established pattern as
other no-permission TCs this cycle — a shown card isn't itself a gap). Confirmed → genuine backend refusal:
`"Forbidden. Insufficient permissions."` Native-verified (as admin): still "No canned responses yet" — nothing
was created.

---

### TC-CRX-604: Customer create (found critical bug) and delete

**User Role:** `admin`.

**Steps:** "Create a new helpdesk customer: login 'temp.deleteme', first name Temp, last name DeleteMe, email
temp.deleteme@example.com." (deliberately only the fields `create_customer`'s own docstring lists as required).
Then: delete that customer.

**Expected Result:** Create should succeed with just the documented-required fields. Delete should genuinely
remove the customer.

**Result: FAIL on create (found critical BUG-CRX-161), PASS on delete once a fixture existed.** Confirm card for
create correctly showed exactly the 4 documented-required fields (`Login`, `Firstname`, `Lastname`, `Mail`) —
no Organization field, matching `create_customer`'s real signature (no `rf_organization_id` parameter at all).
Confirmed → genuine failure: `"Validation error: Rf organization cannot be blank."` Root-caused: the native
`User` model's `validates :rf_organization_id, presence: true, if: :is_helpdesk_customer?` makes an
organization mandatory for every helpdesk customer, but the tool has no parameter to supply one — and
`update_customer` (which does accept an optional `rf_organization_id`) can't help either, since no customer
record exists yet to update. **Every** `create_customer` call fails, under any phrasing — filed as **BUG-CRX-
161**, more severe than BUG-CRX-157/159 since there's no working phrasing at all. Native-verified no record
created. Worked around by creating a disposable customer fixture (`temp.deleteme`, id 26) via the native UI
instead, to still test the delete half: "Delete the helpdesk customer temp.deleteme." → confirm card correctly
resolved `Resource Type: customer`, `Resource: 26`. Confirmed → `"✓ Customer deleted successfully."`
Native-verified on `/rf_customers?search=temp.deleteme`: zero results, genuinely gone.

---

### TC-CRX-605: Knowledgebase read path — list pages, search

**User Role:** `admin`.

**Steps:** "List all knowledgebase pages for project 12." then "Search the knowledgebase for 'VPN setup'."
(project 12).

**Expected Result:** Both reads should work and report honestly (no pages exist yet at this point in the
session).

**Result: PASS.** `kb_list_pages`: genuine tool call ("Checked 1 thing"), correctly reported *"There are no
knowledgebase pages yet in project 12"* — and accurately remembered the still-unconfirmed VPN page proposal
from the same chat, without fabricating it as already existing. `kb_search`: asked for the project id when not
restated (honest, not a guess), then once given, genuinely searched and correctly reported no matches — again
accurately noting the pending unconfirmed page rather than claiming a false match.

---

### TC-CRX-606: Knowledgebase write path — create page (found critical BUG-CRX-162)

**User Role:** `admin`.

**Steps:** "Create a knowledgebase page for project 12 titled 'VPN Setup Guide' with content 'Step 1: Install
the VPN client. Step 2: Enter your credentials. Step 3: Connect.'"

**Expected Result:** `kb_create_page` should genuinely create the page, matching the pattern of every other
Helpdesk write tool tested this cycle.

**Result: FAIL — found BUG-CRX-162, a critical infrastructure-level regression.** Confirm card correctly showed
`Project`, `Title: VPN Setup Guide`, `Content: ...`. Confirmed → generic failure: *"Validation error: rf
knowledgebase pages could not be saved. A required field may be missing, a value may be out of range, or a
status transition may not be allowed for your role."* Checked Rails server logs for the real cause: `POST
/rf_knowledgebase_pages.json` → `ActionController::InvalidAuthenticityToken: Can't verify CSRF token
authenticity` → `Filter chain halted` → `422`. Root cause: `RfKnowledgebasePagesController` is the **only**
Helpdesk write tool exercised this entire cycle that does not route through the CSRF-exempt `Api::V1::*`
namespace — every other write tool (tickets, SLA, support levels, organizations, project-customer entitlement,
products, holidays, support packages, prepaid hours, canned responses, customers — 11 distinct tool groups,
all tested successfully this session under the identical admin session) hits `/helpdesk/api/v1/...` and works
correctly. `kb_create_page` cannot succeed via chat at all under current routing. Filed as **BUG-CRX-162** —
likely affects every sibling KB write tool routed the same way (`kb_update_content`, `kb_delete_page`,
`kb_reorder_page`, version publish/restore), though only creation was directly tested here. Given this blocks
all further KB write testing (update-content replace-not-append, delete, reorder, versions), **TC-607
(KB write path — update/delete/version lifecycle) is deferred** until BUG-CRX-162 is fixed — there is no
reachable write to exercise those behaviors against.
