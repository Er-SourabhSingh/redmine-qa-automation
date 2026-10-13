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

**Status:** Not yet executed. This case exists to give the rest of this suite a confirmed baseline, not to
produce a new FAIL.

### TC-PLT-300 — A bare website domain gets an auto https:// prefix on Platform's own Organization form too

**Preconditions:** None.

1. On Platform's own "New Organization" form, enter a website value with no protocol (e.g. `example.com`) and
   save.

**Expected:** Per CRM's documented behavior (*"A bare website domain is automatically given an https://
prefix"*), Platform's own consolidated form — which is meant to be the canonical screen for this entity —
should apply the same normalization, not just CRM's own native form.

**Status:** Not yet executed. If Platform's own form does NOT normalize the URL the way CRM's native one does,
that is a parity gap between the canonical screen and the one it's meant to replace.

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

**Status:** Not yet executed.

### TC-PLT-302 — Deleting a Contact does not affect its Organization

**Preconditions:** Same Organization/Contact pair as TC-PLT-301 (or a fresh pair).

1. Delete the Contact via Platform's own screen.
2. Check whether the Organization record is unaffected.

**Expected:** Per CRM's documented behavior (*"The company record is not affected"*), the Organization should
remain exactly as it was.

**Status:** Not yet executed.

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

**Status:** Not yet executed.

### TC-PLT-304 — The Contact↔Customer link has no reciprocal entry point from the Customer side

**Preconditions:** None beyond a Contact and a Customer both existing, unlinked.

1. Open Helpdesk's own "New Customer" (`/rf_customers/new`) and "Edit Customer" forms and look for any field to
   link to an existing Contact.

**Expected/Actual (confirmed live already, this session):** No such field exists on either Customer form —
the link can only be initiated from the Contact's own side. **Status: confirmed asymmetric** — not yet decided
whether this is a gap worth filing (a Helpdesk admin creating a Customer first, before any Contact exists for
that person, has no way to create/link the Contact from here) or acceptable given Contact is optional. Flag for
discussion rather than auto-filing — re-confirm this TC's result during execution before deciding.

**Status:** Not yet executed (live confirmation of the asymmetry itself already done; the open question is
whether it rises to a bug).

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

**Status:** Not yet executed — this live search was started but not completed this session (Invoice's own
`/projects/<id>/settings/invoice` route did not resolve as expected on this instance; the correct path needs
to be found live, not guessed).

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-299 – TC-PLT-305 | Not yet executed | — | Organization/Contact/Customer cross-plugin flow — written 2026-10-13, pending first live execution pass |

## Summary (2026-10-13)

7 cases written, none yet executed. Unlike the Team/Leave/Holiday suites, this one starts from a corrected
premise raised directly by the user: Contact and Customer are deliberately separate entities (one a plain
record, one a login-capable Redmine User), linked optionally rather than meant to merge — so the right
questions here are whether that link actually works end-to-end (TC-PLT-303), whether it's unfairly one-sided
(TC-PLT-304), and whether Organization/Contact deletion follows the gentler "clear reference" pattern CRM's own
KB documents rather than Team's cascade-delete pattern (TC-PLT-301/302) — not whether the two entities should
be forced into one.
