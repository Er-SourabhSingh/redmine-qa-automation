# Bug Report Template

- Bug ID: BUG-CRX-067
- Production Redmine Issue ID: <!-- fill after report_defect/create_issue is approved and executed -->
- Title: A genuine permission-denial message on the Sales Agent (CRM) is rendered with a misleading success ✓ checkmark — reproduced on both a write (Create Lead, "Forbidden") and 3 separate reads (List/filter leads, "You don't have permission") — identical to BUG-CRX-054's pattern on the Project Manager agent, confirmed independent of a real write/read actually being blocked
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Sales Agent)
- Plugin version: 0.62.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `daisy.skye` (Reporter role on `Crux CRM Agent Test Project` — zero CRM permissions)
- Date: 2026-10-12

## Steps to reproduce

1. As `daisy.skye` (holds `Use Ask Crux`, zero CRM permissions — no `view_crm`, no `manage_leads`, no `delete_crm_data`, etc.), in a fresh Ask Crux chat (Sales Agent): "Create a lead named Ember Lilac, email ember.lilac@testco-crmtest.local, from TestCo, source Cold Call."
2. Crux produces a genuine confirm card (`Crm Create Lead`, real tool name, real detail table matching every field given, real Confirm/Cancel buttons) — note this itself is correct behavior; the agent isn't expected to pre-check permissions before proposing (per this suite's existing convention, a clean permission test for Create isn't currently reachable once a proposal has rendered, the real gate is enforced at confirm-time, same limitation already documented for other entity types after BUG-CRX-056/061).
3. Click Confirm.
4. Observe the final chat bubble's icon and text together.
5. Independently verify via native UI (as admin, since `daisy.skye` lacks `view_crm` to check herself): `/leads` still shows only the 2 pre-existing leads — no "Ember Lilac" was created.

## Expected result

- A failed write attempt must be visually and textually distinguishable from a successful one. A checkmark (✓) is this chat UI's established success indicator (used correctly for genuine successes, e.g. "✓ Lead 'Priya Sharma' created (ID: 1)." earlier in this same test session) — it must never prefix a genuine permission-denial/error message, since a user scanning for ✓ would reasonably read it as confirmation the action worked.

## Actual result

The final bubble reads:

> **✓** Forbidden To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]

The leading **✓** prefixes a message that is unambiguously reporting a failure (the word "Forbidden" and the remediation instructions that follow it) — the exact same defect shape as **BUG-CRX-054** (closed 2026-10-12 as fixed, on the Project Manager agent's Create-issue error path) and the historical **BUG-CRX-018** (closed 2026-09-25, also first found on this same Sales Agent, on a different tool). This is a **recurrence of an already-fixed pattern on a new trigger path** — the Sales Agent's `Crm Create Lead` permission-denial rendering was never covered by either prior fix, since both were scoped to their own specific tools/agents at the time.

**No data-integrity issue**: the real permission check genuinely fired server-side and no lead was created (independently confirmed via native `/leads`, still exactly 2 rows) — this is purely a misleading-icon rendering defect on an otherwise-correct refusal, not a permission bypass.

## Repro 2 — same pattern on 3 separate read-path refusals (TC-CRX-247)

As the same `daisy.skye`, in a fresh chat, 3 separate read questions all hit the identical shape:

1. "List all leads." → `✓ I don't have permission to list all leads. Your Redmineflux administrator needs to grant you access to the CRM leads view. ...`
2. "Show me leads with status New." → `✓ You don't have permission to view leads in Redmineflux. ...`
3. "Show me leads from source Website." → `✓ You don't have permission to view leads in Redmineflux. ...`

All 3 are honest, correctly-scoped refusals (no leak of the real lead data — `daisy.skye` lacks `view_crm`) — but every single one carries the same leading **✓**. This confirms the defect isn't scoped to the write/confirm-card path alone (Repro 1, Create Lead) — it affects the Sales Agent's plain read-question replies too, consistent with BUG-CRX-054's own working theory that the chat bubble renderer checkmarks any completed tool-call turn regardless of the tool result's actual success/failure status, not something specific to confirm-card flows.

## Evidence

### Screenshot

![Misleading checkmark prefixing a genuine Forbidden refusal on a lead-create attempt](../../screenshots/BUG-CRX-067/misleading-checkmark-on-forbidden-lead-create.png)
![Repro 2 — same misleading checkmark on 3 read-path "no permission" refusals](../../screenshots/BUG-CRX-067/repro-2-read-path-list-leads-checkmark-refusal.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-067/retest-yyyy-mm-dd-pass.png)

### Console / log

- Exact final bubble text (captured via accessibility snapshot): `✓ Forbidden To fix this, ask your Redmineflux administrator to: • Grant you the required role/permission for this action • Check: Administration → Roles and Permissions → [your role]`
- Native UI (`/leads`, checked as admin): still exactly 2 rows (Celeste Dawn, Priya Sharma) both before and after this attempt — confirms no silent write occurred.
- For comparison, a genuine success earlier in the same test session (as admin, same tool): `✓ Lead 'Priya Sharma' created (ID: 1).` — identical checkmark styling, opposite real outcome.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Same defect **class** as the already-closed BUG-CRX-018 (first found on this same Sales Agent, 7.0.0 cycle) and BUG-CRX-054 (Project Manager agent, closed 2026-10-12) — recorded as a new, separate bug per the repo's own established precedent for this exact situation (BUG-CRX-027/028 were filed the same way as new recurrences of BUG-CRX-020's pattern on new trigger paths, rather than reopening the original). This is the first confirmed instance of the misleading-checkmark pattern on the new Redmine 6 stack's Sales Agent specifically, on a genuine Redmine-permission Forbidden response (as opposed to BUG-CRX-054's "project not found / no permission" business-rule-shaped failures).
