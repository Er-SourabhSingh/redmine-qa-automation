# Test Cases — Redmineflux Checklist — Block Issue Closing

> Source: vendor KB — "How to Enable Block Issue Closing feature".
> **Status: authored 2026-09-15. Executed 2026-09-21 (Local, redmine-docker-7.0.0). Test fixture: issue #1542,
> "Block issue closing" confirmed enabled at session start (left enabled throughout per Installation suite note).
> Closed statuses on this instance: Closed, Rejected.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Administration → Plugins → Redmineflux Checklist Plugin → Configure → General tab → **Block issue closing**.
Enforcement must be verified on the real issue Edit form, and separately on every other path that can close an
issue on this instance.

> **Warning:** this is an instance-wide setting. Record its original value and restore it when the suite finishes.

---

## Functional Cases

---

### TC-CHK-001: Closing is blocked while checklist items are incomplete

**User Role:** Member
**Preconditions:** Block issue closing **enabled**; issue has a checklist with at least one incomplete item.
**Steps:**
1. Open the issue, set Status to a closed status, and save.

**Expected Result:**
- The save is rejected.
- A clear error names the reason (unfinished checklist items) rather than a generic validation failure.
- The issue status is unchanged after reload — the rejection is real, not cosmetic.

CONFIRMED LIVE 2026-09-21 (issue #1542, checklist "Block-close checklist A" with 1 incomplete item, attempted
Status → Closed via the full Edit form): **PASS.** Save rejected with a specific error: "Issue cannot be closed
as there are incomplete checklists." Status confirmed still "New" after a fresh page reload — real rejection.

---

### TC-CHK-002: Closing succeeds once every item is complete

**User Role:** Member
**Steps:**
1. Mark all checklist items Done.
2. Set the status to a closed status and save.

**Expected Result:**
- The issue closes normally. No lingering block.

