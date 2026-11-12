# Test Suite — Crux Platform: Frozen Rules

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §10. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/admin/frozen_rules` (admin only).
> TC range: TC-CRX-921 to TC-CRX-938.

## Fixtures needed

- A ticket matching a rule scoped narrowly (one specific ticket id), and a different ticket matching a broader
  rule (tracker+project combination), for scope-precision checks.
- An agent (or Work Package) with `autonomous` autonomy, specifically to prove a frozen rule overrides even the
  highest autonomy level.
- A gate-approved Work Package, to prove a frozen rule overrides even an already-approved gate.
- A ticket NOT matching any rule, as a control.

## Positive Cases — Browse & Create

- **TC-CRX-921** — Table shows Rule (a real sentence), Reason, Frozen by, and a Delete button with the confirm
  text "Agents can change these tickets again straight away".
- **TC-CRX-922** — + Freeze something — scoped by field only: create a rule freezing just the `status` field for a
  specific tracker (e.g. Bug), leaving Project/ticket id blank. Confirm the generated rule sentence correctly
  reads something like "Agents can't change the status field on issues with tracker Bug...".
- **TC-CRX-923** — + Freeze something — scoped by one ticket id: create a rule using "#<id>" for One ticket id,
  leaving other scope fields blank. Confirm it applies only to that exact ticket.
- **TC-CRX-924** — + Freeze something — scoped by project: create a rule scoped to a specific project (by
  identifier or name) with no tracker/ticket — confirm it applies project-wide.
- **TC-CRX-925** — All-blank scope triggers the extra confirm: leave every scope field blank (Object type/
  Tracker/Project/ticket id all empty) — confirm a red "Freeze every ticket?" extra confirmation appears before
  the rule can be saved, and cancelling it does not create the rule.
- **TC-CRX-926** — Reason is required and capped: attempt to save with an empty Reason (rejected), then with a
  Reason longer than 300 characters (rejected or truncated — verify which).

## Positive Cases — Enforcement

- **TC-CRX-927** — A frozen field blocks a chat-confirmed write: freeze `priority` on a specific ticket, then ask
  an agent to change that ticket's priority via chat — confirm the write is genuinely refused (native-verify the
  priority is unchanged), with a clear reason shown, not a silent success or a generic error.
- **TC-CRX-928** — A frozen ticket gets NO @-mention reply at all: freeze the whole ticket (or its `notes` field),
  post an `@crux status` comment on it — confirm no reply is posted at all, not even an honest "I can't modify
  this" reply.
- **TC-CRX-929** — A frozen field does NOT block queue claim notes or result notes on an UNFROZEN field: freeze
  only `priority` on a ticket, confirm an agent can still pick it up from the Ready queue and post claim/result
  notes normally (only the frozen field itself is blocked, not the whole ticket, unless the whole ticket is
  frozen).
- **TC-CRX-930** — Autonomy `autonomous` does NOT override a frozen rule: set an agent/Work Package to the highest
  autonomy level, confirm a frozen field on its tickets is STILL blocked — "nothing overrides a rule" per the
  dev reference.
- **TC-CRX-931** — An already-approved gate does NOT override a frozen rule: approve all of a Work Package's
  gates, then confirm a frozen field on its tickets is still blocked for any subsequent agent write.
- **TC-CRX-932** — A rule frozen on `status` does NOT block an @-mention reply: freeze only the `status` field
  (not the whole ticket), post an `@crux status` comment — confirm a reply IS posted (since a reply only writes
  notes, which isn't the frozen field), distinguishing this from TC-CRX-928's whole-ticket-freeze case.
- **TC-CRX-933** — Delete a rule immediately unfreezes: delete an active rule, then immediately retry the
  previously-blocked write — confirm it now succeeds, with no delay or caching of the old frozen state.

## Negative / Boundary Cases

- **TC-CRX-934** — Invalid project reference is rejected: enter a nonexistent project identifier/name — confirm a
  clear "no such project" message, not a silently-created rule that never matches anything.
- **TC-CRX-935** — Invalid tracker reference is rejected: enter a nonexistent tracker name — confirm a clear "no
  such tracker" message.
- **TC-CRX-936** — Invalid field name is rejected: the Field dropdown should be a closed list (status, notes,
  assigned_to, priority, subject, description, done_ratio, tracker, category, fixed_version, parent_issue,
  start_date, due_date, estimated_hours, is_private) — confirm no free-text field-name injection is possible.
- **TC-CRX-937** — Non-admin cannot reach this page at all, regardless of Crux permissions held (cross-reference
  TC-CRX-721).
- **TC-CRX-938** — Humans clicking in native Redmine are never affected: with a field frozen via Crux, confirm a
  human user can still edit that exact field directly in Redmine's own native issue-edit form — frozen rules
  bind agents only, never humans.

## Execution — 2026-11-05

Fixtures: used ticket #40 (Crux PM Agent Test Project) to create, exercise, and then remove a real frozen rule.

- **TC-CRX-921** — PASS, fully confirmed. Table shows Rule (a real generated sentence), Reason, Frozen by,
  Actions; the Remove confirm reads exactly "Remove the rule "<reason>"? Agents can change these tickets again
  straight away."
- **TC-CRX-922** — PASS, fully confirmed (2026-11-12). Created a rule with Tracker="Bug", Field="status", Project/
  ticket id left blank — generated sentence read exactly "Agents can't change the status field on issues with
  tracker Bug in every project." Success message: "✓ Frozen: tracker "Bug" · field "status"." Confirms the
  field+tracker-only scope (no ticket/project) works as documented.
- **TC-CRX-923** — PASS, fully confirmed. Created a rule scoped to "One ticket id" = 40, field = priority — the
  generated sentence read exactly "Agents can't change the priority field on issue #40", and the success message
  read "Frozen: ticket #40 · field "priority"."
- **TC-CRX-924** — PASS, fully confirmed (2026-11-12). Created a rule scoped only to Project identifier =
  "crux-pm-agent-test-project" (no tracker/ticket/field) — generated sentence read exactly "Agents can't change
  anything on issues in project crux-pm-agent-test-project," confirming project-wide scoping with no other
  constraint applies to every field on every ticket in that project. Rule removed immediately after confirming
  (to avoid blocking other suites' agent-write tests against this shared project).
- **TC-CRX-925** — PASS, fully confirmed. Leaving every scope field blank and clicking Freeze produced a red
  "Freeze every ticket?" extra confirmation ("Tracker, project, ticket and field are all blank, so this rule
  will stop agents from changing any ticket, anywhere. Continue?"); clicking its own Cancel correctly did NOT
  create the rule (list still showed "No frozen rules yet.").
- **TC-CRX-926** — FAIL (partial) — found **BUG-CRX-183** (2026-11-12). Empty Reason: correctly blocked from
  submitting (no rule created), though with no visible validation message — a minor UX gap, not filed as a bug
  since the actual constraint (empty reason rejected) holds. >300-char Reason: the input has a client-side
  `maxlength="300"` attribute, but setting the DOM value directly to 350 characters (bypassing the client-side
  cap, exactly as a raw API call or devtools edit would) and submitting succeeded — the rule was created with the
  full, unmodified 350-character reason stored verbatim. No server-side length check exists at all. Filed as
  **BUG-CRX-183**. Native-verified via the rules table cell's own `textContent.length === 350`. Rule removed
  after confirming.
- **TC-CRX-927** — PASS, fully confirmed end-to-end. Froze `priority` on ticket #40, then asked Project Manager
  (chat) to change its priority to High — the confirm card showed a clear inline refusal: "frozen — fr-1: QA
  test — invalid field name injection check (frozen by admin)". Native-verified ticket #40's priority remained
  "low" (unchanged) — the write was genuinely refused, not silently applied.
- **TC-CRX-928** — PASS, fully confirmed (2026-11-12). Froze the WHOLE ticket #40 (ticket id set, Field left
  blank → "Agents can't change anything on issue #40"), then posted `@crux status - ... (TC-CRX-928
  whole-ticket-freeze reply check)` as a journal note. After ~5 minutes (refreshed and verified), the note has
  **zero reply of any kind** — not even an honest "I can't modify this" response — confirming a whole-ticket
  freeze suppresses @-mention replies entirely, distinct from TC-932's field-only-freeze case below. Rule
  removed after confirming.
- **TC-CRX-929** — DEFERRED. Requires a live agent to successfully claim an unfrozen-field ticket from the Ready
  queue via `crux_claim_next_work`/`crux_report_complete` — this session's MCP connection for those tools
  resolves to a different (production) Crux instance than this local environment (confirmed separately, see
  Work Packages suite TC-768 notes), so a genuine local claim cycle can't currently be exercised from this
  session. Deferred until a local-pointing agent/claim path is available.
- **TC-CRX-930** — DEFERRED. Requires a Work Package at `autonomous` autonomy level with a currently-frozen
  field on one of its tickets — no `autonomous`-level WP exists in this environment yet (all current WPs are
  `execute-with-approval` or `suggest-only`), and creating+driving one through a stage requires the same local
  agent-claim capability blocked in TC-929. Deferred.
- **TC-CRX-931** — DEFERRED (same root blocker as TC-CRX-768/796 in the Work Packages/Project Tab suites). No
  Work Package in this environment has ever reached an approved-gate state — reaching one requires the same
  claim/report cycle blocked by the MCP/production-instance mismatch above. Cannot test "an approved gate
  doesn't override a frozen rule" without first having an approved gate to test against.
- **TC-CRX-932** — PASS, fully confirmed (2026-11-12). Froze only the `status` field on ticket #56 ("Agents
  can't change the status field on issue #56"), then posted the same `@crux status` journal note. After ~5
  minutes, a genuine reply WAS posted (Project Manager persona, correctly answering with the ticket's real
  Status/Priority/Assignee/Progress/Created fields) — confirming a field-only freeze (not the whole ticket) does
  NOT suppress @-mention replies, since a reply only writes journal notes, a different field than the one
  frozen. Clean contrast against TC-928's whole-ticket case. Rule removed after confirming.
  **Exploratory note (not filed as a bug):** both this reply and TC-928's prior pass showed the reply prefixed
  with "(I'm the Project Manager, but I don't have a Redmineflux identity to reply under yet — ask an admin to
  provision me.)" — an honest disclosure of a missing identity provisioning step, not a failure; flagged for
  awareness only.
- **TC-CRX-933** — PASS, fully confirmed end-to-end. Removed the frozen rule, then immediately resent the exact
  same "change priority to High" request — this time it succeeded with no refusal. Native-verified ticket #40's
  priority is now genuinely "high", with a real journal entry "Priority changed from low to high" — confirms no
  delay or caching of the old frozen state.
- **TC-CRX-934** — PASS, fully confirmed (2026-11-12). Entered Project identifier =
  "this-project-does-not-exist-xyz" — dialog stayed open with a clear inline warning: "⚠ There is no project
  called "this-project-does-not-exist-xyz". Use the project's identifier, for example "ztdic"." No rule created.
- **TC-CRX-935** — PASS, fully confirmed (2026-11-12). Entered Tracker = "NonexistentTrackerXYZ" — clear inline
  warning: "⚠ There is no tracker called "NonexistentTrackerXYZ". Trackers: Feature, Bug, Support, Testcase."
  (usefully lists the real valid trackers). No rule created.
- **TC-CRX-936** — PASS, fully confirmed, with a worthwhile exploratory note. The Field control is implemented
  client-side as a text input with an HTML `<datalist>` (not a true `<select>`), so a free-text value like
  `totally_bogus_field` CAN be typed and submitted — but the server-side validation correctly catches and rejects
  it: "⚠ Crux doesn't know the field "totally_bogus_field". Use one of: status, notes, assigned_to, priority,
  subject, description, done_ratio, tracker, category, fixed_version, parent_issue, start_date, due_date,
  estimated_hours, is_private." The closed-list guarantee the TC cares about (no free-text field-name injection
  actually taking effect) holds, enforced server-side rather than by the input control's own type — not a bug,
  but worth knowing for anyone assuming a native `<select>` is what prevents this.
- **TC-CRX-937** — PASS (via direct cross-reference to TC-CRX-721, which already confirmed `/crux/admin/*` pages
  403 for a non-admin holding all 5 Crux permissions).
- **TC-CRX-938** — PASS, fully confirmed (2026-11-12). Froze `subject` on ticket #40, then edited the ticket's
  Subject directly via Redmine's own native issue-edit form (`/issues/40/edit`) as a human admin — the edit
  saved successfully with no refusal of any kind (page title/heading updated to the new subject immediately).
  Reverted the subject back to its original text afterward. Confirms frozen rules bind agents only, never
  humans clicking natively, exactly as the admin page's own copy states.

**Suite result (2026-11-05 pass): 7 PASS fully confirmed (921, 923, 925, 927, 933, 936, 937), 11 not
independently verified (922, 924, 926, 928-932, 934-935, 938) due to time-boxing in favor of the highest-value
enforcement proof (927/933). No new bugs found.**

## Execution — 2026-11-12 (deferred TC completion pass)

Completed 9 of the 11 previously-deferred TCs. Fixtures: tickets #40 and #56 (Crux PM Agent Test Project),
each frozen/unfrozen/re-frozen in turn and cleaned up after every check — zero leftover rules at the end.

- **TC-CRX-922** — PASS (field+tracker-only scope, no project/ticket set).
- **TC-CRX-924** — PASS (project-wide scope, no tracker/ticket/field set).
- **TC-CRX-926** — FAIL (partial) — found **BUG-CRX-183**: Reason field's 300-char cap is client-side only: a
  350-char reason, written past the input's own `maxlength` via direct DOM assignment, was accepted and stored
  verbatim server-side with zero rejection or truncation. Empty-Reason case correctly blocked (no visible error
  message, but no rule created either — minor UX gap, not filed).
- **TC-CRX-928** — PASS (whole-ticket freeze → zero @-mention reply).
- **TC-CRX-929 / TC-CRX-930 / TC-CRX-931** — still DEFERRED (local agent-claim/gate-state blocker, see each
  TC's note above — same root cause as Work Packages suite's TC-768/796).
- **TC-CRX-932** — PASS (status-only freeze → @-mention reply still posted, correct contrast to TC-928).
- **TC-CRX-934 / TC-CRX-935** — PASS (invalid project/tracker reference both clearly rejected with a helpful
  message naming valid options).
- **TC-CRX-938** — PASS (native human edit of a frozen field succeeds; frozen rules bind agents only).

**Pass 2 result: 7 more PASS (922, 924, 928, 932, 934, 935, 938), 1 FAIL/bug filed (926 → BUG-CRX-183), 3 still
deferred (929, 930, 931 — all blocked on the same local agent-claim/gate-state limitation). Overall: 14 PASS /
1 bug (183) / 3 deferred (929-931) / 0 TCs now fully unaddressed. Environment left clean (zero frozen rules).**

## Suite status

Pass 1 (2026-11-05): 7 PASS, 11 deferred, 0 bugs found.
Pass 2 (2026-11-12): 7 more PASS, 1 bug found (BUG-CRX-183), 3 still deferred (929-931, local claim/gate
  blocker — tracked against the same root cause as CRUX_PLATFORM_WORK_PACKAGES.md's TC-768).
Overall: 14 PASS / 1 bug / 3 deferred. Environment clean.
Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §10.
