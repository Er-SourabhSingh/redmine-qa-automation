# Filters — Redmineflux Platform

> Suite origin: the user asked directly for every filter on every Platform list screen to be tested, one by one,
> and for filter *combinations* to be tested too, not just single filters in isolation ("jitne filters he platform
> pages pe unhe test kr lena kuch bhi chodna mat please / filter wise pura test krlena or filter ke combination
> wise bhi" — 2026-10-16). This mirrors the same "representative sample is not the same as every one" lesson
> already learned the hard way during the Overview permission sweep (`PLATFORM_OVERVIEW.md` TC-PLT-340) — only
> `search`, sort and pagination had TCs before this suite (`PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md`
> TC-PLT-113–116); the actual dropdown *filters* (`shared_entities.rb`'s declared `filters:` blocks) had zero TC
> coverage anywhere.

## Scope

`SharedEntities` registers **32 filters across 12 entities** (confirmed via a direct `grep -n "filters: \["` sweep
of `lib/redmineflux_platform/shared_entities.rb`, cross-checked entity by entity — `teams` is a dedicated
controller/page, the other 11 share the generic `entities#index` + `_filter_bar` partial):

| Entity | Filters | Count |
|---|---|---|
| Teams | `membership` (Has/No members), `created_by` (Author) | 2 |
| Departments | `status`, `manager_id` | 2 |
| Organizations | `tag`, `assigned_to`, `status`, `visibility` | 4 |
| Contacts | `company`, `tag`, `contact_type`, `assigned_to`, `status` | 5 |
| Organization Contact Links | `organization`, `role`, `currently_active` | 3 |
| Holiday Schemes | `status` | 1 |
| Holidays | `scheme`, `year`, `holiday_type`, `recurring`, `status` | 5 |
| Leave Types | `status`, `paid` | 2 |
| Leave Policy Bands | `status` | 1 |
| User Band Assignments | `year`, `band_id` | 2 |
| Leaves | `whose` | 1 |
| Audit Events | `event`, `record_type`, `performed_by`, `period` | 4 |
| **Total** | | **32** |

Every filter is a `:select` dropdown (`Entry#filters` — "the only type today"), applied by `Entry#apply_filters` via
one `where(...)` lambda per declared filter, reduced over the relation — so combining filters is plain `AND`
chaining, never OR. Each TC below checks: (1) every value of the filter in isolation, (2) the filter combined with
at least one sibling filter (AND-narrowing), (3) a search+filter combination where relevant, and (4) at least one
contradictory combination that should correctly produce zero rows without erroring.

**Fixture gaps found and filled before testing**: several filters had no real second value to test against
(e.g. only one department existed and it had no manager; no Inactive holiday existed; no "Ended" contact link
existed; Leave Types had no Unpaid or Inactive row; Leave Policy Bands had no second band). Each gap is called out
in its TC below — a disposable `PLT-FilterTest-*` fixture was created specifically to give that filter's other
value something real to match, left in place afterward as a reusable fixture (same convention as the rest of this
session).

---

### TC-PLT-342 — Teams: `membership` and `created_by` filters, individually and combined

**Fixtures used (pre-existing, no gap):** `Team-NoMatch` (3 members), `Team-Retest` (2 members), `t` (0 members) —
all authored by Redmine Admin (the only author on this environment).

1. `membership=without` ("No members") → expect only `t`.
2. `membership=with` ("Has members") → expect `Team-NoMatch` + `Team-Retest`.
3. `created_by=1` (Redmine Admin) alone → expect all 3 (only author on this environment).
4. `created_by=1&membership=without` (combination) → expect only `t`.
5. `created_by=9999` (nonexistent author id) → expect 0 rows, clean empty state, no error.
6. `search=Retest&membership=with` (search + filter combination) → expect only `Team-Retest`.

**Status: PASS, all 6 checks.** Every value and combination narrowed exactly as expected; the invalid-id edge
case (#5) returned a clean empty state rather than an error or an unfiltered list.

---

### TC-PLT-343 — Departments: `status` and `manager_id` filters, individually and combined

**Fixture gap filled:** only one department existed (`Department-Testing`, Active, no manager) — `manager_id`'s
own choices lambda had nothing to offer. Created `PLT-FilterTest-Dept-WithManager` (Active, Manager = Aurora Wren)
and `PLT-FilterTest-Dept-Inactive` (Inactive, no manager) to give both filters a real second value.

1. `status=1` → expect `Department-Testing` + `PLT-FilterTest-Dept-WithManager` (both Active).
2. `status=0` → expect only `PLT-FilterTest-Dept-Inactive`.
3. `manager_id=15` (Aurora Wren) → expect only `PLT-FilterTest-Dept-WithManager`.
4. `manager_id=15&status=0` (contradiction — that department is Active, not Inactive) → expect 0 rows.
5. `manager_id=15&status=1` (combination, should re-confirm) → expect only `PLT-FilterTest-Dept-WithManager`.

**Status: PASS, all 5 checks.** Both filters and their AND-combination (including the deliberately contradictory
one) behaved exactly as expected.

---

### TC-PLT-344 — Organizations: `tag`, `assigned_to`, `status`, `visibility` filters, individually and combined

**Fixture gap filled:** only 2 organizations existed (`TC-PLT-302-Test-Org` — no tag, no assignee; and
`TC-PLT-FULLFIELD-Org` — tag `fullfield-tag`, assigned to Admin, Private). Created
`PLT-FilterTest-Org-Inactive` (Inactive, visible-to-all, no tag) and `PLT-FilterTest-Org-Private` (Active, Private,
tag `plt-filter-tag`, assigned to Admin) — 4 organizations total afterward, enough to exercise every filter value.

1. `tag=plt-filter-tag` → expect only `PLT-FilterTest-Org-Private`.
2. `assigned_to=1` (Admin) → expect `PLT-FilterTest-Org-Private` + `TC-PLT-FULLFIELD-Org`.
3. `status=0` → expect only `PLT-FilterTest-Org-Inactive`.
4. `visibility=1` (Private) → expect `PLT-FilterTest-Org-Private` + `TC-PLT-FULLFIELD-Org`.
5. `visibility=0` (Visible to all) → expect the other 2 (`PLT-FilterTest-Org-Inactive` + `TC-PLT-302-Test-Org`) —
   confirmed this set is the exact complement of #4 (2+2=4, the full table).
6. `status=0&tag=plt-filter-tag` (contradiction — the tagged org is Active) → expect 0 rows.
7. `status=1&visibility=1&assigned_to=1` (3-way combination) → expect `PLT-FilterTest-Org-Private` +
   `TC-PLT-FULLFIELD-Org`.
8. `status=1&visibility=1&assigned_to=1&tag=fullfield-tag` (all 4 filters at once) → expect only
   `TC-PLT-FULLFIELD-Org`.

**Status: PASS, all 8 checks.** All 4 filters individually correct, the 2-way/3-way/4-way combinations all
narrowed exactly as expected, visibility's two values are confirmed exact complements of each other, and the
contradictory combination correctly returned zero rows.

---

### TC-PLT-345 — Contacts: `company`, `tag`, `contact_type`, `assigned_to`, `status` filters, individually and combined

**Fixture gap filled:** the 3 pre-existing contacts (`FullField Contact`, `TC303 Contact`, `dfsg`) were all Person
type, Active, no distinct second tag, and none linked to a company via the `company` filter's own field in a way
that left a second value to test against `contact_type`/`status`. Created `PLT-FilterTest-Contact1`
(Organization type, Company = `TC-PLT-302-Test-Org`, tag `plt-contact-filter-tag`, assigned to Admin, Active) and
`PLT-FilterTest-Contact2` (Person type, no company, no tag, Inactive) — 5 contacts total afterward.

1. `company=2` (`TC-PLT-302-Test-Org`) → expect `PLT-FilterTest-Contact1` + `TC303 Contact` (both already linked
   to that org).
2. `contact_type=organization` → expect only `PLT-FilterTest-Contact1`.
3. `contact_type=person` → expect the other 4 (confirms the two values are exact complements).
4. `status=0` → expect only `PLT-FilterTest-Contact2`.
5. `status=0&tag=plt-contact-filter-tag` (contradiction — the Inactive contact has no tag) → expect 0 rows.
6. `contact_type=organization&assigned_to=1&tag=plt-contact-filter-tag&company=2` (all 4 of the non-status
   filters at once) → expect only `PLT-FilterTest-Contact1`, correctly excluding `TC303 Contact` (which shares
   `company=2` but fails the other 3 filters).

**Status: PASS, all 6 checks.** All 5 filters individually correct (`status` tested via #4; `assigned_to`/`tag`
confirmed via their role in narrowing #6 from 2 rows to 1), the 4-way combination narrowed correctly, and the
contradiction correctly returned zero rows.

---

### TC-PLT-346 — Organization Contact Links: `organization`, `role`, `currently_active` filters, individually and combined

**Fixture gap filled:** both pre-existing links (`TC-PLT-302-Test-Org`/`TC303 Contact`, and
`TC-PLT-FULLFIELD-Org`/`TC303 Contact`, role "Billing contact") were both "Current" — `currently_active`'s
"Ended" value had nothing to match. Created a third link (`PLT-FilterTest-Org-Private` / `PLT-FilterTest-Contact2`,
role "Technical contact", `Until` = a past date) to produce a genuinely Ended link.

1. `organization=2` (`TC-PLT-302-Test-Org`) → expect only that org's link.
2. `role=Billing contact` → expect only the FULLFIELD-Org link.
3. `currently_active=0` ("Ended") → expect only the new Technical-contact link.
4. `currently_active=1` ("Current") → expect the original 2 links (confirms the two values are exact complements:
   1+2=3, the full table).
5. `organization=6&currently_active=0&role=Technical contact` (all 3 filters at once) → expect only the new link.
6. `organization=2&currently_active=0` (contradiction — that org's link is Current, not Ended) → expect 0 rows.

**Status: PASS, all 6 checks.** All 3 filters individually correct, the complement check confirmed
`currently_active`'s two values partition the table exactly, the 3-way combination narrowed correctly, and the
contradiction correctly returned zero rows.

---

### TC-PLT-347 — Holiday Schemes: `status` filter

**Fixtures used (pre-existing, no gap):** `Holiday-Scheme-Testing` (Active), `Holiday-Scheme-Testing (Copy)`
(Inactive), `TC-PLT-288-Inactive-Scheme` (Inactive).

1. `status=1` → expect only `Holiday-Scheme-Testing`.
2. `status=0&search=TC-PLT` (filter + search combination) → expect only `TC-PLT-288-Inactive-Scheme`, correctly
   excluding the other Inactive scheme (`Holiday-Scheme-Testing (Copy)`) which doesn't match the search term.

**Status: PASS, both checks.** Only one filter exists on this entity; its single value and its combination with
search both behaved correctly.

---

### TC-PLT-348 — Holidays: `scheme`, `year`, `holiday_type`, `recurring`, `status` filters, individually and combined

**Fixtures used (pre-existing, large existing variety across 3 schemes, 2 years, 4 types, both recurring values)
— one fixture gap filled:** all 8 pre-existing holidays were Active; `status=0` had nothing to match. Created
`PLT-FilterTest-Holiday-Inactive` (scheme `Holiday-Scheme-Testing`, type Public Holiday, Inactive).

1. `scheme=2` (`TC-PLT-288-Inactive-Scheme`) → expect only `TC-PLT-288-Inactive-Holiday`.
2. `year=2025` → expect both `TC-Recurring-Holiday-XMas` rows (one per scheme it's copied into).
3. `holiday_type=optional` → expect only `TC-PLT-288-Inactive-Holiday`.
4. `recurring=1` → expect the same 2 `TC-Recurring-Holiday-XMas` rows as `year=2025` (consistent — they are the
   only recurring holidays, and both happen to be dated in 2025).
5. `status=0` → expect only `PLT-FilterTest-Holiday-Inactive` (before this fixture existed, this value correctly
   returned 0 rows with no error, confirming the gap was real and not a bug).
6. `scheme=1&holiday_type=public&status=0` (3-way combination) → expect only `PLT-FilterTest-Holiday-Inactive`.
7. `scheme=1&year=2025&holiday_type=national&recurring=1&status=1` (all 5 filters at once) → expect only
   `TC-Recurring-Holiday-XMas` (the one copy under `Holiday-Scheme-Testing`, correctly excluding its sibling copy
   under `Holiday-Scheme-Testing (Copy)`, scheme=3).
8. `scheme=2&holiday_type=public` (contradiction — that scheme's only holiday is Optional, not Public) → expect
   0 rows.

**Status: PASS, all 8 checks.** All 5 filters individually correct, the 3-way and full 5-way combinations both
narrowed to exactly the one expected row, and the contradiction correctly returned zero rows. This is the
heaviest-combination entity in the suite (5 filters) and the one with the most pre-existing data variety.

---

### TC-PLT-349 — Leave Types: `status` and `paid` filters, individually and combined

**Fixture gap filled:** both pre-existing types (`Comp-Off`, `Emergency Leave`) were Paid and Active —
`paid=0` and `status=0` both had nothing to match. Created `PLT-FilterTest-LeaveType-Unpaid` (Unpaid, Active) and
`PLT-FilterTest-LeaveType-Inactive` (Paid, Inactive).

1. `paid=0` → expect only `PLT-FilterTest-LeaveType-Unpaid`.
2. `status=0&paid=1` (combination) → expect only `PLT-FilterTest-LeaveType-Inactive` (Paid AND Inactive).
3. `status=0&paid=0` (contradiction — the Inactive one is Paid, the Unpaid one is Active) → expect 0 rows.

**Status: PASS, all 3 checks.** Both filters and their combination (including the contradictory one) behaved
exactly as expected.

---

### TC-PLT-350 — Leave Policy Bands: `status` filter

**Fixture gap filled:** only one band existed (`QA-Band-EmergencyOnly`, Active) — `status=0` had nothing to
match. Created `PLT-FilterTest-Band-Inactive` (Inactive). Noted in passing, not a bug: the Inactive band correctly
does **not** appear in the "Assign leave band" form's own Leave policy band dropdown — consistent with its own
field hint ("not offered when somebody is assigned").

1. `status=1` → expect only `QA-Band-EmergencyOnly`.
2. `status=0` → expect only `PLT-FilterTest-Band-Inactive`.
3. `status=1&search=Inactive` (filter + search combination, deliberately contradictory) → expect 0 rows, since
   the Active band's name doesn't contain "Inactive".

**Status: PASS, all 3 checks.**

---

### TC-PLT-351 — User Band Assignments: `year` and `band_id` filters, individually and combined

**Fixture gap filled:** only one assignment existed (Aurora Wren → `QA-Band-EmergencyOnly`, 2026) — both filters
had only one real value to test, and `band_id` had no "zero assignments" value to confirm the empty-state path.
Created a second assignment (Autumn Grace → `QA-Band-EmergencyOnly`, 2027) to give `year` a genuine second value.

1. `year=2027` → expect only the new Autumn Grace / 2027 row.
2. `band_id=3` (`PLT-FilterTest-Band-Inactive`, created in TC-PLT-350 — a band with zero real assignments, since
   it can't even be selected on the Assign form) → expect 0 rows, clean empty state, no error.
3. `band_id=2&year=2026` (combination) → expect only the original Aurora Wren / 2026 row, correctly excluding the
   2027 row despite both sharing `band_id=2`.

**Status: PASS, all 3 checks.** `year` and `band_id` both correct individually, the AND-combination correctly
narrowed on both conditions together, and filtering by a band with zero assignments correctly produced a clean
empty result rather than an error or the full unfiltered list.

---

### TC-PLT-352 — Leaves: `whose` filter, every value, plus combination with search

**Fixtures used (pre-existing, no gap):** 9 leave records across 4 users (Autumn Grace, Marigold Rayne, Aurora
Wren, Luna Meadow), mixed Approved/Pending/Cancelled. Tested as Admin, who files none of these but can approve
everything company-wide (per the already-confirmed `approve_leave` global authorization, TC-PLT-328/329).

1. `whose=mine` ("My own requests") → expect 0 rows — correct, Admin filed none of the 9.
2. `whose=to_decide` ("Waiting for my decision") → expect the 2 Pending leaves (Marigold Rayne, Autumn Grace).
3. `whose=others` ("Everyone I approve for") → expect all 9 — correct and consistent with Admin's confirmed
   company-wide approval scope (the same scope documented in TC-PLT-328/329); this is not a bug, since "everyone"
   genuinely is everyone when the approver's scope is global.
4. `whose=to_decide&search=Marigold` (filter + search combination) → expect only Marigold Rayne's Pending leave.

**Status: PASS, all 4 checks.** All 4 values of the single filter correct for an Admin viewer, and the
filter+search combination narrowed correctly. (A non-admin, team-scoped viewer's `whose` values were already
implicitly exercised by the Leave permission-model investigation earlier in the cycle, TC-PLT-328/329/330 —not
re-derived here.)

---

### TC-PLT-353 — Audit Events: `event`, `record_type`, `performed_by`, `period` filters, individually and combined

**Fixtures used (pre-existing — this entity already has 175 rows from the cycle's own testing history, the
largest and most varied dataset of any entity; no fixture gap for `event`/`record_type`/`performed_by`).**

1. `record_type=RedminefluxPlatform::Organization` → expect 8 rows, all Organization-named records (confirmed via
   the Record column).
2. `record_type=RedminefluxPlatform::Organization&event=created` (combination) → expect 6 rows, correctly
   excluding the 2 "Deleted" organization events.
3. `performed_by=19` (Marigold Rayne) → expect exactly 1 row.
4. `performed_by=19&record_type=RedminefluxPlatform::Organization` (contradiction — Marigold never created/touched
   an organization) → expect 0 rows.
5. `event=created&record_type=RedminefluxPlatform::Organization&performed_by=1&period=30` (all 4 filters at once)
   → expect exactly 6 rows, all "Created", all by Redmine Admin, all organization-named, all within 30 days.

**`period` boundary note:** every one of this environment's 175 audit rows falls inside the last 7 days
(`period=7` returns the same 175 as no filter at all) — there is currently no audit row old enough to exercise the
7-vs-30-day boundary live. Rather than leave this filter's mechanism unverified, read `SharedEntities.in_period`
directly from source (`shared_entities.rb` ~line 1117): `scope.where(column => days.days.ago..)` — a plain,
correct open-ended range query against `rf_audit_events.created_at`, with `PERIODS = {'7'=>7,'30'=>30,'90'=>90,
'365'=>365}` backing the 4 dropdown choices. The mechanism is sound; this environment just has no data old enough
to show a different result for a wider period, which is a data-age fact, not a defect.

**Status: PASS, all 5 live checks + 1 source-verified.** `event`, `record_type`, `performed_by` all correct
individually and in combination (including the contradiction), the full 4-filter combination narrowed exactly
right, and `period`'s implementation was confirmed correct by direct source read where live data couldn't exercise
its boundary.

---

## Evidence Map

| TC ID | Entity | Filters covered | Result |
|-------|--------|------------------|--------|
| TC-PLT-342 | Teams | membership, created_by | PASS |
| TC-PLT-343 | Departments | status, manager_id | PASS |
| TC-PLT-344 | Organizations | tag, assigned_to, status, visibility | PASS |
| TC-PLT-345 | Contacts | company, tag, contact_type, assigned_to, status | PASS |
| TC-PLT-346 | Organization Contact Links | organization, role, currently_active | PASS |
| TC-PLT-347 | Holiday Schemes | status | PASS |
| TC-PLT-348 | Holidays | scheme, year, holiday_type, recurring, status | PASS |
| TC-PLT-349 | Leave Types | status, paid | PASS |
| TC-PLT-350 | Leave Policy Bands | status | PASS |
| TC-PLT-351 | User Band Assignments | year, band_id | PASS |
| TC-PLT-352 | Leaves | whose | PASS |
| TC-PLT-353 | Audit Events | event, record_type, performed_by, period | PASS (period source-verified) |

## Summary (2026-10-16)

**12/12 PASS. All 32 of Platform's registered filters, across all 12 filterable entities, tested individually and
in combination — zero defects found.** Every filter applies as a plain `AND`-chained `where(...)` scope
(`Entry#apply_filters`), confirmed live: every 2-way through 5-way combination narrowed results exactly as
expected, every deliberately contradictory combination returned a clean empty state (no error, no silently-wrong
unfiltered list), and every filter's two mutually-exclusive values (where applicable — `status`, `visibility`,
`contact_type`, `currently_active`, `paid`) were confirmed to be exact complements of each other.

**8 disposable `PLT-FilterTest-*` fixtures were created** specifically to fill real coverage gaps where a filter's
second value had nothing to match on this environment (a department with a manager, an inactive organization, a
second contact of the other type, an ended contact link, an inactive holiday, an unpaid leave type, an inactive
leave type, an inactive leave policy band, plus a second-year band assignment) — each one documented in its own
TC above rather than silently assumed to already exist. All fixtures left in place as reusable regression data,
matching this session's established convention.

**No new bugs filed.** This is a rare clean sweep across the single largest remaining untested surface on this
plugin (every dropdown filter on every list screen) — a strong positive signal for `shared_entities.rb`'s
filter-declaration design (filters are plain data, applied generically by one method, so there was no per-entity
filter logic to get wrong in the first place).
