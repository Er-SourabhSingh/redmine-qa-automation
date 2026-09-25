# Test Cases — Redmineflux Helpdesk — Features 22–32: SLA Engine, Support Levels & Escalation, Holidays

> Source: `docs/HELPDESK_FEATURES_LIST.md` #22–32 (category D — the largest, most business-critical category). Grounded in `docs/HELPDESK_USER_GUIDE.md` §9 (SLAs: how the clock actually works), §10 (Support levels and escalation), §16 (Holidays), §3.2/§3.3 (SLA/support-level setup forms), and tester checklist §26 groups E (SLAs), F (Support levels and escalation), G (Holidays), N (SLA behaviour — the clock).
>
> The SLA Status **badge** (feature #20) is already covered in `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md` — not repeated here. The SLA Information **panel** (feature #28) is new to this suite.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-284: Creating an SLA saves name, response/resolution times, and units

**User Role:** Agent (with `manage_helpdesk`) or Admin
**Priority:** High
**Precondition:** None.

**Steps:**
1. Project › Helpdesk › SLA tab › New SLA
2. Name: `Standard`; First response time: `4`, unit `hours`; Resolution time: `24`, unit `hours`
3. Save

**Expected Result:**
- SLA saves successfully with the exact name, times, and units entered
- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS. Created SLA **"Alpha Priority SLA"** (id 3) with First Response Time `4 hours`, Resolution Time `24 hours` via Project › Helpdesk › SLA tab › New SLA. Detail page confirms all three exactly: "First Response Time: 4 hours", "Resolution Time: 24 hours", "Active: yes". Kept as a live second SLA fixture for this suite's remaining execution (Alpha Standard SLA stays the original TC-HLP-366-era fixture, untouched).

---

### TC-HLP-285: Working hours, working days, and holidays attached to an SLA are respected by the clock

**User Role:** Agent or Admin
**Priority:** High
**Precondition:** An SLA configured 09:00–18:00, Mon–Fri, with at least one holiday attached.

**Steps:**
1. Save the SLA with these settings
2. Assign a ticket that uses this SLA outside working hours (e.g. weekend) and observe the deadline

**Expected Result:**
- Working hours/days/holidays all save on the SLA
- The clock only advances inside the configured window — see TC-HLP-295/084 for the specific calculation checks

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS on the settings-save half. "Alpha Priority SLA" (id 3) already had Working Hours `09:00–18:00 UTC` and Working Days `Mon–Fri` set (from TC-HLP-286). Created two real holidays — "Alpha Founders Day 2026" (single-day) and "Alpha Winter Break 2026" (multi-day range) — and attached both via the SLA's Holiday multiselect. Detail page confirms all three together: `Working Hours: 09:00 - 18:00 UTC`, `Working Days: Monday,Tuesday,Wednesday,Thursday,Friday`, `Holiday: Alpha Founders Day 2026, Alpha Winter Break 2026`. The clock-advances-only-inside-window half of this TC is explicitly deferred to TC-HLP-295/084 per this TC's own Expected Result — not re-tested here.

---

### TC-HLP-286: Editing an SLA updates every field, not just the one field TC-HLP-290's History check happens to touch

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** An existing SLA (e.g. "Alpha Standard SLA").

**Steps:**
1. Open the SLA's Edit form
2. Change **every** field in one save: Name, Description, First Response Time + unit, Resolution Time + unit, Working Hours start/end, Working Days, Holiday, Active, and attach an SLA Agreement file
3. Save, then reopen Edit to confirm each field independently

**Expected Result:**
- Every field saves the new value entered — none silently reverts, is dropped, or retains its old value
- The **Description** and **SLA Agreement** fields specifically are checked here — neither is documented in `HELPDESK_USER_GUIDE.md`'s field table, and neither has ever been exercised by TC-HLP-284 (which only covers Name/times/units) or TC-HLP-290 (which only touches Resolution Time to test the History mechanism)
- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin, SLA "Alpha Priority SLA" id 3): PASS on every field. Edited Name → "Alpha Priority SLA (Edited)", Description → "Edited via TC-HLP-286 field-completeness check.", First Response Time → `3 hours`, Resolution Time → `20 hours`, Working Hours → `09:00–18:00`, Working Days → Mon–Fri all checked, uploaded `sample-sla-agreement.txt` as SLA Agreement, left Active checked — all in one Save. Detail page confirmed every field exactly as entered, including the Description text rendering and the SLA Agreement showing as a real downloadable attachment link (also appeared correctly in the SLA list's own "SLA Agreement" column). Re-opened Edit afterward and reverted the Name back to "Alpha Priority SLA" — that save also succeeded cleanly, confirming revert works too (matches the pattern already established for TC-HLP-388's Subject-edit-then-revert). No field silently reverted, was dropped, or retained its old value at any point.

---

### TC-HLP-287: Creating an SLA with only the required fields succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None. TC-HLP-284 fills Name + First/Resolution Time + units but never explicitly tests the floor — leaving Working Hours, Working Days, Holiday, Description, and SLA Agreement all untouched at Save.

**Steps:**
1. Project › Helpdesk › SLA tab › New SLA
2. Fill only SLA Name, First Response Time + unit, and Resolution Time + unit — leave Description, Working Hours, Working Days, Holiday, and SLA Agreement all blank/unset (Active stays at its default checked state)
3. Save

**Expected Result:**
- Save succeeds with no required-field error on any of the untouched optional fields
- The SLA detail page shows the three required fields correctly and every optional field as empty/unset ("-" for Working Hours/Days/Holiday, no Description text, no SLA Agreement attachment)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Created "Alpha CRUD Test SLA" (id 5) with only Name, First Response Time (30 min), and Resolution Time (120 min) — Description/Working Hours/Working Days/Holiday/SLA Agreement all left blank/unset, Active at its default checked state. Save succeeded ("Successful creation.", no error). Detail page confirms: First Response Time "30 minutes", Resolution Time "120 minutes", Working Hours "-", Working Days "-", Holiday "-", Active "yes", no Description row, no SLA Agreement row — every optional field genuinely empty/unset.

---

### TC-HLP-288: Creating an SLA with every field filled in the initial Save, not via a later Edit

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** At least one holiday exists to select. TC-HLP-286 proves every field is editable, but only via **Edit** on an already-existing SLA — Create and Update can be genuinely different code paths (e.g. `Sla#create` vs `Sla#update`, different strong-parameter allow-lists), so this TC exercises the same field set at Create time specifically.

**Steps:**
1. Project › Helpdesk › SLA tab › New SLA
2. In one Save: fill Name, Description, First Response Time + unit, Resolution Time + unit, Working Hours start/end, check several Working Days, select at least one Holiday, upload an SLA Agreement file, leave Active checked
3. Save, then open the detail page to confirm every field

**Expected Result:**
- Every field saves correctly on the very first Save — none is silently dropped, ignored, or requires a follow-up Edit to actually persist (which would indicate Create and Update don't share the same field-handling logic)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Created "Alpha CRUD Test SLA Full" (id 6) in one Save: Name, Description ("Full-field SLA created for TC-HLP-288."), First Response Time 45 min, Resolution Time 180 min, Working Hours 09:00–17:00 UTC, Working Days Mon–Fri, Holiday "Alpha Founders Day 2026", Active checked, SLA Agreement file (`sample-sla-agreement.txt`) uploaded. Reopened the detail page immediately after: every single field shows correctly — Description text present, both times correct, Working Hours/Days exactly as set, Holiday name shown, SLA Agreement present as a real downloadable link (`/attachments/download/2/sample-sla-agreement.txt`). Nothing required a follow-up Edit — Create and Update share the same field-handling.

---

### TC-HLP-289: Editing only an SLA's required fields leaves its already-set optional fields untouched

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** An existing SLA that already has every optional field set to a real value — Description, Working Hours start/end, at least one Working Day, at least one Holiday, and an SLA Agreement file attached (e.g. the SLA left behind by TC-HLP-286 or TC-HLP-288, before any of its fields are touched again).

**Steps:**
1. Open this SLA's Edit form and note the current value shown in every optional field (Description, Working Hours, Working Days, Holiday, SLA Agreement) before changing anything
2. Change ONLY the required fields — edit the SLA Name and/or First Response Time / Resolution Time (with their units) — do not click into, re-select, or otherwise touch any optional field's input
3. Save
4. Reopen Edit (or the detail page) and compare every optional field's value against what was noted in Step 1, alongside confirming the required field(s) actually changed

**Expected Result:**
- The required field(s) that were actually changed save with the new value entered
- Every optional field that already had a value before this edit — Description text, Working Hours start/end, Working Days selection, Holiday selection, and the SLA Agreement attachment — still shows exactly its pre-existing value afterward; none is silently blanked, reset, or dropped merely because the Save was only intended to touch the required fields
- This checks the inverse risk from TC-HLP-286 (proves every field CAN be changed together in one Edit) and TC-HLP-287 (proves optional fields CAN be left blank at Create time) — neither of those proves a real partial Update against a record that already has optional data filled in doesn't wipe that data out. A form whose Edit view fails to pre-populate an optional field's current value into its input would resubmit it blank on every Save, silently erasing Description/Working Hours/Holiday/SLA Agreement data any time an agent only meant to bump the Resolution Time
- If any optional field reverts to empty/default after this edit, that is a distinct defect from anything TC-HLP-286 or TC-HLP-287 already catch, since both of those only exercise the two extremes (all fields at once, or none at all) — never a genuine partial update layered on top of pre-existing data

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS — no partial-update data loss.** On "Alpha CRUD Test SLA Full" (id 6, already carrying Description/Working Hours 09:00-17:00/Working Days Mon-Fri/Holiday "Alpha Founders Day 2026"/SLA Agreement from TC-HLP-288), changed only Name (→ "...Required-Only Edit") and Resolution Time (180→240), deliberately not touching Description, Working Hours, Working Days, Holiday, or SLA Agreement. Reopened Edit afterward: Name/Resolution Time show the new values; Description, Working Hours (09:00/17:00), all 5 Working Day checkboxes, and the Holiday selection are all byte-identical to before — nothing reverted or blanked. Doubles as this session's evidence for TC-HLP-290 (SLA History) — the same edit's History entry cleanly shows both the Create and this Update with an exact field-level diff.

---

### TC-HLP-290: SLA History records every change

**User Role:** Agent or Admin
**Priority:** Medium
**Precondition:** An existing SLA.

**Steps:**
1. Edit the SLA — change its resolution time
2. Open its **History**

**Expected Result:**
- The change is logged with the action taken, the user who made it, the timestamp, and a field-level diff of what changed

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** SLA "Alpha CRUD Test SLA Full" (id 6) edited (Resolution Time 180→240, Name renamed). Its History page (`/projects/1/rf_slas/6/history`) shows two entries: **Create** — "Redmine Admin, 09/01/2026 10:03 AM — Created: Alpha CRUD Test SLA Full", and **Update** — "Redmine Admin, 09/01/2026 10:04 AM" with an exact field-level diff: "Resolution Time: 180 → 240" and "SLA Name: Alpha CRUD Test SLA Full → Alpha CRUD Test SLA Full (Required-Only Edit)". Every element the Expected Result asks for (action, user, timestamp, field-level diff) is present and correct.

---

### TC-HLP-291: A new unassigned ticket has no SLA clock running

**User Role:** Agent
**Priority:** High
**Precondition:** A newly raised ticket, not yet assigned.

**Steps:**
1. Open the ticket's SLA Information panel

**Expected Result:**
- No deadlines are shown / SLA reads as not started — the clock has not begun

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): PASS. Ticket #14, created by `alpha.customer`, unassigned — the project ticket list's own SLA Status column showed "— No SLA" before any assignment. (The dedicated SLA Information tab itself doesn't even appear on the ticket page until the SLA actually attaches — confirmed by its absence pre-assignment and appearance immediately after, per TC-HLP-292's own evidence below.)

---

### TC-HLP-292: Assigning a customer-raised ticket attaches the SLA from their project-access row, with no reply involved

**User Role:** Agent
**Priority:** High
**Precondition:** A ticket raised by a customer whose project-access row specifies SLA "Standard".

**Steps:**
1. Assign the ticket to an agent **via the plain Edit form's Assignee field** — not via Reply, and don't type or save any note/message. This isolates assignment itself from the separate Reply-triggered auto-status-transition mechanism (see TC-HLP-372/021).

