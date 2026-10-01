# Bug Report Template

- Bug ID: BUG-PLT-025
- Production Redmine Issue ID: #121858
- Title: Platform's own "Visibility" filter shows "Private"/"Public" instead of its own documented "Private"/"Visible to all" vocabulary standard — the correct locale key exists but is never used
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Open Platform's own Organizations list: `/redmineflux_platform/list/organizations`.
2. Look at the "Visibility" filter dropdown.

## Expected result

- Per Platform's own `config/locales/en.yml` (lines 205-210), the shared status vocabulary is explicitly documented as a deliberate pairing:
  ```
  active      is this record still in use?      -> Active / Inactive
  is_private  who is allowed to see it?         -> Private / Visible to all
  ```
  A dedicated key exists for exactly this: `label_rf_platform_visible_to_all: "Visible to all"`. The filter should read "Private" / "Visible to all".

## Actual result

- The filter instead shows **"Private" / "Public"**, sourced from a completely different, separately-defined key: `label_rf_platform_public: "Public"` (`lib/redmineflux_platform/shared_entities.rb:1021`, `choices: -> { SharedEntities.boolean_choices(:label_rf_platform_private, :label_rf_platform_public) }`).
- `label_rf_platform_visible_to_all` — the key the plugin's own locale file documents as the correct term for this exact concept — is **never referenced anywhere in app code** (confirmed via repo-wide grep), i.e. it's dead/orphaned.
- This is not a cross-plugin inconsistency — it's Platform contradicting its own documented standard, in its own codebase, on its own screen.

### Root cause (confirmed from source)

`config/locales/en.yml`:
```yaml
# ── shared status vocabulary ──
# active and is_private are two DIFFERENT columns answering two different
# questions, and both exist on the shared tables:
#
#   active      is this record still in use?      -> Active / Inactive
#   is_private  who is allowed to see it?         -> Private / Visible to all
#
label_rf_platform_active: "Active"
label_rf_platform_inactive: "Inactive"
...
label_rf_platform_private: "Private"
label_rf_platform_visible_to_all: "Visible to all"   # <-- documented standard, never used
...
label_rf_platform_public: "Public"                   # <-- actually used instead, ~140 lines later
```

`lib/redmineflux_platform/shared_entities.rb:1020-1022` (Organizations' filter definition — the same pattern likely repeats for Contacts and any other `is_private`-backed entity's filter list):
```ruby
{ name: :visibility, label: :label_rf_platform_filter_visibility, type: :select,
  choices: -> { SharedEntities.boolean_choices(:label_rf_platform_private, :label_rf_platform_public) },
  apply: ->(rel, value) { rel.where(rf_organizations: { is_private: SharedEntities.boolean_value(value) }) } }
```

Looks like `label_rf_platform_public` was added later (it sits ~140 lines further down the locale file, away from the rest of the "shared status vocabulary" block) without whoever wrote it realizing `label_rf_platform_visible_to_all` already existed for the same purpose right next to `label_rf_platform_private`.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-025/visibility-filter-says-public-not-visible-to-all.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-025/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS error — server-rendered `<option>` text sourced from the wrong locale key.

## Duplicate check

- Duplicate found: No — distinct from BUG-PLT-024 (CRM's leftover "Company" wording); this is Platform's own internal vocabulary self-contradiction, found while executing TC-PLT-081.

## Production report

Reported to production `ztflux` as **#121858** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121477 ("Vocabulary & Labels", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: Low (priority_id 1); Defect custom fields: Type=Usability, Severity=Low-severity, Priority=Low.
