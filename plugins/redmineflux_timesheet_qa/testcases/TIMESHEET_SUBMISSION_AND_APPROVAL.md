# Test Cases — Redmineflux Timesheet — Submission, Withdrawal & the Approval Workflow

> Source: vendor KB — "How to Submit Timesheet", "How to Withdraw Submitted Timesheet",
> "How to Use Approver Dashboard", "How Approvers Approve or Reject Timesheets", "Approval Flow Logic",
> and the Auto-Approve Threshold setting.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Timesheet Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_timesheet_qa

## Why this is the most important suite in the plugin

The KB states four approval rules explicitly. Each is falsifiable, each is a governance guarantee, and each must be
verified **at the endpoint** rather than by observing that a button is hidden:

1. Timesheets follow the schema **in strict sequence**.
2. **A higher-level approver cannot act before a lower-level decision.**
3. **No approval level can be skipped.**
4. **If the submitter is the final-level approver, only an admin can complete the approval or rejection.**

A UI that hides the Approve button while the endpoint accepts an out-of-order call does not implement any of these
— it merely looks like it does. Every negative case below therefore includes a direct request.

## Test accounts required

- **Submitter** — an ordinary member.
- **Approver L1** and **Approver L2** — holding Manage Timesheet, with roles mapped to levels 1 and 2 of the schema.
- **Final approver who is also a submitter** — required for TC-TMS-414; without this account that rule is
  untestable, and it is the rule most likely to be missing.
- **Unrelated member** — holds Manage Timesheet but is not in this schema's chain.
- **Admin.**

---

## Functional Cases — Submission

---

### TC-TMS-301: Submit a timesheet

**User Role:** Submitter
**Steps:**
1. Verify the period's entries, click **Submit**, confirm the prompt.

**Expected Result:**
- The timesheet enters the approval workflow, its state changes visibly, and it appears in Approver L1's
  Pending Approvals.

---

### TC-TMS-302: A submitted timesheet is locked appropriately

**User Role:** Submitter
**Steps:**
1. After submitting, attempt to add, edit and delete entries in that period, via the UI and directly.

**Expected Result:**
- Behaviour is consistent with the configured settings and is the same at the UI and the endpoint.
- If editing remains possible while pending, record it — an approver may otherwise approve figures that changed
  underneath them between review and decision.

---

### TC-TMS-303: Submitting an empty period

**User Role:** Submitter
**Steps:**
1. Submit a period with no entries.

**Expected Result:**
- Either refused with a message, or submitted as a zero-hour timesheet that the approver can act on.
- It must not create an unresolvable item in the approval queue.

---

### TC-TMS-304: Submitting twice

**User Role:** Submitter
**Steps:**
1. Submit, then attempt to submit the same period again, via the UI and directly.

**Expected Result:**
- Refused. No duplicate entry appears in any approver's queue.

---

### TC-TMS-305: Late submission shows the deadline message

**User Role:** Submitter
**Steps:**
1. Let the deadline day pass, then submit the previous period.

**Expected Result:**
- The deadline message appears and submission is blocked or allowed per the configured setting (paired with
  TC-TMS-112).

---

### TC-TMS-306: A blocked late submission can be unlocked by an admin

**User Role:** Admin
**Steps:**
1. With submission blocked by a missed deadline, use the **Late Submission Unlock Queue** on the Admin Dashboard.
2. Have the submitter retry.

**Expected Result:**
- The unlock takes effect and the submission succeeds.
- **There must be a route out of a blocked state.** If a missed deadline permanently prevents a user from ever
  submitting that period, their hours can never be approved — an operational dead end worth filing.

---

### TC-TMS-307: Submission period boundaries

**User Role:** Submitter
**Steps:**
1. Submit at the very start and the very end of a period, and across a month/year boundary.

**Expected Result:**
- The correct period is submitted in every case, carrying exactly the entries belonging to it.

---

### TC-TMS-308: Approvers are notified on submission

**User Role:** Submitter then Approver L1
**Preconditions:** Email on submission enabled; **Host name and path** verified.
**Steps:**
1. Submit and check the mailboxes of Approver L1 and Approver L2.

**Expected Result:**
- L1 is notified with a working link. **L2 is not notified yet** — they cannot act until L1 decides, so notifying
  them now would produce an actionable-looking email for an action they cannot perform.

