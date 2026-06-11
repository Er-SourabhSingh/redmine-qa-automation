# Plugin Memory — Redmineflux Advanced Field

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- **Custom field format change resets form:** Setting the format dropdown via JS triggers a re-render that clears the Name field. Use two-step pattern: (1) set format + dispatch change, (2) wait 1s, (3) fill name and other fields in a separate evaluate call.

- **Formula delete via Rails.ajax returns error but deletes successfully:** `Rails.ajax({ type: 'DELETE', ... })` triggers the error callback (server responds with a redirect that XHR interprets as error) but the server-side deletion succeeds. Verify by refreshing the page after the call.

- **Sequence form fields use `sequence_config[...]` prefix:** Not `sequence[...]`. Field IDs: `#rf_af_sequence_target_field`, `#sequence_config_tracker_id`, `#sequence_config_pad_digits`, `#sequence_config_project_select`. No separate format input — format is always `{YYYY-MM}-{NNN}` by default.

- **Dependency rules: only one rule per parent+child field pair (BUG-RAF-001):** The plugin enforces a single rule per Parent Field + Child Field combination regardless of parent value. This is a confirmed bug blocking multi-value dependency configuration.

- **Visibility SHOW rule does not auto-hide field by default:** SHOW rules make a field visible when the trigger condition is met (acting as a restore from hidden state). HIDE rules hide the field. The field is visible by default — a SHOW rule alone does not create a default-hidden behavior.

- **Formula fields appear twice in issue journal:** When formulas run and changes are logged to history, each formula-calculated field appears as two separate entries in the same journal update. Root cause unclear (possible double-write in plugin's journal hooks). Not yet filed as a bug.

- **Formulas with Integer target + float result cause BUG-RAF-002:** Client-side JS computes float values and writes them to disabled Integer custom field inputs. On form submit, Rails rejects "1.0" as not a valid integer. Always use Float type for formula target fields.

## Confirmed Working

- All 9 formula types calculate correctly on issue create and edit: Add, Subtract, Multiply, Divide, Date Diff (minutes), Date Diff (hours), Condition GT, Condition LT, Condition EQ.
- Log to history records old → new values for formula fields when enabled.
- Sequence auto-generates `YYYY-MM-NNN` format on issue creation, counter increments per issue, 3-digit zero-padding maintained.
- Sequence scope by tracker works: Bug-only rule generates IDs only for Bug tracker issues.
- Dependency filtering works: setting parent field value dynamically filters child field dropdown without page reload.
- Visibility HIDE rule hides field immediately on trigger; restores on non-matching value.
- All four features (Formula, Dependency, Sequence, Visibility) work simultaneously without conflict (verified in TC-RAF-044).

## Recurring Issues

- Rails UJS `data-method="delete"` links do not navigate correctly when `window.confirm` is overridden — they fall through to GET navigation. Use `Rails.ajax({ type: 'DELETE', ... })` instead, and verify deletion by reloading the list page.

## Environment Notes

- Forge URL: https://flux-f6ezm2x8v49.forge.zehntech.com
- Redmine: 6.0.9.stable | Plugin: redmineflux_advanced_fields 0.1.0
- Custom field IDs (Advanced Fields Demo project):
  - 9: Downtime (minutes) [Float]
  - 10: Incident Start Time [Date & Time]
  - 11: Incident Resolution Time [Date & Time]
  - 12: Department [List]
  - 13: Location [List, 9 values]
  - 14: Incident ID [Text/Sequence]
  - 15: Estimate [Float]
  - 16: Extra Hours [Float]
  - 17: Total Hours [Float, formula target]
  - 18: Duration (hours) [Float, formula target]
  - 19: Subtract Result [Float, formula target — deleted after TC-RAF-034]
  - 20: Multiply Result [Float, formula target — deleted after TC-RAF-034]
  - 21: Divide Result [Float, formula target — deleted after TC-RAF-034]
  - 22: Condition GT Result [Float, formula target — deleted after TC-RAF-034]
  - 23: Condition LT Result [Float, formula target — deleted after TC-RAF-034]
  - 24: Condition EQ Result [Float, formula target — deleted after TC-RAF-034]
  - 25: Environment [List]
  - 26: Components [List]
- Active formulas after teardown: Downtime (ID 4), Duration (ID 5), Total Hours (ID 6)
- Active sequence rule: Incident ID, All Trackers, {YYYY-MM}-{NNN}, Pad 3
- Active dependency rule: Department=IT → Location (Server Room, Data Center, CRM)
- Active visibility rules: Environment=Production → Show Components; Environment=Development → Hide Components
- Sequence counter last value: 2026-05-008 (issue #283)
