# Bug Report Template

- Bug ID: BUG-PLT-008
- Production Redmine Issue ID: #121551
- Title: Platform Settings' "inherited" fields are not synced in either direction — Platform never picks up the source plugin's value, and editing Platform's own field never writes back to the source plugin
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, commit `5db0312`
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-29

## Steps to reproduce

**Read-only check:**
1. In Workload's own settings (`/rf_settings`), confirm "Working Hours Per Day" = `9` (real, independently-set value).
2. In Invoice's own settings (`/settings/plugin/redmineflux_invoice?tab=company_details`), confirm "Company Name" = `Testers Pvt. Ltd.` (real, independently-set value).
3. Navigate to Platform Settings (`/settings/plugin/redmineflux_platform`).
4. Look at the "Working hours per day" field under **General**, and the "Company name" field under **Company Identity**.

**Write/sync check (both directions tested live):**
5. Change Workload's "Working Hours Per Day" to a new distinct value (e.g. `7.5`) and Save. Reload Platform Settings — check whether Platform's field/DB picked up `7.5`.
6. Change Invoice's "Company Name" to a new distinct value (e.g. `SYNC-TEST-Invoice-Co`) and Apply. Reload Platform Settings — check whether Platform's field/DB picked up the new name.
7. Now go the other way: type a new value directly into Platform's own "Working hours per day" (e.g. `5`) and "Company name" (e.g. `SYNC-TEST-Platform-Co`) fields and Apply. Reload Workload's and Invoice's own settings — check whether either source plugin's stored value changed to match.

## Expected result