---

## Functional Cases — Withdrawal

---

### TC-TMS-309: Withdraw before any approval

**User Role:** Submitter
**Steps:**
1. Submit, then click **Withdraw Timesheet** before any approver acts.

**Expected Result:**
- The timesheet returns to an editable state and disappears from the approval queue.

---

### TC-TMS-310: Withdrawal is blocked after the minimum approval level approves

**User Role:** Submitter, after Approver L1 approves
**Steps:**
1. Have L1 approve, then confirm the Withdraw action is no longer offered.
2. Send the withdraw request **directly**.

**Expected Result:**
- Not offered **and** refused at the endpoint, exactly as the KB's rule states.
- A submitter able to withdraw after an approval has been recorded could retroactively alter approved figures —
  High severity.

---

### TC-TMS-311: Withdraw after a rejection

**User Role:** Submitter
**Steps:**
1. Have an approver reject the timesheet, then check the submitter's options.

**Expected Result:**
- The submitter can correct and resubmit. A rejected timesheet must not be stuck — the point of rejection is to
  get it fixed.

---

### TC-TMS-312: Withdrawal racing an approval

**User Role:** Submitter and Approver L1 simultaneously
**Steps:**
1. Submitter opens the withdraw action while L1 opens the approve action; both confirm at nearly the same moment.

**Expected Result:**
- Exactly one succeeds and the other receives a clear message.
- The end state is coherent — not a timesheet that is both withdrawn and approved, and not an approval recorded
  against a withdrawn period. This race is inherent to the documented rule and worth exercising deliberately.

---

## Functional Cases — Approver dashboard and decisions

---

### TC-TMS-401: Approval Dashboard shows the documented sections

**User Role:** Approver L1
**Steps:**
1. Open **Approval Dashboard**.

**Expected Result:**
- Pending approvals, urgent approvals, pending hours and recent actions are all present, per the KB.

---

### TC-TMS-402: Pending queue contains only actionable items

**User Role:** Approver L2
**Steps:**
1. With a timesheet awaiting L1, check L2's queue.

**Expected Result:**
- It is **not** listed as actionable for L2 — they cannot act until L1 decides. Listing it would invite an attempt
  that must then be refused, which is a confusing design and worth recording.

---

### TC-TMS-403: Pending hours total is accurate

**User Role:** Approver
**Steps:**
1. Compare the pending-hours figure with the sum of the timesheets actually awaiting this approver.

**Expected Result:**
- They match, and the figure counts only timesheets this approver can see.

---

### TC-TMS-404: Review a timesheet

**User Role:** Approver L1
**Steps:**
1. Click **Review** on a pending submission.

**Expected Result:**
- The submitter's entries are shown in full — dates, activities, hours and comments — enough to make an informed
  decision.

---

### TC-TMS-405: Approve with a comment

**User Role:** Approver L1
**Steps:**
1. Approve with a comment and confirm.

**Expected Result:**
- The timesheet advances to level 2, the action is recorded with the approver's name, comment and timestamp, and
  the submitter is notified.

---

### TC-TMS-406: Reject with a comment

**User Role:** Approver L1
**Steps:**
1. Reject with a comment.

**Expected Result:**
- The timesheet returns to the submitter with the reason visible to them, and the rejection is recorded.

---

### TC-TMS-407: Final-level approval completes the workflow

**User Role:** Approver L2
**Steps:**
1. After L1 approves, have L2 approve.

**Expected Result:**
- The timesheet reaches a fully approved state, leaves all pending queues, and the submitter is notified.

---

### TC-TMS-408: Both Team and Project mode submissions appear in the queue

**User Role:** Approver
**Steps:**
1. With access to both contexts, check that submissions from each appear according to the KB's statement.

**Expected Result:**
- Both appear, scoped by the approver's access.

---

### TC-TMS-409: Submitter is notified on each decision

**User Role:** Submitter
**Steps:**
1. Check the mailbox after each approval and each rejection in the chain.

**Expected Result:**
- One notification per action, naming the approver and the decision, and carrying the comment for a rejection.

---

## Negative Cases — the approval rules

---

### TC-TMS-410: A higher level cannot act before a lower level

**User Role:** Approver L2
**Steps:**
1. With a timesheet awaiting L1, confirm L2 is offered no Approve/Reject control.
2. Send the **approve** request directly as L2, naming that timesheet.
3. Repeat with the **reject** request.

