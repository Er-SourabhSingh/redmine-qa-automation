# Features List — Redmineflux Mentions Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/mentions-plugin/ (official knowledge base, ingested
> 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Plugin installation | ZIP into `plugins/` (folder name unchanged), `bundle install`, `redmine:plugins:migrate`, restart | TC-MEN-019 – 104 |
| 2 | Asset precompile recovery | `rake assets:precompile` + restart when CSS/JS fail to load | TC-MEN-021 |
| 3 | Version compatibility | Redmine 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x | TC-MEN-022 |
| 4 | Plugin configuration page | Administration → Plugins → Configure | TC-MEN-023 |
| 5 | Mention symbol selection | Choose from `@`, `$`, `:`, `~`, `!`, `%` | TC-MEN-024 – 108, 114 – 116 |
| 6 | Restart-to-apply behaviour | KB states a restart is needed for the symbol change to take effect | TC-MEN-025 |
| 7 | Mention in issue description | Symbol + username inside the description text area | TC-MEN-036, 203, 205 |
| 8 | Mention in issue notes | Symbol + username inside Add notes | TC-MEN-037, 206 |
| 9 | Multiple mentions in one save | Several users referenced in a single description or note | TC-MEN-042 |
| 10 | Mention rendering | The saved mention renders as a recognisable reference to the user | TC-MEN-039 |
| 11 | User lookup by account name | Users are matched on their account name; KB claims no character restriction | TC-MEN-043, 213 – 215 |
| 12 | Autocomplete / user picker | Suggestion list after typing the symbol *(to confirm — the KB never states one exists)* | TC-MEN-044 |
| 13 | Mention in wiki content | Same syntax on a wiki page | TC-MEN-070 – 305 |
| 14 | Wiki module prerequisite | Wiki must be enabled in Project Settings → Modules | TC-MEN-070, 306 |
| 15 | Email notification on mention | Mentioned users are emailed when the content is saved | TC-MEN-001 – 407 |
| 16 | Notification opt-out | Mention emails can be disabled via the email notification settings | TC-MEN-008 – 410 |
| 17 | Mentions as informal assignment | KB FAQ presents mentioning as a way to indicate responsibility | Covered behaviourally by TC-MEN-001 |
| 18 | Uninstallation | Migrate `VERSION=0`, delete the directory, restart | TC-MEN-035 |
| 19 | Permission boundaries | Who may mention, and whether a mention can expose hidden content | TC-MEN-058 – 910 |

## Notes

- **Not yet executed.** Every TC above was authored 2026-09-15 from the vendor KB; none has been run. The
  "Covered by TC" column records intended coverage, not confirmed behaviour.
- **Feature 12 (autocomplete) is an inference, not a KB claim.** The KB describes typing the symbol followed by a
  username and never mentions a picker. TC-MEN-044 is written to *determine* whether one exists rather than to
  assert it does. If there is no autocomplete, that is a documented limitation, not a defect.
- **Feature 15 is the plugin's core value and the hardest to test.** It needs a working mail path. The repo has a
  local Postfix/Dovecot/Roundcube stack on domain `test.local` with webmail at `127.0.0.1:8081` for exactly this;
  check Settings → General → "Host name and path" first or the links inside the emails will be wrong.
- **The highest-risk untested question** is whether mentioning a user grants or implies access to content they
  cannot otherwise see — for example mentioning a non-member on an issue in a private project and mailing them
  its subject and body. The KB says nothing about it. TC-MEN-062 and TC-MEN-063 exist to answer it, and a leak
  there would be High or Critical.
- The KB's own troubleshooting section flags conflicts with plugins that "interfere with the inline editing
  feature"; test a mention typed through the Inline Editor plugin's note field specifically (TC-MEN-041).
