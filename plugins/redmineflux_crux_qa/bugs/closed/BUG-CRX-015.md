# Bug Report Template

- Bug ID: BUG-CRX-015
- Production Redmine Issue ID: #120669
- Title: Sales Agent's "link contact to deal" intent demands an unrelated numeric Redmine `project_id` that the CRM plugin never exposes anywhere, making the capability effectively unusable via chat; a first attempt also falsely claimed a real, existing contact didn't exist
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (real CRM plugin access)
- Date: 2026-09-15

## Steps to reproduce

1. With a real contact (Priya Sharma, ID:1, linked to Acme Corp) and a real deal (Acme Corp Renewal, ID:1) both already existing and visible in the CRM UI, ask the Sales Agent (via "CRM," prefix): "CRM, link contact Priya Sharma to the Acme Corp Renewal deal."
2. Observe the response.
3. Retry with the contact/deal IDs spelled out explicitly: "CRM, link contact ID:1 (Priya Sharma) to deal ID:1 (Acme Corp Renewal)."
4. Observe the response, and follow whatever clarification is requested.

## Expected result

- Per TC-CRX-013 ("Link contact [X] to deal [Z]"), this should produce a normal confirm proposal using the real contact/deal names or IDs already established elsewhere in the same session — consistent with every other CRM write action (create contact/company/deal/lead), none of which require a Redmine `project_id`.

## Actual result

- **First attempt** produced a false negative: "I found the deal Acme Corp Renewal (ID:1), but there is no contact named Priya Sharma in the CRM." Priya Sharma (Contact ID:1) demonstrably exists — confirmed via the real `/contacts` page at the same moment, showing her row with the exact name, email, and Acme Corp company link.
- **Second attempt**, using explicit IDs, got past the false negative but produced a new, unprecedented blocker: "I need the project ID to link a contact to a deal. Which Redmine project should this link be created in?"
- This "project ID" requirement does not correspond to anything in the CRM plugin's own UI or data model: the `/contacts`, `/companies`, `/deals`, and `/leads` list pages have no project column, and creating a company/contact/deal/lead via chat earlier in the very same session never once asked for a project. No amount of clarification resolved it:
  - Providing "the current project" — routed (without the "CRM," prefix) to the Project Manager, which said it had no "current project" context either.
  - Providing the production project name "ztflux" — the Sales Agent then said it needs a *numeric* ID, not a name, and asked the user to supply one, offering no way to look it up itself.
- The capability is therefore practically unusable via chat: a real user has no way to discover what numeric "project ID" the tool wants, since the CRM plugin itself never surfaces or requires one anywhere else.
- Because of this, TC-CRX-013's "unlink" and later verification-of-link steps could not be reached at all.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and cross-checked against the real `/contacts` page (Priya Sharma, ID:1, row present) at the time of the false-negative claim.

### Console / log

```
C: CRM, link contact Priya Sharma to the Acme Corp Renewal deal.
-> asking the Sales Agent...
I found the deal Acme Corp Renewal (ID:1), but there is no contact named Priya Sharma in the CRM.
Would you like me to:
1. Create Priya Sharma as a new contact first, then link her to the deal?
2. Search for a similar contact name?
3. Link a different contact to this deal?

C: CRM, link contact ID:1 (Priya Sharma) to deal ID:1 (Acme Corp Renewal).
-> asking the Sales Agent...
I need the project ID to link a contact to a deal. Which Redmine project should this link be created in?

C: CRM, use project ztflux to link contact Priya Sharma (ID:1) to deal Acme Corp Renewal (ID:1).
-> asking the Sales Agent...
I need to confirm the project ID number for "ztflux" before I can proceed. The link tool requires a numeric
project ID, not a name. Do you know the numeric ID for the "ztflux" project?
```

Real `/contacts` page at the time of the first (false-negative) response: row present — "PS Priya Sharma", priya.sharma@acmecorp.test, linked to Acme Corp (`/companies/1`).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (the false-negative "no contact named X" half is superficially similar to BUG-CRX-014's false "no write tools" claim, but that bug is about mis-routing to the wrong agent entirely; here the Sales Agent itself — the correct agent — is making the false claim, and the more severe finding is the unresolvable "project ID" requirement, which is a distinct root cause)

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff updated `agents/crm-sales.md` (the Sales Agent's own system prompt) to correct the underlying conceptual confusion: it now explicitly states that `link_contact`/`link_deal` attach a CRM record to a Redmine issue/ticket (legitimately needing `project_id`+`issue_id`) — and that "link contact X to deal Y" is NOT that kind of link at all, since a deal already carries `contact_id`/`company_id` as its own fields. The correct mapping for that phrasing is `update_deal(deal_id, contact_id=X)`, not `link_contact`.

**Retest (exact original repro):** With the same real records still in place (Priya Sharma, Contact #1; Acme Corp Renewal, Deal #1), sent: `CRM, link contact Priya Sharma to the Acme Corp Renewal deal.`

**Result:** No false negative ("no contact named Priya Sharma") and no unresolvable "project ID" demand — the Sales Agent immediately produced a genuine `Crm Update Deal` proposal (`Deal: 1, Contact: 1`). Confirmed → `"✓ Deal #1 updated successfully."` Verified live on the real `/deals/1` page: **Contact: Priya Sharma** now genuinely shown on the deal record.

**Verdict: FIXED.**

## Production report

Reported to production as issue **#120669** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`, found via TC-CRX-013) — testcase marked Failed.
