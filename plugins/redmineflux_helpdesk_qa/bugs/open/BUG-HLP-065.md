# BUG-HLP-065

- Bug ID: BUG-HLP-065
- Production Redmine Issue ID: 121402
- Title: Support Package has no single owner for an organization's project — it is optional and recorded separately on every budget top-up and on every customer row, so one organization + project can carry several conflicting packages (and SLAs) at once
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, includes HD-4/HD-5/HD-6/HD-7 per production issue #121289, branch `helpdesk_budget` merged, commit `74c4ed0`)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Severity: Medium
- Date: 2026-09-28

## Steps to reproduce

1. Log in as `admin`.
2. Open Organization → **Alpha Minimal Fields Test Org** → **Prepaid Support Hours**.
3. Click **Add / top up hours**: Project = Helpdesk QA Alpha, Hours = 0.25, **Support Package = Basic Support**, add a comment, Save.
4. Click **Add / top up hours** again: same project, Hours = 0.25, **Support Package = Premium Support**, add a comment, Save.
5. Look at the **Budget by project** row for Helpdesk QA Alpha and at the **Budget history** table.
6. Open Customers → **Delta Customer** → Edit and look at the Helpdesk QA Alpha row's **Support Package** (the same organization, same project).

## Expected result

A Support Package is the service tier an organization has bought for a project (Basic / Standard / Premium), and since HD-6 it decides the SLA. For any one organization + project there should be one package in force:

- The package belongs to the **organization + project budget** itself, the same way "When hours run out" and "Deduction rules" already do. Top-ups add hours to that budget; they shouldn't each carry their own package.
- It should be **mandatory when budget is added**: the **Add / top up hours** dialog must not save without a Support Package, since the SLA depends on it. Once a project's budget has its package, later top-ups on that project start with the same package already filled in.
- A customer's SLA on that project should come from that one package, not from a package picked separately on the customer's own row.

## Actual result

- **Two different packages accepted on the same budget.** Both top-ups saved with the same flash ("Prepaid support hours for 'Alpha Minimal Fields Test Org' have been updated."). Budget history now lists two separate rows, "+0.25h · **Basic Support**" and "+0.25h · **Premium Support**", for the same organization and project.
- **No current package anywhere.** The Budget by project row has columns for Project, Approved, Used, Remaining, Usage, When hours run out, Deduction rules, Last change and Action. None of them is the package, so there's no way to tell which package (and therefore which SLA) is actually in force.
- **The package is optional.** The top-up dialog defaults to "-- No package --" and saves without one. Most of this organization's existing top-ups show "None".
- **The customer row has its own, unrelated package.** For the same organization + project, `delta.customer`'s Helpdesk QA Alpha row has Support Package **"Standard Support"**, and its SLA comes from *that* package (plus an override), not from anything on the organization's budget. Changing the budget's package has no effect on the customer. The customer-row package is also optional ("-- No package --"; `delta.customer`'s Beta row has none).

So one organization + project currently has **three packages, Basic, Premium and Standard, and none of them is authoritative.**

The test top-ups were reversed straight after with a −0.50h reduction; Alpha is back to 21.67h Approved / 14.92h Used / 6.75h Remaining.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-065/conflicting-packages-one-budget.png)

*Budget by project (top) has no package column. In Budget history, rows 2 and 3 are two top-ups on the same Helpdesk QA Alpha budget, one with Premium Support and one with Basic Support. Row 1 is the reversal.*

### Console / log

Budget history, first 3 rows as read from the page right after step 4:

```
1 | 09/28/2026 09:23 AM | Helpdesk QA Alpha | Top-up | — | Premium Support | UX exploration ... top-up B ... | +0.25h
2 | 09/28/2026 09:23 AM | Helpdesk QA Alpha | Top-up | — | Basic Support   | UX exploration ... top-up A ... | +0.25h
3 | 09/28/2026 07:02 AM | Helpdesk QA Alpha | Top-up | — | None            | Restoration - BUG-HLP-037 ...   | +7.75h
```

