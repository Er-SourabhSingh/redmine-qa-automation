# Organization / Contact — Cross-Plugin Flow (Platform / CRM / Helpdesk / Invoice)

> Same purpose as the Team, Leave, and Holiday cross-plugin flow suites, this time for Platform's "Customers"
> group — Organization, Contact, and Contact Links — as experienced from CRM, Helpdesk, and Invoice. Per
> Platform's own Overview page, these three plugins are the documented consumers of this group (distinct from
> the "People" group — Team/Leave — and "Working days" group — Holiday — already audited).
>
> Sources read before writing: https://www.redmineflux.com/knowledge-base/plugins/crm/ and
> https://www.redmineflux.com/knowledge-base/plugins/invoice/ (both fetched 2026-10-13), plus live
> confirmation against this instance's own Platform Contact form and Helpdesk's New Customer form.
>
> **Key clarification confirmed before writing any case (raised directly by the user):** Contact and Customer
> are NOT the same entity and should not be treated as needing to merge. **Contact** (Platform/CRM) is a plain
> record — name, email, organization link, no login. **Customer** (Helpdesk's own, `/rf_customers/new`) creates
> a real Redmine User with Login/Password — it can actually log in and raise tickets. Platform's own design
> already reflects this: the Contact form has a "Helpdesk Customer" field whose own tooltip reads *"Link this
> contact to a Helpdesk customer to view their tickets"* — an explicit, optional link between two deliberately
> separate entities, not evidence they should be unified. This suite tests whether that link (and the
> Organization data both plugins share) works correctly, not whether Contact and Customer are "the same."

## Functional Cases — CRM's Contact/Company model vs Platform's consolidated Contact/Organization

> Source: CRM's own KB. Key quotes: *"Contacts store name, email, phone, mobile, job title, address, a contact
> type, a company link, assignee, tags, notes, privacy flag, avatar, and custom fields"*; *"Companies store
> name, email, phone, website, address, industry, employee count..."*; *"Company name is required and must be
> unique"*; *"A bare website domain is automatically given an https:// prefix."* Not yet executed.

### TC-PLT-299 — CRM's own native Contact/Company screens still exist in parallel with Platform's (expected, documented, not a bug)

1. Open CRM's own Contacts and Companies screens natively (not via Platform).
2. Compare field sets against Platform's own consolidated Contact/Organization forms.

**Expected:** Per `PLATFORM_MEMORY.md`'s own top-level note (Roadmap Step 5, "Consumer migration," not yet
started), CRM's own native screens are expected to still exist and function, duplicating Platform's — this is
documented, accepted current state, not itself a new defect to file.

**Status:** Executed 2026-10-15 — **premise superseded, positive finding.** CRM's own native `/contacts` and
`/companies` routes now redirect directly to Platform's consolidated screens (`/redmineflux_platform/list/contacts`
and `/redmineflux_platform/list/organizations`) — CRM has evidently progressed further in Step 5 "Consumer
migration" than this suite's original 2026-10-13 write-up assumed. Not a defect; the opposite of one. Worth a
positive note in `PLATFORM_MEMORY.md` and a re-check of whether `PLATFORM_MEMORY.md`'s top-level "Step 5 hasn't
started" note still holds for CRM specifically.

### TC-PLT-300 — A bare website domain gets an auto https:// prefix on Platform's own Organization form too

**Preconditions:** None.

1. On Platform's own "New Organization" form, enter a website value with no protocol (e.g. `example.com`) and
   save.

**Expected:** Per CRM's documented behavior (*"A bare website domain is automatically given an https://
prefix"*), Platform's own consolidated form — which is meant to be the canonical screen for this entity —
should apply the same normalization, not just CRM's own native form.

**Status:** PASS (2026-10-15). Platform's own New Organization form shows the hint "https:// is added if you
leave it out," and live-verified: entering `example-tc300.com` saved as `https://example-tc300.com` on the
Organization's detail page. Test fixture ("TC-PLT-300-Verify-Org") created and deleted in the same pass.

## Functional Cases — Deleting an Organization/Contact: reference-clearing, not cascade