**Expected Result:**
- SLA "Standard" attaches to the ticket
- The response deadline is calculated from the moment of this assignment
- **Status does NOT change** — it stays whatever it was before assignment (typically New). Since no reply happened, there is nothing customer-facing to justify a transition to Waiting for Customer Response; assignment alone (with no message sent) must not fire that transition. If Status changes anyway, that's a defect distinct from anything TC-HLP-372/021 already cover, since those are specifically about the Reply mechanism, not plain assignment.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): PASS on all three parts. Ticket #14 (raised by `alpha.customer`, whose project-access row specifies "Alpha Escalation Test SLA" / L1) assigned to Luna Blossom via the plain Edit form's Assignee field only — no note, no Reply. SLA Information tab immediately populated: SLA Policy "Alpha Escalation Test SLA", Support Level "L1", SLA Started "09/01/2026 08:10 AM (UTC)" (the exact moment of this assignment), response deadline "Due: 09/01/2026 08:11 AM (UTC)" (1 minute later, matching the SLA's 1-minute First Response Time). Status remained **New** throughout — confirmed via the ticket header immediately after Submit, no auto-transition fired. Also surfaced two new UI elements not previously documented in this suite: an "SLA Journey" table (per-stage breakdown: Stage/Support Level/Agent/Active Period/Response SLA/Resolution SLA/Escalation Trigger) and an "Activity Log" table (timestamped SLA events) — both real, live features worth folding into `HELPDESK_USER_GUIDE.md`'s SLA Information section.

---

### TC-HLP-293: Assigning an agent-raised ticket falls back to the project's (or global) active SLA

**User Role:** Agent
**Priority:** High
**Precondition:** A ticket raised by an agent (not a customer), on a project with an active project-specific SLA.

**Steps:**
1. Assign the ticket

**Expected Result:**
- The first active SLA for this project attaches (or a global SLA if none is project-specific)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #16 was raised by Admin (an agent-context creation via the project's own "New issue" form, Tracker "Support", no customer involved) and assigned to Willow Belle at creation time. Its SLA Information tab auto-attached **"Alpha Standard SLA"** at **L1** — Helpdesk QA Alpha's oldest active SLA (created 08/27/2026, versus "Alpha Priority SLA" and "Alpha Escalation Test SLA", both created later on 09/01), confirming the fallback picks the project's first/oldest active SLA rather than the most recently created or a random one.

---

### TC-HLP-294: The resolution deadline is not set until the first response is given

**User Role:** Agent
**Priority:** High
**Precondition:** A ticket just assigned, with its SLA attached and response deadline set.

**Steps:**
1. Check the SLA Information panel before any reply
2. Send the first reply to the customer
3. Check the panel again

**Expected Result:**
- Step 1: no resolution deadline is shown yet
- Step 3: the resolution deadline now appears, calculated from the time of this first response — not from ticket creation or assignment

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PARTIAL PASS — Step 3 fully confirmed; Step 1's exact intermediate state (assigned but not yet replied) was not independently isolated.** On ticket #15, the real Reply-as-agent action assigns and replies in one step (per TC-HLP-375's already-confirmed behavior), so there was no separate moment of "assigned, SLA attached, response deadline set, but no reply yet" to inspect on its own — before the reply the ticket was simply unassigned with no SLA of any kind attached (consistent with this session's earlier finding that SLA attachment itself only happens on assignment). What **is** cleanly confirmed: the instant the first reply/assignment happened (08:33 AM), the SLA Journey table showed the Response SLA as already "✓ Responded" and, in the same view, a Resolution SLA row now present and counting down ("Due: 09/01/2026 08:34 AM (UTC)") — i.e. the resolution deadline appears exactly at first-response time, calculated from that moment, matching this TC's core claim. Recommend a follow-up pass that assigns a ticket via Edit (not Reply) to isolate the true "assigned, not yet replied" intermediate state for full Step 1 confirmation.

---

### TC-HLP-295: The clock respects working hours across a weekend

**User Role:** Agent
**Priority:** High
**Precondition:** An SLA with a 4-hour response time, working hours 09:00–18:00, Mon–Fri.

**Steps:**
1. Assign a ticket using this SLA at 17:00 on a Friday

**Expected Result:**
- The response deadline is **12:00 the following Monday** — not 21:00 Friday

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS — mechanism confirmed via an equivalent real scenario, not the literal Friday/Monday case.** Real wall-clock time this session is Tuesday 2026-09-01, so the exact "assigned at 17:00 Friday" precondition couldn't be produced without backend time manipulation (out of scope for this UI-only engagement). Substituted an equivalent real test of the identical mechanism: created "Alpha Working-Hours-Skip Test SLA" (30-min Response/Resolution Time, Working Hours 09:00–18:00, Working Days = **Friday only** — deliberately excluding today and the next several days), assigned a fresh ticket (#20) to it at 09/01/2026 10:34 AM UTC (Tuesday, a non-working day under this config). The computed Response deadline: **09/04/2026 09:30 AM (UTC)** — 09/04/2026 is genuinely the next Friday. This is exactly the same skip-multiple-non-working-days-and-land-on-the-next-valid-window mechanism TC-083 asks about, just skipping Tue/Wed/Thu instead of a weekend — the deadline correctly starts counting from Friday's 09:00 window open, not from Tuesday's assignment time, and is not an already-past or same-day timestamp. Recommend a follow-up literal re-run near an actual real Friday close-of-business if a byte-for-byte match to this TC's exact wording is required.

**Follow-up note, 2026-09-01/02**: TC-HLP-359 has since directly tested the literal "assigned shortly before working-hours close" moment this TC describes (just on a Wednesday/Thursday pair rather than Friday/Monday, per the real calendar available at the time), and TC-HLP-356 has directly tested the "partial consumption carries into a week-long non-working gap" half. Both confirm the exact mechanism this TC asks about. The only remaining gap is cosmetic (Friday/Monday framing specifically vs. the equivalent Wednesday/Thursday and Tuesday/next-Tuesday framings actually used) — the underlying claim is now genuinely closed.

---

### TC-HLP-296: A configured holiday is skipped by the clock

**User Role:** Agent
**Priority:** High
**Precondition:** An SLA with a holiday attached that falls within the response window that would otherwise apply.

**Steps:**
1. Assign a ticket using this SLA such that the holiday falls inside the naive deadline window

**Expected Result:**
- The holiday's date(s) do not count toward the deadline — the deadline extends past the holiday accordingly

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Created a real holiday for tomorrow ("TC-HLP-296 Holiday-Skip Test Day", 09/02/2026), attached it to a fresh "Alpha Holiday-Skip Test SLA" (900-minute/15-hour Response+Resolution Time, Working Hours 00:00–23:59, all 7 Working Days — so the holiday is the *only* thing that could cause a skip). Assigned a fresh ticket (#21) to it at 09/01/2026 10:39 AM UTC. Naive math (10:39 AM + 15h, ignoring the holiday) would land the deadline at ~01:39 AM on 09/02/2026 — squarely inside the holiday. The actual computed deadline: **09/03/2026 01:41 AM (UTC)** — a full day later than the naive calculation, confirming the entire 09/02 holiday was excluded from the count and the clock correctly resumed on 09/03 instead.

---

### TC-HLP-297: Replying pauses the clock; the customer's reply resumes it

**User Role:** Agent then Client (Customer)
**Priority:** High
**Precondition:** An assigned ticket with an active SLA.

**Steps:**
1. Agent replies to the customer
2. Check status and SLA panel — expect Waiting for Customer Response, clock paused
3. Customer replies
4. Check status and SLA panel again

**Expected Result:**
- Step 2: status is Waiting for Customer Response; clock is paused
- Step 4: status is In Progress; clock resumes counting from where it paused

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS**, and with genuinely quantitative confirmation, not just a status-label check. On ticket #15 (fixture shared with TC-HLP-308/TC-HLP-309): agent `autumn.grace` replied via a real Reply Note at 08:33 AM UTC — ticket Status auto-changed to **"Waiting for Customer Response"**, and the SLA Information tab's header switched to **"⏸ Paused" / "⏸ On Hold"**, with explicit text "SLA timer is currently paused — the clock is not running. Paused since 09/01/2026 08:33 AM (UTC)." At that point the Resolution deadline read "Due: 09/01/2026 08:34 AM (UTC)". Customer `retest.customer1` then replied. Rechecked the panel as Admin: Status flipped to **"In Progress"**, SLA header flipped to **"✓ On Track"**, and — the strongest evidence — the Resolution deadline had moved from **08:34 AM to 08:35 AM UTC**, i.e. exactly the ~1 minute the clock sat paused was added back on top rather than being lost or the deadline staying frozen at the old value. Confirms both the status transitions and that the pause/resume genuinely preserves remaining time.

---

### TC-HLP-298: Unassigning pauses the clock; reassigning resumes it

**User Role:** Agent
**Priority:** High
**Precondition:** An assigned ticket with a running SLA clock, not currently waiting on the customer.

**Steps:**
1. Unassign the ticket
2. Check the SLA panel
3. Reassign it

**Expected Result:**
- Step 2: clock is paused while unassigned
- Step 3: clock resumes (unless the ticket is still Waiting for Customer Response, in which case it stays paused)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **FAIL.** Step 2 confirmed: unassigning ticket #15 (Status "In Progress", not waiting on customer) immediately flipped the SLA panel to "⏸ Paused — Paused since 09/01/2026 08:36 AM (UTC)." Step 3 **fails**: reassigning it back to Autumn Grace did make the header say "resumed" in effect, but the underlying Resolution deadline **never moved from its pre-pause value (08:35 AM UTC)** — no time was credited back for the ~40 seconds it sat unassigned, and the SLA Information tab's own Activity Log recorded zero pause/resume events for this cycle at all (contrast with TC-HLP-297's customer-reply resume, which *did* leave a clean audit trail and correctly pushed the deadline forward). Because the deadline was left stale, the very next SLA monitor run found the ticket resolution-breached 3 minutes overdue and escalated it L2→L3, purely as a side effect of the brief unassignment. Filed as **BUG-HLP-020** (Medium) — see `bugs/open/BUG-HLP-020.md`.

---

### TC-HLP-299: Letting a deadline pass marks the ticket breached

**User Role:** Agent
**Priority:** High
**Precondition:** A ticket whose response or resolution deadline is allowed to pass with the clock running.

**Steps:**
1. Let the deadline pass without the qualifying action (reply, or resolution)
2. Check the ticket after the next SLA monitor run (≤ 2 minutes)

**Expected Result:**
- Ticket is marked breached, with the breach time recorded
- Notifications are sent
- The ticket becomes a candidate for escalation

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Demonstrated repeatedly this session, most cleanly on ticket #14: each of its three deadline passes (L1 08:11, L2 08:14, L3 08:16) was picked up by the very next monitor run, logged as `[SLA][STATE] Ticket #14 | response_breached = true | breached_at: <exact timestamp>` (breach time genuinely recorded, not just inferred), a notification email sent in the same cycle (escalation email for L1/L2 hops, Critical Breach Alert for the L3/top hop — see TC-HLP-321/093/094/301), and the ticket became an active escalation candidate immediately (L1→L2, L2→L3, then admin-fallback). Also reproduced independently via ticket #15/BUG-HLP-020 (resolution deadline breach → L2→L3 escalation) and ticket #17 (response deadline breach → admin fallback). Every case: breach detected, timestamped, notified, and escalated within one monitor cycle.

---

### TC-HLP-300: The SLA Information panel shows the full SLA state

**User Role:** Agent
**Priority:** Medium
**Precondition:** A ticket with an SLA attached, at least one escalation having occurred.

**Steps:**
1. Open the ticket and view the SLA Information panel

**Expected Result:**
- Panel shows: which SLA applies, when it started, both deadlines, whether either is breached, paused time, current support level, and the escalation count

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #14's SLA Information tab (after its full 3-escalation run) shows every required element at once: SLA name ("Alpha Escalation Test SLA") and overall status ("↑ Escalated 3×" / "✗ SLA Missed") at the top; SLA Overview table with Support Level (L3), SLA Started timestamp, Initially Assigned To vs Current Assignee; SLA Journey table with per-stage Response SLA (breached + exact deadline) and Resolution SLA columns; a "Needs Immediate Attention" banner naming exactly who it's now assigned to and when; and a separate Activity Log with a running, unambiguous escalation count. Paused time is shown too — confirmed on ticket #15 ("⏸ Paused — Paused since 09/01/2026 08:36 AM (UTC)"). Every element this TC's Expected Result lists is genuinely present and correctly populated.

---

### TC-HLP-301: Creating a support-level chain L1 → L2 → L3

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** A project with at least 3 distinct members available as assignees.

**Steps:**
1. Project › Helpdesk › Settings › Support Levels › New Support Level, create L1 with ≥1 assignee
2. Create L2, create L3
3. Edit L1: Escalates to → L2. Edit L2: Escalates to → L3. Leave L3's Escalates to blank

**Expected Result:**
- All three levels save correctly
- L3 (the top) correctly has no Escalates to target

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS. L1 (Luna Blossom) already existed from an earlier session. Created three new project members for this — `autumn.grace`, `briar.sunset`, `willow.belle` (all Agent role) — since Luna was the only existing agent and TC-HLP-346 correctly blocks reusing one assignee across levels. Built the chain top-down rather than this TC's own bottom-up step order (creating L3 before L2 lets each level's own Escalation To dropdown offer an already-existing higher level at creation time, instead of requiring a follow-up edit): created **L3** (Level Order 3, assignee Willow Belle, no Escalation To — this doubled as TC-HLP-303's required-only-fields case), then **L2** (Level Order 2, assignees Autumn Grace + Briar Sunset, Description filled, Escalation To = L3 — this doubled as TC-HLP-304's all-fields-at-create case), then edited L1 to set Escalation To = L2. Final list confirms the full chain: L1 → L2 (Level Order: 2), L2 → L3 (Level Order: 3), L3 → "None (Last Level)" — matching this TC's own expected result exactly (top level correctly has no Escalates to target).

---

### TC-HLP-302: The support-level assignee dropdown only offers this project's members

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Creating/editing a support level on Project A.

**Steps:**
1. Open the assignee dropdown while creating a level on Project A

**Expected Result:**
- Only members of Project A are offered — no members of other projects appear

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS on the observable half. While creating L2 and L3 on Helpdesk QA Alpha, the Support Assignees dropdown only ever listed Alpha's own project members (Autumn Grace, Briar Sunset, No Perm Reporter, Willow Belle — minus whoever was already claimed by another level per TC-HLP-346) — confirmed correctly excludes non-members. A genuine cross-project comparison (a second project's own distinct member appearing or not) isn't isolated by this fixture alone; see TC-HLP-350 for the dedicated second-project independence check.

---

### TC-HLP-303: Creating a Support Level with only the required fields succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None. TC-HLP-301 fills Name/Project/Level Order/≥1 assignee (and Escalates to, when chaining) but never explicitly proves Description can be left blank.

**Steps:**
1. Project's Helpdesk › Settings › Support Level › New Support Level
2. Fill only Name, Level Order, and pick one Support Assignee — leave Description blank and Escalation To unset
3. Save

**Expected Result:**
- Save succeeds with no required-field error on Description or Escalation To
- The support level appears in the list with Description empty and Escalation To showing "None (Last Level)" or equivalent

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS. Created "L3" (Level Order 3, assignee Willow Belle only) filling only Name/Level Order/one assignee — left Description blank and Escalation To at its default. Save succeeded with no error. List row confirms: Description empty (no text shown), Escalation To shows "None (Last Level)". Doubled as the top level of the real chain built for TC-HLP-301.

---

### TC-HLP-304: Creating a Support Level with every field filled in the initial Save, not via a later Edit

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A lower-order support level already exists on this project to select as this new level's own Escalation To is not applicable here (a level can't escalate to itself) — instead, create this level as a mid-chain level with an already-existing higher level available to select as Escalation To. Complements TC-HLP-305, which only proves Description is editable via Edit on an already-existing level.

**Steps:**
1. New Support Level
2. In one Save: fill Name, Level Order, **Description**, one or more Support Assignees, Escalation To, and leave Active checked
3. Save, then open the level's own detail/list row to confirm every field

**Expected Result:**
- Every field — Description specifically — saves correctly on the very first Save, not only when added later via Edit

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS. Created "L2" (Level Order 2) with every field filled in one Save: Description "Second-tier escalation support level for Helpdesk QA Alpha.", Support Assignees = Autumn Grace + Briar Sunset (two, satisfying TC-HLP-323's multi-agent precondition too), Escalation To = L3 (the already-existing higher level created just before this one). List row confirms all of it on the very first Save: Description present, Support Assignees "Autumn Grace, Briar Sunset", Escalation To "L3 (Level Order: 3)" — no follow-up Edit was needed for any field, including Description.
- **Side observation, not filed as a bug (methodology-uncertain):** while entering Level Order via `fill()` (sets the value directly rather than simulating real keystrokes), the Escalation To dropdown's client-side option list did not visibly narrow to exclude lower-order levels until after a page reload/re-render — L1 (order 1) briefly still appeared selectable alongside L3 (order 3) even after Level Order was set to 2. Did not select the invalid option, so no bad data resulted. This may be an artifact of how `fill()` bypasses the real `input`/`change` event a human typing would trigger, rather than a genuine product defect — worth a real character-by-character typing re-check before concluding either way, not asserted as a finding here.

---

### TC-HLP-305: Editing a Support Level updates every field, including its undocumented Description

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** An existing support level (e.g. L1).

**Steps:**
1. Open the support level's Edit form
2. Change Name, Level Order, **Description**, Support Assignees, Escalation To, and Active in one save
3. Save, then reopen Edit to confirm each field independently

**Expected Result:**
- Every field saves the new value entered
- **Description** is checked here specifically — it's a real field on this form (confirmed live 2026-08-31 via the form's own markup, `support_level[description]`) but is absent from `HELPDESK_USER_GUIDE.md` §3.3's field table and untested elsewhere except `HELPDESK_FIELD_VALIDATIONS.md` TC-HLP-128's max-length probe

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS on Name/Level Order/Description/Active; Support Assignees and Escalation To could not be independently varied in this environment — see Notes, not a defect.** Created a disposable "Alpha Edit-Test Level" (id 5, Level Order 5, project-scoped, not part of the live L1→L2→L3 chain used elsewhere in this suite) specifically to avoid disturbing that load-bearing fixture. Edited it changing Name → "Alpha Edit-Test Level (Renamed)", Level Order 5→4, Description → new text, and unchecked Active — reopened the list afterward and confirmed all four persisted exactly. Description confirmed correctly pre-populated on the Edit form's own load (matches the plugin-wide pattern already seen on SLA/Holiday Edit forms). **Notes on the two fields not varied**: (1) Support Assignees — this project's only members not already used as an assignee on L1/L2/L3 is "No Perm Reporter" (a permission-testing fixture), so there was no second valid user to swap to without freeing one up from the live chain; the picker itself is confirmed functional (used successfully to assign her at creation). (2) Escalation To — confirmed (via a deliberate JS-dispatched `change` event, not just Playwright `.fill()`, closing the uncertainty `TC-HLP-304` had left open) that this dropdown's option list is rendered once at page load and does **not** refresh client-side when Level Order is edited in the same session — a second page load is required before a lowered Level Order unlocks new valid targets. Level Order 0 was rejected server-side (silently re-rendered the Edit form, no visible inline error) — Level Order has a real minimum, most likely 1. Since L1/L2/L3 already occupy orders 1–3, this disposable level (min viable order 4+) could never gain a valid Escalation To target without colliding with the live chain's own order values, so the field's value ("None (Last Level)") could not be changed to something else without deliberately disrupting other fixtures — a real environment/fixture-availability constraint, not a product defect.

---

### TC-HLP-306: Editing a Support Level's required fields only does not wipe its already-set optional fields

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A support level that already has Description, Escalation To, and Active all populated with real (non-default) values — e.g. re-open the level TC-HLP-305 just edited (which set Description, Escalation To, and Active in that same save), or the level TC-HLP-304 created with every field filled at Create time. Neither TC-HLP-305 nor TC-HLP-304 isolates this case: both change every field together in one Save, so a form that fails to pre-populate an untouched optional field would never surface there.

