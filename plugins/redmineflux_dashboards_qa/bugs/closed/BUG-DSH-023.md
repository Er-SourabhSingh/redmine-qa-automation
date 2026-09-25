# Bug Report Template

- Bug ID: BUG-DSH-023
- Production Redmine Issue ID: #121311
- Title: The chart-template "Group by" selector never offers a role-restricted custom field, even for a viewer whose own role is explicitly in the field's allowed-roles list — violates #120914's "only fields visible to the current user... should be listed" requirement
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator (Manager+Developer on test-project) and Daisy Skye (Reporter on test-project) — both
  roles are explicitly included in the restricted field's own allowed-roles list, yet neither can see it
- Date: 2026-09-25

## Steps to reproduce

1. Create a new Issue custom field, List format, single-select, `Used as a filter` enabled, `For all projects`
   enabled, all trackers enabled — identical in every respect to an already-working grouping-eligible field
   (`QA Single Select Field`, `cf_68`), **except** set Visibility to "to these roles only" and check roles that
   include both Administrator's own project roles (Manager, Developer) and a second viewer's role (Reporter).
2. As a user holding one of the checked roles (e.g. Administrator, who holds Manager+Developer; or a Reporter),
   open the project's Dashboard → Add Chart → Saved Queries tab → choose a chart template → look at the "Group by"
   selector.
3. Compare against a second, freshly-created custom field that is identical except Visibility is left at "to any
   users" (the default, unrestricted).

## Expected result

- Per production requirement #120914, part 2: "Only fields visible to the current user and applicable to the
  project should be listed." A role-restricted custom field whose allowed-roles list includes the current
  viewer's actual project role **is** visible to that user by Redmine's own definition, and should therefore
  appear in the Group by selector for that user (even if it correctly stays hidden for a user whose role is
  *not* in the list).

## Actual result

- **A role-restricted custom field never appears in the Group by selector, for any user, regardless of whether
  their role is in the field's own allowed-roles list.** Confirmed with a clean, controlled comparison:
  - Field `cf_89` ("QA Role-Hidden Grouping Field"): List, `is_filter=true`, `for_all=true`, all 5 trackers,
    Visibility = "to these roles only" with **Manager, Developer, Reporter, QA Read Only** checked.
  - Field `cf_91` ("QA New Grouping Test Field"): identical configuration in every other respect, Visibility =
    "to any users" (unrestricted).
  - As **Administrator** (holds Manager + Developer on test-project — both checked roles for `cf_89`): the Group
    by selector (`#savedQueryGroupBy`) listed `status, priority, tracker, assigned_to, fixed_version, author,
    cf_71, cf_91, cf_68` — **`cf_89` absent**, `cf_91` present.
  - As **Daisy Skye** (Reporter on test-project — also a checked role for `cf_89`): identical result —
    `cf_89` absent, `cf_91` present.
  - A negative control confirms the *project-applicability* half of the filter works correctly on its own: a
    third field (`cf_90`, unrestricted visibility but enabled only for a different project, not test-project) is
    also correctly absent for everyone — so this is specifically a **role-visibility handling defect**, not a
    general "new fields never appear" problem as originally suspected during `TC-DSH-165`.
  - No network request for custom-field data was observed when opening Add Chart (`page.on('request')` showed 0
    matching calls) — the option list is present in the dashboard page's own initial render, not fetched fresh,
    consistent with the exclusion happening once at page-render time rather than per-viewer at modal-open time
    (worth noting for triage, though not confirmed as the root cause without seeing the server code).
  - **Practical effect**: a role-restricted custom field can never be used as a chart-grouping dimension by
    *anyone*, including users the field's own configuration explicitly grants visibility to. Only fields with
    unrestricted ("to any users") visibility can ever be grouped by.

## Evidence

### Screenshot

![Admin's Group by selector, missing the role-restricted cf_89 field while the unrestricted cf_91 field (created identically otherwise) is present](../../screenshots/BUG-DSH-023/admin-groupby-selector-missing-role-restricted-field.png)

### Console / log

- `cf_89` config: `format=list, is_filter=true, for_all=true, multiple=false, visible=0 (roles), role_ids=[3,4,5,18]
  (Manager/Developer/Reporter/QA Read Only), tracker_ids=[1,2,3,4,5]`.
- `cf_91` config: identical except `visible=1` (to any users).
- As Admin, `#savedQueryGroupBy` options: `["status","priority","tracker","assigned_to","fixed_version","author",
  "cf_71","cf_91","cf_68"]` — no `cf_89`.
- As Daisy Skye (Reporter, role id 5 — one of `cf_89`'s own checked roles), identical options list — no `cf_89`.
- `cf_90` (unrestricted visibility, but `for_all=false`/only enabled for "QA Private Project", not test-project):
  correctly absent for both users — confirms the project-applicability filter itself is not broken, isolating the
  defect to role-visibility handling specifically.

## Production report

Reported to production `ztflux` as issue #121311, per explicit user approval, 2026-09-25. Priority=Medium(2),
Defect Type=Functional, Defect Severity=Medium-severity, Defect priority=Medium, category="Custom dashboard
plugin", assigned to Prashant Chaurasia. Linked via `report_defect` to Test Case #121093 ("Custom Dashboard:
Sanity check — chart templates and custom field grouping for saved queries (#120914)"), Run #577, Test Suite
#249, Environment "Window 11 + Chrome" — the same testcase all other #120914-scoped bugs this session were
linked to. Post-write verification: `#121093 [Failed] ... defects:[..., 121311]` — 14 previously-linked defects
(all now Done) plus this one, genuinely open.

## Retest — 2026-09-25

**FIXED.** Per explicit user request, restarted the `redmine-docker-700-redmine-1` container (clean boot
confirmed via `docker logs`, no errors) and retested the exact original repro on the now-current build. The
Group by selector now correctly includes `cf_89` ("QA Role-Hidden Grouping Field") — and, critically, does so
**with correct per-viewer role evaluation**, not just unconditional visibility:

| Viewer | Role held | `cf_89` (roles: Manager/Developer/Reporter/QA Read Only) appears? |
|---|---|---|
| Administrator | Manager + Developer (qualifying) | ✅ Yes |
| Daisy Skye | Reporter (qualifying) | ✅ Yes |
| Summer Rain | QA Own Visibility (**not** qualifying) | ❌ No — correctly excluded |

Summer Rain's exclusion is the decisive evidence: if the fix had simply made every field appear unconditionally,
she would see `cf_89` too. She doesn't, confirming the selector now genuinely evaluates the current viewer's
role against the field's allowed-roles list, exactly as #120914's requirement 2 describes. The negative control
(`cf_90`, project-inapplicable) remains correctly excluded for everyone — the project-applicability half, which
was never broken, still works. Confirmed FIXED, ready to close.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Supersedes the framing in
  `TC-DSH-165`'s original write-up (`testcases/DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md`), which concluded the
  selector was a "fixed set of exactly 2 hardcoded fields, not dynamically derived from config at all" — that
  conclusion is now known to be imprecise. Re-tested with a fresh, cleanly-configured unrestricted field
  (`cf_91`) and it **did** appear dynamically, proving the selector does pick up new qualifying fields correctly
  in the general case. The real, narrower defect is specifically in how role-restricted visibility is evaluated:
  it appears to exclude any field with a role restriction outright, rather than checking whether the *current
  viewer's* role passes it. `TC-DSH-165`'s verdict and this file's evidence should be read together.
