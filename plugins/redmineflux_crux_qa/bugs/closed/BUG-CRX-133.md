# Bug Report Template

- Bug ID: BUG-CRX-133
- Production Redmine Issue ID: #127460
- Title: Invoicing Agent's "Send Invoice" silently targets a different, unrelated project when the current message doesn't re-name it — same wrong-project-resolution defect class as BUG-CRX-080/093/101, now on the Invoicing Agent
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Invoicing Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. As `admin`, fresh chat, Invoicing Agent pinned. First message established **Crux Invoice Agent Test
   Project** as the chat's working project: "Can you check on invoice #1 for the Crux Invoice Agent Test
   Project?" — correctly answered using that project's real invoice #1 (INV-2026-0001, Draft).
2. In the same chat, without re-naming the project: "Send invoice #1 to the client now."

## Expected result

Per the repo-wide rule already enforced (with fixes) on other domain agents for this exact defect class
(BUG-CRX-080/093/101), the project this chat had already been operating on should be reused when the current
message doesn't name a different one — not silently replaced by an unrelated project.

## Actual result

The response was: *"✓ Invoice #1 not found in project 'crux-pm-agent-test-project' (#1). Verify the invoice
ID belongs to this project..."* — **a completely different, unrelated project** (`crux-pm-agent-test-project`,
id 1) was silently substituted for the `Crux Invoice Agent Test Project` (id 10) this chat had just
confirmed real data for one turn earlier. No bad write occurred here only because invoice #1 doesn't exist
in that wrong project either — had an invoice with the same numeric id genuinely existed in the wrong
project, it could have been sent to the wrong client with no warning.

Retrying in the same chat with the project explicitly re-named ("Send invoice #1 for the Crux Invoice Agent
Test Project to the client now.") correctly resolved `Project: Crux Invoice Agent Test Project` and
succeeded cleanly: *"✓ Invoice #1 (INV-2026-0001) sent. Status: sent."* — confirming the send mechanism
itself works correctly once properly scoped; this is purely a project-resolution defect on a message that
doesn't restate the project.

**Secondary, independently-notable observation**: the "not found" failure is rendered with a misleading
**✓** success prefix — the same already-well-documented false-success-icon defect class as
BUG-CRX-009/018/054/067/082/086.

**Second reproduction, different tool, 2026-11-03 (later session)**: the identical defect was independently
reproduced on `update_invoice` (not just `send_invoice`). Fresh chat established `Crux Invoice Agent Test
Project` across two prior turns (creating, then updating, invoice #5 in that project). A third message in the
same chat — "Just update the notes field on invoice #5 to '...' and set the client address to '...'" (no
project re-named) — produced a confirm card showing `Project: Crux PM Agent Test Project` (the exact same
wrong project, id 1, as the original finding). Confirming it returned the exact same error shape: *"✓ Invoice
#5 not found in project 'crux-pm-agent-test-project' (#1). Verify the invoice ID belongs to this project..."*
Native verification on `/projects/crux-invoice-agent-test-project/invoices/5/edit` confirmed invoice #5's real
Notes and Client Address fields were genuinely unchanged — no bad write occurred, same as the original finding,
again only because the wrong project doesn't happen to have a clashing invoice id. Confirms this is a
chat-session-wide context-resolution defect affecting the Invoicing Agent generally, not isolated to the
`send_invoice` tool.

## Evidence

### Screenshot

![Wrong project resolved on Send Invoice](../../screenshots/BUG-CRX-133/wrong-project-send-invoice.png)

![Second reproduction: wrong project resolved on Update Invoice](../../screenshots/BUG-CRX-133/update-invoice-wrong-project-2nd-repro.png)

### Console / log

- First send attempt (verbatim): *"✓ Invoice #1 not found in project 'crux-pm-agent-test-project' (#1).
  Verify the invoice ID belongs to this project. (If you expected this invoice #1 to exist, verify the ID
  with the corresponding list_* tool.)"*
- Retry with explicit project name (verbatim): confirm card `Project: Crux Invoice Agent Test Project`,
  `Invoice: 1` → *"✓ Invoice #1 (INV-2026-0001) sent. Status: sent. Client: test@example.com."*
- Native verification on `/invoices?project_id=crux-invoice-agent-test-project`: invoice #1's Status column
  genuinely reads "Sent" after the second attempt.

## Duplicate check

- Duplicate found: No new root cause — same general class as **BUG-CRX-080** (Testcase-Management, fixed via
  `field_check`), **BUG-CRX-093** (same root cause on read tools, outside that fix's scope), and
  **BUG-CRX-101** (Scrum Agent, Agile Board plugin). This is a **fresh recurrence on a fourth domain — the
  Invoicing Agent's `send_invoice` tool specifically** — kept as its own bug file per this repo's one-bug-
  per-domain rule (see `bugs/_duplicates.md` for the equivalent BUG-CRX-094/096/101 precedent).

## Retest — 2026-11-04 (FIXED)

Retested the exact original repro shape in chat `ses-378` (Invoicing Agent pinned): the chat had just created
invoice #6 in `Crux Invoice Agent Test Project` one turn earlier. Sent, without re-naming the project: "Send
invoice #6 to the client now."

This time the agent did not silently substitute a different, unrelated project — instead it correctly
recalled the right project and explicitly checked: *"I need to confirm which project this invoice belongs to.
Is it the 'crux-invoice-agent-test-project' we just created the invoice in?"* After confirming ("Yes, that
one."), the real `Invoice Send Invoice` confirm card correctly showed `Project: Crux Invoice Agent Test
Project`, `Invoice: 6`. Confirming returned: *"✓ Invoice #6 (INV-2026-0006) sent. Status: sent. Client:
retest132@example.com."* Native-verified on `/invoices?project_id=crux-invoice-agent-test-project`: invoice
INV-2026-0006's Status column genuinely reads "Sent".

No wrong-project substitution occurred — the context-carryover resolution is now correct, even if phrased as
an extra confirmation question rather than silent reuse. **Status: FIXED.** Moved to `bugs/closed/`.