**Steps:**
1. Open this support level's Edit form and note the current Description text, Escalation To selection, and Active checkbox state before changing anything
2. Change only Name (e.g. append " (Required-Only Edit)") and Level Order (e.g. increment it by 1) — the two required fields — and do not touch Description, Escalation To, Active, or Support Assignees at all
3. Save
4. Reopen Edit (and/or check the level's list row) to confirm every field independently

**Expected Result:**
- Name and Level Order save with exactly the new values entered in step 2
- Description, Escalation To, and Active all retain the exact values noted in step 1 — none reverts to blank/unset/unchecked as a side effect of a save that never touched them
- This is the specific gap neither TC-HLP-305 (edit ALL fields together) nor TC-HLP-304 (create ALL fields together) can expose: a real, common bug class where the Edit view fails to pre-populate an optional field's form input, so an untouched field silently posts as blank and clobbers existing data on Save
- If Description empties out, Escalation To resets to "None (Last Level)", or Active unchecks itself despite never being touched, that is the defect this TC exists to catch

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS — no data loss.** On the same disposable "Alpha Edit-Test Level" (already carrying a non-default Description, Active unchecked, from TC-HLP-305's edit), changed only Name → "Alpha Edit-Test Level (Required-Only Edit)" and Level Order 4→6, deliberately not touching Description, Support Assignees, Escalation To, or Active. Reopened Edit afterward: Name/Level Order show the new values; Description is byte-identical to its pre-edit text; Support Assignees still shows "No Perm Reporter"; Escalation To still "None (Last Level)"; Active checkbox remains unchecked (its value from the prior edit) — nothing reverted, cleared, or reset as a side effect of the required-only save.

---

### TC-HLP-307: Deleting an unused Support Level succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A support level with no customer project-access rows currently pointing at it (distinct from TC-HLP-362, which covers the in-use/blocked case).

**Steps:**
1. Delete the unused support level

**Expected Result:**
- Deletion succeeds with no error and no orphaned reference left behind
- Confirm any tickets that previously carried this support level (if any existed) are left in a sane state — either the field clears or the historical value is preserved read-only, not a broken reference

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Deleted the disposable "Alpha Edit-Test Level (Required-Only Edit)" (id 5, left over from TC-HLP-305/327's edit-CRUD probing, genuinely never referenced by any customer, ticket, or other level's Escalation To). Delete link opened a real confirmation modal ("Delete Support level? Are you sure you want to delete... This action cannot be undone."); confirming showed "Successful deletion." and the level is gone from the list. The live L1→L2→L3 chain (used throughout this suite) was verified still intact and unaffected — no orphaned reference or side effect on the other levels.

---

### TC-HLP-308: A ticket enters at the support level on its customer's project-access row

**User Role:** Agent
**Priority:** High
**Precondition:** A customer whose project-access row specifies support level L2.

**Steps:**
1. That customer raises a ticket and it gets assigned

**Expected Result:**
- The ticket's current support level is L2, not the chain's starting level L1

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Customer `retest.customer1`'s project-access row on Helpdesk QA Alpha was set to SLA "Alpha Escalation Test SLA" / Support Level **L2**. She raised ticket #15 through the real customer-facing "New issue" form. Once an agent (`autumn.grace`, one of L2's two configured assignees) replied to it, the SLA Information tab's SLA Overview row showed **Support Level: L2** directly — the ticket never passed through L1 at all; there is exactly one stage ("Initial Stage") in its SLA Journey, at L2, with no L1 entry anywhere in the history. Confirms tickets enter at the level the customer's own project-access row specifies, not always the chain's starting level.

---

### TC-HLP-309: An agent's reply on a ticket that entered at a mid/last support level uses that level's own SLA targets, not L1's

**User Role:** Agent
**Priority:** Medium
**Precondition:** Same as TC-HLP-308 — a customer whose project-access row specifies support level **L2** (mid-chain) or the top level (e.g. L3), so their ticket enters directly at that level rather than L1. A distinct SLA/response-resolution target is configured per level if the plugin supports per-level targets, or the base SLA's own targets if levels share one SLA (record whichever is actually true — see Notes).

**Steps:**
1. That customer raises a ticket (enters at L2 or the top level, per TC-HLP-308).
2. As an agent, open the ticket and click **Reply** (a genuine Reply Note, not a plain Edit) — do **not** merely assign it first; reply directly, the same way a mid-level agent handling an already-escalated-in ticket really would.
3. Immediately check the SLA Information panel: which SLA is attached, when the clock started, and what the response/resolution deadlines actually are.

**Expected Result:**
- The SLA clock starts at the moment of this first reply/assignment (whichever happens first — if Reply itself both assigns and replies in one action per TC-HLP-375, note that explicitly), **not** from ticket creation and **not** backdated to when a hypothetical L1 stage would have started — the ticket never actually was at L1, so there is no L1 elapsed time to account for.
- The deadlines shown are calculated against the SLA/targets that actually apply at the level the ticket entered at (L2 or top), not L1's targets — confirm by comparing against L1's own known response/resolution minutes for the same base SLA, if L1 has different numbers.
- Record precisely which of these two models is real, since the User Guide does not resolve this: **(a)** every level shares one SLA with one set of targets (level only affects escalation routing, not deadline math), or **(b)** each level can carry its own distinct targets. This TC's own result is the answer — write it back into `HELPDESK_REQUIREMENTS.md`'s SLA/Support Level section once confirmed, since it affects how TC-HLP-308 and this TC should both be read going forward.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS**, and the model question is answered: **model (a) is real** — every level shares one SLA with one set of targets; Support Level only affects escalation routing, not deadline math. On ticket #15 (entered at L2 per TC-HLP-308), `autumn.grace` clicked **Reply** directly (not a plain Edit/assign first) — this single action both assigned the ticket to her and posted the note, changing Status from "New" straight to "Waiting for Customer Response" in one step, matching TC-HLP-375's already-confirmed reply-assigns behavior. The SLA panel immediately afterward showed: SLA started at the reply's own timestamp (08:33 AM) — **not** ticket creation (~08:12 AM, over 20 minutes earlier) — with Response marked "✓ Responded At: 08:33 AM, Deadline: 08:34 AM" and a fresh Resolution deadline of 08:34 AM (exactly 1 minute later, matching "Alpha Escalation Test SLA"'s configured 1-minute targets). Because every Support Level on this SLA (L1/L2/L3) references the same single SLA record with one First Response Time and one Resolution Time — confirmed via Project → Helpdesk → Settings → Support Level list, where all three levels list under the one "Alpha Escalation Test SLA" — there was no separate "L2's own target" to compare against; the level determines routing/assignee only. `HELPDESK_REQUIREMENTS.md`'s SLA/Support Level section should be updated to state this explicitly (single shared SLA record's targets apply regardless of which level a ticket is at).

---

### TC-HLP-310: A ticket that entered directly at a mid-level (not via natural escalation from L1) still escalates to the next level when its own deadline breaches

**User Role:** N/A (system-driven, verified by Agent/Admin)
**Priority:** High
**Precondition:** A ticket whose current Support Level is a mid-chain level (e.g. L2) because it **entered there directly** (per TC-HLP-308 — a customer's project-access row specifies L2, or an agent was assigned there directly) — never having been escalated up from L1 by the SLA monitor. That level has a configured Escalation To (e.g. L2 → L3).

**Steps:**
1. Let this ticket's own deadline (at its current, directly-entered level) pass with the clock running.
2. Wait for the next SLA monitor run (≤ 2 minutes).
3. Check the ticket's Support Level, Assignee, and escalation count afterward.

**Expected Result:**
- The ticket escalates to the next level per that level's own Escalation To config (e.g. L2 → L3), exactly the same as a ticket that arrived at that level via a natural L1 breach (TC-HLP-321) — the escalation mechanism should not care *how* the ticket got to its current level, only what that level's own config says.
- Reassigned to an assignee at the new level; escalation count increments.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS**, though the evidence is a byproduct of a different investigation (BUG-HLP-020's TC-HLP-298 pass) rather than a deliberately staged run for this exact question — recorded here so it's traceable on its own. Ticket #15 entered directly at L2 (TC-HLP-308: `retest.customer1`'s project-access row specifies L2, never touched L1) and was assigned to `autumn.grace` via Reply (TC-HLP-309). Later, once its Resolution deadline had (per BUG-HLP-020) gone stale and passed, the next SLA monitor run picked it up and escalated it exactly like a naturally-arrived L2 ticket would: `[SLA][ESCALATION] Ticket #15 | L2 → L3 | Assignee: autumn.grace → willow.belle`. Confirms the escalation mechanism keys off the ticket's *current* Support Level and that level's own Escalation To config only — it has no separate "did this ticket ever visit L1" check that could block or alter escalation for a directly-entered ticket.

---

### TC-HLP-311: A ticket that entered directly at the top (last) level does not attempt to climb further — same admin-fallback behavior as one that arrived there via the full chain

**User Role:** N/A (system-driven, verified by Agent/Admin)
**Priority:** Medium
**Precondition:** A ticket assigned directly to an agent at the top Support Level (no Escalates To configured — e.g. L3) from the moment it was created/assigned, never having climbed the chain from L1/L2 first.

**Steps:**
1. Let this ticket's deadline pass with the clock running.
2. Wait for the next SLA monitor run (≤ 2 minutes).
3. Check the ticket's Support Level, Assignee, and whether a Critical Breach Alert / admin-fallback occurred.

**Expected Result:**
- No escalation attempt is made past the top level (there is nowhere to go) — same as TC-HLP-324/301's behavior for a ticket that arrived at the top via a full L1→L2→L3 climb.
- PATH B (admin fallback) fires: the ticket is reassigned to the Admin account and a Critical Breach Alert is sent — the mechanism should not care whether the ticket "earned" its way to the top level through prior breaches or started there directly.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #17 was created fresh and assigned directly to Willow Belle at L3 (never touched L1 or L2 — built for the TC-HLP-324/301 admin-email verification, but doubles as direct evidence here). When its Response deadline breached, the log showed the identical PATH B sequence as a chain-climbed ticket: `[SLA][ADMIN] PATH B: Admin fallback — no further escalation level`, `Admin Found: admin (admin@test.local)`, `Assigned To: admin`, followed by a real Critical Breach Alert delivered to and confirmed present in the admin mailbox. No escalation attempt was logged, no error — L3's own "Escalation To: None (Last Level)" config was respected identically regardless of how the ticket reached L3.

---

### TC-HLP-312: Assigning a lower-level agent to a ticket sitting at a higher Support Level must show a clear warning or indication before the assignment is made

**User Role:** Admin / Agent (any level)
**Priority:** Medium
**Precondition:** A customer whose project-access row specifies a high Support Level (e.g. L3), a ticket created by that customer (so the ticket's own Support Level is L3), and an agent who holds a lower level only (e.g. L1, no L2/L3 membership).

**Steps:**
1. As Admin, temporarily set a customer's Support Level to L3 and have that customer create a new ticket; confirm via the ticket's SLA Information tab that its Support Level is genuinely L3.
2. As Admin, assign the ticket to a real L3 agent (baseline state).
3. Open the ticket's standard **Edit** form (via the issue's own **Edit** button/link — `/issues/:id/edit`, not the inline quick-editor) and inspect the **Assigned to** dropdown's option list.
4. Select an agent who only holds a lower level (e.g. `luna.blossom`, L1 only — no L2/L3 membership on this project) and click **Submit**.
5. Reload the ticket fresh and check: did the assignment succeed, was there any warning/confirmation/indication at any point in the flow (in the dropdown itself, on Submit, or after reload), and did the ticket's own Support Level change as a side effect?

**Expected Result:** Per the user's UX judgment: the system should provide a clear warning or visual indication about the ticket's Support Level when a lower-level agent is about to be assigned to it — e.g. the candidate's own Support Level shown next to their name in the Assigned-to dropdown, or a confirmation prompt before the assignment is confirmed. Silently allowing the assignment with no indication anywhere is a UX defect, not acceptable behavior, regardless of whether the user guide documents a hard contract against it.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **FAIL — no warning or indication anywhere in the flow.** `retest.customer1`'s Support Level was set to L3, and she created ticket #22 ("TC-HLP-312 lower-level agent self-assign test ticket"). Admin assigned it to Willow Belle (a real L3-only agent); the SLA Information tab confirmed Support Level "L3". Opened the ticket's standard Edit form (`/issues/22/edit`) — the **Assigned to** `<select>` lists every project member by name only (`<< me >>`, Retest Customer1 (disabled), Willow Belle, Autumn Grace, Briar Sunset, Luna Blossom, No Perm Reporter) with **no Support Level shown next to any candidate**, so there is no way to tell from the dropdown itself who is even eligible for this ticket's level. Selected `Luna Blossom` (L1 only) and clicked Submit — succeeded immediately, no confirmation dialog, no inline warning banner, nothing. A fresh reload of `/issues/22` confirmed the change persisted (header: "Assignee: Luna Blossom") and the ticket's own Support Level did **not** change as a side effect (SLA Information tab, all three rows — header, escalation history, support-level table — still read "L3"). The same lack-of-indicator also reproduces via the ticket's inline Assignee quick-editor. **Filed as BUG-HLP-024** (Medium) — see `bugs/open/BUG-HLP-024.md`.

**Revision History:**
- **2026-09-01, original pass**: recorded only as observed behavior ("Assignment succeeds with zero filtering, warning, or block... Not filed as a bug: the guide makes no claim that assignment is level-gated") and raised to the user as an open design question rather than a defect.
- **2026-09-01, corrected same day per explicit user direction**: the user stated this should be treated as a real UX issue regardless of whether the guide documents a hard contract — the plugin already tracks Support Level per ticket and per agent membership, so the data needed to warn is already present; the defect is the UI's failure to surface it. Title and Expected Result rewritten to assert the warning/indication requirement directly; re-scored **FAIL**; filed as **BUG-HLP-024**. Repro steps also corrected to use the ticket's standard Edit form (`/issues/:id/edit`) rather than the inline quick-editor, per direct user instruction.

---

### TC-HLP-313: A fresh ticket created by a customer at a given Support Level is unassigned by default

**User Role:** Customer
**Priority:** Medium
**Precondition:** A customer whose project-access row specifies Support Level L2 (e.g. `retest.customer1`, her established baseline).

**Steps:**
1. As that customer, create a new ticket via her portal's own "New issue" form.
2. As Admin, open the ticket and check its Assignee field.

**Expected Result:** The ticket is created with Assignee "-" (unassigned) — creation does not auto-assign any agent.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** `retest.customer1` (L2 baseline) created ticket #24 ("TC-HLP-315 fresh unassigned L2 ticket - self-assign warning test") via her portal. As Admin, `/issues/24` showed "Assignee: -" immediately after creation, before any agent had touched it.

---

### TC-HLP-314: A fresh, unassigned ticket shows no indication of its own Support Level anywhere until an agent takes a first action

**User Role:** Admin / Agent
**Priority:** Low
**Precondition:** Ticket #24 (per TC-HLP-313), still unassigned.

**Steps:**
1. Open the ticket's main view — check for any "Support Level" field or similar indicator.
2. Check the tab list (History / Property changes / SLA Information) for an "SLA Information" tab.

**Expected Result:** Not asserted in advance — this TC exists to determine whether an agent has any way to learn a ticket's Support Level *before* acting on it, which directly bears on how a future cross-level warning could even be implemented (it would need to read the customer's project-access Support Level directly, not the ticket's own SLA record, since that record does not exist yet).

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **No indication exists anywhere pre-assignment.** On fresh ticket #24, the main issue view has no "Support Level" field at all (only Status/Priority/Assignee/Start date/Due Date/Progress/Estimated time/Issue Category/Product/Organization/Customer). The tab list itself is absent — no History, no Property changes, and critically **no SLA Information tab at all** (confirmed via a full DOM check: the tab-list `listitem`/`link` elements that exist on an already-assigned ticket are entirely missing here). The SLA Information tab only appears *after* the ticket's first assignment (confirmed in TC-HLP-315/343 below, where it appears immediately once assigned). **This means today, an agent has no way to check a ticket's Support Level before deciding to self-assign or reply to it** — reinforcing that any future fix for BUG-HLP-024 needs to source the level from the customer's project-access row directly, not from a per-ticket record that doesn't exist until after the very action being warned about.

---

### TC-HLP-315: An L1 agent self-assigning a fresh, unassigned ticket at a higher Support Level (L2) receives no warning

**User Role:** Agent (L1)
**Priority:** Medium
**Precondition:** Ticket #24 (per TC-HLP-313), unassigned, Support Level L2 (inherited from `retest.customer1`'s project-access row).

**Steps:**
1. Log in as an agent who only holds L1 (e.g. `luna.blossom`, no L2/L3 membership on this project).
2. Open the ticket's standard Edit form (`/issues/24/edit`) and set **Assigned to** = `<< me >>`. Click Submit.
3. Check for any warning/confirmation at any point, and check the ticket's SLA Information tab afterward.

**Expected Result:** Per the user's UX requirement: since this ticket belongs to L2 and the acting agent only holds L1, the system should show a clear warning/confirmation before the assignment completes (e.g. *"This ticket is assigned to a higher Support Level (L2), and the current agent belongs to L1"*), with the ability to Confirm or Cancel.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **FAIL — zero warning at any point.** `luna.blossom` opened `/issues/24/edit`; the Assigned-to `<select>` listed every project member by name only, no Support Level shown. Selected `<< me >>`, clicked Submit — succeeded immediately, no dialog, no banner. Reload confirmed "Assignee: Luna Blossom"; the SLA Information tab (which did not exist before this action, per TC-HLP-314) now appeared for the first time and read Support Level "L2". Same underlying defect as TC-HLP-312/BUG-HLP-024, confirmed here via a genuinely fresh/unassigned ticket rather than a reassignment. Filed under the same **BUG-HLP-024** (broadened same day) — see `bugs/open/BUG-HLP-024.md`.

---

### TC-HLP-316: An L1 agent replying to (without explicitly assigning) a fresh, unassigned ticket at a higher Support Level (L2) receives no warning, even though the reply itself auto-assigns them

**User Role:** Agent (L1)
**Priority:** Medium
**Precondition:** A second fresh, unassigned ticket at Support Level L2 (same setup as TC-HLP-313, a separate ticket).

**Steps:**
1. Log in as the same L1-only agent.
2. Open the ticket and click **Reply** (not Edit). Type a Reply Note and click **Save** — do not touch the Assignee field directly at any point.
3. Check for any warning at any point in the Reply flow, and check the resulting Assignee + SLA Information tab.

**Expected Result:** Same requirement as TC-HLP-315 — a warning/confirmation should appear before the action completes, since replying is itself an action that takes ownership of (and, per existing plugin behavior, auto-assigns) a ticket at a higher level than the agent holds.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **FAIL — zero warning, via a genuinely different code path than TC-HLP-315.** `luna.blossom` opened fresh ticket #25 ("TC-HLP-316 fresh unassigned L2 ticket - reply-action warning test"), clicked Reply, typed "Looking into this now.", clicked Save — no dialog or warning of any kind appeared in the Reply form or on Save. The reply auto-assigned her (a separate, pre-existing plugin mechanism, not something this TC introduced): History confirms "Assignee set to Luna Blossom" and "Status changed from New to Waiting for Customer Response". The SLA Information tab (again, non-existent before this action) now shows Support Level "L2". Confirms the missing-warning defect reproduces through the auto-assign-on-reply mechanism just as much as through explicit self-assignment — an agent never has to touch the Assignee field at all to end up silently taking ownership of a higher-level ticket. Filed under the same **BUG-HLP-024** — see `bugs/open/BUG-HLP-024.md`.

---

### TC-HLP-317: An L2 agent self-assigning an L2 ticket (matching level) does not receive an unnecessary warning

**User Role:** Agent (L2)
**Priority:** Low
**Precondition:** A third fresh, unassigned ticket at Support Level L2.

**Steps:**
1. Log in as a real L2 agent (e.g. `autumn.grace`).
2. Open the ticket's standard Edit form and set Assigned to = `<< me >>`. Click Submit.
3. Check for any warning.

**Expected Result:** No warning should appear — the agent's own level (L2) matches the ticket's level (L2), so there is nothing to warn about. This is the control/no-false-positive case a future BUG-HLP-024 fix must not regress.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS (trivially, by the absence of any warning mechanism today — recorded as the baseline control case).** `autumn.grace` opened ticket #26 ("TC-HLP-317 fresh unassigned L2 ticket - matching-level agent no-false-positive test") via its Edit form, set Assigned to = `<< me >>`, Submit succeeded with no dialog — exactly as expected for a matching-level case. History confirms "Assignee set to Autumn Grace". Once BUG-HLP-024 is fixed, re-run this TC to confirm the new warning mechanism correctly stays silent here.

---

### TC-HLP-318: Cancel on the (not-yet-implemented) cross-level assignment warning must prevent the assignment

**User Role:** Agent (any lower level)
**Priority:** Low
**Precondition:** BUG-HLP-024 fixed and a confirmation dialog implemented.

**Steps:**
1. Attempt to self-assign (or reply to) a ticket at a higher Support Level than the agent holds.
2. When the warning/confirmation dialog appears, click **Cancel**.
3. Check whether the assignment/reply was prevented.

**Expected Result:** Cancel must prevent the action entirely — the ticket remains unassigned (or keeps its prior assignee), and no reply/status change is committed.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **BLOCKED — cannot be executed.** No confirmation dialog of any kind exists in the current build (confirmed across TC-HLP-315/343 above) — there is no Cancel button to click. This TC is written and ready to re-run once **BUG-HLP-024** is fixed; recorded as Blocked rather than a false PASS.

---

### TC-HLP-319: Confirm on the (not-yet-implemented) cross-level assignment warning must allow the assignment to proceed

**User Role:** Agent (any lower level)
**Priority:** Low
**Precondition:** BUG-HLP-024 fixed and a confirmation dialog implemented.

**Steps:**
1. Attempt to self-assign (or reply to) a ticket at a higher Support Level than the agent holds.
2. When the warning/confirmation dialog appears, click **Confirm**.
3. Check whether the assignment/reply completes.

**Expected Result:** Confirm must allow the action to proceed exactly as it does today (the underlying capability isn't being removed — see BUG-HLP-024's Notes: this is a UX/validation gap, not a hard restriction) — assuming the product's own design intends to still permit cross-level assignment after an informed confirmation, which is the product/dev decision this TC assumes but does not itself make.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **BLOCKED — cannot be executed.** Same reason as TC-HLP-318: no confirmation dialog exists yet to click Confirm on. Written and ready to re-run once **BUG-HLP-024** is fixed.

---

### TC-HLP-320: A new ticket created while its customer's assigned SLA is deactivated gets no SLA attached at all — and manual assignment afterward does not make it escalate

**User Role:** Customer (creates), Admin/Agent (verifies and reassigns)
**Priority:** Medium
**Precondition:** A customer's project-access row specifies an SLA that is then deactivated (Active checkbox unchecked) before the customer creates a new ticket.

**Steps:**
1. As Admin, create a disposable SLA and assign it (with a Support Level) to a customer's project-access row.
2. As Admin, deactivate that SLA (uncheck Active on Helpdesk › SLA).
3. As that customer, create a new ticket.
4. As Admin, check whether the ticket has an SLA Information tab/deadlines at all.
5. As Admin, manually assign the ticket to an agent, then trigger the SLA monitor and check the log/ticket for any breach or escalation activity involving this ticket.

**Expected Result:** Per `HELPDESK_USER_GUIDE.md` §Troubleshooting — "The SLA Information panel is missing from a ticket": *"Three causes: the ticket is not on the Support tracker; the customer has no SLA on their project-access row; or the SLA is inactive."* and §"Escalation emails are not arriving": escalation requires the SLA to be **Active** and the ticket to be **assigned**. Combined, a ticket created while its customer's SLA is inactive should have no SLA Information panel at all (no deadlines), and since it never had a clock to begin with, manual assignment afterward should not cause it to breach or escalate — there is nothing to escalate.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS — matches documented behavior exactly, not a bug.** Created disposable "Alpha Deactivation Escalation Test SLA" (1-min response), assigned it + Support Level L1 to `retest.customer1`'s project-access row, then deactivated the SLA (Active unchecked, confirmed via the SLA list — its row is the only one without a checked Active box). As `retest.customer1`, created ticket #23 ("TC-HLP-320 deactivated-SLA new ticket test") — creation succeeded with no error shown to the customer. As Admin, `/issues/23?tab=sla-information` renders the ticket normally but with **zero SLA-related content anywhere on the page** — no SLA Information tab, no deadlines, Product/Organization both "-", Assignee "-" (no auto-assignment either), exactly matching the guide's documented cause #3 ("the SLA is inactive"). Manually assigned the ticket to `luna.blossom`, then ran `Helpdesk::SlaMonitorWorker.new.perform` directly. The worker's log shows it processed 4 real breaches that cycle (tickets #19 and #22, both on active SLAs) but **never once mentions ticket #23** — it is completely invisible to the monitor, confirming manual assignment does not resurrect a clock that was never created. Since no escalation ever fires, the third sub-question (does the escalation email go to the new assignee) is moot — there is no escalation event to email about. All three parts of Scenario 2 are answered by one root cause: a deactivated SLA is simply never attached to a new ticket, silently and by design.

---

### TC-HLP-321: An SLA breach escalates the ticket to the next support level

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** High
**Precondition:** A ticket at L1 whose SLA has just breached; L1 escalates to L2.

**Steps:**
1. Wait for the next SLA monitor run (≤ 2 minutes) after the breach

**Expected Result:**
- Ticket's support level moves from L1 to L2
- Ticket is reassigned to an assignee at L2
- Its escalation count increments by 1
- **An escalation email is sent, and its recipient is specifically the new (L2) assignee the ticket was just reassigned to** — not a generic broadcast to every user who happens to hold the L2 support level, and not the old (L1) assignee. Confirm exactly who receives the mail: only the new individual assignee, every L2-level member, or both old and new assignee — record whichever is the real behavior.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): PASS on every part. Ticket #14 (SLA "Alpha Escalation Test SLA", 1-minute First Response Time, assigned to Luna Blossom at L1) was left untouched past its response deadline. Triggered `Helpdesk::SlaMonitorWorker.new.perform` manually (Sidekiq's own cron — `*/2 * * * *` — is real and confirmed loaded, but manual triggering was used to pin exact timing for this session's evidence). Server log confirms cleanly: `[SLA][BREACH] RESPONSE SLA BREACHED — Ticket #14, SLA Level L1, Assignee luna.blossom` → `[SLA][ESCALATION] Ticket #14 | L1 → L2 | Assignee: luna.blossom → autumn.grace | New response DL: ... | Escalation #: 1`. UI confirms: Support Level column now "L2", Current Assignee "Autumn Grace", header badge "↑ Escalated 1×". Escalation email recipient log line reads `Recipient: autumn.grace (autumn.grace@test.local)` — a single named recipient, not a broadcast, and not luna.blossom (the old assignee).

---

### TC-HLP-322: The escalation notification email carries the documented content

**User Role:** N/A (system-driven, verified via mailbox/log)
**Priority:** Medium
**Precondition:** TC-HLP-321 just occurred.

**Steps:**
1. Inspect the escalation email — confirm who it was actually sent to (per TC-HLP-321's recipient check) before inspecting its content

**Expected Result:**
- Per `HELPDESK_USER_GUIDE.md` §"What the new assignee is told" (the authoritative source — verify against this, not assumption), the email contains: ticket ID and subject, project name and current status, **the previous level and the new level** (level, not necessarily the previous assignee's name — the guide does not promise that), the SLA name and which deadline was breached (response or resolution), how many times this ticket has been escalated, and a direct link to the ticket

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **FAIL on one documented field.** Opened the real escalation email in `autumn.grace`'s actual Roundcube inbox (not just the server log). Subject: "[Helpdesk QA Alpha] Issue Escalated from L1 to L2 - Issue #14: ...". Body table correctly shows: Issue #14 + subject, Project "Helpdesk QA Alpha", Status "New", Assigned To: Autumn Grace, **Previous Support Level: L1, New Support Level: L2** (both correctly present, matching the guide exactly), SLA: "Alpha Escalation Test SLA", Total Escalations: 1, and a working "View Issue" link to `http://localhost:3012/issues/14`. The one genuinely missing documented field: no statement of which deadline breached (Response vs Resolution) — the SLA Information tab tracks both separately, but the email just says "due to SLA breach" with no specifics. Reproduced identically on the second (L2→L3) escalation email in `willow.belle`'s inbox. Filed as **BUG-HLP-019** (Medium) — see `bugs/open/BUG-HLP-019.md`. (Note: an earlier pass of this TC also flagged the email not naming the previous *assignee* by name — re-checked against the real guide text and dropped, since the guide only promises the previous *level*, which is present; that was this session's own over-read of the TC's original Expected Result, not a real spec gap.)

---

### TC-HLP-323: When a support level has multiple assignees, escalation assigns the ticket to exactly one of them, and notifications follow that one agent

**User Role:** N/A (system-driven, verified by Agent/Admin)
**Priority:** High
**Precondition:** A support level (e.g. L2) configured with **two or more** assignees — TC-HLP-301 only requires "≥1 assignee" per level and never exercises this multi-agent case, even though it's a real configuration this engagement's own fixtures use (e.g. an earlier Forge rotation's L2 held both Autumn Grace and Harmony Rose). A ticket about to breach and escalate into this level.

**Steps:**
1. Let the ticket breach and escalate into the multi-assignee level.
2. Check the ticket's Assignee field.
3. Check who received the escalation notification email (TC-HLP-322) and, separately, the SLA breach notification email (TC-HLP-324-style breach alert) — specifically whether either was sent to every configured assignee on that level, or only to the one the ticket was actually assigned to.

**Expected Result:**
- The system assigns the ticket to **exactly one** agent chosen from the level's configured assignee list. The selected agent may be any one of them — **no specific selection order, round-robin, least-loaded, or first-added rule is required**; a random pick among the configured agents is acceptable.
- The ticket's **Assignee** field is updated to that one selected agent.
- Both the **escalation notification email** and the **SLA breach notification email** are sent to the **newly assigned agent only** — not to every agent configured on that Support Level. If either email goes out to the whole level's roster instead of just the new Assignee, that's the defect this TC is checking for.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Real Support Level L2 on Helpdesk QA Alpha is genuinely multi-agent — confirmed via Project → Helpdesk → Settings → Support Level list: L2's "Support Assignees" column reads **"Autumn Grace, Briar Sunset"** (both real project members, both with real mailboxes). Ticket #14's live L1→L2 escalation (see TC-HLP-321/299) assigned the ticket to **Autumn Grace only** — confirmed both via the ticket's own Assignee field and the SLA Journey table ("L2 — Agent: Autumn Grace"). Checked **Briar Sunset's real Roundcube inbox** directly (`briar.sunset@test.local`, 127.0.0.1:8081) after the escalation fired: **"Mailbox is empty" / "No messages found in this mailbox."** — zero emails of any kind, confirming she received neither the escalation notification nor any breach alert, while Autumn Grace's inbox received the full escalation email (per BUG-HLP-019's evidence). Exactly one agent selected from the two configured, and both notification types followed that one agent only, exactly as required.

---

### TC-HLP-324: A breach at the top support level notifies without escalating further

**User Role:** N/A (system-driven, verified by Admin/Agent)
**Priority:** High
**Precondition:** A ticket at the top level (no Escalates to) whose SLA breaches.

**Steps:**
1. Wait for the next SLA monitor run after the breach

**Expected Result:**
- The notification still goes out to the current (top) level
- The ticket does not climb further (there is nowhere to go)
- Administrators receive a critical breach alert

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Reproduced twice. (1) Ticket #14, after its L1→L2→L3 climb (TC-HLP-328), breached a third time at L3 (top, "Escalates to: None (Last Level)") at 08:16 AM UTC — Sidekiq log shows `[SLA][ADMIN] PATH B: Admin fallback — no further escalation level`, reassigning the ticket to the Redmine admin user and sending a "Critical Breach Alert". (2) Ticket #17, created fresh and placed directly at L3 (no chain climb), breached once at 08:26 AM UTC — identical PATH B fired immediately on the very next monitor cycle. In both cases the ticket's Support Level stayed L3 (never tried to escalate past it — the SLA Overview/Journey tables show no "Escalates to" target and no further stage created beyond the admin-fallback one), and the admin account received a real "[CRITICAL] SLA Breach Alert" email (see TC-HLP-325 for full mailbox-level confirmation of delivery).

---

### TC-HLP-325: A ticket that breaches at the top support level with nobody acting eventually reassigns to Admin

**User Role:** N/A (system-driven, verified by Admin/Agent)
**Priority:** Medium
**Precondition:** A ticket at the top support level (no Escalates to) whose SLA has just breached — same starting point as TC-HLP-324 — left genuinely untouched afterward (no agent reply, no reassignment, no status change) for a further period.

**Steps:**
1. Confirm TC-HLP-324's own result first (top-level breach → admin alert, no further escalation).
2. Leave the ticket completely untouched past that point — through at least one more SLA monitor cycle (≤ 2 minutes) so any second-stage automated behavior has a chance to fire.
3. Check the ticket's **Assignee** field and Status.

**Expected Result:**
- *(Per a specific expectation raised for this TC: if truly nobody resolves a top-level-breached ticket, the ticket should end up reassigned to the Admin account, as a last-resort ownership fallback beyond the alert TC-HLP-324 already confirms.)* Confirm precisely whether this reassignment actually happens, and if so: after how long / how many monitor cycles, whether it happens once or repeats, and whether Admin also receives an escalation-style notification identical in shape to TC-HLP-322's email (recording exact content either way).
- If no such reassignment mechanism exists at all — the ticket genuinely just stays breached, assigned to whoever it was already assigned to, with only the one-time alert from TC-HLP-324 — record that explicitly as the confirmed real behavior rather than leaving this ambiguous; that is itself a valid, useful answer, not a test failure, unless product judgment says it *should* fall back to Admin and currently doesn't.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS — reassignment is real, confirmed with full mailbox evidence.** The reassignment is **not** a delayed "further period" mechanism — it happens on the **very same SLA monitor cycle** that detects the top-level breach (no extra cycle needed; PATH B fires inline as part of the breach-processing pass). It happens **once**, not repeatedly: after ticket #14's admin fallback, a subsequent monitor run found "Response check: 0 overdue ticket(s) found" for that ticket — it does not re-trigger on every cycle. Ticket's Assignee field is confirmed changed to "Redmine Admin" (both #14 and #17). While building this evidence, discovered and fixed a real environment defect: the admin Redmine user's Mail field was still the out-of-the-box placeholder `admin@example.net`, never updated to the real local mailbox `admin@test.local` — meaning every prior Critical Breach Alert had been silently undeliverable. Fixed via Administration → Users → admin → Edit. Re-verified end-to-end with a fresh ticket (#17, created by `retest.customer1` after temporarily raising her project-access row to L3, assigned to Willow Belle, left to breach once): the Sidekiq log now shows `Admin Found: admin (admin@test.local)` / `STATUS: SUCCESS — Critical Breach Alert delivered to admin (admin@test.local)`, and the email was confirmed **actually present and openable in admin@test.local's real Roundcube inbox** — subject "[CRITICAL] SLA Breach Alert - L3 - Issue #17...", body "Critical SLA Alert / Last Level Escalation", addressed "Dear Redmine Admin," with Issue #17 details, SLA "Alpha Escalation Test SLA", Support Level "L3 (Final Level)", and "Final Escalation Level Reached — No further automatic escalation is available." Admin **does** receive a notification, but it is a **distinct dedicated template** ("Critical SLA Alert" / Final-Level-Reached framing) — not identical in shape to TC-HLP-322's regular escalation email (which instead shows Previous/New Support Level and a running Total Escalations count). Note this email's own "Total Escalations: 0" for ticket #17 is correct — that ticket breached once directly at L3 with no prior hops, so the counter (which tracks level-to-level escalations, not admin-fallback actions) legitimately reads 0.

---

### TC-HLP-326: Escalation history records the full detail of each escalation

**User Role:** Agent or Admin
**Priority:** Medium
**Precondition:** A ticket that has escalated at least once (TC-HLP-321).

**Steps:**
1. Open the ticket's escalation history (under the SLA section)

**Expected Result:**
- Shows: from level → to level, from assignee → to assignee, the deadlines before and after, which breach caused it, and when it happened

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** The SLA Information tab (`/issues/14?tab=sla-information`) is this history. Its **SLA Journey** table showed, after ticket #14's full 3-hop climb, 4 distinct stages each with its own Support Level, Agent, Active Period (start↓end), Response SLA (breached + exact deadline), and Escalation Trigger (e.g. "Response Time Breach → L2 / Autumn Grace, 09/01/2026 08:13 AM (UTC)") — every hop individually preserved, none overwritten. Its separate **Activity Log** table (7 events) is even more granular: SLA Started / Response SLA Breached / Escalated → L2 / Escalated → L3 rows, each with its own timestamp, the level, the agent, and a Details column stating the reason and the exact new deadline (e.g. "Reason: Response Time Breach · New deadline: 09/01/2026 08:14 AM (UTC)"). Together these two tables satisfy every element this TC's Expected Result asks for.

---

### TC-HLP-327: Deadlines are recalculated at each escalation using the SLA's working hours

**User Role:** N/A (system-driven, verified by Agent)
**Priority:** Medium
**Precondition:** An SLA with working hours 09:00–18:00 Mon–Fri; a ticket escalating at 17:55 on a Friday.

**Steps:**
1. Trigger/observe an escalation happening at 17:55 on a Friday

**Expected Result:**
- The recalculated deadline after escalation is a valid future working-hours deadline (e.g. Monday morning onward) — **not** an already-expired timestamp a few minutes after 17:55

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PARTIAL PASS — core recalculation mechanism confirmed; the specific Friday-17:55/weekend-rollover scenario was not exercised.** Ticket #14's Activity Log shows a genuinely fresh deadline computed at each hop, not a stale or already-past value carried forward: L1 started 08:10, deadline 08:11 (breached) → escalated to L2 at 08:13 with **new deadline 08:14** → breached → escalated to L3 at 08:15 with **new deadline 08:16**. Each recalculated deadline is correctly "start-of-this-stage + the SLA's 1-minute Response Time", proving the recalculation itself is real and per-stage. However, "Alpha Escalation Test SLA" (used for all of this session's fast-breach evidence) is configured with working hours 00:00–23:59 UTC, all 7 days — i.e. it has no working-hours boundary to cross, so the specific edge case this TC's Precondition names (an escalation at 17:55 Friday rolling correctly into the next Monday morning under a Mon–Fri/09:00–18:00 SLA) has not been directly reproduced. Recommend a follow-up pass using "Alpha Standard SLA" (Mon–Fri, 09:00–17:00) with an escalation deliberately timed near Friday close-of-business before marking this TC fully closed.

**Follow-up note, 2026-09-01/02**: TC-HLP-359 has since directly confirmed the underlying working-hours-boundary arithmetic itself (a ticket assigned minutes before close correctly carries its unconsumed remainder to the next window) is genuinely correct — closing the *general* mechanism's uncertainty. What remains specifically untested is the same arithmetic firing from an **escalation-triggered** recalculation rather than an initial assignment, timed exactly at a Friday-close boundary — a narrower, lower-priority residual gap, since escalation recalculation already uses this same confirmed calculation engine.

---

### TC-HLP-328: A ticket walks the full escalation chain L1 → L2 → L3 across two consecutive breaches

**User Role:** N/A (system-driven, verified by Agent/Admin)
**Priority:** High
**Precondition:** A complete chain L1 → L2 → L3 already built (TC-HLP-301); a ticket currently at L1 with its SLA about to breach. This TC is the end-to-end capstone that TC-HLP-321 (one hop) and TC-HLP-324 (arrival at the top) already test in isolation — here they're chained together on the *same* ticket in one continuous run, which neither existing TC does.

**Steps:**
1. Let the ticket's SLA breach at L1. Wait for the SLA monitor to run.
2. Confirm the first escalation lands the ticket at L2 (per TC-HLP-321), then **leave it untouched again** and let its (recalculated, per TC-HLP-327) deadline breach a second time at L2.
3. Wait for the SLA monitor to run again.
4. Confirm the second escalation lands the ticket at L3 — the top of this chain.
5. Check the ticket's own escalation history (per TC-HLP-326) once both hops have happened.

**Expected Result:**
- After the first breach: support level L1 → L2, escalation count = 1, reassigned to an L2 assignee, L2 notified (TC-HLP-321's own result, reconfirmed as the first link in this chain).
- After the second breach: support level L2 → L3, escalation count = 2 (not reset back to 1 or left at 1 — it must accumulate across both hops on the same ticket), reassigned to an L3 assignee, L3 notified.
- Once at L3 (the top, no Escalates to), a further breach behaves per TC-HLP-324 (notifies without climbing further) — this TC doesn't need to force a third breach to prove that again, just confirm the ticket is genuinely at the real top of the chain with nowhere left to go.
- The escalation history (TC-HLP-326) shows **both** hops as two distinct entries, each with its own correct from-level/to-level, from-assignee/to-assignee, and breach-deadline detail — not just the most recent one overwriting or hiding the first.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #14 run end-to-end on the real L1(Luna Blossom)→L2(Autumn Grace, Briar Sunset)→L3(Willow Belle) chain. First breach (08:11 AM): L1→L2, reassigned to Autumn Grace, L2 notified (BUG-HLP-019's captured email confirms "Total Escalations: 1"). Second breach (08:14 AM): L2→L3, reassigned to Willow Belle. The count genuinely **accumulates rather than resets** — confirmed two ways: the SLA Journey stages are explicitly labeled "Escalation #1" (L2) and "Escalation #2" (L3), and the SLA Overview header itself reads **"↑ Escalated 3×"** after the full run (the third being the admin-fallback hop from TC-HLP-324/301, not a reset). Third breach (08:16 AM) confirmed the ticket had genuinely reached the real top of the chain — L3's own configuration is "Escalation To: None (Last Level)" — and behaved exactly per TC-HLP-324 (admin fallback, no further climb). The escalation history (SLA Journey + Activity Log, per TC-HLP-326) shows all hops as fully distinct entries with correct from/to level, from/to agent, and breach-deadline detail for each — nothing overwritten.

---

### TC-HLP-329: An agent resolves and closes a ticket within its SLA window — no breach ever occurs, no escalation is ever triggered

**User Role:** Agent
**Priority:** High
**Precondition:** A ticket raised by a real customer (**must be customer-raised, not created directly by an Agent/Admin** — a ticket created by an Agent or Admin does not go through the customer's project-access-row SLA/Support-Level attachment at all, so it would never enter the real escalation flow this suite tests. Use `retest.customer1`, whose project-access row already carries Alpha Escalation Test SLA / L2). Alpha Escalation Test SLA's targets are 1 minute First Response / 1 minute Resolution — tight enough to control timing without a long real wait.

**Steps:**
1. As `retest.customer1`, raise a fresh ticket via her own portal (not via Agent/Admin New Issue).
2. As the L2 agent it lands on, reply to the ticket well within the 1-minute Response window (a genuine customer-facing reply, which per TC-HLP-297 also pauses the clock once sent).
3. Immediately after, resolve the ticket (Status → Resolved, then Closed) via the ticket's own Edit form, before any further deadline could be reached.
4. Check the ticket's SLA Status badge (list) and SLA Information panel (detail).

**Expected Result:**
- Neither the Response nor the Resolution deadline is ever recorded as breached — the ticket is resolved cleanly inside its SLA window.
- The SLA badge/panel shows a "met"/"resolved" state, not "Breached" at any point in its history.
- Escalation count stays at 0 — the ticket never had a reason to escalate, since it was handled before any deadline passed.
- No escalation email is ever sent for this ticket.

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, `autumn.grace`/Agent): **PASS.** Ticket #39 raised by `retest.customer1` via her own portal (enters at L2, per her project-access row — a ticket created directly by Admin/Agent does not attach any SLA at all, confirmed separately, so this had to be customer-raised). It stayed genuinely unassigned with no SLA clock running at all (per TC-HLP-291) until `autumn.grace` (L2) posted a real customer-facing Reply Note — this single action **simultaneously** assigned her, started the SLA (`SLA Started` + `Response deadline set: 08:09 AM`), and satisfied the First Response requirement (`✓ Responded At: 08:08 AM`, one minute inside the 1-minute Response Time target), auto-transitioning Status → Waiting for Customer Response and pausing the clock in the same instant. With the resolution clock now frozen (paused), set Status → Resolved → Closed via Edit with no time pressure. Final SLA Information panel: header **"✓ Completed"**, both Response (`✓Responded`) and Resolution (`✓Resolved`) show green, Activity Log reads `SLA Started → First Response Given → Ticket Resolved (SLA completed successfully)` — no breach anywhere, escalation count 0 (single "Initial Stage", no second stage). List badge independently confirms **"✓ Resolved"**. Exactly the clean, no-breach-ever outcome this TC specifies.

---

### TC-HLP-330: A ticket breaches once, escalates to the next Support Level, and is resolved there — no further breach or escalation follows

**User Role:** Agent (at the escalated-to level)
**Priority:** Medium
**Precondition:** A ticket raised by `retest.customer1` (Alpha Escalation Test SLA / L2, escalates to L3 per the existing L1→L2→L3 chain — TC-HLP-301). Left untouched so its 1-minute deadline passes once, triggering the real L2→L3 escalation (mechanism already proven in TC-HLP-321/299).

**Steps:**
1. As `retest.customer1`, raise a fresh ticket via her own portal — enters directly at L2.
2. Leave it completely untouched past its 1-minute deadline. Confirm the real SLA monitor breach-and-escalate cycle fires (L2 → L3, escalation count → 1), per TC-HLP-321's established mechanism.
3. As soon as it lands on L3, have that new assignee **immediately** resolve and close the ticket — before its freshly-recalculated L3 deadline (per TC-HLP-327) can also pass.
4. Check the escalation count, the ticket's final status, and the SLA Information panel's full history.

**Expected Result:**
- Exactly **one** escalation is recorded (L2 → L3) — the earlier breach that caused it, not reset or hidden by the later resolution.
- The ticket ends in Resolved/Closed status, resolved by the L3 assignee, with no further escalation attempted (since it was handled before the L3 deadline could also pass).
- The SLA Information panel's history (SLA Journey / Activity Log, per TC-HLP-326) still shows the one real escalation hop, alongside the ticket's eventual resolution — the resolution does not erase or overwrite the prior breach/escalation record.
- No second escalation email is ever sent (since no second breach occurs).

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, `autumn.grace` → `willow.belle`, Agent): **PASS**, with a real environment fix needed along the way. Ticket #40 raised by `retest.customer1` (enters at L2). This time `autumn.grace` assigned herself via the plain Edit form's Assignee field **without** posting a reply — this alone started the SLA clock (`SLA Started`, `Response deadline set: 08:13 AM`) without registering a First Response, leaving a genuine live countdown running (confirmed via TC-HLP-291/080's mechanism: assignment alone starts the clock, a reply is what satisfies it). Left genuinely untouched past the deadline. **Discovered Sidekiq + Redis were both down** (only Puma survives a container restart, per the standing environment note) — the ticket sat "⚠ Overdue" for several minutes with no escalation firing at all. Restarted Redis (`redis-server`) and Sidekiq (`bundle exec sidekiq -e production`) inside `redmine-docker-6-redmine-1`; both came up cleanly, all 3 cron jobs (`email_checker`/`sla_monitor`/`auto_close_tickets`) re-registered. The **sidekiq-cron scheduler's own internal poller thread** still crashes on boot with an unrelated `ArgumentError` (a known `connection_pool`/`sidekiq` version-mismatch bug in this image, present in old logs from prior sessions too, not something this session introduced) — meaning the periodic auto-fire genuinely does not run in this environment right now. Per this whole engagement's established practice (TC-HLP-321/095/299 all did the same), manually triggered `Helpdesk::SlaMonitorWorker.new.perform` once via `rails runner` to invoke the exact same breach-detection code the cron would run — this correctly found and processed 10 tickets overdue since the outage (including several older ones, unrelated side effects of the outage, not this TC), and for ticket #40 specifically: `[SLA][BREACH] Ticket #40 | response_breached = true` → `[SLA][ESCALATION] Ticket #40 | L2 → L3 | Assignee: autumn.grace → willow.belle`, exactly the expected single L2→L3 hop. Logged in as `willow.belle` (the new L3 assignee) and resolved the ticket via Edit before running the monitor again (so no second breach/escalation could process). Final SLA Information panel: **"↑ Escalated 1×"** — exactly 2 stages, 1 escalation, Activity Log intact with all 4 real events (`SLA Started → Response SLA Breached → Escalated → L3 → Ticket Resolved`), nothing overwritten. **Secondary finding, reproduces BUG-HLP-033 again in a new shape**: the detail panel's own overall-status badge still reads **"⚠ Needs Attention"** even though Status is genuinely Resolved — consistent with BUG-HLP-033's already-documented root cause (the panel's `overdue` check fires on raw "deadline < now" before ever reaching its `done`/resolved branch, so a ticket resolved *after* its own deadline had already passed keeps showing an urgency badge). The **list view**, by contrast, correctly shows **"✓ Resolved"** for the same ticket — the same list-vs-panel disagreement BUG-HLP-033 already covers, not a new bug, but a second independent real-world reproduction of it. No new bug filed for this — folded into BUG-HLP-033's existing evidence.

---

### TC-HLP-331: Admin can resolve/close a ticket in either of the above scenarios, with no different behavior than an Agent doing it

**User Role:** Admin
**Priority:** Low
**Precondition:** Reproduce either TC-HLP-329 (resolved before any breach) or TC-HLP-330 (resolved immediately after one escalation) on a fresh `retest.customer1` ticket, but have **Admin** — not the assigned Agent — perform the actual resolve/close step.

**Steps:**
1. Raise a fresh ticket as `retest.customer1` and bring it to the same point as TC-HLP-329 or TC-HLP-330 (either "about to be resolved with zero breaches" or "just escalated once, about to be resolved at the new level").
2. Log in as Admin (not the ticket's assigned Agent) and perform the resolve/close action directly.
3. Confirm the result matches the Agent-driven version exactly — same final status, same SLA state, no permission error and no different code path taken.

**Expected Result:**
- Admin can resolve/close the ticket with no different outcome than if the assigned Agent had done it — same SLA badge/panel state, same escalation-count/history, no error or blocked action.

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, Admin): **PASS.** Reproduced the TC-HLP-329 flavor (resolved with zero breaches). Ticket #41 raised by `retest.customer1` (enters at L2); `autumn.grace` replied immediately (assign + first-response + pause, same mechanism as TC-362) — no breach. Logged in as **Admin** (not `autumn.grace`, the actual assignee) and performed Status → Resolved → Closed directly via the ticket's Edit form — no permission error, no different form fields, no blocked action; Admin sees the exact same Status transition options (In Progress/Resolved/Feedback from Waiting for Customer Response) any Agent would. Final SLA Information panel: **"✓ Completed"**, Response `✓Responded` and Resolution `✓Resolved` both green, Activity Log `SLA Started → First Response Given → Ticket Resolved` — byte-for-byte the same shape as TC-362's own result. **One minor observed-behavior note, not a bug**: the Activity Log's "Agent/By" column for the "Ticket Resolved" event still reads "Autumn Grace" (the ticket's current Assignee) rather than "Admin" (who actually clicked Submit) — the log attributes the event to the ticket's assignee at the time, not literally whoever performed the edit. Confirms Admin can resolve/close a ticket with fully identical SLA-completion behavior to a regular Agent.

---

### TC-HLP-332: A ticket climbs every level of its escalation chain (all the way to the top/admin-fallback), and Admin then actively resolves it — the full multi-hop history survives, and the final SLA state reflects it correctly

**User Role:** Admin
**Priority:** Medium
**Precondition:** A ticket raised by `retest.customer1` (Alpha Escalation Test SLA / L2, chain L2 → L3 → no further level). Left completely untouched through **two** consecutive breaches so it genuinely climbs every level available to it — not just the single hop TC-HLP-330 already covers.

**Steps:**
1. As `retest.customer1`, raise a fresh ticket via her own portal — enters at L2.
2. Leave it completely untouched. Let its L2 deadline breach and escalate to L3 (per TC-HLP-321/363's mechanism).
3. Leave it untouched again at L3. Let its L3 deadline also breach — since L3 has no further Escalates-to target, this should trigger the admin-fallback path (per TC-HLP-324/301), reassigning the ticket to Admin with a Critical Breach Alert, not a third support-level hop.
4. Now, as **Admin**, actively resolve and close the ticket (a real action — distinct from TC-HLP-325, which only ever let the automatic fallback reassignment happen and stopped there without anyone resolving anything).
5. Check the full SLA Information panel: SLA Journey (every stage), Activity Log (every event), and the overall status badge — both on the detail page and the ticket list.

**Expected Result:**
- The ticket genuinely climbs every level in its chain: L2 → L3 → admin-fallback (2 escalations recorded, not reset or capped early).
- The admin-fallback stage behaves per TC-HLP-324/301 (Critical Breach Alert sent, Assignee reassigned to Admin, no further escalation attempted since there's nowhere left to go).
- Admin can then actively resolve/close the ticket with no permission issue, same as TC-HLP-331 already confirmed for a single-hop case.
- The final SLA Information panel preserves the **complete** history — all stages (Initial L2, Escalation #1 → L3, admin-fallback) individually intact, not overwritten or collapsed by the later resolution.
- The overall status badge (detail panel and list) correctly reflects a ticket that is now Resolved/Closed, consistent with (or, per BUG-HLP-033's already-known pattern, possibly inconsistent with) the list's own badge.

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, `autumn.grace` → `willow.belle` → Admin): **PASS on the escalation/resolution mechanics; reproduces BUG-HLP-033 again, in its sharpest form yet.** Ticket #42 raised by `retest.customer1` (enters at L2). Assigned to `autumn.grace` via Edit-form only (no reply, same technique as TC-363) so the response deadline genuinely ran. Manually triggered `Helpdesk::SlaMonitorWorker.new.perform` twice, with a real wait between each so both deadlines had genuinely passed: **first breach** → `[SLA][ESCALATION] Ticket #42 | L2 → L3 | Assignee: autumn.grace → willow.belle` (Escalation #1, exactly per TC-HLP-321/363's mechanism); **second breach** (L3's freshly-recalculated deadline also left untouched) → `[SLA][ADMIN] PATH B: Admin fallback — no further escalation level` (`Ticket #42 | Last Level: L3 | Assigned To: admin`), a real Critical Breach Alert delivered to `admin@test.local` — exactly TC-HLP-324/301's already-documented mechanism, confirming this ticket climbed **every** level available to it (L2 → L3 → admin-fallback), not just one hop. Checked the SLA Information panel *before* resolving: **"↑ Escalated 2×" / "✗ SLA Missed"**, 3 stages, correctly showing the full climb. Logged in as **Admin** (the ticket's current assignee via the fallback, but this is Admin actively choosing to resolve — not the passive/automatic reassignment TC-HLP-325 already covers) and set Status → Resolved → Closed via Edit — no permission issue. **Final SLA Information panel preserves the complete history perfectly**: still 3 stages / 2 escalations, all 6 Activity Log events intact (`SLA Started → Response SLA Breached (L2) → Escalated → L3 (Willow Belle) → Response SLA Breached (L3) → Escalated → L3 (Redmine Admin) → Ticket Resolved`) — nothing overwritten or collapsed by the later resolution, exactly as this TC's Expected Result requires. **However, the overall status badge itself still reads "↑ Escalated 2×" / "✗ SLA Missed" / 🚨 "Needs Immediate Attention"** even though Status is genuinely Closed and the stage's own Response SLA row correctly shows "✓Resolved" — the sharpest reproduction of BUG-HLP-033 yet: once a ticket's `response_breached` flag has ever been set (twice, in this case), the detail panel's `overall_health` priority order checks `any_breached` before ever reaching its `done`/resolved branch, so the panel permanently displays a breach/urgency badge even for a ticket that is fully, deliberately, correctly closed. The **list view**, by contrast, correctly shows **"✓ Resolved"** for the same ticket at the same moment — confirmed via direct comparison. Not a new bug — folded into BUG-HLP-033's existing evidence as a third, and clearest, independent reproduction (this time surviving a full 2-escalation chain, not just a single hop).

---

### TC-HLP-333: Escalating into a Support Level with 2+ eligible agents assigns exactly one, determined by a fixed rule (not random/round-robin), and only that agent is notified

**User Role:** N/A (system-driven, verified by Admin)
**Priority:** Medium
**Precondition:** L3 configured with **two** Support Assignees (not the single-agent case) — distinct from TC-HLP-323, which tested a multi-agent level on an L1→L2 hop; this TC specifically targets **L2 → L3** as asked. L3 assignees: `willow.belle` (User ID 11, pre-existing) and a newly-created fixture `aurora.wren` (User ID 30, added to this project as Agent and to L3 specifically for this TC, since no other unassigned agent existed to pair with Willow Belle — everyone else is already on L1 or L2, and a user can only hold one Support Level per project).

**Steps:**
1. Read the actual source (not just observed behavior) for the escalation agent-selection rule, to get a ground-truth answer alongside the live behavioral test.
2. Raise ticket A as `retest.customer1` (enters at L2). Leave it untouched past its L2 deadline and let it breach/escalate into the now-multi-agent L3.
3. Check which of the two L3 agents ticket A was assigned to, and which one (if any) received the escalation email.
4. Raise a second ticket B the same way, let it also breach/escalate L2→L3, and check which agent it lands on this time.
5. Compare A and B's results: same agent both times (deterministic/fixed-order), or did it vary (random/round-robin/least-loaded)?

**Expected Result:**
- Exactly one agent is selected from L3's two configured assignees each time — never both, never neither.
- Only the selected agent receives the escalation notification email — confirmed via server log recipient line (established evidence method from TC-HLP-321/302), not requiring a live mailbox open.
- The two-ticket comparison (plus the source code) determines which real rule governs the pick: random, round-robin, workload-based, configured-priority-order, or something else — and that determination is recorded as fact, not left as "any pick is acceptable" (TC-HLP-323's own Expected Result explicitly left this open; this TC exists specifically to close that open question for the L2→L3 pairing).

- **CONFIRMED LIVE 2026-09-03** (Local, redmine-docker-6, admin): **FAIL — filed as BUG-HLP-034. Selection rule identified precisely, both from source and live behavior, and it is not an acceptable one.** **Source-level ground truth** (`rf_issue_sla_status.rb#escalate_to_next_level!`, line 222): `new_assignee_id = next_level.support_assignees.any? ? next_level.support_assignees.first.id : nil` — the code takes `.first` off `RfSupportLevel#support_assignees`, which is defined (`rf_support_level.rb`) as `User.where(id: support_assignee_array)` with **no `.order()` clause at all**. There is no random selection, no round-robin counter, no workload/least-loaded lookup anywhere in this method — it is a plain `.first` on an unordered ActiveRecord query, which in practice (MySQL, simple `WHERE id IN (...)` on the primary key) returns rows in ascending **user ID** order. This means the real rule is: **the escalation always picks the same agent — whichever configured assignee has the lowest Redmine user ID — every single time, for as long as the level's assignee list doesn't change.** Not random, not round-robin, not based on workload or the order assignees were added in the UI. **Live confirmation, two separate tickets**: added `aurora.wren` (a brand-new fixture user, User ID 30 — no other agent on this project was free to pair with Willow Belle, since everyone else already holds L1 or L2 and a user can only hold one Support Level per project) as a second L3 assignee alongside the pre-existing `willow.belle` (User ID 11 — the lower ID). Ticket A (**#44**) and Ticket B (**#45**), both raised by `retest.customer1` (enters at L2), both assigned to `autumn.grace` via Edit-form only (no reply) so their response deadlines genuinely ran, both left untouched and pushed through the real `Helpdesk::SlaMonitorWorker.new.perform` breach cycle in the same run. **Both tickets landed on Willow Belle (the lower ID), not Aurora Wren**: `[SLA][ESCALATION] Ticket #44 | L2 → L3 | Assignee: autumn.grace → willow.belle` and `[SLA][ESCALATION] Ticket #45 | L2 → L3 | Assignee: autumn.grace → willow.belle` — identical outcome both times, confirming the pick is genuinely fixed/deterministic, not random or rotating, exactly matching the source-level prediction. Re-confirmed via each ticket's own SLA Information panel afterward: both show **Current Assignee: Willow Belle**, both "↑ Escalated 1×". Re-ran the monitor once more immediately after — neither ticket was touched again (their new L3 deadlines hadn't yet passed), confirming no accidental double-escalation occurred while gathering this evidence. Per the code path (`send_escalation_notification` reads `issue.assigned_to` — a single value — as the sole recipient), only Willow Belle could have been notified for either ticket, consistent with TC-HLP-323's already-established "notification follows the one selected assignee only" behavior. **Filed as BUG-HLP-034 (Medium), per direct user correction of an initial too-lenient framing**: a Support Level with multiple configured agents will, in practice, always route every single escalation to the same one agent (the lowest-ID one) and never involve the others at all, unless that agent is later locked/deactivated or removed from the level. `HELPDESK_USER_GUIDE.md` §10's own canonical worked example illustrates every level of a chain with **two** named agents — multi-agent levels are the documented normal case, not an edge case — so a level configured with 2+ agents that never actually distributes escalated work across them defeats the visible purpose of configuring more than one assignee. See `bugs/open/BUG-HLP-034.md` for full detail (source excerpt, live evidence, screenshots).

---

### TC-HLP-334: Creating a holiday — single day and multi-day range — and attaching it to an SLA

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** None.

**Steps:**
1. Helpdesk › Settings › Holidays › New Holiday — create a single-day holiday (start = end)
2. Create a second holiday with start date and end date several days apart
3. Attach both to an SLA's Holidays field, Save

**Expected Result:**
- The multi-day closure saves as **one** entry with a date range, not multiple entries
- Both holidays show correctly on the SLA after saving

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): PASS. Created "Alpha Founders Day 2026" (single-day, Start=End=09/07/2026) and "Alpha Winter Break 2026" (Start 12/24/2026, End 12/31/2026 — 8 days apart). The multi-day holiday confirmed saving as **one** row in the Holiday list (`12/24/2026 | 12/31/2026`), not split into multiple entries. Attached both to "Alpha Priority SLA" via its Holiday multiselect (Select All), Save — the SLA detail page's Holiday field correctly shows `Alpha Founders Day 2026, Alpha Winter Break 2026`, both present.

---

### TC-HLP-335: Creating a Holiday with only the required fields succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None. TC-HLP-334 already fills only Name/Start/End (no Description) so this is largely a formalization of what TC-097 already demonstrates — recorded as its own case so "Description is genuinely optional" is an explicit, traceable claim rather than an inferred side-effect of another TC's steps.

**Steps:**
1. Helpdesk › Settings › Holidays › New Holiday
2. Fill only Name, Start Date, and End Date — leave Description blank
3. Save

**Expected Result:**
- Save succeeds with no required-field error on Description
- The holiday appears in the list/detail with Description empty

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS** — this is exactly what TC-HLP-334's own creation already demonstrated. Both "Alpha Founders Day 2026" (single-day) and "Alpha Winter Break 2026" (multi-day range) were created with only Name/Start Date/End Date filled, Description left blank, and both saved cleanly with no required-field error and appear correctly in the Holiday list.

---

### TC-HLP-336: Creating a Holiday with Description also filled in the initial Save

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None. Complements TC-HLP-337, which only proves Description is editable via Edit on an already-existing holiday.

**Steps:**
1. New Holiday
2. In one Save: fill Name, **Description**, Start Date, and End Date
3. Save, then open the holiday to confirm every field

**Expected Result:**
- Description saves correctly on the very first Save, not only when added later via Edit

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Created holiday #3 "Alpha Spring Festival 2027" (Start 03/20/2027, End 03/22/2027) with Description "Company-wide spring festival closure — created for TC-HLP-336." filled in the same Create submission. Reopened the holiday's detail page immediately after: Description shows the exact text entered, alongside the correct Name/Start/End — saved correctly on the very first Save.

---

### TC-HLP-337: Editing a Holiday updates Name, Description, Start Date, and End Date

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** An existing holiday.

**Steps:**
1. Open the holiday's Edit form
2. Change Name, **Description**, Start Date, and End Date in one save
3. Save, then reopen Edit to confirm each field independently

**Expected Result:**
- Every field saves the new value entered
- **Description** is checked here specifically — it's a real field on this form (confirmed live 2026-08-31, `rf_helpdesk_holiday[description]`) that no existing TC exercises directly; TC-HLP-334 only ever fills Name/Start/End
- If the edited holiday is currently attached to an SLA's Holidays field, confirm the SLA still reflects the updated name/dates afterward rather than a stale reference

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Edited holiday #3 changing all four fields in one save: Name → "Alpha Spring Festival 2027 (Renamed)", Description → "Updated description for TC-HLP-337 — all fields changed in one save.", Start Date 03/20→03/25/2027, End Date 03/22→03/27/2027. Reopened Edit independently afterward — all four fields show the new values, confirmed via the form's own pre-populated textboxes (not just the read-only detail view).

---

### TC-HLP-338: Editing a Holiday to change only Name/Start/End leaves its already-set Description untouched

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** An existing holiday with a non-empty Description already saved — e.g. the holiday from TC-HLP-336 (Description filled at Create) or the holiday left over from TC-HLP-337's own edit (Description filled via a prior Edit). TC-HLP-337 changes Name, Description, Start Date, and End Date together in the same save, so it can't show whether Description survives a save that never touches it at all — this TC isolates that specific case.

**Steps:**
1. Open the Edit form of the holiday that already has a Description set
2. Note the exact current Description text, then change only Name and/or Start Date/End Date — do not click into or modify the Description field at all
3. Save
4. Reopen Edit and inspect Description

**Expected Result:**
- Save succeeds; Name/Start Date/End Date show the new values entered
- Description is byte-identical to what it was before this Edit — not blanked, not reset to empty. This is the real risk being checked: if the Edit form's Description field isn't correctly pre-populated with the existing rich-text content before the form renders, a save that only intends to touch Name/dates can silently resubmit an empty Description and wipe it — a partial-update bug distinct from TC-HLP-337's all-fields save, which touches every field on purpose and so can never expose this failure mode
- If the edited holiday is attached to an SLA's Holidays field (per TC-HLP-334's attach-to-SLA mechanism), confirm the SLA still shows the updated Name correctly and the attachment itself survived the edit

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS — no partial-update data loss.** On the same holiday #3 (Description already set to "Updated description for TC-HLP-337...' from the prior edit), changed only Name → "Alpha Spring Festival 2027 (Renamed Again)" and Start Date → 03/26/2027, deliberately never clicking into the Description field, then Save. Reopened Edit: Name and Start Date show the new values, End Date correctly unchanged (03/27/2027, untouched this time), and **Description remained byte-identical** to its pre-edit value — the Edit form's Description textbox was correctly pre-populated before render, so the partial save did not wipe it.

---

### TC-HLP-339: SLA list search, Status filter, Apply Filters, and Clear Filters all work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** Multiple SLAs exist, at least one Active and at least one Inactive (deactivated via the list-level toggle).

**Steps:**
1. Open the SLA list, type a known SLA's name into **Search SLAs...**, click **Apply Filters**
2. Clear the search box, instead set the **Status** dropdown to **Active only**, click **Apply Filters**
3. Repeat with **Inactive only**
4. Click **Clear**

**Expected Result:**
- Step 1: only the matching SLA(s) are shown
- Step 2: only Active SLAs are shown
- Step 3: only Inactive SLAs are shown
- Step 4: both the search box and Status dropdown reset, and the full unfiltered list returns
- Search and Status filter can be combined (e.g. a search term plus Active only) and both conditions apply together

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS on every part.** Deactivated a disposable SLA ("Alpha CRUD Test SLA") to have a real Active/Inactive mix (4 active, 1 inactive). Step 1: searching "CRUD Test SLA Full" + Apply correctly showed only the one matching row. Step 2: Status=Active only + Apply showed exactly the 4 active SLAs, correctly excluding the deactivated one. Step 3: Status=Inactive only + Apply showed exactly the 1 deactivated SLA, excluding all 4 active ones. Step 4: Clear reset both the search box and Status dropdown to defaults and returned the full unfiltered 5-row list. Combined filter: search "CRUD" + Active only together correctly returned only "Alpha CRUD Test SLA Full (Required-Only Edit)" (matches search AND active) — the other CRUD-named SLA (matches search but Inactive) was correctly excluded, confirming both conditions apply as AND, not OR.

---

### TC-HLP-340: Support Level list search, Status filter, Apply Filters, and Clear Filters all work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** Multiple support levels exist on a project, at least one Active and at least one Inactive.

**Steps:**
1. Open a project's Helpdesk → Settings → Support Level tab
2. Search by a known level's name, click **Apply Filters**
3. Clear search, set **Status** to **Active only**, then **Inactive only**, applying each time
4. Click **Clear**

**Expected Result:**
- Same behavior as TC-HLP-339, scoped to this project's support levels only
- The list stays scoped to the current project throughout — no other project's support levels ever appear regardless of filter state

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS on every part.** Temporarily deactivated L3 to get a real mix. Search "L1" + Apply correctly showed only L1 (not L2/L3). Status=Inactive only + Apply showed exactly L3 (the deactivated one), excluding L1/L2. Cleared filters afterward — full unfiltered list showed exactly L1/L2/L3 (3 rows) throughout every filter state tried, never Helpdesk QA Beta's own "AB-L1" — confirms project scoping holds regardless of filter state. Reactivated L3 afterward to restore the live chain.

---

### TC-HLP-341: Holiday list search and Apply/Clear Filters work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** Multiple holidays exist (single-day and multi-day ranges).

**Steps:**
1. Open a project's Helpdesk → Settings → Holiday tab
2. Search by a known holiday's name, click **Apply Filters**
3. Click **Clear**

**Expected Result:**
- Search correctly narrows to the matching holiday(s)
- Clear resets the search box and restores the full unfiltered list
- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Helpdesk QA Alpha has 2 real holidays: "TC-HLP-296 Holiday-Skip Test Day" and "Alpha Winter Break 2026". Searched "Winter Break" + Apply Filters — correctly showed only "Alpha Winter Break 2026", excluding the other holiday. Clicked Clear — search box emptied and the full unfiltered 2-row list returned (both holidays present again). Matches the Expected Result exactly on both steps.

**Revision History:** the 2026-08-24 CONFIRMED LIVE note previously on this line never actually tested Search/Apply/Clear at all — it only recorded a different, tangential observation (Holiday's filter bar has no Status dropdown, unlike SLA/Support Level/Organization/Product). That observation is still true and worth keeping, so it's preserved as a separate note below rather than discarded, but this TC's own Search/Apply/Clear claim had never actually been verified until today — caught during a full coverage audit prompted by a direct user question ("are you tested this suite completely??"), which found this TC carried a CONFIRMED LIVE marker whose evidence didn't match its own Expected Result. Re-ran it properly above.

**Separate note (2026-08-24 finding, still valid):** Holiday's filter bar has **only** Search + Apply Filters + Clear — no Status (Active/Inactive) dropdown at all, unlike SLA/Support Level/Organization/Product. Consistent with Holiday having no Active/deactivate concept in this plugin.

---

## Negative Cases

---

### TC-HLP-342: A customer with no SLA on their project-access row gets no SLA at all

**User Role:** Agent
**Priority:** High
**Precondition:** A customer whose project-access row has no SLA selected.

**Steps:**
1. This customer raises a ticket; assign it

**Expected Result:**
- The ticket shows **No SLA** — there is no fallback to a project/global default for a customer-raised ticket (unlike agent-raised tickets, which do fall back)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **This TC's own precondition cannot actually be constructed — the real behavior is stronger than either the TC or the plugin memory's own prior notes assumed.** Attempted to create a customer's project-access row on Helpdesk QA Alpha with SLA left at "None" while Support Level was set to a real value (L1): refused with **"SLA Policy is required."** Tried the reverse — SLA set to a real value, Support Level left at "None": refused with **"Support Level is required."** Tried leaving both at "None": refused with both errors together. **There is no way, via the Customer New/Edit form, to get a project-access row that has a real Support Level but no SLA (or vice versa) — the two fields are jointly mandatory the moment a Project is selected on that row.** The only way for a customer to have "no SLA" on a project is to have **no project-access row for that project at all** — meaning they'd have no entitlement to raise a ticket there through the portal in the first place, which makes this TC's literal scenario (a customer-raised ticket with no SLA) unreachable through the normal customer-portal flow. Recording this as the confirmed real behavior rather than forcing an artificial workaround — this refines the existing `HELPDESK_MEMORY.md` Known Quirk (previously only Support Level was confirmed hard-required; SLA is equally hard-required, not previously stated).

---

### TC-HLP-343: Creating an SLA with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** An SLA named "Standard" already exists.

**Steps:**
1. Attempt to create another SLA also named "Standard"

**Expected Result:**
- Save is refused with a clear duplicate-name message

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Attempted to create a second SLA named "Alpha Standard SLA" (Helpdesk QA Alpha's existing real SLA), with valid First Response/Resolution times. Save refused outright: **"Name has already been taken."**

---

### TC-HLP-344: Creating a support level with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A support level named "L1" already exists (names unique across the whole install).

**Steps:**
1. Attempt to create another support level also named "L1"

**Expected Result:**
- Save is refused with a clear duplicate-name message

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Attempted to create a second Support Level named "L1" (Helpdesk QA Alpha's existing L1) with a unique Level Order (9) and a valid assignee. Save refused outright: **"Name has already been taken."** — confirms names are unique across the whole install (not just per project/per level-order), matching the TC's own precondition note.

---

### TC-HLP-345: Creating a support level with zero assignees is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Create a new support level, leave Support assignees empty, attempt Save

**Expected Result:**
- Save is refused — at least one assignee is required

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Created a new Support Level ("Alpha Zero Assignee Test Level", Level Order 9, valid Name) but left Support Assignees empty and submitted. Save refused with **"Please select at least one Support Assignee."**

---

### TC-HLP-346: A user already on one support level cannot be added to another level in the same project

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** User X is an assignee on L1 of Project A.

**Steps:**
1. Create/edit L2 of Project A, open the assignee dropdown

**Expected Result:**
- User X is not offered — the dropdown excludes anyone already assigned to another level in the same project

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** On Helpdesk QA Alpha, `luna.blossom`/`autumn.grace`/`briar.sunset`/`willow.belle` are already assignees on L1/L2/L3 respectively. Opened a fresh New Support Level form and inspected the backing `<select name="support_level[support_assignee_array][]">` directly (`browser_evaluate`): the **only** option offered was `no.perm.reporter` (a project Member not currently on any level) — all four already-assigned users were excluded entirely from the dropdown's option list, not merely disabled. Confirms the exclusion is a real, server-rendered filter on "already assigned to another level in this project," not a client-side cosmetic disable.

---

### TC-HLP-347: Creating a holiday with a duplicate name is refused, even across different calendars

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A holiday named "Christmas Day" already exists.

**Steps:**
1. Attempt to create another holiday also named "Christmas Day" (e.g. intending it for a different calendar/year)

**Expected Result:**
- Save is refused — holiday names are unique across the **whole install**, not per calendar (must be disambiguated, e.g. "US Federal 2026 - Christmas Day")

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Attempted to create a second holiday named "Alpha Founders Day 2026" (identical to the existing one), deliberately using completely different dates (09/07/2027 instead of 09/07/2026 — a full year apart, simulating "a different calendar/year"). Save refused outright: **"Name has already been taken."** — confirms the uniqueness is purely on Name, with no exception for differing dates.

---

## Edge Cases

---

### TC-HLP-348: Deactivating an SLA stops it being offered, but doesn't affect tickets already using it

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** An SLA already in use on at least one ticket.

**Steps:**
1. Deactivate the SLA
2. Attempt to select it when creating a new customer project-access row
3. Check the existing ticket that already uses it

**Expected Result:**
- Step 2: the deactivated SLA is not offered
- Step 3: the existing ticket's SLA and deadlines are unaffected

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** "Alpha Standard SLA" is already in use on ticket #16. Baseline recorded first: SLA "Alpha Standard SLA", Deadline 09/01/2026 10:00 AM (UTC). Deactivated it via the list-level Active toggle (unchecked, confirmed). Step 2: opened New Customer → Project Access → Project "Helpdesk QA Alpha" — the SLA Name dropdown no longer offers "Alpha Standard SLA" at all (only the other 4 active SLAs listed). Step 3: reopened ticket #16's SLA Information tab — still shows "Alpha Standard SLA" attached, same Deadline (09/01/2026 10:00 AM UTC), unaffected by the deactivation. Reactivated the SLA afterward to restore state for other fixtures depending on it (`alpha.customer`, ticket #16).

---

### TC-HLP-349: Deactivating a support level stops it being offered and stops escalation into it

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** L2 in a chain L1→L2→L3, with L1 escalating to L2.

**Steps:**
1. Deactivate L2
2. Attempt to select L2 when creating/editing a customer's project-access row
3. Force an escalation scenario from L1

**Expected Result:**
- Step 2: L2 is not offered
- Step 3: escalation from L1 does not land on the deactivated L2 — confirmed via `HELPDESK_USER_GUIDE.md`'s Support Level table, Active row: "Inactive levels are not offered and are not escalated into." (the guide does specify this, contrary to this TC's own original uncertainty)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **Step 2 PASS, Step 3 FAIL.** Deactivated L2 (Autumn Grace, Briar Sunset) on the live L1→L2→L3 chain. Step 2: opened New Customer → Project Access → Project Alpha — Support Level dropdown correctly excludes L2 (only "L1"/"L3" offered). Step 3: created a fresh ticket (#19), assigned to Luna Blossom at L1 (fast SLA), let its deadline pass — the SLA monitor escalated it straight into the still-deactivated L2 exactly as if it were active: reassigned to Autumn Grace, escalation count incremented, a real notification email delivered to her. **Direct answer to "does it skip a deactivated mid-chain level and land on the next active one instead": No — it does not skip past L2 to L3. It lands directly on the deactivated L2, exactly as if L2 were still active.** Filed as **BUG-HLP-021** (Medium) — see `bugs/open/BUG-HLP-021.md`. L2 reactivated afterward to restore the chain for other fixtures.

---

### TC-HLP-350: A second project's support-level assignee dropdown is independent of the first

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Support levels already created on Project A with their own assignees.

**Steps:**
1. Create a support level on Project B
2. Open its assignee dropdown

**Expected Result:**
- Project B's dropdown is populated with Project B's own members, entirely independent of Project A's assignments

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** Helpdesk QA Beta's only prior Member (`luna.blossom`) was already the assignee on Beta's own existing level (AB-L1), so she was correctly excluded there too (per TC-HLP-346's own rule) — to properly isolate "is this project's dropdown independent," added a fresh Beta Member (`no.perm.reporter`, role Agent, not used on any level anywhere) first. Opened a New Support Level form on Beta (project id 2) and inspected the backing `<select>` directly: the **only** option offered was "No Perm Reporter" — none of Alpha's agents (Autumn Grace, Briar Sunset, Willow Belle, Luna Blossom) appeared at all, confirming the dropdown is genuinely scoped to this project's own members only, entirely independent of Alpha's own assignee list.

---

### TC-HLP-351: "Escalation To" should not need to be manually configured when Level Order already defines a sequential escalation chain

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** An existing Support Level chain with 3+ levels (L1 Order 1 → L2 Order 2 → L3 Order 3).

**Steps:**
1. Open L1's Edit form and inspect the **Level Order** field and the **Escalation To** field together.
2. Determine whether Escalation To's value is ever automatically derived from Level Order, or whether it must always be manually picked regardless of what Level Order already implies.

**Expected Result:** Per the user's stated requirement: since Support Levels already carry an explicit Level Order (L1=1, L2=2, L3=3 …), the escalation sequence should be automatically determined by that order — L1 escalates to L2, L2 to L3, and so on, with the last (highest-order) level having no further target. The **"Escalation To"** field should not need to be present/required in the Support Level create/edit form when escalation is meant to simply follow Level Order in sequence — a user should not have to manually configure a value the order can already determine. (Skip-level configuration, e.g. L1 escalating directly to L3, is not the concern this TC is testing — the concern is specifically that the *sequential, common* case still forces a manual field.)

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **FAIL — Escalation To is a separate, always-required, never-auto-derived field.** Opened L1's Edit form (`/projects/1/rf_support_levels/1/edit`). `Level Order *` is a plain required number input (currently `1`). `Escalation To` is a **separate required** `<select>` (`"None (Last Level)"`, `"L2 (Order: 2)"` (selected), `"L3 (Order: 3)"`) that must be explicitly picked — nothing about its value is computed from Level Order automatically. The form's own inline help text confirms this is by design: *"Escalation can only be to higher level support (based on Level Order). For example, Level Order 1 can escalate to Level Order 2 or 3."* — Order is used only to **restrict which options Escalation To may pick from**, never to auto-populate it. This means every level in a chain requires an extra manual step even for the ordinary sequential case (L1→L2→L3, one step at a time), creating avoidable room for user error (a level could be left with no Escalation To set at all, silently never escalating, or an admin could pick an unintended skip-level target by mistake). **Filed as BUG-HLP-025** (Medium) — see `bugs/open/BUG-HLP-025.md`.

- **CONFIRMED LIVE 2026-09-10** (Local, redmine-docker-6, admin) — **PASS, re-verified after developer fix (prod #119772).** Per the developer's own fix note: Escalation To now auto-pre-fills with the next level by Order when left untouched, an already-configured level's saved value is not silently changed, and manual override to a different/skip-level target (including "None") still works. Re-tested against the existing "Description Max Length Test" level (Order 96, previously "None (Last Level)"): opening its Edit form showed the next level by Order ("SSSS…", Order 98) pre-selected instead of "None"; saving **without touching** the field persisted that value genuinely (confirmed on the Support Levels list afterward, not just a client-side artifact). Separately verified L1 (already configured to L2) is left unchanged when its Edit form is saved untouched. Manual override to "None (Last Level)" also re-confirmed working (saves exactly what's picked). All three conditions of the fix hold — the sequential case documented in this TC's Expected Result no longer requires a manual step. Environment restored ("Description Max Length Test" reset to "None (Last Level)" afterward). Correction: an earlier same-day retest pass had explicitly *selected* "None" and scored this FAIL again — that exercised the manual-override path, not the actual untouched-field auto-fill path the fix addresses; that verdict is superseded by this one.

**Revision History:**
- **2026-09-01, original pass**: framed as "is requiring both fields a redundant UX/design issue, or does Escalation To support genuine non-linear (skip-level) chains?" and concluded **not a bug** — Order gates eligibility, Escalation To is the real routing pointer, and skip-level chains are real intentional functionality.
- **2026-09-01, corrected same day per explicit user direction**: the user clarified skip-level escalation was never the concern being raised — the concern is that Escalation To must be **manually** configured even for the ordinary sequential case that Level Order alone already fully determines. Title, Expected Result, and evidence rewritten to test and assert this corrected requirement; re-scored **FAIL**; filed as **BUG-HLP-025**.
- **2026-09-10, retested after developer fix**: re-scored **PASS** — see CONFIRMED LIVE 2026-09-10 above. BUG-HLP-025 confirmed fixed and moved to `bugs/closed/`.

---

### TC-HLP-352: A ticket outside SLA working hours/days does not consume SLA time

**User Role:** Agent
**Priority:** High
**Precondition:** An SLA with working hours 09:00–18:00 Mon–Fri; a ticket sitting assigned overnight or over a weekend with no action taken.

**Steps:**
1. Leave the ticket untouched from Friday 18:00 to Monday 09:00
2. Check the remaining time on the deadline at Monday 09:00

**Expected Result:**
- No SLA time was consumed during the non-working window — remaining time at Monday 09:00 equals remaining time at Friday 18:00

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS**, using the same TC-HLP-295 evidence (ticket #20, "Alpha Working-Hours-Skip Test SLA", Working Days = Friday only). Assigned Tuesday 10:34 AM UTC with a 30-minute Response Time — if the ~3 non-working days (Tue/Wed/Thu) had consumed any time at all, the deadline would already be long past by the time Friday's window opened. Instead the full, untouched 30 minutes were correctly applied starting at Friday's own window open (09:00 → deadline 09:30) — confirming the non-working days were fully excluded from consumption, not just delayed-but-still-counted.

**Follow-up note, 2026-09-01/02**: an independent coverage audit correctly flagged that this evidence, like TC-HLP-295's, only ever assigned the ticket entirely **outside** a working period to begin with (a clock that never started before the gap) — it never proved that a clock **already genuinely ticking** with partial consumption preserves that consumption across a non-working gap, which is this TC's own literal framing ("leave the ticket untouched from Friday 18:00... remaining time at Monday 09:00 equals remaining time at Friday 18:00", implying the clock was already running beforehand). **TC-HLP-356 has since closed this exact gap directly**: a ticket assigned mid-window, genuinely consuming real minutes before the window closed, correctly carried only its unconsumed remainder across a full week-long gap (deadline landed at next-Tuesday-open + ~71 min, decisively not the "fresh full allotment" alternative of next-Tuesday-open + 300 min). This TC's own claim is now genuinely, separately verified, not just inferred from a substitute scenario.

---

### TC-HLP-353: A locked agent is never assigned a ticket by escalation, even while still listed as a Support Level's assignee — and locking an agent does not automatically remove them from that list

**User Role:** Admin
**Priority:** High
**Precondition:** A Support Level (L2) with two Support Assignees, `autumn.grace` and `briar.sunset`; an L1→L2 chain (e.g. "Alpha Escalation Test SLA", 1-minute Response Time) that would otherwise pick either of them on escalation.

**Steps:**
1. Lock `briar.sunset`'s Redmine account (Administration → Users → Actions → Lock).
2. Re-open L2's Edit form and check whether she is still listed/checked as a Support Assignee.
3. Create 3 separate fresh tickets at L1 (via `alpha.customer`, L1 baseline), assign each to `luna.blossom`, let each breach its Response deadline, and trigger the SLA monitor. Record which L2 agent each one escalates to.
4. Separately, open one of these tickets' standard Edit form and check whether `briar.sunset` appears at all in the **Assigned to** dropdown for manual assignment.

**Expected Result:** Not asserted in advance — this TC exists to determine two things from real behavior: (1) whether the escalation mechanism actively excludes a locked agent when picking among a Support Level's assignees, or naively picks from the full configured list regardless of account status; and (2) whether locking an agent's account has any automatic effect on the Support Level's own assignee configuration.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **Escalation correctly excludes the locked agent (3/3); the Support Level's own configuration does not auto-update.** Locked `briar.sunset` (Administration → Users → Lock; confirmed via the row's action link flipping to "Unlock" and her disappearing from the default active-only Users list). Re-opened L2's Edit form: the Support Assignees widget still showed **"2 selected"**, and opening the dropdown confirmed both checkboxes — `Autumn Grace` and `Briar Sunset` — still checked. **Locking a user does NOT automatically remove them from a Support Level's assignee list.** Created 3 fresh L1 tickets (#27/#28/#29) via `alpha.customer`, assigned each to `luna.blossom`, let all three breach, triggered `Helpdesk::SlaMonitorWorker.new.perform` twice (some needed a second cycle to cross their exact deadline). All three L1→L2 escalations landed on **`autumn.grace`** — log confirms `Ticket #27 | L1 → L2 | Assignee: luna.blossom → autumn.grace`, and identically for #28 and #29. **Not once, across 3 independent escalation events, was the ticket assigned to the locked `briar.sunset`**, despite her still being nominally listed as an eligible assignee. Separately, opened ticket #27's standard Edit form: the **Assigned to** dropdown listed only `Autumn Grace`, `Luna Blossom`, `No Perm Reporter`, `Willow Belle` (plus the disabled customer) — **`Briar Sunset` does not appear at all**, confirming the exclusion is not specific to the escalation code path — it matches Redmine's own standard behavior of excluding locked (non-active) users from any assignee-selection UI, and the plugin's escalation logic evidently inherits/respects that same active-user scoping rather than naively iterating the Support Level's raw configured list. **Net finding: both manual assignment and automated escalation correctly protect against ever assigning a ticket to a locked agent — the gap is that the Support Level's own configuration (Edit form and list view alike) still displays the locked agent as a current assignee, with no lock indicator anywhere, even though she can never actually receive a ticket while locked.** Filed as **BUG-HLP-026** (Low) — see `bugs/open/BUG-HLP-026.md`. Unlocked `briar.sunset` afterward to restore the L2 chain to its normal two-agent state for future fixtures.

**Revision History:**
- **2026-09-01, original pass**: recorded the config-display gap as an observation, explicitly "Not filed as a bug — the cosmetic gap is low-impact... and arguably reasonable."
- **2026-09-01, corrected same day per explicit user direction** ("so create bug"): filed as **BUG-HLP-026** — a real-world consequence exists (an admin could believe a Support Level has more active coverage than it actually does, with no on-screen signal to correct that), so the gap is worth tracking even though no functional/security harm was found. Took 3 fresh screenshots for the bug file, since none had been captured during the original pass.

---

### TC-HLP-354: A ticket assigned during configured working hours on a selected working day runs a normal same-day countdown

**User Role:** Agent
**Priority:** Medium
**Precondition:** An SLA with a genuinely bounded working-hours window (not 00:00–23:59) and a real Working Days selection, assigned to a ticket during that exact window on a day it's configured as a working day.

**Steps:**
1. Create "Alpha Same-Day Baseline Test SLA" — 60-min Response/Resolution, Working Hours 09:00–18:00, Working Days = Tuesday only.
2. Assign a fresh ticket to it while it is genuinely Tuesday, between 09:00 and 18:00.
3. Check the computed deadline.

**Expected Result:** The deadline is a plain same-day countdown (assignment time + 60 minutes), with no forward-skip logic engaged at all — confirming the baseline "happy path" actually works under a real bounded-hours SLA, not just under the unrestricted 00:00–23:59/all-7-days SLAs every other escalation TC in this suite happens to use.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #30 assigned to `luna.blossom` at 09/01/2026 ~02:04 PM UTC (a genuine Tuesday, inside the 09:00–18:00 window). Response deadline set: **09/01/2026 03:04 PM (UTC)** — exactly 60 minutes later, same day, badge "✓ On Track", "about 1 hour left". No skip, no non-working-period arithmetic involved — a clean, dedicated confirmation of the case every other TC in this suite only exercised incidentally via an unrestricted SLA. Closes the gap an independent 3-lens coverage audit flagged: "Scenarios 1/4 (during working hours / on a working day) have no dedicated test — all 'running normally' evidence elsewhere uses an unrestricted SLA, which proves nothing about respecting a real window."

---

### TC-HLP-355: A ticket assigned after today's working-hours close (on a day that IS otherwise a working day) consumes zero time today and resumes exactly at tomorrow's window open

**User Role:** Agent
**Priority:** Medium
**Precondition:** An SLA where TODAY is checked as a working day, but the current moment is past that SLA's configured Working Hours end time — distinct from TC-HLP-295/107, which only ever tested a non-working **day** (Working Days excluding today entirely), never an **hours** boundary on an otherwise-working day.

**Steps:**
1. Create "Alpha Outside-Hours Intraday Test SLA" — 30-min Response/Resolution, Working Hours 09:00–13:00, Working Days = Tuesday + Wednesday.
2. Assign a fresh ticket to it at a real time after 13:00 on the Tuesday (today), while Tuesday is still checked as a working day.
3. Check the computed deadline.

**Expected Result:** Zero minutes are consumed for the remainder of today (since today's window has already closed), and the deadline lands at tomorrow's 09:00 window open + the full 30-minute target — not "eventually," but at the literal, computed next-window-open timestamp.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #31 assigned to `luna.blossom` at 09/01/2026 ~02:07 PM UTC (Tuesday, after this SLA's 13:00 close but Tuesday still a checked working day). Response deadline set: **09/02/2026 09:30 AM (UTC)** — exactly tomorrow's (Wednesday's) 09:00 window open plus the full untouched 30-minute target. This is the sharpest possible confirmation that the **hours** boundary is independently respected on an otherwise-working day, decoupled from the **days** boundary TC-HLP-295/107 already covered — closing the gap the coverage audit flagged: "no TC tests the intraday 'outside configured working hours' case... distinct from the non-working-day case."

---

### TC-HLP-356: A ticket that has already consumed part of today's working window carries over only the unconsumed remainder to the next occurrence of that working day — not a fresh full allotment

**User Role:** Agent
**Priority:** Medium
**Precondition:** An SLA with a Response Time larger than the remaining minutes in today's working window, so assignment now must span into a future occurrence of the same (restricted) working day.

**Steps:**
1. Create "Alpha Partial-Consumption Weekly-Gap Test SLA" — 300-min Response/Resolution, Working Hours 09:00–18:00, Working Days = Tuesday only (so the next occurrence is a full week away, isolating a clean single-hop test).
2. Assign a fresh ticket to it mid-window today (a genuine Tuesday), consuming some real minutes of today's window before the 300-minute target is exhausted.
3. Check the computed deadline and verify it reflects today's partial consumption, not a fresh 300-minute allotment restarting next Tuesday.

**Expected Result:** If partial consumption is correctly credited, the deadline lands shortly after next Tuesday's 09:00 open (09:00 + the small remainder still owed). If the system incorrectly discards today's partial usage and restarts a fresh full allotment, the deadline would instead land at next Tuesday 09:00 + the full 300 minutes (09:00 + 5h = 14:00) — a decisively different, easily distinguishable result.

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS — the single most decisive proof in this suite of the "remaining time, not a fresh allotment" mechanism.** Ticket #32 assigned to `luna.blossom` at 09/01/2026 ~02:10 PM UTC (Tuesday). Today's remaining window (14:10–18:00) contributed ~229 minutes toward the 300-minute target, leaving ~71 minutes still owed. Response deadline set: **09/08/2026 10:11 AM (UTC)** — next Tuesday's 09:00 open plus exactly the small remainder (~71 min), nowhere near the "fresh allotment" alternative that would have landed at 09/08 02:00 PM. This directly closes the gap both my own reading and an independent 3-lens coverage audit flagged as the suite's biggest hole: every prior working-hours/holiday TC (TC-HLP-295/084/107) only ever assigned a ticket entirely **outside** a working period to begin with (a clock that never started), never one that was already genuinely ticking with partial consumption before hitting a boundary.

---

### TC-HLP-357: A genuine multi-day holiday is excluded in its entirety, not just its first day

**User Role:** Agent
**Priority:** Medium
**Precondition:** A real multi-day holiday (3 consecutive days) attached to an SLA with otherwise unrestricted hours/days, isolating the holiday as the only variable that could cause a skip.

**Steps:**
1. Create holiday "TC-HLP-357 Multi-Day Holiday Test Range", 09/02/2026–09/04/2026 (3 days).
2. Create "Alpha Multi-Day Holiday Test SLA" — 1440-min (24h) Response/Resolution, Working Hours 00:00–23:59, all 7 Working Days, this holiday attached.
3. Assign a fresh ticket to it today (09/01), before the holiday begins, with a target large enough to span across the entire 3-day range.
4. Check the computed deadline lands after the LAST day of the holiday, not just after the first.

**Expected Result:** All 3 holiday days are fully excluded — the deadline should land on 09/05 (the first day after the full range ends), not 09/03 or 09/04 (which would indicate only 1 or 2 of the 3 days were actually excluded).

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6): **PASS.** Ticket #33 assigned to `luna.blossom` at 09/01/2026 ~02:15 PM UTC. Today (09/01) contributed its own remaining ~585 minutes toward the 1440-minute target; the entire 09/02–09/04 holiday range contributed zero. Response deadline set: **09/05/2026 02:17 PM (UTC)** — squarely on the day immediately after the full 3-day range, not one or two days earlier as a partial-exclusion bug would have produced. Closes the gap the coverage audit flagged: "no TC tests clock behavior across a multi-day holiday... to verify the pause holds for the ENTIRE range, not just one day" (the suite's only prior holiday test, TC-HLP-296, used a single-day holiday).

---

### TC-HLP-358: A ticket assigned literally on the holiday's own date shows zero consumption for that day and resumes cleanly the next day

**User Role:** Agent
**Priority:** Low
**Precondition:** Real wall-clock time advanced, mid-session, to land exactly on a previously-configured holiday date (09/02/2026) — an unplanned but valuable natural occurrence of this exact edge case.

**Steps:**
1. Reuse the already-configured "Alpha Partial-Consumption Holiday Test SLA" (1200-min Response/Resolution, Working Hours 00:00–23:59, all 7 Working Days, holiday = "TC-HLP-296 Holiday-Skip Test Day" = 09/02/2026) — `retest.customer1` was already pointed at it.
2. Assign a fresh ticket to it while real time is genuinely 09/02/2026 (the holiday's own date), in the early morning.
3. Check the computed deadline — does the SLA-start timestamp falling ON the holiday's own date confuse the calculation into crediting any of that day?

**Expected Result:** Zero minutes of 09/02 should count, even though the SLA technically "started" that same day — the deadline should land at tomorrow's (09/03) 00:00 plus the full 1200-minute target, with no off-by-one exemption for the start day itself.

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6): **PASS.** Ticket #34 assigned to `luna.blossom` at 09/02/2026 ~04:58 AM UTC — genuinely during the configured holiday's own date. Response deadline set: **09/03/2026 08:00 PM (UTC)** — exactly 09/03 00:00 + the full untouched 1200 minutes, with zero credit given to the few hours of 09/02 that had already elapsed before assignment. Confirms there is no "the SLA started today, so today must count for something" exemption — a holiday excludes its own date completely, even when a ticket's own SLA-start timestamp falls squarely inside it.

---

### TC-HLP-359: A ticket assigned a few minutes before working hours close consumes only that tiny remainder today, correctly carrying the rest to tomorrow

**User Role:** Agent
**Priority:** Low
**Precondition:** An SLA whose Working Hours end is set to occur only minutes after the real assignment time — the literal "just before close" edge case the coverage audit found undisclosed-substituted in TC-HLP-295/096 (both admit their own literal Friday-17:55 scenario was never reproduced).

**Steps:**
1. Create "Alpha Just-Before-Close Boundary Test SLA" — 30-min Response/Resolution, Working Hours 00:00–05:20, Working Days = Wednesday + Thursday.
2. Assign a fresh ticket to it a few real minutes before 05:20 today (Wednesday).
3. Check the computed deadline.

**Expected Result:** Only the tiny remaining window (a few minutes) is consumed today; the rest of the 30-minute target correctly carries to tomorrow's (Thursday's) 00:00 open.

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6): **PASS.** Ticket #35 assigned to `luna.blossom` at ~05:03–05:04 AM UTC, roughly 16 minutes before this SLA's own 05:20 close. Response deadline set: **09/03/2026 12:14 AM (UTC)** — i.e. ~14 minutes into tomorrow's 00:00 window, exactly consistent with ~16 of the 30 minutes having been consumed in today's tiny remaining window before carrying the ~14-minute remainder forward. Not a fresh 30-minute restart (which would have landed at 00:30), and not a lost/miscounted tiny window either — decisively closes the literal "just before close" boundary case both TC-HLP-295 and TC-HLP-327 explicitly disclosed as substituted-not-reproduced.

---

### TC-HLP-360: The working day immediately after a holiday is correctly recognized as a normal working day, not accidentally excluded too

**User Role:** Agent
**Priority:** Medium
**Precondition:** A **restricted** Working Days pattern (not "every day except the holiday," which TC-HLP-296/353 already used and which can never reveal an adjacency bug, since every other day is already a working day in that config) — here, only 2 specific days of the week are working days at all, with the holiday landing on one of them.

**Steps:**
1. Create "Alpha Holiday-Adjacency Restricted-Days Test SLA" — 60-min Response/Resolution, Working Hours 00:00–23:59, Working Days = **Wednesday + Thursday only**, holiday = "TC-HLP-296 Holiday-Skip Test Day" (09/02/2026, a genuine Wednesday).
2. Assign a fresh ticket to it while it is genuinely the holiday's own date (Wednesday).
3. Check the computed deadline: does it land within Thursday (the very next working occurrence, one day later), or does it skip all the way to the following Wednesday (indicating Thursday was wrongly also excluded)?

**Expected Result:** The deadline should land within Thursday (09/03), one day later — if an adjacency bug incorrectly treated the day right after a holiday as also excluded, the deadline would instead skip a full week to the following Wednesday (09/09), a decisively distinguishable difference.

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6): **PASS — the sharpest available proof that holiday adjacency does not corrupt the very next working day.** Ticket #36 assigned to `luna.blossom` at ~05:06 AM UTC on 09/02 (the holiday's own Wednesday). Response deadline set: **09/03/2026 01:00 AM (UTC)** — exactly Thursday's 00:00 open plus the full 60-minute target, landing one day later, not one week later. Had the day immediately following a holiday been wrongly treated as also excluded (an adjacency bug the "every day except the holiday" configs used by TC-HLP-296/353 could never have revealed, since they leave no other day available to misidentify), the deadline would have landed on 09/09 instead — over 6 days later, an unmistakable difference. Closes the gap the coverage audit flagged: "no TC in the file addresses the day adjacent to a holiday... whether the working day immediately preceding or following it behaves correctly."

---

### TC-HLP-361: An SLA currently selected on a customer's project-access row cannot be silently deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** A customer has a project-access row using this SLA (e.g. `alpha.customer` → Alpha Standard SLA).

**Steps:**
1. Go to the SLA list, attempt to delete the SLA that is currently selected on the customer's project-access row
2. If deletion is not blocked, re-open the customer's Edit form afterward and check the affected row

**Expected Result:**
- Deletion is refused (or requires explicit confirmation of consequences) with a clear message identifying the dependency — not a silent success or a crash
- If deletion is not blocked: the customer's project-access row should not be left pointing at a non-existent SLA with no indication anything changed

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS for the ticket-in-use case; FAIL for the customer-only case — see caveat.** Attempted to delete "Alpha Standard SLA" — genuinely in use (`alpha.customer`'s project-access row, **and** ticket #16). The confirmation modal itself is generic (no pre-emptive warning, unlike Organization's fixed delete flow), but the actual delete request was correctly refused server-side: **"This SLA cannot be deleted because it is currently assigned to one or more issues."** No crash, no silent success — the SLA remains fully intact afterward. **Caveat added later the same session, per a user follow-up question**: this PASS only proves the guard works when a real **ticket** references the SLA — it does NOT prove the customer's project-access row itself is what's protected. Isolated that specifically with a fresh SLA referenced *only* by a customer row (zero tickets): deletion succeeded silently, no warning at all — the check only ever looks at ticket/issue usage, never customer project-access usage. Filed as part of **BUG-HLP-022** (broadened from its original Support Level-only scope) — see `bugs/open/BUG-HLP-022.md`.

---

### TC-HLP-362: A Support Level currently selected on a customer's project-access row cannot be silently deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** A customer has a project-access row using this Support Level (e.g. `beta.customer` → AB-L1).

**Steps:**
1. Go to the Support Level list, attempt to delete the Support Level that is currently selected on the customer's project-access row
2. If deletion is not blocked, re-open the customer's Edit form afterward and check the affected row

**Expected Result:**
- Deletion is refused (or requires explicit confirmation of consequences) with a clear message identifying the dependency — not a silent success or a crash
- If deletion is not blocked: the customer's project-access row should not be left pointing at a non-existent Support Level with no indication anything changed
- Also worth checking whether deleting a Support Level that other levels escalate into (per TC-HLP-321's chain) behaves the same way

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **FAIL.** First attempt used this TC's own precondition (`beta.customer` → AB-L1) — but `beta.customer` doesn't currently exist on this environment (never recreated after the 2026-08-27 DB reset), so AB-L1 had zero real dependents; its "Successful deletion" there was actually correct unused-delete behavior, not evidence either way. Rebuilt the test properly: created a disposable level, attached it to `alpha.customer`'s real project-access row, then attempted delete — it succeeded immediately, **no dependency warning at all**, unlike SLA's own delete (TC-HLP-361, correctly blocked). Reopening `alpha.customer`'s Edit form afterward showed the row silently corrupted: Support Level reset to "None" while SLA Name remained set to a real value — a combination TC-HLP-342 confirmed the form's own validation would never allow to be saved directly. Filed as **BUG-HLP-022** (Medium) — see `bugs/open/BUG-HLP-022.md`. `alpha.customer`'s Support Level restored to L1 afterward.

---

### TC-HLP-363: Deleting an unused SLA succeeds

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** An SLA with no customer project-access row currently pointing at it, and no ticket currently using it (distinct from TC-HLP-361, which covers the in-use/blocked case).

**Steps:**
1. Delete the unused SLA

**Expected Result:**
- Deletion succeeds with no error, and the SLA no longer appears in the SLA list or in any dropdown offering it

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS.** "Alpha CRUD Test SLA" (id 5, User Count 0, no customer/ticket referencing it) deleted via the SLA list's Delete link and confirmation modal — "Successful deletion.", no error. Confirmed gone from the SLA list immediately afterward (5 rows → 4). Cross-checked against the in-use case the same session (TC-HLP-361): an in-use SLA is correctly refused instead, confirming the delete guard genuinely distinguishes used-vs-unused rather than always blocking or always allowing.

---

### TC-HLP-364: A Holiday can be deleted when unused, but not silently when attached to an SLA

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two holidays: one attached to an SLA's Holidays field, one not attached to anything. Neither of `HELPDESK_SLA_ESCALATION.md`'s existing delete-protection TCs (TC-HLP-361/297) covers Holiday at all — this is the same class of risk (an entity referenced elsewhere getting silently deleted out from under its reference) never checked for this entity.

**Steps:**
1. Delete the unattached holiday
2. Attempt to delete the holiday currently attached to an SLA
3. If step 2's deletion is not blocked, re-open the SLA afterward and check its Holidays field

**Expected Result:**
- Step 1 succeeds cleanly — no error, holiday no longer appears in the Holiday list
- Step 2 is refused (or requires explicit confirmation of consequences) with a clear message identifying the SLA dependency — not a silent success. If it silently succeeds instead, check whether the SLA's Holidays field is left pointing at a now-nonexistent holiday with no indication anything changed, which would be the same class of defect BUG-HLP-011 (organization delete, no linked-customer warning) already fixed for a different entity

- **CONFIRMED LIVE 2026-09-01** (Local, redmine-docker-6, admin): **PASS, per corrected Expected Result (2026-09-03).** Step 1: deleted the unattached holiday ("Alpha Spring Festival 2027 (Renamed Again)") — "Successful deletion.", clean, no error. Step 2: attempted to delete "Alpha Founders Day 2026" (attached to SLA "Alpha CRUD Test SLA Full") — succeeded with the same generic confirmation modal, no dependency warning at all. Step 3: reopened the SLA's detail page — its Holiday field silently changed to "-" (gracefully cleared, not left dangling on a broken reference, since Holiday isn't a required SLA field — so no invalid state resulted, unlike TC-HLP-362's Support Level finding). Originally filed as BUG-HLP-023 (Low), **closed 2026-09-03 as Not a Bug per explicit user product-judgment review**: Holiday is an optional SLA field, the delete degrades gracefully with zero functional consequence, so a missing dependency warning here doesn't rise to a defect — contrast BUG-HLP-022 (Support Level, a required field), which stays open. See `bugs/closed/BUG-HLP-023.md`.

---

## Evidence Map

- Case ID: TC-HLP-284 – TC-HLP-352 (excluding TC-HLP-077 [legacy pre-2026-09-22 ID, no longer in use], moved to Deferred/Out of Scope 2026-09-01 — no reachable UI path to test it), plus TC-HLP-339–278 (SLA/Support Level/Holiday list search & filter, added 2026-08-24), TC-HLP-361–297 (SLA/Support Level delete-while-linked-to-customer, added 2026-08-27 — mirrors TC-HLP-061's Organization version), TC-HLP-328–302 (escalation-chain capstone, mid/last-level SLA start on reply, no-one-resolves admin reassignment, multi-agent level assignment, added 2026-08-31), TC-HLP-286–308 (SLA/Support Level/Holiday Edit-all-fields and Delete CRUD gap closure, added 2026-08-31 after live form exploration — see `HELPDESK_FIELD_VALIDATIONS.md` for the per-field validation cases these complement), TC-HLP-287–320 (SLA/Support Level/Holiday Create-time required-fields-only and all-fields-in-one-Save cases, added 2026-09-01 — distinct from TC-HLP-286/305/307 which only prove the same fields are editable via a later Update), TC-HLP-289/327/329 (SLA/Support Level/Holiday edit-required-fields-only-leaves-optional-fields-untouched, added 2026-09-01 after a background audit workflow — the specific partial-update-doesn't-clobber-data risk neither the edit-all-fields nor create-time cases can expose; see `HELPDESK_FIELD_VALIDATIONS.md` TC-HLP-123/328/330 for these same three entities' edit-time validation-error counterparts), TC-HLP-329–364 (resolved/closed without ever breaching, resolved immediately after one escalation with no further breach, and Admin performing the resolve/close in either scenario — added and executed 2026-09-03 per explicit user question, all 3 customer-raised via `retest.customer1` per explicit user correction that Agent/Admin-created tickets never attach an SLA), TC-HLP-332 (full-chain escalation through every level to admin-fallback, then Admin actively resolves — added and executed 2026-09-03, written before execution per explicit user direction), TC-HLP-333 (escalation into a 2-agent Support Level at the L2→L3 pairing specifically — determines the actual selection rule via source code plus a live 2-ticket comparison, added and executed 2026-09-03)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`

## Deferred / Out of Scope

- SLA Status **badge** rendering (feature #20) — already covered in `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md`, not repeated here.
- **TC-HLP-077 [legacy pre-2026-09-22 ID, no longer in use] (formerly "Leaving Project blank on an SLA makes it available to every project") — removed from active coverage, 2026-09-01, per explicit user direction: SLAs are only ever created from inside a project's own Helpdesk → SLA tab, so a "leave Project blank" scenario doesn't reflect any real, reachable user flow.** This matches the live form finding recorded 2026-08-31/2026-09-01: `/projects/:id/rf_slas/new` is the only reachable create route (no entry point exists outside a project context, per `HELPDESK_USER_GUIDE.md` §3.2), and on that form `project_id` renders as a **hidden input already locked to the current project** — there is no visible Project dropdown and no way to clear it. The old global bypass route that might once have allowed a project-less create was closed entirely by BUG-HLP-005's fix (`/rf_slas(/new)` now returns a 404). If a future build reintroduces a real "any project" SLA creation path, re-add a TC for it then — until it does, this scenario has no UI to test.
