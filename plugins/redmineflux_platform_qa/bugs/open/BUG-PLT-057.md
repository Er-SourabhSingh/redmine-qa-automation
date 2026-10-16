# Bug Report Template

- Bug ID: BUG-PLT-057
- Production Redmine Issue ID: <!-- filled after MCP report_defect/create_issue is approved and executed -->
- Title: Platform permission labels need two fixes — (1) Organization Contact Links' pair is a raw, unhumanized permission symbol instead of a proper label, and (2) 9 other entities' "Create, edit and delete X" wording should be shortened to "Manage X" to match Redmine core's own naming convention and this same plugin's other "Manage X"-style labels
- Redmine version: 6
- Plugin name: redmineflux_platform
- Plugin version: current (2026-10-16)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin (Administration → Roles and permissions → a project role's Permissions report)
- Date: 2026-10-16

## Steps to reproduce

1. Open Administration → Roles and permissions → edit any role → its full Permissions report (or Project →
   Settings → Members → a role's permission checklist on the Permissions report page).
2. Find the "Project" permission group and read every Platform permission's label in it — Teams, Departments,
   Organizations, Contacts, Organization Contact Links, Holiday Schemes, Holidays, Leave Types, Leave Policy
   Bands, Leave Band Assignments, Leave Requests.
3. Compare Organization Contact Links' two checkboxes' label text against its 10 sibling entities.
4. Separately, compare the wording *pattern* every "manage" permission uses against Redmine core's own
   convention for the exact same kind of permission elsewhere on the same page (e.g. "Manage members", "Manage
   versions", "Manage queries", "Manage files", "Manage news", "Manage repository", "Manage wiki", "Manage
   forums" — every one of these is "Manage <noun>", never "Create, edit and delete <noun>").

## Expected result

**Part 1 — Organization Contact Links' missing labels.** Per this plugin's own established pattern — every other
entity's pair of permissions reads as a natural, humanized sentence — Organization Contact Links'
`view_rf_platform_organization_contact_links` / `manage_rf_platform_organization_contact_links` permissions
should read the same way, not as a raw permission symbol.

**Part 2 — Consistent "Manage X" wording (raised by the user as a direct follow-up to Part 1, 2026-10-16).**
Redmine core's own convention for every "may create/edit/delete this kind of record" permission on the exact
same Permissions report page is the short form "Manage <noun>" (Manage members, Manage versions, Manage queries,
Manage files, Manage news, Manage repository, Manage wiki, Manage forums — all core, all on this same screen).
9 of this plugin's own 11 entity pairs instead use the longer "Create, edit and delete <noun>" phrasing, which
is the one place on this page that doesn't match the surrounding convention. Proposed wording (9 entities get the
short form; 2 are deliberately left as-is because their current wording conveys something a generic "Manage"
would lose):

| Entity | Current | Proposed |
|---|---|---|
| Teams | "Create, edit and delete teams" | **"Manage teams"** |
| Departments | "Create, edit and delete departments" | **"Manage departments"** |
| Holiday Schemes | "Create, edit and delete holiday schemes" | **"Manage holiday schemes"** |
| Holidays | "Create, edit and delete holidays" | **"Manage holidays"** |
| Leave Types | "Create, edit and delete leave types" | **"Manage leave types"** |
| Organizations | "Create, edit and delete organizations" | **"Manage organizations"** |
| Contacts | "Create, edit and delete contacts" | **"Manage contacts"** |
| Leave Policy Bands | "Create, edit and delete leave policy bands" | **"Manage leave policy bands"** |
| Organization Contact Links (Part 1, currently missing) | *(raw symbol — see Part 1)* | **"Manage contact links"** (view: **"View contact links"**) |

**Deliberately NOT renamed to a generic "Manage X"** — their current wording is more specific than "Manage"
would be, and renaming would lose that precision:
- **Leave Band Assignments** — keep `permission_manage_rf_platform_user_band_assignments: "Assign people to a
  leave band"`. This already reads as a short, specific action, not a vague CRUD description; "Manage leave band
  assignments" would be a net loss of clarity for no consistency gain (nothing else on the page is phrased this
  way to begin with).
- **Leave Requests** — keep `permission_manage_rf_platform_leaves: "File and decide leave requests"`. This
  permission deliberately covers two distinct capabilities in one grant (filing your own leave, and
  deciding/approving one you're allowed to act on) — collapsing it to "Manage leave requests" would hide that a
  role with this permission can approve requests, not just submit them, which is exactly the ambiguity this
  wording was written to avoid.

## Actual result

**Part 1:**

- The two checkboxes literally read **"View rf platform organization contact links"** and **"Manage rf platform
  organization contact links"** — the raw, underscore-split permission symbol (`rf_platform_organization_
  contact_links`) humanized by Rails' own default fallback, not a deliberately-written label. Every other
  permission pair in the same "Project" group, for every other Platform entity, has a proper, natural-language
  label instead.
- Root cause, confirmed from source: `config/locales/en.yml` defines a `permission_view_rf_platform_<key>` /
  `permission_manage_rf_platform_<key>` pair for every other entity (`teams`, `departments`, `organizations`,
  `contacts`, `holiday_schemes`, `holidays`, `leave_types`, `leave_policy_bands`, `user_band_assignments`,
  `leaves`) — 10 entities, 20 keys, all present. `organization_contact_links` is the one entity with **no**
  `permission_view_rf_platform_organization_contact_links` or
  `permission_manage_rf_platform_organization_contact_links` key defined anywhere in the locale file at all —
  confirmed via a direct grep finding zero matches, while every other entity's pair is present and correctly
  worded. Without a locale key, Redmine's own `l_or_humanize` fallback (used for any permission with no matching
  translation) just title-cases and un-underscores the raw permission symbol, producing the ugly result seen live.
  This is purely a missing-locale-key oversight — the entity's own other labels (`label_rf_platform_purpose_
  organization_contact_links`, its hint text, etc.) are all present and well-written; only the two `permission_*`
  keys were never added.

**Part 2:** All 9 entities listed in the proposed table above currently use "Create, edit and delete <noun>" —
confirmed live on the Permissions report and in source (`config/locales/en.yml` lines 929–950). This is longer
and reads less naturally than the "Manage <noun>" pattern Redmine core itself uses for every equivalent
permission on the same page, and inconsistent within this plugin's own file, since `view_rf_platform` itself and
several hint/help strings elsewhere already favor the shorter phrasing style.

## Evidence

### Screenshot

- N/A — confirmed via the user's own pasted Permissions report text (every other Platform permission correctly
  humanized; these two literally not) and a direct `grep` of `config/locales/en.yml` showing the two keys
  completely absent, while all 10 sibling entities' equivalent pairs are present.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-057/retest-yyyy-mm-dd-pass.png)

### Console / log

```
$ grep -n "^  permission_.*organization_contact_links" config/locales/en.yml
(no output — zero matches)

$ grep -n "^  permission_view_rf_platform_teams\|^  permission_manage_rf_platform_teams" config/locales/en.yml
929:  permission_view_rf_platform: "View the RedmineFlux Platform section"
931:  permission_view_rf_platform_teams: "View teams"
932:  permission_manage_rf_platform_teams: "Create, edit and delete teams"
... (all 10 other entities present, organization_contact_links is the only gap)
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): Same general defect class as the plugin's other locale/label gaps this
  cycle (`BUG-PLT-025`, vocabulary consolidation), but a distinct instance — a missing key, not a wrong one.

## Production report

Not yet reported to production — pending user approval.
