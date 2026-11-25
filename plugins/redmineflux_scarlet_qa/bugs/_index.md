# Bug Index — Redmineflux Scarlet

| Bug ID | Title | Status | Severity | Redmine Version | File Path |
|--------|-------|--------|----------|-----------------|-----------|
| BUG-RSC-001 | Theme asset activity.css returns 404 on every page | Open | Medium | 6.1.2.stable.24650 | bugs/open/BUG-RSC-001.md |
| BUG-RSC-002 | JavaScript error — identifier 'lastJstPreviewed' already declared on pages with rich text editor | Open | Medium | 6.1.2.stable.24650 | bugs/open/BUG-RSC-002.md |
| BUG-RSC-003 | Priority icon SVG assets missing (404) on issues list — priority indicators not displayed | Open | High | 6.1.2.stable.24650 | bugs/open/BUG-RSC-003.md |
| BUG-RSC-004 | Tribute mention library bound twice to textarea on pages with rich text editor | Open | Low | 6.1.2.stable.24650 | bugs/open/BUG-RSC-004.md |
| BUG-RSC-005 | Plugin's own "Auto-install theme on plugin load" never runs — `config/initializers/theme_installer.rb` is never `require`d by `init.rb`, so the Scarlet theme never appears in the Theme dropdown on a fresh install without manually running `rake redmineflux_scarlet:install_theme`. Found while testing the new Helpdesk UI redesign's "accent colour under Scarlet" requirement — once manually installed, the theme and its orange accent colour both work correctly. | Open | Medium | 6 (local, helpdesk-redmine6) | bugs/open/BUG-RSC-005.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