> Source: CRM's own KB. Key quotes: *"Deleting a company: Its activities are removed. Linked contacts and
> deals keep existing, but their company reference is cleared... contacts are not deleted"*; *"Deleting a
> contact: Its activities and Redmine issue links are removed, and linked deals lose their contact reference...
> The company record is not affected."* Not yet executed.

### TC-PLT-301 — Deleting an Organization clears linked Contacts' reference, does not delete the Contacts

**Preconditions:** An Organization exists with at least one linked Contact.

1. Delete the Organization via Platform's own screen.
2. Check whether the previously-linked Contact still exists, and what its Organization field now shows.

**Expected:** Per CRM's documented behavior, the Contact should survive with its Organization reference
cleared (not deleted itself) — this is the **opposite** pattern from Team's own cascade-delete-of-Workloads
behavior (`BUG-PLT-030`), so don't assume the same cascade risk applies here without checking; confirm which
pattern Platform's consolidated Organization delete actually follows.

**Status:** PASS (2026-10-15). Deleted "TC-PLT-300-Test-Org" with a linked Contact ("TC301 Contact") attached;
the Contact survived the delete with its Organization reference correctly cleared — confirmed via the delete
confirmation dialog's own generic wording ("This record will be removed permanently. If another module still
depends on it, nothing is deleted and you are told why.") and by reopening the Contact afterward. Matches CRM's
documented "clear reference, don't cascade" behavior, the opposite of Team's cascade pattern.

### TC-PLT-302 — Deleting a Contact does not affect its Organization

**Preconditions:** Same Organization/Contact pair as TC-PLT-301 (or a fresh pair).

1. Delete the Contact via Platform's own screen.
2. Check whether the Organization record is unaffected.

**Expected:** Per CRM's documented behavior (*"The company record is not affected"*), the Organization should
remain exactly as it was.

**Status:** PASS (2026-10-15). Deleted "TC301 Contact" (linked to "TC-PLT-302-Test-Org"); the Organization
record was unaffected — confirmed by reopening it afterward, still present with all its own fields intact and
contact count correctly decremented.

## Functional Cases — Contact ↔ Helpdesk Customer link

> Source: CRM's own KB (*"When [Helpdesk is] installed, a contact can link to a Redmine helpdesk customer
> user, show that user's recent issues, and show customer organization or SLA details... If the helpdesk
> plugin is not installed, those sections stay inactive or hidden"*) plus live confirmation this session:
> Platform's own Contact form has a "Helpdesk Customer" field with that exact linking tooltip; Helpdesk's own
> "New Customer" form (`/rf_customers/new`) creates a full Redmine User (Login/Password/Confirmation) with no
> reciprocal "link to Contact" field of its own. Not yet executed.

### TC-PLT-303 — Linking a Contact to a Helpdesk Customer actually surfaces that customer's tickets

**Preconditions:** A Helpdesk Customer exists with at least one ticket. A Platform Contact exists, unlinked.

1. On the Contact's edit form, set "Helpdesk Customer" to the existing customer and save.
2. Reopen the Contact and check whether it now shows that customer's recent tickets (per the CRM KB's own
   promise: *"show that user's recent issues"*) and organization/SLA details.

**Expected:** The linked ticket/organization/SLA information should actually appear on the Contact — not just
accept the link silently with no visible effect.