Top-up form fields (inspected in the page's HTML): `project_id`, `hour`, `rf_helpdesk_support_package_id` (optional, defaults to "-- No package --"), `comment`.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-065/retest-yyyy-mm-dd-pass.png)

## Notes

- Raised by the user during a UX review (2026-09-28). Their suggested model: the package is set on the organization's budget, one per project, and is mandatory. The SLA follows from that package. The customer form carries only Project + Support Level per row (see BUG-HLP-064), with no package or SLA dropdowns.
- **Also recommended as part of this fix, raised by the user:** give Support Package a **standard hours** field (e.g. Premium = 50h), so a top-up works like choosing a recharge plan. Today the package has only Name, Description, SLA, Default Support Level and Active, so every top-up needs the hours typed by hand, and a wrong entry (e.g. 5h instead of 50h) goes through unnoticed. Suggested behavior:
  - Picking a package pre-fills Hours from it. Hours stays editable for reductions (negative entries), pro-rated/partial top-ups and goodwill adjustments. If the entered value differs from the package's standard, show a warning and ask for confirmation.
  - Changing a package's standard hours later (50h → 60h) affects only new top-ups. Existing Budget history entries keep the hours they were recorded with.
  - Blank or 0 standard hours allowed for support-only packages (SLA, no prepaid hours).
- **Also recommended as part of this fix, raised by the user: make SLAs Global-only.** SLAs were made project-level when the plugin was first built, because Support Level was chosen inside the SLA. That is no longer the case: Support Level is now its own field. Since HD-6, a customer's SLA should come from the package, and a package can only link to a **Global** SLA. That leaves project-level SLAs with no role in this model, and two SLA systems now live side by side:
  - SLAs are managed in two places: each project's Helpdesk → SLA tab, and Helpdesk Settings → Global SLAs.
  - The customer row's SLA dropdown lists project SLAs and Global SLAs together with nothing to tell them apart. The Helpdesk QA Alpha row offers 20+ Alpha SLAs plus "QA Global SLA TC-HLP-420". The Helpdesk QA Beta row offers "Beta Standard SLA" plus the same Global SLA.
  - Suggested direction: keep only Global SLAs and retire project-level SLA create/edit. Existing project-level SLAs still in use on customer rows or tickets need a migration path, since ticket SLA history must not break.
- Open design questions the fix needs to settle:
  - What SLA does a customer get when their organization has no budget on that project?
  - Can an organization hold a package with 0 prepaid hours (a support-only contract)?
  - When a package changes mid-contract, do tickets already in progress keep their old SLA? Today's rule is that the SLA locks when a ticket is first assigned.
  - Does the per-customer Override still have a place?
- **Also recommended as part of this fix, raised by the user: remove Support Level from Support Package.** A package is a project-independent service tier (Basic / Standard / Premium, like a subscription plan), but a Support Level belongs to one project: it's that project's own L1/L2/L3 and the agents assigned to it. Today the package form has an optional "Default Support Level" that lists every project's levels mixed together ("Helpdesk QA Alpha — L1", "Helpdesk QA Beta — AB-L1", "Redmineflux Helpdesk — L1 - Helpdesk Support", …). So a package can carry a level that doesn't exist on the customer's project; the form's own hint says it's then ignored ("Only used when the customer's project has a matching Support Level"). Suggested direction: drop "Default Support Level" from the package. Pick Support Level only on the customer's project row, where the dropdown is already correctly limited to that project's own levels (verified: Alpha row offers L1/L2/L3, Beta row offers only AB-L1). Together with BUG-HLP-064, each customer project row would then hold just **Project + Support Level**.

## Retest — 2026-09-28 (after dev fix, branch `helpdesk_budget`, commit 4aafeb3)

**PARTIALLY FIXED — stays open.** The structural parts of the fix are genuinely done; the behavioral parts (propagation, SLA auto-fill) are not, and the dev's own journal describes both working when they don't.

- ✅ **Package is now on the organization+project budget row**, its own column ("Support Package") next to "When hours run out" and "Deduction rules" on org 8's Budget by project table, one selector per project — matches the recommendation exactly.
- ✅ **The top-up dialog no longer asks for a package.** Confirmed live: the "Add / top up hours" dialog now has only Project, Hours, Comment.
- ✅ **Support Package gained a "Standard Hours" field** ("Optional. Pre-fills Hours on a top-up for this package. Leave blank for a support-only package with no fixed hour amount.") and **"Default Support Level" is gone** — confirmed on `/rf_helpdesk_support_packages/7/edit`.
- ❌ **Propagation to existing customers does not happen, and no confirmation prompt appears.** Assigned "Standard Support" (real `rf_sla_id: 33`) to the Alpha+org-8 pair, which `delta.customer` already has a row on. No "Apply to N customer(s)" dialog appeared at all — the change saved silently. Checked `delta.customer`'s SLA afterward: still "Alpha Priority SLA", completely unchanged. This directly contradicts the journal's claim: "assigned Premium Support to the pair, confirmed 'Apply to 1 customer(s)' appeared, applied it, confirmed in the database that the customer's SLA actually changed."
- ❌ **A new customer's SLA does not auto-fill from the pair's package**, even though the field correctly locks. Created a new customer, selected Organization = Alpha Minimal Fields Test Org and Project = Helpdesk QA Alpha (the same pair just assigned Standard Support, `rf_sla_id: 33`, confirmed via `rails runner`). The SLA Name field went `disabled` as expected — but its value is blank (`""`), not SLA #33. A customer created this way would silently end up with no SLA at all on a required field. This contradicts the journal's claim: "confirmed the SLA auto-fills and locks live from the pair's package."
- ⏸️ **"Make SLAs Global-only" / "retire project-level SLA management" — not attempted at all, by the developer's own admission.** This was one of this bug's own recommended fix items (see "Also recommended as part of this fix... make SLAs Global-only" above), so it stays tracked here, not split elsewhere. Verified live: `/projects/helpdesk-qa-alpha/helpdesk/sla` still lists 22 real project-scoped SLAs with working Edit links, and "New SLA" still opens a genuine, working create form at `/projects/1/rf_slas/new` — nothing here was retired. The customer form's SLA Name dropdown still mixes project-scoped and Global SLAs in one list (28 options on Alpha's row) with no way to tell them apart. The journal itself flags this honestly rather than falsely claiming it was done: *"The 'Make SLAs Global-only' and 'retire project-level SLA management' parts of the recommendation were deliberately left out of this pass — that's a bigger, separate behavior change (retires an existing feature, needs its own migration path for SLAs already live on tickets) that wasn't one of the confirmed decisions. Flagging it back as a possible follow-up rather than folding it in silently."*