**Expected Result:**
- Both refused at the endpoint.
- This is rule 2 of the documented flow. **If the endpoint accepts it, the sequence is advisory only** and the
  entire multi-level design collapses into single-approval — High severity.

---

### TC-TMS-411: No level can be skipped

**User Role:** Approver L2 / Admin
**Steps:**
1. Attempt to move a timesheet from submitted straight to fully approved, by crafting a request that targets the
   final level directly.

**Expected Result:**
- Refused. Every level records a decision, and the audit log shows a complete chain with no gaps.

---

### TC-TMS-412: Auto-approval bypasses the chain only as configured

**User Role:** Admin then Submitter
**Steps:**
1. With Auto-Approve Threshold set to 10, submit a 6-hour timesheet.
2. Inspect the audit log and the approval record.

**Expected Result:**
- It is approved without approver action, and that fact is **recorded as an automatic approval**, not falsely
  attributed to a human approver.
- An auto-approval logged as though an approver decided it would corrupt the audit trail, which is the one record
  the plugin exists to produce.

---

### TC-TMS-413: An approver's own timesheet routes to the next level

**User Role:** Approver L1 acting as submitter
**Steps:**
1. Have Approver L1 submit their own timesheet.
2. Check whether L1 can approve it, through the UI and by sending the request directly.
3. Check L2's queue.

**Expected Result:**
- L1 **cannot self-approve** — refused at the endpoint — and the timesheet routes to L2, per the KB.
- Self-approval is the most obvious way to defeat the workflow, so the endpoint check is essential here.

---

### TC-TMS-414: Final-level approver's own timesheet requires an admin

**User Role:** The user who is both submitter and final-level approver
**Preconditions:** This exact account must exist; the rule cannot be tested without it.
**Steps:**
1. Have them submit their own timesheet.
2. Confirm they cannot complete their own approval, via the UI and directly.
3. Have the Admin approve it.

**Expected Result:**
- Only the Admin can complete the approval or rejection, exactly as the KB states.
- **This is the deadlock-avoidance rule and the one most likely to be unimplemented**, because it only manifests
  in a team small enough for one person to be both ends of the chain. If the timesheet becomes permanently stuck
  with no admin route, that is a genuine operational dead end.

---

### TC-TMS-415: An unrelated approver cannot act

**User Role:** A member holding Manage Timesheet but whose role is not in this schema
**Steps:**
1. Confirm the timesheet is absent from their queue.
2. Send the approve and reject requests directly.

**Expected Result:**
- Refused. Authority comes from the **schema's level-to-role mapping**, not from holding Manage Timesheet alone —
  the KB says as much, and conflating the two would let any manager approve any team's timesheets.

---

### TC-TMS-416: Approving a withdrawn or already-decided timesheet

**User Role:** Approver
**Steps:**
1. Send an approve request for a timesheet that has already been withdrawn, and for one already fully approved.

**Expected Result:**
- Both refused cleanly. No duplicate approval records and no state regression.

---

### TC-TMS-417: Schema changed mid-approval

**User Role:** Admin + Approvers
**Steps:**
1. With a timesheet pending at level 1, edit the schema to add a level, remove a level, and change a level's role.
2. Attempt to continue the approval.

**Expected Result:**
- The in-flight timesheet remains completable and its recorded history stays coherent.
- **It must not become permanently stuck** at a level that no longer exists, and already-recorded approvals must
  not be silently invalidated. Record the behaviour precisely — this is the most likely source of orphaned
  approvals in real use.

---

### TC-TMS-418: Approver removed from the team mid-approval

**User Role:** Admin + Submitter
**Steps:**
1. Remove the only level-1 approver from the team while a timesheet is pending at level 1.

**Expected Result:**
- There is a documented route forward — another eligible approver, or admin intervention.
- A timesheet with no possible approver and no escalation path is a dead end and should be filed as one.

---

### TC-TMS-419: Approval decisions are auditable

**User Role:** Admin
**Steps:**
1. After a full approve/reject cycle, open the Audit Log.

**Expected Result:**
- Every approval and rejection is recorded with actor, level, timestamp and comment, in order.
- The chain reconstructs exactly what happened. Gaps here undermine the plugin's core purpose.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