**Status:** PASS, with a mechanism clarification (2026-10-15). Setting a Contact's "Support portal login" field
to a Helpdesk Customer immediately surfaces that customer's Organization/SLA Level/Response Time/Resolution
Time/Support Level in a "Helpdesk Customer Information" panel — confirmed live. Surfacing the customer's actual
*tickets*, however, is a **separate manual step**: open the ticket itself and use its own "CRM Links" panel →
Contact → "Add Link" → select the Contact. Once that link was made (ticket #2, raised by "TC303 Customer"),
it correctly appeared under the Contact's "Linked Redmine Issues." Initially mis-read the two-part KB promise as
a bug (half built) and filed `BUG-PLT-049`; retracted same session once the ticket-side CRM Links panel was
pointed out — see `PLATFORM_MEMORY.md` for the full writeup. Net result: the full KB promise does hold, it's just
two independent actions, not one.

### TC-PLT-304 — The Contact↔Customer link has no reciprocal entry point from the Customer side

**Preconditions:** None beyond a Contact and a Customer both existing, unlinked.

1. Open Helpdesk's own "New Customer" (`/rf_customers/new`) and "Edit Customer" forms and look for any field to
   link to an existing Contact.

**Expected/Actual (confirmed live already, this session):** No such field exists on either Customer form —
the link can only be initiated from the Contact's own side. **Status: confirmed asymmetric** — not yet decided
whether this is a gap worth filing (a Helpdesk admin creating a Customer first, before any Contact exists for
that person, has no way to create/link the Contact from here) or acceptable given Contact is optional. Flag for
discussion rather than auto-filing — re-confirm this TC's result during execution before deciding.

**Status:** Confirmed, decided NOT a bug (2026-10-15). Re-confirmed live: neither Helpdesk's New Customer nor
Edit Customer form has any field to link to an existing Contact — the link can only be initiated from the
Contact's own "Support portal login" field. Decision: accepted design asymmetry, not filed. Contact is explicitly
optional (per this suite's own intro), and creating/linking a Contact afterward is a cheap, one-field action from
the Contact side — the asymmetry doesn't block any workflow, it just means a Helpdesk admin who creates a
Customer first has to remember to also create a Contact if they want the CRM-side view. Worth a low-severity UX
suggestion if this plugin ever gets a dedicated UX-polish pass, but not worth a bug report on its own.

## Functional Cases — Invoice's own Customer/Organization touchpoint (needs live resolution — KB doesn't say)

> Source: Invoice's own KB — explicitly does **not** confirm whether Invoice shares Organization/Customer data
> with CRM/Helpdesk (*"The page names the CRM and Helpdesk plugins only in the sidebar list and says nothing
> about shared data"*). Live check this session found **no standalone "Customer" nav item in Invoice at all**
> (unlike the KB's own description of a "Customer tab in the top navigation" with Name/Company/Email/Phone/
> Address/Tax ID fields) — suggesting Invoice's own native Customer screen may have already been retired in
> favor of Platform's Organization, ahead of what its own public KB still documents. This needs to be
> confirmed properly, not assumed from either source alone.

### TC-PLT-305 — Does Invoice still have its own native Customer entity, or has it already migrated to Platform's Organization?

**Preconditions:** None.

1. Search Invoice's own nav/settings for any Customer management screen (per its own KB: *"managed from a
   Customer tab in the top navigation"*).
2. If none exists, find where an Invoice is actually attached to a customer/organization (per the KB: *"Each
   project is linked to one customer for billing"* — check Project Settings for an Invoice-specific tab, or
   the New Invoice form itself after selecting a project).
3. Confirm whether that customer/organization reference is Platform's own shared Organization, or a separate,
   Invoice-only record.

**Expected:** Per Platform's own Overview page (which lists Invoice as a consumer of the "Customers" group —
Organization/Contact/Contact Links), Invoice should be reading Platform's shared Organization data, not
maintaining a separate one — if so, this would mean Invoice is actually **further along** in Step 5 migration
than CRM or Shift Management, worth noting as a positive finding rather than assumed.

**Status:** PASS, confirmed 2026-10-15 — Platform's claim holds, via a screen this session initially missed. No
standalone "Customer" nav screen exists in Invoice (confirmed again this session), and the project-scoped route
guessed earlier (`/projects/<id>/settings/invoice`) still doesn't resolve — but the real mechanism is Invoice's
own **"Billing Settings"** tab (`/projects/<id>/invoices/billing`, linked from the project's own Invoice nav, not
Redmine's generic Project Settings), which has a "Contact \*" dropdown: *"Select the contact for this project.
Contact details will be used in invoices."* Setting a project's Billing Settings Contact to a Platform Contact,
then opening that project's own New Invoice form (`/projects/<id>/invoices/new`, not the global `/invoices/new`),
correctly auto-populated Client Name and Client Email from that Contact. Initially missed this screen, concluded
Invoice was fully disconnected from Platform's Organization/Contact data, and filed `BUG-PLT-050`; retracted
same session once the user pointed at the Billing Configuration panel. See `PLATFORM_MEMORY.md` for the full
writeup and the lesson (check project-scoped config screens, not just a plugin's global top-nav form, before
concluding an integration doesn't exist).

## Functional Cases — CRM Contact Links, Deal creation, and Invoice creation with a Platform Contact

> Added 2026-10-15 at the user's direct request to close out remaining untested Contact consumption points:
> "Contact links" (the `rf_organization_contact_links` feature `BUG-PLT-026` originally found had a data model
> but zero UI — now built and live), Deal creation from a Contact in CRM, and full Invoice creation using a
> Contact's billing info (distinct from TC-PLT-305's field-auto-population check, which stopped short of
> actually submitting an invoice).

### TC-PLT-310 — Contact Links (a Contact linked to more than one Organization) works end to end

**Preconditions:** At least two Organizations and one Contact exist.

1. From `/redmineflux_platform/list/organization_contact_links/new`, create a link: Organization =
   "TC-PLT-FULLFIELD-Org" (not the Contact's own primary Organization), Contact = "TC303 Contact", Role =
   "Billing contact", From = today, Primary contact = checked.
2. Confirm the link's own detail page shows all fields correctly.
3. Reopen the Contact's own detail page and confirm the extra Organization appears under "Other organizations".

**Expected:** The link should persist all fields (Organization, Contact, Role, From/Until, Primary contact,
Status) and surface on the Contact's own page as a secondary/"other" organization, distinct from the Contact's
main Organization field.

**Status:** PASS. All fields (Role "Billing contact", Primary contact "Yes", From date, Status "Current")
persisted and rendered correctly on the link's own detail page; "Other organizations: 1" on the Contact's page
correctly lists "TC-PLT-FULLFIELD-Org" with Industry/Email/Status columns and a working View link. `BUG-PLT-026`
(data model with zero UI) is confirmed fully resolved — not just a closed-bug claim, independently re-verified
live this session.

### TC-PLT-311 — Creating a Deal from a Contact in CRM correctly uses Platform's shared Contact/Organization

**Preconditions:** A Contact with an Organization exists.

1. From the Contact's own page, click "Add Deal" (`/deals/new?contact_id=<id>`).
2. Confirm the Contact field is pre-filled/locked and the Organization dropdown auto-selects the Contact's own
   Organization.
3. Fill every other field (Deal Name, Amount, Stage, Probability, Due Date, Assigned To, Tags, Description,
   Private) and submit.
4. Reopen the Deal and the Contact to confirm the Deal appears on both, with correct values including the
   auto-calculated Forecasted Value.

**Expected:** The Deal should read Platform's shared Contact/Organization directly (via working links back to
the Platform screens), not a separate CRM-only copy, and Forecasted Value should auto-calculate as Amount ×
Probability.

**Status:** PASS. Contact field was pre-filled and disabled (non-editable, correctly forcing the relationship);
Organization auto-selected to "TC-PLT-302-Test-Org" (the Contact's own org). Deal "TC303 Fullfield Deal" created
with Amount USD 5,000.00, Stage Qualified, Probability 50%, Forecasted Value correctly auto-calculated to USD
2,500.00, Due Date, Assigned To, Description all persisted. Deal's own detail page Contact and Organization
fields are real hyperlinks back to `/redmineflux_platform/list/contacts/<id>` and `/organizations/<id>` — not
copied/duplicated data. Deal correctly surfaced under the Contact's own "Related Deals" section with amount and
stage.

### TC-PLT-312 — Creating an Invoice using a Contact's billing info works end to end (not just field auto-population)

**Preconditions:** A project's Billing Settings has a Contact assigned (see TC-PLT-305).

1. Open that project's own New Invoice form, add an Invoice Item (User, Hours, Rate, Description), optionally
   check a ticket under "Invoice Issues", add Notes, and submit.
2. Confirm the created invoice's "Bill To", line item, Subtotal/Total, and Notes are all correct.

**Expected:** The invoice should be created successfully with the Contact's name/email carried through to "Bill
To", and the line item's hours × rate should correctly compute the Subtotal/Total.

**Status:** PASS. Invoice #INV-2026-0002 created with Bill To "TC303 Contact / tc303.contact@test.local" (the
project's Billing Settings Contact), one line item (Aurora Wren, 10.00 hours, USD 50.00/hr, USD 500.00),
Subtotal and Total both correctly USD 500.00, Notes persisted, Status Draft. Confirms TC-PLT-305's finding holds
all the way through actual invoice creation, not just the New Invoice form's field auto-population.

> **Note on a false alarm during this pass:** mid-test, the per-project Billing Settings Contact appeared to
> change on its own from "TC303 Contact" to "FullField Contact" between two New Invoice page loads. This was
> the user's own direct action (manually changing it) made concurrently in another tab/session, not a product
> defect — confirmed by the user directly and by the Billing Settings page's own "Contact ... added to project"
> success banner showing a real, intentional save. No bug filed.

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-299 | PASS (positive finding — premise superseded) | — | CRM's native Contact/Company routes now redirect to Platform's screens |
| TC-PLT-300 | PASS | — | `https://example-tc300.com` auto-prefixed on Platform's own form |
| TC-PLT-301 | PASS | — | Organization delete clears Contact's reference, doesn't delete it |
| TC-PLT-302 | PASS | — | Contact delete leaves Organization untouched |
| TC-PLT-303 | PASS (mechanism clarified) | Filed then retracted (`BUG-PLT-049`) | Org/SLA auto-surfaces; tickets need a separate manual CRM Links step |
| TC-PLT-304 | Confirmed, not filed (accepted asymmetry) | — | No reciprocal Contact-link field on Customer forms |
| TC-PLT-305 | PASS (mechanism clarified) | Filed then retracted (`BUG-PLT-050`) | Invoice reads Platform's Contact via per-project Billing Settings |
| TC-PLT-310 | PASS | — | Contact Link (multi-organization) created and verified on both sides |
| TC-PLT-311 | PASS | — | Deal created from Contact, Forecasted Value auto-calculated correctly |
| TC-PLT-312 | PASS | — | Invoice #INV-2026-0002 created end to end using Contact's billing info |

## Summary (2026-10-15)

All 10 cases executed. Net result: **0 bugs** — nine clean PASSes plus one accepted, undecided-by-design
asymmetry (TC-PLT-304). Two findings (TC-PLT-303, TC-PLT-305) were initially mis-read as bugs and filed
(`BUG-PLT-049`, `BUG-PLT-050`), then retracted the same session once a screen this session had missed was
pointed out in each case — both times, the real mechanism turned out to be a *separate, manual* linking step
(the ticket's own CRM Links panel; the project's own Billing Settings tab) rather than something automatic. See
`PLATFORM_MEMORY.md` for both writeups and the shared lesson: check every related screen — including
project-scoped config tabs, not just a plugin's global top-nav form or the record's own edit form — before
concluding a documented integration doesn't work.

TC-PLT-310–312 (added later the same day, at the user's direct request to close out Contact Links, Deal
creation, and full Invoice creation) all PASS with zero defects — Contact Links (`BUG-PLT-026`'s original
"data model with zero UI" finding) is now fully built and working; Deal creation correctly reads Platform's
live Contact/Organization via real hyperlinks, not a copy; Invoice creation end-to-end confirms TC-PLT-305's
auto-population finding holds all the way through a real submitted invoice.

Unlike the Team/Leave/Holiday suites, this one started from a corrected premise raised directly by the user:
Contact and Customer are deliberately separate entities (one a plain record, one a login-capable Redmine User),
linked optionally rather than meant to merge. That premise held up throughout — the link works end-to-end
(TC-PLT-303), the one-sidedness (TC-PLT-304) is an acceptable, low-cost gap rather than a blocker, and
Organization/Contact deletion follows the gentler "clear reference" pattern CRM's own KB documents, the opposite
of Team's cascade-delete pattern (TC-PLT-301/302).
