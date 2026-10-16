# Bug Report Template

- Bug ID: BUG-PLT-055
- Production Redmine Issue ID:
- Title: "Create, edit and delete X" (manage) permission is completely non-functional on its own for 7 entities — granting it without also granting "View X" produces a full 403 lockout, not reduced-but-working access
- Redmine version: 6
- Plugin name: redmineflux_platform
- Plugin version: current (2026-10-16)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: Chromium (Playwright MCP) + direct `rails runner` service-level verification
- User role: Dedicated test role (`PLT-OverviewIncremental`, id 18) holding exactly one `manage_rf_platform_<key>` permission at a time, no corresponding `view_rf_platform_<key>`
- Date: 2026-10-16

## Steps to reproduce

1. Create a role holding **only** `manage_rf_platform_departments` ("Create, edit and delete departments") —
   explicitly **not** `view_rf_platform_departments`.
2. Assign it to a test user with no other `rf_platform` permission.
3. Log in as that user, navigate to `/redmineflux_platform` (Overview) and to
   `/redmineflux_platform/list/departments` (the dedicated Departments screen) directly.
4. Repeat for `manage_rf_platform_organizations`, `manage_rf_platform_contacts`,
   `manage_rf_platform_organization_contact_links`, `manage_rf_platform_leave_types`,
   `manage_rf_platform_leave_policy_bands`, `manage_rf_platform_user_band_assignments` — one at a time, same
   pattern.

## Expected result

- Per the Permissions report's own presentation, "View X" and "Create, edit and delete X" are two independently
  listed, separately-togglable checkboxes for every entity. The ordinary, real-world expectation of a "manage"
  permission (and the behavior Redmine's own core permissions generally follow) is that granting manage should
  be sufficient on its own — an administrator who wants a role to be able to create/edit/delete departments but
  never checked "View departments" separately would reasonably expect that to still work, not to produce a
  complete, unexplained 403 lockout.

## Actual result

For **7 of the plugin's 11 own-permission-pair entities**, holding only the `manage_rf_platform_<key>`
permission produces a full 403 — not just on the Overview widget, but on the entity's own dedicated list/manage
screen too (confirmed directly for Departments and Organizations; confirmed via direct service call for the
other 5):

| Entity | `manage_rf_platform_<key>` alone | Root cause |
|---|---|---|
| Departments | 403 everywhere (`visible_to?`/`manage?` both `false`) | No permission door registered |
| Organizations | 403 everywhere | No permission door registered |
| Contacts | 403 everywhere (confirmed via service call) | No permission door registered |
| Contact links | 403 everywhere (confirmed via service call) | No permission door registered |
| Leave Types | 403 everywhere (confirmed via service call) | No permission door registered |
| Leave policy bands | 403 everywhere (confirmed via service call) | No permission door registered |
| Leave band assignments | 403 everywhere (confirmed via service call) | No permission door registered |

**Root cause, confirmed from source** (`lib/redmineflux_platform/shared_entities.rb`, `Entry#manage?`):
```ruby
def manage?(user = User.current)
  return false if admin_only?
  return false unless visible_to?(user)   # <-- manage requires visible_to? to already be true
  return true if user.respond_to?(:admin?) && user.admin?
  return true if @open_to_all == true
  return false unless user.respond_to?(:allowed_to?)

  ([manage_permission] + SharedEntities.door_permissions(key, :manage))
    .any? { |permission| user.allowed_to?(permission, nil, global: true) } ||
    SharedEntities.door_holder?(key, user)
end
```
`manage?` unconditionally requires `visible_to?(user)` to already be true *before* it even checks whether the
user holds the manage permission itself. `visible_to?` in turn only becomes true via `view_permission`
(`view_rf_platform_<key>`), a registered "door" (`door_permissions`), or `open_to_all`. **Holding the manage
permission is never, by itself, one of the ways `visible_to?` can become true** — so for any entity with no door
registered and no `open_to_all` flag, a role with manage and nothing else is locked out completely.

**Confirmed NOT affecting every entity** — three groups are correctly exempt, for two different reasons:
- **Teams** is the one entity with a registered `holder:` door (`init.rb`:
  `register_permission_door('teams', :rf_team_membership, holder: ->(user) { TeamService.can_manage?(user) })`)
  — this makes `manage_rf_platform_teams` alone correctly sufficient, confirmed live.
- **Holiday Schemes, Holidays, Leaves** are exempt for an unrelated reason: their `open_to_all` flag (`:view` for
  the first two, `true` for Leave) already makes `visible_to?` unconditionally `true` for any logged-in user
  regardless of any permission — so `manage?`'s `visible_to?` precondition is already satisfied before the
  manage-permission check is ever reached, and manage-alone works by coincidence of a *different*, already-filed
  issue (`BUG-PLT-052`/`BUG-PLT-054`), not because this bug's pattern was avoided by design.

**This is not a security hole** — it fails in the safe direction (denies access that was presumably intended)
rather than the unsafe one. But it is a real, easy-to-hit administrative trap: checking only "Create, edit and
delete departments" on a role — a completely reasonable, common way to configure a role — silently produces a
user who can do nothing at all with Departments, with no error message anywhere explaining that "View
departments" must also be checked. The Permissions report gives no indication that these two checkboxes are not
independently meaningful for 7 of the 11 entity pairs.

## Evidence

### Console / log

```
Departments (manage_rf_platform_departments ONLY): 403 on both /redmineflux_platform and /redmineflux_platform/list/departments
Organizations (manage_rf_platform_organizations ONLY): 403 on both /redmineflux_platform and /redmineflux_platform/list/organizations
Contacts (manage_rf_platform_contacts ONLY): visible_to?=false manage?=false
Contact links (manage_rf_platform_organization_contact_links ONLY): visible_to?=false manage?=false
Leave Types (manage_rf_platform_leave_types ONLY): visible_to?=false manage?=false
Leave policy bands (manage_rf_platform_leave_policy_bands ONLY): visible_to?=false manage?=false
Leave band assignments (manage_rf_platform_user_band_assignments ONLY): visible_to?=false manage?=false

-- Contrast, confirmed correctly exempt --
Teams (manage_rf_platform_teams ONLY): visible_to?=true manage?=true (via TeamService.can_manage? holder door)
Holiday Schemes (manage_rf_platform_holiday_schemes ONLY): visible_to?=true manage?=true (open_to_all bypass)
Holidays (manage_rf_platform_holidays ONLY): visible_to?=true manage?=true (open_to_all bypass)
Leaves (view_rf_platform_leaves ONLY): visible_to?=true manage?=true (open_to_all bypass, BUG-PLT-054's own territory)
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): Related in root-cause *class* to `BUG-PLT-052`/`BUG-PLT-054` (all three
  are about the exact permission a role holds not producing the access the Permissions report implies it should)
  but a distinct mechanism and distinct direction — those two are about a permission having **no effect**
  (over-granting access); this one is about a permission having **the opposite of its intended effect when
  granted alone** (a manage grant that looks complete but silently achieves nothing without a second,
  un-hinted-at checkbox). Filed separately per this repo's one-bug-per-distinct-defect convention.

## Production report

- Not yet reported — pending approval for which production Run/Testcase to link it to.