- Per the settings page's own hint text — "Used by every plugin that converts days to hours — workload capacity, timesheet expectations and availability reports. **Currently inherited from redmineflux_workload (9.0)**" and "**Currently inherited from redmineflux_invoice**" — these two fields should be pre-populated with the actual inherited values (`9.0` and `Testers Pvt. Ltd.` respectively) so an admin can see what's currently in effect and optionally override it.
- Given the plugin explicitly calls this "inherited," a genuine two-way (or at minimum one-way, Platform-reads-from-source) sync is implied: a change made in Workload/Invoice should be reflected in Platform (directly or on next load), and/or a value set in Platform (once it becomes the intended single source of truth per the ticket's own consolidation goal) should propagate back to the plugins that used to own that setting.

## Actual result

**Both fields render completely empty**, despite their own hint text asserting a specific inherited value:

- "Working hours per day" — hint says "Currently inherited from redmineflux_workload (**9.0**)" but the input itself is blank (`value=""`, no `placeholder` attribute either — genuinely empty, not a greyed placeholder pattern).
- "Company name" — hint says "Currently inherited from redmineflux_invoice" but the input is blank (`value=""`).
- Re-checked after a 2-second wait and a fresh page reload to rule out a delayed/async fill — still blank both times.
- Confirmed at the DB level this isn't a rendering-only issue — Platform's own stored setting is genuinely empty, it was never actually synced from the source plugin at any point (e.g. during migration):
  ```sql
  SELECT name, value FROM settings WHERE name LIKE '%redmineflux_platform%';
  -- plugin_redmineflux_platform:
  -- working_hours_per_day: ''
  -- company_name: ''
  -- company_tax_id: 33BBBBBB0000A1Z5   (this one IS populated — no "inherited" claim on this field, unaffected)
  ```
  Compared against the real source values, also confirmed at the DB level:
  ```sql
  SELECT name, value FROM settings WHERE name LIKE '%redmineflux_workload%' OR name LIKE '%redmineflux_invoice%';
  -- plugin_redmineflux_workload: working_hours_per_day: '9'
  -- plugin_redmineflux_invoice:  company_name: Testers Pvt. Ltd.
  ```

So the hint text's "(9.0)" is apparently computed live by reading Workload's setting just for display purposes, but that same value is never written into Platform's own settings storage — the field the admin actually edits/submits stays empty. The Company Name hint doesn't even display the real value in the text (unlike the Working Hours hint), making it worse — an admin has no way to see what "Testers Pvt. Ltd." even is from this page.

The other Company Identity fields (Address, City, State, Postal code, Country, Email, Phone) make no inheritance claim in their labels, so their being blank is not part of this bug — only the two fields explicitly marked "Currently inherited from..." are affected.

**Not yet assessed**: whether any downstream consumer (workload capacity, timesheet expectations, availability reports — per the hint text's own claim) is currently reading Platform's blank value instead of falling back to the correct plugin's real value. Both Workload's and Invoice's own settings still hold their correct independent values, so no downstream breakage was observed in this pass, but this wasn't exhaustively tested across every consumer listed in the hint text.

### C. Confirmed live: there is NO actual sync in either direction (not just a display/pre-fill issue)

Tested both directions explicitly, with distinct marker values so cross-contamination would be unmistakable:

**Workload → Platform:**
1. Changed Workload's "Working Hours Per Day" from `9` to `7.5` and saved. Confirmed in DB: `plugin_redmineflux_workload.working_hours_per_day: '7.5'`.
2. Reloaded Platform Settings. Platform's field did **not** update to `7.5` — it stayed at whatever Platform's own stored value already was (in this run, a stray `3` left over from an earlier session action, itself proof the field is just plain persisted state, not a live read of Workload). The "Currently inherited from redmineflux_workload (X)" hint text is **only shown while Platform's own value is blank** — the moment Platform's own field holds any value at all, the hint silently drops the "Currently inherited from redmineflux_workload" wording entirely and just echoes Platform's own (possibly stale) number instead, with no indication to the admin that the link to Workload's live value was lost.

**Invoice → Platform:**
3. Changed Invoice's "Company Name" from `Testers Pvt. Ltd.` to `SYNC-TEST-Invoice-Co` and applied. Confirmed in DB: `plugin_redmineflux_invoice.company_name: 'SYNC-TEST-Invoice-Co'`.
4. Reloaded Platform Settings. Platform's "Company name" field stayed blank, and the hint text still read "Currently inherited from redmineflux_invoice" with no value shown at all — worse than the Working Hours case, since this hint never displays the actual inherited value to begin with, so an admin has no way to see `SYNC-TEST-Invoice-Co` (or the original `Testers Pvt. Ltd.`) from this page.

**Platform → Workload / Invoice (the reverse direction):**
5. Set Platform's own "Working hours per day" to `5` and Applied. Confirmed in DB: `plugin_redmineflux_platform.working_hours_per_day: '5'`.
6. Set Platform's own "Company name" to `SYNC-TEST-Platform-Co` and Applied. Confirmed in DB: `plugin_redmineflux_platform.company_name: 'SYNC-TEST-Platform-Co'`.
7. Re-checked Workload's and Invoice's own settings — **both unchanged**: `plugin_redmineflux_workload.working_hours_per_day` stayed `'7.5'` (Workload's own edit from step 1, untouched by Platform's `5`), and `plugin_redmineflux_invoice.company_name` stayed `'SYNC-TEST-Invoice-Co'` (Invoice's own edit from step 3, untouched by Platform's `SYNC-TEST-Platform-Co'`).

**Conclusion**: after all four edits, all three plugins held four completely different, fully diverged values for what the UI describes as the same shared setting — `Workload=7.5`, `Invoice="SYNC-TEST-Invoice-Co"`, `Platform working_hours=5`, `Platform company_name="SYNC-TEST-Platform-Co"`. There is no synchronization at all, in either direction — each plugin's setting is fully independent storage. The "Currently inherited from..." hint text is at best a one-time, read-only display computed live only while Platform's own field is empty; it is not a real inheritance/sync mechanism, and it degrades inconsistently between the two fields once Platform's own value is set (Working Hours silently starts showing Platform's stale number with no source attribution; Company Name keeps claiming inheritance from Invoice while showing nothing at all).

**Test values restored to baseline after this test**: Workload `working_hours_per_day` back to `9`, Invoice `company_name` back to `Testers Pvt. Ltd.`, Platform's own `working_hours_per_day`/`company_name` back to blank — confirmed via DB re-query. No fixture data used by other test suites was left altered.

## Evidence

### Screenshot

![Platform Settings — inherited fields blank](../../screenshots/BUG-PLT-008/platform-settings-blank-inherited-fields.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-008/retest-yyyy-mm-dd-pass.png)

### Console / log

DOM inspection of the two affected inputs (no placeholder, genuinely empty):
```
settings[working_hours_per_day]: <input type="text" id="settings_working_hours_per_day" name="settings[working_hours_per_day]" size="8" value="">
settings[company_name]: <input type="text" id="settings_company_name" name="settings[company_name]" size="50" value="">
```
DB query confirming the stored setting itself (not just the rendered form) is blank:
```
name: plugin_redmineflux_platform
value: --- !ruby/hash:ActiveSupport::HashWithIndifferentAccess
working_hours_per_day: ''
company_name: ''
company_address: ''
company_city: ''
company_state: ''
company_zip: ''
company_country: ''
company_email: ''
company_phone: ''
company_tax_id: 33BBBBBB0000A1Z5
```
DB query confirming the real source values that should have been inherited:
```
name: plugin_redmineflux_workload
value: ---
allow_workload_overload: '1'
working_hours_per_day: '9'

name: plugin_redmineflux_invoice
value: --- !ruby/hash:ActiveSupport::HashWithIndifferentAccess
...
company_name: Testers Pvt. Ltd.
...
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Severity note

Raised from initial assessment (blank-field display issue) to **High** after confirming via live two-directional testing (see "C." above) that there is no synchronization mechanism at all — this directly contradicts the ticket's core "Company Identity ... Invoice, Helpdesk and Testcase all need the same values" consolidation claim, and means any admin relying on the "Currently inherited from..." hint text to understand the real, currently-effective value is being actively misled once any value diverges.

## Production report

Reported to production 2026-09-29 as **#121551** (project `ztflux`, tracker Bug, Priority High, Defect Type Functional, Defect Severity High-severity, Defect priority High, assigned Prashant Chaurasia). Linked via `report_defect` to testcase **#121476** (`Cross-Plugin Consistency`, Feature #120043) / Run #586 / environment `Win + Chrome + Ver6`; testcase result marked Failed with defect #121551 attached (in addition to #121548 from BUG-PLT-007, both on the same testcase).

## Closed 2026-09-30

Retested — confirmed FIXED as originally reported. Both "Working hours per day" and "Company name" now correctly pre-fill with the resolved value from the source plugin (`9.0` from Workload, `Testers Pvt. Ltd.` from Invoice), and the Company Name hint now shows the value in parens too, matching the Working Hours pattern. Noted and accepted the dev's explicit scope decision that reverse write-back (Platform → Workload/Invoice) was not implemented — flagged as separate future work if wanted, not a defect against this bug's own reported scope (which only asked that Platform correctly display/read the source's value). Production issue #121551 updated: In QA → Done, 100%.