**Stays open**, re-scoped to the three remaining unmet parts of the original recommendation: propagation to existing customers, SLA auto-fill on new customers, and making SLAs Global-only / retiring project-level SLA management. The two ❌ items are false claims (the journal says they work, they don't); the ⏸️ item is an honestly-deferred piece of work the developer flagged themselves, not a false claim — worth keeping that distinction in mind when this goes back to Vaishnavi. The schema/UI restructuring already done (package ownership, standard hours, dropped support level) doesn't need to be revisited.

## Duplicate check

- Duplicate found: No. TC-HLP-211 / TC-HLP-425 / TC-HLP-428–430 confirm the package label is recorded on a top-up and that package→SLA copying works on a customer row. None of them checks whether one organization + project can end up with conflicting packages.
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121402** (`ztflux`), tracker Bug, Priority Medium, Category Helpdesk Plugin (set with a follow-up `update_issue`), assigned to **Vaishnavi Bhawsar** (id 192). Defect Type / Severity / priority: Functional / Medium-severity / Medium. Attached to the same Test Case **#121398** / Run **#583** ("Sanity Testing - Feature #121289", Environment "Window 11 + Chrome") as BUG-HLP-062/063, via `report_defect`, testcase result Failed. The production description includes the full recommended fix: package on the budget row, standard hours on the package, Global-only SLAs, and no Support Level on the package. It also lists the open design questions. All checked via `get_issue`.