CONFIRMED LIVE 2026-09-21 (issue #1542, marked "Block-close checklist A"'s item Done, retried Status → Closed):
**PASS.** Save succeeded, status confirmed "Closed" — no lingering block once complete.

---

### TC-CHK-003: Issues with no checklist at all are unaffected

**User Role:** Member
**Steps:**
1. With the setting enabled, close an issue that has no checklist.

**Expected Result:**
- Closes normally. The rule applies only where a checklist exists — it must not block every issue on the instance.

CONFIRMED LIVE 2026-09-21 (fresh issue #1543, no checklist ever added, Status → Closed): **PASS.** Closed
normally, no block — the rule doesn't apply globally to every issue on the instance.

---

### TC-CHK-004: Disabling the setting removes the block

**User Role:** Admin + Member
**Steps:**
1. Disable **Block issue closing** and save.
2. Retry closing an issue that has incomplete checklist items.

**Expected Result:**
- The issue closes. The setting takes effect immediately, without a server restart.

CONFIRMED LIVE 2026-09-21 (issue #1544, one incomplete item; disabled "Block issue closing" in Configure →
General, no restart): **PASS.** Status → Closed succeeded immediately on the next save, no block, no restart
needed. Re-enabled the setting afterward (default state for the rest of this session).

---

### TC-CHK-005: Block applies across all closed statuses

**User Role:** Admin + Member
**Steps:**
1. Identify every status flagged "issue closed" in Administration → Issue statuses.
2. With incomplete items, attempt each one in turn (e.g. Closed, Rejected).

**Expected Result:**
- Every closed status is blocked. A status that slips through is a real gap in the feature, not an edge case.

CONFIRMED LIVE 2026-09-21 (this instance has exactly 2 "issue closed" statuses — **Closed** and **Rejected**,
confirmed via Administration → Issue statuses): **PASS.** **Closed** already blocked in TC-501. Tested
**Rejected** separately (issue #1545, 1 incomplete item) — same rejection, "Issue cannot be closed as there are
incomplete checklists." No closed status slips through.

---

### TC-CHK-006: Block applies to multiple checklists on one issue

**User Role:** Member
**Steps:**
1. Issue with checklist A fully complete and checklist B incomplete. Attempt to close.

**Expected Result:**
- Blocked — the rule is "all checklists complete", not "any one checklist complete".

CONFIRMED LIVE 2026-09-21 (issue #1545: checklist "Rejected-status incomplete item" marked Done — checklist A
complete; added checklist "Checklist B (incomplete)" — incomplete; attempted Status → Closed): **PASS.** Blocked
with the same message — confirms the rule requires *every* checklist on the issue complete, not just one.

---

### TC-CHK-007: Non-closed status transitions are unaffected

**User Role:** Member
**Steps:**
1. With incomplete items, change the status from New to In Progress.

**Expected Result:**
- Succeeds. Only transitions into a closed status are blocked.

CONFIRMED LIVE 2026-09-21 (issue #1545, still with incomplete checklist B, Status New → In Progress): **PASS.**
Save succeeded, status confirmed "In Progress" — only closed-status transitions are gated.

---

## Negative and boundary Cases

---

### TC-CHK-008: Bulk edit bypass

**User Role:** Manager
**Steps:**
1. Select several issues with incomplete checklists in the issue list.
2. Use right-click bulk edit to set them all to a closed status.

**Expected Result:**
- The block is enforced here too. Blocked issues are reported clearly and are **not** silently closed.
- A bulk path that bypasses the rule is a High-severity defect — the feature is trivially circumventable.

CONFIRMED LIVE 2026-09-21 (issues #1545 and #1546, both with an incomplete checklist, bulk-edited via
`/issues/bulk_edit` → Status: Closed → Submit): **PASS.** Rejected with a clear, itemized message: "Failed to
save 2 issue(s) on 2 selected: #1545, #1546. Issue cannot be closed as there are incomplete checklists.: #1545,
#1546." Re-checked both issues individually afterward — #1545 still "In Progress", #1546 still "New", neither
silently closed. No bulk-edit bypass.

---

### TC-CHK-009: Inline / quick edit bypass

**User Role:** Member
**Steps:**
1. Close the issue using any inline or quick status editor available on this instance
   (issue list context menu, inline editor plugin, board drag-to-done).

**Expected Result:**
- Block enforced on every path, with an intelligible message.
- Note: if the error surfaces through another plugin's toast wrapper, file the message defect against that plugin,
  not this one, but the *enforcement* must still hold.

CONFIRMED LIVE 2026-09-21 (issue #1546, incomplete checklist, used the Redmineflux Inline Editor plugin's
Status → Edit quick control to select Closed): **PASS.** Blocked with a toast: "Could not save: Issue cannot be
closed as there are incomplete checklists." Enforcement holds on this path too; status confirmed still "New"
after. The "Could not save:" English wrapper prefix is the Inline Editor plugin's own generic error-wrapping
behavior (already tracked separately as `BUG-INE-002` per this plugin's earlier German-language testing session,
not a Checklist plugin defect) — per this TC's own note, that belongs to the other plugin, not here.

---

### TC-CHK-010: REST API bypass

**User Role:** Member with API key
**Steps:**
1. `PUT /issues/<id>.json` setting `status_id` to a closed status while items are incomplete.

**Expected Result:**
- Rejected with a 422 and an error body naming the checklist reason.
- If the API closes the issue while the UI blocks it, the rule is advisory only — a High-severity defect.

**NOT EXECUTED 2026-09-21.** Retrieving a real API key for the request was blocked by this session's own
credential-materialization safeguard, and a bare, unauthenticated `.json` PUT triggers a disruptive native
browser HTTP Basic-Auth popup that requires manual dismissal — hit exactly this on the first attempt. Skipped
rather than retry into another blocking native dialog. To execute this case, a tester needs to supply a real API
key out-of-band (not read it via browser automation) and pass it as the `X-Redmine-API-Key` header.

---

### TC-CHK-011: Closing a parent issue whose subtask has an incomplete checklist

**User Role:** Member
**Steps:**
1. Parent issue with no checklist; subtask has an incomplete checklist. Close the parent.

**Expected Result:**
- Behaviour is explicit and consistent with Redmine's own parent/subtask closing rules. Record what happens;
  an unhandled exception here is a defect regardless of which way the rule falls.

CONFIRMED LIVE 2026-09-21 (parent issue #1547, no checklist; subtask #1548 with an incomplete checklist item):
**PASS, and the behaviour clarifies the boundary of this plugin's own feature.** While subtask #1548 was open,
the parent's Status dropdown simply didn't list Closed/Rejected as options at all (New, In Progress, Resolved,
Feedback only) — this held **before and after** completing the subtask's checklist item, and only changed once
the subtask itself was actually **closed**. This proves the restriction is Redmine's own "no closing a parent
while any subtask is open" workflow-level rule, entirely independent of the checklist state — **the Checklist
plugin's own block-closing feature never got a chance to act here**, because a stricter, unrelated rule already
gates it first. No unhandled exception at any point; behaviour is explicit (option simply absent) and consistent.
Also forced an invalid `status_id` value via the DOM (bypassing the client-side option list) and submitted it —
the server silently kept the issue at "New" with no error message, rather than an exception; mildly opaque but
not a defect in this plugin (a generic Redmine workflow-transition guard, not checklist-specific).

---

### TC-CHK-012: Issue already closed before the setting was enabled

**User Role:** Admin + Member
**Steps:**
1. Close an issue while the setting is off and its checklist incomplete.
2. Enable the setting.
3. Reopen and re-close the issue.

**Expected Result:**
- The already-closed issue is not retroactively invalidated or auto-reopened.
- The re-close attempt is blocked, as expected for a fresh transition.

CONFIRMED LIVE 2026-09-21 (issue #1549: disabled the block, closed it with an incomplete checklist item,
re-enabled the block, reopened, retried closing): **PASS, both parts.** After re-enabling, the already-closed
issue stayed exactly "Closed" — not auto-reopened or invalidated by the setting change. Reopened it manually to
"New", then the fresh re-close attempt was blocked with the standard message — a new transition is evaluated
against current state, correctly.

---

### TC-CHK-013: Deleting the incomplete item unblocks closing

**User Role:** Member
**Steps:**
1. With one incomplete item blocking the close, delete that item.
2. Retry the close.

**Expected Result:**
- The close now succeeds — the check evaluates current state, not a cached flag.

CONFIRMED LIVE 2026-09-21 (issue #1549, blocked by its one incomplete item; deleted that item via Actions →
Delete, retried Status → Closed): **PASS.** Close succeeded immediately after deletion, status confirmed
"Closed" — check evaluates the issue's current checklist state, no stale/cached block.

---

### TC-CHK-014: Error message is specific and localized

**User Role:** Member
**Steps:**
1. Trigger the block and read the message. Repeat with the UI language set to a non-English locale.

**Expected Result:**
- The message identifies the checklist as the cause and is fully translated in the active locale, with no
  untranslated English fragments.

CONFIRMED LIVE 2026-09-21 (issue #1550, incomplete item; triggered the block in English — "Issue cannot be
closed as there are incomplete checklists." — then switched Admin's UI language to German via My Account and
repeated): **PASS.** German message: **"Ticket kann nicht geschlossen werden, da unvollständige Checklisten
vorhanden sind."** — fully translated, correctly identifies incomplete checklists as the cause, no untranslated
English fragments. Switched language back to English afterward.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-CHK-001–509, 511–514 | n/a (no bugs found) | inline evidence above | none |
| TC-CHK-010 | n/a (not executed) | inline note above | none |

## Summary

**13/14 executed, all PASS; 1 NOT EXECUTED.** Full coverage of the core block (rejected with a specific message,
status unchanged), success-once-complete, no-checklist issues unaffected, live setting toggle (no restart
needed), every closed status (Closed, Rejected) blocked, multi-checklist "all must be complete" rule, non-closed
transitions unaffected, bulk-edit bypass blocked with a clear itemized message, inline-editor quick-edit blocked
(message-wrapper cosmetic issue belongs to the Inline Editor plugin, already tracked separately), parent/subtask
interaction (clarified that a stricter unrelated Redmine workflow rule — no closing a parent with an open
subtask — gates this before the checklist block ever gets a chance to apply), already-closed-before-enabling
issues left alone, deleting the blocking item unblocks immediately, and the error message is fully localized
(confirmed in German). **TC-CHK-010 (REST API bypass) was not executed** — reading a real API key was blocked by
this session's credential-materialization safeguard, and an unauthenticated `.json` PUT triggers a disruptive
native browser Basic-Auth popup; left for a future session with an out-of-band API key. No new bugs found in
this suite.
